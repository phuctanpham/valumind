
import { sign, verify } from 'hono/jwt'

// Standard token (7 days)
export async function generateToken(userId: number, secret: string): Promise<string> {
  const payload = {
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  }
  return await sign(payload, secret)
}

// Stepped-up token (10 minutes)
export async function generateSteppedUpToken(userId: number, secret: string): Promise<string> {
  const payload = {
    sub: userId,
    stepped_up: true, // Add the step-up claim
    exp: Math.floor(Date.now() / 1000) + 10 * 60, // 10 minutes
  }
  return await sign(payload, secret)
}

// Verify any token
export async function verifyToken(token: string, secret: string): Promise<any> {
  try {
    return await verify(token, secret)
  } catch (error: any) {
    // Invalidate the token by returning a payload that will fail validation
    console.error("Token verification error:", error.message);
    return { exp: 0 };
  }
}
