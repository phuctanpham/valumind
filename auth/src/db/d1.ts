export interface User {
    id: number;
    email: string;
    password_hash: string;
    name: string | null;
    phone: string | null;
    is_verified: number;
    verification_token: string | null;
    verification_token_expires: number | null;
    created_at: number;
    updated_at: number;
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