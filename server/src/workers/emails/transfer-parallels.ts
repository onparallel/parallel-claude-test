import { isDefined } from "remeda";
import { WorkerContext } from "../../context";
import { EmailLog } from "../../db/__types";
import { buildEmail } from "../../emails/buildEmail";
import TransferParallelsEmail from "../../emails/emails/TransferParallelsEmail";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";

export async function transferParallels(
  payload: { userExternalId: string; orgId: number },
  context: WorkerContext
) {
  const { userExternalId, orgId } = payload;

  const user = await context.users.loadUserByExternalId({ externalId: userExternalId, orgId });
  if (!user) {
    throw new Error(`User not found for externalId ${userExternalId}`);
  }

  if (user.status !== "ON_HOLD") {
    return;
  }

  const userData = (await context.users.loadUserData(user.user_data_id))!;

  const admins = await context.organizations.loadOwnerAndAdmins(orgId);

  const adminDatas = (await context.users.loadUserData(admins.map((a) => a.user_data_id))).filter(
    isDefined
  );

  const { emailFrom, ...layoutProps } = await context.layouts.getLayoutProps(orgId);
  const emails: EmailLog[] = [];

  for (const adminData of adminDatas) {
    const { html, text, subject, from } = await buildEmail(
      TransferParallelsEmail,
      {
        name: adminData.first_name ?? adminData.last_name ?? "",
        userEmail: userData.email,
        userFullName: fullName(userData.first_name, userData.last_name),
        ...layoutProps,
      },
      { locale: adminData.preferred_locale }
    );

    const email = await context.emailLogs.createEmail({
      from: buildFrom(from, emailFrom),
      to: adminData.email,
      subject,
      text,
      html,
      created_from: `TransferParallels:${user.id}`,
    });

    emails.push(email);
  }

  return emails;
}
