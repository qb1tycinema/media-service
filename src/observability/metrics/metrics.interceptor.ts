import {
	type CallHandler,
	type ExecutionContext,
	Injectable,
	type NestInterceptor
} from "@nestjs/common"
import { InjectMetric } from "@willsoto/nestjs-prometheus"
import type { Request, Response } from "express"
import { Counter, Gauge, Histogram } from "prom-client"
import { type Observable, tap } from "rxjs"

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
	private readonly serviceName!: string

	public constructor(
		@InjectMetric("grpc_requests_total")
		private readonly grpcCounter: Counter<string>,
		@InjectMetric("grpc_request_duration_seconds")
		private readonly grpcHistogram: Histogram<string>,

		@InjectMetric("http_requests_total")
		private readonly httpCounter: Counter<string>,
		@InjectMetric("http_request_duration_seconds")
		private readonly httpHistogram: Histogram<string>,
		@InjectMetric("http_requests_in_flight")
		private readonly httpInFlightGauge: Gauge<string>
	) {
		this.serviceName = "media-service"
	}

	public intercept(
		context: ExecutionContext,
		next: CallHandler<any>
	): Observable<any> {
		const type = context.getType()

		if (type === "rpc") {
			return this.handleGrpc(context, next)
		} else if (type === "http") {
			return this.handleHttp(context, next)
		}

		return next.handle()
	}

	private handleGrpc(
		context: ExecutionContext,
		next: CallHandler<any>
	): Observable<any> {
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

	private handleHttp(
		context: ExecutionContext,
		next: CallHandler<any>
	): Observable<any> {
		const req = context.switchToHttp().getRequest<Request>()
		const res = context.switchToHttp().getResponse<Response>()

		const route = req.route ? req.route.path : req.url
		const method = req.method

		this.httpInFlightGauge.inc({
			service: this.serviceName
		})

		const endTimer = this.httpHistogram.startTimer({
			service: this.serviceName,
			method,
			route
		})

		return next.handle().pipe(
			tap({
				next: () => {
					const status = res.statusCode.toString()

					this.httpCounter.inc({
						service: this.serviceName,
						method,
						route,
						status
					})

					endTimer({ status })

					this.httpInFlightGauge.dec({
						service: this.serviceName
					})
				},
				error: err => {
					const status = err.status ? err.status.toString() : "500"

					this.httpCounter.inc({
						service: this.serviceName,
						method,
						route,
						status
					})

					endTimer({ status })

					this.httpInFlightGauge.dec({
						service: this.serviceName
					})
				}
			})
		)
	}
}
