import { WorkerContext } from "../../context";
import { OrganizationUsageLimitName } from "../../db/__types";
import { buildEmail } from "../../emails/buildEmail";
import OrganizationLimitsReachedEmail from "../../emails/components/OrganizationLimitsReachedEmail";
import { buildFrom } from "../../emails/utils/buildFrom";
import { getLayoutProps } from "../helpers/getLayoutProps";

export async function organizationLimitsReached(
  payload: { org_id: number; limit_name: OrganizationUsageLimitName },
  context: WorkerContext
) {
  const [usageLimit, ownerAndAdmins, parallelOrg] = await Promise.all([
    context.organizations.getOrganizationCurrentUsageLimit(payload.org_id, payload.limit_name),
    context.organizations.loadOwnerAndAdmins(payload.org_id),
    context.organizations.loadRootOrganization(),
  ]);

  if (!usageLimit) {
    throw new Error(
      `Could not find ${payload.limit_name} usage limit for Organization:${payload.org_id}`
    );
  }

  const { emailFrom, ...layoutProps } = await getLayoutProps(parallelOrg.id, context);

  const emails = [];
  for (const user of ownerAndAdmins) {
    const userData = await context.users.loadUserData(user.user_data_id);
    if (!userData) {
      throw new Error(`UserData:${user.user_data_id} not found for User:${user.id}`);
    }
    const { html, text, subject, from } = await buildEmail(
      OrganizationLimitsReachedEmail,
      {
        limitName: payload.limit_name,
        senderName: userData.first_name!,
        total: usageLimit.limit,
        used: usageLimit.used,
        ...layoutProps,
      },
      { locale: userData.details?.preferredLocale ?? "en" }
    );

    emails.push(
      await context.emailLogs.createEmail({
        from: buildFrom(from, emailFrom),
        to: userData.email,
        subject,
        text,
        html,
        created_from: `Organization:${payload.org_id}`,
      })
    );
  }

  return emails;
}
