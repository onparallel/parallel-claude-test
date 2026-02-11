import { injectable } from "inversify";
import { isNonNullish } from "remeda";
import { Dispatcher } from "undici";
import { retry, RetryOptions, StopRetryError } from "../util/retry";
import { MaybeFunction, unMaybeFunction } from "../util/types";

export const FETCH_SERVICE = Symbol.for("FETCH_SERVICE");

export type FetchRequestInit = Omit<RequestInit, "signal"> & { dispatcher?: Dispatcher };

export interface IFetchService {
  fetch(
    url: RequestInfo,
    init?: MaybeFunction<FetchRequestInit, [tryIndex: number]>,
    options?: FetchOptions,
  ): Promise<Response>;
}

export interface FetchOptions extends Partial<RetryOptions> {
  timeout?: number;
}

@injectable()
export class FetchService implements IFetchService {
  async fetch(
    url: RequestInfo,
    init?: MaybeFunction<Omit<RequestInit, "signal">, [tryIndex: number]>,
    options?: FetchOptions,
  ) {
    const { timeout, maxRetries, delay, signal } = options ?? {};
    try {
      return await retry(
        async (i) => {
          let abortSignal: AbortSignal | undefined;
          const signals = isNonNullish(signal) ? [signal] : [];
          if (isNonNullish(timeout)) {
            abortSignal = AbortSignal.timeout(timeout);
            signals.push(abortSignal);
          }
          const requestInit: RequestInit = {
            ...unMaybeFunction(init ?? {}, i),
            signal: signals.length > 0 ? AbortSignal.any(signals) : undefined,
          };
          try {
            const response = await fetch(url, requestInit);
            if (!response.ok) {
              throw response;
            }
            return response;
          } catch (e) {
            if (e instanceof Error && signal?.aborted) {
              throw new StopRetryError(e);
            }
            if (e instanceof Error && abortSignal?.aborted) {
              throw new TimeoutError("Fetch duration exceeded timeout.");
            }
            throw e;
          }
        },
        { maxRetries: maxRetries ?? 0, delay, signal },
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
