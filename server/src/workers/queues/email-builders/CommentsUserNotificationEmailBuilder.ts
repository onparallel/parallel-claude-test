import { inject, injectable } from "inversify";
import pMap from "p-map";
import { groupBy, isNonNullish, sortBy, unique } from "remeda";
import { CONFIG, Config } from "../../../config";
import { ContactRepository } from "../../../db/repositories/ContactRepository";
import { EmailLogRepository } from "../../../db/repositories/EmailLogRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { UserGroupRepository } from "../../../db/repositories/UserGroupRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { buildEmail } from "../../../emails/buildEmail";
import PetitionCommentsUserNotification from "../../../emails/emails/app/PetitionCommentsUserNotification";
import { buildFrom } from "../../../emails/utils/buildFrom";
import {
  IOrganizationLayoutService,
  ORGANIZATION_LAYOUT_SERVICE,
} from "../../../services/OrganizationLayoutService";
import { toGlobalId } from "../../../util/globalId";
import { CommentsNotificationEmailHelper } from "../../helpers/CommentsNotificationEmailHelper";
import { EmailBuilder } from "../EmailSenderQueue";

interface CommentsUserNotificationEmailPayload {
  user_id: number;
  petition_id: number;
  petition_field_comment_ids: number[];
}

@injectable()
export class CommentsUserNotificationEmailBuilder
  extends CommentsNotificationEmailHelper
  implements EmailBuilder<CommentsUserNotificationEmailPayload>
{
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(ORGANIZATION_LAYOUT_SERVICE)
    private layouts: IOrganizationLayoutService,
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(EmailLogRepository) private emailLogs: EmailLogRepository,
    @inject(UserRepository) users: UserRepository,
    @inject(ContactRepository) contacts: ContactRepository,
    @inject(UserGroupRepository) userGroups: UserGroupRepository,
  ) {
    super(users, contacts, userGroups);
  }

  async build(payload: CommentsUserNotificationEmailPayload) {
    const [petition, _comments, userData] = await Promise.all([
      this.petitions.loadPetition(payload.petition_id),
      this.petitions.loadPetitionFieldComment(payload.petition_field_comment_ids),
      this.users.loadUserDataByUserId(payload.user_id),
    ]);
    if (!petition) {
      return []; // if the petition was deleted, return without throwing error
    }
    if (!userData) {
      throw new Error(`UserData not found for User:${payload.user_id}`);
    }

    const { emailFrom, ...layoutProps } = await this.layouts.getLayoutProps(petition.org_id);

    const comments = _comments.filter(isNonNullish);

    const fieldIds = unique(comments.map((c) => c!.petition_field_id)).filter(isNonNullish);
    const _fields = (await this.petitions.loadField(fieldIds)).filter(isNonNullish);
    const commentsByField = groupBy(comments, (c) => c.petition_field_id ?? "null");

    const fieldsWithComments = await pMap(
      [
        ...(isNonNullish(commentsByField["null"]) ? [null] : []),
        ...sortBy(_fields, (f) => f.position),
      ],
      (f) => this.buildFieldWithComments(f, commentsByField, payload.user_id),
    );

    const { html, text, subject, from } = await buildEmail(
      PetitionCommentsUserNotification,
      {
        userName: userData.first_name,
        petitionId: toGlobalId("Petition", petition.id),
        petitionName: petition.name,
        fieldsWithComments,
        ...layoutProps,
      },
      { locale: userData.preferred_locale },
    );
    const email = await this.emailLogs.createEmail({
      from: buildFrom(from, emailFrom),
      to: userData.email,
      reply_to: this.config.misc.emailFrom,
      subject,
      text,
      html,
      created_from: `PetitionFieldComment:${payload.petition_field_comment_ids.join(",")}`,
    });

    return [email];
  }
}
