import Anthropic, { APIError } from "@anthropic-ai/sdk";
import stringify from "fast-safe-stringify";
import { inject, injectable } from "inversify";
import { IntegrationRepository } from "../../db/repositories/IntegrationRepository";
import { ENCRYPTION_SERVICE, EncryptionService } from "../../services/EncryptionService";
import { GenericIntegration, InvalidCredentialsError } from "../helpers/GenericIntegration";

interface AnthropicIntegrationContext {
  defaultModel: string;
}

@injectable()
export class AnthropicIntegration extends GenericIntegration<
  "AI_COMPLETION",
  "ANTHROPIC",
  AnthropicIntegrationContext
> {
  protected type = "AI_COMPLETION" as const;
  protected provider = "ANTHROPIC" as const;

  constructor(
    @inject(ENCRYPTION_SERVICE) encryption: EncryptionService,
    @inject(IntegrationRepository) integrations: IntegrationRepository,
  ) {
    super(encryption, integrations);
  }

  protected override getContext(): AnthropicIntegrationContext {
    return {
      defaultModel: "claude-3-5-haiku-20241022",
    };
  }

  public async withAnthropicClient<TResult>(
    orgIntegrationId: number,
    handler: (client: Anthropic, context: AnthropicIntegrationContext) => Promise<TResult>,
  ): Promise<TResult> {
    return await this.withCredentials(orgIntegrationId, async (credentials, context) => {
      const client = new Anthropic({ apiKey: credentials.API_KEY });
      try {
        return await handler(client, context);
      } catch (error) {
        if (error instanceof APIError && error.status === 401) {
          throw new InvalidCredentialsError("INVALID_CREDENTIALS", stringify(error));
        }
        throw error;
      }
    });
  }
}
