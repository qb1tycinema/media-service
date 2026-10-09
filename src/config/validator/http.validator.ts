import { IsInt, IsString } from "class-validator"

export class HttpValidator {
	@IsString()
	public HTTP_HOST!: string

	@IsInt()
	public HTTP_PORT!: number
}
