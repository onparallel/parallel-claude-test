import AWS from "aws-sdk";
import chalk from "chalk";
import { execSync } from "child_process";
import yargs from "yargs";
import { run } from "./utils/run";
import { promises as fs } from "fs";
import rimraf from "rimraf";

AWS.config.credentials = new AWS.SharedIniFileCredentials({
  profile: "parallel-deploy",
});
AWS.config.region = "eu-central-1";

const WORK_DIR = "/home/ec2-user";

const cloudfront = new AWS.CloudFront();

async function main() {
  const { commit: _commit, env } = yargs
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
  execSync(
    `git clone --no-checkout git@github.com:parallel-so/parallel.git ${buildDir}`,
    { cwd: WORK_DIR, encoding: "utf-8" }
  );
  execSync(`git checkout ${commit}`, { cwd: buildDir, encoding: "utf-8" });
  execSync(`rm -rf .git`, { cwd: buildDir, encoding: "utf-8" });

  console.log("Installing dependencies...");
  execSync(
    `PLAYWRIGHT_BROWSERS_PATH=0 yarn install \
     --prefer-offline \
     --frozen-lockfile`,
    {
      cwd: buildDir,
      encoding: "utf-8",
    }
  );
  // remove unused browsers to keep the artifact small
  const contents = await fs.readdir(
    `${buildDir}/node_modules/playwright/.local-browsers`,
    { withFileTypes: true }
  );
  for (const content of contents) {
    if (
      content.isDirectory() &&
      ["firefox-", "webkit-"].some((prefix) => content.name.startsWith(prefix))
    ) {
      rimraf.sync(
        `${buildDir}/node_modules/playwright/.local-browsers/${content.name}`
      );
    }
  }

  console.log("Getting the secrets 🤫");
  execSync(
    "git clone --depth 1 git@github.com:parallel-so/secrets.git secrets",
    {
      cwd: WORK_DIR,
      encoding: "utf-8",
    }
  );
  for (const dir of ["server", "client"]) {
    execSync(`cp -a secrets/${env}/${dir}/. ${buildDir}/${dir}/`, {
      cwd: WORK_DIR,
      encoding: "utf-8",
    });
  }
  execSync("rm -rf secrets", { cwd: WORK_DIR, encoding: "utf-8" });

  console.log("Building the client");
  execSync(`yarn build`, {
    cwd: `${buildDir}/client`,
    encoding: "utf-8",
  });
  execSync(
    `aws s3 sync \
      ${buildDir}/client/.next/static \
      s3://parallel-static-${env}/_next/static \
      --cache-control max-age=2592000 \
      --profile parallel-deploy`
  );
  execSync(
    `aws s3 sync \
      ${buildDir}/client/public \
      s3://parallel-static-${env} \
      --cache-control max-age=2592000 \
      --profile parallel-deploy`
  );

  console.log("Building the server");
  execSync(`yarn build`, { cwd: `${buildDir}/server`, encoding: "utf-8" });

  console.log("Pruning devDependencies");
  execSync(
    `PLAYWRIGHT_BROWSERS_PATH=0 yarn install \
    --production \
    --ignore-scripts \
    --prefer-offline \
    --frozen-lockfile`,
    { cwd: buildDir, encoding: "utf-8" }
  );

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

  console.log("Create invalidation for static files");
  const result = await cloudfront.listDistributions().promise();
  const distributionId = result.DistributionList!.Items!.find(
    (i) => i.Origins.Items[0].Id === `S3-parallel-static-${env}`
  )!.Id;
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

run(main);
