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
import PetitionCommentsContactNotification from "../../../emails/emails/recipient/PetitionCommentsContactNotification";
import { buildFrom } from "../../../emails/utils/buildFrom";
import {
  IOrganizationLayoutService,
  ORGANIZATION_LAYOUT_SERVICE,
} from "../../../services/OrganizationLayoutService";
import { fullName } from "../../../util/fullName";
import { CommentsNotificationEmailHelper } from "../../helpers/CommentsNotificationEmailHelper";
import { EmailBuilder } from "../EmailSenderQueue";

interface CommentsContactNotificationEmailPayload {
  petition_id: number;
  petition_access_id: number;
  petition_field_comment_ids: number[];
}

@injectable()
export class CommentsContactNotificationEmailBuilder
  extends CommentsNotificationEmailHelper
  implements EmailBuilder<CommentsContactNotificationEmailPayload>
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

  async build(payload: CommentsContactNotificationEmailPayload) {
    const [petition, contact, access, _comments, originalMessage] = await Promise.all([
      this.petitions.loadPetition(payload.petition_id),
      this.contacts.loadContactByAccessId(payload.petition_access_id),
      this.petitions.loadAccess(payload.petition_access_id),
      this.petitions.loadPetitionFieldComment(payload.petition_field_comment_ids),
      this.petitions.loadOriginalMessageByPetitionAccess(
        payload.petition_access_id,
        payload.petition_id,
      ),
    ]);
    if (!petition) {
      return []; // if the petition was deleted, return without throwing error
    }
    if (!contact) {
      throw new Error(`Contact not found for petition_access_id ${payload.petition_access_id}`);
    }
    if (!access) {
      throw new Error(`Access not found for petition_access_id ${payload.petition_access_id}`);
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
      (f) => this.buildFieldWithComments(f, commentsByField),
    );

    const { html, text, subject, from } = await buildEmail(
      PetitionCommentsContactNotification,
      {
        emailSubject: originalMessage?.email_subject ?? null,
        contactName: contact.first_name,
        contactFullName: fullName(contact.first_name, contact.last_name),
        keycode: access.keycode,
        fieldsWithComments,
        ...layoutProps,
      },
      { locale: petition.recipient_locale },
    );
    const email = await this.emailLogs.createEmail({
      from: buildFrom(from, emailFrom),
      to: contact.email,
      reply_to: this.config.misc.emailFrom,
      subject,
      text,
      html,
      created_from: `PetitionFieldComment:${payload.petition_field_comment_ids.join(",")}`,
    });

    return [email];
  }
}
