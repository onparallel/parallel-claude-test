import { IAMClient, ListVirtualMFADevicesCommand } from "@aws-sdk/client-iam";
import {
  AssumeRoleCommand,
  GetCallerIdentityCommand,
  GetSessionTokenCommand,
  STSClient,
  STSServiceException,
} from "@aws-sdk/client-sts";
import { fromIni } from "@aws-sdk/credential-provider-ini";
import { outdent } from "outdent";
import yargs from "yargs";
import { run } from "./utils/run";

async function main() {
  const { code, profile, duration } = await yargs
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
  const sts = new STSClient(fromIni({ profile }));
  const userArn = await sts.send(new GetCallerIdentityCommand({})).then((r) => r.Arn!);
  const iam = new IAMClient(fromIni({ profile }));
  const mfaSerialNumber = await iam
    .send(new ListVirtualMFADevicesCommand({}))
    .then((r) => r.VirtualMFADevices!.find((d) => d.User!.Arn === userArn)!.SerialNumber!);

  const mfaAuthenticatedCredentials = await (async () => {
    // Authenticate with MFA
    try {
      return await sts
        .send(
          new GetSessionTokenCommand({
            SerialNumber: mfaSerialNumber,
            TokenCode: code,
            DurationSeconds: 900,
          })
        )
        .then((r) => r.Credentials!);
    } catch (e) {
      if (
        e instanceof STSServiceException &&
        e.name === "AccessDenied" &&
        e.message.includes("invalid MFA")
      ) {
        console.log(e.message);
        process.exit(1);
      }
      throw e;
    }
  })();

  const sts2 = new STSClient({
    credentials: {
      accessKeyId: mfaAuthenticatedCredentials.AccessKeyId!,
      secretAccessKey: mfaAuthenticatedCredentials.SecretAccessKey!,
      sessionToken: mfaAuthenticatedCredentials.SessionToken,
    },
  });

  const userName = userArn.split("/")[1];
  const credentials = await sts2
    .send(
      new AssumeRoleCommand({
        RoleArn: "arn:aws:iam::749273139513:role/parallel-admin",
        RoleSessionName: `cli-session-${userName}`,
        DurationSeconds: duration,
      })
    )
    .then((r) => r.Credentials!);
  console.log(outdent`
    export AWS_ACCESS_KEY_ID=${credentials.AccessKeyId}
    export AWS_SECRET_ACCESS_KEY=${credentials.SecretAccessKey}
    export AWS_SESSION_TOKEN=${credentials.SessionToken}
  `);
}

run(main);
