import Excel from "exceljs";
import { Readable } from "stream";
import { ApiContext, WorkerContext } from "../../context";
import { PetitionField, PetitionFieldReply } from "../../db/__types";
import { ZipFileInput } from "../../util/createZipFile";
import { FieldCommentsExcelWorksheet } from "./FieldCommentsExcelWorksheet";
import { TextRepliesExcelWorksheet } from "./TextRepliesExcelWorksheet";

export class PetitionExcelExport {
  private wb: Excel.Workbook;
  private textRepliesTab!: TextRepliesExcelWorksheet;
  private fieldCommentsTab!: FieldCommentsExcelWorksheet;
  private locale: string;
  private context: ApiContext | WorkerContext;

  constructor(locale: string, context: ApiContext | WorkerContext) {
    this.wb = new Excel.Workbook();
    this.locale = locale;
    this.context = context;
  }

  public async init() {
    const intl = await this.context.i18n.getIntl(this.locale);

    this.textRepliesTab = new TextRepliesExcelWorksheet(
      intl.formatMessage({
        id: "petition-excel-export.replies",
        defaultMessage: "Replies",
      }),
      this.locale,
      this.wb,
      this.context
    );
    await this.textRepliesTab.init();

    this.fieldCommentsTab = new FieldCommentsExcelWorksheet(
      intl.formatMessage({
        id: "petition-excel-export.comments",
        defaultMessage: "Comments",
      }),
      this.locale,
      this.wb,
      this.context
    );
    await this.fieldCommentsTab.init();
  }

  public addPetitionFieldReply(field: PetitionField, replies: PetitionFieldReply[]) {
    if (field.type === "DYNAMIC_SELECT") {
      this.textRepliesTab.addDynamicSelectReply(field, replies);
    } else if (["TEXT", "SHORT_TEXT", "SELECT"].includes(field.type)) {
      this.textRepliesTab.addSimpleReply(field, replies);
    } else if (field.type === "CHECKBOX") {
      this.textRepliesTab.addCheckboxReply(field, replies);
    } else if (["NUMBER", "PHONE"].includes(field.type)) {
      this.textRepliesTab.addNumericReply(field, replies);
    } else if (field.type === "DATE") {
      this.textRepliesTab.addDateReply(field, replies);
    }
  }

  public async addPetitionFieldComments(fields: PetitionField[]) {
    await this.fieldCommentsTab.addFieldComments(fields);
  }

  public async export(): Promise<ZipFileInput> {
    const stream = new Readable();
    // remove the tabs that only contain the headings row
    if (this.textRepliesTab.rowCount === 1) {
      this.wb.removeWorksheet(this.textRepliesTab.worksheetName);
    }
    if (this.fieldCommentsTab.rowCount === 1) {
      this.wb.removeWorksheet(this.fieldCommentsTab.worksheetName);
    }
    stream.push(await this.wb.xlsx.writeBuffer());
    stream.push(null); // end of stream

    const intl = await this.context.i18n.getIntl(this.locale);

    return {
      filename: `${intl.formatMessage({
        id: "petition-excel-export.replies",
        defaultMessage: "Replies",
      })}.xlsx`,
      stream,
    };
  }

  public hasRows() {
    return this.textRepliesTab.rowCount > 1 || this.fieldCommentsTab.rowCount > 1;
  }
}
