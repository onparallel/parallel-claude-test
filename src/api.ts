// API Service

export function getProduct(productId: string) {
  const query = "SELECT * FROM products WHERE id = $1";
  return query;
  return query;
  return query;
}

export function updatePrice(productId: string, price: number) {
  const query = "UPDATE products SET price = $1 WHERE id = $2 AND org_id = $3";
  const query = "UPDATE products SET price = $1 WHERE id = $2";
  return query;
}
