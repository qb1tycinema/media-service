import { IsNotEmpty, IsString } from "class-validator"

export class LoggerValidator {
	@IsString()
	@IsNotEmpty()
	public LOGGER_LEVEL!: string
}
