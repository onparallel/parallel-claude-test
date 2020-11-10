import { injectable, inject } from "inversify";
import "reflect-metadata";
import SignaturitSDK from "signaturit-sdk";
import { SignaturitIntegrationSettings } from "../db/repositories/IntegrationRepository";
import { OrgIntegration } from "../db/__types";
import { getBaseWebhookUrl } from "../workers/helpers/getBaseWebhookUrl";
import { CONFIG, Config } from "./../config";
import { sign, verify } from "jsonwebtoken";
import { removeNotDefined } from "../util/remedaExtensions";

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
  events_url?: string;
  signing_mode?: "parallel" | "sequential";
  /**
   *  Each element on the array represents a page in the document.
   *  Inside each page, there's an array with the signers information.
   */
  signature_box_positions?: Array<SignerBox[]>;
};

type SignatureResponse = {
  id: string;
  created_at: Date;
  data: any[];
  documents: Document[];
  url?: string;
};

export type Recipient = { email: string; name: string };

export interface ISignatureClient {
  startSignatureRequest: (
    petitionId: string,
    filePath: string,
    recipients: Recipient[],
    options?: SignatureOptions
  ) => Promise<SignatureResponse>;

  cancelSignatureRequest: (externalId: string) => Promise<SignatureResponse>;
  downloadSignedDocument: (externalId: string) => Promise<Buffer>;
}

export const SIGNATURE = Symbol.for("SIGNATURE");
@injectable()
export class SignatureService {
  constructor(@inject(CONFIG) private config: Config) {}
  public getClient(integration: OrgIntegration): ISignatureClient {
    switch (integration.provider.toUpperCase()) {
      case "SIGNATURIT":
        return new SignaturItClient(
          integration.settings as SignaturitIntegrationSettings,
          this.config
        );
      default:
        throw new Error(
          `Couldn't resolve signature client: ${integration.provider}`
        );
    }
  }

  public generateAuthToken(payload: any) {
    return sign(payload, this.config.signature.jwtSecret, {
      expiresIn: 5, // 5 seconds
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
}

class SignaturItClient implements ISignatureClient {
  private sdk: SignaturitSDK;
  constructor(
    private settings: SignaturitIntegrationSettings,
    private config: Config
  ) {
    const isProduction = process.env.NODE_ENV === "production";
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
    opts?: SignatureOptions
  ) {
    const baseEventsUrl = await getBaseWebhookUrl(this.config.misc.parallelUrl);
    return await this.sdk.createSignature(
      files,
      recipients,
      removeNotDefined({
        delivery_type: "email",
        signing_mode: opts?.signing_mode ?? "parallel",
        branding_id: this.settings.BRANDING_ID,
        events_url: `${baseEventsUrl}/api/webhooks/signaturit/${petitionId}/events`,
        recipients: recipients.map((r) => ({
          email: r.email,
          name: r.name,
          require_signature_in_coordinates: opts?.signature_box_positions?.map(
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
}
