import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { AiSearchResult } from '../../libs/dto/ai/ai.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async parseSearchQuery(query: string): Promise<AiSearchResult> {
    const systemPrompt = `You are a property search parser for Ijaraly — a real estate platform in Uzbekistan.
Your job: extract structured property search filters from natural language queries in Uzbek, Russian, or English.

Return ONLY valid JSON. No explanation, no markdown, no backticks.

JSON schema:
{
  "districts": string[] | null,
  "cities": string[] | null,
  "listingType": string | null,
  "propertyType": string | null,
  "priceMin": number | null,
  "priceMax": number | null,
  "rooms": number[] | null,
  "text": string | null
}

Valid districts: chilonzor, yunusabad, mirzo_ulugbek, sergeli, yakkasaroy, shaykhontohur, olmazor, uchtepa, bektemir, yashnobod
Valid cities: tashkent, samarkand, bukhara, andijan, fergana, namangan, qoqon, qarshi, jizzax, termiz, nukus
Valid listingType values: LONG_RENT, SHORT_STAY, SALE
Valid propertyType values: APARTMENT, HOUSE, ROOM, COMMERCIAL, LAND

Rules:
- If a field cannot be determined, set it to null — never guess
- Uzbek: "ijaraga" or "ijara" → LONG_RENT, "kunlik" → SHORT_STAY, "sotib olish/sotiladi" → SALE
- Russian: "аренда/снять" → LONG_RENT, "посуточно" → SHORT_STAY, "купить/продажа" → SALE
- "xona" or "комната" refers to rooms count — "2 xonali" → rooms: [2]
- Price: "million" = 1_000_000 UZS, "mlrd" = 1_000_000_000 UZS
- District aliases: "чиланзар/Chilonzor" → chilonzor, "Юнусабад/yunusobod" → yunusabad, "Мирзо Улугбек" → mirzo_ulugbek
- If multiple districts mentioned, include all of them
- If the query is too vague, put the original text in "text" field`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0,
        max_tokens: 300,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
      });

      const raw = response.choices[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(raw);
      return this.sanitize(parsed);
    } catch (err) {
      this.logger.error('AI search parse failed', err);
      return { text: query };
    }
  }

  async generatePropertySummary(property: any): Promise<{ uz: string; ru: string }> {
    const details = `
Title: ${property.propertyTitle}
Price: ${property.propertyPrice} UZS
District: ${property.district}
City: ${property.city}
Type: ${property.propertyType ?? 'APARTMENT'}
Listing: ${property.listingType ?? 'LONG_RENT'}
Rooms: ${property.propertyRooms ?? 'unknown'}
Square: ${property.propertySquare ?? 'unknown'} m²
Description: ${property.propertyDesc ?? 'none'}
    `.trim();

    const prompt = `You are a real estate listing assistant for Ijaraly, a property platform in Uzbekistan.
Given this property data, write a 2-sentence plain-language summary in both Uzbek and Russian.
Be natural, warm, and informative. Mention the district, price, and key features.

Return ONLY valid JSON in this exact format, no markdown, no backticks:
{"uz": "Uzbek summary here.", "ru": "Russian summary here."}

Property data:
${details}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      });

      const raw = response.choices[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(raw);

      return {
        uz: typeof parsed.uz === 'string' ? parsed.uz : 'Ma\'lumot mavjud emas.',
        ru: typeof parsed.ru === 'string' ? parsed.ru : 'Информация недоступна.',
      };
    } catch (err) {
      this.logger.error('AI summary generation failed', err);
      return {
        uz: 'Bu e\'lon haqida qo\'shimcha ma\'lumot mavjud emas.',
        ru: 'Дополнительная информация об этом объявлении недоступна.',
      };
    }
  }

  async scoreFakeListing(property: any): Promise<{ score: number; reasons: string[]; flagged: boolean }> {
    const details = `
Title: ${property.propertyTitle}
Price: ${property.propertyPrice} UZS
District: ${property.district}
City: ${property.city}
Type: ${property.propertyType ?? 'APARTMENT'}
Listing: ${property.listingType ?? 'LONG_RENT'}
Rooms: ${property.propertyRooms ?? 'unknown'}
Square: ${property.propertySquare ?? 'unknown'} m²
Description: ${property.propertyDesc ?? 'none'}
Images count: ${property.images?.length ?? 0}
    `.trim();

    const prompt = `You are a fake listing detector for Ijaraly, a real estate platform in Uzbekistan.
Analyze this property listing and return a suspicion score from 0 to 100.
0 = definitely real, 100 = definitely fake.

Check for these signals:
- Unrealistically low price for the district (e.g. 100,000 UZS/month for Yunusabad apartment)
- Vague or missing description
- Generic or suspicious title (e.g. "good apartment", "cheap house")
- No images (images count = 0)
- Price that is suspiciously round or unrealistic
- Description that looks copy-pasted or spammy

Return ONLY valid JSON, no markdown, no backticks:
{"score": number, "reasons": ["reason 1", "reason 2"]}

Property data:
${details}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0,
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      });

      const raw = response.choices[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(raw);

      const score = typeof parsed.score === 'number' ? Math.min(100, Math.max(0, parsed.score)) : 0;
      const reasons = Array.isArray(parsed.reasons) ? parsed.reasons : [];
      const flagged = score >= 70;

      return { score, reasons, flagged };
    } catch (err) {
      this.logger.error('Fake listing scoring failed', err);
      return { score: 0, reasons: [], flagged: false };
    }
  }

  private sanitize(parsed: any): AiSearchResult {
    const VALID_DISTRICTS = new Set(['chilonzor','yunusabad','mirzo_ulugbek','sergeli','yakkasaroy','shaykhontohur','olmazor','uchtepa','bektemir','yashnobod']);
    const VALID_CITIES = new Set(['tashkent','samarkand','bukhara','andijan','fergana','namangan','qoqon','qarshi','jizzax','termiz','nukus']);
    const VALID_LISTING_TYPES = new Set(['LONG_RENT','SHORT_STAY','SALE']);
    const VALID_PROPERTY_TYPES = new Set(['APARTMENT','HOUSE','ROOM','COMMERCIAL','LAND']);

    const result: AiSearchResult = {};

    if (Array.isArray(parsed.districts)) {
      const filtered = parsed.districts.filter((d: string) => VALID_DISTRICTS.has(d));
      if (filtered.length > 0) result.districts = filtered;
    }
    if (Array.isArray(parsed.cities)) {
      const filtered = parsed.cities.filter((c: string) => VALID_CITIES.has(c));
      if (filtered.length > 0) result.cities = filtered;
    }
    if (parsed.listingType && VALID_LISTING_TYPES.has(parsed.listingType)) {
      result.listingType = parsed.listingType;
    }
    if (parsed.propertyType && VALID_PROPERTY_TYPES.has(parsed.propertyType)) {
      result.propertyType = parsed.propertyType;
    }
    if (typeof parsed.priceMin === 'number' && parsed.priceMin > 0) {
      result.priceMin = parsed.priceMin;
    }
    if (typeof parsed.priceMax === 'number' && parsed.priceMax > 0) {
      result.priceMax = parsed.priceMax;
    }
    if (Array.isArray(parsed.rooms) && parsed.rooms.length > 0) {
      result.rooms = parsed.rooms.filter((r: any) => typeof r === 'number' && r > 0);
    }
    if (typeof parsed.text === 'string' && parsed.text.trim()) {
      result.text = parsed.text.trim();
    }

    return result;
  }
}
