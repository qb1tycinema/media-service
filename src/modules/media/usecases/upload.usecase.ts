import { Injectable } from "@nestjs/common"
import { RpcException } from "@nestjs/microservices"
import { RpcStatus } from "@qb1tycinema/common"
import type {
	UploadMetadata,
	UploadRequest,
	UploadResponse
} from "@qb1tycinema/contracts/gen/media"
import { randomUUID } from "crypto"
import { PinoLogger } from "nestjs-pino"
import path from "path"
import { from, Observable } from "rxjs"
import { PassThrough } from "stream"

import { ImageProcessorService } from "@/infrastructure/images/image-processor.service"
import { S3Service } from "@/infrastructure/storage/s3.service"

@Injectable()
export class UploadUseCase {
	public constructor(
		private readonly s3Service: S3Service,
		private readonly imageProcessor: ImageProcessorService,
		private readonly logger: PinoLogger
	) {
		this.logger.setContext(UploadUseCase.name)
	}

	public execute(
		requestStream: Observable<UploadRequest>
	): Observable<UploadResponse> {
		return from(
			new Promise<UploadResponse>((resolve, reject) => {
				const passThrough = new PassThrough()

				let metadata: UploadMetadata | null = null
				let finalKey = ""
				let uploadPromise: Promise<void> | null = null

				requestStream.subscribe({
					next: (request: UploadRequest) => {
						try {
							if (request.metadata) {
								metadata = request.metadata
								finalKey = this.generateFileKey(metadata)
								uploadPromise = this.startUploadPipeline(
									finalKey,
									passThrough
								)
							} else if (request.chunkData) {
								this.processChunk(
									request.chunkData,
									metadata,
									passThrough
								)
							}
						} catch (error: any) {
							passThrough.destroy(error)

							if (error instanceof RpcException) {
								reject(error)
							} else {
								reject(
									new RpcException({
										code: RpcStatus.INTERNAL,
										details:
											error.message ||
											"Internal stream processing error"
									})
								)
							}
						}
					},
					error: (error: any) => {
						this.logger.error({ error }, "Client stream error")

						passThrough.destroy(error)

						reject(
							new RpcException({
								code: RpcStatus.CANCELLED,
								details: "Client closed the stream unexpectedly"
							})
						)
					},
					complete: () => {
						this.finalizeUpload(
							metadata,
							uploadPromise,
							passThrough,
							finalKey
						)
							.then(resolve)
							.catch(reject)
					}
				})
			})
		)
	}

	private generateFileKey(metadata: UploadMetadata): string {
		const parsedPath = path.parse(metadata.fileName)
		const cleanName = parsedPath.name.replace(/[^a-z0-9_-]/gi, "_")

		return `${metadata.folder}/${randomUUID()}-${cleanName}.webp`
	}

	private startUploadPipeline(
		key: string,
		passThrough: PassThrough
	): Promise<void> {
		this.logger.info(`Started streaming upload for key: ${key}`)
		const processedStream = this.imageProcessor.process(passThrough)

		return this.s3Service.uploadStream(key, processedStream, "image/webp")
	}

	private processChunk(
		chunkData: Uint8Array,
		metadata: UploadMetadata | null,
		passThrough: PassThrough
	): void {
		if (!metadata) {
			throw new RpcException({
				code: RpcStatus.INVALID_ARGUMENT,
				details: "Metadata must be sent in the first payload message"
			})
		}

		const buffer = Buffer.from(
			chunkData.buffer,
			chunkData.byteOffset,
			chunkData.byteLength
		)
		passThrough.write(buffer)
	}

	private async finalizeUpload(
		metadata: UploadMetadata | null,
		uploadPromise: Promise<void> | null,
		passThrough: PassThrough,
		finalKey: string
	): Promise<UploadResponse> {
		if (!metadata || !uploadPromise) {
			throw new RpcException({
				code: RpcStatus.INVALID_ARGUMENT,
				details: "Stream completed but no valid data was received"
			})
		}

		passThrough.end()

		try {
			await uploadPromise

			this.logger.info(`Upload completed for key: ${finalKey}`)

			return {
				key: finalKey,
				url: this.s3Service.getPublicUrl(finalKey)
			}
		} catch (error) {
			this.logger.error({ error }, "Failed to upload stream to S3")

			throw new RpcException({
				code: RpcStatus.INTERNAL,
				details: "Failed to process and upload image"
			})
		}
	}
}
