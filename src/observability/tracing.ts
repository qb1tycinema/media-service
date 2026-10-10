import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc"
import { resourceFromAttributes } from "@opentelemetry/resources"
import { NodeSDK } from "@opentelemetry/sdk-node"
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions"
import * as dotenv from "dotenv"

dotenv.config({ path: `.env.${process.env.NODE_ENV}.local` })
dotenv.config({ path: `.env.${process.env.NODE_ENV}` })
dotenv.config({ path: `.env` })
dotenv.config()

const traceExporter = new OTLPTraceExporter({
	url: process.env.JAEGER_URL
})

export const otelSdk = new NodeSDK({
	traceExporter,
	resource: resourceFromAttributes({
		[ATTR_SERVICE_NAME]: "media-service"
	}),
	instrumentations: [
		getNodeAutoInstrumentations({
			"@opentelemetry/instrumentation-grpc": { enabled: true },
			"@opentelemetry/instrumentation-http": { enabled: true },
			"@opentelemetry/instrumentation-nestjs-core": {
				enabled: true
			},
			"@opentelemetry/instrumentation-aws-sdk": { enabled: true }
		})
	]
})

otelSdk.start()
