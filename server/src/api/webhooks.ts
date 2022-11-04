import { Router } from "express";
import { appsumo } from "./appsumo";
import { bankflip } from "./bankflip";
import { scim } from "./scim";
import { signaturitEventHandlers } from "./webhook-event-handlers/signaturit-event-handler";

export const webhooks = Router()
  .use("/signaturit", signaturitEventHandlers)
  // bankflip webhook for ES_TAX_DOCUMENTS field completion
  .use("/bankflip", bankflip)
  // SCIM endpoints for User Provisioning
  .use("/scim", scim)
  // AppSumo endpoints for product tiers purchase/upgrade/downgrade/refund
  .use("/appsumo", appsumo);
