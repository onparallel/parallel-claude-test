import { createHmac, timingSafeEqual } from "crypto";
import { Request, Response, Router, json } from "express";
import { BankflipWebhookEvent } from "../services/BankflipService";
import { fromGlobalId } from "../util/globalId";

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

export const bankflip = Router()
  .post("/:orgId", json({ verify: verifyHMAC }), async (req, res, next) => {
    try {
      const body = req.body as BankflipWebhookEvent;
      if (body.name === "SESSION_COMPLETED") {
        await req.context.tasks.createTask({
          name: "BANKFLIP_SESSION_COMPLETED",
          input: {
            bankflip_session_id: body.payload.sessionId,
            org_id: fromGlobalId(req.params.orgId, "Organization").id,
          },
        });
      }

      res.sendStatus(200).end();
    } catch (error: any) {
      req.context.logger.error(error.message, { stack: error.stack });
      next(error);
    }
  })
  .post("/:orgId/retry", json({ verify: verifyHMAC }), async (req, res, next) => {
    try {
      const body = req.body as BankflipWebhookEvent;
      if (body.name === "SESSION_COMPLETED") {
        await req.context.tasks.createTask({
          name: "BANKFLIP_SESSION_COMPLETED",
          input: {
            bankflip_session_id: body.payload.sessionId,
            org_id: fromGlobalId(req.params.orgId, "Organization").id,
            retry_errors: true,
          },
        });
      }

      res.sendStatus(200).end();
    } catch (error: any) {
      req.context.logger.error(error.message, { stack: error.stack });
      next(error);
    }
  });
