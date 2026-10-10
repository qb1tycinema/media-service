import { Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { LoggerModule } from "nestjs-pino"

import {
	environemtEnv,
	grpcEnv,
	httpEnv,
	jaegerEnv,
	loggerEnv,
	storageEnv
} from "./config/env"
import { getPinoConfig } from "./config/loaders"
import { ObservabilityModule } from "./observability/observability.module"

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: [
				`.env.${process.env.NODE_ENV}.local`,
				`.env.${process.env.NODE_ENV}`,
				".env"
			],
			load: [
				environemtEnv,
				grpcEnv,
				httpEnv,
				jaegerEnv,
				loggerEnv,
				storageEnv
			]
		}),
		LoggerModule.forRootAsync({
			useFactory: getPinoConfig,
			inject: [ConfigService]
		}),
		ObservabilityModule
	]
})
export class AppModule {}
