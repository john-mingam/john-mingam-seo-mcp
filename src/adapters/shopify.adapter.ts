import type {
  PageFilters,
  PlatformConfig,
  SEOPage,
  SEOPageUpdates,
  ShopifyCredentials,
  SiteMetadata,
  UpdateResult
} from "../types/platform.types.js";
import { HttpService } from "../services/http.service.js";
import { BaseSEOPlatformAdapter } from "./base.adapter.js";

export class ShopifyAdapter extends BaseSEOPlatformAdapter {
  public readonly platform = "shopify" as const;
  private baseUrl = "";
  private apiVersion = "2024-10";
  private http?: HttpService;

  public constructor(http?: HttpService) {
    super();
    this.http = http;
  }

  public async connect(config: PlatformConfig): Promise<void> {
    if (config.platform !== "shopify") {
      throw new Error("Invalid platform config for Shopify adapter");
    }

    this.baseUrl = normalizeShopBaseUrl(config.baseUrl);
    this.apiVersion = config.apiVersion ?? this.apiVersion;
    const headers = this.resolveAuthHeaders(config.auth);
    this.http = this.http ?? new HttpService(`${this.baseUrl}/admin/api/${this.apiVersion}`, 20_000, headers, 500);
  }

  public async getPage(identifier: string): Promise<SEOPage> {
    const client = this.requireClient();
    const payload = await client.get<{ product: Record<string, any> }>(`/products/${encodeURIComponent(identifier)}.json`);
    const product = payload.product;

    return {
      id: String(product?.id ?? identifier),
      url: `${this.baseUrl}/products/${product?.handle ?? identifier}`,
      title: String(product?.title ?? ""),
      content: String(product?.body_html ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
      updatedAt: String(product?.updated_at ?? "") || undefined,
      metadata: {
        status: product?.status,
        vendor: product?.vendor,
        product_type: product?.product_type
      }
    };
  }

  public async updatePage(identifier: string, updates: SEOPageUpdates): Promise<UpdateResult> {
    const client = this.requireClient();
    const before = await client.get<{ product: Record<string, unknown> }>(`/products/${encodeURIComponent(identifier)}.json`);

    const productPayload: Record<string, unknown> = { id: identifier };
    if (updates.title) productPayload.title = updates.title;
    if (updates.content) productPayload.body_html = updates.content;
    if (updates.metaTitle) productPayload.metafields_global_title_tag = updates.metaTitle;
    if (updates.metaDescription) productPayload.metafields_global_description_tag = updates.metaDescription;

    const after = await client.put<{ product: Record<string, unknown> }>(`/products/${encodeURIComponent(identifier)}.json`, {
      product: productPayload
    });

    return {
      success: true,
      id: identifier,
      before: before.product,
      after: after.product
    };
  }

  public async listPages(filters: PageFilters): Promise<SEOPage[]> {
    const client = this.requireClient();
    const params = new URLSearchParams();
    params.set("limit", String(Math.min(250, filters.limit ?? 50)));
    if (filters.query) params.set("title", filters.query);

    const payload = await client.get<{ products: Array<Record<string, any>> }>(`/products.json?${params.toString()}`);
    return payload.products.map((product) => ({
      id: String(product.id),
      url: `${this.baseUrl}/products/${product.handle}`,
      title: String(product.title ?? ""),
      content: String(product.body_html ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
      updatedAt: String(product.updated_at ?? "") || undefined
    }));
  }

  public async getSiteMetadata(): Promise<SiteMetadata> {
    const client = this.requireClient();
    const payload = await client.get<{ shop: Record<string, any> }>(`/shop.json`);

    return {
      platform: "shopify",
      siteUrl: this.baseUrl,
      siteName: payload.shop?.name,
      locale: payload.shop?.primary_locale
    };
  }

  private resolveAuthHeaders(auth: ShopifyCredentials): Record<string, string> {
    if (auth.adminApiKey) {
      return { "X-Shopify-Access-Token": auth.adminApiKey };
    }
    if (auth.oauthToken) {
      return { "X-Shopify-Access-Token": auth.oauthToken };
    }
    if (auth.storefrontToken) {
      return { "X-Shopify-Storefront-Access-Token": auth.storefrontToken };
    }

    throw new Error("Shopify authentication missing. Provide adminApiKey, oauthToken, or storefrontToken.");
  }

  private requireClient(): HttpService {
    if (!this.http) {
      throw new Error("Shopify adapter is not connected");
    }
    return this.http;
  }
}

function normalizeShopBaseUrl(baseUrl: string): string {
  const withProtocol = /^https?:\/\//i.test(baseUrl) ? baseUrl : `https://${baseUrl}`;
  return withProtocol.replace(/\/$/, "");
}
