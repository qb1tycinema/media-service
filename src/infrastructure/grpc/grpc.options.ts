import type { GrpcOptions } from "@nestjs/microservices"
import { PROTO_PATHS } from "@qb1tycinema/contracts"

export const grpcPackages: string[] = ["media.v1"]
export const grpcProtoPaths: string[] = [PROTO_PATHS.MEDIA]
export const grpcLoader: NonNullable<GrpcOptions["options"]["loader"]> = {
	keepCase: false,
	longs: String,
	enums: String,
	defaults: true,
	oneofs: true
}
