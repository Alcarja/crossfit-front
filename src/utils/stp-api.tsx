/* eslint-disable @typescript-eslint/no-explicit-any */

class HttpError extends Error {
  status: number;
  data: any;
  constructor(status: number, data: any, message?: string) {
    super(message ?? (data?.error || data?.message || String(status)));
    this.name = "HttpError";
    this.status = status;
    this.data = data;
  }
}

class StpApi {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  }

  private async request(
    method: "GET" | "POST" | "PUT" | "DELETE",
    endpoint: string,
    body?: any,
    customHeaders: Record<string, string> = {}
  ) {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...customHeaders,
    };

    const options: RequestInit = {
      method,
      headers,
      credentials: "include",
    };

    if (body && method !== "GET") {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(`${this.baseUrl}${endpoint}`, options);

    // Try to parse JSON; fall back to text if needed
    let payload: any = null;
    let isJson = false;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      try {
        payload = await res.json();
        isJson = true;
      } catch {
        payload = null;
      }
    }
    if (!isJson && !res.ok) {
      try {
        const txt = await res.text();
        payload = { error: txt };
      } catch {
        payload = null;
      }
    }
    if (!res.ok) {
      // Backend might send { error: "..."} or { message: "..." }
      const msg =
        payload?.error ||
        payload?.message ||
        res.statusText ||
        "Request failed";
      throw new HttpError(res.status, payload, msg);
    }

    // success
    if (isJson) return payload;
    // if no json body on success, return empty
    return null;
  }

  get(
    endpoint: string,
    options: {
      params?: Record<string, any>;
      headers?: Record<string, string>;
    } = {}
  ) {
    const { params = {}, headers = {} } = options;
    const query = new URLSearchParams(params).toString();
    const urlWithParams = query ? `${endpoint}?${query}` : endpoint;
    return this.request("GET", urlWithParams, null, headers);
  }

  post(endpoint: string, body: any, headers = {}) {
    return this.request("POST", endpoint, body, headers);
  }

  put(endpoint: string, body: any, headers = {}) {
    return this.request("PUT", endpoint, body, headers);
  }

  delete(endpoint: string, body: any = null, headers = {}) {
    return this.request("DELETE", endpoint, body, headers);
  }
}

const stpApi = new StpApi();
export default stpApi;
export type { HttpError };
