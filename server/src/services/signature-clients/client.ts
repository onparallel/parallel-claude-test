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
  // TODO locales
  // locale: ContactLocale;
  locale: string;
  /**
   * Optional plain-text custom message to include in the "signature requested" emails
   */
  initialMessage?: string;
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
}

export const SIGNATURE_CLIENT = Symbol.for("SIGNATURE_CLIENT");

export interface ISignatureClient {
  configure(integrationId: number): void;
  startSignatureRequest: (
    petitionId: number,
    orgId: number,
    filePath: string,
    recipients: Recipient[],
    options: SignatureOptions
  ) => Promise<SignatureResponse>;
  cancelSignatureRequest: (externalId: string) => Promise<void>;
  downloadSignedDocument: (externalId: string) => Promise<Buffer>;
  downloadAuditTrail: (externalId: string) => Promise<Buffer>;
  sendPendingSignatureReminder: (signatureId: string) => Promise<void>;
  onOrganizationBrandChange?(orgId: number): Promise<void>;
}

export class CancelAbortedError extends Error {}
