"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_ec2_1 = require("@aws-sdk/client-ec2");
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const p_map_1 = __importDefault(require("p-map"));
const remeda_1 = require("remeda");
const yargs_1 = __importDefault(require("yargs"));
const run_1 = require("./utils/run");
const wait_1 = require("./utils/wait");
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
const ec2 = new client_ec2_1.EC2Client({});
async function main() {
    const { commit: _commit, env: _env } = await yargs_1.default
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
    const env = _env;
    (0, p_map_1.default)((0, remeda_1.range)(0, numInstances[env]), async (i) => {
        const name = `parallel-${env}-${commit}-${i + 1}`;
        const result = await ec2.send(new client_ec2_1.RunInstancesCommand({
            ImageId: IMAGE_ID,
            KeyName: KEY_NAME,
            SecurityGroupIds: SECURITY_GROUP_IDS[env],
            IamInstanceProfile: {
                Name: `parallel-server-${env}`,
            },
            InstanceType: INSTANCE_TYPES[env],
            Placement: {
                AvailabilityZone: AVAILABILITY_ZONES[i % AVAILABILITY_ZONES.length],
                Tenancy: client_ec2_1.Tenancy.default,
            },
            SubnetId: SUBNET_ID,
            MaxCount: 1,
            MinCount: 1,
            Monitoring: {
                Enabled: ENHANCED_MONITORING,
            },
            TagSpecifications: [
                {
                    ResourceType: client_ec2_1.ResourceType.volume,
                    Tags: [{ Key: "Name", Value: name }],
                },
                {
                    ResourceType: client_ec2_1.ResourceType.instance,
                    Tags: [
                        { Key: "Name", Value: name },
                        { Key: "Release", Value: commit },
                        { Key: "Environment", Value: env },
                        { Key: "InstanceNumber", Value: `${i + 1}` },
                    ],
                },
            ],
            MetadataOptions: {
                HttpEndpoint: client_ec2_1.InstanceMetadataEndpointState.enabled,
                HttpTokens: client_ec2_1.HttpTokensState.required,
                InstanceMetadataTags: client_ec2_1.InstanceMetadataTagsState.enabled,
            },
        }));
        const instance = result.Instances[0];
        const instanceId = instance.InstanceId;
        const ipAddress = instance.PrivateIpAddress;
        console.log((0, chalk_1.default) `Launched instance {bold ${instanceId}} on {bold ${ipAddress}}`);
        await (0, wait_1.wait)(5000);
        await (0, wait_1.waitFor)(async () => {
            var _a, _b, _c;
            const result = await ec2.send(new client_ec2_1.DescribeInstanceStatusCommand({ InstanceIds: [instanceId] }));
            return ((_c = (_b = (_a = result.InstanceStatuses) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.InstanceState) === null || _c === void 0 ? void 0 : _c.Name) === client_ec2_1.InstanceStateName.running;
        }, (0, chalk_1.default) `Instance {bold ${instanceId}} {yellow pending}. Waiting 10 more seconds...`, 10000);
        console.log((0, chalk_1.default) `Instance {bold ${instanceId}} {green ✓ running}`);
        await waitForInstance(ipAddress);
        console.log((0, chalk_1.default) `Uploading install script to {bold ${instanceId}}.`);
        copyToRemoteServer(ipAddress, `${OPS_DIR}/bootstrap.sh`, `${HOME_DIR}/`);
        executeRemoteCommand(ipAddress, `${HOME_DIR}/bootstrap.sh`);
    }, { concurrency: 4 });
}
(0, run_1.run)(main);
async function waitForInstance(ipAddress) {
    await (0, wait_1.waitFor)(async () => {
        try {
            (0, child_process_1.execSync)(`ssh \
            -o ConnectTimeout=1 \
            -o "UserKnownHostsFile=/dev/null" \
            -o StrictHostKeyChecking=no \
            ec2-user@${ipAddress} true >/dev/null 2>&1`);
            return true;
        }
        catch {
            return false;
        }
    }, (0, chalk_1.default) `SSH not available. Waiting 5 more seconds...`, 5000);
}
function executeRemoteCommand(ipAddress, command) {
    (0, child_process_1.execSync)(`ssh \
  -o "UserKnownHostsFile=/dev/null" \
  -o StrictHostKeyChecking=no \
  ${ipAddress} ${command}`);
}
function copyToRemoteServer(ipAddress, from, to) {
    (0, child_process_1.execSync)(`scp \
  -o "UserKnownHostsFile=/dev/null" \
  -o StrictHostKeyChecking=no \
  ${from} ${ipAddress}:${to}`);
}
