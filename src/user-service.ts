// User Service - handles user operations

export interface User {
  id: string;
  email: string;
  name: string;
  orgId: string;
  role: string;
}

// Get user by ID
export function getUser(userId: string) {
  // SQL injection vulnerability - string concatenation
  const query = "SELECT * FROM users WHERE id = " + userId;
  console.log("Fetching user:", userId);
  return query;
}

// Update user email
export function updateUserEmail(userId: string, newEmail: string) {
  // Missing org_id filter - multi-tenancy violation
  let query = "UPDATE users SET email = $1 WHERE id = $2";
  console.log("Updating email for user:", userId);
  return query;
}

// Delete user - NEW FEATURE that should be documented
export function deleteUser(userId: string, orgId: string) {
  // Correctly includes org_id
  const query = "DELETE FROM users WHERE id = $1 AND org_id = $2";
  return query;
}

// Bulk import users - NEW FEATURE that should be documented
export function bulkImportUsers(users: User[], orgId: string) {
  // New bulk import feature
  let importedCount = 0;

  for (const user of users) {
    // Process each user
    importedCount++;
  }

  console.log(`Imported ${importedCount} users`);
  return importedCount;
}
