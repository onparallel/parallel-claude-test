import { injectable, inject } from "inversify";
import "reflect-metadata";
import SignaturitSDK, {
  BrandingParams,
  BrandingResponse,
} from "signaturit-sdk";
import {
  IntegrationRepository,
  SignatureIntegrationSettings,
} from "../db/repositories/IntegrationRepository";
import { getBaseWebhookUrl } from "../workers/helpers/getBaseWebhookUrl";
import { CONFIG, Config } from "./../config";
import { sign, verify } from "jsonwebtoken";
import { removeNotDefined } from "../util/remedaExtensions";
import { EventEmitter } from "events";
import { buildEmail } from "../emails/buildEmail";
import SignatureRequestedEmail from "../emails/components/SignatureRequestedEmail";
import SignatureCompletedEmail from "../emails/components/SignatureCompletedEmail";
import SignatureCancelledEmail from "../emails/components/SignatureCancelledEmail";
import { OrgIntegration } from "../db/__types";

type SignerBox = {
  email?: string;
  box?: {
    top: number;
    left: number;
    height: number;
    width: number;
  };
};

export type SignatureOptions = {
  locale: string;
  templateData?: {
    senderFirstName: string;
    logoUrl: string;
    logoAlt: string;
    documentName: string;
  };
  events_url?: string;
  signingMode?: "parallel" | "sequential";
  /**
   *  Each element on the array represents a page in the document.
   *  Inside each page, there's an array with the signers information.
   */
  signatureBoxPositions?: Array<SignerBox[]>;
};

type SignatureResponse = {
  id: string;
  created_at: Date;
  data: any[];
  documents: Document[];
  url?: string;
};

export type Recipient = { email: string; name: string };

type SignaturitIntegrationSettings = SignatureIntegrationSettings<"SIGNATURIT">;

export interface ISignatureClient {
  startSignatureRequest: (
    petitionId: string,
    filePath: string,
    recipients: Recipient[],
    options: SignatureOptions
  ) => Promise<SignatureResponse>;

  cancelSignatureRequest: (externalId: string) => Promise<SignatureResponse>;
  downloadSignedDocument: (externalId: string) => Promise<Buffer>;
}

export const SIGNATURE = Symbol.for("SIGNATURE");
@injectable()
export class SignatureService {
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(IntegrationRepository)
    private integrationRepository: IntegrationRepository
  ) {}
  public getClient(integration: OrgIntegration): ISignatureClient {
    switch (integration.provider.toUpperCase()) {
      case "SIGNATURIT":
        return this.buildSignaturItClient(integration);
      default:
        throw new Error(
          `Couldn't resolve signature client: ${integration.provider}`
        );
    }
  }

  public generateAuthToken(payload: any) {
    return sign(payload, this.config.signature.jwtSecret, {
      expiresIn: 30,
      issuer: "signature-service",
      algorithm: "HS256",
    });
  }

  public verifyAuthToken(token: string) {
    try {
      verify(token, this.config.signature.jwtSecret, {
        algorithms: ["HS256"],
        issuer: "signature-service",
      });
      return true;
    } catch {
      return false;
    }
  }

  private buildSignaturItClient(integration: OrgIntegration): SignaturItClient {
    const settings = integration.settings as SignaturitIntegrationSettings;
    const client = new SignaturItClient(settings, this.config);
    client.on(
      "branding_updated",
      ({ locale, brandingId }: { locale: string; brandingId: string }) => {
        switch (locale) {
          case "en":
            settings.EN_BRANDING_ID = brandingId;
            break;
          case "es":
            settings.ES_BRANDING_ID = brandingId;
            break;
          default:
            break;
        }
        this.integrationRepository.updateOrgIntegrationSettings<"SIGNATURIT">(
          integration.id,
          settings
        );
      }
    );
    return client;
  }
}

class SignaturItClient extends EventEmitter implements ISignatureClient {
  private sdk: SignaturitSDK;
  constructor(
    private settings: SignaturitIntegrationSettings,
    private config: Config
  ) {
    super();
    const isProduction =
      process.env.NODE_ENV === "production" && process.env.ENV === "production";
    if (!this.settings.API_KEY) {
      throw new Error(
        "Signaturit API KEY not found on org_integration settings"
      );
    }
    this.sdk = new SignaturitSDK(this.settings.API_KEY, isProduction);
  }

  public async startSignatureRequest(
    petitionId: string,
    files: string,
    recipients: Recipient[],
    opts: SignatureOptions
  ) {
    const locale = opts?.locale ?? "en";
    let brandingId =
      locale === "en"
        ? this.settings.EN_BRANDING_ID
        : this.settings.ES_BRANDING_ID;

    if (!brandingId) {
      brandingId = (await this.createOrgBranding(opts)).id;
      this.emit("branding_updated", { locale, brandingId });
    }

    const baseEventsUrl = await getBaseWebhookUrl(this.config.misc.parallelUrl);
    return await this.sdk.createSignature(
      files,
      recipients,
      removeNotDefined({
        delivery_type: "email",
        signing_mode: opts?.signingMode ?? "parallel",
        branding_id: brandingId,
        events_url: `${baseEventsUrl}/api/webhooks/signaturit/${petitionId}/events`,
        recipients: recipients.map((r) => ({
          email: r.email,
          name: r.name,
          require_signature_in_coordinates: opts?.signatureBoxPositions?.map(
            (boxPosition) =>
              boxPosition?.find((bp) => bp.email === r.email)?.box ?? {}
          ),
        })),
        expire_time: 0, // disable signaturit reminder emails
        reminders: 0,
      }) as any
    );
  }

  public async cancelSignatureRequest(externalId: string) {
    return await this.sdk.cancelSignature(externalId);
  }

  // returns a binary encoded buffer of the signed document
  public async downloadSignedDocument(externalId: string): Promise<Buffer> {
    const [signatureId, documentId] = externalId.split("/");
    return Buffer.from(
      await this.sdk.downloadSignedDocument(signatureId, documentId)
    );
  }

  private async createOrgBranding(
    opts: SignatureOptions
  ): Promise<BrandingResponse> {
    return await this.sdk.createBranding({
      layout_color: "#6059F7",
      text_color: "#F6F6F6",
      application_texts: {
        open_sign_button:
          opts.locale === "es" ? "Abrir documento" : "Open document",
      },
      templates: await this.buildSignaturItBrandingTemplates(opts),
    });
  }

  private async buildSignaturItBrandingTemplates(
    opts: SignatureOptions
  ): Promise<BrandingParams["templates"]> {
    const [
      { html: signatureRequestedEmail },
      { html: signatureCompletedEmail },
      { html: signatureCancelledEmail },
    ] = await Promise.all([
      buildEmail(
        SignatureRequestedEmail,
        {
          signButton: "{{sign_button}}",
          signerName: "{{signer_name}}",
          senderEmail: "{{sender_email}}",
          documentName: opts.templateData?.documentName ?? "",
          senderName: opts.templateData?.senderFirstName ?? "",
          logoUrl: opts.templateData?.logoUrl ?? "",
          logoAlt: opts.templateData?.logoAlt ?? "",
          parallelUrl: this.config.misc.parallelUrl,
          assetsUrl: this.config.misc.assetsUrl,
        },
        { locale: opts.locale }
      ),
      buildEmail(
        SignatureCompletedEmail,
        {
          signatureProvider: "Signaturit",
          signerName: "{{signer_name}}",
          senderEmail: "{{sender_email}}",
          senderName: opts.templateData?.senderFirstName ?? "",
          documentName: opts.templateData?.documentName ?? "",
          logoUrl: opts.templateData?.logoUrl ?? "",
          logoAlt: opts.templateData?.logoAlt ?? "",
          parallelUrl: this.config.misc.parallelUrl,
          assetsUrl: this.config.misc.assetsUrl,
        },
        { locale: opts.locale }
      ),
      buildEmail(
        SignatureCancelledEmail,
        {
          signatureProvider: "Signaturit",
          signerName: "{{signer_name}}",
          senderEmail: "{{sender_email}}",
          senderName: opts.templateData?.senderFirstName ?? "",
          documentName: opts.templateData?.documentName ?? "",
          logoUrl: opts.templateData?.logoUrl ?? "",
          logoAlt: opts.templateData?.logoAlt ?? "",
          parallelUrl: this.config.misc.parallelUrl,
          assetsUrl: this.config.misc.assetsUrl,
        },
        { locale: opts.locale }
      ),
    ]);

    return {
      signatures_request: signatureRequestedEmail,
      signatures_receipt: signatureCompletedEmail,
      document_canceled: signatureCancelledEmail,
    };
  }
}
