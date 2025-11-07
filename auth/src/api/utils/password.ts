// Improved password hashing with salt using Web Crypto API

export async function hashPassword(password: string): Promise<string> {
  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const saltHex = Array.from(salt)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  // Combine password and salt
  const encoder = new TextEncoder()
  const passwordData = encoder.encode(password + saltHex)
  
  // Hash with SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', passwordData)
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  // Return salt:hash format
  return `${saltHex}:${hashHex}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    // Split stored hash into salt and hash
    const [salt, hash] = storedHash.split(':')
    
    if (!salt || !hash) {
      // Handle legacy hashes without salt (for backward compatibility)
      const encoder = new TextEncoder()
      const data = encoder.encode(password)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const legacyHash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
      return legacyHash === storedHash
    }
    
    // Hash password with stored salt
    const encoder = new TextEncoder()
    const passwordData = encoder.encode(password + salt)
    const hashBuffer = await crypto.subtle.digest('SHA-256', passwordData)
    const computedHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    return computedHash === hash
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
}