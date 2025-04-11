import { MessageParam, Model, TextBlockParam } from "@anthropic-ai/sdk/resources";
import BigNumber from "bignumber.js";
import stringify from "fast-safe-stringify";
import { readFile } from "fs/promises";
import { inject, injectable } from "inversify";
import { outdent } from "outdent";
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
import { AnthropicIntegration } from "./AnthropicIntegration";

interface AnthropicClientParams {
  max_tokens: number;
  model: Model;
  messages: Pick<AiCompletionPromptItem, "content">[];
  system: TextBlockParam[];
}

@injectable()
export class AnthropicClient
  extends BaseClient
  implements IAiCompletionClient<AnthropicClientParams>
{
  constructor(
    @inject(AnthropicIntegration) private anthropic: AnthropicIntegration,
    @inject(FileRepository) private files: FileRepository,
    @inject(STORAGE_SERVICE) private storage: IStorageService,
    @inject(ENCRYPTION_SERVICE) private encryption: IEncryptionService,
    @inject(LOGGER) private logger: ILogger,
  ) {
    super();
  }

  // PRICES IN EUROS
  // https://docs.anthropic.com/en/docs/about-claude/models/all-models#model-comparison-table
  private pricePerToken(m: Model): { input: BigNumber; output: BigNumber } | null {
    switch (m) {
      case "claude-3-7-sonnet-20250219":
      case "claude-3-5-sonnet-20241022":
        return {
          input: BigNumber("2.64").dividedBy(1_000_000),
          output: BigNumber("13.21").dividedBy(1_000_000),
        };
      case "claude-3-5-haiku-20241022":
        return {
          input: BigNumber("0.7").dividedBy(1_000_000),
          output: BigNumber("3.52").dividedBy(1_000_000),
        };
    }
    return null;
  }

  async buildRequestParams(
    model: Model,
    apiVersion: string,
    prompt: AiCompletionPromptItem[],
    responseFormat: { type: "text" } | { type: "json"; schema: any },
  ): Promise<AnthropicClientParams> {
    const [userMessages, systemMessages] = partition(prompt, (p) => p.role === "user");

    if (responseFormat.type === "json") {
      systemMessages.push({
        role: "system",
        content: outdent`
          Your reply must adhere to the following JSON Schema.
          ${JSON.stringify(responseFormat.schema)}

          Make sure to include all required fields, use the correct data types, and follow the schema's structure.
          Respond only with a valid, parsable JSON schema.
          Do not include any code block markers such as triple backticks (\`\`\`json or otherwise).
          Do not include any additional explanations, comments, or text before or after the JSON.
          Do not include any additional commentary, keys, or text other than those specified in the schema
          Your output must be a raw JSON object that conforms to JSON Schema standards.
          `,
      });
    }

    return {
      model,
      system: systemMessages
        .map((p) =>
          typeof p.content === "string" ? { type: "text" as const, text: p.content } : null,
        )
        .filter(isNonNullish),
      messages: userMessages,
      max_tokens: 2048,
    };
  }

  private async resolveFileContent(
    c: AiCompletionPromptFileContent,
  ): Promise<MessageParam["content"]> {
    const file = await this.files.loadFileUpload(c.file_upload_id);
    if (!file) {
      this.logger.warn(`Unable to load FileUpload:${c.file_upload_id}. Skipping...`);
      return [{ type: "text", text: "" }];
    }

    if (file.content_type === "application/pdf") {
      return [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: await this.resolveFileUploadContents(file),
          },
        },
      ];
    } else if (file.content_type.startsWith("image/")) {
      return [
        {
          type: "image",
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
    params: AnthropicClientParams,
    options?: AiCompletionOptions,
  ): Promise<AiCompletionResponse> {
    return await this.anthropic.withAnthropicClient(this.integrationId, async (client, context) => {
      const response = await retry(
        async (i) => {
          try {
            const model = i === 0 ? params.model : context.defaultModel;

            // resolve file_upload_id references in the prompt before sending to the API
            const messages = await pMap(
              params.messages,
              async (p) => ({
                role: "user" as const,
                content:
                  typeof p.content === "string"
                    ? p.content
                    : await this.resolveFileContent(p.content),
              }),
              { concurrency: 10 },
            );

            const { result: completion, time } = await withStopwatch(async () => {
              return await client.messages.create({
                model,
                max_tokens: params.max_tokens,
                system: params.system,
                messages,
              });
            });

            return { completion, model, time };
          } catch (error) {
            if (this.isModelNotFoundError(error)) {
              throw new InvalidRequestError(error.status.toString(), stringify(error));
            } else {
              throw new StopRetryError(error);
            }
          }
        },
        { maxRetries: 1 },
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
        completion: response.completion.content
          .filter((c) => c.type === "text")
          .map((c) => c.text)
          .join("\n"),
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

  private isModelNotFoundError(e: unknown): e is { status: number } {
    return !!e && typeof e === "object" && "status" in e && e.status === 404;
  }
}
