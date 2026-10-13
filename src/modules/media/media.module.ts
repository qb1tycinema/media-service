import { Module } from "@nestjs/common"

import { MediaController } from "./media.controller"
import { DeleteUseCase } from "./usecases/delete.usecase"
import { UploadUseCase } from "./usecases/upload.usecase"
import { ImageProcessorService } from "@/infrastructure/images/image-processor.service"
import { S3Service } from "@/infrastructure/storage/s3.service"

@Module({
	controllers: [MediaController],
	providers: [UploadUseCase, DeleteUseCase, S3Service, ImageProcessorService]
})
export class MediaModule {}
