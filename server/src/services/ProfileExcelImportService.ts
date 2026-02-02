import { inject, injectable } from "inversify";
import pMap from "p-map";
import { groupBy, indexBy, isNonNullish, partition, unique, zip } from "remeda";
import { Readable } from "stream";
import { assert } from "ts-essentials";
import { ProfileTypeFieldType, User, UserLocale } from "../db/__types";
import { ProfileRepository } from "../db/repositories/ProfileRepository";
import { UserRepository } from "../db/repositories/UserRepository";
import { fromGlobalId, isGlobalId, toGlobalId } from "../util/globalId";
import { isAtLeast } from "../util/profileTypeFieldPermission";
import { pMapChunk } from "../util/promises/pMapChunk";
import { sanitizeFilenameWithSuffix } from "../util/sanitizeFilenameWithSuffix";
import { isValidDate } from "../util/time";
import { Maybe, UnwrapArray } from "../util/types";
import { I18N_SERVICE, II18nService } from "./I18nService";
import { EXPORTABLE_FIELD_TYPES } from "./ProfileExcelExportService";
import {
  CellData,
  CellError,
  InvalidDataError,
  ProfileExcelService,
  UnknownIdError,
} from "./ProfileExcelService";
import { PROFILE_TYPE_FIELD_SERVICE, ProfileTypeFieldService } from "./ProfileTypeFieldService";
import { PROFILE_VALIDATION_SERVICE, ProfileValidationService } from "./ProfileValidationService";
import { PROFILES_HELPER_SERVICE, ProfilesHelperService } from "./ProfilesHelperService";

export const PROFILE_EXCEL_IMPORT_SERVICE = Symbol.for("PROFILE_EXCEL_IMPORT_SERVICE");

interface ParsedProfileFieldValue {
  profileTypeFieldId: number;
  type: ProfileTypeFieldType;
  content: any;
  expiryDate: Maybe<string>;
  alias: Maybe<string>;
}

@injectable()
export class ProfileExcelImportService extends ProfileExcelService {
  constructor(
    @inject(I18N_SERVICE) private i18n: II18nService,
    @inject(PROFILES_HELPER_SERVICE) private profilesHelper: ProfilesHelperService,
    @inject(PROFILE_VALIDATION_SERVICE) private profileValidation: ProfileValidationService,
    @inject(PROFILE_TYPE_FIELD_SERVICE) profileTypeFields: ProfileTypeFieldService,
    @inject(UserRepository) private users: UserRepository,
    @inject(ProfileRepository) private profiles: ProfileRepository,
  ) {
    super(profileTypeFields);
  }

  async generateProfileImportExcelModel(profileTypeId: number, locale: UserLocale, user: User) {
    const intl = await this.i18n.getIntl(locale);

    // on the excel model, make sure to only include fields that the user has write permission for
    const fields = (await this.loadImportableFields(profileTypeId, user.id)).filter((f) =>
      isAtLeast(f.permission, "WRITE"),
    );

    const fieldsById = indexBy(
      fields.map(({ field }) => field),
      (f) => f.id,
    );

    const workbook = await this.initializeExcelWorkbook(
      unique(fields.map((f) => f.field.id)),
      fieldsById,
      intl,
    );

    const profileType = await this.profiles.loadProfileType(profileTypeId);
    assert(profileType, "Profile type not found");
    const profileTypeName = (
      this.localizableText(profileType.name_plural, intl) ||
      this.localizableText(profileType.name, intl)
    )
      .replace(/\s/g, "-")
      .toLowerCase();

    const stream = new Readable();
    stream.push(await workbook.xlsx.writeBuffer());
    stream.push(null); // end of stream

    return {
      stream,
      filename: sanitizeFilenameWithSuffix(
        `${profileTypeName}-${intl.formatMessage({
          id: "profiles-excel.model-file-name",
          defaultMessage: "model",
        })}`,
        ".xlsx",
      ),
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  }

  async importDataIntoProfiles(
    profileTypeId: number,
    data: { profileId: number | null; values: ParsedProfileFieldValue[] }[],
    user: User,
    onProgress?: (count: number, total: number) => Promise<void>,
  ) {
    let count = 0;
    await pMapChunk(
      data,
      async (chunk) => {
        const [updates, creates] = partition(chunk, (item) => isNonNullish(item.profileId));
        const profiles = await this.profiles.createProfiles(
          creates.map(() => ({
            localizable_name: { en: "" },
            org_id: user.org_id,
            profile_type_id: profileTypeId,
          })),
          {
            source: "EXCEL_IMPORT",
            userId: user.id,
          },
        );

        const events = await this.profiles.updateProfileFieldValues(
          [
            ...zip(creates, profiles).flatMap(([create, profile]) =>
              create.values.map((values) => ({
                profileId: profile.id,
                ...values,
              })),
            ),
            ...updates.flatMap((update) =>
              update.values.map((values) => ({
                profileId: update.profileId!,
                ...values,
              })),
            ),
          ],
          user.org_id,
          {
            userId: user.id,
            source: "EXCEL_IMPORT",
          },
        );

        await this.profiles.createEvent(
          profiles.map((p) => ({
            type: "PROFILE_CREATED",
            org_id: user.org_id,
            profile_id: p.id,
            data: {
              user_id: user.id,
              org_integration_id: null,
            },
          })),
          "EXCEL_IMPORT",
        );

        await this.profiles.createProfileUpdatedEvents(events, user.org_id, {
          userId: user.id,
          source: "EXCEL_IMPORT",
        });

        await onProgress?.((count = count + chunk.length), data.length);
      },
      { chunkSize: 30, concurrency: 1 },
    );
  }

  private cellToValueContent(cell: CellData, type: ProfileTypeFieldType) {
    if (!cell.value || cell.value.trim() === "") {
      return null;
    }

    switch (type) {
      case "NUMBER":
        return {
          value: parseFloat(cell.value),
        };
      case "CHECKBOX":
        // split the checkbox value by commas (ignoring escaped commas) and trim whitespace from each item
        return {
          value: cell.value.split(/(?<!\\),/).map((x) => x.trim()),
        };
      default:
        return {
          value: cell.value.trim(),
        };
    }
  }

  async parseExcelData(
    profileTypeId: number,
    excelData: string[][],
    userId: number,
  ): Promise<{ profileId: number | null; values: ParsedProfileFieldValue[] }[]> {
    // 1st row: property names
    // 2nd row: property IDs
    // 3rd+ row: profiles data
    if (excelData.length < 2) {
      throw new InvalidDataError("Data must have at least 2 rows");
    }

    const user = await this.users.loadUser(userId);
    assert(user, "User not found");
    const fields = await this.loadImportableFields(profileTypeId, userId);

    const requiredFieldIds = fields
      .filter(({ isRequired }) => isRequired)
      .map(({ field }) => field.id);

    const cellRows = this.mapIntoCellRows(excelData);

    const validIds = [
      "profile-id",
      ...fields
        .flatMap(({ field }) => {
          const fieldId = toGlobalId("ProfileTypeField", field.id);
          return [
            fieldId,
            field.is_expirable && !field.options.useReplyAsExpiryDate ? `${fieldId}-expiry` : null,
          ];
        })
        .filter(isNonNullish),
    ];

    /*
      each of the rows in excel may have a "profile-id" value, which means that the profile already exists
      and we need to update it.
      Otherwise, we create a new profile.
    */
    const createOrUpdateData: {
      profileId: number | null;
      profileIdCell: CellData | undefined;
      values: ParsedProfileFieldValue[];
    }[] = [];

    // keep track of fields that should have unique content so we can check it all at once for every unique field
    const possibleConflictingCells: {
      profileId: number | null;
      cell: CellData;
      profileTypeFieldId: number;
    }[] = [];

    // use concurrency so dataloaders in validateProfileFieldValueContent and mapValueContentToDatabase can accumulate requests
    // and run a single query to database
    await pMap(
      cellRows,
      async (contentById) => {
        // validate profileId value, if it exists
        const profileId = this.validateProfileIdCell(contentById["profile-id"]);
        const profileValues: ParsedProfileFieldValue[] = [];
        for (const [id, cell] of Object.entries(contentById)) {
          if (!validIds.includes(id)) {
            throw new UnknownIdError(id);
          }

          // if its an "expiry" or "profile-id" column, skip it
          if (id.endsWith("-expiry") || id === "profile-id") {
            continue;
          }

          const found = fields.find(({ field }) => toGlobalId("ProfileTypeField", field.id) === id);
          assert(found, `Field not found for ID: ${id}`);

          const { isRequired, field, permission } = found;

          if (isRequired && !cell.value && !profileId) {
            // if we are creating a new profile, every required field must have a value
            throw new CellError(cell, "Required field is empty");
          }
          // if its an optional field and its empty, skip it
          if (!isRequired && !cell.value) {
            continue;
          }

          // at this point we are sure the cell has a value, we need to check if the user has write permission for this field
          if (!isAtLeast(permission, "WRITE")) {
            throw new CellError(cell, "You do not have write permission for this field");
          }

          const content = this.cellToValueContent(cell, field.type);

          if (isNonNullish(content)) {
            try {
              await this.profileValidation.validateProfileFieldValueContent(
                field,
                content,
                user.org_id,
              );

              if (field.is_unique && content.value && typeof content.value === "string") {
                possibleConflictingCells.push({
                  profileTypeFieldId: field.id,
                  cell,
                  profileId,
                });
              }
            } catch (error) {
              throw new CellError(cell, error instanceof Error ? error.message : "UNKNOWN");
            }
          }

          const expiryCell =
            field.is_expirable && field.type === "DATE" && field.options.useReplyAsExpiryDate
              ? cell
              : field.is_expirable
                ? contentById[`${toGlobalId("ProfileTypeField", field.id)}-expiry`]
                : null;
          if (
            expiryCell &&
            expiryCell.value &&
            expiryCell.value !== "" &&
            !isValidDate(expiryCell.value)
          ) {
            throw new CellError(expiryCell, "Invalid date format");
          }

          profileValues.push({
            content: content
              ? await this.profileTypeFields.mapValueContentToDatabase(
                  field.type,
                  content,
                  user.org_id,
                )
              : content,
            profileTypeFieldId: field.id,
            type: field.type,
            expiryDate: expiryCell?.value || null,
            alias: field.alias,
          });
        }

        // if we are creating a new profile, every required field must have a value
        if (
          !profileId &&
          !requiredFieldIds.every((id) => profileValues.find((v) => v.profileTypeFieldId === id))
        ) {
          throw new InvalidDataError("Missing required columns");
        }

        createOrUpdateData.push({
          profileId,
          profileIdCell: contentById["profile-id"],
          values: profileValues,
        });
      },
      { concurrency: 100 },
    );

    // validate that all provided profiles exist and have correct profile_type_id
    const profileIds = createOrUpdateData.map(({ profileId }) => profileId).filter(isNonNullish);
    const profiles = await this.profiles.loadProfile(profileIds);

    const invalidProfileCell = createOrUpdateData.find(({ profileId }) => {
      if (!profileId) {
        return false;
      }
      const found = profiles.find((p) => p?.id === profileId);
      return !found || found.profile_type_id !== profileTypeId;
    })?.profileIdCell;

    if (invalidProfileCell) {
      throw new CellError(invalidProfileCell, "Invalid profile ID");
    }

    // before checking for duplicates in DDBB, check if we are trying to insert duplicated values on excel file
    for (const uniqueCells of Object.values(
      groupBy(possibleConflictingCells, (c) => c.profileTypeFieldId),
    )) {
      const duplicatedCell = this.findSecondDuplicatedCell(uniqueCells.map((c) => c.cell));
      if (duplicatedCell) {
        throw new CellError(duplicatedCell, "Duplicate value found in file.");
      }
    }

    // check for duplicates on existing profiles
    const possibleConflictingFields = possibleConflictingCells.map((c) => ({
      profileId: c.profileId,
      profileTypeFieldId: c.profileTypeFieldId,
      content: { value: c.cell.value },
    }));

    const conflicts = await this.profilesHelper.getProfileFieldValueUniqueConflicts(
      possibleConflictingFields,
      indexBy(
        fields.map(({ field }) => field),
        (f) => f.id,
      ),
      profileTypeId,
      user.org_id,
    );

    // if value already exists on a profile, it must be the same profile we are trying to update
    // otherwise, it's a duplicate value and we need to throw an error
    const firstConflictCell = possibleConflictingCells.find((c) =>
      conflicts.find(
        (conflict) =>
          conflict.content.value === c.cell.value &&
          conflict.profileId !== c.profileId &&
          conflict.profileTypeFieldId === c.profileTypeFieldId,
      ),
    )?.cell;
    if (firstConflictCell) {
      throw new CellError(firstConflictCell, "Duplicate value found in other profiles.");
    }

    return createOrUpdateData;
  }

  private validateProfileIdCell(cell: CellData | undefined) {
    if (!cell?.value) {
      return null;
    }

    if (!isGlobalId(cell.value, "Profile")) {
      throw new CellError(cell, "Invalid profile ID");
    }

    return fromGlobalId(cell.value, "Profile").id;
  }

  private mapIntoCellRows(data: string[][]) {
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
      .filter(([field]) => EXPORTABLE_FIELD_TYPES.includes(field.type))
      .map(([field, permission]) => ({
        isRequired: requiredFieldIds.includes(field.id),
        permission,
        field,
      }));
  }

  private findSecondDuplicatedCell(uniqueCells: CellData[]): CellData | null {
    const valueCounts = new Map<string, number>();

    // Count occurrences of each value and map values to their cells
    for (const cell of uniqueCells) {
      if (!cell.value) continue;

      const count = valueCounts.get(cell.value) || 0;
      if (count === 1) {
        // return cell if it has already been found once
        return cell;
      }

      valueCounts.set(cell.value, count + 1);
    }

    return null;
  }
}
