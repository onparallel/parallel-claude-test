import safeStringify from "fast-safe-stringify";
import { inject, injectable, ResolutionContext } from "inversify";
import { JSONPath } from "jsonpath-plus";
import pMap from "p-map";
import {
  fromEntries,
  indexBy,
  isDeepEqual,
  isNonNullish,
  isNullish,
  pick,
  uniqueBy,
  zip,
} from "remeda";
import { assert } from "ts-essentials";
import { ProfileSyncLogSyncType } from "../../../db/__types";
import { FileRepository } from "../../../db/repositories/FileRepository";
import {
  EnhancedOrgIntegration,
  IntegrationRepository,
} from "../../../db/repositories/IntegrationRepository";
import { ProfileRepository } from "../../../db/repositories/ProfileRepository";
import { ENCRYPTION_SERVICE, EncryptionService } from "../../../services/EncryptionService";
import { ILogger, LOGGER_FACTORY, LoggerFactory } from "../../../services/Logger";
import {
  PROFILES_HELPER_SERVICE,
  ProfilesHelperService,
} from "../../../services/ProfilesHelperService";
import {
  OutputContext,
  PROFILE_SYNC_SERVICE,
  ProfileSyncService,
} from "../../../services/ProfileSyncService";
import { IStorageService, STORAGE_SERVICE } from "../../../services/StorageService";
import { toGlobalId } from "../../../util/globalId";
import { never } from "../../../util/never";
import { pFlatMap } from "../../../util/promises/pFlatMap";
import { pObject } from "../../../util/promises/pObject";
import { random } from "../../../util/token";
import { GenericIntegration } from "../../helpers/GenericIntegration";
import { applyFieldTransforms } from "../common/transforms";
import { MockSapOdataClientError } from "./errors";
import {
  buildPollingLastChangeFilter,
  buildPollingLastChangeOrderBy,
  walkSapEntitySetFilterExpression,
} from "./helpers";
import { ISapOdataClient, SAP_ODATA_CLIENT_FACTORY, SapOdataClientFactory } from "./SapOdataClient";
import {
  ISapProfileSyncIntegrationSettingsValidator,
  PROFILE_SYNC_INTEGRATION_SETTINGS_VALIDATOR,
} from "./SapProfileSyncIntegrationSettingsValidator";
import {
  SAP_FIELD_TRANSFORMS,
  SapEntityDefinition,
  SapEntityFieldMapping,
  SapEntityFieldReference,
  SapEntityMapping,
  SapEntityRelationshipFetchStrategy,
  SapEntityRelationshipMapping,
  SapEntityRelationshipSyncStrategy,
  SapEntityRelationshipSyncStrategyReplicateRelationship,
  SapEntitySetFilter,
  SapEntitySetFilterRootExpression,
  SapEntitySetOrderBy,
  SapFieldTransform,
  SapLocalIdBinding,
} from "./types";

export interface ToLocalProfileData {
  profileTypeId: number;
  matchBy: [profileTypeFieldId: number, any][];
  data: [profileTypeFieldId: number, any][];
  relationshipGroups: {
    syncStrategy: SapEntityRelationshipSyncStrategyReplicateRelationship;
    syncData: ToLocalProfileRelationshipData[];
  }[];
}

interface ToLocalProfileRelationshipData {
  profileTypeId: number;
  profileRelationshipTypeId: number;
  parentProfileRelationshipSide: "LEFT" | "RIGHT";
  matchBy: [profileTypeFieldId: number, any][];
  data: [profileTypeFieldId: number, any][];
}

interface LocalProfile {
  id: number;
  values: { [profileTypeFieldId: number]: number | string | string[] };
}

interface RemoteEntityUpdate {
  entityDefinition: SapEntityDefinition;
  key: Record<string, any>;
  values: { [key: string]: any };
}

interface SapProfileSyncIntegrationContext {
  orgId: number;
  baseUrl: string;
  mappings: SapEntityMapping[];
  additionalHeaders?: Record<string, string>;
}

interface SapProfileSyncIntegrationLoggingContext {
  onSyncDataFetched: (syncData: any, i?: number) => Promise<void>;
}

export const SAP_PROFILE_SYNC_INTEGRATION = Symbol.for("SAP_PROFILE_SYNC_INTEGRATION");

@injectable()
export class SapProfileSyncIntegration extends GenericIntegration<
  "PROFILE_SYNC",
  "SAP",
  SapProfileSyncIntegrationContext
> {
  override type = "PROFILE_SYNC" as const;
  override provider = "SAP" as const;

  private logger!: ILogger;
  private integrationId!: number;
  private output: "EXCEL" | "DATABASE" = "DATABASE";

  constructor(
    @inject(ENCRYPTION_SERVICE) encryption: EncryptionService,
    @inject(IntegrationRepository) integrations: IntegrationRepository,
    @inject(ProfileRepository) private profiles: ProfileRepository,
    @inject(FileRepository) private files: FileRepository,
    @inject(SAP_ODATA_CLIENT_FACTORY) private sapOdataClientFactory: SapOdataClientFactory,
    @inject(LOGGER_FACTORY) readonly loggerFactory: LoggerFactory,
    @inject(PROFILE_SYNC_SERVICE) private profileSyncService: ProfileSyncService,
    @inject(PROFILE_SYNC_INTEGRATION_SETTINGS_VALIDATOR)
    private settingsValidator: ISapProfileSyncIntegrationSettingsValidator,
    @inject(PROFILES_HELPER_SERVICE) private profilesHelper: ProfilesHelperService,
    @inject(STORAGE_SERVICE) private storage: IStorageService,
  ) {
    super(encryption, integrations);
  }

  configure(integrationId: number, output?: "EXCEL" | "DATABASE") {
    this.integrationId = integrationId;
    this.logger = this.loggerFactory(`SapProfileSyncIntegration ${integrationId}`);
    this.output = output ?? "DATABASE";
  }

  async pollForChangedEntities(changedAfter: Date) {
    await this.withSapOdataClient("TO_LOCAL", async (client, context) => {
      const outputContext = this.profileSyncService.createOutputContext(this.output);

      const pollingMappings = context.mappings.filter((m) => m.changeDetection.type === "POLLING");

      for (const mapping of pollingMappings) {
        const index = pollingMappings.indexOf(mapping);
        const entities = await this.fetchEntitySet(
          client,
          mapping,
          {
            operator: "and",
            conditions: [
              ...(isNonNullish(mapping.filter) ? [mapping.filter] : []),
              buildPollingLastChangeFilter(mapping.changeDetection.remoteLastChange, changedAfter),
            ],
          },
          buildPollingLastChangeOrderBy(mapping.changeDetection.remoteLastChange),
          context,
        );
        const profileData = await pMap(
          entities,
          async (item) => await this.buildProfileData(item, mapping, context),
          { concurrency: 100 },
        );

        await context.onSyncDataFetched(profileData, index);

        if (this.output === "DATABASE") {
          const dbContext = outputContext as OutputContext<"DATABASE">;
          await this.profileSyncService.writeIntoDatabase(
            profileData,
            context.orgId,
            this.integrationId,
            dbContext,
          );

          if (isNonNullish(mapping.localIdBinding)) {
            const profiles = profileData.map((d) => {
              const profile = dbContext.alreadySyncedProfiles.find((p) =>
                isDeepEqual(p.matchBy, d.matchBy),
              );
              assert(isNonNullish(profile), "Profile must be found by matchBy");
              return pick(profile, ["id"]);
            });

            await pMap(
              zip(entities, profiles),
              async ([entity, profile], i) => {
                const remoteLocalIdValues = await this.applyFieldTransforms(
                  [toGlobalId("Profile", profile.id)],
                  mapping.localIdBinding!.toRemoteTransforms,
                );
                const currentRemoteLocalIdValues = mapping.localIdBinding!.remoteEntityFields.map(
                  (f) => entity[f],
                );

                // Skip update if the remote entity already has the correct local ID
                // to avoid an infinite polling loop (PATCH updates lastChanged, triggering another poll)
                if (isDeepEqual(currentRemoteLocalIdValues, remoteLocalIdValues)) {
                  return;
                }

                const key = fromEntries(
                  mapping.entityDefinition.remoteEntityKey
                    .map((k) => (typeof k === "string" ? k : k.name))
                    .map((k) => [k, entity[k]]),
                );
                if (i % 100 === 0) {
                  this.logger.info(`Updating local ID binding ${i}/${entities.length}`);
                }
                await client.updateEntity(
                  mapping.entityDefinition,
                  key,
                  fromEntries(zip(mapping.localIdBinding!.remoteEntityFields, remoteLocalIdValues)),
                );
              },
              { concurrency: 10 },
            );
          }
        } else if (this.output === "EXCEL") {
          await this.profileSyncService.writeIntoExcelFile(
            profileData,
            context.orgId,
            outputContext as OutputContext<"EXCEL">,
          );
        } else {
          never("Invalid output type");
        }
      }

      return await this.profileSyncService.closeOutputContext(
        this.output,
        outputContext,
        `SapProfileSyncIntegration:${this.integrationId}`,
      );
    });
  }

  async initialSync() {
    return await this.withSapOdataClient("INITIAL", async (client, context) => {
      const outputContext = this.profileSyncService.createOutputContext(this.output);

      for (const mapping of context.mappings) {
        const index = context.mappings.indexOf(mapping);
        const entities = await this.fetchEntitySet(
          client,
          mapping,
          mapping.filter,
          mapping.initialSyncOrderBy,
          context,
        );
        const profileData = await pMap(
          entities,
          async (item) => await this.buildProfileData(item, mapping, context),
          { concurrency: 100 },
        );
        await context.onSyncDataFetched(profileData, index);

        if (this.output === "DATABASE") {
          const dbContext = outputContext as OutputContext<"DATABASE">;
          await this.profileSyncService.writeIntoDatabase(
            profileData,
            context.orgId,
            this.integrationId,
            dbContext,
          );

          // after profiles on this iteration have been written to the database, we can update the remote entities with the local ID binding
          // here we will update only the "root" entities, not the ones in relationships that will be updated in a later iteration
          if (isNonNullish(mapping.localIdBinding)) {
            // get a list of profile Ids in same order as fetched entities so we can zip below
            const profiles = profileData.map((d) => {
              const profile = dbContext.alreadySyncedProfiles.find((p) =>
                isDeepEqual(p.matchBy, d.matchBy),
              );
              assert(isNonNullish(profile), "Profile must be found by matchBy");
              return pick(profile, ["id"]);
            });

            await pMap(
              zip(entities, profiles),
              async ([entity, profile], i) => {
                const remoteLocalIdValues = await this.applyFieldTransforms(
                  [toGlobalId("Profile", profile.id)],
                  mapping.localIdBinding!.toRemoteTransforms,
                );
                const currentRemoteLocalIdValues = mapping.localIdBinding!.remoteEntityFields.map(
                  (f) => entity[f],
                );

                // Skip update if the remote entity already has the correct local ID
                if (isDeepEqual(currentRemoteLocalIdValues, remoteLocalIdValues)) {
                  return;
                }

                const key = fromEntries(
                  mapping.entityDefinition.remoteEntityKey
                    .map((k) => (typeof k === "string" ? k : k.name))
                    .map((k) => [k, entity[k]]),
                );
                if (i % 100 === 0) {
                  this.logger.info(`Updating local ID binding ${i}/${entities.length}`);
                }
                await client.updateEntity(
                  mapping.entityDefinition,
                  key,
                  fromEntries(zip(mapping.localIdBinding!.remoteEntityFields, remoteLocalIdValues)),
                );
              },
              { concurrency: 10 },
            );
          }
        } else if (this.output === "EXCEL") {
          await this.profileSyncService.writeIntoExcelFile(
            profileData,
            context.orgId,
            outputContext as OutputContext<"EXCEL">,
          );
        } else {
          never("Invalid output type");
        }
      }

      return await this.profileSyncService.closeOutputContext(
        this.output,
        outputContext,
        `SapProfileSyncIntegration:${this.integrationId}`,
      );
    });
  }

  /**
   * Update the necessary remote entities given a list of updated fields in a profile.
   */
  async updateRemoteEntity(
    profileId: number,
    profileTypeId: number,
    updatedProfileTypeFieldIds: number[],
  ) {
    this.logger.debug("updateRemoteEntity", {
      profileId,
      profileTypeId,
      updatedProfileTypeFieldIds,
    });
    return await this.withSapOdataClient("TO_REMOTE", async (client, context) => {
      const match = await this.findMatchingMappingAndProfile(
        context.orgId,
        profileId,
        profileTypeId,
        context.mappings,
      );

      if (isNullish(match)) {
        return {
          output: this.output,
          count: 0,
        };
      }

      const { mapping, profile } = match;
      const remoteEntityKey = await this.applyFieldTransforms(
        mapping.remoteEntityKeyBinding.profileTypeFieldIds.map((id) => profile.values[id]),
        mapping.remoteEntityKeyBinding.toRemoteTransforms,
      );

      if (remoteEntityKey.some(isNullish)) {
        // some of the values used in the remote entity key are not present in the profile
        // so we can't update the remote entity as wa have no way to match it
        throw new Error("Remote entity key is not fully defined");
      }

      const key = fromEntries(
        zip(
          mapping.entityDefinition.remoteEntityKey.map((k) => (typeof k === "string" ? k : k.name)), // ["BusinessPartner"]

          remoteEntityKey, // ["123"]
        ),
      ); // { BusinessPartner: "123" }
      // build a mapping with only the field mappings affected by the updated profile type fields
      const filteredMapping = {
        ...mapping,
        fieldMappings: this.filterFieldMappingsToUpdate(
          mapping.fieldMappings ?? [],
          updatedProfileTypeFieldIds,
        ),
        relationshipMappings: this.filterRelationshipMappings(
          mapping.relationshipMappings ?? [],
          updatedProfileTypeFieldIds,
        ),
      };
      const entity = await this.fetchEntity(client, filteredMapping, key, context);

      if (!entity) {
        await context.onSyncDataFetched({
          entityDefinition: filteredMapping.entityDefinition,
          key,
        });
        throw new Error("Remote entity not found");
      }

      const updates = await this.getRemoteEntitiesToUpdate(
        entity,
        profile,
        filteredMapping.entityDefinition,
        filteredMapping.fieldMappings,
        filteredMapping.relationshipMappings ?? [],
      );

      // also add "profileId" key to remote entity updates if localIdBinding is defined
      if (isNonNullish(mapping.localIdBinding)) {
        // if any of the updated fields is part of the remote entity key
        if (
          updatedProfileTypeFieldIds.some((id) =>
            mapping.remoteEntityKeyBinding.profileTypeFieldIds.includes(id),
          )
        ) {
          let mainEntityUpdate = updates.find(
            (r) =>
              isDeepEqual(r.entityDefinition, mapping.entityDefinition) && isDeepEqual(r.key, key),
          );
          if (isNullish(mainEntityUpdate)) {
            mainEntityUpdate = {
              entityDefinition: mapping.entityDefinition,
              key,
              values: {},
            };
            updates.push(mainEntityUpdate);
          }
          mainEntityUpdate.values = {
            ...mainEntityUpdate.values,
            ...fromEntries(
              zip(
                mapping.localIdBinding.remoteEntityFields,
                await this.applyFieldTransforms(
                  [toGlobalId("Profile", profile.id)],
                  mapping.localIdBinding.toRemoteTransforms,
                ),
              ),
            ),
          };
        }
      }

      await context.onSyncDataFetched(updates);

      // updates can't be done in parallel because of transaction locks
      for (const update of updates) {
        await client.updateEntity(update.entityDefinition, update.key, update.values);
      }

      return {
        output: this.output,
        count: updates.length,
      };
    });
  }

  /**
   * Traverses the entity with the filtered mapping and returns a list of remote entities that need to be updated.
   */
  private async getRemoteEntitiesToUpdate(
    entity: any,
    profile: LocalProfile,
    entityDefinition: SapEntityDefinition,
    fieldMappings: SapEntityFieldMapping[],
    relationshipMappings: SapEntityRelationshipMapping[],
  ): Promise<RemoteEntityUpdate[]> {
    let fromFieldMappings: RemoteEntityUpdate | null = null;
    if (fieldMappings.length > 0) {
      const values = await pFlatMap(
        fieldMappings,
        async ({ profileTypeFieldIds, remoteEntityFields, toRemoteTransforms }) =>
          zip(
            remoteEntityFields,
            await this.applyFieldTransforms(
              profileTypeFieldIds.map((f) => profile.values[f]),
              toRemoteTransforms,
            ),
          ),
      );

      if (values.length > 0) {
        fromFieldMappings = {
          entityDefinition,
          key: pick(
            entity,
            entityDefinition.remoteEntityKey.map((f) => (typeof f === "string" ? f : f.name)),
          ),
          values: fromEntries(values),
        };
      }
    }
    return [
      ...(isNonNullish(fromFieldMappings) ? [fromFieldMappings] : []),
      ...(isNonNullish(entity["$$relationships"])
        ? await pFlatMap(
            zip(entity["$$relationships"] as any[], relationshipMappings),
            async ([items, relationshipMapping]) => {
              if (items.length > 0) {
                assert(
                  relationshipMapping.syncStrategy.type === "EMBED_INTO_PARENT",
                  "Unexpected sync strategy",
                );
                const child = this.selectItemFromMultipleCardinality(
                  items,
                  relationshipMapping.syncStrategy.multipleCardinalitySelector,
                  relationshipMapping.name,
                );
                if (isNullish(child)) {
                  return [];
                }

                return await this.getRemoteEntitiesToUpdate(
                  child,
                  profile,
                  relationshipMapping.fetchStrategy.entityDefinition,
                  relationshipMapping.syncStrategy.fieldMappings ?? [],
                  relationshipMapping.syncStrategy.relationshipMappings ?? [],
                );
              } else {
                return [];
              }
            },
          )
        : []),
    ];
  }

  private async findMatchingMappingAndProfile(
    orgId: number,
    profileId: number,
    profileTypeId: number,
    mappings: SapEntityMapping[],
  ): Promise<{ mapping: SapEntityMapping; profile: LocalProfile } | null> {
    const profileTypeFields =
      await this.profiles.loadProfileTypeFieldsByProfileTypeId(profileTypeId);
    const profileTypeFieldsById = indexBy(profileTypeFields, (f) => f.id);

    for (const mapping of mappings.filter((m) => m.profileTypeId === profileTypeId)) {
      const page = this.profiles.getPaginatedProfileForOrg(
        orgId,
        {
          limit: 1,
          offset: 0,
          profileTypeId: [profileTypeId],
          filter: {
            logicalOperator: "AND",
            conditions: [
              { property: "id", operator: "EQUAL", value: profileId },
              { property: "status", operator: "EQUAL", value: "OPEN" },
              ...(mapping.profileFilter ? [mapping.profileFilter] : []),
            ],
          },
        },
        profileTypeFieldsById,
      );

      const profile = (await page.items).at(0);
      if (isNonNullish(profile)) {
        const values = (await this.profiles.loadProfileFieldValuesByProfileId(profileId)).filter(
          (v) =>
            isNullish(v.anonymized_at) && this.settingsValidator.allowedFieldTypes.includes(v.type),
        );

        return {
          mapping,
          profile: {
            id: profileId,
            values: fromEntries(
              await pMap(
                values.filter((v) => isNullish(v.anonymized_at)),
                async (v) => {
                  const content = await this.profilesHelper.mapValueContentFromDatabase(v);
                  return [
                    v.profile_type_field_id,
                    v.type === "USER_ASSIGNMENT" ? content.user?.email : content.value,
                  ];
                },
                { concurrency: 100 },
              ),
            ),
          },
        };
      }
    }

    return null;
  }

  /**
   * Filters recursively the relationship mappings to only include the fields that are affected by the updated profile type fields.
   */
  private filterRelationshipMappings(
    relationshipMappings: SapEntityRelationshipMapping[],
    updatedProfileTypeFieldIds: number[],
  ): SapEntityRelationshipMapping[] {
    return relationshipMappings.flatMap((relationshipMapping) => {
      if (relationshipMapping.syncStrategy.type === "EMBED_INTO_PARENT") {
        const childFieldMappings = this.filterFieldMappingsToUpdate(
          relationshipMapping.syncStrategy.fieldMappings ?? [],
          updatedProfileTypeFieldIds,
        );
        const childRelationshipMappings = this.filterRelationshipMappings(
          relationshipMapping.syncStrategy.relationshipMappings ?? [],
          updatedProfileTypeFieldIds,
        );
        if (childFieldMappings.length === 0 && childRelationshipMappings.length === 0) {
          return [];
        } else {
          return {
            ...relationshipMapping,
            syncStrategy: {
              ...relationshipMapping.syncStrategy,
              fieldMappings: childFieldMappings,
              relationshipMappings: childRelationshipMappings,
            },
          };
        }
      } else {
        return [];
      }
    });
  }

  private filterFieldMappingsToUpdate(
    fieldMappings: SapEntityFieldMapping[],
    updatedProfileTypeFieldIds: number[],
  ) {
    return fieldMappings.filter(
      ({ profileTypeFieldIds, direction }) =>
        (direction === "BOTH" || direction === "TO_REMOTE") &&
        profileTypeFieldIds.some((id) => updatedProfileTypeFieldIds.includes(id)),
    );
  }

  /**
   * Fetches a single entity from SAP
   */
  private async fetchEntity(
    client: ISapOdataClient,
    mapping: SapEntityMapping,
    key: Record<string, any>,
    context: SapProfileSyncIntegrationContext,
  ) {
    const entity = await client.getEntity(mapping.entityDefinition, key, {
      ...this.buildEntitySelectAndExpandParams({
        entityDefinition: mapping.entityDefinition,
        fieldMappings: mapping.fieldMappings,
        relationshipMappings: mapping.relationshipMappings,
        context,
      }),
    });

    if (!entity) {
      // entity not found
      return null;
    }
    await this.rehydrateDeferredRelationships(
      client,
      entity,
      mapping.entityDefinition,
      mapping.relationshipMappings,
      false,
      context,
    );

    return entity;
  }

  /**
   * Fetches a set of entities from SAP
   */
  private async fetchEntitySet(
    client: ISapOdataClient,
    mapping: SapEntityMapping,
    filter: SapEntitySetFilter | undefined,
    orderBy: SapEntitySetOrderBy,
    context: SapProfileSyncIntegrationContext,
  ) {
    const { results: items } = await client.getEntitySet(mapping.entityDefinition, {
      $filter: filter,
      $orderby: orderBy,
      ...this.buildEntitySelectAndExpandParams({
        ...pick(mapping, [
          "entityDefinition",
          "fieldMappings",
          "relationshipMappings",
          "localIdBinding",
        ]),
        context,
      }),
    });
    await pMap(
      items,
      async (item) =>
        await this.rehydrateDeferredRelationships(
          client,
          item,
          mapping.entityDefinition,
          mapping.relationshipMappings,
          false,
          context,
        ),
      { concurrency: 100 },
    );
    return items;
  }

  /**
   * Builds the profile data from the rehydrated entity and mapping.
   */
  private async buildProfileData(
    entity: any,
    mapping: SapEntityMapping,
    context: SapProfileSyncIntegrationContext,
  ): Promise<ToLocalProfileData> {
    const externalId = await this.buildProfileDataFromFieldMappings(entity, [
      {
        remoteEntityFields: mapping.entityDefinition.remoteEntityKey.map((field) =>
          typeof field === "string" ? field : field.name,
        ),
        ...mapping.remoteEntityKeyBinding,
        direction: "TO_LOCAL",
      },
    ]);
    return {
      profileTypeId: mapping.profileTypeId,
      matchBy: externalId,
      data: uniqueBy(
        [
          ...externalId,
          ...(await this.buildProfileDataFromFieldMappings(entity, mapping.fieldMappings)),
          ...(await this.buildProfileDataFromRelationshipMappings(
            entity,
            mapping.relationshipMappings,
          )),
        ],
        ([id]) => id,
      ),
      relationshipGroups: await this.buildProfileRelationshipData(
        entity,
        mapping.relationshipMappings,
        context.mappings,
      ),
    };
  }

  /**
   * Selects an item from an array using a JSONPath selector for multiple cardinality relationships.
   * Assumes JSONPath returns a single element (not an array).
   * If selector is undefined or returns undefined, defaults to first item.
   */
  private selectItemFromMultipleCardinality(
    items: any[],
    selector: string | undefined,
    relationshipName?: string,
  ): any | undefined {
    if (isNullish(selector)) {
      return items[0];
    }
    try {
      return JSONPath({
        path: selector,
        json: items,
        wrap: false,
      })[0];
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Invalid JSONPath selector "${selector}" for relationship "${relationshipName}": ${error.message}.`,
        );
      }
      return null;
    }
  }

  /**
   * Helper for buildProfileData. Builds the profile data from the field mappings.
   */
  private async buildProfileDataFromFieldMappings(
    entity: any,
    fieldMappings: SapEntityFieldMapping[] | undefined,
  ) {
    if (isNullish(fieldMappings)) {
      return [];
    } else {
      return await pFlatMap(
        fieldMappings.filter((f) => f.direction === "TO_LOCAL" || f.direction === "BOTH"),
        async ({ remoteEntityFields, toLocalTransforms, profileTypeFieldIds }) => {
          return zip(
            profileTypeFieldIds,
            await this.applyFieldTransforms(
              remoteEntityFields.map((f) => entity[f]),
              toLocalTransforms,
            ),
          ).filter(([_, value]) => isNonNullish(value));
        },
      );
    }
  }

  /**
   * Helper for buildProfileData. Builds the profile data from the EMBED_INTO_PARENT relationship mappings.
   */
  private async buildProfileDataFromRelationshipMappings(
    entity: any,
    relationshipMappings: SapEntityRelationshipMapping[] | undefined,
  ): Promise<[profileTypeFieldId: number, any][]> {
    if (isNullish(relationshipMappings)) {
      return [];
    } else {
      return await pFlatMap(
        zip(entity["$$relationships"] as any[], relationshipMappings),
        async ([items, relationshipMapping]) => {
          if (relationshipMapping.syncStrategy.type === "REPLICATE_RELATIONSHIP") {
            return [];
          } else if (relationshipMapping.syncStrategy.type === "EMBED_INTO_PARENT") {
            if (items.length > 0) {
              const child = this.selectItemFromMultipleCardinality(
                items,
                relationshipMapping.syncStrategy.multipleCardinalitySelector,
                relationshipMapping.name,
              );
              if (isNullish(child)) {
                return [];
              }
              return [
                ...(await this.buildProfileDataFromFieldMappings(
                  child,
                  relationshipMapping.syncStrategy.fieldMappings,
                )),
                ...(await this.buildProfileDataFromRelationshipMappings(
                  child,
                  relationshipMapping.syncStrategy.relationshipMappings,
                )),
              ];
            } else {
              return [];
            }
          } else {
            never("Unimplemented sync strategy");
          }
        },
      );
    }
  }

  /**
   * Helper for buildProfileData. Builds the profile relationship data from the REPLICATE_RELATIONSHIP relationship mappings.
   */
  private async buildProfileRelationshipData(
    entity: any,
    relationshipMappings: SapEntityRelationshipMapping[] | undefined,
    mappings: SapEntityMapping[],
  ): Promise<
    {
      syncStrategy: SapEntityRelationshipSyncStrategyReplicateRelationship;
      syncData: ToLocalProfileRelationshipData[];
    }[]
  > {
    if (isNullish(relationshipMappings)) {
      return [];
    } else {
      return await pFlatMap(
        zip(entity["$$relationships"] as any[], relationshipMappings),
        async ([items, relationshipMapping]) => {
          if (relationshipMapping.syncStrategy.type === "REPLICATE_RELATIONSHIP") {
            const { profileRelationshipTypeId, parentProfileRelationshipSide, entityMappingIndex } =
              relationshipMapping.syncStrategy;
            const relatedEntityMapping = mappings[entityMappingIndex];
            const syncData = await pMap(items, async (item) => {
              const externalId = await this.buildProfileDataFromFieldMappings(item, [
                {
                  remoteEntityFields:
                    relationshipMapping.fetchStrategy.entityDefinition.remoteEntityKey.map((f) =>
                      typeof f === "string" ? f : f.name,
                    ),
                  ...relatedEntityMapping.remoteEntityKeyBinding,
                  direction: "TO_LOCAL",
                },
              ]);
              return {
                profileTypeId: relatedEntityMapping.profileTypeId,
                profileRelationshipTypeId,
                parentProfileRelationshipSide,
                matchBy: externalId,
                data: uniqueBy(
                  [
                    ...externalId,
                    ...(await this.buildProfileDataFromFieldMappings(
                      item,
                      relatedEntityMapping.fieldMappings,
                    )),
                    ...(await this.buildProfileDataFromRelationshipMappings(
                      item,
                      relatedEntityMapping.relationshipMappings,
                    )),
                  ],
                  ([id]) => id,
                ),
              };
            });

            return [
              {
                syncStrategy: relationshipMapping.syncStrategy,
                syncData,
              },
            ];
          } else if (relationshipMapping.syncStrategy.type === "EMBED_INTO_PARENT") {
            if (
              isNullish(relationshipMapping.syncStrategy.relationshipMappings) ||
              items.length === 0
            ) {
              return [];
            }
            const child = this.selectItemFromMultipleCardinality(
              items,
              relationshipMapping.syncStrategy.multipleCardinalitySelector,
              relationshipMapping.name,
            );
            if (isNullish(child)) {
              return [];
            }

            return await this.buildProfileRelationshipData(
              child,
              relationshipMapping.syncStrategy.relationshipMappings,
              mappings,
            );
          } else {
            never("Unimplemented sync strategy");
          }
        },
      );
    }
  }

  /**
   * This method is used to rehydrate the deferred relationships for the entity fetched from the SAP OData API,
   * making subsequent calls to fetch the missing data.
   */
  private async rehydrateDeferredRelationships(
    client: ISapOdataClient,
    entity: any,
    entityDefinition: SapEntityDefinition,
    relationshipMappings: SapEntityRelationshipMapping[] | undefined,
    entityIsReplicatedRelationship: boolean,
    context: SapProfileSyncIntegrationContext,
  ) {
    if (isNullish(relationshipMappings)) {
      entity["$$relationships"] = [];
      return;
    }
    entity["$$relationships"] = await pMap(relationshipMappings, async (relationshipMapping) => {
      const { fetchStrategy, syncStrategy } = relationshipMapping;
      let relationshipEntityDefinition: SapEntityDefinition;
      let relationshipData: any;
      if (entityIsReplicatedRelationship && syncStrategy.type === "REPLICATE_RELATIONSHIP") {
        // only one level of nested relationships is fetched for replicated relationships
        return null;
      }
      if (fetchStrategy.type === "FROM_NAVIGATION_PROPERTY") {
        const { filter, orderBy, filterParams, navigationProperty } = fetchStrategy;
        relationshipEntityDefinition = fetchStrategy.entityDefinition;
        if (isNonNullish(filter) || isNonNullish(orderBy)) {
          const select = new Set<string>();
          const expand = new Set<string>();
          this.buildRelationshipMappingFromNavigationPropertyParams(
            relationshipMapping,
            select,
            expand,
            "",
            context,
          );
          relationshipData = await client.getEntityNavigationProperty(
            entityDefinition,
            navigationProperty,
            entity,
            {
              $filter: isNonNullish(filter)
                ? await this.replaceParamsInFilter(filter, filterParams, entity)
                : undefined,
              $orderby: orderBy,
              $select: select,
              $expand: expand,
            },
          );
        } else {
          relationshipData = entity[navigationProperty];
          delete entity[navigationProperty];
        }
      } else if (fetchStrategy.type === "FROM_ENTITY_SET") {
        const { filter, orderBy, filterParams } = fetchStrategy;
        relationshipEntityDefinition = fetchStrategy.entityDefinition;
        relationshipData = await client.getEntitySet(relationshipEntityDefinition, {
          $filter: isNonNullish(filter)
            ? await this.replaceParamsInFilter(filter, filterParams, entity)
            : undefined,
          $orderby: orderBy,
          ...this.buildEntitySelectAndExpandParams({
            entityDefinition: relationshipEntityDefinition,
            ...this.getRelationshipMappings(syncStrategy, context),
            context,
          }),
        });
      } else if (fetchStrategy.type === "FROM_ENTITY") {
        const entityKey = await pObject(
          fetchStrategy.key,
          async ({ entityFields, transforms }) =>
            (
              await this.applyFieldTransforms(
                entityFields.map((f) => entity[f]),
                transforms,
              )
            )[0],
        );

        // some of the values used in the remote entity key are not present in the entity
        // so we can't build entity relationships for this fetchStrategy
        if (Object.values(entityKey).some(isNullish)) {
          return [];
        }
        relationshipEntityDefinition = fetchStrategy.entityDefinition;
        relationshipData = await client.getEntity(relationshipEntityDefinition, entityKey, {
          ...this.buildEntitySelectAndExpandParams({
            entityDefinition: relationshipEntityDefinition,
            ...this.getRelationshipMappings(syncStrategy, context),
            context,
          }),
        });
      } else {
        never("Unimplemented fetch strategy");
      }
      const items = this.getRelationshipItems(fetchStrategy, relationshipData);
      // check nested relationship mappings
      const { relationshipMappings } = this.getRelationshipMappings(syncStrategy, context);
      await pMap(items, async (item) => {
        await this.rehydrateDeferredRelationships(
          client,
          item,
          relationshipEntityDefinition,
          relationshipMappings,
          entityIsReplicatedRelationship || syncStrategy.type === "REPLICATE_RELATIONSHIP",
          context,
        );
      });

      return items;
    });
  }

  /**
   * Builds the $select and $expand params for the SAP OData request in order to eagerly fetch as much data as possible.
   * Anything that is not fetched eagerly will be fetched later with the rehydrateDeferredRelationships method.
   */
  private buildEntitySelectAndExpandParams({
    entityDefinition,
    fieldMappings,
    localIdBinding,
    relationshipMappings,
    context,
  }: {
    entityDefinition: SapEntityDefinition;
    fieldMappings?: SapEntityFieldMapping[];
    localIdBinding?: SapLocalIdBinding;
    relationshipMappings?: SapEntityRelationshipMapping[];
    context: SapProfileSyncIntegrationContext;
  }) {
    const select = new Set<string>();
    const expand = new Set<string>();
    for (const field of entityDefinition.remoteEntityKey) {
      select.add(typeof field === "string" ? field : field.name);
    }
    if (isNonNullish(localIdBinding)) {
      for (const field of localIdBinding.remoteEntityFields) {
        select.add(field);
      }
    }
    for (const fieldMapping of fieldMappings ?? []) {
      if (fieldMapping.direction === "TO_LOCAL" || fieldMapping.direction === "BOTH") {
        for (const field of fieldMapping.remoteEntityFields) {
          select.add(field);
        }
      }
    }
    for (const relationshipMapping of relationshipMappings ?? []) {
      this.buildRelationshipMappingParams(relationshipMapping, select, expand, "", context);
    }
    return { $select: select, $expand: expand };
  }

  /**
   * Helper method for buildEntitySelectAndExpandParams. Adds the $select and $expand params for the relationship mapping.
   */
  private buildRelationshipMappingParams(
    relationshipMapping: SapEntityRelationshipMapping,
    select: Set<string>,
    expand: Set<string>,
    prefix: string = "",
    context: SapProfileSyncIntegrationContext,
  ) {
    const { fetchStrategy, syncStrategy } = relationshipMapping;
    if (fetchStrategy.type === "FROM_NAVIGATION_PROPERTY") {
      const { navigationProperty, filter, orderBy } = fetchStrategy;
      const path = `${prefix}${navigationProperty}`;
      if (isNullish(filter) && isNullish(orderBy)) {
        // if filter is not defined we can just expand the navigation property
        expand.add(path);
        this.buildRelationshipMappingFromNavigationPropertyParams(
          relationshipMapping,
          select,
          expand,
          `${path}/`,
          context,
        );
      }
      if (syncStrategy.type === "EMBED_INTO_PARENT") {
        for (const field of syncStrategy.multipleCardinalitySelectorDependencies ?? []) {
          select.add(`${path}/${field}`);
        }
      }
    } else if (fetchStrategy.type === "FROM_ENTITY_SET") {
      for (const { entityFields } of Object.values(fetchStrategy.filterParams ?? {})) {
        // include fields needed for the filter
        for (const field of entityFields) {
          select.add(`${prefix}${field}`);
        }
      }
    } else if (fetchStrategy.type === "FROM_ENTITY") {
      for (const { entityFields } of Object.values(fetchStrategy.key ?? {})) {
        // include fields needed for the filter
        for (const field of entityFields) {
          select.add(`${prefix}${field}`);
        }
      }
    } else {
      never("Unimplemented fetch strategy");
    }
  }

  /**
   * Helper method for buildEntitySelectAndExpandParams. Adds the $select and $expand params for the navigation property relationship mapping.
   */
  private buildRelationshipMappingFromNavigationPropertyParams(
    { fetchStrategy, syncStrategy }: SapEntityRelationshipMapping,
    select: Set<string>,
    expand: Set<string>,
    prefix: string = "",
    context: SapProfileSyncIntegrationContext,
  ) {
    assert(
      fetchStrategy.type === "FROM_NAVIGATION_PROPERTY",
      "Unexpected relationship mapping fetch strategy",
    );
    for (const field of fetchStrategy.entityDefinition.remoteEntityKey) {
      select.add(`${prefix}${typeof field === "string" ? field : field.name}`);
    }

    const { fieldMappings, relationshipMappings, localIdBinding } = this.getRelationshipMappings(
      syncStrategy,
      context,
    );

    for (const fieldMapping of fieldMappings ?? []) {
      if (fieldMapping.direction === "TO_LOCAL" || fieldMapping.direction === "BOTH") {
        for (const field of fieldMapping.remoteEntityFields) {
          select.add(`${prefix}${field}`);
        }
      }
    }
    if (isNonNullish(localIdBinding)) {
      for (const field of localIdBinding.remoteEntityFields) {
        select.add(`${prefix}${field}`);
      }
    }
    for (const childRelationshipMapping of relationshipMappings ?? []) {
      if (childRelationshipMapping.syncStrategy.type === "REPLICATE_RELATIONSHIP") {
        // we only manage one level of nested relationships to avoid infinite recursion,
        // subsequent levels will be handled when the related mapping is processed
        continue;
      }
      this.buildRelationshipMappingParams(
        childRelationshipMapping,
        select,
        expand,
        prefix,
        context,
      );
    }
  }

  private getRelationshipMappings(
    syncStrategy: SapEntityRelationshipSyncStrategy,
    context: SapProfileSyncIntegrationContext,
  ): {
    fieldMappings?: SapEntityFieldMapping[];
    relationshipMappings?: SapEntityRelationshipMapping[];
    localIdBinding?: SapLocalIdBinding;
  } {
    if (syncStrategy.type === "EMBED_INTO_PARENT") {
      return pick(syncStrategy, ["fieldMappings", "relationshipMappings"]);
    } else if (syncStrategy.type === "REPLICATE_RELATIONSHIP") {
      const mapping = context.mappings[syncStrategy.entityMappingIndex];
      return pick(mapping, ["fieldMappings", "relationshipMappings", "localIdBinding"]);
    } else {
      never("Unimplemented sync strategy");
    }
  }

  private getRelationshipItems(
    fetchStrategy: SapEntityRelationshipFetchStrategy,
    relationship: any,
  ) {
    if (fetchStrategy.type === "FROM_NAVIGATION_PROPERTY") {
      return fetchStrategy.expectedCardinality === "MANY"
        ? relationship.results
        : relationship === null
          ? []
          : [relationship];
    } else if (fetchStrategy.type === "FROM_ENTITY_SET") {
      return relationship.results;
    } else if (fetchStrategy.type === "FROM_ENTITY") {
      return relationship === null ? [] : [relationship];
    } else {
      never("Unimplemented fetch strategy");
    }
  }

  /**
   * Replaces the params in the filter with the values from the entity.
   */
  private async replaceParamsInFilter(
    filter: SapEntitySetFilter,
    params: Record<string, SapEntityFieldReference> | undefined,
    entity: any,
  ) {
    if (isNullish(params)) {
      return filter;
    }
    const paramValues = await pObject(params, async ({ entityFields, transforms }) => {
      const [result] = await this.applyFieldTransforms(
        entityFields.map((f) => entity[f]),
        transforms,
      );
      return result;
    });
    return walkSapEntitySetFilterExpression(filter, (expr) => {
      if ("type" in expr && expr.type === "literal") {
        return {
          ...expr,
          value: expr.value.replace(
            /\{\{([a-zA-Z_$][a-zA-Z0-9_$]*)\}\}/g,
            (_, p1) => paramValues[p1] ?? "",
          ),
        };
      } else {
        return expr;
      }
    }) as SapEntitySetFilterRootExpression;
  }

  private async applyFieldTransforms(initial: any[], transforms: SapFieldTransform[] | undefined) {
    return await applyFieldTransforms(SAP_FIELD_TRANSFORMS, transforms ?? [], initial);
  }

  private async withSapOdataClient(
    syncType: ProfileSyncLogSyncType,
    handler: (
      client: ISapOdataClient,
      context: SapProfileSyncIntegrationContext & SapProfileSyncIntegrationLoggingContext,
    ) => Promise<any>,
  ) {
    return await this.withCredentials(this.integrationId, async (authorization, context) => {
      return await this.withProfileSyncLogging(syncType, async (loggingContext) => {
        using client = this.sapOdataClientFactory(
          this.logger,
          context.baseUrl,
          authorization,
          context.additionalHeaders,
        );
        await handler(client, { ...context, ...loggingContext });
      });
    });
  }

  private async withProfileSyncLogging(
    syncType: ProfileSyncLogSyncType,
    handler: (context: SapProfileSyncIntegrationLoggingContext) => Promise<any>,
  ) {
    const log = await this.integrations.createProfileSyncLog(
      {
        integration_id: this.integrationId,
        sync_type: syncType,
        status: "PENDING",
      },
      `SapProfileSyncIntegration:${this.integrationId}`,
    );
    try {
      const output = await handler({
        onSyncDataFetched: async (data, i) => {
          const path = random(16);
          const response = await this.storage.temporaryFiles.uploadFile(
            path,
            "application/json",
            Buffer.from(JSON.stringify(data), "utf8"),
          );
          const file = await this.files.createTemporaryFile(
            {
              path,
              content_type: "application/json",
              filename: i ? `${path}-${i}.json` : `${path}.json`,
              size: response["ContentLength"]?.toString() ?? "0",
            },
            `SapProfileSyncIntegration:${this.integrationId}`,
          );
          return await this.integrations.appendProfileSyncLogSyncData(log.id, {
            temporary_file_id: file.id,
          });
        },
      });

      await this.integrations.updateProfileSyncLog(
        log.id,
        { status: "COMPLETED", output: JSON.stringify(output) },
        `SapProfileSyncIntegration:${this.integrationId}`,
      );
    } catch (error) {
      if (error instanceof MockSapOdataClientError) {
        throw error;
      }
      this.logger.error("Profile sync failed", error);
      await this.integrations.updateProfileSyncLog(
        log.id,
        {
          status: "FAILED",
          error:
            error instanceof Error
              ? { message: error.message, stack: error.stack }
              : safeStringify(error),
        },
        `SapProfileSyncIntegration:${this.integrationId}`,
      );
    }
    return log;
  }

  protected override getContext(
    integration: EnhancedOrgIntegration<"PROFILE_SYNC", "SAP", false>,
  ): SapProfileSyncIntegrationContext {
    return {
      ...pick(integration.settings, ["baseUrl", "mappings", "additionalHeaders"]),
      orgId: integration.org_id,
    };
  }
}

export const SAP_PROFILE_SYNC_INTEGRATION_FACTORY = Symbol.for(
  "SAP_PROFILE_SYNC_INTEGRATION_FACTORY",
);

export function getSapProfileSyncIntegrationFactory(context: ResolutionContext) {
  return function sapProfileSyncIntegrationFactory(
    integrationId: number,
    output?: "EXCEL" | "DATABASE",
  ) {
    const integration = context.get<SapProfileSyncIntegration>(SAP_PROFILE_SYNC_INTEGRATION);
    integration.configure(integrationId, output);
    return integration;
  };
}

export type SapProfileSyncIntegrationFactory = ReturnType<
  typeof getSapProfileSyncIntegrationFactory
>;
