#!/usr/bin/env node

import { createServer } from "node:http";
import { parseArgs } from "node:util";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { loadConfig } from "./config.js";
import { createSeoMcpServer } from "./server.js";

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      transport: { type: "string", default: "stdio" },
      port: { type: "string", default: "3000" },
      test: { type: "boolean", default: false }
    }
  });

  const config = loadConfig();

  if (values.test) {
    process.stderr.write("seo-mcp test ok\n");
    return;
  }

  const server = createSeoMcpServer(config);

  if (values.transport === "http") {
    const httpTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined
    } as any);

    const httpServer = createServer(async (req, res) => {
      await httpTransport.handleRequest(req, res);
    });

    httpServer.listen(Number(values.port), () => {
      process.stderr.write(`seo-mcp running on HTTP port ${values.port}\n`);
    });

    await (server as any).connect(httpTransport);
    return;
  }

  const stdioTransport = new StdioServerTransport();
  await (server as any).connect(stdioTransport);
  process.stderr.write("seo-mcp running on stdio\n");
}

main().catch((error: unknown) => {
  const msg = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`Fatal error: ${msg}\n`);
  process.exit(1);
});
