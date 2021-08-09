import Excel from "exceljs";
import { Readable } from "stream";
import { ApiContext } from "../../context";
import { PetitionField, PetitionFieldReply } from "../../db/__types";
import { ZipFileInput } from "../../util/createZipFile";
import { FieldCommentsExcelWorksheet } from "./FieldCommentsExcelWorksheet";
import { TextRepliesExcelWorksheet } from "./TextRepliesExcelWorksheet";

export class PetitionExcelExport {
  private wb: Excel.Workbook;
  private textRepliesTab: TextRepliesExcelWorksheet;
  private fieldCommentsTab: FieldCommentsExcelWorksheet;
  private locale: string;

  constructor(locale: string, context: ApiContext) {
    this.wb = new Excel.Workbook();
    this.textRepliesTab = new TextRepliesExcelWorksheet(locale, this.wb);
    this.fieldCommentsTab = new FieldCommentsExcelWorksheet(locale, this.wb, context);
    this.locale = locale;
  }

  public addPetitionFieldReply(field: PetitionField, replies: PetitionFieldReply[]) {
    if (field.type === "DYNAMIC_SELECT") {
      this.textRepliesTab.addDynamicSelectReply(field, replies);
    } else if (["TEXT", "SHORT_TEXT", "SELECT"].includes(field.type)) {
      this.textRepliesTab.addSimpleReply(field, replies);
    } else if (field.type === "CHECKBOX") {
      this.textRepliesTab.addCheckboxReply(field, replies);
    }
  }

  public async addPetitionFieldComments(field: PetitionField) {
    await this.fieldCommentsTab.addFieldComments(field);
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

    return {
      filename: this.locale === "en" ? "Replies.xlsx" : "Respuestas.xlsx",
      stream,
    };
  }

  public hasRows() {
    return this.textRepliesTab.rowCount > 1 || this.fieldCommentsTab.rowCount > 1;
  }
}
