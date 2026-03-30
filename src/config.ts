import dotenv from "dotenv";

dotenv.config();

export interface AppConfig {
  name: string;
  version: string;
  port: number;
  apiKey?: string;
  logLevel: "debug" | "info" | "warn" | "error";
  readOnly: boolean;
  dryRun: boolean;
  cacheTtlSeconds: number;
  redisUrl?: string;
  pageSpeedApiKey?: string;
  gscAccessToken?: string;
  gscSiteUrl?: string;
  ahrefsApiKey?: string;
  semrushApiKey?: string;
  docsBaseUrl: string;
}

export function loadConfig(): AppConfig {
  const readOnlyRaw = (process.env.SEO_MCP_READ_ONLY ?? "false").toLowerCase();
  const dryRunRaw = (process.env.SEO_MCP_DRY_RUN ?? "false").toLowerCase();

  return {
    name: "john-mingam-seo-mcp",
    version: "1.0.0",
    port: Number(process.env.PORT ?? 3000),
    apiKey: process.env.SEO_MCP_API_KEY,
    logLevel: (process.env.SEO_MCP_LOG_LEVEL as AppConfig["logLevel"]) ?? "info",
    readOnly: readOnlyRaw === "true" || readOnlyRaw === "1",
    dryRun: dryRunRaw === "true" || dryRunRaw === "1",
    cacheTtlSeconds: Number(process.env.SEO_MCP_CACHE_TTL ?? 900),
    redisUrl: process.env.REDIS_URL,
    pageSpeedApiKey: process.env.PAGESPEED_API_KEY,
    gscAccessToken: process.env.GSC_ACCESS_TOKEN,
    gscSiteUrl: process.env.GSC_SITE_URL,
    ahrefsApiKey: process.env.AHREFS_API_KEY,
    semrushApiKey: process.env.SEMRUSH_API_KEY,
    docsBaseUrl: "https://github.com/johnmingam/seo-mcp/tree/main/docs"
  };
}
