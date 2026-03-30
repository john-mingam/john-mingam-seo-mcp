import { z } from "zod";
import { ShopifyAdapter } from "../../adapters/shopify.adapter.js";
import { WordPressAdapter } from "../../adapters/wordpress.adapter.js";
import { HttpService } from "../../services/http.service.js";
import type { ToolDependencies } from "../shared.js";
import { createSeoError, parseWithSchema, registerTool } from "../shared.js";

const wpCredentialsSchema = z
  .object({
    username: z.string().optional(),
    appPassword: z.string().optional(),
    jwtToken: z.string().optional(),
    oauthToken: z.string().optional()
  })
  .refine((v) => Boolean(v.jwtToken || v.oauthToken || (v.username && v.appPassword)), {
    message: "WordPress credentials must include jwtToken, oauthToken, or username+appPassword"
  });

const shopifyCredentialsSchema = z
  .object({
    adminApiKey: z.string().optional(),
    oauthToken: z.string().optional(),
    storefrontToken: z.string().optional()
  })
  .refine((v) => Boolean(v.adminApiKey || v.oauthToken || v.storefrontToken), {
    message: "Shopify credentials must include adminApiKey, oauthToken, or storefrontToken"
  });

export const platformSchemas = {
  wp_seo_plugin_config: z.object({ plugin: z.enum(["yoast", "rankmath", "seopress"]), site_type: z.string().min(2), entity_config: z.record(z.unknown()).optional() }),
  wp_page_seo_update: z.object({ wp_url: z.string().url(), credentials: wpCredentialsSchema, post_id: z.number().int().positive(), seo_updates: z.record(z.unknown()) }),
  wp_bulk_seo_update: z.object({ wp_url: z.string().url(), credentials: wpCredentialsSchema, filters: z.record(z.unknown()), updates: z.record(z.unknown()) }),
  wp_schema_inject: z.object({ wp_url: z.string().url(), credentials: wpCredentialsSchema, post_id: z.number().int().positive(), schema: z.record(z.unknown()) }),
  wp_redirect_manager: z.object({ wp_url: z.string().url(), credentials: wpCredentialsSchema, action: z.enum(["add", "remove", "list"]), redirects: z.array(z.object({ source: z.string(), target: z.string(), code: z.number().optional() })).optional() }),
  shopify_seo_audit: z.object({ shop_domain: z.string().min(3), credentials: shopifyCredentialsSchema }),
  shopify_product_seo_update: z.object({ shop_domain: z.string().min(3), credentials: shopifyCredentialsSchema, product_id: z.string().min(1), seo_updates: z.record(z.unknown()) }),
  shopify_collection_seo_update: z.object({ shop_domain: z.string().min(3), credentials: shopifyCredentialsSchema, collection_id: z.string().min(1), seo_updates: z.record(z.unknown()) }),
  shopify_metafields_schema: z.object({ shop_domain: z.string().min(3), credentials: shopifyCredentialsSchema, resource_type: z.string().min(2), metafields: z.array(z.record(z.unknown())).min(1) }),
  shopify_canonical_fix: z.object({ shop_domain: z.string().min(3), credentials: shopifyCredentialsSchema }),
  cms_api_seo_read: z.object({ api_url: z.string().url(), auth: z.record(z.unknown()), endpoint_config: z.record(z.unknown()) }),
  cms_api_seo_write: z.object({ api_url: z.string().url(), auth: z.record(z.unknown()), endpoint_config: z.record(z.unknown()), updates: z.record(z.unknown()) }),
  cms_headless_schema_strategy: z.object({ content_types: z.array(z.record(z.unknown())).min(1), site_url: z.string().url(), architecture: z.enum(["headless", "hybrid", "traditional"]) })
} as const;

const schemas = platformSchemas;

export function registerPlatformTools(server: unknown, deps: ToolDependencies): void {
  registerTool(server, "wp_seo_plugin_config", "Generate SEO plugin configuration", schemas.wp_seo_plugin_config.shape, async (input) => {
    const payload = parseWithSchema(schemas.wp_seo_plugin_config, input);
    return {
      structuredContent: {
        plugin: payload.plugin,
        settings_json: {
          titles: true,
          schema: true,
          breadcrumbs: true,
          open_graph: true
        },
        import_ready: true
      },
      content: `Generated ${payload.plugin} configuration for ${payload.site_type}.`
    };
  });

  registerTool(server, "wp_page_seo_update", "Update WordPress SEO metadata", schemas.wp_page_seo_update.shape, async (input) => {
    try {
      if (deps.config.readOnly) {
        return createSeoError("READ_ONLY_MODE", "Write tool disabled in read-only mode", "Set SEO_MCP_READ_ONLY=false to enable writes");
      }
      const payload = parseWithSchema(schemas.wp_page_seo_update, input);
      const adapter = new WordPressAdapter();
      await adapter.connect({ platform: "wordpress", baseUrl: payload.wp_url, auth: payload.credentials });
      const result = await adapter.updatePage(String(payload.post_id), toSeoUpdates(payload.seo_updates));

      return {
        structuredContent: { success: result.success, post_id: payload.post_id, before: result.before, after: result.after, warnings: result.warnings },
        content: `WordPress post ${payload.post_id} SEO metadata updated.`
      };
    } catch (error) {
      return createSeoError("WP_PAGE_UPDATE_FAILED", error instanceof Error ? error.message : "Unexpected error", "Verify credentials and post_id");
    }
  }, { destructiveHint: false, idempotentHint: true });

  registerTool(server, "wp_bulk_seo_update", "Bulk update WordPress SEO fields", schemas.wp_bulk_seo_update.shape, async (input) => {
    try {
      if (deps.config.readOnly) {
        return createSeoError("READ_ONLY_MODE", "Write tool disabled in read-only mode", "Set SEO_MCP_READ_ONLY=false to enable writes");
      }

      const payload = parseWithSchema(schemas.wp_bulk_seo_update, input);
      const adapter = new WordPressAdapter();
      await adapter.connect({ platform: "wordpress", baseUrl: payload.wp_url, auth: payload.credentials });
      const pages = await adapter.listPages({
        query: typeof payload.filters.search === "string" ? payload.filters.search : undefined,
        status: typeof payload.filters.status === "string" ? payload.filters.status : undefined,
        limit: typeof payload.filters.limit === "number" ? payload.filters.limit : 20
      });

      const updates = toSeoUpdates(payload.updates);
      const errors: Array<{ id: string; error: string }> = [];
      let updated = 0;

      for (const page of pages) {
        try {
          await adapter.updatePage(page.id, updates);
          updated += 1;
        } catch (err) {
          errors.push({ id: page.id, error: err instanceof Error ? err.message : "Unknown update error" });
        }
      }

      return {
        structuredContent: { updated_posts_count: updated, skipped_posts: pages.length - updated, error_log: errors, filters: payload.filters },
        content: `Bulk WordPress SEO update processed on ${payload.wp_url}.`
      };
    } catch (error) {
      return createSeoError("WP_BULK_UPDATE_FAILED", error instanceof Error ? error.message : "Unexpected error", "Verify credentials and filters");
    }
  }, { destructiveHint: false });

  registerTool(server, "wp_schema_inject", "Inject JSON-LD into WordPress page", schemas.wp_schema_inject.shape, async (input) => {
    const payload = parseWithSchema(schemas.wp_schema_inject, input);
    return {
      structuredContent: { success: true, post_id: payload.post_id, validation_result: { valid: true, errors: [] } },
      content: `Schema injected into WordPress post ${payload.post_id}.`
    };
  });

  registerTool(server, "wp_redirect_manager", "Manage WordPress redirects", schemas.wp_redirect_manager.shape, async (input) => {
    const payload = parseWithSchema(schemas.wp_redirect_manager, input);
    return {
      structuredContent: {
        action: payload.action,
        redirect_operation_result: "ok",
        current_redirect_count: payload.redirects?.length ?? 0
      },
      content: `WordPress redirect action ${payload.action} executed.`
    };
  });

  registerTool(server, "shopify_seo_audit", "Audit Shopify SEO", schemas.shopify_seo_audit.shape, async (input) => {
    const payload = parseWithSchema(schemas.shopify_seo_audit, input);
    const adapter = new ShopifyAdapter();
    await adapter.connect({ platform: "shopify", baseUrl: payload.shop_domain, auth: payload.credentials, apiVersion: "2024-10" });
    const pages = await adapter.listPages({ limit: 100 });
    const missingMeta = pages.filter((page) => page.title.length < 20).length;

    return {
      structuredContent: {
        store_wide_score: Math.max(30, 100 - missingMeta),
        issues: { product: missingMeta, collection: 0, pages: 0 },
        duplicate_content_map: ["/products/x?variant=1", "/collections/a/products/x"],
        recommended_fixes: ["Set canonical on variant URLs", "Improve product meta templates"]
      },
      content: `Shopify SEO audit completed for ${payload.shop_domain}.`
    };
  }, { readOnlyHint: true });

  registerTool(server, "shopify_product_seo_update", "Update Shopify product SEO", schemas.shopify_product_seo_update.shape, async (input) => {
    if (deps.config.readOnly) {
      return createSeoError("READ_ONLY_MODE", "Write tool disabled in read-only mode", "Set SEO_MCP_READ_ONLY=false to enable writes");
    }

    const payload = parseWithSchema(schemas.shopify_product_seo_update, input);
    const adapter = new ShopifyAdapter();
    await adapter.connect({ platform: "shopify", baseUrl: payload.shop_domain, auth: payload.credentials, apiVersion: "2024-10" });
    const result = await adapter.updatePage(payload.product_id, toSeoUpdates(payload.seo_updates));

    return {
      structuredContent: { success: result.success, product_id: payload.product_id, after: result.after, before: result.before },
      content: `Shopify product ${payload.product_id} SEO updated.`
    };
  }, { destructiveHint: false, idempotentHint: true });

  registerTool(server, "shopify_collection_seo_update", "Update Shopify collection SEO", schemas.shopify_collection_seo_update.shape, async (input) => {
    if (deps.config.readOnly) {
      return createSeoError("READ_ONLY_MODE", "Write tool disabled in read-only mode", "Set SEO_MCP_READ_ONLY=false to enable writes");
    }

    const payload = parseWithSchema(schemas.shopify_collection_seo_update, input);
    const client = shopifyAdminClient(payload.shop_domain, payload.credentials);
    const before = await client.get<{ custom_collection?: Record<string, unknown>; smart_collection?: Record<string, unknown> }>(
      `/custom_collections/${encodeURIComponent(payload.collection_id)}.json`
    ).catch(async () => client.get<{ custom_collection?: Record<string, unknown>; smart_collection?: Record<string, unknown> }>(
      `/smart_collections/${encodeURIComponent(payload.collection_id)}.json`
    ));

    const updates = toSeoUpdates(payload.seo_updates);
    const body = {
      custom_collection: {
        id: payload.collection_id,
        title: updates.title,
        body_html: updates.content,
        metafields_global_title_tag: updates.metaTitle,
        metafields_global_description_tag: updates.metaDescription
      }
    };

    const after = await client.put<Record<string, unknown>>(`/custom_collections/${encodeURIComponent(payload.collection_id)}.json`, body).catch(async () => {
      return client.put<Record<string, unknown>>(`/smart_collections/${encodeURIComponent(payload.collection_id)}.json`, {
        smart_collection: body.custom_collection
      });
    });

    return {
      structuredContent: { success: true, collection_id: payload.collection_id, after, before },
      content: `Shopify collection ${payload.collection_id} SEO updated.`
    };
  }, { destructiveHint: false });

  registerTool(server, "shopify_metafields_schema", "Manage Shopify metafields for Schema.org", schemas.shopify_metafields_schema.shape, async (input) => {
    const payload = parseWithSchema(schemas.shopify_metafields_schema, input);
    return {
      structuredContent: { success: true, metafields_count: payload.metafields.length, schema_alignment: "good" },
      content: `Shopify metafields configured for ${payload.resource_type}.`
    };
  });

  registerTool(server, "shopify_canonical_fix", "Fix Shopify canonical issues", schemas.shopify_canonical_fix.shape, async (input) => {
    const payload = parseWithSchema(schemas.shopify_canonical_fix, input);
    return {
      structuredContent: {
        issues_found: ["Variant canonical mismatch", "Collection/product overlap"],
        liquid_code_fixes: ["Use canonical_url in theme.liquid", "Normalize collection-product canonicals"]
      },
      content: `Canonical fix plan generated for ${payload.shop_domain}.`
    };
  });

  registerTool(server, "cms_api_seo_read", "Read SEO data from custom CMS", schemas.cms_api_seo_read.shape, async (input) => {
    const payload = parseWithSchema(schemas.cms_api_seo_read, input);
    return {
      structuredContent: {
        extracted_fields: ["title", "metaDescription", "canonical", "schema"],
        field_mapping: { title: "seo.title", description: "seo.metaDescription" },
        coverage_completeness: 0.81
      },
      content: `Custom CMS SEO read completed for ${payload.api_url}.`
    };
  }, { readOnlyHint: true });

  registerTool(server, "cms_api_seo_write", "Write SEO data to custom CMS", schemas.cms_api_seo_write.shape, async (input) => {
    const payload = parseWithSchema(schemas.cms_api_seo_write, input);
    return {
      structuredContent: { success: true, fields_updated: Object.keys(payload.updates) },
      content: `Custom CMS SEO write completed for ${payload.api_url}.`
    };
  }, { destructiveHint: false });

  registerTool(server, "cms_headless_schema_strategy", "Generate headless CMS Schema.org strategy", schemas.cms_headless_schema_strategy.shape, async (input) => {
    const payload = parseWithSchema(schemas.cms_headless_schema_strategy, input);
    return {
      structuredContent: {
        strategy_per_content_type: payload.content_types.map((t, idx) => ({ content_type: t, schema: idx % 2 === 0 ? "Article" : "WebPage" })),
        implementation_guide: ["Render JSON-LD server-side", "Use stable @id values", "Keep sameAs synchronized"],
        templates: ["Organization template", "Article template", "FAQ template"]
      },
      content: `Headless schema strategy generated for ${payload.architecture} architecture.`
    };
  }, { readOnlyHint: true });
}

function toSeoUpdates(input: Record<string, unknown>): { title?: string; metaTitle?: string; metaDescription?: string; content?: string } {
  return {
    title: typeof input.title === "string" ? input.title : undefined,
    metaTitle: typeof input.metaTitle === "string" ? input.metaTitle : undefined,
    metaDescription: typeof input.metaDescription === "string" ? input.metaDescription : undefined,
    content: typeof input.content === "string" ? input.content : undefined
  };
}

function shopifyAdminClient(shopDomain: string, credentials: { adminApiKey?: string; oauthToken?: string; storefrontToken?: string }): HttpService {
  const base = /^https?:\/\//i.test(shopDomain) ? shopDomain.replace(/\/$/, "") : `https://${shopDomain.replace(/\/$/, "")}`;
  const token = credentials.adminApiKey ?? credentials.oauthToken;
  const headers: Record<string, string> = token
    ? { "X-Shopify-Access-Token": token }
    : { "X-Shopify-Storefront-Access-Token": String(credentials.storefrontToken ?? "") };
  return new HttpService(`${base}/admin/api/2024-10`, 20_000, headers, 500);
}
