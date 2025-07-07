import { writeFile } from "fs/promises";
import { chunk } from "remeda";
import { run } from "../utils/run";
import { waitFor } from "../utils/wait";

/**
 * This script sends reminders to every PENDING petition coming from the passed template
 */

const API_KEY = process.env.API_KEY;
const TEMPLATE_ID = process.env.TEMPLATE_ID;

async function request(
  path: string,
  {
    query,
    method = "GET",
    body,
  }: { query?: URLSearchParams; method?: string; body?: Record<string, any> },
) {
  const res = await fetch(
    `https://www.onparallel.com/api/v1/${path.startsWith("/") ? path.slice(1) : path}${
      query && query.size > 0 ? `?${query}` : ""
    }`,
    {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${API_KEY}`,
      },
    },
  );
  if (res.ok) {
    return await res.json();
  } else {
    throw new Error(await res.text());
  }
}

async function main() {
  if (!API_KEY || typeof API_KEY !== "string") throw new Error("API_KEY is not defined");
  if (!TEMPLATE_ID || typeof TEMPLATE_ID !== "string")
    throw new Error("TEMPLATE_ID is not defined");

  let offset = 0;
  const limit = 500;

  const petitions: {
    id: string;
    recipients: { id: string; status: "ACTIVE" | "INACTIVE"; remindersLeft: number }[];
  }[] = [];

  let petitionsChunk = await request("/petitions", {
    query: new URLSearchParams({
      fromTemplateId: TEMPLATE_ID!,
      include: "recipients",
      status: "PENDING",
      limit: limit.toString(),
      offset: offset.toString(),
    }),
  });

  petitions.push(...petitionsChunk.items);

  while (petitionsChunk.totalCount > petitions.length) {
    offset += limit;
    petitionsChunk = await request("/petitions", {
      query: new URLSearchParams({
        fromTemplateId: TEMPLATE_ID!,
        include: "recipients",
        status: "PENDING",
        limit: limit.toString(),
        offset: offset.toString(),
      }),
    });

    petitions.push(...petitionsChunk.items);
  }

  const remindersData = petitions.flatMap((p) =>
    p.recipients
      .filter((r) => r.status === "ACTIVE" && r.remindersLeft > 0)
      .map((r) => ({ petitionId: p.id, accessId: r.id })),
  );

  const errorLog: any[] = [];
  let i = 0;
  for (const remindersChunk of chunk(remindersData, 20)) {
    for (const reminder of remindersChunk) {
      try {
        console.log("sending reminder", ++i, "/", remindersData.length, JSON.stringify(reminder));
        await request(`/petitions/${reminder.petitionId}/recipients/${reminder.accessId}/remind`, {
          method: "POST",
          body: { message: null },
        });
      } catch (error) {
        console.error(error);
        errorLog.push({
          reminder,
          error: error instanceof Error ? error.message : JSON.stringify(error),
        });
      }
    }
    await waitFor(1_000);
  }

  if (errorLog.length > 0) {
    await writeFile("errorLog.json", JSON.stringify(errorLog, null, 2));
  }
}

run(main);
