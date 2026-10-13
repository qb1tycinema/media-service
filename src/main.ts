import "@/observability/tracing"

import { Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { NestFactory } from "@nestjs/core"

import { AppModule } from "./app.module"
import type { AllConfigs } from "./config"
import { createGrpcServer } from "./infrastructure/grpc"

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	const config = app.get(ConfigService<AllConfigs>)
	const logger = new Logger()

	const httpPort = config.get("http.port", { infer: true })
	const environemt = config.get("environemt.env", { infer: true })

	createGrpcServer(app, config)

	app.enableShutdownHooks()

	await app.startAllMicroservices()

	await app.listen(httpPort)
	logger.log(`HTTP listening on ${httpPort}`, "Bootstrap")
	logger.log(`🚀 Starting media-service in ${environemt} mode`, "Bootstrap")
}
bootstrap()
