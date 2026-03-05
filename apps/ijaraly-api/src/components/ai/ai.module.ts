import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiService } from './ai.service';
import { AiResolver } from './ai.resolver';
import PropertySchema from '../../schemas/Property.model';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Property', schema: PropertySchema }]),
  ],
  providers: [AiService, AiResolver],
  exports: [AiService],
})
export class AiModule {}
