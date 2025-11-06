// Complete D1 database operations for auth service
export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string | null;
  phone: string | null;
  is_verified: number;
  verification_token: string | null;
  verification_token_expires: number | null;
  reset_token: string | null;
  reset_token_expires: number | null;
  created_at: number;
  updated_at: number;
}

export interface Otp {
    id: number;
    user_id: number;
    otp: string;
    expires_at: number;
    created_at: number;
}

export async function createUser(
  db: D1Database,
  email: string,
  passwordHash: string,
  name: string
): Promise<User | null> {
  try {
    const result = await db.prepare(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?) RETURNING *'
    ).bind(email, passwordHash, name).first<User>();
    
    return result;
  } catch (error) {
    console.error('Create user error:', error);
    return null;
  }
}

export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
  const user = await db.prepare('SELECT * FROM users WHERE email = ?')
    .bind(email)
    .first<User>();
  return user;
}

export async function getUserById(db: D1Database, id: number): Promise<User | null> {
  const user = await db.prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first<User>();
  return user;
}

export async function getUserByVerificationToken(db: D1Database, token: string): Promise<User | null> {
  const user = await db.prepare('SELECT * FROM users WHERE verification_token = ?')
    .bind(token)
    .first<User>();
  return user;
}

export async function getUserByResetToken(db: D1Database, token: string): Promise<User | null> {
  const user = await db.prepare('SELECT * FROM users WHERE reset_token = ?')
    .bind(token)
    .first<User>();
  return user;
}

export async function updateUserVerification(
  db: D1Database,
  userId: number,
  isVerified: boolean
): Promise<boolean> {
  try {
    const result = await db.prepare(
      'UPDATE users SET is_verified = ?, verification_token = NULL, verification_token_expires = NULL WHERE id = ?'
    )
      .bind(isVerified ? 1 : 0, userId)
      .run();
    
    return result.success || false;
  } catch (error) {
    console.error('Update verification error:', error);
    return false;
  }
}

export async function setVerificationToken(
  db: D1Database,
  userId: number,
  token: string,
  expiresAt: number
): Promise<boolean> {
  try {
    const result = await db.prepare(
      'UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE id = ?'
    )
      .bind(token, expiresAt, userId)
      .run();
    
    return result.success || false;
  } catch (error) {
    console.error('Set verification token error:', error);
    return false;
  }
}

export async function setResetToken(
  db: D1Database,
  userId: number,
  token: string,
  expiresAt: number
): Promise<boolean> {
  try {
    const result = await db.prepare(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?'
    )
      .bind(token, expiresAt, userId)
      .run();
    
    return result.success || false;
  } catch (error) {
    console.error('Set reset token error:', error);
    return false;
  }
}

export async function updatePassword(
  db: D1Database,
  userId: number,
  passwordHash: string
): Promise<boolean> {
  try {
    const result = await db.prepare(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?'
    )
      .bind(passwordHash, userId)
      .run();
    
    return result.success || false;
  } catch (error) {
    console.error('Update password error:', error);
    return false;
  }
}

export async function createOtp(
    db: D1Database,
    userId: number,
    otp: string,
    expiresAt: number
): Promise<Otp | null> {
    try {
        // Clean up any existing OTPs for this user
        await deleteOtp(db, userId);

        const result = await db.prepare(
            'INSERT INTO otps (user_id, otp, expires_at) VALUES (?, ?, ?) RETURNING *'
        ).bind(userId, otp, expiresAt).first<Otp>();

        return result;
    } catch (error) {
        console.error('Create OTP error:', error);
        return null;
    }
}

export async function getOtpByUserId(db: D1Database, userId: number): Promise<Otp | null> {
    const otp = await db.prepare('SELECT * FROM otps WHERE user_id = ?')
        .bind(userId)
        .first<Otp>();
    return otp;
}

export async function deleteOtp(db: D1Database, userId: number): Promise<boolean> {
    try {
        const result = await db.prepare('DELETE FROM otps WHERE user_id = ?').bind(userId).run();
        return result.success || false;
    } catch (error) {
        console.error('Delete OTP error:', error);
        return false;
    }
}
