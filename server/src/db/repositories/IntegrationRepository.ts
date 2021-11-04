import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { Replace } from "../../util/types";
import { BaseRepository, PageOpts } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { CreateOrgIntegration, IntegrationType, OrgIntegration, User } from "../__types";

export type IntegrationSettings<K extends IntegrationType> = {
  SIGNATURE: {
    API_KEY: string;
    ENVIRONMENT?: "production" | "sandbox";
    EN_FORMAL_BRANDING_ID?: string;
    ES_FORMAL_BRANDING_ID?: string;
    EN_INFORMAL_BRANDING_ID?: string;
    ES_INFORMAL_BRANDING_ID?: string;
  };
  SSO: {
    EMAIL_DOMAINS: string[];
    COGNITO_PROVIDER: string;
  };
  USER_PROVISIONING: {
    AUTH_KEY: string;
  };
}[K];

@injectable()
export class IntegrationRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadIntegration = this.buildLoadBy("org_integration", "id", (q) =>
    q.whereNull("deleted_at").where("is_enabled", true)
  );

  readonly loadAnyIntegration = this.buildLoadBy("org_integration", "id");

  async loadPaginatedIntegrations(
    orgId: number,
    opts: {
      type?: IntegrationType | null;
    } & PageOpts
  ) {
    return await this.loadPageAndCount(
      this.from("org_integration")
        .where({ deleted_at: null, is_enabled: true, org_id: orgId })
        .mmodify((q) => {
          if (opts.type) {
            q.where("type", opts.type);
          }
        })
        .orderBy("created_at", "desc")
        .select("*"),
      opts
    );
  }

  async loadIntegrationsByOrgId<IType extends IntegrationType>(
    orgId: number,
    type?: IType | null
  ): Promise<Replace<OrgIntegration, { settings: IntegrationSettings<IType> }>[]> {
    return await this.from("org_integration")
      .where({
        org_id: orgId,
        deleted_at: null,
        is_enabled: true,
      })
      .mmodify((q) => {
        if (type) {
          q.where("type", type);
        }
      })
      .orderBy("created_at", "desc")
      .select("*");
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
    updatedBy: string
  ) {
    return await this.from("org_integration")
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

  async removeSignaturitBrandingIds(orgId: number, updatedBy: string) {
    await this.knex.raw(
      /* sql */ `
      update org_integration 
      set 
        settings = settings - 'EN_FORMAL_BRANDING_ID' - 'ES_FORMAL_BRANDING_ID' - 'EN_INFORMAL_BRANDING_ID' - 'ES_INFORMAL_BRANDING_ID',
        updated_by = ?,
        updated_at = NOW()
      where org_id = ? and provider = 'SIGNATURIT' and deleted_at is null`,
      [updatedBy, orgId]
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
      .select(this.knex.raw(`count(distinct(id))::int as "count"`));
    return count === new Set(ids).size;
  }

  async setDefaultOrgIntegration(id: number, type: IntegrationType, user: User) {
    // unset all org integrations of the same type
    const [[defaultIntegration]] = await Promise.all([
      this.from("org_integration")
        .where({ id, org_id: user.org_id, type, deleted_at: null })
        .update(
          {
            is_default: true,
            updated_by: `User:${user.id}`,
            updated_at: this.now(),
          },
          "*"
        ),

      this.from("org_integration")
        .where({ org_id: user.org_id, type, deleted_at: null })
        .whereNot("id", id)
        .update({
          is_default: false,
          updated_by: `User:${user.id}`,
          updated_at: this.now(),
        }),
    ]);

    return defaultIntegration;
  }

  async createOrgIntegration<IType extends IntegrationType>(
    data: Replace<CreateOrgIntegration, { settings: IntegrationSettings<IType> }>,
    createdBy: string
  ) {
    const [integration] = await this.insert("org_integration", {
      ...data,
      created_by: createdBy,
    }).returning("*");
    return integration;
  }

  async deleteOrgIntegration(id: number, deletedBy: string) {
    await this.from("org_integration")
      .where({ id, deleted_at: null })
      .update({ deleted_at: this.now(), deleted_by: deletedBy });
  }
}
