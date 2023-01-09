import { Page } from "@playwright/test";
import { ImapFlow } from "imapflow";
import { simpleParser, Source } from "mailparser";
import { isDefined, noop } from "remeda";
import { promisify } from "util";
import { Email, EmailEnvelope } from "./types";

const parseEmail = promisify<Source, Email>(simpleParser);

interface WaitForEmailOptions {
  user: string;
  password: string;
}

export async function waitForEmail(
  page: Page,
  predicate: (envelope: EmailEnvelope) => boolean,
  { user, password }: WaitForEmailOptions
): Promise<Email> {
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user,
      pass: password,
    },
    logger: Object.fromEntries(["debug", "info", "warn", "error"].map((l) => [l, noop])) as any,
  });
  await client.connect();
  try {
    const seen: Record<number, boolean> = {};
    while (true) {
      const mailbox = await client.mailboxOpen("INBOX");
      try {
        const range = `${mailbox.exists}:${Math.max(mailbox.exists - 20, 1)}`;
        let uid: number | undefined = undefined;
        for await (const message of client.fetch(range, { envelope: true })) {
          if (!seen[message.uid]) {
            seen[message.uid] = true;
            if (predicate(message.envelope)) {
              uid = message.uid;
            }
          }
        }
        if (isDefined(uid)) {
          const message = await client.fetchOne(`${uid}`, { source: true }, { uid: true });
          return await parseEmail(message.source);
        }
      } finally {
        await client.mailboxClose();
      }
      await page.waitForTimeout(5_000);
    }
  } finally {
    await client.logout();
  }
}
