import { Field, InputType } from "@nestjs/graphql";
import { ObjectId } from "mongoose";
import { ViewGroup } from "../../enums/view.enum";



@InputType()
export class ViewInput {

    @Field(() => ViewGroup)
    viewGroup: ViewGroup;

    @Field(() => String)
    viewRefId: ObjectId;

    @Field(() => String)
    memberId: ObjectId;

}