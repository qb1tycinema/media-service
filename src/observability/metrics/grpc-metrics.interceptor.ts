import {
	type CallHandler,
	type ExecutionContext,
	Injectable,
	type NestInterceptor
} from "@nestjs/common"
import { InjectMetric } from "@willsoto/nestjs-prometheus"
import { Counter, Histogram } from "prom-client"
import { type Observable, tap } from "rxjs"

@Injectable()
export class GrpcInterceptor implements NestInterceptor {
	private readonly serviceName!: string

	public constructor(
		@InjectMetric("grpc_requests_total")
		private readonly grpcCounter: Counter<string>,
		@InjectMetric("grpc_request_duration_seconds")
		private readonly grpcHistogram: Histogram<string>
	) {
		this.serviceName = "media-service"
	}

	public intercept(
		context: ExecutionContext,
		next: CallHandler<any>
	): Observable<any> {
		if (context.getType() !== "rpc") {
			return next.handle()
		}

		const handler = context.getHandler().name
		const endTimer = this.grpcHistogram.startTimer({
			service: this.serviceName,
			method: handler
		})

		return next.handle().pipe(
			tap({
				next: () => {
					this.grpcCounter.inc({
						service: this.serviceName,
						method: handler,
						status: "OK"
					})
					endTimer()
				},
				error: () => {
					this.grpcCounter.inc({
						service: this.serviceName,
						method: handler,
						status: "ERROR"
					})
					endTimer()
				}
			})
		)
	}
}
