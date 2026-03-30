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

## Auth Compatibility Matrix

| Tool | Platform/API | Supported auth modes | Where to provide credentials |
|---|---|---|---|
| wp_page_seo_update | WordPress REST | username+appPassword, jwtToken, oauthToken | tool input `credentials` |
| wp_bulk_seo_update | WordPress REST | username+appPassword, jwtToken, oauthToken | tool input `credentials` |
| wp_schema_inject | WordPress REST | username+appPassword, jwtToken, oauthToken | tool input `credentials` |
| wp_redirect_manager | WordPress REST | username+appPassword, jwtToken, oauthToken | tool input `credentials` |
| shopify_seo_audit | Shopify Admin API | adminApiKey, oauthToken, storefrontToken (read-only fallback) | tool input `credentials` |
| shopify_product_seo_update | Shopify Admin API | adminApiKey, oauthToken | tool input `credentials` |
| shopify_collection_seo_update | Shopify Admin API | adminApiKey, oauthToken | tool input `credentials` |
| shopify_metafields_schema | Shopify Admin API | adminApiKey, oauthToken | tool input `credentials` |
| shopify_canonical_fix | Shopify Admin API | adminApiKey, oauthToken | tool input `credentials` |
| cms_api_seo_read | Custom CMS | bearer, apikey, basic, oauth2 | tool input `auth` |
| cms_api_seo_write | Custom CMS | bearer, apikey, basic, oauth2 | tool input `auth` |
| technical_core_web_vitals | Google PageSpeed Insights | API key | env `PAGESPEED_API_KEY` |
| report_seo_dashboard | Google Search Console | OAuth access token | env `GSC_ACCESS_TOKEN`, optional `GSC_SITE_URL` |
| report_gsc_insights | Google Search Console | OAuth access token | env `GSC_ACCESS_TOKEN`, optional `GSC_SITE_URL` |
| onpage_keyword_research | SEMrush API | API key | env `SEMRUSH_API_KEY` |
| links_backlink_audit | Ahrefs API | API key/bearer token | env `AHREFS_API_KEY` |
| links_opportunity_finder | Ahrefs API | API key/bearer token | env `AHREFS_API_KEY` |

Notes:
- Write tools can be simulated globally via `SEO_MCP_DRY_RUN=true`.
- Write tools can be disabled globally via `SEO_MCP_READ_ONLY=true`.
- If credentials are missing, tools return a structured error or fallback read-only synthesis depending on the tool.

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
