import apiClient from "../api/client";
import type { AxiosProgressEvent } from "axios";

export interface UploadResponse {
  imported?: number;
  updated?: number;
  errors?: string[];
  source_file?: string;
  [key: string]: unknown;
}

/** Sube un archivo al endpoint indicado. Campo: "file". */
export async function uploadFile(
  endpoint: string,
  file: File,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
): Promise<UploadResponse> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await apiClient.post<UploadResponse>(endpoint, fd, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
  return res.data;
}
