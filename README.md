# seo-mcp

Production-grade MCP server for SEO operations across WordPress, Shopify, and custom CMS platforms.

## Identity

- Name: john-mingam-seo-mcp
- Version: 1.0.0
- Author: John Mingam
- License: MIT
- Runtime: Node.js 20+
- Transport: stdio and Streamable HTTP

## Features

- 65 tools across Entity SEO, Technical SEO, On-page SEO, Links, Platform operations, and Reporting
- Unified adapter architecture for wordpress, shopify, custom CMS
- Zod input validation for all tools
- Structured output plus human-readable summaries
- Standardized error format
- Optional read-only mode via environment variable

## Install

```bash
npm install
npm run build
```

## Run local (stdio)

```bash
npm run start:stdio
```

## Run remote (http)

```bash
npm run start:http
```

## Claude Desktop config

```json
{
  "mcpServers": {
    "seo-mcp": {
      "command": "seo-mcp",
      "args": ["--transport", "stdio"],
      "env": {
        "SEO_MCP_LOG_LEVEL": "info"
      }
    }
  }
}
```

## Environment variables

See .env.example for full list.

Important: external APIs are opt-in and user-managed. You must provide your own credentials for services such as WordPress, Shopify, Google PageSpeed, and Google Search Console (and optionally Ahrefs/SEMrush).

Dry-run mode: set SEO_MCP_DRY_RUN=true to simulate all write tools without changing remote platforms.

## Deployment targets

- Docker
- Railway
- Render
- Vercel

## Project structure

```text
src/
  adapters/
  services/
  tools/
    entity/
    technical/
    onpage/
    links/
    platform/
    reporting/
  validators/
  types/
```
