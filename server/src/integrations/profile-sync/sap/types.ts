import { ProfileQueryFilter } from "../../../util/ProfileQueryFilter";
import { GENERIC_FIELD_TRANSFORMS } from "../common/transforms";
import { dateToSapDatetime, sapDatetimeToDate } from "./helpers";

export interface SapProfileSyncIntegrationSettings {
  baseUrl: string;
  additionalHeaders?: Record<string, string>;
  authorization: SapProfileSyncIntegrationSettingsAuthorization;
  mappings: SapEntityMapping[];
}

export type SapProfileSyncIntegrationSettingsAuthorization =
  SapProfileSyncIntegrationSettingsAuthorizationBasic;

export interface SapProfileSyncIntegrationSettingsAuthorizationBasic {
  type: "BASIC";
  user: string;
  password: string;
}

export interface SapEntityMapping {
  name?: string;
  /**
   * The entity to sync.
   */
  entityDefinition: SapEntityDefinition;
  /**
   * How to store the remote entity key in the profile for matching.
   */
  remoteEntityKeyBinding: SapRemoteEntityKeyBinding;
  /**
   * Optionally, how to bind the local profile ID to the remote entity.
   */
  localIdBinding?: SapLocalIdBinding;
  /**
   * Optional filter to apply to the entity set.
   */
  filter?: SapEntitySetFilter;
  /**
   * The profile type to use for this entity mapping in Parallel.
   */
  profileTypeId: number;
  /**
   * Optional filter to apply to the profile when matching with a mapping.
   */
  profileFilter?: ProfileQueryFilter;
  /**
   * Initial sync order by.
   */
  initialSyncOrderBy: SapEntitySetOrderBy;
  /**
   * How to detect changes in remote entities.
   */
  changeDetection: SapChangeDetectionStrategy;
  /**
   * How to map fields from the remote entity to profile fields.
   */
  fieldMappings?: SapEntityFieldMapping[];
  /**
   * How to map fields from related entities to profile fields.
   */
  relationshipMappings?: SapEntityRelationshipMapping[];
}

export interface SapEntityDefinition {
  /**
   * The path after the base URL where this entity is located.
   */
  servicePath: string;
  /**
   * The namespace of the OData service where this entity is located.
   */
  serviceNamespace: string;
  /**
   * The name of the entity set where this entity is located.
   */
  entitySetName: string;
  /**
   * The key of the remote entity.
   */
  remoteEntityKey: (string | { type: "string" | "guid"; name: string })[];
}

export interface SapRemoteEntityKeyBinding {
  profileTypeFieldIds: number[];
  toLocalTransforms?: SapFieldTransform[];
  toRemoteTransforms?: SapFieldTransform[];
}

export interface SapLocalIdBinding {
  remoteEntityFields: string[];
  toRemoteTransforms?: SapFieldTransform[];
}

export type SapChangeDetectionStrategy = SapPollingChangeDetectionStrategy;

export interface SapPollingChangeDetectionStrategy {
  type: "POLLING";
  remoteLastChange: SapPollingLastChangeStrategy;
}

export type SapPollingLastChangeStrategy =
  | SapPollingLastChangeStrategyCompositeDatetimeTime
  | SapPollingLastChangeStrategySingleDatetime;

export interface SapPollingLastChangeStrategyCompositeDatetimeTime {
  type: "DATETIME_TIME";
  fields: [string, string];
}

export interface SapPollingLastChangeStrategySingleDatetime {
  type: "DATETIME" | "DATETIME_OFFSET";
  field: string;
}

export interface SapEntityFieldMapping {
  direction: "TO_LOCAL" | "TO_REMOTE" | "BOTH";
  profileTypeFieldIds: number[];
  remoteEntityFields: string[];
  toLocalTransforms?: SapFieldTransform[];
  toRemoteTransforms?: SapFieldTransform[];
}

export type SapEntityRelationshipMapping = {
  /**
   * A name for the relationship mapping.
   */
  name?: string;
  /**
   * How and what to sync from the related entity.
   */
  syncStrategy: SapEntityRelationshipSyncStrategy;
  /**
   * How to fetch the related entities.
   */
  fetchStrategy: SapEntityRelationshipFetchStrategy;
};

export type SapEntityRelationshipSyncStrategy =
  | SapEntityRelationshipSyncStrategyEmbedIntoParent
  | SapEntityRelationshipSyncStrategyReplicateRelationship;

export interface SapEntityRelationshipSyncStrategyEmbedIntoParent {
  type: "EMBED_INTO_PARENT";
  /**
   * How to map fields from the remote entity to profile fields.
   */
  fieldMappings?: SapEntityFieldMapping[];
  /**
   * How to map fields from related entities to profile fields.
   */
  relationshipMappings?: SapEntityRelationshipMapping[];
  /**
   * JSONPath expression to select which item to embed when fetchStrategy returns multiple items.
   * Defaults to first item. Example: "$[?(@.IsDefault == true)]"
   */
  multipleCardinalitySelector?: string;
  /**
   * Fields needed for the multipleCardinalitySelector to work.
   */
  multipleCardinalitySelectorDependencies?: string[];
}

export type MissingRemoteRelationshipStrategy = "IGNORE" | "DELETE_RELATIONSHIP";

export interface SapEntityRelationshipSyncStrategyReplicateRelationship {
  type: "REPLICATE_RELATIONSHIP";
  /**
   * The profile relationship type to use for the relationship.
   */
  profileRelationshipTypeId: number;
  /**
   * The side of the parent profile that this relationship is on.
   */
  parentProfileRelationshipSide: "LEFT" | "RIGHT";
  /**
   * The entity mapping for the entity that is being replicated.
   */
  entityMappingIndex: number;
  /**
   * What to do if the remote relationship is missing.
   * - IGNORE: Do nothing, Maintain the relationship in the local profile.
   * - DELETE_RELATIONSHIP: Delete the relationship in the local profile.
   */
  missingRemoteRelationshipStrategy: MissingRemoteRelationshipStrategy;
}

export type SapEntityRelationshipFetchStrategy =
  | SapEntityRelationshipFetchFromEntitySet
  | SapEntityRelationshipFetchFromEntity
  | SapEntityRelationshipFetchFromNavigationProperty;

export interface SapEntityRelationshipFetchFromEntitySet {
  type: "FROM_ENTITY_SET";
  entityDefinition: SapEntityDefinition;
  filter?: SapEntitySetFilter;
  orderBy?: SapEntitySetOrderBy;
  /**
   * These params will be replaced in the generated $filter.
   */
  filterParams?: Record<string, SapEntityFieldReference>;
}

export interface SapEntityFieldReference {
  entityFields: string[];
  transforms?: SapFieldTransform[];
}

export interface SapEntityRelationshipFetchFromEntity {
  type: "FROM_ENTITY";
  entityDefinition: SapEntityDefinition;
  key: Record<string, SapEntityFieldReference>;
}

export interface SapEntityRelationshipFetchFromNavigationProperty {
  type: "FROM_NAVIGATION_PROPERTY";
  expectedCardinality: "ONE" | "MANY";
  navigationProperty: string;
  entityDefinition: SapEntityDefinition;
  filter?: SapEntitySetFilter;
  /**
   * When embedding into parent, ensure order of the related entities because only the first entity will be synced.
   */
  orderBy?: SapEntitySetOrderBy;
  /**
   * These params will be replaced in the generated $filter.
   */
  filterParams?: Record<string, SapEntityFieldReference>;
}

export type SapEntitySetOrderBy = [string, "asc" | "desc"][];
export type SapEntitySetFilter = SapEntitySetFilterRootExpression;

export type SapEntitySetFilterRootExpression =
  | SapEntitySetFilterGroup
  | SapEntitySetFilterUnaryNode
  | SapEntitySetFilterBinaryNode;

export type SapEntitySetFilterExpression =
  | SapEntitySetFilterRootExpression
  | SapEntitySetFilterFunctionCall
  | SapEntitySetFilterLeaf;

export interface SapEntitySetFilterUnaryNode {
  operator: "not";
  expr: SapEntitySetFilterRootExpression | SapEntitySetFilterFunctionCall;
}

export interface SapEntitySetFilterBinaryNode {
  operator: "eq" | "ne" | "gt" | "ge" | "lt" | "le" | "like" | "in";
  left: SapEntitySetFilterFunctionCall | SapEntitySetFilterLeaf;
  right: SapEntitySetFilterFunctionCall | SapEntitySetFilterLeaf;
}

export interface SapEntitySetFilterGroup {
  conditions: SapEntitySetFilterRootExpression[];
  operator: "and" | "or";
}

export interface SapEntitySetFilterFunctionCall {
  function:
    | "tolower"
    | "toupper"
    | "trim"
    | "length"
    | "year"
    | "month"
    | "day"
    | "hour"
    | "minute"
    | "second"
    | "startswith"
    | "endswith"
    | "substringof";
  args: SapEntitySetFilterLeaf[];
}

export type SapEntitySetFilterLeaf = SapEntitySetFilterProperty | SapEntitySetFilterLiteral;

export interface SapEntitySetFilterProperty {
  type: "property";
  name: string;
}

export interface SapEntitySetFilterLiteral {
  type: "literal";
  value: string;
}

export type SapFieldTransform = { type: string; [options: string]: any };

export const SAP_FIELD_TRANSFORMS = {
  ...GENERIC_FIELD_TRANSFORMS,
  SAP_DATETIME_TO_DATE: {
    handler: (value: any[]) =>
      value.map((v) => {
        if (typeof v === "string") {
          const value = sapDatetimeToDate(v);
          if (Number.isNaN(value.valueOf())) {
            return undefined;
          }
          return value.toISOString().replace(/T.*/, "");
        } else {
          return undefined;
        }
      }),
  },
  DATE_TO_SAP_DATETIME: {
    handler: (value: any[]) =>
      value.map((v) =>
        typeof v === "string" || typeof v === "number" ? dateToSapDatetime(new Date(v)) : undefined,
      ),
  },
};
