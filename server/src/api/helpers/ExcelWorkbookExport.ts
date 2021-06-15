import Excel from "exceljs";
import { Readable } from "stream";
import { ZipFileInput } from "../../util/createZipFile";
import { FieldCommentsExcelWorksheet } from "./FieldCommentsExcelWorksheet";
import { TextRepliesExcelWorksheet } from "./TextRepliesExcelWorksheet";

export class ExcelWorkbookExport {
  private wb: Excel.Workbook;
  public textRepliesTab: TextRepliesExcelWorksheet;
  public fieldCommentsTab: FieldCommentsExcelWorksheet;
  private locale: string;

  constructor(locale: string) {
    this.wb = new Excel.Workbook();
    this.textRepliesTab = new TextRepliesExcelWorksheet(locale, this.wb);
    this.fieldCommentsTab = new FieldCommentsExcelWorksheet(locale, this.wb);
    this.locale = locale;
  }

  public async export(): Promise<ZipFileInput> {
    const stream = new Readable();
    // remove the tabs that only contain the headings row
    if (this.textRepliesTab.rowCount === 1) {
      this.wb.removeWorksheet(this.textRepliesTab.tabName);
    }
    if (this.fieldCommentsTab.rowCount === 1) {
      this.wb.removeWorksheet(this.fieldCommentsTab.tabName);
    }
    stream.push(await this.wb.xlsx.writeBuffer());
    stream.push(null); // end of stream

    return {
      filename: this.locale === "en" ? "Replies.xlsx" : "Respuestas.xlsx",
      stream,
    };
  }

  public hasRows() {
    return (
      this.textRepliesTab.rowCount > 1 || this.fieldCommentsTab.rowCount > 1
    );
  }
}
