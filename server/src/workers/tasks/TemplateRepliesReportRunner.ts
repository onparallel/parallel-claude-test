import { formatInTimeZone } from "date-fns-tz";
import Excel from "exceljs";
import { IntlShape } from "react-intl";
import { isNonNullish, minBy, partition, sortBy } from "remeda";
import { Readable } from "stream";
import {
  PetitionField,
  PetitionFieldReply,
  PetitionMessage,
  PetitionSignatureRequest,
  PetitionStatus,
} from "../../db/__types";
import { PetitionSignatureConfig } from "../../db/repositories/PetitionRepository";
import { backgroundCheckFieldReplyUrl } from "../../util/backgroundCheck";
import { FORMATS } from "../../util/dates";
import { applyFieldVisibility, evaluateFieldLogic } from "../../util/fieldLogic";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { isFileTypeField } from "../../util/isFileTypeField";
import { pMapChunk } from "../../util/promises/pMapChunk";
import { titleize } from "../../util/strings";
import { Maybe } from "../../util/types";
import { TaskRunner } from "../helpers/TaskRunner";

function getPetitionSignatureStatus({
  status,
  currentSignatureRequest,
  signatureConfig,
}: {
  status: PetitionStatus;
  currentSignatureRequest?: PetitionSignatureRequest | null;
  signatureConfig: PetitionSignatureConfig | null;
}) {
  if (
    signatureConfig?.isEnabled &&
    ["COMPLETED", "CLOSED"].includes(status) &&
    (!currentSignatureRequest ||
      currentSignatureRequest.status === "COMPLETED" ||
      currentSignatureRequest.cancel_reason === "CANCELLED_BY_USER")
  ) {
    // petition is completed and configured to be reviewed before starting signature
    // and signature was never started or the last one is already completed (now we're starting a new request)
    // this means the user has to manually trigger the start of the signature request
    return "PENDING_START";
  }

  if (isNonNullish(currentSignatureRequest)) {
    // signature request is already started, return the current status
    if (["ENQUEUED", "PROCESSING", "PROCESSED"].includes(currentSignatureRequest.status)) {
      return "PROCESSING";
    } else {
      return currentSignatureRequest.status as "COMPLETED" | "CANCELLED";
    }
  } else if (signatureConfig?.isEnabled && ["DRAFT", "PENDING"].includes(status)) {
    // petition has signature configured but it's not yet completed
    return "NOT_STARTED";
  }

  // petition doesn't have signature configured and never started a signature request
  return "NO_SIGNATURE";
}

export class TemplateRepliesReportRunner extends TaskRunner<"TEMPLATE_REPLIES_REPORT"> {
  private info(message: string) {
    this.ctx.logger.info(`[TemplateRepliesReportRunner:${this.task.input.petition_id}] ${message}`);
  }

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
    const [includePreviewUrl, template, templateFields, petitions] = await Promise.all([
      this.ctx.featureFlags.orgHasFeatureFlag(user.org_id, "TEMPLATE_REPLIES_PREVIEW_URL"),
      this.ctx.readonlyPetitions.loadPetition(templateId),
      this.ctx.readonlyPetitions.loadAllFieldsByPetitionId(templateId),
      this.ctx.readonlyPetitions.getPetitionsForTemplateRepliesReport(
        templateId,
        startDate,
        endDate,
      ),
    ]);
    this.info(`Loaded ${petitions.length} petitions`);

    const intl = await this.ctx.i18n.getIntl(template!.recipient_locale);

    const headers = this.buildExcelHeaders(
      includePreviewUrl,
      templateFields.filter((f) => f.type !== "PROFILE_SEARCH"),
      intl,
    );
    let rows: Record<string, Maybe<string | Date>>[] = [];

    const parallelUrl = this.ctx.config.misc.parallelUrl;

    if (petitions.length > 0) {
      const ids = petitions.map((p) => p.id);

      const petitionsAccesses = await pMapChunk(
        ids,
        async (ids) => await this.ctx.readonlyPetitions.loadAccessesForPetition(ids),
        { chunkSize: 200, concurrency: 1 },
      );

      this.info(`Loaded ${petitionsAccesses.length} accesses`);

      const petitionsMessages = await pMapChunk(
        ids,
        async (ids) => await this.ctx.readonlyPetitions.loadMessagesByPetitionId(ids),
        { chunkSize: 200, concurrency: 1 },
      );

      this.info(`Loaded ${petitionsMessages.length} messages`);

      const composedPetitions = await pMapChunk(
        ids,
        async (ids) => await this.ctx.readonlyPetitions.getComposedPetitionFieldsAndVariables(ids),
        { chunkSize: 200, concurrency: 1 },
      );

      this.info(`Loaded ${composedPetitions.length} composed petitions`);

      const petitionsOwner = await pMapChunk(
        ids,
        async (ids) => await this.ctx.readonlyPetitions.loadPetitionOwner(ids),
        { chunkSize: 200, concurrency: 1 },
      );

      this.info(`Loaded ${petitionsOwner.length} petition owners`);

      const petitionsTags = await pMapChunk(
        ids,
        async (ids) => await this.ctx.readonlyTags.loadTagsByPetitionId(ids),
        { chunkSize: 200, concurrency: 1 },
      );

      this.info(`Loaded ${petitionsTags.length} tags`);

      const petitionsEvents = await pMapChunk(
        ids,
        async (ids) => await this.ctx.readonlyPetitions.loadPetitionEventsByPetitionId(ids),
        { chunkSize: 200, concurrency: 1 },
      );

      this.info(`Loaded ${petitionsEvents.length} events`);

      const latestSignatures = await pMapChunk(
        ids,
        async (ids) =>
          await this.ctx.readonlyPetitions.loadLatestPetitionSignatureByPetitionId(ids),
        { chunkSize: 200, concurrency: 1 },
      );

      this.info(`Loaded ${latestSignatures.length} signatures`);

      const petitionsAccessesContacts = await Promise.all(
        petitionsAccesses.map((accesses) =>
          this.ctx.readonlyContacts.loadContactByAccessId(accesses.map((a) => a.id)),
        ),
      );

      this.info(`Loaded ${petitionsAccessesContacts.length} contacts`);

      const petitionsOwnerUserData = await Promise.all(
        petitionsOwner.map((user) => this.ctx.users.loadUserDataByUserId(user!.id)),
      );

      const petitionsFirstMessage = petitionsMessages.reduce(
        (result: Maybe<PetitionMessage>[], messages) => {
          const firstMessage =
            minBy(messages, (m) => m.scheduled_at?.valueOf() ?? m.created_at.valueOf()) ?? null;
          return result.concat(firstMessage);
        },
        [],
      );

      const petitionsFirstMessageUserData = await Promise.all(
        petitionsFirstMessage.map((m) =>
          m ? this.ctx.users.loadUserDataByUserId(m.sender_id) : null,
        ),
      );

      this.info(`Loaded ${petitionsFirstMessageUserData.length} user datas`);

      rows = petitions.map((petition, petitionIndex) => {
        if (petitionIndex % 100 === 0) {
          this.info(
            `about to process petition ${petition.id} (${petitionIndex + 1}/${petitions.length})...`,
          );
        }

        const logic = evaluateFieldLogic(composedPetitions[petitionIndex]);
        const petitionFields = applyFieldVisibility(composedPetitions[petitionIndex]).filter(
          (f) => f.type !== "HEADING",
        );

        const contacts = petitionsAccessesContacts[petitionIndex].filter(isNonNullish);
        const petitionFirstMessage = petitionsFirstMessage[petitionIndex];
        const petitionFirstMessageUserData = petitionsFirstMessageUserData[petitionIndex];
        const firstSendDate =
          petitionFirstMessage?.scheduled_at ?? petitionFirstMessage?.created_at ?? null;

        const contactNames = contacts.map((c) => fullName(c.first_name, c.last_name));
        const contactEmails = contacts.map((c) => c.email);

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

        const latestSignatureStatus = getPetitionSignatureStatus({
          status: petition.status!,
          currentSignatureRequest: latestSignatures[petitionIndex],
          signatureConfig: petition.signature_config,
        });

        const row: Record<string, Maybe<string | Date>> = {
          "parallel-id": toGlobalId("Petition", petition.id),
          "parallel-name": petition.name || "",
          "recipient-names": contactNames.join(", ") || "",
          "recipient-emails": contactEmails.join(", ") || "",
          "send-date": firstSendDate
            ? new Date(formatInTimeZone(firstSendDate, timezone, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"))
            : null,
          "sent-by": fullName(
            petitionFirstMessageUserData?.first_name,
            petitionFirstMessageUserData?.last_name,
          ),
          "parallel-owner": fullName(petitionOwner?.first_name, petitionOwner?.last_name),
          tags: petitionTags.map((t) => t.name).join(", "),
          status: petition.status
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
          "signature-status": latestSignatureStatus,
          "completed-at": latestPetitionCompletedEvent?.created_at ?? null,
          "closed-at": latestPetitionClosedEvent?.created_at ?? null,
          "signed-at": latestSignatureCompletedEvent?.created_at ?? null,
        };

        if (includePreviewUrl) {
          row["preview-url"] = `${parallelUrl}/${intl.locale}/app/petitions/${toGlobalId(
            "Petition",
            petition.id,
          )}/preview`;
        }

        for (const [name, value] of Object.entries(logic[0].finalVariables)) {
          const columnId = `variable-${name}`;
          let header = headers.find((h) => h.id === columnId);
          if (!header) {
            header = {
              id: columnId,
              title: name,
            };
            headers.splice(Object.keys(row).length, 0, header);
          }

          row[columnId] = isFinite(value) ? value.toString() : "";
        }

        function replyContent(
          r: Pick<PetitionFieldReply, "content" | "type">,
          field: Pick<PetitionField, "id" | "petition_id">,
        ) {
          switch (r.type) {
            case "CHECKBOX":
              return (r.content.value as string[]).join(", ");
            case "DYNAMIC_SELECT":
              return (r.content.value as string[][])
                .map((value) => (value[1] !== null ? value.join(": ") : null))
                .filter(isNonNullish)
                .join(", ");
            case "DATE_TIME":
              return intl.formatDate(r.content.value, {
                ...FORMATS["L+LT"],
                timeZone: "Etc/UTC",
              });
            case "BACKGROUND_CHECK":
              return backgroundCheckFieldReplyUrl(parallelUrl, intl.locale, field, r);
            default:
              return r.content.value as string;
          }
        }

        function fillRow(
          field: Pick<
            PetitionField,
            | "id"
            | "petition_id"
            | "from_petition_field_id"
            | "type"
            | "title"
            | "parent_petition_field_id"
          > & {
            reply_group_index?: number;
          },
          parent: Pick<PetitionField, "options" | "from_petition_field_id"> | null,
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
            const fieldTitle =
              field.title ??
              intl.formatMessage({
                id: "export-template-report.column-header-untitled-field",
                defaultMessage: "Untitled field",
              });

            const title = field.type === "DATE_TIME" ? fieldTitle + " (UTC)" : fieldTitle;
            const header = {
              id: columnId,
              parent_petition_field_id: parent?.from_petition_field_id,
              title: title.concat(
                isNonNullish(parent) && isNonNullish(field.reply_group_index)
                  ? ` [${titleize(
                      parent.options.groupName ??
                        intl.formatMessage({
                          id: "export-template-report.column-header-untitled-group",
                          defaultMessage: "Reply",
                        }),
                    )} ${field.reply_group_index + 1}]`
                  : "",
              ),
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
            ? replies.map((r) => replyContent({ ...r, type: field.type }, field)).join("; ")
            : replies.length > 0
              ? intl.formatMessage(
                  {
                    id: "export-template-report.file-cell-content",
                    defaultMessage: "{count, plural, =1{1 file} other {# files}}",
                  },
                  { count: replies.length },
                )
              : "";
        }

        for (const field of petitionFields) {
          if (field.type === "FIELD_GROUP") {
            for (const groupReply of field.replies) {
              for (const replyChild of groupReply.children ?? []) {
                fillRow(
                  {
                    ...replyChild.field,
                    reply_group_index: field.replies.indexOf(groupReply),
                  },
                  field,
                  replyChild.replies,
                );
              }
            }
          } else {
            fillRow(field, null, field.replies);
          }
        }

        return row;
      });
    }

    this.info("exporting data to excel...");
    const stream = await this.exportToExcel(headers, rows);

    this.info("uploading excel file to temporary bucket...");
    const tmpFile = await this.uploadTemporaryFile({
      stream,
      filename: intl.formatMessage(
        {
          id: "export-template-report.file-name",
          defaultMessage: "template-report-{id}.xlsx",
        },
        { id: toGlobalId("Petition", template!.id) },
      ),
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    return { temporary_file_id: tmpFile.id };
  }

  private async exportToExcel(
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
    stream.push(await wb.xlsx.writeBuffer());
    stream.push(null); // end of stream
    return stream;
  }

  private buildExcelHeaders(
    includePreviewUrl: boolean,
    flattenedFields: PetitionField[],
    intl: IntlShape,
  ) {
    const headers: { id: string; title: string; parent_petition_field_id?: number | null }[] = [
      {
        id: "parallel-id",
        title: intl.formatMessage({
          id: "export-template-report.column-header.petition-id",
          defaultMessage: "Parallel ID",
        }),
      },
      {
        id: "parallel-name",
        title: intl.formatMessage({
          id: "export-template-report.column-header.petition-name",
          defaultMessage: "Parallel name",
        }),
      },
      {
        id: "recipient-names",
        title: intl.formatMessage({
          id: "export-template-report.column-header.recipient-names",
          defaultMessage: "Recipient names",
        }),
      },
      {
        id: "recipient-emails",
        title: intl.formatMessage({
          id: "export-template-report.column-header.recipient-emails",
          defaultMessage: "Recipient emails",
        }),
      },
      {
        id: "send-date",
        title: intl.formatMessage({
          id: "export-template-report.column-header.sent-at",
          defaultMessage: "Sent at",
        }),
      },
      {
        id: "sent-by",
        title: intl.formatMessage({
          id: "export-template-report.column-header.sent-by",
          defaultMessage: "Sent by",
        }),
      },
      {
        id: "parallel-owner",
        title: intl.formatMessage({
          id: "export-template-report.column-header.parallel-owner",
          defaultMessage: "Owner",
        }),
      },
      {
        id: "tags",
        title: intl.formatMessage({
          id: "export-template-report.column-header.parallel-tags",
          defaultMessage: "Tags",
        }),
      },
      {
        id: "status",
        title: intl.formatMessage({
          id: "export-template-report.column-header.parallel-status",
          defaultMessage: "Status",
        }),
      },
      {
        id: "signature-status",
        title: intl.formatMessage({
          id: "export-template-report.column-header.parallel-signature-status",
          defaultMessage: "Signature status",
        }),
      },
      {
        id: "completed-at",
        title: intl.formatMessage({
          id: "export-template-report.column-header.parallel-completed-at",
          defaultMessage: "Completed at",
        }),
      },
      {
        id: "closed-at",
        title: intl.formatMessage({
          id: "export-template-report.column-header.parallel-closed-at",
          defaultMessage: "Closed at",
        }),
      },
      {
        id: "signed-at",
        title: intl.formatMessage({
          id: "export-template-report.column-header.parallel-signed-at",
          defaultMessage: "Signed at",
        }),
      },
    ];

    if (includePreviewUrl) {
      headers.push({
        id: "preview-url",
        title: intl.formatMessage({
          id: "export-template-report.column-header.preview-url",
          defaultMessage: "Preview URL",
        }),
      });
    }

    const [fields, children] = partition(
      flattenedFields,
      (f) => f.parent_petition_field_id === null,
    );

    const headerFields: (PetitionField & {
      group_name?: string | null;
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
            group_name: field.options.groupName ?? null,
            reply_group_index: 0,
          }));

        headerFields.push(...sortBy(childFields, [(f) => f.position, "asc"]));
      } else {
        headerFields.push(field);
      }
    }

    for (const field of headerFields) {
      const fieldTitle =
        field.title ??
        intl.formatMessage({
          id: "export-template-report.column-header-untitled-field",
          defaultMessage: "Untitled field",
        });

      const title = field.type === "DATE_TIME" ? fieldTitle + " (UTC)" : fieldTitle;

      headers.push({
        id: `field-${field.id}`.concat(
          isNonNullish(field.reply_group_index) ? `-${field.reply_group_index}` : "",
        ),
        parent_petition_field_id: field.parent_petition_field_id,
        title: title.concat(
          field.group_name !== undefined
            ? ` [${titleize(
                field.group_name ??
                  intl.formatMessage({
                    id: "export-template-report.column-header-untitled-group",
                    defaultMessage: "Reply",
                  }),
              )} 1]`
            : "",
        ),
      });
    }

    return headers;
  }
}
