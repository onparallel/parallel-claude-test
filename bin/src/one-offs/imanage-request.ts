import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { fromEnv } from "@aws-sdk/credential-providers";
import { createHmac } from "crypto";
import yargs from "yargs";

async function main() {
  const { environment, clientId, exportId, body, complete } = await yargs
    .option("clientId", {
      required: true,
      type: "string",
      description: "Client ID",
    })
    .option("exportId", {
      required: true,
      type: "string",
      description: "Export ID",
    })
    .option("complete", {
      required: false,
      type: "boolean",
      default: false,
    })
    .option("body", {
      required: false,
      type: "string",
      default: "{}",
      description: "Request body",
    })
    .option("environment", {
      required: false,
      alias: "env",
      type: "string",
      default: "dev",
      description: "Environment to run the script",
      choices: ["dev", "staging", "production"],
    }).argv;

  const baseUrl =
    environment === "dev"
      ? "http://localhost"
      : environment === "staging"
        ? "https://staging2.onparallel.com"
        : "https://www.onparallel.com";

  const url = `${baseUrl}/api/integrations/export/imanage/client/${clientId}/export/${exportId}${complete ? "/complete" : ""}`;

  const timestamp = Date.now().toString();

  const secret = await loadSignatureSecret(environment);

  const signature = createHmac("sha256", Buffer.from(secret))
    .update(url + body + timestamp)
    .digest("base64");

  const headers: RequestInit["headers"] = {
    "Content-Type": "application/json",
    "X-Signature-Timestamp": timestamp,
    "X-Signature-1": signature,
  };

  console.log("REQUEST", { method: "POST", url, headers, body });

  const response = await fetch(url, { headers, body, method: "POST" });
  console.log("RESPONSE", { status: response.status, statusText: response.statusText });
  console.log(await response.json());
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

async function loadSignatureSecret(env: string) {
  try {
    const secretsManager = new SecretsManagerClient({ credentials: fromEnv() });

    const id =
      env === "dev"
        ? "development/third-party-4RdbmB"
        : env === "staging"
          ? "staging/third-party-JUHVI7"
          : env === "production"
            ? "production/third-party-oIdNKR"
            : (null as never);

    const secret = await secretsManager.send(
      new GetSecretValueCommand({
        SecretId: `arn:aws:secretsmanager:eu-central-1:749273139513:secret:${id}`,
      }),
    );

    return JSON.parse(secret.SecretString!).FILE_EXPORT.IMANAGE.SIGNATURE_SECRET as string;
  } catch (error) {
    console.error(error);
  }
  throw new Error("Error loading secret. Make sure to export your temporary AWS credentials.");
}
