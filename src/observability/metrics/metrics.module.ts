import { Global, Module } from "@nestjs/common"
import { APP_INTERCEPTOR } from "@nestjs/core"
import {
	makeCounterProvider,
	makeGaugeProvider,
	makeHistogramProvider,
	PrometheusModule
} from "@willsoto/nestjs-prometheus"

import { GrpcInterceptor } from "./grpc-metrics.interceptor"

@Global()
@Module({
	imports: [
		PrometheusModule.register({
			path: "/metrics",
			defaultMetrics: {
				enabled: true
			}
		})
	],
	providers: [
		makeHistogramProvider({
			name: "grpc_request_duration_seconds",
			help: "gRPC request latency",
			labelNames: ["service", "method"]
		}),
		makeCounterProvider({
			name: "grpc_requests_total",
			help: "Total gRPC requests",
			labelNames: ["service", "method", "status"]
		}),
		{
			provide: APP_INTERCEPTOR,
			useClass: GrpcInterceptor
		}
	]
})
export class MetricsModule {}
