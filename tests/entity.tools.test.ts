import { describe, expect, it } from "vitest";
import { registerEntityTools, entitySchemas } from "../src/tools/entity/index.js";
import { MockMcpServer } from "./helpers/mock-server.js";
import { testConfig } from "./helpers/config.js";

describe("Entity tools", () => {
  it("validates wikidata input schema", () => {
    const parsed = entitySchemas.wikidataLookupSchema.safeParse({ query: "John Mingam", language: "fr" });
    expect(parsed.success).toBe(true);

    const invalid = entitySchemas.wikidataLookupSchema.safeParse({ query: "" });
    expect(invalid.success).toBe(false);
  });

  it("returns standardized error contract when entity_schema_validate lacks input", async () => {
    const server = new MockMcpServer();
    registerEntityTools(server, { config: testConfig });

    const tool = server.tools.get("entity_schema_validate");
    expect(tool).toBeDefined();

    const result = await tool!.handler({});
    expect(result.structuredContent.error).toBeDefined();
    expect(result.structuredContent.error).toMatchObject({
      code: "SCHEMA_VALIDATION_INPUT_REQUIRED"
    });
  });

  it("returns structured output for entity_analyze", async () => {
    const server = new MockMcpServer();
    registerEntityTools(server, { config: testConfig });

    const tool = server.tools.get("entity_analyze");
    const result = await tool!.handler({
      content: "John Mingam is an entity SEO expert with semantic strategy, structured data, and clear trust signals across technical content.",
      target_entity: "John Mingam"
    });

    expect(result.structuredContent.entity_recognition_score).toBeTypeOf("number");
    expect(result.structuredContent.sft_score).toBeDefined();
    expect(result.content[0].text).toContain("Entity recognition score");
  });
});
