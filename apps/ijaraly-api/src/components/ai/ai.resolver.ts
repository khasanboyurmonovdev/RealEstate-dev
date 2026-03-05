import { Resolver, Query, Args } from '@nestjs/graphql';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AiService } from './ai.service';
import { AiSearchResult, AiSummaryResult } from '../../libs/dto/ai/ai.dto';

@Resolver()
export class AiResolver {
  constructor(
    private readonly aiService: AiService,
    @InjectModel('Property') private readonly propertyModel: Model<any>,
  ) {}

  @Query(() => AiSearchResult)
  async aiSearch(
    @Args('query', { type: () => String }) query: string,
  ): Promise<AiSearchResult> {
    return this.aiService.parseSearchQuery(query);
  }

  @Query(() => AiSummaryResult)
  async getPropertyAiSummary(
    @Args('propertyId', { type: () => String }) propertyId: string,
  ): Promise<AiSummaryResult> {
    const property = await this.propertyModel.findById(propertyId).lean().exec();
    if (!property) return { uz: 'E\'lon topilmadi.', ru: 'Объявление не найдено.' };
    return this.aiService.generatePropertySummary(property);
  }
}
