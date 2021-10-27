import { injectable } from "inversify";
import fetch, { RequestInfo, RequestInit, Response } from "node-fetch";

export const FETCH_SERVICE = Symbol.for("FETCH_SERVICE");

export interface IFetchService {
  fetch(...args: Parameters<typeof fetch>): ReturnType<typeof fetch>;
}

@injectable()
export class FetchService implements IFetchService {
  fetch(url: RequestInfo, init?: RequestInit | undefined): Promise<Response> {
    return fetch(url, init);
  }
}
