import { Row, Workbook } from "exceljs";
import { inject, injectable } from "inversify";
import pMap from "p-map";
import {
  flatMap,
  groupBy,
  isDeepEqual,
  isNonNullish,
  mapValues,
  partition,
  pick,
  pipe,
  unique,
  uniqueBy,
  values,
  zip,
} from "remeda";
import { Readable } from "stream";
import { assert } from "ts-essentials";
import { ProfileCreatedEvent } from "../db/events/ProfileEvent";
import { FileRepository } from "../db/repositories/FileRepository";
import { ProfileRepository } from "../db/repositories/ProfileRepository";
import { UserRepository } from "../db/repositories/UserRepository";
import { isValidEmail } from "../graphql/helpers/validators/validEmail";
import { SapEntityRelationshipSyncStrategyReplicateRelationship } from "../integrations/profile-sync/sap/types";
import { toGlobalId } from "../util/globalId";
import { never } from "../util/never";
import { pMapChunk } from "../util/promises/pMapChunk";
import { random } from "../util/token";
import { ILogger, LOGGER_FACTORY, LoggerFactory } from "./Logger";
import { EXPORTABLE_FIELD_TYPES } from "./ProfileExcelExportService";
import { PROFILE_TYPE_FIELD_SERVICE, ProfileTypeFieldService } from "./ProfileTypeFieldService";
import { PROFILE_VALIDATION_SERVICE, ProfileValidationService } from "./ProfileValidationService";
import { IStorageService, STORAGE_SERVICE } from "./StorageService";

export const PROFILE_SYNC_SERVICE = Symbol.for("PROFILE_SYNC_SERVICE");

interface SyncProfileRelationshipGroup {
  syncStrategy: Pick<
    SapEntityRelationshipSyncStrategyReplicateRelationship,
    | "profileRelationshipTypeId"
    | "parentProfileRelationshipSide"
    | "missingRemoteRelationshipStrategy"
  >;
  syncData: Omit<SyncProfileData, "relationshipGroups">[];
}
interface SyncProfileData {
  profileTypeId: number;
  matchBy: [profileTypeFieldId: number, value: any][];
  data: [profileTypeFieldId: number, value: any][];
  relationshipGroups?: SyncProfileRelationshipGroup[];
}

interface OutputContextDatabase {
  alreadySyncedProfiles: { id: number; matchBy: SyncProfileData["matchBy"] }[];
}
interface OutputContextExcel {
  workbook: Workbook;
  deferredRelationships: {
    parentProfileIdCellReference: string;
    relationships: {
      profileTypeId: SyncProfileData["profileTypeId"];
      matchBy: SyncProfileData["matchBy"];
      profileRelationshipTypeId: SapEntityRelationshipSyncStrategyReplicateRelationship["profileRelationshipTypeId"];
      parentProfileRelationshipSide: SapEntityRelationshipSyncStrategyReplicateRelationship["parentProfileRelationshipSide"];
      missingRemoteRelationshipStrategy: SapEntityRelationshipSyncStrategyReplicateRelationship["missingRemoteRelationshipStrategy"];
    }[];
  }[];
}
export type OutputContext<T extends "EXCEL" | "DATABASE"> = T extends "EXCEL"
  ? OutputContextExcel
  : OutputContextDatabase;

@injectable()
export class ProfileSyncService {
  private logger: ILogger;

  constructor(
    @inject(ProfileRepository) private profiles: ProfileRepository,
    @inject(FileRepository) private files: FileRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(PROFILE_VALIDATION_SERVICE) private profileValidation: ProfileValidationService,
    @inject(PROFILE_TYPE_FIELD_SERVICE) private profileTypeFields: ProfileTypeFieldService,
    @inject(STORAGE_SERVICE) private storage: IStorageService,
    @inject(LOGGER_FACTORY) readonly loggerFactory: LoggerFactory,
  ) {
    this.logger = loggerFactory("ProfileSyncService");
  }

  async writeIntoDatabase(
    syncData: SyncProfileData[],
    orgId: number,
    integrationId: number,
    // keep track of profiles already built on previous iterations so those can be ignored instead of re-running the queries in database
    { alreadySyncedProfiles } = this.createOutputContext("DATABASE"),
  ) {
    await this.validateSyncData(syncData, alreadySyncedProfiles, orgId);

    // first make sure every profile is created
    // if a profile if found by matchBy, it will be updated, otherwise it will be created
    // if profile data is exactly the same, it will not be updated and no events will be created
    await this.buildProfiles(
      pipe(
        syncData,
        flatMap((d) => [
          pick(d, ["profileTypeId", "matchBy", "data"]),
          ...(d.relationshipGroups?.flatMap((rg) =>
            rg.syncData.map(pick(["profileTypeId", "matchBy", "data"])),
          ) ?? []),
        ]),
        groupBy((d) => d.matchBy.map(([ptfId, value]) => `${ptfId}:${value}`).join(",")),
        mapValues(([p, ...rest]) => ({
          ...pick(p, ["profileTypeId", "matchBy"]),
          data: uniqueBy([...p.data, ...rest.flatMap((d) => d.data)], ([ptfId]) => ptfId),
        })),
        values,
      ),
      alreadySyncedProfiles,
      orgId,
      integrationId,
    );

    // then add relationships between profiles
    // every profile in this relationship is already created, so we can just add relationships
    // if a relationship is not found, it will be created
    // if the relationship already exists, it will do nothing and no events will be created
    await pMap(
      syncData,
      async (d) => {
        const profileId = alreadySyncedProfiles.find(({ matchBy }) =>
          isDeepEqual(matchBy, d.matchBy),
        )?.id;
        assert(isNonNullish(profileId), "Profile must be found by matchBy");

        await this.profiles.syncProfileRelationships(
          profileId,
          (d.relationshipGroups ?? []).map(({ syncStrategy, syncData }) => {
            const profileIds = syncData.map((sd) => {
              const profileId = alreadySyncedProfiles.find(({ matchBy }) =>
                isDeepEqual(matchBy, sd.matchBy),
              )?.id;
              assert(isNonNullish(profileId), "Profile must be found by matchBy");
              return profileId;
            });

            return {
              profileRelationshipTypeId: syncStrategy.profileRelationshipTypeId,
              direction: syncStrategy.parentProfileRelationshipSide === "LEFT" ? "RIGHT" : "LEFT",
              ifMissing:
                syncStrategy.missingRemoteRelationshipStrategy === "DELETE_RELATIONSHIP"
                  ? "DELETE"
                  : "IGNORE",
              profileIds,
            };
          }),
          orgId,
          integrationId,
        );
      },
      { concurrency: 100 },
    );
  }

  async writeIntoExcelFile(
    syncData: SyncProfileData[],
    orgId: number,
    { workbook, deferredRelationships }: OutputContextExcel,
  ) {
    await this.validateSyncData(syncData, [], orgId);

    const profiles = await this.findProfiles(syncData, orgId);

    for (const [profile, data] of zip(profiles, syncData)) {
      const worksheet =
        workbook.getWorksheet(`ProfileType_${data.profileTypeId}`) ??
        (await this.initializeWorksheet(
          `ProfileType_${data.profileTypeId}`,
          data.profileTypeId,
          workbook,
        ));

      const row = worksheet.addRow({
        "profile-id": profile.id,
        ...Object.fromEntries(
          // no need to map value to database, this is why we don't take values from profile.data
          data.data.map(([profileTypeFieldId, value]) => [
            toGlobalId("ProfileTypeField", profileTypeFieldId),
            value,
          ]),
        ),
      });

      if ((data.relationshipGroups ?? []).length > 0) {
        deferredRelationships.push({
          parentProfileIdCellReference: `${worksheet.name}!A${row.number}`,
          relationships: data.relationshipGroups!.flatMap((rg) =>
            rg.syncData.flatMap((sd) => ({
              ...pick(sd, ["profileTypeId", "matchBy"]),
              ...pick(rg.syncStrategy, [
                "profileRelationshipTypeId",
                "parentProfileRelationshipSide",
                "missingRemoteRelationshipStrategy",
              ]),
            })),
          ),
        });
      }
    }
  }

  private async validateSyncData(
    syncData: SyncProfileData[],
    alreadySyncedProfiles: { id: number; matchBy: SyncProfileData["matchBy"] }[],
    orgId: number,
  ) {
    try {
      await pMap(
        syncData,
        async (d) => {
          // if the profile has already been built on a previous iteration, skip it
          if (alreadySyncedProfiles.some(({ matchBy }) => isDeepEqual(matchBy, d.matchBy))) {
            return null;
          }

          assert(d.matchBy.length > 0, "MatchBy is required");

          for (const [, value] of d.matchBy) {
            assert(isNonNullish(value), "MatchBy value is required");
            assert(typeof value === "string", "MatchBy value must be a string");
          }

          const profileType = await this.profiles.loadProfileType(d.profileTypeId);
          assert(isNonNullish(profileType), "ProfileType must be a valid profile type");
          assert(profileType.org_id === orgId, "ProfileType must belong to the organization");

          const fields = await this.profiles.loadProfileTypeField(
            unique([
              ...d.matchBy.map(([id]) => id),
              ...d.data.map(([id]) => id),
              ...(d.relationshipGroups?.flatMap((r) => [
                ...r.syncData.flatMap((d) => [
                  ...d.matchBy.map(([id]) => id),
                  ...d.data.map(([id]) => id),
                ]),
              ]) ?? []),
            ]),
          );

          assert(fields.every(isNonNullish), "All fields must be valid");
        },
        { concurrency: 100 },
      );
    } catch (error) {
      throw new Error("INVALID_SYNC_DATA", { cause: error });
    }
  }

  private async findProfiles(
    profilesInfo: Pick<SyncProfileData, "profileTypeId" | "matchBy" | "data">[],
    orgId: number,
  ) {
    const profileTypeFieldIds = unique(
      profilesInfo.flatMap((d) => [
        ...d.matchBy.map(([profileTypeFieldId]) => profileTypeFieldId),
        ...d.data.map(([profileTypeFieldId]) => profileTypeFieldId),
      ]),
    );

    const profileTypeFields =
      profileTypeFieldIds.length > 0
        ? await this.profiles.loadProfileTypeField(profileTypeFieldIds)
        : [];
    const values =
      profileTypeFieldIds.length > 0
        ? (
            await this.profiles.loadProfileFieldValuesByProfileTypeFieldId.raw(profileTypeFieldIds)
          ).flat()
        : [];

    const valuesByProfileId = groupBy(values, (v) => v.profile_id);

    const userAssignmentValues = values
      .filter((v) => v.type === "USER_ASSIGNMENT")
      .map((v) => v.content.value as number);
    const users =
      userAssignmentValues.length > 0
        ? await this.users.loadUserDataByUserId(unique(userAssignmentValues))
        : [];

    return await pMap(
      profilesInfo,
      async ({ profileTypeId, matchBy, data }) => {
        // find a profileId that matches the matchBy properties
        const match = Object.entries(valuesByProfileId).find(([_, values]) =>
          matchBy.every(([profileTypeFieldId, value]) =>
            values.some(
              (v) =>
                v.profile_type_field_id === profileTypeFieldId &&
                (v.type === "USER_ASSIGNMENT"
                  ? users.find((u) => u?.email === value)
                  : v.content.value === value),
            ),
          ),
        );

        return {
          id: match ? parseInt(match[0]) : null,
          profileTypeId,
          data: uniqueBy(
            (
              await pMap(
                [...data, ...matchBy],
                async ([profileTypeFieldId, value]) => {
                  const field = profileTypeFields.find((f) => f?.id === profileTypeFieldId);
                  assert(isNonNullish(field));

                  // include field type in data and map value to database
                  try {
                    await this.profileValidation.validateProfileFieldValueContent(
                      field,
                      { value },
                      orgId,
                    );

                    return {
                      profileTypeFieldId,
                      type: field.type,
                      content: await this.profileTypeFields.mapValueContentToDatabase(
                        field.type,
                        { value },
                        orgId,
                      ),
                    };
                  } catch (error) {
                    if (
                      field.type === "USER_ASSIGNMENT" &&
                      error instanceof Error &&
                      isValidEmail(value) &&
                      error.message.includes(`User with email ${value} not found in organization`)
                    ) {
                      // if the user is not found, skip the field
                      return null;
                    }

                    if (error instanceof Error) {
                      this.logger.warn(
                        `Error validating profile field value: ${error.message}. field: ${field.id}; alias: ${field.alias}; type: ${field.type}; value: ${JSON.stringify(value)}`,
                      );
                    } else {
                      this.logger.error(error);
                    }

                    // if the field is not valid, skip it
                    return null;
                  }
                },
                { concurrency: 100 },
              )
            ).filter(isNonNullish),
            (d) => d.profileTypeFieldId,
          ),
          matchBy,
        };
      },
      { concurrency: 100 },
    );
  }

  private async buildProfiles(
    profilesInfo: Pick<SyncProfileData, "profileTypeId" | "matchBy" | "data">[],
    alreadySyncedProfiles: { id: number; matchBy: SyncProfileData["matchBy"] }[],
    orgId: number,
    integrationId: number,
  ) {
    // get only the profiles that were not built on previous iterations
    const unsyncedProfiles = profilesInfo.filter(
      (info) => !alreadySyncedProfiles.some((built) => isDeepEqual(built.matchBy, info.matchBy)),
    );
    if (unsyncedProfiles.length === 0) {
      return;
    }

    const profiles = await this.findProfiles(unsyncedProfiles, orgId);

    const CHUNK_SIZE = 100;
    const events = await pMapChunk(
      profiles,
      async (profilesChunk, chunkIndex) => {
        this.logger.info(
          `Building ${chunkIndex * CHUNK_SIZE}-${Math.min((chunkIndex + 1) * CHUNK_SIZE, profiles.length)}/${profiles.length} profiles for profile sync...`,
        );
        const [found, missing] = partition(profilesChunk, (p) => isNonNullish(p.id));

        const missingProfiles = await this.profiles.createProfiles(
          missing.map(({ profileTypeId }) => ({
            org_id: orgId,
            profile_type_id: profileTypeId,
          })),
          {
            source: "PROFILE_SYNC",
            orgIntegrationId: integrationId,
          },
        );

        const profileFieldValueUpdatedEvents = await this.profiles.updateProfileFieldValues(
          [
            ...found.flatMap((p) =>
              p.data.map(({ profileTypeFieldId, type, content }) => ({
                profileId: p.id!,
                profileTypeFieldId,
                type,
                content,
              })),
            ),
            ...zip(missingProfiles, missing).flatMap(([p, m]) =>
              m.data.map(({ profileTypeFieldId, type, content }) => ({
                profileId: p.id,
                profileTypeFieldId,
                type,
                content,
              })),
            ),
          ],
          orgId,
          { source: "PROFILE_SYNC", orgIntegrationId: integrationId },
        );

        alreadySyncedProfiles.push(
          ...found.map((p) => ({ id: p.id!, matchBy: p.matchBy })),
          ...zip(missingProfiles, missing).map(([p, { matchBy }]) => ({ id: p.id, matchBy })),
        );

        const profileCreatedEvents: ProfileCreatedEvent<true>[] = missingProfiles.map((p) => ({
          type: "PROFILE_CREATED",
          org_id: orgId,
          profile_id: p.id,
          data: {
            user_id: null,
            org_integration_id: integrationId,
          },
        }));

        return [...profileCreatedEvents, ...profileFieldValueUpdatedEvents];
      },
      { concurrency: 1, chunkSize: CHUNK_SIZE },
    );

    const [profileCreatedEvents, profileFieldValueUpdatedEvents] = partition(
      events,
      (e) => e.type === "PROFILE_CREATED",
    );

    await this.profiles.createEvent(profileCreatedEvents, "PROFILE_SYNC");
    await this.profiles.createProfileUpdatedEvents(profileFieldValueUpdatedEvents, orgId, {
      source: "PROFILE_SYNC",
      orgIntegrationId: integrationId,
    });
  }

  createOutputContext<T extends "EXCEL" | "DATABASE">(output: T): OutputContext<T> {
    if (output === "EXCEL") {
      return {
        workbook: new Workbook(),
        deferredRelationships: [] as any,
      } as OutputContext<T>;
    } else if (output === "DATABASE") {
      return {
        alreadySyncedProfiles: [] as any,
      } as OutputContext<T>;
    }

    never("Invalid output type");
  }

  async closeOutputContext<T extends "EXCEL" | "DATABASE">(
    output: T,
    context: OutputContext<T>,
    closedBy: string,
  ) {
    if (output === "EXCEL") {
      const { workbook, deferredRelationships } = context as OutputContextExcel;

      if (deferredRelationships.length > 0) {
        this.buildExcelDeferredRelationshipsWorksheet(deferredRelationships, workbook);
      }

      const stream = new Readable();
      stream.push(await workbook.xlsx.writeBuffer());
      stream.push(null); // end of stream

      const path = random(16);
      const res = await this.storage.temporaryFiles.uploadFile(
        path,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        stream,
      );

      const temporaryFile = await this.files.createTemporaryFile(
        {
          content_type: "application/pdf",
          filename: `profile-sync-${Date.now()}.xlsx`,
          path,
          size: res["ContentLength"]!.toString(),
        },
        closedBy,
      );

      this.logger.info(`Uploaded excel file to temporary files bucket at path: ${path}`);

      return {
        output,
        temporary_file_id: temporaryFile.id,
      };
    } else if (output === "DATABASE") {
      const { alreadySyncedProfiles } = context as OutputContextDatabase;

      return {
        output,
        count: alreadySyncedProfiles.length,
      };
    } else {
      never("Invalid output type");
    }
  }

  async initializeWorksheet(name: string, profileTypeId: number, workbook: Workbook) {
    const worksheet = workbook.addWorksheet(name);

    const fields = (await this.profiles.loadProfileTypeFieldsByProfileTypeId(profileTypeId)).filter(
      (f) => EXPORTABLE_FIELD_TYPES.includes(f.type),
    );

    worksheet.columns = ["profile-id" as const, ...fields].map((field) => {
      if (field === "profile-id") {
        return {
          key: "profile-id",
          header: "ID",
        };
      } else {
        return {
          key: toGlobalId("ProfileTypeField", field.id),
          header: field.name.en || field.name.es || "",
        };
      }
    });

    // this will write 2nd row on the excel, where we put every field globalId
    worksheet.addRow(
      Object.fromEntries(
        ["profile-id" as const, ...fields]
          .map((field) => {
            if (field === "profile-id") {
              return field;
            } else {
              return toGlobalId("ProfileTypeField", field.id);
            }
          })
          .map((value) => [value, value]),
      ),
    );

    for (const rowNumber of [1, 2]) {
      worksheet.getRow(rowNumber).eachCell((c) => {
        c.style = {
          fill: { type: "pattern", pattern: "solid", fgColor: { argb: "00F7C7AC" } },
          font: { bold: rowNumber === 1 },
        };
      });
    }

    return worksheet;
  }

  private buildExcelDeferredRelationshipsWorksheet(
    deferredRelationships: OutputContextExcel["deferredRelationships"],
    workbook: Workbook,
  ) {
    const relationshipsWorksheet = workbook.addWorksheet("Relationships");

    relationshipsWorksheet.columns = [
      { key: "parentProfileId", header: "Parent Profile ID" },
      { key: "otherProfileId", header: "Other Profile ID" },
      { key: "profileRelationshipTypeId", header: "Profile Relationship Type ID" },
      { key: "parentProfileRelationshipSide", header: "Parent Profile Relationship Side" },
      { key: "missingRemoteRelationshipStrategy", header: "Missing Remote Relationship Strategy" },
    ];

    for (const rel of deferredRelationships) {
      const parentProfileId = rel.parentProfileIdCellReference;
      for (const relationship of rel.relationships) {
        const otherProfileWorksheet = workbook.getWorksheet(
          `ProfileType_${relationship.profileTypeId}`,
        );
        assert(isNonNullish(otherProfileWorksheet), "Other profile worksheet not found");

        let otherProfileRow: Row | null = null;
        otherProfileWorksheet.eachRow((row) => {
          if (
            relationship.matchBy.every(
              (m) => row.getCell(toGlobalId("ProfileTypeField", m[0])).value === m[1],
            )
          ) {
            otherProfileRow = row;
          }
        });

        assert(isNonNullish(otherProfileRow), "Other profile row not found");

        relationshipsWorksheet.addRow({
          parentProfileId: `=(${parentProfileId})`,
          otherProfileId: `=(ProfileType_${relationship.profileTypeId}!A${(otherProfileRow as Row).number})`,
          profileRelationshipTypeId: relationship.profileRelationshipTypeId,
          parentProfileRelationshipSide: relationship.parentProfileRelationshipSide,
          missingRemoteRelationshipStrategy: relationship.missingRemoteRelationshipStrategy,
        });
      }
    }
  }
}
