export interface UploadImageInput {
  file: File
  folder?: string
}

export interface UploadImageResponse {
  key: string
  url: string
  bucket?: string
  contentType?: string
  size?: number
  [key: string]: unknown
}

export interface DeleteUploadImageInput {
  key: string
}

export interface DeleteUploadImageResponse {
  ok: boolean
  key: string
  [key: string]: unknown
}
