import { Hono } from 'hono';
import auth from './routes/auth';

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  EMAIL_API_KEY: string;
  EMAIL_FROM: string;
  AUTH_GUI_URL: string;
  AUTH_API_URL: string;
  ADMIN_GUI_URL: string;
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

// Mount auth routes at /auth
api.route('/auth', auth);

export default api;