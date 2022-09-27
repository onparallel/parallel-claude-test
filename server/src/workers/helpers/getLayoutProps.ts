import { isDefined } from "remeda";
import { WorkerContext } from "../../context";

export async function getLayoutProps(orgId: number, ctx: WorkerContext) {
  const [org, logoPath] = await Promise.all([
    ctx.organizations.loadOrg(orgId),
    ctx.organizations.loadOrgLogoPath(orgId),
  ]);
  const logoUrl = isDefined(logoPath)
    ? await ctx.images.getImageUrl(logoPath, { resize: { width: 400 } })
    : null;
  if (!org) {
    throw new Error(`Org not found for org_id ${orgId}`);
  }

  const hasRemoveParallelBranding = await ctx.featureFlags.orgHasFeatureFlag(
    org.id,
    "REMOVE_PARALLEL_BRANDING"
  );

  const hasRemoveWhyWeUseParallel = await ctx.featureFlags.orgHasFeatureFlag(
    org.id,
    "REMOVE_WHY_WE_USE_PARALLEL"
  );

  const { assetsUrl, parallelUrl, emailFrom } = ctx.config.misc;
  return {
    assetsUrl,
    parallelUrl: org.custom_host ? `https://${org.custom_host}` : parallelUrl,
    logoUrl: logoUrl ?? `${assetsUrl}/static/emails/logo.png`,
    logoAlt: logoUrl ? org.name : "Parallel",
    emailFrom: org.custom_email_from ?? emailFrom,
    tone: org.preferred_tone,
    theme: org.brand_theme,
    removeParallelBranding: hasRemoveParallelBranding,
    removeWhyWeUseParallel: hasRemoveWhyWeUseParallel,
  };
}
