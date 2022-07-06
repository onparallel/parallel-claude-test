import AWS from "aws-sdk";
import chalk from "chalk";
import { execSync } from "child_process";
import yargs from "yargs";
import { run } from "./utils/run";
import { waitFor } from "./utils/wait";

AWS.config.credentials = new AWS.SharedIniFileCredentials({
  profile: "parallel-deploy",
});
AWS.config.region = "eu-central-1";

const ec2 = new AWS.EC2();
const elbv2 = new AWS.ELBv2();
const cloudfront = new AWS.CloudFront();

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

  const newInstances = await ec2
    .describeInstances({
      Filters: [
        { Name: "tag:Release", Values: [commit] },
        { Name: "tag:Environment", Values: [env] },
        { Name: "instance-state-name", Values: ["running"] },
      ],
    })
    .promise()
    .then((r) => r.Reservations?.flatMap((r) => r.Instances ?? []) ?? []);

  if (newInstances.length === 0) {
    throw new Error(`No running instances for environment ${env} and release ${commit}.`);
  }

  const targetGroups = await elbv2
    .describeTargetGroups({ Names: [`parallel-${env}-80`, `parallel-${env}-443`] })
    .promise()
    .then((r) => r.TargetGroups!);

  const oldInstances = await getTargetGroupInstances(targetGroups[0].TargetGroupArn!);

  await Promise.all(
    [80, 443].map(async (port) => {
      const targetGroup = targetGroups.find((tg) => tg.Port === port)!;
      const instancesIds = newInstances.map((i) => i.InstanceId!);

      console.log(`Registering instances ${instancesIds} on TG parallel-${env}-${port}`);
      await elbv2
        .registerTargets({
          TargetGroupArn: targetGroup.TargetGroupArn!,
          Targets: instancesIds.map((id) => ({ Id: id })),
        })
        .promise();
    })
  );

  await waitFor(
    async () => {
      const [ok1, ok2] = await Promise.all(
        targetGroups.map(async (tg) => {
          return elbv2
            .describeTargetHealth({ TargetGroupArn: tg.TargetGroupArn! })
            .promise()
            .then((r) =>
              newInstances.every(
                (i) =>
                  r.TargetHealthDescriptions!.find((d) => d.Target?.Id === i.InstanceId!)
                    ?.TargetHealth?.State === "healthy"
              )
            );
        })
      );
      return ok1 && ok2;
    },
    `Waiting for new targets to become healthy on TGs`,
    5000
  );

  console.log("Create invalidation for static files");
  const result = await cloudfront.listDistributions().promise();
  // find distribution for
  const distributionId = result.DistributionList!.Items!.find((d) =>
    d.Origins.Items.some((o) => o.Id === `S3-parallel-static-${env}`)
  )!.Id;
  await cloudfront
    .createInvalidation({
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: buildId,
        Paths: {
          Quantity: 1,
          Items: ["/static/*"],
        },
      },
    })
    .promise();

  await Promise.all(
    oldInstances.map(async (instance) => {
      const ipAddress = instance.PrivateIpAddress!;
      const instanceName = instance.Tags?.find((t) => t.Key === "Name")!.Value;
      console.log(chalk`Stopping workers on ${instance.InstanceId!} ${instanceName}`);
      execSync(`ssh \
      -o "UserKnownHostsFile=/dev/null" \
      -o StrictHostKeyChecking=no \
      ${ipAddress} /home/ec2-user/workers.sh stop`);
      console.log(chalk`Workers stopped on ${instance.InstanceId!} ${instanceName}`);
    })
  );
  await Promise.all(
    newInstances.map(async (instance) => {
      const ipAddress = instance.PrivateIpAddress!;
      const instanceName = instance.Tags?.find((t) => t.Key === "Name")!.Value;
      console.log(chalk`Starting workers on ${instance.InstanceId!} ${instanceName}`);
      // execSync(`ssh \
      // -o "UserKnownHostsFile=/dev/null" \
      // -o StrictHostKeyChecking=no \
      // ${ipAddress} /home/ec2-user/workers.sh start`);
      console.log(chalk`Workers started on ${instance.InstanceId!} ${instanceName}`);
    })
  );

  await Promise.all(
    [80, 443].map(async (port) => {
      const targetGroup = targetGroups.find((tg) => tg.Port === port)!;
      const instancesIds = oldInstances.map((i) => i.InstanceId!);

      console.log(`Deregistering instances ${instancesIds} on TG parallel-${env}-${port}`);
      await elbv2
        .deregisterTargets({
          TargetGroupArn: targetGroup.TargetGroupArn!,
          Targets: instancesIds.map((id) => ({ Id: id })),
        })
        .promise();
    })
  );

  await waitFor(
    async () => {
      const [ok1, ok2] = await Promise.all(
        targetGroups.map(async (tg) => {
          return elbv2
            .describeTargetHealth({ TargetGroupArn: tg.TargetGroupArn! })
            .promise()
            .then((r) =>
              oldInstances.every(
                (i) => !r.TargetHealthDescriptions!.find((d) => d.Target?.Id === i.InstanceId!)
              )
            );
        })
      );
      return ok1 && ok2;
    },
    `Waiting for new targets to become healthy on TGs`,
    5000
  );
}

run(main);

async function getTargetGroupInstances(targetGroupArn: string) {
  const instanceIds = await elbv2
    .describeTargetHealth({ TargetGroupArn: targetGroupArn })
    .promise()
    .then((r) => r.TargetHealthDescriptions!.map((d) => d.Target!.Id));
  return await ec2
    .describeInstances({
      InstanceIds: instanceIds,
      Filters: [{ Name: "instance-state-name", Values: ["running"] }],
    })
    .promise()
    .then((r) => r.Reservations?.flatMap((r) => r.Instances ?? []) ?? []);
}
