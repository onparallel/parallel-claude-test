import fetch from "node-fetch";
import { run } from "../utils/run";

/**
 * This script closes all petitions coming from the same template
 */

const API_KEY = process.env.API_KEY;

const TEMPLATE_IDS = ["zas25KHxAByKXKSsb6Q"];

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
  return await res.json();
}

async function main() {
  const petitions = await request("/petitions", {
    query: new URLSearchParams({
      fromTemplateId: TEMPLATE_IDS.join(","),
      status: "COMPLETED",
      limit: "1000",
    }),
  });
  let i = 0;
  for (const petition of petitions.items as any[]) {
    if (petition.status !== "CLOSED") {
      console.log(`Closing petition ${petition.id} (${++i}/${petitions.totalCount})`);
      await request(`/petitions/${petition.id}/close`, { method: "POST" });
    }
  }
}

run(main);
