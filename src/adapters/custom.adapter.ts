import type {
  PageFilters,
  PlatformConfig,
  SEOPage,
  SEOPageUpdates,
  SiteMetadata,
  UpdateResult
} from "../types/platform.types.js";
import { BaseSEOPlatformAdapter } from "./base.adapter.js";

export class CustomCMSAdapter extends BaseSEOPlatformAdapter {
  public readonly platform = "custom" as const;
  private baseUrl = "";

  public async connect(config: PlatformConfig): Promise<void> {
    if (config.platform !== "custom") {
      throw new Error("Invalid platform config for Custom CMS adapter");
    }
    this.baseUrl = config.baseUrl;
  }

  public async getPage(identifier: string): Promise<SEOPage> {
    return {
      id: identifier,
      url: `${this.baseUrl}/content/${identifier}`,
      title: "Custom CMS Resource",
      content: "Custom CMS content placeholder"
    };
  }

  public async updatePage(identifier: string, updates: SEOPageUpdates): Promise<UpdateResult> {
    return {
      success: true,
      id: identifier,
      after: { ...updates }
    };
  }

  public async listPages(filters: PageFilters): Promise<SEOPage[]> {
    return [
      {
        id: "custom-1",
        url: `${this.baseUrl}/content/entity-seo-guide`,
        title: `Entity SEO Guide ${filters.query ?? ""}`.trim(),
        content: "Custom content"
      }
    ];
  }

  public async getSiteMetadata(): Promise<SiteMetadata> {
    return {
      platform: "custom",
      siteUrl: this.baseUrl,
      siteName: "Custom CMS"
    };
  }
}
