import { z } from "zod";
import type { AppConfig } from "../config.js";

export interface ToolDependencies {
  config: AppConfig;
}

export interface ToolResult {
  structuredContent: Record<string, unknown>;
  content: string;
}

export function createSeoError(code: string, message: string, suggestion: string, docsUrl?: string): ToolResult {
  return {
    structuredContent: {
      error: {
        code,
        message,
        suggestion,
        docs_url: docsUrl
      }
    },
    content: `Error ${code}: ${message}\nSuggestion: ${suggestion}${docsUrl ? `\nDocs: ${docsUrl}` : ""}`
  };
}

export function registerTool(
  server: unknown,
  name: string,
  description: string,
  inputSchema: z.ZodRawShape,
  handler: (input: Record<string, unknown>) => Promise<ToolResult>,
  annotations?: Record<string, unknown>
): void {
  const s = server as any;

  if (typeof s.registerTool === "function") {
    s.registerTool(
      name,
      {
        description,
        inputSchema,
        annotations
      },
      async (input: Record<string, unknown>) => {
        if (isDryRunWriteTool(name)) {
          return {
            structuredContent: {
              dry_run: true,
              tool: name,
              simulated: true,
              requested_input: input
            },
            content: [{ type: "text", text: `Dry-run enabled. Skipped write operation for ${name}.` }]
          };
        }

        const result = await handler(input);
        return {
          structuredContent: result.structuredContent,
          content: [{ type: "text", text: result.content }]
        };
      }
    );
    return;
  }

  if (typeof s.tool === "function") {
    s.tool(name, description, inputSchema, async (input: Record<string, unknown>) => {
      if (isDryRunWriteTool(name)) {
        return {
          structuredContent: {
            dry_run: true,
            tool: name,
            simulated: true,
            requested_input: input
          },
          content: [{ type: "text", text: `Dry-run enabled. Skipped write operation for ${name}.` }]
        };
      }

      const result = await handler(input);
      return {
        structuredContent: result.structuredContent,
        content: [{ type: "text", text: result.content }]
      };
    });
    return;
  }

  throw new Error("MCP server instance does not support registerTool/tool API");
}

export function parseWithSchema<T extends z.ZodTypeAny>(schema: T, input: unknown): z.infer<T> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; "));
  }
  return parsed.data;
}

const WRITE_TOOL_NAMES = new Set([
  "wp_page_seo_update",
  "wp_bulk_seo_update",
  "wp_schema_inject",
  "wp_redirect_manager",
  "shopify_product_seo_update",
  "shopify_collection_seo_update",
  "shopify_metafields_schema",
  "shopify_canonical_fix",
  "cms_api_seo_write"
]);

function isDryRunWriteTool(name: string): boolean {
  const enabled = (process.env.SEO_MCP_DRY_RUN ?? "false").toLowerCase();
  if (enabled !== "true" && enabled !== "1") {
    return false;
  }
  return WRITE_TOOL_NAMES.has(name);
}
