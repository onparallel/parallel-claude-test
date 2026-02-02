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
| `user_api_key` | API keys for programmatic access |

---

## 2. User Authentication

Users authenticate via email and password. The system supports:
- Email/password login
- Password reset via email
- Session management
- **Two-factor authentication (TOTP)** - Users can enable 2FA for enhanced security

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /auth/login` | User login |
| `POST /auth/logout` | User logout |
| `POST /auth/reset-password` | Request password reset |
| `POST /auth/enable-2fa` | Enable two-factor authentication |

---

---

## 3. API Key Management

Users can generate API keys for programmatic access to the platform. API keys enable:
- Machine-to-machine authentication
- Integration with external systems
- Automation of workflows

API keys are stored in the `user_api_key` table and can be named for easy identification.

---

## 4. User Roles

Users have roles that determine their permissions:
- **Admin**: Full access to all features and system settings
- **Supervisor**: Can manage users but cannot modify system settings
- **User**: Standard access
- **Guest**: Read-only access
