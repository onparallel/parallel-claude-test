import { Config } from "../config";
import { IntegrationRepository } from "../db/repositories/IntegrationRepository";
import { OrgIntegration } from "../db/__types";
import { decrypt, encrypt } from "../util/token";

export class GenericIntegration<TCredentials extends {}, TContext extends {} = {}> {
  constructor(protected config: Config, protected integrations: IntegrationRepository) {}

  protected encryptCredentials(credentials: TCredentials): string {
    const encryptionKey = Buffer.from(this.config.security.encryptKeyBase64, "base64");
    return encrypt(JSON.stringify(credentials), encryptionKey).toString("hex");
  }

  protected decryptCredentials(encrypted: string): TCredentials {
    const encryptionKey = Buffer.from(this.config.security.encryptKeyBase64, "base64");
    const decrypted = decrypt(Buffer.from(encrypted, "hex"), encryptionKey).toString("utf8");
    return JSON.parse(decrypted);
  }

  protected getContext(integration: OrgIntegration): TContext {
    return {} as TContext;
  }

  protected async withCredentials<TResult>(
    orgIntegrationId: number,
    handler: (
      credentials: TCredentials,
      context: TContext,
      integration: OrgIntegration
    ) => Promise<TResult>
  ): Promise<TResult> {
    const integration = await this.integrations.loadIntegration(orgIntegrationId);
    const credentials = this.decryptCredentials(integration!.settings.CREDENTIALS);
    const context = this.getContext(integration!);
    try {
      return await handler(credentials, context, integration!);
    } catch (error) {
      if (error instanceof InvalidCredentialsError && error.skipRefresh) {
        await this.integrations.updateOrgIntegration(
          orgIntegrationId,
          { invalid_credentials: true },
          `OrgIntegration:${orgIntegrationId}`
        );
      }
      throw error;
    }
  }
}

export class InvalidCredentialsError extends Error {
  override name = "InvalidCredentialsError";
  constructor(public skipRefresh = false) {
    super("InvalidCredentialsError");
  }
}
