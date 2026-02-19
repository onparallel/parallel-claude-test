import { execSync } from "child_process";
import "reflect-metadata";
import { GenericContainer, Wait } from "testcontainers";

const SETUP_DOCKER_ENVIRONMENT = "docker environment ok";
const SETUP_MIGRATIONS_TIME = "migrations ok";
const SETUP_SEEDS_TIME = "seeds ok";
const SETUP_TOTAL_TIME = "Setup done!";

export default async function () {
  console.time(SETUP_TOTAL_TIME);

  console.log("starting environment...");
  console.time(SETUP_DOCKER_ENVIRONMENT);
  const [postgres, redis] = await Promise.all([
    new GenericContainer("postgres:16.8")
      .withExposedPorts(5432)
      .withWaitStrategy(Wait.forLogMessage("database system is ready to accept connections", 2))
      .withEnvironment({
        POSTGRES_USER: "test",
        POSTGRES_PASSWORD: "test",
        POSTGRES_DB: "parallel_test",
      })
      .start(),
    new GenericContainer("redis:7.2")
      .withExposedPorts(6379)
      .withWaitStrategy(Wait.forLogMessage("Ready to accept connections"))
      .start(),
  ]);
  process.env.DB_PORT = process.env.READONLY_DB_PORT = `${postgres.getMappedPort(5432)}`;
  process.env.REDIS_PORT = `${redis.getMappedPort(6379)}`;

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

  return async function () {
    await Promise.all([
      postgres.stop().catch((err) => console.error("Failed to stop postgres:", err)),
      redis.stop().catch((err) => console.error("Failed to stop redis:", err)),
    ]);
  };
}
