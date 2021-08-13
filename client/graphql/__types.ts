import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
const defaultOptions =  {}
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: string;
  GID: string;
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: any;
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: { [key: string]: any };
  /** The `Upload` scalar type represents a file upload. */
  Upload: File;
}

/** JSON with AWS S3 url and required form data to make a POST request */
export interface AWSPresignedPostData {
  __typename?: 'AWSPresignedPostData';
  fields: Scalars['JSONObject'];
  url: Scalars['String'];
}

export interface AccessActivatedEvent extends PetitionEvent {
  __typename?: 'AccessActivatedEvent';
  access: PetitionAccess;
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  user?: Maybe<User>;
}

export interface AccessActivatedFromPublicPetitionLinkEvent extends PetitionEvent {
  __typename?: "AccessActivatedFromPublicPetitionLinkEvent";
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
}

export interface AccessActivatedFromPublicPetitionLinkUserNotification
  extends PetitionUserNotification {
  __typename?: "AccessActivatedFromPublicPetitionLinkUserNotification";
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  isRead: Scalars["Boolean"];
  petition: PetitionBase;
}

export interface AccessDeactivatedEvent extends PetitionEvent {
  __typename?: 'AccessDeactivatedEvent';
  access: PetitionAccess;
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  user?: Maybe<User>;
}

export interface AccessDelegatedEvent extends PetitionEvent {
  __typename?: 'AccessDelegatedEvent';
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  newAccess: PetitionAccess;
  originalAccess: PetitionAccess;
}

export interface AccessOpenedEvent extends PetitionEvent {
  __typename?: 'AccessOpenedEvent';
  access: PetitionAccess;
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
}

export type BatchSendSigningMode =
  /** Allow configured signer(s) to sign every petition on the batch */
  | 'COPY_SIGNATURE_SETTINGS'
  /** Disable eSignature on every petition of this batch. */
  | 'DISABLE_SIGNATURE'
  /** Let recipients of each group to choose who will sign the petitions. */
  | 'LET_RECIPIENT_CHOOSE';

export type ChangePasswordResult =
  | 'INCORRECT_PASSWORD'
  | 'INVALID_NEW_PASSWORD'
  | 'SUCCESS';

export interface CommentCreatedUserNotification extends PetitionUserNotification {
  __typename?: 'CommentCreatedUserNotification';
  comment: PetitionFieldComment;
  createdAt: Scalars['DateTime'];
  field: PetitionField;
  id: Scalars['GID'];
  isRead: Scalars['Boolean'];
  petition: PetitionBase;
}

export interface CommentDeletedEvent extends PetitionEvent {
  __typename?: 'CommentDeletedEvent';
  createdAt: Scalars['DateTime'];
  deletedBy?: Maybe<UserOrPetitionAccess>;
  field?: Maybe<PetitionField>;
  id: Scalars['GID'];
}

export interface CommentPublishedEvent extends PetitionEvent {
  __typename?: 'CommentPublishedEvent';
  comment?: Maybe<PetitionFieldComment>;
  createdAt: Scalars['DateTime'];
  field?: Maybe<PetitionField>;
  id: Scalars['GID'];
}

/** A contact in the system. */
export interface Contact extends Timestamps {
  __typename?: 'Contact';
  /** The petition accesses for this contact */
  accesses: PetitionAccessPagination;
  /** Time when the resource was created. */
  createdAt: Scalars['DateTime'];
  /** The email of the contact. */
  email: Scalars['String'];
  /** The first name of the contact. */
  firstName?: Maybe<Scalars['String']>;
  /** The full name of the contact. */
  fullName?: Maybe<Scalars['String']>;
  /** The ID of the contact. */
  id: Scalars['GID'];
  /** The last name of the contact. */
  lastName?: Maybe<Scalars['String']>;
  /** Time when the resource was last updated. */
  updatedAt: Scalars['DateTime'];
}


/** A contact in the system. */
export interface ContactaccessesArgs {
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
}

export interface ContactPagination {
  __typename?: 'ContactPagination';
  /** The requested slice of items. */
  items: Array<Contact>;
  /** The total count of items in the list. */
  totalCount: Scalars['Int'];
}

export interface CreateContactInput {
  email: Scalars['String'];
  firstName?: Maybe<Scalars['String']>;
  lastName?: Maybe<Scalars['String']>;
}

export interface CreateFileUploadFieldAttachment {
  __typename?: 'CreateFileUploadFieldAttachment';
  attachment: PetitionFieldAttachment;
  presignedPostData: AWSPresignedPostData;
}

export interface CreateFileUploadReply {
  __typename?: 'CreateFileUploadReply';
  presignedPostData: AWSPresignedPostData;
  reply: PublicPetitionFieldReply;
}

export interface CreatedAt {
  /** Time when the resource was created. */
  createdAt: Scalars['DateTime'];
}


/** The effective permission for a petition and user */
export interface EffectivePetitionUserPermission {
  __typename?: 'EffectivePetitionUserPermission';
  /** wether user is subscribed or not to emails and alerts of the petition */
  isSubscribed: Scalars['Boolean'];
  /** The type of the permission. */
  permissionType: PetitionPermissionType;
}

export type EntityType =
  | 'Contact'
  | 'Organization'
  | 'Petition'
  | 'User';

export type FeatureFlag =
  | 'API_TOKENS'
  | 'EXPORT_CUATRECASAS'
  | 'HIDE_RECIPIENT_VIEW_CONTENTS'
  | 'INTERNAL_COMMENTS'
  | 'PETITION_PDF_EXPORT'
  | 'PETITION_SIGNATURE'
  | 'SKIP_FORWARD_SECURITY';

export interface FileUpload {
  __typename?: 'FileUpload';
  contentType: Scalars['String'];
  filename: Scalars['String'];
  isComplete: Scalars['Boolean'];
  size: Scalars['Int'];
}

export interface FileUploadDownloadLinkResult {
  __typename?: 'FileUploadDownloadLinkResult';
  file?: Maybe<FileUpload>;
  result: Result;
  url?: Maybe<Scalars['String']>;
}

export interface FileUploadInput {
  contentType: Scalars['String'];
  filename: Scalars['String'];
  size: Scalars['Int'];
}

export type FilterSharedWithLogicalOperator =
  | 'AND'
  | 'OR';

export type FilterSharedWithOperator =
  | 'IS_OWNER'
  | 'NOT_IS_OWNER'
  | 'NOT_SHARED_WITH'
  | 'SHARED_WITH';


export interface GenerateUserAuthTokenResponse {
  __typename?: 'GenerateUserAuthTokenResponse';
  apiKey: Scalars['String'];
  userAuthToken: UserAuthenticationToken;
}

export interface GroupPermissionAddedEvent extends PetitionEvent {
  __typename?: 'GroupPermissionAddedEvent';
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  permissionGroup: UserGroup;
  permissionType: PetitionPermissionType;
  user?: Maybe<User>;
}

export interface GroupPermissionEditedEvent extends PetitionEvent {
  __typename?: 'GroupPermissionEditedEvent';
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  permissionGroup: UserGroup;
  permissionType: PetitionPermissionType;
  user?: Maybe<User>;
}

export interface GroupPermissionRemovedEvent extends PetitionEvent {
  __typename?: 'GroupPermissionRemovedEvent';
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  permissionGroup: UserGroup;
  user?: Maybe<User>;
}

/** The types of integrations available. */
export type IntegrationType =
  | 'SIGNATURE';



/** A public template on landing page */
export interface LandingTemplate {
  __typename?: "LandingTemplate";
  backgroundColor?: Maybe<Scalars["String"]>;
  categories?: Maybe<Array<Scalars["String"]>>;
  descriptionHtml?: Maybe<Scalars["String"]>;
  fieldCount: Scalars["Int"];
  fields: Array<LandingTemplateField>;
  hasConditionals: Scalars["Boolean"];
  id: Scalars["GID"];
  imageUrl?: Maybe<Scalars["String"]>;
  locale: PetitionLocale;
  name?: Maybe<Scalars['String']>;
  organizationName: Scalars['String'];
  ownerAvatarUrl?: Maybe<Scalars['String']>;
  ownerFullName: Scalars['String'];
  shortDescription?: Maybe<Scalars['String']>;
  slug: Scalars['String'];
  updatedAt: Scalars['DateTime'];
}

/** A public template field */
export interface LandingTemplateField {
  __typename?: "LandingTemplateField";
  id: Scalars["GID"];
  title?: Maybe<Scalars["String"]>;
  type: PetitionFieldType;
}

export interface LandingTemplatePagination {
  __typename?: 'LandingTemplatePagination';
  /** The requested slice of items. */
  items: Array<LandingTemplate>;
  /** The total count of items in the list. */
  totalCount: Scalars['Int'];
}

export interface LandingTemplateSample {
  __typename?: 'LandingTemplateSample';
  category: Scalars['String'];
  templates: LandingTemplatePagination;
}


export interface LandingTemplateSampletemplatesArgs {
  limit?: Maybe<Scalars['Int']>;
  locale: PetitionLocale;
  offset?: Maybe<Scalars['Int']>;
}

export interface MessageCancelledEvent extends PetitionEvent {
  __typename?: 'MessageCancelledEvent';
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  message: PetitionMessage;
  user?: Maybe<User>;
}

export interface MessageEmailBouncedUserNotification extends PetitionUserNotification {
  __typename?: 'MessageEmailBouncedUserNotification';
  access: PetitionAccess;
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  isRead: Scalars['Boolean'];
  petition: PetitionBase;
}

export interface MessageScheduledEvent extends PetitionEvent {
  __typename?: 'MessageScheduledEvent';
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  message: PetitionMessage;
}

export interface MessageSentEvent extends PetitionEvent {
  __typename?: 'MessageSentEvent';
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  message: PetitionMessage;
}

export interface Mutation {
  __typename?: 'Mutation';
  /** Adds permissions on given petitions and users */
  addPetitionPermission: Array<Petition>;
  /** Add users to a user group */
  addUsersToUserGroup: UserGroup;
  /** Clones the petition and assigns the given user as owner and creator. */
  assignPetitionToUser: SupportMethodResponse;
  /** Sends different petitions to each of the specified contact groups, creating corresponding accesses and messages */
  batchSendPetition: Array<SendPetitionResult>;
  /** Load contacts from an excel file, creating the ones not found on database */
  bulkCreateContacts: Array<Contact>;
  /** Cancels a scheduled petition message. */
  cancelScheduledMessage?: Maybe<PetitionMessage>;
  cancelSignatureRequest: PetitionSignatureRequest;
  /** Changes the password for the current logged in user. */
  changePassword: ChangePasswordResult;
  /** Changes the type of a petition Field */
  changePetitionFieldType: PetitionBaseAndField;
  /** Clones a petition field */
  clonePetitionField: PetitionBaseAndField;
  /** Clone petition. */
  clonePetitions: Array<PetitionBase>;
  /** Clones the user group with all its members */
  cloneUserGroup: Array<UserGroup>;
  /** Create a contact. */
  createContact: Contact;
  /** Creates a reply to a file upload field. */
  createFileUploadReply: PetitionFieldReply;
  /** Creates a new organization. */
  createOrganization: SupportMethodResponse;
  /** Creates a new user in the same organization as the context user */
  createOrganizationUser: User;
  /** Create petition. */
  createPetition: PetitionBase;
  /** Creates a petition field */
  createPetitionField: PetitionBaseAndField;
  /** Generates and returns a signed url to upload a field attachment to AWS S3 */
  createPetitionFieldAttachmentUploadLink: CreateFileUploadFieldAttachment;
  /** Create a petition field comment. */
  createPetitionFieldComment: PetitionField;
  /** Creates a new subscription on a petition */
  createPetitionSubscription: Subscription;
  /** Creates a public link from a user's template */
  createPublicPetitionLink: PetitionTemplate;
  /** Creates a reply to a text or select field. */
  createSimpleReply: PetitionFieldReply;
  /** Creates a tag in the user's organization */
  createTag: Tag;
  /** Creates a new user in the specified organization. */
  createUser: SupportMethodResponse;
  /** Creates a group in the user's organization */
  createUserGroup: UserGroup;
  /** Deactivates the specified active petition accesses. */
  deactivateAccesses: Array<PetitionAccess>;
  /** Delete contacts. */
  deleteContacts: Result;
  /** Soft-deletes any given petition on the database. */
  deletePetition: SupportMethodResponse;
  /** Deletes a petition field. */
  deletePetitionField: PetitionBase;
  /** Delete a petition field comment. */
  deletePetitionFieldComment: PetitionField;
  /** Deletes a reply to a petition field. */
  deletePetitionReply: Result;
  deletePetitionSubscription: Result;
  /** Delete petitions. */
  deletePetitions: Result;
  /** Removes the tag from every petition and soft-deletes it */
  deleteTag: Result;
  /** Deletes a group */
  deleteUserGroup: Result;
  /** generates a signed download link for the xlsx file containing the listings of a dynamic select field */
  dynamicSelectFieldFileDownloadLink: FileUploadDownloadLinkResult;
  /** Edits permissions on given petitions and users */
  editPetitionPermission: Array<Petition>;
  /** Generates a download link for a file reply. */
  fileUploadReplyDownloadLink: FileUploadDownloadLinkResult;
  /** Generates a new API token for the context user */
  generateUserAuthToken: GenerateUserAuthTokenResponse;
  /** Generates a download link for a field attachment */
  petitionFieldAttachmentDownloadLink: FileUploadDownloadLinkResult;
  /** Tells the backend that the field attachment was correctly uploaded to S3 */
  petitionFieldAttachmentUploadComplete: PetitionFieldAttachment;
  publicCheckVerificationCode: VerificationCodeCheck;
  /**
   * Marks a filled petition as COMPLETED.
   * If the petition does not require a review, starts the signing process. Otherwise sends email to user.
   */
  publicCompletePetition: PublicPetition;
  /** Creates and sends the petition linked to the PublicPetitionLink to the contact passed in args */
  publicCreateAndSendPetitionFromPublicLink: Result;
  /** Creates a reply to a checkbox field. */
  publicCreateCheckboxReply: PublicPetitionFieldReply;
  /** Creates a reply for a dynamic select field. */
  publicCreateDynamicSelectReply: PublicPetitionFieldReply;
  /** Creates a reply to a file upload field. */
  publicCreateFileUploadReply: CreateFileUploadReply;
  /** Create a petition field comment. */
  publicCreatePetitionFieldComment: PublicPetitionFieldComment;
  /** Creates a reply to a text or select field. */
  publicCreateSimpleReply: PublicPetitionFieldReply;
  /** Lets a recipient delegate access to the petition to another contact in the same organization */
  publicDelegateAccessToContact: PublicPetitionAccess;
  /** Delete a petition field comment. */
  publicDeletePetitionFieldComment: Result;
  /** Deletes a reply to a petition field. */
  publicDeletePetitionReply: Result;
  /** Notifies the backend that the upload is complete. */
  publicFileUploadReplyComplete: PublicPetitionFieldReply;
  /** Generates a download link for a file reply on a public context. */
  publicFileUploadReplyDownloadLink: FileUploadDownloadLinkResult;
  /** Marks the specified comments as read. */
  publicMarkPetitionFieldCommentsAsRead: Array<PublicPetitionFieldComment>;
  /** Cancel a reminder for a contact. */
  publicOptOutReminders: PublicPetitionAccess;
  /** Generates a download link for a field attachment on a public context. */
  publicPetitionFieldAttachmentDownloadLink: FileUploadDownloadLinkResult;
  publicSendReminder: Result;
  publicSendVerificationCode: VerificationCodeRequest;
  /** Updates a reply of checkbox field. */
  publicUpdateCheckboxReply: PublicPetitionFieldReply;
  /** Updates a reply for a dynamic select field. */
  publicUpdateDynamicSelectReply: PublicPetitionFieldReply;
  /** Update a petition field comment. */
  publicUpdatePetitionFieldComment: PublicPetitionFieldComment;
  /** Updates a reply to a text or select field. */
  publicUpdateSimpleReply: PublicPetitionFieldReply;
  /** Reactivates the specified inactive petition accesses. */
  reactivateAccesses: Array<PetitionAccess>;
  /** Remove a petition field attachment */
  removePetitionFieldAttachment: Result;
  /** Removes permissions on given petitions and users */
  removePetitionPermission: Array<Petition>;
  /** Removes users from a user group */
  removeUsersFromGroup: UserGroup;
  /** Reopens the petition */
  reopenPetition: Petition;
  /** Removes the Signaturit Branding Ids of selected organization. */
  resetSignaturitOrganizationBranding: SupportMethodResponse;
  /** Resets the given user password on AWS Cognito and sends an email with new temporary. */
  resetUserPassword: SupportMethodResponse;
  /** Soft-deletes a given auth token, making it permanently unusable. */
  revokeUserAuthToken: Result;
  /** Sends the petition and creates the corresponding accesses and messages. */
  sendPetition: SendPetitionResult;
  /** Sends an email to all contacts of the petition confirming the replies are ok */
  sendPetitionClosedNotification: Petition;
  /** Sends a reminder for the specified petition accesses. */
  sendReminders: Result;
  /** Generates a download link for the signed PDF petition. */
  signedPetitionDownloadLink: FileUploadDownloadLinkResult;
  startSignatureRequest: PetitionSignatureRequest;
  /** Switches automatic reminders for the specified petition accesses. */
  switchAutomaticReminders: Array<PetitionAccess>;
  /** Tags a petition */
  tagPetition: PetitionBase;
  /** Transfers the ownership of an organization to a given user. Old owner will get ADMIN role */
  transferOrganizationOwnership: SupportMethodResponse;
  /** Transfers petition ownership to a given user. The original owner gets a WRITE permission on the petitions. */
  transferPetitionOwnership: Array<Petition>;
  /** Removes the given tag from the given petition */
  untagPetition: PetitionBase;
  /** Updates a contact. */
  updateContact: Contact;
  /** Updates the positions of the petition fields */
  updateFieldPositions: PetitionBase;
  /** Updates the metadata of a public landing template. */
  updateLandingTemplateMetadata: SupportMethodResponse;
  /** Updates the onboarding status for one of the pages. */
  updateOnboardingStatus: User;
  /** Updates the logo of an organization */
  updateOrganizationLogo: Organization;
  /** Updates the role of another user in the organization. */
  updateOrganizationUser: User;
  /** Updates a petition. */
  updatePetition: PetitionBase;
  /** Updates a petition field. */
  updatePetitionField: PetitionBaseAndField;
  /** Update a petition field comment. */
  updatePetitionFieldComment: PetitionField;
  /**
   * Marks the specified comments as read or unread.
   * @deprecated Use `updatePetitionUserNotificationReadStatus` instead.
   */
  updatePetitionFieldCommentsReadStatus: Array<PetitionFieldComment>;
  /** Updates the status of a petition field reply and sets the petition as closed if all fields are validated. */
  updatePetitionFieldRepliesStatus: PetitionWithFieldAndReplies;
  /** Updates the metada of the specified petition field reply */
  updatePetitionFieldReplyMetadata: PetitionFieldReply;
  /** Updates the subscription flag on a PetitionPermission */
  updatePetitionPermissionSubscription: Petition;
  /**
   * Updates the read status of a user's notification.
   * Must pass ONLY one of:
   *   - petitionUserNotificationIds
   *   - filter
   *   - petitionIds
   *   - petitionFieldCommentIds
   */
  updatePetitionUserNotificationReadStatus: Array<PetitionUserNotification>;
  /** Updates the info and permissions of a public link */
  updatePublicPetitionLink: PublicPetitionLink;
  updateSignatureRequestMetadata: PetitionSignatureRequest;
  /** Updates a reply to a text or select field. */
  updateSimpleReply: PetitionFieldReply;
  /** Updates the name and color of a given tag */
  updateTag: Tag;
  /** Updates the user with the provided data. */
  updateUser: User;
  /** Updates the name of a given user group */
  updateUserGroup: UserGroup;
  /** Updates user status and, if new status is INACTIVE, transfers their owned petitions to another user in the org. */
  updateUserStatus: Array<User>;
  /** Uploads the xlsx file used to parse the options of a dynamic select field, and sets the field options */
  uploadDynamicSelectFieldFile: PetitionField;
  /** Uploads a user avatar image */
  uploadUserAvatar: SupportMethodResponse;
  /** Updates the validation of a field and sets the petition as closed if all fields are validated. */
  validatePetitionFields: PetitionAndPartialFields;
  verifyPublicAccess: PublicAccessVerification;
}


export interface MutationaddPetitionPermissionArgs {
  message?: Maybe<Scalars['String']>;
  notify?: Maybe<Scalars['Boolean']>;
  permissionType: PetitionPermissionTypeRW;
  petitionIds: Array<Scalars['GID']>;
  subscribe?: Maybe<Scalars['Boolean']>;
  userGroupIds?: Maybe<Array<Scalars['GID']>>;
  userIds?: Maybe<Array<Scalars['GID']>>;
}


export interface MutationaddUsersToUserGroupArgs {
  userGroupId: Scalars['GID'];
  userIds: Array<Scalars['GID']>;
}


export interface MutationassignPetitionToUserArgs {
  petitionId: Scalars['ID'];
  userId: Scalars['Int'];
}


export interface MutationbatchSendPetitionArgs {
  batchSendSigningMode?: Maybe<BatchSendSigningMode>;
  body: Scalars['JSON'];
  contactIdGroups: Array<Array<Scalars['GID']>>;
  petitionId: Scalars['GID'];
  remindersConfig?: Maybe<RemindersConfigInput>;
  scheduledAt?: Maybe<Scalars['DateTime']>;
  subject: Scalars['String'];
}


export interface MutationbulkCreateContactsArgs {
  file: Scalars['Upload'];
}


export interface MutationcancelScheduledMessageArgs {
  messageId: Scalars['GID'];
  petitionId: Scalars['GID'];
}


export interface MutationcancelSignatureRequestArgs {
  petitionSignatureRequestId: Scalars['GID'];
}


export interface MutationchangePasswordArgs {
  newPassword: Scalars['String'];
  password: Scalars['String'];
}


export interface MutationchangePetitionFieldTypeArgs {
  fieldId: Scalars['GID'];
  force?: Maybe<Scalars['Boolean']>;
  petitionId: Scalars['GID'];
  type: PetitionFieldType;
}


export interface MutationclonePetitionFieldArgs {
  fieldId: Scalars['GID'];
  petitionId: Scalars['GID'];
}


export interface MutationclonePetitionsArgs {
  petitionIds: Array<Scalars['GID']>;
}


export interface MutationcloneUserGroupArgs {
  locale?: Maybe<Scalars['String']>;
  userGroupIds: Array<Scalars['GID']>;
}


export interface MutationcreateContactArgs {
  data: CreateContactInput;
}


export interface MutationcreateFileUploadReplyArgs {
  fieldId: Scalars['GID'];
  file: Scalars['Upload'];
  petitionId: Scalars['GID'];
}


export interface MutationcreateOrganizationArgs {
  identifier: Scalars['String'];
  name: Scalars['String'];
  status: OrganizationStatus;
}


export interface MutationcreateOrganizationUserArgs {
  email: Scalars['String'];
  firstName: Scalars['String'];
  lastName: Scalars['String'];
  role: OrganizationRole;
}


export interface MutationcreatePetitionArgs {
  eventsUrl?: Maybe<Scalars['String']>;
  locale?: Maybe<PetitionLocale>;
  name?: Maybe<Scalars['String']>;
  petitionId?: Maybe<Scalars['GID']>;
  type?: Maybe<PetitionBaseType>;
}


export interface MutationcreatePetitionFieldArgs {
  petitionId: Scalars['GID'];
  position?: Maybe<Scalars['Int']>;
  type: PetitionFieldType;
}


export interface MutationcreatePetitionFieldAttachmentUploadLinkArgs {
  data: FileUploadInput;
  fieldId: Scalars['GID'];
  petitionId: Scalars['GID'];
}


export interface MutationcreatePetitionFieldCommentArgs {
  content: Scalars['String'];
  isInternal?: Maybe<Scalars['Boolean']>;
  petitionFieldId: Scalars['GID'];
  petitionId: Scalars['GID'];
}


export interface MutationcreatePetitionSubscriptionArgs {
  endpoint: Scalars['String'];
  petitionId: Scalars['GID'];
}

export interface MutationcreatePublicPetitionLinkArgs {
  description: Scalars["String"];
  otherPermissions?: Maybe<Array<UserOrUserGroupPublicLinkPermission>>;
  ownerId: Scalars["GID"];
  templateId: Scalars["GID"];
  title: Scalars["String"];
}

export interface MutationcreateSimpleReplyArgs {
  fieldId: Scalars['GID'];
  petitionId: Scalars['GID'];
  reply: Scalars['String'];
}


export interface MutationcreateTagArgs {
  color: Scalars['String'];
  name: Scalars['String'];
}


export interface MutationcreateUserArgs {
  email: Scalars['String'];
  firstName: Scalars['String'];
  lastName: Scalars['String'];
  organizationId: Scalars['Int'];
  password: Scalars['String'];
  role: OrganizationRole;
}


export interface MutationcreateUserGroupArgs {
  name: Scalars['String'];
  userIds: Array<Scalars['GID']>;
}


export interface MutationdeactivateAccessesArgs {
  accessIds: Array<Scalars['GID']>;
  petitionId: Scalars['GID'];
}


export interface MutationdeleteContactsArgs {
  ids: Array<Scalars['GID']>;
}


export interface MutationdeletePetitionArgs {
  petitionId: Scalars['ID'];
}


export interface MutationdeletePetitionFieldArgs {
  fieldId: Scalars['GID'];
  force?: Maybe<Scalars['Boolean']>;
  petitionId: Scalars['GID'];
}


export interface MutationdeletePetitionFieldCommentArgs {
  petitionFieldCommentId: Scalars['GID'];
  petitionFieldId: Scalars['GID'];
  petitionId: Scalars['GID'];
}


export interface MutationdeletePetitionReplyArgs {
  petitionId: Scalars['GID'];
  replyId: Scalars['GID'];
}


export interface MutationdeletePetitionSubscriptionArgs {
  subscriptionId: Scalars['GID'];
}


export interface MutationdeletePetitionsArgs {
  force?: Maybe<Scalars['Boolean']>;
  ids: Array<Scalars['GID']>;
}


export interface MutationdeleteTagArgs {
  id: Scalars['GID'];
}


export interface MutationdeleteUserGroupArgs {
  ids: Array<Scalars['GID']>;
}


export interface MutationdynamicSelectFieldFileDownloadLinkArgs {
  fieldId: Scalars['GID'];
  petitionId: Scalars['GID'];
}


export interface MutationeditPetitionPermissionArgs {
  permissionType: PetitionPermissionType;
  petitionIds: Array<Scalars['GID']>;
  userGroupIds?: Maybe<Array<Scalars['GID']>>;
  userIds?: Maybe<Array<Scalars['GID']>>;
}


export interface MutationfileUploadReplyDownloadLinkArgs {
  petitionId: Scalars['GID'];
  preview?: Maybe<Scalars['Boolean']>;
  replyId: Scalars['GID'];
}


export interface MutationgenerateUserAuthTokenArgs {
  tokenName: Scalars['String'];
}


export interface MutationpetitionFieldAttachmentDownloadLinkArgs {
  attachmentId: Scalars['GID'];
  fieldId: Scalars['GID'];
  petitionId: Scalars['GID'];
}


export interface MutationpetitionFieldAttachmentUploadCompleteArgs {
  attachmentId: Scalars['GID'];
  fieldId: Scalars['GID'];
  petitionId: Scalars['GID'];
}


export interface MutationpublicCheckVerificationCodeArgs {
  code: Scalars['String'];
  keycode: Scalars['ID'];
  token: Scalars['ID'];
}


export interface MutationpublicCompletePetitionArgs {
  keycode: Scalars['ID'];
  signer?: Maybe<PublicPetitionSignerData>;
}

export interface MutationpublicCreateAndSendPetitionFromPublicLinkArgs {
  contactEmail: Scalars["String"];
  contactFirstName: Scalars["String"];
  contactLastName: Scalars["String"];
  force?: Maybe<Scalars["Boolean"]>;
  publicPetitionLinkId: Scalars["GID"];
}

export interface MutationpublicCreateCheckboxReplyArgs {
  fieldId: Scalars['GID'];
  keycode: Scalars['ID'];
  values: Array<Scalars['String']>;
}


export interface MutationpublicCreateDynamicSelectReplyArgs {
  fieldId: Scalars['GID'];
  keycode: Scalars['ID'];
  value: Array<Array<Maybe<Scalars['String']>>>;
}


export interface MutationpublicCreateFileUploadReplyArgs {
  data: FileUploadInput;
  fieldId: Scalars['GID'];
  keycode: Scalars['ID'];
}


export interface MutationpublicCreatePetitionFieldCommentArgs {
  content: Scalars['String'];
  keycode: Scalars['ID'];
  petitionFieldId: Scalars['GID'];
}


export interface MutationpublicCreateSimpleReplyArgs {
  fieldId: Scalars['GID'];
  keycode: Scalars['ID'];
  value: Scalars['String'];
}


export interface MutationpublicDelegateAccessToContactArgs {
  email: Scalars['String'];
  firstName: Scalars['String'];
  keycode: Scalars['ID'];
  lastName: Scalars['String'];
  messageBody: Scalars['JSON'];
}


export interface MutationpublicDeletePetitionFieldCommentArgs {
  keycode: Scalars['ID'];
  petitionFieldCommentId: Scalars['GID'];
  petitionFieldId: Scalars['GID'];
}


export interface MutationpublicDeletePetitionReplyArgs {
  keycode: Scalars['ID'];
  replyId: Scalars['GID'];
}


export interface MutationpublicFileUploadReplyCompleteArgs {
  keycode: Scalars['ID'];
  replyId: Scalars['GID'];
}


export interface MutationpublicFileUploadReplyDownloadLinkArgs {
  keycode: Scalars['ID'];
  preview?: Maybe<Scalars['Boolean']>;
  replyId: Scalars['GID'];
}


export interface MutationpublicMarkPetitionFieldCommentsAsReadArgs {
  keycode: Scalars['ID'];
  petitionFieldCommentIds: Array<Scalars['GID']>;
}


export interface MutationpublicOptOutRemindersArgs {
  keycode: Scalars['ID'];
  other: Scalars['String'];
  reason: Scalars['String'];
}


export interface MutationpublicPetitionFieldAttachmentDownloadLinkArgs {
  attachmentId: Scalars['GID'];
  fieldId: Scalars['GID'];
  keycode: Scalars['ID'];
  preview?: Maybe<Scalars['Boolean']>;
}

export interface MutationpublicSendReminderArgs {
  contactEmail: Scalars["String"];
  publicPetitionLinkId: Scalars["GID"];
}

export interface MutationpublicSendVerificationCodeArgs {
  keycode: Scalars['ID'];
}


export interface MutationpublicUpdateCheckboxReplyArgs {
  keycode: Scalars['ID'];
  replyId: Scalars['GID'];
  values: Array<Scalars['String']>;
}


export interface MutationpublicUpdateDynamicSelectReplyArgs {
  keycode: Scalars['ID'];
  replyId: Scalars['GID'];
  value: Array<Array<Maybe<Scalars['String']>>>;
}


export interface MutationpublicUpdatePetitionFieldCommentArgs {
  content: Scalars['String'];
  keycode: Scalars['ID'];
  petitionFieldCommentId: Scalars['GID'];
  petitionFieldId: Scalars['GID'];
}


export interface MutationpublicUpdateSimpleReplyArgs {
  keycode: Scalars['ID'];
  replyId: Scalars['GID'];
  value: Scalars['String'];
}


export interface MutationreactivateAccessesArgs {
  accessIds: Array<Scalars['GID']>;
  petitionId: Scalars['GID'];
}


export interface MutationremovePetitionFieldAttachmentArgs {
  attachmentId: Scalars['GID'];
  fieldId: Scalars['GID'];
  petitionId: Scalars['GID'];
}


export interface MutationremovePetitionPermissionArgs {
  petitionIds: Array<Scalars['GID']>;
  removeAll?: Maybe<Scalars['Boolean']>;
  userGroupIds?: Maybe<Array<Scalars['GID']>>;
  userIds?: Maybe<Array<Scalars['GID']>>;
}


export interface MutationremoveUsersFromGroupArgs {
  userGroupId: Scalars['GID'];
  userIds: Array<Scalars['GID']>;
}


export interface MutationreopenPetitionArgs {
  petitionId: Scalars['GID'];
}


export interface MutationresetSignaturitOrganizationBrandingArgs {
  orgId: Scalars['Int'];
}


export interface MutationresetUserPasswordArgs {
  email: Scalars['String'];
}


export interface MutationrevokeUserAuthTokenArgs {
  authTokenIds: Array<Scalars['GID']>;
}


export interface MutationsendPetitionArgs {
  body: Scalars['JSON'];
  contactIds: Array<Scalars['GID']>;
  petitionId: Scalars['GID'];
  remindersConfig?: Maybe<RemindersConfigInput>;
  scheduledAt?: Maybe<Scalars['DateTime']>;
  subject: Scalars['String'];
}


export interface MutationsendPetitionClosedNotificationArgs {
  attachPdfExport: Scalars['Boolean'];
  emailBody: Scalars['JSON'];
  force?: Maybe<Scalars['Boolean']>;
  pdfExportTitle?: Maybe<Scalars['String']>;
  petitionId: Scalars['GID'];
}


export interface MutationsendRemindersArgs {
  accessIds: Array<Scalars['GID']>;
  body?: Maybe<Scalars['JSON']>;
  petitionId: Scalars['GID'];
}


export interface MutationsignedPetitionDownloadLinkArgs {
  downloadAuditTrail?: Maybe<Scalars['Boolean']>;
  petitionSignatureRequestId: Scalars['GID'];
  preview?: Maybe<Scalars['Boolean']>;
}


export interface MutationstartSignatureRequestArgs {
  petitionId: Scalars['GID'];
}


export interface MutationswitchAutomaticRemindersArgs {
  accessIds: Array<Scalars['GID']>;
  petitionId: Scalars['GID'];
  remindersConfig?: Maybe<RemindersConfigInput>;
  start: Scalars['Boolean'];
}


export interface MutationtagPetitionArgs {
  petitionId: Scalars['GID'];
  tagId: Scalars['GID'];
}


export interface MutationtransferOrganizationOwnershipArgs {
  organizationId: Scalars['Int'];
  userId: Scalars['Int'];
}


export interface MutationtransferPetitionOwnershipArgs {
  petitionIds: Array<Scalars['GID']>;
  userId: Scalars['GID'];
}


export interface MutationuntagPetitionArgs {
  petitionId: Scalars['GID'];
  tagId: Scalars['GID'];
}


export interface MutationupdateContactArgs {
  data: UpdateContactInput;
  id: Scalars['GID'];
}


export interface MutationupdateFieldPositionsArgs {
  fieldIds: Array<Scalars['GID']>;
  petitionId: Scalars['GID'];
}


export interface MutationupdateLandingTemplateMetadataArgs {
  backgroundColor?: Maybe<Scalars['String']>;
  categories?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  image?: Maybe<Scalars['Upload']>;
  slug?: Maybe<Scalars['String']>;
  templateId: Scalars['ID'];
}


export interface MutationupdateOnboardingStatusArgs {
  key: OnboardingKey;
  status: OnboardingStatus;
}


export interface MutationupdateOrganizationLogoArgs {
  file: Scalars['Upload'];
  orgId: Scalars['GID'];
}


export interface MutationupdateOrganizationUserArgs {
  role: OrganizationRole;
  userId: Scalars['GID'];
}


export interface MutationupdatePetitionArgs {
  data: UpdatePetitionInput;
  petitionId: Scalars['GID'];
}


export interface MutationupdatePetitionFieldArgs {
  data: UpdatePetitionFieldInput;
  fieldId: Scalars['GID'];
  petitionId: Scalars['GID'];
}


export interface MutationupdatePetitionFieldCommentArgs {
  content: Scalars['String'];
  petitionFieldCommentId: Scalars['GID'];
  petitionFieldId: Scalars['GID'];
  petitionId: Scalars['GID'];
}


export interface MutationupdatePetitionFieldCommentsReadStatusArgs {
  isRead: Scalars['Boolean'];
  petitionFieldCommentIds: Array<Scalars['GID']>;
  petitionId: Scalars['GID'];
}


export interface MutationupdatePetitionFieldRepliesStatusArgs {
  petitionFieldId: Scalars['GID'];
  petitionFieldReplyIds: Array<Scalars['GID']>;
  petitionId: Scalars['GID'];
  status: PetitionFieldReplyStatus;
}


export interface MutationupdatePetitionFieldReplyMetadataArgs {
  metadata: Scalars['JSONObject'];
  petitionId: Scalars['GID'];
  replyId: Scalars['GID'];
}


export interface MutationupdatePetitionPermissionSubscriptionArgs {
  isSubscribed: Scalars['Boolean'];
  petitionId: Scalars['GID'];
}


export interface MutationupdatePetitionUserNotificationReadStatusArgs {
  filter?: Maybe<PetitionUserNotificationFilter>;
  isRead: Scalars['Boolean'];
  petitionFieldCommentIds?: Maybe<Array<Scalars['GID']>>;
  petitionIds?: Maybe<Array<Scalars['GID']>>;
  petitionUserNotificationIds?: Maybe<Array<Scalars['GID']>>;
}

export interface MutationupdatePublicPetitionLinkArgs {
  description?: Maybe<Scalars["String"]>;
  isActive?: Maybe<Scalars["Boolean"]>;
  otherPermissions?: Maybe<Array<UserOrUserGroupPublicLinkPermission>>;
  ownerId?: Maybe<Scalars["GID"]>;
  publicPetitionLinkId: Scalars["GID"];
  title?: Maybe<Scalars["String"]>;
}

export interface MutationupdateSignatureRequestMetadataArgs {
  metadata: Scalars['JSONObject'];
  petitionSignatureRequestId: Scalars['GID'];
}


export interface MutationupdateSimpleReplyArgs {
  petitionId: Scalars['GID'];
  reply: Scalars['String'];
  replyId: Scalars['GID'];
}


export interface MutationupdateTagArgs {
  data: UpdateTagInput;
  id: Scalars['GID'];
}


export interface MutationupdateUserArgs {
  data: UpdateUserInput;
  id: Scalars['GID'];
}


export interface MutationupdateUserGroupArgs {
  data: UpdateUserGroupInput;
  id: Scalars['GID'];
}


export interface MutationupdateUserStatusArgs {
  status: UserStatus;
  transferToUserId?: Maybe<Scalars['GID']>;
  userIds: Array<Scalars['GID']>;
}


export interface MutationuploadDynamicSelectFieldFileArgs {
  fieldId: Scalars['GID'];
  file: Scalars['Upload'];
  petitionId: Scalars['GID'];
}


export interface MutationuploadUserAvatarArgs {
  image: Scalars['Upload'];
  userId: Scalars['Int'];
}


export interface MutationvalidatePetitionFieldsArgs {
  fieldIds: Array<Scalars['GID']>;
  petitionId: Scalars['GID'];
  validateRepliesWith?: Maybe<PetitionFieldReplyStatus>;
  value: Scalars['Boolean'];
}


export interface MutationverifyPublicAccessArgs {
  ip?: Maybe<Scalars['String']>;
  keycode: Scalars['ID'];
  token: Scalars['ID'];
  userAgent?: Maybe<Scalars['String']>;
}

export type OnboardingKey =
  | 'CONTACT_DETAILS'
  | 'CONTACT_LIST'
  | 'PETITIONS_LIST'
  | 'PETITION_ACTIVITY'
  | 'PETITION_COMPOSE'
  | 'PETITION_REVIEW';

export type OnboardingStatus =
  | 'FINISHED'
  | 'SKIPPED';

export interface OrgIntegration {
  __typename?: 'OrgIntegration';
  /** The name of the integration. */
  name: Scalars['String'];
  /** The provider used for this integration. */
  provider: Scalars['String'];
  /** The type of the integration. */
  type: IntegrationType;
}

/** An organization in the system. */
export interface Organization extends Timestamps {
  __typename?: 'Organization';
  /** @deprecated Temporal solution for support methods, don't use */
  _id: Scalars['Int'];
  /** Time when the resource was created. */
  createdAt: Scalars['DateTime'];
  /** Whether the organization has an SSO provider configured. */
  hasSsoProvider: Scalars['Boolean'];
  /** The ID of the organization. */
  id: Scalars['GID'];
  /** The unique text identifier of the organization. */
  identifier: Scalars['String'];
  integrations: Array<OrgIntegration>;
  /** URL of the organization logo */
  logoUrl?: Maybe<Scalars['String']>;
  /** The name of the organization. */
  name: Scalars['String'];
  /** The status of the organization. */
  status: OrganizationStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars['DateTime'];
  /** The total number of users */
  userCount: Scalars['Int'];
  /** The users in the organization. */
  users: UserPagination;
}


/** An organization in the system. */
export interface OrganizationintegrationsArgs {
  type?: Maybe<IntegrationType>;
}


/** An organization in the system. */
export interface OrganizationusersArgs {
  exclude?: Maybe<Array<Scalars['GID']>>;
  includeInactive?: Maybe<Scalars['Boolean']>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<OrganizationUsers_OrderBy>>;
}

export interface OrganizationPagination {
  __typename?: 'OrganizationPagination';
  /** The requested slice of items. */
  items: Array<Organization>;
  /** The total count of items in the list. */
  totalCount: Scalars['Int'];
}

/** The roles of a user within an organization. */
export type OrganizationRole =
  | 'ADMIN'
  | 'NORMAL'
  | 'OWNER';

/** The status of the organization. */
export type OrganizationStatus =
  /** Used for regular clients */
  | 'ACTIVE'
  /** Used on churned clients */
  | 'CHURNED'
  /** Used for demoing the product */
  | 'DEMO'
  /** Used for development or testing purposes */
  | 'DEV';

/** Order to use on Organization.users */
export type OrganizationUsers_OrderBy =
  | 'createdAt_ASC'
  | 'createdAt_DESC'
  | 'email_ASC'
  | 'email_DESC'
  | 'firstName_ASC'
  | 'firstName_DESC'
  | 'fullName_ASC'
  | 'fullName_DESC'
  | 'lastActiveAt_ASC'
  | 'lastActiveAt_DESC'
  | 'lastName_ASC'
  | 'lastName_DESC';

export interface OwnershipTransferredEvent extends PetitionEvent {
  __typename?: 'OwnershipTransferredEvent';
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  owner?: Maybe<User>;
  previousOwner?: Maybe<User>;
  user?: Maybe<User>;
}

/** A petition */
export interface Petition extends PetitionBase {
  __typename?: 'Petition';
  /** The accesses for this petition */
  accesses: Array<PetitionAccess>;
  /** Time when the resource was created. */
  createdAt: Scalars['DateTime'];
  /** The current signature request. */
  currentSignatureRequest?: Maybe<PetitionSignatureRequest>;
  /** The deadline of the petition. */
  deadline?: Maybe<Scalars['DateTime']>;
  /** The body of the petition. */
  emailBody?: Maybe<Scalars['JSON']>;
  /** The subject of the petition. */
  emailSubject?: Maybe<Scalars['String']>;
  /** The events for the petition. */
  events: PetitionEventPagination;
  /** The number of fields in the petition. */
  fieldCount: Scalars['Int'];
  /** The definition of the petition fields. */
  fields: Array<PetitionField>;
  /** Whether comments are enabled or not. */
  hasCommentsEnabled: Scalars['Boolean'];
  /** The ID of the petition or template. */
  id: Scalars['GID'];
  isReadOnly: Scalars['Boolean'];
  /**
   * Whether the contents card is hidden in the recipient view.
   * @deprecated Don't use this
   */
  isRecipientViewContentsHidden: Scalars['Boolean'];
  /** The locale of the petition. */
  locale: PetitionLocale;
  /** The effective permission of the logged user. Will return Null if the user doesn't have access to the petition (e.g. on public templates). */
  myEffectivePermission?: Maybe<EffectivePetitionUserPermission>;
  /** The name of the petition. */
  name?: Maybe<Scalars['String']>;
  organization: Organization;
  owner: User;
  /** The permissions linked to the petition */
  permissions: Array<PetitionPermission>;
  /** The progress of the petition. */
  progress: PetitionProgress;
  /** The reminders configuration for the petition. */
  remindersConfig?: Maybe<RemindersConfig>;
  /** Date when the petition was first sent */
  sentAt?: Maybe<Scalars['DateTime']>;
  /** The signature configuration for the petition. */
  signatureConfig?: Maybe<SignatureConfig>;
  /** The list of signature requests. */
  signatureRequests?: Maybe<Array<PetitionSignatureRequest>>;
  /** Whether to skip the forward security check on the recipient view. */
  skipForwardSecurity: Scalars['Boolean'];
  /** The status of the petition. */
  status: PetitionStatus;
  /** The subscriptions linked to the petition. */
  subscriptions: Array<Subscription>;
  /** The tags linked to the petition */
  tags: Array<Tag>;
  /** Time when the resource was last updated. */
  updatedAt: Scalars['DateTime'];
}


/** A petition */
export interface PetitioncurrentSignatureRequestArgs {
  token?: Maybe<Scalars['String']>;
}


/** A petition */
export interface PetitioneventsArgs {
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
}

/** A petition access */
export interface PetitionAccess extends Timestamps {
  __typename?: 'PetitionAccess';
  /** The contact of this access. */
  contact?: Maybe<Contact>;
  /** Time when the resource was created. */
  createdAt: Scalars['DateTime'];
  /** The user who granted the access. */
  granter?: Maybe<User>;
  /** The ID of the petition access. */
  id: Scalars['GID'];
  /** When the next reminder will be sent. */
  nextReminderAt?: Maybe<Scalars['DateTime']>;
  /** The petition for this message access. */
  petition?: Maybe<Petition>;
  /** Number of reminders sent. */
  reminderCount: Scalars['Int'];
  reminders: Array<PetitionReminder>;
  /** Whether automatic reminders are active or not for this petition access */
  remindersActive: Scalars['Boolean'];
  /** The reminder settings of the petition. */
  remindersConfig?: Maybe<RemindersConfig>;
  /** Number of reminders left. */
  remindersLeft: Scalars['Int'];
  /** Whether contact has opted out from receiving reminders for this petition */
  remindersOptOut: Scalars['Boolean'];
  /** The status of the petition access */
  status: PetitionAccessStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars['DateTime'];
}

export interface PetitionAccessPagination {
  __typename?: 'PetitionAccessPagination';
  /** The requested slice of items. */
  items: Array<PetitionAccess>;
  /** The total count of items in the list. */
  totalCount: Scalars['Int'];
}

/** The status of a petition access. */
export type PetitionAccessStatus =
  /** The petition is accessible by the contact. */
  | 'ACTIVE'
  /** The petition is not accessible by the contact. */
  | 'INACTIVE';

export interface PetitionAndField extends PetitionBaseAndField {
  __typename?: 'PetitionAndField';
  field: PetitionField;
  petition: Petition;
}

/** The petition and a subset of some of its fields. */
export interface PetitionAndPartialFields {
  __typename?: 'PetitionAndPartialFields';
  fields: Array<PetitionField>;
  petition: Petition;
}

export interface PetitionBase {
  /** Time when the resource was created. */
  createdAt: Scalars['DateTime'];
  /** The body of the petition. */
  emailBody?: Maybe<Scalars['JSON']>;
  /** The subject of the petition. */
  emailSubject?: Maybe<Scalars['String']>;
  /** The number of fields in the petition. */
  fieldCount: Scalars['Int'];
  /** The definition of the petition fields. */
  fields: Array<PetitionField>;
  /** Whether comments are enabled or not. */
  hasCommentsEnabled: Scalars['Boolean'];
  /** The ID of the petition or template. */
  id: Scalars['GID'];
  isReadOnly: Scalars['Boolean'];
  /**
   * Whether the contents card is hidden in the recipient view.
   * @deprecated Don't use this
   */
  isRecipientViewContentsHidden: Scalars['Boolean'];
  /** The locale of the petition. */
  locale: PetitionLocale;
  /** The effective permission of the logged user. Will return Null if the user doesn't have access to the petition (e.g. on public templates). */
  myEffectivePermission?: Maybe<EffectivePetitionUserPermission>;
  /** The name of the petition. */
  name?: Maybe<Scalars['String']>;
  organization: Organization;
  owner: User;
  /** The permissions linked to the petition */
  permissions: Array<PetitionPermission>;
  /** Whether to skip the forward security check on the recipient view. */
  skipForwardSecurity: Scalars['Boolean'];
  /** The tags linked to the petition */
  tags: Array<Tag>;
  /** Time when the resource was last updated. */
  updatedAt: Scalars['DateTime'];
}

export interface PetitionBaseAndField {
  field: PetitionField;
  petition: PetitionBase;
}

export interface PetitionBasePagination {
  __typename?: 'PetitionBasePagination';
  /** The requested slice of items. */
  items: Array<PetitionBase>;
  /** The total count of items in the list. */
  totalCount: Scalars['Int'];
}

export type PetitionBaseType =
  | 'PETITION'
  | 'TEMPLATE';

export interface PetitionClonedEvent extends PetitionEvent {
  __typename?: 'PetitionClonedEvent';
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  user?: Maybe<User>;
}

export interface PetitionClosedEvent extends PetitionEvent {
  __typename?: 'PetitionClosedEvent';
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  user?: Maybe<User>;
}

export interface PetitionClosedNotifiedEvent extends PetitionEvent {
  __typename?: 'PetitionClosedNotifiedEvent';
  access: PetitionAccess;
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  user?: Maybe<User>;
}

export interface PetitionCompletedEvent extends PetitionEvent {
  __typename?: 'PetitionCompletedEvent';
  access: PetitionAccess;
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
}

export interface PetitionCompletedUserNotification extends PetitionUserNotification {
  __typename?: 'PetitionCompletedUserNotification';
  access: PetitionAccess;
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  isRead: Scalars['Boolean'];
  petition: PetitionBase;
}

export interface PetitionCreatedEvent extends PetitionEvent {
  __typename?: 'PetitionCreatedEvent';
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  user?: Maybe<User>;
}

export interface PetitionDeletedEvent extends PetitionEvent {
  __typename?: 'PetitionDeletedEvent';
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
}

export interface PetitionEvent {
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
}

export interface PetitionEventPagination {
  __typename?: 'PetitionEventPagination';
  /** The requested slice of items. */
  items: Array<PetitionEvent>;
  /** The total count of items in the list. */
  totalCount: Scalars['Int'];
}

/** A field within a petition. */
export interface PetitionField {
  __typename?: 'PetitionField';
  /** A list of files attached to this field. */
  attachments: Array<PetitionFieldAttachment>;
  /** The comments for this field. */
  comments: Array<PetitionFieldComment>;
  /** The description of the petition field. */
  description?: Maybe<Scalars['String']>;
  /** The ID of the petition field. */
  id: Scalars['GID'];
  /** Determines if the field can be moved or deleted. */
  isFixed: Scalars['Boolean'];
  /** Determines if the field accepts replies */
  isReadOnly: Scalars['Boolean'];
  /** Determines if this field allows multiple replies. */
  multiple: Scalars['Boolean'];
  /** Determines if this field is optional. */
  optional: Scalars['Boolean'];
  /** The options of the petition field. */
  options: Scalars['JSONObject'];
  position: Scalars['Int'];
  /** The replies to the petition field */
  replies: Array<PetitionFieldReply>;
  /** The title of the petition field. */
  title?: Maybe<Scalars['String']>;
  /** The type of the petition field. */
  type: PetitionFieldType;
  /** Determines if the content of this field has been validated. */
  validated: Scalars['Boolean'];
  /** A JSON object representing the conditions for the field to be visible */
  visibility?: Maybe<Scalars['JSONObject']>;
}

/** An attachment on a petition field */
export interface PetitionFieldAttachment extends CreatedAt {
  __typename?: 'PetitionFieldAttachment';
  /** Time when the resource was created. */
  createdAt: Scalars['DateTime'];
  file: FileUpload;
  id: Scalars['GID'];
}

/** A comment on a petition field */
export interface PetitionFieldComment {
  __typename?: 'PetitionFieldComment';
  /** The author of the comment. */
  author?: Maybe<UserOrPetitionAccess>;
  /** The content of the comment. */
  content: Scalars['String'];
  /** Time when the comment was created. */
  createdAt: Scalars['DateTime'];
  /** The ID of the petition field comment. */
  id: Scalars['GID'];
  /** Whether the comment has been edited after being published. */
  isEdited: Scalars['Boolean'];
  /** Whether the comment is internal (only visible to org users) or public (visible for users and accesses) */
  isInternal: Scalars['Boolean'];
  /** Whether the comment has been read or not. */
  isUnread: Scalars['Boolean'];
}

/** A reply to a petition field */
export interface PetitionFieldReply extends Timestamps {
  __typename?: 'PetitionFieldReply';
  /** The content of the reply. */
  content: Scalars['JSONObject'];
  /** Time when the resource was created. */
  createdAt: Scalars['DateTime'];
  /** The petition field for this reply. */
  field?: Maybe<PetitionField>;
  /** The ID of the petition field reply. */
  id: Scalars['GID'];
  /** Metadata for this reply. */
  metadata: Scalars['JSONObject'];
  /** The status of the reply. */
  status: PetitionFieldReplyStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars['DateTime'];
}

/** The status of a petition. */
export type PetitionFieldReplyStatus =
  /** The reply has been approved. */
  | 'APPROVED'
  /** The reply has not been approved or rejected. */
  | 'PENDING'
  /** The reply has been rejected. */
  | 'REJECTED';

/** Type of a petition field */
export type PetitionFieldType =
  /** A options list. */
  | 'CHECKBOX'
  /** A dynamic select field. */
  | 'DYNAMIC_SELECT'
  /** A file upload field. */
  | 'FILE_UPLOAD'
  /** A heading field. */
  | 'HEADING'
  /** A select field. */
  | 'SELECT'
  /** A short text field. */
  | 'SHORT_TEXT'
  /** A text field. */
  | 'TEXT';

export interface PetitionFilter {
  locale?: Maybe<PetitionLocale>;
  sharedWith?: Maybe<PetitionSharedWithFilter>;
  status?: Maybe<Array<PetitionStatus>>;
  tagIds?: Maybe<Array<Scalars['ID']>>;
  type?: Maybe<PetitionBaseType>;
}

/** The locale used for rendering the petition to the contact. */
export type PetitionLocale =
  | 'en'
  | 'es';

/** A petition message */
export interface PetitionMessage extends CreatedAt {
  __typename?: 'PetitionMessage';
  /** The access of this petition message. */
  access: PetitionAccess;
  /** Tells when the email bounced. */
  bouncedAt?: Maybe<Scalars['DateTime']>;
  /** Time when the resource was created. */
  createdAt: Scalars['DateTime'];
  /** Tells when the email was delivered. */
  deliveredAt?: Maybe<Scalars['DateTime']>;
  /** The body of the petition message on HTML format. */
  emailBody?: Maybe<Scalars['String']>;
  /** The subject of the petition message. */
  emailSubject?: Maybe<Scalars['JSON']>;
  /** The ID of the petition message. */
  id: Scalars['GID'];
  /** Tells when the email was opened for the first time. */
  openedAt?: Maybe<Scalars['DateTime']>;
  /** Time at which the message will be sent. */
  scheduledAt?: Maybe<Scalars['DateTime']>;
  /** The sender of this petition message. */
  sender: User;
  /** If already sent, the date at which the email was sent. */
  sentAt?: Maybe<Scalars['DateTime']>;
  /** The status of the petition message */
  status: PetitionMessageStatus;
}

/** The status of a petition message. */
export type PetitionMessageStatus =
  /** The message was scheduled but has been cancelled. */
  | 'CANCELLED'
  /** The message has been processed. */
  | 'PROCESSED'
  /** The message is being processed. */
  | 'PROCESSING'
  /** The message has been scheduled to be sent at a specific time. */
  | 'SCHEDULED';

export interface PetitionPermission {
  /** Time when the resource was created. */
  createdAt: Scalars['DateTime'];
  /** wether user is subscribed or not to emails and alerts of the petition */
  isSubscribed: Scalars['Boolean'];
  /** The type of the permission. */
  permissionType: PetitionPermissionType;
  /** The petition linked to the permission. */
  petition: Petition;
  /** Time when the resource was last updated. */
  updatedAt: Scalars['DateTime'];
}

/** The type of permission for a petition user. */
export type PetitionPermissionType =
  | 'OWNER'
  | 'READ'
  | 'WRITE';

/** The READ and WRITE permissions for a petition user. */
export type PetitionPermissionTypeRW =
  | 'READ'
  | 'WRITE';

/** The progress of a petition. */
export interface PetitionProgress {
  __typename?: 'PetitionProgress';
  /** Number of optional fields not replied or validated */
  optional: Scalars['Int'];
  /** Number of fields with a reply and not validated */
  replied: Scalars['Int'];
  /** Total number of fields in the petition */
  total: Scalars['Int'];
  /** Number of fields validated */
  validated: Scalars['Int'];
}

export interface PetitionReminder extends CreatedAt {
  __typename?: 'PetitionReminder';
  /** The access of this petition message. */
  access: PetitionAccess;
  /** Time when the resource was created. */
  createdAt: Scalars['DateTime'];
  /** The body of the message in HTML format. */
  emailBody?: Maybe<Scalars['String']>;
  id: Scalars['GID'];
  /** The sender of this petition message. */
  sender?: Maybe<User>;
  /** The type of the reminder. */
  type: PetitionReminderType;
}

/** The type of a petition reminder. */
export type PetitionReminderType =
  /** The reminder has been sent by the system according to the reminders configuration. */
  | 'AUTOMATIC'
  /** The reminder has been sent manually by a user. */
  | 'MANUAL';

export interface PetitionReopenedEvent extends PetitionEvent {
  __typename?: 'PetitionReopenedEvent';
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  user?: Maybe<User>;
}

export interface PetitionSharedUserNotification extends PetitionUserNotification {
  __typename?: 'PetitionSharedUserNotification';
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  isRead: Scalars['Boolean'];
  owner: User;
  permissionType: PetitionPermissionTypeRW;
  petition: PetitionBase;
  sharedWith: UserOrUserGroup;
}

export interface PetitionSharedWithFilter {
  filters: Array<PetitionSharedWithFilterLine>;
  operator: FilterSharedWithLogicalOperator;
}

export interface PetitionSharedWithFilterLine {
  operator: FilterSharedWithOperator;
  value: Scalars['ID'];
}

export type PetitionSignatureCancelReason =
  | 'CANCELLED_BY_USER'
  | 'DECLINED_BY_SIGNER'
  | 'REQUEST_ERROR';

export interface PetitionSignatureRequest extends Timestamps {
  __typename?: 'PetitionSignatureRequest';
  auditTrailFilename?: Maybe<Scalars['String']>;
  /** Time when the resource was created. */
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  /** Metadata for this signature request. */
  metadata: Scalars['JSONObject'];
  petition: Petition;
  /** The signature configuration for the request. */
  signatureConfig: SignatureConfig;
  signedDocumentFilename?: Maybe<Scalars['String']>;
  /** The status of the petition signature. */
  status: PetitionSignatureRequestStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars['DateTime'];
}

export type PetitionSignatureRequestStatus =
  | 'CANCELLED'
  | 'COMPLETED'
  | 'ENQUEUED'
  | 'PROCESSING';

/** The status of a petition. */
export type PetitionStatus =
  /** The petition has been closed by a user. */
  | 'CLOSED'
  /** The petition has been completed. */
  | 'COMPLETED'
  /** The petition has not been sent yet. */
  | 'DRAFT'
  /** The petition has been sent and is awaiting completion. */
  | 'PENDING';

/** A petition template */
export interface PetitionTemplate extends PetitionBase {
  __typename?: 'PetitionTemplate';
  /** Time when the resource was created. */
  createdAt: Scalars['DateTime'];
  /** Description of the template. */
  description?: Maybe<Scalars['JSON']>;
  /** HTML excerpt of the template description. */
  descriptionExcerpt?: Maybe<Scalars['String']>;
  /** HTML description of the template. */
  descriptionHtml?: Maybe<Scalars['String']>;
  /** The body of the petition. */
  emailBody?: Maybe<Scalars['JSON']>;
  /** The subject of the petition. */
  emailSubject?: Maybe<Scalars['String']>;
  /** The number of fields in the petition. */
  fieldCount: Scalars['Int'];
  /** The definition of the petition fields. */
  fields: Array<PetitionField>;
  /** Whether comments are enabled or not. */
  hasCommentsEnabled: Scalars['Boolean'];
  /** The ID of the petition or template. */
  id: Scalars['GID'];
  /** Whether the template is publicly available or not */
  isPublic: Scalars['Boolean'];
  isReadOnly: Scalars['Boolean'];
  /**
   * Whether the contents card is hidden in the recipient view.
   * @deprecated Don't use this
   */
  isRecipientViewContentsHidden: Scalars['Boolean'];
  /** The locale of the petition. */
  locale: PetitionLocale;
  /** The effective permission of the logged user. Will return Null if the user doesn't have access to the petition (e.g. on public templates). */
  myEffectivePermission?: Maybe<EffectivePetitionUserPermission>;
  /** The name of the petition. */
  name?: Maybe<Scalars['String']>;
  organization: Organization;
  owner: User;
  /** The permissions linked to the petition */
  permissions: Array<PetitionPermission>;
  /** The public link linked to this template */
  publicLink?: Maybe<PublicPetitionLink>;
  /** Whether to skip the forward security check on the recipient view. */
  skipForwardSecurity: Scalars['Boolean'];
  /** The tags linked to the petition */
  tags: Array<Tag>;
  /** Time when the resource was last updated. */
  updatedAt: Scalars['DateTime'];
}

export interface PetitionTemplateAndField extends PetitionBaseAndField {
  __typename?: 'PetitionTemplateAndField';
  field: PetitionField;
  petition: PetitionTemplate;
}

export interface PetitionTemplatePagination {
  __typename?: 'PetitionTemplatePagination';
  /** The requested slice of items. */
  items: Array<PetitionTemplate>;
  /** The total count of items in the list. */
  totalCount: Scalars['Int'];
}

/** The permission for a petition and user group */
export interface PetitionUserGroupPermission extends PetitionPermission, Timestamps {
  __typename?: 'PetitionUserGroupPermission';
  /** Time when the resource was created. */
  createdAt: Scalars['DateTime'];
  /** The group linked to the permission */
  group: UserGroup;
  /** wether user is subscribed or not to emails and alerts of the petition */
  isSubscribed: Scalars['Boolean'];
  /** The type of the permission. */
  permissionType: PetitionPermissionType;
  /** The petition linked to the permission. */
  petition: Petition;
  /** Time when the resource was last updated. */
  updatedAt: Scalars['DateTime'];
}

export interface PetitionUserNotification {
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  isRead: Scalars['Boolean'];
  petition: PetitionBase;
}

/** The types of notifications available for filtering */
export type PetitionUserNotificationFilter =
  | 'ALL'
  | 'COMMENTS'
  | 'COMPLETED'
  | 'OTHER'
  | 'SHARED'
  | 'UNREAD';

/** The permission for a petition and user */
export interface PetitionUserPermission extends PetitionPermission, Timestamps {
  __typename?: 'PetitionUserPermission';
  /** Time when the resource was created. */
  createdAt: Scalars['DateTime'];
  /** wether user is subscribed or not to emails and alerts of the petition */
  isSubscribed: Scalars['Boolean'];
  /** The type of the permission. */
  permissionType: PetitionPermissionType;
  /** The petition linked to the permission. */
  petition: Petition;
  /** Time when the resource was last updated. */
  updatedAt: Scalars['DateTime'];
  /** The user linked to the permission */
  user: User;
}

export interface PetitionWithFieldAndReplies {
  __typename?: 'PetitionWithFieldAndReplies';
  field: PetitionField;
  petition: Petition;
  replies: Array<PetitionFieldReply>;
}

export interface PublicAccessVerification {
  __typename?: 'PublicAccessVerification';
  cookieName?: Maybe<Scalars['String']>;
  cookieValue?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  isAllowed: Scalars['Boolean'];
  orgLogoUrl?: Maybe<Scalars['String']>;
  orgName?: Maybe<Scalars['String']>;
}

/** A public view of a contact */
export interface PublicContact {
  __typename?: 'PublicContact';
  /** The email of the user. */
  email: Scalars['String'];
  /** The first name of the user. */
  firstName?: Maybe<Scalars['String']>;
  /** The full name of the user. */
  fullName?: Maybe<Scalars['String']>;
  /** The ID of the contact. */
  id: Scalars['GID'];
  /** The last name of the user. */
  lastName?: Maybe<Scalars['String']>;
}

/** A public view of an organization */
export interface PublicOrganization {
  __typename?: 'PublicOrganization';
  /** The ID of the organization. */
  id: Scalars['GID'];
  /** The identifier of the organization. */
  identifier: Scalars['String'];
  /** The logo of the organization. */
  logoUrl?: Maybe<Scalars['String']>;
  /** The name of the organization. */
  name: Scalars['String'];
}

/** A public view of the petition */
export interface PublicPetition extends Timestamps {
  __typename?: 'PublicPetition';
  /** Time when the resource was created. */
  createdAt: Scalars['DateTime'];
  /** The deadline of the petition. */
  deadline?: Maybe<Scalars['DateTime']>;
  /** The field definition of the petition. */
  fields: Array<PublicPetitionField>;
  /** Whether comments are enabled or not. */
  hasCommentsEnabled: Scalars['Boolean'];
  /** The ID of the petition. */
  id: Scalars['GID'];
  /**
   * Whether the contents card is hidden in the recipient view.
   * @deprecated Don't use this
   */
  isRecipientViewContentsHidden: Scalars['Boolean'];
  /** The locale of the petition. */
  locale: PetitionLocale;
  /** The recipients of the petition */
  recipients: Array<PublicContact>;
  /** The signature config of the petition */
  signature?: Maybe<PublicSignatureConfig>;
  signatureStatus?: Maybe<PublicSignatureStatus>;
  /** The status of the petition. */
  status: PetitionStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars['DateTime'];
}

/** A public view of a petition access */
export interface PublicPetitionAccess {
  __typename?: 'PublicPetitionAccess';
  contact?: Maybe<PublicContact>;
  granter?: Maybe<PublicUser>;
  message?: Maybe<PublicPetitionMessage>;
  petition?: Maybe<PublicPetition>;
}

/** A field within a petition. */
export interface PublicPetitionField {
  __typename?: 'PublicPetitionField';
  /** A list of files attached to this field. */
  attachments: Array<PetitionFieldAttachment>;
  commentCount: Scalars['Int'];
  /** The comments for this field. */
  comments: Array<PublicPetitionFieldComment>;
  /** The description of the petition field. */
  description?: Maybe<Scalars['String']>;
  /** The ID of the petition field. */
  id: Scalars['GID'];
  /** Determines if the field accepts replies */
  isReadOnly: Scalars['Boolean'];
  /** Determines if this field allows multiple replies. */
  multiple: Scalars['Boolean'];
  /** Determines if this field is optional. */
  optional: Scalars['Boolean'];
  /** The options of the petition field. */
  options: Scalars['JSONObject'];
  /** The replies to the petition field */
  replies: Array<PublicPetitionFieldReply>;
  /** The title of the petition field. */
  title?: Maybe<Scalars['String']>;
  /** The type of the petition field. */
  type: PetitionFieldType;
  unreadCommentCount: Scalars['Int'];
  /** Determines if the content of this field has been validated. */
  validated: Scalars['Boolean'];
  /** A JSON object representing the conditions for the field to be visible */
  visibility?: Maybe<Scalars['JSONObject']>;
}

/** A comment on a petition field */
export interface PublicPetitionFieldComment {
  __typename?: 'PublicPetitionFieldComment';
  /** The author of the comment. */
  author?: Maybe<PublicUserOrContact>;
  /** The content of the comment. */
  content: Scalars['String'];
  /** Time when the comment was created. */
  createdAt: Scalars['DateTime'];
  /** The ID of the petition field comment. */
  id: Scalars['GID'];
  /** Whether the comment has been read or not. */
  isUnread: Scalars['Boolean'];
}

/** A reply to a petition field */
export interface PublicPetitionFieldReply extends Timestamps {
  __typename?: 'PublicPetitionFieldReply';
  /** The public content of the reply */
  content: Scalars['JSONObject'];
  /** Time when the resource was created. */
  createdAt: Scalars['DateTime'];
  /** The ID of the petition field reply. */
  id: Scalars['GID'];
  /** The status of the petition field reply. */
  status: PetitionFieldReplyStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars['DateTime'];
}

export interface PublicPetitionLink {
  __typename?: "PublicPetitionLink";
  description: Scalars["String"];
  id: Scalars["GID"];
  isActive: Scalars["Boolean"];
  linkPermissions: Array<PublicPetitionLinkPermission>;
  organization: PublicPetitionLinkOwnerOrganization;
  slug: Scalars["String"];
  title: Scalars["String"];
}

export interface PublicPetitionLinkOwnerOrganization {
  __typename?: "PublicPetitionLinkOwnerOrganization";
  logoUrl?: Maybe<Scalars["String"]>;
  name: Scalars["String"];
}

export interface PublicPetitionLinkPermission {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  isSubscribed: Scalars["Boolean"];
  permissionType: PetitionPermissionType;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
}

export interface PublicPetitionLinkUserGroupPermission
  extends PublicPetitionLinkPermission,
    Timestamps {
  __typename?: "PublicPetitionLinkUserGroupPermission";
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  group: UserGroup;
  isSubscribed: Scalars["Boolean"];
  permissionType: PetitionPermissionType;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
}

export interface PublicPetitionLinkUserPermission extends PublicPetitionLinkPermission, Timestamps {
  __typename?: "PublicPetitionLinkUserPermission";
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  isSubscribed: Scalars["Boolean"];
  permissionType: PetitionPermissionType;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
  user: User;
}

/** A public message in a petition */
export interface PublicPetitionMessage {
  __typename?: 'PublicPetitionMessage';
  /** The ID of the message. */
  id: Scalars['GID'];
  /** Subject of a email. */
  subject?: Maybe<Scalars['String']>;
}

export interface PublicPetitionSignerData {
  email: Scalars['String'];
  firstName: Scalars['String'];
  lastName: Scalars['String'];
  message?: Maybe<Scalars['String']>;
}

/** The public signature settings of a petition */
export interface PublicSignatureConfig {
  __typename?: 'PublicSignatureConfig';
  /** If true, lets the user review the replies before starting the signature process */
  review: Scalars['Boolean'];
  /** The contacts that need to sign the generated document. */
  signers: Array<Maybe<PublicContact>>;
}

export type PublicSignatureStatus =
  | 'COMPLETED'
  | 'STARTED';

/** A public view of a user */
export interface PublicUser {
  __typename?: 'PublicUser';
  /** The email of the user. */
  email: Scalars['String'];
  /** The first name of the user. */
  firstName?: Maybe<Scalars['String']>;
  /** The full name of the user. */
  fullName?: Maybe<Scalars['String']>;
  /** The ID of the user. */
  id: Scalars['GID'];
  /** The last name of the user. */
  lastName?: Maybe<Scalars['String']>;
  /** The organization of the user. */
  organization: PublicOrganization;
}

export type PublicUserOrContact = PublicContact | PublicUser;

export interface Query {
  __typename?: 'Query';
  access?: Maybe<PublicPetitionAccess>;
  contact?: Maybe<Contact>;
  /** The contacts of the user */
  contacts: ContactPagination;
  /** Matches the emails passed as argument with a Contact in the database. Returns a list of nullable Contacts */
  contactsByEmail: Array<Maybe<Contact>>;
  /** Checks if the provided email is available to be registered as a user on Parallel */
  emailIsAvailable: Scalars['Boolean'];
  /** Get users or groups from IDs */
  getUsersOrGroups: Array<UserOrUserGroup>;
  /** Decodes the given Global ID into an entity in the database. */
  globalIdDecode: SupportMethodResponse;
  /** Encodes the given ID into a Global ID. */
  globalIdEncode: SupportMethodResponse;
  landingTemplateBySlug?: Maybe<LandingTemplate>;
  landingTemplates: LandingTemplatePagination;
  landingTemplatesSamples: Array<LandingTemplateSample>;
  me: User;
  organization?: Maybe<Organization>;
  /** The organizations registered in Parallel. */
  organizations: OrganizationPagination;
  petition?: Maybe<PetitionBase>;
  petitionAuthToken?: Maybe<Petition>;
  /** The comments for this field. */
  petitionFieldComments: Array<PublicPetitionFieldComment>;
  /** The petitions of the user */
  petitions: PetitionBasePagination;
  petitionsById: Array<Maybe<PetitionBase>>;
  publicOrgLogoUrl?: Maybe<Scalars["String"]>;
  publicPetitionLinkBySlug?: Maybe<PublicPetitionLink>;
  /** The publicly available templates */
  publicTemplates: PetitionTemplatePagination;
  /** Search users and user groups */
  searchUsers: Array<UserOrUserGroup>;
  /** Paginated list of tags in the organization */
  tags: TagPagination;
  userGroup?: Maybe<UserGroup>;
  /** Paginated list of user groups in the organization */
  userGroups: UserGroupPagination;
}


export interface QueryaccessArgs {
  keycode: Scalars['ID'];
}


export interface QuerycontactArgs {
  id: Scalars['GID'];
}


export interface QuerycontactsArgs {
  exclude?: Maybe<Array<Scalars['GID']>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<QueryContacts_OrderBy>>;
}


export interface QuerycontactsByEmailArgs {
  emails: Array<Scalars['String']>;
}


export interface QueryemailIsAvailableArgs {
  email: Scalars['String'];
}


export interface QuerygetUsersOrGroupsArgs {
  ids: Array<Scalars['ID']>;
}


export interface QueryglobalIdDecodeArgs {
  id: Scalars['ID'];
}


export interface QueryglobalIdEncodeArgs {
  id: Scalars['Int'];
  type: EntityType;
}


export interface QuerylandingTemplateBySlugArgs {
  slug: Scalars['String'];
}


export interface QuerylandingTemplatesArgs {
  categories?: Maybe<Array<Scalars['String']>>;
  limit?: Maybe<Scalars['Int']>;
  locale: PetitionLocale;
  offset?: Maybe<Scalars['Int']>;
}


export interface QueryorganizationArgs {
  id: Scalars['GID'];
}


export interface QueryorganizationsArgs {
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<QueryOrganizations_OrderBy>>;
  status?: Maybe<OrganizationStatus>;
}


export interface QuerypetitionArgs {
  id: Scalars['GID'];
}


export interface QuerypetitionAuthTokenArgs {
  token: Scalars['String'];
}


export interface QuerypetitionFieldCommentsArgs {
  keycode: Scalars['ID'];
  petitionFieldId: Scalars['GID'];
}


export interface QuerypetitionsArgs {
  filters?: Maybe<PetitionFilter>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<QueryPetitions_OrderBy>>;
}


export interface QuerypetitionsByIdArgs {
  ids: Array<Scalars['GID']>;
}


export interface QuerypublicOrgLogoUrlArgs {
  id: Scalars['GID'];
}

export interface QuerypublicPetitionLinkBySlugArgs {
  slug: Scalars["String"];
}

export interface QuerypublicTemplatesArgs {
  limit?: Maybe<Scalars['Int']>;
  locale?: Maybe<PetitionLocale>;
  offset?: Maybe<Scalars['Int']>;
  search?: Maybe<Scalars['String']>;
}


export interface QuerysearchUsersArgs {
  excludeUserGroups?: Maybe<Array<Scalars['GID']>>;
  excludeUsers?: Maybe<Array<Scalars['GID']>>;
  includeGroups?: Maybe<Scalars['Boolean']>;
  includeInactive?: Maybe<Scalars['Boolean']>;
  search: Scalars['String'];
}


export interface QuerytagsArgs {
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  search?: Maybe<Scalars['String']>;
}


export interface QueryuserGroupArgs {
  id: Scalars['GID'];
}


export interface QueryuserGroupsArgs {
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<QueryUserGroups_OrderBy>>;
}

/** Order to use on Query.contacts */
export type QueryContacts_OrderBy =
  | 'createdAt_ASC'
  | 'createdAt_DESC'
  | 'email_ASC'
  | 'email_DESC'
  | 'firstName_ASC'
  | 'firstName_DESC'
  | 'fullName_ASC'
  | 'fullName_DESC'
  | 'lastName_ASC'
  | 'lastName_DESC';

/** Order to use on Query.organizations */
export type QueryOrganizations_OrderBy =
  | 'createdAt_ASC'
  | 'createdAt_DESC'
  | 'name_ASC'
  | 'name_DESC';

/** Order to use on Query.petitions */
export type QueryPetitions_OrderBy =
  | 'createdAt_ASC'
  | 'createdAt_DESC'
  | 'lastUsedAt_ASC'
  | 'lastUsedAt_DESC'
  | 'name_ASC'
  | 'name_DESC'
  | 'sentAt_ASC'
  | 'sentAt_DESC';

/** Order to use on Query.userGroups */
export type QueryUserGroups_OrderBy =
  | 'createdAt_ASC'
  | 'createdAt_DESC'
  | 'name_ASC'
  | 'name_DESC';

export interface ReminderEmailBouncedUserNotification extends PetitionUserNotification {
  __typename?: 'ReminderEmailBouncedUserNotification';
  access: PetitionAccess;
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  isRead: Scalars['Boolean'];
  petition: PetitionBase;
}

export interface ReminderSentEvent extends PetitionEvent {
  __typename?: 'ReminderSentEvent';
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  reminder: PetitionReminder;
}

/** The reminder settings of a petition */
export interface RemindersConfig {
  __typename?: 'RemindersConfig';
  /** The amount of days between reminders. */
  offset: Scalars['Int'];
  /** The time at which the reminder should be sent. */
  time: Scalars['String'];
  /** The timezone the time is referring to. */
  timezone: Scalars['String'];
  /** Whether to send reminders only from monday to friday. */
  weekdaysOnly: Scalars['Boolean'];
}

/** The reminders settings for the petition */
export interface RemindersConfigInput {
  /** The amount of days between reminders. */
  offset: Scalars['Int'];
  /** The time at which the reminder should be sent. */
  time: Scalars['String'];
  /** The timezone the time is referring to. */
  timezone: Scalars['String'];
  /** Whether to send reminders only from monday to friday. */
  weekdaysOnly: Scalars['Boolean'];
}

export interface RemindersOptOutEvent extends PetitionEvent {
  __typename?: 'RemindersOptOutEvent';
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  other?: Maybe<Scalars["String"]>;
  reason: Scalars["String"];
}

export interface RemindersOptOutNotification extends PetitionUserNotification {
  __typename?: 'RemindersOptOutNotification';
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  isRead: Scalars["Boolean"];
  other?: Maybe<Scalars["String"]>;
  petition: PetitionBase;
  reason: Scalars['String'];
}

export interface ReplyCreatedEvent extends PetitionEvent {
  __typename?: 'ReplyCreatedEvent';
  createdAt: Scalars['DateTime'];
  createdBy?: Maybe<UserOrPetitionAccess>;
  field?: Maybe<PetitionField>;
  id: Scalars['GID'];
  reply?: Maybe<PetitionFieldReply>;
}

export interface ReplyDeletedEvent extends PetitionEvent {
  __typename?: 'ReplyDeletedEvent';
  createdAt: Scalars['DateTime'];
  deletedBy?: Maybe<UserOrPetitionAccess>;
  field?: Maybe<PetitionField>;
  id: Scalars['GID'];
}

export interface ReplyUpdatedEvent extends PetitionEvent {
  __typename?: 'ReplyUpdatedEvent';
  createdAt: Scalars['DateTime'];
  field?: Maybe<PetitionField>;
  id: Scalars['GID'];
  reply?: Maybe<PetitionFieldReply>;
  updatedBy?: Maybe<UserOrPetitionAccess>;
}

/** Represents the result of an operation. */
export type Result =
  | 'FAILURE'
  | 'SUCCESS';

export interface SendPetitionResult {
  __typename?: 'SendPetitionResult';
  accesses?: Maybe<Array<PetitionAccess>>;
  petition?: Maybe<Petition>;
  result: Result;
}

export interface SignatureCancelledEvent extends PetitionEvent {
  __typename?: 'SignatureCancelledEvent';
  cancelType: PetitionSignatureCancelReason;
  cancellerReason?: Maybe<Scalars['String']>;
  contact?: Maybe<Contact>;
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  user?: Maybe<User>;
}

export interface SignatureCancelledUserNotification extends PetitionUserNotification {
  __typename?: 'SignatureCancelledUserNotification';
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  isRead: Scalars['Boolean'];
  petition: PetitionBase;
}

export interface SignatureCompletedEvent extends PetitionEvent {
  __typename?: 'SignatureCompletedEvent';
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
}

export interface SignatureCompletedUserNotification extends PetitionUserNotification {
  __typename?: 'SignatureCompletedUserNotification';
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  isRead: Scalars['Boolean'];
  petition: PetitionBase;
}

/** The signature settings of a petition */
export interface SignatureConfig {
  __typename?: 'SignatureConfig';
  /** The contacts that need to sign the generated document. */
  contacts: Array<Maybe<Contact>>;
  /** The selected provider for the signature. */
  provider: Scalars['String'];
  /** If true, lets the user review the replies before starting the signature process */
  review: Scalars['Boolean'];
  /** The timezone used to generate the document. */
  timezone: Scalars['String'];
  /** Title of the signature document */
  title: Scalars['String'];
}

/** The signature settings for the petition */
export interface SignatureConfigInput {
  /** The contacts that need to sign the generated document. */
  contactIds: Array<Scalars['ID']>;
  /** The selected provider for the signature. */
  provider: Scalars['String'];
  /** If true, lets the user review the replies before starting the signature process */
  review: Scalars['Boolean'];
  /** The timezone used to generate the document. */
  timezone: Scalars['String'];
  /** The title of the signing document */
  title: Scalars['String'];
}

export interface SignatureStartedEvent extends PetitionEvent {
  __typename?: 'SignatureStartedEvent';
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
}

export interface Subscription extends Timestamps {
  __typename?: 'Subscription';
  /** Time when the resource was created. */
  createdAt: Scalars['DateTime'];
  endpoint: Scalars['String'];
  id: Scalars['GID'];
  petition: Petition;
  /** Time when the resource was last updated. */
  updatedAt: Scalars['DateTime'];
}

/** Return type for all support methods */
export interface SupportMethodResponse {
  __typename?: 'SupportMethodResponse';
  message?: Maybe<Scalars['String']>;
  result: Result;
}

export interface Tag {
  __typename?: 'Tag';
  /** The color of the tag in hex format (example: #FFFFFF) */
  color: Scalars['String'];
  /** Time when the resource was created. */
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  name: Scalars['String'];
}

export interface TagPagination {
  __typename?: 'TagPagination';
  /** The requested slice of items. */
  items: Array<Tag>;
  /** The total count of items in the list. */
  totalCount: Scalars['Int'];
}

export interface TemplateUsedEvent extends PetitionEvent {
  __typename?: 'TemplateUsedEvent';
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
}

export interface Timestamps {
  /** Time when the resource was created. */
  createdAt: Scalars['DateTime'];
  /** Time when the resource was last updated. */
  updatedAt: Scalars['DateTime'];
}

export interface UpdateContactInput {
  firstName?: Maybe<Scalars['String']>;
  lastName?: Maybe<Scalars['String']>;
}

export interface UpdatePetitionFieldInput {
  description?: Maybe<Scalars['String']>;
  multiple?: Maybe<Scalars['Boolean']>;
  optional?: Maybe<Scalars['Boolean']>;
  options?: Maybe<Scalars['JSONObject']>;
  title?: Maybe<Scalars['String']>;
  visibility?: Maybe<Scalars['JSONObject']>;
}

export interface UpdatePetitionInput {
  deadline?: Maybe<Scalars['DateTime']>;
  description?: Maybe<Scalars['JSON']>;
  emailBody?: Maybe<Scalars['JSON']>;
  emailSubject?: Maybe<Scalars['String']>;
  hasCommentsEnabled?: Maybe<Scalars['Boolean']>;
  isReadOnly?: Maybe<Scalars['Boolean']>;
  isRecipientViewContentsHidden?: Maybe<Scalars['Boolean']>;
  locale?: Maybe<PetitionLocale>;
  name?: Maybe<Scalars['String']>;
  remindersConfig?: Maybe<RemindersConfigInput>;
  signatureConfig?: Maybe<SignatureConfigInput>;
  skipForwardSecurity?: Maybe<Scalars['Boolean']>;
}

export interface UpdateTagInput {
  color?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
}

export interface UpdateUserGroupInput {
  name?: Maybe<Scalars['String']>;
}

export interface UpdateUserInput {
  firstName?: Maybe<Scalars['String']>;
  lastName?: Maybe<Scalars['String']>;
  role?: Maybe<OrganizationRole>;
}


/** A user in the system. */
export interface User extends Timestamps {
  __typename?: 'User';
  /** Lists every auth token of the user */
  authenticationTokens: UserAuthenticationTokenPagination;
  /** URL to the user avatar */
  avatarUrl?: Maybe<Scalars['String']>;
  /** Time when the resource was created. */
  createdAt: Scalars['DateTime'];
  /** The email of the user. */
  email: Scalars['String'];
  /** The first name of the user. */
  firstName?: Maybe<Scalars['String']>;
  /** The full name of the user. */
  fullName?: Maybe<Scalars['String']>;
  hasFeatureFlag: Scalars['Boolean'];
  /** The ID of the user. */
  id: Scalars['GID'];
  isSsoUser: Scalars['Boolean'];
  isSuperAdmin: Scalars['Boolean'];
  lastActiveAt?: Maybe<Scalars['DateTime']>;
  /** The last name of the user. */
  lastName?: Maybe<Scalars['String']>;
  /** Read and unread user notifications about events on their petitions */
  notifications: UserNotifications_Pagination;
  /** The onboarding status for the different views of the app. */
  onboardingStatus: Scalars['JSONObject'];
  organization: Organization;
  role: OrganizationRole;
  status: UserStatus;
  unreadNotificationIds: Array<Scalars['ID']>;
  /** Time when the resource was last updated. */
  updatedAt: Scalars['DateTime'];
}


/** A user in the system. */
export interface UserauthenticationTokensArgs {
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<UserAuthenticationTokens_OrderBy>>;
}


/** A user in the system. */
export interface UserhasFeatureFlagArgs {
  featureFlag: FeatureFlag;
}


/** A user in the system. */
export interface UsernotificationsArgs {
  before?: Maybe<Scalars['DateTime']>;
  filter?: Maybe<PetitionUserNotificationFilter>;
  limit?: Maybe<Scalars['Int']>;
}

export interface UserAuthenticationToken extends CreatedAt {
  __typename?: 'UserAuthenticationToken';
  /** Time when the resource was created. */
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  lastUsedAt?: Maybe<Scalars['DateTime']>;
  tokenName: Scalars['String'];
}

export interface UserAuthenticationTokenPagination {
  __typename?: 'UserAuthenticationTokenPagination';
  /** The requested slice of items. */
  items: Array<UserAuthenticationToken>;
  /** The total count of items in the list. */
  totalCount: Scalars['Int'];
}

/** Order to use on User.authenticationTokens */
export type UserAuthenticationTokens_OrderBy =
  | 'createdAt_ASC'
  | 'createdAt_DESC'
  | 'lastUsedAt_ASC'
  | 'lastUsedAt_DESC'
  | 'tokenName_ASC'
  | 'tokenName_DESC';

export interface UserGroup extends Timestamps {
  __typename?: 'UserGroup';
  /** Time when the resource was created. */
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  members: Array<UserGroupMember>;
  name: Scalars['String'];
  /** Time when the resource was last updated. */
  updatedAt: Scalars['DateTime'];
}

export interface UserGroupMember {
  __typename?: 'UserGroupMember';
  /** The time the user was added to the user group. */
  addedAt: Scalars['DateTime'];
  id: Scalars['GID'];
  user: User;
}

export interface UserGroupPagination {
  __typename?: 'UserGroupPagination';
  /** The requested slice of items. */
  items: Array<UserGroup>;
  /** The total count of items in the list. */
  totalCount: Scalars['Int'];
}

export interface UserNotifications_Pagination {
  __typename?: 'UserNotifications_Pagination';
  /** Whether this resource has more items. */
  hasMore: Scalars['Boolean'];
  /** The requested slice of items. */
  items: Array<PetitionUserNotification>;
}

export type UserOrContact = Contact | User;

export type UserOrPetitionAccess = PetitionAccess | User;

export type UserOrUserGroup = User | UserGroup;

export interface UserOrUserGroupPublicLinkPermission {
  /** Global ID of the User or UserGroup */
  id: Scalars["ID"];
  permissionType: PetitionPermissionTypeRW;
}

export interface UserPagination {
  __typename?: 'UserPagination';
  /** The requested slice of items. */
  items: Array<User>;
  /** The total count of items in the list. */
  totalCount: Scalars['Int'];
}

export interface UserPermissionAddedEvent extends PetitionEvent {
  __typename?: 'UserPermissionAddedEvent';
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  permissionType: PetitionPermissionType;
  permissionUser?: Maybe<User>;
  user?: Maybe<User>;
}

export interface UserPermissionEditedEvent extends PetitionEvent {
  __typename?: 'UserPermissionEditedEvent';
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  permissionType: PetitionPermissionType;
  permissionUser?: Maybe<User>;
  user?: Maybe<User>;
}

export interface UserPermissionRemovedEvent extends PetitionEvent {
  __typename?: 'UserPermissionRemovedEvent';
  createdAt: Scalars['DateTime'];
  id: Scalars['GID'];
  permissionUser?: Maybe<User>;
  user?: Maybe<User>;
}

export type UserStatus =
  | 'ACTIVE'
  | 'INACTIVE';

export interface VerificationCodeCheck {
  __typename?: 'VerificationCodeCheck';
  remainingAttempts?: Maybe<Scalars['Int']>;
  result: Result;
}

export interface VerificationCodeRequest {
  __typename?: 'VerificationCodeRequest';
  expiresAt: Scalars['DateTime'];
  remainingAttempts: Scalars['Int'];
  token: Scalars['ID'];
}

export type ContactLink_ContactFragment = { __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string };

export type ContactListPopover_ContactFragment = { __typename?: 'Contact', id: string, email: string, fullName?: Maybe<string> };

export type ContactListPopover_PublicContactFragment = { __typename?: 'PublicContact', id: string, email: string, fullName?: Maybe<string> };

export type ContactSelect_ContactFragment = { __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string };

export type OnboardingTour_UserFragment = { __typename?: 'User', onboardingStatus: { [key: string]: any } };

export type PetitionFieldSelect_PetitionFieldFragment = { __typename?: 'PetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, options: { [key: string]: any } };

export type PetitionSignatureCellContent_PetitionFragment = { __typename?: 'Petition', status: PetitionStatus, currentSignatureRequest?: Maybe<{ __typename?: 'PetitionSignatureRequest', status: PetitionSignatureRequestStatus }>, signatureConfig?: Maybe<{ __typename?: 'SignatureConfig', review: boolean }> };

export type PetitionSignatureCellContent_UserFragment = { __typename?: 'User', hasPetitionSignature: boolean };

export type PetitionStatusCellContent_PetitionFragment = { __typename?: 'Petition', status: PetitionStatus, progress: { __typename?: 'PetitionProgress', validated: number, replied: number, optional: number, total: number } };

export type PetitionTagListCellContent_TagFragment = { __typename?: 'Tag', id: string, name: string, color: string };

export type PetitionTagListCellContent_PetitionBase_Petition_Fragment = { __typename?: 'Petition', id: string, isReadOnly: boolean, tags: Array<{ __typename?: 'Tag', id: string, name: string, color: string }> };

export type PetitionTagListCellContent_PetitionBase_PetitionTemplate_Fragment = { __typename?: 'PetitionTemplate', id: string, isReadOnly: boolean, tags: Array<{ __typename?: 'Tag', id: string, name: string, color: string }> };

export type PetitionTagListCellContent_PetitionBaseFragment = PetitionTagListCellContent_PetitionBase_Petition_Fragment | PetitionTagListCellContent_PetitionBase_PetitionTemplate_Fragment;

export type PetitionTagListCellContent_tagsQueryVariables = Exact<{
  search?: Maybe<Scalars['String']>;
}>;


export type PetitionTagListCellContent_tagsQuery = { tags: { __typename?: 'TagPagination', items: Array<{ __typename?: 'Tag', id: string, name: string, color: string }> } };

export type PetitionTagListCellContent_tagPetitionMutationVariables = Exact<{
  tagId: Scalars['GID'];
  petitionId: Scalars['GID'];
}>;


export type PetitionTagListCellContent_tagPetitionMutation = { tagPetition: { __typename?: 'Petition', id: string, tags: Array<{ __typename?: 'Tag', id: string, name: string, color: string }> } | { __typename?: 'PetitionTemplate', id: string, tags: Array<{ __typename?: 'Tag', id: string, name: string, color: string }> } };

export type PetitionTagListCellContent_untagPetitionMutationVariables = Exact<{
  tagId: Scalars['GID'];
  petitionId: Scalars['GID'];
}>;


export type PetitionTagListCellContent_untagPetitionMutation = { untagPetition: { __typename?: 'Petition', id: string, tags: Array<{ __typename?: 'Tag', id: string, name: string, color: string }> } | { __typename?: 'PetitionTemplate', id: string, tags: Array<{ __typename?: 'Tag', id: string, name: string, color: string }> } };

export type PetitionTagListCellContent_createTagMutationVariables = Exact<{
  name: Scalars['String'];
  color: Scalars['String'];
}>;


export type PetitionTagListCellContent_createTagMutation = { createTag: { __typename?: 'Tag', id: string, name: string, color: string } };

export type ShareButton_PetitionBase_Petition_Fragment = { __typename?: 'Petition', permissions: Array<{ __typename?: 'PetitionUserGroupPermission', permissionType: PetitionPermissionType, group: { __typename?: 'UserGroup', id: string, name: string } } | { __typename?: 'PetitionUserPermission', permissionType: PetitionPermissionType, user: { __typename?: 'User', id: string, fullName?: Maybe<string> } }> };

export type ShareButton_PetitionBase_PetitionTemplate_Fragment = { __typename?: 'PetitionTemplate', permissions: Array<{ __typename?: 'PetitionUserGroupPermission', permissionType: PetitionPermissionType, group: { __typename?: 'UserGroup', id: string, name: string } } | { __typename?: 'PetitionUserPermission', permissionType: PetitionPermissionType, user: { __typename?: 'User', id: string, fullName?: Maybe<string> } }> };

export type ShareButton_PetitionBaseFragment = ShareButton_PetitionBase_Petition_Fragment | ShareButton_PetitionBase_PetitionTemplate_Fragment;

export type Tag_TagFragment = { __typename?: 'Tag', name: string, color: string };

export type TagEditDialog_TagFragment = { __typename?: 'Tag', id: string, createdAt: string, name: string, color: string };

export type TagEditDialog_tagsQueryVariables = Exact<{ [key: string]: never; }>;


export type TagEditDialog_tagsQuery = { tags: { __typename?: 'TagPagination', items: Array<{ __typename?: 'Tag', id: string, createdAt: string, name: string, color: string }> } };

export type TagEditDialog_updateTagMutationVariables = Exact<{
  id: Scalars['GID'];
  data: UpdateTagInput;
}>;


export type TagEditDialog_updateTagMutation = { updateTag: { __typename?: 'Tag', id: string, createdAt: string, name: string, color: string } };

export type UserAvatar_UserFragment = { __typename?: 'User', fullName?: Maybe<string>, avatarUrl?: Maybe<string> };

export type UserAvatarList_UserFragment = { __typename?: 'User', id: string, fullName?: Maybe<string> };

export type UserAvatarList_UserGroupFragment = { __typename?: 'UserGroup', id: string, name: string };

export type UserListPopover_UserFragment = { __typename?: 'User', id: string, fullName?: Maybe<string> };

export type UserListPopover_UserGroupFragment = { __typename?: 'UserGroup', id: string, name: string };

export type UserSelect_UserFragment = { __typename?: 'User', id: string, fullName?: Maybe<string>, email: string };

export type UserSelect_UserGroupFragment = { __typename?: 'UserGroup', id: string, name: string, members: Array<{ __typename?: 'UserGroupMember', user: { __typename?: 'User', id: string, fullName?: Maybe<string>, email: string } }> };

export type useSearchUsers_searchUsersQueryVariables = Exact<{
  search: Scalars['String'];
  excludeUsers?: Maybe<Array<Scalars['GID']> | Scalars['GID']>;
  excludeUserGroups?: Maybe<Array<Scalars['GID']> | Scalars['GID']>;
  includeGroups?: Maybe<Scalars['Boolean']>;
  includeInactive?: Maybe<Scalars['Boolean']>;
}>;


export type useSearchUsers_searchUsersQuery = { searchUsers: Array<{ __typename?: 'User', id: string, fullName?: Maybe<string>, email: string } | { __typename?: 'UserGroup', id: string, name: string, members: Array<{ __typename?: 'UserGroupMember', user: { __typename?: 'User', id: string, fullName?: Maybe<string>, email: string } }> }> };

export type useGetUsersOrGroupsQueryVariables = Exact<{
  ids: Array<Scalars['ID']> | Scalars['ID'];
}>;


export type useGetUsersOrGroupsQuery = { getUsersOrGroups: Array<{ __typename?: 'User', id: string, fullName?: Maybe<string>, email: string } | { __typename?: 'UserGroup', id: string, name: string, members: Array<{ __typename?: 'UserGroupMember', user: { __typename?: 'User', id: string, fullName?: Maybe<string>, email: string } }> }> };

export type WithAdminOrganizationRoleQueryVariables = Exact<{ [key: string]: never; }>;


export type WithAdminOrganizationRoleQuery = { me: { __typename?: 'User', role: OrganizationRole } };

export type HasFeatureFlagQueryVariables = Exact<{
  featureFlag: FeatureFlag;
}>;


export type HasFeatureFlagQuery = { me: { __typename?: 'User', id: string, hasFeatureFlag: boolean } };

export type WithSuperAdminAccessQueryVariables = Exact<{ [key: string]: never; }>;


export type WithSuperAdminAccessQuery = { me: { __typename?: 'User', isSuperAdmin: boolean } };

export type ImportContactsDialog_bulkCreateContactsMutationVariables = Exact<{
  file: Scalars['Upload'];
}>;


export type ImportContactsDialog_bulkCreateContactsMutation = { bulkCreateContacts: Array<{ __typename?: 'Contact', id: string }> };

export type AppLayout_UserFragment = { __typename?: 'User', id: string, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole };

export type AppLayout_updateOnboardingStatusMutationVariables = Exact<{
  key: OnboardingKey;
  status: OnboardingStatus;
}>;


export type AppLayout_updateOnboardingStatusMutation = { updateOnboardingStatus: { __typename?: 'User', id: string, onboardingStatus: { [key: string]: any } } };

export type AppLayoutNavbar_UserFragment = { __typename?: 'User', fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole };

export type HeaderNameEditable_PetitionBase_Petition_Fragment = { __typename?: 'Petition', name?: Maybe<string>, updatedAt: string, isReadOnly: boolean };

export type HeaderNameEditable_PetitionBase_PetitionTemplate_Fragment = { __typename?: 'PetitionTemplate', name?: Maybe<string>, updatedAt: string, isReadOnly: boolean };

export type HeaderNameEditable_PetitionBaseFragment = HeaderNameEditable_PetitionBase_Petition_Fragment | HeaderNameEditable_PetitionBase_PetitionTemplate_Fragment;

export type PetitionHeader_PetitionFragment = { __typename?: 'Petition', id: string, locale: PetitionLocale, deadline?: Maybe<string>, status: PetitionStatus, name?: Maybe<string>, updatedAt: string, isReadOnly: boolean, myEffectivePermission?: Maybe<{ __typename?: 'EffectivePetitionUserPermission', isSubscribed: boolean }> };

export type PetitionHeader_UserFragment = { __typename?: 'User', id: string, hasPetitionPdfExport: boolean };

export type PetitionHeader_reopenPetitionMutationVariables = Exact<{
  petitionId: Scalars['GID'];
}>;


export type PetitionHeader_reopenPetitionMutation = { reopenPetition: { __typename?: 'Petition', id: string, status: PetitionStatus, updatedAt: string } };

export type PetitionHeader_updatePetitionPermissionSubscriptionMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  isSubscribed: Scalars['Boolean'];
}>;


export type PetitionHeader_updatePetitionPermissionSubscriptionMutation = { updatePetitionPermissionSubscription: { __typename?: 'Petition', id: string, myEffectivePermission?: Maybe<{ __typename?: 'EffectivePetitionUserPermission', isSubscribed: boolean }> } };

export type PetitionLayout_PetitionBase_Petition_Fragment = { __typename?: 'Petition', id: string, name?: Maybe<string>, locale: PetitionLocale, deadline?: Maybe<string>, status: PetitionStatus, updatedAt: string, isReadOnly: boolean, myEffectivePermission?: Maybe<{ __typename?: 'EffectivePetitionUserPermission', isSubscribed: boolean }> };

export type PetitionLayout_PetitionBase_PetitionTemplate_Fragment = { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string>, locale: PetitionLocale, isPublic: boolean, updatedAt: string, isReadOnly: boolean };

export type PetitionLayout_PetitionBaseFragment = PetitionLayout_PetitionBase_Petition_Fragment | PetitionLayout_PetitionBase_PetitionTemplate_Fragment;

export type PetitionLayout_UserFragment = { __typename?: 'User', id: string, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole, hasPetitionPdfExport: boolean };

export type PetitionTemplateHeader_PetitionTemplateFragment = { __typename?: 'PetitionTemplate', id: string, locale: PetitionLocale, isPublic: boolean, name?: Maybe<string>, updatedAt: string, isReadOnly: boolean };

export type PetitionTemplateHeader_UserFragment = { __typename?: 'User', id: string };

export type SettingsLayout_UserFragment = { __typename?: 'User', id: string, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole };

export type UserMenu_UserFragment = { __typename?: 'User', fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole };

export type Notifications_UnreadPetitionUserNotificationIdsQueryVariables = Exact<{ [key: string]: never; }>;

export type NotificationsDrawer_PetitionUserNotification_AccessActivatedFromPublicPetitionLinkUserNotification_Fragment =
  {
    __typename?: "AccessActivatedFromPublicPetitionLinkUserNotification";
    id: string;
    createdAt: string;
    isRead: boolean;
    access: {
      __typename?: "PetitionAccess";
      contact?: Maybe<{
        __typename?: "Contact";
        id: string;
        fullName?: Maybe<string>;
        email: string;
      }>;
    };
    petition:
      | { __typename?: "Petition"; id: string; name?: Maybe<string> }
      | { __typename?: "PetitionTemplate"; id: string; name?: Maybe<string> };
  };

export type NotificationsDrawer_PetitionUserNotification_CommentCreatedUserNotification_Fragment = {
  __typename?: "CommentCreatedUserNotification";
  id: string;
  createdAt: string;
  isRead: boolean;
  field: { __typename?: "PetitionField"; id: string; title?: Maybe<string> };
  comment: {
    __typename?: "PetitionFieldComment";
    id: string;
    isInternal: boolean;
    author?: Maybe<
      | {
          __typename?: "PetitionAccess";
          contact?: Maybe<{
            __typename?: "Contact";
            id: string;
            fullName?: Maybe<string>;
            email: string;
          }>;
        }
      | { __typename?: "User"; id: string; fullName?: Maybe<string>; status: UserStatus }
    >;
  };
  petition:
    | { __typename?: "Petition"; id: string; name?: Maybe<string> }
    | { __typename?: "PetitionTemplate"; id: string; name?: Maybe<string> };
};

export type Notifications_UnreadPetitionUserNotificationIdsQuery = { me: { __typename?: 'User', id: string, unreadNotificationIds: Array<string> } };

export type NotificationsDrawer_PetitionUserNotification_CommentCreatedUserNotification_Fragment = { __typename?: 'CommentCreatedUserNotification', id: string, createdAt: string, isRead: boolean, field: { __typename?: 'PetitionField', id: string, title?: Maybe<string> }, comment: { __typename?: 'PetitionFieldComment', id: string, isInternal: boolean, author?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> }, petition: { __typename?: 'Petition', id: string, name?: Maybe<string> } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string> } };

export type NotificationsDrawer_PetitionUserNotification_MessageEmailBouncedUserNotification_Fragment = { __typename?: 'MessageEmailBouncedUserNotification', id: string, createdAt: string, isRead: boolean, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> }, petition: { __typename?: 'Petition', id: string, name?: Maybe<string> } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string> } };

export type NotificationsDrawer_PetitionUserNotification_PetitionCompletedUserNotification_Fragment = { __typename?: 'PetitionCompletedUserNotification', id: string, createdAt: string, isRead: boolean, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> }, petition: { __typename?: 'Petition', id: string, name?: Maybe<string> } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string> } };

export type NotificationsDrawer_PetitionUserNotification_RemindersOptOutNotification_Fragment = {
  __typename?: "RemindersOptOutNotification";
  reason: string;
  other?: Maybe<string>;
  id: string;
  createdAt: string;
  isRead: boolean;
  access: {
    __typename?: "PetitionAccess";
    contact?: Maybe<{
      __typename?: "Contact";
      id: string;
      fullName?: Maybe<string>;
      email: string;
    }>;
  };
  petition:
    | { __typename?: "Petition"; id: string; name?: Maybe<string> }
    | { __typename?: "PetitionTemplate"; id: string; name?: Maybe<string> };
};

export type NotificationsDrawer_PetitionUserNotification_ReminderEmailBouncedUserNotification_Fragment = { __typename?: 'ReminderEmailBouncedUserNotification', id: string, createdAt: string, isRead: boolean, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> }, petition: { __typename?: 'Petition', id: string, name?: Maybe<string> } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string> } };

export type NotificationsDrawer_PetitionUserNotification_RemindersOptOutNotification_Fragment = { __typename?: 'RemindersOptOutNotification', reason: string, other: string, id: string, createdAt: string, isRead: boolean, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> }, petition: { __typename?: 'Petition', id: string, name?: Maybe<string> } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string> } };

export type NotificationsDrawer_PetitionUserNotificationFragment =
  | NotificationsDrawer_PetitionUserNotification_AccessActivatedFromPublicPetitionLinkUserNotification_Fragment
  | NotificationsDrawer_PetitionUserNotification_CommentCreatedUserNotification_Fragment
  | NotificationsDrawer_PetitionUserNotification_MessageEmailBouncedUserNotification_Fragment
  | NotificationsDrawer_PetitionUserNotification_PetitionCompletedUserNotification_Fragment
  | NotificationsDrawer_PetitionUserNotification_PetitionSharedUserNotification_Fragment
  | NotificationsDrawer_PetitionUserNotification_ReminderEmailBouncedUserNotification_Fragment
  | NotificationsDrawer_PetitionUserNotification_RemindersOptOutNotification_Fragment
  | NotificationsDrawer_PetitionUserNotification_SignatureCancelledUserNotification_Fragment
  | NotificationsDrawer_PetitionUserNotification_SignatureCompletedUserNotification_Fragment;

export type NotificationsDrawer_PetitionUserNotification_SignatureCompletedUserNotification_Fragment = { __typename?: 'SignatureCompletedUserNotification', id: string, createdAt: string, isRead: boolean, petition: { __typename?: 'Petition', id: string, name?: Maybe<string> } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string> } };

export type NotificationsDrawer_PetitionUserNotificationFragment = NotificationsDrawer_PetitionUserNotification_CommentCreatedUserNotification_Fragment | NotificationsDrawer_PetitionUserNotification_MessageEmailBouncedUserNotification_Fragment | NotificationsDrawer_PetitionUserNotification_PetitionCompletedUserNotification_Fragment | NotificationsDrawer_PetitionUserNotification_PetitionSharedUserNotification_Fragment | NotificationsDrawer_PetitionUserNotification_ReminderEmailBouncedUserNotification_Fragment | NotificationsDrawer_PetitionUserNotification_RemindersOptOutNotification_Fragment | NotificationsDrawer_PetitionUserNotification_SignatureCancelledUserNotification_Fragment | NotificationsDrawer_PetitionUserNotification_SignatureCompletedUserNotification_Fragment;

export type NotificationsDrawer_PetitionUserNotificationsQueryVariables = Exact<{
  limit: Scalars['Int'];
  before?: Maybe<Scalars['DateTime']>;
  filter?: Maybe<PetitionUserNotificationFilter>;
}>;

export type NotificationsDrawer_PetitionUserNotificationsQuery = {
  me: {
    __typename?: "User";
    id: string;
    unreadNotificationIds: Array<string>;
    notifications: {
      __typename?: "UserNotifications_Pagination";
      hasMore: boolean;
      items: Array<
        | {
            __typename?: "AccessActivatedFromPublicPetitionLinkUserNotification";
            id: string;
            createdAt: string;
            isRead: boolean;
            access: {
              __typename?: "PetitionAccess";
              contact?: Maybe<{
                __typename?: "Contact";
                id: string;
                fullName?: Maybe<string>;
                email: string;
              }>;
            };
            petition:
              | { __typename?: "Petition"; id: string; name?: Maybe<string> }
              | { __typename?: "PetitionTemplate"; id: string; name?: Maybe<string> };
          }
        | {
            __typename?: "CommentCreatedUserNotification";
            id: string;
            createdAt: string;
            isRead: boolean;
            field: { __typename?: "PetitionField"; id: string; title?: Maybe<string> };
            comment: {
              __typename?: "PetitionFieldComment";
              id: string;
              isInternal: boolean;
              author?: Maybe<
                | {
                    __typename?: "PetitionAccess";
                    contact?: Maybe<{
                      __typename?: "Contact";
                      id: string;
                      fullName?: Maybe<string>;
                      email: string;
                    }>;
                  }
                | { __typename?: "User"; id: string; fullName?: Maybe<string>; status: UserStatus }
              >;
            };
            petition:
              | { __typename?: "Petition"; id: string; name?: Maybe<string> }
              | { __typename?: "PetitionTemplate"; id: string; name?: Maybe<string> };
          }
        | {
            __typename?: "MessageEmailBouncedUserNotification";
            id: string;
            createdAt: string;
            isRead: boolean;
            access: {
              __typename?: "PetitionAccess";
              contact?: Maybe<{
                __typename?: "Contact";
                id: string;
                fullName?: Maybe<string>;
                email: string;
              }>;
            };
            petition:
              | { __typename?: "Petition"; id: string; name?: Maybe<string> }
              | { __typename?: "PetitionTemplate"; id: string; name?: Maybe<string> };
          }
        | {
            __typename?: "PetitionCompletedUserNotification";
            id: string;
            createdAt: string;
            isRead: boolean;
            access: {
              __typename?: "PetitionAccess";
              contact?: Maybe<{
                __typename?: "Contact";
                id: string;
                fullName?: Maybe<string>;
                email: string;
              }>;
            };
            petition:
              | { __typename?: "Petition"; id: string; name?: Maybe<string> }
              | { __typename?: "PetitionTemplate"; id: string; name?: Maybe<string> };
          }
        | {
            __typename?: "PetitionSharedUserNotification";
            permissionType: PetitionPermissionTypeRW;
            id: string;
            createdAt: string;
            isRead: boolean;
            petition:
              | { __typename: "Petition"; id: string; name?: Maybe<string> }
              | { __typename: "PetitionTemplate"; id: string; name?: Maybe<string> };
            owner: {
              __typename?: "User";
              id: string;
              fullName?: Maybe<string>;
              status: UserStatus;
            };
            sharedWith:
              | { __typename?: "User"; id: string; fullName?: Maybe<string>; status: UserStatus }
              | { __typename?: "UserGroup"; id: string; name: string };
          }
        | {
            __typename?: "ReminderEmailBouncedUserNotification";
            id: string;
            createdAt: string;
            isRead: boolean;
            access: {
              __typename?: "PetitionAccess";
              contact?: Maybe<{
                __typename?: "Contact";
                id: string;
                fullName?: Maybe<string>;
                email: string;
              }>;
            };
            petition:
              | { __typename?: "Petition"; id: string; name?: Maybe<string> }
              | { __typename?: "PetitionTemplate"; id: string; name?: Maybe<string> };
          }
        | {
            __typename?: "RemindersOptOutNotification";
            reason: string;
            other?: Maybe<string>;
            id: string;
            createdAt: string;
            isRead: boolean;
            access: {
              __typename?: "PetitionAccess";
              contact?: Maybe<{
                __typename?: "Contact";
                id: string;
                fullName?: Maybe<string>;
                email: string;
              }>;
            };
            petition:
              | { __typename?: "Petition"; id: string; name?: Maybe<string> }
              | { __typename?: "PetitionTemplate"; id: string; name?: Maybe<string> };
          }
        | {
            __typename?: "SignatureCancelledUserNotification";
            id: string;
            createdAt: string;
            isRead: boolean;
            petition:
              | { __typename?: "Petition"; id: string; name?: Maybe<string> }
              | { __typename?: "PetitionTemplate"; id: string; name?: Maybe<string> };
          }
        | {
            __typename?: "SignatureCompletedUserNotification";
            id: string;
            createdAt: string;
            isRead: boolean;
            petition:
              | { __typename?: "Petition"; id: string; name?: Maybe<string> }
              | { __typename?: "PetitionTemplate"; id: string; name?: Maybe<string> };
          }
      >;
    };
  };
};

export type NotificationsList_PetitionUserNotification_AccessActivatedFromPublicPetitionLinkUserNotification_Fragment =
  {
    __typename?: "AccessActivatedFromPublicPetitionLinkUserNotification";
    id: string;
    createdAt: string;
    isRead: boolean;
    access: {
      __typename?: "PetitionAccess";
      contact?: Maybe<{
        __typename?: "Contact";
        id: string;
        fullName?: Maybe<string>;
        email: string;
      }>;
    };
    petition:
      | { __typename?: "Petition"; id: string; name?: Maybe<string> }
      | { __typename?: "PetitionTemplate"; id: string; name?: Maybe<string> };
  };

export type NotificationsList_PetitionUserNotification_CommentCreatedUserNotification_Fragment = {
  __typename?: "CommentCreatedUserNotification";
  id: string;
  createdAt: string;
  isRead: boolean;
  field: { __typename?: "PetitionField"; id: string; title?: Maybe<string> };
  comment: {
    __typename?: "PetitionFieldComment";
    id: string;
    isInternal: boolean;
    author?: Maybe<
      | {
          __typename?: "PetitionAccess";
          contact?: Maybe<{
            __typename?: "Contact";
            id: string;
            fullName?: Maybe<string>;
            email: string;
          }>;
        }
      | { __typename?: "User"; id: string; fullName?: Maybe<string>; status: UserStatus }
    >;
  };
  petition:
    | { __typename?: "Petition"; id: string; name?: Maybe<string> }
    | { __typename?: "PetitionTemplate"; id: string; name?: Maybe<string> };
};

export type NotificationsList_PetitionUserNotification_CommentCreatedUserNotification_Fragment = { __typename?: 'CommentCreatedUserNotification', id: string, createdAt: string, isRead: boolean, field: { __typename?: 'PetitionField', id: string, title?: Maybe<string> }, comment: { __typename?: 'PetitionFieldComment', id: string, isInternal: boolean, author?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> }, petition: { __typename?: 'Petition', id: string, name?: Maybe<string> } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string> } };

export type NotificationsList_PetitionUserNotification_MessageEmailBouncedUserNotification_Fragment = { __typename?: 'MessageEmailBouncedUserNotification', id: string, createdAt: string, isRead: boolean, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> }, petition: { __typename?: 'Petition', id: string, name?: Maybe<string> } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string> } };

export type NotificationsList_PetitionUserNotification_PetitionCompletedUserNotification_Fragment = { __typename?: 'PetitionCompletedUserNotification', id: string, createdAt: string, isRead: boolean, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> }, petition: { __typename?: 'Petition', id: string, name?: Maybe<string> } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string> } };

export type NotificationsList_PetitionUserNotification_PetitionSharedUserNotification_Fragment = { __typename?: 'PetitionSharedUserNotification', permissionType: PetitionPermissionTypeRW, id: string, createdAt: string, isRead: boolean, petition: { __typename: 'Petition', id: string, name?: Maybe<string> } | { __typename: 'PetitionTemplate', id: string, name?: Maybe<string> }, owner: { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }, sharedWith: { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus } | { __typename?: 'UserGroup', id: string, name: string } };

export type NotificationsList_PetitionUserNotification_RemindersOptOutNotification_Fragment = {
  __typename?: "RemindersOptOutNotification";
  reason: string;
  other?: Maybe<string>;
  id: string;
  createdAt: string;
  isRead: boolean;
  access: {
    __typename?: "PetitionAccess";
    contact?: Maybe<{
      __typename?: "Contact";
      id: string;
      fullName?: Maybe<string>;
      email: string;
    }>;
  };
  petition:
    | { __typename?: "Petition"; id: string; name?: Maybe<string> }
    | { __typename?: "PetitionTemplate"; id: string; name?: Maybe<string> };
};

export type NotificationsList_PetitionUserNotification_RemindersOptOutNotification_Fragment = { __typename?: 'RemindersOptOutNotification', reason: string, other: string, id: string, createdAt: string, isRead: boolean, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> }, petition: { __typename?: 'Petition', id: string, name?: Maybe<string> } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string> } };

export type NotificationsList_PetitionUserNotification_SignatureCancelledUserNotification_Fragment = { __typename?: 'SignatureCancelledUserNotification', id: string, createdAt: string, isRead: boolean, petition: { __typename?: 'Petition', id: string, name?: Maybe<string> } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string> } };

export type NotificationsList_PetitionUserNotificationFragment =
  | NotificationsList_PetitionUserNotification_AccessActivatedFromPublicPetitionLinkUserNotification_Fragment
  | NotificationsList_PetitionUserNotification_CommentCreatedUserNotification_Fragment
  | NotificationsList_PetitionUserNotification_MessageEmailBouncedUserNotification_Fragment
  | NotificationsList_PetitionUserNotification_PetitionCompletedUserNotification_Fragment
  | NotificationsList_PetitionUserNotification_PetitionSharedUserNotification_Fragment
  | NotificationsList_PetitionUserNotification_ReminderEmailBouncedUserNotification_Fragment
  | NotificationsList_PetitionUserNotification_RemindersOptOutNotification_Fragment
  | NotificationsList_PetitionUserNotification_SignatureCancelledUserNotification_Fragment
  | NotificationsList_PetitionUserNotification_SignatureCompletedUserNotification_Fragment;

export type AccessActivatedFromLinkNotification_AccessActivatedFromPublicPetitionLinkUserNotificationFragment =
  {
    __typename?: "AccessActivatedFromPublicPetitionLinkUserNotification";
    id: string;
    createdAt: string;
    isRead: boolean;
    access: {
      __typename?: "PetitionAccess";
      contact?: Maybe<{
        __typename?: "Contact";
        id: string;
        fullName?: Maybe<string>;
        email: string;
      }>;
    };
    petition:
      | { __typename?: "Petition"; id: string; name?: Maybe<string> }
      | { __typename?: "PetitionTemplate"; id: string; name?: Maybe<string> };
  };

export type CommentCreatedUserNotification_CommentCreatedUserNotificationFragment = {
  __typename?: "CommentCreatedUserNotification";
  id: string;
  createdAt: string;
  isRead: boolean;
  field: { __typename?: "PetitionField"; id: string; title?: Maybe<string> };
  comment: {
    __typename?: "PetitionFieldComment";
    id: string;
    isInternal: boolean;
    author?: Maybe<
      | {
          __typename?: "PetitionAccess";
          contact?: Maybe<{
            __typename?: "Contact";
            id: string;
            fullName?: Maybe<string>;
            email: string;
          }>;
        }
      | { __typename?: "User"; id: string; fullName?: Maybe<string>; status: UserStatus }
    >;
  };
  petition:
    | { __typename?: "Petition"; id: string; name?: Maybe<string> }
    | { __typename?: "PetitionTemplate"; id: string; name?: Maybe<string> };
};

export type CommentCreatedUserNotification_CommentCreatedUserNotificationFragment = { __typename?: 'CommentCreatedUserNotification', id: string, createdAt: string, isRead: boolean, field: { __typename?: 'PetitionField', id: string, title?: Maybe<string> }, comment: { __typename?: 'PetitionFieldComment', id: string, isInternal: boolean, author?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> }, petition: { __typename?: 'Petition', id: string, name?: Maybe<string> } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string> } };

export type MessageEmailBouncedUserNotification_MessageEmailBouncedUserNotificationFragment = { __typename?: 'MessageEmailBouncedUserNotification', id: string, createdAt: string, isRead: boolean, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> }, petition: { __typename?: 'Petition', id: string, name?: Maybe<string> } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string> } };

export type PetitionCompletedUserNotification_PetitionCompletedUserNotificationFragment = { __typename?: 'PetitionCompletedUserNotification', id: string, createdAt: string, isRead: boolean, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> }, petition: { __typename?: 'Petition', id: string, name?: Maybe<string> } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string> } };

export type PetitionUserNotification_PetitionUserNotification_AccessActivatedFromPublicPetitionLinkUserNotification_Fragment =
  {
    __typename?: "AccessActivatedFromPublicPetitionLinkUserNotification";
    id: string;
    createdAt: string;
    isRead: boolean;
    petition:
      | { __typename?: "Petition"; id: string; name?: Maybe<string> }
      | { __typename?: "PetitionTemplate"; id: string; name?: Maybe<string> };
  };

export type PetitionUserNotification_PetitionUserNotification_CommentCreatedUserNotification_Fragment =
  {
    __typename?: "CommentCreatedUserNotification";
    id: string;
    createdAt: string;
    isRead: boolean;
    petition:
      | { __typename?: "Petition"; id: string; name?: Maybe<string> }
      | { __typename?: "PetitionTemplate"; id: string; name?: Maybe<string> };
  };

export type PetitionUserNotification_PetitionUserNotification_CommentCreatedUserNotification_Fragment = { __typename?: 'CommentCreatedUserNotification', id: string, createdAt: string, isRead: boolean, petition: { __typename?: 'Petition', id: string, name?: Maybe<string> } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string> } };

export type PetitionUserNotification_PetitionUserNotification_MessageEmailBouncedUserNotification_Fragment = { __typename?: 'MessageEmailBouncedUserNotification', id: string, createdAt: string, isRead: boolean, petition: { __typename?: 'Petition', id: string, name?: Maybe<string> } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string> } };

export type PetitionUserNotification_PetitionUserNotification_PetitionCompletedUserNotification_Fragment = { __typename?: 'PetitionCompletedUserNotification', id: string, createdAt: string, isRead: boolean, petition: { __typename?: 'Petition', id: string, name?: Maybe<string> } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string> } };

export type PetitionUserNotification_PetitionUserNotification_PetitionSharedUserNotification_Fragment = { __typename?: 'PetitionSharedUserNotification', id: string, createdAt: string, isRead: boolean, petition: { __typename?: 'Petition', id: string, name?: Maybe<string> } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string> } };

export type PetitionUserNotification_PetitionUserNotification_ReminderEmailBouncedUserNotification_Fragment = { __typename?: 'ReminderEmailBouncedUserNotification', id: string, createdAt: string, isRead: boolean, petition: { __typename?: 'Petition', id: string, name?: Maybe<string> } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string> } };

export type PetitionUserNotification_PetitionUserNotification_RemindersOptOutNotification_Fragment = { __typename?: 'RemindersOptOutNotification', id: string, createdAt: string, isRead: boolean, petition: { __typename?: 'Petition', id: string, name?: Maybe<string> } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string> } };

export type PetitionUserNotification_PetitionUserNotification_SignatureCancelledUserNotification_Fragment = { __typename?: 'SignatureCancelledUserNotification', id: string, createdAt: string, isRead: boolean, petition: { __typename?: 'Petition', id: string, name?: Maybe<string> } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string> } };

export type PetitionUserNotification_PetitionUserNotificationFragment =
  | PetitionUserNotification_PetitionUserNotification_AccessActivatedFromPublicPetitionLinkUserNotification_Fragment
  | PetitionUserNotification_PetitionUserNotification_CommentCreatedUserNotification_Fragment
  | PetitionUserNotification_PetitionUserNotification_MessageEmailBouncedUserNotification_Fragment
  | PetitionUserNotification_PetitionUserNotification_PetitionCompletedUserNotification_Fragment
  | PetitionUserNotification_PetitionUserNotification_PetitionSharedUserNotification_Fragment
  | PetitionUserNotification_PetitionUserNotification_ReminderEmailBouncedUserNotification_Fragment
  | PetitionUserNotification_PetitionUserNotification_RemindersOptOutNotification_Fragment
  | PetitionUserNotification_PetitionUserNotification_SignatureCancelledUserNotification_Fragment
  | PetitionUserNotification_PetitionUserNotification_SignatureCompletedUserNotification_Fragment;

export type PetitionUserNotification_PetitionUserNotificationFragment = PetitionUserNotification_PetitionUserNotification_CommentCreatedUserNotification_Fragment | PetitionUserNotification_PetitionUserNotification_MessageEmailBouncedUserNotification_Fragment | PetitionUserNotification_PetitionUserNotification_PetitionCompletedUserNotification_Fragment | PetitionUserNotification_PetitionUserNotification_PetitionSharedUserNotification_Fragment | PetitionUserNotification_PetitionUserNotification_ReminderEmailBouncedUserNotification_Fragment | PetitionUserNotification_PetitionUserNotification_RemindersOptOutNotification_Fragment | PetitionUserNotification_PetitionUserNotification_SignatureCancelledUserNotification_Fragment | PetitionUserNotification_PetitionUserNotification_SignatureCompletedUserNotification_Fragment;

export type RemindersOptOutNotification_RemindersOptOutNotificationFragment = {
  __typename?: "RemindersOptOutNotification";
  reason: string;
  other?: Maybe<string>;
  id: string;
  createdAt: string;
  isRead: boolean;
  access: {
    __typename?: "PetitionAccess";
    contact?: Maybe<{
      __typename?: "Contact";
      id: string;
      fullName?: Maybe<string>;
      email: string;
    }>;
  };
  petition:
    | { __typename?: "Petition"; id: string; name?: Maybe<string> }
    | { __typename?: "PetitionTemplate"; id: string; name?: Maybe<string> };
};

export type RemindersOptOutNotification_RemindersOptOutNotificationFragment = { __typename?: 'RemindersOptOutNotification', reason: string, other: string, id: string, createdAt: string, isRead: boolean, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> }, petition: { __typename?: 'Petition', id: string, name?: Maybe<string> } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string> } };

export type SignatureCancelledUserNotification_SignatureCancelledUserNotificationFragment = { __typename?: 'SignatureCancelledUserNotification', id: string, createdAt: string, isRead: boolean, petition: { __typename?: 'Petition', id: string, name?: Maybe<string> } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string> } };

export type SignatureCompletedUserNotification_SignatureCompletedUserNotificationFragment = { __typename?: 'SignatureCompletedUserNotification', id: string, createdAt: string, isRead: boolean, petition: { __typename?: 'Petition', id: string, name?: Maybe<string> } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string> } };

export type CreateUserDialog_emailIsAvailableQueryVariables = Exact<{
  email: Scalars['String'];
}>;


export type CreateUserDialog_emailIsAvailableQuery = { emailIsAvailable: boolean };

export type OrganizationGroupListTableHeader_UserFragment = { __typename?: 'User', id: string, role: OrganizationRole };

export type OrganizationGroupsListTableHeader_UserFragment = { __typename?: 'User', id: string, role: OrganizationRole };

export type OrganizationUsersListTableHeader_UserFragment = { __typename?: 'User', id: string, role: OrganizationRole };

export type AddPetitionAccessDialog_PetitionFragment = { __typename?: 'Petition', emailSubject?: Maybe<string>, emailBody?: Maybe<any>, signatureConfig?: Maybe<{ __typename?: 'SignatureConfig', contacts: Array<Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }>> }>, remindersConfig?: Maybe<{ __typename?: 'RemindersConfig', offset: number, time: string, timezone: string, weekdaysOnly: boolean }> };

export type AddPetitionAccessDialog_contactsByEmailQueryVariables = Exact<{
  emails: Array<Scalars['String']> | Scalars['String'];
}>;


export type AddPetitionAccessDialog_contactsByEmailQuery = { contactsByEmail: Array<Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }>> };

export type MessageEventsIndicator_PetitionMessageFragment = { __typename?: 'PetitionMessage', bouncedAt?: Maybe<string>, deliveredAt?: Maybe<string>, openedAt?: Maybe<string> };

export type PetitionAccessTable_PetitionFragment = { __typename?: 'Petition', status: PetitionStatus, accesses: Array<{ __typename?: 'PetitionAccess', id: string, status: PetitionAccessStatus, nextReminderAt?: Maybe<string>, remindersLeft: number, reminderCount: number, remindersActive: boolean, remindersOptOut: boolean, createdAt: string, contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }>, remindersConfig?: Maybe<{ __typename?: 'RemindersConfig', offset: number, time: string, timezone: string, weekdaysOnly: boolean }> }> };

export type PetitionAccessTable_PetitionAccessRemindersConfigFragment = { __typename?: 'RemindersConfig', offset: number, time: string, timezone: string, weekdaysOnly: boolean };

export type PetitionActivityTimeline_PetitionFragment = {
  __typename?: "Petition";
  events: {
    __typename?: "PetitionEventPagination";
    items: Array<
      | {
          __typename?: "AccessActivatedEvent";
          id: string;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
          access: {
            __typename?: "PetitionAccess";
            contact?: Maybe<{
              __typename?: "Contact";
              id: string;
              fullName?: Maybe<string>;
              email: string;
            }>;
          };
        }
      | {
          __typename?: "AccessActivatedFromPublicPetitionLinkEvent";
          id: string;
          createdAt: string;
          access: {
            __typename?: "PetitionAccess";
            contact?: Maybe<{
              __typename?: "Contact";
              id: string;
              fullName?: Maybe<string>;
              email: string;
            }>;
          };
        }
      | {
          __typename?: "AccessDeactivatedEvent";
          id: string;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
          access: {
            __typename?: "PetitionAccess";
            contact?: Maybe<{
              __typename?: "Contact";
              id: string;
              fullName?: Maybe<string>;
              email: string;
            }>;
          };
        }
      | {
          __typename?: "AccessDelegatedEvent";
          id: string;
          createdAt: string;
          originalAccess: {
            __typename?: "PetitionAccess";
            contact?: Maybe<{
              __typename?: "Contact";
              id: string;
              fullName?: Maybe<string>;
              email: string;
            }>;
          };
          newAccess: {
            __typename?: "PetitionAccess";
            contact?: Maybe<{
              __typename?: "Contact";
              id: string;
              fullName?: Maybe<string>;
              email: string;
            }>;
          };
        }
      | {
          __typename?: "AccessOpenedEvent";
          id: string;
          createdAt: string;
          access: {
            __typename?: "PetitionAccess";
            contact?: Maybe<{
              __typename?: "Contact";
              id: string;
              fullName?: Maybe<string>;
              email: string;
            }>;
          };
        }
      | {
          __typename?: "CommentDeletedEvent";
          id: string;
          createdAt: string;
          field?: Maybe<{ __typename?: "PetitionField"; title?: Maybe<string> }>;
          deletedBy?: Maybe<
            | {
                __typename?: "PetitionAccess";
                contact?: Maybe<{
                  __typename?: "Contact";
                  id: string;
                  fullName?: Maybe<string>;
                  email: string;
                }>;
              }
            | { __typename?: "User"; id: string; fullName?: Maybe<string>; status: UserStatus }
          >;
        }
      | {
          __typename?: "CommentPublishedEvent";
          id: string;
          createdAt: string;
          field?: Maybe<{ __typename?: "PetitionField"; title?: Maybe<string> }>;
          comment?: Maybe<{
            __typename?: "PetitionFieldComment";
            isEdited: boolean;
            content: string;
            author?: Maybe<
              | {
                  __typename?: "PetitionAccess";
                  contact?: Maybe<{
                    __typename?: "Contact";
                    id: string;
                    fullName?: Maybe<string>;
                    email: string;
                  }>;
                }
              | { __typename?: "User"; id: string; fullName?: Maybe<string>; status: UserStatus }
            >;
          }>;
        }
      | {
          __typename?: "GroupPermissionAddedEvent";
          id: string;
          permissionType: PetitionPermissionType;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
          permissionGroup: { __typename?: "UserGroup"; name: string };
        }
      | {
          __typename?: "GroupPermissionEditedEvent";
          id: string;
          permissionType: PetitionPermissionType;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
          permissionGroup: { __typename?: "UserGroup"; name: string };
        }
      | {
          __typename?: "GroupPermissionRemovedEvent";
          id: string;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
          permissionGroup: { __typename?: "UserGroup"; name: string };
        }
      | {
          __typename?: "MessageCancelledEvent";
          id: string;
          createdAt: string;
          message: {
            __typename?: "PetitionMessage";
            status: PetitionMessageStatus;
            scheduledAt?: Maybe<string>;
            emailSubject?: Maybe<any>;
            access: {
              __typename?: "PetitionAccess";
              contact?: Maybe<{
                __typename?: "Contact";
                id: string;
                fullName?: Maybe<string>;
                email: string;
              }>;
            };
          };
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
        }
      | {
          __typename?: "MessageScheduledEvent";
          id: string;
          createdAt: string;
          message: {
            __typename?: "PetitionMessage";
            id: string;
            status: PetitionMessageStatus;
            scheduledAt?: Maybe<string>;
            emailSubject?: Maybe<any>;
            emailBody?: Maybe<string>;
            sentAt?: Maybe<string>;
            sender: {
              __typename?: "User";
              id: string;
              fullName?: Maybe<string>;
              status: UserStatus;
            };
            access: {
              __typename?: "PetitionAccess";
              contact?: Maybe<{
                __typename?: "Contact";
                id: string;
                fullName?: Maybe<string>;
                email: string;
              }>;
            };
          };
        }
      | {
          __typename?: "MessageSentEvent";
          id: string;
          createdAt: string;
          message: {
            __typename?: "PetitionMessage";
            emailSubject?: Maybe<any>;
            scheduledAt?: Maybe<string>;
            bouncedAt?: Maybe<string>;
            deliveredAt?: Maybe<string>;
            openedAt?: Maybe<string>;
            emailBody?: Maybe<string>;
            sentAt?: Maybe<string>;
            sender: {
              __typename?: "User";
              id: string;
              fullName?: Maybe<string>;
              status: UserStatus;
            };
            access: {
              __typename?: "PetitionAccess";
              contact?: Maybe<{
                __typename?: "Contact";
                id: string;
                fullName?: Maybe<string>;
                email: string;
              }>;
            };
          };
        }
      | {
          __typename?: "OwnershipTransferredEvent";
          id: string;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
          owner?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
          previousOwner?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
        }
      | {
          __typename?: "PetitionClonedEvent";
          id: string;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
        }
      | {
          __typename?: "PetitionClosedEvent";
          id: string;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
        }
      | {
          __typename?: "PetitionClosedNotifiedEvent";
          id: string;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
          access: {
            __typename?: "PetitionAccess";
            contact?: Maybe<{
              __typename?: "Contact";
              id: string;
              fullName?: Maybe<string>;
              email: string;
            }>;
          };
        }
      | {
          __typename?: "PetitionCompletedEvent";
          id: string;
          createdAt: string;
          access: {
            __typename?: "PetitionAccess";
            contact?: Maybe<{
              __typename?: "Contact";
              id: string;
              fullName?: Maybe<string>;
              email: string;
            }>;
          };
        }
      | {
          __typename?: "PetitionCreatedEvent";
          id: string;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
        }
      | { __typename?: "PetitionDeletedEvent"; id: string }
      | {
          __typename?: "PetitionReopenedEvent";
          id: string;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
        }
      | {
          __typename?: "ReminderSentEvent";
          id: string;
          createdAt: string;
          reminder: {
            __typename?: "PetitionReminder";
            type: PetitionReminderType;
            createdAt: string;
            emailBody?: Maybe<string>;
            sender?: Maybe<{
              __typename?: "User";
              id: string;
              fullName?: Maybe<string>;
              status: UserStatus;
            }>;
            access: {
              __typename?: "PetitionAccess";
              contact?: Maybe<{
                __typename?: "Contact";
                id: string;
                fullName?: Maybe<string>;
                email: string;
              }>;
            };
          };
        }
      | {
          __typename?: "RemindersOptOutEvent";
          id: string;
          createdAt: string;
          reason: string;
          other?: Maybe<string>;
          access: {
            __typename?: "PetitionAccess";
            contact?: Maybe<{
              __typename?: "Contact";
              id: string;
              fullName?: Maybe<string>;
              email: string;
            }>;
          };
        }
      | {
          __typename?: "ReplyCreatedEvent";
          id: string;
          createdAt: string;
          field?: Maybe<{ __typename?: "PetitionField"; title?: Maybe<string> }>;
          createdBy?: Maybe<
            | {
                __typename?: "PetitionAccess";
                contact?: Maybe<{
                  __typename?: "Contact";
                  id: string;
                  fullName?: Maybe<string>;
                  email: string;
                }>;
              }
            | { __typename?: "User"; id: string; fullName?: Maybe<string>; status: UserStatus }
          >;
        }
      | {
          __typename?: "ReplyDeletedEvent";
          id: string;
          createdAt: string;
          field?: Maybe<{ __typename?: "PetitionField"; title?: Maybe<string> }>;
          deletedBy?: Maybe<
            | {
                __typename?: "PetitionAccess";
                contact?: Maybe<{
                  __typename?: "Contact";
                  id: string;
                  fullName?: Maybe<string>;
                  email: string;
                }>;
              }
            | { __typename?: "User"; id: string; fullName?: Maybe<string>; status: UserStatus }
          >;
        }
      | {
          __typename?: "ReplyUpdatedEvent";
          id: string;
          createdAt: string;
          field?: Maybe<{ __typename?: "PetitionField"; title?: Maybe<string> }>;
          updatedBy?: Maybe<
            | {
                __typename?: "PetitionAccess";
                contact?: Maybe<{
                  __typename?: "Contact";
                  id: string;
                  fullName?: Maybe<string>;
                  email: string;
                }>;
              }
            | { __typename?: "User"; id: string; fullName?: Maybe<string>; status: UserStatus }
          >;
        }
      | {
          __typename?: "SignatureCancelledEvent";
          id: string;
          cancelType: PetitionSignatureCancelReason;
          cancellerReason?: Maybe<string>;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
          contact?: Maybe<{
            __typename?: "Contact";
            id: string;
            fullName?: Maybe<string>;
            email: string;
          }>;
        }
      | { __typename?: "SignatureCompletedEvent"; id: string; createdAt: string }
      | { __typename?: "SignatureStartedEvent"; id: string; createdAt: string }
      | { __typename?: "TemplateUsedEvent"; id: string }
      | {
          __typename?: "UserPermissionAddedEvent";
          id: string;
          permissionType: PetitionPermissionType;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
          permissionUser?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
        }
      | {
          __typename?: "UserPermissionEditedEvent";
          id: string;
          permissionType: PetitionPermissionType;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
          permissionUser?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
        }
      | {
          __typename?: "UserPermissionRemovedEvent";
          id: string;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
          permissionUser?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
        }
    >;
  };
};

export type PetitionActivityTimeline_PetitionFragment = { __typename?: 'Petition', events: { __typename?: 'PetitionEventPagination', items: Array<{ __typename?: 'AccessActivatedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } | { __typename?: 'AccessDeactivatedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } | { __typename?: 'AccessDelegatedEvent', id: string, createdAt: string, originalAccess: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> }, newAccess: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } | { __typename?: 'AccessOpenedEvent', id: string, createdAt: string, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } | { __typename?: 'CommentDeletedEvent', id: string, createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, deletedBy?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'CommentPublishedEvent', id: string, createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, comment?: Maybe<{ __typename?: 'PetitionFieldComment', isEdited: boolean, content: string, author?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> }> } | { __typename?: 'GroupPermissionAddedEvent', id: string, permissionType: PetitionPermissionType, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionGroup: { __typename?: 'UserGroup', name: string } } | { __typename?: 'GroupPermissionEditedEvent', id: string, permissionType: PetitionPermissionType, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionGroup: { __typename?: 'UserGroup', name: string } } | { __typename?: 'GroupPermissionRemovedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionGroup: { __typename?: 'UserGroup', name: string } } | { __typename?: 'MessageCancelledEvent', id: string, createdAt: string, message: { __typename?: 'PetitionMessage', status: PetitionMessageStatus, scheduledAt?: Maybe<string>, emailSubject?: Maybe<any>, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } }, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'MessageScheduledEvent', id: string, createdAt: string, message: { __typename?: 'PetitionMessage', id: string, status: PetitionMessageStatus, scheduledAt?: Maybe<string>, emailSubject?: Maybe<any>, emailBody?: Maybe<string>, sentAt?: Maybe<string>, sender: { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } } | { __typename?: 'MessageSentEvent', id: string, createdAt: string, message: { __typename?: 'PetitionMessage', emailSubject?: Maybe<any>, scheduledAt?: Maybe<string>, bouncedAt?: Maybe<string>, deliveredAt?: Maybe<string>, openedAt?: Maybe<string>, emailBody?: Maybe<string>, sentAt?: Maybe<string>, sender: { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } } | { __typename?: 'OwnershipTransferredEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, owner?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, previousOwner?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'PetitionClonedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'PetitionClosedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'PetitionClosedNotifiedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } | { __typename?: 'PetitionCompletedEvent', id: string, createdAt: string, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } | { __typename?: 'PetitionCreatedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'PetitionDeletedEvent', id: string } | { __typename?: 'PetitionReopenedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'ReminderSentEvent', id: string, createdAt: string, reminder: { __typename?: 'PetitionReminder', type: PetitionReminderType, createdAt: string, emailBody?: Maybe<string>, sender?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } } | { __typename?: 'RemindersOptOutEvent', id: string, createdAt: string, reason: string, other: string, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } | { __typename?: 'ReplyCreatedEvent', id: string, createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, createdBy?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'ReplyDeletedEvent', id: string, createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, deletedBy?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'ReplyUpdatedEvent', id: string, createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, updatedBy?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'SignatureCancelledEvent', id: string, cancelType: PetitionSignatureCancelReason, cancellerReason?: Maybe<string>, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'SignatureCompletedEvent', id: string, createdAt: string } | { __typename?: 'SignatureStartedEvent', id: string, createdAt: string } | { __typename?: 'TemplateUsedEvent', id: string } | { __typename?: 'UserPermissionAddedEvent', id: string, permissionType: PetitionPermissionType, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionUser?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'UserPermissionEditedEvent', id: string, permissionType: PetitionPermissionType, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionUser?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'UserPermissionRemovedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionUser?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> }> } };

export type PetitionActivityTimeline_PetitionEvent_AccessActivatedFromPublicPetitionLinkEvent_Fragment =
  {
    __typename?: "AccessActivatedFromPublicPetitionLinkEvent";
    id: string;
    createdAt: string;
    access: {
      __typename?: "PetitionAccess";
      contact?: Maybe<{
        __typename?: "Contact";
        id: string;
        fullName?: Maybe<string>;
        email: string;
      }>;
    };
  };

export type PetitionActivityTimeline_PetitionEvent_AccessDeactivatedEvent_Fragment = {
  __typename?: "AccessDeactivatedEvent";
  id: string;
  createdAt: string;
  user?: Maybe<{ __typename?: "User"; id: string; fullName?: Maybe<string>; status: UserStatus }>;
  access: {
    __typename?: "PetitionAccess";
    contact?: Maybe<{
      __typename?: "Contact";
      id: string;
      fullName?: Maybe<string>;
      email: string;
    }>;
  };
};

export type PetitionActivityTimeline_PetitionEvent_AccessDeactivatedEvent_Fragment = { __typename?: 'AccessDeactivatedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } };

export type PetitionActivityTimeline_PetitionEvent_AccessDelegatedEvent_Fragment = { __typename?: 'AccessDelegatedEvent', id: string, createdAt: string, originalAccess: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> }, newAccess: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } };

export type PetitionActivityTimeline_PetitionEvent_AccessOpenedEvent_Fragment = { __typename?: 'AccessOpenedEvent', id: string, createdAt: string, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } };

export type PetitionActivityTimeline_PetitionEvent_CommentDeletedEvent_Fragment = { __typename?: 'CommentDeletedEvent', id: string, createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, deletedBy?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> };

export type PetitionActivityTimeline_PetitionEvent_CommentPublishedEvent_Fragment = { __typename?: 'CommentPublishedEvent', id: string, createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, comment?: Maybe<{ __typename?: 'PetitionFieldComment', isEdited: boolean, content: string, author?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> }> };

export type PetitionActivityTimeline_PetitionEvent_GroupPermissionAddedEvent_Fragment = { __typename?: 'GroupPermissionAddedEvent', id: string, permissionType: PetitionPermissionType, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionGroup: { __typename?: 'UserGroup', name: string } };

export type PetitionActivityTimeline_PetitionEvent_GroupPermissionEditedEvent_Fragment = { __typename?: 'GroupPermissionEditedEvent', id: string, permissionType: PetitionPermissionType, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionGroup: { __typename?: 'UserGroup', name: string } };

export type PetitionActivityTimeline_PetitionEvent_GroupPermissionRemovedEvent_Fragment = { __typename?: 'GroupPermissionRemovedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionGroup: { __typename?: 'UserGroup', name: string } };

export type PetitionActivityTimeline_PetitionEvent_MessageCancelledEvent_Fragment = { __typename?: 'MessageCancelledEvent', id: string, createdAt: string, message: { __typename?: 'PetitionMessage', status: PetitionMessageStatus, scheduledAt?: Maybe<string>, emailSubject?: Maybe<any>, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } }, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> };

export type PetitionActivityTimeline_PetitionEvent_MessageScheduledEvent_Fragment = { __typename?: 'MessageScheduledEvent', id: string, createdAt: string, message: { __typename?: 'PetitionMessage', id: string, status: PetitionMessageStatus, scheduledAt?: Maybe<string>, emailSubject?: Maybe<any>, emailBody?: Maybe<string>, sentAt?: Maybe<string>, sender: { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } };

export type PetitionActivityTimeline_PetitionEvent_MessageSentEvent_Fragment = { __typename?: 'MessageSentEvent', id: string, createdAt: string, message: { __typename?: 'PetitionMessage', emailSubject?: Maybe<any>, scheduledAt?: Maybe<string>, bouncedAt?: Maybe<string>, deliveredAt?: Maybe<string>, openedAt?: Maybe<string>, emailBody?: Maybe<string>, sentAt?: Maybe<string>, sender: { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } };

export type PetitionActivityTimeline_PetitionEvent_OwnershipTransferredEvent_Fragment = { __typename?: 'OwnershipTransferredEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, owner?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, previousOwner?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> };

export type PetitionActivityTimeline_PetitionEvent_PetitionClonedEvent_Fragment = { __typename?: 'PetitionClonedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> };

export type PetitionActivityTimeline_PetitionEvent_PetitionClosedEvent_Fragment = { __typename?: 'PetitionClosedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> };

export type PetitionActivityTimeline_PetitionEvent_PetitionClosedNotifiedEvent_Fragment = { __typename?: 'PetitionClosedNotifiedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } };

export type PetitionActivityTimeline_PetitionEvent_PetitionCompletedEvent_Fragment = { __typename?: 'PetitionCompletedEvent', id: string, createdAt: string, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } };

export type PetitionActivityTimeline_PetitionEvent_PetitionCreatedEvent_Fragment = { __typename?: 'PetitionCreatedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> };

export type PetitionActivityTimeline_PetitionEvent_PetitionDeletedEvent_Fragment = { __typename?: 'PetitionDeletedEvent', id: string };

export type PetitionActivityTimeline_PetitionEvent_PetitionReopenedEvent_Fragment = { __typename?: 'PetitionReopenedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> };

export type PetitionActivityTimeline_PetitionEvent_RemindersOptOutEvent_Fragment = {
  __typename?: "RemindersOptOutEvent";
  id: string;
  createdAt: string;
  reason: string;
  other?: Maybe<string>;
  access: {
    __typename?: "PetitionAccess";
    contact?: Maybe<{
      __typename?: "Contact";
      id: string;
      fullName?: Maybe<string>;
      email: string;
    }>;
  };
};

export type PetitionActivityTimeline_PetitionEvent_RemindersOptOutEvent_Fragment = { __typename?: 'RemindersOptOutEvent', id: string, createdAt: string, reason: string, other: string, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } };

export type PetitionActivityTimeline_PetitionEvent_ReplyCreatedEvent_Fragment = { __typename?: 'ReplyCreatedEvent', id: string, createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, createdBy?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> };

export type PetitionActivityTimeline_PetitionEvent_ReplyDeletedEvent_Fragment = { __typename?: 'ReplyDeletedEvent', id: string, createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, deletedBy?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> };

export type PetitionActivityTimeline_PetitionEvent_ReplyUpdatedEvent_Fragment = { __typename?: 'ReplyUpdatedEvent', id: string, createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, updatedBy?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> };

export type PetitionActivityTimeline_PetitionEvent_SignatureCancelledEvent_Fragment = { __typename?: 'SignatureCancelledEvent', id: string, cancelType: PetitionSignatureCancelReason, cancellerReason?: Maybe<string>, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> };

export type PetitionActivityTimeline_PetitionEvent_SignatureCompletedEvent_Fragment = { __typename?: 'SignatureCompletedEvent', id: string, createdAt: string };

export type PetitionActivityTimeline_PetitionEvent_SignatureStartedEvent_Fragment = { __typename?: 'SignatureStartedEvent', id: string, createdAt: string };

export type PetitionActivityTimeline_PetitionEvent_TemplateUsedEvent_Fragment = { __typename?: 'TemplateUsedEvent', id: string };

export type PetitionActivityTimeline_PetitionEvent_UserPermissionAddedEvent_Fragment = { __typename?: 'UserPermissionAddedEvent', id: string, permissionType: PetitionPermissionType, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionUser?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> };

export type PetitionActivityTimeline_PetitionEvent_UserPermissionEditedEvent_Fragment = { __typename?: 'UserPermissionEditedEvent', id: string, permissionType: PetitionPermissionType, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionUser?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> };

export type PetitionActivityTimeline_PetitionEventFragment =
  | PetitionActivityTimeline_PetitionEvent_AccessActivatedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_AccessActivatedFromPublicPetitionLinkEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_AccessDeactivatedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_AccessDelegatedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_AccessOpenedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_CommentDeletedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_CommentPublishedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_GroupPermissionAddedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_GroupPermissionEditedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_GroupPermissionRemovedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_MessageCancelledEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_MessageScheduledEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_MessageSentEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_OwnershipTransferredEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_PetitionClonedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_PetitionClosedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_PetitionClosedNotifiedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_PetitionCompletedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_PetitionCreatedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_PetitionDeletedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_PetitionReopenedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_ReminderSentEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_RemindersOptOutEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_ReplyCreatedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_ReplyDeletedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_ReplyUpdatedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_SignatureCancelledEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_SignatureCompletedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_SignatureStartedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_TemplateUsedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_UserPermissionAddedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_UserPermissionEditedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_UserPermissionRemovedEvent_Fragment;

export type PetitionActivityTimeline_PetitionEventFragment = PetitionActivityTimeline_PetitionEvent_AccessActivatedEvent_Fragment | PetitionActivityTimeline_PetitionEvent_AccessDeactivatedEvent_Fragment | PetitionActivityTimeline_PetitionEvent_AccessDelegatedEvent_Fragment | PetitionActivityTimeline_PetitionEvent_AccessOpenedEvent_Fragment | PetitionActivityTimeline_PetitionEvent_CommentDeletedEvent_Fragment | PetitionActivityTimeline_PetitionEvent_CommentPublishedEvent_Fragment | PetitionActivityTimeline_PetitionEvent_GroupPermissionAddedEvent_Fragment | PetitionActivityTimeline_PetitionEvent_GroupPermissionEditedEvent_Fragment | PetitionActivityTimeline_PetitionEvent_GroupPermissionRemovedEvent_Fragment | PetitionActivityTimeline_PetitionEvent_MessageCancelledEvent_Fragment | PetitionActivityTimeline_PetitionEvent_MessageScheduledEvent_Fragment | PetitionActivityTimeline_PetitionEvent_MessageSentEvent_Fragment | PetitionActivityTimeline_PetitionEvent_OwnershipTransferredEvent_Fragment | PetitionActivityTimeline_PetitionEvent_PetitionClonedEvent_Fragment | PetitionActivityTimeline_PetitionEvent_PetitionClosedEvent_Fragment | PetitionActivityTimeline_PetitionEvent_PetitionClosedNotifiedEvent_Fragment | PetitionActivityTimeline_PetitionEvent_PetitionCompletedEvent_Fragment | PetitionActivityTimeline_PetitionEvent_PetitionCreatedEvent_Fragment | PetitionActivityTimeline_PetitionEvent_PetitionDeletedEvent_Fragment | PetitionActivityTimeline_PetitionEvent_PetitionReopenedEvent_Fragment | PetitionActivityTimeline_PetitionEvent_ReminderSentEvent_Fragment | PetitionActivityTimeline_PetitionEvent_RemindersOptOutEvent_Fragment | PetitionActivityTimeline_PetitionEvent_ReplyCreatedEvent_Fragment | PetitionActivityTimeline_PetitionEvent_ReplyDeletedEvent_Fragment | PetitionActivityTimeline_PetitionEvent_ReplyUpdatedEvent_Fragment | PetitionActivityTimeline_PetitionEvent_SignatureCancelledEvent_Fragment | PetitionActivityTimeline_PetitionEvent_SignatureCompletedEvent_Fragment | PetitionActivityTimeline_PetitionEvent_SignatureStartedEvent_Fragment | PetitionActivityTimeline_PetitionEvent_TemplateUsedEvent_Fragment | PetitionActivityTimeline_PetitionEvent_UserPermissionAddedEvent_Fragment | PetitionActivityTimeline_PetitionEvent_UserPermissionEditedEvent_Fragment | PetitionActivityTimeline_PetitionEvent_UserPermissionRemovedEvent_Fragment;

export type PetitionFieldReference_PetitionFieldFragment = { __typename?: 'PetitionField', title?: Maybe<string> };

export type SentPetitionMessageDialog_PetitionMessageFragment = { __typename?: 'PetitionMessage', emailBody?: Maybe<string>, emailSubject?: Maybe<any>, sentAt?: Maybe<string>, scheduledAt?: Maybe<string>, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } };

export type SentReminderMessageDialog_PetitionReminderFragment = { __typename?: 'PetitionReminder', createdAt: string, emailBody?: Maybe<string>, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } };

export type UserReference_UserFragment = { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus };

export type TimelineAccessActivatedFromLinkEvent_AccessActivatedFromPublicPetitionLinkEventFragment =
  {
    __typename?: "AccessActivatedFromPublicPetitionLinkEvent";
    createdAt: string;
    access: {
      __typename?: "PetitionAccess";
      contact?: Maybe<{
        __typename?: "Contact";
        id: string;
        fullName?: Maybe<string>;
        email: string;
      }>;
    };
  };

export type TimelineAccessDeactivatedEvent_AccessDeactivatedEventFragment = {
  __typename?: "AccessDeactivatedEvent";
  createdAt: string;
  user?: Maybe<{ __typename?: "User"; id: string; fullName?: Maybe<string>; status: UserStatus }>;
  access: {
    __typename?: "PetitionAccess";
    contact?: Maybe<{
      __typename?: "Contact";
      id: string;
      fullName?: Maybe<string>;
      email: string;
    }>;
  };
};

export type TimelineAccessDeactivatedEvent_AccessDeactivatedEventFragment = { __typename?: 'AccessDeactivatedEvent', createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } };

export type TimelineAccessDelegatedEvent_AccessDelegatedEventFragment = { __typename?: 'AccessDelegatedEvent', createdAt: string, originalAccess: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> }, newAccess: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } };

export type TimelineAccessOpenedEvent_AccessOpenedEventFragment = { __typename?: 'AccessOpenedEvent', createdAt: string, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } };

export type TimelineCommentDeletedEvent_CommentDeletedEventFragment = { __typename?: 'CommentDeletedEvent', createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, deletedBy?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> };

export type TimelineCommentPublishedEvent_CommentPublishedEventFragment = { __typename?: 'CommentPublishedEvent', createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, comment?: Maybe<{ __typename?: 'PetitionFieldComment', isEdited: boolean, content: string, author?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> }> };

export type TimelineGroupPermissionAddedEvent_GroupPermissionAddedEventFragment = { __typename?: 'GroupPermissionAddedEvent', permissionType: PetitionPermissionType, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionGroup: { __typename?: 'UserGroup', name: string } };

export type TimelineGroupPermissionEditedEvent_GroupPermissionEditedEventFragment = { __typename?: 'GroupPermissionEditedEvent', permissionType: PetitionPermissionType, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionGroup: { __typename?: 'UserGroup', name: string } };

export type TimelineGroupPermissionRemovedEvent_GroupPermissionRemovedEventFragment = { __typename?: 'GroupPermissionRemovedEvent', createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionGroup: { __typename?: 'UserGroup', name: string } };

export type TimelineMessageCancelledEvent_MessageCancelledEventFragment = { __typename?: 'MessageCancelledEvent', createdAt: string, message: { __typename?: 'PetitionMessage', status: PetitionMessageStatus, scheduledAt?: Maybe<string>, emailSubject?: Maybe<any>, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } }, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> };

export type TimelineMessageScheduledEvent_MessageScheduledEventFragment = { __typename?: 'MessageScheduledEvent', createdAt: string, message: { __typename?: 'PetitionMessage', status: PetitionMessageStatus, scheduledAt?: Maybe<string>, emailSubject?: Maybe<any>, emailBody?: Maybe<string>, sentAt?: Maybe<string>, sender: { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } };

export type TimelineMessageSentEvent_MessageSentEventFragment = { __typename?: 'MessageSentEvent', createdAt: string, message: { __typename?: 'PetitionMessage', emailSubject?: Maybe<any>, scheduledAt?: Maybe<string>, bouncedAt?: Maybe<string>, deliveredAt?: Maybe<string>, openedAt?: Maybe<string>, emailBody?: Maybe<string>, sentAt?: Maybe<string>, sender: { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } };

export type TimelineOwnershipTransferredEvent_OwnershipTransferredEventFragment = { __typename?: 'OwnershipTransferredEvent', createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, owner?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, previousOwner?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> };

export type TimelinePetitionClonedEvent_PetitionClonedEventFragment = { __typename?: 'PetitionClonedEvent', createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> };

export type TimelinePetitionClosedEvent_PetitionClosedEventFragment = { __typename?: 'PetitionClosedEvent', createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> };

export type TimelinePetitionClosedNotifiedEvent_PetitionClosedNotifiedEventFragment = { __typename?: 'PetitionClosedNotifiedEvent', createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } };

export type TimelinePetitionCompletedEvent_PetitionCompletedEventFragment = { __typename?: 'PetitionCompletedEvent', createdAt: string, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } };

export type TimelinePetitionCreatedEvent_PetitionCreatedEventFragment = { __typename?: 'PetitionCreatedEvent', createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> };

export type TimelinePetitionReopenedEvent_PetitionReopenedEventFragment = { __typename?: 'PetitionReopenedEvent', createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> };

export type TimelineRemindersOptOutEvent_RemindersOptOutEventFragment = {
  __typename?: "RemindersOptOutEvent";
  createdAt: string;
  reason: string;
  other?: Maybe<string>;
  access: {
    __typename?: "PetitionAccess";
    contact?: Maybe<{
      __typename?: "Contact";
      id: string;
      fullName?: Maybe<string>;
      email: string;
    }>;
  };
};

export type TimelineRemindersOptOutEvent_RemindersOptOutEventFragment = { __typename?: 'RemindersOptOutEvent', createdAt: string, reason: string, other: string, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } };

export type TimelineReplyCreatedEvent_ReplyCreatedEventFragment = { __typename?: 'ReplyCreatedEvent', createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, createdBy?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> };

export type TimelineReplyDeletedEvent_ReplyDeletedEventFragment = { __typename?: 'ReplyDeletedEvent', createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, deletedBy?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> };

export type TimelineReplyUpdatedEvent_ReplyUpdatedEventFragment = { __typename?: 'ReplyUpdatedEvent', createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, updatedBy?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> };

export type TimelineSignatureCancelledEvent_SignatureCancelledEventFragment = { __typename?: 'SignatureCancelledEvent', cancelType: PetitionSignatureCancelReason, cancellerReason?: Maybe<string>, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> };

export type TimelineSignatureCompletedEvent_SignatureCompletedEventFragment = { __typename?: 'SignatureCompletedEvent', createdAt: string };

export type TimelineSignatureStartedEvent_SignatureStartedEventFragment = { __typename?: 'SignatureStartedEvent', createdAt: string };

export type TimelineUserPermissionAddedEvent_UserPermissionAddedEventFragment = { __typename?: 'UserPermissionAddedEvent', permissionType: PetitionPermissionType, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionUser?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> };

export type TimelineUserPermissionEditedEvent_UserPermissionEditedEventFragment = { __typename?: 'UserPermissionEditedEvent', permissionType: PetitionPermissionType, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionUser?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> };

export type TimelineUserPermissionRemovedEvent_UserPermissionRemovedEventFragment = { __typename?: 'UserPermissionRemovedEvent', createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionUser?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> };

export type PetitionContents_PetitionFieldFragment = { __typename?: 'PetitionField', id: string, title?: Maybe<string>, type: PetitionFieldType, options: { [key: string]: any }, isReadOnly: boolean, validated: boolean, comments: Array<{ __typename?: 'PetitionFieldComment', id: string }>, replies: Array<{ __typename?: 'PetitionFieldReply', id: string }> };

export type PetitionSettings_PetitionBase_Petition_Fragment = {
  __typename?: "Petition";
  status: PetitionStatus;
  deadline?: Maybe<string>;
  id: string;
  locale: PetitionLocale;
  hasCommentsEnabled: boolean;
  skipForwardSecurity: boolean;
  isRecipientViewContentsHidden: boolean;
  isReadOnly: boolean;
  name?: Maybe<string>;
  currentSignatureRequest?: Maybe<{
    __typename?: "PetitionSignatureRequest";
    id: string;
    status: PetitionSignatureRequestStatus;
  }>;
  owner: { __typename?: "User"; id: string };
  signatureConfig?: Maybe<{
    __typename?: "SignatureConfig";
    provider: string;
    title: string;
    review: boolean;
    contacts: Array<
      Maybe<{ __typename?: "Contact"; id: string; fullName?: Maybe<string>; email: string }>
    >;
  }>;
};

export type PetitionSettings_PetitionBase_PetitionTemplate_Fragment = {
  __typename?: "PetitionTemplate";
  isPublic: boolean;
  id: string;
  locale: PetitionLocale;
  hasCommentsEnabled: boolean;
  skipForwardSecurity: boolean;
  isRecipientViewContentsHidden: boolean;
  isReadOnly: boolean;
  publicLink?: Maybe<{
    __typename?: "PublicPetitionLink";
    id: string;
    title: string;
    isActive: boolean;
    description: string;
    slug: string;
    linkPermissions: Array<
      | {
          __typename?: "PublicPetitionLinkUserGroupPermission";
          permissionType: PetitionPermissionType;
          group: { __typename?: "UserGroup"; id: string };
        }
      | {
          __typename?: "PublicPetitionLinkUserPermission";
          permissionType: PetitionPermissionType;
          user: { __typename?: "User"; id: string };
        }
    >;
  }>;
  owner: { __typename?: "User"; id: string };
};

export type PetitionSettings_PetitionBase_PetitionTemplate_Fragment = { __typename?: 'PetitionTemplate', isPublic: boolean, id: string, locale: PetitionLocale, hasCommentsEnabled: boolean, skipForwardSecurity: boolean, isRecipientViewContentsHidden: boolean, isReadOnly: boolean };

export type PetitionSettings_PetitionBaseFragment = PetitionSettings_PetitionBase_Petition_Fragment | PetitionSettings_PetitionBase_PetitionTemplate_Fragment;

export type PetitionSettings_cancelPetitionSignatureRequestMutationVariables = Exact<{
  petitionSignatureRequestId: Scalars['GID'];
}>;


export type PetitionSettings_cancelPetitionSignatureRequestMutation = { cancelSignatureRequest: { __typename?: 'PetitionSignatureRequest', id: string, status: PetitionSignatureRequestStatus } };

export type PetitionSettings_startPetitionSignatureRequestMutationVariables = Exact<{
  petitionId: Scalars['GID'];
}>;


export type PetitionSettings_createPublicPetitionLinkMutationVariables = Exact<{
  templateId: Scalars["GID"];
  title: Scalars["String"];
  description: Scalars["String"];
  ownerId: Scalars["GID"];
  otherPermissions?: Maybe<
    Array<UserOrUserGroupPublicLinkPermission> | UserOrUserGroupPublicLinkPermission
  >;
}>;

export type PetitionSettings_createPublicPetitionLinkMutation = {
  createPublicPetitionLink: {
    __typename?: "PetitionTemplate";
    id: string;
    publicLink?: Maybe<{
      __typename?: "PublicPetitionLink";
      id: string;
      title: string;
      description: string;
      slug: string;
      linkPermissions: Array<
        | {
            __typename?: "PublicPetitionLinkUserGroupPermission";
            permissionType: PetitionPermissionType;
          }
        | {
            __typename?: "PublicPetitionLinkUserPermission";
            permissionType: PetitionPermissionType;
          }
      >;
    }>;
  };
};

export type PetitionSettings_updatePublicPetitionLinkMutationVariables = Exact<{
  publicPetitionLinkId: Scalars["GID"];
  isActive?: Maybe<Scalars["Boolean"]>;
  title?: Maybe<Scalars["String"]>;
  description?: Maybe<Scalars["String"]>;
  ownerId?: Maybe<Scalars["GID"]>;
  otherPermissions?: Maybe<
    Array<UserOrUserGroupPublicLinkPermission> | UserOrUserGroupPublicLinkPermission
  >;
}>;

export type PetitionSettings_updatePublicPetitionLinkMutation = {
  updatePublicPetitionLink: {
    __typename?: "PublicPetitionLink";
    id: string;
    title: string;
    description: string;
    slug: string;
    isActive: boolean;
    linkPermissions: Array<
      | {
          __typename?: "PublicPetitionLinkUserGroupPermission";
          permissionType: PetitionPermissionType;
        }
      | { __typename?: "PublicPetitionLinkUserPermission"; permissionType: PetitionPermissionType }
    >;
  };
};

export type PetitionSharingModal_Petition_Petition_Fragment = {
  __typename?: "Petition";
  id: string;
  name?: Maybe<string>;
  permissions: Array<
    | {
        __typename?: "PetitionUserGroupPermission";
        permissionType: PetitionPermissionType;
        group: {
          __typename?: "UserGroup";
          id: string;
          name: string;
          members: Array<{
            __typename?: "UserGroupMember";
            user: { __typename?: "User"; id: string; email: string; fullName?: Maybe<string> };
          }>;
        };
      }
    | {
        __typename?: "PetitionUserPermission";
        permissionType: PetitionPermissionType;
        user: { __typename?: "User"; id: string; email: string; fullName?: Maybe<string> };
      }
  >;
};

export type PetitionSharingModal_Petition_Petition_Fragment = { __typename?: 'Petition', id: string, name?: Maybe<string>, permissions: Array<{ __typename?: 'PetitionUserGroupPermission', permissionType: PetitionPermissionType, group: { __typename?: 'UserGroup', id: string, name: string, members: Array<{ __typename?: 'UserGroupMember', user: { __typename?: 'User', id: string, email: string, fullName?: Maybe<string> } }> } } | { __typename?: 'PetitionUserPermission', permissionType: PetitionPermissionType, user: { __typename?: 'User', id: string, email: string, fullName?: Maybe<string> } }> };

export type PetitionSharingModal_Petition_PetitionTemplate_Fragment = { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string>, permissions: Array<{ __typename?: 'PetitionUserGroupPermission', permissionType: PetitionPermissionType, group: { __typename?: 'UserGroup', id: string, name: string, members: Array<{ __typename?: 'UserGroupMember', user: { __typename?: 'User', id: string, email: string, fullName?: Maybe<string> } }> } } | { __typename?: 'PetitionUserPermission', permissionType: PetitionPermissionType, user: { __typename?: 'User', id: string, email: string, fullName?: Maybe<string> } }> };

export type PetitionSharingModal_PetitionFragment = PetitionSharingModal_Petition_Petition_Fragment | PetitionSharingModal_Petition_PetitionTemplate_Fragment;

export type PetitionSharingModal_PetitionUserPermissionFragment = { __typename?: 'PetitionUserPermission', permissionType: PetitionPermissionType, user: { __typename?: 'User', id: string, email: string, fullName?: Maybe<string> } };

export type PetitionSharingModal_PetitionUserGroupPermissionFragment = { __typename?: 'PetitionUserGroupPermission', permissionType: PetitionPermissionType, group: { __typename?: 'UserGroup', id: string, name: string, members: Array<{ __typename?: 'UserGroupMember', user: { __typename?: 'User', id: string, email: string, fullName?: Maybe<string> } }> } };

export type PetitionSharingModal_UserFragment = { __typename?: 'User', id: string, email: string, fullName?: Maybe<string> };

export type PetitionSharingModal_UserGroupFragment = { __typename?: 'UserGroup', id: string, name: string, members: Array<{ __typename?: 'UserGroupMember', user: { __typename?: 'User', id: string, email: string, fullName?: Maybe<string> } }> };

export type PetitionSharingModal_addPetitionPermissionMutationVariables = Exact<{
  petitionIds: Array<Scalars['GID']> | Scalars['GID'];
  userIds?: Maybe<Array<Scalars['GID']> | Scalars['GID']>;
  userGroupIds?: Maybe<Array<Scalars['GID']> | Scalars['GID']>;
  permissionType: PetitionPermissionTypeRW;
  notify?: Maybe<Scalars['Boolean']>;
  subscribe?: Maybe<Scalars['Boolean']>;
  message?: Maybe<Scalars['String']>;
}>;


export type PetitionSharingModal_addPetitionPermissionMutation = { addPetitionPermission: Array<{ __typename?: 'Petition', id: string, name?: Maybe<string>, permissions: Array<{ __typename?: 'PetitionUserGroupPermission', permissionType: PetitionPermissionType, group: { __typename?: 'UserGroup', id: string, name: string, members: Array<{ __typename?: 'UserGroupMember', user: { __typename?: 'User', id: string, email: string, fullName?: Maybe<string> } }> } } | { __typename?: 'PetitionUserPermission', permissionType: PetitionPermissionType, user: { __typename?: 'User', id: string, email: string, fullName?: Maybe<string> } }> }> };

export type PetitionSharingModal_removePetitionPermissionMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  userIds?: Maybe<Array<Scalars['GID']> | Scalars['GID']>;
  userGroupIds?: Maybe<Array<Scalars['GID']> | Scalars['GID']>;
}>;


export type PetitionSharingModal_removePetitionPermissionMutation = { removePetitionPermission: Array<{ __typename?: 'Petition', id: string, name?: Maybe<string>, permissions: Array<{ __typename?: 'PetitionUserGroupPermission', permissionType: PetitionPermissionType, group: { __typename?: 'UserGroup', id: string, name: string, members: Array<{ __typename?: 'UserGroupMember', user: { __typename?: 'User', id: string, email: string, fullName?: Maybe<string> } }> } } | { __typename?: 'PetitionUserPermission', permissionType: PetitionPermissionType, user: { __typename?: 'User', id: string, email: string, fullName?: Maybe<string> } }> }> };

export type PetitionSharingModal_transferPetitionOwnershipMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  userId: Scalars['GID'];
}>;


export type PetitionSharingModal_transferPetitionOwnershipMutation = { transferPetitionOwnership: Array<{ __typename?: 'Petition', id: string, name?: Maybe<string>, permissions: Array<{ __typename?: 'PetitionUserGroupPermission', permissionType: PetitionPermissionType, group: { __typename?: 'UserGroup', id: string, name: string, members: Array<{ __typename?: 'UserGroupMember', user: { __typename?: 'User', id: string, email: string, fullName?: Maybe<string> } }> } } | { __typename?: 'PetitionUserPermission', permissionType: PetitionPermissionType, user: { __typename?: 'User', id: string, email: string, fullName?: Maybe<string> } }> }> };

export type PetitionSharingModal_PetitionsQueryVariables = Exact<{
  petitionIds: Array<Scalars['GID']> | Scalars['GID'];
}>;


export type PublicLinkSettingsDialog_PublicPetitionLinkFragment = {
  __typename?: "PublicPetitionLink";
  id: string;
  title: string;
  isActive: boolean;
  description: string;
  slug: string;
  linkPermissions: Array<
    | {
        __typename?: "PublicPetitionLinkUserGroupPermission";
        permissionType: PetitionPermissionType;
        group: { __typename?: "UserGroup"; id: string };
      }
    | {
        __typename?: "PublicPetitionLinkUserPermission";
        permissionType: PetitionPermissionType;
        user: { __typename?: "User"; id: string };
      }
  >;
};

export type SignatureConfigDialog_PetitionFragment = {
  __typename?: "Petition";
  name?: Maybe<string>;
  status: PetitionStatus;
  signatureConfig?: Maybe<{
    __typename?: "SignatureConfig";
    provider: string;
    title: string;
    review: boolean;
    contacts: Array<
      Maybe<{ __typename?: "Contact"; id: string; fullName?: Maybe<string>; email: string }>
    >;
  }>;
};

export type SignatureConfigDialog_PetitionFragment = { __typename?: 'Petition', name?: Maybe<string>, status: PetitionStatus, signatureConfig?: Maybe<{ __typename?: 'SignatureConfig', provider: string, title: string, review: boolean, contacts: Array<Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }>> }> };

export type SignatureConfigDialog_OrgIntegrationFragment = { __typename?: 'OrgIntegration', label: string, value: string };

export type useTemplateDetailsDialogPetitionQueryVariables = Exact<{
  templateId: Scalars['GID'];
}>;

export type useTemplateDetailsDialogPetitionQuery = {
  petition?: Maybe<
    | { __typename?: "Petition" }
    | {
        __typename?: "PetitionTemplate";
        id: string;
        descriptionHtml?: Maybe<string>;
        name?: Maybe<string>;
        updatedAt: string;
        fields: Array<{
          __typename?: "PetitionField";
          id: string;
          title?: Maybe<string>;
          type: PetitionFieldType;
          options: { [key: string]: any };
        }>;
        owner: {
          __typename?: "User";
          id: string;
          fullName?: Maybe<string>;
          organization: { __typename?: "Organization"; id: string; name: string };
        };
        myEffectivePermission?: Maybe<{
          __typename?: "EffectivePetitionUserPermission";
          permissionType: PetitionPermissionType;
        }>;
        publicLink?: Maybe<{
          __typename?: "PublicPetitionLink";
          id: string;
          isActive: boolean;
          slug: string;
        }>;
      }
  >;
};

export type TemplateDetailsDialog_PetitionTemplateFragment = {
  __typename?: "PetitionTemplate";
  id: string;
  descriptionHtml?: Maybe<string>;
  name?: Maybe<string>;
  updatedAt: string;
  fields: Array<{
    __typename?: "PetitionField";
    id: string;
    title?: Maybe<string>;
    type: PetitionFieldType;
    options: { [key: string]: any };
  }>;
  owner: {
    __typename?: "User";
    id: string;
    fullName?: Maybe<string>;
    organization: { __typename?: "Organization"; id: string; name: string };
  };
  myEffectivePermission?: Maybe<{
    __typename?: "EffectivePetitionUserPermission";
    permissionType: PetitionPermissionType;
  }>;
  publicLink?: Maybe<{
    __typename?: "PublicPetitionLink";
    id: string;
    isActive: boolean;
    slug: string;
  }>;
};

export type TemplateDetailsDialog_PetitionTemplateFragment = { __typename?: 'PetitionTemplate', id: string, descriptionHtml?: Maybe<string>, name?: Maybe<string>, updatedAt: string, fields: Array<{ __typename?: 'PetitionField', id: string, title?: Maybe<string>, type: PetitionFieldType, options: { [key: string]: any } }>, owner: { __typename?: 'User', id: string, fullName?: Maybe<string>, organization: { __typename?: 'Organization', id: string, name: string } }, myEffectivePermission?: Maybe<{ __typename?: 'EffectivePetitionUserPermission', permissionType: PetitionPermissionType }> };

export type CopySignatureConfigDialog_ContactFragment = { __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string };

export type DynamicSelectSettings_uploadDynamicSelectFieldFileMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  fieldId: Scalars['GID'];
  file: Scalars['Upload'];
}>;


export type DynamicSelectSettings_uploadDynamicSelectFieldFileMutation = { uploadDynamicSelectFieldFile: { __typename?: 'PetitionField', id: string, options: { [key: string]: any } } };

export type DynamicSelectSettings_dynamicSelectFieldFileDownloadLinkMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  fieldId: Scalars['GID'];
}>;


export type DynamicSelectSettings_dynamicSelectFieldFileDownloadLinkMutation = { dynamicSelectFieldFileDownloadLink: { __typename?: 'FileUploadDownloadLinkResult', result: Result, url?: Maybe<string> } };

export type PetitionComposeField_PetitionFieldFragment = { __typename?: 'PetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, description?: Maybe<string>, optional: boolean, multiple: boolean, isFixed: boolean, isReadOnly: boolean, visibility?: Maybe<{ [key: string]: any }>, options: { [key: string]: any }, attachments: Array<{ __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } }> };

export type PetitionComposeField_PetitionFieldAttachmentFragment = { __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } };

export type PetitionComposeField_createPetitionFieldAttachmentUploadLinkMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  fieldId: Scalars['GID'];
  data: FileUploadInput;
}>;


export type PetitionComposeField_createPetitionFieldAttachmentUploadLinkMutation = { createPetitionFieldAttachmentUploadLink: { __typename?: 'CreateFileUploadFieldAttachment', presignedPostData: { __typename?: 'AWSPresignedPostData', url: string, fields: { [key: string]: any } }, attachment: { __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } } } };

export type PetitionComposeField_petitionFieldAttachmentUploadCompleteMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  fieldId: Scalars['GID'];
  attachmentId: Scalars['GID'];
}>;


export type PetitionComposeField_petitionFieldAttachmentUploadCompleteMutation = { petitionFieldAttachmentUploadComplete: { __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } } };

export type PetitionComposeField_removePetitionFieldAttachmentMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  fieldId: Scalars['GID'];
  attachmentId: Scalars['GID'];
}>;


export type PetitionComposeField_removePetitionFieldAttachmentMutation = { removePetitionFieldAttachment: Result };

export type PetitionComposeField_petitionFieldAttachmentDownloadLinkMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  fieldId: Scalars['GID'];
  attachmentId: Scalars['GID'];
}>;


export type PetitionComposeField_petitionFieldAttachmentDownloadLinkMutation = { petitionFieldAttachmentDownloadLink: { __typename?: 'FileUploadDownloadLinkResult', url?: Maybe<string> } };

export type PetitionComposeField_updateFieldAttachments_PetitionFieldFragment = { __typename?: 'PetitionField', attachments: Array<{ __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } }> };

export type PetitionComposeFieldAttachment_PetitionFieldAttachmentFragment = { __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } };

export type PetitionComposeFieldList_PetitionFragment = { __typename?: 'Petition', fields: Array<{ __typename?: 'PetitionField', isFixed: boolean, id: string, type: PetitionFieldType, title?: Maybe<string>, description?: Maybe<string>, optional: boolean, multiple: boolean, isReadOnly: boolean, visibility?: Maybe<{ [key: string]: any }>, options: { [key: string]: any }, attachments: Array<{ __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } }> }> };

export type PetitionComposeFieldSettings_PetitionFieldFragment = { __typename?: 'PetitionField', id: string, type: PetitionFieldType, optional: boolean, multiple: boolean, options: { [key: string]: any }, isReadOnly: boolean, isFixed: boolean, position: number, visibility?: Maybe<{ [key: string]: any }> };

export type PetitionFieldOptionsListEditor_PetitionFieldFragment = { __typename?: 'PetitionField', id: string, type: PetitionFieldType, optional: boolean, options: { [key: string]: any } };

export type PetitionFieldVisibilityEditor_PetitionFieldFragment = { __typename?: 'PetitionField', id: string, type: PetitionFieldType, multiple: boolean, options: { [key: string]: any }, isReadOnly: boolean, title?: Maybe<string> };

export type PetitionTemplateComposeMessageEditor_PetitionFragment = { __typename?: 'PetitionTemplate', id: string, emailSubject?: Maybe<string>, emailBody?: Maybe<any>, description?: Maybe<any>, isReadOnly: boolean };

export type ReferencedFieldDialogDialog_PetitionFieldFragment = { __typename?: 'PetitionField', id: string, title?: Maybe<string>, type: PetitionFieldType };

export type PetitionListTagFilter_TagFragment = { __typename?: 'Tag', id: string, name: string, color: string };

export type PetitionListTagFilter_tagsQueryVariables = Exact<{
  search?: Maybe<Scalars['String']>;
}>;


export type NewPetitionTemplatesList_PetitionTemplateFragment = {
  __typename?: "PetitionTemplate";
  id: string;
  name?: Maybe<string>;
  descriptionExcerpt?: Maybe<string>;
  locale: PetitionLocale;
  owner: { __typename?: "User"; id: string; fullName?: Maybe<string> };
  publicLink?: Maybe<{ __typename?: "PublicPetitionLink"; id: string; isActive: boolean }>;
};

export type TemplateCard_PetitionTemplateFragment = {
  __typename?: "PetitionTemplate";
  name?: Maybe<string>;
  descriptionExcerpt?: Maybe<string>;
  locale: PetitionLocale;
  owner: { __typename?: "User"; id: string; fullName?: Maybe<string> };
  publicLink?: Maybe<{ __typename?: "PublicPetitionLink"; id: string; isActive: boolean }>;
};

export type TemplateCard_PetitionTemplateFragment = { __typename?: 'PetitionTemplate', name?: Maybe<string>, descriptionExcerpt?: Maybe<string>, locale: PetitionLocale, owner: { __typename?: 'User', id: string, fullName?: Maybe<string> } };

export type ExportRepliesDialog_UserFragment = { __typename?: 'User', hasExportCuatrecasas: boolean };

export type ExportRepliesDialog_PetitionFieldFragment = { __typename?: 'PetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, replies: Array<{ __typename?: 'PetitionFieldReply', content: { [key: string]: any } }> };

export type ExportRepliesProgressDialog_PetitionFragment = { __typename?: 'Petition', id: string, fields: Array<{ __typename?: 'PetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, replies: Array<{ __typename?: 'PetitionFieldReply', id: string, metadata: { [key: string]: any }, content: { [key: string]: any } }> }>, currentSignatureRequest?: Maybe<{ __typename?: 'PetitionSignatureRequest', id: string, status: PetitionSignatureRequestStatus, signedDocumentFilename?: Maybe<string>, auditTrailFilename?: Maybe<string>, metadata: { [key: string]: any } }> };

export type ExportRepliesProgressDialog_PetitionRepliesQueryVariables = Exact<{
  petitionId: Scalars['GID'];
}>;


export type ExportRepliesProgressDialog_PetitionRepliesQuery = { petition?: Maybe<{ __typename?: 'Petition', id: string, fields: Array<{ __typename?: 'PetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, replies: Array<{ __typename?: 'PetitionFieldReply', id: string, metadata: { [key: string]: any }, content: { [key: string]: any } }> }>, currentSignatureRequest?: Maybe<{ __typename?: 'PetitionSignatureRequest', id: string, status: PetitionSignatureRequestStatus, signedDocumentFilename?: Maybe<string>, auditTrailFilename?: Maybe<string>, metadata: { [key: string]: any } }> } | { __typename?: 'PetitionTemplate' }> };

export type ExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  replyId: Scalars['GID'];
}>;


export type ExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutation = { fileUploadReplyDownloadLink: { __typename?: 'FileUploadDownloadLinkResult', result: Result, url?: Maybe<string> } };

export type ExportRepliesProgressDialog_signedPetitionDownloadLinkMutationVariables = Exact<{
  petitionSignatureRequestId: Scalars['GID'];
  downloadAuditTrail?: Maybe<Scalars['Boolean']>;
}>;


export type ExportRepliesProgressDialog_signedPetitionDownloadLinkMutation = { signedPetitionDownloadLink: { __typename?: 'FileUploadDownloadLinkResult', result: Result, url?: Maybe<string> } };

export type ExportRepliesProgressDialog_updatePetitionFieldReplyMetadataMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  replyId: Scalars['GID'];
  metadata: Scalars['JSONObject'];
}>;


export type ExportRepliesProgressDialog_updatePetitionFieldReplyMetadataMutation = { updatePetitionFieldReplyMetadata: { __typename?: 'PetitionFieldReply', id: string, metadata: { [key: string]: any } } };

export type ExportRepliesProgressDialog_updateSignatureRequestMetadataMutationVariables = Exact<{
  petitionSignatureRequestId: Scalars['GID'];
  metadata: Scalars['JSONObject'];
}>;


export type ExportRepliesProgressDialog_updateSignatureRequestMetadataMutation = { updateSignatureRequestMetadata: { __typename?: 'PetitionSignatureRequest', id: string, metadata: { [key: string]: any } } };

export type PetitionRepliesField_PetitionFieldFragment = { __typename?: 'PetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, description?: Maybe<string>, validated: boolean, replies: Array<{ __typename?: 'PetitionFieldReply', id: string, content: { [key: string]: any }, status: PetitionFieldReplyStatus, createdAt: string, metadata: { [key: string]: any }, field?: Maybe<{ __typename?: 'PetitionField', type: PetitionFieldType }> }>, comments: Array<{ __typename?: 'PetitionFieldComment', id: string, isUnread: boolean, createdAt: string }>, attachments: Array<{ __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } }> };

export type PetitionRepliesField_PetitionFieldReplyFragment = { __typename?: 'PetitionFieldReply', id: string, content: { [key: string]: any }, status: PetitionFieldReplyStatus, createdAt: string, metadata: { [key: string]: any }, field?: Maybe<{ __typename?: 'PetitionField', type: PetitionFieldType }> };

export type PetitionRepliesField_petitionFieldAttachmentDownloadLinkMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  fieldId: Scalars['GID'];
  attachmentId: Scalars['GID'];
}>;


export type PetitionRepliesField_petitionFieldAttachmentDownloadLinkMutation = { petitionFieldAttachmentDownloadLink: { __typename?: 'FileUploadDownloadLinkResult', url?: Maybe<string> } };

export type PetitionRepliesFieldAttachment_PetitionFieldAttachmentFragment = { __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } };

export type PetitionRepliesFieldComments_UserFragment = { __typename?: 'User', id: string, hasInternalComments: boolean };

export type PetitionRepliesFieldComments_PetitionFieldFragment = { __typename?: 'PetitionField', id: string, title?: Maybe<string>, type: PetitionFieldType, comments: Array<{ __typename?: 'PetitionFieldComment', id: string, content: string, createdAt: string, isUnread: boolean, isEdited: boolean, isInternal?: Maybe<boolean>, author?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> }>, replies: Array<{ __typename?: 'PetitionFieldReply', id: string, content: { [key: string]: any } }> };

export type PetitionRepliesFieldComments_PetitionFieldReplyFragment = { __typename?: 'PetitionFieldReply', id: string, content: { [key: string]: any } };

export type PetitionRepliesFieldComments_PetitionFieldCommentFragment = { __typename?: 'PetitionFieldComment', id: string, content: string, createdAt: string, isUnread: boolean, isEdited: boolean, isInternal?: Maybe<boolean>, author?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> };

export type PetitionRepliesFieldReply_PetitionFieldReplyFragment = { __typename?: 'PetitionFieldReply', id: string, content: { [key: string]: any }, status: PetitionFieldReplyStatus, createdAt: string, metadata: { [key: string]: any }, field?: Maybe<{ __typename?: 'PetitionField', type: PetitionFieldType }> };

export type PetitionSignaturesCard_UserFragment = { __typename?: 'User', organization: { __typename?: 'Organization', signatureIntegrations: Array<{ __typename?: 'OrgIntegration', label: string, value: string }> } };

export type PetitionSignaturesCard_PetitionFragment = { __typename?: 'Petition', id: string, status: PetitionStatus, name?: Maybe<string>, signatureConfig?: Maybe<{ __typename?: 'SignatureConfig', timezone: string, provider: string, title: string, review: boolean, contacts: Array<Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }>> }>, signatureRequests?: Maybe<Array<{ __typename?: 'PetitionSignatureRequest', id: string, status: PetitionSignatureRequestStatus, signatureConfig: { __typename?: 'SignatureConfig', contacts: Array<Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }>> } }>> };

export type PetitionSignaturesCard_PetitionSignatureRequestFragment = { __typename?: 'PetitionSignatureRequest', id: string, status: PetitionSignatureRequestStatus, signatureConfig: { __typename?: 'SignatureConfig', contacts: Array<Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }>> } };

export type PetitionSignaturesCard_updatePetitionSignatureConfigMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  signatureConfig?: Maybe<SignatureConfigInput>;
}>;


export type PetitionSignaturesCard_updatePetitionSignatureConfigMutation = { updatePetition: { __typename?: 'Petition', id: string, status: PetitionStatus, name?: Maybe<string>, signatureConfig?: Maybe<{ __typename?: 'SignatureConfig', timezone: string, provider: string, title: string, review: boolean, contacts: Array<Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }>> }>, signatureRequests?: Maybe<Array<{ __typename?: 'PetitionSignatureRequest', id: string, status: PetitionSignatureRequestStatus, signatureConfig: { __typename?: 'SignatureConfig', contacts: Array<Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }>> } }>> } | { __typename?: 'PetitionTemplate' } };

export type PetitionSignaturesCard_cancelSignatureRequestMutationVariables = Exact<{
  petitionSignatureRequestId: Scalars['GID'];
}>;


export type PetitionSignaturesCard_cancelSignatureRequestMutation = { cancelSignatureRequest: { __typename?: 'PetitionSignatureRequest', id: string, status: PetitionSignatureRequestStatus } };

export type PetitionSignaturesCard_startSignatureRequestMutationVariables = Exact<{
  petitionId: Scalars['GID'];
}>;


export type PetitionSignaturesCard_startSignatureRequestMutation = { startSignatureRequest: { __typename?: 'PetitionSignatureRequest', id: string, status: PetitionSignatureRequestStatus } };

export type PetitionSignaturesCard_signedPetitionDownloadLinkMutationVariables = Exact<{
  petitionSignatureRequestId: Scalars['GID'];
  preview?: Maybe<Scalars['Boolean']>;
}>;


export type PetitionSignaturesCard_signedPetitionDownloadLinkMutation = { signedPetitionDownloadLink: { __typename?: 'FileUploadDownloadLinkResult', result: Result, url?: Maybe<string> } };

export type PublicTemplateCard_LandingTemplateFragment = { __typename?: 'LandingTemplate', id: string, locale: PetitionLocale, name?: Maybe<string>, slug: string, imageUrl?: Maybe<string>, backgroundColor?: Maybe<string>, ownerFullName: string, organizationName: string };

export type useCompleteSignerInfoDialog_PublicContactFragment = { __typename?: 'PublicContact', firstName?: Maybe<string>, lastName?: Maybe<string>, email: string };

export type RecipientViewContentsCard_PublicUserFragment = { __typename?: 'PublicUser', firstName?: Maybe<string> };

export type RecipientViewContentsCard_PublicPetitionFragment = { __typename?: 'PublicPetition', status: PetitionStatus, fields: Array<{ __typename?: 'PublicPetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, options: { [key: string]: any }, optional: boolean, isReadOnly: boolean, commentCount: number, unreadCommentCount: number, visibility?: Maybe<{ [key: string]: any }>, replies: Array<{ __typename?: 'PublicPetitionFieldReply', id: string, content: { [key: string]: any } }> }> };

export type RecipientViewContentsCard_PublicPetitionFieldFragment = { __typename?: 'PublicPetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, options: { [key: string]: any }, optional: boolean, isReadOnly: boolean, commentCount: number, unreadCommentCount: number, visibility?: Maybe<{ [key: string]: any }>, replies: Array<{ __typename?: 'PublicPetitionFieldReply', id: string, content: { [key: string]: any } }> };

export type RecipientViewHeader_PublicContactFragment = { __typename?: 'PublicContact', id: string, fullName?: Maybe<string>, firstName?: Maybe<string>, email: string };

export type RecipientViewHeader_PublicUserFragment = { __typename?: 'PublicUser', id: string, firstName?: Maybe<string>, fullName?: Maybe<string>, email: string, organization: { __typename?: 'PublicOrganization', name: string, identifier: string, logoUrl?: Maybe<string> } };

export type RecipientViewHeader_publicDelegateAccessToContactMutationVariables = Exact<{
  keycode: Scalars['ID'];
  email: Scalars['String'];
  firstName: Scalars['String'];
  lastName: Scalars['String'];
  messageBody: Scalars['JSON'];
}>;


export type RecipientViewHeader_publicDelegateAccessToContactMutation = { publicDelegateAccessToContact: { __typename?: 'PublicPetitionAccess', petition?: Maybe<{ __typename?: 'PublicPetition', id: string, recipients: Array<{ __typename?: 'PublicContact', id: string, fullName?: Maybe<string>, email: string }> }> } };

export type RecipientViewProgressFooter_PublicPetitionFragment = { __typename?: 'PublicPetition', status: PetitionStatus, fields: Array<{ __typename?: 'PublicPetitionField', id: string, type: PetitionFieldType, optional: boolean, validated: boolean, isReadOnly: boolean, options: { [key: string]: any }, visibility?: Maybe<{ [key: string]: any }>, replies: Array<{ __typename?: 'PublicPetitionFieldReply', id: string, content: { [key: string]: any } }> }>, signature?: Maybe<{ __typename?: 'PublicSignatureConfig', review: boolean }> };

export type RecipientViewProgressFooter_PublicPetitionFieldFragment = { __typename?: 'PublicPetitionField', id: string, type: PetitionFieldType, optional: boolean, validated: boolean, isReadOnly: boolean, options: { [key: string]: any }, visibility?: Maybe<{ [key: string]: any }>, replies: Array<{ __typename?: 'PublicPetitionFieldReply', id: string, content: { [key: string]: any } }> };

export type RecipientViewFieldAttachment_PetitionFieldAttachmentFragment = { __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } };

export type RecipientViewPetitionField_PublicPetitionAccessFragment = { __typename?: 'PublicPetitionAccess', granter?: Maybe<{ __typename?: 'PublicUser', fullName?: Maybe<string> }>, contact?: Maybe<{ __typename?: 'PublicContact', id: string }> };

export type RecipientViewPetitionField_PublicPetitionFieldFragment = { __typename?: 'PublicPetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, description?: Maybe<string>, options: { [key: string]: any }, optional: boolean, multiple: boolean, validated: boolean, commentCount: number, unreadCommentCount: number, replies: Array<{ __typename?: 'PublicPetitionFieldReply', id: string, status: PetitionFieldReplyStatus, content: { [key: string]: any }, createdAt: string, updatedAt: string }>, attachments: Array<{ __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } }> };

export type RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLinkMutationVariables = Exact<{
  keycode: Scalars['ID'];
  fieldId: Scalars['GID'];
  attachmentId: Scalars['GID'];
}>;


export type RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLinkMutation = { publicPetitionFieldAttachmentDownloadLink: { __typename?: 'FileUploadDownloadLinkResult', url?: Maybe<string> } };

export type RecipientViewPetitionFieldCard_PublicPetitionAccessFragment = { __typename?: 'PublicPetitionAccess', granter?: Maybe<{ __typename?: 'PublicUser', fullName?: Maybe<string> }>, contact?: Maybe<{ __typename?: 'PublicContact', id: string }> };

export type RecipientViewPetitionFieldCard_PublicPetitionFieldFragment = { __typename?: 'PublicPetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, description?: Maybe<string>, options: { [key: string]: any }, optional: boolean, multiple: boolean, validated: boolean, commentCount: number, unreadCommentCount: number, replies: Array<{ __typename?: 'PublicPetitionFieldReply', id: string, status: PetitionFieldReplyStatus, content: { [key: string]: any }, createdAt: string, updatedAt: string }>, attachments: Array<{ __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } }> };

export type RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragment = { __typename?: 'PublicPetitionFieldReply', id: string, status: PetitionFieldReplyStatus, content: { [key: string]: any }, createdAt: string, updatedAt: string };

export type RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccessFragment = { __typename?: 'PublicPetitionAccess', granter?: Maybe<{ __typename?: 'PublicUser', fullName?: Maybe<string> }>, contact?: Maybe<{ __typename?: 'PublicContact', id: string }> };

export type RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldFragment = { __typename?: 'PublicPetitionField', id: string, title?: Maybe<string> };

export type RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragment = { __typename?: 'PublicPetitionFieldComment', id: string, content: string, createdAt: string, isUnread: boolean, author?: Maybe<{ __typename?: 'PublicContact', id: string, fullName?: Maybe<string> } | { __typename?: 'PublicUser', id: string, fullName?: Maybe<string> }> };

export type RecipientViewPetitionFieldCommentsQueryVariables = Exact<{
  keycode: Scalars['ID'];
  petitionFieldId: Scalars['GID'];
}>;


export type RecipientViewPetitionFieldCommentsQuery = { petitionFieldComments: Array<{ __typename?: 'PublicPetitionFieldComment', id: string, content: string, createdAt: string, isUnread: boolean, author?: Maybe<{ __typename?: 'PublicContact', id: string, fullName?: Maybe<string> } | { __typename?: 'PublicUser', id: string, fullName?: Maybe<string> }> }> };

export type RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutationVariables = Exact<{
  keycode: Scalars['ID'];
  petitionFieldCommentIds: Array<Scalars['GID']> | Scalars['GID'];
}>;


export type RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutation = { publicMarkPetitionFieldCommentsAsRead: Array<{ __typename?: 'PublicPetitionFieldComment', id: string, isUnread: boolean }> };

export type RecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutationVariables = Exact<{
  keycode: Scalars['ID'];
  petitionFieldId: Scalars['GID'];
  content: Scalars['String'];
}>;


export type RecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutation = { publicCreatePetitionFieldComment: { __typename?: 'PublicPetitionFieldComment', id: string, content: string, createdAt: string, isUnread: boolean, author?: Maybe<{ __typename?: 'PublicContact', id: string, fullName?: Maybe<string> } | { __typename?: 'PublicUser', id: string, fullName?: Maybe<string> }> } };

export type RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutationVariables = Exact<{
  keycode: Scalars['ID'];
  petitionFieldId: Scalars['GID'];
  petitionFieldCommentId: Scalars['GID'];
  content: Scalars['String'];
}>;


export type RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutation = { publicUpdatePetitionFieldComment: { __typename?: 'PublicPetitionFieldComment', id: string, content: string, createdAt: string, isUnread: boolean, author?: Maybe<{ __typename?: 'PublicContact', id: string, fullName?: Maybe<string> } | { __typename?: 'PublicUser', id: string, fullName?: Maybe<string> }> } };

export type RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutationVariables = Exact<{
  keycode: Scalars['ID'];
  petitionFieldId: Scalars['GID'];
  petitionFieldCommentId: Scalars['GID'];
}>;


export type RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutation = { publicDeletePetitionFieldComment: Result };

export type RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentCountsFragment = { __typename?: 'PublicPetitionField', commentCount: number, unreadCommentCount: number };

export type RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkMutationVariables = Exact<{
  keycode: Scalars['ID'];
  replyId: Scalars['GID'];
  preview?: Maybe<Scalars['Boolean']>;
}>;


export type RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkMutation = { publicFileUploadReplyDownloadLink: { __typename?: 'FileUploadDownloadLinkResult', result: Result, url?: Maybe<string> } };

export type RecipientViewPetitionFieldMutations_publicDeletePetitionReplyMutationVariables = Exact<{
  replyId: Scalars['GID'];
  keycode: Scalars['ID'];
}>;


export type RecipientViewPetitionFieldMutations_publicDeletePetitionReplyMutation = { publicDeletePetitionReply: Result };

export type RecipientViewPetitionFieldMutations_publicUpdateSimpleReplyMutationVariables = Exact<{
  keycode: Scalars['ID'];
  replyId: Scalars['GID'];
  value: Scalars['String'];
}>;


export type RecipientViewPetitionFieldMutations_publicUpdateSimpleReplyMutation = { publicUpdateSimpleReply: { __typename?: 'PublicPetitionFieldReply', id: string, content: { [key: string]: any }, status: PetitionFieldReplyStatus, updatedAt: string } };

export type RecipientViewPetitionFieldMutations_publicCreateSimpleReplyMutationVariables = Exact<{
  keycode: Scalars['ID'];
  fieldId: Scalars['GID'];
  value: Scalars['String'];
}>;


export type RecipientViewPetitionFieldMutations_publicCreateSimpleReplyMutation = { publicCreateSimpleReply: { __typename?: 'PublicPetitionFieldReply', id: string, status: PetitionFieldReplyStatus, content: { [key: string]: any }, createdAt: string, updatedAt: string } };

export type RecipientViewPetitionFieldMutations_publicCreateCheckboxReplyMutationVariables = Exact<{
  keycode: Scalars['ID'];
  fieldId: Scalars['GID'];
  values: Array<Scalars['String']> | Scalars['String'];
}>;


export type RecipientViewPetitionFieldMutations_publicCreateCheckboxReplyMutation = { publicCreateCheckboxReply: { __typename?: 'PublicPetitionFieldReply', id: string, status: PetitionFieldReplyStatus, content: { [key: string]: any }, createdAt: string, updatedAt: string } };

export type RecipientViewPetitionFieldMutations_publicUpdateCheckboxReplyMutationVariables = Exact<{
  keycode: Scalars['ID'];
  replyId: Scalars['GID'];
  values: Array<Scalars['String']> | Scalars['String'];
}>;


export type RecipientViewPetitionFieldMutations_publicUpdateCheckboxReplyMutation = { publicUpdateCheckboxReply: { __typename?: 'PublicPetitionFieldReply', id: string, content: { [key: string]: any }, status: PetitionFieldReplyStatus, updatedAt: string } };

export type RecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyMutationVariables = Exact<{
  keycode: Scalars['ID'];
  fieldId: Scalars['GID'];
  value: Array<Array<Maybe<Scalars['String']>> | Maybe<Scalars['String']>> | Array<Maybe<Scalars['String']>> | Maybe<Scalars['String']>;
}>;


export type RecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyMutation = { publicCreateDynamicSelectReply: { __typename?: 'PublicPetitionFieldReply', id: string, status: PetitionFieldReplyStatus, content: { [key: string]: any }, createdAt: string, updatedAt: string } };

export type RecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyMutationVariables = Exact<{
  keycode: Scalars['ID'];
  replyId: Scalars['GID'];
  value: Array<Array<Maybe<Scalars['String']>> | Maybe<Scalars['String']>> | Array<Maybe<Scalars['String']>> | Maybe<Scalars['String']>;
}>;


export type RecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyMutation = { publicUpdateDynamicSelectReply: { __typename?: 'PublicPetitionFieldReply', id: string, content: { [key: string]: any }, status: PetitionFieldReplyStatus, updatedAt: string } };

export type RecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutationVariables = Exact<{
  keycode: Scalars['ID'];
  fieldId: Scalars['GID'];
  data: FileUploadInput;
}>;


export type RecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutation = { publicCreateFileUploadReply: { __typename?: 'CreateFileUploadReply', presignedPostData: { __typename?: 'AWSPresignedPostData', url: string, fields: { [key: string]: any } }, reply: { __typename?: 'PublicPetitionFieldReply', id: string, status: PetitionFieldReplyStatus, content: { [key: string]: any }, createdAt: string, updatedAt: string } } };

export type RecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutationVariables = Exact<{
  keycode: Scalars['ID'];
  replyId: Scalars['GID'];
}>;


export type RecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutation = { publicFileUploadReplyComplete: { __typename?: 'PublicPetitionFieldReply', id: string, content: { [key: string]: any } } };

export type RecipientViewPetitionFieldMutations_updateFieldReplies_PublicPetitionFieldFragment = { __typename?: 'PublicPetitionField', replies: Array<{ __typename?: 'PublicPetitionFieldReply', id: string }> };

export type RecipientViewPetitionFieldMutations_updateReplyContent_PublicPetitionFieldReplyFragment = { __typename?: 'PublicPetitionFieldReply', content: { [key: string]: any } };

export type RecipientViewPetitionFieldMutations_updatePetitionStatus_PublicPetitionFragment = { __typename?: 'PublicPetition', status: PetitionStatus };

export type GenerateNewTokenDialog_generateUserAuthTokenMutationVariables = Exact<{
  tokenName: Scalars['String'];
}>;


export type GenerateNewTokenDialog_generateUserAuthTokenMutation = { generateUserAuthToken: { __typename?: 'GenerateUserAuthTokenResponse', apiKey: string, userAuthToken: { __typename?: 'UserAuthenticationToken', id: string, tokenName: string, createdAt: string, lastUsedAt?: Maybe<string> } } };

export type Admin_UserFragment = { __typename?: 'User', id: string, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole };

export type AdminQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminQuery = { me: { __typename?: 'User', id: string, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole } };

export type AdminOrganizations_OrganizationFragment = { __typename?: 'Organization', id: string, _id: number, name: string, identifier: string, status: OrganizationStatus, userCount: number, createdAt: string };

export type AdminOrganizations_UserFragment = { __typename?: 'User', id: string, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole };

export type AdminOrganizationsQueryVariables = Exact<{
  offset: Scalars['Int'];
  limit: Scalars['Int'];
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<QueryOrganizations_OrderBy> | QueryOrganizations_OrderBy>;
  status?: Maybe<OrganizationStatus>;
}>;


export type AdminOrganizationsQuery = { organizations: { __typename?: 'OrganizationPagination', totalCount: number, items: Array<{ __typename?: 'Organization', id: string, _id: number, name: string, identifier: string, status: OrganizationStatus, userCount: number, createdAt: string }> } };

export type AdminOrganizationsUserQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminOrganizationsUserQuery = { me: { __typename?: 'User', id: string, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole } };

export type AdminSupportMethods_UserFragment = { __typename?: 'User', id: string, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole };

export type AdminSupportMethodsUserQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminSupportMethodsUserQuery = { me: { __typename?: 'User', id: string, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole } };

export type Contact_ContactFragment = { __typename?: 'Contact', id: string, email: string, fullName?: Maybe<string>, firstName?: Maybe<string>, lastName?: Maybe<string>, accesses: { __typename?: 'PetitionAccessPagination', items: Array<{ __typename?: 'PetitionAccess', id: string, petition?: Maybe<{ __typename?: 'Petition', id: string, name?: Maybe<string>, sentAt?: Maybe<string>, status: PetitionStatus, permissions: Array<{ __typename?: 'PetitionUserGroupPermission', permissionType: PetitionPermissionType, group: { __typename?: 'UserGroup', id: string, name: string } } | { __typename?: 'PetitionUserPermission', permissionType: PetitionPermissionType, user: { __typename?: 'User', id: string, fullName?: Maybe<string> } }>, progress: { __typename?: 'PetitionProgress', validated: number, replied: number, optional: number, total: number }, currentSignatureRequest?: Maybe<{ __typename?: 'PetitionSignatureRequest', status: PetitionSignatureRequestStatus }>, signatureConfig?: Maybe<{ __typename?: 'SignatureConfig', review: boolean }> }> }> } };

export type Contact_Contact_ProfileFragment = { __typename?: 'Contact', id: string, email: string, fullName?: Maybe<string>, firstName?: Maybe<string>, lastName?: Maybe<string> };

export type Contact_PetitionAccessFragment = { __typename?: 'PetitionAccess', id: string, petition?: Maybe<{ __typename?: 'Petition', id: string, name?: Maybe<string>, sentAt?: Maybe<string>, status: PetitionStatus, permissions: Array<{ __typename?: 'PetitionUserGroupPermission', permissionType: PetitionPermissionType, group: { __typename?: 'UserGroup', id: string, name: string } } | { __typename?: 'PetitionUserPermission', permissionType: PetitionPermissionType, user: { __typename?: 'User', id: string, fullName?: Maybe<string> } }>, progress: { __typename?: 'PetitionProgress', validated: number, replied: number, optional: number, total: number }, currentSignatureRequest?: Maybe<{ __typename?: 'PetitionSignatureRequest', status: PetitionSignatureRequestStatus }>, signatureConfig?: Maybe<{ __typename?: 'SignatureConfig', review: boolean }> }> };

export type Contact_PetitionFragment = { __typename?: 'Petition', id: string, name?: Maybe<string>, sentAt?: Maybe<string>, status: PetitionStatus, permissions: Array<{ __typename?: 'PetitionUserGroupPermission', permissionType: PetitionPermissionType, group: { __typename?: 'UserGroup', id: string, name: string } } | { __typename?: 'PetitionUserPermission', permissionType: PetitionPermissionType, user: { __typename?: 'User', id: string, fullName?: Maybe<string> } }>, progress: { __typename?: 'PetitionProgress', validated: number, replied: number, optional: number, total: number }, currentSignatureRequest?: Maybe<{ __typename?: 'PetitionSignatureRequest', status: PetitionSignatureRequestStatus }>, signatureConfig?: Maybe<{ __typename?: 'SignatureConfig', review: boolean }> };

export type Contact_UserFragment = { __typename?: 'User', id: string, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole, hasPetitionSignature: boolean };

export type Contact_updateContactMutationVariables = Exact<{
  id: Scalars['GID'];
  data: UpdateContactInput;
}>;


export type Contact_updateContactMutation = { updateContact: { __typename?: 'Contact', id: string, email: string, fullName?: Maybe<string>, firstName?: Maybe<string>, lastName?: Maybe<string> } };

export type ContactUserQueryVariables = Exact<{ [key: string]: never; }>;


export type ContactUserQuery = { me: { __typename?: 'User', id: string, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole, hasPetitionSignature: boolean } };

export type ContactQueryVariables = Exact<{
  id: Scalars['GID'];
  hasPetitionSignature: Scalars['Boolean'];
}>;


export type ContactQuery = { contact?: Maybe<{ __typename?: 'Contact', id: string, email: string, fullName?: Maybe<string>, firstName?: Maybe<string>, lastName?: Maybe<string>, accesses: { __typename?: 'PetitionAccessPagination', items: Array<{ __typename?: 'PetitionAccess', id: string, petition?: Maybe<{ __typename?: 'Petition', id: string, name?: Maybe<string>, sentAt?: Maybe<string>, status: PetitionStatus, permissions: Array<{ __typename?: 'PetitionUserGroupPermission', permissionType: PetitionPermissionType, group: { __typename?: 'UserGroup', id: string, name: string } } | { __typename?: 'PetitionUserPermission', permissionType: PetitionPermissionType, user: { __typename?: 'User', id: string, fullName?: Maybe<string> } }>, progress: { __typename?: 'PetitionProgress', validated: number, replied: number, optional: number, total: number }, currentSignatureRequest?: Maybe<{ __typename?: 'PetitionSignatureRequest', status: PetitionSignatureRequestStatus }>, signatureConfig?: Maybe<{ __typename?: 'SignatureConfig', review: boolean }> }> }> } }> };

export type Contacts_ContactsListFragment = { __typename?: 'ContactPagination', totalCount: number, items: Array<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, firstName?: Maybe<string>, lastName?: Maybe<string>, email: string, createdAt: string }> };

export type Contacts_UserFragment = { __typename?: 'User', id: string, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole };

export type Contacts_deleteContactsMutationVariables = Exact<{
  ids: Array<Scalars['GID']> | Scalars['GID'];
}>;


export type Contacts_deleteContactsMutation = { deleteContacts: Result };

export type ContactsQueryVariables = Exact<{
  offset: Scalars['Int'];
  limit: Scalars['Int'];
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<QueryContacts_OrderBy> | QueryContacts_OrderBy>;
}>;


export type ContactsQuery = { contacts: { __typename?: 'ContactPagination', totalCount: number, items: Array<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, firstName?: Maybe<string>, lastName?: Maybe<string>, email: string, createdAt: string }> } };

export type ContactsUserQueryVariables = Exact<{ [key: string]: never; }>;


export type ContactsUserQuery = { me: { __typename?: 'User', id: string, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole } };

export type OrganizationBranding_updateOrgLogoMutationVariables = Exact<{
  orgId: Scalars['GID'];
  file: Scalars['Upload'];
}>;


export type OrganizationBranding_updateOrgLogoMutation = { updateOrganizationLogo: { __typename?: 'Organization', id: string, logoUrl?: Maybe<string> } };

export type OrganizationBrandingQueryVariables = Exact<{ [key: string]: never; }>;


export type OrganizationBrandingQuery = { me: { __typename?: 'User', id: string, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole, organization: { __typename?: 'Organization', id: string, logoUrl?: Maybe<string>, name: string } } };

export type OrganizationGroup_UserGroupFragment = { __typename?: 'UserGroup', id: string, name: string, createdAt: string, members: Array<{ __typename?: 'UserGroupMember', id: string, addedAt: string, user: { __typename?: 'User', id: string, fullName?: Maybe<string>, email: string } }> };

export type OrganizationGroup_UserGroupMemberFragment = { __typename?: 'UserGroupMember', id: string, addedAt: string, user: { __typename?: 'User', id: string, fullName?: Maybe<string>, email: string } };

export type OrganizationGroup_UserFragment = { __typename?: 'User', id: string, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole };

export type OrganizationGroup_updateUserGroupMutationVariables = Exact<{
  id: Scalars['GID'];
  data: UpdateUserGroupInput;
}>;


export type OrganizationGroup_updateUserGroupMutation = { updateUserGroup: { __typename?: 'UserGroup', id: string, name: string, createdAt: string, members: Array<{ __typename?: 'UserGroupMember', id: string, addedAt: string, user: { __typename?: 'User', id: string, fullName?: Maybe<string>, email: string } }> } };

export type OrganizationGroup_addUsersToUserGroupMutationVariables = Exact<{
  userGroupId: Scalars['GID'];
  userIds: Array<Scalars['GID']> | Scalars['GID'];
}>;


export type OrganizationGroup_addUsersToUserGroupMutation = { addUsersToUserGroup: { __typename?: 'UserGroup', id: string, name: string, createdAt: string, members: Array<{ __typename?: 'UserGroupMember', id: string, addedAt: string, user: { __typename?: 'User', id: string, fullName?: Maybe<string>, email: string } }> } };

export type OrganizationGroup_removeUsersFromGroupMutationVariables = Exact<{
  userGroupId: Scalars['GID'];
  userIds: Array<Scalars['GID']> | Scalars['GID'];
}>;


export type OrganizationGroup_removeUsersFromGroupMutation = { removeUsersFromGroup: { __typename?: 'UserGroup', id: string, name: string, createdAt: string, members: Array<{ __typename?: 'UserGroupMember', id: string, addedAt: string, user: { __typename?: 'User', id: string, fullName?: Maybe<string>, email: string } }> } };

export type OrganizationGroup_deleteUserGroupMutationVariables = Exact<{
  ids: Array<Scalars['GID']> | Scalars['GID'];
}>;


export type OrganizationGroup_deleteUserGroupMutation = { deleteUserGroup: Result };

export type OrganizationGroup_cloneUserGroupMutationVariables = Exact<{
  ids: Array<Scalars['GID']> | Scalars['GID'];
  locale: Scalars['String'];
}>;


export type OrganizationGroup_cloneUserGroupMutation = { cloneUserGroup: Array<{ __typename?: 'UserGroup', id: string, name: string, createdAt: string, members: Array<{ __typename?: 'UserGroupMember', id: string, addedAt: string, user: { __typename?: 'User', id: string, fullName?: Maybe<string>, email: string } }> }> };

export type OrganizationGroupQueryVariables = Exact<{
  id: Scalars['GID'];
}>;


export type OrganizationGroupQuery = { userGroup?: Maybe<{ __typename?: 'UserGroup', id: string, name: string, createdAt: string, members: Array<{ __typename?: 'UserGroupMember', id: string, addedAt: string, user: { __typename?: 'User', id: string, fullName?: Maybe<string>, email: string } }> }> };

export type OrganizationGroupUserQueryVariables = Exact<{ [key: string]: never; }>;


export type OrganizationGroupUserQuery = { me: { __typename?: 'User', id: string, role: OrganizationRole, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean } };

export type OrganizationGroups_UserGroupPaginationFragment = { __typename?: 'UserGroupPagination', totalCount: number, items: Array<{ __typename?: 'UserGroup', id: string, name: string, createdAt: string, members: Array<{ __typename?: 'UserGroupMember', user: { __typename?: 'User', id: string, fullName?: Maybe<string> } }> }> };

export type OrganizationGroups_UserGroupFragment = { __typename?: 'UserGroup', id: string, name: string, createdAt: string, members: Array<{ __typename?: 'UserGroupMember', user: { __typename?: 'User', id: string, fullName?: Maybe<string> } }> };

export type OrganizationGroups_UserFragment = { __typename?: 'User', id: string, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole };

export type OrganizationGroups_createUserGroupMutationVariables = Exact<{
  name: Scalars['String'];
  userIds: Array<Scalars['GID']> | Scalars['GID'];
}>;


export type OrganizationGroups_createUserGroupMutation = { createUserGroup: { __typename?: 'UserGroup', id: string, name: string, createdAt: string, members: Array<{ __typename?: 'UserGroupMember', user: { __typename?: 'User', id: string, fullName?: Maybe<string> } }> } };

export type OrganizationGroups_deleteUserGroupMutationVariables = Exact<{
  ids: Array<Scalars['GID']> | Scalars['GID'];
}>;


export type OrganizationGroups_deleteUserGroupMutation = { deleteUserGroup: Result };

export type OrganizationGroups_cloneUserGroupMutationVariables = Exact<{
  ids: Array<Scalars['GID']> | Scalars['GID'];
  locale: Scalars['String'];
}>;


export type OrganizationGroups_cloneUserGroupMutation = { cloneUserGroup: Array<{ __typename?: 'UserGroup', id: string, name: string, createdAt: string, members: Array<{ __typename?: 'UserGroupMember', user: { __typename?: 'User', id: string, fullName?: Maybe<string> } }> }> };

export type OrganizationGroupsQueryVariables = Exact<{
  offset: Scalars['Int'];
  limit: Scalars['Int'];
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<QueryUserGroups_OrderBy> | QueryUserGroups_OrderBy>;
}>;


export type OrganizationGroupsQuery = { userGroups: { __typename?: 'UserGroupPagination', totalCount: number, items: Array<{ __typename?: 'UserGroup', id: string, name: string, createdAt: string, members: Array<{ __typename?: 'UserGroupMember', user: { __typename?: 'User', id: string, fullName?: Maybe<string> } }> }> } };

export type OrganizationGroupsUserQueryVariables = Exact<{ [key: string]: never; }>;


export type OrganizationGroupsUserQuery = { me: { __typename?: 'User', id: string, role: OrganizationRole, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean } };

export type OrganizationSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type OrganizationSettingsQuery = { me: { __typename?: 'User', id: string, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole } };

export type OrganizationUsers_UserFragment = { __typename?: 'User', id: string, fullName?: Maybe<string>, firstName?: Maybe<string>, lastName?: Maybe<string>, email: string, role: OrganizationRole, createdAt: string, lastActiveAt?: Maybe<string>, status: UserStatus, isSsoUser: boolean };

export type OrganizationUsers_createOrganizationUserMutationVariables = Exact<{
  firstName: Scalars['String'];
  lastName: Scalars['String'];
  email: Scalars['String'];
  role: OrganizationRole;
}>;


export type OrganizationUsers_createOrganizationUserMutation = { createOrganizationUser: { __typename?: 'User', id: string, fullName?: Maybe<string>, firstName?: Maybe<string>, lastName?: Maybe<string>, email: string, role: OrganizationRole, createdAt: string, lastActiveAt?: Maybe<string>, status: UserStatus, isSsoUser: boolean } };

export type OrganizationUsers_updateOrganizationUserMutationVariables = Exact<{
  userId: Scalars['GID'];
  role: OrganizationRole;
}>;


export type OrganizationUsers_updateOrganizationUserMutation = { updateOrganizationUser: { __typename?: 'User', id: string, fullName?: Maybe<string>, firstName?: Maybe<string>, lastName?: Maybe<string>, email: string, role: OrganizationRole, createdAt: string, lastActiveAt?: Maybe<string>, status: UserStatus, isSsoUser: boolean } };

export type OrganizationUsers_updateUserStatusMutationVariables = Exact<{
  userIds: Array<Scalars['GID']> | Scalars['GID'];
  newStatus: UserStatus;
  transferToUserId?: Maybe<Scalars['GID']>;
}>;


export type OrganizationUsers_updateUserStatusMutation = { updateUserStatus: Array<{ __typename?: 'User', id: string, status: UserStatus }> };

export type OrganizationUsersQueryVariables = Exact<{
  offset: Scalars['Int'];
  limit: Scalars['Int'];
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<OrganizationUsers_OrderBy> | OrganizationUsers_OrderBy>;
}>;


export type PetitionActivity_PetitionFragment = {
  __typename?: "Petition";
  id: string;
  name?: Maybe<string>;
  status: PetitionStatus;
  emailSubject?: Maybe<string>;
  emailBody?: Maybe<any>;
  locale: PetitionLocale;
  deadline?: Maybe<string>;
  updatedAt: string;
  isReadOnly: boolean;
  accesses: Array<{
    __typename?: "PetitionAccess";
    id: string;
    status: PetitionAccessStatus;
    nextReminderAt?: Maybe<string>;
    remindersLeft: number;
    reminderCount: number;
    remindersActive: boolean;
    remindersOptOut: boolean;
    createdAt: string;
    contact?: Maybe<{
      __typename?: "Contact";
      id: string;
      fullName?: Maybe<string>;
      email: string;
    }>;
    remindersConfig?: Maybe<{
      __typename?: "RemindersConfig";
      offset: number;
      time: string;
      timezone: string;
      weekdaysOnly: boolean;
    }>;
  }>;
  events: {
    __typename?: "PetitionEventPagination";
    items: Array<
      | {
          __typename?: "AccessActivatedEvent";
          id: string;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
          access: {
            __typename?: "PetitionAccess";
            contact?: Maybe<{
              __typename?: "Contact";
              id: string;
              fullName?: Maybe<string>;
              email: string;
            }>;
          };
        }
      | {
          __typename?: "AccessActivatedFromPublicPetitionLinkEvent";
          id: string;
          createdAt: string;
          access: {
            __typename?: "PetitionAccess";
            contact?: Maybe<{
              __typename?: "Contact";
              id: string;
              fullName?: Maybe<string>;
              email: string;
            }>;
          };
        }
      | {
          __typename?: "AccessDeactivatedEvent";
          id: string;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
          access: {
            __typename?: "PetitionAccess";
            contact?: Maybe<{
              __typename?: "Contact";
              id: string;
              fullName?: Maybe<string>;
              email: string;
            }>;
          };
        }
      | {
          __typename?: "AccessDelegatedEvent";
          id: string;
          createdAt: string;
          originalAccess: {
            __typename?: "PetitionAccess";
            contact?: Maybe<{
              __typename?: "Contact";
              id: string;
              fullName?: Maybe<string>;
              email: string;
            }>;
          };
          newAccess: {
            __typename?: "PetitionAccess";
            contact?: Maybe<{
              __typename?: "Contact";
              id: string;
              fullName?: Maybe<string>;
              email: string;
            }>;
          };
        }
      | {
          __typename?: "AccessOpenedEvent";
          id: string;
          createdAt: string;
          access: {
            __typename?: "PetitionAccess";
            contact?: Maybe<{
              __typename?: "Contact";
              id: string;
              fullName?: Maybe<string>;
              email: string;
            }>;
          };
        }
      | {
          __typename?: "CommentDeletedEvent";
          id: string;
          createdAt: string;
          field?: Maybe<{ __typename?: "PetitionField"; title?: Maybe<string> }>;
          deletedBy?: Maybe<
            | {
                __typename?: "PetitionAccess";
                contact?: Maybe<{
                  __typename?: "Contact";
                  id: string;
                  fullName?: Maybe<string>;
                  email: string;
                }>;
              }
            | { __typename?: "User"; id: string; fullName?: Maybe<string>; status: UserStatus }
          >;
        }
      | {
          __typename?: "CommentPublishedEvent";
          id: string;
          createdAt: string;
          field?: Maybe<{ __typename?: "PetitionField"; title?: Maybe<string> }>;
          comment?: Maybe<{
            __typename?: "PetitionFieldComment";
            isEdited: boolean;
            content: string;
            author?: Maybe<
              | {
                  __typename?: "PetitionAccess";
                  contact?: Maybe<{
                    __typename?: "Contact";
                    id: string;
                    fullName?: Maybe<string>;
                    email: string;
                  }>;
                }
              | { __typename?: "User"; id: string; fullName?: Maybe<string>; status: UserStatus }
            >;
          }>;
        }
      | {
          __typename?: "GroupPermissionAddedEvent";
          id: string;
          permissionType: PetitionPermissionType;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
          permissionGroup: { __typename?: "UserGroup"; name: string };
        }
      | {
          __typename?: "GroupPermissionEditedEvent";
          id: string;
          permissionType: PetitionPermissionType;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
          permissionGroup: { __typename?: "UserGroup"; name: string };
        }
      | {
          __typename?: "GroupPermissionRemovedEvent";
          id: string;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
          permissionGroup: { __typename?: "UserGroup"; name: string };
        }
      | {
          __typename?: "MessageCancelledEvent";
          id: string;
          createdAt: string;
          message: {
            __typename?: "PetitionMessage";
            status: PetitionMessageStatus;
            scheduledAt?: Maybe<string>;
            emailSubject?: Maybe<any>;
            access: {
              __typename?: "PetitionAccess";
              contact?: Maybe<{
                __typename?: "Contact";
                id: string;
                fullName?: Maybe<string>;
                email: string;
              }>;
            };
          };
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
        }
      | {
          __typename?: "MessageScheduledEvent";
          id: string;
          createdAt: string;
          message: {
            __typename?: "PetitionMessage";
            id: string;
            status: PetitionMessageStatus;
            scheduledAt?: Maybe<string>;
            emailSubject?: Maybe<any>;
            emailBody?: Maybe<string>;
            sentAt?: Maybe<string>;
            sender: {
              __typename?: "User";
              id: string;
              fullName?: Maybe<string>;
              status: UserStatus;
            };
            access: {
              __typename?: "PetitionAccess";
              contact?: Maybe<{
                __typename?: "Contact";
                id: string;
                fullName?: Maybe<string>;
                email: string;
              }>;
            };
          };
        }
      | {
          __typename?: "MessageSentEvent";
          id: string;
          createdAt: string;
          message: {
            __typename?: "PetitionMessage";
            emailSubject?: Maybe<any>;
            scheduledAt?: Maybe<string>;
            bouncedAt?: Maybe<string>;
            deliveredAt?: Maybe<string>;
            openedAt?: Maybe<string>;
            emailBody?: Maybe<string>;
            sentAt?: Maybe<string>;
            sender: {
              __typename?: "User";
              id: string;
              fullName?: Maybe<string>;
              status: UserStatus;
            };
            access: {
              __typename?: "PetitionAccess";
              contact?: Maybe<{
                __typename?: "Contact";
                id: string;
                fullName?: Maybe<string>;
                email: string;
              }>;
            };
          };
        }
      | {
          __typename?: "OwnershipTransferredEvent";
          id: string;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
          owner?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
          previousOwner?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
        }
      | {
          __typename?: "PetitionClonedEvent";
          id: string;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
        }
      | {
          __typename?: "PetitionClosedEvent";
          id: string;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
        }
      | {
          __typename?: "PetitionClosedNotifiedEvent";
          id: string;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
          access: {
            __typename?: "PetitionAccess";
            contact?: Maybe<{
              __typename?: "Contact";
              id: string;
              fullName?: Maybe<string>;
              email: string;
            }>;
          };
        }
      | {
          __typename?: "PetitionCompletedEvent";
          id: string;
          createdAt: string;
          access: {
            __typename?: "PetitionAccess";
            contact?: Maybe<{
              __typename?: "Contact";
              id: string;
              fullName?: Maybe<string>;
              email: string;
            }>;
          };
        }
      | {
          __typename?: "PetitionCreatedEvent";
          id: string;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
        }
      | { __typename?: "PetitionDeletedEvent"; id: string }
      | {
          __typename?: "PetitionReopenedEvent";
          id: string;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
        }
      | {
          __typename?: "ReminderSentEvent";
          id: string;
          createdAt: string;
          reminder: {
            __typename?: "PetitionReminder";
            type: PetitionReminderType;
            createdAt: string;
            emailBody?: Maybe<string>;
            sender?: Maybe<{
              __typename?: "User";
              id: string;
              fullName?: Maybe<string>;
              status: UserStatus;
            }>;
            access: {
              __typename?: "PetitionAccess";
              contact?: Maybe<{
                __typename?: "Contact";
                id: string;
                fullName?: Maybe<string>;
                email: string;
              }>;
            };
          };
        }
      | {
          __typename?: "RemindersOptOutEvent";
          id: string;
          createdAt: string;
          reason: string;
          other?: Maybe<string>;
          access: {
            __typename?: "PetitionAccess";
            contact?: Maybe<{
              __typename?: "Contact";
              id: string;
              fullName?: Maybe<string>;
              email: string;
            }>;
          };
        }
      | {
          __typename?: "ReplyCreatedEvent";
          id: string;
          createdAt: string;
          field?: Maybe<{ __typename?: "PetitionField"; title?: Maybe<string> }>;
          createdBy?: Maybe<
            | {
                __typename?: "PetitionAccess";
                contact?: Maybe<{
                  __typename?: "Contact";
                  id: string;
                  fullName?: Maybe<string>;
                  email: string;
                }>;
              }
            | { __typename?: "User"; id: string; fullName?: Maybe<string>; status: UserStatus }
          >;
        }
      | {
          __typename?: "ReplyDeletedEvent";
          id: string;
          createdAt: string;
          field?: Maybe<{ __typename?: "PetitionField"; title?: Maybe<string> }>;
          deletedBy?: Maybe<
            | {
                __typename?: "PetitionAccess";
                contact?: Maybe<{
                  __typename?: "Contact";
                  id: string;
                  fullName?: Maybe<string>;
                  email: string;
                }>;
              }
            | { __typename?: "User"; id: string; fullName?: Maybe<string>; status: UserStatus }
          >;
        }
      | {
          __typename?: "ReplyUpdatedEvent";
          id: string;
          createdAt: string;
          field?: Maybe<{ __typename?: "PetitionField"; title?: Maybe<string> }>;
          updatedBy?: Maybe<
            | {
                __typename?: "PetitionAccess";
                contact?: Maybe<{
                  __typename?: "Contact";
                  id: string;
                  fullName?: Maybe<string>;
                  email: string;
                }>;
              }
            | { __typename?: "User"; id: string; fullName?: Maybe<string>; status: UserStatus }
          >;
        }
      | {
          __typename?: "SignatureCancelledEvent";
          id: string;
          cancelType: PetitionSignatureCancelReason;
          cancellerReason?: Maybe<string>;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
          contact?: Maybe<{
            __typename?: "Contact";
            id: string;
            fullName?: Maybe<string>;
            email: string;
          }>;
        }
      | { __typename?: "SignatureCompletedEvent"; id: string; createdAt: string }
      | { __typename?: "SignatureStartedEvent"; id: string; createdAt: string }
      | { __typename?: "TemplateUsedEvent"; id: string }
      | {
          __typename?: "UserPermissionAddedEvent";
          id: string;
          permissionType: PetitionPermissionType;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
          permissionUser?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
        }
      | {
          __typename?: "UserPermissionEditedEvent";
          id: string;
          permissionType: PetitionPermissionType;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
          permissionUser?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
        }
      | {
          __typename?: "UserPermissionRemovedEvent";
          id: string;
          createdAt: string;
          user?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
          permissionUser?: Maybe<{
            __typename?: "User";
            id: string;
            fullName?: Maybe<string>;
            status: UserStatus;
          }>;
        }
    >;
  };
  permissions: Array<
    | {
        __typename?: "PetitionUserGroupPermission";
        permissionType: PetitionPermissionType;
        group: { __typename?: "UserGroup"; id: string; name: string };
      }
    | {
        __typename?: "PetitionUserPermission";
        permissionType: PetitionPermissionType;
        user: { __typename?: "User"; id: string; fullName?: Maybe<string> };
      }
  >;
  signatureConfig?: Maybe<{
    __typename?: "SignatureConfig";
    contacts: Array<
      Maybe<{ __typename?: "Contact"; id: string; fullName?: Maybe<string>; email: string }>
    >;
  }>;
  remindersConfig?: Maybe<{
    __typename?: "RemindersConfig";
    offset: number;
    time: string;
    timezone: string;
    weekdaysOnly: boolean;
  }>;
  myEffectivePermission?: Maybe<{
    __typename?: "EffectivePetitionUserPermission";
    isSubscribed: boolean;
  }>;
};

export type PetitionActivity_PetitionFragment = { __typename?: 'Petition', id: string, name?: Maybe<string>, status: PetitionStatus, emailSubject?: Maybe<string>, emailBody?: Maybe<any>, locale: PetitionLocale, deadline?: Maybe<string>, updatedAt: string, isReadOnly: boolean, accesses: Array<{ __typename?: 'PetitionAccess', id: string, status: PetitionAccessStatus, nextReminderAt?: Maybe<string>, remindersLeft: number, reminderCount: number, remindersActive: boolean, remindersOptOut: boolean, createdAt: string, contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }>, remindersConfig?: Maybe<{ __typename?: 'RemindersConfig', offset: number, time: string, timezone: string, weekdaysOnly: boolean }> }>, events: { __typename?: 'PetitionEventPagination', items: Array<{ __typename?: 'AccessActivatedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } | { __typename?: 'AccessDeactivatedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } | { __typename?: 'AccessDelegatedEvent', id: string, createdAt: string, originalAccess: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> }, newAccess: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } | { __typename?: 'AccessOpenedEvent', id: string, createdAt: string, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } | { __typename?: 'CommentDeletedEvent', id: string, createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, deletedBy?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'CommentPublishedEvent', id: string, createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, comment?: Maybe<{ __typename?: 'PetitionFieldComment', isEdited: boolean, content: string, author?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> }> } | { __typename?: 'GroupPermissionAddedEvent', id: string, permissionType: PetitionPermissionType, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionGroup: { __typename?: 'UserGroup', name: string } } | { __typename?: 'GroupPermissionEditedEvent', id: string, permissionType: PetitionPermissionType, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionGroup: { __typename?: 'UserGroup', name: string } } | { __typename?: 'GroupPermissionRemovedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionGroup: { __typename?: 'UserGroup', name: string } } | { __typename?: 'MessageCancelledEvent', id: string, createdAt: string, message: { __typename?: 'PetitionMessage', status: PetitionMessageStatus, scheduledAt?: Maybe<string>, emailSubject?: Maybe<any>, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } }, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'MessageScheduledEvent', id: string, createdAt: string, message: { __typename?: 'PetitionMessage', id: string, status: PetitionMessageStatus, scheduledAt?: Maybe<string>, emailSubject?: Maybe<any>, emailBody?: Maybe<string>, sentAt?: Maybe<string>, sender: { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } } | { __typename?: 'MessageSentEvent', id: string, createdAt: string, message: { __typename?: 'PetitionMessage', emailSubject?: Maybe<any>, scheduledAt?: Maybe<string>, bouncedAt?: Maybe<string>, deliveredAt?: Maybe<string>, openedAt?: Maybe<string>, emailBody?: Maybe<string>, sentAt?: Maybe<string>, sender: { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } } | { __typename?: 'OwnershipTransferredEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, owner?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, previousOwner?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'PetitionClonedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'PetitionClosedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'PetitionClosedNotifiedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } | { __typename?: 'PetitionCompletedEvent', id: string, createdAt: string, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } | { __typename?: 'PetitionCreatedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'PetitionDeletedEvent', id: string } | { __typename?: 'PetitionReopenedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'ReminderSentEvent', id: string, createdAt: string, reminder: { __typename?: 'PetitionReminder', type: PetitionReminderType, createdAt: string, emailBody?: Maybe<string>, sender?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } } | { __typename?: 'RemindersOptOutEvent', id: string, createdAt: string, reason: string, other: string, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } | { __typename?: 'ReplyCreatedEvent', id: string, createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, createdBy?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'ReplyDeletedEvent', id: string, createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, deletedBy?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'ReplyUpdatedEvent', id: string, createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, updatedBy?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'SignatureCancelledEvent', id: string, cancelType: PetitionSignatureCancelReason, cancellerReason?: Maybe<string>, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'SignatureCompletedEvent', id: string, createdAt: string } | { __typename?: 'SignatureStartedEvent', id: string, createdAt: string } | { __typename?: 'TemplateUsedEvent', id: string } | { __typename?: 'UserPermissionAddedEvent', id: string, permissionType: PetitionPermissionType, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionUser?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'UserPermissionEditedEvent', id: string, permissionType: PetitionPermissionType, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionUser?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'UserPermissionRemovedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionUser?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> }> }, permissions: Array<{ __typename?: 'PetitionUserGroupPermission', permissionType: PetitionPermissionType, group: { __typename?: 'UserGroup', id: string, name: string } } | { __typename?: 'PetitionUserPermission', permissionType: PetitionPermissionType, user: { __typename?: 'User', id: string, fullName?: Maybe<string> } }>, signatureConfig?: Maybe<{ __typename?: 'SignatureConfig', contacts: Array<Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }>> }>, remindersConfig?: Maybe<{ __typename?: 'RemindersConfig', offset: number, time: string, timezone: string, weekdaysOnly: boolean }>, myEffectivePermission?: Maybe<{ __typename?: 'EffectivePetitionUserPermission', isSubscribed: boolean }> };

export type PetitionActivity_UserFragment = { __typename?: 'User', id: string, unreadNotificationIds: Array<string>, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole, hasPetitionPdfExport: boolean };

export type PetitionActivity_updatePetitionMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  data: UpdatePetitionInput;
}>;

export type PetitionActivity_updatePetitionMutation = {
  updatePetition:
    | {
        __typename?: "Petition";
        id: string;
        name?: Maybe<string>;
        status: PetitionStatus;
        emailSubject?: Maybe<string>;
        emailBody?: Maybe<any>;
        locale: PetitionLocale;
        deadline?: Maybe<string>;
        updatedAt: string;
        isReadOnly: boolean;
        accesses: Array<{
          __typename?: "PetitionAccess";
          id: string;
          status: PetitionAccessStatus;
          nextReminderAt?: Maybe<string>;
          remindersLeft: number;
          reminderCount: number;
          remindersActive: boolean;
          remindersOptOut: boolean;
          createdAt: string;
          contact?: Maybe<{
            __typename?: "Contact";
            id: string;
            fullName?: Maybe<string>;
            email: string;
          }>;
          remindersConfig?: Maybe<{
            __typename?: "RemindersConfig";
            offset: number;
            time: string;
            timezone: string;
            weekdaysOnly: boolean;
          }>;
        }>;
        events: {
          __typename?: "PetitionEventPagination";
          items: Array<
            | {
                __typename?: "AccessActivatedEvent";
                id: string;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
                access: {
                  __typename?: "PetitionAccess";
                  contact?: Maybe<{
                    __typename?: "Contact";
                    id: string;
                    fullName?: Maybe<string>;
                    email: string;
                  }>;
                };
              }
            | {
                __typename?: "AccessActivatedFromPublicPetitionLinkEvent";
                id: string;
                createdAt: string;
                access: {
                  __typename?: "PetitionAccess";
                  contact?: Maybe<{
                    __typename?: "Contact";
                    id: string;
                    fullName?: Maybe<string>;
                    email: string;
                  }>;
                };
              }
            | {
                __typename?: "AccessDeactivatedEvent";
                id: string;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
                access: {
                  __typename?: "PetitionAccess";
                  contact?: Maybe<{
                    __typename?: "Contact";
                    id: string;
                    fullName?: Maybe<string>;
                    email: string;
                  }>;
                };
              }
            | {
                __typename?: "AccessDelegatedEvent";
                id: string;
                createdAt: string;
                originalAccess: {
                  __typename?: "PetitionAccess";
                  contact?: Maybe<{
                    __typename?: "Contact";
                    id: string;
                    fullName?: Maybe<string>;
                    email: string;
                  }>;
                };
                newAccess: {
                  __typename?: "PetitionAccess";
                  contact?: Maybe<{
                    __typename?: "Contact";
                    id: string;
                    fullName?: Maybe<string>;
                    email: string;
                  }>;
                };
              }
            | {
                __typename?: "AccessOpenedEvent";
                id: string;
                createdAt: string;
                access: {
                  __typename?: "PetitionAccess";
                  contact?: Maybe<{
                    __typename?: "Contact";
                    id: string;
                    fullName?: Maybe<string>;
                    email: string;
                  }>;
                };
              }
            | {
                __typename?: "CommentDeletedEvent";
                id: string;
                createdAt: string;
                field?: Maybe<{ __typename?: "PetitionField"; title?: Maybe<string> }>;
                deletedBy?: Maybe<
                  | {
                      __typename?: "PetitionAccess";
                      contact?: Maybe<{
                        __typename?: "Contact";
                        id: string;
                        fullName?: Maybe<string>;
                        email: string;
                      }>;
                    }
                  | {
                      __typename?: "User";
                      id: string;
                      fullName?: Maybe<string>;
                      status: UserStatus;
                    }
                >;
              }
            | {
                __typename?: "CommentPublishedEvent";
                id: string;
                createdAt: string;
                field?: Maybe<{ __typename?: "PetitionField"; title?: Maybe<string> }>;
                comment?: Maybe<{
                  __typename?: "PetitionFieldComment";
                  isEdited: boolean;
                  content: string;
                  author?: Maybe<
                    | {
                        __typename?: "PetitionAccess";
                        contact?: Maybe<{
                          __typename?: "Contact";
                          id: string;
                          fullName?: Maybe<string>;
                          email: string;
                        }>;
                      }
                    | {
                        __typename?: "User";
                        id: string;
                        fullName?: Maybe<string>;
                        status: UserStatus;
                      }
                  >;
                }>;
              }
            | {
                __typename?: "GroupPermissionAddedEvent";
                id: string;
                permissionType: PetitionPermissionType;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
                permissionGroup: { __typename?: "UserGroup"; name: string };
              }
            | {
                __typename?: "GroupPermissionEditedEvent";
                id: string;
                permissionType: PetitionPermissionType;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
                permissionGroup: { __typename?: "UserGroup"; name: string };
              }
            | {
                __typename?: "GroupPermissionRemovedEvent";
                id: string;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
                permissionGroup: { __typename?: "UserGroup"; name: string };
              }
            | {
                __typename?: "MessageCancelledEvent";
                id: string;
                createdAt: string;
                message: {
                  __typename?: "PetitionMessage";
                  status: PetitionMessageStatus;
                  scheduledAt?: Maybe<string>;
                  emailSubject?: Maybe<any>;
                  access: {
                    __typename?: "PetitionAccess";
                    contact?: Maybe<{
                      __typename?: "Contact";
                      id: string;
                      fullName?: Maybe<string>;
                      email: string;
                    }>;
                  };
                };
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
              }
            | {
                __typename?: "MessageScheduledEvent";
                id: string;
                createdAt: string;
                message: {
                  __typename?: "PetitionMessage";
                  id: string;
                  status: PetitionMessageStatus;
                  scheduledAt?: Maybe<string>;
                  emailSubject?: Maybe<any>;
                  emailBody?: Maybe<string>;
                  sentAt?: Maybe<string>;
                  sender: {
                    __typename?: "User";
                    id: string;
                    fullName?: Maybe<string>;
                    status: UserStatus;
                  };
                  access: {
                    __typename?: "PetitionAccess";
                    contact?: Maybe<{
                      __typename?: "Contact";
                      id: string;
                      fullName?: Maybe<string>;
                      email: string;
                    }>;
                  };
                };
              }
            | {
                __typename?: "MessageSentEvent";
                id: string;
                createdAt: string;
                message: {
                  __typename?: "PetitionMessage";
                  emailSubject?: Maybe<any>;
                  scheduledAt?: Maybe<string>;
                  bouncedAt?: Maybe<string>;
                  deliveredAt?: Maybe<string>;
                  openedAt?: Maybe<string>;
                  emailBody?: Maybe<string>;
                  sentAt?: Maybe<string>;
                  sender: {
                    __typename?: "User";
                    id: string;
                    fullName?: Maybe<string>;
                    status: UserStatus;
                  };
                  access: {
                    __typename?: "PetitionAccess";
                    contact?: Maybe<{
                      __typename?: "Contact";
                      id: string;
                      fullName?: Maybe<string>;
                      email: string;
                    }>;
                  };
                };
              }
            | {
                __typename?: "OwnershipTransferredEvent";
                id: string;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
                owner?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
                previousOwner?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
              }
            | {
                __typename?: "PetitionClonedEvent";
                id: string;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
              }
            | {
                __typename?: "PetitionClosedEvent";
                id: string;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
              }
            | {
                __typename?: "PetitionClosedNotifiedEvent";
                id: string;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
                access: {
                  __typename?: "PetitionAccess";
                  contact?: Maybe<{
                    __typename?: "Contact";
                    id: string;
                    fullName?: Maybe<string>;
                    email: string;
                  }>;
                };
              }
            | {
                __typename?: "PetitionCompletedEvent";
                id: string;
                createdAt: string;
                access: {
                  __typename?: "PetitionAccess";
                  contact?: Maybe<{
                    __typename?: "Contact";
                    id: string;
                    fullName?: Maybe<string>;
                    email: string;
                  }>;
                };
              }
            | {
                __typename?: "PetitionCreatedEvent";
                id: string;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
              }
            | { __typename?: "PetitionDeletedEvent"; id: string }
            | {
                __typename?: "PetitionReopenedEvent";
                id: string;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
              }
            | {
                __typename?: "ReminderSentEvent";
                id: string;
                createdAt: string;
                reminder: {
                  __typename?: "PetitionReminder";
                  type: PetitionReminderType;
                  createdAt: string;
                  emailBody?: Maybe<string>;
                  sender?: Maybe<{
                    __typename?: "User";
                    id: string;
                    fullName?: Maybe<string>;
                    status: UserStatus;
                  }>;
                  access: {
                    __typename?: "PetitionAccess";
                    contact?: Maybe<{
                      __typename?: "Contact";
                      id: string;
                      fullName?: Maybe<string>;
                      email: string;
                    }>;
                  };
                };
              }
            | {
                __typename?: "RemindersOptOutEvent";
                id: string;
                createdAt: string;
                reason: string;
                other?: Maybe<string>;
                access: {
                  __typename?: "PetitionAccess";
                  contact?: Maybe<{
                    __typename?: "Contact";
                    id: string;
                    fullName?: Maybe<string>;
                    email: string;
                  }>;
                };
              }
            | {
                __typename?: "ReplyCreatedEvent";
                id: string;
                createdAt: string;
                field?: Maybe<{ __typename?: "PetitionField"; title?: Maybe<string> }>;
                createdBy?: Maybe<
                  | {
                      __typename?: "PetitionAccess";
                      contact?: Maybe<{
                        __typename?: "Contact";
                        id: string;
                        fullName?: Maybe<string>;
                        email: string;
                      }>;
                    }
                  | {
                      __typename?: "User";
                      id: string;
                      fullName?: Maybe<string>;
                      status: UserStatus;
                    }
                >;
              }
            | {
                __typename?: "ReplyDeletedEvent";
                id: string;
                createdAt: string;
                field?: Maybe<{ __typename?: "PetitionField"; title?: Maybe<string> }>;
                deletedBy?: Maybe<
                  | {
                      __typename?: "PetitionAccess";
                      contact?: Maybe<{
                        __typename?: "Contact";
                        id: string;
                        fullName?: Maybe<string>;
                        email: string;
                      }>;
                    }
                  | {
                      __typename?: "User";
                      id: string;
                      fullName?: Maybe<string>;
                      status: UserStatus;
                    }
                >;
              }
            | {
                __typename?: "ReplyUpdatedEvent";
                id: string;
                createdAt: string;
                field?: Maybe<{ __typename?: "PetitionField"; title?: Maybe<string> }>;
                updatedBy?: Maybe<
                  | {
                      __typename?: "PetitionAccess";
                      contact?: Maybe<{
                        __typename?: "Contact";
                        id: string;
                        fullName?: Maybe<string>;
                        email: string;
                      }>;
                    }
                  | {
                      __typename?: "User";
                      id: string;
                      fullName?: Maybe<string>;
                      status: UserStatus;
                    }
                >;
              }
            | {
                __typename?: "SignatureCancelledEvent";
                id: string;
                cancelType: PetitionSignatureCancelReason;
                cancellerReason?: Maybe<string>;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
                contact?: Maybe<{
                  __typename?: "Contact";
                  id: string;
                  fullName?: Maybe<string>;
                  email: string;
                }>;
              }
            | { __typename?: "SignatureCompletedEvent"; id: string; createdAt: string }
            | { __typename?: "SignatureStartedEvent"; id: string; createdAt: string }
            | { __typename?: "TemplateUsedEvent"; id: string }
            | {
                __typename?: "UserPermissionAddedEvent";
                id: string;
                permissionType: PetitionPermissionType;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
                permissionUser?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
              }
            | {
                __typename?: "UserPermissionEditedEvent";
                id: string;
                permissionType: PetitionPermissionType;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
                permissionUser?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
              }
            | {
                __typename?: "UserPermissionRemovedEvent";
                id: string;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
                permissionUser?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
              }
          >;
        };
        permissions: Array<
          | {
              __typename?: "PetitionUserGroupPermission";
              permissionType: PetitionPermissionType;
              group: { __typename?: "UserGroup"; id: string; name: string };
            }
          | {
              __typename?: "PetitionUserPermission";
              permissionType: PetitionPermissionType;
              user: { __typename?: "User"; id: string; fullName?: Maybe<string> };
            }
        >;
        signatureConfig?: Maybe<{
          __typename?: "SignatureConfig";
          contacts: Array<
            Maybe<{ __typename?: "Contact"; id: string; fullName?: Maybe<string>; email: string }>
          >;
        }>;
        remindersConfig?: Maybe<{
          __typename?: "RemindersConfig";
          offset: number;
          time: string;
          timezone: string;
          weekdaysOnly: boolean;
        }>;
        myEffectivePermission?: Maybe<{
          __typename?: "EffectivePetitionUserPermission";
          isSubscribed: boolean;
        }>;
      }
    | { __typename?: "PetitionTemplate" };
};

export type PetitionActivity_updatePetitionMutation = { updatePetition: { __typename?: 'Petition', id: string, name?: Maybe<string>, status: PetitionStatus, emailSubject?: Maybe<string>, emailBody?: Maybe<any>, locale: PetitionLocale, deadline?: Maybe<string>, updatedAt: string, isReadOnly: boolean, accesses: Array<{ __typename?: 'PetitionAccess', id: string, status: PetitionAccessStatus, nextReminderAt?: Maybe<string>, remindersLeft: number, reminderCount: number, remindersActive: boolean, remindersOptOut: boolean, createdAt: string, contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }>, remindersConfig?: Maybe<{ __typename?: 'RemindersConfig', offset: number, time: string, timezone: string, weekdaysOnly: boolean }> }>, events: { __typename?: 'PetitionEventPagination', items: Array<{ __typename?: 'AccessActivatedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } | { __typename?: 'AccessDeactivatedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } | { __typename?: 'AccessDelegatedEvent', id: string, createdAt: string, originalAccess: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> }, newAccess: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } | { __typename?: 'AccessOpenedEvent', id: string, createdAt: string, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } | { __typename?: 'CommentDeletedEvent', id: string, createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, deletedBy?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'CommentPublishedEvent', id: string, createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, comment?: Maybe<{ __typename?: 'PetitionFieldComment', isEdited: boolean, content: string, author?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> }> } | { __typename?: 'GroupPermissionAddedEvent', id: string, permissionType: PetitionPermissionType, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionGroup: { __typename?: 'UserGroup', name: string } } | { __typename?: 'GroupPermissionEditedEvent', id: string, permissionType: PetitionPermissionType, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionGroup: { __typename?: 'UserGroup', name: string } } | { __typename?: 'GroupPermissionRemovedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionGroup: { __typename?: 'UserGroup', name: string } } | { __typename?: 'MessageCancelledEvent', id: string, createdAt: string, message: { __typename?: 'PetitionMessage', status: PetitionMessageStatus, scheduledAt?: Maybe<string>, emailSubject?: Maybe<any>, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } }, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'MessageScheduledEvent', id: string, createdAt: string, message: { __typename?: 'PetitionMessage', id: string, status: PetitionMessageStatus, scheduledAt?: Maybe<string>, emailSubject?: Maybe<any>, emailBody?: Maybe<string>, sentAt?: Maybe<string>, sender: { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } } | { __typename?: 'MessageSentEvent', id: string, createdAt: string, message: { __typename?: 'PetitionMessage', emailSubject?: Maybe<any>, scheduledAt?: Maybe<string>, bouncedAt?: Maybe<string>, deliveredAt?: Maybe<string>, openedAt?: Maybe<string>, emailBody?: Maybe<string>, sentAt?: Maybe<string>, sender: { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } } | { __typename?: 'OwnershipTransferredEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, owner?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, previousOwner?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'PetitionClonedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'PetitionClosedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'PetitionClosedNotifiedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } | { __typename?: 'PetitionCompletedEvent', id: string, createdAt: string, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } | { __typename?: 'PetitionCreatedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'PetitionDeletedEvent', id: string } | { __typename?: 'PetitionReopenedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'ReminderSentEvent', id: string, createdAt: string, reminder: { __typename?: 'PetitionReminder', type: PetitionReminderType, createdAt: string, emailBody?: Maybe<string>, sender?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } } | { __typename?: 'RemindersOptOutEvent', id: string, createdAt: string, reason: string, other: string, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } | { __typename?: 'ReplyCreatedEvent', id: string, createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, createdBy?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'ReplyDeletedEvent', id: string, createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, deletedBy?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'ReplyUpdatedEvent', id: string, createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, updatedBy?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'SignatureCancelledEvent', id: string, cancelType: PetitionSignatureCancelReason, cancellerReason?: Maybe<string>, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'SignatureCompletedEvent', id: string, createdAt: string } | { __typename?: 'SignatureStartedEvent', id: string, createdAt: string } | { __typename?: 'TemplateUsedEvent', id: string } | { __typename?: 'UserPermissionAddedEvent', id: string, permissionType: PetitionPermissionType, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionUser?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'UserPermissionEditedEvent', id: string, permissionType: PetitionPermissionType, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionUser?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'UserPermissionRemovedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionUser?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> }> }, permissions: Array<{ __typename?: 'PetitionUserGroupPermission', permissionType: PetitionPermissionType, group: { __typename?: 'UserGroup', id: string, name: string } } | { __typename?: 'PetitionUserPermission', permissionType: PetitionPermissionType, user: { __typename?: 'User', id: string, fullName?: Maybe<string> } }>, signatureConfig?: Maybe<{ __typename?: 'SignatureConfig', contacts: Array<Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }>> }>, remindersConfig?: Maybe<{ __typename?: 'RemindersConfig', offset: number, time: string, timezone: string, weekdaysOnly: boolean }>, myEffectivePermission?: Maybe<{ __typename?: 'EffectivePetitionUserPermission', isSubscribed: boolean }> } | { __typename?: 'PetitionTemplate' } };

export type PetitionActivity_sendRemindersMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  accessIds: Array<Scalars['GID']> | Scalars['GID'];
  body?: Maybe<Scalars['JSON']>;
}>;


export type PetitionActivity_sendRemindersMutation = { sendReminders: Result };

export type PetitionActivity_deactivateAccessesMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  accessIds: Array<Scalars['GID']> | Scalars['GID'];
}>;


export type PetitionActivity_deactivateAccessesMutation = { deactivateAccesses: Array<{ __typename?: 'PetitionAccess', id: string, status: PetitionAccessStatus }> };

export type PetitionActivity_reactivateAccessesMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  accessIds: Array<Scalars['GID']> | Scalars['GID'];
}>;


export type PetitionActivity_reactivateAccessesMutation = { reactivateAccesses: Array<{ __typename?: 'PetitionAccess', id: string, status: PetitionAccessStatus }> };

export type PetitionActivity_cancelScheduledMessageMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  messageId: Scalars['GID'];
}>;


export type PetitionActivity_cancelScheduledMessageMutation = { cancelScheduledMessage?: Maybe<{ __typename?: 'PetitionMessage', id: string, status: PetitionMessageStatus }> };

export type PetitionsActivity_sendPetitionMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  contactIds: Array<Scalars['GID']> | Scalars['GID'];
  subject: Scalars['String'];
  body: Scalars['JSON'];
  remindersConfig?: Maybe<RemindersConfigInput>;
  scheduledAt?: Maybe<Scalars['DateTime']>;
}>;


export type PetitionsActivity_sendPetitionMutation = { sendPetition: { __typename?: 'SendPetitionResult', result: Result } };

export type PetitionActivity_switchAutomaticRemindersMutationVariables = Exact<{
  start: Scalars['Boolean'];
  petitionId: Scalars['GID'];
  accessIds: Array<Scalars['GID']> | Scalars['GID'];
  remindersConfig?: Maybe<RemindersConfigInput>;
}>;


export type PetitionActivity_switchAutomaticRemindersMutation = { switchAutomaticReminders: Array<{ __typename?: 'PetitionAccess', id: string }> };

export type PetitionActivityQueryVariables = Exact<{
  id: Scalars['GID'];
}>;

export type PetitionActivityQuery = {
  petition?: Maybe<
    | {
        __typename?: "Petition";
        id: string;
        name?: Maybe<string>;
        status: PetitionStatus;
        emailSubject?: Maybe<string>;
        emailBody?: Maybe<any>;
        locale: PetitionLocale;
        deadline?: Maybe<string>;
        updatedAt: string;
        isReadOnly: boolean;
        accesses: Array<{
          __typename?: "PetitionAccess";
          id: string;
          status: PetitionAccessStatus;
          nextReminderAt?: Maybe<string>;
          remindersLeft: number;
          reminderCount: number;
          remindersActive: boolean;
          remindersOptOut: boolean;
          createdAt: string;
          contact?: Maybe<{
            __typename?: "Contact";
            id: string;
            fullName?: Maybe<string>;
            email: string;
          }>;
          remindersConfig?: Maybe<{
            __typename?: "RemindersConfig";
            offset: number;
            time: string;
            timezone: string;
            weekdaysOnly: boolean;
          }>;
        }>;
        events: {
          __typename?: "PetitionEventPagination";
          items: Array<
            | {
                __typename?: "AccessActivatedEvent";
                id: string;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
                access: {
                  __typename?: "PetitionAccess";
                  contact?: Maybe<{
                    __typename?: "Contact";
                    id: string;
                    fullName?: Maybe<string>;
                    email: string;
                  }>;
                };
              }
            | {
                __typename?: "AccessActivatedFromPublicPetitionLinkEvent";
                id: string;
                createdAt: string;
                access: {
                  __typename?: "PetitionAccess";
                  contact?: Maybe<{
                    __typename?: "Contact";
                    id: string;
                    fullName?: Maybe<string>;
                    email: string;
                  }>;
                };
              }
            | {
                __typename?: "AccessDeactivatedEvent";
                id: string;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
                access: {
                  __typename?: "PetitionAccess";
                  contact?: Maybe<{
                    __typename?: "Contact";
                    id: string;
                    fullName?: Maybe<string>;
                    email: string;
                  }>;
                };
              }
            | {
                __typename?: "AccessDelegatedEvent";
                id: string;
                createdAt: string;
                originalAccess: {
                  __typename?: "PetitionAccess";
                  contact?: Maybe<{
                    __typename?: "Contact";
                    id: string;
                    fullName?: Maybe<string>;
                    email: string;
                  }>;
                };
                newAccess: {
                  __typename?: "PetitionAccess";
                  contact?: Maybe<{
                    __typename?: "Contact";
                    id: string;
                    fullName?: Maybe<string>;
                    email: string;
                  }>;
                };
              }
            | {
                __typename?: "AccessOpenedEvent";
                id: string;
                createdAt: string;
                access: {
                  __typename?: "PetitionAccess";
                  contact?: Maybe<{
                    __typename?: "Contact";
                    id: string;
                    fullName?: Maybe<string>;
                    email: string;
                  }>;
                };
              }
            | {
                __typename?: "CommentDeletedEvent";
                id: string;
                createdAt: string;
                field?: Maybe<{ __typename?: "PetitionField"; title?: Maybe<string> }>;
                deletedBy?: Maybe<
                  | {
                      __typename?: "PetitionAccess";
                      contact?: Maybe<{
                        __typename?: "Contact";
                        id: string;
                        fullName?: Maybe<string>;
                        email: string;
                      }>;
                    }
                  | {
                      __typename?: "User";
                      id: string;
                      fullName?: Maybe<string>;
                      status: UserStatus;
                    }
                >;
              }
            | {
                __typename?: "CommentPublishedEvent";
                id: string;
                createdAt: string;
                field?: Maybe<{ __typename?: "PetitionField"; title?: Maybe<string> }>;
                comment?: Maybe<{
                  __typename?: "PetitionFieldComment";
                  isEdited: boolean;
                  content: string;
                  author?: Maybe<
                    | {
                        __typename?: "PetitionAccess";
                        contact?: Maybe<{
                          __typename?: "Contact";
                          id: string;
                          fullName?: Maybe<string>;
                          email: string;
                        }>;
                      }
                    | {
                        __typename?: "User";
                        id: string;
                        fullName?: Maybe<string>;
                        status: UserStatus;
                      }
                  >;
                }>;
              }
            | {
                __typename?: "GroupPermissionAddedEvent";
                id: string;
                permissionType: PetitionPermissionType;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
                permissionGroup: { __typename?: "UserGroup"; name: string };
              }
            | {
                __typename?: "GroupPermissionEditedEvent";
                id: string;
                permissionType: PetitionPermissionType;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
                permissionGroup: { __typename?: "UserGroup"; name: string };
              }
            | {
                __typename?: "GroupPermissionRemovedEvent";
                id: string;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
                permissionGroup: { __typename?: "UserGroup"; name: string };
              }
            | {
                __typename?: "MessageCancelledEvent";
                id: string;
                createdAt: string;
                message: {
                  __typename?: "PetitionMessage";
                  status: PetitionMessageStatus;
                  scheduledAt?: Maybe<string>;
                  emailSubject?: Maybe<any>;
                  access: {
                    __typename?: "PetitionAccess";
                    contact?: Maybe<{
                      __typename?: "Contact";
                      id: string;
                      fullName?: Maybe<string>;
                      email: string;
                    }>;
                  };
                };
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
              }
            | {
                __typename?: "MessageScheduledEvent";
                id: string;
                createdAt: string;
                message: {
                  __typename?: "PetitionMessage";
                  id: string;
                  status: PetitionMessageStatus;
                  scheduledAt?: Maybe<string>;
                  emailSubject?: Maybe<any>;
                  emailBody?: Maybe<string>;
                  sentAt?: Maybe<string>;
                  sender: {
                    __typename?: "User";
                    id: string;
                    fullName?: Maybe<string>;
                    status: UserStatus;
                  };
                  access: {
                    __typename?: "PetitionAccess";
                    contact?: Maybe<{
                      __typename?: "Contact";
                      id: string;
                      fullName?: Maybe<string>;
                      email: string;
                    }>;
                  };
                };
              }
            | {
                __typename?: "MessageSentEvent";
                id: string;
                createdAt: string;
                message: {
                  __typename?: "PetitionMessage";
                  emailSubject?: Maybe<any>;
                  scheduledAt?: Maybe<string>;
                  bouncedAt?: Maybe<string>;
                  deliveredAt?: Maybe<string>;
                  openedAt?: Maybe<string>;
                  emailBody?: Maybe<string>;
                  sentAt?: Maybe<string>;
                  sender: {
                    __typename?: "User";
                    id: string;
                    fullName?: Maybe<string>;
                    status: UserStatus;
                  };
                  access: {
                    __typename?: "PetitionAccess";
                    contact?: Maybe<{
                      __typename?: "Contact";
                      id: string;
                      fullName?: Maybe<string>;
                      email: string;
                    }>;
                  };
                };
              }
            | {
                __typename?: "OwnershipTransferredEvent";
                id: string;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
                owner?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
                previousOwner?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
              }
            | {
                __typename?: "PetitionClonedEvent";
                id: string;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
              }
            | {
                __typename?: "PetitionClosedEvent";
                id: string;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
              }
            | {
                __typename?: "PetitionClosedNotifiedEvent";
                id: string;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
                access: {
                  __typename?: "PetitionAccess";
                  contact?: Maybe<{
                    __typename?: "Contact";
                    id: string;
                    fullName?: Maybe<string>;
                    email: string;
                  }>;
                };
              }
            | {
                __typename?: "PetitionCompletedEvent";
                id: string;
                createdAt: string;
                access: {
                  __typename?: "PetitionAccess";
                  contact?: Maybe<{
                    __typename?: "Contact";
                    id: string;
                    fullName?: Maybe<string>;
                    email: string;
                  }>;
                };
              }
            | {
                __typename?: "PetitionCreatedEvent";
                id: string;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
              }
            | { __typename?: "PetitionDeletedEvent"; id: string }
            | {
                __typename?: "PetitionReopenedEvent";
                id: string;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
              }
            | {
                __typename?: "ReminderSentEvent";
                id: string;
                createdAt: string;
                reminder: {
                  __typename?: "PetitionReminder";
                  type: PetitionReminderType;
                  createdAt: string;
                  emailBody?: Maybe<string>;
                  sender?: Maybe<{
                    __typename?: "User";
                    id: string;
                    fullName?: Maybe<string>;
                    status: UserStatus;
                  }>;
                  access: {
                    __typename?: "PetitionAccess";
                    contact?: Maybe<{
                      __typename?: "Contact";
                      id: string;
                      fullName?: Maybe<string>;
                      email: string;
                    }>;
                  };
                };
              }
            | {
                __typename?: "RemindersOptOutEvent";
                id: string;
                createdAt: string;
                reason: string;
                other?: Maybe<string>;
                access: {
                  __typename?: "PetitionAccess";
                  contact?: Maybe<{
                    __typename?: "Contact";
                    id: string;
                    fullName?: Maybe<string>;
                    email: string;
                  }>;
                };
              }
            | {
                __typename?: "ReplyCreatedEvent";
                id: string;
                createdAt: string;
                field?: Maybe<{ __typename?: "PetitionField"; title?: Maybe<string> }>;
                createdBy?: Maybe<
                  | {
                      __typename?: "PetitionAccess";
                      contact?: Maybe<{
                        __typename?: "Contact";
                        id: string;
                        fullName?: Maybe<string>;
                        email: string;
                      }>;
                    }
                  | {
                      __typename?: "User";
                      id: string;
                      fullName?: Maybe<string>;
                      status: UserStatus;
                    }
                >;
              }
            | {
                __typename?: "ReplyDeletedEvent";
                id: string;
                createdAt: string;
                field?: Maybe<{ __typename?: "PetitionField"; title?: Maybe<string> }>;
                deletedBy?: Maybe<
                  | {
                      __typename?: "PetitionAccess";
                      contact?: Maybe<{
                        __typename?: "Contact";
                        id: string;
                        fullName?: Maybe<string>;
                        email: string;
                      }>;
                    }
                  | {
                      __typename?: "User";
                      id: string;
                      fullName?: Maybe<string>;
                      status: UserStatus;
                    }
                >;
              }
            | {
                __typename?: "ReplyUpdatedEvent";
                id: string;
                createdAt: string;
                field?: Maybe<{ __typename?: "PetitionField"; title?: Maybe<string> }>;
                updatedBy?: Maybe<
                  | {
                      __typename?: "PetitionAccess";
                      contact?: Maybe<{
                        __typename?: "Contact";
                        id: string;
                        fullName?: Maybe<string>;
                        email: string;
                      }>;
                    }
                  | {
                      __typename?: "User";
                      id: string;
                      fullName?: Maybe<string>;
                      status: UserStatus;
                    }
                >;
              }
            | {
                __typename?: "SignatureCancelledEvent";
                id: string;
                cancelType: PetitionSignatureCancelReason;
                cancellerReason?: Maybe<string>;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
                contact?: Maybe<{
                  __typename?: "Contact";
                  id: string;
                  fullName?: Maybe<string>;
                  email: string;
                }>;
              }
            | { __typename?: "SignatureCompletedEvent"; id: string; createdAt: string }
            | { __typename?: "SignatureStartedEvent"; id: string; createdAt: string }
            | { __typename?: "TemplateUsedEvent"; id: string }
            | {
                __typename?: "UserPermissionAddedEvent";
                id: string;
                permissionType: PetitionPermissionType;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
                permissionUser?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
              }
            | {
                __typename?: "UserPermissionEditedEvent";
                id: string;
                permissionType: PetitionPermissionType;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
                permissionUser?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
              }
            | {
                __typename?: "UserPermissionRemovedEvent";
                id: string;
                createdAt: string;
                user?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
                permissionUser?: Maybe<{
                  __typename?: "User";
                  id: string;
                  fullName?: Maybe<string>;
                  status: UserStatus;
                }>;
              }
          >;
        };
        permissions: Array<
          | {
              __typename?: "PetitionUserGroupPermission";
              permissionType: PetitionPermissionType;
              group: { __typename?: "UserGroup"; id: string; name: string };
            }
          | {
              __typename?: "PetitionUserPermission";
              permissionType: PetitionPermissionType;
              user: { __typename?: "User"; id: string; fullName?: Maybe<string> };
            }
        >;
        signatureConfig?: Maybe<{
          __typename?: "SignatureConfig";
          contacts: Array<
            Maybe<{ __typename?: "Contact"; id: string; fullName?: Maybe<string>; email: string }>
          >;
        }>;
        remindersConfig?: Maybe<{
          __typename?: "RemindersConfig";
          offset: number;
          time: string;
          timezone: string;
          weekdaysOnly: boolean;
        }>;
        myEffectivePermission?: Maybe<{
          __typename?: "EffectivePetitionUserPermission";
          isSubscribed: boolean;
        }>;
      }
    | { __typename?: "PetitionTemplate" }
  >;
};

export type PetitionActivityQuery = { petition?: Maybe<{ __typename?: 'Petition', id: string, name?: Maybe<string>, status: PetitionStatus, emailSubject?: Maybe<string>, emailBody?: Maybe<any>, locale: PetitionLocale, deadline?: Maybe<string>, updatedAt: string, isReadOnly: boolean, accesses: Array<{ __typename?: 'PetitionAccess', id: string, status: PetitionAccessStatus, nextReminderAt?: Maybe<string>, remindersLeft: number, reminderCount: number, remindersActive: boolean, remindersOptOut: boolean, createdAt: string, contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }>, remindersConfig?: Maybe<{ __typename?: 'RemindersConfig', offset: number, time: string, timezone: string, weekdaysOnly: boolean }> }>, events: { __typename?: 'PetitionEventPagination', items: Array<{ __typename?: 'AccessActivatedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } | { __typename?: 'AccessDeactivatedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } | { __typename?: 'AccessDelegatedEvent', id: string, createdAt: string, originalAccess: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> }, newAccess: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } | { __typename?: 'AccessOpenedEvent', id: string, createdAt: string, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } | { __typename?: 'CommentDeletedEvent', id: string, createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, deletedBy?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'CommentPublishedEvent', id: string, createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, comment?: Maybe<{ __typename?: 'PetitionFieldComment', isEdited: boolean, content: string, author?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> }> } | { __typename?: 'GroupPermissionAddedEvent', id: string, permissionType: PetitionPermissionType, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionGroup: { __typename?: 'UserGroup', name: string } } | { __typename?: 'GroupPermissionEditedEvent', id: string, permissionType: PetitionPermissionType, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionGroup: { __typename?: 'UserGroup', name: string } } | { __typename?: 'GroupPermissionRemovedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionGroup: { __typename?: 'UserGroup', name: string } } | { __typename?: 'MessageCancelledEvent', id: string, createdAt: string, message: { __typename?: 'PetitionMessage', status: PetitionMessageStatus, scheduledAt?: Maybe<string>, emailSubject?: Maybe<any>, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } }, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'MessageScheduledEvent', id: string, createdAt: string, message: { __typename?: 'PetitionMessage', id: string, status: PetitionMessageStatus, scheduledAt?: Maybe<string>, emailSubject?: Maybe<any>, emailBody?: Maybe<string>, sentAt?: Maybe<string>, sender: { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } } | { __typename?: 'MessageSentEvent', id: string, createdAt: string, message: { __typename?: 'PetitionMessage', emailSubject?: Maybe<any>, scheduledAt?: Maybe<string>, bouncedAt?: Maybe<string>, deliveredAt?: Maybe<string>, openedAt?: Maybe<string>, emailBody?: Maybe<string>, sentAt?: Maybe<string>, sender: { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } } | { __typename?: 'OwnershipTransferredEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, owner?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, previousOwner?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'PetitionClonedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'PetitionClosedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'PetitionClosedNotifiedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } | { __typename?: 'PetitionCompletedEvent', id: string, createdAt: string, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } | { __typename?: 'PetitionCreatedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'PetitionDeletedEvent', id: string } | { __typename?: 'PetitionReopenedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'ReminderSentEvent', id: string, createdAt: string, reminder: { __typename?: 'PetitionReminder', type: PetitionReminderType, createdAt: string, emailBody?: Maybe<string>, sender?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } } | { __typename?: 'RemindersOptOutEvent', id: string, createdAt: string, reason: string, other: string, access: { __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } } | { __typename?: 'ReplyCreatedEvent', id: string, createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, createdBy?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'ReplyDeletedEvent', id: string, createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, deletedBy?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'ReplyUpdatedEvent', id: string, createdAt: string, field?: Maybe<{ __typename?: 'PetitionField', title?: Maybe<string> }>, updatedBy?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'SignatureCancelledEvent', id: string, cancelType: PetitionSignatureCancelReason, cancellerReason?: Maybe<string>, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'SignatureCompletedEvent', id: string, createdAt: string } | { __typename?: 'SignatureStartedEvent', id: string, createdAt: string } | { __typename?: 'TemplateUsedEvent', id: string } | { __typename?: 'UserPermissionAddedEvent', id: string, permissionType: PetitionPermissionType, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionUser?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'UserPermissionEditedEvent', id: string, permissionType: PetitionPermissionType, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionUser?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> } | { __typename?: 'UserPermissionRemovedEvent', id: string, createdAt: string, user?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }>, permissionUser?: Maybe<{ __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> }> }, permissions: Array<{ __typename?: 'PetitionUserGroupPermission', permissionType: PetitionPermissionType, group: { __typename?: 'UserGroup', id: string, name: string } } | { __typename?: 'PetitionUserPermission', permissionType: PetitionPermissionType, user: { __typename?: 'User', id: string, fullName?: Maybe<string> } }>, signatureConfig?: Maybe<{ __typename?: 'SignatureConfig', contacts: Array<Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }>> }>, remindersConfig?: Maybe<{ __typename?: 'RemindersConfig', offset: number, time: string, timezone: string, weekdaysOnly: boolean }>, myEffectivePermission?: Maybe<{ __typename?: 'EffectivePetitionUserPermission', isSubscribed: boolean }> } | { __typename?: 'PetitionTemplate' }> };

export type PetitionActivityUserQueryVariables = Exact<{ [key: string]: never; }>;

export type PetitionCompose_PetitionBase_Petition_Fragment = {
  __typename?: "Petition";
  status: PetitionStatus;
  id: string;
  name?: Maybe<string>;
  emailSubject?: Maybe<string>;
  emailBody?: Maybe<any>;
  deadline?: Maybe<string>;
  locale: PetitionLocale;
  hasCommentsEnabled: boolean;
  skipForwardSecurity: boolean;
  isRecipientViewContentsHidden: boolean;
  isReadOnly: boolean;
  updatedAt: string;
  fields: Array<{
    __typename?: "PetitionField";
    id: string;
    type: PetitionFieldType;
    title?: Maybe<string>;
    description?: Maybe<string>;
    optional: boolean;
    multiple: boolean;
    isFixed: boolean;
    isReadOnly: boolean;
    visibility?: Maybe<{ [key: string]: any }>;
    options: { [key: string]: any };
    position: number;
    validated: boolean;
    attachments: Array<{
      __typename?: "PetitionFieldAttachment";
      id: string;
      file: {
        __typename?: "FileUpload";
        filename: string;
        contentType: string;
        size: number;
        isComplete: boolean;
      };
    }>;
    comments: Array<{ __typename?: "PetitionFieldComment"; id: string }>;
    replies: Array<{ __typename?: "PetitionFieldReply"; id: string }>;
  }>;
  signatureConfig?: Maybe<{
    __typename?: "SignatureConfig";
    provider: string;
    title: string;
    review: boolean;
    contacts: Array<
      Maybe<{ __typename?: "Contact"; id: string; fullName?: Maybe<string>; email: string }>
    >;
  }>;
  remindersConfig?: Maybe<{
    __typename?: "RemindersConfig";
    offset: number;
    time: string;
    timezone: string;
    weekdaysOnly: boolean;
  }>;
  currentSignatureRequest?: Maybe<{
    __typename?: "PetitionSignatureRequest";
    id: string;
    status: PetitionSignatureRequestStatus;
  }>;
  owner: { __typename?: "User"; id: string };
  myEffectivePermission?: Maybe<{
    __typename?: "EffectivePetitionUserPermission";
    isSubscribed: boolean;
  }>;
};

export type PetitionCompose_PetitionBase_PetitionTemplate_Fragment = {
  __typename?: "PetitionTemplate";
  isPublic: boolean;
  id: string;
  name?: Maybe<string>;
  emailSubject?: Maybe<string>;
  emailBody?: Maybe<any>;
  description?: Maybe<any>;
  isReadOnly: boolean;
  locale: PetitionLocale;
  hasCommentsEnabled: boolean;
  skipForwardSecurity: boolean;
  isRecipientViewContentsHidden: boolean;
  updatedAt: string;
  fields: Array<{
    __typename?: "PetitionField";
    id: string;
    type: PetitionFieldType;
    title?: Maybe<string>;
    description?: Maybe<string>;
    optional: boolean;
    multiple: boolean;
    isFixed: boolean;
    isReadOnly: boolean;
    visibility?: Maybe<{ [key: string]: any }>;
    options: { [key: string]: any };
    position: number;
    validated: boolean;
    attachments: Array<{
      __typename?: "PetitionFieldAttachment";
      id: string;
      file: {
        __typename?: "FileUpload";
        filename: string;
        contentType: string;
        size: number;
        isComplete: boolean;
      };
    }>;
    comments: Array<{ __typename?: "PetitionFieldComment"; id: string }>;
    replies: Array<{ __typename?: "PetitionFieldReply"; id: string }>;
  }>;
  publicLink?: Maybe<{
    __typename?: "PublicPetitionLink";
    id: string;
    title: string;
    isActive: boolean;
    description: string;
    slug: string;
    linkPermissions: Array<
      | {
          __typename?: "PublicPetitionLinkUserGroupPermission";
          permissionType: PetitionPermissionType;
          group: { __typename?: "UserGroup"; id: string };
        }
      | {
          __typename?: "PublicPetitionLinkUserPermission";
          permissionType: PetitionPermissionType;
          user: { __typename?: "User"; id: string };
        }
    >;
  }>;
  owner: { __typename?: "User"; id: string };
};

export type PetitionCompose_PetitionBase_Petition_Fragment = { __typename?: 'Petition', status: PetitionStatus, id: string, name?: Maybe<string>, emailSubject?: Maybe<string>, emailBody?: Maybe<any>, deadline?: Maybe<string>, locale: PetitionLocale, hasCommentsEnabled: boolean, skipForwardSecurity: boolean, isRecipientViewContentsHidden: boolean, isReadOnly: boolean, updatedAt: string, fields: Array<{ __typename?: 'PetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, description?: Maybe<string>, optional: boolean, multiple: boolean, isFixed: boolean, isReadOnly: boolean, visibility?: Maybe<{ [key: string]: any }>, options: { [key: string]: any }, position: number, validated: boolean, attachments: Array<{ __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } }>, comments: Array<{ __typename?: 'PetitionFieldComment', id: string }>, replies: Array<{ __typename?: 'PetitionFieldReply', id: string }> }>, signatureConfig?: Maybe<{ __typename?: 'SignatureConfig', provider: string, title: string, review: boolean, contacts: Array<Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }>> }>, remindersConfig?: Maybe<{ __typename?: 'RemindersConfig', offset: number, time: string, timezone: string, weekdaysOnly: boolean }>, currentSignatureRequest?: Maybe<{ __typename?: 'PetitionSignatureRequest', id: string, status: PetitionSignatureRequestStatus }>, myEffectivePermission?: Maybe<{ __typename?: 'EffectivePetitionUserPermission', isSubscribed: boolean }> };

export type PetitionCompose_PetitionBase_PetitionTemplate_Fragment = { __typename?: 'PetitionTemplate', isPublic: boolean, id: string, name?: Maybe<string>, emailSubject?: Maybe<string>, emailBody?: Maybe<any>, description?: Maybe<any>, isReadOnly: boolean, locale: PetitionLocale, hasCommentsEnabled: boolean, skipForwardSecurity: boolean, isRecipientViewContentsHidden: boolean, updatedAt: string, fields: Array<{ __typename?: 'PetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, description?: Maybe<string>, optional: boolean, multiple: boolean, isFixed: boolean, isReadOnly: boolean, visibility?: Maybe<{ [key: string]: any }>, options: { [key: string]: any }, position: number, validated: boolean, attachments: Array<{ __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } }>, comments: Array<{ __typename?: 'PetitionFieldComment', id: string }>, replies: Array<{ __typename?: 'PetitionFieldReply', id: string }> }> };

export type PetitionCompose_PetitionBaseFragment = PetitionCompose_PetitionBase_Petition_Fragment | PetitionCompose_PetitionBase_PetitionTemplate_Fragment;

export type PetitionCompose_PetitionFieldFragment = { __typename?: 'PetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, description?: Maybe<string>, optional: boolean, multiple: boolean, isFixed: boolean, isReadOnly: boolean, visibility?: Maybe<{ [key: string]: any }>, options: { [key: string]: any }, position: number, validated: boolean, attachments: Array<{ __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } }>, comments: Array<{ __typename?: 'PetitionFieldComment', id: string }>, replies: Array<{ __typename?: 'PetitionFieldReply', id: string }> };

export type PetitionCompose_UserFragment = { __typename?: 'User', id: string, unreadNotificationIds: Array<string>, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole, hasPetitionSignature: boolean, hasSkipForwardSecurity: boolean, hasHideRecipientViewContents: boolean, hasPetitionPdfExport: boolean, organization: { __typename?: 'Organization', id: string, signatureIntegrations: Array<{ __typename?: 'OrgIntegration', label: string, value: string }> } };

export type PetitionCompose_updatePetitionMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  data: UpdatePetitionInput;
  hasPetitionSignature: Scalars['Boolean'];
}>;

export type PetitionCompose_updatePetitionMutation = {
  updatePetition:
    | {
        __typename?: "Petition";
        id: string;
        name?: Maybe<string>;
        status: PetitionStatus;
        deadline?: Maybe<string>;
        locale: PetitionLocale;
        hasCommentsEnabled: boolean;
        skipForwardSecurity: boolean;
        isRecipientViewContentsHidden: boolean;
        isReadOnly: boolean;
        emailSubject?: Maybe<string>;
        emailBody?: Maybe<any>;
        updatedAt: string;
        currentSignatureRequest?: Maybe<{
          __typename?: "PetitionSignatureRequest";
          id: string;
          status: PetitionSignatureRequestStatus;
        }>;
        owner: { __typename?: "User"; id: string };
        signatureConfig?: Maybe<{
          __typename?: "SignatureConfig";
          provider: string;
          title: string;
          review: boolean;
          contacts: Array<
            Maybe<{ __typename?: "Contact"; id: string; fullName?: Maybe<string>; email: string }>
          >;
        }>;
        remindersConfig?: Maybe<{
          __typename?: "RemindersConfig";
          offset: number;
          time: string;
          timezone: string;
          weekdaysOnly: boolean;
        }>;
        myEffectivePermission?: Maybe<{
          __typename?: "EffectivePetitionUserPermission";
          isSubscribed: boolean;
        }>;
      }
    | {
        __typename?: "PetitionTemplate";
        id: string;
        name?: Maybe<string>;
        isPublic: boolean;
        locale: PetitionLocale;
        hasCommentsEnabled: boolean;
        skipForwardSecurity: boolean;
        isRecipientViewContentsHidden: boolean;
        isReadOnly: boolean;
        emailSubject?: Maybe<string>;
        emailBody?: Maybe<any>;
        description?: Maybe<any>;
        updatedAt: string;
        publicLink?: Maybe<{
          __typename?: "PublicPetitionLink";
          id: string;
          title: string;
          isActive: boolean;
          description: string;
          slug: string;
          linkPermissions: Array<
            | {
                __typename?: "PublicPetitionLinkUserGroupPermission";
                permissionType: PetitionPermissionType;
                group: { __typename?: "UserGroup"; id: string };
              }
            | {
                __typename?: "PublicPetitionLinkUserPermission";
                permissionType: PetitionPermissionType;
                user: { __typename?: "User"; id: string };
              }
          >;
        }>;
        owner: { __typename?: "User"; id: string };
      };
};

export type PetitionCompose_updatePetitionMutation = { updatePetition: { __typename?: 'Petition', id: string, name?: Maybe<string>, status: PetitionStatus, deadline?: Maybe<string>, locale: PetitionLocale, hasCommentsEnabled: boolean, skipForwardSecurity: boolean, isRecipientViewContentsHidden: boolean, isReadOnly: boolean, emailSubject?: Maybe<string>, emailBody?: Maybe<any>, updatedAt: string, currentSignatureRequest?: Maybe<{ __typename?: 'PetitionSignatureRequest', id: string, status: PetitionSignatureRequestStatus }>, signatureConfig?: Maybe<{ __typename?: 'SignatureConfig', provider: string, title: string, review: boolean, contacts: Array<Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }>> }>, remindersConfig?: Maybe<{ __typename?: 'RemindersConfig', offset: number, time: string, timezone: string, weekdaysOnly: boolean }>, myEffectivePermission?: Maybe<{ __typename?: 'EffectivePetitionUserPermission', isSubscribed: boolean }> } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string>, isPublic: boolean, locale: PetitionLocale, hasCommentsEnabled: boolean, skipForwardSecurity: boolean, isRecipientViewContentsHidden: boolean, isReadOnly: boolean, emailSubject?: Maybe<string>, emailBody?: Maybe<any>, description?: Maybe<any>, updatedAt: string } };

export type PetitionCompose_updateFieldPositionsMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  fieldIds: Array<Scalars['GID']> | Scalars['GID'];
}>;


export type PetitionCompose_updateFieldPositionsMutation = { updateFieldPositions: { __typename?: 'Petition', id: string, name?: Maybe<string>, locale: PetitionLocale, deadline?: Maybe<string>, status: PetitionStatus, updatedAt: string, isReadOnly: boolean, fields: Array<{ __typename?: 'PetitionField', id: string }>, myEffectivePermission?: Maybe<{ __typename?: 'EffectivePetitionUserPermission', isSubscribed: boolean }> } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string>, locale: PetitionLocale, isPublic: boolean, updatedAt: string, isReadOnly: boolean, fields: Array<{ __typename?: 'PetitionField', id: string }> } };

export type PetitionCompose_createPetitionFieldMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  type: PetitionFieldType;
  position?: Maybe<Scalars['Int']>;
}>;


export type PetitionCompose_createPetitionFieldMutation = { createPetitionField: { __typename?: 'PetitionAndField', field: { __typename?: 'PetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, description?: Maybe<string>, optional: boolean, multiple: boolean, isFixed: boolean, isReadOnly: boolean, visibility?: Maybe<{ [key: string]: any }>, options: { [key: string]: any }, position: number, validated: boolean, attachments: Array<{ __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } }>, comments: Array<{ __typename?: 'PetitionFieldComment', id: string }>, replies: Array<{ __typename?: 'PetitionFieldReply', id: string }> }, petition: { __typename?: 'Petition', id: string, name?: Maybe<string>, locale: PetitionLocale, deadline?: Maybe<string>, status: PetitionStatus, updatedAt: string, isReadOnly: boolean, fields: Array<{ __typename?: 'PetitionField', id: string }>, myEffectivePermission?: Maybe<{ __typename?: 'EffectivePetitionUserPermission', isSubscribed: boolean }> } } | { __typename?: 'PetitionTemplateAndField', field: { __typename?: 'PetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, description?: Maybe<string>, optional: boolean, multiple: boolean, isFixed: boolean, isReadOnly: boolean, visibility?: Maybe<{ [key: string]: any }>, options: { [key: string]: any }, position: number, validated: boolean, attachments: Array<{ __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } }>, comments: Array<{ __typename?: 'PetitionFieldComment', id: string }>, replies: Array<{ __typename?: 'PetitionFieldReply', id: string }> }, petition: { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string>, locale: PetitionLocale, isPublic: boolean, updatedAt: string, isReadOnly: boolean, fields: Array<{ __typename?: 'PetitionField', id: string }> } } };

export type PetitionCompose_clonePetitionFieldMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  fieldId: Scalars['GID'];
}>;


export type PetitionCompose_clonePetitionFieldMutation = { clonePetitionField: { __typename?: 'PetitionAndField', field: { __typename?: 'PetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, description?: Maybe<string>, optional: boolean, multiple: boolean, isFixed: boolean, isReadOnly: boolean, visibility?: Maybe<{ [key: string]: any }>, options: { [key: string]: any }, position: number, validated: boolean, attachments: Array<{ __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } }>, comments: Array<{ __typename?: 'PetitionFieldComment', id: string }>, replies: Array<{ __typename?: 'PetitionFieldReply', id: string }> }, petition: { __typename?: 'Petition', id: string, name?: Maybe<string>, locale: PetitionLocale, deadline?: Maybe<string>, status: PetitionStatus, updatedAt: string, isReadOnly: boolean, fields: Array<{ __typename?: 'PetitionField', id: string }>, myEffectivePermission?: Maybe<{ __typename?: 'EffectivePetitionUserPermission', isSubscribed: boolean }> } } | { __typename?: 'PetitionTemplateAndField', field: { __typename?: 'PetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, description?: Maybe<string>, optional: boolean, multiple: boolean, isFixed: boolean, isReadOnly: boolean, visibility?: Maybe<{ [key: string]: any }>, options: { [key: string]: any }, position: number, validated: boolean, attachments: Array<{ __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } }>, comments: Array<{ __typename?: 'PetitionFieldComment', id: string }>, replies: Array<{ __typename?: 'PetitionFieldReply', id: string }> }, petition: { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string>, locale: PetitionLocale, isPublic: boolean, updatedAt: string, isReadOnly: boolean, fields: Array<{ __typename?: 'PetitionField', id: string }> } } };

export type PetitionCompose_deletePetitionFieldMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  fieldId: Scalars['GID'];
  force?: Maybe<Scalars['Boolean']>;
}>;


export type PetitionCompose_deletePetitionFieldMutation = { deletePetitionField: { __typename?: 'Petition', id: string, name?: Maybe<string>, locale: PetitionLocale, deadline?: Maybe<string>, status: PetitionStatus, updatedAt: string, isReadOnly: boolean, fields: Array<{ __typename?: 'PetitionField', id: string }>, myEffectivePermission?: Maybe<{ __typename?: 'EffectivePetitionUserPermission', isSubscribed: boolean }> } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string>, locale: PetitionLocale, isPublic: boolean, updatedAt: string, isReadOnly: boolean, fields: Array<{ __typename?: 'PetitionField', id: string }> } };

export type PetitionCompose_updatePetitionFieldMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  fieldId: Scalars['GID'];
  data: UpdatePetitionFieldInput;
}>;


export type PetitionCompose_updatePetitionFieldMutation = { updatePetitionField: { __typename?: 'PetitionAndField', field: { __typename?: 'PetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, description?: Maybe<string>, optional: boolean, multiple: boolean, isFixed: boolean, isReadOnly: boolean, visibility?: Maybe<{ [key: string]: any }>, options: { [key: string]: any }, position: number, validated: boolean, attachments: Array<{ __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } }>, comments: Array<{ __typename?: 'PetitionFieldComment', id: string }>, replies: Array<{ __typename?: 'PetitionFieldReply', id: string }> }, petition: { __typename?: 'Petition', status: PetitionStatus, id: string, updatedAt: string } } | { __typename?: 'PetitionTemplateAndField', field: { __typename?: 'PetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, description?: Maybe<string>, optional: boolean, multiple: boolean, isFixed: boolean, isReadOnly: boolean, visibility?: Maybe<{ [key: string]: any }>, options: { [key: string]: any }, position: number, validated: boolean, attachments: Array<{ __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } }>, comments: Array<{ __typename?: 'PetitionFieldComment', id: string }>, replies: Array<{ __typename?: 'PetitionFieldReply', id: string }> }, petition: { __typename?: 'PetitionTemplate', id: string, updatedAt: string } } };

export type PetitionCompose_changePetitionFieldTypeMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  fieldId: Scalars['GID'];
  type: PetitionFieldType;
  force?: Maybe<Scalars['Boolean']>;
}>;


export type PetitionCompose_changePetitionFieldTypeMutation = { changePetitionFieldType: { __typename?: 'PetitionAndField', field: { __typename?: 'PetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, description?: Maybe<string>, optional: boolean, multiple: boolean, isFixed: boolean, isReadOnly: boolean, visibility?: Maybe<{ [key: string]: any }>, options: { [key: string]: any }, position: number, validated: boolean, attachments: Array<{ __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } }>, comments: Array<{ __typename?: 'PetitionFieldComment', id: string }>, replies: Array<{ __typename?: 'PetitionFieldReply', id: string }> }, petition: { __typename?: 'Petition', status: PetitionStatus, id: string, updatedAt: string } } | { __typename?: 'PetitionTemplateAndField', field: { __typename?: 'PetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, description?: Maybe<string>, optional: boolean, multiple: boolean, isFixed: boolean, isReadOnly: boolean, visibility?: Maybe<{ [key: string]: any }>, options: { [key: string]: any }, position: number, validated: boolean, attachments: Array<{ __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } }>, comments: Array<{ __typename?: 'PetitionFieldComment', id: string }>, replies: Array<{ __typename?: 'PetitionFieldReply', id: string }> }, petition: { __typename?: 'PetitionTemplate', id: string, updatedAt: string } } };

export type PetitionCompose_batchSendPetitionMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  contactIdGroups: Array<Array<Scalars['GID']> | Scalars['GID']> | Array<Scalars['GID']> | Scalars['GID'];
  subject: Scalars['String'];
  body: Scalars['JSON'];
  remindersConfig?: Maybe<RemindersConfigInput>;
  scheduledAt?: Maybe<Scalars['DateTime']>;
  batchSendSigningMode?: Maybe<BatchSendSigningMode>;
}>;


export type PetitionCompose_batchSendPetitionMutation = { batchSendPetition: Array<{ __typename?: 'SendPetitionResult', result: Result, petition?: Maybe<{ __typename?: 'Petition', id: string, status: PetitionStatus }> }> };

export type PetitionComposeUserQueryVariables = Exact<{ [key: string]: never; }>;


export type PetitionComposeUserQuery = { me: { __typename?: 'User', id: string, unreadNotificationIds: Array<string>, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole, hasPetitionSignature: boolean, hasSkipForwardSecurity: boolean, hasHideRecipientViewContents: boolean, hasPetitionPdfExport: boolean, organization: { __typename?: 'Organization', id: string, signatureIntegrations: Array<{ __typename?: 'OrgIntegration', label: string, value: string }> } } };

export type PetitionComposeQueryVariables = Exact<{
  id: Scalars['GID'];
  hasPetitionSignature: Scalars['Boolean'];
}>;

export type PetitionComposeQuery = {
  petition?: Maybe<
    | {
        __typename?: "Petition";
        status: PetitionStatus;
        id: string;
        name?: Maybe<string>;
        emailSubject?: Maybe<string>;
        emailBody?: Maybe<any>;
        deadline?: Maybe<string>;
        locale: PetitionLocale;
        hasCommentsEnabled: boolean;
        skipForwardSecurity: boolean;
        isRecipientViewContentsHidden: boolean;
        isReadOnly: boolean;
        updatedAt: string;
        fields: Array<{
          __typename?: "PetitionField";
          id: string;
          type: PetitionFieldType;
          title?: Maybe<string>;
          description?: Maybe<string>;
          optional: boolean;
          multiple: boolean;
          isFixed: boolean;
          isReadOnly: boolean;
          visibility?: Maybe<{ [key: string]: any }>;
          options: { [key: string]: any };
          position: number;
          validated: boolean;
          attachments: Array<{
            __typename?: "PetitionFieldAttachment";
            id: string;
            file: {
              __typename?: "FileUpload";
              filename: string;
              contentType: string;
              size: number;
              isComplete: boolean;
            };
          }>;
          comments: Array<{ __typename?: "PetitionFieldComment"; id: string }>;
          replies: Array<{ __typename?: "PetitionFieldReply"; id: string }>;
        }>;
        signatureConfig?: Maybe<{
          __typename?: "SignatureConfig";
          provider: string;
          title: string;
          review: boolean;
          contacts: Array<
            Maybe<{ __typename?: "Contact"; id: string; fullName?: Maybe<string>; email: string }>
          >;
        }>;
        remindersConfig?: Maybe<{
          __typename?: "RemindersConfig";
          offset: number;
          time: string;
          timezone: string;
          weekdaysOnly: boolean;
        }>;
        currentSignatureRequest?: Maybe<{
          __typename?: "PetitionSignatureRequest";
          id: string;
          status: PetitionSignatureRequestStatus;
        }>;
        owner: { __typename?: "User"; id: string };
        myEffectivePermission?: Maybe<{
          __typename?: "EffectivePetitionUserPermission";
          isSubscribed: boolean;
        }>;
      }
    | {
        __typename?: "PetitionTemplate";
        isPublic: boolean;
        id: string;
        name?: Maybe<string>;
        emailSubject?: Maybe<string>;
        emailBody?: Maybe<any>;
        description?: Maybe<any>;
        isReadOnly: boolean;
        locale: PetitionLocale;
        hasCommentsEnabled: boolean;
        skipForwardSecurity: boolean;
        isRecipientViewContentsHidden: boolean;
        updatedAt: string;
        fields: Array<{
          __typename?: "PetitionField";
          id: string;
          type: PetitionFieldType;
          title?: Maybe<string>;
          description?: Maybe<string>;
          optional: boolean;
          multiple: boolean;
          isFixed: boolean;
          isReadOnly: boolean;
          visibility?: Maybe<{ [key: string]: any }>;
          options: { [key: string]: any };
          position: number;
          validated: boolean;
          attachments: Array<{
            __typename?: "PetitionFieldAttachment";
            id: string;
            file: {
              __typename?: "FileUpload";
              filename: string;
              contentType: string;
              size: number;
              isComplete: boolean;
            };
          }>;
          comments: Array<{ __typename?: "PetitionFieldComment"; id: string }>;
          replies: Array<{ __typename?: "PetitionFieldReply"; id: string }>;
        }>;
        publicLink?: Maybe<{
          __typename?: "PublicPetitionLink";
          id: string;
          title: string;
          isActive: boolean;
          description: string;
          slug: string;
          linkPermissions: Array<
            | {
                __typename?: "PublicPetitionLinkUserGroupPermission";
                permissionType: PetitionPermissionType;
                group: { __typename?: "UserGroup"; id: string };
              }
            | {
                __typename?: "PublicPetitionLinkUserPermission";
                permissionType: PetitionPermissionType;
                user: { __typename?: "User"; id: string };
              }
          >;
        }>;
        owner: { __typename?: "User"; id: string };
      }
  >;
};

export type PetitionComposeQuery = { petition?: Maybe<{ __typename?: 'Petition', status: PetitionStatus, id: string, name?: Maybe<string>, emailSubject?: Maybe<string>, emailBody?: Maybe<any>, deadline?: Maybe<string>, locale: PetitionLocale, hasCommentsEnabled: boolean, skipForwardSecurity: boolean, isRecipientViewContentsHidden: boolean, isReadOnly: boolean, updatedAt: string, fields: Array<{ __typename?: 'PetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, description?: Maybe<string>, optional: boolean, multiple: boolean, isFixed: boolean, isReadOnly: boolean, visibility?: Maybe<{ [key: string]: any }>, options: { [key: string]: any }, position: number, validated: boolean, attachments: Array<{ __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } }>, comments: Array<{ __typename?: 'PetitionFieldComment', id: string }>, replies: Array<{ __typename?: 'PetitionFieldReply', id: string }> }>, signatureConfig?: Maybe<{ __typename?: 'SignatureConfig', provider: string, title: string, review: boolean, contacts: Array<Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }>> }>, remindersConfig?: Maybe<{ __typename?: 'RemindersConfig', offset: number, time: string, timezone: string, weekdaysOnly: boolean }>, currentSignatureRequest?: Maybe<{ __typename?: 'PetitionSignatureRequest', id: string, status: PetitionSignatureRequestStatus }>, myEffectivePermission?: Maybe<{ __typename?: 'EffectivePetitionUserPermission', isSubscribed: boolean }> } | { __typename?: 'PetitionTemplate', isPublic: boolean, id: string, name?: Maybe<string>, emailSubject?: Maybe<string>, emailBody?: Maybe<any>, description?: Maybe<any>, isReadOnly: boolean, locale: PetitionLocale, hasCommentsEnabled: boolean, skipForwardSecurity: boolean, isRecipientViewContentsHidden: boolean, updatedAt: string, fields: Array<{ __typename?: 'PetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, description?: Maybe<string>, optional: boolean, multiple: boolean, isFixed: boolean, isReadOnly: boolean, visibility?: Maybe<{ [key: string]: any }>, options: { [key: string]: any }, position: number, validated: boolean, attachments: Array<{ __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } }>, comments: Array<{ __typename?: 'PetitionFieldComment', id: string }>, replies: Array<{ __typename?: 'PetitionFieldReply', id: string }> }> }> };

export type PetitionQueryVariables = Exact<{
  id: Scalars['GID'];
}>;


export type PetitionQuery = { petition?: Maybe<{ __typename?: 'Petition', status: PetitionStatus, id: string } | { __typename?: 'PetitionTemplate', id: string }> };

export type PetitionReplies_PetitionFragment = { __typename?: 'Petition', id: string, hasCommentsEnabled: boolean, name?: Maybe<string>, status: PetitionStatus, locale: PetitionLocale, deadline?: Maybe<string>, updatedAt: string, isReadOnly: boolean, fields: Array<{ __typename?: 'PetitionField', isReadOnly: boolean, id: string, type: PetitionFieldType, title?: Maybe<string>, description?: Maybe<string>, validated: boolean, options: { [key: string]: any }, visibility?: Maybe<{ [key: string]: any }>, replies: Array<{ __typename?: 'PetitionFieldReply', id: string, content: { [key: string]: any }, status: PetitionFieldReplyStatus, createdAt: string, metadata: { [key: string]: any }, field?: Maybe<{ __typename?: 'PetitionField', type: PetitionFieldType }> }>, comments: Array<{ __typename?: 'PetitionFieldComment', id: string, isUnread: boolean, createdAt: string, content: string, isEdited: boolean, isInternal?: Maybe<boolean>, author?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> }>, attachments: Array<{ __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } }> }>, currentSignatureRequest?: Maybe<{ __typename?: 'PetitionSignatureRequest', id: string, status: PetitionSignatureRequestStatus }>, permissions: Array<{ __typename?: 'PetitionUserGroupPermission', permissionType: PetitionPermissionType, group: { __typename?: 'UserGroup', id: string, name: string } } | { __typename?: 'PetitionUserPermission', permissionType: PetitionPermissionType, user: { __typename?: 'User', id: string, fullName?: Maybe<string> } }>, signatureConfig?: Maybe<{ __typename?: 'SignatureConfig', timezone: string, review: boolean, provider: string, title: string, contacts: Array<Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }>> }>, signatureRequests?: Maybe<Array<{ __typename?: 'PetitionSignatureRequest', id: string, status: PetitionSignatureRequestStatus, signatureConfig: { __typename?: 'SignatureConfig', contacts: Array<Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }>> } }>>, myEffectivePermission?: Maybe<{ __typename?: 'EffectivePetitionUserPermission', isSubscribed: boolean }> };

export type PetitionReplies_PetitionFieldFragment = { __typename?: 'PetitionField', isReadOnly: boolean, id: string, type: PetitionFieldType, title?: Maybe<string>, description?: Maybe<string>, validated: boolean, options: { [key: string]: any }, visibility?: Maybe<{ [key: string]: any }>, replies: Array<{ __typename?: 'PetitionFieldReply', id: string, content: { [key: string]: any }, status: PetitionFieldReplyStatus, createdAt: string, metadata: { [key: string]: any }, field?: Maybe<{ __typename?: 'PetitionField', type: PetitionFieldType }> }>, comments: Array<{ __typename?: 'PetitionFieldComment', id: string, isUnread: boolean, createdAt: string, content: string, isEdited: boolean, isInternal?: Maybe<boolean>, author?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> }>, attachments: Array<{ __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } }> };

export type PetitionReplies_UserFragment = { __typename?: 'User', id: string, unreadNotificationIds: Array<string>, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole, hasPetitionSignature: boolean, hasPetitionPdfExport: boolean, hasInternalComments: boolean, hasExportCuatrecasas: boolean, organization: { __typename?: 'Organization', signatureIntegrations: Array<{ __typename?: 'OrgIntegration', label: string, value: string }> } };

export type PetitionReplies_updatePetitionMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  data: UpdatePetitionInput;
}>;


export type PetitionReplies_updatePetitionMutation = { updatePetition: { __typename?: 'Petition', id: string, name?: Maybe<string>, locale: PetitionLocale, deadline?: Maybe<string>, status: PetitionStatus, updatedAt: string, isReadOnly: boolean, myEffectivePermission?: Maybe<{ __typename?: 'EffectivePetitionUserPermission', isSubscribed: boolean }> } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string>, locale: PetitionLocale, isPublic: boolean, updatedAt: string, isReadOnly: boolean } };

export type PetitionReplies_validatePetitionFieldsMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  fieldIds: Array<Scalars['GID']> | Scalars['GID'];
  value: Scalars['Boolean'];
  validateRepliesWith?: Maybe<PetitionFieldReplyStatus>;
}>;


export type PetitionReplies_validatePetitionFieldsMutation = { validatePetitionFields: { __typename?: 'PetitionAndPartialFields', petition: { __typename?: 'Petition', id: string, status: PetitionStatus }, fields: Array<{ __typename?: 'PetitionField', id: string, validated: boolean, replies: Array<{ __typename?: 'PetitionFieldReply', id: string, status: PetitionFieldReplyStatus }> }> } };

export type PetitionReplies_fileUploadReplyDownloadLinkMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  replyId: Scalars['GID'];
  preview?: Maybe<Scalars['Boolean']>;
}>;


export type PetitionReplies_fileUploadReplyDownloadLinkMutation = { fileUploadReplyDownloadLink: { __typename?: 'FileUploadDownloadLinkResult', result: Result, url?: Maybe<string> } };

export type PetitionReplies_createPetitionFieldCommentMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  petitionFieldId: Scalars['GID'];
  content: Scalars['String'];
  isInternal?: Maybe<Scalars['Boolean']>;
  hasInternalComments: Scalars['Boolean'];
}>;


export type PetitionReplies_createPetitionFieldCommentMutation = { createPetitionFieldComment: { __typename?: 'PetitionField', id: string, title?: Maybe<string>, type: PetitionFieldType, comments: Array<{ __typename?: 'PetitionFieldComment', id: string, content: string, createdAt: string, isUnread: boolean, isEdited: boolean, isInternal?: Maybe<boolean>, author?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> }>, replies: Array<{ __typename?: 'PetitionFieldReply', id: string, content: { [key: string]: any } }> } };

export type PetitionReplies_updatePetitionFieldCommentMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  petitionFieldId: Scalars['GID'];
  petitionFieldCommentId: Scalars['GID'];
  content: Scalars['String'];
  hasInternalComments: Scalars['Boolean'];
}>;


export type PetitionReplies_updatePetitionFieldCommentMutation = { updatePetitionFieldComment: { __typename?: 'PetitionField', id: string, title?: Maybe<string>, type: PetitionFieldType, comments: Array<{ __typename?: 'PetitionFieldComment', id: string, content: string, createdAt: string, isUnread: boolean, isEdited: boolean, isInternal?: Maybe<boolean>, author?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> }>, replies: Array<{ __typename?: 'PetitionFieldReply', id: string, content: { [key: string]: any } }> } };

export type PetitionReplies_deletePetitionFieldCommentMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  petitionFieldId: Scalars['GID'];
  petitionFieldCommentId: Scalars['GID'];
  hasInternalComments: Scalars['Boolean'];
}>;


export type PetitionReplies_deletePetitionFieldCommentMutation = { deletePetitionFieldComment: { __typename?: 'PetitionField', id: string, title?: Maybe<string>, type: PetitionFieldType, comments: Array<{ __typename?: 'PetitionFieldComment', id: string, content: string, createdAt: string, isUnread: boolean, isEdited: boolean, isInternal?: Maybe<boolean>, author?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> }>, replies: Array<{ __typename?: 'PetitionFieldReply', id: string, content: { [key: string]: any } }> } };

export type PetitionReplies_updatePetitionFieldRepliesStatusMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  petitionFieldId: Scalars['GID'];
  petitionFieldReplyIds: Array<Scalars['GID']> | Scalars['GID'];
  status: PetitionFieldReplyStatus;
}>;


export type PetitionReplies_updatePetitionFieldRepliesStatusMutation = { updatePetitionFieldRepliesStatus: { __typename?: 'PetitionWithFieldAndReplies', petition: { __typename?: 'Petition', id: string, status: PetitionStatus }, field: { __typename?: 'PetitionField', id: string, validated: boolean }, replies: Array<{ __typename?: 'PetitionFieldReply', id: string, status: PetitionFieldReplyStatus }> } };

export type PetitionReplies_sendPetitionClosedNotificationMutationVariables = Exact<{
  petitionId: Scalars['GID'];
  emailBody: Scalars['JSON'];
  attachPdfExport: Scalars['Boolean'];
  pdfExportTitle?: Maybe<Scalars['String']>;
  force?: Maybe<Scalars['Boolean']>;
}>;


export type PetitionReplies_sendPetitionClosedNotificationMutation = { sendPetitionClosedNotification: { __typename?: 'Petition', id: string } };

export type PetitionRepliesUserQueryVariables = Exact<{ [key: string]: never; }>;


export type PetitionRepliesUserQuery = { me: { __typename?: 'User', id: string, unreadNotificationIds: Array<string>, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole, hasPetitionSignature: boolean, hasPetitionPdfExport: boolean, hasInternalComments: boolean, hasExportCuatrecasas: boolean, organization: { __typename?: 'Organization', signatureIntegrations: Array<{ __typename?: 'OrgIntegration', label: string, value: string }> } } };

export type PetitionRepliesQueryVariables = Exact<{
  id: Scalars['GID'];
  hasPetitionSignature: Scalars['Boolean'];
  hasInternalComments: Scalars['Boolean'];
}>;


export type PetitionRepliesQuery = { petition?: Maybe<{ __typename?: 'Petition', id: string, hasCommentsEnabled: boolean, name?: Maybe<string>, status: PetitionStatus, locale: PetitionLocale, deadline?: Maybe<string>, updatedAt: string, isReadOnly: boolean, fields: Array<{ __typename?: 'PetitionField', isReadOnly: boolean, id: string, type: PetitionFieldType, title?: Maybe<string>, description?: Maybe<string>, validated: boolean, options: { [key: string]: any }, visibility?: Maybe<{ [key: string]: any }>, replies: Array<{ __typename?: 'PetitionFieldReply', id: string, content: { [key: string]: any }, status: PetitionFieldReplyStatus, createdAt: string, metadata: { [key: string]: any }, field?: Maybe<{ __typename?: 'PetitionField', type: PetitionFieldType }> }>, comments: Array<{ __typename?: 'PetitionFieldComment', id: string, isUnread: boolean, createdAt: string, content: string, isEdited: boolean, isInternal?: Maybe<boolean>, author?: Maybe<{ __typename?: 'PetitionAccess', contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } | { __typename?: 'User', id: string, fullName?: Maybe<string>, status: UserStatus }> }>, attachments: Array<{ __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } }> }>, currentSignatureRequest?: Maybe<{ __typename?: 'PetitionSignatureRequest', id: string, status: PetitionSignatureRequestStatus }>, permissions: Array<{ __typename?: 'PetitionUserGroupPermission', permissionType: PetitionPermissionType, group: { __typename?: 'UserGroup', id: string, name: string } } | { __typename?: 'PetitionUserPermission', permissionType: PetitionPermissionType, user: { __typename?: 'User', id: string, fullName?: Maybe<string> } }>, signatureConfig?: Maybe<{ __typename?: 'SignatureConfig', timezone: string, review: boolean, provider: string, title: string, contacts: Array<Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }>> }>, signatureRequests?: Maybe<Array<{ __typename?: 'PetitionSignatureRequest', id: string, status: PetitionSignatureRequestStatus, signatureConfig: { __typename?: 'SignatureConfig', contacts: Array<Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }>> } }>>, myEffectivePermission?: Maybe<{ __typename?: 'EffectivePetitionUserPermission', isSubscribed: boolean }> } | { __typename?: 'PetitionTemplate' }> };

export type Petitions_PetitionBasePaginationFragment = { __typename?: 'PetitionBasePagination', totalCount: number, items: Array<{ __typename?: 'Petition', sentAt?: Maybe<string>, id: string, name?: Maybe<string>, createdAt: string, status: PetitionStatus, isReadOnly: boolean, accesses: Array<{ __typename?: 'PetitionAccess', status: PetitionAccessStatus, nextReminderAt?: Maybe<string>, contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }>, reminders: Array<{ __typename?: 'PetitionReminder', createdAt: string }> }>, permissions: Array<{ __typename?: 'PetitionUserGroupPermission', permissionType: PetitionPermissionType, group: { __typename?: 'UserGroup', id: string, name: string } } | { __typename?: 'PetitionUserPermission', permissionType: PetitionPermissionType, user: { __typename?: 'User', id: string, fullName?: Maybe<string> } }>, progress: { __typename?: 'PetitionProgress', validated: number, replied: number, optional: number, total: number }, tags: Array<{ __typename?: 'Tag', id: string, name: string, color: string }>, currentSignatureRequest?: Maybe<{ __typename?: 'PetitionSignatureRequest', status: PetitionSignatureRequestStatus }>, signatureConfig?: Maybe<{ __typename?: 'SignatureConfig', review: boolean }> } | { __typename?: 'PetitionTemplate', isPublic: boolean, descriptionExcerpt?: Maybe<string>, id: string, name?: Maybe<string>, createdAt: string, isReadOnly: boolean, permissions: Array<{ __typename?: 'PetitionUserGroupPermission', permissionType: PetitionPermissionType, group: { __typename?: 'UserGroup', id: string, name: string } } | { __typename?: 'PetitionUserPermission', permissionType: PetitionPermissionType, user: { __typename?: 'User', id: string, fullName?: Maybe<string> } }>, tags: Array<{ __typename?: 'Tag', id: string, name: string, color: string }> }> };

export type Petitions_PetitionBase_Petition_Fragment = { __typename?: 'Petition', sentAt?: Maybe<string>, id: string, name?: Maybe<string>, createdAt: string, status: PetitionStatus, isReadOnly: boolean, accesses: Array<{ __typename?: 'PetitionAccess', status: PetitionAccessStatus, nextReminderAt?: Maybe<string>, contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }>, reminders: Array<{ __typename?: 'PetitionReminder', createdAt: string }> }>, permissions: Array<{ __typename?: 'PetitionUserGroupPermission', permissionType: PetitionPermissionType, group: { __typename?: 'UserGroup', id: string, name: string } } | { __typename?: 'PetitionUserPermission', permissionType: PetitionPermissionType, user: { __typename?: 'User', id: string, fullName?: Maybe<string> } }>, progress: { __typename?: 'PetitionProgress', validated: number, replied: number, optional: number, total: number }, tags: Array<{ __typename?: 'Tag', id: string, name: string, color: string }>, currentSignatureRequest?: Maybe<{ __typename?: 'PetitionSignatureRequest', status: PetitionSignatureRequestStatus }>, signatureConfig?: Maybe<{ __typename?: 'SignatureConfig', review: boolean }> };

export type Petitions_PetitionBase_PetitionTemplate_Fragment = { __typename?: 'PetitionTemplate', isPublic: boolean, descriptionExcerpt?: Maybe<string>, id: string, name?: Maybe<string>, createdAt: string, isReadOnly: boolean, permissions: Array<{ __typename?: 'PetitionUserGroupPermission', permissionType: PetitionPermissionType, group: { __typename?: 'UserGroup', id: string, name: string } } | { __typename?: 'PetitionUserPermission', permissionType: PetitionPermissionType, user: { __typename?: 'User', id: string, fullName?: Maybe<string> } }>, tags: Array<{ __typename?: 'Tag', id: string, name: string, color: string }> };

export type Petitions_PetitionBaseFragment = Petitions_PetitionBase_Petition_Fragment | Petitions_PetitionBase_PetitionTemplate_Fragment;

export type Petitions_UserFragment = { __typename?: 'User', id: string, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole, hasPetitionSignature: boolean };

export type PetitionsUserQueryVariables = Exact<{ [key: string]: never; }>;


export type PetitionsUserQuery = { me: { __typename?: 'User', id: string, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole, hasPetitionSignature: boolean } };

export type PetitionsQueryVariables = Exact<{
  offset: Scalars['Int'];
  limit: Scalars['Int'];
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<QueryPetitions_OrderBy> | QueryPetitions_OrderBy>;
  hasPetitionSignature: Scalars['Boolean'];
  filters?: Maybe<PetitionFilter>;
}>;


export type NewPetition_PetitionTemplateFragment = {
  __typename?: "PetitionTemplate";
  id: string;
  name?: Maybe<string>;
  descriptionExcerpt?: Maybe<string>;
  locale: PetitionLocale;
  owner: { __typename?: "User"; id: string; fullName?: Maybe<string> };
  publicLink?: Maybe<{ __typename?: "PublicPetitionLink"; id: string; isActive: boolean }>;
};

export type NewPetition_PetitionTemplateFragment = { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string>, descriptionExcerpt?: Maybe<string>, locale: PetitionLocale, owner: { __typename?: 'User', id: string, fullName?: Maybe<string> } };

export type NewPetition_UserFragment = { __typename?: 'User', id: string, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole };

export type NewPetitionPublicTemplatesQueryVariables = Exact<{
  offset: Scalars['Int'];
  limit: Scalars['Int'];
  search?: Maybe<Scalars['String']>;
  locale?: Maybe<PetitionLocale>;
}>;

export type NewPetitionPublicTemplatesQuery = {
  publicTemplates: {
    __typename?: "PetitionTemplatePagination";
    totalCount: number;
    items: Array<{
      __typename?: "PetitionTemplate";
      id: string;
      name?: Maybe<string>;
      descriptionExcerpt?: Maybe<string>;
      locale: PetitionLocale;
      owner: { __typename?: "User"; id: string; fullName?: Maybe<string> };
      publicLink?: Maybe<{ __typename?: "PublicPetitionLink"; id: string; isActive: boolean }>;
    }>;
  };
};

export type NewPetitionPublicTemplatesQuery = { publicTemplates: { __typename?: 'PetitionTemplatePagination', totalCount: number, items: Array<{ __typename?: 'PetitionTemplate', id: string, name?: Maybe<string>, descriptionExcerpt?: Maybe<string>, locale: PetitionLocale, owner: { __typename?: 'User', id: string, fullName?: Maybe<string> } }> } };

export type NewPetitionTemplatesQueryVariables = Exact<{
  offset: Scalars['Int'];
  limit: Scalars['Int'];
  search?: Maybe<Scalars['String']>;
  filters?: Maybe<PetitionFilter>;
}>;

export type NewPetitionTemplatesQuery = {
  templates: {
    __typename?: "PetitionBasePagination";
    totalCount: number;
    items: Array<
      | { __typename?: "Petition" }
      | {
          __typename?: "PetitionTemplate";
          id: string;
          name?: Maybe<string>;
          descriptionExcerpt?: Maybe<string>;
          locale: PetitionLocale;
          owner: { __typename?: "User"; id: string; fullName?: Maybe<string> };
          publicLink?: Maybe<{ __typename?: "PublicPetitionLink"; id: string; isActive: boolean }>;
        }
    >;
  };
  hasTemplates: { __typename?: "PetitionBasePagination"; totalCount: number };
};

export type NewPetitionTemplatesQuery = { templates: { __typename?: 'PetitionBasePagination', totalCount: number, items: Array<{ __typename?: 'Petition' } | { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string>, descriptionExcerpt?: Maybe<string>, locale: PetitionLocale, owner: { __typename?: 'User', id: string, fullName?: Maybe<string> } }> }, hasTemplates: { __typename?: 'PetitionBasePagination', totalCount: number } };

export type NewPetitionUserQueryVariables = Exact<{ [key: string]: never; }>;


export type NewPetitionUserQuery = { me: { __typename?: 'User', id: string, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole } };

export type Account_UserFragment = { __typename?: 'User', firstName?: Maybe<string>, lastName?: Maybe<string>, isSsoUser: boolean, id: string, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole, hasApiTokens: boolean };

export type Account_updateAccountMutationVariables = Exact<{
  id: Scalars['GID'];
  data: UpdateUserInput;
}>;


export type Account_updateAccountMutation = { updateUser: { __typename?: 'User', id: string, firstName?: Maybe<string>, lastName?: Maybe<string>, fullName?: Maybe<string> } };

export type AccountQueryVariables = Exact<{ [key: string]: never; }>;


export type AccountQuery = { me: { __typename?: 'User', id: string, firstName?: Maybe<string>, lastName?: Maybe<string>, isSsoUser: boolean, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole, hasApiTokens: boolean } };

export type Settings_UserFragment = { __typename?: 'User', id: string, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole, hasApiTokens: boolean };

export type SettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type SettingsQuery = { me: { __typename?: 'User', id: string, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole, hasApiTokens: boolean } };

export type Security_updatePasswordMutationVariables = Exact<{
  password: Scalars['String'];
  newPassword: Scalars['String'];
}>;


export type Security_updatePasswordMutation = { changePassword: ChangePasswordResult };

export type SecurityQueryVariables = Exact<{ [key: string]: never; }>;


export type SecurityQuery = { me: { __typename?: 'User', isSsoUser: boolean, id: string, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole, hasApiTokens: boolean } };

export type Tokens_UserAuthenticationTokenFragment = { __typename?: 'UserAuthenticationToken', id: string, tokenName: string, createdAt: string, lastUsedAt?: Maybe<string> };

export type RevokeUserAuthTokenMutationVariables = Exact<{
  authTokenIds: Array<Scalars['GID']> | Scalars['GID'];
}>;


export type RevokeUserAuthTokenMutation = { revokeUserAuthToken: Result };

export type TokensQueryVariables = Exact<{
  offset: Scalars['Int'];
  limit: Scalars['Int'];
  search?: Maybe<Scalars['String']>;
  sortBy?: Maybe<Array<UserAuthenticationTokens_OrderBy> | UserAuthenticationTokens_OrderBy>;
}>;


export type TokensQuery = { me: { __typename?: 'User', id: string, onboardingStatus: { [key: string]: any }, fullName?: Maybe<string>, isSuperAdmin: boolean, role: OrganizationRole, hasApiTokens: boolean, authenticationTokens: { __typename?: 'UserAuthenticationTokenPagination', totalCount: number, items: Array<{ __typename?: 'UserAuthenticationToken', id: string, tokenName: string, createdAt: string, lastUsedAt?: Maybe<string> }> } } };

export type CurrentUserQueryVariables = Exact<{ [key: string]: never; }>;


export type CurrentUserQuery = { me: { __typename?: 'User', id: string, fullName?: Maybe<string>, email: string } };

export type Login_UserFragment = { __typename?: 'User', id: string, fullName?: Maybe<string>, email: string };

export type RecipientView_PublicPetitionAccessFragment = { __typename?: 'PublicPetitionAccess', petition?: Maybe<{ __typename?: 'PublicPetition', id: string, status: PetitionStatus, deadline?: Maybe<string>, hasCommentsEnabled: boolean, isRecipientViewContentsHidden: boolean, signatureStatus?: Maybe<PublicSignatureStatus>, fields: Array<{ __typename?: 'PublicPetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, options: { [key: string]: any }, optional: boolean, isReadOnly: boolean, commentCount: number, unreadCommentCount: number, validated: boolean, visibility?: Maybe<{ [key: string]: any }>, description?: Maybe<string>, multiple: boolean, replies: Array<{ __typename?: 'PublicPetitionFieldReply', id: string, content: { [key: string]: any }, status: PetitionFieldReplyStatus, createdAt: string, updatedAt: string }>, attachments: Array<{ __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } }> }>, signature?: Maybe<{ __typename?: 'PublicSignatureConfig', review: boolean, signers: Array<Maybe<{ __typename?: 'PublicContact', id: string, fullName?: Maybe<string>, email: string }>> }>, recipients: Array<{ __typename?: 'PublicContact', id: string, fullName?: Maybe<string>, firstName?: Maybe<string>, email: string }> }>, granter?: Maybe<{ __typename?: 'PublicUser', fullName?: Maybe<string>, id: string, firstName?: Maybe<string>, email: string, organization: { __typename?: 'PublicOrganization', name: string, identifier: string, logoUrl?: Maybe<string> } }>, contact?: Maybe<{ __typename?: 'PublicContact', id: string, fullName?: Maybe<string>, firstName?: Maybe<string>, email: string, lastName?: Maybe<string> }>, message?: Maybe<{ __typename?: 'PublicPetitionMessage', id: string, subject?: Maybe<string> }> };

export type RecipientView_PublicPetitionMessageFragment = { __typename?: 'PublicPetitionMessage', id: string, subject?: Maybe<string> };

export type RecipientView_PublicPetitionFragment = { __typename?: 'PublicPetition', id: string, status: PetitionStatus, deadline?: Maybe<string>, hasCommentsEnabled: boolean, isRecipientViewContentsHidden: boolean, signatureStatus?: Maybe<PublicSignatureStatus>, fields: Array<{ __typename?: 'PublicPetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, options: { [key: string]: any }, optional: boolean, isReadOnly: boolean, commentCount: number, unreadCommentCount: number, validated: boolean, visibility?: Maybe<{ [key: string]: any }>, description?: Maybe<string>, multiple: boolean, replies: Array<{ __typename?: 'PublicPetitionFieldReply', id: string, content: { [key: string]: any }, status: PetitionFieldReplyStatus, createdAt: string, updatedAt: string }>, attachments: Array<{ __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } }> }>, signature?: Maybe<{ __typename?: 'PublicSignatureConfig', review: boolean, signers: Array<Maybe<{ __typename?: 'PublicContact', id: string, fullName?: Maybe<string>, email: string }>> }>, recipients: Array<{ __typename?: 'PublicContact', id: string, fullName?: Maybe<string>, firstName?: Maybe<string>, email: string }> };

export type RecipientView_PublicContactFragment = { __typename?: 'PublicContact', id: string, fullName?: Maybe<string>, email: string };

export type RecipientView_PublicPetitionFieldFragment = { __typename?: 'PublicPetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, options: { [key: string]: any }, optional: boolean, isReadOnly: boolean, commentCount: number, unreadCommentCount: number, validated: boolean, description?: Maybe<string>, multiple: boolean, visibility?: Maybe<{ [key: string]: any }>, replies: Array<{ __typename?: 'PublicPetitionFieldReply', id: string, content: { [key: string]: any }, status: PetitionFieldReplyStatus, createdAt: string, updatedAt: string }>, attachments: Array<{ __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } }> };

export type RecipientView_PublicUserFragment = { __typename?: 'PublicUser', id: string, firstName?: Maybe<string>, fullName?: Maybe<string>, email: string, organization: { __typename?: 'PublicOrganization', name: string, identifier: string, logoUrl?: Maybe<string> } };

export type RecipientView_publicCompletePetitionMutationVariables = Exact<{
  keycode: Scalars['ID'];
  signer?: Maybe<PublicPetitionSignerData>;
}>;


export type RecipientView_publicCompletePetitionMutation = { publicCompletePetition: { __typename?: 'PublicPetition', id: string, status: PetitionStatus } };

export type PublicPetitionQueryVariables = Exact<{
  keycode: Scalars['ID'];
}>;


export type PublicPetitionQuery = { access?: Maybe<{ __typename?: 'PublicPetitionAccess', petition?: Maybe<{ __typename?: 'PublicPetition', id: string, status: PetitionStatus, deadline?: Maybe<string>, hasCommentsEnabled: boolean, isRecipientViewContentsHidden: boolean, signatureStatus?: Maybe<PublicSignatureStatus>, fields: Array<{ __typename?: 'PublicPetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, options: { [key: string]: any }, optional: boolean, isReadOnly: boolean, commentCount: number, unreadCommentCount: number, validated: boolean, visibility?: Maybe<{ [key: string]: any }>, description?: Maybe<string>, multiple: boolean, replies: Array<{ __typename?: 'PublicPetitionFieldReply', id: string, content: { [key: string]: any }, status: PetitionFieldReplyStatus, createdAt: string, updatedAt: string }>, attachments: Array<{ __typename?: 'PetitionFieldAttachment', id: string, file: { __typename?: 'FileUpload', filename: string, contentType: string, size: number, isComplete: boolean } }> }>, signature?: Maybe<{ __typename?: 'PublicSignatureConfig', review: boolean, signers: Array<Maybe<{ __typename?: 'PublicContact', id: string, fullName?: Maybe<string>, email: string }>> }>, recipients: Array<{ __typename?: 'PublicContact', id: string, fullName?: Maybe<string>, firstName?: Maybe<string>, email: string }> }>, granter?: Maybe<{ __typename?: 'PublicUser', fullName?: Maybe<string>, id: string, firstName?: Maybe<string>, email: string, organization: { __typename?: 'PublicOrganization', name: string, identifier: string, logoUrl?: Maybe<string> } }>, contact?: Maybe<{ __typename?: 'PublicContact', id: string, fullName?: Maybe<string>, firstName?: Maybe<string>, email: string, lastName?: Maybe<string> }>, message?: Maybe<{ __typename?: 'PublicPetitionMessage', id: string, subject?: Maybe<string> }> }> };

export type RecipientView_verifyPublicAccessMutationVariables = Exact<{
  token: Scalars['ID'];
  keycode: Scalars['ID'];
  ip?: Maybe<Scalars['String']>;
  userAgent?: Maybe<Scalars['String']>;
}>;


export type RecipientView_verifyPublicAccessMutation = { verifyPublicAccess: { __typename?: 'PublicAccessVerification', isAllowed: boolean, cookieName?: Maybe<string>, cookieValue?: Maybe<string>, email?: Maybe<string>, orgName?: Maybe<string>, orgLogoUrl?: Maybe<string> } };

export type publicSendVerificationCodeMutationVariables = Exact<{
  keycode: Scalars['ID'];
}>;


export type publicSendVerificationCodeMutation = { publicSendVerificationCode: { __typename?: 'VerificationCodeRequest', token: string, remainingAttempts: number, expiresAt: string } };

export type publicCheckVerificationCodeMutationVariables = Exact<{
  keycode: Scalars['ID'];
  token: Scalars['ID'];
  code: Scalars['String'];
}>;


export type publicCheckVerificationCodeMutation = { publicCheckVerificationCode: { __typename?: 'VerificationCodeCheck', result: Result, remainingAttempts?: Maybe<number> } };

export type OptOut_publicOptOutRemindersMutationVariables = Exact<{
  keycode: Scalars['ID'];
  reason: Scalars['String'];
  other: Scalars['String'];
}>;


export type OptOut_publicOptOutRemindersMutation = { publicOptOutReminders: { __typename?: 'PublicPetitionAccess', petition?: Maybe<{ __typename?: 'PublicPetition', id: string }> } };

export type OptOut_PublicPetitionAccessFragment = { __typename?: 'PublicPetitionAccess', granter?: Maybe<{ __typename?: 'PublicUser', id: string, organization: { __typename?: 'PublicOrganization', name: string, identifier: string, logoUrl?: Maybe<string> } }> };

export type OptOut_PublicUserFragment = { __typename?: 'PublicUser', id: string, organization: { __typename?: 'PublicOrganization', name: string, identifier: string, logoUrl?: Maybe<string> } };

export type PublicOptOutQueryVariables = Exact<{
  keycode: Scalars['ID'];
}>;


export type PublicPetitionLink_PublicPetitionLinkFragment = {
  __typename?: "PublicPetitionLink";
  id: string;
  title: string;
  description: string;
  organization: {
    __typename?: "PublicPetitionLinkOwnerOrganization";
    name: string;
    logoUrl?: Maybe<string>;
  };
};

export type PublicPetitionLink_publicCreateAndSendPetitionFromPublicLinkMutationVariables = Exact<{
  publicPetitionLinkId: Scalars["GID"];
  contactFirstName: Scalars["String"];
  contactLastName: Scalars["String"];
  contactEmail: Scalars["String"];
  force?: Maybe<Scalars["Boolean"]>;
}>;

export type PublicPetitionLink_publicCreateAndSendPetitionFromPublicLinkMutation = {
  publicCreateAndSendPetitionFromPublicLink: Result;
};

export type PublicPetitionLink_publicSendReminderMutationVariables = Exact<{
  publicPetitionLinkId: Scalars["GID"];
  contactEmail: Scalars["String"];
}>;

export type PublicPetitionLink_publicSendReminderMutation = { publicSendReminder: Result };

export type PublicTemplateLink_publicPetitionLinkBySlugQueryVariables = Exact<{
  slug: Scalars["String"];
}>;

export type PublicTemplateLink_publicPetitionLinkBySlugQuery = {
  publicPetitionLinkBySlug?: Maybe<{
    __typename?: "PublicPetitionLink";
    id: string;
    title: string;
    description: string;
    organization: {
      __typename?: "PublicPetitionLinkOwnerOrganization";
      name: string;
      logoUrl?: Maybe<string>;
    };
  }>;
};

export type PetitionPdf_PetitionFragment = {
  __typename?: "Petition";
  id: string;
  name?: Maybe<string>;
  fields: Array<{
    __typename?: "PetitionField";
    id: string;
    type: PetitionFieldType;
    title?: Maybe<string>;
    options: { [key: string]: any };
    description?: Maybe<string>;
    validated: boolean;
    visibility?: Maybe<{ [key: string]: any }>;
    replies: Array<{
      __typename?: "PetitionFieldReply";
      id: string;
      content: { [key: string]: any };
    }>;
  }>;
  organization: { __typename?: "Organization"; name: string; logoUrl?: Maybe<string> };
  currentSignatureRequest?: Maybe<{
    __typename?: "PetitionSignatureRequest";
    signatureConfig: {
      __typename?: "SignatureConfig";
      timezone: string;
      contacts: Array<
        Maybe<{ __typename?: "Contact"; id: string; fullName?: Maybe<string>; email: string }>
      >;
    };
  }>;
};

export type PetitionPdf_PetitionFragment = { __typename?: 'Petition', id: string, name?: Maybe<string>, fields: Array<{ __typename?: 'PetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, options: { [key: string]: any }, description?: Maybe<string>, validated: boolean, visibility?: Maybe<{ [key: string]: any }>, replies: Array<{ __typename?: 'PetitionFieldReply', id: string, content: { [key: string]: any } }> }>, organization: { __typename?: 'Organization', name: string, logoUrl?: Maybe<string> }, currentSignatureRequest?: Maybe<{ __typename?: 'PetitionSignatureRequest', signatureConfig: { __typename?: 'SignatureConfig', timezone: string, contacts: Array<Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }>> } }> };

export type PetitionPdf_PetitionFieldFragment = { __typename?: 'PetitionField', id: string, type: PetitionFieldType, title?: Maybe<string>, options: { [key: string]: any }, description?: Maybe<string>, validated: boolean, visibility?: Maybe<{ [key: string]: any }>, replies: Array<{ __typename?: 'PetitionFieldReply', id: string, content: { [key: string]: any } }> };

export type PdfViewPetitionQueryVariables = Exact<{
  token: Scalars['String'];
}>;


export type LandingTemplateDetails_LandingTemplateFragment = {
  __typename?: "LandingTemplate";
  id: string;
  name?: Maybe<string>;
  slug: string;
  locale: PetitionLocale;
  imageUrl?: Maybe<string>;
  backgroundColor?: Maybe<string>;
  categories?: Maybe<Array<string>>;
  ownerFullName: string;
  ownerAvatarUrl?: Maybe<string>;
  organizationName: string;
  fieldCount: number;
  hasConditionals: boolean;
  descriptionHtml?: Maybe<string>;
  shortDescription?: Maybe<string>;
  updatedAt: string;
  fields: Array<{
    __typename?: "LandingTemplateField";
    id: string;
    type: PetitionFieldType;
    title?: Maybe<string>;
  }>;
};

export type LandingTemplateDetails_LandingTemplateFragment = { __typename?: 'LandingTemplate', id: string, name?: Maybe<string>, slug: string, locale: PetitionLocale, imageUrl?: Maybe<string>, backgroundColor?: Maybe<string>, categories?: Maybe<Array<string>>, ownerFullName: string, ownerAvatarUrl?: Maybe<string>, organizationName: string, fieldCount: number, hasConditionals: boolean, descriptionHtml?: Maybe<string>, shortDescription?: Maybe<string>, updatedAt: string };

export type LandingTemplateDetails_landingTemplateBySlugQueryVariables = Exact<{
  slug: Scalars['String'];
}>;

export type LandingTemplateDetails_landingTemplateBySlugQuery = {
  landingTemplateBySlug?: Maybe<{
    __typename?: "LandingTemplate";
    id: string;
    name?: Maybe<string>;
    slug: string;
    locale: PetitionLocale;
    imageUrl?: Maybe<string>;
    backgroundColor?: Maybe<string>;
    categories?: Maybe<Array<string>>;
    ownerFullName: string;
    ownerAvatarUrl?: Maybe<string>;
    organizationName: string;
    fieldCount: number;
    hasConditionals: boolean;
    descriptionHtml?: Maybe<string>;
    shortDescription?: Maybe<string>;
    updatedAt: string;
    fields: Array<{
      __typename?: "LandingTemplateField";
      id: string;
      type: PetitionFieldType;
      title?: Maybe<string>;
    }>;
  }>;
};

export type LandingTemplateDetails_landingTemplateBySlugQuery = { landingTemplateBySlug?: Maybe<{ __typename?: 'LandingTemplate', id: string, name?: Maybe<string>, slug: string, locale: PetitionLocale, imageUrl?: Maybe<string>, backgroundColor?: Maybe<string>, categories?: Maybe<Array<string>>, ownerFullName: string, ownerAvatarUrl?: Maybe<string>, organizationName: string, fieldCount: number, hasConditionals: boolean, descriptionHtml?: Maybe<string>, shortDescription?: Maybe<string>, updatedAt: string }> };

export type LandingTemplateDetails_landingTemplatesQueryVariables = Exact<{
  offset: Scalars['Int'];
  limit: Scalars['Int'];
  locale: PetitionLocale;
  categories?: Maybe<Array<Scalars['String']> | Scalars['String']>;
}>;


export type LandingTemplateDetails_landingTemplatesQuery = { landingTemplates: { __typename?: 'LandingTemplatePagination', totalCount: number, items: Array<{ __typename?: 'LandingTemplate', id: string, locale: PetitionLocale, name?: Maybe<string>, slug: string, imageUrl?: Maybe<string>, backgroundColor?: Maybe<string>, ownerFullName: string, organizationName: string }> } };

export type LandingTemplatesCategory_landingTemplatesSamplesQueryVariables = Exact<{
  locale: PetitionLocale;
}>;


export type LandingTemplatesCategory_landingTemplatesSamplesQuery = { landingTemplatesSamples: Array<{ __typename?: 'LandingTemplateSample', category: string, templates: { __typename?: 'LandingTemplatePagination', totalCount: number } }> };

export type LandingTemplatesCategory_landingTemplatesQueryVariables = Exact<{
  offset: Scalars['Int'];
  limit: Scalars['Int'];
  category: Scalars['String'];
  locale: PetitionLocale;
}>;


export type LandingTemplatesCategory_landingTemplatesQuery = { landingTemplates: { __typename?: 'LandingTemplatePagination', totalCount: number, items: Array<{ __typename?: 'LandingTemplate', id: string, locale: PetitionLocale, name?: Maybe<string>, slug: string, imageUrl?: Maybe<string>, backgroundColor?: Maybe<string>, ownerFullName: string, organizationName: string }> } };

export type LandingTemplates_landingTemplatesSamplesQueryVariables = Exact<{
  offset: Scalars['Int'];
  limit: Scalars['Int'];
  locale: PetitionLocale;
}>;


export type LandingTemplates_landingTemplatesSamplesQuery = { landingTemplatesSamples: Array<{ __typename?: 'LandingTemplateSample', category: string, templates: { __typename?: 'LandingTemplatePagination', totalCount: number, items: Array<{ __typename?: 'LandingTemplate', id: string, locale: PetitionLocale, name?: Maybe<string>, slug: string, imageUrl?: Maybe<string>, backgroundColor?: Maybe<string>, ownerFullName: string, organizationName: string }> } }> };

export type Thanks_PetitionLogoQueryVariables = Exact<{
  id: Scalars['GID'];
}>;


export type Thanks_PetitionLogoQuery = { publicOrgLogoUrl?: Maybe<string> };

export type GetMyIdQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyIdQuery = { me: { __typename?: 'User', id: string } };

export type useFieldVisibility_PublicPetitionFieldFragment = { __typename?: 'PublicPetitionField', id: string, type: PetitionFieldType, options: { [key: string]: any }, visibility?: Maybe<{ [key: string]: any }>, replies: Array<{ __typename?: 'PublicPetitionFieldReply', id: string, content: { [key: string]: any } }> };

export type useFieldVisibility_PetitionFieldFragment = { __typename?: 'PetitionField', id: string, type: PetitionFieldType, options: { [key: string]: any }, visibility?: Maybe<{ [key: string]: any }>, replies: Array<{ __typename?: 'PetitionFieldReply', id: string, content: { [key: string]: any } }> };

export type filterPetitionFields_PetitionFieldFragment = { __typename?: 'PetitionField', id: string, isReadOnly: boolean, validated: boolean, comments: Array<{ __typename?: 'PetitionFieldComment', id: string }>, replies: Array<{ __typename?: 'PetitionFieldReply', id: string }> };

export type useClonePetitions_clonePetitionsMutationVariables = Exact<{
  petitionIds: Array<Scalars['GID']> | Scalars['GID'];
}>;


export type useClonePetitions_clonePetitionsMutation = { clonePetitions: Array<{ __typename?: 'Petition', id: string } | { __typename?: 'PetitionTemplate', id: string }> };

export type useCreateContact_createContactMutationVariables = Exact<{
  data: CreateContactInput;
}>;


export type useCreateContact_createContactMutation = { createContact: { __typename?: 'Contact', id: string, email: string, firstName?: Maybe<string>, lastName?: Maybe<string>, fullName?: Maybe<string> } };

export type useCreatePetition_createPetitionMutationVariables = Exact<{
  name?: Maybe<Scalars['String']>;
  locale: PetitionLocale;
  petitionId?: Maybe<Scalars['GID']>;
  type?: Maybe<PetitionBaseType>;
}>;


export type useCreatePetition_createPetitionMutation = { createPetition: { __typename?: 'Petition', id: string } | { __typename?: 'PetitionTemplate', id: string } };

export type useDeletePetitions_deletePetitionsMutationVariables = Exact<{
  ids: Array<Scalars['GID']> | Scalars['GID'];
}>;


export type useDeletePetitions_deletePetitionsMutation = { deletePetitions: Result };

export type ConfirmDeletePetitionsDialog_PetitionBase_Petition_Fragment = { __typename?: 'Petition', id: string, name?: Maybe<string> };

export type ConfirmDeletePetitionsDialog_PetitionBase_PetitionTemplate_Fragment = { __typename?: 'PetitionTemplate', id: string, name?: Maybe<string> };

export type ConfirmDeletePetitionsDialog_PetitionBaseFragment = ConfirmDeletePetitionsDialog_PetitionBase_Petition_Fragment | ConfirmDeletePetitionsDialog_PetitionBase_PetitionTemplate_Fragment;

export type useUpdateIsReadNotificationMutationVariables = Exact<{
  petitionUserNotificationIds?: Maybe<Array<Scalars['GID']> | Scalars['GID']>;
  filter?: Maybe<PetitionUserNotificationFilter>;
  petitionIds?: Maybe<Array<Scalars['GID']> | Scalars['GID']>;
  petitionFieldCommentIds?: Maybe<Array<Scalars['GID']> | Scalars['GID']>;
  isRead: Scalars['Boolean'];
}>;

export type useUpdateIsReadNotificationMutation = {
  updatePetitionUserNotificationReadStatus: Array<
    | {
        __typename?: "AccessActivatedFromPublicPetitionLinkUserNotification";
        id: string;
        isRead: boolean;
      }
    | {
        __typename?: "CommentCreatedUserNotification";
        id: string;
        isRead: boolean;
        comment: { __typename?: "PetitionFieldComment"; id: string };
      }
    | { __typename?: "MessageEmailBouncedUserNotification"; id: string; isRead: boolean }
    | { __typename?: "PetitionCompletedUserNotification"; id: string; isRead: boolean }
    | { __typename?: "PetitionSharedUserNotification"; id: string; isRead: boolean }
    | { __typename?: "ReminderEmailBouncedUserNotification"; id: string; isRead: boolean }
    | { __typename?: "RemindersOptOutNotification"; id: string; isRead: boolean }
    | { __typename?: "SignatureCancelledUserNotification"; id: string; isRead: boolean }
    | { __typename?: "SignatureCompletedUserNotification"; id: string; isRead: boolean }
  >;
};

export type useUpdateIsReadNotificationMutation = { updatePetitionUserNotificationReadStatus: Array<{ __typename?: 'CommentCreatedUserNotification', id: string, isRead: boolean, comment: { __typename?: 'PetitionFieldComment', id: string } } | { __typename?: 'MessageEmailBouncedUserNotification', id: string, isRead: boolean } | { __typename?: 'PetitionCompletedUserNotification', id: string, isRead: boolean } | { __typename?: 'PetitionSharedUserNotification', id: string, isRead: boolean } | { __typename?: 'ReminderEmailBouncedUserNotification', id: string, isRead: boolean } | { __typename?: 'RemindersOptOutNotification', id: string, isRead: boolean } | { __typename?: 'SignatureCancelledUserNotification', id: string, isRead: boolean } | { __typename?: 'SignatureCompletedUserNotification', id: string, isRead: boolean }> };

export type useUpdateIsReadNotification_UserFragment = { __typename?: 'User', id: string, unreadNotificationIds: Array<string> };

export type useUpdateIsReadNotification_PetitionFieldCommentFragment = { __typename?: 'PetitionFieldComment', id: string, isUnread: boolean };

export type uploadFile_AWSPresignedPostDataFragment = { __typename?: 'AWSPresignedPostData', url: string, fields: { [key: string]: any } };

export type useFilenamePlaceholdersRename_PetitionFieldFragment = { __typename?: 'PetitionField', id: string, type: PetitionFieldType, title?: Maybe<string> };

export type useFilenamePlaceholdersRename_PetitionFieldReplyFragment = { __typename?: 'PetitionFieldReply', content: { [key: string]: any } };

export type usePetitionCurrentSignatureStatus_PetitionFragment = { __typename?: 'Petition', status: PetitionStatus, currentSignatureRequest?: Maybe<{ __typename?: 'PetitionSignatureRequest', status: PetitionSignatureRequestStatus }>, signatureConfig?: Maybe<{ __typename?: 'SignatureConfig', review: boolean }> };

export type usePetitionsTableColumns_PetitionBase_Petition_Fragment = { __typename?: 'Petition', sentAt?: Maybe<string>, id: string, name?: Maybe<string>, createdAt: string, status: PetitionStatus, isReadOnly: boolean, accesses: Array<{ __typename?: 'PetitionAccess', status: PetitionAccessStatus, nextReminderAt?: Maybe<string>, contact?: Maybe<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }>, reminders: Array<{ __typename?: 'PetitionReminder', createdAt: string }> }>, permissions: Array<{ __typename?: 'PetitionUserGroupPermission', permissionType: PetitionPermissionType, group: { __typename?: 'UserGroup', id: string, name: string } } | { __typename?: 'PetitionUserPermission', permissionType: PetitionPermissionType, user: { __typename?: 'User', id: string, fullName?: Maybe<string> } }>, progress: { __typename?: 'PetitionProgress', validated: number, replied: number, optional: number, total: number }, tags: Array<{ __typename?: 'Tag', id: string, name: string, color: string }>, currentSignatureRequest?: Maybe<{ __typename?: 'PetitionSignatureRequest', status: PetitionSignatureRequestStatus }>, signatureConfig?: Maybe<{ __typename?: 'SignatureConfig', review: boolean }> };

export type usePetitionsTableColumns_PetitionBase_PetitionTemplate_Fragment = { __typename?: 'PetitionTemplate', descriptionExcerpt?: Maybe<string>, id: string, name?: Maybe<string>, createdAt: string, isReadOnly: boolean, permissions: Array<{ __typename?: 'PetitionUserGroupPermission', permissionType: PetitionPermissionType, group: { __typename?: 'UserGroup', id: string, name: string } } | { __typename?: 'PetitionUserPermission', permissionType: PetitionPermissionType, user: { __typename?: 'User', id: string, fullName?: Maybe<string> } }>, tags: Array<{ __typename?: 'Tag', id: string, name: string, color: string }> };

export type usePetitionsTableColumns_PetitionBaseFragment = usePetitionsTableColumns_PetitionBase_Petition_Fragment | usePetitionsTableColumns_PetitionBase_PetitionTemplate_Fragment;

export type usePetitionsTableColumns_UserFragment = { __typename?: 'User', hasPetitionSignature: boolean };

export type PetitionComposeSearchContactsQueryVariables = Exact<{
  search?: Maybe<Scalars['String']>;
  exclude?: Maybe<Array<Scalars['GID']> | Scalars['GID']>;
}>;


export type PetitionComposeSearchContactsQuery = { contacts: { __typename?: 'ContactPagination', items: Array<{ __typename?: 'Contact', id: string, fullName?: Maybe<string>, email: string }> } };

export type useSettingsSections_UserFragment = { __typename?: 'User', hasApiTokens: boolean };

export type validatePetitionFields_PetitionFieldFragment = { __typename?: 'PetitionField', id: string, title?: Maybe<string>, type: PetitionFieldType, options: { [key: string]: any } };

export const ContactListPopover_ContactFragmentDoc = gql`
    fragment ContactListPopover_Contact on Contact {
  id
  email
  fullName
}
    `;
export const ContactListPopover_PublicContactFragmentDoc = gql`
    fragment ContactListPopover_PublicContact on PublicContact {
  id
  email
  fullName
}
    `;
export const Tag_TagFragmentDoc = gql`
    fragment Tag_Tag on Tag {
  name
  color
}
    `;
export const TagEditDialog_TagFragmentDoc = gql`
    fragment TagEditDialog_Tag on Tag {
  id
  ...Tag_Tag
  createdAt
}
    ${Tag_TagFragmentDoc}`;
export const UserAvatar_UserFragmentDoc = gql`
    fragment UserAvatar_User on User {
  fullName
  avatarUrl
}
    `;
export const UserListPopover_UserGroupFragmentDoc = gql`
    fragment UserListPopover_UserGroup on UserGroup {
  id
  name
}
    `;
export const UserSelect_UserFragmentDoc = gql`
    fragment UserSelect_User on User {
  id
  fullName
  email
}
    `;
export const UserSelect_UserGroupFragmentDoc = gql`
    fragment UserSelect_UserGroup on UserGroup {
  id
  name
  members {
    user {
      ...UserSelect_User
    }
  }
}
    ${UserSelect_UserFragmentDoc}`;
export const PetitionTemplateHeader_UserFragmentDoc = gql`
    fragment PetitionTemplateHeader_User on User {
  id
}
    `;
export const PetitionUserNotification_PetitionUserNotificationFragmentDoc = gql`
    fragment PetitionUserNotification_PetitionUserNotification on PetitionUserNotification {
  id
  petition {
    id
    name
  }
  createdAt
  isRead
}
    `;
export const UserReference_UserFragmentDoc = gql`
    fragment UserReference_User on User {
  id
  fullName
  status
}
    `;
export const ContactLink_ContactFragmentDoc = gql`
    fragment ContactLink_Contact on Contact {
  id
  fullName
  email
}
    `;
export const CommentCreatedUserNotification_CommentCreatedUserNotificationFragmentDoc = gql`
    fragment CommentCreatedUserNotification_CommentCreatedUserNotification on CommentCreatedUserNotification {
  ...PetitionUserNotification_PetitionUserNotification
  field {
    id
    title
  }
  comment {
    id
    isInternal
    author {
      ... on User {
        ...UserReference_User
      }
      ... on PetitionAccess {
        contact {
          ...ContactLink_Contact
        }
      }
    }
  }
}
    ${PetitionUserNotification_PetitionUserNotificationFragmentDoc}
${UserReference_UserFragmentDoc}
${ContactLink_ContactFragmentDoc}`;
export const MessageEmailBouncedUserNotification_MessageEmailBouncedUserNotificationFragmentDoc = gql`
    fragment MessageEmailBouncedUserNotification_MessageEmailBouncedUserNotification on MessageEmailBouncedUserNotification {
  ...PetitionUserNotification_PetitionUserNotification
  access {
    contact {
      ...ContactLink_Contact
    }
  }
}
    ${PetitionUserNotification_PetitionUserNotificationFragmentDoc}
${ContactLink_ContactFragmentDoc}`;
export const ReminderEmailBouncedUserNotification_ReminderEmailBouncedUserNotificationFragmentDoc = gql`
    fragment ReminderEmailBouncedUserNotification_ReminderEmailBouncedUserNotification on ReminderEmailBouncedUserNotification {
  ...PetitionUserNotification_PetitionUserNotification
  access {
    contact {
      ...ContactLink_Contact
    }
  }
}
    ${PetitionUserNotification_PetitionUserNotificationFragmentDoc}
${ContactLink_ContactFragmentDoc}`;
export const PetitionCompletedUserNotification_PetitionCompletedUserNotificationFragmentDoc = gql`
    fragment PetitionCompletedUserNotification_PetitionCompletedUserNotification on PetitionCompletedUserNotification {
  ...PetitionUserNotification_PetitionUserNotification
  access {
    contact {
      ...ContactLink_Contact
    }
  }
}
    ${PetitionUserNotification_PetitionUserNotificationFragmentDoc}
${ContactLink_ContactFragmentDoc}`;
export const PetitionSharedUserNotification_PetitionSharedUserNotificationFragmentDoc = gql`
    fragment PetitionSharedUserNotification_PetitionSharedUserNotification on PetitionSharedUserNotification {
  ...PetitionUserNotification_PetitionUserNotification
  petition {
    __typename
  }
  owner {
    ...UserReference_User
  }
  sharedWith {
    ... on User {
      ...UserReference_User
    }
    ... on UserGroup {
      id
      name
    }
  }
  permissionType
}
    ${PetitionUserNotification_PetitionUserNotificationFragmentDoc}
${UserReference_UserFragmentDoc}`;
export const SignatureCancelledUserNotification_SignatureCancelledUserNotificationFragmentDoc = gql`
    fragment SignatureCancelledUserNotification_SignatureCancelledUserNotification on SignatureCancelledUserNotification {
  ...PetitionUserNotification_PetitionUserNotification
}
    ${PetitionUserNotification_PetitionUserNotificationFragmentDoc}`;
export const SignatureCompletedUserNotification_SignatureCompletedUserNotificationFragmentDoc = gql`
    fragment SignatureCompletedUserNotification_SignatureCompletedUserNotification on SignatureCompletedUserNotification {
  ...PetitionUserNotification_PetitionUserNotification
}
    ${PetitionUserNotification_PetitionUserNotificationFragmentDoc}`;
export const RemindersOptOutNotification_RemindersOptOutNotificationFragmentDoc = gql`
    fragment RemindersOptOutNotification_RemindersOptOutNotification on RemindersOptOutNotification {
  ...PetitionUserNotification_PetitionUserNotification
  access {
    contact {
      ...ContactLink_Contact
    }
  }
  ${PetitionUserNotification_PetitionUserNotificationFragmentDoc}
  ${ContactLink_ContactFragmentDoc}
`;
export const AccessActivatedFromLinkNotification_AccessActivatedFromPublicPetitionLinkUserNotificationFragmentDoc = gql`
  fragment AccessActivatedFromLinkNotification_AccessActivatedFromPublicPetitionLinkUserNotification on AccessActivatedFromPublicPetitionLinkUserNotification {
    ...PetitionUserNotification_PetitionUserNotification
    access {
      contact {
        ...ContactLink_Contact
      }
    }
  }
  ${PetitionUserNotification_PetitionUserNotificationFragmentDoc}
  ${ContactLink_ContactFragmentDoc}
`;
export const NotificationsList_PetitionUserNotificationFragmentDoc = gql`
  fragment NotificationsList_PetitionUserNotification on PetitionUserNotification {
    ... on CommentCreatedUserNotification {
      ...CommentCreatedUserNotification_CommentCreatedUserNotification
    }
    ... on MessageEmailBouncedUserNotification {
      ...MessageEmailBouncedUserNotification_MessageEmailBouncedUserNotification
    }
    ... on ReminderEmailBouncedUserNotification {
      ...ReminderEmailBouncedUserNotification_ReminderEmailBouncedUserNotification
    }
    ... on PetitionCompletedUserNotification {
      ...PetitionCompletedUserNotification_PetitionCompletedUserNotification
    }
    ... on PetitionSharedUserNotification {
      ...PetitionSharedUserNotification_PetitionSharedUserNotification
    }
    ... on SignatureCancelledUserNotification {
      ...SignatureCancelledUserNotification_SignatureCancelledUserNotification
    }
    ... on SignatureCompletedUserNotification {
      ...SignatureCompletedUserNotification_SignatureCompletedUserNotification
    }
    ... on RemindersOptOutNotification {
      ...RemindersOptOutNotification_RemindersOptOutNotification
    }
    ... on AccessActivatedFromPublicPetitionLinkUserNotification {
      ...AccessActivatedFromLinkNotification_AccessActivatedFromPublicPetitionLinkUserNotification
    }
  }
  ${CommentCreatedUserNotification_CommentCreatedUserNotificationFragmentDoc}
  ${MessageEmailBouncedUserNotification_MessageEmailBouncedUserNotificationFragmentDoc}
  ${ReminderEmailBouncedUserNotification_ReminderEmailBouncedUserNotificationFragmentDoc}
  ${PetitionCompletedUserNotification_PetitionCompletedUserNotificationFragmentDoc}
  ${PetitionSharedUserNotification_PetitionSharedUserNotificationFragmentDoc}
  ${SignatureCancelledUserNotification_SignatureCancelledUserNotificationFragmentDoc}
  ${SignatureCompletedUserNotification_SignatureCompletedUserNotificationFragmentDoc}
  ${RemindersOptOutNotification_RemindersOptOutNotificationFragmentDoc}
  ${AccessActivatedFromLinkNotification_AccessActivatedFromPublicPetitionLinkUserNotificationFragmentDoc}
`;
export const NotificationsDrawer_PetitionUserNotificationFragmentDoc = gql`
  fragment NotificationsDrawer_PetitionUserNotification on PetitionUserNotification {
    ...NotificationsList_PetitionUserNotification
  }
  ... on ReminderEmailBouncedUserNotification {
    ...ReminderEmailBouncedUserNotification_ReminderEmailBouncedUserNotification
  }
  ... on PetitionCompletedUserNotification {
    ...PetitionCompletedUserNotification_PetitionCompletedUserNotification
  }
  ... on PetitionSharedUserNotification {
    ...PetitionSharedUserNotification_PetitionSharedUserNotification
  }
  ... on SignatureCancelledUserNotification {
    ...SignatureCancelledUserNotification_SignatureCancelledUserNotification
  }
  ... on SignatureCompletedUserNotification {
    ...SignatureCompletedUserNotification_SignatureCompletedUserNotification
  }
  ... on RemindersOptOutNotification {
    ...RemindersOptOutNotification_RemindersOptOutNotification
  }
}
    ${CommentCreatedUserNotification_CommentCreatedUserNotificationFragmentDoc}
${MessageEmailBouncedUserNotification_MessageEmailBouncedUserNotificationFragmentDoc}
${ReminderEmailBouncedUserNotification_ReminderEmailBouncedUserNotificationFragmentDoc}
${PetitionCompletedUserNotification_PetitionCompletedUserNotificationFragmentDoc}
${PetitionSharedUserNotification_PetitionSharedUserNotificationFragmentDoc}
${SignatureCancelledUserNotification_SignatureCancelledUserNotificationFragmentDoc}
${SignatureCompletedUserNotification_SignatureCompletedUserNotificationFragmentDoc}
${RemindersOptOutNotification_RemindersOptOutNotificationFragmentDoc}`;
export const NotificationsDrawer_PetitionUserNotificationFragmentDoc = gql`
    fragment NotificationsDrawer_PetitionUserNotification on PetitionUserNotification {
  ...NotificationsList_PetitionUserNotification
}
    ${NotificationsList_PetitionUserNotificationFragmentDoc}`;
export const OrganizationGroupListTableHeader_UserFragmentDoc = gql`
    fragment OrganizationGroupListTableHeader_User on User {
  id
  role
}
    `;
export const OrganizationGroupsListTableHeader_UserFragmentDoc = gql`
    fragment OrganizationGroupsListTableHeader_User on User {
  id
  role
}
    `;
export const OrganizationUsersListTableHeader_UserFragmentDoc = gql`
    fragment OrganizationUsersListTableHeader_User on User {
  id
  role
}
    `;
export const PetitionSharingModal_UserFragmentDoc = gql`
    fragment PetitionSharingModal_User on User {
  id
  email
  fullName
  ...UserSelect_User
}
    ${UserSelect_UserFragmentDoc}`;
export const PetitionSharingModal_PetitionUserPermissionFragmentDoc = gql`
    fragment PetitionSharingModal_PetitionUserPermission on PetitionUserPermission {
  permissionType
  user {
    ...PetitionSharingModal_User
  }
}
    ${PetitionSharingModal_UserFragmentDoc}`;
export const PetitionSharingModal_PetitionUserGroupPermissionFragmentDoc = gql`
    fragment PetitionSharingModal_PetitionUserGroupPermission on PetitionUserGroupPermission {
  permissionType
  group {
    id
    name
    members {
      user {
        ...PetitionSharingModal_User
      }
    }
  }
}
    ${PetitionSharingModal_UserFragmentDoc}`;
export const PetitionSharingModal_PetitionFragmentDoc = gql`
    fragment PetitionSharingModal_Petition on PetitionBase {
  id
  name
  permissions {
    ... on PetitionUserPermission {
      ...PetitionSharingModal_PetitionUserPermission
    }
    ... on PetitionUserGroupPermission {
      ...PetitionSharingModal_PetitionUserGroupPermission
    }
  }
}
    ${PetitionSharingModal_PetitionUserPermissionFragmentDoc}
${PetitionSharingModal_PetitionUserGroupPermissionFragmentDoc}`;
export const PetitionSharingModal_UserGroupFragmentDoc = gql`
    fragment PetitionSharingModal_UserGroup on UserGroup {
  id
  name
  members {
    user {
      ...PetitionSharingModal_User
    }
  }
}
    ${PetitionSharingModal_UserFragmentDoc}`;
export const TemplateDetailsDialog_PetitionTemplateFragmentDoc = gql`
    fragment TemplateDetailsDialog_PetitionTemplate on PetitionTemplate {
  id
  descriptionHtml
  name
  fields {
    id
    title
    type
    options
  }
  owner {
    id
    organization {
      id
      name
    }
    owner {
      id
      organization {
        id
        name
      }
      fullName
    }
    myEffectivePermission {
      permissionType
    }
    publicLink {
      id
      isActive
      slug
    }
    updatedAt
  }
  myEffectivePermission {
    permissionType
  }
  updatedAt
}
    `;
export const PetitionComposeFieldAttachment_PetitionFieldAttachmentFragmentDoc = gql`
    fragment PetitionComposeFieldAttachment_PetitionFieldAttachment on PetitionFieldAttachment {
  id
  file {
    filename
    contentType
    size
    isComplete
  }
}
    `;
export const PetitionComposeField_PetitionFieldAttachmentFragmentDoc = gql`
    fragment PetitionComposeField_PetitionFieldAttachment on PetitionFieldAttachment {
  ...PetitionComposeFieldAttachment_PetitionFieldAttachment
}
    ${PetitionComposeFieldAttachment_PetitionFieldAttachmentFragmentDoc}`;
export const PetitionComposeField_updateFieldAttachments_PetitionFieldFragmentDoc = gql`
    fragment PetitionComposeField_updateFieldAttachments_PetitionField on PetitionField {
  attachments {
    ...PetitionComposeField_PetitionFieldAttachment
  }
}
    ${PetitionComposeField_PetitionFieldAttachmentFragmentDoc}`;
export const PetitionFieldOptionsListEditor_PetitionFieldFragmentDoc = gql`
    fragment PetitionFieldOptionsListEditor_PetitionField on PetitionField {
  id
  type
  optional
  options
}
    `;
export const PetitionFieldSelect_PetitionFieldFragmentDoc = gql`
    fragment PetitionFieldSelect_PetitionField on PetitionField {
  id
  type
  title
  options
}
    `;
export const PetitionFieldVisibilityEditor_PetitionFieldFragmentDoc = gql`
    fragment PetitionFieldVisibilityEditor_PetitionField on PetitionField {
  id
  type
  multiple
  options
  isReadOnly
  ...PetitionFieldSelect_PetitionField
}
    ${PetitionFieldSelect_PetitionFieldFragmentDoc}`;
export const PetitionComposeField_PetitionFieldFragmentDoc = gql`
    fragment PetitionComposeField_PetitionField on PetitionField {
  id
  type
  title
  description
  optional
  multiple
  isFixed
  isReadOnly
  visibility
  attachments {
    ...PetitionComposeField_PetitionFieldAttachment
  }
  ...PetitionFieldOptionsListEditor_PetitionField
  ...PetitionFieldVisibilityEditor_PetitionField
}
    ${PetitionComposeField_PetitionFieldAttachmentFragmentDoc}
${PetitionFieldOptionsListEditor_PetitionFieldFragmentDoc}
${PetitionFieldVisibilityEditor_PetitionFieldFragmentDoc}`;
export const ReferencedFieldDialogDialog_PetitionFieldFragmentDoc = gql`
    fragment ReferencedFieldDialogDialog_PetitionField on PetitionField {
  id
  title
  type
}
    `;
export const PetitionComposeFieldList_PetitionFragmentDoc = gql`
    fragment PetitionComposeFieldList_Petition on Petition {
  fields {
    isFixed
    ...PetitionComposeField_PetitionField
    ...ReferencedFieldDialogDialog_PetitionField
  }
}
    ${PetitionComposeField_PetitionFieldFragmentDoc}
${ReferencedFieldDialogDialog_PetitionFieldFragmentDoc}`;
export const PetitionListTagFilter_TagFragmentDoc = gql`
    fragment PetitionListTagFilter_Tag on Tag {
  id
  ...Tag_Tag
}
    ${Tag_TagFragmentDoc}`;
export const useFilenamePlaceholdersRename_PetitionFieldFragmentDoc = gql`
    fragment useFilenamePlaceholdersRename_PetitionField on PetitionField {
  id
  type
  title
}
    `;
export const useFilenamePlaceholdersRename_PetitionFieldReplyFragmentDoc = gql`
    fragment useFilenamePlaceholdersRename_PetitionFieldReply on PetitionFieldReply {
  content
}
    `;
export const ExportRepliesProgressDialog_PetitionFragmentDoc = gql`
    fragment ExportRepliesProgressDialog_Petition on Petition {
  id
  fields {
    id
    type
    ...useFilenamePlaceholdersRename_PetitionField
    replies {
      id
      metadata
      ...useFilenamePlaceholdersRename_PetitionFieldReply
    }
  }
  currentSignatureRequest {
    id
    status
    signedDocumentFilename
    auditTrailFilename
    metadata
  }
}
    ${useFilenamePlaceholdersRename_PetitionFieldFragmentDoc}
${useFilenamePlaceholdersRename_PetitionFieldReplyFragmentDoc}`;
export const PublicTemplateCard_LandingTemplateFragmentDoc = gql`
    fragment PublicTemplateCard_LandingTemplate on LandingTemplate {
  id
  locale
  name
  slug
  imageUrl
  backgroundColor
  ownerFullName
  organizationName
}
    `;
export const RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragmentDoc = gql`
    fragment RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldComment on PublicPetitionFieldComment {
  id
  author {
    ... on PublicUser {
      id
      fullName
    }
    ... on PublicContact {
      id
      fullName
    }
  }
  content
  createdAt
  isUnread
}
    `;
export const RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentCountsFragmentDoc = gql`
    fragment RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentCounts on PublicPetitionField {
  commentCount
  unreadCommentCount
}
    `;
export const RecipientViewPetitionFieldMutations_updateFieldReplies_PublicPetitionFieldFragmentDoc = gql`
    fragment RecipientViewPetitionFieldMutations_updateFieldReplies_PublicPetitionField on PublicPetitionField {
  replies {
    id
  }
}
    `;
export const RecipientViewPetitionFieldMutations_updateReplyContent_PublicPetitionFieldReplyFragmentDoc = gql`
    fragment RecipientViewPetitionFieldMutations_updateReplyContent_PublicPetitionFieldReply on PublicPetitionFieldReply {
  content
}
    `;
export const RecipientViewPetitionFieldMutations_updatePetitionStatus_PublicPetitionFragmentDoc = gql`
    fragment RecipientViewPetitionFieldMutations_updatePetitionStatus_PublicPetition on PublicPetition {
  status
}
    `;
export const UserMenu_UserFragmentDoc = gql`
    fragment UserMenu_User on User {
  fullName
  isSuperAdmin
  role
}
    `;
export const AppLayoutNavbar_UserFragmentDoc = gql`
    fragment AppLayoutNavbar_User on User {
  ...UserMenu_User
}
    ${UserMenu_UserFragmentDoc}`;
export const OnboardingTour_UserFragmentDoc = gql`
    fragment OnboardingTour_User on User {
  onboardingStatus
}
    `;
export const AppLayout_UserFragmentDoc = gql`
    fragment AppLayout_User on User {
  id
  ...AppLayoutNavbar_User
  ...OnboardingTour_User
}
    ${AppLayoutNavbar_UserFragmentDoc}
${OnboardingTour_UserFragmentDoc}`;
export const Admin_UserFragmentDoc = gql`
    fragment Admin_User on User {
  ...AppLayout_User
}
    ${AppLayout_UserFragmentDoc}`;
export const AdminOrganizations_OrganizationFragmentDoc = gql`
    fragment AdminOrganizations_Organization on Organization {
  id
  _id
  name
  identifier
  status
  userCount
  createdAt
}
    `;
export const AdminOrganizations_UserFragmentDoc = gql`
    fragment AdminOrganizations_User on User {
  ...AppLayout_User
}
    ${AppLayout_UserFragmentDoc}`;
export const AdminSupportMethods_UserFragmentDoc = gql`
    fragment AdminSupportMethods_User on User {
  ...AppLayout_User
}
    ${AppLayout_UserFragmentDoc}`;
export const Contact_Contact_ProfileFragmentDoc = gql`
    fragment Contact_Contact_Profile on Contact {
  id
  email
  fullName
  firstName
  lastName
}
    `;
export const UserListPopover_UserFragmentDoc = gql`
    fragment UserListPopover_User on User {
  id
  fullName
}
    `;
export const UserAvatarList_UserFragmentDoc = gql`
    fragment UserAvatarList_User on User {
  id
  fullName
  ...UserListPopover_User
}
    ${UserListPopover_UserFragmentDoc}`;
export const UserAvatarList_UserGroupFragmentDoc = gql`
    fragment UserAvatarList_UserGroup on UserGroup {
  id
  name
}
    `;
export const PetitionStatusCellContent_PetitionFragmentDoc = gql`
    fragment PetitionStatusCellContent_Petition on Petition {
  status
  progress {
    validated
    replied
    optional
    total
  }
}
    `;
export const usePetitionCurrentSignatureStatus_PetitionFragmentDoc = gql`
    fragment usePetitionCurrentSignatureStatus_Petition on Petition {
  status
  currentSignatureRequest {
    status
  }
  signatureConfig {
    review
  }
}
    `;
export const PetitionSignatureCellContent_PetitionFragmentDoc = gql`
    fragment PetitionSignatureCellContent_Petition on Petition {
  ...usePetitionCurrentSignatureStatus_Petition @include(if: $hasPetitionSignature)
}
    ${usePetitionCurrentSignatureStatus_PetitionFragmentDoc}`;
export const Contact_PetitionFragmentDoc = gql`
    fragment Contact_Petition on Petition {
  id
  name
  sentAt
  permissions {
    permissionType
    ... on PetitionUserPermission {
      user {
        ...UserAvatarList_User
      }
    }
    ... on PetitionUserGroupPermission {
      group {
        ...UserAvatarList_UserGroup
      }
    }
  }
  ...PetitionStatusCellContent_Petition
  ...PetitionSignatureCellContent_Petition
}
    ${UserAvatarList_UserFragmentDoc}
${UserAvatarList_UserGroupFragmentDoc}
${PetitionStatusCellContent_PetitionFragmentDoc}
${PetitionSignatureCellContent_PetitionFragmentDoc}`;
export const Contact_PetitionAccessFragmentDoc = gql`
    fragment Contact_PetitionAccess on PetitionAccess {
  id
  petition {
    ...Contact_Petition
  }
}
    ${Contact_PetitionFragmentDoc}`;
export const Contact_ContactFragmentDoc = gql`
    fragment Contact_Contact on Contact {
  id
  ...Contact_Contact_Profile
  accesses(limit: 100) {
    items {
      ...Contact_PetitionAccess
    }
  }
}
    ${Contact_Contact_ProfileFragmentDoc}
${Contact_PetitionAccessFragmentDoc}`;
export const PetitionSignatureCellContent_UserFragmentDoc = gql`
    fragment PetitionSignatureCellContent_User on User {
  hasPetitionSignature: hasFeatureFlag(featureFlag: PETITION_SIGNATURE)
}
    `;
export const Contact_UserFragmentDoc = gql`
    fragment Contact_User on User {
  ...AppLayout_User
  ...PetitionSignatureCellContent_User
}
    ${AppLayout_UserFragmentDoc}
${PetitionSignatureCellContent_UserFragmentDoc}`;
export const Contacts_ContactsListFragmentDoc = gql`
    fragment Contacts_ContactsList on ContactPagination {
  items {
    id
    fullName
    firstName
    lastName
    email
    createdAt
  }
  totalCount
}
    `;
export const Contacts_UserFragmentDoc = gql`
    fragment Contacts_User on User {
  ...AppLayout_User
}
    ${AppLayout_UserFragmentDoc}`;
export const OrganizationGroup_UserGroupMemberFragmentDoc = gql`
    fragment OrganizationGroup_UserGroupMember on UserGroupMember {
  id
  addedAt
  user {
    id
    fullName
    email
  }
}
    `;
export const OrganizationGroup_UserGroupFragmentDoc = gql`
    fragment OrganizationGroup_UserGroup on UserGroup {
  id
  name
  createdAt
  members {
    ...OrganizationGroup_UserGroupMember
  }
}
    ${OrganizationGroup_UserGroupMemberFragmentDoc}`;
export const OrganizationGroup_UserFragmentDoc = gql`
    fragment OrganizationGroup_User on User {
  ...AppLayout_User
}
    ${AppLayout_UserFragmentDoc}`;
export const OrganizationGroups_UserGroupFragmentDoc = gql`
    fragment OrganizationGroups_UserGroup on UserGroup {
  id
  name
  createdAt
  members {
    user {
      ...UserAvatarList_User
    }
  }
}
    ${UserAvatarList_UserFragmentDoc}`;
export const OrganizationGroups_UserGroupPaginationFragmentDoc = gql`
    fragment OrganizationGroups_UserGroupPagination on UserGroupPagination {
  items {
    ...OrganizationGroups_UserGroup
  }
  totalCount
}
    ${OrganizationGroups_UserGroupFragmentDoc}`;
export const SettingsLayout_UserFragmentDoc = gql`
    fragment SettingsLayout_User on User {
  ...AppLayout_User
}
    ${AppLayout_UserFragmentDoc}`;
export const OrganizationGroups_UserFragmentDoc = gql`
    fragment OrganizationGroups_User on User {
  ...SettingsLayout_User
}
    ${SettingsLayout_UserFragmentDoc}`;
export const OrganizationUsers_UserFragmentDoc = gql`
    fragment OrganizationUsers_User on User {
  id
  fullName
  firstName
  lastName
  email
  role
  createdAt
  lastActiveAt
  status
  isSsoUser
}
    `;
export const HeaderNameEditable_PetitionBaseFragmentDoc = gql`
    fragment HeaderNameEditable_PetitionBase on PetitionBase {
  name
  updatedAt
  isReadOnly
}
    `;
export const PetitionHeader_PetitionFragmentDoc = gql`
    fragment PetitionHeader_Petition on Petition {
  id
  locale
  deadline
  status
  myEffectivePermission {
    isSubscribed
  }
  ...HeaderNameEditable_PetitionBase
}
    ${HeaderNameEditable_PetitionBaseFragmentDoc}`;
export const PetitionTemplateHeader_PetitionTemplateFragmentDoc = gql`
    fragment PetitionTemplateHeader_PetitionTemplate on PetitionTemplate {
  id
  locale
  isPublic
  ...HeaderNameEditable_PetitionBase
}
    ${HeaderNameEditable_PetitionBaseFragmentDoc}`;
export const PetitionLayout_PetitionBaseFragmentDoc = gql`
    fragment PetitionLayout_PetitionBase on PetitionBase {
  id
  name
  ... on Petition {
    ...PetitionHeader_Petition
  }
  ... on PetitionTemplate {
    ...PetitionTemplateHeader_PetitionTemplate
  }
}
    ${PetitionHeader_PetitionFragmentDoc}
${PetitionTemplateHeader_PetitionTemplateFragmentDoc}`;
export const PetitionAccessTable_PetitionAccessRemindersConfigFragmentDoc = gql`
    fragment PetitionAccessTable_PetitionAccessRemindersConfig on RemindersConfig {
  offset
  time
  timezone
  weekdaysOnly
}
    `;
export const PetitionAccessTable_PetitionAccessFragmentDoc = gql`
    fragment PetitionAccessTable_PetitionAccess on PetitionAccess {
  id
  contact {
    ...ContactLink_Contact
  }
  status
  nextReminderAt
  remindersLeft
  reminderCount
  remindersActive
  remindersOptOut
  remindersConfig {
    ...PetitionAccessTable_PetitionAccessRemindersConfig
  }
  createdAt
}
    ${ContactLink_ContactFragmentDoc}
${PetitionAccessTable_PetitionAccessRemindersConfigFragmentDoc}`;
export const PetitionAccessTable_PetitionFragmentDoc = gql`
    fragment PetitionAccessTable_Petition on Petition {
  status
  accesses {
    ...PetitionAccessTable_PetitionAccess
  }
}
    ${PetitionAccessTable_PetitionAccessFragmentDoc}`;
export const TimelinePetitionCreatedEvent_PetitionCreatedEventFragmentDoc = gql`
    fragment TimelinePetitionCreatedEvent_PetitionCreatedEvent on PetitionCreatedEvent {
  user {
    ...UserReference_User
  }
  createdAt
}
    ${UserReference_UserFragmentDoc}`;
export const TimelinePetitionCompletedEvent_PetitionCompletedEventFragmentDoc = gql`
    fragment TimelinePetitionCompletedEvent_PetitionCompletedEvent on PetitionCompletedEvent {
  access {
    contact {
      ...ContactLink_Contact
    }
  }
  createdAt
}
    ${ContactLink_ContactFragmentDoc}`;
export const TimelineAccessActivatedEvent_AccessActivatedEventFragmentDoc = gql`
    fragment TimelineAccessActivatedEvent_AccessActivatedEvent on AccessActivatedEvent {
  user {
    ...UserReference_User
  }
  access {
    contact {
      ...ContactLink_Contact
    }
  }
  createdAt
}
    ${UserReference_UserFragmentDoc}
${ContactLink_ContactFragmentDoc}`;
export const TimelineAccessDeactivatedEvent_AccessDeactivatedEventFragmentDoc = gql`
    fragment TimelineAccessDeactivatedEvent_AccessDeactivatedEvent on AccessDeactivatedEvent {
  user {
    ...UserReference_User
  }
  access {
    contact {
      ...ContactLink_Contact
    }
  }
  createdAt
}
    ${UserReference_UserFragmentDoc}
${ContactLink_ContactFragmentDoc}`;
export const TimelineAccessOpenedEvent_AccessOpenedEventFragmentDoc = gql`
    fragment TimelineAccessOpenedEvent_AccessOpenedEvent on AccessOpenedEvent {
  access {
    contact {
      ...ContactLink_Contact
    }
  }
  createdAt
}
    ${ContactLink_ContactFragmentDoc}`;
export const SentPetitionMessageDialog_PetitionMessageFragmentDoc = gql`
    fragment SentPetitionMessageDialog_PetitionMessage on PetitionMessage {
  emailBody
  emailSubject
  sentAt
  scheduledAt
  access {
    contact {
      ...ContactLink_Contact
    }
  }
}
    ${ContactLink_ContactFragmentDoc}`;
export const TimelineMessageScheduledEvent_MessageScheduledEventFragmentDoc = gql`
    fragment TimelineMessageScheduledEvent_MessageScheduledEvent on MessageScheduledEvent {
  message {
    sender {
      ...UserReference_User
    }
    status
    scheduledAt
    emailSubject
    access {
      contact {
        ...ContactLink_Contact
      }
    }
    ...SentPetitionMessageDialog_PetitionMessage
  }
  createdAt
}
    ${UserReference_UserFragmentDoc}
${ContactLink_ContactFragmentDoc}
${SentPetitionMessageDialog_PetitionMessageFragmentDoc}`;
export const TimelineMessageCancelledEvent_MessageCancelledEventFragmentDoc = gql`
    fragment TimelineMessageCancelledEvent_MessageCancelledEvent on MessageCancelledEvent {
  message {
    status
    scheduledAt
    emailSubject
    access {
      contact {
        ...ContactLink_Contact
      }
    }
  }
  user {
    ...UserReference_User
  }
  createdAt
}
    ${ContactLink_ContactFragmentDoc}
${UserReference_UserFragmentDoc}`;
export const MessageEventsIndicator_PetitionMessageFragmentDoc = gql`
    fragment MessageEventsIndicator_PetitionMessage on PetitionMessage {
  bouncedAt
  deliveredAt
  openedAt
}
    `;
export const TimelineMessageSentEvent_MessageSentEventFragmentDoc = gql`
    fragment TimelineMessageSentEvent_MessageSentEvent on MessageSentEvent {
  message {
    sender {
      ...UserReference_User
    }
    emailSubject
    scheduledAt
    access {
      contact {
        ...ContactLink_Contact
      }
    }
    ...MessageEventsIndicator_PetitionMessage
    ...SentPetitionMessageDialog_PetitionMessage
  }
  createdAt
}
    ${UserReference_UserFragmentDoc}
${ContactLink_ContactFragmentDoc}
${MessageEventsIndicator_PetitionMessageFragmentDoc}
${SentPetitionMessageDialog_PetitionMessageFragmentDoc}`;
export const SentReminderMessageDialog_PetitionReminderFragmentDoc = gql`
    fragment SentReminderMessageDialog_PetitionReminder on PetitionReminder {
  access {
    contact {
      ...ContactLink_Contact
    }
  }
  createdAt
  emailBody
}
    ${ContactLink_ContactFragmentDoc}`;
export const TimelineReminderSentEvent_ReminderSentEventFragmentDoc = gql`
    fragment TimelineReminderSentEvent_ReminderSentEvent on ReminderSentEvent {
  reminder {
    type
    sender {
      ...UserReference_User
    }
    access {
      contact {
        ...ContactLink_Contact
      }
    }
    ...SentReminderMessageDialog_PetitionReminder
  }
  createdAt
}
    ${UserReference_UserFragmentDoc}
${ContactLink_ContactFragmentDoc}
${SentReminderMessageDialog_PetitionReminderFragmentDoc}`;
export const PetitionFieldReference_PetitionFieldFragmentDoc = gql`
    fragment PetitionFieldReference_PetitionField on PetitionField {
  title
}
    `;
export const TimelineReplyCreatedEvent_ReplyCreatedEventFragmentDoc = gql`
    fragment TimelineReplyCreatedEvent_ReplyCreatedEvent on ReplyCreatedEvent {
  field {
    ...PetitionFieldReference_PetitionField
  }
  createdBy {
    ... on User {
      ...UserReference_User
    }
    ... on PetitionAccess {
      contact {
        ...ContactLink_Contact
      }
    }
  }
  createdAt
}
    ${PetitionFieldReference_PetitionFieldFragmentDoc}
${UserReference_UserFragmentDoc}
${ContactLink_ContactFragmentDoc}`;
export const TimelineReplyUpdatedEvent_ReplyUpdatedEventFragmentDoc = gql`
    fragment TimelineReplyUpdatedEvent_ReplyUpdatedEvent on ReplyUpdatedEvent {
  field {
    ...PetitionFieldReference_PetitionField
  }
  updatedBy {
    ... on User {
      ...UserReference_User
    }
    ... on PetitionAccess {
      contact {
        ...ContactLink_Contact
      }
    }
  }
  createdAt
}
    ${PetitionFieldReference_PetitionFieldFragmentDoc}
${UserReference_UserFragmentDoc}
${ContactLink_ContactFragmentDoc}`;
export const TimelineReplyDeletedEvent_ReplyDeletedEventFragmentDoc = gql`
    fragment TimelineReplyDeletedEvent_ReplyDeletedEvent on ReplyDeletedEvent {
  field {
    ...PetitionFieldReference_PetitionField
  }
  deletedBy {
    ... on User {
      ...UserReference_User
    }
    ... on PetitionAccess {
      contact {
        ...ContactLink_Contact
      }
    }
  }
  createdAt
}
    ${PetitionFieldReference_PetitionFieldFragmentDoc}
${UserReference_UserFragmentDoc}
${ContactLink_ContactFragmentDoc}`;
export const TimelineCommentPublishedEvent_CommentPublishedEventFragmentDoc = gql`
    fragment TimelineCommentPublishedEvent_CommentPublishedEvent on CommentPublishedEvent {
  field {
    ...PetitionFieldReference_PetitionField
  }
  comment {
    author {
      ... on User {
        ...UserReference_User
      }
      ... on PetitionAccess {
        contact {
          ...ContactLink_Contact
        }
      }
    }
    isEdited
    content
  }
  createdAt
}
    ${PetitionFieldReference_PetitionFieldFragmentDoc}
${UserReference_UserFragmentDoc}
${ContactLink_ContactFragmentDoc}`;
export const TimelineCommentDeletedEvent_CommentDeletedEventFragmentDoc = gql`
    fragment TimelineCommentDeletedEvent_CommentDeletedEvent on CommentDeletedEvent {
  field {
    ...PetitionFieldReference_PetitionField
  }
  deletedBy {
    ... on User {
      ...UserReference_User
    }
    ... on PetitionAccess {
      contact {
        ...ContactLink_Contact
      }
    }
  }
  createdAt
}
    ${PetitionFieldReference_PetitionFieldFragmentDoc}
${UserReference_UserFragmentDoc}
${ContactLink_ContactFragmentDoc}`;
export const TimelineUserPermissionAddedEvent_UserPermissionAddedEventFragmentDoc = gql`
    fragment TimelineUserPermissionAddedEvent_UserPermissionAddedEvent on UserPermissionAddedEvent {
  user {
    ...UserReference_User
  }
  permissionUser {
    ...UserReference_User
  }
  permissionType
  createdAt
}
    ${UserReference_UserFragmentDoc}`;
export const TimelineUserPermissionRemovedEvent_UserPermissionRemovedEventFragmentDoc = gql`
    fragment TimelineUserPermissionRemovedEvent_UserPermissionRemovedEvent on UserPermissionRemovedEvent {
  user {
    ...UserReference_User
  }
  permissionUser {
    ...UserReference_User
  }
  createdAt
}
    ${UserReference_UserFragmentDoc}`;
export const TimelineUserPermissionEditedEvent_UserPermissionEditedEventFragmentDoc = gql`
    fragment TimelineUserPermissionEditedEvent_UserPermissionEditedEvent on UserPermissionEditedEvent {
  user {
    ...UserReference_User
  }
  permissionUser {
    ...UserReference_User
  }
  permissionType
  createdAt
}
    ${UserReference_UserFragmentDoc}`;
export const TimelineOwnershipTransferredEvent_OwnershipTransferredEventFragmentDoc = gql`
    fragment TimelineOwnershipTransferredEvent_OwnershipTransferredEvent on OwnershipTransferredEvent {
  user {
    ...UserReference_User
  }
  owner {
    ...UserReference_User
  }
  previousOwner {
    ...UserReference_User
  }
  createdAt
}
    ${UserReference_UserFragmentDoc}`;
export const TimelinePetitionClosedEvent_PetitionClosedEventFragmentDoc = gql`
    fragment TimelinePetitionClosedEvent_PetitionClosedEvent on PetitionClosedEvent {
  user {
    ...UserReference_User
  }
  createdAt
}
    ${UserReference_UserFragmentDoc}`;
export const TimelinePetitionClosedNotifiedEvent_PetitionClosedNotifiedEventFragmentDoc = gql`
    fragment TimelinePetitionClosedNotifiedEvent_PetitionClosedNotifiedEvent on PetitionClosedNotifiedEvent {
  user {
    ...UserReference_User
  }
  access {
    contact {
      ...ContactLink_Contact
    }
  }
  createdAt
}
    ${UserReference_UserFragmentDoc}
${ContactLink_ContactFragmentDoc}`;
export const TimelinePetitionReopenedEvent_PetitionReopenedEventFragmentDoc = gql`
    fragment TimelinePetitionReopenedEvent_PetitionReopenedEvent on PetitionReopenedEvent {
  user {
    ...UserReference_User
  }
  createdAt
}
    ${UserReference_UserFragmentDoc}`;
export const TimelineSignatureStartedEvent_SignatureStartedEventFragmentDoc = gql`
    fragment TimelineSignatureStartedEvent_SignatureStartedEvent on SignatureStartedEvent {
  createdAt
}
    `;
export const TimelineSignatureCompletedEvent_SignatureCompletedEventFragmentDoc = gql`
    fragment TimelineSignatureCompletedEvent_SignatureCompletedEvent on SignatureCompletedEvent {
  createdAt
}
    `;
export const TimelineSignatureCancelledEvent_SignatureCancelledEventFragmentDoc = gql`
    fragment TimelineSignatureCancelledEvent_SignatureCancelledEvent on SignatureCancelledEvent {
  user {
    ...UserReference_User
  }
  contact {
    ...ContactLink_Contact
  }
  cancelType
  cancellerReason
  createdAt
}
    ${UserReference_UserFragmentDoc}
${ContactLink_ContactFragmentDoc}`;
export const TimelineAccessDelegatedEvent_AccessDelegatedEventFragmentDoc = gql`
    fragment TimelineAccessDelegatedEvent_AccessDelegatedEvent on AccessDelegatedEvent {
  originalAccess {
    contact {
      ...ContactLink_Contact
    }
  }
  newAccess {
    contact {
      ...ContactLink_Contact
    }
  }
  createdAt
}
    ${ContactLink_ContactFragmentDoc}`;
export const TimelineGroupPermissionAddedEvent_GroupPermissionAddedEventFragmentDoc = gql`
    fragment TimelineGroupPermissionAddedEvent_GroupPermissionAddedEvent on GroupPermissionAddedEvent {
  user {
    ...UserReference_User
  }
  permissionGroup {
    name
  }
  permissionType
  createdAt
}
    ${UserReference_UserFragmentDoc}`;
export const TimelineGroupPermissionEditedEvent_GroupPermissionEditedEventFragmentDoc = gql`
    fragment TimelineGroupPermissionEditedEvent_GroupPermissionEditedEvent on GroupPermissionEditedEvent {
  user {
    ...UserReference_User
  }
  permissionGroup {
    name
  }
  permissionType
  createdAt
}
    ${UserReference_UserFragmentDoc}`;
export const TimelineGroupPermissionRemovedEvent_GroupPermissionRemovedEventFragmentDoc = gql`
    fragment TimelineGroupPermissionRemovedEvent_GroupPermissionRemovedEvent on GroupPermissionRemovedEvent {
  user {
    ...UserReference_User
  }
  permissionGroup {
    name
  }
  createdAt
}
    ${UserReference_UserFragmentDoc}`;
export const TimelinePetitionClonedEvent_PetitionClonedEventFragmentDoc = gql`
    fragment TimelinePetitionClonedEvent_PetitionClonedEvent on PetitionClonedEvent {
  user {
    ...UserReference_User
  }
  createdAt
}
    ${UserReference_UserFragmentDoc}`;
export const TimelineRemindersOptOutEvent_RemindersOptOutEventFragmentDoc = gql`
    fragment TimelineRemindersOptOutEvent_RemindersOptOutEvent on RemindersOptOutEvent {
  access {
    contact {
      ...ContactLink_Contact
    }
  }
  ${ContactLink_ContactFragmentDoc}
`;
export const TimelineAccessActivatedFromLinkEvent_AccessActivatedFromPublicPetitionLinkEventFragmentDoc = gql`
  fragment TimelineAccessActivatedFromLinkEvent_AccessActivatedFromPublicPetitionLinkEvent on AccessActivatedFromPublicPetitionLinkEvent {
    access {
      contact {
        ...ContactLink_Contact
      }
    }
    createdAt
  }
  ${ContactLink_ContactFragmentDoc}
`;
export const PetitionActivityTimeline_PetitionEventFragmentDoc = gql`
    fragment PetitionActivityTimeline_PetitionEvent on PetitionEvent {
  id
  ... on PetitionCreatedEvent {
    ...TimelinePetitionCreatedEvent_PetitionCreatedEvent
  }
  ... on PetitionCompletedEvent {
    ...TimelinePetitionCompletedEvent_PetitionCompletedEvent
  }
  ... on AccessActivatedEvent {
    ...TimelineAccessActivatedEvent_AccessActivatedEvent
  }
  ... on AccessDeactivatedEvent {
    ...TimelineAccessDeactivatedEvent_AccessDeactivatedEvent
  }
  ... on AccessOpenedEvent {
    ...TimelineAccessOpenedEvent_AccessOpenedEvent
  }
  ... on MessageScheduledEvent {
    message {
      id
    }
    ... on PetitionCompletedEvent {
      ...TimelinePetitionCompletedEvent_PetitionCompletedEvent
    }
    ... on AccessActivatedEvent {
      ...TimelineAccessActivatedEvent_AccessActivatedEvent
    }
    ... on AccessDeactivatedEvent {
      ...TimelineAccessDeactivatedEvent_AccessDeactivatedEvent
    }
    ... on AccessOpenedEvent {
      ...TimelineAccessOpenedEvent_AccessOpenedEvent
    }
    ... on MessageScheduledEvent {
      message {
        id
      }
      ...TimelineMessageScheduledEvent_MessageScheduledEvent
    }
    ... on MessageCancelledEvent {
      ...TimelineMessageCancelledEvent_MessageCancelledEvent
    }
    ... on MessageSentEvent {
      ...TimelineMessageSentEvent_MessageSentEvent
    }
    ... on ReminderSentEvent {
      ...TimelineReminderSentEvent_ReminderSentEvent
    }
    ... on ReplyCreatedEvent {
      ...TimelineReplyCreatedEvent_ReplyCreatedEvent
    }
    ... on ReplyUpdatedEvent {
      ...TimelineReplyUpdatedEvent_ReplyUpdatedEvent
    }
    ... on ReplyDeletedEvent {
      ...TimelineReplyDeletedEvent_ReplyDeletedEvent
    }
    ... on CommentPublishedEvent {
      ...TimelineCommentPublishedEvent_CommentPublishedEvent
    }
    ... on CommentDeletedEvent {
      ...TimelineCommentDeletedEvent_CommentDeletedEvent
    }
    ... on UserPermissionAddedEvent {
      ...TimelineUserPermissionAddedEvent_UserPermissionAddedEvent
    }
    ... on UserPermissionRemovedEvent {
      ...TimelineUserPermissionRemovedEvent_UserPermissionRemovedEvent
    }
    ... on UserPermissionEditedEvent {
      ...TimelineUserPermissionEditedEvent_UserPermissionEditedEvent
    }
    ... on OwnershipTransferredEvent {
      ...TimelineOwnershipTransferredEvent_OwnershipTransferredEvent
    }
    ... on PetitionClosedEvent {
      ...TimelinePetitionClosedEvent_PetitionClosedEvent
    }
    ... on PetitionClosedNotifiedEvent {
      ...TimelinePetitionClosedNotifiedEvent_PetitionClosedNotifiedEvent
    }
    ... on PetitionReopenedEvent {
      ...TimelinePetitionReopenedEvent_PetitionReopenedEvent
    }
    ... on SignatureStartedEvent {
      ...TimelineSignatureStartedEvent_SignatureStartedEvent
    }
    ... on SignatureCompletedEvent {
      ...TimelineSignatureCompletedEvent_SignatureCompletedEvent
    }
    ... on SignatureCancelledEvent {
      ...TimelineSignatureCancelledEvent_SignatureCancelledEvent
    }
    ... on AccessDelegatedEvent {
      ...TimelineAccessDelegatedEvent_AccessDelegatedEvent
    }
    ... on GroupPermissionAddedEvent {
      ...TimelineGroupPermissionAddedEvent_GroupPermissionAddedEvent
    }
    ... on GroupPermissionEditedEvent {
      ...TimelineGroupPermissionEditedEvent_GroupPermissionEditedEvent
    }
    ... on GroupPermissionRemovedEvent {
      ...TimelineGroupPermissionRemovedEvent_GroupPermissionRemovedEvent
    }
    ... on PetitionClonedEvent {
      ...TimelinePetitionClonedEvent_PetitionClonedEvent
    }
    ... on RemindersOptOutEvent {
      ...TimelineRemindersOptOutEvent_RemindersOptOutEvent
    }
    ... on AccessActivatedFromPublicPetitionLinkEvent {
      ...TimelineAccessActivatedFromLinkEvent_AccessActivatedFromPublicPetitionLinkEvent
    }
  }
  ${TimelinePetitionCreatedEvent_PetitionCreatedEventFragmentDoc}
  ${TimelinePetitionCompletedEvent_PetitionCompletedEventFragmentDoc}
  ${TimelineAccessActivatedEvent_AccessActivatedEventFragmentDoc}
  ${TimelineAccessDeactivatedEvent_AccessDeactivatedEventFragmentDoc}
  ${TimelineAccessOpenedEvent_AccessOpenedEventFragmentDoc}
  ${TimelineMessageScheduledEvent_MessageScheduledEventFragmentDoc}
  ${TimelineMessageCancelledEvent_MessageCancelledEventFragmentDoc}
  ${TimelineMessageSentEvent_MessageSentEventFragmentDoc}
  ${TimelineReminderSentEvent_ReminderSentEventFragmentDoc}
  ${TimelineReplyCreatedEvent_ReplyCreatedEventFragmentDoc}
  ${TimelineReplyUpdatedEvent_ReplyUpdatedEventFragmentDoc}
  ${TimelineReplyDeletedEvent_ReplyDeletedEventFragmentDoc}
  ${TimelineCommentPublishedEvent_CommentPublishedEventFragmentDoc}
  ${TimelineCommentDeletedEvent_CommentDeletedEventFragmentDoc}
  ${TimelineUserPermissionAddedEvent_UserPermissionAddedEventFragmentDoc}
  ${TimelineUserPermissionRemovedEvent_UserPermissionRemovedEventFragmentDoc}
  ${TimelineUserPermissionEditedEvent_UserPermissionEditedEventFragmentDoc}
  ${TimelineOwnershipTransferredEvent_OwnershipTransferredEventFragmentDoc}
  ${TimelinePetitionClosedEvent_PetitionClosedEventFragmentDoc}
  ${TimelinePetitionClosedNotifiedEvent_PetitionClosedNotifiedEventFragmentDoc}
  ${TimelinePetitionReopenedEvent_PetitionReopenedEventFragmentDoc}
  ${TimelineSignatureStartedEvent_SignatureStartedEventFragmentDoc}
  ${TimelineSignatureCompletedEvent_SignatureCompletedEventFragmentDoc}
  ${TimelineSignatureCancelledEvent_SignatureCancelledEventFragmentDoc}
  ${TimelineAccessDelegatedEvent_AccessDelegatedEventFragmentDoc}
  ${TimelineGroupPermissionAddedEvent_GroupPermissionAddedEventFragmentDoc}
  ${TimelineGroupPermissionEditedEvent_GroupPermissionEditedEventFragmentDoc}
  ${TimelineGroupPermissionRemovedEvent_GroupPermissionRemovedEventFragmentDoc}
  ${TimelinePetitionClonedEvent_PetitionClonedEventFragmentDoc}
  ${TimelineRemindersOptOutEvent_RemindersOptOutEventFragmentDoc}
  ${TimelineAccessActivatedFromLinkEvent_AccessActivatedFromPublicPetitionLinkEventFragmentDoc}
`;
export const PetitionActivityTimeline_PetitionFragmentDoc = gql`
    fragment PetitionActivityTimeline_Petition on Petition {
  events(limit: 1000) {
    items {
      ...PetitionActivityTimeline_PetitionEvent
    }
  }
}
    ${PetitionActivityTimeline_PetitionEventFragmentDoc}`;
export const ShareButton_PetitionBaseFragmentDoc = gql`
    fragment ShareButton_PetitionBase on PetitionBase {
  permissions {
    permissionType
    ... on PetitionUserPermission {
      user {
        id
        fullName
      }
    }
    ... on PetitionUserGroupPermission {
      group {
        id
        name
      }
    }
  }
}
    `;
export const CopySignatureConfigDialog_ContactFragmentDoc = gql`
    fragment CopySignatureConfigDialog_Contact on Contact {
  id
  fullName
  email
}
    `;
export const AddPetitionAccessDialog_PetitionFragmentDoc = gql`
    fragment AddPetitionAccessDialog_Petition on Petition {
  emailSubject
  emailBody
  signatureConfig {
    contacts {
      ...CopySignatureConfigDialog_Contact
    }
  }
  remindersConfig {
    offset
    time
    timezone
    weekdaysOnly
  }
}
    ${CopySignatureConfigDialog_ContactFragmentDoc}`;
export const PetitionActivity_PetitionFragmentDoc = gql`
    fragment PetitionActivity_Petition on Petition {
  id
  ...PetitionLayout_PetitionBase
  ...PetitionAccessTable_Petition
  ...PetitionActivityTimeline_Petition
  ...ShareButton_PetitionBase
  ...AddPetitionAccessDialog_Petition
}
    ${PetitionLayout_PetitionBaseFragmentDoc}
${PetitionAccessTable_PetitionFragmentDoc}
${PetitionActivityTimeline_PetitionFragmentDoc}
${ShareButton_PetitionBaseFragmentDoc}
${AddPetitionAccessDialog_PetitionFragmentDoc}`;
export const PetitionHeader_UserFragmentDoc = gql`
    fragment PetitionHeader_User on User {
  id
  hasPetitionPdfExport: hasFeatureFlag(featureFlag: PETITION_PDF_EXPORT)
}
    `;
export const PetitionLayout_UserFragmentDoc = gql`
    fragment PetitionLayout_User on User {
  ...AppLayout_User
  ...PetitionHeader_User
}
    ${AppLayout_UserFragmentDoc}
${PetitionHeader_UserFragmentDoc}`;
export const useUpdateIsReadNotification_UserFragmentDoc = gql`
    fragment useUpdateIsReadNotification_User on User {
  id
  unreadNotificationIds
}
    `;
export const PetitionActivity_UserFragmentDoc = gql`
    fragment PetitionActivity_User on User {
  ...PetitionLayout_User
  ...useUpdateIsReadNotification_User
}
    ${PetitionLayout_UserFragmentDoc}
${useUpdateIsReadNotification_UserFragmentDoc}`;
export const PetitionTemplateComposeMessageEditor_PetitionFragmentDoc = gql`
    fragment PetitionTemplateComposeMessageEditor_Petition on PetitionTemplate {
  id
  emailSubject
  emailBody
  description
  isReadOnly
}
    `;
export const ContactSelect_ContactFragmentDoc = gql`
    fragment ContactSelect_Contact on Contact {
  id
  fullName
  email
}
    `;
export const SignatureConfigDialog_PetitionFragmentDoc = gql`
    fragment SignatureConfigDialog_Petition on Petition {
  name
  status
  signatureConfig {
    provider
    contacts {
      ...ContactSelect_Contact
    }
    title
    review
  }
  ${ContactSelect_ContactFragmentDoc}
`;
export const PublicLinkSettingsDialog_PublicPetitionLinkFragmentDoc = gql`
  fragment PublicLinkSettingsDialog_PublicPetitionLink on PublicPetitionLink {
    id
    title
    isActive
    description
    slug
    linkPermissions {
      ... on PublicPetitionLinkUserPermission {
        user {
          id
        }
      }
      ... on PublicPetitionLinkUserGroupPermission {
        group {
          id
        }
      }
      permissionType
    }
  }
`;
export const PetitionSettings_PetitionBaseFragmentDoc = gql`
  fragment PetitionSettings_PetitionBase on PetitionBase {
    id
    locale
    hasCommentsEnabled
    skipForwardSecurity
    isRecipientViewContentsHidden
    isReadOnly
    owner {
      id
    }
    ... on Petition {
      status
    }
    ... on PetitionTemplate {
      isPublic
      publicLink {
        ...PublicLinkSettingsDialog_PublicPetitionLink
      }
    }
  }
  ${SignatureConfigDialog_PetitionFragmentDoc}
  ${PublicLinkSettingsDialog_PublicPetitionLinkFragmentDoc}
`;
export const PetitionComposeFieldSettings_PetitionFieldFragmentDoc = gql`
  fragment PetitionComposeFieldSettings_PetitionField on PetitionField {
    id
    type
    optional
    multiple
    options
    isReadOnly
    isFixed
    position
    visibility
  }
}
    ${SignatureConfigDialog_PetitionFragmentDoc}`;
export const PetitionComposeFieldSettings_PetitionFieldFragmentDoc = gql`
    fragment PetitionComposeFieldSettings_PetitionField on PetitionField {
  id
  type
  optional
  multiple
  options
  isReadOnly
  isFixed
  position
  visibility
}
    `;
export const filterPetitionFields_PetitionFieldFragmentDoc = gql`
    fragment filterPetitionFields_PetitionField on PetitionField {
  id
  isReadOnly
  validated
  comments {
    id
  }
  replies {
    id
  }
}
    `;
export const PetitionContents_PetitionFieldFragmentDoc = gql`
    fragment PetitionContents_PetitionField on PetitionField {
  id
  title
  type
  options
  ...filterPetitionFields_PetitionField
}
    ${filterPetitionFields_PetitionFieldFragmentDoc}`;
export const PetitionCompose_PetitionFieldFragmentDoc = gql`
    fragment PetitionCompose_PetitionField on PetitionField {
  ...PetitionComposeField_PetitionField
  ...PetitionComposeFieldSettings_PetitionField
  ...PetitionContents_PetitionField
}
    ${PetitionComposeField_PetitionFieldFragmentDoc}
${PetitionComposeFieldSettings_PetitionFieldFragmentDoc}
${PetitionContents_PetitionFieldFragmentDoc}`;
export const PetitionCompose_PetitionBaseFragmentDoc = gql`
    fragment PetitionCompose_PetitionBase on PetitionBase {
  id
  ...PetitionLayout_PetitionBase
  ...AddPetitionAccessDialog_Petition
  ...PetitionTemplateComposeMessageEditor_Petition
  ...PetitionSettings_PetitionBase
  fields {
    ...PetitionCompose_PetitionField
  }
  ... on Petition {
    status
  }
  ... on PetitionTemplate {
    isPublic
  }
}
    ${PetitionLayout_PetitionBaseFragmentDoc}
${AddPetitionAccessDialog_PetitionFragmentDoc}
${PetitionTemplateComposeMessageEditor_PetitionFragmentDoc}
${PetitionSettings_PetitionBaseFragmentDoc}
${PetitionCompose_PetitionFieldFragmentDoc}`;
export const SignatureConfigDialog_OrgIntegrationFragmentDoc = gql`
    fragment SignatureConfigDialog_OrgIntegration on OrgIntegration {
  label: name
  value: provider
}
    `;
export const PetitionSettings_UserFragmentDoc = gql`
    fragment PetitionSettings_User on User {
  hasPetitionSignature: hasFeatureFlag(featureFlag: PETITION_SIGNATURE)
  hasSkipForwardSecurity: hasFeatureFlag(featureFlag: SKIP_FORWARD_SECURITY)
  hasHideRecipientViewContents: hasFeatureFlag(
    featureFlag: HIDE_RECIPIENT_VIEW_CONTENTS
  )
  organization {
    id
    signatureIntegrations: integrations(type: SIGNATURE) {
      ...SignatureConfigDialog_OrgIntegration
    }
  }
}
    ${SignatureConfigDialog_OrgIntegrationFragmentDoc}`;
export const PetitionCompose_UserFragmentDoc = gql`
    fragment PetitionCompose_User on User {
  ...PetitionLayout_User
  ...PetitionSettings_User
  ...useUpdateIsReadNotification_User
}
    ${PetitionLayout_UserFragmentDoc}
${PetitionSettings_UserFragmentDoc}
${useUpdateIsReadNotification_UserFragmentDoc}`;
export const PetitionRepliesFieldReply_PetitionFieldReplyFragmentDoc = gql`
    fragment PetitionRepliesFieldReply_PetitionFieldReply on PetitionFieldReply {
  id
  content
  status
  createdAt
  metadata
  field {
    type
  }
}
    `;
export const PetitionRepliesField_PetitionFieldReplyFragmentDoc = gql`
    fragment PetitionRepliesField_PetitionFieldReply on PetitionFieldReply {
  id
  ...PetitionRepliesFieldReply_PetitionFieldReply
}
    ${PetitionRepliesFieldReply_PetitionFieldReplyFragmentDoc}`;
export const PetitionRepliesFieldAttachment_PetitionFieldAttachmentFragmentDoc = gql`
    fragment PetitionRepliesFieldAttachment_PetitionFieldAttachment on PetitionFieldAttachment {
  id
  file {
    filename
    contentType
    size
    isComplete
  }
}
    `;
export const PetitionRepliesField_PetitionFieldFragmentDoc = gql`
    fragment PetitionRepliesField_PetitionField on PetitionField {
  id
  type
  title
  description
  validated
  replies {
    ...PetitionRepliesField_PetitionFieldReply
  }
  comments {
    id
    isUnread
    createdAt
  }
  attachments {
    ...PetitionRepliesFieldAttachment_PetitionFieldAttachment
  }
}
    ${PetitionRepliesField_PetitionFieldReplyFragmentDoc}
${PetitionRepliesFieldAttachment_PetitionFieldAttachmentFragmentDoc}`;
export const PetitionRepliesFieldComments_PetitionFieldCommentFragmentDoc = gql`
    fragment PetitionRepliesFieldComments_PetitionFieldComment on PetitionFieldComment {
  id
  author {
    ... on User {
      ...UserReference_User
    }
    ... on PetitionAccess {
      contact {
        ...ContactLink_Contact
      }
    }
  }
  content
  createdAt
  isUnread
  isEdited
  isInternal @include(if: $hasInternalComments)
}
    ${UserReference_UserFragmentDoc}
${ContactLink_ContactFragmentDoc}`;
export const PetitionRepliesFieldComments_PetitionFieldReplyFragmentDoc = gql`
    fragment PetitionRepliesFieldComments_PetitionFieldReply on PetitionFieldReply {
  id
  content
}
    `;
export const PetitionRepliesFieldComments_PetitionFieldFragmentDoc = gql`
    fragment PetitionRepliesFieldComments_PetitionField on PetitionField {
  id
  title
  type
  comments {
    ...PetitionRepliesFieldComments_PetitionFieldComment
  }
  replies {
    ...PetitionRepliesFieldComments_PetitionFieldReply
  }
}
    ${PetitionRepliesFieldComments_PetitionFieldCommentFragmentDoc}
${PetitionRepliesFieldComments_PetitionFieldReplyFragmentDoc}`;
export const ExportRepliesDialog_PetitionFieldFragmentDoc = gql`
    fragment ExportRepliesDialog_PetitionField on PetitionField {
  id
  type
  ...useFilenamePlaceholdersRename_PetitionField
  replies {
    ...useFilenamePlaceholdersRename_PetitionFieldReply
  }
}
    ${useFilenamePlaceholdersRename_PetitionFieldFragmentDoc}
${useFilenamePlaceholdersRename_PetitionFieldReplyFragmentDoc}`;
export const useFieldVisibility_PetitionFieldFragmentDoc = gql`
    fragment useFieldVisibility_PetitionField on PetitionField {
  id
  type
  options
  visibility
  replies {
    id
    content
  }
}
    `;
export const PetitionReplies_PetitionFieldFragmentDoc = gql`
    fragment PetitionReplies_PetitionField on PetitionField {
  isReadOnly
  ...PetitionRepliesField_PetitionField
  ...PetitionContents_PetitionField
  ...PetitionRepliesFieldComments_PetitionField
  ...ExportRepliesDialog_PetitionField
  ...useFieldVisibility_PetitionField
}
    ${PetitionRepliesField_PetitionFieldFragmentDoc}
${PetitionContents_PetitionFieldFragmentDoc}
${PetitionRepliesFieldComments_PetitionFieldFragmentDoc}
${ExportRepliesDialog_PetitionFieldFragmentDoc}
${useFieldVisibility_PetitionFieldFragmentDoc}`;
export const PetitionSignaturesCard_PetitionSignatureRequestFragmentDoc = gql`
    fragment PetitionSignaturesCard_PetitionSignatureRequest on PetitionSignatureRequest {
  id
  status
  signatureConfig {
    contacts {
      ...ContactLink_Contact
    }
  }
}
    ${ContactLink_ContactFragmentDoc}`;
export const PetitionSignaturesCard_PetitionFragmentDoc = gql`
    fragment PetitionSignaturesCard_Petition on Petition {
  id
  status
  signatureConfig {
    timezone
    contacts {
      ...ContactLink_Contact
    }
  }
  signatureRequests {
    ...PetitionSignaturesCard_PetitionSignatureRequest
  }
  ...SignatureConfigDialog_Petition
}
    ${ContactLink_ContactFragmentDoc}
${PetitionSignaturesCard_PetitionSignatureRequestFragmentDoc}
${SignatureConfigDialog_PetitionFragmentDoc}`;
export const PetitionReplies_PetitionFragmentDoc = gql`
    fragment PetitionReplies_Petition on Petition {
  id
  hasCommentsEnabled
  ...PetitionLayout_PetitionBase
  fields {
    ...PetitionReplies_PetitionField
  }
  ...ShareButton_PetitionBase
  currentSignatureRequest @include(if: $hasPetitionSignature) {
    id
    status
  }
  ...PetitionSignaturesCard_Petition @include(if: $hasPetitionSignature)
  ...usePetitionCurrentSignatureStatus_Petition @include(if: $hasPetitionSignature)
}
    ${PetitionLayout_PetitionBaseFragmentDoc}
${PetitionReplies_PetitionFieldFragmentDoc}
${ShareButton_PetitionBaseFragmentDoc}
${PetitionSignaturesCard_PetitionFragmentDoc}
${usePetitionCurrentSignatureStatus_PetitionFragmentDoc}`;
export const PetitionRepliesFieldComments_UserFragmentDoc = gql`
    fragment PetitionRepliesFieldComments_User on User {
  id
  hasInternalComments: hasFeatureFlag(featureFlag: INTERNAL_COMMENTS)
}
    `;
export const ExportRepliesDialog_UserFragmentDoc = gql`
    fragment ExportRepliesDialog_User on User {
  hasExportCuatrecasas: hasFeatureFlag(featureFlag: EXPORT_CUATRECASAS)
}
    `;
export const PetitionSignaturesCard_UserFragmentDoc = gql`
    fragment PetitionSignaturesCard_User on User {
  organization {
    signatureIntegrations: integrations(type: SIGNATURE) {
      ...SignatureConfigDialog_OrgIntegration
    }
  }
}
    ${SignatureConfigDialog_OrgIntegrationFragmentDoc}`;
export const PetitionReplies_UserFragmentDoc = gql`
    fragment PetitionReplies_User on User {
  hasPetitionSignature: hasFeatureFlag(featureFlag: PETITION_SIGNATURE)
  hasPetitionPdfExport: hasFeatureFlag(featureFlag: PETITION_PDF_EXPORT)
  ...PetitionLayout_User
  ...PetitionRepliesFieldComments_User
  ...ExportRepliesDialog_User
  ...PetitionSignaturesCard_User
  ...useUpdateIsReadNotification_User
}
    ${PetitionLayout_UserFragmentDoc}
${PetitionRepliesFieldComments_UserFragmentDoc}
${ExportRepliesDialog_UserFragmentDoc}
${PetitionSignaturesCard_UserFragmentDoc}
${useUpdateIsReadNotification_UserFragmentDoc}`;
export const PetitionTagListCellContent_TagFragmentDoc = gql`
    fragment PetitionTagListCellContent_Tag on Tag {
  id
  ...Tag_Tag
}
    ${Tag_TagFragmentDoc}`;
export const PetitionTagListCellContent_PetitionBaseFragmentDoc = gql`
    fragment PetitionTagListCellContent_PetitionBase on PetitionBase {
  id
  isReadOnly
  tags {
    ...PetitionTagListCellContent_Tag
  }
}
    ${PetitionTagListCellContent_TagFragmentDoc}`;
export const usePetitionsTableColumns_PetitionBaseFragmentDoc = gql`
    fragment usePetitionsTableColumns_PetitionBase on PetitionBase {
  id
  name
  createdAt
  permissions {
    permissionType
    ... on PetitionUserPermission {
      user {
        ...UserAvatarList_User
      }
    }
    ... on PetitionUserGroupPermission {
      group {
        ...UserAvatarList_UserGroup
      }
    }
  }
  ...PetitionTagListCellContent_PetitionBase
  ... on Petition {
    accesses {
      status
      contact {
        ...ContactLink_Contact
      }
      nextReminderAt
      reminders {
        createdAt
      }
    }
    sentAt
    ...PetitionStatusCellContent_Petition
    ...PetitionSignatureCellContent_Petition
  }
  ... on PetitionTemplate {
    descriptionExcerpt
  }
}
    ${UserAvatarList_UserFragmentDoc}
${UserAvatarList_UserGroupFragmentDoc}
${PetitionTagListCellContent_PetitionBaseFragmentDoc}
${ContactLink_ContactFragmentDoc}
${PetitionStatusCellContent_PetitionFragmentDoc}
${PetitionSignatureCellContent_PetitionFragmentDoc}`;
export const Petitions_PetitionBaseFragmentDoc = gql`
    fragment Petitions_PetitionBase on PetitionBase {
  ...usePetitionsTableColumns_PetitionBase
  ... on PetitionTemplate {
    isPublic
  }
}
    ${usePetitionsTableColumns_PetitionBaseFragmentDoc}`;
export const Petitions_PetitionBasePaginationFragmentDoc = gql`
    fragment Petitions_PetitionBasePagination on PetitionBasePagination {
  items {
    ...Petitions_PetitionBase
  }
  totalCount
}
    ${Petitions_PetitionBaseFragmentDoc}`;
export const usePetitionsTableColumns_UserFragmentDoc = gql`
    fragment usePetitionsTableColumns_User on User {
  ...PetitionSignatureCellContent_User
}
    ${PetitionSignatureCellContent_UserFragmentDoc}`;
export const Petitions_UserFragmentDoc = gql`
    fragment Petitions_User on User {
  ...AppLayout_User
  ...usePetitionsTableColumns_User
}
    ${AppLayout_UserFragmentDoc}
${usePetitionsTableColumns_UserFragmentDoc}`;
export const TemplateCard_PetitionTemplateFragmentDoc = gql`
  fragment TemplateCard_PetitionTemplate on PetitionTemplate {
    name
    descriptionExcerpt
    locale
    owner {
      id
      fullName
    }
    publicLink {
      id
      isActive
    }
  }
`;
export const NewPetitionTemplatesList_PetitionTemplateFragmentDoc = gql`
  fragment NewPetitionTemplatesList_PetitionTemplate on PetitionTemplate {
    id
    fullName
  }
}
    `;
export const NewPetitionTemplatesList_PetitionTemplateFragmentDoc = gql`
    fragment NewPetitionTemplatesList_PetitionTemplate on PetitionTemplate {
  id
  ...TemplateCard_PetitionTemplate
}
    ${TemplateCard_PetitionTemplateFragmentDoc}`;
export const NewPetition_PetitionTemplateFragmentDoc = gql`
    fragment NewPetition_PetitionTemplate on PetitionTemplate {
  ...NewPetitionTemplatesList_PetitionTemplate
}
    ${NewPetitionTemplatesList_PetitionTemplateFragmentDoc}`;
export const NewPetition_UserFragmentDoc = gql`
    fragment NewPetition_User on User {
  ...AppLayout_User
}
    ${AppLayout_UserFragmentDoc}`;
export const useSettingsSections_UserFragmentDoc = gql`
    fragment useSettingsSections_User on User {
  hasApiTokens: hasFeatureFlag(featureFlag: API_TOKENS)
}
    `;
export const Account_UserFragmentDoc = gql`
    fragment Account_User on User {
  firstName
  lastName
  isSsoUser
  ...SettingsLayout_User
  ...useSettingsSections_User
}
    ${SettingsLayout_UserFragmentDoc}
${useSettingsSections_UserFragmentDoc}`;
export const Settings_UserFragmentDoc = gql`
    fragment Settings_User on User {
  ...SettingsLayout_User
  ...useSettingsSections_User
}
    ${SettingsLayout_UserFragmentDoc}
${useSettingsSections_UserFragmentDoc}`;
export const Tokens_UserAuthenticationTokenFragmentDoc = gql`
    fragment Tokens_UserAuthenticationToken on UserAuthenticationToken {
  id
  tokenName
  createdAt
  lastUsedAt
}
    `;
export const Login_UserFragmentDoc = gql`
    fragment Login_User on User {
  id
  fullName
  email
}
    `;
export const RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragmentDoc = gql`
    fragment RecipientViewPetitionFieldCard_PublicPetitionFieldReply on PublicPetitionFieldReply {
  id
  status
  content
  createdAt
  updatedAt
}
    `;
export const RecipientViewFieldAttachment_PetitionFieldAttachmentFragmentDoc = gql`
    fragment RecipientViewFieldAttachment_PetitionFieldAttachment on PetitionFieldAttachment {
  id
  file {
    filename
    contentType
    size
    isComplete
  }
}
    `;
export const RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldFragmentDoc = gql`
    fragment RecipientViewPetitionFieldCommentsDialog_PublicPetitionField on PublicPetitionField {
  id
  title
}
    `;
export const RecipientViewPetitionFieldCard_PublicPetitionFieldFragmentDoc = gql`
    fragment RecipientViewPetitionFieldCard_PublicPetitionField on PublicPetitionField {
  id
  type
  title
  description
  options
  optional
  multiple
  validated
  replies {
    ...RecipientViewPetitionFieldCard_PublicPetitionFieldReply
  }
  attachments {
    ...RecipientViewFieldAttachment_PetitionFieldAttachment
  }
  commentCount
  unreadCommentCount
  ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionField
}
    ${RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragmentDoc}
${RecipientViewFieldAttachment_PetitionFieldAttachmentFragmentDoc}
${RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldFragmentDoc}`;
export const RecipientViewPetitionField_PublicPetitionFieldFragmentDoc = gql`
    fragment RecipientViewPetitionField_PublicPetitionField on PublicPetitionField {
  ...RecipientViewPetitionFieldCard_PublicPetitionField
}
    ${RecipientViewPetitionFieldCard_PublicPetitionFieldFragmentDoc}`;
export const useFieldVisibility_PublicPetitionFieldFragmentDoc = gql`
    fragment useFieldVisibility_PublicPetitionField on PublicPetitionField {
  id
  type
  options
  visibility
  replies {
    id
    content
  }
}
    `;
export const RecipientViewContentsCard_PublicPetitionFieldFragmentDoc = gql`
    fragment RecipientViewContentsCard_PublicPetitionField on PublicPetitionField {
  id
  type
  title
  options
  optional
  isReadOnly
  replies {
    id
  }
  commentCount
  unreadCommentCount
  ...useFieldVisibility_PublicPetitionField
}
    ${useFieldVisibility_PublicPetitionFieldFragmentDoc}`;
export const RecipientViewProgressFooter_PublicPetitionFieldFragmentDoc = gql`
    fragment RecipientViewProgressFooter_PublicPetitionField on PublicPetitionField {
  id
  type
  optional
  validated
  isReadOnly
  replies {
    id
  }
  ...useFieldVisibility_PublicPetitionField
}
    ${useFieldVisibility_PublicPetitionFieldFragmentDoc}`;
export const RecipientView_PublicPetitionFieldFragmentDoc = gql`
    fragment RecipientView_PublicPetitionField on PublicPetitionField {
  id
  ...RecipientViewPetitionField_PublicPetitionField
  ...RecipientViewContentsCard_PublicPetitionField
  ...RecipientViewProgressFooter_PublicPetitionField
}
    ${RecipientViewPetitionField_PublicPetitionFieldFragmentDoc}
${RecipientViewContentsCard_PublicPetitionFieldFragmentDoc}
${RecipientViewProgressFooter_PublicPetitionFieldFragmentDoc}`;
export const RecipientView_PublicContactFragmentDoc = gql`
    fragment RecipientView_PublicContact on PublicContact {
  id
  fullName
  email
}
    `;
export const RecipientViewHeader_PublicContactFragmentDoc = gql`
    fragment RecipientViewHeader_PublicContact on PublicContact {
  id
  fullName
  firstName
  email
}
    `;
export const RecipientViewContentsCard_PublicPetitionFragmentDoc = gql`
    fragment RecipientViewContentsCard_PublicPetition on PublicPetition {
  status
  fields {
    ...RecipientViewContentsCard_PublicPetitionField
  }
}
    ${RecipientViewContentsCard_PublicPetitionFieldFragmentDoc}`;
export const RecipientViewProgressFooter_PublicPetitionFragmentDoc = gql`
    fragment RecipientViewProgressFooter_PublicPetition on PublicPetition {
  status
  fields {
    ...RecipientViewProgressFooter_PublicPetitionField
  }
  signature {
    review
  }
}
    ${RecipientViewProgressFooter_PublicPetitionFieldFragmentDoc}`;
export const RecipientView_PublicPetitionFragmentDoc = gql`
    fragment RecipientView_PublicPetition on PublicPetition {
  id
  status
  deadline
  hasCommentsEnabled
  isRecipientViewContentsHidden
  fields {
    ...RecipientView_PublicPetitionField
  }
  signature {
    signers {
      ...RecipientView_PublicContact
    }
  }
  recipients {
    ...RecipientViewHeader_PublicContact
  }
  signatureStatus
  ...RecipientViewContentsCard_PublicPetition
  ...RecipientViewProgressFooter_PublicPetition
}
    ${RecipientView_PublicPetitionFieldFragmentDoc}
${RecipientView_PublicContactFragmentDoc}
${RecipientViewHeader_PublicContactFragmentDoc}
${RecipientViewContentsCard_PublicPetitionFragmentDoc}
${RecipientViewProgressFooter_PublicPetitionFragmentDoc}`;
export const RecipientViewHeader_PublicUserFragmentDoc = gql`
    fragment RecipientViewHeader_PublicUser on PublicUser {
  id
  firstName
  fullName
  email
  organization {
    name
    identifier
    logoUrl
  }
}
    `;
export const RecipientViewContentsCard_PublicUserFragmentDoc = gql`
    fragment RecipientViewContentsCard_PublicUser on PublicUser {
  firstName
}
    `;
export const RecipientView_PublicUserFragmentDoc = gql`
    fragment RecipientView_PublicUser on PublicUser {
  ...RecipientViewHeader_PublicUser
  ...RecipientViewContentsCard_PublicUser
}
    ${RecipientViewHeader_PublicUserFragmentDoc}
${RecipientViewContentsCard_PublicUserFragmentDoc}`;
export const useCompleteSignerInfoDialog_PublicContactFragmentDoc = gql`
    fragment useCompleteSignerInfoDialog_PublicContact on PublicContact {
  firstName
  lastName
  email
}
    `;
export const RecipientView_PublicPetitionMessageFragmentDoc = gql`
    fragment RecipientView_PublicPetitionMessage on PublicPetitionMessage {
  id
  subject
}
    `;
export const RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccessFragmentDoc = gql`
    fragment RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccess on PublicPetitionAccess {
  granter {
    fullName
  }
  contact {
    id
  }
}
    `;
export const RecipientViewPetitionFieldCard_PublicPetitionAccessFragmentDoc = gql`
    fragment RecipientViewPetitionFieldCard_PublicPetitionAccess on PublicPetitionAccess {
  ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccess
}
    ${RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccessFragmentDoc}`;
export const RecipientViewPetitionField_PublicPetitionAccessFragmentDoc = gql`
    fragment RecipientViewPetitionField_PublicPetitionAccess on PublicPetitionAccess {
  ...RecipientViewPetitionFieldCard_PublicPetitionAccess
}
    ${RecipientViewPetitionFieldCard_PublicPetitionAccessFragmentDoc}`;
export const RecipientView_PublicPetitionAccessFragmentDoc = gql`
    fragment RecipientView_PublicPetitionAccess on PublicPetitionAccess {
  petition {
    ...RecipientView_PublicPetition
  }
  granter {
    ...RecipientView_PublicUser
  }
  contact {
    ...RecipientViewHeader_PublicContact
    ...useCompleteSignerInfoDialog_PublicContact
  }
  message {
    ...RecipientView_PublicPetitionMessage
  }
  ...RecipientViewPetitionField_PublicPetitionAccess
}
    ${RecipientView_PublicPetitionFragmentDoc}
${RecipientView_PublicUserFragmentDoc}
${RecipientViewHeader_PublicContactFragmentDoc}
${useCompleteSignerInfoDialog_PublicContactFragmentDoc}
${RecipientView_PublicPetitionMessageFragmentDoc}
${RecipientViewPetitionField_PublicPetitionAccessFragmentDoc}`;
export const OptOut_PublicUserFragmentDoc = gql`
    fragment OptOut_PublicUser on PublicUser {
  id
  organization {
    name
    identifier
    logoUrl
  }
}
    `;
export const OptOut_PublicPetitionAccessFragmentDoc = gql`
    fragment OptOut_PublicPetitionAccess on PublicPetitionAccess {
  granter {
    ...OptOut_PublicUser
  }
  ${OptOut_PublicUserFragmentDoc}
`;
export const PublicPetitionLink_PublicPetitionLinkFragmentDoc = gql`
  fragment PublicPetitionLink_PublicPetitionLink on PublicPetitionLink {
    id
    title
    description
    organization {
      name
      logoUrl
    }
  }
`;
export const PetitionPdf_PetitionFieldFragmentDoc = gql`
    fragment PetitionPdf_PetitionField on PetitionField {
  id
  type
  title
  options
  description
  validated
  replies {
    id
    content
  }
  ...useFieldVisibility_PetitionField
}
    ${useFieldVisibility_PetitionFieldFragmentDoc}`;
export const PetitionPdf_PetitionFragmentDoc = gql`
    fragment PetitionPdf_Petition on Petition {
  id
  name
  fields {
    ...PetitionPdf_PetitionField
  }
  organization {
    name
    logoUrl
  }
  currentSignatureRequest(token: $token) {
    signatureConfig {
      contacts {
        id
        fullName
        email
      }
      timezone
    }
  }
}
    ${PetitionPdf_PetitionFieldFragmentDoc}`;
export const LandingTemplateDetails_LandingTemplateFragmentDoc = gql`
  fragment LandingTemplateDetails_LandingTemplate on LandingTemplate {
    id
    name
    slug
    locale
    imageUrl
    backgroundColor
    categories
    ownerFullName
    ownerAvatarUrl
    organizationName
    fieldCount
    hasConditionals
    descriptionHtml
    shortDescription
    updatedAt
    fields {
      id
      type
      title
    }
  }
`;
export const ConfirmDeletePetitionsDialog_PetitionBaseFragmentDoc = gql`
    fragment ConfirmDeletePetitionsDialog_PetitionBase on PetitionBase {
  id
  name
}
    `;
export const useUpdateIsReadNotification_PetitionFieldCommentFragmentDoc = gql`
    fragment useUpdateIsReadNotification_PetitionFieldComment on PetitionFieldComment {
  id
  isUnread
}
    `;
export const uploadFile_AWSPresignedPostDataFragmentDoc = gql`
    fragment uploadFile_AWSPresignedPostData on AWSPresignedPostData {
  url
  fields
}
    `;
export const validatePetitionFields_PetitionFieldFragmentDoc = gql`
    fragment validatePetitionFields_PetitionField on PetitionField {
  id
  title
  type
  options
}
    `;
export const PetitionTagListCellContent_tagsDocument = gql`
    query PetitionTagListCellContent_tags($search: String) {
  tags(search: $search) {
    items {
      ...PetitionTagListCellContent_Tag
    }
  }
}
    ${PetitionTagListCellContent_TagFragmentDoc}`;
export function usePetitionTagListCellContent_tagsQuery(baseOptions?: Apollo.QueryHookOptions<PetitionTagListCellContent_tagsQuery, PetitionTagListCellContent_tagsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PetitionTagListCellContent_tagsQuery, PetitionTagListCellContent_tagsQueryVariables>(PetitionTagListCellContent_tagsDocument, options);
      }
export function usePetitionTagListCellContent_tagsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PetitionTagListCellContent_tagsQuery, PetitionTagListCellContent_tagsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PetitionTagListCellContent_tagsQuery, PetitionTagListCellContent_tagsQueryVariables>(PetitionTagListCellContent_tagsDocument, options);
        }
export type PetitionTagListCellContent_tagsQueryHookResult = ReturnType<typeof usePetitionTagListCellContent_tagsQuery>;
export type PetitionTagListCellContent_tagsLazyQueryHookResult = ReturnType<typeof usePetitionTagListCellContent_tagsLazyQuery>;
export const PetitionTagListCellContent_tagPetitionDocument = gql`
    mutation PetitionTagListCellContent_tagPetition($tagId: GID!, $petitionId: GID!) {
  tagPetition(tagId: $tagId, petitionId: $petitionId) {
    id
    tags {
      ...PetitionTagListCellContent_Tag
    }
  }
}
    ${PetitionTagListCellContent_TagFragmentDoc}`;
export function usePetitionTagListCellContent_tagPetitionMutation(baseOptions?: Apollo.MutationHookOptions<PetitionTagListCellContent_tagPetitionMutation, PetitionTagListCellContent_tagPetitionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionTagListCellContent_tagPetitionMutation, PetitionTagListCellContent_tagPetitionMutationVariables>(PetitionTagListCellContent_tagPetitionDocument, options);
      }
export type PetitionTagListCellContent_tagPetitionMutationHookResult = ReturnType<typeof usePetitionTagListCellContent_tagPetitionMutation>;
export const PetitionTagListCellContent_untagPetitionDocument = gql`
    mutation PetitionTagListCellContent_untagPetition($tagId: GID!, $petitionId: GID!) {
  untagPetition(tagId: $tagId, petitionId: $petitionId) {
    id
    tags {
      ...PetitionTagListCellContent_Tag
    }
  }
}
    ${PetitionTagListCellContent_TagFragmentDoc}`;
export function usePetitionTagListCellContent_untagPetitionMutation(baseOptions?: Apollo.MutationHookOptions<PetitionTagListCellContent_untagPetitionMutation, PetitionTagListCellContent_untagPetitionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionTagListCellContent_untagPetitionMutation, PetitionTagListCellContent_untagPetitionMutationVariables>(PetitionTagListCellContent_untagPetitionDocument, options);
      }
export type PetitionTagListCellContent_untagPetitionMutationHookResult = ReturnType<typeof usePetitionTagListCellContent_untagPetitionMutation>;
export const PetitionTagListCellContent_createTagDocument = gql`
    mutation PetitionTagListCellContent_createTag($name: String!, $color: String!) {
  createTag(name: $name, color: $color) {
    ...PetitionTagListCellContent_Tag
  }
}
    ${PetitionTagListCellContent_TagFragmentDoc}`;
export function usePetitionTagListCellContent_createTagMutation(baseOptions?: Apollo.MutationHookOptions<PetitionTagListCellContent_createTagMutation, PetitionTagListCellContent_createTagMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionTagListCellContent_createTagMutation, PetitionTagListCellContent_createTagMutationVariables>(PetitionTagListCellContent_createTagDocument, options);
      }
export type PetitionTagListCellContent_createTagMutationHookResult = ReturnType<typeof usePetitionTagListCellContent_createTagMutation>;
export const TagEditDialog_tagsDocument = gql`
    query TagEditDialog_tags {
  tags {
    items {
      ...TagEditDialog_Tag
    }
  }
}
    ${TagEditDialog_TagFragmentDoc}`;
export function useTagEditDialog_tagsQuery(baseOptions?: Apollo.QueryHookOptions<TagEditDialog_tagsQuery, TagEditDialog_tagsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TagEditDialog_tagsQuery, TagEditDialog_tagsQueryVariables>(TagEditDialog_tagsDocument, options);
      }
export function useTagEditDialog_tagsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TagEditDialog_tagsQuery, TagEditDialog_tagsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TagEditDialog_tagsQuery, TagEditDialog_tagsQueryVariables>(TagEditDialog_tagsDocument, options);
        }
export type TagEditDialog_tagsQueryHookResult = ReturnType<typeof useTagEditDialog_tagsQuery>;
export type TagEditDialog_tagsLazyQueryHookResult = ReturnType<typeof useTagEditDialog_tagsLazyQuery>;
export const TagEditDialog_updateTagDocument = gql`
    mutation TagEditDialog_updateTag($id: GID!, $data: UpdateTagInput!) {
  updateTag(id: $id, data: $data) {
    ...TagEditDialog_Tag
  }
}
    ${TagEditDialog_TagFragmentDoc}`;
export function useTagEditDialog_updateTagMutation(baseOptions?: Apollo.MutationHookOptions<TagEditDialog_updateTagMutation, TagEditDialog_updateTagMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<TagEditDialog_updateTagMutation, TagEditDialog_updateTagMutationVariables>(TagEditDialog_updateTagDocument, options);
      }
export type TagEditDialog_updateTagMutationHookResult = ReturnType<typeof useTagEditDialog_updateTagMutation>;
export const useSearchUsers_searchUsersDocument = gql`
    query useSearchUsers_searchUsers($search: String!, $excludeUsers: [GID!], $excludeUserGroups: [GID!], $includeGroups: Boolean, $includeInactive: Boolean) {
  searchUsers(
    search: $search
    excludeUsers: $excludeUsers
    excludeUserGroups: $excludeUserGroups
    includeGroups: $includeGroups
    includeInactive: $includeInactive
  ) {
    ... on User {
      ...UserSelect_User
    }
    ... on UserGroup {
      ...UserSelect_UserGroup
    }
  }
}
    ${UserSelect_UserFragmentDoc}
${UserSelect_UserGroupFragmentDoc}`;
export function useuseSearchUsers_searchUsersQuery(baseOptions: Apollo.QueryHookOptions<useSearchUsers_searchUsersQuery, useSearchUsers_searchUsersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<useSearchUsers_searchUsersQuery, useSearchUsers_searchUsersQueryVariables>(useSearchUsers_searchUsersDocument, options);
      }
export function useuseSearchUsers_searchUsersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<useSearchUsers_searchUsersQuery, useSearchUsers_searchUsersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<useSearchUsers_searchUsersQuery, useSearchUsers_searchUsersQueryVariables>(useSearchUsers_searchUsersDocument, options);
        }
export type useSearchUsers_searchUsersQueryHookResult = ReturnType<typeof useuseSearchUsers_searchUsersQuery>;
export type useSearchUsers_searchUsersLazyQueryHookResult = ReturnType<typeof useuseSearchUsers_searchUsersLazyQuery>;
export const useGetUsersOrGroupsDocument = gql`
    query useGetUsersOrGroups($ids: [ID!]!) {
  getUsersOrGroups(ids: $ids) {
    ... on User {
      ...UserSelect_User
    }
    ... on UserGroup {
      ...UserSelect_UserGroup
    }
  }
}
    ${UserSelect_UserFragmentDoc}
${UserSelect_UserGroupFragmentDoc}`;
export function useuseGetUsersOrGroupsQuery(baseOptions: Apollo.QueryHookOptions<useGetUsersOrGroupsQuery, useGetUsersOrGroupsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<useGetUsersOrGroupsQuery, useGetUsersOrGroupsQueryVariables>(useGetUsersOrGroupsDocument, options);
      }
export function useuseGetUsersOrGroupsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<useGetUsersOrGroupsQuery, useGetUsersOrGroupsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<useGetUsersOrGroupsQuery, useGetUsersOrGroupsQueryVariables>(useGetUsersOrGroupsDocument, options);
        }
export type useGetUsersOrGroupsQueryHookResult = ReturnType<typeof useuseGetUsersOrGroupsQuery>;
export type useGetUsersOrGroupsLazyQueryHookResult = ReturnType<typeof useuseGetUsersOrGroupsLazyQuery>;
export const WithAdminOrganizationRoleDocument = gql`
    query WithAdminOrganizationRole {
  me {
    role
  }
}
    `;
export function useWithAdminOrganizationRoleQuery(baseOptions?: Apollo.QueryHookOptions<WithAdminOrganizationRoleQuery, WithAdminOrganizationRoleQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<WithAdminOrganizationRoleQuery, WithAdminOrganizationRoleQueryVariables>(WithAdminOrganizationRoleDocument, options);
      }
export function useWithAdminOrganizationRoleLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<WithAdminOrganizationRoleQuery, WithAdminOrganizationRoleQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<WithAdminOrganizationRoleQuery, WithAdminOrganizationRoleQueryVariables>(WithAdminOrganizationRoleDocument, options);
        }
export type WithAdminOrganizationRoleQueryHookResult = ReturnType<typeof useWithAdminOrganizationRoleQuery>;
export type WithAdminOrganizationRoleLazyQueryHookResult = ReturnType<typeof useWithAdminOrganizationRoleLazyQuery>;
export const HasFeatureFlagDocument = gql`
    query HasFeatureFlag($featureFlag: FeatureFlag!) {
  me {
    id
    hasFeatureFlag: hasFeatureFlag(featureFlag: $featureFlag)
  }
}
    `;
export function useHasFeatureFlagQuery(baseOptions: Apollo.QueryHookOptions<HasFeatureFlagQuery, HasFeatureFlagQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<HasFeatureFlagQuery, HasFeatureFlagQueryVariables>(HasFeatureFlagDocument, options);
      }
export function useHasFeatureFlagLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<HasFeatureFlagQuery, HasFeatureFlagQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<HasFeatureFlagQuery, HasFeatureFlagQueryVariables>(HasFeatureFlagDocument, options);
        }
export type HasFeatureFlagQueryHookResult = ReturnType<typeof useHasFeatureFlagQuery>;
export type HasFeatureFlagLazyQueryHookResult = ReturnType<typeof useHasFeatureFlagLazyQuery>;
export const WithSuperAdminAccessDocument = gql`
    query WithSuperAdminAccess {
  me {
    isSuperAdmin
  }
}
    `;
export function useWithSuperAdminAccessQuery(baseOptions?: Apollo.QueryHookOptions<WithSuperAdminAccessQuery, WithSuperAdminAccessQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<WithSuperAdminAccessQuery, WithSuperAdminAccessQueryVariables>(WithSuperAdminAccessDocument, options);
      }
export function useWithSuperAdminAccessLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<WithSuperAdminAccessQuery, WithSuperAdminAccessQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<WithSuperAdminAccessQuery, WithSuperAdminAccessQueryVariables>(WithSuperAdminAccessDocument, options);
        }
export type WithSuperAdminAccessQueryHookResult = ReturnType<typeof useWithSuperAdminAccessQuery>;
export type WithSuperAdminAccessLazyQueryHookResult = ReturnType<typeof useWithSuperAdminAccessLazyQuery>;
export const ImportContactsDialog_bulkCreateContactsDocument = gql`
    mutation ImportContactsDialog_bulkCreateContacts($file: Upload!) {
  bulkCreateContacts(file: $file) {
    id
  }
}
    `;
export function useImportContactsDialog_bulkCreateContactsMutation(baseOptions?: Apollo.MutationHookOptions<ImportContactsDialog_bulkCreateContactsMutation, ImportContactsDialog_bulkCreateContactsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ImportContactsDialog_bulkCreateContactsMutation, ImportContactsDialog_bulkCreateContactsMutationVariables>(ImportContactsDialog_bulkCreateContactsDocument, options);
      }
export type ImportContactsDialog_bulkCreateContactsMutationHookResult = ReturnType<typeof useImportContactsDialog_bulkCreateContactsMutation>;
export const AppLayout_updateOnboardingStatusDocument = gql`
    mutation AppLayout_updateOnboardingStatus($key: OnboardingKey!, $status: OnboardingStatus!) {
  updateOnboardingStatus(key: $key, status: $status) {
    id
    onboardingStatus
  }
}
    `;
export function useAppLayout_updateOnboardingStatusMutation(baseOptions?: Apollo.MutationHookOptions<AppLayout_updateOnboardingStatusMutation, AppLayout_updateOnboardingStatusMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AppLayout_updateOnboardingStatusMutation, AppLayout_updateOnboardingStatusMutationVariables>(AppLayout_updateOnboardingStatusDocument, options);
      }
export type AppLayout_updateOnboardingStatusMutationHookResult = ReturnType<typeof useAppLayout_updateOnboardingStatusMutation>;
export const PetitionHeader_reopenPetitionDocument = gql`
    mutation PetitionHeader_reopenPetition($petitionId: GID!) {
  reopenPetition(petitionId: $petitionId) {
    id
    status
    updatedAt
  }
}
    `;
export function usePetitionHeader_reopenPetitionMutation(baseOptions?: Apollo.MutationHookOptions<PetitionHeader_reopenPetitionMutation, PetitionHeader_reopenPetitionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionHeader_reopenPetitionMutation, PetitionHeader_reopenPetitionMutationVariables>(PetitionHeader_reopenPetitionDocument, options);
      }
export type PetitionHeader_reopenPetitionMutationHookResult = ReturnType<typeof usePetitionHeader_reopenPetitionMutation>;
export const PetitionHeader_updatePetitionPermissionSubscriptionDocument = gql`
    mutation PetitionHeader_updatePetitionPermissionSubscription($petitionId: GID!, $isSubscribed: Boolean!) {
  updatePetitionPermissionSubscription(
    petitionId: $petitionId
    isSubscribed: $isSubscribed
  ) {
    id
    myEffectivePermission {
      isSubscribed
    }
  }
}
    `;
export function usePetitionHeader_updatePetitionPermissionSubscriptionMutation(baseOptions?: Apollo.MutationHookOptions<PetitionHeader_updatePetitionPermissionSubscriptionMutation, PetitionHeader_updatePetitionPermissionSubscriptionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionHeader_updatePetitionPermissionSubscriptionMutation, PetitionHeader_updatePetitionPermissionSubscriptionMutationVariables>(PetitionHeader_updatePetitionPermissionSubscriptionDocument, options);
      }
export type PetitionHeader_updatePetitionPermissionSubscriptionMutationHookResult = ReturnType<typeof usePetitionHeader_updatePetitionPermissionSubscriptionMutation>;
export const Notifications_UnreadPetitionUserNotificationIdsDocument = gql`
    query Notifications_UnreadPetitionUserNotificationIds {
  me {
    id
    unreadNotificationIds
  }
}
    `;
export function useNotifications_UnreadPetitionUserNotificationIdsQuery(baseOptions?: Apollo.QueryHookOptions<Notifications_UnreadPetitionUserNotificationIdsQuery, Notifications_UnreadPetitionUserNotificationIdsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<Notifications_UnreadPetitionUserNotificationIdsQuery, Notifications_UnreadPetitionUserNotificationIdsQueryVariables>(Notifications_UnreadPetitionUserNotificationIdsDocument, options);
      }
export function useNotifications_UnreadPetitionUserNotificationIdsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<Notifications_UnreadPetitionUserNotificationIdsQuery, Notifications_UnreadPetitionUserNotificationIdsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<Notifications_UnreadPetitionUserNotificationIdsQuery, Notifications_UnreadPetitionUserNotificationIdsQueryVariables>(Notifications_UnreadPetitionUserNotificationIdsDocument, options);
        }
export type Notifications_UnreadPetitionUserNotificationIdsQueryHookResult = ReturnType<typeof useNotifications_UnreadPetitionUserNotificationIdsQuery>;
export type Notifications_UnreadPetitionUserNotificationIdsLazyQueryHookResult = ReturnType<typeof useNotifications_UnreadPetitionUserNotificationIdsLazyQuery>;
export const NotificationsDrawer_PetitionUserNotificationsDocument = gql`
    query NotificationsDrawer_PetitionUserNotifications($limit: Int!, $before: DateTime, $filter: PetitionUserNotificationFilter) {
  me {
    id
    unreadNotificationIds
    notifications(limit: $limit, before: $before, filter: $filter) {
      items {
        ...NotificationsDrawer_PetitionUserNotification
      }
      hasMore
    }
  }
}
    ${NotificationsDrawer_PetitionUserNotificationFragmentDoc}`;
export function useNotificationsDrawer_PetitionUserNotificationsQuery(baseOptions: Apollo.QueryHookOptions<NotificationsDrawer_PetitionUserNotificationsQuery, NotificationsDrawer_PetitionUserNotificationsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<NotificationsDrawer_PetitionUserNotificationsQuery, NotificationsDrawer_PetitionUserNotificationsQueryVariables>(NotificationsDrawer_PetitionUserNotificationsDocument, options);
      }
export function useNotificationsDrawer_PetitionUserNotificationsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<NotificationsDrawer_PetitionUserNotificationsQuery, NotificationsDrawer_PetitionUserNotificationsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<NotificationsDrawer_PetitionUserNotificationsQuery, NotificationsDrawer_PetitionUserNotificationsQueryVariables>(NotificationsDrawer_PetitionUserNotificationsDocument, options);
        }
export type NotificationsDrawer_PetitionUserNotificationsQueryHookResult = ReturnType<typeof useNotificationsDrawer_PetitionUserNotificationsQuery>;
export type NotificationsDrawer_PetitionUserNotificationsLazyQueryHookResult = ReturnType<typeof useNotificationsDrawer_PetitionUserNotificationsLazyQuery>;
export const CreateUserDialog_emailIsAvailableDocument = gql`
    query CreateUserDialog_emailIsAvailable($email: String!) {
  emailIsAvailable(email: $email)
}
    `;
export function useCreateUserDialog_emailIsAvailableQuery(baseOptions: Apollo.QueryHookOptions<CreateUserDialog_emailIsAvailableQuery, CreateUserDialog_emailIsAvailableQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<CreateUserDialog_emailIsAvailableQuery, CreateUserDialog_emailIsAvailableQueryVariables>(CreateUserDialog_emailIsAvailableDocument, options);
      }
export function useCreateUserDialog_emailIsAvailableLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CreateUserDialog_emailIsAvailableQuery, CreateUserDialog_emailIsAvailableQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<CreateUserDialog_emailIsAvailableQuery, CreateUserDialog_emailIsAvailableQueryVariables>(CreateUserDialog_emailIsAvailableDocument, options);
        }
export type CreateUserDialog_emailIsAvailableQueryHookResult = ReturnType<typeof useCreateUserDialog_emailIsAvailableQuery>;
export type CreateUserDialog_emailIsAvailableLazyQueryHookResult = ReturnType<typeof useCreateUserDialog_emailIsAvailableLazyQuery>;
export const AddPetitionAccessDialog_contactsByEmailDocument = gql`
    query AddPetitionAccessDialog_contactsByEmail($emails: [String!]!) {
  contactsByEmail(emails: $emails) {
    ...ContactSelect_Contact
  }
}
    ${ContactSelect_ContactFragmentDoc}`;
export function useAddPetitionAccessDialog_contactsByEmailQuery(baseOptions: Apollo.QueryHookOptions<AddPetitionAccessDialog_contactsByEmailQuery, AddPetitionAccessDialog_contactsByEmailQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<AddPetitionAccessDialog_contactsByEmailQuery, AddPetitionAccessDialog_contactsByEmailQueryVariables>(AddPetitionAccessDialog_contactsByEmailDocument, options);
      }
export function useAddPetitionAccessDialog_contactsByEmailLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<AddPetitionAccessDialog_contactsByEmailQuery, AddPetitionAccessDialog_contactsByEmailQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<AddPetitionAccessDialog_contactsByEmailQuery, AddPetitionAccessDialog_contactsByEmailQueryVariables>(AddPetitionAccessDialog_contactsByEmailDocument, options);
        }
export type AddPetitionAccessDialog_contactsByEmailQueryHookResult = ReturnType<typeof useAddPetitionAccessDialog_contactsByEmailQuery>;
export type AddPetitionAccessDialog_contactsByEmailLazyQueryHookResult = ReturnType<typeof useAddPetitionAccessDialog_contactsByEmailLazyQuery>;
export const PetitionSettings_cancelPetitionSignatureRequestDocument = gql`
    mutation PetitionSettings_cancelPetitionSignatureRequest($petitionSignatureRequestId: GID!) {
  cancelSignatureRequest(petitionSignatureRequestId: $petitionSignatureRequestId) {
    id
    status
  }
}
    `;
export function usePetitionSettings_cancelPetitionSignatureRequestMutation(baseOptions?: Apollo.MutationHookOptions<PetitionSettings_cancelPetitionSignatureRequestMutation, PetitionSettings_cancelPetitionSignatureRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionSettings_cancelPetitionSignatureRequestMutation, PetitionSettings_cancelPetitionSignatureRequestMutationVariables>(PetitionSettings_cancelPetitionSignatureRequestDocument, options);
      }
export type PetitionSettings_cancelPetitionSignatureRequestMutationHookResult = ReturnType<typeof usePetitionSettings_cancelPetitionSignatureRequestMutation>;
export const PetitionSettings_startPetitionSignatureRequestDocument = gql`
    mutation PetitionSettings_startPetitionSignatureRequest($petitionId: GID!) {
  startSignatureRequest(petitionId: $petitionId) {
    id
    status
  }
}
export type PetitionSettings_startPetitionSignatureRequestMutationHookResult = ReturnType<
  typeof usePetitionSettings_startPetitionSignatureRequestMutation
>;
export const PetitionSettings_createPublicPetitionLinkDocument = gql`
  mutation PetitionSettings_createPublicPetitionLink(
    $templateId: GID!
    $title: String!
    $description: String!
    $ownerId: GID!
    $otherPermissions: [UserOrUserGroupPublicLinkPermission!]
  ) {
    createPublicPetitionLink(
      templateId: $templateId
      title: $title
      description: $description
      ownerId: $ownerId
      otherPermissions: $otherPermissions
    ) {
      id
      publicLink {
        id
        title
        description
        slug
        linkPermissions {
          permissionType
        }
      }
    }
  }
`;
export function usePetitionSettings_createPublicPetitionLinkMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionSettings_createPublicPetitionLinkMutation,
    PetitionSettings_createPublicPetitionLinkMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionSettings_createPublicPetitionLinkMutation,
    PetitionSettings_createPublicPetitionLinkMutationVariables
  >(PetitionSettings_createPublicPetitionLinkDocument, options);
}
export type PetitionSettings_createPublicPetitionLinkMutationHookResult = ReturnType<
  typeof usePetitionSettings_createPublicPetitionLinkMutation
>;
export const PetitionSettings_updatePublicPetitionLinkDocument = gql`
  mutation PetitionSettings_updatePublicPetitionLink(
    $publicPetitionLinkId: GID!
    $isActive: Boolean
    $title: String
    $description: String
    $ownerId: GID
    $otherPermissions: [UserOrUserGroupPublicLinkPermission!]
  ) {
    updatePublicPetitionLink(
      publicPetitionLinkId: $publicPetitionLinkId
      isActive: $isActive
      title: $title
      description: $description
      ownerId: $ownerId
      otherPermissions: $otherPermissions
    ) {
      id
      title
      description
      slug
      isActive
      linkPermissions {
        permissionType
      }
    }
  }
`;
export function usePetitionSettings_updatePublicPetitionLinkMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionSettings_updatePublicPetitionLinkMutation,
    PetitionSettings_updatePublicPetitionLinkMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionSettings_updatePublicPetitionLinkMutation,
    PetitionSettings_updatePublicPetitionLinkMutationVariables
  >(PetitionSettings_updatePublicPetitionLinkDocument, options);
}
export type PetitionSettings_updatePublicPetitionLinkMutationHookResult = ReturnType<
  typeof usePetitionSettings_updatePublicPetitionLinkMutation
>;
export const PetitionSharingModal_addPetitionPermissionDocument = gql`
    mutation PetitionSharingModal_addPetitionPermission($petitionIds: [GID!]!, $userIds: [GID!], $userGroupIds: [GID!], $permissionType: PetitionPermissionTypeRW!, $notify: Boolean, $subscribe: Boolean, $message: String) {
  addPetitionPermission(
    petitionIds: $petitionIds
    userIds: $userIds
    userGroupIds: $userGroupIds
    permissionType: $permissionType
    notify: $notify
    subscribe: $subscribe
    message: $message
  ) {
    ...PetitionSharingModal_Petition
  }
}
    ${PetitionSharingModal_PetitionFragmentDoc}`;
export function usePetitionSharingModal_addPetitionPermissionMutation(baseOptions?: Apollo.MutationHookOptions<PetitionSharingModal_addPetitionPermissionMutation, PetitionSharingModal_addPetitionPermissionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionSharingModal_addPetitionPermissionMutation, PetitionSharingModal_addPetitionPermissionMutationVariables>(PetitionSharingModal_addPetitionPermissionDocument, options);
      }
export type PetitionSharingModal_addPetitionPermissionMutationHookResult = ReturnType<typeof usePetitionSharingModal_addPetitionPermissionMutation>;
export const PetitionSharingModal_removePetitionPermissionDocument = gql`
    mutation PetitionSharingModal_removePetitionPermission($petitionId: GID!, $userIds: [GID!], $userGroupIds: [GID!]) {
  removePetitionPermission(
    petitionIds: [$petitionId]
    userIds: $userIds
    userGroupIds: $userGroupIds
  ) {
    ...PetitionSharingModal_Petition
  }
}
    ${PetitionSharingModal_PetitionFragmentDoc}`;
export function usePetitionSharingModal_removePetitionPermissionMutation(baseOptions?: Apollo.MutationHookOptions<PetitionSharingModal_removePetitionPermissionMutation, PetitionSharingModal_removePetitionPermissionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionSharingModal_removePetitionPermissionMutation, PetitionSharingModal_removePetitionPermissionMutationVariables>(PetitionSharingModal_removePetitionPermissionDocument, options);
      }
export type PetitionSharingModal_removePetitionPermissionMutationHookResult = ReturnType<typeof usePetitionSharingModal_removePetitionPermissionMutation>;
export const PetitionSharingModal_transferPetitionOwnershipDocument = gql`
    mutation PetitionSharingModal_transferPetitionOwnership($petitionId: GID!, $userId: GID!) {
  transferPetitionOwnership(petitionIds: [$petitionId], userId: $userId) {
    ...PetitionSharingModal_Petition
  }
}
    ${PetitionSharingModal_PetitionFragmentDoc}`;
export function usePetitionSharingModal_transferPetitionOwnershipMutation(baseOptions?: Apollo.MutationHookOptions<PetitionSharingModal_transferPetitionOwnershipMutation, PetitionSharingModal_transferPetitionOwnershipMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionSharingModal_transferPetitionOwnershipMutation, PetitionSharingModal_transferPetitionOwnershipMutationVariables>(PetitionSharingModal_transferPetitionOwnershipDocument, options);
      }
export type PetitionSharingModal_transferPetitionOwnershipMutationHookResult = ReturnType<typeof usePetitionSharingModal_transferPetitionOwnershipMutation>;
export const PetitionSharingModal_PetitionsDocument = gql`
    query PetitionSharingModal_Petitions($petitionIds: [GID!]!) {
  petitionsById(ids: $petitionIds) {
    ...PetitionSharingModal_Petition
  }
}
    ${PetitionSharingModal_PetitionFragmentDoc}`;
export function usePetitionSharingModal_PetitionsQuery(baseOptions: Apollo.QueryHookOptions<PetitionSharingModal_PetitionsQuery, PetitionSharingModal_PetitionsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PetitionSharingModal_PetitionsQuery, PetitionSharingModal_PetitionsQueryVariables>(PetitionSharingModal_PetitionsDocument, options);
      }
export function usePetitionSharingModal_PetitionsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PetitionSharingModal_PetitionsQuery, PetitionSharingModal_PetitionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PetitionSharingModal_PetitionsQuery, PetitionSharingModal_PetitionsQueryVariables>(PetitionSharingModal_PetitionsDocument, options);
        }
export type PetitionSharingModal_PetitionsQueryHookResult = ReturnType<typeof usePetitionSharingModal_PetitionsQuery>;
export type PetitionSharingModal_PetitionsLazyQueryHookResult = ReturnType<typeof usePetitionSharingModal_PetitionsLazyQuery>;
export const useTemplateDetailsDialogPetitionDocument = gql`
    query useTemplateDetailsDialogPetition($templateId: GID!) {
  petition(id: $templateId) {
    ...TemplateDetailsDialog_PetitionTemplate
  }
}
    ${TemplateDetailsDialog_PetitionTemplateFragmentDoc}`;
export function useuseTemplateDetailsDialogPetitionQuery(baseOptions: Apollo.QueryHookOptions<useTemplateDetailsDialogPetitionQuery, useTemplateDetailsDialogPetitionQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<useTemplateDetailsDialogPetitionQuery, useTemplateDetailsDialogPetitionQueryVariables>(useTemplateDetailsDialogPetitionDocument, options);
      }
export function useuseTemplateDetailsDialogPetitionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<useTemplateDetailsDialogPetitionQuery, useTemplateDetailsDialogPetitionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<useTemplateDetailsDialogPetitionQuery, useTemplateDetailsDialogPetitionQueryVariables>(useTemplateDetailsDialogPetitionDocument, options);
        }
export type useTemplateDetailsDialogPetitionQueryHookResult = ReturnType<typeof useuseTemplateDetailsDialogPetitionQuery>;
export type useTemplateDetailsDialogPetitionLazyQueryHookResult = ReturnType<typeof useuseTemplateDetailsDialogPetitionLazyQuery>;
export const DynamicSelectSettings_uploadDynamicSelectFieldFileDocument = gql`
    mutation DynamicSelectSettings_uploadDynamicSelectFieldFile($petitionId: GID!, $fieldId: GID!, $file: Upload!) {
  uploadDynamicSelectFieldFile(
    petitionId: $petitionId
    fieldId: $fieldId
    file: $file
  ) {
    id
    options
  }
}
    `;
export function useDynamicSelectSettings_uploadDynamicSelectFieldFileMutation(baseOptions?: Apollo.MutationHookOptions<DynamicSelectSettings_uploadDynamicSelectFieldFileMutation, DynamicSelectSettings_uploadDynamicSelectFieldFileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DynamicSelectSettings_uploadDynamicSelectFieldFileMutation, DynamicSelectSettings_uploadDynamicSelectFieldFileMutationVariables>(DynamicSelectSettings_uploadDynamicSelectFieldFileDocument, options);
      }
export type DynamicSelectSettings_uploadDynamicSelectFieldFileMutationHookResult = ReturnType<typeof useDynamicSelectSettings_uploadDynamicSelectFieldFileMutation>;
export const DynamicSelectSettings_dynamicSelectFieldFileDownloadLinkDocument = gql`
    mutation DynamicSelectSettings_dynamicSelectFieldFileDownloadLink($petitionId: GID!, $fieldId: GID!) {
  dynamicSelectFieldFileDownloadLink(petitionId: $petitionId, fieldId: $fieldId) {
    result
    url
  }
}
    `;
export function useDynamicSelectSettings_dynamicSelectFieldFileDownloadLinkMutation(baseOptions?: Apollo.MutationHookOptions<DynamicSelectSettings_dynamicSelectFieldFileDownloadLinkMutation, DynamicSelectSettings_dynamicSelectFieldFileDownloadLinkMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DynamicSelectSettings_dynamicSelectFieldFileDownloadLinkMutation, DynamicSelectSettings_dynamicSelectFieldFileDownloadLinkMutationVariables>(DynamicSelectSettings_dynamicSelectFieldFileDownloadLinkDocument, options);
      }
export type DynamicSelectSettings_dynamicSelectFieldFileDownloadLinkMutationHookResult = ReturnType<typeof useDynamicSelectSettings_dynamicSelectFieldFileDownloadLinkMutation>;
export const PetitionComposeField_createPetitionFieldAttachmentUploadLinkDocument = gql`
    mutation PetitionComposeField_createPetitionFieldAttachmentUploadLink($petitionId: GID!, $fieldId: GID!, $data: FileUploadInput!) {
  createPetitionFieldAttachmentUploadLink(
    petitionId: $petitionId
    fieldId: $fieldId
    data: $data
  ) {
    presignedPostData {
      ...uploadFile_AWSPresignedPostData
    }
    attachment {
      ...PetitionComposeField_PetitionFieldAttachment
    }
  }
}
    ${uploadFile_AWSPresignedPostDataFragmentDoc}
${PetitionComposeField_PetitionFieldAttachmentFragmentDoc}`;
export function usePetitionComposeField_createPetitionFieldAttachmentUploadLinkMutation(baseOptions?: Apollo.MutationHookOptions<PetitionComposeField_createPetitionFieldAttachmentUploadLinkMutation, PetitionComposeField_createPetitionFieldAttachmentUploadLinkMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionComposeField_createPetitionFieldAttachmentUploadLinkMutation, PetitionComposeField_createPetitionFieldAttachmentUploadLinkMutationVariables>(PetitionComposeField_createPetitionFieldAttachmentUploadLinkDocument, options);
      }
export type PetitionComposeField_createPetitionFieldAttachmentUploadLinkMutationHookResult = ReturnType<typeof usePetitionComposeField_createPetitionFieldAttachmentUploadLinkMutation>;
export const PetitionComposeField_petitionFieldAttachmentUploadCompleteDocument = gql`
    mutation PetitionComposeField_petitionFieldAttachmentUploadComplete($petitionId: GID!, $fieldId: GID!, $attachmentId: GID!) {
  petitionFieldAttachmentUploadComplete(
    petitionId: $petitionId
    fieldId: $fieldId
    attachmentId: $attachmentId
  ) {
    ...PetitionComposeField_PetitionFieldAttachment
  }
}
    ${PetitionComposeField_PetitionFieldAttachmentFragmentDoc}`;
export function usePetitionComposeField_petitionFieldAttachmentUploadCompleteMutation(baseOptions?: Apollo.MutationHookOptions<PetitionComposeField_petitionFieldAttachmentUploadCompleteMutation, PetitionComposeField_petitionFieldAttachmentUploadCompleteMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionComposeField_petitionFieldAttachmentUploadCompleteMutation, PetitionComposeField_petitionFieldAttachmentUploadCompleteMutationVariables>(PetitionComposeField_petitionFieldAttachmentUploadCompleteDocument, options);
      }
export type PetitionComposeField_petitionFieldAttachmentUploadCompleteMutationHookResult = ReturnType<typeof usePetitionComposeField_petitionFieldAttachmentUploadCompleteMutation>;
export const PetitionComposeField_removePetitionFieldAttachmentDocument = gql`
    mutation PetitionComposeField_removePetitionFieldAttachment($petitionId: GID!, $fieldId: GID!, $attachmentId: GID!) {
  removePetitionFieldAttachment(
    petitionId: $petitionId
    fieldId: $fieldId
    attachmentId: $attachmentId
  )
}
    `;
export function usePetitionComposeField_removePetitionFieldAttachmentMutation(baseOptions?: Apollo.MutationHookOptions<PetitionComposeField_removePetitionFieldAttachmentMutation, PetitionComposeField_removePetitionFieldAttachmentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionComposeField_removePetitionFieldAttachmentMutation, PetitionComposeField_removePetitionFieldAttachmentMutationVariables>(PetitionComposeField_removePetitionFieldAttachmentDocument, options);
      }
export type PetitionComposeField_removePetitionFieldAttachmentMutationHookResult = ReturnType<typeof usePetitionComposeField_removePetitionFieldAttachmentMutation>;
export const PetitionComposeField_petitionFieldAttachmentDownloadLinkDocument = gql`
    mutation PetitionComposeField_petitionFieldAttachmentDownloadLink($petitionId: GID!, $fieldId: GID!, $attachmentId: GID!) {
  petitionFieldAttachmentDownloadLink(
    petitionId: $petitionId
    fieldId: $fieldId
    attachmentId: $attachmentId
  ) {
    url
  }
}
    `;
export function usePetitionComposeField_petitionFieldAttachmentDownloadLinkMutation(baseOptions?: Apollo.MutationHookOptions<PetitionComposeField_petitionFieldAttachmentDownloadLinkMutation, PetitionComposeField_petitionFieldAttachmentDownloadLinkMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionComposeField_petitionFieldAttachmentDownloadLinkMutation, PetitionComposeField_petitionFieldAttachmentDownloadLinkMutationVariables>(PetitionComposeField_petitionFieldAttachmentDownloadLinkDocument, options);
      }
export type PetitionComposeField_petitionFieldAttachmentDownloadLinkMutationHookResult = ReturnType<typeof usePetitionComposeField_petitionFieldAttachmentDownloadLinkMutation>;
export const PetitionListTagFilter_tagsDocument = gql`
    query PetitionListTagFilter_tags($search: String) {
  tags(search: $search) {
    items {
      ...PetitionTagListCellContent_Tag
    }
  }
}
    ${PetitionTagListCellContent_TagFragmentDoc}`;
export function usePetitionListTagFilter_tagsQuery(baseOptions?: Apollo.QueryHookOptions<PetitionListTagFilter_tagsQuery, PetitionListTagFilter_tagsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PetitionListTagFilter_tagsQuery, PetitionListTagFilter_tagsQueryVariables>(PetitionListTagFilter_tagsDocument, options);
      }
export function usePetitionListTagFilter_tagsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PetitionListTagFilter_tagsQuery, PetitionListTagFilter_tagsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PetitionListTagFilter_tagsQuery, PetitionListTagFilter_tagsQueryVariables>(PetitionListTagFilter_tagsDocument, options);
        }
export type PetitionListTagFilter_tagsQueryHookResult = ReturnType<typeof usePetitionListTagFilter_tagsQuery>;
export type PetitionListTagFilter_tagsLazyQueryHookResult = ReturnType<typeof usePetitionListTagFilter_tagsLazyQuery>;
export const ExportRepliesProgressDialog_PetitionRepliesDocument = gql`
    query ExportRepliesProgressDialog_PetitionReplies($petitionId: GID!) {
  petition(id: $petitionId) {
    ...ExportRepliesProgressDialog_Petition
  }
}
    ${ExportRepliesProgressDialog_PetitionFragmentDoc}`;
export function useExportRepliesProgressDialog_PetitionRepliesQuery(baseOptions: Apollo.QueryHookOptions<ExportRepliesProgressDialog_PetitionRepliesQuery, ExportRepliesProgressDialog_PetitionRepliesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ExportRepliesProgressDialog_PetitionRepliesQuery, ExportRepliesProgressDialog_PetitionRepliesQueryVariables>(ExportRepliesProgressDialog_PetitionRepliesDocument, options);
      }
export function useExportRepliesProgressDialog_PetitionRepliesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ExportRepliesProgressDialog_PetitionRepliesQuery, ExportRepliesProgressDialog_PetitionRepliesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ExportRepliesProgressDialog_PetitionRepliesQuery, ExportRepliesProgressDialog_PetitionRepliesQueryVariables>(ExportRepliesProgressDialog_PetitionRepliesDocument, options);
        }
export type ExportRepliesProgressDialog_PetitionRepliesQueryHookResult = ReturnType<typeof useExportRepliesProgressDialog_PetitionRepliesQuery>;
export type ExportRepliesProgressDialog_PetitionRepliesLazyQueryHookResult = ReturnType<typeof useExportRepliesProgressDialog_PetitionRepliesLazyQuery>;
export const ExportRepliesProgressDialog_fileUploadReplyDownloadLinkDocument = gql`
    mutation ExportRepliesProgressDialog_fileUploadReplyDownloadLink($petitionId: GID!, $replyId: GID!) {
  fileUploadReplyDownloadLink(petitionId: $petitionId, replyId: $replyId) {
    result
    url
  }
}
    `;
export function useExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutation(baseOptions?: Apollo.MutationHookOptions<ExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutation, ExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutation, ExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutationVariables>(ExportRepliesProgressDialog_fileUploadReplyDownloadLinkDocument, options);
      }
export type ExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutationHookResult = ReturnType<typeof useExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutation>;
export const ExportRepliesProgressDialog_signedPetitionDownloadLinkDocument = gql`
    mutation ExportRepliesProgressDialog_signedPetitionDownloadLink($petitionSignatureRequestId: GID!, $downloadAuditTrail: Boolean) {
  signedPetitionDownloadLink(
    petitionSignatureRequestId: $petitionSignatureRequestId
    downloadAuditTrail: $downloadAuditTrail
  ) {
    result
    url
  }
}
    `;
export function useExportRepliesProgressDialog_signedPetitionDownloadLinkMutation(baseOptions?: Apollo.MutationHookOptions<ExportRepliesProgressDialog_signedPetitionDownloadLinkMutation, ExportRepliesProgressDialog_signedPetitionDownloadLinkMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ExportRepliesProgressDialog_signedPetitionDownloadLinkMutation, ExportRepliesProgressDialog_signedPetitionDownloadLinkMutationVariables>(ExportRepliesProgressDialog_signedPetitionDownloadLinkDocument, options);
      }
export type ExportRepliesProgressDialog_signedPetitionDownloadLinkMutationHookResult = ReturnType<typeof useExportRepliesProgressDialog_signedPetitionDownloadLinkMutation>;
export const ExportRepliesProgressDialog_updatePetitionFieldReplyMetadataDocument = gql`
    mutation ExportRepliesProgressDialog_updatePetitionFieldReplyMetadata($petitionId: GID!, $replyId: GID!, $metadata: JSONObject!) {
  updatePetitionFieldReplyMetadata(
    petitionId: $petitionId
    replyId: $replyId
    metadata: $metadata
  ) {
    id
    metadata
  }
}
    `;
export function useExportRepliesProgressDialog_updatePetitionFieldReplyMetadataMutation(baseOptions?: Apollo.MutationHookOptions<ExportRepliesProgressDialog_updatePetitionFieldReplyMetadataMutation, ExportRepliesProgressDialog_updatePetitionFieldReplyMetadataMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ExportRepliesProgressDialog_updatePetitionFieldReplyMetadataMutation, ExportRepliesProgressDialog_updatePetitionFieldReplyMetadataMutationVariables>(ExportRepliesProgressDialog_updatePetitionFieldReplyMetadataDocument, options);
      }
export type ExportRepliesProgressDialog_updatePetitionFieldReplyMetadataMutationHookResult = ReturnType<typeof useExportRepliesProgressDialog_updatePetitionFieldReplyMetadataMutation>;
export const ExportRepliesProgressDialog_updateSignatureRequestMetadataDocument = gql`
    mutation ExportRepliesProgressDialog_updateSignatureRequestMetadata($petitionSignatureRequestId: GID!, $metadata: JSONObject!) {
  updateSignatureRequestMetadata(
    petitionSignatureRequestId: $petitionSignatureRequestId
    metadata: $metadata
  ) {
    id
    metadata
  }
}
    `;
export function useExportRepliesProgressDialog_updateSignatureRequestMetadataMutation(baseOptions?: Apollo.MutationHookOptions<ExportRepliesProgressDialog_updateSignatureRequestMetadataMutation, ExportRepliesProgressDialog_updateSignatureRequestMetadataMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ExportRepliesProgressDialog_updateSignatureRequestMetadataMutation, ExportRepliesProgressDialog_updateSignatureRequestMetadataMutationVariables>(ExportRepliesProgressDialog_updateSignatureRequestMetadataDocument, options);
      }
export type ExportRepliesProgressDialog_updateSignatureRequestMetadataMutationHookResult = ReturnType<typeof useExportRepliesProgressDialog_updateSignatureRequestMetadataMutation>;
export const PetitionRepliesField_petitionFieldAttachmentDownloadLinkDocument = gql`
    mutation PetitionRepliesField_petitionFieldAttachmentDownloadLink($petitionId: GID!, $fieldId: GID!, $attachmentId: GID!) {
  petitionFieldAttachmentDownloadLink(
    petitionId: $petitionId
    fieldId: $fieldId
    attachmentId: $attachmentId
  ) {
    url
  }
}
    `;
export function usePetitionRepliesField_petitionFieldAttachmentDownloadLinkMutation(baseOptions?: Apollo.MutationHookOptions<PetitionRepliesField_petitionFieldAttachmentDownloadLinkMutation, PetitionRepliesField_petitionFieldAttachmentDownloadLinkMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionRepliesField_petitionFieldAttachmentDownloadLinkMutation, PetitionRepliesField_petitionFieldAttachmentDownloadLinkMutationVariables>(PetitionRepliesField_petitionFieldAttachmentDownloadLinkDocument, options);
      }
export type PetitionRepliesField_petitionFieldAttachmentDownloadLinkMutationHookResult = ReturnType<typeof usePetitionRepliesField_petitionFieldAttachmentDownloadLinkMutation>;
export const PetitionSignaturesCard_updatePetitionSignatureConfigDocument = gql`
    mutation PetitionSignaturesCard_updatePetitionSignatureConfig($petitionId: GID!, $signatureConfig: SignatureConfigInput) {
  updatePetition(
    petitionId: $petitionId
    data: {signatureConfig: $signatureConfig}
  ) {
    ... on Petition {
      ...PetitionSignaturesCard_Petition
    }
  }
}
    ${PetitionSignaturesCard_PetitionFragmentDoc}`;
export function usePetitionSignaturesCard_updatePetitionSignatureConfigMutation(baseOptions?: Apollo.MutationHookOptions<PetitionSignaturesCard_updatePetitionSignatureConfigMutation, PetitionSignaturesCard_updatePetitionSignatureConfigMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionSignaturesCard_updatePetitionSignatureConfigMutation, PetitionSignaturesCard_updatePetitionSignatureConfigMutationVariables>(PetitionSignaturesCard_updatePetitionSignatureConfigDocument, options);
      }
export type PetitionSignaturesCard_updatePetitionSignatureConfigMutationHookResult = ReturnType<typeof usePetitionSignaturesCard_updatePetitionSignatureConfigMutation>;
export const PetitionSignaturesCard_cancelSignatureRequestDocument = gql`
    mutation PetitionSignaturesCard_cancelSignatureRequest($petitionSignatureRequestId: GID!) {
  cancelSignatureRequest(petitionSignatureRequestId: $petitionSignatureRequestId) {
    id
    status
  }
}
    `;
export function usePetitionSignaturesCard_cancelSignatureRequestMutation(baseOptions?: Apollo.MutationHookOptions<PetitionSignaturesCard_cancelSignatureRequestMutation, PetitionSignaturesCard_cancelSignatureRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionSignaturesCard_cancelSignatureRequestMutation, PetitionSignaturesCard_cancelSignatureRequestMutationVariables>(PetitionSignaturesCard_cancelSignatureRequestDocument, options);
      }
export type PetitionSignaturesCard_cancelSignatureRequestMutationHookResult = ReturnType<typeof usePetitionSignaturesCard_cancelSignatureRequestMutation>;
export const PetitionSignaturesCard_startSignatureRequestDocument = gql`
    mutation PetitionSignaturesCard_startSignatureRequest($petitionId: GID!) {
  startSignatureRequest(petitionId: $petitionId) {
    id
    status
  }
}
    `;
export function usePetitionSignaturesCard_startSignatureRequestMutation(baseOptions?: Apollo.MutationHookOptions<PetitionSignaturesCard_startSignatureRequestMutation, PetitionSignaturesCard_startSignatureRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionSignaturesCard_startSignatureRequestMutation, PetitionSignaturesCard_startSignatureRequestMutationVariables>(PetitionSignaturesCard_startSignatureRequestDocument, options);
      }
export type PetitionSignaturesCard_startSignatureRequestMutationHookResult = ReturnType<typeof usePetitionSignaturesCard_startSignatureRequestMutation>;
export const PetitionSignaturesCard_signedPetitionDownloadLinkDocument = gql`
    mutation PetitionSignaturesCard_signedPetitionDownloadLink($petitionSignatureRequestId: GID!, $preview: Boolean) {
  signedPetitionDownloadLink(
    petitionSignatureRequestId: $petitionSignatureRequestId
    preview: $preview
  ) {
    result
    url
  }
}
    `;
export function usePetitionSignaturesCard_signedPetitionDownloadLinkMutation(baseOptions?: Apollo.MutationHookOptions<PetitionSignaturesCard_signedPetitionDownloadLinkMutation, PetitionSignaturesCard_signedPetitionDownloadLinkMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionSignaturesCard_signedPetitionDownloadLinkMutation, PetitionSignaturesCard_signedPetitionDownloadLinkMutationVariables>(PetitionSignaturesCard_signedPetitionDownloadLinkDocument, options);
      }
export type PetitionSignaturesCard_signedPetitionDownloadLinkMutationHookResult = ReturnType<typeof usePetitionSignaturesCard_signedPetitionDownloadLinkMutation>;
export const RecipientViewHeader_publicDelegateAccessToContactDocument = gql`
    mutation RecipientViewHeader_publicDelegateAccessToContact($keycode: ID!, $email: String!, $firstName: String!, $lastName: String!, $messageBody: JSON!) {
  publicDelegateAccessToContact(
    keycode: $keycode
    email: $email
    firstName: $firstName
    lastName: $lastName
    messageBody: $messageBody
  ) {
    petition {
      id
      recipients {
        id
        fullName
        email
      }
    }
  }
}
    `;
export function useRecipientViewHeader_publicDelegateAccessToContactMutation(baseOptions?: Apollo.MutationHookOptions<RecipientViewHeader_publicDelegateAccessToContactMutation, RecipientViewHeader_publicDelegateAccessToContactMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RecipientViewHeader_publicDelegateAccessToContactMutation, RecipientViewHeader_publicDelegateAccessToContactMutationVariables>(RecipientViewHeader_publicDelegateAccessToContactDocument, options);
      }
export type RecipientViewHeader_publicDelegateAccessToContactMutationHookResult = ReturnType<typeof useRecipientViewHeader_publicDelegateAccessToContactMutation>;
export const RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLinkDocument = gql`
    mutation RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLink($keycode: ID!, $fieldId: GID!, $attachmentId: GID!) {
  publicPetitionFieldAttachmentDownloadLink(
    keycode: $keycode
    fieldId: $fieldId
    attachmentId: $attachmentId
  ) {
    url
  }
}
    `;
export function useRecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLinkMutation(baseOptions?: Apollo.MutationHookOptions<RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLinkMutation, RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLinkMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLinkMutation, RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLinkMutationVariables>(RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLinkDocument, options);
      }
export type RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLinkMutationHookResult = ReturnType<typeof useRecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLinkMutation>;
export const RecipientViewPetitionFieldCommentsDocument = gql`
    query RecipientViewPetitionFieldComments($keycode: ID!, $petitionFieldId: GID!) {
  petitionFieldComments(keycode: $keycode, petitionFieldId: $petitionFieldId) {
    ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldComment
  }
}
    ${RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragmentDoc}`;
export function useRecipientViewPetitionFieldCommentsQuery(baseOptions: Apollo.QueryHookOptions<RecipientViewPetitionFieldCommentsQuery, RecipientViewPetitionFieldCommentsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<RecipientViewPetitionFieldCommentsQuery, RecipientViewPetitionFieldCommentsQueryVariables>(RecipientViewPetitionFieldCommentsDocument, options);
      }
export function useRecipientViewPetitionFieldCommentsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<RecipientViewPetitionFieldCommentsQuery, RecipientViewPetitionFieldCommentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<RecipientViewPetitionFieldCommentsQuery, RecipientViewPetitionFieldCommentsQueryVariables>(RecipientViewPetitionFieldCommentsDocument, options);
        }
export type RecipientViewPetitionFieldCommentsQueryHookResult = ReturnType<typeof useRecipientViewPetitionFieldCommentsQuery>;
export type RecipientViewPetitionFieldCommentsLazyQueryHookResult = ReturnType<typeof useRecipientViewPetitionFieldCommentsLazyQuery>;
export const RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadDocument = gql`
    mutation RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsRead($keycode: ID!, $petitionFieldCommentIds: [GID!]!) {
  publicMarkPetitionFieldCommentsAsRead(
    keycode: $keycode
    petitionFieldCommentIds: $petitionFieldCommentIds
  ) {
    id
    isUnread
  }
}
    `;
export function useRecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutation(baseOptions?: Apollo.MutationHookOptions<RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutation, RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutation, RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutationVariables>(RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadDocument, options);
      }
export type RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutationHookResult = ReturnType<typeof useRecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutation>;
export const RecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentDocument = gql`
    mutation RecipientViewPetitionFieldCommentsDialog_createPetitionFieldComment($keycode: ID!, $petitionFieldId: GID!, $content: String!) {
  publicCreatePetitionFieldComment(
    keycode: $keycode
    petitionFieldId: $petitionFieldId
    content: $content
  ) {
    ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldComment
  }
}
    ${RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragmentDoc}`;
export function useRecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutation(baseOptions?: Apollo.MutationHookOptions<RecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutation, RecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutation, RecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutationVariables>(RecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentDocument, options);
      }
export type RecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutationHookResult = ReturnType<typeof useRecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutation>;
export const RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentDocument = gql`
    mutation RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldComment($keycode: ID!, $petitionFieldId: GID!, $petitionFieldCommentId: GID!, $content: String!) {
  publicUpdatePetitionFieldComment(
    keycode: $keycode
    petitionFieldId: $petitionFieldId
    petitionFieldCommentId: $petitionFieldCommentId
    content: $content
  ) {
    ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldComment
  }
}
    ${RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragmentDoc}`;
export function useRecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutation(baseOptions?: Apollo.MutationHookOptions<RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutation, RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutation, RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutationVariables>(RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentDocument, options);
      }
export type RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutationHookResult = ReturnType<typeof useRecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutation>;
export const RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentDocument = gql`
    mutation RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldComment($keycode: ID!, $petitionFieldId: GID!, $petitionFieldCommentId: GID!) {
  publicDeletePetitionFieldComment(
    keycode: $keycode
    petitionFieldId: $petitionFieldId
    petitionFieldCommentId: $petitionFieldCommentId
  )
}
    `;
export function useRecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutation(baseOptions?: Apollo.MutationHookOptions<RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutation, RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutation, RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutationVariables>(RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentDocument, options);
      }
export type RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutationHookResult = ReturnType<typeof useRecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutation>;
export const RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkDocument = gql`
    mutation RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLink($keycode: ID!, $replyId: GID!, $preview: Boolean) {
  publicFileUploadReplyDownloadLink(
    keycode: $keycode
    replyId: $replyId
    preview: $preview
  ) {
    result
    url
  }
}
    `;
export function useRecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkMutation(baseOptions?: Apollo.MutationHookOptions<RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkMutation, RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkMutation, RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkMutationVariables>(RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkDocument, options);
      }
export type RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkMutationHookResult = ReturnType<typeof useRecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkMutation>;
export const RecipientViewPetitionFieldMutations_publicDeletePetitionReplyDocument = gql`
    mutation RecipientViewPetitionFieldMutations_publicDeletePetitionReply($replyId: GID!, $keycode: ID!) {
  publicDeletePetitionReply(replyId: $replyId, keycode: $keycode)
}
    `;
export function useRecipientViewPetitionFieldMutations_publicDeletePetitionReplyMutation(baseOptions?: Apollo.MutationHookOptions<RecipientViewPetitionFieldMutations_publicDeletePetitionReplyMutation, RecipientViewPetitionFieldMutations_publicDeletePetitionReplyMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RecipientViewPetitionFieldMutations_publicDeletePetitionReplyMutation, RecipientViewPetitionFieldMutations_publicDeletePetitionReplyMutationVariables>(RecipientViewPetitionFieldMutations_publicDeletePetitionReplyDocument, options);
      }
export type RecipientViewPetitionFieldMutations_publicDeletePetitionReplyMutationHookResult = ReturnType<typeof useRecipientViewPetitionFieldMutations_publicDeletePetitionReplyMutation>;
export const RecipientViewPetitionFieldMutations_publicUpdateSimpleReplyDocument = gql`
    mutation RecipientViewPetitionFieldMutations_publicUpdateSimpleReply($keycode: ID!, $replyId: GID!, $value: String!) {
  publicUpdateSimpleReply(keycode: $keycode, replyId: $replyId, value: $value) {
    id
    content
    status
    updatedAt
  }
}
    `;
export function useRecipientViewPetitionFieldMutations_publicUpdateSimpleReplyMutation(baseOptions?: Apollo.MutationHookOptions<RecipientViewPetitionFieldMutations_publicUpdateSimpleReplyMutation, RecipientViewPetitionFieldMutations_publicUpdateSimpleReplyMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RecipientViewPetitionFieldMutations_publicUpdateSimpleReplyMutation, RecipientViewPetitionFieldMutations_publicUpdateSimpleReplyMutationVariables>(RecipientViewPetitionFieldMutations_publicUpdateSimpleReplyDocument, options);
      }
export type RecipientViewPetitionFieldMutations_publicUpdateSimpleReplyMutationHookResult = ReturnType<typeof useRecipientViewPetitionFieldMutations_publicUpdateSimpleReplyMutation>;
export const RecipientViewPetitionFieldMutations_publicCreateSimpleReplyDocument = gql`
    mutation RecipientViewPetitionFieldMutations_publicCreateSimpleReply($keycode: ID!, $fieldId: GID!, $value: String!) {
  publicCreateSimpleReply(keycode: $keycode, fieldId: $fieldId, value: $value) {
    ...RecipientViewPetitionFieldCard_PublicPetitionFieldReply
  }
}
    ${RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragmentDoc}`;
export function useRecipientViewPetitionFieldMutations_publicCreateSimpleReplyMutation(baseOptions?: Apollo.MutationHookOptions<RecipientViewPetitionFieldMutations_publicCreateSimpleReplyMutation, RecipientViewPetitionFieldMutations_publicCreateSimpleReplyMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RecipientViewPetitionFieldMutations_publicCreateSimpleReplyMutation, RecipientViewPetitionFieldMutations_publicCreateSimpleReplyMutationVariables>(RecipientViewPetitionFieldMutations_publicCreateSimpleReplyDocument, options);
      }
export type RecipientViewPetitionFieldMutations_publicCreateSimpleReplyMutationHookResult = ReturnType<typeof useRecipientViewPetitionFieldMutations_publicCreateSimpleReplyMutation>;
export const RecipientViewPetitionFieldMutations_publicCreateCheckboxReplyDocument = gql`
    mutation RecipientViewPetitionFieldMutations_publicCreateCheckboxReply($keycode: ID!, $fieldId: GID!, $values: [String!]!) {
  publicCreateCheckboxReply(keycode: $keycode, fieldId: $fieldId, values: $values) {
    ...RecipientViewPetitionFieldCard_PublicPetitionFieldReply
  }
}
    ${RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragmentDoc}`;
export function useRecipientViewPetitionFieldMutations_publicCreateCheckboxReplyMutation(baseOptions?: Apollo.MutationHookOptions<RecipientViewPetitionFieldMutations_publicCreateCheckboxReplyMutation, RecipientViewPetitionFieldMutations_publicCreateCheckboxReplyMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RecipientViewPetitionFieldMutations_publicCreateCheckboxReplyMutation, RecipientViewPetitionFieldMutations_publicCreateCheckboxReplyMutationVariables>(RecipientViewPetitionFieldMutations_publicCreateCheckboxReplyDocument, options);
      }
export type RecipientViewPetitionFieldMutations_publicCreateCheckboxReplyMutationHookResult = ReturnType<typeof useRecipientViewPetitionFieldMutations_publicCreateCheckboxReplyMutation>;
export const RecipientViewPetitionFieldMutations_publicUpdateCheckboxReplyDocument = gql`
    mutation RecipientViewPetitionFieldMutations_publicUpdateCheckboxReply($keycode: ID!, $replyId: GID!, $values: [String!]!) {
  publicUpdateCheckboxReply(keycode: $keycode, replyId: $replyId, values: $values) {
    id
    content
    status
    updatedAt
  }
}
    `;
export function useRecipientViewPetitionFieldMutations_publicUpdateCheckboxReplyMutation(baseOptions?: Apollo.MutationHookOptions<RecipientViewPetitionFieldMutations_publicUpdateCheckboxReplyMutation, RecipientViewPetitionFieldMutations_publicUpdateCheckboxReplyMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RecipientViewPetitionFieldMutations_publicUpdateCheckboxReplyMutation, RecipientViewPetitionFieldMutations_publicUpdateCheckboxReplyMutationVariables>(RecipientViewPetitionFieldMutations_publicUpdateCheckboxReplyDocument, options);
      }
export type RecipientViewPetitionFieldMutations_publicUpdateCheckboxReplyMutationHookResult = ReturnType<typeof useRecipientViewPetitionFieldMutations_publicUpdateCheckboxReplyMutation>;
export const RecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyDocument = gql`
    mutation RecipientViewPetitionFieldMutations_publicCreateDynamicSelectReply($keycode: ID!, $fieldId: GID!, $value: [[String]!]!) {
  publicCreateDynamicSelectReply(
    keycode: $keycode
    fieldId: $fieldId
    value: $value
  ) {
    ...RecipientViewPetitionFieldCard_PublicPetitionFieldReply
  }
}
    ${RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragmentDoc}`;
export function useRecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyMutation(baseOptions?: Apollo.MutationHookOptions<RecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyMutation, RecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyMutation, RecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyMutationVariables>(RecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyDocument, options);
      }
export type RecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyMutationHookResult = ReturnType<typeof useRecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyMutation>;
export const RecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyDocument = gql`
    mutation RecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReply($keycode: ID!, $replyId: GID!, $value: [[String]!]!) {
  publicUpdateDynamicSelectReply(
    keycode: $keycode
    replyId: $replyId
    value: $value
  ) {
    id
    content
    status
    updatedAt
  }
}
    `;
export function useRecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyMutation(baseOptions?: Apollo.MutationHookOptions<RecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyMutation, RecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyMutation, RecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyMutationVariables>(RecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyDocument, options);
      }
export type RecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyMutationHookResult = ReturnType<typeof useRecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyMutation>;
export const RecipientViewPetitionFieldMutations_publicCreateFileUploadReplyDocument = gql`
    mutation RecipientViewPetitionFieldMutations_publicCreateFileUploadReply($keycode: ID!, $fieldId: GID!, $data: FileUploadInput!) {
  publicCreateFileUploadReply(keycode: $keycode, fieldId: $fieldId, data: $data) {
    presignedPostData {
      ...uploadFile_AWSPresignedPostData
    }
    reply {
      ...RecipientViewPetitionFieldCard_PublicPetitionFieldReply
    }
  }
}
    ${uploadFile_AWSPresignedPostDataFragmentDoc}
${RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragmentDoc}`;
export function useRecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutation(baseOptions?: Apollo.MutationHookOptions<RecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutation, RecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutation, RecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutationVariables>(RecipientViewPetitionFieldMutations_publicCreateFileUploadReplyDocument, options);
      }
export type RecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutationHookResult = ReturnType<typeof useRecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutation>;
export const RecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteDocument = gql`
    mutation RecipientViewPetitionFieldMutations_publicFileUploadReplyComplete($keycode: ID!, $replyId: GID!) {
  publicFileUploadReplyComplete(keycode: $keycode, replyId: $replyId) {
    id
    content
  }
}
    `;
export function useRecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutation(baseOptions?: Apollo.MutationHookOptions<RecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutation, RecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutation, RecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutationVariables>(RecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteDocument, options);
      }
export type RecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutationHookResult = ReturnType<typeof useRecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutation>;
export const GenerateNewTokenDialog_generateUserAuthTokenDocument = gql`
    mutation GenerateNewTokenDialog_generateUserAuthToken($tokenName: String!) {
  generateUserAuthToken(tokenName: $tokenName) {
    apiKey
    userAuthToken {
      id
      tokenName
      createdAt
      lastUsedAt
    }
  }
}
    `;
export function useGenerateNewTokenDialog_generateUserAuthTokenMutation(baseOptions?: Apollo.MutationHookOptions<GenerateNewTokenDialog_generateUserAuthTokenMutation, GenerateNewTokenDialog_generateUserAuthTokenMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<GenerateNewTokenDialog_generateUserAuthTokenMutation, GenerateNewTokenDialog_generateUserAuthTokenMutationVariables>(GenerateNewTokenDialog_generateUserAuthTokenDocument, options);
      }
export type GenerateNewTokenDialog_generateUserAuthTokenMutationHookResult = ReturnType<typeof useGenerateNewTokenDialog_generateUserAuthTokenMutation>;
export const AdminDocument = gql`
    query Admin {
  me {
    id
    ...Admin_User
  }
}
    ${Admin_UserFragmentDoc}`;
export function useAdminQuery(baseOptions?: Apollo.QueryHookOptions<AdminQuery, AdminQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<AdminQuery, AdminQueryVariables>(AdminDocument, options);
      }
export function useAdminLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<AdminQuery, AdminQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<AdminQuery, AdminQueryVariables>(AdminDocument, options);
        }
export type AdminQueryHookResult = ReturnType<typeof useAdminQuery>;
export type AdminLazyQueryHookResult = ReturnType<typeof useAdminLazyQuery>;
export const AdminOrganizationsDocument = gql`
    query AdminOrganizations($offset: Int!, $limit: Int!, $search: String, $sortBy: [QueryOrganizations_OrderBy!], $status: OrganizationStatus) {
  organizations(
    offset: $offset
    limit: $limit
    search: $search
    sortBy: $sortBy
    status: $status
  ) {
    totalCount
    items {
      ...AdminOrganizations_Organization
    }
  }
}
    ${AdminOrganizations_OrganizationFragmentDoc}`;
export function useAdminOrganizationsQuery(baseOptions: Apollo.QueryHookOptions<AdminOrganizationsQuery, AdminOrganizationsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<AdminOrganizationsQuery, AdminOrganizationsQueryVariables>(AdminOrganizationsDocument, options);
      }
export function useAdminOrganizationsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<AdminOrganizationsQuery, AdminOrganizationsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<AdminOrganizationsQuery, AdminOrganizationsQueryVariables>(AdminOrganizationsDocument, options);
        }
export type AdminOrganizationsQueryHookResult = ReturnType<typeof useAdminOrganizationsQuery>;
export type AdminOrganizationsLazyQueryHookResult = ReturnType<typeof useAdminOrganizationsLazyQuery>;
export const AdminOrganizationsUserDocument = gql`
    query AdminOrganizationsUser {
  me {
    ...AdminOrganizations_User
  }
}
    ${AdminOrganizations_UserFragmentDoc}`;
export function useAdminOrganizationsUserQuery(baseOptions?: Apollo.QueryHookOptions<AdminOrganizationsUserQuery, AdminOrganizationsUserQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<AdminOrganizationsUserQuery, AdminOrganizationsUserQueryVariables>(AdminOrganizationsUserDocument, options);
      }
export function useAdminOrganizationsUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<AdminOrganizationsUserQuery, AdminOrganizationsUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<AdminOrganizationsUserQuery, AdminOrganizationsUserQueryVariables>(AdminOrganizationsUserDocument, options);
        }
export type AdminOrganizationsUserQueryHookResult = ReturnType<typeof useAdminOrganizationsUserQuery>;
export type AdminOrganizationsUserLazyQueryHookResult = ReturnType<typeof useAdminOrganizationsUserLazyQuery>;
export const AdminSupportMethodsUserDocument = gql`
    query AdminSupportMethodsUser {
  me {
    ...AdminSupportMethods_User
  }
}
    ${AdminSupportMethods_UserFragmentDoc}`;
export function useAdminSupportMethodsUserQuery(baseOptions?: Apollo.QueryHookOptions<AdminSupportMethodsUserQuery, AdminSupportMethodsUserQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<AdminSupportMethodsUserQuery, AdminSupportMethodsUserQueryVariables>(AdminSupportMethodsUserDocument, options);
      }
export function useAdminSupportMethodsUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<AdminSupportMethodsUserQuery, AdminSupportMethodsUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<AdminSupportMethodsUserQuery, AdminSupportMethodsUserQueryVariables>(AdminSupportMethodsUserDocument, options);
        }
export type AdminSupportMethodsUserQueryHookResult = ReturnType<typeof useAdminSupportMethodsUserQuery>;
export type AdminSupportMethodsUserLazyQueryHookResult = ReturnType<typeof useAdminSupportMethodsUserLazyQuery>;
export const Contact_updateContactDocument = gql`
    mutation Contact_updateContact($id: GID!, $data: UpdateContactInput!) {
  updateContact(id: $id, data: $data) {
    ...Contact_Contact_Profile
  }
}
    ${Contact_Contact_ProfileFragmentDoc}`;
export function useContact_updateContactMutation(baseOptions?: Apollo.MutationHookOptions<Contact_updateContactMutation, Contact_updateContactMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<Contact_updateContactMutation, Contact_updateContactMutationVariables>(Contact_updateContactDocument, options);
      }
export type Contact_updateContactMutationHookResult = ReturnType<typeof useContact_updateContactMutation>;
export const ContactUserDocument = gql`
    query ContactUser {
  me {
    ...Contact_User
  }
}
    ${Contact_UserFragmentDoc}`;
export function useContactUserQuery(baseOptions?: Apollo.QueryHookOptions<ContactUserQuery, ContactUserQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ContactUserQuery, ContactUserQueryVariables>(ContactUserDocument, options);
      }
export function useContactUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ContactUserQuery, ContactUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ContactUserQuery, ContactUserQueryVariables>(ContactUserDocument, options);
        }
export type ContactUserQueryHookResult = ReturnType<typeof useContactUserQuery>;
export type ContactUserLazyQueryHookResult = ReturnType<typeof useContactUserLazyQuery>;
export const ContactDocument = gql`
    query Contact($id: GID!, $hasPetitionSignature: Boolean!) {
  contact(id: $id) {
    ...Contact_Contact
  }
}
    ${Contact_ContactFragmentDoc}`;
export function useContactQuery(baseOptions: Apollo.QueryHookOptions<ContactQuery, ContactQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ContactQuery, ContactQueryVariables>(ContactDocument, options);
      }
export function useContactLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ContactQuery, ContactQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ContactQuery, ContactQueryVariables>(ContactDocument, options);
        }
export type ContactQueryHookResult = ReturnType<typeof useContactQuery>;
export type ContactLazyQueryHookResult = ReturnType<typeof useContactLazyQuery>;
export const Contacts_deleteContactsDocument = gql`
    mutation Contacts_deleteContacts($ids: [GID!]!) {
  deleteContacts(ids: $ids)
}
    `;
export function useContacts_deleteContactsMutation(baseOptions?: Apollo.MutationHookOptions<Contacts_deleteContactsMutation, Contacts_deleteContactsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<Contacts_deleteContactsMutation, Contacts_deleteContactsMutationVariables>(Contacts_deleteContactsDocument, options);
      }
export type Contacts_deleteContactsMutationHookResult = ReturnType<typeof useContacts_deleteContactsMutation>;
export const ContactsDocument = gql`
    query Contacts($offset: Int!, $limit: Int!, $search: String, $sortBy: [QueryContacts_OrderBy!]) {
  contacts(offset: $offset, limit: $limit, search: $search, sortBy: $sortBy) {
    ...Contacts_ContactsList
  }
}
    ${Contacts_ContactsListFragmentDoc}`;
export function useContactsQuery(baseOptions: Apollo.QueryHookOptions<ContactsQuery, ContactsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ContactsQuery, ContactsQueryVariables>(ContactsDocument, options);
      }
export function useContactsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ContactsQuery, ContactsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ContactsQuery, ContactsQueryVariables>(ContactsDocument, options);
        }
export type ContactsQueryHookResult = ReturnType<typeof useContactsQuery>;
export type ContactsLazyQueryHookResult = ReturnType<typeof useContactsLazyQuery>;
export const ContactsUserDocument = gql`
    query ContactsUser {
  me {
    ...Contacts_User
  }
}
    ${Contacts_UserFragmentDoc}`;
export function useContactsUserQuery(baseOptions?: Apollo.QueryHookOptions<ContactsUserQuery, ContactsUserQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ContactsUserQuery, ContactsUserQueryVariables>(ContactsUserDocument, options);
      }
export function useContactsUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ContactsUserQuery, ContactsUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ContactsUserQuery, ContactsUserQueryVariables>(ContactsUserDocument, options);
        }
export type ContactsUserQueryHookResult = ReturnType<typeof useContactsUserQuery>;
export type ContactsUserLazyQueryHookResult = ReturnType<typeof useContactsUserLazyQuery>;
export const OrganizationBranding_updateOrgLogoDocument = gql`
    mutation OrganizationBranding_updateOrgLogo($orgId: GID!, $file: Upload!) {
  updateOrganizationLogo(orgId: $orgId, file: $file) {
    id
    logoUrl
  }
}
    `;
export function useOrganizationBranding_updateOrgLogoMutation(baseOptions?: Apollo.MutationHookOptions<OrganizationBranding_updateOrgLogoMutation, OrganizationBranding_updateOrgLogoMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<OrganizationBranding_updateOrgLogoMutation, OrganizationBranding_updateOrgLogoMutationVariables>(OrganizationBranding_updateOrgLogoDocument, options);
      }
export type OrganizationBranding_updateOrgLogoMutationHookResult = ReturnType<typeof useOrganizationBranding_updateOrgLogoMutation>;
export const OrganizationBrandingDocument = gql`
    query OrganizationBranding {
  me {
    ...SettingsLayout_User
    organization {
      id
      logoUrl
      name
    }
  }
}
    ${SettingsLayout_UserFragmentDoc}`;
export function useOrganizationBrandingQuery(baseOptions?: Apollo.QueryHookOptions<OrganizationBrandingQuery, OrganizationBrandingQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<OrganizationBrandingQuery, OrganizationBrandingQueryVariables>(OrganizationBrandingDocument, options);
      }
export function useOrganizationBrandingLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<OrganizationBrandingQuery, OrganizationBrandingQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<OrganizationBrandingQuery, OrganizationBrandingQueryVariables>(OrganizationBrandingDocument, options);
        }
export type OrganizationBrandingQueryHookResult = ReturnType<typeof useOrganizationBrandingQuery>;
export type OrganizationBrandingLazyQueryHookResult = ReturnType<typeof useOrganizationBrandingLazyQuery>;
export const OrganizationGroup_updateUserGroupDocument = gql`
    mutation OrganizationGroup_updateUserGroup($id: GID!, $data: UpdateUserGroupInput!) {
  updateUserGroup(id: $id, data: $data) {
    ...OrganizationGroup_UserGroup
  }
}
    ${OrganizationGroup_UserGroupFragmentDoc}`;
export function useOrganizationGroup_updateUserGroupMutation(baseOptions?: Apollo.MutationHookOptions<OrganizationGroup_updateUserGroupMutation, OrganizationGroup_updateUserGroupMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<OrganizationGroup_updateUserGroupMutation, OrganizationGroup_updateUserGroupMutationVariables>(OrganizationGroup_updateUserGroupDocument, options);
      }
export type OrganizationGroup_updateUserGroupMutationHookResult = ReturnType<typeof useOrganizationGroup_updateUserGroupMutation>;
export const OrganizationGroup_addUsersToUserGroupDocument = gql`
    mutation OrganizationGroup_addUsersToUserGroup($userGroupId: GID!, $userIds: [GID!]!) {
  addUsersToUserGroup(userGroupId: $userGroupId, userIds: $userIds) {
    ...OrganizationGroup_UserGroup
  }
}
    ${OrganizationGroup_UserGroupFragmentDoc}`;
export function useOrganizationGroup_addUsersToUserGroupMutation(baseOptions?: Apollo.MutationHookOptions<OrganizationGroup_addUsersToUserGroupMutation, OrganizationGroup_addUsersToUserGroupMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<OrganizationGroup_addUsersToUserGroupMutation, OrganizationGroup_addUsersToUserGroupMutationVariables>(OrganizationGroup_addUsersToUserGroupDocument, options);
      }
export type OrganizationGroup_addUsersToUserGroupMutationHookResult = ReturnType<typeof useOrganizationGroup_addUsersToUserGroupMutation>;
export const OrganizationGroup_removeUsersFromGroupDocument = gql`
    mutation OrganizationGroup_removeUsersFromGroup($userGroupId: GID!, $userIds: [GID!]!) {
  removeUsersFromGroup(userGroupId: $userGroupId, userIds: $userIds) {
    ...OrganizationGroup_UserGroup
  }
}
    ${OrganizationGroup_UserGroupFragmentDoc}`;
export function useOrganizationGroup_removeUsersFromGroupMutation(baseOptions?: Apollo.MutationHookOptions<OrganizationGroup_removeUsersFromGroupMutation, OrganizationGroup_removeUsersFromGroupMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<OrganizationGroup_removeUsersFromGroupMutation, OrganizationGroup_removeUsersFromGroupMutationVariables>(OrganizationGroup_removeUsersFromGroupDocument, options);
      }
export type OrganizationGroup_removeUsersFromGroupMutationHookResult = ReturnType<typeof useOrganizationGroup_removeUsersFromGroupMutation>;
export const OrganizationGroup_deleteUserGroupDocument = gql`
    mutation OrganizationGroup_deleteUserGroup($ids: [GID!]!) {
  deleteUserGroup(ids: $ids)
}
    `;
export function useOrganizationGroup_deleteUserGroupMutation(baseOptions?: Apollo.MutationHookOptions<OrganizationGroup_deleteUserGroupMutation, OrganizationGroup_deleteUserGroupMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<OrganizationGroup_deleteUserGroupMutation, OrganizationGroup_deleteUserGroupMutationVariables>(OrganizationGroup_deleteUserGroupDocument, options);
      }
export type OrganizationGroup_deleteUserGroupMutationHookResult = ReturnType<typeof useOrganizationGroup_deleteUserGroupMutation>;
export const OrganizationGroup_cloneUserGroupDocument = gql`
    mutation OrganizationGroup_cloneUserGroup($ids: [GID!]!, $locale: String!) {
  cloneUserGroup(userGroupIds: $ids, locale: $locale) {
    ...OrganizationGroup_UserGroup
  }
}
    ${OrganizationGroup_UserGroupFragmentDoc}`;
export function useOrganizationGroup_cloneUserGroupMutation(baseOptions?: Apollo.MutationHookOptions<OrganizationGroup_cloneUserGroupMutation, OrganizationGroup_cloneUserGroupMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<OrganizationGroup_cloneUserGroupMutation, OrganizationGroup_cloneUserGroupMutationVariables>(OrganizationGroup_cloneUserGroupDocument, options);
      }
export type OrganizationGroup_cloneUserGroupMutationHookResult = ReturnType<typeof useOrganizationGroup_cloneUserGroupMutation>;
export const OrganizationGroupDocument = gql`
    query OrganizationGroup($id: GID!) {
  userGroup(id: $id) {
    ...OrganizationGroup_UserGroup
  }
}
    ${OrganizationGroup_UserGroupFragmentDoc}`;
export function useOrganizationGroupQuery(baseOptions: Apollo.QueryHookOptions<OrganizationGroupQuery, OrganizationGroupQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<OrganizationGroupQuery, OrganizationGroupQueryVariables>(OrganizationGroupDocument, options);
      }
export function useOrganizationGroupLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<OrganizationGroupQuery, OrganizationGroupQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<OrganizationGroupQuery, OrganizationGroupQueryVariables>(OrganizationGroupDocument, options);
        }
export type OrganizationGroupQueryHookResult = ReturnType<typeof useOrganizationGroupQuery>;
export type OrganizationGroupLazyQueryHookResult = ReturnType<typeof useOrganizationGroupLazyQuery>;
export const OrganizationGroupUserDocument = gql`
    query OrganizationGroupUser {
  me {
    ...OrganizationGroup_User
    ...OrganizationGroupListTableHeader_User
  }
}
    ${OrganizationGroup_UserFragmentDoc}
${OrganizationGroupListTableHeader_UserFragmentDoc}`;
export function useOrganizationGroupUserQuery(baseOptions?: Apollo.QueryHookOptions<OrganizationGroupUserQuery, OrganizationGroupUserQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<OrganizationGroupUserQuery, OrganizationGroupUserQueryVariables>(OrganizationGroupUserDocument, options);
      }
export function useOrganizationGroupUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<OrganizationGroupUserQuery, OrganizationGroupUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<OrganizationGroupUserQuery, OrganizationGroupUserQueryVariables>(OrganizationGroupUserDocument, options);
        }
export type OrganizationGroupUserQueryHookResult = ReturnType<typeof useOrganizationGroupUserQuery>;
export type OrganizationGroupUserLazyQueryHookResult = ReturnType<typeof useOrganizationGroupUserLazyQuery>;
export const OrganizationGroups_createUserGroupDocument = gql`
    mutation OrganizationGroups_createUserGroup($name: String!, $userIds: [GID!]!) {
  createUserGroup(name: $name, userIds: $userIds) {
    ...OrganizationGroups_UserGroup
  }
}
    ${OrganizationGroups_UserGroupFragmentDoc}`;
export function useOrganizationGroups_createUserGroupMutation(baseOptions?: Apollo.MutationHookOptions<OrganizationGroups_createUserGroupMutation, OrganizationGroups_createUserGroupMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<OrganizationGroups_createUserGroupMutation, OrganizationGroups_createUserGroupMutationVariables>(OrganizationGroups_createUserGroupDocument, options);
      }
export type OrganizationGroups_createUserGroupMutationHookResult = ReturnType<typeof useOrganizationGroups_createUserGroupMutation>;
export const OrganizationGroups_deleteUserGroupDocument = gql`
    mutation OrganizationGroups_deleteUserGroup($ids: [GID!]!) {
  deleteUserGroup(ids: $ids)
}
    `;
export function useOrganizationGroups_deleteUserGroupMutation(baseOptions?: Apollo.MutationHookOptions<OrganizationGroups_deleteUserGroupMutation, OrganizationGroups_deleteUserGroupMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<OrganizationGroups_deleteUserGroupMutation, OrganizationGroups_deleteUserGroupMutationVariables>(OrganizationGroups_deleteUserGroupDocument, options);
      }
export type OrganizationGroups_deleteUserGroupMutationHookResult = ReturnType<typeof useOrganizationGroups_deleteUserGroupMutation>;
export const OrganizationGroups_cloneUserGroupDocument = gql`
    mutation OrganizationGroups_cloneUserGroup($ids: [GID!]!, $locale: String!) {
  cloneUserGroup(userGroupIds: $ids, locale: $locale) {
    ...OrganizationGroups_UserGroup
  }
}
    ${OrganizationGroups_UserGroupFragmentDoc}`;
export function useOrganizationGroups_cloneUserGroupMutation(baseOptions?: Apollo.MutationHookOptions<OrganizationGroups_cloneUserGroupMutation, OrganizationGroups_cloneUserGroupMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<OrganizationGroups_cloneUserGroupMutation, OrganizationGroups_cloneUserGroupMutationVariables>(OrganizationGroups_cloneUserGroupDocument, options);
      }
export type OrganizationGroups_cloneUserGroupMutationHookResult = ReturnType<typeof useOrganizationGroups_cloneUserGroupMutation>;
export const OrganizationGroupsDocument = gql`
    query OrganizationGroups($offset: Int!, $limit: Int!, $search: String, $sortBy: [QueryUserGroups_OrderBy!]) {
  userGroups(offset: $offset, limit: $limit, search: $search, sortBy: $sortBy) {
    ...OrganizationGroups_UserGroupPagination
  }
}
    ${OrganizationGroups_UserGroupPaginationFragmentDoc}`;
export function useOrganizationGroupsQuery(baseOptions: Apollo.QueryHookOptions<OrganizationGroupsQuery, OrganizationGroupsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<OrganizationGroupsQuery, OrganizationGroupsQueryVariables>(OrganizationGroupsDocument, options);
      }
export function useOrganizationGroupsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<OrganizationGroupsQuery, OrganizationGroupsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<OrganizationGroupsQuery, OrganizationGroupsQueryVariables>(OrganizationGroupsDocument, options);
        }
export type OrganizationGroupsQueryHookResult = ReturnType<typeof useOrganizationGroupsQuery>;
export type OrganizationGroupsLazyQueryHookResult = ReturnType<typeof useOrganizationGroupsLazyQuery>;
export const OrganizationGroupsUserDocument = gql`
    query OrganizationGroupsUser {
  me {
    ...OrganizationGroups_User
    ...OrganizationGroupsListTableHeader_User
  }
}
    ${OrganizationGroups_UserFragmentDoc}
${OrganizationGroupsListTableHeader_UserFragmentDoc}`;
export function useOrganizationGroupsUserQuery(baseOptions?: Apollo.QueryHookOptions<OrganizationGroupsUserQuery, OrganizationGroupsUserQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<OrganizationGroupsUserQuery, OrganizationGroupsUserQueryVariables>(OrganizationGroupsUserDocument, options);
      }
export function useOrganizationGroupsUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<OrganizationGroupsUserQuery, OrganizationGroupsUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<OrganizationGroupsUserQuery, OrganizationGroupsUserQueryVariables>(OrganizationGroupsUserDocument, options);
        }
export type OrganizationGroupsUserQueryHookResult = ReturnType<typeof useOrganizationGroupsUserQuery>;
export type OrganizationGroupsUserLazyQueryHookResult = ReturnType<typeof useOrganizationGroupsUserLazyQuery>;
export const OrganizationSettingsDocument = gql`
    query OrganizationSettings {
  me {
    id
    ...SettingsLayout_User
  }
}
    ${SettingsLayout_UserFragmentDoc}`;
export function useOrganizationSettingsQuery(baseOptions?: Apollo.QueryHookOptions<OrganizationSettingsQuery, OrganizationSettingsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<OrganizationSettingsQuery, OrganizationSettingsQueryVariables>(OrganizationSettingsDocument, options);
      }
export function useOrganizationSettingsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<OrganizationSettingsQuery, OrganizationSettingsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<OrganizationSettingsQuery, OrganizationSettingsQueryVariables>(OrganizationSettingsDocument, options);
        }
export type OrganizationSettingsQueryHookResult = ReturnType<typeof useOrganizationSettingsQuery>;
export type OrganizationSettingsLazyQueryHookResult = ReturnType<typeof useOrganizationSettingsLazyQuery>;
export const OrganizationUsers_createOrganizationUserDocument = gql`
    mutation OrganizationUsers_createOrganizationUser($firstName: String!, $lastName: String!, $email: String!, $role: OrganizationRole!) {
  createOrganizationUser(
    email: $email
    firstName: $firstName
    lastName: $lastName
    role: $role
  ) {
    ...OrganizationUsers_User
  }
}
    ${OrganizationUsers_UserFragmentDoc}`;
export function useOrganizationUsers_createOrganizationUserMutation(baseOptions?: Apollo.MutationHookOptions<OrganizationUsers_createOrganizationUserMutation, OrganizationUsers_createOrganizationUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<OrganizationUsers_createOrganizationUserMutation, OrganizationUsers_createOrganizationUserMutationVariables>(OrganizationUsers_createOrganizationUserDocument, options);
      }
export type OrganizationUsers_createOrganizationUserMutationHookResult = ReturnType<typeof useOrganizationUsers_createOrganizationUserMutation>;
export const OrganizationUsers_updateOrganizationUserDocument = gql`
    mutation OrganizationUsers_updateOrganizationUser($userId: GID!, $role: OrganizationRole!) {
  updateOrganizationUser(userId: $userId, role: $role) {
    ...OrganizationUsers_User
  }
}
    ${OrganizationUsers_UserFragmentDoc}`;
export function useOrganizationUsers_updateOrganizationUserMutation(baseOptions?: Apollo.MutationHookOptions<OrganizationUsers_updateOrganizationUserMutation, OrganizationUsers_updateOrganizationUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<OrganizationUsers_updateOrganizationUserMutation, OrganizationUsers_updateOrganizationUserMutationVariables>(OrganizationUsers_updateOrganizationUserDocument, options);
      }
export type OrganizationUsers_updateOrganizationUserMutationHookResult = ReturnType<typeof useOrganizationUsers_updateOrganizationUserMutation>;
export const OrganizationUsers_updateUserStatusDocument = gql`
    mutation OrganizationUsers_updateUserStatus($userIds: [GID!]!, $newStatus: UserStatus!, $transferToUserId: GID) {
  updateUserStatus(
    userIds: $userIds
    status: $newStatus
    transferToUserId: $transferToUserId
  ) {
    id
    status
  }
}
    `;
export function useOrganizationUsers_updateUserStatusMutation(baseOptions?: Apollo.MutationHookOptions<OrganizationUsers_updateUserStatusMutation, OrganizationUsers_updateUserStatusMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<OrganizationUsers_updateUserStatusMutation, OrganizationUsers_updateUserStatusMutationVariables>(OrganizationUsers_updateUserStatusDocument, options);
      }
export type OrganizationUsers_updateUserStatusMutationHookResult = ReturnType<typeof useOrganizationUsers_updateUserStatusMutation>;
export const OrganizationUsersDocument = gql`
    query OrganizationUsers($offset: Int!, $limit: Int!, $search: String, $sortBy: [OrganizationUsers_OrderBy!]) {
  me {
    organization {
      id
      hasSsoProvider
      users(
        offset: $offset
        limit: $limit
        search: $search
        sortBy: $sortBy
        includeInactive: true
      ) {
        totalCount
        items {
          ...OrganizationUsers_User
        }
      }
    }
    ...SettingsLayout_User
    ...OrganizationUsersListTableHeader_User
  }
}
    ${OrganizationUsers_UserFragmentDoc}
${SettingsLayout_UserFragmentDoc}
${OrganizationUsersListTableHeader_UserFragmentDoc}`;
export function useOrganizationUsersQuery(baseOptions: Apollo.QueryHookOptions<OrganizationUsersQuery, OrganizationUsersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<OrganizationUsersQuery, OrganizationUsersQueryVariables>(OrganizationUsersDocument, options);
      }
export function useOrganizationUsersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<OrganizationUsersQuery, OrganizationUsersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<OrganizationUsersQuery, OrganizationUsersQueryVariables>(OrganizationUsersDocument, options);
        }
export type OrganizationUsersQueryHookResult = ReturnType<typeof useOrganizationUsersQuery>;
export type OrganizationUsersLazyQueryHookResult = ReturnType<typeof useOrganizationUsersLazyQuery>;
export const PetitionActivity_updatePetitionDocument = gql`
    mutation PetitionActivity_updatePetition($petitionId: GID!, $data: UpdatePetitionInput!) {
  updatePetition(petitionId: $petitionId, data: $data) {
    ...PetitionActivity_Petition
  }
}
    ${PetitionActivity_PetitionFragmentDoc}`;
export function usePetitionActivity_updatePetitionMutation(baseOptions?: Apollo.MutationHookOptions<PetitionActivity_updatePetitionMutation, PetitionActivity_updatePetitionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionActivity_updatePetitionMutation, PetitionActivity_updatePetitionMutationVariables>(PetitionActivity_updatePetitionDocument, options);
      }
export type PetitionActivity_updatePetitionMutationHookResult = ReturnType<typeof usePetitionActivity_updatePetitionMutation>;
export const PetitionActivity_sendRemindersDocument = gql`
    mutation PetitionActivity_sendReminders($petitionId: GID!, $accessIds: [GID!]!, $body: JSON) {
  sendReminders(petitionId: $petitionId, accessIds: $accessIds, body: $body)
}
    `;
export function usePetitionActivity_sendRemindersMutation(baseOptions?: Apollo.MutationHookOptions<PetitionActivity_sendRemindersMutation, PetitionActivity_sendRemindersMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionActivity_sendRemindersMutation, PetitionActivity_sendRemindersMutationVariables>(PetitionActivity_sendRemindersDocument, options);
      }
export type PetitionActivity_sendRemindersMutationHookResult = ReturnType<typeof usePetitionActivity_sendRemindersMutation>;
export const PetitionActivity_deactivateAccessesDocument = gql`
    mutation PetitionActivity_deactivateAccesses($petitionId: GID!, $accessIds: [GID!]!) {
  deactivateAccesses(petitionId: $petitionId, accessIds: $accessIds) {
    id
    status
  }
}
    `;
export function usePetitionActivity_deactivateAccessesMutation(baseOptions?: Apollo.MutationHookOptions<PetitionActivity_deactivateAccessesMutation, PetitionActivity_deactivateAccessesMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionActivity_deactivateAccessesMutation, PetitionActivity_deactivateAccessesMutationVariables>(PetitionActivity_deactivateAccessesDocument, options);
      }
export type PetitionActivity_deactivateAccessesMutationHookResult = ReturnType<typeof usePetitionActivity_deactivateAccessesMutation>;
export const PetitionActivity_reactivateAccessesDocument = gql`
    mutation PetitionActivity_reactivateAccesses($petitionId: GID!, $accessIds: [GID!]!) {
  reactivateAccesses(petitionId: $petitionId, accessIds: $accessIds) {
    id
    status
  }
}
    `;
export function usePetitionActivity_reactivateAccessesMutation(baseOptions?: Apollo.MutationHookOptions<PetitionActivity_reactivateAccessesMutation, PetitionActivity_reactivateAccessesMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionActivity_reactivateAccessesMutation, PetitionActivity_reactivateAccessesMutationVariables>(PetitionActivity_reactivateAccessesDocument, options);
      }
export type PetitionActivity_reactivateAccessesMutationHookResult = ReturnType<typeof usePetitionActivity_reactivateAccessesMutation>;
export const PetitionActivity_cancelScheduledMessageDocument = gql`
    mutation PetitionActivity_cancelScheduledMessage($petitionId: GID!, $messageId: GID!) {
  cancelScheduledMessage(petitionId: $petitionId, messageId: $messageId) {
    id
    status
  }
}
    `;
export function usePetitionActivity_cancelScheduledMessageMutation(baseOptions?: Apollo.MutationHookOptions<PetitionActivity_cancelScheduledMessageMutation, PetitionActivity_cancelScheduledMessageMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionActivity_cancelScheduledMessageMutation, PetitionActivity_cancelScheduledMessageMutationVariables>(PetitionActivity_cancelScheduledMessageDocument, options);
      }
export type PetitionActivity_cancelScheduledMessageMutationHookResult = ReturnType<typeof usePetitionActivity_cancelScheduledMessageMutation>;
export const PetitionsActivity_sendPetitionDocument = gql`
    mutation PetitionsActivity_sendPetition($petitionId: GID!, $contactIds: [GID!]!, $subject: String!, $body: JSON!, $remindersConfig: RemindersConfigInput, $scheduledAt: DateTime) {
  sendPetition(
    petitionId: $petitionId
    contactIds: $contactIds
    subject: $subject
    body: $body
    remindersConfig: $remindersConfig
    scheduledAt: $scheduledAt
  ) {
    result
  }
}
    `;
export function usePetitionsActivity_sendPetitionMutation(baseOptions?: Apollo.MutationHookOptions<PetitionsActivity_sendPetitionMutation, PetitionsActivity_sendPetitionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionsActivity_sendPetitionMutation, PetitionsActivity_sendPetitionMutationVariables>(PetitionsActivity_sendPetitionDocument, options);
      }
export type PetitionsActivity_sendPetitionMutationHookResult = ReturnType<typeof usePetitionsActivity_sendPetitionMutation>;
export const PetitionActivity_switchAutomaticRemindersDocument = gql`
    mutation PetitionActivity_switchAutomaticReminders($start: Boolean!, $petitionId: GID!, $accessIds: [GID!]!, $remindersConfig: RemindersConfigInput) {
  switchAutomaticReminders(
    start: $start
    petitionId: $petitionId
    accessIds: $accessIds
    remindersConfig: $remindersConfig
  ) {
    id
  }
}
    `;
export function usePetitionActivity_switchAutomaticRemindersMutation(baseOptions?: Apollo.MutationHookOptions<PetitionActivity_switchAutomaticRemindersMutation, PetitionActivity_switchAutomaticRemindersMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionActivity_switchAutomaticRemindersMutation, PetitionActivity_switchAutomaticRemindersMutationVariables>(PetitionActivity_switchAutomaticRemindersDocument, options);
      }
export type PetitionActivity_switchAutomaticRemindersMutationHookResult = ReturnType<typeof usePetitionActivity_switchAutomaticRemindersMutation>;
export const PetitionActivityDocument = gql`
    query PetitionActivity($id: GID!) {
  petition(id: $id) {
    ...PetitionActivity_Petition
  }
}
    ${PetitionActivity_PetitionFragmentDoc}`;
export function usePetitionActivityQuery(baseOptions: Apollo.QueryHookOptions<PetitionActivityQuery, PetitionActivityQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PetitionActivityQuery, PetitionActivityQueryVariables>(PetitionActivityDocument, options);
      }
export function usePetitionActivityLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PetitionActivityQuery, PetitionActivityQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PetitionActivityQuery, PetitionActivityQueryVariables>(PetitionActivityDocument, options);
        }
export type PetitionActivityQueryHookResult = ReturnType<typeof usePetitionActivityQuery>;
export type PetitionActivityLazyQueryHookResult = ReturnType<typeof usePetitionActivityLazyQuery>;
export const PetitionActivityUserDocument = gql`
    query PetitionActivityUser {
  me {
    ...PetitionActivity_User
  }
}
    ${PetitionActivity_UserFragmentDoc}`;
export function usePetitionActivityUserQuery(baseOptions?: Apollo.QueryHookOptions<PetitionActivityUserQuery, PetitionActivityUserQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PetitionActivityUserQuery, PetitionActivityUserQueryVariables>(PetitionActivityUserDocument, options);
      }
export function usePetitionActivityUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PetitionActivityUserQuery, PetitionActivityUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PetitionActivityUserQuery, PetitionActivityUserQueryVariables>(PetitionActivityUserDocument, options);
        }
export type PetitionActivityUserQueryHookResult = ReturnType<typeof usePetitionActivityUserQuery>;
export type PetitionActivityUserLazyQueryHookResult = ReturnType<typeof usePetitionActivityUserLazyQuery>;
export const PetitionCompose_updatePetitionDocument = gql`
    mutation PetitionCompose_updatePetition($petitionId: GID!, $data: UpdatePetitionInput!, $hasPetitionSignature: Boolean!) {
  updatePetition(petitionId: $petitionId, data: $data) {
    ...PetitionLayout_PetitionBase
    ...PetitionSettings_PetitionBase
    ...AddPetitionAccessDialog_Petition
    ...PetitionTemplateComposeMessageEditor_Petition
  }
}
    ${PetitionLayout_PetitionBaseFragmentDoc}
${PetitionSettings_PetitionBaseFragmentDoc}
${AddPetitionAccessDialog_PetitionFragmentDoc}
${PetitionTemplateComposeMessageEditor_PetitionFragmentDoc}`;
export function usePetitionCompose_updatePetitionMutation(baseOptions?: Apollo.MutationHookOptions<PetitionCompose_updatePetitionMutation, PetitionCompose_updatePetitionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionCompose_updatePetitionMutation, PetitionCompose_updatePetitionMutationVariables>(PetitionCompose_updatePetitionDocument, options);
      }
export type PetitionCompose_updatePetitionMutationHookResult = ReturnType<typeof usePetitionCompose_updatePetitionMutation>;
export const PetitionCompose_updateFieldPositionsDocument = gql`
    mutation PetitionCompose_updateFieldPositions($petitionId: GID!, $fieldIds: [GID!]!) {
  updateFieldPositions(petitionId: $petitionId, fieldIds: $fieldIds) {
    id
    ...PetitionLayout_PetitionBase
    fields {
      id
    }
  }
}
    ${PetitionLayout_PetitionBaseFragmentDoc}`;
export function usePetitionCompose_updateFieldPositionsMutation(baseOptions?: Apollo.MutationHookOptions<PetitionCompose_updateFieldPositionsMutation, PetitionCompose_updateFieldPositionsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionCompose_updateFieldPositionsMutation, PetitionCompose_updateFieldPositionsMutationVariables>(PetitionCompose_updateFieldPositionsDocument, options);
      }
export type PetitionCompose_updateFieldPositionsMutationHookResult = ReturnType<typeof usePetitionCompose_updateFieldPositionsMutation>;
export const PetitionCompose_createPetitionFieldDocument = gql`
    mutation PetitionCompose_createPetitionField($petitionId: GID!, $type: PetitionFieldType!, $position: Int) {
  createPetitionField(petitionId: $petitionId, type: $type, position: $position) {
    field {
      id
      ...PetitionCompose_PetitionField
    }
    petition {
      ...PetitionLayout_PetitionBase
      fields {
        id
      }
    }
  }
}
    ${PetitionCompose_PetitionFieldFragmentDoc}
${PetitionLayout_PetitionBaseFragmentDoc}`;
export function usePetitionCompose_createPetitionFieldMutation(baseOptions?: Apollo.MutationHookOptions<PetitionCompose_createPetitionFieldMutation, PetitionCompose_createPetitionFieldMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionCompose_createPetitionFieldMutation, PetitionCompose_createPetitionFieldMutationVariables>(PetitionCompose_createPetitionFieldDocument, options);
      }
export type PetitionCompose_createPetitionFieldMutationHookResult = ReturnType<typeof usePetitionCompose_createPetitionFieldMutation>;
export const PetitionCompose_clonePetitionFieldDocument = gql`
    mutation PetitionCompose_clonePetitionField($petitionId: GID!, $fieldId: GID!) {
  clonePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
    field {
      id
      ...PetitionCompose_PetitionField
    }
    petition {
      ...PetitionLayout_PetitionBase
      fields {
        id
      }
    }
  }
}
    ${PetitionCompose_PetitionFieldFragmentDoc}
${PetitionLayout_PetitionBaseFragmentDoc}`;
export function usePetitionCompose_clonePetitionFieldMutation(baseOptions?: Apollo.MutationHookOptions<PetitionCompose_clonePetitionFieldMutation, PetitionCompose_clonePetitionFieldMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionCompose_clonePetitionFieldMutation, PetitionCompose_clonePetitionFieldMutationVariables>(PetitionCompose_clonePetitionFieldDocument, options);
      }
export type PetitionCompose_clonePetitionFieldMutationHookResult = ReturnType<typeof usePetitionCompose_clonePetitionFieldMutation>;
export const PetitionCompose_deletePetitionFieldDocument = gql`
    mutation PetitionCompose_deletePetitionField($petitionId: GID!, $fieldId: GID!, $force: Boolean) {
  deletePetitionField(petitionId: $petitionId, fieldId: $fieldId, force: $force) {
    id
    ...PetitionLayout_PetitionBase
    fields {
      id
    }
  }
}
    ${PetitionLayout_PetitionBaseFragmentDoc}`;
export function usePetitionCompose_deletePetitionFieldMutation(baseOptions?: Apollo.MutationHookOptions<PetitionCompose_deletePetitionFieldMutation, PetitionCompose_deletePetitionFieldMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionCompose_deletePetitionFieldMutation, PetitionCompose_deletePetitionFieldMutationVariables>(PetitionCompose_deletePetitionFieldDocument, options);
      }
export type PetitionCompose_deletePetitionFieldMutationHookResult = ReturnType<typeof usePetitionCompose_deletePetitionFieldMutation>;
export const PetitionCompose_updatePetitionFieldDocument = gql`
    mutation PetitionCompose_updatePetitionField($petitionId: GID!, $fieldId: GID!, $data: UpdatePetitionFieldInput!) {
  updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data) {
    field {
      id
      ...PetitionCompose_PetitionField
    }
    petition {
      id
      updatedAt
      ... on Petition {
        status
      }
    }
  }
}
    ${PetitionCompose_PetitionFieldFragmentDoc}`;
export function usePetitionCompose_updatePetitionFieldMutation(baseOptions?: Apollo.MutationHookOptions<PetitionCompose_updatePetitionFieldMutation, PetitionCompose_updatePetitionFieldMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionCompose_updatePetitionFieldMutation, PetitionCompose_updatePetitionFieldMutationVariables>(PetitionCompose_updatePetitionFieldDocument, options);
      }
export type PetitionCompose_updatePetitionFieldMutationHookResult = ReturnType<typeof usePetitionCompose_updatePetitionFieldMutation>;
export const PetitionCompose_changePetitionFieldTypeDocument = gql`
    mutation PetitionCompose_changePetitionFieldType($petitionId: GID!, $fieldId: GID!, $type: PetitionFieldType!, $force: Boolean) {
  changePetitionFieldType(
    petitionId: $petitionId
    fieldId: $fieldId
    type: $type
    force: $force
  ) {
    field {
      id
      ...PetitionCompose_PetitionField
    }
    petition {
      id
      ... on Petition {
        status
      }
      updatedAt
    }
  }
}
    ${PetitionCompose_PetitionFieldFragmentDoc}`;
export function usePetitionCompose_changePetitionFieldTypeMutation(baseOptions?: Apollo.MutationHookOptions<PetitionCompose_changePetitionFieldTypeMutation, PetitionCompose_changePetitionFieldTypeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionCompose_changePetitionFieldTypeMutation, PetitionCompose_changePetitionFieldTypeMutationVariables>(PetitionCompose_changePetitionFieldTypeDocument, options);
      }
export type PetitionCompose_changePetitionFieldTypeMutationHookResult = ReturnType<typeof usePetitionCompose_changePetitionFieldTypeMutation>;
export const PetitionCompose_batchSendPetitionDocument = gql`
    mutation PetitionCompose_batchSendPetition($petitionId: GID!, $contactIdGroups: [[GID!]!]!, $subject: String!, $body: JSON!, $remindersConfig: RemindersConfigInput, $scheduledAt: DateTime, $batchSendSigningMode: BatchSendSigningMode) {
  batchSendPetition(
    petitionId: $petitionId
    contactIdGroups: $contactIdGroups
    subject: $subject
    body: $body
    remindersConfig: $remindersConfig
    scheduledAt: $scheduledAt
    batchSendSigningMode: $batchSendSigningMode
  ) {
    result
    petition {
      id
      status
    }
  }
}
    `;
export function usePetitionCompose_batchSendPetitionMutation(baseOptions?: Apollo.MutationHookOptions<PetitionCompose_batchSendPetitionMutation, PetitionCompose_batchSendPetitionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionCompose_batchSendPetitionMutation, PetitionCompose_batchSendPetitionMutationVariables>(PetitionCompose_batchSendPetitionDocument, options);
      }
export type PetitionCompose_batchSendPetitionMutationHookResult = ReturnType<typeof usePetitionCompose_batchSendPetitionMutation>;
export const PetitionComposeUserDocument = gql`
    query PetitionComposeUser {
  me {
    ...PetitionCompose_User
  }
}
    ${PetitionCompose_UserFragmentDoc}`;
export function usePetitionComposeUserQuery(baseOptions?: Apollo.QueryHookOptions<PetitionComposeUserQuery, PetitionComposeUserQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PetitionComposeUserQuery, PetitionComposeUserQueryVariables>(PetitionComposeUserDocument, options);
      }
export function usePetitionComposeUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PetitionComposeUserQuery, PetitionComposeUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PetitionComposeUserQuery, PetitionComposeUserQueryVariables>(PetitionComposeUserDocument, options);
        }
export type PetitionComposeUserQueryHookResult = ReturnType<typeof usePetitionComposeUserQuery>;
export type PetitionComposeUserLazyQueryHookResult = ReturnType<typeof usePetitionComposeUserLazyQuery>;
export const PetitionComposeDocument = gql`
    query PetitionCompose($id: GID!, $hasPetitionSignature: Boolean!) {
  petition(id: $id) {
    ...PetitionCompose_PetitionBase
  }
}
    ${PetitionCompose_PetitionBaseFragmentDoc}`;
export function usePetitionComposeQuery(baseOptions: Apollo.QueryHookOptions<PetitionComposeQuery, PetitionComposeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PetitionComposeQuery, PetitionComposeQueryVariables>(PetitionComposeDocument, options);
      }
export function usePetitionComposeLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PetitionComposeQuery, PetitionComposeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PetitionComposeQuery, PetitionComposeQueryVariables>(PetitionComposeDocument, options);
        }
export type PetitionComposeQueryHookResult = ReturnType<typeof usePetitionComposeQuery>;
export type PetitionComposeLazyQueryHookResult = ReturnType<typeof usePetitionComposeLazyQuery>;
export const PetitionDocument = gql`
    query Petition($id: GID!) {
  petition(id: $id) {
    id
    ... on Petition {
      status
    }
  }
}
    `;
export function usePetitionQuery(baseOptions: Apollo.QueryHookOptions<PetitionQuery, PetitionQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PetitionQuery, PetitionQueryVariables>(PetitionDocument, options);
      }
export function usePetitionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PetitionQuery, PetitionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PetitionQuery, PetitionQueryVariables>(PetitionDocument, options);
        }
export type PetitionQueryHookResult = ReturnType<typeof usePetitionQuery>;
export type PetitionLazyQueryHookResult = ReturnType<typeof usePetitionLazyQuery>;
export const PetitionReplies_updatePetitionDocument = gql`
    mutation PetitionReplies_updatePetition($petitionId: GID!, $data: UpdatePetitionInput!) {
  updatePetition(petitionId: $petitionId, data: $data) {
    ...PetitionLayout_PetitionBase
  }
}
    ${PetitionLayout_PetitionBaseFragmentDoc}`;
export function usePetitionReplies_updatePetitionMutation(baseOptions?: Apollo.MutationHookOptions<PetitionReplies_updatePetitionMutation, PetitionReplies_updatePetitionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionReplies_updatePetitionMutation, PetitionReplies_updatePetitionMutationVariables>(PetitionReplies_updatePetitionDocument, options);
      }
export type PetitionReplies_updatePetitionMutationHookResult = ReturnType<typeof usePetitionReplies_updatePetitionMutation>;
export const PetitionReplies_validatePetitionFieldsDocument = gql`
    mutation PetitionReplies_validatePetitionFields($petitionId: GID!, $fieldIds: [GID!]!, $value: Boolean!, $validateRepliesWith: PetitionFieldReplyStatus) {
  validatePetitionFields(
    petitionId: $petitionId
    fieldIds: $fieldIds
    value: $value
    validateRepliesWith: $validateRepliesWith
  ) {
    petition {
      id
      status
    }
    fields {
      id
      validated
      replies {
        id
        status
      }
    }
  }
}
    `;
export function usePetitionReplies_validatePetitionFieldsMutation(baseOptions?: Apollo.MutationHookOptions<PetitionReplies_validatePetitionFieldsMutation, PetitionReplies_validatePetitionFieldsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionReplies_validatePetitionFieldsMutation, PetitionReplies_validatePetitionFieldsMutationVariables>(PetitionReplies_validatePetitionFieldsDocument, options);
      }
export type PetitionReplies_validatePetitionFieldsMutationHookResult = ReturnType<typeof usePetitionReplies_validatePetitionFieldsMutation>;
export const PetitionReplies_fileUploadReplyDownloadLinkDocument = gql`
    mutation PetitionReplies_fileUploadReplyDownloadLink($petitionId: GID!, $replyId: GID!, $preview: Boolean) {
  fileUploadReplyDownloadLink(
    petitionId: $petitionId
    replyId: $replyId
    preview: $preview
  ) {
    result
    url
  }
}
    `;
export function usePetitionReplies_fileUploadReplyDownloadLinkMutation(baseOptions?: Apollo.MutationHookOptions<PetitionReplies_fileUploadReplyDownloadLinkMutation, PetitionReplies_fileUploadReplyDownloadLinkMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionReplies_fileUploadReplyDownloadLinkMutation, PetitionReplies_fileUploadReplyDownloadLinkMutationVariables>(PetitionReplies_fileUploadReplyDownloadLinkDocument, options);
      }
export type PetitionReplies_fileUploadReplyDownloadLinkMutationHookResult = ReturnType<typeof usePetitionReplies_fileUploadReplyDownloadLinkMutation>;
export const PetitionReplies_createPetitionFieldCommentDocument = gql`
    mutation PetitionReplies_createPetitionFieldComment($petitionId: GID!, $petitionFieldId: GID!, $content: String!, $isInternal: Boolean, $hasInternalComments: Boolean!) {
  createPetitionFieldComment(
    petitionId: $petitionId
    petitionFieldId: $petitionFieldId
    content: $content
    isInternal: $isInternal
  ) {
    ...PetitionRepliesFieldComments_PetitionField
  }
}
    ${PetitionRepliesFieldComments_PetitionFieldFragmentDoc}`;
export function usePetitionReplies_createPetitionFieldCommentMutation(baseOptions?: Apollo.MutationHookOptions<PetitionReplies_createPetitionFieldCommentMutation, PetitionReplies_createPetitionFieldCommentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionReplies_createPetitionFieldCommentMutation, PetitionReplies_createPetitionFieldCommentMutationVariables>(PetitionReplies_createPetitionFieldCommentDocument, options);
      }
export type PetitionReplies_createPetitionFieldCommentMutationHookResult = ReturnType<typeof usePetitionReplies_createPetitionFieldCommentMutation>;
export const PetitionReplies_updatePetitionFieldCommentDocument = gql`
    mutation PetitionReplies_updatePetitionFieldComment($petitionId: GID!, $petitionFieldId: GID!, $petitionFieldCommentId: GID!, $content: String!, $hasInternalComments: Boolean!) {
  updatePetitionFieldComment(
    petitionId: $petitionId
    petitionFieldId: $petitionFieldId
    petitionFieldCommentId: $petitionFieldCommentId
    content: $content
  ) {
    ...PetitionRepliesFieldComments_PetitionField
  }
}
    ${PetitionRepliesFieldComments_PetitionFieldFragmentDoc}`;
export function usePetitionReplies_updatePetitionFieldCommentMutation(baseOptions?: Apollo.MutationHookOptions<PetitionReplies_updatePetitionFieldCommentMutation, PetitionReplies_updatePetitionFieldCommentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionReplies_updatePetitionFieldCommentMutation, PetitionReplies_updatePetitionFieldCommentMutationVariables>(PetitionReplies_updatePetitionFieldCommentDocument, options);
      }
export type PetitionReplies_updatePetitionFieldCommentMutationHookResult = ReturnType<typeof usePetitionReplies_updatePetitionFieldCommentMutation>;
export const PetitionReplies_deletePetitionFieldCommentDocument = gql`
    mutation PetitionReplies_deletePetitionFieldComment($petitionId: GID!, $petitionFieldId: GID!, $petitionFieldCommentId: GID!, $hasInternalComments: Boolean!) {
  deletePetitionFieldComment(
    petitionId: $petitionId
    petitionFieldId: $petitionFieldId
    petitionFieldCommentId: $petitionFieldCommentId
  ) {
    ...PetitionRepliesFieldComments_PetitionField
  }
}
    ${PetitionRepliesFieldComments_PetitionFieldFragmentDoc}`;
export function usePetitionReplies_deletePetitionFieldCommentMutation(baseOptions?: Apollo.MutationHookOptions<PetitionReplies_deletePetitionFieldCommentMutation, PetitionReplies_deletePetitionFieldCommentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionReplies_deletePetitionFieldCommentMutation, PetitionReplies_deletePetitionFieldCommentMutationVariables>(PetitionReplies_deletePetitionFieldCommentDocument, options);
      }
export type PetitionReplies_deletePetitionFieldCommentMutationHookResult = ReturnType<typeof usePetitionReplies_deletePetitionFieldCommentMutation>;
export const PetitionReplies_updatePetitionFieldRepliesStatusDocument = gql`
    mutation PetitionReplies_updatePetitionFieldRepliesStatus($petitionId: GID!, $petitionFieldId: GID!, $petitionFieldReplyIds: [GID!]!, $status: PetitionFieldReplyStatus!) {
  updatePetitionFieldRepliesStatus(
    petitionId: $petitionId
    petitionFieldId: $petitionFieldId
    petitionFieldReplyIds: $petitionFieldReplyIds
    status: $status
  ) {
    petition {
      id
      status
    }
    field {
      id
      validated
    }
    replies {
      id
      status
    }
  }
}
    `;
export function usePetitionReplies_updatePetitionFieldRepliesStatusMutation(baseOptions?: Apollo.MutationHookOptions<PetitionReplies_updatePetitionFieldRepliesStatusMutation, PetitionReplies_updatePetitionFieldRepliesStatusMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionReplies_updatePetitionFieldRepliesStatusMutation, PetitionReplies_updatePetitionFieldRepliesStatusMutationVariables>(PetitionReplies_updatePetitionFieldRepliesStatusDocument, options);
      }
export type PetitionReplies_updatePetitionFieldRepliesStatusMutationHookResult = ReturnType<typeof usePetitionReplies_updatePetitionFieldRepliesStatusMutation>;
export const PetitionReplies_sendPetitionClosedNotificationDocument = gql`
    mutation PetitionReplies_sendPetitionClosedNotification($petitionId: GID!, $emailBody: JSON!, $attachPdfExport: Boolean!, $pdfExportTitle: String, $force: Boolean) {
  sendPetitionClosedNotification(
    petitionId: $petitionId
    emailBody: $emailBody
    attachPdfExport: $attachPdfExport
    pdfExportTitle: $pdfExportTitle
    force: $force
  ) {
    id
  }
}
    `;
export function usePetitionReplies_sendPetitionClosedNotificationMutation(baseOptions?: Apollo.MutationHookOptions<PetitionReplies_sendPetitionClosedNotificationMutation, PetitionReplies_sendPetitionClosedNotificationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PetitionReplies_sendPetitionClosedNotificationMutation, PetitionReplies_sendPetitionClosedNotificationMutationVariables>(PetitionReplies_sendPetitionClosedNotificationDocument, options);
      }
export type PetitionReplies_sendPetitionClosedNotificationMutationHookResult = ReturnType<typeof usePetitionReplies_sendPetitionClosedNotificationMutation>;
export const PetitionRepliesUserDocument = gql`
    query PetitionRepliesUser {
  me {
    ...PetitionReplies_User
  }
}
    ${PetitionReplies_UserFragmentDoc}`;
export function usePetitionRepliesUserQuery(baseOptions?: Apollo.QueryHookOptions<PetitionRepliesUserQuery, PetitionRepliesUserQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PetitionRepliesUserQuery, PetitionRepliesUserQueryVariables>(PetitionRepliesUserDocument, options);
      }
export function usePetitionRepliesUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PetitionRepliesUserQuery, PetitionRepliesUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PetitionRepliesUserQuery, PetitionRepliesUserQueryVariables>(PetitionRepliesUserDocument, options);
        }
export type PetitionRepliesUserQueryHookResult = ReturnType<typeof usePetitionRepliesUserQuery>;
export type PetitionRepliesUserLazyQueryHookResult = ReturnType<typeof usePetitionRepliesUserLazyQuery>;
export const PetitionRepliesDocument = gql`
    query PetitionReplies($id: GID!, $hasPetitionSignature: Boolean!, $hasInternalComments: Boolean!) {
  petition(id: $id) {
    ...PetitionReplies_Petition
  }
}
    ${PetitionReplies_PetitionFragmentDoc}`;
export function usePetitionRepliesQuery(baseOptions: Apollo.QueryHookOptions<PetitionRepliesQuery, PetitionRepliesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PetitionRepliesQuery, PetitionRepliesQueryVariables>(PetitionRepliesDocument, options);
      }
export function usePetitionRepliesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PetitionRepliesQuery, PetitionRepliesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PetitionRepliesQuery, PetitionRepliesQueryVariables>(PetitionRepliesDocument, options);
        }
export type PetitionRepliesQueryHookResult = ReturnType<typeof usePetitionRepliesQuery>;
export type PetitionRepliesLazyQueryHookResult = ReturnType<typeof usePetitionRepliesLazyQuery>;
export const PetitionsUserDocument = gql`
    query PetitionsUser {
  me {
    ...Petitions_User
  }
}
    ${Petitions_UserFragmentDoc}`;
export function usePetitionsUserQuery(baseOptions?: Apollo.QueryHookOptions<PetitionsUserQuery, PetitionsUserQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PetitionsUserQuery, PetitionsUserQueryVariables>(PetitionsUserDocument, options);
      }
export function usePetitionsUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PetitionsUserQuery, PetitionsUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PetitionsUserQuery, PetitionsUserQueryVariables>(PetitionsUserDocument, options);
        }
export type PetitionsUserQueryHookResult = ReturnType<typeof usePetitionsUserQuery>;
export type PetitionsUserLazyQueryHookResult = ReturnType<typeof usePetitionsUserLazyQuery>;
export const PetitionsDocument = gql`
    query Petitions($offset: Int!, $limit: Int!, $search: String, $sortBy: [QueryPetitions_OrderBy!], $hasPetitionSignature: Boolean!, $filters: PetitionFilter) {
  petitions(
    offset: $offset
    limit: $limit
    search: $search
    sortBy: $sortBy
    filters: $filters
  ) {
    ...Petitions_PetitionBasePagination
  }
}
    ${Petitions_PetitionBasePaginationFragmentDoc}`;
export function usePetitionsQuery(baseOptions: Apollo.QueryHookOptions<PetitionsQuery, PetitionsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PetitionsQuery, PetitionsQueryVariables>(PetitionsDocument, options);
      }
export function usePetitionsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PetitionsQuery, PetitionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PetitionsQuery, PetitionsQueryVariables>(PetitionsDocument, options);
        }
export type PetitionsQueryHookResult = ReturnType<typeof usePetitionsQuery>;
export type PetitionsLazyQueryHookResult = ReturnType<typeof usePetitionsLazyQuery>;
export const NewPetitionPublicTemplatesDocument = gql`
    query NewPetitionPublicTemplates($offset: Int!, $limit: Int!, $search: String, $locale: PetitionLocale) {
  publicTemplates(
    offset: $offset
    limit: $limit
    search: $search
    locale: $locale
  ) {
    items {
      ...NewPetition_PetitionTemplate
    }
    totalCount
  }
}
    ${NewPetition_PetitionTemplateFragmentDoc}`;
export function useNewPetitionPublicTemplatesQuery(baseOptions: Apollo.QueryHookOptions<NewPetitionPublicTemplatesQuery, NewPetitionPublicTemplatesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<NewPetitionPublicTemplatesQuery, NewPetitionPublicTemplatesQueryVariables>(NewPetitionPublicTemplatesDocument, options);
      }
export function useNewPetitionPublicTemplatesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<NewPetitionPublicTemplatesQuery, NewPetitionPublicTemplatesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<NewPetitionPublicTemplatesQuery, NewPetitionPublicTemplatesQueryVariables>(NewPetitionPublicTemplatesDocument, options);
        }
export type NewPetitionPublicTemplatesQueryHookResult = ReturnType<typeof useNewPetitionPublicTemplatesQuery>;
export type NewPetitionPublicTemplatesLazyQueryHookResult = ReturnType<typeof useNewPetitionPublicTemplatesLazyQuery>;
export const NewPetitionTemplatesDocument = gql`
    query NewPetitionTemplates($offset: Int!, $limit: Int!, $search: String, $filters: PetitionFilter) {
  templates: petitions(
    offset: $offset
    limit: $limit
    search: $search
    sortBy: [lastUsedAt_DESC]
    filters: $filters
  ) {
    items {
      ...NewPetition_PetitionTemplate
    }
    totalCount
  }
  hasTemplates: petitions(filters: {type: TEMPLATE}) {
    totalCount
  }
}
    ${NewPetition_PetitionTemplateFragmentDoc}`;
export function useNewPetitionTemplatesQuery(baseOptions: Apollo.QueryHookOptions<NewPetitionTemplatesQuery, NewPetitionTemplatesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<NewPetitionTemplatesQuery, NewPetitionTemplatesQueryVariables>(NewPetitionTemplatesDocument, options);
      }
export function useNewPetitionTemplatesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<NewPetitionTemplatesQuery, NewPetitionTemplatesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<NewPetitionTemplatesQuery, NewPetitionTemplatesQueryVariables>(NewPetitionTemplatesDocument, options);
        }
export type NewPetitionTemplatesQueryHookResult = ReturnType<typeof useNewPetitionTemplatesQuery>;
export type NewPetitionTemplatesLazyQueryHookResult = ReturnType<typeof useNewPetitionTemplatesLazyQuery>;
export const NewPetitionUserDocument = gql`
    query NewPetitionUser {
  me {
    ...NewPetition_User
  }
}
    ${NewPetition_UserFragmentDoc}`;
export function useNewPetitionUserQuery(baseOptions?: Apollo.QueryHookOptions<NewPetitionUserQuery, NewPetitionUserQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<NewPetitionUserQuery, NewPetitionUserQueryVariables>(NewPetitionUserDocument, options);
      }
export function useNewPetitionUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<NewPetitionUserQuery, NewPetitionUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<NewPetitionUserQuery, NewPetitionUserQueryVariables>(NewPetitionUserDocument, options);
        }
export type NewPetitionUserQueryHookResult = ReturnType<typeof useNewPetitionUserQuery>;
export type NewPetitionUserLazyQueryHookResult = ReturnType<typeof useNewPetitionUserLazyQuery>;
export const Account_updateAccountDocument = gql`
    mutation Account_updateAccount($id: GID!, $data: UpdateUserInput!) {
  updateUser(id: $id, data: $data) {
    id
    firstName
    lastName
    fullName
  }
}
    `;
export function useAccount_updateAccountMutation(baseOptions?: Apollo.MutationHookOptions<Account_updateAccountMutation, Account_updateAccountMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<Account_updateAccountMutation, Account_updateAccountMutationVariables>(Account_updateAccountDocument, options);
      }
export type Account_updateAccountMutationHookResult = ReturnType<typeof useAccount_updateAccountMutation>;
export const AccountDocument = gql`
    query Account {
  me {
    id
    ...Account_User
  }
}
    ${Account_UserFragmentDoc}`;
export function useAccountQuery(baseOptions?: Apollo.QueryHookOptions<AccountQuery, AccountQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<AccountQuery, AccountQueryVariables>(AccountDocument, options);
      }
export function useAccountLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<AccountQuery, AccountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<AccountQuery, AccountQueryVariables>(AccountDocument, options);
        }
export type AccountQueryHookResult = ReturnType<typeof useAccountQuery>;
export type AccountLazyQueryHookResult = ReturnType<typeof useAccountLazyQuery>;
export const SettingsDocument = gql`
    query Settings {
  me {
    id
    ...Settings_User
  }
}
    ${Settings_UserFragmentDoc}`;
export function useSettingsQuery(baseOptions?: Apollo.QueryHookOptions<SettingsQuery, SettingsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SettingsQuery, SettingsQueryVariables>(SettingsDocument, options);
      }
export function useSettingsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SettingsQuery, SettingsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SettingsQuery, SettingsQueryVariables>(SettingsDocument, options);
        }
export type SettingsQueryHookResult = ReturnType<typeof useSettingsQuery>;
export type SettingsLazyQueryHookResult = ReturnType<typeof useSettingsLazyQuery>;
export const Security_updatePasswordDocument = gql`
    mutation Security_updatePassword($password: String!, $newPassword: String!) {
  changePassword(password: $password, newPassword: $newPassword)
}
    `;
export function useSecurity_updatePasswordMutation(baseOptions?: Apollo.MutationHookOptions<Security_updatePasswordMutation, Security_updatePasswordMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<Security_updatePasswordMutation, Security_updatePasswordMutationVariables>(Security_updatePasswordDocument, options);
      }
export type Security_updatePasswordMutationHookResult = ReturnType<typeof useSecurity_updatePasswordMutation>;
export const SecurityDocument = gql`
    query Security {
  me {
    isSsoUser
    ...SettingsLayout_User
    ...useSettingsSections_User
  }
}
    ${SettingsLayout_UserFragmentDoc}
${useSettingsSections_UserFragmentDoc}`;
export function useSecurityQuery(baseOptions?: Apollo.QueryHookOptions<SecurityQuery, SecurityQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SecurityQuery, SecurityQueryVariables>(SecurityDocument, options);
      }
export function useSecurityLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SecurityQuery, SecurityQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SecurityQuery, SecurityQueryVariables>(SecurityDocument, options);
        }
export type SecurityQueryHookResult = ReturnType<typeof useSecurityQuery>;
export type SecurityLazyQueryHookResult = ReturnType<typeof useSecurityLazyQuery>;
export const RevokeUserAuthTokenDocument = gql`
    mutation RevokeUserAuthToken($authTokenIds: [GID!]!) {
  revokeUserAuthToken(authTokenIds: $authTokenIds)
}
    `;
export function useRevokeUserAuthTokenMutation(baseOptions?: Apollo.MutationHookOptions<RevokeUserAuthTokenMutation, RevokeUserAuthTokenMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RevokeUserAuthTokenMutation, RevokeUserAuthTokenMutationVariables>(RevokeUserAuthTokenDocument, options);
      }
export type RevokeUserAuthTokenMutationHookResult = ReturnType<typeof useRevokeUserAuthTokenMutation>;
export const TokensDocument = gql`
    query Tokens($offset: Int!, $limit: Int!, $search: String, $sortBy: [UserAuthenticationTokens_OrderBy!]) {
  me {
    id
    authenticationTokens(
      limit: $limit
      offset: $offset
      search: $search
      sortBy: $sortBy
    ) {
      totalCount
      items {
        ...Tokens_UserAuthenticationToken
      }
    }
    ...SettingsLayout_User
    ...useSettingsSections_User
  }
}
    ${Tokens_UserAuthenticationTokenFragmentDoc}
${SettingsLayout_UserFragmentDoc}
${useSettingsSections_UserFragmentDoc}`;
export function useTokensQuery(baseOptions: Apollo.QueryHookOptions<TokensQuery, TokensQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TokensQuery, TokensQueryVariables>(TokensDocument, options);
      }
export function useTokensLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TokensQuery, TokensQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TokensQuery, TokensQueryVariables>(TokensDocument, options);
        }
export type TokensQueryHookResult = ReturnType<typeof useTokensQuery>;
export type TokensLazyQueryHookResult = ReturnType<typeof useTokensLazyQuery>;
export const CurrentUserDocument = gql`
    query CurrentUser {
  me {
    ...Login_User
  }
}
    ${Login_UserFragmentDoc}`;
export function useCurrentUserQuery(baseOptions?: Apollo.QueryHookOptions<CurrentUserQuery, CurrentUserQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<CurrentUserQuery, CurrentUserQueryVariables>(CurrentUserDocument, options);
      }
export function useCurrentUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CurrentUserQuery, CurrentUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<CurrentUserQuery, CurrentUserQueryVariables>(CurrentUserDocument, options);
        }
export type CurrentUserQueryHookResult = ReturnType<typeof useCurrentUserQuery>;
export type CurrentUserLazyQueryHookResult = ReturnType<typeof useCurrentUserLazyQuery>;
export const RecipientView_publicCompletePetitionDocument = gql`
    mutation RecipientView_publicCompletePetition($keycode: ID!, $signer: PublicPetitionSignerData) {
  publicCompletePetition(keycode: $keycode, signer: $signer) {
    id
    status
  }
}
    `;
export function useRecipientView_publicCompletePetitionMutation(baseOptions?: Apollo.MutationHookOptions<RecipientView_publicCompletePetitionMutation, RecipientView_publicCompletePetitionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RecipientView_publicCompletePetitionMutation, RecipientView_publicCompletePetitionMutationVariables>(RecipientView_publicCompletePetitionDocument, options);
      }
export type RecipientView_publicCompletePetitionMutationHookResult = ReturnType<typeof useRecipientView_publicCompletePetitionMutation>;
export const PublicPetitionDocument = gql`
    query PublicPetition($keycode: ID!) {
  access(keycode: $keycode) {
    ...RecipientView_PublicPetitionAccess
  }
}
    ${RecipientView_PublicPetitionAccessFragmentDoc}`;
export function usePublicPetitionQuery(baseOptions: Apollo.QueryHookOptions<PublicPetitionQuery, PublicPetitionQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PublicPetitionQuery, PublicPetitionQueryVariables>(PublicPetitionDocument, options);
      }
export function usePublicPetitionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PublicPetitionQuery, PublicPetitionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PublicPetitionQuery, PublicPetitionQueryVariables>(PublicPetitionDocument, options);
        }
export type PublicPetitionQueryHookResult = ReturnType<typeof usePublicPetitionQuery>;
export type PublicPetitionLazyQueryHookResult = ReturnType<typeof usePublicPetitionLazyQuery>;
export const RecipientView_verifyPublicAccessDocument = gql`
    mutation RecipientView_verifyPublicAccess($token: ID!, $keycode: ID!, $ip: String, $userAgent: String) {
  verifyPublicAccess(
    token: $token
    keycode: $keycode
    ip: $ip
    userAgent: $userAgent
  ) {
    isAllowed
    cookieName
    cookieValue
    email
    orgName
    orgLogoUrl
  }
}
    `;
export function useRecipientView_verifyPublicAccessMutation(baseOptions?: Apollo.MutationHookOptions<RecipientView_verifyPublicAccessMutation, RecipientView_verifyPublicAccessMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RecipientView_verifyPublicAccessMutation, RecipientView_verifyPublicAccessMutationVariables>(RecipientView_verifyPublicAccessDocument, options);
      }
export type RecipientView_verifyPublicAccessMutationHookResult = ReturnType<typeof useRecipientView_verifyPublicAccessMutation>;
export const publicSendVerificationCodeDocument = gql`
    mutation publicSendVerificationCode($keycode: ID!) {
  publicSendVerificationCode(keycode: $keycode) {
    token
    remainingAttempts
    expiresAt
  }
}
    `;
export function usepublicSendVerificationCodeMutation(baseOptions?: Apollo.MutationHookOptions<publicSendVerificationCodeMutation, publicSendVerificationCodeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<publicSendVerificationCodeMutation, publicSendVerificationCodeMutationVariables>(publicSendVerificationCodeDocument, options);
      }
export type publicSendVerificationCodeMutationHookResult = ReturnType<typeof usepublicSendVerificationCodeMutation>;
export const publicCheckVerificationCodeDocument = gql`
    mutation publicCheckVerificationCode($keycode: ID!, $token: ID!, $code: String!) {
  publicCheckVerificationCode(keycode: $keycode, token: $token, code: $code) {
    result
    remainingAttempts
  }
}
    `;
export function usepublicCheckVerificationCodeMutation(baseOptions?: Apollo.MutationHookOptions<publicCheckVerificationCodeMutation, publicCheckVerificationCodeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<publicCheckVerificationCodeMutation, publicCheckVerificationCodeMutationVariables>(publicCheckVerificationCodeDocument, options);
      }
export type publicCheckVerificationCodeMutationHookResult = ReturnType<typeof usepublicCheckVerificationCodeMutation>;
export const OptOut_publicOptOutRemindersDocument = gql`
    mutation OptOut_publicOptOutReminders($keycode: ID!, $reason: String!, $other: String!) {
  publicOptOutReminders(keycode: $keycode, reason: $reason, other: $other) {
    petition {
      id
    }
  }
}
    `;
export function useOptOut_publicOptOutRemindersMutation(baseOptions?: Apollo.MutationHookOptions<OptOut_publicOptOutRemindersMutation, OptOut_publicOptOutRemindersMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<OptOut_publicOptOutRemindersMutation, OptOut_publicOptOutRemindersMutationVariables>(OptOut_publicOptOutRemindersDocument, options);
      }
export type OptOut_publicOptOutRemindersMutationHookResult = ReturnType<typeof useOptOut_publicOptOutRemindersMutation>;
export const PublicOptOutDocument = gql`
    query PublicOptOut($keycode: ID!) {
  access(keycode: $keycode) {
    ...OptOut_PublicPetitionAccess
  }
}
    ${OptOut_PublicPetitionAccessFragmentDoc}`;
export function usePublicOptOutQuery(baseOptions: Apollo.QueryHookOptions<PublicOptOutQuery, PublicOptOutQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PublicOptOutQuery, PublicOptOutQueryVariables>(PublicOptOutDocument, options);
      }
export function usePublicOptOutLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PublicOptOutQuery, PublicOptOutQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PublicOptOutQuery, PublicOptOutQueryVariables>(PublicOptOutDocument, options);
        }
export type PublicOptOutQueryHookResult = ReturnType<typeof usePublicOptOutQuery>;
export type PublicOptOutLazyQueryHookResult = ReturnType<typeof usePublicOptOutLazyQuery>;
export const PublicPetitionLink_publicCreateAndSendPetitionFromPublicLinkDocument = gql`
  mutation PublicPetitionLink_publicCreateAndSendPetitionFromPublicLink(
    $publicPetitionLinkId: GID!
    $contactFirstName: String!
    $contactLastName: String!
    $contactEmail: String!
    $force: Boolean
  ) {
    publicCreateAndSendPetitionFromPublicLink(
      publicPetitionLinkId: $publicPetitionLinkId
      contactFirstName: $contactFirstName
      contactLastName: $contactLastName
      contactEmail: $contactEmail
      force: $force
    )
  }
`;
export function usePublicPetitionLink_publicCreateAndSendPetitionFromPublicLinkMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PublicPetitionLink_publicCreateAndSendPetitionFromPublicLinkMutation,
    PublicPetitionLink_publicCreateAndSendPetitionFromPublicLinkMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PublicPetitionLink_publicCreateAndSendPetitionFromPublicLinkMutation,
    PublicPetitionLink_publicCreateAndSendPetitionFromPublicLinkMutationVariables
  >(PublicPetitionLink_publicCreateAndSendPetitionFromPublicLinkDocument, options);
}
export type PublicPetitionLink_publicCreateAndSendPetitionFromPublicLinkMutationHookResult =
  ReturnType<typeof usePublicPetitionLink_publicCreateAndSendPetitionFromPublicLinkMutation>;
export const PublicPetitionLink_publicSendReminderDocument = gql`
  mutation PublicPetitionLink_publicSendReminder(
    $publicPetitionLinkId: GID!
    $contactEmail: String!
  ) {
    publicSendReminder(publicPetitionLinkId: $publicPetitionLinkId, contactEmail: $contactEmail)
  }
`;
export function usePublicPetitionLink_publicSendReminderMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PublicPetitionLink_publicSendReminderMutation,
    PublicPetitionLink_publicSendReminderMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PublicPetitionLink_publicSendReminderMutation,
    PublicPetitionLink_publicSendReminderMutationVariables
  >(PublicPetitionLink_publicSendReminderDocument, options);
}
export type PublicPetitionLink_publicSendReminderMutationHookResult = ReturnType<
  typeof usePublicPetitionLink_publicSendReminderMutation
>;
export const PublicTemplateLink_publicPetitionLinkBySlugDocument = gql`
  query PublicTemplateLink_publicPetitionLinkBySlug($slug: String!) {
    publicPetitionLinkBySlug(slug: $slug) {
      ...PublicPetitionLink_PublicPetitionLink
    }
  }
  ${PublicPetitionLink_PublicPetitionLinkFragmentDoc}
`;
export function usePublicTemplateLink_publicPetitionLinkBySlugQuery(
  baseOptions: Apollo.QueryHookOptions<
    PublicTemplateLink_publicPetitionLinkBySlugQuery,
    PublicTemplateLink_publicPetitionLinkBySlugQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    PublicTemplateLink_publicPetitionLinkBySlugQuery,
    PublicTemplateLink_publicPetitionLinkBySlugQueryVariables
  >(PublicTemplateLink_publicPetitionLinkBySlugDocument, options);
}
export function usePublicTemplateLink_publicPetitionLinkBySlugLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PublicTemplateLink_publicPetitionLinkBySlugQuery,
    PublicTemplateLink_publicPetitionLinkBySlugQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    PublicTemplateLink_publicPetitionLinkBySlugQuery,
    PublicTemplateLink_publicPetitionLinkBySlugQueryVariables
  >(PublicTemplateLink_publicPetitionLinkBySlugDocument, options);
}
export type PublicTemplateLink_publicPetitionLinkBySlugQueryHookResult = ReturnType<
  typeof usePublicTemplateLink_publicPetitionLinkBySlugQuery
>;
export type PublicTemplateLink_publicPetitionLinkBySlugLazyQueryHookResult = ReturnType<
  typeof usePublicTemplateLink_publicPetitionLinkBySlugLazyQuery
>;
export const PdfViewPetitionDocument = gql`
    query PdfViewPetition($token: String!) {
  petitionAuthToken(token: $token) {
    ...PetitionPdf_Petition
  }
}
    ${PetitionPdf_PetitionFragmentDoc}`;
export function usePdfViewPetitionQuery(baseOptions: Apollo.QueryHookOptions<PdfViewPetitionQuery, PdfViewPetitionQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PdfViewPetitionQuery, PdfViewPetitionQueryVariables>(PdfViewPetitionDocument, options);
      }
export function usePdfViewPetitionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PdfViewPetitionQuery, PdfViewPetitionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PdfViewPetitionQuery, PdfViewPetitionQueryVariables>(PdfViewPetitionDocument, options);
        }
export type PdfViewPetitionQueryHookResult = ReturnType<typeof usePdfViewPetitionQuery>;
export type PdfViewPetitionLazyQueryHookResult = ReturnType<typeof usePdfViewPetitionLazyQuery>;
export const LandingTemplateDetails_landingTemplateBySlugDocument = gql`
    query LandingTemplateDetails_landingTemplateBySlug($slug: String!) {
  landingTemplateBySlug(slug: $slug) {
    ...LandingTemplateDetails_LandingTemplate
  }
}
    ${LandingTemplateDetails_LandingTemplateFragmentDoc}`;
export function useLandingTemplateDetails_landingTemplateBySlugQuery(baseOptions: Apollo.QueryHookOptions<LandingTemplateDetails_landingTemplateBySlugQuery, LandingTemplateDetails_landingTemplateBySlugQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<LandingTemplateDetails_landingTemplateBySlugQuery, LandingTemplateDetails_landingTemplateBySlugQueryVariables>(LandingTemplateDetails_landingTemplateBySlugDocument, options);
      }
export function useLandingTemplateDetails_landingTemplateBySlugLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<LandingTemplateDetails_landingTemplateBySlugQuery, LandingTemplateDetails_landingTemplateBySlugQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<LandingTemplateDetails_landingTemplateBySlugQuery, LandingTemplateDetails_landingTemplateBySlugQueryVariables>(LandingTemplateDetails_landingTemplateBySlugDocument, options);
        }
export type LandingTemplateDetails_landingTemplateBySlugQueryHookResult = ReturnType<typeof useLandingTemplateDetails_landingTemplateBySlugQuery>;
export type LandingTemplateDetails_landingTemplateBySlugLazyQueryHookResult = ReturnType<typeof useLandingTemplateDetails_landingTemplateBySlugLazyQuery>;
export const LandingTemplateDetails_landingTemplatesDocument = gql`
    query LandingTemplateDetails_landingTemplates($offset: Int!, $limit: Int!, $locale: PetitionLocale!, $categories: [String!]) {
  landingTemplates(
    offset: $offset
    limit: $limit
    locale: $locale
    categories: $categories
  ) {
    items {
      ...PublicTemplateCard_LandingTemplate
    }
    totalCount
  }
}
    ${PublicTemplateCard_LandingTemplateFragmentDoc}`;
export function useLandingTemplateDetails_landingTemplatesQuery(baseOptions: Apollo.QueryHookOptions<LandingTemplateDetails_landingTemplatesQuery, LandingTemplateDetails_landingTemplatesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<LandingTemplateDetails_landingTemplatesQuery, LandingTemplateDetails_landingTemplatesQueryVariables>(LandingTemplateDetails_landingTemplatesDocument, options);
      }
export function useLandingTemplateDetails_landingTemplatesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<LandingTemplateDetails_landingTemplatesQuery, LandingTemplateDetails_landingTemplatesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<LandingTemplateDetails_landingTemplatesQuery, LandingTemplateDetails_landingTemplatesQueryVariables>(LandingTemplateDetails_landingTemplatesDocument, options);
        }
export type LandingTemplateDetails_landingTemplatesQueryHookResult = ReturnType<typeof useLandingTemplateDetails_landingTemplatesQuery>;
export type LandingTemplateDetails_landingTemplatesLazyQueryHookResult = ReturnType<typeof useLandingTemplateDetails_landingTemplatesLazyQuery>;
export const LandingTemplatesCategory_landingTemplatesSamplesDocument = gql`
    query LandingTemplatesCategory_landingTemplatesSamples($locale: PetitionLocale!) {
  landingTemplatesSamples {
    category
    templates(locale: $locale) {
      totalCount
    }
  }
}
    `;
export function useLandingTemplatesCategory_landingTemplatesSamplesQuery(baseOptions: Apollo.QueryHookOptions<LandingTemplatesCategory_landingTemplatesSamplesQuery, LandingTemplatesCategory_landingTemplatesSamplesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<LandingTemplatesCategory_landingTemplatesSamplesQuery, LandingTemplatesCategory_landingTemplatesSamplesQueryVariables>(LandingTemplatesCategory_landingTemplatesSamplesDocument, options);
      }
export function useLandingTemplatesCategory_landingTemplatesSamplesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<LandingTemplatesCategory_landingTemplatesSamplesQuery, LandingTemplatesCategory_landingTemplatesSamplesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<LandingTemplatesCategory_landingTemplatesSamplesQuery, LandingTemplatesCategory_landingTemplatesSamplesQueryVariables>(LandingTemplatesCategory_landingTemplatesSamplesDocument, options);
        }
export type LandingTemplatesCategory_landingTemplatesSamplesQueryHookResult = ReturnType<typeof useLandingTemplatesCategory_landingTemplatesSamplesQuery>;
export type LandingTemplatesCategory_landingTemplatesSamplesLazyQueryHookResult = ReturnType<typeof useLandingTemplatesCategory_landingTemplatesSamplesLazyQuery>;
export const LandingTemplatesCategory_landingTemplatesDocument = gql`
    query LandingTemplatesCategory_landingTemplates($offset: Int!, $limit: Int!, $category: String!, $locale: PetitionLocale!) {
  landingTemplates(
    offset: $offset
    limit: $limit
    categories: [$category]
    locale: $locale
  ) {
    totalCount
    items {
      ...PublicTemplateCard_LandingTemplate
    }
  }
}
    ${PublicTemplateCard_LandingTemplateFragmentDoc}`;
export function useLandingTemplatesCategory_landingTemplatesQuery(baseOptions: Apollo.QueryHookOptions<LandingTemplatesCategory_landingTemplatesQuery, LandingTemplatesCategory_landingTemplatesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<LandingTemplatesCategory_landingTemplatesQuery, LandingTemplatesCategory_landingTemplatesQueryVariables>(LandingTemplatesCategory_landingTemplatesDocument, options);
      }
export function useLandingTemplatesCategory_landingTemplatesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<LandingTemplatesCategory_landingTemplatesQuery, LandingTemplatesCategory_landingTemplatesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<LandingTemplatesCategory_landingTemplatesQuery, LandingTemplatesCategory_landingTemplatesQueryVariables>(LandingTemplatesCategory_landingTemplatesDocument, options);
        }
export type LandingTemplatesCategory_landingTemplatesQueryHookResult = ReturnType<typeof useLandingTemplatesCategory_landingTemplatesQuery>;
export type LandingTemplatesCategory_landingTemplatesLazyQueryHookResult = ReturnType<typeof useLandingTemplatesCategory_landingTemplatesLazyQuery>;
export const LandingTemplates_landingTemplatesSamplesDocument = gql`
    query LandingTemplates_landingTemplatesSamples($offset: Int!, $limit: Int!, $locale: PetitionLocale!) {
  landingTemplatesSamples {
    category
    templates(offset: $offset, limit: $limit, locale: $locale) {
      items {
        ...PublicTemplateCard_LandingTemplate
      }
      totalCount
    }
  }
}
    ${PublicTemplateCard_LandingTemplateFragmentDoc}`;
export function useLandingTemplates_landingTemplatesSamplesQuery(baseOptions: Apollo.QueryHookOptions<LandingTemplates_landingTemplatesSamplesQuery, LandingTemplates_landingTemplatesSamplesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<LandingTemplates_landingTemplatesSamplesQuery, LandingTemplates_landingTemplatesSamplesQueryVariables>(LandingTemplates_landingTemplatesSamplesDocument, options);
      }
export function useLandingTemplates_landingTemplatesSamplesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<LandingTemplates_landingTemplatesSamplesQuery, LandingTemplates_landingTemplatesSamplesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<LandingTemplates_landingTemplatesSamplesQuery, LandingTemplates_landingTemplatesSamplesQueryVariables>(LandingTemplates_landingTemplatesSamplesDocument, options);
        }
export type LandingTemplates_landingTemplatesSamplesQueryHookResult = ReturnType<typeof useLandingTemplates_landingTemplatesSamplesQuery>;
export type LandingTemplates_landingTemplatesSamplesLazyQueryHookResult = ReturnType<typeof useLandingTemplates_landingTemplatesSamplesLazyQuery>;
export const Thanks_PetitionLogoDocument = gql`
    query Thanks_PetitionLogo($id: GID!) {
  publicOrgLogoUrl(id: $id)
}
    `;
export function useThanks_PetitionLogoQuery(baseOptions: Apollo.QueryHookOptions<Thanks_PetitionLogoQuery, Thanks_PetitionLogoQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<Thanks_PetitionLogoQuery, Thanks_PetitionLogoQueryVariables>(Thanks_PetitionLogoDocument, options);
      }
export function useThanks_PetitionLogoLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<Thanks_PetitionLogoQuery, Thanks_PetitionLogoQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<Thanks_PetitionLogoQuery, Thanks_PetitionLogoQueryVariables>(Thanks_PetitionLogoDocument, options);
        }
export type Thanks_PetitionLogoQueryHookResult = ReturnType<typeof useThanks_PetitionLogoQuery>;
export type Thanks_PetitionLogoLazyQueryHookResult = ReturnType<typeof useThanks_PetitionLogoLazyQuery>;
export const GetMyIdDocument = gql`
    query GetMyId {
  me {
    id
  }
}
    `;
export function useGetMyIdQuery(baseOptions?: Apollo.QueryHookOptions<GetMyIdQuery, GetMyIdQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetMyIdQuery, GetMyIdQueryVariables>(GetMyIdDocument, options);
      }
export function useGetMyIdLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetMyIdQuery, GetMyIdQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetMyIdQuery, GetMyIdQueryVariables>(GetMyIdDocument, options);
        }
export type GetMyIdQueryHookResult = ReturnType<typeof useGetMyIdQuery>;
export type GetMyIdLazyQueryHookResult = ReturnType<typeof useGetMyIdLazyQuery>;
export const useClonePetitions_clonePetitionsDocument = gql`
    mutation useClonePetitions_clonePetitions($petitionIds: [GID!]!) {
  clonePetitions(petitionIds: $petitionIds) {
    id
  }
}
    `;
export function useuseClonePetitions_clonePetitionsMutation(baseOptions?: Apollo.MutationHookOptions<useClonePetitions_clonePetitionsMutation, useClonePetitions_clonePetitionsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<useClonePetitions_clonePetitionsMutation, useClonePetitions_clonePetitionsMutationVariables>(useClonePetitions_clonePetitionsDocument, options);
      }
export type useClonePetitions_clonePetitionsMutationHookResult = ReturnType<typeof useuseClonePetitions_clonePetitionsMutation>;
export const useCreateContact_createContactDocument = gql`
    mutation useCreateContact_createContact($data: CreateContactInput!) {
  createContact(data: $data) {
    id
    email
    firstName
    lastName
    fullName
  }
}
    `;
export function useuseCreateContact_createContactMutation(baseOptions?: Apollo.MutationHookOptions<useCreateContact_createContactMutation, useCreateContact_createContactMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<useCreateContact_createContactMutation, useCreateContact_createContactMutationVariables>(useCreateContact_createContactDocument, options);
      }
export type useCreateContact_createContactMutationHookResult = ReturnType<typeof useuseCreateContact_createContactMutation>;
export const useCreatePetition_createPetitionDocument = gql`
    mutation useCreatePetition_createPetition($name: String, $locale: PetitionLocale!, $petitionId: GID, $type: PetitionBaseType) {
  createPetition(
    name: $name
    locale: $locale
    petitionId: $petitionId
    type: $type
  ) {
    id
  }
}
    `;
export function useuseCreatePetition_createPetitionMutation(baseOptions?: Apollo.MutationHookOptions<useCreatePetition_createPetitionMutation, useCreatePetition_createPetitionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<useCreatePetition_createPetitionMutation, useCreatePetition_createPetitionMutationVariables>(useCreatePetition_createPetitionDocument, options);
      }
export type useCreatePetition_createPetitionMutationHookResult = ReturnType<typeof useuseCreatePetition_createPetitionMutation>;
export const useDeletePetitions_deletePetitionsDocument = gql`
    mutation useDeletePetitions_deletePetitions($ids: [GID!]!) {
  deletePetitions(ids: $ids)
}
    `;
export function useuseDeletePetitions_deletePetitionsMutation(baseOptions?: Apollo.MutationHookOptions<useDeletePetitions_deletePetitionsMutation, useDeletePetitions_deletePetitionsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<useDeletePetitions_deletePetitionsMutation, useDeletePetitions_deletePetitionsMutationVariables>(useDeletePetitions_deletePetitionsDocument, options);
      }
export type useDeletePetitions_deletePetitionsMutationHookResult = ReturnType<typeof useuseDeletePetitions_deletePetitionsMutation>;
export const useUpdateIsReadNotificationDocument = gql`
    mutation useUpdateIsReadNotification($petitionUserNotificationIds: [GID!], $filter: PetitionUserNotificationFilter, $petitionIds: [GID!], $petitionFieldCommentIds: [GID!], $isRead: Boolean!) {
  updatePetitionUserNotificationReadStatus(
    petitionUserNotificationIds: $petitionUserNotificationIds
    filter: $filter
    petitionIds: $petitionIds
    petitionFieldCommentIds: $petitionFieldCommentIds
    isRead: $isRead
  ) {
    id
    isRead
    ... on CommentCreatedUserNotification {
      comment {
        id
      }
    }
  }
}
    `;
export function useuseUpdateIsReadNotificationMutation(baseOptions?: Apollo.MutationHookOptions<useUpdateIsReadNotificationMutation, useUpdateIsReadNotificationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<useUpdateIsReadNotificationMutation, useUpdateIsReadNotificationMutationVariables>(useUpdateIsReadNotificationDocument, options);
      }
export type useUpdateIsReadNotificationMutationHookResult = ReturnType<typeof useuseUpdateIsReadNotificationMutation>;
export const PetitionComposeSearchContactsDocument = gql`
    query PetitionComposeSearchContacts($search: String, $exclude: [GID!]) {
  contacts(limit: 10, search: $search, exclude: $exclude) {
    items {
      ...ContactSelect_Contact
    }
  }
}
    ${ContactSelect_ContactFragmentDoc}`;
export function usePetitionComposeSearchContactsQuery(baseOptions?: Apollo.QueryHookOptions<PetitionComposeSearchContactsQuery, PetitionComposeSearchContactsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PetitionComposeSearchContactsQuery, PetitionComposeSearchContactsQueryVariables>(PetitionComposeSearchContactsDocument, options);
      }
export function usePetitionComposeSearchContactsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PetitionComposeSearchContactsQuery, PetitionComposeSearchContactsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PetitionComposeSearchContactsQuery, PetitionComposeSearchContactsQueryVariables>(PetitionComposeSearchContactsDocument, options);
        }
export type PetitionComposeSearchContactsQueryHookResult = ReturnType<typeof usePetitionComposeSearchContactsQuery>;
export type PetitionComposeSearchContactsLazyQueryHookResult = ReturnType<typeof usePetitionComposeSearchContactsLazyQuery>;