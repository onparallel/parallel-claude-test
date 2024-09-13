import { Router } from "express";
import { Container } from "inversify";
import { BANKFLIP_DOCUMENT_PROCESSING_INTEGRATION } from "../integrations/document-processing/bankflip/BankflipDocumentProcessingIntegration";
import { IMANAGE_FILE_EXPORT_INTEGRATION } from "../integrations/file-export/imanage/IManageFileExportIntegration";
import { WebhookIntegration } from "../integrations/helpers/WebhookIntegration";
import { BANKFLIP_ID_VERIFICATION_INTEGRATION } from "../integrations/id-verification/bankflip/BankflipIdVerificationIntegration";
import {
  DOCUMENT_PROCESSING_SERVICE,
  IDocumentProcessingService,
} from "../services/DocumentProcessingService";
import { ID_VERIFICATION_SERVICE, IIdVerificationService } from "../services/IdVerificationService";

export function integrations(container: Container) {
  const router = Router();

  /* ID VERIFICATION */
  const bankflipIdVIntegration = container.get<WebhookIntegration<any>>(
    BANKFLIP_ID_VERIFICATION_INTEGRATION,
  );
  bankflipIdVIntegration.service = container.get<IIdVerificationService>(ID_VERIFICATION_SERVICE);
  router.use(bankflipIdVIntegration.WEBHOOK_API_PREFIX, bankflipIdVIntegration.handler());

  /* DOCUMENT PROCESSING */
  const bankflipDocumentProcessingIntegration = container.get<WebhookIntegration<any>>(
    BANKFLIP_DOCUMENT_PROCESSING_INTEGRATION,
  );
  bankflipDocumentProcessingIntegration.service = container.get<IDocumentProcessingService>(
    DOCUMENT_PROCESSING_SERVICE,
  );
  router.use(
    bankflipDocumentProcessingIntegration.WEBHOOK_API_PREFIX,
    bankflipDocumentProcessingIntegration.handler(),
  );

  /* FILE EXPORT */
  const iManageFileExportIntegration = container.get<WebhookIntegration<any>>(
    IMANAGE_FILE_EXPORT_INTEGRATION,
  );
  router.use(
    iManageFileExportIntegration.WEBHOOK_API_PREFIX,
    iManageFileExportIntegration.handler(),
  );

  return router;
}
