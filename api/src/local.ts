import { serve } from '@hono/node-server'
import app from './main'

console.log('Server is running on http://localhost:3004')

serve({
  fetch: app.fetch,
  port: 3004
})
