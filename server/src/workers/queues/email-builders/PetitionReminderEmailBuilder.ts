import { inject, injectable } from "inversify";
import { ContactRepository } from "../../../db/repositories/ContactRepository";
import { EmailLogRepository } from "../../../db/repositories/EmailLogRepository";
import { FeatureFlagRepository } from "../../../db/repositories/FeatureFlagRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { buildEmail } from "../../../emails/buildEmail";
import PetitionReminder from "../../../emails/emails/recipient/PetitionReminder";
import { buildFrom } from "../../../emails/utils/buildFrom";
import {
  IOrganizationLayoutService,
  ORGANIZATION_LAYOUT_SERVICE,
} from "../../../services/OrganizationLayoutService";
import { completedFieldReplies } from "../../../util/completedFieldReplies";
import { applyFieldVisibility } from "../../../util/fieldLogic";
import { fullName } from "../../../util/fullName";
import { renderSlateToHtml, renderSlateToText } from "../../../util/slate/render";
import { EmailBuilder } from "../EmailSenderQueue";

interface PetitionReminderEmailPayload {
  petition_reminder_id: number;
}

@injectable()
export class PetitionReminderEmailBuilder implements EmailBuilder<PetitionReminderEmailPayload> {
  constructor(
    @inject(ORGANIZATION_LAYOUT_SERVICE) private layouts: IOrganizationLayoutService,
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(ContactRepository) private contacts: ContactRepository,
    @inject(FeatureFlagRepository) private featureFlags: FeatureFlagRepository,
    @inject(EmailLogRepository) private emailLogs: EmailLogRepository,
  ) {}

  async build(payload: PetitionReminderEmailPayload) {
    const reminderId = payload.petition_reminder_id;
    const reminder = await this.petitions.loadReminder(reminderId);
    if (!reminder) {
      throw new Error(`Reminder with id ${reminderId} not found`);
    }
    try {
      if (reminder.status === "PROCESSED") {
        throw new Error(`Reminder with id ${reminderId} already processed`);
      }
      const access = await this.petitions.loadAccess(reminder.petition_access_id);
      if (!access) {
        throw new Error(
          `Petition access not found for id petition_reminder.petition_access_id ${reminder.petition_access_id}`,
        );
      }
      const [petition, granterData, contact, [composedPetition], originalMessage] =
        await Promise.all([
          this.petitions.loadPetition(access.petition_id),
          this.users.loadUserDataByUserId(access.granter_id),
          access.contact_id ? this.contacts.loadContact(access.contact_id) : null,

          this.petitions.getComposedPetitionFieldsAndVariables([access.petition_id]),
          this.petitions.loadOriginalMessageByPetitionAccess(access.id, access.petition_id),
        ]);
      if (!petition) {
        return []; // if the petition was deleted, return without throwing error
      }
      if (!["PENDING", "COMPLETED"].includes(petition.status!)) {
        throw new Error(
          `Can not sent reminder for petition ${access.petition_id} with status "${petition.status}"`,
        );
      }
      if (!granterData) {
        throw new Error(`UserData not found for User:${access.granter_id}`);
      }
      if (!contact) {
        throw new Error(`Contact not found for petition_access.contact_id ${access.contact_id}`);
      }
      const remindersSent = await this.petitions.loadReminderCountForAccess(access.id);

      const repliableFields = applyFieldVisibility(composedPetition)
        .filter((f) => f.type !== "HEADING" && !f.is_internal)
        .flatMap((f) => {
          if (f.type === "FIELD_GROUP") {
            return f.replies.flatMap((reply) =>
              reply
                .children!.filter((childReply) => !childReply.field.is_internal)
                .map((childReply) => ({
                  ...childReply.field,
                  children: [],
                  replies: childReply.replies.map((r) => ({ ...r, children: [] })),
                })),
            );
          } else {
            return [f];
          }
        });

      const orgId = petition.org_id;
      const hasRemoveWhyWeUseParallel = await this.featureFlags.orgHasFeatureFlag(
        orgId,
        "REMOVE_WHY_WE_USE_PARALLEL",
      );
      const missingFieldCount = repliableFields.filter(
        (field) => completedFieldReplies(field).length === 0,
      ).length;
      const bodyJson = reminder.email_body ? JSON.parse(reminder.email_body) : null;
      const { emailFrom, ...layoutProps } = await this.layouts.getLayoutProps(orgId);

      const { html, text, subject, from } = await buildEmail(
        PetitionReminder,
        {
          emailSubject: originalMessage?.email_subject ?? null,
          contactName: contact.first_name,
          contactFullName: fullName(contact.first_name, contact.last_name),
          senderName: fullName(granterData.first_name, granterData.last_name)!,
          senderEmail: granterData.email,
          missingFieldCount,
          totalFieldCount: repliableFields.length,
          bodyHtml: bodyJson ? renderSlateToHtml(bodyJson) : null,
          bodyPlainText: bodyJson ? renderSlateToText(bodyJson) : null,
          deadline: petition.deadline,
          keycode: access.keycode,
          removeWhyWeUseParallel: hasRemoveWhyWeUseParallel,
          showOptOutLink: remindersSent > 1,
          ...layoutProps,
        },
        { locale: petition.recipient_locale },
      );
      const email = await this.emailLogs.createEmail({
        from: buildFrom(from, emailFrom),
        to: contact.email,
        subject,
        text,
        html,
        reply_to: granterData.email,
        created_from: `PetitionReminder:${reminder.id}`,
      });

      await this.petitions.processReminder(reminder.id, email.id);
      return [email];
    } catch (error) {
      await this.petitions.reminderFailed(reminderId);
      throw error;
    }
  }
}
