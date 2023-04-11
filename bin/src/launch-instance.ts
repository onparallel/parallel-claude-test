import {
  DescribeInstanceStatusCommand,
  EC2Client,
  HttpTokensState,
  InstanceMetadataEndpointState,
  InstanceMetadataTagsState,
  InstanceStateName,
  ResourceType,
  RunInstancesCommand,
  Tenancy,
} from "@aws-sdk/client-ec2";
import chalk from "chalk";
import { execSync } from "child_process";
import pMap from "p-map";
import { range } from "remeda";
import yargs from "yargs";
import { run } from "./utils/run";
import { wait, waitFor } from "./utils/wait";

const INSTANCE_TYPES = {
  production: "t2.large",
  staging: "t2.medium",
};
const KEY_NAME = "ops";
const IMAGE_ID = "ami-0e024d60e45009eec";
const SECURITY_GROUP_IDS = {
  production: ["sg-078abc8a772035e7a"],
  staging: ["sg-083d7b4facd31a090"],
};
const SUBNET_ID = "subnet-d3cc68b9";
const REGION = "eu-central-1";
const ENHANCED_MONITORING = true;
const HOME_DIR = "/home/ec2-user";
const OPS_DIR = `${HOME_DIR}/parallel/ops/prod`;

const AVAILABILITY_ZONES = [`${REGION}a`, `${REGION}b`, `${REGION}c`];
const numInstances = {
  production: 1,
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

  pMap(
    range(0, numInstances[env]),
    async (i) => {
      const name = `parallel-${env}-${commit}-${i + 1}`;
      const result = await ec2.send(
        new RunInstancesCommand({
          ImageId: IMAGE_ID,
          KeyName: KEY_NAME,
          SecurityGroupIds: SECURITY_GROUP_IDS[env],
          IamInstanceProfile: {
            Name: `parallel-server-${env}`,
          },
          InstanceType: INSTANCE_TYPES[env],
          Placement: {
            AvailabilityZone: AVAILABILITY_ZONES[i % AVAILABILITY_ZONES.length],
            Tenancy: Tenancy.default,
          },
          SubnetId: SUBNET_ID,
          MaxCount: 1,
          MinCount: 1,
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
        })
      );
      const instance = result.Instances![0];
      const instanceId = instance.InstanceId!;
      const ipAddress = instance.PrivateIpAddress!;
      console.log(chalk`Launched instance {bold ${instanceId}} on {bold ${ipAddress}}`);
      await wait(5000);
      await waitFor(
        async () => {
          const result = await ec2.send(
            new DescribeInstanceStatusCommand({ InstanceIds: [instanceId] })
          );
          return result.InstanceStatuses?.[0]?.InstanceState?.Name === InstanceStateName.running;
        },
        chalk`Instance {bold ${instanceId}} {yellow pending}. Waiting 10 more seconds...`,
        10000
      );
      console.log(chalk`Instance {bold ${instanceId}} {green ✓ running}`);
      await waitForInstance(ipAddress);

      console.log(chalk`Uploading install script to {bold ${instanceId}}.`);
      copyToRemoteServer(ipAddress, `${OPS_DIR}/bootstrap.sh`, `${HOME_DIR}/`);
      executeRemoteCommand(ipAddress, `${HOME_DIR}/bootstrap.sh`);
    },
    { concurrency: 4 }
  );
}

run(main);

async function waitForInstance(ipAddress: string) {
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
}

function executeRemoteCommand(ipAddress: string, command: string) {
  execSync(`ssh \
  -o "UserKnownHostsFile=/dev/null" \
  -o StrictHostKeyChecking=no \
  ${ipAddress} ${command}`);
}

function copyToRemoteServer(ipAddress: string, from: string, to: string) {
  execSync(`scp \
  -o "UserKnownHostsFile=/dev/null" \
  -o StrictHostKeyChecking=no \
  ${from} ${ipAddress}:${to}`);
}
