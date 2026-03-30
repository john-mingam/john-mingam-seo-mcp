import { describe, expect, it } from "vitest";
import { registerTechnicalTools, technicalSchemas } from "../src/tools/technical/index.js";
import { MockMcpServer } from "./helpers/mock-server.js";
import { testConfig } from "./helpers/config.js";

describe("Technical tools", () => {
  it("validates technical_core_web_vitals input schema", () => {
    const ok = technicalSchemas.technical_core_web_vitals.safeParse({ url: "https://example.com", strategy: "mobile" });
    expect(ok.success).toBe(true);

    const bad = technicalSchemas.technical_core_web_vitals.safeParse({ url: "not-a-url" });
    expect(bad.success).toBe(false);
  });

  it("returns error contract when PageSpeed key is missing", async () => {
    const server = new MockMcpServer();
    registerTechnicalTools(server, { config: testConfig });

    const tool = server.tools.get("technical_core_web_vitals");
    const result = await tool!.handler({ url: "https://example.com", strategy: "mobile" });

    expect(result.structuredContent.error).toBeDefined();
    expect(result.structuredContent.error).toMatchObject({ code: "CWV_AUDIT_FAILED" });
  });

  it("returns structured output for technical_sitemap_generate", async () => {
    const server = new MockMcpServer();
    registerTechnicalTools(server, { config: testConfig });

    const tool = server.tools.get("technical_sitemap_generate");
    const result = await tool!.handler({
      site_url: "https://example.com",
      pages: [{ url: "https://example.com/a" }, { url: "https://example.com/b", lastmod: "2026-03-01" }]
    });

    expect(result.structuredContent.xml_sitemaps).toBeInstanceOf(Array);
    expect(result.content[0].text).toContain("Generated sitemap");
  });
});
