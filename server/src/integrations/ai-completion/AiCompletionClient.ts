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

export interface AiCompletionPrompt {
  role: "system" | "user";
  content: string;
}

export interface IAiCompletionClient<TParams> extends BaseClient {
  getCompletion: (params: TParams, options?: AiCompletionOptions) => Promise<AiCompletionResponse>;
  buildRequestParams(model: string, apiVersion: string, prompt: AiCompletionPrompt[]): TParams;
}
