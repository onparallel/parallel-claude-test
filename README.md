# Parallel

## Client

The client uses the following libraries:

- [Next.js](https://github.com/zeit/next.js/) as the main framework
- [Chakra UI](https://chakra-ui.com/) as the main UI library
- [Apollo Client](https://www.apollographql.com/docs/react/) for fetching data from the GraphQl API
- [react-intl](https://github.com/formatjs/react-intl) for translating the app.

### Commands

- `yarn dev`: Runs the client locally with live-reload.
- `yarn build`: Creates a production build of the next app.
- `yarn start`: Serves the production build locally.
- `yarn generate-graphql-types`: Generates the interfaces for all the queries, mutations and fragments used in the client (`graphql/__types.ts`).
- `yarn extract-i18n-terms`: Extracts the translation terms into `lang/[locale].json`.

## Server

The backend uses the following libraries:

- [GraphQL Nexus](https://nexus.js.org/) for creating the GraphQL schema with full TypeScript support.
- [InversifyJS](http://inversify.io/) for doing Dependency Injection.
- [Knex.js](https://knexjs.org/) for building and running SQL queries.
- [Dataloader](https://github.com/graphql/dataloader) for avoiding the N + 1 query problem with GraphQL.

### Commands

- `yarn dev`: Runs a local server with livereload.
- `yarn build`: Compiles the source into `dist`.
- `yarn migrate`: Runs the migrations.
- `yarn migrate-dryrun`: Shows which migrations will run.
- `yarn migrate-make`: Creates a new migration file on `migrations`.
- `yarn migrate-down`: Rolls back the latest migration.
- `yarn seed`: Runs the seed file to populate a dev database.
- `yarn generate-db-types`: Generates the TypeScript interfaces from the database schema (`src/db/__types.ts`).
- `yarn test`: Creates a testing stack and runs the tests.
- `yarn extract-i18n-terms`: Extracts the translation terms into `lang/[locale].json`.

### Testing

Testing uses the [jest](https://jestjs.io/) testing framework. In order to run the tests execute:

```
yarn test
```

This command will create the testing stack using `docker-compose` (look inside `./test/setup.ts` and `./test/teardown.ts`).

# Naming conventions

## Repository methods

Try to use the following convention for method names as much as possible

_prefixEntity_\[By*Property*]

where **_prefix_** is one of:

- load: reads from the database and exposes a DataLoader
- get: reads from the database
- update: updates existing rows
- create: creates new rows
- delete: deletes or marks as delete
- clone: clones existing rows

**_Entity_** is the name of the main entity involved

Optionally add **By*Property*** if you are accessing data by properties other than _id_
