import Excel from "exceljs";
import { inject, injectable } from "inversify";
import { indexBy, unique, zip } from "remeda";
import { Readable } from "stream";
import { assert } from "ts-essentials";
import { Profile, ProfileFieldValue, ProfileTypeField, UserLocale } from "../db/__types";
import { ProfileFilter, ProfileRepository } from "../db/repositories/ProfileRepository";
import { toGlobalId } from "../util/globalId";
import { isAtLeast } from "../util/profileTypeFieldPermission";
import { sanitizeFilenameWithSuffix } from "../util/sanitizeFilenameWithSuffix";
import { I18N_SERVICE, II18nService } from "./I18nService";
import { ILogger, LOGGER } from "./Logger";
import { ProfileExcelService } from "./ProfileExcelService";
import { PROFILE_TYPE_FIELD_SERVICE, ProfileTypeFieldService } from "./ProfileTypeFieldService";

export const PROFILE_EXCEL_EXPORT_SERVICE = Symbol.for("PROFILE_EXCEL_EXPORT_SERVICE");

/**
 * this are the fieldTypes that can be exported into plain text
 */
export const EXPORTABLE_FIELD_TYPES = [
  "TEXT",
  "SHORT_TEXT",
  "DATE",
  "PHONE",
  "NUMBER",
  "SELECT",
  "CHECKBOX",
] as const;

@injectable()
export class ProfileExcelExportService extends ProfileExcelService {
  constructor(
    @inject(ProfileRepository) private profiles: ProfileRepository,
    @inject(I18N_SERVICE) private i18n: II18nService,
    @inject(LOGGER) private logger: ILogger,
    @inject(PROFILE_TYPE_FIELD_SERVICE) profileTypeFields: ProfileTypeFieldService,
  ) {
    super(profileTypeFields);
  }

  async export(
    profileTypeId: number,
    search: string | null,
    filter: Pick<ProfileFilter, "values" | "status"> | null,
    sortBy: { field: "name" | "createdAt"; direction: "ASC" | "DESC" }[] | null,
    locale: UserLocale,
    userId: number,
    onProgress?: (count: number, total: number) => Promise<void>,
  ): Promise<{ stream: Readable; filename: string; contentType: string }> {
    const intl = await this.i18n.getIntl(locale);

    const profileType = await this.profiles.loadProfileType(profileTypeId);
    assert(profileType, `Profile type with id ${profileTypeId} not found`);

    const profileTypeFields = (
      await this.profiles.loadProfileTypeFieldsByProfileTypeId(profileTypeId)
    ).filter((ptf) => ptf && EXPORTABLE_FIELD_TYPES.includes(ptf.type));

    const profileTypeFieldsById = indexBy(profileTypeFields, (ptf) => ptf.id);

    // columns in excel will be all fields other than FILE and BACKGROUND_CHECK
    // fields that have HIDDEN permission will not be included in excel
    const fieldsWithPermissions = zip(
      profileTypeFields,
      await this.profiles.loadProfileTypeFieldUserEffectivePermission(
        profileTypeFields.map(({ id }) => ({ profileTypeFieldId: id, userId })),
      ),
    )
      .filter(([_, permission]) => isAtLeast(permission, "READ"))
      .map(([field]) => field);

    const workbook = await this.initializeExcelWorkbook(
      unique(["profile-id", ...fieldsWithPermissions.map((f) => f.id)]),
      profileTypeFieldsById,
      intl,
    );

    let offset = 0;
    const limit = 5000;
    let totalCount: number | null = null;
    do {
      this.logger.info(`Fetching profiles from ${offset} to ${offset + limit}`);
      const pagination = this.profiles.getPaginatedProfileForOrg(
        profileType.org_id,
        {
          limit,
          offset,
          search,
          filter: {
            profileTypeId: [profileTypeId],
            status: filter?.status,
            values: filter?.values,
          },
          sortBy: sortBy?.map((s) => ({
            field: s.field,
            order: s.direction.toLowerCase() as "asc" | "desc",
          })),
        },
        profileTypeFieldsById,
      );

      totalCount = totalCount ?? (await pagination.totalCount);

      const items = await pagination.items;

      // write profiles into worksheet in chunks
      await this.writeProfilesData(items, fieldsWithPermissions, workbook.worksheets[0], offset);

      offset += items.length;
      await onProgress?.(offset, totalCount);
    } while (offset < totalCount);

    const stream = new Readable();
    stream.push(await workbook.xlsx.writeBuffer());
    stream.push(null); // end of stream

    const profileTypeName = (
      this.localizableText(profileType.name_plural, intl) ||
      this.localizableText(profileType.name, intl)
    )
      .replace(/\s/g, "-")
      .toLowerCase();

    return {
      stream,
      filename: sanitizeFilenameWithSuffix(profileTypeName, ".xlsx"),
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  }

  private async writeProfilesData(
    profiles: Profile[],
    fieldsWithPermissions: ProfileTypeField[],
    worksheet: Excel.Worksheet,
    offset: number,
  ) {
    const profilesValues = await this.profiles.loadProfileFieldValuesByProfileId(
      profiles.map((p) => p.id),
    );

    let rowIndex = 0;
    for (const [profile, profileValues] of zip(profiles, profilesValues)) {
      const row: Record<string, string> = { "profile-id": toGlobalId("Profile", profile.id) };

      for (const field of fieldsWithPermissions) {
        const globalId = toGlobalId("ProfileTypeField", field.id);

        assert(field, `Invalid profile type field id ${field.id}`);
        const fieldValue = profileValues.find((v) => v.profile_type_field_id === field.id);

        row[globalId] = this.stringifyProfileFieldValue(field, fieldValue);
        if (field.is_expirable && !field.options.useReplyAsExpiryDate) {
          row[`${globalId}-expiry`] = fieldValue?.expiry_date ?? "";
        }
      }

      // data is inserted starting from row 3, as first two rows are headers
      worksheet.insertRow(3 + offset + rowIndex++, row);
    }
  }

  private stringifyProfileFieldValue(field: ProfileTypeField, value?: ProfileFieldValue) {
    assert(EXPORTABLE_FIELD_TYPES.includes(field.type), `Cannot stringify ${field.type} field`);

    if (field.type === "CHECKBOX") {
      return value?.content?.value.join(",");
    }

    return value?.content?.value;
  }
}
