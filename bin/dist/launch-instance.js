"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_ec2_1 = require("@aws-sdk/client-ec2");
const chalk_1 = __importDefault(require("chalk"));
const p_map_1 = __importDefault(require("p-map"));
const remeda_1 = require("remeda");
const yargs_1 = __importDefault(require("yargs"));
const run_1 = require("./utils/run");
const ssh_1 = require("./utils/ssh");
const wait_1 = require("./utils/wait");
const INSTANCE_TYPES = {
    production: "t2.large",
    staging: "t2.medium",
};
const KEY_NAME = "ops";
const IMAGE_ID = "ami-039568cfe87f2d860";
const KMS_KEY_ID = "acf1d245-abe5-4ff8-a490-09dba3834c45";
const SECURITY_GROUP_IDS = {
    production: ["sg-078abc8a772035e7a"],
    staging: ["sg-083d7b4facd31a090"],
};
const REGION = "eu-central-1";
const ENHANCED_MONITORING = true;
const HOME_DIR = "/home/ec2-user";
const OPS_DIR = `${HOME_DIR}/parallel/ops/prod`;
const AVAILABILITY_ZONES = (0, remeda_1.range)(0, 9)
    .map((i) => `${REGION}${["a", "b", "c"][i % 3]}`)
    .reverse();
const SUBNET_ID = {
    "eu-central-1a": "subnet-d3cc68b9",
    "eu-central-1b": "subnet-77f2e10a",
    "eu-central-1c": "subnet-eb22c4a7",
};
const numInstances = {
    production: 2,
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
    const image = await ec2
        .send(new client_ec2_1.DescribeImagesCommand({
        ImageIds: [IMAGE_ID],
    }))
        .then((res) => res.Images[0]);
    (0, p_map_1.default)((0, remeda_1.range)(0, numInstances[env]), async (i) => {
        const name = `parallel-${env}-${commit}-${i + 1}`;
        const result = await (async () => {
            while (AVAILABILITY_ZONES.length > 0) {
                const az = AVAILABILITY_ZONES.pop();
                try {
                    console.log((0, chalk_1.default) `Launching instance in ${az}...`);
                    return await ec2.send(new client_ec2_1.RunInstancesCommand({
                        ImageId: IMAGE_ID,
                        KeyName: KEY_NAME,
                        SecurityGroupIds: SECURITY_GROUP_IDS[env],
                        IamInstanceProfile: {
                            Name: `parallel-server-${env}`,
                        },
                        InstanceType: INSTANCE_TYPES[env],
                        Placement: {
                            AvailabilityZone: az,
                            Tenancy: client_ec2_1.Tenancy.default,
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
                                    SnapshotId: image.BlockDeviceMappings[0].Ebs.SnapshotId,
                                },
                            },
                        ],
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
                }
                catch (e) {
                    if (e instanceof client_ec2_1.EC2ServiceException && e.name === "InsufficientInstanceCapacity") {
                        console.log((0, chalk_1.default) `Not enough capacity in ${az}, trying next...`);
                        continue;
                    }
                    throw e;
                }
            }
            throw new Error("No AZ available");
        })();
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
        await (0, ssh_1.copyToRemoteServer)(ipAddress, `${OPS_DIR}/bootstrap.sh`, `${HOME_DIR}/`);
        await (0, ssh_1.executeRemoteCommand)(ipAddress, `${HOME_DIR}/bootstrap.sh`);
    }, { concurrency: 4 });
}
(0, run_1.run)(main);
async function waitForInstance(ipAddress) {
    await (0, wait_1.waitFor)(async () => {
        try {
            await (0, ssh_1.pingSsh)(ipAddress);
            return true;
        }
        catch {
            return false;
        }
    }, (0, chalk_1.default) `SSH not available. Waiting 5 more seconds...`, 5000);
}
