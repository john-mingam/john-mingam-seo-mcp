# seo-mcp

Production-grade MCP server that gives AI agents real SEO execution power across WordPress, Shopify, and custom CMS platforms.

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Compatible-0A66C2)](https://modelcontextprotocol.io)
[![License](https://img.shields.io/badge/License-MIT-F2C94C)](LICENSE)

## Why seo-mcp

- 65 SEO tools grouped by domain: Entity, Technical, On-page, Links, Platform, Reporting
- Real platform operations via API adapters (WordPress and Shopify)
- Structured JSON outputs plus human-readable summaries
- Zod validation and standardized error contracts
- Optional read-only and global dry-run safety modes

## Identity

- Name: john-mingam-seo-mcp
- Version: 1.0.0
- Author: John Mingam
- Runtime: Node.js 20+
- Transport: stdio and Streamable HTTP

## Quick Start

### 1) Install and build

```bash
npm install
npm run build
```

### 2) Run local (stdio)

```bash
npm run start:stdio
```

### 3) Run remote (http)

```bash
npm run start:http
```

## Claude Integration

### Local Claude Desktop (stdio)

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

### Remote Claude MCP (url)

Use this when your server is deployed on Railway, Render, VPS, or another public endpoint.

```json
{
  "mcpServers": {
    "seo-mcp": {
      "url": "https://your-seo-mcp.example.com",
      "apiKey": "your-mcp-api-key"
    }
  }
}
```

## Environment and Safety

- Full variable list: see .env.example
- External APIs are user-managed (bring your own keys)
- Dry-run mode: SEO_MCP_DRY_RUN=true
- Read-only mode: SEO_MCP_READ_ONLY=true

## Auth Compatibility Matrix

| Tool | Platform/API | Supported auth modes | Credentials location |
|---|---|---|---|
| wp_page_seo_update | WordPress REST | username+appPassword, jwtToken, oauthToken | tool input credentials |
| wp_bulk_seo_update | WordPress REST | username+appPassword, jwtToken, oauthToken | tool input credentials |
| wp_schema_inject | WordPress REST | username+appPassword, jwtToken, oauthToken | tool input credentials |
| wp_redirect_manager | WordPress REST | username+appPassword, jwtToken, oauthToken | tool input credentials |
| shopify_seo_audit | Shopify Admin API | adminApiKey, oauthToken, storefrontToken (read fallback) | tool input credentials |
| shopify_product_seo_update | Shopify Admin API | adminApiKey, oauthToken | tool input credentials |
| shopify_collection_seo_update | Shopify Admin API | adminApiKey, oauthToken | tool input credentials |
| shopify_metafields_schema | Shopify Admin API | adminApiKey, oauthToken | tool input credentials |
| shopify_canonical_fix | Shopify Admin API | adminApiKey, oauthToken | tool input credentials |
| cms_api_seo_read | Custom CMS | bearer, apikey, basic, oauth2 | tool input auth |
| cms_api_seo_write | Custom CMS | bearer, apikey, basic, oauth2 | tool input auth |
| technical_core_web_vitals | Google PageSpeed Insights | API key | env PAGESPEED_API_KEY |
| report_seo_dashboard | Google Search Console | OAuth access token | env GSC_ACCESS_TOKEN, optional GSC_SITE_URL |
| report_gsc_insights | Google Search Console | OAuth access token | env GSC_ACCESS_TOKEN, optional GSC_SITE_URL |
| onpage_keyword_research | SEMrush API | API key | env SEMRUSH_API_KEY |
| links_backlink_audit | Ahrefs API | API key or bearer token | env AHREFS_API_KEY |
| links_opportunity_finder | Ahrefs API | API key or bearer token | env AHREFS_API_KEY |

## Deployment Targets

- Docker
- Railway
- Render
- Vercel

## Architecture Snapshot

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

## Notes

- If credentials are missing, tools return structured errors or controlled fallback outputs.
- Write operations are protected by read-only and dry-run global switches.
