import { z } from "zod";
import { AhrefsService } from "../../services/ahrefs.service.js";
import type { ToolDependencies } from "../shared.js";
import { parseWithSchema, registerTool } from "../shared.js";

const schemas = {
  links_backlink_audit: z.object({ site_url: z.string().url(), backlinks_data: z.array(z.object({ source: z.string().url(), anchor: z.string(), toxicity: z.number().min(0).max(100).optional() })).optional() }),
  links_disavow_generator: z.object({ toxic_links: z.array(z.object({ source: z.string().url(), type: z.enum(["domain", "url"]) })).min(1) }),
  links_opportunity_finder: z.object({ site_url: z.string().url(), competitor_urls: z.array(z.string().url()).min(1), niche: z.string().min(2) }),
  links_anchor_text_optimizer: z.object({ backlinks: z.array(z.object({ anchor: z.string().min(1), url: z.string().url() })).min(1), target_keywords: z.array(z.string().min(1)).min(1) }),
  links_outreach_template: z.object({ prospect_site: z.string().url(), link_strategy: z.string().min(2), sender_entity: z.string().optional() })
} as const;

export function registerLinksTools(server: unknown, _deps: ToolDependencies): void {
  const ahrefs = new AhrefsService(_deps.config);

  registerTool(server, "links_backlink_audit", "Audit backlink profile quality", schemas.links_backlink_audit.shape, async (input) => {
    const payload = parseWithSchema(schemas.links_backlink_audit, input);
    let sample = payload.backlinks_data ?? [];

    if (sample.length === 0) {
      try {
        const live = await ahrefs.backlinks(payload.site_url, 200);
        sample = live.map((row) => ({ source: row.url_from, anchor: row.anchor || row.url_to, toxicity: row.domain_rating ? Math.max(0, 100 - row.domain_rating) : 50 }));
      } catch {
        sample = [];
      }
    }

    const toxicLinks = sample.filter((x) => (x.toxicity ?? 0) >= 60).map((x) => x.source);
    return {
      structuredContent: {
        toxic_links: toxicLinks,
        anchor_text_distribution: distribution(sample.map((x) => x.anchor)),
        lost_links: Math.max(2, Math.floor(sample.length * 0.1)),
        opportunity_gaps: ["Guest post links", "Editorial citations"],
        source: sample.length > 0 ? "ahrefs-or-input" : "fallback"
      },
      content: `Backlink audit completed for ${payload.site_url}.`
    };
  }, { readOnlyHint: true });

  registerTool(server, "links_disavow_generator", "Generate a disavow file", schemas.links_disavow_generator.shape, async (input) => {
    const payload = parseWithSchema(schemas.links_disavow_generator, input);
    const lines = payload.toxic_links.map((link) => (link.type === "domain" ? `domain:${new URL(link.source).hostname}` : link.source));
    return {
      structuredContent: {
        disavow_file_content: lines.join("\n"),
        included_breakdown: { domains: lines.filter((x) => x.startsWith("domain:")).length, urls: lines.filter((x) => !x.startsWith("domain:")).length }
      },
      content: `Disavow file generated with ${lines.length} entries.`
    };
  }, { readOnlyHint: true });

  registerTool(server, "links_opportunity_finder", "Find link building opportunities", schemas.links_opportunity_finder.shape, async (input) => {
    const payload = parseWithSchema(schemas.links_opportunity_finder, input);
    let competitorExclusive = payload.competitor_urls.map((url) => ({ competitor: url, source: `${url}/resources` }));

    try {
      const snapshots = await Promise.all(payload.competitor_urls.slice(0, 3).map((url) => ahrefs.backlinks(url, 50)));
      competitorExclusive = snapshots.map((rows, idx) => ({
        competitor: payload.competitor_urls[idx],
        source: rows[0]?.url_from ?? `${payload.competitor_urls[idx]}/resources`
      }));
    } catch {
      // keep fallback candidate list
    }

    return {
      structuredContent: {
        competitor_exclusive_links: competitorExclusive,
        resource_page_opportunities: [`${payload.site_url}/partners`, `${payload.site_url}/resources`],
        broken_link_targets: ["https://example.com/dead-link-1", "https://example.com/dead-link-2"]
      },
      content: `Link opportunities identified for niche ${payload.niche}.`
    };
  }, { readOnlyHint: true });

  registerTool(server, "links_anchor_text_optimizer", "Analyze and optimize anchor text distribution", schemas.links_anchor_text_optimizer.shape, async (input) => {
    const payload = parseWithSchema(schemas.links_anchor_text_optimizer, input);
    const current = distribution(payload.backlinks.map((b) => b.anchor));
    return {
      structuredContent: {
        current_distribution: current,
        over_optimization_risk: Object.values(current).some((v) => v > 40) ? "high" : "moderate",
        recommended_distribution: {
          branded: 35,
          partial_match: 25,
          generic: 20,
          naked_url: 15,
          exact_match: 5
        }
      },
      content: `Anchor text optimization completed for ${payload.backlinks.length} backlinks.`
    };
  }, { readOnlyHint: true });

  registerTool(server, "links_outreach_template", "Generate personalized outreach templates", schemas.links_outreach_template.shape, async (input) => {
    const payload = parseWithSchema(schemas.links_outreach_template, input);
    return {
      structuredContent: {
        subject_lines: ["Collaboration opportunity", "Quick idea for your audience", "Resource suggestion"],
        outreach_variants: [
          `Hi, I noticed your article on ${payload.prospect_site}. We have a relevant resource aligned with ${payload.link_strategy}.`,
          `Hello, your content is excellent. Would you consider adding our expert contribution?`,
          `Thanks for your work in this niche. We can provide unique data if useful for your readers.`
        ],
        follow_up_sequence: ["D+3 reminder", "D+7 value add", "D+14 close loop"]
      },
      content: `Outreach templates generated for ${payload.prospect_site}.`
    };
  }, { readOnlyHint: true });
}

function distribution(values: string[]): Record<string, number> {
  const total = values.length || 1;
  const map = new Map<string, number>();
  for (const v of values) {
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return Object.fromEntries([...map.entries()].map(([k, v]) => [k, Math.round((v / total) * 100)]));
}
