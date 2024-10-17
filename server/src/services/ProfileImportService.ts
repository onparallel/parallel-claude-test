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
import { Maybe } from "../util/types";
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
    data: Record<string, CellData>[],
    user: User,
  ): Promise<number>;
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

    dataTab.columns = fields.flatMap((field) => {
      const fieldName = this.localizableText(field.name, locale);
      const fieldId = toGlobalId("ProfileTypeField", field.id);
      return [
        { key: fieldId, header: fieldName },
        field.is_expirable
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
        ...fields.map((field) => {
          const fieldId = toGlobalId("ProfileTypeField", field.id);
          return [fieldId, fieldId];
        }),
        ...fields
          .filter((f) => f.is_expirable)
          .map((field) => {
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
          defaultMessage:
            "- You can reorder columns or remove columns that you don't need, as long as you don't modify the content of the top two rows.",
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
    data: Record<string, CellData>[],
    user: User,
  ) {
    const profileType = await this.profiles.loadProfileType(profileTypeId);
    assert(profileType, "Profile type not found");

    const parsedProfileValues = await this.validateAndParseData(profileTypeId, data, user.id);

    for (const profileValues of parsedProfileValues) {
      const profile = await this.profiles.createProfile(
        {
          localizable_name: { en: "" },
          org_id: profileType.org_id,
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
    }

    return parsedProfileValues.length;
  }

  private async validateAndParseData(
    profileTypeId: number,
    data: Record<string, CellData>[],
    userId: number,
  ): Promise<ParsedProfileFieldValue[][]> {
    const fields = await this.loadImportableFields(profileTypeId, userId);
    const validIds = fields
      .flatMap((f) => {
        const fieldId = toGlobalId("ProfileTypeField", f.id);
        return [fieldId, f.is_expirable ? `${fieldId}-expiry` : null];
      })
      .filter(isNonNullish);

    const createData: ParsedProfileFieldValue[][] = [];
    for (const contentById of data) {
      const profileValues: ParsedProfileFieldValue[] = [];
      for (const [id, cell] of Object.entries(contentById)) {
        if (!validIds.includes(id)) {
          throw new UnknownIdError(id);
        }

        const field = fields.find((f) => {
          const fieldId = toGlobalId("ProfileTypeField", f.id);
          return [fieldId, f.is_expirable ? `${fieldId}-expiry` : null]
            .filter(isNonNullish)
            .includes(id);
        });
        assert(field, `Field not found for ID: ${id}`);

        const expiryId = `${toGlobalId("ProfileTypeField", field.id)}-expiry`;

        // ignore empty cells and "expiry" values
        if (cell.value === "" || (field.is_expirable && id === expiryId)) {
          continue;
        }

        const content = { value: field.type === "NUMBER" ? parseFloat(cell.value) : cell.value };
        try {
          await validateProfileFieldValue(field, content);
        } catch (error) {
          throw new CellError(cell, error instanceof Error ? error.message : "UNKNOWN");
        }

        const expiryCell =
          field.is_expirable && field.type === "DATE" && field.options.useReplyAsExpiryDate
            ? cell
            : field.is_expirable
              ? contentById[expiryId]
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

  private async loadImportableFields(profileTypeId: number, userId: number) {
    const fields = await this.profiles.loadProfileTypeFieldsByProfileTypeId(profileTypeId);
    const permissions = await this.profiles.loadProfileTypeFieldUserEffectivePermission(
      fields.map((f) => ({ profileTypeFieldId: f.id, userId })),
    );
    return zip(fields, permissions)
      .filter(
        ([f, permission]) =>
          isAtLeast(permission, "WRITE") && this.AVAILABLE_TYPES.includes(f.type),
      )
      .map(([f]) => f);
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
