import Excel from "exceljs";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray } from "../../util/types";

export abstract class ExcelWorksheet<T> {
  protected page: Excel.Worksheet;

  constructor(public worksheetName: string, protected locale: string, wb: Excel.Workbook) {
    this.page = wb.addWorksheet(worksheetName);
  }

  protected addRows(rows: MaybeArray<T>, cellFont?: Partial<Excel.Font>) {
    unMaybeArray(rows).forEach((row) => {
      this.page.addRow(row, "n").eachCell((cell) => {
        if (cellFont) {
          cell.font = cellFont;
        }
      });
    });
  }

  public get rowCount() {
    return this.page.actualRowCount;
  }
}
