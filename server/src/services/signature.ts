import { inject, injectable } from "inversify";
import "reflect-metadata";
import SignaturitSDK from "signaturit-sdk";
import { Config, CONFIG } from "../config";

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
  public getClient(provider: string): ISignatureClient {
    switch (provider) {
      case "signaturit":
        return new SignaturItClient(this.config);
      default:
        throw new Error(`Couldn't resolve signature client: ${provider}`);
    }
  }
}

class SignaturItClient implements ISignatureClient {
  private sdk: SignaturitSDK;
  constructor(config: Config) {
    const isProduction = process.env.NODE_ENV === "production";
    this.sdk = new SignaturitSDK(
      config.signaturit.parallelApiKey,
      isProduction
    );
  }
  public async startSignatureRequest(
    files: string,
    recipients: Recipient[],
    opts?: SignatureOptions
  ) {
    return await this.sdk.createSignature(files, recipients, {
      delivery_type: "email",
      signing_mode: opts?.signing_mode,
      events_url: opts?.events_url,
      recipients: recipients.map((r) => ({
        email: r.email,
        name: r.name,
        require_signature_in_coordinates: opts?.signature_box_positions?.map(
          (boxPosition) =>
            boxPosition?.find((bp) => bp.email === r.email)?.box ?? {}
        ),
      })),
    });
  }

  public async cancelSignatureRequest(signatureId: string) {
    return await this.sdk.cancelSignature(signatureId);
  }

  // returns a binary encoded buffer of the signed document
  public async downloadSignedDocument(externalId: string): Promise<Buffer> {
    const [signatureId, documentId] = externalId.split("/");
    return Buffer.from(
      await this.sdk.downloadSignedDocument(signatureId, documentId)
    );
  }
}
