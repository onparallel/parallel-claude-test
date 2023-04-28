import "./init";
//
import { Knex } from "knex";
import fetch from "node-fetch";
import pMap from "p-map";
import yargs from "yargs";
import { CONFIG, Config } from "./config";
import { createContainer } from "./container";
import { KNEX } from "./db/knex";
import { FileRepository } from "./db/repositories/FileRepository";
import { PetitionRepository } from "./db/repositories/PetitionRepository";
import { PetitionFieldReply } from "./db/__types";
import { IStorageService, STORAGE_SERVICE } from "./services/StorageService";
import { random } from "./util/token";
import { groupBy, isDefined } from "remeda";

async function main() {
  const container = createContainer();
  const storage = container.get<IStorageService>(STORAGE_SERVICE);
  const files = container.get<FileRepository>(FileRepository);
  const petitionRepo = container.get<PetitionRepository>(PetitionRepository);
  const config = container.get<Config>(CONFIG);
  const db = container.get<Knex>(KNEX);

  const { dryrun, one } = await yargs
    .option("dryrun", {
      required: false,
      type: "boolean",
      description: "only lists documents to be downloaded and created as reply",
    })
    .option("one", {
      required: false,
      type: "boolean",
      description: "stops on the first document",
    }).argv;

  // fetch replies for models containing more than one optional parameter
  const replies: PetitionFieldReply[] = await db.transaction(async (t) => {
    const data = await t.raw(/* sql */ `
        select * from petition_field_reply pfr 
        where type = 'ES_TAX_DOCUMENTS' 
        and deleted_at is null 
        and content->'error' is null 
        and content->'request'->>'type' in (
        'AEAT_111_IRPF_RENDIMIENTOS_TRABAJO_AUTOLIQUIDACION',
        'AEAT_115_IRPF_RENDIMIENTO_INMUEBLES',
        'AEAT_130_IRPF_DIRECTA',
        'AEAT_131_IRPF_OBJETIVA',
        'AEAT_303_IVA_AUTOLIQUIDACION',
        'AEAT_309_IVA_LIQUIDACION_NO_PERIODICA',
        'AEAT_349_IVA_OPERACIONES_INTRACOMUNITARIAS'
        )
        and content->'bankflip_session_id' is not null;
    `);
    return data.rows;
  });

  const groupedReplies = groupBy(replies, (r) =>
    [r.petition_field_id, r.content.request.type].join("_")
  );

  const missingDocuments = (
    await pMap(
      // more than 1 reply of the same request type is assumed to be a complete reply (e.g.: the 4 quarters of a given model)
      // this ensures we only process incomplete replies (all models are supposed to have at least 1 document)
      Object.values(groupedReplies).filter((r) => r.length === 1),
      async ([row]) => {
        const bankflipSession = await (
          await fetch(
            `https://core.bankflip.io/session/${row.content.bankflip_session_id}/summary`,
            {
              headers: {
                Authorization: `Bearer ${config.bankflip.saldadosApiKey}`,
              },
            }
          )
        ).json();

        const requestDocuments = bankflipSession.modelRequestOutcomes
          .find((o: any) => o.modelRequest.model.type === row.content.request.type)
          .documents.filter((d: any) => d.extension === "pdf" || d.extension === "json");

        // if the session has only 1 document, it will be the same as the already created reply
        if (requestDocuments.length === 1) {
          return null;
        }

        return {
          old_petition_field_reply_id: row.id,
          old_file_upload_id: row.content.file_upload_id,
          petition_field_id: row.petition_field_id,
          petition_access_id: row.petition_access_id,
          user_id: row.user_id,
          created_by: row.created_by,
          documents: requestDocuments,
        };
      },
      { concurrency: 1 }
    )
  ).filter(isDefined);

  console.log(
    "missing documents, total:",
    missingDocuments.length,
    JSON.stringify(missingDocuments.slice(0, one ? 1 : undefined), null, 2)
  );

  if (!dryrun) {
    console.log("creating new replies...", one ? "(only 1)" : "");

    await pMap(
      // upload only the first if passing --one
      missingDocuments.slice(0, one ? 1 : undefined),
      async (d, index) => {
        console.log(`${index + 1}/${missingDocuments.slice(0, one ? 1 : undefined).length}`);

        const docsByRequestModel = groupBy(d.documents, (d: any) =>
          [d.model.type, d.model.year, d.model.quarter, d.model.month, d.model.licensePlate]
            .filter(isDefined)
            .join("_")
        );

        // each request model can have many docs, one per extension. in this case we only use pdf and json
        // each modelDoc on this loop will result in 1 PetitionFieldReply
        for (const modelDocs of Object.values(docsByRequestModel)) {
          const pdfDoc = modelDocs.find((doc: any) => doc.extension === "pdf");
          const jsonDoc = modelDocs.find((doc: any) => doc.extension === "json");
          const pdfBuffer = await downloadPdf(pdfDoc, config.bankflip.saldadosApiKey);
          const jsonContents = await downloadJson(jsonDoc, config.bankflip.saldadosApiKey);

          const path = random(16);
          const res = await storage.fileUploads.uploadFile(path, "application/pdf", pdfBuffer);
          const [file] = await files.createFileUpload(
            {
              path,
              content_type: "application/pdf",
              filename: `${pdfDoc.name}.pdf`,
              size: res["ContentLength"]!.toString(),
              upload_complete: true,
            },
            d.created_by!
          );

          await petitionRepo.createPetitionFieldReply(
            d.petition_field_id,
            {
              petition_access_id: d.petition_access_id,
              user_id: d.user_id,
              created_by: d.created_by,
              type: "ES_TAX_DOCUMENTS",
              status: "PENDING",
              content: {
                request: pdfDoc.model,
                json_contents: jsonContents,
                file_upload_id: file.id,
                bankflip_session_id: pdfDoc.sessionId,
              },
            },
            d.created_by!
          );
        }

        await db
          .from("file_upload")
          .where({ id: d.old_file_upload_id, deleted_at: null })
          .update({ deleted_at: new Date(), deleted_by: "" });
        await db
          .from("petition_field_reply")
          .where({ id: d.old_petition_field_reply_id, deleted_at: null })
          .update({ deleted_at: new Date(), deleted_by: "" });
      },
      { concurrency: 1 }
    );
  }
  await db.destroy();
  console.log("DONE!");
}

main().then();

async function downloadPdf(document: any, apiKey: string): Promise<Buffer> {
  if (document.extension !== "pdf") {
    throw new Error(`Document is not a PDF: ${JSON.stringify(document)}`);
  }
  const data = await fetch(`https://core.bankflip.io/document/${document.id}/content`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });
  return await data.buffer();
}

async function downloadJson(document: any, apiKey: string): Promise<any> {
  if (document.extension !== "json") {
    console.warn(`Document is not a JSON: ${JSON.stringify(document)}`);
    return null;
  }

  const data = await fetch(`https://core.bankflip.io/document/${document.id}/content`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });
  return await data.json();
}
