import { json, Router } from "express";
import { ApiContext } from "../context";
import { fromGlobalId } from "../util/globalId";
import { verify } from "../util/jwt";
import { random } from "../util/token";

type BankflipDocument = {
  id: string;
  user_id: string;
  extension: string;
  name: string;
  content_type: string;
};

type BankflipWebhookBody = {
  type: string;
  payload: {
    request: {
      id: string;
      user_id: string;
      webhook_url: string;
      results: {
        aeat_datos_fiscales: BankflipDocument[];
      };
      metadata: {};
    };
  };
};

export const bankflip = Router()
  .use(json())
  // for public context. token contains keycode and fieldId
  .post("/public", async (req, res, next) => {
    try {
      const { keycode, fieldId: fieldGID } = await verify(
        req.query.token as string,
        req.context.config.security.jwtSecret
      );

      const fieldId = fromGlobalId(fieldGID, "PetitionField").id;

      const access = (await req.context.petitions.loadAccessByKeycode(keycode))!;
      const contact = (await req.context.contacts.loadContact(access.contact_id))!;

      const body = req.body as BankflipWebhookBody;
      if (body.type === "request_succeeded") {
        const pdfDocument = body.payload.request.results.aeat_datos_fiscales.find(
          (d) => d.extension === "pdf"
        );
        if (!pdfDocument) {
          throw new Error(`Document not found`);
        }

        const fileUpload = await uploadEsTaxDocumentsFile(
          pdfDocument,
          `Contact:${contact.id}`,
          req.context
        );

        await req.context.petitions.createPetitionFieldReply(
          {
            petition_field_id: fieldId,
            petition_access_id: access.id,
            type: "ES_TAX_DOCUMENTS",
            content: { file_upload_id: fileUpload.id },
          },
          contact
        );
      }
      res.sendStatus(200).end();
    } catch (error: any) {
      req.context.logger.error(error.message, { stack: error.stack });
      next(error);
    }
  })
  // for private context. token contains userId and fieldId
  .post("/private", async (req, res, next) => {
    try {
      const { userId: userGID, fieldId: fieldGID } = await verify(
        req.query.token as string,
        req.context.config.security.jwtSecret
      );

      const fieldId = fromGlobalId(fieldGID, "PetitionField").id;
      const userId = fromGlobalId(userGID, "User").id;
      const user = (await req.context.users.loadUser(userId))!;

      const body = req.body as BankflipWebhookBody;
      if (body.type === "request_succeeded") {
        const pdfDocument = body.payload.request.results.aeat_datos_fiscales.find(
          (d) => d.extension === "pdf"
        );
        if (!pdfDocument) {
          throw new Error(`Document not found`);
        }

        const fileUpload = await uploadEsTaxDocumentsFile(
          pdfDocument,
          `User:${userId}`,
          req.context
        );

        await req.context.petitions.createPetitionFieldReply(
          {
            petition_field_id: fieldId,
            user_id: userId,
            type: "ES_TAX_DOCUMENTS",
            content: { file_upload_id: fileUpload.id },
          },
          user
        );
      }
    } catch (error: any) {
      req.context.logger.error(error.message, { stack: error.stack });
      next(error);
    }

    res.sendStatus(200).end();
  });

async function uploadEsTaxDocumentsFile(
  document: BankflipDocument,
  uploadedBy: string,
  context: ApiContext
) {
  const pdfData = await context.fetch.fetch(`https://api.bankflip.io/file/${document.id}.pdf`);

  const buffer = await pdfData.buffer();
  const path = random(16);
  const res = await context.aws.fileUploads.uploadFile(path, "application/pdf", buffer);
  return await context.files.createFileUpload(
    {
      path,
      content_type: "application/pdf",
      filename: `${document.name}.pdf`,
      size: res["ContentLength"]!.toString(),
      upload_complete: true,
    },
    uploadedBy
  );
}
