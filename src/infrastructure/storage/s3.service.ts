import {
	CloudFrontClient,
	CreateInvalidationCommand
} from "@aws-sdk/client-cloudfront"
import {
	CreateBucketCommand,
	DeleteObjectCommand,
	GetObjectCommand,
	HeadBucketCommand,
	PutObjectCommand,
	S3Client
} from "@aws-sdk/client-s3"
import { Upload } from "@aws-sdk/lib-storage"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { Injectable, OnModuleInit } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { PinoLogger } from "nestjs-pino"
import { Readable } from "stream"

import type { AllConfigs } from "@/config"

@Injectable()
export class S3Service implements OnModuleInit {
	private client: S3Client
	private cloudClient: CloudFrontClient

	private readonly bucket: string
	private readonly cdnUrl: string
	private readonly cfDistributionId: string

	private readonly region: string
	private readonly accessKeyId: string
	private readonly secretAccessKey: string

	public constructor(
		private readonly configService: ConfigService<AllConfigs>,
		private readonly logger: PinoLogger
	) {
		this.logger.setContext(S3Service.name)

		this.bucket = this.configService.get("storage.bucket", { infer: true })
		this.cdnUrl = this.configService.get("storage.publicUrl", {
			infer: true
		})
		this.cfDistributionId = this.configService.get(
			"storage.cfDistributionId",
			{ infer: true }
		)

		this.region = this.configService.get("storage.region", { infer: true })
		this.accessKeyId = this.configService.get("storage.accessKey", {
			infer: true
		})
		this.secretAccessKey = this.configService.get("storage.secretKey", {
			infer: true
		})
	}

	public async onModuleInit() {
		this.client = new S3Client({
			region: this.region,
			credentials: {
				accessKeyId: this.accessKeyId,
				secretAccessKey: this.secretAccessKey
			}
		})

		if (this.cfDistributionId) {
			this.cloudClient = new CloudFrontClient({
				region: this.region,
				credentials: {
					accessKeyId: this.accessKeyId,
					secretAccessKey: this.secretAccessKey
				}
			})

			this.logger.info(
				"CloudFront client initialized for cache invalidation"
			)
		}

		try {
			await this.client.send(
				new HeadBucketCommand({ Bucket: this.bucket })
			)
			this.logger.info(`Connected to S3 bucket: ${this.bucket}`)
		} catch (error: any) {
			if (error.name === "NotFound") {
				this.logger.warn(`Bucket ${this.bucket} not found. Creating...`)
				await this.client.send(
					new CreateBucketCommand({ Bucket: this.bucket })
				)
				this.logger.info(`Created S3 bucket: ${this.bucket}`)
			} else {
				this.logger.error(
					{ err: error },
					`Failed to connect to S3: ${error.message}`
				)
				throw error
			}
		}
	}

	public async uploadStream(
		key: string,
		stream: Readable | Buffer,
		contentType: string
	) {
		const upload = new Upload({
			client: this.client,
			params: {
				Bucket: this.bucket,
				Key: key,
				Body: stream,
				ContentType: contentType
			}
		})

		await upload.done()
	}

	public async getStream(key: string): Promise<{
		stream: Readable
		contentType: string
	}> {
		const command = new GetObjectCommand({
			Bucket: this.bucket,
			Key: key
		})

		const response = await this.client.send(command)

		return {
			stream: response.Body as Readable,
			contentType: response.ContentType || "application/octet-stream"
		}
	}

	public async delete(key: string): Promise<void> {
		const command = new DeleteObjectCommand({
			Bucket: this.bucket,
			Key: key
		})

		await this.client.send(command)
		this.logger.debug(`Deleted file from S3: ${key}`)

		if (this.cfDistributionId && this.cloudClient) {
			await this.invalidateCloudFrontCache(`/${key}`)
		}
	}

	private async invalidateCloudFrontCache(path: string): Promise<void> {
		try {
			const callerReference = `invalidate-${Date.now()}`
			const command = new CreateInvalidationCommand({
				DistributionId: this.cfDistributionId,
				InvalidationBatch: {
					CallerReference: callerReference,
					Paths: {
						Quantity: 1,
						Items: [path]
					}
				}
			})

			await this.cloudClient.send(command)
			this.logger.info(`CloudFront cache invalidated for path: ${path}`)
		} catch (error) {
			this.logger.error(
				{ error },
				`Failed to invalidate CloudFront cache for path: ${path}`
			)
		}
	}

	public getPublicUrl(key: string) {
		if (this.cdnUrl) {
			const cleanCdn = this.cdnUrl.endsWith("/")
				? this.cdnUrl.slice(0, -1)
				: this.cdnUrl
			return `${cleanCdn}/${key}`
		}

		return `https://${this.bucket}.s3.${this.client.config.region}.amazonaws.com/${key}`
	}

	public async getPresignedUrl(
		key: string,
		expiresInSeconds: number,
		method: "GET" | "PUT"
	): Promise<string> {
		const command =
			method === "GET"
				? new GetObjectCommand({ Bucket: this.bucket, Key: key })
				: new PutObjectCommand({ Bucket: this.bucket, Key: key })

		return await getSignedUrl(this.client, command as any, {
			expiresIn: expiresInSeconds
		})
	}

	public async close(): Promise<void> {
		this.client?.destroy()
		this.cloudClient?.destroy()
		this.logger.info("AWS clients destroyed")
	}

	public async onModuleDestroy(): Promise<void> {
		await this.close()
	}
}
