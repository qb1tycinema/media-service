import type { Readable } from "stream"

export interface IImageProcessor {
	process: (input: Readable) => Readable
}
