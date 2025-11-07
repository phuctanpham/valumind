import { sign, verify } from 'hono/jwt'

// Standard token (7 days)
export async function generateToken(userId: number, secret: string): Promise<string> {
  const payload = {
    userId: userId,  // Changed from 'sub' to 'userId'
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  }
  return await sign(payload, secret)
}

// Stepped-up token (10 minutes)
export async function generateSteppedUpToken(userId: number, secret: string): Promise<string> {
  const payload = {
    userId: userId,  // Changed from 'sub' to 'userId'
    stepped_up: true,
    exp: Math.floor(Date.now() / 1000) + 10 * 60, // 10 minutes
  }
  return await sign(payload, secret)
}

// Verify any token
export async function verifyToken(token: string, secret: string): Promise<any> {
  try {
    const payload = await verify(token, secret)
    
    // Check if token is expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired')
    }
    
    return payload
  } catch (error: any) {
    console.error("Token verification error:", error.message)
    throw error  // Throw the error instead of returning invalid payload
  }
}