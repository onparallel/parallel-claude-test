import Excel from "exceljs";
import { Readable } from "stream";
import { ZipFileInput } from "../../util/createZipFile";

type TextReplyRow = {
  title: string;
  description: string;
  answer: string;
};

type RowStyle = {
  fontColorARGB?: string;
};

type LocaleLabels = {
  title: string;
  description: string;
  answer: string;
  noAnswer: string;
  filename: string;
};

export class TextRepliesExcel {
  private wb: Excel.Workbook;
  private page: Excel.Worksheet;
  public labels: LocaleLabels;
  private readonly locales: { [key: string]: LocaleLabels } = {
    en: {
      title: "Title",
      description: "Description",
      answer: "Answer",
      noAnswer: "[not replied.]",
      filename: "Replies",
    },
    es: {
      title: "Título",
      description: "Descripción",
      answer: "Respuesta",
      noAnswer: "[no cumplimentado.]",
      filename: "Respuestas",
    },
  };

  constructor(locale: string) {
    this.labels = this.locales[locale];
    this.wb = new Excel.Workbook();
    this.page = this.wb.addWorksheet(this.labels.filename);
    this.page.columns = [
      { key: "title" },
      { key: "description" },
      { key: "answer" },
    ];
  }

  public addRows(data: TextReplyRow[], styles?: RowStyle) {
    data.forEach((row) => {
      this.page.addRow(row, "n").eachCell((cell) => {
        cell.font = {
          color: {
            argb: styles?.fontColorARGB || "00000000",
          },
        };
      });
    });
  }

  public hasRows() {
    return this.page.actualRowCount > 0;
  }

  public async export(): Promise<ZipFileInput> {
    const stream = new Readable();
    stream.push(await this.wb.xlsx.writeBuffer());
    stream.push(null); // end of stream

    return {
      filename: this.labels.filename.concat(".xlsx"),
      stream,
    };
  }
}
