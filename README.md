# Parallel

Petition and profile management SaaS platform for legal/compliance workflows.

## Quick Start

- [Getting Started](./getting-started.md) - Setup your local development environment

For comprehensive documentation including architecture, patterns, and implementation details, see [CLAUDE.md](./CLAUDE.md).

## Documentation

### Core Entities

| File                                           | Main Table     | Description                  |
| ---------------------------------------------- | -------------- | ---------------------------- |
| [petitions.md](./docs/core/petitions.md)       | `petition`     | Cases, files, or requests    |
| [profiles.md](./docs/core/profiles.md)         | `profile`      | Flexible entity management   |
| [organization.md](./docs/core/organization.md) | `organization` | Organization settings        |
| [users.md](./docs/core/users.md)               | `user`         | System users and permissions |
| [workers.md](./docs/core/workers.md)           | -              | Background worker processes  |

### Operations

| File                                      | Description                      |
| ----------------------------------------- | -------------------------------- |
| [image.md](./docs/image.md)               | Server image and release process |
| [certificates.md](./docs/certificates.md) | SSL certificate management       |
| [fail2ban.md](./docs/fail2ban.md)         | IP banning configuration         |

## Technology Stack

### Client

- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Next.js](https://github.com/zeit/next.js/) - Main framework
- [Chakra UI](https://chakra-ui.com/) - UI library
- [Apollo Client](https://www.apollographql.com/docs/react/) - GraphQL client
- [react-intl](https://github.com/formatjs/react-intl) - Internationalization
- [react-hook-form](https://react-hook-form.com/) - Form handling
- [Slate](https://docs.slatejs.org/) / [Plate](https://platejs.org/) - Rich text editing
- [Sentry](https://sentry.io/) - Error tracking

### Server

- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Express.js](https://expressjs.com/) - HTTP server
- [GraphQL Nexus](https://nexus.js.org/) - GraphQL schema with TypeScript
- [InversifyJS](http://inversify.io/) - Dependency Injection
- [Knex.js](https://knexjs.org/) - SQL query builder
- [PostgreSQL](https://www.postgresql.org/) - Primary database
- [Dataloader](https://github.com/graphql/dataloader) - N+1 query prevention
- [Redis](https://redis.io/) - Caching and sessions
- [AWS SQS](https://aws.amazon.com/sqs/) - Message queuing
- [Typst](https://typst.app/) - PDF generation

## Commands

### Client

```bash
cd client/
yarn dev                    # Run with live-reload
yarn build                  # Production build
yarn generate-graphql-types # Generate GraphQL types
yarn extract-i18n-terms     # Extract translation terms
```

### Server

```bash
cd server/
yarn dev                # Run API with live-reload
yarn dev-workers        # Run all workers (in separate terminal)
yarn build              # Compile to dist
yarn migrate            # Run migrations
yarn migrate-make       # Create new migration
yarn migrate-down       # Rollback migration
yarn seed               # Seed dev database
yarn generate-db-types  # Generate DB types
yarn test               # Run tests
yarn extract-i18n-terms # Extract translation terms
```
