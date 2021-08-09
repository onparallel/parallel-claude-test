import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { IntegrationType, OrgIntegration } from "../__types";

export type IntegrationSettings<K extends IntegrationType> = {
  SIGNATURE: {
    API_KEY: string;
    ENVIRONMENT?: "production" | "sandbox";
    EN_BRANDING_ID?: string;
    ES_BRANDING_ID?: string;
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

  readonly loadEnabledIntegrationsForOrgId = this.buildLoadMultipleBy(
    "org_integration",
    "org_id",
    (q) => q.where("is_enabled", true)
  );

  async loadProvisioningIntegrationByAuthKey(key: string) {
    const [integration] = await this.raw<OrgIntegration | undefined>(
      /* sql */ `
      select * from org_integration
      where ((settings ->> 'AUTH_KEY') = ?) 
      and "type" = 'USER_PROVISIONING' 
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
        and is_enabled is true;
      `,
      [domain]
    );

    return integration;
  }

  async updateOrgIntegrationSettings<K extends IntegrationType>(
    integrationId: number,
    settings: IntegrationSettings<K>
  ) {
    return await this.from("org_integration").where("id", integrationId).update({ settings });
  }

  async removeSignaturitBrandingIds(orgId: number) {
    await this.knex.raw(
      /* sql */ `
      update org_integration 
      set settings = settings - 'ES_BRANDING_ID' - 'EN_BRANDING_ID'
      where org_id = ? and provider = 'SIGNATURIT'`,
      [orgId]
    );
  }
}
