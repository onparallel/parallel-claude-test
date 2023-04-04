import type { FileUpload } from "graphql-upload/Upload.js";
import type { Duration } from "date-fns";
import type { LocalizableUserText } from "./helpers/scalars/LocalizableUserText";
import type * as db from "./../db/__types";
import type * as events from "./../db/events";
import type * as notifications from "./../db/notifications";
import type { ApiContext } from "./../context";
import type {
  GlobalIdOutputFieldConfigSpread,
  GlobalIdInputFieldConfig,
} from "./helpers/globalIdPlugin";
import type { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import type { FieldValidateArgsResolver } from "./helpers/validateArgsPlugin";
import type { core } from "nexus";
import type { PaginationFieldConfig } from "./helpers/paginationPlugin";
declare global {
  interface NexusGenCustomInputMethods<TypeName extends string> {
    /**
     * A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.
     */
    datetime<FieldName extends string>(
      fieldName: FieldName,
      opts?: core.CommonInputFieldConfig<TypeName, FieldName>
    ): void; // "DateTime";
    duration<FieldName extends string>(
      fieldName: FieldName,
      opts?: core.CommonInputFieldConfig<TypeName, FieldName>
    ): void; // "Duration";
    /**
     * The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).
     */
    jsonObject<FieldName extends string>(
      fieldName: FieldName,
      opts?: core.CommonInputFieldConfig<TypeName, FieldName>
    ): void; // "JSONObject";
    /**
     * The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).
     */
    json<FieldName extends string>(
      fieldName: FieldName,
      opts?: core.CommonInputFieldConfig<TypeName, FieldName>
    ): void; // "JSON";
    localizableUserText<FieldName extends string>(
      fieldName: FieldName,
      opts?: core.CommonInputFieldConfig<TypeName, FieldName>
    ): void; // "LocalizableUserText";
    globalId<FieldName extends string>(
      fieldName: FieldName,
      opts: GlobalIdInputFieldConfig<TypeName, FieldName>
    ): void;
  }
}
declare global {
  interface NexusGenCustomOutputMethods<TypeName extends string> {
    /**
     * A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.
     */
    datetime<FieldName extends string>(
      fieldName: FieldName,
      ...opts: core.ScalarOutSpread<TypeName, FieldName>
    ): void; // "DateTime";
    duration<FieldName extends string>(
      fieldName: FieldName,
      ...opts: core.ScalarOutSpread<TypeName, FieldName>
    ): void; // "Duration";
    /**
     * The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).
     */
    jsonObject<FieldName extends string>(
      fieldName: FieldName,
      ...opts: core.ScalarOutSpread<TypeName, FieldName>
    ): void; // "JSONObject";
    /**
     * The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).
     */
    json<FieldName extends string>(
      fieldName: FieldName,
      ...opts: core.ScalarOutSpread<TypeName, FieldName>
    ): void; // "JSON";
    localizableUserText<FieldName extends string>(
      fieldName: FieldName,
      ...opts: core.ScalarOutSpread<TypeName, FieldName>
    ): void; // "LocalizableUserText";
    globalId<FieldName extends string>(
      fieldName: FieldName,
      ...opts: GlobalIdOutputFieldConfigSpread<TypeName, FieldName>
    ): void;

    paginationField<
      FieldName extends string,
      PaginationType extends core.GetGen<"allOutputTypes", string> | core.AllNexusOutputTypeDefs
    >(
      fieldName: FieldName,
      config: PaginationFieldConfig<TypeName, FieldName, PaginationType>
    ): void;
  }
}

declare global {
  interface NexusGen extends NexusGenTypes {}
}

export interface NexusGenInputs {
  CreateContactInput: {
    // input type
    email: string; // String!
    firstName: string; // String!
    lastName?: string | null; // String
  };
  CreateProfileInput: {
    // input type
    name: string; // String!
  };
  CreateProfileTypeFieldInput: {
    // input type
    alias?: string | null; // String
    isExpirable?: boolean | null; // Boolean
    name: NexusGenScalars["LocalizableUserText"]; // LocalizableUserText!
    type: NexusGenEnums["ProfileTypeFieldType"]; // ProfileTypeFieldType!
  };
  FileUploadInput: {
    // input type
    contentType: string; // String!
    filename: string; // String!
    size: number; // Int!
  };
  FoldersInput: {
    // input type
    folderIds: string[]; // [ID!]!
    type: NexusGenEnums["PetitionBaseType"]; // PetitionBaseType!
  };
  ImageOptions: {
    // input type
    resize?: NexusGenInputs["ImageOptionsResize"] | null; // ImageOptionsResize
  };
  ImageOptionsResize: {
    // input type
    fit?: NexusGenEnums["ImageOptionsResizeFit"] | null; // ImageOptionsResizeFit
    height?: number | null; // Int
    width?: number | null; // Int
  };
  InputFeatureFlagNameValue: {
    // input type
    name: NexusGenEnums["FeatureFlag"]; // FeatureFlag!
    value: boolean; // Boolean!
  };
  OrganizationBrandThemeInput: {
    // input type
    color?: string | null; // String
    fontFamily?: string | null; // String
    preferredTone?: NexusGenEnums["Tone"] | null; // Tone
  };
  OrganizationPdfDocumentThemeInput: {
    // input type
    legalText?: NexusGenInputs["OrganizationPdfDocumentThemeInputLegalText"] | null; // OrganizationPdfDocumentThemeInputLegalText
    marginBottom?: number | null; // Float
    marginLeft?: number | null; // Float
    marginRight?: number | null; // Float
    marginTop?: number | null; // Float
    showLogo?: boolean | null; // Boolean
    textColor?: string | null; // String
    textFontFamily?: string | null; // String
    textFontSize?: number | null; // Float
    title1Color?: string | null; // String
    title1FontFamily?: string | null; // String
    title1FontSize?: number | null; // Float
    title2Color?: string | null; // String
    title2FontFamily?: string | null; // String
    title2FontSize?: number | null; // Float
  };
  OrganizationPdfDocumentThemeInputLegalText: {
    // input type
    en?: NexusGenScalars["JSON"] | null; // JSON
    es?: NexusGenScalars["JSON"] | null; // JSON
  };
  PetitionFilter: {
    // input type
    fromTemplateId?: NexusGenScalars["GID"][] | null; // [GID!]
    locale?: NexusGenEnums["PetitionLocale"] | null; // PetitionLocale
    path?: string | null; // String
    sharedWith?: NexusGenInputs["PetitionSharedWithFilter"] | null; // PetitionSharedWithFilter
    signature?: NexusGenEnums["PetitionSignatureStatusFilter"][] | null; // [PetitionSignatureStatusFilter!]
    status?: NexusGenEnums["PetitionStatus"][] | null; // [PetitionStatus!]
    tagIds?: NexusGenScalars["GID"][] | null; // [GID!]
    tags?: NexusGenInputs["PetitionTagFilter"] | null; // PetitionTagFilter
    type?: NexusGenEnums["PetitionBaseType"] | null; // PetitionBaseType
  };
  PetitionListViewDataInput: {
    // input type
    fromTemplateId?: NexusGenScalars["GID"][] | null; // [GID!]
    path?: string | null; // String
    search?: string | null; // String
    searchIn?: NexusGenEnums["PetitionListViewSearchIn"] | null; // PetitionListViewSearchIn
    sharedWith?: NexusGenInputs["PetitionSharedWithFilter"] | null; // PetitionSharedWithFilter
    signature?: NexusGenEnums["PetitionSignatureStatusFilter"][] | null; // [PetitionSignatureStatusFilter!]
    sort?: NexusGenInputs["PetitionListViewSortInput"] | null; // PetitionListViewSortInput
    status?: NexusGenEnums["PetitionStatus"][] | null; // [PetitionStatus!]
    tags?: NexusGenScalars["GID"][] | null; // [GID!]
    tagsFilters?: NexusGenInputs["PetitionTagFilter"] | null; // PetitionTagFilter
  };
  PetitionListViewSortInput: {
    // input type
    direction: NexusGenEnums["PetitionListViewSortDirection"]; // PetitionListViewSortDirection!
    field: NexusGenEnums["PetitionListViewSortField"]; // PetitionListViewSortField!
  };
  PetitionSharedWithFilter: {
    // input type
    filters: NexusGenInputs["PetitionSharedWithFilterLine"][]; // [PetitionSharedWithFilterLine!]!
    operator: NexusGenEnums["FilterSharedWithLogicalOperator"]; // FilterSharedWithLogicalOperator!
  };
  PetitionSharedWithFilterLine: {
    // input type
    operator: NexusGenEnums["FilterSharedWithOperator"]; // FilterSharedWithOperator!
    value: string; // ID!
  };
  PetitionTagFilter: {
    // input type
    filters: NexusGenInputs["PetitionTagFilterLine"][]; // [PetitionTagFilterLine!]!
    operator: NexusGenEnums["PetitionTagFilterLogicalOperator"]; // PetitionTagFilterLogicalOperator!
  };
  PetitionTagFilterLine: {
    // input type
    operator: NexusGenEnums["PetitionTagFilterLineOperator"]; // PetitionTagFilterLineOperator!
    value: NexusGenScalars["GID"][]; // [GID!]!
  };
  PublicPetitionSignerDataInput: {
    // input type
    email: string; // String!
    firstName: string; // String!
    lastName: string; // String!
  };
  RemindersConfigInput: {
    // input type
    limit: number; // Int!
    offset: number; // Int!
    time: string; // String!
    timezone: string; // String!
    weekdaysOnly: boolean; // Boolean!
  };
  SignatureConfigInput: {
    // input type
    allowAdditionalSigners: boolean; // Boolean!
    orgIntegrationId: NexusGenScalars["GID"]; // GID!
    review: boolean; // Boolean!
    signersInfo: NexusGenInputs["SignatureConfigInputSigner"][]; // [SignatureConfigInputSigner!]!
    timezone: string; // String!
    title?: string | null; // String
  };
  SignatureConfigInputSigner: {
    // input type
    contactId?: NexusGenScalars["GID"] | null; // GID
    email: string; // String!
    firstName: string; // String!
    lastName?: string | null; // String
  };
  UpdateContactInput: {
    // input type
    firstName?: string | null; // String
    lastName?: string | null; // String
  };
  UpdatePetitionFieldInput: {
    // input type
    alias?: string | null; // String
    description?: string | null; // String
    hasCommentsEnabled?: boolean | null; // Boolean
    isInternal?: boolean | null; // Boolean
    multiple?: boolean | null; // Boolean
    optional?: boolean | null; // Boolean
    options?: NexusGenScalars["JSONObject"] | null; // JSONObject
    showActivityInPdf?: boolean | null; // Boolean
    showInPdf?: boolean | null; // Boolean
    title?: string | null; // String
    visibility?: NexusGenScalars["JSONObject"] | null; // JSONObject
  };
  UpdatePetitionInput: {
    // input type
    anonymizeAfterMonths?: number | null; // Int
    anonymizePurpose?: string | null; // String
    closingEmailBody?: NexusGenScalars["JSON"] | null; // JSON
    completingMessageBody?: NexusGenScalars["JSON"] | null; // JSON
    completingMessageSubject?: string | null; // String
    deadline?: NexusGenScalars["DateTime"] | null; // DateTime
    defaultOnBehalfId?: NexusGenScalars["GID"] | null; // GID
    defaultPath?: string | null; // String
    description?: NexusGenScalars["JSON"] | null; // JSON
    emailBody?: NexusGenScalars["JSON"] | null; // JSON
    emailSubject?: string | null; // String
    isCompletingMessageEnabled?: boolean | null; // Boolean
    isRecipientViewContentsHidden?: boolean | null; // Boolean
    locale?: NexusGenEnums["PetitionLocale"] | null; // PetitionLocale
    name?: string | null; // String
    remindersConfig?: NexusGenInputs["RemindersConfigInput"] | null; // RemindersConfigInput
    signatureConfig?: NexusGenInputs["SignatureConfigInput"] | null; // SignatureConfigInput
    skipForwardSecurity?: boolean | null; // Boolean
  };
  UpdateProfileTypeFieldInput: {
    // input type
    alias?: string | null; // String
    isExpirable?: boolean | null; // Boolean
    name?: NexusGenScalars["LocalizableUserText"] | null; // LocalizableUserText
    options?: NexusGenScalars["JSONObject"] | null; // JSONObject
  };
  UpdateProfileTypeInput: {
    // input type
    name?: NexusGenScalars["LocalizableUserText"] | null; // LocalizableUserText
  };
  UpdateTagInput: {
    // input type
    color?: string | null; // String
    name?: string | null; // String
  };
  UpdateUserGroupInput: {
    // input type
    name?: string | null; // String
  };
  UserOrUserGroupPermissionInput: {
    // input type
    isSubscribed: boolean; // Boolean!
    permissionType: NexusGenEnums["PetitionPermissionType"]; // PetitionPermissionType!
    userGroupId?: NexusGenScalars["GID"] | null; // GID
    userId?: NexusGenScalars["GID"] | null; // GID
  };
}

export interface NexusGenEnums {
  BulkSendSigningMode: "COPY_SIGNATURE_SETTINGS" | "DISABLE_SIGNATURE" | "LET_RECIPIENT_CHOOSE";
  ChangePasswordResult: "INCORRECT_PASSWORD" | "INVALID_NEW_PASSWORD" | "SUCCESS";
  DowJonesKycEntityType: "Entity" | "Person";
  FeatureFlag: db.FeatureFlagName;
  FilterSharedWithLogicalOperator: "AND" | "OR";
  FilterSharedWithOperator: "IS_OWNER" | "NOT_IS_OWNER" | "NOT_SHARED_WITH" | "SHARED_WITH";
  ImageOptionsResizeFit: "contain" | "cover" | "fill" | "inside" | "outside";
  IntegrationType: db.IntegrationType;
  OrgLicenseSource: "APPSUMO";
  OrganizationRole: "ADMIN" | "COLLABORATOR" | "NORMAL" | "OWNER";
  OrganizationStatus: db.OrganizationStatus;
  OrganizationUsageLimitName: db.OrganizationUsageLimitName;
  OrganizationUsers_OrderBy:
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
  PetitionAccessStatus: db.PetitionAccessStatus;
  PetitionAttachmentType: db.PetitionAttachmentType;
  PetitionBaseType: "PETITION" | "TEMPLATE";
  PetitionEventType: db.PetitionEventType;
  PetitionFieldReplyStatus: db.PetitionFieldReplyStatus;
  PetitionFieldType: db.PetitionFieldType;
  PetitionListViewSearchIn: "CURRENT_FOLDER" | "EVERYWHERE";
  PetitionListViewSortDirection: "ASC" | "DESC";
  PetitionListViewSortField: "name" | "sentAt";
  PetitionLocale: db.ContactLocale;
  PetitionMessageStatus: db.PetitionMessageStatus;
  PetitionPermissionType: db.PetitionPermissionType;
  PetitionPermissionTypeRW: "READ" | "WRITE";
  PetitionReminderType: db.PetitionReminderType;
  PetitionSignatureCancelReason: db.PetitionSignatureCancelReason;
  PetitionSignatureRequestStatus:
    | "CANCELLED"
    | "CANCELLING"
    | "COMPLETED"
    | "ENQUEUED"
    | "PROCESSED"
    | "PROCESSING";
  PetitionSignatureStatusFilter:
    | "CANCELLED"
    | "COMPLETED"
    | "NOT_STARTED"
    | "NO_SIGNATURE"
    | "PENDING_START"
    | "PROCESSING";
  PetitionStatus: db.PetitionStatus;
  PetitionTagFilterLineOperator: "CONTAINS" | "DOES_NOT_CONTAIN" | "IS_EMPTY";
  PetitionTagFilterLogicalOperator: "AND" | "OR";
  PetitionUserNotificationFilter: "ALL" | "COMMENTS" | "COMPLETED" | "OTHER" | "SHARED" | "UNREAD";
  ProfileTypeFieldPermission: "WRITE";
  ProfileTypeFieldType: db.ProfileTypeFieldType;
  PublicSignatureStatus: "COMPLETED" | "STARTED";
  QueryContacts_OrderBy:
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
  QueryOrganizations_OrderBy: "createdAt_ASC" | "createdAt_DESC" | "name_ASC" | "name_DESC";
  QueryPetitions_OrderBy:
    | "createdAt_ASC"
    | "createdAt_DESC"
    | "lastUsedAt_ASC"
    | "lastUsedAt_DESC"
    | "name_ASC"
    | "name_DESC"
    | "sentAt_ASC"
    | "sentAt_DESC";
  QueryProfileTypes_OrderBy: "createdAt_ASC" | "createdAt_DESC" | "name_ASC" | "name_DESC";
  QueryUserGroups_OrderBy: "createdAt_ASC" | "createdAt_DESC" | "name_ASC" | "name_DESC";
  Result: "FAILURE" | "SUCCESS";
  SignatureOrgIntegrationEnvironment: "DEMO" | "PRODUCTION";
  SignatureOrgIntegrationProvider: "DOCUSIGN" | "SIGNATURIT";
  Success: "SUCCESS";
  TaskName: db.TaskName;
  TaskStatus: db.TaskStatus;
  Tone: "FORMAL" | "INFORMAL";
  UserLocale: db.UserLocale;
  UserStatus: db.UserStatus;
}

export interface NexusGenScalars {
  String: string;
  Int: number;
  Float: number;
  Boolean: boolean;
  ID: string;
  DateTime: Date;
  Duration: Duration;
  GID: number;
  JSON: any;
  JSONObject: { [key: string]: any };
  LocalizableUserText: LocalizableUserText;
  Upload: Promise<FileUpload>;
}

export interface NexusGenObjects {
  AWSPresignedPostData: {
    // root type
    fields: NexusGenScalars["JSONObject"]; // JSONObject!
    url: string; // String!
  };
  AccessActivatedEvent: events.AccessActivatedEvent;
  AccessActivatedFromPublicPetitionLinkEvent: events.AccessActivatedFromPublicPetitionLinkEvent;
  AccessActivatedFromPublicPetitionLinkUserNotification: notifications.AccessActivatedFromPublicPetitionLinkUserNotification;
  AccessDeactivatedEvent: events.AccessDeactivatedEvent;
  AccessDelegatedEvent: events.AccessDelegatedEvent;
  AccessOpenedEvent: events.AccessOpenedEvent;
  AsyncFieldCompletionResponse: {
    // root type
    type: string; // String!
    url: string; // String!
  };
  BulkCreateContactsReturnType: {
    // root type
    contacts: NexusGenRootTypes["Contact"][]; // [Contact!]!
    errors?: NexusGenScalars["JSON"][] | null; // [JSON!]
  };
  CommentCreatedUserNotification: notifications.CommentCreatedUserNotification;
  CommentDeletedEvent: events.CommentDeletedEvent;
  CommentPublishedEvent: events.CommentPublishedEvent;
  ConnectionMetadata: {
    // root type
    browserName?: string | null; // String
    browserVersion?: string | null; // String
    country?: string | null; // String
    ip?: string | null; // String
  };
  Contact: db.Contact;
  ContactPagination: {
    // root type
    items: NexusGenRootTypes["Contact"][]; // [Contact!]!
    totalCount: number; // Int!
  };
  DowJonesKycEntityDate: {
    // root type
    day?: number | null; // Int
    month?: number | null; // Int
    year?: number | null; // Int
  };
  DowJonesKycEntityPlace: {
    // root type
    countryCode: string; // String!
    descriptor: string; // String!
  };
  DowJonesKycEntityProfileResultEntity: {
    // root type
    dateOfRegistration?: NexusGenRootTypes["DowJonesKycEntityDate"] | null; // DowJonesKycEntityDate
    iconHints: string[]; // [String!]!
    id: string; // ID!
    name: string; // String!
    profileId: string; // ID!
    relationships: NexusGenRootTypes["DowJonesKycEntityRelationship"][]; // [DowJonesKycEntityRelationship!]!
    sanctions: NexusGenRootTypes["DowJonesKycEntitySanction"][]; // [DowJonesKycEntitySanction!]!
    type: NexusGenEnums["DowJonesKycEntityType"]; // DowJonesKycEntityType!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  DowJonesKycEntityProfileResultPerson: {
    // root type
    citizenship?: NexusGenRootTypes["DowJonesKycEntityPlace"] | null; // DowJonesKycEntityPlace
    dateOfBirth?: NexusGenRootTypes["DowJonesKycEntityDate"] | null; // DowJonesKycEntityDate
    iconHints: string[]; // [String!]!
    id: string; // ID!
    isDeceased: boolean; // Boolean!
    jurisdiction?: NexusGenRootTypes["DowJonesKycEntityPlace"] | null; // DowJonesKycEntityPlace
    name: string; // String!
    placeOfBirth?: NexusGenRootTypes["DowJonesKycEntityPlace"] | null; // DowJonesKycEntityPlace
    profileId: string; // ID!
    relationships: NexusGenRootTypes["DowJonesKycEntityRelationship"][]; // [DowJonesKycEntityRelationship!]!
    residence?: NexusGenRootTypes["DowJonesKycEntityPlace"] | null; // DowJonesKycEntityPlace
    sanctions: NexusGenRootTypes["DowJonesKycEntitySanction"][]; // [DowJonesKycEntitySanction!]!
    type: NexusGenEnums["DowJonesKycEntityType"]; // DowJonesKycEntityType!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  DowJonesKycEntityRelationship: {
    // root type
    connectionType: string; // String!
    iconHints: string[]; // [String!]!
    name?: string | null; // String
    profileId: string; // ID!
    type: NexusGenEnums["DowJonesKycEntityType"]; // DowJonesKycEntityType!
  };
  DowJonesKycEntitySanction: {
    // root type
    fromDate?: NexusGenRootTypes["DowJonesKycEntityDate"] | null; // DowJonesKycEntityDate
    id: string; // ID!
    name: string; // String!
    sources: string[]; // [String!]!
  };
  DowJonesKycEntitySearchResultEntity: {
    // root type
    countryTerritoryName?: string | null; // String
    iconHints: string[]; // [String!]!
    id: string; // ID!
    isSubsidiary: boolean; // Boolean!
    name: string; // String!
    profileId: string; // ID!
    title: string; // String!
    type: NexusGenEnums["DowJonesKycEntityType"]; // DowJonesKycEntityType!
  };
  DowJonesKycEntitySearchResultPagination: {
    // root type
    items: NexusGenRootTypes["DowJonesKycEntitySearchResult"][]; // [DowJonesKycEntitySearchResult!]!
    totalCount: number; // Int!
  };
  DowJonesKycEntitySearchResultPerson: {
    // root type
    countryTerritoryName?: string | null; // String
    dateOfBirth?: NexusGenRootTypes["DowJonesKycEntityDate"] | null; // DowJonesKycEntityDate
    gender: string; // String!
    iconHints: string[]; // [String!]!
    id: string; // ID!
    isSubsidiary: boolean; // Boolean!
    name: string; // String!
    profileId: string; // ID!
    title: string; // String!
    type: NexusGenEnums["DowJonesKycEntityType"]; // DowJonesKycEntityType!
  };
  EffectivePetitionUserPermission: Pick<
    db.PetitionPermission,
    "petition_id" | "user_id" | "type" | "is_subscribed"
  >;
  EventSubscriptionSignatureKey: db.EventSubscriptionSignatureKey;
  FeatureFlagNameValue: {
    // root type
    name: NexusGenEnums["FeatureFlag"]; // FeatureFlag!
    value: boolean; // Boolean!
  };
  FileUpload: db.FileUpload;
  FileUploadDownloadLinkResult: {
    // root type
    file?: NexusGenRootTypes["FileUpload"] | null; // FileUpload
    result: NexusGenEnums["Result"]; // Result!
    url?: string | null; // String
  };
  FileUploadReplyResponse: {
    // root type
    presignedPostData: NexusGenRootTypes["AWSPresignedPostData"]; // AWSPresignedPostData!
    reply: NexusGenRootTypes["PetitionFieldReply"]; // PetitionFieldReply!
  };
  GenerateUserAuthTokenResponse: {
    // root type
    apiKey: string; // String!
    userAuthToken: NexusGenRootTypes["UserAuthenticationToken"]; // UserAuthenticationToken!
  };
  GroupPermissionAddedEvent: events.GroupPermissionAddedEvent;
  GroupPermissionEditedEvent: events.GroupPermissionEditedEvent;
  GroupPermissionRemovedEvent: events.GroupPermissionRemovedEvent;
  IOrgIntegrationPagination: {
    // root type
    items: NexusGenRootTypes["IOrgIntegration"][]; // [IOrgIntegration!]!
    totalCount: number; // Int!
  };
  LandingTemplate: db.Petition;
  LandingTemplateCategorySample: string;
  LandingTemplateField: db.PetitionField;
  LandingTemplatePagination: {
    // root type
    items: NexusGenRootTypes["LandingTemplate"][]; // [LandingTemplate!]!
    totalCount: number; // Int!
  };
  MessageCancelledEvent: events.MessageCancelledEvent;
  MessageEmailBouncedUserNotification: notifications.MessageEmailBouncedUserNotification;
  MessageScheduledEvent: events.MessageScheduledEvent;
  MessageSentEvent: events.MessageSentEvent;
  Mutation: {};
  OrgIntegration: db.OrgIntegration;
  OrgLicense: {
    // root type
    externalId: string; // String!
    name: string; // String!
    source: NexusGenEnums["OrgLicenseSource"]; // OrgLicenseSource!
  };
  Organization: db.Organization;
  OrganizationBrandThemeData: {
    // root type
    color: string; // String!
    fontFamily?: string | null; // String
    preferredTone: NexusGenEnums["Tone"]; // Tone!
  };
  OrganizationPagination: {
    // root type
    items: NexusGenRootTypes["Organization"][]; // [Organization!]!
    totalCount: number; // Int!
  };
  OrganizationTheme: db.OrganizationTheme;
  OrganizationUsageLimit: db.OrganizationUsageLimit;
  OrganizationUsageLimitPagination: {
    // root type
    items: NexusGenRootTypes["OrganizationUsageLimit"][]; // [OrganizationUsageLimit!]!
    totalCount: number; // Int!
  };
  OwnershipTransferredEvent: events.OwnershipTransferredEvent;
  Petition: db.Petition;
  PetitionAccess: db.PetitionAccess;
  PetitionAccessPagination: {
    // root type
    items: NexusGenRootTypes["PetitionAccess"][]; // [PetitionAccess!]!
    totalCount: number; // Int!
  };
  PetitionAnonymizedEvent: events.PetitionAnonymizedEvent;
  PetitionAttachment: db.PetitionAttachment;
  PetitionAttachmentUploadData: {
    // root type
    attachment: NexusGenRootTypes["PetitionAttachment"]; // PetitionAttachment!
    presignedPostData: NexusGenRootTypes["AWSPresignedPostData"]; // AWSPresignedPostData!
  };
  PetitionAttachmentsList: {
    // root type
    ANNEX: NexusGenRootTypes["PetitionAttachment"][]; // [PetitionAttachment!]!
    BACK: NexusGenRootTypes["PetitionAttachment"][]; // [PetitionAttachment!]!
    FRONT: NexusGenRootTypes["PetitionAttachment"][]; // [PetitionAttachment!]!
  };
  PetitionBaseMini: db.Petition;
  PetitionBaseOrFolderPagination: {
    // root type
    items: NexusGenRootTypes["PetitionBaseOrFolder"][]; // [PetitionBaseOrFolder!]!
    totalCount: number; // Int!
  };
  PetitionClonedEvent: events.PetitionClonedEvent;
  PetitionClosedEvent: events.PetitionClosedEvent;
  PetitionClosedNotifiedEvent: events.PetitionClosedNotifiedEvent;
  PetitionCompletedEvent: events.PetitionCompletedEvent;
  PetitionCompletedUserNotification: notifications.PetitionCompletedUserNotification;
  PetitionCreatedEvent: events.PetitionCreatedEvent;
  PetitionDeletedEvent: events.PetitionDeletedEvent;
  PetitionEventPagination: {
    // root type
    items: NexusGenRootTypes["PetitionEvent"][]; // [PetitionEvent!]!
    totalCount: number; // Int!
  };
  PetitionEventSubscription: db.PetitionEventSubscription;
  PetitionField: db.PetitionField;
  PetitionFieldAttachment: db.PetitionFieldAttachment;
  PetitionFieldAttachmentUploadData: {
    // root type
    attachment: NexusGenRootTypes["PetitionFieldAttachment"]; // PetitionFieldAttachment!
    presignedPostData: NexusGenRootTypes["AWSPresignedPostData"]; // AWSPresignedPostData!
  };
  PetitionFieldComment: db.PetitionFieldComment;
  PetitionFieldCommentUserGroupMention: { __type: "UserGroup"; user_group_id: number };
  PetitionFieldCommentUserMention: { __type: "User"; user_id: number };
  PetitionFieldProgress: {
    // root type
    approved: number; // Int!
    optional: number; // Int!
    replied: number; // Int!
    total: number; // Int!
  };
  PetitionFieldReply: db.PetitionFieldReply;
  PetitionFolder: {
    name: string;
    petition_count: number;
    is_folder: true;
    path: string;
    min_permission: db.PetitionPermissionType;
  };
  PetitionListView: db.PetitionListView;
  PetitionListViewData: {
    // root type
    fromTemplateId?: NexusGenScalars["GID"][] | null; // [GID!]
    path: string; // String!
    search?: string | null; // String
    searchIn: NexusGenEnums["PetitionListViewSearchIn"]; // PetitionListViewSearchIn!
    sharedWith?: NexusGenRootTypes["PetitionListViewDataSharedWith"] | null; // PetitionListViewDataSharedWith
    signature?: NexusGenEnums["PetitionSignatureStatusFilter"][] | null; // [PetitionSignatureStatusFilter!]
    sort?: NexusGenRootTypes["PetitionListViewSort"] | null; // PetitionListViewSort
    status?: NexusGenEnums["PetitionStatus"][] | null; // [PetitionStatus!]
    tags?: NexusGenScalars["GID"][] | null; // [GID!]
    tagsFilters?: NexusGenRootTypes["PetitionListViewDataTags"] | null; // PetitionListViewDataTags
  };
  PetitionListViewDataSharedWith: {
    // root type
    filters: NexusGenRootTypes["PetitionListViewDataSharedWithFilters"][]; // [PetitionListViewDataSharedWithFilters!]!
    operator: NexusGenEnums["FilterSharedWithLogicalOperator"]; // FilterSharedWithLogicalOperator!
  };
  PetitionListViewDataSharedWithFilters: {
    // root type
    operator: NexusGenEnums["FilterSharedWithOperator"]; // FilterSharedWithOperator!
    value: string; // ID!
  };
  PetitionListViewDataTags: {
    // root type
    filters: NexusGenRootTypes["PetitionListViewDataTagsFilters"][]; // [PetitionListViewDataTagsFilters!]!
    operator: NexusGenEnums["PetitionTagFilterLogicalOperator"]; // PetitionTagFilterLogicalOperator!
  };
  PetitionListViewDataTagsFilters: {
    // root type
    operator: NexusGenEnums["PetitionTagFilterLineOperator"]; // PetitionTagFilterLineOperator!
    value: NexusGenScalars["GID"][]; // [GID!]!
  };
  PetitionListViewSort: {
    // root type
    direction: NexusGenEnums["PetitionListViewSortDirection"]; // PetitionListViewSortDirection!
    field: NexusGenEnums["PetitionListViewSortField"]; // PetitionListViewSortField!
  };
  PetitionMessage: db.PetitionMessage;
  PetitionMessageBouncedEvent: events.PetitionMessageBouncedEvent;
  PetitionProgress: {
    // root type
    external: NexusGenRootTypes["PetitionFieldProgress"]; // PetitionFieldProgress!
    internal: NexusGenRootTypes["PetitionFieldProgress"]; // PetitionFieldProgress!
  };
  PetitionReminder: db.PetitionReminder;
  PetitionReminderBouncedEvent: events.PetitionReminderBouncedEvent;
  PetitionReopenedEvent: events.PetitionReopenedEvent;
  PetitionSharedUserNotification: notifications.PetitionSharedUserNotification;
  PetitionSignatureRequest: db.PetitionSignatureRequest;
  PetitionSignatureRequestSignerStatus: {
    firstName: string;
    lastName: string;
    email: string;
    status?:
      | {
          sent_at?: Date;
          opened_at?: Date;
          signed_at?: Date;
          declined_at?: Date;
          bounced_at?: Date;
        }
      | undefined;
  };
  PetitionSigner: {
    contactId?: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  PetitionTemplate: db.Petition;
  PetitionUserGroupPermission: db.PetitionPermission;
  PetitionUserPermission: db.PetitionPermission;
  Profile: db.Profile;
  ProfileFieldAndValue: [db.ProfileTypeField, db.ProfileFieldValue | null];
  ProfileFieldValue: db.ProfileFieldValue;
  ProfileType: db.ProfileType;
  ProfileTypeField: db.ProfileTypeField;
  ProfileTypePagination: {
    // root type
    items: NexusGenRootTypes["ProfileType"][]; // [ProfileType!]!
    totalCount: number; // Int!
  };
  PublicAccessVerification: {
    // root type
    cookieName?: string | null; // String
    cookieValue?: string | null; // String
    email?: string | null; // String
    isAllowed: boolean; // Boolean!
    isContactlessAccess?: boolean | null; // Boolean
    organization?: NexusGenRootTypes["PublicOrganization"] | null; // PublicOrganization
    ownerName?: string | null; // String
  };
  PublicContact: db.Contact;
  PublicCreateFileUploadReply: {
    // root type
    presignedPostData: NexusGenRootTypes["AWSPresignedPostData"]; // AWSPresignedPostData!
    reply: NexusGenRootTypes["PublicPetitionFieldReply"]; // PublicPetitionFieldReply!
  };
  PublicLicenseCode: db.LicenseCode;
  PublicOrganization: db.Organization;
  PublicPetition: db.Petition;
  PublicPetitionAccess: db.PetitionAccess;
  PublicPetitionAccessPagination: {
    // root type
    items: NexusGenRootTypes["PublicPetitionAccess"][]; // [PublicPetitionAccess!]!
    totalCount: number; // Int!
  };
  PublicPetitionField: db.PetitionField;
  PublicPetitionFieldComment: db.PetitionFieldComment;
  PublicPetitionFieldProgress: {
    // root type
    optional: number; // Int!
    replied: number; // Int!
    total: number; // Int!
  };
  PublicPetitionFieldReply: db.PetitionFieldReply;
  PublicPetitionLink: db.PublicPetitionLink;
  PublicPetitionMessage: db.PetitionMessage;
  PublicPublicPetitionLink: db.PublicPetitionLink;
  PublicRemindersOptOut: {
    // root type
    orgLogoUrl?: string | null; // String
    orgName: string; // String!
  };
  PublicSignatureConfig: {
    signersInfo: any[];
    review?: boolean;
    allowAdditionalSigners?: boolean;
    additionalSignersInfo?: any[];
  };
  PublicUser: db.User;
  Query: {};
  RecipientSignedEvent: events.RecipientSignedEvent;
  ReminderEmailBouncedUserNotification: notifications.ReminderEmailBouncedUserNotification;
  ReminderSentEvent: events.ReminderSentEvent;
  RemindersConfig: {
    offset: number;
    limit: number;
    time: string;
    timezone: string;
    weekdaysOnly: boolean;
  };
  RemindersOptOutEvent: events.RemindersOptOutEvent;
  RemindersOptOutNotification: notifications.RemindersOptOutNotification;
  ReplyCreatedEvent: events.ReplyCreatedEvent;
  ReplyDeletedEvent: events.ReplyDeletedEvent;
  ReplyStatusChangedEvent: events.ReplyStatusChangedEvent;
  ReplyUpdatedEvent: events.ReplyUpdatedEvent;
  SendPetitionResult: {
    // root type
    accesses?: NexusGenRootTypes["PetitionAccess"][] | null; // [PetitionAccess!]
    petition?: NexusGenRootTypes["Petition"] | null; // Petition
    result: NexusGenEnums["Result"]; // Result!
  };
  SignatureCancelledEvent: events.SignatureCancelledEvent;
  SignatureCancelledUserNotification: notifications.SignatureCancelledUserNotification;
  SignatureCompletedEvent: events.SignatureCompletedEvent;
  SignatureCompletedUserNotification: notifications.SignatureCompletedUserNotification;
  SignatureConfig: {
    orgIntegrationId: number;
    signersInfo: {
      firstName: string;
      lastName: string;
      email: string;
    }[];
    timezone: string;
    title: string | null;
    review?: boolean;
    allowAdditionalSigners?: boolean;
  };
  SignatureOpenedEvent: events.SignatureOpenedEvent;
  SignatureOrgIntegration: db.OrgIntegration;
  SignatureReminderEvent: events.SignatureReminderEvent;
  SignatureStartedEvent: events.SignatureStartedEvent;
  SupportMethodResponse: {
    // root type
    message?: string | null; // String
    result: NexusGenEnums["Result"]; // Result!
    type?: string | null; // String
  };
  Tag: db.Tag;
  TagPagination: {
    // root type
    items: NexusGenRootTypes["Tag"][]; // [Tag!]!
    totalCount: number; // Int!
  };
  Task: db.Task;
  TaskResultFile: {
    // root type
    filename: string; // String!
    url: string; // String!
  };
  TemplateDefaultUserGroupPermission: db.TemplateDefaultPermission;
  TemplateDefaultUserPermission: db.TemplateDefaultPermission;
  TemplateUsedEvent: events.TemplateUsedEvent;
  User: db.User;
  UserAuthenticationToken: db.UserAuthenticationToken;
  UserGroup: db.UserGroup;
  UserGroupMember: db.UserGroupMember;
  UserGroupPagination: {
    // root type
    items: NexusGenRootTypes["UserGroup"][]; // [UserGroup!]!
    totalCount: number; // Int!
  };
  UserNotifications_Pagination: {
    // root type
    hasMore: boolean; // Boolean!
    items: NexusGenRootTypes["PetitionUserNotification"][]; // [PetitionUserNotification!]!
  };
  UserPagination: {
    // root type
    items: NexusGenRootTypes["User"][]; // [User!]!
    totalCount: number; // Int!
  };
  UserPermissionAddedEvent: events.UserPermissionAddedEvent;
  UserPermissionEditedEvent: events.UserPermissionEditedEvent;
  UserPermissionRemovedEvent: events.UserPermissionRemovedEvent;
  VerificationCodeCheck: {
    // root type
    remainingAttempts?: number | null; // Int
    result: NexusGenEnums["Result"]; // Result!
  };
  VerificationCodeRequest: {
    // root type
    expiresAt: NexusGenScalars["DateTime"]; // DateTime!
    remainingAttempts: number; // Int!
    token: string; // ID!
  };
}

export interface NexusGenInterfaces {
  CreatedAt: {
    created_at: Date;
  };
  DowJonesKycEntityProfileResult:
    | NexusGenRootTypes["DowJonesKycEntityProfileResultEntity"]
    | NexusGenRootTypes["DowJonesKycEntityProfileResultPerson"];
  DowJonesKycEntitySearchResult:
    | NexusGenRootTypes["DowJonesKycEntitySearchResultEntity"]
    | NexusGenRootTypes["DowJonesKycEntitySearchResultPerson"];
  IOrgIntegration:
    | NexusGenRootTypes["OrgIntegration"]
    | NexusGenRootTypes["SignatureOrgIntegration"];
  PetitionBase: db.Petition;
  PetitionEvent: events.PetitionEvent;
  PetitionPermission: db.PetitionPermission;
  PetitionUserNotification: db.PetitionUserNotification;
  TemplateDefaultPermission: db.TemplateDefaultPermission;
  Timestamps: {
    created_at: Date;
    updated_at: Date;
  };
}

export interface NexusGenUnions {
  PetitionBaseOrFolder:
    | ({ is_folder?: false } & NexusGenRootTypes["Petition"])
    | NexusGenRootTypes["PetitionFolder"];
  PetitionFieldCommentMention:
    | { __type: "User"; user_id: number }
    | { __type: "UserGroup"; user_group_id: number };
  PublicUserOrContact:
    | ({ __type: "Contact" } & NexusGenRootTypes["Contact"])
    | ({ __type: "User" } & NexusGenRootTypes["User"]);
  UserOrPetitionAccess:
    | ({ __type: "User" } & NexusGenRootTypes["User"])
    | ({ __type: "PetitionAccess" } & NexusGenRootTypes["PetitionAccess"]);
  UserOrUserGroup:
    | ({ __type: "User" } & NexusGenRootTypes["User"])
    | ({ __type: "UserGroup" } & NexusGenRootTypes["UserGroup"]);
}

export type NexusGenRootTypes = NexusGenInterfaces & NexusGenObjects & NexusGenUnions;

export type NexusGenAllTypes = NexusGenRootTypes & NexusGenScalars & NexusGenEnums;

export interface NexusGenFieldTypes {
  AWSPresignedPostData: {
    // field return type
    fields: NexusGenScalars["JSONObject"]; // JSONObject!
    url: string; // String!
  };
  AccessActivatedEvent: {
    // field return type
    access: NexusGenRootTypes["PetitionAccess"]; // PetitionAccess!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  AccessActivatedFromPublicPetitionLinkEvent: {
    // field return type
    access: NexusGenRootTypes["PetitionAccess"]; // PetitionAccess!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
  };
  AccessActivatedFromPublicPetitionLinkUserNotification: {
    // field return type
    access: NexusGenRootTypes["PetitionAccess"]; // PetitionAccess!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    isRead: boolean; // Boolean!
    petition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
  };
  AccessDeactivatedEvent: {
    // field return type
    access: NexusGenRootTypes["PetitionAccess"]; // PetitionAccess!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    reason: string; // String!
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  AccessDelegatedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    newAccess: NexusGenRootTypes["PetitionAccess"]; // PetitionAccess!
    originalAccess: NexusGenRootTypes["PetitionAccess"]; // PetitionAccess!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
  };
  AccessOpenedEvent: {
    // field return type
    access: NexusGenRootTypes["PetitionAccess"]; // PetitionAccess!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
  };
  AsyncFieldCompletionResponse: {
    // field return type
    type: string; // String!
    url: string; // String!
  };
  BulkCreateContactsReturnType: {
    // field return type
    contacts: NexusGenRootTypes["Contact"][]; // [Contact!]!
    errors: NexusGenScalars["JSON"][] | null; // [JSON!]
  };
  CommentCreatedUserNotification: {
    // field return type
    comment: NexusGenRootTypes["PetitionFieldComment"]; // PetitionFieldComment!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    field: NexusGenRootTypes["PetitionField"]; // PetitionField!
    id: NexusGenScalars["GID"]; // GID!
    isMention: boolean; // Boolean!
    isRead: boolean; // Boolean!
    petition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
  };
  CommentDeletedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    deletedBy: NexusGenRootTypes["UserOrPetitionAccess"] | null; // UserOrPetitionAccess
    field: NexusGenRootTypes["PetitionField"] | null; // PetitionField
    id: NexusGenScalars["GID"]; // GID!
    isInternal: boolean; // Boolean!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
  };
  CommentPublishedEvent: {
    // field return type
    comment: NexusGenRootTypes["PetitionFieldComment"] | null; // PetitionFieldComment
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    field: NexusGenRootTypes["PetitionField"] | null; // PetitionField
    id: NexusGenScalars["GID"]; // GID!
    isInternal: boolean; // Boolean!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
  };
  ConnectionMetadata: {
    // field return type
    browserName: string | null; // String
    browserVersion: string | null; // String
    country: string | null; // String
    ip: string | null; // String
  };
  Contact: {
    // field return type
    accesses: NexusGenRootTypes["PetitionAccessPagination"]; // PetitionAccessPagination!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    email: string; // String!
    firstName: string; // String!
    fullName: string; // String!
    hasBouncedEmail: boolean; // Boolean!
    id: NexusGenScalars["GID"]; // GID!
    lastName: string | null; // String
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  ContactPagination: {
    // field return type
    items: NexusGenRootTypes["Contact"][]; // [Contact!]!
    totalCount: number; // Int!
  };
  DowJonesKycEntityDate: {
    // field return type
    day: number | null; // Int
    month: number | null; // Int
    year: number | null; // Int
  };
  DowJonesKycEntityPlace: {
    // field return type
    countryCode: string; // String!
    descriptor: string; // String!
  };
  DowJonesKycEntityProfileResultEntity: {
    // field return type
    dateOfRegistration: NexusGenRootTypes["DowJonesKycEntityDate"] | null; // DowJonesKycEntityDate
    iconHints: string[]; // [String!]!
    id: string; // ID!
    name: string; // String!
    profileId: string; // ID!
    relationships: NexusGenRootTypes["DowJonesKycEntityRelationship"][]; // [DowJonesKycEntityRelationship!]!
    sanctions: NexusGenRootTypes["DowJonesKycEntitySanction"][]; // [DowJonesKycEntitySanction!]!
    type: NexusGenEnums["DowJonesKycEntityType"]; // DowJonesKycEntityType!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  DowJonesKycEntityProfileResultPerson: {
    // field return type
    citizenship: NexusGenRootTypes["DowJonesKycEntityPlace"] | null; // DowJonesKycEntityPlace
    dateOfBirth: NexusGenRootTypes["DowJonesKycEntityDate"] | null; // DowJonesKycEntityDate
    iconHints: string[]; // [String!]!
    id: string; // ID!
    isDeceased: boolean; // Boolean!
    jurisdiction: NexusGenRootTypes["DowJonesKycEntityPlace"] | null; // DowJonesKycEntityPlace
    name: string; // String!
    placeOfBirth: NexusGenRootTypes["DowJonesKycEntityPlace"] | null; // DowJonesKycEntityPlace
    profileId: string; // ID!
    relationships: NexusGenRootTypes["DowJonesKycEntityRelationship"][]; // [DowJonesKycEntityRelationship!]!
    residence: NexusGenRootTypes["DowJonesKycEntityPlace"] | null; // DowJonesKycEntityPlace
    sanctions: NexusGenRootTypes["DowJonesKycEntitySanction"][]; // [DowJonesKycEntitySanction!]!
    type: NexusGenEnums["DowJonesKycEntityType"]; // DowJonesKycEntityType!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  DowJonesKycEntityRelationship: {
    // field return type
    connectionType: string; // String!
    iconHints: string[]; // [String!]!
    name: string | null; // String
    profileId: string; // ID!
    type: NexusGenEnums["DowJonesKycEntityType"]; // DowJonesKycEntityType!
  };
  DowJonesKycEntitySanction: {
    // field return type
    fromDate: NexusGenRootTypes["DowJonesKycEntityDate"] | null; // DowJonesKycEntityDate
    id: string; // ID!
    name: string; // String!
    sources: string[]; // [String!]!
  };
  DowJonesKycEntitySearchResultEntity: {
    // field return type
    countryTerritoryName: string | null; // String
    iconHints: string[]; // [String!]!
    id: string; // ID!
    isSubsidiary: boolean; // Boolean!
    name: string; // String!
    profileId: string; // ID!
    title: string; // String!
    type: NexusGenEnums["DowJonesKycEntityType"]; // DowJonesKycEntityType!
  };
  DowJonesKycEntitySearchResultPagination: {
    // field return type
    items: NexusGenRootTypes["DowJonesKycEntitySearchResult"][]; // [DowJonesKycEntitySearchResult!]!
    totalCount: number; // Int!
  };
  DowJonesKycEntitySearchResultPerson: {
    // field return type
    countryTerritoryName: string | null; // String
    dateOfBirth: NexusGenRootTypes["DowJonesKycEntityDate"] | null; // DowJonesKycEntityDate
    gender: string; // String!
    iconHints: string[]; // [String!]!
    id: string; // ID!
    isSubsidiary: boolean; // Boolean!
    name: string; // String!
    profileId: string; // ID!
    title: string; // String!
    type: NexusGenEnums["DowJonesKycEntityType"]; // DowJonesKycEntityType!
  };
  EffectivePetitionUserPermission: {
    // field return type
    isSubscribed: boolean; // Boolean!
    permissionType: NexusGenEnums["PetitionPermissionType"]; // PetitionPermissionType!
    user: NexusGenRootTypes["User"]; // User!
  };
  EventSubscriptionSignatureKey: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    publicKey: string; // String!
  };
  FeatureFlagNameValue: {
    // field return type
    name: NexusGenEnums["FeatureFlag"]; // FeatureFlag!
    value: boolean; // Boolean!
  };
  FileUpload: {
    // field return type
    contentType: string; // String!
    filename: string; // String!
    isComplete: boolean; // Boolean!
    size: number; // Int!
  };
  FileUploadDownloadLinkResult: {
    // field return type
    file: NexusGenRootTypes["FileUpload"] | null; // FileUpload
    result: NexusGenEnums["Result"]; // Result!
    url: string | null; // String
  };
  FileUploadReplyResponse: {
    // field return type
    presignedPostData: NexusGenRootTypes["AWSPresignedPostData"]; // AWSPresignedPostData!
    reply: NexusGenRootTypes["PetitionFieldReply"]; // PetitionFieldReply!
  };
  GenerateUserAuthTokenResponse: {
    // field return type
    apiKey: string; // String!
    userAuthToken: NexusGenRootTypes["UserAuthenticationToken"]; // UserAuthenticationToken!
  };
  GroupPermissionAddedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    permissionGroup: NexusGenRootTypes["UserGroup"] | null; // UserGroup
    permissionType: NexusGenEnums["PetitionPermissionType"]; // PetitionPermissionType!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  GroupPermissionEditedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    permissionGroup: NexusGenRootTypes["UserGroup"] | null; // UserGroup
    permissionType: NexusGenEnums["PetitionPermissionType"]; // PetitionPermissionType!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  GroupPermissionRemovedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    permissionGroup: NexusGenRootTypes["UserGroup"] | null; // UserGroup
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  IOrgIntegrationPagination: {
    // field return type
    items: NexusGenRootTypes["IOrgIntegration"][]; // [IOrgIntegration!]!
    totalCount: number; // Int!
  };
  LandingTemplate: {
    // field return type
    backgroundColor: string | null; // String
    categories: string[] | null; // [String!]
    descriptionHtml: string | null; // String
    fieldCount: number; // Int!
    fields: NexusGenRootTypes["LandingTemplateField"][]; // [LandingTemplateField!]!
    hasConditionals: boolean; // Boolean!
    id: NexusGenScalars["GID"]; // GID!
    imageUrl: string | null; // String
    locale: NexusGenEnums["PetitionLocale"]; // PetitionLocale!
    name: string | null; // String
    organizationName: string; // String!
    ownerAvatarUrl: string | null; // String
    ownerFullName: string; // String!
    publicLinkUrl: string | null; // String
    shortDescription: string | null; // String
    slug: string; // String!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  LandingTemplateCategorySample: {
    // field return type
    category: string; // String!
    templates: NexusGenRootTypes["LandingTemplatePagination"]; // LandingTemplatePagination!
  };
  LandingTemplateField: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    title: string | null; // String
    type: NexusGenEnums["PetitionFieldType"]; // PetitionFieldType!
  };
  LandingTemplatePagination: {
    // field return type
    items: NexusGenRootTypes["LandingTemplate"][]; // [LandingTemplate!]!
    totalCount: number; // Int!
  };
  MessageCancelledEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    message: NexusGenRootTypes["PetitionMessage"]; // PetitionMessage!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    reason: string; // String!
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  MessageEmailBouncedUserNotification: {
    // field return type
    access: NexusGenRootTypes["PetitionAccess"]; // PetitionAccess!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    isRead: boolean; // Boolean!
    petition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
  };
  MessageScheduledEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    message: NexusGenRootTypes["PetitionMessage"]; // PetitionMessage!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
  };
  MessageSentEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    message: NexusGenRootTypes["PetitionMessage"]; // PetitionMessage!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
  };
  Mutation: {
    // field return type
    activateUser: NexusGenRootTypes["User"][]; // [User!]!
    addPetitionPermission: NexusGenRootTypes["PetitionBase"][]; // [PetitionBase!]!
    addUsersToUserGroup: NexusGenRootTypes["UserGroup"]; // UserGroup!
    anonymizePetition: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    approveOrRejectPetitionFieldReplies: NexusGenRootTypes["Petition"]; // Petition!
    bulkCreateContacts: NexusGenRootTypes["BulkCreateContactsReturnType"]; // BulkCreateContactsReturnType!
    bulkCreatePetitionReplies: NexusGenRootTypes["Petition"]; // Petition!
    cancelScheduledMessage: NexusGenRootTypes["PetitionMessage"] | null; // PetitionMessage
    cancelSignatureRequest: NexusGenRootTypes["PetitionSignatureRequest"]; // PetitionSignatureRequest!
    changeOrganization: NexusGenEnums["Result"]; // Result!
    changePassword: NexusGenEnums["ChangePasswordResult"]; // ChangePasswordResult!
    changePetitionFieldType: NexusGenRootTypes["PetitionField"]; // PetitionField!
    clonePetitionField: NexusGenRootTypes["PetitionField"]; // PetitionField!
    clonePetitions: NexusGenRootTypes["PetitionBase"][]; // [PetitionBase!]!
    cloneUserGroups: NexusGenRootTypes["UserGroup"][]; // [UserGroup!]!
    closePetition: NexusGenRootTypes["Petition"]; // Petition!
    completePetition: NexusGenRootTypes["Petition"]; // Petition!
    createContact: NexusGenRootTypes["Contact"]; // Contact!
    createDowJonesKycIntegration: NexusGenRootTypes["OrgIntegration"]; // OrgIntegration!
    createDowJonesKycReply: NexusGenRootTypes["PetitionFieldReply"]; // PetitionFieldReply!
    createDowJonesProfileDownloadTask: NexusGenRootTypes["Task"]; // Task!
    createEventSubscription: NexusGenRootTypes["PetitionEventSubscription"]; // PetitionEventSubscription!
    createEventSubscriptionSignatureKey: NexusGenRootTypes["EventSubscriptionSignatureKey"]; // EventSubscriptionSignatureKey!
    createExportExcelTask: NexusGenRootTypes["Task"]; // Task!
    createExportRepliesTask: NexusGenRootTypes["Task"]; // Task!
    createFileUploadReply: NexusGenRootTypes["FileUploadReplyResponse"]; // FileUploadReplyResponse!
    createFileUploadReplyComplete: NexusGenRootTypes["PetitionFieldReply"]; // PetitionFieldReply!
    createOrganization: NexusGenRootTypes["Organization"]; // Organization!
    createOrganizationPdfDocumentTheme: NexusGenRootTypes["Organization"]; // Organization!
    createPetition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    createPetitionAccess: NexusGenRootTypes["PetitionAccess"]; // PetitionAccess!
    createPetitionAttachmentUploadLink: NexusGenRootTypes["PetitionAttachmentUploadData"][]; // [PetitionAttachmentUploadData!]!
    createPetitionField: NexusGenRootTypes["PetitionField"]; // PetitionField!
    createPetitionFieldAttachmentUploadLink: NexusGenRootTypes["PetitionFieldAttachmentUploadData"]; // PetitionFieldAttachmentUploadData!
    createPetitionFieldComment: NexusGenRootTypes["PetitionFieldComment"]; // PetitionFieldComment!
    createPetitionFieldReply: NexusGenRootTypes["PetitionFieldReply"]; // PetitionFieldReply!
    createPetitionListView: NexusGenRootTypes["PetitionListView"]; // PetitionListView!
    createPrintPdfTask: NexusGenRootTypes["Task"]; // Task!
    createProfile: NexusGenRootTypes["Profile"]; // Profile!
    createProfileType: NexusGenRootTypes["ProfileType"]; // ProfileType!
    createProfileTypeField: NexusGenRootTypes["ProfileTypeField"]; // ProfileTypeField!
    createPublicPetitionLink: NexusGenRootTypes["PublicPetitionLink"]; // PublicPetitionLink!
    createPublicPetitionLinkPrefillData: string; // String!
    createSignaturitIntegration: NexusGenRootTypes["SignatureOrgIntegration"]; // SignatureOrgIntegration!
    createTag: NexusGenRootTypes["Tag"]; // Tag!
    createTemplateRepliesReportTask: NexusGenRootTypes["Task"]; // Task!
    createTemplateStatsReportTask: NexusGenRootTypes["Task"]; // Task!
    createTemplatesOverviewReportTask: NexusGenRootTypes["Task"]; // Task!
    createUserGroup: NexusGenRootTypes["UserGroup"]; // UserGroup!
    deactivateAccesses: NexusGenRootTypes["PetitionAccess"][]; // [PetitionAccess!]!
    deactivateUser: NexusGenRootTypes["User"][]; // [User!]!
    deleteContacts: NexusGenEnums["Result"]; // Result!
    deleteDowJonesKycIntegration: NexusGenRootTypes["Organization"]; // Organization!
    deleteEventSubscriptionSignatureKeys: NexusGenEnums["Result"]; // Result!
    deleteEventSubscriptions: NexusGenEnums["Result"]; // Result!
    deleteOrganizationPdfDocumentTheme: NexusGenRootTypes["Organization"]; // Organization!
    deletePetitionAttachment: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    deletePetitionField: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    deletePetitionFieldAttachment: NexusGenRootTypes["PetitionField"]; // PetitionField!
    deletePetitionFieldComment: NexusGenRootTypes["PetitionField"]; // PetitionField!
    deletePetitionListView: NexusGenRootTypes["User"]; // User!
    deletePetitionReply: NexusGenRootTypes["PetitionField"]; // PetitionField!
    deletePetitions: NexusGenEnums["Success"]; // Success!
    deleteProfile: NexusGenEnums["Success"]; // Success!
    deleteProfileType: NexusGenEnums["Success"]; // Success!
    deleteProfileTypeField: NexusGenRootTypes["ProfileType"]; // ProfileType!
    deleteSignatureIntegration: NexusGenEnums["Result"]; // Result!
    deleteTag: NexusGenEnums["Result"]; // Result!
    deleteUserGroup: NexusGenEnums["Result"]; // Result!
    dynamicSelectFieldFileDownloadLink: NexusGenRootTypes["FileUploadDownloadLinkResult"]; // FileUploadDownloadLinkResult!
    editPetitionPermission: NexusGenRootTypes["PetitionBase"][]; // [PetitionBase!]!
    fileUploadReplyDownloadLink: NexusGenRootTypes["FileUploadDownloadLinkResult"]; // FileUploadDownloadLinkResult!
    forceUpdateSignatureOrganizationBrandings: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    generateUserAuthToken: NexusGenRootTypes["GenerateUserAuthTokenResponse"]; // GenerateUserAuthTokenResponse!
    getTaskResultFile: NexusGenRootTypes["TaskResultFile"]; // TaskResultFile!
    importPetitionFromJson: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    inviteUserToOrganization: NexusGenRootTypes["User"]; // User!
    loginAs: NexusGenEnums["Result"]; // Result!
    markPetitionListViewAsDefault: NexusGenRootTypes["User"]; // User!
    markSignatureIntegrationAsDefault: NexusGenRootTypes["IOrgIntegration"]; // IOrgIntegration!
    modifyCurrentUsagePeriod: NexusGenRootTypes["Organization"]; // Organization!
    modifyPetitionCustomProperty: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    movePetitions: NexusGenEnums["Success"]; // Success!
    petitionAttachmentDownloadLink: NexusGenRootTypes["FileUploadDownloadLinkResult"]; // FileUploadDownloadLinkResult!
    petitionAttachmentUploadComplete: NexusGenRootTypes["PetitionAttachment"]; // PetitionAttachment!
    petitionFieldAttachmentDownloadLink: NexusGenRootTypes["FileUploadDownloadLinkResult"]; // FileUploadDownloadLinkResult!
    petitionFieldAttachmentUploadComplete: NexusGenRootTypes["PetitionFieldAttachment"]; // PetitionFieldAttachment!
    publicCheckVerificationCode: NexusGenRootTypes["VerificationCodeCheck"]; // VerificationCodeCheck!
    publicCompletePetition: NexusGenRootTypes["PublicPetition"]; // PublicPetition!
    publicCreateAndSendPetitionFromPublicLink: NexusGenEnums["Result"]; // Result!
    publicCreateFileUploadReply: NexusGenRootTypes["PublicCreateFileUploadReply"]; // PublicCreateFileUploadReply!
    publicCreatePetitionFieldComment: NexusGenRootTypes["PublicPetitionFieldComment"]; // PublicPetitionFieldComment!
    publicCreatePetitionFieldReply: NexusGenRootTypes["PublicPetitionFieldReply"]; // PublicPetitionFieldReply!
    publicCreatePrintPdfTask: NexusGenRootTypes["Task"]; // Task!
    publicDelegateAccessToContact: NexusGenRootTypes["PublicPetitionAccess"]; // PublicPetitionAccess!
    publicDeletePetitionFieldComment: NexusGenRootTypes["PublicPetitionField"]; // PublicPetitionField!
    publicDeletePetitionFieldReply: NexusGenRootTypes["PublicPetitionField"]; // PublicPetitionField!
    publicFileUploadReplyComplete: NexusGenRootTypes["PublicPetitionFieldReply"]; // PublicPetitionFieldReply!
    publicFileUploadReplyDownloadLink: NexusGenRootTypes["FileUploadDownloadLinkResult"]; // FileUploadDownloadLinkResult!
    publicGetTaskResultFileUrl: string; // String!
    publicMarkPetitionFieldCommentsAsRead: NexusGenRootTypes["PublicPetitionFieldComment"][]; // [PublicPetitionFieldComment!]!
    publicPetitionFieldAttachmentDownloadLink: NexusGenRootTypes["FileUploadDownloadLinkResult"]; // FileUploadDownloadLinkResult!
    publicRemindersOptOut: NexusGenEnums["Result"]; // Result!
    publicResetTempPassword: NexusGenEnums["Result"]; // Result!
    publicSendReminder: NexusGenEnums["Result"]; // Result!
    publicSendVerificationCode: NexusGenRootTypes["VerificationCodeRequest"]; // VerificationCodeRequest!
    publicStartAsyncFieldCompletion: NexusGenRootTypes["AsyncFieldCompletionResponse"]; // AsyncFieldCompletionResponse!
    publicUpdatePetitionFieldComment: NexusGenRootTypes["PublicPetitionFieldComment"]; // PublicPetitionFieldComment!
    publicUpdatePetitionFieldReply: NexusGenRootTypes["PublicPetitionFieldReply"]; // PublicPetitionFieldReply!
    reactivateAccesses: NexusGenRootTypes["PetitionAccess"][]; // [PetitionAccess!]!
    removePetitionPassword: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    removePetitionPermission: Array<NexusGenRootTypes["PetitionBase"] | null>; // [PetitionBase]!
    removeUsersFromGroup: NexusGenRootTypes["UserGroup"]; // UserGroup!
    renameFolder: NexusGenEnums["Success"]; // Success!
    reopenPetition: NexusGenRootTypes["Petition"]; // Petition!
    reorderPetitionAttachments: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    reorderPetitionListViews: NexusGenRootTypes["User"]; // User!
    resendVerificationEmail: NexusGenEnums["Result"]; // Result!
    resetTempPassword: NexusGenEnums["Result"]; // Result!
    resetUserPassword: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    restoreDeletedPetition: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    restoreLogin: NexusGenEnums["Result"]; // Result!
    revokeUserAuthToken: NexusGenEnums["Result"]; // Result!
    sendPetition: NexusGenRootTypes["SendPetitionResult"][]; // [SendPetitionResult!]!
    sendPetitionClosedNotification: NexusGenRootTypes["Petition"]; // Petition!
    sendReminders: NexusGenEnums["Result"]; // Result!
    sendSignatureRequestReminders: NexusGenEnums["Result"]; // Result!
    setUserDelegates: NexusGenRootTypes["User"]; // User!
    shareSignaturitApiKey: NexusGenRootTypes["Organization"]; // Organization!
    signUp: NexusGenRootTypes["User"]; // User!
    signaturitIntegrationShowSecurityStamp: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    signedPetitionDownloadLink: NexusGenRootTypes["FileUploadDownloadLinkResult"]; // FileUploadDownloadLinkResult!
    startAsyncFieldCompletion: NexusGenRootTypes["AsyncFieldCompletionResponse"]; // AsyncFieldCompletionResponse!
    startSignatureRequest: NexusGenRootTypes["PetitionSignatureRequest"]; // PetitionSignatureRequest!
    switchAutomaticReminders: NexusGenRootTypes["PetitionAccess"][]; // [PetitionAccess!]!
    tagPetition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    transferOrganizationOwnership: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    transferPetitionOwnership: NexusGenRootTypes["PetitionBase"][]; // [PetitionBase!]!
    untagPetition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    updateContact: NexusGenRootTypes["Contact"]; // Contact!
    updateEventSubscription: NexusGenRootTypes["PetitionEventSubscription"]; // PetitionEventSubscription!
    updateFeatureFlags: NexusGenRootTypes["Organization"]; // Organization!
    updateFieldPositions: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    updateFileUploadReply: NexusGenRootTypes["FileUploadReplyResponse"]; // FileUploadReplyResponse!
    updateFileUploadReplyComplete: NexusGenRootTypes["PetitionFieldReply"]; // PetitionFieldReply!
    updateLandingTemplateMetadata: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    updateOrganizationAutoAnonymizePeriod: NexusGenRootTypes["Organization"]; // Organization!
    updateOrganizationBrandTheme: NexusGenRootTypes["Organization"]; // Organization!
    updateOrganizationLogo: NexusGenRootTypes["Organization"]; // Organization!
    updateOrganizationPdfDocumentTheme: NexusGenRootTypes["Organization"]; // Organization!
    updateOrganizationTier: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    updateOrganizationUsageDetails: NexusGenRootTypes["Organization"]; // Organization!
    updateOrganizationUser: NexusGenRootTypes["User"]; // User!
    updateOrganizationUserLimit: NexusGenRootTypes["Organization"]; // Organization!
    updatePetition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    updatePetitionAttachmentType: NexusGenRootTypes["PetitionAttachment"]; // PetitionAttachment!
    updatePetitionField: NexusGenRootTypes["PetitionField"]; // PetitionField!
    updatePetitionFieldComment: NexusGenRootTypes["PetitionFieldComment"]; // PetitionFieldComment!
    updatePetitionFieldRepliesStatus: NexusGenRootTypes["PetitionField"]; // PetitionField!
    updatePetitionFieldReply: NexusGenRootTypes["PetitionFieldReply"]; // PetitionFieldReply!
    updatePetitionFieldReplyMetadata: NexusGenRootTypes["PetitionFieldReply"]; // PetitionFieldReply!
    updatePetitionListView: NexusGenRootTypes["PetitionListView"]; // PetitionListView!
    updatePetitionMetadata: NexusGenRootTypes["Petition"]; // Petition!
    updatePetitionPermissionSubscription: NexusGenRootTypes["Petition"]; // Petition!
    updatePetitionRestriction: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    updatePetitionUserNotificationReadStatus: NexusGenRootTypes["PetitionUserNotification"][]; // [PetitionUserNotification!]!
    updateProfileType: NexusGenRootTypes["ProfileType"]; // ProfileType!
    updateProfileTypeField: NexusGenRootTypes["ProfileTypeField"]; // ProfileTypeField!
    updateProfileTypeFieldPositions: NexusGenRootTypes["ProfileType"]; // ProfileType!
    updatePublicPetitionLink: NexusGenRootTypes["PublicPetitionLink"]; // PublicPetitionLink!
    updatePublicTemplateVisibility: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    updateSignatureRequestMetadata: NexusGenRootTypes["PetitionSignatureRequest"]; // PetitionSignatureRequest!
    updateTag: NexusGenRootTypes["Tag"]; // Tag!
    updateTemplateDefaultPermissions: NexusGenRootTypes["PetitionTemplate"]; // PetitionTemplate!
    updateTemplateDocumentTheme: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    updateUser: NexusGenRootTypes["User"]; // User!
    updateUserGroup: NexusGenRootTypes["UserGroup"]; // UserGroup!
    updateUserPreferredLocale: NexusGenRootTypes["User"]; // User!
    uploadDynamicSelectFieldFile: NexusGenRootTypes["PetitionField"]; // PetitionField!
    uploadUserAvatar: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    verifyPublicAccess: NexusGenRootTypes["PublicAccessVerification"]; // PublicAccessVerification!
  };
  OrgIntegration: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    invalidCredentials: boolean; // Boolean!
    isDefault: boolean; // Boolean!
    name: string; // String!
    type: NexusGenEnums["IntegrationType"]; // IntegrationType!
  };
  OrgLicense: {
    // field return type
    externalId: string; // String!
    name: string; // String!
    source: NexusGenEnums["OrgLicenseSource"]; // OrgLicenseSource!
  };
  Organization: {
    // field return type
    activeUserCount: number; // Int!
    anonymizePetitionsAfterMonths: number | null; // Int
    brandTheme: NexusGenRootTypes["OrganizationBrandThemeData"]; // OrganizationBrandThemeData!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    currentUsagePeriod: NexusGenRootTypes["OrganizationUsageLimit"] | null; // OrganizationUsageLimit
    customHost: string | null; // String
    features: NexusGenRootTypes["FeatureFlagNameValue"][]; // [FeatureFlagNameValue!]!
    hasIntegration: boolean; // Boolean!
    hasSsoProvider: boolean; // Boolean!
    iconUrl: string | null; // String
    id: NexusGenScalars["GID"]; // GID!
    integrations: NexusGenRootTypes["IOrgIntegrationPagination"]; // IOrgIntegrationPagination!
    isUsageLimitReached: boolean; // Boolean!
    license: NexusGenRootTypes["OrgLicense"] | null; // OrgLicense
    logoUrl: string | null; // String
    name: string; // String!
    pdfDocumentThemes: NexusGenRootTypes["OrganizationTheme"][]; // [OrganizationTheme!]!
    status: NexusGenEnums["OrganizationStatus"]; // OrganizationStatus!
    subscriptionEndDate: NexusGenScalars["DateTime"] | null; // DateTime
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
    usageDetails: NexusGenScalars["JSONObject"]; // JSONObject!
    usagePeriods: NexusGenRootTypes["OrganizationUsageLimitPagination"]; // OrganizationUsageLimitPagination!
    users: NexusGenRootTypes["UserPagination"]; // UserPagination!
  };
  OrganizationBrandThemeData: {
    // field return type
    color: string; // String!
    fontFamily: string | null; // String
    preferredTone: NexusGenEnums["Tone"]; // Tone!
  };
  OrganizationPagination: {
    // field return type
    items: NexusGenRootTypes["Organization"][]; // [Organization!]!
    totalCount: number; // Int!
  };
  OrganizationTheme: {
    // field return type
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    isDefault: boolean; // Boolean!
    name: string; // String!
  };
  OrganizationUsageLimit: {
    // field return type
    cycleNumber: number; // Int!
    id: NexusGenScalars["GID"]; // GID!
    limit: number; // Int!
    period: NexusGenScalars["Duration"]; // Duration!
    periodEndDate: NexusGenScalars["DateTime"] | null; // DateTime
    periodStartDate: NexusGenScalars["DateTime"]; // DateTime!
    used: number; // Int!
  };
  OrganizationUsageLimitPagination: {
    // field return type
    items: NexusGenRootTypes["OrganizationUsageLimit"][]; // [OrganizationUsageLimit!]!
    totalCount: number; // Int!
  };
  OwnershipTransferredEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    owner: NexusGenRootTypes["User"] | null; // User
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    previousOwner: NexusGenRootTypes["User"] | null; // User
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  Petition: {
    // field return type
    accesses: NexusGenRootTypes["PetitionAccess"][]; // [PetitionAccess!]!
    anonymizeAfterMonths: number | null; // Int
    anonymizePurpose: string | null; // String
    attachmentsList: NexusGenRootTypes["PetitionAttachmentsList"]; // PetitionAttachmentsList!
    closedAt: NexusGenScalars["DateTime"] | null; // DateTime
    closingEmailBody: NexusGenScalars["JSON"] | null; // JSON
    completingMessageBody: NexusGenScalars["JSON"] | null; // JSON
    completingMessageSubject: string | null; // String
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    currentSignatureRequest: NexusGenRootTypes["PetitionSignatureRequest"] | null; // PetitionSignatureRequest
    customProperties: NexusGenScalars["JSONObject"]; // JSONObject!
    deadline: NexusGenScalars["DateTime"] | null; // DateTime
    defaultOnBehalf: NexusGenRootTypes["User"] | null; // User
    effectivePermissions: NexusGenRootTypes["EffectivePetitionUserPermission"][]; // [EffectivePetitionUserPermission!]!
    emailBody: NexusGenScalars["JSON"] | null; // JSON
    emailSubject: string | null; // String
    events: NexusGenRootTypes["PetitionEventPagination"]; // PetitionEventPagination!
    fieldCount: number; // Int!
    fields: NexusGenRootTypes["PetitionField"][]; // [PetitionField!]!
    fromTemplate: NexusGenRootTypes["PetitionBaseMini"] | null; // PetitionBaseMini
    id: NexusGenScalars["GID"]; // GID!
    isAnonymized: boolean; // Boolean!
    isCompletingMessageEnabled: boolean; // Boolean!
    isRecipientViewContentsHidden: boolean; // Boolean!
    isRestricted: boolean; // Boolean!
    isRestrictedWithPassword: boolean; // Boolean!
    locale: NexusGenEnums["PetitionLocale"]; // PetitionLocale!
    metadata: NexusGenScalars["JSONObject"]; // JSONObject!
    myEffectivePermission: NexusGenRootTypes["EffectivePetitionUserPermission"] | null; // EffectivePetitionUserPermission
    name: string | null; // String
    organization: NexusGenRootTypes["Organization"]; // Organization!
    owner: NexusGenRootTypes["User"]; // User!
    path: string; // String!
    permissions: NexusGenRootTypes["PetitionPermission"][]; // [PetitionPermission!]!
    progress: NexusGenRootTypes["PetitionProgress"]; // PetitionProgress!
    remindersConfig: NexusGenRootTypes["RemindersConfig"] | null; // RemindersConfig
    selectedDocumentTheme: NexusGenRootTypes["OrganizationTheme"]; // OrganizationTheme!
    sentAt: NexusGenScalars["DateTime"] | null; // DateTime
    signatureConfig: NexusGenRootTypes["SignatureConfig"] | null; // SignatureConfig
    signatureRequests: NexusGenRootTypes["PetitionSignatureRequest"][]; // [PetitionSignatureRequest!]!
    skipForwardSecurity: boolean; // Boolean!
    status: NexusGenEnums["PetitionStatus"]; // PetitionStatus!
    tags: NexusGenRootTypes["Tag"][]; // [Tag!]!
    tone: NexusGenEnums["Tone"]; // Tone!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  PetitionAccess: {
    // field return type
    contact: NexusGenRootTypes["Contact"] | null; // Contact
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    delegateGranter: NexusGenRootTypes["User"] | null; // User
    granter: NexusGenRootTypes["User"] | null; // User
    id: NexusGenScalars["GID"]; // GID!
    isContactless: boolean; // Boolean!
    nextReminderAt: NexusGenScalars["DateTime"] | null; // DateTime
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    recipientUrl: string | null; // String
    reminderCount: number; // Int!
    reminders: NexusGenRootTypes["PetitionReminder"][]; // [PetitionReminder!]!
    remindersActive: boolean; // Boolean!
    remindersConfig: NexusGenRootTypes["RemindersConfig"] | null; // RemindersConfig
    remindersLeft: number; // Int!
    remindersOptOut: boolean; // Boolean!
    status: NexusGenEnums["PetitionAccessStatus"]; // PetitionAccessStatus!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  PetitionAccessPagination: {
    // field return type
    items: NexusGenRootTypes["PetitionAccess"][]; // [PetitionAccess!]!
    totalCount: number; // Int!
  };
  PetitionAnonymizedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
  };
  PetitionAttachment: {
    // field return type
    file: NexusGenRootTypes["FileUpload"]; // FileUpload!
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    type: NexusGenEnums["PetitionAttachmentType"]; // PetitionAttachmentType!
  };
  PetitionAttachmentUploadData: {
    // field return type
    attachment: NexusGenRootTypes["PetitionAttachment"]; // PetitionAttachment!
    presignedPostData: NexusGenRootTypes["AWSPresignedPostData"]; // AWSPresignedPostData!
  };
  PetitionAttachmentsList: {
    // field return type
    ANNEX: NexusGenRootTypes["PetitionAttachment"][]; // [PetitionAttachment!]!
    BACK: NexusGenRootTypes["PetitionAttachment"][]; // [PetitionAttachment!]!
    FRONT: NexusGenRootTypes["PetitionAttachment"][]; // [PetitionAttachment!]!
  };
  PetitionBaseMini: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    name: string | null; // String
  };
  PetitionBaseOrFolderPagination: {
    // field return type
    items: NexusGenRootTypes["PetitionBaseOrFolder"][]; // [PetitionBaseOrFolder!]!
    totalCount: number; // Int!
  };
  PetitionClonedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  PetitionClosedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  PetitionClosedNotifiedEvent: {
    // field return type
    access: NexusGenRootTypes["PetitionAccess"]; // PetitionAccess!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  PetitionCompletedEvent: {
    // field return type
    completedBy: NexusGenRootTypes["UserOrPetitionAccess"] | null; // UserOrPetitionAccess
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
  };
  PetitionCompletedUserNotification: {
    // field return type
    completedBy: NexusGenRootTypes["UserOrPetitionAccess"] | null; // UserOrPetitionAccess
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    isRead: boolean; // Boolean!
    petition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
  };
  PetitionCreatedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  PetitionDeletedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
  };
  PetitionEventPagination: {
    // field return type
    items: NexusGenRootTypes["PetitionEvent"][]; // [PetitionEvent!]!
    totalCount: number; // Int!
  };
  PetitionEventSubscription: {
    // field return type
    eventTypes: NexusGenEnums["PetitionEventType"][] | null; // [PetitionEventType!]
    eventsUrl: string; // String!
    fromTemplate: NexusGenRootTypes["PetitionBaseMini"] | null; // PetitionBaseMini
    id: NexusGenScalars["GID"]; // GID!
    isEnabled: boolean; // Boolean!
    isFailing: boolean; // Boolean!
    name: string | null; // String
    signatureKeys: NexusGenRootTypes["EventSubscriptionSignatureKey"][]; // [EventSubscriptionSignatureKey!]!
  };
  PetitionField: {
    // field return type
    alias: string | null; // String
    attachments: NexusGenRootTypes["PetitionFieldAttachment"][]; // [PetitionFieldAttachment!]!
    commentCount: number; // Int!
    comments: NexusGenRootTypes["PetitionFieldComment"][]; // [PetitionFieldComment!]!
    description: string | null; // String
    fromPetitionFieldId: NexusGenScalars["GID"] | null; // GID
    hasCommentsEnabled: boolean; // Boolean!
    id: NexusGenScalars["GID"]; // GID!
    isFixed: boolean; // Boolean!
    isInternal: boolean; // Boolean!
    isReadOnly: boolean; // Boolean!
    multiple: boolean; // Boolean!
    optional: boolean; // Boolean!
    options: NexusGenScalars["JSONObject"]; // JSONObject!
    petition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    position: number; // Int!
    replies: NexusGenRootTypes["PetitionFieldReply"][]; // [PetitionFieldReply!]!
    showActivityInPdf: boolean; // Boolean!
    showInPdf: boolean; // Boolean!
    title: string | null; // String
    type: NexusGenEnums["PetitionFieldType"]; // PetitionFieldType!
    unreadCommentCount: number; // Int!
    visibility: NexusGenScalars["JSONObject"] | null; // JSONObject
  };
  PetitionFieldAttachment: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    field: NexusGenRootTypes["PetitionField"]; // PetitionField!
    file: NexusGenRootTypes["FileUpload"]; // FileUpload!
    id: NexusGenScalars["GID"]; // GID!
  };
  PetitionFieldAttachmentUploadData: {
    // field return type
    attachment: NexusGenRootTypes["PetitionFieldAttachment"]; // PetitionFieldAttachment!
    presignedPostData: NexusGenRootTypes["AWSPresignedPostData"]; // AWSPresignedPostData!
  };
  PetitionFieldComment: {
    // field return type
    author: NexusGenRootTypes["UserOrPetitionAccess"] | null; // UserOrPetitionAccess
    content: NexusGenScalars["JSON"] | null; // JSON
    contentHtml: string | null; // String
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    field: NexusGenRootTypes["PetitionField"]; // PetitionField!
    id: NexusGenScalars["GID"]; // GID!
    isAnonymized: boolean; // Boolean!
    isEdited: boolean; // Boolean!
    isInternal: boolean; // Boolean!
    isUnread: boolean; // Boolean!
    mentions: NexusGenRootTypes["PetitionFieldCommentMention"][]; // [PetitionFieldCommentMention!]!
  };
  PetitionFieldCommentUserGroupMention: {
    // field return type
    mentionedId: NexusGenScalars["GID"]; // GID!
    userGroup: NexusGenRootTypes["UserGroup"] | null; // UserGroup
  };
  PetitionFieldCommentUserMention: {
    // field return type
    mentionedId: NexusGenScalars["GID"]; // GID!
    user: NexusGenRootTypes["User"] | null; // User
  };
  PetitionFieldProgress: {
    // field return type
    approved: number; // Int!
    optional: number; // Int!
    replied: number; // Int!
    total: number; // Int!
  };
  PetitionFieldReply: {
    // field return type
    approvedAt: NexusGenScalars["DateTime"] | null; // DateTime
    approvedBy: NexusGenRootTypes["User"] | null; // User
    content: NexusGenScalars["JSONObject"]; // JSONObject!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    field: NexusGenRootTypes["PetitionField"] | null; // PetitionField
    id: NexusGenScalars["GID"]; // GID!
    isAnonymized: boolean; // Boolean!
    metadata: NexusGenScalars["JSONObject"]; // JSONObject!
    repliedAt: NexusGenScalars["DateTime"]; // DateTime!
    repliedBy: NexusGenRootTypes["UserOrPetitionAccess"] | null; // UserOrPetitionAccess
    status: NexusGenEnums["PetitionFieldReplyStatus"]; // PetitionFieldReplyStatus!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
    updatedBy: NexusGenRootTypes["UserOrPetitionAccess"] | null; // UserOrPetitionAccess
  };
  PetitionFolder: {
    // field return type
    id: string; // ID!
    minimumPermissionType: NexusGenEnums["PetitionPermissionType"]; // PetitionPermissionType!
    name: string; // String!
    path: string; // String!
    petitionCount: number; // Int!
  };
  PetitionListView: {
    // field return type
    data: NexusGenRootTypes["PetitionListViewData"]; // PetitionListViewData!
    id: NexusGenScalars["GID"]; // GID!
    isDefault: boolean; // Boolean!
    name: string; // String!
    user: NexusGenRootTypes["User"]; // User!
  };
  PetitionListViewData: {
    // field return type
    fromTemplateId: NexusGenScalars["GID"][] | null; // [GID!]
    path: string; // String!
    search: string | null; // String
    searchIn: NexusGenEnums["PetitionListViewSearchIn"]; // PetitionListViewSearchIn!
    sharedWith: NexusGenRootTypes["PetitionListViewDataSharedWith"] | null; // PetitionListViewDataSharedWith
    signature: NexusGenEnums["PetitionSignatureStatusFilter"][] | null; // [PetitionSignatureStatusFilter!]
    sort: NexusGenRootTypes["PetitionListViewSort"] | null; // PetitionListViewSort
    status: NexusGenEnums["PetitionStatus"][] | null; // [PetitionStatus!]
    tags: NexusGenScalars["GID"][] | null; // [GID!]
    tagsFilters: NexusGenRootTypes["PetitionListViewDataTags"] | null; // PetitionListViewDataTags
  };
  PetitionListViewDataSharedWith: {
    // field return type
    filters: NexusGenRootTypes["PetitionListViewDataSharedWithFilters"][]; // [PetitionListViewDataSharedWithFilters!]!
    operator: NexusGenEnums["FilterSharedWithLogicalOperator"]; // FilterSharedWithLogicalOperator!
  };
  PetitionListViewDataSharedWithFilters: {
    // field return type
    operator: NexusGenEnums["FilterSharedWithOperator"]; // FilterSharedWithOperator!
    value: string; // ID!
  };
  PetitionListViewDataTags: {
    // field return type
    filters: NexusGenRootTypes["PetitionListViewDataTagsFilters"][]; // [PetitionListViewDataTagsFilters!]!
    operator: NexusGenEnums["PetitionTagFilterLogicalOperator"]; // PetitionTagFilterLogicalOperator!
  };
  PetitionListViewDataTagsFilters: {
    // field return type
    operator: NexusGenEnums["PetitionTagFilterLineOperator"]; // PetitionTagFilterLineOperator!
    value: NexusGenScalars["GID"][]; // [GID!]!
  };
  PetitionListViewSort: {
    // field return type
    direction: NexusGenEnums["PetitionListViewSortDirection"]; // PetitionListViewSortDirection!
    field: NexusGenEnums["PetitionListViewSortField"]; // PetitionListViewSortField!
  };
  PetitionMessage: {
    // field return type
    access: NexusGenRootTypes["PetitionAccess"]; // PetitionAccess!
    bouncedAt: NexusGenScalars["DateTime"] | null; // DateTime
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    deliveredAt: NexusGenScalars["DateTime"] | null; // DateTime
    emailBody: string | null; // String
    emailSubject: NexusGenScalars["JSON"] | null; // JSON
    id: NexusGenScalars["GID"]; // GID!
    isAnonymized: boolean; // Boolean!
    openedAt: NexusGenScalars["DateTime"] | null; // DateTime
    scheduledAt: NexusGenScalars["DateTime"] | null; // DateTime
    sender: NexusGenRootTypes["User"]; // User!
    sentAt: NexusGenScalars["DateTime"] | null; // DateTime
    status: NexusGenEnums["PetitionMessageStatus"]; // PetitionMessageStatus!
  };
  PetitionMessageBouncedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    message: NexusGenRootTypes["PetitionMessage"]; // PetitionMessage!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
  };
  PetitionProgress: {
    // field return type
    external: NexusGenRootTypes["PetitionFieldProgress"]; // PetitionFieldProgress!
    internal: NexusGenRootTypes["PetitionFieldProgress"]; // PetitionFieldProgress!
  };
  PetitionReminder: {
    // field return type
    access: NexusGenRootTypes["PetitionAccess"]; // PetitionAccess!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    emailBody: string | null; // String
    id: NexusGenScalars["GID"]; // GID!
    sender: NexusGenRootTypes["User"] | null; // User
    type: NexusGenEnums["PetitionReminderType"]; // PetitionReminderType!
  };
  PetitionReminderBouncedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    reminder: NexusGenRootTypes["PetitionReminder"]; // PetitionReminder!
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
  };
  PetitionReopenedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  PetitionSharedUserNotification: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    isRead: boolean; // Boolean!
    owner: NexusGenRootTypes["User"]; // User!
    permissionType: NexusGenEnums["PetitionPermissionTypeRW"]; // PetitionPermissionTypeRW!
    petition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    sharedWith: NexusGenRootTypes["UserOrUserGroup"] | null; // UserOrUserGroup
  };
  PetitionSignatureRequest: {
    // field return type
    auditTrailFilename: string | null; // String
    cancelReason: string | null; // String
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    environment: NexusGenEnums["SignatureOrgIntegrationEnvironment"]; // SignatureOrgIntegrationEnvironment!
    id: NexusGenScalars["GID"]; // GID!
    isAnonymized: boolean; // Boolean!
    metadata: NexusGenScalars["JSONObject"]; // JSONObject!
    petition: NexusGenRootTypes["Petition"]; // Petition!
    signatureConfig: NexusGenRootTypes["SignatureConfig"]; // SignatureConfig!
    signedDocumentFilename: string | null; // String
    signerStatus: NexusGenRootTypes["PetitionSignatureRequestSignerStatus"][]; // [PetitionSignatureRequestSignerStatus!]!
    status: NexusGenEnums["PetitionSignatureRequestStatus"]; // PetitionSignatureRequestStatus!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  PetitionSignatureRequestSignerStatus: {
    // field return type
    bouncedAt: NexusGenScalars["DateTime"] | null; // DateTime
    declinedAt: NexusGenScalars["DateTime"] | null; // DateTime
    openedAt: NexusGenScalars["DateTime"] | null; // DateTime
    sentAt: NexusGenScalars["DateTime"] | null; // DateTime
    signedAt: NexusGenScalars["DateTime"] | null; // DateTime
    signer: NexusGenRootTypes["PetitionSigner"]; // PetitionSigner!
    status: string; // String!
  };
  PetitionSigner: {
    // field return type
    contactId: NexusGenScalars["GID"] | null; // GID
    email: string; // String!
    firstName: string; // String!
    fullName: string; // String!
    lastName: string | null; // String
  };
  PetitionTemplate: {
    // field return type
    anonymizeAfterMonths: number | null; // Int
    anonymizePurpose: string | null; // String
    attachmentsList: NexusGenRootTypes["PetitionAttachmentsList"]; // PetitionAttachmentsList!
    backgroundColor: string | null; // String
    categories: string[] | null; // [String!]
    closingEmailBody: NexusGenScalars["JSON"] | null; // JSON
    completingMessageBody: NexusGenScalars["JSON"] | null; // JSON
    completingMessageSubject: string | null; // String
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    customProperties: NexusGenScalars["JSONObject"]; // JSONObject!
    defaultOnBehalf: NexusGenRootTypes["User"] | null; // User
    defaultPath: string; // String!
    defaultPermissions: NexusGenRootTypes["TemplateDefaultPermission"][]; // [TemplateDefaultPermission!]!
    description: NexusGenScalars["JSON"] | null; // JSON
    descriptionExcerpt: string | null; // String
    descriptionHtml: string | null; // String
    effectiveDefaultPermissions: NexusGenRootTypes["EffectivePetitionUserPermission"][]; // [EffectivePetitionUserPermission!]!
    effectivePermissions: NexusGenRootTypes["EffectivePetitionUserPermission"][]; // [EffectivePetitionUserPermission!]!
    emailBody: NexusGenScalars["JSON"] | null; // JSON
    emailSubject: string | null; // String
    fieldCount: number; // Int!
    fields: NexusGenRootTypes["PetitionField"][]; // [PetitionField!]!
    id: NexusGenScalars["GID"]; // GID!
    imageUrl: string | null; // String
    isAnonymized: boolean; // Boolean!
    isCompletingMessageEnabled: boolean; // Boolean!
    isPublic: boolean; // Boolean!
    isRecipientViewContentsHidden: boolean; // Boolean!
    isRestricted: boolean; // Boolean!
    isRestrictedWithPassword: boolean; // Boolean!
    locale: NexusGenEnums["PetitionLocale"]; // PetitionLocale!
    metadata: NexusGenScalars["JSONObject"]; // JSONObject!
    myEffectivePermission: NexusGenRootTypes["EffectivePetitionUserPermission"] | null; // EffectivePetitionUserPermission
    name: string | null; // String
    organization: NexusGenRootTypes["Organization"]; // Organization!
    owner: NexusGenRootTypes["User"]; // User!
    path: string; // String!
    permissions: NexusGenRootTypes["PetitionPermission"][]; // [PetitionPermission!]!
    publicLink: NexusGenRootTypes["PublicPetitionLink"] | null; // PublicPetitionLink
    remindersConfig: NexusGenRootTypes["RemindersConfig"] | null; // RemindersConfig
    selectedDocumentTheme: NexusGenRootTypes["OrganizationTheme"]; // OrganizationTheme!
    signatureConfig: NexusGenRootTypes["SignatureConfig"] | null; // SignatureConfig
    skipForwardSecurity: boolean; // Boolean!
    tags: NexusGenRootTypes["Tag"][]; // [Tag!]!
    tone: NexusGenEnums["Tone"]; // Tone!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  PetitionUserGroupPermission: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    group: NexusGenRootTypes["UserGroup"]; // UserGroup!
    isSubscribed: boolean; // Boolean!
    permissionType: NexusGenEnums["PetitionPermissionType"]; // PetitionPermissionType!
    petition: NexusGenRootTypes["Petition"]; // Petition!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  PetitionUserPermission: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    isSubscribed: boolean; // Boolean!
    permissionType: NexusGenEnums["PetitionPermissionType"]; // PetitionPermissionType!
    petition: NexusGenRootTypes["Petition"]; // Petition!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
    user: NexusGenRootTypes["User"]; // User!
  };
  Profile: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    fields: NexusGenRootTypes["ProfileFieldAndValue"][]; // [ProfileFieldAndValue!]!
    id: NexusGenScalars["GID"]; // GID!
    name: string; // String!
    profileType: NexusGenRootTypes["ProfileType"]; // ProfileType!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  ProfileFieldAndValue: {
    // field return type
    field: NexusGenRootTypes["ProfileTypeField"]; // ProfileTypeField!
    value: NexusGenRootTypes["ProfileFieldValue"] | null; // ProfileFieldValue
  };
  ProfileFieldValue: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    createdBy: NexusGenRootTypes["User"] | null; // User
    id: NexusGenScalars["GID"]; // GID!
  };
  ProfileType: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    fields: NexusGenRootTypes["ProfileTypeField"][]; // [ProfileTypeField!]!
    id: NexusGenScalars["GID"]; // GID!
    name: NexusGenScalars["LocalizableUserText"]; // LocalizableUserText!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  ProfileTypeField: {
    // field return type
    alias: string | null; // String
    id: NexusGenScalars["GID"]; // GID!
    isExpirable: boolean; // Boolean!
    myPermission: NexusGenEnums["ProfileTypeFieldPermission"]; // ProfileTypeFieldPermission!
    name: NexusGenScalars["LocalizableUserText"]; // LocalizableUserText!
    options: NexusGenScalars["JSONObject"]; // JSONObject!
    position: number; // Int!
    profileType: NexusGenRootTypes["ProfileType"]; // ProfileType!
    type: NexusGenEnums["ProfileTypeFieldType"]; // ProfileTypeFieldType!
  };
  ProfileTypePagination: {
    // field return type
    items: NexusGenRootTypes["ProfileType"][]; // [ProfileType!]!
    totalCount: number; // Int!
  };
  PublicAccessVerification: {
    // field return type
    cookieName: string | null; // String
    cookieValue: string | null; // String
    email: string | null; // String
    isAllowed: boolean; // Boolean!
    isContactlessAccess: boolean | null; // Boolean
    organization: NexusGenRootTypes["PublicOrganization"] | null; // PublicOrganization
    ownerName: string | null; // String
  };
  PublicContact: {
    // field return type
    email: string; // String!
    firstName: string; // String!
    fullName: string; // String!
    id: NexusGenScalars["GID"]; // GID!
    initials: string | null; // String
    isMe: boolean; // Boolean!
    lastName: string | null; // String
  };
  PublicCreateFileUploadReply: {
    // field return type
    presignedPostData: NexusGenRootTypes["AWSPresignedPostData"]; // AWSPresignedPostData!
    reply: NexusGenRootTypes["PublicPetitionFieldReply"]; // PublicPetitionFieldReply!
  };
  PublicLicenseCode: {
    // field return type
    code: string; // String!
    details: NexusGenScalars["JSONObject"]; // JSONObject!
    source: string; // String!
  };
  PublicOrganization: {
    // field return type
    brandTheme: NexusGenRootTypes["OrganizationBrandThemeData"]; // OrganizationBrandThemeData!
    hasRemoveParallelBranding: boolean; // Boolean!
    id: NexusGenScalars["GID"]; // GID!
    logoUrl: string | null; // String
    name: string; // String!
  };
  PublicPetition: {
    // field return type
    completingMessageBody: string | null; // String
    completingMessageSubject: string | null; // String
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    deadline: NexusGenScalars["DateTime"] | null; // DateTime
    fields: NexusGenRootTypes["PublicPetitionField"][]; // [PublicPetitionField!]!
    hasUnreadComments: boolean; // Boolean!
    id: NexusGenScalars["GID"]; // GID!
    isCompletingMessageEnabled: boolean; // Boolean!
    isRecipientViewContentsHidden: boolean; // Boolean!
    locale: NexusGenEnums["PetitionLocale"]; // PetitionLocale!
    organization: NexusGenRootTypes["PublicOrganization"]; // PublicOrganization!
    progress: NexusGenRootTypes["PublicPetitionFieldProgress"]; // PublicPetitionFieldProgress!
    recipients: NexusGenRootTypes["PublicContact"][]; // [PublicContact!]!
    signatureConfig: NexusGenRootTypes["PublicSignatureConfig"] | null; // PublicSignatureConfig
    signatureStatus: NexusGenEnums["PublicSignatureStatus"] | null; // PublicSignatureStatus
    status: NexusGenEnums["PetitionStatus"]; // PetitionStatus!
    tone: NexusGenEnums["Tone"]; // Tone!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  PublicPetitionAccess: {
    // field return type
    contact: NexusGenRootTypes["PublicContact"] | null; // PublicContact
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    granter: NexusGenRootTypes["PublicUser"] | null; // PublicUser
    hasClientPortalAccess: boolean; // Boolean!
    keycode: string; // ID!
    message: NexusGenRootTypes["PublicPetitionMessage"] | null; // PublicPetitionMessage
    petition: NexusGenRootTypes["PublicPetition"]; // PublicPetition!
  };
  PublicPetitionAccessPagination: {
    // field return type
    items: NexusGenRootTypes["PublicPetitionAccess"][]; // [PublicPetitionAccess!]!
    totalCount: number; // Int!
  };
  PublicPetitionField: {
    // field return type
    alias: string | null; // String
    attachments: NexusGenRootTypes["PetitionFieldAttachment"][]; // [PetitionFieldAttachment!]!
    commentCount: number; // Int!
    comments: NexusGenRootTypes["PublicPetitionFieldComment"][]; // [PublicPetitionFieldComment!]!
    description: string | null; // String
    hasCommentsEnabled: boolean; // Boolean!
    id: NexusGenScalars["GID"]; // GID!
    isInternal: boolean; // Boolean!
    isReadOnly: boolean; // Boolean!
    multiple: boolean; // Boolean!
    optional: boolean; // Boolean!
    options: NexusGenScalars["JSONObject"]; // JSONObject!
    petition: NexusGenRootTypes["PublicPetition"]; // PublicPetition!
    replies: NexusGenRootTypes["PublicPetitionFieldReply"][]; // [PublicPetitionFieldReply!]!
    title: string | null; // String
    type: NexusGenEnums["PetitionFieldType"]; // PetitionFieldType!
    unreadCommentCount: number; // Int!
    visibility: NexusGenScalars["JSONObject"] | null; // JSONObject
  };
  PublicPetitionFieldComment: {
    // field return type
    author: NexusGenRootTypes["PublicUserOrContact"] | null; // PublicUserOrContact
    content: NexusGenScalars["JSON"] | null; // JSON
    contentHtml: string | null; // String
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    field: NexusGenRootTypes["PublicPetitionField"]; // PublicPetitionField!
    id: NexusGenScalars["GID"]; // GID!
    isAnonymized: boolean; // Boolean!
    isUnread: boolean; // Boolean!
  };
  PublicPetitionFieldProgress: {
    // field return type
    optional: number; // Int!
    replied: number; // Int!
    total: number; // Int!
  };
  PublicPetitionFieldReply: {
    // field return type
    content: NexusGenScalars["JSONObject"]; // JSONObject!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    field: NexusGenRootTypes["PublicPetitionField"]; // PublicPetitionField!
    id: NexusGenScalars["GID"]; // GID!
    isAnonymized: boolean; // Boolean!
    status: NexusGenEnums["PetitionFieldReplyStatus"]; // PetitionFieldReplyStatus!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  PublicPetitionLink: {
    // field return type
    description: string; // String!
    id: NexusGenScalars["GID"]; // GID!
    isActive: boolean; // Boolean!
    owner: NexusGenRootTypes["User"]; // User!
    prefillSecret: string | null; // String
    slug: string; // String!
    template: NexusGenRootTypes["PetitionTemplate"]; // PetitionTemplate!
    title: string; // String!
    url: string; // String!
  };
  PublicPetitionMessage: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    sentAt: NexusGenScalars["DateTime"] | null; // DateTime
    subject: string | null; // String
  };
  PublicPublicPetitionLink: {
    // field return type
    description: string; // String!
    isActive: boolean; // Boolean!
    isAvailable: boolean; // Boolean!
    owner: NexusGenRootTypes["PublicUser"]; // PublicUser!
    slug: string; // String!
    title: string; // String!
  };
  PublicRemindersOptOut: {
    // field return type
    orgLogoUrl: string | null; // String
    orgName: string; // String!
  };
  PublicSignatureConfig: {
    // field return type
    additionalSigners: NexusGenRootTypes["PetitionSigner"][]; // [PetitionSigner!]!
    allowAdditionalSigners: boolean; // Boolean!
    review: boolean; // Boolean!
    signers: NexusGenRootTypes["PetitionSigner"][]; // [PetitionSigner!]!
  };
  PublicUser: {
    // field return type
    email: string; // String!
    firstName: string | null; // String
    fullName: string; // String!
    id: NexusGenScalars["GID"]; // GID!
    lastName: string | null; // String
    organization: NexusGenRootTypes["PublicOrganization"]; // PublicOrganization!
  };
  Query: {
    // field return type
    access: NexusGenRootTypes["PublicPetitionAccess"]; // PublicPetitionAccess!
    accesses: NexusGenRootTypes["PublicPetitionAccessPagination"]; // PublicPetitionAccessPagination!
    contact: NexusGenRootTypes["Contact"] | null; // Contact
    contacts: NexusGenRootTypes["ContactPagination"]; // ContactPagination!
    contactsByEmail: Array<NexusGenRootTypes["Contact"] | null>; // [Contact]!
    dowJonesKycEntityProfile: NexusGenRootTypes["DowJonesKycEntityProfileResult"]; // DowJonesKycEntityProfileResult!
    dowJonesKycEntitySearch: NexusGenRootTypes["DowJonesKycEntitySearchResultPagination"]; // DowJonesKycEntitySearchResultPagination!
    emailIsAvailable: boolean; // Boolean!
    exportPetitionToJson: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    getApiTokenOwner: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    getSlugForPublicPetitionLink: string; // String!
    getUsersOrGroups: NexusGenRootTypes["UserOrUserGroup"][]; // [UserOrUserGroup!]!
    globalIdDecode: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    globalIdEncode: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    isValidPublicPetitionLinkSlug: boolean; // Boolean!
    landingTemplateBySlug: NexusGenRootTypes["LandingTemplate"] | null; // LandingTemplate
    landingTemplateCategorySamples: NexusGenRootTypes["LandingTemplateCategorySample"][]; // [LandingTemplateCategorySample!]!
    landingTemplates: NexusGenRootTypes["LandingTemplatePagination"]; // LandingTemplatePagination!
    me: NexusGenRootTypes["User"]; // User!
    metadata: NexusGenRootTypes["ConnectionMetadata"]; // ConnectionMetadata!
    organization: NexusGenRootTypes["Organization"] | null; // Organization
    organizations: NexusGenRootTypes["OrganizationPagination"]; // OrganizationPagination!
    petition: NexusGenRootTypes["PetitionBase"] | null; // PetitionBase
    petitionEvents: NexusGenRootTypes["PetitionEvent"][]; // [PetitionEvent!]!
    petitionField: NexusGenRootTypes["PetitionField"]; // PetitionField!
    petitionFolders: string[]; // [String!]!
    petitions: NexusGenRootTypes["PetitionBaseOrFolderPagination"]; // PetitionBaseOrFolderPagination!
    petitionsById: Array<NexusGenRootTypes["PetitionBase"] | null>; // [PetitionBase]!
    profileType: NexusGenRootTypes["ProfileType"]; // ProfileType!
    profileTypes: NexusGenRootTypes["ProfileTypePagination"]; // ProfileTypePagination!
    publicLicenseCode: NexusGenRootTypes["PublicLicenseCode"] | null; // PublicLicenseCode
    publicOrg: NexusGenRootTypes["PublicOrganization"] | null; // PublicOrganization
    publicPetitionField: NexusGenRootTypes["PublicPetitionField"]; // PublicPetitionField!
    publicPetitionLinkBySlug: NexusGenRootTypes["PublicPublicPetitionLink"] | null; // PublicPublicPetitionLink
    publicTask: NexusGenRootTypes["Task"]; // Task!
    publicTemplateCategories: string[]; // [String!]!
    realMe: NexusGenRootTypes["User"]; // User!
    remindersOptOut: NexusGenRootTypes["PublicRemindersOptOut"] | null; // PublicRemindersOptOut
    searchUserGroups: NexusGenRootTypes["UserGroup"][]; // [UserGroup!]!
    searchUsers: NexusGenRootTypes["UserOrUserGroup"][]; // [UserOrUserGroup!]!
    subscriptions: NexusGenRootTypes["PetitionEventSubscription"][]; // [PetitionEventSubscription!]!
    tags: NexusGenRootTypes["TagPagination"]; // TagPagination!
    task: NexusGenRootTypes["Task"]; // Task!
    templates: NexusGenRootTypes["PetitionBaseOrFolderPagination"]; // PetitionBaseOrFolderPagination!
    userGroup: NexusGenRootTypes["UserGroup"] | null; // UserGroup
    userGroups: NexusGenRootTypes["UserGroupPagination"]; // UserGroupPagination!
  };
  RecipientSignedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    signer: NexusGenRootTypes["PetitionSigner"] | null; // PetitionSigner
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
  };
  ReminderEmailBouncedUserNotification: {
    // field return type
    access: NexusGenRootTypes["PetitionAccess"]; // PetitionAccess!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    isRead: boolean; // Boolean!
    petition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
  };
  ReminderSentEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    reminder: NexusGenRootTypes["PetitionReminder"]; // PetitionReminder!
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
  };
  RemindersConfig: {
    // field return type
    limit: number; // Int!
    offset: number; // Int!
    time: string; // String!
    timezone: string; // String!
    weekdaysOnly: boolean; // Boolean!
  };
  RemindersOptOutEvent: {
    // field return type
    access: NexusGenRootTypes["PetitionAccess"]; // PetitionAccess!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    other: string | null; // String
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    reason: string; // String!
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
  };
  RemindersOptOutNotification: {
    // field return type
    access: NexusGenRootTypes["PetitionAccess"]; // PetitionAccess!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    isRead: boolean; // Boolean!
    other: string | null; // String
    petition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    reason: string; // String!
  };
  ReplyCreatedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    createdBy: NexusGenRootTypes["UserOrPetitionAccess"] | null; // UserOrPetitionAccess
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    field: NexusGenRootTypes["PetitionField"] | null; // PetitionField
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    reply: NexusGenRootTypes["PetitionFieldReply"] | null; // PetitionFieldReply
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
  };
  ReplyDeletedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    deletedBy: NexusGenRootTypes["UserOrPetitionAccess"] | null; // UserOrPetitionAccess
    field: NexusGenRootTypes["PetitionField"] | null; // PetitionField
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
  };
  ReplyStatusChangedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    field: NexusGenRootTypes["PetitionField"] | null; // PetitionField
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    reply: NexusGenRootTypes["PetitionFieldReply"] | null; // PetitionFieldReply
    status: NexusGenEnums["PetitionFieldReplyStatus"]; // PetitionFieldReplyStatus!
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
    updatedBy: NexusGenRootTypes["UserOrPetitionAccess"] | null; // UserOrPetitionAccess
  };
  ReplyUpdatedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    field: NexusGenRootTypes["PetitionField"] | null; // PetitionField
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    reply: NexusGenRootTypes["PetitionFieldReply"] | null; // PetitionFieldReply
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
    updatedBy: NexusGenRootTypes["UserOrPetitionAccess"] | null; // UserOrPetitionAccess
  };
  SendPetitionResult: {
    // field return type
    accesses: NexusGenRootTypes["PetitionAccess"][] | null; // [PetitionAccess!]
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    result: NexusGenEnums["Result"]; // Result!
  };
  SignatureCancelledEvent: {
    // field return type
    cancelType: NexusGenEnums["PetitionSignatureCancelReason"]; // PetitionSignatureCancelReason!
    cancelledBy: NexusGenRootTypes["UserOrPetitionAccess"] | null; // UserOrPetitionAccess
    canceller: NexusGenRootTypes["PetitionSigner"] | null; // PetitionSigner
    cancellerReason: string | null; // String
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    errorCode: string | null; // String
    extraErrorData: NexusGenScalars["JSON"] | null; // JSON
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
  };
  SignatureCancelledUserNotification: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    errorCode: string | null; // String
    extraErrorData: NexusGenScalars["JSON"] | null; // JSON
    id: NexusGenScalars["GID"]; // GID!
    isRead: boolean; // Boolean!
    petition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
  };
  SignatureCompletedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
  };
  SignatureCompletedUserNotification: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    isRead: boolean; // Boolean!
    petition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
  };
  SignatureConfig: {
    // field return type
    allowAdditionalSigners: boolean; // Boolean!
    integration: NexusGenRootTypes["SignatureOrgIntegration"] | null; // SignatureOrgIntegration
    review: boolean; // Boolean!
    signers: Array<NexusGenRootTypes["PetitionSigner"] | null>; // [PetitionSigner]!
    timezone: string; // String!
    title: string | null; // String
  };
  SignatureOpenedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    signer: NexusGenRootTypes["PetitionSigner"] | null; // PetitionSigner
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
  };
  SignatureOrgIntegration: {
    // field return type
    environment: NexusGenEnums["SignatureOrgIntegrationEnvironment"]; // SignatureOrgIntegrationEnvironment!
    id: NexusGenScalars["GID"]; // GID!
    invalidCredentials: boolean; // Boolean!
    isDefault: boolean; // Boolean!
    name: string; // String!
    provider: NexusGenEnums["SignatureOrgIntegrationProvider"]; // SignatureOrgIntegrationProvider!
    type: NexusGenEnums["IntegrationType"]; // IntegrationType!
  };
  SignatureReminderEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  SignatureStartedEvent: {
    // field return type
    bouncedAt: NexusGenScalars["DateTime"] | null; // DateTime
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    deliveredAt: NexusGenScalars["DateTime"] | null; // DateTime
    id: NexusGenScalars["GID"]; // GID!
    openedAt: NexusGenScalars["DateTime"] | null; // DateTime
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
  };
  SupportMethodResponse: {
    // field return type
    message: string | null; // String
    result: NexusGenEnums["Result"]; // Result!
    type: string | null; // String
  };
  Tag: {
    // field return type
    color: string; // String!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    name: string; // String!
  };
  TagPagination: {
    // field return type
    items: NexusGenRootTypes["Tag"][]; // [Tag!]!
    totalCount: number; // Int!
  };
  Task: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    name: NexusGenEnums["TaskName"]; // TaskName!
    output: NexusGenScalars["JSON"] | null; // JSON
    progress: number | null; // Int
    status: NexusGenEnums["TaskStatus"]; // TaskStatus!
  };
  TaskResultFile: {
    // field return type
    filename: string; // String!
    url: string; // String!
  };
  TemplateDefaultUserGroupPermission: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    group: NexusGenRootTypes["UserGroup"]; // UserGroup!
    id: NexusGenScalars["GID"]; // GID!
    isSubscribed: boolean; // Boolean!
    permissionType: NexusGenEnums["PetitionPermissionType"]; // PetitionPermissionType!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  TemplateDefaultUserPermission: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    isSubscribed: boolean; // Boolean!
    permissionType: NexusGenEnums["PetitionPermissionType"]; // PetitionPermissionType!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
    user: NexusGenRootTypes["User"]; // User!
  };
  TemplateUsedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
  };
  User: {
    // field return type
    avatarUrl: string | null; // String
    canCreateUsers: boolean; // Boolean!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    delegateOf: NexusGenRootTypes["User"][]; // [User!]!
    delegates: NexusGenRootTypes["User"][]; // [User!]!
    email: string; // String!
    firstName: string | null; // String
    fullName: string | null; // String
    hasFeatureFlag: boolean; // Boolean!
    id: NexusGenScalars["GID"]; // GID!
    initials: string | null; // String
    isMe: boolean; // Boolean!
    isSsoUser: boolean; // Boolean!
    isSuperAdmin: boolean; // Boolean!
    lastActiveAt: NexusGenScalars["DateTime"] | null; // DateTime
    lastName: string | null; // String
    notifications: NexusGenRootTypes["UserNotifications_Pagination"]; // UserNotifications_Pagination!
    organization: NexusGenRootTypes["Organization"]; // Organization!
    organizations: NexusGenRootTypes["Organization"][]; // [Organization!]!
    petitionListViews: NexusGenRootTypes["PetitionListView"][]; // [PetitionListView!]!
    preferredLocale: NexusGenEnums["UserLocale"]; // UserLocale!
    role: NexusGenEnums["OrganizationRole"]; // OrganizationRole!
    status: NexusGenEnums["UserStatus"]; // UserStatus!
    tokens: NexusGenRootTypes["UserAuthenticationToken"][]; // [UserAuthenticationToken!]!
    unreadNotificationIds: NexusGenScalars["GID"][]; // [GID!]!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
    userGroups: NexusGenRootTypes["UserGroup"][]; // [UserGroup!]!
  };
  UserAuthenticationToken: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    hint: string | null; // String
    id: NexusGenScalars["GID"]; // GID!
    lastUsedAt: NexusGenScalars["DateTime"] | null; // DateTime
    tokenName: string; // String!
  };
  UserGroup: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    imMember: boolean; // Boolean!
    initials: string; // String!
    memberCount: number; // Int!
    members: NexusGenRootTypes["UserGroupMember"][]; // [UserGroupMember!]!
    name: string; // String!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  UserGroupMember: {
    // field return type
    addedAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    user: NexusGenRootTypes["User"]; // User!
  };
  UserGroupPagination: {
    // field return type
    items: NexusGenRootTypes["UserGroup"][]; // [UserGroup!]!
    totalCount: number; // Int!
  };
  UserNotifications_Pagination: {
    // field return type
    hasMore: boolean; // Boolean!
    items: NexusGenRootTypes["PetitionUserNotification"][]; // [PetitionUserNotification!]!
  };
  UserPagination: {
    // field return type
    items: NexusGenRootTypes["User"][]; // [User!]!
    totalCount: number; // Int!
  };
  UserPermissionAddedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    permissionType: NexusGenEnums["PetitionPermissionType"]; // PetitionPermissionType!
    permissionUser: NexusGenRootTypes["User"] | null; // User
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  UserPermissionEditedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    permissionType: NexusGenEnums["PetitionPermissionType"]; // PetitionPermissionType!
    permissionUser: NexusGenRootTypes["User"] | null; // User
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  UserPermissionRemovedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    permissionUser: NexusGenRootTypes["User"] | null; // User
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  VerificationCodeCheck: {
    // field return type
    remainingAttempts: number | null; // Int
    result: NexusGenEnums["Result"]; // Result!
  };
  VerificationCodeRequest: {
    // field return type
    expiresAt: NexusGenScalars["DateTime"]; // DateTime!
    remainingAttempts: number; // Int!
    token: string; // ID!
  };
  CreatedAt: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  DowJonesKycEntityProfileResult: {
    // field return type
    iconHints: string[]; // [String!]!
    id: string; // ID!
    name: string; // String!
    profileId: string; // ID!
    relationships: NexusGenRootTypes["DowJonesKycEntityRelationship"][]; // [DowJonesKycEntityRelationship!]!
    sanctions: NexusGenRootTypes["DowJonesKycEntitySanction"][]; // [DowJonesKycEntitySanction!]!
    type: NexusGenEnums["DowJonesKycEntityType"]; // DowJonesKycEntityType!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  DowJonesKycEntitySearchResult: {
    // field return type
    countryTerritoryName: string | null; // String
    iconHints: string[]; // [String!]!
    id: string; // ID!
    isSubsidiary: boolean; // Boolean!
    name: string; // String!
    profileId: string; // ID!
    title: string; // String!
    type: NexusGenEnums["DowJonesKycEntityType"]; // DowJonesKycEntityType!
  };
  IOrgIntegration: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    invalidCredentials: boolean; // Boolean!
    isDefault: boolean; // Boolean!
    name: string; // String!
    type: NexusGenEnums["IntegrationType"]; // IntegrationType!
  };
  PetitionBase: {
    // field return type
    anonymizeAfterMonths: number | null; // Int
    anonymizePurpose: string | null; // String
    attachmentsList: NexusGenRootTypes["PetitionAttachmentsList"]; // PetitionAttachmentsList!
    closingEmailBody: NexusGenScalars["JSON"] | null; // JSON
    completingMessageBody: NexusGenScalars["JSON"] | null; // JSON
    completingMessageSubject: string | null; // String
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    customProperties: NexusGenScalars["JSONObject"]; // JSONObject!
    defaultOnBehalf: NexusGenRootTypes["User"] | null; // User
    effectivePermissions: NexusGenRootTypes["EffectivePetitionUserPermission"][]; // [EffectivePetitionUserPermission!]!
    emailBody: NexusGenScalars["JSON"] | null; // JSON
    emailSubject: string | null; // String
    fieldCount: number; // Int!
    fields: NexusGenRootTypes["PetitionField"][]; // [PetitionField!]!
    id: NexusGenScalars["GID"]; // GID!
    isAnonymized: boolean; // Boolean!
    isCompletingMessageEnabled: boolean; // Boolean!
    isRecipientViewContentsHidden: boolean; // Boolean!
    isRestricted: boolean; // Boolean!
    isRestrictedWithPassword: boolean; // Boolean!
    locale: NexusGenEnums["PetitionLocale"]; // PetitionLocale!
    metadata: NexusGenScalars["JSONObject"]; // JSONObject!
    myEffectivePermission: NexusGenRootTypes["EffectivePetitionUserPermission"] | null; // EffectivePetitionUserPermission
    name: string | null; // String
    organization: NexusGenRootTypes["Organization"]; // Organization!
    owner: NexusGenRootTypes["User"]; // User!
    path: string; // String!
    permissions: NexusGenRootTypes["PetitionPermission"][]; // [PetitionPermission!]!
    remindersConfig: NexusGenRootTypes["RemindersConfig"] | null; // RemindersConfig
    selectedDocumentTheme: NexusGenRootTypes["OrganizationTheme"]; // OrganizationTheme!
    signatureConfig: NexusGenRootTypes["SignatureConfig"] | null; // SignatureConfig
    skipForwardSecurity: boolean; // Boolean!
    tags: NexusGenRootTypes["Tag"][]; // [Tag!]!
    tone: NexusGenEnums["Tone"]; // Tone!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  PetitionEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
  };
  PetitionPermission: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    isSubscribed: boolean; // Boolean!
    permissionType: NexusGenEnums["PetitionPermissionType"]; // PetitionPermissionType!
    petition: NexusGenRootTypes["Petition"]; // Petition!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  PetitionUserNotification: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    isRead: boolean; // Boolean!
    petition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
  };
  TemplateDefaultPermission: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    isSubscribed: boolean; // Boolean!
    permissionType: NexusGenEnums["PetitionPermissionType"]; // PetitionPermissionType!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  Timestamps: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
}

export interface NexusGenFieldTypeNames {
  AWSPresignedPostData: {
    // field return type name
    fields: "JSONObject";
    url: "String";
  };
  AccessActivatedEvent: {
    // field return type name
    access: "PetitionAccess";
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    petition: "Petition";
    type: "PetitionEventType";
    user: "User";
  };
  AccessActivatedFromPublicPetitionLinkEvent: {
    // field return type name
    access: "PetitionAccess";
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    petition: "Petition";
    type: "PetitionEventType";
  };
  AccessActivatedFromPublicPetitionLinkUserNotification: {
    // field return type name
    access: "PetitionAccess";
    createdAt: "DateTime";
    id: "GID";
    isRead: "Boolean";
    petition: "PetitionBase";
  };
  AccessDeactivatedEvent: {
    // field return type name
    access: "PetitionAccess";
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    petition: "Petition";
    reason: "String";
    type: "PetitionEventType";
    user: "User";
  };
  AccessDelegatedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    newAccess: "PetitionAccess";
    originalAccess: "PetitionAccess";
    petition: "Petition";
    type: "PetitionEventType";
  };
  AccessOpenedEvent: {
    // field return type name
    access: "PetitionAccess";
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    petition: "Petition";
    type: "PetitionEventType";
  };
  AsyncFieldCompletionResponse: {
    // field return type name
    type: "String";
    url: "String";
  };
  BulkCreateContactsReturnType: {
    // field return type name
    contacts: "Contact";
    errors: "JSON";
  };
  CommentCreatedUserNotification: {
    // field return type name
    comment: "PetitionFieldComment";
    createdAt: "DateTime";
    field: "PetitionField";
    id: "GID";
    isMention: "Boolean";
    isRead: "Boolean";
    petition: "PetitionBase";
  };
  CommentDeletedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    deletedBy: "UserOrPetitionAccess";
    field: "PetitionField";
    id: "GID";
    isInternal: "Boolean";
    petition: "Petition";
    type: "PetitionEventType";
  };
  CommentPublishedEvent: {
    // field return type name
    comment: "PetitionFieldComment";
    createdAt: "DateTime";
    data: "JSONObject";
    field: "PetitionField";
    id: "GID";
    isInternal: "Boolean";
    petition: "Petition";
    type: "PetitionEventType";
  };
  ConnectionMetadata: {
    // field return type name
    browserName: "String";
    browserVersion: "String";
    country: "String";
    ip: "String";
  };
  Contact: {
    // field return type name
    accesses: "PetitionAccessPagination";
    createdAt: "DateTime";
    email: "String";
    firstName: "String";
    fullName: "String";
    hasBouncedEmail: "Boolean";
    id: "GID";
    lastName: "String";
    updatedAt: "DateTime";
  };
  ContactPagination: {
    // field return type name
    items: "Contact";
    totalCount: "Int";
  };
  DowJonesKycEntityDate: {
    // field return type name
    day: "Int";
    month: "Int";
    year: "Int";
  };
  DowJonesKycEntityPlace: {
    // field return type name
    countryCode: "String";
    descriptor: "String";
  };
  DowJonesKycEntityProfileResultEntity: {
    // field return type name
    dateOfRegistration: "DowJonesKycEntityDate";
    iconHints: "String";
    id: "ID";
    name: "String";
    profileId: "ID";
    relationships: "DowJonesKycEntityRelationship";
    sanctions: "DowJonesKycEntitySanction";
    type: "DowJonesKycEntityType";
    updatedAt: "DateTime";
  };
  DowJonesKycEntityProfileResultPerson: {
    // field return type name
    citizenship: "DowJonesKycEntityPlace";
    dateOfBirth: "DowJonesKycEntityDate";
    iconHints: "String";
    id: "ID";
    isDeceased: "Boolean";
    jurisdiction: "DowJonesKycEntityPlace";
    name: "String";
    placeOfBirth: "DowJonesKycEntityPlace";
    profileId: "ID";
    relationships: "DowJonesKycEntityRelationship";
    residence: "DowJonesKycEntityPlace";
    sanctions: "DowJonesKycEntitySanction";
    type: "DowJonesKycEntityType";
    updatedAt: "DateTime";
  };
  DowJonesKycEntityRelationship: {
    // field return type name
    connectionType: "String";
    iconHints: "String";
    name: "String";
    profileId: "ID";
    type: "DowJonesKycEntityType";
  };
  DowJonesKycEntitySanction: {
    // field return type name
    fromDate: "DowJonesKycEntityDate";
    id: "ID";
    name: "String";
    sources: "String";
  };
  DowJonesKycEntitySearchResultEntity: {
    // field return type name
    countryTerritoryName: "String";
    iconHints: "String";
    id: "ID";
    isSubsidiary: "Boolean";
    name: "String";
    profileId: "ID";
    title: "String";
    type: "DowJonesKycEntityType";
  };
  DowJonesKycEntitySearchResultPagination: {
    // field return type name
    items: "DowJonesKycEntitySearchResult";
    totalCount: "Int";
  };
  DowJonesKycEntitySearchResultPerson: {
    // field return type name
    countryTerritoryName: "String";
    dateOfBirth: "DowJonesKycEntityDate";
    gender: "String";
    iconHints: "String";
    id: "ID";
    isSubsidiary: "Boolean";
    name: "String";
    profileId: "ID";
    title: "String";
    type: "DowJonesKycEntityType";
  };
  EffectivePetitionUserPermission: {
    // field return type name
    isSubscribed: "Boolean";
    permissionType: "PetitionPermissionType";
    user: "User";
  };
  EventSubscriptionSignatureKey: {
    // field return type name
    id: "GID";
    publicKey: "String";
  };
  FeatureFlagNameValue: {
    // field return type name
    name: "FeatureFlag";
    value: "Boolean";
  };
  FileUpload: {
    // field return type name
    contentType: "String";
    filename: "String";
    isComplete: "Boolean";
    size: "Int";
  };
  FileUploadDownloadLinkResult: {
    // field return type name
    file: "FileUpload";
    result: "Result";
    url: "String";
  };
  FileUploadReplyResponse: {
    // field return type name
    presignedPostData: "AWSPresignedPostData";
    reply: "PetitionFieldReply";
  };
  GenerateUserAuthTokenResponse: {
    // field return type name
    apiKey: "String";
    userAuthToken: "UserAuthenticationToken";
  };
  GroupPermissionAddedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    permissionGroup: "UserGroup";
    permissionType: "PetitionPermissionType";
    petition: "Petition";
    type: "PetitionEventType";
    user: "User";
  };
  GroupPermissionEditedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    permissionGroup: "UserGroup";
    permissionType: "PetitionPermissionType";
    petition: "Petition";
    type: "PetitionEventType";
    user: "User";
  };
  GroupPermissionRemovedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    permissionGroup: "UserGroup";
    petition: "Petition";
    type: "PetitionEventType";
    user: "User";
  };
  IOrgIntegrationPagination: {
    // field return type name
    items: "IOrgIntegration";
    totalCount: "Int";
  };
  LandingTemplate: {
    // field return type name
    backgroundColor: "String";
    categories: "String";
    descriptionHtml: "String";
    fieldCount: "Int";
    fields: "LandingTemplateField";
    hasConditionals: "Boolean";
    id: "GID";
    imageUrl: "String";
    locale: "PetitionLocale";
    name: "String";
    organizationName: "String";
    ownerAvatarUrl: "String";
    ownerFullName: "String";
    publicLinkUrl: "String";
    shortDescription: "String";
    slug: "String";
    updatedAt: "DateTime";
  };
  LandingTemplateCategorySample: {
    // field return type name
    category: "String";
    templates: "LandingTemplatePagination";
  };
  LandingTemplateField: {
    // field return type name
    id: "GID";
    title: "String";
    type: "PetitionFieldType";
  };
  LandingTemplatePagination: {
    // field return type name
    items: "LandingTemplate";
    totalCount: "Int";
  };
  MessageCancelledEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    message: "PetitionMessage";
    petition: "Petition";
    reason: "String";
    type: "PetitionEventType";
    user: "User";
  };
  MessageEmailBouncedUserNotification: {
    // field return type name
    access: "PetitionAccess";
    createdAt: "DateTime";
    id: "GID";
    isRead: "Boolean";
    petition: "PetitionBase";
  };
  MessageScheduledEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    message: "PetitionMessage";
    petition: "Petition";
    type: "PetitionEventType";
  };
  MessageSentEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    message: "PetitionMessage";
    petition: "Petition";
    type: "PetitionEventType";
  };
  Mutation: {
    // field return type name
    activateUser: "User";
    addPetitionPermission: "PetitionBase";
    addUsersToUserGroup: "UserGroup";
    anonymizePetition: "SupportMethodResponse";
    approveOrRejectPetitionFieldReplies: "Petition";
    bulkCreateContacts: "BulkCreateContactsReturnType";
    bulkCreatePetitionReplies: "Petition";
    cancelScheduledMessage: "PetitionMessage";
    cancelSignatureRequest: "PetitionSignatureRequest";
    changeOrganization: "Result";
    changePassword: "ChangePasswordResult";
    changePetitionFieldType: "PetitionField";
    clonePetitionField: "PetitionField";
    clonePetitions: "PetitionBase";
    cloneUserGroups: "UserGroup";
    closePetition: "Petition";
    completePetition: "Petition";
    createContact: "Contact";
    createDowJonesKycIntegration: "OrgIntegration";
    createDowJonesKycReply: "PetitionFieldReply";
    createDowJonesProfileDownloadTask: "Task";
    createEventSubscription: "PetitionEventSubscription";
    createEventSubscriptionSignatureKey: "EventSubscriptionSignatureKey";
    createExportExcelTask: "Task";
    createExportRepliesTask: "Task";
    createFileUploadReply: "FileUploadReplyResponse";
    createFileUploadReplyComplete: "PetitionFieldReply";
    createOrganization: "Organization";
    createOrganizationPdfDocumentTheme: "Organization";
    createPetition: "PetitionBase";
    createPetitionAccess: "PetitionAccess";
    createPetitionAttachmentUploadLink: "PetitionAttachmentUploadData";
    createPetitionField: "PetitionField";
    createPetitionFieldAttachmentUploadLink: "PetitionFieldAttachmentUploadData";
    createPetitionFieldComment: "PetitionFieldComment";
    createPetitionFieldReply: "PetitionFieldReply";
    createPetitionListView: "PetitionListView";
    createPrintPdfTask: "Task";
    createProfile: "Profile";
    createProfileType: "ProfileType";
    createProfileTypeField: "ProfileTypeField";
    createPublicPetitionLink: "PublicPetitionLink";
    createPublicPetitionLinkPrefillData: "String";
    createSignaturitIntegration: "SignatureOrgIntegration";
    createTag: "Tag";
    createTemplateRepliesReportTask: "Task";
    createTemplateStatsReportTask: "Task";
    createTemplatesOverviewReportTask: "Task";
    createUserGroup: "UserGroup";
    deactivateAccesses: "PetitionAccess";
    deactivateUser: "User";
    deleteContacts: "Result";
    deleteDowJonesKycIntegration: "Organization";
    deleteEventSubscriptionSignatureKeys: "Result";
    deleteEventSubscriptions: "Result";
    deleteOrganizationPdfDocumentTheme: "Organization";
    deletePetitionAttachment: "PetitionBase";
    deletePetitionField: "PetitionBase";
    deletePetitionFieldAttachment: "PetitionField";
    deletePetitionFieldComment: "PetitionField";
    deletePetitionListView: "User";
    deletePetitionReply: "PetitionField";
    deletePetitions: "Success";
    deleteProfile: "Success";
    deleteProfileType: "Success";
    deleteProfileTypeField: "ProfileType";
    deleteSignatureIntegration: "Result";
    deleteTag: "Result";
    deleteUserGroup: "Result";
    dynamicSelectFieldFileDownloadLink: "FileUploadDownloadLinkResult";
    editPetitionPermission: "PetitionBase";
    fileUploadReplyDownloadLink: "FileUploadDownloadLinkResult";
    forceUpdateSignatureOrganizationBrandings: "SupportMethodResponse";
    generateUserAuthToken: "GenerateUserAuthTokenResponse";
    getTaskResultFile: "TaskResultFile";
    importPetitionFromJson: "SupportMethodResponse";
    inviteUserToOrganization: "User";
    loginAs: "Result";
    markPetitionListViewAsDefault: "User";
    markSignatureIntegrationAsDefault: "IOrgIntegration";
    modifyCurrentUsagePeriod: "Organization";
    modifyPetitionCustomProperty: "PetitionBase";
    movePetitions: "Success";
    petitionAttachmentDownloadLink: "FileUploadDownloadLinkResult";
    petitionAttachmentUploadComplete: "PetitionAttachment";
    petitionFieldAttachmentDownloadLink: "FileUploadDownloadLinkResult";
    petitionFieldAttachmentUploadComplete: "PetitionFieldAttachment";
    publicCheckVerificationCode: "VerificationCodeCheck";
    publicCompletePetition: "PublicPetition";
    publicCreateAndSendPetitionFromPublicLink: "Result";
    publicCreateFileUploadReply: "PublicCreateFileUploadReply";
    publicCreatePetitionFieldComment: "PublicPetitionFieldComment";
    publicCreatePetitionFieldReply: "PublicPetitionFieldReply";
    publicCreatePrintPdfTask: "Task";
    publicDelegateAccessToContact: "PublicPetitionAccess";
    publicDeletePetitionFieldComment: "PublicPetitionField";
    publicDeletePetitionFieldReply: "PublicPetitionField";
    publicFileUploadReplyComplete: "PublicPetitionFieldReply";
    publicFileUploadReplyDownloadLink: "FileUploadDownloadLinkResult";
    publicGetTaskResultFileUrl: "String";
    publicMarkPetitionFieldCommentsAsRead: "PublicPetitionFieldComment";
    publicPetitionFieldAttachmentDownloadLink: "FileUploadDownloadLinkResult";
    publicRemindersOptOut: "Result";
    publicResetTempPassword: "Result";
    publicSendReminder: "Result";
    publicSendVerificationCode: "VerificationCodeRequest";
    publicStartAsyncFieldCompletion: "AsyncFieldCompletionResponse";
    publicUpdatePetitionFieldComment: "PublicPetitionFieldComment";
    publicUpdatePetitionFieldReply: "PublicPetitionFieldReply";
    reactivateAccesses: "PetitionAccess";
    removePetitionPassword: "SupportMethodResponse";
    removePetitionPermission: "PetitionBase";
    removeUsersFromGroup: "UserGroup";
    renameFolder: "Success";
    reopenPetition: "Petition";
    reorderPetitionAttachments: "PetitionBase";
    reorderPetitionListViews: "User";
    resendVerificationEmail: "Result";
    resetTempPassword: "Result";
    resetUserPassword: "SupportMethodResponse";
    restoreDeletedPetition: "SupportMethodResponse";
    restoreLogin: "Result";
    revokeUserAuthToken: "Result";
    sendPetition: "SendPetitionResult";
    sendPetitionClosedNotification: "Petition";
    sendReminders: "Result";
    sendSignatureRequestReminders: "Result";
    setUserDelegates: "User";
    shareSignaturitApiKey: "Organization";
    signUp: "User";
    signaturitIntegrationShowSecurityStamp: "SupportMethodResponse";
    signedPetitionDownloadLink: "FileUploadDownloadLinkResult";
    startAsyncFieldCompletion: "AsyncFieldCompletionResponse";
    startSignatureRequest: "PetitionSignatureRequest";
    switchAutomaticReminders: "PetitionAccess";
    tagPetition: "PetitionBase";
    transferOrganizationOwnership: "SupportMethodResponse";
    transferPetitionOwnership: "PetitionBase";
    untagPetition: "PetitionBase";
    updateContact: "Contact";
    updateEventSubscription: "PetitionEventSubscription";
    updateFeatureFlags: "Organization";
    updateFieldPositions: "PetitionBase";
    updateFileUploadReply: "FileUploadReplyResponse";
    updateFileUploadReplyComplete: "PetitionFieldReply";
    updateLandingTemplateMetadata: "SupportMethodResponse";
    updateOrganizationAutoAnonymizePeriod: "Organization";
    updateOrganizationBrandTheme: "Organization";
    updateOrganizationLogo: "Organization";
    updateOrganizationPdfDocumentTheme: "Organization";
    updateOrganizationTier: "SupportMethodResponse";
    updateOrganizationUsageDetails: "Organization";
    updateOrganizationUser: "User";
    updateOrganizationUserLimit: "Organization";
    updatePetition: "PetitionBase";
    updatePetitionAttachmentType: "PetitionAttachment";
    updatePetitionField: "PetitionField";
    updatePetitionFieldComment: "PetitionFieldComment";
    updatePetitionFieldRepliesStatus: "PetitionField";
    updatePetitionFieldReply: "PetitionFieldReply";
    updatePetitionFieldReplyMetadata: "PetitionFieldReply";
    updatePetitionListView: "PetitionListView";
    updatePetitionMetadata: "Petition";
    updatePetitionPermissionSubscription: "Petition";
    updatePetitionRestriction: "PetitionBase";
    updatePetitionUserNotificationReadStatus: "PetitionUserNotification";
    updateProfileType: "ProfileType";
    updateProfileTypeField: "ProfileTypeField";
    updateProfileTypeFieldPositions: "ProfileType";
    updatePublicPetitionLink: "PublicPetitionLink";
    updatePublicTemplateVisibility: "SupportMethodResponse";
    updateSignatureRequestMetadata: "PetitionSignatureRequest";
    updateTag: "Tag";
    updateTemplateDefaultPermissions: "PetitionTemplate";
    updateTemplateDocumentTheme: "PetitionBase";
    updateUser: "User";
    updateUserGroup: "UserGroup";
    updateUserPreferredLocale: "User";
    uploadDynamicSelectFieldFile: "PetitionField";
    uploadUserAvatar: "SupportMethodResponse";
    verifyPublicAccess: "PublicAccessVerification";
  };
  OrgIntegration: {
    // field return type name
    id: "GID";
    invalidCredentials: "Boolean";
    isDefault: "Boolean";
    name: "String";
    type: "IntegrationType";
  };
  OrgLicense: {
    // field return type name
    externalId: "String";
    name: "String";
    source: "OrgLicenseSource";
  };
  Organization: {
    // field return type name
    activeUserCount: "Int";
    anonymizePetitionsAfterMonths: "Int";
    brandTheme: "OrganizationBrandThemeData";
    createdAt: "DateTime";
    currentUsagePeriod: "OrganizationUsageLimit";
    customHost: "String";
    features: "FeatureFlagNameValue";
    hasIntegration: "Boolean";
    hasSsoProvider: "Boolean";
    iconUrl: "String";
    id: "GID";
    integrations: "IOrgIntegrationPagination";
    isUsageLimitReached: "Boolean";
    license: "OrgLicense";
    logoUrl: "String";
    name: "String";
    pdfDocumentThemes: "OrganizationTheme";
    status: "OrganizationStatus";
    subscriptionEndDate: "DateTime";
    updatedAt: "DateTime";
    usageDetails: "JSONObject";
    usagePeriods: "OrganizationUsageLimitPagination";
    users: "UserPagination";
  };
  OrganizationBrandThemeData: {
    // field return type name
    color: "String";
    fontFamily: "String";
    preferredTone: "Tone";
  };
  OrganizationPagination: {
    // field return type name
    items: "Organization";
    totalCount: "Int";
  };
  OrganizationTheme: {
    // field return type name
    data: "JSONObject";
    id: "GID";
    isDefault: "Boolean";
    name: "String";
  };
  OrganizationUsageLimit: {
    // field return type name
    cycleNumber: "Int";
    id: "GID";
    limit: "Int";
    period: "Duration";
    periodEndDate: "DateTime";
    periodStartDate: "DateTime";
    used: "Int";
  };
  OrganizationUsageLimitPagination: {
    // field return type name
    items: "OrganizationUsageLimit";
    totalCount: "Int";
  };
  OwnershipTransferredEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    owner: "User";
    petition: "Petition";
    previousOwner: "User";
    type: "PetitionEventType";
    user: "User";
  };
  Petition: {
    // field return type name
    accesses: "PetitionAccess";
    anonymizeAfterMonths: "Int";
    anonymizePurpose: "String";
    attachmentsList: "PetitionAttachmentsList";
    closedAt: "DateTime";
    closingEmailBody: "JSON";
    completingMessageBody: "JSON";
    completingMessageSubject: "String";
    createdAt: "DateTime";
    currentSignatureRequest: "PetitionSignatureRequest";
    customProperties: "JSONObject";
    deadline: "DateTime";
    defaultOnBehalf: "User";
    effectivePermissions: "EffectivePetitionUserPermission";
    emailBody: "JSON";
    emailSubject: "String";
    events: "PetitionEventPagination";
    fieldCount: "Int";
    fields: "PetitionField";
    fromTemplate: "PetitionBaseMini";
    id: "GID";
    isAnonymized: "Boolean";
    isCompletingMessageEnabled: "Boolean";
    isRecipientViewContentsHidden: "Boolean";
    isRestricted: "Boolean";
    isRestrictedWithPassword: "Boolean";
    locale: "PetitionLocale";
    metadata: "JSONObject";
    myEffectivePermission: "EffectivePetitionUserPermission";
    name: "String";
    organization: "Organization";
    owner: "User";
    path: "String";
    permissions: "PetitionPermission";
    progress: "PetitionProgress";
    remindersConfig: "RemindersConfig";
    selectedDocumentTheme: "OrganizationTheme";
    sentAt: "DateTime";
    signatureConfig: "SignatureConfig";
    signatureRequests: "PetitionSignatureRequest";
    skipForwardSecurity: "Boolean";
    status: "PetitionStatus";
    tags: "Tag";
    tone: "Tone";
    updatedAt: "DateTime";
  };
  PetitionAccess: {
    // field return type name
    contact: "Contact";
    createdAt: "DateTime";
    delegateGranter: "User";
    granter: "User";
    id: "GID";
    isContactless: "Boolean";
    nextReminderAt: "DateTime";
    petition: "Petition";
    recipientUrl: "String";
    reminderCount: "Int";
    reminders: "PetitionReminder";
    remindersActive: "Boolean";
    remindersConfig: "RemindersConfig";
    remindersLeft: "Int";
    remindersOptOut: "Boolean";
    status: "PetitionAccessStatus";
    updatedAt: "DateTime";
  };
  PetitionAccessPagination: {
    // field return type name
    items: "PetitionAccess";
    totalCount: "Int";
  };
  PetitionAnonymizedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    petition: "Petition";
    type: "PetitionEventType";
  };
  PetitionAttachment: {
    // field return type name
    file: "FileUpload";
    id: "GID";
    petition: "PetitionBase";
    type: "PetitionAttachmentType";
  };
  PetitionAttachmentUploadData: {
    // field return type name
    attachment: "PetitionAttachment";
    presignedPostData: "AWSPresignedPostData";
  };
  PetitionAttachmentsList: {
    // field return type name
    ANNEX: "PetitionAttachment";
    BACK: "PetitionAttachment";
    FRONT: "PetitionAttachment";
  };
  PetitionBaseMini: {
    // field return type name
    id: "GID";
    name: "String";
  };
  PetitionBaseOrFolderPagination: {
    // field return type name
    items: "PetitionBaseOrFolder";
    totalCount: "Int";
  };
  PetitionClonedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    petition: "Petition";
    type: "PetitionEventType";
    user: "User";
  };
  PetitionClosedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    petition: "Petition";
    type: "PetitionEventType";
    user: "User";
  };
  PetitionClosedNotifiedEvent: {
    // field return type name
    access: "PetitionAccess";
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    petition: "Petition";
    type: "PetitionEventType";
    user: "User";
  };
  PetitionCompletedEvent: {
    // field return type name
    completedBy: "UserOrPetitionAccess";
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    petition: "Petition";
    type: "PetitionEventType";
  };
  PetitionCompletedUserNotification: {
    // field return type name
    completedBy: "UserOrPetitionAccess";
    createdAt: "DateTime";
    id: "GID";
    isRead: "Boolean";
    petition: "PetitionBase";
  };
  PetitionCreatedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    petition: "Petition";
    type: "PetitionEventType";
    user: "User";
  };
  PetitionDeletedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    petition: "Petition";
    type: "PetitionEventType";
  };
  PetitionEventPagination: {
    // field return type name
    items: "PetitionEvent";
    totalCount: "Int";
  };
  PetitionEventSubscription: {
    // field return type name
    eventTypes: "PetitionEventType";
    eventsUrl: "String";
    fromTemplate: "PetitionBaseMini";
    id: "GID";
    isEnabled: "Boolean";
    isFailing: "Boolean";
    name: "String";
    signatureKeys: "EventSubscriptionSignatureKey";
  };
  PetitionField: {
    // field return type name
    alias: "String";
    attachments: "PetitionFieldAttachment";
    commentCount: "Int";
    comments: "PetitionFieldComment";
    description: "String";
    fromPetitionFieldId: "GID";
    hasCommentsEnabled: "Boolean";
    id: "GID";
    isFixed: "Boolean";
    isInternal: "Boolean";
    isReadOnly: "Boolean";
    multiple: "Boolean";
    optional: "Boolean";
    options: "JSONObject";
    petition: "PetitionBase";
    position: "Int";
    replies: "PetitionFieldReply";
    showActivityInPdf: "Boolean";
    showInPdf: "Boolean";
    title: "String";
    type: "PetitionFieldType";
    unreadCommentCount: "Int";
    visibility: "JSONObject";
  };
  PetitionFieldAttachment: {
    // field return type name
    createdAt: "DateTime";
    field: "PetitionField";
    file: "FileUpload";
    id: "GID";
  };
  PetitionFieldAttachmentUploadData: {
    // field return type name
    attachment: "PetitionFieldAttachment";
    presignedPostData: "AWSPresignedPostData";
  };
  PetitionFieldComment: {
    // field return type name
    author: "UserOrPetitionAccess";
    content: "JSON";
    contentHtml: "String";
    createdAt: "DateTime";
    field: "PetitionField";
    id: "GID";
    isAnonymized: "Boolean";
    isEdited: "Boolean";
    isInternal: "Boolean";
    isUnread: "Boolean";
    mentions: "PetitionFieldCommentMention";
  };
  PetitionFieldCommentUserGroupMention: {
    // field return type name
    mentionedId: "GID";
    userGroup: "UserGroup";
  };
  PetitionFieldCommentUserMention: {
    // field return type name
    mentionedId: "GID";
    user: "User";
  };
  PetitionFieldProgress: {
    // field return type name
    approved: "Int";
    optional: "Int";
    replied: "Int";
    total: "Int";
  };
  PetitionFieldReply: {
    // field return type name
    approvedAt: "DateTime";
    approvedBy: "User";
    content: "JSONObject";
    createdAt: "DateTime";
    field: "PetitionField";
    id: "GID";
    isAnonymized: "Boolean";
    metadata: "JSONObject";
    repliedAt: "DateTime";
    repliedBy: "UserOrPetitionAccess";
    status: "PetitionFieldReplyStatus";
    updatedAt: "DateTime";
    updatedBy: "UserOrPetitionAccess";
  };
  PetitionFolder: {
    // field return type name
    id: "ID";
    minimumPermissionType: "PetitionPermissionType";
    name: "String";
    path: "String";
    petitionCount: "Int";
  };
  PetitionListView: {
    // field return type name
    data: "PetitionListViewData";
    id: "GID";
    isDefault: "Boolean";
    name: "String";
    user: "User";
  };
  PetitionListViewData: {
    // field return type name
    fromTemplateId: "GID";
    path: "String";
    search: "String";
    searchIn: "PetitionListViewSearchIn";
    sharedWith: "PetitionListViewDataSharedWith";
    signature: "PetitionSignatureStatusFilter";
    sort: "PetitionListViewSort";
    status: "PetitionStatus";
    tags: "GID";
    tagsFilters: "PetitionListViewDataTags";
  };
  PetitionListViewDataSharedWith: {
    // field return type name
    filters: "PetitionListViewDataSharedWithFilters";
    operator: "FilterSharedWithLogicalOperator";
  };
  PetitionListViewDataSharedWithFilters: {
    // field return type name
    operator: "FilterSharedWithOperator";
    value: "ID";
  };
  PetitionListViewDataTags: {
    // field return type name
    filters: "PetitionListViewDataTagsFilters";
    operator: "PetitionTagFilterLogicalOperator";
  };
  PetitionListViewDataTagsFilters: {
    // field return type name
    operator: "PetitionTagFilterLineOperator";
    value: "GID";
  };
  PetitionListViewSort: {
    // field return type name
    direction: "PetitionListViewSortDirection";
    field: "PetitionListViewSortField";
  };
  PetitionMessage: {
    // field return type name
    access: "PetitionAccess";
    bouncedAt: "DateTime";
    createdAt: "DateTime";
    deliveredAt: "DateTime";
    emailBody: "String";
    emailSubject: "JSON";
    id: "GID";
    isAnonymized: "Boolean";
    openedAt: "DateTime";
    scheduledAt: "DateTime";
    sender: "User";
    sentAt: "DateTime";
    status: "PetitionMessageStatus";
  };
  PetitionMessageBouncedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    message: "PetitionMessage";
    petition: "Petition";
    type: "PetitionEventType";
  };
  PetitionProgress: {
    // field return type name
    external: "PetitionFieldProgress";
    internal: "PetitionFieldProgress";
  };
  PetitionReminder: {
    // field return type name
    access: "PetitionAccess";
    createdAt: "DateTime";
    emailBody: "String";
    id: "GID";
    sender: "User";
    type: "PetitionReminderType";
  };
  PetitionReminderBouncedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    petition: "Petition";
    reminder: "PetitionReminder";
    type: "PetitionEventType";
  };
  PetitionReopenedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    petition: "Petition";
    type: "PetitionEventType";
    user: "User";
  };
  PetitionSharedUserNotification: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
    isRead: "Boolean";
    owner: "User";
    permissionType: "PetitionPermissionTypeRW";
    petition: "PetitionBase";
    sharedWith: "UserOrUserGroup";
  };
  PetitionSignatureRequest: {
    // field return type name
    auditTrailFilename: "String";
    cancelReason: "String";
    createdAt: "DateTime";
    environment: "SignatureOrgIntegrationEnvironment";
    id: "GID";
    isAnonymized: "Boolean";
    metadata: "JSONObject";
    petition: "Petition";
    signatureConfig: "SignatureConfig";
    signedDocumentFilename: "String";
    signerStatus: "PetitionSignatureRequestSignerStatus";
    status: "PetitionSignatureRequestStatus";
    updatedAt: "DateTime";
  };
  PetitionSignatureRequestSignerStatus: {
    // field return type name
    bouncedAt: "DateTime";
    declinedAt: "DateTime";
    openedAt: "DateTime";
    sentAt: "DateTime";
    signedAt: "DateTime";
    signer: "PetitionSigner";
    status: "String";
  };
  PetitionSigner: {
    // field return type name
    contactId: "GID";
    email: "String";
    firstName: "String";
    fullName: "String";
    lastName: "String";
  };
  PetitionTemplate: {
    // field return type name
    anonymizeAfterMonths: "Int";
    anonymizePurpose: "String";
    attachmentsList: "PetitionAttachmentsList";
    backgroundColor: "String";
    categories: "String";
    closingEmailBody: "JSON";
    completingMessageBody: "JSON";
    completingMessageSubject: "String";
    createdAt: "DateTime";
    customProperties: "JSONObject";
    defaultOnBehalf: "User";
    defaultPath: "String";
    defaultPermissions: "TemplateDefaultPermission";
    description: "JSON";
    descriptionExcerpt: "String";
    descriptionHtml: "String";
    effectiveDefaultPermissions: "EffectivePetitionUserPermission";
    effectivePermissions: "EffectivePetitionUserPermission";
    emailBody: "JSON";
    emailSubject: "String";
    fieldCount: "Int";
    fields: "PetitionField";
    id: "GID";
    imageUrl: "String";
    isAnonymized: "Boolean";
    isCompletingMessageEnabled: "Boolean";
    isPublic: "Boolean";
    isRecipientViewContentsHidden: "Boolean";
    isRestricted: "Boolean";
    isRestrictedWithPassword: "Boolean";
    locale: "PetitionLocale";
    metadata: "JSONObject";
    myEffectivePermission: "EffectivePetitionUserPermission";
    name: "String";
    organization: "Organization";
    owner: "User";
    path: "String";
    permissions: "PetitionPermission";
    publicLink: "PublicPetitionLink";
    remindersConfig: "RemindersConfig";
    selectedDocumentTheme: "OrganizationTheme";
    signatureConfig: "SignatureConfig";
    skipForwardSecurity: "Boolean";
    tags: "Tag";
    tone: "Tone";
    updatedAt: "DateTime";
  };
  PetitionUserGroupPermission: {
    // field return type name
    createdAt: "DateTime";
    group: "UserGroup";
    isSubscribed: "Boolean";
    permissionType: "PetitionPermissionType";
    petition: "Petition";
    updatedAt: "DateTime";
  };
  PetitionUserPermission: {
    // field return type name
    createdAt: "DateTime";
    isSubscribed: "Boolean";
    permissionType: "PetitionPermissionType";
    petition: "Petition";
    updatedAt: "DateTime";
    user: "User";
  };
  Profile: {
    // field return type name
    createdAt: "DateTime";
    fields: "ProfileFieldAndValue";
    id: "GID";
    name: "String";
    profileType: "ProfileType";
    updatedAt: "DateTime";
  };
  ProfileFieldAndValue: {
    // field return type name
    field: "ProfileTypeField";
    value: "ProfileFieldValue";
  };
  ProfileFieldValue: {
    // field return type name
    createdAt: "DateTime";
    createdBy: "User";
    id: "GID";
  };
  ProfileType: {
    // field return type name
    createdAt: "DateTime";
    fields: "ProfileTypeField";
    id: "GID";
    name: "LocalizableUserText";
    updatedAt: "DateTime";
  };
  ProfileTypeField: {
    // field return type name
    alias: "String";
    id: "GID";
    isExpirable: "Boolean";
    myPermission: "ProfileTypeFieldPermission";
    name: "LocalizableUserText";
    options: "JSONObject";
    position: "Int";
    profileType: "ProfileType";
    type: "ProfileTypeFieldType";
  };
  ProfileTypePagination: {
    // field return type name
    items: "ProfileType";
    totalCount: "Int";
  };
  PublicAccessVerification: {
    // field return type name
    cookieName: "String";
    cookieValue: "String";
    email: "String";
    isAllowed: "Boolean";
    isContactlessAccess: "Boolean";
    organization: "PublicOrganization";
    ownerName: "String";
  };
  PublicContact: {
    // field return type name
    email: "String";
    firstName: "String";
    fullName: "String";
    id: "GID";
    initials: "String";
    isMe: "Boolean";
    lastName: "String";
  };
  PublicCreateFileUploadReply: {
    // field return type name
    presignedPostData: "AWSPresignedPostData";
    reply: "PublicPetitionFieldReply";
  };
  PublicLicenseCode: {
    // field return type name
    code: "String";
    details: "JSONObject";
    source: "String";
  };
  PublicOrganization: {
    // field return type name
    brandTheme: "OrganizationBrandThemeData";
    hasRemoveParallelBranding: "Boolean";
    id: "GID";
    logoUrl: "String";
    name: "String";
  };
  PublicPetition: {
    // field return type name
    completingMessageBody: "String";
    completingMessageSubject: "String";
    createdAt: "DateTime";
    deadline: "DateTime";
    fields: "PublicPetitionField";
    hasUnreadComments: "Boolean";
    id: "GID";
    isCompletingMessageEnabled: "Boolean";
    isRecipientViewContentsHidden: "Boolean";
    locale: "PetitionLocale";
    organization: "PublicOrganization";
    progress: "PublicPetitionFieldProgress";
    recipients: "PublicContact";
    signatureConfig: "PublicSignatureConfig";
    signatureStatus: "PublicSignatureStatus";
    status: "PetitionStatus";
    tone: "Tone";
    updatedAt: "DateTime";
  };
  PublicPetitionAccess: {
    // field return type name
    contact: "PublicContact";
    createdAt: "DateTime";
    granter: "PublicUser";
    hasClientPortalAccess: "Boolean";
    keycode: "ID";
    message: "PublicPetitionMessage";
    petition: "PublicPetition";
  };
  PublicPetitionAccessPagination: {
    // field return type name
    items: "PublicPetitionAccess";
    totalCount: "Int";
  };
  PublicPetitionField: {
    // field return type name
    alias: "String";
    attachments: "PetitionFieldAttachment";
    commentCount: "Int";
    comments: "PublicPetitionFieldComment";
    description: "String";
    hasCommentsEnabled: "Boolean";
    id: "GID";
    isInternal: "Boolean";
    isReadOnly: "Boolean";
    multiple: "Boolean";
    optional: "Boolean";
    options: "JSONObject";
    petition: "PublicPetition";
    replies: "PublicPetitionFieldReply";
    title: "String";
    type: "PetitionFieldType";
    unreadCommentCount: "Int";
    visibility: "JSONObject";
  };
  PublicPetitionFieldComment: {
    // field return type name
    author: "PublicUserOrContact";
    content: "JSON";
    contentHtml: "String";
    createdAt: "DateTime";
    field: "PublicPetitionField";
    id: "GID";
    isAnonymized: "Boolean";
    isUnread: "Boolean";
  };
  PublicPetitionFieldProgress: {
    // field return type name
    optional: "Int";
    replied: "Int";
    total: "Int";
  };
  PublicPetitionFieldReply: {
    // field return type name
    content: "JSONObject";
    createdAt: "DateTime";
    field: "PublicPetitionField";
    id: "GID";
    isAnonymized: "Boolean";
    status: "PetitionFieldReplyStatus";
    updatedAt: "DateTime";
  };
  PublicPetitionLink: {
    // field return type name
    description: "String";
    id: "GID";
    isActive: "Boolean";
    owner: "User";
    prefillSecret: "String";
    slug: "String";
    template: "PetitionTemplate";
    title: "String";
    url: "String";
  };
  PublicPetitionMessage: {
    // field return type name
    id: "GID";
    sentAt: "DateTime";
    subject: "String";
  };
  PublicPublicPetitionLink: {
    // field return type name
    description: "String";
    isActive: "Boolean";
    isAvailable: "Boolean";
    owner: "PublicUser";
    slug: "String";
    title: "String";
  };
  PublicRemindersOptOut: {
    // field return type name
    orgLogoUrl: "String";
    orgName: "String";
  };
  PublicSignatureConfig: {
    // field return type name
    additionalSigners: "PetitionSigner";
    allowAdditionalSigners: "Boolean";
    review: "Boolean";
    signers: "PetitionSigner";
  };
  PublicUser: {
    // field return type name
    email: "String";
    firstName: "String";
    fullName: "String";
    id: "GID";
    lastName: "String";
    organization: "PublicOrganization";
  };
  Query: {
    // field return type name
    access: "PublicPetitionAccess";
    accesses: "PublicPetitionAccessPagination";
    contact: "Contact";
    contacts: "ContactPagination";
    contactsByEmail: "Contact";
    dowJonesKycEntityProfile: "DowJonesKycEntityProfileResult";
    dowJonesKycEntitySearch: "DowJonesKycEntitySearchResultPagination";
    emailIsAvailable: "Boolean";
    exportPetitionToJson: "SupportMethodResponse";
    getApiTokenOwner: "SupportMethodResponse";
    getSlugForPublicPetitionLink: "String";
    getUsersOrGroups: "UserOrUserGroup";
    globalIdDecode: "SupportMethodResponse";
    globalIdEncode: "SupportMethodResponse";
    isValidPublicPetitionLinkSlug: "Boolean";
    landingTemplateBySlug: "LandingTemplate";
    landingTemplateCategorySamples: "LandingTemplateCategorySample";
    landingTemplates: "LandingTemplatePagination";
    me: "User";
    metadata: "ConnectionMetadata";
    organization: "Organization";
    organizations: "OrganizationPagination";
    petition: "PetitionBase";
    petitionEvents: "PetitionEvent";
    petitionField: "PetitionField";
    petitionFolders: "String";
    petitions: "PetitionBaseOrFolderPagination";
    petitionsById: "PetitionBase";
    profileType: "ProfileType";
    profileTypes: "ProfileTypePagination";
    publicLicenseCode: "PublicLicenseCode";
    publicOrg: "PublicOrganization";
    publicPetitionField: "PublicPetitionField";
    publicPetitionLinkBySlug: "PublicPublicPetitionLink";
    publicTask: "Task";
    publicTemplateCategories: "String";
    realMe: "User";
    remindersOptOut: "PublicRemindersOptOut";
    searchUserGroups: "UserGroup";
    searchUsers: "UserOrUserGroup";
    subscriptions: "PetitionEventSubscription";
    tags: "TagPagination";
    task: "Task";
    templates: "PetitionBaseOrFolderPagination";
    userGroup: "UserGroup";
    userGroups: "UserGroupPagination";
  };
  RecipientSignedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    petition: "Petition";
    signer: "PetitionSigner";
    type: "PetitionEventType";
  };
  ReminderEmailBouncedUserNotification: {
    // field return type name
    access: "PetitionAccess";
    createdAt: "DateTime";
    id: "GID";
    isRead: "Boolean";
    petition: "PetitionBase";
  };
  ReminderSentEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    petition: "Petition";
    reminder: "PetitionReminder";
    type: "PetitionEventType";
  };
  RemindersConfig: {
    // field return type name
    limit: "Int";
    offset: "Int";
    time: "String";
    timezone: "String";
    weekdaysOnly: "Boolean";
  };
  RemindersOptOutEvent: {
    // field return type name
    access: "PetitionAccess";
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    other: "String";
    petition: "Petition";
    reason: "String";
    type: "PetitionEventType";
  };
  RemindersOptOutNotification: {
    // field return type name
    access: "PetitionAccess";
    createdAt: "DateTime";
    id: "GID";
    isRead: "Boolean";
    other: "String";
    petition: "PetitionBase";
    reason: "String";
  };
  ReplyCreatedEvent: {
    // field return type name
    createdAt: "DateTime";
    createdBy: "UserOrPetitionAccess";
    data: "JSONObject";
    field: "PetitionField";
    id: "GID";
    petition: "Petition";
    reply: "PetitionFieldReply";
    type: "PetitionEventType";
  };
  ReplyDeletedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    deletedBy: "UserOrPetitionAccess";
    field: "PetitionField";
    id: "GID";
    petition: "Petition";
    type: "PetitionEventType";
  };
  ReplyStatusChangedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    field: "PetitionField";
    id: "GID";
    petition: "Petition";
    reply: "PetitionFieldReply";
    status: "PetitionFieldReplyStatus";
    type: "PetitionEventType";
    updatedBy: "UserOrPetitionAccess";
  };
  ReplyUpdatedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    field: "PetitionField";
    id: "GID";
    petition: "Petition";
    reply: "PetitionFieldReply";
    type: "PetitionEventType";
    updatedBy: "UserOrPetitionAccess";
  };
  SendPetitionResult: {
    // field return type name
    accesses: "PetitionAccess";
    petition: "Petition";
    result: "Result";
  };
  SignatureCancelledEvent: {
    // field return type name
    cancelType: "PetitionSignatureCancelReason";
    cancelledBy: "UserOrPetitionAccess";
    canceller: "PetitionSigner";
    cancellerReason: "String";
    createdAt: "DateTime";
    data: "JSONObject";
    errorCode: "String";
    extraErrorData: "JSON";
    id: "GID";
    petition: "Petition";
    type: "PetitionEventType";
  };
  SignatureCancelledUserNotification: {
    // field return type name
    createdAt: "DateTime";
    errorCode: "String";
    extraErrorData: "JSON";
    id: "GID";
    isRead: "Boolean";
    petition: "PetitionBase";
  };
  SignatureCompletedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    petition: "Petition";
    type: "PetitionEventType";
  };
  SignatureCompletedUserNotification: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
    isRead: "Boolean";
    petition: "PetitionBase";
  };
  SignatureConfig: {
    // field return type name
    allowAdditionalSigners: "Boolean";
    integration: "SignatureOrgIntegration";
    review: "Boolean";
    signers: "PetitionSigner";
    timezone: "String";
    title: "String";
  };
  SignatureOpenedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    petition: "Petition";
    signer: "PetitionSigner";
    type: "PetitionEventType";
  };
  SignatureOrgIntegration: {
    // field return type name
    environment: "SignatureOrgIntegrationEnvironment";
    id: "GID";
    invalidCredentials: "Boolean";
    isDefault: "Boolean";
    name: "String";
    provider: "SignatureOrgIntegrationProvider";
    type: "IntegrationType";
  };
  SignatureReminderEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    petition: "Petition";
    type: "PetitionEventType";
    user: "User";
  };
  SignatureStartedEvent: {
    // field return type name
    bouncedAt: "DateTime";
    createdAt: "DateTime";
    data: "JSONObject";
    deliveredAt: "DateTime";
    id: "GID";
    openedAt: "DateTime";
    petition: "Petition";
    type: "PetitionEventType";
  };
  SupportMethodResponse: {
    // field return type name
    message: "String";
    result: "Result";
    type: "String";
  };
  Tag: {
    // field return type name
    color: "String";
    createdAt: "DateTime";
    id: "GID";
    name: "String";
  };
  TagPagination: {
    // field return type name
    items: "Tag";
    totalCount: "Int";
  };
  Task: {
    // field return type name
    id: "GID";
    name: "TaskName";
    output: "JSON";
    progress: "Int";
    status: "TaskStatus";
  };
  TaskResultFile: {
    // field return type name
    filename: "String";
    url: "String";
  };
  TemplateDefaultUserGroupPermission: {
    // field return type name
    createdAt: "DateTime";
    group: "UserGroup";
    id: "GID";
    isSubscribed: "Boolean";
    permissionType: "PetitionPermissionType";
    updatedAt: "DateTime";
  };
  TemplateDefaultUserPermission: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
    isSubscribed: "Boolean";
    permissionType: "PetitionPermissionType";
    updatedAt: "DateTime";
    user: "User";
  };
  TemplateUsedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    petition: "Petition";
    type: "PetitionEventType";
  };
  User: {
    // field return type name
    avatarUrl: "String";
    canCreateUsers: "Boolean";
    createdAt: "DateTime";
    delegateOf: "User";
    delegates: "User";
    email: "String";
    firstName: "String";
    fullName: "String";
    hasFeatureFlag: "Boolean";
    id: "GID";
    initials: "String";
    isMe: "Boolean";
    isSsoUser: "Boolean";
    isSuperAdmin: "Boolean";
    lastActiveAt: "DateTime";
    lastName: "String";
    notifications: "UserNotifications_Pagination";
    organization: "Organization";
    organizations: "Organization";
    petitionListViews: "PetitionListView";
    preferredLocale: "UserLocale";
    role: "OrganizationRole";
    status: "UserStatus";
    tokens: "UserAuthenticationToken";
    unreadNotificationIds: "GID";
    updatedAt: "DateTime";
    userGroups: "UserGroup";
  };
  UserAuthenticationToken: {
    // field return type name
    createdAt: "DateTime";
    hint: "String";
    id: "GID";
    lastUsedAt: "DateTime";
    tokenName: "String";
  };
  UserGroup: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
    imMember: "Boolean";
    initials: "String";
    memberCount: "Int";
    members: "UserGroupMember";
    name: "String";
    updatedAt: "DateTime";
  };
  UserGroupMember: {
    // field return type name
    addedAt: "DateTime";
    id: "GID";
    user: "User";
  };
  UserGroupPagination: {
    // field return type name
    items: "UserGroup";
    totalCount: "Int";
  };
  UserNotifications_Pagination: {
    // field return type name
    hasMore: "Boolean";
    items: "PetitionUserNotification";
  };
  UserPagination: {
    // field return type name
    items: "User";
    totalCount: "Int";
  };
  UserPermissionAddedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    permissionType: "PetitionPermissionType";
    permissionUser: "User";
    petition: "Petition";
    type: "PetitionEventType";
    user: "User";
  };
  UserPermissionEditedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    permissionType: "PetitionPermissionType";
    permissionUser: "User";
    petition: "Petition";
    type: "PetitionEventType";
    user: "User";
  };
  UserPermissionRemovedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    permissionUser: "User";
    petition: "Petition";
    type: "PetitionEventType";
    user: "User";
  };
  VerificationCodeCheck: {
    // field return type name
    remainingAttempts: "Int";
    result: "Result";
  };
  VerificationCodeRequest: {
    // field return type name
    expiresAt: "DateTime";
    remainingAttempts: "Int";
    token: "ID";
  };
  CreatedAt: {
    // field return type name
    createdAt: "DateTime";
  };
  DowJonesKycEntityProfileResult: {
    // field return type name
    iconHints: "String";
    id: "ID";
    name: "String";
    profileId: "ID";
    relationships: "DowJonesKycEntityRelationship";
    sanctions: "DowJonesKycEntitySanction";
    type: "DowJonesKycEntityType";
    updatedAt: "DateTime";
  };
  DowJonesKycEntitySearchResult: {
    // field return type name
    countryTerritoryName: "String";
    iconHints: "String";
    id: "ID";
    isSubsidiary: "Boolean";
    name: "String";
    profileId: "ID";
    title: "String";
    type: "DowJonesKycEntityType";
  };
  IOrgIntegration: {
    // field return type name
    id: "GID";
    invalidCredentials: "Boolean";
    isDefault: "Boolean";
    name: "String";
    type: "IntegrationType";
  };
  PetitionBase: {
    // field return type name
    anonymizeAfterMonths: "Int";
    anonymizePurpose: "String";
    attachmentsList: "PetitionAttachmentsList";
    closingEmailBody: "JSON";
    completingMessageBody: "JSON";
    completingMessageSubject: "String";
    createdAt: "DateTime";
    customProperties: "JSONObject";
    defaultOnBehalf: "User";
    effectivePermissions: "EffectivePetitionUserPermission";
    emailBody: "JSON";
    emailSubject: "String";
    fieldCount: "Int";
    fields: "PetitionField";
    id: "GID";
    isAnonymized: "Boolean";
    isCompletingMessageEnabled: "Boolean";
    isRecipientViewContentsHidden: "Boolean";
    isRestricted: "Boolean";
    isRestrictedWithPassword: "Boolean";
    locale: "PetitionLocale";
    metadata: "JSONObject";
    myEffectivePermission: "EffectivePetitionUserPermission";
    name: "String";
    organization: "Organization";
    owner: "User";
    path: "String";
    permissions: "PetitionPermission";
    remindersConfig: "RemindersConfig";
    selectedDocumentTheme: "OrganizationTheme";
    signatureConfig: "SignatureConfig";
    skipForwardSecurity: "Boolean";
    tags: "Tag";
    tone: "Tone";
    updatedAt: "DateTime";
  };
  PetitionEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    petition: "Petition";
    type: "PetitionEventType";
  };
  PetitionPermission: {
    // field return type name
    createdAt: "DateTime";
    isSubscribed: "Boolean";
    permissionType: "PetitionPermissionType";
    petition: "Petition";
    updatedAt: "DateTime";
  };
  PetitionUserNotification: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
    isRead: "Boolean";
    petition: "PetitionBase";
  };
  TemplateDefaultPermission: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
    isSubscribed: "Boolean";
    permissionType: "PetitionPermissionType";
    updatedAt: "DateTime";
  };
  Timestamps: {
    // field return type name
    createdAt: "DateTime";
    updatedAt: "DateTime";
  };
}

export interface NexusGenArgTypes {
  Contact: {
    accesses: {
      // args
      limit?: number | null; // Int
      offset?: number | null; // Int
    };
  };
  LandingTemplate: {
    imageUrl: {
      // args
      small?: boolean | null; // Boolean
    };
  };
  LandingTemplateCategorySample: {
    templates: {
      // args
      limit?: number | null; // Int
      locale: NexusGenEnums["PetitionLocale"]; // PetitionLocale!
      offset?: number | null; // Int
    };
  };
  Mutation: {
    activateUser: {
      // args
      userIds: NexusGenScalars["GID"][]; // [GID!]!
    };
    addPetitionPermission: {
      // args
      message?: string | null; // String
      notify?: boolean | null; // Boolean
      permissionType: NexusGenEnums["PetitionPermissionTypeRW"]; // PetitionPermissionTypeRW!
      petitionIds: NexusGenScalars["GID"][]; // [GID!]!
      subscribe: boolean | null; // Boolean
      userGroupIds?: NexusGenScalars["GID"][] | null; // [GID!]
      userIds?: NexusGenScalars["GID"][] | null; // [GID!]
    };
    addUsersToUserGroup: {
      // args
      userGroupId: NexusGenScalars["GID"]; // GID!
      userIds: NexusGenScalars["GID"][]; // [GID!]!
    };
    anonymizePetition: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    approveOrRejectPetitionFieldReplies: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
      status: NexusGenEnums["PetitionFieldReplyStatus"]; // PetitionFieldReplyStatus!
    };
    bulkCreateContacts: {
      // args
      file: NexusGenScalars["Upload"]; // Upload!
      force?: boolean | null; // Boolean
    };
    bulkCreatePetitionReplies: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
      replies: NexusGenScalars["JSONObject"]; // JSONObject!
    };
    cancelScheduledMessage: {
      // args
      messageId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    cancelSignatureRequest: {
      // args
      petitionSignatureRequestId: NexusGenScalars["GID"]; // GID!
    };
    changeOrganization: {
      // args
      orgId?: NexusGenScalars["GID"] | null; // GID
    };
    changePassword: {
      // args
      newPassword: string; // String!
      password: string; // String!
    };
    changePetitionFieldType: {
      // args
      fieldId: NexusGenScalars["GID"]; // GID!
      force?: boolean | null; // Boolean
      petitionId: NexusGenScalars["GID"]; // GID!
      type: NexusGenEnums["PetitionFieldType"]; // PetitionFieldType!
    };
    clonePetitionField: {
      // args
      fieldId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    clonePetitions: {
      // args
      keepTitle?: boolean | null; // Boolean
      path?: string | null; // String
      petitionIds: NexusGenScalars["GID"][]; // [GID!]!
    };
    cloneUserGroups: {
      // args
      locale: NexusGenEnums["UserLocale"]; // UserLocale!
      userGroupIds: NexusGenScalars["GID"][]; // [GID!]!
    };
    closePetition: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    completePetition: {
      // args
      additionalSigners?: NexusGenInputs["PublicPetitionSignerDataInput"][] | null; // [PublicPetitionSignerDataInput!]
      message?: string | null; // String
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    createContact: {
      // args
      data: NexusGenInputs["CreateContactInput"]; // CreateContactInput!
      force?: boolean | null; // Boolean
    };
    createDowJonesKycIntegration: {
      // args
      clientId: string; // String!
      password: string; // String!
      username: string; // String!
    };
    createDowJonesKycReply: {
      // args
      fieldId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
      profileId: string; // ID!
    };
    createDowJonesProfileDownloadTask: {
      // args
      profileId: string; // ID!
    };
    createEventSubscription: {
      // args
      eventTypes?: NexusGenEnums["PetitionEventType"][] | null; // [PetitionEventType!]
      eventsUrl: string; // String!
      fromTemplateId?: NexusGenScalars["GID"] | null; // GID
      name?: string | null; // String
    };
    createEventSubscriptionSignatureKey: {
      // args
      subscriptionId: NexusGenScalars["GID"]; // GID!
    };
    createExportExcelTask: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    createExportRepliesTask: {
      // args
      pattern?: string | null; // String
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    createFileUploadReply: {
      // args
      fieldId: NexusGenScalars["GID"]; // GID!
      file: NexusGenInputs["FileUploadInput"]; // FileUploadInput!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    createFileUploadReplyComplete: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
      replyId: NexusGenScalars["GID"]; // GID!
    };
    createOrganization: {
      // args
      email: string; // String!
      firstName: string; // String!
      lastName: string; // String!
      locale: NexusGenEnums["UserLocale"]; // UserLocale!
      name: string; // String!
      status: NexusGenEnums["OrganizationStatus"]; // OrganizationStatus!
    };
    createOrganizationPdfDocumentTheme: {
      // args
      isDefault: boolean; // Boolean!
      name: string; // String!
    };
    createPetition: {
      // args
      locale?: NexusGenEnums["PetitionLocale"] | null; // PetitionLocale
      name?: string | null; // String
      path?: string | null; // String
      petitionId?: NexusGenScalars["GID"] | null; // GID
      type: NexusGenEnums["PetitionBaseType"] | null; // PetitionBaseType
    };
    createPetitionAccess: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    createPetitionAttachmentUploadLink: {
      // args
      data: NexusGenInputs["FileUploadInput"][]; // [FileUploadInput!]!
      petitionId: NexusGenScalars["GID"]; // GID!
      type: NexusGenEnums["PetitionAttachmentType"]; // PetitionAttachmentType!
    };
    createPetitionField: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
      position?: number | null; // Int
      type: NexusGenEnums["PetitionFieldType"]; // PetitionFieldType!
    };
    createPetitionFieldAttachmentUploadLink: {
      // args
      data: NexusGenInputs["FileUploadInput"]; // FileUploadInput!
      fieldId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    createPetitionFieldComment: {
      // args
      content: NexusGenScalars["JSON"]; // JSON!
      isInternal: boolean; // Boolean!
      petitionFieldId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
      sharePetition?: boolean | null; // Boolean
      sharePetitionPermission?: NexusGenEnums["PetitionPermissionTypeRW"] | null; // PetitionPermissionTypeRW
      sharePetitionSubscribed?: boolean | null; // Boolean
      throwOnNoPermission?: boolean | null; // Boolean
    };
    createPetitionFieldReply: {
      // args
      fieldId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
      reply: NexusGenScalars["JSON"]; // JSON!
    };
    createPetitionListView: {
      // args
      data: NexusGenInputs["PetitionListViewDataInput"]; // PetitionListViewDataInput!
      name: string; // String!
    };
    createPrintPdfTask: {
      // args
      includeNdLinks?: boolean | null; // Boolean
      petitionId: NexusGenScalars["GID"]; // GID!
      skipAttachments?: boolean | null; // Boolean
    };
    createProfile: {
      // args
      data: NexusGenInputs["CreateProfileInput"]; // CreateProfileInput!
      profileTypeId: NexusGenScalars["GID"]; // GID!
    };
    createProfileType: {
      // args
      name: NexusGenScalars["LocalizableUserText"]; // LocalizableUserText!
    };
    createProfileTypeField: {
      // args
      data: NexusGenInputs["CreateProfileTypeFieldInput"]; // CreateProfileTypeFieldInput!
      profileTypeId: NexusGenScalars["GID"]; // GID!
    };
    createPublicPetitionLink: {
      // args
      description: string; // String!
      prefillSecret?: string | null; // String
      slug?: string | null; // String
      templateId: NexusGenScalars["GID"]; // GID!
      title: string; // String!
    };
    createPublicPetitionLinkPrefillData: {
      // args
      data: NexusGenScalars["JSONObject"]; // JSONObject!
      path?: string | null; // String
      publicPetitionLinkId: NexusGenScalars["GID"]; // GID!
    };
    createSignaturitIntegration: {
      // args
      apiKey: string; // String!
      isDefault?: boolean | null; // Boolean
      name: string; // String!
    };
    createTag: {
      // args
      color: string; // String!
      name: string; // String!
    };
    createTemplateRepliesReportTask: {
      // args
      endDate?: NexusGenScalars["DateTime"] | null; // DateTime
      petitionId: NexusGenScalars["GID"]; // GID!
      startDate?: NexusGenScalars["DateTime"] | null; // DateTime
      timezone: string; // String!
    };
    createTemplateStatsReportTask: {
      // args
      endDate?: NexusGenScalars["DateTime"] | null; // DateTime
      startDate?: NexusGenScalars["DateTime"] | null; // DateTime
      templateId: NexusGenScalars["GID"]; // GID!
    };
    createTemplatesOverviewReportTask: {
      // args
      endDate?: NexusGenScalars["DateTime"] | null; // DateTime
      startDate?: NexusGenScalars["DateTime"] | null; // DateTime
    };
    createUserGroup: {
      // args
      name: string; // String!
      userIds: NexusGenScalars["GID"][]; // [GID!]!
    };
    deactivateAccesses: {
      // args
      accessIds: NexusGenScalars["GID"][]; // [GID!]!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    deactivateUser: {
      // args
      includeDrafts?: boolean | null; // Boolean
      tagIds?: NexusGenScalars["GID"][] | null; // [GID!]
      transferToUserId: NexusGenScalars["GID"]; // GID!
      userIds: NexusGenScalars["GID"][]; // [GID!]!
    };
    deleteContacts: {
      // args
      force?: boolean | null; // Boolean
      ids: NexusGenScalars["GID"][]; // [GID!]!
    };
    deleteEventSubscriptionSignatureKeys: {
      // args
      ids: NexusGenScalars["GID"][]; // [GID!]!
    };
    deleteEventSubscriptions: {
      // args
      ids: NexusGenScalars["GID"][]; // [GID!]!
    };
    deleteOrganizationPdfDocumentTheme: {
      // args
      orgThemeId: NexusGenScalars["GID"]; // GID!
    };
    deletePetitionAttachment: {
      // args
      attachmentId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    deletePetitionField: {
      // args
      fieldId: NexusGenScalars["GID"]; // GID!
      force?: boolean | null; // Boolean
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    deletePetitionFieldAttachment: {
      // args
      attachmentId: NexusGenScalars["GID"]; // GID!
      fieldId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    deletePetitionFieldComment: {
      // args
      petitionFieldCommentId: NexusGenScalars["GID"]; // GID!
      petitionFieldId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    deletePetitionListView: {
      // args
      id: NexusGenScalars["GID"]; // GID!
    };
    deletePetitionReply: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
      replyId: NexusGenScalars["GID"]; // GID!
    };
    deletePetitions: {
      // args
      dryrun?: boolean | null; // Boolean
      folders?: NexusGenInputs["FoldersInput"] | null; // FoldersInput
      force?: boolean | null; // Boolean
      ids?: NexusGenScalars["GID"][] | null; // [GID!]
    };
    deleteProfile: {
      // args
      profileIds: NexusGenScalars["GID"][]; // [GID!]!
    };
    deleteProfileType: {
      // args
      ids: NexusGenScalars["GID"][]; // [GID!]!
    };
    deleteProfileTypeField: {
      // args
      profileTypeFieldIds: NexusGenScalars["GID"][]; // [GID!]!
      profileTypeId: NexusGenScalars["GID"]; // GID!
    };
    deleteSignatureIntegration: {
      // args
      force?: boolean | null; // Boolean
      id: NexusGenScalars["GID"]; // GID!
    };
    deleteTag: {
      // args
      force?: boolean | null; // Boolean
      id: NexusGenScalars["GID"]; // GID!
    };
    deleteUserGroup: {
      // args
      ids: NexusGenScalars["GID"][]; // [GID!]!
    };
    dynamicSelectFieldFileDownloadLink: {
      // args
      fieldId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    editPetitionPermission: {
      // args
      permissionType: NexusGenEnums["PetitionPermissionType"]; // PetitionPermissionType!
      petitionIds: NexusGenScalars["GID"][]; // [GID!]!
      userGroupIds?: NexusGenScalars["GID"][] | null; // [GID!]
      userIds?: NexusGenScalars["GID"][] | null; // [GID!]
    };
    fileUploadReplyDownloadLink: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
      preview?: boolean | null; // Boolean
      replyId: NexusGenScalars["GID"]; // GID!
    };
    forceUpdateSignatureOrganizationBrandings: {
      // args
      orgId: NexusGenScalars["GID"]; // GID!
    };
    generateUserAuthToken: {
      // args
      tokenName: string; // String!
    };
    getTaskResultFile: {
      // args
      preview?: boolean | null; // Boolean
      taskId: NexusGenScalars["GID"]; // GID!
    };
    importPetitionFromJson: {
      // args
      json: string; // String!
      userId: NexusGenScalars["GID"]; // GID!
    };
    inviteUserToOrganization: {
      // args
      email: string; // String!
      firstName: string; // String!
      lastName: string; // String!
      locale: NexusGenEnums["UserLocale"]; // UserLocale!
      orgId?: NexusGenScalars["GID"] | null; // GID
      role: NexusGenEnums["OrganizationRole"]; // OrganizationRole!
      userGroupIds?: NexusGenScalars["GID"][] | null; // [GID!]
    };
    loginAs: {
      // args
      userId: NexusGenScalars["GID"]; // GID!
    };
    markPetitionListViewAsDefault: {
      // args
      petitionListViewId?: NexusGenScalars["GID"] | null; // GID
    };
    markSignatureIntegrationAsDefault: {
      // args
      id: NexusGenScalars["GID"]; // GID!
    };
    modifyCurrentUsagePeriod: {
      // args
      limitName: NexusGenEnums["OrganizationUsageLimitName"]; // OrganizationUsageLimitName!
      newLimit: number; // Int!
      orgId: NexusGenScalars["GID"]; // GID!
    };
    modifyPetitionCustomProperty: {
      // args
      key: string; // String!
      petitionId: NexusGenScalars["GID"]; // GID!
      value?: string | null; // String
    };
    movePetitions: {
      // args
      destination: string; // String!
      folderIds?: string[] | null; // [ID!]
      ids?: NexusGenScalars["GID"][] | null; // [GID!]
      source: string; // String!
      type: NexusGenEnums["PetitionBaseType"]; // PetitionBaseType!
    };
    petitionAttachmentDownloadLink: {
      // args
      attachmentId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
      preview?: boolean | null; // Boolean
    };
    petitionAttachmentUploadComplete: {
      // args
      attachmentId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    petitionFieldAttachmentDownloadLink: {
      // args
      attachmentId: NexusGenScalars["GID"]; // GID!
      fieldId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    petitionFieldAttachmentUploadComplete: {
      // args
      attachmentId: NexusGenScalars["GID"]; // GID!
      fieldId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    publicCheckVerificationCode: {
      // args
      code: string; // String!
      keycode: string; // ID!
      token: string; // ID!
    };
    publicCompletePetition: {
      // args
      additionalSigners?: NexusGenInputs["PublicPetitionSignerDataInput"][] | null; // [PublicPetitionSignerDataInput!]
      keycode: string; // ID!
      message?: string | null; // String
    };
    publicCreateAndSendPetitionFromPublicLink: {
      // args
      contactEmail: string; // String!
      contactFirstName: string; // String!
      contactLastName: string; // String!
      force?: boolean | null; // Boolean
      prefill?: string | null; // String
      prefillDataKey?: string | null; // ID
      slug: string; // ID!
    };
    publicCreateFileUploadReply: {
      // args
      data: NexusGenInputs["FileUploadInput"]; // FileUploadInput!
      fieldId: NexusGenScalars["GID"]; // GID!
      keycode: string; // ID!
    };
    publicCreatePetitionFieldComment: {
      // args
      content: NexusGenScalars["JSON"]; // JSON!
      keycode: string; // ID!
      petitionFieldId: NexusGenScalars["GID"]; // GID!
    };
    publicCreatePetitionFieldReply: {
      // args
      fieldId: NexusGenScalars["GID"]; // GID!
      keycode: string; // ID!
      reply: NexusGenScalars["JSON"]; // JSON!
    };
    publicCreatePrintPdfTask: {
      // args
      keycode: string; // ID!
    };
    publicDelegateAccessToContact: {
      // args
      email: string; // String!
      firstName: string; // String!
      keycode: string; // ID!
      lastName: string; // String!
      messageBody: NexusGenScalars["JSON"]; // JSON!
    };
    publicDeletePetitionFieldComment: {
      // args
      keycode: string; // ID!
      petitionFieldCommentId: NexusGenScalars["GID"]; // GID!
      petitionFieldId: NexusGenScalars["GID"]; // GID!
    };
    publicDeletePetitionFieldReply: {
      // args
      keycode: string; // ID!
      replyId: NexusGenScalars["GID"]; // GID!
    };
    publicFileUploadReplyComplete: {
      // args
      keycode: string; // ID!
      replyId: NexusGenScalars["GID"]; // GID!
    };
    publicFileUploadReplyDownloadLink: {
      // args
      keycode: string; // ID!
      preview?: boolean | null; // Boolean
      replyId: NexusGenScalars["GID"]; // GID!
    };
    publicGetTaskResultFileUrl: {
      // args
      keycode: string; // ID!
      taskId: NexusGenScalars["GID"]; // GID!
    };
    publicMarkPetitionFieldCommentsAsRead: {
      // args
      keycode: string; // ID!
      petitionFieldCommentIds: NexusGenScalars["GID"][]; // [GID!]!
    };
    publicPetitionFieldAttachmentDownloadLink: {
      // args
      attachmentId: NexusGenScalars["GID"]; // GID!
      fieldId: NexusGenScalars["GID"]; // GID!
      keycode: string; // ID!
      preview?: boolean | null; // Boolean
    };
    publicRemindersOptOut: {
      // args
      keycode: string; // ID!
      other: string; // String!
      reason: string; // String!
      referer?: string | null; // String
    };
    publicResetTempPassword: {
      // args
      email: string; // String!
      locale: NexusGenEnums["UserLocale"]; // UserLocale!
    };
    publicSendReminder: {
      // args
      contactEmail: string; // String!
      keycode?: string | null; // ID
      slug?: string | null; // ID
    };
    publicSendVerificationCode: {
      // args
      email?: string | null; // String
      firstName?: string | null; // String
      keycode: string; // ID!
      lastName?: string | null; // String
    };
    publicStartAsyncFieldCompletion: {
      // args
      fieldId: NexusGenScalars["GID"]; // GID!
      keycode: string; // ID!
    };
    publicUpdatePetitionFieldComment: {
      // args
      content: NexusGenScalars["JSON"]; // JSON!
      keycode: string; // ID!
      petitionFieldCommentId: NexusGenScalars["GID"]; // GID!
      petitionFieldId: NexusGenScalars["GID"]; // GID!
    };
    publicUpdatePetitionFieldReply: {
      // args
      keycode: string; // ID!
      reply: NexusGenScalars["JSON"]; // JSON!
      replyId: NexusGenScalars["GID"]; // GID!
    };
    reactivateAccesses: {
      // args
      accessIds: NexusGenScalars["GID"][]; // [GID!]!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    removePetitionPassword: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    removePetitionPermission: {
      // args
      petitionIds: NexusGenScalars["GID"][]; // [GID!]!
      removeAll?: boolean | null; // Boolean
      userGroupIds?: NexusGenScalars["GID"][] | null; // [GID!]
      userIds?: NexusGenScalars["GID"][] | null; // [GID!]
    };
    removeUsersFromGroup: {
      // args
      userGroupId: NexusGenScalars["GID"]; // GID!
      userIds: NexusGenScalars["GID"][]; // [GID!]!
    };
    renameFolder: {
      // args
      folderId: string; // ID!
      name?: string | null; // String
      type: NexusGenEnums["PetitionBaseType"]; // PetitionBaseType!
    };
    reopenPetition: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    reorderPetitionAttachments: {
      // args
      attachmentIds: NexusGenScalars["GID"][]; // [GID!]!
      attachmentType: NexusGenEnums["PetitionAttachmentType"]; // PetitionAttachmentType!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    reorderPetitionListViews: {
      // args
      ids: NexusGenScalars["GID"][]; // [GID!]!
    };
    resendVerificationEmail: {
      // args
      email: string; // String!
      locale: NexusGenEnums["UserLocale"]; // UserLocale!
    };
    resetTempPassword: {
      // args
      email: string; // String!
      locale: NexusGenEnums["UserLocale"]; // UserLocale!
    };
    resetUserPassword: {
      // args
      email: string; // String!
      locale: NexusGenEnums["UserLocale"]; // UserLocale!
    };
    restoreDeletedPetition: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    revokeUserAuthToken: {
      // args
      authTokenIds: NexusGenScalars["GID"][]; // [GID!]!
    };
    sendPetition: {
      // args
      body: NexusGenScalars["JSON"]; // JSON!
      bulkSendSigningMode?: NexusGenEnums["BulkSendSigningMode"] | null; // BulkSendSigningMode
      contactIdGroups: NexusGenScalars["GID"][][]; // [[GID!]!]!
      petitionId: NexusGenScalars["GID"]; // GID!
      remindersConfig?: NexusGenInputs["RemindersConfigInput"] | null; // RemindersConfigInput
      scheduledAt?: NexusGenScalars["DateTime"] | null; // DateTime
      senderId?: NexusGenScalars["GID"] | null; // GID
      subject: string; // String!
    };
    sendPetitionClosedNotification: {
      // args
      attachPdfExport: boolean; // Boolean!
      emailBody: NexusGenScalars["JSON"]; // JSON!
      force?: boolean | null; // Boolean
      pdfExportTitle?: string | null; // String
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    sendReminders: {
      // args
      accessIds: NexusGenScalars["GID"][]; // [GID!]!
      body?: NexusGenScalars["JSON"] | null; // JSON
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    sendSignatureRequestReminders: {
      // args
      petitionSignatureRequestId: NexusGenScalars["GID"]; // GID!
    };
    setUserDelegates: {
      // args
      delegateIds: NexusGenScalars["GID"][]; // [GID!]!
    };
    shareSignaturitApiKey: {
      // args
      duration: NexusGenScalars["Duration"]; // Duration!
      limit: number; // Int!
      orgId: NexusGenScalars["GID"]; // GID!
    };
    signUp: {
      // args
      captcha: string; // String!
      email: string; // String!
      firstName: string; // String!
      industry?: string | null; // String
      lastName: string; // String!
      licenseCode?: string | null; // String
      locale: NexusGenEnums["UserLocale"]; // UserLocale!
      organizationLogo?: NexusGenScalars["Upload"] | null; // Upload
      organizationName: string; // String!
      password: string; // String!
      position?: string | null; // String
      role?: string | null; // String
    };
    signaturitIntegrationShowSecurityStamp: {
      // args
      integrationId: number; // Int!
      showCsv: boolean; // Boolean!
    };
    signedPetitionDownloadLink: {
      // args
      downloadAuditTrail?: boolean | null; // Boolean
      petitionSignatureRequestId: NexusGenScalars["GID"]; // GID!
      preview?: boolean | null; // Boolean
    };
    startAsyncFieldCompletion: {
      // args
      fieldId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    startSignatureRequest: {
      // args
      message?: string | null; // String
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    switchAutomaticReminders: {
      // args
      accessIds: NexusGenScalars["GID"][]; // [GID!]!
      petitionId: NexusGenScalars["GID"]; // GID!
      remindersConfig?: NexusGenInputs["RemindersConfigInput"] | null; // RemindersConfigInput
      start: boolean; // Boolean!
    };
    tagPetition: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
      tagId: NexusGenScalars["GID"]; // GID!
    };
    transferOrganizationOwnership: {
      // args
      orgId: NexusGenScalars["GID"]; // GID!
      userId: NexusGenScalars["GID"]; // GID!
    };
    transferPetitionOwnership: {
      // args
      petitionIds: NexusGenScalars["GID"][]; // [GID!]!
      userId: NexusGenScalars["GID"]; // GID!
    };
    untagPetition: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
      tagId: NexusGenScalars["GID"]; // GID!
    };
    updateContact: {
      // args
      data: NexusGenInputs["UpdateContactInput"]; // UpdateContactInput!
      id: NexusGenScalars["GID"]; // GID!
    };
    updateEventSubscription: {
      // args
      eventTypes?: NexusGenEnums["PetitionEventType"][] | null; // [PetitionEventType!]
      eventsUrl?: string | null; // String
      fromTemplateId?: NexusGenScalars["GID"] | null; // GID
      id: NexusGenScalars["GID"]; // GID!
      isEnabled?: boolean | null; // Boolean
      name?: string | null; // String
    };
    updateFeatureFlags: {
      // args
      featureFlags: NexusGenInputs["InputFeatureFlagNameValue"][]; // [InputFeatureFlagNameValue!]!
      orgId: NexusGenScalars["GID"]; // GID!
    };
    updateFieldPositions: {
      // args
      fieldIds: NexusGenScalars["GID"][]; // [GID!]!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    updateFileUploadReply: {
      // args
      file: NexusGenInputs["FileUploadInput"]; // FileUploadInput!
      petitionId: NexusGenScalars["GID"]; // GID!
      replyId: NexusGenScalars["GID"]; // GID!
    };
    updateFileUploadReplyComplete: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
      replyId: NexusGenScalars["GID"]; // GID!
    };
    updateLandingTemplateMetadata: {
      // args
      backgroundColor?: string | null; // String
      categories?: string | null; // String
      description?: string | null; // String
      image?: NexusGenScalars["Upload"] | null; // Upload
      slug?: string | null; // String
      templateId: NexusGenScalars["GID"]; // GID!
    };
    updateOrganizationAutoAnonymizePeriod: {
      // args
      months?: number | null; // Int
    };
    updateOrganizationBrandTheme: {
      // args
      data: NexusGenInputs["OrganizationBrandThemeInput"]; // OrganizationBrandThemeInput!
    };
    updateOrganizationLogo: {
      // args
      file: NexusGenScalars["Upload"]; // Upload!
      isIcon?: boolean | null; // Boolean
    };
    updateOrganizationPdfDocumentTheme: {
      // args
      data?: NexusGenInputs["OrganizationPdfDocumentThemeInput"] | null; // OrganizationPdfDocumentThemeInput
      isDefault?: boolean | null; // Boolean
      name?: string | null; // String
      orgThemeId: NexusGenScalars["GID"]; // GID!
    };
    updateOrganizationTier: {
      // args
      orgId: NexusGenScalars["GID"]; // GID!
      tier: string; // String!
    };
    updateOrganizationUsageDetails: {
      // args
      duration: NexusGenScalars["Duration"]; // Duration!
      limit: number; // Int!
      limitName: NexusGenEnums["OrganizationUsageLimitName"]; // OrganizationUsageLimitName!
      orgId: NexusGenScalars["GID"]; // GID!
      renewalCycles: number; // Int!
      startNewPeriod: boolean; // Boolean!
    };
    updateOrganizationUser: {
      // args
      role: NexusGenEnums["OrganizationRole"]; // OrganizationRole!
      userGroupIds?: NexusGenScalars["GID"][] | null; // [GID!]
      userId: NexusGenScalars["GID"]; // GID!
    };
    updateOrganizationUserLimit: {
      // args
      limit: number; // Int!
      orgId: NexusGenScalars["GID"]; // GID!
    };
    updatePetition: {
      // args
      data: NexusGenInputs["UpdatePetitionInput"]; // UpdatePetitionInput!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    updatePetitionAttachmentType: {
      // args
      attachmentId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
      type: NexusGenEnums["PetitionAttachmentType"]; // PetitionAttachmentType!
    };
    updatePetitionField: {
      // args
      data: NexusGenInputs["UpdatePetitionFieldInput"]; // UpdatePetitionFieldInput!
      fieldId: NexusGenScalars["GID"]; // GID!
      force?: boolean | null; // Boolean
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    updatePetitionFieldComment: {
      // args
      content: NexusGenScalars["JSON"]; // JSON!
      petitionFieldCommentId: NexusGenScalars["GID"]; // GID!
      petitionFieldId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
      sharePetition?: boolean | null; // Boolean
      sharePetitionPermission?: NexusGenEnums["PetitionPermissionTypeRW"] | null; // PetitionPermissionTypeRW
      sharePetitionSubscribed?: boolean | null; // Boolean
      throwOnNoPermission?: boolean | null; // Boolean
    };
    updatePetitionFieldRepliesStatus: {
      // args
      petitionFieldId: NexusGenScalars["GID"]; // GID!
      petitionFieldReplyIds: NexusGenScalars["GID"][]; // [GID!]!
      petitionId: NexusGenScalars["GID"]; // GID!
      status: NexusGenEnums["PetitionFieldReplyStatus"]; // PetitionFieldReplyStatus!
    };
    updatePetitionFieldReply: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
      reply: NexusGenScalars["JSON"]; // JSON!
      replyId: NexusGenScalars["GID"]; // GID!
    };
    updatePetitionFieldReplyMetadata: {
      // args
      metadata: NexusGenScalars["JSONObject"]; // JSONObject!
      petitionId: NexusGenScalars["GID"]; // GID!
      replyId: NexusGenScalars["GID"]; // GID!
    };
    updatePetitionListView: {
      // args
      data?: NexusGenInputs["PetitionListViewDataInput"] | null; // PetitionListViewDataInput
      name?: string | null; // String
      petitionListViewId: NexusGenScalars["GID"]; // GID!
    };
    updatePetitionMetadata: {
      // args
      metadata: NexusGenScalars["JSONObject"]; // JSONObject!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    updatePetitionPermissionSubscription: {
      // args
      isSubscribed: boolean; // Boolean!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    updatePetitionRestriction: {
      // args
      isRestricted: boolean; // Boolean!
      password?: string | null; // String
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    updatePetitionUserNotificationReadStatus: {
      // args
      filter?: NexusGenEnums["PetitionUserNotificationFilter"] | null; // PetitionUserNotificationFilter
      isRead: boolean; // Boolean!
      petitionFieldCommentIds?: NexusGenScalars["GID"][] | null; // [GID!]
      petitionIds?: NexusGenScalars["GID"][] | null; // [GID!]
      petitionUserNotificationIds?: NexusGenScalars["GID"][] | null; // [GID!]
    };
    updateProfileType: {
      // args
      data: NexusGenInputs["UpdateProfileTypeInput"]; // UpdateProfileTypeInput!
      id: NexusGenScalars["GID"]; // GID!
    };
    updateProfileTypeField: {
      // args
      data: NexusGenInputs["UpdateProfileTypeFieldInput"]; // UpdateProfileTypeFieldInput!
      profileTypeFieldId: NexusGenScalars["GID"]; // GID!
      profileTypeId: NexusGenScalars["GID"]; // GID!
    };
    updateProfileTypeFieldPositions: {
      // args
      profileTypeFieldIds: NexusGenScalars["GID"][]; // [GID!]!
      profileTypeId: NexusGenScalars["GID"]; // GID!
    };
    updatePublicPetitionLink: {
      // args
      description?: string | null; // String
      isActive?: boolean | null; // Boolean
      prefillSecret?: string | null; // String
      publicPetitionLinkId: NexusGenScalars["GID"]; // GID!
      slug?: string | null; // String
      title?: string | null; // String
    };
    updatePublicTemplateVisibility: {
      // args
      isPublic: boolean; // Boolean!
      templateId: NexusGenScalars["GID"]; // GID!
    };
    updateSignatureRequestMetadata: {
      // args
      metadata: NexusGenScalars["JSONObject"]; // JSONObject!
      petitionSignatureRequestId: NexusGenScalars["GID"]; // GID!
    };
    updateTag: {
      // args
      data: NexusGenInputs["UpdateTagInput"]; // UpdateTagInput!
      id: NexusGenScalars["GID"]; // GID!
    };
    updateTemplateDefaultPermissions: {
      // args
      permissions: NexusGenInputs["UserOrUserGroupPermissionInput"][]; // [UserOrUserGroupPermissionInput!]!
      templateId: NexusGenScalars["GID"]; // GID!
    };
    updateTemplateDocumentTheme: {
      // args
      orgThemeId: NexusGenScalars["GID"]; // GID!
      templateId: NexusGenScalars["GID"]; // GID!
    };
    updateUser: {
      // args
      firstName?: string | null; // String
      lastName?: string | null; // String
    };
    updateUserGroup: {
      // args
      data: NexusGenInputs["UpdateUserGroupInput"]; // UpdateUserGroupInput!
      id: NexusGenScalars["GID"]; // GID!
    };
    updateUserPreferredLocale: {
      // args
      locale: NexusGenEnums["UserLocale"]; // UserLocale!
    };
    uploadDynamicSelectFieldFile: {
      // args
      fieldId: NexusGenScalars["GID"]; // GID!
      file: NexusGenScalars["Upload"]; // Upload!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    uploadUserAvatar: {
      // args
      image: NexusGenScalars["Upload"]; // Upload!
      userId: NexusGenScalars["GID"]; // GID!
    };
    verifyPublicAccess: {
      // args
      ip?: string | null; // String
      keycode: string; // ID!
      token: string; // ID!
      userAgent?: string | null; // String
    };
  };
  Organization: {
    currentUsagePeriod: {
      // args
      limitName: NexusGenEnums["OrganizationUsageLimitName"]; // OrganizationUsageLimitName!
    };
    hasIntegration: {
      // args
      integration: NexusGenEnums["IntegrationType"]; // IntegrationType!
      provider?: string | null; // String
    };
    iconUrl: {
      // args
      options?: NexusGenInputs["ImageOptions"] | null; // ImageOptions
    };
    integrations: {
      // args
      limit?: number | null; // Int
      offset?: number | null; // Int
      type?: NexusGenEnums["IntegrationType"] | null; // IntegrationType
    };
    isUsageLimitReached: {
      // args
      limitName: NexusGenEnums["OrganizationUsageLimitName"]; // OrganizationUsageLimitName!
    };
    logoUrl: {
      // args
      options?: NexusGenInputs["ImageOptions"] | null; // ImageOptions
    };
    subscriptionEndDate: {
      // args
      limitName: NexusGenEnums["OrganizationUsageLimitName"]; // OrganizationUsageLimitName!
    };
    usagePeriods: {
      // args
      limit?: number | null; // Int
      limitName: NexusGenEnums["OrganizationUsageLimitName"]; // OrganizationUsageLimitName!
      offset?: number | null; // Int
    };
    users: {
      // args
      exclude?: NexusGenScalars["GID"][] | null; // [GID!]
      includeInactive?: boolean | null; // Boolean
      limit?: number | null; // Int
      offset?: number | null; // Int
      search?: string | null; // String
      sortBy?: NexusGenEnums["OrganizationUsers_OrderBy"][] | null; // [OrganizationUsers_OrderBy!]
    };
  };
  Petition: {
    events: {
      // args
      limit?: number | null; // Int
      offset?: number | null; // Int
    };
  };
  PetitionTemplate: {
    imageUrl: {
      // args
      options?: NexusGenInputs["ImageOptions"] | null; // ImageOptions
    };
  };
  PublicOrganization: {
    logoUrl: {
      // args
      options?: NexusGenInputs["ImageOptions"] | null; // ImageOptions
    };
  };
  Query: {
    access: {
      // args
      keycode: string; // ID!
    };
    accesses: {
      // args
      keycode: string; // ID!
      limit?: number | null; // Int
      offset?: number | null; // Int
      search?: string | null; // String
      status?: NexusGenEnums["PetitionStatus"][] | null; // [PetitionStatus!]
    };
    contact: {
      // args
      id: NexusGenScalars["GID"]; // GID!
    };
    contacts: {
      // args
      exclude?: NexusGenScalars["GID"][] | null; // [GID!]
      limit?: number | null; // Int
      offset?: number | null; // Int
      search?: string | null; // String
      sortBy?: NexusGenEnums["QueryContacts_OrderBy"][] | null; // [QueryContacts_OrderBy!]
    };
    contactsByEmail: {
      // args
      emails: string[]; // [String!]!
    };
    dowJonesKycEntityProfile: {
      // args
      profileId: string; // ID!
    };
    dowJonesKycEntitySearch: {
      // args
      dateOfBirth?: NexusGenScalars["DateTime"] | null; // DateTime
      limit?: number | null; // Int
      name: string; // String!
      offset?: number | null; // Int
    };
    emailIsAvailable: {
      // args
      email: string; // String!
    };
    exportPetitionToJson: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    getApiTokenOwner: {
      // args
      token: string; // String!
    };
    getSlugForPublicPetitionLink: {
      // args
      petitionName?: string | null; // String
    };
    getUsersOrGroups: {
      // args
      ids: string[]; // [ID!]!
    };
    globalIdDecode: {
      // args
      id: string; // ID!
    };
    globalIdEncode: {
      // args
      id: string; // String!
      type: string; // String!
    };
    isValidPublicPetitionLinkSlug: {
      // args
      slug: string; // String!
    };
    landingTemplateBySlug: {
      // args
      slug: string; // String!
    };
    landingTemplates: {
      // args
      categories?: string[] | null; // [String!]
      limit?: number | null; // Int
      locale: NexusGenEnums["PetitionLocale"]; // PetitionLocale!
      offset?: number | null; // Int
    };
    metadata: {
      // args
      keycode?: string | null; // ID
    };
    organization: {
      // args
      id: NexusGenScalars["GID"]; // GID!
    };
    organizations: {
      // args
      limit?: number | null; // Int
      offset?: number | null; // Int
      search?: string | null; // String
      sortBy?: NexusGenEnums["QueryOrganizations_OrderBy"][] | null; // [QueryOrganizations_OrderBy!]
      status?: NexusGenEnums["OrganizationStatus"] | null; // OrganizationStatus
    };
    petition: {
      // args
      id: NexusGenScalars["GID"]; // GID!
    };
    petitionEvents: {
      // args
      before?: NexusGenScalars["GID"] | null; // GID
      eventTypes?: NexusGenEnums["PetitionEventType"][] | null; // [PetitionEventType!]
    };
    petitionField: {
      // args
      petitionFieldId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    petitionFolders: {
      // args
      currentPath?: string | null; // String
      type: NexusGenEnums["PetitionBaseType"]; // PetitionBaseType!
    };
    petitions: {
      // args
      filters?: NexusGenInputs["PetitionFilter"] | null; // PetitionFilter
      limit?: number | null; // Int
      offset?: number | null; // Int
      search?: string | null; // String
      sortBy?: NexusGenEnums["QueryPetitions_OrderBy"][] | null; // [QueryPetitions_OrderBy!]
    };
    petitionsById: {
      // args
      folders?: NexusGenInputs["FoldersInput"] | null; // FoldersInput
      ids?: NexusGenScalars["GID"][] | null; // [GID!]
    };
    profileType: {
      // args
      profileTypeId: NexusGenScalars["GID"]; // GID!
    };
    profileTypes: {
      // args
      limit?: number | null; // Int
      locale?: NexusGenEnums["UserLocale"] | null; // UserLocale
      offset?: number | null; // Int
      search?: string | null; // String
      sortBy?: NexusGenEnums["QueryProfileTypes_OrderBy"][] | null; // [QueryProfileTypes_OrderBy!]
    };
    publicLicenseCode: {
      // args
      code: string; // String!
      token: string; // ID!
    };
    publicOrg: {
      // args
      id: NexusGenScalars["GID"]; // GID!
    };
    publicPetitionField: {
      // args
      keycode: string; // ID!
      petitionFieldId: NexusGenScalars["GID"]; // GID!
    };
    publicPetitionLinkBySlug: {
      // args
      prefill?: string | null; // String
      slug: string; // ID!
    };
    publicTask: {
      // args
      keycode: string; // ID!
      taskId: NexusGenScalars["GID"]; // GID!
    };
    remindersOptOut: {
      // args
      keycode: string; // ID!
    };
    searchUserGroups: {
      // args
      excludeUserGroups?: NexusGenScalars["GID"][] | null; // [GID!]
      search: string; // String!
    };
    searchUsers: {
      // args
      excludeUserGroups?: NexusGenScalars["GID"][] | null; // [GID!]
      excludeUsers?: NexusGenScalars["GID"][] | null; // [GID!]
      includeGroups?: boolean | null; // Boolean
      includeInactive?: boolean | null; // Boolean
      search: string; // String!
    };
    tags: {
      // args
      limit?: number | null; // Int
      offset?: number | null; // Int
      search?: string | null; // String
      tagIds?: NexusGenScalars["GID"][] | null; // [GID!]
    };
    task: {
      // args
      id: NexusGenScalars["GID"]; // GID!
    };
    templates: {
      // args
      category?: string | null; // String
      isOwner?: boolean | null; // Boolean
      isPublic: boolean; // Boolean!
      limit?: number | null; // Int
      locale?: NexusGenEnums["PetitionLocale"] | null; // PetitionLocale
      offset?: number | null; // Int
      path?: string | null; // String
      search?: string | null; // String
    };
    userGroup: {
      // args
      id: NexusGenScalars["GID"]; // GID!
    };
    userGroups: {
      // args
      limit?: number | null; // Int
      offset?: number | null; // Int
      search?: string | null; // String
      sortBy?: NexusGenEnums["QueryUserGroups_OrderBy"][] | null; // [QueryUserGroups_OrderBy!]
    };
  };
  User: {
    avatarUrl: {
      // args
      options?: NexusGenInputs["ImageOptions"] | null; // ImageOptions
    };
    hasFeatureFlag: {
      // args
      featureFlag: NexusGenEnums["FeatureFlag"]; // FeatureFlag!
    };
    notifications: {
      // args
      before?: NexusGenScalars["DateTime"] | null; // DateTime
      filter?: NexusGenEnums["PetitionUserNotificationFilter"] | null; // PetitionUserNotificationFilter
      limit?: number | null; // Int
    };
  };
}

export interface NexusGenAbstractTypeMembers {
  PetitionBaseOrFolder: "Petition" | "PetitionFolder" | "PetitionTemplate";
  PetitionFieldCommentMention:
    | "PetitionFieldCommentUserGroupMention"
    | "PetitionFieldCommentUserMention";
  PublicUserOrContact: "PublicContact" | "PublicUser";
  UserOrPetitionAccess: "PetitionAccess" | "User";
  UserOrUserGroup: "User" | "UserGroup";
  CreatedAt:
    | "PetitionFieldAttachment"
    | "PetitionMessage"
    | "PetitionReminder"
    | "ProfileFieldValue"
    | "UserAuthenticationToken";
  DowJonesKycEntityProfileResult:
    | "DowJonesKycEntityProfileResultEntity"
    | "DowJonesKycEntityProfileResultPerson";
  DowJonesKycEntitySearchResult:
    | "DowJonesKycEntitySearchResultEntity"
    | "DowJonesKycEntitySearchResultPerson";
  IOrgIntegration: "OrgIntegration" | "SignatureOrgIntegration";
  PetitionBase: "Petition" | "PetitionTemplate";
  PetitionEvent:
    | "AccessActivatedEvent"
    | "AccessActivatedFromPublicPetitionLinkEvent"
    | "AccessDeactivatedEvent"
    | "AccessDelegatedEvent"
    | "AccessOpenedEvent"
    | "CommentDeletedEvent"
    | "CommentPublishedEvent"
    | "GroupPermissionAddedEvent"
    | "GroupPermissionEditedEvent"
    | "GroupPermissionRemovedEvent"
    | "MessageCancelledEvent"
    | "MessageScheduledEvent"
    | "MessageSentEvent"
    | "OwnershipTransferredEvent"
    | "PetitionAnonymizedEvent"
    | "PetitionClonedEvent"
    | "PetitionClosedEvent"
    | "PetitionClosedNotifiedEvent"
    | "PetitionCompletedEvent"
    | "PetitionCreatedEvent"
    | "PetitionDeletedEvent"
    | "PetitionMessageBouncedEvent"
    | "PetitionReminderBouncedEvent"
    | "PetitionReopenedEvent"
    | "RecipientSignedEvent"
    | "ReminderSentEvent"
    | "RemindersOptOutEvent"
    | "ReplyCreatedEvent"
    | "ReplyDeletedEvent"
    | "ReplyStatusChangedEvent"
    | "ReplyUpdatedEvent"
    | "SignatureCancelledEvent"
    | "SignatureCompletedEvent"
    | "SignatureOpenedEvent"
    | "SignatureReminderEvent"
    | "SignatureStartedEvent"
    | "TemplateUsedEvent"
    | "UserPermissionAddedEvent"
    | "UserPermissionEditedEvent"
    | "UserPermissionRemovedEvent";
  PetitionPermission: "PetitionUserGroupPermission" | "PetitionUserPermission";
  PetitionUserNotification:
    | "AccessActivatedFromPublicPetitionLinkUserNotification"
    | "CommentCreatedUserNotification"
    | "MessageEmailBouncedUserNotification"
    | "PetitionCompletedUserNotification"
    | "PetitionSharedUserNotification"
    | "ReminderEmailBouncedUserNotification"
    | "RemindersOptOutNotification"
    | "SignatureCancelledUserNotification"
    | "SignatureCompletedUserNotification";
  TemplateDefaultPermission: "TemplateDefaultUserGroupPermission" | "TemplateDefaultUserPermission";
  Timestamps:
    | "Contact"
    | "Organization"
    | "PetitionAccess"
    | "PetitionFieldReply"
    | "PetitionSignatureRequest"
    | "PetitionUserGroupPermission"
    | "PetitionUserPermission"
    | "Profile"
    | "ProfileType"
    | "PublicPetition"
    | "PublicPetitionFieldReply"
    | "TemplateDefaultUserGroupPermission"
    | "TemplateDefaultUserPermission"
    | "User"
    | "UserGroup";
}

export interface NexusGenTypeInterfaces {
  AccessActivatedEvent: "PetitionEvent";
  AccessActivatedFromPublicPetitionLinkEvent: "PetitionEvent";
  AccessActivatedFromPublicPetitionLinkUserNotification: "PetitionUserNotification";
  AccessDeactivatedEvent: "PetitionEvent";
  AccessDelegatedEvent: "PetitionEvent";
  AccessOpenedEvent: "PetitionEvent";
  CommentCreatedUserNotification: "PetitionUserNotification";
  CommentDeletedEvent: "PetitionEvent";
  CommentPublishedEvent: "PetitionEvent";
  Contact: "Timestamps";
  DowJonesKycEntityProfileResultEntity: "DowJonesKycEntityProfileResult";
  DowJonesKycEntityProfileResultPerson: "DowJonesKycEntityProfileResult";
  DowJonesKycEntitySearchResultEntity: "DowJonesKycEntitySearchResult";
  DowJonesKycEntitySearchResultPerson: "DowJonesKycEntitySearchResult";
  GroupPermissionAddedEvent: "PetitionEvent";
  GroupPermissionEditedEvent: "PetitionEvent";
  GroupPermissionRemovedEvent: "PetitionEvent";
  MessageCancelledEvent: "PetitionEvent";
  MessageEmailBouncedUserNotification: "PetitionUserNotification";
  MessageScheduledEvent: "PetitionEvent";
  MessageSentEvent: "PetitionEvent";
  OrgIntegration: "IOrgIntegration";
  Organization: "Timestamps";
  OwnershipTransferredEvent: "PetitionEvent";
  Petition: "PetitionBase";
  PetitionAccess: "Timestamps";
  PetitionAnonymizedEvent: "PetitionEvent";
  PetitionClonedEvent: "PetitionEvent";
  PetitionClosedEvent: "PetitionEvent";
  PetitionClosedNotifiedEvent: "PetitionEvent";
  PetitionCompletedEvent: "PetitionEvent";
  PetitionCompletedUserNotification: "PetitionUserNotification";
  PetitionCreatedEvent: "PetitionEvent";
  PetitionDeletedEvent: "PetitionEvent";
  PetitionFieldAttachment: "CreatedAt";
  PetitionFieldReply: "Timestamps";
  PetitionMessage: "CreatedAt";
  PetitionMessageBouncedEvent: "PetitionEvent";
  PetitionReminder: "CreatedAt";
  PetitionReminderBouncedEvent: "PetitionEvent";
  PetitionReopenedEvent: "PetitionEvent";
  PetitionSharedUserNotification: "PetitionUserNotification";
  PetitionSignatureRequest: "Timestamps";
  PetitionTemplate: "PetitionBase";
  PetitionUserGroupPermission: "PetitionPermission" | "Timestamps";
  PetitionUserPermission: "PetitionPermission" | "Timestamps";
  Profile: "Timestamps";
  ProfileFieldValue: "CreatedAt";
  ProfileType: "Timestamps";
  PublicPetition: "Timestamps";
  PublicPetitionFieldReply: "Timestamps";
  RecipientSignedEvent: "PetitionEvent";
  ReminderEmailBouncedUserNotification: "PetitionUserNotification";
  ReminderSentEvent: "PetitionEvent";
  RemindersOptOutEvent: "PetitionEvent";
  RemindersOptOutNotification: "PetitionUserNotification";
  ReplyCreatedEvent: "PetitionEvent";
  ReplyDeletedEvent: "PetitionEvent";
  ReplyStatusChangedEvent: "PetitionEvent";
  ReplyUpdatedEvent: "PetitionEvent";
  SignatureCancelledEvent: "PetitionEvent";
  SignatureCancelledUserNotification: "PetitionUserNotification";
  SignatureCompletedEvent: "PetitionEvent";
  SignatureCompletedUserNotification: "PetitionUserNotification";
  SignatureOpenedEvent: "PetitionEvent";
  SignatureOrgIntegration: "IOrgIntegration";
  SignatureReminderEvent: "PetitionEvent";
  SignatureStartedEvent: "PetitionEvent";
  TemplateDefaultUserGroupPermission: "TemplateDefaultPermission" | "Timestamps";
  TemplateDefaultUserPermission: "TemplateDefaultPermission" | "Timestamps";
  TemplateUsedEvent: "PetitionEvent";
  User: "Timestamps";
  UserAuthenticationToken: "CreatedAt";
  UserGroup: "Timestamps";
  UserPermissionAddedEvent: "PetitionEvent";
  UserPermissionEditedEvent: "PetitionEvent";
  UserPermissionRemovedEvent: "PetitionEvent";
  PetitionPermission: "Timestamps";
  TemplateDefaultPermission: "Timestamps";
}

export type NexusGenObjectNames = keyof NexusGenObjects;

export type NexusGenInputNames = keyof NexusGenInputs;

export type NexusGenEnumNames = keyof NexusGenEnums;

export type NexusGenInterfaceNames = keyof NexusGenInterfaces;

export type NexusGenScalarNames = keyof NexusGenScalars;

export type NexusGenUnionNames = keyof NexusGenUnions;

export type NexusGenObjectsUsingAbstractStrategyIsTypeOf = never;

export type NexusGenAbstractsUsingStrategyResolveType =
  | "CreatedAt"
  | "DowJonesKycEntityProfileResult"
  | "DowJonesKycEntitySearchResult"
  | "IOrgIntegration"
  | "PetitionBase"
  | "PetitionBaseOrFolder"
  | "PetitionEvent"
  | "PetitionFieldCommentMention"
  | "PetitionPermission"
  | "PetitionUserNotification"
  | "PublicUserOrContact"
  | "TemplateDefaultPermission"
  | "Timestamps"
  | "UserOrPetitionAccess"
  | "UserOrUserGroup";

export type NexusGenFeaturesConfig = {
  abstractTypeStrategies: {
    isTypeOf: false;
    resolveType: true;
    __typename: false;
  };
};

export interface NexusGenTypes {
  context: ApiContext;
  inputTypes: NexusGenInputs;
  rootTypes: NexusGenRootTypes;
  inputTypeShapes: NexusGenInputs & NexusGenEnums & NexusGenScalars;
  argTypes: NexusGenArgTypes;
  fieldTypes: NexusGenFieldTypes;
  fieldTypeNames: NexusGenFieldTypeNames;
  allTypes: NexusGenAllTypes;
  typeInterfaces: NexusGenTypeInterfaces;
  objectNames: NexusGenObjectNames;
  inputNames: NexusGenInputNames;
  enumNames: NexusGenEnumNames;
  interfaceNames: NexusGenInterfaceNames;
  scalarNames: NexusGenScalarNames;
  unionNames: NexusGenUnionNames;
  allInputTypes:
    | NexusGenTypes["inputNames"]
    | NexusGenTypes["enumNames"]
    | NexusGenTypes["scalarNames"];
  allOutputTypes:
    | NexusGenTypes["objectNames"]
    | NexusGenTypes["enumNames"]
    | NexusGenTypes["unionNames"]
    | NexusGenTypes["interfaceNames"]
    | NexusGenTypes["scalarNames"];
  allNamedTypes: NexusGenTypes["allInputTypes"] | NexusGenTypes["allOutputTypes"];
  abstractTypes: NexusGenTypes["interfaceNames"] | NexusGenTypes["unionNames"];
  abstractTypeMembers: NexusGenAbstractTypeMembers;
  objectsUsingAbstractStrategyIsTypeOf: NexusGenObjectsUsingAbstractStrategyIsTypeOf;
  abstractsUsingStrategyResolveType: NexusGenAbstractsUsingStrategyResolveType;
  features: NexusGenFeaturesConfig;
}

declare global {
  interface NexusGenPluginTypeConfig<TypeName extends string> {}
  interface NexusGenPluginInputTypeConfig<TypeName extends string> {}
  interface NexusGenPluginFieldConfig<TypeName extends string, FieldName extends string> {
    /**
     * Authorization for an individual field. Returning "true"
     * or "Promise<true>" means the field can be accessed.
     * Returning "false" or "Promise<false>" will respond
     * with a "Not Authorized" error for the field.
     * Returning or throwing an error will also prevent the
     * resolver from executing.
     */
    authorize?: FieldAuthorizeResolver<TypeName, FieldName>;
    /**
     * Run validation for the args of this type. Any errors thrown here will
     * prevent the resolve method from executing.
     */
    validateArgs?: FieldValidateArgsResolver<TypeName, FieldName>;
  }
  interface NexusGenPluginInputFieldConfig<TypeName extends string, FieldName extends string> {}
  interface NexusGenPluginSchemaConfig {}
  interface NexusGenPluginArgConfig {}
}
