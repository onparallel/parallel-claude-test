"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
const credential_providers_1 = require("@aws-sdk/credential-providers");
const crypto_1 = require("crypto");
const yargs_1 = __importDefault(require("yargs"));
async function main() {
    const { environment, clientId, exportId, body, complete } = await yargs_1.default
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
    const baseUrl = environment === "dev"
        ? "http://localhost"
        : environment === "staging"
            ? "https://staging2.onparallel.com"
            : "https://www.onparallel.com";
    const url = `${baseUrl}/api/integrations/export/imanage/client/${clientId}/export/${exportId}${complete ? "/complete" : ""}`;
    const timestamp = Date.now().toString();
    const secret = await loadSignatureSecret(environment);
    const signature = (0, crypto_1.createHmac)("sha256", Buffer.from(secret, "base64"))
        .update(url + body + timestamp)
        .digest("base64");
    const headers = {
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
async function loadSignatureSecret(env) {
    try {
        const secretsManager = new client_secrets_manager_1.SecretsManagerClient({ credentials: (0, credential_providers_1.fromEnv)() });
        const id = env === "dev"
            ? "development/third-party-4RdbmB"
            : env === "staging"
                ? "staging/third-party-JUHVI7"
                : env === "production"
                    ? "production/third-party-oIdNKR"
                    : null;
        const secret = await secretsManager.send(new client_secrets_manager_1.GetSecretValueCommand({
            SecretId: `arn:aws:secretsmanager:eu-central-1:749273139513:secret:${id}`,
        }));
        return JSON.parse(secret.SecretString).FILE_EXPORT.IMANAGE.SIGNATURE_SECRET;
    }
    catch (error) {
        console.error(error);
    }
    throw new Error("Error loading secret. Make sure to export your temporary AWS credentials.");
}
