import { WorkerContext } from "../../context";

export async function getLayoutProps(orgId: number, context: WorkerContext) {
  const [org, logoUrl] = await Promise.all([
    context.organizations.loadOrg(orgId),
    context.organizations.getOrgLogoUrl(orgId),
  ]);
  if (!org) {
    throw new Error(`Org not found for org_id ${orgId}`);
  }
  console.log(org, context.config.misc);
  const { assetsUrl, parallelUrl } = context.config.misc;
  return {
    assetsUrl,
    parallelUrl: org.custom_host ? `https://${org.custom_host}` : parallelUrl,
    logoUrl: logoUrl ?? `${assetsUrl}/static/emails/logo.png`,
    logoAlt: logoUrl ? org.name : "Parallel",
  };
}
