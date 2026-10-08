import { registerAs } from "@nestjs/config"
import { validateEnv } from "@qb1tycinema/common"

import type { EnvironemtConfig } from "../interfaces/environemt.interface"
import { EnvironemtValidator } from "../validator"

export const environemtEnv = registerAs<EnvironemtConfig>("environemt", () => {
	const validated = validateEnv(process.env, EnvironemtValidator)

	return {
		environemt: validated.NODE_ENV
	}
})
