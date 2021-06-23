import { FileUpload } from "graphql-upload";
import * as ctx from "./../context";
import * as db from "./../db/__types";
import * as events from "./../db/events";
import * as notifications from "./../db/notifications";
import { GlobalIdConfigSpread } from "./helpers/globalIdPlugin";
import { FieldAuthorizeResolver } from "@nexus/schema/dist/plugins/fieldAuthorizePlugin";
import { FieldValidateArgsResolver } from "./helpers/validateArgsPlugin";
import { core } from "@nexus/schema";
import { PaginationFieldConfig } from "./helpers/paginationPlugin";
declare global {
  interface NexusGenCustomInputMethods<TypeName extends string> {
    /**
     * A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.
     */
    datetime<FieldName extends string>(
      fieldName: FieldName,
      opts?: core.CommonInputFieldConfig<TypeName, FieldName>
    ): void; // "DateTime";
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
    globalId<FieldName extends string>(
      fieldName: FieldName,
      ...opts: GlobalIdConfigSpread<TypeName, FieldName>
    ): void;

    paginationField<
      FieldName extends string,
      PaginationType extends
        | core.GetGen<"allOutputTypes", string>
        | core.AllNexusOutputTypeDefs
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
    firstName?: string | null; // String
    lastName?: string | null; // String
  };
  FileUploadInput: {
    // input type
    contentType: string; // String!
    filename: string; // String!
    size: number; // Int!
  };
  PetitionFilter: {
    // input type
    locale?: NexusGenEnums["PetitionLocale"] | null; // PetitionLocale
    status?: NexusGenEnums["PetitionStatus"] | null; // PetitionStatus
    tagIds?: string[] | null; // [ID!]
    type?: NexusGenEnums["PetitionBaseType"] | null; // PetitionBaseType
  };
  PublicPetitionSignerData: {
    // input type
    email: string; // String!
    firstName: string; // String!
    lastName: string; // String!
    message?: string | null; // String
  };
  RemindersConfigInput: {
    // input type
    offset: number; // Int!
    time: string; // String!
    timezone: string; // String!
    weekdaysOnly: boolean; // Boolean!
  };
  SignatureConfigInput: {
    // input type
    contactIds: string[]; // [ID!]!
    provider: string; // String!
    review: boolean; // Boolean!
    timezone: string; // String!
    title: string; // String!
  };
  UpdateContactInput: {
    // input type
    firstName?: string | null; // String
    lastName?: string | null; // String
  };
  UpdatePetitionFieldInput: {
    // input type
    description?: string | null; // String
    multiple?: boolean | null; // Boolean
    optional?: boolean | null; // Boolean
    options?: NexusGenScalars["JSONObject"] | null; // JSONObject
    title?: string | null; // String
    visibility?: NexusGenScalars["JSONObject"] | null; // JSONObject
  };
  UpdatePetitionInput: {
    // input type
    deadline?: NexusGenScalars["DateTime"] | null; // DateTime
    description?: string | null; // String
    emailBody?: NexusGenScalars["JSON"] | null; // JSON
    emailSubject?: string | null; // String
    hasCommentsEnabled?: boolean | null; // Boolean
    isRecipientViewContentsHidden?: boolean | null; // Boolean
    locale?: NexusGenEnums["PetitionLocale"] | null; // PetitionLocale
    name?: string | null; // String
    remindersConfig?: NexusGenInputs["RemindersConfigInput"] | null; // RemindersConfigInput
    signatureConfig?: NexusGenInputs["SignatureConfigInput"] | null; // SignatureConfigInput
    skipForwardSecurity?: boolean | null; // Boolean
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
  UpdateUserInput: {
    // input type
    firstName?: string | null; // String
    lastName?: string | null; // String
  };
}

export interface NexusGenEnums {
  ChangePasswordResult:
    | "INCORRECT_PASSWORD"
    | "INVALID_NEW_PASSWORD"
    | "SUCCESS";
  EntityType: "Contact" | "Organization" | "Petition" | "User";
  FeatureFlag: db.FeatureFlagName;
  IntegrationType: db.IntegrationType;
  OnboardingKey:
    | "CONTACT_DETAILS"
    | "CONTACT_LIST"
    | "PETITIONS_LIST"
    | "PETITION_ACTIVITY"
    | "PETITION_COMPOSE"
    | "PETITION_REVIEW";
  OnboardingStatus: "FINISHED" | "SKIPPED";
  OrganizationRole: "ADMIN" | "NORMAL";
  OrganizationStatus: db.OrganizationStatus;
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
  PetitionBaseType: "PETITION" | "TEMPLATE";
  PetitionFieldReplyStatus: db.PetitionFieldReplyStatus;
  PetitionFieldType: db.PetitionFieldType;
  PetitionLocale: "en" | "es";
  PetitionMessageStatus: db.PetitionMessageStatus;
  PetitionPermissionType: db.PetitionPermissionType;
  PetitionPermissionTypeRW: "READ" | "WRITE";
  PetitionReminderType: db.PetitionReminderType;
  PetitionSignatureCancelReason: db.PetitionSignatureCancelReason;
  PetitionSignatureRequestStatus:
    | "CANCELLED"
    | "COMPLETED"
    | "ENQUEUED"
    | "PROCESSING";
  PetitionStatus: db.PetitionStatus;
  PetitionUserNotificationFilter:
    | "ALL"
    | "COMMENTS"
    | "COMPLETED"
    | "OTHER"
    | "SHARED"
    | "UNREAD";
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
  QueryOrganizations_OrderBy:
    | "createdAt_ASC"
    | "createdAt_DESC"
    | "name_ASC"
    | "name_DESC";
  QueryPetitions_OrderBy:
    | "createdAt_ASC"
    | "createdAt_DESC"
    | "lastUsedAt_ASC"
    | "lastUsedAt_DESC"
    | "name_ASC"
    | "name_DESC";
  QueryUserGroups_OrderBy:
    | "createdAt_ASC"
    | "createdAt_DESC"
    | "name_ASC"
    | "name_DESC";
  Result: "FAILURE" | "SUCCESS";
  UserAuthenticationTokens_OrderBy:
    | "createdAt_ASC"
    | "createdAt_DESC"
    | "lastUsedAt_ASC"
    | "lastUsedAt_DESC"
    | "tokenName_ASC"
    | "tokenName_DESC";
  UserStatus: db.UserStatus;
}

export interface NexusGenScalars {
  String: string;
  Int: number;
  Float: number;
  Boolean: boolean;
  ID: string;
  DateTime: Date;
  GID: number;
  JSON: any;
  JSONObject: { [key: string]: any };
  Upload: Promise<FileUpload>;
}

export interface NexusGenObjects {
  AWSPresignedPostData: {
    // root type
    fields: NexusGenScalars["JSONObject"]; // JSONObject!
    url: string; // String!
  };
  AccessActivatedEvent: events.AccessActivatedEvent;
  AccessDeactivatedEvent: events.AccessDeactivatedEvent;
  AccessDelegatedEvent: events.AccessDelegatedEvent;
  AccessOpenedEvent: events.AccessOpenedEvent;
  CommentCreatedUserNotification: notifications.CommentCreatedUserNotification;
  CommentDeletedEvent: events.CommentDeletedEvent;
  CommentPublishedEvent: events.CommentPublishedEvent;
  Contact: db.Contact;
  ContactPagination: {
    // root type
    items: NexusGenRootTypes["Contact"][]; // [Contact!]!
    totalCount: number; // Int!
  };
  CreateFileUploadFieldAttachment: {
    // root type
    attachment: NexusGenRootTypes["PetitionFieldAttachment"]; // PetitionFieldAttachment!
    presignedPostData: NexusGenRootTypes["AWSPresignedPostData"]; // AWSPresignedPostData!
  };
  CreateFileUploadReply: {
    // root type
    presignedPostData: NexusGenRootTypes["AWSPresignedPostData"]; // AWSPresignedPostData!
    reply: NexusGenRootTypes["PublicPetitionFieldReply"]; // PublicPetitionFieldReply!
  };
  EffectivePetitionUserPermission: Pick<
    db.PetitionPermission,
    "petition_id" | "user_id" | "type" | "is_subscribed"
  >;
  FileUpload: db.FileUpload;
  FileUploadDownloadLinkResult: {
    // root type
    file?: NexusGenRootTypes["FileUpload"] | null; // FileUpload
    result: NexusGenEnums["Result"]; // Result!
    url?: string | null; // String
  };
  GenerateUserAuthTokenResponse: {
    // root type
    apiKey: string; // String!
    userAuthToken: NexusGenRootTypes["UserAuthenticationToken"]; // UserAuthenticationToken!
  };
  GroupPermissionAddedEvent: events.GroupPermissionAddedEvent;
  GroupPermissionEditedEvent: events.GroupPermissionEditedEvent;
  GroupPermissionRemovedEvent: events.GroupPermissionRemovedEvent;
  MessageCancelledEvent: events.MessageCancelledEvent;
  MessageEmailBouncedUserNotification: notifications.MessageEmailBouncedUserNotification;
  MessageScheduledEvent: events.MessageScheduledEvent;
  MessageSentEvent: events.MessageSentEvent;
  Mutation: {};
  OrgIntegration: db.OrgIntegration;
  Organization: db.Organization;
  OrganizationPagination: {
    // root type
    items: NexusGenRootTypes["Organization"][]; // [Organization!]!
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
  PetitionAndField: {
    // root type
    field: NexusGenRootTypes["PetitionField"]; // PetitionField!
    petition: NexusGenRootTypes["Petition"]; // Petition!
  };
  PetitionAndPartialFields: {
    // root type
    fields: NexusGenRootTypes["PetitionField"][]; // [PetitionField!]!
    petition: NexusGenRootTypes["Petition"]; // Petition!
  };
  PetitionBasePagination: {
    // root type
    items: NexusGenRootTypes["PetitionBase"][]; // [PetitionBase!]!
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
  PetitionField: db.PetitionField;
  PetitionFieldAttachment: db.PetitionFieldAttachment;
  PetitionFieldComment: db.PetitionFieldComment;
  PetitionFieldReply: db.PetitionFieldReply;
  PetitionMessage: db.PetitionMessage;
  PetitionProgress: {
    // root type
    optional: number; // Int!
    replied: number; // Int!
    total: number; // Int!
    validated: number; // Int!
  };
  PetitionReminder: db.PetitionReminder;
  PetitionReopenedEvent: events.PetitionReopenedEvent;
  PetitionSharedUserNotification: notifications.PetitionSharedUserNotification;
  PetitionSignatureRequest: db.PetitionSignatureRequest;
  PetitionTemplate: db.Petition;
  PetitionTemplateAndField: {
    // root type
    field: NexusGenRootTypes["PetitionField"]; // PetitionField!
    petition: NexusGenRootTypes["PetitionTemplate"]; // PetitionTemplate!
  };
  PetitionTemplatePagination: {
    // root type
    items: NexusGenRootTypes["PetitionTemplate"][]; // [PetitionTemplate!]!
    totalCount: number; // Int!
  };
  PetitionUserGroupPermission: db.PetitionPermission;
  PetitionUserNotificationPagination: {
    // root type
    items: NexusGenRootTypes["PetitionUserNotification"][]; // [PetitionUserNotification!]!
    totalCount: number; // Int!
  };
  PetitionUserPermission: db.PetitionPermission;
  PetitionWithFieldAndReplies: {
    // root type
    field: NexusGenRootTypes["PetitionField"]; // PetitionField!
    petition: NexusGenRootTypes["Petition"]; // Petition!
    replies: NexusGenRootTypes["PetitionFieldReply"][]; // [PetitionFieldReply!]!
  };
  PublicAccessVerification: {
    // root type
    cookieName?: string | null; // String
    cookieValue?: string | null; // String
    email?: string | null; // String
    isAllowed: boolean; // Boolean!
    orgLogoUrl?: string | null; // String
    orgName?: string | null; // String
  };
  PublicContact: db.Contact;
  PublicOrganization: db.Organization;
  PublicPetition: db.Petition;
  PublicPetitionAccess: db.PetitionAccess;
  PublicPetitionField: db.PetitionField;
  PublicPetitionFieldComment: db.PetitionFieldComment;
  PublicPetitionFieldReply: db.PetitionFieldReply;
  PublicPetitionMessage: db.PetitionMessage;
  PublicSignatureConfig: {
    contactIds: number[];
    review?: boolean;
  };
  PublicUser: db.User;
  Query: {};
  ReminderSentEvent: events.ReminderSentEvent;
  RemindersConfig: {
    offset: number;
    time: string;
    timezone: string;
    weekdaysOnly: boolean;
  };
  ReplyCreatedEvent: events.ReplyCreatedEvent;
  ReplyDeletedEvent: events.ReplyDeletedEvent;
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
    provider: string;
    contactIds: number[];
    timezone: string;
    title: string;
    review?: boolean;
  };
  SignatureStartedEvent: events.SignatureStartedEvent;
  Subscription: db.PetitionEventSubscription;
  SupportMethodResponse: {
    // root type
    message?: string | null; // String
    result: NexusGenEnums["Result"]; // Result!
  };
  Tag: db.Tag;
  TagPagination: {
    // root type
    items: NexusGenRootTypes["Tag"][]; // [Tag!]!
    totalCount: number; // Int!
  };
  TemplateUsedEvent: events.TemplateUsedEvent;
  User: db.User;
  UserAuthenticationToken: db.UserAuthenticationToken;
  UserAuthenticationTokenPagination: {
    // root type
    items: NexusGenRootTypes["UserAuthenticationToken"][]; // [UserAuthenticationToken!]!
    totalCount: number; // Int!
  };
  UserGroup: db.UserGroup;
  UserGroupMember: db.UserGroupMember;
  UserGroupPagination: {
    // root type
    items: NexusGenRootTypes["UserGroup"][]; // [UserGroup!]!
    totalCount: number; // Int!
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
  PetitionBase: db.Petition;
  PetitionBaseAndField: {
    petition: db.Petition;
    field: db.PetitionField;
  };
  PetitionEvent: events.PetitionEvent;
  PetitionPermission: db.PetitionPermission;
  PetitionUserNotification: db.PetitionUserNotification;
  Timestamps: {
    created_at: Date;
    updated_at: Date;
  };
}

export interface NexusGenUnions {
  PublicUserOrContact:
    | ({ __type: "Contact" } & NexusGenRootTypes["Contact"])
    | ({ __type: "User" } & NexusGenRootTypes["User"]);
  UserOrContact:
    | ({ __type: "User" } & NexusGenRootTypes["User"])
    | ({ __type: "Contact" } & NexusGenRootTypes["Contact"]);
  UserOrPetitionAccess:
    | ({ __type: "User" } & NexusGenRootTypes["User"])
    | ({ __type: "PetitionAccess" } & NexusGenRootTypes["PetitionAccess"]);
  UserOrUserGroup:
    | ({ __type: "User" } & NexusGenRootTypes["User"])
    | ({ __type: "UserGroup" } & NexusGenRootTypes["UserGroup"]);
}

export type NexusGenRootTypes = NexusGenInterfaces &
  NexusGenObjects &
  NexusGenUnions;

export type NexusGenAllTypes = NexusGenRootTypes &
  NexusGenScalars &
  NexusGenEnums;

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
    id: NexusGenScalars["GID"]; // GID!
    user: NexusGenRootTypes["User"] | null; // User
  };
  AccessDeactivatedEvent: {
    // field return type
    access: NexusGenRootTypes["PetitionAccess"]; // PetitionAccess!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    user: NexusGenRootTypes["User"] | null; // User
  };
  AccessDelegatedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    newAccess: NexusGenRootTypes["PetitionAccess"]; // PetitionAccess!
    originalAccess: NexusGenRootTypes["PetitionAccess"]; // PetitionAccess!
  };
  AccessOpenedEvent: {
    // field return type
    access: NexusGenRootTypes["PetitionAccess"]; // PetitionAccess!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
  };
  CommentCreatedUserNotification: {
    // field return type
    comment: NexusGenRootTypes["PetitionFieldComment"]; // PetitionFieldComment!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    field: NexusGenRootTypes["PetitionField"]; // PetitionField!
    id: NexusGenScalars["GID"]; // GID!
    isRead: boolean; // Boolean!
    petition: NexusGenRootTypes["Petition"]; // Petition!
  };
  CommentDeletedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    deletedBy: NexusGenRootTypes["UserOrPetitionAccess"] | null; // UserOrPetitionAccess
    field: NexusGenRootTypes["PetitionField"] | null; // PetitionField
    id: NexusGenScalars["GID"]; // GID!
  };
  CommentPublishedEvent: {
    // field return type
    comment: NexusGenRootTypes["PetitionFieldComment"] | null; // PetitionFieldComment
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    field: NexusGenRootTypes["PetitionField"] | null; // PetitionField
    id: NexusGenScalars["GID"]; // GID!
  };
  Contact: {
    // field return type
    accesses: NexusGenRootTypes["PetitionAccessPagination"]; // PetitionAccessPagination!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    email: string; // String!
    firstName: string | null; // String
    fullName: string | null; // String
    id: NexusGenScalars["GID"]; // GID!
    lastName: string | null; // String
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  ContactPagination: {
    // field return type
    items: NexusGenRootTypes["Contact"][]; // [Contact!]!
    totalCount: number; // Int!
  };
  CreateFileUploadFieldAttachment: {
    // field return type
    attachment: NexusGenRootTypes["PetitionFieldAttachment"]; // PetitionFieldAttachment!
    presignedPostData: NexusGenRootTypes["AWSPresignedPostData"]; // AWSPresignedPostData!
  };
  CreateFileUploadReply: {
    // field return type
    presignedPostData: NexusGenRootTypes["AWSPresignedPostData"]; // AWSPresignedPostData!
    reply: NexusGenRootTypes["PublicPetitionFieldReply"]; // PublicPetitionFieldReply!
  };
  EffectivePetitionUserPermission: {
    // field return type
    isSubscribed: boolean; // Boolean!
    permissionType: NexusGenEnums["PetitionPermissionType"]; // PetitionPermissionType!
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
  GenerateUserAuthTokenResponse: {
    // field return type
    apiKey: string; // String!
    userAuthToken: NexusGenRootTypes["UserAuthenticationToken"]; // UserAuthenticationToken!
  };
  GroupPermissionAddedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    permissionGroup: NexusGenRootTypes["UserGroup"]; // UserGroup!
    permissionType: NexusGenEnums["PetitionPermissionType"]; // PetitionPermissionType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  GroupPermissionEditedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    permissionGroup: NexusGenRootTypes["UserGroup"]; // UserGroup!
    permissionType: NexusGenEnums["PetitionPermissionType"]; // PetitionPermissionType!
    user: NexusGenRootTypes["User"] | null; // User
  };
  GroupPermissionRemovedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    permissionGroup: NexusGenRootTypes["UserGroup"]; // UserGroup!
    user: NexusGenRootTypes["User"] | null; // User
  };
  MessageCancelledEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    message: NexusGenRootTypes["PetitionMessage"]; // PetitionMessage!
    user: NexusGenRootTypes["User"] | null; // User
  };
  MessageEmailBouncedUserNotification: {
    // field return type
    access: NexusGenRootTypes["PetitionAccess"]; // PetitionAccess!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    isRead: boolean; // Boolean!
    petition: NexusGenRootTypes["Petition"]; // Petition!
  };
  MessageScheduledEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    message: NexusGenRootTypes["PetitionMessage"]; // PetitionMessage!
  };
  MessageSentEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    message: NexusGenRootTypes["PetitionMessage"]; // PetitionMessage!
  };
  Mutation: {
    // field return type
    addPetitionPermission: NexusGenRootTypes["Petition"][]; // [Petition!]!
    addUsersToUserGroup: NexusGenRootTypes["UserGroup"]; // UserGroup!
    assignPetitionToUser: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    batchSendPetition: NexusGenRootTypes["SendPetitionResult"][]; // [SendPetitionResult!]!
    bulkCreateContacts: NexusGenRootTypes["Contact"][]; // [Contact!]!
    cancelScheduledMessage: NexusGenRootTypes["PetitionMessage"] | null; // PetitionMessage
    cancelSignatureRequest: NexusGenRootTypes["PetitionSignatureRequest"]; // PetitionSignatureRequest!
    changePassword: NexusGenEnums["ChangePasswordResult"]; // ChangePasswordResult!
    changePetitionFieldType: NexusGenRootTypes["PetitionBaseAndField"]; // PetitionBaseAndField!
    clonePetitionField: NexusGenRootTypes["PetitionBaseAndField"]; // PetitionBaseAndField!
    clonePetitions: NexusGenRootTypes["PetitionBase"][]; // [PetitionBase!]!
    cloneUserGroup: NexusGenRootTypes["UserGroup"][]; // [UserGroup!]!
    createContact: NexusGenRootTypes["Contact"]; // Contact!
    createFileUploadReply: NexusGenRootTypes["PetitionFieldReply"]; // PetitionFieldReply!
    createOrganization: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    createOrganizationUser: NexusGenRootTypes["User"]; // User!
    createPetition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    createPetitionField: NexusGenRootTypes["PetitionBaseAndField"]; // PetitionBaseAndField!
    createPetitionFieldAttachmentUploadLink: NexusGenRootTypes["CreateFileUploadFieldAttachment"]; // CreateFileUploadFieldAttachment!
    createPetitionFieldComment: NexusGenRootTypes["PetitionField"]; // PetitionField!
    createPetitionSubscription: NexusGenRootTypes["Subscription"]; // Subscription!
    createSimpleReply: NexusGenRootTypes["PetitionFieldReply"]; // PetitionFieldReply!
    createTag: NexusGenRootTypes["Tag"]; // Tag!
    createUser: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    createUserGroup: NexusGenRootTypes["UserGroup"]; // UserGroup!
    deactivateAccesses: NexusGenRootTypes["PetitionAccess"][]; // [PetitionAccess!]!
    deleteContacts: NexusGenEnums["Result"]; // Result!
    deletePetition: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    deletePetitionField: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    deletePetitionFieldComment: NexusGenRootTypes["PetitionField"]; // PetitionField!
    deletePetitionReply: NexusGenEnums["Result"]; // Result!
    deletePetitionSubscription: NexusGenEnums["Result"]; // Result!
    deletePetitions: NexusGenEnums["Result"]; // Result!
    deleteTag: NexusGenEnums["Result"]; // Result!
    deleteUserGroup: NexusGenEnums["Result"]; // Result!
    dynamicSelectFieldFileDownloadLink: NexusGenRootTypes["FileUploadDownloadLinkResult"]; // FileUploadDownloadLinkResult!
    editPetitionPermission: NexusGenRootTypes["Petition"][]; // [Petition!]!
    fileUploadReplyDownloadLink: NexusGenRootTypes["FileUploadDownloadLinkResult"]; // FileUploadDownloadLinkResult!
    generateUserAuthToken: NexusGenRootTypes["GenerateUserAuthTokenResponse"]; // GenerateUserAuthTokenResponse!
    petitionFieldAttachmentDownloadLink: NexusGenRootTypes["FileUploadDownloadLinkResult"]; // FileUploadDownloadLinkResult!
    petitionFieldAttachmentUploadComplete: NexusGenRootTypes["PetitionFieldAttachment"]; // PetitionFieldAttachment!
    publicCheckVerificationCode: NexusGenRootTypes["VerificationCodeCheck"]; // VerificationCodeCheck!
    publicCompletePetition: NexusGenRootTypes["PublicPetition"]; // PublicPetition!
    publicCreateCheckboxReply: NexusGenRootTypes["PublicPetitionFieldReply"]; // PublicPetitionFieldReply!
    publicCreateDynamicSelectReply: NexusGenRootTypes["PublicPetitionFieldReply"]; // PublicPetitionFieldReply!
    publicCreateFileUploadReply: NexusGenRootTypes["CreateFileUploadReply"]; // CreateFileUploadReply!
    publicCreatePetitionFieldComment: NexusGenRootTypes["PublicPetitionFieldComment"]; // PublicPetitionFieldComment!
    publicCreateSimpleReply: NexusGenRootTypes["PublicPetitionFieldReply"]; // PublicPetitionFieldReply!
    publicDelegateAccessToContact: NexusGenRootTypes["PublicPetitionAccess"]; // PublicPetitionAccess!
    publicDeletePetitionFieldComment: NexusGenEnums["Result"]; // Result!
    publicDeletePetitionReply: NexusGenEnums["Result"]; // Result!
    publicFileUploadReplyComplete: NexusGenRootTypes["PublicPetitionFieldReply"]; // PublicPetitionFieldReply!
    publicFileUploadReplyDownloadLink: NexusGenRootTypes["FileUploadDownloadLinkResult"]; // FileUploadDownloadLinkResult!
    publicMarkPetitionFieldCommentsAsRead: NexusGenRootTypes["PublicPetitionFieldComment"][]; // [PublicPetitionFieldComment!]!
    publicPetitionFieldAttachmentDownloadLink: NexusGenRootTypes["FileUploadDownloadLinkResult"]; // FileUploadDownloadLinkResult!
    publicSendVerificationCode: NexusGenRootTypes["VerificationCodeRequest"]; // VerificationCodeRequest!
    publicUpdateCheckboxReply: NexusGenRootTypes["PublicPetitionFieldReply"]; // PublicPetitionFieldReply!
    publicUpdateDynamicSelectReply: NexusGenRootTypes["PublicPetitionFieldReply"]; // PublicPetitionFieldReply!
    publicUpdatePetitionFieldComment: NexusGenRootTypes["PublicPetitionFieldComment"]; // PublicPetitionFieldComment!
    publicUpdateSimpleReply: NexusGenRootTypes["PublicPetitionFieldReply"]; // PublicPetitionFieldReply!
    reactivateAccesses: NexusGenRootTypes["PetitionAccess"][]; // [PetitionAccess!]!
    removePetitionFieldAttachment: NexusGenEnums["Result"]; // Result!
    removePetitionPermission: NexusGenRootTypes["Petition"][]; // [Petition!]!
    removeUsersFromGroup: NexusGenRootTypes["UserGroup"]; // UserGroup!
    reopenPetition: NexusGenRootTypes["Petition"]; // Petition!
    resetSignaturitOrganizationBranding: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    resetUserPassword: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    revokeUserAuthToken: NexusGenEnums["Result"]; // Result!
    sendPetition: NexusGenRootTypes["SendPetitionResult"]; // SendPetitionResult!
    sendPetitionClosedNotification: NexusGenRootTypes["Petition"]; // Petition!
    sendReminders: NexusGenEnums["Result"]; // Result!
    signedPetitionDownloadLink: NexusGenRootTypes["FileUploadDownloadLinkResult"]; // FileUploadDownloadLinkResult!
    startSignatureRequest: NexusGenRootTypes["PetitionSignatureRequest"]; // PetitionSignatureRequest!
    switchAutomaticReminders: NexusGenRootTypes["PetitionAccess"][]; // [PetitionAccess!]!
    tagPetition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    transferPetitionOwnership: NexusGenRootTypes["Petition"][]; // [Petition!]!
    untagPetition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    updateContact: NexusGenRootTypes["Contact"]; // Contact!
    updateFieldPositions: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    updateOnboardingStatus: NexusGenRootTypes["User"]; // User!
    updateOrganizationLogo: NexusGenRootTypes["Organization"]; // Organization!
    updatePetition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
    updatePetitionField: NexusGenRootTypes["PetitionBaseAndField"]; // PetitionBaseAndField!
    updatePetitionFieldComment: NexusGenRootTypes["PetitionField"]; // PetitionField!
    updatePetitionFieldCommentsReadStatus: NexusGenRootTypes["PetitionFieldComment"][]; // [PetitionFieldComment!]!
    updatePetitionFieldRepliesStatus: NexusGenRootTypes["PetitionWithFieldAndReplies"]; // PetitionWithFieldAndReplies!
    updatePetitionFieldReplyMetadata: NexusGenRootTypes["PetitionFieldReply"]; // PetitionFieldReply!
    updatePetitionPermissionSubscription: NexusGenRootTypes["Petition"]; // Petition!
    updatePetitionUserNotificationReadStatus: NexusGenRootTypes["PetitionUserNotification"][]; // [PetitionUserNotification!]!
    updateSignatureRequestMetadata: NexusGenRootTypes["PetitionSignatureRequest"]; // PetitionSignatureRequest!
    updateSimpleReply: NexusGenRootTypes["PetitionFieldReply"]; // PetitionFieldReply!
    updateTag: NexusGenRootTypes["Tag"]; // Tag!
    updateUser: NexusGenRootTypes["User"]; // User!
    updateUserGroup: NexusGenRootTypes["UserGroup"]; // UserGroup!
    updateUserStatus: NexusGenRootTypes["User"][]; // [User!]!
    uploadDynamicSelectFieldFile: NexusGenRootTypes["PetitionField"]; // PetitionField!
    validatePetitionFields: NexusGenRootTypes["PetitionAndPartialFields"]; // PetitionAndPartialFields!
    verifyPublicAccess: NexusGenRootTypes["PublicAccessVerification"]; // PublicAccessVerification!
  };
  OrgIntegration: {
    // field return type
    name: string; // String!
    provider: string; // String!
    type: NexusGenEnums["IntegrationType"]; // IntegrationType!
  };
  Organization: {
    // field return type
    _id: number; // Int!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    hasSsoProvider: boolean; // Boolean!
    id: NexusGenScalars["GID"]; // GID!
    identifier: string; // String!
    integrations: NexusGenRootTypes["OrgIntegration"][]; // [OrgIntegration!]!
    logoUrl: string | null; // String
    name: string; // String!
    status: NexusGenEnums["OrganizationStatus"]; // OrganizationStatus!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
    userCount: number; // Int!
    users: NexusGenRootTypes["UserPagination"]; // UserPagination!
  };
  OrganizationPagination: {
    // field return type
    items: NexusGenRootTypes["Organization"][]; // [Organization!]!
    totalCount: number; // Int!
  };
  OwnershipTransferredEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    owner: NexusGenRootTypes["User"] | null; // User
    previousOwner: NexusGenRootTypes["User"] | null; // User
    user: NexusGenRootTypes["User"] | null; // User
  };
  Petition: {
    // field return type
    accesses: NexusGenRootTypes["PetitionAccess"][]; // [PetitionAccess!]!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    currentSignatureRequest:
      | NexusGenRootTypes["PetitionSignatureRequest"]
      | null; // PetitionSignatureRequest
    deadline: NexusGenScalars["DateTime"] | null; // DateTime
    emailBody: NexusGenScalars["JSON"] | null; // JSON
    emailSubject: string | null; // String
    events: NexusGenRootTypes["PetitionEventPagination"]; // PetitionEventPagination!
    fieldCount: number; // Int!
    fields: NexusGenRootTypes["PetitionField"][]; // [PetitionField!]!
    hasCommentsEnabled: boolean; // Boolean!
    id: NexusGenScalars["GID"]; // GID!
    isRecipientViewContentsHidden: boolean; // Boolean!
    locale: NexusGenEnums["PetitionLocale"]; // PetitionLocale!
    myEffectivePermission:
      | NexusGenRootTypes["EffectivePetitionUserPermission"]
      | null; // EffectivePetitionUserPermission
    name: string | null; // String
    organization: NexusGenRootTypes["Organization"]; // Organization!
    owner: NexusGenRootTypes["User"]; // User!
    permissions: NexusGenRootTypes["PetitionPermission"][]; // [PetitionPermission!]!
    progress: NexusGenRootTypes["PetitionProgress"]; // PetitionProgress!
    remindersConfig: NexusGenRootTypes["RemindersConfig"] | null; // RemindersConfig
    signatureConfig: NexusGenRootTypes["SignatureConfig"] | null; // SignatureConfig
    signatureRequests: NexusGenRootTypes["PetitionSignatureRequest"][] | null; // [PetitionSignatureRequest!]
    skipForwardSecurity: boolean; // Boolean!
    status: NexusGenEnums["PetitionStatus"]; // PetitionStatus!
    subscriptions: NexusGenRootTypes["Subscription"][]; // [Subscription!]!
    tags: NexusGenRootTypes["Tag"][]; // [Tag!]!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  PetitionAccess: {
    // field return type
    contact: NexusGenRootTypes["Contact"] | null; // Contact
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    granter: NexusGenRootTypes["User"] | null; // User
    id: NexusGenScalars["GID"]; // GID!
    nextReminderAt: NexusGenScalars["DateTime"] | null; // DateTime
    petition: NexusGenRootTypes["Petition"] | null; // Petition
    reminderCount: number; // Int!
    remindersActive: boolean; // Boolean!
    remindersConfig: NexusGenRootTypes["RemindersConfig"] | null; // RemindersConfig
    remindersLeft: number; // Int!
    status: NexusGenEnums["PetitionAccessStatus"]; // PetitionAccessStatus!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  PetitionAccessPagination: {
    // field return type
    items: NexusGenRootTypes["PetitionAccess"][]; // [PetitionAccess!]!
    totalCount: number; // Int!
  };
  PetitionAndField: {
    // field return type
    field: NexusGenRootTypes["PetitionField"]; // PetitionField!
    petition: NexusGenRootTypes["Petition"]; // Petition!
  };
  PetitionAndPartialFields: {
    // field return type
    fields: NexusGenRootTypes["PetitionField"][]; // [PetitionField!]!
    petition: NexusGenRootTypes["Petition"]; // Petition!
  };
  PetitionBasePagination: {
    // field return type
    items: NexusGenRootTypes["PetitionBase"][]; // [PetitionBase!]!
    totalCount: number; // Int!
  };
  PetitionClonedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    user: NexusGenRootTypes["User"] | null; // User
  };
  PetitionClosedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    user: NexusGenRootTypes["User"] | null; // User
  };
  PetitionClosedNotifiedEvent: {
    // field return type
    access: NexusGenRootTypes["PetitionAccess"]; // PetitionAccess!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    user: NexusGenRootTypes["User"] | null; // User
  };
  PetitionCompletedEvent: {
    // field return type
    access: NexusGenRootTypes["PetitionAccess"]; // PetitionAccess!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
  };
  PetitionCompletedUserNotification: {
    // field return type
    access: NexusGenRootTypes["PetitionAccess"]; // PetitionAccess!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    isRead: boolean; // Boolean!
    petition: NexusGenRootTypes["Petition"]; // Petition!
  };
  PetitionCreatedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    user: NexusGenRootTypes["User"] | null; // User
  };
  PetitionDeletedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
  };
  PetitionEventPagination: {
    // field return type
    items: NexusGenRootTypes["PetitionEvent"][]; // [PetitionEvent!]!
    totalCount: number; // Int!
  };
  PetitionField: {
    // field return type
    attachments: NexusGenRootTypes["PetitionFieldAttachment"][]; // [PetitionFieldAttachment!]!
    comments: NexusGenRootTypes["PetitionFieldComment"][]; // [PetitionFieldComment!]!
    description: string | null; // String
    id: NexusGenScalars["GID"]; // GID!
    isFixed: boolean; // Boolean!
    isReadOnly: boolean; // Boolean!
    multiple: boolean; // Boolean!
    optional: boolean; // Boolean!
    options: NexusGenScalars["JSONObject"]; // JSONObject!
    position: number; // Int!
    replies: NexusGenRootTypes["PetitionFieldReply"][]; // [PetitionFieldReply!]!
    title: string | null; // String
    type: NexusGenEnums["PetitionFieldType"]; // PetitionFieldType!
    validated: boolean; // Boolean!
    visibility: NexusGenScalars["JSONObject"] | null; // JSONObject
  };
  PetitionFieldAttachment: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    file: NexusGenRootTypes["FileUpload"]; // FileUpload!
    id: NexusGenScalars["GID"]; // GID!
  };
  PetitionFieldComment: {
    // field return type
    author: NexusGenRootTypes["UserOrPetitionAccess"] | null; // UserOrPetitionAccess
    content: string; // String!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    isEdited: boolean; // Boolean!
    isInternal: boolean; // Boolean!
    isUnread: boolean; // Boolean!
  };
  PetitionFieldReply: {
    // field return type
    content: NexusGenScalars["JSONObject"]; // JSONObject!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    field: NexusGenRootTypes["PetitionField"] | null; // PetitionField
    id: NexusGenScalars["GID"]; // GID!
    metadata: NexusGenScalars["JSONObject"]; // JSONObject!
    status: NexusGenEnums["PetitionFieldReplyStatus"]; // PetitionFieldReplyStatus!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
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
    openedAt: NexusGenScalars["DateTime"] | null; // DateTime
    scheduledAt: NexusGenScalars["DateTime"] | null; // DateTime
    sender: NexusGenRootTypes["User"]; // User!
    sentAt: NexusGenScalars["DateTime"] | null; // DateTime
    status: NexusGenEnums["PetitionMessageStatus"]; // PetitionMessageStatus!
  };
  PetitionProgress: {
    // field return type
    optional: number; // Int!
    replied: number; // Int!
    total: number; // Int!
    validated: number; // Int!
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
  PetitionReopenedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    user: NexusGenRootTypes["User"] | null; // User
  };
  PetitionSharedUserNotification: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    isRead: boolean; // Boolean!
    owner: NexusGenRootTypes["User"]; // User!
    permissionType: NexusGenEnums["PetitionPermissionTypeRW"]; // PetitionPermissionTypeRW!
    petition: NexusGenRootTypes["Petition"]; // Petition!
    sharedWith: NexusGenRootTypes["UserOrUserGroup"][]; // [UserOrUserGroup!]!
  };
  PetitionSignatureRequest: {
    // field return type
    auditTrailFilename: string | null; // String
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    metadata: NexusGenScalars["JSONObject"]; // JSONObject!
    petition: NexusGenRootTypes["Petition"]; // Petition!
    signatureConfig: NexusGenRootTypes["SignatureConfig"]; // SignatureConfig!
    signedDocumentFilename: string | null; // String
    status: NexusGenEnums["PetitionSignatureRequestStatus"]; // PetitionSignatureRequestStatus!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  PetitionTemplate: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    description: string | null; // String
    emailBody: NexusGenScalars["JSON"] | null; // JSON
    emailSubject: string | null; // String
    fieldCount: number; // Int!
    fields: NexusGenRootTypes["PetitionField"][]; // [PetitionField!]!
    hasCommentsEnabled: boolean; // Boolean!
    id: NexusGenScalars["GID"]; // GID!
    isPublic: boolean; // Boolean!
    isRecipientViewContentsHidden: boolean; // Boolean!
    locale: NexusGenEnums["PetitionLocale"]; // PetitionLocale!
    myEffectivePermission:
      | NexusGenRootTypes["EffectivePetitionUserPermission"]
      | null; // EffectivePetitionUserPermission
    name: string | null; // String
    organization: NexusGenRootTypes["Organization"]; // Organization!
    owner: NexusGenRootTypes["User"]; // User!
    permissions: NexusGenRootTypes["PetitionPermission"][]; // [PetitionPermission!]!
    skipForwardSecurity: boolean; // Boolean!
    tags: NexusGenRootTypes["Tag"][]; // [Tag!]!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  PetitionTemplateAndField: {
    // field return type
    field: NexusGenRootTypes["PetitionField"]; // PetitionField!
    petition: NexusGenRootTypes["PetitionTemplate"]; // PetitionTemplate!
  };
  PetitionTemplatePagination: {
    // field return type
    items: NexusGenRootTypes["PetitionTemplate"][]; // [PetitionTemplate!]!
    totalCount: number; // Int!
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
  PetitionUserNotificationPagination: {
    // field return type
    items: NexusGenRootTypes["PetitionUserNotification"][]; // [PetitionUserNotification!]!
    totalCount: number; // Int!
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
  PetitionWithFieldAndReplies: {
    // field return type
    field: NexusGenRootTypes["PetitionField"]; // PetitionField!
    petition: NexusGenRootTypes["Petition"]; // Petition!
    replies: NexusGenRootTypes["PetitionFieldReply"][]; // [PetitionFieldReply!]!
  };
  PublicAccessVerification: {
    // field return type
    cookieName: string | null; // String
    cookieValue: string | null; // String
    email: string | null; // String
    isAllowed: boolean; // Boolean!
    orgLogoUrl: string | null; // String
    orgName: string | null; // String
  };
  PublicContact: {
    // field return type
    email: string; // String!
    firstName: string | null; // String
    fullName: string | null; // String
    id: NexusGenScalars["GID"]; // GID!
    lastName: string | null; // String
  };
  PublicOrganization: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    identifier: string; // String!
    logoUrl: string | null; // String
    name: string; // String!
  };
  PublicPetition: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    deadline: NexusGenScalars["DateTime"] | null; // DateTime
    fields: NexusGenRootTypes["PublicPetitionField"][]; // [PublicPetitionField!]!
    hasCommentsEnabled: boolean; // Boolean!
    id: NexusGenScalars["GID"]; // GID!
    isRecipientViewContentsHidden: boolean; // Boolean!
    locale: NexusGenEnums["PetitionLocale"]; // PetitionLocale!
    recipients: NexusGenRootTypes["PublicContact"][]; // [PublicContact!]!
    signature: NexusGenRootTypes["PublicSignatureConfig"] | null; // PublicSignatureConfig
    signatureStatus: NexusGenEnums["PublicSignatureStatus"] | null; // PublicSignatureStatus
    status: NexusGenEnums["PetitionStatus"]; // PetitionStatus!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  PublicPetitionAccess: {
    // field return type
    contact: NexusGenRootTypes["PublicContact"] | null; // PublicContact
    granter: NexusGenRootTypes["PublicUser"] | null; // PublicUser
    message: NexusGenRootTypes["PublicPetitionMessage"] | null; // PublicPetitionMessage
    petition: NexusGenRootTypes["PublicPetition"] | null; // PublicPetition
  };
  PublicPetitionField: {
    // field return type
    attachments: NexusGenRootTypes["PetitionFieldAttachment"][]; // [PetitionFieldAttachment!]!
    commentCount: number; // Int!
    comments: NexusGenRootTypes["PublicPetitionFieldComment"][]; // [PublicPetitionFieldComment!]!
    description: string | null; // String
    id: NexusGenScalars["GID"]; // GID!
    isReadOnly: boolean; // Boolean!
    multiple: boolean; // Boolean!
    optional: boolean; // Boolean!
    options: NexusGenScalars["JSONObject"]; // JSONObject!
    replies: NexusGenRootTypes["PublicPetitionFieldReply"][]; // [PublicPetitionFieldReply!]!
    title: string | null; // String
    type: NexusGenEnums["PetitionFieldType"]; // PetitionFieldType!
    unreadCommentCount: number; // Int!
    validated: boolean; // Boolean!
    visibility: NexusGenScalars["JSONObject"] | null; // JSONObject
  };
  PublicPetitionFieldComment: {
    // field return type
    author: NexusGenRootTypes["PublicUserOrContact"] | null; // PublicUserOrContact
    content: string; // String!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    isUnread: boolean; // Boolean!
  };
  PublicPetitionFieldReply: {
    // field return type
    content: NexusGenScalars["JSONObject"]; // JSONObject!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    status: NexusGenEnums["PetitionFieldReplyStatus"]; // PetitionFieldReplyStatus!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  PublicPetitionMessage: {
    // field return type
    id: NexusGenScalars["GID"]; // GID!
    subject: string | null; // String
  };
  PublicSignatureConfig: {
    // field return type
    review: boolean; // Boolean!
    signers: Array<NexusGenRootTypes["PublicContact"] | null>; // [PublicContact]!
  };
  PublicUser: {
    // field return type
    email: string; // String!
    firstName: string | null; // String
    fullName: string | null; // String
    id: NexusGenScalars["GID"]; // GID!
    lastName: string | null; // String
    organization: NexusGenRootTypes["PublicOrganization"]; // PublicOrganization!
  };
  Query: {
    // field return type
    access: NexusGenRootTypes["PublicPetitionAccess"] | null; // PublicPetitionAccess
    contact: NexusGenRootTypes["Contact"] | null; // Contact
    contacts: NexusGenRootTypes["ContactPagination"]; // ContactPagination!
    contactsByEmail: Array<NexusGenRootTypes["Contact"] | null>; // [Contact]!
    emailIsAvailable: boolean; // Boolean!
    globalIdDecode: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    globalIdEncode: NexusGenRootTypes["SupportMethodResponse"]; // SupportMethodResponse!
    me: NexusGenRootTypes["User"]; // User!
    organization: NexusGenRootTypes["Organization"] | null; // Organization
    organizations: NexusGenRootTypes["OrganizationPagination"]; // OrganizationPagination!
    petition: NexusGenRootTypes["PetitionBase"] | null; // PetitionBase
    petitionAuthToken: NexusGenRootTypes["Petition"] | null; // Petition
    petitionFieldComments: NexusGenRootTypes["PublicPetitionFieldComment"][]; // [PublicPetitionFieldComment!]!
    petitions: NexusGenRootTypes["PetitionBasePagination"]; // PetitionBasePagination!
    petitionsById: Array<NexusGenRootTypes["PetitionBase"] | null>; // [PetitionBase]!
    publicOrgLogoUrl: string | null; // String
    publicTemplates: NexusGenRootTypes["PetitionTemplatePagination"]; // PetitionTemplatePagination!
    searchUsers: NexusGenRootTypes["UserOrUserGroup"][]; // [UserOrUserGroup!]!
    tags: NexusGenRootTypes["TagPagination"]; // TagPagination!
    userGroup: NexusGenRootTypes["UserGroup"] | null; // UserGroup
    userGroups: NexusGenRootTypes["UserGroupPagination"]; // UserGroupPagination!
  };
  ReminderSentEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    reminder: NexusGenRootTypes["PetitionReminder"]; // PetitionReminder!
  };
  RemindersConfig: {
    // field return type
    offset: number; // Int!
    time: string; // String!
    timezone: string; // String!
    weekdaysOnly: boolean; // Boolean!
  };
  ReplyCreatedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    createdBy: NexusGenRootTypes["UserOrPetitionAccess"] | null; // UserOrPetitionAccess
    field: NexusGenRootTypes["PetitionField"] | null; // PetitionField
    id: NexusGenScalars["GID"]; // GID!
    reply: NexusGenRootTypes["PetitionFieldReply"] | null; // PetitionFieldReply
  };
  ReplyDeletedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    deletedBy: NexusGenRootTypes["UserOrPetitionAccess"] | null; // UserOrPetitionAccess
    field: NexusGenRootTypes["PetitionField"] | null; // PetitionField
    id: NexusGenScalars["GID"]; // GID!
  };
  ReplyUpdatedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    field: NexusGenRootTypes["PetitionField"] | null; // PetitionField
    id: NexusGenScalars["GID"]; // GID!
    reply: NexusGenRootTypes["PetitionFieldReply"] | null; // PetitionFieldReply
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
    cancellerReason: string | null; // String
    contact: NexusGenRootTypes["Contact"] | null; // Contact
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    user: NexusGenRootTypes["User"] | null; // User
  };
  SignatureCancelledUserNotification: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    isRead: boolean; // Boolean!
    petition: NexusGenRootTypes["Petition"]; // Petition!
  };
  SignatureCompletedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
  };
  SignatureCompletedUserNotification: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    isRead: boolean; // Boolean!
    petition: NexusGenRootTypes["Petition"]; // Petition!
  };
  SignatureConfig: {
    // field return type
    contacts: Array<NexusGenRootTypes["Contact"] | null>; // [Contact]!
    provider: string; // String!
    review: boolean; // Boolean!
    timezone: string; // String!
    title: string; // String!
  };
  SignatureStartedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
  };
  Subscription: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    endpoint: string; // String!
    id: NexusGenScalars["GID"]; // GID!
    petition: NexusGenRootTypes["Petition"]; // Petition!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  SupportMethodResponse: {
    // field return type
    message: string | null; // String
    result: NexusGenEnums["Result"]; // Result!
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
  TemplateUsedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
  };
  User: {
    // field return type
    authenticationTokens: NexusGenRootTypes["UserAuthenticationTokenPagination"]; // UserAuthenticationTokenPagination!
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    email: string; // String!
    firstName: string | null; // String
    fullName: string | null; // String
    hasFeatureFlag: boolean; // Boolean!
    id: NexusGenScalars["GID"]; // GID!
    isSsoUser: boolean; // Boolean!
    isSuperAdmin: boolean; // Boolean!
    lastActiveAt: NexusGenScalars["DateTime"] | null; // DateTime
    lastName: string | null; // String
    notifications: NexusGenRootTypes["PetitionUserNotification"][]; // [PetitionUserNotification!]!
    onboardingStatus: NexusGenScalars["JSONObject"]; // JSONObject!
    organization: NexusGenRootTypes["Organization"]; // Organization!
    role: NexusGenEnums["OrganizationRole"]; // OrganizationRole!
    status: NexusGenEnums["UserStatus"]; // UserStatus!
    unreadNotificationIds: string[]; // [String!]!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  UserAuthenticationToken: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    lastUsedAt: NexusGenScalars["DateTime"] | null; // DateTime
    tokenName: string; // String!
  };
  UserAuthenticationTokenPagination: {
    // field return type
    items: NexusGenRootTypes["UserAuthenticationToken"][]; // [UserAuthenticationToken!]!
    totalCount: number; // Int!
  };
  UserGroup: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
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
  UserPagination: {
    // field return type
    items: NexusGenRootTypes["User"][]; // [User!]!
    totalCount: number; // Int!
  };
  UserPermissionAddedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    permissionType: NexusGenEnums["PetitionPermissionType"]; // PetitionPermissionType!
    permissionUser: NexusGenRootTypes["User"] | null; // User
    user: NexusGenRootTypes["User"] | null; // User
  };
  UserPermissionEditedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    permissionType: NexusGenEnums["PetitionPermissionType"]; // PetitionPermissionType!
    permissionUser: NexusGenRootTypes["User"] | null; // User
    user: NexusGenRootTypes["User"] | null; // User
  };
  UserPermissionRemovedEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
    permissionUser: NexusGenRootTypes["User"] | null; // User
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
  PetitionBase: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    emailBody: NexusGenScalars["JSON"] | null; // JSON
    emailSubject: string | null; // String
    fieldCount: number; // Int!
    fields: NexusGenRootTypes["PetitionField"][]; // [PetitionField!]!
    hasCommentsEnabled: boolean; // Boolean!
    id: NexusGenScalars["GID"]; // GID!
    isRecipientViewContentsHidden: boolean; // Boolean!
    locale: NexusGenEnums["PetitionLocale"]; // PetitionLocale!
    myEffectivePermission:
      | NexusGenRootTypes["EffectivePetitionUserPermission"]
      | null; // EffectivePetitionUserPermission
    name: string | null; // String
    organization: NexusGenRootTypes["Organization"]; // Organization!
    owner: NexusGenRootTypes["User"]; // User!
    permissions: NexusGenRootTypes["PetitionPermission"][]; // [PetitionPermission!]!
    skipForwardSecurity: boolean; // Boolean!
    tags: NexusGenRootTypes["Tag"][]; // [Tag!]!
    updatedAt: NexusGenScalars["DateTime"]; // DateTime!
  };
  PetitionBaseAndField: {
    // field return type
    field: NexusGenRootTypes["PetitionField"]; // PetitionField!
    petition: NexusGenRootTypes["PetitionBase"]; // PetitionBase!
  };
  PetitionEvent: {
    // field return type
    createdAt: NexusGenScalars["DateTime"]; // DateTime!
    id: NexusGenScalars["GID"]; // GID!
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
    petition: NexusGenRootTypes["Petition"]; // Petition!
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
    id: "GID";
    user: "User";
  };
  AccessDeactivatedEvent: {
    // field return type name
    access: "PetitionAccess";
    createdAt: "DateTime";
    id: "GID";
    user: "User";
  };
  AccessDelegatedEvent: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
    newAccess: "PetitionAccess";
    originalAccess: "PetitionAccess";
  };
  AccessOpenedEvent: {
    // field return type name
    access: "PetitionAccess";
    createdAt: "DateTime";
    id: "GID";
  };
  CommentCreatedUserNotification: {
    // field return type name
    comment: "PetitionFieldComment";
    createdAt: "DateTime";
    field: "PetitionField";
    id: "GID";
    isRead: "Boolean";
    petition: "Petition";
  };
  CommentDeletedEvent: {
    // field return type name
    createdAt: "DateTime";
    deletedBy: "UserOrPetitionAccess";
    field: "PetitionField";
    id: "GID";
  };
  CommentPublishedEvent: {
    // field return type name
    comment: "PetitionFieldComment";
    createdAt: "DateTime";
    field: "PetitionField";
    id: "GID";
  };
  Contact: {
    // field return type name
    accesses: "PetitionAccessPagination";
    createdAt: "DateTime";
    email: "String";
    firstName: "String";
    fullName: "String";
    id: "GID";
    lastName: "String";
    updatedAt: "DateTime";
  };
  ContactPagination: {
    // field return type name
    items: "Contact";
    totalCount: "Int";
  };
  CreateFileUploadFieldAttachment: {
    // field return type name
    attachment: "PetitionFieldAttachment";
    presignedPostData: "AWSPresignedPostData";
  };
  CreateFileUploadReply: {
    // field return type name
    presignedPostData: "AWSPresignedPostData";
    reply: "PublicPetitionFieldReply";
  };
  EffectivePetitionUserPermission: {
    // field return type name
    isSubscribed: "Boolean";
    permissionType: "PetitionPermissionType";
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
  GenerateUserAuthTokenResponse: {
    // field return type name
    apiKey: "String";
    userAuthToken: "UserAuthenticationToken";
  };
  GroupPermissionAddedEvent: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
    permissionGroup: "UserGroup";
    permissionType: "PetitionPermissionType";
    user: "User";
  };
  GroupPermissionEditedEvent: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
    permissionGroup: "UserGroup";
    permissionType: "PetitionPermissionType";
    user: "User";
  };
  GroupPermissionRemovedEvent: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
    permissionGroup: "UserGroup";
    user: "User";
  };
  MessageCancelledEvent: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
    message: "PetitionMessage";
    user: "User";
  };
  MessageEmailBouncedUserNotification: {
    // field return type name
    access: "PetitionAccess";
    createdAt: "DateTime";
    id: "GID";
    isRead: "Boolean";
    petition: "Petition";
  };
  MessageScheduledEvent: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
    message: "PetitionMessage";
  };
  MessageSentEvent: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
    message: "PetitionMessage";
  };
  Mutation: {
    // field return type name
    addPetitionPermission: "Petition";
    addUsersToUserGroup: "UserGroup";
    assignPetitionToUser: "SupportMethodResponse";
    batchSendPetition: "SendPetitionResult";
    bulkCreateContacts: "Contact";
    cancelScheduledMessage: "PetitionMessage";
    cancelSignatureRequest: "PetitionSignatureRequest";
    changePassword: "ChangePasswordResult";
    changePetitionFieldType: "PetitionBaseAndField";
    clonePetitionField: "PetitionBaseAndField";
    clonePetitions: "PetitionBase";
    cloneUserGroup: "UserGroup";
    createContact: "Contact";
    createFileUploadReply: "PetitionFieldReply";
    createOrganization: "SupportMethodResponse";
    createOrganizationUser: "User";
    createPetition: "PetitionBase";
    createPetitionField: "PetitionBaseAndField";
    createPetitionFieldAttachmentUploadLink: "CreateFileUploadFieldAttachment";
    createPetitionFieldComment: "PetitionField";
    createPetitionSubscription: "Subscription";
    createSimpleReply: "PetitionFieldReply";
    createTag: "Tag";
    createUser: "SupportMethodResponse";
    createUserGroup: "UserGroup";
    deactivateAccesses: "PetitionAccess";
    deleteContacts: "Result";
    deletePetition: "SupportMethodResponse";
    deletePetitionField: "PetitionBase";
    deletePetitionFieldComment: "PetitionField";
    deletePetitionReply: "Result";
    deletePetitionSubscription: "Result";
    deletePetitions: "Result";
    deleteTag: "Result";
    deleteUserGroup: "Result";
    dynamicSelectFieldFileDownloadLink: "FileUploadDownloadLinkResult";
    editPetitionPermission: "Petition";
    fileUploadReplyDownloadLink: "FileUploadDownloadLinkResult";
    generateUserAuthToken: "GenerateUserAuthTokenResponse";
    petitionFieldAttachmentDownloadLink: "FileUploadDownloadLinkResult";
    petitionFieldAttachmentUploadComplete: "PetitionFieldAttachment";
    publicCheckVerificationCode: "VerificationCodeCheck";
    publicCompletePetition: "PublicPetition";
    publicCreateCheckboxReply: "PublicPetitionFieldReply";
    publicCreateDynamicSelectReply: "PublicPetitionFieldReply";
    publicCreateFileUploadReply: "CreateFileUploadReply";
    publicCreatePetitionFieldComment: "PublicPetitionFieldComment";
    publicCreateSimpleReply: "PublicPetitionFieldReply";
    publicDelegateAccessToContact: "PublicPetitionAccess";
    publicDeletePetitionFieldComment: "Result";
    publicDeletePetitionReply: "Result";
    publicFileUploadReplyComplete: "PublicPetitionFieldReply";
    publicFileUploadReplyDownloadLink: "FileUploadDownloadLinkResult";
    publicMarkPetitionFieldCommentsAsRead: "PublicPetitionFieldComment";
    publicPetitionFieldAttachmentDownloadLink: "FileUploadDownloadLinkResult";
    publicSendVerificationCode: "VerificationCodeRequest";
    publicUpdateCheckboxReply: "PublicPetitionFieldReply";
    publicUpdateDynamicSelectReply: "PublicPetitionFieldReply";
    publicUpdatePetitionFieldComment: "PublicPetitionFieldComment";
    publicUpdateSimpleReply: "PublicPetitionFieldReply";
    reactivateAccesses: "PetitionAccess";
    removePetitionFieldAttachment: "Result";
    removePetitionPermission: "Petition";
    removeUsersFromGroup: "UserGroup";
    reopenPetition: "Petition";
    resetSignaturitOrganizationBranding: "SupportMethodResponse";
    resetUserPassword: "SupportMethodResponse";
    revokeUserAuthToken: "Result";
    sendPetition: "SendPetitionResult";
    sendPetitionClosedNotification: "Petition";
    sendReminders: "Result";
    signedPetitionDownloadLink: "FileUploadDownloadLinkResult";
    startSignatureRequest: "PetitionSignatureRequest";
    switchAutomaticReminders: "PetitionAccess";
    tagPetition: "PetitionBase";
    transferPetitionOwnership: "Petition";
    untagPetition: "PetitionBase";
    updateContact: "Contact";
    updateFieldPositions: "PetitionBase";
    updateOnboardingStatus: "User";
    updateOrganizationLogo: "Organization";
    updatePetition: "PetitionBase";
    updatePetitionField: "PetitionBaseAndField";
    updatePetitionFieldComment: "PetitionField";
    updatePetitionFieldCommentsReadStatus: "PetitionFieldComment";
    updatePetitionFieldRepliesStatus: "PetitionWithFieldAndReplies";
    updatePetitionFieldReplyMetadata: "PetitionFieldReply";
    updatePetitionPermissionSubscription: "Petition";
    updatePetitionUserNotificationReadStatus: "PetitionUserNotification";
    updateSignatureRequestMetadata: "PetitionSignatureRequest";
    updateSimpleReply: "PetitionFieldReply";
    updateTag: "Tag";
    updateUser: "User";
    updateUserGroup: "UserGroup";
    updateUserStatus: "User";
    uploadDynamicSelectFieldFile: "PetitionField";
    validatePetitionFields: "PetitionAndPartialFields";
    verifyPublicAccess: "PublicAccessVerification";
  };
  OrgIntegration: {
    // field return type name
    name: "String";
    provider: "String";
    type: "IntegrationType";
  };
  Organization: {
    // field return type name
    _id: "Int";
    createdAt: "DateTime";
    hasSsoProvider: "Boolean";
    id: "GID";
    identifier: "String";
    integrations: "OrgIntegration";
    logoUrl: "String";
    name: "String";
    status: "OrganizationStatus";
    updatedAt: "DateTime";
    userCount: "Int";
    users: "UserPagination";
  };
  OrganizationPagination: {
    // field return type name
    items: "Organization";
    totalCount: "Int";
  };
  OwnershipTransferredEvent: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
    owner: "User";
    previousOwner: "User";
    user: "User";
  };
  Petition: {
    // field return type name
    accesses: "PetitionAccess";
    createdAt: "DateTime";
    currentSignatureRequest: "PetitionSignatureRequest";
    deadline: "DateTime";
    emailBody: "JSON";
    emailSubject: "String";
    events: "PetitionEventPagination";
    fieldCount: "Int";
    fields: "PetitionField";
    hasCommentsEnabled: "Boolean";
    id: "GID";
    isRecipientViewContentsHidden: "Boolean";
    locale: "PetitionLocale";
    myEffectivePermission: "EffectivePetitionUserPermission";
    name: "String";
    organization: "Organization";
    owner: "User";
    permissions: "PetitionPermission";
    progress: "PetitionProgress";
    remindersConfig: "RemindersConfig";
    signatureConfig: "SignatureConfig";
    signatureRequests: "PetitionSignatureRequest";
    skipForwardSecurity: "Boolean";
    status: "PetitionStatus";
    subscriptions: "Subscription";
    tags: "Tag";
    updatedAt: "DateTime";
  };
  PetitionAccess: {
    // field return type name
    contact: "Contact";
    createdAt: "DateTime";
    granter: "User";
    id: "GID";
    nextReminderAt: "DateTime";
    petition: "Petition";
    reminderCount: "Int";
    remindersActive: "Boolean";
    remindersConfig: "RemindersConfig";
    remindersLeft: "Int";
    status: "PetitionAccessStatus";
    updatedAt: "DateTime";
  };
  PetitionAccessPagination: {
    // field return type name
    items: "PetitionAccess";
    totalCount: "Int";
  };
  PetitionAndField: {
    // field return type name
    field: "PetitionField";
    petition: "Petition";
  };
  PetitionAndPartialFields: {
    // field return type name
    fields: "PetitionField";
    petition: "Petition";
  };
  PetitionBasePagination: {
    // field return type name
    items: "PetitionBase";
    totalCount: "Int";
  };
  PetitionClonedEvent: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
    user: "User";
  };
  PetitionClosedEvent: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
    user: "User";
  };
  PetitionClosedNotifiedEvent: {
    // field return type name
    access: "PetitionAccess";
    createdAt: "DateTime";
    id: "GID";
    user: "User";
  };
  PetitionCompletedEvent: {
    // field return type name
    access: "PetitionAccess";
    createdAt: "DateTime";
    id: "GID";
  };
  PetitionCompletedUserNotification: {
    // field return type name
    access: "PetitionAccess";
    createdAt: "DateTime";
    id: "GID";
    isRead: "Boolean";
    petition: "Petition";
  };
  PetitionCreatedEvent: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
    user: "User";
  };
  PetitionDeletedEvent: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
  };
  PetitionEventPagination: {
    // field return type name
    items: "PetitionEvent";
    totalCount: "Int";
  };
  PetitionField: {
    // field return type name
    attachments: "PetitionFieldAttachment";
    comments: "PetitionFieldComment";
    description: "String";
    id: "GID";
    isFixed: "Boolean";
    isReadOnly: "Boolean";
    multiple: "Boolean";
    optional: "Boolean";
    options: "JSONObject";
    position: "Int";
    replies: "PetitionFieldReply";
    title: "String";
    type: "PetitionFieldType";
    validated: "Boolean";
    visibility: "JSONObject";
  };
  PetitionFieldAttachment: {
    // field return type name
    createdAt: "DateTime";
    file: "FileUpload";
    id: "GID";
  };
  PetitionFieldComment: {
    // field return type name
    author: "UserOrPetitionAccess";
    content: "String";
    createdAt: "DateTime";
    id: "GID";
    isEdited: "Boolean";
    isInternal: "Boolean";
    isUnread: "Boolean";
  };
  PetitionFieldReply: {
    // field return type name
    content: "JSONObject";
    createdAt: "DateTime";
    field: "PetitionField";
    id: "GID";
    metadata: "JSONObject";
    status: "PetitionFieldReplyStatus";
    updatedAt: "DateTime";
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
    openedAt: "DateTime";
    scheduledAt: "DateTime";
    sender: "User";
    sentAt: "DateTime";
    status: "PetitionMessageStatus";
  };
  PetitionProgress: {
    // field return type name
    optional: "Int";
    replied: "Int";
    total: "Int";
    validated: "Int";
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
  PetitionReopenedEvent: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
    user: "User";
  };
  PetitionSharedUserNotification: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
    isRead: "Boolean";
    owner: "User";
    permissionType: "PetitionPermissionTypeRW";
    petition: "Petition";
    sharedWith: "UserOrUserGroup";
  };
  PetitionSignatureRequest: {
    // field return type name
    auditTrailFilename: "String";
    createdAt: "DateTime";
    id: "GID";
    metadata: "JSONObject";
    petition: "Petition";
    signatureConfig: "SignatureConfig";
    signedDocumentFilename: "String";
    status: "PetitionSignatureRequestStatus";
    updatedAt: "DateTime";
  };
  PetitionTemplate: {
    // field return type name
    createdAt: "DateTime";
    description: "String";
    emailBody: "JSON";
    emailSubject: "String";
    fieldCount: "Int";
    fields: "PetitionField";
    hasCommentsEnabled: "Boolean";
    id: "GID";
    isPublic: "Boolean";
    isRecipientViewContentsHidden: "Boolean";
    locale: "PetitionLocale";
    myEffectivePermission: "EffectivePetitionUserPermission";
    name: "String";
    organization: "Organization";
    owner: "User";
    permissions: "PetitionPermission";
    skipForwardSecurity: "Boolean";
    tags: "Tag";
    updatedAt: "DateTime";
  };
  PetitionTemplateAndField: {
    // field return type name
    field: "PetitionField";
    petition: "PetitionTemplate";
  };
  PetitionTemplatePagination: {
    // field return type name
    items: "PetitionTemplate";
    totalCount: "Int";
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
  PetitionUserNotificationPagination: {
    // field return type name
    items: "PetitionUserNotification";
    totalCount: "Int";
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
  PetitionWithFieldAndReplies: {
    // field return type name
    field: "PetitionField";
    petition: "Petition";
    replies: "PetitionFieldReply";
  };
  PublicAccessVerification: {
    // field return type name
    cookieName: "String";
    cookieValue: "String";
    email: "String";
    isAllowed: "Boolean";
    orgLogoUrl: "String";
    orgName: "String";
  };
  PublicContact: {
    // field return type name
    email: "String";
    firstName: "String";
    fullName: "String";
    id: "GID";
    lastName: "String";
  };
  PublicOrganization: {
    // field return type name
    id: "GID";
    identifier: "String";
    logoUrl: "String";
    name: "String";
  };
  PublicPetition: {
    // field return type name
    createdAt: "DateTime";
    deadline: "DateTime";
    fields: "PublicPetitionField";
    hasCommentsEnabled: "Boolean";
    id: "GID";
    isRecipientViewContentsHidden: "Boolean";
    locale: "PetitionLocale";
    recipients: "PublicContact";
    signature: "PublicSignatureConfig";
    signatureStatus: "PublicSignatureStatus";
    status: "PetitionStatus";
    updatedAt: "DateTime";
  };
  PublicPetitionAccess: {
    // field return type name
    contact: "PublicContact";
    granter: "PublicUser";
    message: "PublicPetitionMessage";
    petition: "PublicPetition";
  };
  PublicPetitionField: {
    // field return type name
    attachments: "PetitionFieldAttachment";
    commentCount: "Int";
    comments: "PublicPetitionFieldComment";
    description: "String";
    id: "GID";
    isReadOnly: "Boolean";
    multiple: "Boolean";
    optional: "Boolean";
    options: "JSONObject";
    replies: "PublicPetitionFieldReply";
    title: "String";
    type: "PetitionFieldType";
    unreadCommentCount: "Int";
    validated: "Boolean";
    visibility: "JSONObject";
  };
  PublicPetitionFieldComment: {
    // field return type name
    author: "PublicUserOrContact";
    content: "String";
    createdAt: "DateTime";
    id: "GID";
    isUnread: "Boolean";
  };
  PublicPetitionFieldReply: {
    // field return type name
    content: "JSONObject";
    createdAt: "DateTime";
    id: "GID";
    status: "PetitionFieldReplyStatus";
    updatedAt: "DateTime";
  };
  PublicPetitionMessage: {
    // field return type name
    id: "GID";
    subject: "String";
  };
  PublicSignatureConfig: {
    // field return type name
    review: "Boolean";
    signers: "PublicContact";
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
    contact: "Contact";
    contacts: "ContactPagination";
    contactsByEmail: "Contact";
    emailIsAvailable: "Boolean";
    globalIdDecode: "SupportMethodResponse";
    globalIdEncode: "SupportMethodResponse";
    me: "User";
    organization: "Organization";
    organizations: "OrganizationPagination";
    petition: "PetitionBase";
    petitionAuthToken: "Petition";
    petitionFieldComments: "PublicPetitionFieldComment";
    petitions: "PetitionBasePagination";
    petitionsById: "PetitionBase";
    publicOrgLogoUrl: "String";
    publicTemplates: "PetitionTemplatePagination";
    searchUsers: "UserOrUserGroup";
    tags: "TagPagination";
    userGroup: "UserGroup";
    userGroups: "UserGroupPagination";
  };
  ReminderSentEvent: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
    reminder: "PetitionReminder";
  };
  RemindersConfig: {
    // field return type name
    offset: "Int";
    time: "String";
    timezone: "String";
    weekdaysOnly: "Boolean";
  };
  ReplyCreatedEvent: {
    // field return type name
    createdAt: "DateTime";
    createdBy: "UserOrPetitionAccess";
    field: "PetitionField";
    id: "GID";
    reply: "PetitionFieldReply";
  };
  ReplyDeletedEvent: {
    // field return type name
    createdAt: "DateTime";
    deletedBy: "UserOrPetitionAccess";
    field: "PetitionField";
    id: "GID";
  };
  ReplyUpdatedEvent: {
    // field return type name
    createdAt: "DateTime";
    field: "PetitionField";
    id: "GID";
    reply: "PetitionFieldReply";
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
    cancellerReason: "String";
    contact: "Contact";
    createdAt: "DateTime";
    id: "GID";
    user: "User";
  };
  SignatureCancelledUserNotification: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
    isRead: "Boolean";
    petition: "Petition";
  };
  SignatureCompletedEvent: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
  };
  SignatureCompletedUserNotification: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
    isRead: "Boolean";
    petition: "Petition";
  };
  SignatureConfig: {
    // field return type name
    contacts: "Contact";
    provider: "String";
    review: "Boolean";
    timezone: "String";
    title: "String";
  };
  SignatureStartedEvent: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
  };
  Subscription: {
    // field return type name
    createdAt: "DateTime";
    endpoint: "String";
    id: "GID";
    petition: "Petition";
    updatedAt: "DateTime";
  };
  SupportMethodResponse: {
    // field return type name
    message: "String";
    result: "Result";
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
  TemplateUsedEvent: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
  };
  User: {
    // field return type name
    authenticationTokens: "UserAuthenticationTokenPagination";
    createdAt: "DateTime";
    email: "String";
    firstName: "String";
    fullName: "String";
    hasFeatureFlag: "Boolean";
    id: "GID";
    isSsoUser: "Boolean";
    isSuperAdmin: "Boolean";
    lastActiveAt: "DateTime";
    lastName: "String";
    notifications: "PetitionUserNotification";
    onboardingStatus: "JSONObject";
    organization: "Organization";
    role: "OrganizationRole";
    status: "UserStatus";
    unreadNotificationIds: "String";
    updatedAt: "DateTime";
  };
  UserAuthenticationToken: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
    lastUsedAt: "DateTime";
    tokenName: "String";
  };
  UserAuthenticationTokenPagination: {
    // field return type name
    items: "UserAuthenticationToken";
    totalCount: "Int";
  };
  UserGroup: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
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
  UserPagination: {
    // field return type name
    items: "User";
    totalCount: "Int";
  };
  UserPermissionAddedEvent: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
    permissionType: "PetitionPermissionType";
    permissionUser: "User";
    user: "User";
  };
  UserPermissionEditedEvent: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
    permissionType: "PetitionPermissionType";
    permissionUser: "User";
    user: "User";
  };
  UserPermissionRemovedEvent: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
    permissionUser: "User";
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
  PetitionBase: {
    // field return type name
    createdAt: "DateTime";
    emailBody: "JSON";
    emailSubject: "String";
    fieldCount: "Int";
    fields: "PetitionField";
    hasCommentsEnabled: "Boolean";
    id: "GID";
    isRecipientViewContentsHidden: "Boolean";
    locale: "PetitionLocale";
    myEffectivePermission: "EffectivePetitionUserPermission";
    name: "String";
    organization: "Organization";
    owner: "User";
    permissions: "PetitionPermission";
    skipForwardSecurity: "Boolean";
    tags: "Tag";
    updatedAt: "DateTime";
  };
  PetitionBaseAndField: {
    // field return type name
    field: "PetitionField";
    petition: "PetitionBase";
  };
  PetitionEvent: {
    // field return type name
    createdAt: "DateTime";
    id: "GID";
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
    petition: "Petition";
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
  Mutation: {
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
    assignPetitionToUser: {
      // args
      petitionId: string; // ID!
      userId: number; // Int!
    };
    batchSendPetition: {
      // args
      body: NexusGenScalars["JSON"]; // JSON!
      contactIdGroups: NexusGenScalars["GID"][][]; // [[GID!]!]!
      petitionId: NexusGenScalars["GID"]; // GID!
      remindersConfig?: NexusGenInputs["RemindersConfigInput"] | null; // RemindersConfigInput
      scheduledAt?: NexusGenScalars["DateTime"] | null; // DateTime
      subject: string; // String!
    };
    bulkCreateContacts: {
      // args
      file: NexusGenScalars["Upload"]; // Upload!
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
      petitionIds: NexusGenScalars["GID"][]; // [GID!]!
    };
    cloneUserGroup: {
      // args
      locale?: string | null; // String
      userGroupIds: NexusGenScalars["GID"][]; // [GID!]!
    };
    createContact: {
      // args
      data: NexusGenInputs["CreateContactInput"]; // CreateContactInput!
    };
    createFileUploadReply: {
      // args
      fieldId: NexusGenScalars["GID"]; // GID!
      file: NexusGenScalars["Upload"]; // Upload!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    createOrganization: {
      // args
      identifier: string; // String!
      name: string; // String!
      status: NexusGenEnums["OrganizationStatus"]; // OrganizationStatus!
    };
    createOrganizationUser: {
      // args
      email: string; // String!
      firstName: string; // String!
      lastName: string; // String!
      role: NexusGenEnums["OrganizationRole"]; // OrganizationRole!
    };
    createPetition: {
      // args
      eventsUrl?: string | null; // String
      locale?: NexusGenEnums["PetitionLocale"] | null; // PetitionLocale
      name?: string | null; // String
      petitionId?: NexusGenScalars["GID"] | null; // GID
      type: NexusGenEnums["PetitionBaseType"] | null; // PetitionBaseType
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
      content: string; // String!
      isInternal?: boolean | null; // Boolean
      petitionFieldId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    createPetitionSubscription: {
      // args
      endpoint: string; // String!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    createSimpleReply: {
      // args
      fieldId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
      reply: string; // String!
    };
    createTag: {
      // args
      color: string; // String!
      name: string; // String!
    };
    createUser: {
      // args
      email: string; // String!
      firstName: string; // String!
      lastName: string; // String!
      organizationId: number; // Int!
      password: string; // String!
      role: NexusGenEnums["OrganizationRole"]; // OrganizationRole!
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
    deleteContacts: {
      // args
      ids: NexusGenScalars["GID"][]; // [GID!]!
    };
    deletePetition: {
      // args
      petitionId: string; // ID!
    };
    deletePetitionField: {
      // args
      fieldId: NexusGenScalars["GID"]; // GID!
      force?: boolean | null; // Boolean
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    deletePetitionFieldComment: {
      // args
      petitionFieldCommentId: NexusGenScalars["GID"]; // GID!
      petitionFieldId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    deletePetitionReply: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
      replyId: NexusGenScalars["GID"]; // GID!
    };
    deletePetitionSubscription: {
      // args
      subscriptionId: NexusGenScalars["GID"]; // GID!
    };
    deletePetitions: {
      // args
      force?: boolean | null; // Boolean
      ids: NexusGenScalars["GID"][]; // [GID!]!
    };
    deleteTag: {
      // args
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
    generateUserAuthToken: {
      // args
      tokenName: string; // String!
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
      keycode: string; // ID!
      signer?: NexusGenInputs["PublicPetitionSignerData"] | null; // PublicPetitionSignerData
    };
    publicCreateCheckboxReply: {
      // args
      fieldId: NexusGenScalars["GID"]; // GID!
      keycode: string; // ID!
      values: string[]; // [String!]!
    };
    publicCreateDynamicSelectReply: {
      // args
      fieldId: NexusGenScalars["GID"]; // GID!
      keycode: string; // ID!
      value: Array<Array<string | null>>; // [[String]!]!
    };
    publicCreateFileUploadReply: {
      // args
      data: NexusGenInputs["FileUploadInput"]; // FileUploadInput!
      fieldId: NexusGenScalars["GID"]; // GID!
      keycode: string; // ID!
    };
    publicCreatePetitionFieldComment: {
      // args
      content: string; // String!
      keycode: string; // ID!
      petitionFieldId: NexusGenScalars["GID"]; // GID!
    };
    publicCreateSimpleReply: {
      // args
      fieldId: NexusGenScalars["GID"]; // GID!
      keycode: string; // ID!
      value: string; // String!
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
    publicDeletePetitionReply: {
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
    publicSendVerificationCode: {
      // args
      keycode: string; // ID!
    };
    publicUpdateCheckboxReply: {
      // args
      keycode: string; // ID!
      replyId: NexusGenScalars["GID"]; // GID!
      values: string[]; // [String!]!
    };
    publicUpdateDynamicSelectReply: {
      // args
      keycode: string; // ID!
      replyId: NexusGenScalars["GID"]; // GID!
      value: Array<Array<string | null>>; // [[String]!]!
    };
    publicUpdatePetitionFieldComment: {
      // args
      content: string; // String!
      keycode: string; // ID!
      petitionFieldCommentId: NexusGenScalars["GID"]; // GID!
      petitionFieldId: NexusGenScalars["GID"]; // GID!
    };
    publicUpdateSimpleReply: {
      // args
      keycode: string; // ID!
      replyId: NexusGenScalars["GID"]; // GID!
      value: string; // String!
    };
    reactivateAccesses: {
      // args
      accessIds: NexusGenScalars["GID"][]; // [GID!]!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    removePetitionFieldAttachment: {
      // args
      attachmentId: NexusGenScalars["GID"]; // GID!
      fieldId: NexusGenScalars["GID"]; // GID!
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
    reopenPetition: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    resetSignaturitOrganizationBranding: {
      // args
      orgId: number; // Int!
    };
    resetUserPassword: {
      // args
      email: string; // String!
    };
    revokeUserAuthToken: {
      // args
      authTokenIds: NexusGenScalars["GID"][]; // [GID!]!
    };
    sendPetition: {
      // args
      body: NexusGenScalars["JSON"]; // JSON!
      contactIds: NexusGenScalars["GID"][]; // [GID!]!
      petitionId: NexusGenScalars["GID"]; // GID!
      remindersConfig?: NexusGenInputs["RemindersConfigInput"] | null; // RemindersConfigInput
      scheduledAt?: NexusGenScalars["DateTime"] | null; // DateTime
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
    signedPetitionDownloadLink: {
      // args
      downloadAuditTrail?: boolean | null; // Boolean
      petitionSignatureRequestId: NexusGenScalars["GID"]; // GID!
      preview?: boolean | null; // Boolean
    };
    startSignatureRequest: {
      // args
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
    updateFieldPositions: {
      // args
      fieldIds: NexusGenScalars["GID"][]; // [GID!]!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    updateOnboardingStatus: {
      // args
      key: NexusGenEnums["OnboardingKey"]; // OnboardingKey!
      status: NexusGenEnums["OnboardingStatus"]; // OnboardingStatus!
    };
    updateOrganizationLogo: {
      // args
      file: NexusGenScalars["Upload"]; // Upload!
      orgId: NexusGenScalars["GID"]; // GID!
    };
    updatePetition: {
      // args
      data: NexusGenInputs["UpdatePetitionInput"]; // UpdatePetitionInput!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    updatePetitionField: {
      // args
      data: NexusGenInputs["UpdatePetitionFieldInput"]; // UpdatePetitionFieldInput!
      fieldId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    updatePetitionFieldComment: {
      // args
      content: string; // String!
      petitionFieldCommentId: NexusGenScalars["GID"]; // GID!
      petitionFieldId: NexusGenScalars["GID"]; // GID!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    updatePetitionFieldCommentsReadStatus: {
      // args
      isRead: boolean; // Boolean!
      petitionFieldCommentIds: NexusGenScalars["GID"][]; // [GID!]!
      petitionId: NexusGenScalars["GID"]; // GID!
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
    updatePetitionPermissionSubscription: {
      // args
      isSubscribed: boolean; // Boolean!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    updatePetitionUserNotificationReadStatus: {
      // args
      filter?: NexusGenEnums["PetitionUserNotificationFilter"] | null; // PetitionUserNotificationFilter
      isRead: boolean; // Boolean!
      petitionUserNotificationIds?: NexusGenScalars["GID"][] | null; // [GID!]
    };
    updateSignatureRequestMetadata: {
      // args
      metadata: NexusGenScalars["JSONObject"]; // JSONObject!
      petitionSignatureRequestId: NexusGenScalars["GID"]; // GID!
    };
    updateSimpleReply: {
      // args
      petitionId: NexusGenScalars["GID"]; // GID!
      reply: string; // String!
      replyId: NexusGenScalars["GID"]; // GID!
    };
    updateTag: {
      // args
      data: NexusGenInputs["UpdateTagInput"]; // UpdateTagInput!
      id: NexusGenScalars["GID"]; // GID!
    };
    updateUser: {
      // args
      data: NexusGenInputs["UpdateUserInput"]; // UpdateUserInput!
      id: NexusGenScalars["GID"]; // GID!
    };
    updateUserGroup: {
      // args
      data: NexusGenInputs["UpdateUserGroupInput"]; // UpdateUserGroupInput!
      id: NexusGenScalars["GID"]; // GID!
    };
    updateUserStatus: {
      // args
      status: NexusGenEnums["UserStatus"]; // UserStatus!
      transferToUserId?: NexusGenScalars["GID"] | null; // GID
      userIds: NexusGenScalars["GID"][]; // [GID!]!
    };
    uploadDynamicSelectFieldFile: {
      // args
      fieldId: NexusGenScalars["GID"]; // GID!
      file: NexusGenScalars["Upload"]; // Upload!
      petitionId: NexusGenScalars["GID"]; // GID!
    };
    validatePetitionFields: {
      // args
      fieldIds: NexusGenScalars["GID"][]; // [GID!]!
      petitionId: NexusGenScalars["GID"]; // GID!
      validateRepliesWith?: NexusGenEnums["PetitionFieldReplyStatus"] | null; // PetitionFieldReplyStatus
      value: boolean; // Boolean!
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
    integrations: {
      // args
      type?: NexusGenEnums["IntegrationType"] | null; // IntegrationType
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
    currentSignatureRequest: {
      // args
      token?: string | null; // String
    };
    events: {
      // args
      limit?: number | null; // Int
      offset?: number | null; // Int
    };
  };
  Query: {
    access: {
      // args
      keycode: string; // ID!
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
    emailIsAvailable: {
      // args
      email: string; // String!
    };
    globalIdDecode: {
      // args
      id: string; // ID!
    };
    globalIdEncode: {
      // args
      id: number; // Int!
      type: NexusGenEnums["EntityType"]; // EntityType!
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
    petitionAuthToken: {
      // args
      token: string; // String!
    };
    petitionFieldComments: {
      // args
      keycode: string; // ID!
      petitionFieldId: NexusGenScalars["GID"]; // GID!
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
      ids: NexusGenScalars["GID"][]; // [GID!]!
    };
    publicOrgLogoUrl: {
      // args
      id: NexusGenScalars["GID"]; // GID!
    };
    publicTemplates: {
      // args
      limit?: number | null; // Int
      locale?: NexusGenEnums["PetitionLocale"] | null; // PetitionLocale
      offset?: number | null; // Int
      search?: string | null; // String
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
    authenticationTokens: {
      // args
      limit?: number | null; // Int
      offset?: number | null; // Int
      search?: string | null; // String
      sortBy?: NexusGenEnums["UserAuthenticationTokens_OrderBy"][] | null; // [UserAuthenticationTokens_OrderBy!]
    };
    hasFeatureFlag: {
      // args
      featureFlag: NexusGenEnums["FeatureFlag"]; // FeatureFlag!
    };
    notifications: {
      // args
      before?: NexusGenScalars["DateTime"] | null; // DateTime
      filter?: NexusGenEnums["PetitionUserNotificationFilter"] | null; // PetitionUserNotificationFilter
      limit: number; // Int!
    };
  };
}

export interface NexusGenAbstractTypeMembers {
  PublicUserOrContact: "PublicContact" | "PublicUser";
  UserOrContact: "Contact" | "User";
  UserOrPetitionAccess: "PetitionAccess" | "User";
  UserOrUserGroup: "User" | "UserGroup";
  CreatedAt:
    | "PetitionFieldAttachment"
    | "PetitionMessage"
    | "PetitionReminder"
    | "UserAuthenticationToken";
  PetitionBase: "Petition" | "PetitionTemplate";
  PetitionBaseAndField: "PetitionAndField" | "PetitionTemplateAndField";
  PetitionEvent:
    | "AccessActivatedEvent"
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
    | "PetitionClonedEvent"
    | "PetitionClosedEvent"
    | "PetitionClosedNotifiedEvent"
    | "PetitionCompletedEvent"
    | "PetitionCreatedEvent"
    | "PetitionDeletedEvent"
    | "PetitionReopenedEvent"
    | "ReminderSentEvent"
    | "ReplyCreatedEvent"
    | "ReplyDeletedEvent"
    | "ReplyUpdatedEvent"
    | "SignatureCancelledEvent"
    | "SignatureCompletedEvent"
    | "SignatureStartedEvent"
    | "TemplateUsedEvent"
    | "UserPermissionAddedEvent"
    | "UserPermissionEditedEvent"
    | "UserPermissionRemovedEvent";
  PetitionPermission: "PetitionUserGroupPermission" | "PetitionUserPermission";
  PetitionUserNotification:
    | "CommentCreatedUserNotification"
    | "MessageEmailBouncedUserNotification"
    | "PetitionCompletedUserNotification"
    | "PetitionSharedUserNotification"
    | "SignatureCancelledUserNotification"
    | "SignatureCompletedUserNotification";
  Timestamps:
    | "Contact"
    | "Organization"
    | "PetitionAccess"
    | "PetitionFieldReply"
    | "PetitionSignatureRequest"
    | "PetitionUserGroupPermission"
    | "PetitionUserPermission"
    | "PublicPetition"
    | "PublicPetitionFieldReply"
    | "Subscription"
    | "User"
    | "UserGroup";
}

export interface NexusGenTypeInterfaces {
  AccessActivatedEvent: "PetitionEvent";
  AccessDeactivatedEvent: "PetitionEvent";
  AccessDelegatedEvent: "PetitionEvent";
  AccessOpenedEvent: "PetitionEvent";
  CommentCreatedUserNotification: "PetitionUserNotification";
  CommentDeletedEvent: "PetitionEvent";
  CommentPublishedEvent: "PetitionEvent";
  Contact: "Timestamps";
  GroupPermissionAddedEvent: "PetitionEvent";
  GroupPermissionEditedEvent: "PetitionEvent";
  GroupPermissionRemovedEvent: "PetitionEvent";
  MessageCancelledEvent: "PetitionEvent";
  MessageEmailBouncedUserNotification: "PetitionUserNotification";
  MessageScheduledEvent: "PetitionEvent";
  MessageSentEvent: "PetitionEvent";
  Organization: "Timestamps";
  OwnershipTransferredEvent: "PetitionEvent";
  Petition: "PetitionBase";
  PetitionAccess: "Timestamps";
  PetitionAndField: "PetitionBaseAndField";
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
  PetitionReminder: "CreatedAt";
  PetitionReopenedEvent: "PetitionEvent";
  PetitionSharedUserNotification: "PetitionUserNotification";
  PetitionSignatureRequest: "Timestamps";
  PetitionTemplate: "PetitionBase";
  PetitionTemplateAndField: "PetitionBaseAndField";
  PetitionUserGroupPermission: "PetitionPermission" | "Timestamps";
  PetitionUserPermission: "PetitionPermission" | "Timestamps";
  PublicPetition: "Timestamps";
  PublicPetitionFieldReply: "Timestamps";
  ReminderSentEvent: "PetitionEvent";
  ReplyCreatedEvent: "PetitionEvent";
  ReplyDeletedEvent: "PetitionEvent";
  ReplyUpdatedEvent: "PetitionEvent";
  SignatureCancelledEvent: "PetitionEvent";
  SignatureCancelledUserNotification: "PetitionUserNotification";
  SignatureCompletedEvent: "PetitionEvent";
  SignatureCompletedUserNotification: "PetitionUserNotification";
  SignatureStartedEvent: "PetitionEvent";
  Subscription: "Timestamps";
  TemplateUsedEvent: "PetitionEvent";
  User: "Timestamps";
  UserAuthenticationToken: "CreatedAt";
  UserGroup: "Timestamps";
  UserPermissionAddedEvent: "PetitionEvent";
  UserPermissionEditedEvent: "PetitionEvent";
  UserPermissionRemovedEvent: "PetitionEvent";
  PetitionPermission: "Timestamps";
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
  | "PetitionBase"
  | "PetitionBaseAndField"
  | "PetitionEvent"
  | "PetitionPermission"
  | "PetitionUserNotification"
  | "PublicUserOrContact"
  | "Timestamps"
  | "UserOrContact"
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
  context: ctx.ApiContext;
  inputTypes: NexusGenInputs;
  rootTypes: NexusGenRootTypes;
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
  allNamedTypes:
    | NexusGenTypes["allInputTypes"]
    | NexusGenTypes["allOutputTypes"];
  abstractTypes: NexusGenTypes["interfaceNames"] | NexusGenTypes["unionNames"];
  abstractTypeMembers: NexusGenAbstractTypeMembers;
  objectsUsingAbstractStrategyIsTypeOf: NexusGenObjectsUsingAbstractStrategyIsTypeOf;
  abstractsUsingStrategyResolveType: NexusGenAbstractsUsingStrategyResolveType;
  features: NexusGenFeaturesConfig;
}

declare global {
  interface NexusGenPluginTypeConfig<TypeName extends string> {}
  interface NexusGenPluginFieldConfig<
    TypeName extends string,
    FieldName extends string
  > {
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

    /**
     * Whether the type can be null
     * @default (depends on whether nullability is configured in type or schema)
     * @see declarativeWrappingPlugin
     */
    nullable?: boolean;
    /**
     * Whether the type is list of values, or just a single value.
     * If list is true, we assume the type is a list. If list is an array,
     * we'll assume that it's a list with the depth. The boolean indicates whether
     * the type is required (non-null), where true = nonNull, false = nullable.
     * @see declarativeWrappingPlugin
     */
    list?: true | boolean[];
    /**
     * Whether the type should be non null, `required: true` = `nullable: false`
     * @default (depends on whether nullability is configured in type or schema)
     * @see declarativeWrappingPlugin
     */
    required?: boolean;
  }
  interface NexusGenPluginInputFieldConfig<
    TypeName extends string,
    FieldName extends string
  > {
    /**
     * Whether the type can be null
     * @default (depends on whether nullability is configured in type or schema)
     * @see declarativeWrappingPlugin
     */
    nullable?: boolean;
    /**
     * Whether the type is list of values, or just a single value.
     * If list is true, we assume the type is a list. If list is an array,
     * we'll assume that it's a list with the depth. The boolean indicates whether
     * the type is required (non-null), where true = nonNull, false = nullable.
     * @see declarativeWrappingPlugin
     */
    list?: true | boolean[];
    /**
     * Whether the type should be non null, `required: true` = `nullable: false`
     * @default (depends on whether nullability is configured in type or schema)
     * @see declarativeWrappingPlugin
     */
    required?: boolean;
  }
  interface NexusGenPluginSchemaConfig {}
  interface NexusGenPluginArgConfig {
    /**
     * Whether the type can be null
     * @default (depends on whether nullability is configured in type or schema)
     * @see declarativeWrappingPlugin
     */
    nullable?: boolean;
    /**
     * Whether the type is list of values, or just a single value.
     * If list is true, we assume the type is a list. If list is an array,
     * we'll assume that it's a list with the depth. The boolean indicates whether
     * the type is required (non-null), where true = nonNull, false = nullable.
     * @see declarativeWrappingPlugin
     */
    list?: true | boolean[];
    /**
     * Whether the type should be non null, `required: true` = `nullable: false`
     * @default (depends on whether nullability is configured in type or schema)
     * @see declarativeWrappingPlugin
     */
    required?: boolean;
  }
}
