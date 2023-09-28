import fetch from "node-fetch";
import { difference } from "remeda";
import { run } from "../utils/run";

/**
 * This script tags all petitions coming from the same template with tags that depend on one
 * of the replies to the petition
 */

const API_KEY = process.env.API_KEY;

const TEMPLATE_ID = "zas25KHxAByKXBfqRXS";
const TEMPLATE_FIELD_ID = "FDXxUofV6Q2DPnQMZxXwAFcfqTgoK";

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
      fromTemplateId: TEMPLATE_ID,
      limit: "1000",
      include: ["fields", "tags", "recipients"].join(","),
      tags: "",
    }),
  });
  for (const petition of petitions.items as any[]) {
    const field = petition.fields.find((f: any) => f.fromPetitionFieldId === TEMPLATE_FIELD_ID);
    const replies = field.replies?.[0]?.content?.map((r: string) =>
      r.replace(/^[\d_]+/, "").replace(/: .*$/, ""),
    );
    if (replies && replies.length > 0) {
      const tags = difference(replies, petition.tags) as string[];
      if (tags.length > 0) {
        console.log(`Tagging petition ${petition.id} with ${tags.join(", ")}`);
      }
      for (const tag of tags) {
        await request(`/petitions/${petition.id}/tags`, { method: "POST", body: { name: tag } });
      }
    }
  }
}

run(main);
