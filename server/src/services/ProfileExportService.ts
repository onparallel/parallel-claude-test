import Excel from "exceljs";
import { inject, injectable } from "inversify";
import { indexBy, isNonNullish, zip } from "remeda";
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

export const PROFILE_EXPORT_SERVICE = Symbol.for("PROFILE_EXPORT_SERVICE");

@injectable()
export class ProfileExportService extends ProfileExcelService {
  constructor(
    @inject(ProfileRepository) private profiles: ProfileRepository,
    @inject(I18N_SERVICE) private i18n: II18nService,
    @inject(LOGGER) private logger: ILogger,
  ) {
    super();
  }

  async exportToExcel(
    profileTypeId: number,
    fieldIds: number[],
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

    // FILE and BACKGROUND_CHECK fields are not included as those cannot be exported into plain text
    const profileTypeFields = (
      await this.profiles.loadProfileTypeFieldsByProfileTypeId(profileTypeId)
    ).filter((ptf) => ptf && ptf.type !== "FILE" && ptf.type !== "BACKGROUND_CHECK");

    const profileTypeFieldsById = indexBy(profileTypeFields, (ptf) => ptf.id);

    // columns in excel will be fields defined in fieldIds other than FILE and BACKGROUND_CHECK
    // fields that have HIDDEN permission for the user are included in the excel but data is not exported.
    const excelColumns = fieldIds.filter((id) => isNonNullish(profileTypeFieldsById[id]));
    const workbook = await this.initializeExcelWorkbook(
      ["profile-id", ...excelColumns],
      profileTypeFieldsById,
      intl,
    );

    let offset = 0;
    let totalCount: number | null = null;
    do {
      this.logger.info(`Fetching profiles from ${offset} to ${offset + 100}`);
      const pagination = this.profiles.getPaginatedProfileForOrg(
        profileType.org_id,
        {
          limit: 100,
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

      // write profiles into worksheet in chunks of 100
      await this.writeProfilesData(
        items,
        excelColumns,
        profileTypeFieldsById,
        userId,
        workbook.worksheets[0],
      );

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
    profileTypeFieldIds: number[],
    profileTypeFieldsById: Record<number, ProfileTypeField>,
    userId: number,
    worksheet: Excel.Worksheet,
  ) {
    const permissions = await this.profiles.loadProfileTypeFieldUserEffectivePermission(
      profileTypeFieldIds.map((id) => ({ profileTypeFieldId: id, userId })),
    );

    const profilesValues = await this.profiles.loadProfileFieldValuesByProfileId(
      profiles.map((p) => p.id),
    );

    for (const [profile, profileValues] of zip(profiles, profilesValues)) {
      const row: Record<string, string> = { "profile-id": toGlobalId("Profile", profile.id) };

      for (const [fieldId, permission] of zip(profileTypeFieldIds, permissions)) {
        const field = profileTypeFieldsById[fieldId];
        const globalId = toGlobalId("ProfileTypeField", fieldId);

        assert(field, `Invalid profile type field id ${fieldId}`);
        const fieldValue = profileValues.find((v) => v.profile_type_field_id === fieldId);

        if (isAtLeast(permission, "READ")) {
          row[globalId] = this.stringifyProfileFieldValue(field, fieldValue);
        }

        if (field.is_expirable && !field.options.useReplyAsExpiryDate) {
          row[`${globalId}-expiry`] = fieldValue?.expiry_date ?? "";
        }
      }

      worksheet.addRow(row);
    }
  }

  private stringifyProfileFieldValue(field: ProfileTypeField, value?: ProfileFieldValue) {
    switch (field.type) {
      case "SHORT_TEXT":
      case "TEXT":
      case "PHONE":
      case "NUMBER":
      case "SELECT":
      case "DATE":
        return value?.content?.value;
      case "CHECKBOX":
        return value?.content?.value.join(",");
      default:
        throw new Error(`Cannot stringify ${field.type} field`);
    }
  }
}
