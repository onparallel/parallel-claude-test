import { inject, injectable } from "inversify";
import { AzureOpenAI } from "openai";
import {
  EnhancedOrgIntegration,
  IntegrationRepository,
} from "../../db/repositories/IntegrationRepository";
import { ENCRYPTION_SERVICE, EncryptionService } from "../../services/EncryptionService";
import {
  GenericIntegration,
  InvalidCredentialsError,
  InvalidRequestError,
} from "../helpers/GenericIntegration";

export type AzureOpenAiModel = "gpt-4-turbo" | "gpt-35-turbo";

interface AzureOpenAiIntegrationContext {
  endpoint: string;
  defaultModel: AzureOpenAiModel;
}

@injectable()
export class AzureOpenAiIntegration extends GenericIntegration<
  "AI_COMPLETION",
  "AZURE_OPEN_AI",
  AzureOpenAiIntegrationContext
> {
  protected type = "AI_COMPLETION" as const;
  protected provider = "AZURE_OPEN_AI" as const;

  constructor(
    @inject(ENCRYPTION_SERVICE) encryption: EncryptionService,
    @inject(IntegrationRepository) integrations: IntegrationRepository,
  ) {
    super(encryption, integrations);
  }

  protected override getContext(
    integration: EnhancedOrgIntegration<"AI_COMPLETION", "AZURE_OPEN_AI", false>,
  ): AzureOpenAiIntegrationContext {
    return {
      endpoint: integration.settings.ENDPOINT,
      defaultModel: "gpt-35-turbo",
    };
  }

  public async withAzureOpenAiClient<TResult>(
    orgIntegrationId: number,
    apiVersion: string,
    handler: (client: AzureOpenAI, context: AzureOpenAiIntegrationContext) => Promise<TResult>,
  ): Promise<TResult> {
    return await this.withCredentials(orgIntegrationId, async (credentials, context) => {
      const client = new AzureOpenAI({
        endpoint: context.endpoint,
        apiKey: credentials.API_KEY,
        apiVersion,
      });
      try {
        return await handler(client, context);
      } catch (error) {
        if (this.isUnauthorizedError(error)) {
          throw new InvalidCredentialsError("INVALID_CREDENTIALS", error.message);
        }

        if (this.isRestError(error)) {
          throw new InvalidRequestError(error.code, error.message);
        }

        throw error;
      }
    });
  }

  private isUnauthorizedError(e: unknown): e is { code: string; message: string } {
    return (
      !!e && typeof e === "object" && "code" in e && typeof e.code === "string" && e.code === "401"
    );
  }

  private isRestError(e: unknown): e is { code: string; message: string } {
    return (
      !!e &&
      typeof e === "object" &&
      "name" in e &&
      typeof e.name === "string" &&
      e.name === "RestError" &&
      "code" in e &&
      typeof e.code === "string" &&
      "message" in e &&
      typeof e.message === "string"
    );
  }
}
