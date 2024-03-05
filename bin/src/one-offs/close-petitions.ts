import { run } from "../utils/run";
import { paginatedRequest, request } from "./helpers";

/**
 * This script closes all petitions coming from the same template
 */

const TEMPLATE_IDS = ["zas25KHxAByKXKSsb6Q"];

async function main() {
  for await (const { item: petition, totalCount, index } of paginatedRequest<{ id: string }>(
    "/petitions",
    {
      query: new URLSearchParams({
        fromTemplateId: TEMPLATE_IDS.join(","),
        status: "COMPLETED",
        limit: `${100}`,
      }),
    },
  )) {
    console.log(`Closing petition ${petition.id} (${index + 1}/${totalCount})`);
    await request(`/petitions/${petition.id}/close`, { method: "POST" });
  }
}

run(main);
