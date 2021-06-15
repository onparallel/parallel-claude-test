import Excel from "exceljs";
import { Maybe } from "../../util/types";
import { ExcelWorksheet } from "./ExcelWorksheet";

export type FieldCommentRow = {
  content: string;
  fieldName: Maybe<string>;
  authorFullName: string;
  authorEmail: string;
  createdAt: string;
  isInternal: string;
  isRead: string;
};

export class FieldCommentsExcelWorksheet extends ExcelWorksheet<FieldCommentRow> {
  constructor(locale: string, wb: Excel.Workbook) {
    super(locale === "en" ? "Comments" : "Comentarios", locale, wb);
    this.page.columns = [
      {
        key: "content",
        header: this.locale === "en" ? "Message" : "Mensaje",
      },
      { key: "fieldName", header: this.locale === "en" ? "Field" : "Campo" },
      {
        key: "authorFullName",
        header: this.locale === "en" ? "Full name" : "Nombre completo",
      },
      { key: "authorEmail", header: "Email" },
      {
        key: "createdAt",
        header:
          this.locale === "en"
            ? "Message sent at"
            : "Hora de envío del mensaje",
      },
      { key: "isRead", header: this.locale === "en" ? "Is read?" : "¿Leído?" },
      {
        key: "isInternal",
        header:
          this.locale === "en" ? "Internal comment?" : "¿Comentario interno?",
      },
    ];
  }
}
