import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { isDefined, unique } from "remeda";
import { SignaturitBrandingIdKey } from "../../integrations/signature/SignaturitIntegration";
import { keyBuilder } from "../../util/keyBuilder";
import { Replace } from "../../util/types";
import {
  CreateDocumentProcessingLog,
  CreateOrgIntegration,
  IntegrationType,
  OrgIntegration,
  User,
} from "../__types";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import { KNEX } from "../knex";

interface IntegrationProviders {
  SIGNATURE: "SIGNATURIT" | "DOCUSIGN";
  DOW_JONES_KYC: "DOW_JONES_KYC";
  AI_COMPLETION: "AZURE_OPEN_AI";
  ID_VERIFICATION: "BANKFLIP";
  DOCUMENT_PROCESSING: "BANKFLIP";
}

type SignaturitSettings = {
  CREDENTIALS: { API_KEY: string };
  ENVIRONMENT: "production" | "sandbox";
  IS_PARALLEL_MANAGED: boolean;
  SHOW_CSV?: boolean; // show a security stamp on the margin of each page of the document
} & { [key in SignaturitBrandingIdKey]?: string };

interface DocusignSettings {
  CREDENTIALS: { ACCESS_TOKEN: string; REFRESH_TOKEN: string };
  ENVIRONMENT: "production" | "sandbox";
}

interface BankflipSettings {
  CREDENTIALS: { API_KEY: string; HOST: string; WEBHOOK_SECRET: string };
}

interface SsoSettings {
  EMAIL_DOMAINS: string[];
  COGNITO_PROVIDER: string;
}

interface UserProvisioningSettings {
  AUTH_KEY: string;
}

interface DowJonesKycSettings {
  CREDENTIALS: {
    ACCESS_TOKEN: string;
    REFRESH_TOKEN: string;
    CLIENT_ID: string;
    USERNAME: string;
    PASSWORD: string;
  };
}

interface AzureAiCompletionSettings {
  CREDENTIALS: { API_KEY: string };
  ENDPOINT: string;
}

export type IntegrationProvider<TType extends IntegrationType> =
  TType extends keyof IntegrationProviders ? IntegrationProviders[TType] : string;

export type IntegrationSettings<
  TType extends IntegrationType,
  TProvider extends IntegrationProvider<TType> = IntegrationProvider<TType>,
> = {
  SSO: SsoSettings;
  DOW_JONES_KYC: DowJonesKycSettings;
  USER_PROVISIONING: UserProvisioningSettings;
  SIGNATURE: TProvider extends IntegrationProviders["SIGNATURE"]
    ? {
        SIGNATURIT: SignaturitSettings;
        DOCUSIGN: DocusignSettings;
      }[TProvider]
    : never;
  AI_COMPLETION: TProvider extends IntegrationProviders["AI_COMPLETION"]
    ? { AZURE_OPEN_AI: AzureAiCompletionSettings }[TProvider]
    : never;
  ID_VERIFICATION: TProvider extends IntegrationProviders["ID_VERIFICATION"]
    ? {
        BANKFLIP: BankflipSettings;
      }[TProvider]
    : never;
  DOCUMENT_PROCESSING: TProvider extends IntegrationProviders["DOCUMENT_PROCESSING"]
    ? {
        BANKFLIP: BankflipSettings;
      }[TProvider]
    : never;
}[TType];

export type IntegrationCredentials<
  TType extends IntegrationType,
  TProvider extends IntegrationProvider<TType> = IntegrationProvider<TType>,
> =
  EnhancedIntegrationSettings<TType, TProvider, false> extends { CREDENTIALS: any }
    ? EnhancedIntegrationSettings<TType, TProvider, false>["CREDENTIALS"]
    : never;

export type EnhancedIntegrationSettings<
  TType extends IntegrationType,
  TProvider extends IntegrationProvider<TType> = IntegrationProvider<TType>,
  TEncrypted extends boolean = true,
> = TEncrypted extends true
  ? IntegrationSettings<TType, TProvider> extends { CREDENTIALS: any }
    ? Omit<IntegrationSettings<TType, TProvider>, "CREDENTIALS"> & { CREDENTIALS: string }
    : IntegrationSettings<TType, TProvider>
  : IntegrationSettings<TType, TProvider>;

export type EnhancedOrgIntegration<
  TType extends IntegrationType,
  TProvider extends IntegrationProvider<TType> = IntegrationProvider<TType>,
  TEncrypted extends boolean = true,
> = Replace<
  OrgIntegration,
  {
    type: TType;
    provider: TProvider;
    settings: EnhancedIntegrationSettings<TType, TProvider, TEncrypted>;
  }
>;

export type EnhancedCreateOrgIntegration<
  TType extends IntegrationType,
  TProvider extends IntegrationProvider<TType> = IntegrationProvider<TType>,
  TEncrypted extends boolean = true,
> = Replace<
  CreateOrgIntegration,
  {
    type: TType;
    provider: TProvider;
    settings: EnhancedIntegrationSettings<TType, TProvider, TEncrypted>;
  }
>;

@injectable()
export class IntegrationRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadIntegration = this.buildLoadBy("org_integration", "id", (q) =>
    q.whereNull("deleted_at").where("is_enabled", true),
  );

  readonly loadAnySignatureIntegration = this.buildLoadBy("org_integration", "id", (q) =>
    q.where({ type: "SIGNATURE" }),
  );

  getPaginatedIntegrationsForOrg(
    orgId: number,
    opts: {
      type?: IntegrationType | null;
    } & PageOpts,
  ) {
    return this.getPagination<OrgIntegration>(
      this.from("org_integration")
        .where({ deleted_at: null, is_enabled: true, org_id: orgId })
        .mmodify((q) => {
          if (opts.type) {
            q.where("type", opts.type);
          }
        })
        .orderBy("created_at", "desc")
        .orderBy("id", "desc")
        .select("*"),
      opts,
    );
  }

  async clearLoadIntegrationsByOrgIdDataloader(key: {
    orgId: number;
    type?: IntegrationType | null;
    provider?: string | null;
  }) {
    this._loadIntegrationsByOrgId.dataloader.clear(key);
  }

  private _loadIntegrationsByOrgId = this.buildLoader<
    {
      orgId: number;
      type?: IntegrationType | null;
      provider?: string | null;
    },
    OrgIntegration[],
    string
  >(
    async (keys, t) => {
      if (keys.some((k) => !isDefined(k.type) && isDefined(k.provider))) {
        throw new Error("Must define type when defining provider");
      }
      const integrations = await this.from("org_integration", t)
        .whereIn("org_id", unique(keys.map((k) => k.orgId)))
        .where((q) => {
          const types = unique(keys.map((k) => k.type));
          const allHaveTypes = types.every(isDefined);
          if (types.length > 0 && allHaveTypes) {
            q.whereIn("type", types);
            const providers = unique(keys.map((k) => k.provider));
            const allHaveProviders = providers.every(isDefined);
            if (providers.length > 0 && allHaveProviders) {
              q.whereIn("provider", providers);
            }
          }
        })
        .whereNull("deleted_at")
        .where("is_enabled", true)
        .orderBy("created_at", "desc");
      return keys.map(({ orgId, type, provider }) =>
        integrations.filter(
          (i) =>
            i.org_id === orgId &&
            (!isDefined(type) || i.type === type) &&
            (!isDefined(provider) || i.provider === provider),
        ),
      );
    },
    {
      cacheKeyFn: keyBuilder(["orgId", (i) => i.type ?? null, (i) => i.provider ?? null]),
    },
  );

  async loadIntegrationsByOrgId<
    TType extends IntegrationType,
    TProvider extends IntegrationProvider<TType> & string = IntegrationProvider<TType>,
  >(
    orgId: number,
    type: TType,
    provider?: TProvider | null,
    t?: Knex.Transaction,
  ): Promise<EnhancedOrgIntegration<TType, TProvider, true>[]> {
    if (isDefined(t)) {
      return (await this._loadIntegrationsByOrgId.raw(
        { orgId, type, provider },
        t,
      )) as EnhancedOrgIntegration<TType, TProvider, true>[];
    } else {
      return (await this._loadIntegrationsByOrgId({
        orgId,
        type,
        provider,
      })) as EnhancedOrgIntegration<TType, TProvider, true>[];
    }
  }

  async loadProvisioningIntegrationByAuthKey(key: string) {
    const [integration] = await this.raw<OrgIntegration | undefined>(
      /* sql */ `
      select * from org_integration
      where ((settings ->> 'AUTH_KEY') = ?) 
      and "type" = 'USER_PROVISIONING'
      and deleted_at is null
      and is_enabled is true;
    `,
      [key],
    );

    return integration;
  }

  async loadSSOIntegrationByDomain(domain: string) {
    const [integration] = await this.raw<OrgIntegration | undefined>(
      /* sql */ `
        select * from org_integration
        where settings#>'{EMAIL_DOMAINS}' \\?| array[?]
        and type = 'SSO'
        and deleted_at is null
        and is_enabled is true;
      `,
      [domain],
    );

    return integration;
  }

  async updateOrgIntegration<
    TType extends IntegrationType,
    TProvider extends IntegrationProvider<TType> = IntegrationProvider<TType>,
  >(
    integrationId: number,
    data: Partial<EnhancedOrgIntegration<TType, TProvider, true>>,
    updatedBy: string,
    t?: Knex.Transaction,
  ) {
    return await this.from("org_integration", t)
      .where({ id: integrationId, deleted_at: null })
      .update(
        {
          ...data,
          updated_at: this.now(),
          updated_by: updatedBy,
        },
        "*",
      );
  }

  async userHasAccessToIntegration(
    ids: number[],
    user: User,
    integrationTypes?: IntegrationType[],
  ) {
    const [{ count }] = await this.from("org_integration")
      .whereIn("id", ids)
      .where({ org_id: user.org_id, deleted_at: null })
      .mmodify((q) => {
        if ((integrationTypes ?? []).length > 0) {
          q.whereIn("type", integrationTypes!);
        }
      })
      .select<{ count: number }[]>(this.knex.raw(`count(distinct(id))::int as "count"`));
    return count === new Set(ids).size;
  }

  async setDefaultOrgIntegration(
    id: number,
    type: IntegrationType,
    orgId: number,
    updatedBy: string,
    t?: Knex.Transaction,
  ) {
    return this.withTransaction(async (t) => {
      const [integration] = await this.from("org_integration", t)
        .where({ id, org_id: orgId, type, deleted_at: null })
        .update(
          {
            is_default: true,
            updated_by: updatedBy,
            updated_at: this.now(),
          },
          "*",
        );
      await this.from("org_integration", t)
        .where({ org_id: orgId, is_default: true, type, deleted_at: null })
        .whereNot("id", id)
        .update({
          is_default: false,
          updated_by: updatedBy,
          updated_at: this.now(),
        });
      return integration;
    }, t);
  }

  async createOrgIntegration<
    TType extends IntegrationType,
    TProvider extends IntegrationProvider<TType> = IntegrationProvider<TType>,
  >(
    data: EnhancedCreateOrgIntegration<TType, TProvider, true>,
    createdBy: string,
    t?: Knex.Transaction,
  ) {
    const [integration] = await this.insert(
      "org_integration",
      {
        ...data,
        created_by: createdBy,
      },
      t,
    ).returning("*");
    return integration as EnhancedOrgIntegration<TType, TProvider, true>;
  }

  async deleteOrgIntegration(id: number, deletedBy: string) {
    await this.from("org_integration")
      .where({ id, deleted_at: null })
      .update({ deleted_at: this.now(), deleted_by: deletedBy });
  }

  readonly loadDocumentProcessingLogByExternalId = this.buildLoadBy(
    "document_processing_log",
    "external_id",
  );

  async createDocumentProcessingLog(data: CreateDocumentProcessingLog, createdBy: string) {
    const [log] = await this.insert("document_processing_log", {
      ...data,
      created_by: createdBy,
    }).returning("*");

    return log;
  }

  async updateDocumentProcessingLog(
    id: number,
    data: Partial<CreateDocumentProcessingLog>,
    updatedBy: string,
  ) {
    const [log] = await this.from("document_processing_log")
      .where("id", id)
      .update(
        {
          ...data,
          updated_by: updatedBy,
          updated_at: this.now(),
        },
        "*",
      );

    return log;
  }

  async updateDocumentProcessingLogByExternalId(
    externalId: string,
    data: Partial<CreateDocumentProcessingLog>,
    updatedBy: string,
  ) {
    const [log] = await this.from("document_processing_log")
      .where("external_id", externalId)
      .update(
        {
          ...data,
          updated_by: updatedBy,
          updated_at: this.now(),
        },
        "*",
      );

    return log;
  }
}
