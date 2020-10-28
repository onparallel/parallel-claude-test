import { Router } from "express";
import bodyParser from "body-parser";
import {
  signaturItEventHandler,
  SignaturItEventBody,
} from "./webhook-event-handlers/signaturit-event-handler";
import { fromGlobalId } from "../util/globalId";

export const webhooks = Router()
  .get("/ping", async (_, res) => {
    // used to check localtunnel status on develop
    res.sendStatus(200).end();
  })
  .post(
    "/signaturit/:petitionId/events",
    bodyParser.urlencoded({ extended: true }),
    async (req, res, next) => {
      try {
        const body = req.body as SignaturItEventBody;
        const handler = signaturItEventHandler[body.type];
        const petitionId = fromGlobalId(req.params.petitionId, "Petition").id;
        await handler?.(petitionId, body, req.context);
        res.sendStatus(200).end();
      } catch (error) {
        next(error);
      }
    }
  );
