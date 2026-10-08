import { Transform } from "class-transformer"
import { IsEnum } from "class-validator"

export enum Environemt {
	DEVELOPMENT = "development",
	PRODUCTION = "production",
	TEST = "test"
}

export class EnvironemtValidator {
	@IsEnum(Environemt)
	@Transform(({ value }) => value ?? Environemt.DEVELOPMENT)
	public NODE_ENV: Environemt = Environemt.DEVELOPMENT
}
