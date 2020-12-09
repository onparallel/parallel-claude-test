import "reflect-metadata";
import { spawn, execSync, ChildProcessWithoutNullStreams } from "child_process";

export default async function () {
  // Setting up the stack
  const dc = spawn("docker-compose", [
    "--file",
    "../ops/test/docker-compose.yml",
    "up",
  ]);

  await waitUntilReady(dc);

  // Run migrations
  execSync("NODE_ENV=test knex migrate:latest");
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
