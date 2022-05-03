import Excel from "exceljs";
import { isDefined, uniq, zip } from "remeda";
import { Readable } from "stream";
import { PetitionFieldReply } from "../../db/__types";
import { getFieldIndices as getFieldIndexes } from "../../util/fieldIndices";
import { fullName } from "../../util/fullName";
import { TaskRunner } from "../helpers/TaskRunner";

export class ExportReportRunner extends TaskRunner<"EXPORT_REPORT"> {
  async run() {
    const { petition_id: templateId } = this.task.input;

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

    const i18n = this.i18n(template!.locale);

    const [petitionsAccesses, petitionsFields] = await Promise.all([
      this.ctx.petitions.loadAccessesForPetition(petitions.map((p) => p.id)),
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
      const contactNames = contacts.map((c) => fullName(c.first_name, c.last_name));
      const contactEmails = contacts.map((c) => c.email);

      const row: Record<string, string> = {
        [i18n("Petition name")]: petition.name || "",
        [i18n("Recipient names")]: contactNames.join(", ") || "",
        [i18n("Recipient emails")]: contactEmails.join(", ") || "",
      };

      const fieldIndexes = getFieldIndexes(petitionFields);
      zip(petitionFields, fieldIndexes).forEach(([field, fieldIndex], i) => {
        if (field.type !== "HEADING") {
          const replies = petitionFieldsReplies[i];
          row[`${fieldIndex}: ${field.title}`] =
            field.type !== "FILE_UPLOAD" // TODO: replace with `!isFileTypeField(field.type)` when [feat/ch2444] is merged
              ? replies.map(this.replyContent).join("; ")
              : replies.length > 0
              ? `${replies.length} ${i18n("file(s)")}`
              : "";
        }
      });

      return row;
    });

    const stream = await this.exportToExcel(rows);

    const tmpFile = await this.uploadTemporaryFile({
      stream,
      filename: (template?.name ?? i18n("Report")).concat(".xlsx"),
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

  private i18n(locale: string) {
    const es = {
      "Petition name": "Nombre de la petición",
      "Recipient names": "Nombre de los destinatarios",
      "Recipient emails": "Email de los destinatarios",
      Report: "Reporte",
      "file(s)": "archivo(s)",
    };
    return (text: keyof typeof es) => (locale === "es" ? es[text] : text);
  }

  private async exportToExcel(rows: Record<string, string>[]) {
    const wb = new Excel.Workbook();

    const page = wb.addWorksheet();
    page.columns = uniq(rows.flatMap(Object.keys)).map((key) => ({ key, header: key }));
    page.addRows(rows);

    const stream = new Readable();
    stream.push(await wb.xlsx.writeBuffer());
    stream.push(null); // end of stream
    return stream;
  }
}
