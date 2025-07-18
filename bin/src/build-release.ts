import {
  AttachVolumeCommand,
  DescribeImagesCommand,
  DescribeVolumesCommand,
  EC2Client,
  EC2ServiceException,
  HttpTokensState,
  InstanceMetadataEndpointState,
  ResourceType,
  Tenancy,
  VolumeAttachmentState,
} from "@aws-sdk/client-ec2";
import chalk from "chalk";
import { execSync } from "child_process";
import path from "path";
import { isNullish } from "remeda";
import { assert } from "ts-essentials";
import yargs from "yargs";
import { run } from "./utils/run";
import { copyToRemoteServer, executeRemoteCommand } from "./utils/ssh";
import { withStopwatch } from "./utils/stopwatch";
import { timestamp } from "./utils/timestamp";
import { waitForResult } from "./utils/wait";
import { withInstance } from "./utils/withInstance";

const WORK_DIR = "/home/ec2-user";

type Environment = "staging" | "production";

const BUILDER_IMAGE_ID = "ami-092f5571e90aff5fe";
const INSTANCE_TYPE = "c6i.2xlarge";
const KEY_NAME = "ops";
const SECURITY_GROUP_IDS = {
  production: ["sg-0f7aae421410e4758"],
  staging: ["sg-099b8951613ae3bc0"],
};
type AvailabilityZone = `eu-central-1${"a" | "b" | "c"}`;
const KMS_KEY_ID = "acf1d245-abe5-4ff8-a490-09dba3834c45";
const SUBNET_ID = {
  production: {
    "eu-central-1a": "subnet-d3cc68b9",
    "eu-central-1b": "subnet-77f2e10a",
    "eu-central-1c": "subnet-eb22c4a7",
  } as Record<AvailabilityZone, string>,
  staging: {
    "eu-central-1a": "subnet-0324d190a292cbcdb",
    "eu-central-1b": "subnet-0d412e1f270c6d2dc",
  } as Record<AvailabilityZone, string>,
};
const ENHANCED_MONITORING = true;
const YARN_CACHE_VOLUMES = {
  "eu-central-1a": ["vol-0d498fe71cba530de", "vol-02eb0c410dd9891c6"],
  "eu-central-1b": ["vol-0b18f9f00f10a004e", "vol-0da829b9c738f1a28"],
  "eu-central-1c": ["vol-00e29b6d2008f8e58", "vol-081c2d21ef1c59a54"],
} as Record<AvailabilityZone, string[]>;

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

  // redundant make sure the user is deploying on the intended environment
  assert(env === process.env.ENV, "env mismatch");

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
  const azs = Object.keys(SUBNET_ID[env]) as AvailabilityZone[];
  let az: AvailabilityZone | undefined;
  while ((az = azs.shift())) {
    try {
      await withInstance(
        ec2,
        {
          ImageId: BUILDER_IMAGE_ID,
          KeyName: KEY_NAME,
          InstanceType: INSTANCE_TYPE,
          Placement: {
            AvailabilityZone: az,
            Tenancy: Tenancy.default,
          },
          IamInstanceProfile: { Name: "parallel-builder" },
          MaxCount: 1,
          MinCount: 1,
          Monitoring: {
            Enabled: ENHANCED_MONITORING,
          },
          NetworkInterfaces: [
            {
              DeviceIndex: 0,
              AssociatePublicIpAddress: true,
              SubnetId: SUBNET_ID[env][az],
              Groups: SECURITY_GROUP_IDS[env],
            },
          ],
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
        },
        async ({ instanceId, ipAddress }, { signal }) => {
          let volumeId!: string;
          for (const volume of YARN_CACHE_VOLUMES[az!]) {
            try {
              console.log(chalk.italic`Trying to use ${volume} as cache...`);
              const res = await ec2.send(
                new AttachVolumeCommand({
                  InstanceId: instanceId,
                  VolumeId: volume,
                  Device: "/dev/xvdy",
                }),
              );
              volumeId = res.VolumeId!;
              break;
            } catch (e) {
              if (e instanceof EC2ServiceException && e.name === "VolumeInUse") {
                console.log(chalk.italic`${volume} in use!`);
              } else {
                throw e;
              }
            }
            signal.throwIfAborted();
          }
          if (isNullish(volumeId)) {
            throw new Error("All yarn cache volumes are in use");
          }
          await waitForResult(
            async () => {
              const result = await ec2.send(new DescribeVolumesCommand({ VolumeIds: [volumeId] }));
              return (
                result.Volumes?.[0].Attachments?.find((a) => a.InstanceId === instanceId)?.State ===
                VolumeAttachmentState.attached
              );
            },
            {
              message: chalk.italic`Volume attaching {yellow pending}. Waiting 3 more seconds...`,
              signal,
              delay: 3_000,
            },
          );
          console.log("Uploading build script to the new instance.");
          await copyToRemoteServer(
            ipAddress,
            path.resolve(__dirname, `../../ops/prod/build-release.sh`),
            "~",
            { signal },
          );
          console.log("Executing build script.");
          const { time } = await withStopwatch(async () => {
            await executeRemoteCommand(
              ipAddress,
              `'/home/ec2-user/build-release.sh ${commit} ${env}'`,
              { signal },
            );
          });
          console.log(chalk.green`Build sucessful after ${Math.round(time / 1000)} seconds.`);
        },
        { terminate },
      );
      return;
    } catch (e) {
      if (e instanceof EC2ServiceException && e.name === "InsufficientInstanceCapacity") {
        console.log(chalk.italic`Not enough capacity in ${az}, trying next...`);
        continue;
      }
      throw e;
    }
  }
  throw new Error("No instance capacity in any AZ available");
}

run(main);
