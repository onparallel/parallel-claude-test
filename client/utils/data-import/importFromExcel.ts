import Excel from "exceljs";

/**
 * returns the contents of the first worksheet in the excel file
 * in a two-dimensional matrix of strings containing every cell with content.
 */
export async function importFromExcel(file: File) {
  const wb = new Excel.Workbook();
  const reader = new FileReader();
  return new Promise<string[][]>((resolve, reject) => {
    reader.readAsArrayBuffer(file);
    reader.onload = async () => {
      const buffer = reader.result as ArrayBuffer;
      const workbook = await wb.xlsx.load(buffer);

      const rows: string[][] = [];
      workbook.worksheets[0].eachRow({ includeEmpty: true }, (row) => {
        const cells: string[] = [];
        row.eachCell({ includeEmpty: true }, (cell) => {
          cells.push(cell.toString());
        });
        rows.push(cells);
      });
      resolve(rows);
    };
    reader.onerror = () => reject(reader.error);
  });
}
