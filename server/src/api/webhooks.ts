import { Router, urlencoded } from "express";
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
        handler?.(req.context, body, petitionId);
        res.sendStatus(200).end();
      } catch (error: any) {
        req.context.logger.error(error.message, { stack: error.stack });
        next(error);
      }
    }
  )
  // SCIM endpoints for User Provisioning
  .use("/scim", scim);
