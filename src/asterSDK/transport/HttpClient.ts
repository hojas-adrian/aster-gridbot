import { ApiConfig } from "../config/ApiConfig.ts";
import { Signer } from "../auth/Signer.ts";

export class HttpClient {
  private lastMs = 0;
  private nonceCounter = 0;

  constructor(private config: ApiConfig, private signer: Signer) {}

  private buildQuery(params: Record<string, unknown>): string {
    return Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
      )
      .join("&");
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getNonce(): number {
    const nowMs = Date.now();
    if (nowMs === this.lastMs) {
      this.nonceCounter += 1;
    } else {
      this.lastMs = nowMs;
      this.nonceCounter = 0;
    }
    return nowMs * 1000 + this.nonceCounter;
  }

  async request<T>(
    method: "GET" | "POST" | "DELETE" | "PUT",
    path: string,
    params: Record<string, unknown> = {},
    authRequired: boolean = false,
    retries = 3,
  ): Promise<T> {
    const baseUrl = this.config.baseUrl || "";
    let finalUrl = `${baseUrl}${path}`;
    const headers: Record<string, string> = {};
    const cleanParams: Record<string, unknown> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        cleanParams[key] = value;
      }
    });

    let body: string | undefined;

    if (authRequired) {
      const authMode = this.config.authMode ??
        (this.config.privateKey ? "EIP712" : "HMAC");

      if (authMode === "EIP712") {
        if (!this.config.user || !this.config.signer) {
          throw new Error(
            "user y signer son requeridos para authMode=EIP712.",
          );
        }
        cleanParams.user = this.config.user;
        cleanParams.signer = this.config.signer;
        cleanParams.nonce = this.getNonce();
      } else {
        cleanParams.timestamp = Date.now();
        if (cleanParams.recvWindow === undefined) {
          cleanParams.recvWindow = 5000;
        }
        if (!this.config.apiKey) {
          throw new Error("apiKey es requerido para authMode=HMAC.");
        }
        headers["X-MBX-APIKEY"] = this.config.apiKey;
      }

      const queryString = this.buildQuery(cleanParams);
      const signature = await this.signer.sign(queryString);

      if (authMode === "EIP712") {
        if (method === "GET" || method === "DELETE") {
          finalUrl += `?${queryString}&signature=${signature}`;
        } else {
          headers["Content-Type"] = "application/x-www-form-urlencoded";
          body = `${queryString}&signature=${signature}`;
        }
      } else {
        if (method === "GET" || method === "DELETE") {
          finalUrl += `?${queryString}&signature=${signature}`;
        } else {
          finalUrl += `?signature=${signature}`;
          headers["Content-Type"] = "application/x-www-form-urlencoded";
          body = queryString;
        }
      }
    } else {
      if (method === "GET" || method === "DELETE") {
        if (Object.keys(cleanParams).length > 0) {
          finalUrl += `?${this.buildQuery(cleanParams)}`;
        }
      } else if (Object.keys(cleanParams).length > 0) {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(cleanParams);
      }
    }

    const controller = new AbortController();
    const timeoutMs = this.config.timeoutMs ?? 10000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(finalUrl, {
        method,
        headers,
        body,
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (retries > 0) {
        console.warn("Error de red, reintentando...", error);
        await this.delay(1000 * (4 - retries));
        return this.request(method, path, params, authRequired, retries - 1);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    const retryAfterHeader = response.headers.get("Retry-After");
    if (
      (response.status === 429 || response.status === 418 ||
        response.status >= 500) && retries > 0
    ) {
      const retryAfterSec = retryAfterHeader ? Number(retryAfterHeader) : NaN;
      const backoff = retryAfterSec > 0
        ? retryAfterSec * 1000
        : 1000 * (4 - retries);
      console.warn(
        "Rate limit o error de servidor. Reintentando en",
        backoff,
        "ms...",
      );
      await this.delay(backoff);
      return this.request(method, path, params, authRequired, retries - 1);
    }

    const text = await response.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = text;
    }

    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${JSON.stringify(data)}`);
    }

    return data as T;
  }
}
