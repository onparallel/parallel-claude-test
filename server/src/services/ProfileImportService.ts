import Excel from "exceljs";
import { inject, injectable } from "inversify";
import { isNonNullish, zip } from "remeda";
import { Readable } from "stream";
import { assert } from "ts-essentials";
import { ProfileTypeFieldType, User, UserLocale } from "../db/__types";
import { ProfileRepository } from "../db/repositories/ProfileRepository";
import { LocalizableUserText } from "../graphql";
import { buildProfileUpdatedEventsData } from "../graphql/helpers/buildProfileUpdatedEventsData";
import { toGlobalId } from "../util/globalId";
import { isAtLeast } from "../util/profileTypeFieldPermission";
import { isValidDate } from "../util/time";
import { random } from "../util/token";
import { Maybe, UnwrapArray } from "../util/types";
import { validateProfileFieldValue } from "../util/validateProfileFieldValue";
import { I18N_SERVICE, II18nService } from "./I18nService";
import { IStorageService, STORAGE_SERVICE } from "./StorageService";

export const PROFILE_IMPORT_SERVICE = Symbol.for("PROFILE_IMPORT_SERVICE");

export interface CellData {
  value: string;
  row: number;
  col: number;
}

interface ParsedProfileFieldValue {
  profileTypeFieldId: number;
  type: ProfileTypeFieldType;
  content: any;
  expiryDate: Maybe<string>;
  alias: Maybe<string>;
}
export interface IProfileImportService {
  generateProfileImportExcelModelDownloadUrl(
    profileTypeId: number,
    locale: UserLocale,
    user: User,
  ): Promise<string>;
  importDataIntoProfiles(
    profileTypeId: number,
    values: ParsedProfileFieldValue[][],
    user: User,
    onProgress?: (count: number, total: number) => Promise<void>,
  ): Promise<void>;
  parseAndValidateExcelData(
    profileTypeId: number,
    excelData: string[][],
    userId: number,
  ): Promise<ParsedProfileFieldValue[][]>;
}

@injectable()
export class ProfileImportService implements IProfileImportService {
  constructor(
    @inject(STORAGE_SERVICE) private storage: IStorageService,
    @inject(I18N_SERVICE) private i18n: II18nService,
    @inject(ProfileRepository) private profiles: ProfileRepository,
  ) {}

  private AVAILABLE_TYPES: ProfileTypeFieldType[] = [
    "SHORT_TEXT",
    "TEXT",
    "PHONE",
    "NUMBER",
    "SELECT",
    "CHECKBOX",
    "DATE",
  ];

  async generateProfileImportExcelModelDownloadUrl(
    profileTypeId: number,
    locale: UserLocale,
    user: User,
  ) {
    const intl = await this.i18n.getIntl(locale);
    const workbook = new Excel.Workbook();

    const dataTab = workbook.addWorksheet(
      intl.formatMessage({ id: "profile-import.data-tab-name", defaultMessage: "Data" }),
    );

    const fields = await this.loadImportableFields(profileTypeId, user.id);

    dataTab.columns = fields.flatMap(({ field }) => {
      const fieldName = this.localizableText(field.name, locale);
      const fieldId = toGlobalId("ProfileTypeField", field.id);
      return [
        { key: fieldId, header: fieldName },
        field.is_expirable && !field.options.useReplyAsExpiryDate
          ? {
              key: `${fieldId}-expiry`,
              header: intl.formatMessage(
                {
                  id: "profile-import.field-with-expiry.header",
                  defaultMessage: "{name} expiry date",
                },
                { name: fieldName },
              ),
            }
          : null,
      ].filter(isNonNullish);
    });

    // add IDs row
    dataTab.addRow(
      Object.fromEntries([
        ...fields.map(({ field }) => {
          const fieldId = toGlobalId("ProfileTypeField", field.id);
          return [fieldId, fieldId];
        }),
        ...fields
          .filter(({ field }) => field.is_expirable && !field.options.useReplyAsExpiryDate)
          .map(({ field }) => {
            const fieldId = `${toGlobalId("ProfileTypeField", field.id)}-expiry`;
            return [fieldId, fieldId];
          }),
      ]),
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
        const colLength = cell.value!.toString().length;
        if (colLength > maxLength) {
          maxLength = colLength;
        }
      });
      column.width = maxLength;
    }

    const instructionsTab = workbook.addWorksheet(
      intl.formatMessage({
        id: "profile-import.instructions-tab-name",
        defaultMessage: "Instructions",
      }),
    );
    instructionsTab.addRows([
      [
        intl.formatMessage({
          id: "profile-import.instructions.header",
          defaultMessage: "Instructions",
        }),
      ],
      [
        intl.formatMessage({
          id: "profile-import.instructions.line-1",
          defaultMessage: "- Do not modify the content of the top two rows.",
        }),
      ],
      [
        intl.formatMessage({
          id: "profile-import.instructions.line-2",
          defaultMessage:
            "- Dates should be added as text (with leading ') and format yyyy-MM-dd. e.g. '2022-01-01",
        }),
      ],
      [
        intl.formatMessage({
          id: "profile-import.instructions.line-3",
          defaultMessage:
            "- Phones should be added with country code prefix and no spaces. e.g. +1234567890",
        }),
      ],
      [
        intl.formatMessage({
          id: "profile-import.instructions.line-4",
          defaultMessage:
            "- Countries should be added as ISO 3166-1 alpha-2 codes. e.g. US, ES, FR",
        }),
      ],
    ]);

    const profileType = await this.profiles.loadProfileType(profileTypeId);
    assert(profileType, "Profile type not found");
    const profileTypeName = (
      this.localizableText(profileType.name_plural, locale) ||
      this.localizableText(profileType.name, locale)
    )
      .replace(/\s/g, "-")
      .toLowerCase();

    return await this.generateDownloadLink(
      `${profileTypeName}-${intl.formatMessage({
        id: "profile-import.model-file-name",
        defaultMessage: "model",
      })}.xlsx`,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      workbook,
    );
  }

  async importDataIntoProfiles(
    profileTypeId: number,
    values: ParsedProfileFieldValue[][],
    user: User,
    onProgress?: (count: number, total: number) => Promise<void>,
  ) {
    let count = 0;
    for (const profileValues of values) {
      const profile = await this.profiles.createProfile(
        {
          localizable_name: { en: "" },
          org_id: user.org_id,
          profile_type_id: profileTypeId,
        },
        user.id,
      );

      const { currentValues } = await this.profiles.updateProfileFieldValue(
        profile.id,
        profileValues,
        user.id,
      );
      await this.profiles.createProfileUpdatedEvents(
        profile.id,
        buildProfileUpdatedEventsData(profile.id, profileValues, currentValues, [], user),
        user,
      );

      await onProgress?.(++count, values.length);
    }
  }

  async parseAndValidateExcelData(
    profileTypeId: number,
    excelData: string[][],
    userId: number,
  ): Promise<ParsedProfileFieldValue[][]> {
    // 1st row: property names
    // 2nd row: property IDs
    // 3rd+ row: profiles data
    if (excelData.length < 2) {
      throw new InvalidDataError("Data must have at least 2 rows");
    }

    const fields = await this.loadImportableFields(profileTypeId, userId);

    const ids = excelData[1];
    const requiredFieldIds = fields
      .filter(({ isRequired }) => isRequired)
      .map(({ field }) => toGlobalId("ProfileTypeField", field.id));

    if (!requiredFieldIds.every((id) => ids.includes(id))) {
      throw new InvalidDataError("Missing required columns");
    }

    const parsed = await this.parseExcelData(excelData);

    const validIds = fields
      .flatMap(({ field }) => {
        const fieldId = toGlobalId("ProfileTypeField", field.id);
        return [
          fieldId,
          field.is_expirable && !field.options.useReplyAsExpiryDate ? `${fieldId}-expiry` : null,
        ];
      })
      .filter(isNonNullish);

    const createData: ParsedProfileFieldValue[][] = [];
    for (const contentById of parsed) {
      const profileValues: ParsedProfileFieldValue[] = [];
      for (const [id, cell] of Object.entries(contentById)) {
        if (!validIds.includes(id)) {
          throw new UnknownIdError(id);
        }

        // if its an "expiry" column, skip it
        if (id.endsWith("-expiry")) {
          continue;
        }

        const found = fields.find(({ field }) => toGlobalId("ProfileTypeField", field.id) === id);
        assert(found, `Field not found for ID: ${id}`);

        const { isRequired, field } = found;
        if (isRequired && !cell.value) {
          throw new CellError(cell, "Required field is empty");
        }
        // if its an optional field and its empty, skip it
        if (!cell.value) {
          continue;
        }

        const content = {
          value:
            field.type === "NUMBER"
              ? parseFloat(cell.value)
              : field.type === "CHECKBOX"
                ? cell.value.split(/(?<!\\),/).map((x) => x.trim())
                : cell.value,
        };
        try {
          await validateProfileFieldValue(field, content);
        } catch (error) {
          throw new CellError(cell, error instanceof Error ? error.message : "UNKNOWN");
        }

        const expiryCell =
          field.is_expirable && field.type === "DATE" && field.options.useReplyAsExpiryDate
            ? cell
            : field.is_expirable
              ? contentById[`${toGlobalId("ProfileTypeField", field.id)}-expiry`]
              : null;
        if (expiryCell && expiryCell.value !== "" && !isValidDate(expiryCell.value)) {
          throw new CellError(expiryCell, "Invalid date format");
        }

        profileValues.push({
          content,
          profileTypeFieldId: field.id,
          type: field.type,
          expiryDate: expiryCell?.value || null,
          alias: field.alias,
        });
      }

      createData.push(profileValues);
    }
    return createData;
  }

  private async parseExcelData(data: string[][]) {
    const ids = data[1];

    const dataRows = data.slice(2);
    const cellData: Record<string, CellData>[] = [];

    let foundEmptyRow = false;
    for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
      const row = dataRows[rowIndex];
      if (row.every((r) => !r)) {
        foundEmptyRow = true;
      } else {
        if (foundEmptyRow) {
          throw new InvalidDataError("Empty row found");
        }
        const rowData: UnwrapArray<typeof cellData> = {};
        for (let colIndex = 0; colIndex < ids.length; colIndex++) {
          const id = ids[colIndex];
          if (!id) {
            continue;
          }
          rowData[id] = {
            col: colIndex + 1,
            row: rowIndex + 3,
            value: row[colIndex]?.trim() ?? null,
          };
        }
        cellData.push(rowData);
      }
    }
    return cellData;
  }

  private async loadImportableFields(profileTypeId: number, userId: number) {
    const profileType = await this.profiles.loadProfileType(profileTypeId);
    assert(profileType, "Profile type not found");
    const fields = await this.profiles.loadProfileTypeFieldsByProfileTypeId(profileTypeId);
    const permissions = await this.profiles.loadProfileTypeFieldUserEffectivePermission(
      fields.map((f) => ({ profileTypeFieldId: f.id, userId })),
    );

    const requiredFieldIds = (profileType.profile_name_pattern as (string | number)[]).filter(
      (v) => typeof v === "number",
    );

    return zip(fields, permissions)
      .filter(
        ([f, permission]) =>
          isAtLeast(permission, "WRITE") && this.AVAILABLE_TYPES.includes(f.type),
      )
      .map(([field]) => ({
        isRequired: requiredFieldIds.includes(field.id),
        field,
      }));
  }

  private async generateDownloadLink(
    filename: string,
    contentType: string,
    workbook: Excel.Workbook,
  ) {
    const stream = new Readable();
    stream.push(await workbook.xlsx.writeBuffer());
    stream.push(null); // end of stream

    const path = random(16);
    await this.storage.temporaryFiles.uploadFile(path, contentType, stream);
    return await this.storage.temporaryFiles.getSignedDownloadEndpoint(
      path,
      filename,
      "attachment",
    );
  }

  private localizableText(v: LocalizableUserText, locale: UserLocale) {
    return v[locale] || v.en || v.es || "";
  }
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
