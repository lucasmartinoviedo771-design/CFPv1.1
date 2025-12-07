import axios from "axios";
import apiClient from "./apiClient";

/** Sube un archivo al endpoint indicado. Campo: "file". */
export async function uploadFile(endpoint, file, onUploadProgress) {
  const fd = new FormData();
  fd.append("file", file);
  const client = endpoint.startsWith("/api/") ? axios : apiClient;
  const res = await client.post(endpoint, fd, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
  return res.data; // {imported, updated, errors, source_file, ...}
}
