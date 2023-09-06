import {
  DescribeImagesCommand,
  DescribeInstanceStatusCommand,
  EC2Client,
  EC2ServiceException,
  HttpTokensState,
  InstanceMetadataEndpointState,
  InstanceMetadataTagsState,
  InstanceStateName,
  ResourceType,
  RunInstancesCommand,
  Tenancy,
} from "@aws-sdk/client-ec2";
import chalk from "chalk";
import pMap from "p-map";
import { range } from "remeda";
import yargs from "yargs";
import { run } from "./utils/run";
import { copyToRemoteServer, executeRemoteCommand, pingSsh } from "./utils/ssh";
import { wait, waitFor } from "./utils/wait";

const INSTANCE_TYPES = {
  production: "t2.large",
  staging: "t2.medium",
};
const KEY_NAME = "ops";
const IMAGE_ID = "ami-024dba9efcf8e138d";
const KMS_KEY_ID = "acf1d245-abe5-4ff8-a490-09dba3834c45";
const SECURITY_GROUP_IDS = {
  production: ["sg-078abc8a772035e7a"],
  staging: ["sg-083d7b4facd31a090"],
};
const REGION = "eu-central-1";
const ENHANCED_MONITORING = true;
const HOME_DIR = "/home/ec2-user";
const OPS_DIR = `${HOME_DIR}/parallel/ops/prod`;

const AVAILABILITY_ZONES = range(0, 9)
  .map((i) => `${REGION}${(["a", "b", "c"] as const)[i % 3]}` as const)
  .reverse();
const SUBNET_ID = {
  "eu-central-1a": "subnet-d3cc68b9",
  "eu-central-1b": "subnet-77f2e10a",
  "eu-central-1c": "subnet-eb22c4a7",
};
const NUM_INSTANCES = {
  production: 2,
  staging: 1,
};

const ec2 = new EC2Client({});

async function main() {
  const { commit: _commit, env: _env } = await yargs
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
  const env = _env as "production" | "staging";
  const image = await ec2
    .send(
      new DescribeImagesCommand({
        ImageIds: [IMAGE_ID],
      }),
    )
    .then((res) => res.Images![0]);

  pMap(
    range(0, NUM_INSTANCES[env]),
    async (i) => {
      const name = `parallel-${env}-${commit}-${i + 1}`;
      const result = await (async () => {
        while (AVAILABILITY_ZONES.length > 0) {
          const az = AVAILABILITY_ZONES.pop()!;
          try {
            console.log(chalk`Launching instance in ${az}...`);
            return await ec2.send(
              new RunInstancesCommand({
                ImageId: IMAGE_ID,
                KeyName: KEY_NAME,
                SecurityGroupIds: SECURITY_GROUP_IDS[env],
                IamInstanceProfile: {
                  Name: `parallel-server-${env}`,
                },
                InstanceType: INSTANCE_TYPES[env],
                Placement: {
                  AvailabilityZone: az,
                  Tenancy: Tenancy.default,
                },
                SubnetId: SUBNET_ID[az],
                MaxCount: 1,
                MinCount: 1,
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
                Monitoring: {
                  Enabled: ENHANCED_MONITORING,
                },
                TagSpecifications: [
                  {
                    ResourceType: ResourceType.volume,
                    Tags: [{ Key: "Name", Value: name }],
                  },
                  {
                    ResourceType: ResourceType.instance,
                    Tags: [
                      { Key: "Name", Value: name },
                      { Key: "Release", Value: commit },
                      { Key: "Environment", Value: env },
                      { Key: "InstanceNumber", Value: `${i + 1}` },
                    ],
                  },
                ],
                MetadataOptions: {
                  HttpEndpoint: InstanceMetadataEndpointState.enabled,
                  HttpTokens: HttpTokensState.required,
                  InstanceMetadataTags: InstanceMetadataTagsState.enabled,
                },
              }),
            );
          } catch (e) {
            if (e instanceof EC2ServiceException && e.name === "InsufficientInstanceCapacity") {
              console.log(chalk`Not enough capacity in ${az}, trying next...`);
              continue;
            }
            throw e;
          }
        }
        throw new Error("No AZ available");
      })();
      const instance = result.Instances![0];
      const instanceId = instance.InstanceId!;
      const ipAddress = instance.PrivateIpAddress!;
      console.log(chalk`Launched instance {bold ${instanceId}} on {bold ${ipAddress}}`);
      await wait(5000);
      await waitFor(
        async () => {
          const result = await ec2.send(
            new DescribeInstanceStatusCommand({ InstanceIds: [instanceId] }),
          );
          return result.InstanceStatuses?.[0]?.InstanceState?.Name === InstanceStateName.running;
        },
        chalk`Instance {bold ${instanceId}} {yellow pending}. Waiting 10 more seconds...`,
        10000,
      );
      console.log(chalk`Instance {bold ${instanceId}} {green ✓ running}`);
      await waitForInstance(ipAddress);

      console.log(chalk`Uploading install script to {bold ${instanceId}}.`);
      await copyToRemoteServer(ipAddress, `${OPS_DIR}/bootstrap.sh`, `${HOME_DIR}/`);
      await executeRemoteCommand(ipAddress, `${HOME_DIR}/bootstrap.sh`);
    },
    { concurrency: 4 },
  );
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
