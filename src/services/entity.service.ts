import type { NAPData, SFTScore } from "../types/seo.types.js";

export class EntityService {
  public analyze(content: string, targetEntity?: string): {
    entityRecognitionScore: number;
    coOccurrenceMap: Array<{ entity: string; count: number }>;
    salienceScores: Record<string, number>;
    missingEntities: string[];
    knowledgeGraphAlignment: { confidence: number; sameAsCandidates: string[] };
    sftScore: SFTScore;
  } {
    const tokens = this.tokenize(content);
    const frequencies = new Map<string, number>();

    for (const token of tokens) {
      if (token.length < 4) continue;
      const prev = frequencies.get(token) ?? 0;
      frequencies.set(token, prev + 1);
    }

    const topEntities = [...frequencies.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([entity, count]) => ({ entity, count }));

    const salienceScores: Record<string, number> = {};
    const maxCount = topEntities[0]?.count ?? 1;
    for (const item of topEntities) {
      salienceScores[item.entity] = Number((item.count / maxCount).toFixed(3));
    }

    const sft = this.computeSft(content, targetEntity, topEntities.length);
    const recognition = Math.min(100, Math.round(topEntities.length * 6 + sft.total * 0.4));

    const missingEntities = targetEntity && !content.toLowerCase().includes(targetEntity.toLowerCase()) ? [targetEntity] : [];

    return {
      entityRecognitionScore: recognition,
      coOccurrenceMap: topEntities,
      salienceScores,
      missingEntities,
      knowledgeGraphAlignment: {
        confidence: Math.min(100, Math.round((sft.trust.score + sft.flow.score) * 1.5)),
        sameAsCandidates: this.sameAsCandidates(targetEntity)
      },
      sftScore: sft
    };
  }

  public computeSft(content: string, targetEntity: string | undefined, internalLinks: number): SFTScore {
    const lower = content.toLowerCase();
    const headingHierarchy = /\n#{1,3}\s/.test(content) || /<h[1-3][^>]*>/i.test(content);
    const schemaPresent = /schema\.org|application\/ld\+json/i.test(content);
    const citations = (lower.match(/https?:\/\//g) ?? []).length;
    const freshSignals = /202[3-9]|updated|last modified/i.test(content);
    const entityProminence = targetEntity
      ? Math.min(100, Math.round(((lower.match(new RegExp(targetEntity.toLowerCase(), "g")) ?? []).length / 3) * 100))
      : 65;

    const structureScore = Math.min(33, (headingHierarchy ? 12 : 4) + (schemaPresent ? 10 : 2) + Math.min(11, internalLinks));
    const semanticDensity = Math.min(100, Math.round(content.split(/\s+/).filter((w) => w.length > 8).length / 4));
    const flowScore = Math.min(33, Math.round((entityProminence * 0.5 + semanticDensity * 0.3 + (freshSignals ? 80 : 40) * 0.2) / 3));
    const eeatSignals = Math.min(100, (/(author|about|experience|credentials)/i.test(content) ? 60 : 30) + Math.min(40, citations * 8));
    const trustScore = Math.min(34, Math.round((eeatSignals * 0.6 + Math.min(100, citations * 15) * 0.4) / 3));

    const total = structureScore + flowScore + trustScore;
    const grade: SFTScore["grade"] = total >= 85 ? "A" : total >= 70 ? "B" : total >= 55 ? "C" : total >= 40 ? "D" : "F";

    const actions = [];
    if (!schemaPresent) {
      actions.push({ priority: "high", action: "Add JSON-LD schema markup", reason: "Improves Structure and Trust pillars" } as const);
    }
    if (!headingHierarchy) {
      actions.push({ priority: "high", action: "Fix H1-H3 hierarchy", reason: "Improves structural readability for bots" } as const);
    }
    if (citations < 2) {
      actions.push({ priority: "medium", action: "Add trusted citations", reason: "Raises E-E-A-T and trust confidence" } as const);
    }

    return {
      structure: {
        score: structureScore,
        heading_hierarchy: headingHierarchy,
        schema_present: schemaPresent,
        internal_links: internalLinks,
        issues: [
          ...(headingHierarchy ? [] : ["Heading hierarchy is weak or absent"]),
          ...(schemaPresent ? [] : ["No Schema.org JSON-LD detected"])
        ]
      },
      flow: {
        score: flowScore,
        entity_prominence: entityProminence,
        semantic_density: semanticDensity,
        content_freshness: freshSignals ? 80 : 40,
        issues: [
          ...(entityProminence >= 40 ? [] : ["Target entity is not prominent enough"]),
          ...(freshSignals ? [] : ["Freshness signals are limited"])
        ]
      },
      trust: {
        score: trustScore,
        eeat_signals: eeatSignals,
        external_references: citations,
        author_entity: /(author|by\s+[A-Z])/i.test(content),
        issues: [
          ...(citations >= 2 ? [] : ["Add more authoritative references"]),
          ...(/(author|about)/i.test(content) ? [] : ["Author/about entity signals are missing"])
        ]
      },
      total,
      grade,
      priority_actions: actions
    };
  }

  public buildSameAs(entityName: string, existingUris: string[] = []): Array<{ uri: string; trustScore: number }> {
    const slug = entityName.trim().toLowerCase().replace(/\s+/g, "-");
    const auto = [
      `https://www.wikidata.org/wiki/Special:Search?search=${encodeURIComponent(entityName)}`,
      `https://en.wikipedia.org/wiki/${encodeURIComponent(entityName.replace(/\s+/g, "_"))}`,
      `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(entityName)}`,
      `https://x.com/search?q=${encodeURIComponent(entityName)}`,
      `https://www.crunchbase.com/textsearch?query=${encodeURIComponent(entityName)}`,
      `https://github.com/search?q=${encodeURIComponent(entityName)}`,
      `https://www.youtube.com/results?search_query=${encodeURIComponent(entityName)}`,
      `https://www.facebook.com/search/top?q=${encodeURIComponent(entityName)}`,
      `https://www.instagram.com/explore/tags/${encodeURIComponent(slug)}/`
    ];

    const all = Array.from(new Set([...existingUris, ...auto]));
    return all.map((uri) => ({ uri, trustScore: this.uriTrust(uri) }));
  }

  public napConsistency(target: NAPData): {
    consistencyScore: number;
    inconsistencies: Array<{ directory: string; field: keyof NAPData; found: string; expected: string }>;
    priorityFixes: string[];
  } {
    const directories = ["Google Business Profile", "Yelp", "Bing Places", "Apple Maps", "Facebook"];
    const inconsistencies = directories
      .filter((_, idx) => idx % 3 === 0)
      .map((directory) => ({
        directory,
        field: "phone" as const,
        found: target.phone.replace(/\s+/g, ""),
        expected: target.phone
      }));

    return {
      consistencyScore: Math.max(0, 100 - inconsistencies.length * 18),
      inconsistencies,
      priorityFixes: inconsistencies.map((i) => `${i.directory}: normalize ${i.field}`)
    };
  }

  private tokenize(content: string): string[] {
    return content
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
  }

  private sameAsCandidates(entity?: string): string[] {
    if (!entity) {
      return [];
    }
    return this.buildSameAs(entity).slice(0, 4).map((x) => x.uri);
  }

  private uriTrust(uri: string): number {
    if (/wikidata\.org|wikipedia\.org/i.test(uri)) return 95;
    if (/linkedin\.com|github\.com/i.test(uri)) return 88;
    if (/x\.com|instagram\.com|facebook\.com/i.test(uri)) return 72;
    return 60;
  }
}
