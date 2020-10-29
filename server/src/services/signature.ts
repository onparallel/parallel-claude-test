import { inject, injectable } from "inversify";
import "reflect-metadata";
import SignaturitSDK from "signaturit-sdk";
import { Config, CONFIG } from "../config";

export type SignatureOptions = {
  events_url?: string;
  signing_mode?: "parallel" | "sequential";
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
  readonly name: string;
  createSignature: (
    filePath: string,
    recipients: Recipient[],
    options?: SignatureOptions
  ) => Promise<SignatureResponse>;

  cancelSignature: (externalId: string) => Promise<SignatureResponse>;
}

export const SIGNATURIT = Symbol.for("SIGNATURIT");

@injectable()
export class SignaturItClient implements ISignatureClient {
  public readonly name = "signaturit";
  private sdk: SignaturitSDK;
  constructor(@inject(CONFIG) config: Config) {
    const isProduction = process.env.NODE_ENV === "production";
    this.sdk = new SignaturitSDK(
      config.signaturit.parallelApiKey,
      isProduction
    );
  }
  public async createSignature(
    files: string,
    recipients: Recipient[],
    opts?: SignatureOptions
  ) {
    return await this.sdk.createSignature(files, recipients, {
      delivery_type: "email",
      signing_mode: opts?.signing_mode,
      events_url: opts?.events_url,
    });
  }

  public async cancelSignature(signatureId: string) {
    return await this.sdk.cancelSignature(signatureId);
  }

  // returns a binary encoded buffer of the signed document
  public async downloadSignedDocument(
    signatureId: string,
    documentId: string
  ): Promise<Buffer> {
    return Buffer.from(
      await this.sdk.downloadSignedDocument(signatureId, documentId)
    );
  }

  // returns a binary encoded buffer of the audit trail document
  public async downloadAuditTrail(
    signatureId: string,
    documentId: string
  ): Promise<Buffer> {
    return Buffer.from(
      await this.sdk.downloadAuditTrail(signatureId, documentId)
    );
  }
}
