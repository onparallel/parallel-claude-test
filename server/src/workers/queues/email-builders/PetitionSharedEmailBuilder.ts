import { inject, injectable } from "inversify";
import { groupBy, indexBy, isNonNullish, unique } from "remeda";
import { EmailLog } from "../../../db/__types";
import { EmailLogRepository } from "../../../db/repositories/EmailLogRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { buildEmail } from "../../../emails/buildEmail";
import PetitionSharedEmail from "../../../emails/emails/app/PetitionSharedEmail";
import { buildFrom } from "../../../emails/utils/buildFrom";
import {
  IOrganizationLayoutService,
  ORGANIZATION_LAYOUT_SERVICE,
} from "../../../services/OrganizationLayoutService";
import { fullName } from "../../../util/fullName";
import { toGlobalId } from "../../../util/globalId";
import { EmailBuilder } from "../EmailSenderQueue";

interface PetitionSharedEmailPayload {
  user_id: number;
  petition_permission_ids: number[];
  message: string | null;
}

@injectable()
export class PetitionSharedEmailBuilder implements EmailBuilder<PetitionSharedEmailPayload> {
  constructor(
    @inject(ORGANIZATION_LAYOUT_SERVICE) private layouts: IOrganizationLayoutService,
    @inject(UserRepository) private users: UserRepository,
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(EmailLogRepository) private emailLogs: EmailLogRepository,
  ) {}

  async build(payload: PetitionSharedEmailPayload) {
    const [user, userData, permissions] = await Promise.all([
      this.users.loadUser(payload.user_id),
      this.users.loadUserDataByUserId(payload.user_id),
      this.petitions.loadPetitionPermission(payload.petition_permission_ids),
    ]);
    if (!user) {
      throw new Error(`User:${payload.user_id} not found`);
    }
    if (!userData) {
      throw new Error(`UserData not found for User:${payload.user_id}`);
    }
    const userIds = unique(permissions.filter(isNonNullish).map((p) => p.user_id!));
    const [users, usersData, petitions] = await Promise.all([
      this.users.loadUser(userIds),
      this.users.loadUserDataByUserId(userIds),
      this.petitions.loadPetition(
        unique(permissions.filter(isNonNullish).map((p) => p.petition_id)),
      ),
    ]);
    const usersById = indexBy(users.filter(isNonNullish), (p) => p.id);
    const emails: EmailLog[] = [];
    const { emailFrom, ...layoutProps } = await this.layouts.getLayoutProps(user.org_id);

    const permissionsByUserId = groupBy(
      permissions.filter((p) => isNonNullish(p?.user_id)),
      (p) => p!.user_id!,
    );

    for (const [userId, permissions] of Object.entries(permissionsByUserId)) {
      const _petitions = petitions.filter(
        (p) =>
          isNonNullish(p) && permissions.some((permission) => permission!.petition_id === p.id),
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
        { locale: permissionUserData.preferred_locale },
      );
      const email = await this.emailLogs.createEmail({
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
}
