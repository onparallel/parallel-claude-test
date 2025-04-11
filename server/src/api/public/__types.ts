import type { Duration } from "date-fns";
import type { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
import gql from "graphql-tag";
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = {
  [_ in K]?: never;
};
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  /** A date string, such as 2007-12-03, compliant with the `full-date` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  Date: { input: string; output: string };
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: { input: string; output: string };
  Duration: { input: Duration; output: Duration };
  GID: { input: string; output: string };
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any };
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: { input: { [key: string]: any }; output: { [key: string]: any } };
  LocalizableUserText: {
    input: { [locale in UserLocale]?: string };
    output: { [locale in UserLocale]?: string };
  };
  /** The `Upload` scalar type represents a file upload. */
  Upload: { input: any; output: any };
};

/** JSON with AWS S3 url and required form data to make a POST request */
export type AWSPresignedPostData = {
  fields: Scalars["JSONObject"]["output"];
  url: Scalars["String"]["output"];
};

export type AccessActivatedEvent = PetitionEvent & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type AccessActivatedFromPublicPetitionLinkEvent = PetitionEvent & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
};

export type AccessActivatedFromPublicPetitionLinkUserNotification = PetitionUserNotification & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  isRead: Scalars["Boolean"]["output"];
  petition: PetitionBase;
};

export type AccessDeactivatedEvent = PetitionEvent & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  reason: Scalars["String"]["output"];
  type: PetitionEventType;
  user: Maybe<User>;
};

export type AccessDelegatedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  newAccess: PetitionAccess;
  originalAccess: PetitionAccess;
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
};

export type AccessOpenedEvent = PetitionEvent & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
};

export type AiCompletionLog = Timestamps & {
  completion: Maybe<Scalars["String"]["output"]>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  status: AiCompletionLogStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
};

export type AiCompletionLogStatus = "COMPLETED" | "FAILED" | "PENDING";

export type ApprovalFlowConfig = {
  /** List of users that are assigned to approve this step. */
  approvers: Array<Maybe<User>>;
  name: Scalars["String"]["output"];
  type: ApprovalFlowType;
  /** User or UserGroup GID */
  values: Array<Scalars["ID"]["output"]>;
  visibility: Maybe<Scalars["JSONObject"]["output"]>;
};

export type ApprovalFlowConfigInput = {
  name: Scalars["String"]["input"];
  type: ApprovalFlowType;
  /** User or UserGroup GID */
  values: Array<Scalars["ID"]["input"]>;
  visibility?: InputMaybe<Scalars["JSONObject"]["input"]>;
};

export type ApprovalFlowType = "ALL" | "ANY";

export type ArchiveFieldGroupReplyIntoProfileConflictResolutionAction =
  | "APPEND"
  | "IGNORE"
  | "OVERWRITE";

/** Action to take when the selected profile already has a value on the field. An error will be thrown if no conflictResolution is provided for a field with a value. */
export type ArchiveFieldGroupReplyIntoProfileConflictResolutionInput = {
  action: ArchiveFieldGroupReplyIntoProfileConflictResolutionAction;
  profileTypeFieldId: Scalars["GID"]["input"];
};

export type ArchiveFieldGroupReplyIntoProfileExpirationInput = {
  expiryDate?: InputMaybe<Scalars["Date"]["input"]>;
  profileTypeFieldId: Scalars["GID"]["input"];
};

export type AsyncFieldCompletionResponse = {
  type: Scalars["String"]["output"];
  url: Scalars["String"]["output"];
};

/** The automatic numbering settings of a petition */
export type AutomaticNumberingConfig = {
  numberingType: AutomaticNumberingType;
};

/** The automatic numbering settings of a petition */
export type AutomaticNumberingConfigInput = {
  numberingType: AutomaticNumberingType;
};

/** The type of a automatic numbering */
export type AutomaticNumberingType = "LETTERS" | "NUMBERS" | "ROMAN_NUMERALS";

export type BackgroundCheckEntityDetails = {
  createdAt: Maybe<Scalars["DateTime"]["output"]>;
  id: Scalars["String"]["output"];
  name: Scalars["String"]["output"];
  type: Scalars["String"]["output"];
};

export type BackgroundCheckEntityDetailsCompany = BackgroundCheckEntityDetails & {
  createdAt: Maybe<Scalars["DateTime"]["output"]>;
  id: Scalars["String"]["output"];
  name: Scalars["String"]["output"];
  properties: BackgroundCheckEntityDetailsCompanyProperties;
  type: Scalars["String"]["output"];
};

export type BackgroundCheckEntityDetailsCompanyProperties = {
  address: Maybe<Array<Scalars["String"]["output"]>>;
  alias: Maybe<Array<Scalars["String"]["output"]>>;
  dateOfRegistration: Maybe<Array<Scalars["String"]["output"]>>;
  jurisdiction: Maybe<Array<Scalars["String"]["output"]>>;
  name: Maybe<Array<Scalars["String"]["output"]>>;
  relationships: Maybe<Array<BackgroundCheckEntityDetailsRelationship>>;
  sanctions: Maybe<Array<BackgroundCheckEntityDetailsSanction>>;
  topics: Maybe<Array<Scalars["String"]["output"]>>;
};

export type BackgroundCheckEntityDetailsPerson = BackgroundCheckEntityDetails & {
  createdAt: Maybe<Scalars["DateTime"]["output"]>;
  id: Scalars["String"]["output"];
  name: Scalars["String"]["output"];
  properties: BackgroundCheckEntityDetailsPersonProperties;
  type: Scalars["String"]["output"];
};

export type BackgroundCheckEntityDetailsPersonProperties = {
  alias: Maybe<Array<Scalars["String"]["output"]>>;
  birthPlace: Maybe<Array<Scalars["String"]["output"]>>;
  country: Maybe<Array<Scalars["String"]["output"]>>;
  countryOfBirth: Maybe<Array<Scalars["String"]["output"]>>;
  dateOfBirth: Maybe<Array<Scalars["String"]["output"]>>;
  education: Maybe<Array<Scalars["String"]["output"]>>;
  ethnicity: Maybe<Array<Scalars["String"]["output"]>>;
  gender: Maybe<Array<Scalars["String"]["output"]>>;
  name: Maybe<Array<Scalars["String"]["output"]>>;
  nationality: Maybe<Array<Scalars["String"]["output"]>>;
  position: Maybe<Array<Scalars["String"]["output"]>>;
  relationships: Maybe<Array<BackgroundCheckEntityDetailsRelationship>>;
  religion: Maybe<Array<Scalars["String"]["output"]>>;
  sanctions: Maybe<Array<BackgroundCheckEntityDetailsSanction>>;
  status: Maybe<Array<Scalars["String"]["output"]>>;
  topics: Maybe<Array<Scalars["String"]["output"]>>;
};

export type BackgroundCheckEntityDetailsRelationship = {
  id: Scalars["String"]["output"];
  properties: BackgroundCheckEntityDetailsRelationshipProperties;
  type: Scalars["String"]["output"];
};

export type BackgroundCheckEntityDetailsRelationshipProperties = {
  endDate: Maybe<Array<Scalars["String"]["output"]>>;
  entityA: Maybe<BackgroundCheckEntityDetails>;
  entityB: Maybe<BackgroundCheckEntityDetails>;
  relationship: Maybe<Array<Scalars["String"]["output"]>>;
  startDate: Maybe<Array<Scalars["String"]["output"]>>;
};

export type BackgroundCheckEntityDetailsSanction = {
  datasets: Maybe<Array<BackgroundCheckEntityDetailsSanctionDatasets>>;
  id: Scalars["String"]["output"];
  properties: BackgroundCheckEntityDetailsSanctionProperties;
  type: Scalars["String"]["output"];
};

export type BackgroundCheckEntityDetailsSanctionDatasets = {
  title: Scalars["String"]["output"];
};

export type BackgroundCheckEntityDetailsSanctionProperties = {
  authority: Maybe<Array<Scalars["String"]["output"]>>;
  endDate: Maybe<Array<Scalars["String"]["output"]>>;
  program: Maybe<Array<Scalars["String"]["output"]>>;
  sourceUrl: Maybe<Array<Scalars["String"]["output"]>>;
  startDate: Maybe<Array<Scalars["String"]["output"]>>;
};

export type BackgroundCheckEntitySearch = {
  createdAt: Scalars["DateTime"]["output"];
  items: Array<BackgroundCheckEntitySearchSchema>;
  totalCount: Scalars["Int"]["output"];
};

export type BackgroundCheckEntitySearchCompany = BackgroundCheckEntitySearchSchema & {
  id: Scalars["String"]["output"];
  name: Scalars["String"]["output"];
  properties: BackgroundCheckEntitySearchCompanyProperties;
  type: Scalars["String"]["output"];
};

export type BackgroundCheckEntitySearchCompanyProperties = {
  incorporationDate: Maybe<Array<Scalars["String"]["output"]>>;
  jurisdiction: Maybe<Array<Scalars["String"]["output"]>>;
  topics: Maybe<Array<Scalars["String"]["output"]>>;
};

export type BackgroundCheckEntitySearchPerson = BackgroundCheckEntitySearchSchema & {
  id: Scalars["String"]["output"];
  name: Scalars["String"]["output"];
  properties: BackgroundCheckEntitySearchPersonProperties;
  type: Scalars["String"]["output"];
};

export type BackgroundCheckEntitySearchPersonProperties = {
  birthDate: Maybe<Array<Scalars["String"]["output"]>>;
  country: Maybe<Array<Scalars["String"]["output"]>>;
  gender: Maybe<Array<Scalars["String"]["output"]>>;
  topics: Maybe<Array<Scalars["String"]["output"]>>;
};

export type BackgroundCheckEntitySearchSchema = {
  id: Scalars["String"]["output"];
  name: Scalars["String"]["output"];
  type: Scalars["String"]["output"];
};

export type BackgroundCheckEntitySearchType = "COMPANY" | "PERSON";

export type BulkCreateContactsReturnType = {
  contacts: Array<Contact>;
  errors: Maybe<Array<Scalars["JSON"]["output"]>>;
};

export type BulkSendSigningMode =
  /** Allow configured signer(s) to sign every petition on the batch */
  | "COPY_SIGNATURE_SETTINGS"
  /** Disable eSignature on every petition of this batch. */
  | "DISABLE_SIGNATURE"
  /** Let recipients of each group to choose who will sign the petitions. */
  | "LET_RECIPIENT_CHOOSE";

export type ChangePasswordResult =
  | "INCORRECT_PASSWORD"
  | "INVALID_NEW_PASSWORD"
  | "LIMIT_EXCEEDED"
  | "SUCCESS";

export type CommentCreatedUserNotification = PetitionUserNotification & {
  comment: PetitionFieldComment;
  createdAt: Scalars["DateTime"]["output"];
  field: Maybe<PetitionField>;
  id: Scalars["GID"]["output"];
  isGeneral: Scalars["Boolean"]["output"];
  isMention: Scalars["Boolean"]["output"];
  isRead: Scalars["Boolean"]["output"];
  petition: PetitionBase;
};

export type CommentDeletedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  deletedBy: Maybe<UserOrPetitionAccess>;
  field: Maybe<PetitionField>;
  id: Scalars["GID"]["output"];
  isGeneral: Scalars["Boolean"]["output"];
  isInternal: Scalars["Boolean"]["output"];
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
};

export type CommentPublishedEvent = PetitionEvent & {
  comment: Maybe<PetitionFieldComment>;
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  field: Maybe<PetitionField>;
  id: Scalars["GID"]["output"];
  isGeneral: Scalars["Boolean"]["output"];
  isInternal: Scalars["Boolean"]["output"];
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
};

/** Information from the connection. */
export type ConnectionMetadata = {
  browserName: Maybe<Scalars["String"]["output"]>;
  browserVersion: Maybe<Scalars["String"]["output"]>;
  country: Maybe<Scalars["String"]["output"]>;
  deviceType: Maybe<Scalars["String"]["output"]>;
  ip: Maybe<Scalars["String"]["output"]>;
};

/** A contact in the system. */
export type Contact = Timestamps & {
  /** The petition accesses for this contact */
  accesses: PetitionAccessPagination;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  /** The email of the contact. */
  email: Scalars["String"]["output"];
  /** The first name of the contact. */
  firstName: Scalars["String"]["output"];
  /** The full name of the contact. */
  fullName: Scalars["String"]["output"];
  hasBouncedEmail: Scalars["Boolean"]["output"];
  /** The ID of the contact. */
  id: Scalars["GID"]["output"];
  /** The last name of the contact. */
  lastName: Maybe<Scalars["String"]["output"]>;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
};

/** A contact in the system. */
export type ContactaccessesArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ContactPagination = {
  /** The requested slice of items. */
  items: Array<Contact>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type ContactlessAccessUsedEvent = PetitionEvent & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
};

export type CreateContactInput = {
  email: Scalars["String"]["input"];
  firstName: Scalars["String"]["input"];
  lastName?: InputMaybe<Scalars["String"]["input"]>;
};

export type CreatePetitionButtonDashboardModuleSettingsInput = {
  buttonLabel: Scalars["String"]["input"];
  templateId: Scalars["GID"]["input"];
};

export type CreatePetitionFieldInput = {
  isInternal?: InputMaybe<Scalars["Boolean"]["input"]>;
  multiple?: InputMaybe<Scalars["Boolean"]["input"]>;
  options?: InputMaybe<Scalars["JSONObject"]["input"]>;
};

export type CreatePetitionFieldReplyInput = {
  content?: InputMaybe<Scalars["JSON"]["input"]>;
  id: Scalars["GID"]["input"];
  parentReplyId?: InputMaybe<Scalars["GID"]["input"]>;
};

/** Fields to prefill into the petition. petitionFieldId must correspond to a FIELD_GROUP in the template, linked to the same profile type as the provided profileIds. */
export type CreatePetitionFromProfilePrefillInput = {
  /** ID of the FIELD_GROUP field to prefill into */
  petitionFieldId: Scalars["GID"]["input"];
  /** ID of the profile to prefill into the field. IDs must all belong to the same profile type as the FIELD_GROUP, and can be the main profile or any of its associated profiles */
  profileIds: Array<Scalars["GID"]["input"]>;
};

export type CreatePetitionVariableInput = {
  defaultValue: Scalars["Float"]["input"];
  name: Scalars["String"]["input"];
};

export type CreateProfileRelationshipInput = {
  direction: ProfileRelationshipDirection;
  profileId: Scalars["GID"]["input"];
  profileRelationshipTypeId: Scalars["GID"]["input"];
};

export type CreateProfileTypeFieldInput = {
  alias?: InputMaybe<Scalars["String"]["input"]>;
  expiryAlertAheadTime?: InputMaybe<Scalars["Duration"]["input"]>;
  isExpirable?: InputMaybe<Scalars["Boolean"]["input"]>;
  name: Scalars["LocalizableUserText"]["input"];
  options?: InputMaybe<Scalars["JSONObject"]["input"]>;
  type: ProfileTypeFieldType;
};

export type CreatedAt = {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
};

export type Dashboard = {
  id: Scalars["GID"]["output"];
  isDefault: Scalars["Boolean"]["output"];
  isRefreshing: Scalars["Boolean"]["output"];
  lastRefreshAt: Maybe<Scalars["DateTime"]["output"]>;
  modules: Array<DashboardModule>;
  name: Scalars["String"]["output"];
};

export type DashboardCreatePetitionButtonModule = DashboardModule & {
  id: Scalars["GID"]["output"];
  settings: DashboardCreatePetitionButtonModuleSettings;
  size: DashboardModuleSize;
  title: Maybe<Scalars["String"]["output"]>;
};

export type DashboardCreatePetitionButtonModuleSettings = {
  label: Scalars["String"]["output"];
  template: Maybe<PetitionBaseMini>;
};

export type DashboardModule = {
  id: Scalars["GID"]["output"];
  size: DashboardModuleSize;
  title: Maybe<Scalars["String"]["output"]>;
};

export type DashboardModuleResultItem = {
  aggr: Maybe<Scalars["Float"]["output"]>;
  color: Maybe<Scalars["String"]["output"]>;
  count: Scalars["Int"]["output"];
  /** Label of the item, in string or LocalizableUserText format */
  label: Maybe<Scalars["JSON"]["output"]>;
};

export type DashboardModuleResultMultiItem = {
  isIncongruent: Scalars["Boolean"]["output"];
  items: Array<DashboardModuleResultItem>;
};

export type DashboardModuleSize = "LARGE" | "MEDIUM" | "SMALL";

export type DashboardPetitionsNumberModule = DashboardModule & {
  id: Scalars["GID"]["output"];
  result: Maybe<DashboardModuleResultItem>;
  size: DashboardModuleSize;
  title: Maybe<Scalars["String"]["output"]>;
};

export type DashboardPetitionsPieChartModule = DashboardModule & {
  id: Scalars["GID"]["output"];
  result: Maybe<DashboardModuleResultMultiItem>;
  settings: DashboardPetitionsPieChartModuleSettings;
  size: DashboardModuleSize;
  title: Maybe<Scalars["String"]["output"]>;
};

export type DashboardPetitionsPieChartModuleSettings = {
  graphicType: DashboardPieChartModuleSettingsType;
};

export type DashboardPetitionsRatioModule = DashboardModule & {
  id: Scalars["GID"]["output"];
  result: Maybe<DashboardModuleResultMultiItem>;
  settings: DashboardPetitionsRatioModuleSettings;
  size: DashboardModuleSize;
  title: Maybe<Scalars["String"]["output"]>;
};

export type DashboardPetitionsRatioModuleSettings = {
  graphicType: DashboardRatioModuleSettingsType;
};

export type DashboardPieChartModuleSettingsType = "DOUGHNUT" | "PIE";

export type DashboardProfilesNumberModule = DashboardModule & {
  id: Scalars["GID"]["output"];
  result: Maybe<DashboardModuleResultItem>;
  settings: DashboardProfilesNumberModuleSettings;
  size: DashboardModuleSize;
  title: Maybe<Scalars["String"]["output"]>;
};

export type DashboardProfilesNumberModuleSettings = {
  type: ModuleResultType;
};

export type DashboardProfilesPieChartModule = DashboardModule & {
  id: Scalars["GID"]["output"];
  result: Maybe<DashboardModuleResultMultiItem>;
  settings: DashboardProfilesPieChartModuleSettings;
  size: DashboardModuleSize;
  title: Maybe<Scalars["String"]["output"]>;
};

export type DashboardProfilesPieChartModuleSettings = {
  graphicType: DashboardPieChartModuleSettingsType;
  type: ModuleResultType;
};

export type DashboardProfilesRatioModule = DashboardModule & {
  id: Scalars["GID"]["output"];
  result: Maybe<DashboardModuleResultMultiItem>;
  settings: DashboardProfilesRatioModuleSettings;
  size: DashboardModuleSize;
  title: Maybe<Scalars["String"]["output"]>;
};

export type DashboardProfilesRatioModuleSettings = {
  graphicType: DashboardRatioModuleSettingsType;
  type: ModuleResultType;
};

export type DashboardRatioModuleSettingsType = "PERCENTAGE" | "RATIO";

export type DocumentProcessingType = "PAYSLIP";

export type DowJonesKycEntityDate = {
  day: Maybe<Scalars["Int"]["output"]>;
  month: Maybe<Scalars["Int"]["output"]>;
  year: Maybe<Scalars["Int"]["output"]>;
};

export type DowJonesKycEntityPlace = {
  countryCode: Scalars["String"]["output"];
  descriptor: Scalars["String"]["output"];
};

export type DowJonesKycEntityProfileResult = {
  iconHints: Array<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  profileId: Scalars["ID"]["output"];
  relationships: Array<DowJonesKycEntityRelationship>;
  sanctions: Array<DowJonesKycEntitySanction>;
  type: DowJonesKycEntityType;
  updatedAt: Scalars["DateTime"]["output"];
};

export type DowJonesKycEntityProfileResultEntity = DowJonesKycEntityProfileResult & {
  dateOfRegistration: Maybe<DowJonesKycEntityDate>;
  iconHints: Array<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  profileId: Scalars["ID"]["output"];
  relationships: Array<DowJonesKycEntityRelationship>;
  sanctions: Array<DowJonesKycEntitySanction>;
  type: DowJonesKycEntityType;
  updatedAt: Scalars["DateTime"]["output"];
};

export type DowJonesKycEntityProfileResultPerson = DowJonesKycEntityProfileResult & {
  citizenship: Maybe<DowJonesKycEntityPlace>;
  dateOfBirth: Maybe<DowJonesKycEntityDate>;
  iconHints: Array<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  isDeceased: Scalars["Boolean"]["output"];
  jurisdiction: Maybe<DowJonesKycEntityPlace>;
  name: Scalars["String"]["output"];
  placeOfBirth: Maybe<DowJonesKycEntityPlace>;
  profileId: Scalars["ID"]["output"];
  relationships: Array<DowJonesKycEntityRelationship>;
  residence: Maybe<DowJonesKycEntityPlace>;
  sanctions: Array<DowJonesKycEntitySanction>;
  type: DowJonesKycEntityType;
  updatedAt: Scalars["DateTime"]["output"];
};

export type DowJonesKycEntityRelationship = {
  connectionType: Scalars["String"]["output"];
  iconHints: Array<Scalars["String"]["output"]>;
  name: Maybe<Scalars["String"]["output"]>;
  profileId: Scalars["ID"]["output"];
  type: DowJonesKycEntityType;
};

export type DowJonesKycEntitySanction = {
  fromDate: Maybe<DowJonesKycEntityDate>;
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  sources: Array<Scalars["String"]["output"]>;
};

export type DowJonesKycEntitySearchResult = {
  countryTerritoryName: Maybe<Scalars["String"]["output"]>;
  iconHints: Array<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  isSubsidiary: Scalars["Boolean"]["output"];
  name: Scalars["String"]["output"];
  profileId: Scalars["ID"]["output"];
  title: Scalars["String"]["output"];
  type: DowJonesKycEntityType;
};

export type DowJonesKycEntitySearchResultEntity = DowJonesKycEntitySearchResult & {
  countryTerritoryName: Maybe<Scalars["String"]["output"]>;
  iconHints: Array<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  isSubsidiary: Scalars["Boolean"]["output"];
  name: Scalars["String"]["output"];
  profileId: Scalars["ID"]["output"];
  title: Scalars["String"]["output"];
  type: DowJonesKycEntityType;
};

export type DowJonesKycEntitySearchResultPagination = {
  /** The requested slice of items. */
  items: Array<DowJonesKycEntitySearchResult>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type DowJonesKycEntitySearchResultPerson = DowJonesKycEntitySearchResult & {
  countryTerritoryName: Maybe<Scalars["String"]["output"]>;
  dateOfBirth: Maybe<DowJonesKycEntityDate>;
  gender: Scalars["String"]["output"];
  iconHints: Array<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  isSubsidiary: Scalars["Boolean"]["output"];
  name: Scalars["String"]["output"];
  profileId: Scalars["ID"]["output"];
  title: Scalars["String"]["output"];
  type: DowJonesKycEntityType;
};

export type DowJonesKycEntityType = "Entity" | "Person";

export type EditProfileTypeProcessInput = {
  processName?: InputMaybe<Scalars["LocalizableUserText"]["input"]>;
  templateIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
};

/** The effective permission for a petition and user */
export type EffectivePetitionUserPermission = {
  /** wether user is subscribed or not to emails and alerts of the petition */
  isSubscribed: Scalars["Boolean"]["output"];
  /** The type of the permission. */
  permissionType: PetitionPermissionType;
  user: User;
};

export type EventSubscription = {
  eventsUrl: Scalars["String"]["output"];
  id: Scalars["GID"]["output"];
  ignoreOwnerEvents: Scalars["Boolean"]["output"];
  isEnabled: Scalars["Boolean"]["output"];
  isFailing: Scalars["Boolean"]["output"];
  name: Maybe<Scalars["String"]["output"]>;
  signatureKeys: Array<EventSubscriptionSignatureKey>;
};

export type EventSubscriptionSignatureKey = {
  id: Scalars["GID"]["output"];
  publicKey: Scalars["String"]["output"];
};

export type FeatureFlag =
  | "AUTO_ANONYMIZE"
  | "BACKGROUND_CHECK"
  | "BULK_PETITION_SEND_TASK"
  | "CLIENT_PORTAL"
  | "CREATE_PROFILE_TYPE"
  | "CUSTOM_HOST_UI"
  | "CUSTOM_PROPERTIES"
  | "DASHBOARDS"
  | "DOCUMENT_PROCESSING"
  | "DOCUSIGN_SANDBOX_PROVIDER"
  | "DOW_JONES_KYC"
  | "ES_TAX_DOCUMENTS_FIELD"
  | "EXPORT_CUATRECASAS"
  | "GHOST_LOGIN"
  | "HIDE_RECIPIENT_VIEW_CONTENTS"
  | "KEY_PROCESSES"
  | "ON_BEHALF_OF"
  | "PDF_EXPORT_V2"
  | "PERMISSION_MANAGEMENT"
  | "PETITION_ACCESS_RECIPIENT_URL_FIELD"
  | "PETITION_APPROVAL_FLOW"
  | "PETITION_SIGNATURE"
  | "PETITION_SUMMARY"
  | "PROFILES"
  | "PROFILE_SEARCH_FIELD"
  | "PUBLIC_PETITION_LINK_PREFILL_DATA"
  | "PUBLIC_PETITION_LINK_PREFILL_SECRET_UI"
  | "RECIPIENT_LANG_CA"
  | "RECIPIENT_LANG_IT"
  | "RECIPIENT_LANG_PT"
  | "REMOVE_PARALLEL_BRANDING"
  | "REMOVE_PREVIEW_FILES"
  | "REMOVE_WHY_WE_USE_PARALLEL"
  | "SETTING_DELEGATE_ACCESS"
  | "SHOW_CONTACTS_BUTTON"
  | "SKIP_FORWARD_SECURITY"
  | "TEMPLATE_REPLIES_CSV_EXPORT_TASK"
  | "TEMPLATE_REPLIES_PREVIEW_URL";

/** A feature flag name with his value */
export type FeatureFlagNameValue = {
  name: FeatureFlag;
  value: Scalars["Boolean"]["output"];
};

export type FileUpload = {
  contentType: Scalars["String"]["output"];
  filename: Scalars["String"]["output"];
  isComplete: Scalars["Boolean"]["output"];
  size: Scalars["Int"]["output"];
};

export type FileUploadDownloadLinkResult = {
  file: Maybe<FileUpload>;
  result: Result;
  url: Maybe<Scalars["String"]["output"]>;
};

export type FileUploadInput = {
  contentType: Scalars["String"]["input"];
  filename: Scalars["String"]["input"];
  size: Scalars["Int"]["input"];
};

export type FileUploadReplyResponse = {
  presignedPostData: AWSPresignedPostData;
  reply: PetitionFieldReply;
};

export type FilterSharedWithLogicalOperator = "AND" | "OR";

export type FilterSharedWithOperator =
  | "IS_OWNER"
  | "NOT_IS_OWNER"
  | "NOT_SHARED_WITH"
  | "SHARED_WITH";

export type FoldersInput = {
  folderIds: Array<Scalars["ID"]["input"]>;
  type: PetitionBaseType;
};

export type GenerateUserAuthTokenResponse = {
  apiKey: Scalars["String"]["output"];
  userAuthToken: UserAuthenticationToken;
};

export type GroupPermissionAddedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  permissionGroup: Maybe<UserGroup>;
  permissionType: PetitionPermissionType;
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type GroupPermissionEditedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  permissionGroup: Maybe<UserGroup>;
  permissionType: PetitionPermissionType;
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type GroupPermissionRemovedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  permissionGroup: Maybe<UserGroup>;
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type IOrgIntegration = {
  id: Scalars["GID"]["output"];
  invalidCredentials: Scalars["Boolean"]["output"];
  /** Wether this integration is the default to be used if the user has more than one of the same type */
  isDefault: Scalars["Boolean"]["output"];
  /** URL of the integration logo */
  logoUrl: Maybe<Scalars["String"]["output"]>;
  /** Custom name of this integration, provided by the user */
  name: Scalars["String"]["output"];
  /** The type of the integration. */
  type: IntegrationType;
};

export type IOrgIntegrationlogoUrlArgs = {
  options?: InputMaybe<ImageOptions>;
};

export type IOrgIntegrationPagination = {
  /** The requested slice of items. */
  items: Array<IOrgIntegration>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type ImageOptions = {
  resize?: InputMaybe<ImageOptionsResize>;
};

export type ImageOptionsResize = {
  fit?: InputMaybe<ImageOptionsResizeFit>;
  height?: InputMaybe<Scalars["Int"]["input"]>;
  width?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ImageOptionsResizeFit = "contain" | "cover" | "fill" | "inside" | "outside";

/** A feature flag name with his value */
export type InputFeatureFlagNameValue = {
  name: FeatureFlag;
  value: Scalars["Boolean"]["input"];
};

/** The types of integrations available. */
export type IntegrationType =
  | "AI_COMPLETION"
  | "DOCUMENT_PROCESSING"
  | "DOW_JONES_KYC"
  | "FILE_EXPORT"
  | "ID_VERIFICATION"
  | "PROFILE_EXTERNAL_SOURCE"
  | "SIGNATURE"
  | "SSO"
  | "USER_PROVISIONING";

/** A public template on landing page */
export type LandingTemplate = {
  backgroundColor: Maybe<Scalars["String"]["output"]>;
  categories: Maybe<Array<Scalars["String"]["output"]>>;
  descriptionHtml: Maybe<Scalars["String"]["output"]>;
  fieldCount: Scalars["Int"]["output"];
  fields: Array<LandingTemplateField>;
  hasConditionals: Scalars["Boolean"]["output"];
  id: Scalars["GID"]["output"];
  imageUrl: Maybe<Scalars["String"]["output"]>;
  locale: PetitionLocale;
  name: Maybe<Scalars["String"]["output"]>;
  organizationName: Scalars["String"]["output"];
  ownerAvatarUrl: Maybe<Scalars["String"]["output"]>;
  ownerFullName: Scalars["String"]["output"];
  publicLinkUrl: Maybe<Scalars["String"]["output"]>;
  shortDescription: Maybe<Scalars["String"]["output"]>;
  slug: Scalars["String"]["output"];
  updatedAt: Scalars["DateTime"]["output"];
};

/** A public template on landing page */
export type LandingTemplateimageUrlArgs = {
  small?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type LandingTemplateCategorySample = {
  category: Scalars["String"]["output"];
  templates: LandingTemplatePagination;
};

export type LandingTemplateCategorySampletemplatesArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  locale: PetitionLocale;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

/** A public template field */
export type LandingTemplateField = {
  /** The children of this field. */
  children: Maybe<Array<LandingTemplateField>>;
  id: Scalars["GID"]["output"];
  title: Maybe<Scalars["String"]["output"]>;
  type: PetitionFieldType;
};

export type LandingTemplatePagination = {
  /** The requested slice of items. */
  items: Array<LandingTemplate>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type ListView = {
  id: Scalars["GID"]["output"];
  isDefault: Scalars["Boolean"]["output"];
  name: Scalars["String"]["output"];
  type: ListViewType;
  user: User;
};

export type ListViewSortDirection = "ASC" | "DESC";

export type ListViewType = "ALL" | "CUSTOM";

/** If status is PROCESSING, task will be non-null. If status is COMPLETED, action will be already completed and task will be null. */
export type MaybeTask = {
  status: MaybeTaskStatus;
  task: Maybe<Task>;
};

export type MaybeTaskStatus = "COMPLETED" | "PROCESSING";

export type MessageCancelledEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  message: PetitionMessage;
  petition: Maybe<PetitionBaseMini>;
  reason: Scalars["String"]["output"];
  type: PetitionEventType;
  user: Maybe<User>;
};

export type MessageEmailBouncedUserNotification = PetitionUserNotification & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  isRead: Scalars["Boolean"]["output"];
  petition: PetitionBase;
};

export type MessageScheduledEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  message: PetitionMessage;
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
};

export type MessageSentEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  message: PetitionMessage;
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
};

export type ModuleResultAggregateType = "AVG" | "MAX" | "MIN" | "SUM";

export type ModuleResultType = "AGGREGATE" | "COUNT";

export type Mutation = {
  /** set user status to ACTIVE. */
  activateUser: Array<User>;
  /** Add users to a user group */
  addUsersToUserGroup: UserGroup;
  /** Creates a new dashboard in the organization */
  adminCreateDashboard: Dashboard;
  /** Anonymizes a petition */
  anonymizePetition: SupportMethodResponse;
  /** Updates the status of a PENDING petition field replies to APPROVED or REJECTED */
  approveOrRejectPetitionFieldReplies: Petition;
  /** Approves the current approval request step. The step must be in PENDING status. */
  approvePetitionApprovalRequestStep: PetitionApprovalRequestStep;
  /** Archives the replies of a FIELD_GROUP field into a profile */
  archiveFieldGroupReplyIntoProfile: PetitionFieldReply;
  archiveProfileType: Array<ProfileType>;
  /** Associates a profile to a petition */
  associateProfileToPetition: PetitionProfile;
  /** Associates profiles to petitions from an excel file. First column must contain Profile ID, second column must contain Petition ID. Duplicated entries or existing associations will be ignored. */
  associateProfilesToPetitionsExcel: SupportMethodResponse;
  /** Load contacts from an excel file, creating the ones not found on database */
  bulkCreateContacts: BulkCreateContactsReturnType;
  /** Submits multiple replies on a petition at once given a JSON input where the keys are field aliases and values are the replie(s) for that field. */
  bulkCreatePetitionReplies: Petition;
  /** Cancels the provided approval request step, setting it as CANCELED and effectively canceling the whole request. The step must be in PENDING status. */
  cancelPetitionApprovalRequestFlow: PetitionApprovalRequestStep;
  /** Cancels the provided approval request step, setting it as NOT_STARTED. The step must be in PENDING status. */
  cancelPetitionApprovalRequestStep: PetitionApprovalRequestStep;
  /** Cancels a scheduled petition message. */
  cancelScheduledMessage: Maybe<PetitionMessage>;
  cancelSignatureRequest: PetitionSignatureRequest;
  changeOrganization: Result;
  /** Changes the password for the current logged in user. */
  changePassword: ChangePasswordResult;
  /** Changes the type of a petition Field */
  changePetitionFieldType: PetitionField;
  /** Clones a petition field */
  clonePetitionField: PetitionField;
  /** Clone petition. */
  clonePetitions: Array<PetitionBase>;
  cloneProfileType: ProfileType;
  /** Clones the user groups with all its members */
  cloneUserGroups: Array<UserGroup>;
  /** Closes an open petition. */
  closePetition: Petition;
  /** Closes every parallel with status PENDING or COMPLETED that was created from the selected template. Parallels with ongoing signatures will NOT be closed. */
  closePetitionsFromTemplate: SupportMethodResponse;
  /** Closes a profile that is in OPEN or DELETION_SCHEDULED status */
  closeProfile: Array<Profile>;
  /**
   * Marks a petition as COMPLETED.
   * If the petition has a signature configured and does not require a review, starts the signing process.
   * It the petition has a configured approval flow, calculates and creates every
   */
  completePetition: Petition;
  completeProfileFromExternalSource: Profile;
  copyBackgroundCheckReplyToProfileFieldValue: ProfileFieldValue;
  copyFileReplyToProfileFieldFile: Array<ProfileFieldFile>;
  /**
   * Adds permissions to users and groups on given petitions and folders.
   * If the total amount of permission to add exceeds 200, a task will be created for async completion.
   * If user does not have OWNER or WRITE access on some of the provided petitions, those will be ignored.
   *
   * If the total amount of permissions to add is less than 200, it will execute synchronously and return a status code.
   * Otherwise, it will create and enqueue a Task to be executed asynchronously; and return the Task object.
   */
  createAddPetitionPermissionMaybeTask: MaybeTask;
  /** Creates a new Anthropic AI Completion integration on the provided organization */
  createAnthropicCompletionIntegration: SupportMethodResponse;
  /** Creates a new Azure OpenAI integration on the provided organization */
  createAzureOpenAiIntegration: SupportMethodResponse;
  createBackgroundCheckProfilePdfTask: Task;
  /** Creates a new Bankflip Document Processing integration on the provided organization */
  createBankflipDocumentProcessingIntegration: SupportMethodResponse;
  /** Creates a new Bankflip ID Verification integration on the provided organization */
  createBankflipIdVerificationIntegration: SupportMethodResponse;
  /** Creates a Task for creating, prefilling and sending petitions from a templateId */
  createBulkPetitionSendTask: Task;
  /** Creates a new Companies House Profile External Source integration on the provided organization, or updates it if the organization already has one. */
  createCompaniesHouseProfileExternalSourceIntegration: SupportMethodResponse;
  /** Create a contact. */
  createContact: Contact;
  /** Creates a contactless petition access */
  createContactlessPetitionAccess: PetitionAccess;
  createCreatePetitionButtonDashboardModule: Dashboard;
  createCustomSignatureDocumentUploadLink: Scalars["JSONObject"]["output"];
  /** Creates a new Dow Jones KYC integration on the user's organization */
  createDowJonesKycIntegration: OrgIntegration;
  /** Creates a reply for a DOW_JONES_KYC_FIELD, obtaining profile info and PDF document */
  createDowJonesKycReply: PetitionFieldReply;
  /** Creates a task for downloading a PDF file with the profile of an entity in DowJones */
  createDowJonesProfileDownloadTask: Task;
  /** Creates a new eInforma Profile External Source integration on the provided organization, or updates it if the organization already has one. */
  createEInformaProfileExternalSourceIntegration: SupportMethodResponse;
  /**
   * Edits permissions to users and groups on given petitions.
   * If the total amount of permissions to edit exceeds 200, a task will be created for async completion.
   *
   * If the total amount of permissions to add is less than 200, it will execute synchronously and return a status code.
   * Otherwise, it will create and enqueue a Task to be executed asynchronously; and return the Task object.
   */
  createEditPetitionPermissionMaybeTask: MaybeTask;
  /** Creates a pair of asymmetric keys to be used for signing webhook events */
  createEventSubscriptionSignatureKey: EventSubscriptionSignatureKey;
  /** Creates a task for exporting an xlsx file with petition text replies and sends it to the queue */
  createExportExcelTask: Task;
  /** Creates a task for exporting a ZIP file with petition replies and sends it to the queue */
  createExportRepliesTask: Task;
  /** Creates replies on a FIELD_GROUP field with the provided profiles */
  createFieldGroupRepliesFromProfiles: PetitionField;
  /** @deprecated use createFieldGroupRepliesFromProfiles */
  createFieldGroupReplyFromProfile: PetitionFieldReply;
  /** Creates a task for exporting files from a petition using an integration */
  createFileExportTask: Task;
  /** Creates a reply to a file upload field. */
  createFileUploadReply: FileUploadReplyResponse;
  /** Notifies the backend that the upload is complete. */
  createFileUploadReplyComplete: PetitionFieldReply;
  /** Creates a new iManage File Export integration on the provided organization */
  createIManageFileExportIntegration: SupportMethodResponse;
  /** Creates a new organization. Sends email to owner ONLY if it's not registered in any other organization. */
  createOrganization: Organization;
  /** Creates a new PDF_DOCUMENT theme on the user's organization */
  createOrganizationPdfDocumentTheme: Organization;
  /** Create parallel */
  createPetition: PetitionBase;
  /** Generates and returns a signed url to upload a petition attachment to AWS S3 */
  createPetitionAttachmentUploadLink: Array<PetitionAttachmentUploadData>;
  /** Create a petition comment. */
  createPetitionComment: PetitionFieldComment;
  /** Creates an event subscription for the user's petitions */
  createPetitionEventSubscription: PetitionEventSubscription;
  /** Creates a petition field */
  createPetitionField: PetitionField;
  /** Generates and returns a signed url to upload a field attachment to AWS S3 */
  createPetitionFieldAttachmentUploadLink: PetitionFieldAttachmentUploadData;
  /** Creates multiple replies for a petition at once */
  createPetitionFieldReplies: Array<PetitionFieldReply>;
  /** Creates a petition from a profile and a base template, prefilling the field groups linked to profile types with the provided profile and all its current relationships */
  createPetitionFromProfile: Petition;
  /** Creates a view with custom filters and ordering on the user's petitions list */
  createPetitionListView: PetitionListView;
  /** Creates a Task for generating a petition summary with AI */
  createPetitionSummaryTask: Task;
  /** Creates a new variable on the petition. */
  createPetitionVariable: Petition;
  createPetitionsNumberDashboardModule: Dashboard;
  createPetitionsPieChartDashboardModule: Dashboard;
  createPetitionsRatioDashboardModule: Dashboard;
  /** Creates a task for printing a PDF of the petition and sends it to the queue */
  createPrintPdfTask: Task;
  createProfile: Profile;
  /** Creates an event subscription for the user's profiles */
  createProfileEventSubscription: ProfileEventSubscription;
  createProfileFieldFileUploadLink: ProfileFieldPropertyAndFileWithUploadData;
  /** Adds a field as child of a field group, linked to a property of the parent field profile type */
  createProfileLinkedPetitionField: PetitionField;
  /** Creates a view with custom filters and ordering on the user's profile list */
  createProfileListView: ProfileListView;
  /** Associates a profile with one or more relationships. */
  createProfileRelationship: Profile;
  /** Creates relationships between profiles from an excel file. 1st and 2nd columns must be Profile IDs, 3rd column is the relationship alias. Direction is inferred from the profile IDs order. */
  createProfileRelationshipsExcel: SupportMethodResponse;
  createProfileType: ProfileType;
  createProfileTypeField: ProfileTypeField;
  /** Creates and associates a key process on a profile type */
  createProfileTypeProcess: ProfileTypeProcess;
  /** Creates a task for exporting profiles with specific filters */
  createProfilesExcelExportTask: Task;
  /** Creates a task for importing profiles from an excel file */
  createProfilesExcelImportTask: Task;
  createProfilesNumberDashboardModule: Dashboard;
  createProfilesPieChartDashboardModule: Dashboard;
  createProfilesRatioDashboardModule: Dashboard;
  /** Creates a public link from a user's template */
  createPublicPetitionLink: PublicPetitionLink;
  /** Creates prefill information to be used on public petition links. Returns the URL to be used for creation and prefill of the petition. */
  createPublicPetitionLinkPrefillData: Scalars["String"]["output"];
  /**
   * Removes permissions to users and groups on given petitions.
   * If the total amount of permission to add exceeds 200, a task will be created for async completion.
   *
   * If the total amount of permissions to add is less than 200, it will execute synchronously and return a status code.
   * Otherwise, it will create and enqueue a Task to be executed asynchronously; and return the Task object.
   */
  createRemovePetitionPermissionMaybeTask: MaybeTask;
  /** Creates a new Signaturit integration on the user's organization */
  createSignaturitIntegration: SignatureOrgIntegration;
  /** Creates a tag in the user's organization */
  createTag: Tag;
  /** Creates a Task for generating a CSV file with the replies of a template */
  createTemplateRepliesCsvExportTask: Task;
  /** Creates a task for exporting a report grouping the replies of every petition coming from the same template */
  createTemplateRepliesReportTask: Task;
  /** Creates a task for generating a JSON report of the template usage */
  createTemplateStatsReportTask: Task;
  /** Creates a task for generating an overview report of logged user's templates */
  createTemplatesOverviewReportTask: Task;
  /** Creates a group in the user's organization */
  createUserGroup: UserGroup;
  /** Deactivates the specified active petition accesses. */
  deactivateAccesses: Array<PetitionAccess>;
  /** Updates user status to INACTIVE and transfers their owned petitions to another user in the org. */
  deactivateUser: Array<User>;
  /** Removes the Azure OpenAI integration of the user's organization */
  deleteAzureOpenAiIntegration: SupportMethodResponse;
  /** Delete contacts. */
  deleteContacts: Result;
  deleteDashboardModule: Dashboard;
  /** Removes the DOW JONES integration of the user's organization */
  deleteDowJonesKycIntegration: Organization;
  /** Deletes a subscription signature key */
  deleteEventSubscriptionSignatureKeys: Result;
  /** Deletes event subscriptions */
  deleteEventSubscriptions: Result;
  deleteOrganizationPdfDocumentTheme: Organization;
  /** Remove a petition attachment */
  deletePetitionAttachment: PetitionBase;
  /** Delete a petition comment. */
  deletePetitionComment: PetitionFieldOrPetition;
  /** Deletes a petition field. */
  deletePetitionField: PetitionBase;
  /** Remove a petition field attachment */
  deletePetitionFieldAttachment: PetitionField;
  /** Deletes a petition list view of the user */
  deletePetitionListView: User;
  /** Deletes a reply to a petition field. */
  deletePetitionReply: PetitionField;
  /** Deletes a variable from the petition. */
  deletePetitionVariable: Petition;
  /** Delete petitions and folders. */
  deletePetitions: Success;
  /** Permanently deletes the profile */
  deleteProfile: Success;
  deleteProfileFieldFile: Result;
  /** Deletes a profile list view of the user */
  deleteProfileListView: User;
  deleteProfileType: Success;
  deleteProfileTypeField: ProfileType;
  /** Deletes a signature integration of the user's org. If there are pending signature requests using this integration, you must pass force argument to delete and cancel requests */
  deleteSignatureIntegration: Result;
  /** Removes the tag from every petition and soft-deletes it */
  deleteTag: Result;
  /** Deletes a group */
  deleteUserGroup: Result;
  /** Disassociates a petition from a profile */
  disassociateProfilesFromPetitions: Success;
  /** generates a signed download link for the xlsx file containing the listings of a dynamic select field */
  dynamicSelectFieldFileDownloadLink: FileUploadDownloadLinkResult;
  editProfileTypeProcess: ProfileTypeProcess;
  /** sets automatic numbering on all petition HEADINGs */
  enableAutomaticNumberingOnPetitionFields: PetitionBase;
  /** Generates a download link for a file reply. */
  fileUploadReplyDownloadLink: FileUploadDownloadLinkResult;
  /** Forces an update of the branding of every signature integration of the selected organization. */
  forceUpdateSignatureOrganizationBrandings: SupportMethodResponse;
  /** Generates a new API token for the context user */
  generateUserAuthToken: GenerateUserAuthTokenResponse;
  /** Returns an object with signed download url and filename for tasks with file output */
  getTaskResultFile: TaskResultFile;
  /** Imports a petition from a JSON file */
  importPetitionFromJson: SupportMethodResponse;
  /** Creates a new user in the same organization as the context user if `orgId` is not provided */
  inviteUserToOrganization: User;
  /** Links a FIELD_GROUP field to a profile type, so its replies can be archived into a profile when petition is closed */
  linkFieldGroupToProfileType: PetitionField;
  linkPetitionFieldChildren: PetitionField;
  loginAs: Result;
  /** Sets the default petition list view of the user. If passing null id, default view will be set (no filters/sorting) */
  markPetitionListViewAsDefault: User;
  /** Sets the default profile list view of the user. If passing null id, default view will be set (no filters/sorting) */
  markProfileListViewAsDefault: ProfileListView;
  /** marks a Signature integration as default */
  markSignatureIntegrationAsDefault: IOrgIntegration;
  /** Updates the limit of the current usage limit of a given organization */
  modifyCurrentUsagePeriod: Organization;
  /** Adds, edits or deletes a custom property on the petition */
  modifyPetitionCustomProperty: PetitionBase;
  /** Moves a group of petitions or folders to another folder. */
  movePetitions: Success;
  /** Generates a download link for a petition attachment */
  petitionAttachmentDownloadLink: FileUploadDownloadLinkResult;
  /** Tells the backend that the petition attachment was correctly uploaded to S3 */
  petitionAttachmentUploadComplete: PetitionAttachment;
  /** Generates a download link for a comment attachment */
  petitionCommentAttachmentDownloadLink: FileUploadDownloadLinkResult;
  /** Generates a download link for a field attachment */
  petitionFieldAttachmentDownloadLink: FileUploadDownloadLinkResult;
  /** Tells the backend that the field attachment was correctly uploaded to S3 */
  petitionFieldAttachmentUploadComplete: PetitionFieldAttachment;
  /** Pins a profile type to the user's navigation manu */
  pinProfileType: ProfileType;
  /** Prefills petition field groups with information from provided profiles */
  prefillPetitionFromProfiles: Petition;
  profileExternalSourceDetails: ProfileExternalSourceSearchSingleResult;
  profileExternalSourceSearch: ProfileExternalSourceSearchResults;
  /** Generates a download link for a profile field file */
  profileFieldFileDownloadLink: FileUploadDownloadLinkResult;
  profileFieldFileUploadComplete: Array<ProfileFieldFile>;
  /** Generates a download link for an excel model for profile import */
  profileImportExcelModelDownloadLink: Scalars["String"]["output"];
  publicCheckVerificationCode: VerificationCodeCheck;
  /**
   * Marks a filled petition as COMPLETED.
   * If the petition does not require a review, starts the signing process. Otherwise sends email to user.
   */
  publicCompletePetition: PublicPetition;
  /** Creates and sends the petition linked to the PublicPetitionLink to the contact passed in args */
  publicCreateAndSendPetitionFromPublicLink: Result;
  /** Creates a reply to a file upload field. */
  publicCreateFileUploadReply: PublicCreateFileUploadReply;
  /** Create a petition comment. */
  publicCreatePetitionComment: PublicPetitionFieldComment;
  /** Creates replies on a petition field as recipient. */
  publicCreatePetitionFieldReplies: Array<PublicPetitionFieldReply>;
  /** Starts an export pdf task in a recipient context */
  publicCreatePrintPdfTask: Task;
  /** Lets a recipient delegate access to the petition to another contact in the same organization */
  publicDelegateAccessToContact: PublicPetitionAccess;
  /** Delete a petition comment. */
  publicDeletePetitionComment: PublicPetitionFieldOrPublicPetition;
  /** Deletes a reply to a petition field. */
  publicDeletePetitionFieldReply: PublicPetitionField;
  /** Notifies the backend that the upload is complete. */
  publicFileUploadReplyComplete: PublicPetitionFieldReply;
  /** Generates a download link for a file reply on a public context. */
  publicFileUploadReplyDownloadLink: FileUploadDownloadLinkResult;
  /** Returns a signed download url for tasks with file output on a recipient context */
  publicGetTaskResultFileUrl: Scalars["String"]["output"];
  /** Marks the specified comments as read. */
  publicMarkPetitionFieldCommentsAsRead: Array<PublicPetitionFieldComment>;
  /** Generates a download link for a field attachment on a public context. */
  publicPetitionFieldAttachmentDownloadLink: FileUploadDownloadLinkResult;
  /** Cancel a reminder for a contact. */
  publicRemindersOptOut: Result;
  /** Resets the user password and resend the Invitation email. Only works if cognito user has status FORCE_CHANGE_PASSWORD */
  publicResetTempPassword: Result;
  /** Retries the completion of error replies for an async field */
  publicRetryAsyncFieldCompletion: AsyncFieldCompletionResponse;
  /** Sends an access reminder for a contact that is trying to open a petition through a contactless access but already has another active access */
  publicSendReminder: Result;
  publicSendVerificationCode: VerificationCodeRequest;
  /** Starts the completion of an async field */
  publicStartAsyncFieldCompletion: AsyncFieldCompletionResponse;
  /** Update a petition comment. */
  publicUpdatePetitionComment: PublicPetitionFieldComment;
  /** Updates replies on a petition field as recipient. */
  publicUpdatePetitionFieldReplies: Array<PublicPetitionFieldReply>;
  /** Reactivates the specified inactive petition accesses. */
  reactivateAccesses: Array<PetitionAccess>;
  /** Rejects the current approval request step. Step must be in PENDING status. */
  rejectPetitionApprovalRequestStep: PetitionApprovalRequestStep;
  /** Removes the password on a petition or template */
  removePetitionPassword: SupportMethodResponse;
  /** Disassociates two profiles with a relationship. */
  removeProfileRelationship: Success;
  removeProfileTypeProcess: ProfileType;
  /** Removes users from a user group */
  removeUsersFromGroup: UserGroup;
  /** Renames a folder. */
  renameFolder: Success;
  /** Reopens the petition */
  reopenPetition: Petition;
  /** Reopens a profile that is in CLOSED or DELETION_SCHEDULED status */
  reopenProfile: Array<Profile>;
  /** Reorders the positions of attachments in the petition */
  reorderPetitionAttachments: PetitionBase;
  /** Changes the ordering of a user's petition list views */
  reorderPetitionListViews: User;
  /** Changes the ordering of a user's profile list views */
  reorderProfileListViews: User;
  /** Sends the AccountVerification email with confirmation code to unconfirmed user emails */
  resendVerificationEmail: Result;
  /** Resets the user password and resend the Invitation email. Only works if cognito user has status FORCE_CHANGE_PASSWORD */
  resetTempPassword: Result;
  /** Resets the given user password on AWS Cognito and sends an email with new temporary. */
  resetUserPassword: SupportMethodResponse;
  /** Restores a deleted petition if it's not already anonymized. */
  restoreDeletedPetition: SupportMethodResponse;
  restoreLogin: Result;
  /** Retries the completion of error replies for an async field */
  retryAsyncFieldCompletion: AsyncFieldCompletionResponse;
  /** Soft-deletes a given auth token, making it permanently unusable. */
  revokeUserAuthToken: Result;
  /** Moves a profile to DELETION_SCHEDULED status */
  scheduleProfileForDeletion: Array<Profile>;
  /** Sends different petitions to each of the specified contact groups, creating corresponding accesses and messages */
  sendPetition: Array<SendPetitionResult>;
  /** Sends a reminder to the pending approvers of the provided approval request step. The step must be in PENDING status. */
  sendPetitionApprovalRequestStepReminder: PetitionApprovalRequestStep;
  /** Sends an email to all contacts of the petition confirming the replies are ok */
  sendPetitionClosedNotification: Petition;
  /** Sends a reminder for the specified petition accesses. */
  sendReminders: Array<PetitionReminder>;
  /** Sends a reminder email to the pending signers */
  sendSignatureRequestReminders: Result;
  /** Set the delegades of a user */
  setUserDelegates: User;
  /** Shares our Signaturit production APIKEY with the passed Org, creates corresponding usage limits and activates PETITION_SIGNATURE feature flag. */
  shareSignaturitApiKey: Organization;
  /** Triggered by new users that want to sign up into Parallel */
  signUp: User;
  /** Enables/disables security stamp on documents for Signaturit integrations. */
  signaturitIntegrationShowSecurityStamp: SupportMethodResponse;
  /** Generates a download link for the signed PDF petition. */
  signedPetitionDownloadLink: FileUploadDownloadLinkResult;
  /** Skips the provided approval request step. Step must be in NOT_STARTED or PENDING status. */
  skipPetitionApprovalRequestStep: PetitionApprovalRequestStep;
  /** Starts the completion of an async field */
  startAsyncFieldCompletion: AsyncFieldCompletionResponse;
  /** Starts an approval request on the provided step. The step must be applicable and next in line. */
  startPetitionApprovalRequestStep: PetitionApprovalRequestStep;
  startSignatureRequest: PetitionSignatureRequest;
  subscribeToProfile: Array<Profile>;
  /** Switches automatic reminders for the specified petition accesses. */
  switchAutomaticReminders: Array<PetitionAccess>;
  /** Tags a petition */
  tagPetition: PetitionBase;
  /** Creates an "Admins" team on the organization and removes Admin-only permissions from "All Users". Org owner will be added to "Admins" team. */
  transferAdminPermissions: SupportMethodResponse;
  /** Transfers the ownership of an organization to a given user. */
  transferOrganizationOwnership: SupportMethodResponse;
  /** Transfers petition ownership to a given user. The original owner gets a WRITE permission on the petitions. */
  transferPetitionOwnership: Array<PetitionBase>;
  unarchiveProfileType: Array<ProfileType>;
  unlinkPetitionFieldChildren: PetitionField;
  /** Unpins a profile type to the user's navigation manu */
  unpinProfileType: ProfileType;
  unsubscribeFromProfile: Array<Profile>;
  /** Removes the given tag from the given petition */
  untagPetition: PetitionBase;
  updateBackgroundCheckEntity: Success;
  updateCompaniesHouseCustomProperties: SupportMethodResponse;
  /** Updates a contact. */
  updateContact: Contact;
  updateDashboardModulePositions: Dashboard;
  updateEinformaCustomProperties: SupportMethodResponse;
  /** Activate or deactivate a list of organization feature flag */
  updateFeatureFlags: Organization;
  /** Updates the positions of the petition fields. If parentFieldId is defined, it will update the positions of it's children fields. */
  updateFieldPositions: PetitionBase;
  /** Updates the file of a FILE_UPLOAD reply. The previous file will be deleted from AWS S3 when client notifies of upload completed via updateFileUploadReplyComplete mutation. */
  updateFileUploadReply: FileUploadReplyResponse;
  /** Notifies the backend that the new file was successfully uploaded to S3. Marks the file upload as completed and deletes the old file. */
  updateFileUploadReplyComplete: PetitionFieldReply;
  /** Updates the metadata of a public landing template. */
  updateLandingTemplateMetadata: SupportMethodResponse;
  /** Updates the organization */
  updateOrganization: Organization;
  /** Updates the period after closed petitions of this organization are automatically anonymized. */
  updateOrganizationAutoAnonymizePeriod: Organization;
  /** updates the theme of the organization brand */
  updateOrganizationBrandTheme: Organization;
  /** Updates the logo of an organization */
  updateOrganizationLogo: Organization;
  /** updates the PDF_DOCUMENT theme of the organization */
  updateOrganizationPdfDocumentTheme: Organization;
  /** Applies a given tier to the organization */
  updateOrganizationTier: SupportMethodResponse;
  /** Updates the usage_details of a given organization. Will impact the limits of coming usage periods. */
  updateOrganizationUsageDetails: Organization;
  /** Updates the user limit for a organization */
  updateOrganizationUserLimit: Organization;
  /** Updates a petition. */
  updatePetition: PetitionBase;
  /** Updates the type of a petition attachment and sets it in the final position */
  updatePetitionAttachmentType: PetitionAttachment;
  /** Update a petition comment. */
  updatePetitionComment: PetitionFieldComment;
  /** Updates an existing event subscription for the user's petitions */
  updatePetitionEventSubscription: PetitionEventSubscription;
  /** Updates a petition field. */
  updatePetitionField: PetitionField;
  /** Updates the auto search config of a BACKGROUND_CHECK petition field. */
  updatePetitionFieldAutoSearchConfig: PetitionField;
  updatePetitionFieldGroupRelationships: PetitionBase;
  /** Updates multiple replies for a petition at once */
  updatePetitionFieldReplies: Array<PetitionFieldReply>;
  /** Updates the status of a petition field reply. */
  updatePetitionFieldRepliesStatus: PetitionField;
  /** Updates the metadata of the specified petition field reply */
  updatePetitionFieldReplyMetadata: PetitionFieldReply;
  /** Updates a petition list view */
  updatePetitionListView: PetitionListView;
  /** Updates the metadata of the specified petition */
  updatePetitionMetadata: Petition;
  /** Updates the subscription flag on a PetitionPermission */
  updatePetitionPermissionSubscription: Petition;
  /** Updates the restriction preferences */
  updatePetitionRestriction: PetitionBase;
  /**
   * Updates the read status of a user's notification.
   * If one of the following args is defined, the other two must be undefined:
   *   - petitionUserNotificationIds
   *   - petitionIds
   *   - petitionFieldCommentIds
   */
  updatePetitionUserNotificationReadStatus: Array<PetitionUserNotification>;
  /** Updates a variable on the petition. */
  updatePetitionVariable: Petition;
  /** Updates an existing event subscription for the user's profiles */
  updateProfileEventSubscription: ProfileEventSubscription;
  updateProfileFieldValue: Profile;
  /** Updates a profile list view */
  updateProfileListView: ProfileListView;
  updateProfileType: ProfileType;
  updateProfileTypeField: ProfileTypeField;
  /** Updates the default permission for a list of profile type fields and a set of users and/or user groups. */
  updateProfileTypeFieldPermissions: ProfileType;
  updateProfileTypeFieldPositions: ProfileType;
  updateProfileTypeProcessPositions: ProfileType;
  /** Updates the info and permissions of a public link */
  updatePublicPetitionLink: PublicPetitionLink;
  /** Updates template_public from template */
  updatePublicTemplateVisibility: SupportMethodResponse;
  updateSignatureRequestMetadata: PetitionSignatureRequest;
  /** Updates the standard list definitions with values defined in excel file */
  updateStandardListDefinitions: SupportMethodResponse;
  /** Updates the name and color of a given tag */
  updateTag: Tag;
  /** Updates the template default permissions */
  updateTemplateDefaultPermissions: PetitionTemplate;
  updateTemplateDocumentTheme: PetitionBase;
  /** Updates the user with the provided data. */
  updateUser: User;
  /** Updates the name of a given user group */
  updateUserGroup: UserGroup;
  /** Inserts the user into all provided user groups. */
  updateUserGroupMembership: User;
  /** Updates the permissions of a user group */
  updateUserGroupPermissions: UserGroup;
  /** Sets the locale passed as arg as the preferred language of the user to see the page */
  updateUserPreferredLocale: User;
  uploadBulkPetitionSendTaskInputFile: Scalars["JSONObject"]["output"];
  /** Uploads the xlsx file used to parse the options of a dynamic select field, and sets the field options */
  uploadDynamicSelectFieldFile: PetitionField;
  /** Uploads a user avatar image */
  uploadUserAvatar: SupportMethodResponse;
  verifyPublicAccess: PublicAccessVerification;
};

export type MutationactivateUserArgs = {
  userIds: Array<Scalars["GID"]["input"]>;
};

export type MutationaddUsersToUserGroupArgs = {
  userGroupId: Scalars["GID"]["input"];
  userIds: Array<Scalars["GID"]["input"]>;
};

export type MutationadminCreateDashboardArgs = {
  name: Scalars["String"]["input"];
  orgId: Scalars["GID"]["input"];
};

export type MutationanonymizePetitionArgs = {
  petitionId: Scalars["GID"]["input"];
};

export type MutationapproveOrRejectPetitionFieldRepliesArgs = {
  petitionId: Scalars["GID"]["input"];
  status: PetitionFieldReplyStatus;
};

export type MutationapprovePetitionApprovalRequestStepArgs = {
  approvalRequestStepId: Scalars["GID"]["input"];
  attachments?: InputMaybe<Array<Scalars["Upload"]["input"]>>;
  message: Scalars["String"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationarchiveFieldGroupReplyIntoProfileArgs = {
  conflictResolutions: Array<ArchiveFieldGroupReplyIntoProfileConflictResolutionInput>;
  expirations: Array<ArchiveFieldGroupReplyIntoProfileExpirationInput>;
  parentReplyId: Scalars["GID"]["input"];
  petitionFieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
  profileId: Scalars["GID"]["input"];
};

export type MutationarchiveProfileTypeArgs = {
  profileTypeIds: Array<Scalars["GID"]["input"]>;
};

export type MutationassociateProfileToPetitionArgs = {
  petitionId: Scalars["GID"]["input"];
  profileId: Scalars["GID"]["input"];
};

export type MutationassociateProfilesToPetitionsExcelArgs = {
  file: Scalars["Upload"]["input"];
  orgId: Scalars["GID"]["input"];
};

export type MutationbulkCreateContactsArgs = {
  file: Scalars["Upload"]["input"];
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type MutationbulkCreatePetitionRepliesArgs = {
  petitionId: Scalars["GID"]["input"];
  replies: Scalars["JSONObject"]["input"];
};

export type MutationcancelPetitionApprovalRequestFlowArgs = {
  petitionId: Scalars["GID"]["input"];
};

export type MutationcancelPetitionApprovalRequestStepArgs = {
  approvalRequestStepId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationcancelScheduledMessageArgs = {
  messageId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationcancelSignatureRequestArgs = {
  petitionSignatureRequestId: Scalars["GID"]["input"];
};

export type MutationchangeOrganizationArgs = {
  orgId: Scalars["GID"]["input"];
};

export type MutationchangePasswordArgs = {
  newPassword: Scalars["String"]["input"];
  password: Scalars["String"]["input"];
};

export type MutationchangePetitionFieldTypeArgs = {
  fieldId: Scalars["GID"]["input"];
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  petitionId: Scalars["GID"]["input"];
  type: PetitionFieldType;
};

export type MutationclonePetitionFieldArgs = {
  fieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationclonePetitionsArgs = {
  keepTitle?: InputMaybe<Scalars["Boolean"]["input"]>;
  path?: InputMaybe<Scalars["String"]["input"]>;
  petitionIds: Array<Scalars["GID"]["input"]>;
};

export type MutationcloneProfileTypeArgs = {
  name?: InputMaybe<Scalars["LocalizableUserText"]["input"]>;
  pluralName?: InputMaybe<Scalars["LocalizableUserText"]["input"]>;
  profileTypeId: Scalars["GID"]["input"];
};

export type MutationcloneUserGroupsArgs = {
  locale: UserLocale;
  userGroupIds: Array<Scalars["GID"]["input"]>;
};

export type MutationclosePetitionArgs = {
  petitionId: Scalars["GID"]["input"];
};

export type MutationclosePetitionsFromTemplateArgs = {
  templateId: Scalars["GID"]["input"];
};

export type MutationcloseProfileArgs = {
  profileIds: Array<Scalars["GID"]["input"]>;
};

export type MutationcompletePetitionArgs = {
  additionalSigners?: InputMaybe<Array<PublicPetitionSignerDataInput>>;
  message?: InputMaybe<Scalars["String"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationcompleteProfileFromExternalSourceArgs = {
  conflictResolutions: Array<ProfileExternalSourceConflictResolution>;
  profileExternalSourceEntityId: Scalars["GID"]["input"];
  profileId?: InputMaybe<Scalars["GID"]["input"]>;
  profileTypeId: Scalars["GID"]["input"];
};

export type MutationcopyBackgroundCheckReplyToProfileFieldValueArgs = {
  expiryDate?: InputMaybe<Scalars["Date"]["input"]>;
  petitionId: Scalars["GID"]["input"];
  profileId: Scalars["GID"]["input"];
  profileTypeFieldId: Scalars["GID"]["input"];
  replyId: Scalars["GID"]["input"];
};

export type MutationcopyFileReplyToProfileFieldFileArgs = {
  expiryDate?: InputMaybe<Scalars["Date"]["input"]>;
  fileReplyIds: Array<Scalars["GID"]["input"]>;
  petitionId: Scalars["GID"]["input"];
  profileId: Scalars["GID"]["input"];
  profileTypeFieldId: Scalars["GID"]["input"];
};

export type MutationcreateAddPetitionPermissionMaybeTaskArgs = {
  folders?: InputMaybe<FoldersInput>;
  message?: InputMaybe<Scalars["String"]["input"]>;
  notify?: InputMaybe<Scalars["Boolean"]["input"]>;
  permissionType: PetitionPermissionTypeRW;
  petitionIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  subscribe?: InputMaybe<Scalars["Boolean"]["input"]>;
  userGroupIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  userIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
};

export type MutationcreateAnthropicCompletionIntegrationArgs = {
  orgId: Scalars["GID"]["input"];
};

export type MutationcreateAzureOpenAiIntegrationArgs = {
  apiKey: Scalars["String"]["input"];
  endpoint: Scalars["String"]["input"];
  orgId: Scalars["GID"]["input"];
};

export type MutationcreateBackgroundCheckProfilePdfTaskArgs = {
  entityId: Scalars["String"]["input"];
  token: Scalars["String"]["input"];
};

export type MutationcreateBankflipDocumentProcessingIntegrationArgs = {
  apiKey: Scalars["String"]["input"];
  host: Scalars["String"]["input"];
  orgId: Scalars["GID"]["input"];
  webhookSecret: Scalars["String"]["input"];
};

export type MutationcreateBankflipIdVerificationIntegrationArgs = {
  apiKey: Scalars["String"]["input"];
  host: Scalars["String"]["input"];
  orgId: Scalars["GID"]["input"];
  webhookSecret: Scalars["String"]["input"];
};

export type MutationcreateBulkPetitionSendTaskArgs = {
  templateId: Scalars["GID"]["input"];
  temporaryFileId: Scalars["GID"]["input"];
};

export type MutationcreateCompaniesHouseProfileExternalSourceIntegrationArgs = {
  apiKey: Scalars["String"]["input"];
  orgId: Scalars["GID"]["input"];
};

export type MutationcreateContactArgs = {
  data: CreateContactInput;
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type MutationcreateContactlessPetitionAccessArgs = {
  petitionId: Scalars["GID"]["input"];
  remindersConfig?: InputMaybe<RemindersConfigInput>;
};

export type MutationcreateCreatePetitionButtonDashboardModuleArgs = {
  dashboardId: Scalars["GID"]["input"];
  settings: CreatePetitionButtonDashboardModuleSettingsInput;
  size: DashboardModuleSize;
  title?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationcreateCustomSignatureDocumentUploadLinkArgs = {
  file: FileUploadInput;
  petitionId: Scalars["GID"]["input"];
};

export type MutationcreateDowJonesKycIntegrationArgs = {
  clientId: Scalars["String"]["input"];
  password: Scalars["String"]["input"];
  username: Scalars["String"]["input"];
};

export type MutationcreateDowJonesKycReplyArgs = {
  fieldId: Scalars["GID"]["input"];
  parentReplyId?: InputMaybe<Scalars["GID"]["input"]>;
  petitionId: Scalars["GID"]["input"];
  profileId: Scalars["ID"]["input"];
};

export type MutationcreateDowJonesProfileDownloadTaskArgs = {
  profileId: Scalars["ID"]["input"];
};

export type MutationcreateEInformaProfileExternalSourceIntegrationArgs = {
  clientId: Scalars["String"]["input"];
  clientSecret: Scalars["String"]["input"];
  isPaidSubscription: Scalars["Boolean"]["input"];
  orgId: Scalars["GID"]["input"];
};

export type MutationcreateEditPetitionPermissionMaybeTaskArgs = {
  permissionType: PetitionPermissionTypeRW;
  petitionIds: Array<Scalars["GID"]["input"]>;
  userGroupIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  userIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
};

export type MutationcreateEventSubscriptionSignatureKeyArgs = {
  subscriptionId: Scalars["GID"]["input"];
};

export type MutationcreateExportExcelTaskArgs = {
  callbackUrl?: InputMaybe<Scalars["String"]["input"]>;
  exportEmptyFile?: InputMaybe<Scalars["Boolean"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationcreateExportRepliesTaskArgs = {
  callbackUrl?: InputMaybe<Scalars["String"]["input"]>;
  pattern?: InputMaybe<Scalars["String"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationcreateFieldGroupRepliesFromProfilesArgs = {
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  parentReplyId?: InputMaybe<Scalars["GID"]["input"]>;
  petitionFieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
  profileIds: Array<Scalars["GID"]["input"]>;
  skipFormatErrors?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type MutationcreateFieldGroupReplyFromProfileArgs = {
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  parentReplyId: Scalars["GID"]["input"];
  petitionFieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
  profileId: Scalars["GID"]["input"];
};

export type MutationcreateFileExportTaskArgs = {
  integrationId: Scalars["GID"]["input"];
  pattern?: InputMaybe<Scalars["String"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationcreateFileUploadReplyArgs = {
  fieldId: Scalars["GID"]["input"];
  file: FileUploadInput;
  parentReplyId?: InputMaybe<Scalars["GID"]["input"]>;
  password?: InputMaybe<Scalars["String"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationcreateFileUploadReplyCompleteArgs = {
  petitionId: Scalars["GID"]["input"];
  replyId: Scalars["GID"]["input"];
};

export type MutationcreateIManageFileExportIntegrationArgs = {
  clientId: Scalars["String"]["input"];
  orgId: Scalars["GID"]["input"];
};

export type MutationcreateOrganizationArgs = {
  email: Scalars["String"]["input"];
  firstName: Scalars["String"]["input"];
  lastName: Scalars["String"]["input"];
  locale: UserLocale;
  name: Scalars["String"]["input"];
  status: OrganizationStatus;
};

export type MutationcreateOrganizationPdfDocumentThemeArgs = {
  isDefault: Scalars["Boolean"]["input"];
  name: Scalars["String"]["input"];
};

export type MutationcreatePetitionArgs = {
  locale?: InputMaybe<PetitionLocale>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  path?: InputMaybe<Scalars["String"]["input"]>;
  petitionId?: InputMaybe<Scalars["GID"]["input"]>;
  type?: InputMaybe<PetitionBaseType>;
};

export type MutationcreatePetitionAttachmentUploadLinkArgs = {
  data: Array<FileUploadInput>;
  petitionId: Scalars["GID"]["input"];
  type: PetitionAttachmentType;
};

export type MutationcreatePetitionCommentArgs = {
  content: Scalars["JSON"]["input"];
  isInternal: Scalars["Boolean"]["input"];
  petitionFieldId?: InputMaybe<Scalars["GID"]["input"]>;
  petitionId: Scalars["GID"]["input"];
  sharePetition?: InputMaybe<Scalars["Boolean"]["input"]>;
  sharePetitionPermission?: InputMaybe<PetitionPermissionTypeRW>;
  sharePetitionSubscribed?: InputMaybe<Scalars["Boolean"]["input"]>;
  throwOnNoPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type MutationcreatePetitionEventSubscriptionArgs = {
  challenge?: InputMaybe<Scalars["Boolean"]["input"]>;
  eventTypes?: InputMaybe<Array<PetitionEventType>>;
  eventsUrl: Scalars["String"]["input"];
  fromTemplateFieldIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  fromTemplateId?: InputMaybe<Scalars["GID"]["input"]>;
  ignoreOwnerEvents?: InputMaybe<Scalars["Boolean"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationcreatePetitionFieldArgs = {
  data?: InputMaybe<CreatePetitionFieldInput>;
  parentFieldId?: InputMaybe<Scalars["GID"]["input"]>;
  petitionId: Scalars["GID"]["input"];
  position?: InputMaybe<Scalars["Int"]["input"]>;
  profileTypeId?: InputMaybe<Scalars["GID"]["input"]>;
  type: PetitionFieldType;
};

export type MutationcreatePetitionFieldAttachmentUploadLinkArgs = {
  data: FileUploadInput;
  fieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationcreatePetitionFieldRepliesArgs = {
  fields: Array<CreatePetitionFieldReplyInput>;
  overwriteExisting?: InputMaybe<Scalars["Boolean"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationcreatePetitionFromProfileArgs = {
  petitionFieldId?: InputMaybe<Scalars["GID"]["input"]>;
  prefill: Array<CreatePetitionFromProfilePrefillInput>;
  profileId: Scalars["GID"]["input"];
  skipFormatErrors?: InputMaybe<Scalars["Boolean"]["input"]>;
  templateId: Scalars["GID"]["input"];
};

export type MutationcreatePetitionListViewArgs = {
  data: PetitionListViewDataInput;
  name: Scalars["String"]["input"];
};

export type MutationcreatePetitionSummaryTaskArgs = {
  petitionId: Scalars["GID"]["input"];
};

export type MutationcreatePetitionVariableArgs = {
  data: CreatePetitionVariableInput;
  petitionId: Scalars["GID"]["input"];
};

export type MutationcreatePetitionsNumberDashboardModuleArgs = {
  dashboardId: Scalars["GID"]["input"];
  settings: PetitionsNumberDashboardModuleSettingsInput;
  size: DashboardModuleSize;
  title?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationcreatePetitionsPieChartDashboardModuleArgs = {
  dashboardId: Scalars["GID"]["input"];
  settings: PetitionsPieChartDashboardModuleSettingsInput;
  size: DashboardModuleSize;
  title?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationcreatePetitionsRatioDashboardModuleArgs = {
  dashboardId: Scalars["GID"]["input"];
  settings: PetitionsRatioDashboardModuleSettingsInput;
  size: DashboardModuleSize;
  title?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationcreatePrintPdfTaskArgs = {
  callbackUrl?: InputMaybe<Scalars["String"]["input"]>;
  includeNdLinks?: InputMaybe<Scalars["Boolean"]["input"]>;
  petitionId: Scalars["GID"]["input"];
  skipAttachments?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type MutationcreateProfileArgs = {
  fields?: InputMaybe<Array<UpdateProfileFieldValueInput>>;
  profileTypeId: Scalars["GID"]["input"];
  subscribe?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type MutationcreateProfileEventSubscriptionArgs = {
  challenge?: InputMaybe<Scalars["Boolean"]["input"]>;
  eventTypes?: InputMaybe<Array<ProfileEventType>>;
  eventsUrl: Scalars["String"]["input"];
  fromProfileTypeFieldIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  fromProfileTypeId?: InputMaybe<Scalars["GID"]["input"]>;
  ignoreOwnerEvents?: InputMaybe<Scalars["Boolean"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationcreateProfileFieldFileUploadLinkArgs = {
  data: Array<FileUploadInput>;
  expiryDate?: InputMaybe<Scalars["Date"]["input"]>;
  profileId: Scalars["GID"]["input"];
  profileTypeFieldId: Scalars["GID"]["input"];
};

export type MutationcreateProfileLinkedPetitionFieldArgs = {
  parentFieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
  position?: InputMaybe<Scalars["Int"]["input"]>;
  profileTypeFieldId: Scalars["GID"]["input"];
};

export type MutationcreateProfileListViewArgs = {
  data: ProfileListViewDataInput;
  name: Scalars["String"]["input"];
  profileTypeId: Scalars["GID"]["input"];
};

export type MutationcreateProfileRelationshipArgs = {
  profileId: Scalars["GID"]["input"];
  relationships: Array<CreateProfileRelationshipInput>;
};

export type MutationcreateProfileRelationshipsExcelArgs = {
  file: Scalars["Upload"]["input"];
  orgId: Scalars["GID"]["input"];
};

export type MutationcreateProfileTypeArgs = {
  name: Scalars["LocalizableUserText"]["input"];
  pluralName: Scalars["LocalizableUserText"]["input"];
};

export type MutationcreateProfileTypeFieldArgs = {
  data: CreateProfileTypeFieldInput;
  profileTypeId: Scalars["GID"]["input"];
};

export type MutationcreateProfileTypeProcessArgs = {
  processName: Scalars["LocalizableUserText"]["input"];
  profileTypeId: Scalars["GID"]["input"];
  templateIds: Array<Scalars["GID"]["input"]>;
};

export type MutationcreateProfilesExcelExportTaskArgs = {
  filter?: InputMaybe<ProfileFilter>;
  locale: UserLocale;
  profileTypeId: Scalars["GID"]["input"];
  search?: InputMaybe<Scalars["String"]["input"]>;
  sortBy?: InputMaybe<Array<SortByInput>>;
};

export type MutationcreateProfilesExcelImportTaskArgs = {
  file: Scalars["Upload"]["input"];
  profileTypeId: Scalars["GID"]["input"];
};

export type MutationcreateProfilesNumberDashboardModuleArgs = {
  dashboardId: Scalars["GID"]["input"];
  settings: ProfilesNumberDashboardModuleSettingsInput;
  size: DashboardModuleSize;
  title?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationcreateProfilesPieChartDashboardModuleArgs = {
  dashboardId: Scalars["GID"]["input"];
  settings: ProfilesPieChartDashboardModuleSettingsInput;
  size: DashboardModuleSize;
  title?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationcreateProfilesRatioDashboardModuleArgs = {
  dashboardId: Scalars["GID"]["input"];
  settings: ProfilesRatioDashboardModuleSettingsInput;
  size: DashboardModuleSize;
  title?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationcreatePublicPetitionLinkArgs = {
  allowMultiplePetitions: Scalars["Boolean"]["input"];
  description: Scalars["String"]["input"];
  petitionNamePattern?: InputMaybe<Scalars["String"]["input"]>;
  prefillSecret?: InputMaybe<Scalars["String"]["input"]>;
  slug?: InputMaybe<Scalars["String"]["input"]>;
  templateId: Scalars["GID"]["input"];
  title: Scalars["String"]["input"];
};

export type MutationcreatePublicPetitionLinkPrefillDataArgs = {
  data: Scalars["JSONObject"]["input"];
  path?: InputMaybe<Scalars["String"]["input"]>;
  publicPetitionLinkId: Scalars["GID"]["input"];
};

export type MutationcreateRemovePetitionPermissionMaybeTaskArgs = {
  petitionIds: Array<Scalars["GID"]["input"]>;
  removeAll?: InputMaybe<Scalars["Boolean"]["input"]>;
  userGroupIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  userIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
};

export type MutationcreateSignaturitIntegrationArgs = {
  apiKey: Scalars["String"]["input"];
  isDefault?: InputMaybe<Scalars["Boolean"]["input"]>;
  name: Scalars["String"]["input"];
};

export type MutationcreateTagArgs = {
  color: Scalars["String"]["input"];
  name: Scalars["String"]["input"];
};

export type MutationcreateTemplateRepliesCsvExportTaskArgs = {
  templateId: Scalars["GID"]["input"];
};

export type MutationcreateTemplateRepliesReportTaskArgs = {
  endDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  petitionId: Scalars["GID"]["input"];
  startDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  timezone: Scalars["String"]["input"];
};

export type MutationcreateTemplateStatsReportTaskArgs = {
  endDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  startDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  templateId: Scalars["GID"]["input"];
};

export type MutationcreateTemplatesOverviewReportTaskArgs = {
  endDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  startDate?: InputMaybe<Scalars["DateTime"]["input"]>;
};

export type MutationcreateUserGroupArgs = {
  name: Scalars["String"]["input"];
  userIds: Array<Scalars["GID"]["input"]>;
};

export type MutationdeactivateAccessesArgs = {
  accessIds: Array<Scalars["GID"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationdeactivateUserArgs = {
  includeDrafts?: InputMaybe<Scalars["Boolean"]["input"]>;
  tagIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  transferToUserId: Scalars["GID"]["input"];
  userIds: Array<Scalars["GID"]["input"]>;
};

export type MutationdeleteAzureOpenAiIntegrationArgs = {
  id: Scalars["GID"]["input"];
};

export type MutationdeleteContactsArgs = {
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  ids: Array<Scalars["GID"]["input"]>;
};

export type MutationdeleteDashboardModuleArgs = {
  dashboardId: Scalars["GID"]["input"];
  moduleId: Scalars["GID"]["input"];
};

export type MutationdeleteEventSubscriptionSignatureKeysArgs = {
  ids: Array<Scalars["GID"]["input"]>;
};

export type MutationdeleteEventSubscriptionsArgs = {
  ids: Array<Scalars["GID"]["input"]>;
};

export type MutationdeleteOrganizationPdfDocumentThemeArgs = {
  orgThemeId: Scalars["GID"]["input"];
};

export type MutationdeletePetitionAttachmentArgs = {
  attachmentId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationdeletePetitionCommentArgs = {
  petitionFieldCommentId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationdeletePetitionFieldArgs = {
  fieldId: Scalars["GID"]["input"];
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationdeletePetitionFieldAttachmentArgs = {
  attachmentId: Scalars["GID"]["input"];
  fieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationdeletePetitionListViewArgs = {
  id: Scalars["GID"]["input"];
};

export type MutationdeletePetitionReplyArgs = {
  petitionId: Scalars["GID"]["input"];
  replyId: Scalars["GID"]["input"];
};

export type MutationdeletePetitionVariableArgs = {
  name: Scalars["String"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationdeletePetitionsArgs = {
  dryrun?: InputMaybe<Scalars["Boolean"]["input"]>;
  folders?: InputMaybe<FoldersInput>;
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  ids?: InputMaybe<Array<Scalars["GID"]["input"]>>;
};

export type MutationdeleteProfileArgs = {
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  profileIds: Array<Scalars["GID"]["input"]>;
};

export type MutationdeleteProfileFieldFileArgs = {
  profileFieldFileIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  profileId: Scalars["GID"]["input"];
  profileTypeFieldId: Scalars["GID"]["input"];
};

export type MutationdeleteProfileListViewArgs = {
  id: Scalars["GID"]["input"];
};

export type MutationdeleteProfileTypeArgs = {
  profileTypeIds: Array<Scalars["GID"]["input"]>;
};

export type MutationdeleteProfileTypeFieldArgs = {
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  profileTypeFieldIds: Array<Scalars["GID"]["input"]>;
  profileTypeId: Scalars["GID"]["input"];
};

export type MutationdeleteSignatureIntegrationArgs = {
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  id: Scalars["GID"]["input"];
};

export type MutationdeleteTagArgs = {
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  id: Scalars["GID"]["input"];
};

export type MutationdeleteUserGroupArgs = {
  ids: Array<Scalars["GID"]["input"]>;
};

export type MutationdisassociateProfilesFromPetitionsArgs = {
  petitionIds: Array<Scalars["GID"]["input"]>;
  profileIds: Array<Scalars["GID"]["input"]>;
};

export type MutationdynamicSelectFieldFileDownloadLinkArgs = {
  fieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationeditProfileTypeProcessArgs = {
  data: EditProfileTypeProcessInput;
  profileTypeProcessId: Scalars["GID"]["input"];
};

export type MutationenableAutomaticNumberingOnPetitionFieldsArgs = {
  petitionId: Scalars["GID"]["input"];
};

export type MutationfileUploadReplyDownloadLinkArgs = {
  petitionId: Scalars["GID"]["input"];
  preview?: InputMaybe<Scalars["Boolean"]["input"]>;
  replyId: Scalars["GID"]["input"];
};

export type MutationforceUpdateSignatureOrganizationBrandingsArgs = {
  orgId: Scalars["GID"]["input"];
};

export type MutationgenerateUserAuthTokenArgs = {
  tokenName: Scalars["String"]["input"];
};

export type MutationgetTaskResultFileArgs = {
  preview?: InputMaybe<Scalars["Boolean"]["input"]>;
  taskId: Scalars["GID"]["input"];
};

export type MutationimportPetitionFromJsonArgs = {
  json: Scalars["String"]["input"];
  userId: Scalars["GID"]["input"];
};

export type MutationinviteUserToOrganizationArgs = {
  email: Scalars["String"]["input"];
  firstName: Scalars["String"]["input"];
  lastName: Scalars["String"]["input"];
  locale: UserLocale;
  orgId?: InputMaybe<Scalars["GID"]["input"]>;
  userGroupIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
};

export type MutationlinkFieldGroupToProfileTypeArgs = {
  petitionFieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
  profileTypeId?: InputMaybe<Scalars["GID"]["input"]>;
};

export type MutationlinkPetitionFieldChildrenArgs = {
  childrenFieldIds: Array<Scalars["GID"]["input"]>;
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  parentFieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationloginAsArgs = {
  userId: Scalars["GID"]["input"];
};

export type MutationmarkPetitionListViewAsDefaultArgs = {
  petitionListViewId?: InputMaybe<Scalars["GID"]["input"]>;
};

export type MutationmarkProfileListViewAsDefaultArgs = {
  profileListViewId: Scalars["GID"]["input"];
  profileTypeId: Scalars["GID"]["input"];
};

export type MutationmarkSignatureIntegrationAsDefaultArgs = {
  id: Scalars["GID"]["input"];
};

export type MutationmodifyCurrentUsagePeriodArgs = {
  limitName: OrganizationUsageLimitName;
  newLimit: Scalars["Int"]["input"];
  orgId: Scalars["GID"]["input"];
};

export type MutationmodifyPetitionCustomPropertyArgs = {
  key: Scalars["String"]["input"];
  petitionId: Scalars["GID"]["input"];
  value?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationmovePetitionsArgs = {
  destination: Scalars["String"]["input"];
  folderIds?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  ids?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  source: Scalars["String"]["input"];
  type: PetitionBaseType;
};

export type MutationpetitionAttachmentDownloadLinkArgs = {
  attachmentId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
  preview?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type MutationpetitionAttachmentUploadCompleteArgs = {
  attachmentId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationpetitionCommentAttachmentDownloadLinkArgs = {
  attachmentId: Scalars["GID"]["input"];
  commentId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
  preview?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type MutationpetitionFieldAttachmentDownloadLinkArgs = {
  attachmentId: Scalars["GID"]["input"];
  fieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationpetitionFieldAttachmentUploadCompleteArgs = {
  attachmentId: Scalars["GID"]["input"];
  fieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationpinProfileTypeArgs = {
  profileTypeId: Scalars["GID"]["input"];
};

export type MutationprefillPetitionFromProfilesArgs = {
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  parentReplyId?: InputMaybe<Scalars["GID"]["input"]>;
  petitionId: Scalars["GID"]["input"];
  prefill: Array<CreatePetitionFromProfilePrefillInput>;
  skipFormatErrors?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type MutationprofileExternalSourceDetailsArgs = {
  externalId: Scalars["ID"]["input"];
  integrationId: Scalars["GID"]["input"];
  profileId?: InputMaybe<Scalars["GID"]["input"]>;
  profileTypeId: Scalars["GID"]["input"];
};

export type MutationprofileExternalSourceSearchArgs = {
  integrationId: Scalars["GID"]["input"];
  locale: UserLocale;
  profileId?: InputMaybe<Scalars["GID"]["input"]>;
  profileTypeId: Scalars["GID"]["input"];
  search: Scalars["JSONObject"]["input"];
};

export type MutationprofileFieldFileDownloadLinkArgs = {
  preview?: InputMaybe<Scalars["Boolean"]["input"]>;
  profileFieldFileId: Scalars["GID"]["input"];
  profileId: Scalars["GID"]["input"];
  profileTypeFieldId: Scalars["GID"]["input"];
};

export type MutationprofileFieldFileUploadCompleteArgs = {
  profileFieldFileIds: Array<Scalars["GID"]["input"]>;
  profileId: Scalars["GID"]["input"];
  profileTypeFieldId: Scalars["GID"]["input"];
};

export type MutationprofileImportExcelModelDownloadLinkArgs = {
  locale: UserLocale;
  profileTypeId: Scalars["GID"]["input"];
};

export type MutationpublicCheckVerificationCodeArgs = {
  code: Scalars["String"]["input"];
  keycode: Scalars["ID"]["input"];
  token: Scalars["ID"]["input"];
};

export type MutationpublicCompletePetitionArgs = {
  additionalSigners?: InputMaybe<Array<PublicPetitionSignerDataInput>>;
  keycode: Scalars["ID"]["input"];
  message?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationpublicCreateAndSendPetitionFromPublicLinkArgs = {
  contactEmail: Scalars["String"]["input"];
  contactFirstName: Scalars["String"]["input"];
  contactLastName: Scalars["String"]["input"];
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  prefill?: InputMaybe<Scalars["String"]["input"]>;
  prefillDataKey?: InputMaybe<Scalars["ID"]["input"]>;
  slug: Scalars["ID"]["input"];
};

export type MutationpublicCreateFileUploadReplyArgs = {
  data: FileUploadInput;
  fieldId: Scalars["GID"]["input"];
  keycode: Scalars["ID"]["input"];
  parentReplyId?: InputMaybe<Scalars["GID"]["input"]>;
  password?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationpublicCreatePetitionCommentArgs = {
  content: Scalars["String"]["input"];
  keycode: Scalars["ID"]["input"];
  petitionFieldId?: InputMaybe<Scalars["GID"]["input"]>;
};

export type MutationpublicCreatePetitionFieldRepliesArgs = {
  fields: Array<CreatePetitionFieldReplyInput>;
  keycode: Scalars["ID"]["input"];
};

export type MutationpublicCreatePrintPdfTaskArgs = {
  keycode: Scalars["ID"]["input"];
};

export type MutationpublicDelegateAccessToContactArgs = {
  email: Scalars["String"]["input"];
  firstName: Scalars["String"]["input"];
  keycode: Scalars["ID"]["input"];
  lastName: Scalars["String"]["input"];
  messageBody: Scalars["String"]["input"];
};

export type MutationpublicDeletePetitionCommentArgs = {
  keycode: Scalars["ID"]["input"];
  petitionFieldCommentId: Scalars["GID"]["input"];
};

export type MutationpublicDeletePetitionFieldReplyArgs = {
  keycode: Scalars["ID"]["input"];
  replyId: Scalars["GID"]["input"];
};

export type MutationpublicFileUploadReplyCompleteArgs = {
  keycode: Scalars["ID"]["input"];
  replyId: Scalars["GID"]["input"];
};

export type MutationpublicFileUploadReplyDownloadLinkArgs = {
  keycode: Scalars["ID"]["input"];
  preview?: InputMaybe<Scalars["Boolean"]["input"]>;
  replyId: Scalars["GID"]["input"];
};

export type MutationpublicGetTaskResultFileUrlArgs = {
  keycode: Scalars["ID"]["input"];
  taskId: Scalars["GID"]["input"];
};

export type MutationpublicMarkPetitionFieldCommentsAsReadArgs = {
  keycode: Scalars["ID"]["input"];
  petitionFieldCommentIds: Array<Scalars["GID"]["input"]>;
};

export type MutationpublicPetitionFieldAttachmentDownloadLinkArgs = {
  attachmentId: Scalars["GID"]["input"];
  fieldId: Scalars["GID"]["input"];
  keycode: Scalars["ID"]["input"];
  preview?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type MutationpublicRemindersOptOutArgs = {
  keycode: Scalars["ID"]["input"];
  other: Scalars["String"]["input"];
  reason: Scalars["String"]["input"];
  referer?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationpublicResetTempPasswordArgs = {
  email: Scalars["String"]["input"];
  locale: UserLocale;
};

export type MutationpublicRetryAsyncFieldCompletionArgs = {
  fieldId: Scalars["GID"]["input"];
  keycode: Scalars["ID"]["input"];
  parentReplyId?: InputMaybe<Scalars["GID"]["input"]>;
};

export type MutationpublicSendReminderArgs = {
  contactEmail: Scalars["String"]["input"];
  keycode?: InputMaybe<Scalars["ID"]["input"]>;
  slug?: InputMaybe<Scalars["ID"]["input"]>;
};

export type MutationpublicSendVerificationCodeArgs = {
  email?: InputMaybe<Scalars["String"]["input"]>;
  firstName?: InputMaybe<Scalars["String"]["input"]>;
  keycode: Scalars["ID"]["input"];
  lastName?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationpublicStartAsyncFieldCompletionArgs = {
  fieldId: Scalars["GID"]["input"];
  keycode: Scalars["ID"]["input"];
  parentReplyId?: InputMaybe<Scalars["GID"]["input"]>;
};

export type MutationpublicUpdatePetitionCommentArgs = {
  content: Scalars["String"]["input"];
  keycode: Scalars["ID"]["input"];
  petitionFieldCommentId: Scalars["GID"]["input"];
};

export type MutationpublicUpdatePetitionFieldRepliesArgs = {
  keycode: Scalars["ID"]["input"];
  replies: Array<UpdatePetitionFieldReplyInput>;
};

export type MutationreactivateAccessesArgs = {
  accessIds: Array<Scalars["GID"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationrejectPetitionApprovalRequestStepArgs = {
  approvalRequestStepId: Scalars["GID"]["input"];
  attachments?: InputMaybe<Array<Scalars["Upload"]["input"]>>;
  message: Scalars["String"]["input"];
  petitionId: Scalars["GID"]["input"];
  rejectionType: PetitionApprovalRequestStepRejectionType;
};

export type MutationremovePetitionPasswordArgs = {
  petitionId: Scalars["GID"]["input"];
};

export type MutationremoveProfileRelationshipArgs = {
  profileId: Scalars["GID"]["input"];
  profileRelationshipIds: Array<Scalars["GID"]["input"]>;
};

export type MutationremoveProfileTypeProcessArgs = {
  profileTypeProcessId: Scalars["GID"]["input"];
};

export type MutationremoveUsersFromGroupArgs = {
  userGroupId: Scalars["GID"]["input"];
  userIds: Array<Scalars["GID"]["input"]>;
};

export type MutationrenameFolderArgs = {
  folderId: Scalars["ID"]["input"];
  name?: InputMaybe<Scalars["String"]["input"]>;
  type: PetitionBaseType;
};

export type MutationreopenPetitionArgs = {
  petitionId: Scalars["GID"]["input"];
};

export type MutationreopenProfileArgs = {
  profileIds: Array<Scalars["GID"]["input"]>;
};

export type MutationreorderPetitionAttachmentsArgs = {
  attachmentIds: Array<Scalars["GID"]["input"]>;
  attachmentType: PetitionAttachmentType;
  petitionId: Scalars["GID"]["input"];
};

export type MutationreorderPetitionListViewsArgs = {
  ids: Array<Scalars["GID"]["input"]>;
};

export type MutationreorderProfileListViewsArgs = {
  ids: Array<Scalars["GID"]["input"]>;
  profileTypeId: Scalars["GID"]["input"];
};

export type MutationresendVerificationEmailArgs = {
  email: Scalars["String"]["input"];
  locale: UserLocale;
};

export type MutationresetTempPasswordArgs = {
  email: Scalars["String"]["input"];
  locale: UserLocale;
};

export type MutationresetUserPasswordArgs = {
  email: Scalars["String"]["input"];
  locale: UserLocale;
};

export type MutationrestoreDeletedPetitionArgs = {
  petitionId: Scalars["GID"]["input"];
};

export type MutationretryAsyncFieldCompletionArgs = {
  fieldId: Scalars["GID"]["input"];
  parentReplyId?: InputMaybe<Scalars["GID"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationrevokeUserAuthTokenArgs = {
  authTokenIds: Array<Scalars["GID"]["input"]>;
};

export type MutationscheduleProfileForDeletionArgs = {
  profileIds: Array<Scalars["GID"]["input"]>;
};

export type MutationsendPetitionArgs = {
  body: Scalars["JSON"]["input"];
  bulkSendSigningMode?: InputMaybe<BulkSendSigningMode>;
  contactIdGroups: Array<Array<Scalars["GID"]["input"]>>;
  petitionId: Scalars["GID"]["input"];
  remindersConfig?: InputMaybe<RemindersConfigInput>;
  scheduledAt?: InputMaybe<Scalars["DateTime"]["input"]>;
  senderId?: InputMaybe<Scalars["GID"]["input"]>;
  skipEmailSend?: InputMaybe<Scalars["Boolean"]["input"]>;
  subject: Scalars["String"]["input"];
};

export type MutationsendPetitionApprovalRequestStepReminderArgs = {
  approvalRequestStepId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationsendPetitionClosedNotificationArgs = {
  attachPdfExport: Scalars["Boolean"]["input"];
  emailBody: Scalars["JSON"]["input"];
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  pdfExportTitle?: InputMaybe<Scalars["String"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationsendRemindersArgs = {
  accessIds: Array<Scalars["GID"]["input"]>;
  body?: InputMaybe<Scalars["JSON"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationsendSignatureRequestRemindersArgs = {
  petitionSignatureRequestId: Scalars["GID"]["input"];
};

export type MutationsetUserDelegatesArgs = {
  delegateIds: Array<Scalars["GID"]["input"]>;
};

export type MutationshareSignaturitApiKeyArgs = {
  duration: Scalars["Duration"]["input"];
  limit: Scalars["Int"]["input"];
  orgId: Scalars["GID"]["input"];
};

export type MutationsignUpArgs = {
  captcha: Scalars["String"]["input"];
  email: Scalars["String"]["input"];
  firstName: Scalars["String"]["input"];
  industry?: InputMaybe<Scalars["String"]["input"]>;
  lastName: Scalars["String"]["input"];
  licenseCode?: InputMaybe<Scalars["String"]["input"]>;
  locale: UserLocale;
  organizationLogo?: InputMaybe<Scalars["Upload"]["input"]>;
  organizationName: Scalars["String"]["input"];
  password: Scalars["String"]["input"];
  position?: InputMaybe<Scalars["String"]["input"]>;
  role?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationsignaturitIntegrationShowSecurityStampArgs = {
  integrationId: Scalars["Int"]["input"];
  showCsv: Scalars["Boolean"]["input"];
};

export type MutationsignedPetitionDownloadLinkArgs = {
  downloadAuditTrail?: InputMaybe<Scalars["Boolean"]["input"]>;
  petitionSignatureRequestId: Scalars["GID"]["input"];
  preview?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type MutationskipPetitionApprovalRequestStepArgs = {
  approvalRequestStepId: Scalars["GID"]["input"];
  message: Scalars["String"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationstartAsyncFieldCompletionArgs = {
  fieldId: Scalars["GID"]["input"];
  parentReplyId?: InputMaybe<Scalars["GID"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationstartPetitionApprovalRequestStepArgs = {
  approvalRequestStepId: Scalars["GID"]["input"];
  attachments?: InputMaybe<Array<Scalars["Upload"]["input"]>>;
  message?: InputMaybe<Scalars["String"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationstartSignatureRequestArgs = {
  customDocumentTemporaryFileId?: InputMaybe<Scalars["GID"]["input"]>;
  message?: InputMaybe<Scalars["String"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationsubscribeToProfileArgs = {
  profileIds: Array<Scalars["GID"]["input"]>;
  userIds: Array<Scalars["GID"]["input"]>;
};

export type MutationswitchAutomaticRemindersArgs = {
  accessIds: Array<Scalars["GID"]["input"]>;
  petitionId: Scalars["GID"]["input"];
  remindersConfig?: InputMaybe<RemindersConfigInput>;
  start: Scalars["Boolean"]["input"];
};

export type MutationtagPetitionArgs = {
  petitionId: Scalars["GID"]["input"];
  tagId: Scalars["GID"]["input"];
};

export type MutationtransferAdminPermissionsArgs = {
  organizationId: Scalars["GID"]["input"];
};

export type MutationtransferOrganizationOwnershipArgs = {
  orgId: Scalars["GID"]["input"];
  userId: Scalars["GID"]["input"];
};

export type MutationtransferPetitionOwnershipArgs = {
  petitionIds: Array<Scalars["GID"]["input"]>;
  userId: Scalars["GID"]["input"];
};

export type MutationunarchiveProfileTypeArgs = {
  profileTypeIds: Array<Scalars["GID"]["input"]>;
};

export type MutationunlinkPetitionFieldChildrenArgs = {
  childrenFieldIds: Array<Scalars["GID"]["input"]>;
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  parentFieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationunpinProfileTypeArgs = {
  profileTypeId: Scalars["GID"]["input"];
};

export type MutationunsubscribeFromProfileArgs = {
  profileIds: Array<Scalars["GID"]["input"]>;
  userIds: Array<Scalars["GID"]["input"]>;
};

export type MutationuntagPetitionArgs = {
  petitionId: Scalars["GID"]["input"];
  tagId: Scalars["GID"]["input"];
};

export type MutationupdateBackgroundCheckEntityArgs = {
  entityId?: InputMaybe<Scalars["String"]["input"]>;
  token: Scalars["String"]["input"];
};

export type MutationupdateCompaniesHouseCustomPropertiesArgs = {
  json: Scalars["String"]["input"];
  orgId: Scalars["GID"]["input"];
};

export type MutationupdateContactArgs = {
  data: UpdateContactInput;
  id: Scalars["GID"]["input"];
};

export type MutationupdateDashboardModulePositionsArgs = {
  dashboardId: Scalars["GID"]["input"];
  moduleIds: Array<Scalars["GID"]["input"]>;
};

export type MutationupdateEinformaCustomPropertiesArgs = {
  json: Scalars["String"]["input"];
  orgId: Scalars["GID"]["input"];
};

export type MutationupdateFeatureFlagsArgs = {
  featureFlags: Array<InputFeatureFlagNameValue>;
  orgId: Scalars["GID"]["input"];
};

export type MutationupdateFieldPositionsArgs = {
  fieldIds: Array<Scalars["GID"]["input"]>;
  parentFieldId?: InputMaybe<Scalars["GID"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationupdateFileUploadReplyArgs = {
  file: FileUploadInput;
  password?: InputMaybe<Scalars["String"]["input"]>;
  petitionId: Scalars["GID"]["input"];
  replyId: Scalars["GID"]["input"];
};

export type MutationupdateFileUploadReplyCompleteArgs = {
  petitionId: Scalars["GID"]["input"];
  replyId: Scalars["GID"]["input"];
};

export type MutationupdateLandingTemplateMetadataArgs = {
  backgroundColor?: InputMaybe<Scalars["String"]["input"]>;
  categories?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  image?: InputMaybe<Scalars["Upload"]["input"]>;
  slug?: InputMaybe<Scalars["String"]["input"]>;
  templateId: Scalars["GID"]["input"];
};

export type MutationupdateOrganizationArgs = {
  data: OrganizationUpdateInput;
  orgId: Scalars["GID"]["input"];
};

export type MutationupdateOrganizationAutoAnonymizePeriodArgs = {
  months?: InputMaybe<Scalars["Int"]["input"]>;
};

export type MutationupdateOrganizationBrandThemeArgs = {
  data: OrganizationBrandThemeInput;
};

export type MutationupdateOrganizationLogoArgs = {
  file: Scalars["Upload"]["input"];
  isIcon?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type MutationupdateOrganizationPdfDocumentThemeArgs = {
  data?: InputMaybe<Scalars["JSONObject"]["input"]>;
  isDefault?: InputMaybe<Scalars["Boolean"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  orgThemeId: Scalars["GID"]["input"];
};

export type MutationupdateOrganizationTierArgs = {
  orgId: Scalars["GID"]["input"];
  tier: Scalars["String"]["input"];
};

export type MutationupdateOrganizationUsageDetailsArgs = {
  duration: Scalars["Duration"]["input"];
  limit: Scalars["Int"]["input"];
  limitName: OrganizationUsageLimitName;
  orgId: Scalars["GID"]["input"];
  renewalCycles: Scalars["Int"]["input"];
  startNewPeriod: Scalars["Boolean"]["input"];
};

export type MutationupdateOrganizationUserLimitArgs = {
  limit: Scalars["Int"]["input"];
  orgId: Scalars["GID"]["input"];
};

export type MutationupdatePetitionArgs = {
  data: UpdatePetitionInput;
  petitionId: Scalars["GID"]["input"];
};

export type MutationupdatePetitionAttachmentTypeArgs = {
  attachmentId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
  type: PetitionAttachmentType;
};

export type MutationupdatePetitionCommentArgs = {
  content: Scalars["JSON"]["input"];
  petitionFieldCommentId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
  sharePetition?: InputMaybe<Scalars["Boolean"]["input"]>;
  sharePetitionPermission?: InputMaybe<PetitionPermissionTypeRW>;
  sharePetitionSubscribed?: InputMaybe<Scalars["Boolean"]["input"]>;
  throwOnNoPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type MutationupdatePetitionEventSubscriptionArgs = {
  eventTypes?: InputMaybe<Array<PetitionEventType>>;
  eventsUrl?: InputMaybe<Scalars["String"]["input"]>;
  fromTemplateFieldIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  fromTemplateId?: InputMaybe<Scalars["GID"]["input"]>;
  id: Scalars["GID"]["input"];
  ignoreOwnerEvents?: InputMaybe<Scalars["Boolean"]["input"]>;
  isEnabled?: InputMaybe<Scalars["Boolean"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationupdatePetitionFieldArgs = {
  data: UpdatePetitionFieldInput;
  fieldId: Scalars["GID"]["input"];
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationupdatePetitionFieldAutoSearchConfigArgs = {
  config?: InputMaybe<UpdatePetitionFieldAutoSearchConfigInput>;
  fieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationupdatePetitionFieldGroupRelationshipsArgs = {
  petitionId: Scalars["GID"]["input"];
  relationships: Array<UpdatePetitionFieldGroupRelationshipInput>;
};

export type MutationupdatePetitionFieldRepliesArgs = {
  petitionId: Scalars["GID"]["input"];
  replies: Array<UpdatePetitionFieldReplyInput>;
};

export type MutationupdatePetitionFieldRepliesStatusArgs = {
  petitionFieldId: Scalars["GID"]["input"];
  petitionFieldReplyIds: Array<Scalars["GID"]["input"]>;
  petitionId: Scalars["GID"]["input"];
  status: PetitionFieldReplyStatus;
};

export type MutationupdatePetitionFieldReplyMetadataArgs = {
  metadata: Scalars["JSONObject"]["input"];
  petitionId: Scalars["GID"]["input"];
  replyId: Scalars["GID"]["input"];
};

export type MutationupdatePetitionListViewArgs = {
  data?: InputMaybe<PetitionListViewDataInput>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  petitionListViewId: Scalars["GID"]["input"];
};

export type MutationupdatePetitionMetadataArgs = {
  metadata: Scalars["JSONObject"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationupdatePetitionPermissionSubscriptionArgs = {
  isSubscribed: Scalars["Boolean"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationupdatePetitionRestrictionArgs = {
  isRestricted: Scalars["Boolean"]["input"];
  password?: InputMaybe<Scalars["String"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationupdatePetitionUserNotificationReadStatusArgs = {
  filter?: InputMaybe<PetitionUserNotificationFilter>;
  isRead: Scalars["Boolean"]["input"];
  petitionFieldCommentIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  petitionIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  petitionUserNotificationIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
};

export type MutationupdatePetitionVariableArgs = {
  data: UpdatePetitionVariableInput;
  name: Scalars["String"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationupdateProfileEventSubscriptionArgs = {
  eventTypes?: InputMaybe<Array<ProfileEventType>>;
  eventsUrl?: InputMaybe<Scalars["String"]["input"]>;
  fromProfileTypeFieldIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  fromProfileTypeId?: InputMaybe<Scalars["GID"]["input"]>;
  id: Scalars["GID"]["input"];
  ignoreOwnerEvents?: InputMaybe<Scalars["Boolean"]["input"]>;
  isEnabled?: InputMaybe<Scalars["Boolean"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationupdateProfileFieldValueArgs = {
  fields: Array<UpdateProfileFieldValueInput>;
  profileId: Scalars["GID"]["input"];
};

export type MutationupdateProfileListViewArgs = {
  data?: InputMaybe<ProfileListViewDataInput>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  profileListViewId: Scalars["GID"]["input"];
  profileTypeId: Scalars["GID"]["input"];
};

export type MutationupdateProfileTypeArgs = {
  icon?: InputMaybe<ProfileTypeIcon>;
  name?: InputMaybe<Scalars["LocalizableUserText"]["input"]>;
  pluralName?: InputMaybe<Scalars["LocalizableUserText"]["input"]>;
  profileNamePattern?: InputMaybe<Scalars["String"]["input"]>;
  profileTypeId: Scalars["GID"]["input"];
};

export type MutationupdateProfileTypeFieldArgs = {
  data: UpdateProfileTypeFieldInput;
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  profileTypeFieldId: Scalars["GID"]["input"];
  profileTypeId: Scalars["GID"]["input"];
};

export type MutationupdateProfileTypeFieldPermissionsArgs = {
  data: Array<UpdateProfileTypeFieldPermissionsInput>;
  defaultPermission?: InputMaybe<ProfileTypeFieldPermissionType>;
  profileTypeFieldIds: Array<Scalars["GID"]["input"]>;
  profileTypeId: Scalars["GID"]["input"];
};

export type MutationupdateProfileTypeFieldPositionsArgs = {
  profileTypeFieldIds: Array<Scalars["GID"]["input"]>;
  profileTypeId: Scalars["GID"]["input"];
};

export type MutationupdateProfileTypeProcessPositionsArgs = {
  profileTypeId: Scalars["GID"]["input"];
  profileTypeProcessIds: Array<Scalars["GID"]["input"]>;
};

export type MutationupdatePublicPetitionLinkArgs = {
  allowMultiplePetitions?: InputMaybe<Scalars["Boolean"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  petitionNamePattern?: InputMaybe<Scalars["String"]["input"]>;
  prefillSecret?: InputMaybe<Scalars["String"]["input"]>;
  publicPetitionLinkId: Scalars["GID"]["input"];
  slug?: InputMaybe<Scalars["String"]["input"]>;
  title?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationupdatePublicTemplateVisibilityArgs = {
  isPublic: Scalars["Boolean"]["input"];
  templateId: Scalars["GID"]["input"];
};

export type MutationupdateSignatureRequestMetadataArgs = {
  metadata: Scalars["JSONObject"]["input"];
  petitionSignatureRequestId: Scalars["GID"]["input"];
};

export type MutationupdateStandardListDefinitionsArgs = {
  file: Scalars["Upload"]["input"];
};

export type MutationupdateTagArgs = {
  data: UpdateTagInput;
  id: Scalars["GID"]["input"];
};

export type MutationupdateTemplateDefaultPermissionsArgs = {
  permissions: Array<UserOrUserGroupPermissionInput>;
  templateId: Scalars["GID"]["input"];
};

export type MutationupdateTemplateDocumentThemeArgs = {
  orgThemeId: Scalars["GID"]["input"];
  templateId: Scalars["GID"]["input"];
};

export type MutationupdateUserArgs = {
  firstName?: InputMaybe<Scalars["String"]["input"]>;
  lastName?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationupdateUserGroupArgs = {
  data: UpdateUserGroupInput;
  id: Scalars["GID"]["input"];
};

export type MutationupdateUserGroupMembershipArgs = {
  userGroupIds: Array<Scalars["GID"]["input"]>;
  userId: Scalars["GID"]["input"];
};

export type MutationupdateUserGroupPermissionsArgs = {
  permissions: Array<UpdateUserGroupPermissionsInput>;
  userGroupId: Scalars["GID"]["input"];
};

export type MutationupdateUserPreferredLocaleArgs = {
  locale: UserLocale;
};

export type MutationuploadBulkPetitionSendTaskInputFileArgs = {
  file: FileUploadInput;
};

export type MutationuploadDynamicSelectFieldFileArgs = {
  fieldId: Scalars["GID"]["input"];
  file: Scalars["Upload"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationuploadUserAvatarArgs = {
  image: Scalars["Upload"]["input"];
  userId: Scalars["GID"]["input"];
};

export type MutationverifyPublicAccessArgs = {
  ip?: InputMaybe<Scalars["String"]["input"]>;
  keycode: Scalars["ID"]["input"];
  token: Scalars["ID"]["input"];
  userAgent?: InputMaybe<Scalars["String"]["input"]>;
};

export type OrgIntegration = IOrgIntegration & {
  id: Scalars["GID"]["output"];
  invalidCredentials: Scalars["Boolean"]["output"];
  /** Wether this integration is the default to be used if the user has more than one of the same type */
  isDefault: Scalars["Boolean"]["output"];
  /** URL of the integration logo */
  logoUrl: Maybe<Scalars["String"]["output"]>;
  /** Custom name of this integration, provided by the user */
  name: Scalars["String"]["output"];
  /** The type of the integration. */
  type: IntegrationType;
};

export type OrgIntegrationlogoUrlArgs = {
  options?: InputMaybe<ImageOptions>;
};

/** An object describing the license of an organization */
export type OrgLicense = {
  externalId: Scalars["String"]["output"];
  name: Scalars["String"]["output"];
  source: OrgLicenseSource;
};

export type OrgLicenseSource = "APPSUMO";

/** An organization in the system. */
export type Organization = Timestamps & {
  /** The total number of active users */
  activeUserCount: Scalars["Int"]["output"];
  anonymizePetitionsAfterMonths: Maybe<Scalars["Int"]["output"]>;
  brandTheme: OrganizationBrandThemeData;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  currentUsagePeriod: Maybe<OrganizationUsageLimit>;
  /** Custom host used in petition links and public links. */
  customHost: Maybe<Scalars["String"]["output"]>;
  /** A list of all feature flag and the value asigned to this org */
  features: Array<FeatureFlagNameValue>;
  hasIntegration: Scalars["Boolean"]["output"];
  /** Whether the organization has an SSO provider configured. */
  hasSsoProvider: Scalars["Boolean"]["output"];
  /** URL of the organization logo */
  iconUrl: Maybe<Scalars["String"]["output"]>;
  /** The ID of the organization. */
  id: Scalars["GID"]["output"];
  /** A paginated list with enabled integrations for the organization */
  integrations: IOrgIntegrationPagination;
  isUsageLimitReached: Scalars["Boolean"]["output"];
  /** Current license for the organization */
  license: Maybe<OrgLicense>;
  /** URL of the organization logo */
  logoUrl: Maybe<Scalars["String"]["output"]>;
  /** The name of the organization. */
  name: Scalars["String"]["output"];
  pdfDocumentThemes: Array<OrganizationTheme>;
  /** The status of the organization. */
  status: OrganizationStatus;
  subscriptionEndDate: Maybe<Scalars["DateTime"]["output"]>;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
  usageDetails: Scalars["JSONObject"]["output"];
  usagePeriods: OrganizationUsageLimitPagination;
  /** The users in the organization. */
  users: UserPagination;
  /** The users in the organization filtered by a list of emails. */
  usersByEmail: UserPagination;
};

/** An organization in the system. */
export type OrganizationcurrentUsagePeriodArgs = {
  limitName: OrganizationUsageLimitName;
};

/** An organization in the system. */
export type OrganizationhasIntegrationArgs = {
  integration: IntegrationType;
  provider?: InputMaybe<Scalars["String"]["input"]>;
};

/** An organization in the system. */
export type OrganizationiconUrlArgs = {
  options?: InputMaybe<ImageOptions>;
};

/** An organization in the system. */
export type OrganizationintegrationsArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  type?: InputMaybe<IntegrationType>;
};

/** An organization in the system. */
export type OrganizationisUsageLimitReachedArgs = {
  limitName: OrganizationUsageLimitName;
};

/** An organization in the system. */
export type OrganizationlogoUrlArgs = {
  options?: InputMaybe<ImageOptions>;
};

/** An organization in the system. */
export type OrganizationsubscriptionEndDateArgs = {
  limitName: OrganizationUsageLimitName;
};

/** An organization in the system. */
export type OrganizationusagePeriodsArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  limitName: OrganizationUsageLimitName;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

/** An organization in the system. */
export type OrganizationusersArgs = {
  exclude?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  filters?: InputMaybe<UserFilter>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  searchByEmailOnly?: InputMaybe<Scalars["Boolean"]["input"]>;
  sortBy?: InputMaybe<Array<OrganizationUsers_OrderBy>>;
};

/** An organization in the system. */
export type OrganizationusersByEmailArgs = {
  emails: Array<Scalars["String"]["input"]>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type OrganizationBrandThemeData = {
  color: Scalars["String"]["output"];
  fontFamily: Maybe<Scalars["String"]["output"]>;
  preferredTone: Tone;
};

export type OrganizationBrandThemeInput = {
  color?: InputMaybe<Scalars["String"]["input"]>;
  fontFamily?: InputMaybe<Scalars["String"]["input"]>;
  preferredTone?: InputMaybe<Tone>;
};

export type OrganizationPagination = {
  /** The requested slice of items. */
  items: Array<Organization>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

/** The status of the organization. */
export type OrganizationStatus =
  /** Used for regular clients */
  | "ACTIVE"
  /** Used on churned clients */
  | "CHURNED"
  /** Used for demoing the product */
  | "DEMO"
  /** Used for development or testing purposes */
  | "DEV"
  /** Inactive client. Users will not be able to login */
  | "INACTIVE"
  /** Root client */
  | "ROOT";

export type OrganizationTheme = {
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  isDefault: Scalars["Boolean"]["output"];
  name: Scalars["String"]["output"];
};

export type OrganizationUpdateInput = {
  name?: InputMaybe<Scalars["String"]["input"]>;
  status?: InputMaybe<OrganizationStatus>;
};

export type OrganizationUsageLimit = {
  cycleNumber: Scalars["Int"]["output"];
  id: Scalars["GID"]["output"];
  limit: Scalars["Float"]["output"];
  period: Scalars["Duration"]["output"];
  periodEndDate: Maybe<Scalars["DateTime"]["output"]>;
  periodStartDate: Scalars["DateTime"]["output"];
  used: Scalars["Float"]["output"];
};

export type OrganizationUsageLimitName = "PETITION_SEND" | "SIGNATURIT_SHARED_APIKEY";

export type OrganizationUsageLimitPagination = {
  /** The requested slice of items. */
  items: Array<OrganizationUsageLimit>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

/** Order to use on Organization.users */
export type OrganizationUsers_OrderBy =
  | "createdAt_ASC"
  | "createdAt_DESC"
  | "email_ASC"
  | "email_DESC"
  | "firstName_ASC"
  | "firstName_DESC"
  | "fullName_ASC"
  | "fullName_DESC"
  | "lastActiveAt_ASC"
  | "lastActiveAt_DESC"
  | "lastName_ASC"
  | "lastName_DESC";

export type OwnershipTransferredEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  owner: Maybe<User>;
  petition: Maybe<PetitionBaseMini>;
  previousOwner: Maybe<User>;
  type: PetitionEventType;
  user: Maybe<User>;
};

/** A petition */
export type Petition = PetitionBase & {
  /** The accesses for this petition */
  accesses: Array<PetitionAccess>;
  /** How many months to wait since the petition is closed to anonymize. */
  anonymizeAfterMonths: Maybe<Scalars["Int"]["output"]>;
  /** Purpose of the anonymization */
  anonymizePurpose: Maybe<Scalars["String"]["output"]>;
  approvalFlowConfig: Maybe<Array<ApprovalFlowConfig>>;
  /** The attachments linked to this petition */
  attachmentsList: PetitionAttachmentsList;
  /** The automatic numbering settings of the petition. */
  automaticNumberingConfig: Maybe<AutomaticNumberingConfig>;
  /** Time when the petition was closed. */
  closedAt: Maybe<Scalars["DateTime"]["output"]>;
  /** The closing email body of the petition. */
  closingEmailBody: Maybe<Scalars["JSON"]["output"]>;
  /** The body of the optional completing message to be show to recipients */
  completingMessageBody: Maybe<Scalars["JSON"]["output"]>;
  /** The subject of the optional completing message to be show to recipients */
  completingMessageSubject: Maybe<Scalars["String"]["output"]>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  currentApprovalRequestStatus: PetitionApprovalRequestStatus;
  currentApprovalRequestSteps: Maybe<Array<PetitionApprovalRequestStep>>;
  /** The current signature request. */
  currentSignatureRequest: Maybe<PetitionSignatureRequest>;
  customLists: Array<PetitionCustomList>;
  /** Custom user properties */
  customProperties: Scalars["JSONObject"]["output"];
  /** The deadline of the petition. */
  deadline: Maybe<Scalars["DateTime"]["output"]>;
  defaultOnBehalf: Maybe<User>;
  /** The effective permissions on the petition */
  effectivePermissions: Array<EffectivePetitionUserPermission>;
  /** The body of the petition. */
  emailBody: Maybe<Scalars["JSON"]["output"]>;
  /** The subject of the petition. */
  emailSubject: Maybe<Scalars["String"]["output"]>;
  /** The events for the petition. */
  events: PetitionEventPagination;
  /** The number of fields in the petition. */
  fieldCount: Scalars["Int"]["output"];
  fieldRelationships: Array<PetitionFieldGroupRelationship>;
  /** The definition of the petition fields. */
  fields: Array<PetitionField>;
  /** The template used for this petition */
  fromTemplate: Maybe<PetitionBaseMini>;
  generalCommentCount: Scalars["Int"]["output"];
  /** The general comments for this petition */
  generalComments: Array<PetitionFieldComment>;
  hasStartedProcess: Scalars["Boolean"]["output"];
  /** The ID of the petition or template. */
  id: Scalars["GID"]["output"];
  isAnonymized: Scalars["Boolean"]["output"];
  /** Wether the completion message will be shown to the recipients or not. */
  isCompletingMessageEnabled: Scalars["Boolean"]["output"];
  /** Indicates whether delegate access is enabled for the recipient */
  isDelegateAccessEnabled: Scalars["Boolean"]["output"];
  isDocumentGenerationEnabled: Scalars["Boolean"]["output"];
  isInteractionWithRecipientsEnabled: Scalars["Boolean"]["output"];
  /**
   * Whether the contents card is hidden in the recipient view.
   * @deprecated Don't use this
   */
  isRecipientViewContentsHidden: Scalars["Boolean"]["output"];
  isRestricted: Scalars["Boolean"]["output"];
  isRestrictedWithPassword: Scalars["Boolean"]["output"];
  isReviewFlowEnabled: Scalars["Boolean"]["output"];
  lastActivityAt: Maybe<Scalars["DateTime"]["output"]>;
  /** Time when the petition or any of its relations were last updated. */
  lastChangeAt: Scalars["DateTime"]["output"];
  lastGeneralComment: Maybe<PetitionFieldComment>;
  lastRecipientActivityAt: Maybe<Scalars["DateTime"]["output"]>;
  /** The latest summary request for this petition */
  latestSummaryRequest: Maybe<AiCompletionLog>;
  /** The locale of the parallel. */
  locale: PetitionLocale;
  /** Metadata for this petition. */
  metadata: Scalars["JSONObject"]["output"];
  /** The effective permission of the logged user. Will return null if the user doesn't have access to the petition (e.g. on public templates). */
  myEffectivePermission: Maybe<EffectivePetitionUserPermission>;
  /** The name of the petition. */
  name: Maybe<Scalars["String"]["output"]>;
  oldApprovalRequestSteps: Array<PetitionApprovalRequestStep>;
  organization: Organization;
  owner: User;
  path: Scalars["String"]["output"];
  /** The permissions linked to the petition */
  permissions: Array<PetitionPermission>;
  profiles: Array<Profile>;
  /** The progress of the petition. */
  progress: PetitionProgress;
  /** The reminders configuration for the petition. */
  remindersConfig: Maybe<RemindersConfig>;
  selectedDocumentTheme: OrganizationTheme;
  /** Date when the petition was first sent */
  sentAt: Maybe<Scalars["DateTime"]["output"]>;
  /** The signature configuration for the petition. */
  signatureConfig: Maybe<SignatureConfig>;
  /** The list of signature requests. */
  signatureRequests: Array<PetitionSignatureRequest>;
  /** Whether to skip the forward security check on the recipient view. */
  skipForwardSecurity: Scalars["Boolean"]["output"];
  /** Lists every available standard list to be used in field logic conditions */
  standardListDefinitions: Array<StandardListDefinition>;
  /** The status of the petition. */
  status: PetitionStatus;
  /** The summary configuration for the petition. */
  summaryConfig: Maybe<Scalars["JSONObject"]["output"]>;
  /** The tags linked to the petition */
  tags: Array<Tag>;
  /** The preferred tone of organization. */
  tone: Tone;
  type: PetitionBaseType;
  unreadGeneralCommentCount: Scalars["Int"]["output"];
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
  variables: Array<PetitionVariable>;
  variablesResult: Array<PetitionVariableResult>;
};

/** A petition */
export type PetitioneventsArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

/** A petition access */
export type PetitionAccess = Timestamps & {
  /** The contact of this access. */
  contact: Maybe<Contact>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  /** The original user who granted the access as other user. */
  delegateGranter: Maybe<User>;
  /** The user who granted the original access. */
  granter: Maybe<User>;
  /** The ID of the petition access. */
  id: Scalars["GID"]["output"];
  /** It will be true if doesn't have contact assigned */
  isContactless: Scalars["Boolean"]["output"];
  /** It will be true if the petition access was created by contactless link */
  isSharedByLink: Scalars["Boolean"]["output"];
  /** When the next reminder will be sent. */
  nextReminderAt: Maybe<Scalars["DateTime"]["output"]>;
  /** The petition for this message access. */
  petition: Maybe<Petition>;
  recipientUrl: Maybe<Scalars["String"]["output"]>;
  /** Number of reminders sent. */
  reminderCount: Scalars["Int"]["output"];
  reminders: Array<PetitionReminder>;
  /** Whether automatic reminders are active or not for this petition access */
  remindersActive: Scalars["Boolean"]["output"];
  /** The reminder settings of the petition. */
  remindersConfig: Maybe<RemindersConfig>;
  /** Number of reminders left. */
  remindersLeft: Scalars["Int"]["output"];
  /** Whether contact has opted out from receiving reminders for this petition */
  remindersOptOut: Scalars["Boolean"]["output"];
  /** The status of the petition access */
  status: PetitionAccessStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
};

export type PetitionAccessPagination = {
  /** The requested slice of items. */
  items: Array<PetitionAccess>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

/** The status of a petition access. */
export type PetitionAccessStatus =
  /** The petition is accessible by the contact. */
  | "ACTIVE"
  /** The petition is not accessible by the contact. */
  | "INACTIVE";

export type PetitionAnonymizedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
};

/** The status of the petition approval request. */
export type PetitionApprovalRequestStatus =
  | "APPROVED"
  | "NOT_STARTED"
  | "NO_APPROVAL"
  | "PENDING"
  | "REJECTED";

export type PetitionApprovalRequestStep = {
  approvalType: PetitionApprovalRequestStepApprovalType;
  approvers: Array<PetitionApprovalRequestStepApprover>;
  id: Scalars["GID"]["output"];
  petition: Petition;
  status: PetitionApprovalRequestStepStatus;
  stepName: Scalars["String"]["output"];
};

export type PetitionApprovalRequestStepApprovalType = "ALL" | "ANY";

export type PetitionApprovalRequestStepApprovedEvent = PetitionEvent & {
  approvalRequestStep: PetitionApprovalRequestStep;
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type PetitionApprovalRequestStepApprover = {
  approvedAt: Maybe<Scalars["DateTime"]["output"]>;
  canceledAt: Maybe<Scalars["DateTime"]["output"]>;
  id: Scalars["GID"]["output"];
  rejectedAt: Maybe<Scalars["DateTime"]["output"]>;
  sentAt: Maybe<Scalars["DateTime"]["output"]>;
  skippedAt: Maybe<Scalars["DateTime"]["output"]>;
  user: Maybe<User>;
};

export type PetitionApprovalRequestStepCanceledEvent = PetitionEvent & {
  approvalRequestStep: PetitionApprovalRequestStep;
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type PetitionApprovalRequestStepFinishedEvent = PetitionEvent & {
  approvalRequestStep: PetitionApprovalRequestStep;
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type PetitionApprovalRequestStepRejectedEvent = PetitionEvent & {
  approvalRequestStep: PetitionApprovalRequestStep;
  comment: Maybe<PetitionFieldComment>;
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type PetitionApprovalRequestStepRejectionType = "DEFINITIVE" | "TEMPORARY";

export type PetitionApprovalRequestStepReminderEvent = PetitionEvent & {
  approvalRequestStep: PetitionApprovalRequestStep;
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type PetitionApprovalRequestStepSkippedEvent = PetitionEvent & {
  approvalRequestStep: PetitionApprovalRequestStep;
  comment: Maybe<PetitionFieldComment>;
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type PetitionApprovalRequestStepStartedEvent = PetitionEvent & {
  approvalRequestStep: PetitionApprovalRequestStep;
  comment: Maybe<PetitionFieldComment>;
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type PetitionApprovalRequestStepStatus =
  | "APPROVED"
  | "CANCELED"
  | "NOT_APPLICABLE"
  | "NOT_STARTED"
  | "PENDING"
  | "REJECTED"
  | "SKIPPED";

export type PetitionApprovalsFilterInput = {
  filters: Array<PetitionApprovalsFilterLine>;
  operator: PetitionApprovalsFilterLogicalOperator;
};

export type PetitionApprovalsFilterLine = {
  operator: PetitionApprovalsFilterOperator;
  value: Scalars["String"]["input"];
};

export type PetitionApprovalsFilterLogicalOperator = "AND" | "OR";

export type PetitionApprovalsFilterOperator = "ASSIGNED_TO" | "STATUS";

export type PetitionAssociatedEvent = ProfileEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  profile: Maybe<Profile>;
  type: ProfileEventType;
  user: Maybe<User>;
};

export type PetitionAttachment = {
  file: FileUpload;
  id: Scalars["GID"]["output"];
  petition: PetitionBase;
  type: PetitionAttachmentType;
};

export type PetitionAttachmentType = "ANNEX" | "BACK" | "FRONT";

export type PetitionAttachmentUploadData = {
  attachment: PetitionAttachment;
  presignedPostData: AWSPresignedPostData;
};

export type PetitionAttachmentsList = {
  ANNEX: Array<PetitionAttachment>;
  BACK: Array<PetitionAttachment>;
  FRONT: Array<PetitionAttachment>;
};

export type PetitionBase = {
  /** How many months to wait since the petition is closed to anonymize. */
  anonymizeAfterMonths: Maybe<Scalars["Int"]["output"]>;
  /** Purpose of the anonymization */
  anonymizePurpose: Maybe<Scalars["String"]["output"]>;
  approvalFlowConfig: Maybe<Array<ApprovalFlowConfig>>;
  /** The attachments linked to this petition */
  attachmentsList: PetitionAttachmentsList;
  /** The automatic numbering settings of the petition. */
  automaticNumberingConfig: Maybe<AutomaticNumberingConfig>;
  /** The closing email body of the petition. */
  closingEmailBody: Maybe<Scalars["JSON"]["output"]>;
  /** The body of the optional completing message to be show to recipients */
  completingMessageBody: Maybe<Scalars["JSON"]["output"]>;
  /** The subject of the optional completing message to be show to recipients */
  completingMessageSubject: Maybe<Scalars["String"]["output"]>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  customLists: Array<PetitionCustomList>;
  /** Custom user properties */
  customProperties: Scalars["JSONObject"]["output"];
  defaultOnBehalf: Maybe<User>;
  /** The effective permissions on the petition */
  effectivePermissions: Array<EffectivePetitionUserPermission>;
  /** The body of the petition. */
  emailBody: Maybe<Scalars["JSON"]["output"]>;
  /** The subject of the petition. */
  emailSubject: Maybe<Scalars["String"]["output"]>;
  /** The number of fields in the petition. */
  fieldCount: Scalars["Int"]["output"];
  fieldRelationships: Array<PetitionFieldGroupRelationship>;
  /** The definition of the petition fields. */
  fields: Array<PetitionField>;
  /** The ID of the petition or template. */
  id: Scalars["GID"]["output"];
  isAnonymized: Scalars["Boolean"]["output"];
  /** Wether the completion message will be shown to the recipients or not. */
  isCompletingMessageEnabled: Scalars["Boolean"]["output"];
  /** Indicates whether delegate access is enabled for the recipient */
  isDelegateAccessEnabled: Scalars["Boolean"]["output"];
  isDocumentGenerationEnabled: Scalars["Boolean"]["output"];
  isInteractionWithRecipientsEnabled: Scalars["Boolean"]["output"];
  /**
   * Whether the contents card is hidden in the recipient view.
   * @deprecated Don't use this
   */
  isRecipientViewContentsHidden: Scalars["Boolean"]["output"];
  isRestricted: Scalars["Boolean"]["output"];
  isRestrictedWithPassword: Scalars["Boolean"]["output"];
  isReviewFlowEnabled: Scalars["Boolean"]["output"];
  /** @deprecated  */
  lastActivityAt: Maybe<Scalars["DateTime"]["output"]>;
  /** Time when the petition or any of its relations were last updated. */
  lastChangeAt: Scalars["DateTime"]["output"];
  /** @deprecated  */
  lastRecipientActivityAt: Maybe<Scalars["DateTime"]["output"]>;
  /** The locale of the parallel. */
  locale: PetitionLocale;
  /** Metadata for this petition. */
  metadata: Scalars["JSONObject"]["output"];
  /** The effective permission of the logged user. Will return null if the user doesn't have access to the petition (e.g. on public templates). */
  myEffectivePermission: Maybe<EffectivePetitionUserPermission>;
  /** The name of the petition. */
  name: Maybe<Scalars["String"]["output"]>;
  organization: Organization;
  owner: User;
  path: Scalars["String"]["output"];
  /** The permissions linked to the petition */
  permissions: Array<PetitionPermission>;
  /** The reminders configuration for the petition. */
  remindersConfig: Maybe<RemindersConfig>;
  selectedDocumentTheme: OrganizationTheme;
  /** The signature configuration for the petition. */
  signatureConfig: Maybe<SignatureConfig>;
  /** Whether to skip the forward security check on the recipient view. */
  skipForwardSecurity: Scalars["Boolean"]["output"];
  /** Lists every available standard list to be used in field logic conditions */
  standardListDefinitions: Array<StandardListDefinition>;
  /** The tags linked to the petition */
  tags: Array<Tag>;
  /** The preferred tone of organization. */
  tone: Tone;
  type: PetitionBaseType;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
  variables: Array<PetitionVariable>;
  variablesResult: Array<PetitionVariableResult>;
};

export type PetitionBaseMini = {
  currentSignatureRequest: Maybe<PetitionSignatureRequestMini>;
  full: Maybe<PetitionBase>;
  /** The ID of the petition or template. */
  id: Scalars["GID"]["output"];
  /** Whether the template is publicly available or not */
  isPublicTemplate: Maybe<Scalars["Boolean"]["output"]>;
  lastActivityAt: Maybe<Scalars["DateTime"]["output"]>;
  /** The effective permission of the logged user. Will return null if the user doesn't have access to the petition (e.g. on public templates). */
  myEffectivePermission: Maybe<EffectivePetitionUserPermission>;
  /** The name of the petition. */
  name: Maybe<Scalars["String"]["output"]>;
  /** The status of the petition. */
  status: Maybe<PetitionStatus>;
  type: PetitionBaseType;
};

export type PetitionBaseOrFolder = Petition | PetitionFolder | PetitionTemplate;

export type PetitionBaseOrFolderPagination = {
  /** The requested slice of items. */
  items: Array<PetitionBaseOrFolder>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type PetitionBaseType = "PETITION" | "TEMPLATE";

export type PetitionClonedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type PetitionClosedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type PetitionClosedNotifiedEvent = PetitionEvent & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  /** The email message on HTML format. */
  emailBody: Maybe<Scalars["String"]["output"]>;
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
  user: Maybe<User>;
};

/** A file attachment on the petition field comment */
export type PetitionCommentAttachment = CreatedAt & {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  file: FileUpload;
  id: Scalars["GID"]["output"];
};

export type PetitionCompletedEvent = PetitionEvent & {
  completedBy: Maybe<UserOrPetitionAccess>;
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
};

export type PetitionCompletedUserNotification = PetitionUserNotification & {
  completedBy: Maybe<UserOrPetitionAccess>;
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  isRead: Scalars["Boolean"]["output"];
  petition: PetitionBase;
};

export type PetitionCreatedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type PetitionCustomList = {
  name: Scalars["String"]["output"];
  values: Array<Scalars["String"]["output"]>;
};

export type PetitionDeletedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
};

export type PetitionDisassociatedEvent = ProfileEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  disassociatedBy: Maybe<UserOrPetitionAccess>;
  id: Scalars["GID"]["output"];
  profile: Maybe<Profile>;
  type: ProfileEventType;
  user: Maybe<User>;
};

export type PetitionEvent = {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
};

export type PetitionEventPagination = {
  /** The requested slice of items. */
  items: Array<PetitionEvent>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type PetitionEventSubscription = EventSubscription & {
  eventTypes: Maybe<Array<PetitionEventType>>;
  eventsUrl: Scalars["String"]["output"];
  fromTemplate: Maybe<PetitionBaseMini>;
  fromTemplateFields: Maybe<Array<PetitionFieldMini>>;
  id: Scalars["GID"]["output"];
  ignoreOwnerEvents: Scalars["Boolean"]["output"];
  isEnabled: Scalars["Boolean"]["output"];
  isFailing: Scalars["Boolean"]["output"];
  name: Maybe<Scalars["String"]["output"]>;
  signatureKeys: Array<EventSubscriptionSignatureKey>;
};

export type PetitionEventType =
  | "ACCESS_ACTIVATED"
  | "ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK"
  | "ACCESS_DEACTIVATED"
  | "ACCESS_DELEGATED"
  | "ACCESS_OPENED"
  | "COMMENT_DELETED"
  | "COMMENT_PUBLISHED"
  | "CONTACTLESS_ACCESS_USED"
  | "GROUP_PERMISSION_ADDED"
  | "GROUP_PERMISSION_EDITED"
  | "GROUP_PERMISSION_REMOVED"
  | "MESSAGE_CANCELLED"
  | "MESSAGE_SCHEDULED"
  | "MESSAGE_SENT"
  | "OWNERSHIP_TRANSFERRED"
  | "PETITION_ANONYMIZED"
  | "PETITION_APPROVAL_REQUEST_STEP_APPROVED"
  | "PETITION_APPROVAL_REQUEST_STEP_CANCELED"
  | "PETITION_APPROVAL_REQUEST_STEP_FINISHED"
  | "PETITION_APPROVAL_REQUEST_STEP_REJECTED"
  | "PETITION_APPROVAL_REQUEST_STEP_REMINDER"
  | "PETITION_APPROVAL_REQUEST_STEP_SKIPPED"
  | "PETITION_APPROVAL_REQUEST_STEP_STARTED"
  | "PETITION_CLONED"
  | "PETITION_CLOSED"
  | "PETITION_CLOSED_NOTIFIED"
  | "PETITION_COMPLETED"
  | "PETITION_CREATED"
  | "PETITION_DELETED"
  | "PETITION_MESSAGE_BOUNCED"
  | "PETITION_REMINDER_BOUNCED"
  | "PETITION_REOPENED"
  | "PETITION_TAGGED"
  | "PETITION_UNTAGGED"
  | "PROFILE_ASSOCIATED"
  | "PROFILE_DISASSOCIATED"
  | "RECIPIENT_SIGNED"
  | "REMINDERS_OPT_OUT"
  | "REMINDER_SENT"
  | "REPLY_CREATED"
  | "REPLY_DELETED"
  | "REPLY_STATUS_CHANGED"
  | "REPLY_UPDATED"
  | "SIGNATURE_CANCELLED"
  | "SIGNATURE_COMPLETED"
  | "SIGNATURE_DELIVERED"
  | "SIGNATURE_OPENED"
  | "SIGNATURE_REMINDER"
  | "SIGNATURE_STARTED"
  | "TEMPLATE_USED"
  | "USER_PERMISSION_ADDED"
  | "USER_PERMISSION_EDITED"
  | "USER_PERMISSION_REMOVED";

/** A field within a petition. */
export type PetitionField = {
  /** The alias of the petition field. */
  alias: Maybe<Scalars["String"]["output"]>;
  /** A list of files attached to this field. */
  attachments: Array<PetitionFieldAttachment>;
  /** The children of this field. */
  children: Maybe<Array<PetitionField>>;
  commentCount: Scalars["Int"]["output"];
  /** The comments for this field. */
  comments: Array<PetitionFieldComment>;
  /** The description of the petition field. */
  description: Maybe<Scalars["String"]["output"]>;
  /** The field GID used from which this field was cloned */
  fromPetitionFieldId: Maybe<Scalars["GID"]["output"]>;
  hasCommentsEnabled: Scalars["Boolean"]["output"];
  /** The ID of the petition field. */
  id: Scalars["GID"]["output"];
  isChild: Scalars["Boolean"]["output"];
  /** Determines if the field can be moved or deleted. */
  isFixed: Scalars["Boolean"]["output"];
  /** Determines if the field is visible by the recipients. */
  isInternal: Scalars["Boolean"]["output"];
  isLinkedToProfileType: Scalars["Boolean"]["output"];
  isLinkedToProfileTypeField: Scalars["Boolean"]["output"];
  /** Determines if the field accepts replies */
  isReadOnly: Scalars["Boolean"]["output"];
  /** The last comment from this field. */
  lastComment: Maybe<PetitionFieldComment>;
  /** A JSON object representing the math to be performed on the field */
  math: Maybe<Array<Scalars["JSONObject"]["output"]>>;
  /** Determines if this field allows multiple replies. */
  multiple: Scalars["Boolean"]["output"];
  /** Determines if this field is optional. */
  optional: Scalars["Boolean"]["output"];
  /** The options of the petition field. */
  options: Scalars["JSONObject"]["output"];
  parent: Maybe<PetitionField>;
  petition: PetitionBase;
  position: Scalars["Int"]["output"];
  profileType: Maybe<ProfileType>;
  profileTypeField: Maybe<ProfileTypeField>;
  /** The replies to the petition field */
  replies: Array<PetitionFieldReply>;
  /** Determines if the field requires approval. */
  requireApproval: Scalars["Boolean"]["output"];
  /** Determines if the field last activity is visible in PDF export. */
  showActivityInPdf: Scalars["Boolean"]["output"];
  /** Determines if the field is visible in PDF export. */
  showInPdf: Scalars["Boolean"]["output"];
  /** The title of the petition field. */
  title: Maybe<Scalars["String"]["output"]>;
  /** The type of the petition field. */
  type: PetitionFieldType;
  unreadCommentCount: Scalars["Int"]["output"];
  /** A JSON object representing the conditions for the field to be visible */
  visibility: Maybe<Scalars["JSONObject"]["output"]>;
};

/** A file attachment on the petition */
export type PetitionFieldAttachment = CreatedAt & {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  field: PetitionField;
  file: FileUpload;
  id: Scalars["GID"]["output"];
};

export type PetitionFieldAttachmentUploadData = {
  attachment: PetitionFieldAttachment;
  presignedPostData: AWSPresignedPostData;
};

/** A comment on a petition field */
export type PetitionFieldComment = {
  approvalMetadata: Maybe<Scalars["JSONObject"]["output"]>;
  /** A list of files attached to this comment. */
  attachments: Array<PetitionCommentAttachment>;
  /** The author of the comment. */
  author: Maybe<UserOrPetitionAccess>;
  /** The JSON content of the comment. */
  content: Maybe<Scalars["JSON"]["output"]>;
  /** The HTML content of the comment. */
  contentHtml: Maybe<Scalars["String"]["output"]>;
  /** Time when the comment was created. */
  createdAt: Scalars["DateTime"]["output"];
  /** The HTML content of the comment. */
  excerptHtml: Maybe<Scalars["String"]["output"]>;
  field: Maybe<PetitionField>;
  /** The ID of the petition field comment. */
  id: Scalars["GID"]["output"];
  isAnonymized: Scalars["Boolean"]["output"];
  /** Whether the comment is part of approval process (only visible to org users and cannot be deleted or edited) */
  isApproval: Scalars["Boolean"]["output"];
  /** Whether the comment has been edited after being published. */
  isEdited: Scalars["Boolean"]["output"];
  /** Whether the comment is internal (only visible to org users) or public (visible for users and accesses) */
  isInternal: Scalars["Boolean"]["output"];
  /** Whether the comment has been read or not. */
  isUnread: Scalars["Boolean"]["output"];
  /** The mentions of the comments. */
  mentions: Array<PetitionFieldCommentMention>;
  petition: PetitionBase;
};

export type PetitionFieldCommentMention =
  | PetitionFieldCommentUserGroupMention
  | PetitionFieldCommentUserMention;

/** A user group mention on a petition field comment */
export type PetitionFieldCommentUserGroupMention = {
  mentionedId: Scalars["GID"]["output"];
  userGroup: Maybe<UserGroup>;
};

/** A user mention on a petition field comment */
export type PetitionFieldCommentUserMention = {
  mentionedId: Scalars["GID"]["output"];
  user: Maybe<User>;
};

/** References the replies of a FIELD_GROUP field on a specific field and group */
export type PetitionFieldGroupChildReply = {
  field: PetitionField;
  replies: Array<PetitionFieldReply>;
};

export type PetitionFieldGroupRelationship = {
  id: Scalars["GID"]["output"];
  leftSidePetitionField: PetitionField;
  relationshipTypeWithDirection: ProfileRelationshipTypeWithDirection;
  rightSidePetitionField: PetitionField;
};

export type PetitionFieldMini = {
  /** The ID of the petition field. */
  id: Scalars["GID"]["output"];
  /** The options of the petition field. */
  options: Scalars["JSONObject"]["output"];
  /** The title of the petition field. */
  title: Maybe<Scalars["String"]["output"]>;
  /** The type of the petition field. */
  type: PetitionFieldType;
};

export type PetitionFieldOrPetition = Petition | PetitionField;

/** The progress of the petition */
export type PetitionFieldProgress = {
  /** Number of fields approved */
  approved: Scalars["Int"]["output"];
  /** Number of optional fields not replied or approved */
  optional: Scalars["Int"]["output"];
  /** Number of fields with a reply and not approved */
  replied: Scalars["Int"]["output"];
  /** Total number of fields in the petition */
  total: Scalars["Int"]["output"];
};

/** A reply to a petition field */
export type PetitionFieldReply = Timestamps & {
  associatedProfile: Maybe<Profile>;
  children: Maybe<Array<PetitionFieldGroupChildReply>>;
  /** The content of the reply. */
  content: Scalars["JSONObject"]["output"];
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  /** The petition field for this reply. */
  field: Maybe<PetitionField>;
  /** The ID of the petition field reply. */
  id: Scalars["GID"]["output"];
  isAnonymized: Scalars["Boolean"]["output"];
  /** When the reply was reviewed. */
  lastReviewedAt: Maybe<Scalars["DateTime"]["output"]>;
  /** The person that reviewed the reply. */
  lastReviewedBy: Maybe<User>;
  /** Metadata for this reply. */
  metadata: Scalars["JSONObject"]["output"];
  parent: Maybe<PetitionFieldReply>;
  /** When the reply was created or last updated */
  repliedAt: Maybe<Scalars["DateTime"]["output"]>;
  /** The person that created the reply or the last person that edited the reply. */
  repliedBy: Maybe<UserOrPetitionAccess>;
  /** The status of the reply. */
  status: PetitionFieldReplyStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
  /** The last updater of the field reply. */
  updatedBy: Maybe<UserOrPetitionAccess>;
};

/** The status of a petition. */
export type PetitionFieldReplyStatus =
  /** The reply has been approved. */
  | "APPROVED"
  /** The reply has not been approved or rejected. */
  | "PENDING"
  /** The reply has been rejected. */
  | "REJECTED";

/** Type of a petition field */
export type PetitionFieldType =
  /** Run a background check of entities */
  | "BACKGROUND_CHECK"
  /** A options list. */
  | "CHECKBOX"
  /** A datepicker field. */
  | "DATE"
  /** A datepicker with time and timezone field. */
  | "DATE_TIME"
  /** A saerch in Dow Jones field. */
  | "DOW_JONES_KYC"
  /** A dynamic select field. */
  | "DYNAMIC_SELECT"
  /** A tax documents/info field. */
  | "ES_TAX_DOCUMENTS"
  /** A group of fields */
  | "FIELD_GROUP"
  /** A file upload field. */
  | "FILE_UPLOAD"
  /** A heading field. */
  | "HEADING"
  /** A field for verification of identity documents */
  | "ID_VERIFICATION"
  /** A only numbers field. */
  | "NUMBER"
  /** A phone formatted field. */
  | "PHONE"
  /** A field for performing searches in the profiles database */
  | "PROFILE_SEARCH"
  /** A select field. */
  | "SELECT"
  /** A short text field. */
  | "SHORT_TEXT"
  /** A text field. */
  | "TEXT";

export type PetitionFilter = {
  approvals?: InputMaybe<PetitionApprovalsFilterInput>;
  fromTemplateId?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  locale?: InputMaybe<PetitionLocale>;
  path?: InputMaybe<Scalars["String"]["input"]>;
  permissionTypes?: InputMaybe<Array<PetitionPermissionType>>;
  sharedWith?: InputMaybe<PetitionSharedWithFilter>;
  signature?: InputMaybe<Array<PetitionSignatureStatusFilter>>;
  status?: InputMaybe<Array<PetitionStatus>>;
  tags?: InputMaybe<PetitionTagFilter>;
  type?: InputMaybe<PetitionBaseType>;
};

export type PetitionFolder = {
  /** The ID of the petition folder. */
  id: Scalars["ID"]["output"];
  /** The lowest permission the user has in the petitions inside the folder. */
  minimumPermissionType: PetitionPermissionType;
  /** The name of the folder. */
  name: Scalars["String"]["output"];
  /** The full path of the folder. */
  path: Scalars["String"]["output"];
  /** The name petitions in the folder. */
  petitionCount: Scalars["Int"]["output"];
};

export type PetitionListView = ListView & {
  data: PetitionListViewData;
  id: Scalars["GID"]["output"];
  isDefault: Scalars["Boolean"]["output"];
  name: Scalars["String"]["output"];
  type: ListViewType;
  user: User;
};

export type PetitionListViewColumn =
  | "approvals"
  | "createdAt"
  | "fromTemplateId"
  | "lastActivityAt"
  | "lastRecipientActivityAt"
  | "name"
  | "recipients"
  | "reminders"
  | "sentAt"
  | "sharedWith"
  | "signature"
  | "status"
  | "tagsFilters";

export type PetitionListViewData = {
  approvals: Maybe<PetitionListViewDataApprovals>;
  columns: Maybe<Array<PetitionListViewColumn>>;
  fromTemplateId: Maybe<Array<Scalars["GID"]["output"]>>;
  path: Scalars["String"]["output"];
  search: Maybe<Scalars["String"]["output"]>;
  searchIn: PetitionListViewSearchIn;
  sharedWith: Maybe<PetitionListViewDataSharedWith>;
  signature: Maybe<Array<PetitionSignatureStatusFilter>>;
  sort: Maybe<PetitionListViewSort>;
  status: Maybe<Array<PetitionStatus>>;
  tagsFilters: Maybe<PetitionListViewDataTags>;
};

export type PetitionListViewDataApprovals = {
  filters: Array<PetitionListViewDataApprovalsFilters>;
  operator: PetitionApprovalsFilterLogicalOperator;
};

export type PetitionListViewDataApprovalsFilters = {
  operator: PetitionApprovalsFilterOperator;
  value: Scalars["String"]["output"];
};

export type PetitionListViewDataInput = {
  approvals?: InputMaybe<PetitionApprovalsFilterInput>;
  columns?: InputMaybe<Array<PetitionListViewColumn>>;
  fromTemplateId?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  path?: InputMaybe<Scalars["String"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  searchIn?: InputMaybe<PetitionListViewSearchIn>;
  sharedWith?: InputMaybe<PetitionSharedWithFilter>;
  signature?: InputMaybe<Array<PetitionSignatureStatusFilter>>;
  sort?: InputMaybe<PetitionListViewSortInput>;
  status?: InputMaybe<Array<PetitionStatus>>;
  tagsFilters?: InputMaybe<PetitionTagFilter>;
};

export type PetitionListViewDataSharedWith = {
  filters: Array<PetitionListViewDataSharedWithFilters>;
  operator: FilterSharedWithLogicalOperator;
};

export type PetitionListViewDataSharedWithFilters = {
  operator: FilterSharedWithOperator;
  value: Scalars["ID"]["output"];
};

export type PetitionListViewDataTags = {
  filters: Array<PetitionListViewDataTagsFilters>;
  operator: PetitionTagFilterLogicalOperator;
};

export type PetitionListViewDataTagsFilters = {
  operator: PetitionTagFilterLineOperator;
  value: Array<Scalars["GID"]["output"]>;
};

export type PetitionListViewSearchIn = "CURRENT_FOLDER" | "EVERYWHERE";

export type PetitionListViewSort = {
  direction: ListViewSortDirection;
  field: PetitionListViewSortField;
};

export type PetitionListViewSortField =
  | "createdAt"
  | "lastActivityAt"
  | "lastRecipientActivityAt"
  | "name"
  | "sentAt";

export type PetitionListViewSortInput = {
  direction: ListViewSortDirection;
  field: PetitionListViewSortField;
};

/** The locale used for rendering the petition to the contact. */
export type PetitionLocale = "ca" | "en" | "es" | "it" | "pt";

/** A petition message */
export type PetitionMessage = CreatedAt & {
  /** The access of this petition message. */
  access: PetitionAccess;
  /** Tells when the email bounced. */
  bouncedAt: Maybe<Scalars["DateTime"]["output"]>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  /** Tells when the email was delivered. */
  deliveredAt: Maybe<Scalars["DateTime"]["output"]>;
  /** The body of the petition message on HTML format. */
  emailBody: Maybe<Scalars["String"]["output"]>;
  /** The subject of the petition message. */
  emailSubject: Maybe<Scalars["JSON"]["output"]>;
  /** The ID of the petition message. */
  id: Scalars["GID"]["output"];
  isAnonymized: Scalars["Boolean"]["output"];
  /** Tells when the email was opened for the first time. */
  openedAt: Maybe<Scalars["DateTime"]["output"]>;
  /** Time at which the message will be sent. */
  scheduledAt: Maybe<Scalars["DateTime"]["output"]>;
  /** The sender of this petition message. */
  sender: User;
  /** If already sent, the date at which the email was sent. */
  sentAt: Maybe<Scalars["DateTime"]["output"]>;
  /** The status of the petition message */
  status: PetitionMessageStatus;
};

export type PetitionMessageBouncedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  message: PetitionMessage;
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
};

/** The status of a petition message. */
export type PetitionMessageStatus =
  /** The message was scheduled but has been cancelled. */
  | "CANCELLED"
  /** The message has been processed. */
  | "PROCESSED"
  /** The message is being processed. */
  | "PROCESSING"
  /** The message has been scheduled to be sent at a specific time. */
  | "SCHEDULED";

export type PetitionPagination = {
  /** The requested slice of items. */
  items: Array<Petition>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type PetitionPermission = {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  /** wether user is subscribed or not to emails and alerts of the petition */
  isSubscribed: Scalars["Boolean"]["output"];
  /** The type of the permission. */
  permissionType: PetitionPermissionType;
  /** The petition linked to the permission. */
  petition: PetitionBase;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
};

/** The type of permission for a petition user. */
export type PetitionPermissionType = "OWNER" | "READ" | "WRITE";

/** The READ and WRITE permissions for a petition user. */
export type PetitionPermissionTypeRW = "READ" | "WRITE";

export type PetitionProfile = {
  id: Scalars["GID"]["output"];
  petition: Petition;
  profile: Profile;
};

/** The progress of a petition. */
export type PetitionProgress = {
  /** The progress of the petition exlude internal fields. */
  external: PetitionFieldProgress;
  /** The progress of the petition include internal fields. */
  internal: PetitionFieldProgress;
};

export type PetitionReminder = CreatedAt & {
  /** The access of this petition message. */
  access: PetitionAccess;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  /** The body of the message in HTML format. */
  emailBody: Maybe<Scalars["String"]["output"]>;
  id: Scalars["GID"]["output"];
  /** The sender of this petition message. */
  sender: Maybe<User>;
  /** The type of the reminder. */
  type: PetitionReminderType;
};

export type PetitionReminderBouncedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  reminder: PetitionReminder;
  type: PetitionEventType;
};

/** The type of a petition reminder. */
export type PetitionReminderType =
  /** The reminder has been sent by the system according to the reminders configuration. */
  | "AUTOMATIC"
  /** The reminder has been sent manually by a user. */
  | "MANUAL";

export type PetitionReopenedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type PetitionSharedUserNotification = PetitionUserNotification & {
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  isRead: Scalars["Boolean"]["output"];
  owner: User;
  permissionType: PetitionPermissionTypeRW;
  petition: PetitionBase;
  sharedWith: Maybe<UserOrUserGroup>;
};

export type PetitionSharedWithFilter = {
  filters: Array<PetitionSharedWithFilterLine>;
  operator: FilterSharedWithLogicalOperator;
};

export type PetitionSharedWithFilterLine = {
  operator: FilterSharedWithOperator;
  value: Scalars["ID"]["input"];
};

export type PetitionSharingInfo = {
  /** The effective permissions on the petition */
  firstPetitionEffectivePermissions: Array<EffectivePetitionUserPermission>;
  firstPetitionPermissions: Array<PetitionPermission>;
  ownedCount: Scalars["Int"]["output"];
  ownedOrWriteIds: Array<Scalars["GID"]["output"]>;
  readPetitions: Array<PetitionBase>;
  totalCount: Scalars["Int"]["output"];
};

export type PetitionSignatureCancelReason =
  | "CANCELLED_BY_USER"
  | "DECLINED_BY_SIGNER"
  | "REQUEST_ERROR"
  | "REQUEST_EXPIRED"
  | "REQUEST_RESTARTED";

export type PetitionSignatureRequest = Timestamps & {
  auditTrailFilename: Maybe<Scalars["String"]["output"]>;
  cancelReason: Maybe<Scalars["String"]["output"]>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  /** The environment of the petition signature. */
  environment: SignatureOrgIntegrationEnvironment;
  errorCode: Maybe<Scalars["String"]["output"]>;
  errorMessage: Maybe<Scalars["String"]["output"]>;
  extraErrorData: Maybe<Scalars["JSON"]["output"]>;
  id: Scalars["GID"]["output"];
  isAnonymized: Scalars["Boolean"]["output"];
  /** Metadata for this signature request. */
  metadata: Scalars["JSONObject"]["output"];
  petition: Petition;
  /** The signature configuration for the request. */
  signatureConfig: SignatureConfig;
  signedDocumentFilename: Maybe<Scalars["String"]["output"]>;
  signerStatus: Array<PetitionSignatureRequestSignerStatus>;
  /** The status of the petition signature. */
  status: PetitionSignatureRequestStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
};

export type PetitionSignatureRequestMini = {
  id: Scalars["GID"]["output"];
  /** The status of the petition signature. */
  status: PetitionSignatureRequestStatus;
};

export type PetitionSignatureRequestSignerStatus = {
  bouncedAt: Maybe<Scalars["DateTime"]["output"]>;
  declinedAt: Maybe<Scalars["DateTime"]["output"]>;
  openedAt: Maybe<Scalars["DateTime"]["output"]>;
  sentAt: Maybe<Scalars["DateTime"]["output"]>;
  signedAt: Maybe<Scalars["DateTime"]["output"]>;
  signer: PetitionSigner;
  /** The signing status of the individual contact. */
  status: Scalars["String"]["output"];
};

export type PetitionSignatureRequestStatus =
  | "CANCELLED"
  | "CANCELLING"
  | "COMPLETED"
  | "ENQUEUED"
  | "PROCESSED"
  | "PROCESSING";

/** Filters petitions by the status of its latest eSignature request. */
export type PetitionSignatureStatusFilter =
  /** Petitions with cancelled eSignatures. Request errors, user cancels, signer declines, etc... */
  | "CANCELLED"
  /** Petition with eSignature completed. Every signer signed the document. */
  | "COMPLETED"
  /** Petitions with configured eSignature that have not yet been started (petition is PENDING). */
  | "NOT_STARTED"
  /** Petitions with no eSignature configured and no past eSignature requests. */
  | "NO_SIGNATURE"
  /** Completed petitions with configured signatures to be started after user reviews the replies. Need to manually start the eSignature. */
  | "PENDING_START"
  /** Petitions with ongoing eSignature process. Awaiting for the signers to sign the document. */
  | "PROCESSING";

/** Information about a signer of the petition */
export type PetitionSigner = {
  contactId: Maybe<Scalars["GID"]["output"]>;
  email: Scalars["String"]["output"];
  firstName: Scalars["String"]["output"];
  fullName: Scalars["String"]["output"];
  isPreset: Scalars["Boolean"]["output"];
  lastName: Maybe<Scalars["String"]["output"]>;
};

/** The status of a petition. */
export type PetitionStatus =
  /** The petition has been closed by a user. */
  | "CLOSED"
  /** The petition has been completed. */
  | "COMPLETED"
  /** The petition has not been sent yet. */
  | "DRAFT"
  /** The petition has been sent and is awaiting completion. */
  | "PENDING";

export type PetitionTagFilter = {
  filters: Array<PetitionTagFilterLine>;
  operator: PetitionTagFilterLogicalOperator;
};

export type PetitionTagFilterLine = {
  operator: PetitionTagFilterLineOperator;
  value: Array<Scalars["GID"]["input"]>;
};

export type PetitionTagFilterLineOperator = "CONTAINS" | "DOES_NOT_CONTAIN" | "IS_EMPTY";

export type PetitionTagFilterLogicalOperator = "AND" | "OR";

export type PetitionTaggedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  tags: Array<Maybe<Tag>>;
  type: PetitionEventType;
  user: Maybe<User>;
};

/** A petition template */
export type PetitionTemplate = PetitionBase & {
  /** How many months to wait since the petition is closed to anonymize. */
  anonymizeAfterMonths: Maybe<Scalars["Int"]["output"]>;
  /** Purpose of the anonymization */
  anonymizePurpose: Maybe<Scalars["String"]["output"]>;
  approvalFlowConfig: Maybe<Array<ApprovalFlowConfig>>;
  /** The attachments linked to this petition */
  attachmentsList: PetitionAttachmentsList;
  /** The automatic numbering settings of the petition. */
  automaticNumberingConfig: Maybe<AutomaticNumberingConfig>;
  backgroundColor: Maybe<Scalars["String"]["output"]>;
  categories: Maybe<Array<Scalars["String"]["output"]>>;
  /** The closing email body of the petition. */
  closingEmailBody: Maybe<Scalars["JSON"]["output"]>;
  /** The body of the optional completing message to be show to recipients */
  completingMessageBody: Maybe<Scalars["JSON"]["output"]>;
  /** The subject of the optional completing message to be show to recipients */
  completingMessageSubject: Maybe<Scalars["String"]["output"]>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  customLists: Array<PetitionCustomList>;
  /** Custom user properties */
  customProperties: Scalars["JSONObject"]["output"];
  defaultOnBehalf: Maybe<User>;
  defaultPath: Scalars["String"]["output"];
  defaultPermissions: Array<TemplateDefaultPermission>;
  /** Description of the template. */
  description: Maybe<Scalars["JSON"]["output"]>;
  /** HTML description of the template. */
  descriptionHtml: Maybe<Scalars["String"]["output"]>;
  /** The default effective permissions on the template */
  effectiveDefaultPermissions: Array<EffectivePetitionUserPermission>;
  /** The effective permissions on the petition */
  effectivePermissions: Array<EffectivePetitionUserPermission>;
  /** The body of the petition. */
  emailBody: Maybe<Scalars["JSON"]["output"]>;
  /** The subject of the petition. */
  emailSubject: Maybe<Scalars["String"]["output"]>;
  /** The number of fields in the petition. */
  fieldCount: Scalars["Int"]["output"];
  fieldRelationships: Array<PetitionFieldGroupRelationship>;
  /** The definition of the petition fields. */
  fields: Array<PetitionField>;
  /** The ID of the petition or template. */
  id: Scalars["GID"]["output"];
  imageUrl: Maybe<Scalars["String"]["output"]>;
  isAnonymized: Scalars["Boolean"]["output"];
  /** Wether the completion message will be shown to the recipients or not. */
  isCompletingMessageEnabled: Scalars["Boolean"]["output"];
  /** Indicates whether delegate access is enabled for the recipient */
  isDelegateAccessEnabled: Scalars["Boolean"]["output"];
  isDocumentGenerationEnabled: Scalars["Boolean"]["output"];
  isInteractionWithRecipientsEnabled: Scalars["Boolean"]["output"];
  /** Whether the template is publicly available or not */
  isPublic: Scalars["Boolean"]["output"];
  /**
   * Whether the contents card is hidden in the recipient view.
   * @deprecated Don't use this
   */
  isRecipientViewContentsHidden: Scalars["Boolean"]["output"];
  isRestricted: Scalars["Boolean"]["output"];
  isRestrictedWithPassword: Scalars["Boolean"]["output"];
  isReviewFlowEnabled: Scalars["Boolean"]["output"];
  /** @deprecated  */
  lastActivityAt: Maybe<Scalars["DateTime"]["output"]>;
  /** Time when the petition or any of its relations were last updated. */
  lastChangeAt: Scalars["DateTime"]["output"];
  /** @deprecated  */
  lastRecipientActivityAt: Maybe<Scalars["DateTime"]["output"]>;
  /** The locale of the parallel. */
  locale: PetitionLocale;
  /** Metadata for this petition. */
  metadata: Scalars["JSONObject"]["output"];
  /** The effective permission of the logged user. Will return null if the user doesn't have access to the petition (e.g. on public templates). */
  myEffectivePermission: Maybe<EffectivePetitionUserPermission>;
  /** The name of the petition. */
  name: Maybe<Scalars["String"]["output"]>;
  organization: Organization;
  owner: User;
  path: Scalars["String"]["output"];
  /** The permissions linked to the petition */
  permissions: Array<PetitionPermission>;
  /** The public link linked to this template */
  publicLink: Maybe<PublicPetitionLink>;
  /** The reminders configuration for the petition. */
  remindersConfig: Maybe<RemindersConfig>;
  selectedDocumentTheme: OrganizationTheme;
  /** The signature configuration for the petition. */
  signatureConfig: Maybe<SignatureConfig>;
  /** Whether to skip the forward security check on the recipient view. */
  skipForwardSecurity: Scalars["Boolean"]["output"];
  /** Lists every available standard list to be used in field logic conditions */
  standardListDefinitions: Array<StandardListDefinition>;
  /** The tags linked to the petition */
  tags: Array<Tag>;
  /** The preferred tone of organization. */
  tone: Tone;
  type: PetitionBaseType;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
  variables: Array<PetitionVariable>;
  variablesResult: Array<PetitionVariableResult>;
};

/** A petition template */
export type PetitionTemplateimageUrlArgs = {
  options?: InputMaybe<ImageOptions>;
};

export type PetitionUntaggedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  tags: Array<Maybe<Tag>>;
  type: PetitionEventType;
  user: Maybe<User>;
};

/** The permission for a petition and user group */
export type PetitionUserGroupPermission = PetitionPermission &
  Timestamps & {
    /** Time when the resource was created. */
    createdAt: Scalars["DateTime"]["output"];
    /** The group linked to the permission */
    group: UserGroup;
    /** wether user is subscribed or not to emails and alerts of the petition */
    isSubscribed: Scalars["Boolean"]["output"];
    /** The type of the permission. */
    permissionType: PetitionPermissionType;
    /** The petition linked to the permission. */
    petition: PetitionBase;
    /** Time when the resource was last updated. */
    updatedAt: Scalars["DateTime"]["output"];
  };

export type PetitionUserNotification = {
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  isRead: Scalars["Boolean"]["output"];
  petition: PetitionBase;
};

/** The types of notifications available for filtering */
export type PetitionUserNotificationFilter =
  | "ALL"
  | "COMMENTS"
  | "COMPLETED"
  | "OTHER"
  | "SHARED"
  | "UNREAD";

/** The permission for a petition and user */
export type PetitionUserPermission = PetitionPermission &
  Timestamps & {
    /** Time when the resource was created. */
    createdAt: Scalars["DateTime"]["output"];
    /** wether user is subscribed or not to emails and alerts of the petition */
    isSubscribed: Scalars["Boolean"]["output"];
    /** The type of the permission. */
    permissionType: PetitionPermissionType;
    /** The petition linked to the permission. */
    petition: PetitionBase;
    /** Time when the resource was last updated. */
    updatedAt: Scalars["DateTime"]["output"];
    /** The user linked to the permission */
    user: User;
  };

export type PetitionVariable = {
  defaultValue: Scalars["Float"]["output"];
  name: Scalars["String"]["output"];
};

export type PetitionVariableResult = {
  name: Scalars["String"]["output"];
  value: Maybe<Scalars["Float"]["output"]>;
};

export type PetitionsNumberDashboardModuleSettingsInput = {
  filters: PetitionFilter;
};

export type PetitionsPieChartDashboardModuleSettingsInput = {
  graphicType: DashboardPieChartModuleSettingsType;
  items: Array<PetitionsPieChartDashboardModuleSettingsItemInput>;
};

export type PetitionsPieChartDashboardModuleSettingsItemInput = {
  color: Scalars["String"]["input"];
  filter: PetitionFilter;
  label: Scalars["String"]["input"];
};

export type PetitionsRatioDashboardModuleSettingsInput = {
  filters: Array<PetitionFilter>;
  graphicType: DashboardRatioModuleSettingsType;
};

export type Profile = Timestamps & {
  associatedPetitions: PetitionPagination;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  /** The events for the profile. */
  events: ProfileEventPagination;
  id: Scalars["GID"]["output"];
  localizableName: Scalars["LocalizableUserText"]["output"];
  name: Scalars["String"]["output"];
  permanentDeletionAt: Maybe<Scalars["DateTime"]["output"]>;
  profileType: ProfileType;
  properties: Array<ProfileFieldProperty>;
  relationships: Array<ProfileRelationship>;
  status: ProfileStatus;
  subscribers: Array<ProfileSubscription>;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
};

export type ProfileassociatedPetitionsArgs = {
  filters?: InputMaybe<ProfileAssociatedPetitionFilter>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ProfileeventsArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ProfilepropertiesArgs = {
  filter?: InputMaybe<Array<ProfileFieldPropertyFilter>>;
};

export type ProfilerelationshipsArgs = {
  filter?: InputMaybe<Array<ProfileRelationshipFilter>>;
};

export type ProfileAnonymizedEvent = ProfileEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  profile: Maybe<Profile>;
  type: ProfileEventType;
};

export type ProfileAssociatedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  profile: Maybe<Profile>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type ProfileAssociatedPetitionFilter = {
  fromTemplateId?: InputMaybe<Array<Scalars["GID"]["input"]>>;
};

export type ProfileClosedEvent = ProfileEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  profile: Maybe<Profile>;
  type: ProfileEventType;
  user: Maybe<User>;
};

export type ProfileCreatedEvent = ProfileEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  profile: Maybe<Profile>;
  type: ProfileEventType;
  user: Maybe<User>;
};

export type ProfileDisassociatedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  disassociatedBy: Maybe<UserOrPetitionAccess>;
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  profile: Maybe<Profile>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type ProfileEvent = {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  profile: Maybe<Profile>;
  type: ProfileEventType;
};

export type ProfileEventPagination = {
  /** The requested slice of items. */
  items: Array<ProfileEvent>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type ProfileEventSubscription = EventSubscription & {
  eventTypes: Maybe<Array<ProfileEventType>>;
  eventsUrl: Scalars["String"]["output"];
  fromProfileType: Maybe<ProfileType>;
  fromProfileTypeFields: Maybe<Array<Maybe<ProfileTypeField>>>;
  id: Scalars["GID"]["output"];
  ignoreOwnerEvents: Scalars["Boolean"]["output"];
  isEnabled: Scalars["Boolean"]["output"];
  isFailing: Scalars["Boolean"]["output"];
  name: Maybe<Scalars["String"]["output"]>;
  signatureKeys: Array<EventSubscriptionSignatureKey>;
};

export type ProfileEventType =
  | "PETITION_ASSOCIATED"
  | "PETITION_DISASSOCIATED"
  | "PROFILE_ANONYMIZED"
  | "PROFILE_CLOSED"
  | "PROFILE_CREATED"
  | "PROFILE_FIELD_EXPIRY_UPDATED"
  | "PROFILE_FIELD_FILE_ADDED"
  | "PROFILE_FIELD_FILE_REMOVED"
  | "PROFILE_FIELD_VALUE_UPDATED"
  | "PROFILE_RELATIONSHIP_CREATED"
  | "PROFILE_RELATIONSHIP_REMOVED"
  | "PROFILE_REOPENED"
  | "PROFILE_SCHEDULED_FOR_DELETION"
  | "PROFILE_UPDATED";

export type ProfileExternalSourceConflictResolution = {
  action: ProfileExternalSourceConflictResolutionAction;
  profileTypeFieldId: Scalars["GID"]["input"];
};

export type ProfileExternalSourceConflictResolutionAction = "IGNORE" | "OVERWRITE";

export type ProfileExternalSourceOrgIntegration = IOrgIntegration & {
  id: Scalars["GID"]["output"];
  invalidCredentials: Scalars["Boolean"]["output"];
  /** Wether this integration is the default to be used if the user has more than one of the same type */
  isDefault: Scalars["Boolean"]["output"];
  /** URL of the integration logo */
  logoUrl: Maybe<Scalars["String"]["output"]>;
  /** Custom name of this integration, provided by the user */
  name: Scalars["String"]["output"];
  /** Returns a list with search parameters structure required to do a search on this external source provider */
  searchParams: Array<ProfileExternalSourceSearchParam>;
  /** Returns a list with profile types that can be used to perform searches on this external source provider */
  searchableProfileTypes: Array<ProfileType>;
  /** The type of the integration. */
  type: IntegrationType;
};

export type ProfileExternalSourceOrgIntegrationlogoUrlArgs = {
  options?: InputMaybe<ImageOptions>;
};

export type ProfileExternalSourceOrgIntegrationsearchParamsArgs = {
  locale: UserLocale;
  profileId?: InputMaybe<Scalars["GID"]["input"]>;
  profileTypeId: Scalars["GID"]["input"];
};

export type ProfileExternalSourceSearchMultipleResults = {
  results: ProfileExternalSourceSearchMultipleResultsDetail;
  totalCount: Scalars["Int"]["output"];
};

export type ProfileExternalSourceSearchMultipleResultsColumn = {
  key: Scalars["String"]["output"];
  label: Scalars["String"]["output"];
};

export type ProfileExternalSourceSearchMultipleResultsDetail = {
  columns: Array<ProfileExternalSourceSearchMultipleResultsColumn>;
  key: Scalars["String"]["output"];
  rows: Array<Scalars["JSONObject"]["output"]>;
};

export type ProfileExternalSourceSearchParam = {
  defaultValue: Maybe<Scalars["String"]["output"]>;
  key: Scalars["String"]["output"];
  label: Scalars["String"]["output"];
  minLength: Maybe<Scalars["Int"]["output"]>;
  options: Maybe<Array<ProfileExternalSourceSearchParamOption>>;
  placeholder: Maybe<Scalars["String"]["output"]>;
  required: Scalars["Boolean"]["output"];
  type: ProfileExternalSourceSearchParamType;
};

export type ProfileExternalSourceSearchParamOption = {
  label: Scalars["String"]["output"];
  value: Scalars["String"]["output"];
};

export type ProfileExternalSourceSearchParamType = "SELECT" | "TEXT";

export type ProfileExternalSourceSearchResults =
  | ProfileExternalSourceSearchMultipleResults
  | ProfileExternalSourceSearchSingleResult;

export type ProfileExternalSourceSearchSingleResult = {
  data: Array<ProfileExternalSourceSearchSingleResultData>;
  id: Scalars["GID"]["output"];
  profile: Maybe<Profile>;
};

export type ProfileExternalSourceSearchSingleResultData = {
  content: Maybe<Scalars["JSONObject"]["output"]>;
  profileTypeField: ProfileTypeField;
};

export type ProfileFieldExpiryUpdatedEvent = ProfileEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  profile: Maybe<Profile>;
  type: ProfileEventType;
  user: Maybe<User>;
};

export type ProfileFieldFile = ProfileFieldResponse & {
  /** Time when the response was anonymized. */
  anonymizedAt: Maybe<Scalars["DateTime"]["output"]>;
  /** Time when the response was created. */
  createdAt: Scalars["DateTime"]["output"];
  createdBy: Maybe<User>;
  /** Expiration datetime of the value, considering organization's timezone. */
  expiresAt: Maybe<Scalars["DateTime"]["output"]>;
  expiryDate: Maybe<Scalars["String"]["output"]>;
  field: ProfileTypeField;
  file: Maybe<FileUpload>;
  id: Scalars["GID"]["output"];
  profile: Profile;
  /** Time when the response was removed. */
  removedAt: Maybe<Scalars["DateTime"]["output"]>;
  removedBy: Maybe<User>;
};

export type ProfileFieldFileAddedEvent = ProfileEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  profile: Maybe<Profile>;
  type: ProfileEventType;
  user: Maybe<User>;
};

export type ProfileFieldFileRemovedEvent = ProfileEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  profile: Maybe<Profile>;
  type: ProfileEventType;
  user: Maybe<User>;
};

export type ProfileFieldFileWithUploadData = {
  file: ProfileFieldFile;
  presignedPostData: AWSPresignedPostData;
};

export type ProfileFieldProperty = {
  field: ProfileTypeField;
  files: Maybe<Array<ProfileFieldFile>>;
  profile: Profile;
  value: Maybe<ProfileFieldValue>;
};

export type ProfileFieldPropertyAndFileWithUploadData = {
  property: ProfileFieldProperty;
  uploads: Array<ProfileFieldFileWithUploadData>;
};

export type ProfileFieldPropertyFilter = {
  alias?: InputMaybe<Scalars["String"]["input"]>;
  profileTypeFieldId?: InputMaybe<Scalars["GID"]["input"]>;
};

export type ProfileFieldPropertyPagination = {
  /** The requested slice of items. */
  items: Array<ProfileFieldProperty>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type ProfileFieldResponse = {
  /** Time when the response was anonymized. */
  anonymizedAt: Maybe<Scalars["DateTime"]["output"]>;
  /** Time when the response was created. */
  createdAt: Scalars["DateTime"]["output"];
  createdBy: Maybe<User>;
  /** Expiration datetime of the value, considering organization's timezone. */
  expiresAt: Maybe<Scalars["DateTime"]["output"]>;
  expiryDate: Maybe<Scalars["String"]["output"]>;
  field: ProfileTypeField;
  profile: Profile;
  /** Time when the response was removed. */
  removedAt: Maybe<Scalars["DateTime"]["output"]>;
  removedBy: Maybe<User>;
};

export type ProfileFieldValue = ProfileFieldResponse & {
  /** Time when the response was anonymized. */
  anonymizedAt: Maybe<Scalars["DateTime"]["output"]>;
  content: Maybe<Scalars["JSONObject"]["output"]>;
  /** Time when the response was created. */
  createdAt: Scalars["DateTime"]["output"];
  createdBy: Maybe<User>;
  /** Expiration datetime of the value, considering organization's timezone. */
  expiresAt: Maybe<Scalars["DateTime"]["output"]>;
  expiryDate: Maybe<Scalars["String"]["output"]>;
  field: ProfileTypeField;
  id: Scalars["GID"]["output"];
  profile: Profile;
  /** Time when the response was removed. */
  removedAt: Maybe<Scalars["DateTime"]["output"]>;
  removedBy: Maybe<User>;
};

export type ProfileFieldValueUpdatedEvent = ProfileEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  profile: Maybe<Profile>;
  type: ProfileEventType;
  user: Maybe<User>;
};

export type ProfileFieldValuesFilter = {
  conditions?: InputMaybe<Array<ProfileFieldValuesFilter>>;
  logicalOperator?: InputMaybe<ProfileFieldValuesFilterGroupLogicalOperator>;
  operator?: InputMaybe<ProfileFieldValuesFilterOperator>;
  profileTypeFieldId?: InputMaybe<Scalars["GID"]["input"]>;
  value?: InputMaybe<Scalars["JSON"]["input"]>;
};

export type ProfileFieldValuesFilterGroupLogicalOperator = "AND" | "OR";

export type ProfileFieldValuesFilterOperator =
  | "CONTAIN"
  | "END_WITH"
  | "EQUAL"
  | "EXPIRES_IN"
  | "GREATER_THAN"
  | "GREATER_THAN_OR_EQUAL"
  | "HAS_ANY_BG_CHECK_TOPICS"
  | "HAS_BG_CHECK_MATCH"
  | "HAS_BG_CHECK_RESULTS"
  | "HAS_BG_CHECK_TOPICS"
  | "HAS_EXPIRY"
  | "HAS_VALUE"
  | "IS_EXPIRED"
  | "IS_ONE_OF"
  | "LESS_THAN"
  | "LESS_THAN_OR_EQUAL"
  | "NOT_CONTAIN"
  | "NOT_EQUAL"
  | "NOT_HAS_ANY_BG_CHECK_TOPICS"
  | "NOT_HAS_BG_CHECK_MATCH"
  | "NOT_HAS_BG_CHECK_RESULTS"
  | "NOT_HAS_BG_CHECK_TOPICS"
  | "NOT_HAS_EXPIRY"
  | "NOT_HAS_VALUE"
  | "NOT_IS_ONE_OF"
  | "START_WITH";

export type ProfileFilter = {
  profileId?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  profileTypeId?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  status?: InputMaybe<Array<ProfileStatus>>;
  values?: InputMaybe<ProfileFieldValuesFilter>;
};

export type ProfileListView = ListView & {
  data: ProfileListViewData;
  id: Scalars["GID"]["output"];
  isDefault: Scalars["Boolean"]["output"];
  name: Scalars["String"]["output"];
  profileType: ProfileType;
  type: ListViewType;
  user: User;
};

export type ProfileListViewData = {
  columns: Maybe<Array<Scalars["String"]["output"]>>;
  search: Maybe<Scalars["String"]["output"]>;
  sort: Maybe<ProfileListViewSort>;
  status: Maybe<ProfileStatus>;
  values: Maybe<Scalars["JSONObject"]["output"]>;
};

export type ProfileListViewDataInput = {
  /** Each column can refer to a profile property ID, or a built-in column: 'subscribers' or 'createdAt' */
  columns?: InputMaybe<Array<Scalars["String"]["input"]>>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  sort?: InputMaybe<ProfileListViewSortInput>;
  status?: InputMaybe<ProfileStatus>;
  values?: InputMaybe<ProfileFieldValuesFilter>;
};

export type ProfileListViewSort = {
  direction: ListViewSortDirection;
  field: ProfileListViewSortField;
};

export type ProfileListViewSortField = "createdAt" | "name";

export type ProfileListViewSortInput = {
  direction: ListViewSortDirection;
  field: ProfileListViewSortField;
};

export type ProfilePagination = {
  /** The requested slice of items. */
  items: Array<Profile>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type ProfilePropertyFilter = {
  profileTypeFieldId?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  profileTypeId?: InputMaybe<Array<Scalars["GID"]["input"]>>;
};

export type ProfileRelationship = {
  id: Scalars["GID"]["output"];
  leftSideProfile: Profile;
  relationshipType: ProfileRelationshipType;
  rightSideProfile: Profile;
};

export type ProfileRelationshipCreatedEvent = ProfileEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  profile: Maybe<Profile>;
  relationship: Maybe<ProfileRelationship>;
  type: ProfileEventType;
  user: User;
};

export type ProfileRelationshipDirection = "LEFT_RIGHT" | "RIGHT_LEFT";

export type ProfileRelationshipFilter = {
  fromSide?: InputMaybe<ProfileRelationshipSide>;
  relationshipTypeId: Scalars["GID"]["input"];
};

export type ProfileRelationshipRemovedEvent = ProfileEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  profile: Maybe<Profile>;
  reason: Scalars["String"]["output"];
  type: ProfileEventType;
  user: Maybe<User>;
};

export type ProfileRelationshipSide = "LEFT" | "RIGHT";

export type ProfileRelationshipType = {
  alias: Maybe<Scalars["String"]["output"]>;
  allowedLeftRightProfileTypeIds: Array<Scalars["GID"]["output"]>;
  allowedRightLeftProfileTypeIds: Array<Scalars["GID"]["output"]>;
  id: Scalars["GID"]["output"];
  isReciprocal: Scalars["Boolean"]["output"];
  leftRightName: Scalars["LocalizableUserText"]["output"];
  rightLeftName: Scalars["LocalizableUserText"]["output"];
};

export type ProfileRelationshipTypeWithDirection = {
  direction: ProfileRelationshipDirection;
  profileRelationshipType: ProfileRelationshipType;
};

export type ProfileReopenedEvent = ProfileEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  profile: Maybe<Profile>;
  type: ProfileEventType;
  user: Maybe<User>;
};

export type ProfileScheduledForDeletionEvent = ProfileEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  profile: Maybe<Profile>;
  type: ProfileEventType;
  user: Maybe<User>;
};

export type ProfileStatus = "CLOSED" | "DELETION_SCHEDULED" | "OPEN";

export type ProfileSubscription = {
  id: Scalars["GID"]["output"];
  user: User;
};

export type ProfileType = Timestamps & {
  /** Time when the response was created. */
  archivedAt: Maybe<Scalars["DateTime"]["output"]>;
  archivedBy: Maybe<User>;
  canCreate: Scalars["Boolean"]["output"];
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  fields: Array<ProfileTypeField>;
  icon: ProfileTypeIcon;
  id: Scalars["GID"]["output"];
  isPinned: Scalars["Boolean"]["output"];
  isStandard: Scalars["Boolean"]["output"];
  keyProcesses: Array<ProfileTypeProcess>;
  name: Scalars["LocalizableUserText"]["output"];
  pluralName: Scalars["LocalizableUserText"]["output"];
  profileNamePattern: Scalars["String"]["output"];
  profileNamePatternFields: Array<Scalars["GID"]["output"]>;
  standardType: Maybe<ProfileTypeStandardType>;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
};

export type ProfileTypeField = {
  alias: Maybe<Scalars["String"]["output"]>;
  defaultPermission: ProfileTypeFieldPermissionType;
  expiryAlertAheadTime: Maybe<Scalars["Duration"]["output"]>;
  id: Scalars["GID"]["output"];
  isExpirable: Scalars["Boolean"]["output"];
  isStandard: Scalars["Boolean"]["output"];
  isUsedInProfileName: Scalars["Boolean"]["output"];
  myPermission: ProfileTypeFieldPermissionType;
  name: Scalars["LocalizableUserText"]["output"];
  options: Scalars["JSONObject"]["output"];
  permissions: Array<ProfileTypeFieldPermission>;
  position: Scalars["Int"]["output"];
  profileType: ProfileType;
  type: ProfileTypeFieldType;
};

export type ProfileTypeFieldPermission = {
  id: Scalars["GID"]["output"];
  permission: ProfileTypeFieldPermissionType;
  target: UserOrUserGroup;
};

export type ProfileTypeFieldPermissionType = "HIDDEN" | "READ" | "WRITE";

export type ProfileTypeFieldType =
  | "BACKGROUND_CHECK"
  | "CHECKBOX"
  | "DATE"
  | "FILE"
  | "NUMBER"
  | "PHONE"
  | "SELECT"
  | "SHORT_TEXT"
  | "TEXT";

export type ProfileTypeFilter = {
  includeArchived?: InputMaybe<Scalars["Boolean"]["input"]>;
  onlyArchived?: InputMaybe<Scalars["Boolean"]["input"]>;
  profileTypeId?: InputMaybe<Array<Scalars["GID"]["input"]>>;
};

export type ProfileTypeIcon =
  | "BRIEFCASE"
  | "BUILDING"
  | "CAR"
  | "CERTIFICATE"
  | "CLIPBOARD"
  | "CUBE"
  | "DATABASE"
  | "DOCUMENT"
  | "HOUSE"
  | "PEOPLE"
  | "PERSON"
  | "PUBLICATION"
  | "SETTINGS"
  | "SHOPPING_CART"
  | "STORE"
  | "VERIFIED_PERSON";

export type ProfileTypePagination = {
  /** The requested slice of items. */
  items: Array<ProfileType>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type ProfileTypeProcess = {
  id: Scalars["GID"]["output"];
  latestPetition: Maybe<PetitionBaseMini>;
  name: Scalars["LocalizableUserText"]["output"];
  position: Scalars["Int"]["output"];
  templates: Array<PetitionTemplate>;
};

export type ProfileTypeProcesslatestPetitionArgs = {
  profileId: Scalars["GID"]["input"];
};

export type ProfileTypeStandardType = "CONTRACT" | "INDIVIDUAL" | "LEGAL_ENTITY";

export type ProfileUpdatedEvent = ProfileEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  profile: Maybe<Profile>;
  type: ProfileEventType;
  user: Maybe<User>;
};

export type ProfilesNumberDashboardModuleSettingsInput = {
  /** Aggregate function. Only for type AGGREGATE */
  aggregate?: InputMaybe<ModuleResultAggregateType>;
  filter: ProfileFilter;
  /** Field to aggregate on. Only for type AGGREGATE */
  profileTypeFieldId?: InputMaybe<Scalars["GID"]["input"]>;
  profileTypeId: Scalars["GID"]["input"];
  type: ModuleResultType;
};

export type ProfilesPieChartDashboardModuleSettingsInput = {
  /** Aggregate function. Only for type AGGREGATE */
  aggregate?: InputMaybe<ModuleResultAggregateType>;
  graphicType: DashboardPieChartModuleSettingsType;
  /** Optional filter to apply to all items when grouping by a field */
  groupByFilter?: InputMaybe<ProfileFilter>;
  /** Optional SELECT field to group by its values instead of items array */
  groupByProfileTypeFieldId?: InputMaybe<Scalars["GID"]["input"]>;
  items: Array<ProfilesPieChartDashboardModuleSettingsItemInput>;
  /** Field to aggregate on. Only for type AGGREGATE */
  profileTypeFieldId?: InputMaybe<Scalars["GID"]["input"]>;
  profileTypeId: Scalars["GID"]["input"];
  type: ModuleResultType;
};

export type ProfilesPieChartDashboardModuleSettingsItemInput = {
  color: Scalars["String"]["input"];
  filter: ProfileFilter;
  label: Scalars["String"]["input"];
};

export type ProfilesRatioDashboardModuleSettingsInput = {
  /** Aggregate function. Only for type AGGREGATE */
  aggregate?: InputMaybe<ModuleResultAggregateType>;
  filters: Array<ProfileFilter>;
  graphicType: DashboardRatioModuleSettingsType;
  /** Field to aggregate on. Only for type AGGREGATE */
  profileTypeFieldId?: InputMaybe<Scalars["GID"]["input"]>;
  profileTypeId: Scalars["GID"]["input"];
  type: ModuleResultType;
};

export type PublicAccessVerification = {
  cookieName: Maybe<Scalars["String"]["output"]>;
  cookieValue: Maybe<Scalars["String"]["output"]>;
  email: Maybe<Scalars["String"]["output"]>;
  isAllowed: Scalars["Boolean"]["output"];
  isContactlessAccess: Maybe<Scalars["Boolean"]["output"]>;
  organization: Maybe<PublicOrganization>;
  ownerName: Maybe<Scalars["String"]["output"]>;
};

/** A public view of a contact */
export type PublicContact = {
  /** The email of the user. */
  email: Scalars["String"]["output"];
  /** The first name of the user. */
  firstName: Scalars["String"]["output"];
  /** The full name of the user. */
  fullName: Scalars["String"]["output"];
  /** The ID of the contact. */
  id: Scalars["GID"]["output"];
  /** The initials of the user. */
  initials: Maybe<Scalars["String"]["output"]>;
  isMe: Scalars["Boolean"]["output"];
  /** The last name of the user. */
  lastName: Maybe<Scalars["String"]["output"]>;
};

export type PublicCreateFileUploadReply = {
  presignedPostData: AWSPresignedPostData;
  reply: PublicPetitionFieldReply;
};

export type PublicLicenseCode = {
  code: Scalars["String"]["output"];
  details: Scalars["JSONObject"]["output"];
  source: Scalars["String"]["output"];
};

/** A public view of an organization */
export type PublicOrganization = {
  brandTheme: OrganizationBrandThemeData;
  /** If this organization has the REMOVE_PARALLEL_BRANDING feature flag enabled */
  hasRemoveParallelBranding: Scalars["Boolean"]["output"];
  /** The ID of the organization. */
  id: Scalars["GID"]["output"];
  /** The logo of the organization. */
  logoUrl: Maybe<Scalars["String"]["output"]>;
  /** The name of the organization. */
  name: Scalars["String"]["output"];
};

/** A public view of an organization */
export type PublicOrganizationlogoUrlArgs = {
  options?: InputMaybe<ImageOptions>;
};

/** A public view of the petition */
export type PublicPetition = Timestamps & {
  /** The automatic numbering settings of the petition. */
  automaticNumberingConfig: Maybe<AutomaticNumberingConfig>;
  /** The body of the optional completing message to be show to recipients. */
  completingMessageBody: Maybe<Scalars["String"]["output"]>;
  /** The subject of the optional completing message to be show to recipients */
  completingMessageSubject: Maybe<Scalars["String"]["output"]>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  currentApprovalRequestStatus: PetitionApprovalRequestStatus;
  customLists: Array<PetitionCustomList>;
  /** The deadline of the petition. */
  deadline: Maybe<Scalars["DateTime"]["output"]>;
  /** The field definition of the petition. */
  fields: Array<PublicPetitionField>;
  generalCommentCount: Scalars["Int"]["output"];
  /** The general comments for this petition */
  generalComments: Array<PublicPetitionFieldComment>;
  /** Whether the petition has an ongoing signature or approval request */
  hasStartedProcess: Scalars["Boolean"]["output"];
  /** Shows if the petition has unread comments */
  hasUnreadComments: Scalars["Boolean"]["output"];
  /** The ID of the petition. */
  id: Scalars["GID"]["output"];
  /** Wether the completion message will be shown to the recipients or not. */
  isCompletingMessageEnabled: Scalars["Boolean"]["output"];
  /** Indicates whether delegate access is enabled for the recipient */
  isDelegateAccessEnabled: Scalars["Boolean"]["output"];
  /**
   * Whether the contents card is hidden in the recipient view.
   * @deprecated Don't use this
   */
  isRecipientViewContentsHidden: Scalars["Boolean"]["output"];
  lastGeneralComment: Maybe<PublicPetitionFieldComment>;
  /** The latest signature request of the petition. */
  latestSignatureRequest: Maybe<PublicPetitionSignatureRequest>;
  /** The locale of the parallel. */
  locale: PetitionLocale;
  /** The organization of the petition. */
  organization: PublicOrganization;
  /** The progress of the petition. */
  progress: PublicPetitionFieldProgress;
  /** The recipients of the petition */
  recipients: Array<PublicContact>;
  /** The signature config of the petition */
  signatureConfig: Maybe<PublicSignatureConfig>;
  signatureStatus: Maybe<PublicSignatureStatus>;
  /** Lists every available standard list to be used in field logic conditions */
  standardListDefinitions: Array<StandardListDefinition>;
  /** The status of the petition. */
  status: PetitionStatus;
  /** The preferred tone of organization. */
  tone: Tone;
  unreadGeneralCommentCount: Scalars["Int"]["output"];
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
  variables: Array<PetitionVariable>;
};

/** A public view of a petition access */
export type PublicPetitionAccess = {
  contact: Maybe<PublicContact>;
  createdAt: Scalars["DateTime"]["output"];
  granter: Maybe<PublicUser>;
  hasClientPortalAccess: Scalars["Boolean"]["output"];
  keycode: Scalars["ID"]["output"];
  message: Maybe<PublicPetitionMessage>;
  petition: PublicPetition;
};

export type PublicPetitionAccessPagination = {
  /** The requested slice of items. */
  items: Array<PublicPetitionAccess>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

/** A field within a petition. */
export type PublicPetitionField = {
  /** Alias of the petition field. */
  alias: Maybe<Scalars["String"]["output"]>;
  /** A list of files attached to this field. */
  attachments: Array<PetitionFieldAttachment>;
  /** The children of this field. */
  children: Maybe<Array<PublicPetitionField>>;
  commentCount: Scalars["Int"]["output"];
  /** The comments for this field. */
  comments: Array<PublicPetitionFieldComment>;
  /** The description of the petition field. */
  description: Maybe<Scalars["String"]["output"]>;
  hasCommentsEnabled: Scalars["Boolean"]["output"];
  /** The ID of the petition field. */
  id: Scalars["GID"]["output"];
  /** Determines if the field is visible by the recipients. */
  isInternal: Scalars["Boolean"]["output"];
  /** Determines if the field accepts replies */
  isReadOnly: Scalars["Boolean"]["output"];
  /** The last comment from this field. */
  lastComment: Maybe<PublicPetitionFieldComment>;
  /** A JSON object representing the math to be performed on the field */
  math: Maybe<Array<Scalars["JSONObject"]["output"]>>;
  /** Determines if this field allows multiple replies. */
  multiple: Scalars["Boolean"]["output"];
  /** Determines if this field is optional. */
  optional: Scalars["Boolean"]["output"];
  /** The options of the petition field. */
  options: Scalars["JSONObject"]["output"];
  parent: Maybe<PublicPetitionField>;
  petition: PublicPetition;
  profileType: Maybe<PublicProfileType>;
  /** Linked profile type field. */
  profileTypeField: Maybe<PublicProfileTypeField>;
  /** The replies to the petition field */
  replies: Array<PublicPetitionFieldReply>;
  /** The title of the petition field. */
  title: Maybe<Scalars["String"]["output"]>;
  /** The type of the petition field. */
  type: PetitionFieldType;
  unreadCommentCount: Scalars["Int"]["output"];
  /** A JSON object representing the conditions for the field to be visible */
  visibility: Maybe<Scalars["JSONObject"]["output"]>;
};

/** A comment on a petition field */
export type PublicPetitionFieldComment = {
  /** The author of the comment. */
  author: Maybe<PublicUserOrContact>;
  /** The JSON content of the comment. */
  content: Maybe<Scalars["JSON"]["output"]>;
  /** The HTML content of the comment. */
  contentHtml: Maybe<Scalars["String"]["output"]>;
  /** The text content of the comment. */
  contentPlainText: Maybe<Scalars["String"]["output"]>;
  /** Time when the comment was created. */
  createdAt: Scalars["DateTime"]["output"];
  /** The HTML content of the comment. */
  excerptHtml: Maybe<Scalars["String"]["output"]>;
  field: Maybe<PublicPetitionField>;
  /** The ID of the petition field comment. */
  id: Scalars["GID"]["output"];
  isAnonymized: Scalars["Boolean"]["output"];
  /** Whether the comment has been read or not. */
  isUnread: Scalars["Boolean"]["output"];
  petition: PublicPetition;
};

/** References the replies of a FIELD_GROUP field on a specific field and group */
export type PublicPetitionFieldGroupChildReply = {
  field: PublicPetitionField;
  replies: Array<PublicPetitionFieldReply>;
};

export type PublicPetitionFieldOrPublicPetition = PublicPetition | PublicPetitionField;

/** The progress of a petition. */
export type PublicPetitionFieldProgress = {
  /** Number of optional fields not replied or approved */
  optional: Scalars["Int"]["output"];
  /** Number of fields with a reply and not approved */
  replied: Scalars["Int"]["output"];
  /** Total number of fields in the petition */
  total: Scalars["Int"]["output"];
};

/** A reply to a petition field */
export type PublicPetitionFieldReply = Timestamps & {
  children: Maybe<Array<PublicPetitionFieldGroupChildReply>>;
  /** The public content of the reply */
  content: Scalars["JSONObject"]["output"];
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  field: PublicPetitionField;
  /** The ID of the petition field reply. */
  id: Scalars["GID"]["output"];
  isAnonymized: Scalars["Boolean"]["output"];
  parent: Maybe<PublicPetitionFieldReply>;
  /** The status of the petition field reply. */
  status: PetitionFieldReplyStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
};

export type PublicPetitionLink = {
  allowMultiplePetitions: Scalars["Boolean"]["output"];
  description: Scalars["String"]["output"];
  id: Scalars["GID"]["output"];
  isActive: Scalars["Boolean"]["output"];
  owner: User;
  petitionNamePattern: Maybe<Scalars["String"]["output"]>;
  prefillSecret: Maybe<Scalars["String"]["output"]>;
  slug: Scalars["String"]["output"];
  template: PetitionTemplate;
  title: Scalars["String"]["output"];
  url: Scalars["String"]["output"];
};

/** A public message in a petition */
export type PublicPetitionMessage = {
  /** The ID of the message. */
  id: Scalars["GID"]["output"];
  /** If already sent, the date at which the email was sent. */
  sentAt: Maybe<Scalars["DateTime"]["output"]>;
  /** Subject of a email. */
  subject: Maybe<Scalars["String"]["output"]>;
};

export type PublicPetitionSignatureRequest = {
  cancelReason: Maybe<Scalars["String"]["output"]>;
  id: Scalars["GID"]["output"];
  signerStatus: Array<PetitionSignatureRequestSignerStatus>;
  /** The status of the petition signature. */
  status: PetitionSignatureRequestStatus;
};

export type PublicPetitionSignerDataInput = {
  email: Scalars["String"]["input"];
  firstName: Scalars["String"]["input"];
  lastName: Scalars["String"]["input"];
};

export type PublicProfileType = {
  id: Scalars["GID"]["output"];
  profileNamePatternFields: Array<Scalars["GID"]["output"]>;
};

/** A public view of a profile type field */
export type PublicProfileTypeField = {
  alias: Maybe<Scalars["String"]["output"]>;
  id: Scalars["GID"]["output"];
};

export type PublicPublicPetitionLink = {
  allowMultiplePetitions: Scalars["Boolean"]["output"];
  description: Scalars["String"]["output"];
  isActive: Scalars["Boolean"]["output"];
  /** If the organization has enough credits to send a petition with this public link or not */
  isAvailable: Scalars["Boolean"]["output"];
  owner: PublicUser;
  slug: Scalars["String"]["output"];
  title: Scalars["String"]["output"];
};

export type PublicRemindersOptOut = {
  orgLogoUrl: Maybe<Scalars["String"]["output"]>;
  orgName: Scalars["String"]["output"];
};

/** The public signature settings of a petition */
export type PublicSignatureConfig = {
  /** The signers assigned by the petition recipient */
  additionalSigners: Array<PetitionSigner>;
  /** If true, allows the recipients or users of the petition to select additional signers */
  allowAdditionalSigners: Scalars["Boolean"]["output"];
  /** Instructions for the signers */
  instructions: Maybe<Scalars["String"]["output"]>;
  isEnabled: Scalars["Boolean"]["output"];
  /** The minimum number of signers required to complete the signature process */
  minSigners: Scalars["Int"]["output"];
  /** If true, lets the user review the replies before starting the signature process */
  review: Scalars["Boolean"]["output"];
  /** The contacts that need to sign the generated document. */
  signers: Array<PetitionSigner>;
  signingMode: SignatureConfigSigningMode;
};

export type PublicSignatureStatus = "COMPLETED" | "STARTED";

/** A public view of a user */
export type PublicUser = {
  /** The email of the user. */
  email: Scalars["String"]["output"];
  /** The first name of the user. */
  firstName: Maybe<Scalars["String"]["output"]>;
  /** The full name of the user. */
  fullName: Scalars["String"]["output"];
  /** The ID of the user. */
  id: Scalars["GID"]["output"];
  /** The last name of the user. */
  lastName: Maybe<Scalars["String"]["output"]>;
  /** The organization of the user. */
  organization: PublicOrganization;
};

export type PublicUserOrContact = PublicContact | PublicUser;

export type Query = {
  access: PublicPetitionAccess;
  accesses: PublicPetitionAccessPagination;
  backgroundCheckEntityDetails: BackgroundCheckEntityDetails;
  backgroundCheckEntitySearch: BackgroundCheckEntitySearch;
  /** Run a search on PROFILE_SEARCH petition field */
  conflictCheckProfileSearch: Array<Profile>;
  contact: Maybe<Contact>;
  /** The contacts of the user */
  contacts: ContactPagination;
  /** Matches the emails passed as argument with a Contact in the database. Returns a list of nullable Contacts */
  contactsByEmail: Array<Maybe<Contact>>;
  dashboard: Dashboard;
  dowJonesKycEntityProfile: DowJonesKycEntityProfileResult;
  dowJonesKycEntitySearch: DowJonesKycEntitySearchResultPagination;
  /** Checks if the provided email is available to be registered as a user on Parallel */
  emailIsAvailable: Scalars["Boolean"]["output"];
  expiringProfileProperties: ProfileFieldPropertyPagination;
  /** Exports basic petition + fields configuration as JSON object */
  exportPetitionToJson: SupportMethodResponse;
  /** Get the user who owns an API Token */
  getApiTokenOwner: SupportMethodResponse;
  getSlugForPublicPetitionLink: Scalars["String"]["output"];
  /** Get users or groups from IDs */
  getUsersOrGroups: Array<UserOrUserGroup>;
  /** Decodes the given Global ID into an entity in the database. */
  globalIdDecode: SupportMethodResponse;
  /** Encodes the given ID into a Global ID. */
  globalIdEncode: SupportMethodResponse;
  isValidPublicPetitionLinkSlug: Scalars["Boolean"]["output"];
  landingTemplateBySlug: Maybe<LandingTemplate>;
  landingTemplateCategorySamples: Array<LandingTemplateCategorySample>;
  landingTemplates: LandingTemplatePagination;
  me: User;
  metadata: ConnectionMetadata;
  organization: Maybe<Organization>;
  /** The organizations registered in Parallel. */
  organizations: OrganizationPagination;
  petition: Maybe<PetitionBase>;
  petitionEvents: Array<PetitionEvent>;
  /** A field of the petition. */
  petitionField: PetitionField;
  /** Lists every path of the user's petitions as a string array */
  petitionFolders: Array<Scalars["String"]["output"]>;
  /** Returns information about a petition: The name of the organization and emails of users with access to the petition */
  petitionInformation: SupportMethodResponse;
  /** The petitions of the user */
  petitions: PetitionBaseOrFolderPagination;
  petitionsById: Array<Maybe<PetitionBase>>;
  petitionsSharingInfo: PetitionSharingInfo;
  profile: Profile;
  profileEvents: Array<ProfileEvent>;
  profileRelationshipTypes: Array<ProfileRelationshipType>;
  profileRelationshipTypesWithDirection: Array<ProfileRelationshipTypeWithDirection>;
  profileType: ProfileType;
  profileTypes: ProfileTypePagination;
  profiles: ProfilePagination;
  publicLicenseCode: Maybe<PublicLicenseCode>;
  publicOrg: Maybe<PublicOrganization>;
  /** The comments for this field. */
  publicPetitionField: PublicPetitionField;
  publicPetitionLinkBySlug: Maybe<PublicPublicPetitionLink>;
  publicTask: Task;
  publicTemplateCategories: Array<Scalars["String"]["output"]>;
  realMe: User;
  /** Exposes minimal information for reminders page so the contact doesn't need to be verified */
  remindersOptOut: Maybe<PublicRemindersOptOut>;
  standardListDefinition: StandardListDefinition;
  subscriptions: Array<EventSubscription>;
  /** Paginated list of tags in the organization */
  tags: TagPagination;
  /** Paginated list of tags in the organization where tag name is included in the search argument. */
  tagsByName: TagPagination;
  task: Task;
  /** The available templates */
  templates: PetitionBaseOrFolderPagination;
  userGroup: Maybe<UserGroup>;
  /** Paginated list of user groups in the organization */
  userGroups: UserGroupPagination;
};

export type QueryaccessArgs = {
  keycode: Scalars["ID"]["input"];
};

export type QueryaccessesArgs = {
  keycode: Scalars["ID"]["input"];
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  status?: InputMaybe<Array<PetitionStatus>>;
};

export type QuerybackgroundCheckEntityDetailsArgs = {
  entityId: Scalars["String"]["input"];
  token: Scalars["String"]["input"];
};

export type QuerybackgroundCheckEntitySearchArgs = {
  country?: InputMaybe<Scalars["String"]["input"]>;
  date?: InputMaybe<Scalars["Date"]["input"]>;
  name: Scalars["String"]["input"];
  token: Scalars["String"]["input"];
  type?: InputMaybe<BackgroundCheckEntitySearchType>;
};

export type QueryconflictCheckProfileSearchArgs = {
  fieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
  search: Scalars["String"]["input"];
};

export type QuerycontactArgs = {
  id: Scalars["GID"]["input"];
};

export type QuerycontactsArgs = {
  exclude?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  sortBy?: InputMaybe<Array<QueryContacts_OrderBy>>;
};

export type QuerycontactsByEmailArgs = {
  emails: Array<Scalars["String"]["input"]>;
};

export type QuerydashboardArgs = {
  id: Scalars["GID"]["input"];
};

export type QuerydowJonesKycEntityProfileArgs = {
  profileId: Scalars["ID"]["input"];
};

export type QuerydowJonesKycEntitySearchArgs = {
  dateOfBirth?: InputMaybe<Scalars["DateTime"]["input"]>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  name: Scalars["String"]["input"];
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryemailIsAvailableArgs = {
  email: Scalars["String"]["input"];
};

export type QueryexpiringProfilePropertiesArgs = {
  filter?: InputMaybe<ProfilePropertyFilter>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryexportPetitionToJsonArgs = {
  petitionId: Scalars["GID"]["input"];
};

export type QuerygetApiTokenOwnerArgs = {
  token: Scalars["String"]["input"];
};

export type QuerygetSlugForPublicPetitionLinkArgs = {
  petitionName?: InputMaybe<Scalars["String"]["input"]>;
};

export type QuerygetUsersOrGroupsArgs = {
  ids: Array<Scalars["ID"]["input"]>;
};

export type QueryglobalIdDecodeArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryglobalIdEncodeArgs = {
  id: Scalars["String"]["input"];
  type: Scalars["String"]["input"];
};

export type QueryisValidPublicPetitionLinkSlugArgs = {
  slug: Scalars["String"]["input"];
};

export type QuerylandingTemplateBySlugArgs = {
  slug: Scalars["String"]["input"];
};

export type QuerylandingTemplatesArgs = {
  categories?: InputMaybe<Array<Scalars["String"]["input"]>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  locale: PetitionLocale;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QuerymetadataArgs = {
  keycode?: InputMaybe<Scalars["ID"]["input"]>;
};

export type QueryorganizationArgs = {
  id: Scalars["GID"]["input"];
};

export type QueryorganizationsArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  sortBy?: InputMaybe<Array<QueryOrganizations_OrderBy>>;
  status?: InputMaybe<OrganizationStatus>;
};

export type QuerypetitionArgs = {
  id: Scalars["GID"]["input"];
};

export type QuerypetitionEventsArgs = {
  before?: InputMaybe<Scalars["GID"]["input"]>;
  eventTypes?: InputMaybe<Array<PetitionEventType>>;
};

export type QuerypetitionFieldArgs = {
  petitionFieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type QuerypetitionFoldersArgs = {
  currentPath?: InputMaybe<Scalars["String"]["input"]>;
  type: PetitionBaseType;
};

export type QuerypetitionInformationArgs = {
  petitionId: Scalars["ID"]["input"];
};

export type QuerypetitionsArgs = {
  excludeAnonymized?: InputMaybe<Scalars["Boolean"]["input"]>;
  excludePublicTemplates?: InputMaybe<Scalars["Boolean"]["input"]>;
  filters?: InputMaybe<PetitionFilter>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  minEffectivePermission?: InputMaybe<PetitionPermissionType>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  searchByNameOnly?: InputMaybe<Scalars["Boolean"]["input"]>;
  sortBy?: InputMaybe<Array<QueryPetitions_OrderBy>>;
};

export type QuerypetitionsByIdArgs = {
  folders?: InputMaybe<FoldersInput>;
  ids?: InputMaybe<Array<Scalars["GID"]["input"]>>;
};

export type QuerypetitionsSharingInfoArgs = {
  folders?: InputMaybe<FoldersInput>;
  ids?: InputMaybe<Array<Scalars["GID"]["input"]>>;
};

export type QueryprofileArgs = {
  profileId: Scalars["GID"]["input"];
};

export type QueryprofileEventsArgs = {
  before?: InputMaybe<Scalars["GID"]["input"]>;
  eventTypes?: InputMaybe<Array<ProfileEventType>>;
};

export type QueryprofileRelationshipTypesWithDirectionArgs = {
  otherSideProfileTypeId?: InputMaybe<Scalars["GID"]["input"]>;
};

export type QueryprofileTypeArgs = {
  profileTypeId: Scalars["GID"]["input"];
};

export type QueryprofileTypesArgs = {
  filter?: InputMaybe<ProfileTypeFilter>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  locale?: InputMaybe<UserLocale>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  sortBy?: InputMaybe<Array<QueryProfileTypes_OrderBy>>;
};

export type QueryprofilesArgs = {
  filter?: InputMaybe<ProfileFilter>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  sortBy?: InputMaybe<Array<QueryProfiles_OrderBy>>;
};

export type QuerypublicLicenseCodeArgs = {
  code: Scalars["String"]["input"];
  token: Scalars["ID"]["input"];
};

export type QuerypublicOrgArgs = {
  id: Scalars["GID"]["input"];
};

export type QuerypublicPetitionFieldArgs = {
  keycode: Scalars["ID"]["input"];
  petitionFieldId: Scalars["GID"]["input"];
};

export type QuerypublicPetitionLinkBySlugArgs = {
  prefill?: InputMaybe<Scalars["String"]["input"]>;
  slug: Scalars["ID"]["input"];
};

export type QuerypublicTaskArgs = {
  keycode: Scalars["ID"]["input"];
  taskId: Scalars["GID"]["input"];
};

export type QueryremindersOptOutArgs = {
  keycode: Scalars["ID"]["input"];
};

export type QuerystandardListDefinitionArgs = {
  id: Scalars["GID"]["input"];
  locale: UserLocale;
};

export type QuerytagsArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  tagIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
};

export type QuerytagsByNameArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  search: Array<Scalars["String"]["input"]>;
};

export type QuerytaskArgs = {
  id: Scalars["GID"]["input"];
};

export type QuerytemplatesArgs = {
  category?: InputMaybe<Scalars["String"]["input"]>;
  isOwner?: InputMaybe<Scalars["Boolean"]["input"]>;
  isPublic: Scalars["Boolean"]["input"];
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  locale?: InputMaybe<PetitionLocale>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  path?: InputMaybe<Scalars["String"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryuserGroupArgs = {
  id: Scalars["GID"]["input"];
};

export type QueryuserGroupsArgs = {
  excludeIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  sortBy?: InputMaybe<Array<QueryUserGroups_OrderBy>>;
  type?: InputMaybe<Array<UserGroupType>>;
};

/** Order to use on Query.contacts */
export type QueryContacts_OrderBy =
  | "createdAt_ASC"
  | "createdAt_DESC"
  | "email_ASC"
  | "email_DESC"
  | "firstName_ASC"
  | "firstName_DESC"
  | "fullName_ASC"
  | "fullName_DESC"
  | "lastName_ASC"
  | "lastName_DESC";

/** Order to use on Query.organizations */
export type QueryOrganizations_OrderBy =
  | "createdAt_ASC"
  | "createdAt_DESC"
  | "name_ASC"
  | "name_DESC";

/** Order to use on Query.petitions */
export type QueryPetitions_OrderBy =
  | "createdAt_ASC"
  | "createdAt_DESC"
  | "lastActivityAt_ASC"
  | "lastActivityAt_DESC"
  | "lastRecipientActivityAt_ASC"
  | "lastRecipientActivityAt_DESC"
  | "lastUsedAt_ASC"
  | "lastUsedAt_DESC"
  | "name_ASC"
  | "name_DESC"
  | "sentAt_ASC"
  | "sentAt_DESC";

/** Order to use on Query.profileTypes */
export type QueryProfileTypes_OrderBy =
  | "createdAt_ASC"
  | "createdAt_DESC"
  | "name_ASC"
  | "name_DESC";

/** Order to use on Query.profiles */
export type QueryProfiles_OrderBy = "createdAt_ASC" | "createdAt_DESC" | "name_ASC" | "name_DESC";

/** Order to use on Query.userGroups */
export type QueryUserGroups_OrderBy = "createdAt_ASC" | "createdAt_DESC" | "name_ASC" | "name_DESC";

export type RecipientSignedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  signer: Maybe<PetitionSigner>;
  type: PetitionEventType;
};

export type ReminderEmailBouncedUserNotification = PetitionUserNotification & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  isRead: Scalars["Boolean"]["output"];
  petition: PetitionBase;
};

export type ReminderSentEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  reminder: PetitionReminder;
  type: PetitionEventType;
};

/** The reminder settings of a petition */
export type RemindersConfig = {
  /** The maximum amount of reminders. */
  limit: Scalars["Int"]["output"];
  /** The amount of days between reminders. */
  offset: Scalars["Int"]["output"];
  /** The time at which the reminder should be sent. */
  time: Scalars["String"]["output"];
  /** The timezone the time is referring to. */
  timezone: Scalars["String"]["output"];
  /** Whether to send reminders only from monday to friday. */
  weekdaysOnly: Scalars["Boolean"]["output"];
};

/** The reminders settings for the petition */
export type RemindersConfigInput = {
  /** The maximum amount of reminders. */
  limit: Scalars["Int"]["input"];
  /** The amount of days between reminders. */
  offset: Scalars["Int"]["input"];
  /** The time at which the reminder should be sent. */
  time: Scalars["String"]["input"];
  /** The timezone the time is referring to. */
  timezone: Scalars["String"]["input"];
  /** Whether to send reminders only from monday to friday. */
  weekdaysOnly: Scalars["Boolean"]["input"];
};

export type RemindersOptOutEvent = PetitionEvent & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  other: Maybe<Scalars["String"]["output"]>;
  petition: Maybe<PetitionBaseMini>;
  reason: Scalars["String"]["output"];
  type: PetitionEventType;
};

export type RemindersOptOutNotification = PetitionUserNotification & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  isRead: Scalars["Boolean"]["output"];
  other: Maybe<Scalars["String"]["output"]>;
  petition: PetitionBase;
  reason: Scalars["String"]["output"];
};

export type ReplyCreatedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  createdBy: Maybe<UserOrPetitionAccess>;
  data: Scalars["JSONObject"]["output"];
  field: Maybe<PetitionField>;
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  reply: Maybe<PetitionFieldReply>;
  type: PetitionEventType;
};

export type ReplyDeletedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  deletedBy: Maybe<UserOrPetitionAccess>;
  field: Maybe<PetitionField>;
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
};

export type ReplyStatusChangedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  field: Maybe<PetitionField>;
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  reply: Maybe<PetitionFieldReply>;
  status: PetitionFieldReplyStatus;
  type: PetitionEventType;
  updatedBy: Maybe<UserOrPetitionAccess>;
};

export type ReplyUpdatedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  field: Maybe<PetitionField>;
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  reply: Maybe<PetitionFieldReply>;
  type: PetitionEventType;
  updatedBy: Maybe<UserOrPetitionAccess>;
};

/** Represents the result of an operation. */
export type Result = "FAILURE" | "SUCCESS";

export type SendPetitionResult = {
  accesses: Maybe<Array<PetitionAccess>>;
  petition: Maybe<Petition>;
  result: Result;
};

export type SignatureCancelledEvent = PetitionEvent & {
  cancelType: PetitionSignatureCancelReason;
  cancelledBy: Maybe<UserOrPetitionAccess>;
  canceller: Maybe<PetitionSigner>;
  cancellerReason: Maybe<Scalars["String"]["output"]>;
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  errorCode: Maybe<Scalars["String"]["output"]>;
  errorMessage: Maybe<Scalars["String"]["output"]>;
  extraErrorData: Maybe<Scalars["JSON"]["output"]>;
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
};

export type SignatureCancelledUserNotification = PetitionUserNotification & {
  createdAt: Scalars["DateTime"]["output"];
  errorCode: Maybe<Scalars["String"]["output"]>;
  extraErrorData: Maybe<Scalars["JSON"]["output"]>;
  id: Scalars["GID"]["output"];
  isRead: Scalars["Boolean"]["output"];
  petition: PetitionBase;
};

export type SignatureCompletedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
};

export type SignatureCompletedUserNotification = PetitionUserNotification & {
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  isRead: Scalars["Boolean"]["output"];
  petition: PetitionBase;
};

/** The signature settings of a petition */
export type SignatureConfig = {
  /** If true, allows the recipients or users of the petition to select additional signers */
  allowAdditionalSigners: Scalars["Boolean"]["output"];
  /** The instructions to be shown to the user or recipient before starting the signature process */
  instructions: Maybe<Scalars["String"]["output"]>;
  /** The signature integration selected for this signature config. */
  integration: Maybe<SignatureOrgIntegration>;
  isEnabled: Scalars["Boolean"]["output"];
  message: Maybe<Scalars["String"]["output"]>;
  /** The minimum number of signers required to sign the document */
  minSigners: Scalars["Int"]["output"];
  /** If true, lets the user review the replies before starting the signature process */
  review: Scalars["Boolean"]["output"];
  /** Whether the review should be done after the approval process. */
  reviewAfterApproval: Maybe<Scalars["Boolean"]["output"]>;
  /** The signers of the generated document. */
  signers: Array<Maybe<PetitionSigner>>;
  signingMode: SignatureConfigSigningMode;
  /** The timezone used to generate the document. */
  timezone: Scalars["String"]["output"];
  /** Title of the signature document */
  title: Maybe<Scalars["String"]["output"]>;
  useCustomDocument: Scalars["Boolean"]["output"];
};

/** The signature settings for the petition */
export type SignatureConfigInput = {
  /** If true, allows the recipients or users of the petition to select additional signers */
  allowAdditionalSigners: Scalars["Boolean"]["input"];
  /** The instructions to be shown to the user or recipient before starting the signature process */
  instructions?: InputMaybe<Scalars["String"]["input"]>;
  /** Whether to enable the signature process with this configuration. */
  isEnabled: Scalars["Boolean"]["input"];
  /** The minimum amount of signers required to start the signature process */
  minSigners: Scalars["Int"]["input"];
  /** The Global ID of the signature integration to be used. */
  orgIntegrationId: Scalars["GID"]["input"];
  /** If true, lets the user review the replies before starting the signature process */
  review: Scalars["Boolean"]["input"];
  /** Whether to review the replies after completing the approval steps. If true, review must be true */
  reviewAfterApproval?: InputMaybe<Scalars["Boolean"]["input"]>;
  signersInfo: Array<SignatureConfigInputSigner>;
  signingMode: SignatureConfigSigningMode;
  /** The timezone used to generate the document. */
  timezone: Scalars["String"]["input"];
  /** The title of the signing document */
  title?: InputMaybe<Scalars["String"]["input"]>;
  /** if true, use custom document for signature instead of petition binder */
  useCustomDocument?: InputMaybe<Scalars["Boolean"]["input"]>;
};

/** The signer that need to sign the generated document. */
export type SignatureConfigInputSigner = {
  contactId?: InputMaybe<Scalars["GID"]["input"]>;
  email: Scalars["String"]["input"];
  firstName: Scalars["String"]["input"];
  isPreset?: InputMaybe<Scalars["Boolean"]["input"]>;
  lastName?: InputMaybe<Scalars["String"]["input"]>;
};

/** The signing mode of a signature config */
export type SignatureConfigSigningMode = "PARALLEL" | "SEQUENTIAL";

export type SignatureDeliveredEvent = PetitionEvent & {
  bouncedAt: Maybe<Scalars["DateTime"]["output"]>;
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  deliveredAt: Maybe<Scalars["DateTime"]["output"]>;
  id: Scalars["GID"]["output"];
  openedAt: Maybe<Scalars["DateTime"]["output"]>;
  petition: Maybe<PetitionBaseMini>;
  signature: PetitionSignatureRequest;
  signer: Maybe<PetitionSigner>;
  type: PetitionEventType;
};

export type SignatureOpenedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  signer: Maybe<PetitionSigner>;
  type: PetitionEventType;
};

export type SignatureOrgIntegration = IOrgIntegration & {
  /** Environment of this integration, to differentiate between sandbox and production-ready integrations */
  environment: SignatureOrgIntegrationEnvironment;
  id: Scalars["GID"]["output"];
  invalidCredentials: Scalars["Boolean"]["output"];
  /** Wether this integration is the default to be used if the user has more than one of the same type */
  isDefault: Scalars["Boolean"]["output"];
  /** URL of the integration logo */
  logoUrl: Maybe<Scalars["String"]["output"]>;
  /** Custom name of this integration, provided by the user */
  name: Scalars["String"]["output"];
  provider: SignatureOrgIntegrationProvider;
  /** The type of the integration. */
  type: IntegrationType;
};

export type SignatureOrgIntegrationlogoUrlArgs = {
  options?: InputMaybe<ImageOptions>;
};

export type SignatureOrgIntegrationEnvironment = "DEMO" | "PRODUCTION";

export type SignatureOrgIntegrationProvider = "DOCUSIGN" | "SIGNATURIT";

export type SignatureReminderEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type SignatureStartedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  signature: PetitionSignatureRequest;
  type: PetitionEventType;
};

export type SortByDirection = "ASC" | "DESC";

export type SortByInput = {
  direction: SortByDirection;
  field: Scalars["String"]["input"];
};

export type StandardListDefinition = {
  id: Scalars["GID"]["output"];
  listName: Scalars["String"]["output"];
  listType: StandardListDefinitionListType;
  listVersion: Maybe<Scalars["Date"]["output"]>;
  source: Scalars["String"]["output"];
  sourceUrl: Maybe<Scalars["String"]["output"]>;
  title: Scalars["LocalizableUserText"]["output"];
  values: Array<StandardListDefinitionValue>;
  versionFormat: Scalars["JSONObject"]["output"];
  versionUrl: Maybe<Scalars["String"]["output"]>;
};

export type StandardListDefinitionListType = "COUNTRIES";

export type StandardListDefinitionValue = {
  key: Scalars["String"]["output"];
  label: Maybe<Scalars["String"]["output"]>;
  prefix: Maybe<Scalars["String"]["output"]>;
  suffix: Maybe<Scalars["String"]["output"]>;
};

/** Represents a successful execution. */
export type Success = "SUCCESS";

/** Return type for all support methods */
export type SupportMethodResponse = {
  message: Maybe<Scalars["String"]["output"]>;
  result: Result;
  type: Maybe<Scalars["String"]["output"]>;
};

export type Tag = {
  /** The color of the tag in hex format (example: #FFFFFF) */
  color: Scalars["String"]["output"];
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  name: Scalars["String"]["output"];
};

export type TagPagination = {
  /** The requested slice of items. */
  items: Array<Tag>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type Task = {
  id: Scalars["GID"]["output"];
  name: TaskName;
  output: Maybe<Scalars["JSON"]["output"]>;
  progress: Maybe<Scalars["Int"]["output"]>;
  status: TaskStatus;
};

export type TaskName =
  | "BACKGROUND_CHECK_PROFILE_PDF"
  | "BANKFLIP_SESSION_COMPLETED"
  | "BULK_PETITION_SEND"
  | "CLOSE_PETITIONS"
  | "DASHBOARD_REFRESH"
  | "DOCUMENT_PROCESSING"
  | "DOW_JONES_PROFILE_DOWNLOAD"
  | "EXPORT_EXCEL"
  | "EXPORT_REPLIES"
  | "FILE_EXPORT"
  | "ID_VERIFICATION_SESSION_COMPLETED"
  | "PETITION_SHARING"
  | "PETITION_SUMMARY"
  | "PRINT_PDF"
  | "PROFILES_EXCEL_EXPORT"
  | "PROFILES_EXCEL_IMPORT"
  | "PROFILE_NAME_PATTERN_UPDATED"
  | "TEMPLATES_OVERVIEW_REPORT"
  | "TEMPLATE_REPLIES_CSV_EXPORT"
  | "TEMPLATE_REPLIES_REPORT"
  | "TEMPLATE_STATS_REPORT";

export type TaskResultFile = {
  filename: Scalars["String"]["output"];
  url: Scalars["String"]["output"];
};

export type TaskStatus = "COMPLETED" | "ENQUEUED" | "FAILED" | "PROCESSING";

export type TemplateDefaultPermission = {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  /** wether user is will be subscribed or not to emails and alerts of the generated petition */
  isSubscribed: Scalars["Boolean"]["output"];
  /** The type of the permission. */
  permissionType: PetitionPermissionType;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
};

/** The permission for a petition and user group */
export type TemplateDefaultUserGroupPermission = TemplateDefaultPermission &
  Timestamps & {
    /** Time when the resource was created. */
    createdAt: Scalars["DateTime"]["output"];
    /** The group linked to the permission */
    group: UserGroup;
    id: Scalars["GID"]["output"];
    /** wether user is will be subscribed or not to emails and alerts of the generated petition */
    isSubscribed: Scalars["Boolean"]["output"];
    /** The type of the permission. */
    permissionType: PetitionPermissionType;
    /** Time when the resource was last updated. */
    updatedAt: Scalars["DateTime"]["output"];
  };

/** The permission for a petition and user */
export type TemplateDefaultUserPermission = TemplateDefaultPermission &
  Timestamps & {
    /** Time when the resource was created. */
    createdAt: Scalars["DateTime"]["output"];
    id: Scalars["GID"]["output"];
    /** wether user is will be subscribed or not to emails and alerts of the generated petition */
    isSubscribed: Scalars["Boolean"]["output"];
    /** The type of the permission. */
    permissionType: PetitionPermissionType;
    /** Time when the resource was last updated. */
    updatedAt: Scalars["DateTime"]["output"];
    /** The user linked to the permission */
    user: User;
  };

export type TemplateUsedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
};

export type Timestamps = {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
};

/** The preferred tone of organization */
export type Tone = "FORMAL" | "INFORMAL";

export type UpdateContactInput = {
  firstName?: InputMaybe<Scalars["String"]["input"]>;
  lastName?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdatePetitionFieldAutoSearchConfigInput = {
  country?: InputMaybe<Scalars["GID"]["input"]>;
  date?: InputMaybe<Scalars["GID"]["input"]>;
  name: Array<Scalars["GID"]["input"]>;
  type?: InputMaybe<BackgroundCheckEntitySearchType>;
};

export type UpdatePetitionFieldGroupRelationshipInput = {
  direction: ProfileRelationshipDirection;
  id?: InputMaybe<Scalars["GID"]["input"]>;
  leftSidePetitionFieldId: Scalars["GID"]["input"];
  profileRelationshipTypeId: Scalars["GID"]["input"];
  rightSidePetitionFieldId: Scalars["GID"]["input"];
};

export type UpdatePetitionFieldInput = {
  alias?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  hasCommentsEnabled?: InputMaybe<Scalars["Boolean"]["input"]>;
  isInternal?: InputMaybe<Scalars["Boolean"]["input"]>;
  math?: InputMaybe<Array<Scalars["JSONObject"]["input"]>>;
  multiple?: InputMaybe<Scalars["Boolean"]["input"]>;
  optional?: InputMaybe<Scalars["Boolean"]["input"]>;
  options?: InputMaybe<Scalars["JSONObject"]["input"]>;
  requireApproval?: InputMaybe<Scalars["Boolean"]["input"]>;
  showActivityInPdf?: InputMaybe<Scalars["Boolean"]["input"]>;
  showInPdf?: InputMaybe<Scalars["Boolean"]["input"]>;
  title?: InputMaybe<Scalars["String"]["input"]>;
  visibility?: InputMaybe<Scalars["JSONObject"]["input"]>;
};

export type UpdatePetitionFieldReplyInput = {
  content?: InputMaybe<Scalars["JSON"]["input"]>;
  id: Scalars["GID"]["input"];
};

export type UpdatePetitionInput = {
  anonymizeAfterMonths?: InputMaybe<Scalars["Int"]["input"]>;
  anonymizePurpose?: InputMaybe<Scalars["String"]["input"]>;
  approvalFlowConfig?: InputMaybe<Array<ApprovalFlowConfigInput>>;
  automaticNumberingConfig?: InputMaybe<AutomaticNumberingConfigInput>;
  closingEmailBody?: InputMaybe<Scalars["JSON"]["input"]>;
  completingMessageBody?: InputMaybe<Scalars["JSON"]["input"]>;
  completingMessageSubject?: InputMaybe<Scalars["String"]["input"]>;
  deadline?: InputMaybe<Scalars["DateTime"]["input"]>;
  defaultOnBehalfId?: InputMaybe<Scalars["GID"]["input"]>;
  defaultPath?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["JSON"]["input"]>;
  emailBody?: InputMaybe<Scalars["JSON"]["input"]>;
  emailSubject?: InputMaybe<Scalars["String"]["input"]>;
  isCompletingMessageEnabled?: InputMaybe<Scalars["Boolean"]["input"]>;
  isDelegateAccessEnabled?: InputMaybe<Scalars["Boolean"]["input"]>;
  isDocumentGenerationEnabled?: InputMaybe<Scalars["Boolean"]["input"]>;
  isInteractionWithRecipientsEnabled?: InputMaybe<Scalars["Boolean"]["input"]>;
  isRecipientViewContentsHidden?: InputMaybe<Scalars["Boolean"]["input"]>;
  isReviewFlowEnabled?: InputMaybe<Scalars["Boolean"]["input"]>;
  locale?: InputMaybe<PetitionLocale>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  remindersConfig?: InputMaybe<RemindersConfigInput>;
  signatureConfig?: InputMaybe<SignatureConfigInput>;
  skipForwardSecurity?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type UpdatePetitionVariableInput = {
  defaultValue: Scalars["Float"]["input"];
};

export type UpdateProfileFieldValueInput = {
  content?: InputMaybe<Scalars["JSONObject"]["input"]>;
  expiryDate?: InputMaybe<Scalars["Date"]["input"]>;
  profileTypeFieldId: Scalars["GID"]["input"];
};

export type UpdateProfileTypeFieldInput = {
  alias?: InputMaybe<Scalars["String"]["input"]>;
  expiryAlertAheadTime?: InputMaybe<Scalars["Duration"]["input"]>;
  isExpirable?: InputMaybe<Scalars["Boolean"]["input"]>;
  name?: InputMaybe<Scalars["LocalizableUserText"]["input"]>;
  options?: InputMaybe<Scalars["JSONObject"]["input"]>;
  substitutions?: InputMaybe<Array<UpdateProfileTypeFieldSelectOptionsSubstitution>>;
};

export type UpdateProfileTypeFieldPermissionsInput = {
  permission: ProfileTypeFieldPermissionType;
  userGroupId?: InputMaybe<Scalars["GID"]["input"]>;
  userId?: InputMaybe<Scalars["GID"]["input"]>;
};

export type UpdateProfileTypeFieldSelectOptionsSubstitution = {
  new?: InputMaybe<Scalars["String"]["input"]>;
  old: Scalars["String"]["input"];
};

export type UpdateTagInput = {
  color?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateUserGroupInput = {
  name?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateUserGroupPermissionsInput = {
  effect: UpdateUserGroupPermissionsInputEffect;
  name: Scalars["String"]["input"];
};

export type UpdateUserGroupPermissionsInputEffect = "DENY" | "GRANT" | "NONE";

/** A user in the system. */
export type User = Timestamps & {
  /** URL to the user avatar */
  avatarUrl: Maybe<Scalars["String"]["output"]>;
  canCreateUsers: Scalars["Boolean"]["output"];
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  dashboards: Array<Dashboard>;
  /** Users that the user can send on behalf of */
  delegateOf: Array<User>;
  /** Users that the user allows to send on their behalf */
  delegates: Array<User>;
  /** The email of the user. */
  email: Scalars["String"]["output"];
  /** The first name of the user. */
  firstName: Maybe<Scalars["String"]["output"]>;
  /** The full name of the user. */
  fullName: Maybe<Scalars["String"]["output"]>;
  hasFeatureFlag: Scalars["Boolean"]["output"];
  /** The ID of the user. */
  id: Scalars["GID"]["output"];
  /** The initials of the user. */
  initials: Maybe<Scalars["String"]["output"]>;
  isMe: Scalars["Boolean"]["output"];
  isOrgOwner: Scalars["Boolean"]["output"];
  isSsoUser: Scalars["Boolean"]["output"];
  isSuperAdmin: Scalars["Boolean"]["output"];
  lastActiveAt: Maybe<Scalars["DateTime"]["output"]>;
  /** The last name of the user. */
  lastName: Maybe<Scalars["String"]["output"]>;
  /** Read and unread user notifications about events on their petitions */
  notifications: UserNotifications_Pagination;
  organization: Organization;
  /** Organizations this user belongs to */
  organizations: Array<Organization>;
  permissions: Array<Scalars["String"]["output"]>;
  /** The petition views of the user */
  petitionListViews: Array<PetitionListView>;
  /** The pinned profile types of the user menu */
  pinnedProfileTypes: Array<ProfileType>;
  preferredLocale: UserLocale;
  /** The profile views of the user */
  profileListViews: Array<ProfileListView>;
  status: UserStatus;
  /** Lists the API tokens this user has. */
  tokens: Array<UserAuthenticationToken>;
  unreadNotificationCount: Scalars["Int"]["output"];
  unreadNotificationIds: Array<Scalars["GID"]["output"]>;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
  userGroups: Array<UserGroup>;
};

/** A user in the system. */
export type UseravatarUrlArgs = {
  options?: InputMaybe<ImageOptions>;
};

/** A user in the system. */
export type UserhasFeatureFlagArgs = {
  featureFlag: FeatureFlag;
};

/** A user in the system. */
export type UsernotificationsArgs = {
  before?: InputMaybe<Scalars["DateTime"]["input"]>;
  filter?: InputMaybe<PetitionUserNotificationFilter>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
};

/** A user in the system. */
export type UserprofileListViewsArgs = {
  profileTypeId: Scalars["GID"]["input"];
};

export type UserAuthenticationToken = CreatedAt & {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  hint: Maybe<Scalars["String"]["output"]>;
  id: Scalars["GID"]["output"];
  lastUsedAt: Maybe<Scalars["DateTime"]["output"]>;
  tokenName: Scalars["String"]["output"];
};

export type UserFilter = {
  status?: InputMaybe<Array<UserStatus>>;
};

export type UserGroup = Timestamps & {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  hasPermissions: Scalars["Boolean"]["output"];
  id: Scalars["GID"]["output"];
  imMember: Scalars["Boolean"]["output"];
  initials: Scalars["String"]["output"];
  localizableName: Scalars["LocalizableUserText"]["output"];
  memberCount: Scalars["Int"]["output"];
  members: Array<UserGroupMember>;
  name: Scalars["String"]["output"];
  permissions: Array<UserGroupPermission>;
  type: UserGroupType;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
};

export type UserGroupMember = {
  /** The time the user was added to the user group. */
  addedAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  user: User;
};

export type UserGroupPagination = {
  /** The requested slice of items. */
  items: Array<UserGroup>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type UserGroupPermission = {
  effect: UserGroupPermissionEffect;
  id: Scalars["GID"]["output"];
  name: Scalars["String"]["output"];
};

export type UserGroupPermissionEffect = "DENY" | "GRANT";

export type UserGroupType = "ALL_USERS" | "INITIAL" | "NORMAL";

/** The preferred locale for the user */
export type UserLocale = "en" | "es";

export type UserNotifications_Pagination = {
  /** Whether this resource has more items. */
  hasMore: Scalars["Boolean"]["output"];
  /** The requested slice of items. */
  items: Array<PetitionUserNotification>;
};

export type UserOrPetitionAccess = PetitionAccess | User;

export type UserOrUserGroup = User | UserGroup;

export type UserOrUserGroupPermissionInput = {
  isSubscribed: Scalars["Boolean"]["input"];
  permissionType: PetitionPermissionType;
  userGroupId?: InputMaybe<Scalars["GID"]["input"]>;
  userId?: InputMaybe<Scalars["GID"]["input"]>;
};

export type UserPagination = {
  /** The requested slice of items. */
  items: Array<User>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type UserPermissionAddedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  permissionType: PetitionPermissionType;
  permissionUser: Maybe<User>;
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type UserPermissionEditedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  permissionType: PetitionPermissionType;
  permissionUser: Maybe<User>;
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type UserPermissionRemovedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  permissionUser: Maybe<User>;
  petition: Maybe<PetitionBaseMini>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type UserStatus = "ACTIVE" | "INACTIVE" | "ON_HOLD";

export type VerificationCodeCheck = {
  remainingAttempts: Maybe<Scalars["Int"]["output"]>;
  result: Result;
};

export type VerificationCodeRequest = {
  expiresAt: Scalars["DateTime"]["output"];
  remainingAttempts: Scalars["Int"]["output"];
  token: Scalars["ID"]["output"];
};

export type AWSPresignedPostDataFragment = { fields: { [key: string]: any }; url: string };

export type UserFragment = {
  id: string;
  email: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
};

export type OrganizationFragment = { id: string; name: string };

export type UserGroupFragment = { id: string; name: string };

export type ContactFragment = {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PetitionAccessFragment = {
  id: string;
  status: PetitionAccessStatus;
  reminderCount: number;
  remindersLeft: number;
  remindersActive: boolean;
  nextReminderAt: string | null;
  createdAt: string;
  contact: {
    id: string;
    email: string;
    fullName: string;
    firstName: string;
    lastName: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  granter: {
    id: string;
    email: string;
    fullName: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
};

export type _PetitionFieldFragment = {
  id: string;
  title: string | null;
  description: string | null;
  type: PetitionFieldType;
  fromPetitionFieldId: string | null;
  alias: string | null;
  options: { [key: string]: any };
  optional: boolean;
  multiple: boolean;
};

export type PetitionFieldFragment = {
  id: string;
  title: string | null;
  description: string | null;
  type: PetitionFieldType;
  fromPetitionFieldId: string | null;
  alias: string | null;
  options: { [key: string]: any };
  optional: boolean;
  multiple: boolean;
  children: Array<{
    id: string;
    title: string | null;
    description: string | null;
    type: PetitionFieldType;
    fromPetitionFieldId: string | null;
    alias: string | null;
    options: { [key: string]: any };
    optional: boolean;
    multiple: boolean;
  }> | null;
};

export type _PetitionFieldReplyFragment = {
  id: string;
  content: { [key: string]: any };
  status: PetitionFieldReplyStatus;
  metadata: { [key: string]: any };
  createdAt: string;
  updatedAt: string;
};

export type PetitionFieldReplyFragment = {
  id: string;
  content: { [key: string]: any };
  status: PetitionFieldReplyStatus;
  metadata: { [key: string]: any };
  createdAt: string;
  updatedAt: string;
  children: Array<{
    field: { id: string; type: PetitionFieldType };
    replies: Array<{
      id: string;
      content: { [key: string]: any };
      status: PetitionFieldReplyStatus;
      metadata: { [key: string]: any };
      createdAt: string;
      updatedAt: string;
    }>;
  }> | null;
};

export type PetitionFieldWithRepliesFragment = {
  id: string;
  title: string | null;
  description: string | null;
  type: PetitionFieldType;
  fromPetitionFieldId: string | null;
  alias: string | null;
  options: { [key: string]: any };
  optional: boolean;
  multiple: boolean;
  replies: Array<{
    id: string;
    content: { [key: string]: any };
    status: PetitionFieldReplyStatus;
    metadata: { [key: string]: any };
    createdAt: string;
    updatedAt: string;
    children: Array<{
      field: { id: string; type: PetitionFieldType };
      replies: Array<{
        id: string;
        content: { [key: string]: any };
        status: PetitionFieldReplyStatus;
        metadata: { [key: string]: any };
        createdAt: string;
        updatedAt: string;
      }>;
    }> | null;
  }>;
  children: Array<{
    id: string;
    title: string | null;
    description: string | null;
    type: PetitionFieldType;
    fromPetitionFieldId: string | null;
    alias: string | null;
    options: { [key: string]: any };
    optional: boolean;
    multiple: boolean;
  }> | null;
};

export type TagFragment = { id: string; name: string };

export type PetitionSignatureRequestFragment = {
  id: string;
  status: PetitionSignatureRequestStatus;
  environment: SignatureOrgIntegrationEnvironment;
  createdAt: string;
  updatedAt: string;
  signatureConfig: {
    signers: Array<{ email: string; firstName: string; lastName: string | null } | null>;
  };
};

export type PetitionFragment = {
  id: string;
  path: string;
  name: string | null;
  status: PetitionStatus;
  deadline: string | null;
  locale: PetitionLocale;
  createdAt: string;
  customProperties: { [key: string]: any };
  isAnonymized: boolean;
  fromTemplate: { id: string } | null;
  recipients?: Array<{
    recipientUrl: string | null;
    id: string;
    status: PetitionAccessStatus;
    reminderCount: number;
    remindersLeft: number;
    remindersActive: boolean;
    nextReminderAt: string | null;
    createdAt: string;
    contact: {
      id: string;
      email: string;
      fullName: string;
      firstName: string;
      lastName: string | null;
      createdAt: string;
      updatedAt: string;
    } | null;
    granter: {
      id: string;
      email: string;
      fullName: string | null;
      firstName: string | null;
      lastName: string | null;
    } | null;
  }>;
  fields?: Array<{
    id: string;
    title: string | null;
    description: string | null;
    type: PetitionFieldType;
    fromPetitionFieldId: string | null;
    alias: string | null;
    options: { [key: string]: any };
    optional: boolean;
    multiple: boolean;
    replies: Array<{
      id: string;
      content: { [key: string]: any };
      status: PetitionFieldReplyStatus;
      metadata: { [key: string]: any };
      createdAt: string;
      updatedAt: string;
      children: Array<{
        field: { id: string; type: PetitionFieldType };
        replies: Array<{
          id: string;
          content: { [key: string]: any };
          status: PetitionFieldReplyStatus;
          metadata: { [key: string]: any };
          createdAt: string;
          updatedAt: string;
        }>;
      }> | null;
    }>;
    children: Array<{
      id: string;
      title: string | null;
      description: string | null;
      type: PetitionFieldType;
      fromPetitionFieldId: string | null;
      alias: string | null;
      options: { [key: string]: any };
      optional: boolean;
      multiple: boolean;
    }> | null;
  }>;
  replies?: Array<{
    id: string;
    alias: string | null;
    type: PetitionFieldType;
    replies: Array<{
      id: string;
      content: { [key: string]: any };
      metadata: { [key: string]: any };
      children: Array<{
        field: { id: string; alias: string | null; type: PetitionFieldType };
        replies: Array<{
          id: string;
          content: { [key: string]: any };
          metadata: { [key: string]: any };
        }>;
      }> | null;
    }>;
  }>;
  tags?: Array<{ id: string; name: string }>;
  signatureConfig?: {
    isEnabled: boolean;
    signers: Array<{ email: string; firstName: string; lastName: string | null } | null>;
  } | null;
  progress?: {
    external: { approved: number; replied: number; optional: number; total: number };
    internal: { approved: number; replied: number; optional: number; total: number };
  };
  variablesResult?: Array<{ name: string; value: number | null }>;
  signatures?: Array<{
    id: string;
    status: PetitionSignatureRequestStatus;
    environment: SignatureOrgIntegrationEnvironment;
    createdAt: string;
    updatedAt: string;
    signatureConfig: {
      signers: Array<{ email: string; firstName: string; lastName: string | null } | null>;
    };
  }>;
  owner?: {
    id: string;
    email: string;
    fullName: string | null;
    firstName: string | null;
    lastName: string | null;
  };
};

export type TemplateFragment = {
  id: string;
  name: string | null;
  path: string;
  description: any | null;
  locale: PetitionLocale;
  createdAt: string;
  customProperties: { [key: string]: any };
  fields?: Array<{
    id: string;
    title: string | null;
    description: string | null;
    type: PetitionFieldType;
    fromPetitionFieldId: string | null;
    alias: string | null;
    options: { [key: string]: any };
    optional: boolean;
    multiple: boolean;
    children: Array<{
      id: string;
      title: string | null;
      description: string | null;
      type: PetitionFieldType;
      fromPetitionFieldId: string | null;
      alias: string | null;
      options: { [key: string]: any };
      optional: boolean;
      multiple: boolean;
    }> | null;
  }>;
  tags?: Array<{ id: string; name: string }>;
};

export type Permission_PetitionUserGroupPermission_Fragment = {
  permissionType: PetitionPermissionType;
  createdAt: string;
  group: { id: string; name: string };
};

export type Permission_PetitionUserPermission_Fragment = {
  permissionType: PetitionPermissionType;
  createdAt: string;
  user: {
    id: string;
    email: string;
    fullName: string | null;
    firstName: string | null;
    lastName: string | null;
  };
};

export type PermissionFragment =
  | Permission_PetitionUserGroupPermission_Fragment
  | Permission_PetitionUserPermission_Fragment;

export type PetitionEventSubscriptionFragment = {
  __typename: "PetitionEventSubscription";
  id: string;
  name: string | null;
  eventsUrl: string;
  isEnabled: boolean;
  petitionEventTypes: Array<PetitionEventType> | null;
  fromTemplate: { id: string } | null;
};

export type ProfileEventSubscriptionFragment = {
  __typename: "ProfileEventSubscription";
  id: string;
  name: string | null;
  eventsUrl: string;
  isEnabled: boolean;
  profileEventTypes: Array<ProfileEventType> | null;
  fromProfileType: { id: string } | null;
};

export type EventSubscription_PetitionEventSubscription_Fragment = {
  __typename: "PetitionEventSubscription";
  id: string;
  name: string | null;
  eventsUrl: string;
  isEnabled: boolean;
  petitionEventTypes: Array<PetitionEventType> | null;
  fromTemplate: { id: string } | null;
};

export type EventSubscription_ProfileEventSubscription_Fragment = {
  __typename: "ProfileEventSubscription";
  id: string;
  name: string | null;
  eventsUrl: string;
  isEnabled: boolean;
  profileEventTypes: Array<ProfileEventType> | null;
  fromProfileType: { id: string } | null;
};

export type EventSubscriptionFragment =
  | EventSubscription_PetitionEventSubscription_Fragment
  | EventSubscription_ProfileEventSubscription_Fragment;

export type TaskFragment = {
  id: string;
  progress: number | null;
  status: TaskStatus;
  output: any | null;
};

export type ProfileTypeFieldFragment = {
  id: string;
  name: { [locale in UserLocale]?: string };
  alias: string | null;
  type: ProfileTypeFieldType;
  isExpirable: boolean;
  options?: { [key: string]: any };
};

export type ProfileFieldValueFragment = {
  id: string;
  content: { [key: string]: any } | null;
  expiresAt: string | null;
  createdAt: string;
};

export type ProfileFieldFileFragment = {
  id: string;
  expiresAt: string | null;
  createdAt: string;
  file: { filename: string; size: number; contentType: string } | null;
};

export type ProfileTypeFragment = {
  id: string;
  name: { [locale in UserLocale]?: string };
  fields?: Array<{
    id: string;
    name: { [locale in UserLocale]?: string };
    alias: string | null;
    type: ProfileTypeFieldType;
    isExpirable: boolean;
    options?: { [key: string]: any };
  }>;
};

export type ProfileFieldPropertyFragment = {
  field: {
    id: string;
    name: { [locale in UserLocale]?: string };
    alias: string | null;
    type: ProfileTypeFieldType;
    isExpirable: boolean;
    options?: { [key: string]: any };
  };
  value: {
    id: string;
    content: { [key: string]: any } | null;
    expiresAt: string | null;
    createdAt: string;
  } | null;
  files: Array<{
    id: string;
    expiresAt: string | null;
    createdAt: string;
    file: { filename: string; size: number; contentType: string } | null;
  }> | null;
};

export type ProfileBaseFragment = {
  id: string;
  name: string;
  status: ProfileStatus;
  createdAt: string;
  profileType: { id: string; name: { [locale in UserLocale]?: string } };
};

export type ProfileRelationshipFragment = {
  id: string;
  leftSideProfile: {
    id: string;
    name: string;
    status: ProfileStatus;
    createdAt: string;
    profileType: { id: string; name: { [locale in UserLocale]?: string } };
  };
  rightSideProfile: {
    id: string;
    name: string;
    status: ProfileStatus;
    createdAt: string;
    profileType: { id: string; name: { [locale in UserLocale]?: string } };
  };
  relationshipType: {
    alias: string | null;
    id: string;
    leftRightName: { [locale in UserLocale]?: string };
    rightLeftName: { [locale in UserLocale]?: string };
  };
};

export type ProfileFragment = {
  id: string;
  name: string;
  status: ProfileStatus;
  createdAt: string;
  properties: Array<{
    field: {
      id: string;
      name: { [locale in UserLocale]?: string };
      alias: string | null;
      type: ProfileTypeFieldType;
      isExpirable: boolean;
      options?: { [key: string]: any };
    };
    value: {
      id: string;
      content: { [key: string]: any } | null;
      expiresAt: string | null;
      createdAt: string;
    } | null;
    files: Array<{
      id: string;
      expiresAt: string | null;
      createdAt: string;
      file: { filename: string; size: number; contentType: string } | null;
    }> | null;
  }>;
  relationships?: Array<{
    id: string;
    leftSideProfile: {
      id: string;
      name: string;
      status: ProfileStatus;
      createdAt: string;
      profileType: { id: string; name: { [locale in UserLocale]?: string } };
    };
    rightSideProfile: {
      id: string;
      name: string;
      status: ProfileStatus;
      createdAt: string;
      profileType: { id: string; name: { [locale in UserLocale]?: string } };
    };
    relationshipType: {
      alias: string | null;
      id: string;
      leftRightName: { [locale in UserLocale]?: string };
      rightLeftName: { [locale in UserLocale]?: string };
    };
  }>;
  subscribers?: Array<{
    user: {
      id: string;
      email: string;
      fullName: string | null;
      firstName: string | null;
      lastName: string | null;
    };
  }>;
  profileType: { id: string; name: { [locale in UserLocale]?: string } };
};

export type PetitionFieldCommentFragment = {
  id: string;
  content: any | null;
  isInternal: boolean;
  createdAt: string;
  isAnonymized: boolean;
  author:
    | {
        __typename: "PetitionAccess";
        contact: { id: string; email: string; fullName: string } | null;
      }
    | { __typename: "User"; id: string; email: string; fullName: string | null }
    | null;
  mentions: Array<
    | {
        __typename: "PetitionFieldCommentUserGroupMention";
        userGroup: {
          id: string;
          name: string;
          localizableName: { [locale in UserLocale]?: string };
        } | null;
      }
    | {
        __typename: "PetitionFieldCommentUserMention";
        user: { id: string; email: string; fullName: string | null } | null;
      }
  >;
};

export type waitForTask_TaskQueryVariables = Exact<{
  id: Scalars["GID"]["input"];
}>;

export type waitForTask_TaskQuery = {
  task: { id: string; progress: number | null; status: TaskStatus; output: any | null };
};

export type getTaskResultFileUrl_getTaskResultFileMutationVariables = Exact<{
  taskId: Scalars["GID"]["input"];
}>;

export type getTaskResultFileUrl_getTaskResultFileMutation = { getTaskResultFile: { url: string } };

export type getTags_tagsByNameQueryVariables = Exact<{
  offset: Scalars["Int"]["input"];
  limit: Scalars["Int"]["input"];
  search: Array<Scalars["String"]["input"]> | Scalars["String"]["input"];
}>;

export type getTags_tagsByNameQuery = {
  tagsByName: { totalCount: number; items: Array<{ id: string; name: string }> };
};

export type CreatePetitionRecipients_contactQueryVariables = Exact<{
  email: Scalars["String"]["input"];
}>;

export type CreatePetitionRecipients_contactQuery = {
  contacts: Array<{ id: string; firstName: string; lastName: string | null } | null>;
};

export type CreatePetitionRecipients_updateContactMutationVariables = Exact<{
  contactId: Scalars["GID"]["input"];
  data: UpdateContactInput;
}>;

export type CreatePetitionRecipients_updateContactMutation = { updateContact: { id: string } };

export type CreatePetitionRecipients_createContactMutationVariables = Exact<{
  data: CreateContactInput;
}>;

export type CreatePetitionRecipients_createContactMutation = { createContact: { id: string } };

export type parsePetitionCommentBody_usersByEmailQueryVariables = Exact<{
  search: Scalars["String"]["input"];
}>;

export type parsePetitionCommentBody_usersByEmailQuery = {
  me: { organization: { usersByEmail: { items: Array<{ id: string; fullName: string | null }> } } };
};

export type parsePetitionCommentBody_userGroupsQueryVariables = Exact<{
  search: Scalars["String"]["input"];
}>;

export type parsePetitionCommentBody_userGroupsQuery = {
  userGroups: {
    items: Array<{
      id: string;
      name: string;
      localizableName: { [locale in UserLocale]?: string };
    }>;
  };
};

export type parsePetitionCommentBody_getUsersOrGroupsQueryVariables = Exact<{
  ids: Array<Scalars["ID"]["input"]> | Scalars["ID"]["input"];
}>;

export type parsePetitionCommentBody_getUsersOrGroupsQuery = {
  getUsersOrGroups: Array<
    | { __typename: "User"; id: string; fullName: string | null }
    | {
        __typename: "UserGroup";
        id: string;
        name: string;
        localizableName: { [locale in UserLocale]?: string };
      }
  >;
};

export type GetMe_userQueryVariables = Exact<{ [key: string]: never }>;

export type GetMe_userQuery = {
  me: {
    id: string;
    email: string;
    fullName: string | null;
    firstName: string | null;
    lastName: string | null;
    organization: { id: string; name: string };
  };
};

export type GetTags_tagsQueryVariables = Exact<{
  offset: Scalars["Int"]["input"];
  limit: Scalars["Int"]["input"];
  search?: InputMaybe<Scalars["String"]["input"]>;
}>;

export type GetTags_tagsQuery = {
  tags: { totalCount: number; items: Array<{ id: string; name: string }> };
};

export type GetPetitions_petitionsQueryVariables = Exact<{
  offset: Scalars["Int"]["input"];
  limit: Scalars["Int"]["input"];
  search?: InputMaybe<Scalars["String"]["input"]>;
  status?: InputMaybe<Array<PetitionStatus> | PetitionStatus>;
  tags?: InputMaybe<PetitionTagFilter>;
  sortBy?: InputMaybe<Array<QueryPetitions_OrderBy> | QueryPetitions_OrderBy>;
  includeRecipients: Scalars["Boolean"]["input"];
  includeFields: Scalars["Boolean"]["input"];
  includeTags: Scalars["Boolean"]["input"];
  includeRecipientUrl: Scalars["Boolean"]["input"];
  includeReplies: Scalars["Boolean"]["input"];
  includeProgress: Scalars["Boolean"]["input"];
  includeSigners: Scalars["Boolean"]["input"];
  includeVariablesResult: Scalars["Boolean"]["input"];
  includeSignatureRequests: Scalars["Boolean"]["input"];
  includeOwner: Scalars["Boolean"]["input"];
  fromTemplateId?: InputMaybe<Array<Scalars["GID"]["input"]> | Scalars["GID"]["input"]>;
}>;

export type GetPetitions_petitionsQuery = {
  petitions: {
    totalCount: number;
    items: Array<
      | {
          id: string;
          path: string;
          name: string | null;
          status: PetitionStatus;
          deadline: string | null;
          locale: PetitionLocale;
          createdAt: string;
          customProperties: { [key: string]: any };
          isAnonymized: boolean;
          fromTemplate: { id: string } | null;
          recipients?: Array<{
            recipientUrl: string | null;
            id: string;
            status: PetitionAccessStatus;
            reminderCount: number;
            remindersLeft: number;
            remindersActive: boolean;
            nextReminderAt: string | null;
            createdAt: string;
            contact: {
              id: string;
              email: string;
              fullName: string;
              firstName: string;
              lastName: string | null;
              createdAt: string;
              updatedAt: string;
            } | null;
            granter: {
              id: string;
              email: string;
              fullName: string | null;
              firstName: string | null;
              lastName: string | null;
            } | null;
          }>;
          fields?: Array<{
            id: string;
            title: string | null;
            description: string | null;
            type: PetitionFieldType;
            fromPetitionFieldId: string | null;
            alias: string | null;
            options: { [key: string]: any };
            optional: boolean;
            multiple: boolean;
            replies: Array<{
              id: string;
              content: { [key: string]: any };
              status: PetitionFieldReplyStatus;
              metadata: { [key: string]: any };
              createdAt: string;
              updatedAt: string;
              children: Array<{
                field: { id: string; type: PetitionFieldType };
                replies: Array<{
                  id: string;
                  content: { [key: string]: any };
                  status: PetitionFieldReplyStatus;
                  metadata: { [key: string]: any };
                  createdAt: string;
                  updatedAt: string;
                }>;
              }> | null;
            }>;
            children: Array<{
              id: string;
              title: string | null;
              description: string | null;
              type: PetitionFieldType;
              fromPetitionFieldId: string | null;
              alias: string | null;
              options: { [key: string]: any };
              optional: boolean;
              multiple: boolean;
            }> | null;
          }>;
          replies?: Array<{
            id: string;
            alias: string | null;
            type: PetitionFieldType;
            replies: Array<{
              id: string;
              content: { [key: string]: any };
              metadata: { [key: string]: any };
              children: Array<{
                field: { id: string; alias: string | null; type: PetitionFieldType };
                replies: Array<{
                  id: string;
                  content: { [key: string]: any };
                  metadata: { [key: string]: any };
                }>;
              }> | null;
            }>;
          }>;
          tags?: Array<{ id: string; name: string }>;
          signatureConfig?: {
            isEnabled: boolean;
            signers: Array<{ email: string; firstName: string; lastName: string | null } | null>;
          } | null;
          progress?: {
            external: { approved: number; replied: number; optional: number; total: number };
            internal: { approved: number; replied: number; optional: number; total: number };
          };
          variablesResult?: Array<{ name: string; value: number | null }>;
          signatures?: Array<{
            id: string;
            status: PetitionSignatureRequestStatus;
            environment: SignatureOrgIntegrationEnvironment;
            createdAt: string;
            updatedAt: string;
            signatureConfig: {
              signers: Array<{ email: string; firstName: string; lastName: string | null } | null>;
            };
          }>;
          owner?: {
            id: string;
            email: string;
            fullName: string | null;
            firstName: string | null;
            lastName: string | null;
          };
        }
      | {}
    >;
  };
};

export type CreatePetition_petitionMutationVariables = Exact<{
  name?: InputMaybe<Scalars["String"]["input"]>;
  templateId?: InputMaybe<Scalars["GID"]["input"]>;
  includeRecipients: Scalars["Boolean"]["input"];
  includeFields: Scalars["Boolean"]["input"];
  includeTags: Scalars["Boolean"]["input"];
  includeRecipientUrl: Scalars["Boolean"]["input"];
  includeReplies: Scalars["Boolean"]["input"];
  includeProgress: Scalars["Boolean"]["input"];
  includeSigners: Scalars["Boolean"]["input"];
  includeVariablesResult: Scalars["Boolean"]["input"];
  includeSignatureRequests: Scalars["Boolean"]["input"];
  includeOwner: Scalars["Boolean"]["input"];
}>;

export type CreatePetition_petitionMutation = {
  createPetition:
    | {
        id: string;
        path: string;
        name: string | null;
        status: PetitionStatus;
        deadline: string | null;
        locale: PetitionLocale;
        createdAt: string;
        customProperties: { [key: string]: any };
        isAnonymized: boolean;
        fromTemplate: { id: string } | null;
        recipients?: Array<{
          recipientUrl: string | null;
          id: string;
          status: PetitionAccessStatus;
          reminderCount: number;
          remindersLeft: number;
          remindersActive: boolean;
          nextReminderAt: string | null;
          createdAt: string;
          contact: {
            id: string;
            email: string;
            fullName: string;
            firstName: string;
            lastName: string | null;
            createdAt: string;
            updatedAt: string;
          } | null;
          granter: {
            id: string;
            email: string;
            fullName: string | null;
            firstName: string | null;
            lastName: string | null;
          } | null;
        }>;
        fields?: Array<{
          id: string;
          title: string | null;
          description: string | null;
          type: PetitionFieldType;
          fromPetitionFieldId: string | null;
          alias: string | null;
          options: { [key: string]: any };
          optional: boolean;
          multiple: boolean;
          replies: Array<{
            id: string;
            content: { [key: string]: any };
            status: PetitionFieldReplyStatus;
            metadata: { [key: string]: any };
            createdAt: string;
            updatedAt: string;
            children: Array<{
              field: { id: string; type: PetitionFieldType };
              replies: Array<{
                id: string;
                content: { [key: string]: any };
                status: PetitionFieldReplyStatus;
                metadata: { [key: string]: any };
                createdAt: string;
                updatedAt: string;
              }>;
            }> | null;
          }>;
          children: Array<{
            id: string;
            title: string | null;
            description: string | null;
            type: PetitionFieldType;
            fromPetitionFieldId: string | null;
            alias: string | null;
            options: { [key: string]: any };
            optional: boolean;
            multiple: boolean;
          }> | null;
        }>;
        replies?: Array<{
          id: string;
          alias: string | null;
          type: PetitionFieldType;
          replies: Array<{
            id: string;
            content: { [key: string]: any };
            metadata: { [key: string]: any };
            children: Array<{
              field: { id: string; alias: string | null; type: PetitionFieldType };
              replies: Array<{
                id: string;
                content: { [key: string]: any };
                metadata: { [key: string]: any };
              }>;
            }> | null;
          }>;
        }>;
        tags?: Array<{ id: string; name: string }>;
        signatureConfig?: {
          isEnabled: boolean;
          signers: Array<{ email: string; firstName: string; lastName: string | null } | null>;
        } | null;
        progress?: {
          external: { approved: number; replied: number; optional: number; total: number };
          internal: { approved: number; replied: number; optional: number; total: number };
        };
        variablesResult?: Array<{ name: string; value: number | null }>;
        signatures?: Array<{
          id: string;
          status: PetitionSignatureRequestStatus;
          environment: SignatureOrgIntegrationEnvironment;
          createdAt: string;
          updatedAt: string;
          signatureConfig: {
            signers: Array<{ email: string; firstName: string; lastName: string | null } | null>;
          };
        }>;
        owner?: {
          id: string;
          email: string;
          fullName: string | null;
          firstName: string | null;
          lastName: string | null;
        };
      }
    | {};
};

export type GetPetition_petitionQueryVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  includeRecipients: Scalars["Boolean"]["input"];
  includeFields: Scalars["Boolean"]["input"];
  includeTags: Scalars["Boolean"]["input"];
  includeRecipientUrl: Scalars["Boolean"]["input"];
  includeReplies: Scalars["Boolean"]["input"];
  includeProgress: Scalars["Boolean"]["input"];
  includeSigners: Scalars["Boolean"]["input"];
  includeVariablesResult: Scalars["Boolean"]["input"];
  includeSignatureRequests: Scalars["Boolean"]["input"];
  includeOwner: Scalars["Boolean"]["input"];
}>;

export type GetPetition_petitionQuery = {
  petition:
    | {
        id: string;
        path: string;
        name: string | null;
        status: PetitionStatus;
        deadline: string | null;
        locale: PetitionLocale;
        createdAt: string;
        customProperties: { [key: string]: any };
        isAnonymized: boolean;
        fromTemplate: { id: string } | null;
        recipients?: Array<{
          recipientUrl: string | null;
          id: string;
          status: PetitionAccessStatus;
          reminderCount: number;
          remindersLeft: number;
          remindersActive: boolean;
          nextReminderAt: string | null;
          createdAt: string;
          contact: {
            id: string;
            email: string;
            fullName: string;
            firstName: string;
            lastName: string | null;
            createdAt: string;
            updatedAt: string;
          } | null;
          granter: {
            id: string;
            email: string;
            fullName: string | null;
            firstName: string | null;
            lastName: string | null;
          } | null;
        }>;
        fields?: Array<{
          id: string;
          title: string | null;
          description: string | null;
          type: PetitionFieldType;
          fromPetitionFieldId: string | null;
          alias: string | null;
          options: { [key: string]: any };
          optional: boolean;
          multiple: boolean;
          replies: Array<{
            id: string;
            content: { [key: string]: any };
            status: PetitionFieldReplyStatus;
            metadata: { [key: string]: any };
            createdAt: string;
            updatedAt: string;
            children: Array<{
              field: { id: string; type: PetitionFieldType };
              replies: Array<{
                id: string;
                content: { [key: string]: any };
                status: PetitionFieldReplyStatus;
                metadata: { [key: string]: any };
                createdAt: string;
                updatedAt: string;
              }>;
            }> | null;
          }>;
          children: Array<{
            id: string;
            title: string | null;
            description: string | null;
            type: PetitionFieldType;
            fromPetitionFieldId: string | null;
            alias: string | null;
            options: { [key: string]: any };
            optional: boolean;
            multiple: boolean;
          }> | null;
        }>;
        replies?: Array<{
          id: string;
          alias: string | null;
          type: PetitionFieldType;
          replies: Array<{
            id: string;
            content: { [key: string]: any };
            metadata: { [key: string]: any };
            children: Array<{
              field: { id: string; alias: string | null; type: PetitionFieldType };
              replies: Array<{
                id: string;
                content: { [key: string]: any };
                metadata: { [key: string]: any };
              }>;
            }> | null;
          }>;
        }>;
        tags?: Array<{ id: string; name: string }>;
        signatureConfig?: {
          isEnabled: boolean;
          signers: Array<{ email: string; firstName: string; lastName: string | null } | null>;
        } | null;
        progress?: {
          external: { approved: number; replied: number; optional: number; total: number };
          internal: { approved: number; replied: number; optional: number; total: number };
        };
        variablesResult?: Array<{ name: string; value: number | null }>;
        signatures?: Array<{
          id: string;
          status: PetitionSignatureRequestStatus;
          environment: SignatureOrgIntegrationEnvironment;
          createdAt: string;
          updatedAt: string;
          signatureConfig: {
            signers: Array<{ email: string; firstName: string; lastName: string | null } | null>;
          };
        }>;
        owner?: {
          id: string;
          email: string;
          fullName: string | null;
          firstName: string | null;
          lastName: string | null;
        };
      }
    | {}
    | null;
};

export type UpdatePetition_petitionQueryVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
}>;

export type UpdatePetition_petitionQuery = {
  petition:
    | {
        __typename: "Petition";
        signatureConfig: {
          isEnabled: boolean;
          allowAdditionalSigners: boolean;
          review: boolean;
          timezone: string;
          title: string | null;
          signingMode: SignatureConfigSigningMode;
          instructions: string | null;
          minSigners: number;
          integration: { id: string } | null;
        } | null;
      }
    | {
        __typename: "PetitionTemplate";
        signatureConfig: {
          isEnabled: boolean;
          allowAdditionalSigners: boolean;
          review: boolean;
          timezone: string;
          title: string | null;
          signingMode: SignatureConfigSigningMode;
          instructions: string | null;
          minSigners: number;
          integration: { id: string } | null;
        } | null;
      }
    | null;
};

export type UpdatePetition_updatePetitionMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  data: UpdatePetitionInput;
  includeRecipients: Scalars["Boolean"]["input"];
  includeFields: Scalars["Boolean"]["input"];
  includeTags: Scalars["Boolean"]["input"];
  includeRecipientUrl: Scalars["Boolean"]["input"];
  includeReplies: Scalars["Boolean"]["input"];
  includeProgress: Scalars["Boolean"]["input"];
  includeSigners: Scalars["Boolean"]["input"];
  includeVariablesResult: Scalars["Boolean"]["input"];
  includeSignatureRequests: Scalars["Boolean"]["input"];
  includeOwner: Scalars["Boolean"]["input"];
}>;

export type UpdatePetition_updatePetitionMutation = {
  updatePetition:
    | {
        id: string;
        path: string;
        name: string | null;
        status: PetitionStatus;
        deadline: string | null;
        locale: PetitionLocale;
        createdAt: string;
        customProperties: { [key: string]: any };
        isAnonymized: boolean;
        fromTemplate: { id: string } | null;
        recipients?: Array<{
          recipientUrl: string | null;
          id: string;
          status: PetitionAccessStatus;
          reminderCount: number;
          remindersLeft: number;
          remindersActive: boolean;
          nextReminderAt: string | null;
          createdAt: string;
          contact: {
            id: string;
            email: string;
            fullName: string;
            firstName: string;
            lastName: string | null;
            createdAt: string;
            updatedAt: string;
          } | null;
          granter: {
            id: string;
            email: string;
            fullName: string | null;
            firstName: string | null;
            lastName: string | null;
          } | null;
        }>;
        fields?: Array<{
          id: string;
          title: string | null;
          description: string | null;
          type: PetitionFieldType;
          fromPetitionFieldId: string | null;
          alias: string | null;
          options: { [key: string]: any };
          optional: boolean;
          multiple: boolean;
          replies: Array<{
            id: string;
            content: { [key: string]: any };
            status: PetitionFieldReplyStatus;
            metadata: { [key: string]: any };
            createdAt: string;
            updatedAt: string;
            children: Array<{
              field: { id: string; type: PetitionFieldType };
              replies: Array<{
                id: string;
                content: { [key: string]: any };
                status: PetitionFieldReplyStatus;
                metadata: { [key: string]: any };
                createdAt: string;
                updatedAt: string;
              }>;
            }> | null;
          }>;
          children: Array<{
            id: string;
            title: string | null;
            description: string | null;
            type: PetitionFieldType;
            fromPetitionFieldId: string | null;
            alias: string | null;
            options: { [key: string]: any };
            optional: boolean;
            multiple: boolean;
          }> | null;
        }>;
        replies?: Array<{
          id: string;
          alias: string | null;
          type: PetitionFieldType;
          replies: Array<{
            id: string;
            content: { [key: string]: any };
            metadata: { [key: string]: any };
            children: Array<{
              field: { id: string; alias: string | null; type: PetitionFieldType };
              replies: Array<{
                id: string;
                content: { [key: string]: any };
                metadata: { [key: string]: any };
              }>;
            }> | null;
          }>;
        }>;
        tags?: Array<{ id: string; name: string }>;
        signatureConfig?: {
          isEnabled: boolean;
          signers: Array<{ email: string; firstName: string; lastName: string | null } | null>;
        } | null;
        progress?: {
          external: { approved: number; replied: number; optional: number; total: number };
          internal: { approved: number; replied: number; optional: number; total: number };
        };
        variablesResult?: Array<{ name: string; value: number | null }>;
        signatures?: Array<{
          id: string;
          status: PetitionSignatureRequestStatus;
          environment: SignatureOrgIntegrationEnvironment;
          createdAt: string;
          updatedAt: string;
          signatureConfig: {
            signers: Array<{ email: string; firstName: string; lastName: string | null } | null>;
          };
        }>;
        owner?: {
          id: string;
          email: string;
          fullName: string | null;
          firstName: string | null;
          lastName: string | null;
        };
      }
    | {};
};

export type DeletePetition_deletePetitionsMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  force: Scalars["Boolean"]["input"];
}>;

export type DeletePetition_deletePetitionsMutation = { deletePetitions: Success };

export type ClosePetition_closePetitionMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  includeRecipients: Scalars["Boolean"]["input"];
  includeFields: Scalars["Boolean"]["input"];
  includeTags: Scalars["Boolean"]["input"];
  includeRecipientUrl: Scalars["Boolean"]["input"];
  includeReplies: Scalars["Boolean"]["input"];
  includeProgress: Scalars["Boolean"]["input"];
  includeSigners: Scalars["Boolean"]["input"];
  includeVariablesResult: Scalars["Boolean"]["input"];
  includeSignatureRequests: Scalars["Boolean"]["input"];
  includeOwner: Scalars["Boolean"]["input"];
}>;

export type ClosePetition_closePetitionMutation = {
  closePetition: {
    id: string;
    path: string;
    name: string | null;
    status: PetitionStatus;
    deadline: string | null;
    locale: PetitionLocale;
    createdAt: string;
    customProperties: { [key: string]: any };
    isAnonymized: boolean;
    fromTemplate: { id: string } | null;
    recipients?: Array<{
      recipientUrl: string | null;
      id: string;
      status: PetitionAccessStatus;
      reminderCount: number;
      remindersLeft: number;
      remindersActive: boolean;
      nextReminderAt: string | null;
      createdAt: string;
      contact: {
        id: string;
        email: string;
        fullName: string;
        firstName: string;
        lastName: string | null;
        createdAt: string;
        updatedAt: string;
      } | null;
      granter: {
        id: string;
        email: string;
        fullName: string | null;
        firstName: string | null;
        lastName: string | null;
      } | null;
    }>;
    fields?: Array<{
      id: string;
      title: string | null;
      description: string | null;
      type: PetitionFieldType;
      fromPetitionFieldId: string | null;
      alias: string | null;
      options: { [key: string]: any };
      optional: boolean;
      multiple: boolean;
      replies: Array<{
        id: string;
        content: { [key: string]: any };
        status: PetitionFieldReplyStatus;
        metadata: { [key: string]: any };
        createdAt: string;
        updatedAt: string;
        children: Array<{
          field: { id: string; type: PetitionFieldType };
          replies: Array<{
            id: string;
            content: { [key: string]: any };
            status: PetitionFieldReplyStatus;
            metadata: { [key: string]: any };
            createdAt: string;
            updatedAt: string;
          }>;
        }> | null;
      }>;
      children: Array<{
        id: string;
        title: string | null;
        description: string | null;
        type: PetitionFieldType;
        fromPetitionFieldId: string | null;
        alias: string | null;
        options: { [key: string]: any };
        optional: boolean;
        multiple: boolean;
      }> | null;
    }>;
    replies?: Array<{
      id: string;
      alias: string | null;
      type: PetitionFieldType;
      replies: Array<{
        id: string;
        content: { [key: string]: any };
        metadata: { [key: string]: any };
        children: Array<{
          field: { id: string; alias: string | null; type: PetitionFieldType };
          replies: Array<{
            id: string;
            content: { [key: string]: any };
            metadata: { [key: string]: any };
          }>;
        }> | null;
      }>;
    }>;
    tags?: Array<{ id: string; name: string }>;
    signatureConfig?: {
      isEnabled: boolean;
      signers: Array<{ email: string; firstName: string; lastName: string | null } | null>;
    } | null;
    progress?: {
      external: { approved: number; replied: number; optional: number; total: number };
      internal: { approved: number; replied: number; optional: number; total: number };
    };
    variablesResult?: Array<{ name: string; value: number | null }>;
    signatures?: Array<{
      id: string;
      status: PetitionSignatureRequestStatus;
      environment: SignatureOrgIntegrationEnvironment;
      createdAt: string;
      updatedAt: string;
      signatureConfig: {
        signers: Array<{ email: string; firstName: string; lastName: string | null } | null>;
      };
    }>;
    owner?: {
      id: string;
      email: string;
      fullName: string | null;
      firstName: string | null;
      lastName: string | null;
    };
  };
};

export type ReopenPetition_reopenPetitionMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  includeRecipients: Scalars["Boolean"]["input"];
  includeFields: Scalars["Boolean"]["input"];
  includeTags: Scalars["Boolean"]["input"];
  includeRecipientUrl: Scalars["Boolean"]["input"];
  includeReplies: Scalars["Boolean"]["input"];
  includeProgress: Scalars["Boolean"]["input"];
  includeSigners: Scalars["Boolean"]["input"];
  includeVariablesResult: Scalars["Boolean"]["input"];
  includeSignatureRequests: Scalars["Boolean"]["input"];
  includeOwner: Scalars["Boolean"]["input"];
}>;

export type ReopenPetition_reopenPetitionMutation = {
  reopenPetition: {
    id: string;
    path: string;
    name: string | null;
    status: PetitionStatus;
    deadline: string | null;
    locale: PetitionLocale;
    createdAt: string;
    customProperties: { [key: string]: any };
    isAnonymized: boolean;
    fromTemplate: { id: string } | null;
    recipients?: Array<{
      recipientUrl: string | null;
      id: string;
      status: PetitionAccessStatus;
      reminderCount: number;
      remindersLeft: number;
      remindersActive: boolean;
      nextReminderAt: string | null;
      createdAt: string;
      contact: {
        id: string;
        email: string;
        fullName: string;
        firstName: string;
        lastName: string | null;
        createdAt: string;
        updatedAt: string;
      } | null;
      granter: {
        id: string;
        email: string;
        fullName: string | null;
        firstName: string | null;
        lastName: string | null;
      } | null;
    }>;
    fields?: Array<{
      id: string;
      title: string | null;
      description: string | null;
      type: PetitionFieldType;
      fromPetitionFieldId: string | null;
      alias: string | null;
      options: { [key: string]: any };
      optional: boolean;
      multiple: boolean;
      replies: Array<{
        id: string;
        content: { [key: string]: any };
        status: PetitionFieldReplyStatus;
        metadata: { [key: string]: any };
        createdAt: string;
        updatedAt: string;
        children: Array<{
          field: { id: string; type: PetitionFieldType };
          replies: Array<{
            id: string;
            content: { [key: string]: any };
            status: PetitionFieldReplyStatus;
            metadata: { [key: string]: any };
            createdAt: string;
            updatedAt: string;
          }>;
        }> | null;
      }>;
      children: Array<{
        id: string;
        title: string | null;
        description: string | null;
        type: PetitionFieldType;
        fromPetitionFieldId: string | null;
        alias: string | null;
        options: { [key: string]: any };
        optional: boolean;
        multiple: boolean;
      }> | null;
    }>;
    replies?: Array<{
      id: string;
      alias: string | null;
      type: PetitionFieldType;
      replies: Array<{
        id: string;
        content: { [key: string]: any };
        metadata: { [key: string]: any };
        children: Array<{
          field: { id: string; alias: string | null; type: PetitionFieldType };
          replies: Array<{
            id: string;
            content: { [key: string]: any };
            metadata: { [key: string]: any };
          }>;
        }> | null;
      }>;
    }>;
    tags?: Array<{ id: string; name: string }>;
    signatureConfig?: {
      isEnabled: boolean;
      signers: Array<{ email: string; firstName: string; lastName: string | null } | null>;
    } | null;
    progress?: {
      external: { approved: number; replied: number; optional: number; total: number };
      internal: { approved: number; replied: number; optional: number; total: number };
    };
    variablesResult?: Array<{ name: string; value: number | null }>;
    signatures?: Array<{
      id: string;
      status: PetitionSignatureRequestStatus;
      environment: SignatureOrgIntegrationEnvironment;
      createdAt: string;
      updatedAt: string;
      signatureConfig: {
        signers: Array<{ email: string; firstName: string; lastName: string | null } | null>;
      };
    }>;
    owner?: {
      id: string;
      email: string;
      fullName: string | null;
      firstName: string | null;
      lastName: string | null;
    };
  };
};

export type TagPetition_tagsByNameQueryVariables = Exact<{
  search: Scalars["String"]["input"];
}>;

export type TagPetition_tagsByNameQuery = {
  tagsByName: { items: Array<{ id: string; name: string }> };
};

export type TagPetition_createTagMutationVariables = Exact<{
  name: Scalars["String"]["input"];
  color: Scalars["String"]["input"];
}>;

export type TagPetition_createTagMutation = { createTag: { id: string; name: string } };

export type TagPetition_tagPetitionMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  tagId: Scalars["GID"]["input"];
  includeRecipients: Scalars["Boolean"]["input"];
  includeFields: Scalars["Boolean"]["input"];
  includeTags: Scalars["Boolean"]["input"];
  includeRecipientUrl: Scalars["Boolean"]["input"];
  includeReplies: Scalars["Boolean"]["input"];
  includeProgress: Scalars["Boolean"]["input"];
  includeSigners: Scalars["Boolean"]["input"];
  includeVariablesResult: Scalars["Boolean"]["input"];
  includeSignatureRequests: Scalars["Boolean"]["input"];
  includeOwner: Scalars["Boolean"]["input"];
}>;

export type TagPetition_tagPetitionMutation = {
  tagPetition:
    | {
        id: string;
        path: string;
        name: string | null;
        status: PetitionStatus;
        deadline: string | null;
        locale: PetitionLocale;
        createdAt: string;
        customProperties: { [key: string]: any };
        isAnonymized: boolean;
        fromTemplate: { id: string } | null;
        recipients?: Array<{
          recipientUrl: string | null;
          id: string;
          status: PetitionAccessStatus;
          reminderCount: number;
          remindersLeft: number;
          remindersActive: boolean;
          nextReminderAt: string | null;
          createdAt: string;
          contact: {
            id: string;
            email: string;
            fullName: string;
            firstName: string;
            lastName: string | null;
            createdAt: string;
            updatedAt: string;
          } | null;
          granter: {
            id: string;
            email: string;
            fullName: string | null;
            firstName: string | null;
            lastName: string | null;
          } | null;
        }>;
        fields?: Array<{
          id: string;
          title: string | null;
          description: string | null;
          type: PetitionFieldType;
          fromPetitionFieldId: string | null;
          alias: string | null;
          options: { [key: string]: any };
          optional: boolean;
          multiple: boolean;
          replies: Array<{
            id: string;
            content: { [key: string]: any };
            status: PetitionFieldReplyStatus;
            metadata: { [key: string]: any };
            createdAt: string;
            updatedAt: string;
            children: Array<{
              field: { id: string; type: PetitionFieldType };
              replies: Array<{
                id: string;
                content: { [key: string]: any };
                status: PetitionFieldReplyStatus;
                metadata: { [key: string]: any };
                createdAt: string;
                updatedAt: string;
              }>;
            }> | null;
          }>;
          children: Array<{
            id: string;
            title: string | null;
            description: string | null;
            type: PetitionFieldType;
            fromPetitionFieldId: string | null;
            alias: string | null;
            options: { [key: string]: any };
            optional: boolean;
            multiple: boolean;
          }> | null;
        }>;
        replies?: Array<{
          id: string;
          alias: string | null;
          type: PetitionFieldType;
          replies: Array<{
            id: string;
            content: { [key: string]: any };
            metadata: { [key: string]: any };
            children: Array<{
              field: { id: string; alias: string | null; type: PetitionFieldType };
              replies: Array<{
                id: string;
                content: { [key: string]: any };
                metadata: { [key: string]: any };
              }>;
            }> | null;
          }>;
        }>;
        tags?: Array<{ id: string; name: string }>;
        signatureConfig?: {
          isEnabled: boolean;
          signers: Array<{ email: string; firstName: string; lastName: string | null } | null>;
        } | null;
        progress?: {
          external: { approved: number; replied: number; optional: number; total: number };
          internal: { approved: number; replied: number; optional: number; total: number };
        };
        variablesResult?: Array<{ name: string; value: number | null }>;
        signatures?: Array<{
          id: string;
          status: PetitionSignatureRequestStatus;
          environment: SignatureOrgIntegrationEnvironment;
          createdAt: string;
          updatedAt: string;
          signatureConfig: {
            signers: Array<{ email: string; firstName: string; lastName: string | null } | null>;
          };
        }>;
        owner?: {
          id: string;
          email: string;
          fullName: string | null;
          firstName: string | null;
          lastName: string | null;
        };
      }
    | {};
};

export type UntagPetition_tagsByNameQueryVariables = Exact<{
  search: Scalars["String"]["input"];
}>;

export type UntagPetition_tagsByNameQuery = {
  tagsByName: { items: Array<{ id: string; name: string }> };
};

export type UntagPetition_untagPetitionMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  tagId: Scalars["GID"]["input"];
}>;

export type UntagPetition_untagPetitionMutation = {
  untagPetition: { id: string } | { id: string };
};

export type ReadPetitionCustomPropertiesQueryVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
}>;

export type ReadPetitionCustomPropertiesQuery = {
  petition:
    | { id: string; customProperties: { [key: string]: any } }
    | { id: string; customProperties: { [key: string]: any } }
    | null;
};

export type CreateOrUpdatePetitionCustomProperty_modifyPetitionCustomPropertyMutationVariables =
  Exact<{
    petitionId: Scalars["GID"]["input"];
    key: Scalars["String"]["input"];
    value?: InputMaybe<Scalars["String"]["input"]>;
  }>;

export type CreateOrUpdatePetitionCustomProperty_modifyPetitionCustomPropertyMutation = {
  modifyPetitionCustomProperty:
    | { customProperties: { [key: string]: any } }
    | { customProperties: { [key: string]: any } };
};

export type DeletePetitionCustomProperty_modifyPetitionCustomPropertyMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  key: Scalars["String"]["input"];
}>;

export type DeletePetitionCustomProperty_modifyPetitionCustomPropertyMutation = {
  modifyPetitionCustomProperty: { id: string } | { id: string };
};

export type CreatePetitionRecipients_petitionQueryVariables = Exact<{
  id: Scalars["GID"]["input"];
}>;

export type CreatePetitionRecipients_petitionQuery = {
  petition:
    | { emailBody: any | null; emailSubject: string | null }
    | { emailBody: any | null; emailSubject: string | null }
    | null;
};

export type CreatePetitionRecipients_sendPetitionMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  contactIds: Array<Scalars["GID"]["input"]> | Scalars["GID"]["input"];
  subject: Scalars["String"]["input"];
  body: Scalars["JSON"]["input"];
  scheduledAt?: InputMaybe<Scalars["DateTime"]["input"]>;
  remindersConfig?: InputMaybe<RemindersConfigInput>;
  skipEmailSend?: InputMaybe<Scalars["Boolean"]["input"]>;
  includeRecipients: Scalars["Boolean"]["input"];
  includeFields: Scalars["Boolean"]["input"];
  includeTags: Scalars["Boolean"]["input"];
  includeRecipientUrl: Scalars["Boolean"]["input"];
  includeReplies: Scalars["Boolean"]["input"];
  includeProgress: Scalars["Boolean"]["input"];
  includeSigners: Scalars["Boolean"]["input"];
  includeVariablesResult: Scalars["Boolean"]["input"];
  includeSignatureRequests: Scalars["Boolean"]["input"];
  includeOwner: Scalars["Boolean"]["input"];
  senderId?: InputMaybe<Scalars["GID"]["input"]>;
}>;

export type CreatePetitionRecipients_sendPetitionMutation = {
  sendPetition: Array<{
    result: Result;
    petition: {
      id: string;
      path: string;
      name: string | null;
      status: PetitionStatus;
      deadline: string | null;
      locale: PetitionLocale;
      createdAt: string;
      customProperties: { [key: string]: any };
      isAnonymized: boolean;
      fromTemplate: { id: string } | null;
      recipients?: Array<{
        recipientUrl: string | null;
        id: string;
        status: PetitionAccessStatus;
        reminderCount: number;
        remindersLeft: number;
        remindersActive: boolean;
        nextReminderAt: string | null;
        createdAt: string;
        contact: {
          id: string;
          email: string;
          fullName: string;
          firstName: string;
          lastName: string | null;
          createdAt: string;
          updatedAt: string;
        } | null;
        granter: {
          id: string;
          email: string;
          fullName: string | null;
          firstName: string | null;
          lastName: string | null;
        } | null;
      }>;
      fields?: Array<{
        id: string;
        title: string | null;
        description: string | null;
        type: PetitionFieldType;
        fromPetitionFieldId: string | null;
        alias: string | null;
        options: { [key: string]: any };
        optional: boolean;
        multiple: boolean;
        replies: Array<{
          id: string;
          content: { [key: string]: any };
          status: PetitionFieldReplyStatus;
          metadata: { [key: string]: any };
          createdAt: string;
          updatedAt: string;
          children: Array<{
            field: { id: string; type: PetitionFieldType };
            replies: Array<{
              id: string;
              content: { [key: string]: any };
              status: PetitionFieldReplyStatus;
              metadata: { [key: string]: any };
              createdAt: string;
              updatedAt: string;
            }>;
          }> | null;
        }>;
        children: Array<{
          id: string;
          title: string | null;
          description: string | null;
          type: PetitionFieldType;
          fromPetitionFieldId: string | null;
          alias: string | null;
          options: { [key: string]: any };
          optional: boolean;
          multiple: boolean;
        }> | null;
      }>;
      replies?: Array<{
        id: string;
        alias: string | null;
        type: PetitionFieldType;
        replies: Array<{
          id: string;
          content: { [key: string]: any };
          metadata: { [key: string]: any };
          children: Array<{
            field: { id: string; alias: string | null; type: PetitionFieldType };
            replies: Array<{
              id: string;
              content: { [key: string]: any };
              metadata: { [key: string]: any };
            }>;
          }> | null;
        }>;
      }>;
      tags?: Array<{ id: string; name: string }>;
      signatureConfig?: {
        isEnabled: boolean;
        signers: Array<{ email: string; firstName: string; lastName: string | null } | null>;
      } | null;
      progress?: {
        external: { approved: number; replied: number; optional: number; total: number };
        internal: { approved: number; replied: number; optional: number; total: number };
      };
      variablesResult?: Array<{ name: string; value: number | null }>;
      signatures?: Array<{
        id: string;
        status: PetitionSignatureRequestStatus;
        environment: SignatureOrgIntegrationEnvironment;
        createdAt: string;
        updatedAt: string;
        signatureConfig: {
          signers: Array<{ email: string; firstName: string; lastName: string | null } | null>;
        };
      }>;
      owner?: {
        id: string;
        email: string;
        fullName: string | null;
        firstName: string | null;
        lastName: string | null;
      };
    } | null;
  }>;
};

export type CreatePetitionRecipients_userByEmailQueryVariables = Exact<{
  email: Scalars["String"]["input"];
}>;

export type CreatePetitionRecipients_userByEmailQuery = {
  me: { organization: { users: { items: Array<{ id: string; email: string }> } } };
};

export type GetPetitionRecipients_petitionAccessesQueryVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
}>;

export type GetPetitionRecipients_petitionAccessesQuery = {
  petition:
    | {
        accesses: Array<{
          id: string;
          status: PetitionAccessStatus;
          reminderCount: number;
          remindersLeft: number;
          remindersActive: boolean;
          nextReminderAt: string | null;
          createdAt: string;
          contact: {
            id: string;
            email: string;
            fullName: string;
            firstName: string;
            lastName: string | null;
            createdAt: string;
            updatedAt: string;
          } | null;
          granter: {
            id: string;
            email: string;
            fullName: string | null;
            firstName: string | null;
            lastName: string | null;
          } | null;
        }>;
      }
    | {}
    | null;
};

export type ActivatePetitionRecipient_reactivateAccessesMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  accessId: Scalars["GID"]["input"];
}>;

export type ActivatePetitionRecipient_reactivateAccessesMutation = {
  reactivateAccesses: Array<{
    id: string;
    status: PetitionAccessStatus;
    reminderCount: number;
    remindersLeft: number;
    remindersActive: boolean;
    nextReminderAt: string | null;
    createdAt: string;
    contact: {
      id: string;
      email: string;
      fullName: string;
      firstName: string;
      lastName: string | null;
      createdAt: string;
      updatedAt: string;
    } | null;
    granter: {
      id: string;
      email: string;
      fullName: string | null;
      firstName: string | null;
      lastName: string | null;
    } | null;
  }>;
};

export type DeactivatePetitionRecipient_deactivateAccessesMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  accessId: Scalars["GID"]["input"];
}>;

export type DeactivatePetitionRecipient_deactivateAccessesMutation = {
  deactivateAccesses: Array<{
    id: string;
    status: PetitionAccessStatus;
    reminderCount: number;
    remindersLeft: number;
    remindersActive: boolean;
    nextReminderAt: string | null;
    createdAt: string;
    contact: {
      id: string;
      email: string;
      fullName: string;
      firstName: string;
      lastName: string | null;
      createdAt: string;
      updatedAt: string;
    } | null;
    granter: {
      id: string;
      email: string;
      fullName: string | null;
      firstName: string | null;
      lastName: string | null;
    } | null;
  }>;
};

export type RemindPetitionRecipient_sendRemindersMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  accessId: Scalars["GID"]["input"];
  body?: InputMaybe<Scalars["JSON"]["input"]>;
}>;

export type RemindPetitionRecipient_sendRemindersMutation = {
  sendReminders: Array<{
    id: string;
    access: {
      id: string;
      status: PetitionAccessStatus;
      reminderCount: number;
      remindersLeft: number;
      remindersActive: boolean;
      nextReminderAt: string | null;
      createdAt: string;
      contact: {
        id: string;
        email: string;
        fullName: string;
        firstName: string;
        lastName: string | null;
        createdAt: string;
        updatedAt: string;
      } | null;
      granter: {
        id: string;
        email: string;
        fullName: string | null;
        firstName: string | null;
        lastName: string | null;
      } | null;
    };
  }>;
};

export type PetitionReplies_repliesQueryVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
}>;

export type PetitionReplies_repliesQuery = {
  petition:
    | {
        fields: Array<{
          id: string;
          title: string | null;
          description: string | null;
          type: PetitionFieldType;
          fromPetitionFieldId: string | null;
          alias: string | null;
          options: { [key: string]: any };
          optional: boolean;
          multiple: boolean;
          replies: Array<{
            id: string;
            content: { [key: string]: any };
            status: PetitionFieldReplyStatus;
            metadata: { [key: string]: any };
            createdAt: string;
            updatedAt: string;
            children: Array<{
              field: { id: string; type: PetitionFieldType };
              replies: Array<{
                id: string;
                content: { [key: string]: any };
                status: PetitionFieldReplyStatus;
                metadata: { [key: string]: any };
                createdAt: string;
                updatedAt: string;
              }>;
            }> | null;
          }>;
          children: Array<{
            id: string;
            title: string | null;
            description: string | null;
            type: PetitionFieldType;
            fromPetitionFieldId: string | null;
            alias: string | null;
            options: { [key: string]: any };
            optional: boolean;
            multiple: boolean;
          }> | null;
        }>;
      }
    | {
        fields: Array<{
          id: string;
          title: string | null;
          description: string | null;
          type: PetitionFieldType;
          fromPetitionFieldId: string | null;
          alias: string | null;
          options: { [key: string]: any };
          optional: boolean;
          multiple: boolean;
          replies: Array<{
            id: string;
            content: { [key: string]: any };
            status: PetitionFieldReplyStatus;
            metadata: { [key: string]: any };
            createdAt: string;
            updatedAt: string;
            children: Array<{
              field: { id: string; type: PetitionFieldType };
              replies: Array<{
                id: string;
                content: { [key: string]: any };
                status: PetitionFieldReplyStatus;
                metadata: { [key: string]: any };
                createdAt: string;
                updatedAt: string;
              }>;
            }> | null;
          }>;
          children: Array<{
            id: string;
            title: string | null;
            description: string | null;
            type: PetitionFieldType;
            fromPetitionFieldId: string | null;
            alias: string | null;
            options: { [key: string]: any };
            optional: boolean;
            multiple: boolean;
          }> | null;
        }>;
      }
    | null;
};

export type UpdatePetitionField_updatePetitionFieldMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  fieldId: Scalars["GID"]["input"];
  title?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  options?: InputMaybe<Scalars["JSONObject"]["input"]>;
}>;

export type UpdatePetitionField_updatePetitionFieldMutation = {
  updatePetitionField: {
    id: string;
    title: string | null;
    description: string | null;
    type: PetitionFieldType;
    fromPetitionFieldId: string | null;
    alias: string | null;
    options: { [key: string]: any };
    optional: boolean;
    multiple: boolean;
    children: Array<{
      id: string;
      title: string | null;
      description: string | null;
      type: PetitionFieldType;
      fromPetitionFieldId: string | null;
      alias: string | null;
      options: { [key: string]: any };
      optional: boolean;
      multiple: boolean;
    }> | null;
  };
};

export type GetPetitionFieldComments_petitionQueryVariables = Exact<{
  id: Scalars["GID"]["input"];
}>;

export type GetPetitionFieldComments_petitionQuery = {
  petition:
    | { fields: Array<{ id: string; fromPetitionFieldId: string | null }> }
    | { fields: Array<{ id: string; fromPetitionFieldId: string | null }> }
    | null;
};

export type GetPetitionFieldComments_petitionFieldCommentsQueryVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  fieldId: Scalars["GID"]["input"];
}>;

export type GetPetitionFieldComments_petitionFieldCommentsQuery = {
  petitionField: {
    comments: Array<{
      id: string;
      content: any | null;
      isInternal: boolean;
      createdAt: string;
      isAnonymized: boolean;
      author:
        | {
            __typename: "PetitionAccess";
            contact: { id: string; email: string; fullName: string } | null;
          }
        | { __typename: "User"; id: string; email: string; fullName: string | null }
        | null;
      mentions: Array<
        | {
            __typename: "PetitionFieldCommentUserGroupMention";
            userGroup: {
              id: string;
              name: string;
              localizableName: { [locale in UserLocale]?: string };
            } | null;
          }
        | {
            __typename: "PetitionFieldCommentUserMention";
            user: { id: string; email: string; fullName: string | null } | null;
          }
      >;
    }>;
  };
};

export type SendPetitionFieldComment_petitionQueryVariables = Exact<{
  id: Scalars["GID"]["input"];
}>;

export type SendPetitionFieldComment_petitionQuery = {
  petition:
    | { fields: Array<{ id: string; fromPetitionFieldId: string | null }> }
    | { fields: Array<{ id: string; fromPetitionFieldId: string | null }> }
    | null;
};

export type SendPetitionFieldComment_createPetitionCommentMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  petitionFieldId?: InputMaybe<Scalars["GID"]["input"]>;
  content: Scalars["JSON"]["input"];
  isInternal: Scalars["Boolean"]["input"];
  sharePetition?: InputMaybe<Scalars["Boolean"]["input"]>;
  sharePetitionPermission?: InputMaybe<PetitionPermissionTypeRW>;
  sharePetitionSubscribed?: InputMaybe<Scalars["Boolean"]["input"]>;
}>;

export type SendPetitionFieldComment_createPetitionCommentMutation = {
  createPetitionComment: {
    id: string;
    content: any | null;
    isInternal: boolean;
    createdAt: string;
    isAnonymized: boolean;
    author:
      | {
          __typename: "PetitionAccess";
          contact: { id: string; email: string; fullName: string } | null;
        }
      | { __typename: "User"; id: string; email: string; fullName: string | null }
      | null;
    mentions: Array<
      | {
          __typename: "PetitionFieldCommentUserGroupMention";
          userGroup: {
            id: string;
            name: string;
            localizableName: { [locale in UserLocale]?: string };
          } | null;
        }
      | {
          __typename: "PetitionFieldCommentUserMention";
          user: { id: string; email: string; fullName: string | null } | null;
        }
    >;
  };
};

export type GetPetitionComments_petitionCommentsQueryVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
}>;

export type GetPetitionComments_petitionCommentsQuery = {
  petition:
    | {
        __typename: "Petition";
        generalComments: Array<{
          id: string;
          content: any | null;
          isInternal: boolean;
          createdAt: string;
          isAnonymized: boolean;
          author:
            | {
                __typename: "PetitionAccess";
                contact: { id: string; email: string; fullName: string } | null;
              }
            | { __typename: "User"; id: string; email: string; fullName: string | null }
            | null;
          mentions: Array<
            | {
                __typename: "PetitionFieldCommentUserGroupMention";
                userGroup: {
                  id: string;
                  name: string;
                  localizableName: { [locale in UserLocale]?: string };
                } | null;
              }
            | {
                __typename: "PetitionFieldCommentUserMention";
                user: { id: string; email: string; fullName: string | null } | null;
              }
          >;
        }>;
      }
    | { __typename: "PetitionTemplate" }
    | null;
};

export type SendPetitionComment_createPetitionCommentMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  content: Scalars["JSON"]["input"];
  isInternal: Scalars["Boolean"]["input"];
  sharePetition?: InputMaybe<Scalars["Boolean"]["input"]>;
  sharePetitionPermission?: InputMaybe<PetitionPermissionTypeRW>;
  sharePetitionSubscribed?: InputMaybe<Scalars["Boolean"]["input"]>;
}>;

export type SendPetitionComment_createPetitionCommentMutation = {
  createPetitionComment: {
    id: string;
    content: any | null;
    isInternal: boolean;
    createdAt: string;
    isAnonymized: boolean;
    author:
      | {
          __typename: "PetitionAccess";
          contact: { id: string; email: string; fullName: string } | null;
        }
      | { __typename: "User"; id: string; email: string; fullName: string | null }
      | null;
    mentions: Array<
      | {
          __typename: "PetitionFieldCommentUserGroupMention";
          userGroup: {
            id: string;
            name: string;
            localizableName: { [locale in UserLocale]?: string };
          } | null;
        }
      | {
          __typename: "PetitionFieldCommentUserMention";
          user: { id: string; email: string; fullName: string | null } | null;
        }
    >;
  };
};

export type DeleteReply_deletePetitionReplyMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  replyId: Scalars["GID"]["input"];
}>;

export type DeleteReply_deletePetitionReplyMutation = { deletePetitionReply: { id: string } };

export type DownloadFileReply_fileUploadReplyDownloadLinkMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  replyId: Scalars["GID"]["input"];
}>;

export type DownloadFileReply_fileUploadReplyDownloadLinkMutation = {
  fileUploadReplyDownloadLink: { url: string | null };
};

export type ExportPetitionReplies_createExportRepliesTaskMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  pattern?: InputMaybe<Scalars["String"]["input"]>;
  callbackUrl?: InputMaybe<Scalars["String"]["input"]>;
}>;

export type ExportPetitionReplies_createExportRepliesTaskMutation = {
  createExportRepliesTask: {
    id: string;
    progress: number | null;
    status: TaskStatus;
    output: any | null;
  };
};

export type ExportPetitionReplies_createPrintPdfTaskMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  callbackUrl?: InputMaybe<Scalars["String"]["input"]>;
}>;

export type ExportPetitionReplies_createPrintPdfTaskMutation = {
  createPrintPdfTask: {
    id: string;
    progress: number | null;
    status: TaskStatus;
    output: any | null;
  };
};

export type ExportPetitionReplies_createExportExcelTaskMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  callbackUrl?: InputMaybe<Scalars["String"]["input"]>;
}>;

export type ExportPetitionReplies_createExportExcelTaskMutation = {
  createExportExcelTask: {
    id: string;
    progress: number | null;
    status: TaskStatus;
    output: any | null;
  };
};

export type GetPermissions_permissionsQueryVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
}>;

export type GetPermissions_permissionsQuery = {
  petition:
    | {
        permissions: Array<
          | {
              permissionType: PetitionPermissionType;
              createdAt: string;
              group: { id: string; name: string };
            }
          | {
              permissionType: PetitionPermissionType;
              createdAt: string;
              user: {
                id: string;
                email: string;
                fullName: string | null;
                firstName: string | null;
                lastName: string | null;
              };
            }
        >;
      }
    | {
        permissions: Array<
          | {
              permissionType: PetitionPermissionType;
              createdAt: string;
              group: { id: string; name: string };
            }
          | {
              permissionType: PetitionPermissionType;
              createdAt: string;
              user: {
                id: string;
                email: string;
                fullName: string | null;
                firstName: string | null;
                lastName: string | null;
              };
            }
        >;
      }
    | null;
};

export type SharePetition_usersByEmailQueryVariables = Exact<{
  emails: Array<Scalars["String"]["input"]> | Scalars["String"]["input"];
}>;

export type SharePetition_usersByEmailQuery = {
  me: { organization: { usersByEmail: { items: Array<{ id: string; email: string }> } } };
};

export type SharePetition_createAddPetitionPermissionMaybeTaskMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  userIds?: InputMaybe<Array<Scalars["GID"]["input"]> | Scalars["GID"]["input"]>;
  userGroupIds?: InputMaybe<Array<Scalars["GID"]["input"]> | Scalars["GID"]["input"]>;
}>;

export type SharePetition_createAddPetitionPermissionMaybeTaskMutation = {
  createAddPetitionPermissionMaybeTask: {
    status: MaybeTaskStatus;
    task: { id: string; progress: number | null; status: TaskStatus; output: any | null } | null;
  };
};

export type SharePetition_petitionQueryVariables = Exact<{
  id: Scalars["GID"]["input"];
}>;

export type SharePetition_petitionQuery = {
  petition:
    | {
        permissions: Array<
          | {
              permissionType: PetitionPermissionType;
              createdAt: string;
              group: { id: string; name: string };
            }
          | {
              permissionType: PetitionPermissionType;
              createdAt: string;
              user: {
                id: string;
                email: string;
                fullName: string | null;
                firstName: string | null;
                lastName: string | null;
              };
            }
        >;
      }
    | {
        permissions: Array<
          | {
              permissionType: PetitionPermissionType;
              createdAt: string;
              group: { id: string; name: string };
            }
          | {
              permissionType: PetitionPermissionType;
              createdAt: string;
              user: {
                id: string;
                email: string;
                fullName: string | null;
                firstName: string | null;
                lastName: string | null;
              };
            }
        >;
      }
    | null;
};

export type StopSharing_createRemovePetitionPermissionMaybeTaskMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
}>;

export type StopSharing_createRemovePetitionPermissionMaybeTaskMutation = {
  createRemovePetitionPermissionMaybeTask: {
    status: MaybeTaskStatus;
    task: { id: string; progress: number | null; status: TaskStatus; output: any | null } | null;
  };
};

export type RemoveUserPermission_createRemovePetitionPermissionMaybeTaskMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  userId: Scalars["GID"]["input"];
}>;

export type RemoveUserPermission_createRemovePetitionPermissionMaybeTaskMutation = {
  createRemovePetitionPermissionMaybeTask: {
    status: MaybeTaskStatus;
    task: { id: string; progress: number | null; status: TaskStatus; output: any | null } | null;
  };
};

export type RemoveUserGroupPermission_createRemovePetitionPermissionMaybeTaskMutationVariables =
  Exact<{
    petitionId: Scalars["GID"]["input"];
    userGroupId: Scalars["GID"]["input"];
  }>;

export type RemoveUserGroupPermission_createRemovePetitionPermissionMaybeTaskMutation = {
  createRemovePetitionPermissionMaybeTask: {
    status: MaybeTaskStatus;
    task: { id: string; progress: number | null; status: TaskStatus; output: any | null } | null;
  };
};

export type TransferPetition_searchUserByEmailQueryVariables = Exact<{
  search?: InputMaybe<Scalars["String"]["input"]>;
}>;

export type TransferPetition_searchUserByEmailQuery = {
  me: { organization: { users: { items: Array<{ id: string; email: string }> } } };
};

export type TransferPetition_transferPetitionOwnershipMutationVariables = Exact<{
  userId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
}>;

export type TransferPetition_transferPetitionOwnershipMutation = {
  transferPetitionOwnership: Array<
    | {
        permissions: Array<
          | {
              permissionType: PetitionPermissionType;
              createdAt: string;
              group: { id: string; name: string };
            }
          | {
              permissionType: PetitionPermissionType;
              createdAt: string;
              user: {
                id: string;
                email: string;
                fullName: string | null;
                firstName: string | null;
                lastName: string | null;
              };
            }
        >;
      }
    | {
        permissions: Array<
          | {
              permissionType: PetitionPermissionType;
              createdAt: string;
              group: { id: string; name: string };
            }
          | {
              permissionType: PetitionPermissionType;
              createdAt: string;
              user: {
                id: string;
                email: string;
                fullName: string | null;
                firstName: string | null;
                lastName: string | null;
              };
            }
        >;
      }
  >;
};

export type GetSignatures_petitionSignaturesQueryVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
}>;

export type GetSignatures_petitionSignaturesQuery = {
  petition:
    | {
        __typename: "Petition";
        signatureRequests: Array<{
          id: string;
          status: PetitionSignatureRequestStatus;
          environment: SignatureOrgIntegrationEnvironment;
          createdAt: string;
          updatedAt: string;
          signatureConfig: {
            signers: Array<{ email: string; firstName: string; lastName: string | null } | null>;
          };
        }>;
      }
    | { __typename: "PetitionTemplate" }
    | null;
};

export type StartSignature_createCustomSignatureDocumentUploadLinkMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  file: FileUploadInput;
}>;

export type StartSignature_createCustomSignatureDocumentUploadLinkMutation = {
  createCustomSignatureDocumentUploadLink: { [key: string]: any };
};

export type StartSignature_startSignatureRequestMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  message?: InputMaybe<Scalars["String"]["input"]>;
  customDocumentTemporaryFileId?: InputMaybe<Scalars["GID"]["input"]>;
}>;

export type StartSignature_startSignatureRequestMutation = {
  startSignatureRequest: {
    id: string;
    status: PetitionSignatureRequestStatus;
    environment: SignatureOrgIntegrationEnvironment;
    createdAt: string;
    updatedAt: string;
    signatureConfig: {
      signers: Array<{ email: string; firstName: string; lastName: string | null } | null>;
    };
  };
};

export type DownloadSignedDocument_downloadSignedDocMutationVariables = Exact<{
  signatureId: Scalars["GID"]["input"];
}>;

export type DownloadSignedDocument_downloadSignedDocMutation = {
  signedPetitionDownloadLink: { result: Result; url: string | null };
};

export type DownloadSignedDocument_downloadAuditTrailMutationVariables = Exact<{
  signatureId: Scalars["GID"]["input"];
}>;

export type DownloadSignedDocument_downloadAuditTrailMutation = {
  signedPetitionDownloadLink: { result: Result; url: string | null };
};

export type GetPetitionProfiles_petitionQueryVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  includeFieldOptions: Scalars["Boolean"]["input"];
  includeRelationships: Scalars["Boolean"]["input"];
  includeSubscribers: Scalars["Boolean"]["input"];
}>;

export type GetPetitionProfiles_petitionQuery = {
  petition:
    | {
        __typename: "Petition";
        profiles: Array<{
          id: string;
          name: string;
          status: ProfileStatus;
          createdAt: string;
          properties: Array<{
            field: {
              id: string;
              name: { [locale in UserLocale]?: string };
              alias: string | null;
              type: ProfileTypeFieldType;
              isExpirable: boolean;
              options?: { [key: string]: any };
            };
            value: {
              id: string;
              content: { [key: string]: any } | null;
              expiresAt: string | null;
              createdAt: string;
            } | null;
            files: Array<{
              id: string;
              expiresAt: string | null;
              createdAt: string;
              file: { filename: string; size: number; contentType: string } | null;
            }> | null;
          }>;
          relationships?: Array<{
            id: string;
            leftSideProfile: {
              id: string;
              name: string;
              status: ProfileStatus;
              createdAt: string;
              profileType: { id: string; name: { [locale in UserLocale]?: string } };
            };
            rightSideProfile: {
              id: string;
              name: string;
              status: ProfileStatus;
              createdAt: string;
              profileType: { id: string; name: { [locale in UserLocale]?: string } };
            };
            relationshipType: {
              alias: string | null;
              id: string;
              leftRightName: { [locale in UserLocale]?: string };
              rightLeftName: { [locale in UserLocale]?: string };
            };
          }>;
          subscribers?: Array<{
            user: {
              id: string;
              email: string;
              fullName: string | null;
              firstName: string | null;
              lastName: string | null;
            };
          }>;
          profileType: { id: string; name: { [locale in UserLocale]?: string } };
        }>;
      }
    | { __typename: "PetitionTemplate" }
    | null;
};

export type AssociatePetitionToProfile_associateProfileToPetitionMutationVariables = Exact<{
  profileId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
  includeFieldOptions: Scalars["Boolean"]["input"];
  includeRelationships: Scalars["Boolean"]["input"];
  includeSubscribers: Scalars["Boolean"]["input"];
}>;

export type AssociatePetitionToProfile_associateProfileToPetitionMutation = {
  associateProfileToPetition: {
    profile: {
      id: string;
      name: string;
      status: ProfileStatus;
      createdAt: string;
      properties: Array<{
        field: {
          id: string;
          name: { [locale in UserLocale]?: string };
          alias: string | null;
          type: ProfileTypeFieldType;
          isExpirable: boolean;
          options?: { [key: string]: any };
        };
        value: {
          id: string;
          content: { [key: string]: any } | null;
          expiresAt: string | null;
          createdAt: string;
        } | null;
        files: Array<{
          id: string;
          expiresAt: string | null;
          createdAt: string;
          file: { filename: string; size: number; contentType: string } | null;
        }> | null;
      }>;
      relationships?: Array<{
        id: string;
        leftSideProfile: {
          id: string;
          name: string;
          status: ProfileStatus;
          createdAt: string;
          profileType: { id: string; name: { [locale in UserLocale]?: string } };
        };
        rightSideProfile: {
          id: string;
          name: string;
          status: ProfileStatus;
          createdAt: string;
          profileType: { id: string; name: { [locale in UserLocale]?: string } };
        };
        relationshipType: {
          alias: string | null;
          id: string;
          leftRightName: { [locale in UserLocale]?: string };
          rightLeftName: { [locale in UserLocale]?: string };
        };
      }>;
      subscribers?: Array<{
        user: {
          id: string;
          email: string;
          fullName: string | null;
          firstName: string | null;
          lastName: string | null;
        };
      }>;
      profileType: { id: string; name: { [locale in UserLocale]?: string } };
    };
  };
};

export type DisassociateProfileFromPetition_disassociateProfilesFromPetitionsMutationVariables =
  Exact<{
    petitionIds: Array<Scalars["GID"]["input"]> | Scalars["GID"]["input"];
    profileIds: Array<Scalars["GID"]["input"]> | Scalars["GID"]["input"];
  }>;

export type DisassociateProfileFromPetition_disassociateProfilesFromPetitionsMutation = {
  disassociateProfilesFromPetitions: Success;
};

export type GetTemplates_templatesQueryVariables = Exact<{
  offset: Scalars["Int"]["input"];
  limit: Scalars["Int"]["input"];
  tags?: InputMaybe<PetitionTagFilter>;
  sortBy?: InputMaybe<Array<QueryPetitions_OrderBy> | QueryPetitions_OrderBy>;
  includeFields: Scalars["Boolean"]["input"];
  includeTags: Scalars["Boolean"]["input"];
}>;

export type GetTemplates_templatesQuery = {
  templates: {
    totalCount: number;
    items: Array<
      | {
          id: string;
          name: string | null;
          path: string;
          description: any | null;
          locale: PetitionLocale;
          createdAt: string;
          customProperties: { [key: string]: any };
          fields?: Array<{
            id: string;
            title: string | null;
            description: string | null;
            type: PetitionFieldType;
            fromPetitionFieldId: string | null;
            alias: string | null;
            options: { [key: string]: any };
            optional: boolean;
            multiple: boolean;
            children: Array<{
              id: string;
              title: string | null;
              description: string | null;
              type: PetitionFieldType;
              fromPetitionFieldId: string | null;
              alias: string | null;
              options: { [key: string]: any };
              optional: boolean;
              multiple: boolean;
            }> | null;
          }>;
          tags?: Array<{ id: string; name: string }>;
        }
      | {}
    >;
  };
};

export type GetTemplate_templateQueryVariables = Exact<{
  templateId: Scalars["GID"]["input"];
  includeFields: Scalars["Boolean"]["input"];
  includeTags: Scalars["Boolean"]["input"];
}>;

export type GetTemplate_templateQuery = {
  template:
    | {
        id: string;
        name: string | null;
        path: string;
        description: any | null;
        locale: PetitionLocale;
        createdAt: string;
        customProperties: { [key: string]: any };
        fields?: Array<{
          id: string;
          title: string | null;
          description: string | null;
          type: PetitionFieldType;
          fromPetitionFieldId: string | null;
          alias: string | null;
          options: { [key: string]: any };
          optional: boolean;
          multiple: boolean;
          children: Array<{
            id: string;
            title: string | null;
            description: string | null;
            type: PetitionFieldType;
            fromPetitionFieldId: string | null;
            alias: string | null;
            options: { [key: string]: any };
            optional: boolean;
            multiple: boolean;
          }> | null;
        }>;
        tags?: Array<{ id: string; name: string }>;
      }
    | {}
    | null;
};

export type DeleteTemplate_deletePetitionsMutationVariables = Exact<{
  templateId: Scalars["GID"]["input"];
  force: Scalars["Boolean"]["input"];
}>;

export type DeleteTemplate_deletePetitionsMutation = { deletePetitions: Success };

export type GetContacts_contactsQueryVariables = Exact<{
  offset: Scalars["Int"]["input"];
  limit: Scalars["Int"]["input"];
  sortBy?: InputMaybe<Array<QueryContacts_OrderBy> | QueryContacts_OrderBy>;
}>;

export type GetContacts_contactsQuery = {
  contacts: {
    totalCount: number;
    items: Array<{
      id: string;
      email: string;
      fullName: string;
      firstName: string;
      lastName: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
  };
};

export type CreateContact_contactMutationVariables = Exact<{
  data: CreateContactInput;
}>;

export type CreateContact_contactMutation = {
  createContact: {
    id: string;
    email: string;
    fullName: string;
    firstName: string;
    lastName: string | null;
    createdAt: string;
    updatedAt: string;
  };
};

export type GetContact_contactQueryVariables = Exact<{
  contactId: Scalars["GID"]["input"];
}>;

export type GetContact_contactQuery = {
  contact: {
    id: string;
    email: string;
    fullName: string;
    firstName: string;
    lastName: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type GetOrganizationUsers_usersQueryVariables = Exact<{
  offset: Scalars["Int"]["input"];
  limit: Scalars["Int"]["input"];
  sortBy?: InputMaybe<Array<OrganizationUsers_OrderBy> | OrganizationUsers_OrderBy>;
}>;

export type GetOrganizationUsers_usersQuery = {
  me: {
    organization: {
      users: {
        totalCount: number;
        items: Array<{
          id: string;
          email: string;
          fullName: string | null;
          firstName: string | null;
          lastName: string | null;
        }>;
      };
    };
  };
};

export type EventSubscriptions_getSubscriptionsQueryVariables = Exact<{ [key: string]: never }>;

export type EventSubscriptions_getSubscriptionsQuery = {
  subscriptions: Array<
    | {
        __typename: "PetitionEventSubscription";
        id: string;
        name: string | null;
        eventsUrl: string;
        isEnabled: boolean;
        petitionEventTypes: Array<PetitionEventType> | null;
        fromTemplate: { id: string } | null;
      }
    | {
        __typename: "ProfileEventSubscription";
        id: string;
        name: string | null;
        eventsUrl: string;
        isEnabled: boolean;
        profileEventTypes: Array<ProfileEventType> | null;
        fromProfileType: { id: string } | null;
      }
  >;
};

export type EventSubscriptions_createPetitionEventSubscriptionMutationVariables = Exact<{
  eventsUrl: Scalars["String"]["input"];
  eventTypes?: InputMaybe<Array<PetitionEventType> | PetitionEventType>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  fromTemplateId?: InputMaybe<Scalars["GID"]["input"]>;
  challenge?: InputMaybe<Scalars["Boolean"]["input"]>;
}>;

export type EventSubscriptions_createPetitionEventSubscriptionMutation = {
  createPetitionEventSubscription: {
    __typename: "PetitionEventSubscription";
    id: string;
    name: string | null;
    eventsUrl: string;
    isEnabled: boolean;
    petitionEventTypes: Array<PetitionEventType> | null;
    fromTemplate: { id: string } | null;
  };
};

export type EventSubscriptions_createProfileEventSubscriptionMutationVariables = Exact<{
  eventsUrl: Scalars["String"]["input"];
  eventTypes?: InputMaybe<Array<ProfileEventType> | ProfileEventType>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  fromProfileTypeId?: InputMaybe<Scalars["GID"]["input"]>;
  challenge?: InputMaybe<Scalars["Boolean"]["input"]>;
}>;

export type EventSubscriptions_createProfileEventSubscriptionMutation = {
  createProfileEventSubscription: {
    __typename: "ProfileEventSubscription";
    id: string;
    name: string | null;
    eventsUrl: string;
    isEnabled: boolean;
    profileEventTypes: Array<ProfileEventType> | null;
    fromProfileType: { id: string } | null;
  };
};

export type EventSubscriptions_deleteSubscriptionMutationVariables = Exact<{
  ids: Array<Scalars["GID"]["input"]> | Scalars["GID"]["input"];
}>;

export type EventSubscriptions_deleteSubscriptionMutation = { deleteEventSubscriptions: Result };

export type GetPetitionEvents_PetitionEventsQueryVariables = Exact<{
  before?: InputMaybe<Scalars["GID"]["input"]>;
  eventTypes?: InputMaybe<Array<PetitionEventType> | PetitionEventType>;
}>;

export type GetPetitionEvents_PetitionEventsQuery = {
  petitionEvents: Array<
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: {
          id: string;
          type: PetitionBaseType;
          myEffectivePermission: { permissionType: PetitionPermissionType } | null;
        } | null;
      }
  >;
};

export type GetProfileEvents_ProfileEventsQueryVariables = Exact<{
  before?: InputMaybe<Scalars["GID"]["input"]>;
  eventTypes?: InputMaybe<Array<ProfileEventType> | ProfileEventType>;
}>;

export type GetProfileEvents_ProfileEventsQuery = {
  profileEvents: Array<
    | {
        id: string;
        data: { [key: string]: any };
        type: ProfileEventType;
        createdAt: string;
        profile: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: ProfileEventType;
        createdAt: string;
        profile: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: ProfileEventType;
        createdAt: string;
        profile: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: ProfileEventType;
        createdAt: string;
        profile: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: ProfileEventType;
        createdAt: string;
        profile: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: ProfileEventType;
        createdAt: string;
        profile: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: ProfileEventType;
        createdAt: string;
        profile: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: ProfileEventType;
        createdAt: string;
        profile: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: ProfileEventType;
        createdAt: string;
        profile: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: ProfileEventType;
        createdAt: string;
        profile: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: ProfileEventType;
        createdAt: string;
        profile: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: ProfileEventType;
        createdAt: string;
        profile: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: ProfileEventType;
        createdAt: string;
        profile: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: ProfileEventType;
        createdAt: string;
        profile: { id: string } | null;
      }
  >;
};

export type GetProfiles_profilesQueryVariables = Exact<{
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  sortBy?: InputMaybe<Array<QueryProfiles_OrderBy> | QueryProfiles_OrderBy>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  profileTypeIds?: InputMaybe<Array<Scalars["GID"]["input"]> | Scalars["GID"]["input"]>;
  status?: InputMaybe<Array<ProfileStatus> | ProfileStatus>;
  values?: InputMaybe<ProfileFieldValuesFilter>;
  includeFieldOptions: Scalars["Boolean"]["input"];
  includeRelationships: Scalars["Boolean"]["input"];
  includeSubscribers: Scalars["Boolean"]["input"];
}>;

export type GetProfiles_profilesQuery = {
  profiles: {
    totalCount: number;
    items: Array<{
      id: string;
      name: string;
      status: ProfileStatus;
      createdAt: string;
      properties: Array<{
        field: {
          id: string;
          name: { [locale in UserLocale]?: string };
          alias: string | null;
          type: ProfileTypeFieldType;
          isExpirable: boolean;
          options?: { [key: string]: any };
        };
        value: {
          id: string;
          content: { [key: string]: any } | null;
          expiresAt: string | null;
          createdAt: string;
        } | null;
        files: Array<{
          id: string;
          expiresAt: string | null;
          createdAt: string;
          file: { filename: string; size: number; contentType: string } | null;
        }> | null;
      }>;
      relationships?: Array<{
        id: string;
        leftSideProfile: {
          id: string;
          name: string;
          status: ProfileStatus;
          createdAt: string;
          profileType: { id: string; name: { [locale in UserLocale]?: string } };
        };
        rightSideProfile: {
          id: string;
          name: string;
          status: ProfileStatus;
          createdAt: string;
          profileType: { id: string; name: { [locale in UserLocale]?: string } };
        };
        relationshipType: {
          alias: string | null;
          id: string;
          leftRightName: { [locale in UserLocale]?: string };
          rightLeftName: { [locale in UserLocale]?: string };
        };
      }>;
      subscribers?: Array<{
        user: {
          id: string;
          email: string;
          fullName: string | null;
          firstName: string | null;
          lastName: string | null;
        };
      }>;
      profileType: { id: string; name: { [locale in UserLocale]?: string } };
    }>;
  };
};

export type GetProfiles_profileTypeQueryVariables = Exact<{
  profileTypeId: Scalars["GID"]["input"];
}>;

export type GetProfiles_profileTypeQuery = {
  profileType: { fields: Array<{ id: string; alias: string | null }> };
};

export type CreateProfile_profileTypeQueryVariables = Exact<{
  profileTypeId: Scalars["GID"]["input"];
}>;

export type CreateProfile_profileTypeQuery = {
  profileType: {
    fields: Array<{
      id: string;
      type: ProfileTypeFieldType;
      alias: string | null;
      isExpirable: boolean;
    }>;
  };
};

export type CreateProfile_createProfileMutationVariables = Exact<{
  profileTypeId: Scalars["GID"]["input"];
  subscribe?: InputMaybe<Scalars["Boolean"]["input"]>;
  fields?: InputMaybe<Array<UpdateProfileFieldValueInput> | UpdateProfileFieldValueInput>;
  includeFieldOptions: Scalars["Boolean"]["input"];
  includeRelationships: Scalars["Boolean"]["input"];
  includeSubscribers: Scalars["Boolean"]["input"];
}>;

export type CreateProfile_createProfileMutation = {
  createProfile: {
    id: string;
    name: string;
    status: ProfileStatus;
    createdAt: string;
    properties: Array<{
      field: {
        id: string;
        name: { [locale in UserLocale]?: string };
        alias: string | null;
        type: ProfileTypeFieldType;
        isExpirable: boolean;
        options?: { [key: string]: any };
      };
      value: {
        id: string;
        content: { [key: string]: any } | null;
        expiresAt: string | null;
        createdAt: string;
      } | null;
      files: Array<{
        id: string;
        expiresAt: string | null;
        createdAt: string;
        file: { filename: string; size: number; contentType: string } | null;
      }> | null;
    }>;
    relationships?: Array<{
      id: string;
      leftSideProfile: {
        id: string;
        name: string;
        status: ProfileStatus;
        createdAt: string;
        profileType: { id: string; name: { [locale in UserLocale]?: string } };
      };
      rightSideProfile: {
        id: string;
        name: string;
        status: ProfileStatus;
        createdAt: string;
        profileType: { id: string; name: { [locale in UserLocale]?: string } };
      };
      relationshipType: {
        alias: string | null;
        id: string;
        leftRightName: { [locale in UserLocale]?: string };
        rightLeftName: { [locale in UserLocale]?: string };
      };
    }>;
    subscribers?: Array<{
      user: {
        id: string;
        email: string;
        fullName: string | null;
        firstName: string | null;
        lastName: string | null;
      };
    }>;
    profileType: { id: string; name: { [locale in UserLocale]?: string } };
  };
};

export type CreateProfile_createProfileFieldFileUploadLinkMutationVariables = Exact<{
  profileId: Scalars["GID"]["input"];
  profileTypeFieldId: Scalars["GID"]["input"];
  expiryDate?: InputMaybe<Scalars["Date"]["input"]>;
  data: Array<FileUploadInput> | FileUploadInput;
}>;

export type CreateProfile_createProfileFieldFileUploadLinkMutation = {
  createProfileFieldFileUploadLink: {
    uploads: Array<{
      file: { id: string };
      presignedPostData: { url: string; fields: { [key: string]: any } };
    }>;
  };
};

export type CreateProfile_profileFieldFileUploadCompleteMutationVariables = Exact<{
  profileId: Scalars["GID"]["input"];
  profileTypeFieldId: Scalars["GID"]["input"];
  profileFieldFileIds: Array<Scalars["GID"]["input"]> | Scalars["GID"]["input"];
  includeFieldOptions: Scalars["Boolean"]["input"];
  includeRelationships: Scalars["Boolean"]["input"];
  includeSubscribers: Scalars["Boolean"]["input"];
}>;

export type CreateProfile_profileFieldFileUploadCompleteMutation = {
  profileFieldFileUploadComplete: Array<{
    profile: {
      id: string;
      name: string;
      status: ProfileStatus;
      createdAt: string;
      properties: Array<{
        field: {
          id: string;
          name: { [locale in UserLocale]?: string };
          alias: string | null;
          type: ProfileTypeFieldType;
          isExpirable: boolean;
          options?: { [key: string]: any };
        };
        value: {
          id: string;
          content: { [key: string]: any } | null;
          expiresAt: string | null;
          createdAt: string;
        } | null;
        files: Array<{
          id: string;
          expiresAt: string | null;
          createdAt: string;
          file: { filename: string; size: number; contentType: string } | null;
        }> | null;
      }>;
      relationships?: Array<{
        id: string;
        leftSideProfile: {
          id: string;
          name: string;
          status: ProfileStatus;
          createdAt: string;
          profileType: { id: string; name: { [locale in UserLocale]?: string } };
        };
        rightSideProfile: {
          id: string;
          name: string;
          status: ProfileStatus;
          createdAt: string;
          profileType: { id: string; name: { [locale in UserLocale]?: string } };
        };
        relationshipType: {
          alias: string | null;
          id: string;
          leftRightName: { [locale in UserLocale]?: string };
          rightLeftName: { [locale in UserLocale]?: string };
        };
      }>;
      subscribers?: Array<{
        user: {
          id: string;
          email: string;
          fullName: string | null;
          firstName: string | null;
          lastName: string | null;
        };
      }>;
      profileType: { id: string; name: { [locale in UserLocale]?: string } };
    };
  }>;
};

export type GetProfile_profileQueryVariables = Exact<{
  profileId: Scalars["GID"]["input"];
  includeFieldOptions: Scalars["Boolean"]["input"];
  includeRelationships: Scalars["Boolean"]["input"];
  includeSubscribers: Scalars["Boolean"]["input"];
}>;

export type GetProfile_profileQuery = {
  profile: {
    id: string;
    name: string;
    status: ProfileStatus;
    createdAt: string;
    properties: Array<{
      field: {
        id: string;
        name: { [locale in UserLocale]?: string };
        alias: string | null;
        type: ProfileTypeFieldType;
        isExpirable: boolean;
        options?: { [key: string]: any };
      };
      value: {
        id: string;
        content: { [key: string]: any } | null;
        expiresAt: string | null;
        createdAt: string;
      } | null;
      files: Array<{
        id: string;
        expiresAt: string | null;
        createdAt: string;
        file: { filename: string; size: number; contentType: string } | null;
      }> | null;
    }>;
    relationships?: Array<{
      id: string;
      leftSideProfile: {
        id: string;
        name: string;
        status: ProfileStatus;
        createdAt: string;
        profileType: { id: string; name: { [locale in UserLocale]?: string } };
      };
      rightSideProfile: {
        id: string;
        name: string;
        status: ProfileStatus;
        createdAt: string;
        profileType: { id: string; name: { [locale in UserLocale]?: string } };
      };
      relationshipType: {
        alias: string | null;
        id: string;
        leftRightName: { [locale in UserLocale]?: string };
        rightLeftName: { [locale in UserLocale]?: string };
      };
    }>;
    subscribers?: Array<{
      user: {
        id: string;
        email: string;
        fullName: string | null;
        firstName: string | null;
        lastName: string | null;
      };
    }>;
    profileType: { id: string; name: { [locale in UserLocale]?: string } };
  };
};

export type UpdateProfileFieldValue_profileQueryVariables = Exact<{
  profileId: Scalars["GID"]["input"];
  includeFieldOptions: Scalars["Boolean"]["input"];
  includeRelationships: Scalars["Boolean"]["input"];
  includeSubscribers: Scalars["Boolean"]["input"];
}>;

export type UpdateProfileFieldValue_profileQuery = {
  profile: {
    id: string;
    name: string;
    status: ProfileStatus;
    createdAt: string;
    properties: Array<{
      field: {
        id: string;
        name: { [locale in UserLocale]?: string };
        alias: string | null;
        type: ProfileTypeFieldType;
        isExpirable: boolean;
        options?: { [key: string]: any };
      };
      value: {
        id: string;
        content: { [key: string]: any } | null;
        expiresAt: string | null;
        createdAt: string;
      } | null;
      files: Array<{
        id: string;
        expiresAt: string | null;
        createdAt: string;
        file: { filename: string; size: number; contentType: string } | null;
      }> | null;
    }>;
    relationships?: Array<{
      id: string;
      leftSideProfile: {
        id: string;
        name: string;
        status: ProfileStatus;
        createdAt: string;
        profileType: { id: string; name: { [locale in UserLocale]?: string } };
      };
      rightSideProfile: {
        id: string;
        name: string;
        status: ProfileStatus;
        createdAt: string;
        profileType: { id: string; name: { [locale in UserLocale]?: string } };
      };
      relationshipType: {
        alias: string | null;
        id: string;
        leftRightName: { [locale in UserLocale]?: string };
        rightLeftName: { [locale in UserLocale]?: string };
      };
    }>;
    subscribers?: Array<{
      user: {
        id: string;
        email: string;
        fullName: string | null;
        firstName: string | null;
        lastName: string | null;
      };
    }>;
    profileType: { id: string; name: { [locale in UserLocale]?: string } };
  };
};

export type UpdateProfileFieldValue_updateProfileFieldValueMutationVariables = Exact<{
  profileId: Scalars["GID"]["input"];
  fields: Array<UpdateProfileFieldValueInput> | UpdateProfileFieldValueInput;
}>;

export type UpdateProfileFieldValue_updateProfileFieldValueMutation = {
  updateProfileFieldValue: { id: string };
};

export type UpdateProfileFieldValue_createProfileFieldFileUploadLinkMutationVariables = Exact<{
  profileId: Scalars["GID"]["input"];
  profileTypeFieldId: Scalars["GID"]["input"];
  data: Array<FileUploadInput> | FileUploadInput;
  expiryDate?: InputMaybe<Scalars["Date"]["input"]>;
}>;

export type UpdateProfileFieldValue_createProfileFieldFileUploadLinkMutation = {
  createProfileFieldFileUploadLink: {
    uploads: Array<{
      file: { id: string };
      presignedPostData: { fields: { [key: string]: any }; url: string };
    }>;
  };
};

export type UpdateProfileFieldValue_profileFieldFileUploadCompleteMutationVariables = Exact<{
  profileId: Scalars["GID"]["input"];
  profileTypeFieldId: Scalars["GID"]["input"];
  profileFieldFileIds: Array<Scalars["GID"]["input"]> | Scalars["GID"]["input"];
}>;

export type UpdateProfileFieldValue_profileFieldFileUploadCompleteMutation = {
  profileFieldFileUploadComplete: Array<{ id: string }>;
};

export type UpdateProfileFieldValue_deleteProfileFieldFileMutationVariables = Exact<{
  profileId: Scalars["GID"]["input"];
  profileTypeFieldId: Scalars["GID"]["input"];
}>;

export type UpdateProfileFieldValue_deleteProfileFieldFileMutation = {
  deleteProfileFieldFile: Result;
};

export type DownloadProfileFieldFile_profileQueryVariables = Exact<{
  profileId: Scalars["GID"]["input"];
}>;

export type DownloadProfileFieldFile_profileQuery = {
  profile: {
    properties: Array<{
      field: { id: string; type: ProfileTypeFieldType; alias: string | null };
      files: Array<{ id: string }> | null;
    }>;
  };
};

export type DownloadProfileFieldFile_profileFieldFileDownloadLinkMutationVariables = Exact<{
  profileId: Scalars["GID"]["input"];
  profileTypeFieldId: Scalars["GID"]["input"];
  profileFieldFileId: Scalars["GID"]["input"];
}>;

export type DownloadProfileFieldFile_profileFieldFileDownloadLinkMutation = {
  profileFieldFileDownloadLink: { url: string | null };
};

export type GetProfileRelationships_profileQueryVariables = Exact<{
  profileId: Scalars["GID"]["input"];
}>;

export type GetProfileRelationships_profileQuery = {
  profile: {
    id: string;
    relationships: Array<{
      id: string;
      leftSideProfile: {
        id: string;
        name: string;
        status: ProfileStatus;
        createdAt: string;
        profileType: { id: string; name: { [locale in UserLocale]?: string } };
      };
      rightSideProfile: {
        id: string;
        name: string;
        status: ProfileStatus;
        createdAt: string;
        profileType: { id: string; name: { [locale in UserLocale]?: string } };
      };
      relationshipType: {
        alias: string | null;
        id: string;
        leftRightName: { [locale in UserLocale]?: string };
        rightLeftName: { [locale in UserLocale]?: string };
      };
    }>;
  };
};

export type CreateProfileRelationship_profileRelationshipTypesQueryVariables = Exact<{
  [key: string]: never;
}>;

export type CreateProfileRelationship_profileRelationshipTypesQuery = {
  profileRelationshipTypes: Array<{ id: string; alias: string | null }>;
};

export type CreateProfileRelationship_createProfileRelationshipMutationVariables = Exact<{
  profileId: Scalars["GID"]["input"];
  relationships: Array<CreateProfileRelationshipInput> | CreateProfileRelationshipInput;
}>;

export type CreateProfileRelationship_createProfileRelationshipMutation = {
  createProfileRelationship: {
    id: string;
    relationships: Array<{
      id: string;
      leftSideProfile: {
        id: string;
        name: string;
        status: ProfileStatus;
        createdAt: string;
        profileType: { id: string; name: { [locale in UserLocale]?: string } };
      };
      rightSideProfile: {
        id: string;
        name: string;
        status: ProfileStatus;
        createdAt: string;
        profileType: { id: string; name: { [locale in UserLocale]?: string } };
      };
      relationshipType: {
        alias: string | null;
        id: string;
        leftRightName: { [locale in UserLocale]?: string };
        rightLeftName: { [locale in UserLocale]?: string };
      };
    }>;
  };
};

export type DeleteProfileRelationship_removeProfileRelationshipMutationVariables = Exact<{
  profileId: Scalars["GID"]["input"];
  profileRelationshipId: Scalars["GID"]["input"];
}>;

export type DeleteProfileRelationship_removeProfileRelationshipMutation = {
  removeProfileRelationship: Success;
};

export type GetProfileSubscribers_profileQueryVariables = Exact<{
  profileId: Scalars["GID"]["input"];
}>;

export type GetProfileSubscribers_profileQuery = {
  profile: {
    subscribers: Array<{
      user: {
        id: string;
        email: string;
        fullName: string | null;
        firstName: string | null;
        lastName: string | null;
      };
    }>;
  };
};

export type SubscribeToProfile_subscribeToProfileMutationVariables = Exact<{
  profileId: Scalars["GID"]["input"];
  userIds: Array<Scalars["GID"]["input"]> | Scalars["GID"]["input"];
  includeFieldOptions: Scalars["Boolean"]["input"];
  includeRelationships: Scalars["Boolean"]["input"];
  includeSubscribers: Scalars["Boolean"]["input"];
}>;

export type SubscribeToProfile_subscribeToProfileMutation = {
  subscribeToProfile: Array<{
    id: string;
    name: string;
    status: ProfileStatus;
    createdAt: string;
    properties: Array<{
      field: {
        id: string;
        name: { [locale in UserLocale]?: string };
        alias: string | null;
        type: ProfileTypeFieldType;
        isExpirable: boolean;
        options?: { [key: string]: any };
      };
      value: {
        id: string;
        content: { [key: string]: any } | null;
        expiresAt: string | null;
        createdAt: string;
      } | null;
      files: Array<{
        id: string;
        expiresAt: string | null;
        createdAt: string;
        file: { filename: string; size: number; contentType: string } | null;
      }> | null;
    }>;
    relationships?: Array<{
      id: string;
      leftSideProfile: {
        id: string;
        name: string;
        status: ProfileStatus;
        createdAt: string;
        profileType: { id: string; name: { [locale in UserLocale]?: string } };
      };
      rightSideProfile: {
        id: string;
        name: string;
        status: ProfileStatus;
        createdAt: string;
        profileType: { id: string; name: { [locale in UserLocale]?: string } };
      };
      relationshipType: {
        alias: string | null;
        id: string;
        leftRightName: { [locale in UserLocale]?: string };
        rightLeftName: { [locale in UserLocale]?: string };
      };
    }>;
    subscribers?: Array<{
      user: {
        id: string;
        email: string;
        fullName: string | null;
        firstName: string | null;
        lastName: string | null;
      };
    }>;
    profileType: { id: string; name: { [locale in UserLocale]?: string } };
  }>;
};

export type UnsubscribeFromProfile_unsubscribeFromProfileMutationVariables = Exact<{
  profileId: Scalars["GID"]["input"];
  userIds: Array<Scalars["GID"]["input"]> | Scalars["GID"]["input"];
  includeFieldOptions: Scalars["Boolean"]["input"];
  includeRelationships: Scalars["Boolean"]["input"];
  includeSubscribers: Scalars["Boolean"]["input"];
}>;

export type UnsubscribeFromProfile_unsubscribeFromProfileMutation = {
  unsubscribeFromProfile: Array<{
    id: string;
    name: string;
    status: ProfileStatus;
    createdAt: string;
    properties: Array<{
      field: {
        id: string;
        name: { [locale in UserLocale]?: string };
        alias: string | null;
        type: ProfileTypeFieldType;
        isExpirable: boolean;
        options?: { [key: string]: any };
      };
      value: {
        id: string;
        content: { [key: string]: any } | null;
        expiresAt: string | null;
        createdAt: string;
      } | null;
      files: Array<{
        id: string;
        expiresAt: string | null;
        createdAt: string;
        file: { filename: string; size: number; contentType: string } | null;
      }> | null;
    }>;
    relationships?: Array<{
      id: string;
      leftSideProfile: {
        id: string;
        name: string;
        status: ProfileStatus;
        createdAt: string;
        profileType: { id: string; name: { [locale in UserLocale]?: string } };
      };
      rightSideProfile: {
        id: string;
        name: string;
        status: ProfileStatus;
        createdAt: string;
        profileType: { id: string; name: { [locale in UserLocale]?: string } };
      };
      relationshipType: {
        alias: string | null;
        id: string;
        leftRightName: { [locale in UserLocale]?: string };
        rightLeftName: { [locale in UserLocale]?: string };
      };
    }>;
    subscribers?: Array<{
      user: {
        id: string;
        email: string;
        fullName: string | null;
        firstName: string | null;
        lastName: string | null;
      };
    }>;
    profileType: { id: string; name: { [locale in UserLocale]?: string } };
  }>;
};

export type GetProfileTypes_profileTypesQueryVariables = Exact<{
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  includeFields: Scalars["Boolean"]["input"];
  includeFieldOptions: Scalars["Boolean"]["input"];
}>;

export type GetProfileTypes_profileTypesQuery = {
  profileTypes: {
    totalCount: number;
    items: Array<{
      id: string;
      name: { [locale in UserLocale]?: string };
      fields?: Array<{
        id: string;
        name: { [locale in UserLocale]?: string };
        alias: string | null;
        type: ProfileTypeFieldType;
        isExpirable: boolean;
        options?: { [key: string]: any };
      }>;
    }>;
  };
};

export type GetProfileType_profileTypeQueryVariables = Exact<{
  profileTypeId: Scalars["GID"]["input"];
  includeFields: Scalars["Boolean"]["input"];
  includeFieldOptions: Scalars["Boolean"]["input"];
}>;

export type GetProfileType_profileTypeQuery = {
  profileType: {
    id: string;
    name: { [locale in UserLocale]?: string };
    fields?: Array<{
      id: string;
      name: { [locale in UserLocale]?: string };
      alias: string | null;
      type: ProfileTypeFieldType;
      isExpirable: boolean;
      options?: { [key: string]: any };
    }>;
  };
};

export type BulkSendTemplate_createBulkPetitionSendTaskMutationVariables = Exact<{
  templateId: Scalars["GID"]["input"];
  temporaryFileId: Scalars["GID"]["input"];
}>;

export type BulkSendTemplate_createBulkPetitionSendTaskMutation = {
  createBulkPetitionSendTask: {
    id: string;
    progress: number | null;
    status: TaskStatus;
    output: any | null;
  };
};

export type BulkSendTemplate_uploadBulkPetitionSendTaskInputFileMutationVariables = Exact<{
  file: FileUploadInput;
}>;

export type BulkSendTemplate_uploadBulkPetitionSendTaskInputFileMutation = {
  uploadBulkPetitionSendTaskInputFile: { [key: string]: any };
};

export type ExportTemplate_createTemplateRepliesCsvExportTaskMutationVariables = Exact<{
  templateId: Scalars["GID"]["input"];
}>;

export type ExportTemplate_createTemplateRepliesCsvExportTaskMutation = {
  createTemplateRepliesCsvExportTask: {
    id: string;
    progress: number | null;
    status: TaskStatus;
    output: any | null;
  };
};

export type Task_TaskStatusQueryVariables = Exact<{
  taskId: Scalars["GID"]["input"];
}>;

export type Task_TaskStatusQuery = {
  task: {
    id: string;
    name: TaskName;
    progress: number | null;
    status: TaskStatus;
    output: any | null;
  };
};

export type Task_getTaskResultFileMutationVariables = Exact<{
  taskId: Scalars["GID"]["input"];
  preview?: InputMaybe<Scalars["Boolean"]["input"]>;
}>;

export type Task_getTaskResultFileMutation = { getTaskResultFile: { url: string } };

export type SubmitReply_createPetitionFieldRepliesMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  fields: Array<CreatePetitionFieldReplyInput> | CreatePetitionFieldReplyInput;
}>;

export type SubmitReply_createPetitionFieldRepliesMutation = {
  createPetitionFieldReplies: Array<{
    id: string;
    content: { [key: string]: any };
    status: PetitionFieldReplyStatus;
    metadata: { [key: string]: any };
    createdAt: string;
    updatedAt: string;
    children: Array<{
      field: { id: string; type: PetitionFieldType };
      replies: Array<{
        id: string;
        content: { [key: string]: any };
        status: PetitionFieldReplyStatus;
        metadata: { [key: string]: any };
        createdAt: string;
        updatedAt: string;
      }>;
    }> | null;
  }>;
};

export type SubmitReply_createFileUploadReplyMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  fieldId: Scalars["GID"]["input"];
  parentReplyId?: InputMaybe<Scalars["GID"]["input"]>;
  file: FileUploadInput;
  password?: InputMaybe<Scalars["String"]["input"]>;
}>;

export type SubmitReply_createFileUploadReplyMutation = {
  createFileUploadReply: {
    presignedPostData: { fields: { [key: string]: any }; url: string };
    reply: {
      id: string;
      content: { [key: string]: any };
      status: PetitionFieldReplyStatus;
      metadata: { [key: string]: any };
      createdAt: string;
      updatedAt: string;
      children: Array<{
        field: { id: string; type: PetitionFieldType };
        replies: Array<{
          id: string;
          content: { [key: string]: any };
          status: PetitionFieldReplyStatus;
          metadata: { [key: string]: any };
          createdAt: string;
          updatedAt: string;
        }>;
      }> | null;
    };
  };
};

export type SubmitReply_createFileUploadReplyCompleteMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  replyId: Scalars["GID"]["input"];
}>;

export type SubmitReply_createFileUploadReplyCompleteMutation = {
  createFileUploadReplyComplete: {
    id: string;
    content: { [key: string]: any };
    status: PetitionFieldReplyStatus;
    metadata: { [key: string]: any };
    createdAt: string;
    updatedAt: string;
    children: Array<{
      field: { id: string; type: PetitionFieldType };
      replies: Array<{
        id: string;
        content: { [key: string]: any };
        status: PetitionFieldReplyStatus;
        metadata: { [key: string]: any };
        createdAt: string;
        updatedAt: string;
      }>;
    }> | null;
  };
};

export type UpdateReplyStatus_updatePetitionFieldRepliesStatusMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  fieldId: Scalars["GID"]["input"];
  replyIds: Array<Scalars["GID"]["input"]> | Scalars["GID"]["input"];
  status: PetitionFieldReplyStatus;
}>;

export type UpdateReplyStatus_updatePetitionFieldRepliesStatusMutation = {
  updatePetitionFieldRepliesStatus: {
    replies: Array<{
      id: string;
      content: { [key: string]: any };
      status: PetitionFieldReplyStatus;
      metadata: { [key: string]: any };
      createdAt: string;
      updatedAt: string;
      field: { id: string } | null;
      children: Array<{
        field: { id: string; type: PetitionFieldType };
        replies: Array<{
          id: string;
          content: { [key: string]: any };
          status: PetitionFieldReplyStatus;
          metadata: { [key: string]: any };
          createdAt: string;
          updatedAt: string;
        }>;
      }> | null;
    }>;
  };
};

export type UpdateReply_updatePetitionFieldRepliesMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  replies: Array<UpdatePetitionFieldReplyInput> | UpdatePetitionFieldReplyInput;
}>;

export type UpdateReply_updatePetitionFieldRepliesMutation = {
  updatePetitionFieldReplies: Array<{
    id: string;
    content: { [key: string]: any };
    status: PetitionFieldReplyStatus;
    metadata: { [key: string]: any };
    createdAt: string;
    updatedAt: string;
    field: { id: string } | null;
    children: Array<{
      field: { id: string; type: PetitionFieldType };
      replies: Array<{
        id: string;
        content: { [key: string]: any };
        status: PetitionFieldReplyStatus;
        metadata: { [key: string]: any };
        createdAt: string;
        updatedAt: string;
      }>;
    }> | null;
  }>;
};

export type UpdateReply_updateFileUploadReplyMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  replyId: Scalars["GID"]["input"];
  file: FileUploadInput;
  password?: InputMaybe<Scalars["String"]["input"]>;
}>;

export type UpdateReply_updateFileUploadReplyMutation = {
  updateFileUploadReply: {
    presignedPostData: { fields: { [key: string]: any }; url: string };
    reply: {
      id: string;
      content: { [key: string]: any };
      status: PetitionFieldReplyStatus;
      metadata: { [key: string]: any };
      createdAt: string;
      updatedAt: string;
      children: Array<{
        field: { id: string; type: PetitionFieldType };
        replies: Array<{
          id: string;
          content: { [key: string]: any };
          status: PetitionFieldReplyStatus;
          metadata: { [key: string]: any };
          createdAt: string;
          updatedAt: string;
        }>;
      }> | null;
    };
  };
};

export type UpdateReply_updateFileUploadReplyCompleteMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  replyId: Scalars["GID"]["input"];
}>;

export type UpdateReply_updateFileUploadReplyCompleteMutation = {
  updateFileUploadReplyComplete: {
    id: string;
    content: { [key: string]: any };
    status: PetitionFieldReplyStatus;
    metadata: { [key: string]: any };
    createdAt: string;
    updatedAt: string;
    field: { id: string } | null;
    children: Array<{
      field: { id: string; type: PetitionFieldType };
      replies: Array<{
        id: string;
        content: { [key: string]: any };
        status: PetitionFieldReplyStatus;
        metadata: { [key: string]: any };
        createdAt: string;
        updatedAt: string;
      }>;
    }> | null;
  };
};

export type SubmitReplies_bulkCreatePetitionRepliesMutationVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
  replies: Scalars["JSONObject"]["input"];
  includeFields: Scalars["Boolean"]["input"];
  includeTags: Scalars["Boolean"]["input"];
  includeRecipients: Scalars["Boolean"]["input"];
  includeRecipientUrl: Scalars["Boolean"]["input"];
  includeReplies: Scalars["Boolean"]["input"];
  includeProgress: Scalars["Boolean"]["input"];
  includeSigners: Scalars["Boolean"]["input"];
  includeVariablesResult: Scalars["Boolean"]["input"];
  includeSignatureRequests: Scalars["Boolean"]["input"];
  includeOwner: Scalars["Boolean"]["input"];
}>;

export type SubmitReplies_bulkCreatePetitionRepliesMutation = {
  bulkCreatePetitionReplies: {
    id: string;
    path: string;
    name: string | null;
    status: PetitionStatus;
    deadline: string | null;
    locale: PetitionLocale;
    createdAt: string;
    customProperties: { [key: string]: any };
    isAnonymized: boolean;
    fromTemplate: { id: string } | null;
    recipients?: Array<{
      recipientUrl: string | null;
      id: string;
      status: PetitionAccessStatus;
      reminderCount: number;
      remindersLeft: number;
      remindersActive: boolean;
      nextReminderAt: string | null;
      createdAt: string;
      contact: {
        id: string;
        email: string;
        fullName: string;
        firstName: string;
        lastName: string | null;
        createdAt: string;
        updatedAt: string;
      } | null;
      granter: {
        id: string;
        email: string;
        fullName: string | null;
        firstName: string | null;
        lastName: string | null;
      } | null;
    }>;
    fields?: Array<{
      id: string;
      title: string | null;
      description: string | null;
      type: PetitionFieldType;
      fromPetitionFieldId: string | null;
      alias: string | null;
      options: { [key: string]: any };
      optional: boolean;
      multiple: boolean;
      replies: Array<{
        id: string;
        content: { [key: string]: any };
        status: PetitionFieldReplyStatus;
        metadata: { [key: string]: any };
        createdAt: string;
        updatedAt: string;
        children: Array<{
          field: { id: string; type: PetitionFieldType };
          replies: Array<{
            id: string;
            content: { [key: string]: any };
            status: PetitionFieldReplyStatus;
            metadata: { [key: string]: any };
            createdAt: string;
            updatedAt: string;
          }>;
        }> | null;
      }>;
      children: Array<{
        id: string;
        title: string | null;
        description: string | null;
        type: PetitionFieldType;
        fromPetitionFieldId: string | null;
        alias: string | null;
        options: { [key: string]: any };
        optional: boolean;
        multiple: boolean;
      }> | null;
    }>;
    replies?: Array<{
      id: string;
      alias: string | null;
      type: PetitionFieldType;
      replies: Array<{
        id: string;
        content: { [key: string]: any };
        metadata: { [key: string]: any };
        children: Array<{
          field: { id: string; alias: string | null; type: PetitionFieldType };
          replies: Array<{
            id: string;
            content: { [key: string]: any };
            metadata: { [key: string]: any };
          }>;
        }> | null;
      }>;
    }>;
    tags?: Array<{ id: string; name: string }>;
    signatureConfig?: {
      isEnabled: boolean;
      signers: Array<{ email: string; firstName: string; lastName: string | null } | null>;
    } | null;
    progress?: {
      external: { approved: number; replied: number; optional: number; total: number };
      internal: { approved: number; replied: number; optional: number; total: number };
    };
    variablesResult?: Array<{ name: string; value: number | null }>;
    signatures?: Array<{
      id: string;
      status: PetitionSignatureRequestStatus;
      environment: SignatureOrgIntegrationEnvironment;
      createdAt: string;
      updatedAt: string;
      signatureConfig: {
        signers: Array<{ email: string; firstName: string; lastName: string | null } | null>;
      };
    }>;
    owner?: {
      id: string;
      email: string;
      fullName: string | null;
      firstName: string | null;
      lastName: string | null;
    };
  };
};

export type UpdateReply_petitionQueryVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
}>;

export type UpdateReply_petitionQuery = {
  petition:
    | {
        fields: Array<{
          id: string;
          type: PetitionFieldType;
          options: { [key: string]: any };
          replies: Array<{ id: string }>;
          children: Array<{
            id: string;
            type: PetitionFieldType;
            options: { [key: string]: any };
            replies: Array<{ id: string }>;
          }> | null;
        }>;
      }
    | {
        fields: Array<{
          id: string;
          type: PetitionFieldType;
          options: { [key: string]: any };
          replies: Array<{ id: string }>;
          children: Array<{
            id: string;
            type: PetitionFieldType;
            options: { [key: string]: any };
            replies: Array<{ id: string }>;
          }> | null;
        }>;
      }
    | null;
};

export type SubmitReply_petitionQueryVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
}>;

export type SubmitReply_petitionQuery = {
  petition:
    | {
        fields: Array<{
          id: string;
          type: PetitionFieldType;
          options: { [key: string]: any };
          children: Array<{
            id: string;
            type: PetitionFieldType;
            options: { [key: string]: any };
          }> | null;
        }>;
      }
    | {
        fields: Array<{
          id: string;
          type: PetitionFieldType;
          options: { [key: string]: any };
          children: Array<{
            id: string;
            type: PetitionFieldType;
            options: { [key: string]: any };
          }> | null;
        }>;
      }
    | null;
};

export const AWSPresignedPostDataFragmentDoc = gql`
  fragment AWSPresignedPostData on AWSPresignedPostData {
    fields
    url
  }
` as unknown as DocumentNode<AWSPresignedPostDataFragment, unknown>;
export const OrganizationFragmentDoc = gql`
  fragment Organization on Organization {
    id
    name
  }
` as unknown as DocumentNode<OrganizationFragment, unknown>;
export const ContactFragmentDoc = gql`
  fragment Contact on Contact {
    id
    email
    fullName
    firstName
    lastName
    createdAt
    updatedAt
  }
` as unknown as DocumentNode<ContactFragment, unknown>;
export const UserFragmentDoc = gql`
  fragment User on User {
    id
    email
    fullName
    firstName
    lastName
  }
` as unknown as DocumentNode<UserFragment, unknown>;
export const PetitionAccessFragmentDoc = gql`
  fragment PetitionAccess on PetitionAccess {
    id
    contact {
      ...Contact
    }
    granter {
      ...User
    }
    status
    reminderCount
    remindersLeft
    remindersActive
    nextReminderAt
    createdAt
  }
  ${ContactFragmentDoc}
  ${UserFragmentDoc}
` as unknown as DocumentNode<PetitionAccessFragment, unknown>;
export const _PetitionFieldFragmentDoc = gql`
  fragment _PetitionField on PetitionField {
    id
    title
    description
    type
    fromPetitionFieldId
    alias
    options
    optional
    multiple
  }
` as unknown as DocumentNode<_PetitionFieldFragment, unknown>;
export const PetitionFieldFragmentDoc = gql`
  fragment PetitionField on PetitionField {
    ..._PetitionField
    children {
      ..._PetitionField
    }
  }
  ${_PetitionFieldFragmentDoc}
` as unknown as DocumentNode<PetitionFieldFragment, unknown>;
export const _PetitionFieldReplyFragmentDoc = gql`
  fragment _PetitionFieldReply on PetitionFieldReply {
    id
    content
    status
    metadata
    createdAt
    updatedAt
  }
` as unknown as DocumentNode<_PetitionFieldReplyFragment, unknown>;
export const PetitionFieldReplyFragmentDoc = gql`
  fragment PetitionFieldReply on PetitionFieldReply {
    ..._PetitionFieldReply
    children {
      field {
        id
        type
      }
      replies {
        ..._PetitionFieldReply
      }
    }
  }
  ${_PetitionFieldReplyFragmentDoc}
` as unknown as DocumentNode<PetitionFieldReplyFragment, unknown>;
export const PetitionFieldWithRepliesFragmentDoc = gql`
  fragment PetitionFieldWithReplies on PetitionField {
    ...PetitionField
    replies {
      ...PetitionFieldReply
    }
  }
  ${PetitionFieldFragmentDoc}
  ${PetitionFieldReplyFragmentDoc}
` as unknown as DocumentNode<PetitionFieldWithRepliesFragment, unknown>;
export const TagFragmentDoc = gql`
  fragment Tag on Tag {
    id
    name
  }
` as unknown as DocumentNode<TagFragment, unknown>;
export const PetitionSignatureRequestFragmentDoc = gql`
  fragment PetitionSignatureRequest on PetitionSignatureRequest {
    id
    status
    environment
    signatureConfig {
      signers {
        email
        firstName
        lastName
      }
    }
    createdAt
    updatedAt
  }
` as unknown as DocumentNode<PetitionSignatureRequestFragment, unknown>;
export const PetitionFragmentDoc = gql`
  fragment Petition on Petition {
    id
    path
    name
    status
    deadline
    locale
    createdAt
    fromTemplate {
      id
    }
    customProperties
    recipients: accesses @include(if: $includeRecipients) {
      ...PetitionAccess
    }
    recipients: accesses @include(if: $includeRecipientUrl) {
      recipientUrl
    }
    fields @include(if: $includeFields) {
      ...PetitionFieldWithReplies
    }
    replies: fields @include(if: $includeReplies) {
      id
      alias
      type
      replies {
        id
        content
        metadata
        children {
          field {
            id
            alias
            type
          }
          replies {
            id
            content
            metadata
          }
        }
      }
    }
    tags @include(if: $includeTags) {
      ...Tag
    }
    signatureConfig @include(if: $includeSigners) {
      isEnabled
      signers {
        email
        firstName
        lastName
      }
    }
    progress @include(if: $includeProgress) {
      external {
        approved
        replied
        optional
        total
      }
      internal {
        approved
        replied
        optional
        total
      }
    }
    variablesResult @include(if: $includeVariablesResult) {
      name
      value
    }
    signatures: signatureRequests @include(if: $includeSignatureRequests) {
      ...PetitionSignatureRequest
    }
    owner @include(if: $includeOwner) {
      ...User
    }
    isAnonymized
  }
  ${PetitionAccessFragmentDoc}
  ${PetitionFieldWithRepliesFragmentDoc}
  ${TagFragmentDoc}
  ${PetitionSignatureRequestFragmentDoc}
  ${UserFragmentDoc}
` as unknown as DocumentNode<PetitionFragment, unknown>;
export const TemplateFragmentDoc = gql`
  fragment Template on PetitionTemplate {
    id
    name
    path
    description
    locale
    createdAt
    customProperties
    fields @include(if: $includeFields) {
      ...PetitionField
    }
    tags @include(if: $includeTags) {
      ...Tag
    }
  }
  ${PetitionFieldFragmentDoc}
  ${TagFragmentDoc}
` as unknown as DocumentNode<TemplateFragment, unknown>;
export const UserGroupFragmentDoc = gql`
  fragment UserGroup on UserGroup {
    id
    name
  }
` as unknown as DocumentNode<UserGroupFragment, unknown>;
export const PermissionFragmentDoc = gql`
  fragment Permission on PetitionPermission {
    permissionType
    createdAt
    ... on PetitionUserPermission {
      user {
        ...User
      }
    }
    ... on PetitionUserGroupPermission {
      group {
        ...UserGroup
      }
    }
  }
  ${UserFragmentDoc}
  ${UserGroupFragmentDoc}
` as unknown as DocumentNode<PermissionFragment, unknown>;
export const PetitionEventSubscriptionFragmentDoc = gql`
  fragment PetitionEventSubscription on PetitionEventSubscription {
    id
    name
    eventsUrl
    isEnabled
    petitionEventTypes: eventTypes
    fromTemplate {
      id
    }
    __typename
  }
` as unknown as DocumentNode<PetitionEventSubscriptionFragment, unknown>;
export const ProfileEventSubscriptionFragmentDoc = gql`
  fragment ProfileEventSubscription on ProfileEventSubscription {
    id
    name
    eventsUrl
    isEnabled
    profileEventTypes: eventTypes
    fromProfileType {
      id
    }
    __typename
  }
` as unknown as DocumentNode<ProfileEventSubscriptionFragment, unknown>;
export const EventSubscriptionFragmentDoc = gql`
  fragment EventSubscription on EventSubscription {
    id
    ... on PetitionEventSubscription {
      ...PetitionEventSubscription
    }
    ... on ProfileEventSubscription {
      ...ProfileEventSubscription
    }
  }
  ${PetitionEventSubscriptionFragmentDoc}
  ${ProfileEventSubscriptionFragmentDoc}
` as unknown as DocumentNode<EventSubscriptionFragment, unknown>;
export const TaskFragmentDoc = gql`
  fragment Task on Task {
    id
    progress
    status
    output
  }
` as unknown as DocumentNode<TaskFragment, unknown>;
export const ProfileTypeFieldFragmentDoc = gql`
  fragment ProfileTypeField on ProfileTypeField {
    id
    name
    alias
    type
    isExpirable
    options @include(if: $includeFieldOptions)
  }
` as unknown as DocumentNode<ProfileTypeFieldFragment, unknown>;
export const ProfileTypeFragmentDoc = gql`
  fragment ProfileType on ProfileType {
    id
    name
    fields @include(if: $includeFields) {
      ...ProfileTypeField
    }
  }
  ${ProfileTypeFieldFragmentDoc}
` as unknown as DocumentNode<ProfileTypeFragment, unknown>;
export const ProfileBaseFragmentDoc = gql`
  fragment ProfileBase on Profile {
    id
    name
    status
    profileType {
      id
      name
    }
    createdAt
  }
` as unknown as DocumentNode<ProfileBaseFragment, unknown>;
export const ProfileFieldValueFragmentDoc = gql`
  fragment ProfileFieldValue on ProfileFieldValue {
    id
    content
    expiresAt
    createdAt
  }
` as unknown as DocumentNode<ProfileFieldValueFragment, unknown>;
export const ProfileFieldFileFragmentDoc = gql`
  fragment ProfileFieldFile on ProfileFieldFile {
    id
    file {
      filename
      size
      contentType
    }
    expiresAt
    createdAt
  }
` as unknown as DocumentNode<ProfileFieldFileFragment, unknown>;
export const ProfileFieldPropertyFragmentDoc = gql`
  fragment ProfileFieldProperty on ProfileFieldProperty {
    field {
      ...ProfileTypeField
    }
    value {
      ...ProfileFieldValue
    }
    files {
      ...ProfileFieldFile
    }
  }
  ${ProfileTypeFieldFragmentDoc}
  ${ProfileFieldValueFragmentDoc}
  ${ProfileFieldFileFragmentDoc}
` as unknown as DocumentNode<ProfileFieldPropertyFragment, unknown>;
export const ProfileRelationshipFragmentDoc = gql`
  fragment ProfileRelationship on ProfileRelationship {
    id
    leftSideProfile {
      ...ProfileBase
    }
    rightSideProfile {
      ...ProfileBase
    }
    relationshipType {
      alias
      id
      leftRightName
      rightLeftName
    }
  }
  ${ProfileBaseFragmentDoc}
` as unknown as DocumentNode<ProfileRelationshipFragment, unknown>;
export const ProfileFragmentDoc = gql`
  fragment Profile on Profile {
    ...ProfileBase
    properties {
      ...ProfileFieldProperty
    }
    relationships @include(if: $includeRelationships) {
      ...ProfileRelationship
    }
    subscribers @include(if: $includeSubscribers) {
      user {
        ...User
      }
    }
  }
  ${ProfileBaseFragmentDoc}
  ${ProfileFieldPropertyFragmentDoc}
  ${ProfileRelationshipFragmentDoc}
  ${UserFragmentDoc}
` as unknown as DocumentNode<ProfileFragment, unknown>;
export const PetitionFieldCommentFragmentDoc = gql`
  fragment PetitionFieldComment on PetitionFieldComment {
    id
    content
    isInternal
    createdAt
    isAnonymized
    author {
      __typename
      ... on User {
        id
        email
        fullName
      }
      ... on PetitionAccess {
        contact {
          id
          email
          fullName
        }
      }
    }
    mentions {
      __typename
      ... on PetitionFieldCommentUserMention {
        user {
          id
          email
          fullName
        }
      }
      ... on PetitionFieldCommentUserGroupMention {
        userGroup {
          id
          name
          localizableName
        }
      }
    }
  }
` as unknown as DocumentNode<PetitionFieldCommentFragment, unknown>;
export const waitForTask_TaskDocument = gql`
  query waitForTask_Task($id: GID!) {
    task(id: $id) {
      ...Task
    }
  }
  ${TaskFragmentDoc}
` as unknown as DocumentNode<waitForTask_TaskQuery, waitForTask_TaskQueryVariables>;
export const getTaskResultFileUrl_getTaskResultFileDocument = gql`
  mutation getTaskResultFileUrl_getTaskResultFile($taskId: GID!) {
    getTaskResultFile(taskId: $taskId) {
      url
    }
  }
` as unknown as DocumentNode<
  getTaskResultFileUrl_getTaskResultFileMutation,
  getTaskResultFileUrl_getTaskResultFileMutationVariables
>;
export const getTags_tagsByNameDocument = gql`
  query getTags_tagsByName($offset: Int!, $limit: Int!, $search: [String!]!) {
    tagsByName(offset: $offset, limit: $limit, search: $search) {
      items {
        ...Tag
      }
      totalCount
    }
  }
  ${TagFragmentDoc}
` as unknown as DocumentNode<getTags_tagsByNameQuery, getTags_tagsByNameQueryVariables>;
export const CreatePetitionRecipients_contactDocument = gql`
  query CreatePetitionRecipients_contact($email: String!) {
    contacts: contactsByEmail(emails: [$email]) {
      id
      firstName
      lastName
    }
  }
` as unknown as DocumentNode<
  CreatePetitionRecipients_contactQuery,
  CreatePetitionRecipients_contactQueryVariables
>;
export const CreatePetitionRecipients_updateContactDocument = gql`
  mutation CreatePetitionRecipients_updateContact($contactId: GID!, $data: UpdateContactInput!) {
    updateContact(id: $contactId, data: $data) {
      id
    }
  }
` as unknown as DocumentNode<
  CreatePetitionRecipients_updateContactMutation,
  CreatePetitionRecipients_updateContactMutationVariables
>;
export const CreatePetitionRecipients_createContactDocument = gql`
  mutation CreatePetitionRecipients_createContact($data: CreateContactInput!) {
    createContact(data: $data) {
      id
    }
  }
` as unknown as DocumentNode<
  CreatePetitionRecipients_createContactMutation,
  CreatePetitionRecipients_createContactMutationVariables
>;
export const parsePetitionCommentBody_usersByEmailDocument = gql`
  query parsePetitionCommentBody_usersByEmail($search: String!) {
    me {
      organization {
        usersByEmail(emails: [$search], limit: 1, offset: 0) {
          items {
            id
            fullName
          }
        }
      }
    }
  }
` as unknown as DocumentNode<
  parsePetitionCommentBody_usersByEmailQuery,
  parsePetitionCommentBody_usersByEmailQueryVariables
>;
export const parsePetitionCommentBody_userGroupsDocument = gql`
  query parsePetitionCommentBody_userGroups($search: String!) {
    userGroups(search: $search, limit: 1, offset: 0) {
      items {
        id
        name
        localizableName
      }
    }
  }
` as unknown as DocumentNode<
  parsePetitionCommentBody_userGroupsQuery,
  parsePetitionCommentBody_userGroupsQueryVariables
>;
export const parsePetitionCommentBody_getUsersOrGroupsDocument = gql`
  query parsePetitionCommentBody_getUsersOrGroups($ids: [ID!]!) {
    getUsersOrGroups(ids: $ids) {
      __typename
      ... on User {
        id
        fullName
      }
      ... on UserGroup {
        id
        name
        localizableName
      }
    }
  }
` as unknown as DocumentNode<
  parsePetitionCommentBody_getUsersOrGroupsQuery,
  parsePetitionCommentBody_getUsersOrGroupsQueryVariables
>;
export const GetMe_userDocument = gql`
  query GetMe_user {
    me {
      ...User
      organization {
        ...Organization
      }
    }
  }
  ${UserFragmentDoc}
  ${OrganizationFragmentDoc}
` as unknown as DocumentNode<GetMe_userQuery, GetMe_userQueryVariables>;
export const GetTags_tagsDocument = gql`
  query GetTags_tags($offset: Int!, $limit: Int!, $search: String) {
    tags(offset: $offset, limit: $limit, search: $search) {
      items {
        ...Tag
      }
      totalCount
    }
  }
  ${TagFragmentDoc}
` as unknown as DocumentNode<GetTags_tagsQuery, GetTags_tagsQueryVariables>;
export const GetPetitions_petitionsDocument = gql`
  query GetPetitions_petitions(
    $offset: Int!
    $limit: Int!
    $search: String
    $status: [PetitionStatus!]
    $tags: PetitionTagFilter
    $sortBy: [QueryPetitions_OrderBy!]
    $includeRecipients: Boolean!
    $includeFields: Boolean!
    $includeTags: Boolean!
    $includeRecipientUrl: Boolean!
    $includeReplies: Boolean!
    $includeProgress: Boolean!
    $includeSigners: Boolean!
    $includeVariablesResult: Boolean!
    $includeSignatureRequests: Boolean!
    $includeOwner: Boolean!
    $fromTemplateId: [GID!]
  ) {
    petitions(
      offset: $offset
      limit: $limit
      sortBy: $sortBy
      search: $search
      filters: { status: $status, type: PETITION, tags: $tags, fromTemplateId: $fromTemplateId }
    ) {
      items {
        ...Petition
      }
      totalCount
    }
  }
  ${PetitionFragmentDoc}
` as unknown as DocumentNode<GetPetitions_petitionsQuery, GetPetitions_petitionsQueryVariables>;
export const CreatePetition_petitionDocument = gql`
  mutation CreatePetition_petition(
    $name: String
    $templateId: GID
    $includeRecipients: Boolean!
    $includeFields: Boolean!
    $includeTags: Boolean!
    $includeRecipientUrl: Boolean!
    $includeReplies: Boolean!
    $includeProgress: Boolean!
    $includeSigners: Boolean!
    $includeVariablesResult: Boolean!
    $includeSignatureRequests: Boolean!
    $includeOwner: Boolean!
  ) {
    createPetition(name: $name, petitionId: $templateId) {
      ...Petition
    }
  }
  ${PetitionFragmentDoc}
` as unknown as DocumentNode<
  CreatePetition_petitionMutation,
  CreatePetition_petitionMutationVariables
>;
export const GetPetition_petitionDocument = gql`
  query GetPetition_petition(
    $petitionId: GID!
    $includeRecipients: Boolean!
    $includeFields: Boolean!
    $includeTags: Boolean!
    $includeRecipientUrl: Boolean!
    $includeReplies: Boolean!
    $includeProgress: Boolean!
    $includeSigners: Boolean!
    $includeVariablesResult: Boolean!
    $includeSignatureRequests: Boolean!
    $includeOwner: Boolean!
  ) {
    petition(id: $petitionId) {
      ...Petition
    }
  }
  ${PetitionFragmentDoc}
` as unknown as DocumentNode<GetPetition_petitionQuery, GetPetition_petitionQueryVariables>;
export const UpdatePetition_petitionDocument = gql`
  query UpdatePetition_petition($petitionId: GID!) {
    petition(id: $petitionId) {
      __typename
      signatureConfig {
        isEnabled
        allowAdditionalSigners
        integration {
          id
        }
        review
        timezone
        title
        signingMode
        instructions
        minSigners
      }
    }
  }
` as unknown as DocumentNode<UpdatePetition_petitionQuery, UpdatePetition_petitionQueryVariables>;
export const UpdatePetition_updatePetitionDocument = gql`
  mutation UpdatePetition_updatePetition(
    $petitionId: GID!
    $data: UpdatePetitionInput!
    $includeRecipients: Boolean!
    $includeFields: Boolean!
    $includeTags: Boolean!
    $includeRecipientUrl: Boolean!
    $includeReplies: Boolean!
    $includeProgress: Boolean!
    $includeSigners: Boolean!
    $includeVariablesResult: Boolean!
    $includeSignatureRequests: Boolean!
    $includeOwner: Boolean!
  ) {
    updatePetition(petitionId: $petitionId, data: $data) {
      ...Petition
    }
  }
  ${PetitionFragmentDoc}
` as unknown as DocumentNode<
  UpdatePetition_updatePetitionMutation,
  UpdatePetition_updatePetitionMutationVariables
>;
export const DeletePetition_deletePetitionsDocument = gql`
  mutation DeletePetition_deletePetitions($petitionId: GID!, $force: Boolean!) {
    deletePetitions(ids: [$petitionId], force: $force)
  }
` as unknown as DocumentNode<
  DeletePetition_deletePetitionsMutation,
  DeletePetition_deletePetitionsMutationVariables
>;
export const ClosePetition_closePetitionDocument = gql`
  mutation ClosePetition_closePetition(
    $petitionId: GID!
    $includeRecipients: Boolean!
    $includeFields: Boolean!
    $includeTags: Boolean!
    $includeRecipientUrl: Boolean!
    $includeReplies: Boolean!
    $includeProgress: Boolean!
    $includeSigners: Boolean!
    $includeVariablesResult: Boolean!
    $includeSignatureRequests: Boolean!
    $includeOwner: Boolean!
  ) {
    closePetition(petitionId: $petitionId) {
      ...Petition
    }
  }
  ${PetitionFragmentDoc}
` as unknown as DocumentNode<
  ClosePetition_closePetitionMutation,
  ClosePetition_closePetitionMutationVariables
>;
export const ReopenPetition_reopenPetitionDocument = gql`
  mutation ReopenPetition_reopenPetition(
    $petitionId: GID!
    $includeRecipients: Boolean!
    $includeFields: Boolean!
    $includeTags: Boolean!
    $includeRecipientUrl: Boolean!
    $includeReplies: Boolean!
    $includeProgress: Boolean!
    $includeSigners: Boolean!
    $includeVariablesResult: Boolean!
    $includeSignatureRequests: Boolean!
    $includeOwner: Boolean!
  ) {
    reopenPetition(petitionId: $petitionId) {
      ...Petition
    }
  }
  ${PetitionFragmentDoc}
` as unknown as DocumentNode<
  ReopenPetition_reopenPetitionMutation,
  ReopenPetition_reopenPetitionMutationVariables
>;
export const TagPetition_tagsByNameDocument = gql`
  query TagPetition_tagsByName($search: String!) {
    tagsByName(offset: 0, limit: 1, search: [$search]) {
      items {
        ...Tag
      }
    }
  }
  ${TagFragmentDoc}
` as unknown as DocumentNode<TagPetition_tagsByNameQuery, TagPetition_tagsByNameQueryVariables>;
export const TagPetition_createTagDocument = gql`
  mutation TagPetition_createTag($name: String!, $color: String!) {
    createTag(name: $name, color: $color) {
      ...Tag
    }
  }
  ${TagFragmentDoc}
` as unknown as DocumentNode<TagPetition_createTagMutation, TagPetition_createTagMutationVariables>;
export const TagPetition_tagPetitionDocument = gql`
  mutation TagPetition_tagPetition(
    $petitionId: GID!
    $tagId: GID!
    $includeRecipients: Boolean!
    $includeFields: Boolean!
    $includeTags: Boolean!
    $includeRecipientUrl: Boolean!
    $includeReplies: Boolean!
    $includeProgress: Boolean!
    $includeSigners: Boolean!
    $includeVariablesResult: Boolean!
    $includeSignatureRequests: Boolean!
    $includeOwner: Boolean!
  ) {
    tagPetition(petitionId: $petitionId, tagId: $tagId) {
      ...Petition
    }
  }
  ${PetitionFragmentDoc}
` as unknown as DocumentNode<
  TagPetition_tagPetitionMutation,
  TagPetition_tagPetitionMutationVariables
>;
export const UntagPetition_tagsByNameDocument = gql`
  query UntagPetition_tagsByName($search: String!) {
    tagsByName(offset: 0, limit: 1, search: [$search]) {
      items {
        ...Tag
      }
    }
  }
  ${TagFragmentDoc}
` as unknown as DocumentNode<UntagPetition_tagsByNameQuery, UntagPetition_tagsByNameQueryVariables>;
export const UntagPetition_untagPetitionDocument = gql`
  mutation UntagPetition_untagPetition($petitionId: GID!, $tagId: GID!) {
    untagPetition(petitionId: $petitionId, tagId: $tagId) {
      id
    }
  }
` as unknown as DocumentNode<
  UntagPetition_untagPetitionMutation,
  UntagPetition_untagPetitionMutationVariables
>;
export const ReadPetitionCustomPropertiesDocument = gql`
  query ReadPetitionCustomProperties($petitionId: GID!) {
    petition(id: $petitionId) {
      id
      customProperties
    }
  }
` as unknown as DocumentNode<
  ReadPetitionCustomPropertiesQuery,
  ReadPetitionCustomPropertiesQueryVariables
>;
export const CreateOrUpdatePetitionCustomProperty_modifyPetitionCustomPropertyDocument = gql`
  mutation CreateOrUpdatePetitionCustomProperty_modifyPetitionCustomProperty(
    $petitionId: GID!
    $key: String!
    $value: String
  ) {
    modifyPetitionCustomProperty(petitionId: $petitionId, key: $key, value: $value) {
      customProperties
    }
  }
` as unknown as DocumentNode<
  CreateOrUpdatePetitionCustomProperty_modifyPetitionCustomPropertyMutation,
  CreateOrUpdatePetitionCustomProperty_modifyPetitionCustomPropertyMutationVariables
>;
export const DeletePetitionCustomProperty_modifyPetitionCustomPropertyDocument = gql`
  mutation DeletePetitionCustomProperty_modifyPetitionCustomProperty(
    $petitionId: GID!
    $key: String!
  ) {
    modifyPetitionCustomProperty(petitionId: $petitionId, key: $key) {
      id
    }
  }
` as unknown as DocumentNode<
  DeletePetitionCustomProperty_modifyPetitionCustomPropertyMutation,
  DeletePetitionCustomProperty_modifyPetitionCustomPropertyMutationVariables
>;
export const CreatePetitionRecipients_petitionDocument = gql`
  query CreatePetitionRecipients_petition($id: GID!) {
    petition(id: $id) {
      emailBody
      emailSubject
    }
  }
` as unknown as DocumentNode<
  CreatePetitionRecipients_petitionQuery,
  CreatePetitionRecipients_petitionQueryVariables
>;
export const CreatePetitionRecipients_sendPetitionDocument = gql`
  mutation CreatePetitionRecipients_sendPetition(
    $petitionId: GID!
    $contactIds: [GID!]!
    $subject: String!
    $body: JSON!
    $scheduledAt: DateTime
    $remindersConfig: RemindersConfigInput
    $skipEmailSend: Boolean
    $includeRecipients: Boolean!
    $includeFields: Boolean!
    $includeTags: Boolean!
    $includeRecipientUrl: Boolean!
    $includeReplies: Boolean!
    $includeProgress: Boolean!
    $includeSigners: Boolean!
    $includeVariablesResult: Boolean!
    $includeSignatureRequests: Boolean!
    $includeOwner: Boolean!
    $senderId: GID
  ) {
    sendPetition(
      petitionId: $petitionId
      contactIdGroups: [$contactIds]
      subject: $subject
      body: $body
      scheduledAt: $scheduledAt
      remindersConfig: $remindersConfig
      senderId: $senderId
      skipEmailSend: $skipEmailSend
    ) {
      result
      petition {
        ...Petition
      }
    }
  }
  ${PetitionFragmentDoc}
` as unknown as DocumentNode<
  CreatePetitionRecipients_sendPetitionMutation,
  CreatePetitionRecipients_sendPetitionMutationVariables
>;
export const CreatePetitionRecipients_userByEmailDocument = gql`
  query CreatePetitionRecipients_userByEmail($email: String!) {
    me {
      organization {
        users(limit: 1, offset: 0, search: $email, searchByEmailOnly: true) {
          items {
            id
            email
          }
        }
      }
    }
  }
` as unknown as DocumentNode<
  CreatePetitionRecipients_userByEmailQuery,
  CreatePetitionRecipients_userByEmailQueryVariables
>;
export const GetPetitionRecipients_petitionAccessesDocument = gql`
  query GetPetitionRecipients_petitionAccesses($petitionId: GID!) {
    petition(id: $petitionId) {
      ... on Petition {
        accesses {
          ...PetitionAccess
        }
      }
    }
  }
  ${PetitionAccessFragmentDoc}
` as unknown as DocumentNode<
  GetPetitionRecipients_petitionAccessesQuery,
  GetPetitionRecipients_petitionAccessesQueryVariables
>;
export const ActivatePetitionRecipient_reactivateAccessesDocument = gql`
  mutation ActivatePetitionRecipient_reactivateAccesses($petitionId: GID!, $accessId: GID!) {
    reactivateAccesses(petitionId: $petitionId, accessIds: [$accessId]) {
      ...PetitionAccess
    }
  }
  ${PetitionAccessFragmentDoc}
` as unknown as DocumentNode<
  ActivatePetitionRecipient_reactivateAccessesMutation,
  ActivatePetitionRecipient_reactivateAccessesMutationVariables
>;
export const DeactivatePetitionRecipient_deactivateAccessesDocument = gql`
  mutation DeactivatePetitionRecipient_deactivateAccesses($petitionId: GID!, $accessId: GID!) {
    deactivateAccesses(petitionId: $petitionId, accessIds: [$accessId]) {
      ...PetitionAccess
    }
  }
  ${PetitionAccessFragmentDoc}
` as unknown as DocumentNode<
  DeactivatePetitionRecipient_deactivateAccessesMutation,
  DeactivatePetitionRecipient_deactivateAccessesMutationVariables
>;
export const RemindPetitionRecipient_sendRemindersDocument = gql`
  mutation RemindPetitionRecipient_sendReminders($petitionId: GID!, $accessId: GID!, $body: JSON) {
    sendReminders(petitionId: $petitionId, accessIds: [$accessId], body: $body) {
      id
      access {
        ...PetitionAccess
      }
    }
  }
  ${PetitionAccessFragmentDoc}
` as unknown as DocumentNode<
  RemindPetitionRecipient_sendRemindersMutation,
  RemindPetitionRecipient_sendRemindersMutationVariables
>;
export const PetitionReplies_repliesDocument = gql`
  query PetitionReplies_replies($petitionId: GID!) {
    petition(id: $petitionId) {
      fields {
        ...PetitionFieldWithReplies
      }
    }
  }
  ${PetitionFieldWithRepliesFragmentDoc}
` as unknown as DocumentNode<PetitionReplies_repliesQuery, PetitionReplies_repliesQueryVariables>;
export const UpdatePetitionField_updatePetitionFieldDocument = gql`
  mutation UpdatePetitionField_updatePetitionField(
    $petitionId: GID!
    $fieldId: GID!
    $title: String
    $description: String
    $options: JSONObject
  ) {
    updatePetitionField(
      petitionId: $petitionId
      fieldId: $fieldId
      data: { title: $title, description: $description, options: $options }
    ) {
      ...PetitionField
    }
  }
  ${PetitionFieldFragmentDoc}
` as unknown as DocumentNode<
  UpdatePetitionField_updatePetitionFieldMutation,
  UpdatePetitionField_updatePetitionFieldMutationVariables
>;
export const GetPetitionFieldComments_petitionDocument = gql`
  query GetPetitionFieldComments_petition($id: GID!) {
    petition(id: $id) {
      fields {
        id
        fromPetitionFieldId
      }
    }
  }
` as unknown as DocumentNode<
  GetPetitionFieldComments_petitionQuery,
  GetPetitionFieldComments_petitionQueryVariables
>;
export const GetPetitionFieldComments_petitionFieldCommentsDocument = gql`
  query GetPetitionFieldComments_petitionFieldComments($petitionId: GID!, $fieldId: GID!) {
    petitionField(petitionId: $petitionId, petitionFieldId: $fieldId) {
      comments {
        ...PetitionFieldComment
      }
    }
  }
  ${PetitionFieldCommentFragmentDoc}
` as unknown as DocumentNode<
  GetPetitionFieldComments_petitionFieldCommentsQuery,
  GetPetitionFieldComments_petitionFieldCommentsQueryVariables
>;
export const SendPetitionFieldComment_petitionDocument = gql`
  query SendPetitionFieldComment_petition($id: GID!) {
    petition(id: $id) {
      fields {
        id
        fromPetitionFieldId
      }
    }
  }
` as unknown as DocumentNode<
  SendPetitionFieldComment_petitionQuery,
  SendPetitionFieldComment_petitionQueryVariables
>;
export const SendPetitionFieldComment_createPetitionCommentDocument = gql`
  mutation SendPetitionFieldComment_createPetitionComment(
    $petitionId: GID!
    $petitionFieldId: GID
    $content: JSON!
    $isInternal: Boolean!
    $sharePetition: Boolean
    $sharePetitionPermission: PetitionPermissionTypeRW
    $sharePetitionSubscribed: Boolean
  ) {
    createPetitionComment(
      petitionId: $petitionId
      petitionFieldId: $petitionFieldId
      content: $content
      isInternal: $isInternal
      sharePetition: $sharePetition
      sharePetitionPermission: $sharePetitionPermission
      sharePetitionSubscribed: $sharePetitionSubscribed
      throwOnNoPermission: false
    ) {
      ...PetitionFieldComment
    }
  }
  ${PetitionFieldCommentFragmentDoc}
` as unknown as DocumentNode<
  SendPetitionFieldComment_createPetitionCommentMutation,
  SendPetitionFieldComment_createPetitionCommentMutationVariables
>;
export const GetPetitionComments_petitionCommentsDocument = gql`
  query GetPetitionComments_petitionComments($petitionId: GID!) {
    petition(id: $petitionId) {
      ... on Petition {
        generalComments {
          ...PetitionFieldComment
        }
      }
      __typename
    }
  }
  ${PetitionFieldCommentFragmentDoc}
` as unknown as DocumentNode<
  GetPetitionComments_petitionCommentsQuery,
  GetPetitionComments_petitionCommentsQueryVariables
>;
export const SendPetitionComment_createPetitionCommentDocument = gql`
  mutation SendPetitionComment_createPetitionComment(
    $petitionId: GID!
    $content: JSON!
    $isInternal: Boolean!
    $sharePetition: Boolean
    $sharePetitionPermission: PetitionPermissionTypeRW
    $sharePetitionSubscribed: Boolean
  ) {
    createPetitionComment(
      petitionId: $petitionId
      content: $content
      isInternal: $isInternal
      sharePetition: $sharePetition
      sharePetitionPermission: $sharePetitionPermission
      sharePetitionSubscribed: $sharePetitionSubscribed
      throwOnNoPermission: false
    ) {
      ...PetitionFieldComment
    }
  }
  ${PetitionFieldCommentFragmentDoc}
` as unknown as DocumentNode<
  SendPetitionComment_createPetitionCommentMutation,
  SendPetitionComment_createPetitionCommentMutationVariables
>;
export const DeleteReply_deletePetitionReplyDocument = gql`
  mutation DeleteReply_deletePetitionReply($petitionId: GID!, $replyId: GID!) {
    deletePetitionReply(petitionId: $petitionId, replyId: $replyId) {
      id
    }
  }
` as unknown as DocumentNode<
  DeleteReply_deletePetitionReplyMutation,
  DeleteReply_deletePetitionReplyMutationVariables
>;
export const DownloadFileReply_fileUploadReplyDownloadLinkDocument = gql`
  mutation DownloadFileReply_fileUploadReplyDownloadLink($petitionId: GID!, $replyId: GID!) {
    fileUploadReplyDownloadLink(petitionId: $petitionId, replyId: $replyId) {
      url
    }
  }
` as unknown as DocumentNode<
  DownloadFileReply_fileUploadReplyDownloadLinkMutation,
  DownloadFileReply_fileUploadReplyDownloadLinkMutationVariables
>;
export const ExportPetitionReplies_createExportRepliesTaskDocument = gql`
  mutation ExportPetitionReplies_createExportRepliesTask(
    $petitionId: GID!
    $pattern: String
    $callbackUrl: String
  ) {
    createExportRepliesTask(petitionId: $petitionId, pattern: $pattern, callbackUrl: $callbackUrl) {
      ...Task
    }
  }
  ${TaskFragmentDoc}
` as unknown as DocumentNode<
  ExportPetitionReplies_createExportRepliesTaskMutation,
  ExportPetitionReplies_createExportRepliesTaskMutationVariables
>;
export const ExportPetitionReplies_createPrintPdfTaskDocument = gql`
  mutation ExportPetitionReplies_createPrintPdfTask($petitionId: GID!, $callbackUrl: String) {
    createPrintPdfTask(petitionId: $petitionId, callbackUrl: $callbackUrl) {
      ...Task
    }
  }
  ${TaskFragmentDoc}
` as unknown as DocumentNode<
  ExportPetitionReplies_createPrintPdfTaskMutation,
  ExportPetitionReplies_createPrintPdfTaskMutationVariables
>;
export const ExportPetitionReplies_createExportExcelTaskDocument = gql`
  mutation ExportPetitionReplies_createExportExcelTask($petitionId: GID!, $callbackUrl: String) {
    createExportExcelTask(
      petitionId: $petitionId
      callbackUrl: $callbackUrl
      exportEmptyFile: true
    ) {
      ...Task
    }
  }
  ${TaskFragmentDoc}
` as unknown as DocumentNode<
  ExportPetitionReplies_createExportExcelTaskMutation,
  ExportPetitionReplies_createExportExcelTaskMutationVariables
>;
export const GetPermissions_permissionsDocument = gql`
  query GetPermissions_permissions($petitionId: GID!) {
    petition(id: $petitionId) {
      permissions {
        ...Permission
      }
    }
  }
  ${PermissionFragmentDoc}
` as unknown as DocumentNode<
  GetPermissions_permissionsQuery,
  GetPermissions_permissionsQueryVariables
>;
export const SharePetition_usersByEmailDocument = gql`
  query SharePetition_usersByEmail($emails: [String!]!) {
    me {
      organization {
        usersByEmail(limit: 100, offset: 0, emails: $emails) {
          items {
            id
            email
          }
        }
      }
    }
  }
` as unknown as DocumentNode<
  SharePetition_usersByEmailQuery,
  SharePetition_usersByEmailQueryVariables
>;
export const SharePetition_createAddPetitionPermissionMaybeTaskDocument = gql`
  mutation SharePetition_createAddPetitionPermissionMaybeTask(
    $petitionId: GID!
    $userIds: [GID!]
    $userGroupIds: [GID!]
  ) {
    createAddPetitionPermissionMaybeTask(
      petitionIds: [$petitionId]
      userIds: $userIds
      userGroupIds: $userGroupIds
      permissionType: WRITE
    ) {
      status
      task {
        ...Task
      }
    }
  }
  ${TaskFragmentDoc}
` as unknown as DocumentNode<
  SharePetition_createAddPetitionPermissionMaybeTaskMutation,
  SharePetition_createAddPetitionPermissionMaybeTaskMutationVariables
>;
export const SharePetition_petitionDocument = gql`
  query SharePetition_petition($id: GID!) {
    petition(id: $id) {
      permissions {
        ...Permission
      }
    }
  }
  ${PermissionFragmentDoc}
` as unknown as DocumentNode<SharePetition_petitionQuery, SharePetition_petitionQueryVariables>;
export const StopSharing_createRemovePetitionPermissionMaybeTaskDocument = gql`
  mutation StopSharing_createRemovePetitionPermissionMaybeTask($petitionId: GID!) {
    createRemovePetitionPermissionMaybeTask(petitionIds: [$petitionId], removeAll: true) {
      status
      task {
        ...Task
      }
    }
  }
  ${TaskFragmentDoc}
` as unknown as DocumentNode<
  StopSharing_createRemovePetitionPermissionMaybeTaskMutation,
  StopSharing_createRemovePetitionPermissionMaybeTaskMutationVariables
>;
export const RemoveUserPermission_createRemovePetitionPermissionMaybeTaskDocument = gql`
  mutation RemoveUserPermission_createRemovePetitionPermissionMaybeTask(
    $petitionId: GID!
    $userId: GID!
  ) {
    createRemovePetitionPermissionMaybeTask(petitionIds: [$petitionId], userIds: [$userId]) {
      status
      task {
        ...Task
      }
    }
  }
  ${TaskFragmentDoc}
` as unknown as DocumentNode<
  RemoveUserPermission_createRemovePetitionPermissionMaybeTaskMutation,
  RemoveUserPermission_createRemovePetitionPermissionMaybeTaskMutationVariables
>;
export const RemoveUserGroupPermission_createRemovePetitionPermissionMaybeTaskDocument = gql`
  mutation RemoveUserGroupPermission_createRemovePetitionPermissionMaybeTask(
    $petitionId: GID!
    $userGroupId: GID!
  ) {
    createRemovePetitionPermissionMaybeTask(
      petitionIds: [$petitionId]
      userGroupIds: [$userGroupId]
    ) {
      status
      task {
        ...Task
      }
    }
  }
  ${TaskFragmentDoc}
` as unknown as DocumentNode<
  RemoveUserGroupPermission_createRemovePetitionPermissionMaybeTaskMutation,
  RemoveUserGroupPermission_createRemovePetitionPermissionMaybeTaskMutationVariables
>;
export const TransferPetition_searchUserByEmailDocument = gql`
  query TransferPetition_searchUserByEmail($search: String) {
    me {
      organization {
        users(limit: 1, offset: 0, search: $search) {
          items {
            id
            email
          }
        }
      }
    }
  }
` as unknown as DocumentNode<
  TransferPetition_searchUserByEmailQuery,
  TransferPetition_searchUserByEmailQueryVariables
>;
export const TransferPetition_transferPetitionOwnershipDocument = gql`
  mutation TransferPetition_transferPetitionOwnership($userId: GID!, $petitionId: GID!) {
    transferPetitionOwnership(petitionIds: [$petitionId], userId: $userId) {
      permissions {
        ...Permission
      }
    }
  }
  ${PermissionFragmentDoc}
` as unknown as DocumentNode<
  TransferPetition_transferPetitionOwnershipMutation,
  TransferPetition_transferPetitionOwnershipMutationVariables
>;
export const GetSignatures_petitionSignaturesDocument = gql`
  query GetSignatures_petitionSignatures($petitionId: GID!) {
    petition(id: $petitionId) {
      __typename
      ... on Petition {
        signatureRequests {
          ...PetitionSignatureRequest
        }
      }
    }
  }
  ${PetitionSignatureRequestFragmentDoc}
` as unknown as DocumentNode<
  GetSignatures_petitionSignaturesQuery,
  GetSignatures_petitionSignaturesQueryVariables
>;
export const StartSignature_createCustomSignatureDocumentUploadLinkDocument = gql`
  mutation StartSignature_createCustomSignatureDocumentUploadLink(
    $petitionId: GID!
    $file: FileUploadInput!
  ) {
    createCustomSignatureDocumentUploadLink(petitionId: $petitionId, file: $file)
  }
` as unknown as DocumentNode<
  StartSignature_createCustomSignatureDocumentUploadLinkMutation,
  StartSignature_createCustomSignatureDocumentUploadLinkMutationVariables
>;
export const StartSignature_startSignatureRequestDocument = gql`
  mutation StartSignature_startSignatureRequest(
    $petitionId: GID!
    $message: String
    $customDocumentTemporaryFileId: GID
  ) {
    startSignatureRequest(
      petitionId: $petitionId
      message: $message
      customDocumentTemporaryFileId: $customDocumentTemporaryFileId
    ) {
      ...PetitionSignatureRequest
    }
  }
  ${PetitionSignatureRequestFragmentDoc}
` as unknown as DocumentNode<
  StartSignature_startSignatureRequestMutation,
  StartSignature_startSignatureRequestMutationVariables
>;
export const DownloadSignedDocument_downloadSignedDocDocument = gql`
  mutation DownloadSignedDocument_downloadSignedDoc($signatureId: GID!) {
    signedPetitionDownloadLink(petitionSignatureRequestId: $signatureId) {
      result
      url
    }
  }
` as unknown as DocumentNode<
  DownloadSignedDocument_downloadSignedDocMutation,
  DownloadSignedDocument_downloadSignedDocMutationVariables
>;
export const DownloadSignedDocument_downloadAuditTrailDocument = gql`
  mutation DownloadSignedDocument_downloadAuditTrail($signatureId: GID!) {
    signedPetitionDownloadLink(petitionSignatureRequestId: $signatureId, downloadAuditTrail: true) {
      result
      url
    }
  }
` as unknown as DocumentNode<
  DownloadSignedDocument_downloadAuditTrailMutation,
  DownloadSignedDocument_downloadAuditTrailMutationVariables
>;
export const GetPetitionProfiles_petitionDocument = gql`
  query GetPetitionProfiles_petition(
    $petitionId: GID!
    $includeFieldOptions: Boolean!
    $includeRelationships: Boolean!
    $includeSubscribers: Boolean!
  ) {
    petition(id: $petitionId) {
      __typename
      ... on Petition {
        profiles {
          ...Profile
        }
      }
    }
  }
  ${ProfileFragmentDoc}
` as unknown as DocumentNode<
  GetPetitionProfiles_petitionQuery,
  GetPetitionProfiles_petitionQueryVariables
>;
export const AssociatePetitionToProfile_associateProfileToPetitionDocument = gql`
  mutation AssociatePetitionToProfile_associateProfileToPetition(
    $profileId: GID!
    $petitionId: GID!
    $includeFieldOptions: Boolean!
    $includeRelationships: Boolean!
    $includeSubscribers: Boolean!
  ) {
    associateProfileToPetition(profileId: $profileId, petitionId: $petitionId) {
      profile {
        ...Profile
      }
    }
  }
  ${ProfileFragmentDoc}
` as unknown as DocumentNode<
  AssociatePetitionToProfile_associateProfileToPetitionMutation,
  AssociatePetitionToProfile_associateProfileToPetitionMutationVariables
>;
export const DisassociateProfileFromPetition_disassociateProfilesFromPetitionsDocument = gql`
  mutation DisassociateProfileFromPetition_disassociateProfilesFromPetitions(
    $petitionIds: [GID!]!
    $profileIds: [GID!]!
  ) {
    disassociateProfilesFromPetitions(profileIds: $profileIds, petitionIds: $petitionIds)
  }
` as unknown as DocumentNode<
  DisassociateProfileFromPetition_disassociateProfilesFromPetitionsMutation,
  DisassociateProfileFromPetition_disassociateProfilesFromPetitionsMutationVariables
>;
export const GetTemplates_templatesDocument = gql`
  query GetTemplates_templates(
    $offset: Int!
    $limit: Int!
    $tags: PetitionTagFilter
    $sortBy: [QueryPetitions_OrderBy!]
    $includeFields: Boolean!
    $includeTags: Boolean!
  ) {
    templates: petitions(
      offset: $offset
      limit: $limit
      sortBy: $sortBy
      filters: { type: TEMPLATE, tags: $tags }
    ) {
      items {
        ...Template
      }
      totalCount
    }
  }
  ${TemplateFragmentDoc}
` as unknown as DocumentNode<GetTemplates_templatesQuery, GetTemplates_templatesQueryVariables>;
export const GetTemplate_templateDocument = gql`
  query GetTemplate_template($templateId: GID!, $includeFields: Boolean!, $includeTags: Boolean!) {
    template: petition(id: $templateId) {
      ...Template
    }
  }
  ${TemplateFragmentDoc}
` as unknown as DocumentNode<GetTemplate_templateQuery, GetTemplate_templateQueryVariables>;
export const DeleteTemplate_deletePetitionsDocument = gql`
  mutation DeleteTemplate_deletePetitions($templateId: GID!, $force: Boolean!) {
    deletePetitions(ids: [$templateId], force: $force)
  }
` as unknown as DocumentNode<
  DeleteTemplate_deletePetitionsMutation,
  DeleteTemplate_deletePetitionsMutationVariables
>;
export const GetContacts_contactsDocument = gql`
  query GetContacts_contacts($offset: Int!, $limit: Int!, $sortBy: [QueryContacts_OrderBy!]) {
    contacts(offset: $offset, limit: $limit, sortBy: $sortBy) {
      items {
        ...Contact
      }
      totalCount
    }
  }
  ${ContactFragmentDoc}
` as unknown as DocumentNode<GetContacts_contactsQuery, GetContacts_contactsQueryVariables>;
export const CreateContact_contactDocument = gql`
  mutation CreateContact_contact($data: CreateContactInput!) {
    createContact(data: $data) {
      ...Contact
    }
  }
  ${ContactFragmentDoc}
` as unknown as DocumentNode<CreateContact_contactMutation, CreateContact_contactMutationVariables>;
export const GetContact_contactDocument = gql`
  query GetContact_contact($contactId: GID!) {
    contact(id: $contactId) {
      ...Contact
    }
  }
  ${ContactFragmentDoc}
` as unknown as DocumentNode<GetContact_contactQuery, GetContact_contactQueryVariables>;
export const GetOrganizationUsers_usersDocument = gql`
  query GetOrganizationUsers_users(
    $offset: Int!
    $limit: Int!
    $sortBy: [OrganizationUsers_OrderBy!]
  ) {
    me {
      organization {
        users(limit: $limit, offset: $offset, sortBy: $sortBy) {
          totalCount
          items {
            ...User
          }
        }
      }
    }
  }
  ${UserFragmentDoc}
` as unknown as DocumentNode<
  GetOrganizationUsers_usersQuery,
  GetOrganizationUsers_usersQueryVariables
>;
export const EventSubscriptions_getSubscriptionsDocument = gql`
  query EventSubscriptions_getSubscriptions {
    subscriptions {
      ...EventSubscription
    }
  }
  ${EventSubscriptionFragmentDoc}
` as unknown as DocumentNode<
  EventSubscriptions_getSubscriptionsQuery,
  EventSubscriptions_getSubscriptionsQueryVariables
>;
export const EventSubscriptions_createPetitionEventSubscriptionDocument = gql`
  mutation EventSubscriptions_createPetitionEventSubscription(
    $eventsUrl: String!
    $eventTypes: [PetitionEventType!]
    $name: String
    $fromTemplateId: GID
    $challenge: Boolean
  ) {
    createPetitionEventSubscription(
      eventsUrl: $eventsUrl
      eventTypes: $eventTypes
      name: $name
      fromTemplateId: $fromTemplateId
      challenge: $challenge
    ) {
      ...PetitionEventSubscription
    }
  }
  ${PetitionEventSubscriptionFragmentDoc}
` as unknown as DocumentNode<
  EventSubscriptions_createPetitionEventSubscriptionMutation,
  EventSubscriptions_createPetitionEventSubscriptionMutationVariables
>;
export const EventSubscriptions_createProfileEventSubscriptionDocument = gql`
  mutation EventSubscriptions_createProfileEventSubscription(
    $eventsUrl: String!
    $eventTypes: [ProfileEventType!]
    $name: String
    $fromProfileTypeId: GID
    $challenge: Boolean
  ) {
    createProfileEventSubscription(
      eventsUrl: $eventsUrl
      eventTypes: $eventTypes
      name: $name
      fromProfileTypeId: $fromProfileTypeId
      challenge: $challenge
    ) {
      ...ProfileEventSubscription
    }
  }
  ${ProfileEventSubscriptionFragmentDoc}
` as unknown as DocumentNode<
  EventSubscriptions_createProfileEventSubscriptionMutation,
  EventSubscriptions_createProfileEventSubscriptionMutationVariables
>;
export const EventSubscriptions_deleteSubscriptionDocument = gql`
  mutation EventSubscriptions_deleteSubscription($ids: [GID!]!) {
    deleteEventSubscriptions(ids: $ids)
  }
` as unknown as DocumentNode<
  EventSubscriptions_deleteSubscriptionMutation,
  EventSubscriptions_deleteSubscriptionMutationVariables
>;
export const GetPetitionEvents_PetitionEventsDocument = gql`
  query GetPetitionEvents_PetitionEvents($before: GID, $eventTypes: [PetitionEventType!]) {
    petitionEvents(before: $before, eventTypes: $eventTypes) {
      id
      data
      petition {
        id
        type
        myEffectivePermission {
          permissionType
        }
      }
      type
      createdAt
    }
  }
` as unknown as DocumentNode<
  GetPetitionEvents_PetitionEventsQuery,
  GetPetitionEvents_PetitionEventsQueryVariables
>;
export const GetProfileEvents_ProfileEventsDocument = gql`
  query GetProfileEvents_ProfileEvents($before: GID, $eventTypes: [ProfileEventType!]) {
    profileEvents(before: $before, eventTypes: $eventTypes) {
      id
      data
      profile {
        id
      }
      type
      createdAt
    }
  }
` as unknown as DocumentNode<
  GetProfileEvents_ProfileEventsQuery,
  GetProfileEvents_ProfileEventsQueryVariables
>;
export const GetProfiles_profilesDocument = gql`
  query GetProfiles_profiles(
    $offset: Int
    $limit: Int
    $sortBy: [QueryProfiles_OrderBy!]
    $search: String
    $profileTypeIds: [GID!]
    $status: [ProfileStatus!]
    $values: ProfileFieldValuesFilter
    $includeFieldOptions: Boolean!
    $includeRelationships: Boolean!
    $includeSubscribers: Boolean!
  ) {
    profiles(
      offset: $offset
      limit: $limit
      sortBy: $sortBy
      search: $search
      filter: { profileTypeId: $profileTypeIds, status: $status, values: $values }
    ) {
      totalCount
      items {
        ...Profile
      }
    }
  }
  ${ProfileFragmentDoc}
` as unknown as DocumentNode<GetProfiles_profilesQuery, GetProfiles_profilesQueryVariables>;
export const GetProfiles_profileTypeDocument = gql`
  query GetProfiles_profileType($profileTypeId: GID!) {
    profileType(profileTypeId: $profileTypeId) {
      fields {
        id
        alias
      }
    }
  }
` as unknown as DocumentNode<GetProfiles_profileTypeQuery, GetProfiles_profileTypeQueryVariables>;
export const CreateProfile_profileTypeDocument = gql`
  query CreateProfile_profileType($profileTypeId: GID!) {
    profileType(profileTypeId: $profileTypeId) {
      fields {
        id
        type
        alias
        isExpirable
      }
    }
  }
` as unknown as DocumentNode<
  CreateProfile_profileTypeQuery,
  CreateProfile_profileTypeQueryVariables
>;
export const CreateProfile_createProfileDocument = gql`
  mutation CreateProfile_createProfile(
    $profileTypeId: GID!
    $subscribe: Boolean
    $fields: [UpdateProfileFieldValueInput!]
    $includeFieldOptions: Boolean!
    $includeRelationships: Boolean!
    $includeSubscribers: Boolean!
  ) {
    createProfile(profileTypeId: $profileTypeId, subscribe: $subscribe, fields: $fields) {
      ...Profile
    }
  }
  ${ProfileFragmentDoc}
` as unknown as DocumentNode<
  CreateProfile_createProfileMutation,
  CreateProfile_createProfileMutationVariables
>;
export const CreateProfile_createProfileFieldFileUploadLinkDocument = gql`
  mutation CreateProfile_createProfileFieldFileUploadLink(
    $profileId: GID!
    $profileTypeFieldId: GID!
    $expiryDate: Date
    $data: [FileUploadInput!]!
  ) {
    createProfileFieldFileUploadLink(
      profileId: $profileId
      profileTypeFieldId: $profileTypeFieldId
      expiryDate: $expiryDate
      data: $data
    ) {
      uploads {
        file {
          id
        }
        presignedPostData {
          url
          fields
        }
      }
    }
  }
` as unknown as DocumentNode<
  CreateProfile_createProfileFieldFileUploadLinkMutation,
  CreateProfile_createProfileFieldFileUploadLinkMutationVariables
>;
export const CreateProfile_profileFieldFileUploadCompleteDocument = gql`
  mutation CreateProfile_profileFieldFileUploadComplete(
    $profileId: GID!
    $profileTypeFieldId: GID!
    $profileFieldFileIds: [GID!]!
    $includeFieldOptions: Boolean!
    $includeRelationships: Boolean!
    $includeSubscribers: Boolean!
  ) {
    profileFieldFileUploadComplete(
      profileId: $profileId
      profileTypeFieldId: $profileTypeFieldId
      profileFieldFileIds: $profileFieldFileIds
    ) {
      profile {
        ...Profile
      }
    }
  }
  ${ProfileFragmentDoc}
` as unknown as DocumentNode<
  CreateProfile_profileFieldFileUploadCompleteMutation,
  CreateProfile_profileFieldFileUploadCompleteMutationVariables
>;
export const GetProfile_profileDocument = gql`
  query GetProfile_profile(
    $profileId: GID!
    $includeFieldOptions: Boolean!
    $includeRelationships: Boolean!
    $includeSubscribers: Boolean!
  ) {
    profile(profileId: $profileId) {
      ...Profile
    }
  }
  ${ProfileFragmentDoc}
` as unknown as DocumentNode<GetProfile_profileQuery, GetProfile_profileQueryVariables>;
export const UpdateProfileFieldValue_profileDocument = gql`
  query UpdateProfileFieldValue_profile(
    $profileId: GID!
    $includeFieldOptions: Boolean!
    $includeRelationships: Boolean!
    $includeSubscribers: Boolean!
  ) {
    profile(profileId: $profileId) {
      ...Profile
    }
  }
  ${ProfileFragmentDoc}
` as unknown as DocumentNode<
  UpdateProfileFieldValue_profileQuery,
  UpdateProfileFieldValue_profileQueryVariables
>;
export const UpdateProfileFieldValue_updateProfileFieldValueDocument = gql`
  mutation UpdateProfileFieldValue_updateProfileFieldValue(
    $profileId: GID!
    $fields: [UpdateProfileFieldValueInput!]!
  ) {
    updateProfileFieldValue(profileId: $profileId, fields: $fields) {
      id
    }
  }
` as unknown as DocumentNode<
  UpdateProfileFieldValue_updateProfileFieldValueMutation,
  UpdateProfileFieldValue_updateProfileFieldValueMutationVariables
>;
export const UpdateProfileFieldValue_createProfileFieldFileUploadLinkDocument = gql`
  mutation UpdateProfileFieldValue_createProfileFieldFileUploadLink(
    $profileId: GID!
    $profileTypeFieldId: GID!
    $data: [FileUploadInput!]!
    $expiryDate: Date
  ) {
    createProfileFieldFileUploadLink(
      profileId: $profileId
      profileTypeFieldId: $profileTypeFieldId
      data: $data
      expiryDate: $expiryDate
    ) {
      uploads {
        file {
          id
        }
        presignedPostData {
          fields
          url
        }
      }
    }
  }
` as unknown as DocumentNode<
  UpdateProfileFieldValue_createProfileFieldFileUploadLinkMutation,
  UpdateProfileFieldValue_createProfileFieldFileUploadLinkMutationVariables
>;
export const UpdateProfileFieldValue_profileFieldFileUploadCompleteDocument = gql`
  mutation UpdateProfileFieldValue_profileFieldFileUploadComplete(
    $profileId: GID!
    $profileTypeFieldId: GID!
    $profileFieldFileIds: [GID!]!
  ) {
    profileFieldFileUploadComplete(
      profileId: $profileId
      profileTypeFieldId: $profileTypeFieldId
      profileFieldFileIds: $profileFieldFileIds
    ) {
      id
    }
  }
` as unknown as DocumentNode<
  UpdateProfileFieldValue_profileFieldFileUploadCompleteMutation,
  UpdateProfileFieldValue_profileFieldFileUploadCompleteMutationVariables
>;
export const UpdateProfileFieldValue_deleteProfileFieldFileDocument = gql`
  mutation UpdateProfileFieldValue_deleteProfileFieldFile(
    $profileId: GID!
    $profileTypeFieldId: GID!
  ) {
    deleteProfileFieldFile(profileId: $profileId, profileTypeFieldId: $profileTypeFieldId)
  }
` as unknown as DocumentNode<
  UpdateProfileFieldValue_deleteProfileFieldFileMutation,
  UpdateProfileFieldValue_deleteProfileFieldFileMutationVariables
>;
export const DownloadProfileFieldFile_profileDocument = gql`
  query DownloadProfileFieldFile_profile($profileId: GID!) {
    profile(profileId: $profileId) {
      properties {
        field {
          id
          type
          alias
        }
        files {
          id
        }
      }
    }
  }
` as unknown as DocumentNode<
  DownloadProfileFieldFile_profileQuery,
  DownloadProfileFieldFile_profileQueryVariables
>;
export const DownloadProfileFieldFile_profileFieldFileDownloadLinkDocument = gql`
  mutation DownloadProfileFieldFile_profileFieldFileDownloadLink(
    $profileId: GID!
    $profileTypeFieldId: GID!
    $profileFieldFileId: GID!
  ) {
    profileFieldFileDownloadLink(
      profileId: $profileId
      profileTypeFieldId: $profileTypeFieldId
      profileFieldFileId: $profileFieldFileId
    ) {
      url
    }
  }
` as unknown as DocumentNode<
  DownloadProfileFieldFile_profileFieldFileDownloadLinkMutation,
  DownloadProfileFieldFile_profileFieldFileDownloadLinkMutationVariables
>;
export const GetProfileRelationships_profileDocument = gql`
  query GetProfileRelationships_profile($profileId: GID!) {
    profile(profileId: $profileId) {
      id
      relationships {
        ...ProfileRelationship
      }
    }
  }
  ${ProfileRelationshipFragmentDoc}
` as unknown as DocumentNode<
  GetProfileRelationships_profileQuery,
  GetProfileRelationships_profileQueryVariables
>;
export const CreateProfileRelationship_profileRelationshipTypesDocument = gql`
  query CreateProfileRelationship_profileRelationshipTypes {
    profileRelationshipTypes {
      id
      alias
    }
  }
` as unknown as DocumentNode<
  CreateProfileRelationship_profileRelationshipTypesQuery,
  CreateProfileRelationship_profileRelationshipTypesQueryVariables
>;
export const CreateProfileRelationship_createProfileRelationshipDocument = gql`
  mutation CreateProfileRelationship_createProfileRelationship(
    $profileId: GID!
    $relationships: [CreateProfileRelationshipInput!]!
  ) {
    createProfileRelationship(profileId: $profileId, relationships: $relationships) {
      id
      relationships {
        ...ProfileRelationship
      }
    }
  }
  ${ProfileRelationshipFragmentDoc}
` as unknown as DocumentNode<
  CreateProfileRelationship_createProfileRelationshipMutation,
  CreateProfileRelationship_createProfileRelationshipMutationVariables
>;
export const DeleteProfileRelationship_removeProfileRelationshipDocument = gql`
  mutation DeleteProfileRelationship_removeProfileRelationship(
    $profileId: GID!
    $profileRelationshipId: GID!
  ) {
    removeProfileRelationship(
      profileId: $profileId
      profileRelationshipIds: [$profileRelationshipId]
    )
  }
` as unknown as DocumentNode<
  DeleteProfileRelationship_removeProfileRelationshipMutation,
  DeleteProfileRelationship_removeProfileRelationshipMutationVariables
>;
export const GetProfileSubscribers_profileDocument = gql`
  query GetProfileSubscribers_profile($profileId: GID!) {
    profile(profileId: $profileId) {
      subscribers {
        user {
          ...User
        }
      }
    }
  }
  ${UserFragmentDoc}
` as unknown as DocumentNode<
  GetProfileSubscribers_profileQuery,
  GetProfileSubscribers_profileQueryVariables
>;
export const SubscribeToProfile_subscribeToProfileDocument = gql`
  mutation SubscribeToProfile_subscribeToProfile(
    $profileId: GID!
    $userIds: [GID!]!
    $includeFieldOptions: Boolean!
    $includeRelationships: Boolean!
    $includeSubscribers: Boolean!
  ) {
    subscribeToProfile(profileIds: [$profileId], userIds: $userIds) {
      ...Profile
    }
  }
  ${ProfileFragmentDoc}
` as unknown as DocumentNode<
  SubscribeToProfile_subscribeToProfileMutation,
  SubscribeToProfile_subscribeToProfileMutationVariables
>;
export const UnsubscribeFromProfile_unsubscribeFromProfileDocument = gql`
  mutation UnsubscribeFromProfile_unsubscribeFromProfile(
    $profileId: GID!
    $userIds: [GID!]!
    $includeFieldOptions: Boolean!
    $includeRelationships: Boolean!
    $includeSubscribers: Boolean!
  ) {
    unsubscribeFromProfile(profileIds: [$profileId], userIds: $userIds) {
      ...Profile
    }
  }
  ${ProfileFragmentDoc}
` as unknown as DocumentNode<
  UnsubscribeFromProfile_unsubscribeFromProfileMutation,
  UnsubscribeFromProfile_unsubscribeFromProfileMutationVariables
>;
export const GetProfileTypes_profileTypesDocument = gql`
  query GetProfileTypes_profileTypes(
    $offset: Int
    $limit: Int
    $includeFields: Boolean!
    $includeFieldOptions: Boolean!
  ) {
    profileTypes(offset: $offset, limit: $limit) {
      totalCount
      items {
        ...ProfileType
      }
    }
  }
  ${ProfileTypeFragmentDoc}
` as unknown as DocumentNode<
  GetProfileTypes_profileTypesQuery,
  GetProfileTypes_profileTypesQueryVariables
>;
export const GetProfileType_profileTypeDocument = gql`
  query GetProfileType_profileType(
    $profileTypeId: GID!
    $includeFields: Boolean!
    $includeFieldOptions: Boolean!
  ) {
    profileType(profileTypeId: $profileTypeId) {
      ...ProfileType
    }
  }
  ${ProfileTypeFragmentDoc}
` as unknown as DocumentNode<
  GetProfileType_profileTypeQuery,
  GetProfileType_profileTypeQueryVariables
>;
export const BulkSendTemplate_createBulkPetitionSendTaskDocument = gql`
  mutation BulkSendTemplate_createBulkPetitionSendTask($templateId: GID!, $temporaryFileId: GID!) {
    createBulkPetitionSendTask(templateId: $templateId, temporaryFileId: $temporaryFileId) {
      ...Task
    }
  }
  ${TaskFragmentDoc}
` as unknown as DocumentNode<
  BulkSendTemplate_createBulkPetitionSendTaskMutation,
  BulkSendTemplate_createBulkPetitionSendTaskMutationVariables
>;
export const BulkSendTemplate_uploadBulkPetitionSendTaskInputFileDocument = gql`
  mutation BulkSendTemplate_uploadBulkPetitionSendTaskInputFile($file: FileUploadInput!) {
    uploadBulkPetitionSendTaskInputFile(file: $file)
  }
` as unknown as DocumentNode<
  BulkSendTemplate_uploadBulkPetitionSendTaskInputFileMutation,
  BulkSendTemplate_uploadBulkPetitionSendTaskInputFileMutationVariables
>;
export const ExportTemplate_createTemplateRepliesCsvExportTaskDocument = gql`
  mutation ExportTemplate_createTemplateRepliesCsvExportTask($templateId: GID!) {
    createTemplateRepliesCsvExportTask(templateId: $templateId) {
      ...Task
    }
  }
  ${TaskFragmentDoc}
` as unknown as DocumentNode<
  ExportTemplate_createTemplateRepliesCsvExportTaskMutation,
  ExportTemplate_createTemplateRepliesCsvExportTaskMutationVariables
>;
export const Task_TaskStatusDocument = gql`
  query Task_TaskStatus($taskId: GID!) {
    task(id: $taskId) {
      id
      name
      progress
      status
      output
    }
  }
` as unknown as DocumentNode<Task_TaskStatusQuery, Task_TaskStatusQueryVariables>;
export const Task_getTaskResultFileDocument = gql`
  mutation Task_getTaskResultFile($taskId: GID!, $preview: Boolean) {
    getTaskResultFile(taskId: $taskId, preview: $preview) {
      url
    }
  }
` as unknown as DocumentNode<
  Task_getTaskResultFileMutation,
  Task_getTaskResultFileMutationVariables
>;
export const SubmitReply_createPetitionFieldRepliesDocument = gql`
  mutation SubmitReply_createPetitionFieldReplies(
    $petitionId: GID!
    $fields: [CreatePetitionFieldReplyInput!]!
  ) {
    createPetitionFieldReplies(petitionId: $petitionId, fields: $fields) {
      ...PetitionFieldReply
    }
  }
  ${PetitionFieldReplyFragmentDoc}
` as unknown as DocumentNode<
  SubmitReply_createPetitionFieldRepliesMutation,
  SubmitReply_createPetitionFieldRepliesMutationVariables
>;
export const SubmitReply_createFileUploadReplyDocument = gql`
  mutation SubmitReply_createFileUploadReply(
    $petitionId: GID!
    $fieldId: GID!
    $parentReplyId: GID
    $file: FileUploadInput!
    $password: String
  ) {
    createFileUploadReply(
      petitionId: $petitionId
      fieldId: $fieldId
      parentReplyId: $parentReplyId
      file: $file
      password: $password
    ) {
      presignedPostData {
        ...AWSPresignedPostData
      }
      reply {
        ...PetitionFieldReply
      }
    }
  }
  ${AWSPresignedPostDataFragmentDoc}
  ${PetitionFieldReplyFragmentDoc}
` as unknown as DocumentNode<
  SubmitReply_createFileUploadReplyMutation,
  SubmitReply_createFileUploadReplyMutationVariables
>;
export const SubmitReply_createFileUploadReplyCompleteDocument = gql`
  mutation SubmitReply_createFileUploadReplyComplete($petitionId: GID!, $replyId: GID!) {
    createFileUploadReplyComplete(petitionId: $petitionId, replyId: $replyId) {
      ...PetitionFieldReply
    }
  }
  ${PetitionFieldReplyFragmentDoc}
` as unknown as DocumentNode<
  SubmitReply_createFileUploadReplyCompleteMutation,
  SubmitReply_createFileUploadReplyCompleteMutationVariables
>;
export const UpdateReplyStatus_updatePetitionFieldRepliesStatusDocument = gql`
  mutation UpdateReplyStatus_updatePetitionFieldRepliesStatus(
    $petitionId: GID!
    $fieldId: GID!
    $replyIds: [GID!]!
    $status: PetitionFieldReplyStatus!
  ) {
    updatePetitionFieldRepliesStatus(
      petitionId: $petitionId
      petitionFieldId: $fieldId
      petitionFieldReplyIds: $replyIds
      status: $status
    ) {
      replies {
        ...PetitionFieldReply
        field {
          id
        }
      }
    }
  }
  ${PetitionFieldReplyFragmentDoc}
` as unknown as DocumentNode<
  UpdateReplyStatus_updatePetitionFieldRepliesStatusMutation,
  UpdateReplyStatus_updatePetitionFieldRepliesStatusMutationVariables
>;
export const UpdateReply_updatePetitionFieldRepliesDocument = gql`
  mutation UpdateReply_updatePetitionFieldReplies(
    $petitionId: GID!
    $replies: [UpdatePetitionFieldReplyInput!]!
  ) {
    updatePetitionFieldReplies(petitionId: $petitionId, replies: $replies) {
      ...PetitionFieldReply
      field {
        id
      }
    }
  }
  ${PetitionFieldReplyFragmentDoc}
` as unknown as DocumentNode<
  UpdateReply_updatePetitionFieldRepliesMutation,
  UpdateReply_updatePetitionFieldRepliesMutationVariables
>;
export const UpdateReply_updateFileUploadReplyDocument = gql`
  mutation UpdateReply_updateFileUploadReply(
    $petitionId: GID!
    $replyId: GID!
    $file: FileUploadInput!
    $password: String
  ) {
    updateFileUploadReply(
      petitionId: $petitionId
      replyId: $replyId
      file: $file
      password: $password
    ) {
      presignedPostData {
        ...AWSPresignedPostData
      }
      reply {
        ...PetitionFieldReply
      }
    }
  }
  ${AWSPresignedPostDataFragmentDoc}
  ${PetitionFieldReplyFragmentDoc}
` as unknown as DocumentNode<
  UpdateReply_updateFileUploadReplyMutation,
  UpdateReply_updateFileUploadReplyMutationVariables
>;
export const UpdateReply_updateFileUploadReplyCompleteDocument = gql`
  mutation UpdateReply_updateFileUploadReplyComplete($petitionId: GID!, $replyId: GID!) {
    updateFileUploadReplyComplete(petitionId: $petitionId, replyId: $replyId) {
      ...PetitionFieldReply
      field {
        id
      }
    }
  }
  ${PetitionFieldReplyFragmentDoc}
` as unknown as DocumentNode<
  UpdateReply_updateFileUploadReplyCompleteMutation,
  UpdateReply_updateFileUploadReplyCompleteMutationVariables
>;
export const SubmitReplies_bulkCreatePetitionRepliesDocument = gql`
  mutation SubmitReplies_bulkCreatePetitionReplies(
    $petitionId: GID!
    $replies: JSONObject!
    $includeFields: Boolean!
    $includeTags: Boolean!
    $includeRecipients: Boolean!
    $includeRecipientUrl: Boolean!
    $includeReplies: Boolean!
    $includeProgress: Boolean!
    $includeSigners: Boolean!
    $includeVariablesResult: Boolean!
    $includeSignatureRequests: Boolean!
    $includeOwner: Boolean!
  ) {
    bulkCreatePetitionReplies(petitionId: $petitionId, replies: $replies) {
      ...Petition
    }
  }
  ${PetitionFragmentDoc}
` as unknown as DocumentNode<
  SubmitReplies_bulkCreatePetitionRepliesMutation,
  SubmitReplies_bulkCreatePetitionRepliesMutationVariables
>;
export const UpdateReply_petitionDocument = gql`
  query UpdateReply_petition($petitionId: GID!) {
    petition(id: $petitionId) {
      fields {
        id
        type
        options
        replies {
          id
        }
        children {
          id
          type
          options
          replies {
            id
          }
        }
      }
    }
  }
` as unknown as DocumentNode<UpdateReply_petitionQuery, UpdateReply_petitionQueryVariables>;
export const SubmitReply_petitionDocument = gql`
  query SubmitReply_petition($petitionId: GID!) {
    petition(id: $petitionId) {
      fields {
        id
        type
        options
        children {
          id
          type
          options
        }
      }
    }
  }
` as unknown as DocumentNode<SubmitReply_petitionQuery, SubmitReply_petitionQueryVariables>;
