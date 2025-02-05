"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const yargs_1 = __importDefault(require("yargs"));
const run_1 = require("./utils/run");
async function main() {
    const { commit: _commit, env, forceBuild, skipPrune, } = await yargs_1.default
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
        (0, child_process_1.execSync)(command, { encoding: "utf-8", stdio: "inherit" });
    }
}
(0, run_1.run)(main);
