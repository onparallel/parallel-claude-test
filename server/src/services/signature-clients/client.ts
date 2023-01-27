import { Tone } from "../../emails/utils/types";
import { BrandTheme } from "../../util/BrandTheme";
import { PdfDocumentTheme } from "../../util/PdfDocumentTheme";

interface Document {
  id: string;
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
  locale: string;
  templateData?: {
    logoUrl: string;
    logoAlt: string;
    parallelUrl: string;
    assetsUrl: string;
    removeParallelBranding: boolean;
    theme: BrandTheme;
    organizationName?: string;
  };
  /** (Signaturit) show a security stamp on the margin of each page of the document */
  showCsv?: boolean;
  signingMode?: "parallel" | "sequential";
  pdfDocumentTheme: PdfDocumentTheme;
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

export type BrandingIdKey = `${"EN" | "ES"}_${Tone}_BRANDING_ID`;

export type BrandingOptions = Pick<SignatureOptions, "locale" | "templateData" | "showCsv">;

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
  updateBranding(brandingId: string, opts: BrandingOptions): Promise<void>;
}
