# Deployment Guide

This project uses **GitHub Actions** for automatic deployment to Cloudflare Workers.

## Automatic Deployment Setup

### Prerequisites

1. GitHub repository: `https://github.com/Dgilmore-CF/pcap-analyzer-worker.git`
2. Cloudflare account with Workers enabled
3. Custom domain: `warp-analyzer.dtg-lab.net`

---

## GitHub Secrets Configuration

You need to configure two secrets in your GitHub repository:

### 1. Get Your Cloudflare API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click **"Create Token"**
3. Use the **"Edit Cloudflare Workers"** template
4. Configure permissions:
   - Account → Workers Scripts → Edit
   - Account → Account Settings → Read
   - Zone → Workers Routes → Edit (if using custom domains)
5. Set Account Resources: Include your specific account
6. Set Zone Resources: Include `dtg-lab.net` (or all zones)
7. Click **"Continue to summary"** → **"Create Token"**
8. **Copy the token** (you won't see it again!)

### 2. Get Your Cloudflare Account ID

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your account
3. On the right sidebar, find **Account ID**
4. Copy the ID (format: 32-character hex string)

### 3. Add Secrets to GitHub

1. Go to your repository: `https://github.com/Dgilmore-CF/pcap-analyzer-worker`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add both secrets:

**Secret 1:**
- Name: `CLOUDFLARE_API_TOKEN`
- Value: [Your API token from step 1]

**Secret 2:**
- Name: `CLOUDFLARE_ACCOUNT_ID`
- Value: [Your Account ID from step 2]

---

## How Deployment Works

### Automatic Deployments

The workflow (`.github/workflows/deploy.yml`) automatically deploys when:

1. **Push to main branch:**
   ```bash
   git add .
   git commit -m "Update worker code"
   git push origin main
   ```
   → GitHub Actions automatically deploys to Cloudflare

2. **Pull request to main:**
   - Runs deployment preview (if configured)

3. **Manual trigger:**
   - Go to **Actions** tab in GitHub
   - Select **"Deploy to Cloudflare Workers"**
   - Click **"Run workflow"**

### Deployment Process

```
1. Push code to GitHub
   ↓
2. GitHub Actions triggers
   ↓
3. Install dependencies (npm ci)
   ↓
4. Deploy to Cloudflare Workers
   ↓
5. Worker updates at warp-analyzer.dtg-lab.net
```

---

## Workflow Status

Check deployment status:
- GitHub repository → **Actions** tab
- See real-time logs
- Get deployment notifications

---

## Local Development

For local testing (does NOT deploy):

```bash
# Install dependencies
npm install

# Run local dev server
npm run dev

# Access at http://localhost:8787
```

---

## Manual Deployment (Optional)

If you need to deploy manually:

```bash
# Authenticate with Cloudflare (first time only)
npx wrangler login

# Deploy directly
npm run deploy
```

**Note:** With GitHub Actions configured, you rarely need manual deployment.

---

## Troubleshooting

### Deployment Fails

1. **Check GitHub Actions logs:**
   - Repository → Actions → Click failed workflow
   - Review error messages

2. **Common issues:**
   - **"Invalid API token"**: Regenerate token with correct permissions
   - **"Account not found"**: Verify Account ID is correct
   - **"Unauthorized"**: Ensure token has Workers Scripts Edit permission

3. **Verify secrets:**
   - Settings → Secrets and variables → Actions
   - Secrets should show (hidden value)

### Worker Not Updating

1. Check workflow ran successfully (green checkmark)
2. Visit Cloudflare Dashboard → Workers & Pages
3. Verify deployment version and timestamp
4. Clear browser cache and test: `https://warp-analyzer.dtg-lab.net`

---

## Security Best Practices

✅ **DO:**
- Use API tokens (not API keys)
- Scope tokens to minimum required permissions
- Rotate tokens periodically
- Use GitHub Secrets (never commit tokens)

❌ **DON'T:**
- Share API tokens
- Commit tokens to git
- Use Global API Keys
- Give broader permissions than needed

---

## Monitoring

After deployment:
- Check Cloudflare Dashboard for metrics
- Monitor Workers analytics
- Review logs in Cloudflare dashboard

---

## Update Wrangler

To update to latest version:

```bash
npm install -D wrangler@latest
git add package.json package-lock.json
git commit -m "Update Wrangler"
git push origin main
```

GitHub Actions will use the updated version automatically.

---

## Version Info

- **Wrangler:** 4.70.0
- **Node.js:** 20.x (in GitHub Actions)
- **Deployment:** Automatic via GitHub Actions
- **Domain:** warp-analyzer.dtg-lab.net
