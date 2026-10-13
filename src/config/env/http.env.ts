import { registerAs } from "@nestjs/config"
import { validateEnv } from "@qb1tycinema/common"

import type { HttpConfig } from "../interfaces/http.interface"
import { HttpValidator } from "../validator"

export const httpEnv = registerAs<HttpConfig>("http", () => {
	validateEnv(process.env, HttpValidator)

	return {
		port: parseInt(process.env.GRPC_PORT)
	}
})
