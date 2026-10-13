import { Injectable } from "@nestjs/common"
import type {
	DeleteRequest,
	DeleteResponse
} from "@qb1tycinema/contracts/gen/media"
import { PinoLogger } from "nestjs-pino"

import type { S3Service } from "@/infrastructure/storage/s3.service"

@Injectable()
export class DeleteUseCase {
	public constructor(
		private readonly s3Service: S3Service,
		private readonly logger: PinoLogger
	) {
		this.logger.setContext(DeleteUseCase.name)
	}

	public async execute(req: DeleteRequest): Promise<DeleteResponse> {
		try {
			await this.s3Service.delete(req.key)

			this.logger.info(`Deleted file: ${req.key}`)

			return { ok: true }
		} catch (err: any) {
			this.logger.error({ err }, `Failed to delete file: ${req.key}`)

			return { ok: false }
		}
	}
}
