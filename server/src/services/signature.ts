import "reflect-metadata";
import SignaturitSDK from "signaturit-sdk";

export type SignatureOptions = {
  events_url?: string;
};

export type Recipient = { email: string; name: string };

export interface ISignatureClient {
  readonly name: string;
  createSignature: (
    filePath: string,
    recipients: Recipient[],
    options?: SignatureOptions
  ) => Promise<any>;

  cancelSignature: (externalId: string) => Promise<any>;
}

export class SignaturItClient implements ISignatureClient {
  public readonly name = "signaturit";
  private client: SignaturitSDK;
  constructor(apiKey: string) {
    const isProduction = process.env.NODE_ENV === "production";
    this.client = new SignaturitSDK(apiKey, isProduction);
  }
  public async createSignature(
    files: string,
    recipients: Recipient[],
    opts?: SignatureOptions
  ) {
    return await this.client.createSignature(files, recipients, {
      delivery_type: "url",
      events_url: opts?.events_url,
    });
  }

  public async cancelSignature(externalId: string) {
    return await this.client.cancelSignature(externalId);
  }
}
