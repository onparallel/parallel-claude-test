import { execSync } from "child_process";
import "reflect-metadata";
import { GenericContainer, Wait } from "testcontainers";

const SETUP_DOCKER_ENVIRONMENT = "docker environment ok";
const SETUP_MIGRATIONS_TIME = "migrations ok";
const SETUP_SEEDS_TIME = "seeds ok";
const SETUP_TOTAL_TIME = "Setup done!";
let SETUP_DONE = false;

export default async function () {
  // this is for the --watch flag to work properly. (this function is called every time a file changes)
  if (SETUP_DONE) {
    return;
  }

  console.time(SETUP_TOTAL_TIME);

  console.log("starting environment...");
  console.time(SETUP_DOCKER_ENVIRONMENT);
  const containers = await Promise.all([
    new GenericContainer("postgres:16.8")
      .withExposedPorts({ container: 5432, host: 5433 })
      .withWaitStrategy(Wait.forLogMessage("database system is ready to accept connections", 2))
      .withEnvironment({
        POSTGRES_USER: "test",
        POSTGRES_PASSWORD: "test",
        POSTGRES_DB: "parallel_test",
      })
      .start(),
    new GenericContainer("redis:7.2")
      .withExposedPorts({ container: 6379, host: 6378 })
      .withWaitStrategy(Wait.forLogMessage("Ready to accept connections"))
      .start(),
  ]);

  console.timeEnd(SETUP_DOCKER_ENVIRONMENT);

  console.log("running migrations...");
  console.time(SETUP_MIGRATIONS_TIME);
  execSync("cross-env NODE_ENV=test MIGRATION_ENV=local knex migrate:latest");
  console.timeEnd(SETUP_MIGRATIONS_TIME);

  console.log("running seeds...");
  console.time(SETUP_SEEDS_TIME);
  execSync("cross-env knex seed:run --specific=test.ts");
  console.timeEnd(SETUP_SEEDS_TIME);

  console.timeEnd(SETUP_TOTAL_TIME);
  SETUP_DONE = true;
  (globalThis as any).shutdownContainers = async function () {
    await Promise.all(containers.map((c) => c.stop()));
  };
}
