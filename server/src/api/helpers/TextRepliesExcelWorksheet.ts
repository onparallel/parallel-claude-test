import Excel from "exceljs";
import { ApiContext, WorkerContext } from "../../context";
import { PetitionField, PetitionFieldReply } from "../../db/__types";
import { Maybe } from "../../util/types";
import { ExcelWorksheet } from "./ExcelWorksheet";

export type TextReplyRow = {
  title: Maybe<string>;
  answer: string | number | Date;
};

export class TextRepliesExcelWorksheet extends ExcelWorksheet<TextReplyRow> {
  constructor(
    worksheetName: string,
    locale: string,
    wb: Excel.Workbook,
    private context: ApiContext | WorkerContext
  ) {
    super(worksheetName, locale, wb);
    this.locale = locale;
  }

  public async init() {
    const intl = await this.context.i18n.getIntl(this.locale);

    this.page.columns = [
      {
        key: "title",
        header: intl.formatMessage({
          id: "text-replies-excel-worksheet.field",
          defaultMessage: "Field",
        }),
      },
      {
        key: "answer",
        header: intl.formatMessage({
          id: "text-replies-excel-worksheet.reply",
          defaultMessage: "Reply",
        }),
      },
    ];
  }

  public addSimpleReply(field: PetitionField, replies: PetitionFieldReply[]) {
    if (replies.length > 0) {
      this.addRows(
        replies.map((r, i) => ({
          title: field.title?.concat(field.multiple ? ` [${i + 1}]` : "") || "",
          answer: r.content.value,
        }))
      );
    } else {
      this.addEmptyReply(field);
    }
  }

  public addNumericReply(field: PetitionField, replies: PetitionFieldReply[]) {
    if (replies.length > 0) {
      this.addRows(
        replies.map((r, i) => ({
          title: field.title?.concat(field.multiple ? ` [${i + 1}]` : "") || "",
          answer: r.content.value,
        }))
      );
    } else {
      this.addEmptyReply(field);
    }
  }

  public addDateReply(field: PetitionField, replies: PetitionFieldReply[]) {
    if (replies.length > 0) {
      this.addRows(
        replies.map((r, i) => ({
          title: field.title?.concat(field.multiple ? ` [${i + 1}]` : "") || "",
          answer: new Date(r.content.value),
        }))
      );
    } else {
      this.addEmptyReply(field);
    }
  }

  public addDynamicSelectReply(field: PetitionField, replies: PetitionFieldReply[]) {
    if (replies.length > 0) {
      this.addRows(
        replies.flatMap((r, i) =>
          (r.content.value as [string, string | null][]).map(([label, value]) => ({
            title: field.title?.concat(` (${label})`, field.multiple ? ` [${i + 1}]` : "") || "",
            answer: value ?? this.noAnswerLabel,
          }))
        )
      );
    } else {
      this.addEmptyReply(field);
    }
  }

  public addCheckboxReply(field: PetitionField, replies: PetitionFieldReply[]) {
    if (replies.length > 0) {
      this.addRows(
        replies.flatMap((r, i) =>
          (r.content.value as [string]).map((value) => ({
            title: field.title || "",
            answer: value,
          }))
        )
      );
    } else {
      this.addEmptyReply(field);
    }
  }

  private addEmptyReply(data: Omit<TextReplyRow, "answer">) {
    this.addRows(
      [
        {
          title: data.title || "",
          answer: this.noAnswerLabel,
        },
      ],
      {
        color: { argb: "FFA6A6A6" },
      }
    );
  }

  private get noAnswerLabel() {
    return this.locale === "en" ? "[Not replied]" : "[No cumplimentado]";
  }
}
