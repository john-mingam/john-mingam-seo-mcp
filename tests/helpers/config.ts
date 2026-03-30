import type { AppConfig } from "../../src/config.js";

export const testConfig: AppConfig = {
  name: "john-mingam-seo-mcp",
  version: "1.0.0",
  port: 3000,
  logLevel: "info",
  readOnly: false,
  dryRun: false,
  cacheTtlSeconds: 900,
  docsBaseUrl: "https://example.test/docs",
  apiKey: undefined,
  redisUrl: undefined,
  pageSpeedApiKey: undefined,
  gscAccessToken: undefined,
  gscSiteUrl: undefined,
  ahrefsApiKey: undefined,
  semrushApiKey: undefined
};
