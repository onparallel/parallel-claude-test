"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_iam_1 = require("@aws-sdk/client-iam");
const client_sts_1 = require("@aws-sdk/client-sts");
const credential_provider_ini_1 = require("@aws-sdk/credential-provider-ini");
const outdent_1 = require("outdent");
const yargs_1 = __importDefault(require("yargs"));
const run_1 = require("./utils/run");
async function main() {
    const { code, profile, duration } = await yargs_1.default
        .usage("Usage: $0 --code [code] --profile [profile] --duration [duration]")
        .option("code", {
        required: true,
        type: "string",
        description: "The MFA code",
    })
        .option("profile", {
        required: false,
        type: "string",
        description: "The profile to use",
        default: "default",
    })
        .option("duration", {
        required: false,
        type: "number",
        description: "The duration of the session",
        default: 30 * 60,
    }).argv;
    const sts = new client_sts_1.STSClient((0, credential_provider_ini_1.fromIni)({ profile }));
    const userArn = await sts.send(new client_sts_1.GetCallerIdentityCommand({})).then((r) => r.Arn);
    const iam = new client_iam_1.IAMClient((0, credential_provider_ini_1.fromIni)({ profile }));
    const mfaSerialNumber = await iam
        .send(new client_iam_1.ListVirtualMFADevicesCommand({}))
        .then((r) => r.VirtualMFADevices.find((d) => d.User.Arn === userArn).SerialNumber);
    const mfaAuthenticatedCredentials = await (async () => {
        // Authenticate with MFA
        try {
            return await sts
                .send(new client_sts_1.GetSessionTokenCommand({
                SerialNumber: mfaSerialNumber,
                TokenCode: code,
                DurationSeconds: 900,
            }))
                .then((r) => r.Credentials);
        }
        catch (e) {
            if (e instanceof client_sts_1.STSServiceException &&
                e.name === "AccessDenied" &&
                e.message.includes("invalid MFA")) {
                console.log(e.message);
                process.exit(1);
            }
            throw e;
        }
    })();
    const sts2 = new client_sts_1.STSClient({
        credentials: {
            accessKeyId: mfaAuthenticatedCredentials.AccessKeyId,
            secretAccessKey: mfaAuthenticatedCredentials.SecretAccessKey,
            sessionToken: mfaAuthenticatedCredentials.SessionToken,
        },
    });
    const userName = userArn.split("/")[1];
    const credentials = await sts2
        .send(new client_sts_1.AssumeRoleCommand({
        RoleArn: "arn:aws:iam::749273139513:role/parallel-admin",
        RoleSessionName: `cli-session-${userName}`,
        DurationSeconds: duration,
    }))
        .then((r) => r.Credentials);
    console.log((0, outdent_1.outdent) `
    export AWS_ACCESS_KEY_ID=${credentials.AccessKeyId}
    export AWS_SECRET_ACCESS_KEY=${credentials.SecretAccessKey}
    export AWS_SESSION_TOKEN=${credentials.SessionToken}
  `);
}
(0, run_1.run)(main);
