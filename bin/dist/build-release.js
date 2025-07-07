"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_ec2_1 = require("@aws-sdk/client-ec2");
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const remeda_1 = require("remeda");
const ts_essentials_1 = require("ts-essentials");
const yargs_1 = __importDefault(require("yargs"));
const run_1 = require("./utils/run");
const ssh_1 = require("./utils/ssh");
const stopwatch_1 = require("./utils/stopwatch");
const timestamp_1 = require("./utils/timestamp");
const wait_1 = require("./utils/wait");
const withInstance_1 = require("./utils/withInstance");
const WORK_DIR = "/home/ec2-user";
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
    const { commit: _commit, env, force, terminate, } = await yargs_1.default
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
    (0, ts_essentials_1.assert)(env === process.env.ENV, "env mismatch");
    const ec2 = new client_ec2_1.EC2Client({});
    const commit = _commit.slice(0, 7);
    const buildId = `parallel-${env}-${commit}`;
    const artifactName = `${buildId}.tar.gz`;
    const bucketName = `parallel-builds-${env}`;
    const artifactPath = `${bucketName}/${artifactName}`;
    if (!force) {
        try {
            (0, child_process_1.execSync)(`aws s3 ls ${artifactPath}`, { cwd: WORK_DIR, encoding: "utf-8" });
            console.log(chalk_1.default.green `Build already exists. Skipping. To force build run build-release with --force or full-release with --force-build`);
            return;
        }
        catch { }
    }
    const name = `builder-${(0, timestamp_1.timestamp)()}`;
    const image = await ec2
        .send(new client_ec2_1.DescribeImagesCommand({
        ImageIds: [BUILDER_IMAGE_ID],
    }))
        .then((res) => res.Images[0]);
    await (0, withInstance_1.withInstance)(ec2, {
        ImageId: BUILDER_IMAGE_ID,
        KeyName: KEY_NAME,
        InstanceType: INSTANCE_TYPE,
        Placement: {
            AvailabilityZone: AVAILABILITY_ZONE,
            Tenancy: client_ec2_1.Tenancy.default,
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
                    SnapshotId: image.BlockDeviceMappings[0].Ebs.SnapshotId,
                },
            },
        ],
        TagSpecifications: [
            { ResourceType: client_ec2_1.ResourceType.instance, Tags: [{ Key: "Name", Value: name }] },
            { ResourceType: client_ec2_1.ResourceType.volume, Tags: [{ Key: "Name", Value: name }] },
        ],
        MetadataOptions: {
            HttpEndpoint: client_ec2_1.InstanceMetadataEndpointState.enabled,
            HttpTokens: client_ec2_1.HttpTokensState.required,
        },
    }, async ({ instanceId, ipAddress }, { signal }) => {
        let volumeId;
        for (const retry of (0, remeda_1.range)(0, 2)) {
            try {
                console.log(chalk_1.default.italic `Trying to use ${YARN_CACHE_VOLUMES[retry]} as cache...`);
                const res = await ec2.send(new client_ec2_1.AttachVolumeCommand({
                    InstanceId: instanceId,
                    VolumeId: YARN_CACHE_VOLUMES[retry],
                    Device: "/dev/xvdy",
                }));
                volumeId = res.VolumeId;
                break;
            }
            catch (e) {
                if (e instanceof client_ec2_1.EC2ServiceException && e.name === "VolumeInUse") {
                    console.log(chalk_1.default.italic `${YARN_CACHE_VOLUMES[retry]} in use!`);
                }
                else {
                    throw e;
                }
            }
            signal.throwIfAborted();
        }
        if ((0, remeda_1.isNullish)(volumeId)) {
            throw new Error("All yarn cache volumes are in use");
        }
        await (0, wait_1.waitForResult)(async () => {
            var _a, _b, _c;
            const result = await ec2.send(new client_ec2_1.DescribeVolumesCommand({ VolumeIds: [volumeId] }));
            return (((_c = (_b = (_a = result.Volumes) === null || _a === void 0 ? void 0 : _a[0].Attachments) === null || _b === void 0 ? void 0 : _b.find((a) => a.InstanceId === instanceId)) === null || _c === void 0 ? void 0 : _c.State) ===
                client_ec2_1.VolumeAttachmentState.attached);
        }, {
            message: chalk_1.default.italic `Volume attaching {yellow pending}. Waiting 3 more seconds...`,
            signal,
            delay: 3000,
        });
        console.log("Uploading build script to the new instance.");
        await (0, ssh_1.copyToRemoteServer)(ipAddress, path_1.default.resolve(__dirname, `../../ops/prod/build-release.sh`), "~", { signal });
        console.log("Executing build script.");
        const { time } = await (0, stopwatch_1.withStopwatch)(async () => {
            await (0, ssh_1.executeRemoteCommand)(ipAddress, `'/home/ec2-user/build-release.sh ${commit} ${env}'`, { signal });
        });
        console.log(chalk_1.default.green `Build sucessful after ${Math.round(time / 1000)} seconds.`);
    }, { terminate });
}
(0, run_1.run)(main);
