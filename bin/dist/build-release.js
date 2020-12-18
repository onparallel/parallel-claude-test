"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const yargs_1 = __importDefault(require("yargs"));
const run_1 = require("./utils/run");
const fs_1 = require("fs");
const rimraf_1 = __importDefault(require("rimraf"));
const token_1 = require("./utils/token");
aws_sdk_1.default.config.credentials = new aws_sdk_1.default.SharedIniFileCredentials({
    profile: "parallel-deploy",
});
aws_sdk_1.default.config.region = "eu-central-1";
const WORK_DIR = "/home/ec2-user";
const cloudfront = new aws_sdk_1.default.CloudFront();
async function main() {
    const { commit: _commit, env } = yargs_1.default
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
    const buildId = `${commit}-${env}`;
    const buildDir = `${WORK_DIR}/${buildId}`;
    console.log(chalk_1.default `Checking out the code for commit {bold ${commit}}`);
    child_process_1.execSync(`git clone --no-checkout git@github.com:parallel-so/parallel.git ${buildDir}`, { cwd: WORK_DIR, encoding: "utf-8" });
    child_process_1.execSync(`git checkout ${commit}`, { cwd: buildDir, encoding: "utf-8" });
    child_process_1.execSync(`rm -rf .git`, { cwd: buildDir, encoding: "utf-8" });
    console.log("Installing dependencies...");
    child_process_1.execSync(`PLAYWRIGHT_BROWSERS_PATH=0 yarn install \
     --prefer-offline \
     --frozen-lockfile`, {
        cwd: buildDir,
        encoding: "utf-8",
    });
    // remove unused browsers to keep the artifact small
    const contents = await fs_1.promises.readdir(`${buildDir}/node_modules/playwright/.local-browsers`, { withFileTypes: true });
    for (const content of contents) {
        if (content.isDirectory() &&
            ["firefox-", "webkit-"].some((prefix) => content.name.startsWith(prefix))) {
            rimraf_1.default.sync(`${buildDir}/node_modules/playwright/.local-browsers/${content.name}`);
        }
    }
    console.log("Getting the secrets 🤫");
    child_process_1.execSync("git clone --depth 1 git@github.com:parallel-so/secrets.git secrets", {
        cwd: WORK_DIR,
        encoding: "utf-8",
    });
    for (const dir of ["server", "client"]) {
        child_process_1.execSync(`cp -a secrets/${env}/${dir}/. ${buildDir}/${dir}/`, {
            cwd: WORK_DIR,
            encoding: "utf-8",
        });
    }
    child_process_1.execSync("rm -rf secrets", { cwd: WORK_DIR, encoding: "utf-8" });
    // Generate tokens
    const CLIENT_SERVER_TOKEN = token_1.token(32);
    const SECURITY_SERVICE_JWT_SECRET = token_1.token(32);
    child_process_1.execSync(`echo "CLIENT_SERVER_TOKEN=${CLIENT_SERVER_TOKEN}" >> ${buildDir}/client/.env.local`, { cwd: WORK_DIR, encoding: "utf-8" });
    child_process_1.execSync(`echo "CLIENT_SERVER_TOKEN=${CLIENT_SERVER_TOKEN}" >> ${buildDir}/server/.env`, { cwd: WORK_DIR, encoding: "utf-8" });
    child_process_1.execSync(`echo "SECURITY_SERVICE_JWT_SECRET=${SECURITY_SERVICE_JWT_SECRET}" >> ${buildDir}/server/.env`, { cwd: WORK_DIR, encoding: "utf-8" });
    console.log("Building the client");
    child_process_1.execSync(`yarn build`, {
        cwd: `${buildDir}/client`,
        encoding: "utf-8",
    });
    child_process_1.execSync(`aws s3 sync \
      ${buildDir}/client/.next/static \
      s3://parallel-static-${env}/_next/static \
      --cache-control max-age=2592000 \
      --profile parallel-deploy`);
    child_process_1.execSync(`aws s3 sync \
      ${buildDir}/client/public \
      s3://parallel-static-${env} \
      --cache-control max-age=2592000 \
      --profile parallel-deploy`);
    console.log("Building the server");
    child_process_1.execSync(`yarn build`, { cwd: `${buildDir}/server`, encoding: "utf-8" });
    console.log("Pruning devDependencies");
    child_process_1.execSync(`PLAYWRIGHT_BROWSERS_PATH=0 yarn install \
    --production \
    --ignore-scripts \
    --prefer-offline \
    --frozen-lockfile`, { cwd: buildDir, encoding: "utf-8" });
    console.log("Zip and upload to S3");
    child_process_1.execSync(`tar -zcf ${buildId}.tar.gz ${buildId}`, {
        cwd: WORK_DIR,
        encoding: "utf-8",
    });
    child_process_1.execSync(`rm -rf ${buildDir}`, { cwd: WORK_DIR, encoding: "utf-8" });
    child_process_1.execSync(`aws s3 mv ${buildId}.tar.gz s3://parallel-builds/${buildId}.tar.gz --profile parallel-deploy`, { cwd: WORK_DIR, encoding: "utf-8" });
    console.log("Create invalidation for static files");
    const result = await cloudfront.listDistributions().promise();
    const distributionId = result.DistributionList.Items.find((i) => i.Origins.Items[0].Id === `S3-parallel-static-${env}`).Id;
    await cloudfront
        .createInvalidation({
        DistributionId: distributionId,
        InvalidationBatch: {
            CallerReference: buildId,
            Paths: {
                Quantity: 1,
                Items: ["/*"],
            },
        },
    })
        .promise();
}
run_1.run(main);
