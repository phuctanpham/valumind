Step 1: Restructure the auth directory
First, let's reorganize the directory structure:
bashcd auth
mkdir -p src/gui src/api
Step 2: Move API code to src/api
Move existing API files:
bash# Move API routes
mv src/routes src/api/routes
mv src/middleware src/api/middleware
mv src/utils src/api/utils
mv src/db src/api/db
Step 3: Create src/api/index.ts (API entry point)
File: auth/src/api/index.ts
typescriptimport { Hono } from 'hono';
import authRoutes from './routes/auth';

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  EMAIL_API_KEY: string;
  EMAIL_FROM: string;
  AUTH_GUI_URL: string;
};

const api = new Hono<{ Bindings: Bindings }>();

// Health check
api.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    service: 'auth-api',
    timestamp: new Date().toISOString() 
  });
});

// Mount auth routes at /api/auth
api.route('/auth', authRoutes);

export default api;
Step 4: Update src/api/routes/auth.ts - Replace environment variable names
File: auth/src/api/routes/auth.ts
Find and replace all instances:

BACKEND_URL → AUTH_API_URL
FRONTEND_URL → AUTH_GUI_URL

Key changes:
typescript// Line 76: Update verification URL
const verificationUrl = `${c.env.AUTH_API_URL || 'http://localhost:8787/api'}/auth/verify-email?token=${verificationToken}`;

// Line 163: Update redirect URLs
return c.redirect(`${c.env.AUTH_GUI_URL}?error=invalid_token&message=Link xác thực không hợp lệ`);

// Line 170: Update redirect
return c.redirect(`${c.env.AUTH_GUI_URL}?error=expired_token&message=Link xác thực đã hết hạn`);

// Line 175: Update redirect
return c.redirect(`${c.env.AUTH_GUI_URL}?verified=true&message=Xác thực thành công!`);

// Line 179: Update redirect
return c.redirect(`${c.env.AUTH_GUI_URL}?error=server_error&message=Lỗi xác thực`);

// Line 207: Update verification URL
const verificationUrl = `${c.env.AUTH_API_URL || 'http://localhost:8787/api'}/auth/verify-email?token=${verificationToken}`;

// Line 237: Update reset URL
const resetUrl = `${c.env.AUTH_GUI_URL}/reset-password?token=${resetToken}`;
Step 5: Create GUI structure in src/gui
Set up Next.js-like structure for the frontend:
bashcd auth/src/gui
mkdir -p pages components styles public
Step 6: Create src/gui/index.tsx (GUI entry point)
File: auth/src/gui/index.tsx
typescriptimport { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';

const gui = new Hono();

// Serve static assets
gui.get('/assets/*', serveStatic({ root: './public' }));

// Login page
gui.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - Valumind Auth</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container { 
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      max-width: 400px;
      width: 100%;
    }
    h1 { color: #333; margin-bottom: 1.5rem; text-align: center; }
    input { 
      width: 100%;
      padding: 0.75rem;
      margin-bottom: 1rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    button { 
      width: 100%;
      padding: 0.75rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
    }
    button:hover { background: #5568d3; }
    .message { 
      padding: 0.75rem;
      margin-bottom: 1rem;
      border-radius: 4px;
    }
    .error { background: #fee; color: #c33; }
    .success { background: #efe; color: #3c3; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔐 Valumind Auth</h1>
    <div id="message"></div>
    <form id="loginForm">
      <input type="email" id="email" placeholder="Email" required />
      <input type="password" id="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
  </div>
  <script>
    const form = document.getElementById('loginForm');
    const message = document.getElementById('message');
    
    // Show URL params messages
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified')) {
      message.innerHTML = '<div class="message success">' + params.get('message') + '</div>';
    }
    if (params.get('error')) {
      message.innerHTML = '<div class="message error">' + params.get('message') + '</div>';
    }
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (res.ok) {
          message.innerHTML = '<div class="message success">Login successful!</div>';
          localStorage.setItem('access_token', data.token);
          setTimeout(() => {
            window.location.href = 'http://localhost:3000'; // Main app URL
          }, 1000);
        } else {
          message.innerHTML = '<div class="message error">' + data.error + '</div>';
        }
      } catch (err) {
        message.innerHTML = '<div class="message error">Network error</div>';
      }
    });
  </script>
</body>
</html>
  `);
});

// Password reset page
gui.get('/reset-password', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password - Valumind Auth</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container { 
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      max-width: 400px;
      width: 100%;
    }
    h1 { color: #333; margin-bottom: 1.5rem; text-align: center; }
    input { 
      width: 100%;
      padding: 0.75rem;
      margin-bottom: 1rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    button { 
      width: 100%;
      padding: 0.75rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
    }
    button:hover { background: #5568d3; }
    .message { 
      padding: 0.75rem;
      margin-bottom: 1rem;
      border-radius: 4px;
    }
    .error { background: #fee; color: #c33; }
    .success { background: #efe; color: #3c3; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔑 Reset Password</h1>
    <div id="message"></div>
    <form id="resetForm">
      <input type="password" id="new_password" placeholder="New Password (min 6 chars)" required minlength="6" />
      <input type="password" id="confirm_password" placeholder="Confirm Password" required />
      <button type="submit">Reset Password</button>
    </form>
  </div>
  <script>
    const form = document.getElementById('resetForm');
    const message = document.getElementById('message');
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (!token) {
      message.innerHTML = '<div class="message error">Invalid reset link</div>';
      form.style.display = 'none';
    }
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const new_password = document.getElementById('new_password').value;
      const confirm_password = document.getElementById('confirm_password').value;
      
      if (new_password !== confirm_password) {
        message.innerHTML = '<div class="message error">Passwords do not match</div>';
        return;
      }
      
      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, new_password })
        });
        
        const data = await res.json();
        
        if (res.ok) {
          message.innerHTML = '<div class="message success">Password reset successfully! Redirecting...</div>';
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        } else {
          message.innerHTML = '<div class="message error">' + data.error + '</div>';
        }
      } catch (err) {
        message.innerHTML = '<div class="message error">Network error</div>';
      }
    });
  </script>
</body>
</html>
  `);
});

export default gui;
Step 7: Create unified src/main.ts
File: auth/src/main.ts
typescriptimport { Hono } from 'hono';
import { cors } from 'hono/cors';
import api from './api';
import gui from './gui';

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  EMAIL_API_KEY: string;
  EMAIL_FROM: string;
  AUTH_GUI_URL: string;
  AUTH_API_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS Middleware
app.use('/*', cors({
  origin: '*',
  credentials: true,
}));

// Mount API at /api
app.route('/api', api);

// Mount GUI at root
app.route('/', gui);

// Global error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ 
    error: 'Internal server error',
    message: err.message 
  }, 500);
});

export default app;
Step 8: Update wrangler.toml
File: auth/wrangler.toml
tomlname = "auth"
main = "src/main.ts"
compatibility_date = "2025-10-17"

[vars]
ENVIRONMENT = "production"
AUTH_GUI_URL = "https://auth.vpbank.workers.dev"
AUTH_API_URL = "https://auth.vpbank.workers.dev/api"
APP_URL = "http://localhost:3000"
EMAIL_FROM = "noreply@valumind.com"

[dev]
ip = "127.0.0.1"
port = 8787
local_protocol = "http"

[[d1_databases]]
binding = "DB"
database_name = "valumind-auth-db"
database_id = "3bea4c95-7c28-4a1c-8ae8-1159726b27c7"

[observability]
enabled = true
head_sampling_rate = 1

[observability.logs]
enabled = true
head_sampling_rate = 1
persist = true
invocation_logs = true

[observability.traces]
enabled = true
persist = true
head_sampling_rate = 1
