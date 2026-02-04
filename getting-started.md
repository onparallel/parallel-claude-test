# Getting Started for Developers

Complete guide to set up a local development environment for Parallel.

---

## Prerequisites

### Required Software

You must have the following installed:

- **Git** - Version control
- **Node.js** - JavaScript runtime (v22.14.0 - see `.nvmrc`)
- **Yarn** - Package manager
- **Docker Desktop** - Container runtime
- **Visual Studio Code** - IDE (recommended)

### Additional Dependencies (macOS)

Install these tools via Homebrew:

```bash
brew install ghostscript imagemagick exiftool qpdf
```

#### Installing Typst 0.11.1

[Typst](https://typst.app/) is required for PDF generation. We use version **0.11.1** for compatibility.

```bash
curl -L -o typst.tar.xz https://github.com/typst/typst/releases/download/v0.11.1/typst-aarch64-apple-darwin.tar.xz
tar -xf typst.tar.xz
sudo mv typst-aarch64-apple-darwin/typst /usr/local/bin/
rm -rf typst.tar.xz typst-aarch64-apple-darwin
typst --version
# Should output: typst 0.11.1
```

---

## Repository Setup

### 1. Clone the Repository

```bash
git clone https://github.com/onparallel/parallel.git
cd parallel
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Configure AWS Credentials

Create/edit the file `server/.development.env` and add your AWS credentials:

```env
AWS_ACCESS_KEY_ID=your_key_id
AWS_SECRET_ACCESS_KEY=your_secret_key
```

> Contact the team lead to obtain AWS credentials.

---

## Starting the Development Environment

### Terminal Commands (in order)

You need multiple terminal windows/tabs running simultaneously:

| Order | Directory | Command                 | Description                                                                     |
| ----- | --------- | ----------------------- | ------------------------------------------------------------------------------- |
| 1     | `ops/dev` | `docker compose up`     | Start PostgreSQL, Redis, Nginx, SQS                                             |
| 2     | `server`  | `yarn migrate`          | Run database migrations (the first time and when there is a new migration)      |
| 3     | `server`  | `yarn seed dev`         | Seed development data (Only the first time)                                     |
| 4     | `server`  | `yarn dev`              | Start API server                                                                |
| 5     | `client`  | `yarn dev`              | Start frontend                                                                  |
| 6     | `server`  | `yarn worker:XXX start` | Start any worker you need (see [workers documentation](./docs/core/workers.md)) |

## Active Endpoints After Setup

Access the application at **http://localhost** (all services routed via Nginx)

### Default Login Credentials

- **Email:** `santialbo@gmail.com`
- **Password:** `lellarap`

---

## Ngrok Setup (Webhooks & Integrations)

In the development environment, we use [Ngrok](https://ngrok.com/) to create a local tunnel for:

- Receiving webhook events from integrations (Signaturit, DocuSign, Bankflip, etc.)
- Receiving custom emails from AWS Cognito (SignUp, ResendCode, AdminCreateUser, ForgotPassword)

### Install Ngrok

```bash
brew install ngrok
```

### Configure Ngrok

1. **Sign up** for an account: https://dashboard.ngrok.com/signup
2. **Get your authtoken**: https://dashboard.ngrok.com/get-started/your-authtoken
3. **Install the authtoken:**
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

### Start the Local Tunnel

```bash
yarn workspace @parallel/server localtunnel
```

This command:

1. Starts ngrok and creates a public HTTPS URL
2. Writes the URL to `server/bin/localtunnel-dev.url`
3. Integrations read this file to know where to send webhooks

### AWS Lambda Configuration

After launching ngrok, you need to configure the HTTPS tunnel URL on the AWS Lambda function `cognito-custom-messages-development` as an environment variable.

---

## Docker Services

The `ops/dev/docker-compose.yml` starts these services:

| Service    | Port    | Description        |
| ---------- | ------- | ------------------ |
| PostgreSQL | 5432    | Database           |
| Redis      | 6379    | Cache and queues   |
| Nginx      | 80, 443 | Reverse proxy      |
| ElasticMQ  | 9324    | Local SQS emulator |

### Useful Docker Commands

```bash
# Start services
cd ops/dev
docker compose up

# Start in background
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Reset database (delete volumes)
docker compose down -v
```

---

## Database

### Connection Details

| Property | Value        |
| -------- | ------------ |
| Host     | localhost    |
| Port     | 5432         |
| Database | parallel_dev |
| User     | parallel     |
| Password | lellarap     |

### Useful Commands

```bash
cd server

# Run migrations
yarn migrate

# Rollback last migration
yarn migrate:rollback

# Seed development data
yarn seed dev

# Generate types from database
yarn generate-db-types
```

---

## Project Structure

```
parallel/
├── client/           # Next.js frontend
│   ├── pages/        # Route pages
│   ├── components/   # React components
│   └── graphql/      # GraphQL queries/mutations
├── server/           # Node.js backend
│   ├── src/
│   │   ├── db/       # Database layer
│   │   ├── graphql/  # GraphQL resolvers
│   │   ├── services/ # Business logic
│   │   └── workers/  # Background workers
│   └── migrations/   # Database migrations
├── e2e/              # End-to-end tests
├── ops/              # DevOps configuration
│   └── dev/          # Development environment
└── docs/             # Documentation
```

---

## Useful Scripts

### Server

```bash
cd server

yarn dev              # Start development server
yarn test             # Run tests
yarn lint             # Run ESLint
yarn typecheck        # Run TypeScript check
yarn generate-db-types # Generate DB types
yarn dev-workers      # Start all workers
```

### Client

```bash
cd client

yarn dev              # Start development server
yarn build            # Build for production
yarn test             # Run tests
yarn lint             # Run ESLint
yarn typecheck        # Run TypeScript check
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :4000

# Kill process
kill -9 <PID>
```

### Database Connection Issues

1. Ensure Docker is running
2. Check if PostgreSQL container is up: `docker ps`
3. Try restarting: `docker compose restart db`

### Nginx 502 Bad Gateway

The backend server isn't running. Start it with:

```bash
cd server && yarn dev
```

### Clear Node Modules

```bash
rm -rf node_modules
rm -rf client/node_modules
rm -rf server/node_modules
yarn install
```

---

## IDE Setup (VS Code)

### Recommended Extensions

- ESLint
- Prettier
- GraphQL
- Docker
- GitLens
- TypeScript Hero

### Settings

The repository includes `.vscode/settings.json` with recommended settings.

---

## Next Steps

- Read the [petitions documentation](./docs/core/petitions.md)
- Explore the [profiles documentation](./docs/core/profiles.md)
- Learn about [workers](./docs/core/workers.md)
