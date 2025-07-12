/* eslint-disable @typescript-eslint/no-explicit-any */

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

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error?.message || "Request failed");
    }

    return res.json();
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

// ✅ export an instance, NOT the class
const stpApi = new StpApi();
export default stpApi;
