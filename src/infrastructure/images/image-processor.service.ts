import { Injectable } from "@nestjs/common"
import { PinoLogger } from "nestjs-pino"
import sharp from "sharp"
import { Readable } from "stream"

import type { IImageProcessor } from "./image-processor.interface"

@Injectable()
export class ImageProcessorService implements IImageProcessor {
	public constructor(private readonly logger: PinoLogger) {
		this.logger.setContext(ImageProcessorService.name)
	}

	public process(input: Readable): Readable {
		const transformer = sharp()
			.rotate()
			.resize({
				width: 1920,
				height: 1920,
				fit: "inside",
				withoutEnlargement: true
			})
			.webp({ quality: 80, effort: 4 })

		transformer.on("info", info => {
			this.logger.info(
				`Image processed: ${info.format}, ${info.width}x${info.height}, ${info.size} bytes`
			)
		})

		transformer.on("error", err => {
			this.logger.error({ err }, "Error during image processing in Sharp")
		})

		return input.pipe(transformer)
	}
}
