import { Config } from "../../config";
import { OrganizationRepository } from "../../db/repositories/OrganizationRepository";

export async function getLayoutProps(
  orgId: number,
  ctx: {
    organizations: OrganizationRepository;
    config: Config;
  }
) {
  const [org, logoUrl] = await Promise.all([
    ctx.organizations.loadOrg(orgId),
    ctx.organizations.getOrgLogoUrl(orgId),
  ]);
  if (!org) {
    throw new Error(`Org not found for org_id ${orgId}`);
  }
  const { assetsUrl, parallelUrl, emailFrom } = ctx.config.misc;
  return {
    assetsUrl,
    parallelUrl: org.custom_host ? `https://${org.custom_host}` : parallelUrl,
    logoUrl: logoUrl ?? `${assetsUrl}/static/emails/logo.png`,
    logoAlt: logoUrl ? org.name : "Parallel",
    emailFrom: org.custom_email_from ?? emailFrom,
    tone: org.preferred_tone,
  };
}
