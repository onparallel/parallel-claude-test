import Excel from "exceljs";
import { IntlShape } from "react-intl";
import { isDefined, minBy, zip } from "remeda";
import { Readable } from "stream";
import { PetitionFieldReply, PetitionMessage } from "../../db/__types";
import { FORMATS } from "../../util/dates";
import { getFieldIndices } from "../../util/fieldIndices";
import { evaluateFieldVisibility } from "../../util/fieldVisibility";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { isFileTypeField } from "../../util/isFileTypeField";
import { Maybe } from "../../util/types";
import { TaskRunner } from "../helpers/TaskRunner";

export class TemplateRepliesReportRunner extends TaskRunner<"TEMPLATE_REPLIES_REPORT"> {
  async run() {
    const {
      petition_id: templateId,
      timezone,
      start_date: startDate,
      end_date: endDate,
    } = this.task.input;

    if (!this.task.user_id) {
      throw new Error(`Task ${this.task.id} is missing user_id`);
    }
    const hasAccess = await this.ctx.readonlyPetitions.userHasAccessToPetitions(this.task.user_id, [
      templateId,
    ]);
    if (!hasAccess) {
      throw new Error(`User ${this.task.user_id} has no access to petition ${templateId}`);
    }
    const [template, petitions] = await Promise.all([
      this.ctx.readonlyPetitions.loadPetition(templateId),
      this.ctx.readonlyPetitions.getPetitionsForTemplateRepliesReport(
        templateId,
        startDate,
        endDate
      ),
    ]);
    const intl = await this.ctx.i18n.getIntl(template!.recipient_locale);

    const [
      includePreviewUrl,
      petitionsAccesses,
      petitionsMessages,
      petitionsFieldsWithReplies,
      petitionsOwner,
      petitionsTags,
      petitionsEvents,
    ] = await Promise.all([
      this.ctx.featureFlags.orgHasFeatureFlag(template!.org_id, "TEMPLATE_REPLIES_PREVIEW_URL"),
      this.ctx.readonlyPetitions.loadAccessesForPetition(petitions.map((p) => p.id)),
      this.ctx.readonlyPetitions.loadMessagesByPetitionId(petitions.map((p) => p.id)),
      this.ctx.readonlyPetitions.getPetitionFieldsWithReplies(petitions.map((p) => p.id)),
      this.ctx.readonlyPetitions.loadPetitionOwner(petitions.map((p) => p.id)),
      this.ctx.readonlyTags.loadTagsByPetitionId(petitions.map((p) => p.id)),
      this.ctx.readonlyPetitions.loadPetitionEventsByPetitionId(petitions.map((p) => p.id)),
    ]);

    const petitionsAccessesContacts = await Promise.all(
      petitionsAccesses.map((accesses) =>
        this.ctx.readonlyContacts.loadContactByAccessId(accesses.map((a) => a.id))
      )
    );

    const petitionsOwnerUserData = await Promise.all(
      petitionsOwner.map((user) => this.ctx.users.loadUserDataByUserId(user!.id))
    );

    const petitionsFirstMessage = petitionsMessages.reduce(
      (result: Maybe<PetitionMessage>[], messages) => {
        const firstMessage =
          minBy(messages, (m) => m.scheduled_at?.valueOf() ?? m.created_at.valueOf()) ?? null;
        return result.concat(firstMessage);
      },
      []
    );

    const petitionsFirstMessageUserData = await Promise.all(
      petitionsFirstMessage.map((m) =>
        m ? this.ctx.users.loadUserDataByUserId(m.sender_id) : null
      )
    );

    const rows = petitions.map((petition, petitionIndex) => {
      const petitionFields = petitionsFieldsWithReplies[petitionIndex];

      const contacts = petitionsAccessesContacts[petitionIndex].filter(isDefined);
      const petitionFirstMessage = petitionsFirstMessage[petitionIndex];
      const petitionFirstMessageUserData = petitionsFirstMessageUserData[petitionIndex];
      const firstSendDate =
        petitionFirstMessage?.scheduled_at ?? petitionFirstMessage?.created_at ?? null;

      const contactNames = contacts.map((c) => fullName(c.first_name, c.last_name));
      const contactEmails = contacts.map((c) => c.email);

      const dateParts = firstSendDate
        ? intl.formatDateToParts(firstSendDate, {
            timeZone: timezone,
            day: "numeric",
            month: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: false,
          })
        : [];

      const year = dateParts.find((p) => p.type === "year")!;
      const month = dateParts.find((p) => p.type === "month")!;
      const day = dateParts.find((p) => p.type === "day")!;
      const hour = dateParts.find((p) => p.type === "hour")!;
      const minute = dateParts.find((p) => p.type === "minute")!;

      const petitionOwner = petitionsOwnerUserData[petitionIndex];
      const petitionTags = petitionsTags[petitionIndex];
      const petitionEvents = petitionsEvents[petitionIndex];
      const latestPetitionCompletedEvent = petitionEvents
        .filter((e) => e.type === "PETITION_COMPLETED")
        .at(-1);
      const latestPetitionClosedEvent = petitionEvents
        .filter((e) => e.type === "PETITION_CLOSED")
        .at(-1);
      const latestSignatureCompletedEvent = petitionEvents
        .filter((e) => e.type === "SIGNATURE_COMPLETED")
        .at(-1);

      const row: Record<
        string,
        { position: number; content: Maybe<string | Date>; title: Maybe<string> }
      > = {
        "parallel-id": {
          position: 0,
          title: intl.formatMessage({
            id: "export-template-report.column-header.petition-id",
            defaultMessage: "Parallel ID",
          }),
          content: toGlobalId("Petition", petition.id),
        },
        "parallel-name": {
          position: 1,
          title: intl.formatMessage({
            id: "export-template-report.column-header.petition-name",
            defaultMessage: "Parallel name",
          }),
          content: petition.name || "",
        },
        "recipient-names": {
          position: 2,
          title: intl.formatMessage({
            id: "export-template-report.column-header.recipient-names",
            defaultMessage: "Recipient names",
          }),
          content: contactNames.join(", ") || "",
        },
        "recipient-emails": {
          position: 3,
          title: intl.formatMessage({
            id: "export-template-report.column-header.recipient-emails",
            defaultMessage: "Recipient emails",
          }),
          content: contactEmails.join(", ") || "",
        },
        "send-date": {
          position: 4,
          title: intl.formatMessage({
            id: "export-template-report.column-header.sent-at",
            defaultMessage: "Sent at",
          }),
          content: firstSendDate
            ? new Date(
                Date.UTC(
                  parseInt(year.value),
                  parseInt(month.value) - 1, // months go from 0 (Jan) to 11 (Dec)
                  parseInt(day.value),
                  parseInt(hour.value),
                  parseInt(minute.value)
                )
              )
            : null,
        },
        "sent-by": {
          position: 5,
          title: intl.formatMessage({
            id: "export-template-report.column-header.sent-by",
            defaultMessage: "Sent by",
          }),
          content: fullName(
            petitionFirstMessageUserData?.first_name,
            petitionFirstMessageUserData?.last_name
          ),
        },
        "parallel-owner": {
          position: 6,
          title: intl.formatMessage({
            id: "export-template-report.column-header.parallel-owner",
            defaultMessage: "Owner",
          }),
          content: fullName(petitionOwner?.first_name, petitionOwner?.last_name),
        },
        tags: {
          position: 7,
          title: intl.formatMessage({
            id: "export-template-report.column-header.parallel-tags",
            defaultMessage: "Tags",
          }),
          content: petitionTags.map((t) => t.name).join(", "),
        },
        status: {
          position: 8,
          title: intl.formatMessage({
            id: "export-template-report.column-header.parallel-status",
            defaultMessage: "Status",
          }),
          content: petition.status
            ? {
                DRAFT: intl.formatMessage({
                  id: "export-template-report.petition-status.draft",
                  defaultMessage: "DRAFT",
                }),
                PENDING: intl.formatMessage({
                  id: "export-template-report.petition-status.pending",
                  defaultMessage: "PENDING",
                }),
                COMPLETED: intl.formatMessage({
                  id: "export-template-report.petition-status.completed",
                  defaultMessage: "COMPLETED",
                }),
                CLOSED: intl.formatMessage({
                  id: "export-template-report.petition-status.closed",
                  defaultMessage: "CLOSED",
                }),
              }[petition.status]
            : null,
        },
        "completed-at": {
          position: 9,
          title: intl.formatMessage({
            id: "export-template-report.column-header.parallel-completed-at",
            defaultMessage: "Completed at",
          }),
          content: latestPetitionCompletedEvent?.created_at ?? null,
        },
        "closed-at": {
          position: 10,
          title: intl.formatMessage({
            id: "export-template-report.column-header.parallel-closed-at",
            defaultMessage: "Closed at",
          }),
          content: latestPetitionClosedEvent?.created_at ?? null,
        },
        "signed-at": {
          position: 11,
          title: intl.formatMessage({
            id: "export-template-report.column-header.parallel-signed-at",
            defaultMessage: "Signed at",
          }),
          content: latestSignatureCompletedEvent?.created_at ?? null,
        },
      };

      if (includePreviewUrl) {
        row["preview-url"] = {
          position: Object.keys(row).length,
          title: intl.formatMessage({
            id: "export-template-report.column-header.preview-url",
            defaultMessage: "Preview URL",
          }),
          content: `${this.ctx.config.misc.parallelUrl}/${intl.locale}/app/petitions/${toGlobalId(
            "Petition",
            petition.id
          )}/preview`,
        };
      }
      const fixedColsLength = Object.keys(row).length;

      const fieldIndexes = getFieldIndices(petitionFields);
      const visibilities = evaluateFieldVisibility(petitionFields);
      zip(petitionFields, fieldIndexes)
        .filter((_, i) => visibilities[i])
        .forEach(([field, fieldIndex]) => {
          row[`${field.from_petition_field_id ?? field.id}`] = {
            position: (fieldIndex as number) - 1 + fixedColsLength,
            title: field.type === "DATE_TIME" ? field.title + " (UTC)" : field.title,
            content: !isFileTypeField(field.type)
              ? field.replies
                  .map((r) => this.replyContent({ ...r, type: field.type }, intl as IntlShape))
                  .join("; ")
              : field.replies.length > 0
              ? intl.formatMessage(
                  {
                    id: "export-template-report.file-cell-content",
                    defaultMessage: "{count, plural, =1{1 file} other {# files}}",
                  },
                  { count: field.replies.length }
                )
              : "",
          };
        });

      return row;
    });

    const stream = await this.exportToExcel(rows);

    const tmpFile = await this.uploadTemporaryFile({
      stream,
      filename: intl.formatMessage(
        {
          id: "export-template-report.file-name",
          defaultMessage: "template-report-{id}.xlsx",
        },
        { id: toGlobalId("Petition", template!.id) }
      ),
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    return { temporary_file_id: tmpFile.id };
  }

  private replyContent(r: Pick<PetitionFieldReply, "content" | "type">, intl: IntlShape) {
    switch (r.type) {
      case "CHECKBOX":
        return (r.content.value as string[]).join(", ");
      case "DYNAMIC_SELECT":
        return (r.content.value as string[][])
          .map((value) => (value[1] !== null ? value.join(": ") : null))
          .filter(isDefined)
          .join(", ");
      case "DATE_TIME":
        return intl.formatDate(r.content.value, {
          ...FORMATS["L+LT"],
          timeZone: "Etc/UTC",
        });
      default:
        return r.content.value as string;
    }
  }

  private async exportToExcel(
    rows: Record<
      string,
      { position: number; content: Maybe<string | Date>; title: Maybe<string> }
    >[]
  ) {
    const wb = new Excel.Workbook();

    const page = wb.addWorksheet();
    const headers: { key: string; data: { position: number; title: Maybe<string> } }[] = [];
    rows.forEach((row) => {
      Object.entries(row).forEach(([key, data]) => {
        const pushedKey = headers.find((h) => h.key === key);
        if (!pushedKey) {
          headers.push({ key, data });
          // if the same field is found on another position, keep only the first one to avoid duplicating columns
        } else if (pushedKey.data.position > data.position) {
          pushedKey.data = data;
        }
      });
    });

    headers.sort((a, b) => a.data.position - b.data.position);

    page.columns = headers.map((h) => ({
      key: h.key,
      header: h.data.title ?? "",
    }));

    page.addRows(
      rows.map((row) => {
        const obj: any = {};
        Object.entries(row).forEach(([key, data]) => {
          obj[key] = data.content;
        });
        return obj;
      })
    );

    const stream = new Readable();
    stream.push(await wb.xlsx.writeBuffer());
    stream.push(null); // end of stream
    return stream;
  }
}
