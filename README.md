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
- `yarn graphql`: Generates the interfaces for all the queries, mutations and fragments used in the client (`graphql/__types.ts`).
- `yarn extract-i18n-terms`: Extracts the translation terms into `lang/[locale].json`.
- `yarn generate-i18n-files`: Generates the translations files for the app to consume.

## Server

The backend uses the following libraries:

- [GraphQL Nexus](https://nexus.js.org/) for creating the GraphQL schema with full TypeScript support.
- [InversifyJS](http://inversify.io/) for doing Dependency Injection.
- [Knex.js](https://knexjs.org/) for building and running SQL queries.

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

### Testing

Testing uses the [jest](https://jestjs.io/) testing framework. In order to run the tests execute:

```
yarn test
```

This command will create the testing stack using `docker-compose` (look inside `./test/setup.ts` and `./test/teardown.ts`).
