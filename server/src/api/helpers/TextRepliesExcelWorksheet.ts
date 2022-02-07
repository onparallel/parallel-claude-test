import Excel from "exceljs";
import { PetitionField, PetitionFieldReply } from "../../db/__types";
import { Maybe } from "../../util/types";
import { ExcelWorksheet } from "./ExcelWorksheet";

export type TextReplyRow = {
  title: Maybe<string>;
  description: Maybe<string>;
  answer: string | number | Date;
};

export class TextRepliesExcelWorksheet extends ExcelWorksheet<TextReplyRow> {
  constructor(locale: string, wb: Excel.Workbook) {
    super(locale === "en" ? "Replies" : "Respuestas", locale, wb);
    this.page.columns = [
      { key: "title", header: locale === "en" ? "Field" : "Campo" },
      {
        key: "description",
        header: locale === "en" ? "Description" : "Descripción",
      },
      { key: "answer", header: locale === "en" ? "Reply" : "Respuesta" },
    ];
  }

  public addSimpleReply(field: PetitionField, replies: PetitionFieldReply[]) {
    if (replies.length > 0) {
      this.addRows(
        replies.map((r, i) => ({
          title: field.title?.concat(field.multiple ? ` [${i + 1}]` : "") || "",
          description: field.description?.slice(0, 200) || "",
          answer: r.content.text,
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
          description: field.description?.slice(0, 200) || "",
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
          description: field.description?.slice(0, 200) || "",
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
          (r.content.columns as [string, string | null][]).map(([label, value]) => ({
            title: field.title?.concat(` (${label})`, field.multiple ? ` [${i + 1}]` : "") || "",
            description: field.description?.slice(0, 200) || "",
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
          (r.content.choices as [string]).map((value) => ({
            title: field.title || "",
            description: field.description?.slice(0, 200) || "",
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
          description: data.description?.slice(0, 200) || "",
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
