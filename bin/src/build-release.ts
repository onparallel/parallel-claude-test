import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import chalk from "chalk";
import { execSync } from "child_process";
import yargs from "yargs";
import { run } from "./utils/run";
import { token } from "./utils/token";

const WORK_DIR = "/home/ec2-user";

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
  const buildId = `parallel-${env}-${commit}`;
  const buildDir = `${WORK_DIR}/${buildId}`;

  console.log(chalk`Checking out the code for commit {bold ${commit}}`);
  execSync(`git clone --no-checkout git@github.com:onparallel/parallel.git ${buildDir}`, {
    cwd: WORK_DIR,
    encoding: "utf-8",
  });
  execSync(`git checkout ${commit}`, { cwd: buildDir, encoding: "utf-8" });
  execSync(`rm -rf .git`, { cwd: buildDir, encoding: "utf-8" });

  console.log("Installing dependencies...");
  execSync(
    `yarn install \
     --prefer-offline \
     --frozen-lockfile`,
    {
      cwd: buildDir,
      encoding: "utf-8",
    }
  );

  console.log("Getting the secrets 🤫");
  // move environment specific values into .env.production.local file (used on staging and production)
  execSync(`cp ${buildDir}/client/.env.${env} ${buildDir}/client/.env.production.local`);
  // remove temporary production and staging env variables files, as those are already into .env.production.local
  execSync(`rm ${buildDir}/client/.env.production ${buildDir}/client/.env.staging`);

  // Generate tokens
  const CLIENT_SERVER_TOKEN = token(32);
  const SECURITY_SERVICE_JWT_SECRET = token(32);

  execSync(`echo "" >> ${buildDir}/client/.env.local`, {
    cwd: WORK_DIR,
    encoding: "utf-8",
  });

  execSync(`echo "CLIENT_SERVER_TOKEN=${CLIENT_SERVER_TOKEN}" >> ${buildDir}/client/.env.local`, {
    cwd: WORK_DIR,
    encoding: "utf-8",
  });
  execSync(`echo "" >> ${buildDir}/server/.env`, {
    cwd: WORK_DIR,
    encoding: "utf-8",
  });
  execSync(`echo "CLIENT_SERVER_TOKEN=${CLIENT_SERVER_TOKEN}" >> ${buildDir}/server/.env.${env}`, {
    cwd: WORK_DIR,
    encoding: "utf-8",
  });
  execSync(
    `echo "SECURITY_SERVICE_JWT_SECRET=${SECURITY_SERVICE_JWT_SECRET}" >> ${buildDir}/server/.env.${env}`,
    { cwd: WORK_DIR, encoding: "utf-8" }
  );

  const secretsManagerClient = new SecretsManagerClient({});
  const response = await secretsManagerClient.send(
    new GetSecretValueCommand({
      SecretId:
        "arn:aws:secretsmanager:eu-central-1:749273139513:secret:ops/sentry-auth-token-609sGa",
    })
  );
  const sentryAuthToken = response.SecretString!;

  console.log("Building the client");
  execSync(`ENV=${env} BUILD_ID=${buildId} SENTRY_AUTH_TOKEN=${sentryAuthToken} yarn build-ops`, {
    cwd: `${buildDir}/client`,
    encoding: "utf-8",
  });
  execSync(
    `aws s3 sync \
      ${buildDir}/client/.next/static \
      s3://parallel-static-${env}/_next/static \
      --cache-control max-age=31536000`
  );
  execSync(
    `aws s3 sync \
      ${buildDir}/client/public/static \
      s3://parallel-static-${env}/static \
      --cache-control max-age=2592000`
  );

  console.log("Building the server");
  execSync(`yarn build`, { cwd: `${buildDir}/server`, encoding: "utf-8" });

  console.log("Pruning devDependencies");
  execSync(
    `yarn install \
    --production \
    --ignore-scripts \
    --prefer-offline \
    --frozen-lockfile`,
    { cwd: buildDir, encoding: "utf-8" }
  );
  execSync(`yarn patch-package`, { cwd: buildDir, encoding: "utf-8" });

  console.log("Zip and upload to S3");
  execSync(`tar -zcf ${buildId}.tar.gz ${buildId}`, {
    cwd: WORK_DIR,
    encoding: "utf-8",
  });
  execSync(`rm -rf ${buildDir}`, { cwd: WORK_DIR, encoding: "utf-8" });
  execSync(`aws s3 mv ${buildId}.tar.gz s3://parallel-builds-${env}/${buildId}.tar.gz`, {
    cwd: WORK_DIR,
    encoding: "utf-8",
  });
}

run(main);
