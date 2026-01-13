import { run } from "../utils/run";
import { apiRequest, paginatedApiRequest } from "./apiHelpers";

/**
 * This script closes all petitions coming from the same template
 */

const TEMPLATE_IDS = ["6Y8DSH92uxPaJ4BA7uMNQ"];

async function main() {
  for await (const { item: petition, totalCount, index } of paginatedApiRequest<{ id: string }>(
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
    await apiRequest(`/petitions/${petition.id}/close`, { method: "POST" });
  }
}

run(main);
