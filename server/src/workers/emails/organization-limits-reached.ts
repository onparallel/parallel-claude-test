import { WorkerContext } from "../../context";
import { OrganizationUsageLimitName } from "../../db/__types";
import { buildEmail } from "../../emails/buildEmail";
import OrganizationLimitsReachedEmail from "../../emails/emails/OrganizationLimitsReachedEmail";
import { buildFrom } from "../../emails/utils/buildFrom";

export async function organizationLimitsReached(
  payload: { org_id: number; limit_name: OrganizationUsageLimitName },
  context: WorkerContext,
) {
  const [usageLimit, users, parallelOrg, organization] = await Promise.all([
    context.organizations.loadCurrentOrganizationUsageLimit(payload.org_id, payload.limit_name),
    context.users.getUsersWithPermission(payload.org_id, "ORG_SETTINGS"),
    context.organizations.loadRootOrganization(),
    context.organizations.loadOrg(payload.org_id),
  ]);

  if (!organization) {
    throw new Error(`Could not find Organization:${payload.org_id}`);
  }

  if (!usageLimit) {
    throw new Error(
      `Could not find ${payload.limit_name} usage limit for Organization:${payload.org_id}`,
    );
  }

  const { emailFrom, ...layoutProps } = await context.layouts.getLayoutProps(parallelOrg.id);

  const emails = [];
  for (const user of users) {
    const userData = await context.users.loadUserData(user.user_data_id);
    if (!userData) {
      throw new Error(`UserData:${user.user_data_id} not found for User:${user.id}`);
    }
    const { html, text, subject, from } = await buildEmail(
      OrganizationLimitsReachedEmail,
      {
        limitName: payload.limit_name,
        orgName: organization.name,
        senderName: userData.first_name!,
        total: usageLimit.limit,
        used: usageLimit.used,
        ...layoutProps,
      },
      { locale: userData.preferred_locale },
    );

    emails.push(
      await context.emailLogs.createEmail({
        from: buildFrom(from, emailFrom),
        to: userData.email,
        subject,
        text,
        html,
        created_from: `Organization:${payload.org_id}`,
      }),
    );
  }

  return emails;
}
