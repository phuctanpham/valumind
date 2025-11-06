
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { stepUpMiddleware } from '../middleware/step_up'; // Import the new middleware
import { fetchJSON } from '../utils/http';

type Bindings = {
  AUTH_API_URL: string;
  OCR_SRV_URL: string;
  JWT_SECRET: string;
};

const ocr = new Hono<{ Bindings: Bindings }>();

// --- Step-Up Authentication Routes ---
const stepUp = new Hono<{ Bindings: Bindings }>();

// 1. Initiate Step-Up: Requires a standard logged-in user
stepUp.post('/initiate', authMiddleware, async (c) => {
  const userId = c.get('userId');
  console.log(`User ${userId} initiating step-up authentication.`);

  try {
    // Call the auth service to send an OTP to the user
    const result = await fetchJSON(`${c.env.AUTH_API_URL}/step-up/initiate`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });

    if (!result.ok) {
      return c.json(result.data, result.status);
    }
    return c.json({ message: 'Verification code sent.' });
  } catch (error) {
    console.error('Step-up initiate error:', error);
    return c.json({ error: 'Failed to initiate step-up authentication' }, 500);
  }
});

// 2. Verify Step-Up: Requires a standard logged-in user + OTP
stepUp.post('/verify', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { otp } = await c.req.json();

  if (!otp) {
    return c.json({ error: 'OTP is required' }, 400);
  }

  try {
    // Call the auth service to verify the OTP
    const result = await fetchJSON(`${c.env.AUTH_API_URL}/step-up/verify`, {
      method: 'POST',
      body: JSON.stringify({ userId, otp }),
    });

    if (!result.ok) {
      return c.json(result.data, result.status);
    }
    
    // Return the new stepped-up JWT to the client
    return c.json(result.data);
  } catch (error) {
    console.error('Step-up verify error:', error);
    return c.json({ error: 'Failed to verify step-up authentication' }, 500);
  }
});

// Mount the step-up routes
ocr.route('/step-up', stepUp);

// --- Main OCR Analysis Route ---

// Apply the NEW stepUpMiddleware to the analyze endpoint
ocr.post('/analyze', stepUpMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const userId = c.get('userId'); // This now comes from the stepUpMiddleware
    
    console.log(`User ${userId} performing OCR analysis after step-up.`);
    
    // Forward request to OCR Lambda
    const result = await fetchJSON(`${c.env.OCR_SRV_URL}/analysis`, { // Corrected endpoint
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    if (!result.ok) {
      return c.json(result.data, result.status);
    }
    
    return c.json(result.data);
  } catch (error) {
    console.error('OCR analyze error:', error);
    return c.json({ error: 'OCR analysis failed' }, 500);
  }
});


// --- Health Check Route ---

ocr.get('/health', async (c) => {
  try {
    const result = await fetchJSON(`${c.env.OCR_SRV_URL}/health`);
    
    return c.json({
      warp: 'ok',
      ocr: result.ok ? 'ok' : 'error',
      ocrStatus: result.status,
      ocrData: result.data
    });
  } catch (error) {
    return c.json({
      warp: 'ok',
      ocr: 'error',
      error: 'Cannot reach OCR service',
    });
  }
});

export default ocr;
