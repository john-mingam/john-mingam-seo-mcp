export type Platform = "wordpress" | "shopify" | "custom";

export type AuthType = "application-password" | "jwt" | "oauth" | "admin-api-key" | "storefront-token" | "bearer" | "apikey" | "basic" | "oauth2";

export interface WPCredentials {
  username?: string;
  appPassword?: string;
  jwtToken?: string;
  oauthToken?: string;
}

export interface ShopifyCredentials {
  adminApiKey?: string;
  oauthToken?: string;
  storefrontToken?: string;
}

export interface APIAuth {
  type: "bearer" | "apikey" | "basic" | "oauth2";
  token?: string;
  apiKey?: string;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
}

export type PlatformConfig =
  | {
      platform: "wordpress";
      baseUrl: string;
      auth: WPCredentials;
    }
  | {
      platform: "shopify";
      baseUrl: string;
      auth: ShopifyCredentials;
      apiVersion?: string;
    }
  | {
      platform: "custom";
      baseUrl: string;
      auth: APIAuth;
    };

export interface SEOPage {
  id: string;
  url: string;
  title: string;
  content: string;
  excerpt?: string;
  language?: string;
  metadata?: Record<string, unknown>;
  updatedAt?: string;
}

export interface SEOPageUpdates {
  title?: string;
  metaTitle?: string;
  metaDescription?: string;
  content?: string;
  schema?: Record<string, unknown>;
  canonical?: string;
  robots?: string;
}

export interface UpdateResult {
  success: boolean;
  id: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  warnings?: string[];
}

export interface PageFilters {
  query?: string;
  type?: string;
  status?: string;
  category?: string;
  limit?: number;
}

export interface SiteMetadata {
  platform: Platform;
  siteUrl: string;
  siteName?: string;
  locale?: string;
  pagesCount?: number;
}
