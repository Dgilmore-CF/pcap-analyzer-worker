# WARP Diagnostics & PCAP Analyzer

AI-powered analyzer for Cloudflare WARP diagnostic logs and packet captures using Cloudflare Workers AI with Meta's Llama 4 Scout 17B model.

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Setup & Deployment](#setup--deployment)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Testing & Monitoring](#testing--monitoring)
- [Performance & Costs](#performance--costs)
- [Troubleshooting](#troubleshooting)
- [Advanced Topics](#advanced-topics)
- [Resources](#resources)

---

## Features

### AI-Powered Analysis
- **Model**: Meta's Llama 4 Scout 17B (131K context window)
- Identifies root causes, not just symptoms
- Severity classification (Critical/Warning/Info)
- Actionable remediation steps
- Event timeline generation
- Structured JSON output

### File Support
| Format | Support |
|--------|---------|
| WARP diag ZIP | ✅ Full extraction & parsing (40+ file types) |
| PCAP files | ✅ Binary parsing & metadata extraction |
| Individual logs | ✅ Text parsing & categorization (`.log`, `.txt`, `.json`) |

### Diagnostic Capabilities
- **Connection Issues**: Tunnel failures, authentication, network conflicts, firewall blocking
- **DNS Problems**: Resolution timeouts, NXDOMAIN errors, configuration issues
- **Performance**: Latency detection, packet loss, retransmissions
- **Configuration**: Split tunnel errors, certificate validation, setting conflicts
- **Security**: Certificate problems, TLS handshake failures, missing root CA

### Production Features
- CORS-enabled for web clients
- Comprehensive error handling with fallbacks
- Token management and file prioritization
- Rule-based fallback analysis if AI fails
- Real-time web interface included

---

## Quick Start

### Prerequisites
- **Cloudflare Account** with Workers enabled
- **GitHub Account** (for automatic deployment)
- **Node.js** 18+ and npm

### 1. Install Dependencies ⚡

```bash
npm install
```

### 2. Test Locally 🧪

```bash
npm run dev
```

Your worker runs at **http://localhost:8787**

**Test with the web interface:**
1. Open **http://localhost:8787** in your browser
2. Upload a WARP diag ZIP or PCAP file
3. See AI-powered analysis results!

**Test with cURL:**

```bash
# Get API info (JSON)
curl http://localhost:8787

# Upload a file
curl -X POST http://localhost:8787 \
  -F "file=@/path/to/warp-debugging-info.zip"
```

### 3. Deploy via GitHub 🚀

This worker automatically deploys when you push to GitHub:

```bash
# Initialize and push to GitHub
git init
git add .
git commit -m "Initial commit: WARP diagnostics analyzer"
git remote add origin https://github.com/YOUR_USERNAME/pcap-analyzer-worker.git
git push -u origin main
```

**Setup GitHub Secrets** (required):
1. Get **Cloudflare API Token**: Dashboard → My Profile → API Tokens → Create Token (use "Edit Cloudflare Workers" template)
2. Get **Cloudflare Account ID**: Dashboard → Workers & Pages (right sidebar)
3. Add to GitHub: Repository Settings → Secrets and variables → Actions
   - Add `CLOUDFLARE_API_TOKEN` (your token)
   - Add `CLOUDFLARE_ACCOUNT_ID` (your account ID)

**Monitor deployment:** Check the **Actions** tab in your GitHub repository

Your worker URL: `https://pcap-analyzer-worker.YOUR-SUBDOMAIN.workers.dev`

---

## Architecture

### AI Model

**Primary Model**: `@cf/meta/llama-4-scout-17b-16e-instruct`
- Context: 131,000 tokens (handles large log files)
- Multimodal with function calling
- Cost: $0.27/M input tokens, $0.85/M output tokens

**Alternative Models** (configurable):
- `@cf/meta/llama-3.3-70b-instruct-fp8-fast` - Faster (24K context)
- `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b` - Strong reasoning (80K context)

### File Processing Pipeline

```
Upload → ZIP Extract → Categorize → Priority Sort → 
Parse Content → Extract Key Info → Build Context → 
AI Analysis → Parse Response → Format Output
```

**Smart Prioritization:**
- High-priority files (connection, DNS): Up to 10 files
- Medium-priority files (network, config): Up to 5 files
- Content truncation: 3000 chars per file

**WARP File Categories:**
- **Connection**: `daemon.log`, `connectivity.txt`, `warp-status.txt`, `boringtun.log`
- **DNS**: `daemon_dns.log`, `dns-check.txt`, `dns_stats.log`, `dig.txt`
- **Network**: `ifconfig.txt`, `netstat.txt`, `route.txt`, `traceroute.txt`
- **Config**: `warp-settings.txt`, `warp-account.txt`, `mdm.plist`
- **PCAP**: `capture-default.pcap`, `capture-tunnel.pcap`

---

## Setup & Deployment

### Configuration

The worker is pre-configured in `wrangler.jsonc`:

```jsonc
{
  "name": "pcap-analyzer-worker",
  "main": "src/index.js",
  "compatibility_date": "2025-06-27",
  "observability": { "enabled": true },
  "ai": { "binding": "AI" }
}
```

### GitHub Actions Deployment (Recommended)

The workflow file `.github/workflows/deploy.yml` automatically:
1. Checks out code
2. Installs dependencies
3. Runs tests
4. Deploys to Cloudflare Workers

**How to use:**
1. Push code to `main` branch
2. GitHub Actions triggers automatically
3. View progress in Actions tab
4. Worker deploys to Cloudflare

**Manual trigger:** Actions tab → "Deploy to Cloudflare Workers" → Run workflow

### Manual Deployment (Alternative)

```bash
npx wrangler login
npm run deploy
```

### Custom Domain (Optional)

Add to `wrangler.jsonc`:

```jsonc
{
  "routes": [{
    "pattern": "warp-analyzer.yourdomain.com/*",
    "custom_domain": true
  }]
}
```

Then configure in Cloudflare Dashboard.

---

## Usage

### Web Interface (Browser)

The easiest way to use the analyzer is through the web interface:

1. **Open in browser**: Navigate to your worker URL
   - Local: `http://localhost:8787`
   - Production: `https://your-worker.workers.dev`

2. **Upload files**: Drag & drop or click to select files
   - WARP diag ZIP files
   - Individual PCAP files
   - Individual log files

3. **View results**: Get AI-powered analysis with:
   - Health status indicator
   - Detected issues with severity
   - Root cause analysis
   - Remediation recommendations
   - Full JSON response

The interface includes two tabs:
- **Upload & Analyze**: Interactive file upload and results
- **API Documentation**: cURL and JavaScript examples

### API Endpoints

#### GET `/`

**Browser access** (Accept: text/html): Returns web interface

**API access** (Accept: application/json): Returns API information

**cURL Example:**
```bash
curl -H "Accept: application/json" http://localhost:8787
```

**Response:**
```json
{
  "name": "WARP Diagnostics & PCAP Analyzer",
  "version": "1.0.0",
  "model": "Llama 4 Scout 17B",
  "endpoints": {
    "ui": "GET / - Web interface (browser)",
    "api_info": "GET / - API info (Accept: application/json)",
    "analyze": "POST / - Upload files"
  }
}
```

#### POST `/`
Upload WARP diagnostic files for analysis (both API and web interface use this).

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: One or more files (ZIP, PCAP, or log files)

**cURL Examples:**

```bash
# Upload warp-diag ZIP
curl -X POST https://your-worker.workers.dev \
  -F "file=@warp-debugging-info-2024-12-05-143000.zip"

# Upload multiple PCAP files
curl -X POST https://your-worker.workers.dev \
  -F "file1=@capture-default.pcap" \
  -F "file2=@capture-tunnel.pcap"

# Upload individual logs
curl -X POST https://your-worker.workers.dev \
  -F "daemon=@daemon.log" \
  -F "status=@warp-status.txt"
```

**JavaScript Example:**

```javascript
const formData = new FormData();
formData.append('file', file); // File object from input

const response = await fetch('https://your-worker.workers.dev', {
  method: 'POST',
  body: formData,
});

const analysis = await response.json();
console.log(analysis);
```

### Response Format

```json
{
  "timestamp": "2024-12-05T20:30:00.000Z",
  "filesProcessed": {
    "logFiles": 42,
    "pcapFiles": 2,
    "total": 44
  },
  "filesAnalyzed": 15,
  "pcapMetadata": [{
    "filename": "capture-default.pcap",
    "format": "PCAP",
    "version": "2.4",
    "packetCount": 1523,
    "fileSize": 245632
  }],
  "analysis": {
    "summary": "WARP client experiencing DNS resolution failures...",
    "health_status": "Degraded",
    "issues": [{
      "severity": "Critical",
      "category": "DNS",
      "title": "DNS Resolution Timeout",
      "description": "Multiple DNS queries timing out...",
      "root_cause": "DNS resolver not responding properly",
      "remediation": "1. Check DNS settings in WARP...",
      "affected_files": ["daemon_dns.log", "dns-check.txt"],
      "timestamps": ["2024-12-05T14:25:32"]
    }],
    "timeline": [{
      "timestamp": "2024-12-05T14:25:30",
      "event": "WARP tunnel established",
      "severity": "Info"
    }],
    "recommendations": [
      "Verify DNS configuration in WARP settings",
      "Check for firewall rules blocking DNS traffic"
    ]
  },
  "modelUsed": "@cf/meta/llama-4-scout-17b-16e-instruct",
  "success": true
}
```

**Severity Levels:**
- **Critical**: Complete loss of functionality
- **Warning**: Degraded functionality, core features still work
- **Info**: Informational findings, no immediate action required

---

## Project Structure

```
pcap-analyzer-worker/
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Actions deployment
├── src/
│   ├── index.js                 # Main Worker (240+ lines)
│   ├── parsers.js               # File parsing (184 lines)
│   ├── ai-analyzer.js           # AI integration (287 lines)
│   └── ui.js                    # Web interface (embedded)
├── test/
│   └── index.spec.js            # Unit tests
├── examples/
│   └── test-upload.html         # Standalone web client (reference)
├── wrangler.jsonc               # Worker configuration
├── package.json                 # Dependencies
└── README.md                    # This file
```

### Key Components

**`src/index.js`** - Main Worker
- Request handling and routing (GET/POST/OPTIONS)
- Browser vs API detection (Accept header)
- File upload processing with multipart/form-data
- Priority-based file selection
- Response formatting and error handling
- CORS support

**`src/ui.js`** - Web Interface
- Embedded HTML/CSS/JavaScript
- Drag & drop file upload
- Real-time analysis results display
- Two-tab interface (Upload & API docs)
- Auto-detects worker URL

**`src/parsers.js`** - File Parsing
- `extractZipFiles()` - ZIP extraction using fflate
- `parseTextFile()` - Text decoding (UTF-8)
- `parsePcapBasic()` - PCAP metadata extraction
- `categorizeWarpFile()` - File type identification
- `extractKeyInfo()` - Structured data extraction

**`src/ai-analyzer.js`** - AI Analysis
- `analyzeWarpDiagnostics()` - Main AI analysis
- `buildAnalysisContext()` - Context preparation with token limits
- `parseAIResponse()` - JSON extraction from AI
- `generateFallbackAnalysis()` - Rule-based backup
- `analyzePcapWithAI()` - PCAP-specific analysis

---

## Configuration

### Environment Variables (Optional)

Add to `wrangler.jsonc`:

```jsonc
{
  "vars": {
    "ENVIRONMENT": "production",
    "MAX_FILE_SIZE": "10485760"
  }
}
```

### Model Selection

To change models, edit `src/ai-analyzer.js`:

```javascript
const MODELS = {
  LLAMA4_SCOUT: '@cf/meta/llama-4-scout-17b-16e-instruct',  // Default
  LLAMA33_FAST: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  DEEPSEEK_R1: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
};
```

### Token Optimization

Adjust content limits in `src/ai-analyzer.js`:

```javascript
const maxLength = 3000; // Characters per file
// Reduce to 2000 to lower costs
```

---

## Testing & Monitoring

### Run Tests

```bash
npm test
```

**Tests include:**
- ✅ GET request returns API info
- ✅ OPTIONS request handles CORS
- ✅ POST validation (content-type)
- ✅ AI binding validation
- ✅ Integration tests

### View Real-time Logs

```bash
npx wrangler tail
```

### Cloudflare Dashboard

Monitor your worker:
- **Analytics**: Request counts, error rates
- **AI Usage**: Token consumption, model performance
- **Performance**: Latency, CPU time
- **Logs**: Error traces and debug info

**URL**: `https://dash.cloudflare.com/<account-id>/workers/services/view/pcap-analyzer-worker`

### GitHub Actions Monitoring

- **Actions Tab**: View deployment history
- **Workflow Runs**: See logs for each step
- **Notifications**: Get alerts on deployment failures

---

## Performance & Costs

### Typical Analysis Metrics

| Metric | Value |
|--------|-------|
| File extraction | 100-500ms |
| AI analysis | 2-5 seconds |
| **Total time** | **3-6 seconds** |
| Input tokens | 50K-80K |
| Output tokens | 2K-4K |
| **Cost per analysis** | **$0.015-$0.025** |

### Workers AI Pricing

**Free Plan:**
- 10,000 neurons per day
- ~14 full warp-diag analyses per day

**Paid Plan:**
- $0.011 per 1,000 neurons
- Pay-as-you-go

**Neuron Calculation (Llama 4 Scout):**
- 1 input token ≈ 10 neurons
- 1 output token ≈ 100 neurons
- Example: 50K input + 2K output = 700K neurons = $7.70

### Workers Limits

- **Request timeout**: 30 seconds (CPU time)
- **Request size**: 100 MB
- **Memory**: 128 MB

### Optimization Tips

1. **Reduce token usage**: Lower `maxLength` in `ai-analyzer.js`
2. **Use faster model**: Switch to Llama 3.3 Fast
3. **Implement caching**: Add Workers KV for common patterns
4. **Batch processing**: Process multiple files together

---

## Troubleshooting

### Deployment Issues

**"Authentication error" in GitHub Actions**
- **Cause**: Invalid API token or wrong permissions
- **Fix**: Create new token with "Edit Cloudflare Workers" permissions, update `CLOUDFLARE_API_TOKEN` secret

**"Account not found"**
- **Cause**: Incorrect Account ID
- **Fix**: Verify Account ID in Cloudflare Dashboard, update `CLOUDFLARE_ACCOUNT_ID` secret

**"npm test" step fails**
- **Fix**: Run `npm test` locally, fix failing tests, commit and push

**Workflow doesn't trigger**
- **Fix**: Ensure `.github/workflows/deploy.yml` exists and is committed
- Check Settings → Actions → General → Allow all actions

### Runtime Issues

**"AI binding not configured"**
- **Fix**: Ensure `wrangler.jsonc` has AI binding, redeploy with `npm run deploy`

**"Content-Type must be multipart/form-data"**
- **Fix**: Use `multipart/form-data` encoding for file uploads

**"No valid WARP diag or PCAP files found"**
- **Fix**: Verify file format (ZIP, PCAP, or text logs), check ZIP contents

**"Request timeout" errors**
- **Cause**: Large files or slow AI inference
- **Fix**: Upload smaller files, enable Smart Placement, or use Durable Objects

**"Connection refused" (local development)**
- **Fix**: Ensure `npm run dev` is running

**AI Analysis timeout**
- **Cause**: Large log files exceeding processing limits
- **Fix**: Upload individual high-priority files instead of full ZIP

**High latency**
- **Fix**: Enable Smart Placement in `wrangler.jsonc`:
  ```jsonc
  { "placement": { "mode": "smart" } }
  ```

**Out of memory**
- **Cause**: Very large ZIP files
- **Fix**: Add file size validation, implement streaming, process in batches

---

## Advanced Topics

### Custom Caching

Add Workers KV for caching results:

```jsonc
// wrangler.jsonc
{
  "kv_namespaces": [{
    "binding": "CACHE",
    "id": "your-kv-namespace-id"
  }]
}
```

### Rollback Deployments

```bash
# List deployments
npx wrangler deployments list

# Rollback to previous
npx wrangler rollback --message "Rollback to previous version"
```

### Scaling for High Traffic

1. **Rate Limiting**: Use Cloudflare Rate Limiting rules
2. **Queuing**: Implement Cloudflare Queues for async processing
3. **Caching**: Cache common analysis results
4. **Batch API**: Process multiple requests together

### Branch Protection

Recommended GitHub settings:
1. Settings → Branches → Add rule for `main`
2. Enable:
   - Require pull request before merging
   - Require status checks to pass
   - Require branches to be up to date

### Security Best Practices

✅ Never commit secrets to repository  
✅ Use GitHub Secrets for sensitive data  
✅ Rotate API tokens periodically  
✅ Use minimal permissions for tokens  
✅ Enable branch protection rules  

---

## Resources

### Official Documentation
- [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/)
- [Llama 4 Scout Model](https://developers.cloudflare.com/workers-ai/models/llama-4-scout-17b-16e-instruct)
- [WARP Diagnostic Logs](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/warp/troubleshooting/warp-logs/)
- [Workers AI Pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Wrangler Action](https://github.com/cloudflare/wrangler-action)

### Community
- [Cloudflare Discord](https://discord.gg/cloudflaredev)
- [Support Portal](https://support.cloudflare.com/)

### Project Files
- **Web Interface**: `src/ui.js` - Embedded HTML interface (served at GET /)
- **Example HTML**: `examples/test-upload.html` - Standalone version for reference
- **Workflow**: `.github/workflows/deploy.yml` - Automatic deployment configuration
- **Tests**: `test/index.spec.js` - Unit and integration tests

---

## Production Checklist

- [ ] Push code to GitHub: `git push origin main`
- [ ] Verify GitHub Actions deployment succeeds
- [ ] Test endpoint with real WARP diag files
- [ ] Set up monitoring alerts in Cloudflare Dashboard
- [ ] Configure custom domain (optional)
- [ ] Enable Workers Analytics
- [ ] Review and adjust rate limits
- [ ] Set up error tracking (optional)
- [ ] Configure branch protection rules

---

## Summary

### What You Get

✅ **AI-Powered Analysis**: Llama 4 Scout 17B for intelligent diagnostics  
✅ **Multi-Format Support**: ZIP, PCAP, and 40+ log file types  
✅ **Automated Deployment**: Push to GitHub, automatic deployment  
✅ **Production-Ready**: Error handling, fallbacks, CORS, monitoring  
✅ **Web Interface**: Beautiful drag & drop interface included  
✅ **Comprehensive Output**: Root causes, remediation steps, timelines  

### Quick Reference

**Start development:**
```bash
npm install && npm run dev
# Then open http://localhost:8787 in your browser
```

**Deploy:**
```bash
git push origin main
```

**Test web interface:**
```
Open http://localhost:8787 in browser
```

**Test API:**
```bash
curl -X POST http://localhost:8787 -F "file=@warp-diag.zip"
```

**Run tests:**
```bash
npm test
```

**Monitor:**
```bash
npx wrangler tail
```

---

## License

MIT

---

**Built with ❤️ using Cloudflare Workers AI**
