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
