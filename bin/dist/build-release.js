"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const yargs_1 = __importDefault(require("yargs"));
const run_1 = require("./utils/run");
const token_1 = require("./utils/token");
const WORK_DIR = "/home/ec2-user";
async function main() {
    const { commit: _commit, env } = await yargs_1.default
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
    const buildId = `parallel-${env}-${commit}`;
    const buildDir = `${WORK_DIR}/${buildId}`;
    console.log((0, chalk_1.default) `Checking out the code for commit {bold ${commit}}`);
    (0, child_process_1.execSync)(`git clone --no-checkout git@github.com:onparallel/parallel.git ${buildDir}`, {
        cwd: WORK_DIR,
        encoding: "utf-8",
    });
    (0, child_process_1.execSync)(`git checkout ${commit}`, { cwd: buildDir, encoding: "utf-8" });
    (0, child_process_1.execSync)(`rm -rf .git`, { cwd: buildDir, encoding: "utf-8" });
    console.log("Installing dependencies...");
    (0, child_process_1.execSync)(`yarn install \
     --prefer-offline \
     --frozen-lockfile`, {
        cwd: buildDir,
        encoding: "utf-8",
    });
    console.log("Getting the secrets 🤫");
    // move environment specific values into .env.production.local file (used on staging and production)
    (0, child_process_1.execSync)(`cp ${buildDir}/client/.env.${env} ${buildDir}/client/.env.production.local`);
    // remove temporary production and staging env variables files, as those are already into .env.production.local
    (0, child_process_1.execSync)(`rm ${buildDir}/client/.env.production ${buildDir}/client/.env.staging`);
    // Generate tokens
    const CLIENT_SERVER_TOKEN = (0, token_1.token)(32);
    const SECURITY_SERVICE_JWT_SECRET = (0, token_1.token)(32);
    (0, child_process_1.execSync)(`echo "" >> ${buildDir}/client/.env.local`, {
        cwd: WORK_DIR,
        encoding: "utf-8",
    });
    (0, child_process_1.execSync)(`echo "CLIENT_SERVER_TOKEN=${CLIENT_SERVER_TOKEN}" >> ${buildDir}/client/.env.local`, {
        cwd: WORK_DIR,
        encoding: "utf-8",
    });
    (0, child_process_1.execSync)(`echo "" >> ${buildDir}/server/.env`, {
        cwd: WORK_DIR,
        encoding: "utf-8",
    });
    (0, child_process_1.execSync)(`echo "CLIENT_SERVER_TOKEN=${CLIENT_SERVER_TOKEN}" >> ${buildDir}/server/.env.${env}`, {
        cwd: WORK_DIR,
        encoding: "utf-8",
    });
    (0, child_process_1.execSync)(`echo "SECURITY_SERVICE_JWT_SECRET=${SECURITY_SERVICE_JWT_SECRET}" >> ${buildDir}/server/.env.${env}`, { cwd: WORK_DIR, encoding: "utf-8" });
    const secretsManagerClient = new client_secrets_manager_1.SecretsManagerClient({});
    const response = await secretsManagerClient.send(new client_secrets_manager_1.GetSecretValueCommand({
        SecretId: "arn:aws:secretsmanager:eu-central-1:749273139513:secret:ops/sentry-auth-token-609sGa",
    }));
    const sentryAuthToken = response.SecretString;
    console.log("Building the client");
    (0, child_process_1.execSync)(`ENV=${env} BUILD_ID=${buildId} SENTRY_AUTH_TOKEN=${sentryAuthToken} yarn build-ops`, {
        cwd: `${buildDir}/client`,
        encoding: "utf-8",
    });
    (0, child_process_1.execSync)(`aws s3 sync \
      ${buildDir}/client/.next/static \
      s3://parallel-static-${env}/_next/static \
      --cache-control max-age=31536000`);
    (0, child_process_1.execSync)(`aws s3 sync \
      ${buildDir}/client/public/static \
      s3://parallel-static-${env}/static \
      --cache-control max-age=2592000`);
    console.log("Building the server");
    (0, child_process_1.execSync)(`yarn build`, { cwd: `${buildDir}/server`, encoding: "utf-8" });
    console.log("Pruning devDependencies");
    (0, child_process_1.execSync)(`yarn install \
    --production \
    --ignore-scripts \
    --prefer-offline \
    --frozen-lockfile`, { cwd: buildDir, encoding: "utf-8" });
    (0, child_process_1.execSync)(`yarn patch-package`, { cwd: buildDir, encoding: "utf-8" });
    console.log("Zip and upload to S3");
    (0, child_process_1.execSync)(`tar -zcf ${buildId}.tar.gz ${buildId}`, {
        cwd: WORK_DIR,
        encoding: "utf-8",
    });
    (0, child_process_1.execSync)(`rm -rf ${buildDir}`, { cwd: WORK_DIR, encoding: "utf-8" });
    (0, child_process_1.execSync)(`aws s3 mv ${buildId}.tar.gz s3://parallel-builds-${env}/${buildId}.tar.gz`, {
        cwd: WORK_DIR,
        encoding: "utf-8",
    });
}
(0, run_1.run)(main);
