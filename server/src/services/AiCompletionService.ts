import Ajv from "ajv";
import safeStringify from "fast-safe-stringify";
import { inject, injectable } from "inversify";
import { pick } from "remeda";
import { AiCompletionLog, AiCompletionLogType } from "../db/__types";
import {
  IntegrationProvider,
  IntegrationRepository,
} from "../db/repositories/IntegrationRepository";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import {
  AI_COMPLETION_CLIENT_FACTORY,
  AiCompletionClientFactory,
  AiCompletionPromptItem,
  AiCompletionResponse,
} from "../integrations/ai-completion/AiCompletionClient";
import {
  InvalidCredentialsError,
  InvalidRequestError,
} from "../integrations/helpers/GenericIntegration";

export const AI_COMPLETION_SERVICE = Symbol.for("AI_COMPLETION_SERVICE");

interface AiCompletionConfig {
  integrationId: number;
  type: AiCompletionLogType;
  model: string;
  prompt: AiCompletionPromptItem[];
  apiVersion?: string;
  responseFormat: { type: "text" } | { type: "json"; schema: any };
}

export interface IAiCompletionService {
  processAiCompletion(config: AiCompletionConfig, createdBy: string): Promise<AiCompletionLog>;
}

@injectable()
export class AiCompletionService implements IAiCompletionService {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(IntegrationRepository) private integrations: IntegrationRepository,
    @inject(AI_COMPLETION_CLIENT_FACTORY)
    private aiCompletionClientFactory: AiCompletionClientFactory,
  ) {}

  public async processAiCompletion(config: AiCompletionConfig, createdBy: string) {
    const integration = (await this.integrations.loadIntegration(config.integrationId))!;
    const client = this.aiCompletionClientFactory(
      integration.provider as IntegrationProvider<"AI_COMPLETION">,
      integration.id,
    );
    const params = await client.buildRequestParams(
      config.model,
      config.apiVersion ?? null,
      config.prompt,
      config.responseFormat,
    );

    const aiCompletionLog = await this.petitions.createAiCompletionLog(
      {
        integration_id: config.integrationId,
        type: config.type,
        request_params: JSON.stringify(params),
      },
      createdBy,
    );

    let response: AiCompletionResponse | undefined;
    try {
      response = await client.getCompletion(params);

      if (config.responseFormat.type === "json") {
        // make sure response.completion is a valid JSON
        const result = JSON.parse(response.completion);
        const ajv = new Ajv({ strict: false });
        ajv.addFormat("currency", true);
        if (!ajv.validate(config.responseFormat.schema, result)) {
          throw new Error("Invalid JSON object: " + ajv.errorsText());
        }
      }

      return await this.petitions.updateAiCompletionLog(
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
      return await this.petitions.updateAiCompletionLog(
        aiCompletionLog.id,
        {
          status: "FAILED",
          raw_response: response?.rawResponse,
          request_tokens: response?.requestTokens,
          response_tokens: response?.responseTokens,
          cost: response?.totalCost,
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
  }
}
