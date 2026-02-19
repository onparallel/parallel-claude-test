import { run } from "../utils/run";
import { apiRequest } from "./apiHelpers";

const offset = process.env.OFFSET ? parseInt(process.env.OFFSET) : 0;

async function main() {
  let totalCount = 0;
  do {
    // always fetch profiles with offset 0, as this script will delete profiles
    // break condition is when there are no more profiles to delete
    const result = await apiRequest<{ items: { id: string }[]; totalCount: number }>("/profiles", {
      query: new URLSearchParams([
        ["profileTypeId", "6YHC3CN5M8QLoqmV9eJqk"],
        ["status", "OPEN"],
        ["limit", "100"],
        ["offset", `${offset}`],
        ["values[0][alias]", "marker"],
        ["values[0][operator]", "EQUAL"],
        ["values[0][value]", "X"],
      ]),
    });
    totalCount = result.totalCount;
    console.debug(`Fetched ${offset}-${offset + result.items.length}/${totalCount}`);

    if (result.items.length === 0) {
      break;
    }

    for (const item of result.items) {
      console.log(`Closing profile ${item.id}`);
      await apiRequest(`/profiles/${item.id}/close`, { method: "POST" });

      console.log(`Deleting profile ${item.id}`);
      await apiRequest(`/profiles/${item.id}`, { method: "DELETE" });
    }
  } while (totalCount > 0);
}

run(main);
