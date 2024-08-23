import safeStringify from "fast-safe-stringify";
import { Container, inject, injectable } from "inversify";
import { pick } from "remeda";
import { AiCompletionLog, AiCompletionLogType } from "../db/__types";
import {
  IntegrationProvider,
  IntegrationRepository,
} from "../db/repositories/IntegrationRepository";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import {
  AI_COMPLETION_CLIENT,
  AiCompletionPrompt,
  IAiCompletionClient,
} from "../integrations/ai-completion/AiCompletionClient";
import {
  InvalidCredentialsError,
  InvalidRequestError,
} from "../integrations/helpers/GenericIntegration";

export const AI_COMPLETION_SERVICE = Symbol.for("AI_COMPLETION_SERVICE");

type AiCompletionProvider = IntegrationProvider<"AI_COMPLETION">;

interface AiCompletionConfig {
  integration_id: number;
  type: AiCompletionLogType;
  model: string;
  prompt: AiCompletionPrompt[];
}

export interface IAiCompletionService {
  processAiCompletion(config: AiCompletionConfig, createdBy: string): Promise<AiCompletionLog>;
}

@injectable()
export class AiCompletionService implements IAiCompletionService {
  constructor(
    @inject(Container) private container: Container,
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(IntegrationRepository) private integrations: IntegrationRepository,
  ) {}

  private getClient(integration: { id: number; provider: AiCompletionProvider }) {
    const client = this.container.getNamed<IAiCompletionClient<any>>(
      AI_COMPLETION_CLIENT,
      integration.provider,
    );
    client.configure(integration.id);
    return client;
  }

  public async processAiCompletion(config: AiCompletionConfig, createdBy: string) {
    const integration = (await this.integrations.loadIntegration(config.integration_id))!;
    const provider = integration.provider as IntegrationProvider<"AI_COMPLETION">;
    const client = this.getClient({ id: integration.id, provider });
    const params = client.buildRequestParams(config.model, config.prompt);

    const aiCompletionLog = await this.petitions.createAiCompletionLog(
      {
        integration_id: config.integration_id,
        type: config.type,
        request_params: JSON.stringify(params),
      },
      createdBy,
    );

    try {
      const response = await client.getCompletion(params);
      await this.petitions.updateAiCompletionLog(
        aiCompletionLog.id,
        {
          status: "COMPLETED",
          request_params: response.requestParams,
          raw_response: response.rawResponse,
          completion: response.completion,
          request_tokens: response.requestTokens,
          response_tokens: response.responseTokens,
          request_duration_ms: response.requestDurationMs,
          cost: response.totalCost,
        },
        createdBy,
      );
    } catch (error) {
      await this.petitions.updateAiCompletionLog(
        aiCompletionLog.id,
        {
          status: "FAILED",
          error:
            error instanceof InvalidCredentialsError || error instanceof InvalidRequestError
              ? pick(error, ["code", "message"])
              : {
                  message:
                    error instanceof Error
                      ? error.message
                      : !!error
                        ? safeStringify(error)
                        : "UNKNOWN",
                },
        },
        createdBy,
      );
    }

    return aiCompletionLog;
  }
}
