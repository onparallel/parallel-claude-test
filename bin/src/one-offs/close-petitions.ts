import { run } from "../utils/run";
import { paginatedRequest, request } from "./helpers";

/**
 * This script closes all petitions coming from the same template
 */

const TEMPLATE_IDS = ["6Y8DSH92uxPaJ4B9vf9XU"];

async function main() {
  for await (const { item: petition, totalCount, index } of paginatedRequest<{ id: string }>(
    "/petitions",
    {
      query: new URLSearchParams({
        fromTemplateId: TEMPLATE_IDS.join(","),
        status: "PENDING,COMPLETED",
        limit: `${100}`,
      }),
    },
  )) {
    console.log(`Closing petition ${petition.id} (${index + 1}/${totalCount})`);
    await request(`/petitions/${petition.id}/close`, { method: "POST" });
  }
}

run(main);
