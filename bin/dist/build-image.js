"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_ec2_1 = require("@aws-sdk/client-ec2");
const credential_providers_1 = require("@aws-sdk/credential-providers"); // ES6 import
const assert_1 = __importDefault(require("assert"));
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const remeda_1 = require("remeda");
const run_1 = require("./utils/run");
const timestamp_1 = require("./utils/timestamp");
const wait_1 = require("./utils/wait");
const INSTANCE_TYPE = "t2.large";
const KEY_NAME = "ops";
const SECURITY_GROUP_IDS = ["sg-0a7b2cbb5cd5e9020"];
const SUBNET_ID = "subnet-d3cc68b9";
const REGION = "eu-central-1";
const AVAILABILITY_ZONE = `${REGION}a`;
const ENHANCED_MONITORING = true;
const ec2 = new client_ec2_1.EC2Client({
    credentials: (0, credential_providers_1.fromIni)({ profile: "santi-admin" }),
});
async function main() {
    const imagesResult = await ec2.send(new client_ec2_1.DescribeImagesCommand({
        Owners: ["amazon"],
        Filters: [{ Name: "name", Values: ["amzn2-ami-kernel-5.10-hvm-*-x86_64-gp2"] }],
    }));
    const image = (0, remeda_1.maxBy)(imagesResult.Images, (i) => new Date(i.CreationDate).valueOf());
    const instanceResult = await ec2.send(new client_ec2_1.RunInstancesCommand({
        ImageId: image.ImageId,
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
                    VolumeSize: 30,
                    DeleteOnTermination: true,
                    VolumeType: "gp2",
                },
            },
        ],
        TagSpecifications: [
            { ResourceType: client_ec2_1.ResourceType.instance, Tags: [{ Key: "Name", Value: `image-build` }] },
        ],
        MetadataOptions: {
            HttpEndpoint: client_ec2_1.InstanceMetadataEndpointState.enabled,
            HttpTokens: client_ec2_1.HttpTokensState.required,
        },
    }));
    const instanceId = instanceResult.Instances[0].InstanceId;
    console.log((0, chalk_1.default) `Launched instance {bold ${instanceId}}`);
    await (0, wait_1.wait)(5000);
    let ipAddress;
    await (0, wait_1.waitFor)(async () => {
        var _a, _b, _c;
        const result = await ec2.send(new client_ec2_1.DescribeInstancesCommand({ InstanceIds: [instanceId] }));
        const instance = (_b = (_a = result.Reservations) === null || _a === void 0 ? void 0 : _a[0].Instances) === null || _b === void 0 ? void 0 : _b[0];
        const isRunning = ((_c = instance === null || instance === void 0 ? void 0 : instance.State) === null || _c === void 0 ? void 0 : _c.Name) === client_ec2_1.InstanceStateName.running;
        if (isRunning) {
            ipAddress = instance.PublicIpAddress;
        }
        return isRunning;
    }, chalk_1.default.italic `Instance {yellow pending}. Waiting 10 more seconds...`, 10000);
    (0, assert_1.default)((0, remeda_1.isDefined)(ipAddress));
    console.log((0, chalk_1.default) `Instance {green ✓ running}`);
    await waitForInstance(ipAddress);
    console.log("Uploading build script to the new instance.");
    (0, child_process_1.execSync)(`scp \
    -i ~/.ssh/ops.pem \
    -o "UserKnownHostsFile=/dev/null" \
    -o "StrictHostKeyChecking=no" \
    ${path_1.default.resolve(__dirname, "../../ops/prod/image/*")} ec2-user@${ipAddress}:~`, { stdio: "inherit" });
    console.log("Executing build script.");
    (0, child_process_1.execSync)(`ssh \
    -i ~/.ssh/ops.pem \
    -o "UserKnownHostsFile=/dev/null" \
    -o StrictHostKeyChecking=no \
    ec2-user@${ipAddress} /home/ec2-user/build.sh`, { stdio: "inherit" });
    console.log("Creating Image.");
    const createImageResult = await ec2.send(new client_ec2_1.CreateImageCommand({
        InstanceId: instanceId,
        Name: `parallel-server-${(0, timestamp_1.timestamp)()}`,
    }));
    const imageId = createImageResult.ImageId;
    console.log(chalk_1.default.green `Image created: ${imageId}`);
    await (0, wait_1.waitFor)(async () => {
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
    }, chalk_1.default.italic `Waiting for image to become available...`, 30000);
    await ec2.send(new client_ec2_1.TerminateInstancesCommand({
        InstanceIds: [instanceId],
    }));
    console.log(chalk_1.default.green `Image ID: ${imageId}`);
}
(0, run_1.run)(main);
async function waitForInstance(ipAddress) {
    await (0, wait_1.waitFor)(async () => {
        try {
            (0, child_process_1.execSync)(`ssh \
            -i ~/.ssh/ops.pem \
            -o ConnectTimeout=1 \
            -o "UserKnownHostsFile=/dev/null" \
            -o StrictHostKeyChecking=no \
            ec2-user@${ipAddress} true >/dev/null 2>&1`);
            return true;
        }
        catch {
            return false;
        }
    }, chalk_1.default.italic `SSH not available. Waiting 5 more seconds...`, 5000);
}
