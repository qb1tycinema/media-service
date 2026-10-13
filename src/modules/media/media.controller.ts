import { Controller } from "@nestjs/common"
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices"
import type {
	DeleteRequest,
	DeleteResponse,
	UploadRequest,
	UploadResponse
} from "@qb1tycinema/contracts/gen/media"
import type { Observable } from "rxjs"

import { DeleteUseCase } from "./usecases/delete.usecase"
import { UploadUseCase } from "./usecases/upload.usecase"

@Controller()
export class MediaController {
	public constructor(
		private readonly uploadUseCase: UploadUseCase,
		private readonly deleteUseCase: DeleteUseCase
	) {}

	@GrpcStreamMethod("MediaService", "Upload")
	public upload(data: Observable<UploadRequest>): Promise<UploadResponse> {
		return this.uploadUseCase.execute(data)
	}

	@GrpcMethod("MediaService", "Delete")
	public delete(data: DeleteRequest): Promise<DeleteResponse> {
		return this.deleteUseCase.execute(data)
	}
}
