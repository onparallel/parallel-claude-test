import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { isDefined, uniq } from "remeda";
import { keyBuilder } from "../../util/keyBuilder";
import { OauthCredentials } from "../../integrations/OAuthIntegration";
import { Replace } from "../../util/types";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { CreateOrgIntegration, IntegrationType, OrgIntegration, User } from "../__types";

export type SignatureProvider = "SIGNATURIT" | "DOCUSIGN";

type SignatureIntegrationCredentials<TProvider extends SignatureProvider> = {
  SIGNATURIT: { API_KEY: string };
  DOCUSIGN: OauthCredentials;
}[TProvider];

export type SignatureEnvironment = "production" | "sandbox";

export type IntegrationSettings<
  TType extends IntegrationType,
  TProvider extends SignatureProvider = any
> = {
  SIGNATURE: {
    CREDENTIALS: SignatureIntegrationCredentials<TProvider>;
    ENVIRONMENT?: SignatureEnvironment;
    // Signaturit
    EN_FORMAL_BRANDING_ID?: string;
    ES_FORMAL_BRANDING_ID?: string;
    EN_INFORMAL_BRANDING_ID?: string;
    ES_INFORMAL_BRANDING_ID?: string;
    SHOW_CSV?: boolean; // show a security stamp on the margin of each page of the document
    // Docusign
    API_BASE_PATH?: string;
    USER_ACCOUNT_ID?: string;
  };
  SSO: {
    EMAIL_DOMAINS: string[];
    COGNITO_PROVIDER: string;
  };
  USER_PROVISIONING: {
    AUTH_KEY: string;
  };
  DOW_JONES_KYC: {
    CREDENTIALS: {
      ACCESS_TOKEN: string;
      REFRESH_TOKEN: string;
      CLIENT_ID: string;
      USERNAME: string;
      PASSWORD: string;
    };
  };
}[TType];

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

  async loadIntegrationsByOrgId<IType extends IntegrationType>(
    orgId: number,
    type: IType,
    provider?: string | null,
    t?: Knex.Transaction
  ): Promise<Replace<OrgIntegration, { settings: IntegrationSettings<IType> }>[]> {
    if (isDefined(t)) {
      return await this._loadIntegrationsByOrgId.raw({ orgId, type, provider }, t);
    } else {
      return await this._loadIntegrationsByOrgId({ orgId, type, provider });
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

  async updateOrgIntegration<K extends IntegrationType>(
    integrationId: number,
    data: Partial<Replace<OrgIntegration, { settings: IntegrationSettings<K> }>>,
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
    updatedBy: string
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
    });
  }

  async createOrgIntegration<
    IType extends IntegrationType,
    TProvider extends SignatureProvider = any
  >(
    data: Replace<CreateOrgIntegration, { settings: IntegrationSettings<IType, TProvider> }>,
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
    return integration;
  }

  async deleteOrgIntegration(id: number, deletedBy: string) {
    await this.from("org_integration")
      .where({ id, deleted_at: null })
      .update({ deleted_at: this.now(), deleted_by: deletedBy });
  }
}
