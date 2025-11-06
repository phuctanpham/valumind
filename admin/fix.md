Issue Analysis
The deployment script expects a static build output (like out/ or dist/) but Next.js created a .next directory (server-side rendering build). Your wrangler.toml is configured for Cloudflare Pages but the build type doesn't match.
Fix: Update Admin Deployment Configuration
1. Modify admin/next.config.mjs
typescript/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enable static export
  images: {
    unoptimized: true // Required for static export
  },
  // Remove trailing slashes for clean URLs
  trailingSlash: true,
};

export default nextConfig;
2. Update job of deploy-admin which is in .github/workflows/main.yml

yaml# Find the section checking build output, replace with:

- name: Check build output
  run: |
    echo "Checking for build directories..."
    if [ -d "out" ]; then
      echo "✅ Static export found in 'out/'"
      ls -la out/
    elif [ -d ".next" ]; then
      echo "⚠️ Server build found - check next.config.mjs for 'output: export'"
      exit 1
    else
      echo "❌ No build output found"
      exit 1
    fi

# Update Wrangler deployment step to use 'out' directory:
- name: Deploy to Cloudflare Pages
  run: npx wrangler pages deploy out --project-name=admin
3. Verify admin/wrangler.toml
tomlname = "admin"
compatibility_date = "2024-11-06"

[site]
bucket = "./out"  # Change from .next to out

# Ensure these exist
[[redirects]]
from = "/*"
to = "/index.html"
status = 200
4. Test Build Locally
bashcd admin
npm run build
# Should create 'out/' directory
ls -la out/
```

## Why This Fixes It

- **`output: 'export'`**: Forces Next.js to generate static HTML/CSS/JS files
- **`out/` directory**: Standard location for Next.js static exports
- **`unoptimized: true`**: Cloudflare Pages handles image optimization differently
- **Build check**: Script now validates correct output type

## Quick Validation

After changes, your build should show:
```
✅ Static export found in 'out/'
total XXX
-rw-r--r-- index.html
drwxr-xr-x _next/
