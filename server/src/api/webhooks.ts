import { json, Router, urlencoded } from "express";
import { JwtPayload, verify, VerifyOptions } from "jsonwebtoken";
import { promisify } from "util";
import { fromGlobalId } from "../util/globalId";
import { random } from "../util/token";
import { scim } from "./scim";
import {
  SignaturItEventBody,
  signaturItEventHandler,
  validateSignaturitRequest,
} from "./webhook-event-handlers/signaturit-event-handler";

type BankflipWebhookBody = {
  type: string;
  payload: {
    request: {
      id: string;
      user_id: string;
      webhook_url: string;
      results: {
        aeat_datos_fiscales: {
          id: string;
          user_id: string;
          extension: string;
          name: string;
          content_type: string;
        }[];
      };
      metadata: {};
    };
  };
};

export const webhooks = Router()
  .post(
    "/signaturit/:petitionId/events",
    urlencoded({ extended: true }),
    validateSignaturitRequest,
    async (req, res, next) => {
      try {
        const body = req.body as SignaturItEventBody;
        const handler = signaturItEventHandler(body.type);
        const petitionId = fromGlobalId(req.params.petitionId, "Petition").id;
        (async function () {
          try {
            await handler?.(req.context, body, petitionId);
          } catch (error: any) {
            req.context.logger.error(error.message, { stack: error.stack });
          }
        })();
        res.sendStatus(200).end();
      } catch (error: any) {
        req.context.logger.error(error.message, { stack: error.stack });
        next(error);
      }
    }
  )
  .post("/bankflip", json(), async (req, res, next) => {
    try {
      const token = req.query.token as string;
      const { keycode, fieldId: fieldGID } = await promisify<
        string,
        string,
        VerifyOptions,
        JwtPayload
      >(verify)(token, req.context.config.security.jwtSecret, {
        algorithms: ["HS256"],
        issuer: "parallel-server",
      });

      const fieldId = fromGlobalId(fieldGID, "PetitionField").id;

      const access = await req.context.petitions.loadAccessByKeycode(keycode);
      if (!access) {
        throw new Error(`Access with keycode ${keycode} not found`);
      }

      if (!(await req.context.petitions.fieldsBelongToPetition(access.petition_id, [fieldId]))) {
        throw new Error(
          `PetitionField:${fieldId} does not belong to Petition:${access.petition_id}`
        );
      }

      const contact = (await req.context.contacts.loadContact(access.contact_id))!;

      const body = req.body as BankflipWebhookBody;
      if (body.type === "request_succeeded") {
        const pdfDocument = body.payload.request.results.aeat_datos_fiscales.find(
          (d) => d.extension === "pdf"
        );
        if (!pdfDocument) {
          throw new Error(`Document not found`);
        }

        const pdfData = await req.context.fetch.fetch(
          `https://api.bankflip.io/file/${pdfDocument.id}.pdf`
        );

        const buffer = await pdfData.buffer();

        const path = random(16);
        const res = await req.context.aws.fileUploads.uploadFile(path, "application/pdf", buffer);
        const fileUpload = await req.context.files.createFileUpload(
          {
            path,
            content_type: "application/pdf",
            filename: `${pdfDocument.name}.${pdfDocument.extension}`,
            size: res["ContentLength"]!.toString(),
            upload_complete: true,
          },
          `Contact:${contact.id}`
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
    } catch {}

    res.sendStatus(200).end();
  })
  // SCIM endpoints for User Provisioning
  .use("/scim", scim);
