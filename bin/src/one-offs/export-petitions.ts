import { fetchToFile } from "../utils/fetchToFile";
import { getAvailableFileName } from "../utils/getAvailableFileName";
import { run } from "../utils/run";
import { paginatedRequest } from "./helpers";

/**
 * This script downloads all signatures.
 */

async function main() {
  const DOWNLOAD = {
    zip: true,
    signature: false,
    audit: false,
  };
  const output = `${__dirname}/output`;
  for await (const { item: petition, totalCount, index } of paginatedRequest<{
    id: string;
    name: string;
    recipients: { id: string; contact: { fullName: string } }[];
    signatures: { id: string; status: string; environment: string }[];
  }>("/petitions", {
    query: new URLSearchParams({
      limit: `${50}`,
      fromTemplateId: "6Y8DSH92uxPaJ4BZKrdNM",
      include: ["recipients", ...(DOWNLOAD.signature || DOWNLOAD.audit ? ["signatures"] : [])].join(
        ",",
      ),
    }),
  })) {
    console.log(`Downloading ${petition.id} ${petition.name} (${index + 1}/${totalCount})`);
    const name = petition.recipients[0]?.contact?.fullName ?? petition.name ?? petition.id;
    if (DOWNLOAD.zip) {
      await fetchToFile(
        `https://www.onparallel.com/api/v1/petitions/${petition.id}/export?${new URLSearchParams({
          format: "zip",
        })}`,
        { headers: { Authorization: `Bearer ${process.env.API_KEY}` } },
        await getAvailableFileName(output, name, ".zip"),
      );
    }
    if (
      (DOWNLOAD.signature || DOWNLOAD.audit) &&
      petition.signatures.length > 0 &&
      petition.signatures[0].environment === "PRODUCTION" &&
      petition.signatures[0].status === "COMPLETED"
    ) {
      await fetchToFile(
        `https://www.onparallel.com/api/v1/petitions/${petition.id}/signatures/${petition.signatures[0].id}/document`,
        { headers: { Authorization: `Bearer ${process.env.API_KEY}` } },
        await getAvailableFileName(output, name, ".pdf"),
      );
      try {
        await fetchToFile(
          `https://www.onparallel.com/api/v1/petitions/${petition.id}/signatures/${petition.signatures[0].id}/audit`,
          { headers: { Authorization: `Bearer ${process.env.API_KEY}` } },
          await getAvailableFileName(output, name + " AUDIT", ".pdf"),
        );
      } catch {}
    }
  }
}

run(main);
