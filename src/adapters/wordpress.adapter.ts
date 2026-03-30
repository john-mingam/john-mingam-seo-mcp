import type {
  PageFilters,
  PlatformConfig,
  SEOPage,
  SEOPageUpdates,
  SiteMetadata,
  WPCredentials,
  UpdateResult
} from "../types/platform.types.js";
import { HttpService } from "../services/http.service.js";
import { BaseSEOPlatformAdapter } from "./base.adapter.js";

export class WordPressAdapter extends BaseSEOPlatformAdapter {
  public readonly platform = "wordpress" as const;
  private baseUrl = "";
  private authHeaders: Record<string, string> = {};
  private http?: HttpService;

  public constructor(http?: HttpService) {
    super();
    this.http = http;
  }

  public async connect(config: PlatformConfig): Promise<void> {
    if (config.platform !== "wordpress") {
      throw new Error("Invalid platform config for WordPress adapter");
    }

    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.authHeaders = this.resolveAuthHeaders(config.auth);
    this.http = this.http ?? new HttpService(`${this.baseUrl}/wp-json/wp/v2`, 15_000, this.authHeaders);
  }

  public async getPage(identifier: string): Promise<SEOPage> {
    const client = this.requireClient();
    const post = (await this.getResourceById(client, identifier, "posts")) as any;

    return {
      id: identifier,
      url: String(post?.link ?? `${this.baseUrl}/?p=${identifier}`),
      title: stripHtml(String(post?.title?.rendered ?? "")),
      content: stripHtml(String(post?.content?.rendered ?? "")),
      excerpt: stripHtml(String(post?.excerpt?.rendered ?? "")),
      updatedAt: post?.modified ? String(post.modified) : undefined
    };
  }

  public async updatePage(identifier: string, updates: SEOPageUpdates): Promise<UpdateResult> {
    const client = this.requireClient();
    const before = await this.getResourceById(client, identifier, "posts");
    const endpoint = `/posts/${encodeURIComponent(identifier)}`;
    const payload: Record<string, unknown> = {};

    if (updates.title) payload.title = updates.title;
    if (updates.content) payload.content = updates.content;
    if (updates.metaTitle) payload.meta = { ...(payload.meta as Record<string, unknown> | undefined), _yoast_wpseo_title: updates.metaTitle };
    if (updates.metaDescription) {
      payload.meta = {
        ...(payload.meta as Record<string, unknown> | undefined),
        _yoast_wpseo_metadesc: updates.metaDescription
      };
    }

    const after = await client.post<Record<string, unknown>>(endpoint, payload);

    return {
      success: true,
      id: identifier,
      before,
      after,
      warnings: updates.schema ? ["Schema injection is handled via wp_schema_inject tool"] : undefined
    };
  }

  public async listPages(filters: PageFilters): Promise<SEOPage[]> {
    const client = this.requireClient();
    const params = new URLSearchParams();
    params.set("per_page", String(Math.min(100, filters.limit ?? 20)));
    if (filters.query) params.set("search", filters.query);
    if (filters.status) params.set("status", filters.status);

    const rows = await client.get<Array<Record<string, any>>>(`/posts?${params.toString()}`);
    return rows.map((row) => ({
      id: String(row.id),
      url: String(row.link ?? `${this.baseUrl}/?p=${row.id}`),
      title: stripHtml(String(row?.title?.rendered ?? "")),
      content: stripHtml(String(row?.content?.rendered ?? "")),
      excerpt: stripHtml(String(row?.excerpt?.rendered ?? "")),
      updatedAt: row?.modified
    }));
  }

  public async getSiteMetadata(): Promise<SiteMetadata> {
    const client = this.requireClient();
    const metadata = await client.get<Record<string, any>>(`/`);

    return {
      platform: "wordpress",
      siteUrl: this.baseUrl,
      siteName: metadata?.name,
      locale: metadata?.language
    };
  }

  private resolveAuthHeaders(wpAuth: WPCredentials): Record<string, string> {

    if (wpAuth.jwtToken) {
      return { Authorization: `Bearer ${wpAuth.jwtToken}` };
    }
    if (wpAuth.oauthToken) {
      return { Authorization: `Bearer ${wpAuth.oauthToken}` };
    }
    if (wpAuth.username && wpAuth.appPassword) {
      const token = Buffer.from(`${wpAuth.username}:${wpAuth.appPassword}`).toString("base64");
      return { Authorization: `Basic ${token}` };
    }

    throw new Error("WordPress authentication missing. Provide app password, jwtToken, or oauthToken.");
  }

  private requireClient(): HttpService {
    if (!this.http) {
      throw new Error("WordPress adapter is not connected");
    }
    return this.http;
  }

  private async getResourceById(http: HttpService, identifier: string, type: "posts" | "pages"): Promise<Record<string, unknown>> {
    try {
      return await http.get<Record<string, unknown>>(`/${type}/${encodeURIComponent(identifier)}`);
    } catch (err) {
      if (type === "posts") {
        return this.getResourceById(http, identifier, "pages");
      }
      throw err;
    }
  }
}

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
