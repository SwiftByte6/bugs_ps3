import { SAARTHI_API_URL, DEFAULT_TIMEOUT_MS } from "./config";

export class ApiError extends Error {
  constructor(type, message, status = 0, details = null) {
    super(message);
    this.name = "ApiError";
    this.type = type;
    this.status = status;
    this.details = details;
  }
}

export async function apiClient(endpoint, options = {}) {
  const {
    method = "GET",
    body = null,
    headers = {},
    timeout = DEFAULT_TIMEOUT_MS,
    isFormData = false,
  } = options;

  const url = `${SAARTHI_API_URL}${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const requestHeaders = { ...headers };
  if (!isFormData && body && !requestHeaders["Content-Type"]) {
    requestHeaders["Content-Type"] = "application/json";
  }

  const fetchOptions = {
    method,
    headers: requestHeaders,
    signal: controller.signal,
  };

  if (body) {
    fetchOptions.body = isFormData ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetails = null;
      try {
        errorDetails = await response.json();
      } catch (e) {
        errorDetails = await response.text();
      }

      if (response.status === 422) {
        throw new ApiError(
          "VALIDATION_ERROR",
          "Invalid payload provided to backend service.",
          response.status,
          errorDetails
        );
      }

      throw new ApiError(
        "SERVER_ERROR",
        `Backend request failed with status ${response.status}`,
        response.status,
        errorDetails
      );
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }
    return await response.text();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      throw new ApiError("TIMEOUT", "Backend service request timed out.", 408);
    }

    if (error instanceof ApiError) {
      throw error;
    }

    // Network level error or server unreachable
    throw new ApiError(
      "UNAVAILABLE",
      "Saarthi backend service is currently unreachable.",
      503,
      error.message
    );
  }
}

export const api = {
  get: (endpoint, options = {}) => apiClient(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options = {}) => apiClient(endpoint, { ...options, method: "POST", body }),
  patch: (endpoint, body, options = {}) => apiClient(endpoint, { ...options, method: "PATCH", body }),
  delete: (endpoint, options = {}) => apiClient(endpoint, { ...options, method: "DELETE" }),
  upload: (endpoint, formData, options = {}) =>
    apiClient(endpoint, { ...options, method: "POST", body: formData, isFormData: true }),
};
