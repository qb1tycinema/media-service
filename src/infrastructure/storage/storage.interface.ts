import type { Readable } from "stream"

export interface FileInfo {
	url: string
	size: number
	mimeType: string
}

export interface IStorageService {
	uploadStream: (
		key: string,
		readable: Readable | Buffer,
		contentType: string
	) => Promise<void>

	getStream: (key: string) => Promise<{
		stream: Readable
		contentType: string
	}>

	delete: (key: string) => Promise<void>

	getPublicUrl: (key: string) => string

	close: () => Promise<void>
}
