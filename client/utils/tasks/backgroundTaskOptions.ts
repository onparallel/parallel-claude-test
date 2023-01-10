export interface BackgroundTaskOptions {
  signal?: AbortSignal;
  timeout?: number;
  pollingInterval?: number;
}
