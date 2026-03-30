import nock from "nock";
import { describe, expect, it } from "vitest";
import type { AppConfig } from "../../src/config.js";
import { AhrefsService } from "../../src/services/ahrefs.service.js";

describe("AhrefsService integration (mocked HTTP)", () => {
  it("normalizes backlinks payload", async () => {
    const config: AppConfig = {
      name: "seo-mcp",
      version: "1.0.0",
      port: 3000,
      logLevel: "info",
      readOnly: false,
      dryRun: false,
      cacheTtlSeconds: 900,
      docsBaseUrl: "https://example.test",
      ahrefsApiKey: "ahrefs-key"
    } as AppConfig;

    nock("https://api.ahrefs.com")
      .get(/\/v3\/site-explorer\/all-backlinks.*/)
      .reply(200, {
        data: [
          {
            url_from: "https://source.example.com/a",
            url_to: "https://target.example.com/page",
            anchor: "entity seo guide",
            domain_rating: 72
          },
          {
            referring_page_url: "https://source.example.com/b",
            target_url: "https://target.example.com/page",
            anchor_text: "schema markup",
            dr: 58
          }
        ]
      });

    const service = new AhrefsService(config);
    const rows = await service.backlinks("https://target.example.com", 50);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      url_from: "https://source.example.com/a",
      url_to: "https://target.example.com/page",
      anchor: "entity seo guide",
      domain_rating: 72
    });
    expect(rows[1]).toMatchObject({
      url_from: "https://source.example.com/b",
      url_to: "https://target.example.com/page",
      anchor: "schema markup",
      domain_rating: 58
    });
  });
});
