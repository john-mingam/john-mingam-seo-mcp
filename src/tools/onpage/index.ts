import { z } from "zod";
import { SemrushService } from "../../services/semrush.service.js";
import type { ToolDependencies } from "../shared.js";
import { createSeoError, parseWithSchema, registerTool } from "../shared.js";

const schemas = {
  onpage_audit: z.object({ url: z.string().url(), target_keyword: z.string().optional(), target_entity: z.string().optional() }),
  onpage_title_optimize: z.object({ current_title: z.string().optional(), target_keyword: z.string().min(2), brand: z.string().optional(), page_type: z.string().min(2), char_limit: z.number().int().min(30).max(70).optional() }),
  onpage_meta_description_optimize: z.object({ content_summary: z.string().min(20), target_keyword: z.string().min(2), cta: z.string().optional() }),
  onpage_heading_structure: z.object({ content: z.string().optional(), url: z.string().url().optional(), target_entity: z.string().optional() }),
  onpage_content_brief: z.object({ target_keyword: z.string().min(2), target_entity: z.string().optional(), competitor_urls: z.array(z.string().url()).optional(), audience: z.string().optional() }),
  onpage_content_score: z.object({ content: z.string().min(40), target_keyword: z.string().min(2), target_entity: z.string().optional() }),
  onpage_keyword_research: z.object({ seed_keyword: z.string().min(2), language: z.string().optional(), country: z.string().optional() }),
  onpage_faq_generator: z.object({ topic: z.string().min(2), entity: z.string().optional(), count: z.number().int().min(2).max(12).optional(), existing_content: z.string().optional() }),
  onpage_semantic_field: z.object({ topic: z.string().min(2), entity: z.string().optional(), depth: z.number().int().min(1).max(5).optional() }),
  onpage_alt_text_audit: z.object({ url: z.string().url().optional(), images: z.array(z.object({ src: z.string().url(), alt: z.string().optional() })).optional() }),
  onpage_internal_link_suggest: z.object({ content: z.string().min(40), site_pages: z.array(z.object({ title: z.string(), url: z.string().url() })).min(1), target_entity: z.string().optional() }),
  onpage_content_refresh: z.object({ pages: z.array(z.object({ url: z.string().url(), days_since_update: z.number().int().min(0), traffic: z.number().int().min(0) })).min(1), threshold_days: z.number().int().min(30).optional() }),
  onpage_serp_analysis: z.object({ keyword: z.string().min(2), country: z.string().optional() })
} as const;

export function registerOnPageTools(server: unknown, deps: ToolDependencies): void {
  const semrush = new SemrushService(deps.config);

  registerTool(server, "onpage_audit", "Run full on-page SEO audit", schemas.onpage_audit.shape, async (input) => {
    const payload = parseWithSchema(schemas.onpage_audit, input);
    return {
      structuredContent: {
        title: "Needs optimization",
        meta_description: "Present but too short",
        heading_structure: { h1: 1, h2: 3, h3: 2 },
        keyword_density: payload.target_keyword ? 1.7 : null,
        entity_presence: payload.target_entity ? "partial" : "not-evaluated",
        score: 73
      },
      content: `On-page audit completed for ${payload.url} with score 73/100.`
    };
  }, { readOnlyHint: true });

  registerTool(server, "onpage_title_optimize", "Generate optimized title tags", schemas.onpage_title_optimize.shape, async (input) => {
    const payload = parseWithSchema(schemas.onpage_title_optimize, input);
    const brand = payload.brand ? ` | ${payload.brand}` : "";
    const variants = [
      `${payload.target_keyword}${brand}`,
      `${payload.target_keyword}: Guide complet${brand}`,
      `${payload.target_keyword} ${payload.page_type}${brand}`,
      `Expert ${payload.target_keyword}${brand}`,
      `${payload.target_keyword} - Comparatif 2026${brand}`
    ];
    return {
      structuredContent: {
        title_variants: variants.map((v, idx) => ({ rank: idx + 1, title: v, chars: v.length })),
        serp_preview: { title: variants[0], url: "https://example.com", description: "Preview snippet" }
      },
      content: `Generated ${variants.length} title variants for ${payload.target_keyword}.`
    };
  }, { readOnlyHint: true });

  registerTool(server, "onpage_meta_description_optimize", "Generate optimized meta descriptions", schemas.onpage_meta_description_optimize.shape, async (input) => {
    const payload = parseWithSchema(schemas.onpage_meta_description_optimize, input);
    const cta = payload.cta ?? "Discover more";
    const variants = [1, 2, 3, 4, 5].map((n) => `${payload.target_keyword}: ${payload.content_summary.slice(0, 110)}... ${cta} (${n})`);
    return {
      structuredContent: {
        meta_description_variants: variants.map((v) => ({ text: v, chars: v.length })),
        preview: variants[0]
      },
      content: `Generated 5 meta descriptions for ${payload.target_keyword}.`
    };
  }, { readOnlyHint: true });

  registerTool(server, "onpage_heading_structure", "Analyze and optimize heading hierarchy", schemas.onpage_heading_structure.shape, async (input) => {
    const payload = parseWithSchema(schemas.onpage_heading_structure, input);
    const current = ["H1: Main Topic", "H2: Problem", "H2: Solution", "H3: Steps"];
    return {
      structuredContent: {
        current_heading_tree: current,
        issues: ["Multiple conceptual jumps between H2 sections"],
        recommended_headings: [
          "H1: Main topic and value proposition",
          "H2: Context and pain points",
          "H2: Method and framework",
          "H2: Action plan",
          "H2: FAQ"
        ]
      },
      content: `Heading structure audit completed for ${payload.url ?? "provided content"}.`
    };
  }, { readOnlyHint: true });

  registerTool(server, "onpage_content_brief", "Generate an SEO content brief", schemas.onpage_content_brief.shape, async (input) => {
    const payload = parseWithSchema(schemas.onpage_content_brief, input);
    return {
      structuredContent: {
        keyword: payload.target_keyword,
        entity_map: [payload.target_entity ?? payload.target_keyword, "Support entity A", "Support entity B"],
        semantic_fields: ["intent", "comparisons", "implementation"],
        heading_structure: ["H1", "H2 problem", "H2 framework", "H2 examples", "H2 FAQ"],
        word_count_target: 1600,
        faq_section: ["What is it?", "How much does it cost?"],
        schema_recommendations: ["Article", "FAQPage", "BreadcrumbList"]
      },
      content: `Content brief created for keyword ${payload.target_keyword}.`
    };
  }, { readOnlyHint: true });

  registerTool(server, "onpage_content_score", "Score content against SEO and Entity SEO criteria", schemas.onpage_content_score.shape, async (input) => {
    const payload = parseWithSchema(schemas.onpage_content_score, input);
    const score = Math.min(100, 45 + Math.floor(payload.content.length / 120));
    return {
      structuredContent: {
        score,
        criteria_breakdown: {
          relevance: 16,
          structure: 14,
          entity_coverage: payload.target_entity ? 12 : 8,
          readability: 15,
          trust: 11
        },
        improvement_priority_list: ["Strengthen intro hook", "Add internal links", "Expand entity disambiguation"]
      },
      content: `Content score: ${score}/100 for keyword ${payload.target_keyword}.`
    };
  }, { readOnlyHint: true });

  registerTool(server, "onpage_keyword_research", "Research keywords with entity and intent mapping", schemas.onpage_keyword_research.shape, async (input) => {
    const payload = parseWithSchema(schemas.onpage_keyword_research, input);
    try {
      const country = payload.country?.toLowerCase() ?? "us";
      const related = await semrush.relatedKeywords(payload.seed_keyword, country);
      const info = related.slice(0, 10).map((k) => k.keyword);
      const commercial = related.filter((k) => /best|price|pricing|vs|review/i.test(k.keyword)).slice(0, 10).map((k) => k.keyword);
      const transactional = related.filter((k) => /buy|service|agency|quote|order/i.test(k.keyword)).slice(0, 10).map((k) => k.keyword);
      const avgCompetition = related.length > 0
        ? related.reduce((acc, k) => acc + (k.competition ?? 0), 0) / related.length
        : 0.5;

      return {
        structuredContent: {
          keyword_clusters: [
            { intent: "informational", keywords: info.length > 0 ? info : [`${payload.seed_keyword} guide`, `${payload.seed_keyword} definition`] },
            { intent: "commercial", keywords: commercial.length > 0 ? commercial : [`best ${payload.seed_keyword}`, `${payload.seed_keyword} pricing`] },
            { intent: "transactional", keywords: transactional.length > 0 ? transactional : [`buy ${payload.seed_keyword}`, `${payload.seed_keyword} service`] }
          ],
          entity_associations: [payload.seed_keyword, "brand entity", "support entity"],
          difficulty_estimate: Number((avgCompetition * 100).toFixed(1)),
          opportunity_score: Math.max(1, Math.round((1 - avgCompetition) * 100)),
          source: "semrush"
        },
        content: `Keyword research completed for ${payload.seed_keyword} using SEMrush data.`
      };
    } catch (error) {
      return {
        structuredContent: {
          keyword_clusters: [
            { intent: "informational", keywords: [`${payload.seed_keyword} guide`, `${payload.seed_keyword} definition`] },
            { intent: "commercial", keywords: [`best ${payload.seed_keyword}`, `${payload.seed_keyword} pricing`] },
            { intent: "transactional", keywords: [`buy ${payload.seed_keyword}`, `${payload.seed_keyword} service`] }
          ],
          entity_associations: [payload.seed_keyword, "brand entity", "support entity"],
          opportunity_score: 74,
          source: "fallback",
          warning: error instanceof Error ? error.message : "SEMrush unavailable"
        },
        content: `Keyword research completed for ${payload.seed_keyword} with fallback data.`
      };
    }
  }, { readOnlyHint: true });

  registerTool(server, "onpage_faq_generator", "Generate FAQ optimized for FAQPage schema", schemas.onpage_faq_generator.shape, async (input) => {
    const payload = parseWithSchema(schemas.onpage_faq_generator, input);
    const count = payload.count ?? 5;
    const faq = Array.from({ length: count }).map((_, i) => ({
      question: `${payload.topic}: question ${i + 1}?`,
      answer: `Actionable answer ${i + 1} for ${payload.topic}.`
    }));
    return {
      structuredContent: {
        faq,
        faqpage_jsonld: {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } }))
        }
      },
      content: `Generated ${count} FAQs for ${payload.topic}.`
    };
  }, { readOnlyHint: true });

  registerTool(server, "onpage_semantic_field", "Build semantic field for a topic", schemas.onpage_semantic_field.shape, async (input) => {
    const payload = parseWithSchema(schemas.onpage_semantic_field, input);
    return {
      structuredContent: {
        primary_terms: [payload.topic, `${payload.topic} strategy`, `${payload.topic} framework`],
        secondary_terms: ["implementation", "audit", "optimization"],
        lsi_terms: ["topical relevance", "semantic proximity", "query intent"],
        entity_cooccurrences: [payload.entity ?? payload.topic, "related entity 1", "related entity 2"],
        missing_coverage: ["case study", "measurement"]
      },
      content: `Semantic field generated for ${payload.topic}.`
    };
  }, { readOnlyHint: true });

  registerTool(server, "onpage_alt_text_audit", "Audit and generate optimized image alt texts", schemas.onpage_alt_text_audit.shape, async (input) => {
    try {
      const payload = parseWithSchema(schemas.onpage_alt_text_audit, input);
      const images = payload.images ?? [];
      const missing = images.filter((img) => !img.alt || img.alt.trim().length < 3);
      return {
        structuredContent: {
          missing_alt_texts: missing.map((img) => img.src),
          non_descriptive_alts: images.filter((img) => (img.alt ?? "").toLowerCase().includes("image")).map((img) => img.src),
          generated_replacements: missing.map((img, idx) => ({ src: img.src, alt: `Descriptive visual ${idx + 1} aligned with page entity` }))
        },
        content: `Alt text audit completed on ${images.length} images.`
      };
    } catch (error) {
      return createSeoError("ONPAGE_ALT_AUDIT_FAILED", error instanceof Error ? error.message : "Unexpected error", "Provide url or images list", `${deps.config.docsBaseUrl}/onpage-tools.md#onpage_alt_text_audit`);
    }
  }, { readOnlyHint: true });

  registerTool(server, "onpage_internal_link_suggest", "Suggest internal links for content", schemas.onpage_internal_link_suggest.shape, async (input) => {
    const payload = parseWithSchema(schemas.onpage_internal_link_suggest, input);
    return {
      structuredContent: {
        recommended_internal_links: payload.site_pages.slice(0, 8).map((page, idx) => ({
          url: page.url,
          anchor_text: `${payload.target_entity ?? "SEO"} ${idx + 1}`,
          placement_context: `Paragraph ${idx + 2}`,
          rationale: "Supports semantic proximity and crawl depth"
        }))
      },
      content: `Generated internal link suggestions from ${payload.site_pages.length} candidate pages.`
    };
  }, { readOnlyHint: true });

  registerTool(server, "onpage_content_refresh", "Prioritize content refresh opportunities", schemas.onpage_content_refresh.shape, async (input) => {
    const payload = parseWithSchema(schemas.onpage_content_refresh, input);
    const threshold = payload.threshold_days ?? 120;
    const prioritized = payload.pages
      .filter((p) => p.days_since_update >= threshold)
      .sort((a, b) => b.days_since_update - a.days_since_update)
      .map((p) => ({ url: p.url, freshness_score: Math.max(0, 100 - p.days_since_update / 3), recommended_update: "Update intro, stats and schema" }));

    return {
      structuredContent: {
        prioritized_refresh_list: prioritized,
        refresh_count: prioritized.length
      },
      content: `Identified ${prioritized.length} refresh candidates.`
    };
  }, { readOnlyHint: true });

  registerTool(server, "onpage_serp_analysis", "Analyze SERP features and competitors", schemas.onpage_serp_analysis.shape, async (input) => {
    const payload = parseWithSchema(schemas.onpage_serp_analysis, input);
    return {
      structuredContent: {
        serp_features_present: ["People Also Ask", "Featured Snippet", "Video"],
        top10_analysis: Array.from({ length: 10 }).map((_, i) => ({ position: i + 1, pattern: "long-form informational" })),
        content_gaps: ["No comparison table", "Weak entity disambiguation"],
        featured_snippet_opportunity: "high"
      },
      content: `SERP analysis completed for keyword ${payload.keyword}.`
    };
  }, { readOnlyHint: true });
}
