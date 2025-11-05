import { Hono } from 'hono';
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