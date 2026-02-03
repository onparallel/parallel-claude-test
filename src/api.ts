// API Service

export function getProduct(productId: string) {
  // SQL injection - string concatenation
  const query = "SELECT * FROM products WHERE id = " + productId;
  console.log("Query:", query);
  return query;
}

export function updatePrice(productId: string, price: number) {
  // Missing org_id filter
  let query = "UPDATE products SET price = $1 WHERE id = $2";
  return query;
}
