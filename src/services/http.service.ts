import axios, { type AxiosInstance, type AxiosRequestConfig, type Method } from "axios";

export class HttpService {
  private readonly client: AxiosInstance;
  private readonly minIntervalMs: number;
  private lastRequestAt = 0;

  public constructor(baseURL?: string, timeoutMs = 15_000, defaultHeaders?: Record<string, string>, minIntervalMs = 0) {
    this.client = axios.create({
      baseURL,
      timeout: timeoutMs,
      maxRedirects: 5,
      headers: {
        "User-Agent": "seo-mcp/1.0.0 (+https://johnmingam.com)",
        ...(defaultHeaders ?? {})
      }
    });
    this.minIntervalMs = minIntervalMs;
  }

  public async request<T>(method: Method, url: string, config?: AxiosRequestConfig, data?: unknown): Promise<T> {
    if (this.minIntervalMs > 0) {
      const elapsed = Date.now() - this.lastRequestAt;
      if (elapsed < this.minIntervalMs) {
        await sleep(this.minIntervalMs - elapsed);
      }
    }

    const response = await this.client.request<T>({
      method,
      url,
      data,
      ...(config ?? {})
    });

    this.lastRequestAt = Date.now();
    return response.data;
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>("GET", url, config);
  }

  public async post<T>(url: string, body: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>("POST", url, config, body);
  }

  public async put<T>(url: string, body: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>("PUT", url, config, body);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
