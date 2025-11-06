import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';

type Env = {
    JWT_SECRET: string;
}

export const stepUpMiddleware = createMiddleware<{ Variables: { userId: string, claims: any }, Bindings: Env }>(async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized', message: 'Bearer token not provided' }, 401);
    }

    const token = authHeader.substring(7);

    try {
        const decoded = await verify(token, c.env.JWT_SECRET);

        // Check for the 'stepped_up' claim
        if (!decoded.stepped_up) {
            return c.json({ 
                error: 'Step-up authentication required', 
                message: 'This action requires additional verification.' 
            }, 403); // 403 Forbidden is appropriate here
        }

        // Check expiration
        if (decoded.exp < Math.floor(Date.now() / 1000)) {
            return c.json({ error: 'Unauthorized', message: 'Token has expired' }, 401);
        }

        // Attach user ID and other claims to context for downstream use
        c.set('userId', decoded.sub);
        c.set('claims', decoded);

        await next();
    } catch (err) {
        return c.json({ error: 'Unauthorized', message: 'Invalid or expired token' }, 401);
    }
});
