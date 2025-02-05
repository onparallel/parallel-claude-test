import { execSync } from "child_process";
import yargs from "yargs";
import { run } from "./utils/run";

async function main() {
  const {
    commit: _commit,
    env,
    forceBuild,
    skipPrune,
  } = await yargs
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
    })
    .option("force-build", {
      default: false,
      type: "boolean",
      description: "Forces rebuild if build aready exists",
    })
    .option("skip-prune", {
      default: false,
      type: "boolean",
      description: "Wether to skip the prune step",
    }).argv;

  const commit = _commit.slice(0, 7);

  for (const command of [
    `yarn build-release --commit ${commit} --env ${env} --force ${forceBuild}`,
    `yarn launch-instance --commit ${commit} --env ${env}`,
    `yarn switch-release --commit ${commit} --env ${env}`,
    ...(skipPrune ? [] : [`yarn prune-instances --env ${env}`]),
    `yarn queue-redrive --env ${env}`,
  ]) {
    execSync(command, { encoding: "utf-8", stdio: "inherit" });
  }
}

run(main);
