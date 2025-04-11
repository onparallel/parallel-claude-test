import { ResolutionContext } from "inversify";
import { IntegrationProvider } from "../../db/repositories/IntegrationRepository";
import { BaseClient } from "../helpers/BaseClient";

export const AI_COMPLETION_CLIENT = Symbol.for("AI_COMPLETION_CLIENT");

export interface AiCompletionOptions {
  stream?: boolean;
  signal?: AbortSignal;
  onChunk?: (chunk: string) => void;
}

export interface AiCompletionResponse {
  requestParams: string;
  rawResponse: string;
  completion: string;
  requestTokens: number;
  responseTokens: number;
  requestDurationMs: number;
  totalCost: string;
}

export type AiCompletionPromptFileContent = { type: "file"; file_upload_id: number };

export type AiCompletionPromptItem = {
  role: "system" | "user";
  content: string | AiCompletionPromptFileContent;
};

export interface IAiCompletionClient<TParams> extends BaseClient {
  getCompletion: (params: TParams, options?: AiCompletionOptions) => Promise<AiCompletionResponse>;
  buildRequestParams(
    model: string,
    apiVersion: string | null,
    prompt: AiCompletionPromptItem[],
    responseFormat: { type: "text" } | { type: "json"; schema: any },
  ): Promise<TParams>;
}

export const AI_COMPLETION_CLIENT_FACTORY = Symbol.for("AI_COMPLETION_CLIENT_FACTORY");

export function getAiCompletionClientFactory(context: ResolutionContext) {
  return function aiCompletionClientFactory(
    provider: IntegrationProvider<"AI_COMPLETION">,
    integrationId: number,
  ): IAiCompletionClient<any> {
    const integration = context.get<IAiCompletionClient<any>>(AI_COMPLETION_CLIENT, {
      name: provider,
    });
    integration.configure(integrationId);
    return integration;
  };
}

export type AiCompletionClientFactory = ReturnType<typeof getAiCompletionClientFactory>;
