import { random, name } from "faker";
import fetch from "node-fetch";

const config = {
  domain: process.env.RECIPIENT_EMAIL_DOMAIN,
  workspace: process.env.RECIPIENT_EMAIL_WORKSPACE,
  apikey: process.env.TESTMAIL_APIKEY,
};

interface EmailsFetchResponse {
  result: "success" | "fail";
  message: string | null;
  count: number;
  limit: number;
  offset: number;
  emails: any[];
}

export async function waitForEmailReceipt(
  tag: string
): Promise<EmailsFetchResponse> {
  return await fetch(
    `https://api.testmail.app/api/json?apikey=${config.apikey}&namespace=${config.workspace}&tag=${tag}&livequery=true`
  ).then((res) => res.json());
}

export interface Recipient {
  email: string;
  firstName: string;
  lastName: string;
  emailTag: string;
}

export function getRandomRecipientData(): Recipient {
  const tag = random.alphaNumeric(10);
  return {
    email: `${config.workspace}.${tag}@${config.domain}`,
    firstName: name.firstName(),
    lastName: name.lastName(),
    emailTag: tag,
  };
}
