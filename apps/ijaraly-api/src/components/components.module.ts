import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { PropertyModule } from './property/property.module';
import { AuthModule } from './auth/auth.module';
import { CommentModule } from './comment/comment.module';
import { LikeModule } from './like/like.module';
import { ViewModule } from './view/view.module';
import { FollowModule } from './follow/follow.module';
import { BoardArticleModule } from './board-article/board-article.module';
import { NotificationModule } from './notification/notification.module';
import { NoticeModule } from './notice/notice.module';
import { ReportModule } from './report/report.module';
import { BookingModule } from './booking/booking.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { PaymentModule } from './payment/payment.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    MemberModule, 
    AuthModule, 
    PropertyModule, 
    BoardArticleModule,
    LikeModule, 
    ViewModule, 
    CommentModule, 
    FollowModule,
    NotificationModule,
    NoticeModule,
    ReportModule,
    BookingModule,
    SubscriptionModule,
    PaymentModule,
    AiModule,
  ],
})
export class ComponentsModule {}
