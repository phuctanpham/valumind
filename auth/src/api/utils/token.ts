// Utility functions for generating verification and reset tokens

export function generateVerificationToken(): string {
    // Generate a random 32-character hex string
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

export function generateNumericOtp(length: number): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += (array[i] % 10).toString();
    }
    return otp;
}
  
  export function addHours(date: Date, hours: number): Date {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() + hours);
    return newDate;
  }
  
  export function isTokenExpired(expiresAt: number | null): boolean {
    if (!expiresAt) return true;
    return expiresAt < Math.floor(Date.now() / 1000);
  }