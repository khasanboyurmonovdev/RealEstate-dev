import { Module } from '@nestjs/common';
import { CommentResolver } from './comment.resolver';
import { CommentService } from './comment.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ViewModule } from '../view/view.module';
import { MemberModule } from '../member/member.module';
import CommentSchema from '../../schemas/Comment.model';

@Module({
  imports: [
    MongooseModule.forFeature([{
      name: "Comments",
       schema: 
       CommentSchema
      }]),
     AuthModule,
     ViewModule,
     MemberModule
  ],
  providers: [CommentResolver, CommentService]
})
export class CommentModule {}
