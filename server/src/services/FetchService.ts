import { injectable } from "inversify";
import { isNonNullish } from "remeda";
import { RetryOptions, StopRetryError, retry } from "../util/retry";

export const FETCH_SERVICE = Symbol.for("FETCH_SERVICE");

export interface IFetchService {
  fetch(url: RequestInfo, options?: FetchOptions): Promise<Response>;
}

export interface FetchOptions extends RequestInit, Omit<Partial<RetryOptions>, "signal"> {
  timeout?: number;
}

@injectable()
export class FetchService implements IFetchService {
  async fetch(url: RequestInfo, options?: FetchOptions) {
    const { timeout, maxRetries, delay, ...init } = options ?? {};
    try {
      return await retry(
        async () => {
          let controller: AbortController | undefined;
          let cancelTimeout: NodeJS.Timeout | undefined;
          const options = { ...init };
          if (isNonNullish(timeout)) {
            controller = new AbortController();
            init.signal?.addEventListener("abort", () => controller!.abort());
            options.signal = controller.signal as any;
            cancelTimeout = setTimeout(() => controller!.abort(), timeout);
          }
          try {
            const response = await fetch(url, options);
            if (!response.ok) {
              throw response;
            }
            return response;
          } catch (e) {
            if (e instanceof Error && init.signal?.aborted) {
              throw new StopRetryError(e);
            }
            if (e instanceof Error && controller?.signal.aborted) {
              throw new TimeoutError("Fetch duration exceeded timeout.");
            }
            throw e;
          } finally {
            if (isNonNullish(cancelTimeout)) {
              clearTimeout(cancelTimeout);
            }
          }
        },
        { maxRetries: maxRetries ?? 0, delay, signal: (init?.signal ?? undefined) as any },
      );
    } catch (e) {
      if (e instanceof Response) {
        return e;
      } else {
        throw e;
      }
    }
  }
}

export class TimeoutError extends Error {}
