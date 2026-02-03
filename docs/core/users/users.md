# Users

Documentation of user-related functionality.

---

## 1. Main table: `user`

The `user` table stores all system users. Users are associated with organizations and have roles that determine their permissions.

### Related tables

| Table | Description |
|-------|-------------|
| `user` | Main user data (email, name, role) |
| `user_session` | Active user sessions |

---

## 2. User Authentication

Users authenticate via email and password. The system supports:
- Email/password login
- Password reset via email
- Session management

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /auth/login` | User login |
| `POST /auth/logout` | User logout |
| `POST /auth/reset-password` | Request password reset |

---

## 3. User Roles

Users have roles that determine their permissions:
- **Admin**: Full access to all features
- **User**: Standard access
- **Guest**: Read-only access

---

## 4. User Management

### Delete User

Allows deletion of users from the system. Deletion is scoped to the organization to maintain multi-tenancy isolation.

**Purpose**: Remove user accounts while ensuring data remains isolated by organization.

### Bulk Import Users

Enables importing multiple users at once into an organization.

**Purpose**: Streamline onboarding when adding multiple users simultaneously (e.g., during team migration or initial setup).

| Feature | Description |
|---------|-------------|
| Delete User | Remove a user account from an organization |
| Bulk Import | Import multiple users into an organization at once |
