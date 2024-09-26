import Excel from "exceljs";
import { MaybeArray, unMaybeArray } from "../../util/types";

export abstract class ExcelWorksheet<T> {
  protected page: Excel.Worksheet;

  constructor(
    public worksheetName: string,
    wb: Excel.Workbook,
  ) {
    this.page = wb.addWorksheet(worksheetName);
  }

  public addRows(rows: MaybeArray<T>, format?: { font: Partial<Excel.Font> }) {
    unMaybeArray(rows).forEach((row) => {
      this.page.addRow(row, "n").eachCell((cell) => {
        cell.alignment = { wrapText: true };
        if (format?.font) {
          cell.font = format.font;
        }
      });
    });
  }

  public get rowCount() {
    return this.page.actualRowCount;
  }
}
