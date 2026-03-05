// Phase 4 Task 9b
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PropertyService } from './property.service';
import { Properties, Property } from '../../libs/dto/property/property';
import {
	AgentPropertiesInquiry,
	AllPropertiesInquiry,
	OrdinaryInquiry,
	PropertiesInquiry,
	PropertyInput,
} from '../../libs/dto/property/property.input';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { ObjectId } from 'mongoose';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { WithoutGuard } from '../auth/guards/without.guard';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { PropertyUpdate } from '../../libs/dto/property/porperty.update';
import {
	VerifyPropertyInput,
	RejectPropertyInput,
	FlagPropertyInput,
} from '../../libs/dto/property/property.verification';
import { AuthGuard } from '../auth/guards/auth.guard';
import { GetDeviceType, DeviceType } from '../../libs/decorators/device-type.decorator';

@Resolver()
export class PropertyResolver {
	constructor(private readonly propertyService: PropertyService) {}

	@Roles(MemberType.USER, MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation(() => Property)
	public async createProperty(
		@Args('input') input: PropertyInput,
		@AuthMember('_id') ownerId: ObjectId,
	): Promise<Property> {
		console.log('Mutation: createPropety');
		return await this.propertyService.createProperty(ownerId, input);
	}

	@UseGuards(WithoutGuard)
	@Query((returns) => Property)
	public async getProperty(
		@Args('propertyId', { type: () => ID }) propertyId: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Property> {
		console.log('Query: getProperty');
		const id = shapeIntoMongoObjectId(propertyId);
		return await this.propertyService.getProperty(memberId, id);
	}

	@Roles(MemberType.USER, MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation((returns) => Property)
	public async updateProperty(
		@Args('input') input: PropertyUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Property> {
		console.log('Mutation: updateProperty');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.propertyService.updateProperty(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query((returns) => Properties)
	public async getProperties(
		@Args('input') input: PropertiesInquiry,
		@AuthMember('_id') memberId: ObjectId,
		@GetDeviceType() deviceType: DeviceType,
	): Promise<Properties> {
		console.log('Query: getProperties');
		return await this.propertyService.getProperties(memberId, input, deviceType);
	}

	@UseGuards(AuthGuard)
	@Query((returns) => Properties)
	public async getFavorites(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Properties> {
		console.log('Query: getFavorites');
		return await this.propertyService.getFavorites(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query((returns) => Properties)
	public async getVisited(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Properties> {
		console.log('Query: getVisited');
		return await this.propertyService.getVisited(memberId, input);
	}

	@Roles(MemberType.USER, MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Query((returns) => Properties)
	public async getAgentProperties(
		@Args('input') input: AgentPropertiesInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Properties> {
		console.log('Query: getAgentProperties');
		return await this.propertyService.getAgentProperties(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Property)
	public async likeTargetProperty(
		@Args('propertyId', { type: () => ID }) propertyId: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Property> {
		console.log('Mutation: likeTargetProperty');
		const likeRefId = shapeIntoMongoObjectId(propertyId);
		return await this.propertyService.likeTargetProperty(memberId, likeRefId);
	}
	/** ADMIN **/

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query((returns) => Properties)
	public async getAllPropertiesByAdmin(
		@Args('input') input: AllPropertiesInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Properties> {
		console.log('Query: getAllPropertiesByAdmin');
		return await this.propertyService.getAllPropertiesByAdmin(input);
	}

	@Query(() => [Property])
	public async getSimilarProperties(
		@Args('propertyId', { type: () => String }) propertyId: string,
	): Promise<Property[]> {
		return this.propertyService.getSimilarProperties(propertyId);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation((returns) => Property)
	public async updatePropertyByAdmin(
		@Args('input') input: PropertyUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Property> {
		console.log('Mutation: updatePropertyByAdmin');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.propertyService.updatePropertyByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation((returns) => Property)
	public async removePropertyByAdmin(
		@Args('propertyId', { type: () => ID }) propertyId: string,
	): Promise<Property> {
		console.log('Mutation: removePropertyByAdmin');
		const id = shapeIntoMongoObjectId(propertyId);
		return await this.propertyService.removePropertyByAdmin(id);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Property)
	public async verifyProperty(
		@Args('input') input: VerifyPropertyInput,
		@AuthMember('_id') adminId: ObjectId,
	): Promise<Property> {
		console.log('Mutation: verifyProperty');
		const propertyId = shapeIntoMongoObjectId(input.propertyId);
		return await this.propertyService.verifyProperty(propertyId, adminId);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Property)
	public async rejectProperty(
		@Args('input') input: RejectPropertyInput,
		@AuthMember('_id') adminId: ObjectId,
	): Promise<Property> {
		console.log('Mutation: rejectProperty');
		const propertyId = shapeIntoMongoObjectId(input.propertyId);
		return await this.propertyService.rejectProperty(propertyId, input.reason, adminId);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Property)
	public async flagForReview(
		@Args('input') input: FlagPropertyInput,
	): Promise<Property> {
		console.log('Mutation: flagForReview');
		const propertyId = shapeIntoMongoObjectId(input.propertyId);
		return await this.propertyService.flagForReview(propertyId);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Property)
	public async reactivateListing(
		@Args('propertyId', { type: () => ID }) propertyId: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Property> {
		console.log('Mutation: reactivateListing');
		const id = shapeIntoMongoObjectId(propertyId);
		return await this.propertyService.reactivateListing(id, memberId);
	}
}
