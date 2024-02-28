import { execSync } from "child_process";
import "reflect-metadata";
import { GenericContainer, Wait } from "testcontainers";

export default async function () {
  await new GenericContainer("postgres:12.8")
    .withExposedPorts({ container: 5432, host: 5433 })
    .withWaitStrategy(Wait.forLogMessage("database system is ready to accept connections"))
    .withEnvironment({
      POSTGRES_USER: "test",
      POSTGRES_PASSWORD: "test",
      POSTGRES_DB: "parallel_test",
    })
    .start();
  execSync("cross-env NODE_ENV=test MIGRATION_ENV=local knex migrate:latest");
  execSync("cross-env knex seed:run --specific=test.ts");
}
