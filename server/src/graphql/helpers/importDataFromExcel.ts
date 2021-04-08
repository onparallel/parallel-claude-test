import Excel from "exceljs";
import { Stream } from "stream";

/**
 * returns the contents of the first worksheet in the excel file
 * in a two-dimensional matrix of strings containing every cell with content.
 */
export async function importFromExcel(file: Stream) {
  const wb = new Excel.Workbook();
  const workbook = await wb.xlsx.read(file);
  const rows: string[][] = [];
  workbook.worksheets[0].eachRow({ includeEmpty: true }, (row) => {
    const cells: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      cells.push(cell.toString());
    });
    rows.push(cells);
  });
  return rows;
}
