import {
  AttachVolumeCommand,
  DescribeImagesCommand,
  DescribeInstancesCommand,
  DescribeVolumesCommand,
  EC2Client,
  HttpTokensState,
  InstanceMetadataEndpointState,
  InstanceStateName,
  ResourceType,
  RunInstancesCommand,
  Tenancy,
  TerminateInstancesCommand,
  VolumeAttachmentState,
} from "@aws-sdk/client-ec2";
import chalk from "chalk";
import { execSync } from "child_process";
import path from "path";
import { isDefined } from "remeda";
import { assert } from "ts-essentials";
import yargs from "yargs";
import { run } from "./utils/run";
import { copyToRemoteServer, executeRemoteCommand, pingSsh } from "./utils/ssh";
import { withStopwatch } from "./utils/stopwatch";
import { timestamp } from "./utils/timestamp";
import { wait, waitFor } from "./utils/wait";

const WORK_DIR = "/home/ec2-user";

type Environment = "staging" | "production";

const BUILDER_IMAGE_ID = "ami-0292d5deba2afa9fc";
const INSTANCE_TYPE = "c6i.2xlarge";
const KEY_NAME = "ops";
const SECURITY_GROUP_IDS = ["sg-0f7aae421410e4758"];
const KMS_KEY_ID = "acf1d245-abe5-4ff8-a490-09dba3834c45";
const SUBNET_ID = "subnet-d3cc68b9";
const REGION = "eu-central-1";
const AVAILABILITY_ZONE = `${REGION}a`;
const ENHANCED_MONITORING = true;
const YARN_CACHE_VOLUME = "vol-0d498fe71cba530de";

async function main() {
  const {
    commit: _commit,
    env,
    force,
    terminate,
  } = await yargs
    .usage("Usage: $0 --commit [commit] --env [env]")
    .option("commit", {
      required: true,
      type: "string",
      description: "The commit sha",
    })
    .option("env", {
      required: true,
      choices: ["staging", "production"] satisfies Environment[],
      description: "The environment for the build",
    })
    .option("force", {
      type: "boolean",
      default: false,
      description: "If build already exists forces it to be built again",
    })
    .option("terminate", {
      type: "boolean",
      default: true,
      description: "If the instance should be terminated after build",
    }).argv;

  const ec2 = new EC2Client({});

  const commit = _commit.slice(0, 7);
  const buildId = `parallel-${env}-${commit}`;
  const artifactName = `${buildId}.tar.gz`;
  const bucketName = `parallel-builds-${env}`;
  const artifactPath = `${bucketName}/${artifactName}`;

  if (!force) {
    try {
      execSync(`aws s3 ls ${artifactPath}`, { cwd: WORK_DIR, encoding: "utf-8" });
      console.log(
        chalk.green`Build already exists. Skipping. To force build run build-release with --force or full-release with --force-build`,
      );
      return;
    } catch {}
  }

  const name = `builder-${timestamp()}`;
  const image = await ec2
    .send(
      new DescribeImagesCommand({
        ImageIds: [BUILDER_IMAGE_ID],
      }),
    )
    .then((res) => res.Images![0]);
  const result = await ec2.send(
    new RunInstancesCommand({
      ImageId: BUILDER_IMAGE_ID,
      KeyName: KEY_NAME,
      SecurityGroupIds: SECURITY_GROUP_IDS,
      InstanceType: INSTANCE_TYPE,
      Placement: {
        AvailabilityZone: AVAILABILITY_ZONE,
        Tenancy: Tenancy.default,
      },
      IamInstanceProfile: { Name: "parallel-builder" },
      SubnetId: SUBNET_ID,
      MaxCount: 1,
      MinCount: 1,
      Monitoring: {
        Enabled: ENHANCED_MONITORING,
      },
      BlockDeviceMappings: [
        {
          DeviceName: "/dev/xvda",
          Ebs: {
            KmsKeyId: KMS_KEY_ID,
            Encrypted: true,
            VolumeSize: 30,
            DeleteOnTermination: true,
            VolumeType: "gp2",
            SnapshotId: image.BlockDeviceMappings![0].Ebs!.SnapshotId,
          },
        },
      ],
      TagSpecifications: [
        { ResourceType: ResourceType.instance, Tags: [{ Key: "Name", Value: name }] },
        { ResourceType: ResourceType.volume, Tags: [{ Key: "Name", Value: name }] },
      ],
      MetadataOptions: {
        HttpEndpoint: InstanceMetadataEndpointState.enabled,
        HttpTokens: HttpTokensState.required,
      },
    }),
  );
  const instance = result.Instances![0];
  const instanceId = instance.InstanceId!;
  const ipAddress = instance.PrivateIpAddress!;
  async function shutdown() {
    if (terminate) {
      console.log("Shutting down instance");
      await ec2.send(
        new TerminateInstancesCommand({
          InstanceIds: [instanceId],
        }),
      );
    }
  }
  process.on("SIGINT", function () {});
  process.on("SIGTERM", function () {});
  console.log(chalk`Launched instance {bold ${instanceId}}`);
  try {
    await wait(5_000);
    await waitFor(
      async () => {
        const result = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
        const instance = result.Reservations?.[0].Instances?.[0];
        return instance?.State?.Name === InstanceStateName.running;
      },
      chalk.italic`Instance {yellow pending}. Waiting 10 more seconds...`,
      10_000,
    );
    assert(isDefined(ipAddress));
    await waitForInstance(ipAddress);
    await ec2.send(
      new AttachVolumeCommand({
        InstanceId: instanceId,
        VolumeId: YARN_CACHE_VOLUME,
        Device: "/dev/xvdy",
      }),
    );
    await waitFor(
      async () => {
        const result = await ec2.send(
          new DescribeVolumesCommand({ VolumeIds: [YARN_CACHE_VOLUME] }),
        );
        return (
          result.Volumes?.[0].Attachments?.find((a) => a.InstanceId === instanceId)?.State ===
          VolumeAttachmentState.attached
        );
      },
      chalk.italic`Volume attaching {yellow pending}. Waiting 3 more seconds...`,
      3_000,
    );
    console.log("Uploading build script to the new instance.");
    await copyToRemoteServer(
      ipAddress,
      path.resolve(__dirname, `../../ops/prod/build-release.sh`),
      "~",
    );
    console.log("Executing build script.");
    const { time } = await withStopwatch(async () => {
      await executeRemoteCommand(ipAddress, `'/home/ec2-user/build-release.sh ${commit} ${env}'`);
    });
    console.log(chalk.green`Build sucessful after ${Math.round(time / 1000)} seconds.`);
  } finally {
    await shutdown();
  }
}

run(main);

async function waitForInstance(ipAddress: string) {
  await waitFor(
    async () => {
      try {
        await pingSsh(ipAddress);
        return true;
      } catch {
        return false;
      }
    },
    chalk`SSH not available. Waiting 5 more seconds...`,
    5000,
  );
}
