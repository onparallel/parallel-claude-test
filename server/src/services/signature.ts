import { injectable, inject } from "inversify";
import "reflect-metadata";
import SignaturitSDK from "signaturit-sdk";
import { SignaturitIntegrationSettings } from "../db/repositories/IntegrationRepository";
import { OrgIntegration, Petition } from "../db/__types";
import { toGlobalId } from "../util/globalId";
import { getBaseWebhookUrl } from "../workers/helpers/getBaseWebhookUrl";
import { CONFIG, Config } from "./../config";

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
    petition: Petition,
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
}

class SignaturItClient implements ISignatureClient {
  private sdk: SignaturitSDK;
  constructor(
    private settings: SignaturitIntegrationSettings,
    private config: Config
  ) {
    const isProduction = process.env.NODE_ENV === "production";
    this.sdk = new SignaturitSDK(settings.API_KEY, isProduction);
  }
  public async startSignatureRequest(
    petition: Petition,
    files: string,
    recipients: Recipient[],
    opts?: SignatureOptions
  ) {
    const petitionId = toGlobalId("Petition", petition.id);
    const baseEventsUrl = await getBaseWebhookUrl(this.config.misc.parallelUrl);
    return await this.sdk.createSignature(files, recipients, {
      delivery_type: "email",
      signing_mode: opts?.signing_mode,
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
    });
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
