import axios, { AxiosError } from "axios";

// Shared axios instance for the Hoàng Lâm API (hoanglam-api).
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Error with the API's message (`{ success: false, message }`) when there is one.
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status ?? 0;
    const message =
      error.response?.data?.message ??
      (status === 0 ? "Không thể kết nối tới máy chủ" : `Yêu cầu thất bại (${status})`);
    return Promise.reject(new ApiError(status, message));
  },
);

// The API wraps payloads as `{ success, data }`.
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
