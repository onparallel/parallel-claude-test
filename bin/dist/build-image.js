"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_ec2_1 = require("@aws-sdk/client-ec2");
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const yargs_1 = __importDefault(require("yargs"));
const run_1 = require("./utils/run");
const ssh_1 = require("./utils/ssh");
const timestamp_1 = require("./utils/timestamp");
const wait_1 = require("./utils/wait");
const withInstance_1 = require("./utils/withInstance");
const INSTANCE_TYPE = "t3.large";
const KEY_NAME = "build-image";
const SECURITY_GROUP_IDS = ["sg-0a7b2cbb5cd5e9020"];
const KMS_KEY_ID = "acf1d245-abe5-4ff8-a490-09dba3834c45";
const SUBNET_ID = "subnet-d3cc68b9";
const REGION = "eu-central-1";
const AVAILABILITY_ZONE = `${REGION}a`;
const ENHANCED_MONITORING = true;
const ec2 = new client_ec2_1.EC2Client({});
const AMI_NAMES = {
    server: () => `parallel-server-${(0, timestamp_1.timestamp)()}`,
    builder: () => `parallel-builder-${(0, timestamp_1.timestamp)()}`,
};
async function main() {
    const { image } = await yargs_1.default.usage("Usage: $0 --image [image]").option("image", {
        demandOption: true,
        required: true,
        choices: Object.keys(AMI_NAMES),
        description: "The environment for the build",
    }).argv;
    const name = AMI_NAMES[image]();
    await (0, withInstance_1.withInstance)(ec2, {
        ImageId: "resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64",
        KeyName: KEY_NAME,
        SecurityGroupIds: SECURITY_GROUP_IDS,
        InstanceType: INSTANCE_TYPE,
        Placement: {
            AvailabilityZone: AVAILABILITY_ZONE,
            Tenancy: client_ec2_1.Tenancy.default,
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
            { ResourceType: client_ec2_1.ResourceType.instance, Tags: [{ Key: "Name", Value: `image-${name}` }] },
            { ResourceType: client_ec2_1.ResourceType.volume, Tags: [{ Key: "Name", Value: `image-${name}` }] },
        ],
        MetadataOptions: {
            HttpEndpoint: client_ec2_1.InstanceMetadataEndpointState.enabled,
            HttpTokens: client_ec2_1.HttpTokensState.required,
        },
    }, async ({ instanceId, ipAddress }, { signal }) => {
        console.log("Uploading build script to the new instance.");
        await (0, ssh_1.copyToRemoteServer)(ipAddress, path_1.default.resolve(__dirname, `../../ops/prod/image/build-image-${image}.sh`), "~", { keyPath: "~/.ssh/build-image.pem", signal });
        await (0, ssh_1.copyToRemoteServer)(ipAddress, path_1.default.resolve(__dirname, `../../ops/prod/image/authorized_keys`), "~", { keyPath: "~/.ssh/build-image.pem", signal });
        console.log("Executing build script.");
        await (0, ssh_1.executeRemoteCommand)(ipAddress, `/home/ec2-user/build-image-${image}.sh ${name}`, {
            keyPath: "~/.ssh/build-image.pem",
            signal,
        });
        console.log("Creating Image.");
        const createImageResult = await ec2.send(new client_ec2_1.CreateImageCommand({
            InstanceId: instanceId,
            Name: name,
            TagSpecifications: [
                { ResourceType: client_ec2_1.ResourceType.image, Tags: [{ Key: "Name", Value: name }] },
                { ResourceType: client_ec2_1.ResourceType.snapshot, Tags: [{ Key: "Name", Value: name }] },
            ],
        }));
        const imageId = createImageResult.ImageId;
        console.log(chalk_1.default.green `Image created: ${imageId}`);
        await (0, wait_1.waitForResult)(async () => {
            var _a;
            const result = await ec2.send(new client_ec2_1.DescribeImagesCommand({
                ImageIds: [imageId],
            }));
            const imageState = (_a = result.Images) === null || _a === void 0 ? void 0 : _a[0].State;
            if ([client_ec2_1.ImageState.available, client_ec2_1.ImageState.pending].includes(imageState)) {
                return imageState === client_ec2_1.ImageState.available;
            }
            else {
                throw new Error(`Error creating image ${imageId}, state: ${imageState}`);
            }
        }, {
            message: chalk_1.default.italic `Waiting for image to become available...`,
            delay: 30000,
            signal,
        });
        console.log(chalk_1.default.green `Image ID: ${imageId}`);
    }, { keyPath: "~/.ssh/build-image.pem" });
}
(0, run_1.run)(main);
