import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { isDefined, uniq } from "remeda";
import { keyBuilder } from "../../util/keyBuilder";
import { Replace } from "../../util/types";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { CreateOrgIntegration, IntegrationType, OrgIntegration, User } from "../__types";

export type IntegrationProviders = {
  SIGNATURE: "SIGNATURIT" | "DOCUSIGN";
};

export type SignatureProvider = IntegrationProviders["SIGNATURE"];

export type IntegrationProvider<TType extends IntegrationType> =
  TType extends keyof IntegrationProviders ? IntegrationProviders[TType] : string;

export type IntegrationSettings<
  TType extends IntegrationType,
  TProvider extends IntegrationProvider<TType> = IntegrationProvider<TType>
> = TType extends "SIGNATURE"
  ? TProvider extends "SIGNATURIT"
    ? {
        CREDENTIALS: { API_KEY: string };
        ENVIRONMENT: "production" | "sandbox";
        IS_PARALLEL_MANAGED: boolean;
        EN_FORMAL_BRANDING_ID?: string;
        ES_FORMAL_BRANDING_ID?: string;
        EN_INFORMAL_BRANDING_ID?: string;
        ES_INFORMAL_BRANDING_ID?: string;
        SHOW_CSV?: boolean; // show a security stamp on the margin of each page of the document
        // TODO delete after migration
        _CREDENTIALS: { API_KEY: string };
      }
    : TProvider extends "DOCUSIGN"
    ? {
        CREDENTIALS: { ACCESS_TOKEN: string; REFRESH_TOKEN: string };
        ENVIRONMENT: "production" | "sandbox";
        API_BASE_PATH: string;
        USER_ACCOUNT_ID: string;
      }
    : never
  : TType extends "SSO"
  ? {
      EMAIL_DOMAINS: string[];
      COGNITO_PROVIDER: string;
    }
  : TType extends "USER_PROVISIONING"
  ? {
      AUTH_KEY: string;
    }
  : TType extends "DOW_JONES_KYC"
  ? {
      CREDENTIALS: {
        ACCESS_TOKEN: string;
        REFRESH_TOKEN: string;
        CLIENT_ID: string;
        USERNAME: string;
        PASSWORD: string;
      };
    }
  : never;

export type IntegrationCredentials<
  TType extends IntegrationType,
  TProvider extends IntegrationProvider<TType> = IntegrationProvider<TType>
> = EnhancedIntegrationSettings<TType, TProvider, false> extends { CREDENTIALS: any }
  ? EnhancedIntegrationSettings<TType, TProvider, false>["CREDENTIALS"]
  : never;

// TODO: Sustituir por lo de abajo cuando se utilice GenericInegration para DOW_JONES_KYC
export type EnhancedIntegrationSettings<
  TType extends IntegrationType,
  TProvider extends IntegrationProvider<TType> = IntegrationProvider<TType>,
  TEncrypted extends boolean = true
> = TEncrypted extends true
  ? TType extends "SIGNATURE"
    ? Omit<IntegrationSettings<TType, TProvider>, "CREDENTIALS"> & { CREDENTIALS: string }
    : IntegrationSettings<TType, TProvider>
  : IntegrationSettings<TType, TProvider>;

// export type EnhancedIntegrationSettings<
//   TType extends IntegrationType,
//   TProvider extends IntegrationProvider<TType> = IntegrationProvider<TType>,
//   TEncrypted extends boolean = true
// > = TEncrypted extends true
//   ? IntegrationSettings<TType, TProvider> extends { CREDENTIALS: any }
//     ? Omit<IntegrationSettings<TType, TProvider>, "CREDENTIALS"> & { CREDENTIALS: string }
//     : IntegrationSettings<TType, TProvider>
//   : IntegrationSettings<TType, TProvider>;

export type EnhancedOrgIntegration<
  TType extends IntegrationType,
  TProvider extends IntegrationProvider<TType> = IntegrationProvider<TType>,
  TEncrypted extends boolean = true
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
  TEncrypted extends boolean = true
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
    q.whereNull("deleted_at").where("is_enabled", true)
  );

  readonly loadAnySignatureIntegration = this.buildLoadBy("org_integration", "id", (q) =>
    q.where({ type: "SIGNATURE" })
  );

  getPaginatedIntegrationsForOrg(
    orgId: number,
    opts: {
      type?: IntegrationType | null;
    } & PageOpts
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
      opts
    );
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
      const integrations = await this.from("org_integration", t)
        .whereIn("org_id", uniq(keys.map((k) => k.orgId)))
        .where((q) => {
          const types = uniq(keys.map((k) => k.type)).filter(isDefined);
          if (types.length > 0) {
            q.whereIn("type", types);
          }
          const providers = uniq(keys.map((k) => k.provider)).filter(isDefined);
          if (providers.length > 0) {
            q.whereIn("provider", providers);
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
            (!isDefined(provider) || i.provider === provider)
        )
      );
    },
    {
      cacheKeyFn: keyBuilder(["orgId", (i) => i.type ?? null, (i) => i.provider ?? null]),
    }
  );

  async loadIntegrationsByOrgId<
    TType extends IntegrationType,
    TProvider extends IntegrationProvider<TType> & string = IntegrationProvider<TType>
  >(
    orgId: number,
    type: TType,
    provider?: TProvider | null,
    t?: Knex.Transaction
  ): Promise<EnhancedOrgIntegration<TType, TProvider, true>[]> {
    if (isDefined(t)) {
      return (await this._loadIntegrationsByOrgId.raw(
        { orgId, type, provider },
        t
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
      [key]
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
      [domain]
    );

    return integration;
  }

  async updateOrgIntegration<
    TType extends IntegrationType,
    TProvider extends IntegrationProvider<TType> = IntegrationProvider<TType>
  >(
    integrationId: number,
    data: Partial<EnhancedOrgIntegration<TType, TProvider, true>>,
    updatedBy: string,
    t?: Knex.Transaction
  ) {
    return await this.from("org_integration", t)
      .where({ id: integrationId, deleted_at: null })
      .update(
        {
          ...data,
          updated_at: this.now(),
          updated_by: updatedBy,
        },
        "*"
      );
  }

  async userHasAccessToIntegration(
    ids: number[],
    user: User,
    integrationTypes?: IntegrationType[]
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
    t?: Knex.Transaction
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
          "*"
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
    TProvider extends IntegrationProvider<TType> = IntegrationProvider<TType>
  >(
    data: EnhancedCreateOrgIntegration<TType, TProvider, true>,
    createdBy: string,
    t?: Knex.Transaction
  ) {
    const [integration] = await this.insert(
      "org_integration",
      {
        ...data,
        created_by: createdBy,
      },
      t
    ).returning("*");
    return integration as EnhancedOrgIntegration<TType, TProvider, true>;
  }

  async deleteOrgIntegration(id: number, deletedBy: string) {
    await this.from("org_integration")
      .where({ id, deleted_at: null })
      .update({ deleted_at: this.now(), deleted_by: deletedBy });
  }
}
