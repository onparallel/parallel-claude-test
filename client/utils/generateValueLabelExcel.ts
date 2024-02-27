import { IntlShape } from "react-intl";
import { times, zip } from "remeda";

export async function generateValueLabelExcel(
  intl: IntlShape,
  {
    fileName,
    values,
    labels,
  }: {
    fileName: string;
    values: string[];
    labels: string[] | null;
  },
) {
  const writeXlsxFile = (await import("write-excel-file")).default;
  await writeXlsxFile(
    [
      [
        {
          value: intl.formatMessage({
            id: "util.generate-value-label-excel.value",
            defaultMessage: "Internal value",
          }),
          fontWeight: "bold",
        },
        {
          value: intl.formatMessage({
            id: "util.generate-value-label-excel.label",
            defaultMessage: "Label",
          }),
          fontWeight: "bold",
        },
      ],
      ...zip(values, labels ?? times(values.length, () => "")).map(([value, label]) => [
        { value },
        { value: label },
      ]),
    ],
    {
      fileName,
      stickyRowsCount: 1,
    },
  );
}
