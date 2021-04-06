import Excel from "exceljs";
import { FileUpload } from "graphql-upload";

/**
 * returns the contents of the first worksheet in the excel file
 * in a two-dimensional matrix of strings containing every cell with content.
 */
export async function importFromExcel(file: FileUpload) {
  const wb = new Excel.Workbook();

  return new Promise<string[][]>(async (resolve, reject) => {
    try {
      const workbook = await wb.xlsx.read(file.createReadStream());
      const rows: string[][] = [];
      workbook.worksheets[0].eachRow({ includeEmpty: true }, (row) => {
        const cells: string[] = [];
        row.eachCell({ includeEmpty: true }, (cell) => {
          cells.push(cell.toString());
        });
        rows.push(cells);
      });
      resolve(rows);
    } catch (e) {
      reject(e);
    }
  });
}
