// This is a test file to verify Claude Code Review is working

export function calculateTotal(items: { price: number }[]) {
  let total = 0;

  for (const item of items) {
    total += item.price;
  }

  console.log("Total calculated:", total); // Console.log in production code

  let unusedVariable = "this is never used"; // Unused variable

  return total;
}

export function getUserData(userId: string) {
  // Potential SQL injection
  let query = "SELECT * FROM users WHERE id = " + userId;

  console.log(query);

  return query;
}

// NEW FEATURE: Two-factor authentication for users
export function enableTwoFactorAuth(userId: string) {
  // This new feature adds 2FA support to the user authentication system
  // Users can now enable TOTP-based two-factor authentication
  const query = "UPDATE users SET two_factor_enabled = true WHERE id = $1";
  return { userId, twoFactorEnabled: true };
}

// NEW FEATURE: API key management for users
export function generateApiKey(userId: string, keyName: string) {
  // Users can now generate API keys for programmatic access
  // API keys are stored in the new user_api_key table
  const apiKey = `pk_${userId}_${Date.now()}`;
  return { userId, keyName, apiKey };
}

// NEW USER ROLE: Supervisor
// Added new role between Admin and User with limited admin capabilities
export const USER_ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor', // NEW: Can manage users but not system settings
  USER: 'user',
  GUEST: 'guest'
};
