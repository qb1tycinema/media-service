import { IsInt } from "class-validator"

export class HttpValidator {
	@IsInt()
	public HTTP_PORT!: number
}
