import { registerAs } from "@nestjs/config"
import { validateEnv } from "@qb1tycinema/common"

import type { StorageConfig } from "../interfaces/storage.interface"
import { StorageValidator } from "../validator"

export const storageEnv = registerAs<StorageConfig>("storage", () => {
	validateEnv(process.env, StorageValidator)

	return {
		bucket: process.env.S3_BUCKET,
		region: process.env.S3_REGION,
		accessKey: process.env.S3_ACCESS_KEY,
		secretKey: process.env.S3_SECRET_KEY,
		publicUrl: process.env.S3_PUBLIC_URL
	}
})
