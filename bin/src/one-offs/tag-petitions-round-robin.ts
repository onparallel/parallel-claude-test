import fetch from "node-fetch";
import { run } from "../utils/run";

const API_KEY = process.env.API_KEY;

const TEMPLATE_IDS = ["4exV9AsWJrjj7okeL"];
const TAGS = ["A", "B"];

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
      limit: "1000",
      tags: "",
    }),
  });
  let i = 0;
  for (const petition of petitions.items as any[]) {
    const tag = TAGS[i++ % TAGS.length];

    console.log(`Tagging petition ${petition.id} with ${tag} (${i}/${petitions.totalCount})`);
    await request(`/petitions/${petition.id}/tags`, { method: "POST", body: { name: tag } });
  }
}

run(main);
