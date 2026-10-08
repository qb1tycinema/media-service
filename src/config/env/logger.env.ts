import { registerAs } from "@nestjs/config"
import { validateEnv } from "@qb1tycinema/common"

import type { LoggerConfig } from "../interfaces/logger.interface"
import { LoggerValidator } from "../validator"

export const loggerEnv = registerAs<LoggerConfig>("logger", () => {
	validateEnv(process.env, LoggerValidator)

	return {
		level: process.env.LOGGER_LEVEL
	}
})
