import type { AppConfig } from "../config.js";
import { HttpService } from "./http.service.js";

export interface SemrushKeyword {
  keyword: string;
  volume?: number;
  cpc?: number;
  competition?: number;
}

export class SemrushService {
  private readonly http = new HttpService("https://api.semrush.com", 20_000);

  public constructor(private readonly config: AppConfig) {}

  public async relatedKeywords(seedKeyword: string, country = "us"): Promise<SemrushKeyword[]> {
    const key = this.config.semrushApiKey;
    if (!key) {
      throw new Error("Missing SEMRUSH_API_KEY. The user must set this key in environment variables.");
    }

    const endpoint = `/?type=phrase_related&key=${encodeURIComponent(key)}&phrase=${encodeURIComponent(seedKeyword)}&database=${encodeURIComponent(country.toLowerCase())}&export_columns=Ph,Nq,Cp,Co&display_limit=25`;
    const csv = await this.http.get<string>(endpoint, {
      responseType: "text"
    } as any);

    const lines = String(csv).trim().split("\n").filter(Boolean);
    if (lines.length <= 1) {
      return [];
    }

    return lines.slice(1).map((line) => {
      const [keyword, volume, cpc, competition] = line.split(";");
      return {
        keyword: keyword?.trim() ?? "",
        volume: toNumber(volume),
        cpc: toNumber(cpc),
        competition: toNumber(competition)
      };
    }).filter((row) => row.keyword.length > 0);
  }
}

function toNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}
