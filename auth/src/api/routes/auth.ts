import { Hono } from 'hono';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateToken, verifyToken, generateSteppedUpToken } from '../middleware/jwt';
import {
  createUser,
  getUserByEmail,
  getUserById,
  getUserByVerificationToken,
  getUserByResetToken,
  updateUserVerification,
  setVerificationToken,
  setResetToken,
  updatePassword,
  createOtp,
  getOtpByUserId,
  deleteOtp,
} from '../db/d1';
import { sendEmail, generateVerificationEmail, generatePasswordResetEmail, generateOtpEmail } from '../utils/email';
import { generateVerificationToken, addHours, isTokenExpired, generateNumericOtp } from '../utils/token';

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  EMAIL_API_KEY: string;
  EMAIL_FROM: string;
  AUTH_GUI_URL: string;
  AUTH_API_URL: string;
};

const auth = new Hono<{ Bindings: Bindings }>();

// Register
auth.post('/register', async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }
    
    if (password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }
    
    const existingUser = await getUserByEmail(c.env.DB, email);
    if (existingUser) {
      return c.json({ error: 'Email already registered' }, 400);
    }
    
    const passwordHash = await hashPassword(password);
    const user = await createUser(c.env.DB, email, passwordHash, name);
    if (!user) {
      return c.json({ error: 'Failed to create user' }, 500);
    }
    
    const verificationToken = generateVerificationToken();
    const expiresAt = Math.floor(addHours(new Date(), 24).getTime() / 1000);
    await setVerificationToken(c.env.DB, user.id, verificationToken, expiresAt);
    
    try {
      const verificationUrl = `${c.env.AUTH_API_URL}/auth/verify-email?token=${verificationToken}`;
      const emailHtml = generateVerificationEmail(name, verificationUrl);
      await sendEmail(email, 'Verify Your Email', emailHtml, c.env.EMAIL_FROM, c.env.EMAIL_API_KEY);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }
    
    const token = await generateToken(user.id, c.env.JWT_SECRET);
    
    return c.json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        is_verified: user.is_verified
      }
    }, 201);
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

// Login
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }
    
    const user = await getUserByEmail(c.env.DB, email);
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    const token = await generateToken(user.id, c.env.JWT_SECRET);
    
    return c.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        is_verified: user.is_verified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// Get current user
auth.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const token = authHeader.substring(7);
    const payload = await verifyToken(token, c.env.JWT_SECRET);
    
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
    return c.json({ error: 'Unauthorized' }, 401);
  }
});

// Verify Email
auth.get('/verify-email', async (c) => {
  try {
    const token = c.req.query('token');
    
    if (!token) {
      return c.redirect(`${c.env.AUTH_GUI_URL}?error=invalid_token&message=Link xác thực không hợp lệ`);
    }
    
    const user = await getUserByVerificationToken(c.env.DB, token);
    
    if (!user) {
      return c.redirect(`${c.env.AUTH_GUI_URL}?error=invalid_token&message=Link xác thực không hợp lệ`);
    }
    
    if (isTokenExpired(user.verification_token_expires)) {
      return c.redirect(`${c.env.AUTH_GUI_URL}?error=expired_token&message=Link xác thực đã hết hạn`);
    }
    
    await updateUserVerification(c.env.DB, user.id, true);
    
    return c.redirect(`${c.env.AUTH_GUI_URL}?verified=true&message=Xác thực thành công!`);
  } catch (error) {
    console.error('Verify email error:', error);
    return c.redirect(`${c.env.AUTH_GUI_URL}?error=server_error&message=Lỗi xác thực`);
  }
});

// Resend Verification
auth.post('/resend-verification', async (c) => {
  try {
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }
    
    const user = await getUserByEmail(c.env.DB, email);
    
    if (!user) {
      return c.json({ error: 'Email not found' }, 404);
    }
    
    if (user.is_verified) {
      return c.json({ error: 'Email already verified' }, 400);
    }
    
    const verificationToken = generateVerificationToken();
    const expiresAt = Math.floor(addHours(new Date(), 24).getTime() / 1000);
    
    await setVerificationToken(c.env.DB, user.id, verificationToken, expiresAt);
    
    const verificationUrl = `${c.env.AUTH_API_URL}/auth/verify-email?token=${verificationToken}`;
    const emailHtml = generateVerificationEmail(user.name || 'User', verificationUrl);
    
    await sendEmail(email, 'Verify Your Email', emailHtml, c.env.EMAIL_FROM, c.env.EMAIL_API_KEY);
    
    return c.json({
      success: true,
      message: 'Verification email has been resent'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return c.json({ error: 'Failed to resend verification email' }, 500);
  }
});

// Forgot Password
auth.post('/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }
    
    const user = await getUserByEmail(c.env.DB, email);
    
    if (!user) {
      return c.json({
        success: true,
        message: 'If the email exists, a password reset link will be sent'
      });
    }
    
    const resetToken = generateVerificationToken();
    const expiresAt = Math.floor(addHours(new Date(), 1).getTime() / 1000);
    
    await setResetToken(c.env.DB, user.id, resetToken, expiresAt);
    
    const resetUrl = `${c.env.AUTH_GUI_URL}/reset-password?token=${resetToken}`;
    const emailHtml = generatePasswordResetEmail(user.name || 'User', resetUrl);
    
    await sendEmail(email, 'Reset Your Password', emailHtml, c.env.EMAIL_FROM, c.env.EMAIL_API_KEY);
    
    return c.json({
      success: true,
      message: 'If the email exists, a password reset link will be sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return c.json({ error: 'Failed to process password reset request' }, 500);
  }
});

// Reset Password
auth.post('/reset-password', async (c) => {
  try {
    const { token, new_password } = await c.req.json();
    
    if (!token || !new_password) {
      return c.json({ error: 'Token and new password are required' }, 400);
    }
    
    if (new_password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }
    
    const user = await getUserByResetToken(c.env.DB, token);
    
    if (!user) {
      return c.json({ error: 'Invalid or expired reset link' }, 400);
    }
    
    if (isTokenExpired(user.reset_token_expires)) {
      return c.json({ error: 'Reset link has expired' }, 400);
    }
    
    const passwordHash = await hashPassword(new_password);
    await updatePassword(c.env.DB, user.id, passwordHash);
    
    return c.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return c.json({ error: 'Failed to reset password' }, 500);
  }
});

// Validate Token (for API access)
auth.get('/validate', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const token = authHeader.substring(7);
    const payload = await verifyToken(token, c.env.JWT_SECRET);
    
    const user = await getUserById(c.env.DB, payload.userId);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json({
      valid: true,
      userId: user.id,
      email: user.email
    });
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

// --- Step-Up Authentication ---

const stepUp = new Hono<{ Bindings: Bindings }>();

stepUp.post('/initiate', async (c) => {
    try {
        const { userId } = await c.req.json();
        if (!userId) {
            return c.json({ error: 'User ID is required' }, 400);
        }

        const user = await getUserById(c.env.DB, userId);
        if (!user) {
            return c.json({ error: 'User not found' }, 404);
        }

        // Generate OTP
        const otp = generateNumericOtp(6);
        const expiresAt = Math.floor(addHours(new Date(), 1/6).getTime() / 1000); // Expires in 10 minutes

        // Store OTP in the database
        await createOtp(c.env.DB, userId, otp, expiresAt);

        // Send OTP via email
        const emailHtml = generateOtpEmail(otp);
        await sendEmail(user.email, 'Your Verification Code', emailHtml, c.env.EMAIL_FROM, c.env.EMAIL_API_KEY);

        return c.json({ success: true, message: 'OTP has been sent to your email.' });
    } catch (error) {
        console.error('Step-up initiate error:', error);
        return c.json({ error: 'Failed to initiate step-up authentication' }, 500);
    }
});

stepUp.post('/verify', async (c) => {
    try {
        const { userId, otp } = await c.req.json();
        if (!userId || !otp) {
            return c.json({ error: 'User ID and OTP are required' }, 400);
        }

        const storedOtp = await getOtpByUserId(c.env.DB, userId);
        if (!storedOtp || storedOtp.otp !== otp) {
            return c.json({ error: 'Invalid OTP' }, 400);
        }

        if (isTokenExpired(storedOtp.expires_at)) {
            return c.json({ error: 'OTP has expired' }, 400);
        }

        // OTP is valid, generate a new JWT with stepped_up claim
        const steppedUpToken = await generateSteppedUpToken(userId, c.env.JWT_SECRET);

        // Clean up OTP from database
        await deleteOtp(c.env.DB, userId);

        return c.json({ success: true, token: steppedUpToken });

    } catch (error) {
        console.error('Step-up verify error:', error);
        return c.json({ error: 'Failed to verify step-up authentication' }, 500);
    }
});

auth.route('/step-up', stepUp);


// Logout
auth.post('/logout', async (c) => {
  return c.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default auth;
