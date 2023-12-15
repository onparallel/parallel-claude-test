import { BigNumber } from "bignumber.js";
import { inject, injectable } from "inversify";
import {
  AzureOpenAiIntegration,
  AzureOpenAiModel,
} from "../../integrations/AzureOpenAiIntegration";
import { StopRetryError, retry } from "../../util/retry";
import { withStopwatch } from "../../util/stopwatch";
import { AiCompletionOptions, AiCompletionPrompt, IAiCompletionClient } from "./AiCompletionClient";

interface AzureOpenAiClientParams {
  model: AzureOpenAiModel;
  prompt: AiCompletionPrompt[];
}

@injectable()
export class AzureOpenAiClient implements IAiCompletionClient<AzureOpenAiClientParams> {
  constructor(@inject(AzureOpenAiIntegration) private openAi: AzureOpenAiIntegration) {}

  private integrationId!: number;

  configure(integrationId: number) {
    this.integrationId = integrationId;
  }

  // TODO PetitionSummary: update this when moving to Azure client
  private readonly PRICE_PER_TOKEN: Record<
    AzureOpenAiModel,
    { input: BigNumber; output: BigNumber }
  > = {
    "gpt-4": {
      input: BigNumber("0.03").dividedBy(1000),
      output: BigNumber("0.06").dividedBy(1000),
    },
    "gpt-4-32k": {
      input: BigNumber("0.06").dividedBy(1000),
      output: BigNumber("0.12").dividedBy(1000),
    },
    "gpt-4-1106-preview": {
      input: BigNumber("0.01").dividedBy(1000),
      output: BigNumber("0.03").dividedBy(1000),
    },
    "gpt-3.5-turbo-1106": {
      input: BigNumber("0.001").dividedBy(1000),
      output: BigNumber("0.002").dividedBy(1000),
    },
  };

  buildRequestParams(model: AzureOpenAiModel, prompt: AiCompletionPrompt[]) {
    return {
      prompt,
      model,
    };
  }

  async getCompletion(params: AzureOpenAiClientParams, options?: AiCompletionOptions) {
    return await this.openAi.withAzureOpenAiClient(this.integrationId, async (client, context) => {
      if (options?.stream) {
        throw new Error("Stream not supported");
      }
      const response = await retry(
        async (i) => {
          try {
            const model = i === 0 ? params.model : context.defaultModel;
            const { result: completion, time } = await withStopwatch(
              async () =>
                await client.getChatCompletions(model, params.prompt, {
                  n: 1, // ensure there is only 1 choice in response
                }),
            );

            return { completion, model, time };
          } catch (e) {
            if (this.isModelNotFoundError(e)) {
              throw e;
            } else {
              throw new StopRetryError(e);
            }
          }
        },
        { maxRetries: 1 },
      );

      const requestTokens = response.completion.usage?.promptTokens ?? 0;
      const requestCost = this.PRICE_PER_TOKEN[response.model].input.multipliedBy(requestTokens);

      const responseTokens = response.completion.usage?.completionTokens ?? 0;
      const responseCost = this.PRICE_PER_TOKEN[response.model].output.multipliedBy(responseTokens);

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
    });
  }

  private isModelNotFoundError(e: unknown): e is { type: string; code: string; message: string } {
    return (
      !!e &&
      typeof e === "object" &&
      "type" in e &&
      typeof e.type === "string" &&
      e.type === "invalid_request_error" &&
      "code" in e &&
      typeof e.code === "string" &&
      e.code === "model_not_found"
    );
  }
}
