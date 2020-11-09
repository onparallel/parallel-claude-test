import { inject, injectable } from "inversify";
import Knex from "knex";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";

type SignatureIntegrationProviders = "SIGNATURIT";

type SignatureIntegrationSettings<K extends SignatureIntegrationProviders> = {
  SIGNATURIT: {
    API_KEY: string;
    BRANDING_ID?: string;
  };
}[K];

export type SignaturitIntegrationSettings = SignatureIntegrationSettings<
  "SIGNATURIT"
>;

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
}
