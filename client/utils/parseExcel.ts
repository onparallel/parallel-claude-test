import { zip } from "remeda";

export async function parseExcel<K extends string>(
  file: File,
  { columns }: { columns: K[] },
): Promise<{ [key in K]: string }[]> {
  const readXlsxFile = (await import("read-excel-file")).default;
  const rows = await readXlsxFile(file);
  return rows
    .slice(1)
    .map(
      (row) =>
        Object.fromEntries(
          zip(columns, row).map(([column, cell]) => [column, cell?.toString()]),
        ) as { [key in K]: string },
    );
}
