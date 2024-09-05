import { BigNumber } from "bignumber.js";
import { inject, injectable } from "inversify";
import { StopRetryError, retry } from "../../util/retry";
import { withStopwatch } from "../../util/stopwatch";
import { BaseClient } from "../helpers/BaseClient";
import { InvalidRequestError } from "../helpers/GenericIntegration";
import { AiCompletionOptions, AiCompletionPrompt, IAiCompletionClient } from "./AiCompletionClient";
import { AzureOpenAiIntegration, AzureOpenAiModel } from "./AzureOpenAiIntegration";

interface AzureOpenAiClientParams {
  model: AzureOpenAiModel;
  prompt: AiCompletionPrompt[];
  apiVersion: string;
}

@injectable()
export class AzureOpenAiClient
  extends BaseClient
  implements IAiCompletionClient<AzureOpenAiClientParams>
{
  constructor(@inject(AzureOpenAiIntegration) private openAi: AzureOpenAiIntegration) {
    super();
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

  buildRequestParams(model: AzureOpenAiModel, apiVersion: string, prompt: AiCompletionPrompt[]) {
    return {
      prompt,
      model,
      apiVersion,
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
                    messages: params.prompt,
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
        const requestCost = this.PRICE_PER_TOKEN[response.model].input.multipliedBy(requestTokens);

        const responseTokens = response.completion.usage?.completion_tokens ?? 0;
        const responseCost =
          this.PRICE_PER_TOKEN[response.model].output.multipliedBy(responseTokens);

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
