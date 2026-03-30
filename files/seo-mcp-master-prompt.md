# MASTER PROMPT — SEO MCP Server (by John Mingam)

You are an elite Senior MCP Server Architect and Advanced SEO Engineer with 15+ years of combined expertise in:
- Entity SEO, Knowledge Graphs, and Schema.org structured data
- Technical SEO (Core Web Vitals, crawlability, indexation)
- WordPress internals (REST API, WP-CLI, database, hooks)
- Shopify (Storefront API, Admin API, metafields, themes)
- Custom CMS architecture (headless, API-first, hybrid)
- Model Context Protocol (MCP) design and TypeScript SDK

Your mission is to design and implement a production-grade MCP server called **`seo-mcp`**, created by John Mingam (Entity SEO expert, Wikidata Q127330925, johnmingam.com), that gives any Claude-compatible AI agent full SEO superpowers across WordPress, Shopify, and custom CMS platforms.

---

## ARCHITECTURE OVERVIEW

### Server Identity
- **Name**: `john-mingam-seo-mcp`
- **Version**: `1.0.0`
- **Author**: John Mingam — https://johnmingam.com
- **License**: MIT
- **Transport**: Streamable HTTP (remote) + stdio (local/dev)
- **Language**: TypeScript (Node.js 20+)
- **Registry**: npm + GitHub

---

## PLATFORM ADAPTERS

The server must implement a **unified adapter pattern**. Each platform (WordPress, Shopify, Custom CMS) exposes the same tool interface but with platform-specific implementations.

### Adapter Interface
```typescript
interface SEOPlatformAdapter {
  platform: 'wordpress' | 'shopify' | 'custom';
  connect(config: PlatformConfig): Promise<void>;
  getPage(identifier: string): Promise<SEOPage>;
  updatePage(identifier: string, updates: SEOPageUpdates): Promise<UpdateResult>;
  listPages(filters: PageFilters): Promise<SEOPage[]>;
  getSiteMetadata(): Promise<SiteMetadata>;
  // ... full interface
}
```

---

## COMPLETE TOOL REGISTRY (65 tools)

### 🔍 CATEGORY 1 — ENTITY SEO & KNOWLEDGE GRAPH (12 tools)

#### `entity_analyze`
Analyze a page or content piece for Entity SEO signals using the SFT method (Structure, Flow, Trust).
- Input: `{ url: string, content?: string, target_entity?: string }`
- Output: Entity recognition score, co-occurrence map, salience score, missing entities, knowledge graph alignment
- Annotations: `readOnlyHint: true`

#### `entity_schema_generate`
Generate production-ready Schema.org JSON-LD for any entity type.
- Input: `{ entity_type: SchemaOrgType, data: Record<string, unknown>, platform: Platform }`
- Output: `{ jsonld: string, validation_errors: string[], richness_score: number }`
- Supports: Person, Organization, Product, Article, LocalBusiness, FAQPage, HowTo, BreadcrumbList, WebSite, WebPage, Event, Course, Recipe, VideoObject, Review, AggregateRating

#### `entity_schema_validate`
Validate existing Schema.org JSON-LD against Google's Rich Results requirements.
- Input: `{ jsonld: string | url: string }`
- Output: `{ valid: boolean, errors: ValidationError[], warnings: string[], rich_result_eligible: string[] }`

#### `entity_internal_links`
Analyze and optimize internal linking for entity authority flow.
- Input: `{ site_url: string, target_entity: string, depth?: number }`
- Output: Link graph, orphan pages, siloed entities, recommended links with anchor text

#### `entity_cooccurrence_map`
Build a co-occurrence map of entities across a site or content corpus.
- Input: `{ content: string[], source_entity: string }`
- Output: Co-occurrence matrix, semantic neighborhoods, missing context entities

#### `entity_wikidata_lookup`
Fetch Wikidata data for an entity to align content with the Knowledge Graph.
- Input: `{ query: string, language?: string }`
- Output: QID, labels, descriptions, aliases, properties, sameAs URIs

#### `entity_knowledge_panel_audit`
Audit a brand/person entity for Knowledge Panel eligibility.
- Input: `{ entity_name: string, entity_type: 'Person' | 'Organization' | 'Brand' }`
- Output: Eligibility score, missing signals, recommended actions, E-E-A-T gaps

#### `entity_sameAs_builder`
Build and validate sameAs URI chains for an entity.
- Input: `{ entity_name: string, existing_uris?: string[] }`
- Output: Validated sameAs URIs (Wikidata, Wikipedia, LinkedIn, Twitter, etc.), trust score per URI

#### `entity_topical_authority_map`
Map topical authority clusters for a site based on entity analysis.
- Input: `{ site_url: string, primary_topic: string }`
- Output: Authority clusters, coverage gaps, pillar/cluster recommendations

#### `entity_nap_consistency`
Audit NAP (Name, Address, Phone) consistency for local SEO entities.
- Input: `{ business_name: string, target_nap: NAPData }`
- Output: Inconsistency report across 50+ directories, fix priority list

#### `entity_author_eeat`
Analyze and improve author E-E-A-T signals for content.
- Input: `{ author_name: string, author_page_url?: string, content_urls?: string[] }`
- Output: E-E-A-T score, credential signals, missing signals, recommended structured data

#### `entity_sft_audit`
Full Structure-Flow-Trust audit using John Mingam's proprietary SFT method.
- Input: `{ url: string, entity: string }`
- Output: SFT score (0-100), per-pillar breakdown, priority action plan

---

### 🏗️ CATEGORY 2 — TECHNICAL SEO (15 tools)

#### `technical_site_audit`
Run a comprehensive technical SEO audit.
- Input: `{ site_url: string, depth?: number, include_subdomains?: boolean }`
- Output: Crawl report, issues by severity (critical/high/medium/low), fix recommendations

#### `technical_core_web_vitals`
Fetch and analyze Core Web Vitals (CrUX data + lab data).
- Input: `{ url: string, strategy?: 'mobile' | 'desktop' | 'both' }`
- Output: LCP, CLS, INP, FCP, TTFB — field/lab data, improvement recommendations

#### `technical_robots_txt`
Analyze and optimize robots.txt.
- Input: `{ site_url: string, robots_content?: string }`
- Output: Parse result, blocking issues, recommendations, generated optimized robots.txt

#### `technical_sitemap_audit`
Audit XML sitemaps for completeness and accuracy.
- Input: `{ sitemap_url: string }`
- Output: URL count, orphan URLs, excluded important pages, lastmod accuracy, priority distribution

#### `technical_sitemap_generate`
Generate optimized XML sitemaps.
- Input: `{ pages: SitemapPage[], site_url: string, split_by?: 'type' | 'count' }`
- Output: XML sitemap string(s), index sitemap if multiple

#### `technical_canonical_audit`
Audit canonical tags across a site or URL set.
- Input: `{ urls: string[] | site_url: string }`
- Output: Canonical chain issues, self-referencing, conflicting canonicals, recommendations

#### `technical_hreflang_audit`
Audit and generate hreflang implementation.
- Input: `{ site_url: string, target_languages?: string[] }`
- Output: Hreflang errors, missing reciprocals, generated correct implementation

#### `technical_redirect_audit`
Audit redirect chains and loops.
- Input: `{ urls: string[] | site_url: string }`
- Output: Redirect chains, loops, 302→301 opportunities, link equity loss estimation

#### `technical_structured_data_audit`
Audit all structured data across a site.
- Input: `{ site_url: string | urls: string[] }`
- Output: Schema types found, validation errors per page, rich result eligibility, coverage gaps

#### `technical_log_analyzer`
Analyze server logs for SEO insights (Googlebot behavior).
- Input: `{ log_content: string, date_range?: DateRange }`
- Output: Crawl frequency, crawl budget waste, priority pages not crawled, bot patterns

#### `technical_page_speed_fix`
Generate platform-specific page speed fixes.
- Input: `{ url: string, platform: Platform, psi_data?: PSIData }`
- Output: Prioritized fix list with implementation code per platform

#### `technical_index_coverage`
Check and diagnose indexation coverage issues.
- Input: `{ site_url: string, gsc_data?: GSCData }`
- Output: Indexed/non-indexed ratio, excluded URLs by reason, fix recommendations

#### `technical_mobile_audit`
Audit mobile-first indexing readiness.
- Input: `{ url: string }`
- Output: Mobile usability issues, viewport config, touch target sizes, font sizes, fix code

#### `technical_security_seo`
Audit security signals that affect SEO (HTTPS, mixed content, malware flags).
- Input: `{ site_url: string }`
- Output: HTTPS config, mixed content URLs, security headers, Google Safe Browsing status

#### `technical_javascript_seo`
Audit JavaScript rendering and SEO impact.
- Input: `{ url: string, render_html?: string }`
- Output: Pre/post-render content diff, dynamic rendering recommendations, SSR/ISR/SSG advice

---

### 📝 CATEGORY 3 — ON-PAGE SEO & CONTENT (13 tools)

#### `onpage_audit`
Full on-page SEO audit for a URL.
- Input: `{ url: string, target_keyword?: string, target_entity?: string }`
- Output: Title, meta desc, H1-H6 structure, keyword density, entity presence, score/100

#### `onpage_title_optimize`
Generate optimized title tags.
- Input: `{ current_title?: string, target_keyword: string, brand?: string, page_type: PageType, char_limit?: number }`
- Output: 5 title variants ranked by CTR potential, character count, SERP preview

#### `onpage_meta_description_optimize`
Generate optimized meta descriptions.
- Input: `{ content_summary: string, target_keyword: string, cta?: string }`
- Output: 5 meta description variants, character count, preview

#### `onpage_heading_structure`
Analyze and optimize heading hierarchy.
- Input: `{ content: string | url: string, target_entity?: string }`
- Output: Current heading tree, issues, recommended restructured headings

#### `onpage_content_brief`
Generate a full SEO content brief.
- Input: `{ target_keyword: string, target_entity?: string, competitor_urls?: string[], audience?: string }`
- Output: Brief with entity map, semantic fields, heading structure, word count target, FAQ section, Schema recommendations

#### `onpage_content_score`
Score content against SEO and Entity SEO criteria.
- Input: `{ content: string, target_keyword: string, target_entity?: string }`
- Output: Score/100 across 12 criteria, improvement priority list

#### `onpage_keyword_research`
Research keywords with entity and intent mapping.
- Input: `{ seed_keyword: string, language?: string, country?: string }`
- Output: Keyword clusters by intent, entity associations, difficulty estimates, opportunity score

#### `onpage_faq_generator`
Generate FAQ sections optimized for FAQPage Schema and SGE.
- Input: `{ topic: string, entity?: string, count?: number, existing_content?: string }`
- Output: FAQ pairs with Schema.org FAQPage JSON-LD, People Also Ask alignment

#### `onpage_semantic_field`
Build the semantic field (champ sémantique) for a topic.
- Input: `{ topic: string, entity?: string, depth?: number }`
- Output: Primary terms, secondary terms, LSI terms, entity co-occurrences, missing coverage

#### `onpage_alt_text_audit`
Audit and generate optimized image alt texts.
- Input: `{ url: string | images: ImageData[] }`
- Output: Missing alt texts, non-descriptive alts, generated replacements with entity context

#### `onpage_internal_link_suggest`
Suggest internal links for a piece of content.
- Input: `{ content: string, site_pages: SitePage[], target_entity?: string }`
- Output: Recommended internal links with anchor text, placement context, entity flow rationale

#### `onpage_content_refresh`
Identify and prioritize content to refresh for SEO.
- Input: `{ pages: PageMetrics[], threshold_days?: number }`
- Output: Prioritized refresh list, freshness scores, recommended updates per page

#### `onpage_serp_analysis`
Analyze SERP features and competitors for a keyword.
- Input: `{ keyword: string, country?: string }`
- Output: SERP features present, top 10 analysis, content gaps, featured snippet opportunity

---

### 🔗 CATEGORY 4 — LINK BUILDING & AUTHORITY (5 tools)

#### `links_backlink_audit`
Audit backlink profile quality.
- Input: `{ site_url: string, backlinks_data?: BacklinkData[] }`
- Output: Toxic links, anchor text distribution, lost links, opportunity gaps

#### `links_disavow_generator`
Generate a disavow file from backlink audit data.
- Input: `{ toxic_links: ToxicLink[] }`
- Output: Google-formatted disavow file content, included domain/URL breakdown

#### `links_opportunity_finder`
Find link building opportunities.
- Input: `{ site_url: string, competitor_urls: string[], niche: string }`
- Output: Competitor-exclusive links, resource page opportunities, broken link targets

#### `links_anchor_text_optimizer`
Analyze and optimize anchor text distribution.
- Input: `{ backlinks: BacklinkData[], target_keywords: string[] }`
- Output: Current distribution chart, over-optimization risk, recommended distribution

#### `links_outreach_template`
Generate personalized outreach email templates.
- Input: `{ prospect_site: string, link_strategy: LinkStrategy, sender_entity?: string }`
- Output: 3 outreach email variants, subject lines, follow-up sequence

---

### 🏪 CATEGORY 5 — PLATFORM-SPECIFIC TOOLS (13 tools)

#### WORDPRESS (5 tools)

##### `wp_seo_plugin_config`
Generate optimal configuration for Yoast SEO / Rank Math / SEOPress.
- Input: `{ plugin: 'yoast' | 'rankmath' | 'seopress', site_type: SiteType, entity_config?: EntityConfig }`
- Output: Plugin settings JSON, import-ready configuration, Schema.org setup

##### `wp_page_seo_update`
Update SEO fields on WordPress pages/posts via REST API.
- Input: `{ wp_url: string, credentials: WPCredentials, post_id: number, seo_updates: SEOUpdates }`
- Output: Update confirmation, before/after comparison
- Annotations: `destructiveHint: false, idempotentHint: true`

##### `wp_bulk_seo_update`
Bulk update SEO metadata across WordPress posts.
- Input: `{ wp_url: string, credentials: WPCredentials, filters: PostFilters, updates: BulkSEOUpdates }`
- Output: Updated posts count, skipped posts, error log
- Annotations: `destructiveHint: false`

##### `wp_schema_inject`
Inject Schema.org JSON-LD into WordPress pages.
- Input: `{ wp_url: string, credentials: WPCredentials, post_id: number, schema: JSONLDSchema }`
- Output: Injection confirmation, validation result

##### `wp_redirect_manager`
Manage 301/302 redirects in WordPress (via Redirection plugin or .htaccess).
- Input: `{ wp_url: string, credentials: WPCredentials, action: 'add'|'remove'|'list', redirects?: RedirectRule[] }`
- Output: Redirect operation result, current redirect count

#### SHOPIFY (5 tools)

##### `shopify_seo_audit`
Full SEO audit of a Shopify store.
- Input: `{ shop_domain: string, credentials: ShopifyCredentials }`
- Output: Store-wide SEO score, product/collection/page issues, duplicate content map, recommended fixes

##### `shopify_product_seo_update`
Update SEO fields on Shopify products.
- Input: `{ shop_domain: string, credentials: ShopifyCredentials, product_id: string, seo_updates: ProductSEOUpdates }`
- Output: Update confirmation, before/after

##### `shopify_collection_seo_update`
Update SEO fields on Shopify collections.
- Input: `{ shop_domain: string, credentials: ShopifyCredentials, collection_id: string, seo_updates: CollectionSEOUpdates }`
- Output: Update confirmation

##### `shopify_metafields_schema`
Manage Shopify metafields for structured SEO data.
- Input: `{ shop_domain: string, credentials: ShopifyCredentials, resource_type: ShopifyResourceType, metafields: MetafieldDefinition[] }`
- Output: Metafield setup confirmation, Schema.org alignment report

##### `shopify_canonical_fix`
Fix duplicate content and canonical issues specific to Shopify.
- Input: `{ shop_domain: string, credentials: ShopifyCredentials }`
- Output: Canonical issues found (variant URLs, collection/product overlap, pagination), liquid code fixes

#### CUSTOM CMS (3 tools)

##### `cms_api_seo_read`
Read SEO data from any CMS via REST/GraphQL API.
- Input: `{ api_url: string, auth: APIAuth, endpoint_config: CMSEndpointConfig }`
- Output: Extracted SEO fields, field mapping, coverage completeness

##### `cms_api_seo_write`
Write SEO data to any CMS via REST/GraphQL API.
- Input: `{ api_url: string, auth: APIAuth, endpoint_config: CMSEndpointConfig, updates: SEOUpdates }`
- Output: Write confirmation, fields updated

##### `cms_headless_schema_strategy`
Generate a Schema.org strategy for headless/custom CMS architectures.
- Input: `{ content_types: ContentType[], site_url: string, architecture: 'headless' | 'hybrid' | 'traditional' }`
- Output: Schema strategy per content type, implementation guide, JSON-LD templates

---

### 📊 CATEGORY 6 — REPORTING & MONITORING (7 tools)

#### `report_seo_dashboard`
Generate a complete SEO dashboard data payload.
- Input: `{ site_url: string, gsc_data?: GSCData, analytics_data?: AnalyticsData, period?: DateRange }`
- Output: KPI summary, trends, top opportunities, action items — JSON or Markdown format

#### `report_entity_health`
Generate an Entity SEO health report.
- Input: `{ site_url: string, primary_entity: string }`
- Output: Entity visibility score, Knowledge Graph presence, Schema coverage, SFT score, recommendations

#### `report_competitor_analysis`
Generate a competitor SEO analysis.
- Input: `{ target_site: string, competitors: string[], metrics: CompetitorMetric[] }`
- Output: Gap analysis, entity coverage comparison, keyword overlap, authority comparison

#### `report_content_performance`
Analyze content performance from an SEO perspective.
- Input: `{ pages: PagePerformanceData[], period: DateRange }`
- Output: Top/worst performers, decay detection, refresh priority list, cannibalization alerts

#### `report_schema_coverage`
Report on Schema.org implementation coverage across a site.
- Input: `{ site_url: string }`
- Output: Schema types per page type, coverage %, missing opportunities, implementation priority

#### `report_gsc_insights`
Parse and extract actionable insights from Google Search Console data.
- Input: `{ gsc_export: GSCData, site_url: string }`
- Output: CTR opportunities, impression gaps, keyword clustering, position tracking

#### `report_monthly_seo`
Generate a complete monthly SEO report (client-ready).
- Input: `{ site_url: string, period: DateRange, branding?: ReportBranding, data_sources: DataSources }`
- Output: Full Markdown/HTML monthly report with executive summary, KPIs, wins, issues, next month plan

---

## IMPLEMENTATION REQUIREMENTS

### TypeScript Project Structure
```
seo-mcp/
├── src/
│   ├── index.ts                 # Server entry point
│   ├── server.ts                # MCP server setup
│   ├── config.ts                # Configuration management
│   ├── adapters/
│   │   ├── base.adapter.ts      # Abstract platform adapter
│   │   ├── wordpress.adapter.ts
│   │   ├── shopify.adapter.ts
│   │   └── custom.adapter.ts
│   ├── tools/
│   │   ├── entity/              # 12 entity tools
│   │   ├── technical/           # 15 technical tools
│   │   ├── onpage/              # 13 on-page tools
│   │   ├── links/               # 5 link tools
│   │   ├── platform/            # 13 platform tools
│   │   └── reporting/           # 7 reporting tools
│   ├── services/
│   │   ├── schema.service.ts    # Schema.org generation
│   │   ├── entity.service.ts    # Entity analysis
│   │   ├── http.service.ts      # HTTP client
│   │   └── cache.service.ts     # Redis caching
│   ├── validators/
│   │   └── schema.validator.ts  # JSON-LD validation
│   └── types/
│       ├── seo.types.ts
│       ├── platform.types.ts
│       └── schema.types.ts
├── tests/
├── docs/
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

### Authentication Strategy
Support multiple auth methods per platform:
- WordPress: Application Passwords, JWT, OAuth
- Shopify: Admin API Key, OAuth, Storefront Token
- Custom CMS: Bearer Token, API Key, Basic Auth, OAuth2

### Caching Strategy
- Redis for API responses (TTL: 15min for live data, 24h for static analysis)
- In-memory LRU for schema generation results
- Cache invalidation on write operations

### Error Handling Standard
```typescript
// Every tool must use this error format
{
  error: {
    code: 'SEO_ENTITY_NOT_FOUND' | 'PLATFORM_AUTH_FAILED' | ...,
    message: string,         // Human-readable
    suggestion: string,      // Actionable next step
    docs_url?: string        // Link to relevant docs
  }
}
```

### Rate Limiting
- WordPress REST API: respect server limits, exponential backoff
- Shopify Admin API: 2 req/s bucket, queue management
- External APIs (PageSpeed, Wikidata): respect quotas, cache aggressively

---

## SCHEMA.ORG IMPLEMENTATION STANDARDS

Every schema generated must:
1. Use `@context: "https://schema.org"` 
2. Include `@id` with canonical URL
3. Pass Google Rich Results Test
4. Include `sameAs` for entity disambiguation
5. Use `mainEntityOfPage` for content pages
6. Support nested entities (Organization → ContactPoint, etc.)
7. Be minified for production, formatted for debugging

---

## SFT METHOD INTEGRATION

Every analysis tool must optionally output an SFT score:

```typescript
interface SFTScore {
  structure: {
    score: number;        // 0-33
    heading_hierarchy: boolean;
    schema_present: boolean;
    internal_links: number;
    issues: string[];
  };
  flow: {
    score: number;        // 0-33
    entity_prominence: number;
    semantic_density: number;
    content_freshness: number;
    issues: string[];
  };
  trust: {
    score: number;        // 0-34
    eeat_signals: number;
    external_references: number;
    author_entity: boolean;
    issues: string[];
  };
  total: number;          // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  priority_actions: PriorityAction[];
}
```

---

## OUTPUT FORMAT STANDARDS

Tools should return data in this priority order:
1. **structuredContent** (machine-parseable JSON with outputSchema)
2. **content[text]** (human-readable Markdown summary)
3. Never return raw HTML blobs — always parse and structure

---

## SECURITY REQUIREMENTS

- Never log credentials in plain text
- Mask API keys in all error messages and logs
- Validate all URLs before fetching (SSRF protection)
- Sanitize all user-provided content before use in API calls
- Support environment variable injection for all secrets
- Read-only mode: flag that disables all write tools

---

## DEPLOYMENT TARGETS

Generate configurations for:
1. **Claude Desktop** (stdio transport, local)
2. **Claude.ai MCP** (HTTP transport, remote)
3. **Docker** (containerized, production)
4. **Railway / Render** (PaaS one-click deploy)
5. **Vercel Edge Functions** (serverless)

---

Now implement this complete MCP server following the architecture above. Start with the core infrastructure (server.ts, adapters, types), then implement tools category by category starting with Entity SEO tools (highest priority). For each tool, implement full TypeScript with Zod validation, comprehensive error handling, and both structured output and human-readable text output.
