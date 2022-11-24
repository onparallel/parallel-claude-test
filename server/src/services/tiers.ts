import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { pick } from "remeda";
import { FeatureFlagRepository } from "../db/repositories/FeatureFlagRepository";
import {
  OrganizationRepository,
  OrganizationUsageDetails,
} from "../db/repositories/OrganizationRepository";
import { FeatureFlagName, Organization } from "../db/__types";
import { SIGNATURE, SignatureService } from "./signature";

export const TIERS_SERVICE = Symbol.for("TIERS_SERVICE");

type Tier = Omit<OrganizationUsageDetails, "SIGNATURIT_SHARED_APIKEY"> & {
  FEATURE_FLAGS: { name: FeatureFlagName; value: boolean }[];
};

export interface ITiersService {
  updateOrganizationTier(
    org: Pick<Organization, "id" | "usage_details">,
    tierKey: string,
    updatedBy: string,
    t?: Knex.Transaction
  ): Promise<Tier>;
  downgradeOrganizationPetitionSendLimit(
    org: Pick<Organization, "id" | "usage_details">,
    updatedBy: string
  ): Promise<void>;
}

@injectable()
export class TiersService implements ITiersService {
  constructor(
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
    @inject(FeatureFlagRepository)
    private featureFlags: FeatureFlagRepository,
    @inject(SIGNATURE) private signatures: SignatureService
  ) {}

  private readonly defaultAppSumoFFs: FeatureFlagName[] = [
    "CUSTOM_HOST_UI",
    "DEVELOPER_ACCESS",
    "REMOVE_PARALLEL_BRANDING",
  ];

  private readonly TIERS: Record<string, Tier> = {
    FREE: {
      USER_LIMIT: 2,
      PETITION_SEND: { limit: 20, duration: { months: 1 } },
      FEATURE_FLAGS: [],
    },
    APPSUMO1: {
      USER_LIMIT: 5,
      PETITION_SEND: { limit: 40, duration: { months: 1 } },
      FEATURE_FLAGS: this.defaultAppSumoFFs.map((name) => ({ name, value: true })),
    },
    APPSUMO2: {
      USER_LIMIT: 20,
      PETITION_SEND: { limit: 80, duration: { months: 1 } },
      FEATURE_FLAGS: this.defaultAppSumoFFs.map((name) => ({ name, value: true })),
    },
    APPSUMO3: {
      USER_LIMIT: 50,
      PETITION_SEND: { limit: 150, duration: { months: 1 } },
      FEATURE_FLAGS: this.defaultAppSumoFFs.map((name) => ({ name, value: true })),
    },
    APPSUMO4: {
      USER_LIMIT: 1000,
      PETITION_SEND: { limit: 300, duration: { months: 1 } },
      FEATURE_FLAGS: this.defaultAppSumoFFs.map((name) => ({ name, value: true })),
    },
  };

  async updateOrganizationTier(
    org: Pick<Organization, "id" | "usage_details">,
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
        this.featureFlags.upsertFeatureFlagOverride(org.id, tier.FEATURE_FLAGS, t),
        this.organizations.upsertOrganizationUsageLimit(
          org.id,
          "PETITION_SEND",
          tier.PETITION_SEND.limit,
          tier.PETITION_SEND.duration,
          t
        ),
        this.signatures.updateBranding(org.id, t),
      ]);
    }, t);

    return tier;
  }

  async downgradeOrganizationPetitionSendLimit(
    org: Pick<Organization, "id" | "usage_details">,
    updatedBy: string
  ) {
    await Promise.all([
      this.organizations.updateOrganization(
        org.id,
        {
          usage_details: {
            ...org.usage_details,
            PETITION_SEND: this.TIERS.FREE.PETITION_SEND,
          },
        },
        updatedBy
      ),
      this.organizations.upsertOrganizationUsageLimit(
        org.id,
        "PETITION_SEND",
        this.TIERS.FREE.PETITION_SEND.limit,
        this.TIERS.FREE.PETITION_SEND.duration
      ),
    ]);
  }
}
