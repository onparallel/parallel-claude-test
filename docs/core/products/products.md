# Products

Documentation of product-related functionality.

---

## 1. Main table: `products`

The `products` table stores product information for the platform. Products are associated with organizations and include pricing information.

### Related tables

| Table | Description |
|-------|-------------|
| `products` | Main product data (name, price) |

---

## 2. Product API

The product API provides endpoints for retrieving and managing product information.

### API Functions

| Function | Description |
|----------|-------------|
| `getProduct(productId)` | Retrieve product details by ID |
| `updatePrice(productId, price)` | Update product pricing |

---

## 3. Multi-Tenancy

Products are organization-specific and should always be filtered by `org_id` to ensure proper tenant isolation.
