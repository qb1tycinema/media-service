import { registerAs } from "@nestjs/config"
import { validateEnv } from "@qb1tycinema/common"

import type { GrpcConfig } from "../interfaces/grpc.interface"
import { GrpcValidator } from "../validator"

export const grpcEnv = registerAs<GrpcConfig>("grpc", () => {
	validateEnv(process.env, GrpcValidator)

	return {
		host: process.env.GRPC_HOST,
		port: parseInt(process.env.GRPC_PORT),
		accountUrl: process.env.ACCOUNT_GRPC_URL
	}
})
