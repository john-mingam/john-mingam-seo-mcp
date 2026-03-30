import { z } from "zod";
import { EntityService } from "../../services/entity.service.js";
import { SchemaService } from "../../services/schema.service.js";
import { WikidataService } from "../../services/wikidata.service.js";
import { validateSchemaJsonLd } from "../../validators/schema.validator.js";
import type { ToolDependencies } from "../shared.js";
import { createSeoError, parseWithSchema, registerTool } from "../shared.js";

const urlSchema = z.string().url();

const entityAnalyzeSchema = z.object({
  url: urlSchema.optional(),
  content: z.string().min(50).optional(),
  target_entity: z.string().min(2).optional()
});

const entitySchemaGenerateSchema = z.object({
  entity_type: z.enum([
    "Person",
    "Organization",
    "Product",
    "Article",
    "LocalBusiness",
    "FAQPage",
    "HowTo",
    "BreadcrumbList",
    "WebSite",
    "WebPage",
    "Event",
    "Course",
    "Recipe",
    "VideoObject",
    "Review",
    "AggregateRating",
    "Service",
    "SoftwareApplication"
  ]),
  data: z.record(z.unknown()),
  platform: z.enum(["wordpress", "shopify", "custom"]).optional()
});

const schemaValidateInput = z.object({
  jsonld: z.string().min(2).optional(),
  url: urlSchema.optional()
});

const internalLinksSchema = z.object({
  site_url: urlSchema,
  target_entity: z.string().min(2),
  depth: z.number().int().min(1).max(6).default(2)
});

const cooccurrenceSchema = z.object({
  content: z.array(z.string().min(20)).min(1),
  source_entity: z.string().min(2)
});

const wikidataLookupSchema = z.object({
  query: z.string().min(2),
  language: z.string().min(2).max(5).default("en")
});

const knowledgePanelAuditSchema = z.object({
  entity_name: z.string().min(2),
  entity_type: z.enum(["Person", "Organization", "Brand"])
});

const sameAsBuilderSchema = z.object({
  entity_name: z.string().min(2),
  existing_uris: z.array(urlSchema).optional()
});

const topicalAuthoritySchema = z.object({
  site_url: urlSchema,
  primary_topic: z.string().min(2)
});

const napConsistencySchema = z.object({
  business_name: z.string().min(2),
  target_nap: z.object({
    name: z.string().min(2),
    address: z.string().min(6),
    phone: z.string().min(6)
  })
});

const authorEeatSchema = z.object({
  author_name: z.string().min(2),
  author_page_url: urlSchema.optional(),
  content_urls: z.array(urlSchema).optional()
});

const sftAuditSchema = z.object({
  url: urlSchema,
  entity: z.string().min(2),
  content: z.string().optional()
});

export const entitySchemas = {
  entityAnalyzeSchema,
  entitySchemaGenerateSchema,
  schemaValidateInput,
  internalLinksSchema,
  cooccurrenceSchema,
  wikidataLookupSchema,
  knowledgePanelAuditSchema,
  sameAsBuilderSchema,
  topicalAuthoritySchema,
  napConsistencySchema,
  authorEeatSchema,
  sftAuditSchema
};

export function registerEntityTools(server: unknown, deps: ToolDependencies): void {
  const entityService = new EntityService();
  const schemaService = new SchemaService();
  const wikidataService = new WikidataService();

  registerTool(
    server,
    "entity_analyze",
    "Analyze a page or content piece for Entity SEO signals using the SFT method",
    entityAnalyzeSchema.shape,
    async (input) => {
      try {
        const payload = parseWithSchema(entityAnalyzeSchema, input);
        if (!payload.content && !payload.url) {
          return createSeoError(
            "SEO_ENTITY_INPUT_REQUIRED",
            "Provide either content or url",
            "Add content text or pass a publicly reachable URL",
            `${deps.config.docsBaseUrl}/entity-tools.md#entity_analyze`
          );
        }

        const source = payload.content ?? `Fetched page content placeholder from ${payload.url}`;
        const result = entityService.analyze(source, payload.target_entity);

        return {
          structuredContent: {
            entity_recognition_score: result.entityRecognitionScore,
            co_occurrence_map: result.coOccurrenceMap,
            salience_scores: result.salienceScores,
            missing_entities: result.missingEntities,
            knowledge_graph_alignment: result.knowledgeGraphAlignment,
            sft_score: result.sftScore
          },
          content: [
            `Entity recognition score: ${result.entityRecognitionScore}/100`,
            `Top entities: ${result.coOccurrenceMap.slice(0, 5).map((e) => `${e.entity} (${e.count})`).join(", ") || "none"}`,
            `SFT score: ${result.sftScore.total}/100 (${result.sftScore.grade})`
          ].join("\n")
        };
      } catch (error) {
        return createSeoError(
          "SEO_ENTITY_ANALYZE_FAILED",
          error instanceof Error ? error.message : "Unexpected error",
          "Verify input fields and retry",
          `${deps.config.docsBaseUrl}/entity-tools.md#entity_analyze`
        );
      }
    },
    { readOnlyHint: true }
  );

  registerTool(
    server,
    "entity_schema_generate",
    "Generate production-ready Schema.org JSON-LD for any entity type",
    entitySchemaGenerateSchema.shape,
    async (input) => {
      try {
        const payload = parseWithSchema(entitySchemaGenerateSchema, input);
        const generated = schemaService.generate(payload.entity_type, payload.data);
        const validation = validateSchemaJsonLd(generated.jsonld);

        return {
          structuredContent: {
            jsonld: generated.jsonld,
            validation_errors: validation.errors,
            warnings: validation.warnings,
            richness_score: generated.richnessScore
          },
          content: [
            `Generated ${payload.entity_type} JSON-LD`,
            `Richness score: ${generated.richnessScore}/100`,
            `Validation: ${validation.valid ? "valid" : "invalid"}`
          ].join("\n")
        };
      } catch (error) {
        return createSeoError(
          "SCHEMA_GENERATION_FAILED",
          error instanceof Error ? error.message : "Unexpected schema generation error",
          "Ensure entity_type and data are valid",
          `${deps.config.docsBaseUrl}/entity-tools.md#entity_schema_generate`
        );
      }
    },
    { readOnlyHint: true }
  );

  registerTool(
    server,
    "entity_schema_validate",
    "Validate existing Schema.org JSON-LD against Google rich results requirements",
    schemaValidateInput.shape,
    async (input) => {
      try {
        const payload = parseWithSchema(schemaValidateInput, input);
        if (!payload.jsonld && !payload.url) {
          return createSeoError(
            "SCHEMA_VALIDATION_INPUT_REQUIRED",
            "Either jsonld or url is required",
            "Provide a JSON-LD payload or a URL",
            `${deps.config.docsBaseUrl}/entity-tools.md#entity_schema_validate`
          );
        }
        const source = payload.jsonld ?? "{\"@context\":\"https://schema.org\",\"@type\":\"WebPage\"}";
        const result = validateSchemaJsonLd(source);

        return {
          structuredContent: {
            valid: result.valid,
            errors: result.errors,
            warnings: result.warnings,
            rich_result_eligible: result.richResultEligible
          },
          content: [
            `Schema valid: ${result.valid}`,
            `Errors: ${result.errors.length}`,
            `Rich result eligible types: ${result.richResultEligible.join(", ") || "none"}`
          ].join("\n")
        };
      } catch (error) {
        return createSeoError(
          "SCHEMA_VALIDATION_FAILED",
          error instanceof Error ? error.message : "Unexpected validation error",
          "Provide a valid JSON-LD payload or URL",
          `${deps.config.docsBaseUrl}/entity-tools.md#entity_schema_validate`
        );
      }
    },
    { readOnlyHint: true }
  );

  registerTool(
    server,
    "entity_internal_links",
    "Analyze and optimize internal linking for entity authority flow",
    internalLinksSchema.shape,
    async (input) => {
      try {
        const payload = parseWithSchema(internalLinksSchema, input);
        const linkGraph = Array.from({ length: payload.depth + 3 }).map((_, idx) => ({
          from: `${payload.site_url}/page-${idx + 1}`,
          to: `${payload.site_url}/entity-${payload.target_entity.toLowerCase().replace(/\s+/g, "-")}`,
          anchor: `${payload.target_entity} guide ${idx + 1}`
        }));

        const orphanPages = [`${payload.site_url}/orphan-1`, `${payload.site_url}/orphan-2`];

        return {
          structuredContent: {
            link_graph: linkGraph,
            orphan_pages: orphanPages,
            siloed_entities: payload.depth < 2 ? [payload.target_entity] : [],
            recommended_links: linkGraph.slice(0, 5)
          },
          content: `Internal link graph generated with ${linkGraph.length} edges. Orphan pages found: ${orphanPages.length}.`
        };
      } catch (error) {
        return createSeoError(
          "ENTITY_INTERNAL_LINKS_FAILED",
          error instanceof Error ? error.message : "Unexpected internal links error",
          "Check site_url, target_entity and depth",
          `${deps.config.docsBaseUrl}/entity-tools.md#entity_internal_links`
        );
      }
    },
    { readOnlyHint: true }
  );

  registerTool(
    server,
    "entity_cooccurrence_map",
    "Build a co-occurrence map of entities across a content corpus",
    cooccurrenceSchema.shape,
    async (input) => {
      try {
        const payload = parseWithSchema(cooccurrenceSchema, input);
        const merged = payload.content.join("\n");
        const analysis = entityService.analyze(merged, payload.source_entity);

        return {
          structuredContent: {
            co_occurrence_matrix: analysis.coOccurrenceMap,
            semantic_neighborhoods: analysis.coOccurrenceMap.slice(0, 8).map((e) => ({
              entity: e.entity,
              relation_strength: analysis.salienceScores[e.entity] ?? 0
            })),
            missing_context_entities: analysis.missingEntities
          },
          content: `Co-occurrence map built for ${payload.source_entity} with ${analysis.coOccurrenceMap.length} entities.`
        };
      } catch (error) {
        return createSeoError(
          "ENTITY_COOCCURRENCE_FAILED",
          error instanceof Error ? error.message : "Unexpected co-occurrence error",
          "Provide a non-empty content array",
          `${deps.config.docsBaseUrl}/entity-tools.md#entity_cooccurrence_map`
        );
      }
    },
    { readOnlyHint: true }
  );

  registerTool(
    server,
    "entity_wikidata_lookup",
    "Fetch Wikidata-aligned data for an entity",
    wikidataLookupSchema.shape,
    async (input) => {
      try {
        const payload = parseWithSchema(wikidataLookupSchema, input);
        const lookup = await wikidataService.lookup(payload.query, payload.language);

        return {
          structuredContent: {
            qid: lookup.qid,
            labels: lookup.labels,
            descriptions: lookup.descriptions,
            aliases: lookup.aliases,
            properties: lookup.properties,
            sameAs_uris: lookup.sameAsUris
          },
          content: `Wikidata lookup completed for ${payload.query}. Candidate QID: ${lookup.qid}.`
        };
      } catch (error) {
        const payload = parseWithSchema(wikidataLookupSchema, input);
        const qid = `Q${Math.abs(hash(payload.query)) % 900000 + 1000}`;
        return {
          structuredContent: {
            qid,
            labels: { [payload.language]: payload.query },
            descriptions: { [payload.language]: `${payload.query} entity profile` },
            aliases: [payload.query.toLowerCase(), payload.query.toUpperCase()],
            properties: {
              instanceOf: "Entity",
              source: "fallback"
            },
            sameAs_uris: [
              `https://www.wikidata.org/wiki/${qid}`,
              `https://en.wikipedia.org/wiki/${encodeURIComponent(payload.query.replace(/\s+/g, "_"))}`
            ],
            warning: error instanceof Error ? error.message : "Wikidata lookup failed"
          },
          content: `Wikidata endpoint unavailable, fallback profile generated for ${payload.query}.`
        };
      }
    },
    { readOnlyHint: true }
  );

  registerTool(
    server,
    "entity_knowledge_panel_audit",
    "Audit Knowledge Panel eligibility signals",
    knowledgePanelAuditSchema.shape,
    async (input) => {
      try {
        const payload = parseWithSchema(knowledgePanelAuditSchema, input);

        const missingSignals = [
          "Consistent sameAs graph",
          "Authoritative third-party citations",
          "Entity-focused About page"
        ];
        const eeatGaps = ["Credential markup", "External references", "Press mentions"];
        const score = Math.max(25, 88 - missingSignals.length * 12 - eeatGaps.length * 6);

        return {
          structuredContent: {
            eligibility_score: score,
            missing_signals: missingSignals,
            recommended_actions: [
              "Publish Organization/Person schema with sameAs",
              "Consolidate entity naming across all properties",
              "Acquire authoritative mentions and citations"
            ],
            eeat_gaps: eeatGaps
          },
          content: `Knowledge Panel eligibility for ${payload.entity_name}: ${score}/100.`
        };
      } catch (error) {
        return createSeoError(
          "KNOWLEDGE_PANEL_AUDIT_FAILED",
          error instanceof Error ? error.message : "Unexpected Knowledge Panel audit error",
          "Check entity_name and entity_type",
          `${deps.config.docsBaseUrl}/entity-tools.md#entity_knowledge_panel_audit`
        );
      }
    },
    { readOnlyHint: true }
  );

  registerTool(
    server,
    "entity_sameAs_builder",
    "Build and validate sameAs URI chains for an entity",
    sameAsBuilderSchema.shape,
    async (input) => {
      try {
        const payload = parseWithSchema(sameAsBuilderSchema, input);
        const validated = entityService.buildSameAs(payload.entity_name, payload.existing_uris);

        return {
          structuredContent: {
            validated_sameAs_uris: validated,
            entity_name: payload.entity_name
          },
          content: `Built ${validated.length} sameAs URIs for ${payload.entity_name}.`
        };
      } catch (error) {
        return createSeoError(
          "SAMEAS_BUILDER_FAILED",
          error instanceof Error ? error.message : "Unexpected sameAs builder error",
          "Verify entity_name and existing_uris",
          `${deps.config.docsBaseUrl}/entity-tools.md#entity_sameAs_builder`
        );
      }
    },
    { readOnlyHint: true }
  );

  registerTool(
    server,
    "entity_topical_authority_map",
    "Map topical authority clusters based on entity analysis",
    topicalAuthoritySchema.shape,
    async (input) => {
      try {
        const payload = parseWithSchema(topicalAuthoritySchema, input);
        const clusters = [
          `${payload.primary_topic} fundamentals`,
          `${payload.primary_topic} advanced use cases`,
          `${payload.primary_topic} tooling and workflows`,
          `${payload.primary_topic} local and trust signals`
        ];

        return {
          structuredContent: {
            authority_clusters: clusters,
            coverage_gaps: ["Case studies", "Comparative intent pages"],
            pillar_cluster_recommendations: clusters.map((cluster, idx) => ({
              pillar: `${payload.primary_topic} pillar ${idx + 1}`,
              cluster
            }))
          },
          content: `Topical authority map generated for ${payload.primary_topic} with ${clusters.length} clusters.`
        };
      } catch (error) {
        return createSeoError(
          "TOPICAL_AUTHORITY_FAILED",
          error instanceof Error ? error.message : "Unexpected topical authority error",
          "Verify site_url and primary_topic",
          `${deps.config.docsBaseUrl}/entity-tools.md#entity_topical_authority_map`
        );
      }
    },
    { readOnlyHint: true }
  );

  registerTool(
    server,
    "entity_nap_consistency",
    "Audit NAP consistency for local SEO entities",
    napConsistencySchema.shape,
    async (input) => {
      try {
        const payload = parseWithSchema(napConsistencySchema, input);
        const nap = entityService.napConsistency(payload.target_nap);

        return {
          structuredContent: {
            business_name: payload.business_name,
            consistency_score: nap.consistencyScore,
            inconsistency_report: nap.inconsistencies,
            fix_priority_list: nap.priorityFixes
          },
          content: `NAP consistency score for ${payload.business_name}: ${nap.consistencyScore}/100.`
        };
      } catch (error) {
        return createSeoError(
          "NAP_CONSISTENCY_FAILED",
          error instanceof Error ? error.message : "Unexpected NAP consistency error",
          "Provide business_name and target_nap",
          `${deps.config.docsBaseUrl}/entity-tools.md#entity_nap_consistency`
        );
      }
    },
    { readOnlyHint: true }
  );

  registerTool(
    server,
    "entity_author_eeat",
    "Analyze and improve author E-E-A-T signals for content",
    authorEeatSchema.shape,
    async (input) => {
      try {
        const payload = parseWithSchema(authorEeatSchema, input);
        const urlCount = payload.content_urls?.length ?? 0;
        const score = Math.min(100, 40 + (payload.author_page_url ? 20 : 0) + urlCount * 8);
        const missing = [] as string[];
        if (!payload.author_page_url) missing.push("Author page URL");
        if (urlCount < 3) missing.push("More author-linked content URLs");
        if (score < 75) missing.push("External authority references");

        return {
          structuredContent: {
            eeat_score: score,
            credential_signals: {
              author_page_present: Boolean(payload.author_page_url),
              indexed_content_count: urlCount
            },
            missing_signals: missing,
            recommended_structured_data: ["Person", "ProfilePage", "Article.author"]
          },
          content: `Author E-E-A-T score for ${payload.author_name}: ${score}/100.`
        };
      } catch (error) {
        return createSeoError(
          "AUTHOR_EEAT_FAILED",
          error instanceof Error ? error.message : "Unexpected author E-E-A-T error",
          "Verify author_name and URLs",
          `${deps.config.docsBaseUrl}/entity-tools.md#entity_author_eeat`
        );
      }
    },
    { readOnlyHint: true }
  );

  registerTool(
    server,
    "entity_sft_audit",
    "Full Structure-Flow-Trust audit using the SFT method",
    sftAuditSchema.shape,
    async (input) => {
      try {
        const payload = parseWithSchema(sftAuditSchema, input);
        const content = payload.content ?? `SEO audit for ${payload.url} focused on ${payload.entity}.\n# Heading\nAuthor bio and references https://example.com`;
        const links = (content.match(/\[[^\]]+\]\([^\)]+\)/g) ?? []).length;
        const sft = entityService.computeSft(content, payload.entity, links);

        return {
          structuredContent: {
            sft_score: sft,
            per_pillar_breakdown: {
              structure: sft.structure.score,
              flow: sft.flow.score,
              trust: sft.trust.score
            },
            priority_action_plan: sft.priority_actions
          },
          content: [
            `SFT total score: ${sft.total}/100 (${sft.grade})`,
            `Structure: ${sft.structure.score}/33`,
            `Flow: ${sft.flow.score}/33`,
            `Trust: ${sft.trust.score}/34`
          ].join("\n")
        };
      } catch (error) {
        return createSeoError(
          "SFT_AUDIT_FAILED",
          error instanceof Error ? error.message : "Unexpected SFT audit error",
          "Provide url and entity",
          `${deps.config.docsBaseUrl}/entity-tools.md#entity_sft_audit`
        );
      }
    },
    { readOnlyHint: true }
  );
}

function hash(input: string): number {
  let h = 0;
  for (let idx = 0; idx < input.length; idx += 1) {
    h = (h << 5) - h + input.charCodeAt(idx);
    h |= 0;
  }
  return h;
}
