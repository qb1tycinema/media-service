import { IsUrl } from "class-validator"

export class JaegerValidator {
	@IsUrl({
		protocols: ["http"],
		require_tld: false
	})
	public JAEGER_URL!: string
}
