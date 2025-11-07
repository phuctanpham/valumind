import { Hono } from 'hono';
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
  ADMIN_GUI_URL: string;
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