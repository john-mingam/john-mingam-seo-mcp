# Deployment

## Docker

```bash
docker build -t seo-mcp .
docker run -p 3000:3000 --env-file .env seo-mcp
```

## Railway

- Connect GitHub repository
- Add environment variables
- Deploy using railway.json

## Render

- Create Web Service from repo
- Render uses render.yaml
- Set environment variables in dashboard

## Vercel

- Build project before deploy
- Ensure dist/index.js exists
- Set runtime env variables

## Claude.ai remote

Use URL mode in MCP config:

```json
{
  "mcpServers": {
    "seo-mcp": {
      "url": "https://your-deployment.example.com",
      "apiKey": "your-api-key"
    }
  }
}
```
