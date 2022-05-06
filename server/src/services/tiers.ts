import { inject, injectable, LazyServiceIdentifer } from "inversify";
import { Knex } from "knex";
import { pick } from "remeda";
import { FeatureFlagRepository } from "../db/repositories/FeatureFlagRepository";
import {
  OrganizationRepository,
  OrganizationUsageDetails,
} from "../db/repositories/OrganizationRepository";
import { FeatureFlagName } from "../db/__types";

export const TIERS_SERVICE = Symbol.for("TIERS_SERVICE");

type Tier = OrganizationUsageDetails & {
  FEATURE_FLAGS: { name: FeatureFlagName; value: boolean }[];
};

export const TIERS: Record<string, Tier> = {
  FREE: {
    USER_LIMIT: 2,
    PETITION_SEND: { limit: 20, period: "1 month" },
    SIGNATURIT_SHARED_APIKEY: { limit: 0, period: "1 month" },
    FEATURE_FLAGS: [],
  },
  APPSUMO1: {
    USER_LIMIT: 5,
    PETITION_SEND: { limit: 40, period: "1 month" },
    SIGNATURIT_SHARED_APIKEY: { limit: 0, period: "1 month" },
    FEATURE_FLAGS: [],
  },
  APPSUMO2: {
    USER_LIMIT: 20,
    PETITION_SEND: { limit: 80, period: "1 month" },
    SIGNATURIT_SHARED_APIKEY: { limit: 0, period: "1 month" },
    FEATURE_FLAGS: [],
  },
  APPSUMO3: {
    USER_LIMIT: 50,
    PETITION_SEND: { limit: 150, period: "1 month" },
    SIGNATURIT_SHARED_APIKEY: { limit: 0, period: "1 month" },
    FEATURE_FLAGS: [],
  },
  APPSUMO4: {
    USER_LIMIT: 1000,
    PETITION_SEND: { limit: 300, period: "1 month" },
    SIGNATURIT_SHARED_APIKEY: { limit: 0, period: "1 month" },
    FEATURE_FLAGS: [],
  },
};
export interface ITiersService {
  updateOrganizationTier(orgId: number, tier: string): Promise<Tier>;
}

@injectable()
export class TiersService implements ITiersService {
  constructor(
    @inject(new LazyServiceIdentifer(() => OrganizationRepository))
    private organizations: OrganizationRepository,
    @inject(new LazyServiceIdentifer(() => FeatureFlagRepository))
    private featureFlags: FeatureFlagRepository
  ) {}

  async updateOrganizationTier(orgId: number, tierKey: string, t?: Knex.Transaction) {
    const tiers = Object.keys(TIERS);
    if (!tiers.includes(tierKey)) {
      throw new Error(`Invalid tier ${tierKey}. Expected one of: ${tiers.join(", ")}`);
    }

    const organization = await this.organizations.loadOrg(orgId);
    if (!organization) {
      throw new Error(`Organization:${orgId} not found`);
    }

    const tier = TIERS[tierKey];

    const newUsageDetails = {
      ...organization.usage_details,
      ...pick(tier, ["USER_LIMIT", "PETITION_SEND", "SIGNATURIT_SHARED_APIKEY"]),
    };

    await this.organizations.withTransaction(async (t) => {
      await this.featureFlags.removeFeatureFlagOverrides(orgId, t);
      await Promise.all([
        this.organizations.updateOrganization(
          orgId,
          { usage_details: newUsageDetails },
          "TiersService",
          t
        ),
        this.featureFlags.addOrUpdateFeatureFlagOverride(orgId, tier.FEATURE_FLAGS, t),
        this.organizations.updateOrganizationCurrentUsageLimit(
          orgId,
          "PETITION_SEND",
          tier.PETITION_SEND.limit,
          tier.PETITION_SEND.period,
          t
        ),
        this.organizations.updateOrganizationCurrentUsageLimit(
          orgId,
          "SIGNATURIT_SHARED_APIKEY",
          tier.SIGNATURIT_SHARED_APIKEY.limit,
          tier.SIGNATURIT_SHARED_APIKEY.period,
          t
        ),
      ]);
    }, t);

    return tier;
  }
}
