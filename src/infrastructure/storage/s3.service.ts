import {
	CreateBucketCommand,
	DeleteObjectCommand,
	GetObjectCommand,
	HeadBucketCommand,
	PutObjectAclCommand,
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
	private readonly client: S3Client
	private readonly bucket: string

	public constructor(
		private readonly configService: ConfigService<AllConfigs>,
		private readonly logger: PinoLogger
	) {
		this.logger.setContext(S3Service.name)

		const region = this.configService.get("storage.region", { infer: true })
		const accessKeyId = this.configService.get("storage.accessKey", {
			infer: true
		})
		const secretAccessKey = this.configService.get("storage.secretKey", {
			infer: true
		})

		this.bucket = this.configService.get("storage.bucket", { infer: true })

		this.client = new S3Client({
			region,
			credentials: {
				accessKeyId,
				secretAccessKey
			}
		})
	}

	public async onModuleInit() {
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
	}

	public async getPresignedUrl(
		key: string,
		expiresInSeconds: number,
		method: "GET" | "PUT"
	): Promise<string> {
		const command =
			method === "GET"
				? new GetObjectCommand({ Bucket: this.bucket, Key: key })
				: new PutObjectAclCommand({ Bucket: this.bucket, Key: key })

		return await getSignedUrl(this.client, command as any, {
			expiresIn: expiresInSeconds
		})
	}

	public async close(): Promise<void> {
		this.client.destroy()
		this.logger.info("S3 client destroyed")
	}

	public async onModuleDestroy(): Promise<void> {
		await this.close()
	}
}
