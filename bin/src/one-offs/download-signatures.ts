import sanitize from "sanitize-filename";
import { fetchToFile } from "../utils/fetchToFile";
import { run } from "../utils/run";
import { paginatedRequest } from "./helpers";

/**
 * This script downloads all signatures.
 */

async function main() {
  for await (const { item: petition, totalCount, index } of paginatedRequest<{
    id: string;
    name: string;
    signatures: { id: string; status: string; environment: string }[];
  }>("/petitions", {
    query: new URLSearchParams({
      limit: `${50}`,
      include: "signatures",
    }),
  })) {
    if (
      index > 27 &&
      petition.signatures.length > 0 &&
      petition.signatures[0].environment === "PRODUCTION" &&
      petition.signatures[0].status === "COMPLETED"
    ) {
      console.log(`Downloading ${petition.id} ${petition.name} (${index + 1}/${totalCount})`);
      await fetchToFile(
        `https://www.onparallel.com/api/v1/petitions/${petition.id}/signatures/${petition.signatures[0].id}/document`,
        { headers: { Authorization: `Bearer ${process.env.API_KEY}` } },
        `${__dirname}/rive/${sanitize((petition.name ?? petition.id).slice(0, 200))}.pdf`,
      );
      try {
        await fetchToFile(
          `https://www.onparallel.com/api/v1/petitions/${petition.id}/signatures/${petition.signatures[0].id}/audit`,
          { headers: { Authorization: `Bearer ${process.env.API_KEY}` } },
          `${__dirname}/rive/${sanitize((petition.name ?? petition.id).slice(0, 200))}_audit.pdf`,
        );
      } catch {}
    }
  }
}

run(main);
