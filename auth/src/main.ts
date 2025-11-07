import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { verify } from 'hono/jwt'
import { InternalServerError, UnauthorizedError } from '../errors'
import { generateAccessToken, generateRefreshToken } from './api/middleware/jwt'

const app = new Hono()

app.use('* ', cors())

/**
 * Public route: /login
 * Authenticates a user and returns a set of access and refresh tokens.
 */
app.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json()

    // In a real application, you would validate the username and password against a database.
    // For this example, we'll use a mock validation.
    if (username !== 'admin' || password !== 'password') {
      throw new UnauthorizedError('Invalid credentials')
    }

    const MOCK_USER_ID = 123; // Mock user ID from database lookup
    const secret = c.env.JWT_SECRET as string;

    const accessToken = await generateAccessToken(MOCK_USER_ID, secret)
    const refreshToken = await generateRefreshToken(MOCK_USER_ID, secret)

    return c.json({
      accessToken,
      refreshToken,
    })
  } catch (error) {
    console.error('Login error:', error)
    if (error instanceof UnauthorizedError) {
      return c.json({ error: error.message }, 401);
    }
    return c.json({ error: 'Internal Server Error' }, 500);
  }
})

/**
 * Public route: /renew
 * Renews an access token using a valid refresh token.
 */
app.post('/renew', async (c) => {
  try {
    const { refreshToken } = await c.req.json()
    const secret = c.env.JWT_SECRET as string;

    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token not provided');
    }

    const decoded = await verify(refreshToken, secret)

    // Optional: Check if the token is marked as a refresh token
    if (decoded.type !== 'refresh') {
      throw new UnauthorizedError('Not a refresh token');
    }

    // Issue a new access token
    const newAccessToken = await generateAccessToken(decoded.userId, secret)

    return c.json({ accessToken: newAccessToken })

  } catch (error) {
    console.error('Renew error:', error);
    // Catches expired tokens, invalid signatures, etc.
    return c.json({ error: 'Unauthorized - Invalid or expired refresh token' }, 401);
  }
})

/**
 * A placeholder for a protected route to demonstrate token revocation.
 * In a real scenario, this would invalidate the token in a blacklist (e.g., Redis).
 */
app.post('/revoke', async (c) => {
    // This endpoint would be protected by middleware that validates the access token.
    // For now, we will just return a success message.
    return c.json({ message: 'Token has been revoked' });
});


app.onError((err, c) => {
  if (err instanceof InternalServerError) {
    return c.json({ error: err.message }, 500)
  }
  if (err instanceof UnauthorizedError) {
    return c.json({ error: err.message }, 401)
  }
  return c.json({ error: 'An unexpected error occurred' }, 500)
})

export default app
