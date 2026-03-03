import { registerEnumType } from '@nestjs/graphql';

export enum PropertyType {
	APARTMENT = 'apartment',
	NEW_BUILDING = 'new_building',
	SECONDARY = 'secondary',
	HOUSE = 'house',
	COMMERCIAL = 'commercial',
	ROOM = 'room',
}
registerEnumType(PropertyType, {
	name: 'PropertyType',
});

export const PropertyTypeValues = Object.values(PropertyType);

export enum ListingType {
	RENT = 'RENT',
	SALE = 'SALE',
}
registerEnumType(ListingType, {
	name: 'ListingType',
});

export const ListingTypeValues = Object.values(ListingType);

export enum City {
	TASHKENT = 'tashkent',
	SAMARKAND = 'samarkand',
	BUKHARA = 'bukhara',
	ANDIJAN = 'andijan',
	FERGANA = 'fergana',
	NAMANGAN = 'namangan',
	QOQON = 'qoqon',
	QARSHI = 'qarshi',
	JIZZAX = 'jizzax',
	TERMIZ = 'termiz',
	NUKUS = 'nukus',
}
registerEnumType(City, {
	name: 'City',
});

export const CityValues = Object.values(City);

export enum District {
	CHILONZOR = 'chilonzor',
	YUNUSABAD = 'yunusabad',
	MIRZO_ULUGBEK = 'mirzo_ulugbek',
	SERGELI = 'sergeli',
	YAKKASAROY = 'yakkasaroy',
	SHAYKHONTOHUR = 'shaykhontohur',
	OLMAZOR = 'olmazor',
	UCHTEPA = 'uchtepa',
	BEKTEMIR = 'bektemir',
	YASHNOBOD = 'yashnobod',
}
registerEnumType(District, {
	name: 'District',
});

export const DistrictValues = Object.values(District);

export enum BuildingType {
	NEW_BUILDING = 'new_building',
	SECONDARY = 'secondary',
}
registerEnumType(BuildingType, {
	name: 'BuildingType',
});

export const BuildingTypeValues = Object.values(BuildingType);

export enum Renovation {
	SIMPLE = 'simple',
	EURO = 'euro',
	LUXURY = 'luxury',
}
registerEnumType(Renovation, {
	name: 'Renovation',
});

export const RenovationValues = Object.values(Renovation);

export enum PropertyStatus {
	ACTIVE = 'ACTIVE',
	SOLD = 'SOLD',
	RENTED = 'RENTED',
	BLOCKED = 'BLOCKED',
	DELETE = 'DELETE',
	EXPIRED = 'EXPIRED',
}
registerEnumType(PropertyStatus, {
	name: 'PropertyStatus',
});

export const PropertyStatusValues = Object.values(PropertyStatus);
