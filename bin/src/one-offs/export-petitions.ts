import { mkdir } from "fs/promises";
import path from "path";
import sanitize from "sanitize-filename";
import { getAvailableFileName } from "../utils/getAvailableFileName";
import { run } from "../utils/run";
import { apiFetchToFile, paginatedApiRequest } from "./apiHelpers";

async function main() {
  const DOWNLOAD = {
    excel: false,
    zip: true,
    pdf: false,
    signature: false,
    audit: false,
  };
  const petitions = paginatedApiRequest<{
    id: string;
    name: string;
    path: string;
    recipients: { id: string; contact: { fullName: string } }[];
    signatures: { id: string; status: string; environment: string }[];
  }>("/petitions", {
    query: new URLSearchParams({
      limit: `${50}`,
      status: "COMPLETED",
      fromTemplateId: ["6Y8DSH92uxPaJ4p5ybj7Y", "6Y8DSH92uxPaJ4ooVzRNM"].join(","),
      include: ["recipients", ...(DOWNLOAD.signature || DOWNLOAD.audit ? ["signatures"] : [])].join(
        ",",
      ),
    }),
  });
  const output = `${__dirname}/output/`;
  for await (const { item: petition, totalCount, index } of petitions) {
    // modify accordingly
    const dest = path.join(output, `/${petition.name}`);
    await mkdir(dest, { recursive: true });
    const name = sanitize(petition.recipients[0].contact.fullName).slice(0, 255);
    if (DOWNLOAD.zip) {
      await apiFetchToFile(
        `/petitions/${petition.id}/export`,
        await getAvailableFileName(dest, name, ".zip"),
        { query: new URLSearchParams({ format: "zip" }) },
      );
    }
    if (DOWNLOAD.excel) {
      await apiFetchToFile(
        `/petitions/${petition.id}/export`,
        await getAvailableFileName(dest, name, ".xlsx"),
        { query: new URLSearchParams({ format: "excel" }) },
      );
    }
    if (DOWNLOAD.pdf) {
      await apiFetchToFile(
        `/petitions/${petition.id}/export`,
        await getAvailableFileName(dest, name, ".pdf"),
        { query: new URLSearchParams({ format: "pdf" }) },
      );
    }
    if (
      (DOWNLOAD.signature || DOWNLOAD.audit) &&
      petition.signatures.length > 0 &&
      petition.signatures[0].environment === "PRODUCTION" &&
      petition.signatures[0].status === "COMPLETED"
    ) {
      await apiFetchToFile(
        `/petitions/${petition.id}/signatures/${petition.signatures[0].id}/document`,
        await getAvailableFileName(output, name, ".pdf"),
      );
      await apiFetchToFile(
        `/petitions/${petition.id}/signatures/${petition.signatures[0].id}/audit`,
        await getAvailableFileName(output, name + " AUDIT", ".pdf"),
      );
    }
    console.log(`Downloaded ${petition.id} ${petition.name} (${index + 1}/${totalCount})`);
  }
}

run(main);
