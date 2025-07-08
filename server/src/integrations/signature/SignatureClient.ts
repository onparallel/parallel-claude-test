import { ResolutionContext } from "inversify";
import { ContactLocale } from "../../db/__types";
import { IntegrationProvider } from "../../db/repositories/IntegrationRepository";
import { BaseClient } from "../helpers/BaseClient";

interface Document {
  id: string;
  decline_reason?: string;
  created_at: Date;
  file: {
    name: string;
    pages?: number;
    size: number;
  };
  events: {
    created_at: Date;
    type: string;
  }[];
  email: string;
  name: string;
  status: string;
}

export interface SignatureOptions {
  locale: ContactLocale;
  /**
   * Optional plain-text custom message to include in the "signature requested" emails
   */
  initialMessage?: string;
  signingMode: "PARALLEL" | "SEQUENTIAL";
}

export interface SignatureResponse {
  id: string;
  created_at: Date;
  data: any[];
  documents: Document[];
  url?: string;
}

export interface Recipient {
  email: string;
  name: string;
  signWithDigitalCertificate: boolean;
  signWithEmbeddedImageFileUploadId?: number;
}

export const SIGNATURE_CLIENT = Symbol.for("SIGNATURE_CLIENT");

export interface ISignatureClient extends BaseClient {
  getSignatureRequest: (externalId: string) => Promise<SignatureResponse>;
  startSignatureRequest: (
    petitionId: number,
    orgId: number,
    filePath: string,
    recipients: Recipient[],
    options: SignatureOptions,
  ) => Promise<SignatureResponse>;
  cancelSignatureRequest: (externalId: string) => Promise<void>;
  downloadSignedDocument: (externalId: string) => Promise<Buffer>;
  downloadAuditTrail: (externalId: string) => Promise<Buffer>;
  sendPendingSignatureReminder: (signatureId: string) => Promise<void>;
  onOrganizationBrandChange?(orgId: number): Promise<void>;
}

export class CancelAbortedError extends Error {}

export const SIGNATURE_CLIENT_FACTORY = Symbol.for("SIGNATURE_CLIENT_FACTORY");

export function getSignatureClientFactory(context: ResolutionContext) {
  return function signatureClientFactory(
    provider: IntegrationProvider<"SIGNATURE">,
    integrationId: number,
  ): ISignatureClient {
    const integration = context.get<ISignatureClient>(SIGNATURE_CLIENT, { name: provider });
    integration.configure(integrationId);
    return integration;
  };
}

export type SignatureClientFactory = ReturnType<typeof getSignatureClientFactory>;
