import Ajv from "ajv";
import { inject, injectable } from "inversify";
import { AzureOpenAI } from "openai";
import { ChatCompletionMessageParam } from "openai/resources";
import { isNonNullish } from "remeda";
import { Config, CONFIG } from "../config";
import { JsonSchemaFor } from "../util/jsonSchema";
import { ILogger, LOGGER } from "./Logger";

export const AI_ASSISTANT_SERVICE = Symbol.for("AI_ASSISTANT_SERVICE");

// the following models must be configured in Azure dashboard before using them
type AvailableDeploymentName = "gpt-4o-mini";

export interface IAiAssistantService {
  getJsonCompletion<T>(
    deploymentName: AvailableDeploymentName,
    messages: ChatCompletionMessageParam[],
    schema: JsonSchemaFor<T>,
  ): Promise<T | null>;
}

@injectable()
export class AiAssistantService implements IAiAssistantService {
  private client: AzureOpenAI;

  constructor(
    @inject(LOGGER) private logger: ILogger,
    @inject(CONFIG) config: Config,
  ) {
    this.client = new AzureOpenAI({
      endpoint: config.aiAssistant.endpoint,
      apiKey: config.aiAssistant.apiKey,
      apiVersion: config.aiAssistant.apiVersion,
    });
  }

  async getJsonCompletion<T>(
    deploymentName: AvailableDeploymentName,
    messages: ChatCompletionMessageParam[],
    schema: JsonSchemaFor<T>,
  ): Promise<T | null> {
    try {
      this.logger.info("Requesting JSON completion", { deploymentName, messages });
      const response = await this.client.chat.completions.create({
        model: deploymentName,
        messages,
        n: 1,
        response_format: {
          type: "json_schema",
          json_schema: { name: schema.title ?? "", schema },
        },
      });
      this.logger.info("Received JSON completion", { response });
      if (isNonNullish(response.choices[0].message?.content)) {
        const result = JSON.parse(response.choices[0].message?.content);
        const ajv = new Ajv();
        if (!ajv.validate(schema, result)) {
          throw new Error("Invalid JSON object: " + ajv.errorsText());
        }
        return result;
      }
    } catch (error) {
      this.logger.error("Error getting JSON completion", error);
    }
    return null;
  }
}
