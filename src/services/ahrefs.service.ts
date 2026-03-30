import type { AppConfig } from "../config.js";
import { HttpService } from "./http.service.js";

export interface AhrefsBacklink {
  url_from: string;
  url_to: string;
  anchor: string;
  domain_rating?: number;
}

export class AhrefsService {
  private readonly http = new HttpService("https://api.ahrefs.com", 20_000);

  public constructor(private readonly config: AppConfig) {}

  public async backlinks(target: string, limit = 100): Promise<AhrefsBacklink[]> {
    const key = this.config.ahrefsApiKey;
    if (!key) {
      throw new Error("Missing AHREFS_API_KEY. The user must set this key in environment variables.");
    }

    const endpoint = `/v3/site-explorer/all-backlinks?target=${encodeURIComponent(target)}&limit=${Math.min(500, Math.max(1, limit))}&output=json`;
    const payload = await this.http.get<any>(endpoint, {
      headers: {
        Authorization: `Bearer ${key}`
      }
    });

    const rows = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.refpages) ? payload.refpages : [];
    return rows.map((row: any) => ({
      url_from: String(row.url_from ?? row.referring_page_url ?? ""),
      url_to: String(row.url_to ?? row.target_url ?? target),
      anchor: String(row.anchor ?? row.anchor_text ?? ""),
      domain_rating: toNumber(row.domain_rating ?? row.dr)
    })).filter((row: AhrefsBacklink) => row.url_from && row.url_to);
  }
}

function toNumber(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}
