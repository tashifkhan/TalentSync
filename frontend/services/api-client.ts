import { getSession } from "next-auth/react";

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: RequestMethod;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}

async function request<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", headers = {}, body, params, signal } = options;

  // Build query string
  const queryString = params
    ? "?" + new URLSearchParams(params).toString()
    : "";

  const fullUrl = `${url}${queryString}`;

  // Prepare headers
  const requestHeaders: Record<string, string> = { ...headers };

  // Only add Content-Type if body is not FormData
  if (body && !(body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  const config: RequestInit = {
    method,
    headers: requestHeaders,
    signal,
  };

  if (body) {
    config.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(fullUrl, config);
    const data = await response.json();

    if (!response.ok) {
      let errorMessage = "An error occurred";
      
      if (data.message) {
        errorMessage = typeof data.message === "string" 
          ? data.message 
          : Array.isArray(data.message) 
            ? data.message.map((m: any) => m.msg || m.message || JSON.stringify(m)).join(", ")
            : JSON.stringify(data.message);
      } else if (data.detail) {
        errorMessage = typeof data.detail === "string" 
          ? data.detail 
          : Array.isArray(data.detail) 
            ? data.detail.map((m: any) => m.msg || m.message || JSON.stringify(m)).join(", ")
            : JSON.stringify(data.detail);
      } else if (data.error) {
        errorMessage = typeof data.error === "string"
          ? data.error
          : JSON.stringify(data.error);
      }

      throw new ApiError(
        errorMessage,
        response.status,
        data,
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Network error",
      500,
    );
  }
}

export const apiClient = {
  get: <T>(url: string, options: Omit<RequestOptions, "method"> = {}) =>
    request<T>(url, { ...options, method: "GET" }),

  post: <T>(
    url: string,
    body?: any,
    options: Omit<RequestOptions, "method" | "body"> = {},
  ) => request<T>(url, { ...options, method: "POST", body }),

  put: <T>(
    url: string,
    body?: any,
    options: Omit<RequestOptions, "method" | "body"> = {},
  ) => request<T>(url, { ...options, method: "PUT", body }),

  patch: <T>(
    url: string,
    body?: any,
    options: Omit<RequestOptions, "method" | "body"> = {},
  ) => request<T>(url, { ...options, method: "PATCH", body }),

  delete: <T>(url: string, options: Omit<RequestOptions, "method"> = {}) =>
    request<T>(url, { ...options, method: "DELETE" }),
};
