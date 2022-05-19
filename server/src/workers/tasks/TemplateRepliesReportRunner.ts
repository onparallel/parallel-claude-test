import Excel from "exceljs";
import { isDefined, minBy, uniq, zip } from "remeda";
import { Readable } from "stream";
import { PetitionFieldReply } from "../../db/__types";
import { getFieldIndices as getFieldIndexes } from "../../util/fieldIndices";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { isFileTypeField } from "../../util/isFileTypeField";
import { TaskRunner } from "../helpers/TaskRunner";

export class TemplateRepliesReportRunner extends TaskRunner<"TEMPLATE_REPLIES_REPORT"> {
  async run() {
    const { petition_id: templateId, timezone } = this.task.input;

    if (!this.task.user_id) {
      throw new Error(`Task ${this.task.id} is missing user_id`);
    }
    const hasAccess = await this.ctx.petitions.userHasAccessToPetitions(this.task.user_id, [
      templateId,
    ]);
    if (!hasAccess) {
      throw new Error(`User ${this.task.user_id} has no access to petition ${templateId}`);
    }
    const [template, petitions] = await Promise.all([
      this.ctx.petitions.loadPetition(templateId),
      this.ctx.petitions.loadPetitionsByFromTemplateId(templateId),
    ]);

    const intl = await this.ctx.i18n.getIntl(template!.locale);

    const [petitionsAccesses, petitionsMessages, petitionsFields] = await Promise.all([
      this.ctx.petitions.loadAccessesForPetition(petitions.map((p) => p.id)),
      this.ctx.petitions.loadMessagesByPetitionId(petitions.map((p) => p.id)),
      this.ctx.petitions.loadFieldsForPetition(petitions.map((p) => p.id)),
    ]);

    const petitionsAccessesContacts = await Promise.all(
      petitionsAccesses.map((accesses) =>
        this.ctx.contacts.loadContactByAccessId(accesses.map((a) => a.id))
      )
    );
    const petitionsFieldsReplies = await Promise.all(
      petitionsFields.map((fields) =>
        this.ctx.petitions.loadRepliesForField(fields.map((f) => f.id))
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

      const row: Record<string, any> = {
        [intl.formatMessage({
          id: "export-template-report.column-header.petition-name",
          defaultMessage: "Petition name",
        })]: petition.name || "",
        [intl.formatMessage({
          id: "export-template-report.column-header.recipient-names",
          defaultMessage: "Recipient names",
        })]: contactNames.join(", ") || "",
        [intl.formatMessage({
          id: "export-template-report.column-header.recipient-emails",
          defaultMessage: "Recipient emails",
        })]: contactEmails.join(", ") || "",
        [intl.formatMessage({
          id: "export-template-report.column-header.send-date",
          defaultMessage: "Send date",
        })]: firstSendDate
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
      };

      const fieldIndexes = getFieldIndexes(petitionFields);
      zip(petitionFields, fieldIndexes).forEach(([field, fieldIndex], i) => {
        if (field.type !== "HEADING") {
          const replies = petitionFieldsReplies[i];
          row[`${fieldIndex}:${field.title}`] = !isFileTypeField(field.type)
            ? replies.map(this.replyContent).join("; ")
            : replies.length > 0
            ? intl.formatMessage(
                {
                  id: "export-template-report.file-cell-content",
                  defaultMessage: "{count, plural, =1{1 file} other {# files}}",
                },
                { count: replies.length }
              )
            : "";
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

  private async exportToExcel(rows: Record<string, string>[]) {
    const wb = new Excel.Workbook();

    const page = wb.addWorksheet();
    const headers = uniq(rows.flatMap(Object.keys));
    // first 4 headers are common for every row and we don't want to include those when sorting
    const sortedHeaders = headers.slice(0, 4).concat(
      headers.slice(4).sort((a, b) => {
        const aPosition = parseInt(a.split(":")[0]);
        const bPosition = parseInt(b.split(":")[0]);
        return aPosition - bPosition;
      })
    );

    page.columns = sortedHeaders.map((key) => ({
      key, // keep position on key so fields with same title in different positions are treated as different columns
      header: key.split(":").slice(1).join(":") || key,
    }));

    page.addRows(rows);

    const stream = new Readable();
    stream.push(await wb.xlsx.writeBuffer());
    stream.push(null); // end of stream
    return stream;
  }
}
