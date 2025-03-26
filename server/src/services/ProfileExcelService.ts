import { Workbook } from "exceljs";
import { injectable } from "inversify";
import pMap from "p-map";
import { IntlShape } from "react-intl";
import { isNonNullish, range } from "remeda";
import { assert } from "ts-essentials";
import { ProfileTypeField, UserLocale } from "../db/__types";
import { profileTypeFieldSelectValues } from "../db/helpers/profileTypeFieldOptions";
import { LocalizableUserText } from "../graphql";
import { fromGlobalId, isGlobalId, toGlobalId } from "../util/globalId";

@injectable()
export abstract class ProfileExcelService {
  constructor() {}

  protected async initializeExcelWorkbook(
    columns: ("profile-id" | number)[],
    profileTypeFieldsById: Record<number, ProfileTypeField>,
    intl: IntlShape,
  ) {
    const workbook = new Workbook();

    const dataTab = workbook.addWorksheet(
      intl.formatMessage({ id: "profiles-excel.data-tab-name", defaultMessage: "Data" }),
    );

    dataTab.columns = columns.flatMap((column) => {
      if (column === "profile-id") {
        return [
          {
            key: "profile-id",
            header: intl.formatMessage({
              id: "profiles-excel.profile-id-header",
              defaultMessage: "ID",
            }),
          },
        ];
      } else {
        assert(typeof column === "number", `Invalid column ${column}`);

        const globalId = toGlobalId("ProfileTypeField", column);
        const field = profileTypeFieldsById[column];
        assert(field, `Field with id ${column} not found`);

        const fieldName = this.localizableText(field.name, intl);
        return [
          { key: globalId, header: fieldName },
          field.is_expirable && !field.options.useReplyAsExpiryDate
            ? {
                key: `${globalId}-expiry`,
                header: intl.formatMessage(
                  {
                    id: "profiles-excel.field-with-expiry.header",
                    defaultMessage: "{name} expiry date",
                  },
                  { name: fieldName },
                ),
              }
            : null,
        ].filter(isNonNullish);
      }
    });

    // this will write 2nd row on the excel, where we put every field globalId
    dataTab.addRow(
      Object.fromEntries(
        columns
          .flatMap((column) => {
            if (column === "profile-id") {
              return [column];
            } else {
              assert(typeof column === "number", `Invalid column ${column}`);
              const field = profileTypeFieldsById[column];
              assert(field, `Field with id ${column} not found`);
              const globalId = toGlobalId("ProfileTypeField", column);

              if (field.is_expirable && !field.options.useReplyAsExpiryDate) {
                return [globalId, `${globalId}-expiry`];
              }

              return [globalId];
            }
          })
          .map((value) => [value, value])
          .filter(isNonNullish),
      ),
    );

    for (const rowNumber of [1, 2]) {
      dataTab.getRow(rowNumber).eachCell((c) => {
        c.style = {
          fill: { type: "pattern", pattern: "solid", fgColor: { argb: "00F7C7AC" } },
          font: { bold: rowNumber === 1 },
        };
      });
    }

    for (const column of dataTab.columns) {
      let maxLength = 10;
      column.eachCell?.((cell) => {
        // adjust column width to max value length
        const colLength = cell.value?.toString().length;
        if (colLength && colLength > maxLength) {
          maxLength = colLength;
        }
      });
      column.width = maxLength;

      if (column.key && isGlobalId(column.key, "ProfileTypeField")) {
        const field = profileTypeFieldsById[fromGlobalId(column.key).id];
        if (field.type === "SELECT") {
          const options = await profileTypeFieldSelectValues(field.options);

          // Create a hidden sheet for validation lists
          const validationSheet = workbook.addWorksheet("_" + column.key, { state: "veryHidden" });
          // Add options in column A
          options.forEach((opt, idx) => {
            validationSheet.getCell(`A${idx + 1}`).value = opt.value;
          });

          // Set validation for each cell in the data column
          for (const rowNumber of range(3, 1000)) {
            dataTab.getCell(rowNumber, column.number).dataValidation = {
              type: "list",
              allowBlank: true,
              formulae: [`='_${column.key}'!$A$1:$A$${options.length}`],
              showErrorMessage: true,
              errorStyle: "error",
            };
          }
        }
      }
    }

    await this.addInstructionsTab(
      workbook,
      columns.filter((c) => typeof c === "number").map((id) => profileTypeFieldsById[id]),
      columns.includes("profile-id"),
      intl,
    );

    return workbook;
  }

  private async addInstructionsTab(
    workbook: Workbook,
    fields: Pick<ProfileTypeField, "name" | "type" | "options">[],
    hasProfileIdColumn: boolean,
    intl: IntlShape,
  ) {
    const worksheet = workbook.addWorksheet(
      intl.formatMessage({
        id: "profiles-excel.instructions-tab-name",
        defaultMessage: "Instructions",
      }),
    );
    worksheet.addRows(
      [
        [
          intl.formatMessage({
            id: "profiles-excel.instructions.header",
            defaultMessage: "Instructions",
          }),
        ],
        [
          intl.formatMessage({
            id: "profiles-excel.instructions.top-rows",
            defaultMessage: "- Do not modify the content of the top two rows.",
          }),
        ],
        [
          hasProfileIdColumn
            ? intl.formatMessage({
                id: "profiles-excel.instructions.profile-id-column",
                defaultMessage: "- Do not modify the contents of the first column.",
              })
            : null,
        ],
        [
          intl.formatMessage({
            id: "profiles-excel.instructions.date-format",
            defaultMessage:
              "- Dates should be added as text (with leading ') and format yyyy-MM-dd. e.g. '2022-01-01",
          }),
        ],
        [
          intl.formatMessage({
            id: "profiles-excel.instructions.phone-format",
            defaultMessage:
              "- Phones should be added with country code prefix and no spaces. e.g. +1234567890",
          }),
        ],
        [
          intl.formatMessage({
            id: "profiles-excel.instructions.country-format",
            defaultMessage:
              "- Countries should be added as ISO 3166-1 alpha-2 codes. e.g. US, ES, FR",
          }),
        ],
      ].filter((r) => r[0] !== null),
    );

    const listFields = fields.filter((f) => f.type === "SELECT" || f.type === "CHECKBOX");
    if (listFields.length === 0) {
      return;
    }

    // for each SELECT or CHECKBOX column, show here their valid options
    worksheet.addRows([
      [],
      [
        intl.formatMessage({
          id: "profiles-excel.instructions.data-format",
          defaultMessage: "Data format",
        }),
      ],
      [
        intl.formatMessage({
          id: "profiles-excel.instructions.data-format-explanation-line-1",
          defaultMessage: "- The following columns can only have the indicated values",
        }),
      ],
      [
        intl.formatMessage({
          id: "profiles-excel.instructions.data-format-explanation-line-2",
          defaultMessage: "- If the column allows multiple values (M), separate them with a comma.",
        }),
      ],
    ]);

    const dataFormatRow = worksheet.addRow(
      listFields.map(
        (f) => this.localizableText(f.name, intl) + (f.type === "CHECKBOX" ? " (M)" : ""),
      ),
    );

    dataFormatRow.eachCell((c) => {
      c.style = {
        font: { bold: true },
      };
    });

    await pMap(
      listFields,
      async (field, i) => {
        const values = await profileTypeFieldSelectValues(field.options);
        const cell = dataFormatRow.getCell(i + 1);
        values.forEach((v, n) => {
          worksheet.getCell(cell.row + 1 + n, cell.col).value = v.value;
        });
      },
      { concurrency: 1 },
    );
  }

  protected localizableText(v: LocalizableUserText, intl: IntlShape) {
    return v[intl.locale as UserLocale] || v.en || v.es || "";
  }
}

export interface CellData {
  value: string;
  row: number;
  col: number;
}

export class CellError extends Error {
  constructor(
    public cell: CellData,
    message: string,
  ) {
    super(message);
  }
}

export class UnknownIdError extends Error {
  constructor(public id: string) {
    super(`Unknown ID: ${id}`);
  }
}

export class InvalidDataError extends Error {
  public code = "INVALID_DATA_ERROR";
  constructor(message: string) {
    super(message);
  }
}
