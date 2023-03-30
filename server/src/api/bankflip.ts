import { createHmac, timingSafeEqual } from "crypto";
import { json, Request, Response, Router } from "express";
import {
  ModelExtractedWebhookEvent,
  SessionCompletedWebhookEvent,
} from "../services/BankflipService";

type BankflipWebhookBody = ModelExtractedWebhookEvent | SessionCompletedWebhookEvent;

const verifyHMAC = (req: Request, _: Response, buffer: Buffer) => {
  const secret = req.context.bankflip.webhookSecret(req.params.orgId);
  const requestUri = `https://${req.hostname}${req.originalUrl}`;
  const requestMethod = req.method;
  const requestBody = buffer.toString();
  const timestamp = req.headers["x-signature-timestamp"] as string;
  const requestSignature = req.headers["x-signature-v1"] as string;

  const hash = createHmac("sha256", Buffer.from(secret, "base64"))
    .update(Buffer.from(requestMethod + requestUri + requestBody + timestamp))
    .digest();

  if (!timingSafeEqual(Buffer.from(requestSignature, "base64"), hash)) {
    throw new Error("HMAC signature verification failed");
  }
};

export const bankflip = Router().post(
  "/:orgId",
  json({ verify: verifyHMAC }),
  async (req, res, next) => {
    try {
      const body = req.body as BankflipWebhookBody;
      if (body.name === "SESSION_COMPLETED") {
        await req.context.bankflip.sessionCompleted(req.params.orgId, body);
      }

      res.sendStatus(200).end();
    } catch (error: any) {
      req.context.logger.error(error.message, { stack: error.stack });
      next(error);
    }
  }
);
