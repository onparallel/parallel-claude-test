import {
  CreateImageCommand,
  DescribeImagesCommand,
  DescribeInstancesCommand,
  EC2Client,
  HttpTokensState,
  ImageState,
  InstanceMetadataEndpointState,
  InstanceStateName,
  ResourceType,
  RunInstancesCommand,
  Tenancy,
  TerminateInstancesCommand,
} from "@aws-sdk/client-ec2";
import chalk from "chalk";
import { execSync } from "child_process";
import path from "path";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import yargs from "yargs";
import { run } from "./utils/run";
import { timestamp } from "./utils/timestamp";
import { wait, waitFor } from "./utils/wait";

const INSTANCE_TYPE = "t3.large";
const KEY_NAME = "ops";
const SECURITY_GROUP_IDS = ["sg-0a7b2cbb5cd5e9020"];
const KMS_KEY_ID = "acf1d245-abe5-4ff8-a490-09dba3834c45";
const SUBNET_ID = "subnet-d3cc68b9";
const REGION = "eu-central-1";
const AVAILABILITY_ZONE = `${REGION}a`;
const ENHANCED_MONITORING = true;

const ec2 = new EC2Client({});

const AMI_NAMES = {
  server: () => `parallel-server-${timestamp()}`,
  builder: () => `parallel-builder-${timestamp()}`,
};

async function main() {
  const { image } = await yargs.usage("Usage: $0 --image [image]").option("image", {
    demandOption: true,
    required: true,
    choices: Object.keys(AMI_NAMES) as (keyof typeof AMI_NAMES)[],
    description: "The environment for the build",
  }).argv;
  const name = AMI_NAMES[image!]();
  const instanceResult = await ec2.send(
    new RunInstancesCommand({
      ImageId: "resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64",
      KeyName: KEY_NAME,
      SecurityGroupIds: SECURITY_GROUP_IDS,
      InstanceType: INSTANCE_TYPE,
      Placement: {
        AvailabilityZone: AVAILABILITY_ZONE,
        Tenancy: Tenancy.default,
      },
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
          },
        },
      ],
      TagSpecifications: [
        { ResourceType: ResourceType.instance, Tags: [{ Key: "Name", Value: `image-${name}` }] },
        { ResourceType: ResourceType.volume, Tags: [{ Key: "Name", Value: `image-${name}` }] },
      ],
      MetadataOptions: {
        HttpEndpoint: InstanceMetadataEndpointState.enabled,
        HttpTokens: HttpTokensState.required,
      },
    }),
  );
  const instanceId = instanceResult.Instances![0].InstanceId!;
  console.log(chalk`Launched instance {bold ${instanceId}}`);
  try {
    await wait(5_000);
    let ipAddress: string | undefined;
    await waitFor(
      async () => {
        const result = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
        const instance = result.Reservations?.[0].Instances?.[0];
        const isRunning = instance?.State?.Name === InstanceStateName.running;
        if (isRunning) {
          ipAddress = instance!.PublicIpAddress;
        }
        return isRunning;
      },
      chalk.italic`Instance {yellow pending}. Waiting 10 more seconds...`,
      10_000,
    );
    assert(isNonNullish(ipAddress));
    console.log(chalk`Instance {green ✓ running}`);
    await waitForInstance(ipAddress);
    console.log("Uploading build script to the new instance.");
    execSync(
      `scp \
          -i ~/.ssh/ops.pem \
          -o "UserKnownHostsFile=/dev/null" \
          -o "StrictHostKeyChecking=no" \
          ${path.resolve(
            __dirname,
            `../../ops/prod/image/build-image-${image}.sh`,
          )} ec2-user@${ipAddress}:~`,
      { stdio: "inherit" },
    );
    execSync(
      `scp \
          -i ~/.ssh/ops.pem \
          -o "UserKnownHostsFile=/dev/null" \
          -o "StrictHostKeyChecking=no" \
          ${path.resolve(
            __dirname,
            `../../ops/prod/image/authorized_keys`,
          )} ec2-user@${ipAddress}:~`,
      { stdio: "inherit" },
    );
    console.log("Executing build script.");
    execSync(
      `ssh \
          -i ~/.ssh/ops.pem \
          -o "UserKnownHostsFile=/dev/null" \
          -o StrictHostKeyChecking=no \
          ec2-user@${ipAddress} /home/ec2-user/build-image-${image}.sh ${name}`,
      { stdio: "inherit" },
    );

    console.log("Creating Image.");
    const createImageResult = await ec2.send(
      new CreateImageCommand({
        InstanceId: instanceId,
        Name: name,
        TagSpecifications: [
          { ResourceType: ResourceType.image, Tags: [{ Key: "Name", Value: name }] },
          { ResourceType: ResourceType.snapshot, Tags: [{ Key: "Name", Value: name }] },
        ],
      }),
    );
    const imageId = createImageResult.ImageId!;
    console.log(chalk.green`Image created: ${imageId}`);
    await waitFor(
      async () => {
        const result = await ec2.send(
          new DescribeImagesCommand({
            ImageIds: [imageId],
          }),
        );
        const imageState = result.Images?.[0].State;
        if (
          ([ImageState.available, ImageState.pending] as ImageState[]).includes(
            imageState as ImageState,
          )
        ) {
          return imageState === ImageState.available;
        } else {
          throw new Error(`Error creating image ${imageId}, state: ${imageState}`);
        }
      },
      chalk.italic`Waiting for image to become available...`,
      30_000,
    );
    console.log(chalk.green`Image ID: ${imageId}`);
  } finally {
    await ec2.send(
      new TerminateInstancesCommand({
        InstanceIds: [instanceId],
      }),
    );
  }
}

run(main);

async function waitForInstance(ipAddress: string) {
  await waitFor(
    async () => {
      try {
        execSync(
          `ssh \
            -i ~/.ssh/ops.pem \
            -o ConnectTimeout=1 \
            -o "UserKnownHostsFile=/dev/null" \
            -o StrictHostKeyChecking=no \
            ec2-user@${ipAddress} true >/dev/null 2>&1`,
        );
        return true;
      } catch {
        return false;
      }
    },
    chalk.italic`SSH not available. Waiting 5 more seconds...`,
    5_000,
  );
}
