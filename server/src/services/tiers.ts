import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { pick } from "remeda";
import { FeatureFlagRepository } from "../db/repositories/FeatureFlagRepository";
import { IntegrationRepository } from "../db/repositories/IntegrationRepository";
import {
  OrganizationRepository,
  OrganizationUsageDetails,
} from "../db/repositories/OrganizationRepository";
import { FeatureFlagName, Organization } from "../db/__types";

export const TIERS_SERVICE = Symbol.for("TIERS_SERVICE");

type Tier = Omit<OrganizationUsageDetails, "SIGNATURIT_SHARED_APIKEY"> & {
  FEATURE_FLAGS: { name: FeatureFlagName; value: boolean }[];
};

export interface ITiersService {
  updateOrganizationTier(
    organization: Organization,
    tierKey: string,
    updatedBy: string,
    t?: Knex.Transaction
  ): Promise<Tier>;
}

@injectable()
export class TiersService implements ITiersService {
  constructor(
    @inject(IntegrationRepository) private integrations: IntegrationRepository,
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
    @inject(FeatureFlagRepository)
    private featureFlags: FeatureFlagRepository
  ) {}

  private readonly defaultAppSumoFFs: FeatureFlagName[] = [
    "CUSTOM_HOST_UI",
    "DEVELOPER_ACCESS",
    "PETITION_PDF_EXPORT",
    "REMOVE_PARALLEL_BRANDING",
  ];

  private readonly TIERS: Record<string, Tier> = {
    FREE: {
      USER_LIMIT: 2,
      PETITION_SEND: { limit: 20, period: "1 month" },
      FEATURE_FLAGS: [],
    },
    APPSUMO1: {
      USER_LIMIT: 5,
      PETITION_SEND: { limit: 40, period: "1 month" },
      FEATURE_FLAGS: this.defaultAppSumoFFs.map((name) => ({ name, value: true })),
    },
    APPSUMO2: {
      USER_LIMIT: 20,
      PETITION_SEND: { limit: 80, period: "1 month" },
      FEATURE_FLAGS: this.defaultAppSumoFFs.map((name) => ({ name, value: true })),
    },
    APPSUMO3: {
      USER_LIMIT: 50,
      PETITION_SEND: { limit: 150, period: "1 month" },
      FEATURE_FLAGS: this.defaultAppSumoFFs.map((name) => ({ name, value: true })),
    },
    APPSUMO4: {
      USER_LIMIT: 1000,
      PETITION_SEND: { limit: 300, period: "1 month" },
      FEATURE_FLAGS: this.defaultAppSumoFFs.map((name) => ({ name, value: true })),
    },
  };

  async updateOrganizationTier(
    org: Organization,
    tierKey: string,
    updatedBy: string,
    t?: Knex.Transaction
  ) {
    const tiers = Object.keys(this.TIERS);
    if (!tiers.includes(tierKey)) {
      throw new Error(`Invalid tier ${tierKey}. Expected one of: ${tiers.join(", ")}`);
    }

    const tier = this.TIERS[tierKey];

    const newUsageDetails = {
      ...org.usage_details,
      ...pick(tier, ["USER_LIMIT", "PETITION_SEND"]),
    };

    await this.organizations.withTransaction(async (t) => {
      await this.featureFlags.removeFeatureFlagOverrides(org.id, t);
      await Promise.all([
        this.organizations.updateOrganization(
          org.id,
          { usage_details: newUsageDetails },
          updatedBy,
          t
        ),
        this.featureFlags.addOrUpdateFeatureFlagOverride(org.id, tier.FEATURE_FLAGS, t),
        this.organizations.upsertOrganizationUsageLimit(
          org.id,
          "PETITION_SEND",
          tier.PETITION_SEND.limit,
          tier.PETITION_SEND.period,
          t
        ),
        this.integrations.removeSignaturitBrandingIds(org.id, updatedBy, t),
      ]);
    }, t);

    return tier;
  }
}
