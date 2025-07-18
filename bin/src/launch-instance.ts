import { CloudWatchClient, PutMetricAlarmCommand } from "@aws-sdk/client-cloudwatch";
import {
  DescribeImagesCommand,
  EC2Client,
  EC2ServiceException,
  HttpTokensState,
  InstanceMetadataEndpointState,
  InstanceMetadataTagsState,
  ResourceType,
  Tenancy,
  _InstanceType,
} from "@aws-sdk/client-ec2";
import chalk from "chalk";
import pMap from "p-map";
import { range } from "remeda";
import { assert } from "ts-essentials";
import yargs from "yargs";
import { run } from "./utils/run";
import { copyToRemoteServer, executeRemoteCommand } from "./utils/ssh";
import { withInstance } from "./utils/withInstance";

type Environment = "staging" | "production";

const INSTANCE_TYPES = {
  production: "t3.large",
  staging: "t3.large",
} satisfies Record<Environment, _InstanceType>;
const KEY_NAME = "ops";
const IMAGE_ID = "ami-0656a4c2f92e25837";
const KMS_KEY_ID = "acf1d245-abe5-4ff8-a490-09dba3834c45";
const SECURITY_GROUP_IDS = {
  production: ["sg-078abc8a772035e7a"],
  staging: ["sg-0235d45780bc85002"],
} satisfies Record<Environment, string[]>;
const HOME_DIR = "/home/ec2-user";
const OPS_DIR = `${HOME_DIR}/parallel/ops/prod`;

const SUBNET_ID = {
  production: {
    "eu-central-1a": "subnet-d3cc68b9",
    "eu-central-1b": "subnet-77f2e10a",
    "eu-central-1c": "subnet-eb22c4a7",
  },
  staging: {
    "eu-central-1a": "subnet-0324d190a292cbcdb",
    "eu-central-1b": "subnet-001192e72de4dd2ca",
  },
} as const;

const NUM_INSTANCES = {
  production: 3,
  staging: 1,
};

const ec2 = new EC2Client({});
const cw = new CloudWatchClient({});

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
      choices: ["staging", "production"] satisfies Environment[],
      description: "The environment for the build",
    }).argv;

  // redundant make sure the user is deploying on the intended environment
  assert(env === process.env.ENV, "env mismatch");

  const commit = _commit.slice(0, 7);
  const image = await ec2
    .send(
      new DescribeImagesCommand({
        ImageIds: [IMAGE_ID],
      }),
    )
    .then((res) => res.Images![0]);

  const azs = range(0, 3).flatMap(() => Object.keys(SUBNET_ID[env]));
  await pMap(
    range(0, NUM_INSTANCES[env]),
    async (i) => {
      const name = `parallel-${env}-${commit}-${i + 1}`;
      while (azs.length > 0) {
        const az = azs.shift()!;
        const subnet = (SUBNET_ID as any)[env][az];
        try {
          console.log(chalk`Launching instance in ${az}...`);
          await withInstance(
            ec2,
            {
              ImageId: IMAGE_ID,
              KeyName: KEY_NAME,
              IamInstanceProfile: {
                Name: `parallel-server-${env}`,
              },
              InstanceType: INSTANCE_TYPES[env],
              Placement: {
                AvailabilityZone: az,
                Tenancy: Tenancy.default,
              },
              NetworkInterfaces: [
                {
                  DeviceIndex: 0,
                  AssociatePublicIpAddress: true,
                  SubnetId: subnet,
                  Groups: SECURITY_GROUP_IDS[env],
                },
              ],
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
                Enabled: true,
              },
              TagSpecifications: [
                {
                  ResourceType: ResourceType.volume,
                  Tags: [{ Key: "Name", Value: name }],
                },
                {
                  ResourceType: ResourceType.instance,
                  Tags: [
                    { Key: "App", Value: "server" },
                    { Key: "Name", Value: name },
                    { Key: "Release", Value: commit },
                    { Key: "Environment", Value: env },
                    { Key: "InstanceNumber", Value: `${i + 1}` },
                    { Key: "MalwareScan", Value: `${env === "production"}` },
                  ],
                },
              ],
              MetadataOptions: {
                HttpEndpoint: InstanceMetadataEndpointState.enabled,
                HttpTokens: HttpTokensState.required,
                InstanceMetadataTags: InstanceMetadataTagsState.enabled,
                HttpPutResponseHopLimit: 1,
              },
            },
            async ({ instanceId, ipAddress }, { signal }) => {
              console.log(chalk`Uploading install script to {bold ${instanceId}}.`);
              await copyToRemoteServer(ipAddress, `${OPS_DIR}/bootstrap.sh`, `${HOME_DIR}/`, {
                signal,
              });
              await executeRemoteCommand(ipAddress, `${HOME_DIR}/bootstrap.sh`, {
                signal,
              });
              for (const alarm of [
                // CPU over 60% for 5 consecutive minutes
                { Period: 60, EvaluationPeriods: 5, DatapointsToAlarm: 5, Threshold: 60.0 },
                // CPU over 90% for 2 minutes
                { Period: 60, EvaluationPeriods: 2, DatapointsToAlarm: 2, Threshold: 90.0 },
              ]) {
                await cw.send(
                  new PutMetricAlarmCommand({
                    AlarmName: `${name}-cpu-${alarm.DatapointsToAlarm}m`,
                    MetricName: "CPUUtilization",
                    Namespace: "AWS/EC2",
                    Statistic: "Average",
                    Dimensions: [{ Name: "InstanceId", Value: instanceId }],
                    ComparisonOperator: "GreaterThanThreshold",
                    TreatMissingData: "missing",
                    ActionsEnabled: true,
                    OKActions: [],
                    AlarmActions: ["arn:aws:sns:eu-central-1:749273139513:ops-alarms"],
                    ...alarm,
                  }),
                );
              }
            },
            { terminate: false },
          );
          return;
        } catch (e) {
          if (e instanceof EC2ServiceException && e.name === "InsufficientInstanceCapacity") {
            console.log(chalk`Not enough capacity in ${az}, trying next...`);
            continue;
          }
          throw e;
        }
      }
      throw new Error("No instance capacity in any AZ available");
    },
    { concurrency: 4 },
  );
}

run(main);
