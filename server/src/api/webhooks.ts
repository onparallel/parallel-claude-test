import { json, Router } from "express";
import bodyParser from "body-parser";
import {
  signaturItEventHandler,
  SignaturItEventBody,
  validateSignaturitRequest,
} from "./webhook-event-handlers/signaturit-event-handler";
import { fromGlobalId } from "../util/globalId";
import { scim, authenticateOrganization, validateExternalId } from "./scim";

export const webhooks = Router()
  .get("/ping", async (_, res) => {
    // used to check localtunnel status on develop
    res.sendStatus(200).end();
  })
  .post(
    "/signaturit/:petitionId/events",
    bodyParser.urlencoded({ extended: true }),
    validateSignaturitRequest,
    async (req, res, next) => {
      try {
        const body = req.body as SignaturItEventBody;
        const handler = signaturItEventHandler(body.type);
        const petitionId = fromGlobalId(req.params.petitionId, "Petition").id;
        handler?.(petitionId, body, req.context);
        res.sendStatus(200).end();
      } catch (error) {
        next(error);
      }
    }
  )
  // SCIM endpoints for User Provisioning
  .use(
    "/scim",
    json({ type: "application/scim+json" }),
    authenticateOrganization,
    validateExternalId,
    scim
  );
