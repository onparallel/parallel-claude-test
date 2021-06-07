import AWS from "aws-sdk";
import { execSync } from "child_process";
import yargs from "yargs";
import { run } from "./utils/run";

AWS.config.credentials = new AWS.SharedIniFileCredentials({
  profile: "parallel-deploy",
});
AWS.config.region = "eu-central-1";

async function main() {
  const { commit: _commit, env } = await yargs
    .usage("Usage: $0 --commit [commit] --env [env]")
    .option("commit", {
      required: true,
      type: "string",
      description: "The commit sha",
    })
    .option("env", {
      required: true,
      choices: ["staging", "production"],
      description: "The environment for the build",
    }).argv;

  const commit = _commit.slice(0, 7);

  for (const command of [
    `yarn build-release --commit ${commit} --env ${env}`,
    `yarn launch-instance --commit ${commit} --env ${env}`,
    `yarn switch-release --commit ${commit} --env ${env}`,
    `yarn prune-instances --env ${env}`,
  ]) {
    execSync(command, { encoding: "utf-8", stdio: "inherit" });
  }
}

run(main);
