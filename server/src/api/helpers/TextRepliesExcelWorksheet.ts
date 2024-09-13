import Excel from "exceljs";
import { IntlShape } from "react-intl";
import { Maybe } from "../../util/types";
import { ExcelWorksheet } from "./ExcelWorksheet";

export interface TextReplyRow {
  title: Maybe<string>;
  answer: string | number;
}

export class TextRepliesExcelWorksheet extends ExcelWorksheet<TextReplyRow> {
  constructor(
    worksheetName: string,
    wb: Excel.Workbook,
    private intl: IntlShape,
  ) {
    super(worksheetName, wb);
  }

  public async init() {
    this.page.columns = [
      {
        key: "title",
        header: this.intl.formatMessage({
          id: "text-replies-excel-worksheet.field",
          defaultMessage: "Field",
        }),
      },
      {
        key: "answer",
        header: this.intl.formatMessage({
          id: "text-replies-excel-worksheet.reply",
          defaultMessage: "Reply",
        }),
      },
    ];
  }
}
