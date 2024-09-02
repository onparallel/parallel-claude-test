import { waitFor } from "../../util/promises/waitFor";
import { FetchService, IFetchService, TimeoutError } from "../FetchService";

function flushPromises() {
  return new Promise(jest.requireActual("timers").setImmediate);
}

describe("FetchService", () => {
  let fetchService: IFetchService;
  const _fetch = fetch;
  const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>();

  beforeAll(async () => {
    fetchService = new FetchService();
  });

  beforeEach(() => {
    global.fetch = fetchMock as any;
    fetchMock.mockReset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    global.fetch = _fetch;
    jest.useRealTimers();
  });

  it("does a simple fetch", async () => {
    fetchMock.mockImplementation(async () => {
      return Promise.resolve(new Response(JSON.stringify({ mocked: 1 }), { status: 200 }));
    });

    const response = await fetchService.fetch("https://www.example.com");
    expect(response.status).toEqual(200);
    expect(await response.json()).toEqual({ mocked: 1 });
  });

  it("fails if setting timeout and fetch can't resolve", async () => {
    fetchMock.mockImplementation(async (url, init) => {
      await waitFor(10_000, { signal: (init?.signal ?? undefined) as any });
      return new Response("OK", { status: 200 });
    });

    const promise = fetchService.fetch("https://www.example.com", { timeout: 1_000 });
    jest.advanceTimersByTime(2_000);
    await expect(promise).rejects.toThrow(TimeoutError);
  });

  it("retries once if fetch does not succed", async () => {
    let calls = 0;
    fetchMock.mockImplementation(async () => {
      if (calls++ === 0) {
        return Promise.resolve(new Response("", { status: 502, statusText: "Bad Gateway" }));
      }

      return Promise.resolve(new Response("", { status: 200, statusText: "OK" }));
    });

    const response = await fetchService.fetch("https://www.example.com", { maxRetries: 1 });
    expect(response).toMatchObject({ ok: true, status: 200, statusText: "OK" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("stops retrying if aborted from outside", async () => {
    fetchMock.mockImplementation(async (url, init) => {
      await waitFor(1_000, { signal: (init?.signal ?? undefined) as any });
      return new Response("Bad Gateway", { status: 502 });
    });

    const controller = new AbortController();
    const promise = fetchService.fetch("https://www.example.com", {
      signal: controller.signal as any,
      maxRetries: 3,
    });
    waitFor(2_500).then(() => controller.abort());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1_000);
    await flushPromises();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    jest.advanceTimersByTime(1_000);
    await flushPromises();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    jest.advanceTimersByTime(600);
    await expect(promise).rejects.toThrow();
    await flushPromises();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
