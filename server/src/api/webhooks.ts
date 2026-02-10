import { Request, RequestHandler, Router } from "express";
import getRawBody from "raw-body";
import { appsumo } from "./appsumo";
import { bankflip } from "./bankflip";
import { scim } from "./scim";

export const webhooks = Router()
  // TODO: remove this after all old signatures are completed
  .use(
    "/docusign/:petitionId/events",
    redirect(
      (req) =>
        `http://localhost:4000/api/integrations/signature/docusign/${req.params.petitionId}/events`,
    ),
  )
  .use(
    "/signaturit/:petitionId/events",
    redirect(
      (req) =>
        `http://localhost:4000/api/integrations/signature/signaturit/${req.params.petitionId}/events`,
    ),
  )
  // bankflip webhook for ES_TAX_DOCUMENTS field completion
  .use("/bankflip/v2", bankflip)
  // SCIM endpoints for User Provisioning
  .use("/scim", scim)
  // AppSumo endpoints for product tiers purchase/upgrade/downgrade/refund
  .use("/appsumo", appsumo);

function redirect(url: (req: Request) => string): RequestHandler {
  return async (req, res) => {
    const headers = { ...req.headers } as any;
    req.context.logger.info(JSON.stringify(headers, null, 2));
    delete headers["expect"];
    const response = await fetch(url(req), {
      method: req.method,
      headers,
      body: await getRawBody(req, { encoding: true }),
    });
    response.headers.forEach((value, name) => res.setHeader(name, value));
    res.status(response.status).send(response.body);
  };
}
