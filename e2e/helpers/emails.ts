import faker from "@faker-js/faker";
import fetch from "node-fetch";
import { URLSearchParams } from "url";

export function generateEmail() {
  const tag = faker.random.alphaNumeric(10);
  const namespace = process.env.TESTMAIL_NAMESPACE!;
  return `${namespace}.${tag}@inbox.testmail.app`;
}
interface Inbox {
  result: "success" | "fail";
  message: string | null;
  count: number;
  limit: number;
  offset: number;
  emails: Email[];
}

interface Email {
  html: string;
}

export async function waitForInbox(
  email: string,
  options: { timeout?: number } = {}
): Promise<Inbox> {
  const { timeout } = { timeout: 60000, ...options };
  const params = new URLSearchParams({
    apikey: process.env.TESTMAIL_APIKEY!,
    namespace: process.env.TESTMAIL_NAMESPACE!,
    tag: /[^\.]+.(.*)@.*/.exec(email)![1],
    livequery: "true",
  });
  const controller = new AbortController();
  const ref = setTimeout(() => {
    controller.abort();
  }, timeout);
  const res = await fetch(`https://api.testmail.app/api/json?${params}`, {
    signal: controller.signal as any,
  });
  clearTimeout(ref);
  return await res.json();
}
