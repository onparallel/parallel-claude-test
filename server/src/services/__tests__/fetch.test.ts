jest.mock("node-fetch");
const fetch = require("node-fetch");
const { Response } = jest.requireActual("node-fetch");
import { RequestInit, RequestInfo } from "node-fetch";
import { waitFor } from "../../util/promises/waitFor";
import { FetchService, IFetchService } from "../fetch";

describe("FetchService", () => {
  let fetchService: IFetchService;
  beforeAll(async () => {
    fetchService = new FetchService();
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    fetch.mockClear();
  });

  it("does a simple fetch", async () => {
    fetch.mockImplementation(async () => {
      return Promise.resolve(new Response(JSON.stringify({ mocked: 1 }), { status: 200 }));
    });

    const response = await fetchService.fetch("https://www.example.com");
    expect(response.status).toEqual(200);
    expect(await response.json()).toEqual({ mocked: 1 });
  });

  it("fails if setting timeout and fetch can't resolve", async () => {
    fetch.mockImplementation(async (url: RequestInfo, init?: RequestInit) => {
      await waitFor(10_000, { signal: (init?.signal ?? undefined) as any });
      return new Response("OK", { status: 200 });
    });

    const promise = fetchService.fetch("https://www.example.com", { timeout: 1_000 });
    jest.advanceTimersByTime(2_000);
    await expect(promise).rejects.toThrowError("Aborted");
  });

  it("retries once if fetch does not succed", async () => {
    let calls = 0;
    fetch.mockImplementation(async () => {
      if (calls++ === 0) {
        return Promise.resolve(new Response("", { status: 502, statusText: "Bad Gateway" }));
      }

      return Promise.resolve(new Response("", { status: 200, statusText: "OK" }));
    });

    const response = await fetchService.fetch("https://www.example.com", { maxRetries: 1 });
    expect(response).toMatchObject({ ok: true, status: 200, statusText: "OK" });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
