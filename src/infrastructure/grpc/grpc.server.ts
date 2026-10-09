import type { INestApplication } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { type MicroserviceOptions, Transport } from "@nestjs/microservices"

import { grpcLoader, grpcPackages, grpcProtoPaths } from "./grpc.options"
import type { AllConfigs } from "@/config"

export function createGrpcServer(
	app: INestApplication,
	config: ConfigService<AllConfigs>
) {
	const host = config.get("grpc.host", { infer: true })
	const port = config.get("grpc.port", { infer: true })

	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.GRPC,
		options: {
			package: grpcPackages,
			protoPath: grpcProtoPaths,
			url: `${host}:${port}`,
			loader: grpcLoader
		}
	})
}
