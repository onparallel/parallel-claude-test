import {
  IntegrationSettings,
  SignatureProvider,
} from "../../db/repositories/IntegrationRepository";
import { Tone } from "../../emails/utils/types";
import { BrandTheme } from "../../util/BrandTheme";
import { PdfDocumentTheme } from "../../util/PdfDocumentTheme";

type Document = {
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
};

export type SignatureOptions = {
  locale: string;
  templateData?: {
    logoUrl: string;
    logoAlt: string;
    parallelUrl: string;
    assetsUrl: string;
    removeParallelBranding: boolean;
    theme: BrandTheme;
  };
  events_url?: string;
  signingMode?: "parallel" | "sequential";
  pdfDocumentTheme: PdfDocumentTheme;
  /**
   * Optional plain-text custom message to include in the "signature requested" emails
   */
  initialMessage?: string;
};

export type SignatureResponse = {
  id: string;
  created_at: Date;
  data: any[];
  documents: Document[];
  url?: string;
};

export type Recipient = { email: string; name: string };

export type BrandingIdKey = `${"EN" | "ES"}_${Tone}_BRANDING_ID`;

type AuthenticationResponse<TProvider extends SignatureProvider = any> = {
  SIGNATURIT: { environment: "production" | "sandbox" };
}[TProvider];

export const SIGNATURE_CLIENT = Symbol.for("SIGNATURE_CLIENT");

export interface ISignatureClient<TProvider extends SignatureProvider> {
  configure(integration: {
    id?: number;
    settings: IntegrationSettings<"SIGNATURE", TProvider>;
  }): void;
  authenticate(): Promise<AuthenticationResponse<TProvider>>;
  startSignatureRequest: (
    petitionId: string,
    orgId: string,
    filePath: string,
    recipients: Recipient[],
    options: SignatureOptions
  ) => Promise<SignatureResponse>;
  cancelSignatureRequest: (externalId: string) => Promise<SignatureResponse>;
  downloadSignedDocument: (externalId: string) => Promise<Buffer>;
  downloadAuditTrail: (externalId: string) => Promise<Buffer>;
  sendPendingSignatureReminder: (signatureId: string) => Promise<SignatureResponse>;
  updateBranding(
    brandingId: string,
    opts: Pick<SignatureOptions, "locale" | "templateData">
  ): Promise<string>;
}
