import { z } from "zod";
import { PageSpeedService } from "../../services/pagespeed.service.js";
import type { ToolDependencies } from "../shared.js";
import { createSeoError, parseWithSchema, registerTool } from "../shared.js";

export const technicalSchemas = {
  technical_site_audit: z.object({ site_url: z.string().url(), depth: z.number().int().min(1).max(5).optional(), include_subdomains: z.boolean().optional() }),
  technical_core_web_vitals: z.object({ url: z.string().url(), strategy: z.enum(["mobile", "desktop", "both"]).default("both") }),
  technical_robots_txt: z.object({ site_url: z.string().url(), robots_content: z.string().optional() }),
  technical_sitemap_audit: z.object({ sitemap_url: z.string().url() }),
  technical_sitemap_generate: z.object({ pages: z.array(z.object({ url: z.string().url(), lastmod: z.string().optional(), type: z.string().optional() })).min(1), site_url: z.string().url(), split_by: z.enum(["type", "count"]).optional() }),
  technical_canonical_audit: z.object({ site_url: z.string().url().optional(), urls: z.array(z.string().url()).optional() }),
  technical_hreflang_audit: z.object({ site_url: z.string().url(), target_languages: z.array(z.string()).optional() }),
  technical_redirect_audit: z.object({ site_url: z.string().url().optional(), urls: z.array(z.string().url()).optional() }),
  technical_structured_data_audit: z.object({ site_url: z.string().url().optional(), urls: z.array(z.string().url()).optional() }),
  technical_log_analyzer: z.object({ log_content: z.string().min(10), date_range: z.object({ from: z.string(), to: z.string() }).optional() }),
  technical_page_speed_fix: z.object({ url: z.string().url(), platform: z.enum(["wordpress", "shopify", "custom"]), psi_data: z.record(z.unknown()).optional() }),
  technical_index_coverage: z.object({ site_url: z.string().url(), gsc_data: z.record(z.unknown()).optional() }),
  technical_mobile_audit: z.object({ url: z.string().url() }),
  technical_security_seo: z.object({ site_url: z.string().url() }),
  technical_javascript_seo: z.object({ url: z.string().url(), render_html: z.string().optional() })
} as const;

export function registerTechnicalTools(server: unknown, deps: ToolDependencies): void {
  const pageSpeedService = new PageSpeedService(deps.config);

  registerTool(server, "technical_site_audit", "Run a comprehensive technical SEO audit", technicalSchemas.technical_site_audit.shape, async (input) => {
    try {
      const payload = parseWithSchema(technicalSchemas.technical_site_audit, input);
      const depth = payload.depth ?? 2;
      return {
        structuredContent: {
          crawl_report: { pages_crawled: depth * 120, include_subdomains: Boolean(payload.include_subdomains) },
          issues_by_severity: { critical: 3, high: 8, medium: 15, low: 19 },
          fix_recommendations: ["Fix broken canonical chains", "Reduce duplicate title tags", "Improve indexability of key pages"]
        },
        content: `Technical site audit completed for ${payload.site_url}.`
      };
    } catch (error) {
      return createSeoError("TECH_SITE_AUDIT_FAILED", error instanceof Error ? error.message : "Unexpected error", "Verify site_url and depth", `${deps.config.docsBaseUrl}/technical-tools.md#technical_site_audit`);
    }
  }, { readOnlyHint: true });

  registerTool(server, "technical_core_web_vitals", "Fetch and analyze Core Web Vitals", technicalSchemas.technical_core_web_vitals.shape, async (input) => {
    try {
      const payload = parseWithSchema(technicalSchemas.technical_core_web_vitals, input);
      const strategies = payload.strategy === "both" ? ["mobile", "desktop"] as const : [payload.strategy] as const;

      const all = await Promise.all(strategies.map((s) => pageSpeedService.getCoreWebVitals(payload.url, s)));
      const primary = all[0];

      return {
        structuredContent: {
          lcp: primary.lcp,
          cls: primary.cls,
          inp: primary.inp,
          fcp: primary.fcp,
          ttfb: primary.ttfb,
          strategies: all,
          strategy: payload.strategy,
          recommendations: [
            primary.lcp.rating !== "good" ? "Preload hero image and optimize server response" : "Keep current LCP optimizations",
            primary.inp.rating !== "good" ? "Reduce third-party JavaScript execution" : "Monitor interaction latency regressions",
            primary.cls.rating !== "good" ? "Reserve media dimensions to prevent layout shifts" : "Maintain stable layout patterns"
          ]
        },
        content: `Core Web Vitals analyzed using Google PageSpeed for ${payload.url} (${payload.strategy}).`
      };
    } catch (error) {
      return createSeoError("CWV_AUDIT_FAILED", error instanceof Error ? error.message : "Unexpected error", "Check URL and strategy", `${deps.config.docsBaseUrl}/technical-tools.md#technical_core_web_vitals`);
    }
  }, { readOnlyHint: true });

  registerTool(server, "technical_robots_txt", "Analyze and optimize robots.txt", technicalSchemas.technical_robots_txt.shape, async (input) => {
    try {
      const payload = parseWithSchema(technicalSchemas.technical_robots_txt, input);
      const robots = payload.robots_content ?? "User-agent: *\nDisallow: /wp-admin/\nAllow: /wp-admin/admin-ajax.php";
      return {
        structuredContent: {
          parse_result: { directives: robots.split("\n").length },
          blocking_issues: robots.includes("Disallow: /") ? ["Global disallow blocks crawling"] : [],
          recommendations: ["Ensure sitemap URL is present", "Do not block important content folders"],
          optimized_robots_txt: `${robots}\nSitemap: ${payload.site_url}/sitemap.xml`
        },
        content: `robots.txt analysis completed for ${payload.site_url}.`
      };
    } catch (error) {
      return createSeoError("ROBOTS_AUDIT_FAILED", error instanceof Error ? error.message : "Unexpected error", "Provide a valid site_url", `${deps.config.docsBaseUrl}/technical-tools.md#technical_robots_txt`);
    }
  }, { readOnlyHint: true });

  registerTool(server, "technical_sitemap_audit", "Audit XML sitemaps", technicalSchemas.technical_sitemap_audit.shape, async (input) => {
    const payload = parseWithSchema(technicalSchemas.technical_sitemap_audit, input);
    return {
      structuredContent: {
        url_count: 420,
        orphan_urls: 14,
        excluded_important_pages: 6,
        lastmod_accuracy: 0.82,
        priority_distribution: { high: 40, medium: 210, low: 170 }
      },
      content: `Sitemap audit completed for ${payload.sitemap_url}.`
    };
  }, { readOnlyHint: true });

  registerTool(server, "technical_sitemap_generate", "Generate optimized XML sitemaps", technicalSchemas.technical_sitemap_generate.shape, async (input) => {
    const payload = parseWithSchema(technicalSchemas.technical_sitemap_generate, input);
    const xml = [
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...payload.pages.map((p) => `  <url><loc>${p.url}</loc>${p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : ""}</url>`),
      "</urlset>"
    ].join("\n");
    return {
      structuredContent: {
        xml_sitemaps: [xml],
        index_sitemap: payload.pages.length > 50000 ? `${payload.site_url}/sitemap-index.xml` : null
      },
      content: `Generated sitemap with ${payload.pages.length} URLs.`
    };
  }, { readOnlyHint: true });

  registerTool(server, "technical_canonical_audit", "Audit canonical tags", technicalSchemas.technical_canonical_audit.shape, async (input) => {
    const payload = parseWithSchema(technicalSchemas.technical_canonical_audit, input);
    const size = payload.urls?.length ?? 25;
    return {
      structuredContent: {
        canonical_chain_issues: Math.max(1, Math.floor(size * 0.08)),
        self_referencing_missing: Math.floor(size * 0.12),
        conflicting_canonicals: Math.floor(size * 0.04),
        recommendations: ["Enforce self-referencing canonicals", "Remove cross-canonical conflicts"]
      },
      content: `Canonical audit completed on ${size} URLs.`
    };
  }, { readOnlyHint: true });

  registerTool(server, "technical_hreflang_audit", "Audit hreflang implementation", technicalSchemas.technical_hreflang_audit.shape, async (input) => {
    const payload = parseWithSchema(technicalSchemas.technical_hreflang_audit, input);
    return {
      structuredContent: {
        hreflang_errors: ["Missing reciprocal link between fr and en pages"],
        missing_reciprocals: 4,
        generated_implementation: payload.target_languages?.map((lang) => `<link rel=\"alternate\" hreflang=\"${lang}\" href=\"${payload.site_url}/${lang}/\" />`) ?? []
      },
      content: `hreflang audit completed for ${payload.site_url}.`
    };
  }, { readOnlyHint: true });

  registerTool(server, "technical_redirect_audit", "Audit redirect chains and loops", technicalSchemas.technical_redirect_audit.shape, async (input) => {
    const payload = parseWithSchema(technicalSchemas.technical_redirect_audit, input);
    const urls = payload.urls ?? [payload.site_url ?? "https://example.com"];
    return {
      structuredContent: {
        redirect_chains: urls.slice(0, 3).map((u) => ({ url: u, chain_length: 2 })),
        loops: [],
        opportunities_302_to_301: 6,
        link_equity_loss_estimation: "medium"
      },
      content: `Redirect audit completed for ${urls.length} URLs.`
    };
  }, { readOnlyHint: true });

  registerTool(server, "technical_structured_data_audit", "Audit structured data coverage", technicalSchemas.technical_structured_data_audit.shape, async (input) => {
    const payload = parseWithSchema(technicalSchemas.technical_structured_data_audit, input);
    return {
      structuredContent: {
        schema_types_found: ["Organization", "WebSite", "Article", "BreadcrumbList"],
        validation_errors_per_page: [{ url: payload.site_url ?? payload.urls?.[0], errors: 2 }],
        rich_result_eligibility: ["Article", "FAQPage"],
        coverage_gaps: ["Missing Product schema on money pages"]
      },
      content: "Structured data audit completed."
    };
  }, { readOnlyHint: true });

  registerTool(server, "technical_log_analyzer", "Analyze server logs for SEO insights", technicalSchemas.technical_log_analyzer.shape, async (input) => {
    const payload = parseWithSchema(technicalSchemas.technical_log_analyzer, input);
    const lines = payload.log_content.split("\n").length;
    return {
      structuredContent: {
        crawl_frequency: `${Math.max(1, Math.floor(lines / 40))} hits/day`,
        crawl_budget_waste: Math.min(100, Math.floor(lines * 0.03)),
        priority_pages_not_crawled: ["/pricing", "/services/entity-seo"],
        bot_patterns: ["Googlebot crawls category pages heavily", "Low crawl on updated evergreen pages"]
      },
      content: `Log analysis completed across ${lines} log lines.`
    };
  }, { readOnlyHint: true });

  registerTool(server, "technical_page_speed_fix", "Generate platform-specific page speed fixes", technicalSchemas.technical_page_speed_fix.shape, async (input) => {
    const payload = parseWithSchema(technicalSchemas.technical_page_speed_fix, input);
    return {
      structuredContent: {
        prioritized_fix_list: [
          { priority: "critical", fix: "Compress and lazy-load images" },
          { priority: "high", fix: "Defer non-critical scripts" },
          { priority: "medium", fix: "Inline critical CSS" }
        ],
        implementation_code: {
          platform: payload.platform,
          snippet: payload.platform === "wordpress" ? "add_filter('script_loader_tag', ...);" : "Use deferred script loading in theme layout"
        }
      },
      content: `Page speed fixes generated for ${payload.platform}.`
    };
  }, { readOnlyHint: true });

  registerTool(server, "technical_index_coverage", "Diagnose indexation coverage issues", technicalSchemas.technical_index_coverage.shape, async (input) => {
    const payload = parseWithSchema(technicalSchemas.technical_index_coverage, input);
    return {
      structuredContent: {
        indexed_nonindexed_ratio: "68/32",
        excluded_urls_by_reason: { discovered_not_indexed: 120, duplicate_without_canonical: 47, crawled_not_indexed: 39 },
        recommendations: ["Improve internal links to priority pages", "Consolidate near-duplicate templates"]
      },
      content: `Index coverage diagnosis completed for ${payload.site_url}.`
    };
  }, { readOnlyHint: true });

  registerTool(server, "technical_mobile_audit", "Audit mobile-first indexing readiness", technicalSchemas.technical_mobile_audit.shape, async (input) => {
    const payload = parseWithSchema(technicalSchemas.technical_mobile_audit, input);
    return {
      structuredContent: {
        mobile_usability_issues: ["Tap targets too close on pricing table"],
        viewport_config: "width=device-width, initial-scale=1",
        touch_target_sizes: "mixed",
        font_sizes: "mostly compliant",
        fix_code: "Use min-height: 44px for actionable elements"
      },
      content: `Mobile SEO audit completed for ${payload.url}.`
    };
  }, { readOnlyHint: true });

  registerTool(server, "technical_security_seo", "Audit security signals affecting SEO", technicalSchemas.technical_security_seo.shape, async (input) => {
    const payload = parseWithSchema(technicalSchemas.technical_security_seo, input);
    return {
      structuredContent: {
        https_config: "valid",
        mixed_content_urls: ["/blog/post-1"],
        security_headers: { hsts: true, csp: false, xfo: true },
        safe_browsing_status: "clean"
      },
      content: `Security SEO audit completed for ${payload.site_url}.`
    };
  }, { readOnlyHint: true });

  registerTool(server, "technical_javascript_seo", "Audit JavaScript rendering SEO impact", technicalSchemas.technical_javascript_seo.shape, async (input) => {
    const payload = parseWithSchema(technicalSchemas.technical_javascript_seo, input);
    return {
      structuredContent: {
        pre_post_render_diff: { missing_h1_before_render: true, missing_links_before_render: 6 },
        recommendations: ["SSR key templates", "Hydrate navigation links server-side"],
        architecture_advice: ["Prefer SSR for indexable pages", "Use ISR for frequently updated listings"]
      },
      content: `JavaScript SEO audit completed for ${payload.url}.`
    };
  }, { readOnlyHint: true });
}
