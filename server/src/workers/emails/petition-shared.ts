import { indexBy, isDefined, uniq } from "remeda";
import { WorkerContext } from "../../context";
import { EmailLog } from "../../db/__types";
import { buildEmail } from "../../emails/buildEmail";
import PetitionSharedEmail from "../../emails/components/PetitionSharedEmail";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { Maybe } from "../../util/types";
import { getLayoutProps } from "../helpers/getLayoutProps";

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
  const [permissionUsers, permissionUsersData, petitions] = await Promise.all([
    context.users.loadUser(userIds),
    context.users.loadUserDataByUserId(userIds),
    context.petitions.loadPetition(uniq(permissions.filter(isDefined).map((p) => p.petition_id))),
  ]);
  const permissionUsersById = indexBy(permissionUsers.filter(isDefined), (p) => p.id);
  const petitionsById = indexBy(petitions.filter(isDefined), (p) => p.id);
  const emails: EmailLog[] = [];
  const { emailFrom, ...layoutProps } = await getLayoutProps(user.org_id, context);

  for (const permission of permissions) {
    if (permission) {
      const permissionUser = permissionUsersById[permission.user_id!];
      const permissionUserData = permissionUsersData.find(
        (ud) => ud!.id === permissionUser.user_data_id
      )!;
      const petition = petitionsById[permission.petition_id];
      const { html, text, subject, from } = await buildEmail(
        PetitionSharedEmail,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionName: petition.name,
          name: permissionUserData.first_name,
          ownerName: fullName(userData.first_name, userData.last_name)!,
          ownerEmail: userData.email,
          message: payload.message,
          isTemplate: petition.is_template,
          ...layoutProps,
        },
        { locale: petition.locale }
      );
      const email = await context.emailLogs.createEmail({
        from: buildFrom(from, emailFrom),
        to: permissionUserData.email,
        subject,
        text,
        html,
        created_from: `PetitionPermission:${permission.id}`,
      });
      emails.push(email);
    }
  }

  return emails;
}
