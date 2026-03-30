import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppConfig } from "./config.js";
import { registerEntityTools } from "./tools/entity/index.js";
import { registerTechnicalTools } from "./tools/technical/index.js";
import { registerOnPageTools } from "./tools/onpage/index.js";
import { registerLinksTools } from "./tools/links/index.js";
import { registerPlatformTools } from "./tools/platform/index.js";
import { registerReportingTools } from "./tools/reporting/index.js";

export function createSeoMcpServer(config: AppConfig): McpServer {
  const server = new McpServer({
    name: config.name,
    version: config.version,
    title: "SEO MCP Server",
    description: "Production-grade SEO and Entity SEO MCP server by John Mingam"
  } as any);

  const deps = { config };

  registerEntityTools(server, deps);
  registerTechnicalTools(server, deps);
  registerOnPageTools(server, deps);
  registerLinksTools(server, deps);
  registerPlatformTools(server, deps);
  registerReportingTools(server, deps);

  return server;
}
