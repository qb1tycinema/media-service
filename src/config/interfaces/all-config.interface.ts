import type { EnvironemtConfig } from "./environemt.interface"
import type { GrpcConfig } from "./grpc.interface"
import type { HttpConfig } from "./http.interface"
import type { JaegerConfig } from "./jaeger.interface"
import type { LoggerConfig } from "./logger.interface"
import type { StorageConfig } from "./storage.interface"

export interface AllConfigs {
	environemt: EnvironemtConfig
	grpc: GrpcConfig
	http: HttpConfig
	jaeger: JaegerConfig
	logger: LoggerConfig
	storage: StorageConfig
}
