<p align="center">
	<img src="https://capsule-render.vercel.app/api?type=waving&height=260&color=0:0B132B,35:1C2541,70:3A506B,100:5BC0BE&text=seo-mcp&fontColor=ffffff&fontSize=56&fontAlignY=38&desc=Production-Grade%20SEO%20Execution%20for%20AI%20Agents&descAlignY=58&animation=fadeIn" alt="seo-mcp Hero Banner" />
</p>

<p align="center">
	<img src="https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif" width="940" alt="seo-mcp Live Demo" />
</p>

<p align="center">
	<a href="https://nodejs.org/"><img alt="Node.js" src="https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white"></a>
	<a href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white"></a>
	<a href="https://modelcontextprotocol.io"><img alt="MCP" src="https://img.shields.io/badge/MCP-Compatible-0A66C2?style=for-the-badge"></a>
	<img alt="Tools" src="https://img.shields.io/badge/SEO%20Tools-65-0F766E?style=for-the-badge">
	<img alt="License" src="https://img.shields.io/badge/License-MIT-F2C94C?style=for-the-badge">
</p>

<p align="center">
	<b>Production-grade MCP server that gives AI agents real SEO execution power.</b><br>
	Built for WordPress, Shopify, and custom CMS operations with strict safety controls.
</p>

---

## Why seo-mcp

- 65 SEO tools grouped by domain: Entity, Technical, On-page, Links, Platform, Reporting.
- Real platform operations via API adapters (WordPress and Shopify).
- Structured JSON outputs plus human-readable summaries.
- Zod validation and standardized error contracts.
- Optional read-only and global dry-run safety modes.

---

## Before / After: Classic SEO vs Agentic SEO

| Approach | Classic Keyword SEO | Entity SEO with seo-mcp |
|---|---|---|
| Analysis unit | Primary keyword | Entities + relations + context |
| Page reading | Density and repetition | Meaning graph and semantic coherence |
| Recommendations | Add keywords | Add missing entities and missing relations |
| Schema debugging | Mostly syntax checks | NLP + JSON-LD + content structure alignment |
| Editorial control | Page-by-page tuning | Cluster-level topical authority building |
| Client deliverable | Text SEO report | Visual report with Mermaid + knowledge graph |

Practical impact:

- less ambiguity around the main entity,
- stronger semantic robustness,
- more actionable SEO decisions for content and internal linking.

---

## Identity

- Name: `john-mingam-seo-mcp`
- Version: `1.0.0`
- Author: `John Mingam`
- Runtime: `Node.js 20+`
- Transport: `stdio` and Streamable HTTP

---

## Quick Start

### 1. Install and build

```bash
npm install
npm run build
```

### 2. Run local (stdio)

```bash
npm run start:stdio
```

### 3. Run remote (http)

```bash
npm run start:http
```

---

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

---

## Environment and Safety

- Full variable list: see `.env.example`.
- External APIs are user-managed (bring your own keys).
- Dry-run mode: `SEO_MCP_DRY_RUN=true`.
- Read-only mode: `SEO_MCP_READ_ONLY=true`.

---

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
| technical_core_web_vitals | Google PageSpeed Insights | API key | env `PAGESPEED_API_KEY` |
| report_seo_dashboard | Google Search Console | OAuth access token | env `GSC_ACCESS_TOKEN`, optional `GSC_SITE_URL` |
| report_gsc_insights | Google Search Console | OAuth access token | env `GSC_ACCESS_TOKEN`, optional `GSC_SITE_URL` |
| onpage_keyword_research | SEMrush API | API key | env `SEMRUSH_API_KEY` |
| links_backlink_audit | Ahrefs API | API key or bearer token | env `AHREFS_API_KEY` |
| links_opportunity_finder | Ahrefs API | API key or bearer token | env `AHREFS_API_KEY` |

---

## Deployment Targets

- Docker
- Railway
- Render
- Vercel

---

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

---

## Notes

- If credentials are missing, tools return structured errors or controlled fallback outputs.
- Write operations are protected by read-only and dry-run global switches.

---

## License

MIT

## Author

John Mingam

Website: https://johnmingam.com

