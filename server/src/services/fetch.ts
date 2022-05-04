import { injectable } from "inversify";
import fetch, { RequestInfo, RequestInit, Response } from "node-fetch";

export const FETCH_SERVICE = Symbol.for("FETCH_SERVICE");

export interface IFetchService {
  fetch(url: RequestInfo, init?: RequestInit): Promise<Response>;
  fetchWithTimeout(url: RequestInfo, init: RequestInit, timeout: number): Promise<Response>;
}

@injectable()
export class FetchService implements IFetchService {
  readonly fetch = fetch;
  async fetchWithTimeout(url: RequestInfo, init: RequestInit, timeout: number) {
    const controller = new AbortController();
    const cancelTimeout = setTimeout(() => {
      controller.abort();
    }, timeout);
    const result = await fetch(url, { ...init, signal: controller.signal as any });
    clearTimeout(cancelTimeout);
    return result;
  }
}
