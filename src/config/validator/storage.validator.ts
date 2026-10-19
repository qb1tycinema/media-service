import { IsNotEmpty, IsString } from "class-validator"

export class StorageValidator {
	@IsString()
	@IsNotEmpty()
	public S3_BUCKET!: string

	@IsString()
	@IsNotEmpty()
	public S3_REGION!: string

	@IsString()
	@IsNotEmpty()
	public S3_ACCESS_KEY!: string

	@IsString()
	@IsNotEmpty()
	public S3_SECRET_KEY!: string

	@IsString()
	@IsNotEmpty()
	public S3_PUBLIC_URL!: string

	@IsString()
	@IsNotEmpty()
	public DISTRIBUTION_ID!: string
}
