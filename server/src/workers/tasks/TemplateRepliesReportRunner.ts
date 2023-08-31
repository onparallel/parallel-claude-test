import { IntlShape } from "@formatjs/intl";
import { formatInTimeZone } from "date-fns-tz";
import Excel from "exceljs";
import { isDefined, minBy, zip } from "remeda";
import { Readable } from "stream";
import {
  PetitionField,
  PetitionFieldReply,
  PetitionMessage,
  PetitionSignatureRequest,
  PetitionStatus,
} from "../../db/__types";
import { FORMATS } from "../../util/dates";
import { getFieldIndices } from "../../util/fieldIndices";
import { evaluateFieldVisibility } from "../../util/fieldVisibility";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { isFileTypeField } from "../../util/isFileTypeField";
import { Maybe } from "../../util/types";
import { TaskRunner } from "../helpers/TaskRunner";

function getPetitionSignatureStatus({
  status,
  currentSignatureRequest,
  signatureConfig,
}: {
  status: PetitionStatus;
  currentSignatureRequest?: PetitionSignatureRequest | null;
  signatureConfig?: any;
}) {
  if (
    isDefined(signatureConfig) &&
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

  if (isDefined(currentSignatureRequest)) {
    // signature request is already started, return the current status
    if (["ENQUEUED", "PROCESSING", "PROCESSED"].includes(currentSignatureRequest.status)) {
      return "PROCESSING";
    } else {
      return currentSignatureRequest.status as "COMPLETED" | "CANCELLED";
    }
  } else if (isDefined(signatureConfig) && ["DRAFT", "PENDING"].includes(status)) {
    // petition has signature configured but it's not yet completed
    return "NOT_STARTED";
  }

  // petition doesn't have signature configured and never started a signature request
  return "NO_SIGNATURE";
}

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
      this.ctx.readonlyPetitions.loadFieldsForPetition(templateId),
      this.ctx.readonlyPetitions.getPetitionsForTemplateRepliesReport(
        templateId,
        startDate,
        endDate,
      ),
    ]);
    const intl = await this.ctx.i18n.getIntl(template!.recipient_locale);

    const headers = this.buildExcelHeaders(includePreviewUrl, templateFields, intl);
    let rows: Record<string, Maybe<string | Date>>[] = [];

    if (petitions.length > 0) {
      const [
        petitionsAccesses,
        petitionsMessages,
        petitionsFieldsWithReplies,
        petitionsOwner,
        petitionsTags,
        petitionsEvents,
        latestSignatures,
      ] = await Promise.all([
        this.ctx.readonlyPetitions.loadAccessesForPetition(petitions.map((p) => p.id)),
        this.ctx.readonlyPetitions.loadMessagesByPetitionId(petitions.map((p) => p.id)),
        this.ctx.readonlyPetitions.getPetitionFieldsWithReplies(petitions.map((p) => p.id)),
        this.ctx.readonlyPetitions.loadPetitionOwner(petitions.map((p) => p.id)),
        this.ctx.readonlyTags.loadTagsByPetitionId(petitions.map((p) => p.id)),
        this.ctx.readonlyPetitions.loadPetitionEventsByPetitionId(petitions.map((p) => p.id)),
        this.ctx.readonlyPetitions.loadLatestPetitionSignatureByPetitionId(
          petitions.map((p) => p.id),
        ),
      ]);

      const petitionsAccessesContacts = await Promise.all(
        petitionsAccesses.map((accesses) =>
          this.ctx.readonlyContacts.loadContactByAccessId(accesses.map((a) => a.id)),
        ),
      );

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

      rows = petitions.map((petition, petitionIndex) => {
        const petitionFields = petitionsFieldsWithReplies[petitionIndex];

        const contacts = petitionsAccessesContacts[petitionIndex].filter(isDefined);
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
          row["preview-url"] = `${this.ctx.config.misc.parallelUrl}/${
            intl.locale
          }/app/petitions/${toGlobalId("Petition", petition.id)}/preview`;
        }

        const fieldIndexes = getFieldIndices(petitionFields);
        const visibilities = evaluateFieldVisibility(petitionFields);
        zip(petitionFields, fieldIndexes)
          .filter((_, i) => visibilities[i])
          .forEach(([field]) => {
            const columnId = `field-${field.from_petition_field_id ?? field.id}`;

            // make sure header is defined on this field
            const header = headers.find((h) => h.id === columnId);
            if (!header) {
              headers.push({
                id: columnId,
                title: (field.type === "DATE_TIME" ? field.title + " (UTC)" : field.title) ?? "",
              });
            }

            row[columnId] = !isFileTypeField(field.type)
              ? field.replies
                  .map((r) => this.replyContent({ ...r, type: field.type }, intl as IntlShape))
                  .join("; ")
              : field.replies.length > 0
              ? intl.formatMessage(
                  {
                    id: "export-template-report.file-cell-content",
                    defaultMessage: "{count, plural, =1{1 file} other {# files}}",
                  },
                  { count: field.replies.length },
                )
              : "";
          });

        return row;
      });
    }

    const stream = await this.exportToExcel(headers, rows);

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

  private buildExcelHeaders(includePreviewUrl: boolean, fields: PetitionField[], intl: IntlShape) {
    const headers = [
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

    for (const field of fields.filter((f) => f.type !== "HEADING")) {
      headers.push({
        id: `field-${field.id}`,
        title: (field.type === "DATE_TIME" ? field.title + " (UTC)" : field.title) ?? "",
      });
    }

    return headers;
  }
}
