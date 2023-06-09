import "reflect-metadata";
// keep this space to prevent import sorting, removing init from top
import { injectable } from "inversify";
import { Knex } from "knex";
import { isDefined, omit } from "remeda";
import { assert } from "ts-essentials";
import { IntegrationType } from "../db/__types";
import {
  EnhancedCreateOrgIntegration,
  EnhancedIntegrationSettings,
  EnhancedOrgIntegration,
  IntegrationCredentials,
  IntegrationProvider,
  IntegrationRepository,
} from "../db/repositories/IntegrationRepository";
import { EncryptionService } from "../services/EncryptionService";
import { Replace } from "../util/types";

@injectable()
export abstract class GenericIntegration<
  TType extends IntegrationType,
  TProvider extends IntegrationProvider<TType> = IntegrationProvider<TType>,
  TContext extends {} = {}
> {
  protected abstract type: TType;
  protected abstract provider: TProvider;

  constructor(
    protected encryption: EncryptionService,
    protected integrations: IntegrationRepository
  ) {}

  private encryptCredentials(credentials: IntegrationCredentials<TType, TProvider>): string {
    return this.encryption.encrypt(JSON.stringify(credentials), "hex");
  }

  private decryptCredentials(encrypted: string): IntegrationCredentials<TType, TProvider> {
    const decrypted = this.encryption.decrypt(Buffer.from(encrypted, "hex"), "utf8");
    return JSON.parse(decrypted);
  }

  protected getContext(integration: EnhancedOrgIntegration<TType, TProvider, false>): TContext {
    return {} as TContext;
  }

  protected async withCredentials<TResult>(
    orgIntegrationId: number,
    handler: (
      credentials: IntegrationCredentials<TType, TProvider>,
      context: TContext
    ) => Promise<TResult>
  ): Promise<TResult> {
    const integration = (await this.integrations.loadIntegration(
      orgIntegrationId
    )) as EnhancedOrgIntegration<TType, TProvider>;
    if (!isDefined(integration)) {
      throw new Error(`Invalid org integration ID ${orgIntegrationId}`);
    }
    assert("CREDENTIALS" in integration.settings);
    assert(typeof integration.settings.CREDENTIALS === "string");
    const credentials = this.decryptCredentials(integration.settings.CREDENTIALS);
    const context = this.getContext({
      ...integration,
      settings: {
        ...integration.settings,
        CREDENTIALS: credentials,
      },
    } as EnhancedOrgIntegration<TType, TProvider, false>);
    try {
      const response = await handler(credentials, context);
      if (integration.invalid_credentials) {
        await this.integrations.updateOrgIntegration(
          orgIntegrationId,
          { invalid_credentials: false },
          `OrgIntegration:${orgIntegrationId}`
        );
      }
      return response;
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        await this.integrations.updateOrgIntegration(
          orgIntegrationId,
          { invalid_credentials: true },
          `OrgIntegration:${orgIntegrationId}`
        );
      }
      throw error;
    }
  }

  public async createOrgIntegration(
    data: Omit<
      EnhancedCreateOrgIntegration<TType, TProvider, false>,
      "type" | "provider" | "is_enabled"
    >,
    createdBy: string,
    t?: Knex.Transaction
  ): Promise<EnhancedOrgIntegration<TType, TProvider>> {
    assert("CREDENTIALS" in data.settings);
    const integration = await this.integrations.createOrgIntegration<TType, TProvider>(
      {
        ...data,
        type: this.type,
        provider: this.provider,
        settings: {
          CREDENTIALS: this.encryptCredentials(
            data.settings.CREDENTIALS as IntegrationCredentials<TType, TProvider>
          ),
          ...omit(data!.settings, ["CREDENTIALS"]),
        } as EnhancedIntegrationSettings<TType, TProvider, true>,
        is_enabled: true,
      },
      createdBy,
      t
    );
    if (data.is_default) {
      await this.integrations.setDefaultOrgIntegration(
        integration.id,
        this.type,
        data.org_id,
        createdBy,
        t
      );
    }

    return integration;
  }

  protected async updateOrgIntegration(
    orgIntegrationId: number,
    data: Partial<
      Replace<
        Omit<
          EnhancedCreateOrgIntegration<TType, TProvider, false>,
          "type" | "provider" | "is_enabled"
        >,
        { settings: Partial<EnhancedCreateOrgIntegration<TType, TProvider, false>["settings"]> }
      >
    >,
    t?: Knex.Transaction
  ) {
    const integration = (await this.integrations.loadIntegration.raw(orgIntegrationId))!;
    await this.integrations.updateOrgIntegration(
      orgIntegrationId,
      {
        ...omit(data, ["settings"]),
        ...("settings" in data
          ? "CREDENTIALS" in data.settings!
            ? {
                settings: {
                  ...integration.settings,
                  CREDENTIALS: this.encryptCredentials(
                    data.settings.CREDENTIALS as IntegrationCredentials<TType, TProvider>
                  ),
                  ...omit(data!.settings, ["CREDENTIALS"]),
                },
              }
            : {
                settings: {
                  ...integration.settings,
                  ...data!.settings,
                },
              }
          : {}),
      },
      `OrgIntegration:${orgIntegrationId}`,
      t
    );
    if (data.is_default) {
      await this.integrations.setDefaultOrgIntegration(
        integration.id,
        integration.type,
        integration.org_id,
        `OrgIntegration:${orgIntegrationId}`,
        t
      );
    }
  }
}

export class InvalidCredentialsError extends Error {
  override name = "InvalidCredentialsError";

  constructor(public code: string, message?: string) {
    super(message);
  }
}
