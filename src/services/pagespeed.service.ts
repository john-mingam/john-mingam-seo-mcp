import type { AppConfig } from "../config.js";
import { HttpService } from "./http.service.js";

export interface CoreWebVitalsData {
  lcp: { value: number; rating: "good" | "needs-improvement" | "poor"; threshold: number };
  cls: { value: number; rating: "good" | "needs-improvement" | "poor"; threshold: number };
  inp: { value: number; rating: "good" | "needs-improvement" | "poor"; threshold: number };
  fcp: { value: number; rating: "good" | "needs-improvement" | "poor"; threshold: number };
  ttfb: { value: number; rating: "good" | "needs-improvement" | "poor"; threshold: number };
  strategy: "mobile" | "desktop";
}

export class PageSpeedService {
  private readonly http = new HttpService("https://www.googleapis.com", 20_000);

  public constructor(private readonly config: AppConfig) {}

  public async getCoreWebVitals(url: string, strategy: "mobile" | "desktop"): Promise<CoreWebVitalsData> {
    const apiKey = this.config.pageSpeedApiKey;
    if (!apiKey) {
      throw new Error("Missing PAGESPEED_API_KEY. The user must set this API key in environment variables.");
    }

    const endpoint = `/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance&key=${encodeURIComponent(apiKey)}`;
    const payload = await this.http.get<any>(endpoint);

    const audits = payload?.lighthouseResult?.audits ?? {};

    const lcpSeconds = toNumber(audits["largest-contentful-paint"]?.numericValue) / 1000;
    const clsScore = toNumber(audits["cumulative-layout-shift"]?.numericValue);
    const inpMs = toNumber(audits["interaction-to-next-paint"]?.numericValue || audits["experimental-interaction-to-next-paint"]?.numericValue);
    const fcpSeconds = toNumber(audits["first-contentful-paint"]?.numericValue) / 1000;
    const ttfbSeconds = toNumber(audits["server-response-time"]?.numericValue) / 1000;

    return {
      lcp: metric(lcpSeconds, 2.5, 4),
      cls: metric(clsScore, 0.1, 0.25),
      inp: metric(inpMs, 200, 500),
      fcp: metric(fcpSeconds, 1.8, 3),
      ttfb: metric(ttfbSeconds, 0.8, 1.8),
      strategy
    };
  }
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function metric(value: number, goodThreshold: number, poorThreshold: number): { value: number; rating: "good" | "needs-improvement" | "poor"; threshold: number } {
  if (value <= goodThreshold) {
    return { value: round(value), rating: "good", threshold: goodThreshold };
  }
  if (value <= poorThreshold) {
    return { value: round(value), rating: "needs-improvement", threshold: goodThreshold };
  }
  return { value: round(value), rating: "poor", threshold: goodThreshold };
}

function round(v: number): number {
  return Number(v.toFixed(3));
}
