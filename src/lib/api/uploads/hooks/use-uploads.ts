import { useMutation } from "@tanstack/react-query"
import { uploadsService } from "../services/uploads.service"
import type { DeleteUploadImageInput, UploadImageInput } from "../types"

export const uploadKeys = {
  all: ["uploads"] as const,
  images: () => ["uploads", "images"] as const,
}

export function useUploadImage() {
  return useMutation({
    mutationKey: uploadKeys.images(),
    mutationFn: (payload: UploadImageInput) => uploadsService.uploadImage(payload),
  })
}

export function useDeleteUploadImage() {
  return useMutation({
    mutationFn: (payload: DeleteUploadImageInput) => uploadsService.deleteImage(payload),
  })
}
