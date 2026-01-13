import { run } from "../utils/run";
import { apiRequest, paginatedApiRequest } from "./apiHelpers";

async function main() {
  for await (const { item: profile } of paginatedApiRequest<{
    id: string;
    name: string;
    relationships: any[];
  }>("/profiles", {
    query: new URLSearchParams({
      limit: `${50}`,
      profileTypeIds: "NmPPpRMhHPG7wxmE555wCA",
      include: ["relationships"].join(","),
    }),
  })) {
    const relationship = profile.relationships.find((r) => r.profile.id === "zcpwmWtjw938xEfThwK");
    if (relationship) {
      console.log(
        `Deleting relationship ${relationship.id} for profile ${profile.id} (${profile.name})`,
      );
      await apiRequest(`/profiles/${profile.id}/relationships/${relationship.id}`, {
        method: "DELETE",
      });
    }
  }
}

run(main);
