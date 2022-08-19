import Excel from "exceljs";
import { isDefined, minBy, zip } from "remeda";
import { Readable } from "stream";
import { PetitionFieldReply } from "../../db/__types";
import { getFieldIndices as getFieldIndexes } from "../../util/fieldIndices";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { isFileTypeField } from "../../util/isFileTypeField";
import { Maybe } from "../../util/types";
import { TaskRunner } from "../helpers/TaskRunner";

export class TemplateRepliesReportRunner extends TaskRunner<"TEMPLATE_REPLIES_REPORT"> {
  async run() {
    const { petition_id: templateId, timezone } = this.task.input;

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
      this.ctx.readonlyPetitions.loadPetitionsByFromTemplateId(templateId),
    ]);

    const intl = await this.ctx.i18n.getIntl(template!.locale);

    const [includeRecipientUrl, petitionsAccesses, petitionsMessages, petitionsFields] =
      await Promise.all([
        this.ctx.featureFlags.orgHasFeatureFlag(template!.org_id, "TEMPLATE_REPLIES_RECIPIENT_URL"),
        this.ctx.readonlyPetitions.loadAccessesForPetition(petitions.map((p) => p.id)),
        this.ctx.readonlyPetitions.loadMessagesByPetitionId(petitions.map((p) => p.id)),
        this.ctx.readonlyPetitions.loadFieldsForPetition(petitions.map((p) => p.id)),
      ]);

    const petitionsAccessesContacts = await Promise.all(
      petitionsAccesses.map((accesses) =>
        this.ctx.readonlyContacts.loadContactByAccessId(accesses.map((a) => a.id))
      )
    );
    const petitionsFieldsReplies = await Promise.all(
      petitionsFields.map((fields) =>
        this.ctx.readonlyPetitions.loadRepliesForField(fields.map((f) => f.id))
      )
    );

    const rows = petitions.map((petition, petitionIndex) => {
      const petitionFields = petitionsFields[petitionIndex];
      const petitionFieldsReplies = petitionsFieldsReplies[petitionIndex];
      const contacts = petitionsAccessesContacts[petitionIndex].filter(isDefined);
      const messages = petitionsMessages[petitionIndex];
      const firstMessage = minBy(
        messages,
        (m) => m.scheduled_at?.valueOf() ?? m.created_at.valueOf()
      );
      const firstSendDate = firstMessage?.scheduled_at ?? firstMessage?.created_at ?? null;

      const contactNames = contacts.map((c) => fullName(c.first_name, c.last_name));
      const contactEmails = contacts.map((c) => c.email);

      const [day, , month, , year, , hour, , minute] = firstSendDate
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

      const row: Record<
        string,
        { position: number; content: Maybe<string | Date>; title: Maybe<string> }
      > = {
        "parallel-name": {
          position: 0,
          title: intl.formatMessage({
            id: "export-template-report.column-header.petition-name",
            defaultMessage: "Parallel name",
          }),
          content: petition.name || "",
        },
        "recipient-names": {
          position: 1,
          title: intl.formatMessage({
            id: "export-template-report.column-header.recipient-names",
            defaultMessage: "Recipient names",
          }),
          content: contactNames.join(", ") || "",
        },
        "recipient-emails": {
          position: 2,
          title: intl.formatMessage({
            id: "export-template-report.column-header.recipient-emails",
            defaultMessage: "Recipient emails",
          }),
          content: contactEmails.join(", ") || "",
        },
        "send-date": {
          position: 3,
          title: intl.formatMessage({
            id: "export-template-report.column-header.send-date",
            defaultMessage: "Send date",
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
      };

      if (includeRecipientUrl) {
        const accesses = petitionsAccesses[petitionIndex];
        const recipientUrls = contacts.map((c) => {
          const keycode = accesses.find((a) => a.contact_id === c.id)!.keycode;
          return `${this.ctx.config.misc.parallelUrl}/${template!.locale}/petition/${keycode}`;
        });

        row["recipient-url"] = {
          position: 4,
          title: intl.formatMessage({
            id: "export-template-report-column-header.recipient-url",
            defaultMessage: "Recipient URL",
          }),
          content: recipientUrls.join(" ") || "",
        };
      }
      const fixedColsLength = Object.keys(row).length;

      const fieldIndexes = getFieldIndexes(petitionFields);
      zip(petitionFields, fieldIndexes).forEach(([field, fieldIndex], i) => {
        if (field.type !== "HEADING") {
          const replies = petitionFieldsReplies[i];
          row[`${field.from_petition_field_id ?? field.id}`] = {
            position: (fieldIndex as number) - 1 + fixedColsLength,
            title: field.title,
            content: !isFileTypeField(field.type)
              ? replies.map(this.replyContent).join("; ")
              : replies.length > 0
              ? intl.formatMessage(
                  {
                    id: "export-template-report.file-cell-content",
                    defaultMessage: "{count, plural, =1{1 file} other {# files}}",
                  },
                  { count: replies.length }
                )
              : "",
          };
        }
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

  private replyContent(r: PetitionFieldReply) {
    switch (r.type) {
      case "CHECKBOX":
        return (r.content.value as string[]).join(", ");
      case "DYNAMIC_SELECT":
        return (r.content.value as string[][])
          .map((value) => (value[1] !== null ? value.join(": ") : null))
          .filter(isDefined)
          .join(", ");
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
