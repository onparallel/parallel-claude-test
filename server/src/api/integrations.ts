import { Router } from "express";
import { Container } from "inversify";
import { WebhookIntegration } from "../integrations/helpers/WebhookIntegration";
import { BANKFLIP_ID_VERIFICATION_INTEGRATION } from "../integrations/id-verification/bankflip/BankflipIdVerificationIntegration";
import { ID_VERIFICATION_SERVICE, IIdVerificationService } from "../services/IdVerificationService";

export function integrations(container: Container) {
  const router = Router();

  const bankflipIdVIntegration = container.get<WebhookIntegration<any>>(
    BANKFLIP_ID_VERIFICATION_INTEGRATION,
  );
  bankflipIdVIntegration.service = container.get<IIdVerificationService>(ID_VERIFICATION_SERVICE);

  router.use(bankflipIdVIntegration.WEBHOOK_API_PREFIX, bankflipIdVIntegration.handler());

  return router;
}
