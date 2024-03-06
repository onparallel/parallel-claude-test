import { isDefined } from "remeda";
import type { Cell } from "write-excel-file";

interface ExcelColumn<K extends string> {
  key: K;
  cell: Cell;
}

type ExcelRow<K extends string> = {
  [key in K]: string | undefined | null | Cell;
};

export async function generateExcel<K extends string>({
  fileName,
  columns,
  rows,
}: {
  fileName: string;
  columns: ExcelColumn<K>[];
  rows: ExcelRow<K>[];
}) {
  const writeXlsxFile = (await import("write-excel-file")).default;
  return await writeXlsxFile(
    [
      columns.map((c) => c.cell),
      ...rows.map((r) =>
        columns.map((c) => {
          const value = r[c.key];
          if (typeof value === "string") {
            return { value };
          } else if (isDefined(value)) {
            return value as Cell;
          } else {
            return {};
          }
        }),
      ),
    ],
    {
      fileName,
      stickyRowsCount: 1,
    },
  );
}
