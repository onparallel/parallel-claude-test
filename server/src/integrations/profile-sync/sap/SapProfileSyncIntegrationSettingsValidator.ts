import { inject, injectable } from "inversify";
import { isNonNullish, isNullish, unique } from "remeda";
import { assert } from "ts-essentials";
import { isDeepStrictEqual } from "util";
import { xml2js } from "xml-js";
import { ProfileTypeFieldType } from "../../../db/__types";
import { ProfileRepository } from "../../../db/repositories/ProfileRepository";
import { LOGGER_FACTORY, LoggerFactory } from "../../../services/Logger";
import { getAssertionErrorMessage, isAssertionError } from "../../../util/assert";
import { never } from "../../../util/never";
import { ProfileQueryFilter } from "../../../util/ProfileQueryFilter";
import { MaybeArray, MaybePromise, unMaybeArray } from "../../../util/types";
import { SettingsValidationError } from "./errors";
import { SAP_ODATA_CLIENT_FACTORY, SapOdataClientFactory } from "./SapOdataClient";
import {
  SAP_FIELD_TRANSFORMS,
  SapEntityDefinition,
  SapEntityFieldMapping,
  SapEntityFieldReference,
  SapEntityMapping,
  SapEntityRelationshipFetchFromEntity,
  SapEntityRelationshipFetchFromEntitySet,
  SapEntityRelationshipFetchFromNavigationProperty,
  SapEntityRelationshipMapping,
  SapEntityRelationshipSyncStrategyReplicateRelationship,
  SapEntitySetFilterFunctionCall,
  SapEntitySetFilterLeaf,
  SapEntitySetFilterRootExpression,
  SapEntitySetOrderBy,
  SapFieldTransform,
  SapPollingLastChangeStrategy,
  SapProfileSyncIntegrationSettings,
  SapRemoteEntityKeyBinding,
} from "./types";

type MetadataElement = {
  _attributes: Record<string, string>;
} & {
  [K in Exclude<string, "_attributes">]: MetadataElement[];
};

export const PROFILE_SYNC_INTEGRATION_SETTINGS_VALIDATOR = Symbol.for(
  "PROFILE_SYNC_INTEGRATION_SETTINGS_VALIDATOR",
);

export interface ISapProfileSyncIntegrationSettingsValidator {
  allowedFieldTypes: ProfileTypeFieldType[];
  validate(orgId: number, settings: SapProfileSyncIntegrationSettings): Promise<void>;
}

@injectable()
export class SapProfileSyncIntegrationSettingsValidator
  implements ISapProfileSyncIntegrationSettingsValidator
{
  public readonly allowedFieldTypes: ProfileTypeFieldType[] = [
    "SHORT_TEXT",
    "TEXT",
    "SELECT",
    "PHONE",
    "NUMBER",
    "DATE",
    "USER_ASSIGNMENT",
    "CHECKBOX",
  ];

  constructor(
    @inject(ProfileRepository) private profiles: ProfileRepository,
    @inject(LOGGER_FACTORY) private loggerFactory: LoggerFactory,
    @inject(SAP_ODATA_CLIENT_FACTORY) private sapOdataClientFactory: SapOdataClientFactory,
  ) {}

  async validate(orgId: number, settings: SapProfileSyncIntegrationSettings) {
    await this.validateBaseUrl(settings.baseUrl);

    await this.validateProfileTypes(orgId, settings);

    for (const mapping of settings.mappings) {
      const index = settings.mappings.indexOf(mapping);
      await this.wrapError(
        () => this.validateEntityMapping(settings, mapping),
        `mappings[${index}]`,
      );
    }
  }

  private async validateBaseUrl(baseUrl: string) {
    await this.wrapError(() => {
      assert(baseUrl.startsWith("https://"), "must start with https://");
      assert(!baseUrl.endsWith("/"), "must not end with a slash");
    }, "baseUrl");
  }

  private async validateProfileTypes(orgId: number, settings: SapProfileSyncIntegrationSettings) {
    const profileTypeIds = unique(settings.mappings.map((m) => m.profileTypeId));
    if (profileTypeIds.length === 0) {
      return;
    }

    const profileTypes = await this.profiles.loadProfileType(profileTypeIds);

    for (const mapping of settings.mappings) {
      const index = settings.mappings.indexOf(mapping);
      await this.wrapError(() => {
        assert(
          profileTypes.some((pt) => pt?.id === mapping.profileTypeId && pt.org_id === orgId),
          "invalid id",
        );
      }, `mappings[${index}].profileTypeId`);
    }
  }

  private async validateEntityMapping(
    settings: SapProfileSyncIntegrationSettings,
    mapping: SapEntityMapping,
  ) {
    const metadata = await this.fetchMetadata(settings, mapping.entityDefinition.servicePath);
    const entityType = await this.wrapError(
      () => this.findEntityType(metadata, mapping.entityDefinition),
      `.entityDefinition`,
    );

    if (isNonNullish(mapping.filter)) {
      await this.wrapError(
        () => this.validateEntitySetFilter(entityType, mapping.filter!),
        `.filter`,
      );
    }

    if (isNonNullish(mapping.profileFilter)) {
      await this.wrapError(
        () => this.validateProfileFilter(mapping.profileTypeId, mapping.profileFilter!),
        `.profileFilter`,
      );
    }

    if (isNonNullish(mapping.initialSyncOrderBy)) {
      await this.wrapError(
        () => this.validateEntitySetOrderBy(entityType, mapping.initialSyncOrderBy!),
        `.initialSyncOrderBy`,
      );
    }

    if (mapping.changeDetection.type === "POLLING") {
      await this.wrapError(
        () =>
          this.validatePollingLastChangeStrategy(
            entityType,
            mapping.changeDetection.remoteLastChange,
          ),
        `.changeDetection.remoteLastChange`,
      );
    } else {
      never("Unimplemented changeDetection strategy");
    }

    if (mapping.remoteEntityKeyBinding.profileTypeFieldIds.length === 1) {
      const field = await this.profiles.loadProfileTypeField(
        mapping.remoteEntityKeyBinding.profileTypeFieldIds[0],
      );
      await this.wrapError(() => {
        assert(
          field?.is_unique,
          `Field with id "${mapping.remoteEntityKeyBinding.profileTypeFieldIds[0]}" is not unique`,
        );
      }, `.remoteEntityKeyBinding.profileTypeFieldIds[0]`);
    }

    for (const fieldMapping of mapping.fieldMappings ?? []) {
      const fieldMappingIndex = mapping.fieldMappings!.indexOf(fieldMapping);
      await this.wrapError(
        () => this.validateFieldMapping(mapping.profileTypeId, entityType, fieldMapping),
        `.fieldMappings[${fieldMappingIndex}]`,
      );
    }

    for (const relationshipMapping of mapping.relationshipMappings ?? []) {
      const relationshipMappingIndex = mapping.relationshipMappings!.indexOf(relationshipMapping);
      await this.wrapError(
        () =>
          this.validateRelationshipMapping(
            settings,
            mapping.profileTypeId,
            mapping.entityDefinition,
            entityType,
            relationshipMapping,
          ),
        `.relationshipMappings[${relationshipMappingIndex}]`,
      );
    }

    await this.wrapError(
      () =>
        this.validateRemoteEntityKeyBinding(mapping.profileTypeId, mapping.remoteEntityKeyBinding),
      `.remoteEntityKeyBinding`,
    );
  }

  private async validateEntitySetFilter(
    entityType: MetadataElement,
    filter:
      | SapEntitySetFilterRootExpression
      | SapEntitySetFilterFunctionCall
      | SapEntitySetFilterLeaf,
    filterParams?: Record<string, SapEntityFieldReference>,
  ) {
    if ("conditions" in filter) {
      await this.wrapError(() => {
        assert(filter.conditions.length >= 1, "Filter group must have at least one condition");
      }, ".conditions");

      for (const condition of filter.conditions) {
        const index = filter.conditions.indexOf(condition);
        await this.wrapError(
          () => this.validateEntitySetFilter(entityType, condition, filterParams),
          `.conditions[${index}]`,
        );
      }
    } else if ("operator" in filter) {
      if (filter.operator === "not") {
        await this.wrapError(
          () => this.validateEntitySetFilter(entityType, filter.expr, filterParams),
          ".expr",
        );
      } else {
        await this.wrapError(
          () => this.validateEntitySetFilter(entityType, filter.left, filterParams),
          ".left",
        );
        await this.wrapError(
          () => this.validateEntitySetFilter(entityType, filter.right, filterParams),
          ".right",
        );
      }
    } else if ("function" in filter) {
      for (const arg of filter.args) {
        const index = filter.args.indexOf(arg);
        await this.wrapError(
          () => this.validateEntitySetFilter(entityType, arg, filterParams),
          `.args[${index}]`,
        );
      }
    } else if (filter.type === "property") {
      await this.wrapError(() => {
        assert(
          this.fieldExists(entityType, filter.name),
          `Field ${filter.name} does not exist in entity type ${entityType._attributes.Name}`,
        );
      }, ".name");
    } else if (filter.type === "literal") {
      if (filter.value.startsWith("'{{") && filter.value.endsWith("}}'")) {
        const param = filter.value.slice(3, -3);
        await this.wrapError(() => {
          assert(
            isNonNullish(filterParams?.[param]),
            `literal ${filter.value} is not defined in filterParams`,
          );
        }, ".value");
      } else {
        // do nothing
      }
    } else {
      never("Unimplemented filter node");
    }
  }

  private async validateEntitySetOrderBy(
    entityType: MetadataElement,
    orderBy: SapEntitySetOrderBy,
  ) {
    for (const order of orderBy) {
      const index = orderBy.indexOf(order);
      const [field, _] = order;
      await this.wrapError(() => {
        assert(
          this.fieldExists(entityType, field),
          `Field "${field}" does not exist in entity type ${entityType._attributes.Name}`,
        );
      }, `[${index}][0]`);
    }
  }

  private async validatePollingLastChangeStrategy(
    entityType: MetadataElement,
    strategy: SapPollingLastChangeStrategy,
  ) {
    if (strategy.type === "DATETIME_TIME") {
      const [dateField, timeField] = strategy.fields;
      await this.wrapError(() => {
        assert(
          this.fieldExists(entityType, dateField, "Edm.DateTime"),
          `Invalid DateTime field "${dateField}" used as first field of a DATETIME_TIME SapPollingLastChangeStrategy`,
        );
      }, ".fields[0]");

      await this.wrapError(() => {
        assert(
          this.fieldExists(entityType, timeField, "Edm.Time"),
          `Invalid Time field "${timeField}" used as second field of a DATETIME_TIME SapPollingLastChangeStrategy`,
        );
      }, ".fields[1]");
    } else if (strategy.type === "DATETIME" || strategy.type === "DATETIME_OFFSET") {
      const datetimeField = strategy.field;
      await this.wrapError(() => {
        assert(
          this.fieldExists(entityType, datetimeField, ["Edm.DateTime", "Edm.DateTimeOffset"]),
          `Invalid DateTime field "${datetimeField}" used in ${strategy.type} SapPollingLastChangeStrategy`,
        );
      }, ".field");
    } else {
      never(`Unimplemented polling last change strategy`);
    }
  }

  private async validateFieldMapping(
    profileTypeId: number,
    entityType: MetadataElement,
    fieldMapping: SapEntityFieldMapping,
  ) {
    for (const field of fieldMapping.remoteEntityFields) {
      const index = fieldMapping.remoteEntityFields.indexOf(field);
      await this.wrapError(() => {
        const fieldType = this.findEntityTypeField(entityType, field);
        assert(
          isNonNullish(fieldType),
          `Field "${field}" does not exist in entity type ${entityType._attributes.Name}`,
        );
        if (fieldMapping.direction === "TO_REMOTE" || fieldMapping.direction === "BOTH") {
          assert(
            fieldType._attributes["sap:updatable"] !== "false",
            `Field "${field}" is not updatable in entity type ${entityType._attributes.Name}`,
          );
        }
      }, `.remoteEntityFields[${index}]`);
    }

    const profileTypeFields = await this.profiles.loadProfileTypeField(
      fieldMapping.profileTypeFieldIds,
    );
    for (const fieldId of fieldMapping.profileTypeFieldIds) {
      const index = fieldMapping.profileTypeFieldIds.indexOf(fieldId);
      await this.wrapError(() => {
        const profileTypeField = profileTypeFields.find((f) => f?.id === fieldId);
        assert(isNonNullish(profileTypeField), `Field with id "${fieldId}" not found`);
        assert(
          profileTypeField.profile_type_id === profileTypeId,
          `Field with id "${fieldId}" has incorrect profile type id`,
        );
        assert(
          this.allowedFieldTypes.includes(profileTypeField.type),
          `Field with id "${fieldId}" has invalid type`,
        );
      }, `.profileTypeFieldIds[${index}]`);
    }

    for (const transform of fieldMapping.toLocalTransforms ?? []) {
      const transformIndex = fieldMapping.toLocalTransforms!.indexOf(transform);
      await this.wrapError(
        () => this.validateFieldTransform(transform),
        `.toLocalTransforms[${transformIndex}]`,
      );
    }

    for (const transform of fieldMapping.toRemoteTransforms ?? []) {
      const transformIndex = fieldMapping.toRemoteTransforms!.indexOf(transform);
      await this.wrapError(
        () => this.validateFieldTransform(transform),
        `.toRemoteTransforms[${transformIndex}]`,
      );
    }
  }

  private async validateRelationshipMapping(
    settings: SapProfileSyncIntegrationSettings,
    parentProfileTypeId: number,
    parentEntityDefinition: SapEntityDefinition,
    parentEntityType: MetadataElement,
    { name, fetchStrategy, syncStrategy }: SapEntityRelationshipMapping,
  ) {
    const metadata = await this.fetchMetadata(settings, fetchStrategy.entityDefinition.servicePath);
    const entityType = await this.findEntityType(metadata, fetchStrategy.entityDefinition);

    await this.wrapError(async () => {
      if (syncStrategy.type === "EMBED_INTO_PARENT") {
        for (const [index, fieldMapping] of Object.entries(syncStrategy.fieldMappings ?? [])) {
          await this.wrapError(
            () => this.validateFieldMapping(parentProfileTypeId, entityType, fieldMapping),
            `.fieldMappings[${index}]`,
          );
        }
        for (const [index, childRelationshipMapping] of Object.entries(
          syncStrategy.relationshipMappings ?? [],
        )) {
          await this.wrapError(
            () =>
              this.validateRelationshipMapping(
                settings,
                parentProfileTypeId,
                fetchStrategy.entityDefinition,
                entityType,
                childRelationshipMapping,
              ),
            `.relationshipMappings[${index}]`,
          );
        }
        for (const [index, field] of Object.entries(
          syncStrategy.multipleCardinalitySelectorDependencies ?? [],
        )) {
          await this.wrapError(() => {
            assert(
              this.fieldExists(entityType, field),
              `Field "${field}" does not exist in entity type ${entityType._attributes.Name}`,
            );
          }, `.multipleCardinalitySelectorDependencies[${index}]`);
        }
      } else if (syncStrategy.type === "REPLICATE_RELATIONSHIP") {
        const mapping = settings.mappings[syncStrategy.entityMappingIndex];
        await this.wrapError(() => {
          assert(isNonNullish(mapping), `Invalid value`);
        }, ".entityMappingIndex");

        await this.validateAllowedRelationship(
          parentProfileTypeId,
          mapping.profileTypeId,
          syncStrategy,
        );
      } else {
        never("Unimplemented sync strategy");
      }
    }, ".syncStrategy");

    await this.wrapError(async () => {
      if (fetchStrategy.type === "FROM_NAVIGATION_PROPERTY") {
        assert(
          parentEntityDefinition.serviceNamespace ===
            fetchStrategy.entityDefinition.serviceNamespace,
          `Invalid "FROM_NAVIGATION_PROPERTY" fetch strategy in relationship mapping "${name}". Service name mismatch (Parent: "${parentEntityDefinition.serviceNamespace}", Relationship: "${fetchStrategy.entityDefinition.serviceNamespace}")`,
        );

        await this.validateRelationshipFetchStrategyFromNavigationProperty(
          metadata,
          parentEntityType,
          entityType,
          fetchStrategy,
        );
      } else if (fetchStrategy.type === "FROM_ENTITY_SET") {
        await this.validateRelationshipFetchStrategyFromEntitySet(
          metadata,
          parentEntityType,
          entityType,
          fetchStrategy,
        );
      } else if (fetchStrategy.type === "FROM_ENTITY") {
        await this.validateRelationshipFetchStrategyFromEntity(
          metadata,
          parentEntityType,
          entityType,
          fetchStrategy,
        );
      } else {
        never("Unimplemented fetch strategy");
      }
    }, ".fetchStrategy");
  }

  private async validateRelationshipFetchStrategyFromNavigationProperty(
    metadata: MetadataElement,
    parentEntityType: MetadataElement,
    entityType: MetadataElement,
    fetchStrategy: SapEntityRelationshipFetchFromNavigationProperty,
  ) {
    if (isNonNullish(fetchStrategy.filter)) {
      await this.wrapError(
        () =>
          this.validateEntitySetFilter(
            entityType,
            fetchStrategy.filter!,
            fetchStrategy.filterParams,
          ),
        `.filter`,
      );
    }
    if (isNonNullish(fetchStrategy.orderBy)) {
      await this.wrapError(
        () => this.validateEntitySetOrderBy(entityType, fetchStrategy.orderBy!),
        `.orderBy`,
      );
    }

    for (const [key, param] of Object.entries(fetchStrategy.filterParams ?? {})) {
      for (const field of param.entityFields) {
        const index = param.entityFields.indexOf(field);
        await this.wrapError(() => {
          const fieldType = this.findEntityTypeField(parentEntityType, field);
          assert(
            isNonNullish(fieldType),
            `Field "${field}" does not exist in entity type ${parentEntityType._attributes.Name}`,
          );
        }, `.filterParams.${key}.entityFields[${index}]`);
      }

      for (const transform of param.transforms ?? []) {
        const index = param.transforms!.indexOf(transform);
        await this.wrapError(
          () => this.validateFieldTransform(transform),
          `.filterParams.${key}.transforms[${index}]`,
        );
      }
    }

    const navigationProperty = parentEntityType["NavigationProperty"].find(
      (np) => np._attributes.Name === fetchStrategy.navigationProperty,
    );
    let association: MetadataElement | undefined;
    await this.wrapError(() => {
      assert(
        isNonNullish(navigationProperty),
        `Navigation property "${fetchStrategy.navigationProperty}" not found in entity type ${parentEntityType._attributes.Name}`,
      );
      association = this.findAssociation(metadata, navigationProperty!._attributes.Relationship);
    }, `.navigationProperty`);

    assert(isNonNullish(association), "");

    const [_, toEnd] = association["End"];
    await this.wrapError(() => {
      // fromEnd is implicitly validated since we accessed via a navigation property
      const serviceNamespace = fetchStrategy.entityDefinition.serviceNamespace;
      assert(
        toEnd._attributes.Type === `${serviceNamespace}.${entityType._attributes.Name}`,
        `Invalid entity type definition in navigation property "${fetchStrategy.navigationProperty}" for type "${parentEntityType._attributes.Name}" (Expected: "${serviceNamespace}.${entityType._attributes.Name}", Actual: "${toEnd._attributes.Type}")`,
      );
    }, ".entityDefinition");

    await this.wrapError(() => {
      const associationCardinality = toEnd._attributes.Multiplicity === "*" ? "MANY" : "ONE";
      assert(
        fetchStrategy.expectedCardinality === associationCardinality,
        `Invalid multiplicity in navigation property "${fetchStrategy.navigationProperty}" for type "${parentEntityType._attributes.Name}" (Expected: "${fetchStrategy.expectedCardinality}", Actual: "${associationCardinality}")`,
      );
    }, `.expectedCardinality`);
  }

  private async validateRelationshipFetchStrategyFromEntitySet(
    metadata: MetadataElement,
    parentEntityType: MetadataElement,
    entityType: MetadataElement,
    fetchStrategy: SapEntityRelationshipFetchFromEntitySet,
  ) {
    if (isNonNullish(fetchStrategy.filter)) {
      await this.wrapError(
        () =>
          this.validateEntitySetFilter(
            entityType,
            fetchStrategy.filter!,
            fetchStrategy.filterParams,
          ),
        `.filter`,
      );
    }

    if (isNonNullish(fetchStrategy.orderBy)) {
      await this.wrapError(
        () => this.validateEntitySetOrderBy(entityType, fetchStrategy.orderBy!),
        `.orderBy`,
      );
    }

    for (const [key, param] of Object.entries(fetchStrategy.filterParams ?? {})) {
      for (const field of param.entityFields) {
        const index = param.entityFields.indexOf(field);
        await this.wrapError(() => {
          const fieldType = this.findEntityTypeField(parentEntityType, field);
          assert(
            isNonNullish(fieldType),
            `Field "${field}" does not exist in entity type ${parentEntityType._attributes.Name}`,
          );
        }, `.filterParams.${key}.entityFields[${index}]`);
      }

      for (const transform of param.transforms ?? []) {
        const index = param.transforms!.indexOf(transform);
        await this.wrapError(
          () => this.validateFieldTransform(transform),
          `.filterParams.${key}.transforms[${index}]`,
        );
      }
    }

    await this.wrapError(
      () => this.findEntityType(metadata, fetchStrategy.entityDefinition),
      ".entityDefinition",
    );
  }

  private async validateRelationshipFetchStrategyFromEntity(
    metadata: MetadataElement,
    parentEntityType: MetadataElement,
    entityType: MetadataElement,
    fetchStrategy: SapEntityRelationshipFetchFromEntity,
  ) {
    await this.wrapError(
      () => this.findEntityType(metadata, fetchStrategy.entityDefinition),
      ".entityDefinition",
    );

    await this.wrapError(() => {
      const entityTypeKeys = entityType["Key"][0]["PropertyRef"]
        .map((k) => k._attributes.Name)
        .toSorted();
      const keys = Object.keys(fetchStrategy.key).toSorted();
      assert(
        isDeepStrictEqual(entityTypeKeys, keys),
        `Keys must match the remote entity key (Expected: ${entityTypeKeys.join(", ")}. Actual: ${keys.join(", ")})`,
      );
    }, ".key");

    for (const entry of Object.entries(fetchStrategy.key)) {
      const [key, param] = entry;
      for (const field of param.entityFields) {
        const fieldIndex = param.entityFields.indexOf(field);
        const fieldType = this.findEntityTypeField(parentEntityType, field);
        await this.wrapError(() => {
          assert(
            isNonNullish(fieldType),
            `Field "${field}" does not exist in entity type ${parentEntityType._attributes.Name}`,
          );
        }, `.key.${key}.entityFields[${fieldIndex}]`);
      }
    }
  }

  private async validateRemoteEntityKeyBinding(
    profileTypeId: number,
    remoteEntityKeyBinding: SapRemoteEntityKeyBinding,
  ) {
    const profileTypeFields = await this.profiles.loadProfileTypeField(
      remoteEntityKeyBinding.profileTypeFieldIds,
    );
    for (const remoteEntityFieldId of remoteEntityKeyBinding.profileTypeFieldIds) {
      const index = remoteEntityKeyBinding.profileTypeFieldIds.indexOf(remoteEntityFieldId);
      await this.wrapError(() => {
        const remoteEntityField = profileTypeFields.find((f) => f?.id === remoteEntityFieldId);
        assert(isNonNullish(remoteEntityField), `Field with id "${remoteEntityFieldId}" not found`);
        assert(
          remoteEntityField.profile_type_id === profileTypeId,
          `Field with id "${remoteEntityFieldId}" has incorrect profile type id`,
        );
        assert(
          this.allowedFieldTypes.includes(remoteEntityField.type),
          `Field with id "${remoteEntityFieldId}" has invalid type`,
        );
        if (index === 0 && profileTypeFields.length === 1) {
          assert(
            remoteEntityField.is_unique,
            `Field with id "${remoteEntityFieldId}" must be unique`,
          );
        }
      }, `.profileTypeFieldIds[${index}]`);
    }
  }

  private async validateAllowedRelationship(
    parentProfileTypeId: number,
    profileTypeId: number,
    {
      parentProfileRelationshipSide,
      profileRelationshipTypeId,
    }: SapEntityRelationshipSyncStrategyReplicateRelationship,
  ) {
    const parentProfileType = await this.profiles.loadProfileType(parentProfileTypeId);

    const allowedRelationships =
      await this.profiles.loadProfileRelationshipTypeAllowedProfileTypesByProfileRelationshipTypeId(
        { profileRelationshipTypeId, orgId: parentProfileType!.org_id },
      );

    const allowedLeftRight = allowedRelationships.find(
      (r) =>
        r.direction === "LEFT_RIGHT" &&
        r.allowed_profile_type_id ===
          (parentProfileRelationshipSide === "LEFT" ? parentProfileTypeId : profileTypeId),
    );
    const allowedRightLeft = allowedRelationships.find(
      (r) =>
        r.direction === "RIGHT_LEFT" &&
        r.allowed_profile_type_id ===
          (parentProfileRelationshipSide === "LEFT" ? profileTypeId : parentProfileTypeId),
    );

    assert(
      isNonNullish(allowedLeftRight) || isNonNullish(allowedRightLeft),
      `No allowed relationship found for relationship type "${profileRelationshipTypeId}" where LEFT PT: ${parentProfileRelationshipSide === "LEFT" ? parentProfileTypeId : profileTypeId} and RIGHT PT: ${parentProfileRelationshipSide === "LEFT" ? profileTypeId : parentProfileTypeId}`,
    );
  }

  private async validateFieldTransform(transform: SapFieldTransform) {
    await this.wrapError(() => {
      assert(
        isNonNullish(SAP_FIELD_TRANSFORMS[transform.type as keyof typeof SAP_FIELD_TRANSFORMS]),
        `Transform "${transform.type}" is not defined`,
      );
    }, ".type");
  }

  private async validateProfileFilter(profileTypeId: number, filter: ProfileQueryFilter) {
    const fields = await this.profiles.loadProfileTypeFieldsByProfileTypeId(profileTypeId);
    if ("conditions" in filter) {
      await this.wrapError(() => {
        assert(filter.conditions.length >= 1, "Filter must have at least one condition");
      }, ".conditions");

      for (const condition of filter.conditions) {
        const index = filter.conditions.indexOf(condition);
        await this.wrapError(
          () => this.validateProfileFilter(profileTypeId, condition),
          `.conditions[${index}]`,
        );
      }
    } else if ("profileTypeFieldId" in filter) {
      const field = fields.find((f) => f.id === filter.profileTypeFieldId);
      await this.wrapError(() => {
        assert(isNonNullish(field), `Field not found`);
        assert(
          this.allowedFieldTypes.includes(field.type),
          `Field with id "${field.id}" has invalid type`,
        );
      }, ".profileTypeFieldId");
    }
  }

  private fieldExists(entityType: MetadataElement, field: string, type?: MaybeArray<string>) {
    const fieldType = this.findEntityTypeField(entityType, field);
    return (
      isNonNullish(fieldType) &&
      (isNullish(type) || unMaybeArray(type).includes(fieldType._attributes.Type))
    );
  }

  private findEntityTypeField(entityType: MetadataElement, field: string) {
    return entityType["Property"].find((p) => p._attributes.Name === field);
  }

  private async findEntityType(
    metadata: MetadataElement,
    { serviceNamespace, entitySetName, remoteEntityKey }: SapEntityDefinition,
  ) {
    const schema = metadata["edmx:Edmx"][0]["edmx:DataServices"][0]["Schema"][0];
    await this.wrapError(() => {
      assert(
        schema._attributes.Namespace === serviceNamespace,
        `Schema namespace mismatch (Expected: "${serviceNamespace}", Actual: "${schema._attributes.Namespace}")`,
      );
    }, "serviceNamespace");

    let entityType: MetadataElement | undefined;
    await this.wrapError(() => {
      const entitySet = schema["EntityContainer"]
        .flatMap((ec) => ec["EntitySet"])
        .find((es) => es._attributes["Name"] === entitySetName);
      assert(isNonNullish(entitySet), `Entity set "${entitySetName}" should exist`);

      const entityTypeName = entitySet._attributes["EntityType"].replace(
        `${serviceNamespace}.`,
        "",
      );
      entityType = schema["EntityType"].find((et) => et._attributes.Name === entityTypeName);
      assert(isNonNullish(entityType), `Entity type for entity set "${entitySetName}" not found`);
      assert(
        entityType["Key"].length === 1,
        `Entity type for entity set "${entitySetName}" must have a single key`,
      );
    }, "entitySetName");

    await this.wrapError(() => {
      const keys = entityType!["Key"][0]["PropertyRef"].map((k) => k._attributes.Name);
      const _remoteEntityKey = remoteEntityKey.map((k) => (typeof k === "string" ? k : k.name));
      assert(
        isDeepStrictEqual(keys.toSorted(), _remoteEntityKey.toSorted()),
        `Keys must match the remote entity key for entity set "${entitySetName}" (Expected: ${_remoteEntityKey.join(
          ", ",
        )}, Actual: ${keys.join(", ")})`,
      );
    }, "remoteEntityKey");

    return entityType!;
  }

  private findAssociation(metadata: MetadataElement, fullAssociationName: string) {
    const parts = fullAssociationName.split(".");
    const serviceNamespace = parts.slice(0, -1).join(".");
    const associationName = parts.at(-1);
    const schema = metadata["edmx:Edmx"][0]["edmx:DataServices"][0]["Schema"][0];
    assert(
      schema._attributes.Namespace === serviceNamespace,
      `Schema namespace mismatch (Expected: "${serviceNamespace}", Actual: "${schema._attributes.Namespace}")`,
    );
    const association = schema["Association"].find((a) => a._attributes.Name === associationName);
    assert(isNonNullish(association), `Association "${associationName}" not found`);
    return association;
  }

  private cachedMetadada: Record<string, MetadataElement> = {};
  private async fetchMetadata(settings: SapProfileSyncIntegrationSettings, servicePath: string) {
    if (this.cachedMetadada[servicePath]) {
      return this.cachedMetadada[servicePath];
    }

    using client = this.sapOdataClientFactory(
      this.loggerFactory("SapProfileSyncIntegrationSettingsValidator"),
      settings.baseUrl,
      settings.authorization,
      settings.additionalHeaders,
    );
    const metadata = await client.getMetadata(servicePath);

    return (this.cachedMetadada[servicePath] = xml2js(metadata, {
      compact: true,
      alwaysArray: true,
    }) as MetadataElement);
  }

  /**
   * e.g.:
   * ```ts
   * await this.wrapError(async () => {
   *   await this.wrapError(async () => {
   *     await this.wrapError(async () => {
   *       assert(profileTypeId !== null, "this condition failed");
   *     }, ".profileTypeId");
   *   }, ".mappings[0]");
   * }, "settings");
   * ```
   *
   * In this case, if the assertion fails, the error message will be:
   *
   * new SapProfileSyncSettingsValidatorError("settings.mappings[0].profileTypeId", "this condition failed")
   *
   */
  private async wrapError<T>(fn: () => MaybePromise<T>, path: string): Promise<T> {
    try {
      return await fn();
    } catch (error: unknown) {
      if (isAssertionError(error)) {
        throw new SettingsValidationError(path, getAssertionErrorMessage(error));
      } else if (error instanceof SettingsValidationError) {
        throw new SettingsValidationError(path.concat(error.path), error.message);
      } else {
        throw error;
      }
    }
  }
}
