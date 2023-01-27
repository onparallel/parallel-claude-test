import { inject, injectable } from "inversify";
import { isDefined } from "remeda";
import { Config, CONFIG } from "../config";
import { FeatureFlagRepository } from "../db/repositories/FeatureFlagRepository";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import { BrandTheme } from "../util/BrandTheme";
import { IImageService, IMAGE_SERVICE } from "./image";

interface OrganizationLayout {
  assetsUrl: string;
  parallelUrl: string;
  logoUrl: string;
  logoAlt: string;
  emailFrom: string;
  removeParallelBranding: boolean;
  theme: BrandTheme;
}

export interface IOrganizationLayoutService {
  getLayoutProps(orgId: number): Promise<OrganizationLayout>;
}

export const ORGANIZATION_LAYOUT_SERVICE = Symbol.for("ORGANIZATION_LAYOUT_SERVICE");

@injectable()
export class OrganizationLayoutService implements IOrganizationLayoutService {
  constructor(
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
    @inject(FeatureFlagRepository) private featureFlags: FeatureFlagRepository,
    @inject(IMAGE_SERVICE) private images: IImageService,
    @inject(CONFIG) private config: Config
  ) {}

  async getLayoutProps(orgId: number) {
    const [org, logoPath, brandTheme] = await Promise.all([
      this.organizations.loadOrg(orgId),
      this.organizations.loadOrgLogoPath(orgId),
      this.organizations.loadOrgBrandTheme(orgId),
    ]);
    const logoUrl = isDefined(logoPath)
      ? await this.images.getImageUrl(logoPath, { resize: { width: 400 } })
      : null;
    if (!org) {
      throw new Error(`Org not found for org_id ${orgId}`);
    }

    const hasRemoveParallelBranding = await this.featureFlags.orgHasFeatureFlag(
      org.id,
      "REMOVE_PARALLEL_BRANDING"
    );

    const { assetsUrl, parallelUrl, emailFrom } = this.config.misc;
    return {
      assetsUrl,
      parallelUrl: org.custom_host ? `https://${org.custom_host}` : parallelUrl,
      logoUrl: logoUrl ?? `${assetsUrl}/static/emails/logo.png`,
      logoAlt: logoUrl ? org.name : "Parallel",
      emailFrom: org.custom_email_from ?? emailFrom,
      removeParallelBranding: hasRemoveParallelBranding,
      theme: (brandTheme!.data ?? {}) as BrandTheme,
    };
  }
}
