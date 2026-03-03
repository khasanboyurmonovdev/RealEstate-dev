import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { BoardArticleService } from './board-article.service';
import { BoardArticle, BoardArticles } from '../../libs/dto/board-article/board-article';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AllBoardArticlesInquiry, BoardArticleInput, BoardArticlesInquiry } from '../../libs/dto/board-article/board-article.input';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { WithoutGuard } from '../auth/guards/without.guard';
import { BoardArticleUpdate } from '../../libs/dto/board-article/board-article.update';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';

@Resolver()
export class BoardArticleResolver {
    constructor(private readonly boardArticleServic: BoardArticleService) {}

    @UseGuards(AuthGuard)
    @Mutation((returns) => BoardArticle)
    public async createBoardArticle(
        @Args('input') input: BoardArticleInput, 
        @AuthMember('_id') memberId: ObjectId
    ): Promise<BoardArticle> {
        console.log('Mutation: createBoardArticle');
        return await this.boardArticleServic.createBoardArticle(memberId, input);
    }

    @UseGuards(WithoutGuard)
    @Query((returns) => BoardArticle)
    public async getBoardArticle(
        @Args('articleId') input: string, 
        @AuthMember('_id') memberId: ObjectId
    ): Promise<BoardArticle> {
        console.log('Query: getBoardArticle');
        const articleId = shapeIntoMongoObjectId(input);
        return await this.boardArticleServic.getBoardArticle(memberId, articleId);
    }

    @UseGuards(AuthGuard)
    @Mutation((returns) => BoardArticle)
    public async updateBoardArticle(
        @Args('input') input: BoardArticleUpdate, 
        @AuthMember('_id') memberId: ObjectId
    ): Promise<BoardArticle> {
        console.log('Mutation: updateBoardArticle');
        input._id = shapeIntoMongoObjectId(input._id);
        return await this.boardArticleServic.updateBoardArticle(memberId, input);
    }

    @UseGuards(WithoutGuard)
    @Query((returns) => BoardArticles)
    public async getBoardArticles(
        @Args('input') input: BoardArticlesInquiry, 
        @AuthMember('_id') memberId: ObjectId
    ): Promise<BoardArticles> {
        console.log('Query: getBoardArticles');
        return await this.boardArticleServic.getBoardArticles(memberId, input);
    }

    @UseGuards(AuthGuard)
    @Mutation(() => BoardArticle)
    public async likeTargetBoardArticle(
        @Args('articleId') input: string, 
        @AuthMember('_id') memberId: ObjectId
    ): Promise<BoardArticle> {
        console.log('Mutation: likeTargetBoardArticle');
        const likeRefId = shapeIntoMongoObjectId(input);
        return await this.boardArticleServic.likeTargetBoardArticle(memberId, likeRefId);
    }
    /** ADMIN */

    @Roles(MemberType.ADMIN)
    @UseGuards(RolesGuard)
    @Query((returns) => BoardArticles)
    public async getAllBoardArticlesByAdmin(
        @Args('input') input: AllBoardArticlesInquiry, 
        @AuthMember('_id') memberId: ObjectId
    ): Promise<BoardArticles> {
        console.log('Query: getAllBoardArticleByAdmin');
        return await this.boardArticleServic.getAllBoardArticlesByAdmin(input);
    }

    @Roles(MemberType.ADMIN)
    @UseGuards(RolesGuard)
    @Mutation((returns) => BoardArticle)
    public async updateBoardArticleByAdmin(
        @Args('input') input: BoardArticleUpdate, 
        @AuthMember('_id') memberId: ObjectId
    ): Promise<BoardArticle> {
        console.log('Query: updateBoardArticleByAdmin');
        input._id = shapeIntoMongoObjectId(input._id);
        return await this.boardArticleServic.updateBoardArticleByAdmin(input);
    }

    @Roles(MemberType.ADMIN)
    @UseGuards(RolesGuard)
    @Mutation((returns) => BoardArticle)
    public async removeBoardArticleByAdmin(
        @Args('articleId') input: string, 
        @AuthMember('_id') memberId: ObjectId
    ): Promise<BoardArticle> {
        console.log('Query: removeBoardArticleByAdmin');
        const articleId = shapeIntoMongoObjectId(input);
        return await this.boardArticleServic.removeBoardArticleByAdmin(articleId)
    }
}
