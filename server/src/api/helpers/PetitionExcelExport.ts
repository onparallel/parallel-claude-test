import Excel from "exceljs";
import { IntlShape } from "react-intl";
import { Readable } from "stream";
import { ApiContext, WorkerContext } from "../../context";
import { PetitionField, PetitionFieldReply, UserLocale } from "../../db/__types";
import { backgroundCheckFieldReplyUrl } from "../../util/backgroundCheckReplyUrl";
import { ZipFileInput } from "../../util/createZipFile";
import { FORMATS } from "../../util/dates";
import { Maybe, UnwrapArray } from "../../util/types";
import { FieldCommentsExcelWorksheet } from "./FieldCommentsExcelWorksheet";
import { TextRepliesExcelWorksheet } from "./TextRepliesExcelWorksheet";

type ComposedPetitionField = Pick<
  PetitionField,
  "id" | "petition_id" | "type" | "title" | "parent_petition_field_id"
> & {
  replies: Pick<PetitionFieldReply, "content">[];
  group_name?: Maybe<string>;
  group_number?: number;
};

export class PetitionExcelExport {
  private wb: Excel.Workbook;
  private textRepliesTab!: TextRepliesExcelWorksheet;
  private fieldCommentsTab!: FieldCommentsExcelWorksheet;
  private intl!: IntlShape;

  constructor(
    private locale: UserLocale,
    private context: ApiContext | WorkerContext,
  ) {
    this.wb = new Excel.Workbook();
  }

  public async init() {
    this.intl = await this.context.i18n.getIntl(this.locale);

    this.textRepliesTab = new TextRepliesExcelWorksheet(
      this.intl.formatMessage({
        id: "petition-excel-export.replies",
        defaultMessage: "Replies",
      }),
      this.wb,
      this.context,
    );
    await this.textRepliesTab.init(this.locale);

    this.fieldCommentsTab = new FieldCommentsExcelWorksheet(
      this.intl.formatMessage({
        id: "petition-excel-export.comments",
        defaultMessage: "Comments",
      }),
      this.wb,
      this.context,
    );
    await this.fieldCommentsTab.init(this.locale);
  }

  public addPetitionVariables(variables: Record<string, number>) {
    this.textRepliesTab.addRows(
      Object.entries(variables).map(([name, value]) => ({
        title: name,
        answer: isFinite(value) ? value : "",
      })),
    );
  }

  public addPetitionFieldReply(field: ComposedPetitionField) {
    const content = this.extractCellContents(field);
    this.textRepliesTab.addRows({ title: content.title, answer: content.answer }, content.format);
  }

  private extractDynamicSelectReply(field: ComposedPetitionField) {
    return this.extractReplies(field, (r) =>
      (r.content.value as [string, string | null][]).map(([, v]) => v).join(", "),
    );
  }

  private extractSimpleReply(field: ComposedPetitionField) {
    return this.extractReplies(field, (r) => r.content.value);
  }

  private extractDateReply(field: ComposedPetitionField, format: Intl.DateTimeFormatOptions) {
    return this.extractReplies(field, (r) =>
      this.intl.formatDate(r.content.value, { ...format, timeZone: "Etc/UTC" }),
    );
  }

  private extractBackgroundCheckReply(field: ComposedPetitionField) {
    return this.extractReplies(field, (r) =>
      backgroundCheckFieldReplyUrl(this.context.config.misc.parallelUrl, this.locale, field, r),
    );
  }

  private extractReplies(
    field: ComposedPetitionField,
    contentMapper: (reply: UnwrapArray<ComposedPetitionField["replies"]>) => string,
  ) {
    const replies = field.replies.map(contentMapper).join(";");

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

  private extractCellContents(field: ComposedPetitionField): {
    title: string;
    answer: string;
    format?: { font: Partial<Excel.Font> };
  } {
    if (["TEXT", "SHORT_TEXT", "SELECT", "NUMBER", "PHONE", "CHECKBOX"].includes(field.type)) {
      return this.extractSimpleReply(field);
    } else if (field.type === "DYNAMIC_SELECT") {
      return this.extractDynamicSelectReply(field);
    } else if (field.type === "DATE") {
      return this.extractDateReply(field, FORMATS["L"]);
    } else if (field.type === "DATE_TIME") {
      return this.extractDateReply(field, FORMATS["L+LTS"]);
    } else if (field.type === "BACKGROUND_CHECK") {
      return this.extractBackgroundCheckReply(field);
    } else {
      throw new Error(`Can't extract replies on field type ${field.type}`);
    }
  }

  public async addPetitionFieldComments(
    fields: Pick<PetitionField, "id" | "petition_id" | "title">[],
  ) {
    await this.fieldCommentsTab.addFieldComments(fields);
  }

  public async export(): Promise<ZipFileInput> {
    const stream = new Readable();
    // remove the tabs that only contain the headings row
    if (this.textRepliesTab.rowCount === 1) {
      this.wb.removeWorksheet(this.textRepliesTab.worksheetName);
    }
    if (this.fieldCommentsTab.rowCount === 1) {
      this.wb.removeWorksheet(this.fieldCommentsTab.worksheetName);
    }
    stream.push(await this.wb.xlsx.writeBuffer());
    stream.push(null); // end of stream

    const intl = await this.context.i18n.getIntl(this.locale);

    return {
      filename: `${intl.formatMessage({
        id: "petition-excel-export.replies",
        defaultMessage: "Replies",
      })}.xlsx`,
      stream,
    };
  }

  public hasRows() {
    return this.textRepliesTab.rowCount > 1 || this.fieldCommentsTab.rowCount > 1;
  }
}
