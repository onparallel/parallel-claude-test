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
import { isNullish, range } from "remeda";
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
const KMS_KEY_ID = "acf1d245-abe5-4ff8-a490-09dba3834c45";
const AVAILABILITY_ZONE = `eu-central-1a`;
const SUBNET_ID = { production: "subnet-d3cc68b9", staging: "subnet-0324d190a292cbcdb" };
const ENHANCED_MONITORING = true;
const YARN_CACHE_VOLUMES = ["vol-0d498fe71cba530de", "vol-02eb0c410dd9891c6"];

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
  await withInstance(
    ec2,
    {
      ImageId: BUILDER_IMAGE_ID,
      KeyName: KEY_NAME,
      InstanceType: INSTANCE_TYPE,
      Placement: {
        AvailabilityZone: AVAILABILITY_ZONE,
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
          SubnetId: SUBNET_ID[env],
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
      for (const retry of range(0, 2)) {
        try {
          console.log(chalk.italic`Trying to use ${YARN_CACHE_VOLUMES[retry]} as cache...`);
          const res = await ec2.send(
            new AttachVolumeCommand({
              InstanceId: instanceId,
              VolumeId: YARN_CACHE_VOLUMES[retry],
              Device: "/dev/xvdy",
            }),
          );
          volumeId = res.VolumeId!;
          break;
        } catch (e) {
          if (e instanceof EC2ServiceException && e.name === "VolumeInUse") {
            console.log(chalk.italic`${YARN_CACHE_VOLUMES[retry]} in use!`);
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
}

run(main);
