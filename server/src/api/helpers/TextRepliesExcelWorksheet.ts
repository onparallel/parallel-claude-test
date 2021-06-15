import Excel from "exceljs";
import { Maybe } from "../../util/types";
import { ExcelWorksheet } from "./ExcelWorksheet";

export type TextReplyRow = {
  title: Maybe<string>;
  description: Maybe<string>;
  answer: string;
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

  public addEmptyReply(data: Omit<TextReplyRow, "answer">) {
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

  public get noAnswerLabel() {
    return this.locale === "en" ? "[Not replied]" : "[No cumplimentado]";
  }
}
