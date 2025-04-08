import { mkdir } from "fs/promises";
import pMap from "p-map";
import path from "path";
import { range } from "remeda";
import { fetchToFile } from "../utils/fetchToFile";
import { getAvailableFileName } from "../utils/getAvailableFileName";
import { run } from "../utils/run";
import { paginatedRequest } from "./helpers";

// const TEMPLATE_ID = "6Y8DSH92uxPaJ4BZPFDrr";

async function main() {
  const DOWNLOAD = {
    excel: true,
    zip: false,
    pdf: true,
    signature: false,
    audit: false,
  };
  // const template = await request<{ name: string }>(`/templates/${TEMPLATE_ID}`);
  // const output = `${__dirname}/output/${sanitize(template.name)}`;
  const output = `${__dirname}/output/growpro/`;
  await mkdir(output, { recursive: true });
  const petitions = paginatedRequest<{
    id: string;
    name: string;
    path: string;
    recipients: { id: string; contact: { fullName: string } }[];
    signatures: { id: string; status: string; environment: string }[];
  }>("/petitions", {
    query: new URLSearchParams({
      limit: `${50}`,
      // fromTemplateId: TEMPLATE_ID,
      include: ["recipients", ...(DOWNLOAD.signature || DOWNLOAD.audit ? ["signatures"] : [])].join(
        ",",
      ),
    }),
    initialOffset: 7236,
  });
  await pMap(
    range(0, 11391),
    async function () {
      const x = await petitions.next();
      if (x.done) {
        throw new Error("No more petitions");
      }
      const { item: petition, totalCount, index } = x.value;
      const dest = path.join(output, `.${petition.path}`);
      await mkdir(dest, { recursive: true });
      const name = petition.name ? `${petition.name} - ${petition.id}` : petition.id;
      if (DOWNLOAD.zip) {
        await fetchToFile(
          `https://www.onparallel.com/api/v1/petitions/${petition.id}/export?${new URLSearchParams({
            format: "zip",
          })}`,
          { headers: { Authorization: `Bearer ${process.env.API_KEY}` } },
          await getAvailableFileName(dest, name, ".zip"),
        );
      }
      if (DOWNLOAD.excel) {
        await fetchToFile(
          `https://www.onparallel.com/api/v1/petitions/${petition.id}/export?${new URLSearchParams({
            format: "excel",
          })}`,
          { headers: { Authorization: `Bearer ${process.env.API_KEY}` } },
          await getAvailableFileName(dest, name, ".xlsx"),
        );
      }
      if (DOWNLOAD.pdf) {
        await fetchToFile(
          `https://www.onparallel.com/api/v1/petitions/${petition.id}/export?${new URLSearchParams({
            format: "pdf",
          })}`,
          { headers: { Authorization: `Bearer ${process.env.API_KEY}` } },
          await getAvailableFileName(dest, name, ".pdf"),
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
      console.log(`Downloaded ${petition.id} ${petition.name} (${index + 1}/${totalCount})`);
    },
    { concurrency: 1 },
  );
}

run(main);
