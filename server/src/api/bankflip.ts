import { json, Router } from "express";
import { ApiContext } from "../context";
import { Contact, User } from "../db/__types";
import { fromGlobalId } from "../util/globalId";
import { verify } from "../util/jwt";
import { random } from "../util/token";
import { Maybe } from "../util/types";

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

type TokenPayload = { userId: string; fieldId: string } | { accessId: string; fieldId: string };

export const bankflip = Router()
  .use(json())
  .post("/", async (req, res, next) => {
    try {
      const payload = await verify<TokenPayload>(
        req.query.token as string,
        req.context.config.security.jwtSecret
      );

      const fieldId = fromGlobalId(payload.fieldId, "PetitionField").id;
      let user: Maybe<User> = null;
      let contact: Maybe<Contact> = null;
      if ("userId" in payload) {
        const userId = fromGlobalId(payload.userId, "User").id;
        user = await req.context.users.loadUser(userId);
      } else {
        const accessId = fromGlobalId(payload.accessId, "PetitionAccess").id;
        contact = await req.context.contacts.loadContactByAccessId(accessId);
      }
      if (!user && !contact) {
        throw new Error(`User or Contact not found on payload: ${JSON.stringify(payload)}`);
      }
      const body = req.body as BankflipWebhookBody;
      if (body.type === "request_succeeded") {
        const pdfDocument = body.payload.request.results.aeat_datos_fiscales.find(
          (d) => d.extension === "pdf"
        );
        if (!pdfDocument) {
          throw new Error(`Document not found`);
        }

        const createdBy = user ? `User:${user.id}` : `Contact:${contact!.id}`;
        const fileUpload = await uploadEsTaxDocumentsFile(pdfDocument, createdBy, req.context);

        const data =
          "userId" in payload
            ? { user_id: fromGlobalId(payload.userId, "User").id }
            : { petition_access_id: fromGlobalId(payload.accessId, "PetitionAccess").id };

        await req.context.petitions.createPetitionFieldReply(
          {
            petition_field_id: fieldId,
            type: "ES_TAX_DOCUMENTS",
            content: { file_upload_id: fileUpload.id },
            ...data,
          },
          user ?? contact!
        );
      }
      res.sendStatus(200).end();
    } catch (error: any) {
      req.context.logger.error(error.message, { stack: error.stack });
      next(error);
    }
  });

async function uploadEsTaxDocumentsFile(
  document: BankflipDocument,
  uploadedBy: string,
  context: ApiContext
) {
  const pdfData = await context.fetch.fetch(`https://api.bankflip.io/file/${document.id}.pdf`);

  const buffer = await pdfData.buffer();
  const path = random(16);
  const res = await context.storage.fileUploads.uploadFile(path, "application/pdf", buffer);
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
