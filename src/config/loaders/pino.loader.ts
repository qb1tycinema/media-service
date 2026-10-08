import { ConfigService } from "@nestjs/config"
import type { Params } from "nestjs-pino"

import type { AllConfigs } from "../interfaces"

export function getPinoConfig(service: ConfigService<AllConfigs>): Params {
	return {
		pinoHttp: {
			level: service.get("logger.level", { infer: true }),
			transport: {
				target: "pino/file",
				options: {
					destination: "/var/log/services/media/media.log",
					mkdir: true
				}
			},
			messageKey: "msg",
			customProps: () => ({
				service: "media-service"
			})
		}
	}
}
