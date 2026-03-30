import nock from "nock";
import { describe, expect, it } from "vitest";
import type { AppConfig } from "../../src/config.js";
import { SemrushService } from "../../src/services/semrush.service.js";

describe("SemrushService integration (mocked HTTP)", () => {
  it("parses phrase_related CSV payload", async () => {
    const config: AppConfig = {
      name: "seo-mcp",
      version: "1.0.0",
      port: 3000,
      logLevel: "info",
      readOnly: false,
      dryRun: false,
      cacheTtlSeconds: 900,
      docsBaseUrl: "https://example.test",
      semrushApiKey: "semrush-key"
    } as AppConfig;

    nock("https://api.semrush.com")
      .get(/\/\?type=phrase_related.*/)
      .reply(
        200,
        [
          "Ph;Nq;Cp;Co",
          "entity seo;2400;3.21;0.62",
          "schema org seo;1600;2.50;0.48"
        ].join("\n")
      );

    const service = new SemrushService(config);
    const rows = await service.relatedKeywords("entity seo", "us");

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      keyword: "entity seo",
      volume: 2400,
      cpc: 3.21,
      competition: 0.62
    });
  });
});
