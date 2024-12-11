import type { FileUpload } from "graphql-upload/Upload.js";
import type { Duration } from "date-fns";
import type { LocalizableUserText } from "./helpers/scalars/LocalizableUserText";
import type { Replace } from "../util/types";
import type * as db from "./../db/__types";
import type * as notifications from "./../db/notifications";
import type * as petitionEvents from "./../db/events/PetitionEvent";
import type * as profileEvents from "./../db/events/ProfileEvent";
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
      opts?: core.CommonInputFieldConfig<TypeName, FieldName>,
    ): void; // "DateTime";
    /**
     * A date string, such as 2007-12-03, compliant with the `full-date` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.
     */
    date<FieldName extends string>(
      fieldName: FieldName,
      opts?: core.CommonInputFieldConfig<TypeName, FieldName>,
    ): void; // "Date";
    duration<FieldName extends string>(
      fieldName: FieldName,
      opts?: core.CommonInputFieldConfig<TypeName, FieldName>,
    ): void; // "Duration";
    /**
     * The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).
     */
    jsonObject<FieldName extends string>(
      fieldName: FieldName,
      opts?: core.CommonInputFieldConfig<TypeName, FieldName>,
    ): void; // "JSONObject";
    /**
     * The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).
     */
    json<FieldName extends string>(
      fieldName: FieldName,
      opts?: core.CommonInputFieldConfig<TypeName, FieldName>,
    ): void; // "JSON";
    localizableUserText<FieldName extends string>(
      fieldName: FieldName,
      opts?: core.CommonInputFieldConfig<TypeName, FieldName>,
    ): void; // "LocalizableUserText";
    globalId<FieldName extends string>(
      fieldName: FieldName,
      opts: GlobalIdInputFieldConfig<TypeName, FieldName>,
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
    /**
     * A date string, such as 2007-12-03, compliant with the `full-date` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.
     */
    date<FieldName extends string>(
      fieldName: FieldName,
      ...opts: core.ScalarOutSpread<TypeName, FieldName>
    ): void; // "Date";
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
      PaginationType extends core.GetGen<"allOutputTypes", string> | core.AllNexusOutputTypeDefs,
    >(
      fieldName: FieldName,
      config: PaginationFieldConfig<TypeName, FieldName, PaginationType>,
    ): void;
  }
}

declare global {
  interface NexusGen extends NexusGenTypes {}
}

export interface NexusGenInputs {
  ArchiveFieldGroupReplyIntoProfileConflictResolutionInput: {
    // input type
    action: NexusGenEnums["ArchiveFieldGroupReplyIntoProfileConflictResolutionAction"]; // ArchiveFieldGroupReplyIntoProfileConflictResolutionAction!
    profileTypeFieldId: NexusGenScalars["GID"]; // GID!
  };
  ArchiveFieldGroupReplyIntoProfileExpirationInput: {
    // input type
    expiryDate?: NexusGenScalars["Date"] | null; // Date
    profileTypeFieldId: NexusGenScalars["GID"]; // GID!
  };
  AutomaticNumberingConfigInput: {
    // input type
    numberingType: NexusGenEnums["AutomaticNumberingType"]; // AutomaticNumberingType!
  };
  CreateContactInput: {
    // input type
    email: string; // String!
    firstName: string; // String!
    lastName?: string | null; // String
  };
  CreatePetitionFieldInput: {
    // input type
    isInternal?: boolean | null; // Boolean
    multiple?: boolean | null; // Boolean
    options?: NexusGenScalars["JSONObject"] | null; // JSONObject
  };
  CreatePetitionFieldReplyInput: {
    // input type
    content?: NexusGenScalars["JSON"] | null; // JSON
    id: NexusGenScalars["GID"]; // GID!
    parentReplyId?: NexusGenScalars["GID"] | null; // GID
  };
  CreatePetitionFromProfilePrefillInput: {
    // input type
    petitionFieldId: NexusGenScalars["GID"]; // GID!
    profileIds: NexusGenScalars["GID"][]; // [GID!]!
  };
  CreatePetitionVariableInput: {
    // input type
    defaultValue: number; // Float!
    name: string; // String!
  };
  CreateProfileRelationshipInput: {
    // input type
    direction: NexusGenEnums["ProfileRelationshipDirection"]; // ProfileRelationshipDirection!
    profileId: NexusGenScalars["GID"]; // GID!
    profileRelationshipTypeId: NexusGenScalars["GID"]; // GID!
  };
  CreateProfileTypeFieldInput: {
    // input type
    alias?: string | null; // String
    expiryAlertAheadTime?: NexusGenScalars["Duration"] | null; // Duration
    isExpirable?: boolean | null; // Boolean
    name: NexusGenScalars["LocalizableUserText"]; // LocalizableUserText!
    options?: NexusGenScalars["JSONObject"] | null; // JSONObject
    type: NexusGenEnums["ProfileTypeFieldType"]; // ProfileTypeFieldType!
  };
  EditProfileTypeProcessInput: {
    // input type
    processName?: NexusGenScalars["LocalizableUserText"] | null; // LocalizableUserText
    templateIds?: NexusGenScalars["GID"][] | null; // [GID!]
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
  OrganizationUpdateInput: {
    // input type
    name?: string | null; // String
    status?: NexusGenEnums["OrganizationStatus"] | null; // OrganizationStatus
  };
  PetitionFilter: {
    // input type
    fromTemplateId?: NexusGenScalars["GID"][] | null; // [GID!]
    locale?: NexusGenEnums["PetitionLocale"] | null; // PetitionLocale
    path?: string | null; // String
    permissionTypes?: NexusGenEnums["PetitionPermissionType"][] | null; // [PetitionPermissionType!]
    sharedWith?: NexusGenInputs["PetitionSharedWithFilter"] | null; // PetitionSharedWithFilter
    signature?: NexusGenEnums["PetitionSignatureStatusFilter"][] | null; // [PetitionSignatureStatusFilter!]
    status?: NexusGenEnums["PetitionStatus"][] | null; // [PetitionStatus!]
    tags?: NexusGenInputs["PetitionTagFilter"] | null; // PetitionTagFilter
    type?: NexusGenEnums["PetitionBaseType"] | null; // PetitionBaseType
  };
  PetitionListViewDataInput: {
    // input type
    columns?: NexusGenEnums["PetitionListViewColumn"][] | null; // [PetitionListViewColumn!]
    fromTemplateId?: NexusGenScalars["GID"][] | null; // [GID!]
    path?: string | null; // String
    search?: string | null; // String
    searchIn?: NexusGenEnums["PetitionListViewSearchIn"] | null; // PetitionListViewSearchIn
    sharedWith?: NexusGenInputs["PetitionSharedWithFilter"] | null; // PetitionSharedWithFilter
    signature?: NexusGenEnums["PetitionSignatureStatusFilter"][] | null; // [PetitionSignatureStatusFilter!]
    sort?: NexusGenInputs["PetitionListViewSortInput"] | null; // PetitionListViewSortInput
    status?: NexusGenEnums["PetitionStatus"][] | null; // [PetitionStatus!]
    tagsFilters?: NexusGenInputs["PetitionTagFilter"] | null; // PetitionTagFilter
  };
  PetitionListViewSortInput: {
    // input type
    direction: NexusGenEnums["ListViewSortDirection"]; // ListViewSortDirection!
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
  ProfileAssociatedPetitionFilter: {
    // input type
    fromTemplateId?: NexusGenScalars["GID"][] | null; // [GID!]
  };
  ProfileExternalSourceConflictResolution: {
    // input type
    action: NexusGenEnums["ProfileExternalSourceConflictResolutionAction"]; // ProfileExternalSourceConflictResolutionAction!
    profileTypeFieldId: NexusGenScalars["GID"]; // GID!
  };
  ProfileFieldPropertyFilter: {
    // input type
    alias?: string | null; // String
    profileTypeFieldId?: NexusGenScalars["GID"] | null; // GID
  };
  ProfileFieldValuesFilter: {
    // input type
    conditions?: NexusGenInputs["ProfileFieldValuesFilter"][] | null; // [ProfileFieldValuesFilter!]
    logicalOperator?: NexusGenEnums["ProfileFieldValuesFilterGroupLogicalOperator"] | null; // ProfileFieldValuesFilterGroupLogicalOperator
    operator?: NexusGenEnums["ProfileFieldValuesFilterOperator"] | null; // ProfileFieldValuesFilterOperator
    profileTypeFieldId?: NexusGenScalars["GID"] | null; // GID
    value?: NexusGenScalars["JSON"] | null; // JSON
  };
  ProfileFilter: {
    // input type
    profileId?: NexusGenScalars["GID"][] | null; // [GID!]
    profileTypeId?: NexusGenScalars["GID"][] | null; // [GID!]
    status?: NexusGenEnums["ProfileStatus"][] | null; // [ProfileStatus!]
    values?: NexusGenInputs["ProfileFieldValuesFilter"] | null; // ProfileFieldValuesFilter
  };
  ProfileListViewDataInput: {
    // input type
    columns?: string[] | null; // [String!]
    search?: string | null; // String
    sort?: NexusGenInputs["ProfileListViewSortInput"] | null; // ProfileListViewSortInput
    status?: NexusGenEnums["ProfileStatus"] | null; // ProfileStatus
    values?: NexusGenInputs["ProfileFieldValuesFilter"] | null; // ProfileFieldValuesFilter
  };
  ProfileListViewSortInput: {
    // input type
    direction: NexusGenEnums["ListViewSortDirection"]; // ListViewSortDirection!
    field: NexusGenEnums["ProfileListViewSortField"]; // ProfileListViewSortField!
  };
  ProfilePropertyFilter: {
    // input type
    profileTypeFieldId?: NexusGenScalars["GID"][] | null; // [GID!]
    profileTypeId?: NexusGenScalars["GID"][] | null; // [GID!]
  };
  ProfileRelationshipFilter: {
    // input type
    fromSide?: NexusGenEnums["ProfileRelationshipSide"] | null; // ProfileRelationshipSide
    relationshipTypeId: NexusGenScalars["GID"]; // GID!
  };
  ProfileTypeFilter: {
    // input type
    includeArchived?: boolean | null; // Boolean
    onlyArchived?: boolean | null; // Boolean
    profileTypeId?: NexusGenScalars["GID"][] | null; // [GID!]
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
    instructions?: string | null; // String
    minSigners: number; // Int!
    orgIntegrationId: NexusGenScalars["GID"]; // GID!
    review: boolean; // Boolean!
    signersInfo: NexusGenInputs["SignatureConfigInputSigner"][]; // [SignatureConfigInputSigner!]!
    signingMode: NexusGenEnums["SignatureConfigSigningMode"]; // SignatureConfigSigningMode!
    timezone: string; // String!
    title?: string | null; // String
    useCustomDocument?: boolean | null; // Boolean
  };
  SignatureConfigInputSigner: {
    // input type
    contactId?: NexusGenScalars["GID"] | null; // GID
    email: string; // String!
    firstName: string; // String!
    isPreset?: boolean | null; // Boolean
    lastName?: string | null; // String
  };
  UpdateContactInput: {
    // input type
    firstName?: string | null; // String
    lastName?: string | null; // String
  };
  UpdatePetitionFieldAutoSearchConfigInput: {
    // input type
    date?: NexusGenScalars["GID"] | null; // GID
    name: NexusGenScalars["GID"][]; // [GID!]!
    type?: NexusGenEnums["BackgroundCheckEntitySearchType"] | null; // BackgroundCheckEntitySearchType
  };
  UpdatePetitionFieldGroupRelationshipInput: {
    // input type
    direction: NexusGenEnums["ProfileRelationshipDirection"]; // ProfileRelationshipDirection!
    id?: NexusGenScalars["GID"] | null; // GID
    leftSidePetitionFieldId: NexusGenScalars["GID"]; // GID!
    profileRelationshipTypeId: NexusGenScalars["GID"]; // GID!
    rightSidePetitionFieldId: NexusGenScalars["GID"]; // GID!
  };
  UpdatePetitionFieldInput: {
    // input type
    alias?: string | null; // String
    description?: string | null; // String
    hasCommentsEnabled?: boolean | null; // Boolean
    isInternal?: boolean | null; // Boolean
    math?: NexusGenScalars["JSONObject"][] | null; // [JSONObject!]
    multiple?: boolean | null; // Boolean
    optional?: boolean | null; // Boolean
    options?: NexusGenScalars["JSONObject"] | null; // JSONObject
    requireApproval?: boolean | null; // Boolean
    showActivityInPdf?: boolean | null; // Boolean
    showInPdf?: boolean | null; // Boolean
    title?: string | null; // String
    visibility?: NexusGenScalars["JSONObject"] | null; // JSONObject
  };
  UpdatePetitionFieldReplyInput: {
    // input type
    content?: NexusGenScalars["JSON"] | null; // JSON
    id: NexusGenScalars["GID"]; // GID!
  };
  UpdatePetitionInput: {
    // input type
    anonymizeAfterMonths?: number | null; // Int
    anonymizePurpose?: string | null; // String
    automaticNumberingConfig?: NexusGenInputs["AutomaticNumberingConfigInput"] | null; // AutomaticNumberingConfigInput
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
    isDelegateAccessEnabled?: boolean | null; // Boolean
    isDocumentGenerationEnabled?: boolean | null; // Boolean
    isInteractionWithRecipientsEnabled?: boolean | null; // Boolean
    isRecipientViewContentsHidden?: boolean | null; // Boolean
    isReviewFlowEnabled?: boolean | null; // Boolean
    locale?: NexusGenEnums["PetitionLocale"] | null; // PetitionLocale
    name?: string | null; // String
    remindersConfig?: NexusGenInputs["RemindersConfigInput"] | null; // RemindersConfigInput
    signatureConfig?: NexusGenInputs["SignatureConfigInput"] | null; // SignatureConfigInput
    skipForwardSecurity?: boolean | null; // Boolean
  };
  UpdatePetitionVariableInput: {
    // input type
    defaultValue: number; // Float!
  };
  UpdateProfileFieldValueInput: {
    // input type
    content?: NexusGenScalars["JSONObject"] | null; // JSONObject
    expiryDate?: NexusGenScalars["Date"] | null; // Date
    profileTypeFieldId: NexusGenScalars["GID"]; // GID!
  };
  UpdateProfileTypeFieldInput: {
    // input type
    alias?: string | null; // String
    expiryAlertAheadTime?: NexusGenScalars["Duration"] | null; // Duration
    isExpirable?: boolean | null; // Boolean
    name?: NexusGenScalars["LocalizableUserText"] | null; // LocalizableUserText
    options?: NexusGenScalars["JSONObject"] | null; // JSONObject
    substitutions?: NexusGenInputs["UpdateProfileTypeFieldSelectOptionsSubstitution"][] | null; // [UpdateProfileTypeFieldSelectOptionsSubstitution!]
  };
  UpdateProfileTypeFieldPermissionsInput: {
    // input type
    permission: NexusGenEnums["ProfileTypeFieldPermissionType"]; // ProfileTypeFieldPermissionType!
    userGroupId?: NexusGenScalars["GID"] | null; // GID
    userId?: NexusGenScalars["GID"] | null; // GID
  };
  UpdateProfileTypeFieldSelectOptionsSubstitution: {
    // input type
    new?: string | null; // String
    old: string; // String!
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
  UpdateUserGroupPermissionsInput: {
    // input type
    effect: NexusGenEnums["UpdateUserGroupPermissionsInputEffect"]; // UpdateUserGroupPermissionsInputEffect!
    name: string; // String!
  };
  UserFilter: {
    // input type
    status?: NexusGenEnums["UserStatus"][] | null; // [UserStatus!]
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
  AiCompletionLogStatus: db.AiCompletionLogStatus;
  ArchiveFieldGroupReplyIntoProfileConflictResolutionAction: "APPEND" | "IGNORE" | "OVERWRITE";
  AutomaticNumberingType: "LETTERS" | "NUMBERS" | "ROMAN_NUMERALS";
  BackgroundCheckEntitySearchType: "COMPANY" | "PERSON";
  BulkSendSigningMode: "COPY_SIGNATURE_SETTINGS" | "DISABLE_SIGNATURE" | "LET_RECIPIENT_CHOOSE";
  ChangePasswordResult:
    | "INCORRECT_PASSWORD"
    | "INVALID_NEW_PASSWORD"
    | "LIMIT_EXCEEDED"
    | "SUCCESS";
  DashboardModuleSize: db.DashboardModuleSize;
  DashboardPieChartModuleSettingsType: "DOUGHNUT" | "PIE";
  DashboardRatioModuleSettingsType: "PERCENTAGE" | "RATIO";
  DocumentProcessingType: db.DocumentProcessingType;
  DowJonesKycEntityType: "Entity" | "Person";
  FeatureFlag: db.FeatureFlagName;
  FilterSharedWithLogicalOperator: "AND" | "OR";
  FilterSharedWithOperator: "IS_OWNER" | "NOT_IS_OWNER" | "NOT_SHARED_WITH" | "SHARED_WITH";
  ImageOptionsResizeFit: "contain" | "cover" | "fill" | "inside" | "outside";
  IntegrationType: db.IntegrationType;
  ListViewSortDirection: "ASC" | "DESC";
  ListViewType: db.ListViewType;
  MaybeTaskStatus: "COMPLETED" | "PROCESSING";
  OrgLicenseSource: "APPSUMO";
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
  PetitionListViewColumn:
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
  PetitionListViewSearchIn: "CURRENT_FOLDER" | "EVERYWHERE";
  PetitionListViewSortField:
    | "createdAt"
    | "lastActivityAt"
    | "lastRecipientActivityAt"
    | "name"
    | "sentAt";
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
  ProfileEventType: db.ProfileEventType;
  ProfileExternalSourceConflictResolutionAction: "IGNORE" | "OVERWRITE";
  ProfileExternalSourceSearchParamType: "SELECT" | "TEXT";
  ProfileFieldValuesFilterGroupLogicalOperator: "AND" | "OR";
  ProfileFieldValuesFilterOperator:
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
  ProfileListViewSortField: "createdAt" | "name";
  ProfileRelationshipDirection: "LEFT_RIGHT" | "RIGHT_LEFT";
  ProfileRelationshipSide: "LEFT" | "RIGHT";
  ProfileStatus: db.ProfileStatus;
  ProfileTypeFieldPermissionType: db.ProfileTypeFieldPermissionType;
  ProfileTypeFieldType: db.ProfileTypeFieldType;
  ProfileTypeIcon:
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
  ProfileTypeStandardType: db.ProfileTypeStandardType;
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
  QueryProfileTypes_OrderBy: "createdAt_ASC" | "createdAt_DESC" | "name_ASC" | "name_DESC";
  QueryProfiles_OrderBy: "createdAt_ASC" | "createdAt_DESC" | "name_ASC" | "name_DESC";
  QueryUserGroups_OrderBy: "createdAt_ASC" | "createdAt_DESC" | "name_ASC" | "name_DESC";
  Result: "FAILURE" | "SUCCESS";
  SignatureConfigSigningMode: "PARALLEL" | "SEQUENTIAL";
  SignatureOrgIntegrationEnvironment: "DEMO" | "PRODUCTION";
  SignatureOrgIntegrationProvider: "DOCUSIGN" | "SIGNATURIT";
  StandardListDefinitionListType: db.StandardListDefinitionListType;
  Success: "SUCCESS";
  TaskName: db.TaskName;
  TaskStatus: db.TaskStatus;
  Tone: "FORMAL" | "INFORMAL";
  UpdateUserGroupPermissionsInputEffect: "DENY" | "GRANT" | "NONE";
  UserGroupPermissionEffect: db.UserGroupPermissionEffect;
  UserGroupType: db.UserGroupType;
  UserLocale: db.UserLocale;
  UserStatus: db.UserStatus;
}

export interface NexusGenScalars {
  String: string;
  Int: number;
  Float: number;
  Boolean: boolean;
  ID: string;
  Date: string;
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
  AccessActivatedEvent: petitionEvents.AccessActivatedEvent;
  AccessActivatedFromPublicPetitionLinkEvent: petitionEvents.AccessActivatedFromPublicPetitionLinkEvent;
  AccessActivatedFromPublicPetitionLinkUserNotification: notifications.AccessActivatedFromPublicPetitionLinkUserNotification;
  AccessDeactivatedEvent: petitionEvents.AccessDeactivatedEvent;
  AccessDelegatedEvent: petitionEvents.AccessDelegatedEvent;
  AccessOpenedEvent: petitionEvents.AccessOpenedEvent;
  AiCompletionLog: db.AiCompletionLog;
  AsyncFieldCompletionResponse: {
    // root type
    type: string; // String!
    url: string; // String!
  };
  AutomaticNumberingConfig: {
    numbering_type: "NUMBERS" | "LETTERS" | "ROMAN_NUMERALS";
  };
  BackgroundCheckEntityDetailsCompany: {
    // root type
    createdAt?: NexusGenScalars["DateTime"] | null; // DateTime
    id: string; // String!
    name: string; // String!
    properties: NexusGenRootTypes["BackgroundCheckEntityDetailsCompanyProperties"]; // BackgroundCheckEntityDetailsCompanyProperties!
    type: string; // String!
  };
  BackgroundCheckEntityDetailsCompanyProperties: {
    // root type
    address?: string[] | null; // [String!]
    alias?: string[] | null; // [String!]
    dateOfRegistration?: string[] | null; // [String!]
    jurisdiction?: string[] | null; // [String!]
    name?: string[] | null; // [String!]
    relationships?: NexusGenRootTypes["BackgroundCheckEntityDetailsRelationship"][] | null; // [BackgroundCheckEntityDetailsRelationship!]
    sanctions?: NexusGenRootTypes["BackgroundCheckEntityDetailsSanction"][] | null; // [BackgroundCheckEntityDetailsSanction!]
    topics?: string[] | null; // [String!]
  };
  BackgroundCheckEntityDetailsPerson: {
    // root type
    createdAt?: NexusGenScalars["DateTime"] | null; // DateTime
    id: string; // String!
    name: string; // String!
    properties: NexusGenRootTypes["BackgroundCheckEntityDetailsPersonProperties"]; // BackgroundCheckEntityDetailsPersonProperties!
    type: string; // String!
  };
  BackgroundCheckEntityDetailsPersonProperties: {
    // root type
    alias?: string[] | null; // [String!]
    birthPlace?: string[] | null; // [String!]
    country?: string[] | null; // [String!]
    countryOfBirth?: string[] | null; // [String!]
    dateOfBirth?: string[] | null; // [String!]
    education?: string[] | null; // [String!]
    ethnicity?: string[] | null; // [String!]
    gender?: string[] | null; // [String!]
    name?: string[] | null; // [String!]
    nationality?: string[] | null; // [String!]
    position?: string[] | null; // [String!]
    relationships?: NexusGenRootTypes["BackgroundCheckEntityDetailsRelationship"][] | null; // [BackgroundCheckEntityDetailsRelationship!]
    religion?: string[] | null; // [String!]
    sanctions?: NexusGenRootTypes["BackgroundCheckEntityDetailsSanction"][] | null; // [BackgroundCheckEntityDetailsSanction!]
    status?: string[] | null; // [String!]
    topics?: string[] | null; // [String!]
  };
  BackgroundCheckEntityDetailsRelationship: {
    // root type
    id: string; // String!
    properties: NexusGenRootTypes["BackgroundCheckEntityDetailsRelationshipProperties"]; // BackgroundCheckEntityDetailsRelationshipProperties!
    type: string; // String!
  };
  BackgroundCheckEntityDetailsRelationshipProperties: {
    // root type
    endDate?: string[] | null; // [String!]
    entityA?: NexusGenRootTypes["BackgroundCheckEntityDetails"] | null; // BackgroundCheckEntityDetails
    entityB?: NexusGenRootTypes["BackgroundCheckEntityDetails"] | null; // BackgroundCheckEntityDetails
    relationship?: string[] | null; // [String!]
    startDate?: string[] | null; // [String!]
  };
  BackgroundCheckEntityDetailsSanction: {
    // root type
    id: string; // String!
    properties: NexusGenRootTypes["BackgroundCheckEntityDetailsSanctionProperties"]; // BackgroundCheckEntityDetailsSanctionProperties!
    type: string; // String!
  };
  BackgroundCheckEntityDetailsSanctionProperties: {
    // root type
    authority?: string[] | null; // [String!]
    endDate?: string[] | null; // [String!]
    program?: string[] | null; // [String!]
    sourceUrl?: string[] | null; // [String!]
    startDate?: string[] | null; // [String!]
  };
  BackgroundCheckEntitySearch: {
    // root type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    items: NexusGenRootTypes["BackgroundCheckEntitySearchSchema"][]; // [BackgroundCheckEntitySearchSchema!]!
    totalCount: number; // Int!
  };
  BackgroundCheckEntitySearchCompany: {
    // root type
    id: string; // String!
    name: string; // String!
    properties: NexusGenRootTypes["BackgroundCheckEntitySearchCompanyProperties"]; // BackgroundCheckEntitySearchCompanyProperties!
    type: string; // String!
  };
  BackgroundCheckEntitySearchCompanyProperties: {
    // root type
    incorporationDate?: string[] | null; // [String!]
    jurisdiction?: string[] | null; // [String!]
    topics?: string[] | null; // [String!]
  };
  BackgroundCheckEntitySearchPerson: {
    // root type
    id: string; // String!
    name: string; // String!
    properties: NexusGenRootTypes["BackgroundCheckEntitySearchPersonProperties"]; // BackgroundCheckEntitySearchPersonProperties!
    type: string; // String!
  };
  BackgroundCheckEntitySearchPersonProperties: {
    // root type
    birthDate?: string[] | null; // [String!]
    country?: string[] | null; // [String!]
    gender?: string[] | null; // [String!]
    topics?: string[] | null; // [String!]
  };
  BulkCreateContactsReturnType: {
    // root type
    contacts: NexusGenRootTypes["Contact"][]; // [Contact!]!
    errors?: NexusGenScalars["JSON"][] | null; // [JSON!]
  };
  CommentCreatedUserNotification: notifications.CommentCreatedUserNotification;
  CommentDeletedEvent: petitionEvents.CommentDeletedEvent;
  CommentPublishedEvent: petitionEvents.CommentPublishedEvent;
  ConnectionMetadata: {
    // root type
    browserName?: string | null; // String
    browserVersion?: string | null; // String
    country?: string | null; // String
    deviceType?: string | null; // String
    ip?: string | null; // String
  };
  Contact: db.Contact;
  ContactPagination: {
    // root type
    items: NexusGenRootTypes["Contact"][]; // [Contact!]!
    totalCount: number; // Int!
  };
  ContactlessAccessUsedEvent: petitionEvents.ContactlessAccessUsedEvent;
  Dashboard: db.Dashboard;
  DashboardCreateParallelButtonModule: {
    // root type
    id: NexusGenScalars["GID"]; // GID!
    settings: NexusGenRootTypes["DashboardCreateParallelButtonModuleSettings"]; // DashboardCreateParallelButtonModuleSettings!
    title?: string | null; // String
  };
  DashboardCreateParallelButtonModuleSettings: {
    label: string;
    template_id: number;
  };
  DashboardNumberModuleResult: {
    // root type
    value: number; // Int!
  };
  DashboardParallelsNumberModule: {
    // root type
    id: NexusGenScalars["GID"]; // GID!
    result?: NexusGenRootTypes["DashboardNumberModuleResult"] | null; // DashboardNumberModuleResult
    title?: string | null; // String
  };
  DashboardParallelsPieChartModule: {
    // root type
    id: NexusGenScalars["GID"]; // GID!
    result?: NexusGenRootTypes["DashboardPieChartModuleResult"] | null; // DashboardPieChartModuleResult
    settings: NexusGenRootTypes["DashboardParallelsPieChartModuleSettings"]; // DashboardParallelsPieChartModuleSettings!
    title?: string | null; // String
  };
  DashboardParallelsPieChartModuleSettings: {
    graphicType: "DOUGHNUT" | "PIE";
    filters: { label: string; color: string }[];
  };
  DashboardParallelsRatioModule: {
    // root type
    id: NexusGenScalars["GID"]; // GID!
    result?: NexusGenRootTypes["DashboardRatioModuleResult"] | null; // DashboardRatioModuleResult
    settings: NexusGenRootTypes["DashboardParallelsRatioModuleSettings"]; // DashboardParallelsRatioModuleSettings!
    title?: string | null; // String
  };
  DashboardParallelsRatioModuleSettings: {
    // root type
    graphicType: NexusGenEnums["DashboardRatioModuleSettingsType"]; // DashboardRatioModuleSettingsType!
  };
  DashboardPieChartModuleResult: {
    // root type
    isIncongruent: boolean; // Boolean!
    value: number[]; // [Int!]!
  };
  DashboardProfilesNumberModule: {
    // root type
    id: NexusGenScalars["GID"]; // GID!
    result?: NexusGenRootTypes["DashboardNumberModuleResult"] | null; // DashboardNumberModuleResult
    title?: string | null; // String
  };
  DashboardProfilesPieChartModule: {
    // root type
    id: NexusGenScalars["GID"]; // GID!
    result?: NexusGenRootTypes["DashboardPieChartModuleResult"] | null; // DashboardPieChartModuleResult
    settings: NexusGenRootTypes["DashboardProfilesPieChartModuleSettings"]; // DashboardProfilesPieChartModuleSettings!
    title?: string | null; // String
  };
  DashboardProfilesPieChartModuleSettings: {
    graphicType: "DOUGHNUT" | "PIE";
    filters: { label: string; color: string }[];
  };
  DashboardProfilesRatioModule: {
    // root type
    id: NexusGenScalars["GID"]; // GID!
    result?: NexusGenRootTypes["DashboardRatioModuleResult"] | null; // DashboardRatioModuleResult
    settings: NexusGenRootTypes["DashboardProfilesRatioModuleSettings"]; // DashboardProfilesRatioModuleSettings!
    title?: string | null; // String
  };
  DashboardProfilesRatioModuleSettings: {
    // root type
    graphicType: NexusGenEnums["DashboardRatioModuleSettingsType"]; // DashboardRatioModuleSettingsType!
  };
  DashboardRatioModuleResult: {
    // root type
    isIncongruent: boolean; // Boolean!
    value: number[]; // [Int!]!
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
  GroupPermissionAddedEvent: petitionEvents.GroupPermissionAddedEvent;
  GroupPermissionEditedEvent: petitionEvents.GroupPermissionEditedEvent;
  GroupPermissionRemovedEvent: petitionEvents.GroupPermissionRemovedEvent;
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
  MaybeTask: {
    // root type
    status: NexusGenEnums["MaybeTaskStatus"]; // MaybeTaskStatus!
    task?: NexusGenRootTypes["Task"] | null; // Task
  };
  MessageCancelledEvent: petitionEvents.MessageCancelledEvent;
  MessageEmailBouncedUserNotification: notifications.MessageEmailBouncedUserNotification;
  MessageScheduledEvent: petitionEvents.MessageScheduledEvent;
  MessageSentEvent: petitionEvents.MessageSentEvent;
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
  OwnershipTransferredEvent: petitionEvents.OwnershipTransferredEvent;
  Petition: db.Petition;
  PetitionAccess: db.PetitionAccess;
  PetitionAccessPagination: {
    // root type
    items: NexusGenRootTypes["PetitionAccess"][]; // [PetitionAccess!]!
    totalCount: number; // Int!
  };
  PetitionAnonymizedEvent: petitionEvents.PetitionAnonymizedEvent;
  PetitionAssociatedEvent: profileEvents.PetitionAssociatedEvent;
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
  PetitionClonedEvent: petitionEvents.PetitionClonedEvent;
  PetitionClosedEvent: petitionEvents.PetitionClosedEvent;
  PetitionClosedNotifiedEvent: petitionEvents.PetitionClosedNotifiedEvent;
  PetitionCompletedEvent: petitionEvents.PetitionCompletedEvent;
  PetitionCompletedUserNotification: notifications.PetitionCompletedUserNotification;
  PetitionCreatedEvent: petitionEvents.PetitionCreatedEvent;
  PetitionCustomList: {
    name: string;
    values: string[];
  };
  PetitionDeletedEvent: petitionEvents.PetitionDeletedEvent;
  PetitionDisassociatedEvent: profileEvents.PetitionDisassociatedEvent;
  PetitionEventPagination: {
    // root type
    items: NexusGenRootTypes["PetitionEvent"][]; // [PetitionEvent!]!
    totalCount: number; // Int!
  };
  PetitionEventSubscription: db.EventSubscription;
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
  PetitionFieldGroupChildReply: {
    parent_petition_field_reply_id: number;
    petition_field_id: number;
  };
  PetitionFieldGroupRelationship: db.PetitionFieldGroupRelationship;
  PetitionFieldMini: db.PetitionField;
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
    columns?: NexusGenEnums["PetitionListViewColumn"][] | null; // [PetitionListViewColumn!]
    fromTemplateId?: NexusGenScalars["GID"][] | null; // [GID!]
    path: string; // String!
    search?: string | null; // String
    searchIn: NexusGenEnums["PetitionListViewSearchIn"]; // PetitionListViewSearchIn!
    sharedWith?: NexusGenRootTypes["PetitionListViewDataSharedWith"] | null; // PetitionListViewDataSharedWith
    signature?: NexusGenEnums["PetitionSignatureStatusFilter"][] | null; // [PetitionSignatureStatusFilter!]
    sort?: NexusGenRootTypes["PetitionListViewSort"] | null; // PetitionListViewSort
    status?: NexusGenEnums["PetitionStatus"][] | null; // [PetitionStatus!]
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
    direction: NexusGenEnums["ListViewSortDirection"]; // ListViewSortDirection!
    field: NexusGenEnums["PetitionListViewSortField"]; // PetitionListViewSortField!
  };
  PetitionMessage: db.PetitionMessage;
  PetitionMessageBouncedEvent: petitionEvents.PetitionMessageBouncedEvent;
  PetitionPagination: {
    // root type
    items: NexusGenRootTypes["Petition"][]; // [Petition!]!
    totalCount: number; // Int!
  };
  PetitionProfile: db.PetitionProfile;
  PetitionProgress: {
    // root type
    external: NexusGenRootTypes["PetitionFieldProgress"]; // PetitionFieldProgress!
    internal: NexusGenRootTypes["PetitionFieldProgress"]; // PetitionFieldProgress!
  };
  PetitionReminder: db.PetitionReminder;
  PetitionReminderBouncedEvent: petitionEvents.PetitionReminderBouncedEvent;
  PetitionReopenedEvent: petitionEvents.PetitionReopenedEvent;
  PetitionSharedUserNotification: notifications.PetitionSharedUserNotification;
  PetitionSharingInfo: number[];
  PetitionSignatureRequest: db.PetitionSignatureRequest;
  PetitionSignatureRequestMini: db.PetitionSignatureRequest;
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
    isPreset?: boolean;
  };
  PetitionTaggedEvent: petitionEvents.PetitionTaggedEvent;
  PetitionTemplate: db.Petition;
  PetitionUntaggedEvent: petitionEvents.PetitionUntaggedEvent;
  PetitionUserGroupPermission: db.PetitionPermission;
  PetitionUserPermission: db.PetitionPermission;
  PetitionVariable: {
    name: string;
    default_value: number;
  };
  PetitionVariableResult: {
    name: string;
    value: number | null;
  };
  Profile: db.Profile;
  ProfileAnonymizedEvent: profileEvents.ProfileAnonymizedEvent;
  ProfileAssociatedEvent: petitionEvents.ProfileAssociatedEvent;
  ProfileClosedEvent: profileEvents.ProfileClosedEvent;
  ProfileCreatedEvent: profileEvents.ProfileCreatedEvent;
  ProfileDisassociatedEvent: petitionEvents.ProfileDisassociatedEvent;
  ProfileEventPagination: {
    // root type
    items: NexusGenRootTypes["ProfileEvent"][]; // [ProfileEvent!]!
    totalCount: number; // Int!
  };
  ProfileEventSubscription: db.EventSubscription;
  ProfileExternalSourceOrgIntegration: db.OrgIntegration;
  ProfileExternalSourceSearchMultipleResults: {
    // root type
    results: NexusGenRootTypes["ProfileExternalSourceSearchMultipleResultsDetail"]; // ProfileExternalSourceSearchMultipleResultsDetail!
    totalCount: number; // Int!
  };
  ProfileExternalSourceSearchMultipleResultsColumn: {
    // root type
    key: string; // String!
    label: string; // String!
  };
  ProfileExternalSourceSearchMultipleResultsDetail: {
    // root type
    columns: NexusGenRootTypes["ProfileExternalSourceSearchMultipleResultsColumn"][]; // [ProfileExternalSourceSearchMultipleResultsColumn!]!
    key: string; // String!
    rows: NexusGenScalars["JSONObject"][]; // [JSONObject!]!
  };
  ProfileExternalSourceSearchParam: {
    // root type
    defaultValue?: string | null; // String
    key: string; // String!
    label: string; // String!
    minLength?: number | null; // Int
    options?: NexusGenRootTypes["ProfileExternalSourceSearchParamOption"][] | null; // [ProfileExternalSourceSearchParamOption!]
    placeholder?: string | null; // String
    required: boolean; // Boolean!
    type: NexusGenEnums["ProfileExternalSourceSearchParamType"]; // ProfileExternalSourceSearchParamType!
  };
  ProfileExternalSourceSearchParamOption: {
    // root type
    label: string; // String!
    value: string; // String!
  };
  ProfileExternalSourceSearchSingleResult: {
    id: number;
    profileId: number | null;
    data: { profileTypeFieldId: number; content: any }[];
  };
  ProfileExternalSourceSearchSingleResultData: {
    // root type
    content?: NexusGenScalars["JSONObject"] | null; // JSONObject
  };
  ProfileFieldExpiryUpdatedEvent: profileEvents.ProfileFieldExpiryUpdatedEvent;
  ProfileFieldFile: db.ProfileFieldFile;
  ProfileFieldFileAddedEvent: profileEvents.ProfileFieldFileAddedEvent;
  ProfileFieldFileRemovedEvent: profileEvents.ProfileFieldFileRemovedEvent;
  ProfileFieldFileWithUploadData: {
    // root type
    file: NexusGenRootTypes["ProfileFieldFile"]; // ProfileFieldFile!
    presignedPostData: NexusGenRootTypes["AWSPresignedPostData"]; // AWSPresignedPostData!
  };
  ProfileFieldProperty: ({ profile_id: number } | { profile: db.Profile }) &
    ({ profile_type_field_id: number } | { profile_type_field: db.ProfileTypeField });
  ProfileFieldPropertyAndFileWithUploadData: {
    // root type
    property: NexusGenRootTypes["ProfileFieldProperty"]; // ProfileFieldProperty!
    uploads: NexusGenRootTypes["ProfileFieldFileWithUploadData"][]; // [ProfileFieldFileWithUploadData!]!
  };
  ProfileFieldPropertyPagination: {
    // root type
    items: NexusGenRootTypes["ProfileFieldProperty"][]; // [ProfileFieldProperty!]!
    totalCount: number; // Int!
  };
  ProfileFieldValue: db.ProfileFieldValue;
  ProfileFieldValueUpdatedEvent: profileEvents.ProfileFieldValueUpdatedEvent;
  ProfileListView: db.ProfileListView;
  ProfileListViewData: {
    // root type
    columns?: string[] | null; // [String!]
    search?: string | null; // String
    sort?: NexusGenRootTypes["ProfileListViewSort"] | null; // ProfileListViewSort
    status?: NexusGenEnums["ProfileStatus"] | null; // ProfileStatus
    values?: NexusGenScalars["JSONObject"] | null; // JSONObject
  };
  ProfileListViewSort: {
    // root type
    direction: NexusGenEnums["ListViewSortDirection"]; // ListViewSortDirection!
    field: NexusGenEnums["ProfileListViewSortField"]; // ProfileListViewSortField!
  };
  ProfilePagination: {
    // root type
    items: NexusGenRootTypes["Profile"][]; // [Profile!]!
    totalCount: number; // Int!
  };
  ProfileRelationship: db.ProfileRelationship;
  ProfileRelationshipCreatedEvent: profileEvents.ProfileRelationshipCreatedEvent;
  ProfileRelationshipRemovedEvent: profileEvents.ProfileRelationshipRemovedEvent;
  ProfileRelationshipType: db.ProfileRelationshipType;
  ProfileRelationshipTypeWithDirection: {
    profile_relationship_type_id: number;
    direction: db.ProfileRelationshipTypeDirection;
  };
  ProfileReopenedEvent: profileEvents.ProfileReopenedEvent;
  ProfileScheduledForDeletionEvent: profileEvents.ProfileScheduledForDeletionEvent;
  ProfileSubscription: db.ProfileSubscription;
  ProfileType: db.ProfileType;
  ProfileTypeField: db.ProfileTypeField;
  ProfileTypeFieldPermission: db.ProfileTypeFieldPermission;
  ProfileTypePagination: {
    // root type
    items: NexusGenRootTypes["ProfileType"][]; // [ProfileType!]!
    totalCount: number; // Int!
  };
  ProfileTypeProcess: db.ProfileTypeProcess;
  ProfileUpdatedEvent: profileEvents.ProfileUpdatedEvent;
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
  PublicPetitionFieldGroupChildReply: {
    parent_petition_field_reply_id: number;
    petition_field_id: number;
  };
  PublicPetitionFieldProgress: {
    // root type
    optional: number; // Int!
    replied: number; // Int!
    total: number; // Int!
  };
  PublicPetitionFieldReply: db.PetitionFieldReply;
  PublicPetitionLink: db.PublicPetitionLink;
  PublicPetitionMessage: db.PetitionMessage;
  PublicPetitionSignatureRequest: db.PetitionSignatureRequest;
  PublicProfileType: db.ProfileType;
  PublicProfileTypeField: db.ProfileTypeField;
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
    minSigners: number;
    instructions?: string;
    signingMode: "PARALLEL" | "SEQUENTIAL";
  };
  PublicUser: db.User;
  Query: {};
  RecipientSignedEvent: petitionEvents.RecipientSignedEvent;
  ReminderEmailBouncedUserNotification: notifications.ReminderEmailBouncedUserNotification;
  ReminderSentEvent: petitionEvents.ReminderSentEvent;
  RemindersConfig: {
    offset: number;
    limit: number;
    time: string;
    timezone: string;
    weekdaysOnly: boolean;
  };
  RemindersOptOutEvent: petitionEvents.RemindersOptOutEvent;
  RemindersOptOutNotification: notifications.RemindersOptOutNotification;
  ReplyCreatedEvent: petitionEvents.ReplyCreatedEvent;
  ReplyDeletedEvent: petitionEvents.ReplyDeletedEvent;
  ReplyStatusChangedEvent: petitionEvents.ReplyStatusChangedEvent;
  ReplyUpdatedEvent: petitionEvents.ReplyUpdatedEvent;
  SendPetitionResult: {
    // root type
    accesses?: NexusGenRootTypes["PetitionAccess"][] | null; // [PetitionAccess!]
    petition?: NexusGenRootTypes["Petition"] | null; // Petition
    result: NexusGenEnums["Result"]; // Result!
  };
  SignatureCancelledEvent: petitionEvents.SignatureCancelledEvent;
  SignatureCancelledUserNotification: notifications.SignatureCancelledUserNotification;
  SignatureCompletedEvent: petitionEvents.SignatureCompletedEvent;
  SignatureCompletedUserNotification: notifications.SignatureCompletedUserNotification;
  SignatureConfig: {
    orgIntegrationId: number;
    signersInfo: {
      firstName: string;
      lastName: string;
      email: string;
      isPreset?: boolean;
    }[];
    timezone: string;
    title: string | null;
    review?: boolean;
    allowAdditionalSigners?: boolean;
    minSigners: number;
    instructions?: string | null;
    message?: string;
    signingMode: "PARALLEL" | "SEQUENTIAL";
    useCustomDocument?: boolean;
  };
  SignatureDeliveredEvent: petitionEvents.SignatureDeliveredEvent;
  SignatureOpenedEvent: petitionEvents.SignatureOpenedEvent;
  SignatureOrgIntegration: db.OrgIntegration;
  SignatureReminderEvent: petitionEvents.SignatureReminderEvent;
  SignatureStartedEvent: petitionEvents.SignatureStartedEvent;
  StandardListDefinition: Replace<
    db.StandardListDefinition,
    {
      list_version: string | null;
      values: { key: string; prefix?: string; suffix?: string; label?: string }[];
    }
  >;
  StandardListDefinitionValue: {
    // root type
    key: string; // String!
    label?: string | null; // String
    prefix?: string | null; // String
    suffix?: string | null; // String
  };
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
  TemplateUsedEvent: petitionEvents.TemplateUsedEvent;
  User: db.User;
  UserAuthenticationToken: db.UserAuthenticationToken;
  UserGroup: db.UserGroup;
  UserGroupMember: db.UserGroupMember;
  UserGroupPagination: {
    // root type
    items: NexusGenRootTypes["UserGroup"][]; // [UserGroup!]!
    totalCount: number; // Int!
  };
  UserGroupPermission: db.UserGroupPermission;
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
  UserPermissionAddedEvent: petitionEvents.UserPermissionAddedEvent;
  UserPermissionEditedEvent: petitionEvents.UserPermissionEditedEvent;
  UserPermissionRemovedEvent: petitionEvents.UserPermissionRemovedEvent;
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
  BackgroundCheckEntityDetails:
    | NexusGenRootTypes["BackgroundCheckEntityDetailsCompany"]
    | NexusGenRootTypes["BackgroundCheckEntityDetailsPerson"];
  BackgroundCheckEntitySearchSchema:
    | NexusGenRootTypes["BackgroundCheckEntitySearchCompany"]
    | NexusGenRootTypes["BackgroundCheckEntitySearchPerson"];
  CreatedAt: {
    created_at: Date;
  };
  DashboardModule: db.DashboardModule;
  DowJonesKycEntityProfileResult:
    | NexusGenRootTypes["DowJonesKycEntityProfileResultEntity"]
    | NexusGenRootTypes["DowJonesKycEntityProfileResultPerson"];
  DowJonesKycEntitySearchResult:
    | NexusGenRootTypes["DowJonesKycEntitySearchResultEntity"]
    | NexusGenRootTypes["DowJonesKycEntitySearchResultPerson"];
  EventSubscription: db.EventSubscription;
  IOrgIntegration:
    | NexusGenRootTypes["OrgIntegration"]
    | NexusGenRootTypes["ProfileExternalSourceOrgIntegration"]
    | NexusGenRootTypes["SignatureOrgIntegration"];
  ListView:
    | ({ __type: "PetitionListView" } & db.PetitionListView)
    | ({ __type: "ProfileListView" } & db.ProfileListView);
  PetitionBase: db.Petition;
  PetitionEvent: petitionEvents.PetitionEvent;
  PetitionPermission: db.PetitionPermission;
  PetitionUserNotification: db.PetitionUserNotification;
  ProfileEvent: profileEvents.ProfileEvent;
  ProfileFieldResponse: db.ProfileFieldValue | db.ProfileFieldFile;
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
  PetitionFieldOrPetition:
    | ({ __type: "PetitionField" } & NexusGenRootTypes["PetitionField"])
    | ({ __type: "Petition" } & NexusGenRootTypes["Petition"]);
  ProfileExternalSourceSearchResults:
    | ({ type: "FOUND" } & NexusGenRootTypes["ProfileExternalSourceSearchSingleResult"])
    | ({
        type: "MULTIPLE_RESULTS";
      } & NexusGenRootTypes["ProfileExternalSourceSearchMultipleResults"]);
  PublicPetitionFieldOrPublicPetition:
    | ({ __type: "PublicPetitionField" } & NexusGenRootTypes["PublicPetitionField"])
    | ({ __type: "PublicPetition" } & NexusGenRootTypes["PublicPetition"]);
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
  AiCompletionLog: {
    // field return type
    completion: string | null; // String
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    status: NexusGenEnums["AiCompletionLogStatus"]; // AiCompletionLogStatus!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  AsyncFieldCompletionResponse: {
    // field return type
    type: string; // String!
    url: string; // String!
  };
  AutomaticNumberingConfig: {
    // field return type
    numberingType: NexusGenEnums["AutomaticNumberingType"]; // AutomaticNumberingType!
  };
  BackgroundCheckEntityDetailsCompany: {
    // field return type
    createdAt: NexusGenScalars["DateTime"] | null; // DateTime
    id: string; // String!
    name: string; // String!
    properties: NexusGenRootTypes["BackgroundCheckEntityDetailsCompanyProperties"]; // BackgroundCheckEntityDetailsCompanyProperties!
    type: string; // String!
  };
  BackgroundCheckEntityDetailsCompanyProperties: {
    // field return type
    address: string[] | null; // [String!]
    alias: string[] | null; // [String!]
    dateOfRegistration: string[] | null; // [String!]
    jurisdiction: string[] | null; // [String!]
    name: string[] | null; // [String!]
    relationships: NexusGenRootTypes["BackgroundCheckEntityDetailsRelationship"][] | null; // [BackgroundCheckEntityDetailsRelationship!]
    sanctions: NexusGenRootTypes["BackgroundCheckEntityDetailsSanction"][] | null; // [BackgroundCheckEntityDetailsSanction!]
    topics: string[] | null; // [String!]
  };
  BackgroundCheckEntityDetailsPerson: {
    // field return type
    createdAt: NexusGenScalars["DateTime"] | null; // DateTime
    id: string; // String!
    name: string; // String!
    properties: NexusGenRootTypes["BackgroundCheckEntityDetailsPersonProperties"]; // BackgroundCheckEntityDetailsPersonProperties!
    type: string; // String!
  };
  BackgroundCheckEntityDetailsPersonProperties: {
    // field return type
    alias: string[] | null; // [String!]
    birthPlace: string[] | null; // [String!]
    country: string[] | null; // [String!]
    countryOfBirth: string[] | null; // [String!]
    dateOfBirth: string[] | null; // [String!]
    education: string[] | null; // [String!]
    ethnicity: string[] | null; // [String!]
    gender: string[] | null; // [String!]
    name: string[] | null; // [String!]
    nationality: string[] | null; // [String!]
    position: string[] | null; // [String!]
    relationships: NexusGenRootTypes["BackgroundCheckEntityDetailsRelationship"][] | null; // [BackgroundCheckEntityDetailsRelationship!]
    religion: string[] | null; // [String!]
    sanctions: NexusGenRootTypes["BackgroundCheckEntityDetailsSanction"][] | null; // [BackgroundCheckEntityDetailsSanction!]
    status: string[] | null; // [String!]
    topics: string[] | null; // [String!]
  };
  BackgroundCheckEntityDetailsRelationship: {
    // field return type
    id: string; // String!
    properties: NexusGenRootTypes["BackgroundCheckEntityDetailsRelationshipProperties"]; // BackgroundCheckEntityDetailsRelationshipProperties!
    type: string; // String!
  };
  BackgroundCheckEntityDetailsRelationshipProperties: {
    // field return type
    endDate: string[] | null; // [String!]
    entityA: NexusGenRootTypes["BackgroundCheckEntityDetails"] | null; // BackgroundCheckEntityDetails
    entityB: NexusGenRootTypes["BackgroundCheckEntityDetails"] | null; // BackgroundCheckEntityDetails
    relationship: string[] | null; // [String!]
    startDate: string[] | null; // [String!]
  };
  BackgroundCheckEntityDetailsSanction: {
    // field return type
    id: string; // String!
    properties: NexusGenRootTypes["BackgroundCheckEntityDetailsSanctionProperties"]; // BackgroundCheckEntityDetailsSanctionProperties!
    type: string; // String!
  };
  BackgroundCheckEntityDetailsSanctionProperties: {
    // field return type
    authority: string[] | null; // [String!]
    endDate: string[] | null; // [String!]
    program: string[] | null; // [String!]
    sourceUrl: string[] | null; // [String!]
    startDate: string[] | null; // [String!]
  };
  BackgroundCheckEntitySearch: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    items: NexusGenRootTypes["BackgroundCheckEntitySearchSchema"][]; // [BackgroundCheckEntitySearchSchema!]!
    totalCount: number; // Int!
  };
  BackgroundCheckEntitySearchCompany: {
    // field return type
    id: string; // String!
    name: string; // String!
    properties: NexusGenRootTypes["BackgroundCheckEntitySearchCompanyProperties"]; // BackgroundCheckEntitySearchCompanyProperties!
    type: string; // String!
  };
  BackgroundCheckEntitySearchCompanyProperties: {
    // field return type
    incorporationDate: string[] | null; // [String!]
    jurisdiction: string[] | null; // [String!]
    topics: string[] | null; // [String!]
  };
  BackgroundCheckEntitySearchPerson: {
    // field return type
    id: string; // String!
    name: string; // String!
    properties: NexusGenRootTypes["BackgroundCheckEntitySearchPersonProperties"]; // BackgroundCheckEntitySearchPersonProperties!
    type: string; // String!
  };
  BackgroundCheckEntitySearchPersonProperties: {
    // field return type
    birthDate: string[] | null; // [String!]
    country: string[] | null; // [String!]
    gender: string[] | null; // [String!]
    topics: string[] | null; // [String!]
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
    field: NexusGenRootTypes["PetitionField"] | null; // PetitionField
    id: NexusGenScalars["GID"]; // GID!
    isGeneral: boolean; // Boolean!
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
    isGeneral: boolean; // Boolean!
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
    isGeneral: boolean; // Boolean!
    isInternal: boolean; // Boolean!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
  };
  ConnectionMetadata: {
    // field return type
    browserName: string | null; // String
    browserVersion: string | null; // String
    country: string | null; // String
    deviceType: string | null; // String
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
  ContactlessAccessUsedEvent: {
    // field return type
    access: NexusGenRootTypes["PetitionAccess"]; // PetitionAccess!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
  };
  Dashboard: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    isDefault: boolean; // Boolean!
    isRefreshing: boolean; // Boolean!
    lastRefreshAt: NexusGenScalars["DateTime"] | null; // DateTime
    modules: NexusGenRootTypes["DashboardModule"][]; // [DashboardModule!]!
    name: string; // String!
  };
  DashboardCreateParallelButtonModule: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    settings: NexusGenRootTypes["DashboardCreateParallelButtonModuleSettings"]; // DashboardCreateParallelButtonModuleSettings!
    size: NexusGenEnums["DashboardModuleSize"]; // DashboardModuleSize!
    title: string | null; // String
  };
  DashboardCreateParallelButtonModuleSettings: {
    // field return type
    label: string; // String!
    template: NexusGenRootTypes["PetitionBaseMini"] | null; // PetitionBaseMini
  };
  DashboardNumberModuleResult: {
    // field return type
    value: number; // Int!
  };
  DashboardParallelsNumberModule: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    result: NexusGenRootTypes["DashboardNumberModuleResult"] | null; // DashboardNumberModuleResult
    size: NexusGenEnums["DashboardModuleSize"]; // DashboardModuleSize!
    title: string | null; // String
  };
  DashboardParallelsPieChartModule: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    result: NexusGenRootTypes["DashboardPieChartModuleResult"] | null; // DashboardPieChartModuleResult
    settings: NexusGenRootTypes["DashboardParallelsPieChartModuleSettings"]; // DashboardParallelsPieChartModuleSettings!
    size: NexusGenEnums["DashboardModuleSize"]; // DashboardModuleSize!
    title: string | null; // String
  };
  DashboardParallelsPieChartModuleSettings: {
    // field return type
    colors: string[]; // [String!]!
    graphicType: NexusGenEnums["DashboardPieChartModuleSettingsType"]; // DashboardPieChartModuleSettingsType!
    labels: string[]; // [String!]!
  };
  DashboardParallelsRatioModule: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    result: NexusGenRootTypes["DashboardRatioModuleResult"] | null; // DashboardRatioModuleResult
    settings: NexusGenRootTypes["DashboardParallelsRatioModuleSettings"]; // DashboardParallelsRatioModuleSettings!
    size: NexusGenEnums["DashboardModuleSize"]; // DashboardModuleSize!
    title: string | null; // String
  };
  DashboardParallelsRatioModuleSettings: {
    // field return type
    graphicType: NexusGenEnums["DashboardRatioModuleSettingsType"]; // DashboardRatioModuleSettingsType!
  };
  DashboardPieChartModuleResult: {
    // field return type
    isIncongruent: boolean; // Boolean!
    value: number[]; // [Int!]!
  };
  DashboardProfilesNumberModule: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    result: NexusGenRootTypes["DashboardNumberModuleResult"] | null; // DashboardNumberModuleResult
    size: NexusGenEnums["DashboardModuleSize"]; // DashboardModuleSize!
    title: string | null; // String
  };
  DashboardProfilesPieChartModule: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    result: NexusGenRootTypes["DashboardPieChartModuleResult"] | null; // DashboardPieChartModuleResult
    settings: NexusGenRootTypes["DashboardProfilesPieChartModuleSettings"]; // DashboardProfilesPieChartModuleSettings!
    size: NexusGenEnums["DashboardModuleSize"]; // DashboardModuleSize!
    title: string | null; // String
  };
  DashboardProfilesPieChartModuleSettings: {
    // field return type
    colors: string[]; // [String!]!
    graphicType: NexusGenEnums["DashboardPieChartModuleSettingsType"]; // DashboardPieChartModuleSettingsType!
    labels: string[]; // [String!]!
  };
  DashboardProfilesRatioModule: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    result: NexusGenRootTypes["DashboardRatioModuleResult"] | null; // DashboardRatioModuleResult
    settings: NexusGenRootTypes["DashboardProfilesRatioModuleSettings"]; // DashboardProfilesRatioModuleSettings!
    size: NexusGenEnums["DashboardModuleSize"]; // DashboardModuleSize!
    title: string | null; // String
  };
  DashboardProfilesRatioModuleSettings: {
    // field return type
    graphicType: NexusGenEnums["DashboardRatioModuleSettingsType"]; // DashboardRatioModuleSettingsType!
  };
  DashboardRatioModuleResult: {
    // field return type
    isIncongruent: boolean; // Boolean!
    value: number[]; // [Int!]!
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
    children: NexusGenRootTypes["LandingTemplateField"][] | null; // [LandingTemplateField!]
    id: NexusGenScalars["GID"]; // GID!
    title: string | null; // String
    type: NexusGenEnums["PetitionFieldType"]; // PetitionFieldType!
  };
  LandingTemplatePagination: {
    // field return type
    items: NexusGenRootTypes["LandingTemplate"][]; // [LandingTemplate!]!
    totalCount: number; // Int!
  };
  MaybeTask: {
    // field return type
    status: NexusGenEnums["MaybeTaskStatus"]; // MaybeTaskStatus!
    task: NexusGenRootTypes["Task"] | null; // Task
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
    addUsersToUserGroup: NexusGenRootTypes["UserGroup"]; // UserGroup!
    anonymizePetition: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    approveOrRejectPetitionFieldReplies: NexusGenRootTypes["Petition"]; // Petition!
    archiveFieldGroupReplyIntoProfile: NexusGenRootTypes["PetitionFieldReply"]; // PetitionFieldReply!
    archiveProfileType: NexusGenRootTypes["ProfileType"][]; // [ProfileType!]!
    associateProfileToPetition: NexusGenRootTypes["PetitionProfile"]; // PetitionProfile!
    bulkCreateContacts: NexusGenRootTypes["BulkCreateContactsReturnType"]; // BulkCreateContactsReturnType!
    bulkCreatePetitionReplies: NexusGenRootTypes["Petition"]; // Petition!
    cancelScheduledMessage: NexusGenRootTypes["PetitionMessage"] | null; // PetitionMessage
    cancelSignatureRequest: NexusGenRootTypes["PetitionSignatureRequest"]; // PetitionSignatureRequest!
    changeOrganization: NexusGenEnums["Result"]; // Result!
    changePassword: NexusGenEnums["ChangePasswordResult"]; // ChangePasswordResult!
    changePetitionFieldType: NexusGenRootTypes["PetitionField"]; // PetitionField!
    clonePetitionField: NexusGenRootTypes["PetitionField"]; // PetitionField!
    clonePetitions: NexusGenRootTypes["PetitionBase"][]; // [PetitionBase!]!
    cloneProfileType: NexusGenRootTypes["ProfileType"]; // ProfileType!
    cloneUserGroups: NexusGenRootTypes["UserGroup"][]; // [UserGroup!]!
    closePetition: NexusGenRootTypes["Petition"]; // Petition!
    closePetitionsFromTemplate: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    closeProfile: NexusGenRootTypes["Profile"][]; // [Profile!]!
    completePetition: NexusGenRootTypes["Petition"]; // Petition!
    completeProfileFromExternalSource: NexusGenRootTypes["Profile"]; // Profile!
    copyBackgroundCheckReplyToProfileFieldValue: NexusGenRootTypes["ProfileFieldValue"]; // ProfileFieldValue!
    copyFileReplyToProfileFieldFile: NexusGenRootTypes["ProfileFieldFile"][]; // [ProfileFieldFile!]!
    createAddPetitionPermissionMaybeTask: NexusGenRootTypes["MaybeTask"]; // MaybeTask!
    createAzureOpenAiIntegration: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    createBackgroundCheckProfilePdfTask: NexusGenRootTypes["Task"]; // Task!
    createBankflipDocumentProcessingIntegration: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    createBankflipIdVerificationIntegration: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    createBulkPetitionSendTask: NexusGenRootTypes["Task"]; // Task!
    createCompaniesHouseProfileExternalSourceIntegration: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    createContact: NexusGenRootTypes["Contact"]; // Contact!
    createContactlessPetitionAccess: NexusGenRootTypes["PetitionAccess"]; // PetitionAccess!
    createCustomSignatureDocumentUploadLink: NexusGenScalars["JSONObject"]; // JSONObject!
    createDowJonesKycIntegration: NexusGenRootTypes["OrgIntegration"]; // OrgIntegration!
    createDowJonesKycReply: NexusGenRootTypes["PetitionFieldReply"]; // PetitionFieldReply!
    createDowJonesProfileDownloadTask: NexusGenRootTypes["Task"]; // Task!
    createEInformaProfileExternalSourceIntegration: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    createEditPetitionPermissionMaybeTask: NexusGenRootTypes["MaybeTask"]; // MaybeTask!
    createEventSubscriptionSignatureKey: NexusGenRootTypes["EventSubscriptionSignatureKey"]; // EventSubscriptionSignatureKey!
    createExportExcelTask: NexusGenRootTypes["Task"]; // Task!
    createExportRepliesTask: NexusGenRootTypes["Task"]; // Task!
    createFieldGroupRepliesFromProfiles: NexusGenRootTypes["PetitionField"]; // PetitionField!
    createFieldGroupReplyFromProfile: NexusGenRootTypes["PetitionFieldReply"]; // PetitionFieldReply!
    createFileExportTask: NexusGenRootTypes["Task"]; // Task!
    createFileUploadReply: NexusGenRootTypes["FileUploadReplyResponse"]; // FileUploadReplyResponse!
    createFileUploadReplyComplete: NexusGenRootTypes["PetitionFieldReply"]; // PetitionFieldReply!
    createIManageFileExportIntegration: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    createOrganization: NexusGenRootTypes["Organization"]; // Organization!
    createOrganizationPdfDocumentTheme: NexusGenRootTypes["Organization"]; // Organization!
    createPetition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    createPetitionAttachmentUploadLink: NexusGenRootTypes["PetitionAttachmentUploadData"][]; // [PetitionAttachmentUploadData!]!
    createPetitionComment: NexusGenRootTypes["PetitionFieldComment"]; // PetitionFieldComment!
    createPetitionEventSubscription: NexusGenRootTypes["PetitionEventSubscription"]; // PetitionEventSubscription!
    createPetitionField: NexusGenRootTypes["PetitionField"]; // PetitionField!
    createPetitionFieldAttachmentUploadLink: NexusGenRootTypes["PetitionFieldAttachmentUploadData"]; // PetitionFieldAttachmentUploadData!
    createPetitionFieldReplies: NexusGenRootTypes["PetitionFieldReply"][]; // [PetitionFieldReply!]!
    createPetitionFromProfile: NexusGenRootTypes["Petition"]; // Petition!
    createPetitionListView: NexusGenRootTypes["PetitionListView"]; // PetitionListView!
    createPetitionSummaryTask: NexusGenRootTypes["Task"]; // Task!
    createPetitionVariable: NexusGenRootTypes["Petition"]; // Petition!
    createPrintPdfTask: NexusGenRootTypes["Task"]; // Task!
    createProfile: NexusGenRootTypes["Profile"]; // Profile!
    createProfileEventSubscription: NexusGenRootTypes["ProfileEventSubscription"]; // ProfileEventSubscription!
    createProfileFieldFileUploadLink: NexusGenRootTypes["ProfileFieldPropertyAndFileWithUploadData"]; // ProfileFieldPropertyAndFileWithUploadData!
    createProfileLinkedPetitionField: NexusGenRootTypes["PetitionField"]; // PetitionField!
    createProfileListView: NexusGenRootTypes["ProfileListView"]; // ProfileListView!
    createProfileRelationship: NexusGenRootTypes["Profile"]; // Profile!
    createProfileType: NexusGenRootTypes["ProfileType"]; // ProfileType!
    createProfileTypeField: NexusGenRootTypes["ProfileTypeField"]; // ProfileTypeField!
    createProfileTypeProcess: NexusGenRootTypes["ProfileTypeProcess"]; // ProfileTypeProcess!
    createProfilesExcelImportTask: NexusGenRootTypes["Task"]; // Task!
    createPublicPetitionLink: NexusGenRootTypes["PublicPetitionLink"]; // PublicPetitionLink!
    createPublicPetitionLinkPrefillData: string; // String!
    createRemovePetitionPermissionMaybeTask: NexusGenRootTypes["MaybeTask"]; // MaybeTask!
    createSignaturitIntegration: NexusGenRootTypes["SignatureOrgIntegration"]; // SignatureOrgIntegration!
    createTag: NexusGenRootTypes["Tag"]; // Tag!
    createTemplateRepliesCsvExportTask: NexusGenRootTypes["Task"]; // Task!
    createTemplateRepliesReportTask: NexusGenRootTypes["Task"]; // Task!
    createTemplateStatsReportTask: NexusGenRootTypes["Task"]; // Task!
    createTemplatesOverviewReportTask: NexusGenRootTypes["Task"]; // Task!
    createUserGroup: NexusGenRootTypes["UserGroup"]; // UserGroup!
    deactivateAccesses: NexusGenRootTypes["PetitionAccess"][]; // [PetitionAccess!]!
    deactivateUser: NexusGenRootTypes["User"][]; // [User!]!
    deleteAzureOpenAiIntegration: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    deleteContacts: NexusGenEnums["Result"]; // Result!
    deleteDowJonesKycIntegration: NexusGenRootTypes["Organization"]; // Organization!
    deleteEventSubscriptionSignatureKeys: NexusGenEnums["Result"]; // Result!
    deleteEventSubscriptions: NexusGenEnums["Result"]; // Result!
    deleteOrganizationPdfDocumentTheme: NexusGenRootTypes["Organization"]; // Organization!
    deletePetitionAttachment: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    deletePetitionComment: NexusGenRootTypes["PetitionFieldOrPetition"]; // PetitionFieldOrPetition!
    deletePetitionField: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    deletePetitionFieldAttachment: NexusGenRootTypes["PetitionField"]; // PetitionField!
    deletePetitionListView: NexusGenRootTypes["User"]; // User!
    deletePetitionReply: NexusGenRootTypes["PetitionField"]; // PetitionField!
    deletePetitionVariable: NexusGenRootTypes["Petition"]; // Petition!
    deletePetitions: NexusGenEnums["Success"]; // Success!
    deleteProfile: NexusGenEnums["Success"]; // Success!
    deleteProfileFieldFile: NexusGenEnums["Result"]; // Result!
    deleteProfileListView: NexusGenRootTypes["User"]; // User!
    deleteProfileType: NexusGenEnums["Success"]; // Success!
    deleteProfileTypeField: NexusGenRootTypes["ProfileType"]; // ProfileType!
    deleteSignatureIntegration: NexusGenEnums["Result"]; // Result!
    deleteTag: NexusGenEnums["Result"]; // Result!
    deleteUserGroup: NexusGenEnums["Result"]; // Result!
    disassociateProfilesFromPetitions: NexusGenEnums["Success"]; // Success!
    dynamicSelectFieldFileDownloadLink: NexusGenRootTypes["FileUploadDownloadLinkResult"]; // FileUploadDownloadLinkResult!
    editProfileTypeProcess: NexusGenRootTypes["ProfileTypeProcess"]; // ProfileTypeProcess!
    enableAutomaticNumberingOnPetitionFields: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    fileUploadReplyDownloadLink: NexusGenRootTypes["FileUploadDownloadLinkResult"]; // FileUploadDownloadLinkResult!
    forceUpdateSignatureOrganizationBrandings: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    generateUserAuthToken: NexusGenRootTypes["GenerateUserAuthTokenResponse"]; // GenerateUserAuthTokenResponse!
    getTaskResultFile: NexusGenRootTypes["TaskResultFile"]; // TaskResultFile!
    importPetitionFromJson: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    inviteUserToOrganization: NexusGenRootTypes["User"]; // User!
    linkFieldGroupToProfileType: NexusGenRootTypes["PetitionField"]; // PetitionField!
    linkPetitionFieldChildren: NexusGenRootTypes["PetitionField"]; // PetitionField!
    loginAs: NexusGenEnums["Result"]; // Result!
    markPetitionListViewAsDefault: NexusGenRootTypes["User"]; // User!
    markProfileListViewAsDefault: NexusGenRootTypes["ProfileListView"]; // ProfileListView!
    markSignatureIntegrationAsDefault: NexusGenRootTypes["IOrgIntegration"]; // IOrgIntegration!
    modifyCurrentUsagePeriod: NexusGenRootTypes["Organization"]; // Organization!
    modifyPetitionCustomProperty: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    movePetitions: NexusGenEnums["Success"]; // Success!
    petitionAttachmentDownloadLink: NexusGenRootTypes["FileUploadDownloadLinkResult"]; // FileUploadDownloadLinkResult!
    petitionAttachmentUploadComplete: NexusGenRootTypes["PetitionAttachment"]; // PetitionAttachment!
    petitionFieldAttachmentDownloadLink: NexusGenRootTypes["FileUploadDownloadLinkResult"]; // FileUploadDownloadLinkResult!
    petitionFieldAttachmentUploadComplete: NexusGenRootTypes["PetitionFieldAttachment"]; // PetitionFieldAttachment!
    pinProfileType: NexusGenRootTypes["ProfileType"]; // ProfileType!
    prefillPetitionFromProfiles: NexusGenRootTypes["Petition"]; // Petition!
    profileExternalSourceDetails: NexusGenRootTypes["ProfileExternalSourceSearchSingleResult"]; // ProfileExternalSourceSearchSingleResult!
    profileExternalSourceSearch: NexusGenRootTypes["ProfileExternalSourceSearchResults"]; // ProfileExternalSourceSearchResults!
    profileFieldFileDownloadLink: NexusGenRootTypes["FileUploadDownloadLinkResult"]; // FileUploadDownloadLinkResult!
    profileFieldFileUploadComplete: NexusGenRootTypes["ProfileFieldFile"][]; // [ProfileFieldFile!]!
    profileImportExcelModelDownloadLink: string; // String!
    publicCheckVerificationCode: NexusGenRootTypes["VerificationCodeCheck"]; // VerificationCodeCheck!
    publicCompletePetition: NexusGenRootTypes["PublicPetition"]; // PublicPetition!
    publicCreateAndSendPetitionFromPublicLink: NexusGenEnums["Result"]; // Result!
    publicCreateFileUploadReply: NexusGenRootTypes["PublicCreateFileUploadReply"]; // PublicCreateFileUploadReply!
    publicCreatePetitionComment: NexusGenRootTypes["PublicPetitionFieldComment"]; // PublicPetitionFieldComment!
    publicCreatePetitionFieldReplies: NexusGenRootTypes["PublicPetitionFieldReply"][]; // [PublicPetitionFieldReply!]!
    publicCreatePrintPdfTask: NexusGenRootTypes["Task"]; // Task!
    publicDelegateAccessToContact: NexusGenRootTypes["PublicPetitionAccess"]; // PublicPetitionAccess!
    publicDeletePetitionComment: NexusGenRootTypes["PublicPetitionFieldOrPublicPetition"]; // PublicPetitionFieldOrPublicPetition!
    publicDeletePetitionFieldReply: NexusGenRootTypes["PublicPetitionField"]; // PublicPetitionField!
    publicFileUploadReplyComplete: NexusGenRootTypes["PublicPetitionFieldReply"]; // PublicPetitionFieldReply!
    publicFileUploadReplyDownloadLink: NexusGenRootTypes["FileUploadDownloadLinkResult"]; // FileUploadDownloadLinkResult!
    publicGetTaskResultFileUrl: string; // String!
    publicMarkPetitionFieldCommentsAsRead: NexusGenRootTypes["PublicPetitionFieldComment"][]; // [PublicPetitionFieldComment!]!
    publicPetitionFieldAttachmentDownloadLink: NexusGenRootTypes["FileUploadDownloadLinkResult"]; // FileUploadDownloadLinkResult!
    publicRemindersOptOut: NexusGenEnums["Result"]; // Result!
    publicResetTempPassword: NexusGenEnums["Result"]; // Result!
    publicRetryAsyncFieldCompletion: NexusGenRootTypes["AsyncFieldCompletionResponse"]; // AsyncFieldCompletionResponse!
    publicSendReminder: NexusGenEnums["Result"]; // Result!
    publicSendVerificationCode: NexusGenRootTypes["VerificationCodeRequest"]; // VerificationCodeRequest!
    publicStartAsyncFieldCompletion: NexusGenRootTypes["AsyncFieldCompletionResponse"]; // AsyncFieldCompletionResponse!
    publicUpdatePetitionComment: NexusGenRootTypes["PublicPetitionFieldComment"]; // PublicPetitionFieldComment!
    publicUpdatePetitionFieldReplies: NexusGenRootTypes["PublicPetitionFieldReply"][]; // [PublicPetitionFieldReply!]!
    reactivateAccesses: NexusGenRootTypes["PetitionAccess"][]; // [PetitionAccess!]!
    removePetitionPassword: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    removeProfileRelationship: NexusGenEnums["Success"]; // Success!
    removeProfileTypeProcess: NexusGenRootTypes["ProfileType"]; // ProfileType!
    removeUsersFromGroup: NexusGenRootTypes["UserGroup"]; // UserGroup!
    renameFolder: NexusGenEnums["Success"]; // Success!
    reopenPetition: NexusGenRootTypes["Petition"]; // Petition!
    reopenProfile: NexusGenRootTypes["Profile"][]; // [Profile!]!
    reorderPetitionAttachments: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    reorderPetitionListViews: NexusGenRootTypes["User"]; // User!
    reorderProfileListViews: NexusGenRootTypes["User"]; // User!
    resendVerificationEmail: NexusGenEnums["Result"]; // Result!
    resetTempPassword: NexusGenEnums["Result"]; // Result!
    resetUserPassword: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    restoreDeletedPetition: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    restoreLogin: NexusGenEnums["Result"]; // Result!
    retryAsyncFieldCompletion: NexusGenRootTypes["AsyncFieldCompletionResponse"]; // AsyncFieldCompletionResponse!
    revokeUserAuthToken: NexusGenEnums["Result"]; // Result!
    scheduleProfileForDeletion: NexusGenRootTypes["Profile"][]; // [Profile!]!
    sendPetition: NexusGenRootTypes["SendPetitionResult"][]; // [SendPetitionResult!]!
    sendPetitionClosedNotification: NexusGenRootTypes["Petition"]; // Petition!
    sendReminders: NexusGenRootTypes["PetitionReminder"][]; // [PetitionReminder!]!
    sendSignatureRequestReminders: NexusGenEnums["Result"]; // Result!
    setUserDelegates: NexusGenRootTypes["User"]; // User!
    shareSignaturitApiKey: NexusGenRootTypes["Organization"]; // Organization!
    signUp: NexusGenRootTypes["User"]; // User!
    signaturitIntegrationShowSecurityStamp: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    signedPetitionDownloadLink: NexusGenRootTypes["FileUploadDownloadLinkResult"]; // FileUploadDownloadLinkResult!
    startAsyncFieldCompletion: NexusGenRootTypes["AsyncFieldCompletionResponse"]; // AsyncFieldCompletionResponse!
    startSignatureRequest: NexusGenRootTypes["PetitionSignatureRequest"]; // PetitionSignatureRequest!
    subscribeToProfile: NexusGenRootTypes["Profile"][]; // [Profile!]!
    switchAutomaticReminders: NexusGenRootTypes["PetitionAccess"][]; // [PetitionAccess!]!
    tagPetition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    transferAdminPermissions: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    transferOrganizationOwnership: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    transferPetitionOwnership: NexusGenRootTypes["PetitionBase"][]; // [PetitionBase!]!
    unarchiveProfileType: NexusGenRootTypes["ProfileType"][]; // [ProfileType!]!
    unlinkPetitionFieldChildren: NexusGenRootTypes["PetitionField"]; // PetitionField!
    unpinProfileType: NexusGenRootTypes["ProfileType"]; // ProfileType!
    unsubscribeFromProfile: NexusGenRootTypes["Profile"][]; // [Profile!]!
    untagPetition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    updateBackgroundCheckEntity: NexusGenEnums["Success"]; // Success!
    updateCompaniesHouseCustomProperties: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    updateContact: NexusGenRootTypes["Contact"]; // Contact!
    updateEinformaCustomProperties: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    updateFeatureFlags: NexusGenRootTypes["Organization"]; // Organization!
    updateFieldPositions: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    updateFileUploadReply: NexusGenRootTypes["FileUploadReplyResponse"]; // FileUploadReplyResponse!
    updateFileUploadReplyComplete: NexusGenRootTypes["PetitionFieldReply"]; // PetitionFieldReply!
    updateLandingTemplateMetadata: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    updateOrganization: NexusGenRootTypes["Organization"]; // Organization!
    updateOrganizationAutoAnonymizePeriod: NexusGenRootTypes["Organization"]; // Organization!
    updateOrganizationBrandTheme: NexusGenRootTypes["Organization"]; // Organization!
    updateOrganizationLogo: NexusGenRootTypes["Organization"]; // Organization!
    updateOrganizationPdfDocumentTheme: NexusGenRootTypes["Organization"]; // Organization!
    updateOrganizationTier: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    updateOrganizationUsageDetails: NexusGenRootTypes["Organization"]; // Organization!
    updateOrganizationUserLimit: NexusGenRootTypes["Organization"]; // Organization!
    updatePetition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    updatePetitionAttachmentType: NexusGenRootTypes["PetitionAttachment"]; // PetitionAttachment!
    updatePetitionComment: NexusGenRootTypes["PetitionFieldComment"]; // PetitionFieldComment!
    updatePetitionEventSubscription: NexusGenRootTypes["PetitionEventSubscription"]; // PetitionEventSubscription!
    updatePetitionField: NexusGenRootTypes["PetitionField"]; // PetitionField!
    updatePetitionFieldAutoSearchConfig: NexusGenRootTypes["PetitionField"]; // PetitionField!
    updatePetitionFieldGroupRelationships: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    updatePetitionFieldReplies: NexusGenRootTypes["PetitionFieldReply"][]; // [PetitionFieldReply!]!
    updatePetitionFieldRepliesStatus: NexusGenRootTypes["PetitionField"]; // PetitionField!
    updatePetitionFieldReplyMetadata: NexusGenRootTypes["PetitionFieldReply"]; // PetitionFieldReply!
    updatePetitionListView: NexusGenRootTypes["PetitionListView"]; // PetitionListView!
    updatePetitionMetadata: NexusGenRootTypes["Petition"]; // Petition!
    updatePetitionPermissionSubscription: NexusGenRootTypes["Petition"]; // Petition!
    updatePetitionRestriction: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    updatePetitionUserNotificationReadStatus: NexusGenRootTypes["PetitionUserNotification"][]; // [PetitionUserNotification!]!
    updatePetitionVariable: NexusGenRootTypes["Petition"]; // Petition!
    updateProfileEventSubscription: NexusGenRootTypes["ProfileEventSubscription"]; // ProfileEventSubscription!
    updateProfileFieldValue: NexusGenRootTypes["Profile"]; // Profile!
    updateProfileListView: NexusGenRootTypes["ProfileListView"]; // ProfileListView!
    updateProfileType: NexusGenRootTypes["ProfileType"]; // ProfileType!
    updateProfileTypeField: NexusGenRootTypes["ProfileTypeField"]; // ProfileTypeField!
    updateProfileTypeFieldPermissions: NexusGenRootTypes["ProfileType"]; // ProfileType!
    updateProfileTypeFieldPositions: NexusGenRootTypes["ProfileType"]; // ProfileType!
    updateProfileTypeProcessPositions: NexusGenRootTypes["ProfileType"]; // ProfileType!
    updatePublicPetitionLink: NexusGenRootTypes["PublicPetitionLink"]; // PublicPetitionLink!
    updatePublicTemplateVisibility: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    updateSignatureRequestMetadata: NexusGenRootTypes["PetitionSignatureRequest"]; // PetitionSignatureRequest!
    updateStandardListDefinitions: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    updateTag: NexusGenRootTypes["Tag"]; // Tag!
    updateTemplateDefaultPermissions: NexusGenRootTypes["PetitionTemplate"]; // PetitionTemplate!
    updateTemplateDocumentTheme: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    updateUser: NexusGenRootTypes["User"]; // User!
    updateUserGroup: NexusGenRootTypes["UserGroup"]; // UserGroup!
    updateUserGroupMembership: NexusGenRootTypes["User"]; // User!
    updateUserGroupPermissions: NexusGenRootTypes["UserGroup"]; // UserGroup!
    updateUserPreferredLocale: NexusGenRootTypes["User"]; // User!
    uploadBulkPetitionSendTaskInputFile: NexusGenScalars["JSONObject"]; // JSONObject!
    uploadDynamicSelectFieldFile: NexusGenRootTypes["PetitionField"]; // PetitionField!
    uploadUserAvatar: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    verifyPublicAccess: NexusGenRootTypes["PublicAccessVerification"]; // PublicAccessVerification!
  };
  OrgIntegration: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    invalidCredentials: boolean; // Boolean!
    isDefault: boolean; // Boolean!
    logoUrl: string | null; // String
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
    usersByEmail: NexusGenRootTypes["UserPagination"]; // UserPagination!
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
    limit: number; // Float!
    period: NexusGenScalars["Duration"]; // Duration!
    periodEndDate: NexusGenScalars["DateTime"] | null; // DateTime
    periodStartDate: NexusGenScalars["DateTime"]; // DateTime!
    used: number; // Float!
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
    automaticNumberingConfig: NexusGenRootTypes["AutomaticNumberingConfig"] | null; // AutomaticNumberingConfig
    closedAt: NexusGenScalars["DateTime"] | null; // DateTime
    closingEmailBody: NexusGenScalars["JSON"] | null; // JSON
    completingMessageBody: NexusGenScalars["JSON"] | null; // JSON
    completingMessageSubject: string | null; // String
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    currentSignatureRequest: NexusGenRootTypes["PetitionSignatureRequest"] | null; // PetitionSignatureRequest
    customLists: NexusGenRootTypes["PetitionCustomList"][]; // [PetitionCustomList!]!
    customProperties: NexusGenScalars["JSONObject"]; // JSONObject!
    deadline: NexusGenScalars["DateTime"] | null; // DateTime
    defaultOnBehalf: NexusGenRootTypes["User"] | null; // User
    effectivePermissions: NexusGenRootTypes["EffectivePetitionUserPermission"][]; // [EffectivePetitionUserPermission!]!
    emailBody: NexusGenScalars["JSON"] | null; // JSON
    emailSubject: string | null; // String
    events: NexusGenRootTypes["PetitionEventPagination"]; // PetitionEventPagination!
    fieldCount: number; // Int!
    fieldRelationships: NexusGenRootTypes["PetitionFieldGroupRelationship"][]; // [PetitionFieldGroupRelationship!]!
    fields: NexusGenRootTypes["PetitionField"][]; // [PetitionField!]!
    fromTemplate: NexusGenRootTypes["PetitionBaseMini"] | null; // PetitionBaseMini
    generalCommentCount: number; // Int!
    generalComments: NexusGenRootTypes["PetitionFieldComment"][]; // [PetitionFieldComment!]!
    id: NexusGenScalars["GID"]; // GID!
    isAnonymized: boolean; // Boolean!
    isCompletingMessageEnabled: boolean; // Boolean!
    isDelegateAccessEnabled: boolean; // Boolean!
    isDocumentGenerationEnabled: boolean; // Boolean!
    isInteractionWithRecipientsEnabled: boolean; // Boolean!
    isRecipientViewContentsHidden: boolean; // Boolean!
    isRestricted: boolean; // Boolean!
    isRestrictedWithPassword: boolean; // Boolean!
    isReviewFlowEnabled: boolean; // Boolean!
    lastActivityAt: NexusGenScalars["DateTime"] | null; // DateTime
    lastChangeAt: NexusGenScalars["DateTime"]; // DateTime!
    lastGeneralComment: NexusGenRootTypes["PetitionFieldComment"] | null; // PetitionFieldComment
    lastRecipientActivityAt: NexusGenScalars["DateTime"] | null; // DateTime
    latestSummaryRequest: NexusGenRootTypes["AiCompletionLog"] | null; // AiCompletionLog
    locale: NexusGenEnums["PetitionLocale"]; // PetitionLocale!
    metadata: NexusGenScalars["JSONObject"]; // JSONObject!
    myEffectivePermission: NexusGenRootTypes["EffectivePetitionUserPermission"] | null; // EffectivePetitionUserPermission
    name: string | null; // String
    organization: NexusGenRootTypes["Organization"]; // Organization!
    owner: NexusGenRootTypes["User"]; // User!
    path: string; // String!
    permissions: NexusGenRootTypes["PetitionPermission"][]; // [PetitionPermission!]!
    profiles: NexusGenRootTypes["Profile"][]; // [Profile!]!
    progress: NexusGenRootTypes["PetitionProgress"]; // PetitionProgress!
    remindersConfig: NexusGenRootTypes["RemindersConfig"] | null; // RemindersConfig
    selectedDocumentTheme: NexusGenRootTypes["OrganizationTheme"]; // OrganizationTheme!
    sentAt: NexusGenScalars["DateTime"] | null; // DateTime
    signatureConfig: NexusGenRootTypes["SignatureConfig"] | null; // SignatureConfig
    signatureRequests: NexusGenRootTypes["PetitionSignatureRequest"][]; // [PetitionSignatureRequest!]!
    skipForwardSecurity: boolean; // Boolean!
    standardListDefinitions: NexusGenRootTypes["StandardListDefinition"][]; // [StandardListDefinition!]!
    status: NexusGenEnums["PetitionStatus"]; // PetitionStatus!
    summaryConfig: NexusGenScalars["JSONObject"] | null; // JSONObject
    tags: NexusGenRootTypes["Tag"][]; // [Tag!]!
    tone: NexusGenEnums["Tone"]; // Tone!
    unreadGeneralCommentCount: number; // Int!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
    variables: NexusGenRootTypes["PetitionVariable"][]; // [PetitionVariable!]!
    variablesResult: NexusGenRootTypes["PetitionVariableResult"][]; // [PetitionVariableResult!]!
  };
  PetitionAccess: {
    // field return type
    contact: NexusGenRootTypes["Contact"] | null; // Contact
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    delegateGranter: NexusGenRootTypes["User"] | null; // User
    granter: NexusGenRootTypes["User"] | null; // User
    id: NexusGenScalars["GID"]; // GID!
    isContactless: boolean; // Boolean!
    isSharedByLink: boolean; // Boolean!
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
  PetitionAssociatedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    profile: NexusGenRootTypes["Profile"] | null; // Profile
    type: NexusGenEnums["ProfileEventType"]; // ProfileEventType!
    user: NexusGenRootTypes["User"] | null; // User
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
    currentSignatureRequest: NexusGenRootTypes["PetitionSignatureRequestMini"] | null; // PetitionSignatureRequestMini
    id: NexusGenScalars["GID"]; // GID!
    isPublicTemplate: boolean | null; // Boolean
    lastActivityAt: NexusGenScalars["DateTime"] | null; // DateTime
    myEffectivePermission: NexusGenRootTypes["EffectivePetitionUserPermission"] | null; // EffectivePetitionUserPermission
    name: string | null; // String
    status: NexusGenEnums["PetitionStatus"] | null; // PetitionStatus
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
    emailBody: string | null; // String
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
  PetitionCustomList: {
    // field return type
    name: string; // String!
    values: string[]; // [String!]!
  };
  PetitionDeletedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
  };
  PetitionDisassociatedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    disassociatedBy: NexusGenRootTypes["UserOrPetitionAccess"] | null; // UserOrPetitionAccess
    id: NexusGenScalars["GID"]; // GID!
    profile: NexusGenRootTypes["Profile"] | null; // Profile
    type: NexusGenEnums["ProfileEventType"]; // ProfileEventType!
    user: NexusGenRootTypes["User"] | null; // User
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
    fromTemplateFields: NexusGenRootTypes["PetitionFieldMini"][] | null; // [PetitionFieldMini!]
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
    children: NexusGenRootTypes["PetitionField"][] | null; // [PetitionField!]
    commentCount: number; // Int!
    comments: NexusGenRootTypes["PetitionFieldComment"][]; // [PetitionFieldComment!]!
    description: string | null; // String
    fromPetitionFieldId: NexusGenScalars["GID"] | null; // GID
    hasCommentsEnabled: boolean; // Boolean!
    id: NexusGenScalars["GID"]; // GID!
    isChild: boolean; // Boolean!
    isFixed: boolean; // Boolean!
    isInternal: boolean; // Boolean!
    isLinkedToProfileType: boolean; // Boolean!
    isLinkedToProfileTypeField: boolean; // Boolean!
    isReadOnly: boolean; // Boolean!
    lastComment: NexusGenRootTypes["PetitionFieldComment"] | null; // PetitionFieldComment
    math: NexusGenScalars["JSONObject"][] | null; // [JSONObject!]
    multiple: boolean; // Boolean!
    optional: boolean; // Boolean!
    options: NexusGenScalars["JSONObject"]; // JSONObject!
    parent: NexusGenRootTypes["PetitionField"] | null; // PetitionField
    petition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    position: number; // Int!
    profileType: NexusGenRootTypes["ProfileType"] | null; // ProfileType
    profileTypeField: NexusGenRootTypes["ProfileTypeField"] | null; // ProfileTypeField
    replies: NexusGenRootTypes["PetitionFieldReply"][]; // [PetitionFieldReply!]!
    requireApproval: boolean; // Boolean!
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
    excerptHtml: string | null; // String
    field: NexusGenRootTypes["PetitionField"] | null; // PetitionField
    id: NexusGenScalars["GID"]; // GID!
    isAnonymized: boolean; // Boolean!
    isEdited: boolean; // Boolean!
    isInternal: boolean; // Boolean!
    isUnread: boolean; // Boolean!
    mentions: NexusGenRootTypes["PetitionFieldCommentMention"][]; // [PetitionFieldCommentMention!]!
    petition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
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
  PetitionFieldGroupChildReply: {
    // field return type
    field: NexusGenRootTypes["PetitionField"]; // PetitionField!
    replies: NexusGenRootTypes["PetitionFieldReply"][]; // [PetitionFieldReply!]!
  };
  PetitionFieldGroupRelationship: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    leftSidePetitionField: NexusGenRootTypes["PetitionField"]; // PetitionField!
    relationshipTypeWithDirection: NexusGenRootTypes["ProfileRelationshipTypeWithDirection"]; // ProfileRelationshipTypeWithDirection!
    rightSidePetitionField: NexusGenRootTypes["PetitionField"]; // PetitionField!
  };
  PetitionFieldMini: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    options: NexusGenScalars["JSONObject"]; // JSONObject!
    title: string | null; // String
    type: NexusGenEnums["PetitionFieldType"]; // PetitionFieldType!
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
    associatedProfile: NexusGenRootTypes["Profile"] | null; // Profile
    children: NexusGenRootTypes["PetitionFieldGroupChildReply"][] | null; // [PetitionFieldGroupChildReply!]
    content: NexusGenScalars["JSONObject"]; // JSONObject!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    field: NexusGenRootTypes["PetitionField"] | null; // PetitionField
    id: NexusGenScalars["GID"]; // GID!
    isAnonymized: boolean; // Boolean!
    lastReviewedAt: NexusGenScalars["DateTime"] | null; // DateTime
    lastReviewedBy: NexusGenRootTypes["User"] | null; // User
    metadata: NexusGenScalars["JSONObject"]; // JSONObject!
    parent: NexusGenRootTypes["PetitionFieldReply"] | null; // PetitionFieldReply
    repliedAt: NexusGenScalars["DateTime"] | null; // DateTime
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
    type: NexusGenEnums["ListViewType"]; // ListViewType!
    user: NexusGenRootTypes["User"]; // User!
  };
  PetitionListViewData: {
    // field return type
    columns: NexusGenEnums["PetitionListViewColumn"][] | null; // [PetitionListViewColumn!]
    fromTemplateId: NexusGenScalars["GID"][] | null; // [GID!]
    path: string; // String!
    search: string | null; // String
    searchIn: NexusGenEnums["PetitionListViewSearchIn"]; // PetitionListViewSearchIn!
    sharedWith: NexusGenRootTypes["PetitionListViewDataSharedWith"] | null; // PetitionListViewDataSharedWith
    signature: NexusGenEnums["PetitionSignatureStatusFilter"][] | null; // [PetitionSignatureStatusFilter!]
    sort: NexusGenRootTypes["PetitionListViewSort"] | null; // PetitionListViewSort
    status: NexusGenEnums["PetitionStatus"][] | null; // [PetitionStatus!]
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
    direction: NexusGenEnums["ListViewSortDirection"]; // ListViewSortDirection!
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
  PetitionPagination: {
    // field return type
    items: NexusGenRootTypes["Petition"][]; // [Petition!]!
    totalCount: number; // Int!
  };
  PetitionProfile: {
    // field return type
    petition: NexusGenRootTypes["Petition"]; // Petition!
    profile: NexusGenRootTypes["Profile"]; // Profile!
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
  PetitionSharingInfo: {
    // field return type
    firstPetitionEffectivePermissions: NexusGenRootTypes["EffectivePetitionUserPermission"][]; // [EffectivePetitionUserPermission!]!
    firstPetitionPermissions: NexusGenRootTypes["PetitionPermission"][]; // [PetitionPermission!]!
    ownedCount: number; // Int!
    ownedOrWriteIds: NexusGenScalars["GID"][]; // [GID!]!
    readPetitions: NexusGenRootTypes["PetitionBase"][]; // [PetitionBase!]!
    totalCount: number; // Int!
  };
  PetitionSignatureRequest: {
    // field return type
    auditTrailFilename: string | null; // String
    cancelReason: string | null; // String
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    environment: NexusGenEnums["SignatureOrgIntegrationEnvironment"]; // SignatureOrgIntegrationEnvironment!
    errorCode: string | null; // String
    errorMessage: string | null; // String
    extraErrorData: NexusGenScalars["JSON"] | null; // JSON
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
  PetitionSignatureRequestMini: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    status: NexusGenEnums["PetitionSignatureRequestStatus"]; // PetitionSignatureRequestStatus!
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
    isPreset: boolean; // Boolean!
    lastName: string | null; // String
  };
  PetitionTaggedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    tags: Array<NexusGenRootTypes["Tag"] | null>; // [Tag]!
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  PetitionTemplate: {
    // field return type
    anonymizeAfterMonths: number | null; // Int
    anonymizePurpose: string | null; // String
    attachmentsList: NexusGenRootTypes["PetitionAttachmentsList"]; // PetitionAttachmentsList!
    automaticNumberingConfig: NexusGenRootTypes["AutomaticNumberingConfig"] | null; // AutomaticNumberingConfig
    backgroundColor: string | null; // String
    categories: string[] | null; // [String!]
    closingEmailBody: NexusGenScalars["JSON"] | null; // JSON
    completingMessageBody: NexusGenScalars["JSON"] | null; // JSON
    completingMessageSubject: string | null; // String
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    customLists: NexusGenRootTypes["PetitionCustomList"][]; // [PetitionCustomList!]!
    customProperties: NexusGenScalars["JSONObject"]; // JSONObject!
    defaultOnBehalf: NexusGenRootTypes["User"] | null; // User
    defaultPath: string; // String!
    defaultPermissions: NexusGenRootTypes["TemplateDefaultPermission"][]; // [TemplateDefaultPermission!]!
    description: NexusGenScalars["JSON"] | null; // JSON
    descriptionHtml: string | null; // String
    effectiveDefaultPermissions: NexusGenRootTypes["EffectivePetitionUserPermission"][]; // [EffectivePetitionUserPermission!]!
    effectivePermissions: NexusGenRootTypes["EffectivePetitionUserPermission"][]; // [EffectivePetitionUserPermission!]!
    emailBody: NexusGenScalars["JSON"] | null; // JSON
    emailSubject: string | null; // String
    fieldCount: number; // Int!
    fieldRelationships: NexusGenRootTypes["PetitionFieldGroupRelationship"][]; // [PetitionFieldGroupRelationship!]!
    fields: NexusGenRootTypes["PetitionField"][]; // [PetitionField!]!
    id: NexusGenScalars["GID"]; // GID!
    imageUrl: string | null; // String
    isAnonymized: boolean; // Boolean!
    isCompletingMessageEnabled: boolean; // Boolean!
    isDelegateAccessEnabled: boolean; // Boolean!
    isDocumentGenerationEnabled: boolean; // Boolean!
    isInteractionWithRecipientsEnabled: boolean; // Boolean!
    isPublic: boolean; // Boolean!
    isRecipientViewContentsHidden: boolean; // Boolean!
    isRestricted: boolean; // Boolean!
    isRestrictedWithPassword: boolean; // Boolean!
    isReviewFlowEnabled: boolean; // Boolean!
    lastActivityAt: NexusGenScalars["DateTime"] | null; // DateTime
    lastChangeAt: NexusGenScalars["DateTime"]; // DateTime!
    lastRecipientActivityAt: NexusGenScalars["DateTime"] | null; // DateTime
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
    standardListDefinitions: NexusGenRootTypes["StandardListDefinition"][]; // [StandardListDefinition!]!
    tags: NexusGenRootTypes["Tag"][]; // [Tag!]!
    tone: NexusGenEnums["Tone"]; // Tone!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
    variables: NexusGenRootTypes["PetitionVariable"][]; // [PetitionVariable!]!
    variablesResult: NexusGenRootTypes["PetitionVariableResult"][]; // [PetitionVariableResult!]!
  };
  PetitionUntaggedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    tags: Array<NexusGenRootTypes["Tag"] | null>; // [Tag]!
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  PetitionUserGroupPermission: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    group: NexusGenRootTypes["UserGroup"]; // UserGroup!
    isSubscribed: boolean; // Boolean!
    permissionType: NexusGenEnums["PetitionPermissionType"]; // PetitionPermissionType!
    petition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  PetitionUserPermission: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    isSubscribed: boolean; // Boolean!
    permissionType: NexusGenEnums["PetitionPermissionType"]; // PetitionPermissionType!
    petition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
    user: NexusGenRootTypes["User"]; // User!
  };
  PetitionVariable: {
    // field return type
    defaultValue: number; // Float!
    name: string; // String!
  };
  PetitionVariableResult: {
    // field return type
    name: string; // String!
    value: number | null; // Float
  };
  Profile: {
    // field return type
    associatedPetitions: NexusGenRootTypes["PetitionPagination"]; // PetitionPagination!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    events: NexusGenRootTypes["ProfileEventPagination"]; // ProfileEventPagination!
    id: NexusGenScalars["GID"]; // GID!
    localizableName: NexusGenScalars["LocalizableUserText"]; // LocalizableUserText!
    name: string; // String!
    permanentDeletionAt: NexusGenScalars["DateTime"] | null; // DateTime
    profileType: NexusGenRootTypes["ProfileType"]; // ProfileType!
    properties: NexusGenRootTypes["ProfileFieldProperty"][]; // [ProfileFieldProperty!]!
    relationships: NexusGenRootTypes["ProfileRelationship"][]; // [ProfileRelationship!]!
    status: NexusGenEnums["ProfileStatus"]; // ProfileStatus!
    subscribers: NexusGenRootTypes["ProfileSubscription"][]; // [ProfileSubscription!]!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  ProfileAnonymizedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    profile: NexusGenRootTypes["Profile"] | null; // Profile
    type: NexusGenEnums["ProfileEventType"]; // ProfileEventType!
  };
  ProfileAssociatedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    profile: NexusGenRootTypes["Profile"] | null; // Profile
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  ProfileClosedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    profile: NexusGenRootTypes["Profile"] | null; // Profile
    type: NexusGenEnums["ProfileEventType"]; // ProfileEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  ProfileCreatedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    profile: NexusGenRootTypes["Profile"] | null; // Profile
    type: NexusGenEnums["ProfileEventType"]; // ProfileEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  ProfileDisassociatedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    disassociatedBy: NexusGenRootTypes["UserOrPetitionAccess"] | null; // UserOrPetitionAccess
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    profile: NexusGenRootTypes["Profile"] | null; // Profile
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  ProfileEventPagination: {
    // field return type
    items: NexusGenRootTypes["ProfileEvent"][]; // [ProfileEvent!]!
    totalCount: number; // Int!
  };
  ProfileEventSubscription: {
    // field return type
    eventTypes: NexusGenEnums["ProfileEventType"][] | null; // [ProfileEventType!]
    eventsUrl: string; // String!
    fromProfileType: NexusGenRootTypes["ProfileType"] | null; // ProfileType
    fromProfileTypeFields: Array<NexusGenRootTypes["ProfileTypeField"] | null> | null; // [ProfileTypeField]
    id: NexusGenScalars["GID"]; // GID!
    isEnabled: boolean; // Boolean!
    isFailing: boolean; // Boolean!
    name: string | null; // String
    signatureKeys: NexusGenRootTypes["EventSubscriptionSignatureKey"][]; // [EventSubscriptionSignatureKey!]!
  };
  ProfileExternalSourceOrgIntegration: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    invalidCredentials: boolean; // Boolean!
    isDefault: boolean; // Boolean!
    logoUrl: string | null; // String
    name: string; // String!
    searchParams: NexusGenRootTypes["ProfileExternalSourceSearchParam"][]; // [ProfileExternalSourceSearchParam!]!
    searchableProfileTypes: NexusGenRootTypes["ProfileType"][]; // [ProfileType!]!
    type: NexusGenEnums["IntegrationType"]; // IntegrationType!
  };
  ProfileExternalSourceSearchMultipleResults: {
    // field return type
    results: NexusGenRootTypes["ProfileExternalSourceSearchMultipleResultsDetail"]; // ProfileExternalSourceSearchMultipleResultsDetail!
    totalCount: number; // Int!
  };
  ProfileExternalSourceSearchMultipleResultsColumn: {
    // field return type
    key: string; // String!
    label: string; // String!
  };
  ProfileExternalSourceSearchMultipleResultsDetail: {
    // field return type
    columns: NexusGenRootTypes["ProfileExternalSourceSearchMultipleResultsColumn"][]; // [ProfileExternalSourceSearchMultipleResultsColumn!]!
    key: string; // String!
    rows: NexusGenScalars["JSONObject"][]; // [JSONObject!]!
  };
  ProfileExternalSourceSearchParam: {
    // field return type
    defaultValue: string | null; // String
    key: string; // String!
    label: string; // String!
    minLength: number | null; // Int
    options: NexusGenRootTypes["ProfileExternalSourceSearchParamOption"][] | null; // [ProfileExternalSourceSearchParamOption!]
    placeholder: string | null; // String
    required: boolean; // Boolean!
    type: NexusGenEnums["ProfileExternalSourceSearchParamType"]; // ProfileExternalSourceSearchParamType!
  };
  ProfileExternalSourceSearchParamOption: {
    // field return type
    label: string; // String!
    value: string; // String!
  };
  ProfileExternalSourceSearchSingleResult: {
    // field return type
    data: NexusGenRootTypes["ProfileExternalSourceSearchSingleResultData"][]; // [ProfileExternalSourceSearchSingleResultData!]!
    id: NexusGenScalars["GID"]; // GID!
    profile: NexusGenRootTypes["Profile"] | null; // Profile
  };
  ProfileExternalSourceSearchSingleResultData: {
    // field return type
    content: NexusGenScalars["JSONObject"] | null; // JSONObject
    profileTypeField: NexusGenRootTypes["ProfileTypeField"]; // ProfileTypeField!
  };
  ProfileFieldExpiryUpdatedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    profile: NexusGenRootTypes["Profile"] | null; // Profile
    type: NexusGenEnums["ProfileEventType"]; // ProfileEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  ProfileFieldFile: {
    // field return type
    anonymizedAt: NexusGenScalars["DateTime"] | null; // DateTime
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    createdBy: NexusGenRootTypes["User"] | null; // User
    expiresAt: NexusGenScalars["DateTime"] | null; // DateTime
    expiryDate: string | null; // String
    field: NexusGenRootTypes["ProfileTypeField"]; // ProfileTypeField!
    file: NexusGenRootTypes["FileUpload"] | null; // FileUpload
    id: NexusGenScalars["GID"]; // GID!
    profile: NexusGenRootTypes["Profile"]; // Profile!
    removedAt: NexusGenScalars["DateTime"] | null; // DateTime
    removedBy: NexusGenRootTypes["User"] | null; // User
  };
  ProfileFieldFileAddedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    profile: NexusGenRootTypes["Profile"] | null; // Profile
    type: NexusGenEnums["ProfileEventType"]; // ProfileEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  ProfileFieldFileRemovedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    profile: NexusGenRootTypes["Profile"] | null; // Profile
    type: NexusGenEnums["ProfileEventType"]; // ProfileEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  ProfileFieldFileWithUploadData: {
    // field return type
    file: NexusGenRootTypes["ProfileFieldFile"]; // ProfileFieldFile!
    presignedPostData: NexusGenRootTypes["AWSPresignedPostData"]; // AWSPresignedPostData!
  };
  ProfileFieldProperty: {
    // field return type
    field: NexusGenRootTypes["ProfileTypeField"]; // ProfileTypeField!
    files: NexusGenRootTypes["ProfileFieldFile"][] | null; // [ProfileFieldFile!]
    profile: NexusGenRootTypes["Profile"]; // Profile!
    value: NexusGenRootTypes["ProfileFieldValue"] | null; // ProfileFieldValue
  };
  ProfileFieldPropertyAndFileWithUploadData: {
    // field return type
    property: NexusGenRootTypes["ProfileFieldProperty"]; // ProfileFieldProperty!
    uploads: NexusGenRootTypes["ProfileFieldFileWithUploadData"][]; // [ProfileFieldFileWithUploadData!]!
  };
  ProfileFieldPropertyPagination: {
    // field return type
    items: NexusGenRootTypes["ProfileFieldProperty"][]; // [ProfileFieldProperty!]!
    totalCount: number; // Int!
  };
  ProfileFieldValue: {
    // field return type
    anonymizedAt: NexusGenScalars["DateTime"] | null; // DateTime
    content: NexusGenScalars["JSONObject"] | null; // JSONObject
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    createdBy: NexusGenRootTypes["User"] | null; // User
    expiresAt: NexusGenScalars["DateTime"] | null; // DateTime
    expiryDate: string | null; // String
    field: NexusGenRootTypes["ProfileTypeField"]; // ProfileTypeField!
    id: NexusGenScalars["GID"]; // GID!
    profile: NexusGenRootTypes["Profile"]; // Profile!
    removedAt: NexusGenScalars["DateTime"] | null; // DateTime
    removedBy: NexusGenRootTypes["User"] | null; // User
  };
  ProfileFieldValueUpdatedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    profile: NexusGenRootTypes["Profile"] | null; // Profile
    type: NexusGenEnums["ProfileEventType"]; // ProfileEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  ProfileListView: {
    // field return type
    data: NexusGenRootTypes["ProfileListViewData"]; // ProfileListViewData!
    id: NexusGenScalars["GID"]; // GID!
    isDefault: boolean; // Boolean!
    name: string; // String!
    profileType: NexusGenRootTypes["ProfileType"]; // ProfileType!
    type: NexusGenEnums["ListViewType"]; // ListViewType!
    user: NexusGenRootTypes["User"]; // User!
  };
  ProfileListViewData: {
    // field return type
    columns: string[] | null; // [String!]
    search: string | null; // String
    sort: NexusGenRootTypes["ProfileListViewSort"] | null; // ProfileListViewSort
    status: NexusGenEnums["ProfileStatus"] | null; // ProfileStatus
    values: NexusGenScalars["JSONObject"] | null; // JSONObject
  };
  ProfileListViewSort: {
    // field return type
    direction: NexusGenEnums["ListViewSortDirection"]; // ListViewSortDirection!
    field: NexusGenEnums["ProfileListViewSortField"]; // ProfileListViewSortField!
  };
  ProfilePagination: {
    // field return type
    items: NexusGenRootTypes["Profile"][]; // [Profile!]!
    totalCount: number; // Int!
  };
  ProfileRelationship: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    leftSideProfile: NexusGenRootTypes["Profile"]; // Profile!
    relationshipType: NexusGenRootTypes["ProfileRelationshipType"]; // ProfileRelationshipType!
    rightSideProfile: NexusGenRootTypes["Profile"]; // Profile!
  };
  ProfileRelationshipCreatedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    profile: NexusGenRootTypes["Profile"] | null; // Profile
    relationship: NexusGenRootTypes["ProfileRelationship"] | null; // ProfileRelationship
    type: NexusGenEnums["ProfileEventType"]; // ProfileEventType!
    user: NexusGenRootTypes["User"]; // User!
  };
  ProfileRelationshipRemovedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    profile: NexusGenRootTypes["Profile"] | null; // Profile
    reason: string; // String!
    type: NexusGenEnums["ProfileEventType"]; // ProfileEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  ProfileRelationshipType: {
    // field return type
    alias: string | null; // String
    allowedLeftRightProfileTypeIds: NexusGenScalars["GID"][]; // [GID!]!
    allowedRightLeftProfileTypeIds: NexusGenScalars["GID"][]; // [GID!]!
    id: NexusGenScalars["GID"]; // GID!
    isReciprocal: boolean; // Boolean!
    leftRightName: NexusGenScalars["LocalizableUserText"]; // LocalizableUserText!
    rightLeftName: NexusGenScalars["LocalizableUserText"]; // LocalizableUserText!
  };
  ProfileRelationshipTypeWithDirection: {
    // field return type
    direction: NexusGenEnums["ProfileRelationshipDirection"]; // ProfileRelationshipDirection!
    profileRelationshipType: NexusGenRootTypes["ProfileRelationshipType"]; // ProfileRelationshipType!
  };
  ProfileReopenedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    profile: NexusGenRootTypes["Profile"] | null; // Profile
    type: NexusGenEnums["ProfileEventType"]; // ProfileEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  ProfileScheduledForDeletionEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    profile: NexusGenRootTypes["Profile"] | null; // Profile
    type: NexusGenEnums["ProfileEventType"]; // ProfileEventType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  ProfileSubscription: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    user: NexusGenRootTypes["User"]; // User!
  };
  ProfileType: {
    // field return type
    archivedAt: NexusGenScalars["DateTime"] | null; // DateTime
    archivedBy: NexusGenRootTypes["User"] | null; // User
    canCreate: boolean; // Boolean!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    fields: NexusGenRootTypes["ProfileTypeField"][]; // [ProfileTypeField!]!
    icon: NexusGenEnums["ProfileTypeIcon"]; // ProfileTypeIcon!
    id: NexusGenScalars["GID"]; // GID!
    isPinned: boolean; // Boolean!
    isStandard: boolean; // Boolean!
    keyProcesses: NexusGenRootTypes["ProfileTypeProcess"][]; // [ProfileTypeProcess!]!
    name: NexusGenScalars["LocalizableUserText"]; // LocalizableUserText!
    pluralName: NexusGenScalars["LocalizableUserText"]; // LocalizableUserText!
    profileNamePattern: string; // String!
    profileNamePatternFields: NexusGenScalars["GID"][]; // [GID!]!
    standardType: NexusGenEnums["ProfileTypeStandardType"] | null; // ProfileTypeStandardType
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  ProfileTypeField: {
    // field return type
    alias: string | null; // String
    defaultPermission: NexusGenEnums["ProfileTypeFieldPermissionType"]; // ProfileTypeFieldPermissionType!
    expiryAlertAheadTime: NexusGenScalars["Duration"] | null; // Duration
    id: NexusGenScalars["GID"]; // GID!
    isExpirable: boolean; // Boolean!
    isStandard: boolean; // Boolean!
    isUsedInProfileName: boolean; // Boolean!
    myPermission: NexusGenEnums["ProfileTypeFieldPermissionType"]; // ProfileTypeFieldPermissionType!
    name: NexusGenScalars["LocalizableUserText"]; // LocalizableUserText!
    options: NexusGenScalars["JSONObject"]; // JSONObject!
    permissions: NexusGenRootTypes["ProfileTypeFieldPermission"][]; // [ProfileTypeFieldPermission!]!
    position: number; // Int!
    profileType: NexusGenRootTypes["ProfileType"]; // ProfileType!
    type: NexusGenEnums["ProfileTypeFieldType"]; // ProfileTypeFieldType!
  };
  ProfileTypeFieldPermission: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    permission: NexusGenEnums["ProfileTypeFieldPermissionType"]; // ProfileTypeFieldPermissionType!
    target: NexusGenRootTypes["UserOrUserGroup"]; // UserOrUserGroup!
  };
  ProfileTypePagination: {
    // field return type
    items: NexusGenRootTypes["ProfileType"][]; // [ProfileType!]!
    totalCount: number; // Int!
  };
  ProfileTypeProcess: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    latestPetition: NexusGenRootTypes["PetitionBaseMini"] | null; // PetitionBaseMini
    name: NexusGenScalars["LocalizableUserText"]; // LocalizableUserText!
    position: number; // Int!
    templates: NexusGenRootTypes["PetitionTemplate"][]; // [PetitionTemplate!]!
  };
  ProfileUpdatedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    profile: NexusGenRootTypes["Profile"] | null; // Profile
    type: NexusGenEnums["ProfileEventType"]; // ProfileEventType!
    user: NexusGenRootTypes["User"] | null; // User
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
    automaticNumberingConfig: NexusGenRootTypes["AutomaticNumberingConfig"] | null; // AutomaticNumberingConfig
    completingMessageBody: string | null; // String
    completingMessageSubject: string | null; // String
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    customLists: NexusGenRootTypes["PetitionCustomList"][]; // [PetitionCustomList!]!
    deadline: NexusGenScalars["DateTime"] | null; // DateTime
    fields: NexusGenRootTypes["PublicPetitionField"][]; // [PublicPetitionField!]!
    generalCommentCount: number; // Int!
    generalComments: NexusGenRootTypes["PublicPetitionFieldComment"][]; // [PublicPetitionFieldComment!]!
    hasUnreadComments: boolean; // Boolean!
    id: NexusGenScalars["GID"]; // GID!
    isCompletingMessageEnabled: boolean; // Boolean!
    isDelegateAccessEnabled: boolean; // Boolean!
    isRecipientViewContentsHidden: boolean; // Boolean!
    lastGeneralComment: NexusGenRootTypes["PublicPetitionFieldComment"] | null; // PublicPetitionFieldComment
    latestSignatureRequest: NexusGenRootTypes["PublicPetitionSignatureRequest"] | null; // PublicPetitionSignatureRequest
    locale: NexusGenEnums["PetitionLocale"]; // PetitionLocale!
    organization: NexusGenRootTypes["PublicOrganization"]; // PublicOrganization!
    progress: NexusGenRootTypes["PublicPetitionFieldProgress"]; // PublicPetitionFieldProgress!
    recipients: NexusGenRootTypes["PublicContact"][]; // [PublicContact!]!
    signatureConfig: NexusGenRootTypes["PublicSignatureConfig"] | null; // PublicSignatureConfig
    signatureStatus: NexusGenEnums["PublicSignatureStatus"] | null; // PublicSignatureStatus
    standardListDefinitions: NexusGenRootTypes["StandardListDefinition"][]; // [StandardListDefinition!]!
    status: NexusGenEnums["PetitionStatus"]; // PetitionStatus!
    tone: NexusGenEnums["Tone"]; // Tone!
    unreadGeneralCommentCount: number; // Int!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
    variables: NexusGenRootTypes["PetitionVariable"][]; // [PetitionVariable!]!
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
    children: NexusGenRootTypes["PublicPetitionField"][] | null; // [PublicPetitionField!]
    commentCount: number; // Int!
    comments: NexusGenRootTypes["PublicPetitionFieldComment"][]; // [PublicPetitionFieldComment!]!
    description: string | null; // String
    hasCommentsEnabled: boolean; // Boolean!
    id: NexusGenScalars["GID"]; // GID!
    isInternal: boolean; // Boolean!
    isReadOnly: boolean; // Boolean!
    lastComment: NexusGenRootTypes["PublicPetitionFieldComment"] | null; // PublicPetitionFieldComment
    math: NexusGenScalars["JSONObject"][] | null; // [JSONObject!]
    multiple: boolean; // Boolean!
    optional: boolean; // Boolean!
    options: NexusGenScalars["JSONObject"]; // JSONObject!
    parent: NexusGenRootTypes["PublicPetitionField"] | null; // PublicPetitionField
    petition: NexusGenRootTypes["PublicPetition"]; // PublicPetition!
    profileType: NexusGenRootTypes["PublicProfileType"] | null; // PublicProfileType
    profileTypeField: NexusGenRootTypes["PublicProfileTypeField"] | null; // PublicProfileTypeField
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
    contentPlainText: string | null; // String
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    excerptHtml: string | null; // String
    field: NexusGenRootTypes["PublicPetitionField"] | null; // PublicPetitionField
    id: NexusGenScalars["GID"]; // GID!
    isAnonymized: boolean; // Boolean!
    isUnread: boolean; // Boolean!
    petition: NexusGenRootTypes["PublicPetition"]; // PublicPetition!
  };
  PublicPetitionFieldGroupChildReply: {
    // field return type
    field: NexusGenRootTypes["PublicPetitionField"]; // PublicPetitionField!
    replies: NexusGenRootTypes["PublicPetitionFieldReply"][]; // [PublicPetitionFieldReply!]!
  };
  PublicPetitionFieldProgress: {
    // field return type
    optional: number; // Int!
    replied: number; // Int!
    total: number; // Int!
  };
  PublicPetitionFieldReply: {
    // field return type
    children: NexusGenRootTypes["PublicPetitionFieldGroupChildReply"][] | null; // [PublicPetitionFieldGroupChildReply!]
    content: NexusGenScalars["JSONObject"]; // JSONObject!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    field: NexusGenRootTypes["PublicPetitionField"]; // PublicPetitionField!
    id: NexusGenScalars["GID"]; // GID!
    isAnonymized: boolean; // Boolean!
    parent: NexusGenRootTypes["PublicPetitionFieldReply"] | null; // PublicPetitionFieldReply
    status: NexusGenEnums["PetitionFieldReplyStatus"]; // PetitionFieldReplyStatus!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  PublicPetitionLink: {
    // field return type
    allowMultiplePetitions: boolean; // Boolean!
    description: string; // String!
    id: NexusGenScalars["GID"]; // GID!
    isActive: boolean; // Boolean!
    owner: NexusGenRootTypes["User"]; // User!
    petitionNamePattern: string | null; // String
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
  PublicPetitionSignatureRequest: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    signerStatus: NexusGenRootTypes["PetitionSignatureRequestSignerStatus"][]; // [PetitionSignatureRequestSignerStatus!]!
    status: NexusGenEnums["PetitionSignatureRequestStatus"]; // PetitionSignatureRequestStatus!
  };
  PublicProfileType: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    profileNamePatternFields: NexusGenScalars["GID"][]; // [GID!]!
  };
  PublicProfileTypeField: {
    // field return type
    alias: string | null; // String
    id: NexusGenScalars["GID"]; // GID!
  };
  PublicPublicPetitionLink: {
    // field return type
    allowMultiplePetitions: boolean; // Boolean!
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
    instructions: string | null; // String
    minSigners: number; // Int!
    review: boolean; // Boolean!
    signers: NexusGenRootTypes["PetitionSigner"][]; // [PetitionSigner!]!
    signingMode: NexusGenEnums["SignatureConfigSigningMode"]; // SignatureConfigSigningMode!
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
    backgroundCheckEntityDetails: NexusGenRootTypes["BackgroundCheckEntityDetails"]; // BackgroundCheckEntityDetails!
    backgroundCheckEntitySearch: NexusGenRootTypes["BackgroundCheckEntitySearch"]; // BackgroundCheckEntitySearch!
    contact: NexusGenRootTypes["Contact"] | null; // Contact
    contacts: NexusGenRootTypes["ContactPagination"]; // ContactPagination!
    contactsByEmail: Array<NexusGenRootTypes["Contact"] | null>; // [Contact]!
    dashboard: NexusGenRootTypes["Dashboard"]; // Dashboard!
    dowJonesKycEntityProfile: NexusGenRootTypes["DowJonesKycEntityProfileResult"]; // DowJonesKycEntityProfileResult!
    dowJonesKycEntitySearch: NexusGenRootTypes["DowJonesKycEntitySearchResultPagination"]; // DowJonesKycEntitySearchResultPagination!
    emailIsAvailable: boolean; // Boolean!
    expiringProfileProperties: NexusGenRootTypes["ProfileFieldPropertyPagination"]; // ProfileFieldPropertyPagination!
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
    petitionInformation: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    petitions: NexusGenRootTypes["PetitionBaseOrFolderPagination"]; // PetitionBaseOrFolderPagination!
    petitionsById: Array<NexusGenRootTypes["PetitionBase"] | null>; // [PetitionBase]!
    petitionsSharingInfo: NexusGenRootTypes["PetitionSharingInfo"]; // PetitionSharingInfo!
    profile: NexusGenRootTypes["Profile"]; // Profile!
    profileEvents: NexusGenRootTypes["ProfileEvent"][]; // [ProfileEvent!]!
    profileRelationshipTypes: NexusGenRootTypes["ProfileRelationshipType"][]; // [ProfileRelationshipType!]!
    profileRelationshipTypesWithDirection: NexusGenRootTypes["ProfileRelationshipTypeWithDirection"][]; // [ProfileRelationshipTypeWithDirection!]!
    profileType: NexusGenRootTypes["ProfileType"]; // ProfileType!
    profileTypes: NexusGenRootTypes["ProfileTypePagination"]; // ProfileTypePagination!
    profiles: NexusGenRootTypes["ProfilePagination"]; // ProfilePagination!
    publicLicenseCode: NexusGenRootTypes["PublicLicenseCode"] | null; // PublicLicenseCode
    publicOrg: NexusGenRootTypes["PublicOrganization"] | null; // PublicOrganization
    publicPetitionField: NexusGenRootTypes["PublicPetitionField"]; // PublicPetitionField!
    publicPetitionLinkBySlug: NexusGenRootTypes["PublicPublicPetitionLink"] | null; // PublicPublicPetitionLink
    publicTask: NexusGenRootTypes["Task"]; // Task!
    publicTemplateCategories: string[]; // [String!]!
    realMe: NexusGenRootTypes["User"]; // User!
    remindersOptOut: NexusGenRootTypes["PublicRemindersOptOut"] | null; // PublicRemindersOptOut
    standardListDefinition: NexusGenRootTypes["StandardListDefinition"]; // StandardListDefinition!
    subscriptions: NexusGenRootTypes["EventSubscription"][]; // [EventSubscription!]!
    tags: NexusGenRootTypes["TagPagination"]; // TagPagination!
    tagsByName: NexusGenRootTypes["TagPagination"]; // TagPagination!
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
    errorMessage: string | null; // String
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
    instructions: string | null; // String
    integration: NexusGenRootTypes["SignatureOrgIntegration"] | null; // SignatureOrgIntegration
    message: string | null; // String
    minSigners: number; // Int!
    review: boolean; // Boolean!
    signers: Array<NexusGenRootTypes["PetitionSigner"] | null>; // [PetitionSigner]!
    signingMode: NexusGenEnums["SignatureConfigSigningMode"]; // SignatureConfigSigningMode!
    timezone: string; // String!
    title: string | null; // String
    useCustomDocument: boolean; // Boolean!
  };
  SignatureDeliveredEvent: {
    // field return type
    bouncedAt: NexusGenScalars["DateTime"] | null; // DateTime
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    deliveredAt: NexusGenScalars["DateTime"] | null; // DateTime
    id: NexusGenScalars["GID"]; // GID!
    openedAt: NexusGenScalars["DateTime"] | null; // DateTime
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    signature: NexusGenRootTypes["PetitionSignatureRequest"]; // PetitionSignatureRequest!
    signer: NexusGenRootTypes["PetitionSigner"] | null; // PetitionSigner
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
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
    logoUrl: string | null; // String
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
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    signature: NexusGenRootTypes["PetitionSignatureRequest"]; // PetitionSignatureRequest!
    type: NexusGenEnums["PetitionEventType"]; // PetitionEventType!
  };
  StandardListDefinition: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    listName: string; // String!
    listType: NexusGenEnums["StandardListDefinitionListType"]; // StandardListDefinitionListType!
    listVersion: NexusGenScalars["Date"] | null; // Date
    source: string; // String!
    sourceUrl: string | null; // String
    title: NexusGenScalars["LocalizableUserText"]; // LocalizableUserText!
    values: NexusGenRootTypes["StandardListDefinitionValue"][]; // [StandardListDefinitionValue!]!
    versionFormat: NexusGenScalars["JSONObject"]; // JSONObject!
    versionUrl: string | null; // String
  };
  StandardListDefinitionValue: {
    // field return type
    key: string; // String!
    label: string | null; // String
    prefix: string | null; // String
    suffix: string | null; // String
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
    dashboards: NexusGenRootTypes["Dashboard"][]; // [Dashboard!]!
    delegateOf: NexusGenRootTypes["User"][]; // [User!]!
    delegates: NexusGenRootTypes["User"][]; // [User!]!
    email: string; // String!
    firstName: string | null; // String
    fullName: string | null; // String
    hasFeatureFlag: boolean; // Boolean!
    id: NexusGenScalars["GID"]; // GID!
    initials: string | null; // String
    isMe: boolean; // Boolean!
    isOrgOwner: boolean; // Boolean!
    isSsoUser: boolean; // Boolean!
    isSuperAdmin: boolean; // Boolean!
    lastActiveAt: NexusGenScalars["DateTime"] | null; // DateTime
    lastName: string | null; // String
    notifications: NexusGenRootTypes["UserNotifications_Pagination"]; // UserNotifications_Pagination!
    organization: NexusGenRootTypes["Organization"]; // Organization!
    organizations: NexusGenRootTypes["Organization"][]; // [Organization!]!
    permissions: string[]; // [String!]!
    petitionListViews: NexusGenRootTypes["PetitionListView"][]; // [PetitionListView!]!
    pinnedProfileTypes: NexusGenRootTypes["ProfileType"][]; // [ProfileType!]!
    preferredLocale: NexusGenEnums["UserLocale"]; // UserLocale!
    profileListViews: NexusGenRootTypes["ProfileListView"][]; // [ProfileListView!]!
    status: NexusGenEnums["UserStatus"]; // UserStatus!
    tokens: NexusGenRootTypes["UserAuthenticationToken"][]; // [UserAuthenticationToken!]!
    unreadNotificationCount: number; // Int!
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
    hasPermissions: boolean; // Boolean!
    id: NexusGenScalars["GID"]; // GID!
    imMember: boolean; // Boolean!
    initials: string; // String!
    localizableName: NexusGenScalars["LocalizableUserText"]; // LocalizableUserText!
    memberCount: number; // Int!
    members: NexusGenRootTypes["UserGroupMember"][]; // [UserGroupMember!]!
    name: string; // String!
    permissions: NexusGenRootTypes["UserGroupPermission"][]; // [UserGroupPermission!]!
    type: NexusGenEnums["UserGroupType"]; // UserGroupType!
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
  UserGroupPermission: {
    // field return type
    effect: NexusGenEnums["UserGroupPermissionEffect"]; // UserGroupPermissionEffect!
    id: NexusGenScalars["GID"]; // GID!
    name: string; // String!
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
  BackgroundCheckEntityDetails: {
    // field return type
    createdAt: NexusGenScalars["DateTime"] | null; // DateTime
    id: string; // String!
    name: string; // String!
    type: string; // String!
  };
  BackgroundCheckEntitySearchSchema: {
    // field return type
    id: string; // String!
    name: string; // String!
    type: string; // String!
  };
  CreatedAt: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  DashboardModule: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    size: NexusGenEnums["DashboardModuleSize"]; // DashboardModuleSize!
    title: string | null; // String
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
  EventSubscription: {
    // field return type
    eventsUrl: string; // String!
    id: NexusGenScalars["GID"]; // GID!
    isEnabled: boolean; // Boolean!
    isFailing: boolean; // Boolean!
    name: string | null; // String
    signatureKeys: NexusGenRootTypes["EventSubscriptionSignatureKey"][]; // [EventSubscriptionSignatureKey!]!
  };
  IOrgIntegration: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    invalidCredentials: boolean; // Boolean!
    isDefault: boolean; // Boolean!
    logoUrl: string | null; // String
    name: string; // String!
    type: NexusGenEnums["IntegrationType"]; // IntegrationType!
  };
  ListView: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    isDefault: boolean; // Boolean!
    name: string; // String!
    type: NexusGenEnums["ListViewType"]; // ListViewType!
    user: NexusGenRootTypes["User"]; // User!
  };
  PetitionBase: {
    // field return type
    anonymizeAfterMonths: number | null; // Int
    anonymizePurpose: string | null; // String
    attachmentsList: NexusGenRootTypes["PetitionAttachmentsList"]; // PetitionAttachmentsList!
    automaticNumberingConfig: NexusGenRootTypes["AutomaticNumberingConfig"] | null; // AutomaticNumberingConfig
    closingEmailBody: NexusGenScalars["JSON"] | null; // JSON
    completingMessageBody: NexusGenScalars["JSON"] | null; // JSON
    completingMessageSubject: string | null; // String
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    customLists: NexusGenRootTypes["PetitionCustomList"][]; // [PetitionCustomList!]!
    customProperties: NexusGenScalars["JSONObject"]; // JSONObject!
    defaultOnBehalf: NexusGenRootTypes["User"] | null; // User
    effectivePermissions: NexusGenRootTypes["EffectivePetitionUserPermission"][]; // [EffectivePetitionUserPermission!]!
    emailBody: NexusGenScalars["JSON"] | null; // JSON
    emailSubject: string | null; // String
    fieldCount: number; // Int!
    fieldRelationships: NexusGenRootTypes["PetitionFieldGroupRelationship"][]; // [PetitionFieldGroupRelationship!]!
    fields: NexusGenRootTypes["PetitionField"][]; // [PetitionField!]!
    id: NexusGenScalars["GID"]; // GID!
    isAnonymized: boolean; // Boolean!
    isCompletingMessageEnabled: boolean; // Boolean!
    isDelegateAccessEnabled: boolean; // Boolean!
    isDocumentGenerationEnabled: boolean; // Boolean!
    isInteractionWithRecipientsEnabled: boolean; // Boolean!
    isRecipientViewContentsHidden: boolean; // Boolean!
    isRestricted: boolean; // Boolean!
    isRestrictedWithPassword: boolean; // Boolean!
    isReviewFlowEnabled: boolean; // Boolean!
    lastActivityAt: NexusGenScalars["DateTime"] | null; // DateTime
    lastChangeAt: NexusGenScalars["DateTime"]; // DateTime!
    lastRecipientActivityAt: NexusGenScalars["DateTime"] | null; // DateTime
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
    standardListDefinitions: NexusGenRootTypes["StandardListDefinition"][]; // [StandardListDefinition!]!
    tags: NexusGenRootTypes["Tag"][]; // [Tag!]!
    tone: NexusGenEnums["Tone"]; // Tone!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
    variables: NexusGenRootTypes["PetitionVariable"][]; // [PetitionVariable!]!
    variablesResult: NexusGenRootTypes["PetitionVariableResult"][]; // [PetitionVariableResult!]!
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
    petition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  PetitionUserNotification: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    isRead: boolean; // Boolean!
    petition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
  };
  ProfileEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    data: NexusGenScalars["JSONObject"]; // JSONObject!
    id: NexusGenScalars["GID"]; // GID!
    profile: NexusGenRootTypes["Profile"] | null; // Profile
    type: NexusGenEnums["ProfileEventType"]; // ProfileEventType!
  };
  ProfileFieldResponse: {
    // field return type
    anonymizedAt: NexusGenScalars["DateTime"] | null; // DateTime
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    createdBy: NexusGenRootTypes["User"] | null; // User
    expiresAt: NexusGenScalars["DateTime"] | null; // DateTime
    expiryDate: string | null; // String
    field: NexusGenRootTypes["ProfileTypeField"]; // ProfileTypeField!
    profile: NexusGenRootTypes["Profile"]; // Profile!
    removedAt: NexusGenScalars["DateTime"] | null; // DateTime
    removedBy: NexusGenRootTypes["User"] | null; // User
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
  AiCompletionLog: {
    // field return type name
    completion: "String";
    createdAt: "DateTime";
    id: "GID";
    status: "AiCompletionLogStatus";
    updatedAt: "DateTime";
  };
  AsyncFieldCompletionResponse: {
    // field return type name
    type: "String";
    url: "String";
  };
  AutomaticNumberingConfig: {
    // field return type name
    numberingType: "AutomaticNumberingType";
  };
  BackgroundCheckEntityDetailsCompany: {
    // field return type name
    createdAt: "DateTime";
    id: "String";
    name: "String";
    properties: "BackgroundCheckEntityDetailsCompanyProperties";
    type: "String";
  };
  BackgroundCheckEntityDetailsCompanyProperties: {
    // field return type name
    address: "String";
    alias: "String";
    dateOfRegistration: "String";
    jurisdiction: "String";
    name: "String";
    relationships: "BackgroundCheckEntityDetailsRelationship";
    sanctions: "BackgroundCheckEntityDetailsSanction";
    topics: "String";
  };
  BackgroundCheckEntityDetailsPerson: {
    // field return type name
    createdAt: "DateTime";
    id: "String";
    name: "String";
    properties: "BackgroundCheckEntityDetailsPersonProperties";
    type: "String";
  };
  BackgroundCheckEntityDetailsPersonProperties: {
    // field return type name
    alias: "String";
    birthPlace: "String";
    country: "String";
    countryOfBirth: "String";
    dateOfBirth: "String";
    education: "String";
    ethnicity: "String";
    gender: "String";
    name: "String";
    nationality: "String";
    position: "String";
    relationships: "BackgroundCheckEntityDetailsRelationship";
    religion: "String";
    sanctions: "BackgroundCheckEntityDetailsSanction";
    status: "String";
    topics: "String";
  };
  BackgroundCheckEntityDetailsRelationship: {
    // field return type name
    id: "String";
    properties: "BackgroundCheckEntityDetailsRelationshipProperties";
    type: "String";
  };
  BackgroundCheckEntityDetailsRelationshipProperties: {
    // field return type name
    endDate: "String";
    entityA: "BackgroundCheckEntityDetails";
    entityB: "BackgroundCheckEntityDetails";
    relationship: "String";
    startDate: "String";
  };
  BackgroundCheckEntityDetailsSanction: {
    // field return type name
    id: "String";
    properties: "BackgroundCheckEntityDetailsSanctionProperties";
    type: "String";
  };
  BackgroundCheckEntityDetailsSanctionProperties: {
    // field return type name
    authority: "String";
    endDate: "String";
    program: "String";
    sourceUrl: "String";
    startDate: "String";
  };
  BackgroundCheckEntitySearch: {
    // field return type name
    createdAt: "DateTime";
    items: "BackgroundCheckEntitySearchSchema";
    totalCount: "Int";
  };
  BackgroundCheckEntitySearchCompany: {
    // field return type name
    id: "String";
    name: "String";
    properties: "BackgroundCheckEntitySearchCompanyProperties";
    type: "String";
  };
  BackgroundCheckEntitySearchCompanyProperties: {
    // field return type name
    incorporationDate: "String";
    jurisdiction: "String";
    topics: "String";
  };
  BackgroundCheckEntitySearchPerson: {
    // field return type name
    id: "String";
    name: "String";
    properties: "BackgroundCheckEntitySearchPersonProperties";
    type: "String";
  };
  BackgroundCheckEntitySearchPersonProperties: {
    // field return type name
    birthDate: "String";
    country: "String";
    gender: "String";
    topics: "String";
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
    isGeneral: "Boolean";
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
    isGeneral: "Boolean";
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
    isGeneral: "Boolean";
    isInternal: "Boolean";
    petition: "Petition";
    type: "PetitionEventType";
  };
  ConnectionMetadata: {
    // field return type name
    browserName: "String";
    browserVersion: "String";
    country: "String";
    deviceType: "String";
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
  ContactlessAccessUsedEvent: {
    // field return type name
    access: "PetitionAccess";
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    petition: "Petition";
    type: "PetitionEventType";
  };
  Dashboard: {
    // field return type name
    id: "GID";
    isDefault: "Boolean";
    isRefreshing: "Boolean";
    lastRefreshAt: "DateTime";
    modules: "DashboardModule";
    name: "String";
  };
  DashboardCreateParallelButtonModule: {
    // field return type name
    id: "GID";
    settings: "DashboardCreateParallelButtonModuleSettings";
    size: "DashboardModuleSize";
    title: "String";
  };
  DashboardCreateParallelButtonModuleSettings: {
    // field return type name
    label: "String";
    template: "PetitionBaseMini";
  };
  DashboardNumberModuleResult: {
    // field return type name
    value: "Int";
  };
  DashboardParallelsNumberModule: {
    // field return type name
    id: "GID";
    result: "DashboardNumberModuleResult";
    size: "DashboardModuleSize";
    title: "String";
  };
  DashboardParallelsPieChartModule: {
    // field return type name
    id: "GID";
    result: "DashboardPieChartModuleResult";
    settings: "DashboardParallelsPieChartModuleSettings";
    size: "DashboardModuleSize";
    title: "String";
  };
  DashboardParallelsPieChartModuleSettings: {
    // field return type name
    colors: "String";
    graphicType: "DashboardPieChartModuleSettingsType";
    labels: "String";
  };
  DashboardParallelsRatioModule: {
    // field return type name
    id: "GID";
    result: "DashboardRatioModuleResult";
    settings: "DashboardParallelsRatioModuleSettings";
    size: "DashboardModuleSize";
    title: "String";
  };
  DashboardParallelsRatioModuleSettings: {
    // field return type name
    graphicType: "DashboardRatioModuleSettingsType";
  };
  DashboardPieChartModuleResult: {
    // field return type name
    isIncongruent: "Boolean";
    value: "Int";
  };
  DashboardProfilesNumberModule: {
    // field return type name
    id: "GID";
    result: "DashboardNumberModuleResult";
    size: "DashboardModuleSize";
    title: "String";
  };
  DashboardProfilesPieChartModule: {
    // field return type name
    id: "GID";
    result: "DashboardPieChartModuleResult";
    settings: "DashboardProfilesPieChartModuleSettings";
    size: "DashboardModuleSize";
    title: "String";
  };
  DashboardProfilesPieChartModuleSettings: {
    // field return type name
    colors: "String";
    graphicType: "DashboardPieChartModuleSettingsType";
    labels: "String";
  };
  DashboardProfilesRatioModule: {
    // field return type name
    id: "GID";
    result: "DashboardRatioModuleResult";
    settings: "DashboardProfilesRatioModuleSettings";
    size: "DashboardModuleSize";
    title: "String";
  };
  DashboardProfilesRatioModuleSettings: {
    // field return type name
    graphicType: "DashboardRatioModuleSettingsType";
  };
  DashboardRatioModuleResult: {
    // field return type name
    isIncongruent: "Boolean";
    value: "Int";
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
    children: "LandingTemplateField";
    id: "GID";
    title: "String";
    type: "PetitionFieldType";
  };
  LandingTemplatePagination: {
    // field return type name
    items: "LandingTemplate";
    totalCount: "Int";
  };
  MaybeTask: {
    // field return type name
    status: "MaybeTaskStatus";
    task: "Task";
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
    addUsersToUserGroup: "UserGroup";
    anonymizePetition: "SupportMethodResponse";
    approveOrRejectPetitionFieldReplies: "Petition";
    archiveFieldGroupReplyIntoProfile: "PetitionFieldReply";
    archiveProfileType: "ProfileType";
    associateProfileToPetition: "PetitionProfile";
    bulkCreateContacts: "BulkCreateContactsReturnType";
    bulkCreatePetitionReplies: "Petition";
    cancelScheduledMessage: "PetitionMessage";
    cancelSignatureRequest: "PetitionSignatureRequest";
    changeOrganization: "Result";
    changePassword: "ChangePasswordResult";
    changePetitionFieldType: "PetitionField";
    clonePetitionField: "PetitionField";
    clonePetitions: "PetitionBase";
    cloneProfileType: "ProfileType";
    cloneUserGroups: "UserGroup";
    closePetition: "Petition";
    closePetitionsFromTemplate: "SupportMethodResponse";
    closeProfile: "Profile";
    completePetition: "Petition";
    completeProfileFromExternalSource: "Profile";
    copyBackgroundCheckReplyToProfileFieldValue: "ProfileFieldValue";
    copyFileReplyToProfileFieldFile: "ProfileFieldFile";
    createAddPetitionPermissionMaybeTask: "MaybeTask";
    createAzureOpenAiIntegration: "SupportMethodResponse";
    createBackgroundCheckProfilePdfTask: "Task";
    createBankflipDocumentProcessingIntegration: "SupportMethodResponse";
    createBankflipIdVerificationIntegration: "SupportMethodResponse";
    createBulkPetitionSendTask: "Task";
    createCompaniesHouseProfileExternalSourceIntegration: "SupportMethodResponse";
    createContact: "Contact";
    createContactlessPetitionAccess: "PetitionAccess";
    createCustomSignatureDocumentUploadLink: "JSONObject";
    createDowJonesKycIntegration: "OrgIntegration";
    createDowJonesKycReply: "PetitionFieldReply";
    createDowJonesProfileDownloadTask: "Task";
    createEInformaProfileExternalSourceIntegration: "SupportMethodResponse";
    createEditPetitionPermissionMaybeTask: "MaybeTask";
    createEventSubscriptionSignatureKey: "EventSubscriptionSignatureKey";
    createExportExcelTask: "Task";
    createExportRepliesTask: "Task";
    createFieldGroupRepliesFromProfiles: "PetitionField";
    createFieldGroupReplyFromProfile: "PetitionFieldReply";
    createFileExportTask: "Task";
    createFileUploadReply: "FileUploadReplyResponse";
    createFileUploadReplyComplete: "PetitionFieldReply";
    createIManageFileExportIntegration: "SupportMethodResponse";
    createOrganization: "Organization";
    createOrganizationPdfDocumentTheme: "Organization";
    createPetition: "PetitionBase";
    createPetitionAttachmentUploadLink: "PetitionAttachmentUploadData";
    createPetitionComment: "PetitionFieldComment";
    createPetitionEventSubscription: "PetitionEventSubscription";
    createPetitionField: "PetitionField";
    createPetitionFieldAttachmentUploadLink: "PetitionFieldAttachmentUploadData";
    createPetitionFieldReplies: "PetitionFieldReply";
    createPetitionFromProfile: "Petition";
    createPetitionListView: "PetitionListView";
    createPetitionSummaryTask: "Task";
    createPetitionVariable: "Petition";
    createPrintPdfTask: "Task";
    createProfile: "Profile";
    createProfileEventSubscription: "ProfileEventSubscription";
    createProfileFieldFileUploadLink: "ProfileFieldPropertyAndFileWithUploadData";
    createProfileLinkedPetitionField: "PetitionField";
    createProfileListView: "ProfileListView";
    createProfileRelationship: "Profile";
    createProfileType: "ProfileType";
    createProfileTypeField: "ProfileTypeField";
    createProfileTypeProcess: "ProfileTypeProcess";
    createProfilesExcelImportTask: "Task";
    createPublicPetitionLink: "PublicPetitionLink";
    createPublicPetitionLinkPrefillData: "String";
    createRemovePetitionPermissionMaybeTask: "MaybeTask";
    createSignaturitIntegration: "SignatureOrgIntegration";
    createTag: "Tag";
    createTemplateRepliesCsvExportTask: "Task";
    createTemplateRepliesReportTask: "Task";
    createTemplateStatsReportTask: "Task";
    createTemplatesOverviewReportTask: "Task";
    createUserGroup: "UserGroup";
    deactivateAccesses: "PetitionAccess";
    deactivateUser: "User";
    deleteAzureOpenAiIntegration: "SupportMethodResponse";
    deleteContacts: "Result";
    deleteDowJonesKycIntegration: "Organization";
    deleteEventSubscriptionSignatureKeys: "Result";
    deleteEventSubscriptions: "Result";
    deleteOrganizationPdfDocumentTheme: "Organization";
    deletePetitionAttachment: "PetitionBase";
    deletePetitionComment: "PetitionFieldOrPetition";
    deletePetitionField: "PetitionBase";
    deletePetitionFieldAttachment: "PetitionField";
    deletePetitionListView: "User";
    deletePetitionReply: "PetitionField";
    deletePetitionVariable: "Petition";
    deletePetitions: "Success";
    deleteProfile: "Success";
    deleteProfileFieldFile: "Result";
    deleteProfileListView: "User";
    deleteProfileType: "Success";
    deleteProfileTypeField: "ProfileType";
    deleteSignatureIntegration: "Result";
    deleteTag: "Result";
    deleteUserGroup: "Result";
    disassociateProfilesFromPetitions: "Success";
    dynamicSelectFieldFileDownloadLink: "FileUploadDownloadLinkResult";
    editProfileTypeProcess: "ProfileTypeProcess";
    enableAutomaticNumberingOnPetitionFields: "PetitionBase";
    fileUploadReplyDownloadLink: "FileUploadDownloadLinkResult";
    forceUpdateSignatureOrganizationBrandings: "SupportMethodResponse";
    generateUserAuthToken: "GenerateUserAuthTokenResponse";
    getTaskResultFile: "TaskResultFile";
    importPetitionFromJson: "SupportMethodResponse";
    inviteUserToOrganization: "User";
    linkFieldGroupToProfileType: "PetitionField";
    linkPetitionFieldChildren: "PetitionField";
    loginAs: "Result";
    markPetitionListViewAsDefault: "User";
    markProfileListViewAsDefault: "ProfileListView";
    markSignatureIntegrationAsDefault: "IOrgIntegration";
    modifyCurrentUsagePeriod: "Organization";
    modifyPetitionCustomProperty: "PetitionBase";
    movePetitions: "Success";
    petitionAttachmentDownloadLink: "FileUploadDownloadLinkResult";
    petitionAttachmentUploadComplete: "PetitionAttachment";
    petitionFieldAttachmentDownloadLink: "FileUploadDownloadLinkResult";
    petitionFieldAttachmentUploadComplete: "PetitionFieldAttachment";
    pinProfileType: "ProfileType";
    prefillPetitionFromProfiles: "Petition";
    profileExternalSourceDetails: "ProfileExternalSourceSearchSingleResult";
    profileExternalSourceSearch: "ProfileExternalSourceSearchResults";
    profileFieldFileDownloadLink: "FileUploadDownloadLinkResult";
    profileFieldFileUploadComplete: "ProfileFieldFile";
    profileImportExcelModelDownloadLink: "String";
    publicCheckVerificationCode: "VerificationCodeCheck";
    publicCompletePetition: "PublicPetition";
    publicCreateAndSendPetitionFromPublicLink: "Result";
    publicCreateFileUploadReply: "PublicCreateFileUploadReply";
    publicCreatePetitionComment: "PublicPetitionFieldComment";
    publicCreatePetitionFieldReplies: "PublicPetitionFieldReply";
    publicCreatePrintPdfTask: "Task";
    publicDelegateAccessToContact: "PublicPetitionAccess";
    publicDeletePetitionComment: "PublicPetitionFieldOrPublicPetition";
    publicDeletePetitionFieldReply: "PublicPetitionField";
    publicFileUploadReplyComplete: "PublicPetitionFieldReply";
    publicFileUploadReplyDownloadLink: "FileUploadDownloadLinkResult";
    publicGetTaskResultFileUrl: "String";
    publicMarkPetitionFieldCommentsAsRead: "PublicPetitionFieldComment";
    publicPetitionFieldAttachmentDownloadLink: "FileUploadDownloadLinkResult";
    publicRemindersOptOut: "Result";
    publicResetTempPassword: "Result";
    publicRetryAsyncFieldCompletion: "AsyncFieldCompletionResponse";
    publicSendReminder: "Result";
    publicSendVerificationCode: "VerificationCodeRequest";
    publicStartAsyncFieldCompletion: "AsyncFieldCompletionResponse";
    publicUpdatePetitionComment: "PublicPetitionFieldComment";
    publicUpdatePetitionFieldReplies: "PublicPetitionFieldReply";
    reactivateAccesses: "PetitionAccess";
    removePetitionPassword: "SupportMethodResponse";
    removeProfileRelationship: "Success";
    removeProfileTypeProcess: "ProfileType";
    removeUsersFromGroup: "UserGroup";
    renameFolder: "Success";
    reopenPetition: "Petition";
    reopenProfile: "Profile";
    reorderPetitionAttachments: "PetitionBase";
    reorderPetitionListViews: "User";
    reorderProfileListViews: "User";
    resendVerificationEmail: "Result";
    resetTempPassword: "Result";
    resetUserPassword: "SupportMethodResponse";
    restoreDeletedPetition: "SupportMethodResponse";
    restoreLogin: "Result";
    retryAsyncFieldCompletion: "AsyncFieldCompletionResponse";
    revokeUserAuthToken: "Result";
    scheduleProfileForDeletion: "Profile";
    sendPetition: "SendPetitionResult";
    sendPetitionClosedNotification: "Petition";
    sendReminders: "PetitionReminder";
    sendSignatureRequestReminders: "Result";
    setUserDelegates: "User";
    shareSignaturitApiKey: "Organization";
    signUp: "User";
    signaturitIntegrationShowSecurityStamp: "SupportMethodResponse";
    signedPetitionDownloadLink: "FileUploadDownloadLinkResult";
    startAsyncFieldCompletion: "AsyncFieldCompletionResponse";
    startSignatureRequest: "PetitionSignatureRequest";
    subscribeToProfile: "Profile";
    switchAutomaticReminders: "PetitionAccess";
    tagPetition: "PetitionBase";
    transferAdminPermissions: "SupportMethodResponse";
    transferOrganizationOwnership: "SupportMethodResponse";
    transferPetitionOwnership: "PetitionBase";
    unarchiveProfileType: "ProfileType";
    unlinkPetitionFieldChildren: "PetitionField";
    unpinProfileType: "ProfileType";
    unsubscribeFromProfile: "Profile";
    untagPetition: "PetitionBase";
    updateBackgroundCheckEntity: "Success";
    updateCompaniesHouseCustomProperties: "SupportMethodResponse";
    updateContact: "Contact";
    updateEinformaCustomProperties: "SupportMethodResponse";
    updateFeatureFlags: "Organization";
    updateFieldPositions: "PetitionBase";
    updateFileUploadReply: "FileUploadReplyResponse";
    updateFileUploadReplyComplete: "PetitionFieldReply";
    updateLandingTemplateMetadata: "SupportMethodResponse";
    updateOrganization: "Organization";
    updateOrganizationAutoAnonymizePeriod: "Organization";
    updateOrganizationBrandTheme: "Organization";
    updateOrganizationLogo: "Organization";
    updateOrganizationPdfDocumentTheme: "Organization";
    updateOrganizationTier: "SupportMethodResponse";
    updateOrganizationUsageDetails: "Organization";
    updateOrganizationUserLimit: "Organization";
    updatePetition: "PetitionBase";
    updatePetitionAttachmentType: "PetitionAttachment";
    updatePetitionComment: "PetitionFieldComment";
    updatePetitionEventSubscription: "PetitionEventSubscription";
    updatePetitionField: "PetitionField";
    updatePetitionFieldAutoSearchConfig: "PetitionField";
    updatePetitionFieldGroupRelationships: "PetitionBase";
    updatePetitionFieldReplies: "PetitionFieldReply";
    updatePetitionFieldRepliesStatus: "PetitionField";
    updatePetitionFieldReplyMetadata: "PetitionFieldReply";
    updatePetitionListView: "PetitionListView";
    updatePetitionMetadata: "Petition";
    updatePetitionPermissionSubscription: "Petition";
    updatePetitionRestriction: "PetitionBase";
    updatePetitionUserNotificationReadStatus: "PetitionUserNotification";
    updatePetitionVariable: "Petition";
    updateProfileEventSubscription: "ProfileEventSubscription";
    updateProfileFieldValue: "Profile";
    updateProfileListView: "ProfileListView";
    updateProfileType: "ProfileType";
    updateProfileTypeField: "ProfileTypeField";
    updateProfileTypeFieldPermissions: "ProfileType";
    updateProfileTypeFieldPositions: "ProfileType";
    updateProfileTypeProcessPositions: "ProfileType";
    updatePublicPetitionLink: "PublicPetitionLink";
    updatePublicTemplateVisibility: "SupportMethodResponse";
    updateSignatureRequestMetadata: "PetitionSignatureRequest";
    updateStandardListDefinitions: "SupportMethodResponse";
    updateTag: "Tag";
    updateTemplateDefaultPermissions: "PetitionTemplate";
    updateTemplateDocumentTheme: "PetitionBase";
    updateUser: "User";
    updateUserGroup: "UserGroup";
    updateUserGroupMembership: "User";
    updateUserGroupPermissions: "UserGroup";
    updateUserPreferredLocale: "User";
    uploadBulkPetitionSendTaskInputFile: "JSONObject";
    uploadDynamicSelectFieldFile: "PetitionField";
    uploadUserAvatar: "SupportMethodResponse";
    verifyPublicAccess: "PublicAccessVerification";
  };
  OrgIntegration: {
    // field return type name
    id: "GID";
    invalidCredentials: "Boolean";
    isDefault: "Boolean";
    logoUrl: "String";
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
    usersByEmail: "UserPagination";
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
    limit: "Float";
    period: "Duration";
    periodEndDate: "DateTime";
    periodStartDate: "DateTime";
    used: "Float";
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
    automaticNumberingConfig: "AutomaticNumberingConfig";
    closedAt: "DateTime";
    closingEmailBody: "JSON";
    completingMessageBody: "JSON";
    completingMessageSubject: "String";
    createdAt: "DateTime";
    currentSignatureRequest: "PetitionSignatureRequest";
    customLists: "PetitionCustomList";
    customProperties: "JSONObject";
    deadline: "DateTime";
    defaultOnBehalf: "User";
    effectivePermissions: "EffectivePetitionUserPermission";
    emailBody: "JSON";
    emailSubject: "String";
    events: "PetitionEventPagination";
    fieldCount: "Int";
    fieldRelationships: "PetitionFieldGroupRelationship";
    fields: "PetitionField";
    fromTemplate: "PetitionBaseMini";
    generalCommentCount: "Int";
    generalComments: "PetitionFieldComment";
    id: "GID";
    isAnonymized: "Boolean";
    isCompletingMessageEnabled: "Boolean";
    isDelegateAccessEnabled: "Boolean";
    isDocumentGenerationEnabled: "Boolean";
    isInteractionWithRecipientsEnabled: "Boolean";
    isRecipientViewContentsHidden: "Boolean";
    isRestricted: "Boolean";
    isRestrictedWithPassword: "Boolean";
    isReviewFlowEnabled: "Boolean";
    lastActivityAt: "DateTime";
    lastChangeAt: "DateTime";
    lastGeneralComment: "PetitionFieldComment";
    lastRecipientActivityAt: "DateTime";
    latestSummaryRequest: "AiCompletionLog";
    locale: "PetitionLocale";
    metadata: "JSONObject";
    myEffectivePermission: "EffectivePetitionUserPermission";
    name: "String";
    organization: "Organization";
    owner: "User";
    path: "String";
    permissions: "PetitionPermission";
    profiles: "Profile";
    progress: "PetitionProgress";
    remindersConfig: "RemindersConfig";
    selectedDocumentTheme: "OrganizationTheme";
    sentAt: "DateTime";
    signatureConfig: "SignatureConfig";
    signatureRequests: "PetitionSignatureRequest";
    skipForwardSecurity: "Boolean";
    standardListDefinitions: "StandardListDefinition";
    status: "PetitionStatus";
    summaryConfig: "JSONObject";
    tags: "Tag";
    tone: "Tone";
    unreadGeneralCommentCount: "Int";
    updatedAt: "DateTime";
    variables: "PetitionVariable";
    variablesResult: "PetitionVariableResult";
  };
  PetitionAccess: {
    // field return type name
    contact: "Contact";
    createdAt: "DateTime";
    delegateGranter: "User";
    granter: "User";
    id: "GID";
    isContactless: "Boolean";
    isSharedByLink: "Boolean";
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
  PetitionAssociatedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    profile: "Profile";
    type: "ProfileEventType";
    user: "User";
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
    currentSignatureRequest: "PetitionSignatureRequestMini";
    id: "GID";
    isPublicTemplate: "Boolean";
    lastActivityAt: "DateTime";
    myEffectivePermission: "EffectivePetitionUserPermission";
    name: "String";
    status: "PetitionStatus";
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
    emailBody: "String";
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
  PetitionCustomList: {
    // field return type name
    name: "String";
    values: "String";
  };
  PetitionDeletedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    petition: "Petition";
    type: "PetitionEventType";
  };
  PetitionDisassociatedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    disassociatedBy: "UserOrPetitionAccess";
    id: "GID";
    profile: "Profile";
    type: "ProfileEventType";
    user: "User";
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
    fromTemplateFields: "PetitionFieldMini";
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
    children: "PetitionField";
    commentCount: "Int";
    comments: "PetitionFieldComment";
    description: "String";
    fromPetitionFieldId: "GID";
    hasCommentsEnabled: "Boolean";
    id: "GID";
    isChild: "Boolean";
    isFixed: "Boolean";
    isInternal: "Boolean";
    isLinkedToProfileType: "Boolean";
    isLinkedToProfileTypeField: "Boolean";
    isReadOnly: "Boolean";
    lastComment: "PetitionFieldComment";
    math: "JSONObject";
    multiple: "Boolean";
    optional: "Boolean";
    options: "JSONObject";
    parent: "PetitionField";
    petition: "PetitionBase";
    position: "Int";
    profileType: "ProfileType";
    profileTypeField: "ProfileTypeField";
    replies: "PetitionFieldReply";
    requireApproval: "Boolean";
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
    excerptHtml: "String";
    field: "PetitionField";
    id: "GID";
    isAnonymized: "Boolean";
    isEdited: "Boolean";
    isInternal: "Boolean";
    isUnread: "Boolean";
    mentions: "PetitionFieldCommentMention";
    petition: "PetitionBase";
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
  PetitionFieldGroupChildReply: {
    // field return type name
    field: "PetitionField";
    replies: "PetitionFieldReply";
  };
  PetitionFieldGroupRelationship: {
    // field return type name
    id: "GID";
    leftSidePetitionField: "PetitionField";
    relationshipTypeWithDirection: "ProfileRelationshipTypeWithDirection";
    rightSidePetitionField: "PetitionField";
  };
  PetitionFieldMini: {
    // field return type name
    id: "GID";
    options: "JSONObject";
    title: "String";
    type: "PetitionFieldType";
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
    associatedProfile: "Profile";
    children: "PetitionFieldGroupChildReply";
    content: "JSONObject";
    createdAt: "DateTime";
    field: "PetitionField";
    id: "GID";
    isAnonymized: "Boolean";
    lastReviewedAt: "DateTime";
    lastReviewedBy: "User";
    metadata: "JSONObject";
    parent: "PetitionFieldReply";
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
    type: "ListViewType";
    user: "User";
  };
  PetitionListViewData: {
    // field return type name
    columns: "PetitionListViewColumn";
    fromTemplateId: "GID";
    path: "String";
    search: "String";
    searchIn: "PetitionListViewSearchIn";
    sharedWith: "PetitionListViewDataSharedWith";
    signature: "PetitionSignatureStatusFilter";
    sort: "PetitionListViewSort";
    status: "PetitionStatus";
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
    direction: "ListViewSortDirection";
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
  PetitionPagination: {
    // field return type name
    items: "Petition";
    totalCount: "Int";
  };
  PetitionProfile: {
    // field return type name
    petition: "Petition";
    profile: "Profile";
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
  PetitionSharingInfo: {
    // field return type name
    firstPetitionEffectivePermissions: "EffectivePetitionUserPermission";
    firstPetitionPermissions: "PetitionPermission";
    ownedCount: "Int";
    ownedOrWriteIds: "GID";
    readPetitions: "PetitionBase";
    totalCount: "Int";
  };
  PetitionSignatureRequest: {
    // field return type name
    auditTrailFilename: "String";
    cancelReason: "String";
    createdAt: "DateTime";
    environment: "SignatureOrgIntegrationEnvironment";
    errorCode: "String";
    errorMessage: "String";
    extraErrorData: "JSON";
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
  PetitionSignatureRequestMini: {
    // field return type name
    id: "GID";
    status: "PetitionSignatureRequestStatus";
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
    isPreset: "Boolean";
    lastName: "String";
  };
  PetitionTaggedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    petition: "Petition";
    tags: "Tag";
    type: "PetitionEventType";
    user: "User";
  };
  PetitionTemplate: {
    // field return type name
    anonymizeAfterMonths: "Int";
    anonymizePurpose: "String";
    attachmentsList: "PetitionAttachmentsList";
    automaticNumberingConfig: "AutomaticNumberingConfig";
    backgroundColor: "String";
    categories: "String";
    closingEmailBody: "JSON";
    completingMessageBody: "JSON";
    completingMessageSubject: "String";
    createdAt: "DateTime";
    customLists: "PetitionCustomList";
    customProperties: "JSONObject";
    defaultOnBehalf: "User";
    defaultPath: "String";
    defaultPermissions: "TemplateDefaultPermission";
    description: "JSON";
    descriptionHtml: "String";
    effectiveDefaultPermissions: "EffectivePetitionUserPermission";
    effectivePermissions: "EffectivePetitionUserPermission";
    emailBody: "JSON";
    emailSubject: "String";
    fieldCount: "Int";
    fieldRelationships: "PetitionFieldGroupRelationship";
    fields: "PetitionField";
    id: "GID";
    imageUrl: "String";
    isAnonymized: "Boolean";
    isCompletingMessageEnabled: "Boolean";
    isDelegateAccessEnabled: "Boolean";
    isDocumentGenerationEnabled: "Boolean";
    isInteractionWithRecipientsEnabled: "Boolean";
    isPublic: "Boolean";
    isRecipientViewContentsHidden: "Boolean";
    isRestricted: "Boolean";
    isRestrictedWithPassword: "Boolean";
    isReviewFlowEnabled: "Boolean";
    lastActivityAt: "DateTime";
    lastChangeAt: "DateTime";
    lastRecipientActivityAt: "DateTime";
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
    standardListDefinitions: "StandardListDefinition";
    tags: "Tag";
    tone: "Tone";
    updatedAt: "DateTime";
    variables: "PetitionVariable";
    variablesResult: "PetitionVariableResult";
  };
  PetitionUntaggedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    petition: "Petition";
    tags: "Tag";
    type: "PetitionEventType";
    user: "User";
  };
  PetitionUserGroupPermission: {
    // field return type name
    createdAt: "DateTime";
    group: "UserGroup";
    isSubscribed: "Boolean";
    permissionType: "PetitionPermissionType";
    petition: "PetitionBase";
    updatedAt: "DateTime";
  };
  PetitionUserPermission: {
    // field return type name
    createdAt: "DateTime";
    isSubscribed: "Boolean";
    permissionType: "PetitionPermissionType";
    petition: "PetitionBase";
    updatedAt: "DateTime";
    user: "User";
  };
  PetitionVariable: {
    // field return type name
    defaultValue: "Float";
    name: "String";
  };
  PetitionVariableResult: {
    // field return type name
    name: "String";
    value: "Float";
  };
  Profile: {
    // field return type name
    associatedPetitions: "PetitionPagination";
    createdAt: "DateTime";
    events: "ProfileEventPagination";
    id: "GID";
    localizableName: "LocalizableUserText";
    name: "String";
    permanentDeletionAt: "DateTime";
    profileType: "ProfileType";
    properties: "ProfileFieldProperty";
    relationships: "ProfileRelationship";
    status: "ProfileStatus";
    subscribers: "ProfileSubscription";
    updatedAt: "DateTime";
  };
  ProfileAnonymizedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    profile: "Profile";
    type: "ProfileEventType";
  };
  ProfileAssociatedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    petition: "Petition";
    profile: "Profile";
    type: "PetitionEventType";
    user: "User";
  };
  ProfileClosedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    profile: "Profile";
    type: "ProfileEventType";
    user: "User";
  };
  ProfileCreatedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    profile: "Profile";
    type: "ProfileEventType";
    user: "User";
  };
  ProfileDisassociatedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    disassociatedBy: "UserOrPetitionAccess";
    id: "GID";
    petition: "Petition";
    profile: "Profile";
    type: "PetitionEventType";
    user: "User";
  };
  ProfileEventPagination: {
    // field return type name
    items: "ProfileEvent";
    totalCount: "Int";
  };
  ProfileEventSubscription: {
    // field return type name
    eventTypes: "ProfileEventType";
    eventsUrl: "String";
    fromProfileType: "ProfileType";
    fromProfileTypeFields: "ProfileTypeField";
    id: "GID";
    isEnabled: "Boolean";
    isFailing: "Boolean";
    name: "String";
    signatureKeys: "EventSubscriptionSignatureKey";
  };
  ProfileExternalSourceOrgIntegration: {
    // field return type name
    id: "GID";
    invalidCredentials: "Boolean";
    isDefault: "Boolean";
    logoUrl: "String";
    name: "String";
    searchParams: "ProfileExternalSourceSearchParam";
    searchableProfileTypes: "ProfileType";
    type: "IntegrationType";
  };
  ProfileExternalSourceSearchMultipleResults: {
    // field return type name
    results: "ProfileExternalSourceSearchMultipleResultsDetail";
    totalCount: "Int";
  };
  ProfileExternalSourceSearchMultipleResultsColumn: {
    // field return type name
    key: "String";
    label: "String";
  };
  ProfileExternalSourceSearchMultipleResultsDetail: {
    // field return type name
    columns: "ProfileExternalSourceSearchMultipleResultsColumn";
    key: "String";
    rows: "JSONObject";
  };
  ProfileExternalSourceSearchParam: {
    // field return type name
    defaultValue: "String";
    key: "String";
    label: "String";
    minLength: "Int";
    options: "ProfileExternalSourceSearchParamOption";
    placeholder: "String";
    required: "Boolean";
    type: "ProfileExternalSourceSearchParamType";
  };
  ProfileExternalSourceSearchParamOption: {
    // field return type name
    label: "String";
    value: "String";
  };
  ProfileExternalSourceSearchSingleResult: {
    // field return type name
    data: "ProfileExternalSourceSearchSingleResultData";
    id: "GID";
    profile: "Profile";
  };
  ProfileExternalSourceSearchSingleResultData: {
    // field return type name
    content: "JSONObject";
    profileTypeField: "ProfileTypeField";
  };
  ProfileFieldExpiryUpdatedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    profile: "Profile";
    type: "ProfileEventType";
    user: "User";
  };
  ProfileFieldFile: {
    // field return type name
    anonymizedAt: "DateTime";
    createdAt: "DateTime";
    createdBy: "User";
    expiresAt: "DateTime";
    expiryDate: "String";
    field: "ProfileTypeField";
    file: "FileUpload";
    id: "GID";
    profile: "Profile";
    removedAt: "DateTime";
    removedBy: "User";
  };
  ProfileFieldFileAddedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    profile: "Profile";
    type: "ProfileEventType";
    user: "User";
  };
  ProfileFieldFileRemovedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    profile: "Profile";
    type: "ProfileEventType";
    user: "User";
  };
  ProfileFieldFileWithUploadData: {
    // field return type name
    file: "ProfileFieldFile";
    presignedPostData: "AWSPresignedPostData";
  };
  ProfileFieldProperty: {
    // field return type name
    field: "ProfileTypeField";
    files: "ProfileFieldFile";
    profile: "Profile";
    value: "ProfileFieldValue";
  };
  ProfileFieldPropertyAndFileWithUploadData: {
    // field return type name
    property: "ProfileFieldProperty";
    uploads: "ProfileFieldFileWithUploadData";
  };
  ProfileFieldPropertyPagination: {
    // field return type name
    items: "ProfileFieldProperty";
    totalCount: "Int";
  };
  ProfileFieldValue: {
    // field return type name
    anonymizedAt: "DateTime";
    content: "JSONObject";
    createdAt: "DateTime";
    createdBy: "User";
    expiresAt: "DateTime";
    expiryDate: "String";
    field: "ProfileTypeField";
    id: "GID";
    profile: "Profile";
    removedAt: "DateTime";
    removedBy: "User";
  };
  ProfileFieldValueUpdatedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    profile: "Profile";
    type: "ProfileEventType";
    user: "User";
  };
  ProfileListView: {
    // field return type name
    data: "ProfileListViewData";
    id: "GID";
    isDefault: "Boolean";
    name: "String";
    profileType: "ProfileType";
    type: "ListViewType";
    user: "User";
  };
  ProfileListViewData: {
    // field return type name
    columns: "String";
    search: "String";
    sort: "ProfileListViewSort";
    status: "ProfileStatus";
    values: "JSONObject";
  };
  ProfileListViewSort: {
    // field return type name
    direction: "ListViewSortDirection";
    field: "ProfileListViewSortField";
  };
  ProfilePagination: {
    // field return type name
    items: "Profile";
    totalCount: "Int";
  };
  ProfileRelationship: {
    // field return type name
    id: "GID";
    leftSideProfile: "Profile";
    relationshipType: "ProfileRelationshipType";
    rightSideProfile: "Profile";
  };
  ProfileRelationshipCreatedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    profile: "Profile";
    relationship: "ProfileRelationship";
    type: "ProfileEventType";
    user: "User";
  };
  ProfileRelationshipRemovedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    profile: "Profile";
    reason: "String";
    type: "ProfileEventType";
    user: "User";
  };
  ProfileRelationshipType: {
    // field return type name
    alias: "String";
    allowedLeftRightProfileTypeIds: "GID";
    allowedRightLeftProfileTypeIds: "GID";
    id: "GID";
    isReciprocal: "Boolean";
    leftRightName: "LocalizableUserText";
    rightLeftName: "LocalizableUserText";
  };
  ProfileRelationshipTypeWithDirection: {
    // field return type name
    direction: "ProfileRelationshipDirection";
    profileRelationshipType: "ProfileRelationshipType";
  };
  ProfileReopenedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    profile: "Profile";
    type: "ProfileEventType";
    user: "User";
  };
  ProfileScheduledForDeletionEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    profile: "Profile";
    type: "ProfileEventType";
    user: "User";
  };
  ProfileSubscription: {
    // field return type name
    id: "GID";
    user: "User";
  };
  ProfileType: {
    // field return type name
    archivedAt: "DateTime";
    archivedBy: "User";
    canCreate: "Boolean";
    createdAt: "DateTime";
    fields: "ProfileTypeField";
    icon: "ProfileTypeIcon";
    id: "GID";
    isPinned: "Boolean";
    isStandard: "Boolean";
    keyProcesses: "ProfileTypeProcess";
    name: "LocalizableUserText";
    pluralName: "LocalizableUserText";
    profileNamePattern: "String";
    profileNamePatternFields: "GID";
    standardType: "ProfileTypeStandardType";
    updatedAt: "DateTime";
  };
  ProfileTypeField: {
    // field return type name
    alias: "String";
    defaultPermission: "ProfileTypeFieldPermissionType";
    expiryAlertAheadTime: "Duration";
    id: "GID";
    isExpirable: "Boolean";
    isStandard: "Boolean";
    isUsedInProfileName: "Boolean";
    myPermission: "ProfileTypeFieldPermissionType";
    name: "LocalizableUserText";
    options: "JSONObject";
    permissions: "ProfileTypeFieldPermission";
    position: "Int";
    profileType: "ProfileType";
    type: "ProfileTypeFieldType";
  };
  ProfileTypeFieldPermission: {
    // field return type name
    id: "GID";
    permission: "ProfileTypeFieldPermissionType";
    target: "UserOrUserGroup";
  };
  ProfileTypePagination: {
    // field return type name
    items: "ProfileType";
    totalCount: "Int";
  };
  ProfileTypeProcess: {
    // field return type name
    id: "GID";
    latestPetition: "PetitionBaseMini";
    name: "LocalizableUserText";
    position: "Int";
    templates: "PetitionTemplate";
  };
  ProfileUpdatedEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    profile: "Profile";
    type: "ProfileEventType";
    user: "User";
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
    automaticNumberingConfig: "AutomaticNumberingConfig";
    completingMessageBody: "String";
    completingMessageSubject: "String";
    createdAt: "DateTime";
    customLists: "PetitionCustomList";
    deadline: "DateTime";
    fields: "PublicPetitionField";
    generalCommentCount: "Int";
    generalComments: "PublicPetitionFieldComment";
    hasUnreadComments: "Boolean";
    id: "GID";
    isCompletingMessageEnabled: "Boolean";
    isDelegateAccessEnabled: "Boolean";
    isRecipientViewContentsHidden: "Boolean";
    lastGeneralComment: "PublicPetitionFieldComment";
    latestSignatureRequest: "PublicPetitionSignatureRequest";
    locale: "PetitionLocale";
    organization: "PublicOrganization";
    progress: "PublicPetitionFieldProgress";
    recipients: "PublicContact";
    signatureConfig: "PublicSignatureConfig";
    signatureStatus: "PublicSignatureStatus";
    standardListDefinitions: "StandardListDefinition";
    status: "PetitionStatus";
    tone: "Tone";
    unreadGeneralCommentCount: "Int";
    updatedAt: "DateTime";
    variables: "PetitionVariable";
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
    children: "PublicPetitionField";
    commentCount: "Int";
    comments: "PublicPetitionFieldComment";
    description: "String";
    hasCommentsEnabled: "Boolean";
    id: "GID";
    isInternal: "Boolean";
    isReadOnly: "Boolean";
    lastComment: "PublicPetitionFieldComment";
    math: "JSONObject";
    multiple: "Boolean";
    optional: "Boolean";
    options: "JSONObject";
    parent: "PublicPetitionField";
    petition: "PublicPetition";
    profileType: "PublicProfileType";
    profileTypeField: "PublicProfileTypeField";
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
    contentPlainText: "String";
    createdAt: "DateTime";
    excerptHtml: "String";
    field: "PublicPetitionField";
    id: "GID";
    isAnonymized: "Boolean";
    isUnread: "Boolean";
    petition: "PublicPetition";
  };
  PublicPetitionFieldGroupChildReply: {
    // field return type name
    field: "PublicPetitionField";
    replies: "PublicPetitionFieldReply";
  };
  PublicPetitionFieldProgress: {
    // field return type name
    optional: "Int";
    replied: "Int";
    total: "Int";
  };
  PublicPetitionFieldReply: {
    // field return type name
    children: "PublicPetitionFieldGroupChildReply";
    content: "JSONObject";
    createdAt: "DateTime";
    field: "PublicPetitionField";
    id: "GID";
    isAnonymized: "Boolean";
    parent: "PublicPetitionFieldReply";
    status: "PetitionFieldReplyStatus";
    updatedAt: "DateTime";
  };
  PublicPetitionLink: {
    // field return type name
    allowMultiplePetitions: "Boolean";
    description: "String";
    id: "GID";
    isActive: "Boolean";
    owner: "User";
    petitionNamePattern: "String";
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
  PublicPetitionSignatureRequest: {
    // field return type name
    id: "GID";
    signerStatus: "PetitionSignatureRequestSignerStatus";
    status: "PetitionSignatureRequestStatus";
  };
  PublicProfileType: {
    // field return type name
    id: "GID";
    profileNamePatternFields: "GID";
  };
  PublicProfileTypeField: {
    // field return type name
    alias: "String";
    id: "GID";
  };
  PublicPublicPetitionLink: {
    // field return type name
    allowMultiplePetitions: "Boolean";
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
    instructions: "String";
    minSigners: "Int";
    review: "Boolean";
    signers: "PetitionSigner";
    signingMode: "SignatureConfigSigningMode";
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
    backgroundCheckEntityDetails: "BackgroundCheckEntityDetails";
    backgroundCheckEntitySearch: "BackgroundCheckEntitySearch";
    contact: "Contact";
    contacts: "ContactPagination";
    contactsByEmail: "Contact";
    dashboard: "Dashboard";
    dowJonesKycEntityProfile: "DowJonesKycEntityProfileResult";
    dowJonesKycEntitySearch: "DowJonesKycEntitySearchResultPagination";
    emailIsAvailable: "Boolean";
    expiringProfileProperties: "ProfileFieldPropertyPagination";
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
    petitionInformation: "SupportMethodResponse";
    petitions: "PetitionBaseOrFolderPagination";
    petitionsById: "PetitionBase";
    petitionsSharingInfo: "PetitionSharingInfo";
    profile: "Profile";
    profileEvents: "ProfileEvent";
    profileRelationshipTypes: "ProfileRelationshipType";
    profileRelationshipTypesWithDirection: "ProfileRelationshipTypeWithDirection";
    profileType: "ProfileType";
    profileTypes: "ProfileTypePagination";
    profiles: "ProfilePagination";
    publicLicenseCode: "PublicLicenseCode";
    publicOrg: "PublicOrganization";
    publicPetitionField: "PublicPetitionField";
    publicPetitionLinkBySlug: "PublicPublicPetitionLink";
    publicTask: "Task";
    publicTemplateCategories: "String";
    realMe: "User";
    remindersOptOut: "PublicRemindersOptOut";
    standardListDefinition: "StandardListDefinition";
    subscriptions: "EventSubscription";
    tags: "TagPagination";
    tagsByName: "TagPagination";
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
    errorMessage: "String";
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
    instructions: "String";
    integration: "SignatureOrgIntegration";
    message: "String";
    minSigners: "Int";
    review: "Boolean";
    signers: "PetitionSigner";
    signingMode: "SignatureConfigSigningMode";
    timezone: "String";
    title: "String";
    useCustomDocument: "Boolean";
  };
  SignatureDeliveredEvent: {
    // field return type name
    bouncedAt: "DateTime";
    createdAt: "DateTime";
    data: "JSONObject";
    deliveredAt: "DateTime";
    id: "GID";
    openedAt: "DateTime";
    petition: "Petition";
    signature: "PetitionSignatureRequest";
    signer: "PetitionSigner";
    type: "PetitionEventType";
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
    logoUrl: "String";
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
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    petition: "Petition";
    signature: "PetitionSignatureRequest";
    type: "PetitionEventType";
  };
  StandardListDefinition: {
    // field return type name
    id: "GID";
    listName: "String";
    listType: "StandardListDefinitionListType";
    listVersion: "Date";
    source: "String";
    sourceUrl: "String";
    title: "LocalizableUserText";
    values: "StandardListDefinitionValue";
    versionFormat: "JSONObject";
    versionUrl: "String";
  };
  StandardListDefinitionValue: {
    // field return type name
    key: "String";
    label: "String";
    prefix: "String";
    suffix: "String";
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
    dashboards: "Dashboard";
    delegateOf: "User";
    delegates: "User";
    email: "String";
    firstName: "String";
    fullName: "String";
    hasFeatureFlag: "Boolean";
    id: "GID";
    initials: "String";
    isMe: "Boolean";
    isOrgOwner: "Boolean";
    isSsoUser: "Boolean";
    isSuperAdmin: "Boolean";
    lastActiveAt: "DateTime";
    lastName: "String";
    notifications: "UserNotifications_Pagination";
    organization: "Organization";
    organizations: "Organization";
    permissions: "String";
    petitionListViews: "PetitionListView";
    pinnedProfileTypes: "ProfileType";
    preferredLocale: "UserLocale";
    profileListViews: "ProfileListView";
    status: "UserStatus";
    tokens: "UserAuthenticationToken";
    unreadNotificationCount: "Int";
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
    hasPermissions: "Boolean";
    id: "GID";
    imMember: "Boolean";
    initials: "String";
    localizableName: "LocalizableUserText";
    memberCount: "Int";
    members: "UserGroupMember";
    name: "String";
    permissions: "UserGroupPermission";
    type: "UserGroupType";
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
  UserGroupPermission: {
    // field return type name
    effect: "UserGroupPermissionEffect";
    id: "GID";
    name: "String";
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
  BackgroundCheckEntityDetails: {
    // field return type name
    createdAt: "DateTime";
    id: "String";
    name: "String";
    type: "String";
  };
  BackgroundCheckEntitySearchSchema: {
    // field return type name
    id: "String";
    name: "String";
    type: "String";
  };
  CreatedAt: {
    // field return type name
    createdAt: "DateTime";
  };
  DashboardModule: {
    // field return type name
    id: "GID";
    size: "DashboardModuleSize";
    title: "String";
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
  EventSubscription: {
    // field return type name
    eventsUrl: "String";
    id: "GID";
    isEnabled: "Boolean";
    isFailing: "Boolean";
    name: "String";
    signatureKeys: "EventSubscriptionSignatureKey";
  };
  IOrgIntegration: {
    // field return type name
    id: "GID";
    invalidCredentials: "Boolean";
    isDefault: "Boolean";
    logoUrl: "String";
    name: "String";
    type: "IntegrationType";
  };
  ListView: {
    // field return type name
    id: "GID";
    isDefault: "Boolean";
    name: "String";
    type: "ListViewType";
    user: "User";
  };
  PetitionBase: {
    // field return type name
    anonymizeAfterMonths: "Int";
    anonymizePurpose: "String";
    attachmentsList: "PetitionAttachmentsList";
    automaticNumberingConfig: "AutomaticNumberingConfig";
    closingEmailBody: "JSON";
    completingMessageBody: "JSON";
    completingMessageSubject: "String";
    createdAt: "DateTime";
    customLists: "PetitionCustomList";
    customProperties: "JSONObject";
    defaultOnBehalf: "User";
    effectivePermissions: "EffectivePetitionUserPermission";
    emailBody: "JSON";
    emailSubject: "String";
    fieldCount: "Int";
    fieldRelationships: "PetitionFieldGroupRelationship";
    fields: "PetitionField";
    id: "GID";
    isAnonymized: "Boolean";
    isCompletingMessageEnabled: "Boolean";
    isDelegateAccessEnabled: "Boolean";
    isDocumentGenerationEnabled: "Boolean";
    isInteractionWithRecipientsEnabled: "Boolean";
    isRecipientViewContentsHidden: "Boolean";
    isRestricted: "Boolean";
    isRestrictedWithPassword: "Boolean";
    isReviewFlowEnabled: "Boolean";
    lastActivityAt: "DateTime";
    lastChangeAt: "DateTime";
    lastRecipientActivityAt: "DateTime";
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
    standardListDefinitions: "StandardListDefinition";
    tags: "Tag";
    tone: "Tone";
    updatedAt: "DateTime";
    variables: "PetitionVariable";
    variablesResult: "PetitionVariableResult";
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
    petition: "PetitionBase";
    updatedAt: "DateTime";
  };
  PetitionUserNotification: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
    isRead: "Boolean";
    petition: "PetitionBase";
  };
  ProfileEvent: {
    // field return type name
    createdAt: "DateTime";
    data: "JSONObject";
    id: "GID";
    profile: "Profile";
    type: "ProfileEventType";
  };
  ProfileFieldResponse: {
    // field return type name
    anonymizedAt: "DateTime";
    createdAt: "DateTime";
    createdBy: "User";
    expiresAt: "DateTime";
    expiryDate: "String";
    field: "ProfileTypeField";
    profile: "Profile";
    removedAt: "DateTime";
    removedBy: "User";
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
    archiveFieldGroupReplyIntoProfile: {
      // args
      conflictResolutions: NexusGenInputs["ArchiveFieldGroupReplyIntoProfileConflictResolutionInput"][]; // [ArchiveFieldGroupReplyIntoProfileConflictResolutionInput!]!
      expirations: NexusGenInputs["ArchiveFieldGroupReplyIntoProfileExpirationInput"][]; // [ArchiveFieldGroupReplyIntoProfileExpirationInput!]!
      parentReplyId: NexusGenScalars["GID"]; // GID!
      petitionFieldId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
      profileId: NexusGenScalars["GID"]; // GID!
    };
    archiveProfileType: {
      // args
      profileTypeIds: NexusGenScalars["GID"][]; // [GID!]!
    };
    associateProfileToPetition: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
      profileId: NexusGenScalars["GID"]; // GID!
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
    cloneProfileType: {
      // args
      name?: NexusGenScalars["LocalizableUserText"] | null; // LocalizableUserText
      pluralName?: NexusGenScalars["LocalizableUserText"] | null; // LocalizableUserText
      profileTypeId: NexusGenScalars["GID"]; // GID!
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
    closePetitionsFromTemplate: {
      // args
      templateId: NexusGenScalars["GID"]; // GID!
    };
    closeProfile: {
      // args
      profileIds: NexusGenScalars["GID"][]; // [GID!]!
    };
    completePetition: {
      // args
      additionalSigners?: NexusGenInputs["PublicPetitionSignerDataInput"][] | null; // [PublicPetitionSignerDataInput!]
      message?: string | null; // String
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    completeProfileFromExternalSource: {
      // args
      conflictResolutions: NexusGenInputs["ProfileExternalSourceConflictResolution"][]; // [ProfileExternalSourceConflictResolution!]!
      profileExternalSourceEntityId: NexusGenScalars["GID"]; // GID!
      profileId?: NexusGenScalars["GID"] | null; // GID
      profileTypeId: NexusGenScalars["GID"]; // GID!
    };
    copyBackgroundCheckReplyToProfileFieldValue: {
      // args
      expiryDate?: NexusGenScalars["Date"] | null; // Date
      petitionId: NexusGenScalars["GID"]; // GID!
      profileId: NexusGenScalars["GID"]; // GID!
      profileTypeFieldId: NexusGenScalars["GID"]; // GID!
      replyId: NexusGenScalars["GID"]; // GID!
    };
    copyFileReplyToProfileFieldFile: {
      // args
      expiryDate?: NexusGenScalars["Date"] | null; // Date
      fileReplyIds: NexusGenScalars["GID"][]; // [GID!]!
      petitionId: NexusGenScalars["GID"]; // GID!
      profileId: NexusGenScalars["GID"]; // GID!
      profileTypeFieldId: NexusGenScalars["GID"]; // GID!
    };
    createAddPetitionPermissionMaybeTask: {
      // args
      folders?: NexusGenInputs["FoldersInput"] | null; // FoldersInput
      message?: string | null; // String
      notify?: boolean | null; // Boolean
      permissionType: NexusGenEnums["PetitionPermissionTypeRW"]; // PetitionPermissionTypeRW!
      petitionIds?: NexusGenScalars["GID"][] | null; // [GID!]
      subscribe: boolean | null; // Boolean
      userGroupIds?: NexusGenScalars["GID"][] | null; // [GID!]
      userIds?: NexusGenScalars["GID"][] | null; // [GID!]
    };
    createAzureOpenAiIntegration: {
      // args
      apiKey: string; // String!
      endpoint: string; // String!
      orgId: NexusGenScalars["GID"]; // GID!
    };
    createBackgroundCheckProfilePdfTask: {
      // args
      entityId: string; // String!
      token: string; // String!
    };
    createBankflipDocumentProcessingIntegration: {
      // args
      apiKey: string; // String!
      host: string; // String!
      orgId: NexusGenScalars["GID"]; // GID!
      webhookSecret: string; // String!
    };
    createBankflipIdVerificationIntegration: {
      // args
      apiKey: string; // String!
      host: string; // String!
      orgId: NexusGenScalars["GID"]; // GID!
      webhookSecret: string; // String!
    };
    createBulkPetitionSendTask: {
      // args
      templateId: NexusGenScalars["GID"]; // GID!
      temporaryFileId: NexusGenScalars["GID"]; // GID!
    };
    createCompaniesHouseProfileExternalSourceIntegration: {
      // args
      apiKey: string; // String!
      orgId: NexusGenScalars["GID"]; // GID!
    };
    createContact: {
      // args
      data: NexusGenInputs["CreateContactInput"]; // CreateContactInput!
      force?: boolean | null; // Boolean
    };
    createContactlessPetitionAccess: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
      remindersConfig?: NexusGenInputs["RemindersConfigInput"] | null; // RemindersConfigInput
    };
    createCustomSignatureDocumentUploadLink: {
      // args
      file: NexusGenInputs["FileUploadInput"]; // FileUploadInput!
      petitionId: NexusGenScalars["GID"]; // GID!
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
      parentReplyId?: NexusGenScalars["GID"] | null; // GID
      petitionId: NexusGenScalars["GID"]; // GID!
      profileId: string; // ID!
    };
    createDowJonesProfileDownloadTask: {
      // args
      profileId: string; // ID!
    };
    createEInformaProfileExternalSourceIntegration: {
      // args
      clientId: string; // String!
      clientSecret: string; // String!
      isPaidSubscription: boolean; // Boolean!
      orgId: NexusGenScalars["GID"]; // GID!
    };
    createEditPetitionPermissionMaybeTask: {
      // args
      permissionType: NexusGenEnums["PetitionPermissionTypeRW"]; // PetitionPermissionTypeRW!
      petitionIds: NexusGenScalars["GID"][]; // [GID!]!
      userGroupIds?: NexusGenScalars["GID"][] | null; // [GID!]
      userIds?: NexusGenScalars["GID"][] | null; // [GID!]
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
    createFieldGroupRepliesFromProfiles: {
      // args
      force?: boolean | null; // Boolean
      parentReplyId?: NexusGenScalars["GID"] | null; // GID
      petitionFieldId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
      profileIds: NexusGenScalars["GID"][]; // [GID!]!
    };
    createFieldGroupReplyFromProfile: {
      // args
      force?: boolean | null; // Boolean
      parentReplyId: NexusGenScalars["GID"]; // GID!
      petitionFieldId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
      profileId: NexusGenScalars["GID"]; // GID!
    };
    createFileExportTask: {
      // args
      integrationId: NexusGenScalars["GID"]; // GID!
      pattern?: string | null; // String
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    createFileUploadReply: {
      // args
      fieldId: NexusGenScalars["GID"]; // GID!
      file: NexusGenInputs["FileUploadInput"]; // FileUploadInput!
      parentReplyId?: NexusGenScalars["GID"] | null; // GID
      password?: string | null; // String
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    createFileUploadReplyComplete: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
      replyId: NexusGenScalars["GID"]; // GID!
    };
    createIManageFileExportIntegration: {
      // args
      clientId: string; // String!
      orgId: NexusGenScalars["GID"]; // GID!
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
    createPetitionAttachmentUploadLink: {
      // args
      data: NexusGenInputs["FileUploadInput"][]; // [FileUploadInput!]!
      petitionId: NexusGenScalars["GID"]; // GID!
      type: NexusGenEnums["PetitionAttachmentType"]; // PetitionAttachmentType!
    };
    createPetitionComment: {
      // args
      content: NexusGenScalars["JSON"]; // JSON!
      isInternal: boolean; // Boolean!
      petitionFieldId?: NexusGenScalars["GID"] | null; // GID
      petitionId: NexusGenScalars["GID"]; // GID!
      sharePetition?: boolean | null; // Boolean
      sharePetitionPermission?: NexusGenEnums["PetitionPermissionTypeRW"] | null; // PetitionPermissionTypeRW
      sharePetitionSubscribed?: boolean | null; // Boolean
      throwOnNoPermission?: boolean | null; // Boolean
    };
    createPetitionEventSubscription: {
      // args
      challenge?: boolean | null; // Boolean
      eventTypes?: NexusGenEnums["PetitionEventType"][] | null; // [PetitionEventType!]
      eventsUrl: string; // String!
      fromTemplateFieldIds?: NexusGenScalars["GID"][] | null; // [GID!]
      fromTemplateId?: NexusGenScalars["GID"] | null; // GID
      name?: string | null; // String
    };
    createPetitionField: {
      // args
      data?: NexusGenInputs["CreatePetitionFieldInput"] | null; // CreatePetitionFieldInput
      parentFieldId?: NexusGenScalars["GID"] | null; // GID
      petitionId: NexusGenScalars["GID"]; // GID!
      position?: number | null; // Int
      profileTypeId?: NexusGenScalars["GID"] | null; // GID
      type: NexusGenEnums["PetitionFieldType"]; // PetitionFieldType!
    };
    createPetitionFieldAttachmentUploadLink: {
      // args
      data: NexusGenInputs["FileUploadInput"]; // FileUploadInput!
      fieldId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    createPetitionFieldReplies: {
      // args
      fields: NexusGenInputs["CreatePetitionFieldReplyInput"][]; // [CreatePetitionFieldReplyInput!]!
      overwriteExisting?: boolean | null; // Boolean
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    createPetitionFromProfile: {
      // args
      petitionFieldId?: NexusGenScalars["GID"] | null; // GID
      prefill: NexusGenInputs["CreatePetitionFromProfilePrefillInput"][]; // [CreatePetitionFromProfilePrefillInput!]!
      profileId: NexusGenScalars["GID"]; // GID!
      templateId: NexusGenScalars["GID"]; // GID!
    };
    createPetitionListView: {
      // args
      data: NexusGenInputs["PetitionListViewDataInput"]; // PetitionListViewDataInput!
      name: string; // String!
    };
    createPetitionSummaryTask: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    createPetitionVariable: {
      // args
      data: NexusGenInputs["CreatePetitionVariableInput"]; // CreatePetitionVariableInput!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    createPrintPdfTask: {
      // args
      includeNdLinks?: boolean | null; // Boolean
      petitionId: NexusGenScalars["GID"]; // GID!
      skipAttachments?: boolean | null; // Boolean
    };
    createProfile: {
      // args
      fields?: NexusGenInputs["UpdateProfileFieldValueInput"][] | null; // [UpdateProfileFieldValueInput!]
      profileTypeId: NexusGenScalars["GID"]; // GID!
      subscribe?: boolean | null; // Boolean
    };
    createProfileEventSubscription: {
      // args
      challenge?: boolean | null; // Boolean
      eventTypes?: NexusGenEnums["ProfileEventType"][] | null; // [ProfileEventType!]
      eventsUrl: string; // String!
      fromProfileTypeFieldIds?: NexusGenScalars["GID"][] | null; // [GID!]
      fromProfileTypeId?: NexusGenScalars["GID"] | null; // GID
      name?: string | null; // String
    };
    createProfileFieldFileUploadLink: {
      // args
      data: NexusGenInputs["FileUploadInput"][]; // [FileUploadInput!]!
      expiryDate?: NexusGenScalars["Date"] | null; // Date
      profileId: NexusGenScalars["GID"]; // GID!
      profileTypeFieldId: NexusGenScalars["GID"]; // GID!
    };
    createProfileLinkedPetitionField: {
      // args
      parentFieldId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
      position?: number | null; // Int
      profileTypeFieldId: NexusGenScalars["GID"]; // GID!
    };
    createProfileListView: {
      // args
      data: NexusGenInputs["ProfileListViewDataInput"]; // ProfileListViewDataInput!
      name: string; // String!
      profileTypeId: NexusGenScalars["GID"]; // GID!
    };
    createProfileRelationship: {
      // args
      profileId: NexusGenScalars["GID"]; // GID!
      relationships: NexusGenInputs["CreateProfileRelationshipInput"][]; // [CreateProfileRelationshipInput!]!
    };
    createProfileType: {
      // args
      name: NexusGenScalars["LocalizableUserText"]; // LocalizableUserText!
      pluralName: NexusGenScalars["LocalizableUserText"]; // LocalizableUserText!
    };
    createProfileTypeField: {
      // args
      data: NexusGenInputs["CreateProfileTypeFieldInput"]; // CreateProfileTypeFieldInput!
      profileTypeId: NexusGenScalars["GID"]; // GID!
    };
    createProfileTypeProcess: {
      // args
      processName: NexusGenScalars["LocalizableUserText"]; // LocalizableUserText!
      profileTypeId: NexusGenScalars["GID"]; // GID!
      templateIds: NexusGenScalars["GID"][]; // [GID!]!
    };
    createProfilesExcelImportTask: {
      // args
      file: NexusGenScalars["Upload"]; // Upload!
      profileTypeId: NexusGenScalars["GID"]; // GID!
    };
    createPublicPetitionLink: {
      // args
      allowMultiplePetitions: boolean; // Boolean!
      description: string; // String!
      petitionNamePattern?: string | null; // String
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
    createRemovePetitionPermissionMaybeTask: {
      // args
      petitionIds: NexusGenScalars["GID"][]; // [GID!]!
      removeAll?: boolean | null; // Boolean
      userGroupIds?: NexusGenScalars["GID"][] | null; // [GID!]
      userIds?: NexusGenScalars["GID"][] | null; // [GID!]
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
    createTemplateRepliesCsvExportTask: {
      // args
      templateId: NexusGenScalars["GID"]; // GID!
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
    deleteAzureOpenAiIntegration: {
      // args
      id: NexusGenScalars["GID"]; // GID!
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
    deletePetitionComment: {
      // args
      petitionFieldCommentId: NexusGenScalars["GID"]; // GID!
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
    deletePetitionListView: {
      // args
      id: NexusGenScalars["GID"]; // GID!
    };
    deletePetitionReply: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
      replyId: NexusGenScalars["GID"]; // GID!
    };
    deletePetitionVariable: {
      // args
      name: string; // String!
      petitionId: NexusGenScalars["GID"]; // GID!
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
      force?: boolean | null; // Boolean
      profileIds: NexusGenScalars["GID"][]; // [GID!]!
    };
    deleteProfileFieldFile: {
      // args
      profileFieldFileIds?: NexusGenScalars["GID"][] | null; // [GID!]
      profileId: NexusGenScalars["GID"]; // GID!
      profileTypeFieldId: NexusGenScalars["GID"]; // GID!
    };
    deleteProfileListView: {
      // args
      id: NexusGenScalars["GID"]; // GID!
    };
    deleteProfileType: {
      // args
      profileTypeIds: NexusGenScalars["GID"][]; // [GID!]!
    };
    deleteProfileTypeField: {
      // args
      force?: boolean | null; // Boolean
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
    disassociateProfilesFromPetitions: {
      // args
      petitionIds: NexusGenScalars["GID"][]; // [GID!]!
      profileIds: NexusGenScalars["GID"][]; // [GID!]!
    };
    dynamicSelectFieldFileDownloadLink: {
      // args
      fieldId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    editProfileTypeProcess: {
      // args
      data: NexusGenInputs["EditProfileTypeProcessInput"]; // EditProfileTypeProcessInput!
      profileTypeProcessId: NexusGenScalars["GID"]; // GID!
    };
    enableAutomaticNumberingOnPetitionFields: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
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
      userGroupIds?: NexusGenScalars["GID"][] | null; // [GID!]
    };
    linkFieldGroupToProfileType: {
      // args
      petitionFieldId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
      profileTypeId?: NexusGenScalars["GID"] | null; // GID
    };
    linkPetitionFieldChildren: {
      // args
      childrenFieldIds: NexusGenScalars["GID"][]; // [GID!]!
      force?: boolean | null; // Boolean
      parentFieldId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    loginAs: {
      // args
      userId: NexusGenScalars["GID"]; // GID!
    };
    markPetitionListViewAsDefault: {
      // args
      petitionListViewId?: NexusGenScalars["GID"] | null; // GID
    };
    markProfileListViewAsDefault: {
      // args
      profileListViewId: NexusGenScalars["GID"]; // GID!
      profileTypeId: NexusGenScalars["GID"]; // GID!
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
    pinProfileType: {
      // args
      profileTypeId: NexusGenScalars["GID"]; // GID!
    };
    prefillPetitionFromProfiles: {
      // args
      force?: boolean | null; // Boolean
      parentReplyId?: NexusGenScalars["GID"] | null; // GID
      petitionId: NexusGenScalars["GID"]; // GID!
      prefill: NexusGenInputs["CreatePetitionFromProfilePrefillInput"][]; // [CreatePetitionFromProfilePrefillInput!]!
    };
    profileExternalSourceDetails: {
      // args
      externalId: string; // ID!
      integrationId: NexusGenScalars["GID"]; // GID!
      profileId?: NexusGenScalars["GID"] | null; // GID
      profileTypeId: NexusGenScalars["GID"]; // GID!
    };
    profileExternalSourceSearch: {
      // args
      integrationId: NexusGenScalars["GID"]; // GID!
      locale: NexusGenEnums["UserLocale"]; // UserLocale!
      profileId?: NexusGenScalars["GID"] | null; // GID
      profileTypeId: NexusGenScalars["GID"]; // GID!
      search: NexusGenScalars["JSONObject"]; // JSONObject!
    };
    profileFieldFileDownloadLink: {
      // args
      preview?: boolean | null; // Boolean
      profileFieldFileId: NexusGenScalars["GID"]; // GID!
      profileId: NexusGenScalars["GID"]; // GID!
      profileTypeFieldId: NexusGenScalars["GID"]; // GID!
    };
    profileFieldFileUploadComplete: {
      // args
      profileFieldFileIds: NexusGenScalars["GID"][]; // [GID!]!
      profileId: NexusGenScalars["GID"]; // GID!
      profileTypeFieldId: NexusGenScalars["GID"]; // GID!
    };
    profileImportExcelModelDownloadLink: {
      // args
      locale: NexusGenEnums["UserLocale"]; // UserLocale!
      profileTypeId: NexusGenScalars["GID"]; // GID!
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
      parentReplyId?: NexusGenScalars["GID"] | null; // GID
      password?: string | null; // String
    };
    publicCreatePetitionComment: {
      // args
      content: string; // String!
      keycode: string; // ID!
      petitionFieldId?: NexusGenScalars["GID"] | null; // GID
    };
    publicCreatePetitionFieldReplies: {
      // args
      fields: NexusGenInputs["CreatePetitionFieldReplyInput"][]; // [CreatePetitionFieldReplyInput!]!
      keycode: string; // ID!
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
      messageBody: string; // String!
    };
    publicDeletePetitionComment: {
      // args
      keycode: string; // ID!
      petitionFieldCommentId: NexusGenScalars["GID"]; // GID!
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
    publicRetryAsyncFieldCompletion: {
      // args
      fieldId: NexusGenScalars["GID"]; // GID!
      keycode: string; // ID!
      parentReplyId?: NexusGenScalars["GID"] | null; // GID
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
      parentReplyId?: NexusGenScalars["GID"] | null; // GID
    };
    publicUpdatePetitionComment: {
      // args
      content: string; // String!
      keycode: string; // ID!
      petitionFieldCommentId: NexusGenScalars["GID"]; // GID!
    };
    publicUpdatePetitionFieldReplies: {
      // args
      keycode: string; // ID!
      replies: NexusGenInputs["UpdatePetitionFieldReplyInput"][]; // [UpdatePetitionFieldReplyInput!]!
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
    removeProfileRelationship: {
      // args
      profileId: NexusGenScalars["GID"]; // GID!
      profileRelationshipIds: NexusGenScalars["GID"][]; // [GID!]!
    };
    removeProfileTypeProcess: {
      // args
      profileTypeProcessId: NexusGenScalars["GID"]; // GID!
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
    reopenProfile: {
      // args
      profileIds: NexusGenScalars["GID"][]; // [GID!]!
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
    reorderProfileListViews: {
      // args
      ids: NexusGenScalars["GID"][]; // [GID!]!
      profileTypeId: NexusGenScalars["GID"]; // GID!
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
    retryAsyncFieldCompletion: {
      // args
      fieldId: NexusGenScalars["GID"]; // GID!
      parentReplyId?: NexusGenScalars["GID"] | null; // GID
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    revokeUserAuthToken: {
      // args
      authTokenIds: NexusGenScalars["GID"][]; // [GID!]!
    };
    scheduleProfileForDeletion: {
      // args
      profileIds: NexusGenScalars["GID"][]; // [GID!]!
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
      skipEmailSend?: boolean | null; // Boolean
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
      parentReplyId?: NexusGenScalars["GID"] | null; // GID
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    startSignatureRequest: {
      // args
      customDocumentTemporaryFileId?: NexusGenScalars["GID"] | null; // GID
      message?: string | null; // String
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    subscribeToProfile: {
      // args
      profileIds: NexusGenScalars["GID"][]; // [GID!]!
      userIds: NexusGenScalars["GID"][]; // [GID!]!
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
    transferAdminPermissions: {
      // args
      organizationId: NexusGenScalars["GID"]; // GID!
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
    unarchiveProfileType: {
      // args
      profileTypeIds: NexusGenScalars["GID"][]; // [GID!]!
    };
    unlinkPetitionFieldChildren: {
      // args
      childrenFieldIds: NexusGenScalars["GID"][]; // [GID!]!
      force?: boolean | null; // Boolean
      parentFieldId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    unpinProfileType: {
      // args
      profileTypeId: NexusGenScalars["GID"]; // GID!
    };
    unsubscribeFromProfile: {
      // args
      profileIds: NexusGenScalars["GID"][]; // [GID!]!
      userIds: NexusGenScalars["GID"][]; // [GID!]!
    };
    untagPetition: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
      tagId: NexusGenScalars["GID"]; // GID!
    };
    updateBackgroundCheckEntity: {
      // args
      entityId?: string | null; // String
      token: string; // String!
    };
    updateCompaniesHouseCustomProperties: {
      // args
      json: string; // String!
      orgId: NexusGenScalars["GID"]; // GID!
    };
    updateContact: {
      // args
      data: NexusGenInputs["UpdateContactInput"]; // UpdateContactInput!
      id: NexusGenScalars["GID"]; // GID!
    };
    updateEinformaCustomProperties: {
      // args
      json: string; // String!
      orgId: NexusGenScalars["GID"]; // GID!
    };
    updateFeatureFlags: {
      // args
      featureFlags: NexusGenInputs["InputFeatureFlagNameValue"][]; // [InputFeatureFlagNameValue!]!
      orgId: NexusGenScalars["GID"]; // GID!
    };
    updateFieldPositions: {
      // args
      fieldIds: NexusGenScalars["GID"][]; // [GID!]!
      parentFieldId?: NexusGenScalars["GID"] | null; // GID
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    updateFileUploadReply: {
      // args
      file: NexusGenInputs["FileUploadInput"]; // FileUploadInput!
      password?: string | null; // String
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
    updateOrganization: {
      // args
      data: NexusGenInputs["OrganizationUpdateInput"]; // OrganizationUpdateInput!
      orgId: NexusGenScalars["GID"]; // GID!
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
      data?: NexusGenScalars["JSONObject"] | null; // JSONObject
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
    updatePetitionComment: {
      // args
      content: NexusGenScalars["JSON"]; // JSON!
      petitionFieldCommentId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
      sharePetition?: boolean | null; // Boolean
      sharePetitionPermission?: NexusGenEnums["PetitionPermissionTypeRW"] | null; // PetitionPermissionTypeRW
      sharePetitionSubscribed?: boolean | null; // Boolean
      throwOnNoPermission?: boolean | null; // Boolean
    };
    updatePetitionEventSubscription: {
      // args
      eventTypes?: NexusGenEnums["PetitionEventType"][] | null; // [PetitionEventType!]
      eventsUrl?: string | null; // String
      fromTemplateFieldIds?: NexusGenScalars["GID"][] | null; // [GID!]
      fromTemplateId?: NexusGenScalars["GID"] | null; // GID
      id: NexusGenScalars["GID"]; // GID!
      isEnabled?: boolean | null; // Boolean
      name?: string | null; // String
    };
    updatePetitionField: {
      // args
      data: NexusGenInputs["UpdatePetitionFieldInput"]; // UpdatePetitionFieldInput!
      fieldId: NexusGenScalars["GID"]; // GID!
      force?: boolean | null; // Boolean
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    updatePetitionFieldAutoSearchConfig: {
      // args
      config?: NexusGenInputs["UpdatePetitionFieldAutoSearchConfigInput"] | null; // UpdatePetitionFieldAutoSearchConfigInput
      fieldId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    updatePetitionFieldGroupRelationships: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
      relationships: NexusGenInputs["UpdatePetitionFieldGroupRelationshipInput"][]; // [UpdatePetitionFieldGroupRelationshipInput!]!
    };
    updatePetitionFieldReplies: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
      replies: NexusGenInputs["UpdatePetitionFieldReplyInput"][]; // [UpdatePetitionFieldReplyInput!]!
    };
    updatePetitionFieldRepliesStatus: {
      // args
      petitionFieldId: NexusGenScalars["GID"]; // GID!
      petitionFieldReplyIds: NexusGenScalars["GID"][]; // [GID!]!
      petitionId: NexusGenScalars["GID"]; // GID!
      status: NexusGenEnums["PetitionFieldReplyStatus"]; // PetitionFieldReplyStatus!
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
    updatePetitionVariable: {
      // args
      data: NexusGenInputs["UpdatePetitionVariableInput"]; // UpdatePetitionVariableInput!
      name: string; // String!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    updateProfileEventSubscription: {
      // args
      eventTypes?: NexusGenEnums["ProfileEventType"][] | null; // [ProfileEventType!]
      eventsUrl?: string | null; // String
      fromProfileTypeFieldIds?: NexusGenScalars["GID"][] | null; // [GID!]
      fromProfileTypeId?: NexusGenScalars["GID"] | null; // GID
      id: NexusGenScalars["GID"]; // GID!
      isEnabled?: boolean | null; // Boolean
      name?: string | null; // String
    };
    updateProfileFieldValue: {
      // args
      fields: NexusGenInputs["UpdateProfileFieldValueInput"][]; // [UpdateProfileFieldValueInput!]!
      profileId: NexusGenScalars["GID"]; // GID!
    };
    updateProfileListView: {
      // args
      data?: NexusGenInputs["ProfileListViewDataInput"] | null; // ProfileListViewDataInput
      name?: string | null; // String
      profileListViewId: NexusGenScalars["GID"]; // GID!
      profileTypeId: NexusGenScalars["GID"]; // GID!
    };
    updateProfileType: {
      // args
      icon?: NexusGenEnums["ProfileTypeIcon"] | null; // ProfileTypeIcon
      name?: NexusGenScalars["LocalizableUserText"] | null; // LocalizableUserText
      pluralName?: NexusGenScalars["LocalizableUserText"] | null; // LocalizableUserText
      profileNamePattern?: string | null; // String
      profileTypeId: NexusGenScalars["GID"]; // GID!
    };
    updateProfileTypeField: {
      // args
      data: NexusGenInputs["UpdateProfileTypeFieldInput"]; // UpdateProfileTypeFieldInput!
      force?: boolean | null; // Boolean
      profileTypeFieldId: NexusGenScalars["GID"]; // GID!
      profileTypeId: NexusGenScalars["GID"]; // GID!
    };
    updateProfileTypeFieldPermissions: {
      // args
      data: NexusGenInputs["UpdateProfileTypeFieldPermissionsInput"][]; // [UpdateProfileTypeFieldPermissionsInput!]!
      defaultPermission?: NexusGenEnums["ProfileTypeFieldPermissionType"] | null; // ProfileTypeFieldPermissionType
      profileTypeFieldIds: NexusGenScalars["GID"][]; // [GID!]!
      profileTypeId: NexusGenScalars["GID"]; // GID!
    };
    updateProfileTypeFieldPositions: {
      // args
      profileTypeFieldIds: NexusGenScalars["GID"][]; // [GID!]!
      profileTypeId: NexusGenScalars["GID"]; // GID!
    };
    updateProfileTypeProcessPositions: {
      // args
      profileTypeId: NexusGenScalars["GID"]; // GID!
      profileTypeProcessIds: NexusGenScalars["GID"][]; // [GID!]!
    };
    updatePublicPetitionLink: {
      // args
      allowMultiplePetitions?: boolean | null; // Boolean
      description?: string | null; // String
      isActive?: boolean | null; // Boolean
      petitionNamePattern?: string | null; // String
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
    updateStandardListDefinitions: {
      // args
      file: NexusGenScalars["Upload"]; // Upload!
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
    updateUserGroupMembership: {
      // args
      userGroupIds: NexusGenScalars["GID"][]; // [GID!]!
      userId: NexusGenScalars["GID"]; // GID!
    };
    updateUserGroupPermissions: {
      // args
      permissions: NexusGenInputs["UpdateUserGroupPermissionsInput"][]; // [UpdateUserGroupPermissionsInput!]!
      userGroupId: NexusGenScalars["GID"]; // GID!
    };
    updateUserPreferredLocale: {
      // args
      locale: NexusGenEnums["UserLocale"]; // UserLocale!
    };
    uploadBulkPetitionSendTaskInputFile: {
      // args
      file: NexusGenInputs["FileUploadInput"]; // FileUploadInput!
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
  OrgIntegration: {
    logoUrl: {
      // args
      options?: NexusGenInputs["ImageOptions"] | null; // ImageOptions
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
      filters?: NexusGenInputs["UserFilter"] | null; // UserFilter
      limit?: number | null; // Int
      offset?: number | null; // Int
      search?: string | null; // String
      searchByEmailOnly?: boolean | null; // Boolean
      sortBy?: NexusGenEnums["OrganizationUsers_OrderBy"][] | null; // [OrganizationUsers_OrderBy!]
    };
    usersByEmail: {
      // args
      emails: string[]; // [String!]!
      limit?: number | null; // Int
      offset?: number | null; // Int
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
  Profile: {
    associatedPetitions: {
      // args
      filters?: NexusGenInputs["ProfileAssociatedPetitionFilter"] | null; // ProfileAssociatedPetitionFilter
      limit?: number | null; // Int
      offset?: number | null; // Int
    };
    events: {
      // args
      limit?: number | null; // Int
      offset?: number | null; // Int
    };
    properties: {
      // args
      filter?: NexusGenInputs["ProfileFieldPropertyFilter"][] | null; // [ProfileFieldPropertyFilter!]
    };
    relationships: {
      // args
      filter?: NexusGenInputs["ProfileRelationshipFilter"][] | null; // [ProfileRelationshipFilter!]
    };
  };
  ProfileExternalSourceOrgIntegration: {
    logoUrl: {
      // args
      options?: NexusGenInputs["ImageOptions"] | null; // ImageOptions
    };
    searchParams: {
      // args
      locale: NexusGenEnums["UserLocale"]; // UserLocale!
      profileId?: NexusGenScalars["GID"] | null; // GID
      profileTypeId: NexusGenScalars["GID"]; // GID!
    };
  };
  ProfileTypeProcess: {
    latestPetition: {
      // args
      profileId: NexusGenScalars["GID"]; // GID!
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
    backgroundCheckEntityDetails: {
      // args
      entityId: string; // String!
      token: string; // String!
    };
    backgroundCheckEntitySearch: {
      // args
      date?: NexusGenScalars["Date"] | null; // Date
      name: string; // String!
      token: string; // String!
      type?: NexusGenEnums["BackgroundCheckEntitySearchType"] | null; // BackgroundCheckEntitySearchType
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
    dashboard: {
      // args
      id: NexusGenScalars["GID"]; // GID!
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
    expiringProfileProperties: {
      // args
      filter?: NexusGenInputs["ProfilePropertyFilter"] | null; // ProfilePropertyFilter
      limit?: number | null; // Int
      offset?: number | null; // Int
      search?: string | null; // String
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
    petitionInformation: {
      // args
      petitionId: string; // ID!
    };
    petitions: {
      // args
      excludeAnonymized?: boolean | null; // Boolean
      excludePublicTemplates?: boolean | null; // Boolean
      filters?: NexusGenInputs["PetitionFilter"] | null; // PetitionFilter
      limit?: number | null; // Int
      offset?: number | null; // Int
      search?: string | null; // String
      searchByNameOnly?: boolean | null; // Boolean
      sortBy?: NexusGenEnums["QueryPetitions_OrderBy"][] | null; // [QueryPetitions_OrderBy!]
    };
    petitionsById: {
      // args
      folders?: NexusGenInputs["FoldersInput"] | null; // FoldersInput
      ids?: NexusGenScalars["GID"][] | null; // [GID!]
    };
    petitionsSharingInfo: {
      // args
      folders?: NexusGenInputs["FoldersInput"] | null; // FoldersInput
      ids?: NexusGenScalars["GID"][] | null; // [GID!]
    };
    profile: {
      // args
      profileId: NexusGenScalars["GID"]; // GID!
    };
    profileEvents: {
      // args
      before?: NexusGenScalars["GID"] | null; // GID
      eventTypes?: NexusGenEnums["ProfileEventType"][] | null; // [ProfileEventType!]
    };
    profileRelationshipTypesWithDirection: {
      // args
      otherSideProfileTypeId?: NexusGenScalars["GID"] | null; // GID
    };
    profileType: {
      // args
      profileTypeId: NexusGenScalars["GID"]; // GID!
    };
    profileTypes: {
      // args
      filter?: NexusGenInputs["ProfileTypeFilter"] | null; // ProfileTypeFilter
      limit?: number | null; // Int
      locale?: NexusGenEnums["UserLocale"] | null; // UserLocale
      offset?: number | null; // Int
      search?: string | null; // String
      sortBy?: NexusGenEnums["QueryProfileTypes_OrderBy"][] | null; // [QueryProfileTypes_OrderBy!]
    };
    profiles: {
      // args
      filter?: NexusGenInputs["ProfileFilter"] | null; // ProfileFilter
      limit?: number | null; // Int
      offset?: number | null; // Int
      search?: string | null; // String
      sortBy?: NexusGenEnums["QueryProfiles_OrderBy"][] | null; // [QueryProfiles_OrderBy!]
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
    standardListDefinition: {
      // args
      id: NexusGenScalars["GID"]; // GID!
      locale: NexusGenEnums["UserLocale"]; // UserLocale!
    };
    tags: {
      // args
      limit?: number | null; // Int
      offset?: number | null; // Int
      search?: string | null; // String
      tagIds?: NexusGenScalars["GID"][] | null; // [GID!]
    };
    tagsByName: {
      // args
      limit?: number | null; // Int
      offset?: number | null; // Int
      search: string[]; // [String!]!
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
      excludeIds?: NexusGenScalars["GID"][] | null; // [GID!]
      limit?: number | null; // Int
      offset?: number | null; // Int
      search?: string | null; // String
      sortBy?: NexusGenEnums["QueryUserGroups_OrderBy"][] | null; // [QueryUserGroups_OrderBy!]
      type?: NexusGenEnums["UserGroupType"][] | null; // [UserGroupType!]
    };
  };
  SignatureOrgIntegration: {
    logoUrl: {
      // args
      options?: NexusGenInputs["ImageOptions"] | null; // ImageOptions
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
    profileListViews: {
      // args
      profileTypeId: NexusGenScalars["GID"]; // GID!
    };
  };
  IOrgIntegration: {
    logoUrl: {
      // args
      options?: NexusGenInputs["ImageOptions"] | null; // ImageOptions
    };
  };
}

export interface NexusGenAbstractTypeMembers {
  PetitionBaseOrFolder: "Petition" | "PetitionFolder" | "PetitionTemplate";
  PetitionFieldCommentMention:
    | "PetitionFieldCommentUserGroupMention"
    | "PetitionFieldCommentUserMention";
  PetitionFieldOrPetition: "Petition" | "PetitionField";
  ProfileExternalSourceSearchResults:
    | "ProfileExternalSourceSearchMultipleResults"
    | "ProfileExternalSourceSearchSingleResult";
  PublicPetitionFieldOrPublicPetition: "PublicPetition" | "PublicPetitionField";
  PublicUserOrContact: "PublicContact" | "PublicUser";
  UserOrPetitionAccess: "PetitionAccess" | "User";
  UserOrUserGroup: "User" | "UserGroup";
  BackgroundCheckEntityDetails:
    | "BackgroundCheckEntityDetailsCompany"
    | "BackgroundCheckEntityDetailsPerson";
  BackgroundCheckEntitySearchSchema:
    | "BackgroundCheckEntitySearchCompany"
    | "BackgroundCheckEntitySearchPerson";
  CreatedAt:
    | "PetitionFieldAttachment"
    | "PetitionMessage"
    | "PetitionReminder"
    | "UserAuthenticationToken";
  DashboardModule:
    | "DashboardCreateParallelButtonModule"
    | "DashboardParallelsNumberModule"
    | "DashboardParallelsPieChartModule"
    | "DashboardParallelsRatioModule"
    | "DashboardProfilesNumberModule"
    | "DashboardProfilesPieChartModule"
    | "DashboardProfilesRatioModule";
  DowJonesKycEntityProfileResult:
    | "DowJonesKycEntityProfileResultEntity"
    | "DowJonesKycEntityProfileResultPerson";
  DowJonesKycEntitySearchResult:
    | "DowJonesKycEntitySearchResultEntity"
    | "DowJonesKycEntitySearchResultPerson";
  EventSubscription: "PetitionEventSubscription" | "ProfileEventSubscription";
  IOrgIntegration:
    | "OrgIntegration"
    | "ProfileExternalSourceOrgIntegration"
    | "SignatureOrgIntegration";
  ListView: "PetitionListView" | "ProfileListView";
  PetitionBase: "Petition" | "PetitionTemplate";
  PetitionEvent:
    | "AccessActivatedEvent"
    | "AccessActivatedFromPublicPetitionLinkEvent"
    | "AccessDeactivatedEvent"
    | "AccessDelegatedEvent"
    | "AccessOpenedEvent"
    | "CommentDeletedEvent"
    | "CommentPublishedEvent"
    | "ContactlessAccessUsedEvent"
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
    | "PetitionTaggedEvent"
    | "PetitionUntaggedEvent"
    | "ProfileAssociatedEvent"
    | "ProfileDisassociatedEvent"
    | "RecipientSignedEvent"
    | "ReminderSentEvent"
    | "RemindersOptOutEvent"
    | "ReplyCreatedEvent"
    | "ReplyDeletedEvent"
    | "ReplyStatusChangedEvent"
    | "ReplyUpdatedEvent"
    | "SignatureCancelledEvent"
    | "SignatureCompletedEvent"
    | "SignatureDeliveredEvent"
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
  ProfileEvent:
    | "PetitionAssociatedEvent"
    | "PetitionDisassociatedEvent"
    | "ProfileAnonymizedEvent"
    | "ProfileClosedEvent"
    | "ProfileCreatedEvent"
    | "ProfileFieldExpiryUpdatedEvent"
    | "ProfileFieldFileAddedEvent"
    | "ProfileFieldFileRemovedEvent"
    | "ProfileFieldValueUpdatedEvent"
    | "ProfileRelationshipCreatedEvent"
    | "ProfileRelationshipRemovedEvent"
    | "ProfileReopenedEvent"
    | "ProfileScheduledForDeletionEvent"
    | "ProfileUpdatedEvent";
  ProfileFieldResponse: "ProfileFieldFile" | "ProfileFieldValue";
  TemplateDefaultPermission: "TemplateDefaultUserGroupPermission" | "TemplateDefaultUserPermission";
  Timestamps:
    | "AiCompletionLog"
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
  AiCompletionLog: "Timestamps";
  BackgroundCheckEntityDetailsCompany: "BackgroundCheckEntityDetails";
  BackgroundCheckEntityDetailsPerson: "BackgroundCheckEntityDetails";
  BackgroundCheckEntitySearchCompany: "BackgroundCheckEntitySearchSchema";
  BackgroundCheckEntitySearchPerson: "BackgroundCheckEntitySearchSchema";
  CommentCreatedUserNotification: "PetitionUserNotification";
  CommentDeletedEvent: "PetitionEvent";
  CommentPublishedEvent: "PetitionEvent";
  Contact: "Timestamps";
  ContactlessAccessUsedEvent: "PetitionEvent";
  DashboardCreateParallelButtonModule: "DashboardModule";
  DashboardParallelsNumberModule: "DashboardModule";
  DashboardParallelsPieChartModule: "DashboardModule";
  DashboardParallelsRatioModule: "DashboardModule";
  DashboardProfilesNumberModule: "DashboardModule";
  DashboardProfilesPieChartModule: "DashboardModule";
  DashboardProfilesRatioModule: "DashboardModule";
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
  PetitionAssociatedEvent: "ProfileEvent";
  PetitionClonedEvent: "PetitionEvent";
  PetitionClosedEvent: "PetitionEvent";
  PetitionClosedNotifiedEvent: "PetitionEvent";
  PetitionCompletedEvent: "PetitionEvent";
  PetitionCompletedUserNotification: "PetitionUserNotification";
  PetitionCreatedEvent: "PetitionEvent";
  PetitionDeletedEvent: "PetitionEvent";
  PetitionDisassociatedEvent: "ProfileEvent";
  PetitionEventSubscription: "EventSubscription";
  PetitionFieldAttachment: "CreatedAt";
  PetitionFieldReply: "Timestamps";
  PetitionListView: "ListView";
  PetitionMessage: "CreatedAt";
  PetitionMessageBouncedEvent: "PetitionEvent";
  PetitionReminder: "CreatedAt";
  PetitionReminderBouncedEvent: "PetitionEvent";
  PetitionReopenedEvent: "PetitionEvent";
  PetitionSharedUserNotification: "PetitionUserNotification";
  PetitionSignatureRequest: "Timestamps";
  PetitionTaggedEvent: "PetitionEvent";
  PetitionTemplate: "PetitionBase";
  PetitionUntaggedEvent: "PetitionEvent";
  PetitionUserGroupPermission: "PetitionPermission" | "Timestamps";
  PetitionUserPermission: "PetitionPermission" | "Timestamps";
  Profile: "Timestamps";
  ProfileAnonymizedEvent: "ProfileEvent";
  ProfileAssociatedEvent: "PetitionEvent";
  ProfileClosedEvent: "ProfileEvent";
  ProfileCreatedEvent: "ProfileEvent";
  ProfileDisassociatedEvent: "PetitionEvent";
  ProfileEventSubscription: "EventSubscription";
  ProfileExternalSourceOrgIntegration: "IOrgIntegration";
  ProfileFieldExpiryUpdatedEvent: "ProfileEvent";
  ProfileFieldFile: "ProfileFieldResponse";
  ProfileFieldFileAddedEvent: "ProfileEvent";
  ProfileFieldFileRemovedEvent: "ProfileEvent";
  ProfileFieldValue: "ProfileFieldResponse";
  ProfileFieldValueUpdatedEvent: "ProfileEvent";
  ProfileListView: "ListView";
  ProfileRelationshipCreatedEvent: "ProfileEvent";
  ProfileRelationshipRemovedEvent: "ProfileEvent";
  ProfileReopenedEvent: "ProfileEvent";
  ProfileScheduledForDeletionEvent: "ProfileEvent";
  ProfileType: "Timestamps";
  ProfileUpdatedEvent: "ProfileEvent";
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
  SignatureDeliveredEvent: "PetitionEvent";
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
  | "BackgroundCheckEntityDetails"
  | "BackgroundCheckEntitySearchSchema"
  | "CreatedAt"
  | "DashboardModule"
  | "DowJonesKycEntityProfileResult"
  | "DowJonesKycEntitySearchResult"
  | "EventSubscription"
  | "IOrgIntegration"
  | "ListView"
  | "PetitionBase"
  | "PetitionBaseOrFolder"
  | "PetitionEvent"
  | "PetitionFieldCommentMention"
  | "PetitionFieldOrPetition"
  | "PetitionPermission"
  | "PetitionUserNotification"
  | "ProfileEvent"
  | "ProfileExternalSourceSearchResults"
  | "ProfileFieldResponse"
  | "PublicPetitionFieldOrPublicPetition"
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
