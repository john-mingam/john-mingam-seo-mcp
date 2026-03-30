import type { AppConfig } from "../config.js";
import { HttpService } from "./http.service.js";

export interface GscRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export class GscService {
  private readonly http = new HttpService("https://searchconsole.googleapis.com", 20_000);

  public constructor(private readonly config: AppConfig) {}

  public async query(siteUrl: string, startDate: string, endDate: string, dimensions: string[] = ["query"]): Promise<GscRow[]> {
    const token = this.config.gscAccessToken;
    if (!token) {
      throw new Error("Missing GSC_ACCESS_TOKEN. The user must provide their Google Search Console access token.");
    }

    const encodedSite = encodeURIComponent(siteUrl);
    const response = await this.http.post<any>(
      `/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`,
      {
        startDate,
        endDate,
        dimensions,
        rowLimit: 100
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    const rows = Array.isArray(response?.rows) ? response.rows : [];
    return rows.map((row: any) => ({
      keys: Array.isArray(row.keys) ? row.keys.map((x: unknown) => String(x)) : [],
      clicks: Number(row.clicks ?? 0),
      impressions: Number(row.impressions ?? 0),
      ctr: Number(row.ctr ?? 0),
      position: Number(row.position ?? 0)
    }));
  }
}
