import type {
  PageFilters,
  Platform,
  PlatformConfig,
  SEOPage,
  SEOPageUpdates,
  SiteMetadata,
  UpdateResult
} from "../types/platform.types.js";

export abstract class BaseSEOPlatformAdapter {
  public abstract readonly platform: Platform;

  public abstract connect(config: PlatformConfig): Promise<void>;

  public abstract getPage(identifier: string): Promise<SEOPage>;

  public abstract updatePage(identifier: string, updates: SEOPageUpdates): Promise<UpdateResult>;

  public abstract listPages(filters: PageFilters): Promise<SEOPage[]>;

  public abstract getSiteMetadata(): Promise<SiteMetadata>;
}
