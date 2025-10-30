import Excel from "exceljs";
import pMap from "p-map";
import { IntlShape } from "react-intl";
import { Readable } from "stream";
import { PetitionField, PetitionFieldReply } from "../../db/__types";
import { ContactRepository } from "../../db/repositories/ContactRepository";
import { PetitionRepository } from "../../db/repositories/PetitionRepository";
import { UserRepository } from "../../db/repositories/UserRepository";
import { FORMATS } from "../../util/dates";
import { fieldReplyUrl } from "../../util/fieldReplyUrl";
import { Maybe, UnwrapArray } from "../../util/types";
import { FieldCommentsExcelWorksheet } from "./FieldCommentsExcelWorksheet";
import { TextRepliesExcelWorksheet } from "./TextRepliesExcelWorksheet";

type ComposedPetitionField = Pick<
  PetitionField,
  "id" | "petition_id" | "type" | "title" | "parent_petition_field_id"
> & {
  replies: Pick<PetitionFieldReply, "content" | "parent_petition_field_reply_id">[];
  group_name?: Maybe<string>;
  group_number?: number;
};

export class PetitionExcelExport {
  private wb: Excel.Workbook;
  private textRepliesTab!: TextRepliesExcelWorksheet;
  private fieldCommentsTab!: FieldCommentsExcelWorksheet;

  constructor(
    private intl: IntlShape,
    private parallelUrl: string,
    private context: {
      petitions: PetitionRepository;
      users: UserRepository;
      contacts: ContactRepository;
    },
  ) {
    this.wb = new Excel.Workbook();
  }

  public async init() {
    this.textRepliesTab = new TextRepliesExcelWorksheet(
      this.intl.formatMessage({
        id: "petition-excel-export.replies",
        defaultMessage: "Replies",
      }),
      this.wb,
      this.intl,
    );
    await this.textRepliesTab.init();

    this.fieldCommentsTab = new FieldCommentsExcelWorksheet(
      this.intl.formatMessage({
        id: "petition-excel-export.comments",
        defaultMessage: "Comments",
      }),
      this.wb,
      this.intl,
      this.context,
    );
    await this.fieldCommentsTab.init();
  }

  public addPetitionVariables(variables: Record<string, number>) {
    this.textRepliesTab.addRows(
      Object.entries(variables).map(([name, value]) => ({
        title: name,
        answer: isFinite(value) ? value : "",
      })),
    );
  }

  public async addPetitionFieldReply(field: ComposedPetitionField) {
    const content = await this.extractCellContents(field);
    this.textRepliesTab.addRows({ title: content.title, answer: content.answer }, content.format);
  }

  private async extractDynamicSelectReply(field: ComposedPetitionField) {
    return await this.extractReplies(field, (r) =>
      (r.content.value as [string, string | null][]).map(([, v]) => v).join(", "),
    );
  }

  private async extractSimpleReply(field: ComposedPetitionField) {
    return await this.extractReplies(field, (r) => r.content.value);
  }

  private async extractDateReply(field: ComposedPetitionField, format: Intl.DateTimeFormatOptions) {
    return await this.extractReplies(field, (r) =>
      this.intl.formatDate(r.content.value, { ...format, timeZone: "Etc/UTC" }),
    );
  }

  private async extractReplyUrl(field: ComposedPetitionField) {
    return await this.extractReplies(field, (r) =>
      fieldReplyUrl(this.parallelUrl, this.intl.locale, field, r),
    );
  }

  private async extractUserAssignmentReply(field: ComposedPetitionField) {
    return await this.extractReplies(field, async (r) => {
      const userData = await this.context.users.loadUserDataByUserId(r.content.value as number);
      return userData?.email ?? "";
    });
  }

  private async extractReplies(
    field: ComposedPetitionField,
    contentMapper: (
      reply: UnwrapArray<ComposedPetitionField["replies"]>,
    ) => Promise<string> | string,
  ) {
    const replies = (await pMap(field.replies, contentMapper, { concurrency: 1 })).join(";");

    let fieldTitle =
      field.title ??
      this.intl.formatMessage({
        id: "petition-excel-export.untitled-field",
        defaultMessage: "Untitled field",
      });

    if (field.parent_petition_field_id) {
      fieldTitle += ` [${
        field.group_name ??
        this.intl.formatMessage({
          id: "petition-excel-export.untitled-group",
          defaultMessage: "Reply",
        })
      } ${field.group_number?.toString() ?? ""}]`;
    }

    return {
      title: fieldTitle,
      answer:
        replies ||
        `[${this.intl.formatMessage({
          id: "petition-excel-export.not-replied",
          defaultMessage: "Not replied",
        })}]`,
      format: !replies
        ? { font: { color: { argb: "FFA6A6A6" } } } // no replies on the field, color the row gray
        : undefined,
    };
  }

  private async extractCellContents(field: ComposedPetitionField): Promise<{
    title: string;
    answer: string;
    format?: { font: Partial<Excel.Font> };
  }> {
    if (["TEXT", "SHORT_TEXT", "SELECT", "NUMBER", "PHONE", "CHECKBOX"].includes(field.type)) {
      return await this.extractSimpleReply(field);
    } else if (field.type === "DYNAMIC_SELECT") {
      return await this.extractDynamicSelectReply(field);
    } else if (field.type === "DATE") {
      return await this.extractDateReply(field, FORMATS["L"]);
    } else if (field.type === "DATE_TIME") {
      return await this.extractDateReply(field, FORMATS["L+LTS"]);
    } else if (field.type === "BACKGROUND_CHECK" || field.type === "ADVERSE_MEDIA_SEARCH") {
      return await this.extractReplyUrl(field);
    } else if (field.type === "USER_ASSIGNMENT") {
      return await this.extractUserAssignmentReply(field);
    } else {
      throw new Error(`Can't extract replies on field type ${field.type}`);
    }
  }

  public async addPetitionFieldComments(
    fields: Pick<PetitionField, "id" | "petition_id" | "title">[],
  ) {
    await this.fieldCommentsTab.addFieldComments(fields);
  }

  public async export(includeEmpty?: boolean) {
    const stream = new Readable();
    // remove the tabs that only contain the headings row if includeEmpty is false
    if (!includeEmpty) {
      if (this.textRepliesTab.rowCount === 1) {
        this.wb.removeWorksheet(this.textRepliesTab.worksheetName);
      }
      if (this.fieldCommentsTab.rowCount === 1) {
        this.wb.removeWorksheet(this.fieldCommentsTab.worksheetName);
      }
    }
    stream.push(await this.wb.xlsx.writeBuffer());
    stream.push(null); // end of stream

    return stream;
  }

  public hasRows() {
    return this.textRepliesTab.rowCount > 1 || this.fieldCommentsTab.rowCount > 1;
  }
}
