import { BigNumber } from "bignumber.js";
import { inject, injectable } from "inversify";
import { ResponseFormatJSONSchema, ResponseFormatText } from "openai/resources";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import { ILogger, LOGGER } from "../../services/Logger";
import { StopRetryError, retry } from "../../util/retry";
import { withStopwatch } from "../../util/stopwatch";
import { BaseClient } from "../helpers/BaseClient";
import { InvalidRequestError } from "../helpers/GenericIntegration";
import {
  AiCompletionOptions,
  AiCompletionPromptItem,
  IAiCompletionClient,
} from "./AiCompletionClient";
import { AzureOpenAiIntegration, AzureOpenAiModel } from "./AzureOpenAiIntegration";

interface AzureOpenAiClientParams {
  prompt: AiCompletionPromptItem[];
  model: AzureOpenAiModel;
  apiVersion: string;
  responseFormat: ResponseFormatText | ResponseFormatJSONSchema;
}

@injectable()
export class AzureOpenAiClient
  extends BaseClient
  implements IAiCompletionClient<AzureOpenAiClientParams>
{
  constructor(
    @inject(AzureOpenAiIntegration) private openAi: AzureOpenAiIntegration,
    @inject(LOGGER) private logger: ILogger,
  ) {
    super();
  }

  // PRICES IN EUROS
  // https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/#pricing
  private readonly PRICE_PER_TOKEN: Record<
    AzureOpenAiModel,
    { input: BigNumber; output: BigNumber }
  > = {
    "gpt-4-turbo": {
      input: BigNumber("9.597").dividedBy(1_000_000),
      output: BigNumber("28.791").dividedBy(1_000_000),
    },
    "gpt-35-turbo": {
      input: BigNumber("0.9597").dividedBy(1_000_000),
      output: BigNumber("1.9194").dividedBy(1_000_000),
    },
    "gpt-4o-mini": {
      input: BigNumber("0.14396").dividedBy(1_000_000),
      output: BigNumber("0.5759").dividedBy(1_000_000),
    },
  };

  async buildRequestParams(
    model: AzureOpenAiModel,
    apiVersion: string | null,
    prompt: AiCompletionPromptItem[],
    responseFormat: { type: "text" } | { type: "json"; schema: any },
  ): Promise<AzureOpenAiClientParams> {
    assert(apiVersion, "apiVersion is required in AzureOpenAiClient");

    return {
      prompt,
      model,
      apiVersion,
      responseFormat:
        responseFormat.type === "text"
          ? { type: "text" }
          : {
              type: "json_schema",
              json_schema: {
                name: responseFormat.schema.title ?? "",
                schema: responseFormat.schema,
              },
            },
    };
  }

  async getCompletion(params: AzureOpenAiClientParams, options?: AiCompletionOptions) {
    return await this.openAi.withAzureOpenAiClient(
      this.integrationId,
      params.apiVersion,
      async (client, context) => {
        if (options?.stream) {
          throw new Error("Stream not supported");
        }
        const response = await retry(
          async (i) => {
            try {
              const model = i === 0 ? params.model : context.defaultModel;
              const { result: completion, time } = await withStopwatch(
                async () =>
                  await client.chat.completions.create({
                    model,
                    // convert prompt to Azure OpenAI format
                    messages: params.prompt
                      .map((p) => {
                        if (typeof p.content === "string") {
                          return {
                            role: p.role,
                            content: p.content,
                          };
                        }

                        this.logger.warn("AzureOpenAiClient does not support file content", {
                          content: p.content,
                        });
                        return null;
                      })
                      .filter(isNonNullish),
                    response_format: params.responseFormat,
                    n: 1, // ensure there is only 1 choice in response,
                  }),
              );

              return { completion, model, time };
            } catch (e) {
              if (this.isModelNotFoundError(e)) {
                throw new InvalidRequestError(e.code, e.message);
              } else {
                throw new StopRetryError(e);
              }
            }
          },
          { maxRetries: 1 },
        );

        const requestTokens = response.completion.usage?.prompt_tokens ?? 0;
        const requestCost =
          this.PRICE_PER_TOKEN[response.model]?.input?.multipliedBy(requestTokens) ??
          BigNumber("0");

        const responseTokens = response.completion.usage?.completion_tokens ?? 0;
        const responseCost =
          this.PRICE_PER_TOKEN[response.model]?.output?.multipliedBy(responseTokens) ??
          BigNumber("0");

        const totalCost = requestCost.plus(responseCost).toString();

        return {
          requestParams: JSON.stringify({ ...params, model: response.model }),
          rawResponse: JSON.stringify(response.completion),
          completion: response.completion.choices[0].message?.content ?? "",
          requestTokens,
          responseTokens,
          totalCost,
          requestDurationMs: response.time,
        };
      },
    );
  }

  private isModelNotFoundError(e: unknown): e is { code: string; message: string } {
    return (
      !!e &&
      typeof e === "object" &&
      "code" in e &&
      typeof e.code === "string" &&
      e.code === "DeploymentNotFound"
    );
  }
}
