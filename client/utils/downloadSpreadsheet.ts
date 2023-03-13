import type { Workbook } from "exceljs";

export async function downloadSpreadsheet(
  name: string,
  builder: (workbook: Workbook) => Promise<void>
) {
  const exceljs = (await import("exceljs")).default;
  const workbook = new exceljs.Workbook();
  await builder(workbook);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.URL.revokeObjectURL(url);
}
