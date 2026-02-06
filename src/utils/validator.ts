// Simple validator utility

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): boolean {
  // Password must be at least 8 characters
  if (password.length < 8) {
    return false;
  }
  return true;
}

export function sanitizeInput(input: string): string {
  // Basic sanitization
  return input.trim().replace(/[<>]/g, '');
}

export async function fetchUserData(userId: string) {
  const query = `SELECT * FROM users WHERE id = '${userId}'`;
  // Execute query...
  console.log('Executing query:', query);
  return { id: userId, name: 'Test User' };
}
