import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';

const gui = new Hono();

// Serve static assets
gui.get('/assets/*', serveStatic({ root: './public' }));

// Login page
gui.get('/', (c) => {
  const appUrl = c.env.APP_URL; // Get APP_URL from environment

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
            window.location.href = '${appUrl}'; // Main app URL
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