import faker from "faker";
import fetch from "node-fetch";
import { URLSearchParams } from "url";

export function generateEmail() {
  const tag = faker.random.alphaNumeric(10);
  const namespace = process.env.TESTMAIL_NAMESPACE!;
  return `${namespace}.${tag}@inbox.testmail.app`;
}
interface EmailsFetchResponse {
  result: "success" | "fail";
  message: string | null;
  count: number;
  limit: number;
  offset: number;
  emails: any[];
}

export async function waitForEmail(
  email: string,
  options: { timeout?: number } = {}
): Promise<EmailsFetchResponse> {
  const { timeout } = { timeout: 60000, ...options };
  const params = new URLSearchParams({
    apikey: process.env.TESTMAIL_APIKEY!,
    namespace: process.env.TESTMAIL_NAMESPACE!,
    tag: /[^\.]+.(.*)@.*/.exec(email)![1],
    livequery: "true",
  });
  console.log(params);
  console.log(`https://api.testmail.app/api/json?${params}`);
  const controller = new AbortController();
  const res = await Promise.race([
    fetch(`https://api.testmail.app/api/json?${params}`, {
      signal: controller.signal as any,
    }),
    (async function () {
      await new Promise((resolve) => setTimeout(resolve, timeout));
      controller.abort();
      throw new Error(`Email timeout ${timeout}ms exceeded.`);
    })(),
  ]);
  return await res.json();
}
