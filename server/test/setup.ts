import "reflect-metadata";
import { spawn, execSync, ChildProcessWithoutNullStreams } from "child_process";

export default async function () {
  // Setting up the stack
  const dc = spawn("docker-compose", ["--file", "../ops/test/docker-compose.yml", "up"]);

  await waitUntilReady(dc);

  execSync("cross-env NODE_ENV=test MIGRATION_ENV=local knex migrate:latest");
  execSync("cross-env knex seed:run --specific=test.ts");
}

function waitUntilReady(process: ChildProcessWithoutNullStreams) {
  return new Promise<void>((resolve) => {
    process.stdout.on("data", (data: Buffer) => {
      const text = data.toString();
      if (text.includes("database system is ready to accept connections")) {
        resolve();
      }
    });
  });
}
