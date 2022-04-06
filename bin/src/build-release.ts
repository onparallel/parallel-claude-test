import AWS from "aws-sdk";
import chalk from "chalk";
import { execSync } from "child_process";
import yargs from "yargs";
import { run } from "./utils/run";
import { token } from "./utils/token";

AWS.config.credentials = new AWS.SharedIniFileCredentials({
  profile: "parallel-deploy",
});
AWS.config.region = "eu-central-1";

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
  const buildId = `${commit}-${env}`;
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
  execSync("git clone --depth 1 git@github.com:onparallel/secrets.git secrets", {
    cwd: WORK_DIR,
    encoding: "utf-8",
  });
  for (const dir of ["server", "client"]) {
    execSync(`cp -a secrets/${env}/${dir}/. ${buildDir}/${dir}/`, {
      cwd: WORK_DIR,
      encoding: "utf-8",
    });
  }
  execSync("rm -rf secrets", { cwd: WORK_DIR, encoding: "utf-8" });
  // Generate tokens
  const CLIENT_SERVER_TOKEN = token(32);
  const SECURITY_SERVICE_JWT_SECRET = token(32);
  execSync(`echo "CLIENT_SERVER_TOKEN=${CLIENT_SERVER_TOKEN}" >> ${buildDir}/client/.env.local`, {
    cwd: WORK_DIR,
    encoding: "utf-8",
  });
  execSync(`echo "CLIENT_SERVER_TOKEN=${CLIENT_SERVER_TOKEN}" >> ${buildDir}/server/.env`, {
    cwd: WORK_DIR,
    encoding: "utf-8",
  });
  execSync(
    `echo "SECURITY_SERVICE_JWT_SECRET=${SECURITY_SERVICE_JWT_SECRET}" >> ${buildDir}/server/.env`,
    { cwd: WORK_DIR, encoding: "utf-8" }
  );

  console.log("Building the client");
  execSync(`ENV=${env} yarn build`, {
    cwd: `${buildDir}/client`,
    encoding: "utf-8",
  });
  execSync(
    `aws s3 sync \
      ${buildDir}/client/.next/static \
      s3://parallel-static-${env}/_next/static \
      --cache-control max-age=31536000 \
      --profile parallel-deploy`
  );
  execSync(
    `aws s3 sync \
      ${buildDir}/client/public/static \
      s3://parallel-static-${env}/static \
      --cache-control max-age=2592000 \
      --profile parallel-deploy`
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
  execSync(
    `aws s3 mv ${buildId}.tar.gz s3://parallel-builds/${buildId}.tar.gz --profile parallel-deploy`,
    { cwd: WORK_DIR, encoding: "utf-8" }
  );
}

run(main);
