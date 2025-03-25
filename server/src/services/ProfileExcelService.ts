import { Workbook } from "exceljs";
import { injectable } from "inversify";
import { IntlShape } from "react-intl";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import { ProfileTypeField, UserLocale } from "../db/__types";
import { LocalizableUserText } from "../graphql";
import { toGlobalId } from "../util/globalId";

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

    // adjust column width to max value length
    for (const column of dataTab.columns) {
      let maxLength = 10;
      column.eachCell?.((cell) => {
        const colLength = cell.value?.toString().length;
        if (colLength && colLength > maxLength) {
          maxLength = colLength;
        }
      });
      column.width = maxLength;
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
    const instructionsTab = workbook.addWorksheet(
      intl.formatMessage({
        id: "profiles-excel.instructions-tab-name",
        defaultMessage: "Instructions",
      }),
    );
    instructionsTab.addRows(
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
