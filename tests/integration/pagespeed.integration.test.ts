import nock from "nock";
import { describe, expect, it } from "vitest";
import type { AppConfig } from "../../src/config.js";
import { PageSpeedService } from "../../src/services/pagespeed.service.js";

describe("PageSpeedService integration (mocked HTTP)", () => {
  it("maps live API payload to CWV structure", async () => {
    const config: AppConfig = {
      name: "seo-mcp",
      version: "1.0.0",
      port: 3000,
      logLevel: "info",
      readOnly: false,
      dryRun: false,
      cacheTtlSeconds: 900,
      docsBaseUrl: "https://example.test",
      pageSpeedApiKey: "test-key"
    } as AppConfig;

    nock("https://www.googleapis.com")
      .get(/\/pagespeedonline\/v5\/runPagespeed.*/)
      .reply(200, {
        lighthouseResult: {
          audits: {
            "largest-contentful-paint": { numericValue: 2200 },
            "cumulative-layout-shift": { numericValue: 0.06 },
            "interaction-to-next-paint": { numericValue: 180 },
            "first-contentful-paint": { numericValue: 1500 },
            "server-response-time": { numericValue: 650 }
          }
        }
      });

    const service = new PageSpeedService(config);
    const result = await service.getCoreWebVitals("https://example.com", "mobile");

    expect(result.lcp.value).toBe(2.2);
    expect(result.lcp.rating).toBe("good");
    expect(result.strategy).toBe("mobile");
  });
});
