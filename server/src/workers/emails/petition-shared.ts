import { groupBy, indexBy, isDefined, uniq } from "remeda";
import { WorkerContext } from "../../context";
import { EmailLog } from "../../db/__types";
import { buildEmail } from "../../emails/buildEmail";
import PetitionSharedEmail from "../../emails/emails/PetitionSharedEmail";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { Maybe } from "../../util/types";

export async function petitionShared(
  payload: {
    user_id: number;
    petition_permission_ids: number[];
    message: Maybe<string>;
  },
  context: WorkerContext
) {
  const [user, userData, permissions] = await Promise.all([
    context.users.loadUser(payload.user_id),
    context.users.loadUserDataByUserId(payload.user_id),
    context.petitions.loadPetitionPermission(payload.petition_permission_ids),
  ]);
  if (!user) {
    throw new Error(`User:${payload.user_id} not found`);
  }
  if (!userData) {
    throw new Error(`UserData not found for User:${payload.user_id}`);
  }
  const userIds = uniq(permissions.filter(isDefined).map((p) => p.user_id!));
  const [users, usersData, petitions] = await Promise.all([
    context.users.loadUser(userIds),
    context.users.loadUserDataByUserId(userIds),
    context.petitions.loadPetition(uniq(permissions.filter(isDefined).map((p) => p.petition_id))),
  ]);
  const usersById = indexBy(users.filter(isDefined), (p) => p.id);
  const emails: EmailLog[] = [];
  const { emailFrom, ...layoutProps } = await context.layouts.getLayoutProps(user.org_id);

  const permissionsByUserId = groupBy(
    permissions.filter((p) => isDefined(p?.user_id)),
    (p) => p!.user_id!
  );

  for (const [userId, permissions] of Object.entries(permissionsByUserId)) {
    const _petitions = petitions.filter(
      (p) => isDefined(p) && permissions.some((permission) => permission!.petition_id === p.id)
    );
    const permissionUser = usersById[userId!];
    const permissionUserData = usersData.find((ud) => ud!.id === permissionUser.user_data_id)!;

    const { html, text, subject, from } = await buildEmail(
      PetitionSharedEmail,
      {
        petitions: _petitions.map((p) => ({
          globalId: toGlobalId("Petition", p!.id),
          name: p!.name,
        })),
        name: permissionUserData.first_name,
        ownerName: fullName(userData.first_name, userData.last_name)!,
        ownerEmail: userData.email,
        message: payload.message,
        isTemplate: _petitions[0]!.is_template,
        ...layoutProps,
      },
      // TODO locales
      // { locale: permissionUserData.preferred_locale }
      { locale: permissionUserData.details?.preferredLocale ?? "en" }
    );
    const email = await context.emailLogs.createEmail({
      from: buildFrom(from, emailFrom),
      to: permissionUserData.email,
      subject,
      text,
      html,
      created_from: `User:${user.id}`,
    });
    emails.push(email);
  }

  return emails;
}
