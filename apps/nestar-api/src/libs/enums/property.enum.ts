import { registerEnumType } from '@nestjs/graphql';

export enum PropertyType {
	APARTMENT = 'APARTMENT',
	VILLA = 'VILLA',
	HOUSE = 'HOUSE',
}
registerEnumType(PropertyType, {
	name: 'PropertyType',
});

export enum PropertyStatus {
	ACTIVE = 'ACTIVE',
	SOLD = 'SOLD',
	DELETE = 'DELETE',
}
registerEnumType(PropertyStatus, {
	name: 'PropertyStatus',
});

export enum PropertyLocation {
	NEWYORK = 'NEWYORK',
	CHICAGO = 'CHICAGO',
	CALIFORNIA = 'CALIFORNIA',
	PENNSYLVANIA = 'PENNSYLVANIA',
	IOWA = 'IOWA',
	ATLANTA = 'ATLANTA',
	NEVADA = 'NEVADA',
	TEXAS = 'TEXAS',
	GEORGIA = 'GEORGIA',
}
registerEnumType(PropertyLocation, {
	name: 'PropertyLocation',
});
