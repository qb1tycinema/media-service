import { registerAs } from "@nestjs/config"
import { validateEnv } from "@qb1tycinema/common"

import type { JaegerConfig } from "../interfaces/jaeger.interface"
import { JaegerValidator } from "../validator"

export const jaegerEnv = registerAs<JaegerConfig>("jaeger", () => {
	validateEnv(process.env, JaegerValidator)

	return {
		jaegerUrl: process.env.JAEGER_URL
	}
})
