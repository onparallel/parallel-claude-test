import { spawn } from "child_process";

export default async function () {
  // Setting up the stack
  const dc = spawn("docker-compose", [
    "--file",
    "../ops/test/docker-compose.yml",
    "down",
  ]);

  await new Promise((r) => dc.on("exit", r));
}
