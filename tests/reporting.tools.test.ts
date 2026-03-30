import { describe, expect, it } from "vitest";
import { registerReportingTools, reportingSchemas } from "../src/tools/reporting/index.js";
import { MockMcpServer } from "./helpers/mock-server.js";
import { testConfig } from "./helpers/config.js";

describe("Reporting tools", () => {
  it("validates report_gsc_insights input schema", () => {
    const ok = reportingSchemas.report_gsc_insights.safeParse({
      site_url: "https://example.com",
      gsc_export: { rows: [] }
    });
    expect(ok.success).toBe(true);

    const bad = reportingSchemas.report_gsc_insights.safeParse({ site_url: "x", gsc_export: {} });
    expect(bad.success).toBe(false);
  });

  it("returns structured output schema for report_gsc_insights with provided export", async () => {
    const server = new MockMcpServer();
    registerReportingTools(server, { config: testConfig });

    const tool = server.tools.get("report_gsc_insights");
    const result = await tool!.handler({
      site_url: "https://example.com",
      gsc_export: {
        rows: [
          { keys: ["entity seo"], clicks: 40, impressions: 4000, ctr: 0.01, position: 12.4 },
          { keys: ["schema org"], clicks: 25, impressions: 1800, ctr: 0.013, position: 8.2 }
        ]
      }
    });

    expect(result.structuredContent.ctr_opportunities).toBeInstanceOf(Array);
    expect(result.structuredContent.position_tracking).toBeInstanceOf(Array);
  });
});
