import { Router } from "express";
import { appsumo } from "./appsumo";
import { bankflip } from "./bankflip";
import { scim } from "./scim";
import { docusignEventHandlers } from "./signature-events/docusign-event-handler";
import { signaturitEventHandlers } from "./signature-events/signaturit-event-handler";

export const webhooks = Router()
  // docusign events webhook
  .use("/docusign", docusignEventHandlers)
  // signaturit events webhook
  .use("/signaturit", signaturitEventHandlers)
  // bankflip webhook for ES_TAX_DOCUMENTS field completion
  .use("/bankflip/v2", bankflip)
  // SCIM endpoints for User Provisioning
  .use("/scim", scim)
  // AppSumo endpoints for product tiers purchase/upgrade/downgrade/refund
  .use("/appsumo", appsumo);
