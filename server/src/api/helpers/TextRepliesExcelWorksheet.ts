import Excel from "exceljs";
import { IntlShape } from "react-intl";
import { ApiContext, WorkerContext } from "../../context";
import { UserLocale } from "../../db/__types";
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
    private context: ApiContext | WorkerContext,
  ) {
    super(worksheetName, wb);
  }

  private intl!: IntlShape;
  public async init(locale: UserLocale) {
    this.intl = await this.context.i18n.getIntl(locale);

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
