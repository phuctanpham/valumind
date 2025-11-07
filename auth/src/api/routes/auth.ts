auth.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized - No token provided' }, 401);
    }
    
    const token = authHeader.substring(7);
    
    let payload;
    try {
      payload = await verifyToken(token, c.env.JWT_SECRET);
    } catch (error) {
      console.error('Token verification failed:', error);
      return c.json({ error: 'Invalid or expired token' }, 401);
    }
    
    if (!payload.userId) {
      console.error('Token payload missing userId:', payload);
      return c.json({ error: 'Invalid token structure' }, 401);
    }
    
    const user = await getUserById(c.env.DB, payload.userId);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      is_verified: user.is_verified
    });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Fixed /validate endpoint
auth.get('/validate', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized - No token provided' }, 401);
    }
    
    const token = authHeader.substring(7);
    
    let payload;
    try {
      payload = await verifyToken(token, c.env.JWT_SECRET);
    } catch (error) {
      console.error('Token validation failed:', error);
      return c.json({ error: 'Invalid or expired token' }, 401);
    }
    
    if (!payload.userId) {
      console.error('Token payload missing userId:', payload);
      return c.json({ error: 'Invalid token structure' }, 401);
    }
    
    const user = await getUserById(c.env.DB, payload.userId);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json({
      valid: true,
      userId: user.id,
      email: user.email,
      isSteppedUp: payload.stepped_up || false
    });
  } catch (error) {
    console.error('Validate token error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});