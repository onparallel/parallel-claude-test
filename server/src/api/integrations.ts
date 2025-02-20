import { Router } from "express";
import { Container } from "inversify";
import {
  BANKFLIP_DOCUMENT_PROCESSING_INTEGRATION,
  BankflipDocumentProcessingIntegration,
} from "../integrations/document-processing/bankflip/BankflipDocumentProcessingIntegration";
import {
  IMANAGE_FILE_EXPORT_INTEGRATION,
  IManageFileExportIntegration,
} from "../integrations/file-export/imanage/IManageFileExportIntegration";
import {
  BANKFLIP_ID_VERIFICATION_INTEGRATION,
  BankflipIdVerificationIntegration,
} from "../integrations/id-verification/bankflip/BankflipIdVerificationIntegration";
import { DocusignIntegration } from "../integrations/signature/DocusignIntegration";
import { SignaturitIntegration } from "../integrations/signature/SignaturitIntegration";
import {
  DOCUMENT_PROCESSING_SERVICE,
  IDocumentProcessingService,
} from "../services/DocumentProcessingService";
import { ID_VERIFICATION_SERVICE, IIdVerificationService } from "../services/IdVerificationService";
import { ISignatureService, SIGNATURE } from "../services/SignatureService";

export function integrations(container: Container) {
  return Router()
    .use("/signature/signaturit", (req, res, next) => {
      const signaturitIntegration = container.get<SignaturitIntegration>(SignaturitIntegration);
      signaturitIntegration.service = container.get<ISignatureService>(SIGNATURE);
      signaturitIntegration.handler(req, res, next);
    })
    .use("/signature/docusign", (req, res, next) => {
      const docusignIntegration = container.get<DocusignIntegration>(DocusignIntegration);
      docusignIntegration.service = container.get<ISignatureService>(SIGNATURE);
      docusignIntegration.handler(req, res, next);
    })
    .use("/id-verification/bankflip", (req, res, next) => {
      const bankflipIdVIntegration = container.get<BankflipIdVerificationIntegration>(
        BANKFLIP_ID_VERIFICATION_INTEGRATION,
      );
      bankflipIdVIntegration.service =
        container.get<IIdVerificationService>(ID_VERIFICATION_SERVICE);
      bankflipIdVIntegration.handler(req, res, next);
    })
    .use("/document-processing/bankflip", (req, res, next) => {
      const bankflipDocumentProcessingIntegration =
        container.get<BankflipDocumentProcessingIntegration>(
          BANKFLIP_DOCUMENT_PROCESSING_INTEGRATION,
        );
      bankflipDocumentProcessingIntegration.service = container.get<IDocumentProcessingService>(
        DOCUMENT_PROCESSING_SERVICE,
      );
      bankflipDocumentProcessingIntegration.handler(req, res, next);
    })
    .use("/export/imanage", (req, res, next) => {
      const iManageFileExportIntegration = container.get<IManageFileExportIntegration>(
        IMANAGE_FILE_EXPORT_INTEGRATION,
      );
      iManageFileExportIntegration.handler(req, res, next);
    });
}
