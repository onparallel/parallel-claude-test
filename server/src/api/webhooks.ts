import { Router, json, urlencoded } from "express";
import { fromGlobalId } from "../util/globalId";
import { scim } from "./scim";
import {
  SignaturItEventBody,
  signaturItEventHandler,
  validateSignaturitRequest,
} from "./webhook-event-handlers/signaturit-event-handler";

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
    // validate jwt from query
    // get reuslt from
    const result = body.payload.request.results.aeat_datos_fiscales.find(
      (doc) => doc.content_type === "application/pdf"
    );
    // get file from
    `${bankflipApiUrl}/file/${result.id}.pdf`;
    // create reply to field with keycode /fieldId from jwt
  })
  // SCIM endpoints for User Provisioning
  .use("/scim", scim);
