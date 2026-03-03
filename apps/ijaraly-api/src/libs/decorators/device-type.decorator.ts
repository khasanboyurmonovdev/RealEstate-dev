// Phase 4 Task 9b
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export const GetDeviceType = createParamDecorator(
	(data: unknown, ctx: ExecutionContext): DeviceType => {
		let request: any;

		if (ctx.getType<GqlContextType>() === 'graphql') {
			const gqlCtx = GqlExecutionContext.create(ctx);
			request = gqlCtx.getContext().req;
		} else {
			request = ctx.switchToHttp().getRequest();
		}

		const header = request?.headers?.['x-device-type'];

		if (header === 'mobile') return 'mobile';
		if (header === 'tablet') return 'tablet';
		return 'desktop'; // safe default when header is absent
	},
);
