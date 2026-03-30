import nock from "nock";
import { describe, expect, it } from "vitest";
import type { AppConfig } from "../../src/config.js";
import { GscService } from "../../src/services/gsc.service.js";

describe("GscService integration (mocked HTTP)", () => {
  it("fetches and normalizes Search Console rows", async () => {
    const config: AppConfig = {
      name: "seo-mcp",
      version: "1.0.0",
      port: 3000,
      logLevel: "info",
      readOnly: false,
      dryRun: false,
      cacheTtlSeconds: 900,
      docsBaseUrl: "https://example.test",
      gscAccessToken: "token-123"
    } as AppConfig;

    nock("https://searchconsole.googleapis.com")
      .post(/\/webmasters\/v3\/sites\/.+\/searchAnalytics\/query/)
      .reply(200, {
        rows: [
          { keys: ["entity seo"], clicks: 10, impressions: 1000, ctr: 0.01, position: 12.3 }
        ]
      });

    const service = new GscService(config);
    const rows = await service.query("https://example.com", "2026-03-01", "2026-03-30");

    expect(rows).toHaveLength(1);
    expect(rows[0].keys[0]).toBe("entity seo");
    expect(rows[0].clicks).toBe(10);
  });
});
