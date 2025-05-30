import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { AppResolver } from './app.resolver';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ComponentsModule } from './components/components.module';
import { DatabaseModule } from './database/database.module';
import { T } from './libs/types/common';
import { SocketModule } from './socket/socket.module';

@Module({
	imports: [
		ConfigModule.forRoot(),
		GraphQLModule.forRoot({
			driver: ApolloDriver,
			playground: true,
			uploads: false,
			autoSchemaFile: true,
			// configuration
			formatError: (error: T) => {
				console.log('Error:', error);
				const garphQLFormattedError = {
					code: error?.extensions.code,
					message:
						error?.extensions?.exception?.response?.message || error?.extensions?.response?.message || error?.message,
				};
				console.dir(error, { depth: null });
				console.log('GRAPHQL GLOBAL ERROR:', garphQLFormattedError);
				return garphQLFormattedError;
			},
		}),
		EventEmitterModule.forRoot(),
		ComponentsModule,
		DatabaseModule,
		SocketModule,
	],
	controllers: [AppController],
	providers: [AppService, AppResolver],
})
export class AppModule {}
