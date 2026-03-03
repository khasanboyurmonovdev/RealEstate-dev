// Phase 4 Task 9b
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class DeviceLoggerMiddleware implements NestMiddleware {
	private logger = new Logger('DeviceLogger');

	use(req: Request, res: Response, next: NextFunction) {
		const deviceType = req.headers['x-device-type'] || 'unknown';
		const path = req.path;

		// Log all GraphQL requests that carry a device type header
		if (path.includes('/graphql') && req.headers['x-device-type']) {
			this.logger.debug(`[${String(deviceType).toUpperCase()}] ${req.method} ${path}`);
		}
		next();
	}
}
