# seo-mcp · SEO Superpowers for AI Agents

<div align="center">

![seo-mcp banner](https://via.placeholder.com/1200x300/0a0a0a/F5E6A3?text=seo-mcp+%E2%80%94+Entity+SEO+MCP+Server)

**A production-grade MCP server that gives Claude and any AI agent full SEO capabilities**  
across WordPress, Shopify, and custom CMS platforms.

[![npm version](https://badge.fury.io/js/seo-mcp.svg)](https://badge.fury.io/js/seo-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue.svg)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20%2B-green)](https://nodejs.org/)

*Created by [John Mingam](https://johnmngam.com) — Entity SEO Expert · [Wikidata Q127330925](https://www.wikidata.org/wiki/Q127330925)*

</div>

---

## What is seo-mcp?

`seo-mcp` is a **Model Context Protocol (MCP) server** that exposes **65 production-ready SEO tools** to any compatible AI agent (Claude, GPT-4, etc.). It bridges the gap between AI assistants and real SEO operations — letting you ask Claude to *actually perform* SEO tasks on your site, not just explain them.

Built around the **SFT Method** (Structure · Flow · Trust) — the proprietary Entity SEO framework developed by John Mingam.

### What you can do

```
"Audit the Entity SEO of my homepage and generate optimized JSON-LD"
"Update all product meta descriptions on my Shopify store"
"Find all canonical issues across my WordPress site and fix them"
"Generate a full monthly SEO report for my client"
"Build a semantic field map for the keyword 'avocat fiscaliste Paris'"
```

---

## Features at a Glance

| Category | Tools | Highlights |
|----------|-------|------------|
| 🧠 Entity SEO & Knowledge Graph | 12 | SFT Audit, Wikidata lookup, E-E-A-T, sameAs builder |
| 🔧 Technical SEO | 15 | Core Web Vitals, sitemap, robots.txt, JS SEO |
| 📝 On-Page & Content | 13 | Content brief, semantic field, SERP analysis |
| 🔗 Link Building | 5 | Backlink audit, disavow generator, outreach |
| 🏪 Platform-Specific | 13 | WordPress REST, Shopify Admin API, Custom CMS |
| 📊 Reporting | 7 | Dashboard, competitor analysis, monthly reports |

---

## Quick Start

### Option 1 — Claude Desktop (Local, 5 minutes)

**1. Install**
```bash
npm install -g seo-mcp
```

**2. Configure Claude Desktop**

Open `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

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

**3. Restart Claude Desktop** and start using it immediately.

---

### Option 2 — Remote HTTP Server (Production)

**Docker (recommended)**
```bash
docker run -d \
  --name seo-mcp \
  -p 3000:3000 \
  -e SEO_MCP_API_KEY=your-api-key \
  johnmingam/seo-mcp:latest
```

**Railway / Render**

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/seo-mcp)

Then add to Claude Desktop config:
```json
{
  "mcpServers": {
    "seo-mcp": {
      "url": "https://your-seo-mcp.railway.app",
      "apiKey": "your-api-key"
    }
  }
}
```

---

### Option 3 — From Source

```bash
git clone https://github.com/johnmingam/seo-mcp.git
cd seo-mcp
npm install
cp .env.example .env
npm run build
npm start
```

---

## Platform Configuration

### WordPress

```env
# .env or environment variables
WP_URL=https://yoursite.com
WP_USERNAME=your-username
WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
```

Or pass inline:
```
"Connect to my WordPress at https://mysite.com with username admin 
and app password 'abcd efgh ijkl mnop qrst uvwx'"
```

**WordPress requirements:**
- WordPress 5.6+ (Application Passwords support)
- REST API enabled (default)
- Yoast SEO, Rank Math, or SEOPress installed (optional but recommended)

### Shopify

```env
SHOPIFY_SHOP_DOMAIN=mystore.myshopify.com
SHOPIFY_ADMIN_API_KEY=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_API_VERSION=2024-10
```

**Shopify requirements:**
- Custom App with Admin API access
- Scopes: `read_products`, `write_products`, `read_content`, `write_content`, `read_online_store_pages`, `write_online_store_pages`

### Custom CMS

```env
CMS_API_URL=https://your-cms.com/api
CMS_AUTH_TYPE=bearer  # bearer | apikey | basic | oauth2
CMS_AUTH_TOKEN=your-token
```

---

## Tool Reference

### Entity SEO Tools

#### `entity_analyze`
Analyze any page for Entity SEO signals using the SFT method.

```
Input:
  url: string (required)
  content: string (optional — provide if URL not publicly accessible)
  target_entity: string (optional — "Avocat Paris", "Apple Inc", etc.)

Output:
  entity_recognition_score: number (0-100)
  co_occurrence_map: Entity[]
  salience_scores: Record<string, number>
  missing_entities: string[]
  knowledge_graph_alignment: AlignmentResult
  sft_score: SFTScore
```

**Example prompt:**
```
Analyze the Entity SEO of https://mysite.com/about for the entity "John Smith, Marketing Consultant"
```

---

#### `entity_schema_generate`
Generate production-ready Schema.org JSON-LD.

**Supported types:** Person, Organization, Product, Article, LocalBusiness, FAQPage, HowTo, BreadcrumbList, WebSite, WebPage, Event, Course, Recipe, VideoObject, Review, AggregateRating, Service, SoftwareApplication

**Example prompt:**
```
Generate Schema.org JSON-LD for a local law firm:
- Name: Cabinet Dupont Avocats
- Address: 15 Rue de la Paix, 75001 Paris
- Phone: +33 1 23 45 67 89
- Specialties: droit fiscal, droit des affaires
- Founded: 2010
```

---

#### `entity_sft_audit`
Full audit using John Mingam's SFT (Structure · Flow · Trust) method.

```
Returns:
  structure_score: 0-33  (headings, schema, internal links)
  flow_score: 0-33       (entity prominence, semantic density)
  trust_score: 0-34      (E-E-A-T, citations, author entity)
  total: 0-100
  grade: A | B | C | D | F
  priority_actions: PriorityAction[]
```

---

### Technical SEO Tools

#### `technical_core_web_vitals`
Fetch and analyze Core Web Vitals.

```
Input:
  url: string
  strategy: 'mobile' | 'desktop' | 'both' (default: 'both')

Output:
  lcp: { value, rating, threshold }
  cls: { value, rating, threshold }
  inp: { value, rating, threshold }
  fcp: { value, rating, threshold }
  ttfb: { value, rating, threshold }
  recommendations: Recommendation[]
```

---

#### `technical_structured_data_audit`
Audit all structured data across your site.

```
Example prompt:
"Audit all Schema.org structured data on my WordPress site 
and tell me which pages are eligible for rich results"
```

---

### Platform Tools — WordPress

#### `wp_page_seo_update`
Update SEO metadata on WordPress pages/posts.

```
Example prompt:
"Update the title tag and meta description of WordPress post ID 42 to:
Title: 'Cabinet Dupont Avocats | Droit Fiscal Paris'
Meta: 'Expertise en droit fiscal et des affaires à Paris depuis 2010. 
Consultation gratuite. ☎ 01 23 45 67 89'"
```

#### `wp_bulk_seo_update`
Bulk update SEO fields across hundreds of posts.

```
Example prompt:
"Find all WordPress posts in category 'actualites' that have empty 
meta descriptions and generate optimized ones based on the content"
```

---

### Platform Tools — Shopify

#### `shopify_seo_audit`
Complete Shopify store SEO audit.

```
Example prompt:
"Run a full SEO audit of my Shopify store mystore.myshopify.com 
and prioritize the 10 most critical fixes"
```

#### `shopify_product_seo_update`
Update product SEO fields at scale.

```
Example prompt:
"Update the SEO title and description for Shopify product 12345678 
targeting the keyword 'chaise ergonomique bureau'"
```

---

### Reporting Tools

#### `report_monthly_seo`
Generate a complete, client-ready monthly SEO report.

```
Example prompt:
"Generate a complete monthly SEO report for March 2025 for 
mysite.com. Brand it with 'Cabinet Dupont' logo and include 
executive summary, KPIs, wins, issues, and April action plan"
```

---

## Environment Variables Reference

```env
# Server
PORT=3000
SEO_MCP_API_KEY=your-secret-key
SEO_MCP_LOG_LEVEL=info          # debug | info | warn | error
SEO_MCP_READ_ONLY=false         # true = disable all write tools
SEO_MCP_CACHE_TTL=900           # seconds

# Redis (optional, improves performance)
REDIS_URL=redis://localhost:6379

# WordPress
WP_URL=
WP_USERNAME=
WP_APP_PASSWORD=

# Shopify
SHOPIFY_SHOP_DOMAIN=
SHOPIFY_ADMIN_API_KEY=
SHOPIFY_API_VERSION=2024-10

# Custom CMS
CMS_API_URL=
CMS_AUTH_TYPE=bearer
CMS_AUTH_TOKEN=

# External APIs (optional, enhance results)
PAGESPEED_API_KEY=              # Google PageSpeed Insights
AHREFS_API_KEY=                 # Ahrefs (backlinks)
SEMRUSH_API_KEY=                # SEMrush (keywords)
```

---

## Security

- All credentials are stored in environment variables, never in config files
- API keys are masked in all logs and error messages  
- SSRF protection: all URLs are validated before fetching
- Read-only mode: set `SEO_MCP_READ_ONLY=true` to disable all write operations
- Input sanitization on all user-provided content

---

## Troubleshooting

### Claude doesn't see the seo-mcp tools

1. Check Claude Desktop config path is correct for your OS
2. Restart Claude Desktop completely (not just the window)
3. Run `seo-mcp --test` to verify the server starts correctly

### WordPress connection fails

1. Verify Application Passwords are enabled: `Settings → Users → Your Profile → Application Passwords`
2. Test the endpoint: `curl -u "username:app-password" https://yoursite.com/wp-json/wp/v2/posts`
3. Check REST API isn't blocked by security plugins (Wordfence, etc.)

### Shopify 403 error

1. Verify your Custom App has the required scopes
2. Check the API version is supported (`2024-10` or later recommended)
3. Ensure you're using the Admin API key, not the Storefront API key

---

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

```bash
git clone https://github.com/johnmingam/seo-mcp.git
cd seo-mcp
npm install
npm run dev     # Development with hot reload
npm test        # Run test suite
npm run lint    # TypeScript + ESLint
```

---

## Changelog

### v1.0.0 (2025-Q3)
- Initial release with 65 tools
- WordPress, Shopify, Custom CMS adapters
- SFT Method integration
- Entity SEO tools suite
- Full Schema.org generation engine

---

## License

MIT © [John Mingam](https://johnmingam.com)

---

## Credits & Links

- **Author**: John Mingam — Entity SEO Expert
- **Website**: [johnmingam.com](https://johnmingam.com)
- **LinkedIn**: [linkedin.com/in/johnmingam](https://linkedin.com/in/johnmingam)
- **MCP Protocol**: [modelcontextprotocol.io](https://modelcontextprotocol.io)

---

*seo-mcp is an independent open-source project. Not affiliated with Anthropic, Google, WordPress, or Shopify.*
