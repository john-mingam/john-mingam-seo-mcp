import { LRUCache } from "lru-cache";
import type { SchemaOrgType } from "../types/schema.types.js";

export class SchemaService {
  private readonly cache = new LRUCache<string, string>({ max: 500 });

  public generate(type: SchemaOrgType, data: Record<string, unknown>): { jsonld: string; richnessScore: number } {
    const key = `${type}:${JSON.stringify(data)}`;
    const cached = this.cache.get(key);
    if (cached) {
      return { jsonld: cached, richnessScore: this.computeRichness(data) };
    }

    const canonical = String(data.url ?? data.canonicalUrl ?? data["@id"] ?? "");

    const doc: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": type,
      "@id": canonical || undefined,
      ...data
    };

    if (!doc.sameAs && Array.isArray(data.sameAs)) {
      doc.sameAs = data.sameAs;
    }

    if (["Article", "WebPage", "Product", "FAQPage", "HowTo"].includes(type) && !doc.mainEntityOfPage && canonical) {
      doc.mainEntityOfPage = canonical;
    }

    const jsonld = JSON.stringify(doc);
    this.cache.set(key, jsonld);
    return { jsonld, richnessScore: this.computeRichness(data) };
  }

  private computeRichness(data: Record<string, unknown>): number {
    const keys = Object.keys(data).length;
    const sameAsBonus = Array.isArray(data.sameAs) ? Math.min(20, data.sameAs.length * 4) : 0;
    return Math.min(100, Math.round(keys * 5 + sameAsBonus));
  }
}
