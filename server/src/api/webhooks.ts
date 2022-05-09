import { Router, urlencoded } from "express";
import { fromGlobalId } from "../util/globalId";
import { appsumo } from "./appsumo";
import { bankflip } from "./bankflip";
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
  // bankflip webhook for ES_TAX_DOCUMENTS field completion
  .use("/bankflip", bankflip)
  // SCIM endpoints for User Provisioning
  .use("/scim", scim)
  // AppSumo endpoints for product tiers purchase/upgrade/downgrade/refund
  .use("/appsumo", appsumo);
