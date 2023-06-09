import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { fromEnv, fromInstanceMetadata } from "@aws-sdk/credential-providers";
import DataLoader from "dataloader";
import { config } from "dotenv";
import pMap from "p-map";
import path from "path";
import { isDefined } from "remeda";
import { safeJsonParse } from "./safeJsonParse";

const SECRETS_MANAGER_REGEX = /^sm:\/\/([^#]+)#(.+)$/;

export async function loadEnv(overrides?: string) {
  // load secrets on production and staging environments
  if (process.env.ENV === "production" || process.env.ENV === "staging") {
    config({ path: path.resolve(process.cwd(), `.env.${process.env.ENV}`) });
  } else {
    // development environment
    config();
  }

  if (overrides) {
    config({ path: path.resolve(process.cwd(), overrides), override: true });
  }
  if (process.env.NODE_ENV !== "production") {
    config({ path: path.resolve(process.cwd(), ".development.env"), override: true });
  }

  const secretsLoader = new DataLoader<string, any>(async (arns) => {
    const secretsManager = new SecretsManagerClient({
      credentials:
        process.env.NODE_ENV === "development"
          ? fromEnv()
          : fromInstanceMetadata({
              maxRetries: 3,
              timeout: 3_000,
            }),
      region: process.env.AWS_REGION!,
    });
    return await pMap(
      arns,
      async (arn) => {
        const response = await secretsManager.send(new GetSecretValueCommand({ SecretId: arn }));
        return safeJsonParse(response.SecretString!);
      },
      { concurrency: 100 }
    );
  });

  // iterates over all env variables and replaces the ones that are secrets from AWS Secrets Manager
  await pMap(
    Object.entries(process.env).filter(
      ([, value]) => isDefined(value) && SECRETS_MANAGER_REGEX.test(value)
    ),
    async ([key, value]) => {
      try {
        const [, arn, path] = value!.match(SECRETS_MANAGER_REGEX)!;
        const secret = path
          .split("/")
          .reduce((acc, curr) => acc?.[curr], await secretsLoader.load(arn));
        if (!isDefined(secret)) {
          throw new Error(`Unknown path ${path} in secret ${arn}`);
        }
        process.env[key] = secret;
      } catch (error) {
        // give a little more context
        console.error(`Error fetching secret ${key}=${value}`);
        throw error;
      }
    }
  );
}
