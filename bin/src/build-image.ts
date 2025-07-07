import {
  CreateImageCommand,
  DescribeImagesCommand,
  EC2Client,
  HttpTokensState,
  ImageState,
  InstanceMetadataEndpointState,
  ResourceType,
  Tenancy,
} from "@aws-sdk/client-ec2";
import chalk from "chalk";
import path from "path";
import yargs from "yargs";
import { run } from "./utils/run";
import { copyToRemoteServer, executeRemoteCommand } from "./utils/ssh";
import { timestamp } from "./utils/timestamp";
import { waitForResult } from "./utils/wait";
import { withInstance } from "./utils/withInstance";

const INSTANCE_TYPE = "t3.large";
const KEY_NAME = "build-image";
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
  await withInstance(
    ec2,
    {
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
    },
    async ({ instanceId, ipAddress }, { signal }) => {
      console.log("Uploading build script to the new instance.");
      await copyToRemoteServer(
        ipAddress,
        path.resolve(__dirname, `../../ops/prod/image/build-image-${image}.sh`),
        "~",
        { keyPath: "~/.ssh/build-image.pem", signal },
      );
      await copyToRemoteServer(
        ipAddress,
        path.resolve(__dirname, `../../ops/prod/image/authorized_keys`),
        "~",
        { keyPath: "~/.ssh/build-image.pem", signal },
      );
      console.log("Executing build script.");
      await executeRemoteCommand(ipAddress, `/home/ec2-user/build-image-${image}.sh ${name}`, {
        keyPath: "~/.ssh/build-image.pem",
        signal,
      });

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
      await waitForResult(
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
        {
          message: chalk.italic`Waiting for image to become available...`,
          delay: 30_000,
          signal,
        },
      );
      console.log(chalk.green`Image ID: ${imageId}`);
    },
    { keyPath: "~/.ssh/build-image.pem" },
  );
}

run(main);
