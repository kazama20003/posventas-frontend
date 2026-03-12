import { apiClient } from "@/lib/api/client"
import type {
  DeleteUploadImageInput,
  DeleteUploadImageResponse,
  UploadImageInput,
  UploadImageResponse,
} from "../types"

const UPLOADS_ENDPOINTS = {
  images: "/uploads/images",
} as const

export const uploadsService = {
  uploadImage: async ({ file, folder }: UploadImageInput) => {
    const formData = new FormData()
    formData.append("file", file)

    if (folder) {
      formData.append("folder", folder)
    }

    const { data } = await apiClient.post<UploadImageResponse>(UPLOADS_ENDPOINTS.images, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    return data
  },

  deleteImage: async ({ key }: DeleteUploadImageInput) => {
    const { data } = await apiClient.delete<DeleteUploadImageResponse>(UPLOADS_ENDPOINTS.images, {
      data: { key },
    })

    return data
  },
}
