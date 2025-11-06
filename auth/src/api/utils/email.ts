/**
 * Send email using Cloudflare Email Workers (MailChannels)
 */
export async function sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
    from: string,
    apiKey?: string
  ): Promise<boolean> {
    try {
      // Using MailChannels API (free tier available)
      const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: to }],
            },
          ],
          from: {
            email: from,
            name: 'Valumind',
          },
          subject: subject,
          content: [
            {
              type: 'text/html',
              value: htmlContent,
            },
          ],
        }),
      });
  
      if (!response.ok) {
        console.error('Email send failed:', await response.text());
        return false;
      }
  
      return true;
    } catch (error) {
      console.error('Email error:', error);
      return false;
    }
  }
  
  export function generateVerificationEmail(name: string, verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #4CAF50; 
            color: white; 
            text-decoration: none; 
            border-radius: 4px; 
            margin: 20px 0;
          }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Welcome to Valumind, ${name}!</h2>
          <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" class="button">Verify Email</a>
          <p>Or copy this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <div class="footer">
            <p>If you didn't create this account, please ignore this email.</p>
            <p>&copy; 2025 Valumind. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  export function generatePasswordResetEmail(name: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #2196F3; 
            color: white; 
            text-decoration: none; 
            border-radius: 4px; 
            margin: 20px 0;
          }
          .warning { background-color: #fff3cd; padding: 10px; border-radius: 4px; margin: 20px 0; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Reset Request</h2>
          <p>Hi ${name},</p>
          <p>You requested to reset your password. Click the button below to create a new password:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>Or copy this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <div class="warning">
            <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour.
          </div>
          <div class="footer">
            <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
            <p>&copy; 2025 Valumind. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  export function generateOtpEmail(otp: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          .header { font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 20px; color: #444; }
          .otp-code { 
            font-size: 36px; 
            font-weight: bold; 
            text-align: center; 
            letter-spacing: 4px;
            color: #007BFF; 
            background-color: #f2f2f2;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .warning { font-size: 14px; text-align: center; color: #888; margin-top: 15px; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">Your Verification Code</div>
          <p>Please use the following code to complete your action. This code is valid for 10 minutes.</p>
          <div class="otp-code">${otp}</div>
          <div class="warning">
            For your security, do not share this code with anyone.
          </div>
          <div class="footer">
            <p>If you did not request this, please ignore this email.</p>
            <p>&copy; 2025 Valumind. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
