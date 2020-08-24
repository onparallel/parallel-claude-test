import { WorkerContext } from "../../context";
import { EmailLog } from "../../db/__types";
import { buildEmail } from "../../emails/buildEmail";
import PetitionSharingNotification from "../../emails/components/PetitionSharingNotification";
import { buildFrom } from "../../emails/utils/buildFrom";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { Maybe } from "../../util/types";
import { uniq, indexBy } from "remeda";
import { isDefined, zip } from "../../util/remedaExtensions";

export async function petitionSharingNotification(
  payload: {
    user_id: number;
    petition_user_ids: number[];
    message: Maybe<string>;
  },
  context: WorkerContext
) {
  const [user, permissions] = await Promise.all([
    context.users.loadUser(payload.user_id),
    context.petitions.loadPetitionUser(payload.petition_user_ids),
  ]);
  if (!user) {
    throw new Error(`User not found for user_id ${payload.user_id}`);
  }
  const [permissionUsers, petitions] = await Promise.all([
    context.users.loadUser(
      uniq(permissions.filter(isDefined).map((p) => p.user_id))
    ),
    context.petitions.loadPetition(
      uniq(permissions.filter(isDefined).map((p) => p.petition_id))
    ),
  ]);
  const permissionUsersById = indexBy(
    permissionUsers.filter(isDefined),
    (p) => p.id
  );
  const petitionsById = indexBy(petitions.filter(isDefined), (p) => p.id);
  const orgIds = uniq(petitions.map((p) => p!.org_id));
  const [orgs, logos] = await Promise.all([
    context.organizations.loadOrg(orgIds),
    context.organizations.getOrgLogoUrl(orgIds),
  ]);
  const orgsById = indexBy(orgs.filter(isDefined), (o) => o.id);
  const logosByOrgId = Object.fromEntries(zip(orgIds, logos));
  if (!user) {
    throw new Error(`User not found for user_id ${payload.user_id}`);
  }

  const emails: EmailLog[] = [];

  for (const permission of permissions) {
    if (permission) {
      const permissionUser = permissionUsersById[permission.user_id];
      const petition = petitionsById[permission.petition_id];
      const org = orgsById[petition.org_id];
      const logoUrl = logosByOrgId[petition.org_id];
      const { html, text, subject, from } = await buildEmail(
        PetitionSharingNotification,
        {
          petitionId: toGlobalId("Petition", petition.id),
          petitionName: petition.name,
          name: permissionUser.first_name,
          ownerName: fullName(user.first_name, user.last_name)!,
          ownerEmail: user.email,
          message: payload.message,
          assetsUrl: context.config.misc.assetsUrl,
          parallelUrl: context.config.misc.parallelUrl,
          logoUrl:
            logoUrl ??
            `${context.config.misc.assetsUrl}/static/emails/logo.png`,
          logoAlt: logoUrl ? org.name : "Parallel",
        },
        { locale: petition.locale }
      );
      const email = await context.emailLogs.createEmail({
        from: buildFrom(from, context.config.misc.emailFrom),
        to: permissionUser.email,
        subject,
        text,
        html,
        created_from: `PetitionUser:${permission.id}`,
      });
      emails.push(email);
    }
  }

  return emails;
}
