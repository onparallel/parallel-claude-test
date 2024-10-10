import { mkdir } from "fs/promises";
import sanitize from "sanitize-filename";
import { fetchToFile } from "../utils/fetchToFile";
import { getAvailableFileName } from "../utils/getAvailableFileName";
import { run } from "../utils/run";
import { paginatedRequest, request } from "./helpers";

const TEMPLATE_ID = "6Y8DSH92uxPaJ4BZPFDrr";

async function main() {
  const DOWNLOAD = {
    zip: true,
    signature: false,
    audit: false,
  };
  const template = await request<{ name: string }>(`/templates/${TEMPLATE_ID}`);
  const output = `${__dirname}/output/${sanitize(template.name)}`;
  await mkdir(output, { recursive: true });
  for await (const { item: petition, totalCount, index } of paginatedRequest<{
    id: string;
    name: string;
    recipients: { id: string; contact: { fullName: string } }[];
    signatures: { id: string; status: string; environment: string }[];
  }>("/petitions", {
    query: new URLSearchParams({
      limit: `${50}`,
      fromTemplateId: TEMPLATE_ID,
      include: ["recipients", ...(DOWNLOAD.signature || DOWNLOAD.audit ? ["signatures"] : [])].join(
        ",",
      ),
    }),
  })) {
    console.log(`Downloading ${petition.id} ${petition.name} (${index + 1}/${totalCount})`);
    const name = `${petition.id} - ${petition.recipients[0]?.contact?.fullName ?? petition.name}`;
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
