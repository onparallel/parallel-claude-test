import { inject, injectable } from "inversify";
import Knex from "knex";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";

type SignatureIntegrationProviders = "SIGNATURIT";

export type SignatureIntegrationSettings<
  K extends SignatureIntegrationProviders
> = {
  SIGNATURIT: {
    API_KEY: string;
    EN_BRANDING_ID?: string;
    ES_BRANDING_ID?: string;
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

  async updateOrgIntegrationSettings<K extends SignatureIntegrationProviders>(
    integrationId: number,
    settings: SignatureIntegrationSettings<K>
  ) {
    return await this.from("org_integration")
      .where("id", integrationId)
      .update({ settings });
  }
}
