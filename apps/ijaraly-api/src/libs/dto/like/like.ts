import { Field, ID, ObjectType } from '@nestjs/graphql';
import { LikeGroup } from '../../enums/like.enum';
import { ObjectId } from 'mongoose';

@ObjectType('MeLiked')
export class MeLiked {
	@Field(() => ID)
	memberId: ObjectId;

	@Field(() => ID)
	likeRefId: ObjectId;

	@Field(() => Boolean)
	myFavorite: boolean;
}

@ObjectType()
export class Like {
	@Field(() => ID)
	_id: ObjectId;

	@Field(() => LikeGroup)
	likeGroup: LikeGroup;

	@Field(() => ID)
	likeRefId: ObjectId;

	@Field(() => ID)
	memberId: ObjectId;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}


