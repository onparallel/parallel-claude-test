"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_cloudwatch_1 = require("@aws-sdk/client-cloudwatch");
const client_ec2_1 = require("@aws-sdk/client-ec2");
const chalk_1 = __importDefault(require("chalk"));
const p_map_1 = __importDefault(require("p-map"));
const remeda_1 = require("remeda");
const ts_essentials_1 = require("ts-essentials");
const yargs_1 = __importDefault(require("yargs"));
const run_1 = require("./utils/run");
const ssh_1 = require("./utils/ssh");
const withInstance_1 = require("./utils/withInstance");
const INSTANCE_TYPES = {
    production: "t3.large",
    staging: "t3.large",
};
const KEY_NAME = "ops";
const IMAGE_ID = "ami-08b27c8d9d250ae71";
const KMS_KEY_ID = "acf1d245-abe5-4ff8-a490-09dba3834c45";
const SECURITY_GROUP_IDS = {
    production: ["sg-078abc8a772035e7a"],
    staging: ["sg-0235d45780bc85002"],
};
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
};
const NUM_INSTANCES = {
    production: 3,
    staging: 1,
};
const ec2 = new client_ec2_1.EC2Client({});
const cw = new client_cloudwatch_1.CloudWatchClient({});
async function main() {
    const { commit: _commit, env } = await yargs_1.default
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
    // redundant make sure the user is deploying on the intended environment
    (0, ts_essentials_1.assert)(env === process.env.ENV, "env mismatch");
    const commit = _commit.slice(0, 7);
    const image = await ec2
        .send(new client_ec2_1.DescribeImagesCommand({
        ImageIds: [IMAGE_ID],
    }))
        .then((res) => res.Images[0]);
    const azs = (0, remeda_1.range)(0, 3).flatMap(() => Object.keys(SUBNET_ID[env]));
    await (0, p_map_1.default)((0, remeda_1.range)(0, NUM_INSTANCES[env]), async (i) => {
        const name = `parallel-${env}-${commit}-${i + 1}`;
        while (azs.length > 0) {
            const az = azs.shift();
            const subnet = SUBNET_ID[env][az];
            try {
                console.log((0, chalk_1.default) `Launching instance in ${az}...`);
                await (0, withInstance_1.withInstance)(ec2, {
                    ImageId: IMAGE_ID,
                    KeyName: KEY_NAME,
                    IamInstanceProfile: {
                        Name: `parallel-server-${env}`,
                    },
                    InstanceType: INSTANCE_TYPES[env],
                    Placement: {
                        AvailabilityZone: az,
                        Tenancy: client_ec2_1.Tenancy.default,
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
                                SnapshotId: image.BlockDeviceMappings[0].Ebs.SnapshotId,
                            },
                        },
                    ],
                    Monitoring: {
                        Enabled: true,
                    },
                    TagSpecifications: [
                        {
                            ResourceType: client_ec2_1.ResourceType.volume,
                            Tags: [{ Key: "Name", Value: name }],
                        },
                        {
                            ResourceType: client_ec2_1.ResourceType.instance,
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
                        HttpEndpoint: client_ec2_1.InstanceMetadataEndpointState.enabled,
                        HttpTokens: client_ec2_1.HttpTokensState.required,
                        InstanceMetadataTags: client_ec2_1.InstanceMetadataTagsState.enabled,
                        HttpPutResponseHopLimit: 1,
                    },
                }, async ({ instanceId, ipAddress }, { signal }) => {
                    console.log((0, chalk_1.default) `Uploading install script to {bold ${instanceId}}.`);
                    await (0, ssh_1.copyToRemoteServer)(ipAddress, `${OPS_DIR}/bootstrap.sh`, `${HOME_DIR}/`, {
                        signal,
                    });
                    await (0, ssh_1.executeRemoteCommand)(ipAddress, `${HOME_DIR}/bootstrap.sh`, {
                        signal,
                    });
                    for (const alarm of [
                        // CPU over 60% for 5 consecutive minutes
                        { Period: 60, EvaluationPeriods: 5, DatapointsToAlarm: 5, Threshold: 60.0 },
                        // CPU over 90% for 2 minutes
                        { Period: 60, EvaluationPeriods: 2, DatapointsToAlarm: 2, Threshold: 90.0 },
                    ]) {
                        await cw.send(new client_cloudwatch_1.PutMetricAlarmCommand({
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
                        }));
                    }
                }, { terminate: false });
                return;
            }
            catch (e) {
                if (e instanceof client_ec2_1.EC2ServiceException && e.name === "InsufficientInstanceCapacity") {
                    console.log((0, chalk_1.default) `Not enough capacity in ${az}, trying next...`);
                    continue;
                }
                throw e;
            }
        }
        throw new Error("No instance capacity in any AZ available");
    }, { concurrency: 4 });
}
(0, run_1.run)(main);
