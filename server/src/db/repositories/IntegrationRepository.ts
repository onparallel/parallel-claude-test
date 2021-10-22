import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { Replace } from "../../util/types";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { IntegrationType, OrgIntegration } from "../__types";

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
  EVENT_SUBSCRIPTION: {
    EVENTS_URL: string;
  };
}[K];

@injectable()
export class IntegrationRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadIntegration = this.buildLoadBy("org_integration", "id", (q) =>
    q.whereNull("deleted_at")
  );

  async loadIntegrationsByOrgId<IType extends IntegrationType>(
    orgId: number,
    type?: IType,
    includeDisabled?: boolean
  ): Promise<Replace<OrgIntegration, { settings: IntegrationSettings<IType> }>[]> {
    return await this.from("org_integration")
      .where({
        org_id: orgId,
        deleted_at: null,
      })
      .mmodify((q) => {
        if (type) {
          q.where("type", type);
        }
        if (!includeDisabled) {
          q.where("is_enabled", true);
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

  async createOrgIntegration(data: Partial<OrgIntegration>, createdBy: string) {
    const [integration] = await this.from("org_integration").insert(
      {
        ...data,
        created_by: createdBy,
      },
      "*"
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
}
