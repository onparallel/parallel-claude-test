import Excel from "exceljs";
import { isNonNullish, partition, sortBy } from "remeda";
import { Readable } from "stream";
import { PetitionField, PetitionFieldReply, PetitionFieldType } from "../../db/__types";
import { backgroundCheckFieldReplyUrl } from "../../util/backgroundCheck";
import { applyFieldVisibility } from "../../util/fieldLogic";
import { toGlobalId } from "../../util/globalId";
import { isFileTypeField } from "../../util/isFileTypeField";
import { pMapChunk } from "../../util/promises/pMapChunk";
import { Maybe } from "../../util/types";
import { TaskRunner } from "../helpers/TaskRunner";

interface AliasedPetitionField extends PetitionField {
  alias: string;
}
export class TemplateRepliesCsvExportRunner extends TaskRunner<"TEMPLATE_REPLIES_CSV_EXPORT"> {
  async run() {
    const { template_id: templateId } = this.task.input;

    if (!this.task.user_id) {
      throw new Error(`Task ${this.task.id} is missing user_id`);
    }

    const user = await this.ctx.readonlyUsers.loadUser(this.task.user_id);
    if (!user) {
      throw new Error(`User ${this.task.user_id} not found`);
    }

    const hasAccess = await this.ctx.readonlyPetitions.userHasAccessToPetitions(this.task.user_id, [
      templateId,
    ]);
    if (!hasAccess) {
      throw new Error(`User ${this.task.user_id} has no access to petition ${templateId}`);
    }

    const [allTemplateFields, petitions] = await Promise.all([
      this.ctx.readonlyPetitions.loadAllFieldsByPetitionId(templateId),
      this.ctx.readonlyPetitions.getPetitionsForTemplateRepliesReport(templateId),
    ]);

    const petitionsAccesses = await this.ctx.readonlyPetitions.loadAccessesForPetition(
      petitions.map((p) => p.id),
    );

    const petitionsAccessesContacts = await Promise.all(
      petitionsAccesses.map((accesses) =>
        this.ctx.readonlyContacts.loadContactByAccessId(accesses.map((a) => a.id)),
      ),
    );

    const headers = this.buildExcelHeaders(
      allTemplateFields
        .filter((f) => isNonNullish(f.alias) && f.type !== "PROFILE_SEARCH")
        .map((f) => ({ ...f, alias: f.alias! })),
    );

    let rows: Record<string, Maybe<string | Date>>[] = [];

    const parallelUrl = this.ctx.config.misc.parallelUrl;

    if (petitions.length > 0) {
      const petitionsComposedFields = await pMapChunk(
        petitions.map((p) => p.id),
        async (ids) => await this.ctx.readonlyPetitions.getComposedPetitionFieldsAndVariables(ids),
        { chunkSize: 50, concurrency: 1 },
      );

      rows = petitions.map((petition, petitionIndex) => {
        const aliasedPetitionFields = applyFieldVisibility(
          petitionsComposedFields[petitionIndex],
        ).filter((f) => f.type !== "HEADING" && isNonNullish(f.alias));

        const [contact] = petitionsAccessesContacts[petitionIndex].filter(isNonNullish);

        const row: Record<string, Maybe<string | Date>> = {
          "parallel-id": toGlobalId("Petition", petition.id),
          "recipient-email": contact?.email ?? "",
          "recipient-first-name": contact?.first_name ?? "",
          "recipient-last-name": contact?.last_name ?? "",
          "created-at": petition.created_at,
          "parallel-status": petition.status!,
          "signature-status": petition.latest_signature_status ?? "",
        };

        function replyContent(
          r: { content: any; type: PetitionFieldType; escapeCommas: boolean },
          field: Pick<AliasedPetitionField, "id" | "petition_id">,
        ) {
          function valueMap(value: any) {
            // escape commas on every reply to distinguish between multiple replies
            if (r.escapeCommas && typeof value === "string") {
              return value.replaceAll(",", "\\,");
            }
            return value;
          }

          switch (r.type) {
            case "CHECKBOX":
              return (r.content.value as string[]).map(valueMap).join(",");
            case "DYNAMIC_SELECT":
              return (r.content.value as string[][])
                .map((value) => value[1])
                .filter(isNonNullish)
                .map(valueMap)
                .join(",");
            case "BACKGROUND_CHECK":
              // no need for "valueMap", as URL will never include commas
              return backgroundCheckFieldReplyUrl(parallelUrl, "en", field, r);
            default:
              return valueMap(r.content.value);
          }
        }

        function fillRow(
          field: Pick<
            AliasedPetitionField,
            | "id"
            | "petition_id"
            | "from_petition_field_id"
            | "type"
            | "title"
            | "parent_petition_field_id"
            | "alias"
            | "multiple"
          > & {
            reply_group_index?: number;
          },
          parent: Pick<AliasedPetitionField, "options" | "from_petition_field_id" | "alias"> | null,
          replies: Pick<PetitionFieldReply, "content" | "type">[],
        ) {
          if (field.type === "PROFILE_SEARCH") {
            return;
          }

          const columnId = `field-${field.from_petition_field_id ?? field.id}`.concat(
            isNonNullish(field.reply_group_index) ? `-${field.reply_group_index}` : "",
          );

          // make sure header is defined on this field
          const header = headers.find((h) => h.id === columnId);
          if (!header) {
            const header = {
              id: columnId,
              parent_petition_field_id: parent?.from_petition_field_id,
              title: parent
                ? `${parent.alias}[${field.reply_group_index!}].${field.alias}`
                : field.alias,
            };

            if (isNonNullish(parent?.from_petition_field_id)) {
              // for FIELD_GROUP replies, insert new header after the last header of the group
              // this way, 2nd to nth FIELD_GROUP reply will be just after the 1st one
              const lastIndex = headers.findLastIndex(
                (h) => h.parent_petition_field_id === parent?.from_petition_field_id,
              );
              headers.splice(lastIndex + 1, 0, header);
            } else {
              headers.push(header);
            }
          }

          row[columnId] = !isFileTypeField(field.type)
            ? replies
                .map((r) =>
                  replyContent(
                    {
                      content: r.content,
                      type: field.type,
                      escapeCommas:
                        field.multiple ||
                        field.type === "CHECKBOX" ||
                        field.type === "DYNAMIC_SELECT",
                    },
                    field,
                  ),
                )
                .join(",")
            : replies.length > 0
              ? replies.length === 1
                ? "1 file"
                : replies.length + " files"
              : "";
        }

        for (const field of aliasedPetitionFields) {
          if (field.type === "FIELD_GROUP") {
            for (const groupReply of field.replies) {
              for (const replyChild of (groupReply.children ?? []).filter((child) =>
                isNonNullish(child.field.alias),
              )) {
                fillRow(
                  {
                    ...replyChild.field,
                    alias: replyChild.field.alias!,
                    reply_group_index: field.replies.indexOf(groupReply),
                  },
                  { ...field, alias: field.alias! },
                  replyChild.replies,
                );
              }
            }
          } else {
            fillRow({ ...field, alias: field.alias! }, null, field.replies);
          }
        }

        return row;
      });
    }

    const stream = await this.export(headers, rows);

    const tmpFile = await this.uploadTemporaryFile({
      stream,
      filename: `template-report-${toGlobalId("Petition", templateId)}.csv`,
      contentType: "text/csv",
    });

    return { temporary_file_id: tmpFile.id };
  }

  private async export(
    headers: { id: string; title: string }[],
    rows: Record<string, Maybe<string | Date>>[],
  ) {
    const wb = new Excel.Workbook();
    const page = wb.addWorksheet();

    page.columns = headers.map((h) => ({
      key: h.id,
      header: h.title,
    }));

    page.addRows(rows);

    const stream = new Readable();
    stream.push(await wb.csv.writeBuffer());
    stream.push(null); // end of stream
    return stream;
  }

  private buildExcelHeaders(flattenedFields: AliasedPetitionField[]) {
    const headers: { id: string; title: string; parent_petition_field_id?: number | null }[] = [
      {
        id: "parallel-id",
        title: "Parallel ID",
      },
      {
        id: "recipient-email",
        title: "email",
      },
      {
        id: "recipient-first-name",
        title: "firstName",
      },
      {
        id: "recipient-last-name",
        title: "lastName",
      },
      {
        id: "created-at",
        title: "Created at",
      },
      {
        id: "parallel-status",
        title: "Parallel status",
      },
      {
        id: "signature-status",
        title: "Signature status",
      },
    ];

    const [fields, children] = partition(
      flattenedFields,
      (f) => f.parent_petition_field_id === null,
    );

    const headerFields: (AliasedPetitionField & {
      parent_alias?: string;
      reply_group_index?: number;
    })[] = [];
    for (const field of sortBy(
      fields.filter((f) => f.type !== "HEADING"),
      [(f) => f.position, "asc"],
    )) {
      if (field.type === "FIELD_GROUP") {
        const childFields = children
          .filter((c) => c.parent_petition_field_id === field.id)
          .map((c) => ({
            ...c,
            parent_alias: field.alias,
            reply_group_index: 0,
          }));

        headerFields.push(...sortBy(childFields, [(f) => f.position, "asc"]));
      } else {
        headerFields.push(field);
      }
    }

    for (const field of headerFields) {
      headers.push({
        id: `field-${field.id}`.concat(
          isNonNullish(field.reply_group_index) ? `-${field.reply_group_index}` : "",
        ),
        parent_petition_field_id: field.parent_petition_field_id,
        title: field.parent_alias
          ? `${field.parent_alias!}[${field.reply_group_index!}].${field.alias}`
          : field.alias,
      });
    }

    return headers;
  }
}
