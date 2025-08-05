import {
  BedrockRuntimeServiceException,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import BigNumber from "bignumber.js";
import stringify from "fast-safe-stringify";
import { readFile } from "fs/promises";
import { inject, injectable } from "inversify";
import pMap from "p-map";
import { isNonNullish, partition } from "remeda";
import { FileUpload } from "../../db/__types";
import { FileRepository } from "../../db/repositories/FileRepository";
import { ENCRYPTION_SERVICE, IEncryptionService } from "../../services/EncryptionService";
import { ILogger, LOGGER } from "../../services/Logger";
import { IStorageService, STORAGE_SERVICE } from "../../services/StorageService";
import { removePasswordFromPdf } from "../../util/pdf";
import { retry, StopRetryError } from "../../util/retry";
import { withStopwatch } from "../../util/stopwatch";
import { BaseClient } from "../helpers/BaseClient";
import { InvalidRequestError } from "../helpers/GenericIntegration";
import {
  AiCompletionOptions,
  AiCompletionPromptFileContent,
  AiCompletionPromptItem,
  AiCompletionResponse,
  IAiCompletionClient,
} from "./AiCompletionClient";
import { AwsBedrockIntegration } from "./AwsBedrockIntegration";

interface AwsBedrockClientParams {
  messages: AiCompletionPromptItem[];
  system: { type: "text"; text: string }[];
  model: string;
  anthropicVersion: string;
  maxTokens: number;
  tools?: { name: string; description: string; input_schema?: any }[];
  toolChoice?: { type: "tool"; name: string };
}

interface InvokeModelCommandOutputBody {
  id: string;
  type: string;
  role: string;
  model: string;
  content: ({ type: "text"; text: string } | { type: "tool_use"; input: any })[];
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

@injectable()
export class AwsBedrockClient
  extends BaseClient
  implements IAiCompletionClient<AwsBedrockClientParams>
{
  constructor(
    @inject(AwsBedrockIntegration) private awsBedrock: AwsBedrockIntegration,
    @inject(FileRepository) private files: FileRepository,
    @inject(STORAGE_SERVICE) private storage: IStorageService,
    @inject(ENCRYPTION_SERVICE) private encryption: IEncryptionService,
    @inject(LOGGER) private logger: ILogger,
  ) {
    super();
  }

  // PRICES IN EUROS
  // https://aws.amazon.com/bedrock/pricing/
  private pricePerToken(m: string): { input: BigNumber; output: BigNumber } | null {
    switch (m) {
      case "arn:aws:bedrock:eu-central-1:749273139513:inference-profile/eu.anthropic.claude-sonnet-4-20250514-v1:0":
        return {
          input: BigNumber("0.0026").dividedBy(1_000),
          output: BigNumber("0.013").dividedBy(1_000),
        };
    }
    return null;
  }

  async buildRequestParams(
    model: string,
    apiVersion: string,
    prompt: AiCompletionPromptItem[],
    responseFormat: { type: "text" } | { type: "json"; schema: any },
  ): Promise<AwsBedrockClientParams> {
    const [userMessages, systemMessages] = partition(prompt, (p) => p.role === "user");

    return {
      model,
      system: systemMessages
        .map((p) =>
          typeof p.content === "string" ? { type: "text" as const, text: p.content } : null,
        )
        .filter(isNonNullish),
      messages: userMessages,
      maxTokens: 2048,
      anthropicVersion: "bedrock-2023-05-31",
      ...(responseFormat.type === "json"
        ? {
            tools: [
              {
                name: "json_response",
                description:
                  "Respond only with a JSON object that conforms to the JSON Schema. Do not include any additional commentary, keys, or text other than those specified in the schema",
                input_schema: {
                  type: "object",
                  additionalProperties: false,
                  required: ["result"],
                  properties: { result: responseFormat.schema },
                },
              },
            ],
            toolChoice: { type: "tool", name: "json_response" },
          }
        : {}),
    };
  }

  private async resolveFileContent(c: AiCompletionPromptFileContent) {
    const file = await this.files.loadFileUpload(c.file_upload_id);
    if (!file) {
      this.logger.warn(`Unable to load FileUpload:${c.file_upload_id}. Skipping...`);
      return [{ type: "text" as const, text: "" }];
    }

    if (file.content_type === "application/pdf") {
      return [
        {
          type: "document" as const,
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: await this.resolveFileUploadContents(file),
          },
          title: file.filename,
        },
      ];
    } else if (file.content_type.startsWith("image/")) {
      return [
        {
          type: "image" as const,
          source: {
            type: "base64",
            media_type: file.content_type as any,
            data: await this.resolveFileUploadContents(file),
          },
        },
      ];
    }

    throw new Error(`Unsupported content_type ${file.content_type}`);
  }

  async getCompletion(
    params: AwsBedrockClientParams,
    options?: AiCompletionOptions,
  ): Promise<AiCompletionResponse> {
    return await this.awsBedrock.withAwsBedrockClient(this.integrationId, async (client) => {
      // resolve file_upload_id references in the prompt before sending to the API
      const messages = await pMap(
        params.messages,
        async (p) => ({
          role: p.role,
          content:
            typeof p.content === "string" ? p.content : await this.resolveFileContent(p.content),
        }),
        { concurrency: 10 },
      );

      const response = await retry(
        async () => {
          try {
            const { result, time } = await withStopwatch(async () => {
              const response = await client.send(
                new InvokeModelCommand({
                  modelId: params.model,
                  body: JSON.stringify({
                    anthropic_version: params.anthropicVersion,
                    messages,
                    system: params.system,
                    max_tokens: params.maxTokens,
                    tools: params.tools,
                    tool_choice: params.toolChoice,
                  }),
                  contentType: "application/json",
                }),
              );

              return JSON.parse(response.body.transformToString()) as InvokeModelCommandOutputBody;
            });

            return {
              completion: result,
              model: params.model,
              time,
            };
          } catch (error) {
            if (error instanceof BedrockRuntimeServiceException) {
              // log error info to try and improve error handling in the future
              //e.g. if "retry-after" header is present we could use it instead of an exponential backoff
              this.logger.debug(stringify(error.$response));

              if (error.$retryable?.throttling) {
                // handle these errors on the retry loop
                throw new InvalidRequestError(
                  error.$metadata.httpStatusCode?.toString() ?? "500",
                  error.message,
                );
              }
            }

            throw new StopRetryError(error);
          }
        },
        {
          maxRetries: 3,
          delay: (error, iteration) => {
            // Exponential backoff with random jitter
            // Base delay: 1 second, doubles each iteration
            const baseDelay = 1000 * Math.pow(2, iteration);

            // Add random jitter: ±25% of the base delay
            const jitterRange = baseDelay * 0.25;
            const jitter = (Math.random() - 0.5) * jitterRange;

            const totalDelay = Math.max(0, baseDelay + jitter);

            // Log the retry attempt for debugging
            this.logger.debug(
              `Retrying AWS Bedrock request after ${totalDelay.toFixed(0)}ms delay (iteration ${iteration})`,
              {
                error: error instanceof Error ? error.message : String(error),
                baseDelay,
                jitter,
                totalDelay,
              },
            );

            return totalDelay;
          },
        },
      );

      const requestTokens = response.completion.usage.input_tokens;
      const requestCost =
        this.pricePerToken(response.model)?.input?.multipliedBy(requestTokens) ?? BigNumber("0");
      const responseTokens = response.completion.usage.output_tokens;
      const responseCost =
        this.pricePerToken(response.model)?.output?.multipliedBy(responseTokens) ?? BigNumber("0");
      const totalCost = requestCost.plus(responseCost).toString();

      return {
        requestParams: JSON.stringify({
          ...params,
          model: response.model,
        }),
        rawResponse: JSON.stringify(response),
        completion:
          response.completion.content[0].type === "text"
            ? response.completion.content[0].text
            : JSON.stringify(response.completion.content[0].input.result),
        requestTokens,
        responseTokens,
        totalCost,
        requestDurationMs: response.time,
      };
    });
  }

  // returns a base64-encoded decrypted version of the file
  private async resolveFileUploadContents(file: FileUpload): Promise<string> {
    if (file.content_type === "application/pdf" && file.password) {
      const readable = await this.storage.fileUploads.downloadFile(file.path);
      const decryptedFilePath = await removePasswordFromPdf(
        readable,
        this.encryption.decrypt(Buffer.from(file.password, "hex"), "utf8"),
      );
      return await readFile(decryptedFilePath, { encoding: "base64" });
    } else {
      return await this.storage.fileUploads.downloadFileBase64(file.path);
    }
  }
}
