# Documentation Technique Privée — seo-mcp
## Guide Complet de Création, Déploiement & Maintenance
### John Mingam · astronaut.plus · Usage Interne

---

> **Ce document est ton manuel de bord complet.** Il couvre TOUT : de zéro à la mise en production, 
> les décisions d'architecture, les pièges à éviter, et comment faire évoluer le serveur.

---

## TABLE DES MATIÈRES

1. [Contexte & Vision](#1-contexte--vision)
2. [Stack Technique](#2-stack-technique)
3. [Setup de l'environnement de dev](#3-setup-de-lenvironnement-de-dev)
4. [Architecture détaillée](#4-architecture-détaillée)
5. [Implémentation step-by-step](#5-implémentation-step-by-step)
6. [Configuration WordPress](#6-configuration-wordpress)
7. [Configuration Shopify](#7-configuration-shopify)
8. [Configuration Custom CMS](#8-configuration-custom-cms)
9. [Tests & Validation](#9-tests--validation)
10. [Déploiement](#10-déploiement)
11. [Maintenance & Évolution](#11-maintenance--évolution)
12. [Monétisation](#12-monétisation)
13. [Roadmap](#13-roadmap)

---

## 1. CONTEXTE & VISION

### Pourquoi ce MCP ?

Tu es l'expert Entity SEO le plus avancé en francophonie. Ton MCP doit incarner cette expertise. 
L'idée : donner à Claude des **superpowers SEO réels** — pas juste lui faire générer du texte sur le SEO, 
mais lui permettre de **lire, analyser, et modifier** des vrais sites.

### Ce que ça change concrètement

Avant le MCP :
```
Tu : "Génère un JSON-LD pour mon site"
Claude : [génère un JSON-LD générique de 10 lignes]
```

Avec le MCP :
```
Tu : "Audite mon site WordPress et génère le JSON-LD optimal"
Claude : [se connecte à ton WP, lit les pages, analyse l'entité, 
          valide contre Google Rich Results, génère JSON-LD contextualisé
          avec tes vraies données, et l'injecte directement dans WP]
```

### Position stratégique

Ce MCP est :
- Ton **outil de consulting** (tu travailles 3x plus vite)
- Ton **produit SaaS** (tu le vends via astronaut.plus)
- Ton **proof of expertise** (personne d'autre en France ne fait ça)

---

## 2. STACK TECHNIQUE

### Choix technologiques (et pourquoi)

| Technologie | Choix | Raison |
|-------------|-------|--------|
| Langage | TypeScript | Meilleur support SDK MCP, typage fort, écosystème npm |
| Runtime | Node.js 20+ | LTS stable, natif sur Railway/Render/Vercel |
| Transport local | stdio | Standard MCP pour Claude Desktop |
| Transport remote | Streamable HTTP | Stateless, scalable, compatible Claude.ai |
| Validation | Zod | Typage runtime + schema generation |
| HTTP Client | node-fetch / axios | Fetch natif Node 20 ou axios pour retry |
| Cache | Redis (optionnel) | Réduire les appels API externes |
| Tests | Vitest | Plus rapide que Jest, ESM natif |
| Lint | ESLint + Prettier | Standard de qualité |
| CI/CD | GitHub Actions | Gratuit, intégré |

### Dépendances clés

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.22.0",
    "axios": "^1.6.0",
    "ioredis": "^5.3.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0",
    "vitest": "^1.0.0",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "prettier": "^3.1.0"
  }
}
```

---

## 3. SETUP DE L'ENVIRONNEMENT DE DEV

### Prérequis

```bash
# Vérifier les versions
node --version    # doit être >= 20.0.0
npm --version     # doit être >= 9.0.0
git --version     # n'importe quelle version récente
```

**Si Node.js pas à jour :**
```bash
# Sur macOS (avec Homebrew)
brew install node@20
brew link node@20

# Sur Linux/Ubuntu
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Sur Windows
# Télécharger l'installeur sur nodejs.org
```

### Initialisation du projet

```bash
# 1. Créer le repo
mkdir seo-mcp
cd seo-mcp
git init

# 2. Initialiser npm
npm init -y

# 3. Installer les dépendances
npm install @modelcontextprotocol/sdk zod axios ioredis dotenv
npm install -D typescript @types/node vitest eslint @typescript-eslint/eslint-plugin prettier

# 4. Initialiser TypeScript
npx tsc --init
```

### tsconfig.json optimal

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### package.json scripts

```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch & node --watch dist/index.js",
    "start": "node dist/index.js",
    "start:stdio": "node dist/index.js --transport stdio",
    "start:http": "node dist/index.js --transport http",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write src/**/*.ts",
    "inspector": "npx @modelcontextprotocol/inspector node dist/index.js",
    "prepublishOnly": "npm run build && npm test"
  },
  "bin": {
    "seo-mcp": "./dist/index.js"
  }
}
```

---

## 4. ARCHITECTURE DÉTAILLÉE

### Vue d'ensemble

```
[Claude Desktop / Claude.ai]
          │
          │ MCP Protocol (stdio ou HTTP)
          ▼
    ┌─────────────┐
    │  MCP Server │  ← server.ts (point d'entrée)
    │  (seo-mcp)  │
    └──────┬──────┘
           │
    ┌──────▼──────────────────────────────┐
    │           Tool Registry             │
    │  entity/ technical/ onpage/ ...     │
    └──────┬──────────────────────────────┘
           │
    ┌──────▼──────────────────────────────┐
    │         Platform Adapters           │
    │  WordPress │ Shopify │ Custom CMS   │
    └──────┬──────────────────────────────┘
           │
    ┌──────▼──────────────────────────────┐
    │           Services                  │
    │  Schema │ Entity │ HTTP │ Cache     │
    └─────────────────────────────────────┘
```

### Fichier d'entrée : src/index.ts

```typescript
#!/usr/bin/env node

import { parseArgs } from 'node:util';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createSEOMCPServer } from './server.js';
import { loadConfig } from './config.js';

const { values } = parseArgs({
  options: {
    transport: { type: 'string', default: 'stdio' },
    port: { type: 'string', default: '3000' },
  }
});

async function main() {
  const config = loadConfig();
  const server = createSEOMCPServer(config);

  if (values.transport === 'http') {
    const transport = new StreamableHTTPServerTransport({
      port: parseInt(values.port as string),
      apiKey: config.apiKey,
    });
    await server.connect(transport);
    console.error(`seo-mcp running on http://localhost:${values.port}`);
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('seo-mcp running in stdio mode');
  }
}

main().catch(console.error);
```

### Serveur principal : src/server.ts

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerEntityTools } from './tools/entity/index.js';
import { registerTechnicalTools } from './tools/technical/index.js';
import { registerOnPageTools } from './tools/onpage/index.js';
import { registerLinkTools } from './tools/links/index.js';
import { registerPlatformTools } from './tools/platform/index.js';
import { registerReportingTools } from './tools/reporting/index.js';

export function createSEOMCPServer(config: Config) {
  const server = new McpServer({
    name: 'seo-mcp',
    version: '1.0.0',
    description: 'Advanced SEO & Entity SEO MCP Server by John Mingam',
  });

  // Enregistrement de tous les outils
  registerEntityTools(server, config);
  registerTechnicalTools(server, config);
  registerOnPageTools(server, config);
  registerLinkTools(server, config);
  registerPlatformTools(server, config);
  registerReportingTools(server, config);

  return server;
}
```

### Pattern d'implémentation d'un outil

Voici le pattern exact à répliquer pour chaque outil :

```typescript
// src/tools/entity/entity-schema-generate.ts

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const inputSchema = z.object({
  entity_type: z.enum([
    'Person', 'Organization', 'Product', 'Article', 
    'LocalBusiness', 'FAQPage', 'HowTo', 'Event'
  ]).describe('Schema.org entity type'),
  
  data: z.record(z.unknown()).describe(
    'Entity data as key-value pairs. Keys should match Schema.org properties.'
  ),
  
  platform: z.enum(['wordpress', 'shopify', 'custom']).optional()
    .describe('Target platform for platform-specific optimizations'),
  
  include_sameAs: z.boolean().default(true)
    .describe('Include sameAs URIs for entity disambiguation'),
});

export function registerEntitySchemaGenerate(server: McpServer, config: Config) {
  server.registerTool(
    'entity_schema_generate',
    {
      description: `Generate production-ready Schema.org JSON-LD for any entity type.
      Uses John Mingam's Entity SEO best practices including proper @id, sameAs chains,
      and Google Rich Results compatibility. Validates output against Schema.org spec.`,
      
      inputSchema: inputSchema.shape,
      
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    
    async (input) => {
      try {
        const validated = inputSchema.parse(input);
        
        // Construction du JSON-LD
        const jsonld = buildJSONLD(validated);
        
        // Validation
        const validation = validateJSONLD(jsonld);
        
        // Score de richesse
        const richness = calculateRichnessScore(jsonld, validated.entity_type);
        
        return {
          // Données structurées (pour traitement programmatique)
          structuredContent: {
            jsonld,
            validation_errors: validation.errors,
            validation_warnings: validation.warnings,
            richness_score: richness,
            rich_result_types: validation.eligibleRichResults,
          },
          
          // Texte lisible (pour Claude et l'humain)
          content: [{
            type: 'text' as const,
            text: formatSchemaResponse(jsonld, validation, richness),
          }],
        };
        
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: formatError(error, 'entity_schema_generate'),
          }],
          isError: true,
        };
      }
    }
  );
}

function buildJSONLD(input: z.infer<typeof inputSchema>) {
  const base = {
    '@context': 'https://schema.org',
    '@type': input.entity_type,
    '@id': `#${input.entity_type.toLowerCase()}`,
    ...input.data,
  };
  
  // Ajouter sameAs si disponible
  if (input.include_sameAs && input.data.name) {
    base['sameAs'] = buildSameAsURIs(input.data.name as string);
  }
  
  return JSON.stringify(base, null, 2);
}

function formatSchemaResponse(jsonld: string, validation: ValidationResult, richness: number): string {
  return `## Schema.org JSON-LD Generated ✅

**Richness Score**: ${richness}/100
**Rich Results Eligible**: ${validation.eligibleRichResults.join(', ') || 'None detected'}
${validation.errors.length > 0 ? `**⚠️ Errors**: ${validation.errors.join(', ')}` : ''}

### JSON-LD to implement:
\`\`\`json
${jsonld}
\`\`\`

### Implementation:
Add this script tag in the \`<head>\` of your page:
\`\`\`html
<script type="application/ld+json">
${jsonld}
</script>
\`\`\`
`;
}
```

---

## 5. IMPLÉMENTATION STEP-BY-STEP

### Ordre de développement recommandé

**Phase 1 — Infrastructure (Semaine 1)**
```
✅ Day 1 : Setup projet, tsconfig, package.json, .env
✅ Day 2 : server.ts, index.ts, config.ts, types de base
✅ Day 3 : HTTP service (axios wrapper avec retry/backoff)
✅ Day 4 : Cache service (Redis + fallback mémoire)
✅ Day 5 : Tests d'infrastructure + MCP Inspector OK
```

**Phase 2 — Outils Entity SEO (Semaine 2)**
```
✅ entity_schema_generate  ← commencer par là, le plus utilisé
✅ entity_schema_validate
✅ entity_analyze
✅ entity_sft_audit
✅ entity_wikidata_lookup
✅ entity_sameAs_builder
... (12 outils au total)
```

**Phase 3 — Outils Techniques (Semaine 3)**
```
✅ technical_core_web_vitals  ← Google PSI API
✅ technical_robots_txt
✅ technical_sitemap_audit
✅ technical_canonical_audit
✅ technical_structured_data_audit
... (15 outils)
```

**Phase 4 — Outils On-Page (Semaine 4)**
```
✅ onpage_audit
✅ onpage_content_brief
✅ onpage_semantic_field
... (13 outils)
```

**Phase 5 — Adapters Platform (Semaine 5-6)**
```
✅ WordPress adapter + 5 outils WP
✅ Shopify adapter + 5 outils Shopify
✅ Custom CMS adapter + 3 outils
```

**Phase 6 — Reporting + Polish (Semaine 7)**
```
✅ 7 outils de reporting
✅ Tests complets
✅ Documentation
✅ Publication npm
```

### Comment utiliser le Master Prompt pour implémenter

1. Ouvre une conversation Claude avec **Claude Opus 4**
2. Copie-colle le contenu de `seo-mcp-master-prompt.md`
3. Ajoute à la fin : `"Start with Phase 1 infrastructure. Generate all files for src/index.ts, src/server.ts, src/config.ts, and src/types/. Show complete TypeScript code."`
4. Pour chaque phase suivante, continue dans la même conversation en disant : `"Phase 2 complete. Now implement the entity tools. Start with entity_schema_generate.ts with full implementation."`

---

## 6. CONFIGURATION WORDPRESS

### Créer les Application Passwords

1. Aller sur `https://tonsite.com/wp-admin/profile.php`
2. Descendre jusqu'à **Application Passwords**
3. Nom : `seo-mcp-access`
4. Cliquer **Add New Application Password**
5. **Copier le mot de passe généré** (format : `xxxx xxxx xxxx xxxx xxxx xxxx`)

### Tester la connexion

```bash
curl -u "admin:xxxx xxxx xxxx xxxx xxxx xxxx" \
  https://tonsite.com/wp-json/wp/v2/posts?per_page=1

# Réponse attendue : JSON avec les posts
```

### Permissions minimales requises

L'utilisateur WordPress utilisé doit avoir :
- Rôle : **Editor** minimum (pour lire/écrire les posts)
- Ou : **Administrator** (pour tout accéder)

### Compatibilité plugins SEO

| Plugin | Compatible | Notes |
|--------|-----------|-------|
| Yoast SEO | ✅ | Champs `yoast_head_json` dans REST API |
| Rank Math | ✅ | Champs `rank_math_*` dans REST API |
| SEOPress | ✅ | Nécessite SEOPress Pro pour REST complet |
| All in One SEO | ⚠️ | Support partiel |

### Activer REST API si désactivée

Dans `functions.php` ou un plugin :
```php
// Vérifier si désactivée
add_filter('rest_authentication_errors', function($result) {
    return $result;
});
```

---

## 7. CONFIGURATION SHOPIFY

### Créer une Custom App

1. **Shopify Admin** → Settings → Apps → Develop Apps
2. Cliquer **Create an app**
3. Nom : `SEO MCP`
4. Dans **Configure Admin API scopes** :
   - `read_products` + `write_products`
   - `read_content` + `write_content`  
   - `read_online_store_pages` + `write_online_store_pages`
   - `read_themes` (pour audit de thème)
   - `read_analytics` (pour reporting)
5. **Install app** → copier le **Admin API access token**

### Tester la connexion

```bash
curl -X GET \
  "https://mystore.myshopify.com/admin/api/2024-10/products.json?limit=1" \
  -H "X-Shopify-Access-Token: shpat_xxxxxxxx"
```

### Rate limits Shopify

Shopify utilise un système de **buckets** :
- 40 points/bucket en REST (version legacy)
- 50 req/s en GraphQL
- Chaque requête coûte 1 point, bucket se recharge à 2/s

Le serveur gère ça automatiquement avec un queue et exponential backoff.

### Problèmes courants Shopify

**Duplicate content** : Shopify crée des URLs en double pour les produits dans les collections :
- `/products/mon-produit` ← URL canonique
- `/collections/ma-collection/products/mon-produit` ← à canonicaliser

L'outil `shopify_canonical_fix` génère le code Liquid pour gérer ça.

---

## 8. CONFIGURATION CUSTOM CMS

### Strapi

```env
CMS_API_URL=https://your-strapi.com/api
CMS_AUTH_TYPE=bearer
CMS_AUTH_TOKEN=your-jwt-token
```

Mapping de champs à configurer :
```json
{
  "title_field": "title",
  "meta_title_field": "seo.metaTitle",
  "meta_description_field": "seo.metaDescription",
  "slug_field": "slug",
  "content_field": "content"
}
```

### Contentful

```env
CMS_API_URL=https://api.contentful.com
CMS_AUTH_TYPE=bearer
CMS_AUTH_TOKEN=your-contentful-token
CONTENTFUL_SPACE_ID=your-space-id
```

### Sanity

```env
CMS_API_URL=https://your-project.api.sanity.io/v2024-01-01/data/query/production
CMS_AUTH_TYPE=bearer
CMS_AUTH_TOKEN=your-sanity-token
```

### Headless custom

Pour un CMS 100% custom, utilise l'outil `cms_api_seo_read` avec la config :
```json
{
  "api_url": "https://ton-cms.com/api",
  "auth": {
    "type": "bearer",
    "token": "xxx"
  },
  "endpoint_config": {
    "list_endpoint": "/pages",
    "single_endpoint": "/pages/{id}",
    "field_mapping": {
      "id": "id",
      "title": "title",
      "meta_title": "seo_title",
      "meta_description": "seo_description",
      "slug": "url_slug",
      "content": "body"
    }
  }
}
```

---

## 9. TESTS & VALIDATION

### MCP Inspector (test manuel)

```bash
# Builder d'abord
npm run build

# Lancer l'inspector
npm run inspector
# Ouvre http://localhost:6274

# Dans l'interface :
# 1. Aller dans l'onglet "Tools"
# 2. Sélectionner un outil
# 3. Remplir les paramètres
# 4. Exécuter
# 5. Vérifier le résultat
```

### Tests automatisés avec Vitest

```typescript
// tests/entity/entity-schema-generate.test.ts

import { describe, it, expect } from 'vitest';
import { buildJSONLD } from '../../src/tools/entity/entity-schema-generate.js';

describe('entity_schema_generate', () => {
  it('generates valid Person schema', () => {
    const result = buildJSONLD({
      entity_type: 'Person',
      data: {
        name: 'John Mingam',
        jobTitle: 'Expert Entity SEO',
        url: 'https://johnmingam..com',
      },
      include_sameAs: true,
    });
    
    const parsed = JSON.parse(result);
    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed['@type']).toBe('Person');
    expect(parsed.name).toBe('John Mingam');
  });
  
  it('includes sameAs when requested', () => {
    // ...
  });
  
  it('handles missing required fields gracefully', () => {
    // ...
  });
});
```

```bash
npm test
# ou en watch mode pendant le dev
npm run test:watch
```

### Checklist de validation avant release

```
□ npm run build  → 0 erreur TypeScript
□ npm test       → tous les tests passent
□ npm run lint   → 0 warning ESLint
□ MCP Inspector  → tous les outils listés et fonctionnels
□ Test Claude Desktop → connexion stdio OK
□ Test Claude.ai HTTP → connexion HTTP OK
□ Test WordPress réel → lecture/écriture OK
□ Test Shopify sandbox → lecture/écriture OK
□ README.md à jour
□ CHANGELOG.md à jour
```

---

## 10. DÉPLOIEMENT

### Option A — Local (Claude Desktop)

**1. Build**
```bash
npm run build
```

**2. Claude Desktop config** (`~/Library/Application Support/Claude/claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "seo-mcp": {
      "command": "node",
      "args": ["/chemin/absolu/vers/seo-mcp/dist/index.js", "--transport", "stdio"],
      "env": {
        "WP_URL": "https://tonsite.com",
        "WP_USERNAME": "admin",
        "WP_APP_PASSWORD": "xxxx xxxx xxxx xxxx xxxx xxxx",
        "SHOPIFY_SHOP_DOMAIN": "tonstore.myshopify.com",
        "SHOPIFY_ADMIN_API_KEY": "shpat_xxx"
      }
    }
  }
}
```

**3. Redémarrer Claude Desktop** complètement.

**4. Vérifier** : dans Claude Desktop, tu dois voir "seo-mcp" dans les MCP servers disponibles.

---

### Option B — npm global (pour toi + tes clients)

```bash
# Publier sur npm
npm login
npm publish --access public

# Les clients installent
npm install -g seo-mcp

# Claude Desktop config client
{
  "mcpServers": {
    "seo-mcp": {
      "command": "seo-mcp",
      "args": ["--transport", "stdio"],
      "env": { ... }
    }
  }
}
```

---

### Option C — Docker (production clients)

**Dockerfile**
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 3000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/index.js", "--transport", "http"]
```

**docker-compose.yml**
```yaml
version: '3.8'
services:
  seo-mcp:
    build: .
    ports:
      - "3000:3000"
    environment:
      - SEO_MCP_API_KEY=${SEO_MCP_API_KEY}
      - WP_URL=${WP_URL}
      - WP_USERNAME=${WP_USERNAME}
      - WP_APP_PASSWORD=${WP_APP_PASSWORD}
    restart: unless-stopped
    
  redis:
    image: redis:7-alpine
    restart: unless-stopped
```

```bash
docker-compose up -d
```

---

### Option D — Railway (le plus simple pour production)

```bash
# Installer Railway CLI
npm install -g @railway/cli

# Login
railway login

# Déployer
railway init
railway up

# Variables d'env dans Railway Dashboard
# Settings → Variables → Add Variable
```

**Prix Railway** : ~5$/mois pour un petit serveur. Parfait pour les clients.

---

### Option E — Vercel (serverless)

Pour les outils read-only uniquement (les outils d'écriture nécessitent des connexions persistantes).

```bash
npm install -g vercel
vercel deploy
```

---

## 11. MAINTENANCE & ÉVOLUTION

### Versioning sémantique

Suivre SemVer strictement :
- `PATCH` (1.0.x) : bugfixes, pas de nouveau tool, pas de breaking change
- `MINOR` (1.x.0) : nouveaux tools, pas de breaking change
- `MAJOR` (x.0.0) : breaking changes (renommage de tools, changement de signature)

### Ajouter un nouveau tool

1. Créer `src/tools/[category]/[tool-name].ts`
2. Implémenter selon le pattern (voir section 4)
3. L'exporter dans `src/tools/[category]/index.ts`
4. L'enregistrer dans `registerXxxTools(server, config)` de la catégorie
5. Ajouter le test dans `tests/[category]/[tool-name].test.ts`
6. Documenter dans README.md
7. Mettre à jour CHANGELOG.md

### Monitoring en production

Endpoints à surveiller :
- `GET /health` → `{ status: 'ok', version: '1.0.0', tools: 65 }`
- `GET /metrics` → métriques Prometheus (optionnel)

Logs à analyser :
- Outils les plus utilisés → prioriser les améliorations
- Erreurs les plus fréquentes → bugfixes
- Temps de réponse → optimisation cache

### Mise à jour des APIs externes

| API | Surveiller |
|-----|-----------|
| Shopify | Changelogs API version (quarterly) |
| WordPress REST | Core updates, plugin compatibility |
| Google PSI | Metrics changes (LCP, CLS, INP évoluent) |
| Wikidata | API endpoints stables, pas de souci |
| Schema.org | Nouvelles propriétés (2x/an) |

---

## 12. MONÉTISATION

### Modèle 1 — Usage Personnel (gratuit)
- Tu utilises le MCP en local pour tes missions de consulting
- Gain de temps estimé : 3-5h/semaine → ~3 000-5 000€/mois de valeur

### Modèle 2 — Licence Client (B2B)

Offre 3 niveaux :
```
SEO MCP Starter    — 99€/mois  → read-only tools, 1 WordPress, 1 Shopify
SEO MCP Pro        — 299€/mois → tous les tools, illimité sites, support
SEO MCP Agency     — 999€/mois → multi-tenant, white-label, onboarding
```

Distribution :
- Facture le serveur hébergé sur Railway (~5€/client)
- Fournis les credentials API
- Support via email / Discord

### Modèle 3 — Formation + MCP (bundle)

Ajoute le MCP comme bonus à ta formation SEO :
- "Cours Référencement SEO A-Z 2026" + accès seo-mcp = valeur perçue ×3

### Modèle 4 — Astronaut+ intégration

Intégrer seo-mcp directement dans l'interface Astronaut+ :
- Les utilisateurs de la plateforme SaaS accèdent aux tools via l'UI
- Pas besoin de configurer MCP eux-mêmes
- Tu monetizes via les abonnements Astronaut+

---

## 13. ROADMAP

### v1.0.0 — MVP (T3 2025)
- [x] 65 tools de base
- [x] WordPress, Shopify, Custom CMS adapters
- [x] stdio + HTTP transport
- [x] npm package + Docker

### v1.1.0 — Enrichissement (T4 2025)
- [ ] Intégration Google Search Console API directe
- [ ] Intégration Google Analytics 4
- [ ] Ahrefs API pour backlinks
- [ ] SEMrush API pour keywords
- [ ] Support multilingue (hreflang auto)

### v1.2.0 — IA Avancée (T1 2026)
- [ ] Analyse automatique SERP avec web search
- [ ] Génération de contenu SEO-first via Claude API
- [ ] Détection automatique des opportunités de rich results
- [ ] Scoring E-E-A-T automatisé

### v2.0.0 — Plateforme (T2 2026)
- [ ] Multi-tenant (plusieurs clients dans une instance)
- [ ] Dashboard de monitoring
- [ ] API REST propre (en plus de MCP)
- [ ] SDK JavaScript pour intégration tiers
- [ ] Webhooks (alertes SEO automatiques)

---

## RESSOURCES UTILES

### Documentation MCP
- Spec officielle : https://modelcontextprotocol.io
- TypeScript SDK : https://github.com/modelcontextprotocol/typescript-sdk
- MCP Inspector : `npx @modelcontextprotocol/inspector`

### Documentation APIs
- WordPress REST API : https://developer.wordpress.org/rest-api/
- Shopify Admin API : https://shopify.dev/docs/api/admin-rest
- Google PageSpeed Insights API : https://developers.google.com/speed/docs/insights/v5/get-started
- Schema.org : https://schema.org/docs/full.html
- Wikidata API : https://www.wikidata.org/wiki/Wikidata:Data_access

### Communauté MCP
- Discord officiel : https://discord.gg/modelcontextprotocol
- GitHub Discussions : https://github.com/modelcontextprotocol/specification/discussions

---

*Document interne — John Mingam — astronaut.plus — Confidentiel*
*Mis à jour : 2025*
