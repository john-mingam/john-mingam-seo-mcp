import { HttpService } from "./http.service.js";

export interface WikidataLookupResult {
  qid: string;
  labels: Record<string, string>;
  descriptions: Record<string, string>;
  aliases: string[];
  properties: Record<string, unknown>;
  sameAsUris: string[];
}

export class WikidataService {
  private readonly http = new HttpService("https://www.wikidata.org", 20_000);

  public async lookup(query: string, language = "en"): Promise<WikidataLookupResult> {
    const searchEndpoint = `/w/api.php?action=wbsearchentities&format=json&language=${encodeURIComponent(language)}&type=item&search=${encodeURIComponent(query)}`;
    const search = await this.http.get<any>(searchEndpoint);
    const first = search?.search?.[0];

    if (!first?.id) {
      throw new Error(`No Wikidata entity found for query: ${query}`);
    }

    const qid = String(first.id);
    const entityPayload = await this.http.get<any>(`/wiki/Special:EntityData/${qid}.json`);
    const entity = entityPayload?.entities?.[qid] ?? {};

    const labels = normalizeLangMap(entity.labels);
    const descriptions = normalizeLangMap(entity.descriptions);
    const aliases = extractAliases(entity.aliases);
    const claims = entity.claims ?? {};

    return {
      qid,
      labels,
      descriptions,
      aliases,
      properties: {
        claims_count: Object.keys(claims).length
      },
      sameAsUris: [
        `https://www.wikidata.org/wiki/${qid}`,
        labels.en ? `https://en.wikipedia.org/wiki/${encodeURIComponent(labels.en.replace(/\s+/g, "_"))}` : undefined
      ].filter(Boolean) as string[]
    };
  }
}

function normalizeLangMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") {
    return {};
  }

  const out: Record<string, string> = {};
  for (const [lang, info] of Object.entries(value as Record<string, any>)) {
    if (info?.value) {
      out[lang] = String(info.value);
    }
  }
  return out;
}

function extractAliases(value: unknown): string[] {
  if (!value || typeof value !== "object") {
    return [];
  }
  const aliases: string[] = [];
  for (const list of Object.values(value as Record<string, any[]>)) {
    if (Array.isArray(list)) {
      for (const item of list) {
        if (item?.value) aliases.push(String(item.value));
      }
    }
  }
  return Array.from(new Set(aliases));
}
