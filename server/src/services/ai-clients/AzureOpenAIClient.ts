import { BigNumber } from "bignumber.js";
import { inject, injectable } from "inversify";
import {
  AzureOpenAiIntegration,
  AzureOpenAiModel,
} from "../../integrations/AzureOpenAiIntegration";
import { StopRetryError, retry } from "../../util/retry";
import { withStopwatch } from "../../util/stopwatch";
import { AiCompletionOptions, AiCompletionPrompt, IAiCompletionClient } from "./AiCompletionClient";
import { InvalidRequestError } from "../../integrations/GenericIntegration";

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

  // PRICES IN EUROS
  private readonly PRICE_PER_TOKEN: Record<
    AzureOpenAiModel,
    { input: BigNumber; output: BigNumber }
  > = {
    "gpt-4-turbo": {
      input: BigNumber("0.01").dividedBy(1000),
      output: BigNumber("0.028").dividedBy(1000),
    },
    "gpt-35-turbo": {
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
              throw new InvalidRequestError(e.code, e.message);
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
