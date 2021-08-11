import AWS from "aws-sdk";
import chalk from "chalk";
import { execSync } from "child_process";
import yargs from "yargs";
import { run } from "./utils/run";
import { waitFor, wait } from "./utils/wait";

AWS.config.credentials = new AWS.SharedIniFileCredentials({
  profile: "parallel-deploy",
});
AWS.config.region = "eu-central-1";

const INSTANCE_TYPES = {
  production: "t2.medium",
  staging: "t2.small",
};
const KEY_NAME = "ops";
const IMAGE_ID = "ami-076e6846368502bbb";
const SECURITY_GROUP_IDS = ["sg-0486098a6131eb458"];
const IAM_ROLE = "parallel-server";
const VPC_ID = "vpc-5356ab39";
const SUBNET_ID = "subnet-d3cc68b9";
const REGION = "eu-central-1";
const AVAILABILITY_ZONE = `${REGION}a`;
const ENHANCED_MONITORING = true;
const OPS_DIR = "/home/ec2-user/parallel/ops/prod";

const ec2 = new AWS.EC2();
const elbv2 = new AWS.ELBv2();

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

  const result = await ec2
    .runInstances({
      ImageId: IMAGE_ID,
      KeyName: KEY_NAME,
      SecurityGroupIds: SECURITY_GROUP_IDS,
      IamInstanceProfile: {
        Name: IAM_ROLE,
      },
      InstanceType: (INSTANCE_TYPES as any)[env!],
      Placement: {
        AvailabilityZone: AVAILABILITY_ZONE,
        Tenancy: "default",
      },
      SubnetId: SUBNET_ID,
      MaxCount: 1,
      MinCount: 1,
      Monitoring: {
        Enabled: ENHANCED_MONITORING,
      },
      TagSpecifications: [
        {
          ResourceType: "instance",
          Tags: [
            {
              Key: "Name",
              Value: `server-${env}-${commit}`,
            },
            {
              Key: "Release",
              Value: commit,
            },
            {
              Key: "Environment",
              Value: env,
            },
          ],
        },
      ],
    })
    .promise();
  const instanceId = result.Instances![0].InstanceId!;
  const ipAddress = result.Instances![0].PrivateIpAddress!;
  console.log(chalk`Launched instance {bold ${instanceId}} on {bold ${ipAddress}}`);
  await wait(5000);
  await waitFor(
    async () => {
      const result = await ec2.describeInstances({ InstanceIds: [instanceId] }).promise();
      return result.Reservations?.[0].Instances?.[0].State?.Name === "running";
    },
    chalk`Instance {yellow pending}. Waiting 10 more seconds...`,
    10000
  );
  console.log(chalk`Instance {green ✓ running}`);
  const targetGroupName = `${commit}-${env}`;
  let targetGroupArn: string;
  try {
    const result = await elbv2.describeTargetGroups({ Names: [targetGroupName] }).promise();
    targetGroupArn = result.TargetGroups![0].TargetGroupArn!;
  } catch (error) {
    if (error.code === "TargetGroupNotFound") {
      const result = await elbv2
        .createTargetGroup({
          Name: targetGroupName,
          Protocol: "HTTP",
          Port: 80,
          VpcId: VPC_ID,
          HealthCheckPath: "/status",
        })
        .promise();
      targetGroupArn = result.TargetGroups![0].TargetGroupArn!;
    } else {
      throw error;
    }
  }
  await elbv2
    .registerTargets({
      TargetGroupArn: targetGroupArn,
      Targets: [{ Id: instanceId }],
    })
    .promise();

  await waitFor(
    async () => {
      try {
        execSync(
          `ssh \
            -o ConnectTimeout=1 \
            -o "UserKnownHostsFile=/dev/null" \
            -o StrictHostKeyChecking=no \
            ec2-user@${ipAddress} true >/dev/null 2>&1`
        );
        return true;
      } catch {
        return false;
      }
    },
    chalk`SSH not available. Waiting 5 more seconds...`,
    5000
  );

  console.log("Uploading install script to the new instance.");
  execSync(`scp \
    -o "UserKnownHostsFile=/dev/null" \
    -o "StrictHostKeyChecking=no" \
    ${OPS_DIR}/{install.sh,workers.sh} ${ipAddress}:/home/ec2-user/`);
  execSync(`ssh \
    -o "UserKnownHostsFile=/dev/null" \
    -o StrictHostKeyChecking=no \
    ${ipAddress} /home/ec2-user/install.sh ${commit} ${env}`);
}

run(main);
