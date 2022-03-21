import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
import gql from "graphql-tag";
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
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
  __typename?: "AWSPresignedPostData";
  fields: Scalars["JSONObject"];
  url: Scalars["String"];
}

export interface AccessActivatedEvent extends PetitionEvent {
  __typename?: "AccessActivatedEvent";
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  type: PetitionEventType;
  user?: Maybe<User>;
}

export interface AccessActivatedFromPublicPetitionLinkEvent extends PetitionEvent {
  __typename?: "AccessActivatedFromPublicPetitionLinkEvent";
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  type: PetitionEventType;
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
  __typename?: "AccessDeactivatedEvent";
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  reason: Scalars["String"];
  type: PetitionEventType;
  user?: Maybe<User>;
}

export interface AccessDelegatedEvent extends PetitionEvent {
  __typename?: "AccessDelegatedEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  newAccess: PetitionAccess;
  originalAccess: PetitionAccess;
  type: PetitionEventType;
}

export interface AccessOpenedEvent extends PetitionEvent {
  __typename?: "AccessOpenedEvent";
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  type: PetitionEventType;
}

export type BulkSendSigningMode =
  /** Allow configured signer(s) to sign every petition on the batch */
  | "COPY_SIGNATURE_SETTINGS"
  /** Disable eSignature on every petition of this batch. */
  | "DISABLE_SIGNATURE"
  /** Let recipients of each group to choose who will sign the petitions. */
  | "LET_RECIPIENT_CHOOSE";

export type ChangePasswordResult = "INCORRECT_PASSWORD" | "INVALID_NEW_PASSWORD" | "SUCCESS";

export interface CommentCreatedUserNotification extends PetitionUserNotification {
  __typename?: "CommentCreatedUserNotification";
  comment: PetitionFieldComment;
  createdAt: Scalars["DateTime"];
  field: PetitionField;
  id: Scalars["GID"];
  isRead: Scalars["Boolean"];
  petition: PetitionBase;
}

export interface CommentDeletedEvent extends PetitionEvent {
  __typename?: "CommentDeletedEvent";
  createdAt: Scalars["DateTime"];
  deletedBy?: Maybe<UserOrPetitionAccess>;
  field?: Maybe<PetitionField>;
  id: Scalars["GID"];
  type: PetitionEventType;
}

export interface CommentPublishedEvent extends PetitionEvent {
  __typename?: "CommentPublishedEvent";
  comment?: Maybe<PetitionFieldComment>;
  createdAt: Scalars["DateTime"];
  field?: Maybe<PetitionField>;
  id: Scalars["GID"];
  type: PetitionEventType;
}

/** Information from the connection. */
export interface ConnectionMetadata {
  __typename?: "ConnectionMetadata";
  browserName?: Maybe<Scalars["String"]>;
  browserVersion?: Maybe<Scalars["String"]>;
  country?: Maybe<Scalars["String"]>;
  ip?: Maybe<Scalars["String"]>;
}

/** A contact in the system. */
export interface Contact extends Timestamps {
  __typename?: "Contact";
  /** The petition accesses for this contact */
  accesses: PetitionAccessPagination;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The email of the contact. */
  email: Scalars["String"];
  /** The first name of the contact. */
  firstName: Scalars["String"];
  /** The full name of the contact. */
  fullName: Scalars["String"];
  hasBouncedEmail: Scalars["Boolean"];
  /** The ID of the contact. */
  id: Scalars["GID"];
  /** The last name of the contact. */
  lastName?: Maybe<Scalars["String"]>;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
}

/** A contact in the system. */
export interface ContactaccessesArgs {
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
}

export interface ContactPagination {
  __typename?: "ContactPagination";
  /** The requested slice of items. */
  items: Array<Contact>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
}

export interface CreateContactInput {
  email: Scalars["String"];
  firstName: Scalars["String"];
  lastName?: InputMaybe<Scalars["String"]>;
}

export interface CreatedAt {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
}

/** The effective permission for a petition and user */
export interface EffectivePetitionUserPermission {
  __typename?: "EffectivePetitionUserPermission";
  /** wether user is subscribed or not to emails and alerts of the petition */
  isSubscribed: Scalars["Boolean"];
  /** The type of the permission. */
  permissionType: PetitionPermissionType;
}

export type EntityType = "Contact" | "Organization" | "Petition" | "User";

export type FeatureFlag =
  | "DEVELOPER_ACCESS"
  | "EXPORT_CUATRECASAS"
  | "HIDE_RECIPIENT_VIEW_CONTENTS"
  | "INTERNAL_COMMENTS"
  | "PETITION_PDF_EXPORT"
  | "PETITION_SIGNATURE"
  | "SKIP_FORWARD_SECURITY";

export interface FileUpload {
  __typename?: "FileUpload";
  contentType: Scalars["String"];
  filename: Scalars["String"];
  isComplete: Scalars["Boolean"];
  size: Scalars["Int"];
}

export interface FileUploadDownloadLinkResult {
  __typename?: "FileUploadDownloadLinkResult";
  file?: Maybe<FileUpload>;
  result: Result;
  url?: Maybe<Scalars["String"]>;
}

export interface FileUploadInput {
  contentType: Scalars["String"];
  filename: Scalars["String"];
  size: Scalars["Int"];
}

export interface FileUploadReplyResponse {
  __typename?: "FileUploadReplyResponse";
  presignedPostData: AWSPresignedPostData;
  reply: PetitionFieldReply;
}

export type FilterSharedWithLogicalOperator = "AND" | "OR";

export type FilterSharedWithOperator =
  | "IS_OWNER"
  | "NOT_IS_OWNER"
  | "NOT_SHARED_WITH"
  | "SHARED_WITH";

export interface GenerateUserAuthTokenResponse {
  __typename?: "GenerateUserAuthTokenResponse";
  apiKey: Scalars["String"];
  userAuthToken: UserAuthenticationToken;
}

export interface GroupPermissionAddedEvent extends PetitionEvent {
  __typename?: "GroupPermissionAddedEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  permissionGroup?: Maybe<UserGroup>;
  permissionType: PetitionPermissionType;
  type: PetitionEventType;
  user?: Maybe<User>;
}

export interface GroupPermissionEditedEvent extends PetitionEvent {
  __typename?: "GroupPermissionEditedEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  permissionGroup?: Maybe<UserGroup>;
  permissionType: PetitionPermissionType;
  type: PetitionEventType;
  user?: Maybe<User>;
}

export interface GroupPermissionRemovedEvent extends PetitionEvent {
  __typename?: "GroupPermissionRemovedEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  permissionGroup?: Maybe<UserGroup>;
  type: PetitionEventType;
  user?: Maybe<User>;
}

/** The types of integrations available. */
export type IntegrationType = "SIGNATURE" | "SSO" | "USER_PROVISIONING";

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
  name?: Maybe<Scalars["String"]>;
  organizationName: Scalars["String"];
  ownerAvatarUrl?: Maybe<Scalars["String"]>;
  ownerFullName: Scalars["String"];
  publicLinkUrl?: Maybe<Scalars["String"]>;
  shortDescription?: Maybe<Scalars["String"]>;
  slug: Scalars["String"];
  updatedAt: Scalars["DateTime"];
}

export interface LandingTemplateCategorySample {
  __typename?: "LandingTemplateCategorySample";
  category: Scalars["String"];
  templates: LandingTemplatePagination;
}

export interface LandingTemplateCategorySampletemplatesArgs {
  limit?: InputMaybe<Scalars["Int"]>;
  locale: PetitionLocale;
  offset?: InputMaybe<Scalars["Int"]>;
}

/** A public template field */
export interface LandingTemplateField {
  __typename?: "LandingTemplateField";
  id: Scalars["GID"];
  title?: Maybe<Scalars["String"]>;
  type: PetitionFieldType;
}

export interface LandingTemplatePagination {
  __typename?: "LandingTemplatePagination";
  /** The requested slice of items. */
  items: Array<LandingTemplate>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
}

export interface MessageCancelledEvent extends PetitionEvent {
  __typename?: "MessageCancelledEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  message: PetitionMessage;
  reason: Scalars["String"];
  type: PetitionEventType;
  user?: Maybe<User>;
}

export interface MessageEmailBouncedUserNotification extends PetitionUserNotification {
  __typename?: "MessageEmailBouncedUserNotification";
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  isRead: Scalars["Boolean"];
  petition: PetitionBase;
}

export interface MessageScheduledEvent extends PetitionEvent {
  __typename?: "MessageScheduledEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  message: PetitionMessage;
  type: PetitionEventType;
}

export interface MessageSentEvent extends PetitionEvent {
  __typename?: "MessageSentEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  message: PetitionMessage;
  type: PetitionEventType;
}

export interface Mutation {
  __typename?: "Mutation";
  /** set user status to ACTIVE. */
  activateUser: Array<User>;
  /** Adds permissions on given petitions and users */
  addPetitionPermission: Array<PetitionBase>;
  /** Add users to a user group */
  addUsersToUserGroup: UserGroup;
  /** Updates the status of a PENDING petition field replies to APPROVED or REJECTED */
  approveOrRejectPetitionFieldReplies: Petition;
  /** Clones the petition and assigns the given user as owner and creator. */
  assignPetitionToUser: SupportMethodResponse;
  /** Load contacts from an excel file, creating the ones not found on database */
  bulkCreateContacts: Array<Contact>;
  /** Sends different petitions to each of the specified contact groups, creating corresponding accesses and messages */
  bulkSendPetition: Array<SendPetitionResult>;
  /** Cancels a scheduled petition message. */
  cancelScheduledMessage?: Maybe<PetitionMessage>;
  cancelSignatureRequest: PetitionSignatureRequest;
  /** Changes the password for the current logged in user. */
  changePassword: ChangePasswordResult;
  /** Changes the type of a petition Field */
  changePetitionFieldType: PetitionField;
  /** Clones a petition field */
  clonePetitionField: PetitionField;
  /** Clone petition. */
  clonePetitions: Array<PetitionBase>;
  /** Clones the user group with all its members */
  cloneUserGroup: Array<UserGroup>;
  /** Closes an open petition. */
  closePetition: Petition;
  /**
   * Marks a petition as COMPLETED.
   * If the petition has a signature configured and does not require a review, starts the signing process.
   */
  completePetition: Petition;
  /**
   * Creates a reply to a checkbox field.
   * @deprecated use createPetitionFieldReply instead
   */
  createCheckboxReply: PetitionFieldReply;
  /** Create a contact. */
  createContact: Contact;
  /**
   * Creates a reply for a dynamic select field.
   * @deprecated use createPetitionFieldReply instead
   */
  createDynamicSelectReply: PetitionFieldReply;
  /** Creates an event subscription for the user's petitions */
  createEventSubscription: PetitionEventSubscription;
  /** Creates a task for exporting a ZIP file with petition replies and sends it to the queue */
  createExportRepliesTask: Task;
  /** Creates a reply to a file upload field. */
  createFileUploadReply: FileUploadReplyResponse;
  /** Notifies the backend that the upload is complete. */
  createFileUploadReplyComplete: PetitionFieldReply;
  /**
   * Creates a reply to a numeric field.
   * @deprecated use createPetitionFieldReply instead
   */
  createNumericReply: PetitionFieldReply;
  /** Creates a new organization. */
  createOrganization: SupportMethodResponse;
  /** Creates a new user in the same organization as the context user */
  createOrganizationUser: User;
  /** Create petition. */
  createPetition: PetitionBase;
  /** Generates and returns a signed url to upload a petition attachment to AWS S3 */
  createPetitionAttachmentUploadLink: PetitionAttachmentUploadData;
  /** Creates a petition field */
  createPetitionField: PetitionField;
  /** Generates and returns a signed url to upload a field attachment to AWS S3 */
  createPetitionFieldAttachmentUploadLink: PetitionFieldAttachmentUploadData;
  /** Create a petition field comment. */
  createPetitionFieldComment: PetitionFieldComment;
  /** Creates a reply on a petition field */
  createPetitionFieldReply: PetitionFieldReply;
  /** Creates a task for printing a PDF of the petition and sends it to the queue */
  createPrintPdfTask: Task;
  /** Creates a public link from a user's template */
  createPublicPetitionLink: PublicPetitionLink;
  /** Creates a new signature integration on the user's organization */
  createSignatureIntegration: SignatureOrgIntegration;
  /**
   * Creates a reply to a text or select field.
   * @deprecated use createPetitionFieldReply instead
   */
  createSimpleReply: PetitionFieldReply;
  /** Creates a tag in the user's organization */
  createTag: Tag;
  /** Creates a new user in the specified organization. */
  createUser: SupportMethodResponse;
  /** Creates a group in the user's organization */
  createUserGroup: UserGroup;
  /** Deactivates the specified active petition accesses. */
  deactivateAccesses: Array<PetitionAccess>;
  /** Updates user status to INACTIVE, transfers their owned petitions to another user in the org or delete all petitions. */
  deactivateUser: Array<User>;
  /** Delete contacts. */
  deleteContacts: Result;
  /** Deletes event subscriptions */
  deleteEventSubscriptions: Result;
  /** Soft-deletes any given petition on the database. */
  deletePetition: SupportMethodResponse;
  /** Remove a petition attachment */
  deletePetitionAttachment: Result;
  /** Deletes a petition field. */
  deletePetitionField: PetitionBase;
  /** Remove a petition field attachment */
  deletePetitionFieldAttachment: PetitionField;
  /** Delete a petition field comment. */
  deletePetitionFieldComment: PetitionField;
  /** Deletes a reply to a petition field. */
  deletePetitionReply: PetitionField;
  /** Delete petitions. */
  deletePetitions: Result;
  /** Deletes a signature integration of the user's org. If there are pending signature requests using this integration, you must pass force argument to delete and cancel requests */
  deleteSignatureIntegration: Result;
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
  /** Get the user who owns an API Token */
  getApiTokenOwner: SupportMethodResponse;
  /** Returns a signed download url for tasks with file output */
  getTaskResultFileUrl: Scalars["String"];
  /** marks a Signature integration as default */
  markSignatureIntegrationAsDefault: OrgIntegration;
  /** Adds, edits or deletes a custom property on the petition */
  modifyPetitionCustomProperty: PetitionBase;
  /** Generates a download link for a petition attachment */
  petitionAttachmentDownloadLink: FileUploadDownloadLinkResult;
  /** Tells the backend that the petition attachment was correctly uploaded to S3 */
  petitionAttachmentUploadComplete: PetitionAttachment;
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
  /**
   * Creates a reply to a checkbox field.
   * @deprecated use publicCreatePetitionFieldReply instead
   */
  publicCreateCheckboxReply: PublicPetitionFieldReply;
  /**
   * Creates a reply for a dynamic select field.
   * @deprecated use publicCreatePetitionFieldReply instead
   */
  publicCreateDynamicSelectReply: PublicPetitionFieldReply;
  /** Creates a reply to a file upload field. */
  publicCreateFileUploadReply: PublicCreateFileUploadReply;
  /**
   * Creates a reply to a numeric field.
   * @deprecated use publicCreatePetitionFieldReply instead
   */
  publicCreateNumericReply: PublicPetitionFieldReply;
  /** Create a petition field comment. */
  publicCreatePetitionFieldComment: PublicPetitionFieldComment;
  /** Creates a reply on a petition field as recipient. */
  publicCreatePetitionFieldReply: PublicPetitionFieldReply;
  /** Starts an export pdf task in a recipient context */
  publicCreatePrintPdfTask: Task;
  /**
   * Creates a reply to a text or select field.
   * @deprecated use publicCreatePetitionFieldReply instead
   */
  publicCreateSimpleReply: PublicPetitionFieldReply;
  /** Lets a recipient delegate access to the petition to another contact in the same organization */
  publicDelegateAccessToContact: PublicPetitionAccess;
  /** Delete a petition field comment. */
  publicDeletePetitionFieldComment: PublicPetitionField;
  /** Deletes a reply to a petition field. */
  publicDeletePetitionFieldReply: PublicPetitionField;
  /** Notifies the backend that the upload is complete. */
  publicFileUploadReplyComplete: PublicPetitionFieldReply;
  /** Generates a download link for a file reply on a public context. */
  publicFileUploadReplyDownloadLink: FileUploadDownloadLinkResult;
  /** Returns a signed download url for tasks with file output on a recipient context */
  publicGetTaskResultFileUrl: Scalars["String"];
  /** Marks the specified comments as read. */
  publicMarkPetitionFieldCommentsAsRead: Array<PublicPetitionFieldComment>;
  /** Cancel a reminder for a contact. */
  publicOptOutReminders: PublicPetitionAccess;
  /** Generates a download link for a field attachment on a public context. */
  publicPetitionFieldAttachmentDownloadLink: FileUploadDownloadLinkResult;
  publicSendReminder: Result;
  publicSendVerificationCode: VerificationCodeRequest;
  /**
   * Updates a reply of checkbox field.
   * @deprecated use publicUpdatePetitionFieldReply instead
   */
  publicUpdateCheckboxReply: PublicPetitionFieldReply;
  /**
   * Updates a reply for a dynamic select field.
   * @deprecated use publicUpdatePetitionFieldReply instead
   */
  publicUpdateDynamicSelectReply: PublicPetitionFieldReply;
  /**
   * Updates a reply to a numeric field.
   * @deprecated use publicUpdatePetitionFieldReply instead
   */
  publicUpdateNumericReply: PublicPetitionFieldReply;
  /** Update a petition field comment. */
  publicUpdatePetitionFieldComment: PublicPetitionFieldComment;
  /** Creates a reply on a petition field as recipient. */
  publicUpdatePetitionFieldReply: PublicPetitionFieldReply;
  /**
   * Updates a reply to a text or select field.
   * @deprecated use publicUpdatePetitionFieldReply instead
   */
  publicUpdateSimpleReply: PublicPetitionFieldReply;
  /** Reactivates the specified inactive petition accesses. */
  reactivateAccesses: Array<PetitionAccess>;
  /** Removes permissions on given petitions and users */
  removePetitionPermission: Array<PetitionBase>;
  /** Removes users from a user group */
  removeUsersFromGroup: UserGroup;
  /** Reopens the petition */
  reopenPetition: Petition;
  /** Sends the AccountVerification email with confirmation code to unconfirmed user emails */
  resendVerificationCode: Result;
  /** Removes the Signaturit Branding Ids of selected organization. */
  resetSignaturitOrganizationBranding: SupportMethodResponse;
  /** Resets the user password and resend the Invitation email. Only works if cognito user has status FORCE_CHANGE_PASSWORD */
  resetTemporaryPassword: Result;
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
  /** Sends a reminder email to the pending signers */
  sendSignatureRequestReminders: Result;
  /** Sets the locale passed as arg as the preferred language of the user to see the page */
  setUserPreferredLocale: User;
  /** Shares our SignaturIt production APIKEY with the passed Org, and creates corresponding usage limits. */
  shareSignaturitApiKey: SupportMethodResponse;
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
  transferPetitionOwnership: Array<PetitionBase>;
  /** Removes the given tag from the given petition */
  untagPetition: PetitionBase;
  /**
   * Updates a reply of a checkbox field
   * @deprecated use updatePetitionFieldReply instead
   */
  updateCheckboxReply: PetitionFieldReply;
  /** Updates a contact. */
  updateContact: Contact;
  /**
   * Updates a reply for a dynamic select field.
   * @deprecated use updatePetitionFieldReply instead
   */
  updateDynamicSelectReply: PetitionFieldReply;
  /** Updates an existing event subscription for the user's petitions */
  updateEventSubscription: PetitionEventSubscription;
  /** Activate or deactivate an organization feature flag */
  updateFeatureFlag: SupportMethodResponse;
  /** Updates the positions of the petition fields */
  updateFieldPositions: PetitionBase;
  /** Updates the file of a FILE_UPLOAD reply. The previous file will be deleted from AWS S3 when client notifies of upload completed via updateFileUploadReplyComplete mutation. */
  updateFileUploadReply: FileUploadReplyResponse;
  /** Notifies the backend that the new file was successfully uploaded to S3. Marks the file upload as completed and deletes the old file. */
  updateFileUploadReplyComplete: PetitionFieldReply;
  /** Updates the metadata of a public landing template. */
  updateLandingTemplateMetadata: SupportMethodResponse;
  /**
   * Updates a reply to a numeric field.
   * @deprecated use updatePetitionFieldReply instead
   */
  updateNumericReply: PetitionFieldReply;
  /** Updates the onboarding status for one of the pages. */
  updateOnboardingStatus: User;
  /** Updates the logo of an organization */
  updateOrganizationLogo: Organization;
  /** Changes the organization preferred tone */
  updateOrganizationPreferredTone: Organization;
  /** Updates the role of another user in the organization. */
  updateOrganizationUser: User;
  /** Updates the user limit for a organization */
  updateOrganizationUserLimit: SupportMethodResponse;
  /** Updates a petition. */
  updatePetition: PetitionBase;
  /** Updates a petition field. */
  updatePetitionField: PetitionField;
  /** Update a petition field comment. */
  updatePetitionFieldComment: PetitionFieldComment;
  /** Updates the status of a petition field reply. */
  updatePetitionFieldRepliesStatus: PetitionField;
  /** Updates a reply on a petition field */
  updatePetitionFieldReply: PetitionFieldReply;
  /** Updates the metadata of the specified petition field reply */
  updatePetitionFieldReplyMetadata: PetitionFieldReply;
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
  /** Updates the info and permissions of a public link */
  updatePublicPetitionLink: PublicPetitionLink;
  /** Updates template_public from template */
  updatePublicTemplateVisibility: SupportMethodResponse;
  updateSignatureRequestMetadata: PetitionSignatureRequest;
  /**
   * Updates a reply to a text or select field.
   * @deprecated use updatePetitionFieldReply instead
   */
  updateSimpleReply: PetitionFieldReply;
  /** Updates the name and color of a given tag */
  updateTag: Tag;
  /** Updates the template default permissions */
  updateTemplateDefaultPermissions: PetitionTemplate;
  /** Updates the user with the provided data. */
  updateUser: User;
  /** Updates the name of a given user group */
  updateUserGroup: UserGroup;
  /** Uploads the xlsx file used to parse the options of a dynamic select field, and sets the field options */
  uploadDynamicSelectFieldFile: PetitionField;
  /** Uploads a user avatar image */
  uploadUserAvatar: SupportMethodResponse;
  /** Triggered by new users that want to sign up into Parallel */
  userSignUp: User;
  verifyPublicAccess: PublicAccessVerification;
}

export interface MutationactivateUserArgs {
  userIds: Array<Scalars["GID"]>;
}

export interface MutationaddPetitionPermissionArgs {
  message?: InputMaybe<Scalars["String"]>;
  notify?: InputMaybe<Scalars["Boolean"]>;
  permissionType: PetitionPermissionTypeRW;
  petitionIds: Array<Scalars["GID"]>;
  subscribe?: InputMaybe<Scalars["Boolean"]>;
  userGroupIds?: InputMaybe<Array<Scalars["GID"]>>;
  userIds?: InputMaybe<Array<Scalars["GID"]>>;
}

export interface MutationaddUsersToUserGroupArgs {
  userGroupId: Scalars["GID"];
  userIds: Array<Scalars["GID"]>;
}

export interface MutationapproveOrRejectPetitionFieldRepliesArgs {
  petitionId: Scalars["GID"];
  status: PetitionFieldReplyStatus;
}

export interface MutationassignPetitionToUserArgs {
  petitionId: Scalars["ID"];
  userId: Scalars["Int"];
}

export interface MutationbulkCreateContactsArgs {
  file: Scalars["Upload"];
}

export interface MutationbulkSendPetitionArgs {
  body: Scalars["JSON"];
  bulkSendSigningMode?: InputMaybe<BulkSendSigningMode>;
  contactIdGroups: Array<Array<Scalars["GID"]>>;
  petitionId: Scalars["GID"];
  remindersConfig?: InputMaybe<RemindersConfigInput>;
  scheduledAt?: InputMaybe<Scalars["DateTime"]>;
  subject: Scalars["String"];
}

export interface MutationcancelScheduledMessageArgs {
  messageId: Scalars["GID"];
  petitionId: Scalars["GID"];
}

export interface MutationcancelSignatureRequestArgs {
  petitionSignatureRequestId: Scalars["GID"];
}

export interface MutationchangePasswordArgs {
  newPassword: Scalars["String"];
  password: Scalars["String"];
}

export interface MutationchangePetitionFieldTypeArgs {
  fieldId: Scalars["GID"];
  force?: InputMaybe<Scalars["Boolean"]>;
  petitionId: Scalars["GID"];
  type: PetitionFieldType;
}

export interface MutationclonePetitionFieldArgs {
  fieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
}

export interface MutationclonePetitionsArgs {
  petitionIds: Array<Scalars["GID"]>;
}

export interface MutationcloneUserGroupArgs {
  locale?: InputMaybe<Scalars["String"]>;
  userGroupIds: Array<Scalars["GID"]>;
}

export interface MutationclosePetitionArgs {
  petitionId: Scalars["GID"];
}

export interface MutationcompletePetitionArgs {
  additionalSigners?: InputMaybe<Array<PublicPetitionSignerDataInput>>;
  message?: InputMaybe<Scalars["String"]>;
  petitionId: Scalars["GID"];
}

export interface MutationcreateCheckboxReplyArgs {
  fieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
  values: Array<Scalars["String"]>;
}

export interface MutationcreateContactArgs {
  data: CreateContactInput;
}

export interface MutationcreateDynamicSelectReplyArgs {
  fieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
  value: Array<Array<InputMaybe<Scalars["String"]>>>;
}

export interface MutationcreateEventSubscriptionArgs {
  eventTypes?: InputMaybe<Array<PetitionEventType>>;
  eventsUrl: Scalars["String"];
  name?: InputMaybe<Scalars["String"]>;
}

export interface MutationcreateExportRepliesTaskArgs {
  pattern?: InputMaybe<Scalars["String"]>;
  petitionId: Scalars["GID"];
}

export interface MutationcreateFileUploadReplyArgs {
  fieldId: Scalars["GID"];
  file: FileUploadInput;
  petitionId: Scalars["GID"];
}

export interface MutationcreateFileUploadReplyCompleteArgs {
  petitionId: Scalars["GID"];
  replyId: Scalars["GID"];
}

export interface MutationcreateNumericReplyArgs {
  fieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
  reply: Scalars["Float"];
}

export interface MutationcreateOrganizationArgs {
  email: Scalars["String"];
  firstName: Scalars["String"];
  lastName: Scalars["String"];
  locale: PetitionLocale;
  name: Scalars["String"];
  password: Scalars["String"];
  status: OrganizationStatus;
}

export interface MutationcreateOrganizationUserArgs {
  email: Scalars["String"];
  firstName: Scalars["String"];
  lastName: Scalars["String"];
  locale?: InputMaybe<Scalars["String"]>;
  role: OrganizationRole;
  userGroupIds?: InputMaybe<Array<Scalars["GID"]>>;
}

export interface MutationcreatePetitionArgs {
  locale?: InputMaybe<PetitionLocale>;
  name?: InputMaybe<Scalars["String"]>;
  petitionId?: InputMaybe<Scalars["GID"]>;
  type?: InputMaybe<PetitionBaseType>;
}

export interface MutationcreatePetitionAttachmentUploadLinkArgs {
  data: FileUploadInput;
  petitionId: Scalars["GID"];
}

export interface MutationcreatePetitionFieldArgs {
  petitionId: Scalars["GID"];
  position?: InputMaybe<Scalars["Int"]>;
  type: PetitionFieldType;
}

export interface MutationcreatePetitionFieldAttachmentUploadLinkArgs {
  data: FileUploadInput;
  fieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
}

export interface MutationcreatePetitionFieldCommentArgs {
  content: Scalars["String"];
  isInternal?: InputMaybe<Scalars["Boolean"]>;
  petitionFieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
}

export interface MutationcreatePetitionFieldReplyArgs {
  fieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
  reply: Scalars["JSON"];
}

export interface MutationcreatePrintPdfTaskArgs {
  petitionId: Scalars["GID"];
}

export interface MutationcreatePublicPetitionLinkArgs {
  description: Scalars["String"];
  slug?: InputMaybe<Scalars["String"]>;
  templateId: Scalars["GID"];
  title: Scalars["String"];
}

export interface MutationcreateSignatureIntegrationArgs {
  apiKey: Scalars["String"];
  isDefault?: InputMaybe<Scalars["Boolean"]>;
  name: Scalars["String"];
  provider: SignatureOrgIntegrationProvider;
}

export interface MutationcreateSimpleReplyArgs {
  fieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
  reply: Scalars["String"];
}

export interface MutationcreateTagArgs {
  color: Scalars["String"];
  name: Scalars["String"];
}

export interface MutationcreateUserArgs {
  email: Scalars["String"];
  firstName: Scalars["String"];
  lastName: Scalars["String"];
  locale: PetitionLocale;
  organizationId: Scalars["Int"];
  password: Scalars["String"];
  role: OrganizationRole;
}

export interface MutationcreateUserGroupArgs {
  name: Scalars["String"];
  userIds: Array<Scalars["GID"]>;
}

export interface MutationdeactivateAccessesArgs {
  accessIds: Array<Scalars["GID"]>;
  petitionId: Scalars["GID"];
}

export interface MutationdeactivateUserArgs {
  deletePetitions?: InputMaybe<Scalars["Boolean"]>;
  transferToUserId?: InputMaybe<Scalars["GID"]>;
  userIds: Array<Scalars["GID"]>;
}

export interface MutationdeleteContactsArgs {
  force?: InputMaybe<Scalars["Boolean"]>;
  ids: Array<Scalars["GID"]>;
}

export interface MutationdeleteEventSubscriptionsArgs {
  ids: Array<Scalars["GID"]>;
}

export interface MutationdeletePetitionArgs {
  petitionId: Scalars["ID"];
}

export interface MutationdeletePetitionAttachmentArgs {
  attachmentId: Scalars["GID"];
  petitionId: Scalars["GID"];
}

export interface MutationdeletePetitionFieldArgs {
  fieldId: Scalars["GID"];
  force?: InputMaybe<Scalars["Boolean"]>;
  petitionId: Scalars["GID"];
}

export interface MutationdeletePetitionFieldAttachmentArgs {
  attachmentId: Scalars["GID"];
  fieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
}

export interface MutationdeletePetitionFieldCommentArgs {
  petitionFieldCommentId: Scalars["GID"];
  petitionFieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
}

export interface MutationdeletePetitionReplyArgs {
  petitionId: Scalars["GID"];
  replyId: Scalars["GID"];
}

export interface MutationdeletePetitionsArgs {
  force?: InputMaybe<Scalars["Boolean"]>;
  ids: Array<Scalars["GID"]>;
}

export interface MutationdeleteSignatureIntegrationArgs {
  force?: InputMaybe<Scalars["Boolean"]>;
  id: Scalars["GID"];
}

export interface MutationdeleteTagArgs {
  id: Scalars["GID"];
}

export interface MutationdeleteUserGroupArgs {
  ids: Array<Scalars["GID"]>;
}

export interface MutationdynamicSelectFieldFileDownloadLinkArgs {
  fieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
}

export interface MutationeditPetitionPermissionArgs {
  permissionType: PetitionPermissionType;
  petitionIds: Array<Scalars["GID"]>;
  userGroupIds?: InputMaybe<Array<Scalars["GID"]>>;
  userIds?: InputMaybe<Array<Scalars["GID"]>>;
}

export interface MutationfileUploadReplyDownloadLinkArgs {
  petitionId: Scalars["GID"];
  preview?: InputMaybe<Scalars["Boolean"]>;
  replyId: Scalars["GID"];
}

export interface MutationgenerateUserAuthTokenArgs {
  tokenName: Scalars["String"];
}

export interface MutationgetApiTokenOwnerArgs {
  token: Scalars["String"];
}

export interface MutationgetTaskResultFileUrlArgs {
  preview?: InputMaybe<Scalars["Boolean"]>;
  taskId: Scalars["GID"];
}

export interface MutationmarkSignatureIntegrationAsDefaultArgs {
  id: Scalars["GID"];
}

export interface MutationmodifyPetitionCustomPropertyArgs {
  key: Scalars["String"];
  petitionId: Scalars["GID"];
  value?: InputMaybe<Scalars["String"]>;
}

export interface MutationpetitionAttachmentDownloadLinkArgs {
  attachmentId: Scalars["GID"];
  petitionId: Scalars["GID"];
}

export interface MutationpetitionAttachmentUploadCompleteArgs {
  attachmentId: Scalars["GID"];
  petitionId: Scalars["GID"];
}

export interface MutationpetitionFieldAttachmentDownloadLinkArgs {
  attachmentId: Scalars["GID"];
  fieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
}

export interface MutationpetitionFieldAttachmentUploadCompleteArgs {
  attachmentId: Scalars["GID"];
  fieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
}

export interface MutationpublicCheckVerificationCodeArgs {
  code: Scalars["String"];
  keycode: Scalars["ID"];
  token: Scalars["ID"];
}

export interface MutationpublicCompletePetitionArgs {
  additionalSigners?: InputMaybe<Array<PublicPetitionSignerDataInput>>;
  keycode: Scalars["ID"];
  message?: InputMaybe<Scalars["String"]>;
}

export interface MutationpublicCreateAndSendPetitionFromPublicLinkArgs {
  contactEmail: Scalars["String"];
  contactFirstName: Scalars["String"];
  contactLastName: Scalars["String"];
  force?: InputMaybe<Scalars["Boolean"]>;
  slug: Scalars["ID"];
}

export interface MutationpublicCreateCheckboxReplyArgs {
  fieldId: Scalars["GID"];
  keycode: Scalars["ID"];
  values: Array<Scalars["String"]>;
}

export interface MutationpublicCreateDynamicSelectReplyArgs {
  fieldId: Scalars["GID"];
  keycode: Scalars["ID"];
  value: Array<Array<InputMaybe<Scalars["String"]>>>;
}

export interface MutationpublicCreateFileUploadReplyArgs {
  data: FileUploadInput;
  fieldId: Scalars["GID"];
  keycode: Scalars["ID"];
}

export interface MutationpublicCreateNumericReplyArgs {
  fieldId: Scalars["GID"];
  keycode: Scalars["ID"];
  value: Scalars["Float"];
}

export interface MutationpublicCreatePetitionFieldCommentArgs {
  content: Scalars["String"];
  keycode: Scalars["ID"];
  petitionFieldId: Scalars["GID"];
}

export interface MutationpublicCreatePetitionFieldReplyArgs {
  fieldId: Scalars["GID"];
  keycode: Scalars["ID"];
  reply: Scalars["JSON"];
}

export interface MutationpublicCreatePrintPdfTaskArgs {
  keycode: Scalars["ID"];
}

export interface MutationpublicCreateSimpleReplyArgs {
  fieldId: Scalars["GID"];
  keycode: Scalars["ID"];
  value: Scalars["String"];
}

export interface MutationpublicDelegateAccessToContactArgs {
  email: Scalars["String"];
  firstName: Scalars["String"];
  keycode: Scalars["ID"];
  lastName: Scalars["String"];
  messageBody: Scalars["JSON"];
}

export interface MutationpublicDeletePetitionFieldCommentArgs {
  keycode: Scalars["ID"];
  petitionFieldCommentId: Scalars["GID"];
  petitionFieldId: Scalars["GID"];
}

export interface MutationpublicDeletePetitionFieldReplyArgs {
  keycode: Scalars["ID"];
  replyId: Scalars["GID"];
}

export interface MutationpublicFileUploadReplyCompleteArgs {
  keycode: Scalars["ID"];
  replyId: Scalars["GID"];
}

export interface MutationpublicFileUploadReplyDownloadLinkArgs {
  keycode: Scalars["ID"];
  preview?: InputMaybe<Scalars["Boolean"]>;
  replyId: Scalars["GID"];
}

export interface MutationpublicGetTaskResultFileUrlArgs {
  keycode: Scalars["ID"];
  taskId: Scalars["GID"];
}

export interface MutationpublicMarkPetitionFieldCommentsAsReadArgs {
  keycode: Scalars["ID"];
  petitionFieldCommentIds: Array<Scalars["GID"]>;
}

export interface MutationpublicOptOutRemindersArgs {
  keycode: Scalars["ID"];
  other: Scalars["String"];
  reason: Scalars["String"];
  referer?: InputMaybe<Scalars["String"]>;
}

export interface MutationpublicPetitionFieldAttachmentDownloadLinkArgs {
  attachmentId: Scalars["GID"];
  fieldId: Scalars["GID"];
  keycode: Scalars["ID"];
  preview?: InputMaybe<Scalars["Boolean"]>;
}

export interface MutationpublicSendReminderArgs {
  contactEmail: Scalars["String"];
  slug: Scalars["ID"];
}

export interface MutationpublicSendVerificationCodeArgs {
  keycode: Scalars["ID"];
}

export interface MutationpublicUpdateCheckboxReplyArgs {
  keycode: Scalars["ID"];
  replyId: Scalars["GID"];
  values: Array<Scalars["String"]>;
}

export interface MutationpublicUpdateDynamicSelectReplyArgs {
  keycode: Scalars["ID"];
  replyId: Scalars["GID"];
  value: Array<Array<InputMaybe<Scalars["String"]>>>;
}

export interface MutationpublicUpdateNumericReplyArgs {
  keycode: Scalars["ID"];
  replyId: Scalars["GID"];
  value: Scalars["Float"];
}

export interface MutationpublicUpdatePetitionFieldCommentArgs {
  content: Scalars["String"];
  keycode: Scalars["ID"];
  petitionFieldCommentId: Scalars["GID"];
  petitionFieldId: Scalars["GID"];
}

export interface MutationpublicUpdatePetitionFieldReplyArgs {
  keycode: Scalars["ID"];
  reply: Scalars["JSON"];
  replyId: Scalars["GID"];
}

export interface MutationpublicUpdateSimpleReplyArgs {
  keycode: Scalars["ID"];
  replyId: Scalars["GID"];
  value: Scalars["String"];
}

export interface MutationreactivateAccessesArgs {
  accessIds: Array<Scalars["GID"]>;
  petitionId: Scalars["GID"];
}

export interface MutationremovePetitionPermissionArgs {
  petitionIds: Array<Scalars["GID"]>;
  removeAll?: InputMaybe<Scalars["Boolean"]>;
  userGroupIds?: InputMaybe<Array<Scalars["GID"]>>;
  userIds?: InputMaybe<Array<Scalars["GID"]>>;
}

export interface MutationremoveUsersFromGroupArgs {
  userGroupId: Scalars["GID"];
  userIds: Array<Scalars["GID"]>;
}

export interface MutationreopenPetitionArgs {
  petitionId: Scalars["GID"];
}

export interface MutationresendVerificationCodeArgs {
  email: Scalars["String"];
  locale?: InputMaybe<Scalars["String"]>;
}

export interface MutationresetSignaturitOrganizationBrandingArgs {
  orgId: Scalars["Int"];
}

export interface MutationresetTemporaryPasswordArgs {
  email: Scalars["String"];
  locale?: InputMaybe<Scalars["String"]>;
}

export interface MutationresetUserPasswordArgs {
  email: Scalars["String"];
  locale: PetitionLocale;
}

export interface MutationrevokeUserAuthTokenArgs {
  authTokenIds: Array<Scalars["GID"]>;
}

export interface MutationsendPetitionArgs {
  body?: InputMaybe<Scalars["JSON"]>;
  contactIds: Array<Scalars["GID"]>;
  petitionId: Scalars["GID"];
  remindersConfig?: InputMaybe<RemindersConfigInput>;
  scheduledAt?: InputMaybe<Scalars["DateTime"]>;
  subject?: InputMaybe<Scalars["String"]>;
}

export interface MutationsendPetitionClosedNotificationArgs {
  attachPdfExport: Scalars["Boolean"];
  emailBody: Scalars["JSON"];
  force?: InputMaybe<Scalars["Boolean"]>;
  pdfExportTitle?: InputMaybe<Scalars["String"]>;
  petitionId: Scalars["GID"];
}

export interface MutationsendRemindersArgs {
  accessIds: Array<Scalars["GID"]>;
  body?: InputMaybe<Scalars["JSON"]>;
  petitionId: Scalars["GID"];
}

export interface MutationsendSignatureRequestRemindersArgs {
  petitionSignatureRequestId: Scalars["GID"];
}

export interface MutationsetUserPreferredLocaleArgs {
  locale: Scalars["String"];
}

export interface MutationshareSignaturitApiKeyArgs {
  limit: Scalars["Int"];
  orgId: Scalars["Int"];
  period: Scalars["String"];
}

export interface MutationsignedPetitionDownloadLinkArgs {
  downloadAuditTrail?: InputMaybe<Scalars["Boolean"]>;
  petitionSignatureRequestId: Scalars["GID"];
  preview?: InputMaybe<Scalars["Boolean"]>;
}

export interface MutationstartSignatureRequestArgs {
  message?: InputMaybe<Scalars["String"]>;
  petitionId: Scalars["GID"];
}

export interface MutationswitchAutomaticRemindersArgs {
  accessIds: Array<Scalars["GID"]>;
  petitionId: Scalars["GID"];
  remindersConfig?: InputMaybe<RemindersConfigInput>;
  start: Scalars["Boolean"];
}

export interface MutationtagPetitionArgs {
  petitionId: Scalars["GID"];
  tagId: Scalars["GID"];
}

export interface MutationtransferOrganizationOwnershipArgs {
  organizationId: Scalars["Int"];
  userId: Scalars["Int"];
}

export interface MutationtransferPetitionOwnershipArgs {
  petitionIds: Array<Scalars["GID"]>;
  userId: Scalars["GID"];
}

export interface MutationuntagPetitionArgs {
  petitionId: Scalars["GID"];
  tagId: Scalars["GID"];
}

export interface MutationupdateCheckboxReplyArgs {
  petitionId: Scalars["GID"];
  replyId: Scalars["GID"];
  values: Array<Scalars["String"]>;
}

export interface MutationupdateContactArgs {
  data: UpdateContactInput;
  id: Scalars["GID"];
}

export interface MutationupdateDynamicSelectReplyArgs {
  petitionId: Scalars["GID"];
  replyId: Scalars["GID"];
  value: Array<Array<InputMaybe<Scalars["String"]>>>;
}

export interface MutationupdateEventSubscriptionArgs {
  data: UpdateEventSubscriptionInput;
  id: Scalars["GID"];
}

export interface MutationupdateFeatureFlagArgs {
  featureFlag: FeatureFlag;
  orgId: Scalars["Int"];
  value: Scalars["Boolean"];
}

export interface MutationupdateFieldPositionsArgs {
  fieldIds: Array<Scalars["GID"]>;
  petitionId: Scalars["GID"];
}

export interface MutationupdateFileUploadReplyArgs {
  file: FileUploadInput;
  petitionId: Scalars["GID"];
  replyId: Scalars["GID"];
}

export interface MutationupdateFileUploadReplyCompleteArgs {
  petitionId: Scalars["GID"];
  replyId: Scalars["GID"];
}

export interface MutationupdateLandingTemplateMetadataArgs {
  backgroundColor?: InputMaybe<Scalars["String"]>;
  categories?: InputMaybe<Scalars["String"]>;
  description?: InputMaybe<Scalars["String"]>;
  image?: InputMaybe<Scalars["Upload"]>;
  slug?: InputMaybe<Scalars["String"]>;
  templateId: Scalars["ID"];
}

export interface MutationupdateNumericReplyArgs {
  petitionId: Scalars["GID"];
  reply: Scalars["Float"];
  replyId: Scalars["GID"];
}

export interface MutationupdateOnboardingStatusArgs {
  key: OnboardingKey;
  status: OnboardingStatus;
}

export interface MutationupdateOrganizationLogoArgs {
  file: Scalars["Upload"];
}

export interface MutationupdateOrganizationPreferredToneArgs {
  tone: Tone;
}

export interface MutationupdateOrganizationUserArgs {
  role: OrganizationRole;
  userGroupIds?: InputMaybe<Array<Scalars["GID"]>>;
  userId: Scalars["GID"];
}

export interface MutationupdateOrganizationUserLimitArgs {
  limit: Scalars["Int"];
  orgId: Scalars["Int"];
}

export interface MutationupdatePetitionArgs {
  data: UpdatePetitionInput;
  petitionId: Scalars["GID"];
}

export interface MutationupdatePetitionFieldArgs {
  data: UpdatePetitionFieldInput;
  fieldId: Scalars["GID"];
  force?: InputMaybe<Scalars["Boolean"]>;
  petitionId: Scalars["GID"];
}

export interface MutationupdatePetitionFieldCommentArgs {
  content: Scalars["String"];
  petitionFieldCommentId: Scalars["GID"];
  petitionFieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
}

export interface MutationupdatePetitionFieldRepliesStatusArgs {
  petitionFieldId: Scalars["GID"];
  petitionFieldReplyIds: Array<Scalars["GID"]>;
  petitionId: Scalars["GID"];
  status: PetitionFieldReplyStatus;
}

export interface MutationupdatePetitionFieldReplyArgs {
  petitionId: Scalars["GID"];
  reply: Scalars["JSON"];
  replyId: Scalars["GID"];
}

export interface MutationupdatePetitionFieldReplyMetadataArgs {
  metadata: Scalars["JSONObject"];
  petitionId: Scalars["GID"];
  replyId: Scalars["GID"];
}

export interface MutationupdatePetitionPermissionSubscriptionArgs {
  isSubscribed: Scalars["Boolean"];
  petitionId: Scalars["GID"];
}

export interface MutationupdatePetitionRestrictionArgs {
  isRestricted: Scalars["Boolean"];
  password?: InputMaybe<Scalars["String"]>;
  petitionId: Scalars["GID"];
}

export interface MutationupdatePetitionUserNotificationReadStatusArgs {
  filter?: InputMaybe<PetitionUserNotificationFilter>;
  isRead: Scalars["Boolean"];
  petitionFieldCommentIds?: InputMaybe<Array<Scalars["GID"]>>;
  petitionIds?: InputMaybe<Array<Scalars["GID"]>>;
  petitionUserNotificationIds?: InputMaybe<Array<Scalars["GID"]>>;
}

export interface MutationupdatePublicPetitionLinkArgs {
  description?: InputMaybe<Scalars["String"]>;
  isActive?: InputMaybe<Scalars["Boolean"]>;
  publicPetitionLinkId: Scalars["GID"];
  slug?: InputMaybe<Scalars["String"]>;
  title?: InputMaybe<Scalars["String"]>;
}

export interface MutationupdatePublicTemplateVisibilityArgs {
  isPublic: Scalars["Boolean"];
  templateId: Scalars["GID"];
}

export interface MutationupdateSignatureRequestMetadataArgs {
  metadata: Scalars["JSONObject"];
  petitionSignatureRequestId: Scalars["GID"];
}

export interface MutationupdateSimpleReplyArgs {
  petitionId: Scalars["GID"];
  reply: Scalars["String"];
  replyId: Scalars["GID"];
}

export interface MutationupdateTagArgs {
  data: UpdateTagInput;
  id: Scalars["GID"];
}

export interface MutationupdateTemplateDefaultPermissionsArgs {
  permissions: Array<UserOrUserGroupPermissionInput>;
  templateId: Scalars["GID"];
}

export interface MutationupdateUserArgs {
  data: UpdateUserInput;
  id: Scalars["GID"];
}

export interface MutationupdateUserGroupArgs {
  data: UpdateUserGroupInput;
  id: Scalars["GID"];
}

export interface MutationuploadDynamicSelectFieldFileArgs {
  fieldId: Scalars["GID"];
  file: Scalars["Upload"];
  petitionId: Scalars["GID"];
}

export interface MutationuploadUserAvatarArgs {
  image: Scalars["Upload"];
  userId: Scalars["Int"];
}

export interface MutationuserSignUpArgs {
  captcha: Scalars["String"];
  email: Scalars["String"];
  firstName: Scalars["String"];
  industry?: InputMaybe<Scalars["String"]>;
  lastName: Scalars["String"];
  locale?: InputMaybe<Scalars["String"]>;
  organizationLogo?: InputMaybe<Scalars["Upload"]>;
  organizationName: Scalars["String"];
  password: Scalars["String"];
  position?: InputMaybe<Scalars["String"]>;
  role?: InputMaybe<Scalars["String"]>;
}

export interface MutationverifyPublicAccessArgs {
  ip?: InputMaybe<Scalars["String"]>;
  keycode: Scalars["ID"];
  token: Scalars["ID"];
  userAgent?: InputMaybe<Scalars["String"]>;
}

export type OnboardingKey =
  | "CONTACT_DETAILS"
  | "CONTACT_LIST"
  | "PETITIONS_LIST"
  | "PETITION_ACTIVITY"
  | "PETITION_COMPOSE"
  | "PETITION_REVIEW";

export type OnboardingStatus = "FINISHED" | "SKIPPED";

export interface OrgIntegration {
  id: Scalars["GID"];
  /** Wether this integration is the default to be used if the user has more than one of the same type */
  isDefault: Scalars["Boolean"];
  /** Custom name of this integration, provided by the user */
  name: Scalars["String"];
  /** The type of the integration. */
  type: IntegrationType;
}

export interface OrgIntegrationPagination {
  __typename?: "OrgIntegrationPagination";
  /** The requested slice of items. */
  items: Array<OrgIntegration>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
}

/** An organization in the system. */
export interface Organization extends Timestamps {
  __typename?: "Organization";
  /** @deprecated Temporal solution for support methods, don't use */
  _id: Scalars["Int"];
  /** The total number of active users */
  activeUserCount: Scalars["Int"];
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** Custom host used in petition links and public links. */
  customHost?: Maybe<Scalars["String"]>;
  /** Whether the organization has an SSO provider configured. */
  hasSsoProvider: Scalars["Boolean"];
  /** The ID of the organization. */
  id: Scalars["GID"];
  /** A paginated list with enabled integrations for the organization */
  integrations: OrgIntegrationPagination;
  /** URL of the organization logo */
  logoUrl?: Maybe<Scalars["String"]>;
  /** The name of the organization. */
  name: Scalars["String"];
  /** The preferred tone of organization. */
  preferredTone: Tone;
  /** The status of the organization. */
  status: OrganizationStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
  usageLimits: OrganizationUsageLimit;
  /** The users in the organization. */
  users: UserPagination;
}

/** An organization in the system. */
export interface OrganizationintegrationsArgs {
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  type?: InputMaybe<IntegrationType>;
}

/** An organization in the system. */
export interface OrganizationusersArgs {
  exclude?: InputMaybe<Array<Scalars["GID"]>>;
  includeInactive?: InputMaybe<Scalars["Boolean"]>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  search?: InputMaybe<Scalars["String"]>;
  sortBy?: InputMaybe<Array<OrganizationUsers_OrderBy>>;
}

export interface OrganizationPagination {
  __typename?: "OrganizationPagination";
  /** The requested slice of items. */
  items: Array<Organization>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
}

/** The roles of a user within an organization. */
export type OrganizationRole = "ADMIN" | "COLLABORATOR" | "NORMAL" | "OWNER";

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
  /** Root client */
  | "ROOT";

export interface OrganizationUsageLimit {
  __typename?: "OrganizationUsageLimit";
  petitions: OrganizationUsagePetitionLimit;
  signatures: OrganizationUsageSignaturesLimit;
  users: OrganizationUsageUserLimit;
}

export interface OrganizationUsagePetitionLimit {
  __typename?: "OrganizationUsagePetitionLimit";
  limit: Scalars["Int"];
  used: Scalars["Int"];
}

export interface OrganizationUsageSignaturesLimit {
  __typename?: "OrganizationUsageSignaturesLimit";
  limit: Scalars["Int"];
  used: Scalars["Int"];
}

export interface OrganizationUsageUserLimit {
  __typename?: "OrganizationUsageUserLimit";
  limit: Scalars["Int"];
}

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

export interface OwnershipTransferredEvent extends PetitionEvent {
  __typename?: "OwnershipTransferredEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  owner?: Maybe<User>;
  previousOwner?: Maybe<User>;
  type: PetitionEventType;
  user?: Maybe<User>;
}

/** A petition */
export interface Petition extends PetitionBase {
  __typename?: "Petition";
  /** The accesses for this petition */
  accesses: Array<PetitionAccess>;
  /** The attachments linked to this petition */
  attachments: Array<PetitionAttachment>;
  /** The closing email body of the petition. */
  closingEmailBody?: Maybe<Scalars["JSON"]>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The current signature request. */
  currentSignatureRequest?: Maybe<PetitionSignatureRequest>;
  /** Custom user properties */
  customProperties: Scalars["JSONObject"];
  /** The deadline of the petition. */
  deadline?: Maybe<Scalars["DateTime"]>;
  /** The body of the petition. */
  emailBody?: Maybe<Scalars["JSON"]>;
  /** The subject of the petition. */
  emailSubject?: Maybe<Scalars["String"]>;
  /** The events for the petition. */
  events: PetitionEventPagination;
  /** The number of fields in the petition. */
  fieldCount: Scalars["Int"];
  /** The definition of the petition fields. */
  fields: Array<PetitionField>;
  /** The template GID used for this petition */
  fromTemplateId?: Maybe<Scalars["GID"]>;
  /** The ID of the petition or template. */
  id: Scalars["GID"];
  /**
   * Whether the contents card is hidden in the recipient view.
   * @deprecated Don't use this
   */
  isRecipientViewContentsHidden: Scalars["Boolean"];
  isRestricted: Scalars["Boolean"];
  isRestrictedWithPassword: Scalars["Boolean"];
  /** The locale of the petition. */
  locale: PetitionLocale;
  /** The effective permission of the logged user. Will return Null if the user doesn't have access to the petition (e.g. on public templates). */
  myEffectivePermission?: Maybe<EffectivePetitionUserPermission>;
  /** The name of the petition. */
  name?: Maybe<Scalars["String"]>;
  organization: Organization;
  owner: User;
  /** The permissions linked to the petition */
  permissions: Array<PetitionPermission>;
  /** The progress of the petition. */
  progress: PetitionProgress;
  /** The reminders configuration for the petition. */
  remindersConfig?: Maybe<RemindersConfig>;
  /** Date when the petition was first sent */
  sentAt?: Maybe<Scalars["DateTime"]>;
  /** The signature configuration for the petition. */
  signatureConfig?: Maybe<SignatureConfig>;
  /** The list of signature requests. */
  signatureRequests: Array<PetitionSignatureRequest>;
  /** Whether to skip the forward security check on the recipient view. */
  skipForwardSecurity: Scalars["Boolean"];
  /** The status of the petition. */
  status: PetitionStatus;
  /** The tags linked to the petition */
  tags: Array<Tag>;
  /** The preferred tone of organization. */
  tone: Tone;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
}

/** A petition */
export interface PetitioneventsArgs {
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
}

/** A petition access */
export interface PetitionAccess extends Timestamps {
  __typename?: "PetitionAccess";
  /** The contact of this access. */
  contact?: Maybe<Contact>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The user who granted the original access. */
  granter?: Maybe<User>;
  /** The ID of the petition access. */
  id: Scalars["GID"];
  /** When the next reminder will be sent. */
  nextReminderAt?: Maybe<Scalars["DateTime"]>;
  /** The petition for this message access. */
  petition?: Maybe<Petition>;
  /** Number of reminders sent. */
  reminderCount: Scalars["Int"];
  reminders: Array<PetitionReminder>;
  /** Whether automatic reminders are active or not for this petition access */
  remindersActive: Scalars["Boolean"];
  /** The reminder settings of the petition. */
  remindersConfig?: Maybe<RemindersConfig>;
  /** Number of reminders left. */
  remindersLeft: Scalars["Int"];
  /** Whether contact has opted out from receiving reminders for this petition */
  remindersOptOut: Scalars["Boolean"];
  /** The status of the petition access */
  status: PetitionAccessStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
}

export interface PetitionAccessPagination {
  __typename?: "PetitionAccessPagination";
  /** The requested slice of items. */
  items: Array<PetitionAccess>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
}

/** The status of a petition access. */
export type PetitionAccessStatus =
  /** The petition is accessible by the contact. */
  | "ACTIVE"
  /** The petition is not accessible by the contact. */
  | "INACTIVE";

export interface PetitionAttachment extends CreatedAt {
  __typename?: "PetitionAttachment";
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  file: FileUpload;
  id: Scalars["GID"];
}

export interface PetitionAttachmentUploadData {
  __typename?: "PetitionAttachmentUploadData";
  attachment: PetitionAttachment;
  presignedPostData: AWSPresignedPostData;
}

export interface PetitionBase {
  /** The attachments linked to this petition */
  attachments: Array<PetitionAttachment>;
  /** The closing email body of the petition. */
  closingEmailBody?: Maybe<Scalars["JSON"]>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** Custom user properties */
  customProperties: Scalars["JSONObject"];
  /** The body of the petition. */
  emailBody?: Maybe<Scalars["JSON"]>;
  /** The subject of the petition. */
  emailSubject?: Maybe<Scalars["String"]>;
  /** The number of fields in the petition. */
  fieldCount: Scalars["Int"];
  /** The definition of the petition fields. */
  fields: Array<PetitionField>;
  /** The ID of the petition or template. */
  id: Scalars["GID"];
  /**
   * Whether the contents card is hidden in the recipient view.
   * @deprecated Don't use this
   */
  isRecipientViewContentsHidden: Scalars["Boolean"];
  isRestricted: Scalars["Boolean"];
  isRestrictedWithPassword: Scalars["Boolean"];
  /** The locale of the petition. */
  locale: PetitionLocale;
  /** The effective permission of the logged user. Will return Null if the user doesn't have access to the petition (e.g. on public templates). */
  myEffectivePermission?: Maybe<EffectivePetitionUserPermission>;
  /** The name of the petition. */
  name?: Maybe<Scalars["String"]>;
  organization: Organization;
  owner: User;
  /** The permissions linked to the petition */
  permissions: Array<PetitionPermission>;
  /** The reminders configuration for the petition. */
  remindersConfig?: Maybe<RemindersConfig>;
  /** The signature configuration for the petition. */
  signatureConfig?: Maybe<SignatureConfig>;
  /** Whether to skip the forward security check on the recipient view. */
  skipForwardSecurity: Scalars["Boolean"];
  /** The tags linked to the petition */
  tags: Array<Tag>;
  /** The preferred tone of organization. */
  tone: Tone;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
}

export interface PetitionBasePagination {
  __typename?: "PetitionBasePagination";
  /** The requested slice of items. */
  items: Array<PetitionBase>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
}

export type PetitionBaseType = "PETITION" | "TEMPLATE";

export interface PetitionClonedEvent extends PetitionEvent {
  __typename?: "PetitionClonedEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  type: PetitionEventType;
  user?: Maybe<User>;
}

export interface PetitionClosedEvent extends PetitionEvent {
  __typename?: "PetitionClosedEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  type: PetitionEventType;
  user?: Maybe<User>;
}

export interface PetitionClosedNotifiedEvent extends PetitionEvent {
  __typename?: "PetitionClosedNotifiedEvent";
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  type: PetitionEventType;
  user?: Maybe<User>;
}

export interface PetitionCompletedEvent extends PetitionEvent {
  __typename?: "PetitionCompletedEvent";
  completedBy?: Maybe<UserOrPetitionAccess>;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  type: PetitionEventType;
}

export interface PetitionCompletedUserNotification extends PetitionUserNotification {
  __typename?: "PetitionCompletedUserNotification";
  completedBy?: Maybe<UserOrPetitionAccess>;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  isRead: Scalars["Boolean"];
  petition: PetitionBase;
}

export interface PetitionCreatedEvent extends PetitionEvent {
  __typename?: "PetitionCreatedEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  type: PetitionEventType;
  user?: Maybe<User>;
}

export interface PetitionDeletedEvent extends PetitionEvent {
  __typename?: "PetitionDeletedEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  type: PetitionEventType;
}

export interface PetitionEvent {
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  type: PetitionEventType;
}

export interface PetitionEventPagination {
  __typename?: "PetitionEventPagination";
  /** The requested slice of items. */
  items: Array<PetitionEvent>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
}

export interface PetitionEventSubscription {
  __typename?: "PetitionEventSubscription";
  eventTypes?: Maybe<Array<PetitionEventType>>;
  eventsUrl: Scalars["String"];
  id: Scalars["GID"];
  isEnabled: Scalars["Boolean"];
  name?: Maybe<Scalars["String"]>;
}

export type PetitionEventType =
  | "ACCESS_ACTIVATED"
  | "ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK"
  | "ACCESS_DEACTIVATED"
  | "ACCESS_DELEGATED"
  | "ACCESS_OPENED"
  | "COMMENT_DELETED"
  | "COMMENT_PUBLISHED"
  | "GROUP_PERMISSION_ADDED"
  | "GROUP_PERMISSION_EDITED"
  | "GROUP_PERMISSION_REMOVED"
  | "MESSAGE_CANCELLED"
  | "MESSAGE_SCHEDULED"
  | "MESSAGE_SENT"
  | "OWNERSHIP_TRANSFERRED"
  | "PETITION_CLONED"
  | "PETITION_CLOSED"
  | "PETITION_CLOSED_NOTIFIED"
  | "PETITION_COMPLETED"
  | "PETITION_CREATED"
  | "PETITION_DELETED"
  | "PETITION_MESSAGE_BOUNCED"
  | "PETITION_REMINDER_BOUNCED"
  | "PETITION_REOPENED"
  | "RECIPIENT_SIGNED"
  | "REMINDERS_OPT_OUT"
  | "REMINDER_SENT"
  | "REPLY_CREATED"
  | "REPLY_DELETED"
  | "REPLY_UPDATED"
  | "SIGNATURE_CANCELLED"
  | "SIGNATURE_COMPLETED"
  | "SIGNATURE_OPENED"
  | "SIGNATURE_REMINDER"
  | "SIGNATURE_STARTED"
  | "TEMPLATE_USED"
  | "USER_PERMISSION_ADDED"
  | "USER_PERMISSION_EDITED"
  | "USER_PERMISSION_REMOVED";

/** A field within a petition. */
export interface PetitionField {
  __typename?: "PetitionField";
  /** The alias of the petition field. */
  alias?: Maybe<Scalars["String"]>;
  /** A list of files attached to this field. */
  attachments: Array<PetitionFieldAttachment>;
  commentCount: Scalars["Int"];
  /** The comments for this field. */
  comments: Array<PetitionFieldComment>;
  /** The description of the petition field. */
  description?: Maybe<Scalars["String"]>;
  /** The field GID used from which this field was cloned */
  fromPetitionFieldId?: Maybe<Scalars["GID"]>;
  hasCommentsEnabled: Scalars["Boolean"];
  /** The ID of the petition field. */
  id: Scalars["GID"];
  /** Determines if the field can be moved or deleted. */
  isFixed: Scalars["Boolean"];
  /** Determines if the field is visible by the recipients. */
  isInternal: Scalars["Boolean"];
  /** Determines if the field accepts replies */
  isReadOnly: Scalars["Boolean"];
  /** Determines if this field allows multiple replies. */
  multiple: Scalars["Boolean"];
  /** Determines if this field is optional. */
  optional: Scalars["Boolean"];
  /** The options of the petition field. */
  options: Scalars["JSONObject"];
  petition: PetitionBase;
  position: Scalars["Int"];
  previewReplies: Array<PetitionFieldReply>;
  /** The replies to the petition field */
  replies: Array<PetitionFieldReply>;
  /** Determines if the field is visible in PDF export. */
  showInPdf: Scalars["Boolean"];
  /** The title of the petition field. */
  title?: Maybe<Scalars["String"]>;
  /** The type of the petition field. */
  type: PetitionFieldType;
  unreadCommentCount: Scalars["Int"];
  /** A JSON object representing the conditions for the field to be visible */
  visibility?: Maybe<Scalars["JSONObject"]>;
}

/** A file attachment on the petition */
export interface PetitionFieldAttachment extends CreatedAt {
  __typename?: "PetitionFieldAttachment";
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  field: PetitionField;
  file: FileUpload;
  id: Scalars["GID"];
}

export interface PetitionFieldAttachmentUploadData {
  __typename?: "PetitionFieldAttachmentUploadData";
  attachment: PetitionFieldAttachment;
  presignedPostData: AWSPresignedPostData;
}

/** A comment on a petition field */
export interface PetitionFieldComment {
  __typename?: "PetitionFieldComment";
  /** The author of the comment. */
  author?: Maybe<UserOrPetitionAccess>;
  /** The content of the comment. */
  content: Scalars["String"];
  /** Time when the comment was created. */
  createdAt: Scalars["DateTime"];
  field: PetitionField;
  /** The ID of the petition field comment. */
  id: Scalars["GID"];
  /** Whether the comment has been edited after being published. */
  isEdited: Scalars["Boolean"];
  /** Whether the comment is internal (only visible to org users) or public (visible for users and accesses) */
  isInternal: Scalars["Boolean"];
  /** Whether the comment has been read or not. */
  isUnread: Scalars["Boolean"];
}

/** The progress of the petition */
export interface PetitionFieldProgress {
  __typename?: "PetitionFieldProgress";
  /** Number of optional fields not replied or validated */
  optional: Scalars["Int"];
  /** Number of fields with a reply and not validated */
  replied: Scalars["Int"];
  /** Total number of fields in the petition */
  total: Scalars["Int"];
  /** Number of fields validated */
  validated: Scalars["Int"];
}

/** A reply to a petition field */
export interface PetitionFieldReply extends Timestamps {
  __typename?: "PetitionFieldReply";
  /** The content of the reply. */
  content: Scalars["JSONObject"];
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The petition field for this reply. */
  field?: Maybe<PetitionField>;
  /** The ID of the petition field reply. */
  id: Scalars["GID"];
  /** Metadata for this reply. */
  metadata: Scalars["JSONObject"];
  /** The status of the reply. */
  status: PetitionFieldReplyStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
  /** The last updater of the field reply. */
  updatedBy?: Maybe<UserOrPetitionAccess>;
}

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
  /** A options list. */
  | "CHECKBOX"
  /** A datepicker field. */
  | "DATE"
  /** A dynamic select field. */
  | "DYNAMIC_SELECT"
  /** A file upload field. */
  | "FILE_UPLOAD"
  /** A heading field. */
  | "HEADING"
  /** A only numbers field. */
  | "NUMBER"
  /** A phone formatted field. */
  | "PHONE"
  /** A select field. */
  | "SELECT"
  /** A short text field. */
  | "SHORT_TEXT"
  /** A text field. */
  | "TEXT";

export interface PetitionFilter {
  locale?: InputMaybe<PetitionLocale>;
  sharedWith?: InputMaybe<PetitionSharedWithFilter>;
  status?: InputMaybe<Array<PetitionStatus>>;
  tagIds?: InputMaybe<Array<Scalars["GID"]>>;
  type?: InputMaybe<PetitionBaseType>;
}

/** The locale used for rendering the petition to the contact. */
export type PetitionLocale = "en" | "es";

/** A petition message */
export interface PetitionMessage extends CreatedAt {
  __typename?: "PetitionMessage";
  /** The access of this petition message. */
  access: PetitionAccess;
  /** Tells when the email bounced. */
  bouncedAt?: Maybe<Scalars["DateTime"]>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** Tells when the email was delivered. */
  deliveredAt?: Maybe<Scalars["DateTime"]>;
  /** The body of the petition message on HTML format. */
  emailBody?: Maybe<Scalars["String"]>;
  /** The subject of the petition message. */
  emailSubject?: Maybe<Scalars["JSON"]>;
  /** The ID of the petition message. */
  id: Scalars["GID"];
  /** Tells when the email was opened for the first time. */
  openedAt?: Maybe<Scalars["DateTime"]>;
  /** Time at which the message will be sent. */
  scheduledAt?: Maybe<Scalars["DateTime"]>;
  /** The sender of this petition message. */
  sender: User;
  /** If already sent, the date at which the email was sent. */
  sentAt?: Maybe<Scalars["DateTime"]>;
  /** The status of the petition message */
  status: PetitionMessageStatus;
}

export interface PetitionMessageBouncedEvent extends PetitionEvent {
  __typename?: "PetitionMessageBouncedEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  message: PetitionMessage;
  type: PetitionEventType;
}

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

export interface PetitionPermission {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** wether user is subscribed or not to emails and alerts of the petition */
  isSubscribed: Scalars["Boolean"];
  /** The type of the permission. */
  permissionType: PetitionPermissionType;
  /** The petition linked to the permission. */
  petition: Petition;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
}

/** The type of permission for a petition user. */
export type PetitionPermissionType = "OWNER" | "READ" | "WRITE";

/** The READ and WRITE permissions for a petition user. */
export type PetitionPermissionTypeRW = "READ" | "WRITE";

/** The progress of a petition. */
export interface PetitionProgress {
  __typename?: "PetitionProgress";
  /** The progress of the petition exlude internal fields. */
  external: PetitionFieldProgress;
  /** The progress of the petition include internal fields. */
  internal: PetitionFieldProgress;
}

export interface PetitionReminder extends CreatedAt {
  __typename?: "PetitionReminder";
  /** The access of this petition message. */
  access: PetitionAccess;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The body of the message in HTML format. */
  emailBody?: Maybe<Scalars["String"]>;
  id: Scalars["GID"];
  /** The sender of this petition message. */
  sender?: Maybe<User>;
  /** The type of the reminder. */
  type: PetitionReminderType;
}

export interface PetitionReminderBouncedEvent extends PetitionEvent {
  __typename?: "PetitionReminderBouncedEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  reminder: PetitionReminder;
  type: PetitionEventType;
}

/** The type of a petition reminder. */
export type PetitionReminderType =
  /** The reminder has been sent by the system according to the reminders configuration. */
  | "AUTOMATIC"
  /** The reminder has been sent manually by a user. */
  | "MANUAL";

export interface PetitionReopenedEvent extends PetitionEvent {
  __typename?: "PetitionReopenedEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  type: PetitionEventType;
  user?: Maybe<User>;
}

export interface PetitionSharedUserNotification extends PetitionUserNotification {
  __typename?: "PetitionSharedUserNotification";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  isRead: Scalars["Boolean"];
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
  value: Scalars["ID"];
}

export type PetitionSignatureCancelReason =
  | "CANCELLED_BY_USER"
  | "DECLINED_BY_SIGNER"
  | "REQUEST_ERROR"
  | "REQUEST_RESTARTED";

export interface PetitionSignatureRequest extends Timestamps {
  __typename?: "PetitionSignatureRequest";
  auditTrailFilename?: Maybe<Scalars["String"]>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The environment of the petition signature. */
  environment: SignatureOrgIntegrationEnvironment;
  id: Scalars["GID"];
  /** Metadata for this signature request. */
  metadata: Scalars["JSONObject"];
  petition: Petition;
  /** The signature configuration for the request. */
  signatureConfig: SignatureConfig;
  signedDocumentFilename?: Maybe<Scalars["String"]>;
  signerStatus: Array<PetitionSignatureRequestSignerStatus>;
  /** The status of the petition signature. */
  status: PetitionSignatureRequestStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
}

export interface PetitionSignatureRequestSignerStatus {
  __typename?: "PetitionSignatureRequestSignerStatus";
  declinedAt?: Maybe<Scalars["DateTime"]>;
  openedAt?: Maybe<Scalars["DateTime"]>;
  sentAt?: Maybe<Scalars["DateTime"]>;
  signedAt?: Maybe<Scalars["DateTime"]>;
  signer: PetitionSigner;
  /** The signing status of the individual contact. */
  status: Scalars["String"];
}

export type PetitionSignatureRequestStatus =
  | "CANCELLED"
  | "COMPLETED"
  | "ENQUEUED"
  | "PROCESSED"
  | "PROCESSING";

/** Information about a signer of the petition */
export interface PetitionSigner {
  __typename?: "PetitionSigner";
  contactId?: Maybe<Scalars["GID"]>;
  email: Scalars["String"];
  firstName: Scalars["String"];
  fullName: Scalars["String"];
  lastName?: Maybe<Scalars["String"]>;
}

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

/** A petition template */
export interface PetitionTemplate extends PetitionBase {
  __typename?: "PetitionTemplate";
  /** The attachments linked to this petition */
  attachments: Array<PetitionAttachment>;
  backgroundColor?: Maybe<Scalars["String"]>;
  categories?: Maybe<Array<Scalars["String"]>>;
  /** The closing email body of the petition. */
  closingEmailBody?: Maybe<Scalars["JSON"]>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** Custom user properties */
  customProperties: Scalars["JSONObject"];
  defaultPermissions: Array<TemplateDefaultPermission>;
  /** Description of the template. */
  description?: Maybe<Scalars["JSON"]>;
  /** HTML excerpt of the template description. */
  descriptionExcerpt?: Maybe<Scalars["String"]>;
  /** HTML description of the template. */
  descriptionHtml?: Maybe<Scalars["String"]>;
  /** The body of the petition. */
  emailBody?: Maybe<Scalars["JSON"]>;
  /** The subject of the petition. */
  emailSubject?: Maybe<Scalars["String"]>;
  /** The number of fields in the petition. */
  fieldCount: Scalars["Int"];
  /** The definition of the petition fields. */
  fields: Array<PetitionField>;
  /** The ID of the petition or template. */
  id: Scalars["GID"];
  imageUrl?: Maybe<Scalars["String"]>;
  /** Whether the template is publicly available or not */
  isPublic: Scalars["Boolean"];
  /**
   * Whether the contents card is hidden in the recipient view.
   * @deprecated Don't use this
   */
  isRecipientViewContentsHidden: Scalars["Boolean"];
  isRestricted: Scalars["Boolean"];
  isRestrictedWithPassword: Scalars["Boolean"];
  /** The locale of the petition. */
  locale: PetitionLocale;
  /** The effective permission of the logged user. Will return Null if the user doesn't have access to the petition (e.g. on public templates). */
  myEffectivePermission?: Maybe<EffectivePetitionUserPermission>;
  /** The name of the petition. */
  name?: Maybe<Scalars["String"]>;
  organization: Organization;
  owner: User;
  /** The permissions linked to the petition */
  permissions: Array<PetitionPermission>;
  /** The public link linked to this template */
  publicLink?: Maybe<PublicPetitionLink>;
  /** The reminders configuration for the petition. */
  remindersConfig?: Maybe<RemindersConfig>;
  /** The signature configuration for the petition. */
  signatureConfig?: Maybe<SignatureConfig>;
  /** Whether to skip the forward security check on the recipient view. */
  skipForwardSecurity: Scalars["Boolean"];
  /** The tags linked to the petition */
  tags: Array<Tag>;
  /** The preferred tone of organization. */
  tone: Tone;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
}

export interface PetitionTemplatePagination {
  __typename?: "PetitionTemplatePagination";
  /** The requested slice of items. */
  items: Array<PetitionTemplate>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
}

/** The permission for a petition and user group */
export interface PetitionUserGroupPermission extends PetitionPermission, Timestamps {
  __typename?: "PetitionUserGroupPermission";
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The group linked to the permission */
  group: UserGroup;
  /** wether user is subscribed or not to emails and alerts of the petition */
  isSubscribed: Scalars["Boolean"];
  /** The type of the permission. */
  permissionType: PetitionPermissionType;
  /** The petition linked to the permission. */
  petition: Petition;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
}

export interface PetitionUserNotification {
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  isRead: Scalars["Boolean"];
  petition: PetitionBase;
}

/** The types of notifications available for filtering */
export type PetitionUserNotificationFilter =
  | "ALL"
  | "COMMENTS"
  | "COMPLETED"
  | "OTHER"
  | "SHARED"
  | "UNREAD";

/** The permission for a petition and user */
export interface PetitionUserPermission extends PetitionPermission, Timestamps {
  __typename?: "PetitionUserPermission";
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** wether user is subscribed or not to emails and alerts of the petition */
  isSubscribed: Scalars["Boolean"];
  /** The type of the permission. */
  permissionType: PetitionPermissionType;
  /** The petition linked to the permission. */
  petition: Petition;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
  /** The user linked to the permission */
  user: User;
}

export interface PublicAccessVerification {
  __typename?: "PublicAccessVerification";
  cookieName?: Maybe<Scalars["String"]>;
  cookieValue?: Maybe<Scalars["String"]>;
  email?: Maybe<Scalars["String"]>;
  isAllowed: Scalars["Boolean"];
  orgLogoUrl?: Maybe<Scalars["String"]>;
  orgName?: Maybe<Scalars["String"]>;
  tone?: Maybe<Tone>;
}

/** A public view of a contact */
export interface PublicContact {
  __typename?: "PublicContact";
  /** The email of the user. */
  email: Scalars["String"];
  /** The first name of the user. */
  firstName: Scalars["String"];
  /** The full name of the user. */
  fullName: Scalars["String"];
  /** The ID of the contact. */
  id: Scalars["GID"];
  /** The last name of the user. */
  lastName?: Maybe<Scalars["String"]>;
}

export interface PublicCreateFileUploadReply {
  __typename?: "PublicCreateFileUploadReply";
  presignedPostData: AWSPresignedPostData;
  reply: PublicPetitionFieldReply;
}

/** A public view of an organization */
export interface PublicOrganization {
  __typename?: "PublicOrganization";
  /** The ID of the organization. */
  id: Scalars["GID"];
  /** The logo of the organization. */
  logoUrl?: Maybe<Scalars["String"]>;
  /** The name of the organization. */
  name: Scalars["String"];
}

/** A public view of the petition */
export interface PublicPetition extends Timestamps {
  __typename?: "PublicPetition";
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The deadline of the petition. */
  deadline?: Maybe<Scalars["DateTime"]>;
  /** The field definition of the petition. */
  fields: Array<PublicPetitionField>;
  /** The ID of the petition. */
  id: Scalars["GID"];
  /**
   * Whether the contents card is hidden in the recipient view.
   * @deprecated Don't use this
   */
  isRecipientViewContentsHidden: Scalars["Boolean"];
  /** The locale of the petition. */
  locale: PetitionLocale;
  /** The recipients of the petition */
  recipients: Array<PublicContact>;
  /** The signature config of the petition */
  signatureConfig?: Maybe<PublicSignatureConfig>;
  signatureStatus?: Maybe<PublicSignatureStatus>;
  /** The status of the petition. */
  status: PetitionStatus;
  /** The preferred tone of organization. */
  tone: Tone;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
}

/** A public view of a petition access */
export interface PublicPetitionAccess {
  __typename?: "PublicPetitionAccess";
  contact?: Maybe<PublicContact>;
  granter?: Maybe<PublicUser>;
  message?: Maybe<PublicPetitionMessage>;
  petition?: Maybe<PublicPetition>;
}

/** A field within a petition. */
export interface PublicPetitionField {
  __typename?: "PublicPetitionField";
  /** Alias of the petition field. */
  alias?: Maybe<Scalars["String"]>;
  /** A list of files attached to this field. */
  attachments: Array<PetitionFieldAttachment>;
  commentCount: Scalars["Int"];
  /** The comments for this field. */
  comments: Array<PublicPetitionFieldComment>;
  /** The description of the petition field. */
  description?: Maybe<Scalars["String"]>;
  hasCommentsEnabled: Scalars["Boolean"];
  /** The ID of the petition field. */
  id: Scalars["GID"];
  /** Determines if the field is visible by the recipients. */
  isInternal: Scalars["Boolean"];
  /** Determines if the field accepts replies */
  isReadOnly: Scalars["Boolean"];
  /** Determines if this field allows multiple replies. */
  multiple: Scalars["Boolean"];
  /** Determines if this field is optional. */
  optional: Scalars["Boolean"];
  /** The options of the petition field. */
  options: Scalars["JSONObject"];
  petition: PublicPetition;
  /** The replies to the petition field */
  replies: Array<PublicPetitionFieldReply>;
  /** The title of the petition field. */
  title?: Maybe<Scalars["String"]>;
  /** The type of the petition field. */
  type: PetitionFieldType;
  unreadCommentCount: Scalars["Int"];
  /** A JSON object representing the conditions for the field to be visible */
  visibility?: Maybe<Scalars["JSONObject"]>;
}

/** A comment on a petition field */
export interface PublicPetitionFieldComment {
  __typename?: "PublicPetitionFieldComment";
  /** The author of the comment. */
  author?: Maybe<PublicUserOrContact>;
  /** The content of the comment. */
  content: Scalars["String"];
  /** Time when the comment was created. */
  createdAt: Scalars["DateTime"];
  field: PublicPetitionField;
  /** The ID of the petition field comment. */
  id: Scalars["GID"];
  /** Whether the comment has been read or not. */
  isUnread: Scalars["Boolean"];
}

/** A reply to a petition field */
export interface PublicPetitionFieldReply extends Timestamps {
  __typename?: "PublicPetitionFieldReply";
  /** The public content of the reply */
  content: Scalars["JSONObject"];
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  field: PublicPetitionField;
  /** The ID of the petition field reply. */
  id: Scalars["GID"];
  /** The status of the petition field reply. */
  status: PetitionFieldReplyStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
}

export interface PublicPetitionLink {
  __typename?: "PublicPetitionLink";
  description: Scalars["String"];
  id: Scalars["GID"];
  isActive: Scalars["Boolean"];
  owner: User;
  slug: Scalars["String"];
  template: PetitionTemplate;
  title: Scalars["String"];
  url: Scalars["String"];
}

/** A public message in a petition */
export interface PublicPetitionMessage {
  __typename?: "PublicPetitionMessage";
  /** The ID of the message. */
  id: Scalars["GID"];
  /** Subject of a email. */
  subject?: Maybe<Scalars["String"]>;
}

export interface PublicPetitionSignerDataInput {
  email: Scalars["String"];
  firstName: Scalars["String"];
  lastName: Scalars["String"];
}

export interface PublicPublicPetitionLink {
  __typename?: "PublicPublicPetitionLink";
  description: Scalars["String"];
  isActive: Scalars["Boolean"];
  /** If the organization has enough credits to send a petition with this public link or not */
  isAvailable: Scalars["Boolean"];
  owner: PublicUser;
  slug: Scalars["String"];
  title: Scalars["String"];
}

/** The public signature settings of a petition */
export interface PublicSignatureConfig {
  __typename?: "PublicSignatureConfig";
  /** The signers assigned by the petition recipient */
  additionalSigners: Array<PetitionSigner>;
  /** If true, allows the recipients or users of the petition to select additional signers */
  allowAdditionalSigners: Scalars["Boolean"];
  /** If true, lets the user review the replies before starting the signature process */
  review: Scalars["Boolean"];
  /** The contacts that need to sign the generated document. */
  signers: Array<PetitionSigner>;
}

export type PublicSignatureStatus = "COMPLETED" | "STARTED";

/** A public view of a user */
export interface PublicUser {
  __typename?: "PublicUser";
  /** The email of the user. */
  email: Scalars["String"];
  /** The first name of the user. */
  firstName?: Maybe<Scalars["String"]>;
  /** The full name of the user. */
  fullName: Scalars["String"];
  /** The ID of the user. */
  id: Scalars["GID"];
  /** The last name of the user. */
  lastName?: Maybe<Scalars["String"]>;
  /** The organization of the user. */
  organization: PublicOrganization;
}

export type PublicUserOrContact = PublicContact | PublicUser;

export interface Query {
  __typename?: "Query";
  access?: Maybe<PublicPetitionAccess>;
  contact?: Maybe<Contact>;
  /** The contacts of the user */
  contacts: ContactPagination;
  /** Matches the emails passed as argument with a Contact in the database. Returns a list of nullable Contacts */
  contactsByEmail: Array<Maybe<Contact>>;
  /** Checks if the provided email is available to be registered as a user on Parallel */
  emailIsAvailable: Scalars["Boolean"];
  getSlugForPublicPetitionLink: Scalars["String"];
  /** Get users or groups from IDs */
  getUsersOrGroups: Array<UserOrUserGroup>;
  /** Decodes the given Global ID into an entity in the database. */
  globalIdDecode: SupportMethodResponse;
  /** Encodes the given ID into a Global ID. */
  globalIdEncode: SupportMethodResponse;
  isValidPublicPetitionLinkSlug: Scalars["Boolean"];
  landingTemplateBySlug?: Maybe<LandingTemplate>;
  landingTemplateCategorySamples: Array<LandingTemplateCategorySample>;
  landingTemplates: LandingTemplatePagination;
  me: User;
  metadata: ConnectionMetadata;
  organization?: Maybe<Organization>;
  /** The organizations registered in Parallel. */
  organizations: OrganizationPagination;
  petition?: Maybe<PetitionBase>;
  petitionAuthToken?: Maybe<Petition>;
  /** A field of the petition. */
  petitionField: PetitionField;
  /** The petitions of the user */
  petitions: PetitionBasePagination;
  petitionsById: Array<Maybe<PetitionBase>>;
  publicOrgLogoUrl?: Maybe<Scalars["String"]>;
  /** The comments for this field. */
  publicPetitionField: PublicPetitionField;
  publicPetitionLinkBySlug?: Maybe<PublicPublicPetitionLink>;
  publicTask: Task;
  publicTemplateCategories: Array<Scalars["String"]>;
  /** Search user groups */
  searchUserGroups: Array<UserGroup>;
  /** Search users and user groups */
  searchUsers: Array<UserOrUserGroup>;
  subscriptions: Array<PetitionEventSubscription>;
  /** Paginated list of tags in the organization */
  tags: TagPagination;
  task: Task;
  /** The available templates */
  templates: PetitionTemplatePagination;
  userGroup?: Maybe<UserGroup>;
  /** Paginated list of user groups in the organization */
  userGroups: UserGroupPagination;
}

export interface QueryaccessArgs {
  keycode: Scalars["ID"];
}

export interface QuerycontactArgs {
  id: Scalars["GID"];
}

export interface QuerycontactsArgs {
  exclude?: InputMaybe<Array<Scalars["GID"]>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  search?: InputMaybe<Scalars["String"]>;
  sortBy?: InputMaybe<Array<QueryContacts_OrderBy>>;
}

export interface QuerycontactsByEmailArgs {
  emails: Array<Scalars["String"]>;
}

export interface QueryemailIsAvailableArgs {
  email: Scalars["String"];
}

export interface QuerygetSlugForPublicPetitionLinkArgs {
  petitionName?: InputMaybe<Scalars["String"]>;
}

export interface QuerygetUsersOrGroupsArgs {
  ids: Array<Scalars["ID"]>;
}

export interface QueryglobalIdDecodeArgs {
  id: Scalars["ID"];
}

export interface QueryglobalIdEncodeArgs {
  id: Scalars["Int"];
  type: EntityType;
}

export interface QueryisValidPublicPetitionLinkSlugArgs {
  slug: Scalars["String"];
}

export interface QuerylandingTemplateBySlugArgs {
  slug: Scalars["String"];
}

export interface QuerylandingTemplatesArgs {
  categories?: InputMaybe<Array<Scalars["String"]>>;
  limit?: InputMaybe<Scalars["Int"]>;
  locale: PetitionLocale;
  offset?: InputMaybe<Scalars["Int"]>;
}

export interface QuerymetadataArgs {
  keycode?: InputMaybe<Scalars["ID"]>;
}

export interface QueryorganizationArgs {
  id: Scalars["GID"];
}

export interface QueryorganizationsArgs {
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  search?: InputMaybe<Scalars["String"]>;
  sortBy?: InputMaybe<Array<QueryOrganizations_OrderBy>>;
  status?: InputMaybe<OrganizationStatus>;
}

export interface QuerypetitionArgs {
  id: Scalars["GID"];
}

export interface QuerypetitionAuthTokenArgs {
  token: Scalars["String"];
}

export interface QuerypetitionFieldArgs {
  petitionFieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
}

export interface QuerypetitionsArgs {
  filters?: InputMaybe<PetitionFilter>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  search?: InputMaybe<Scalars["String"]>;
  sortBy?: InputMaybe<Array<QueryPetitions_OrderBy>>;
}

export interface QuerypetitionsByIdArgs {
  ids: Array<Scalars["GID"]>;
}

export interface QuerypublicOrgLogoUrlArgs {
  id: Scalars["GID"];
}

export interface QuerypublicPetitionFieldArgs {
  keycode: Scalars["ID"];
  petitionFieldId: Scalars["GID"];
}

export interface QuerypublicPetitionLinkBySlugArgs {
  slug: Scalars["ID"];
}

export interface QuerypublicTaskArgs {
  keycode: Scalars["ID"];
  taskId: Scalars["GID"];
}

export interface QuerysearchUserGroupsArgs {
  excludeUserGroups?: InputMaybe<Array<Scalars["GID"]>>;
  search: Scalars["String"];
}

export interface QuerysearchUsersArgs {
  excludeUserGroups?: InputMaybe<Array<Scalars["GID"]>>;
  excludeUsers?: InputMaybe<Array<Scalars["GID"]>>;
  includeGroups?: InputMaybe<Scalars["Boolean"]>;
  includeInactive?: InputMaybe<Scalars["Boolean"]>;
  search: Scalars["String"];
}

export interface QuerytagsArgs {
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  search?: InputMaybe<Scalars["String"]>;
}

export interface QuerytaskArgs {
  id: Scalars["GID"];
}

export interface QuerytemplatesArgs {
  category?: InputMaybe<Scalars["String"]>;
  isOwner?: InputMaybe<Scalars["Boolean"]>;
  isPublic: Scalars["Boolean"];
  limit?: InputMaybe<Scalars["Int"]>;
  locale?: InputMaybe<PetitionLocale>;
  offset?: InputMaybe<Scalars["Int"]>;
  search?: InputMaybe<Scalars["String"]>;
}

export interface QueryuserGroupArgs {
  id: Scalars["GID"];
}

export interface QueryuserGroupsArgs {
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  search?: InputMaybe<Scalars["String"]>;
  sortBy?: InputMaybe<Array<QueryUserGroups_OrderBy>>;
}

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
  | "lastUsedAt_ASC"
  | "lastUsedAt_DESC"
  | "name_ASC"
  | "name_DESC"
  | "sentAt_ASC"
  | "sentAt_DESC";

/** Order to use on Query.userGroups */
export type QueryUserGroups_OrderBy = "createdAt_ASC" | "createdAt_DESC" | "name_ASC" | "name_DESC";

export interface RecipientSignedEvent extends PetitionEvent {
  __typename?: "RecipientSignedEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  signer?: Maybe<PetitionSigner>;
  type: PetitionEventType;
}

export interface ReminderEmailBouncedUserNotification extends PetitionUserNotification {
  __typename?: "ReminderEmailBouncedUserNotification";
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  isRead: Scalars["Boolean"];
  petition: PetitionBase;
}

export interface ReminderSentEvent extends PetitionEvent {
  __typename?: "ReminderSentEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  reminder: PetitionReminder;
  type: PetitionEventType;
}

/** The reminder settings of a petition */
export interface RemindersConfig {
  __typename?: "RemindersConfig";
  /** The amount of days between reminders. */
  offset: Scalars["Int"];
  /** The time at which the reminder should be sent. */
  time: Scalars["String"];
  /** The timezone the time is referring to. */
  timezone: Scalars["String"];
  /** Whether to send reminders only from monday to friday. */
  weekdaysOnly: Scalars["Boolean"];
}

/** The reminders settings for the petition */
export interface RemindersConfigInput {
  /** The amount of days between reminders. */
  offset: Scalars["Int"];
  /** The time at which the reminder should be sent. */
  time: Scalars["String"];
  /** The timezone the time is referring to. */
  timezone: Scalars["String"];
  /** Whether to send reminders only from monday to friday. */
  weekdaysOnly: Scalars["Boolean"];
}

export interface RemindersOptOutEvent extends PetitionEvent {
  __typename?: "RemindersOptOutEvent";
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  other?: Maybe<Scalars["String"]>;
  reason: Scalars["String"];
  type: PetitionEventType;
}

export interface RemindersOptOutNotification extends PetitionUserNotification {
  __typename?: "RemindersOptOutNotification";
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  isRead: Scalars["Boolean"];
  other?: Maybe<Scalars["String"]>;
  petition: PetitionBase;
  reason: Scalars["String"];
}

export interface ReplyCreatedEvent extends PetitionEvent {
  __typename?: "ReplyCreatedEvent";
  createdAt: Scalars["DateTime"];
  createdBy?: Maybe<UserOrPetitionAccess>;
  field?: Maybe<PetitionField>;
  id: Scalars["GID"];
  reply?: Maybe<PetitionFieldReply>;
  type: PetitionEventType;
}

export interface ReplyDeletedEvent extends PetitionEvent {
  __typename?: "ReplyDeletedEvent";
  createdAt: Scalars["DateTime"];
  deletedBy?: Maybe<UserOrPetitionAccess>;
  field?: Maybe<PetitionField>;
  id: Scalars["GID"];
  type: PetitionEventType;
}

export interface ReplyUpdatedEvent extends PetitionEvent {
  __typename?: "ReplyUpdatedEvent";
  createdAt: Scalars["DateTime"];
  field?: Maybe<PetitionField>;
  id: Scalars["GID"];
  reply?: Maybe<PetitionFieldReply>;
  type: PetitionEventType;
  updatedBy?: Maybe<UserOrPetitionAccess>;
}

/** Represents the result of an operation. */
export type Result = "FAILURE" | "SUCCESS";

export interface SendPetitionResult {
  __typename?: "SendPetitionResult";
  accesses?: Maybe<Array<PetitionAccess>>;
  petition?: Maybe<Petition>;
  result: Result;
}

export interface SignatureCancelledEvent extends PetitionEvent {
  __typename?: "SignatureCancelledEvent";
  cancelType: PetitionSignatureCancelReason;
  cancelledBy?: Maybe<UserOrPetitionAccess>;
  canceller?: Maybe<PetitionSigner>;
  cancellerReason?: Maybe<Scalars["String"]>;
  createdAt: Scalars["DateTime"];
  errorCode?: Maybe<Scalars["String"]>;
  extraErrorData?: Maybe<Scalars["JSON"]>;
  id: Scalars["GID"];
  type: PetitionEventType;
}

export interface SignatureCancelledUserNotification extends PetitionUserNotification {
  __typename?: "SignatureCancelledUserNotification";
  createdAt: Scalars["DateTime"];
  errorCode?: Maybe<Scalars["String"]>;
  extraErrorData?: Maybe<Scalars["JSON"]>;
  id: Scalars["GID"];
  isRead: Scalars["Boolean"];
  petition: PetitionBase;
}

export interface SignatureCompletedEvent extends PetitionEvent {
  __typename?: "SignatureCompletedEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  type: PetitionEventType;
}

export interface SignatureCompletedUserNotification extends PetitionUserNotification {
  __typename?: "SignatureCompletedUserNotification";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  isRead: Scalars["Boolean"];
  petition: PetitionBase;
}

/** The signature settings of a petition */
export interface SignatureConfig {
  __typename?: "SignatureConfig";
  /** If true, allows the recipients or users of the petition to select additional signers */
  allowAdditionalSigners: Scalars["Boolean"];
  /** The signature integration selected for this signature config. */
  integration?: Maybe<SignatureOrgIntegration>;
  /** If true, lets the user review the replies before starting the signature process */
  review: Scalars["Boolean"];
  /** The signers of the generated document. */
  signers: Array<PetitionSigner>;
  /** The timezone used to generate the document. */
  timezone: Scalars["String"];
  /** Title of the signature document */
  title: Scalars["String"];
}

/** The signature settings for the petition */
export interface SignatureConfigInput {
  /** If true, allows the recipients or users of the petition to select additional signers */
  allowAdditionalSigners: Scalars["Boolean"];
  /** The Global ID of the signature integration to be used. */
  orgIntegrationId: Scalars["GID"];
  /** If true, lets the user review the replies before starting the signature process */
  review: Scalars["Boolean"];
  signersInfo: Array<SignatureConfigInputSigner>;
  /** The timezone used to generate the document. */
  timezone: Scalars["String"];
  /** The title of the signing document */
  title: Scalars["String"];
}

/** The signer that need to sign the generated document. */
export interface SignatureConfigInputSigner {
  contactId?: InputMaybe<Scalars["GID"]>;
  email: Scalars["String"];
  firstName: Scalars["String"];
  lastName: Scalars["String"];
}

export interface SignatureOpenedEvent extends PetitionEvent {
  __typename?: "SignatureOpenedEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  signer?: Maybe<PetitionSigner>;
  type: PetitionEventType;
}

export interface SignatureOrgIntegration extends OrgIntegration {
  __typename?: "SignatureOrgIntegration";
  /** Environment of this integration, to differentiate between sandbox and production-ready integrations */
  environment: SignatureOrgIntegrationEnvironment;
  id: Scalars["GID"];
  /** Wether this integration is the default to be used if the user has more than one of the same type */
  isDefault: Scalars["Boolean"];
  /** Custom name of this integration, provided by the user */
  name: Scalars["String"];
  provider: SignatureOrgIntegrationProvider;
  /** The type of the integration. */
  type: IntegrationType;
}

export type SignatureOrgIntegrationEnvironment = "DEMO" | "PRODUCTION";

export type SignatureOrgIntegrationProvider = "SIGNATURIT";

export interface SignatureReminderEvent extends PetitionEvent {
  __typename?: "SignatureReminderEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  type: PetitionEventType;
  user?: Maybe<User>;
}

export interface SignatureStartedEvent extends PetitionEvent {
  __typename?: "SignatureStartedEvent";
  bouncedAt?: Maybe<Scalars["DateTime"]>;
  createdAt: Scalars["DateTime"];
  deliveredAt?: Maybe<Scalars["DateTime"]>;
  id: Scalars["GID"];
  openedAt?: Maybe<Scalars["DateTime"]>;
  type: PetitionEventType;
}

export interface SsoOrgIntegration extends OrgIntegration {
  __typename?: "SsoOrgIntegration";
  id: Scalars["GID"];
  /** Wether this integration is the default to be used if the user has more than one of the same type */
  isDefault: Scalars["Boolean"];
  /** Custom name of this integration, provided by the user */
  name: Scalars["String"];
  /** The type of the integration. */
  type: IntegrationType;
}

/** Return type for all support methods */
export interface SupportMethodResponse {
  __typename?: "SupportMethodResponse";
  message?: Maybe<Scalars["String"]>;
  result: Result;
}

export interface Tag {
  __typename?: "Tag";
  /** The color of the tag in hex format (example: #FFFFFF) */
  color: Scalars["String"];
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  name: Scalars["String"];
}

export interface TagPagination {
  __typename?: "TagPagination";
  /** The requested slice of items. */
  items: Array<Tag>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
}

export interface Task {
  __typename?: "Task";
  id: Scalars["GID"];
  progress?: Maybe<Scalars["Int"]>;
  status: TaskStatus;
}

export type TaskStatus = "COMPLETED" | "ENQUEUED" | "FAILED" | "PROCESSING";

export interface TemplateDefaultPermission {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  /** wether user is will be subscribed or not to emails and alerts of the generated petition */
  isSubscribed: Scalars["Boolean"];
  /** The type of the permission. */
  permissionType: PetitionPermissionType;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
}

/** The permission for a petition and user group */
export interface TemplateDefaultUserGroupPermission extends TemplateDefaultPermission, Timestamps {
  __typename?: "TemplateDefaultUserGroupPermission";
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The group linked to the permission */
  group: UserGroup;
  id: Scalars["GID"];
  /** wether user is will be subscribed or not to emails and alerts of the generated petition */
  isSubscribed: Scalars["Boolean"];
  /** The type of the permission. */
  permissionType: PetitionPermissionType;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
}

/** The permission for a petition and user */
export interface TemplateDefaultUserPermission extends TemplateDefaultPermission, Timestamps {
  __typename?: "TemplateDefaultUserPermission";
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  /** wether user is will be subscribed or not to emails and alerts of the generated petition */
  isSubscribed: Scalars["Boolean"];
  /** The type of the permission. */
  permissionType: PetitionPermissionType;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
  /** The user linked to the permission */
  user: User;
}

export interface TemplateUsedEvent extends PetitionEvent {
  __typename?: "TemplateUsedEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  type: PetitionEventType;
}

export interface Timestamps {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
}

/** The preferred tone of organization */
export type Tone = "FORMAL" | "INFORMAL";

export interface UpdateContactInput {
  firstName?: InputMaybe<Scalars["String"]>;
  lastName?: InputMaybe<Scalars["String"]>;
}

export interface UpdateEventSubscriptionInput {
  eventTypes?: InputMaybe<Array<PetitionEventType>>;
  eventsUrl?: InputMaybe<Scalars["String"]>;
  isEnabled?: InputMaybe<Scalars["Boolean"]>;
}

export interface UpdatePetitionFieldInput {
  alias?: InputMaybe<Scalars["String"]>;
  description?: InputMaybe<Scalars["String"]>;
  hasCommentsEnabled?: InputMaybe<Scalars["Boolean"]>;
  isInternal?: InputMaybe<Scalars["Boolean"]>;
  multiple?: InputMaybe<Scalars["Boolean"]>;
  optional?: InputMaybe<Scalars["Boolean"]>;
  options?: InputMaybe<Scalars["JSONObject"]>;
  showInPdf?: InputMaybe<Scalars["Boolean"]>;
  title?: InputMaybe<Scalars["String"]>;
  visibility?: InputMaybe<Scalars["JSONObject"]>;
}

export interface UpdatePetitionInput {
  closingEmailBody?: InputMaybe<Scalars["JSON"]>;
  deadline?: InputMaybe<Scalars["DateTime"]>;
  description?: InputMaybe<Scalars["JSON"]>;
  emailBody?: InputMaybe<Scalars["JSON"]>;
  emailSubject?: InputMaybe<Scalars["String"]>;
  isRecipientViewContentsHidden?: InputMaybe<Scalars["Boolean"]>;
  locale?: InputMaybe<PetitionLocale>;
  name?: InputMaybe<Scalars["String"]>;
  remindersConfig?: InputMaybe<RemindersConfigInput>;
  signatureConfig?: InputMaybe<SignatureConfigInput>;
  skipForwardSecurity?: InputMaybe<Scalars["Boolean"]>;
}

export interface UpdateTagInput {
  color?: InputMaybe<Scalars["String"]>;
  name?: InputMaybe<Scalars["String"]>;
}

export interface UpdateUserGroupInput {
  name?: InputMaybe<Scalars["String"]>;
}

export interface UpdateUserInput {
  firstName?: InputMaybe<Scalars["String"]>;
  lastName?: InputMaybe<Scalars["String"]>;
  role?: InputMaybe<OrganizationRole>;
}

/** A user in the system. */
export interface User extends Timestamps {
  __typename?: "User";
  /** URL to the user avatar */
  avatarUrl?: Maybe<Scalars["String"]>;
  canCreateUsers: Scalars["Boolean"];
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The email of the user. */
  email: Scalars["String"];
  /** The first name of the user. */
  firstName?: Maybe<Scalars["String"]>;
  /** The full name of the user. */
  fullName?: Maybe<Scalars["String"]>;
  hasFeatureFlag: Scalars["Boolean"];
  /** The ID of the user. */
  id: Scalars["GID"];
  /** The initials of the user. */
  initials?: Maybe<Scalars["String"]>;
  isSsoUser: Scalars["Boolean"];
  isSuperAdmin: Scalars["Boolean"];
  lastActiveAt?: Maybe<Scalars["DateTime"]>;
  /** The last name of the user. */
  lastName?: Maybe<Scalars["String"]>;
  /** Read and unread user notifications about events on their petitions */
  notifications: UserNotifications_Pagination;
  /** The onboarding status for the different views of the app. */
  onboardingStatus: Scalars["JSONObject"];
  organization: Organization;
  preferredLocale?: Maybe<Scalars["String"]>;
  role: OrganizationRole;
  status: UserStatus;
  /** Lists the API tokens this user has. */
  tokens: Array<UserAuthenticationToken>;
  unreadNotificationIds: Array<Scalars["ID"]>;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
  userGroups: Array<UserGroup>;
}

/** A user in the system. */
export interface UserhasFeatureFlagArgs {
  featureFlag: FeatureFlag;
}

/** A user in the system. */
export interface UsernotificationsArgs {
  before?: InputMaybe<Scalars["DateTime"]>;
  filter?: InputMaybe<PetitionUserNotificationFilter>;
  limit?: InputMaybe<Scalars["Int"]>;
}

export interface UserAuthenticationToken extends CreatedAt {
  __typename?: "UserAuthenticationToken";
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  lastUsedAt?: Maybe<Scalars["DateTime"]>;
  tokenName: Scalars["String"];
}

export interface UserGroup extends Timestamps {
  __typename?: "UserGroup";
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  initials: Scalars["String"];
  members: Array<UserGroupMember>;
  name: Scalars["String"];
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
}

export interface UserGroupMember {
  __typename?: "UserGroupMember";
  /** The time the user was added to the user group. */
  addedAt: Scalars["DateTime"];
  id: Scalars["GID"];
  user: User;
}

export interface UserGroupPagination {
  __typename?: "UserGroupPagination";
  /** The requested slice of items. */
  items: Array<UserGroup>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
}

export interface UserNotifications_Pagination {
  __typename?: "UserNotifications_Pagination";
  /** Whether this resource has more items. */
  hasMore: Scalars["Boolean"];
  /** The requested slice of items. */
  items: Array<PetitionUserNotification>;
}

export type UserOrPetitionAccess = PetitionAccess | User;

export type UserOrUserGroup = User | UserGroup;

export interface UserOrUserGroupPermissionInput {
  isSubscribed: Scalars["Boolean"];
  permissionType: PetitionPermissionType;
  userGroupId?: InputMaybe<Scalars["GID"]>;
  userId?: InputMaybe<Scalars["GID"]>;
}

export interface UserPagination {
  __typename?: "UserPagination";
  /** The requested slice of items. */
  items: Array<User>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
}

export interface UserPermissionAddedEvent extends PetitionEvent {
  __typename?: "UserPermissionAddedEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  permissionType: PetitionPermissionType;
  permissionUser?: Maybe<User>;
  type: PetitionEventType;
  user?: Maybe<User>;
}

export interface UserPermissionEditedEvent extends PetitionEvent {
  __typename?: "UserPermissionEditedEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  permissionType: PetitionPermissionType;
  permissionUser?: Maybe<User>;
  type: PetitionEventType;
  user?: Maybe<User>;
}

export interface UserPermissionRemovedEvent extends PetitionEvent {
  __typename?: "UserPermissionRemovedEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  permissionUser?: Maybe<User>;
  type: PetitionEventType;
  user?: Maybe<User>;
}

export interface UserProvisioningOrgIntegration extends OrgIntegration {
  __typename?: "UserProvisioningOrgIntegration";
  id: Scalars["GID"];
  /** Wether this integration is the default to be used if the user has more than one of the same type */
  isDefault: Scalars["Boolean"];
  /** Custom name of this integration, provided by the user */
  name: Scalars["String"];
  /** The type of the integration. */
  type: IntegrationType;
}

export type UserStatus = "ACTIVE" | "INACTIVE";

export interface VerificationCodeCheck {
  __typename?: "VerificationCodeCheck";
  remainingAttempts?: Maybe<Scalars["Int"]>;
  result: Result;
}

export interface VerificationCodeRequest {
  __typename?: "VerificationCodeRequest";
  expiresAt: Scalars["DateTime"];
  remainingAttempts: Scalars["Int"];
  token: Scalars["ID"];
}

export type AlreadyLoggedIn_UserFragment = {
  __typename?: "User";
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  initials?: string | null;
};

export type ContactListPopover_ContactFragment = {
  __typename?: "Contact";
  id: string;
  email: string;
  fullName: string;
};

export type ContactListPopover_PublicContactFragment = {
  __typename?: "PublicContact";
  id: string;
  email: string;
  fullName: string;
};

export type ContactListPopover_PetitionSignerFragment = {
  __typename?: "PetitionSigner";
  email: string;
  fullName: string;
};

export type ContactReference_ContactFragment = {
  __typename?: "Contact";
  id: string;
  fullName: string;
  email: string;
};

export type ContactSelect_ContactFragment = {
  __typename?: "Contact";
  id: string;
  firstName: string;
  lastName?: string | null;
  fullName: string;
  email: string;
  hasBouncedEmail: boolean;
};

export type FieldComment_PublicPetitionFieldCommentFragment = {
  __typename?: "PublicPetitionFieldComment";
  id: string;
  content: string;
  createdAt: string;
  isUnread: boolean;
  author?:
    | { __typename?: "PublicContact"; id: string; fullName: string }
    | { __typename?: "PublicUser"; id: string; fullName: string }
    | null;
};

export type FieldComment_PetitionFieldCommentFragment = {
  __typename?: "PetitionFieldComment";
  id: string;
  createdAt: string;
  content: string;
  isUnread: boolean;
  isInternal: boolean;
  isEdited: boolean;
  author?:
    | {
        __typename?: "PetitionAccess";
        id: string;
        contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
      }
    | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
    | null;
};

export type FileAttachmentButton_FileUploadFragment = {
  __typename?: "FileUpload";
  filename: string;
  contentType: string;
  size: number;
  isComplete: boolean;
};

export type PetitionFieldSelect_PetitionFieldFragment = {
  __typename?: "PetitionField";
  id: string;
  type: PetitionFieldType;
  title?: string | null;
  options: { [key: string]: any };
};

export type PetitionSignatureCellContent_PetitionFragment = {
  __typename?: "Petition";
  status: PetitionStatus;
  currentSignatureRequest?: {
    __typename?: "PetitionSignatureRequest";
    status: PetitionSignatureRequestStatus;
    environment: SignatureOrgIntegrationEnvironment;
  } | null;
  signatureConfig?: {
    __typename?: "SignatureConfig";
    review: boolean;
    integration?: {
      __typename?: "SignatureOrgIntegration";
      environment: SignatureOrgIntegrationEnvironment;
    } | null;
  } | null;
};

export type PetitionStatusCellContent_PetitionFragment = {
  __typename?: "Petition";
  status: PetitionStatus;
  progress: {
    __typename?: "PetitionProgress";
    external: {
      __typename?: "PetitionFieldProgress";
      validated: number;
      replied: number;
      optional: number;
      total: number;
    };
    internal: {
      __typename?: "PetitionFieldProgress";
      validated: number;
      replied: number;
      optional: number;
      total: number;
    };
  };
};

export type PetitionTagListCellContent_TagFragment = {
  __typename?: "Tag";
  id: string;
  name: string;
  color: string;
};

export type PetitionTagListCellContent_PetitionBase_Petition_Fragment = {
  __typename?: "Petition";
  id: string;
  isRestricted: boolean;
  tags: Array<{ __typename?: "Tag"; id: string; name: string; color: string }>;
};

export type PetitionTagListCellContent_PetitionBase_PetitionTemplate_Fragment = {
  __typename?: "PetitionTemplate";
  id: string;
  isRestricted: boolean;
  tags: Array<{ __typename?: "Tag"; id: string; name: string; color: string }>;
};

export type PetitionTagListCellContent_PetitionBaseFragment =
  | PetitionTagListCellContent_PetitionBase_Petition_Fragment
  | PetitionTagListCellContent_PetitionBase_PetitionTemplate_Fragment;

export type PetitionTagListCellContent_tagsQueryVariables = Exact<{
  search?: InputMaybe<Scalars["String"]>;
}>;

export type PetitionTagListCellContent_tagsQuery = {
  tags: {
    __typename?: "TagPagination";
    items: Array<{ __typename?: "Tag"; id: string; name: string; color: string }>;
  };
};

export type PetitionTagListCellContent_tagPetitionMutationVariables = Exact<{
  tagId: Scalars["GID"];
  petitionId: Scalars["GID"];
}>;

export type PetitionTagListCellContent_tagPetitionMutation = {
  tagPetition:
    | {
        __typename?: "Petition";
        id: string;
        tags: Array<{ __typename?: "Tag"; id: string; name: string; color: string }>;
      }
    | {
        __typename?: "PetitionTemplate";
        id: string;
        tags: Array<{ __typename?: "Tag"; id: string; name: string; color: string }>;
      };
};

export type PetitionTagListCellContent_untagPetitionMutationVariables = Exact<{
  tagId: Scalars["GID"];
  petitionId: Scalars["GID"];
}>;

export type PetitionTagListCellContent_untagPetitionMutation = {
  untagPetition:
    | {
        __typename?: "Petition";
        id: string;
        tags: Array<{ __typename?: "Tag"; id: string; name: string; color: string }>;
      }
    | {
        __typename?: "PetitionTemplate";
        id: string;
        tags: Array<{ __typename?: "Tag"; id: string; name: string; color: string }>;
      };
};

export type PetitionTagListCellContent_createTagMutationVariables = Exact<{
  name: Scalars["String"];
  color: Scalars["String"];
}>;

export type PetitionTagListCellContent_createTagMutation = {
  createTag: { __typename?: "Tag"; id: string; name: string; color: string };
};

export type ShareButton_PetitionBase_Petition_Fragment = {
  __typename?: "Petition";
  permissions: Array<
    | {
        __typename?: "PetitionUserGroupPermission";
        permissionType: PetitionPermissionType;
        group: { __typename?: "UserGroup"; id: string; name: string };
      }
    | {
        __typename?: "PetitionUserPermission";
        permissionType: PetitionPermissionType;
        user: { __typename?: "User"; id: string; fullName?: string | null };
      }
  >;
};

export type ShareButton_PetitionBase_PetitionTemplate_Fragment = {
  __typename?: "PetitionTemplate";
  permissions: Array<
    | {
        __typename?: "PetitionUserGroupPermission";
        permissionType: PetitionPermissionType;
        group: { __typename?: "UserGroup"; id: string; name: string };
      }
    | {
        __typename?: "PetitionUserPermission";
        permissionType: PetitionPermissionType;
        user: { __typename?: "User"; id: string; fullName?: string | null };
      }
  >;
};

export type ShareButton_PetitionBaseFragment =
  | ShareButton_PetitionBase_Petition_Fragment
  | ShareButton_PetitionBase_PetitionTemplate_Fragment;

export type SignerReference_PetitionSignerFragment = {
  __typename?: "PetitionSigner";
  email: string;
  fullName: string;
};

export type Tag_TagFragment = { __typename?: "Tag"; name: string; color: string };

export type UserAvatar_UserFragment = {
  __typename?: "User";
  fullName?: string | null;
  avatarUrl?: string | null;
  initials?: string | null;
};

export type UserAvatarList_UserFragment = {
  __typename?: "User";
  id: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  initials?: string | null;
};

export type UserAvatarList_UserGroupFragment = {
  __typename?: "UserGroup";
  id: string;
  name: string;
  initials: string;
};

export type useSearchUserGroups_searchUserGroupsQueryVariables = Exact<{
  search: Scalars["String"];
  excludeUserGroups?: InputMaybe<Array<Scalars["GID"]> | Scalars["GID"]>;
}>;

export type useSearchUserGroups_searchUserGroupsQuery = {
  searchUserGroups: Array<{
    __typename?: "UserGroup";
    id: string;
    name: string;
    members: Array<{
      __typename?: "UserGroupMember";
      user: { __typename?: "User"; id: string; fullName?: string | null; email: string };
    }>;
  }>;
};

export type UserListPopover_UserFragment = {
  __typename?: "User";
  id: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  initials?: string | null;
};

export type UserListPopover_UserGroupFragment = {
  __typename?: "UserGroup";
  id: string;
  name: string;
  initials: string;
};

export type UserSelect_UserFragment = {
  __typename?: "User";
  id: string;
  fullName?: string | null;
  email: string;
};

export type UserSelect_UserGroupFragment = {
  __typename?: "UserGroup";
  id: string;
  name: string;
  members: Array<{
    __typename?: "UserGroupMember";
    user: { __typename?: "User"; id: string; fullName?: string | null; email: string };
  }>;
};

export type UserSelect_canCreateUsersQueryVariables = Exact<{ [key: string]: never }>;

export type UserSelect_canCreateUsersQuery = {
  me: { __typename?: "User"; canCreateUsers: boolean };
};

export type UserSelect_useGetUsersOrGroupsQueryVariables = Exact<{
  ids: Array<Scalars["ID"]> | Scalars["ID"];
}>;

export type UserSelect_useGetUsersOrGroupsQuery = {
  getUsersOrGroups: Array<
    | { __typename?: "User"; id: string; fullName?: string | null; email: string }
    | {
        __typename?: "UserGroup";
        id: string;
        name: string;
        members: Array<{
          __typename?: "UserGroupMember";
          user: { __typename?: "User"; id: string; fullName?: string | null; email: string };
        }>;
      }
  >;
};

export type useSearchUsers_searchUsersQueryVariables = Exact<{
  search: Scalars["String"];
  excludeUsers?: InputMaybe<Array<Scalars["GID"]> | Scalars["GID"]>;
  excludeUserGroups?: InputMaybe<Array<Scalars["GID"]> | Scalars["GID"]>;
  includeGroups?: InputMaybe<Scalars["Boolean"]>;
  includeInactive?: InputMaybe<Scalars["Boolean"]>;
}>;

export type useSearchUsers_searchUsersQuery = {
  searchUsers: Array<
    | { __typename?: "User"; id: string; fullName?: string | null; email: string }
    | {
        __typename?: "UserGroup";
        id: string;
        name: string;
        members: Array<{
          __typename?: "UserGroupMember";
          user: { __typename?: "User"; id: string; fullName?: string | null; email: string };
        }>;
      }
  >;
};

export type FieldErrorDialog_PetitionFieldFragment = {
  __typename?: "PetitionField";
  id: string;
  title?: string | null;
  type: PetitionFieldType;
};

export type TagEditDialog_TagFragment = {
  __typename?: "Tag";
  id: string;
  createdAt: string;
  name: string;
  color: string;
};

export type TagEditDialog_tagsQueryVariables = Exact<{ [key: string]: never }>;

export type TagEditDialog_tagsQuery = {
  tags: {
    __typename?: "TagPagination";
    items: Array<{
      __typename?: "Tag";
      id: string;
      createdAt: string;
      name: string;
      color: string;
    }>;
  };
};

export type TagEditDialog_updateTagMutationVariables = Exact<{
  id: Scalars["GID"];
  data: UpdateTagInput;
}>;

export type TagEditDialog_updateTagMutation = {
  updateTag: { __typename?: "Tag"; id: string; createdAt: string; name: string; color: string };
};

export type TaskProgressDialog_TaskFragment = {
  __typename?: "Task";
  id: string;
  status: TaskStatus;
  progress?: number | null;
};

export type WithAdminOrganizationRoleQueryVariables = Exact<{ [key: string]: never }>;

export type WithAdminOrganizationRoleQuery = {
  me: { __typename?: "User"; role: OrganizationRole };
};

export type HasFeatureFlagQueryVariables = Exact<{
  featureFlag: FeatureFlag;
}>;

export type HasFeatureFlagQuery = {
  me: { __typename?: "User"; id: string; hasFeatureFlag: boolean };
};

export type WithSuperAdminAccessQueryVariables = Exact<{ [key: string]: never }>;

export type WithSuperAdminAccessQuery = { me: { __typename?: "User"; isSuperAdmin: boolean } };

export type useConfirmDeleteContactsDialog_ContactFragment = {
  __typename?: "Contact";
  fullName: string;
  email: string;
};

export type ImportContactsDialog_bulkCreateContactsMutationVariables = Exact<{
  file: Scalars["Upload"];
}>;

export type ImportContactsDialog_bulkCreateContactsMutation = {
  bulkCreateContacts: Array<{ __typename?: "Contact"; id: string }>;
};

export type AppLayout_UserFragment = {
  __typename?: "User";
  id: string;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  createdAt: string;
  canCreateUsers: boolean;
  isSuperAdmin: boolean;
  role: OrganizationRole;
  avatarUrl?: string | null;
  initials?: string | null;
  organization: {
    __typename?: "Organization";
    id: string;
    usageLimits: {
      __typename?: "OrganizationUsageLimit";
      petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
    };
  };
};

export type AppLayoutNavbar_UserFragment = {
  __typename?: "User";
  id: string;
  email: string;
  isSuperAdmin: boolean;
  role: OrganizationRole;
  fullName?: string | null;
  avatarUrl?: string | null;
  initials?: string | null;
  organization: {
    __typename?: "Organization";
    id: string;
    usageLimits: {
      __typename?: "OrganizationUsageLimit";
      petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
    };
  };
};

export type HeaderNameEditable_PetitionBase_Petition_Fragment = {
  __typename?: "Petition";
  name?: string | null;
  updatedAt: string;
};

export type HeaderNameEditable_PetitionBase_PetitionTemplate_Fragment = {
  __typename?: "PetitionTemplate";
  isPublic: boolean;
  name?: string | null;
  updatedAt: string;
};

export type HeaderNameEditable_PetitionBaseFragment =
  | HeaderNameEditable_PetitionBase_Petition_Fragment
  | HeaderNameEditable_PetitionBase_PetitionTemplate_Fragment;

export type PetitionHeader_PetitionFragment = {
  __typename?: "Petition";
  id: string;
  locale: PetitionLocale;
  deadline?: string | null;
  status: PetitionStatus;
  isRestricted: boolean;
  name?: string | null;
  updatedAt: string;
  myEffectivePermission?: {
    __typename?: "EffectivePetitionUserPermission";
    isSubscribed: boolean;
  } | null;
};

export type PetitionHeader_UserFragment = {
  __typename?: "User";
  id: string;
  role: OrganizationRole;
  hasPetitionPdfExport: boolean;
};

export type PetitionHeader_reopenPetitionMutationVariables = Exact<{
  petitionId: Scalars["GID"];
}>;

export type PetitionHeader_reopenPetitionMutation = {
  reopenPetition: {
    __typename?: "Petition";
    id: string;
    status: PetitionStatus;
    updatedAt: string;
  };
};

export type PetitionHeader_updatePetitionPermissionSubscriptionMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  isSubscribed: Scalars["Boolean"];
}>;

export type PetitionHeader_updatePetitionPermissionSubscriptionMutation = {
  updatePetitionPermissionSubscription: {
    __typename?: "Petition";
    id: string;
    myEffectivePermission?: {
      __typename?: "EffectivePetitionUserPermission";
      isSubscribed: boolean;
    } | null;
  };
};

export type PetitionLayout_PetitionBase_Petition_Fragment = {
  __typename?: "Petition";
  id: string;
  name?: string | null;
  locale: PetitionLocale;
  deadline?: string | null;
  status: PetitionStatus;
  isRestricted: boolean;
  updatedAt: string;
  myEffectivePermission?: {
    __typename?: "EffectivePetitionUserPermission";
    isSubscribed: boolean;
  } | null;
};

export type PetitionLayout_PetitionBase_PetitionTemplate_Fragment = {
  __typename?: "PetitionTemplate";
  id: string;
  name?: string | null;
  locale: PetitionLocale;
  isPublic: boolean;
  isRestricted: boolean;
  updatedAt: string;
};

export type PetitionLayout_PetitionBaseFragment =
  | PetitionLayout_PetitionBase_Petition_Fragment
  | PetitionLayout_PetitionBase_PetitionTemplate_Fragment;

export type PetitionLayout_UserFragment = {
  __typename?: "User";
  id: string;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  createdAt: string;
  canCreateUsers: boolean;
  role: OrganizationRole;
  isSuperAdmin: boolean;
  avatarUrl?: string | null;
  initials?: string | null;
  hasPetitionPdfExport: boolean;
  organization: {
    __typename?: "Organization";
    id: string;
    usageLimits: {
      __typename?: "OrganizationUsageLimit";
      petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
    };
  };
};

export type PetitionTemplateHeader_PetitionTemplateFragment = {
  __typename?: "PetitionTemplate";
  id: string;
  locale: PetitionLocale;
  isPublic: boolean;
  isRestricted: boolean;
  name?: string | null;
  updatedAt: string;
};

export type PetitionTemplateHeader_UserFragment = {
  __typename?: "User";
  id: string;
  role: OrganizationRole;
  hasPetitionPdfExport: boolean;
};

export type SettingsLayout_UserFragment = {
  __typename?: "User";
  id: string;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  createdAt: string;
  canCreateUsers: boolean;
  isSuperAdmin: boolean;
  role: OrganizationRole;
  avatarUrl?: string | null;
  initials?: string | null;
  organization: {
    __typename?: "Organization";
    id: string;
    usageLimits: {
      __typename?: "OrganizationUsageLimit";
      petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
    };
  };
};

export type UserMenu_UserFragment = {
  __typename?: "User";
  isSuperAdmin: boolean;
  role: OrganizationRole;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  initials?: string | null;
};

export type Notifications_UnreadPetitionUserNotificationIdsQueryVariables = Exact<{
  [key: string]: never;
}>;

export type Notifications_UnreadPetitionUserNotificationIdsQuery = {
  me: { __typename?: "User"; id: string; unreadNotificationIds: Array<string> };
};

export type NotificationsDrawer_PetitionUserNotification_AccessActivatedFromPublicPetitionLinkUserNotification_Fragment =
  {
    __typename?: "AccessActivatedFromPublicPetitionLinkUserNotification";
    id: string;
    createdAt: string;
    isRead: boolean;
    access: {
      __typename?: "PetitionAccess";
      contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
    };
    petition:
      | { __typename?: "Petition"; id: string; name?: string | null }
      | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
  };

export type NotificationsDrawer_PetitionUserNotification_CommentCreatedUserNotification_Fragment = {
  __typename?: "CommentCreatedUserNotification";
  id: string;
  createdAt: string;
  isRead: boolean;
  field: { __typename?: "PetitionField"; id: string; title?: string | null };
  comment: {
    __typename?: "PetitionFieldComment";
    id: string;
    isInternal: boolean;
    author?:
      | {
          __typename?: "PetitionAccess";
          contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
        }
      | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
      | null;
  };
  petition:
    | { __typename?: "Petition"; id: string; name?: string | null }
    | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
};

export type NotificationsDrawer_PetitionUserNotification_MessageEmailBouncedUserNotification_Fragment =
  {
    __typename?: "MessageEmailBouncedUserNotification";
    id: string;
    createdAt: string;
    isRead: boolean;
    access: {
      __typename?: "PetitionAccess";
      contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
    };
    petition:
      | { __typename?: "Petition"; id: string; name?: string | null }
      | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
  };

export type NotificationsDrawer_PetitionUserNotification_PetitionCompletedUserNotification_Fragment =
  {
    __typename?: "PetitionCompletedUserNotification";
    id: string;
    createdAt: string;
    isRead: boolean;
    completedBy?:
      | {
          __typename?: "PetitionAccess";
          contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
        }
      | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
      | null;
    petition:
      | { __typename?: "Petition"; id: string; name?: string | null }
      | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
  };

export type NotificationsDrawer_PetitionUserNotification_PetitionSharedUserNotification_Fragment = {
  __typename?: "PetitionSharedUserNotification";
  permissionType: PetitionPermissionTypeRW;
  id: string;
  createdAt: string;
  isRead: boolean;
  petition:
    | { __typename: "Petition"; id: string; name?: string | null }
    | { __typename: "PetitionTemplate"; id: string; name?: string | null };
  owner: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus };
  sharedWith:
    | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
    | { __typename?: "UserGroup"; id: string; name: string };
};

export type NotificationsDrawer_PetitionUserNotification_ReminderEmailBouncedUserNotification_Fragment =
  {
    __typename?: "ReminderEmailBouncedUserNotification";
    id: string;
    createdAt: string;
    isRead: boolean;
    access: {
      __typename?: "PetitionAccess";
      contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
    };
    petition:
      | { __typename?: "Petition"; id: string; name?: string | null }
      | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
  };

export type NotificationsDrawer_PetitionUserNotification_RemindersOptOutNotification_Fragment = {
  __typename?: "RemindersOptOutNotification";
  reason: string;
  other?: string | null;
  id: string;
  createdAt: string;
  isRead: boolean;
  access: {
    __typename?: "PetitionAccess";
    contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
  };
  petition:
    | { __typename?: "Petition"; id: string; name?: string | null }
    | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
};

export type NotificationsDrawer_PetitionUserNotification_SignatureCancelledUserNotification_Fragment =
  {
    __typename?: "SignatureCancelledUserNotification";
    errorCode?: string | null;
    extraErrorData?: any | null;
    id: string;
    createdAt: string;
    isRead: boolean;
    petition:
      | { __typename?: "Petition"; id: string; name?: string | null }
      | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
  };

export type NotificationsDrawer_PetitionUserNotification_SignatureCompletedUserNotification_Fragment =
  {
    __typename?: "SignatureCompletedUserNotification";
    id: string;
    createdAt: string;
    isRead: boolean;
    petition:
      | { __typename?: "Petition"; id: string; name?: string | null }
      | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
  };

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

export type NotificationsDrawer_notificationsQueryVariables = Exact<{
  limit: Scalars["Int"];
  before?: InputMaybe<Scalars["DateTime"]>;
  filter?: InputMaybe<PetitionUserNotificationFilter>;
}>;

export type NotificationsDrawer_notificationsQuery = {
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
              contact?: {
                __typename?: "Contact";
                id: string;
                fullName: string;
                email: string;
              } | null;
            };
            petition:
              | { __typename?: "Petition"; id: string; name?: string | null }
              | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
          }
        | {
            __typename?: "CommentCreatedUserNotification";
            id: string;
            createdAt: string;
            isRead: boolean;
            field: { __typename?: "PetitionField"; id: string; title?: string | null };
            comment: {
              __typename?: "PetitionFieldComment";
              id: string;
              isInternal: boolean;
              author?:
                | {
                    __typename?: "PetitionAccess";
                    contact?: {
                      __typename?: "Contact";
                      id: string;
                      fullName: string;
                      email: string;
                    } | null;
                  }
                | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
                | null;
            };
            petition:
              | { __typename?: "Petition"; id: string; name?: string | null }
              | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
          }
        | {
            __typename?: "MessageEmailBouncedUserNotification";
            id: string;
            createdAt: string;
            isRead: boolean;
            access: {
              __typename?: "PetitionAccess";
              contact?: {
                __typename?: "Contact";
                id: string;
                fullName: string;
                email: string;
              } | null;
            };
            petition:
              | { __typename?: "Petition"; id: string; name?: string | null }
              | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
          }
        | {
            __typename?: "PetitionCompletedUserNotification";
            id: string;
            createdAt: string;
            isRead: boolean;
            completedBy?:
              | {
                  __typename?: "PetitionAccess";
                  contact?: {
                    __typename?: "Contact";
                    id: string;
                    fullName: string;
                    email: string;
                  } | null;
                }
              | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
              | null;
            petition:
              | { __typename?: "Petition"; id: string; name?: string | null }
              | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
          }
        | {
            __typename?: "PetitionSharedUserNotification";
            permissionType: PetitionPermissionTypeRW;
            id: string;
            createdAt: string;
            isRead: boolean;
            petition:
              | { __typename: "Petition"; id: string; name?: string | null }
              | { __typename: "PetitionTemplate"; id: string; name?: string | null };
            owner: {
              __typename?: "User";
              id: string;
              fullName?: string | null;
              status: UserStatus;
            };
            sharedWith:
              | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
              | { __typename?: "UserGroup"; id: string; name: string };
          }
        | {
            __typename?: "ReminderEmailBouncedUserNotification";
            id: string;
            createdAt: string;
            isRead: boolean;
            access: {
              __typename?: "PetitionAccess";
              contact?: {
                __typename?: "Contact";
                id: string;
                fullName: string;
                email: string;
              } | null;
            };
            petition:
              | { __typename?: "Petition"; id: string; name?: string | null }
              | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
          }
        | {
            __typename?: "RemindersOptOutNotification";
            reason: string;
            other?: string | null;
            id: string;
            createdAt: string;
            isRead: boolean;
            access: {
              __typename?: "PetitionAccess";
              contact?: {
                __typename?: "Contact";
                id: string;
                fullName: string;
                email: string;
              } | null;
            };
            petition:
              | { __typename?: "Petition"; id: string; name?: string | null }
              | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
          }
        | {
            __typename?: "SignatureCancelledUserNotification";
            errorCode?: string | null;
            extraErrorData?: any | null;
            id: string;
            createdAt: string;
            isRead: boolean;
            petition:
              | { __typename?: "Petition"; id: string; name?: string | null }
              | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
          }
        | {
            __typename?: "SignatureCompletedUserNotification";
            id: string;
            createdAt: string;
            isRead: boolean;
            petition:
              | { __typename?: "Petition"; id: string; name?: string | null }
              | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
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
      contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
    };
    petition:
      | { __typename?: "Petition"; id: string; name?: string | null }
      | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
  };

export type NotificationsList_PetitionUserNotification_CommentCreatedUserNotification_Fragment = {
  __typename?: "CommentCreatedUserNotification";
  id: string;
  createdAt: string;
  isRead: boolean;
  field: { __typename?: "PetitionField"; id: string; title?: string | null };
  comment: {
    __typename?: "PetitionFieldComment";
    id: string;
    isInternal: boolean;
    author?:
      | {
          __typename?: "PetitionAccess";
          contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
        }
      | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
      | null;
  };
  petition:
    | { __typename?: "Petition"; id: string; name?: string | null }
    | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
};

export type NotificationsList_PetitionUserNotification_MessageEmailBouncedUserNotification_Fragment =
  {
    __typename?: "MessageEmailBouncedUserNotification";
    id: string;
    createdAt: string;
    isRead: boolean;
    access: {
      __typename?: "PetitionAccess";
      contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
    };
    petition:
      | { __typename?: "Petition"; id: string; name?: string | null }
      | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
  };

export type NotificationsList_PetitionUserNotification_PetitionCompletedUserNotification_Fragment =
  {
    __typename?: "PetitionCompletedUserNotification";
    id: string;
    createdAt: string;
    isRead: boolean;
    completedBy?:
      | {
          __typename?: "PetitionAccess";
          contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
        }
      | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
      | null;
    petition:
      | { __typename?: "Petition"; id: string; name?: string | null }
      | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
  };

export type NotificationsList_PetitionUserNotification_PetitionSharedUserNotification_Fragment = {
  __typename?: "PetitionSharedUserNotification";
  permissionType: PetitionPermissionTypeRW;
  id: string;
  createdAt: string;
  isRead: boolean;
  petition:
    | { __typename: "Petition"; id: string; name?: string | null }
    | { __typename: "PetitionTemplate"; id: string; name?: string | null };
  owner: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus };
  sharedWith:
    | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
    | { __typename?: "UserGroup"; id: string; name: string };
};

export type NotificationsList_PetitionUserNotification_ReminderEmailBouncedUserNotification_Fragment =
  {
    __typename?: "ReminderEmailBouncedUserNotification";
    id: string;
    createdAt: string;
    isRead: boolean;
    access: {
      __typename?: "PetitionAccess";
      contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
    };
    petition:
      | { __typename?: "Petition"; id: string; name?: string | null }
      | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
  };

export type NotificationsList_PetitionUserNotification_RemindersOptOutNotification_Fragment = {
  __typename?: "RemindersOptOutNotification";
  reason: string;
  other?: string | null;
  id: string;
  createdAt: string;
  isRead: boolean;
  access: {
    __typename?: "PetitionAccess";
    contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
  };
  petition:
    | { __typename?: "Petition"; id: string; name?: string | null }
    | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
};

export type NotificationsList_PetitionUserNotification_SignatureCancelledUserNotification_Fragment =
  {
    __typename?: "SignatureCancelledUserNotification";
    errorCode?: string | null;
    extraErrorData?: any | null;
    id: string;
    createdAt: string;
    isRead: boolean;
    petition:
      | { __typename?: "Petition"; id: string; name?: string | null }
      | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
  };

export type NotificationsList_PetitionUserNotification_SignatureCompletedUserNotification_Fragment =
  {
    __typename?: "SignatureCompletedUserNotification";
    id: string;
    createdAt: string;
    isRead: boolean;
    petition:
      | { __typename?: "Petition"; id: string; name?: string | null }
      | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
  };

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
      contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
    };
    petition:
      | { __typename?: "Petition"; id: string; name?: string | null }
      | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
  };

export type CommentCreatedUserNotification_CommentCreatedUserNotificationFragment = {
  __typename?: "CommentCreatedUserNotification";
  id: string;
  createdAt: string;
  isRead: boolean;
  field: { __typename?: "PetitionField"; id: string; title?: string | null };
  comment: {
    __typename?: "PetitionFieldComment";
    id: string;
    isInternal: boolean;
    author?:
      | {
          __typename?: "PetitionAccess";
          contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
        }
      | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
      | null;
  };
  petition:
    | { __typename?: "Petition"; id: string; name?: string | null }
    | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
};

export type MessageEmailBouncedUserNotification_MessageEmailBouncedUserNotificationFragment = {
  __typename?: "MessageEmailBouncedUserNotification";
  id: string;
  createdAt: string;
  isRead: boolean;
  access: {
    __typename?: "PetitionAccess";
    contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
  };
  petition:
    | { __typename?: "Petition"; id: string; name?: string | null }
    | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
};

export type PetitionCompletedUserNotification_PetitionCompletedUserNotificationFragment = {
  __typename?: "PetitionCompletedUserNotification";
  id: string;
  createdAt: string;
  isRead: boolean;
  completedBy?:
    | {
        __typename?: "PetitionAccess";
        contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
      }
    | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
    | null;
  petition:
    | { __typename?: "Petition"; id: string; name?: string | null }
    | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
};

export type PetitionSharedUserNotification_PetitionSharedUserNotificationFragment = {
  __typename?: "PetitionSharedUserNotification";
  permissionType: PetitionPermissionTypeRW;
  id: string;
  createdAt: string;
  isRead: boolean;
  petition:
    | { __typename: "Petition"; id: string; name?: string | null }
    | { __typename: "PetitionTemplate"; id: string; name?: string | null };
  owner: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus };
  sharedWith:
    | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
    | { __typename?: "UserGroup"; id: string; name: string };
};

export type PetitionUserNotification_PetitionUserNotification_AccessActivatedFromPublicPetitionLinkUserNotification_Fragment =
  {
    __typename?: "AccessActivatedFromPublicPetitionLinkUserNotification";
    id: string;
    createdAt: string;
    isRead: boolean;
    petition:
      | { __typename?: "Petition"; id: string; name?: string | null }
      | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
  };

export type PetitionUserNotification_PetitionUserNotification_CommentCreatedUserNotification_Fragment =
  {
    __typename?: "CommentCreatedUserNotification";
    id: string;
    createdAt: string;
    isRead: boolean;
    petition:
      | { __typename?: "Petition"; id: string; name?: string | null }
      | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
  };

export type PetitionUserNotification_PetitionUserNotification_MessageEmailBouncedUserNotification_Fragment =
  {
    __typename?: "MessageEmailBouncedUserNotification";
    id: string;
    createdAt: string;
    isRead: boolean;
    petition:
      | { __typename?: "Petition"; id: string; name?: string | null }
      | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
  };

export type PetitionUserNotification_PetitionUserNotification_PetitionCompletedUserNotification_Fragment =
  {
    __typename?: "PetitionCompletedUserNotification";
    id: string;
    createdAt: string;
    isRead: boolean;
    petition:
      | { __typename?: "Petition"; id: string; name?: string | null }
      | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
  };

export type PetitionUserNotification_PetitionUserNotification_PetitionSharedUserNotification_Fragment =
  {
    __typename?: "PetitionSharedUserNotification";
    id: string;
    createdAt: string;
    isRead: boolean;
    petition:
      | { __typename?: "Petition"; id: string; name?: string | null }
      | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
  };

export type PetitionUserNotification_PetitionUserNotification_ReminderEmailBouncedUserNotification_Fragment =
  {
    __typename?: "ReminderEmailBouncedUserNotification";
    id: string;
    createdAt: string;
    isRead: boolean;
    petition:
      | { __typename?: "Petition"; id: string; name?: string | null }
      | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
  };

export type PetitionUserNotification_PetitionUserNotification_RemindersOptOutNotification_Fragment =
  {
    __typename?: "RemindersOptOutNotification";
    id: string;
    createdAt: string;
    isRead: boolean;
    petition:
      | { __typename?: "Petition"; id: string; name?: string | null }
      | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
  };

export type PetitionUserNotification_PetitionUserNotification_SignatureCancelledUserNotification_Fragment =
  {
    __typename?: "SignatureCancelledUserNotification";
    id: string;
    createdAt: string;
    isRead: boolean;
    petition:
      | { __typename?: "Petition"; id: string; name?: string | null }
      | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
  };

export type PetitionUserNotification_PetitionUserNotification_SignatureCompletedUserNotification_Fragment =
  {
    __typename?: "SignatureCompletedUserNotification";
    id: string;
    createdAt: string;
    isRead: boolean;
    petition:
      | { __typename?: "Petition"; id: string; name?: string | null }
      | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
  };

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

export type ReminderEmailBouncedUserNotification_ReminderEmailBouncedUserNotificationFragment = {
  __typename?: "ReminderEmailBouncedUserNotification";
  id: string;
  createdAt: string;
  isRead: boolean;
  access: {
    __typename?: "PetitionAccess";
    contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
  };
  petition:
    | { __typename?: "Petition"; id: string; name?: string | null }
    | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
};

export type RemindersOptOutNotification_RemindersOptOutNotificationFragment = {
  __typename?: "RemindersOptOutNotification";
  reason: string;
  other?: string | null;
  id: string;
  createdAt: string;
  isRead: boolean;
  access: {
    __typename?: "PetitionAccess";
    contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
  };
  petition:
    | { __typename?: "Petition"; id: string; name?: string | null }
    | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
};

export type SignatureCancelledUserNotification_SignatureCancelledUserNotificationFragment = {
  __typename?: "SignatureCancelledUserNotification";
  errorCode?: string | null;
  extraErrorData?: any | null;
  id: string;
  createdAt: string;
  isRead: boolean;
  petition:
    | { __typename?: "Petition"; id: string; name?: string | null }
    | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
};

export type SignatureCompletedUserNotification_SignatureCompletedUserNotificationFragment = {
  __typename?: "SignatureCompletedUserNotification";
  id: string;
  createdAt: string;
  isRead: boolean;
  petition:
    | { __typename?: "Petition"; id: string; name?: string | null }
    | { __typename?: "PetitionTemplate"; id: string; name?: string | null };
};

export type OrganizationGroupListTableHeader_UserFragment = {
  __typename?: "User";
  id: string;
  role: OrganizationRole;
};

export type OrganizationGroupsListTableHeader_UserFragment = {
  __typename?: "User";
  id: string;
  role: OrganizationRole;
};

export type OrganizationUsersListTableHeader_UserFragment = {
  __typename?: "User";
  id: string;
  role: OrganizationRole;
};

export type useCreateOrUpdateUserDialog_UserFragment = {
  __typename?: "User";
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  role: OrganizationRole;
  userGroups: Array<{
    __typename?: "UserGroup";
    id: string;
    name: string;
    members: Array<{
      __typename?: "UserGroupMember";
      user: { __typename?: "User"; id: string; fullName?: string | null; email: string };
    }>;
  }>;
};

export type useCreateOrUpdateUserDialog_UserGroupFragment = {
  __typename?: "UserGroup";
  id: string;
  name: string;
  members: Array<{
    __typename?: "UserGroupMember";
    user: { __typename?: "User"; id: string; fullName?: string | null; email: string };
  }>;
};

export type CreateUserDialog_emailIsAvailableQueryVariables = Exact<{
  email: Scalars["String"];
}>;

export type CreateUserDialog_emailIsAvailableQuery = { emailIsAvailable: boolean };

export type EmailEventsIndicator_PetitionMessageFragment = {
  __typename?: "PetitionMessage";
  bouncedAt?: string | null;
  deliveredAt?: string | null;
  openedAt?: string | null;
};

export type EmailEventsIndicator_SignatureStartedEventFragment = {
  __typename?: "SignatureStartedEvent";
  bouncedAt?: string | null;
  deliveredAt?: string | null;
  openedAt?: string | null;
};

export type PetitionAccessTable_PetitionFragment = {
  __typename?: "Petition";
  status: PetitionStatus;
  accesses: Array<{
    __typename?: "PetitionAccess";
    id: string;
    status: PetitionAccessStatus;
    nextReminderAt?: string | null;
    remindersLeft: number;
    reminderCount: number;
    remindersActive: boolean;
    remindersOptOut: boolean;
    createdAt: string;
    contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
    remindersConfig?: {
      __typename?: "RemindersConfig";
      offset: number;
      time: string;
      timezone: string;
      weekdaysOnly: boolean;
    } | null;
  }>;
};

export type PetitionAccessTable_PetitionAccessRemindersConfigFragment = {
  __typename?: "RemindersConfig";
  offset: number;
  time: string;
  timezone: string;
  weekdaysOnly: boolean;
};

export type PetitionAccessTable_PetitionAccessFragment = {
  __typename?: "PetitionAccess";
  id: string;
  status: PetitionAccessStatus;
  nextReminderAt?: string | null;
  remindersLeft: number;
  reminderCount: number;
  remindersActive: boolean;
  remindersOptOut: boolean;
  createdAt: string;
  contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
  remindersConfig?: {
    __typename?: "RemindersConfig";
    offset: number;
    time: string;
    timezone: string;
    weekdaysOnly: boolean;
  } | null;
};

export type PetitionActivityTimeline_PetitionFragment = {
  __typename?: "Petition";
  events: {
    __typename?: "PetitionEventPagination";
    items: Array<
      | {
          __typename?: "AccessActivatedEvent";
          id: string;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
          access: {
            __typename?: "PetitionAccess";
            contact?: {
              __typename?: "Contact";
              id: string;
              fullName: string;
              email: string;
            } | null;
          };
        }
      | {
          __typename?: "AccessActivatedFromPublicPetitionLinkEvent";
          id: string;
          createdAt: string;
          access: {
            __typename?: "PetitionAccess";
            contact?: {
              __typename?: "Contact";
              id: string;
              fullName: string;
              email: string;
            } | null;
          };
        }
      | {
          __typename?: "AccessDeactivatedEvent";
          id: string;
          reason: string;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
          access: {
            __typename?: "PetitionAccess";
            contact?: {
              __typename?: "Contact";
              id: string;
              fullName: string;
              email: string;
            } | null;
          };
        }
      | {
          __typename?: "AccessDelegatedEvent";
          id: string;
          createdAt: string;
          originalAccess: {
            __typename?: "PetitionAccess";
            contact?: {
              __typename?: "Contact";
              id: string;
              fullName: string;
              email: string;
            } | null;
          };
          newAccess: {
            __typename?: "PetitionAccess";
            contact?: {
              __typename?: "Contact";
              id: string;
              fullName: string;
              email: string;
            } | null;
          };
        }
      | {
          __typename?: "AccessOpenedEvent";
          id: string;
          createdAt: string;
          access: {
            __typename?: "PetitionAccess";
            contact?: {
              __typename?: "Contact";
              id: string;
              fullName: string;
              email: string;
            } | null;
          };
        }
      | {
          __typename?: "CommentDeletedEvent";
          id: string;
          createdAt: string;
          field?: { __typename?: "PetitionField"; title?: string | null } | null;
          deletedBy?:
            | {
                __typename?: "PetitionAccess";
                contact?: {
                  __typename?: "Contact";
                  id: string;
                  fullName: string;
                  email: string;
                } | null;
              }
            | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
            | null;
        }
      | {
          __typename?: "CommentPublishedEvent";
          id: string;
          createdAt: string;
          field?: { __typename?: "PetitionField"; title?: string | null } | null;
          comment?: {
            __typename?: "PetitionFieldComment";
            isEdited: boolean;
            content: string;
            author?:
              | {
                  __typename?: "PetitionAccess";
                  contact?: {
                    __typename?: "Contact";
                    id: string;
                    fullName: string;
                    email: string;
                  } | null;
                }
              | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
              | null;
          } | null;
        }
      | {
          __typename?: "GroupPermissionAddedEvent";
          id: string;
          permissionType: PetitionPermissionType;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
          permissionGroup?: { __typename?: "UserGroup"; name: string } | null;
        }
      | {
          __typename?: "GroupPermissionEditedEvent";
          id: string;
          permissionType: PetitionPermissionType;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
          permissionGroup?: { __typename?: "UserGroup"; name: string } | null;
        }
      | {
          __typename?: "GroupPermissionRemovedEvent";
          id: string;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
          permissionGroup?: { __typename?: "UserGroup"; name: string } | null;
        }
      | {
          __typename?: "MessageCancelledEvent";
          id: string;
          reason: string;
          createdAt: string;
          message: {
            __typename?: "PetitionMessage";
            status: PetitionMessageStatus;
            scheduledAt?: string | null;
            emailSubject?: any | null;
            access: {
              __typename?: "PetitionAccess";
              contact?: {
                __typename?: "Contact";
                id: string;
                fullName: string;
                email: string;
              } | null;
            };
          };
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
        }
      | {
          __typename?: "MessageScheduledEvent";
          id: string;
          createdAt: string;
          message: {
            __typename?: "PetitionMessage";
            id: string;
            status: PetitionMessageStatus;
            scheduledAt?: string | null;
            emailSubject?: any | null;
            emailBody?: string | null;
            sentAt?: string | null;
            sender: {
              __typename?: "User";
              id: string;
              fullName?: string | null;
              status: UserStatus;
            };
            access: {
              __typename?: "PetitionAccess";
              contact?: {
                __typename?: "Contact";
                id: string;
                fullName: string;
                email: string;
              } | null;
            };
          };
        }
      | {
          __typename?: "MessageSentEvent";
          id: string;
          createdAt: string;
          message: {
            __typename?: "PetitionMessage";
            emailSubject?: any | null;
            scheduledAt?: string | null;
            bouncedAt?: string | null;
            deliveredAt?: string | null;
            openedAt?: string | null;
            emailBody?: string | null;
            sentAt?: string | null;
            sender: {
              __typename?: "User";
              id: string;
              fullName?: string | null;
              status: UserStatus;
            };
            access: {
              __typename?: "PetitionAccess";
              contact?: {
                __typename?: "Contact";
                id: string;
                fullName: string;
                email: string;
              } | null;
            };
          };
        }
      | {
          __typename?: "OwnershipTransferredEvent";
          id: string;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
          owner?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
          previousOwner?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
        }
      | {
          __typename?: "PetitionClonedEvent";
          id: string;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
        }
      | {
          __typename?: "PetitionClosedEvent";
          id: string;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
        }
      | {
          __typename?: "PetitionClosedNotifiedEvent";
          id: string;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
          access: {
            __typename?: "PetitionAccess";
            contact?: {
              __typename?: "Contact";
              id: string;
              fullName: string;
              email: string;
            } | null;
          };
        }
      | {
          __typename?: "PetitionCompletedEvent";
          id: string;
          createdAt: string;
          completedBy?:
            | {
                __typename?: "PetitionAccess";
                contact?: {
                  __typename?: "Contact";
                  id: string;
                  fullName: string;
                  email: string;
                } | null;
              }
            | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
            | null;
        }
      | {
          __typename?: "PetitionCreatedEvent";
          id: string;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
        }
      | { __typename?: "PetitionDeletedEvent"; id: string }
      | {
          __typename?: "PetitionMessageBouncedEvent";
          id: string;
          createdAt: string;
          message: {
            __typename?: "PetitionMessage";
            access: {
              __typename?: "PetitionAccess";
              contact?: {
                __typename?: "Contact";
                id: string;
                fullName: string;
                email: string;
              } | null;
            };
          };
        }
      | {
          __typename?: "PetitionReminderBouncedEvent";
          id: string;
          createdAt: string;
          reminder: {
            __typename?: "PetitionReminder";
            access: {
              __typename?: "PetitionAccess";
              contact?: {
                __typename?: "Contact";
                id: string;
                fullName: string;
                email: string;
              } | null;
            };
          };
        }
      | {
          __typename?: "PetitionReopenedEvent";
          id: string;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
        }
      | {
          __typename?: "RecipientSignedEvent";
          id: string;
          createdAt: string;
          signer?: { __typename?: "PetitionSigner"; email: string; fullName: string } | null;
        }
      | {
          __typename?: "ReminderSentEvent";
          id: string;
          createdAt: string;
          reminder: {
            __typename?: "PetitionReminder";
            type: PetitionReminderType;
            createdAt: string;
            emailBody?: string | null;
            sender?: {
              __typename?: "User";
              id: string;
              fullName?: string | null;
              status: UserStatus;
            } | null;
            access: {
              __typename?: "PetitionAccess";
              contact?: {
                __typename?: "Contact";
                id: string;
                fullName: string;
                email: string;
              } | null;
            };
          };
        }
      | {
          __typename?: "RemindersOptOutEvent";
          id: string;
          createdAt: string;
          reason: string;
          other?: string | null;
          access: {
            __typename?: "PetitionAccess";
            contact?: {
              __typename?: "Contact";
              id: string;
              fullName: string;
              email: string;
            } | null;
          };
        }
      | {
          __typename?: "ReplyCreatedEvent";
          id: string;
          createdAt: string;
          field?: { __typename?: "PetitionField"; title?: string | null } | null;
          createdBy?:
            | {
                __typename?: "PetitionAccess";
                contact?: {
                  __typename?: "Contact";
                  id: string;
                  fullName: string;
                  email: string;
                } | null;
              }
            | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
            | null;
        }
      | {
          __typename?: "ReplyDeletedEvent";
          id: string;
          createdAt: string;
          field?: { __typename?: "PetitionField"; title?: string | null } | null;
          deletedBy?:
            | {
                __typename?: "PetitionAccess";
                contact?: {
                  __typename?: "Contact";
                  id: string;
                  fullName: string;
                  email: string;
                } | null;
              }
            | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
            | null;
        }
      | {
          __typename?: "ReplyUpdatedEvent";
          id: string;
          createdAt: string;
          field?: { __typename?: "PetitionField"; title?: string | null } | null;
          updatedBy?:
            | {
                __typename?: "PetitionAccess";
                contact?: {
                  __typename?: "Contact";
                  id: string;
                  fullName: string;
                  email: string;
                } | null;
              }
            | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
            | null;
        }
      | {
          __typename?: "SignatureCancelledEvent";
          id: string;
          cancelType: PetitionSignatureCancelReason;
          errorCode?: string | null;
          extraErrorData?: any | null;
          cancellerReason?: string | null;
          createdAt: string;
          cancelledBy?:
            | {
                __typename?: "PetitionAccess";
                contact?: {
                  __typename?: "Contact";
                  id: string;
                  fullName: string;
                  email: string;
                } | null;
              }
            | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
            | null;
          canceller?: { __typename?: "PetitionSigner"; email: string; fullName: string } | null;
        }
      | { __typename?: "SignatureCompletedEvent"; id: string; createdAt: string }
      | {
          __typename?: "SignatureOpenedEvent";
          id: string;
          createdAt: string;
          signer?: { __typename?: "PetitionSigner"; email: string; fullName: string } | null;
        }
      | {
          __typename?: "SignatureReminderEvent";
          id: string;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
        }
      | {
          __typename?: "SignatureStartedEvent";
          id: string;
          createdAt: string;
          bouncedAt?: string | null;
          deliveredAt?: string | null;
          openedAt?: string | null;
        }
      | { __typename?: "TemplateUsedEvent"; id: string }
      | {
          __typename?: "UserPermissionAddedEvent";
          id: string;
          permissionType: PetitionPermissionType;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
          permissionUser?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
        }
      | {
          __typename?: "UserPermissionEditedEvent";
          id: string;
          permissionType: PetitionPermissionType;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
          permissionUser?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
        }
      | {
          __typename?: "UserPermissionRemovedEvent";
          id: string;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
          permissionUser?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
        }
    >;
  };
};

export type PetitionActivityTimeline_PetitionEvent_AccessActivatedEvent_Fragment = {
  __typename?: "AccessActivatedEvent";
  id: string;
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
  access: {
    __typename?: "PetitionAccess";
    contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
  };
};

export type PetitionActivityTimeline_PetitionEvent_AccessActivatedFromPublicPetitionLinkEvent_Fragment =
  {
    __typename?: "AccessActivatedFromPublicPetitionLinkEvent";
    id: string;
    createdAt: string;
    access: {
      __typename?: "PetitionAccess";
      contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
    };
  };

export type PetitionActivityTimeline_PetitionEvent_AccessDeactivatedEvent_Fragment = {
  __typename?: "AccessDeactivatedEvent";
  id: string;
  reason: string;
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
  access: {
    __typename?: "PetitionAccess";
    contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
  };
};

export type PetitionActivityTimeline_PetitionEvent_AccessDelegatedEvent_Fragment = {
  __typename?: "AccessDelegatedEvent";
  id: string;
  createdAt: string;
  originalAccess: {
    __typename?: "PetitionAccess";
    contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
  };
  newAccess: {
    __typename?: "PetitionAccess";
    contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
  };
};

export type PetitionActivityTimeline_PetitionEvent_AccessOpenedEvent_Fragment = {
  __typename?: "AccessOpenedEvent";
  id: string;
  createdAt: string;
  access: {
    __typename?: "PetitionAccess";
    contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
  };
};

export type PetitionActivityTimeline_PetitionEvent_CommentDeletedEvent_Fragment = {
  __typename?: "CommentDeletedEvent";
  id: string;
  createdAt: string;
  field?: { __typename?: "PetitionField"; title?: string | null } | null;
  deletedBy?:
    | {
        __typename?: "PetitionAccess";
        contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
      }
    | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
    | null;
};

export type PetitionActivityTimeline_PetitionEvent_CommentPublishedEvent_Fragment = {
  __typename?: "CommentPublishedEvent";
  id: string;
  createdAt: string;
  field?: { __typename?: "PetitionField"; title?: string | null } | null;
  comment?: {
    __typename?: "PetitionFieldComment";
    isEdited: boolean;
    content: string;
    author?:
      | {
          __typename?: "PetitionAccess";
          contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
        }
      | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
      | null;
  } | null;
};

export type PetitionActivityTimeline_PetitionEvent_GroupPermissionAddedEvent_Fragment = {
  __typename?: "GroupPermissionAddedEvent";
  id: string;
  permissionType: PetitionPermissionType;
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
  permissionGroup?: { __typename?: "UserGroup"; name: string } | null;
};

export type PetitionActivityTimeline_PetitionEvent_GroupPermissionEditedEvent_Fragment = {
  __typename?: "GroupPermissionEditedEvent";
  id: string;
  permissionType: PetitionPermissionType;
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
  permissionGroup?: { __typename?: "UserGroup"; name: string } | null;
};

export type PetitionActivityTimeline_PetitionEvent_GroupPermissionRemovedEvent_Fragment = {
  __typename?: "GroupPermissionRemovedEvent";
  id: string;
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
  permissionGroup?: { __typename?: "UserGroup"; name: string } | null;
};

export type PetitionActivityTimeline_PetitionEvent_MessageCancelledEvent_Fragment = {
  __typename?: "MessageCancelledEvent";
  id: string;
  reason: string;
  createdAt: string;
  message: {
    __typename?: "PetitionMessage";
    status: PetitionMessageStatus;
    scheduledAt?: string | null;
    emailSubject?: any | null;
    access: {
      __typename?: "PetitionAccess";
      contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
    };
  };
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
};

export type PetitionActivityTimeline_PetitionEvent_MessageScheduledEvent_Fragment = {
  __typename?: "MessageScheduledEvent";
  id: string;
  createdAt: string;
  message: {
    __typename?: "PetitionMessage";
    id: string;
    status: PetitionMessageStatus;
    scheduledAt?: string | null;
    emailSubject?: any | null;
    emailBody?: string | null;
    sentAt?: string | null;
    sender: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus };
    access: {
      __typename?: "PetitionAccess";
      contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
    };
  };
};

export type PetitionActivityTimeline_PetitionEvent_MessageSentEvent_Fragment = {
  __typename?: "MessageSentEvent";
  id: string;
  createdAt: string;
  message: {
    __typename?: "PetitionMessage";
    emailSubject?: any | null;
    scheduledAt?: string | null;
    bouncedAt?: string | null;
    deliveredAt?: string | null;
    openedAt?: string | null;
    emailBody?: string | null;
    sentAt?: string | null;
    sender: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus };
    access: {
      __typename?: "PetitionAccess";
      contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
    };
  };
};

export type PetitionActivityTimeline_PetitionEvent_OwnershipTransferredEvent_Fragment = {
  __typename?: "OwnershipTransferredEvent";
  id: string;
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
  owner?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
  previousOwner?: {
    __typename?: "User";
    id: string;
    fullName?: string | null;
    status: UserStatus;
  } | null;
};

export type PetitionActivityTimeline_PetitionEvent_PetitionClonedEvent_Fragment = {
  __typename?: "PetitionClonedEvent";
  id: string;
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
};

export type PetitionActivityTimeline_PetitionEvent_PetitionClosedEvent_Fragment = {
  __typename?: "PetitionClosedEvent";
  id: string;
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
};

export type PetitionActivityTimeline_PetitionEvent_PetitionClosedNotifiedEvent_Fragment = {
  __typename?: "PetitionClosedNotifiedEvent";
  id: string;
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
  access: {
    __typename?: "PetitionAccess";
    contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
  };
};

export type PetitionActivityTimeline_PetitionEvent_PetitionCompletedEvent_Fragment = {
  __typename?: "PetitionCompletedEvent";
  id: string;
  createdAt: string;
  completedBy?:
    | {
        __typename?: "PetitionAccess";
        contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
      }
    | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
    | null;
};

export type PetitionActivityTimeline_PetitionEvent_PetitionCreatedEvent_Fragment = {
  __typename?: "PetitionCreatedEvent";
  id: string;
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
};

export type PetitionActivityTimeline_PetitionEvent_PetitionDeletedEvent_Fragment = {
  __typename?: "PetitionDeletedEvent";
  id: string;
};

export type PetitionActivityTimeline_PetitionEvent_PetitionMessageBouncedEvent_Fragment = {
  __typename?: "PetitionMessageBouncedEvent";
  id: string;
  createdAt: string;
  message: {
    __typename?: "PetitionMessage";
    access: {
      __typename?: "PetitionAccess";
      contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
    };
  };
};

export type PetitionActivityTimeline_PetitionEvent_PetitionReminderBouncedEvent_Fragment = {
  __typename?: "PetitionReminderBouncedEvent";
  id: string;
  createdAt: string;
  reminder: {
    __typename?: "PetitionReminder";
    access: {
      __typename?: "PetitionAccess";
      contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
    };
  };
};

export type PetitionActivityTimeline_PetitionEvent_PetitionReopenedEvent_Fragment = {
  __typename?: "PetitionReopenedEvent";
  id: string;
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
};

export type PetitionActivityTimeline_PetitionEvent_RecipientSignedEvent_Fragment = {
  __typename?: "RecipientSignedEvent";
  id: string;
  createdAt: string;
  signer?: { __typename?: "PetitionSigner"; email: string; fullName: string } | null;
};

export type PetitionActivityTimeline_PetitionEvent_ReminderSentEvent_Fragment = {
  __typename?: "ReminderSentEvent";
  id: string;
  createdAt: string;
  reminder: {
    __typename?: "PetitionReminder";
    type: PetitionReminderType;
    createdAt: string;
    emailBody?: string | null;
    sender?: {
      __typename?: "User";
      id: string;
      fullName?: string | null;
      status: UserStatus;
    } | null;
    access: {
      __typename?: "PetitionAccess";
      contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
    };
  };
};

export type PetitionActivityTimeline_PetitionEvent_RemindersOptOutEvent_Fragment = {
  __typename?: "RemindersOptOutEvent";
  id: string;
  createdAt: string;
  reason: string;
  other?: string | null;
  access: {
    __typename?: "PetitionAccess";
    contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
  };
};

export type PetitionActivityTimeline_PetitionEvent_ReplyCreatedEvent_Fragment = {
  __typename?: "ReplyCreatedEvent";
  id: string;
  createdAt: string;
  field?: { __typename?: "PetitionField"; title?: string | null } | null;
  createdBy?:
    | {
        __typename?: "PetitionAccess";
        contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
      }
    | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
    | null;
};

export type PetitionActivityTimeline_PetitionEvent_ReplyDeletedEvent_Fragment = {
  __typename?: "ReplyDeletedEvent";
  id: string;
  createdAt: string;
  field?: { __typename?: "PetitionField"; title?: string | null } | null;
  deletedBy?:
    | {
        __typename?: "PetitionAccess";
        contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
      }
    | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
    | null;
};

export type PetitionActivityTimeline_PetitionEvent_ReplyUpdatedEvent_Fragment = {
  __typename?: "ReplyUpdatedEvent";
  id: string;
  createdAt: string;
  field?: { __typename?: "PetitionField"; title?: string | null } | null;
  updatedBy?:
    | {
        __typename?: "PetitionAccess";
        contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
      }
    | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
    | null;
};

export type PetitionActivityTimeline_PetitionEvent_SignatureCancelledEvent_Fragment = {
  __typename?: "SignatureCancelledEvent";
  id: string;
  cancelType: PetitionSignatureCancelReason;
  errorCode?: string | null;
  extraErrorData?: any | null;
  cancellerReason?: string | null;
  createdAt: string;
  cancelledBy?:
    | {
        __typename?: "PetitionAccess";
        contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
      }
    | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
    | null;
  canceller?: { __typename?: "PetitionSigner"; email: string; fullName: string } | null;
};

export type PetitionActivityTimeline_PetitionEvent_SignatureCompletedEvent_Fragment = {
  __typename?: "SignatureCompletedEvent";
  id: string;
  createdAt: string;
};

export type PetitionActivityTimeline_PetitionEvent_SignatureOpenedEvent_Fragment = {
  __typename?: "SignatureOpenedEvent";
  id: string;
  createdAt: string;
  signer?: { __typename?: "PetitionSigner"; email: string; fullName: string } | null;
};

export type PetitionActivityTimeline_PetitionEvent_SignatureReminderEvent_Fragment = {
  __typename?: "SignatureReminderEvent";
  id: string;
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
};

export type PetitionActivityTimeline_PetitionEvent_SignatureStartedEvent_Fragment = {
  __typename?: "SignatureStartedEvent";
  id: string;
  createdAt: string;
  bouncedAt?: string | null;
  deliveredAt?: string | null;
  openedAt?: string | null;
};

export type PetitionActivityTimeline_PetitionEvent_TemplateUsedEvent_Fragment = {
  __typename?: "TemplateUsedEvent";
  id: string;
};

export type PetitionActivityTimeline_PetitionEvent_UserPermissionAddedEvent_Fragment = {
  __typename?: "UserPermissionAddedEvent";
  id: string;
  permissionType: PetitionPermissionType;
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
  permissionUser?: {
    __typename?: "User";
    id: string;
    fullName?: string | null;
    status: UserStatus;
  } | null;
};

export type PetitionActivityTimeline_PetitionEvent_UserPermissionEditedEvent_Fragment = {
  __typename?: "UserPermissionEditedEvent";
  id: string;
  permissionType: PetitionPermissionType;
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
  permissionUser?: {
    __typename?: "User";
    id: string;
    fullName?: string | null;
    status: UserStatus;
  } | null;
};

export type PetitionActivityTimeline_PetitionEvent_UserPermissionRemovedEvent_Fragment = {
  __typename?: "UserPermissionRemovedEvent";
  id: string;
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
  permissionUser?: {
    __typename?: "User";
    id: string;
    fullName?: string | null;
    status: UserStatus;
  } | null;
};

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
  | PetitionActivityTimeline_PetitionEvent_PetitionMessageBouncedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_PetitionReminderBouncedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_PetitionReopenedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_RecipientSignedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_ReminderSentEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_RemindersOptOutEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_ReplyCreatedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_ReplyDeletedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_ReplyUpdatedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_SignatureCancelledEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_SignatureCompletedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_SignatureOpenedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_SignatureReminderEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_SignatureStartedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_TemplateUsedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_UserPermissionAddedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_UserPermissionEditedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_UserPermissionRemovedEvent_Fragment;

export type PetitionFieldReference_PetitionFieldFragment = {
  __typename?: "PetitionField";
  title?: string | null;
};

export type UserGroupReference_UserGroupFragment = { __typename?: "UserGroup"; name: string };

export type UserOrContactReference_UserOrPetitionAccess_PetitionAccess_Fragment = {
  __typename?: "PetitionAccess";
  contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
};

export type UserOrContactReference_UserOrPetitionAccess_User_Fragment = {
  __typename?: "User";
  id: string;
  fullName?: string | null;
  status: UserStatus;
};

export type UserOrContactReference_UserOrPetitionAccessFragment =
  | UserOrContactReference_UserOrPetitionAccess_PetitionAccess_Fragment
  | UserOrContactReference_UserOrPetitionAccess_User_Fragment;

export type UserReference_UserFragment = {
  __typename?: "User";
  id: string;
  fullName?: string | null;
  status: UserStatus;
};

export type AddPetitionAccessDialog_PetitionFragment = {
  __typename?: "Petition";
  id: string;
  emailSubject?: string | null;
  emailBody?: any | null;
  signatureConfig?: {
    __typename?: "SignatureConfig";
    signers: Array<{ __typename?: "PetitionSigner"; email: string; fullName: string }>;
  } | null;
  remindersConfig?: {
    __typename?: "RemindersConfig";
    offset: number;
    time: string;
    timezone: string;
    weekdaysOnly: boolean;
  } | null;
  organization: {
    __typename?: "Organization";
    id: string;
    usageLimits: {
      __typename?: "OrganizationUsageLimit";
      petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
    };
  };
};

export type SentPetitionMessageDialog_PetitionMessageFragment = {
  __typename?: "PetitionMessage";
  emailBody?: string | null;
  emailSubject?: any | null;
  sentAt?: string | null;
  scheduledAt?: string | null;
  access: {
    __typename?: "PetitionAccess";
    contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
  };
};

export type SentReminderMessageDialog_PetitionReminderFragment = {
  __typename?: "PetitionReminder";
  createdAt: string;
  emailBody?: string | null;
  access: {
    __typename?: "PetitionAccess";
    contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
  };
};

export type TimelineAccessActivatedEvent_AccessActivatedEventFragment = {
  __typename?: "AccessActivatedEvent";
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
  access: {
    __typename?: "PetitionAccess";
    contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
  };
};

export type TimelineAccessActivatedFromLinkEvent_AccessActivatedFromPublicPetitionLinkEventFragment =
  {
    __typename?: "AccessActivatedFromPublicPetitionLinkEvent";
    createdAt: string;
    access: {
      __typename?: "PetitionAccess";
      contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
    };
  };

export type TimelineAccessDeactivatedEvent_AccessDeactivatedEventFragment = {
  __typename?: "AccessDeactivatedEvent";
  reason: string;
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
  access: {
    __typename?: "PetitionAccess";
    contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
  };
};

export type TimelineAccessDelegatedEvent_AccessDelegatedEventFragment = {
  __typename?: "AccessDelegatedEvent";
  createdAt: string;
  originalAccess: {
    __typename?: "PetitionAccess";
    contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
  };
  newAccess: {
    __typename?: "PetitionAccess";
    contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
  };
};

export type TimelineAccessOpenedEvent_AccessOpenedEventFragment = {
  __typename?: "AccessOpenedEvent";
  createdAt: string;
  access: {
    __typename?: "PetitionAccess";
    contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
  };
};

export type TimelineCommentDeletedEvent_CommentDeletedEventFragment = {
  __typename?: "CommentDeletedEvent";
  createdAt: string;
  field?: { __typename?: "PetitionField"; title?: string | null } | null;
  deletedBy?:
    | {
        __typename?: "PetitionAccess";
        contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
      }
    | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
    | null;
};

export type TimelineCommentPublishedEvent_CommentPublishedEventFragment = {
  __typename?: "CommentPublishedEvent";
  createdAt: string;
  field?: { __typename?: "PetitionField"; title?: string | null } | null;
  comment?: {
    __typename?: "PetitionFieldComment";
    isEdited: boolean;
    content: string;
    author?:
      | {
          __typename?: "PetitionAccess";
          contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
        }
      | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
      | null;
  } | null;
};

export type TimelineGroupPermissionAddedEvent_GroupPermissionAddedEventFragment = {
  __typename?: "GroupPermissionAddedEvent";
  permissionType: PetitionPermissionType;
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
  permissionGroup?: { __typename?: "UserGroup"; name: string } | null;
};

export type TimelineGroupPermissionEditedEvent_GroupPermissionEditedEventFragment = {
  __typename?: "GroupPermissionEditedEvent";
  permissionType: PetitionPermissionType;
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
  permissionGroup?: { __typename?: "UserGroup"; name: string } | null;
};

export type TimelineGroupPermissionRemovedEvent_GroupPermissionRemovedEventFragment = {
  __typename?: "GroupPermissionRemovedEvent";
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
  permissionGroup?: { __typename?: "UserGroup"; name: string } | null;
};

export type TimelineMessageCancelledEvent_MessageCancelledEventFragment = {
  __typename?: "MessageCancelledEvent";
  reason: string;
  createdAt: string;
  message: {
    __typename?: "PetitionMessage";
    status: PetitionMessageStatus;
    scheduledAt?: string | null;
    emailSubject?: any | null;
    access: {
      __typename?: "PetitionAccess";
      contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
    };
  };
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
};

export type TimelineMessageScheduledEvent_MessageScheduledEventFragment = {
  __typename?: "MessageScheduledEvent";
  createdAt: string;
  message: {
    __typename?: "PetitionMessage";
    status: PetitionMessageStatus;
    scheduledAt?: string | null;
    emailSubject?: any | null;
    emailBody?: string | null;
    sentAt?: string | null;
    sender: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus };
    access: {
      __typename?: "PetitionAccess";
      contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
    };
  };
};

export type TimelineMessageSentEvent_MessageSentEventFragment = {
  __typename?: "MessageSentEvent";
  createdAt: string;
  message: {
    __typename?: "PetitionMessage";
    emailSubject?: any | null;
    scheduledAt?: string | null;
    bouncedAt?: string | null;
    deliveredAt?: string | null;
    openedAt?: string | null;
    emailBody?: string | null;
    sentAt?: string | null;
    sender: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus };
    access: {
      __typename?: "PetitionAccess";
      contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
    };
  };
};

export type TimelineOwnershipTransferredEvent_OwnershipTransferredEventFragment = {
  __typename?: "OwnershipTransferredEvent";
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
  owner?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
  previousOwner?: {
    __typename?: "User";
    id: string;
    fullName?: string | null;
    status: UserStatus;
  } | null;
};

export type TimelinePetitionClonedEvent_PetitionClonedEventFragment = {
  __typename?: "PetitionClonedEvent";
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
};

export type TimelinePetitionClosedEvent_PetitionClosedEventFragment = {
  __typename?: "PetitionClosedEvent";
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
};

export type TimelinePetitionClosedNotifiedEvent_PetitionClosedNotifiedEventFragment = {
  __typename?: "PetitionClosedNotifiedEvent";
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
  access: {
    __typename?: "PetitionAccess";
    contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
  };
};

export type TimelinePetitionCompletedEvent_PetitionCompletedEventFragment = {
  __typename?: "PetitionCompletedEvent";
  createdAt: string;
  completedBy?:
    | {
        __typename?: "PetitionAccess";
        contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
      }
    | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
    | null;
};

export type TimelinePetitionCreatedEvent_PetitionCreatedEventFragment = {
  __typename?: "PetitionCreatedEvent";
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
};

export type TimelinePetitionMessageBouncedEvent_PetitionMessageBouncedEventFragment = {
  __typename?: "PetitionMessageBouncedEvent";
  createdAt: string;
  message: {
    __typename?: "PetitionMessage";
    access: {
      __typename?: "PetitionAccess";
      contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
    };
  };
};

export type TimelinePetitionReminderBouncedEvent_PetitionReminderBouncedEventFragment = {
  __typename?: "PetitionReminderBouncedEvent";
  createdAt: string;
  reminder: {
    __typename?: "PetitionReminder";
    access: {
      __typename?: "PetitionAccess";
      contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
    };
  };
};

export type TimelinePetitionReopenedEvent_PetitionReopenedEventFragment = {
  __typename?: "PetitionReopenedEvent";
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
};

export type TimelineRecipientSignedEvent_RecipientSignedEventFragment = {
  __typename?: "RecipientSignedEvent";
  createdAt: string;
  signer?: { __typename?: "PetitionSigner"; email: string; fullName: string } | null;
};

export type TimelineReminderSentEvent_ReminderSentEventFragment = {
  __typename?: "ReminderSentEvent";
  createdAt: string;
  reminder: {
    __typename?: "PetitionReminder";
    type: PetitionReminderType;
    createdAt: string;
    emailBody?: string | null;
    sender?: {
      __typename?: "User";
      id: string;
      fullName?: string | null;
      status: UserStatus;
    } | null;
    access: {
      __typename?: "PetitionAccess";
      contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
    };
  };
};

export type TimelineRemindersOptOutEvent_RemindersOptOutEventFragment = {
  __typename?: "RemindersOptOutEvent";
  createdAt: string;
  reason: string;
  other?: string | null;
  access: {
    __typename?: "PetitionAccess";
    contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
  };
};

export type TimelineReplyCreatedEvent_ReplyCreatedEventFragment = {
  __typename?: "ReplyCreatedEvent";
  createdAt: string;
  field?: { __typename?: "PetitionField"; title?: string | null } | null;
  createdBy?:
    | {
        __typename?: "PetitionAccess";
        contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
      }
    | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
    | null;
};

export type TimelineReplyDeletedEvent_ReplyDeletedEventFragment = {
  __typename?: "ReplyDeletedEvent";
  createdAt: string;
  field?: { __typename?: "PetitionField"; title?: string | null } | null;
  deletedBy?:
    | {
        __typename?: "PetitionAccess";
        contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
      }
    | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
    | null;
};

export type TimelineReplyUpdatedEvent_ReplyUpdatedEventFragment = {
  __typename?: "ReplyUpdatedEvent";
  createdAt: string;
  field?: { __typename?: "PetitionField"; title?: string | null } | null;
  updatedBy?:
    | {
        __typename?: "PetitionAccess";
        contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
      }
    | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
    | null;
};

export type TimelineSignatureCancelledEvent_SignatureCancelledEventFragment = {
  __typename?: "SignatureCancelledEvent";
  cancelType: PetitionSignatureCancelReason;
  errorCode?: string | null;
  extraErrorData?: any | null;
  cancellerReason?: string | null;
  createdAt: string;
  cancelledBy?:
    | {
        __typename?: "PetitionAccess";
        contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
      }
    | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
    | null;
  canceller?: { __typename?: "PetitionSigner"; email: string; fullName: string } | null;
};

export type TimelineSignatureCompletedEvent_SignatureCompletedEventFragment = {
  __typename?: "SignatureCompletedEvent";
  createdAt: string;
};

export type TimelineSignatureOpenedEvent_SignatureOpenedEventFragment = {
  __typename?: "SignatureOpenedEvent";
  createdAt: string;
  signer?: { __typename?: "PetitionSigner"; email: string; fullName: string } | null;
};

export type TimelineSignatureReminderEvent_SignatureReminderEventFragment = {
  __typename?: "SignatureReminderEvent";
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
};

export type TimelineSignatureStartedEvent_SignatureStartedEventFragment = {
  __typename?: "SignatureStartedEvent";
  createdAt: string;
  bouncedAt?: string | null;
  deliveredAt?: string | null;
  openedAt?: string | null;
};

export type TimelineUserPermissionAddedEvent_UserPermissionAddedEventFragment = {
  __typename?: "UserPermissionAddedEvent";
  permissionType: PetitionPermissionType;
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
  permissionUser?: {
    __typename?: "User";
    id: string;
    fullName?: string | null;
    status: UserStatus;
  } | null;
};

export type TimelineUserPermissionEditedEvent_UserPermissionEditedEventFragment = {
  __typename?: "UserPermissionEditedEvent";
  permissionType: PetitionPermissionType;
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
  permissionUser?: {
    __typename?: "User";
    id: string;
    fullName?: string | null;
    status: UserStatus;
  } | null;
};

export type TimelineUserPermissionRemovedEvent_UserPermissionRemovedEventFragment = {
  __typename?: "UserPermissionRemovedEvent";
  createdAt: string;
  user?: { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus } | null;
  permissionUser?: {
    __typename?: "User";
    id: string;
    fullName?: string | null;
    status: UserStatus;
  } | null;
};

export type PetitionContents_PetitionFieldFragment = {
  __typename?: "PetitionField";
  id: string;
  title?: string | null;
  type: PetitionFieldType;
  options: { [key: string]: any };
  isInternal: boolean;
  isReadOnly: boolean;
  comments: Array<{ __typename?: "PetitionFieldComment"; id: string }>;
  replies: Array<{
    __typename?: "PetitionFieldReply";
    id: string;
    status: PetitionFieldReplyStatus;
  }>;
};

export type SelectedSignerRow_PetitionSignerFragment = {
  __typename?: "PetitionSigner";
  firstName: string;
  lastName?: string | null;
  email: string;
};

export type SuggestedSigners_PetitionSignerFragment = {
  __typename?: "PetitionSigner";
  firstName: string;
  lastName?: string | null;
  email: string;
};

export type TestModeSignatureBadge_UserFragment = {
  __typename?: "User";
  hasPetitionSignature: boolean;
};

export type ConfirmPetitionSignersDialog_UserFragment = {
  __typename?: "User";
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

export type ConfirmPetitionSignersDialog_PetitionAccessFragment = {
  __typename?: "PetitionAccess";
  id: string;
  status: PetitionAccessStatus;
  contact?: {
    __typename?: "Contact";
    id: string;
    email: string;
    firstName: string;
    lastName?: string | null;
  } | null;
};

export type ConfirmPetitionSignersDialog_PetitionSignerFragment = {
  __typename?: "PetitionSigner";
  contactId?: string | null;
  email: string;
  firstName: string;
  lastName?: string | null;
};

export type PetitionSharingModal_Petition_Petition_Fragment = {
  __typename?: "Petition";
  id: string;
  name?: string | null;
  permissions: Array<
    | {
        __typename?: "PetitionUserGroupPermission";
        permissionType: PetitionPermissionType;
        group: {
          __typename?: "UserGroup";
          id: string;
          name: string;
          initials: string;
          members: Array<{
            __typename?: "UserGroupMember";
            user: {
              __typename?: "User";
              id: string;
              email: string;
              fullName?: string | null;
              avatarUrl?: string | null;
              initials?: string | null;
            };
          }>;
        };
      }
    | {
        __typename?: "PetitionUserPermission";
        permissionType: PetitionPermissionType;
        user: {
          __typename?: "User";
          id: string;
          email: string;
          fullName?: string | null;
          avatarUrl?: string | null;
          initials?: string | null;
        };
      }
  >;
};

export type PetitionSharingModal_Petition_PetitionTemplate_Fragment = {
  __typename?: "PetitionTemplate";
  id: string;
  name?: string | null;
  permissions: Array<
    | {
        __typename?: "PetitionUserGroupPermission";
        permissionType: PetitionPermissionType;
        group: {
          __typename?: "UserGroup";
          id: string;
          name: string;
          initials: string;
          members: Array<{
            __typename?: "UserGroupMember";
            user: {
              __typename?: "User";
              id: string;
              email: string;
              fullName?: string | null;
              avatarUrl?: string | null;
              initials?: string | null;
            };
          }>;
        };
      }
    | {
        __typename?: "PetitionUserPermission";
        permissionType: PetitionPermissionType;
        user: {
          __typename?: "User";
          id: string;
          email: string;
          fullName?: string | null;
          avatarUrl?: string | null;
          initials?: string | null;
        };
      }
  >;
};

export type PetitionSharingModal_PetitionFragment =
  | PetitionSharingModal_Petition_Petition_Fragment
  | PetitionSharingModal_Petition_PetitionTemplate_Fragment;

export type PetitionSharingModal_PetitionUserPermissionFragment = {
  __typename?: "PetitionUserPermission";
  permissionType: PetitionPermissionType;
  user: {
    __typename?: "User";
    id: string;
    email: string;
    fullName?: string | null;
    avatarUrl?: string | null;
    initials?: string | null;
  };
};

export type PetitionSharingModal_PetitionUserGroupPermissionFragment = {
  __typename?: "PetitionUserGroupPermission";
  permissionType: PetitionPermissionType;
  group: {
    __typename?: "UserGroup";
    id: string;
    name: string;
    initials: string;
    members: Array<{
      __typename?: "UserGroupMember";
      user: {
        __typename?: "User";
        id: string;
        email: string;
        fullName?: string | null;
        avatarUrl?: string | null;
        initials?: string | null;
      };
    }>;
  };
};

export type PetitionSharingModal_UserFragment = {
  __typename?: "User";
  id: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  initials?: string | null;
};

export type PetitionSharingModal_UserGroupFragment = {
  __typename?: "UserGroup";
  id: string;
  name: string;
  initials: string;
  members: Array<{
    __typename?: "UserGroupMember";
    user: {
      __typename?: "User";
      id: string;
      email: string;
      fullName?: string | null;
      avatarUrl?: string | null;
      initials?: string | null;
    };
  }>;
};

export type PetitionSharingModal_addPetitionPermissionMutationVariables = Exact<{
  petitionIds: Array<Scalars["GID"]> | Scalars["GID"];
  userIds?: InputMaybe<Array<Scalars["GID"]> | Scalars["GID"]>;
  userGroupIds?: InputMaybe<Array<Scalars["GID"]> | Scalars["GID"]>;
  permissionType: PetitionPermissionTypeRW;
  notify?: InputMaybe<Scalars["Boolean"]>;
  subscribe?: InputMaybe<Scalars["Boolean"]>;
  message?: InputMaybe<Scalars["String"]>;
}>;

export type PetitionSharingModal_addPetitionPermissionMutation = {
  addPetitionPermission: Array<
    | {
        __typename?: "Petition";
        id: string;
        name?: string | null;
        permissions: Array<
          | {
              __typename?: "PetitionUserGroupPermission";
              permissionType: PetitionPermissionType;
              group: {
                __typename?: "UserGroup";
                id: string;
                name: string;
                initials: string;
                members: Array<{
                  __typename?: "UserGroupMember";
                  user: {
                    __typename?: "User";
                    id: string;
                    email: string;
                    fullName?: string | null;
                    avatarUrl?: string | null;
                    initials?: string | null;
                  };
                }>;
              };
            }
          | {
              __typename?: "PetitionUserPermission";
              permissionType: PetitionPermissionType;
              user: {
                __typename?: "User";
                id: string;
                email: string;
                fullName?: string | null;
                avatarUrl?: string | null;
                initials?: string | null;
              };
            }
        >;
      }
    | {
        __typename?: "PetitionTemplate";
        id: string;
        name?: string | null;
        permissions: Array<
          | {
              __typename?: "PetitionUserGroupPermission";
              permissionType: PetitionPermissionType;
              group: {
                __typename?: "UserGroup";
                id: string;
                name: string;
                initials: string;
                members: Array<{
                  __typename?: "UserGroupMember";
                  user: {
                    __typename?: "User";
                    id: string;
                    email: string;
                    fullName?: string | null;
                    avatarUrl?: string | null;
                    initials?: string | null;
                  };
                }>;
              };
            }
          | {
              __typename?: "PetitionUserPermission";
              permissionType: PetitionPermissionType;
              user: {
                __typename?: "User";
                id: string;
                email: string;
                fullName?: string | null;
                avatarUrl?: string | null;
                initials?: string | null;
              };
            }
        >;
      }
  >;
};

export type PetitionSharingModal_removePetitionPermissionMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  userIds?: InputMaybe<Array<Scalars["GID"]> | Scalars["GID"]>;
  userGroupIds?: InputMaybe<Array<Scalars["GID"]> | Scalars["GID"]>;
}>;

export type PetitionSharingModal_removePetitionPermissionMutation = {
  removePetitionPermission: Array<
    | {
        __typename?: "Petition";
        id: string;
        name?: string | null;
        permissions: Array<
          | {
              __typename?: "PetitionUserGroupPermission";
              permissionType: PetitionPermissionType;
              group: {
                __typename?: "UserGroup";
                id: string;
                name: string;
                initials: string;
                members: Array<{
                  __typename?: "UserGroupMember";
                  user: {
                    __typename?: "User";
                    id: string;
                    email: string;
                    fullName?: string | null;
                    avatarUrl?: string | null;
                    initials?: string | null;
                  };
                }>;
              };
            }
          | {
              __typename?: "PetitionUserPermission";
              permissionType: PetitionPermissionType;
              user: {
                __typename?: "User";
                id: string;
                email: string;
                fullName?: string | null;
                avatarUrl?: string | null;
                initials?: string | null;
              };
            }
        >;
      }
    | {
        __typename?: "PetitionTemplate";
        id: string;
        name?: string | null;
        permissions: Array<
          | {
              __typename?: "PetitionUserGroupPermission";
              permissionType: PetitionPermissionType;
              group: {
                __typename?: "UserGroup";
                id: string;
                name: string;
                initials: string;
                members: Array<{
                  __typename?: "UserGroupMember";
                  user: {
                    __typename?: "User";
                    id: string;
                    email: string;
                    fullName?: string | null;
                    avatarUrl?: string | null;
                    initials?: string | null;
                  };
                }>;
              };
            }
          | {
              __typename?: "PetitionUserPermission";
              permissionType: PetitionPermissionType;
              user: {
                __typename?: "User";
                id: string;
                email: string;
                fullName?: string | null;
                avatarUrl?: string | null;
                initials?: string | null;
              };
            }
        >;
      }
  >;
};

export type PetitionSharingModal_transferPetitionOwnershipMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  userId: Scalars["GID"];
}>;

export type PetitionSharingModal_transferPetitionOwnershipMutation = {
  transferPetitionOwnership: Array<
    | {
        __typename?: "Petition";
        id: string;
        name?: string | null;
        permissions: Array<
          | {
              __typename?: "PetitionUserGroupPermission";
              permissionType: PetitionPermissionType;
              group: {
                __typename?: "UserGroup";
                id: string;
                name: string;
                initials: string;
                members: Array<{
                  __typename?: "UserGroupMember";
                  user: {
                    __typename?: "User";
                    id: string;
                    email: string;
                    fullName?: string | null;
                    avatarUrl?: string | null;
                    initials?: string | null;
                  };
                }>;
              };
            }
          | {
              __typename?: "PetitionUserPermission";
              permissionType: PetitionPermissionType;
              user: {
                __typename?: "User";
                id: string;
                email: string;
                fullName?: string | null;
                avatarUrl?: string | null;
                initials?: string | null;
              };
            }
        >;
      }
    | {
        __typename?: "PetitionTemplate";
        id: string;
        name?: string | null;
        permissions: Array<
          | {
              __typename?: "PetitionUserGroupPermission";
              permissionType: PetitionPermissionType;
              group: {
                __typename?: "UserGroup";
                id: string;
                name: string;
                initials: string;
                members: Array<{
                  __typename?: "UserGroupMember";
                  user: {
                    __typename?: "User";
                    id: string;
                    email: string;
                    fullName?: string | null;
                    avatarUrl?: string | null;
                    initials?: string | null;
                  };
                }>;
              };
            }
          | {
              __typename?: "PetitionUserPermission";
              permissionType: PetitionPermissionType;
              user: {
                __typename?: "User";
                id: string;
                email: string;
                fullName?: string | null;
                avatarUrl?: string | null;
                initials?: string | null;
              };
            }
        >;
      }
  >;
};

export type PetitionSharingModal_petitionsQueryVariables = Exact<{
  petitionIds: Array<Scalars["GID"]> | Scalars["GID"];
}>;

export type PetitionSharingModal_petitionsQuery = {
  petitionsById: Array<
    | {
        __typename?: "Petition";
        id: string;
        name?: string | null;
        permissions: Array<
          | {
              __typename?: "PetitionUserGroupPermission";
              permissionType: PetitionPermissionType;
              group: {
                __typename?: "UserGroup";
                id: string;
                name: string;
                initials: string;
                members: Array<{
                  __typename?: "UserGroupMember";
                  user: {
                    __typename?: "User";
                    id: string;
                    email: string;
                    fullName?: string | null;
                    avatarUrl?: string | null;
                    initials?: string | null;
                  };
                }>;
              };
            }
          | {
              __typename?: "PetitionUserPermission";
              permissionType: PetitionPermissionType;
              user: {
                __typename?: "User";
                id: string;
                email: string;
                fullName?: string | null;
                avatarUrl?: string | null;
                initials?: string | null;
              };
            }
        >;
      }
    | {
        __typename?: "PetitionTemplate";
        id: string;
        name?: string | null;
        permissions: Array<
          | {
              __typename?: "PetitionUserGroupPermission";
              permissionType: PetitionPermissionType;
              group: {
                __typename?: "UserGroup";
                id: string;
                name: string;
                initials: string;
                members: Array<{
                  __typename?: "UserGroupMember";
                  user: {
                    __typename?: "User";
                    id: string;
                    email: string;
                    fullName?: string | null;
                    avatarUrl?: string | null;
                    initials?: string | null;
                  };
                }>;
              };
            }
          | {
              __typename?: "PetitionUserPermission";
              permissionType: PetitionPermissionType;
              user: {
                __typename?: "User";
                id: string;
                email: string;
                fullName?: string | null;
                avatarUrl?: string | null;
                initials?: string | null;
              };
            }
        >;
      }
    | null
  >;
};

export type PublicLinkSettingsDialog_getSlugQueryVariables = Exact<{
  petitionName?: InputMaybe<Scalars["String"]>;
}>;

export type PublicLinkSettingsDialog_getSlugQuery = { getSlugForPublicPetitionLink: string };

export type PublicLinkSettingsDialog_isValidSlugQueryVariables = Exact<{
  slug: Scalars["String"];
}>;

export type PublicLinkSettingsDialog_isValidSlugQuery = { isValidPublicPetitionLinkSlug: boolean };

export type PublicLinkSettingsDialog_PetitionTemplateFragment = {
  __typename?: "PetitionTemplate";
  name?: string | null;
  locale: PetitionLocale;
  organization: { __typename?: "Organization"; customHost?: string | null };
};

export type PublicLinkSettingsDialog_PublicPetitionLinkFragment = {
  __typename?: "PublicPetitionLink";
  id: string;
  isActive: boolean;
  title: string;
  description: string;
  slug: string;
  url: string;
};

export type SignatureConfigDialog_PetitionBase_Petition_Fragment = {
  __typename?: "Petition";
  status: PetitionStatus;
  name?: string | null;
  accesses: Array<{
    __typename?: "PetitionAccess";
    status: PetitionAccessStatus;
    contact?: {
      __typename?: "Contact";
      id: string;
      firstName: string;
      lastName?: string | null;
      email: string;
    } | null;
  }>;
  signatureConfig?: {
    __typename?: "SignatureConfig";
    title: string;
    review: boolean;
    allowAdditionalSigners: boolean;
    integration?: {
      __typename?: "SignatureOrgIntegration";
      id: string;
      name: string;
      isDefault: boolean;
      environment: SignatureOrgIntegrationEnvironment;
    } | null;
    signers: Array<{
      __typename?: "PetitionSigner";
      contactId?: string | null;
      firstName: string;
      lastName?: string | null;
      email: string;
    }>;
  } | null;
};

export type SignatureConfigDialog_PetitionBase_PetitionTemplate_Fragment = {
  __typename?: "PetitionTemplate";
  name?: string | null;
  signatureConfig?: {
    __typename?: "SignatureConfig";
    title: string;
    review: boolean;
    allowAdditionalSigners: boolean;
    integration?: {
      __typename?: "SignatureOrgIntegration";
      id: string;
      name: string;
      isDefault: boolean;
      environment: SignatureOrgIntegrationEnvironment;
    } | null;
    signers: Array<{
      __typename?: "PetitionSigner";
      contactId?: string | null;
      firstName: string;
      lastName?: string | null;
      email: string;
    }>;
  } | null;
};

export type SignatureConfigDialog_PetitionBaseFragment =
  | SignatureConfigDialog_PetitionBase_Petition_Fragment
  | SignatureConfigDialog_PetitionBase_PetitionTemplate_Fragment;

export type SignatureConfigDialog_SignatureOrgIntegrationFragment = {
  __typename?: "SignatureOrgIntegration";
  id: string;
  name: string;
  isDefault: boolean;
  environment: SignatureOrgIntegrationEnvironment;
};

export type SignatureConfigDialog_UserFragment = {
  __typename?: "User";
  firstName?: string | null;
  lastName?: string | null;
  email: string;
};

export type TemplateDefaultPermissionsDialog_PublicPetitionLinkFragment = {
  __typename?: "PublicPetitionLink";
  isActive: boolean;
};

export type TemplateDefaultPermissionsDialog_TemplateDefaultPermission_TemplateDefaultUserGroupPermission_Fragment =
  {
    __typename?: "TemplateDefaultUserGroupPermission";
    id: string;
    isSubscribed: boolean;
    permissionType: PetitionPermissionType;
    group: {
      __typename?: "UserGroup";
      id: string;
      initials: string;
      name: string;
      members: Array<{
        __typename?: "UserGroupMember";
        user: { __typename?: "User"; id: string; fullName?: string | null; email: string };
      }>;
    };
  };

export type TemplateDefaultPermissionsDialog_TemplateDefaultPermission_TemplateDefaultUserPermission_Fragment =
  {
    __typename?: "TemplateDefaultUserPermission";
    id: string;
    isSubscribed: boolean;
    permissionType: PetitionPermissionType;
    user: {
      __typename?: "User";
      id: string;
      fullName?: string | null;
      email: string;
      avatarUrl?: string | null;
      initials?: string | null;
    };
  };

export type TemplateDefaultPermissionsDialog_TemplateDefaultPermissionFragment =
  | TemplateDefaultPermissionsDialog_TemplateDefaultPermission_TemplateDefaultUserGroupPermission_Fragment
  | TemplateDefaultPermissionsDialog_TemplateDefaultPermission_TemplateDefaultUserPermission_Fragment;

export type TemplateDefaultUserGroupPermissionRow_TemplateDefaultUserGroupPermissionFragment = {
  __typename?: "TemplateDefaultUserGroupPermission";
  permissionType: PetitionPermissionType;
  group: {
    __typename?: "UserGroup";
    id: string;
    initials: string;
    name: string;
    members: Array<{
      __typename?: "UserGroupMember";
      user: { __typename?: "User"; id: string; fullName?: string | null; email: string };
    }>;
  };
};

export type TemplateDefaultUserPermissionRow_TemplateDefaultUserPermissionFragment = {
  __typename?: "TemplateDefaultUserPermission";
  permissionType: PetitionPermissionType;
  user: {
    __typename?: "User";
    id: string;
    fullName?: string | null;
    email: string;
    avatarUrl?: string | null;
    initials?: string | null;
  };
};

export type TemplateDetailsModal_UserFragment = {
  __typename?: "User";
  id: string;
  role: OrganizationRole;
};

export type TemplateDetailsModal_PetitionTemplateFragment = {
  __typename?: "PetitionTemplate";
  id: string;
  descriptionHtml?: string | null;
  name?: string | null;
  isPublic: boolean;
  updatedAt: string;
  locale: PetitionLocale;
  isRestricted: boolean;
  permissions: Array<
    | {
        __typename?: "PetitionUserGroupPermission";
        group: { __typename?: "UserGroup"; id: string; name: string; initials: string };
      }
    | {
        __typename?: "PetitionUserPermission";
        user: {
          __typename?: "User";
          id: string;
          fullName?: string | null;
          avatarUrl?: string | null;
          initials?: string | null;
        };
      }
  >;
  fields: Array<{
    __typename?: "PetitionField";
    id: string;
    title?: string | null;
    type: PetitionFieldType;
    options: { [key: string]: any };
  }>;
  owner: {
    __typename?: "User";
    id: string;
    fullName?: string | null;
    organization: { __typename?: "Organization"; id: string; name: string };
  };
  myEffectivePermission?: {
    __typename?: "EffectivePetitionUserPermission";
    permissionType: PetitionPermissionType;
  } | null;
  publicLink?: {
    __typename?: "PublicPetitionLink";
    id: string;
    isActive: boolean;
    slug: string;
    url: string;
  } | null;
  signatureConfig?: { __typename?: "SignatureConfig"; title: string } | null;
  remindersConfig?: { __typename?: "RemindersConfig"; time: string } | null;
};

export type useSendPetitionHandler_PetitionFragment = {
  __typename?: "Petition";
  id: string;
  emailSubject?: string | null;
  emailBody?: any | null;
  accesses: Array<{
    __typename?: "PetitionAccess";
    contact?: { __typename?: "Contact"; id: string } | null;
  }>;
  signatureConfig?: {
    __typename?: "SignatureConfig";
    integration?: {
      __typename?: "SignatureOrgIntegration";
      id: string;
      environment: SignatureOrgIntegrationEnvironment;
      name: string;
    } | null;
    signers: Array<{ __typename?: "PetitionSigner"; email: string; fullName: string }>;
  } | null;
  remindersConfig?: {
    __typename?: "RemindersConfig";
    offset: number;
    time: string;
    timezone: string;
    weekdaysOnly: boolean;
  } | null;
  organization: {
    __typename?: "Organization";
    id: string;
    usageLimits: {
      __typename?: "OrganizationUsageLimit";
      petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
    };
  };
};

export type useSendPetitionHandler_bulkSendPetitionMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  contactIdGroups:
    | Array<Array<Scalars["GID"]> | Scalars["GID"]>
    | Array<Scalars["GID"]>
    | Scalars["GID"];
  subject: Scalars["String"];
  body: Scalars["JSON"];
  remindersConfig?: InputMaybe<RemindersConfigInput>;
  scheduledAt?: InputMaybe<Scalars["DateTime"]>;
  bulkSendSigningMode?: InputMaybe<BulkSendSigningMode>;
}>;

export type useSendPetitionHandler_bulkSendPetitionMutation = {
  bulkSendPetition: Array<{
    __typename?: "SendPetitionResult";
    result: Result;
    petition?: { __typename?: "Petition"; id: string; status: PetitionStatus } | null;
  }>;
};

export type PetitionComposeField_PetitionFieldFragment = {
  __typename?: "PetitionField";
  id: string;
  type: PetitionFieldType;
  title?: string | null;
  description?: string | null;
  optional: boolean;
  multiple: boolean;
  isFixed: boolean;
  isInternal: boolean;
  isReadOnly: boolean;
  visibility?: { [key: string]: any } | null;
  options: { [key: string]: any };
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
};

export type PetitionComposeField_PetitionFieldAttachmentFragment = {
  __typename?: "PetitionFieldAttachment";
  id: string;
  file: {
    __typename?: "FileUpload";
    filename: string;
    contentType: string;
    size: number;
    isComplete: boolean;
  };
};

export type PetitionComposeField_createPetitionFieldAttachmentUploadLinkMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  fieldId: Scalars["GID"];
  data: FileUploadInput;
}>;

export type PetitionComposeField_createPetitionFieldAttachmentUploadLinkMutation = {
  createPetitionFieldAttachmentUploadLink: {
    __typename?: "PetitionFieldAttachmentUploadData";
    presignedPostData: {
      __typename?: "AWSPresignedPostData";
      url: string;
      fields: { [key: string]: any };
    };
    attachment: {
      __typename?: "PetitionFieldAttachment";
      id: string;
      field: {
        __typename?: "PetitionField";
        id: string;
        attachments: Array<{ __typename?: "PetitionFieldAttachment"; id: string }>;
      };
      file: {
        __typename?: "FileUpload";
        filename: string;
        contentType: string;
        size: number;
        isComplete: boolean;
      };
    };
  };
};

export type PetitionComposeField_petitionFieldAttachmentUploadCompleteMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  fieldId: Scalars["GID"];
  attachmentId: Scalars["GID"];
}>;

export type PetitionComposeField_petitionFieldAttachmentUploadCompleteMutation = {
  petitionFieldAttachmentUploadComplete: {
    __typename?: "PetitionFieldAttachment";
    id: string;
    file: {
      __typename?: "FileUpload";
      filename: string;
      contentType: string;
      size: number;
      isComplete: boolean;
    };
  };
};

export type PetitionComposeField_deletePetitionFieldAttachmentMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  fieldId: Scalars["GID"];
  attachmentId: Scalars["GID"];
}>;

export type PetitionComposeField_deletePetitionFieldAttachmentMutation = {
  deletePetitionFieldAttachment: {
    __typename?: "PetitionField";
    id: string;
    attachments: Array<{ __typename?: "PetitionFieldAttachment"; id: string }>;
  };
};

export type PetitionComposeField_petitionFieldAttachmentDownloadLinkMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  fieldId: Scalars["GID"];
  attachmentId: Scalars["GID"];
}>;

export type PetitionComposeField_petitionFieldAttachmentDownloadLinkMutation = {
  petitionFieldAttachmentDownloadLink: {
    __typename?: "FileUploadDownloadLinkResult";
    url?: string | null;
  };
};

export type PetitionComposeFieldAttachment_PetitionFieldAttachmentFragment = {
  __typename?: "PetitionFieldAttachment";
  id: string;
  file: {
    __typename?: "FileUpload";
    filename: string;
    contentType: string;
    size: number;
    isComplete: boolean;
  };
};

export type PetitionComposeFieldList_PetitionFragment = {
  __typename?: "Petition";
  fields: Array<{
    __typename?: "PetitionField";
    isFixed: boolean;
    id: string;
    type: PetitionFieldType;
    title?: string | null;
    description?: string | null;
    optional: boolean;
    multiple: boolean;
    isInternal: boolean;
    isReadOnly: boolean;
    visibility?: { [key: string]: any } | null;
    options: { [key: string]: any };
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
  }>;
};

export type PetitionFieldOptionsListEditor_PetitionFieldFragment = {
  __typename?: "PetitionField";
  id: string;
  type: PetitionFieldType;
  optional: boolean;
  options: { [key: string]: any };
};

export type PetitionFieldVisibilityEditor_PetitionFieldFragment = {
  __typename?: "PetitionField";
  id: string;
  type: PetitionFieldType;
  multiple: boolean;
  options: { [key: string]: any };
  isReadOnly: boolean;
  title?: string | null;
};

export type PetitionSettings_UserFragment = {
  __typename?: "User";
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  hasSkipForwardSecurity: boolean;
  hasHideRecipientViewContents: boolean;
  hasPetitionSignature: boolean;
  organization: {
    __typename?: "Organization";
    id: string;
    signatureIntegrations: {
      __typename?: "OrgIntegrationPagination";
      items: Array<
        | {
            __typename?: "SignatureOrgIntegration";
            id: string;
            name: string;
            isDefault: boolean;
            environment: SignatureOrgIntegrationEnvironment;
          }
        | { __typename?: "SsoOrgIntegration" }
        | { __typename?: "UserProvisioningOrgIntegration" }
      >;
    };
  };
};

export type PetitionSettings_PetitionBase_Petition_Fragment = {
  __typename?: "Petition";
  status: PetitionStatus;
  deadline?: string | null;
  id: string;
  locale: PetitionLocale;
  skipForwardSecurity: boolean;
  isRecipientViewContentsHidden: boolean;
  isRestricted: boolean;
  isRestrictedWithPassword: boolean;
  name?: string | null;
  currentSignatureRequest?: {
    __typename?: "PetitionSignatureRequest";
    id: string;
    status: PetitionSignatureRequestStatus;
  } | null;
  accesses: Array<{
    __typename?: "PetitionAccess";
    status: PetitionAccessStatus;
    contact?: {
      __typename?: "Contact";
      id: string;
      firstName: string;
      lastName?: string | null;
      email: string;
    } | null;
  }>;
  signatureConfig?: {
    __typename?: "SignatureConfig";
    title: string;
    review: boolean;
    allowAdditionalSigners: boolean;
    integration?: {
      __typename?: "SignatureOrgIntegration";
      id: string;
      name: string;
      isDefault: boolean;
      environment: SignatureOrgIntegrationEnvironment;
    } | null;
    signers: Array<{
      __typename?: "PetitionSigner";
      contactId?: string | null;
      firstName: string;
      lastName?: string | null;
      email: string;
    }>;
  } | null;
};

export type PetitionSettings_PetitionBase_PetitionTemplate_Fragment = {
  __typename?: "PetitionTemplate";
  isPublic: boolean;
  id: string;
  locale: PetitionLocale;
  skipForwardSecurity: boolean;
  isRecipientViewContentsHidden: boolean;
  isRestricted: boolean;
  isRestrictedWithPassword: boolean;
  name?: string | null;
  remindersConfig?: {
    __typename?: "RemindersConfig";
    offset: number;
    time: string;
    timezone: string;
    weekdaysOnly: boolean;
  } | null;
  publicLink?: {
    __typename?: "PublicPetitionLink";
    id: string;
    url: string;
    isActive: boolean;
    title: string;
    description: string;
    slug: string;
  } | null;
  defaultPermissions: Array<
    | {
        __typename?: "TemplateDefaultUserGroupPermission";
        id: string;
        isSubscribed: boolean;
        permissionType: PetitionPermissionType;
        group: {
          __typename?: "UserGroup";
          id: string;
          initials: string;
          name: string;
          members: Array<{
            __typename?: "UserGroupMember";
            user: { __typename?: "User"; id: string; fullName?: string | null; email: string };
          }>;
        };
      }
    | {
        __typename?: "TemplateDefaultUserPermission";
        id: string;
        isSubscribed: boolean;
        permissionType: PetitionPermissionType;
        user: {
          __typename?: "User";
          id: string;
          fullName?: string | null;
          email: string;
          avatarUrl?: string | null;
          initials?: string | null;
        };
      }
  >;
  organization: { __typename?: "Organization"; customHost?: string | null };
  signatureConfig?: {
    __typename?: "SignatureConfig";
    title: string;
    review: boolean;
    allowAdditionalSigners: boolean;
    integration?: {
      __typename?: "SignatureOrgIntegration";
      id: string;
      name: string;
      isDefault: boolean;
      environment: SignatureOrgIntegrationEnvironment;
    } | null;
    signers: Array<{
      __typename?: "PetitionSigner";
      contactId?: string | null;
      firstName: string;
      lastName?: string | null;
      email: string;
    }>;
  } | null;
};

export type PetitionSettings_PetitionBaseFragment =
  | PetitionSettings_PetitionBase_Petition_Fragment
  | PetitionSettings_PetitionBase_PetitionTemplate_Fragment;

export type PetitionSettings_updatePetitionRestrictionMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  isRestricted: Scalars["Boolean"];
  password?: InputMaybe<Scalars["String"]>;
}>;

export type PetitionSettings_updatePetitionRestrictionMutation = {
  updatePetitionRestriction:
    | {
        __typename?: "Petition";
        id: string;
        isRestricted: boolean;
        isRestrictedWithPassword: boolean;
      }
    | {
        __typename?: "PetitionTemplate";
        id: string;
        isRestricted: boolean;
        isRestrictedWithPassword: boolean;
      };
};

export type PetitionSettings_cancelPetitionSignatureRequestMutationVariables = Exact<{
  petitionSignatureRequestId: Scalars["GID"];
}>;

export type PetitionSettings_cancelPetitionSignatureRequestMutation = {
  cancelSignatureRequest: {
    __typename?: "PetitionSignatureRequest";
    id: string;
    status: PetitionSignatureRequestStatus;
  };
};

export type PetitionSettings_startPetitionSignatureRequestMutationVariables = Exact<{
  petitionId: Scalars["GID"];
}>;

export type PetitionSettings_startPetitionSignatureRequestMutation = {
  startSignatureRequest: {
    __typename?: "PetitionSignatureRequest";
    id: string;
    status: PetitionSignatureRequestStatus;
  };
};

export type PetitionSettings_createPublicPetitionLinkMutationVariables = Exact<{
  templateId: Scalars["GID"];
  title: Scalars["String"];
  description: Scalars["String"];
  slug?: InputMaybe<Scalars["String"]>;
}>;

export type PetitionSettings_createPublicPetitionLinkMutation = {
  createPublicPetitionLink: {
    __typename?: "PublicPetitionLink";
    id: string;
    isActive: boolean;
    title: string;
    description: string;
    slug: string;
    url: string;
    template: {
      __typename?: "PetitionTemplate";
      id: string;
      publicLink?: { __typename?: "PublicPetitionLink"; id: string } | null;
    };
  };
};

export type PetitionSettings_updatePublicPetitionLinkMutationVariables = Exact<{
  publicPetitionLinkId: Scalars["GID"];
  isActive?: InputMaybe<Scalars["Boolean"]>;
  title?: InputMaybe<Scalars["String"]>;
  description?: InputMaybe<Scalars["String"]>;
  slug?: InputMaybe<Scalars["String"]>;
}>;

export type PetitionSettings_updatePublicPetitionLinkMutation = {
  updatePublicPetitionLink: {
    __typename?: "PublicPetitionLink";
    id: string;
    isActive: boolean;
    title: string;
    description: string;
    slug: string;
    url: string;
    template: {
      __typename?: "PetitionTemplate";
      id: string;
      publicLink?: { __typename?: "PublicPetitionLink"; id: string } | null;
    };
  };
};

export type PetitionSettings_updateTemplateDefaultPermissionsMutationVariables = Exact<{
  templateId: Scalars["GID"];
  permissions: Array<UserOrUserGroupPermissionInput> | UserOrUserGroupPermissionInput;
}>;

export type PetitionSettings_updateTemplateDefaultPermissionsMutation = {
  updateTemplateDefaultPermissions: {
    __typename?: "PetitionTemplate";
    id: string;
    defaultPermissions: Array<
      | {
          __typename?: "TemplateDefaultUserGroupPermission";
          id: string;
          isSubscribed: boolean;
          permissionType: PetitionPermissionType;
          group: {
            __typename?: "UserGroup";
            id: string;
            initials: string;
            name: string;
            members: Array<{
              __typename?: "UserGroupMember";
              user: { __typename?: "User"; id: string; fullName?: string | null; email: string };
            }>;
          };
        }
      | {
          __typename?: "TemplateDefaultUserPermission";
          id: string;
          isSubscribed: boolean;
          permissionType: PetitionPermissionType;
          user: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            email: string;
            avatarUrl?: string | null;
            initials?: string | null;
          };
        }
    >;
    publicLink?: { __typename?: "PublicPetitionLink"; id: string; isActive: boolean } | null;
  };
};

export type PetitionTemplateComposeMessageEditor_PetitionFragment = {
  __typename?: "PetitionTemplate";
  id: string;
  emailSubject?: string | null;
  emailBody?: any | null;
  closingEmailBody?: any | null;
  description?: any | null;
  isRestricted: boolean;
  isPublic: boolean;
};

export type CopySignatureConfigDialog_PetitionSignerFragment = {
  __typename?: "PetitionSigner";
  email: string;
  fullName: string;
};

export type ReferencedFieldDialog_PetitionFieldFragment = {
  __typename?: "PetitionField";
  id: string;
  title?: string | null;
  type: PetitionFieldType;
};

export type DynamicSelectSettings_uploadDynamicSelectFieldFileMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  fieldId: Scalars["GID"];
  file: Scalars["Upload"];
}>;

export type DynamicSelectSettings_uploadDynamicSelectFieldFileMutation = {
  uploadDynamicSelectFieldFile: {
    __typename?: "PetitionField";
    id: string;
    options: { [key: string]: any };
  };
};

export type DynamicSelectSettings_dynamicSelectFieldFileDownloadLinkMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  fieldId: Scalars["GID"];
}>;

export type DynamicSelectSettings_dynamicSelectFieldFileDownloadLinkMutation = {
  dynamicSelectFieldFileDownloadLink: {
    __typename?: "FileUploadDownloadLinkResult";
    result: Result;
    url?: string | null;
  };
};

export type PetitionComposeFieldSettings_PetitionFieldFragment = {
  __typename?: "PetitionField";
  id: string;
  type: PetitionFieldType;
  optional: boolean;
  multiple: boolean;
  options: { [key: string]: any };
  isInternal: boolean;
  isReadOnly: boolean;
  showInPdf: boolean;
  isFixed: boolean;
  position: number;
  visibility?: { [key: string]: any } | null;
  alias?: string | null;
  hasCommentsEnabled: boolean;
};

export type PetitionListHeader_UserFragment = {
  __typename?: "User";
  id: string;
  role: OrganizationRole;
};

export type PetitionListTagFilter_TagFragment = {
  __typename?: "Tag";
  id: string;
  name: string;
  color: string;
};

export type PetitionListTagFilter_tagsQueryVariables = Exact<{
  search?: InputMaybe<Scalars["String"]>;
}>;

export type PetitionListTagFilter_tagsQuery = {
  tags: {
    __typename?: "TagPagination";
    items: Array<{ __typename?: "Tag"; id: string; name: string; color: string }>;
  };
};

export type PublicTemplateCard_PetitionTemplateFragment = {
  __typename?: "PetitionTemplate";
  id: string;
  name?: string | null;
  descriptionExcerpt?: string | null;
  backgroundColor?: string | null;
  categories?: Array<string> | null;
  imageUrl?: string | null;
  locale: PetitionLocale;
  isRestricted: boolean;
  publicLink?: { __typename?: "PublicPetitionLink"; id: string; isActive: boolean } | null;
  signatureConfig?: { __typename?: "SignatureConfig"; title: string } | null;
  remindersConfig?: { __typename?: "RemindersConfig"; time: string } | null;
};

export type TemplateActiveSettingsIcons_PetitionTemplateFragment = {
  __typename?: "PetitionTemplate";
  id: string;
  locale: PetitionLocale;
  isRestricted: boolean;
  publicLink?: { __typename?: "PublicPetitionLink"; id: string; isActive: boolean } | null;
  signatureConfig?: { __typename?: "SignatureConfig"; title: string } | null;
  remindersConfig?: { __typename?: "RemindersConfig"; time: string } | null;
};

export type TemplateCard_PetitionTemplateFragment = {
  __typename?: "PetitionTemplate";
  id: string;
  name?: string | null;
  locale: PetitionLocale;
  isRestricted: boolean;
  permissions: Array<
    | {
        __typename?: "PetitionUserGroupPermission";
        group: { __typename?: "UserGroup"; id: string; name: string; initials: string };
      }
    | {
        __typename?: "PetitionUserPermission";
        user: {
          __typename?: "User";
          id: string;
          fullName?: string | null;
          avatarUrl?: string | null;
          initials?: string | null;
        };
      }
  >;
  publicLink?: { __typename?: "PublicPetitionLink"; id: string; isActive: boolean } | null;
  signatureConfig?: { __typename?: "SignatureConfig"; title: string } | null;
  remindersConfig?: { __typename?: "RemindersConfig"; time: string } | null;
};

export type PreviewPetitionField_PetitionFieldFragment = {
  __typename?: "PetitionField";
  id: string;
  type: PetitionFieldType;
  title?: string | null;
  description?: string | null;
  options: { [key: string]: any };
  optional: boolean;
  multiple: boolean;
  isInternal: boolean;
  commentCount: number;
  unreadCommentCount: number;
  hasCommentsEnabled: boolean;
  previewReplies: Array<{
    __typename?: "PetitionFieldReply";
    id: string;
    status: PetitionFieldReplyStatus;
    content: { [key: string]: any };
    createdAt: string;
    updatedAt: string;
  }>;
  replies: Array<{
    __typename?: "PetitionFieldReply";
    id: string;
    status: PetitionFieldReplyStatus;
    content: { [key: string]: any };
    createdAt: string;
    updatedAt: string;
  }>;
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
  comments: Array<{
    __typename?: "PetitionFieldComment";
    id: string;
    createdAt: string;
    content: string;
    isUnread: boolean;
    isInternal: boolean;
    isEdited: boolean;
    author?:
      | {
          __typename?: "PetitionAccess";
          id: string;
          contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
        }
      | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
      | null;
  }>;
};

export type PreviewPetitionField_PetitionFieldReplyFragment = {
  __typename?: "PetitionFieldReply";
  content: { [key: string]: any };
};

export type PreviewPetitionField_petitionFieldAttachmentDownloadLinkMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  fieldId: Scalars["GID"];
  attachmentId: Scalars["GID"];
}>;

export type PreviewPetitionField_petitionFieldAttachmentDownloadLinkMutation = {
  petitionFieldAttachmentDownloadLink: {
    __typename?: "FileUploadDownloadLinkResult";
    url?: string | null;
  };
};

export type PreviewPetitionFieldMutations_deletePetitionReplyMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  replyId: Scalars["GID"];
}>;

export type PreviewPetitionFieldMutations_deletePetitionReplyMutation = {
  deletePetitionReply: {
    __typename?: "PetitionField";
    id: string;
    petition:
      | { __typename?: "Petition"; status: PetitionStatus; id: string }
      | { __typename?: "PetitionTemplate"; id: string };
    replies: Array<{ __typename?: "PetitionFieldReply"; id: string }>;
  };
};

export type PreviewPetitionFieldMutations_updatePetitionFieldReplyMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  replyId: Scalars["GID"];
  reply: Scalars["JSON"];
}>;

export type PreviewPetitionFieldMutations_updatePetitionFieldReplyMutation = {
  updatePetitionFieldReply: {
    __typename?: "PetitionFieldReply";
    id: string;
    content: { [key: string]: any };
    status: PetitionFieldReplyStatus;
    updatedAt: string;
    field?: {
      __typename?: "PetitionField";
      id: string;
      petition:
        | { __typename?: "Petition"; status: PetitionStatus; id: string }
        | { __typename?: "PetitionTemplate"; id: string };
    } | null;
  };
};

export type PreviewPetitionFieldMutations_createPetitionFieldReplyMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  fieldId: Scalars["GID"];
  reply: Scalars["JSON"];
}>;

export type PreviewPetitionFieldMutations_createPetitionFieldReplyMutation = {
  createPetitionFieldReply: {
    __typename?: "PetitionFieldReply";
    id: string;
    status: PetitionFieldReplyStatus;
    content: { [key: string]: any };
    createdAt: string;
    updatedAt: string;
    field?: {
      __typename?: "PetitionField";
      id: string;
      petition:
        | { __typename?: "Petition"; status: PetitionStatus; id: string }
        | { __typename?: "PetitionTemplate"; id: string };
      replies: Array<{ __typename?: "PetitionFieldReply"; id: string }>;
    } | null;
  };
};

export type PreviewPetitionFieldMutations_createFileUploadReplyMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  fieldId: Scalars["GID"];
  file: FileUploadInput;
}>;

export type PreviewPetitionFieldMutations_createFileUploadReplyMutation = {
  createFileUploadReply: {
    __typename?: "FileUploadReplyResponse";
    presignedPostData: {
      __typename?: "AWSPresignedPostData";
      url: string;
      fields: { [key: string]: any };
    };
    reply: {
      __typename?: "PetitionFieldReply";
      id: string;
      status: PetitionFieldReplyStatus;
      content: { [key: string]: any };
      createdAt: string;
      updatedAt: string;
      field?: {
        __typename?: "PetitionField";
        id: string;
        petition:
          | { __typename?: "Petition"; status: PetitionStatus; id: string }
          | { __typename?: "PetitionTemplate"; id: string };
        replies: Array<{ __typename?: "PetitionFieldReply"; id: string }>;
      } | null;
    };
  };
};

export type PreviewPetitionFieldMutations_createFileUploadReplyCompleteMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  replyId: Scalars["GID"];
}>;

export type PreviewPetitionFieldMutations_createFileUploadReplyCompleteMutation = {
  createFileUploadReplyComplete: {
    __typename?: "PetitionFieldReply";
    id: string;
    content: { [key: string]: any };
  };
};

export type PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldReplyFragment = {
  __typename?: "PetitionFieldReply";
  id: string;
  content: { [key: string]: any };
  status: PetitionFieldReplyStatus;
  createdAt: string;
  updatedAt: string;
};

export type PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldFragment = {
  __typename?: "PetitionField";
  previewReplies: Array<{
    __typename?: "PetitionFieldReply";
    id: string;
    content: { [key: string]: any };
    status: PetitionFieldReplyStatus;
    createdAt: string;
    updatedAt: string;
  }>;
  replies: Array<{
    __typename?: "PetitionFieldReply";
    id: string;
    content: { [key: string]: any };
    status: PetitionFieldReplyStatus;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type PreviewPetitionFieldMutations_updateReplyContent_PetitionFieldReplyFragment = {
  __typename?: "PetitionFieldReply";
  content: { [key: string]: any };
};

export type PreviewPetitionFieldCommentsDialog_PetitionFieldFragment = {
  __typename?: "PetitionField";
  id: string;
  title?: string | null;
  isInternal: boolean;
  commentCount: number;
  unreadCommentCount: number;
  hasCommentsEnabled: boolean;
  comments: Array<{
    __typename?: "PetitionFieldComment";
    id: string;
    createdAt: string;
    content: string;
    isUnread: boolean;
    isInternal: boolean;
    isEdited: boolean;
    author?:
      | {
          __typename?: "PetitionAccess";
          id: string;
          contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
        }
      | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
      | null;
  }>;
};

export type PreviewPetitionFieldCommentsDialog_userQueryVariables = Exact<{ [key: string]: never }>;

export type PreviewPetitionFieldCommentsDialog_userQuery = {
  me: { __typename?: "User"; id: string; hasInternalComments: boolean };
};

export type PreviewPetitionFieldCommentsDialog_petitionFieldQueryQueryVariables = Exact<{
  petitionId: Scalars["GID"];
  petitionFieldId: Scalars["GID"];
}>;

export type PreviewPetitionFieldCommentsDialog_petitionFieldQueryQuery = {
  petitionField: {
    __typename?: "PetitionField";
    id: string;
    title?: string | null;
    isInternal: boolean;
    commentCount: number;
    unreadCommentCount: number;
    hasCommentsEnabled: boolean;
    comments: Array<{
      __typename?: "PetitionFieldComment";
      id: string;
      createdAt: string;
      content: string;
      isUnread: boolean;
      isInternal: boolean;
      isEdited: boolean;
      author?:
        | {
            __typename?: "PetitionAccess";
            id: string;
            contact?: {
              __typename?: "Contact";
              id: string;
              fullName: string;
              email: string;
            } | null;
          }
        | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
        | null;
    }>;
  };
};

export type PreviewPetitionFieldCommentsDialog_createPetitionFieldCommentMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  petitionFieldId: Scalars["GID"];
  content: Scalars["String"];
  isInternal?: InputMaybe<Scalars["Boolean"]>;
}>;

export type PreviewPetitionFieldCommentsDialog_createPetitionFieldCommentMutation = {
  createPetitionFieldComment: {
    __typename?: "PetitionFieldComment";
    id: string;
    createdAt: string;
    content: string;
    isUnread: boolean;
    isInternal: boolean;
    isEdited: boolean;
    field: {
      __typename?: "PetitionField";
      id: string;
      commentCount: number;
      unreadCommentCount: number;
      comments: Array<{ __typename?: "PetitionFieldComment"; id: string }>;
    };
    author?:
      | {
          __typename?: "PetitionAccess";
          id: string;
          contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
        }
      | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
      | null;
  };
};

export type PreviewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  petitionFieldId: Scalars["GID"];
  petitionFieldCommentId: Scalars["GID"];
  content: Scalars["String"];
}>;

export type PreviewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutation = {
  updatePetitionFieldComment: {
    __typename?: "PetitionFieldComment";
    id: string;
    createdAt: string;
    content: string;
    isUnread: boolean;
    isInternal: boolean;
    isEdited: boolean;
    field: {
      __typename?: "PetitionField";
      id: string;
      comments: Array<{ __typename?: "PetitionFieldComment"; id: string }>;
    };
    author?:
      | {
          __typename?: "PetitionAccess";
          id: string;
          contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
        }
      | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
      | null;
  };
};

export type PreviewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  petitionFieldId: Scalars["GID"];
  petitionFieldCommentId: Scalars["GID"];
}>;

export type PreviewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutation = {
  deletePetitionFieldComment: {
    __typename?: "PetitionField";
    commentCount: number;
    unreadCommentCount: number;
    id: string;
    title?: string | null;
    isInternal: boolean;
    hasCommentsEnabled: boolean;
    comments: Array<{
      __typename?: "PetitionFieldComment";
      id: string;
      createdAt: string;
      content: string;
      isUnread: boolean;
      isInternal: boolean;
      isEdited: boolean;
      author?:
        | {
            __typename?: "PetitionAccess";
            id: string;
            contact?: {
              __typename?: "Contact";
              id: string;
              fullName: string;
              email: string;
            } | null;
          }
        | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
        | null;
    }>;
  };
};

export type CurrentSignatureRequestRow_PetitionSignatureRequestFragment = {
  __typename?: "PetitionSignatureRequest";
  id: string;
  status: PetitionSignatureRequestStatus;
  signerStatus: Array<{
    __typename?: "PetitionSignatureRequestSignerStatus";
    status: string;
    sentAt?: string | null;
    openedAt?: string | null;
    signedAt?: string | null;
    declinedAt?: string | null;
    signer: { __typename?: "PetitionSigner"; email: string; fullName: string };
  }>;
};

export type NewSignatureRequestRow_UserFragment = {
  __typename?: "User";
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

export type NewSignatureRequestRow_PetitionFragment = {
  __typename?: "Petition";
  signatureConfig?: {
    __typename?: "SignatureConfig";
    allowAdditionalSigners: boolean;
    review: boolean;
    timezone: string;
    title: string;
    signers: Array<{
      __typename?: "PetitionSigner";
      email: string;
      fullName: string;
      contactId?: string | null;
      firstName: string;
      lastName?: string | null;
    }>;
    integration?: {
      __typename?: "SignatureOrgIntegration";
      id: string;
      name: string;
      provider: SignatureOrgIntegrationProvider;
    } | null;
  } | null;
  accesses: Array<{
    __typename?: "PetitionAccess";
    id: string;
    status: PetitionAccessStatus;
    contact?: {
      __typename?: "Contact";
      id: string;
      email: string;
      firstName: string;
      lastName?: string | null;
    } | null;
  }>;
};

export type OlderSignatureRequestRows_PetitionSignatureRequestFragment = {
  __typename?: "PetitionSignatureRequest";
  id: string;
  status: PetitionSignatureRequestStatus;
  signatureConfig: {
    __typename?: "SignatureConfig";
    signers: Array<{ __typename?: "PetitionSigner"; email: string; fullName: string }>;
  };
};

export type PetitionAttachmentsCard_PetitionFragment = {
  __typename?: "Petition";
  id: string;
  attachments: Array<{
    __typename?: "PetitionAttachment";
    id: string;
    file: {
      __typename?: "FileUpload";
      filename: string;
      contentType: string;
      size: number;
      isComplete: boolean;
    };
  }>;
};

export type PetitionAttachmentsCard_petitionAttachmentDownloadLinkMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  attachmentId: Scalars["GID"];
}>;

export type PetitionAttachmentsCard_petitionAttachmentDownloadLinkMutation = {
  petitionAttachmentDownloadLink: {
    __typename?: "FileUploadDownloadLinkResult";
    result: Result;
    url?: string | null;
  };
};

export type PetitionRepliesField_PetitionFieldFragment = {
  __typename?: "PetitionField";
  id: string;
  type: PetitionFieldType;
  title?: string | null;
  description?: string | null;
  optional: boolean;
  isInternal: boolean;
  replies: Array<{
    __typename?: "PetitionFieldReply";
    id: string;
    content: { [key: string]: any };
    status: PetitionFieldReplyStatus;
    createdAt: string;
    metadata: { [key: string]: any };
    field?: {
      __typename?: "PetitionField";
      type: PetitionFieldType;
      options: { [key: string]: any };
    } | null;
    updatedBy?:
      | {
          __typename?: "PetitionAccess";
          contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
        }
      | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
      | null;
  }>;
  comments: Array<{
    __typename?: "PetitionFieldComment";
    id: string;
    isUnread: boolean;
    createdAt: string;
  }>;
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
};

export type PetitionRepliesField_PetitionFieldReplyFragment = {
  __typename?: "PetitionFieldReply";
  id: string;
  content: { [key: string]: any };
  status: PetitionFieldReplyStatus;
  createdAt: string;
  metadata: { [key: string]: any };
  field?: {
    __typename?: "PetitionField";
    type: PetitionFieldType;
    options: { [key: string]: any };
  } | null;
  updatedBy?:
    | {
        __typename?: "PetitionAccess";
        contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
      }
    | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
    | null;
};

export type PetitionRepliesField_petitionFieldAttachmentDownloadLinkMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  fieldId: Scalars["GID"];
  attachmentId: Scalars["GID"];
}>;

export type PetitionRepliesField_petitionFieldAttachmentDownloadLinkMutation = {
  petitionFieldAttachmentDownloadLink: {
    __typename?: "FileUploadDownloadLinkResult";
    url?: string | null;
  };
};

export type PetitionRepliesFieldComments_UserFragment = {
  __typename?: "User";
  id: string;
  hasInternalComments: boolean;
};

export type PetitionRepliesFieldComments_PetitionFieldFragment = {
  __typename?: "PetitionField";
  id: string;
  title?: string | null;
  type: PetitionFieldType;
  isInternal: boolean;
  hasCommentsEnabled: boolean;
  replies: Array<{
    __typename?: "PetitionFieldReply";
    id: string;
    content: { [key: string]: any };
  }>;
};

export type PetitionRepliesFieldComments_PetitionFieldReplyFragment = {
  __typename?: "PetitionFieldReply";
  id: string;
  content: { [key: string]: any };
};

export type PetitionRepliesFieldReply_PetitionFieldReplyFragment = {
  __typename?: "PetitionFieldReply";
  id: string;
  content: { [key: string]: any };
  status: PetitionFieldReplyStatus;
  createdAt: string;
  metadata: { [key: string]: any };
  field?: {
    __typename?: "PetitionField";
    type: PetitionFieldType;
    options: { [key: string]: any };
  } | null;
  updatedBy?:
    | {
        __typename?: "PetitionAccess";
        contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
      }
    | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
    | null;
};

export type DatesList_SignerStatusFragment = {
  __typename?: "PetitionSignatureRequestSignerStatus";
  sentAt?: string | null;
  openedAt?: string | null;
  signedAt?: string | null;
  declinedAt?: string | null;
};

export type PetitionSignatureRequestSignerStatusIcon_SignerStatusFragment = {
  __typename?: "PetitionSignatureRequestSignerStatus";
  status: string;
  sentAt?: string | null;
  openedAt?: string | null;
  signedAt?: string | null;
  declinedAt?: string | null;
};

export type PetitionSignaturesCard_UserFragment = {
  __typename?: "User";
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  id: string;
  hasPetitionSignature: boolean;
  organization: {
    __typename?: "Organization";
    signatureIntegrations: {
      __typename?: "OrgIntegrationPagination";
      items: Array<
        | {
            __typename?: "SignatureOrgIntegration";
            id: string;
            name: string;
            isDefault: boolean;
            environment: SignatureOrgIntegrationEnvironment;
          }
        | { __typename?: "SsoOrgIntegration" }
        | { __typename?: "UserProvisioningOrgIntegration" }
      >;
    };
  };
};

export type PetitionSignaturesCard_PetitionFragment = {
  __typename?: "Petition";
  id: string;
  status: PetitionStatus;
  name?: string | null;
  signatureRequests: Array<{
    __typename?: "PetitionSignatureRequest";
    id: string;
    status: PetitionSignatureRequestStatus;
    signerStatus: Array<{
      __typename?: "PetitionSignatureRequestSignerStatus";
      status: string;
      sentAt?: string | null;
      openedAt?: string | null;
      signedAt?: string | null;
      declinedAt?: string | null;
      signer: { __typename?: "PetitionSigner"; email: string; fullName: string };
    }>;
    signatureConfig: {
      __typename?: "SignatureConfig";
      signers: Array<{ __typename?: "PetitionSigner"; email: string; fullName: string }>;
    };
  }>;
  accesses: Array<{
    __typename?: "PetitionAccess";
    status: PetitionAccessStatus;
    id: string;
    contact?: {
      __typename?: "Contact";
      id: string;
      firstName: string;
      lastName?: string | null;
      email: string;
    } | null;
  }>;
  signatureConfig?: {
    __typename?: "SignatureConfig";
    title: string;
    review: boolean;
    allowAdditionalSigners: boolean;
    timezone: string;
    integration?: {
      __typename?: "SignatureOrgIntegration";
      id: string;
      name: string;
      provider: SignatureOrgIntegrationProvider;
      environment: SignatureOrgIntegrationEnvironment;
      isDefault: boolean;
    } | null;
    signers: Array<{
      __typename?: "PetitionSigner";
      contactId?: string | null;
      firstName: string;
      lastName?: string | null;
      email: string;
      fullName: string;
    }>;
  } | null;
  currentSignatureRequest?: {
    __typename?: "PetitionSignatureRequest";
    environment: SignatureOrgIntegrationEnvironment;
  } | null;
};

export type PetitionSignaturesCard_updatePetitionSignatureConfigMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  signatureConfig?: InputMaybe<SignatureConfigInput>;
}>;

export type PetitionSignaturesCard_updatePetitionSignatureConfigMutation = {
  updatePetition:
    | {
        __typename?: "Petition";
        id: string;
        status: PetitionStatus;
        name?: string | null;
        signatureRequests: Array<{
          __typename?: "PetitionSignatureRequest";
          id: string;
          status: PetitionSignatureRequestStatus;
          signerStatus: Array<{
            __typename?: "PetitionSignatureRequestSignerStatus";
            status: string;
            sentAt?: string | null;
            openedAt?: string | null;
            signedAt?: string | null;
            declinedAt?: string | null;
            signer: { __typename?: "PetitionSigner"; email: string; fullName: string };
          }>;
          signatureConfig: {
            __typename?: "SignatureConfig";
            signers: Array<{ __typename?: "PetitionSigner"; email: string; fullName: string }>;
          };
        }>;
        accesses: Array<{
          __typename?: "PetitionAccess";
          status: PetitionAccessStatus;
          id: string;
          contact?: {
            __typename?: "Contact";
            id: string;
            firstName: string;
            lastName?: string | null;
            email: string;
          } | null;
        }>;
        signatureConfig?: {
          __typename?: "SignatureConfig";
          title: string;
          review: boolean;
          allowAdditionalSigners: boolean;
          timezone: string;
          integration?: {
            __typename?: "SignatureOrgIntegration";
            id: string;
            name: string;
            provider: SignatureOrgIntegrationProvider;
            environment: SignatureOrgIntegrationEnvironment;
            isDefault: boolean;
          } | null;
          signers: Array<{
            __typename?: "PetitionSigner";
            contactId?: string | null;
            firstName: string;
            lastName?: string | null;
            email: string;
            fullName: string;
          }>;
        } | null;
        currentSignatureRequest?: {
          __typename?: "PetitionSignatureRequest";
          environment: SignatureOrgIntegrationEnvironment;
        } | null;
      }
    | { __typename?: "PetitionTemplate" };
};

export type PetitionSignaturesCard_cancelSignatureRequestMutationVariables = Exact<{
  petitionSignatureRequestId: Scalars["GID"];
}>;

export type PetitionSignaturesCard_cancelSignatureRequestMutation = {
  cancelSignatureRequest: {
    __typename?: "PetitionSignatureRequest";
    id: string;
    status: PetitionSignatureRequestStatus;
  };
};

export type PetitionSignaturesCard_startSignatureRequestMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  message?: InputMaybe<Scalars["String"]>;
}>;

export type PetitionSignaturesCard_startSignatureRequestMutation = {
  startSignatureRequest: {
    __typename?: "PetitionSignatureRequest";
    id: string;
    status: PetitionSignatureRequestStatus;
  };
};

export type PetitionSignaturesCard_signedPetitionDownloadLinkMutationVariables = Exact<{
  petitionSignatureRequestId: Scalars["GID"];
  preview?: InputMaybe<Scalars["Boolean"]>;
}>;

export type PetitionSignaturesCard_signedPetitionDownloadLinkMutation = {
  signedPetitionDownloadLink: {
    __typename?: "FileUploadDownloadLinkResult";
    result: Result;
    url?: string | null;
  };
};

export type PetitionSignaturesCard_sendSignatureRequestRemindersMutationVariables = Exact<{
  petitionSignatureRequestId: Scalars["GID"];
}>;

export type PetitionSignaturesCard_sendSignatureRequestRemindersMutation = {
  sendSignatureRequestReminders: Result;
};

export type useClosePetitionDialog_PetitionFragment = {
  __typename?: "Petition";
  id: string;
  closingEmailBody?: any | null;
};

export type ExportRepliesDialog_UserFragment = {
  __typename?: "User";
  hasExportCuatrecasas: boolean;
};

export type ExportRepliesDialog_PetitionFieldFragment = {
  __typename?: "PetitionField";
  id: string;
  type: PetitionFieldType;
  title?: string | null;
  replies: Array<{ __typename?: "PetitionFieldReply"; content: { [key: string]: any } }>;
};

export type ExportRepliesProgressDialog_PetitionFragment = {
  __typename?: "Petition";
  id: string;
  fields: Array<{
    __typename?: "PetitionField";
    id: string;
    type: PetitionFieldType;
    title?: string | null;
    replies: Array<{
      __typename?: "PetitionFieldReply";
      id: string;
      metadata: { [key: string]: any };
      content: { [key: string]: any };
    }>;
  }>;
  currentSignatureRequest?: {
    __typename?: "PetitionSignatureRequest";
    id: string;
    status: PetitionSignatureRequestStatus;
    signedDocumentFilename?: string | null;
    auditTrailFilename?: string | null;
    metadata: { [key: string]: any };
  } | null;
};

export type ExportRepliesProgressDialog_petitionQueryVariables = Exact<{
  petitionId: Scalars["GID"];
}>;

export type ExportRepliesProgressDialog_petitionQuery = {
  petition?:
    | {
        __typename?: "Petition";
        id: string;
        fields: Array<{
          __typename?: "PetitionField";
          id: string;
          type: PetitionFieldType;
          title?: string | null;
          replies: Array<{
            __typename?: "PetitionFieldReply";
            id: string;
            metadata: { [key: string]: any };
            content: { [key: string]: any };
          }>;
        }>;
        currentSignatureRequest?: {
          __typename?: "PetitionSignatureRequest";
          id: string;
          status: PetitionSignatureRequestStatus;
          signedDocumentFilename?: string | null;
          auditTrailFilename?: string | null;
          metadata: { [key: string]: any };
        } | null;
      }
    | { __typename?: "PetitionTemplate" }
    | null;
};

export type ExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  replyId: Scalars["GID"];
}>;

export type ExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutation = {
  fileUploadReplyDownloadLink: {
    __typename?: "FileUploadDownloadLinkResult";
    result: Result;
    url?: string | null;
  };
};

export type ExportRepliesProgressDialog_signedPetitionDownloadLinkMutationVariables = Exact<{
  petitionSignatureRequestId: Scalars["GID"];
  downloadAuditTrail?: InputMaybe<Scalars["Boolean"]>;
}>;

export type ExportRepliesProgressDialog_signedPetitionDownloadLinkMutation = {
  signedPetitionDownloadLink: {
    __typename?: "FileUploadDownloadLinkResult";
    result: Result;
    url?: string | null;
  };
};

export type ExportRepliesProgressDialog_updatePetitionFieldReplyMetadataMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  replyId: Scalars["GID"];
  metadata: Scalars["JSONObject"];
}>;

export type ExportRepliesProgressDialog_updatePetitionFieldReplyMetadataMutation = {
  updatePetitionFieldReplyMetadata: {
    __typename?: "PetitionFieldReply";
    id: string;
    metadata: { [key: string]: any };
  };
};

export type ExportRepliesProgressDialog_updateSignatureRequestMetadataMutationVariables = Exact<{
  petitionSignatureRequestId: Scalars["GID"];
  metadata: Scalars["JSONObject"];
}>;

export type ExportRepliesProgressDialog_updateSignatureRequestMetadataMutation = {
  updateSignatureRequestMetadata: {
    __typename?: "PetitionSignatureRequest";
    id: string;
    metadata: { [key: string]: any };
  };
};

export type PublicSignupForm_emailIsAvailableQueryVariables = Exact<{
  email: Scalars["String"];
}>;

export type PublicSignupForm_emailIsAvailableQuery = { emailIsAvailable: boolean };

export type LandingTemplateCard_LandingTemplateFragment = {
  __typename?: "LandingTemplate";
  id: string;
  locale: PetitionLocale;
  name?: string | null;
  slug: string;
  imageUrl?: string | null;
  backgroundColor?: string | null;
  ownerFullName: string;
  organizationName: string;
};

export type RecipientViewContentsCard_PublicUserFragment = {
  __typename?: "PublicUser";
  firstName?: string | null;
};

export type RecipientViewContentsCard_PublicPetitionFragment = {
  __typename?: "PublicPetition";
  fields: Array<{
    __typename?: "PublicPetitionField";
    id: string;
    type: PetitionFieldType;
    title?: string | null;
    options: { [key: string]: any };
    optional: boolean;
    isInternal: boolean;
    isReadOnly: boolean;
    commentCount: number;
    unreadCommentCount: number;
    hasCommentsEnabled: boolean;
    visibility?: { [key: string]: any } | null;
    replies: Array<{
      __typename?: "PublicPetitionFieldReply";
      id: string;
      status: PetitionFieldReplyStatus;
      content: { [key: string]: any };
    }>;
  }>;
};

export type RecipientViewContentsCard_PublicPetitionFieldFragment = {
  __typename?: "PublicPetitionField";
  id: string;
  type: PetitionFieldType;
  title?: string | null;
  options: { [key: string]: any };
  optional: boolean;
  isInternal: boolean;
  isReadOnly: boolean;
  commentCount: number;
  unreadCommentCount: number;
  hasCommentsEnabled: boolean;
  visibility?: { [key: string]: any } | null;
  replies: Array<{
    __typename?: "PublicPetitionFieldReply";
    id: string;
    status: PetitionFieldReplyStatus;
    content: { [key: string]: any };
  }>;
};

export type RecipientViewContentsCard_PetitionBase_Petition_Fragment = {
  __typename?: "Petition";
  fields: Array<{
    __typename?: "PetitionField";
    id: string;
    type: PetitionFieldType;
    title?: string | null;
    options: { [key: string]: any };
    optional: boolean;
    isInternal: boolean;
    isReadOnly: boolean;
    commentCount: number;
    unreadCommentCount: number;
    hasCommentsEnabled: boolean;
    visibility?: { [key: string]: any } | null;
    replies: Array<{
      __typename?: "PetitionFieldReply";
      id: string;
      status: PetitionFieldReplyStatus;
      content: { [key: string]: any };
    }>;
    previewReplies: Array<{
      __typename?: "PetitionFieldReply";
      id: string;
      content: { [key: string]: any };
    }>;
  }>;
};

export type RecipientViewContentsCard_PetitionBase_PetitionTemplate_Fragment = {
  __typename?: "PetitionTemplate";
  fields: Array<{
    __typename?: "PetitionField";
    id: string;
    type: PetitionFieldType;
    title?: string | null;
    options: { [key: string]: any };
    optional: boolean;
    isInternal: boolean;
    isReadOnly: boolean;
    commentCount: number;
    unreadCommentCount: number;
    hasCommentsEnabled: boolean;
    visibility?: { [key: string]: any } | null;
    replies: Array<{
      __typename?: "PetitionFieldReply";
      id: string;
      status: PetitionFieldReplyStatus;
      content: { [key: string]: any };
    }>;
    previewReplies: Array<{
      __typename?: "PetitionFieldReply";
      id: string;
      content: { [key: string]: any };
    }>;
  }>;
};

export type RecipientViewContentsCard_PetitionBaseFragment =
  | RecipientViewContentsCard_PetitionBase_Petition_Fragment
  | RecipientViewContentsCard_PetitionBase_PetitionTemplate_Fragment;

export type RecipientViewContentsCard_PetitionFieldFragment = {
  __typename?: "PetitionField";
  id: string;
  type: PetitionFieldType;
  title?: string | null;
  options: { [key: string]: any };
  optional: boolean;
  isInternal: boolean;
  isReadOnly: boolean;
  commentCount: number;
  unreadCommentCount: number;
  hasCommentsEnabled: boolean;
  visibility?: { [key: string]: any } | null;
  replies: Array<{
    __typename?: "PetitionFieldReply";
    id: string;
    status: PetitionFieldReplyStatus;
    content: { [key: string]: any };
  }>;
  previewReplies: Array<{
    __typename?: "PetitionFieldReply";
    id: string;
    content: { [key: string]: any };
  }>;
};

export type RecipientViewHeader_PublicContactFragment = {
  __typename?: "PublicContact";
  id: string;
  fullName: string;
  firstName: string;
  email: string;
};

export type RecipientViewHeader_PublicUserFragment = {
  __typename?: "PublicUser";
  id: string;
  firstName?: string | null;
  fullName: string;
  email: string;
  organization: { __typename?: "PublicOrganization"; name: string; logoUrl?: string | null };
};

export type RecipientViewHeader_publicDelegateAccessToContactMutationVariables = Exact<{
  keycode: Scalars["ID"];
  email: Scalars["String"];
  firstName: Scalars["String"];
  lastName: Scalars["String"];
  messageBody: Scalars["JSON"];
}>;

export type RecipientViewHeader_publicDelegateAccessToContactMutation = {
  publicDelegateAccessToContact: {
    __typename?: "PublicPetitionAccess";
    petition?: {
      __typename?: "PublicPetition";
      id: string;
      recipients: Array<{
        __typename?: "PublicContact";
        id: string;
        fullName: string;
        email: string;
      }>;
    } | null;
  };
};

export type RecipientViewProgressFooter_PetitionFragment = {
  __typename?: "Petition";
  status: PetitionStatus;
  fields: Array<{
    __typename?: "PetitionField";
    id: string;
    type: PetitionFieldType;
    optional: boolean;
    isInternal: boolean;
    isReadOnly: boolean;
    options: { [key: string]: any };
    visibility?: { [key: string]: any } | null;
    replies: Array<{
      __typename?: "PetitionFieldReply";
      id: string;
      content: { [key: string]: any };
    }>;
    previewReplies: Array<{
      __typename?: "PetitionFieldReply";
      id: string;
      content: { [key: string]: any };
    }>;
  }>;
  signatureConfig?: { __typename?: "SignatureConfig"; review: boolean } | null;
};

export type RecipientViewProgressFooter_PetitionFieldFragment = {
  __typename?: "PetitionField";
  id: string;
  type: PetitionFieldType;
  optional: boolean;
  isInternal: boolean;
  isReadOnly: boolean;
  options: { [key: string]: any };
  visibility?: { [key: string]: any } | null;
  replies: Array<{
    __typename?: "PetitionFieldReply";
    id: string;
    content: { [key: string]: any };
  }>;
  previewReplies: Array<{
    __typename?: "PetitionFieldReply";
    id: string;
    content: { [key: string]: any };
  }>;
};

export type RecipientViewProgressFooter_PublicPetitionFragment = {
  __typename?: "PublicPetition";
  status: PetitionStatus;
  fields: Array<{
    __typename?: "PublicPetitionField";
    id: string;
    type: PetitionFieldType;
    optional: boolean;
    isInternal: boolean;
    isReadOnly: boolean;
    options: { [key: string]: any };
    visibility?: { [key: string]: any } | null;
    replies: Array<{
      __typename?: "PublicPetitionFieldReply";
      id: string;
      content: { [key: string]: any };
    }>;
  }>;
  signatureConfig?: { __typename?: "PublicSignatureConfig"; review: boolean } | null;
};

export type RecipientViewProgressFooter_PublicPetitionFieldFragment = {
  __typename?: "PublicPetitionField";
  id: string;
  type: PetitionFieldType;
  optional: boolean;
  isInternal: boolean;
  isReadOnly: boolean;
  options: { [key: string]: any };
  visibility?: { [key: string]: any } | null;
  replies: Array<{
    __typename?: "PublicPetitionFieldReply";
    id: string;
    content: { [key: string]: any };
  }>;
};

export type useRecipientViewConfirmPetitionSignersDialog_PetitionSignerFragment = {
  __typename?: "PetitionSigner";
  firstName: string;
  lastName?: string | null;
  fullName: string;
  email: string;
};

export type useRecipientViewConfirmPetitionSignersDialog_PublicContactFragment = {
  __typename?: "PublicContact";
  firstName: string;
  lastName?: string | null;
  email: string;
};

export type RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccessFragment = {
  __typename?: "PublicPetitionAccess";
  granter?: { __typename?: "PublicUser"; fullName: string } | null;
  contact?: { __typename?: "PublicContact"; id: string } | null;
};

export type RecipientViewPetitionFieldCommentsDialog_PetitionFieldFragment = {
  __typename?: "PetitionField";
  id: string;
  title?: string | null;
};

export type RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldFragment = {
  __typename?: "PublicPetitionField";
  id: string;
  title?: string | null;
  commentCount: number;
  unreadCommentCount: number;
};

export type RecipientViewPetitionFieldCommentsDialog_publicPetitionFieldQueryVariables = Exact<{
  keycode: Scalars["ID"];
  petitionFieldId: Scalars["GID"];
}>;

export type RecipientViewPetitionFieldCommentsDialog_publicPetitionFieldQuery = {
  publicPetitionField: {
    __typename?: "PublicPetitionField";
    id: string;
    title?: string | null;
    commentCount: number;
    unreadCommentCount: number;
    comments: Array<{
      __typename?: "PublicPetitionFieldComment";
      id: string;
      content: string;
      createdAt: string;
      isUnread: boolean;
      author?:
        | { __typename?: "PublicContact"; id: string; fullName: string }
        | { __typename?: "PublicUser"; id: string; fullName: string }
        | null;
    }>;
  };
};

export type RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutationVariables =
  Exact<{
    keycode: Scalars["ID"];
    petitionFieldCommentIds: Array<Scalars["GID"]> | Scalars["GID"];
  }>;

export type RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutation = {
  publicMarkPetitionFieldCommentsAsRead: Array<{
    __typename?: "PublicPetitionFieldComment";
    id: string;
    isUnread: boolean;
  }>;
};

export type RecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutationVariables =
  Exact<{
    keycode: Scalars["ID"];
    petitionFieldId: Scalars["GID"];
    content: Scalars["String"];
  }>;

export type RecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutation = {
  publicCreatePetitionFieldComment: {
    __typename?: "PublicPetitionFieldComment";
    id: string;
    content: string;
    createdAt: string;
    isUnread: boolean;
    field: {
      __typename?: "PublicPetitionField";
      id: string;
      commentCount: number;
      unreadCommentCount: number;
      comments: Array<{ __typename?: "PublicPetitionFieldComment"; id: string }>;
    };
    author?:
      | { __typename?: "PublicContact"; id: string; fullName: string }
      | { __typename?: "PublicUser"; id: string; fullName: string }
      | null;
  };
};

export type RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutationVariables =
  Exact<{
    keycode: Scalars["ID"];
    petitionFieldId: Scalars["GID"];
    petitionFieldCommentId: Scalars["GID"];
    content: Scalars["String"];
  }>;

export type RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutation = {
  publicUpdatePetitionFieldComment: {
    __typename?: "PublicPetitionFieldComment";
    id: string;
    content: string;
    createdAt: string;
    isUnread: boolean;
    author?:
      | { __typename?: "PublicContact"; id: string; fullName: string }
      | { __typename?: "PublicUser"; id: string; fullName: string }
      | null;
  };
};

export type RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutationVariables =
  Exact<{
    keycode: Scalars["ID"];
    petitionFieldId: Scalars["GID"];
    petitionFieldCommentId: Scalars["GID"];
  }>;

export type RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutation = {
  publicDeletePetitionFieldComment: {
    __typename?: "PublicPetitionField";
    id: string;
    commentCount: number;
    unreadCommentCount: number;
    comments: Array<{ __typename?: "PublicPetitionFieldComment"; id: string }>;
  };
};

export type RecipientViewPetitionField_PublicPetitionAccessFragment = {
  __typename?: "PublicPetitionAccess";
  granter?: { __typename?: "PublicUser"; fullName: string } | null;
  contact?: { __typename?: "PublicContact"; id: string } | null;
};

export type RecipientViewPetitionField_PublicPetitionFieldFragment = {
  __typename?: "PublicPetitionField";
  id: string;
  type: PetitionFieldType;
  title?: string | null;
  description?: string | null;
  options: { [key: string]: any };
  optional: boolean;
  multiple: boolean;
  isInternal: boolean;
  commentCount: number;
  unreadCommentCount: number;
  hasCommentsEnabled: boolean;
  replies: Array<{
    __typename?: "PublicPetitionFieldReply";
    id: string;
    status: PetitionFieldReplyStatus;
    content: { [key: string]: any };
    createdAt: string;
    updatedAt: string;
  }>;
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
};

export type RecipientViewPetitionField_PublicPetitionFieldReplyFragment = {
  __typename?: "PublicPetitionFieldReply";
  content: { [key: string]: any };
};

export type RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLinkMutationVariables =
  Exact<{
    keycode: Scalars["ID"];
    fieldId: Scalars["GID"];
    attachmentId: Scalars["GID"];
  }>;

export type RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLinkMutation = {
  publicPetitionFieldAttachmentDownloadLink: {
    __typename?: "FileUploadDownloadLinkResult";
    url?: string | null;
  };
};

export type RecipientViewPetitionField_publicDeletePetitionFieldReplyMutationVariables = Exact<{
  replyId: Scalars["GID"];
  keycode: Scalars["ID"];
}>;

export type RecipientViewPetitionField_publicDeletePetitionFieldReplyMutation = {
  publicDeletePetitionFieldReply: {
    __typename?: "PublicPetitionField";
    id: string;
    replies: Array<{ __typename?: "PublicPetitionFieldReply"; id: string }>;
    petition: { __typename?: "PublicPetition"; id: string; status: PetitionStatus };
  };
};

export type RecipientViewPetitionField_publicCreatePetitionFieldReplyMutationVariables = Exact<{
  keycode: Scalars["ID"];
  fieldId: Scalars["GID"];
  reply: Scalars["JSON"];
}>;

export type RecipientViewPetitionField_publicCreatePetitionFieldReplyMutation = {
  publicCreatePetitionFieldReply: {
    __typename?: "PublicPetitionFieldReply";
    id: string;
    status: PetitionFieldReplyStatus;
    content: { [key: string]: any };
    createdAt: string;
    updatedAt: string;
    field: {
      __typename?: "PublicPetitionField";
      id: string;
      petition: { __typename?: "PublicPetition"; id: string; status: PetitionStatus };
      replies: Array<{ __typename?: "PublicPetitionFieldReply"; id: string }>;
    };
  };
};

export type RecipientViewPetitionField_publicUpdatePetitionFieldReplyMutationVariables = Exact<{
  keycode: Scalars["ID"];
  replyId: Scalars["GID"];
  reply: Scalars["JSON"];
}>;

export type RecipientViewPetitionField_publicUpdatePetitionFieldReplyMutation = {
  publicUpdatePetitionFieldReply: {
    __typename?: "PublicPetitionFieldReply";
    id: string;
    status: PetitionFieldReplyStatus;
    content: { [key: string]: any };
    createdAt: string;
    updatedAt: string;
    field: {
      __typename?: "PublicPetitionField";
      id: string;
      petition: { __typename?: "PublicPetition"; id: string; status: PetitionStatus };
    };
  };
};

export type RecipientViewPetitionFieldCard_PetitionFieldFragment = {
  __typename?: "PetitionField";
  id: string;
  type: PetitionFieldType;
  title?: string | null;
  description?: string | null;
  options: { [key: string]: any };
  optional: boolean;
  multiple: boolean;
  isInternal: boolean;
  commentCount: number;
  unreadCommentCount: number;
  hasCommentsEnabled: boolean;
  replies: Array<{
    __typename?: "PetitionFieldReply";
    id: string;
    status: PetitionFieldReplyStatus;
    content: { [key: string]: any };
    createdAt: string;
    updatedAt: string;
  }>;
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
};

export type RecipientViewPetitionFieldCard_PetitionFieldReplyFragment = {
  __typename?: "PetitionFieldReply";
  id: string;
  status: PetitionFieldReplyStatus;
  content: { [key: string]: any };
  createdAt: string;
  updatedAt: string;
};

export type RecipientViewPetitionFieldCard_PublicPetitionFieldFragment = {
  __typename?: "PublicPetitionField";
  id: string;
  type: PetitionFieldType;
  title?: string | null;
  description?: string | null;
  options: { [key: string]: any };
  optional: boolean;
  multiple: boolean;
  isInternal: boolean;
  commentCount: number;
  unreadCommentCount: number;
  hasCommentsEnabled: boolean;
  replies: Array<{
    __typename?: "PublicPetitionFieldReply";
    id: string;
    status: PetitionFieldReplyStatus;
    content: { [key: string]: any };
    createdAt: string;
    updatedAt: string;
  }>;
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
};

export type RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragment = {
  __typename?: "PublicPetitionFieldReply";
  id: string;
  status: PetitionFieldReplyStatus;
  content: { [key: string]: any };
  createdAt: string;
  updatedAt: string;
};

export type RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkMutationVariables =
  Exact<{
    keycode: Scalars["ID"];
    replyId: Scalars["GID"];
    preview?: InputMaybe<Scalars["Boolean"]>;
  }>;

export type RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkMutation = {
  publicFileUploadReplyDownloadLink: {
    __typename?: "FileUploadDownloadLinkResult";
    result: Result;
    url?: string | null;
  };
};

export type RecipientViewPetitionFieldFileUpload_fileUploadReplyDownloadLinkMutationVariables =
  Exact<{
    petitionId: Scalars["GID"];
    replyId: Scalars["GID"];
    preview?: InputMaybe<Scalars["Boolean"]>;
  }>;

export type RecipientViewPetitionFieldFileUpload_fileUploadReplyDownloadLinkMutation = {
  fileUploadReplyDownloadLink: {
    __typename?: "FileUploadDownloadLinkResult";
    result: Result;
    url?: string | null;
  };
};

export type RecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutationVariables =
  Exact<{
    keycode: Scalars["ID"];
    fieldId: Scalars["GID"];
    data: FileUploadInput;
  }>;

export type RecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutation = {
  publicCreateFileUploadReply: {
    __typename?: "PublicCreateFileUploadReply";
    presignedPostData: {
      __typename?: "AWSPresignedPostData";
      url: string;
      fields: { [key: string]: any };
    };
    reply: {
      __typename?: "PublicPetitionFieldReply";
      id: string;
      status: PetitionFieldReplyStatus;
      content: { [key: string]: any };
      createdAt: string;
      updatedAt: string;
      field: {
        __typename?: "PublicPetitionField";
        id: string;
        petition: { __typename?: "PublicPetition"; id: string; status: PetitionStatus };
        replies: Array<{ __typename?: "PublicPetitionFieldReply"; id: string }>;
      };
    };
  };
};

export type RecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutationVariables =
  Exact<{
    keycode: Scalars["ID"];
    replyId: Scalars["GID"];
  }>;

export type RecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutation = {
  publicFileUploadReplyComplete: {
    __typename?: "PublicPetitionFieldReply";
    id: string;
    content: { [key: string]: any };
  };
};

export type RecipientViewPetitionFieldMutations_updateReplyContent_PublicPetitionFieldReplyFragment =
  { __typename?: "PublicPetitionFieldReply"; content: { [key: string]: any } };

export type CreateOrUpdateEventSubscriptionDialog_PetitionEventSubscriptionFragment = {
  __typename?: "PetitionEventSubscription";
  eventsUrl: string;
  eventTypes?: Array<PetitionEventType> | null;
  name?: string | null;
};

export type GenerateNewTokenDialog_generateUserAuthTokenMutationVariables = Exact<{
  tokenName: Scalars["String"];
}>;

export type GenerateNewTokenDialog_generateUserAuthTokenMutation = {
  generateUserAuthToken: {
    __typename?: "GenerateUserAuthTokenResponse";
    apiKey: string;
    userAuthToken: {
      __typename?: "UserAuthenticationToken";
      id: string;
      tokenName: string;
      createdAt: string;
      lastUsedAt?: string | null;
    };
  };
};

export type Admin_userQueryVariables = Exact<{ [key: string]: never }>;

export type Admin_userQuery = {
  me: {
    __typename?: "User";
    id: string;
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    createdAt: string;
    canCreateUsers: boolean;
    isSuperAdmin: boolean;
    role: OrganizationRole;
    avatarUrl?: string | null;
    initials?: string | null;
    organization: {
      __typename?: "Organization";
      id: string;
      usageLimits: {
        __typename?: "OrganizationUsageLimit";
        petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
      };
    };
  };
};

export type AdminOrganizations_OrganizationFragment = {
  __typename?: "Organization";
  id: string;
  _id: number;
  name: string;
  status: OrganizationStatus;
  activeUserCount: number;
  createdAt: string;
  usageLimits: {
    __typename?: "OrganizationUsageLimit";
    users: { __typename?: "OrganizationUsageUserLimit"; limit: number };
    petitions: { __typename?: "OrganizationUsagePetitionLimit"; used: number; limit: number };
  };
};

export type AdminOrganizations_UserFragment = {
  __typename?: "User";
  id: string;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  createdAt: string;
  canCreateUsers: boolean;
  isSuperAdmin: boolean;
  role: OrganizationRole;
  avatarUrl?: string | null;
  initials?: string | null;
  organization: {
    __typename?: "Organization";
    id: string;
    usageLimits: {
      __typename?: "OrganizationUsageLimit";
      petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
    };
  };
};

export type AdminOrganizations_organizationsQueryVariables = Exact<{
  offset: Scalars["Int"];
  limit: Scalars["Int"];
  search?: InputMaybe<Scalars["String"]>;
  sortBy?: InputMaybe<Array<QueryOrganizations_OrderBy> | QueryOrganizations_OrderBy>;
  status?: InputMaybe<OrganizationStatus>;
}>;

export type AdminOrganizations_organizationsQuery = {
  organizations: {
    __typename?: "OrganizationPagination";
    totalCount: number;
    items: Array<{
      __typename?: "Organization";
      id: string;
      _id: number;
      name: string;
      status: OrganizationStatus;
      activeUserCount: number;
      createdAt: string;
      usageLimits: {
        __typename?: "OrganizationUsageLimit";
        users: { __typename?: "OrganizationUsageUserLimit"; limit: number };
        petitions: { __typename?: "OrganizationUsagePetitionLimit"; used: number; limit: number };
      };
    }>;
  };
};

export type AdminOrganizations_userQueryVariables = Exact<{ [key: string]: never }>;

export type AdminOrganizations_userQuery = {
  me: {
    __typename?: "User";
    id: string;
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    createdAt: string;
    canCreateUsers: boolean;
    isSuperAdmin: boolean;
    role: OrganizationRole;
    avatarUrl?: string | null;
    initials?: string | null;
    organization: {
      __typename?: "Organization";
      id: string;
      usageLimits: {
        __typename?: "OrganizationUsageLimit";
        petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
      };
    };
  };
};

export type AdminSupportMethods_UserFragment = {
  __typename?: "User";
  id: string;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  createdAt: string;
  canCreateUsers: boolean;
  isSuperAdmin: boolean;
  role: OrganizationRole;
  avatarUrl?: string | null;
  initials?: string | null;
  organization: {
    __typename?: "Organization";
    id: string;
    usageLimits: {
      __typename?: "OrganizationUsageLimit";
      petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
    };
  };
};

export type AdminSupportMethods_userQueryVariables = Exact<{ [key: string]: never }>;

export type AdminSupportMethods_userQuery = {
  me: {
    __typename?: "User";
    id: string;
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    createdAt: string;
    canCreateUsers: boolean;
    isSuperAdmin: boolean;
    role: OrganizationRole;
    avatarUrl?: string | null;
    initials?: string | null;
    organization: {
      __typename?: "Organization";
      id: string;
      usageLimits: {
        __typename?: "OrganizationUsageLimit";
        petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
      };
    };
  };
};

export type Contact_ContactFragment = {
  __typename?: "Contact";
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName?: string | null;
  accesses: {
    __typename?: "PetitionAccessPagination";
    items: Array<{
      __typename?: "PetitionAccess";
      id: string;
      petition?: {
        __typename?: "Petition";
        id: string;
        name?: string | null;
        sentAt?: string | null;
        status: PetitionStatus;
        permissions: Array<
          | {
              __typename?: "PetitionUserGroupPermission";
              permissionType: PetitionPermissionType;
              group: { __typename?: "UserGroup"; id: string; name: string; initials: string };
            }
          | {
              __typename?: "PetitionUserPermission";
              permissionType: PetitionPermissionType;
              user: {
                __typename?: "User";
                id: string;
                fullName?: string | null;
                avatarUrl?: string | null;
                initials?: string | null;
              };
            }
        >;
        progress: {
          __typename?: "PetitionProgress";
          external: {
            __typename?: "PetitionFieldProgress";
            validated: number;
            replied: number;
            optional: number;
            total: number;
          };
          internal: {
            __typename?: "PetitionFieldProgress";
            validated: number;
            replied: number;
            optional: number;
            total: number;
          };
        };
        currentSignatureRequest?: {
          __typename?: "PetitionSignatureRequest";
          status: PetitionSignatureRequestStatus;
          environment: SignatureOrgIntegrationEnvironment;
        } | null;
        signatureConfig?: {
          __typename?: "SignatureConfig";
          review: boolean;
          integration?: {
            __typename?: "SignatureOrgIntegration";
            environment: SignatureOrgIntegrationEnvironment;
          } | null;
        } | null;
      } | null;
    }>;
  };
};

export type Contact_Contact_ProfileFragment = {
  __typename?: "Contact";
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName?: string | null;
};

export type Contact_PetitionAccessFragment = {
  __typename?: "PetitionAccess";
  id: string;
  petition?: {
    __typename?: "Petition";
    id: string;
    name?: string | null;
    sentAt?: string | null;
    status: PetitionStatus;
    permissions: Array<
      | {
          __typename?: "PetitionUserGroupPermission";
          permissionType: PetitionPermissionType;
          group: { __typename?: "UserGroup"; id: string; name: string; initials: string };
        }
      | {
          __typename?: "PetitionUserPermission";
          permissionType: PetitionPermissionType;
          user: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            avatarUrl?: string | null;
            initials?: string | null;
          };
        }
    >;
    progress: {
      __typename?: "PetitionProgress";
      external: {
        __typename?: "PetitionFieldProgress";
        validated: number;
        replied: number;
        optional: number;
        total: number;
      };
      internal: {
        __typename?: "PetitionFieldProgress";
        validated: number;
        replied: number;
        optional: number;
        total: number;
      };
    };
    currentSignatureRequest?: {
      __typename?: "PetitionSignatureRequest";
      status: PetitionSignatureRequestStatus;
      environment: SignatureOrgIntegrationEnvironment;
    } | null;
    signatureConfig?: {
      __typename?: "SignatureConfig";
      review: boolean;
      integration?: {
        __typename?: "SignatureOrgIntegration";
        environment: SignatureOrgIntegrationEnvironment;
      } | null;
    } | null;
  } | null;
};

export type Contact_PetitionFragment = {
  __typename?: "Petition";
  id: string;
  name?: string | null;
  sentAt?: string | null;
  status: PetitionStatus;
  permissions: Array<
    | {
        __typename?: "PetitionUserGroupPermission";
        permissionType: PetitionPermissionType;
        group: { __typename?: "UserGroup"; id: string; name: string; initials: string };
      }
    | {
        __typename?: "PetitionUserPermission";
        permissionType: PetitionPermissionType;
        user: {
          __typename?: "User";
          id: string;
          fullName?: string | null;
          avatarUrl?: string | null;
          initials?: string | null;
        };
      }
  >;
  progress: {
    __typename?: "PetitionProgress";
    external: {
      __typename?: "PetitionFieldProgress";
      validated: number;
      replied: number;
      optional: number;
      total: number;
    };
    internal: {
      __typename?: "PetitionFieldProgress";
      validated: number;
      replied: number;
      optional: number;
      total: number;
    };
  };
  currentSignatureRequest?: {
    __typename?: "PetitionSignatureRequest";
    status: PetitionSignatureRequestStatus;
    environment: SignatureOrgIntegrationEnvironment;
  } | null;
  signatureConfig?: {
    __typename?: "SignatureConfig";
    review: boolean;
    integration?: {
      __typename?: "SignatureOrgIntegration";
      environment: SignatureOrgIntegrationEnvironment;
    } | null;
  } | null;
};

export type Contact_UserFragment = {
  __typename?: "User";
  id: string;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  createdAt: string;
  canCreateUsers: boolean;
  isSuperAdmin: boolean;
  role: OrganizationRole;
  avatarUrl?: string | null;
  initials?: string | null;
  organization: {
    __typename?: "Organization";
    id: string;
    usageLimits: {
      __typename?: "OrganizationUsageLimit";
      petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
    };
  };
};

export type Contact_updateContactMutationVariables = Exact<{
  id: Scalars["GID"];
  data: UpdateContactInput;
}>;

export type Contact_updateContactMutation = {
  updateContact: {
    __typename?: "Contact";
    id: string;
    email: string;
    fullName: string;
    firstName: string;
    lastName?: string | null;
  };
};

export type Contact_userQueryVariables = Exact<{ [key: string]: never }>;

export type Contact_userQuery = {
  me: {
    __typename?: "User";
    id: string;
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    createdAt: string;
    canCreateUsers: boolean;
    isSuperAdmin: boolean;
    role: OrganizationRole;
    avatarUrl?: string | null;
    initials?: string | null;
    organization: {
      __typename?: "Organization";
      id: string;
      usageLimits: {
        __typename?: "OrganizationUsageLimit";
        petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
      };
    };
  };
};

export type Contact_contactQueryVariables = Exact<{
  id: Scalars["GID"];
}>;

export type Contact_contactQuery = {
  contact?: {
    __typename?: "Contact";
    id: string;
    email: string;
    fullName: string;
    firstName: string;
    lastName?: string | null;
    accesses: {
      __typename?: "PetitionAccessPagination";
      items: Array<{
        __typename?: "PetitionAccess";
        id: string;
        petition?: {
          __typename?: "Petition";
          id: string;
          name?: string | null;
          sentAt?: string | null;
          status: PetitionStatus;
          permissions: Array<
            | {
                __typename?: "PetitionUserGroupPermission";
                permissionType: PetitionPermissionType;
                group: { __typename?: "UserGroup"; id: string; name: string; initials: string };
              }
            | {
                __typename?: "PetitionUserPermission";
                permissionType: PetitionPermissionType;
                user: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  avatarUrl?: string | null;
                  initials?: string | null;
                };
              }
          >;
          progress: {
            __typename?: "PetitionProgress";
            external: {
              __typename?: "PetitionFieldProgress";
              validated: number;
              replied: number;
              optional: number;
              total: number;
            };
            internal: {
              __typename?: "PetitionFieldProgress";
              validated: number;
              replied: number;
              optional: number;
              total: number;
            };
          };
          currentSignatureRequest?: {
            __typename?: "PetitionSignatureRequest";
            status: PetitionSignatureRequestStatus;
            environment: SignatureOrgIntegrationEnvironment;
          } | null;
          signatureConfig?: {
            __typename?: "SignatureConfig";
            review: boolean;
            integration?: {
              __typename?: "SignatureOrgIntegration";
              environment: SignatureOrgIntegrationEnvironment;
            } | null;
          } | null;
        } | null;
      }>;
    };
  } | null;
};

export type Contacts_ContactsListFragment = {
  __typename?: "ContactPagination";
  totalCount: number;
  items: Array<{
    __typename?: "Contact";
    id: string;
    fullName: string;
    firstName: string;
    lastName?: string | null;
    email: string;
    createdAt: string;
  }>;
};

export type Contacts_UserFragment = {
  __typename?: "User";
  id: string;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  createdAt: string;
  canCreateUsers: boolean;
  isSuperAdmin: boolean;
  role: OrganizationRole;
  avatarUrl?: string | null;
  initials?: string | null;
  organization: {
    __typename?: "Organization";
    id: string;
    usageLimits: {
      __typename?: "OrganizationUsageLimit";
      petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
    };
  };
};

export type Contacts_contactsQueryVariables = Exact<{
  offset: Scalars["Int"];
  limit: Scalars["Int"];
  search?: InputMaybe<Scalars["String"]>;
  sortBy?: InputMaybe<Array<QueryContacts_OrderBy> | QueryContacts_OrderBy>;
}>;

export type Contacts_contactsQuery = {
  contacts: {
    __typename?: "ContactPagination";
    totalCount: number;
    items: Array<{
      __typename?: "Contact";
      id: string;
      fullName: string;
      firstName: string;
      lastName?: string | null;
      email: string;
      createdAt: string;
    }>;
  };
};

export type Contacts_userQueryVariables = Exact<{ [key: string]: never }>;

export type Contacts_userQuery = {
  me: {
    __typename?: "User";
    id: string;
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    createdAt: string;
    canCreateUsers: boolean;
    isSuperAdmin: boolean;
    role: OrganizationRole;
    avatarUrl?: string | null;
    initials?: string | null;
    organization: {
      __typename?: "Organization";
      id: string;
      usageLimits: {
        __typename?: "OrganizationUsageLimit";
        petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
      };
    };
  };
};

export type AppRedirect_petitionsQueryVariables = Exact<{ [key: string]: never }>;

export type AppRedirect_petitionsQuery = {
  petitions: { __typename?: "PetitionBasePagination"; totalCount: number };
};

export type OrganizationBranding_updateOrgLogoMutationVariables = Exact<{
  file: Scalars["Upload"];
}>;

export type OrganizationBranding_updateOrgLogoMutation = {
  updateOrganizationLogo: { __typename?: "Organization"; id: string; logoUrl?: string | null };
};

export type OrganizationBranding_updateOrganizationPreferredToneMutationVariables = Exact<{
  tone: Tone;
}>;

export type OrganizationBranding_updateOrganizationPreferredToneMutation = {
  updateOrganizationPreferredTone: { __typename?: "Organization"; id: string; preferredTone: Tone };
};

export type OrganizationBranding_userQueryVariables = Exact<{ [key: string]: never }>;

export type OrganizationBranding_userQuery = {
  me: {
    __typename?: "User";
    fullName?: string | null;
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    createdAt: string;
    canCreateUsers: boolean;
    isSuperAdmin: boolean;
    role: OrganizationRole;
    avatarUrl?: string | null;
    initials?: string | null;
    organization: {
      __typename?: "Organization";
      id: string;
      logoUrl?: string | null;
      name: string;
      preferredTone: Tone;
      usageLimits: {
        __typename?: "OrganizationUsageLimit";
        petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
      };
    };
  };
};

export type OrganizationGroup_UserGroupFragment = {
  __typename?: "UserGroup";
  id: string;
  name: string;
  createdAt: string;
  members: Array<{
    __typename?: "UserGroupMember";
    id: string;
    addedAt: string;
    user: { __typename?: "User"; id: string; fullName?: string | null; email: string };
  }>;
};

export type OrganizationGroup_UserGroupMemberFragment = {
  __typename?: "UserGroupMember";
  id: string;
  addedAt: string;
  user: { __typename?: "User"; id: string; fullName?: string | null; email: string };
};

export type OrganizationGroup_UserFragment = {
  __typename?: "User";
  id: string;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  createdAt: string;
  canCreateUsers: boolean;
  isSuperAdmin: boolean;
  role: OrganizationRole;
  avatarUrl?: string | null;
  initials?: string | null;
  organization: {
    __typename?: "Organization";
    id: string;
    usageLimits: {
      __typename?: "OrganizationUsageLimit";
      petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
    };
  };
};

export type OrganizationGroup_updateUserGroupMutationVariables = Exact<{
  id: Scalars["GID"];
  data: UpdateUserGroupInput;
}>;

export type OrganizationGroup_updateUserGroupMutation = {
  updateUserGroup: {
    __typename?: "UserGroup";
    id: string;
    name: string;
    createdAt: string;
    members: Array<{
      __typename?: "UserGroupMember";
      id: string;
      addedAt: string;
      user: { __typename?: "User"; id: string; fullName?: string | null; email: string };
    }>;
  };
};

export type OrganizationGroup_addUsersToUserGroupMutationVariables = Exact<{
  userGroupId: Scalars["GID"];
  userIds: Array<Scalars["GID"]> | Scalars["GID"];
}>;

export type OrganizationGroup_addUsersToUserGroupMutation = {
  addUsersToUserGroup: {
    __typename?: "UserGroup";
    id: string;
    name: string;
    createdAt: string;
    members: Array<{
      __typename?: "UserGroupMember";
      id: string;
      addedAt: string;
      user: { __typename?: "User"; id: string; fullName?: string | null; email: string };
    }>;
  };
};

export type OrganizationGroup_removeUsersFromGroupMutationVariables = Exact<{
  userGroupId: Scalars["GID"];
  userIds: Array<Scalars["GID"]> | Scalars["GID"];
}>;

export type OrganizationGroup_removeUsersFromGroupMutation = {
  removeUsersFromGroup: {
    __typename?: "UserGroup";
    id: string;
    name: string;
    createdAt: string;
    members: Array<{
      __typename?: "UserGroupMember";
      id: string;
      addedAt: string;
      user: { __typename?: "User"; id: string; fullName?: string | null; email: string };
    }>;
  };
};

export type OrganizationGroup_deleteUserGroupMutationVariables = Exact<{
  ids: Array<Scalars["GID"]> | Scalars["GID"];
}>;

export type OrganizationGroup_deleteUserGroupMutation = { deleteUserGroup: Result };

export type OrganizationGroup_cloneUserGroupMutationVariables = Exact<{
  ids: Array<Scalars["GID"]> | Scalars["GID"];
  locale: Scalars["String"];
}>;

export type OrganizationGroup_cloneUserGroupMutation = {
  cloneUserGroup: Array<{
    __typename?: "UserGroup";
    id: string;
    name: string;
    createdAt: string;
    members: Array<{
      __typename?: "UserGroupMember";
      id: string;
      addedAt: string;
      user: { __typename?: "User"; id: string; fullName?: string | null; email: string };
    }>;
  }>;
};

export type OrganizationGroup_userGroupQueryVariables = Exact<{
  id: Scalars["GID"];
}>;

export type OrganizationGroup_userGroupQuery = {
  userGroup?: {
    __typename?: "UserGroup";
    id: string;
    name: string;
    createdAt: string;
    members: Array<{
      __typename?: "UserGroupMember";
      id: string;
      addedAt: string;
      user: { __typename?: "User"; id: string; fullName?: string | null; email: string };
    }>;
  } | null;
};

export type OrganizationGroup_userQueryVariables = Exact<{ [key: string]: never }>;

export type OrganizationGroup_userQuery = {
  me: {
    __typename?: "User";
    id: string;
    role: OrganizationRole;
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    createdAt: string;
    canCreateUsers: boolean;
    isSuperAdmin: boolean;
    avatarUrl?: string | null;
    initials?: string | null;
    organization: {
      __typename?: "Organization";
      id: string;
      usageLimits: {
        __typename?: "OrganizationUsageLimit";
        petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
      };
    };
  };
};

export type OrganizationGroups_UserGroupPaginationFragment = {
  __typename?: "UserGroupPagination";
  totalCount: number;
  items: Array<{
    __typename?: "UserGroup";
    id: string;
    name: string;
    createdAt: string;
    members: Array<{
      __typename?: "UserGroupMember";
      user: {
        __typename?: "User";
        id: string;
        fullName?: string | null;
        avatarUrl?: string | null;
        initials?: string | null;
      };
    }>;
  }>;
};

export type OrganizationGroups_UserGroupFragment = {
  __typename?: "UserGroup";
  id: string;
  name: string;
  createdAt: string;
  members: Array<{
    __typename?: "UserGroupMember";
    user: {
      __typename?: "User";
      id: string;
      fullName?: string | null;
      avatarUrl?: string | null;
      initials?: string | null;
    };
  }>;
};

export type OrganizationGroups_UserFragment = {
  __typename?: "User";
  id: string;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  createdAt: string;
  canCreateUsers: boolean;
  isSuperAdmin: boolean;
  role: OrganizationRole;
  avatarUrl?: string | null;
  initials?: string | null;
  organization: {
    __typename?: "Organization";
    id: string;
    usageLimits: {
      __typename?: "OrganizationUsageLimit";
      petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
    };
  };
};

export type OrganizationGroups_createUserGroupMutationVariables = Exact<{
  name: Scalars["String"];
  userIds: Array<Scalars["GID"]> | Scalars["GID"];
}>;

export type OrganizationGroups_createUserGroupMutation = {
  createUserGroup: {
    __typename?: "UserGroup";
    id: string;
    name: string;
    createdAt: string;
    members: Array<{
      __typename?: "UserGroupMember";
      user: {
        __typename?: "User";
        id: string;
        fullName?: string | null;
        avatarUrl?: string | null;
        initials?: string | null;
      };
    }>;
  };
};

export type OrganizationGroups_deleteUserGroupMutationVariables = Exact<{
  ids: Array<Scalars["GID"]> | Scalars["GID"];
}>;

export type OrganizationGroups_deleteUserGroupMutation = { deleteUserGroup: Result };

export type OrganizationGroups_cloneUserGroupMutationVariables = Exact<{
  ids: Array<Scalars["GID"]> | Scalars["GID"];
  locale: Scalars["String"];
}>;

export type OrganizationGroups_cloneUserGroupMutation = {
  cloneUserGroup: Array<{
    __typename?: "UserGroup";
    id: string;
    name: string;
    createdAt: string;
    members: Array<{
      __typename?: "UserGroupMember";
      user: {
        __typename?: "User";
        id: string;
        fullName?: string | null;
        avatarUrl?: string | null;
        initials?: string | null;
      };
    }>;
  }>;
};

export type OrganizationGroups_userGroupsQueryVariables = Exact<{
  offset: Scalars["Int"];
  limit: Scalars["Int"];
  search?: InputMaybe<Scalars["String"]>;
  sortBy?: InputMaybe<Array<QueryUserGroups_OrderBy> | QueryUserGroups_OrderBy>;
}>;

export type OrganizationGroups_userGroupsQuery = {
  userGroups: {
    __typename?: "UserGroupPagination";
    totalCount: number;
    items: Array<{
      __typename?: "UserGroup";
      id: string;
      name: string;
      createdAt: string;
      members: Array<{
        __typename?: "UserGroupMember";
        user: {
          __typename?: "User";
          id: string;
          fullName?: string | null;
          avatarUrl?: string | null;
          initials?: string | null;
        };
      }>;
    }>;
  };
};

export type OrganizationGroups_userQueryVariables = Exact<{ [key: string]: never }>;

export type OrganizationGroups_userQuery = {
  me: {
    __typename?: "User";
    id: string;
    role: OrganizationRole;
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    createdAt: string;
    canCreateUsers: boolean;
    isSuperAdmin: boolean;
    avatarUrl?: string | null;
    initials?: string | null;
    organization: {
      __typename?: "Organization";
      id: string;
      usageLimits: {
        __typename?: "OrganizationUsageLimit";
        petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
      };
    };
  };
};

export type OrganizationSettings_userQueryVariables = Exact<{ [key: string]: never }>;

export type OrganizationSettings_userQuery = {
  me: {
    __typename?: "User";
    id: string;
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    createdAt: string;
    canCreateUsers: boolean;
    isSuperAdmin: boolean;
    role: OrganizationRole;
    avatarUrl?: string | null;
    initials?: string | null;
    organization: {
      __typename?: "Organization";
      id: string;
      usageLimits: {
        __typename?: "OrganizationUsageLimit";
        petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
      };
    };
  };
};

export type OrganizationIntegrations_userQueryVariables = Exact<{ [key: string]: never }>;

export type OrganizationIntegrations_userQuery = {
  me: {
    __typename?: "User";
    id: string;
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    createdAt: string;
    canCreateUsers: boolean;
    isSuperAdmin: boolean;
    role: OrganizationRole;
    avatarUrl?: string | null;
    initials?: string | null;
    hasPetitionSignature: boolean;
    hasDeveloperAccess: boolean;
    organization: {
      __typename?: "Organization";
      id: string;
      usageLimits: {
        __typename?: "OrganizationUsageLimit";
        petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
      };
    };
  };
};

export type IntegrationsSignature_SignatureOrgIntegrationFragment = {
  __typename?: "SignatureOrgIntegration";
  id: string;
  name: string;
  provider: SignatureOrgIntegrationProvider;
  isDefault: boolean;
  environment: SignatureOrgIntegrationEnvironment;
};

export type IntegrationsSignature_createSignatureIntegrationMutationVariables = Exact<{
  name: Scalars["String"];
  provider: SignatureOrgIntegrationProvider;
  apiKey: Scalars["String"];
  isDefault?: InputMaybe<Scalars["Boolean"]>;
}>;

export type IntegrationsSignature_createSignatureIntegrationMutation = {
  createSignatureIntegration: {
    __typename?: "SignatureOrgIntegration";
    id: string;
    name: string;
    provider: SignatureOrgIntegrationProvider;
    isDefault: boolean;
    environment: SignatureOrgIntegrationEnvironment;
  };
};

export type IntegrationsSignature_markSignatureIntegrationAsDefaultMutationVariables = Exact<{
  id: Scalars["GID"];
}>;

export type IntegrationsSignature_markSignatureIntegrationAsDefaultMutation = {
  markSignatureIntegrationAsDefault:
    | {
        __typename?: "SignatureOrgIntegration";
        id: string;
        name: string;
        provider: SignatureOrgIntegrationProvider;
        isDefault: boolean;
        environment: SignatureOrgIntegrationEnvironment;
      }
    | { __typename?: "SsoOrgIntegration" }
    | { __typename?: "UserProvisioningOrgIntegration" };
};

export type IntegrationsSignature_deleteSignatureIntegrationMutationVariables = Exact<{
  id: Scalars["GID"];
  force?: InputMaybe<Scalars["Boolean"]>;
}>;

export type IntegrationsSignature_deleteSignatureIntegrationMutation = {
  deleteSignatureIntegration: Result;
};

export type IntegrationsSignature_userQueryVariables = Exact<{
  limit: Scalars["Int"];
  offset: Scalars["Int"];
}>;

export type IntegrationsSignature_userQuery = {
  me: {
    __typename?: "User";
    id: string;
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    createdAt: string;
    canCreateUsers: boolean;
    isSuperAdmin: boolean;
    role: OrganizationRole;
    avatarUrl?: string | null;
    initials?: string | null;
    hasPetitionSignature: boolean;
    organization: {
      __typename?: "Organization";
      id: string;
      signatureIntegrations: {
        __typename?: "OrgIntegrationPagination";
        totalCount: number;
        items: Array<
          | {
              __typename?: "SignatureOrgIntegration";
              id: string;
              name: string;
              provider: SignatureOrgIntegrationProvider;
              isDefault: boolean;
              environment: SignatureOrgIntegrationEnvironment;
            }
          | { __typename?: "SsoOrgIntegration" }
          | { __typename?: "UserProvisioningOrgIntegration" }
        >;
      };
      usageLimits: {
        __typename?: "OrganizationUsageLimit";
        petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
      };
    };
  };
};

export type OrganizationUsage_userQueryVariables = Exact<{ [key: string]: never }>;

export type OrganizationUsage_userQuery = {
  me: {
    __typename?: "User";
    id: string;
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    createdAt: string;
    canCreateUsers: boolean;
    isSuperAdmin: boolean;
    role: OrganizationRole;
    avatarUrl?: string | null;
    initials?: string | null;
    organization: {
      __typename?: "Organization";
      id: string;
      activeUserCount: number;
      usageLimits: {
        __typename?: "OrganizationUsageLimit";
        users: { __typename?: "OrganizationUsageUserLimit"; limit: number };
        petitions: { __typename?: "OrganizationUsagePetitionLimit"; used: number; limit: number };
        signatures: {
          __typename?: "OrganizationUsageSignaturesLimit";
          used: number;
          limit: number;
        };
      };
    };
  };
};

export type OrganizationUsers_UserFragment = {
  __typename?: "User";
  id: string;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  role: OrganizationRole;
  createdAt: string;
  lastActiveAt?: string | null;
  status: UserStatus;
  isSsoUser: boolean;
  userGroups: Array<{
    __typename?: "UserGroup";
    id: string;
    name: string;
    members: Array<{
      __typename?: "UserGroupMember";
      user: { __typename?: "User"; id: string; fullName?: string | null; email: string };
    }>;
  }>;
};

export type OrganizationUsers_createOrganizationUserMutationVariables = Exact<{
  firstName: Scalars["String"];
  lastName: Scalars["String"];
  email: Scalars["String"];
  role: OrganizationRole;
  locale?: InputMaybe<Scalars["String"]>;
  userGroupIds?: InputMaybe<Array<Scalars["GID"]> | Scalars["GID"]>;
}>;

export type OrganizationUsers_createOrganizationUserMutation = {
  createOrganizationUser: {
    __typename?: "User";
    id: string;
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    role: OrganizationRole;
    createdAt: string;
    lastActiveAt?: string | null;
    status: UserStatus;
    isSsoUser: boolean;
    userGroups: Array<{
      __typename?: "UserGroup";
      id: string;
      name: string;
      members: Array<{
        __typename?: "UserGroupMember";
        user: { __typename?: "User"; id: string; fullName?: string | null; email: string };
      }>;
    }>;
  };
};

export type OrganizationUsers_updateOrganizationUserMutationVariables = Exact<{
  userId: Scalars["GID"];
  role: OrganizationRole;
  userGroupIds?: InputMaybe<Array<Scalars["GID"]> | Scalars["GID"]>;
}>;

export type OrganizationUsers_updateOrganizationUserMutation = {
  updateOrganizationUser: {
    __typename?: "User";
    id: string;
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    role: OrganizationRole;
    createdAt: string;
    lastActiveAt?: string | null;
    status: UserStatus;
    isSsoUser: boolean;
    userGroups: Array<{
      __typename?: "UserGroup";
      id: string;
      name: string;
      members: Array<{
        __typename?: "UserGroupMember";
        user: { __typename?: "User"; id: string; fullName?: string | null; email: string };
      }>;
    }>;
  };
};

export type OrganizationUsers_activateUserMutationVariables = Exact<{
  userIds: Array<Scalars["GID"]> | Scalars["GID"];
}>;

export type OrganizationUsers_activateUserMutation = {
  activateUser: Array<{ __typename?: "User"; id: string; status: UserStatus }>;
};

export type OrganizationUsers_deactivateUserMutationVariables = Exact<{
  userIds: Array<Scalars["GID"]> | Scalars["GID"];
  transferToUserId?: InputMaybe<Scalars["GID"]>;
  deletePetitions?: InputMaybe<Scalars["Boolean"]>;
}>;

export type OrganizationUsers_deactivateUserMutation = {
  deactivateUser: Array<{ __typename?: "User"; id: string; status: UserStatus }>;
};

export type OrganizationUsers_userQueryVariables = Exact<{
  offset: Scalars["Int"];
  limit: Scalars["Int"];
  search?: InputMaybe<Scalars["String"]>;
  sortBy?: InputMaybe<Array<OrganizationUsers_OrderBy> | OrganizationUsers_OrderBy>;
}>;

export type OrganizationUsers_userQuery = {
  me: {
    __typename?: "User";
    id: string;
    role: OrganizationRole;
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    createdAt: string;
    canCreateUsers: boolean;
    isSuperAdmin: boolean;
    avatarUrl?: string | null;
    initials?: string | null;
    organization: {
      __typename?: "Organization";
      id: string;
      hasSsoProvider: boolean;
      activeUserCount: number;
      users: {
        __typename?: "UserPagination";
        totalCount: number;
        items: Array<{
          __typename?: "User";
          id: string;
          fullName?: string | null;
          firstName?: string | null;
          lastName?: string | null;
          email: string;
          role: OrganizationRole;
          createdAt: string;
          lastActiveAt?: string | null;
          status: UserStatus;
          isSsoUser: boolean;
          userGroups: Array<{
            __typename?: "UserGroup";
            id: string;
            name: string;
            members: Array<{
              __typename?: "UserGroupMember";
              user: { __typename?: "User"; id: string; fullName?: string | null; email: string };
            }>;
          }>;
        }>;
      };
      usageLimits: {
        __typename?: "OrganizationUsageLimit";
        users: { __typename?: "OrganizationUsageUserLimit"; limit: number };
        petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
      };
    };
  };
};

export type PetitionActivity_PetitionFragment = {
  __typename?: "Petition";
  id: string;
  name?: string | null;
  status: PetitionStatus;
  emailSubject?: string | null;
  emailBody?: any | null;
  locale: PetitionLocale;
  deadline?: string | null;
  isRestricted: boolean;
  updatedAt: string;
  accesses: Array<{
    __typename?: "PetitionAccess";
    id: string;
    status: PetitionAccessStatus;
    nextReminderAt?: string | null;
    remindersLeft: number;
    reminderCount: number;
    remindersActive: boolean;
    remindersOptOut: boolean;
    createdAt: string;
    contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
    remindersConfig?: {
      __typename?: "RemindersConfig";
      offset: number;
      time: string;
      timezone: string;
      weekdaysOnly: boolean;
    } | null;
  }>;
  fields: Array<{
    __typename?: "PetitionField";
    id: string;
    title?: string | null;
    type: PetitionFieldType;
    options: { [key: string]: any };
  }>;
  events: {
    __typename?: "PetitionEventPagination";
    items: Array<
      | {
          __typename?: "AccessActivatedEvent";
          id: string;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
          access: {
            __typename?: "PetitionAccess";
            contact?: {
              __typename?: "Contact";
              id: string;
              fullName: string;
              email: string;
            } | null;
          };
        }
      | {
          __typename?: "AccessActivatedFromPublicPetitionLinkEvent";
          id: string;
          createdAt: string;
          access: {
            __typename?: "PetitionAccess";
            contact?: {
              __typename?: "Contact";
              id: string;
              fullName: string;
              email: string;
            } | null;
          };
        }
      | {
          __typename?: "AccessDeactivatedEvent";
          id: string;
          reason: string;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
          access: {
            __typename?: "PetitionAccess";
            contact?: {
              __typename?: "Contact";
              id: string;
              fullName: string;
              email: string;
            } | null;
          };
        }
      | {
          __typename?: "AccessDelegatedEvent";
          id: string;
          createdAt: string;
          originalAccess: {
            __typename?: "PetitionAccess";
            contact?: {
              __typename?: "Contact";
              id: string;
              fullName: string;
              email: string;
            } | null;
          };
          newAccess: {
            __typename?: "PetitionAccess";
            contact?: {
              __typename?: "Contact";
              id: string;
              fullName: string;
              email: string;
            } | null;
          };
        }
      | {
          __typename?: "AccessOpenedEvent";
          id: string;
          createdAt: string;
          access: {
            __typename?: "PetitionAccess";
            contact?: {
              __typename?: "Contact";
              id: string;
              fullName: string;
              email: string;
            } | null;
          };
        }
      | {
          __typename?: "CommentDeletedEvent";
          id: string;
          createdAt: string;
          field?: { __typename?: "PetitionField"; title?: string | null } | null;
          deletedBy?:
            | {
                __typename?: "PetitionAccess";
                contact?: {
                  __typename?: "Contact";
                  id: string;
                  fullName: string;
                  email: string;
                } | null;
              }
            | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
            | null;
        }
      | {
          __typename?: "CommentPublishedEvent";
          id: string;
          createdAt: string;
          field?: { __typename?: "PetitionField"; title?: string | null } | null;
          comment?: {
            __typename?: "PetitionFieldComment";
            isEdited: boolean;
            content: string;
            author?:
              | {
                  __typename?: "PetitionAccess";
                  contact?: {
                    __typename?: "Contact";
                    id: string;
                    fullName: string;
                    email: string;
                  } | null;
                }
              | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
              | null;
          } | null;
        }
      | {
          __typename?: "GroupPermissionAddedEvent";
          id: string;
          permissionType: PetitionPermissionType;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
          permissionGroup?: { __typename?: "UserGroup"; name: string } | null;
        }
      | {
          __typename?: "GroupPermissionEditedEvent";
          id: string;
          permissionType: PetitionPermissionType;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
          permissionGroup?: { __typename?: "UserGroup"; name: string } | null;
        }
      | {
          __typename?: "GroupPermissionRemovedEvent";
          id: string;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
          permissionGroup?: { __typename?: "UserGroup"; name: string } | null;
        }
      | {
          __typename?: "MessageCancelledEvent";
          id: string;
          reason: string;
          createdAt: string;
          message: {
            __typename?: "PetitionMessage";
            status: PetitionMessageStatus;
            scheduledAt?: string | null;
            emailSubject?: any | null;
            access: {
              __typename?: "PetitionAccess";
              contact?: {
                __typename?: "Contact";
                id: string;
                fullName: string;
                email: string;
              } | null;
            };
          };
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
        }
      | {
          __typename?: "MessageScheduledEvent";
          id: string;
          createdAt: string;
          message: {
            __typename?: "PetitionMessage";
            id: string;
            status: PetitionMessageStatus;
            scheduledAt?: string | null;
            emailSubject?: any | null;
            emailBody?: string | null;
            sentAt?: string | null;
            sender: {
              __typename?: "User";
              id: string;
              fullName?: string | null;
              status: UserStatus;
            };
            access: {
              __typename?: "PetitionAccess";
              contact?: {
                __typename?: "Contact";
                id: string;
                fullName: string;
                email: string;
              } | null;
            };
          };
        }
      | {
          __typename?: "MessageSentEvent";
          id: string;
          createdAt: string;
          message: {
            __typename?: "PetitionMessage";
            emailSubject?: any | null;
            scheduledAt?: string | null;
            bouncedAt?: string | null;
            deliveredAt?: string | null;
            openedAt?: string | null;
            emailBody?: string | null;
            sentAt?: string | null;
            sender: {
              __typename?: "User";
              id: string;
              fullName?: string | null;
              status: UserStatus;
            };
            access: {
              __typename?: "PetitionAccess";
              contact?: {
                __typename?: "Contact";
                id: string;
                fullName: string;
                email: string;
              } | null;
            };
          };
        }
      | {
          __typename?: "OwnershipTransferredEvent";
          id: string;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
          owner?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
          previousOwner?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
        }
      | {
          __typename?: "PetitionClonedEvent";
          id: string;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
        }
      | {
          __typename?: "PetitionClosedEvent";
          id: string;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
        }
      | {
          __typename?: "PetitionClosedNotifiedEvent";
          id: string;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
          access: {
            __typename?: "PetitionAccess";
            contact?: {
              __typename?: "Contact";
              id: string;
              fullName: string;
              email: string;
            } | null;
          };
        }
      | {
          __typename?: "PetitionCompletedEvent";
          id: string;
          createdAt: string;
          completedBy?:
            | {
                __typename?: "PetitionAccess";
                contact?: {
                  __typename?: "Contact";
                  id: string;
                  fullName: string;
                  email: string;
                } | null;
              }
            | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
            | null;
        }
      | {
          __typename?: "PetitionCreatedEvent";
          id: string;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
        }
      | { __typename?: "PetitionDeletedEvent"; id: string }
      | {
          __typename?: "PetitionMessageBouncedEvent";
          id: string;
          createdAt: string;
          message: {
            __typename?: "PetitionMessage";
            access: {
              __typename?: "PetitionAccess";
              contact?: {
                __typename?: "Contact";
                id: string;
                fullName: string;
                email: string;
              } | null;
            };
          };
        }
      | {
          __typename?: "PetitionReminderBouncedEvent";
          id: string;
          createdAt: string;
          reminder: {
            __typename?: "PetitionReminder";
            access: {
              __typename?: "PetitionAccess";
              contact?: {
                __typename?: "Contact";
                id: string;
                fullName: string;
                email: string;
              } | null;
            };
          };
        }
      | {
          __typename?: "PetitionReopenedEvent";
          id: string;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
        }
      | {
          __typename?: "RecipientSignedEvent";
          id: string;
          createdAt: string;
          signer?: { __typename?: "PetitionSigner"; email: string; fullName: string } | null;
        }
      | {
          __typename?: "ReminderSentEvent";
          id: string;
          createdAt: string;
          reminder: {
            __typename?: "PetitionReminder";
            type: PetitionReminderType;
            createdAt: string;
            emailBody?: string | null;
            sender?: {
              __typename?: "User";
              id: string;
              fullName?: string | null;
              status: UserStatus;
            } | null;
            access: {
              __typename?: "PetitionAccess";
              contact?: {
                __typename?: "Contact";
                id: string;
                fullName: string;
                email: string;
              } | null;
            };
          };
        }
      | {
          __typename?: "RemindersOptOutEvent";
          id: string;
          createdAt: string;
          reason: string;
          other?: string | null;
          access: {
            __typename?: "PetitionAccess";
            contact?: {
              __typename?: "Contact";
              id: string;
              fullName: string;
              email: string;
            } | null;
          };
        }
      | {
          __typename?: "ReplyCreatedEvent";
          id: string;
          createdAt: string;
          field?: { __typename?: "PetitionField"; title?: string | null } | null;
          createdBy?:
            | {
                __typename?: "PetitionAccess";
                contact?: {
                  __typename?: "Contact";
                  id: string;
                  fullName: string;
                  email: string;
                } | null;
              }
            | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
            | null;
        }
      | {
          __typename?: "ReplyDeletedEvent";
          id: string;
          createdAt: string;
          field?: { __typename?: "PetitionField"; title?: string | null } | null;
          deletedBy?:
            | {
                __typename?: "PetitionAccess";
                contact?: {
                  __typename?: "Contact";
                  id: string;
                  fullName: string;
                  email: string;
                } | null;
              }
            | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
            | null;
        }
      | {
          __typename?: "ReplyUpdatedEvent";
          id: string;
          createdAt: string;
          field?: { __typename?: "PetitionField"; title?: string | null } | null;
          updatedBy?:
            | {
                __typename?: "PetitionAccess";
                contact?: {
                  __typename?: "Contact";
                  id: string;
                  fullName: string;
                  email: string;
                } | null;
              }
            | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
            | null;
        }
      | {
          __typename?: "SignatureCancelledEvent";
          id: string;
          cancelType: PetitionSignatureCancelReason;
          errorCode?: string | null;
          extraErrorData?: any | null;
          cancellerReason?: string | null;
          createdAt: string;
          cancelledBy?:
            | {
                __typename?: "PetitionAccess";
                contact?: {
                  __typename?: "Contact";
                  id: string;
                  fullName: string;
                  email: string;
                } | null;
              }
            | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
            | null;
          canceller?: { __typename?: "PetitionSigner"; email: string; fullName: string } | null;
        }
      | { __typename?: "SignatureCompletedEvent"; id: string; createdAt: string }
      | {
          __typename?: "SignatureOpenedEvent";
          id: string;
          createdAt: string;
          signer?: { __typename?: "PetitionSigner"; email: string; fullName: string } | null;
        }
      | {
          __typename?: "SignatureReminderEvent";
          id: string;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
        }
      | {
          __typename?: "SignatureStartedEvent";
          id: string;
          createdAt: string;
          bouncedAt?: string | null;
          deliveredAt?: string | null;
          openedAt?: string | null;
        }
      | { __typename?: "TemplateUsedEvent"; id: string }
      | {
          __typename?: "UserPermissionAddedEvent";
          id: string;
          permissionType: PetitionPermissionType;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
          permissionUser?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
        }
      | {
          __typename?: "UserPermissionEditedEvent";
          id: string;
          permissionType: PetitionPermissionType;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
          permissionUser?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
        }
      | {
          __typename?: "UserPermissionRemovedEvent";
          id: string;
          createdAt: string;
          user?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
          permissionUser?: {
            __typename?: "User";
            id: string;
            fullName?: string | null;
            status: UserStatus;
          } | null;
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
        user: { __typename?: "User"; id: string; fullName?: string | null };
      }
  >;
  signatureConfig?: {
    __typename?: "SignatureConfig";
    signers: Array<{ __typename?: "PetitionSigner"; email: string; fullName: string }>;
    integration?: {
      __typename?: "SignatureOrgIntegration";
      id: string;
      environment: SignatureOrgIntegrationEnvironment;
      name: string;
    } | null;
  } | null;
  remindersConfig?: {
    __typename?: "RemindersConfig";
    offset: number;
    time: string;
    timezone: string;
    weekdaysOnly: boolean;
  } | null;
  organization: {
    __typename?: "Organization";
    id: string;
    usageLimits: {
      __typename?: "OrganizationUsageLimit";
      petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
    };
  };
  myEffectivePermission?: {
    __typename?: "EffectivePetitionUserPermission";
    isSubscribed: boolean;
  } | null;
};

export type PetitionActivity_UserFragment = {
  __typename?: "User";
  id: string;
  unreadNotificationIds: Array<string>;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  createdAt: string;
  canCreateUsers: boolean;
  role: OrganizationRole;
  isSuperAdmin: boolean;
  avatarUrl?: string | null;
  initials?: string | null;
  hasPetitionPdfExport: boolean;
  organization: {
    __typename?: "Organization";
    name: string;
    id: string;
    usageLimits: {
      __typename?: "OrganizationUsageLimit";
      petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
    };
  };
};

export type PetitionActivity_updatePetitionMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  data: UpdatePetitionInput;
}>;

export type PetitionActivity_updatePetitionMutation = {
  updatePetition:
    | {
        __typename?: "Petition";
        id: string;
        name?: string | null;
        status: PetitionStatus;
        emailSubject?: string | null;
        emailBody?: any | null;
        locale: PetitionLocale;
        deadline?: string | null;
        isRestricted: boolean;
        updatedAt: string;
        accesses: Array<{
          __typename?: "PetitionAccess";
          id: string;
          status: PetitionAccessStatus;
          nextReminderAt?: string | null;
          remindersLeft: number;
          reminderCount: number;
          remindersActive: boolean;
          remindersOptOut: boolean;
          createdAt: string;
          contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
          remindersConfig?: {
            __typename?: "RemindersConfig";
            offset: number;
            time: string;
            timezone: string;
            weekdaysOnly: boolean;
          } | null;
        }>;
        fields: Array<{
          __typename?: "PetitionField";
          id: string;
          title?: string | null;
          type: PetitionFieldType;
          options: { [key: string]: any };
        }>;
        events: {
          __typename?: "PetitionEventPagination";
          items: Array<
            | {
                __typename?: "AccessActivatedEvent";
                id: string;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
                access: {
                  __typename?: "PetitionAccess";
                  contact?: {
                    __typename?: "Contact";
                    id: string;
                    fullName: string;
                    email: string;
                  } | null;
                };
              }
            | {
                __typename?: "AccessActivatedFromPublicPetitionLinkEvent";
                id: string;
                createdAt: string;
                access: {
                  __typename?: "PetitionAccess";
                  contact?: {
                    __typename?: "Contact";
                    id: string;
                    fullName: string;
                    email: string;
                  } | null;
                };
              }
            | {
                __typename?: "AccessDeactivatedEvent";
                id: string;
                reason: string;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
                access: {
                  __typename?: "PetitionAccess";
                  contact?: {
                    __typename?: "Contact";
                    id: string;
                    fullName: string;
                    email: string;
                  } | null;
                };
              }
            | {
                __typename?: "AccessDelegatedEvent";
                id: string;
                createdAt: string;
                originalAccess: {
                  __typename?: "PetitionAccess";
                  contact?: {
                    __typename?: "Contact";
                    id: string;
                    fullName: string;
                    email: string;
                  } | null;
                };
                newAccess: {
                  __typename?: "PetitionAccess";
                  contact?: {
                    __typename?: "Contact";
                    id: string;
                    fullName: string;
                    email: string;
                  } | null;
                };
              }
            | {
                __typename?: "AccessOpenedEvent";
                id: string;
                createdAt: string;
                access: {
                  __typename?: "PetitionAccess";
                  contact?: {
                    __typename?: "Contact";
                    id: string;
                    fullName: string;
                    email: string;
                  } | null;
                };
              }
            | {
                __typename?: "CommentDeletedEvent";
                id: string;
                createdAt: string;
                field?: { __typename?: "PetitionField"; title?: string | null } | null;
                deletedBy?:
                  | {
                      __typename?: "PetitionAccess";
                      contact?: {
                        __typename?: "Contact";
                        id: string;
                        fullName: string;
                        email: string;
                      } | null;
                    }
                  | {
                      __typename?: "User";
                      id: string;
                      fullName?: string | null;
                      status: UserStatus;
                    }
                  | null;
              }
            | {
                __typename?: "CommentPublishedEvent";
                id: string;
                createdAt: string;
                field?: { __typename?: "PetitionField"; title?: string | null } | null;
                comment?: {
                  __typename?: "PetitionFieldComment";
                  isEdited: boolean;
                  content: string;
                  author?:
                    | {
                        __typename?: "PetitionAccess";
                        contact?: {
                          __typename?: "Contact";
                          id: string;
                          fullName: string;
                          email: string;
                        } | null;
                      }
                    | {
                        __typename?: "User";
                        id: string;
                        fullName?: string | null;
                        status: UserStatus;
                      }
                    | null;
                } | null;
              }
            | {
                __typename?: "GroupPermissionAddedEvent";
                id: string;
                permissionType: PetitionPermissionType;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
                permissionGroup?: { __typename?: "UserGroup"; name: string } | null;
              }
            | {
                __typename?: "GroupPermissionEditedEvent";
                id: string;
                permissionType: PetitionPermissionType;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
                permissionGroup?: { __typename?: "UserGroup"; name: string } | null;
              }
            | {
                __typename?: "GroupPermissionRemovedEvent";
                id: string;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
                permissionGroup?: { __typename?: "UserGroup"; name: string } | null;
              }
            | {
                __typename?: "MessageCancelledEvent";
                id: string;
                reason: string;
                createdAt: string;
                message: {
                  __typename?: "PetitionMessage";
                  status: PetitionMessageStatus;
                  scheduledAt?: string | null;
                  emailSubject?: any | null;
                  access: {
                    __typename?: "PetitionAccess";
                    contact?: {
                      __typename?: "Contact";
                      id: string;
                      fullName: string;
                      email: string;
                    } | null;
                  };
                };
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
              }
            | {
                __typename?: "MessageScheduledEvent";
                id: string;
                createdAt: string;
                message: {
                  __typename?: "PetitionMessage";
                  id: string;
                  status: PetitionMessageStatus;
                  scheduledAt?: string | null;
                  emailSubject?: any | null;
                  emailBody?: string | null;
                  sentAt?: string | null;
                  sender: {
                    __typename?: "User";
                    id: string;
                    fullName?: string | null;
                    status: UserStatus;
                  };
                  access: {
                    __typename?: "PetitionAccess";
                    contact?: {
                      __typename?: "Contact";
                      id: string;
                      fullName: string;
                      email: string;
                    } | null;
                  };
                };
              }
            | {
                __typename?: "MessageSentEvent";
                id: string;
                createdAt: string;
                message: {
                  __typename?: "PetitionMessage";
                  emailSubject?: any | null;
                  scheduledAt?: string | null;
                  bouncedAt?: string | null;
                  deliveredAt?: string | null;
                  openedAt?: string | null;
                  emailBody?: string | null;
                  sentAt?: string | null;
                  sender: {
                    __typename?: "User";
                    id: string;
                    fullName?: string | null;
                    status: UserStatus;
                  };
                  access: {
                    __typename?: "PetitionAccess";
                    contact?: {
                      __typename?: "Contact";
                      id: string;
                      fullName: string;
                      email: string;
                    } | null;
                  };
                };
              }
            | {
                __typename?: "OwnershipTransferredEvent";
                id: string;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
                owner?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
                previousOwner?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
              }
            | {
                __typename?: "PetitionClonedEvent";
                id: string;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
              }
            | {
                __typename?: "PetitionClosedEvent";
                id: string;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
              }
            | {
                __typename?: "PetitionClosedNotifiedEvent";
                id: string;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
                access: {
                  __typename?: "PetitionAccess";
                  contact?: {
                    __typename?: "Contact";
                    id: string;
                    fullName: string;
                    email: string;
                  } | null;
                };
              }
            | {
                __typename?: "PetitionCompletedEvent";
                id: string;
                createdAt: string;
                completedBy?:
                  | {
                      __typename?: "PetitionAccess";
                      contact?: {
                        __typename?: "Contact";
                        id: string;
                        fullName: string;
                        email: string;
                      } | null;
                    }
                  | {
                      __typename?: "User";
                      id: string;
                      fullName?: string | null;
                      status: UserStatus;
                    }
                  | null;
              }
            | {
                __typename?: "PetitionCreatedEvent";
                id: string;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
              }
            | { __typename?: "PetitionDeletedEvent"; id: string }
            | {
                __typename?: "PetitionMessageBouncedEvent";
                id: string;
                createdAt: string;
                message: {
                  __typename?: "PetitionMessage";
                  access: {
                    __typename?: "PetitionAccess";
                    contact?: {
                      __typename?: "Contact";
                      id: string;
                      fullName: string;
                      email: string;
                    } | null;
                  };
                };
              }
            | {
                __typename?: "PetitionReminderBouncedEvent";
                id: string;
                createdAt: string;
                reminder: {
                  __typename?: "PetitionReminder";
                  access: {
                    __typename?: "PetitionAccess";
                    contact?: {
                      __typename?: "Contact";
                      id: string;
                      fullName: string;
                      email: string;
                    } | null;
                  };
                };
              }
            | {
                __typename?: "PetitionReopenedEvent";
                id: string;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
              }
            | {
                __typename?: "RecipientSignedEvent";
                id: string;
                createdAt: string;
                signer?: { __typename?: "PetitionSigner"; email: string; fullName: string } | null;
              }
            | {
                __typename?: "ReminderSentEvent";
                id: string;
                createdAt: string;
                reminder: {
                  __typename?: "PetitionReminder";
                  type: PetitionReminderType;
                  createdAt: string;
                  emailBody?: string | null;
                  sender?: {
                    __typename?: "User";
                    id: string;
                    fullName?: string | null;
                    status: UserStatus;
                  } | null;
                  access: {
                    __typename?: "PetitionAccess";
                    contact?: {
                      __typename?: "Contact";
                      id: string;
                      fullName: string;
                      email: string;
                    } | null;
                  };
                };
              }
            | {
                __typename?: "RemindersOptOutEvent";
                id: string;
                createdAt: string;
                reason: string;
                other?: string | null;
                access: {
                  __typename?: "PetitionAccess";
                  contact?: {
                    __typename?: "Contact";
                    id: string;
                    fullName: string;
                    email: string;
                  } | null;
                };
              }
            | {
                __typename?: "ReplyCreatedEvent";
                id: string;
                createdAt: string;
                field?: { __typename?: "PetitionField"; title?: string | null } | null;
                createdBy?:
                  | {
                      __typename?: "PetitionAccess";
                      contact?: {
                        __typename?: "Contact";
                        id: string;
                        fullName: string;
                        email: string;
                      } | null;
                    }
                  | {
                      __typename?: "User";
                      id: string;
                      fullName?: string | null;
                      status: UserStatus;
                    }
                  | null;
              }
            | {
                __typename?: "ReplyDeletedEvent";
                id: string;
                createdAt: string;
                field?: { __typename?: "PetitionField"; title?: string | null } | null;
                deletedBy?:
                  | {
                      __typename?: "PetitionAccess";
                      contact?: {
                        __typename?: "Contact";
                        id: string;
                        fullName: string;
                        email: string;
                      } | null;
                    }
                  | {
                      __typename?: "User";
                      id: string;
                      fullName?: string | null;
                      status: UserStatus;
                    }
                  | null;
              }
            | {
                __typename?: "ReplyUpdatedEvent";
                id: string;
                createdAt: string;
                field?: { __typename?: "PetitionField"; title?: string | null } | null;
                updatedBy?:
                  | {
                      __typename?: "PetitionAccess";
                      contact?: {
                        __typename?: "Contact";
                        id: string;
                        fullName: string;
                        email: string;
                      } | null;
                    }
                  | {
                      __typename?: "User";
                      id: string;
                      fullName?: string | null;
                      status: UserStatus;
                    }
                  | null;
              }
            | {
                __typename?: "SignatureCancelledEvent";
                id: string;
                cancelType: PetitionSignatureCancelReason;
                errorCode?: string | null;
                extraErrorData?: any | null;
                cancellerReason?: string | null;
                createdAt: string;
                cancelledBy?:
                  | {
                      __typename?: "PetitionAccess";
                      contact?: {
                        __typename?: "Contact";
                        id: string;
                        fullName: string;
                        email: string;
                      } | null;
                    }
                  | {
                      __typename?: "User";
                      id: string;
                      fullName?: string | null;
                      status: UserStatus;
                    }
                  | null;
                canceller?: {
                  __typename?: "PetitionSigner";
                  email: string;
                  fullName: string;
                } | null;
              }
            | { __typename?: "SignatureCompletedEvent"; id: string; createdAt: string }
            | {
                __typename?: "SignatureOpenedEvent";
                id: string;
                createdAt: string;
                signer?: { __typename?: "PetitionSigner"; email: string; fullName: string } | null;
              }
            | {
                __typename?: "SignatureReminderEvent";
                id: string;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
              }
            | {
                __typename?: "SignatureStartedEvent";
                id: string;
                createdAt: string;
                bouncedAt?: string | null;
                deliveredAt?: string | null;
                openedAt?: string | null;
              }
            | { __typename?: "TemplateUsedEvent"; id: string }
            | {
                __typename?: "UserPermissionAddedEvent";
                id: string;
                permissionType: PetitionPermissionType;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
                permissionUser?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
              }
            | {
                __typename?: "UserPermissionEditedEvent";
                id: string;
                permissionType: PetitionPermissionType;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
                permissionUser?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
              }
            | {
                __typename?: "UserPermissionRemovedEvent";
                id: string;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
                permissionUser?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
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
              user: { __typename?: "User"; id: string; fullName?: string | null };
            }
        >;
        signatureConfig?: {
          __typename?: "SignatureConfig";
          signers: Array<{ __typename?: "PetitionSigner"; email: string; fullName: string }>;
          integration?: {
            __typename?: "SignatureOrgIntegration";
            id: string;
            environment: SignatureOrgIntegrationEnvironment;
            name: string;
          } | null;
        } | null;
        remindersConfig?: {
          __typename?: "RemindersConfig";
          offset: number;
          time: string;
          timezone: string;
          weekdaysOnly: boolean;
        } | null;
        organization: {
          __typename?: "Organization";
          id: string;
          usageLimits: {
            __typename?: "OrganizationUsageLimit";
            petitions: {
              __typename?: "OrganizationUsagePetitionLimit";
              limit: number;
              used: number;
            };
          };
        };
        myEffectivePermission?: {
          __typename?: "EffectivePetitionUserPermission";
          isSubscribed: boolean;
        } | null;
      }
    | { __typename?: "PetitionTemplate" };
};

export type PetitionActivity_sendRemindersMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  accessIds: Array<Scalars["GID"]> | Scalars["GID"];
  body?: InputMaybe<Scalars["JSON"]>;
}>;

export type PetitionActivity_sendRemindersMutation = { sendReminders: Result };

export type PetitionActivity_deactivateAccessesMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  accessIds: Array<Scalars["GID"]> | Scalars["GID"];
}>;

export type PetitionActivity_deactivateAccessesMutation = {
  deactivateAccesses: Array<{
    __typename?: "PetitionAccess";
    id: string;
    status: PetitionAccessStatus;
  }>;
};

export type PetitionActivity_reactivateAccessesMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  accessIds: Array<Scalars["GID"]> | Scalars["GID"];
}>;

export type PetitionActivity_reactivateAccessesMutation = {
  reactivateAccesses: Array<{
    __typename?: "PetitionAccess";
    id: string;
    status: PetitionAccessStatus;
  }>;
};

export type PetitionActivity_cancelScheduledMessageMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  messageId: Scalars["GID"];
}>;

export type PetitionActivity_cancelScheduledMessageMutation = {
  cancelScheduledMessage?: {
    __typename?: "PetitionMessage";
    id: string;
    status: PetitionMessageStatus;
  } | null;
};

export type PetitionActivity_switchAutomaticRemindersMutationVariables = Exact<{
  start: Scalars["Boolean"];
  petitionId: Scalars["GID"];
  accessIds: Array<Scalars["GID"]> | Scalars["GID"];
  remindersConfig?: InputMaybe<RemindersConfigInput>;
}>;

export type PetitionActivity_switchAutomaticRemindersMutation = {
  switchAutomaticReminders: Array<{ __typename?: "PetitionAccess"; id: string }>;
};

export type PetitionActivity_petitionQueryVariables = Exact<{
  id: Scalars["GID"];
}>;

export type PetitionActivity_petitionQuery = {
  petition?:
    | {
        __typename?: "Petition";
        id: string;
        name?: string | null;
        status: PetitionStatus;
        emailSubject?: string | null;
        emailBody?: any | null;
        locale: PetitionLocale;
        deadline?: string | null;
        isRestricted: boolean;
        updatedAt: string;
        accesses: Array<{
          __typename?: "PetitionAccess";
          id: string;
          status: PetitionAccessStatus;
          nextReminderAt?: string | null;
          remindersLeft: number;
          reminderCount: number;
          remindersActive: boolean;
          remindersOptOut: boolean;
          createdAt: string;
          contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
          remindersConfig?: {
            __typename?: "RemindersConfig";
            offset: number;
            time: string;
            timezone: string;
            weekdaysOnly: boolean;
          } | null;
        }>;
        fields: Array<{
          __typename?: "PetitionField";
          id: string;
          title?: string | null;
          type: PetitionFieldType;
          options: { [key: string]: any };
        }>;
        events: {
          __typename?: "PetitionEventPagination";
          items: Array<
            | {
                __typename?: "AccessActivatedEvent";
                id: string;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
                access: {
                  __typename?: "PetitionAccess";
                  contact?: {
                    __typename?: "Contact";
                    id: string;
                    fullName: string;
                    email: string;
                  } | null;
                };
              }
            | {
                __typename?: "AccessActivatedFromPublicPetitionLinkEvent";
                id: string;
                createdAt: string;
                access: {
                  __typename?: "PetitionAccess";
                  contact?: {
                    __typename?: "Contact";
                    id: string;
                    fullName: string;
                    email: string;
                  } | null;
                };
              }
            | {
                __typename?: "AccessDeactivatedEvent";
                id: string;
                reason: string;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
                access: {
                  __typename?: "PetitionAccess";
                  contact?: {
                    __typename?: "Contact";
                    id: string;
                    fullName: string;
                    email: string;
                  } | null;
                };
              }
            | {
                __typename?: "AccessDelegatedEvent";
                id: string;
                createdAt: string;
                originalAccess: {
                  __typename?: "PetitionAccess";
                  contact?: {
                    __typename?: "Contact";
                    id: string;
                    fullName: string;
                    email: string;
                  } | null;
                };
                newAccess: {
                  __typename?: "PetitionAccess";
                  contact?: {
                    __typename?: "Contact";
                    id: string;
                    fullName: string;
                    email: string;
                  } | null;
                };
              }
            | {
                __typename?: "AccessOpenedEvent";
                id: string;
                createdAt: string;
                access: {
                  __typename?: "PetitionAccess";
                  contact?: {
                    __typename?: "Contact";
                    id: string;
                    fullName: string;
                    email: string;
                  } | null;
                };
              }
            | {
                __typename?: "CommentDeletedEvent";
                id: string;
                createdAt: string;
                field?: { __typename?: "PetitionField"; title?: string | null } | null;
                deletedBy?:
                  | {
                      __typename?: "PetitionAccess";
                      contact?: {
                        __typename?: "Contact";
                        id: string;
                        fullName: string;
                        email: string;
                      } | null;
                    }
                  | {
                      __typename?: "User";
                      id: string;
                      fullName?: string | null;
                      status: UserStatus;
                    }
                  | null;
              }
            | {
                __typename?: "CommentPublishedEvent";
                id: string;
                createdAt: string;
                field?: { __typename?: "PetitionField"; title?: string | null } | null;
                comment?: {
                  __typename?: "PetitionFieldComment";
                  isEdited: boolean;
                  content: string;
                  author?:
                    | {
                        __typename?: "PetitionAccess";
                        contact?: {
                          __typename?: "Contact";
                          id: string;
                          fullName: string;
                          email: string;
                        } | null;
                      }
                    | {
                        __typename?: "User";
                        id: string;
                        fullName?: string | null;
                        status: UserStatus;
                      }
                    | null;
                } | null;
              }
            | {
                __typename?: "GroupPermissionAddedEvent";
                id: string;
                permissionType: PetitionPermissionType;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
                permissionGroup?: { __typename?: "UserGroup"; name: string } | null;
              }
            | {
                __typename?: "GroupPermissionEditedEvent";
                id: string;
                permissionType: PetitionPermissionType;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
                permissionGroup?: { __typename?: "UserGroup"; name: string } | null;
              }
            | {
                __typename?: "GroupPermissionRemovedEvent";
                id: string;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
                permissionGroup?: { __typename?: "UserGroup"; name: string } | null;
              }
            | {
                __typename?: "MessageCancelledEvent";
                id: string;
                reason: string;
                createdAt: string;
                message: {
                  __typename?: "PetitionMessage";
                  status: PetitionMessageStatus;
                  scheduledAt?: string | null;
                  emailSubject?: any | null;
                  access: {
                    __typename?: "PetitionAccess";
                    contact?: {
                      __typename?: "Contact";
                      id: string;
                      fullName: string;
                      email: string;
                    } | null;
                  };
                };
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
              }
            | {
                __typename?: "MessageScheduledEvent";
                id: string;
                createdAt: string;
                message: {
                  __typename?: "PetitionMessage";
                  id: string;
                  status: PetitionMessageStatus;
                  scheduledAt?: string | null;
                  emailSubject?: any | null;
                  emailBody?: string | null;
                  sentAt?: string | null;
                  sender: {
                    __typename?: "User";
                    id: string;
                    fullName?: string | null;
                    status: UserStatus;
                  };
                  access: {
                    __typename?: "PetitionAccess";
                    contact?: {
                      __typename?: "Contact";
                      id: string;
                      fullName: string;
                      email: string;
                    } | null;
                  };
                };
              }
            | {
                __typename?: "MessageSentEvent";
                id: string;
                createdAt: string;
                message: {
                  __typename?: "PetitionMessage";
                  emailSubject?: any | null;
                  scheduledAt?: string | null;
                  bouncedAt?: string | null;
                  deliveredAt?: string | null;
                  openedAt?: string | null;
                  emailBody?: string | null;
                  sentAt?: string | null;
                  sender: {
                    __typename?: "User";
                    id: string;
                    fullName?: string | null;
                    status: UserStatus;
                  };
                  access: {
                    __typename?: "PetitionAccess";
                    contact?: {
                      __typename?: "Contact";
                      id: string;
                      fullName: string;
                      email: string;
                    } | null;
                  };
                };
              }
            | {
                __typename?: "OwnershipTransferredEvent";
                id: string;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
                owner?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
                previousOwner?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
              }
            | {
                __typename?: "PetitionClonedEvent";
                id: string;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
              }
            | {
                __typename?: "PetitionClosedEvent";
                id: string;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
              }
            | {
                __typename?: "PetitionClosedNotifiedEvent";
                id: string;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
                access: {
                  __typename?: "PetitionAccess";
                  contact?: {
                    __typename?: "Contact";
                    id: string;
                    fullName: string;
                    email: string;
                  } | null;
                };
              }
            | {
                __typename?: "PetitionCompletedEvent";
                id: string;
                createdAt: string;
                completedBy?:
                  | {
                      __typename?: "PetitionAccess";
                      contact?: {
                        __typename?: "Contact";
                        id: string;
                        fullName: string;
                        email: string;
                      } | null;
                    }
                  | {
                      __typename?: "User";
                      id: string;
                      fullName?: string | null;
                      status: UserStatus;
                    }
                  | null;
              }
            | {
                __typename?: "PetitionCreatedEvent";
                id: string;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
              }
            | { __typename?: "PetitionDeletedEvent"; id: string }
            | {
                __typename?: "PetitionMessageBouncedEvent";
                id: string;
                createdAt: string;
                message: {
                  __typename?: "PetitionMessage";
                  access: {
                    __typename?: "PetitionAccess";
                    contact?: {
                      __typename?: "Contact";
                      id: string;
                      fullName: string;
                      email: string;
                    } | null;
                  };
                };
              }
            | {
                __typename?: "PetitionReminderBouncedEvent";
                id: string;
                createdAt: string;
                reminder: {
                  __typename?: "PetitionReminder";
                  access: {
                    __typename?: "PetitionAccess";
                    contact?: {
                      __typename?: "Contact";
                      id: string;
                      fullName: string;
                      email: string;
                    } | null;
                  };
                };
              }
            | {
                __typename?: "PetitionReopenedEvent";
                id: string;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
              }
            | {
                __typename?: "RecipientSignedEvent";
                id: string;
                createdAt: string;
                signer?: { __typename?: "PetitionSigner"; email: string; fullName: string } | null;
              }
            | {
                __typename?: "ReminderSentEvent";
                id: string;
                createdAt: string;
                reminder: {
                  __typename?: "PetitionReminder";
                  type: PetitionReminderType;
                  createdAt: string;
                  emailBody?: string | null;
                  sender?: {
                    __typename?: "User";
                    id: string;
                    fullName?: string | null;
                    status: UserStatus;
                  } | null;
                  access: {
                    __typename?: "PetitionAccess";
                    contact?: {
                      __typename?: "Contact";
                      id: string;
                      fullName: string;
                      email: string;
                    } | null;
                  };
                };
              }
            | {
                __typename?: "RemindersOptOutEvent";
                id: string;
                createdAt: string;
                reason: string;
                other?: string | null;
                access: {
                  __typename?: "PetitionAccess";
                  contact?: {
                    __typename?: "Contact";
                    id: string;
                    fullName: string;
                    email: string;
                  } | null;
                };
              }
            | {
                __typename?: "ReplyCreatedEvent";
                id: string;
                createdAt: string;
                field?: { __typename?: "PetitionField"; title?: string | null } | null;
                createdBy?:
                  | {
                      __typename?: "PetitionAccess";
                      contact?: {
                        __typename?: "Contact";
                        id: string;
                        fullName: string;
                        email: string;
                      } | null;
                    }
                  | {
                      __typename?: "User";
                      id: string;
                      fullName?: string | null;
                      status: UserStatus;
                    }
                  | null;
              }
            | {
                __typename?: "ReplyDeletedEvent";
                id: string;
                createdAt: string;
                field?: { __typename?: "PetitionField"; title?: string | null } | null;
                deletedBy?:
                  | {
                      __typename?: "PetitionAccess";
                      contact?: {
                        __typename?: "Contact";
                        id: string;
                        fullName: string;
                        email: string;
                      } | null;
                    }
                  | {
                      __typename?: "User";
                      id: string;
                      fullName?: string | null;
                      status: UserStatus;
                    }
                  | null;
              }
            | {
                __typename?: "ReplyUpdatedEvent";
                id: string;
                createdAt: string;
                field?: { __typename?: "PetitionField"; title?: string | null } | null;
                updatedBy?:
                  | {
                      __typename?: "PetitionAccess";
                      contact?: {
                        __typename?: "Contact";
                        id: string;
                        fullName: string;
                        email: string;
                      } | null;
                    }
                  | {
                      __typename?: "User";
                      id: string;
                      fullName?: string | null;
                      status: UserStatus;
                    }
                  | null;
              }
            | {
                __typename?: "SignatureCancelledEvent";
                id: string;
                cancelType: PetitionSignatureCancelReason;
                errorCode?: string | null;
                extraErrorData?: any | null;
                cancellerReason?: string | null;
                createdAt: string;
                cancelledBy?:
                  | {
                      __typename?: "PetitionAccess";
                      contact?: {
                        __typename?: "Contact";
                        id: string;
                        fullName: string;
                        email: string;
                      } | null;
                    }
                  | {
                      __typename?: "User";
                      id: string;
                      fullName?: string | null;
                      status: UserStatus;
                    }
                  | null;
                canceller?: {
                  __typename?: "PetitionSigner";
                  email: string;
                  fullName: string;
                } | null;
              }
            | { __typename?: "SignatureCompletedEvent"; id: string; createdAt: string }
            | {
                __typename?: "SignatureOpenedEvent";
                id: string;
                createdAt: string;
                signer?: { __typename?: "PetitionSigner"; email: string; fullName: string } | null;
              }
            | {
                __typename?: "SignatureReminderEvent";
                id: string;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
              }
            | {
                __typename?: "SignatureStartedEvent";
                id: string;
                createdAt: string;
                bouncedAt?: string | null;
                deliveredAt?: string | null;
                openedAt?: string | null;
              }
            | { __typename?: "TemplateUsedEvent"; id: string }
            | {
                __typename?: "UserPermissionAddedEvent";
                id: string;
                permissionType: PetitionPermissionType;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
                permissionUser?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
              }
            | {
                __typename?: "UserPermissionEditedEvent";
                id: string;
                permissionType: PetitionPermissionType;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
                permissionUser?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
              }
            | {
                __typename?: "UserPermissionRemovedEvent";
                id: string;
                createdAt: string;
                user?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
                permissionUser?: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  status: UserStatus;
                } | null;
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
              user: { __typename?: "User"; id: string; fullName?: string | null };
            }
        >;
        signatureConfig?: {
          __typename?: "SignatureConfig";
          signers: Array<{ __typename?: "PetitionSigner"; email: string; fullName: string }>;
          integration?: {
            __typename?: "SignatureOrgIntegration";
            id: string;
            environment: SignatureOrgIntegrationEnvironment;
            name: string;
          } | null;
        } | null;
        remindersConfig?: {
          __typename?: "RemindersConfig";
          offset: number;
          time: string;
          timezone: string;
          weekdaysOnly: boolean;
        } | null;
        organization: {
          __typename?: "Organization";
          id: string;
          usageLimits: {
            __typename?: "OrganizationUsageLimit";
            petitions: {
              __typename?: "OrganizationUsagePetitionLimit";
              limit: number;
              used: number;
            };
          };
        };
        myEffectivePermission?: {
          __typename?: "EffectivePetitionUserPermission";
          isSubscribed: boolean;
        } | null;
      }
    | { __typename?: "PetitionTemplate" }
    | null;
};

export type PetitionActivity_userQueryVariables = Exact<{ [key: string]: never }>;

export type PetitionActivity_userQuery = {
  me: {
    __typename?: "User";
    id: string;
    unreadNotificationIds: Array<string>;
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    createdAt: string;
    canCreateUsers: boolean;
    role: OrganizationRole;
    isSuperAdmin: boolean;
    avatarUrl?: string | null;
    initials?: string | null;
    hasPetitionPdfExport: boolean;
    organization: {
      __typename?: "Organization";
      name: string;
      id: string;
      usageLimits: {
        __typename?: "OrganizationUsageLimit";
        petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
      };
    };
  };
};

export type PetitionCompose_PetitionBase_Petition_Fragment = {
  __typename?: "Petition";
  status: PetitionStatus;
  id: string;
  tone: Tone;
  isRestricted: boolean;
  name?: string | null;
  deadline?: string | null;
  locale: PetitionLocale;
  skipForwardSecurity: boolean;
  isRecipientViewContentsHidden: boolean;
  isRestrictedWithPassword: boolean;
  emailSubject?: string | null;
  emailBody?: any | null;
  updatedAt: string;
  accesses: Array<{
    __typename?: "PetitionAccess";
    id: string;
    status: PetitionAccessStatus;
    contact?: {
      __typename?: "Contact";
      id: string;
      firstName: string;
      lastName?: string | null;
      email: string;
    } | null;
  }>;
  signatureConfig?: {
    __typename?: "SignatureConfig";
    title: string;
    review: boolean;
    allowAdditionalSigners: boolean;
    integration?: {
      __typename?: "SignatureOrgIntegration";
      environment: SignatureOrgIntegrationEnvironment;
      name: string;
      id: string;
      isDefault: boolean;
    } | null;
    signers: Array<{
      __typename?: "PetitionSigner";
      contactId?: string | null;
      firstName: string;
      lastName?: string | null;
      email: string;
      fullName: string;
    }>;
  } | null;
  fields: Array<{
    __typename?: "PetitionField";
    id: string;
    type: PetitionFieldType;
    title?: string | null;
    description?: string | null;
    optional: boolean;
    multiple: boolean;
    isFixed: boolean;
    isInternal: boolean;
    isReadOnly: boolean;
    visibility?: { [key: string]: any } | null;
    options: { [key: string]: any };
    showInPdf: boolean;
    position: number;
    alias?: string | null;
    hasCommentsEnabled: boolean;
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
    replies: Array<{
      __typename?: "PetitionFieldReply";
      id: string;
      status: PetitionFieldReplyStatus;
    }>;
  }>;
  currentSignatureRequest?: {
    __typename?: "PetitionSignatureRequest";
    id: string;
    status: PetitionSignatureRequestStatus;
  } | null;
  remindersConfig?: {
    __typename?: "RemindersConfig";
    offset: number;
    time: string;
    timezone: string;
    weekdaysOnly: boolean;
  } | null;
  organization: {
    __typename?: "Organization";
    id: string;
    usageLimits: {
      __typename?: "OrganizationUsageLimit";
      petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
    };
  };
  myEffectivePermission?: {
    __typename?: "EffectivePetitionUserPermission";
    isSubscribed: boolean;
  } | null;
};

export type PetitionCompose_PetitionBase_PetitionTemplate_Fragment = {
  __typename?: "PetitionTemplate";
  isPublic: boolean;
  id: string;
  tone: Tone;
  isRestricted: boolean;
  name?: string | null;
  emailSubject?: string | null;
  emailBody?: any | null;
  closingEmailBody?: any | null;
  description?: any | null;
  locale: PetitionLocale;
  skipForwardSecurity: boolean;
  isRecipientViewContentsHidden: boolean;
  isRestrictedWithPassword: boolean;
  updatedAt: string;
  fields: Array<{
    __typename?: "PetitionField";
    id: string;
    type: PetitionFieldType;
    title?: string | null;
    description?: string | null;
    optional: boolean;
    multiple: boolean;
    isFixed: boolean;
    isInternal: boolean;
    isReadOnly: boolean;
    visibility?: { [key: string]: any } | null;
    options: { [key: string]: any };
    showInPdf: boolean;
    position: number;
    alias?: string | null;
    hasCommentsEnabled: boolean;
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
    replies: Array<{
      __typename?: "PetitionFieldReply";
      id: string;
      status: PetitionFieldReplyStatus;
    }>;
  }>;
  remindersConfig?: {
    __typename?: "RemindersConfig";
    offset: number;
    time: string;
    timezone: string;
    weekdaysOnly: boolean;
  } | null;
  publicLink?: {
    __typename?: "PublicPetitionLink";
    id: string;
    url: string;
    isActive: boolean;
    title: string;
    description: string;
    slug: string;
  } | null;
  defaultPermissions: Array<
    | {
        __typename?: "TemplateDefaultUserGroupPermission";
        id: string;
        isSubscribed: boolean;
        permissionType: PetitionPermissionType;
        group: {
          __typename?: "UserGroup";
          id: string;
          initials: string;
          name: string;
          members: Array<{
            __typename?: "UserGroupMember";
            user: { __typename?: "User"; id: string; fullName?: string | null; email: string };
          }>;
        };
      }
    | {
        __typename?: "TemplateDefaultUserPermission";
        id: string;
        isSubscribed: boolean;
        permissionType: PetitionPermissionType;
        user: {
          __typename?: "User";
          id: string;
          fullName?: string | null;
          email: string;
          avatarUrl?: string | null;
          initials?: string | null;
        };
      }
  >;
  organization: { __typename?: "Organization"; customHost?: string | null };
  signatureConfig?: {
    __typename?: "SignatureConfig";
    title: string;
    review: boolean;
    allowAdditionalSigners: boolean;
    integration?: {
      __typename?: "SignatureOrgIntegration";
      id: string;
      name: string;
      isDefault: boolean;
      environment: SignatureOrgIntegrationEnvironment;
    } | null;
    signers: Array<{
      __typename?: "PetitionSigner";
      contactId?: string | null;
      firstName: string;
      lastName?: string | null;
      email: string;
    }>;
  } | null;
};

export type PetitionCompose_PetitionBaseFragment =
  | PetitionCompose_PetitionBase_Petition_Fragment
  | PetitionCompose_PetitionBase_PetitionTemplate_Fragment;

export type PetitionCompose_PetitionFieldFragment = {
  __typename?: "PetitionField";
  id: string;
  type: PetitionFieldType;
  title?: string | null;
  description?: string | null;
  optional: boolean;
  multiple: boolean;
  isFixed: boolean;
  isInternal: boolean;
  isReadOnly: boolean;
  visibility?: { [key: string]: any } | null;
  options: { [key: string]: any };
  showInPdf: boolean;
  position: number;
  alias?: string | null;
  hasCommentsEnabled: boolean;
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
  replies: Array<{
    __typename?: "PetitionFieldReply";
    id: string;
    status: PetitionFieldReplyStatus;
  }>;
};

export type PetitionCompose_UserFragment = {
  __typename?: "User";
  id: string;
  unreadNotificationIds: Array<string>;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  createdAt: string;
  canCreateUsers: boolean;
  role: OrganizationRole;
  isSuperAdmin: boolean;
  avatarUrl?: string | null;
  initials?: string | null;
  hasSkipForwardSecurity: boolean;
  hasHideRecipientViewContents: boolean;
  hasPetitionPdfExport: boolean;
  hasPetitionSignature: boolean;
  organization: {
    __typename?: "Organization";
    id: string;
    signatureIntegrations: {
      __typename?: "OrgIntegrationPagination";
      items: Array<
        | {
            __typename?: "SignatureOrgIntegration";
            id: string;
            name: string;
            isDefault: boolean;
            environment: SignatureOrgIntegrationEnvironment;
          }
        | { __typename?: "SsoOrgIntegration" }
        | { __typename?: "UserProvisioningOrgIntegration" }
      >;
    };
    usageLimits: {
      __typename?: "OrganizationUsageLimit";
      petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
    };
  };
};

export type PetitionCompose_updatePetitionMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  data: UpdatePetitionInput;
}>;

export type PetitionCompose_updatePetitionMutation = {
  updatePetition:
    | {
        __typename?: "Petition";
        id: string;
        name?: string | null;
        status: PetitionStatus;
        deadline?: string | null;
        locale: PetitionLocale;
        skipForwardSecurity: boolean;
        isRecipientViewContentsHidden: boolean;
        isRestricted: boolean;
        isRestrictedWithPassword: boolean;
        emailSubject?: string | null;
        emailBody?: any | null;
        updatedAt: string;
        currentSignatureRequest?: {
          __typename?: "PetitionSignatureRequest";
          id: string;
          status: PetitionSignatureRequestStatus;
        } | null;
        signatureConfig?: {
          __typename?: "SignatureConfig";
          title: string;
          review: boolean;
          allowAdditionalSigners: boolean;
          signers: Array<{
            __typename?: "PetitionSigner";
            contactId?: string | null;
            firstName: string;
            lastName?: string | null;
            email: string;
            fullName: string;
          }>;
          integration?: {
            __typename?: "SignatureOrgIntegration";
            id: string;
            name: string;
            isDefault: boolean;
            environment: SignatureOrgIntegrationEnvironment;
          } | null;
        } | null;
        remindersConfig?: {
          __typename?: "RemindersConfig";
          offset: number;
          time: string;
          timezone: string;
          weekdaysOnly: boolean;
        } | null;
        organization: {
          __typename?: "Organization";
          id: string;
          usageLimits: {
            __typename?: "OrganizationUsageLimit";
            petitions: {
              __typename?: "OrganizationUsagePetitionLimit";
              limit: number;
              used: number;
            };
          };
        };
        myEffectivePermission?: {
          __typename?: "EffectivePetitionUserPermission";
          isSubscribed: boolean;
        } | null;
        accesses: Array<{
          __typename?: "PetitionAccess";
          status: PetitionAccessStatus;
          contact?: {
            __typename?: "Contact";
            id: string;
            firstName: string;
            lastName?: string | null;
            email: string;
          } | null;
        }>;
      }
    | {
        __typename?: "PetitionTemplate";
        id: string;
        name?: string | null;
        isPublic: boolean;
        locale: PetitionLocale;
        skipForwardSecurity: boolean;
        isRecipientViewContentsHidden: boolean;
        isRestricted: boolean;
        isRestrictedWithPassword: boolean;
        emailSubject?: string | null;
        emailBody?: any | null;
        closingEmailBody?: any | null;
        description?: any | null;
        updatedAt: string;
        remindersConfig?: {
          __typename?: "RemindersConfig";
          offset: number;
          time: string;
          timezone: string;
          weekdaysOnly: boolean;
        } | null;
        publicLink?: {
          __typename?: "PublicPetitionLink";
          id: string;
          url: string;
          isActive: boolean;
          title: string;
          description: string;
          slug: string;
        } | null;
        defaultPermissions: Array<
          | {
              __typename?: "TemplateDefaultUserGroupPermission";
              id: string;
              isSubscribed: boolean;
              permissionType: PetitionPermissionType;
              group: {
                __typename?: "UserGroup";
                id: string;
                initials: string;
                name: string;
                members: Array<{
                  __typename?: "UserGroupMember";
                  user: {
                    __typename?: "User";
                    id: string;
                    fullName?: string | null;
                    email: string;
                  };
                }>;
              };
            }
          | {
              __typename?: "TemplateDefaultUserPermission";
              id: string;
              isSubscribed: boolean;
              permissionType: PetitionPermissionType;
              user: {
                __typename?: "User";
                id: string;
                fullName?: string | null;
                email: string;
                avatarUrl?: string | null;
                initials?: string | null;
              };
            }
        >;
        organization: { __typename?: "Organization"; customHost?: string | null };
        signatureConfig?: {
          __typename?: "SignatureConfig";
          title: string;
          review: boolean;
          allowAdditionalSigners: boolean;
          integration?: {
            __typename?: "SignatureOrgIntegration";
            id: string;
            name: string;
            isDefault: boolean;
            environment: SignatureOrgIntegrationEnvironment;
          } | null;
          signers: Array<{
            __typename?: "PetitionSigner";
            contactId?: string | null;
            firstName: string;
            lastName?: string | null;
            email: string;
          }>;
        } | null;
      };
};

export type PetitionCompose_updateFieldPositionsMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  fieldIds: Array<Scalars["GID"]> | Scalars["GID"];
}>;

export type PetitionCompose_updateFieldPositionsMutation = {
  updateFieldPositions:
    | {
        __typename?: "Petition";
        id: string;
        name?: string | null;
        locale: PetitionLocale;
        deadline?: string | null;
        status: PetitionStatus;
        isRestricted: boolean;
        updatedAt: string;
        fields: Array<{ __typename?: "PetitionField"; id: string }>;
        myEffectivePermission?: {
          __typename?: "EffectivePetitionUserPermission";
          isSubscribed: boolean;
        } | null;
      }
    | {
        __typename?: "PetitionTemplate";
        id: string;
        name?: string | null;
        locale: PetitionLocale;
        isPublic: boolean;
        isRestricted: boolean;
        updatedAt: string;
        fields: Array<{ __typename?: "PetitionField"; id: string }>;
      };
};

export type PetitionCompose_createPetitionFieldMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  type: PetitionFieldType;
  position?: InputMaybe<Scalars["Int"]>;
}>;

export type PetitionCompose_createPetitionFieldMutation = {
  createPetitionField: {
    __typename?: "PetitionField";
    id: string;
    type: PetitionFieldType;
    title?: string | null;
    description?: string | null;
    optional: boolean;
    multiple: boolean;
    isFixed: boolean;
    isInternal: boolean;
    isReadOnly: boolean;
    visibility?: { [key: string]: any } | null;
    options: { [key: string]: any };
    showInPdf: boolean;
    position: number;
    alias?: string | null;
    hasCommentsEnabled: boolean;
    petition:
      | {
          __typename?: "Petition";
          id: string;
          name?: string | null;
          locale: PetitionLocale;
          deadline?: string | null;
          status: PetitionStatus;
          isRestricted: boolean;
          updatedAt: string;
          fields: Array<{ __typename?: "PetitionField"; id: string }>;
          myEffectivePermission?: {
            __typename?: "EffectivePetitionUserPermission";
            isSubscribed: boolean;
          } | null;
        }
      | {
          __typename?: "PetitionTemplate";
          id: string;
          name?: string | null;
          locale: PetitionLocale;
          isPublic: boolean;
          isRestricted: boolean;
          updatedAt: string;
          fields: Array<{ __typename?: "PetitionField"; id: string }>;
        };
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
    replies: Array<{
      __typename?: "PetitionFieldReply";
      id: string;
      status: PetitionFieldReplyStatus;
    }>;
  };
};

export type PetitionCompose_clonePetitionFieldMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  fieldId: Scalars["GID"];
}>;

export type PetitionCompose_clonePetitionFieldMutation = {
  clonePetitionField: {
    __typename?: "PetitionField";
    id: string;
    type: PetitionFieldType;
    title?: string | null;
    description?: string | null;
    optional: boolean;
    multiple: boolean;
    isFixed: boolean;
    isInternal: boolean;
    isReadOnly: boolean;
    visibility?: { [key: string]: any } | null;
    options: { [key: string]: any };
    showInPdf: boolean;
    position: number;
    alias?: string | null;
    hasCommentsEnabled: boolean;
    petition:
      | {
          __typename?: "Petition";
          id: string;
          name?: string | null;
          locale: PetitionLocale;
          deadline?: string | null;
          status: PetitionStatus;
          isRestricted: boolean;
          updatedAt: string;
          fields: Array<{ __typename?: "PetitionField"; id: string }>;
          myEffectivePermission?: {
            __typename?: "EffectivePetitionUserPermission";
            isSubscribed: boolean;
          } | null;
        }
      | {
          __typename?: "PetitionTemplate";
          id: string;
          name?: string | null;
          locale: PetitionLocale;
          isPublic: boolean;
          isRestricted: boolean;
          updatedAt: string;
          fields: Array<{ __typename?: "PetitionField"; id: string }>;
        };
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
    replies: Array<{
      __typename?: "PetitionFieldReply";
      id: string;
      status: PetitionFieldReplyStatus;
    }>;
  };
};

export type PetitionCompose_deletePetitionFieldMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  fieldId: Scalars["GID"];
  force?: InputMaybe<Scalars["Boolean"]>;
}>;

export type PetitionCompose_deletePetitionFieldMutation = {
  deletePetitionField:
    | {
        __typename?: "Petition";
        id: string;
        name?: string | null;
        locale: PetitionLocale;
        deadline?: string | null;
        status: PetitionStatus;
        isRestricted: boolean;
        updatedAt: string;
        fields: Array<{ __typename?: "PetitionField"; id: string }>;
        myEffectivePermission?: {
          __typename?: "EffectivePetitionUserPermission";
          isSubscribed: boolean;
        } | null;
      }
    | {
        __typename?: "PetitionTemplate";
        id: string;
        name?: string | null;
        locale: PetitionLocale;
        isPublic: boolean;
        isRestricted: boolean;
        updatedAt: string;
        fields: Array<{ __typename?: "PetitionField"; id: string }>;
      };
};

export type PetitionCompose_updatePetitionFieldMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  fieldId: Scalars["GID"];
  data: UpdatePetitionFieldInput;
  force?: InputMaybe<Scalars["Boolean"]>;
}>;

export type PetitionCompose_updatePetitionFieldMutation = {
  updatePetitionField: {
    __typename?: "PetitionField";
    id: string;
    type: PetitionFieldType;
    title?: string | null;
    description?: string | null;
    optional: boolean;
    multiple: boolean;
    isFixed: boolean;
    isInternal: boolean;
    isReadOnly: boolean;
    visibility?: { [key: string]: any } | null;
    options: { [key: string]: any };
    showInPdf: boolean;
    position: number;
    alias?: string | null;
    hasCommentsEnabled: boolean;
    petition:
      | { __typename?: "Petition"; status: PetitionStatus; id: string; updatedAt: string }
      | { __typename?: "PetitionTemplate"; id: string; updatedAt: string };
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
    replies: Array<{
      __typename?: "PetitionFieldReply";
      id: string;
      status: PetitionFieldReplyStatus;
    }>;
  };
};

export type PetitionCompose_changePetitionFieldTypeMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  fieldId: Scalars["GID"];
  type: PetitionFieldType;
  force?: InputMaybe<Scalars["Boolean"]>;
}>;

export type PetitionCompose_changePetitionFieldTypeMutation = {
  changePetitionFieldType: {
    __typename?: "PetitionField";
    id: string;
    type: PetitionFieldType;
    title?: string | null;
    description?: string | null;
    optional: boolean;
    multiple: boolean;
    isFixed: boolean;
    isInternal: boolean;
    isReadOnly: boolean;
    visibility?: { [key: string]: any } | null;
    options: { [key: string]: any };
    showInPdf: boolean;
    position: number;
    alias?: string | null;
    hasCommentsEnabled: boolean;
    petition:
      | { __typename?: "Petition"; status: PetitionStatus; id: string; updatedAt: string }
      | { __typename?: "PetitionTemplate"; id: string; updatedAt: string };
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
    replies: Array<{
      __typename?: "PetitionFieldReply";
      id: string;
      status: PetitionFieldReplyStatus;
    }>;
  };
};

export type PetitionCompose_userQueryVariables = Exact<{ [key: string]: never }>;

export type PetitionCompose_userQuery = {
  me: {
    __typename?: "User";
    id: string;
    unreadNotificationIds: Array<string>;
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    createdAt: string;
    canCreateUsers: boolean;
    role: OrganizationRole;
    isSuperAdmin: boolean;
    avatarUrl?: string | null;
    initials?: string | null;
    hasSkipForwardSecurity: boolean;
    hasHideRecipientViewContents: boolean;
    hasPetitionPdfExport: boolean;
    hasPetitionSignature: boolean;
    organization: {
      __typename?: "Organization";
      id: string;
      signatureIntegrations: {
        __typename?: "OrgIntegrationPagination";
        items: Array<
          | {
              __typename?: "SignatureOrgIntegration";
              id: string;
              name: string;
              isDefault: boolean;
              environment: SignatureOrgIntegrationEnvironment;
            }
          | { __typename?: "SsoOrgIntegration" }
          | { __typename?: "UserProvisioningOrgIntegration" }
        >;
      };
      usageLimits: {
        __typename?: "OrganizationUsageLimit";
        petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
      };
    };
  };
};

export type PetitionCompose_petitionQueryVariables = Exact<{
  id: Scalars["GID"];
}>;

export type PetitionCompose_petitionQuery = {
  petition?:
    | {
        __typename?: "Petition";
        status: PetitionStatus;
        id: string;
        tone: Tone;
        isRestricted: boolean;
        name?: string | null;
        deadline?: string | null;
        locale: PetitionLocale;
        skipForwardSecurity: boolean;
        isRecipientViewContentsHidden: boolean;
        isRestrictedWithPassword: boolean;
        emailSubject?: string | null;
        emailBody?: any | null;
        updatedAt: string;
        accesses: Array<{
          __typename?: "PetitionAccess";
          id: string;
          status: PetitionAccessStatus;
          contact?: {
            __typename?: "Contact";
            id: string;
            firstName: string;
            lastName?: string | null;
            email: string;
          } | null;
        }>;
        signatureConfig?: {
          __typename?: "SignatureConfig";
          title: string;
          review: boolean;
          allowAdditionalSigners: boolean;
          integration?: {
            __typename?: "SignatureOrgIntegration";
            environment: SignatureOrgIntegrationEnvironment;
            name: string;
            id: string;
            isDefault: boolean;
          } | null;
          signers: Array<{
            __typename?: "PetitionSigner";
            contactId?: string | null;
            firstName: string;
            lastName?: string | null;
            email: string;
            fullName: string;
          }>;
        } | null;
        fields: Array<{
          __typename?: "PetitionField";
          id: string;
          type: PetitionFieldType;
          title?: string | null;
          description?: string | null;
          optional: boolean;
          multiple: boolean;
          isFixed: boolean;
          isInternal: boolean;
          isReadOnly: boolean;
          visibility?: { [key: string]: any } | null;
          options: { [key: string]: any };
          showInPdf: boolean;
          position: number;
          alias?: string | null;
          hasCommentsEnabled: boolean;
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
          replies: Array<{
            __typename?: "PetitionFieldReply";
            id: string;
            status: PetitionFieldReplyStatus;
          }>;
        }>;
        currentSignatureRequest?: {
          __typename?: "PetitionSignatureRequest";
          id: string;
          status: PetitionSignatureRequestStatus;
        } | null;
        remindersConfig?: {
          __typename?: "RemindersConfig";
          offset: number;
          time: string;
          timezone: string;
          weekdaysOnly: boolean;
        } | null;
        organization: {
          __typename?: "Organization";
          id: string;
          usageLimits: {
            __typename?: "OrganizationUsageLimit";
            petitions: {
              __typename?: "OrganizationUsagePetitionLimit";
              limit: number;
              used: number;
            };
          };
        };
        myEffectivePermission?: {
          __typename?: "EffectivePetitionUserPermission";
          isSubscribed: boolean;
        } | null;
      }
    | {
        __typename?: "PetitionTemplate";
        isPublic: boolean;
        id: string;
        tone: Tone;
        isRestricted: boolean;
        name?: string | null;
        emailSubject?: string | null;
        emailBody?: any | null;
        closingEmailBody?: any | null;
        description?: any | null;
        locale: PetitionLocale;
        skipForwardSecurity: boolean;
        isRecipientViewContentsHidden: boolean;
        isRestrictedWithPassword: boolean;
        updatedAt: string;
        fields: Array<{
          __typename?: "PetitionField";
          id: string;
          type: PetitionFieldType;
          title?: string | null;
          description?: string | null;
          optional: boolean;
          multiple: boolean;
          isFixed: boolean;
          isInternal: boolean;
          isReadOnly: boolean;
          visibility?: { [key: string]: any } | null;
          options: { [key: string]: any };
          showInPdf: boolean;
          position: number;
          alias?: string | null;
          hasCommentsEnabled: boolean;
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
          replies: Array<{
            __typename?: "PetitionFieldReply";
            id: string;
            status: PetitionFieldReplyStatus;
          }>;
        }>;
        remindersConfig?: {
          __typename?: "RemindersConfig";
          offset: number;
          time: string;
          timezone: string;
          weekdaysOnly: boolean;
        } | null;
        publicLink?: {
          __typename?: "PublicPetitionLink";
          id: string;
          url: string;
          isActive: boolean;
          title: string;
          description: string;
          slug: string;
        } | null;
        defaultPermissions: Array<
          | {
              __typename?: "TemplateDefaultUserGroupPermission";
              id: string;
              isSubscribed: boolean;
              permissionType: PetitionPermissionType;
              group: {
                __typename?: "UserGroup";
                id: string;
                initials: string;
                name: string;
                members: Array<{
                  __typename?: "UserGroupMember";
                  user: {
                    __typename?: "User";
                    id: string;
                    fullName?: string | null;
                    email: string;
                  };
                }>;
              };
            }
          | {
              __typename?: "TemplateDefaultUserPermission";
              id: string;
              isSubscribed: boolean;
              permissionType: PetitionPermissionType;
              user: {
                __typename?: "User";
                id: string;
                fullName?: string | null;
                email: string;
                avatarUrl?: string | null;
                initials?: string | null;
              };
            }
        >;
        organization: { __typename?: "Organization"; customHost?: string | null };
        signatureConfig?: {
          __typename?: "SignatureConfig";
          title: string;
          review: boolean;
          allowAdditionalSigners: boolean;
          integration?: {
            __typename?: "SignatureOrgIntegration";
            id: string;
            name: string;
            isDefault: boolean;
            environment: SignatureOrgIntegrationEnvironment;
          } | null;
          signers: Array<{
            __typename?: "PetitionSigner";
            contactId?: string | null;
            firstName: string;
            lastName?: string | null;
            email: string;
          }>;
        } | null;
      }
    | null;
};

export type PetitionQueryVariables = Exact<{
  id: Scalars["GID"];
}>;

export type PetitionQuery = {
  petition?:
    | { __typename?: "Petition"; status: PetitionStatus; id: string }
    | { __typename?: "PetitionTemplate"; id: string }
    | null;
};

export type PetitionPreview_PetitionBase_Petition_Fragment = {
  __typename?: "Petition";
  id: string;
  tone: Tone;
  status: PetitionStatus;
  name?: string | null;
  emailSubject?: string | null;
  emailBody?: any | null;
  locale: PetitionLocale;
  deadline?: string | null;
  isRestricted: boolean;
  updatedAt: string;
  accesses: Array<{
    __typename?: "PetitionAccess";
    id: string;
    status: PetitionAccessStatus;
    contact?: {
      __typename?: "Contact";
      id: string;
      email: string;
      firstName: string;
      lastName?: string | null;
    } | null;
  }>;
  fields: Array<{
    __typename?: "PetitionField";
    id: string;
    title?: string | null;
    type: PetitionFieldType;
    options: { [key: string]: any };
    multiple: boolean;
    alias?: string | null;
    optional: boolean;
    isInternal: boolean;
    isReadOnly: boolean;
    commentCount: number;
    unreadCommentCount: number;
    hasCommentsEnabled: boolean;
    description?: string | null;
    visibility?: { [key: string]: any } | null;
    showInPdf: boolean;
    previewReplies: Array<{
      __typename?: "PetitionFieldReply";
      content: { [key: string]: any };
      id: string;
      status: PetitionFieldReplyStatus;
      createdAt: string;
      updatedAt: string;
    }>;
    replies: Array<{
      __typename?: "PetitionFieldReply";
      content: { [key: string]: any };
      id: string;
      status: PetitionFieldReplyStatus;
      createdAt: string;
      updatedAt: string;
    }>;
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
    comments: Array<{
      __typename?: "PetitionFieldComment";
      id: string;
      createdAt: string;
      content: string;
      isUnread: boolean;
      isInternal: boolean;
      isEdited: boolean;
      author?:
        | {
            __typename?: "PetitionAccess";
            id: string;
            contact?: {
              __typename?: "Contact";
              id: string;
              fullName: string;
              email: string;
            } | null;
          }
        | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
        | null;
    }>;
  }>;
  signatureConfig?: {
    __typename?: "SignatureConfig";
    allowAdditionalSigners: boolean;
    review: boolean;
    timezone: string;
    title: string;
    signers: Array<{
      __typename?: "PetitionSigner";
      contactId?: string | null;
      email: string;
      firstName: string;
      lastName?: string | null;
      fullName: string;
    }>;
    integration?: {
      __typename?: "SignatureOrgIntegration";
      id: string;
      environment: SignatureOrgIntegrationEnvironment;
      name: string;
    } | null;
  } | null;
  remindersConfig?: {
    __typename?: "RemindersConfig";
    offset: number;
    time: string;
    timezone: string;
    weekdaysOnly: boolean;
  } | null;
  organization: {
    __typename?: "Organization";
    id: string;
    usageLimits: {
      __typename?: "OrganizationUsageLimit";
      petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
    };
  };
  myEffectivePermission?: {
    __typename?: "EffectivePetitionUserPermission";
    isSubscribed: boolean;
  } | null;
};

export type PetitionPreview_PetitionBase_PetitionTemplate_Fragment = {
  __typename?: "PetitionTemplate";
  id: string;
  tone: Tone;
  name?: string | null;
  locale: PetitionLocale;
  isPublic: boolean;
  isRestricted: boolean;
  updatedAt: string;
  fields: Array<{
    __typename?: "PetitionField";
    id: string;
    title?: string | null;
    type: PetitionFieldType;
    options: { [key: string]: any };
    multiple: boolean;
    alias?: string | null;
    optional: boolean;
    isInternal: boolean;
    isReadOnly: boolean;
    commentCount: number;
    unreadCommentCount: number;
    hasCommentsEnabled: boolean;
    description?: string | null;
    visibility?: { [key: string]: any } | null;
    showInPdf: boolean;
    previewReplies: Array<{
      __typename?: "PetitionFieldReply";
      content: { [key: string]: any };
      id: string;
      status: PetitionFieldReplyStatus;
      createdAt: string;
      updatedAt: string;
    }>;
    replies: Array<{
      __typename?: "PetitionFieldReply";
      content: { [key: string]: any };
      id: string;
      status: PetitionFieldReplyStatus;
      createdAt: string;
      updatedAt: string;
    }>;
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
    comments: Array<{
      __typename?: "PetitionFieldComment";
      id: string;
      createdAt: string;
      content: string;
      isUnread: boolean;
      isInternal: boolean;
      isEdited: boolean;
      author?:
        | {
            __typename?: "PetitionAccess";
            id: string;
            contact?: {
              __typename?: "Contact";
              id: string;
              fullName: string;
              email: string;
            } | null;
          }
        | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
        | null;
    }>;
  }>;
  signatureConfig?: {
    __typename?: "SignatureConfig";
    allowAdditionalSigners: boolean;
    review: boolean;
    timezone: string;
    title: string;
    signers: Array<{
      __typename?: "PetitionSigner";
      contactId?: string | null;
      email: string;
      firstName: string;
      lastName?: string | null;
    }>;
  } | null;
};

export type PetitionPreview_PetitionBaseFragment =
  | PetitionPreview_PetitionBase_Petition_Fragment
  | PetitionPreview_PetitionBase_PetitionTemplate_Fragment;

export type PetitionPreview_UserFragment = {
  __typename?: "User";
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  createdAt: string;
  canCreateUsers: boolean;
  role: OrganizationRole;
  isSuperAdmin: boolean;
  avatarUrl?: string | null;
  initials?: string | null;
  hasPetitionPdfExport: boolean;
  organization: {
    __typename?: "Organization";
    name: string;
    id: string;
    usageLimits: {
      __typename?: "OrganizationUsageLimit";
      petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
    };
  };
};

export type PetitionPreview_updatePetitionMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  data: UpdatePetitionInput;
}>;

export type PetitionPreview_updatePetitionMutation = {
  updatePetition:
    | {
        __typename?: "Petition";
        id: string;
        tone: Tone;
        status: PetitionStatus;
        name?: string | null;
        emailSubject?: string | null;
        emailBody?: any | null;
        locale: PetitionLocale;
        deadline?: string | null;
        isRestricted: boolean;
        updatedAt: string;
        accesses: Array<{
          __typename?: "PetitionAccess";
          id: string;
          status: PetitionAccessStatus;
          contact?: {
            __typename?: "Contact";
            id: string;
            email: string;
            firstName: string;
            lastName?: string | null;
          } | null;
        }>;
        fields: Array<{
          __typename?: "PetitionField";
          id: string;
          title?: string | null;
          type: PetitionFieldType;
          options: { [key: string]: any };
          multiple: boolean;
          alias?: string | null;
          optional: boolean;
          isInternal: boolean;
          isReadOnly: boolean;
          commentCount: number;
          unreadCommentCount: number;
          hasCommentsEnabled: boolean;
          description?: string | null;
          visibility?: { [key: string]: any } | null;
          showInPdf: boolean;
          previewReplies: Array<{
            __typename?: "PetitionFieldReply";
            content: { [key: string]: any };
            id: string;
            status: PetitionFieldReplyStatus;
            createdAt: string;
            updatedAt: string;
          }>;
          replies: Array<{
            __typename?: "PetitionFieldReply";
            content: { [key: string]: any };
            id: string;
            status: PetitionFieldReplyStatus;
            createdAt: string;
            updatedAt: string;
          }>;
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
          comments: Array<{
            __typename?: "PetitionFieldComment";
            id: string;
            createdAt: string;
            content: string;
            isUnread: boolean;
            isInternal: boolean;
            isEdited: boolean;
            author?:
              | {
                  __typename?: "PetitionAccess";
                  id: string;
                  contact?: {
                    __typename?: "Contact";
                    id: string;
                    fullName: string;
                    email: string;
                  } | null;
                }
              | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
              | null;
          }>;
        }>;
        signatureConfig?: {
          __typename?: "SignatureConfig";
          allowAdditionalSigners: boolean;
          review: boolean;
          timezone: string;
          title: string;
          signers: Array<{
            __typename?: "PetitionSigner";
            contactId?: string | null;
            email: string;
            firstName: string;
            lastName?: string | null;
            fullName: string;
          }>;
          integration?: {
            __typename?: "SignatureOrgIntegration";
            id: string;
            environment: SignatureOrgIntegrationEnvironment;
            name: string;
          } | null;
        } | null;
        remindersConfig?: {
          __typename?: "RemindersConfig";
          offset: number;
          time: string;
          timezone: string;
          weekdaysOnly: boolean;
        } | null;
        organization: {
          __typename?: "Organization";
          id: string;
          usageLimits: {
            __typename?: "OrganizationUsageLimit";
            petitions: {
              __typename?: "OrganizationUsagePetitionLimit";
              limit: number;
              used: number;
            };
          };
        };
        myEffectivePermission?: {
          __typename?: "EffectivePetitionUserPermission";
          isSubscribed: boolean;
        } | null;
      }
    | {
        __typename?: "PetitionTemplate";
        id: string;
        tone: Tone;
        name?: string | null;
        locale: PetitionLocale;
        isPublic: boolean;
        isRestricted: boolean;
        updatedAt: string;
        fields: Array<{
          __typename?: "PetitionField";
          id: string;
          title?: string | null;
          type: PetitionFieldType;
          options: { [key: string]: any };
          multiple: boolean;
          alias?: string | null;
          optional: boolean;
          isInternal: boolean;
          isReadOnly: boolean;
          commentCount: number;
          unreadCommentCount: number;
          hasCommentsEnabled: boolean;
          description?: string | null;
          visibility?: { [key: string]: any } | null;
          showInPdf: boolean;
          previewReplies: Array<{
            __typename?: "PetitionFieldReply";
            content: { [key: string]: any };
            id: string;
            status: PetitionFieldReplyStatus;
            createdAt: string;
            updatedAt: string;
          }>;
          replies: Array<{
            __typename?: "PetitionFieldReply";
            content: { [key: string]: any };
            id: string;
            status: PetitionFieldReplyStatus;
            createdAt: string;
            updatedAt: string;
          }>;
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
          comments: Array<{
            __typename?: "PetitionFieldComment";
            id: string;
            createdAt: string;
            content: string;
            isUnread: boolean;
            isInternal: boolean;
            isEdited: boolean;
            author?:
              | {
                  __typename?: "PetitionAccess";
                  id: string;
                  contact?: {
                    __typename?: "Contact";
                    id: string;
                    fullName: string;
                    email: string;
                  } | null;
                }
              | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
              | null;
          }>;
        }>;
        signatureConfig?: {
          __typename?: "SignatureConfig";
          allowAdditionalSigners: boolean;
          review: boolean;
          timezone: string;
          title: string;
          signers: Array<{
            __typename?: "PetitionSigner";
            contactId?: string | null;
            email: string;
            firstName: string;
            lastName?: string | null;
          }>;
        } | null;
      };
};

export type PetitionPreview_completePetitionMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  additionalSigners?: InputMaybe<
    Array<PublicPetitionSignerDataInput> | PublicPetitionSignerDataInput
  >;
  message?: InputMaybe<Scalars["String"]>;
}>;

export type PetitionPreview_completePetitionMutation = {
  completePetition: {
    __typename?: "Petition";
    id: string;
    tone: Tone;
    status: PetitionStatus;
    name?: string | null;
    emailSubject?: string | null;
    emailBody?: any | null;
    locale: PetitionLocale;
    deadline?: string | null;
    isRestricted: boolean;
    updatedAt: string;
    accesses: Array<{
      __typename?: "PetitionAccess";
      id: string;
      status: PetitionAccessStatus;
      contact?: {
        __typename?: "Contact";
        id: string;
        email: string;
        firstName: string;
        lastName?: string | null;
      } | null;
    }>;
    fields: Array<{
      __typename?: "PetitionField";
      id: string;
      title?: string | null;
      type: PetitionFieldType;
      options: { [key: string]: any };
      multiple: boolean;
      alias?: string | null;
      optional: boolean;
      isInternal: boolean;
      isReadOnly: boolean;
      commentCount: number;
      unreadCommentCount: number;
      hasCommentsEnabled: boolean;
      description?: string | null;
      visibility?: { [key: string]: any } | null;
      showInPdf: boolean;
      previewReplies: Array<{
        __typename?: "PetitionFieldReply";
        content: { [key: string]: any };
        id: string;
        status: PetitionFieldReplyStatus;
        createdAt: string;
        updatedAt: string;
      }>;
      replies: Array<{
        __typename?: "PetitionFieldReply";
        content: { [key: string]: any };
        id: string;
        status: PetitionFieldReplyStatus;
        createdAt: string;
        updatedAt: string;
      }>;
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
      comments: Array<{
        __typename?: "PetitionFieldComment";
        id: string;
        createdAt: string;
        content: string;
        isUnread: boolean;
        isInternal: boolean;
        isEdited: boolean;
        author?:
          | {
              __typename?: "PetitionAccess";
              id: string;
              contact?: {
                __typename?: "Contact";
                id: string;
                fullName: string;
                email: string;
              } | null;
            }
          | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
          | null;
      }>;
    }>;
    signatureConfig?: {
      __typename?: "SignatureConfig";
      allowAdditionalSigners: boolean;
      review: boolean;
      timezone: string;
      title: string;
      signers: Array<{
        __typename?: "PetitionSigner";
        contactId?: string | null;
        email: string;
        firstName: string;
        lastName?: string | null;
        fullName: string;
      }>;
      integration?: {
        __typename?: "SignatureOrgIntegration";
        id: string;
        environment: SignatureOrgIntegrationEnvironment;
        name: string;
      } | null;
    } | null;
    remindersConfig?: {
      __typename?: "RemindersConfig";
      offset: number;
      time: string;
      timezone: string;
      weekdaysOnly: boolean;
    } | null;
    organization: {
      __typename?: "Organization";
      id: string;
      usageLimits: {
        __typename?: "OrganizationUsageLimit";
        petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
      };
    };
    myEffectivePermission?: {
      __typename?: "EffectivePetitionUserPermission";
      isSubscribed: boolean;
    } | null;
  };
};

export type PetitionPreview_petitionQueryVariables = Exact<{
  id: Scalars["GID"];
}>;

export type PetitionPreview_petitionQuery = {
  petition?:
    | {
        __typename?: "Petition";
        id: string;
        tone: Tone;
        status: PetitionStatus;
        name?: string | null;
        emailSubject?: string | null;
        emailBody?: any | null;
        locale: PetitionLocale;
        deadline?: string | null;
        isRestricted: boolean;
        updatedAt: string;
        accesses: Array<{
          __typename?: "PetitionAccess";
          id: string;
          status: PetitionAccessStatus;
          contact?: {
            __typename?: "Contact";
            id: string;
            email: string;
            firstName: string;
            lastName?: string | null;
          } | null;
        }>;
        fields: Array<{
          __typename?: "PetitionField";
          id: string;
          title?: string | null;
          type: PetitionFieldType;
          options: { [key: string]: any };
          multiple: boolean;
          alias?: string | null;
          optional: boolean;
          isInternal: boolean;
          isReadOnly: boolean;
          commentCount: number;
          unreadCommentCount: number;
          hasCommentsEnabled: boolean;
          description?: string | null;
          visibility?: { [key: string]: any } | null;
          showInPdf: boolean;
          previewReplies: Array<{
            __typename?: "PetitionFieldReply";
            content: { [key: string]: any };
            id: string;
            status: PetitionFieldReplyStatus;
            createdAt: string;
            updatedAt: string;
          }>;
          replies: Array<{
            __typename?: "PetitionFieldReply";
            content: { [key: string]: any };
            id: string;
            status: PetitionFieldReplyStatus;
            createdAt: string;
            updatedAt: string;
          }>;
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
          comments: Array<{
            __typename?: "PetitionFieldComment";
            id: string;
            createdAt: string;
            content: string;
            isUnread: boolean;
            isInternal: boolean;
            isEdited: boolean;
            author?:
              | {
                  __typename?: "PetitionAccess";
                  id: string;
                  contact?: {
                    __typename?: "Contact";
                    id: string;
                    fullName: string;
                    email: string;
                  } | null;
                }
              | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
              | null;
          }>;
        }>;
        signatureConfig?: {
          __typename?: "SignatureConfig";
          allowAdditionalSigners: boolean;
          review: boolean;
          timezone: string;
          title: string;
          signers: Array<{
            __typename?: "PetitionSigner";
            contactId?: string | null;
            email: string;
            firstName: string;
            lastName?: string | null;
            fullName: string;
          }>;
          integration?: {
            __typename?: "SignatureOrgIntegration";
            id: string;
            environment: SignatureOrgIntegrationEnvironment;
            name: string;
          } | null;
        } | null;
        remindersConfig?: {
          __typename?: "RemindersConfig";
          offset: number;
          time: string;
          timezone: string;
          weekdaysOnly: boolean;
        } | null;
        organization: {
          __typename?: "Organization";
          id: string;
          usageLimits: {
            __typename?: "OrganizationUsageLimit";
            petitions: {
              __typename?: "OrganizationUsagePetitionLimit";
              limit: number;
              used: number;
            };
          };
        };
        myEffectivePermission?: {
          __typename?: "EffectivePetitionUserPermission";
          isSubscribed: boolean;
        } | null;
      }
    | {
        __typename?: "PetitionTemplate";
        id: string;
        tone: Tone;
        name?: string | null;
        locale: PetitionLocale;
        isPublic: boolean;
        isRestricted: boolean;
        updatedAt: string;
        fields: Array<{
          __typename?: "PetitionField";
          id: string;
          title?: string | null;
          type: PetitionFieldType;
          options: { [key: string]: any };
          multiple: boolean;
          alias?: string | null;
          optional: boolean;
          isInternal: boolean;
          isReadOnly: boolean;
          commentCount: number;
          unreadCommentCount: number;
          hasCommentsEnabled: boolean;
          description?: string | null;
          visibility?: { [key: string]: any } | null;
          showInPdf: boolean;
          previewReplies: Array<{
            __typename?: "PetitionFieldReply";
            content: { [key: string]: any };
            id: string;
            status: PetitionFieldReplyStatus;
            createdAt: string;
            updatedAt: string;
          }>;
          replies: Array<{
            __typename?: "PetitionFieldReply";
            content: { [key: string]: any };
            id: string;
            status: PetitionFieldReplyStatus;
            createdAt: string;
            updatedAt: string;
          }>;
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
          comments: Array<{
            __typename?: "PetitionFieldComment";
            id: string;
            createdAt: string;
            content: string;
            isUnread: boolean;
            isInternal: boolean;
            isEdited: boolean;
            author?:
              | {
                  __typename?: "PetitionAccess";
                  id: string;
                  contact?: {
                    __typename?: "Contact";
                    id: string;
                    fullName: string;
                    email: string;
                  } | null;
                }
              | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
              | null;
          }>;
        }>;
        signatureConfig?: {
          __typename?: "SignatureConfig";
          allowAdditionalSigners: boolean;
          review: boolean;
          timezone: string;
          title: string;
          signers: Array<{
            __typename?: "PetitionSigner";
            contactId?: string | null;
            email: string;
            firstName: string;
            lastName?: string | null;
          }>;
        } | null;
      }
    | null;
};

export type PetitionPreview_userQueryVariables = Exact<{ [key: string]: never }>;

export type PetitionPreview_userQuery = {
  me: {
    __typename?: "User";
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
    createdAt: string;
    canCreateUsers: boolean;
    role: OrganizationRole;
    isSuperAdmin: boolean;
    avatarUrl?: string | null;
    initials?: string | null;
    hasPetitionPdfExport: boolean;
    organization: {
      __typename?: "Organization";
      name: string;
      id: string;
      usageLimits: {
        __typename?: "OrganizationUsageLimit";
        petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
      };
    };
  };
  metadata: {
    __typename?: "ConnectionMetadata";
    country?: string | null;
    browserName?: string | null;
  };
};

export type PetitionReplies_PetitionFragment = {
  __typename?: "Petition";
  id: string;
  name?: string | null;
  status: PetitionStatus;
  closingEmailBody?: any | null;
  locale: PetitionLocale;
  deadline?: string | null;
  isRestricted: boolean;
  updatedAt: string;
  accesses: Array<{
    __typename?: "PetitionAccess";
    id: string;
    status: PetitionAccessStatus;
    contact?: {
      __typename?: "Contact";
      id: string;
      firstName: string;
      lastName?: string | null;
      email: string;
    } | null;
  }>;
  fields: Array<{
    __typename?: "PetitionField";
    isReadOnly: boolean;
    id: string;
    type: PetitionFieldType;
    title?: string | null;
    description?: string | null;
    optional: boolean;
    isInternal: boolean;
    options: { [key: string]: any };
    hasCommentsEnabled: boolean;
    visibility?: { [key: string]: any } | null;
    multiple: boolean;
    alias?: string | null;
    replies: Array<{
      __typename?: "PetitionFieldReply";
      id: string;
      content: { [key: string]: any };
      status: PetitionFieldReplyStatus;
      createdAt: string;
      metadata: { [key: string]: any };
      field?: {
        __typename?: "PetitionField";
        type: PetitionFieldType;
        options: { [key: string]: any };
      } | null;
      updatedBy?:
        | {
            __typename?: "PetitionAccess";
            contact?: {
              __typename?: "Contact";
              id: string;
              fullName: string;
              email: string;
            } | null;
          }
        | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
        | null;
    }>;
    comments: Array<{
      __typename?: "PetitionFieldComment";
      id: string;
      isUnread: boolean;
      createdAt: string;
    }>;
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
    previewReplies: Array<{
      __typename?: "PetitionFieldReply";
      id: string;
      content: { [key: string]: any };
    }>;
  }>;
  currentSignatureRequest?: {
    __typename?: "PetitionSignatureRequest";
    id: string;
    status: PetitionSignatureRequestStatus;
    environment: SignatureOrgIntegrationEnvironment;
  } | null;
  permissions: Array<
    | {
        __typename?: "PetitionUserGroupPermission";
        permissionType: PetitionPermissionType;
        group: { __typename?: "UserGroup"; id: string; name: string };
      }
    | {
        __typename?: "PetitionUserPermission";
        permissionType: PetitionPermissionType;
        user: { __typename?: "User"; id: string; fullName?: string | null };
      }
  >;
  signatureRequests: Array<{
    __typename?: "PetitionSignatureRequest";
    id: string;
    status: PetitionSignatureRequestStatus;
    signerStatus: Array<{
      __typename?: "PetitionSignatureRequestSignerStatus";
      status: string;
      sentAt?: string | null;
      openedAt?: string | null;
      signedAt?: string | null;
      declinedAt?: string | null;
      signer: { __typename?: "PetitionSigner"; email: string; fullName: string };
    }>;
    signatureConfig: {
      __typename?: "SignatureConfig";
      signers: Array<{ __typename?: "PetitionSigner"; email: string; fullName: string }>;
    };
  }>;
  signatureConfig?: {
    __typename?: "SignatureConfig";
    review: boolean;
    title: string;
    allowAdditionalSigners: boolean;
    timezone: string;
    integration?: {
      __typename?: "SignatureOrgIntegration";
      environment: SignatureOrgIntegrationEnvironment;
      id: string;
      name: string;
      provider: SignatureOrgIntegrationProvider;
      isDefault: boolean;
    } | null;
    signers: Array<{
      __typename?: "PetitionSigner";
      contactId?: string | null;
      firstName: string;
      lastName?: string | null;
      email: string;
      fullName: string;
    }>;
  } | null;
  attachments: Array<{
    __typename?: "PetitionAttachment";
    id: string;
    file: {
      __typename?: "FileUpload";
      filename: string;
      contentType: string;
      size: number;
      isComplete: boolean;
    };
  }>;
  myEffectivePermission?: {
    __typename?: "EffectivePetitionUserPermission";
    isSubscribed: boolean;
  } | null;
};

export type PetitionReplies_PetitionFieldFragment = {
  __typename?: "PetitionField";
  isReadOnly: boolean;
  id: string;
  type: PetitionFieldType;
  title?: string | null;
  description?: string | null;
  optional: boolean;
  isInternal: boolean;
  options: { [key: string]: any };
  hasCommentsEnabled: boolean;
  visibility?: { [key: string]: any } | null;
  multiple: boolean;
  alias?: string | null;
  replies: Array<{
    __typename?: "PetitionFieldReply";
    id: string;
    content: { [key: string]: any };
    status: PetitionFieldReplyStatus;
    createdAt: string;
    metadata: { [key: string]: any };
    field?: {
      __typename?: "PetitionField";
      type: PetitionFieldType;
      options: { [key: string]: any };
    } | null;
    updatedBy?:
      | {
          __typename?: "PetitionAccess";
          contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
        }
      | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
      | null;
  }>;
  comments: Array<{
    __typename?: "PetitionFieldComment";
    id: string;
    isUnread: boolean;
    createdAt: string;
  }>;
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
  previewReplies: Array<{
    __typename?: "PetitionFieldReply";
    id: string;
    content: { [key: string]: any };
  }>;
};

export type PetitionReplies_UserFragment = {
  __typename?: "User";
  id: string;
  unreadNotificationIds: Array<string>;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  createdAt: string;
  canCreateUsers: boolean;
  role: OrganizationRole;
  isSuperAdmin: boolean;
  avatarUrl?: string | null;
  initials?: string | null;
  hasPetitionSignature: boolean;
  hasPetitionPdfExport: boolean;
  hasInternalComments: boolean;
  hasExportCuatrecasas: boolean;
  organization: {
    __typename?: "Organization";
    name: string;
    id: string;
    signatureIntegrations: {
      __typename?: "OrgIntegrationPagination";
      items: Array<
        | {
            __typename?: "SignatureOrgIntegration";
            id: string;
            name: string;
            isDefault: boolean;
            environment: SignatureOrgIntegrationEnvironment;
          }
        | { __typename?: "SsoOrgIntegration" }
        | { __typename?: "UserProvisioningOrgIntegration" }
      >;
    };
    usageLimits: {
      __typename?: "OrganizationUsageLimit";
      petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
    };
  };
};

export type PetitionReplies_updatePetitionMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  data: UpdatePetitionInput;
}>;

export type PetitionReplies_updatePetitionMutation = {
  updatePetition:
    | {
        __typename?: "Petition";
        id: string;
        name?: string | null;
        locale: PetitionLocale;
        deadline?: string | null;
        status: PetitionStatus;
        isRestricted: boolean;
        updatedAt: string;
        myEffectivePermission?: {
          __typename?: "EffectivePetitionUserPermission";
          isSubscribed: boolean;
        } | null;
      }
    | {
        __typename?: "PetitionTemplate";
        id: string;
        name?: string | null;
        locale: PetitionLocale;
        isPublic: boolean;
        isRestricted: boolean;
        updatedAt: string;
      };
};

export type PetitionReplies_closePetitionMutationVariables = Exact<{
  petitionId: Scalars["GID"];
}>;

export type PetitionReplies_closePetitionMutation = {
  closePetition: {
    __typename?: "Petition";
    id: string;
    name?: string | null;
    status: PetitionStatus;
    closingEmailBody?: any | null;
    locale: PetitionLocale;
    deadline?: string | null;
    isRestricted: boolean;
    updatedAt: string;
    accesses: Array<{
      __typename?: "PetitionAccess";
      id: string;
      status: PetitionAccessStatus;
      contact?: {
        __typename?: "Contact";
        id: string;
        firstName: string;
        lastName?: string | null;
        email: string;
      } | null;
    }>;
    fields: Array<{
      __typename?: "PetitionField";
      isReadOnly: boolean;
      id: string;
      type: PetitionFieldType;
      title?: string | null;
      description?: string | null;
      optional: boolean;
      isInternal: boolean;
      options: { [key: string]: any };
      hasCommentsEnabled: boolean;
      visibility?: { [key: string]: any } | null;
      multiple: boolean;
      alias?: string | null;
      replies: Array<{
        __typename?: "PetitionFieldReply";
        id: string;
        content: { [key: string]: any };
        status: PetitionFieldReplyStatus;
        createdAt: string;
        metadata: { [key: string]: any };
        field?: {
          __typename?: "PetitionField";
          type: PetitionFieldType;
          options: { [key: string]: any };
        } | null;
        updatedBy?:
          | {
              __typename?: "PetitionAccess";
              contact?: {
                __typename?: "Contact";
                id: string;
                fullName: string;
                email: string;
              } | null;
            }
          | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
          | null;
      }>;
      comments: Array<{
        __typename?: "PetitionFieldComment";
        id: string;
        isUnread: boolean;
        createdAt: string;
      }>;
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
      previewReplies: Array<{
        __typename?: "PetitionFieldReply";
        id: string;
        content: { [key: string]: any };
      }>;
    }>;
    currentSignatureRequest?: {
      __typename?: "PetitionSignatureRequest";
      id: string;
      status: PetitionSignatureRequestStatus;
      environment: SignatureOrgIntegrationEnvironment;
    } | null;
    permissions: Array<
      | {
          __typename?: "PetitionUserGroupPermission";
          permissionType: PetitionPermissionType;
          group: { __typename?: "UserGroup"; id: string; name: string };
        }
      | {
          __typename?: "PetitionUserPermission";
          permissionType: PetitionPermissionType;
          user: { __typename?: "User"; id: string; fullName?: string | null };
        }
    >;
    signatureRequests: Array<{
      __typename?: "PetitionSignatureRequest";
      id: string;
      status: PetitionSignatureRequestStatus;
      signerStatus: Array<{
        __typename?: "PetitionSignatureRequestSignerStatus";
        status: string;
        sentAt?: string | null;
        openedAt?: string | null;
        signedAt?: string | null;
        declinedAt?: string | null;
        signer: { __typename?: "PetitionSigner"; email: string; fullName: string };
      }>;
      signatureConfig: {
        __typename?: "SignatureConfig";
        signers: Array<{ __typename?: "PetitionSigner"; email: string; fullName: string }>;
      };
    }>;
    signatureConfig?: {
      __typename?: "SignatureConfig";
      review: boolean;
      title: string;
      allowAdditionalSigners: boolean;
      timezone: string;
      integration?: {
        __typename?: "SignatureOrgIntegration";
        environment: SignatureOrgIntegrationEnvironment;
        id: string;
        name: string;
        provider: SignatureOrgIntegrationProvider;
        isDefault: boolean;
      } | null;
      signers: Array<{
        __typename?: "PetitionSigner";
        contactId?: string | null;
        firstName: string;
        lastName?: string | null;
        email: string;
        fullName: string;
      }>;
    } | null;
    attachments: Array<{
      __typename?: "PetitionAttachment";
      id: string;
      file: {
        __typename?: "FileUpload";
        filename: string;
        contentType: string;
        size: number;
        isComplete: boolean;
      };
    }>;
    myEffectivePermission?: {
      __typename?: "EffectivePetitionUserPermission";
      isSubscribed: boolean;
    } | null;
  };
};

export type PetitionReplies_approveOrRejectPetitionFieldRepliesMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  status: PetitionFieldReplyStatus;
}>;

export type PetitionReplies_approveOrRejectPetitionFieldRepliesMutation = {
  approveOrRejectPetitionFieldReplies: {
    __typename?: "Petition";
    id: string;
    name?: string | null;
    status: PetitionStatus;
    closingEmailBody?: any | null;
    locale: PetitionLocale;
    deadline?: string | null;
    isRestricted: boolean;
    updatedAt: string;
    accesses: Array<{
      __typename?: "PetitionAccess";
      id: string;
      status: PetitionAccessStatus;
      contact?: {
        __typename?: "Contact";
        id: string;
        firstName: string;
        lastName?: string | null;
        email: string;
      } | null;
    }>;
    fields: Array<{
      __typename?: "PetitionField";
      isReadOnly: boolean;
      id: string;
      type: PetitionFieldType;
      title?: string | null;
      description?: string | null;
      optional: boolean;
      isInternal: boolean;
      options: { [key: string]: any };
      hasCommentsEnabled: boolean;
      visibility?: { [key: string]: any } | null;
      multiple: boolean;
      alias?: string | null;
      replies: Array<{
        __typename?: "PetitionFieldReply";
        id: string;
        content: { [key: string]: any };
        status: PetitionFieldReplyStatus;
        createdAt: string;
        metadata: { [key: string]: any };
        field?: {
          __typename?: "PetitionField";
          type: PetitionFieldType;
          options: { [key: string]: any };
        } | null;
        updatedBy?:
          | {
              __typename?: "PetitionAccess";
              contact?: {
                __typename?: "Contact";
                id: string;
                fullName: string;
                email: string;
              } | null;
            }
          | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
          | null;
      }>;
      comments: Array<{
        __typename?: "PetitionFieldComment";
        id: string;
        isUnread: boolean;
        createdAt: string;
      }>;
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
      previewReplies: Array<{
        __typename?: "PetitionFieldReply";
        id: string;
        content: { [key: string]: any };
      }>;
    }>;
    currentSignatureRequest?: {
      __typename?: "PetitionSignatureRequest";
      id: string;
      status: PetitionSignatureRequestStatus;
      environment: SignatureOrgIntegrationEnvironment;
    } | null;
    permissions: Array<
      | {
          __typename?: "PetitionUserGroupPermission";
          permissionType: PetitionPermissionType;
          group: { __typename?: "UserGroup"; id: string; name: string };
        }
      | {
          __typename?: "PetitionUserPermission";
          permissionType: PetitionPermissionType;
          user: { __typename?: "User"; id: string; fullName?: string | null };
        }
    >;
    signatureRequests: Array<{
      __typename?: "PetitionSignatureRequest";
      id: string;
      status: PetitionSignatureRequestStatus;
      signerStatus: Array<{
        __typename?: "PetitionSignatureRequestSignerStatus";
        status: string;
        sentAt?: string | null;
        openedAt?: string | null;
        signedAt?: string | null;
        declinedAt?: string | null;
        signer: { __typename?: "PetitionSigner"; email: string; fullName: string };
      }>;
      signatureConfig: {
        __typename?: "SignatureConfig";
        signers: Array<{ __typename?: "PetitionSigner"; email: string; fullName: string }>;
      };
    }>;
    signatureConfig?: {
      __typename?: "SignatureConfig";
      review: boolean;
      title: string;
      allowAdditionalSigners: boolean;
      timezone: string;
      integration?: {
        __typename?: "SignatureOrgIntegration";
        environment: SignatureOrgIntegrationEnvironment;
        id: string;
        name: string;
        provider: SignatureOrgIntegrationProvider;
        isDefault: boolean;
      } | null;
      signers: Array<{
        __typename?: "PetitionSigner";
        contactId?: string | null;
        firstName: string;
        lastName?: string | null;
        email: string;
        fullName: string;
      }>;
    } | null;
    attachments: Array<{
      __typename?: "PetitionAttachment";
      id: string;
      file: {
        __typename?: "FileUpload";
        filename: string;
        contentType: string;
        size: number;
        isComplete: boolean;
      };
    }>;
    myEffectivePermission?: {
      __typename?: "EffectivePetitionUserPermission";
      isSubscribed: boolean;
    } | null;
  };
};

export type PetitionReplies_fileUploadReplyDownloadLinkMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  replyId: Scalars["GID"];
  preview?: InputMaybe<Scalars["Boolean"]>;
}>;

export type PetitionReplies_fileUploadReplyDownloadLinkMutation = {
  fileUploadReplyDownloadLink: {
    __typename?: "FileUploadDownloadLinkResult";
    result: Result;
    url?: string | null;
  };
};

export type PetitionReplies_updatePetitionFieldRepliesStatusMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  petitionFieldId: Scalars["GID"];
  petitionFieldReplyIds: Array<Scalars["GID"]> | Scalars["GID"];
  status: PetitionFieldReplyStatus;
}>;

export type PetitionReplies_updatePetitionFieldRepliesStatusMutation = {
  updatePetitionFieldRepliesStatus: {
    __typename?: "PetitionField";
    id: string;
    petition:
      | { __typename?: "Petition"; id: string; status: PetitionStatus }
      | { __typename?: "PetitionTemplate" };
    replies: Array<{
      __typename?: "PetitionFieldReply";
      id: string;
      status: PetitionFieldReplyStatus;
    }>;
  };
};

export type PetitionReplies_sendPetitionClosedNotificationMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  emailBody: Scalars["JSON"];
  attachPdfExport: Scalars["Boolean"];
  pdfExportTitle?: InputMaybe<Scalars["String"]>;
  force?: InputMaybe<Scalars["Boolean"]>;
}>;

export type PetitionReplies_sendPetitionClosedNotificationMutation = {
  sendPetitionClosedNotification: { __typename?: "Petition"; id: string };
};

export type PetitionReplies_userQueryVariables = Exact<{ [key: string]: never }>;

export type PetitionReplies_userQuery = {
  me: {
    __typename?: "User";
    id: string;
    unreadNotificationIds: Array<string>;
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    createdAt: string;
    canCreateUsers: boolean;
    role: OrganizationRole;
    isSuperAdmin: boolean;
    avatarUrl?: string | null;
    initials?: string | null;
    hasPetitionSignature: boolean;
    hasPetitionPdfExport: boolean;
    hasInternalComments: boolean;
    hasExportCuatrecasas: boolean;
    organization: {
      __typename?: "Organization";
      name: string;
      id: string;
      signatureIntegrations: {
        __typename?: "OrgIntegrationPagination";
        items: Array<
          | {
              __typename?: "SignatureOrgIntegration";
              id: string;
              name: string;
              isDefault: boolean;
              environment: SignatureOrgIntegrationEnvironment;
            }
          | { __typename?: "SsoOrgIntegration" }
          | { __typename?: "UserProvisioningOrgIntegration" }
        >;
      };
      usageLimits: {
        __typename?: "OrganizationUsageLimit";
        petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
      };
    };
  };
};

export type PetitionReplies_petitionQueryVariables = Exact<{
  id: Scalars["GID"];
}>;

export type PetitionReplies_petitionQuery = {
  petition?:
    | {
        __typename?: "Petition";
        id: string;
        name?: string | null;
        status: PetitionStatus;
        closingEmailBody?: any | null;
        locale: PetitionLocale;
        deadline?: string | null;
        isRestricted: boolean;
        updatedAt: string;
        accesses: Array<{
          __typename?: "PetitionAccess";
          id: string;
          status: PetitionAccessStatus;
          contact?: {
            __typename?: "Contact";
            id: string;
            firstName: string;
            lastName?: string | null;
            email: string;
          } | null;
        }>;
        fields: Array<{
          __typename?: "PetitionField";
          isReadOnly: boolean;
          id: string;
          type: PetitionFieldType;
          title?: string | null;
          description?: string | null;
          optional: boolean;
          isInternal: boolean;
          options: { [key: string]: any };
          hasCommentsEnabled: boolean;
          visibility?: { [key: string]: any } | null;
          multiple: boolean;
          alias?: string | null;
          replies: Array<{
            __typename?: "PetitionFieldReply";
            id: string;
            content: { [key: string]: any };
            status: PetitionFieldReplyStatus;
            createdAt: string;
            metadata: { [key: string]: any };
            field?: {
              __typename?: "PetitionField";
              type: PetitionFieldType;
              options: { [key: string]: any };
            } | null;
            updatedBy?:
              | {
                  __typename?: "PetitionAccess";
                  contact?: {
                    __typename?: "Contact";
                    id: string;
                    fullName: string;
                    email: string;
                  } | null;
                }
              | { __typename?: "User"; id: string; fullName?: string | null; status: UserStatus }
              | null;
          }>;
          comments: Array<{
            __typename?: "PetitionFieldComment";
            id: string;
            isUnread: boolean;
            createdAt: string;
          }>;
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
          previewReplies: Array<{
            __typename?: "PetitionFieldReply";
            id: string;
            content: { [key: string]: any };
          }>;
        }>;
        currentSignatureRequest?: {
          __typename?: "PetitionSignatureRequest";
          id: string;
          status: PetitionSignatureRequestStatus;
          environment: SignatureOrgIntegrationEnvironment;
        } | null;
        permissions: Array<
          | {
              __typename?: "PetitionUserGroupPermission";
              permissionType: PetitionPermissionType;
              group: { __typename?: "UserGroup"; id: string; name: string };
            }
          | {
              __typename?: "PetitionUserPermission";
              permissionType: PetitionPermissionType;
              user: { __typename?: "User"; id: string; fullName?: string | null };
            }
        >;
        signatureRequests: Array<{
          __typename?: "PetitionSignatureRequest";
          id: string;
          status: PetitionSignatureRequestStatus;
          signerStatus: Array<{
            __typename?: "PetitionSignatureRequestSignerStatus";
            status: string;
            sentAt?: string | null;
            openedAt?: string | null;
            signedAt?: string | null;
            declinedAt?: string | null;
            signer: { __typename?: "PetitionSigner"; email: string; fullName: string };
          }>;
          signatureConfig: {
            __typename?: "SignatureConfig";
            signers: Array<{ __typename?: "PetitionSigner"; email: string; fullName: string }>;
          };
        }>;
        signatureConfig?: {
          __typename?: "SignatureConfig";
          review: boolean;
          title: string;
          allowAdditionalSigners: boolean;
          timezone: string;
          integration?: {
            __typename?: "SignatureOrgIntegration";
            environment: SignatureOrgIntegrationEnvironment;
            id: string;
            name: string;
            provider: SignatureOrgIntegrationProvider;
            isDefault: boolean;
          } | null;
          signers: Array<{
            __typename?: "PetitionSigner";
            contactId?: string | null;
            firstName: string;
            lastName?: string | null;
            email: string;
            fullName: string;
          }>;
        } | null;
        attachments: Array<{
          __typename?: "PetitionAttachment";
          id: string;
          file: {
            __typename?: "FileUpload";
            filename: string;
            contentType: string;
            size: number;
            isComplete: boolean;
          };
        }>;
        myEffectivePermission?: {
          __typename?: "EffectivePetitionUserPermission";
          isSubscribed: boolean;
        } | null;
      }
    | { __typename?: "PetitionTemplate" }
    | null;
};

export type Petitions_PetitionBasePaginationFragment = {
  __typename?: "PetitionBasePagination";
  totalCount: number;
  items: Array<
    | {
        __typename?: "Petition";
        sentAt?: string | null;
        id: string;
        name?: string | null;
        createdAt: string;
        status: PetitionStatus;
        isRestricted: boolean;
        accesses: Array<{
          __typename?: "PetitionAccess";
          status: PetitionAccessStatus;
          nextReminderAt?: string | null;
          contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
          reminders: Array<{ __typename?: "PetitionReminder"; createdAt: string }>;
        }>;
        permissions: Array<
          | {
              __typename?: "PetitionUserGroupPermission";
              permissionType: PetitionPermissionType;
              group: { __typename?: "UserGroup"; id: string; name: string; initials: string };
            }
          | {
              __typename?: "PetitionUserPermission";
              permissionType: PetitionPermissionType;
              user: {
                __typename?: "User";
                id: string;
                fullName?: string | null;
                avatarUrl?: string | null;
                initials?: string | null;
              };
            }
        >;
        progress: {
          __typename?: "PetitionProgress";
          external: {
            __typename?: "PetitionFieldProgress";
            validated: number;
            replied: number;
            optional: number;
            total: number;
          };
          internal: {
            __typename?: "PetitionFieldProgress";
            validated: number;
            replied: number;
            optional: number;
            total: number;
          };
        };
        tags: Array<{ __typename?: "Tag"; id: string; name: string; color: string }>;
        currentSignatureRequest?: {
          __typename?: "PetitionSignatureRequest";
          status: PetitionSignatureRequestStatus;
          environment: SignatureOrgIntegrationEnvironment;
        } | null;
        signatureConfig?: {
          __typename?: "SignatureConfig";
          review: boolean;
          integration?: {
            __typename?: "SignatureOrgIntegration";
            environment: SignatureOrgIntegrationEnvironment;
          } | null;
        } | null;
      }
    | {
        __typename?: "PetitionTemplate";
        isPublic: boolean;
        descriptionExcerpt?: string | null;
        id: string;
        name?: string | null;
        createdAt: string;
        isRestricted: boolean;
        permissions: Array<
          | {
              __typename?: "PetitionUserGroupPermission";
              permissionType: PetitionPermissionType;
              group: { __typename?: "UserGroup"; id: string; name: string; initials: string };
            }
          | {
              __typename?: "PetitionUserPermission";
              permissionType: PetitionPermissionType;
              user: {
                __typename?: "User";
                id: string;
                fullName?: string | null;
                avatarUrl?: string | null;
                initials?: string | null;
              };
            }
        >;
        tags: Array<{ __typename?: "Tag"; id: string; name: string; color: string }>;
      }
  >;
};

export type Petitions_PetitionBase_Petition_Fragment = {
  __typename?: "Petition";
  sentAt?: string | null;
  id: string;
  name?: string | null;
  createdAt: string;
  status: PetitionStatus;
  isRestricted: boolean;
  accesses: Array<{
    __typename?: "PetitionAccess";
    status: PetitionAccessStatus;
    nextReminderAt?: string | null;
    contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
    reminders: Array<{ __typename?: "PetitionReminder"; createdAt: string }>;
  }>;
  permissions: Array<
    | {
        __typename?: "PetitionUserGroupPermission";
        permissionType: PetitionPermissionType;
        group: { __typename?: "UserGroup"; id: string; name: string; initials: string };
      }
    | {
        __typename?: "PetitionUserPermission";
        permissionType: PetitionPermissionType;
        user: {
          __typename?: "User";
          id: string;
          fullName?: string | null;
          avatarUrl?: string | null;
          initials?: string | null;
        };
      }
  >;
  progress: {
    __typename?: "PetitionProgress";
    external: {
      __typename?: "PetitionFieldProgress";
      validated: number;
      replied: number;
      optional: number;
      total: number;
    };
    internal: {
      __typename?: "PetitionFieldProgress";
      validated: number;
      replied: number;
      optional: number;
      total: number;
    };
  };
  tags: Array<{ __typename?: "Tag"; id: string; name: string; color: string }>;
  currentSignatureRequest?: {
    __typename?: "PetitionSignatureRequest";
    status: PetitionSignatureRequestStatus;
    environment: SignatureOrgIntegrationEnvironment;
  } | null;
  signatureConfig?: {
    __typename?: "SignatureConfig";
    review: boolean;
    integration?: {
      __typename?: "SignatureOrgIntegration";
      environment: SignatureOrgIntegrationEnvironment;
    } | null;
  } | null;
};

export type Petitions_PetitionBase_PetitionTemplate_Fragment = {
  __typename?: "PetitionTemplate";
  isPublic: boolean;
  descriptionExcerpt?: string | null;
  id: string;
  name?: string | null;
  createdAt: string;
  isRestricted: boolean;
  permissions: Array<
    | {
        __typename?: "PetitionUserGroupPermission";
        permissionType: PetitionPermissionType;
        group: { __typename?: "UserGroup"; id: string; name: string; initials: string };
      }
    | {
        __typename?: "PetitionUserPermission";
        permissionType: PetitionPermissionType;
        user: {
          __typename?: "User";
          id: string;
          fullName?: string | null;
          avatarUrl?: string | null;
          initials?: string | null;
        };
      }
  >;
  tags: Array<{ __typename?: "Tag"; id: string; name: string; color: string }>;
};

export type Petitions_PetitionBaseFragment =
  | Petitions_PetitionBase_Petition_Fragment
  | Petitions_PetitionBase_PetitionTemplate_Fragment;

export type Petitions_userQueryVariables = Exact<{ [key: string]: never }>;

export type Petitions_userQuery = {
  me: {
    __typename?: "User";
    id: string;
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    createdAt: string;
    canCreateUsers: boolean;
    role: OrganizationRole;
    isSuperAdmin: boolean;
    avatarUrl?: string | null;
    initials?: string | null;
    organization: {
      __typename?: "Organization";
      id: string;
      usageLimits: {
        __typename?: "OrganizationUsageLimit";
        petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
      };
    };
  };
};

export type Petitions_petitionsQueryVariables = Exact<{
  offset: Scalars["Int"];
  limit: Scalars["Int"];
  search?: InputMaybe<Scalars["String"]>;
  sortBy?: InputMaybe<Array<QueryPetitions_OrderBy> | QueryPetitions_OrderBy>;
  filters?: InputMaybe<PetitionFilter>;
}>;

export type Petitions_petitionsQuery = {
  petitions: {
    __typename?: "PetitionBasePagination";
    totalCount: number;
    items: Array<
      | {
          __typename?: "Petition";
          sentAt?: string | null;
          id: string;
          name?: string | null;
          createdAt: string;
          status: PetitionStatus;
          isRestricted: boolean;
          accesses: Array<{
            __typename?: "PetitionAccess";
            status: PetitionAccessStatus;
            nextReminderAt?: string | null;
            contact?: {
              __typename?: "Contact";
              id: string;
              fullName: string;
              email: string;
            } | null;
            reminders: Array<{ __typename?: "PetitionReminder"; createdAt: string }>;
          }>;
          permissions: Array<
            | {
                __typename?: "PetitionUserGroupPermission";
                permissionType: PetitionPermissionType;
                group: { __typename?: "UserGroup"; id: string; name: string; initials: string };
              }
            | {
                __typename?: "PetitionUserPermission";
                permissionType: PetitionPermissionType;
                user: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  avatarUrl?: string | null;
                  initials?: string | null;
                };
              }
          >;
          progress: {
            __typename?: "PetitionProgress";
            external: {
              __typename?: "PetitionFieldProgress";
              validated: number;
              replied: number;
              optional: number;
              total: number;
            };
            internal: {
              __typename?: "PetitionFieldProgress";
              validated: number;
              replied: number;
              optional: number;
              total: number;
            };
          };
          tags: Array<{ __typename?: "Tag"; id: string; name: string; color: string }>;
          currentSignatureRequest?: {
            __typename?: "PetitionSignatureRequest";
            status: PetitionSignatureRequestStatus;
            environment: SignatureOrgIntegrationEnvironment;
          } | null;
          signatureConfig?: {
            __typename?: "SignatureConfig";
            review: boolean;
            integration?: {
              __typename?: "SignatureOrgIntegration";
              environment: SignatureOrgIntegrationEnvironment;
            } | null;
          } | null;
        }
      | {
          __typename?: "PetitionTemplate";
          isPublic: boolean;
          descriptionExcerpt?: string | null;
          id: string;
          name?: string | null;
          createdAt: string;
          isRestricted: boolean;
          permissions: Array<
            | {
                __typename?: "PetitionUserGroupPermission";
                permissionType: PetitionPermissionType;
                group: { __typename?: "UserGroup"; id: string; name: string; initials: string };
              }
            | {
                __typename?: "PetitionUserPermission";
                permissionType: PetitionPermissionType;
                user: {
                  __typename?: "User";
                  id: string;
                  fullName?: string | null;
                  avatarUrl?: string | null;
                  initials?: string | null;
                };
              }
          >;
          tags: Array<{ __typename?: "Tag"; id: string; name: string; color: string }>;
        }
    >;
  };
};

export type NewPetition_PetitionTemplateFragment = {
  __typename?: "PetitionTemplate";
  id: string;
  name?: string | null;
  descriptionExcerpt?: string | null;
  backgroundColor?: string | null;
  categories?: Array<string> | null;
  imageUrl?: string | null;
  locale: PetitionLocale;
  isRestricted: boolean;
  permissions: Array<
    | {
        __typename?: "PetitionUserGroupPermission";
        group: { __typename?: "UserGroup"; id: string; name: string; initials: string };
      }
    | {
        __typename?: "PetitionUserPermission";
        user: {
          __typename?: "User";
          id: string;
          fullName?: string | null;
          avatarUrl?: string | null;
          initials?: string | null;
        };
      }
  >;
  publicLink?: { __typename?: "PublicPetitionLink"; id: string; isActive: boolean } | null;
  signatureConfig?: { __typename?: "SignatureConfig"; title: string } | null;
  remindersConfig?: { __typename?: "RemindersConfig"; time: string } | null;
};

export type NewPetition_UserFragment = {
  __typename?: "User";
  id: string;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  createdAt: string;
  canCreateUsers: boolean;
  role: OrganizationRole;
  isSuperAdmin: boolean;
  avatarUrl?: string | null;
  initials?: string | null;
  organization: {
    __typename?: "Organization";
    id: string;
    usageLimits: {
      __typename?: "OrganizationUsageLimit";
      petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
    };
  };
};

export type NewPetition_templatesQueryVariables = Exact<{
  offset: Scalars["Int"];
  limit: Scalars["Int"];
  search?: InputMaybe<Scalars["String"]>;
  locale?: InputMaybe<PetitionLocale>;
  isPublic: Scalars["Boolean"];
  isOwner?: InputMaybe<Scalars["Boolean"]>;
  category?: InputMaybe<Scalars["String"]>;
}>;

export type NewPetition_templatesQuery = {
  templates: {
    __typename?: "PetitionTemplatePagination";
    totalCount: number;
    items: Array<{
      __typename?: "PetitionTemplate";
      id: string;
      name?: string | null;
      descriptionExcerpt?: string | null;
      backgroundColor?: string | null;
      categories?: Array<string> | null;
      imageUrl?: string | null;
      locale: PetitionLocale;
      isRestricted: boolean;
      permissions: Array<
        | {
            __typename?: "PetitionUserGroupPermission";
            group: { __typename?: "UserGroup"; id: string; name: string; initials: string };
          }
        | {
            __typename?: "PetitionUserPermission";
            user: {
              __typename?: "User";
              id: string;
              fullName?: string | null;
              avatarUrl?: string | null;
              initials?: string | null;
            };
          }
      >;
      publicLink?: { __typename?: "PublicPetitionLink"; id: string; isActive: boolean } | null;
      signatureConfig?: { __typename?: "SignatureConfig"; title: string } | null;
      remindersConfig?: { __typename?: "RemindersConfig"; time: string } | null;
    }>;
  };
};

export type NewPetition_userQueryVariables = Exact<{ [key: string]: never }>;

export type NewPetition_userQuery = {
  publicTemplateCategories: Array<string>;
  me: {
    __typename?: "User";
    id: string;
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    createdAt: string;
    canCreateUsers: boolean;
    role: OrganizationRole;
    isSuperAdmin: boolean;
    avatarUrl?: string | null;
    initials?: string | null;
    organization: {
      __typename?: "Organization";
      id: string;
      usageLimits: {
        __typename?: "OrganizationUsageLimit";
        petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
      };
    };
  };
  hasTemplates: { __typename?: "PetitionBasePagination"; totalCount: number };
};

export type NewPetition_templateQueryVariables = Exact<{
  templateId: Scalars["GID"];
}>;

export type NewPetition_templateQuery = {
  petition?:
    | { __typename?: "Petition" }
    | {
        __typename?: "PetitionTemplate";
        id: string;
        descriptionHtml?: string | null;
        name?: string | null;
        isPublic: boolean;
        updatedAt: string;
        locale: PetitionLocale;
        isRestricted: boolean;
        permissions: Array<
          | {
              __typename?: "PetitionUserGroupPermission";
              group: { __typename?: "UserGroup"; id: string; name: string; initials: string };
            }
          | {
              __typename?: "PetitionUserPermission";
              user: {
                __typename?: "User";
                id: string;
                fullName?: string | null;
                avatarUrl?: string | null;
                initials?: string | null;
              };
            }
        >;
        fields: Array<{
          __typename?: "PetitionField";
          id: string;
          title?: string | null;
          type: PetitionFieldType;
          options: { [key: string]: any };
        }>;
        owner: {
          __typename?: "User";
          id: string;
          fullName?: string | null;
          organization: { __typename?: "Organization"; id: string; name: string };
        };
        myEffectivePermission?: {
          __typename?: "EffectivePetitionUserPermission";
          permissionType: PetitionPermissionType;
        } | null;
        publicLink?: {
          __typename?: "PublicPetitionLink";
          id: string;
          isActive: boolean;
          slug: string;
          url: string;
        } | null;
        signatureConfig?: { __typename?: "SignatureConfig"; title: string } | null;
        remindersConfig?: { __typename?: "RemindersConfig"; time: string } | null;
      }
    | null;
};

export type Account_UserFragment = {
  __typename?: "User";
  firstName?: string | null;
  lastName?: string | null;
  isSsoUser: boolean;
  email: string;
  preferredLocale?: string | null;
  id: string;
  fullName?: string | null;
  createdAt: string;
  canCreateUsers: boolean;
  isSuperAdmin: boolean;
  role: OrganizationRole;
  avatarUrl?: string | null;
  initials?: string | null;
  hasDeveloperAccess: boolean;
  organization: {
    __typename?: "Organization";
    id: string;
    usageLimits: {
      __typename?: "OrganizationUsageLimit";
      petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
    };
  };
};

export type Account_updateAccountMutationVariables = Exact<{
  id: Scalars["GID"];
  data: UpdateUserInput;
}>;

export type Account_updateAccountMutation = {
  updateUser: {
    __typename?: "User";
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
    initials?: string | null;
  };
};

export type Account_setUserPreferredLocaleMutationVariables = Exact<{
  locale: Scalars["String"];
}>;

export type Account_setUserPreferredLocaleMutation = {
  setUserPreferredLocale: {
    __typename?: "User";
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    isSsoUser: boolean;
    email: string;
    preferredLocale?: string | null;
    fullName?: string | null;
    createdAt: string;
    canCreateUsers: boolean;
    isSuperAdmin: boolean;
    role: OrganizationRole;
    avatarUrl?: string | null;
    initials?: string | null;
    hasDeveloperAccess: boolean;
    organization: {
      __typename?: "Organization";
      id: string;
      usageLimits: {
        __typename?: "OrganizationUsageLimit";
        petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
      };
    };
  };
};

export type Account_userQueryVariables = Exact<{ [key: string]: never }>;

export type Account_userQuery = {
  me: {
    __typename?: "User";
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    isSsoUser: boolean;
    email: string;
    preferredLocale?: string | null;
    fullName?: string | null;
    createdAt: string;
    canCreateUsers: boolean;
    isSuperAdmin: boolean;
    role: OrganizationRole;
    avatarUrl?: string | null;
    initials?: string | null;
    hasDeveloperAccess: boolean;
    organization: {
      __typename?: "Organization";
      id: string;
      usageLimits: {
        __typename?: "OrganizationUsageLimit";
        petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
      };
    };
  };
};

export type Developers_UserAuthenticationTokenFragment = {
  __typename?: "UserAuthenticationToken";
  id: string;
  tokenName: string;
  createdAt: string;
  lastUsedAt?: string | null;
};

export type Developers_PetitionEventSubscriptionFragment = {
  __typename?: "PetitionEventSubscription";
  id: string;
  eventsUrl: string;
  eventTypes?: Array<PetitionEventType> | null;
  isEnabled: boolean;
  name?: string | null;
};

export type Developers_revokeUserAuthTokenMutationVariables = Exact<{
  authTokenIds: Array<Scalars["GID"]> | Scalars["GID"];
}>;

export type Developers_revokeUserAuthTokenMutation = { revokeUserAuthToken: Result };

export type Developers_createEventSubscriptionMutationVariables = Exact<{
  eventsUrl: Scalars["String"];
  eventTypes?: InputMaybe<Array<PetitionEventType> | PetitionEventType>;
  name?: InputMaybe<Scalars["String"]>;
}>;

export type Developers_createEventSubscriptionMutation = {
  createEventSubscription: {
    __typename?: "PetitionEventSubscription";
    id: string;
    eventsUrl: string;
    eventTypes?: Array<PetitionEventType> | null;
    isEnabled: boolean;
    name?: string | null;
  };
};

export type Developers_updateEventSubscriptionMutationVariables = Exact<{
  id: Scalars["GID"];
  data: UpdateEventSubscriptionInput;
}>;

export type Developers_updateEventSubscriptionMutation = {
  updateEventSubscription: {
    __typename?: "PetitionEventSubscription";
    id: string;
    eventsUrl: string;
    eventTypes?: Array<PetitionEventType> | null;
    isEnabled: boolean;
    name?: string | null;
  };
};

export type Developers_deleteEventSubscriptionsMutationVariables = Exact<{
  ids: Array<Scalars["GID"]> | Scalars["GID"];
}>;

export type Developers_deleteEventSubscriptionsMutation = { deleteEventSubscriptions: Result };

export type Developers_tokensQueryVariables = Exact<{ [key: string]: never }>;

export type Developers_tokensQuery = {
  me: {
    __typename?: "User";
    id: string;
    tokens: Array<{
      __typename?: "UserAuthenticationToken";
      id: string;
      tokenName: string;
      createdAt: string;
      lastUsedAt?: string | null;
    }>;
  };
};

export type Developers_subscriptionsQueryVariables = Exact<{ [key: string]: never }>;

export type Developers_subscriptionsQuery = {
  subscriptions: Array<{
    __typename?: "PetitionEventSubscription";
    id: string;
    eventsUrl: string;
    eventTypes?: Array<PetitionEventType> | null;
    isEnabled: boolean;
    name?: string | null;
  }>;
};

export type Developers_userQueryVariables = Exact<{ [key: string]: never }>;

export type Developers_userQuery = {
  me: {
    __typename?: "User";
    id: string;
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    createdAt: string;
    canCreateUsers: boolean;
    isSuperAdmin: boolean;
    role: OrganizationRole;
    avatarUrl?: string | null;
    initials?: string | null;
    hasDeveloperAccess: boolean;
    organization: {
      __typename?: "Organization";
      id: string;
      usageLimits: {
        __typename?: "OrganizationUsageLimit";
        petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
      };
    };
  };
};

export type Settings_userQueryVariables = Exact<{ [key: string]: never }>;

export type Settings_userQuery = {
  me: {
    __typename?: "User";
    id: string;
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    createdAt: string;
    canCreateUsers: boolean;
    isSuperAdmin: boolean;
    role: OrganizationRole;
    avatarUrl?: string | null;
    initials?: string | null;
    hasDeveloperAccess: boolean;
    organization: {
      __typename?: "Organization";
      id: string;
      usageLimits: {
        __typename?: "OrganizationUsageLimit";
        petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
      };
    };
  };
};

export type Security_updatePasswordMutationVariables = Exact<{
  password: Scalars["String"];
  newPassword: Scalars["String"];
}>;

export type Security_updatePasswordMutation = { changePassword: ChangePasswordResult };

export type Security_userQueryVariables = Exact<{ [key: string]: never }>;

export type Security_userQuery = {
  me: {
    __typename?: "User";
    isSsoUser: boolean;
    id: string;
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    createdAt: string;
    canCreateUsers: boolean;
    isSuperAdmin: boolean;
    role: OrganizationRole;
    avatarUrl?: string | null;
    initials?: string | null;
    hasDeveloperAccess: boolean;
    organization: {
      __typename?: "Organization";
      id: string;
      usageLimits: {
        __typename?: "OrganizationUsageLimit";
        petitions: { __typename?: "OrganizationUsagePetitionLimit"; limit: number; used: number };
      };
    };
  };
};

export type Forgot_resendVerificationCodeMutationVariables = Exact<{
  email: Scalars["String"];
  locale?: InputMaybe<Scalars["String"]>;
}>;

export type Forgot_resendVerificationCodeMutation = { resendVerificationCode: Result };

export type Forgot_resetTemporaryPasswordMutationVariables = Exact<{
  email: Scalars["String"];
  locale?: InputMaybe<Scalars["String"]>;
}>;

export type Forgot_resetTemporaryPasswordMutation = { resetTemporaryPassword: Result };

export type Login_resendVerificationCodeMutationVariables = Exact<{
  email: Scalars["String"];
  locale?: InputMaybe<Scalars["String"]>;
}>;

export type Login_resendVerificationCodeMutation = { resendVerificationCode: Result };

export type Login_currentUserQueryVariables = Exact<{ [key: string]: never }>;

export type Login_currentUserQuery = {
  me: {
    __typename?: "User";
    id: string;
    preferredLocale?: string | null;
    email: string;
    fullName?: string | null;
    avatarUrl?: string | null;
    initials?: string | null;
  };
};

export type RecipientView_PublicPetitionAccessFragment = {
  __typename?: "PublicPetitionAccess";
  petition?: {
    __typename?: "PublicPetition";
    id: string;
    status: PetitionStatus;
    deadline?: string | null;
    isRecipientViewContentsHidden: boolean;
    tone: Tone;
    signatureStatus?: PublicSignatureStatus | null;
    recipients: Array<{
      __typename?: "PublicContact";
      firstName: string;
      lastName?: string | null;
      email: string;
      id: string;
      fullName: string;
    }>;
    fields: Array<{
      __typename?: "PublicPetitionField";
      id: string;
      type: PetitionFieldType;
      title?: string | null;
      options: { [key: string]: any };
      optional: boolean;
      isInternal: boolean;
      isReadOnly: boolean;
      commentCount: number;
      unreadCommentCount: number;
      hasCommentsEnabled: boolean;
      multiple: boolean;
      alias?: string | null;
      visibility?: { [key: string]: any } | null;
      description?: string | null;
      replies: Array<{
        __typename?: "PublicPetitionFieldReply";
        id: string;
        status: PetitionFieldReplyStatus;
        content: { [key: string]: any };
        createdAt: string;
        updatedAt: string;
      }>;
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
    }>;
    signatureConfig?: {
      __typename?: "PublicSignatureConfig";
      review: boolean;
      allowAdditionalSigners: boolean;
      signers: Array<{
        __typename?: "PetitionSigner";
        fullName: string;
        firstName: string;
        lastName?: string | null;
        email: string;
      }>;
      additionalSigners: Array<{
        __typename?: "PetitionSigner";
        firstName: string;
        lastName?: string | null;
        fullName: string;
        email: string;
      }>;
    } | null;
  } | null;
  granter?: {
    __typename?: "PublicUser";
    fullName: string;
    id: string;
    firstName?: string | null;
    email: string;
    organization: { __typename?: "PublicOrganization"; name: string; logoUrl?: string | null };
  } | null;
  contact?: {
    __typename?: "PublicContact";
    id: string;
    fullName: string;
    firstName: string;
    email: string;
    lastName?: string | null;
  } | null;
  message?: { __typename?: "PublicPetitionMessage"; id: string; subject?: string | null } | null;
};

export type RecipientView_PublicPetitionMessageFragment = {
  __typename?: "PublicPetitionMessage";
  id: string;
  subject?: string | null;
};

export type RecipientView_PublicPetitionFragment = {
  __typename?: "PublicPetition";
  id: string;
  status: PetitionStatus;
  deadline?: string | null;
  isRecipientViewContentsHidden: boolean;
  tone: Tone;
  signatureStatus?: PublicSignatureStatus | null;
  fields: Array<{
    __typename?: "PublicPetitionField";
    id: string;
    type: PetitionFieldType;
    title?: string | null;
    options: { [key: string]: any };
    optional: boolean;
    isInternal: boolean;
    isReadOnly: boolean;
    commentCount: number;
    unreadCommentCount: number;
    hasCommentsEnabled: boolean;
    multiple: boolean;
    alias?: string | null;
    visibility?: { [key: string]: any } | null;
    description?: string | null;
    replies: Array<{
      __typename?: "PublicPetitionFieldReply";
      id: string;
      status: PetitionFieldReplyStatus;
      content: { [key: string]: any };
      createdAt: string;
      updatedAt: string;
    }>;
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
  }>;
  signatureConfig?: {
    __typename?: "PublicSignatureConfig";
    review: boolean;
    allowAdditionalSigners: boolean;
    signers: Array<{
      __typename?: "PetitionSigner";
      fullName: string;
      firstName: string;
      lastName?: string | null;
      email: string;
    }>;
    additionalSigners: Array<{
      __typename?: "PetitionSigner";
      firstName: string;
      lastName?: string | null;
      fullName: string;
      email: string;
    }>;
  } | null;
  recipients: Array<{
    __typename?: "PublicContact";
    id: string;
    fullName: string;
    firstName: string;
    email: string;
  }>;
};

export type RecipientView_PublicPetitionFieldFragment = {
  __typename?: "PublicPetitionField";
  id: string;
  type: PetitionFieldType;
  title?: string | null;
  options: { [key: string]: any };
  optional: boolean;
  isInternal: boolean;
  isReadOnly: boolean;
  commentCount: number;
  unreadCommentCount: number;
  hasCommentsEnabled: boolean;
  multiple: boolean;
  alias?: string | null;
  description?: string | null;
  visibility?: { [key: string]: any } | null;
  replies: Array<{
    __typename?: "PublicPetitionFieldReply";
    id: string;
    status: PetitionFieldReplyStatus;
    content: { [key: string]: any };
    createdAt: string;
    updatedAt: string;
  }>;
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
};

export type RecipientView_PublicUserFragment = {
  __typename?: "PublicUser";
  id: string;
  firstName?: string | null;
  fullName: string;
  email: string;
  organization: { __typename?: "PublicOrganization"; name: string; logoUrl?: string | null };
};

export type RecipientView_publicCompletePetitionMutationVariables = Exact<{
  keycode: Scalars["ID"];
  additionalSigners?: InputMaybe<
    Array<PublicPetitionSignerDataInput> | PublicPetitionSignerDataInput
  >;
  message?: InputMaybe<Scalars["String"]>;
}>;

export type RecipientView_publicCompletePetitionMutation = {
  publicCompletePetition: {
    __typename?: "PublicPetition";
    id: string;
    status: PetitionStatus;
    deadline?: string | null;
    isRecipientViewContentsHidden: boolean;
    tone: Tone;
    signatureStatus?: PublicSignatureStatus | null;
    fields: Array<{
      __typename?: "PublicPetitionField";
      id: string;
      type: PetitionFieldType;
      title?: string | null;
      options: { [key: string]: any };
      optional: boolean;
      isInternal: boolean;
      isReadOnly: boolean;
      commentCount: number;
      unreadCommentCount: number;
      hasCommentsEnabled: boolean;
      multiple: boolean;
      alias?: string | null;
      visibility?: { [key: string]: any } | null;
      description?: string | null;
      replies: Array<{
        __typename?: "PublicPetitionFieldReply";
        id: string;
        status: PetitionFieldReplyStatus;
        content: { [key: string]: any };
        createdAt: string;
        updatedAt: string;
      }>;
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
    }>;
    signatureConfig?: {
      __typename?: "PublicSignatureConfig";
      review: boolean;
      allowAdditionalSigners: boolean;
      signers: Array<{
        __typename?: "PetitionSigner";
        fullName: string;
        firstName: string;
        lastName?: string | null;
        email: string;
      }>;
      additionalSigners: Array<{
        __typename?: "PetitionSigner";
        firstName: string;
        lastName?: string | null;
        fullName: string;
        email: string;
      }>;
    } | null;
    recipients: Array<{
      __typename?: "PublicContact";
      id: string;
      fullName: string;
      firstName: string;
      email: string;
    }>;
  };
};

export type RecipientView_accessQueryVariables = Exact<{
  keycode: Scalars["ID"];
}>;

export type RecipientView_accessQuery = {
  access?: {
    __typename?: "PublicPetitionAccess";
    petition?: {
      __typename?: "PublicPetition";
      id: string;
      status: PetitionStatus;
      deadline?: string | null;
      isRecipientViewContentsHidden: boolean;
      tone: Tone;
      signatureStatus?: PublicSignatureStatus | null;
      recipients: Array<{
        __typename?: "PublicContact";
        firstName: string;
        lastName?: string | null;
        email: string;
        id: string;
        fullName: string;
      }>;
      fields: Array<{
        __typename?: "PublicPetitionField";
        id: string;
        type: PetitionFieldType;
        title?: string | null;
        options: { [key: string]: any };
        optional: boolean;
        isInternal: boolean;
        isReadOnly: boolean;
        commentCount: number;
        unreadCommentCount: number;
        hasCommentsEnabled: boolean;
        multiple: boolean;
        alias?: string | null;
        visibility?: { [key: string]: any } | null;
        description?: string | null;
        replies: Array<{
          __typename?: "PublicPetitionFieldReply";
          id: string;
          status: PetitionFieldReplyStatus;
          content: { [key: string]: any };
          createdAt: string;
          updatedAt: string;
        }>;
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
      }>;
      signatureConfig?: {
        __typename?: "PublicSignatureConfig";
        review: boolean;
        allowAdditionalSigners: boolean;
        signers: Array<{
          __typename?: "PetitionSigner";
          fullName: string;
          firstName: string;
          lastName?: string | null;
          email: string;
        }>;
        additionalSigners: Array<{
          __typename?: "PetitionSigner";
          firstName: string;
          lastName?: string | null;
          fullName: string;
          email: string;
        }>;
      } | null;
    } | null;
    granter?: {
      __typename?: "PublicUser";
      fullName: string;
      id: string;
      firstName?: string | null;
      email: string;
      organization: { __typename?: "PublicOrganization"; name: string; logoUrl?: string | null };
    } | null;
    contact?: {
      __typename?: "PublicContact";
      id: string;
      fullName: string;
      firstName: string;
      email: string;
      lastName?: string | null;
    } | null;
    message?: { __typename?: "PublicPetitionMessage"; id: string; subject?: string | null } | null;
  } | null;
  metadata: {
    __typename?: "ConnectionMetadata";
    country?: string | null;
    browserName?: string | null;
  };
};

export type RecipientViewVerify_verifyPublicAccessMutationVariables = Exact<{
  token: Scalars["ID"];
  keycode: Scalars["ID"];
  ip?: InputMaybe<Scalars["String"]>;
  userAgent?: InputMaybe<Scalars["String"]>;
}>;

export type RecipientViewVerify_verifyPublicAccessMutation = {
  verifyPublicAccess: {
    __typename?: "PublicAccessVerification";
    isAllowed: boolean;
    cookieName?: string | null;
    cookieValue?: string | null;
    email?: string | null;
    orgName?: string | null;
    orgLogoUrl?: string | null;
    tone?: Tone | null;
  };
};

export type RecipientViewVerify_publicSendVerificationCodeMutationVariables = Exact<{
  keycode: Scalars["ID"];
}>;

export type RecipientViewVerify_publicSendVerificationCodeMutation = {
  publicSendVerificationCode: {
    __typename?: "VerificationCodeRequest";
    token: string;
    remainingAttempts: number;
    expiresAt: string;
  };
};

export type RecipientViewVerify_publicCheckVerificationCodeMutationVariables = Exact<{
  keycode: Scalars["ID"];
  token: Scalars["ID"];
  code: Scalars["String"];
}>;

export type RecipientViewVerify_publicCheckVerificationCodeMutation = {
  publicCheckVerificationCode: {
    __typename?: "VerificationCodeCheck";
    result: Result;
    remainingAttempts?: number | null;
  };
};

export type OptOut_publicOptOutRemindersMutationVariables = Exact<{
  keycode: Scalars["ID"];
  reason: Scalars["String"];
  other: Scalars["String"];
  referer?: InputMaybe<Scalars["String"]>;
}>;

export type OptOut_publicOptOutRemindersMutation = {
  publicOptOutReminders: {
    __typename?: "PublicPetitionAccess";
    petition?: { __typename?: "PublicPetition"; id: string } | null;
  };
};

export type OptOut_PublicPetitionAccessFragment = {
  __typename?: "PublicPetitionAccess";
  granter?: {
    __typename?: "PublicUser";
    id: string;
    organization: { __typename?: "PublicOrganization"; name: string; logoUrl?: string | null };
  } | null;
};

export type OptOut_PublicUserFragment = {
  __typename?: "PublicUser";
  id: string;
  organization: { __typename?: "PublicOrganization"; name: string; logoUrl?: string | null };
};

export type OptOut_accessQueryVariables = Exact<{
  keycode: Scalars["ID"];
}>;

export type OptOut_accessQuery = {
  access?: {
    __typename?: "PublicPetitionAccess";
    granter?: {
      __typename?: "PublicUser";
      id: string;
      organization: { __typename?: "PublicOrganization"; name: string; logoUrl?: string | null };
    } | null;
  } | null;
};

export type PublicPetitionLink_PublicPublicPetitionLinkFragment = {
  __typename?: "PublicPublicPetitionLink";
  title: string;
  isAvailable: boolean;
  description: string;
  owner: {
    __typename?: "PublicUser";
    fullName: string;
    email: string;
    organization: { __typename?: "PublicOrganization"; name: string; logoUrl?: string | null };
  };
};

export type PublicPetitionLink_publicCreateAndSendPetitionFromPublicLinkMutationVariables = Exact<{
  slug: Scalars["ID"];
  contactFirstName: Scalars["String"];
  contactLastName: Scalars["String"];
  contactEmail: Scalars["String"];
  force?: InputMaybe<Scalars["Boolean"]>;
}>;

export type PublicPetitionLink_publicCreateAndSendPetitionFromPublicLinkMutation = {
  publicCreateAndSendPetitionFromPublicLink: Result;
};

export type PublicPetitionLink_publicSendReminderMutationVariables = Exact<{
  slug: Scalars["ID"];
  contactEmail: Scalars["String"];
}>;

export type PublicPetitionLink_publicSendReminderMutation = { publicSendReminder: Result };

export type PublicPetitionLink_publicPetitionLinkBySlugQueryVariables = Exact<{
  slug: Scalars["ID"];
}>;

export type PublicPetitionLink_publicPetitionLinkBySlugQuery = {
  publicPetitionLinkBySlug?: {
    __typename?: "PublicPublicPetitionLink";
    title: string;
    isAvailable: boolean;
    description: string;
    owner: {
      __typename?: "PublicUser";
      fullName: string;
      email: string;
      organization: { __typename?: "PublicOrganization"; name: string; logoUrl?: string | null };
    };
  } | null;
};

export type PetitionPdf_PetitionFragment = {
  __typename?: "Petition";
  id: string;
  name?: string | null;
  fromTemplateId?: string | null;
  fields: Array<{
    __typename?: "PetitionField";
    options: { [key: string]: any };
    id: string;
    type: PetitionFieldType;
    title?: string | null;
    description?: string | null;
    showInPdf: boolean;
    multiple: boolean;
    alias?: string | null;
    visibility?: { [key: string]: any } | null;
    isInternal: boolean;
    replies: Array<{
      __typename?: "PetitionFieldReply";
      id: string;
      status: PetitionFieldReplyStatus;
      content: { [key: string]: any };
    }>;
    previewReplies: Array<{
      __typename?: "PetitionFieldReply";
      content: { [key: string]: any };
      id: string;
    }>;
  }>;
  organization: { __typename?: "Organization"; name: string; logoUrl?: string | null };
  currentSignatureRequest?: {
    __typename?: "PetitionSignatureRequest";
    signatureConfig: {
      __typename?: "SignatureConfig";
      timezone: string;
      signers: Array<{ __typename?: "PetitionSigner"; fullName: string; email: string }>;
    };
  } | null;
};

export type PetitionPdf_PetitionFieldFragment = {
  __typename?: "PetitionField";
  id: string;
  type: PetitionFieldType;
  title?: string | null;
  options: { [key: string]: any };
  description?: string | null;
  showInPdf: boolean;
  visibility?: { [key: string]: any } | null;
  isInternal: boolean;
  replies: Array<{
    __typename?: "PetitionFieldReply";
    id: string;
    status: PetitionFieldReplyStatus;
    content: { [key: string]: any };
  }>;
  previewReplies: Array<{
    __typename?: "PetitionFieldReply";
    id: string;
    content: { [key: string]: any };
  }>;
};

export type PetitionPdf_petitionQueryVariables = Exact<{
  token: Scalars["String"];
}>;

export type PetitionPdf_petitionQuery = {
  petitionAuthToken?: {
    __typename?: "Petition";
    id: string;
    name?: string | null;
    fromTemplateId?: string | null;
    fields: Array<{
      __typename?: "PetitionField";
      options: { [key: string]: any };
      id: string;
      type: PetitionFieldType;
      title?: string | null;
      description?: string | null;
      showInPdf: boolean;
      multiple: boolean;
      alias?: string | null;
      visibility?: { [key: string]: any } | null;
      isInternal: boolean;
      replies: Array<{
        __typename?: "PetitionFieldReply";
        id: string;
        status: PetitionFieldReplyStatus;
        content: { [key: string]: any };
      }>;
      previewReplies: Array<{
        __typename?: "PetitionFieldReply";
        content: { [key: string]: any };
        id: string;
      }>;
    }>;
    organization: { __typename?: "Organization"; name: string; logoUrl?: string | null };
    currentSignatureRequest?: {
      __typename?: "PetitionSignatureRequest";
      signatureConfig: {
        __typename?: "SignatureConfig";
        timezone: string;
        signers: Array<{ __typename?: "PetitionSigner"; fullName: string; email: string }>;
      };
    } | null;
  } | null;
};

export type Signup_userSignUpMutationVariables = Exact<{
  email: Scalars["String"];
  password: Scalars["String"];
  firstName: Scalars["String"];
  lastName: Scalars["String"];
  organizationName: Scalars["String"];
  locale?: InputMaybe<Scalars["String"]>;
  organizationLogo?: InputMaybe<Scalars["Upload"]>;
  industry?: InputMaybe<Scalars["String"]>;
  role?: InputMaybe<Scalars["String"]>;
  position?: InputMaybe<Scalars["String"]>;
  captcha: Scalars["String"];
}>;

export type Signup_userSignUpMutation = {
  userSignUp: {
    __typename?: "User";
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
};

export type LandingTemplateDetails_LandingTemplateFragment = {
  __typename?: "LandingTemplate";
  id: string;
  name?: string | null;
  slug: string;
  locale: PetitionLocale;
  imageUrl?: string | null;
  backgroundColor?: string | null;
  categories?: Array<string> | null;
  ownerFullName: string;
  ownerAvatarUrl?: string | null;
  organizationName: string;
  fieldCount: number;
  hasConditionals: boolean;
  descriptionHtml?: string | null;
  shortDescription?: string | null;
  updatedAt: string;
  publicLinkUrl?: string | null;
  fields: Array<{
    __typename?: "LandingTemplateField";
    id: string;
    type: PetitionFieldType;
    title?: string | null;
  }>;
};

export type LandingTemplateDetails_landingTemplateBySlugQueryVariables = Exact<{
  slug: Scalars["String"];
}>;

export type LandingTemplateDetails_landingTemplateBySlugQuery = {
  landingTemplateBySlug?: {
    __typename?: "LandingTemplate";
    id: string;
    name?: string | null;
    slug: string;
    locale: PetitionLocale;
    imageUrl?: string | null;
    backgroundColor?: string | null;
    categories?: Array<string> | null;
    ownerFullName: string;
    ownerAvatarUrl?: string | null;
    organizationName: string;
    fieldCount: number;
    hasConditionals: boolean;
    descriptionHtml?: string | null;
    shortDescription?: string | null;
    updatedAt: string;
    publicLinkUrl?: string | null;
    fields: Array<{
      __typename?: "LandingTemplateField";
      id: string;
      type: PetitionFieldType;
      title?: string | null;
    }>;
  } | null;
};

export type LandingTemplateDetails_landingTemplatesQueryVariables = Exact<{
  offset: Scalars["Int"];
  limit: Scalars["Int"];
  locale: PetitionLocale;
  categories?: InputMaybe<Array<Scalars["String"]> | Scalars["String"]>;
}>;

export type LandingTemplateDetails_landingTemplatesQuery = {
  landingTemplates: {
    __typename?: "LandingTemplatePagination";
    totalCount: number;
    items: Array<{
      __typename?: "LandingTemplate";
      id: string;
      locale: PetitionLocale;
      name?: string | null;
      slug: string;
      imageUrl?: string | null;
      backgroundColor?: string | null;
      ownerFullName: string;
      organizationName: string;
    }>;
  };
};

export type LandintTemplatesCategory_LandingTemplateCategorySampleFragment = {
  __typename?: "LandingTemplateCategorySample";
  category: string;
  templates: { __typename?: "LandingTemplatePagination"; totalCount: number };
};

export type LandingTemplatesCategory_landingTemplatesQueryVariables = Exact<{
  offset: Scalars["Int"];
  limit: Scalars["Int"];
  category: Scalars["String"];
  locale: PetitionLocale;
}>;

export type LandingTemplatesCategory_landingTemplatesQuery = {
  landingTemplates: {
    __typename?: "LandingTemplatePagination";
    totalCount: number;
    items: Array<{
      __typename?: "LandingTemplate";
      id: string;
      locale: PetitionLocale;
      name?: string | null;
      slug: string;
      imageUrl?: string | null;
      backgroundColor?: string | null;
      ownerFullName: string;
      organizationName: string;
    }>;
  };
};

export type LandingTemplatesCategory_categorySamplesQueryVariables = Exact<{
  locale: PetitionLocale;
}>;

export type LandingTemplatesCategory_categorySamplesQuery = {
  landingTemplateCategorySamples: Array<{
    __typename?: "LandingTemplateCategorySample";
    category: string;
    templates: { __typename?: "LandingTemplatePagination"; totalCount: number };
  }>;
};

export type LandingTemplates_categorySamplesQueryVariables = Exact<{
  offset: Scalars["Int"];
  limit: Scalars["Int"];
  locale: PetitionLocale;
}>;

export type LandingTemplates_categorySamplesQuery = {
  landingTemplateCategorySamples: Array<{
    __typename?: "LandingTemplateCategorySample";
    category: string;
    templates: {
      __typename?: "LandingTemplatePagination";
      totalCount: number;
      items: Array<{
        __typename?: "LandingTemplate";
        id: string;
        locale: PetitionLocale;
        name?: string | null;
        slug: string;
        imageUrl?: string | null;
        backgroundColor?: string | null;
        ownerFullName: string;
        organizationName: string;
      }>;
    };
  }>;
};

export type Thanks_petitionLogoQueryVariables = Exact<{
  id: Scalars["GID"];
}>;

export type Thanks_petitionLogoQuery = { publicOrgLogoUrl?: string | null };

export type GetMyIdQueryVariables = Exact<{ [key: string]: never }>;

export type GetMyIdQuery = { me: { __typename?: "User"; id: string } };

export type useFieldVisibility_PublicPetitionFieldFragment = {
  __typename?: "PublicPetitionField";
  id: string;
  type: PetitionFieldType;
  options: { [key: string]: any };
  visibility?: { [key: string]: any } | null;
  isInternal: boolean;
  replies: Array<{
    __typename?: "PublicPetitionFieldReply";
    id: string;
    content: { [key: string]: any };
  }>;
};

export type useFieldVisibility_PetitionFieldFragment = {
  __typename?: "PetitionField";
  id: string;
  type: PetitionFieldType;
  options: { [key: string]: any };
  visibility?: { [key: string]: any } | null;
  replies: Array<{
    __typename?: "PetitionFieldReply";
    id: string;
    content: { [key: string]: any };
  }>;
  previewReplies: Array<{
    __typename?: "PetitionFieldReply";
    id: string;
    content: { [key: string]: any };
  }>;
};

export type filterPetitionFields_PetitionFieldFragment = {
  __typename?: "PetitionField";
  id: string;
  isReadOnly: boolean;
  comments: Array<{ __typename?: "PetitionFieldComment"; id: string }>;
  replies: Array<{
    __typename?: "PetitionFieldReply";
    id: string;
    status: PetitionFieldReplyStatus;
  }>;
};

export type getPetitionSignatureEnvironment_PetitionFragment = {
  __typename?: "Petition";
  currentSignatureRequest?: {
    __typename?: "PetitionSignatureRequest";
    environment: SignatureOrgIntegrationEnvironment;
  } | null;
  signatureConfig?: {
    __typename?: "SignatureConfig";
    integration?: {
      __typename?: "SignatureOrgIntegration";
      environment: SignatureOrgIntegrationEnvironment;
    } | null;
  } | null;
};

export type getPetitionSignatureStatus_PetitionFragment = {
  __typename?: "Petition";
  status: PetitionStatus;
  currentSignatureRequest?: {
    __typename?: "PetitionSignatureRequest";
    status: PetitionSignatureRequestStatus;
  } | null;
  signatureConfig?: { __typename?: "SignatureConfig"; review: boolean } | null;
};

export type groupFieldsByPages_PublicPetitionFieldFragment = {
  __typename?: "PublicPetitionField";
  id: string;
  type: PetitionFieldType;
  visibility?: { [key: string]: any } | null;
  options: { [key: string]: any };
  isInternal: boolean;
};

export type groupFieldsByPages_PetitionFieldFragment = {
  __typename?: "PetitionField";
  id: string;
  type: PetitionFieldType;
  visibility?: { [key: string]: any } | null;
  options: { [key: string]: any };
  isInternal: boolean;
  showInPdf: boolean;
};

export type isUsageLimitsReached_OrganizationFragment = {
  __typename?: "Organization";
  usageLimits: {
    __typename?: "OrganizationUsageLimit";
    petitions: { __typename?: "OrganizationUsagePetitionLimit"; used: number; limit: number };
  };
};

export type useClonePetitions_clonePetitionsMutationVariables = Exact<{
  petitionIds: Array<Scalars["GID"]> | Scalars["GID"];
}>;

export type useClonePetitions_clonePetitionsMutation = {
  clonePetitions: Array<
    { __typename?: "Petition"; id: string } | { __typename?: "PetitionTemplate"; id: string }
  >;
};

export type useCreateContact_createContactMutationVariables = Exact<{
  data: CreateContactInput;
}>;

export type useCreateContact_createContactMutation = {
  createContact: {
    __typename?: "Contact";
    id: string;
    email: string;
    firstName: string;
    lastName?: string | null;
    fullName: string;
    hasBouncedEmail: boolean;
  };
};

export type useCreatePetition_createPetitionMutationVariables = Exact<{
  name?: InputMaybe<Scalars["String"]>;
  locale: PetitionLocale;
  petitionId?: InputMaybe<Scalars["GID"]>;
  type?: InputMaybe<PetitionBaseType>;
}>;

export type useCreatePetition_createPetitionMutation = {
  createPetition:
    | { __typename?: "Petition"; id: string }
    | { __typename?: "PetitionTemplate"; id: string };
};

export type useDeleteContacts_deleteContactsMutationVariables = Exact<{
  ids: Array<Scalars["GID"]> | Scalars["GID"];
  force?: InputMaybe<Scalars["Boolean"]>;
}>;

export type useDeleteContacts_deleteContactsMutation = { deleteContacts: Result };

export type useDeleteContacts_ContactFragment = {
  __typename?: "Contact";
  id: string;
  fullName: string;
  email: string;
};

export type ConfirmDeletePetitionsDialog_PetitionBase_Petition_Fragment = {
  __typename?: "Petition";
  id: string;
  name?: string | null;
};

export type ConfirmDeletePetitionsDialog_PetitionBase_PetitionTemplate_Fragment = {
  __typename?: "PetitionTemplate";
  id: string;
  name?: string | null;
};

export type ConfirmDeletePetitionsDialog_PetitionBaseFragment =
  | ConfirmDeletePetitionsDialog_PetitionBase_Petition_Fragment
  | ConfirmDeletePetitionsDialog_PetitionBase_PetitionTemplate_Fragment;

export type useDeletePetitions_deletePetitionsMutationVariables = Exact<{
  ids: Array<Scalars["GID"]> | Scalars["GID"];
}>;

export type useDeletePetitions_deletePetitionsMutation = { deletePetitions: Result };

export type useUpdateIsReadNotification_UserFragment = {
  __typename?: "User";
  id: string;
  unreadNotificationIds: Array<string>;
};

export type useUpdateIsReadNotification_PetitionFieldCommentFragment = {
  __typename?: "PetitionFieldComment";
  id: string;
  isUnread: boolean;
};

export type useUpdateIsReadNotification_updatePetitionUserNotificationReadStatusMutationVariables =
  Exact<{
    petitionUserNotificationIds?: InputMaybe<Array<Scalars["GID"]> | Scalars["GID"]>;
    filter?: InputMaybe<PetitionUserNotificationFilter>;
    petitionIds?: InputMaybe<Array<Scalars["GID"]> | Scalars["GID"]>;
    petitionFieldCommentIds?: InputMaybe<Array<Scalars["GID"]> | Scalars["GID"]>;
    isRead: Scalars["Boolean"];
  }>;

export type useUpdateIsReadNotification_updatePetitionUserNotificationReadStatusMutation = {
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

export type isAdmin_UserFragment = { __typename?: "User"; role: OrganizationRole };

export type uploadFile_AWSPresignedPostDataFragment = {
  __typename?: "AWSPresignedPostData";
  url: string;
  fields: { [key: string]: any };
};

export type useExportRepliesTask_taskQueryVariables = Exact<{
  id: Scalars["GID"];
}>;

export type useExportRepliesTask_taskQuery = {
  task: { __typename?: "Task"; id: string; status: TaskStatus; progress?: number | null };
};

export type useExportRepliesTask_createExportRepliesTaskMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  pattern?: InputMaybe<Scalars["String"]>;
}>;

export type useExportRepliesTask_createExportRepliesTaskMutation = {
  createExportRepliesTask: {
    __typename?: "Task";
    id: string;
    status: TaskStatus;
    progress?: number | null;
  };
};

export type useExportRepliesTask_getTaskResultFileUrlMutationVariables = Exact<{
  taskId: Scalars["GID"];
}>;

export type useExportRepliesTask_getTaskResultFileUrlMutation = { getTaskResultFileUrl: string };

export type useFilenamePlaceholdersRename_PetitionFieldFragment = {
  __typename?: "PetitionField";
  id: string;
  type: PetitionFieldType;
  title?: string | null;
};

export type useFilenamePlaceholdersRename_PetitionFieldReplyFragment = {
  __typename?: "PetitionFieldReply";
  content: { [key: string]: any };
};

export type useGetPageFields_PublicPetitionFieldFragment = {
  __typename?: "PublicPetitionField";
  id: string;
  type: PetitionFieldType;
  visibility?: { [key: string]: any } | null;
  options: { [key: string]: any };
  isInternal: boolean;
  replies: Array<{
    __typename?: "PublicPetitionFieldReply";
    id: string;
    content: { [key: string]: any };
  }>;
};

export type useGetPageFields_PetitionFieldFragment = {
  __typename?: "PetitionField";
  id: string;
  type: PetitionFieldType;
  visibility?: { [key: string]: any } | null;
  options: { [key: string]: any };
  isInternal: boolean;
  showInPdf: boolean;
  replies: Array<{
    __typename?: "PetitionFieldReply";
    id: string;
    content: { [key: string]: any };
  }>;
  previewReplies: Array<{
    __typename?: "PetitionFieldReply";
    id: string;
    content: { [key: string]: any };
  }>;
};

export type useLiquidScope_PetitionFieldFragment = {
  __typename?: "PetitionField";
  type: PetitionFieldType;
  multiple: boolean;
  alias?: string | null;
  previewReplies: Array<{ __typename?: "PetitionFieldReply"; content: { [key: string]: any } }>;
  replies: Array<{ __typename?: "PetitionFieldReply"; content: { [key: string]: any } }>;
};

export type useLiquidScope_PublicPetitionFieldFragment = {
  __typename?: "PublicPetitionField";
  type: PetitionFieldType;
  multiple: boolean;
  alias?: string | null;
  replies: Array<{ __typename?: "PublicPetitionFieldReply"; content: { [key: string]: any } }>;
};

export type PetitionSignaturesCardPolling_petitionQueryVariables = Exact<{
  petitionId: Scalars["GID"];
}>;

export type PetitionSignaturesCardPolling_petitionQuery = {
  petition?:
    | {
        __typename?: "Petition";
        id: string;
        status: PetitionStatus;
        name?: string | null;
        signatureRequests: Array<{
          __typename?: "PetitionSignatureRequest";
          id: string;
          status: PetitionSignatureRequestStatus;
          signerStatus: Array<{
            __typename?: "PetitionSignatureRequestSignerStatus";
            status: string;
            sentAt?: string | null;
            openedAt?: string | null;
            signedAt?: string | null;
            declinedAt?: string | null;
            signer: { __typename?: "PetitionSigner"; email: string; fullName: string };
          }>;
          signatureConfig: {
            __typename?: "SignatureConfig";
            signers: Array<{ __typename?: "PetitionSigner"; email: string; fullName: string }>;
          };
        }>;
        accesses: Array<{
          __typename?: "PetitionAccess";
          status: PetitionAccessStatus;
          id: string;
          contact?: {
            __typename?: "Contact";
            id: string;
            firstName: string;
            lastName?: string | null;
            email: string;
          } | null;
        }>;
        signatureConfig?: {
          __typename?: "SignatureConfig";
          title: string;
          review: boolean;
          allowAdditionalSigners: boolean;
          timezone: string;
          integration?: {
            __typename?: "SignatureOrgIntegration";
            id: string;
            name: string;
            provider: SignatureOrgIntegrationProvider;
            environment: SignatureOrgIntegrationEnvironment;
            isDefault: boolean;
          } | null;
          signers: Array<{
            __typename?: "PetitionSigner";
            contactId?: string | null;
            firstName: string;
            lastName?: string | null;
            email: string;
            fullName: string;
          }>;
        } | null;
        currentSignatureRequest?: {
          __typename?: "PetitionSignatureRequest";
          environment: SignatureOrgIntegrationEnvironment;
        } | null;
      }
    | { __typename?: "PetitionTemplate" }
    | null;
};

export type usePetitionsTableColumns_PetitionBase_Petition_Fragment = {
  __typename?: "Petition";
  sentAt?: string | null;
  id: string;
  name?: string | null;
  createdAt: string;
  status: PetitionStatus;
  isRestricted: boolean;
  accesses: Array<{
    __typename?: "PetitionAccess";
    status: PetitionAccessStatus;
    nextReminderAt?: string | null;
    contact?: { __typename?: "Contact"; id: string; fullName: string; email: string } | null;
    reminders: Array<{ __typename?: "PetitionReminder"; createdAt: string }>;
  }>;
  permissions: Array<
    | {
        __typename?: "PetitionUserGroupPermission";
        permissionType: PetitionPermissionType;
        group: { __typename?: "UserGroup"; id: string; name: string; initials: string };
      }
    | {
        __typename?: "PetitionUserPermission";
        permissionType: PetitionPermissionType;
        user: {
          __typename?: "User";
          id: string;
          fullName?: string | null;
          avatarUrl?: string | null;
          initials?: string | null;
        };
      }
  >;
  progress: {
    __typename?: "PetitionProgress";
    external: {
      __typename?: "PetitionFieldProgress";
      validated: number;
      replied: number;
      optional: number;
      total: number;
    };
    internal: {
      __typename?: "PetitionFieldProgress";
      validated: number;
      replied: number;
      optional: number;
      total: number;
    };
  };
  tags: Array<{ __typename?: "Tag"; id: string; name: string; color: string }>;
  currentSignatureRequest?: {
    __typename?: "PetitionSignatureRequest";
    status: PetitionSignatureRequestStatus;
    environment: SignatureOrgIntegrationEnvironment;
  } | null;
  signatureConfig?: {
    __typename?: "SignatureConfig";
    review: boolean;
    integration?: {
      __typename?: "SignatureOrgIntegration";
      environment: SignatureOrgIntegrationEnvironment;
    } | null;
  } | null;
};

export type usePetitionsTableColumns_PetitionBase_PetitionTemplate_Fragment = {
  __typename?: "PetitionTemplate";
  descriptionExcerpt?: string | null;
  id: string;
  name?: string | null;
  createdAt: string;
  isRestricted: boolean;
  permissions: Array<
    | {
        __typename?: "PetitionUserGroupPermission";
        permissionType: PetitionPermissionType;
        group: { __typename?: "UserGroup"; id: string; name: string; initials: string };
      }
    | {
        __typename?: "PetitionUserPermission";
        permissionType: PetitionPermissionType;
        user: {
          __typename?: "User";
          id: string;
          fullName?: string | null;
          avatarUrl?: string | null;
          initials?: string | null;
        };
      }
  >;
  tags: Array<{ __typename?: "Tag"; id: string; name: string; color: string }>;
};

export type usePetitionsTableColumns_PetitionBaseFragment =
  | usePetitionsTableColumns_PetitionBase_Petition_Fragment
  | usePetitionsTableColumns_PetitionBase_PetitionTemplate_Fragment;

export type usePrintPdfTask_createPrintPdfTaskMutationVariables = Exact<{
  petitionId: Scalars["GID"];
}>;

export type usePrintPdfTask_createPrintPdfTaskMutation = {
  createPrintPdfTask: {
    __typename?: "Task";
    id: string;
    status: TaskStatus;
    progress?: number | null;
  };
};

export type usePrintPdfTask_getTaskResultFileUrlMutationVariables = Exact<{
  taskId: Scalars["GID"];
}>;

export type usePrintPdfTask_getTaskResultFileUrlMutation = { getTaskResultFileUrl: string };

export type usePrintPdfTask_taskQueryVariables = Exact<{
  id: Scalars["GID"];
}>;

export type usePrintPdfTask_taskQuery = {
  task: { __typename?: "Task"; id: string; status: TaskStatus; progress?: number | null };
};

export type usePublicPrintPdfTask_publicCreatePrintPdfTaskMutationVariables = Exact<{
  keycode: Scalars["ID"];
}>;

export type usePublicPrintPdfTask_publicCreatePrintPdfTaskMutation = {
  publicCreatePrintPdfTask: {
    __typename?: "Task";
    id: string;
    status: TaskStatus;
    progress?: number | null;
  };
};

export type usePublicPrintPdfTask_publicGetTaskResultFileUrlMutationVariables = Exact<{
  taskId: Scalars["GID"];
  keycode: Scalars["ID"];
}>;

export type usePublicPrintPdfTask_publicGetTaskResultFileUrlMutation = {
  publicGetTaskResultFileUrl: string;
};

export type usePublicPrintPdfTask_publicTaskQueryVariables = Exact<{
  taskId: Scalars["GID"];
  keycode: Scalars["ID"];
}>;

export type usePublicPrintPdfTask_publicTaskQuery = {
  task: { __typename?: "Task"; id: string; status: TaskStatus; progress?: number | null };
};

export type useSearchContacts_contactsQueryVariables = Exact<{
  search?: InputMaybe<Scalars["String"]>;
  exclude?: InputMaybe<Array<Scalars["GID"]> | Scalars["GID"]>;
}>;

export type useSearchContacts_contactsQuery = {
  contacts: {
    __typename?: "ContactPagination";
    items: Array<{
      __typename?: "Contact";
      id: string;
      firstName: string;
      lastName?: string | null;
      fullName: string;
      email: string;
      hasBouncedEmail: boolean;
    }>;
  };
};

export type useSearchContactsByEmail_contactsByEmailQueryVariables = Exact<{
  emails: Array<Scalars["String"]> | Scalars["String"];
}>;

export type useSearchContactsByEmail_contactsByEmailQuery = {
  contactsByEmail: Array<{
    __typename?: "Contact";
    id: string;
    firstName: string;
    lastName?: string | null;
    fullName: string;
    email: string;
    hasBouncedEmail: boolean;
  } | null>;
};

export type useSettingsSections_UserFragment = { __typename?: "User"; hasDeveloperAccess: boolean };

export type validatePetitionFields_PetitionFieldFragment = {
  __typename?: "PetitionField";
  id: string;
  title?: string | null;
  type: PetitionFieldType;
  options: { [key: string]: any };
};

export const UserAvatar_UserFragmentDoc = gql`
  fragment UserAvatar_User on User {
    fullName
    avatarUrl
    initials
  }
` as unknown as DocumentNode<UserAvatar_UserFragment, unknown>;
export const AlreadyLoggedIn_UserFragmentDoc = gql`
  fragment AlreadyLoggedIn_User on User {
    email
    fullName
    ...UserAvatar_User
  }
  ${UserAvatar_UserFragmentDoc}
` as unknown as DocumentNode<AlreadyLoggedIn_UserFragment, unknown>;
export const ContactListPopover_ContactFragmentDoc = gql`
  fragment ContactListPopover_Contact on Contact {
    id
    email
    fullName
  }
` as unknown as DocumentNode<ContactListPopover_ContactFragment, unknown>;
export const ContactListPopover_PublicContactFragmentDoc = gql`
  fragment ContactListPopover_PublicContact on PublicContact {
    id
    email
    fullName
  }
` as unknown as DocumentNode<ContactListPopover_PublicContactFragment, unknown>;
export const ContactListPopover_PetitionSignerFragmentDoc = gql`
  fragment ContactListPopover_PetitionSigner on PetitionSigner {
    email
    fullName
  }
` as unknown as DocumentNode<ContactListPopover_PetitionSignerFragment, unknown>;
export const ContactSelect_ContactFragmentDoc = gql`
  fragment ContactSelect_Contact on Contact {
    id
    firstName
    lastName
    fullName
    email
    hasBouncedEmail
  }
` as unknown as DocumentNode<ContactSelect_ContactFragment, unknown>;
export const FieldComment_PublicPetitionFieldCommentFragmentDoc = gql`
  fragment FieldComment_PublicPetitionFieldComment on PublicPetitionFieldComment {
    id
    content
    createdAt
    isUnread
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
  }
` as unknown as DocumentNode<FieldComment_PublicPetitionFieldCommentFragment, unknown>;
export const UserListPopover_UserGroupFragmentDoc = gql`
  fragment UserListPopover_UserGroup on UserGroup {
    id
    name
    initials
  }
` as unknown as DocumentNode<UserListPopover_UserGroupFragment, unknown>;
export const Tag_TagFragmentDoc = gql`
  fragment Tag_Tag on Tag {
    name
    color
  }
` as unknown as DocumentNode<Tag_TagFragment, unknown>;
export const TagEditDialog_TagFragmentDoc = gql`
  fragment TagEditDialog_Tag on Tag {
    id
    ...Tag_Tag
    createdAt
  }
  ${Tag_TagFragmentDoc}
` as unknown as DocumentNode<TagEditDialog_TagFragment, unknown>;
export const TaskProgressDialog_TaskFragmentDoc = gql`
  fragment TaskProgressDialog_Task on Task {
    id
    status
    progress
  }
` as unknown as DocumentNode<TaskProgressDialog_TaskFragment, unknown>;
export const PetitionTemplateHeader_UserFragmentDoc = gql`
  fragment PetitionTemplateHeader_User on User {
    id
    role
    hasPetitionPdfExport: hasFeatureFlag(featureFlag: PETITION_PDF_EXPORT)
  }
` as unknown as DocumentNode<PetitionTemplateHeader_UserFragment, unknown>;
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
` as unknown as DocumentNode<PetitionUserNotification_PetitionUserNotificationFragment, unknown>;
export const UserReference_UserFragmentDoc = gql`
  fragment UserReference_User on User {
    id
    fullName
    status
  }
` as unknown as DocumentNode<UserReference_UserFragment, unknown>;
export const ContactReference_ContactFragmentDoc = gql`
  fragment ContactReference_Contact on Contact {
    id
    fullName
    email
  }
` as unknown as DocumentNode<ContactReference_ContactFragment, unknown>;
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
            ...ContactReference_Contact
          }
        }
      }
    }
  }
  ${PetitionUserNotification_PetitionUserNotificationFragmentDoc}
  ${UserReference_UserFragmentDoc}
  ${ContactReference_ContactFragmentDoc}
` as unknown as DocumentNode<
  CommentCreatedUserNotification_CommentCreatedUserNotificationFragment,
  unknown
>;
export const MessageEmailBouncedUserNotification_MessageEmailBouncedUserNotificationFragmentDoc =
  gql`
    fragment MessageEmailBouncedUserNotification_MessageEmailBouncedUserNotification on MessageEmailBouncedUserNotification {
      ...PetitionUserNotification_PetitionUserNotification
      access {
        contact {
          ...ContactReference_Contact
        }
      }
    }
    ${PetitionUserNotification_PetitionUserNotificationFragmentDoc}
    ${ContactReference_ContactFragmentDoc}
  ` as unknown as DocumentNode<
    MessageEmailBouncedUserNotification_MessageEmailBouncedUserNotificationFragment,
    unknown
  >;
export const ReminderEmailBouncedUserNotification_ReminderEmailBouncedUserNotificationFragmentDoc =
  gql`
    fragment ReminderEmailBouncedUserNotification_ReminderEmailBouncedUserNotification on ReminderEmailBouncedUserNotification {
      ...PetitionUserNotification_PetitionUserNotification
      access {
        contact {
          ...ContactReference_Contact
        }
      }
    }
    ${PetitionUserNotification_PetitionUserNotificationFragmentDoc}
    ${ContactReference_ContactFragmentDoc}
  ` as unknown as DocumentNode<
    ReminderEmailBouncedUserNotification_ReminderEmailBouncedUserNotificationFragment,
    unknown
  >;
export const UserOrContactReference_UserOrPetitionAccessFragmentDoc = gql`
  fragment UserOrContactReference_UserOrPetitionAccess on UserOrPetitionAccess {
    ... on User {
      ...UserReference_User
    }
    ... on PetitionAccess {
      contact {
        ...ContactReference_Contact
      }
    }
  }
  ${UserReference_UserFragmentDoc}
  ${ContactReference_ContactFragmentDoc}
` as unknown as DocumentNode<UserOrContactReference_UserOrPetitionAccessFragment, unknown>;
export const PetitionCompletedUserNotification_PetitionCompletedUserNotificationFragmentDoc = gql`
  fragment PetitionCompletedUserNotification_PetitionCompletedUserNotification on PetitionCompletedUserNotification {
    ...PetitionUserNotification_PetitionUserNotification
    completedBy {
      ...UserOrContactReference_UserOrPetitionAccess
    }
  }
  ${PetitionUserNotification_PetitionUserNotificationFragmentDoc}
  ${UserOrContactReference_UserOrPetitionAccessFragmentDoc}
` as unknown as DocumentNode<
  PetitionCompletedUserNotification_PetitionCompletedUserNotificationFragment,
  unknown
>;
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
  ${UserReference_UserFragmentDoc}
` as unknown as DocumentNode<
  PetitionSharedUserNotification_PetitionSharedUserNotificationFragment,
  unknown
>;
export const SignatureCancelledUserNotification_SignatureCancelledUserNotificationFragmentDoc = gql`
  fragment SignatureCancelledUserNotification_SignatureCancelledUserNotification on SignatureCancelledUserNotification {
    errorCode
    extraErrorData
    ...PetitionUserNotification_PetitionUserNotification
  }
  ${PetitionUserNotification_PetitionUserNotificationFragmentDoc}
` as unknown as DocumentNode<
  SignatureCancelledUserNotification_SignatureCancelledUserNotificationFragment,
  unknown
>;
export const SignatureCompletedUserNotification_SignatureCompletedUserNotificationFragmentDoc = gql`
  fragment SignatureCompletedUserNotification_SignatureCompletedUserNotification on SignatureCompletedUserNotification {
    ...PetitionUserNotification_PetitionUserNotification
  }
  ${PetitionUserNotification_PetitionUserNotificationFragmentDoc}
` as unknown as DocumentNode<
  SignatureCompletedUserNotification_SignatureCompletedUserNotificationFragment,
  unknown
>;
export const RemindersOptOutNotification_RemindersOptOutNotificationFragmentDoc = gql`
  fragment RemindersOptOutNotification_RemindersOptOutNotification on RemindersOptOutNotification {
    ...PetitionUserNotification_PetitionUserNotification
    access {
      contact {
        ...ContactReference_Contact
      }
    }
    reason
    other
  }
  ${PetitionUserNotification_PetitionUserNotificationFragmentDoc}
  ${ContactReference_ContactFragmentDoc}
` as unknown as DocumentNode<
  RemindersOptOutNotification_RemindersOptOutNotificationFragment,
  unknown
>;
export const AccessActivatedFromLinkNotification_AccessActivatedFromPublicPetitionLinkUserNotificationFragmentDoc =
  gql`
    fragment AccessActivatedFromLinkNotification_AccessActivatedFromPublicPetitionLinkUserNotification on AccessActivatedFromPublicPetitionLinkUserNotification {
      ...PetitionUserNotification_PetitionUserNotification
      access {
        contact {
          ...ContactReference_Contact
        }
      }
    }
    ${PetitionUserNotification_PetitionUserNotificationFragmentDoc}
    ${ContactReference_ContactFragmentDoc}
  ` as unknown as DocumentNode<
    AccessActivatedFromLinkNotification_AccessActivatedFromPublicPetitionLinkUserNotificationFragment,
    unknown
  >;
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
` as unknown as DocumentNode<NotificationsList_PetitionUserNotificationFragment, unknown>;
export const NotificationsDrawer_PetitionUserNotificationFragmentDoc = gql`
  fragment NotificationsDrawer_PetitionUserNotification on PetitionUserNotification {
    ...NotificationsList_PetitionUserNotification
  }
  ${NotificationsList_PetitionUserNotificationFragmentDoc}
` as unknown as DocumentNode<NotificationsDrawer_PetitionUserNotificationFragment, unknown>;
export const OrganizationGroupListTableHeader_UserFragmentDoc = gql`
  fragment OrganizationGroupListTableHeader_User on User {
    id
    role
  }
` as unknown as DocumentNode<OrganizationGroupListTableHeader_UserFragment, unknown>;
export const OrganizationGroupsListTableHeader_UserFragmentDoc = gql`
  fragment OrganizationGroupsListTableHeader_User on User {
    id
    role
  }
` as unknown as DocumentNode<OrganizationGroupsListTableHeader_UserFragment, unknown>;
export const OrganizationUsersListTableHeader_UserFragmentDoc = gql`
  fragment OrganizationUsersListTableHeader_User on User {
    id
    role
  }
` as unknown as DocumentNode<OrganizationUsersListTableHeader_UserFragment, unknown>;
export const UserSelect_UserFragmentDoc = gql`
  fragment UserSelect_User on User {
    id
    fullName
    email
  }
` as unknown as DocumentNode<UserSelect_UserFragment, unknown>;
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
  ${UserSelect_UserFragmentDoc}
` as unknown as DocumentNode<UserSelect_UserGroupFragment, unknown>;
export const useCreateOrUpdateUserDialog_UserGroupFragmentDoc = gql`
  fragment useCreateOrUpdateUserDialog_UserGroup on UserGroup {
    id
    ...UserSelect_UserGroup
  }
  ${UserSelect_UserGroupFragmentDoc}
` as unknown as DocumentNode<useCreateOrUpdateUserDialog_UserGroupFragment, unknown>;
export const useCreateOrUpdateUserDialog_UserFragmentDoc = gql`
  fragment useCreateOrUpdateUserDialog_User on User {
    id
    firstName
    lastName
    email
    role
    userGroups {
      ...useCreateOrUpdateUserDialog_UserGroup
    }
  }
  ${useCreateOrUpdateUserDialog_UserGroupFragmentDoc}
` as unknown as DocumentNode<useCreateOrUpdateUserDialog_UserFragment, unknown>;
export const PetitionSharingModal_UserFragmentDoc = gql`
  fragment PetitionSharingModal_User on User {
    id
    email
    fullName
    ...UserAvatar_User
    ...UserSelect_User
  }
  ${UserAvatar_UserFragmentDoc}
  ${UserSelect_UserFragmentDoc}
` as unknown as DocumentNode<PetitionSharingModal_UserFragment, unknown>;
export const PetitionSharingModal_PetitionUserPermissionFragmentDoc = gql`
  fragment PetitionSharingModal_PetitionUserPermission on PetitionUserPermission {
    permissionType
    user {
      ...PetitionSharingModal_User
    }
  }
  ${PetitionSharingModal_UserFragmentDoc}
` as unknown as DocumentNode<PetitionSharingModal_PetitionUserPermissionFragment, unknown>;
export const PetitionSharingModal_UserGroupFragmentDoc = gql`
  fragment PetitionSharingModal_UserGroup on UserGroup {
    id
    name
    initials
    members {
      user {
        ...PetitionSharingModal_User
      }
    }
  }
  ${PetitionSharingModal_UserFragmentDoc}
` as unknown as DocumentNode<PetitionSharingModal_UserGroupFragment, unknown>;
export const PetitionSharingModal_PetitionUserGroupPermissionFragmentDoc = gql`
  fragment PetitionSharingModal_PetitionUserGroupPermission on PetitionUserGroupPermission {
    permissionType
    group {
      ...PetitionSharingModal_UserGroup
    }
  }
  ${PetitionSharingModal_UserGroupFragmentDoc}
` as unknown as DocumentNode<PetitionSharingModal_PetitionUserGroupPermissionFragment, unknown>;
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
  ${PetitionSharingModal_PetitionUserGroupPermissionFragmentDoc}
` as unknown as DocumentNode<PetitionSharingModal_PetitionFragment, unknown>;
export const UserListPopover_UserFragmentDoc = gql`
  fragment UserListPopover_User on User {
    id
    fullName
    ...UserAvatar_User
  }
  ${UserAvatar_UserFragmentDoc}
` as unknown as DocumentNode<UserListPopover_UserFragment, unknown>;
export const UserAvatarList_UserFragmentDoc = gql`
  fragment UserAvatarList_User on User {
    id
    fullName
    ...UserAvatar_User
    ...UserListPopover_User
  }
  ${UserAvatar_UserFragmentDoc}
  ${UserListPopover_UserFragmentDoc}
` as unknown as DocumentNode<UserAvatarList_UserFragment, unknown>;
export const UserAvatarList_UserGroupFragmentDoc = gql`
  fragment UserAvatarList_UserGroup on UserGroup {
    id
    name
    initials
  }
` as unknown as DocumentNode<UserAvatarList_UserGroupFragment, unknown>;
export const TemplateActiveSettingsIcons_PetitionTemplateFragmentDoc = gql`
  fragment TemplateActiveSettingsIcons_PetitionTemplate on PetitionTemplate {
    id
    locale
    isRestricted
    publicLink {
      id
      isActive
    }
    signatureConfig {
      title
    }
    remindersConfig {
      time
    }
  }
` as unknown as DocumentNode<TemplateActiveSettingsIcons_PetitionTemplateFragment, unknown>;
export const TemplateDetailsModal_PetitionTemplateFragmentDoc = gql`
  fragment TemplateDetailsModal_PetitionTemplate on PetitionTemplate {
    id
    descriptionHtml
    name
    isPublic
    permissions {
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
      fullName
    }
    myEffectivePermission {
      permissionType
    }
    publicLink {
      id
      isActive
      slug
      url
    }
    ...TemplateActiveSettingsIcons_PetitionTemplate
    updatedAt
  }
  ${UserAvatarList_UserFragmentDoc}
  ${UserAvatarList_UserGroupFragmentDoc}
  ${TemplateActiveSettingsIcons_PetitionTemplateFragmentDoc}
` as unknown as DocumentNode<TemplateDetailsModal_PetitionTemplateFragment, unknown>;
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
` as unknown as DocumentNode<
  PetitionComposeFieldAttachment_PetitionFieldAttachmentFragment,
  unknown
>;
export const PetitionComposeField_PetitionFieldAttachmentFragmentDoc = gql`
  fragment PetitionComposeField_PetitionFieldAttachment on PetitionFieldAttachment {
    ...PetitionComposeFieldAttachment_PetitionFieldAttachment
  }
  ${PetitionComposeFieldAttachment_PetitionFieldAttachmentFragmentDoc}
` as unknown as DocumentNode<PetitionComposeField_PetitionFieldAttachmentFragment, unknown>;
export const PetitionFieldOptionsListEditor_PetitionFieldFragmentDoc = gql`
  fragment PetitionFieldOptionsListEditor_PetitionField on PetitionField {
    id
    type
    optional
    options
  }
` as unknown as DocumentNode<PetitionFieldOptionsListEditor_PetitionFieldFragment, unknown>;
export const PetitionFieldSelect_PetitionFieldFragmentDoc = gql`
  fragment PetitionFieldSelect_PetitionField on PetitionField {
    id
    type
    title
    options
  }
` as unknown as DocumentNode<PetitionFieldSelect_PetitionFieldFragment, unknown>;
export const PetitionFieldVisibilityEditor_PetitionFieldFragmentDoc = gql`
  fragment PetitionFieldVisibilityEditor_PetitionField on PetitionField {
    id
    type
    multiple
    options
    isReadOnly
    ...PetitionFieldSelect_PetitionField
  }
  ${PetitionFieldSelect_PetitionFieldFragmentDoc}
` as unknown as DocumentNode<PetitionFieldVisibilityEditor_PetitionFieldFragment, unknown>;
export const PetitionComposeField_PetitionFieldFragmentDoc = gql`
  fragment PetitionComposeField_PetitionField on PetitionField {
    id
    type
    title
    description
    optional
    multiple
    isFixed
    isInternal
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
  ${PetitionFieldVisibilityEditor_PetitionFieldFragmentDoc}
` as unknown as DocumentNode<PetitionComposeField_PetitionFieldFragment, unknown>;
export const FieldErrorDialog_PetitionFieldFragmentDoc = gql`
  fragment FieldErrorDialog_PetitionField on PetitionField {
    id
    title
    type
  }
` as unknown as DocumentNode<FieldErrorDialog_PetitionFieldFragment, unknown>;
export const ReferencedFieldDialog_PetitionFieldFragmentDoc = gql`
  fragment ReferencedFieldDialog_PetitionField on PetitionField {
    ...FieldErrorDialog_PetitionField
  }
  ${FieldErrorDialog_PetitionFieldFragmentDoc}
` as unknown as DocumentNode<ReferencedFieldDialog_PetitionFieldFragment, unknown>;
export const PetitionComposeFieldList_PetitionFragmentDoc = gql`
  fragment PetitionComposeFieldList_Petition on Petition {
    fields {
      isFixed
      ...PetitionComposeField_PetitionField
      ...ReferencedFieldDialog_PetitionField
    }
  }
  ${PetitionComposeField_PetitionFieldFragmentDoc}
  ${ReferencedFieldDialog_PetitionFieldFragmentDoc}
` as unknown as DocumentNode<PetitionComposeFieldList_PetitionFragment, unknown>;
export const PetitionListHeader_UserFragmentDoc = gql`
  fragment PetitionListHeader_User on User {
    id
    role
  }
` as unknown as DocumentNode<PetitionListHeader_UserFragment, unknown>;
export const PetitionListTagFilter_TagFragmentDoc = gql`
  fragment PetitionListTagFilter_Tag on Tag {
    id
    ...Tag_Tag
  }
  ${Tag_TagFragmentDoc}
` as unknown as DocumentNode<PetitionListTagFilter_TagFragment, unknown>;
export const PreviewPetitionField_PetitionFieldReplyFragmentDoc = gql`
  fragment PreviewPetitionField_PetitionFieldReply on PetitionFieldReply {
    content
  }
` as unknown as DocumentNode<PreviewPetitionField_PetitionFieldReplyFragment, unknown>;
export const PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldReplyFragmentDoc =
  gql`
    fragment PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldReply on PetitionFieldReply {
      id
      content
      status
      createdAt
      updatedAt
    }
  ` as unknown as DocumentNode<
    PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldReplyFragment,
    unknown
  >;
export const PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldFragmentDoc = gql`
  fragment PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionField on PetitionField {
    previewReplies @client {
      ...PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldReply
    }
    replies {
      ...PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldReply
    }
  }
  ${PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldReplyFragmentDoc}
` as unknown as DocumentNode<
  PreviewPetitionFieldMutations_updatePreviewFieldReplies_PetitionFieldFragment,
  unknown
>;
export const PreviewPetitionFieldMutations_updateReplyContent_PetitionFieldReplyFragmentDoc = gql`
  fragment PreviewPetitionFieldMutations_updateReplyContent_PetitionFieldReply on PetitionFieldReply {
    content
  }
` as unknown as DocumentNode<
  PreviewPetitionFieldMutations_updateReplyContent_PetitionFieldReplyFragment,
  unknown
>;
export const useFilenamePlaceholdersRename_PetitionFieldFragmentDoc = gql`
  fragment useFilenamePlaceholdersRename_PetitionField on PetitionField {
    id
    type
    title
  }
` as unknown as DocumentNode<useFilenamePlaceholdersRename_PetitionFieldFragment, unknown>;
export const useFilenamePlaceholdersRename_PetitionFieldReplyFragmentDoc = gql`
  fragment useFilenamePlaceholdersRename_PetitionFieldReply on PetitionFieldReply {
    content
  }
` as unknown as DocumentNode<useFilenamePlaceholdersRename_PetitionFieldReplyFragment, unknown>;
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
  ${useFilenamePlaceholdersRename_PetitionFieldReplyFragmentDoc}
` as unknown as DocumentNode<ExportRepliesProgressDialog_PetitionFragment, unknown>;
export const LandingTemplateCard_LandingTemplateFragmentDoc = gql`
  fragment LandingTemplateCard_LandingTemplate on LandingTemplate {
    id
    locale
    name
    slug
    imageUrl
    backgroundColor
    ownerFullName
    organizationName
  }
` as unknown as DocumentNode<LandingTemplateCard_LandingTemplateFragment, unknown>;
export const RecipientViewPetitionField_PublicPetitionFieldReplyFragmentDoc = gql`
  fragment RecipientViewPetitionField_PublicPetitionFieldReply on PublicPetitionFieldReply {
    content
  }
` as unknown as DocumentNode<RecipientViewPetitionField_PublicPetitionFieldReplyFragment, unknown>;
export const RecipientViewPetitionFieldMutations_updateReplyContent_PublicPetitionFieldReplyFragmentDoc =
  gql`
    fragment RecipientViewPetitionFieldMutations_updateReplyContent_PublicPetitionFieldReply on PublicPetitionFieldReply {
      content
    }
  ` as unknown as DocumentNode<
    RecipientViewPetitionFieldMutations_updateReplyContent_PublicPetitionFieldReplyFragment,
    unknown
  >;
export const AdminOrganizations_OrganizationFragmentDoc = gql`
  fragment AdminOrganizations_Organization on Organization {
    id
    _id
    name
    status
    activeUserCount
    createdAt
    usageLimits {
      users {
        limit
      }
      petitions {
        used
        limit
      }
    }
  }
` as unknown as DocumentNode<AdminOrganizations_OrganizationFragment, unknown>;
export const UserMenu_UserFragmentDoc = gql`
  fragment UserMenu_User on User {
    isSuperAdmin
    role
    email
    ...UserAvatar_User
  }
  ${UserAvatar_UserFragmentDoc}
` as unknown as DocumentNode<UserMenu_UserFragment, unknown>;
export const AppLayoutNavbar_UserFragmentDoc = gql`
  fragment AppLayoutNavbar_User on User {
    id
    email
    ...UserMenu_User
    organization {
      id
      usageLimits {
        petitions {
          limit
          used
        }
      }
    }
  }
  ${UserMenu_UserFragmentDoc}
` as unknown as DocumentNode<AppLayoutNavbar_UserFragment, unknown>;
export const AppLayout_UserFragmentDoc = gql`
  fragment AppLayout_User on User {
    id
    fullName
    firstName
    lastName
    email
    createdAt
    canCreateUsers
    ...AppLayoutNavbar_User
  }
  ${AppLayoutNavbar_UserFragmentDoc}
` as unknown as DocumentNode<AppLayout_UserFragment, unknown>;
export const AdminOrganizations_UserFragmentDoc = gql`
  fragment AdminOrganizations_User on User {
    ...AppLayout_User
  }
  ${AppLayout_UserFragmentDoc}
` as unknown as DocumentNode<AdminOrganizations_UserFragment, unknown>;
export const AdminSupportMethods_UserFragmentDoc = gql`
  fragment AdminSupportMethods_User on User {
    ...AppLayout_User
  }
  ${AppLayout_UserFragmentDoc}
` as unknown as DocumentNode<AdminSupportMethods_UserFragment, unknown>;
export const Contact_Contact_ProfileFragmentDoc = gql`
  fragment Contact_Contact_Profile on Contact {
    id
    email
    fullName
    firstName
    lastName
  }
` as unknown as DocumentNode<Contact_Contact_ProfileFragment, unknown>;
export const useConfirmDeleteContactsDialog_ContactFragmentDoc = gql`
  fragment useConfirmDeleteContactsDialog_Contact on Contact {
    fullName
    email
  }
` as unknown as DocumentNode<useConfirmDeleteContactsDialog_ContactFragment, unknown>;
export const useDeleteContacts_ContactFragmentDoc = gql`
  fragment useDeleteContacts_Contact on Contact {
    id
    ...useConfirmDeleteContactsDialog_Contact
  }
  ${useConfirmDeleteContactsDialog_ContactFragmentDoc}
` as unknown as DocumentNode<useDeleteContacts_ContactFragment, unknown>;
export const PetitionStatusCellContent_PetitionFragmentDoc = gql`
  fragment PetitionStatusCellContent_Petition on Petition {
    status
    progress {
      external {
        validated
        replied
        optional
        total
      }
      internal {
        validated
        replied
        optional
        total
      }
    }
  }
` as unknown as DocumentNode<PetitionStatusCellContent_PetitionFragment, unknown>;
export const getPetitionSignatureStatus_PetitionFragmentDoc = gql`
  fragment getPetitionSignatureStatus_Petition on Petition {
    status
    currentSignatureRequest {
      status
    }
    signatureConfig {
      review
    }
  }
` as unknown as DocumentNode<getPetitionSignatureStatus_PetitionFragment, unknown>;
export const getPetitionSignatureEnvironment_PetitionFragmentDoc = gql`
  fragment getPetitionSignatureEnvironment_Petition on Petition {
    currentSignatureRequest {
      environment
    }
    signatureConfig {
      integration {
        environment
      }
    }
  }
` as unknown as DocumentNode<getPetitionSignatureEnvironment_PetitionFragment, unknown>;
export const PetitionSignatureCellContent_PetitionFragmentDoc = gql`
  fragment PetitionSignatureCellContent_Petition on Petition {
    ...getPetitionSignatureStatus_Petition
    ...getPetitionSignatureEnvironment_Petition
  }
  ${getPetitionSignatureStatus_PetitionFragmentDoc}
  ${getPetitionSignatureEnvironment_PetitionFragmentDoc}
` as unknown as DocumentNode<PetitionSignatureCellContent_PetitionFragment, unknown>;
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
  ${PetitionSignatureCellContent_PetitionFragmentDoc}
` as unknown as DocumentNode<Contact_PetitionFragment, unknown>;
export const Contact_PetitionAccessFragmentDoc = gql`
  fragment Contact_PetitionAccess on PetitionAccess {
    id
    petition {
      ...Contact_Petition
    }
  }
  ${Contact_PetitionFragmentDoc}
` as unknown as DocumentNode<Contact_PetitionAccessFragment, unknown>;
export const Contact_ContactFragmentDoc = gql`
  fragment Contact_Contact on Contact {
    id
    ...Contact_Contact_Profile
    ...useDeleteContacts_Contact
    accesses(limit: 100) {
      items {
        ...Contact_PetitionAccess
      }
    }
  }
  ${Contact_Contact_ProfileFragmentDoc}
  ${useDeleteContacts_ContactFragmentDoc}
  ${Contact_PetitionAccessFragmentDoc}
` as unknown as DocumentNode<Contact_ContactFragment, unknown>;
export const Contact_UserFragmentDoc = gql`
  fragment Contact_User on User {
    ...AppLayout_User
  }
  ${AppLayout_UserFragmentDoc}
` as unknown as DocumentNode<Contact_UserFragment, unknown>;
export const Contacts_ContactsListFragmentDoc = gql`
  fragment Contacts_ContactsList on ContactPagination {
    items {
      id
      fullName
      firstName
      lastName
      email
      createdAt
      ...useDeleteContacts_Contact
    }
    totalCount
  }
  ${useDeleteContacts_ContactFragmentDoc}
` as unknown as DocumentNode<Contacts_ContactsListFragment, unknown>;
export const Contacts_UserFragmentDoc = gql`
  fragment Contacts_User on User {
    ...AppLayout_User
  }
  ${AppLayout_UserFragmentDoc}
` as unknown as DocumentNode<Contacts_UserFragment, unknown>;
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
` as unknown as DocumentNode<OrganizationGroup_UserGroupMemberFragment, unknown>;
export const OrganizationGroup_UserGroupFragmentDoc = gql`
  fragment OrganizationGroup_UserGroup on UserGroup {
    id
    name
    createdAt
    members {
      ...OrganizationGroup_UserGroupMember
    }
  }
  ${OrganizationGroup_UserGroupMemberFragmentDoc}
` as unknown as DocumentNode<OrganizationGroup_UserGroupFragment, unknown>;
export const OrganizationGroup_UserFragmentDoc = gql`
  fragment OrganizationGroup_User on User {
    ...AppLayout_User
  }
  ${AppLayout_UserFragmentDoc}
` as unknown as DocumentNode<OrganizationGroup_UserFragment, unknown>;
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
  ${UserAvatarList_UserFragmentDoc}
` as unknown as DocumentNode<OrganizationGroups_UserGroupFragment, unknown>;
export const OrganizationGroups_UserGroupPaginationFragmentDoc = gql`
  fragment OrganizationGroups_UserGroupPagination on UserGroupPagination {
    items {
      ...OrganizationGroups_UserGroup
    }
    totalCount
  }
  ${OrganizationGroups_UserGroupFragmentDoc}
` as unknown as DocumentNode<OrganizationGroups_UserGroupPaginationFragment, unknown>;
export const SettingsLayout_UserFragmentDoc = gql`
  fragment SettingsLayout_User on User {
    ...AppLayout_User
  }
  ${AppLayout_UserFragmentDoc}
` as unknown as DocumentNode<SettingsLayout_UserFragment, unknown>;
export const OrganizationGroups_UserFragmentDoc = gql`
  fragment OrganizationGroups_User on User {
    ...SettingsLayout_User
  }
  ${SettingsLayout_UserFragmentDoc}
` as unknown as DocumentNode<OrganizationGroups_UserFragment, unknown>;
export const IntegrationsSignature_SignatureOrgIntegrationFragmentDoc = gql`
  fragment IntegrationsSignature_SignatureOrgIntegration on SignatureOrgIntegration {
    id
    name
    provider
    isDefault
    environment
  }
` as unknown as DocumentNode<IntegrationsSignature_SignatureOrgIntegrationFragment, unknown>;
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
    userGroups {
      id
      ...useCreateOrUpdateUserDialog_UserGroup
    }
  }
  ${useCreateOrUpdateUserDialog_UserGroupFragmentDoc}
` as unknown as DocumentNode<OrganizationUsers_UserFragment, unknown>;
export const HeaderNameEditable_PetitionBaseFragmentDoc = gql`
  fragment HeaderNameEditable_PetitionBase on PetitionBase {
    name
    updatedAt
    ... on PetitionTemplate {
      isPublic
    }
  }
` as unknown as DocumentNode<HeaderNameEditable_PetitionBaseFragment, unknown>;
export const PetitionHeader_PetitionFragmentDoc = gql`
  fragment PetitionHeader_Petition on Petition {
    id
    locale
    deadline
    status
    isRestricted
    myEffectivePermission {
      isSubscribed
    }
    ...HeaderNameEditable_PetitionBase
  }
  ${HeaderNameEditable_PetitionBaseFragmentDoc}
` as unknown as DocumentNode<PetitionHeader_PetitionFragment, unknown>;
export const PetitionTemplateHeader_PetitionTemplateFragmentDoc = gql`
  fragment PetitionTemplateHeader_PetitionTemplate on PetitionTemplate {
    id
    locale
    isPublic
    isRestricted
    ...HeaderNameEditable_PetitionBase
  }
  ${HeaderNameEditable_PetitionBaseFragmentDoc}
` as unknown as DocumentNode<PetitionTemplateHeader_PetitionTemplateFragment, unknown>;
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
  ${PetitionTemplateHeader_PetitionTemplateFragmentDoc}
` as unknown as DocumentNode<PetitionLayout_PetitionBaseFragment, unknown>;
export const PetitionAccessTable_PetitionAccessRemindersConfigFragmentDoc = gql`
  fragment PetitionAccessTable_PetitionAccessRemindersConfig on RemindersConfig {
    offset
    time
    timezone
    weekdaysOnly
  }
` as unknown as DocumentNode<PetitionAccessTable_PetitionAccessRemindersConfigFragment, unknown>;
export const PetitionAccessTable_PetitionAccessFragmentDoc = gql`
  fragment PetitionAccessTable_PetitionAccess on PetitionAccess {
    id
    contact {
      ...ContactReference_Contact
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
  ${ContactReference_ContactFragmentDoc}
  ${PetitionAccessTable_PetitionAccessRemindersConfigFragmentDoc}
` as unknown as DocumentNode<PetitionAccessTable_PetitionAccessFragment, unknown>;
export const PetitionAccessTable_PetitionFragmentDoc = gql`
  fragment PetitionAccessTable_Petition on Petition {
    status
    accesses {
      ...PetitionAccessTable_PetitionAccess
    }
  }
  ${PetitionAccessTable_PetitionAccessFragmentDoc}
` as unknown as DocumentNode<PetitionAccessTable_PetitionFragment, unknown>;
export const TimelinePetitionCreatedEvent_PetitionCreatedEventFragmentDoc = gql`
  fragment TimelinePetitionCreatedEvent_PetitionCreatedEvent on PetitionCreatedEvent {
    user {
      ...UserReference_User
    }
    createdAt
  }
  ${UserReference_UserFragmentDoc}
` as unknown as DocumentNode<TimelinePetitionCreatedEvent_PetitionCreatedEventFragment, unknown>;
export const TimelinePetitionCompletedEvent_PetitionCompletedEventFragmentDoc = gql`
  fragment TimelinePetitionCompletedEvent_PetitionCompletedEvent on PetitionCompletedEvent {
    completedBy {
      ...UserOrContactReference_UserOrPetitionAccess
    }
    createdAt
  }
  ${UserOrContactReference_UserOrPetitionAccessFragmentDoc}
` as unknown as DocumentNode<
  TimelinePetitionCompletedEvent_PetitionCompletedEventFragment,
  unknown
>;
export const TimelineAccessActivatedEvent_AccessActivatedEventFragmentDoc = gql`
  fragment TimelineAccessActivatedEvent_AccessActivatedEvent on AccessActivatedEvent {
    user {
      ...UserReference_User
    }
    access {
      contact {
        ...ContactReference_Contact
      }
    }
    createdAt
  }
  ${UserReference_UserFragmentDoc}
  ${ContactReference_ContactFragmentDoc}
` as unknown as DocumentNode<TimelineAccessActivatedEvent_AccessActivatedEventFragment, unknown>;
export const TimelineAccessDeactivatedEvent_AccessDeactivatedEventFragmentDoc = gql`
  fragment TimelineAccessDeactivatedEvent_AccessDeactivatedEvent on AccessDeactivatedEvent {
    reason
    user {
      ...UserReference_User
    }
    access {
      contact {
        ...ContactReference_Contact
      }
    }
    createdAt
  }
  ${UserReference_UserFragmentDoc}
  ${ContactReference_ContactFragmentDoc}
` as unknown as DocumentNode<
  TimelineAccessDeactivatedEvent_AccessDeactivatedEventFragment,
  unknown
>;
export const TimelineAccessOpenedEvent_AccessOpenedEventFragmentDoc = gql`
  fragment TimelineAccessOpenedEvent_AccessOpenedEvent on AccessOpenedEvent {
    access {
      contact {
        ...ContactReference_Contact
      }
    }
    createdAt
  }
  ${ContactReference_ContactFragmentDoc}
` as unknown as DocumentNode<TimelineAccessOpenedEvent_AccessOpenedEventFragment, unknown>;
export const SentPetitionMessageDialog_PetitionMessageFragmentDoc = gql`
  fragment SentPetitionMessageDialog_PetitionMessage on PetitionMessage {
    emailBody
    emailSubject
    sentAt
    scheduledAt
    access {
      contact {
        ...ContactReference_Contact
      }
    }
  }
  ${ContactReference_ContactFragmentDoc}
` as unknown as DocumentNode<SentPetitionMessageDialog_PetitionMessageFragment, unknown>;
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
          ...ContactReference_Contact
        }
      }
      ...SentPetitionMessageDialog_PetitionMessage
    }
    createdAt
  }
  ${UserReference_UserFragmentDoc}
  ${ContactReference_ContactFragmentDoc}
  ${SentPetitionMessageDialog_PetitionMessageFragmentDoc}
` as unknown as DocumentNode<TimelineMessageScheduledEvent_MessageScheduledEventFragment, unknown>;
export const TimelineMessageCancelledEvent_MessageCancelledEventFragmentDoc = gql`
  fragment TimelineMessageCancelledEvent_MessageCancelledEvent on MessageCancelledEvent {
    reason
    message {
      status
      scheduledAt
      emailSubject
      access {
        contact {
          ...ContactReference_Contact
        }
      }
    }
    user {
      ...UserReference_User
    }
    createdAt
  }
  ${ContactReference_ContactFragmentDoc}
  ${UserReference_UserFragmentDoc}
` as unknown as DocumentNode<TimelineMessageCancelledEvent_MessageCancelledEventFragment, unknown>;
export const EmailEventsIndicator_PetitionMessageFragmentDoc = gql`
  fragment EmailEventsIndicator_PetitionMessage on PetitionMessage {
    bouncedAt
    deliveredAt
    openedAt
  }
` as unknown as DocumentNode<EmailEventsIndicator_PetitionMessageFragment, unknown>;
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
          ...ContactReference_Contact
        }
      }
      ...EmailEventsIndicator_PetitionMessage
      ...SentPetitionMessageDialog_PetitionMessage
    }
    createdAt
  }
  ${UserReference_UserFragmentDoc}
  ${ContactReference_ContactFragmentDoc}
  ${EmailEventsIndicator_PetitionMessageFragmentDoc}
  ${SentPetitionMessageDialog_PetitionMessageFragmentDoc}
` as unknown as DocumentNode<TimelineMessageSentEvent_MessageSentEventFragment, unknown>;
export const SentReminderMessageDialog_PetitionReminderFragmentDoc = gql`
  fragment SentReminderMessageDialog_PetitionReminder on PetitionReminder {
    access {
      contact {
        ...ContactReference_Contact
      }
    }
    createdAt
    emailBody
  }
  ${ContactReference_ContactFragmentDoc}
` as unknown as DocumentNode<SentReminderMessageDialog_PetitionReminderFragment, unknown>;
export const TimelineReminderSentEvent_ReminderSentEventFragmentDoc = gql`
  fragment TimelineReminderSentEvent_ReminderSentEvent on ReminderSentEvent {
    reminder {
      type
      sender {
        ...UserReference_User
      }
      access {
        contact {
          ...ContactReference_Contact
        }
      }
      ...SentReminderMessageDialog_PetitionReminder
    }
    createdAt
  }
  ${UserReference_UserFragmentDoc}
  ${ContactReference_ContactFragmentDoc}
  ${SentReminderMessageDialog_PetitionReminderFragmentDoc}
` as unknown as DocumentNode<TimelineReminderSentEvent_ReminderSentEventFragment, unknown>;
export const PetitionFieldReference_PetitionFieldFragmentDoc = gql`
  fragment PetitionFieldReference_PetitionField on PetitionField {
    title
  }
` as unknown as DocumentNode<PetitionFieldReference_PetitionFieldFragment, unknown>;
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
          ...ContactReference_Contact
        }
      }
    }
    createdAt
  }
  ${PetitionFieldReference_PetitionFieldFragmentDoc}
  ${UserReference_UserFragmentDoc}
  ${ContactReference_ContactFragmentDoc}
` as unknown as DocumentNode<TimelineReplyCreatedEvent_ReplyCreatedEventFragment, unknown>;
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
          ...ContactReference_Contact
        }
      }
    }
    createdAt
  }
  ${PetitionFieldReference_PetitionFieldFragmentDoc}
  ${UserReference_UserFragmentDoc}
  ${ContactReference_ContactFragmentDoc}
` as unknown as DocumentNode<TimelineReplyUpdatedEvent_ReplyUpdatedEventFragment, unknown>;
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
          ...ContactReference_Contact
        }
      }
    }
    createdAt
  }
  ${PetitionFieldReference_PetitionFieldFragmentDoc}
  ${UserReference_UserFragmentDoc}
  ${ContactReference_ContactFragmentDoc}
` as unknown as DocumentNode<TimelineReplyDeletedEvent_ReplyDeletedEventFragment, unknown>;
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
            ...ContactReference_Contact
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
  ${ContactReference_ContactFragmentDoc}
` as unknown as DocumentNode<TimelineCommentPublishedEvent_CommentPublishedEventFragment, unknown>;
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
          ...ContactReference_Contact
        }
      }
    }
    createdAt
  }
  ${PetitionFieldReference_PetitionFieldFragmentDoc}
  ${UserReference_UserFragmentDoc}
  ${ContactReference_ContactFragmentDoc}
` as unknown as DocumentNode<TimelineCommentDeletedEvent_CommentDeletedEventFragment, unknown>;
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
  ${UserReference_UserFragmentDoc}
` as unknown as DocumentNode<
  TimelineUserPermissionAddedEvent_UserPermissionAddedEventFragment,
  unknown
>;
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
  ${UserReference_UserFragmentDoc}
` as unknown as DocumentNode<
  TimelineUserPermissionRemovedEvent_UserPermissionRemovedEventFragment,
  unknown
>;
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
  ${UserReference_UserFragmentDoc}
` as unknown as DocumentNode<
  TimelineUserPermissionEditedEvent_UserPermissionEditedEventFragment,
  unknown
>;
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
  ${UserReference_UserFragmentDoc}
` as unknown as DocumentNode<
  TimelineOwnershipTransferredEvent_OwnershipTransferredEventFragment,
  unknown
>;
export const TimelinePetitionClosedEvent_PetitionClosedEventFragmentDoc = gql`
  fragment TimelinePetitionClosedEvent_PetitionClosedEvent on PetitionClosedEvent {
    user {
      ...UserReference_User
    }
    createdAt
  }
  ${UserReference_UserFragmentDoc}
` as unknown as DocumentNode<TimelinePetitionClosedEvent_PetitionClosedEventFragment, unknown>;
export const TimelinePetitionClosedNotifiedEvent_PetitionClosedNotifiedEventFragmentDoc = gql`
  fragment TimelinePetitionClosedNotifiedEvent_PetitionClosedNotifiedEvent on PetitionClosedNotifiedEvent {
    user {
      ...UserReference_User
    }
    access {
      contact {
        ...ContactReference_Contact
      }
    }
    createdAt
  }
  ${UserReference_UserFragmentDoc}
  ${ContactReference_ContactFragmentDoc}
` as unknown as DocumentNode<
  TimelinePetitionClosedNotifiedEvent_PetitionClosedNotifiedEventFragment,
  unknown
>;
export const TimelinePetitionReopenedEvent_PetitionReopenedEventFragmentDoc = gql`
  fragment TimelinePetitionReopenedEvent_PetitionReopenedEvent on PetitionReopenedEvent {
    user {
      ...UserReference_User
    }
    createdAt
  }
  ${UserReference_UserFragmentDoc}
` as unknown as DocumentNode<TimelinePetitionReopenedEvent_PetitionReopenedEventFragment, unknown>;
export const SignerReference_PetitionSignerFragmentDoc = gql`
  fragment SignerReference_PetitionSigner on PetitionSigner {
    email
    fullName
  }
` as unknown as DocumentNode<SignerReference_PetitionSignerFragment, unknown>;
export const TimelineSignatureOpenedEvent_SignatureOpenedEventFragmentDoc = gql`
  fragment TimelineSignatureOpenedEvent_SignatureOpenedEvent on SignatureOpenedEvent {
    signer {
      ...SignerReference_PetitionSigner
    }
    createdAt
  }
  ${SignerReference_PetitionSignerFragmentDoc}
` as unknown as DocumentNode<TimelineSignatureOpenedEvent_SignatureOpenedEventFragment, unknown>;
export const EmailEventsIndicator_SignatureStartedEventFragmentDoc = gql`
  fragment EmailEventsIndicator_SignatureStartedEvent on SignatureStartedEvent {
    bouncedAt
    deliveredAt
    openedAt
  }
` as unknown as DocumentNode<EmailEventsIndicator_SignatureStartedEventFragment, unknown>;
export const TimelineSignatureStartedEvent_SignatureStartedEventFragmentDoc = gql`
  fragment TimelineSignatureStartedEvent_SignatureStartedEvent on SignatureStartedEvent {
    ...EmailEventsIndicator_SignatureStartedEvent
    createdAt
  }
  ${EmailEventsIndicator_SignatureStartedEventFragmentDoc}
` as unknown as DocumentNode<TimelineSignatureStartedEvent_SignatureStartedEventFragment, unknown>;
export const TimelineSignatureCompletedEvent_SignatureCompletedEventFragmentDoc = gql`
  fragment TimelineSignatureCompletedEvent_SignatureCompletedEvent on SignatureCompletedEvent {
    createdAt
  }
` as unknown as DocumentNode<
  TimelineSignatureCompletedEvent_SignatureCompletedEventFragment,
  unknown
>;
export const TimelineSignatureCancelledEvent_SignatureCancelledEventFragmentDoc = gql`
  fragment TimelineSignatureCancelledEvent_SignatureCancelledEvent on SignatureCancelledEvent {
    cancelledBy {
      ...UserOrContactReference_UserOrPetitionAccess
    }
    canceller {
      ...SignerReference_PetitionSigner
    }
    cancelType
    errorCode
    extraErrorData
    cancellerReason
    createdAt
  }
  ${UserOrContactReference_UserOrPetitionAccessFragmentDoc}
  ${SignerReference_PetitionSignerFragmentDoc}
` as unknown as DocumentNode<
  TimelineSignatureCancelledEvent_SignatureCancelledEventFragment,
  unknown
>;
export const TimelineSignatureReminderEvent_SignatureReminderEventFragmentDoc = gql`
  fragment TimelineSignatureReminderEvent_SignatureReminderEvent on SignatureReminderEvent {
    user {
      ...UserReference_User
    }
    createdAt
  }
  ${UserReference_UserFragmentDoc}
` as unknown as DocumentNode<
  TimelineSignatureReminderEvent_SignatureReminderEventFragment,
  unknown
>;
export const TimelineAccessDelegatedEvent_AccessDelegatedEventFragmentDoc = gql`
  fragment TimelineAccessDelegatedEvent_AccessDelegatedEvent on AccessDelegatedEvent {
    originalAccess {
      contact {
        ...ContactReference_Contact
      }
    }
    newAccess {
      contact {
        ...ContactReference_Contact
      }
    }
    createdAt
  }
  ${ContactReference_ContactFragmentDoc}
` as unknown as DocumentNode<TimelineAccessDelegatedEvent_AccessDelegatedEventFragment, unknown>;
export const UserGroupReference_UserGroupFragmentDoc = gql`
  fragment UserGroupReference_UserGroup on UserGroup {
    name
  }
` as unknown as DocumentNode<UserGroupReference_UserGroupFragment, unknown>;
export const TimelineGroupPermissionAddedEvent_GroupPermissionAddedEventFragmentDoc = gql`
  fragment TimelineGroupPermissionAddedEvent_GroupPermissionAddedEvent on GroupPermissionAddedEvent {
    user {
      ...UserReference_User
    }
    permissionGroup {
      ...UserGroupReference_UserGroup
    }
    permissionType
    createdAt
  }
  ${UserReference_UserFragmentDoc}
  ${UserGroupReference_UserGroupFragmentDoc}
` as unknown as DocumentNode<
  TimelineGroupPermissionAddedEvent_GroupPermissionAddedEventFragment,
  unknown
>;
export const TimelineGroupPermissionEditedEvent_GroupPermissionEditedEventFragmentDoc = gql`
  fragment TimelineGroupPermissionEditedEvent_GroupPermissionEditedEvent on GroupPermissionEditedEvent {
    user {
      ...UserReference_User
    }
    permissionGroup {
      ...UserGroupReference_UserGroup
    }
    permissionType
    createdAt
  }
  ${UserReference_UserFragmentDoc}
  ${UserGroupReference_UserGroupFragmentDoc}
` as unknown as DocumentNode<
  TimelineGroupPermissionEditedEvent_GroupPermissionEditedEventFragment,
  unknown
>;
export const TimelineGroupPermissionRemovedEvent_GroupPermissionRemovedEventFragmentDoc = gql`
  fragment TimelineGroupPermissionRemovedEvent_GroupPermissionRemovedEvent on GroupPermissionRemovedEvent {
    user {
      ...UserReference_User
    }
    permissionGroup {
      ...UserGroupReference_UserGroup
    }
    createdAt
  }
  ${UserReference_UserFragmentDoc}
  ${UserGroupReference_UserGroupFragmentDoc}
` as unknown as DocumentNode<
  TimelineGroupPermissionRemovedEvent_GroupPermissionRemovedEventFragment,
  unknown
>;
export const TimelinePetitionClonedEvent_PetitionClonedEventFragmentDoc = gql`
  fragment TimelinePetitionClonedEvent_PetitionClonedEvent on PetitionClonedEvent {
    user {
      ...UserReference_User
    }
    createdAt
  }
  ${UserReference_UserFragmentDoc}
` as unknown as DocumentNode<TimelinePetitionClonedEvent_PetitionClonedEventFragment, unknown>;
export const TimelineRemindersOptOutEvent_RemindersOptOutEventFragmentDoc = gql`
  fragment TimelineRemindersOptOutEvent_RemindersOptOutEvent on RemindersOptOutEvent {
    access {
      contact {
        ...ContactReference_Contact
      }
    }
    createdAt
    reason
    other
  }
  ${ContactReference_ContactFragmentDoc}
` as unknown as DocumentNode<TimelineRemindersOptOutEvent_RemindersOptOutEventFragment, unknown>;
export const TimelineAccessActivatedFromLinkEvent_AccessActivatedFromPublicPetitionLinkEventFragmentDoc =
  gql`
    fragment TimelineAccessActivatedFromLinkEvent_AccessActivatedFromPublicPetitionLinkEvent on AccessActivatedFromPublicPetitionLinkEvent {
      access {
        contact {
          ...ContactReference_Contact
        }
      }
      createdAt
    }
    ${ContactReference_ContactFragmentDoc}
  ` as unknown as DocumentNode<
    TimelineAccessActivatedFromLinkEvent_AccessActivatedFromPublicPetitionLinkEventFragment,
    unknown
  >;
export const TimelineRecipientSignedEvent_RecipientSignedEventFragmentDoc = gql`
  fragment TimelineRecipientSignedEvent_RecipientSignedEvent on RecipientSignedEvent {
    signer {
      ...SignerReference_PetitionSigner
    }
    createdAt
  }
  ${SignerReference_PetitionSignerFragmentDoc}
` as unknown as DocumentNode<TimelineRecipientSignedEvent_RecipientSignedEventFragment, unknown>;
export const TimelinePetitionMessageBouncedEvent_PetitionMessageBouncedEventFragmentDoc = gql`
  fragment TimelinePetitionMessageBouncedEvent_PetitionMessageBouncedEvent on PetitionMessageBouncedEvent {
    message {
      access {
        contact {
          ...ContactReference_Contact
        }
      }
    }
    createdAt
  }
  ${ContactReference_ContactFragmentDoc}
` as unknown as DocumentNode<
  TimelinePetitionMessageBouncedEvent_PetitionMessageBouncedEventFragment,
  unknown
>;
export const TimelinePetitionReminderBouncedEvent_PetitionReminderBouncedEventFragmentDoc = gql`
  fragment TimelinePetitionReminderBouncedEvent_PetitionReminderBouncedEvent on PetitionReminderBouncedEvent {
    reminder {
      access {
        contact {
          ...ContactReference_Contact
        }
      }
    }
    createdAt
  }
  ${ContactReference_ContactFragmentDoc}
` as unknown as DocumentNode<
  TimelinePetitionReminderBouncedEvent_PetitionReminderBouncedEventFragment,
  unknown
>;
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
    ... on SignatureOpenedEvent {
      ...TimelineSignatureOpenedEvent_SignatureOpenedEvent
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
    ... on SignatureReminderEvent {
      ...TimelineSignatureReminderEvent_SignatureReminderEvent
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
    ... on RecipientSignedEvent {
      ...TimelineRecipientSignedEvent_RecipientSignedEvent
    }
    ... on PetitionMessageBouncedEvent {
      ...TimelinePetitionMessageBouncedEvent_PetitionMessageBouncedEvent
    }
    ... on PetitionReminderBouncedEvent {
      ...TimelinePetitionReminderBouncedEvent_PetitionReminderBouncedEvent
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
  ${TimelineSignatureOpenedEvent_SignatureOpenedEventFragmentDoc}
  ${TimelineSignatureStartedEvent_SignatureStartedEventFragmentDoc}
  ${TimelineSignatureCompletedEvent_SignatureCompletedEventFragmentDoc}
  ${TimelineSignatureCancelledEvent_SignatureCancelledEventFragmentDoc}
  ${TimelineSignatureReminderEvent_SignatureReminderEventFragmentDoc}
  ${TimelineAccessDelegatedEvent_AccessDelegatedEventFragmentDoc}
  ${TimelineGroupPermissionAddedEvent_GroupPermissionAddedEventFragmentDoc}
  ${TimelineGroupPermissionEditedEvent_GroupPermissionEditedEventFragmentDoc}
  ${TimelineGroupPermissionRemovedEvent_GroupPermissionRemovedEventFragmentDoc}
  ${TimelinePetitionClonedEvent_PetitionClonedEventFragmentDoc}
  ${TimelineRemindersOptOutEvent_RemindersOptOutEventFragmentDoc}
  ${TimelineAccessActivatedFromLinkEvent_AccessActivatedFromPublicPetitionLinkEventFragmentDoc}
  ${TimelineRecipientSignedEvent_RecipientSignedEventFragmentDoc}
  ${TimelinePetitionMessageBouncedEvent_PetitionMessageBouncedEventFragmentDoc}
  ${TimelinePetitionReminderBouncedEvent_PetitionReminderBouncedEventFragmentDoc}
` as unknown as DocumentNode<PetitionActivityTimeline_PetitionEventFragment, unknown>;
export const PetitionActivityTimeline_PetitionFragmentDoc = gql`
  fragment PetitionActivityTimeline_Petition on Petition {
    events(limit: 1000) {
      items {
        ...PetitionActivityTimeline_PetitionEvent
      }
    }
  }
  ${PetitionActivityTimeline_PetitionEventFragmentDoc}
` as unknown as DocumentNode<PetitionActivityTimeline_PetitionFragment, unknown>;
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
` as unknown as DocumentNode<ShareButton_PetitionBaseFragment, unknown>;
export const CopySignatureConfigDialog_PetitionSignerFragmentDoc = gql`
  fragment CopySignatureConfigDialog_PetitionSigner on PetitionSigner {
    email
    fullName
  }
` as unknown as DocumentNode<CopySignatureConfigDialog_PetitionSignerFragment, unknown>;
export const AddPetitionAccessDialog_PetitionFragmentDoc = gql`
  fragment AddPetitionAccessDialog_Petition on Petition {
    id
    emailSubject
    emailBody
    signatureConfig {
      signers {
        ...CopySignatureConfigDialog_PetitionSigner
      }
    }
    remindersConfig {
      offset
      time
      timezone
      weekdaysOnly
    }
    organization {
      id
      usageLimits {
        petitions {
          limit
          used
        }
      }
    }
  }
  ${CopySignatureConfigDialog_PetitionSignerFragmentDoc}
` as unknown as DocumentNode<AddPetitionAccessDialog_PetitionFragment, unknown>;
export const useSendPetitionHandler_PetitionFragmentDoc = gql`
  fragment useSendPetitionHandler_Petition on Petition {
    id
    accesses {
      contact {
        id
      }
    }
    signatureConfig {
      integration {
        id
        environment
        name
      }
    }
    ...AddPetitionAccessDialog_Petition
  }
  ${AddPetitionAccessDialog_PetitionFragmentDoc}
` as unknown as DocumentNode<useSendPetitionHandler_PetitionFragment, unknown>;
export const validatePetitionFields_PetitionFieldFragmentDoc = gql`
  fragment validatePetitionFields_PetitionField on PetitionField {
    id
    title
    type
    options
  }
` as unknown as DocumentNode<validatePetitionFields_PetitionFieldFragment, unknown>;
export const PetitionActivity_PetitionFragmentDoc = gql`
  fragment PetitionActivity_Petition on Petition {
    id
    accesses {
      id
      status
    }
    ...PetitionLayout_PetitionBase
    ...PetitionAccessTable_Petition
    ...PetitionActivityTimeline_Petition
    ...ShareButton_PetitionBase
    ...AddPetitionAccessDialog_Petition
    ...useSendPetitionHandler_Petition
    fields {
      ...validatePetitionFields_PetitionField
      ...FieldErrorDialog_PetitionField
    }
  }
  ${PetitionLayout_PetitionBaseFragmentDoc}
  ${PetitionAccessTable_PetitionFragmentDoc}
  ${PetitionActivityTimeline_PetitionFragmentDoc}
  ${ShareButton_PetitionBaseFragmentDoc}
  ${AddPetitionAccessDialog_PetitionFragmentDoc}
  ${useSendPetitionHandler_PetitionFragmentDoc}
  ${validatePetitionFields_PetitionFieldFragmentDoc}
  ${FieldErrorDialog_PetitionFieldFragmentDoc}
` as unknown as DocumentNode<PetitionActivity_PetitionFragment, unknown>;
export const isUsageLimitsReached_OrganizationFragmentDoc = gql`
  fragment isUsageLimitsReached_Organization on Organization {
    usageLimits {
      petitions {
        used
        limit
      }
    }
  }
` as unknown as DocumentNode<isUsageLimitsReached_OrganizationFragment, unknown>;
export const PetitionHeader_UserFragmentDoc = gql`
  fragment PetitionHeader_User on User {
    id
    role
    hasPetitionPdfExport: hasFeatureFlag(featureFlag: PETITION_PDF_EXPORT)
  }
` as unknown as DocumentNode<PetitionHeader_UserFragment, unknown>;
export const PetitionLayout_UserFragmentDoc = gql`
  fragment PetitionLayout_User on User {
    ...AppLayout_User
    ...PetitionHeader_User
  }
  ${AppLayout_UserFragmentDoc}
  ${PetitionHeader_UserFragmentDoc}
` as unknown as DocumentNode<PetitionLayout_UserFragment, unknown>;
export const useUpdateIsReadNotification_UserFragmentDoc = gql`
  fragment useUpdateIsReadNotification_User on User {
    id
    unreadNotificationIds
  }
` as unknown as DocumentNode<useUpdateIsReadNotification_UserFragment, unknown>;
export const PetitionActivity_UserFragmentDoc = gql`
  fragment PetitionActivity_User on User {
    organization {
      name
      ...isUsageLimitsReached_Organization
    }
    ...PetitionLayout_User
    ...useUpdateIsReadNotification_User
  }
  ${isUsageLimitsReached_OrganizationFragmentDoc}
  ${PetitionLayout_UserFragmentDoc}
  ${useUpdateIsReadNotification_UserFragmentDoc}
` as unknown as DocumentNode<PetitionActivity_UserFragment, unknown>;
export const PetitionTemplateComposeMessageEditor_PetitionFragmentDoc = gql`
  fragment PetitionTemplateComposeMessageEditor_Petition on PetitionTemplate {
    id
    emailSubject
    emailBody
    closingEmailBody
    description
    isRestricted
    isPublic
  }
` as unknown as DocumentNode<PetitionTemplateComposeMessageEditor_PetitionFragment, unknown>;
export const SignatureConfigDialog_SignatureOrgIntegrationFragmentDoc = gql`
  fragment SignatureConfigDialog_SignatureOrgIntegration on SignatureOrgIntegration {
    id
    name
    isDefault
    environment
  }
` as unknown as DocumentNode<SignatureConfigDialog_SignatureOrgIntegrationFragment, unknown>;
export const SignatureConfigDialog_PetitionBaseFragmentDoc = gql`
  fragment SignatureConfigDialog_PetitionBase on PetitionBase {
    name
    signatureConfig {
      integration {
        ...SignatureConfigDialog_SignatureOrgIntegration
      }
      signers {
        contactId
        firstName
        lastName
        email
      }
      title
      review
      allowAdditionalSigners
    }
    ... on Petition {
      status
      accesses {
        status
        contact {
          id
          firstName
          lastName
          email
        }
      }
    }
  }
  ${SignatureConfigDialog_SignatureOrgIntegrationFragmentDoc}
` as unknown as DocumentNode<SignatureConfigDialog_PetitionBaseFragment, unknown>;
export const PublicLinkSettingsDialog_PetitionTemplateFragmentDoc = gql`
  fragment PublicLinkSettingsDialog_PetitionTemplate on PetitionTemplate {
    name
    locale
    organization {
      customHost
    }
  }
` as unknown as DocumentNode<PublicLinkSettingsDialog_PetitionTemplateFragment, unknown>;
export const PublicLinkSettingsDialog_PublicPetitionLinkFragmentDoc = gql`
  fragment PublicLinkSettingsDialog_PublicPetitionLink on PublicPetitionLink {
    id
    isActive
    title
    description
    slug
    url
  }
` as unknown as DocumentNode<PublicLinkSettingsDialog_PublicPetitionLinkFragment, unknown>;
export const TemplateDefaultPermissionsDialog_PublicPetitionLinkFragmentDoc = gql`
  fragment TemplateDefaultPermissionsDialog_PublicPetitionLink on PublicPetitionLink {
    isActive
  }
` as unknown as DocumentNode<TemplateDefaultPermissionsDialog_PublicPetitionLinkFragment, unknown>;
export const TemplateDefaultUserPermissionRow_TemplateDefaultUserPermissionFragmentDoc = gql`
  fragment TemplateDefaultUserPermissionRow_TemplateDefaultUserPermission on TemplateDefaultUserPermission {
    permissionType
    user {
      id
      fullName
      email
      ...UserAvatar_User
    }
  }
  ${UserAvatar_UserFragmentDoc}
` as unknown as DocumentNode<
  TemplateDefaultUserPermissionRow_TemplateDefaultUserPermissionFragment,
  unknown
>;
export const TemplateDefaultUserGroupPermissionRow_TemplateDefaultUserGroupPermissionFragmentDoc =
  gql`
    fragment TemplateDefaultUserGroupPermissionRow_TemplateDefaultUserGroupPermission on TemplateDefaultUserGroupPermission {
      permissionType
      group {
        id
        initials
        name
        ...UserSelect_UserGroup
      }
    }
    ${UserSelect_UserGroupFragmentDoc}
  ` as unknown as DocumentNode<
    TemplateDefaultUserGroupPermissionRow_TemplateDefaultUserGroupPermissionFragment,
    unknown
  >;
export const TemplateDefaultPermissionsDialog_TemplateDefaultPermissionFragmentDoc = gql`
  fragment TemplateDefaultPermissionsDialog_TemplateDefaultPermission on TemplateDefaultPermission {
    id
    isSubscribed
    permissionType
    ... on TemplateDefaultUserPermission {
      ...TemplateDefaultUserPermissionRow_TemplateDefaultUserPermission
    }
    ... on TemplateDefaultUserGroupPermission {
      ...TemplateDefaultUserGroupPermissionRow_TemplateDefaultUserGroupPermission
    }
  }
  ${TemplateDefaultUserPermissionRow_TemplateDefaultUserPermissionFragmentDoc}
  ${TemplateDefaultUserGroupPermissionRow_TemplateDefaultUserGroupPermissionFragmentDoc}
` as unknown as DocumentNode<
  TemplateDefaultPermissionsDialog_TemplateDefaultPermissionFragment,
  unknown
>;
export const PetitionSettings_PetitionBaseFragmentDoc = gql`
  fragment PetitionSettings_PetitionBase on PetitionBase {
    id
    locale
    skipForwardSecurity
    isRecipientViewContentsHidden
    isRestricted
    isRestrictedWithPassword
    ...SignatureConfigDialog_PetitionBase
    ... on Petition {
      status
      deadline
      currentSignatureRequest {
        id
        status
      }
    }
    ... on PetitionTemplate {
      isPublic
      ...PublicLinkSettingsDialog_PetitionTemplate
      remindersConfig {
        offset
        time
        timezone
        weekdaysOnly
      }
      publicLink {
        id
        url
        isActive
        ...PublicLinkSettingsDialog_PublicPetitionLink
        ...TemplateDefaultPermissionsDialog_PublicPetitionLink
      }
      defaultPermissions {
        ...TemplateDefaultPermissionsDialog_TemplateDefaultPermission
      }
    }
  }
  ${SignatureConfigDialog_PetitionBaseFragmentDoc}
  ${PublicLinkSettingsDialog_PetitionTemplateFragmentDoc}
  ${PublicLinkSettingsDialog_PublicPetitionLinkFragmentDoc}
  ${TemplateDefaultPermissionsDialog_PublicPetitionLinkFragmentDoc}
  ${TemplateDefaultPermissionsDialog_TemplateDefaultPermissionFragmentDoc}
` as unknown as DocumentNode<PetitionSettings_PetitionBaseFragment, unknown>;
export const PetitionComposeFieldSettings_PetitionFieldFragmentDoc = gql`
  fragment PetitionComposeFieldSettings_PetitionField on PetitionField {
    id
    type
    optional
    multiple
    options
    isInternal
    isReadOnly
    showInPdf
    isFixed
    position
    visibility
    alias
    hasCommentsEnabled
  }
` as unknown as DocumentNode<PetitionComposeFieldSettings_PetitionFieldFragment, unknown>;
export const filterPetitionFields_PetitionFieldFragmentDoc = gql`
  fragment filterPetitionFields_PetitionField on PetitionField {
    id
    isReadOnly
    comments {
      id
    }
    replies {
      id
      status
    }
  }
` as unknown as DocumentNode<filterPetitionFields_PetitionFieldFragment, unknown>;
export const PetitionContents_PetitionFieldFragmentDoc = gql`
  fragment PetitionContents_PetitionField on PetitionField {
    id
    title
    type
    options
    isInternal
    ...filterPetitionFields_PetitionField
  }
  ${filterPetitionFields_PetitionFieldFragmentDoc}
` as unknown as DocumentNode<PetitionContents_PetitionFieldFragment, unknown>;
export const PetitionCompose_PetitionFieldFragmentDoc = gql`
  fragment PetitionCompose_PetitionField on PetitionField {
    ...PetitionComposeField_PetitionField
    ...PetitionComposeFieldSettings_PetitionField
    ...PetitionContents_PetitionField
    ...validatePetitionFields_PetitionField
    ...FieldErrorDialog_PetitionField
  }
  ${PetitionComposeField_PetitionFieldFragmentDoc}
  ${PetitionComposeFieldSettings_PetitionFieldFragmentDoc}
  ${PetitionContents_PetitionFieldFragmentDoc}
  ${validatePetitionFields_PetitionFieldFragmentDoc}
  ${FieldErrorDialog_PetitionFieldFragmentDoc}
` as unknown as DocumentNode<PetitionCompose_PetitionFieldFragment, unknown>;
export const PetitionCompose_PetitionBaseFragmentDoc = gql`
  fragment PetitionCompose_PetitionBase on PetitionBase {
    id
    ...PetitionLayout_PetitionBase
    ...PetitionTemplateComposeMessageEditor_Petition
    ...PetitionSettings_PetitionBase
    tone
    isRestricted
    fields {
      ...PetitionCompose_PetitionField
    }
    ... on Petition {
      accesses {
        id
        status
      }
      status
      signatureConfig {
        integration {
          environment
          name
        }
      }
      ...useSendPetitionHandler_Petition
    }
    ... on PetitionTemplate {
      isPublic
    }
  }
  ${PetitionLayout_PetitionBaseFragmentDoc}
  ${PetitionTemplateComposeMessageEditor_PetitionFragmentDoc}
  ${PetitionSettings_PetitionBaseFragmentDoc}
  ${PetitionCompose_PetitionFieldFragmentDoc}
  ${useSendPetitionHandler_PetitionFragmentDoc}
` as unknown as DocumentNode<PetitionCompose_PetitionBaseFragment, unknown>;
export const TestModeSignatureBadge_UserFragmentDoc = gql`
  fragment TestModeSignatureBadge_User on User {
    hasPetitionSignature: hasFeatureFlag(featureFlag: PETITION_SIGNATURE)
  }
` as unknown as DocumentNode<TestModeSignatureBadge_UserFragment, unknown>;
export const SignatureConfigDialog_UserFragmentDoc = gql`
  fragment SignatureConfigDialog_User on User {
    firstName
    lastName
    email
  }
` as unknown as DocumentNode<SignatureConfigDialog_UserFragment, unknown>;
export const PetitionSettings_UserFragmentDoc = gql`
  fragment PetitionSettings_User on User {
    id
    hasSkipForwardSecurity: hasFeatureFlag(featureFlag: SKIP_FORWARD_SECURITY)
    hasHideRecipientViewContents: hasFeatureFlag(featureFlag: HIDE_RECIPIENT_VIEW_CONTENTS)
    ...TestModeSignatureBadge_User
    organization {
      id
      signatureIntegrations: integrations(type: SIGNATURE, limit: 100) {
        items {
          ... on SignatureOrgIntegration {
            ...SignatureConfigDialog_SignatureOrgIntegration
          }
        }
      }
    }
    ...SignatureConfigDialog_User
  }
  ${TestModeSignatureBadge_UserFragmentDoc}
  ${SignatureConfigDialog_SignatureOrgIntegrationFragmentDoc}
  ${SignatureConfigDialog_UserFragmentDoc}
` as unknown as DocumentNode<PetitionSettings_UserFragment, unknown>;
export const PetitionCompose_UserFragmentDoc = gql`
  fragment PetitionCompose_User on User {
    id
    ...PetitionLayout_User
    ...PetitionSettings_User
    ...useUpdateIsReadNotification_User
    organization {
      ...isUsageLimitsReached_Organization
    }
  }
  ${PetitionLayout_UserFragmentDoc}
  ${PetitionSettings_UserFragmentDoc}
  ${useUpdateIsReadNotification_UserFragmentDoc}
  ${isUsageLimitsReached_OrganizationFragmentDoc}
` as unknown as DocumentNode<PetitionCompose_UserFragment, unknown>;
export const ConfirmPetitionSignersDialog_PetitionAccessFragmentDoc = gql`
  fragment ConfirmPetitionSignersDialog_PetitionAccess on PetitionAccess {
    id
    status
    contact {
      id
      email
      firstName
      lastName
    }
  }
` as unknown as DocumentNode<ConfirmPetitionSignersDialog_PetitionAccessFragment, unknown>;
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
    previewReplies @client {
      id
      content
    }
  }
` as unknown as DocumentNode<useFieldVisibility_PetitionFieldFragment, unknown>;
export const RecipientViewProgressFooter_PetitionFieldFragmentDoc = gql`
  fragment RecipientViewProgressFooter_PetitionField on PetitionField {
    id
    type
    optional
    isInternal
    isReadOnly
    replies {
      id
    }
    ...useFieldVisibility_PetitionField
  }
  ${useFieldVisibility_PetitionFieldFragmentDoc}
` as unknown as DocumentNode<RecipientViewProgressFooter_PetitionFieldFragment, unknown>;
export const RecipientViewProgressFooter_PetitionFragmentDoc = gql`
  fragment RecipientViewProgressFooter_Petition on Petition {
    status
    fields {
      ...RecipientViewProgressFooter_PetitionField
    }
    signatureConfig {
      review
    }
  }
  ${RecipientViewProgressFooter_PetitionFieldFragmentDoc}
` as unknown as DocumentNode<RecipientViewProgressFooter_PetitionFragment, unknown>;
export const RecipientViewPetitionFieldCard_PetitionFieldReplyFragmentDoc = gql`
  fragment RecipientViewPetitionFieldCard_PetitionFieldReply on PetitionFieldReply {
    id
    status
    content
    createdAt
    updatedAt
  }
` as unknown as DocumentNode<RecipientViewPetitionFieldCard_PetitionFieldReplyFragment, unknown>;
export const FileAttachmentButton_FileUploadFragmentDoc = gql`
  fragment FileAttachmentButton_FileUpload on FileUpload {
    filename
    contentType
    size
    isComplete
  }
` as unknown as DocumentNode<FileAttachmentButton_FileUploadFragment, unknown>;
export const RecipientViewPetitionFieldCommentsDialog_PetitionFieldFragmentDoc = gql`
  fragment RecipientViewPetitionFieldCommentsDialog_PetitionField on PetitionField {
    id
    title
  }
` as unknown as DocumentNode<
  RecipientViewPetitionFieldCommentsDialog_PetitionFieldFragment,
  unknown
>;
export const RecipientViewPetitionFieldCard_PetitionFieldFragmentDoc = gql`
  fragment RecipientViewPetitionFieldCard_PetitionField on PetitionField {
    id
    type
    title
    description
    options
    optional
    multiple
    isInternal
    replies {
      ...RecipientViewPetitionFieldCard_PetitionFieldReply
    }
    attachments {
      id
      file {
        ...FileAttachmentButton_FileUpload
      }
    }
    commentCount
    unreadCommentCount
    ...RecipientViewPetitionFieldCommentsDialog_PetitionField
    hasCommentsEnabled
  }
  ${RecipientViewPetitionFieldCard_PetitionFieldReplyFragmentDoc}
  ${FileAttachmentButton_FileUploadFragmentDoc}
  ${RecipientViewPetitionFieldCommentsDialog_PetitionFieldFragmentDoc}
` as unknown as DocumentNode<RecipientViewPetitionFieldCard_PetitionFieldFragment, unknown>;
export const FieldComment_PetitionFieldCommentFragmentDoc = gql`
  fragment FieldComment_PetitionFieldComment on PetitionFieldComment {
    id
    createdAt
    content
    isUnread
    isInternal
    isEdited
    author {
      ... on User {
        id
        ...UserReference_User
      }
      ... on PetitionAccess {
        id
        contact {
          ...ContactReference_Contact
        }
      }
    }
  }
  ${UserReference_UserFragmentDoc}
  ${ContactReference_ContactFragmentDoc}
` as unknown as DocumentNode<FieldComment_PetitionFieldCommentFragment, unknown>;
export const PreviewPetitionFieldCommentsDialog_PetitionFieldFragmentDoc = gql`
  fragment PreviewPetitionFieldCommentsDialog_PetitionField on PetitionField {
    id
    title
    isInternal
    commentCount
    unreadCommentCount
    comments {
      ...FieldComment_PetitionFieldComment
    }
    hasCommentsEnabled
  }
  ${FieldComment_PetitionFieldCommentFragmentDoc}
` as unknown as DocumentNode<PreviewPetitionFieldCommentsDialog_PetitionFieldFragment, unknown>;
export const PreviewPetitionField_PetitionFieldFragmentDoc = gql`
  fragment PreviewPetitionField_PetitionField on PetitionField {
    ...RecipientViewPetitionFieldCard_PetitionField
    ...PreviewPetitionFieldCommentsDialog_PetitionField
    previewReplies @client {
      ...RecipientViewPetitionFieldCard_PetitionFieldReply
    }
  }
  ${RecipientViewPetitionFieldCard_PetitionFieldFragmentDoc}
  ${PreviewPetitionFieldCommentsDialog_PetitionFieldFragmentDoc}
  ${RecipientViewPetitionFieldCard_PetitionFieldReplyFragmentDoc}
` as unknown as DocumentNode<PreviewPetitionField_PetitionFieldFragment, unknown>;
export const groupFieldsByPages_PetitionFieldFragmentDoc = gql`
  fragment groupFieldsByPages_PetitionField on PetitionField {
    id
    type
    visibility
    options
    isInternal
    showInPdf
  }
` as unknown as DocumentNode<groupFieldsByPages_PetitionFieldFragment, unknown>;
export const useGetPageFields_PetitionFieldFragmentDoc = gql`
  fragment useGetPageFields_PetitionField on PetitionField {
    id
    ...groupFieldsByPages_PetitionField
    ...useFieldVisibility_PetitionField
  }
  ${groupFieldsByPages_PetitionFieldFragmentDoc}
  ${useFieldVisibility_PetitionFieldFragmentDoc}
` as unknown as DocumentNode<useGetPageFields_PetitionFieldFragment, unknown>;
export const useLiquidScope_PetitionFieldFragmentDoc = gql`
  fragment useLiquidScope_PetitionField on PetitionField {
    type
    multiple
    alias
    previewReplies @client {
      content
    }
    replies {
      content
    }
  }
` as unknown as DocumentNode<useLiquidScope_PetitionFieldFragment, unknown>;
export const SelectedSignerRow_PetitionSignerFragmentDoc = gql`
  fragment SelectedSignerRow_PetitionSigner on PetitionSigner {
    firstName
    lastName
    email
  }
` as unknown as DocumentNode<SelectedSignerRow_PetitionSignerFragment, unknown>;
export const SuggestedSigners_PetitionSignerFragmentDoc = gql`
  fragment SuggestedSigners_PetitionSigner on PetitionSigner {
    firstName
    lastName
    email
  }
` as unknown as DocumentNode<SuggestedSigners_PetitionSignerFragment, unknown>;
export const ConfirmPetitionSignersDialog_PetitionSignerFragmentDoc = gql`
  fragment ConfirmPetitionSignersDialog_PetitionSigner on PetitionSigner {
    contactId
    email
    firstName
    lastName
    ...SelectedSignerRow_PetitionSigner
    ...SuggestedSigners_PetitionSigner
  }
  ${SelectedSignerRow_PetitionSignerFragmentDoc}
  ${SuggestedSigners_PetitionSignerFragmentDoc}
` as unknown as DocumentNode<ConfirmPetitionSignersDialog_PetitionSignerFragment, unknown>;
export const RecipientViewContentsCard_PetitionFieldFragmentDoc = gql`
  fragment RecipientViewContentsCard_PetitionField on PetitionField {
    id
    type
    title
    options
    optional
    isInternal
    isReadOnly
    replies {
      id
      status
    }
    commentCount
    unreadCommentCount
    hasCommentsEnabled
    ...useFieldVisibility_PetitionField
  }
  ${useFieldVisibility_PetitionFieldFragmentDoc}
` as unknown as DocumentNode<RecipientViewContentsCard_PetitionFieldFragment, unknown>;
export const RecipientViewContentsCard_PetitionBaseFragmentDoc = gql`
  fragment RecipientViewContentsCard_PetitionBase on PetitionBase {
    fields {
      ...RecipientViewContentsCard_PetitionField
    }
  }
  ${RecipientViewContentsCard_PetitionFieldFragmentDoc}
` as unknown as DocumentNode<RecipientViewContentsCard_PetitionBaseFragment, unknown>;
export const PetitionPreview_PetitionBaseFragmentDoc = gql`
  fragment PetitionPreview_PetitionBase on PetitionBase {
    id
    tone
    ... on Petition {
      accesses {
        id
        status
        ...ConfirmPetitionSignersDialog_PetitionAccess
      }
      ...RecipientViewProgressFooter_Petition
      ...useSendPetitionHandler_Petition
    }
    fields {
      ...PreviewPetitionField_PetitionField
      ...useGetPageFields_PetitionField
      ...validatePetitionFields_PetitionField
      ...FieldErrorDialog_PetitionField
      ...useLiquidScope_PetitionField
    }
    signatureConfig {
      allowAdditionalSigners
      review
      timezone
      title
      signers {
        ...ConfirmPetitionSignersDialog_PetitionSigner
      }
    }
    ...RecipientViewContentsCard_PetitionBase
    ...PetitionLayout_PetitionBase
  }
  ${ConfirmPetitionSignersDialog_PetitionAccessFragmentDoc}
  ${RecipientViewProgressFooter_PetitionFragmentDoc}
  ${useSendPetitionHandler_PetitionFragmentDoc}
  ${PreviewPetitionField_PetitionFieldFragmentDoc}
  ${useGetPageFields_PetitionFieldFragmentDoc}
  ${validatePetitionFields_PetitionFieldFragmentDoc}
  ${FieldErrorDialog_PetitionFieldFragmentDoc}
  ${useLiquidScope_PetitionFieldFragmentDoc}
  ${ConfirmPetitionSignersDialog_PetitionSignerFragmentDoc}
  ${RecipientViewContentsCard_PetitionBaseFragmentDoc}
  ${PetitionLayout_PetitionBaseFragmentDoc}
` as unknown as DocumentNode<PetitionPreview_PetitionBaseFragment, unknown>;
export const ConfirmPetitionSignersDialog_UserFragmentDoc = gql`
  fragment ConfirmPetitionSignersDialog_User on User {
    id
    email
    firstName
    lastName
  }
` as unknown as DocumentNode<ConfirmPetitionSignersDialog_UserFragment, unknown>;
export const PetitionPreview_UserFragmentDoc = gql`
  fragment PetitionPreview_User on User {
    organization {
      name
      ...isUsageLimitsReached_Organization
    }
    ...PetitionLayout_User
    ...ConfirmPetitionSignersDialog_User
  }
  ${isUsageLimitsReached_OrganizationFragmentDoc}
  ${PetitionLayout_UserFragmentDoc}
  ${ConfirmPetitionSignersDialog_UserFragmentDoc}
` as unknown as DocumentNode<PetitionPreview_UserFragment, unknown>;
export const PetitionRepliesFieldReply_PetitionFieldReplyFragmentDoc = gql`
  fragment PetitionRepliesFieldReply_PetitionFieldReply on PetitionFieldReply {
    id
    content
    status
    createdAt
    metadata
    field {
      type
      options
    }
    updatedBy {
      ...UserOrContactReference_UserOrPetitionAccess
    }
  }
  ${UserOrContactReference_UserOrPetitionAccessFragmentDoc}
` as unknown as DocumentNode<PetitionRepliesFieldReply_PetitionFieldReplyFragment, unknown>;
export const PetitionRepliesField_PetitionFieldReplyFragmentDoc = gql`
  fragment PetitionRepliesField_PetitionFieldReply on PetitionFieldReply {
    id
    ...PetitionRepliesFieldReply_PetitionFieldReply
  }
  ${PetitionRepliesFieldReply_PetitionFieldReplyFragmentDoc}
` as unknown as DocumentNode<PetitionRepliesField_PetitionFieldReplyFragment, unknown>;
export const PetitionRepliesField_PetitionFieldFragmentDoc = gql`
  fragment PetitionRepliesField_PetitionField on PetitionField {
    id
    type
    title
    description
    optional
    isInternal
    replies {
      ...PetitionRepliesField_PetitionFieldReply
    }
    comments {
      id
      isUnread
      createdAt
    }
    attachments {
      id
      file {
        ...FileAttachmentButton_FileUpload
      }
    }
  }
  ${PetitionRepliesField_PetitionFieldReplyFragmentDoc}
  ${FileAttachmentButton_FileUploadFragmentDoc}
` as unknown as DocumentNode<PetitionRepliesField_PetitionFieldFragment, unknown>;
export const PetitionRepliesFieldComments_PetitionFieldReplyFragmentDoc = gql`
  fragment PetitionRepliesFieldComments_PetitionFieldReply on PetitionFieldReply {
    id
    content
  }
` as unknown as DocumentNode<PetitionRepliesFieldComments_PetitionFieldReplyFragment, unknown>;
export const PetitionRepliesFieldComments_PetitionFieldFragmentDoc = gql`
  fragment PetitionRepliesFieldComments_PetitionField on PetitionField {
    id
    title
    type
    isInternal
    replies {
      ...PetitionRepliesFieldComments_PetitionFieldReply
    }
    hasCommentsEnabled
  }
  ${PetitionRepliesFieldComments_PetitionFieldReplyFragmentDoc}
` as unknown as DocumentNode<PetitionRepliesFieldComments_PetitionFieldFragment, unknown>;
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
  ${useFilenamePlaceholdersRename_PetitionFieldReplyFragmentDoc}
` as unknown as DocumentNode<ExportRepliesDialog_PetitionFieldFragment, unknown>;
export const PetitionReplies_PetitionFieldFragmentDoc = gql`
  fragment PetitionReplies_PetitionField on PetitionField {
    isReadOnly
    ...PetitionRepliesField_PetitionField
    ...PetitionContents_PetitionField
    ...PetitionRepliesFieldComments_PetitionField
    ...ExportRepliesDialog_PetitionField
    ...useFieldVisibility_PetitionField
    ...useLiquidScope_PetitionField
  }
  ${PetitionRepliesField_PetitionFieldFragmentDoc}
  ${PetitionContents_PetitionFieldFragmentDoc}
  ${PetitionRepliesFieldComments_PetitionFieldFragmentDoc}
  ${ExportRepliesDialog_PetitionFieldFragmentDoc}
  ${useFieldVisibility_PetitionFieldFragmentDoc}
  ${useLiquidScope_PetitionFieldFragmentDoc}
` as unknown as DocumentNode<PetitionReplies_PetitionFieldFragment, unknown>;
export const NewSignatureRequestRow_PetitionFragmentDoc = gql`
  fragment NewSignatureRequestRow_Petition on Petition {
    signatureConfig {
      signers {
        ...SignerReference_PetitionSigner
        ...ConfirmPetitionSignersDialog_PetitionSigner
      }
      allowAdditionalSigners
      integration {
        id
        name
        provider
      }
      review
      timezone
      title
    }
    accesses {
      ...ConfirmPetitionSignersDialog_PetitionAccess
    }
  }
  ${SignerReference_PetitionSignerFragmentDoc}
  ${ConfirmPetitionSignersDialog_PetitionSignerFragmentDoc}
  ${ConfirmPetitionSignersDialog_PetitionAccessFragmentDoc}
` as unknown as DocumentNode<NewSignatureRequestRow_PetitionFragment, unknown>;
export const DatesList_SignerStatusFragmentDoc = gql`
  fragment DatesList_SignerStatus on PetitionSignatureRequestSignerStatus {
    sentAt
    openedAt
    signedAt
    declinedAt
  }
` as unknown as DocumentNode<DatesList_SignerStatusFragment, unknown>;
export const PetitionSignatureRequestSignerStatusIcon_SignerStatusFragmentDoc = gql`
  fragment PetitionSignatureRequestSignerStatusIcon_SignerStatus on PetitionSignatureRequestSignerStatus {
    status
    ...DatesList_SignerStatus
  }
  ${DatesList_SignerStatusFragmentDoc}
` as unknown as DocumentNode<
  PetitionSignatureRequestSignerStatusIcon_SignerStatusFragment,
  unknown
>;
export const CurrentSignatureRequestRow_PetitionSignatureRequestFragmentDoc = gql`
  fragment CurrentSignatureRequestRow_PetitionSignatureRequest on PetitionSignatureRequest {
    id
    status
    signerStatus {
      signer {
        ...SignerReference_PetitionSigner
      }
      ...PetitionSignatureRequestSignerStatusIcon_SignerStatus
    }
  }
  ${SignerReference_PetitionSignerFragmentDoc}
  ${PetitionSignatureRequestSignerStatusIcon_SignerStatusFragmentDoc}
` as unknown as DocumentNode<CurrentSignatureRequestRow_PetitionSignatureRequestFragment, unknown>;
export const OlderSignatureRequestRows_PetitionSignatureRequestFragmentDoc = gql`
  fragment OlderSignatureRequestRows_PetitionSignatureRequest on PetitionSignatureRequest {
    id
    status
    signatureConfig {
      signers {
        ...SignerReference_PetitionSigner
      }
    }
  }
  ${SignerReference_PetitionSignerFragmentDoc}
` as unknown as DocumentNode<OlderSignatureRequestRows_PetitionSignatureRequestFragment, unknown>;
export const PetitionSignaturesCard_PetitionFragmentDoc = gql`
  fragment PetitionSignaturesCard_Petition on Petition {
    id
    status
    ...SignatureConfigDialog_PetitionBase
    ...NewSignatureRequestRow_Petition
    signatureRequests {
      ...CurrentSignatureRequestRow_PetitionSignatureRequest
      ...OlderSignatureRequestRows_PetitionSignatureRequest
    }
    ...getPetitionSignatureEnvironment_Petition
  }
  ${SignatureConfigDialog_PetitionBaseFragmentDoc}
  ${NewSignatureRequestRow_PetitionFragmentDoc}
  ${CurrentSignatureRequestRow_PetitionSignatureRequestFragmentDoc}
  ${OlderSignatureRequestRows_PetitionSignatureRequestFragmentDoc}
  ${getPetitionSignatureEnvironment_PetitionFragmentDoc}
` as unknown as DocumentNode<PetitionSignaturesCard_PetitionFragment, unknown>;
export const PetitionAttachmentsCard_PetitionFragmentDoc = gql`
  fragment PetitionAttachmentsCard_Petition on Petition {
    id
    attachments {
      id
      file {
        ...FileAttachmentButton_FileUpload
      }
    }
  }
  ${FileAttachmentButton_FileUploadFragmentDoc}
` as unknown as DocumentNode<PetitionAttachmentsCard_PetitionFragment, unknown>;
export const useClosePetitionDialog_PetitionFragmentDoc = gql`
  fragment useClosePetitionDialog_Petition on Petition {
    id
    closingEmailBody
  }
` as unknown as DocumentNode<useClosePetitionDialog_PetitionFragment, unknown>;
export const PetitionReplies_PetitionFragmentDoc = gql`
  fragment PetitionReplies_Petition on Petition {
    id
    accesses {
      id
      status
    }
    ...PetitionLayout_PetitionBase
    fields {
      ...PetitionReplies_PetitionField
    }
    ...ShareButton_PetitionBase
    currentSignatureRequest {
      id
      status
    }
    ...PetitionSignaturesCard_Petition
    ...getPetitionSignatureStatus_Petition
    ...getPetitionSignatureEnvironment_Petition
    ...PetitionAttachmentsCard_Petition
    ...useClosePetitionDialog_Petition
  }
  ${PetitionLayout_PetitionBaseFragmentDoc}
  ${PetitionReplies_PetitionFieldFragmentDoc}
  ${ShareButton_PetitionBaseFragmentDoc}
  ${PetitionSignaturesCard_PetitionFragmentDoc}
  ${getPetitionSignatureStatus_PetitionFragmentDoc}
  ${getPetitionSignatureEnvironment_PetitionFragmentDoc}
  ${PetitionAttachmentsCard_PetitionFragmentDoc}
  ${useClosePetitionDialog_PetitionFragmentDoc}
` as unknown as DocumentNode<PetitionReplies_PetitionFragment, unknown>;
export const PetitionRepliesFieldComments_UserFragmentDoc = gql`
  fragment PetitionRepliesFieldComments_User on User {
    id
    hasInternalComments: hasFeatureFlag(featureFlag: INTERNAL_COMMENTS)
  }
` as unknown as DocumentNode<PetitionRepliesFieldComments_UserFragment, unknown>;
export const ExportRepliesDialog_UserFragmentDoc = gql`
  fragment ExportRepliesDialog_User on User {
    hasExportCuatrecasas: hasFeatureFlag(featureFlag: EXPORT_CUATRECASAS)
  }
` as unknown as DocumentNode<ExportRepliesDialog_UserFragment, unknown>;
export const NewSignatureRequestRow_UserFragmentDoc = gql`
  fragment NewSignatureRequestRow_User on User {
    ...ConfirmPetitionSignersDialog_User
  }
  ${ConfirmPetitionSignersDialog_UserFragmentDoc}
` as unknown as DocumentNode<NewSignatureRequestRow_UserFragment, unknown>;
export const PetitionSignaturesCard_UserFragmentDoc = gql`
  fragment PetitionSignaturesCard_User on User {
    ...TestModeSignatureBadge_User
    ...NewSignatureRequestRow_User
    ...SignatureConfigDialog_User
    organization {
      signatureIntegrations: integrations(type: SIGNATURE, limit: 100) {
        items {
          ... on SignatureOrgIntegration {
            ...SignatureConfigDialog_SignatureOrgIntegration
          }
        }
      }
    }
  }
  ${TestModeSignatureBadge_UserFragmentDoc}
  ${NewSignatureRequestRow_UserFragmentDoc}
  ${SignatureConfigDialog_UserFragmentDoc}
  ${SignatureConfigDialog_SignatureOrgIntegrationFragmentDoc}
` as unknown as DocumentNode<PetitionSignaturesCard_UserFragment, unknown>;
export const PetitionReplies_UserFragmentDoc = gql`
  fragment PetitionReplies_User on User {
    organization {
      name
      ...isUsageLimitsReached_Organization
    }
    hasPetitionSignature: hasFeatureFlag(featureFlag: PETITION_SIGNATURE)
    hasPetitionPdfExport: hasFeatureFlag(featureFlag: PETITION_PDF_EXPORT)
    ...PetitionLayout_User
    ...PetitionRepliesFieldComments_User
    ...ExportRepliesDialog_User
    ...PetitionSignaturesCard_User
    ...useUpdateIsReadNotification_User
  }
  ${isUsageLimitsReached_OrganizationFragmentDoc}
  ${PetitionLayout_UserFragmentDoc}
  ${PetitionRepliesFieldComments_UserFragmentDoc}
  ${ExportRepliesDialog_UserFragmentDoc}
  ${PetitionSignaturesCard_UserFragmentDoc}
  ${useUpdateIsReadNotification_UserFragmentDoc}
` as unknown as DocumentNode<PetitionReplies_UserFragment, unknown>;
export const PetitionTagListCellContent_TagFragmentDoc = gql`
  fragment PetitionTagListCellContent_Tag on Tag {
    id
    ...Tag_Tag
  }
  ${Tag_TagFragmentDoc}
` as unknown as DocumentNode<PetitionTagListCellContent_TagFragment, unknown>;
export const PetitionTagListCellContent_PetitionBaseFragmentDoc = gql`
  fragment PetitionTagListCellContent_PetitionBase on PetitionBase {
    id
    isRestricted
    tags {
      ...PetitionTagListCellContent_Tag
    }
  }
  ${PetitionTagListCellContent_TagFragmentDoc}
` as unknown as DocumentNode<PetitionTagListCellContent_PetitionBaseFragment, unknown>;
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
          ...ContactReference_Contact
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
  ${ContactReference_ContactFragmentDoc}
  ${PetitionStatusCellContent_PetitionFragmentDoc}
  ${PetitionSignatureCellContent_PetitionFragmentDoc}
` as unknown as DocumentNode<usePetitionsTableColumns_PetitionBaseFragment, unknown>;
export const Petitions_PetitionBaseFragmentDoc = gql`
  fragment Petitions_PetitionBase on PetitionBase {
    ...usePetitionsTableColumns_PetitionBase
    ... on PetitionTemplate {
      isPublic
    }
  }
  ${usePetitionsTableColumns_PetitionBaseFragmentDoc}
` as unknown as DocumentNode<Petitions_PetitionBaseFragment, unknown>;
export const Petitions_PetitionBasePaginationFragmentDoc = gql`
  fragment Petitions_PetitionBasePagination on PetitionBasePagination {
    items {
      ...Petitions_PetitionBase
    }
    totalCount
  }
  ${Petitions_PetitionBaseFragmentDoc}
` as unknown as DocumentNode<Petitions_PetitionBasePaginationFragment, unknown>;
export const TemplateCard_PetitionTemplateFragmentDoc = gql`
  fragment TemplateCard_PetitionTemplate on PetitionTemplate {
    id
    name
    permissions {
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
    ...TemplateActiveSettingsIcons_PetitionTemplate
  }
  ${UserAvatarList_UserFragmentDoc}
  ${UserAvatarList_UserGroupFragmentDoc}
  ${TemplateActiveSettingsIcons_PetitionTemplateFragmentDoc}
` as unknown as DocumentNode<TemplateCard_PetitionTemplateFragment, unknown>;
export const PublicTemplateCard_PetitionTemplateFragmentDoc = gql`
  fragment PublicTemplateCard_PetitionTemplate on PetitionTemplate {
    id
    name
    descriptionExcerpt
    backgroundColor
    categories
    imageUrl
    ...TemplateActiveSettingsIcons_PetitionTemplate
  }
  ${TemplateActiveSettingsIcons_PetitionTemplateFragmentDoc}
` as unknown as DocumentNode<PublicTemplateCard_PetitionTemplateFragment, unknown>;
export const NewPetition_PetitionTemplateFragmentDoc = gql`
  fragment NewPetition_PetitionTemplate on PetitionTemplate {
    ...TemplateCard_PetitionTemplate
    ...PublicTemplateCard_PetitionTemplate
  }
  ${TemplateCard_PetitionTemplateFragmentDoc}
  ${PublicTemplateCard_PetitionTemplateFragmentDoc}
` as unknown as DocumentNode<NewPetition_PetitionTemplateFragment, unknown>;
export const TemplateDetailsModal_UserFragmentDoc = gql`
  fragment TemplateDetailsModal_User on User {
    id
    role
  }
` as unknown as DocumentNode<TemplateDetailsModal_UserFragment, unknown>;
export const NewPetition_UserFragmentDoc = gql`
  fragment NewPetition_User on User {
    ...AppLayout_User
    ...TemplateDetailsModal_User
  }
  ${AppLayout_UserFragmentDoc}
  ${TemplateDetailsModal_UserFragmentDoc}
` as unknown as DocumentNode<NewPetition_UserFragment, unknown>;
export const useSettingsSections_UserFragmentDoc = gql`
  fragment useSettingsSections_User on User {
    hasDeveloperAccess: hasFeatureFlag(featureFlag: DEVELOPER_ACCESS)
  }
` as unknown as DocumentNode<useSettingsSections_UserFragment, unknown>;
export const Account_UserFragmentDoc = gql`
  fragment Account_User on User {
    firstName
    lastName
    isSsoUser
    email
    preferredLocale
    ...SettingsLayout_User
    ...useSettingsSections_User
  }
  ${SettingsLayout_UserFragmentDoc}
  ${useSettingsSections_UserFragmentDoc}
` as unknown as DocumentNode<Account_UserFragment, unknown>;
export const Developers_UserAuthenticationTokenFragmentDoc = gql`
  fragment Developers_UserAuthenticationToken on UserAuthenticationToken {
    id
    tokenName
    createdAt
    lastUsedAt
  }
` as unknown as DocumentNode<Developers_UserAuthenticationTokenFragment, unknown>;
export const CreateOrUpdateEventSubscriptionDialog_PetitionEventSubscriptionFragmentDoc = gql`
  fragment CreateOrUpdateEventSubscriptionDialog_PetitionEventSubscription on PetitionEventSubscription {
    eventsUrl
    eventTypes
    name
  }
` as unknown as DocumentNode<
  CreateOrUpdateEventSubscriptionDialog_PetitionEventSubscriptionFragment,
  unknown
>;
export const Developers_PetitionEventSubscriptionFragmentDoc = gql`
  fragment Developers_PetitionEventSubscription on PetitionEventSubscription {
    id
    eventsUrl
    eventTypes
    isEnabled
    name
    ...CreateOrUpdateEventSubscriptionDialog_PetitionEventSubscription
  }
  ${CreateOrUpdateEventSubscriptionDialog_PetitionEventSubscriptionFragmentDoc}
` as unknown as DocumentNode<Developers_PetitionEventSubscriptionFragment, unknown>;
export const RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragmentDoc = gql`
  fragment RecipientViewPetitionFieldCard_PublicPetitionFieldReply on PublicPetitionFieldReply {
    id
    status
    content
    createdAt
    updatedAt
  }
` as unknown as DocumentNode<
  RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragment,
  unknown
>;
export const RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldFragmentDoc = gql`
  fragment RecipientViewPetitionFieldCommentsDialog_PublicPetitionField on PublicPetitionField {
    id
    title
    commentCount
    unreadCommentCount
  }
` as unknown as DocumentNode<
  RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldFragment,
  unknown
>;
export const RecipientViewPetitionFieldCard_PublicPetitionFieldFragmentDoc = gql`
  fragment RecipientViewPetitionFieldCard_PublicPetitionField on PublicPetitionField {
    id
    type
    title
    description
    options
    optional
    multiple
    isInternal
    replies {
      ...RecipientViewPetitionFieldCard_PublicPetitionFieldReply
    }
    attachments {
      id
      file {
        ...FileAttachmentButton_FileUpload
      }
    }
    commentCount
    unreadCommentCount
    hasCommentsEnabled
    ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionField
  }
  ${RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragmentDoc}
  ${FileAttachmentButton_FileUploadFragmentDoc}
  ${RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldFragmentDoc}
` as unknown as DocumentNode<RecipientViewPetitionFieldCard_PublicPetitionFieldFragment, unknown>;
export const RecipientViewPetitionField_PublicPetitionFieldFragmentDoc = gql`
  fragment RecipientViewPetitionField_PublicPetitionField on PublicPetitionField {
    ...RecipientViewPetitionFieldCard_PublicPetitionField
  }
  ${RecipientViewPetitionFieldCard_PublicPetitionFieldFragmentDoc}
` as unknown as DocumentNode<RecipientViewPetitionField_PublicPetitionFieldFragment, unknown>;
export const useFieldVisibility_PublicPetitionFieldFragmentDoc = gql`
  fragment useFieldVisibility_PublicPetitionField on PublicPetitionField {
    id
    type
    options
    visibility
    isInternal
    replies {
      id
      content
    }
  }
` as unknown as DocumentNode<useFieldVisibility_PublicPetitionFieldFragment, unknown>;
export const RecipientViewContentsCard_PublicPetitionFieldFragmentDoc = gql`
  fragment RecipientViewContentsCard_PublicPetitionField on PublicPetitionField {
    id
    type
    title
    options
    optional
    isInternal
    isReadOnly
    replies {
      id
      status
    }
    commentCount
    unreadCommentCount
    hasCommentsEnabled
    ...useFieldVisibility_PublicPetitionField
  }
  ${useFieldVisibility_PublicPetitionFieldFragmentDoc}
` as unknown as DocumentNode<RecipientViewContentsCard_PublicPetitionFieldFragment, unknown>;
export const RecipientViewProgressFooter_PublicPetitionFieldFragmentDoc = gql`
  fragment RecipientViewProgressFooter_PublicPetitionField on PublicPetitionField {
    id
    type
    optional
    isInternal
    isReadOnly
    replies {
      id
    }
    ...useFieldVisibility_PublicPetitionField
  }
  ${useFieldVisibility_PublicPetitionFieldFragmentDoc}
` as unknown as DocumentNode<RecipientViewProgressFooter_PublicPetitionFieldFragment, unknown>;
export const useLiquidScope_PublicPetitionFieldFragmentDoc = gql`
  fragment useLiquidScope_PublicPetitionField on PublicPetitionField {
    type
    multiple
    alias
    replies {
      content
    }
  }
` as unknown as DocumentNode<useLiquidScope_PublicPetitionFieldFragment, unknown>;
export const RecipientView_PublicPetitionFieldFragmentDoc = gql`
  fragment RecipientView_PublicPetitionField on PublicPetitionField {
    id
    ...RecipientViewPetitionField_PublicPetitionField
    ...RecipientViewContentsCard_PublicPetitionField
    ...RecipientViewProgressFooter_PublicPetitionField
    ...useLiquidScope_PublicPetitionField
  }
  ${RecipientViewPetitionField_PublicPetitionFieldFragmentDoc}
  ${RecipientViewContentsCard_PublicPetitionFieldFragmentDoc}
  ${RecipientViewProgressFooter_PublicPetitionFieldFragmentDoc}
  ${useLiquidScope_PublicPetitionFieldFragmentDoc}
` as unknown as DocumentNode<RecipientView_PublicPetitionFieldFragment, unknown>;
export const groupFieldsByPages_PublicPetitionFieldFragmentDoc = gql`
  fragment groupFieldsByPages_PublicPetitionField on PublicPetitionField {
    id
    type
    visibility
    options
    isInternal
  }
` as unknown as DocumentNode<groupFieldsByPages_PublicPetitionFieldFragment, unknown>;
export const useGetPageFields_PublicPetitionFieldFragmentDoc = gql`
  fragment useGetPageFields_PublicPetitionField on PublicPetitionField {
    id
    ...groupFieldsByPages_PublicPetitionField
    ...useFieldVisibility_PublicPetitionField
  }
  ${groupFieldsByPages_PublicPetitionFieldFragmentDoc}
  ${useFieldVisibility_PublicPetitionFieldFragmentDoc}
` as unknown as DocumentNode<useGetPageFields_PublicPetitionFieldFragment, unknown>;
export const useRecipientViewConfirmPetitionSignersDialog_PetitionSignerFragmentDoc = gql`
  fragment useRecipientViewConfirmPetitionSignersDialog_PetitionSigner on PetitionSigner {
    firstName
    lastName
    fullName
    email
    ...SelectedSignerRow_PetitionSigner
    ...SuggestedSigners_PetitionSigner
  }
  ${SelectedSignerRow_PetitionSignerFragmentDoc}
  ${SuggestedSigners_PetitionSignerFragmentDoc}
` as unknown as DocumentNode<
  useRecipientViewConfirmPetitionSignersDialog_PetitionSignerFragment,
  unknown
>;
export const RecipientViewHeader_PublicContactFragmentDoc = gql`
  fragment RecipientViewHeader_PublicContact on PublicContact {
    id
    fullName
    firstName
    email
  }
` as unknown as DocumentNode<RecipientViewHeader_PublicContactFragment, unknown>;
export const RecipientViewContentsCard_PublicPetitionFragmentDoc = gql`
  fragment RecipientViewContentsCard_PublicPetition on PublicPetition {
    fields {
      ...RecipientViewContentsCard_PublicPetitionField
    }
  }
  ${RecipientViewContentsCard_PublicPetitionFieldFragmentDoc}
` as unknown as DocumentNode<RecipientViewContentsCard_PublicPetitionFragment, unknown>;
export const RecipientViewProgressFooter_PublicPetitionFragmentDoc = gql`
  fragment RecipientViewProgressFooter_PublicPetition on PublicPetition {
    status
    fields {
      ...RecipientViewProgressFooter_PublicPetitionField
    }
    signatureConfig {
      review
    }
  }
  ${RecipientViewProgressFooter_PublicPetitionFieldFragmentDoc}
` as unknown as DocumentNode<RecipientViewProgressFooter_PublicPetitionFragment, unknown>;
export const RecipientView_PublicPetitionFragmentDoc = gql`
  fragment RecipientView_PublicPetition on PublicPetition {
    id
    status
    deadline
    isRecipientViewContentsHidden
    tone
    fields {
      ...RecipientView_PublicPetitionField
      ...useGetPageFields_PublicPetitionField
    }
    signatureConfig {
      review
      allowAdditionalSigners
      signers {
        fullName
        ...useRecipientViewConfirmPetitionSignersDialog_PetitionSigner
      }
      additionalSigners {
        ...useRecipientViewConfirmPetitionSignersDialog_PetitionSigner
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
  ${useGetPageFields_PublicPetitionFieldFragmentDoc}
  ${useRecipientViewConfirmPetitionSignersDialog_PetitionSignerFragmentDoc}
  ${RecipientViewHeader_PublicContactFragmentDoc}
  ${RecipientViewContentsCard_PublicPetitionFragmentDoc}
  ${RecipientViewProgressFooter_PublicPetitionFragmentDoc}
` as unknown as DocumentNode<RecipientView_PublicPetitionFragment, unknown>;
export const useRecipientViewConfirmPetitionSignersDialog_PublicContactFragmentDoc = gql`
  fragment useRecipientViewConfirmPetitionSignersDialog_PublicContact on PublicContact {
    firstName
    lastName
    email
  }
` as unknown as DocumentNode<
  useRecipientViewConfirmPetitionSignersDialog_PublicContactFragment,
  unknown
>;
export const RecipientViewHeader_PublicUserFragmentDoc = gql`
  fragment RecipientViewHeader_PublicUser on PublicUser {
    id
    firstName
    fullName
    email
    organization {
      name
      logoUrl
    }
  }
` as unknown as DocumentNode<RecipientViewHeader_PublicUserFragment, unknown>;
export const RecipientViewContentsCard_PublicUserFragmentDoc = gql`
  fragment RecipientViewContentsCard_PublicUser on PublicUser {
    firstName
  }
` as unknown as DocumentNode<RecipientViewContentsCard_PublicUserFragment, unknown>;
export const RecipientView_PublicUserFragmentDoc = gql`
  fragment RecipientView_PublicUser on PublicUser {
    ...RecipientViewHeader_PublicUser
    ...RecipientViewContentsCard_PublicUser
  }
  ${RecipientViewHeader_PublicUserFragmentDoc}
  ${RecipientViewContentsCard_PublicUserFragmentDoc}
` as unknown as DocumentNode<RecipientView_PublicUserFragment, unknown>;
export const RecipientView_PublicPetitionMessageFragmentDoc = gql`
  fragment RecipientView_PublicPetitionMessage on PublicPetitionMessage {
    id
    subject
  }
` as unknown as DocumentNode<RecipientView_PublicPetitionMessageFragment, unknown>;
export const RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccessFragmentDoc = gql`
  fragment RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccess on PublicPetitionAccess {
    granter {
      fullName
    }
    contact {
      id
    }
  }
` as unknown as DocumentNode<
  RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccessFragment,
  unknown
>;
export const RecipientViewPetitionField_PublicPetitionAccessFragmentDoc = gql`
  fragment RecipientViewPetitionField_PublicPetitionAccess on PublicPetitionAccess {
    ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccess
  }
  ${RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccessFragmentDoc}
` as unknown as DocumentNode<RecipientViewPetitionField_PublicPetitionAccessFragment, unknown>;
export const RecipientView_PublicPetitionAccessFragmentDoc = gql`
  fragment RecipientView_PublicPetitionAccess on PublicPetitionAccess {
    petition {
      ...RecipientView_PublicPetition
      recipients {
        ...useRecipientViewConfirmPetitionSignersDialog_PublicContact
      }
    }
    granter {
      ...RecipientView_PublicUser
    }
    contact {
      ...RecipientViewHeader_PublicContact
      ...useRecipientViewConfirmPetitionSignersDialog_PublicContact
    }
    message {
      ...RecipientView_PublicPetitionMessage
    }
    ...RecipientViewPetitionField_PublicPetitionAccess
  }
  ${RecipientView_PublicPetitionFragmentDoc}
  ${useRecipientViewConfirmPetitionSignersDialog_PublicContactFragmentDoc}
  ${RecipientView_PublicUserFragmentDoc}
  ${RecipientViewHeader_PublicContactFragmentDoc}
  ${RecipientView_PublicPetitionMessageFragmentDoc}
  ${RecipientViewPetitionField_PublicPetitionAccessFragmentDoc}
` as unknown as DocumentNode<RecipientView_PublicPetitionAccessFragment, unknown>;
export const OptOut_PublicUserFragmentDoc = gql`
  fragment OptOut_PublicUser on PublicUser {
    id
    organization {
      name
      logoUrl
    }
  }
` as unknown as DocumentNode<OptOut_PublicUserFragment, unknown>;
export const OptOut_PublicPetitionAccessFragmentDoc = gql`
  fragment OptOut_PublicPetitionAccess on PublicPetitionAccess {
    granter {
      ...OptOut_PublicUser
    }
  }
  ${OptOut_PublicUserFragmentDoc}
` as unknown as DocumentNode<OptOut_PublicPetitionAccessFragment, unknown>;
export const PublicPetitionLink_PublicPublicPetitionLinkFragmentDoc = gql`
  fragment PublicPetitionLink_PublicPublicPetitionLink on PublicPublicPetitionLink {
    title
    isAvailable
    description
    owner {
      fullName
      email
      organization {
        name
        logoUrl
      }
    }
  }
` as unknown as DocumentNode<PublicPetitionLink_PublicPublicPetitionLinkFragment, unknown>;
export const PetitionPdf_PetitionFieldFragmentDoc = gql`
  fragment PetitionPdf_PetitionField on PetitionField {
    id
    type
    title
    options
    description
    showInPdf
    replies {
      id
      status
      content
    }
    ...groupFieldsByPages_PetitionField
    ...useFieldVisibility_PetitionField
  }
  ${groupFieldsByPages_PetitionFieldFragmentDoc}
  ${useFieldVisibility_PetitionFieldFragmentDoc}
` as unknown as DocumentNode<PetitionPdf_PetitionFieldFragment, unknown>;
export const PetitionPdf_PetitionFragmentDoc = gql`
  fragment PetitionPdf_Petition on Petition {
    id
    name
    fields {
      options
      ...PetitionPdf_PetitionField
      ...useLiquidScope_PetitionField
    }
    organization {
      name
      logoUrl
    }
    fromTemplateId
    currentSignatureRequest {
      signatureConfig {
        signers {
          fullName
          email
        }
        timezone
      }
    }
  }
  ${PetitionPdf_PetitionFieldFragmentDoc}
  ${useLiquidScope_PetitionFieldFragmentDoc}
` as unknown as DocumentNode<PetitionPdf_PetitionFragment, unknown>;
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
    publicLinkUrl
    fields {
      id
      type
      title
    }
  }
` as unknown as DocumentNode<LandingTemplateDetails_LandingTemplateFragment, unknown>;
export const LandintTemplatesCategory_LandingTemplateCategorySampleFragmentDoc = gql`
  fragment LandintTemplatesCategory_LandingTemplateCategorySample on LandingTemplateCategorySample {
    category
    templates(locale: $locale) {
      totalCount
    }
  }
` as unknown as DocumentNode<
  LandintTemplatesCategory_LandingTemplateCategorySampleFragment,
  unknown
>;
export const ConfirmDeletePetitionsDialog_PetitionBaseFragmentDoc = gql`
  fragment ConfirmDeletePetitionsDialog_PetitionBase on PetitionBase {
    id
    name
  }
` as unknown as DocumentNode<ConfirmDeletePetitionsDialog_PetitionBaseFragment, unknown>;
export const useUpdateIsReadNotification_PetitionFieldCommentFragmentDoc = gql`
  fragment useUpdateIsReadNotification_PetitionFieldComment on PetitionFieldComment {
    id
    isUnread
  }
` as unknown as DocumentNode<useUpdateIsReadNotification_PetitionFieldCommentFragment, unknown>;
export const isAdmin_UserFragmentDoc = gql`
  fragment isAdmin_User on User {
    role
  }
` as unknown as DocumentNode<isAdmin_UserFragment, unknown>;
export const uploadFile_AWSPresignedPostDataFragmentDoc = gql`
  fragment uploadFile_AWSPresignedPostData on AWSPresignedPostData {
    url
    fields
  }
` as unknown as DocumentNode<uploadFile_AWSPresignedPostDataFragment, unknown>;
export const PetitionTagListCellContent_tagsDocument = gql`
  query PetitionTagListCellContent_tags($search: String) {
    tags(search: $search) {
      items {
        ...PetitionTagListCellContent_Tag
      }
    }
  }
  ${PetitionTagListCellContent_TagFragmentDoc}
` as unknown as DocumentNode<
  PetitionTagListCellContent_tagsQuery,
  PetitionTagListCellContent_tagsQueryVariables
>;
export const PetitionTagListCellContent_tagPetitionDocument = gql`
  mutation PetitionTagListCellContent_tagPetition($tagId: GID!, $petitionId: GID!) {
    tagPetition(tagId: $tagId, petitionId: $petitionId) {
      id
      tags {
        ...PetitionTagListCellContent_Tag
      }
    }
  }
  ${PetitionTagListCellContent_TagFragmentDoc}
` as unknown as DocumentNode<
  PetitionTagListCellContent_tagPetitionMutation,
  PetitionTagListCellContent_tagPetitionMutationVariables
>;
export const PetitionTagListCellContent_untagPetitionDocument = gql`
  mutation PetitionTagListCellContent_untagPetition($tagId: GID!, $petitionId: GID!) {
    untagPetition(tagId: $tagId, petitionId: $petitionId) {
      id
      tags {
        ...PetitionTagListCellContent_Tag
      }
    }
  }
  ${PetitionTagListCellContent_TagFragmentDoc}
` as unknown as DocumentNode<
  PetitionTagListCellContent_untagPetitionMutation,
  PetitionTagListCellContent_untagPetitionMutationVariables
>;
export const PetitionTagListCellContent_createTagDocument = gql`
  mutation PetitionTagListCellContent_createTag($name: String!, $color: String!) {
    createTag(name: $name, color: $color) {
      ...PetitionTagListCellContent_Tag
    }
  }
  ${PetitionTagListCellContent_TagFragmentDoc}
` as unknown as DocumentNode<
  PetitionTagListCellContent_createTagMutation,
  PetitionTagListCellContent_createTagMutationVariables
>;
export const useSearchUserGroups_searchUserGroupsDocument = gql`
  query useSearchUserGroups_searchUserGroups($search: String!, $excludeUserGroups: [GID!]) {
    searchUserGroups(search: $search, excludeUserGroups: $excludeUserGroups) {
      ...UserSelect_UserGroup
    }
  }
  ${UserSelect_UserGroupFragmentDoc}
` as unknown as DocumentNode<
  useSearchUserGroups_searchUserGroupsQuery,
  useSearchUserGroups_searchUserGroupsQueryVariables
>;
export const UserSelect_canCreateUsersDocument = gql`
  query UserSelect_canCreateUsers {
    me {
      canCreateUsers
    }
  }
` as unknown as DocumentNode<
  UserSelect_canCreateUsersQuery,
  UserSelect_canCreateUsersQueryVariables
>;
export const UserSelect_useGetUsersOrGroupsDocument = gql`
  query UserSelect_useGetUsersOrGroups($ids: [ID!]!) {
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
  ${UserSelect_UserGroupFragmentDoc}
` as unknown as DocumentNode<
  UserSelect_useGetUsersOrGroupsQuery,
  UserSelect_useGetUsersOrGroupsQueryVariables
>;
export const useSearchUsers_searchUsersDocument = gql`
  query useSearchUsers_searchUsers(
    $search: String!
    $excludeUsers: [GID!]
    $excludeUserGroups: [GID!]
    $includeGroups: Boolean
    $includeInactive: Boolean
  ) {
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
  ${UserSelect_UserGroupFragmentDoc}
` as unknown as DocumentNode<
  useSearchUsers_searchUsersQuery,
  useSearchUsers_searchUsersQueryVariables
>;
export const TagEditDialog_tagsDocument = gql`
  query TagEditDialog_tags {
    tags {
      items {
        ...TagEditDialog_Tag
      }
    }
  }
  ${TagEditDialog_TagFragmentDoc}
` as unknown as DocumentNode<TagEditDialog_tagsQuery, TagEditDialog_tagsQueryVariables>;
export const TagEditDialog_updateTagDocument = gql`
  mutation TagEditDialog_updateTag($id: GID!, $data: UpdateTagInput!) {
    updateTag(id: $id, data: $data) {
      ...TagEditDialog_Tag
    }
  }
  ${TagEditDialog_TagFragmentDoc}
` as unknown as DocumentNode<
  TagEditDialog_updateTagMutation,
  TagEditDialog_updateTagMutationVariables
>;
export const WithAdminOrganizationRoleDocument = gql`
  query WithAdminOrganizationRole {
    me {
      role
    }
  }
` as unknown as DocumentNode<
  WithAdminOrganizationRoleQuery,
  WithAdminOrganizationRoleQueryVariables
>;
export const HasFeatureFlagDocument = gql`
  query HasFeatureFlag($featureFlag: FeatureFlag!) {
    me {
      id
      hasFeatureFlag: hasFeatureFlag(featureFlag: $featureFlag)
    }
  }
` as unknown as DocumentNode<HasFeatureFlagQuery, HasFeatureFlagQueryVariables>;
export const WithSuperAdminAccessDocument = gql`
  query WithSuperAdminAccess {
    me {
      isSuperAdmin
    }
  }
` as unknown as DocumentNode<WithSuperAdminAccessQuery, WithSuperAdminAccessQueryVariables>;
export const ImportContactsDialog_bulkCreateContactsDocument = gql`
  mutation ImportContactsDialog_bulkCreateContacts($file: Upload!) {
    bulkCreateContacts(file: $file) {
      id
    }
  }
` as unknown as DocumentNode<
  ImportContactsDialog_bulkCreateContactsMutation,
  ImportContactsDialog_bulkCreateContactsMutationVariables
>;
export const PetitionHeader_reopenPetitionDocument = gql`
  mutation PetitionHeader_reopenPetition($petitionId: GID!) {
    reopenPetition(petitionId: $petitionId) {
      id
      status
      updatedAt
    }
  }
` as unknown as DocumentNode<
  PetitionHeader_reopenPetitionMutation,
  PetitionHeader_reopenPetitionMutationVariables
>;
export const PetitionHeader_updatePetitionPermissionSubscriptionDocument = gql`
  mutation PetitionHeader_updatePetitionPermissionSubscription(
    $petitionId: GID!
    $isSubscribed: Boolean!
  ) {
    updatePetitionPermissionSubscription(petitionId: $petitionId, isSubscribed: $isSubscribed) {
      id
      myEffectivePermission {
        isSubscribed
      }
    }
  }
` as unknown as DocumentNode<
  PetitionHeader_updatePetitionPermissionSubscriptionMutation,
  PetitionHeader_updatePetitionPermissionSubscriptionMutationVariables
>;
export const Notifications_UnreadPetitionUserNotificationIdsDocument = gql`
  query Notifications_UnreadPetitionUserNotificationIds {
    me {
      id
      unreadNotificationIds
    }
  }
` as unknown as DocumentNode<
  Notifications_UnreadPetitionUserNotificationIdsQuery,
  Notifications_UnreadPetitionUserNotificationIdsQueryVariables
>;
export const NotificationsDrawer_notificationsDocument = gql`
  query NotificationsDrawer_notifications(
    $limit: Int!
    $before: DateTime
    $filter: PetitionUserNotificationFilter
  ) {
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
  ${NotificationsDrawer_PetitionUserNotificationFragmentDoc}
` as unknown as DocumentNode<
  NotificationsDrawer_notificationsQuery,
  NotificationsDrawer_notificationsQueryVariables
>;
export const CreateUserDialog_emailIsAvailableDocument = gql`
  query CreateUserDialog_emailIsAvailable($email: String!) {
    emailIsAvailable(email: $email)
  }
` as unknown as DocumentNode<
  CreateUserDialog_emailIsAvailableQuery,
  CreateUserDialog_emailIsAvailableQueryVariables
>;
export const PetitionSharingModal_addPetitionPermissionDocument = gql`
  mutation PetitionSharingModal_addPetitionPermission(
    $petitionIds: [GID!]!
    $userIds: [GID!]
    $userGroupIds: [GID!]
    $permissionType: PetitionPermissionTypeRW!
    $notify: Boolean
    $subscribe: Boolean
    $message: String
  ) {
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
  ${PetitionSharingModal_PetitionFragmentDoc}
` as unknown as DocumentNode<
  PetitionSharingModal_addPetitionPermissionMutation,
  PetitionSharingModal_addPetitionPermissionMutationVariables
>;
export const PetitionSharingModal_removePetitionPermissionDocument = gql`
  mutation PetitionSharingModal_removePetitionPermission(
    $petitionId: GID!
    $userIds: [GID!]
    $userGroupIds: [GID!]
  ) {
    removePetitionPermission(
      petitionIds: [$petitionId]
      userIds: $userIds
      userGroupIds: $userGroupIds
    ) {
      ...PetitionSharingModal_Petition
    }
  }
  ${PetitionSharingModal_PetitionFragmentDoc}
` as unknown as DocumentNode<
  PetitionSharingModal_removePetitionPermissionMutation,
  PetitionSharingModal_removePetitionPermissionMutationVariables
>;
export const PetitionSharingModal_transferPetitionOwnershipDocument = gql`
  mutation PetitionSharingModal_transferPetitionOwnership($petitionId: GID!, $userId: GID!) {
    transferPetitionOwnership(petitionIds: [$petitionId], userId: $userId) {
      ...PetitionSharingModal_Petition
    }
  }
  ${PetitionSharingModal_PetitionFragmentDoc}
` as unknown as DocumentNode<
  PetitionSharingModal_transferPetitionOwnershipMutation,
  PetitionSharingModal_transferPetitionOwnershipMutationVariables
>;
export const PetitionSharingModal_petitionsDocument = gql`
  query PetitionSharingModal_petitions($petitionIds: [GID!]!) {
    petitionsById(ids: $petitionIds) {
      ...PetitionSharingModal_Petition
    }
  }
  ${PetitionSharingModal_PetitionFragmentDoc}
` as unknown as DocumentNode<
  PetitionSharingModal_petitionsQuery,
  PetitionSharingModal_petitionsQueryVariables
>;
export const PublicLinkSettingsDialog_getSlugDocument = gql`
  query PublicLinkSettingsDialog_getSlug($petitionName: String) {
    getSlugForPublicPetitionLink(petitionName: $petitionName)
  }
` as unknown as DocumentNode<
  PublicLinkSettingsDialog_getSlugQuery,
  PublicLinkSettingsDialog_getSlugQueryVariables
>;
export const PublicLinkSettingsDialog_isValidSlugDocument = gql`
  query PublicLinkSettingsDialog_isValidSlug($slug: String!) {
    isValidPublicPetitionLinkSlug(slug: $slug)
  }
` as unknown as DocumentNode<
  PublicLinkSettingsDialog_isValidSlugQuery,
  PublicLinkSettingsDialog_isValidSlugQueryVariables
>;
export const useSendPetitionHandler_bulkSendPetitionDocument = gql`
  mutation useSendPetitionHandler_bulkSendPetition(
    $petitionId: GID!
    $contactIdGroups: [[GID!]!]!
    $subject: String!
    $body: JSON!
    $remindersConfig: RemindersConfigInput
    $scheduledAt: DateTime
    $bulkSendSigningMode: BulkSendSigningMode
  ) {
    bulkSendPetition(
      petitionId: $petitionId
      contactIdGroups: $contactIdGroups
      subject: $subject
      body: $body
      remindersConfig: $remindersConfig
      scheduledAt: $scheduledAt
      bulkSendSigningMode: $bulkSendSigningMode
    ) {
      result
      petition {
        id
        status
      }
    }
  }
` as unknown as DocumentNode<
  useSendPetitionHandler_bulkSendPetitionMutation,
  useSendPetitionHandler_bulkSendPetitionMutationVariables
>;
export const PetitionComposeField_createPetitionFieldAttachmentUploadLinkDocument = gql`
  mutation PetitionComposeField_createPetitionFieldAttachmentUploadLink(
    $petitionId: GID!
    $fieldId: GID!
    $data: FileUploadInput!
  ) {
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
        field {
          id
          attachments {
            id
          }
        }
      }
    }
  }
  ${uploadFile_AWSPresignedPostDataFragmentDoc}
  ${PetitionComposeField_PetitionFieldAttachmentFragmentDoc}
` as unknown as DocumentNode<
  PetitionComposeField_createPetitionFieldAttachmentUploadLinkMutation,
  PetitionComposeField_createPetitionFieldAttachmentUploadLinkMutationVariables
>;
export const PetitionComposeField_petitionFieldAttachmentUploadCompleteDocument = gql`
  mutation PetitionComposeField_petitionFieldAttachmentUploadComplete(
    $petitionId: GID!
    $fieldId: GID!
    $attachmentId: GID!
  ) {
    petitionFieldAttachmentUploadComplete(
      petitionId: $petitionId
      fieldId: $fieldId
      attachmentId: $attachmentId
    ) {
      ...PetitionComposeField_PetitionFieldAttachment
    }
  }
  ${PetitionComposeField_PetitionFieldAttachmentFragmentDoc}
` as unknown as DocumentNode<
  PetitionComposeField_petitionFieldAttachmentUploadCompleteMutation,
  PetitionComposeField_petitionFieldAttachmentUploadCompleteMutationVariables
>;
export const PetitionComposeField_deletePetitionFieldAttachmentDocument = gql`
  mutation PetitionComposeField_deletePetitionFieldAttachment(
    $petitionId: GID!
    $fieldId: GID!
    $attachmentId: GID!
  ) {
    deletePetitionFieldAttachment(
      petitionId: $petitionId
      fieldId: $fieldId
      attachmentId: $attachmentId
    ) {
      id
      attachments {
        id
      }
    }
  }
` as unknown as DocumentNode<
  PetitionComposeField_deletePetitionFieldAttachmentMutation,
  PetitionComposeField_deletePetitionFieldAttachmentMutationVariables
>;
export const PetitionComposeField_petitionFieldAttachmentDownloadLinkDocument = gql`
  mutation PetitionComposeField_petitionFieldAttachmentDownloadLink(
    $petitionId: GID!
    $fieldId: GID!
    $attachmentId: GID!
  ) {
    petitionFieldAttachmentDownloadLink(
      petitionId: $petitionId
      fieldId: $fieldId
      attachmentId: $attachmentId
    ) {
      url
    }
  }
` as unknown as DocumentNode<
  PetitionComposeField_petitionFieldAttachmentDownloadLinkMutation,
  PetitionComposeField_petitionFieldAttachmentDownloadLinkMutationVariables
>;
export const PetitionSettings_updatePetitionRestrictionDocument = gql`
  mutation PetitionSettings_updatePetitionRestriction(
    $petitionId: GID!
    $isRestricted: Boolean!
    $password: String
  ) {
    updatePetitionRestriction(
      petitionId: $petitionId
      isRestricted: $isRestricted
      password: $password
    ) {
      id
      isRestricted
      isRestrictedWithPassword
    }
  }
` as unknown as DocumentNode<
  PetitionSettings_updatePetitionRestrictionMutation,
  PetitionSettings_updatePetitionRestrictionMutationVariables
>;
export const PetitionSettings_cancelPetitionSignatureRequestDocument = gql`
  mutation PetitionSettings_cancelPetitionSignatureRequest($petitionSignatureRequestId: GID!) {
    cancelSignatureRequest(petitionSignatureRequestId: $petitionSignatureRequestId) {
      id
      status
    }
  }
` as unknown as DocumentNode<
  PetitionSettings_cancelPetitionSignatureRequestMutation,
  PetitionSettings_cancelPetitionSignatureRequestMutationVariables
>;
export const PetitionSettings_startPetitionSignatureRequestDocument = gql`
  mutation PetitionSettings_startPetitionSignatureRequest($petitionId: GID!) {
    startSignatureRequest(petitionId: $petitionId) {
      id
      status
    }
  }
` as unknown as DocumentNode<
  PetitionSettings_startPetitionSignatureRequestMutation,
  PetitionSettings_startPetitionSignatureRequestMutationVariables
>;
export const PetitionSettings_createPublicPetitionLinkDocument = gql`
  mutation PetitionSettings_createPublicPetitionLink(
    $templateId: GID!
    $title: String!
    $description: String!
    $slug: String
  ) {
    createPublicPetitionLink(
      templateId: $templateId
      title: $title
      description: $description
      slug: $slug
    ) {
      ...PublicLinkSettingsDialog_PublicPetitionLink
      template {
        id
        publicLink {
          id
        }
      }
    }
  }
  ${PublicLinkSettingsDialog_PublicPetitionLinkFragmentDoc}
` as unknown as DocumentNode<
  PetitionSettings_createPublicPetitionLinkMutation,
  PetitionSettings_createPublicPetitionLinkMutationVariables
>;
export const PetitionSettings_updatePublicPetitionLinkDocument = gql`
  mutation PetitionSettings_updatePublicPetitionLink(
    $publicPetitionLinkId: GID!
    $isActive: Boolean
    $title: String
    $description: String
    $slug: String
  ) {
    updatePublicPetitionLink(
      publicPetitionLinkId: $publicPetitionLinkId
      isActive: $isActive
      title: $title
      description: $description
      slug: $slug
    ) {
      ...PublicLinkSettingsDialog_PublicPetitionLink
      template {
        id
        publicLink {
          id
        }
      }
    }
  }
  ${PublicLinkSettingsDialog_PublicPetitionLinkFragmentDoc}
` as unknown as DocumentNode<
  PetitionSettings_updatePublicPetitionLinkMutation,
  PetitionSettings_updatePublicPetitionLinkMutationVariables
>;
export const PetitionSettings_updateTemplateDefaultPermissionsDocument = gql`
  mutation PetitionSettings_updateTemplateDefaultPermissions(
    $templateId: GID!
    $permissions: [UserOrUserGroupPermissionInput!]!
  ) {
    updateTemplateDefaultPermissions(templateId: $templateId, permissions: $permissions) {
      id
      defaultPermissions {
        ...TemplateDefaultPermissionsDialog_TemplateDefaultPermission
      }
      publicLink {
        id
        isActive
      }
    }
  }
  ${TemplateDefaultPermissionsDialog_TemplateDefaultPermissionFragmentDoc}
` as unknown as DocumentNode<
  PetitionSettings_updateTemplateDefaultPermissionsMutation,
  PetitionSettings_updateTemplateDefaultPermissionsMutationVariables
>;
export const DynamicSelectSettings_uploadDynamicSelectFieldFileDocument = gql`
  mutation DynamicSelectSettings_uploadDynamicSelectFieldFile(
    $petitionId: GID!
    $fieldId: GID!
    $file: Upload!
  ) {
    uploadDynamicSelectFieldFile(petitionId: $petitionId, fieldId: $fieldId, file: $file) {
      id
      options
    }
  }
` as unknown as DocumentNode<
  DynamicSelectSettings_uploadDynamicSelectFieldFileMutation,
  DynamicSelectSettings_uploadDynamicSelectFieldFileMutationVariables
>;
export const DynamicSelectSettings_dynamicSelectFieldFileDownloadLinkDocument = gql`
  mutation DynamicSelectSettings_dynamicSelectFieldFileDownloadLink(
    $petitionId: GID!
    $fieldId: GID!
  ) {
    dynamicSelectFieldFileDownloadLink(petitionId: $petitionId, fieldId: $fieldId) {
      result
      url
    }
  }
` as unknown as DocumentNode<
  DynamicSelectSettings_dynamicSelectFieldFileDownloadLinkMutation,
  DynamicSelectSettings_dynamicSelectFieldFileDownloadLinkMutationVariables
>;
export const PetitionListTagFilter_tagsDocument = gql`
  query PetitionListTagFilter_tags($search: String) {
    tags(search: $search) {
      items {
        ...PetitionTagListCellContent_Tag
      }
    }
  }
  ${PetitionTagListCellContent_TagFragmentDoc}
` as unknown as DocumentNode<
  PetitionListTagFilter_tagsQuery,
  PetitionListTagFilter_tagsQueryVariables
>;
export const PreviewPetitionField_petitionFieldAttachmentDownloadLinkDocument = gql`
  mutation PreviewPetitionField_petitionFieldAttachmentDownloadLink(
    $petitionId: GID!
    $fieldId: GID!
    $attachmentId: GID!
  ) {
    petitionFieldAttachmentDownloadLink(
      petitionId: $petitionId
      fieldId: $fieldId
      attachmentId: $attachmentId
    ) {
      url
    }
  }
` as unknown as DocumentNode<
  PreviewPetitionField_petitionFieldAttachmentDownloadLinkMutation,
  PreviewPetitionField_petitionFieldAttachmentDownloadLinkMutationVariables
>;
export const PreviewPetitionFieldMutations_deletePetitionReplyDocument = gql`
  mutation PreviewPetitionFieldMutations_deletePetitionReply($petitionId: GID!, $replyId: GID!) {
    deletePetitionReply(petitionId: $petitionId, replyId: $replyId) {
      id
      petition {
        id
        ... on Petition {
          status
        }
      }
      replies {
        id
      }
    }
  }
` as unknown as DocumentNode<
  PreviewPetitionFieldMutations_deletePetitionReplyMutation,
  PreviewPetitionFieldMutations_deletePetitionReplyMutationVariables
>;
export const PreviewPetitionFieldMutations_updatePetitionFieldReplyDocument = gql`
  mutation PreviewPetitionFieldMutations_updatePetitionFieldReply(
    $petitionId: GID!
    $replyId: GID!
    $reply: JSON!
  ) {
    updatePetitionFieldReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
      id
      content
      status
      updatedAt
      field {
        id
        petition {
          id
          ... on Petition {
            status
          }
        }
      }
    }
  }
` as unknown as DocumentNode<
  PreviewPetitionFieldMutations_updatePetitionFieldReplyMutation,
  PreviewPetitionFieldMutations_updatePetitionFieldReplyMutationVariables
>;
export const PreviewPetitionFieldMutations_createPetitionFieldReplyDocument = gql`
  mutation PreviewPetitionFieldMutations_createPetitionFieldReply(
    $petitionId: GID!
    $fieldId: GID!
    $reply: JSON!
  ) {
    createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
      ...RecipientViewPetitionFieldCard_PetitionFieldReply
      field {
        id
        petition {
          id
          ... on Petition {
            status
          }
        }
        replies {
          id
        }
      }
    }
  }
  ${RecipientViewPetitionFieldCard_PetitionFieldReplyFragmentDoc}
` as unknown as DocumentNode<
  PreviewPetitionFieldMutations_createPetitionFieldReplyMutation,
  PreviewPetitionFieldMutations_createPetitionFieldReplyMutationVariables
>;
export const PreviewPetitionFieldMutations_createFileUploadReplyDocument = gql`
  mutation PreviewPetitionFieldMutations_createFileUploadReply(
    $petitionId: GID!
    $fieldId: GID!
    $file: FileUploadInput!
  ) {
    createFileUploadReply(petitionId: $petitionId, fieldId: $fieldId, file: $file) {
      presignedPostData {
        ...uploadFile_AWSPresignedPostData
      }
      reply {
        ...RecipientViewPetitionFieldCard_PetitionFieldReply
        field {
          id
          petition {
            id
            ... on Petition {
              status
            }
          }
          replies {
            id
          }
        }
      }
    }
  }
  ${uploadFile_AWSPresignedPostDataFragmentDoc}
  ${RecipientViewPetitionFieldCard_PetitionFieldReplyFragmentDoc}
` as unknown as DocumentNode<
  PreviewPetitionFieldMutations_createFileUploadReplyMutation,
  PreviewPetitionFieldMutations_createFileUploadReplyMutationVariables
>;
export const PreviewPetitionFieldMutations_createFileUploadReplyCompleteDocument = gql`
  mutation PreviewPetitionFieldMutations_createFileUploadReplyComplete(
    $petitionId: GID!
    $replyId: GID!
  ) {
    createFileUploadReplyComplete(petitionId: $petitionId, replyId: $replyId) {
      id
      content
    }
  }
` as unknown as DocumentNode<
  PreviewPetitionFieldMutations_createFileUploadReplyCompleteMutation,
  PreviewPetitionFieldMutations_createFileUploadReplyCompleteMutationVariables
>;
export const PreviewPetitionFieldCommentsDialog_userDocument = gql`
  query PreviewPetitionFieldCommentsDialog_user {
    me {
      id
      hasInternalComments: hasFeatureFlag(featureFlag: INTERNAL_COMMENTS)
    }
  }
` as unknown as DocumentNode<
  PreviewPetitionFieldCommentsDialog_userQuery,
  PreviewPetitionFieldCommentsDialog_userQueryVariables
>;
export const PreviewPetitionFieldCommentsDialog_petitionFieldQueryDocument = gql`
  query PreviewPetitionFieldCommentsDialog_petitionFieldQuery(
    $petitionId: GID!
    $petitionFieldId: GID!
  ) {
    petitionField(petitionId: $petitionId, petitionFieldId: $petitionFieldId) {
      ...PreviewPetitionFieldCommentsDialog_PetitionField
    }
  }
  ${PreviewPetitionFieldCommentsDialog_PetitionFieldFragmentDoc}
` as unknown as DocumentNode<
  PreviewPetitionFieldCommentsDialog_petitionFieldQueryQuery,
  PreviewPetitionFieldCommentsDialog_petitionFieldQueryQueryVariables
>;
export const PreviewPetitionFieldCommentsDialog_createPetitionFieldCommentDocument = gql`
  mutation PreviewPetitionFieldCommentsDialog_createPetitionFieldComment(
    $petitionId: GID!
    $petitionFieldId: GID!
    $content: String!
    $isInternal: Boolean
  ) {
    createPetitionFieldComment(
      petitionId: $petitionId
      petitionFieldId: $petitionFieldId
      content: $content
      isInternal: $isInternal
    ) {
      ...FieldComment_PetitionFieldComment
      field {
        id
        commentCount
        unreadCommentCount
        comments {
          id
        }
      }
    }
  }
  ${FieldComment_PetitionFieldCommentFragmentDoc}
` as unknown as DocumentNode<
  PreviewPetitionFieldCommentsDialog_createPetitionFieldCommentMutation,
  PreviewPetitionFieldCommentsDialog_createPetitionFieldCommentMutationVariables
>;
export const PreviewPetitionFieldCommentsDialog_updatePetitionFieldCommentDocument = gql`
  mutation PreviewPetitionFieldCommentsDialog_updatePetitionFieldComment(
    $petitionId: GID!
    $petitionFieldId: GID!
    $petitionFieldCommentId: GID!
    $content: String!
  ) {
    updatePetitionFieldComment(
      petitionId: $petitionId
      petitionFieldId: $petitionFieldId
      petitionFieldCommentId: $petitionFieldCommentId
      content: $content
    ) {
      ...FieldComment_PetitionFieldComment
      field {
        id
        comments {
          id
        }
      }
    }
  }
  ${FieldComment_PetitionFieldCommentFragmentDoc}
` as unknown as DocumentNode<
  PreviewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutation,
  PreviewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutationVariables
>;
export const PreviewPetitionFieldCommentsDialog_deletePetitionFieldCommentDocument = gql`
  mutation PreviewPetitionFieldCommentsDialog_deletePetitionFieldComment(
    $petitionId: GID!
    $petitionFieldId: GID!
    $petitionFieldCommentId: GID!
  ) {
    deletePetitionFieldComment(
      petitionId: $petitionId
      petitionFieldId: $petitionFieldId
      petitionFieldCommentId: $petitionFieldCommentId
    ) {
      ...PreviewPetitionFieldCommentsDialog_PetitionField
      commentCount
      unreadCommentCount
      comments {
        id
      }
    }
  }
  ${PreviewPetitionFieldCommentsDialog_PetitionFieldFragmentDoc}
` as unknown as DocumentNode<
  PreviewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutation,
  PreviewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutationVariables
>;
export const PetitionAttachmentsCard_petitionAttachmentDownloadLinkDocument = gql`
  mutation PetitionAttachmentsCard_petitionAttachmentDownloadLink(
    $petitionId: GID!
    $attachmentId: GID!
  ) {
    petitionAttachmentDownloadLink(petitionId: $petitionId, attachmentId: $attachmentId) {
      result
      url
    }
  }
` as unknown as DocumentNode<
  PetitionAttachmentsCard_petitionAttachmentDownloadLinkMutation,
  PetitionAttachmentsCard_petitionAttachmentDownloadLinkMutationVariables
>;
export const PetitionRepliesField_petitionFieldAttachmentDownloadLinkDocument = gql`
  mutation PetitionRepliesField_petitionFieldAttachmentDownloadLink(
    $petitionId: GID!
    $fieldId: GID!
    $attachmentId: GID!
  ) {
    petitionFieldAttachmentDownloadLink(
      petitionId: $petitionId
      fieldId: $fieldId
      attachmentId: $attachmentId
    ) {
      url
    }
  }
` as unknown as DocumentNode<
  PetitionRepliesField_petitionFieldAttachmentDownloadLinkMutation,
  PetitionRepliesField_petitionFieldAttachmentDownloadLinkMutationVariables
>;
export const PetitionSignaturesCard_updatePetitionSignatureConfigDocument = gql`
  mutation PetitionSignaturesCard_updatePetitionSignatureConfig(
    $petitionId: GID!
    $signatureConfig: SignatureConfigInput
  ) {
    updatePetition(petitionId: $petitionId, data: { signatureConfig: $signatureConfig }) {
      ... on Petition {
        ...PetitionSignaturesCard_Petition
      }
    }
  }
  ${PetitionSignaturesCard_PetitionFragmentDoc}
` as unknown as DocumentNode<
  PetitionSignaturesCard_updatePetitionSignatureConfigMutation,
  PetitionSignaturesCard_updatePetitionSignatureConfigMutationVariables
>;
export const PetitionSignaturesCard_cancelSignatureRequestDocument = gql`
  mutation PetitionSignaturesCard_cancelSignatureRequest($petitionSignatureRequestId: GID!) {
    cancelSignatureRequest(petitionSignatureRequestId: $petitionSignatureRequestId) {
      id
      status
    }
  }
` as unknown as DocumentNode<
  PetitionSignaturesCard_cancelSignatureRequestMutation,
  PetitionSignaturesCard_cancelSignatureRequestMutationVariables
>;
export const PetitionSignaturesCard_startSignatureRequestDocument = gql`
  mutation PetitionSignaturesCard_startSignatureRequest($petitionId: GID!, $message: String) {
    startSignatureRequest(petitionId: $petitionId, message: $message) {
      id
      status
    }
  }
` as unknown as DocumentNode<
  PetitionSignaturesCard_startSignatureRequestMutation,
  PetitionSignaturesCard_startSignatureRequestMutationVariables
>;
export const PetitionSignaturesCard_signedPetitionDownloadLinkDocument = gql`
  mutation PetitionSignaturesCard_signedPetitionDownloadLink(
    $petitionSignatureRequestId: GID!
    $preview: Boolean
  ) {
    signedPetitionDownloadLink(
      petitionSignatureRequestId: $petitionSignatureRequestId
      preview: $preview
    ) {
      result
      url
    }
  }
` as unknown as DocumentNode<
  PetitionSignaturesCard_signedPetitionDownloadLinkMutation,
  PetitionSignaturesCard_signedPetitionDownloadLinkMutationVariables
>;
export const PetitionSignaturesCard_sendSignatureRequestRemindersDocument = gql`
  mutation PetitionSignaturesCard_sendSignatureRequestReminders($petitionSignatureRequestId: GID!) {
    sendSignatureRequestReminders(petitionSignatureRequestId: $petitionSignatureRequestId)
  }
` as unknown as DocumentNode<
  PetitionSignaturesCard_sendSignatureRequestRemindersMutation,
  PetitionSignaturesCard_sendSignatureRequestRemindersMutationVariables
>;
export const ExportRepliesProgressDialog_petitionDocument = gql`
  query ExportRepliesProgressDialog_petition($petitionId: GID!) {
    petition(id: $petitionId) {
      ...ExportRepliesProgressDialog_Petition
    }
  }
  ${ExportRepliesProgressDialog_PetitionFragmentDoc}
` as unknown as DocumentNode<
  ExportRepliesProgressDialog_petitionQuery,
  ExportRepliesProgressDialog_petitionQueryVariables
>;
export const ExportRepliesProgressDialog_fileUploadReplyDownloadLinkDocument = gql`
  mutation ExportRepliesProgressDialog_fileUploadReplyDownloadLink(
    $petitionId: GID!
    $replyId: GID!
  ) {
    fileUploadReplyDownloadLink(petitionId: $petitionId, replyId: $replyId) {
      result
      url
    }
  }
` as unknown as DocumentNode<
  ExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutation,
  ExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutationVariables
>;
export const ExportRepliesProgressDialog_signedPetitionDownloadLinkDocument = gql`
  mutation ExportRepliesProgressDialog_signedPetitionDownloadLink(
    $petitionSignatureRequestId: GID!
    $downloadAuditTrail: Boolean
  ) {
    signedPetitionDownloadLink(
      petitionSignatureRequestId: $petitionSignatureRequestId
      downloadAuditTrail: $downloadAuditTrail
    ) {
      result
      url
    }
  }
` as unknown as DocumentNode<
  ExportRepliesProgressDialog_signedPetitionDownloadLinkMutation,
  ExportRepliesProgressDialog_signedPetitionDownloadLinkMutationVariables
>;
export const ExportRepliesProgressDialog_updatePetitionFieldReplyMetadataDocument = gql`
  mutation ExportRepliesProgressDialog_updatePetitionFieldReplyMetadata(
    $petitionId: GID!
    $replyId: GID!
    $metadata: JSONObject!
  ) {
    updatePetitionFieldReplyMetadata(
      petitionId: $petitionId
      replyId: $replyId
      metadata: $metadata
    ) {
      id
      metadata
    }
  }
` as unknown as DocumentNode<
  ExportRepliesProgressDialog_updatePetitionFieldReplyMetadataMutation,
  ExportRepliesProgressDialog_updatePetitionFieldReplyMetadataMutationVariables
>;
export const ExportRepliesProgressDialog_updateSignatureRequestMetadataDocument = gql`
  mutation ExportRepliesProgressDialog_updateSignatureRequestMetadata(
    $petitionSignatureRequestId: GID!
    $metadata: JSONObject!
  ) {
    updateSignatureRequestMetadata(
      petitionSignatureRequestId: $petitionSignatureRequestId
      metadata: $metadata
    ) {
      id
      metadata
    }
  }
` as unknown as DocumentNode<
  ExportRepliesProgressDialog_updateSignatureRequestMetadataMutation,
  ExportRepliesProgressDialog_updateSignatureRequestMetadataMutationVariables
>;
export const PublicSignupForm_emailIsAvailableDocument = gql`
  query PublicSignupForm_emailIsAvailable($email: String!) {
    emailIsAvailable(email: $email)
  }
` as unknown as DocumentNode<
  PublicSignupForm_emailIsAvailableQuery,
  PublicSignupForm_emailIsAvailableQueryVariables
>;
export const RecipientViewHeader_publicDelegateAccessToContactDocument = gql`
  mutation RecipientViewHeader_publicDelegateAccessToContact(
    $keycode: ID!
    $email: String!
    $firstName: String!
    $lastName: String!
    $messageBody: JSON!
  ) {
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
` as unknown as DocumentNode<
  RecipientViewHeader_publicDelegateAccessToContactMutation,
  RecipientViewHeader_publicDelegateAccessToContactMutationVariables
>;
export const RecipientViewPetitionFieldCommentsDialog_publicPetitionFieldDocument = gql`
  query RecipientViewPetitionFieldCommentsDialog_publicPetitionField(
    $keycode: ID!
    $petitionFieldId: GID!
  ) {
    publicPetitionField(keycode: $keycode, petitionFieldId: $petitionFieldId) {
      ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionField
      comments {
        id
        ...FieldComment_PublicPetitionFieldComment
      }
    }
  }
  ${RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldFragmentDoc}
  ${FieldComment_PublicPetitionFieldCommentFragmentDoc}
` as unknown as DocumentNode<
  RecipientViewPetitionFieldCommentsDialog_publicPetitionFieldQuery,
  RecipientViewPetitionFieldCommentsDialog_publicPetitionFieldQueryVariables
>;
export const RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadDocument = gql`
  mutation RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsRead(
    $keycode: ID!
    $petitionFieldCommentIds: [GID!]!
  ) {
    publicMarkPetitionFieldCommentsAsRead(
      keycode: $keycode
      petitionFieldCommentIds: $petitionFieldCommentIds
    ) {
      id
      isUnread
    }
  }
` as unknown as DocumentNode<
  RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutation,
  RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutationVariables
>;
export const RecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentDocument = gql`
  mutation RecipientViewPetitionFieldCommentsDialog_createPetitionFieldComment(
    $keycode: ID!
    $petitionFieldId: GID!
    $content: String!
  ) {
    publicCreatePetitionFieldComment(
      keycode: $keycode
      petitionFieldId: $petitionFieldId
      content: $content
    ) {
      ...FieldComment_PublicPetitionFieldComment
      field {
        id
        commentCount
        unreadCommentCount
        comments {
          id
        }
      }
    }
  }
  ${FieldComment_PublicPetitionFieldCommentFragmentDoc}
` as unknown as DocumentNode<
  RecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutation,
  RecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutationVariables
>;
export const RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentDocument = gql`
  mutation RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldComment(
    $keycode: ID!
    $petitionFieldId: GID!
    $petitionFieldCommentId: GID!
    $content: String!
  ) {
    publicUpdatePetitionFieldComment(
      keycode: $keycode
      petitionFieldId: $petitionFieldId
      petitionFieldCommentId: $petitionFieldCommentId
      content: $content
    ) {
      ...FieldComment_PublicPetitionFieldComment
    }
  }
  ${FieldComment_PublicPetitionFieldCommentFragmentDoc}
` as unknown as DocumentNode<
  RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutation,
  RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutationVariables
>;
export const RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentDocument = gql`
  mutation RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldComment(
    $keycode: ID!
    $petitionFieldId: GID!
    $petitionFieldCommentId: GID!
  ) {
    publicDeletePetitionFieldComment(
      keycode: $keycode
      petitionFieldId: $petitionFieldId
      petitionFieldCommentId: $petitionFieldCommentId
    ) {
      id
      commentCount
      unreadCommentCount
      comments {
        id
      }
    }
  }
` as unknown as DocumentNode<
  RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutation,
  RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutationVariables
>;
export const RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLinkDocument = gql`
  mutation RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLink(
    $keycode: ID!
    $fieldId: GID!
    $attachmentId: GID!
  ) {
    publicPetitionFieldAttachmentDownloadLink(
      keycode: $keycode
      fieldId: $fieldId
      attachmentId: $attachmentId
    ) {
      url
    }
  }
` as unknown as DocumentNode<
  RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLinkMutation,
  RecipientViewPetitionField_publicPetitionFieldAttachmentDownloadLinkMutationVariables
>;
export const RecipientViewPetitionField_publicDeletePetitionFieldReplyDocument = gql`
  mutation RecipientViewPetitionField_publicDeletePetitionFieldReply(
    $replyId: GID!
    $keycode: ID!
  ) {
    publicDeletePetitionFieldReply(replyId: $replyId, keycode: $keycode) {
      id
      replies {
        id
      }
      petition {
        id
        status
      }
    }
  }
` as unknown as DocumentNode<
  RecipientViewPetitionField_publicDeletePetitionFieldReplyMutation,
  RecipientViewPetitionField_publicDeletePetitionFieldReplyMutationVariables
>;
export const RecipientViewPetitionField_publicCreatePetitionFieldReplyDocument = gql`
  mutation RecipientViewPetitionField_publicCreatePetitionFieldReply(
    $keycode: ID!
    $fieldId: GID!
    $reply: JSON!
  ) {
    publicCreatePetitionFieldReply(keycode: $keycode, fieldId: $fieldId, reply: $reply) {
      ...RecipientViewPetitionFieldCard_PublicPetitionFieldReply
      field {
        id
        petition {
          id
          status
        }
        replies {
          id
        }
      }
    }
  }
  ${RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragmentDoc}
` as unknown as DocumentNode<
  RecipientViewPetitionField_publicCreatePetitionFieldReplyMutation,
  RecipientViewPetitionField_publicCreatePetitionFieldReplyMutationVariables
>;
export const RecipientViewPetitionField_publicUpdatePetitionFieldReplyDocument = gql`
  mutation RecipientViewPetitionField_publicUpdatePetitionFieldReply(
    $keycode: ID!
    $replyId: GID!
    $reply: JSON!
  ) {
    publicUpdatePetitionFieldReply(keycode: $keycode, replyId: $replyId, reply: $reply) {
      ...RecipientViewPetitionFieldCard_PublicPetitionFieldReply
      field {
        id
        petition {
          id
          status
        }
      }
    }
  }
  ${RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragmentDoc}
` as unknown as DocumentNode<
  RecipientViewPetitionField_publicUpdatePetitionFieldReplyMutation,
  RecipientViewPetitionField_publicUpdatePetitionFieldReplyMutationVariables
>;
export const RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkDocument = gql`
  mutation RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLink(
    $keycode: ID!
    $replyId: GID!
    $preview: Boolean
  ) {
    publicFileUploadReplyDownloadLink(keycode: $keycode, replyId: $replyId, preview: $preview) {
      result
      url
    }
  }
` as unknown as DocumentNode<
  RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkMutation,
  RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkMutationVariables
>;
export const RecipientViewPetitionFieldFileUpload_fileUploadReplyDownloadLinkDocument = gql`
  mutation RecipientViewPetitionFieldFileUpload_fileUploadReplyDownloadLink(
    $petitionId: GID!
    $replyId: GID!
    $preview: Boolean
  ) {
    fileUploadReplyDownloadLink(petitionId: $petitionId, replyId: $replyId, preview: $preview) {
      result
      url
    }
  }
` as unknown as DocumentNode<
  RecipientViewPetitionFieldFileUpload_fileUploadReplyDownloadLinkMutation,
  RecipientViewPetitionFieldFileUpload_fileUploadReplyDownloadLinkMutationVariables
>;
export const RecipientViewPetitionFieldMutations_publicCreateFileUploadReplyDocument = gql`
  mutation RecipientViewPetitionFieldMutations_publicCreateFileUploadReply(
    $keycode: ID!
    $fieldId: GID!
    $data: FileUploadInput!
  ) {
    publicCreateFileUploadReply(keycode: $keycode, fieldId: $fieldId, data: $data) {
      presignedPostData {
        ...uploadFile_AWSPresignedPostData
      }
      reply {
        ...RecipientViewPetitionFieldCard_PublicPetitionFieldReply
        field {
          id
          petition {
            id
            status
          }
          replies {
            id
          }
        }
      }
    }
  }
  ${uploadFile_AWSPresignedPostDataFragmentDoc}
  ${RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragmentDoc}
` as unknown as DocumentNode<
  RecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutation,
  RecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutationVariables
>;
export const RecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteDocument = gql`
  mutation RecipientViewPetitionFieldMutations_publicFileUploadReplyComplete(
    $keycode: ID!
    $replyId: GID!
  ) {
    publicFileUploadReplyComplete(keycode: $keycode, replyId: $replyId) {
      id
      content
    }
  }
` as unknown as DocumentNode<
  RecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutation,
  RecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutationVariables
>;
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
` as unknown as DocumentNode<
  GenerateNewTokenDialog_generateUserAuthTokenMutation,
  GenerateNewTokenDialog_generateUserAuthTokenMutationVariables
>;
export const Admin_userDocument = gql`
  query Admin_user {
    me {
      id
      ...AppLayout_User
    }
  }
  ${AppLayout_UserFragmentDoc}
` as unknown as DocumentNode<Admin_userQuery, Admin_userQueryVariables>;
export const AdminOrganizations_organizationsDocument = gql`
  query AdminOrganizations_organizations(
    $offset: Int!
    $limit: Int!
    $search: String
    $sortBy: [QueryOrganizations_OrderBy!]
    $status: OrganizationStatus
  ) {
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
  ${AdminOrganizations_OrganizationFragmentDoc}
` as unknown as DocumentNode<
  AdminOrganizations_organizationsQuery,
  AdminOrganizations_organizationsQueryVariables
>;
export const AdminOrganizations_userDocument = gql`
  query AdminOrganizations_user {
    me {
      ...AdminOrganizations_User
    }
  }
  ${AdminOrganizations_UserFragmentDoc}
` as unknown as DocumentNode<AdminOrganizations_userQuery, AdminOrganizations_userQueryVariables>;
export const AdminSupportMethods_userDocument = gql`
  query AdminSupportMethods_user {
    me {
      ...AdminSupportMethods_User
    }
  }
  ${AdminSupportMethods_UserFragmentDoc}
` as unknown as DocumentNode<AdminSupportMethods_userQuery, AdminSupportMethods_userQueryVariables>;
export const Contact_updateContactDocument = gql`
  mutation Contact_updateContact($id: GID!, $data: UpdateContactInput!) {
    updateContact(id: $id, data: $data) {
      ...Contact_Contact_Profile
    }
  }
  ${Contact_Contact_ProfileFragmentDoc}
` as unknown as DocumentNode<Contact_updateContactMutation, Contact_updateContactMutationVariables>;
export const Contact_userDocument = gql`
  query Contact_user {
    me {
      ...Contact_User
    }
  }
  ${Contact_UserFragmentDoc}
` as unknown as DocumentNode<Contact_userQuery, Contact_userQueryVariables>;
export const Contact_contactDocument = gql`
  query Contact_contact($id: GID!) {
    contact(id: $id) {
      ...Contact_Contact
    }
  }
  ${Contact_ContactFragmentDoc}
` as unknown as DocumentNode<Contact_contactQuery, Contact_contactQueryVariables>;
export const Contacts_contactsDocument = gql`
  query Contacts_contacts(
    $offset: Int!
    $limit: Int!
    $search: String
    $sortBy: [QueryContacts_OrderBy!]
  ) {
    contacts(offset: $offset, limit: $limit, search: $search, sortBy: $sortBy) {
      ...Contacts_ContactsList
    }
  }
  ${Contacts_ContactsListFragmentDoc}
` as unknown as DocumentNode<Contacts_contactsQuery, Contacts_contactsQueryVariables>;
export const Contacts_userDocument = gql`
  query Contacts_user {
    me {
      ...Contacts_User
    }
  }
  ${Contacts_UserFragmentDoc}
` as unknown as DocumentNode<Contacts_userQuery, Contacts_userQueryVariables>;
export const AppRedirect_petitionsDocument = gql`
  query AppRedirect_petitions {
    petitions {
      totalCount
    }
  }
` as unknown as DocumentNode<AppRedirect_petitionsQuery, AppRedirect_petitionsQueryVariables>;
export const OrganizationBranding_updateOrgLogoDocument = gql`
  mutation OrganizationBranding_updateOrgLogo($file: Upload!) {
    updateOrganizationLogo(file: $file) {
      id
      logoUrl
    }
  }
` as unknown as DocumentNode<
  OrganizationBranding_updateOrgLogoMutation,
  OrganizationBranding_updateOrgLogoMutationVariables
>;
export const OrganizationBranding_updateOrganizationPreferredToneDocument = gql`
  mutation OrganizationBranding_updateOrganizationPreferredTone($tone: Tone!) {
    updateOrganizationPreferredTone(tone: $tone) {
      id
      preferredTone
    }
  }
` as unknown as DocumentNode<
  OrganizationBranding_updateOrganizationPreferredToneMutation,
  OrganizationBranding_updateOrganizationPreferredToneMutationVariables
>;
export const OrganizationBranding_userDocument = gql`
  query OrganizationBranding_user {
    me {
      ...SettingsLayout_User
      fullName
      organization {
        id
        logoUrl
        name
        preferredTone
      }
    }
  }
  ${SettingsLayout_UserFragmentDoc}
` as unknown as DocumentNode<
  OrganizationBranding_userQuery,
  OrganizationBranding_userQueryVariables
>;
export const OrganizationGroup_updateUserGroupDocument = gql`
  mutation OrganizationGroup_updateUserGroup($id: GID!, $data: UpdateUserGroupInput!) {
    updateUserGroup(id: $id, data: $data) {
      ...OrganizationGroup_UserGroup
    }
  }
  ${OrganizationGroup_UserGroupFragmentDoc}
` as unknown as DocumentNode<
  OrganizationGroup_updateUserGroupMutation,
  OrganizationGroup_updateUserGroupMutationVariables
>;
export const OrganizationGroup_addUsersToUserGroupDocument = gql`
  mutation OrganizationGroup_addUsersToUserGroup($userGroupId: GID!, $userIds: [GID!]!) {
    addUsersToUserGroup(userGroupId: $userGroupId, userIds: $userIds) {
      ...OrganizationGroup_UserGroup
    }
  }
  ${OrganizationGroup_UserGroupFragmentDoc}
` as unknown as DocumentNode<
  OrganizationGroup_addUsersToUserGroupMutation,
  OrganizationGroup_addUsersToUserGroupMutationVariables
>;
export const OrganizationGroup_removeUsersFromGroupDocument = gql`
  mutation OrganizationGroup_removeUsersFromGroup($userGroupId: GID!, $userIds: [GID!]!) {
    removeUsersFromGroup(userGroupId: $userGroupId, userIds: $userIds) {
      ...OrganizationGroup_UserGroup
    }
  }
  ${OrganizationGroup_UserGroupFragmentDoc}
` as unknown as DocumentNode<
  OrganizationGroup_removeUsersFromGroupMutation,
  OrganizationGroup_removeUsersFromGroupMutationVariables
>;
export const OrganizationGroup_deleteUserGroupDocument = gql`
  mutation OrganizationGroup_deleteUserGroup($ids: [GID!]!) {
    deleteUserGroup(ids: $ids)
  }
` as unknown as DocumentNode<
  OrganizationGroup_deleteUserGroupMutation,
  OrganizationGroup_deleteUserGroupMutationVariables
>;
export const OrganizationGroup_cloneUserGroupDocument = gql`
  mutation OrganizationGroup_cloneUserGroup($ids: [GID!]!, $locale: String!) {
    cloneUserGroup(userGroupIds: $ids, locale: $locale) {
      ...OrganizationGroup_UserGroup
    }
  }
  ${OrganizationGroup_UserGroupFragmentDoc}
` as unknown as DocumentNode<
  OrganizationGroup_cloneUserGroupMutation,
  OrganizationGroup_cloneUserGroupMutationVariables
>;
export const OrganizationGroup_userGroupDocument = gql`
  query OrganizationGroup_userGroup($id: GID!) {
    userGroup(id: $id) {
      ...OrganizationGroup_UserGroup
    }
  }
  ${OrganizationGroup_UserGroupFragmentDoc}
` as unknown as DocumentNode<
  OrganizationGroup_userGroupQuery,
  OrganizationGroup_userGroupQueryVariables
>;
export const OrganizationGroup_userDocument = gql`
  query OrganizationGroup_user {
    me {
      ...OrganizationGroup_User
      ...OrganizationGroupListTableHeader_User
    }
  }
  ${OrganizationGroup_UserFragmentDoc}
  ${OrganizationGroupListTableHeader_UserFragmentDoc}
` as unknown as DocumentNode<OrganizationGroup_userQuery, OrganizationGroup_userQueryVariables>;
export const OrganizationGroups_createUserGroupDocument = gql`
  mutation OrganizationGroups_createUserGroup($name: String!, $userIds: [GID!]!) {
    createUserGroup(name: $name, userIds: $userIds) {
      ...OrganizationGroups_UserGroup
    }
  }
  ${OrganizationGroups_UserGroupFragmentDoc}
` as unknown as DocumentNode<
  OrganizationGroups_createUserGroupMutation,
  OrganizationGroups_createUserGroupMutationVariables
>;
export const OrganizationGroups_deleteUserGroupDocument = gql`
  mutation OrganizationGroups_deleteUserGroup($ids: [GID!]!) {
    deleteUserGroup(ids: $ids)
  }
` as unknown as DocumentNode<
  OrganizationGroups_deleteUserGroupMutation,
  OrganizationGroups_deleteUserGroupMutationVariables
>;
export const OrganizationGroups_cloneUserGroupDocument = gql`
  mutation OrganizationGroups_cloneUserGroup($ids: [GID!]!, $locale: String!) {
    cloneUserGroup(userGroupIds: $ids, locale: $locale) {
      ...OrganizationGroups_UserGroup
    }
  }
  ${OrganizationGroups_UserGroupFragmentDoc}
` as unknown as DocumentNode<
  OrganizationGroups_cloneUserGroupMutation,
  OrganizationGroups_cloneUserGroupMutationVariables
>;
export const OrganizationGroups_userGroupsDocument = gql`
  query OrganizationGroups_userGroups(
    $offset: Int!
    $limit: Int!
    $search: String
    $sortBy: [QueryUserGroups_OrderBy!]
  ) {
    userGroups(offset: $offset, limit: $limit, search: $search, sortBy: $sortBy) {
      ...OrganizationGroups_UserGroupPagination
    }
  }
  ${OrganizationGroups_UserGroupPaginationFragmentDoc}
` as unknown as DocumentNode<
  OrganizationGroups_userGroupsQuery,
  OrganizationGroups_userGroupsQueryVariables
>;
export const OrganizationGroups_userDocument = gql`
  query OrganizationGroups_user {
    me {
      ...OrganizationGroups_User
      ...OrganizationGroupsListTableHeader_User
    }
  }
  ${OrganizationGroups_UserFragmentDoc}
  ${OrganizationGroupsListTableHeader_UserFragmentDoc}
` as unknown as DocumentNode<OrganizationGroups_userQuery, OrganizationGroups_userQueryVariables>;
export const OrganizationSettings_userDocument = gql`
  query OrganizationSettings_user {
    me {
      id
      ...SettingsLayout_User
    }
  }
  ${SettingsLayout_UserFragmentDoc}
` as unknown as DocumentNode<
  OrganizationSettings_userQuery,
  OrganizationSettings_userQueryVariables
>;
export const OrganizationIntegrations_userDocument = gql`
  query OrganizationIntegrations_user {
    me {
      id
      hasPetitionSignature: hasFeatureFlag(featureFlag: PETITION_SIGNATURE)
      hasDeveloperAccess: hasFeatureFlag(featureFlag: DEVELOPER_ACCESS)
      ...SettingsLayout_User
    }
  }
  ${SettingsLayout_UserFragmentDoc}
` as unknown as DocumentNode<
  OrganizationIntegrations_userQuery,
  OrganizationIntegrations_userQueryVariables
>;
export const IntegrationsSignature_createSignatureIntegrationDocument = gql`
  mutation IntegrationsSignature_createSignatureIntegration(
    $name: String!
    $provider: SignatureOrgIntegrationProvider!
    $apiKey: String!
    $isDefault: Boolean
  ) {
    createSignatureIntegration(
      name: $name
      provider: $provider
      apiKey: $apiKey
      isDefault: $isDefault
    ) {
      ...IntegrationsSignature_SignatureOrgIntegration
    }
  }
  ${IntegrationsSignature_SignatureOrgIntegrationFragmentDoc}
` as unknown as DocumentNode<
  IntegrationsSignature_createSignatureIntegrationMutation,
  IntegrationsSignature_createSignatureIntegrationMutationVariables
>;
export const IntegrationsSignature_markSignatureIntegrationAsDefaultDocument = gql`
  mutation IntegrationsSignature_markSignatureIntegrationAsDefault($id: GID!) {
    markSignatureIntegrationAsDefault(id: $id) {
      ...IntegrationsSignature_SignatureOrgIntegration
    }
  }
  ${IntegrationsSignature_SignatureOrgIntegrationFragmentDoc}
` as unknown as DocumentNode<
  IntegrationsSignature_markSignatureIntegrationAsDefaultMutation,
  IntegrationsSignature_markSignatureIntegrationAsDefaultMutationVariables
>;
export const IntegrationsSignature_deleteSignatureIntegrationDocument = gql`
  mutation IntegrationsSignature_deleteSignatureIntegration($id: GID!, $force: Boolean) {
    deleteSignatureIntegration(id: $id, force: $force)
  }
` as unknown as DocumentNode<
  IntegrationsSignature_deleteSignatureIntegrationMutation,
  IntegrationsSignature_deleteSignatureIntegrationMutationVariables
>;
export const IntegrationsSignature_userDocument = gql`
  query IntegrationsSignature_user($limit: Int!, $offset: Int!) {
    me {
      id
      hasPetitionSignature: hasFeatureFlag(featureFlag: PETITION_SIGNATURE)
      ...SettingsLayout_User
      organization {
        id
        signatureIntegrations: integrations(type: SIGNATURE, limit: $limit, offset: $offset) {
          items {
            ... on SignatureOrgIntegration {
              id
              name
              provider
              isDefault
              environment
            }
          }
          totalCount
        }
      }
    }
  }
  ${SettingsLayout_UserFragmentDoc}
` as unknown as DocumentNode<
  IntegrationsSignature_userQuery,
  IntegrationsSignature_userQueryVariables
>;
export const OrganizationUsage_userDocument = gql`
  query OrganizationUsage_user {
    me {
      ...SettingsLayout_User
      organization {
        id
        activeUserCount
        usageLimits {
          users {
            limit
          }
          petitions {
            used
            limit
          }
          signatures {
            used
            limit
          }
        }
      }
    }
  }
  ${SettingsLayout_UserFragmentDoc}
` as unknown as DocumentNode<OrganizationUsage_userQuery, OrganizationUsage_userQueryVariables>;
export const OrganizationUsers_createOrganizationUserDocument = gql`
  mutation OrganizationUsers_createOrganizationUser(
    $firstName: String!
    $lastName: String!
    $email: String!
    $role: OrganizationRole!
    $locale: String
    $userGroupIds: [GID!]
  ) {
    createOrganizationUser(
      email: $email
      firstName: $firstName
      lastName: $lastName
      role: $role
      locale: $locale
      userGroupIds: $userGroupIds
    ) {
      ...OrganizationUsers_User
    }
  }
  ${OrganizationUsers_UserFragmentDoc}
` as unknown as DocumentNode<
  OrganizationUsers_createOrganizationUserMutation,
  OrganizationUsers_createOrganizationUserMutationVariables
>;
export const OrganizationUsers_updateOrganizationUserDocument = gql`
  mutation OrganizationUsers_updateOrganizationUser(
    $userId: GID!
    $role: OrganizationRole!
    $userGroupIds: [GID!]
  ) {
    updateOrganizationUser(userId: $userId, role: $role, userGroupIds: $userGroupIds) {
      ...OrganizationUsers_User
    }
  }
  ${OrganizationUsers_UserFragmentDoc}
` as unknown as DocumentNode<
  OrganizationUsers_updateOrganizationUserMutation,
  OrganizationUsers_updateOrganizationUserMutationVariables
>;
export const OrganizationUsers_activateUserDocument = gql`
  mutation OrganizationUsers_activateUser($userIds: [GID!]!) {
    activateUser(userIds: $userIds) {
      id
      status
    }
  }
` as unknown as DocumentNode<
  OrganizationUsers_activateUserMutation,
  OrganizationUsers_activateUserMutationVariables
>;
export const OrganizationUsers_deactivateUserDocument = gql`
  mutation OrganizationUsers_deactivateUser(
    $userIds: [GID!]!
    $transferToUserId: GID
    $deletePetitions: Boolean
  ) {
    deactivateUser(
      userIds: $userIds
      transferToUserId: $transferToUserId
      deletePetitions: $deletePetitions
    ) {
      id
      status
    }
  }
` as unknown as DocumentNode<
  OrganizationUsers_deactivateUserMutation,
  OrganizationUsers_deactivateUserMutationVariables
>;
export const OrganizationUsers_userDocument = gql`
  query OrganizationUsers_user(
    $offset: Int!
    $limit: Int!
    $search: String
    $sortBy: [OrganizationUsers_OrderBy!]
  ) {
    me {
      organization {
        id
        hasSsoProvider
        activeUserCount
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
        usageLimits {
          users {
            limit
          }
        }
      }
      ...SettingsLayout_User
      ...OrganizationUsersListTableHeader_User
    }
  }
  ${OrganizationUsers_UserFragmentDoc}
  ${SettingsLayout_UserFragmentDoc}
  ${OrganizationUsersListTableHeader_UserFragmentDoc}
` as unknown as DocumentNode<OrganizationUsers_userQuery, OrganizationUsers_userQueryVariables>;
export const PetitionActivity_updatePetitionDocument = gql`
  mutation PetitionActivity_updatePetition($petitionId: GID!, $data: UpdatePetitionInput!) {
    updatePetition(petitionId: $petitionId, data: $data) {
      ...PetitionActivity_Petition
    }
  }
  ${PetitionActivity_PetitionFragmentDoc}
` as unknown as DocumentNode<
  PetitionActivity_updatePetitionMutation,
  PetitionActivity_updatePetitionMutationVariables
>;
export const PetitionActivity_sendRemindersDocument = gql`
  mutation PetitionActivity_sendReminders($petitionId: GID!, $accessIds: [GID!]!, $body: JSON) {
    sendReminders(petitionId: $petitionId, accessIds: $accessIds, body: $body)
  }
` as unknown as DocumentNode<
  PetitionActivity_sendRemindersMutation,
  PetitionActivity_sendRemindersMutationVariables
>;
export const PetitionActivity_deactivateAccessesDocument = gql`
  mutation PetitionActivity_deactivateAccesses($petitionId: GID!, $accessIds: [GID!]!) {
    deactivateAccesses(petitionId: $petitionId, accessIds: $accessIds) {
      id
      status
    }
  }
` as unknown as DocumentNode<
  PetitionActivity_deactivateAccessesMutation,
  PetitionActivity_deactivateAccessesMutationVariables
>;
export const PetitionActivity_reactivateAccessesDocument = gql`
  mutation PetitionActivity_reactivateAccesses($petitionId: GID!, $accessIds: [GID!]!) {
    reactivateAccesses(petitionId: $petitionId, accessIds: $accessIds) {
      id
      status
    }
  }
` as unknown as DocumentNode<
  PetitionActivity_reactivateAccessesMutation,
  PetitionActivity_reactivateAccessesMutationVariables
>;
export const PetitionActivity_cancelScheduledMessageDocument = gql`
  mutation PetitionActivity_cancelScheduledMessage($petitionId: GID!, $messageId: GID!) {
    cancelScheduledMessage(petitionId: $petitionId, messageId: $messageId) {
      id
      status
    }
  }
` as unknown as DocumentNode<
  PetitionActivity_cancelScheduledMessageMutation,
  PetitionActivity_cancelScheduledMessageMutationVariables
>;
export const PetitionActivity_switchAutomaticRemindersDocument = gql`
  mutation PetitionActivity_switchAutomaticReminders(
    $start: Boolean!
    $petitionId: GID!
    $accessIds: [GID!]!
    $remindersConfig: RemindersConfigInput
  ) {
    switchAutomaticReminders(
      start: $start
      petitionId: $petitionId
      accessIds: $accessIds
      remindersConfig: $remindersConfig
    ) {
      id
    }
  }
` as unknown as DocumentNode<
  PetitionActivity_switchAutomaticRemindersMutation,
  PetitionActivity_switchAutomaticRemindersMutationVariables
>;
export const PetitionActivity_petitionDocument = gql`
  query PetitionActivity_petition($id: GID!) {
    petition(id: $id) {
      ...PetitionActivity_Petition
    }
  }
  ${PetitionActivity_PetitionFragmentDoc}
` as unknown as DocumentNode<
  PetitionActivity_petitionQuery,
  PetitionActivity_petitionQueryVariables
>;
export const PetitionActivity_userDocument = gql`
  query PetitionActivity_user {
    me {
      ...PetitionActivity_User
    }
  }
  ${PetitionActivity_UserFragmentDoc}
` as unknown as DocumentNode<PetitionActivity_userQuery, PetitionActivity_userQueryVariables>;
export const PetitionCompose_updatePetitionDocument = gql`
  mutation PetitionCompose_updatePetition($petitionId: GID!, $data: UpdatePetitionInput!) {
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
  ${PetitionTemplateComposeMessageEditor_PetitionFragmentDoc}
` as unknown as DocumentNode<
  PetitionCompose_updatePetitionMutation,
  PetitionCompose_updatePetitionMutationVariables
>;
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
  ${PetitionLayout_PetitionBaseFragmentDoc}
` as unknown as DocumentNode<
  PetitionCompose_updateFieldPositionsMutation,
  PetitionCompose_updateFieldPositionsMutationVariables
>;
export const PetitionCompose_createPetitionFieldDocument = gql`
  mutation PetitionCompose_createPetitionField(
    $petitionId: GID!
    $type: PetitionFieldType!
    $position: Int
  ) {
    createPetitionField(petitionId: $petitionId, type: $type, position: $position) {
      id
      ...PetitionCompose_PetitionField
      petition {
        ...PetitionLayout_PetitionBase
        fields {
          id
        }
      }
    }
  }
  ${PetitionCompose_PetitionFieldFragmentDoc}
  ${PetitionLayout_PetitionBaseFragmentDoc}
` as unknown as DocumentNode<
  PetitionCompose_createPetitionFieldMutation,
  PetitionCompose_createPetitionFieldMutationVariables
>;
export const PetitionCompose_clonePetitionFieldDocument = gql`
  mutation PetitionCompose_clonePetitionField($petitionId: GID!, $fieldId: GID!) {
    clonePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
      id
      ...PetitionCompose_PetitionField
      petition {
        ...PetitionLayout_PetitionBase
        fields {
          id
        }
      }
    }
  }
  ${PetitionCompose_PetitionFieldFragmentDoc}
  ${PetitionLayout_PetitionBaseFragmentDoc}
` as unknown as DocumentNode<
  PetitionCompose_clonePetitionFieldMutation,
  PetitionCompose_clonePetitionFieldMutationVariables
>;
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
  ${PetitionLayout_PetitionBaseFragmentDoc}
` as unknown as DocumentNode<
  PetitionCompose_deletePetitionFieldMutation,
  PetitionCompose_deletePetitionFieldMutationVariables
>;
export const PetitionCompose_updatePetitionFieldDocument = gql`
  mutation PetitionCompose_updatePetitionField(
    $petitionId: GID!
    $fieldId: GID!
    $data: UpdatePetitionFieldInput!
    $force: Boolean
  ) {
    updatePetitionField(petitionId: $petitionId, fieldId: $fieldId, data: $data, force: $force) {
      id
      ...PetitionCompose_PetitionField
      petition {
        id
        updatedAt
        ... on Petition {
          status
        }
      }
    }
  }
  ${PetitionCompose_PetitionFieldFragmentDoc}
` as unknown as DocumentNode<
  PetitionCompose_updatePetitionFieldMutation,
  PetitionCompose_updatePetitionFieldMutationVariables
>;
export const PetitionCompose_changePetitionFieldTypeDocument = gql`
  mutation PetitionCompose_changePetitionFieldType(
    $petitionId: GID!
    $fieldId: GID!
    $type: PetitionFieldType!
    $force: Boolean
  ) {
    changePetitionFieldType(
      petitionId: $petitionId
      fieldId: $fieldId
      type: $type
      force: $force
    ) {
      id
      ...PetitionCompose_PetitionField
      petition {
        id
        ... on Petition {
          status
        }
        updatedAt
      }
    }
  }
  ${PetitionCompose_PetitionFieldFragmentDoc}
` as unknown as DocumentNode<
  PetitionCompose_changePetitionFieldTypeMutation,
  PetitionCompose_changePetitionFieldTypeMutationVariables
>;
export const PetitionCompose_userDocument = gql`
  query PetitionCompose_user {
    me {
      ...PetitionCompose_User
    }
  }
  ${PetitionCompose_UserFragmentDoc}
` as unknown as DocumentNode<PetitionCompose_userQuery, PetitionCompose_userQueryVariables>;
export const PetitionCompose_petitionDocument = gql`
  query PetitionCompose_petition($id: GID!) {
    petition(id: $id) {
      ...PetitionCompose_PetitionBase
    }
  }
  ${PetitionCompose_PetitionBaseFragmentDoc}
` as unknown as DocumentNode<PetitionCompose_petitionQuery, PetitionCompose_petitionQueryVariables>;
export const PetitionDocument = gql`
  query Petition($id: GID!) {
    petition(id: $id) {
      id
      ... on Petition {
        status
      }
    }
  }
` as unknown as DocumentNode<PetitionQuery, PetitionQueryVariables>;
export const PetitionPreview_updatePetitionDocument = gql`
  mutation PetitionPreview_updatePetition($petitionId: GID!, $data: UpdatePetitionInput!) {
    updatePetition(petitionId: $petitionId, data: $data) {
      ...PetitionPreview_PetitionBase
    }
  }
  ${PetitionPreview_PetitionBaseFragmentDoc}
` as unknown as DocumentNode<
  PetitionPreview_updatePetitionMutation,
  PetitionPreview_updatePetitionMutationVariables
>;
export const PetitionPreview_completePetitionDocument = gql`
  mutation PetitionPreview_completePetition(
    $petitionId: GID!
    $additionalSigners: [PublicPetitionSignerDataInput!]
    $message: String
  ) {
    completePetition(
      petitionId: $petitionId
      additionalSigners: $additionalSigners
      message: $message
    ) {
      ...PetitionPreview_PetitionBase
    }
  }
  ${PetitionPreview_PetitionBaseFragmentDoc}
` as unknown as DocumentNode<
  PetitionPreview_completePetitionMutation,
  PetitionPreview_completePetitionMutationVariables
>;
export const PetitionPreview_petitionDocument = gql`
  query PetitionPreview_petition($id: GID!) {
    petition(id: $id) {
      ...PetitionPreview_PetitionBase
    }
  }
  ${PetitionPreview_PetitionBaseFragmentDoc}
` as unknown as DocumentNode<PetitionPreview_petitionQuery, PetitionPreview_petitionQueryVariables>;
export const PetitionPreview_userDocument = gql`
  query PetitionPreview_user {
    me {
      ...PetitionPreview_User
    }
    metadata {
      country
      browserName
    }
  }
  ${PetitionPreview_UserFragmentDoc}
` as unknown as DocumentNode<PetitionPreview_userQuery, PetitionPreview_userQueryVariables>;
export const PetitionReplies_updatePetitionDocument = gql`
  mutation PetitionReplies_updatePetition($petitionId: GID!, $data: UpdatePetitionInput!) {
    updatePetition(petitionId: $petitionId, data: $data) {
      ...PetitionLayout_PetitionBase
    }
  }
  ${PetitionLayout_PetitionBaseFragmentDoc}
` as unknown as DocumentNode<
  PetitionReplies_updatePetitionMutation,
  PetitionReplies_updatePetitionMutationVariables
>;
export const PetitionReplies_closePetitionDocument = gql`
  mutation PetitionReplies_closePetition($petitionId: GID!) {
    closePetition(petitionId: $petitionId) {
      ...PetitionReplies_Petition
    }
  }
  ${PetitionReplies_PetitionFragmentDoc}
` as unknown as DocumentNode<
  PetitionReplies_closePetitionMutation,
  PetitionReplies_closePetitionMutationVariables
>;
export const PetitionReplies_approveOrRejectPetitionFieldRepliesDocument = gql`
  mutation PetitionReplies_approveOrRejectPetitionFieldReplies(
    $petitionId: GID!
    $status: PetitionFieldReplyStatus!
  ) {
    approveOrRejectPetitionFieldReplies(petitionId: $petitionId, status: $status) {
      ...PetitionReplies_Petition
    }
  }
  ${PetitionReplies_PetitionFragmentDoc}
` as unknown as DocumentNode<
  PetitionReplies_approveOrRejectPetitionFieldRepliesMutation,
  PetitionReplies_approveOrRejectPetitionFieldRepliesMutationVariables
>;
export const PetitionReplies_fileUploadReplyDownloadLinkDocument = gql`
  mutation PetitionReplies_fileUploadReplyDownloadLink(
    $petitionId: GID!
    $replyId: GID!
    $preview: Boolean
  ) {
    fileUploadReplyDownloadLink(petitionId: $petitionId, replyId: $replyId, preview: $preview) {
      result
      url
    }
  }
` as unknown as DocumentNode<
  PetitionReplies_fileUploadReplyDownloadLinkMutation,
  PetitionReplies_fileUploadReplyDownloadLinkMutationVariables
>;
export const PetitionReplies_updatePetitionFieldRepliesStatusDocument = gql`
  mutation PetitionReplies_updatePetitionFieldRepliesStatus(
    $petitionId: GID!
    $petitionFieldId: GID!
    $petitionFieldReplyIds: [GID!]!
    $status: PetitionFieldReplyStatus!
  ) {
    updatePetitionFieldRepliesStatus(
      petitionId: $petitionId
      petitionFieldId: $petitionFieldId
      petitionFieldReplyIds: $petitionFieldReplyIds
      status: $status
    ) {
      id
      petition {
        ... on Petition {
          id
          status
        }
      }
      replies {
        id
        status
      }
    }
  }
` as unknown as DocumentNode<
  PetitionReplies_updatePetitionFieldRepliesStatusMutation,
  PetitionReplies_updatePetitionFieldRepliesStatusMutationVariables
>;
export const PetitionReplies_sendPetitionClosedNotificationDocument = gql`
  mutation PetitionReplies_sendPetitionClosedNotification(
    $petitionId: GID!
    $emailBody: JSON!
    $attachPdfExport: Boolean!
    $pdfExportTitle: String
    $force: Boolean
  ) {
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
` as unknown as DocumentNode<
  PetitionReplies_sendPetitionClosedNotificationMutation,
  PetitionReplies_sendPetitionClosedNotificationMutationVariables
>;
export const PetitionReplies_userDocument = gql`
  query PetitionReplies_user {
    me {
      ...PetitionReplies_User
    }
  }
  ${PetitionReplies_UserFragmentDoc}
` as unknown as DocumentNode<PetitionReplies_userQuery, PetitionReplies_userQueryVariables>;
export const PetitionReplies_petitionDocument = gql`
  query PetitionReplies_petition($id: GID!) {
    petition(id: $id) {
      ...PetitionReplies_Petition
    }
  }
  ${PetitionReplies_PetitionFragmentDoc}
` as unknown as DocumentNode<PetitionReplies_petitionQuery, PetitionReplies_petitionQueryVariables>;
export const Petitions_userDocument = gql`
  query Petitions_user {
    me {
      ...AppLayout_User
      ...PetitionListHeader_User
    }
  }
  ${AppLayout_UserFragmentDoc}
  ${PetitionListHeader_UserFragmentDoc}
` as unknown as DocumentNode<Petitions_userQuery, Petitions_userQueryVariables>;
export const Petitions_petitionsDocument = gql`
  query Petitions_petitions(
    $offset: Int!
    $limit: Int!
    $search: String
    $sortBy: [QueryPetitions_OrderBy!]
    $filters: PetitionFilter
  ) {
    petitions(offset: $offset, limit: $limit, search: $search, sortBy: $sortBy, filters: $filters) {
      ...Petitions_PetitionBasePagination
    }
  }
  ${Petitions_PetitionBasePaginationFragmentDoc}
` as unknown as DocumentNode<Petitions_petitionsQuery, Petitions_petitionsQueryVariables>;
export const NewPetition_templatesDocument = gql`
  query NewPetition_templates(
    $offset: Int!
    $limit: Int!
    $search: String
    $locale: PetitionLocale
    $isPublic: Boolean!
    $isOwner: Boolean
    $category: String
  ) {
    templates(
      offset: $offset
      limit: $limit
      search: $search
      isPublic: $isPublic
      isOwner: $isOwner
      locale: $locale
      category: $category
    ) {
      items {
        ...NewPetition_PetitionTemplate
      }
      totalCount
    }
  }
  ${NewPetition_PetitionTemplateFragmentDoc}
` as unknown as DocumentNode<NewPetition_templatesQuery, NewPetition_templatesQueryVariables>;
export const NewPetition_userDocument = gql`
  query NewPetition_user {
    me {
      ...NewPetition_User
    }
    hasTemplates: petitions(filters: { type: TEMPLATE }) {
      totalCount
    }
    publicTemplateCategories
  }
  ${NewPetition_UserFragmentDoc}
` as unknown as DocumentNode<NewPetition_userQuery, NewPetition_userQueryVariables>;
export const NewPetition_templateDocument = gql`
  query NewPetition_template($templateId: GID!) {
    petition(id: $templateId) {
      ...TemplateDetailsModal_PetitionTemplate
    }
  }
  ${TemplateDetailsModal_PetitionTemplateFragmentDoc}
` as unknown as DocumentNode<NewPetition_templateQuery, NewPetition_templateQueryVariables>;
export const Account_updateAccountDocument = gql`
  mutation Account_updateAccount($id: GID!, $data: UpdateUserInput!) {
    updateUser(id: $id, data: $data) {
      id
      firstName
      lastName
      fullName
      initials
    }
  }
` as unknown as DocumentNode<Account_updateAccountMutation, Account_updateAccountMutationVariables>;
export const Account_setUserPreferredLocaleDocument = gql`
  mutation Account_setUserPreferredLocale($locale: String!) {
    setUserPreferredLocale(locale: $locale) {
      id
      ...Account_User
    }
  }
  ${Account_UserFragmentDoc}
` as unknown as DocumentNode<
  Account_setUserPreferredLocaleMutation,
  Account_setUserPreferredLocaleMutationVariables
>;
export const Account_userDocument = gql`
  query Account_user {
    me {
      id
      ...Account_User
    }
  }
  ${Account_UserFragmentDoc}
` as unknown as DocumentNode<Account_userQuery, Account_userQueryVariables>;
export const Developers_revokeUserAuthTokenDocument = gql`
  mutation Developers_revokeUserAuthToken($authTokenIds: [GID!]!) {
    revokeUserAuthToken(authTokenIds: $authTokenIds)
  }
` as unknown as DocumentNode<
  Developers_revokeUserAuthTokenMutation,
  Developers_revokeUserAuthTokenMutationVariables
>;
export const Developers_createEventSubscriptionDocument = gql`
  mutation Developers_createEventSubscription(
    $eventsUrl: String!
    $eventTypes: [PetitionEventType!]
    $name: String
  ) {
    createEventSubscription(eventsUrl: $eventsUrl, eventTypes: $eventTypes, name: $name) {
      ...Developers_PetitionEventSubscription
    }
  }
  ${Developers_PetitionEventSubscriptionFragmentDoc}
` as unknown as DocumentNode<
  Developers_createEventSubscriptionMutation,
  Developers_createEventSubscriptionMutationVariables
>;
export const Developers_updateEventSubscriptionDocument = gql`
  mutation Developers_updateEventSubscription($id: GID!, $data: UpdateEventSubscriptionInput!) {
    updateEventSubscription(id: $id, data: $data) {
      ...Developers_PetitionEventSubscription
    }
  }
  ${Developers_PetitionEventSubscriptionFragmentDoc}
` as unknown as DocumentNode<
  Developers_updateEventSubscriptionMutation,
  Developers_updateEventSubscriptionMutationVariables
>;
export const Developers_deleteEventSubscriptionsDocument = gql`
  mutation Developers_deleteEventSubscriptions($ids: [GID!]!) {
    deleteEventSubscriptions(ids: $ids)
  }
` as unknown as DocumentNode<
  Developers_deleteEventSubscriptionsMutation,
  Developers_deleteEventSubscriptionsMutationVariables
>;
export const Developers_tokensDocument = gql`
  query Developers_tokens {
    me {
      id
      tokens {
        ...Developers_UserAuthenticationToken
      }
    }
  }
  ${Developers_UserAuthenticationTokenFragmentDoc}
` as unknown as DocumentNode<Developers_tokensQuery, Developers_tokensQueryVariables>;
export const Developers_subscriptionsDocument = gql`
  query Developers_subscriptions {
    subscriptions {
      ...Developers_PetitionEventSubscription
    }
  }
  ${Developers_PetitionEventSubscriptionFragmentDoc}
` as unknown as DocumentNode<Developers_subscriptionsQuery, Developers_subscriptionsQueryVariables>;
export const Developers_userDocument = gql`
  query Developers_user {
    me {
      id
      ...SettingsLayout_User
      ...useSettingsSections_User
    }
  }
  ${SettingsLayout_UserFragmentDoc}
  ${useSettingsSections_UserFragmentDoc}
` as unknown as DocumentNode<Developers_userQuery, Developers_userQueryVariables>;
export const Settings_userDocument = gql`
  query Settings_user {
    me {
      id
      ...SettingsLayout_User
      ...useSettingsSections_User
    }
  }
  ${SettingsLayout_UserFragmentDoc}
  ${useSettingsSections_UserFragmentDoc}
` as unknown as DocumentNode<Settings_userQuery, Settings_userQueryVariables>;
export const Security_updatePasswordDocument = gql`
  mutation Security_updatePassword($password: String!, $newPassword: String!) {
    changePassword(password: $password, newPassword: $newPassword)
  }
` as unknown as DocumentNode<
  Security_updatePasswordMutation,
  Security_updatePasswordMutationVariables
>;
export const Security_userDocument = gql`
  query Security_user {
    me {
      isSsoUser
      ...SettingsLayout_User
      ...useSettingsSections_User
    }
  }
  ${SettingsLayout_UserFragmentDoc}
  ${useSettingsSections_UserFragmentDoc}
` as unknown as DocumentNode<Security_userQuery, Security_userQueryVariables>;
export const Forgot_resendVerificationCodeDocument = gql`
  mutation Forgot_resendVerificationCode($email: String!, $locale: String) {
    resendVerificationCode(email: $email, locale: $locale)
  }
` as unknown as DocumentNode<
  Forgot_resendVerificationCodeMutation,
  Forgot_resendVerificationCodeMutationVariables
>;
export const Forgot_resetTemporaryPasswordDocument = gql`
  mutation Forgot_resetTemporaryPassword($email: String!, $locale: String) {
    resetTemporaryPassword(email: $email, locale: $locale)
  }
` as unknown as DocumentNode<
  Forgot_resetTemporaryPasswordMutation,
  Forgot_resetTemporaryPasswordMutationVariables
>;
export const Login_resendVerificationCodeDocument = gql`
  mutation Login_resendVerificationCode($email: String!, $locale: String) {
    resendVerificationCode(email: $email, locale: $locale)
  }
` as unknown as DocumentNode<
  Login_resendVerificationCodeMutation,
  Login_resendVerificationCodeMutationVariables
>;
export const Login_currentUserDocument = gql`
  query Login_currentUser {
    me {
      id
      preferredLocale
      ...AlreadyLoggedIn_User
    }
  }
  ${AlreadyLoggedIn_UserFragmentDoc}
` as unknown as DocumentNode<Login_currentUserQuery, Login_currentUserQueryVariables>;
export const RecipientView_publicCompletePetitionDocument = gql`
  mutation RecipientView_publicCompletePetition(
    $keycode: ID!
    $additionalSigners: [PublicPetitionSignerDataInput!]
    $message: String
  ) {
    publicCompletePetition(
      keycode: $keycode
      additionalSigners: $additionalSigners
      message: $message
    ) {
      id
      ...RecipientView_PublicPetition
    }
  }
  ${RecipientView_PublicPetitionFragmentDoc}
` as unknown as DocumentNode<
  RecipientView_publicCompletePetitionMutation,
  RecipientView_publicCompletePetitionMutationVariables
>;
export const RecipientView_accessDocument = gql`
  query RecipientView_access($keycode: ID!) {
    access(keycode: $keycode) {
      ...RecipientView_PublicPetitionAccess
    }
    metadata(keycode: $keycode) {
      country
      browserName
    }
  }
  ${RecipientView_PublicPetitionAccessFragmentDoc}
` as unknown as DocumentNode<RecipientView_accessQuery, RecipientView_accessQueryVariables>;
export const RecipientViewVerify_verifyPublicAccessDocument = gql`
  mutation RecipientViewVerify_verifyPublicAccess(
    $token: ID!
    $keycode: ID!
    $ip: String
    $userAgent: String
  ) {
    verifyPublicAccess(token: $token, keycode: $keycode, ip: $ip, userAgent: $userAgent) {
      isAllowed
      cookieName
      cookieValue
      email
      orgName
      orgLogoUrl
      tone
    }
  }
` as unknown as DocumentNode<
  RecipientViewVerify_verifyPublicAccessMutation,
  RecipientViewVerify_verifyPublicAccessMutationVariables
>;
export const RecipientViewVerify_publicSendVerificationCodeDocument = gql`
  mutation RecipientViewVerify_publicSendVerificationCode($keycode: ID!) {
    publicSendVerificationCode(keycode: $keycode) {
      token
      remainingAttempts
      expiresAt
    }
  }
` as unknown as DocumentNode<
  RecipientViewVerify_publicSendVerificationCodeMutation,
  RecipientViewVerify_publicSendVerificationCodeMutationVariables
>;
export const RecipientViewVerify_publicCheckVerificationCodeDocument = gql`
  mutation RecipientViewVerify_publicCheckVerificationCode(
    $keycode: ID!
    $token: ID!
    $code: String!
  ) {
    publicCheckVerificationCode(keycode: $keycode, token: $token, code: $code) {
      result
      remainingAttempts
    }
  }
` as unknown as DocumentNode<
  RecipientViewVerify_publicCheckVerificationCodeMutation,
  RecipientViewVerify_publicCheckVerificationCodeMutationVariables
>;
export const OptOut_publicOptOutRemindersDocument = gql`
  mutation OptOut_publicOptOutReminders(
    $keycode: ID!
    $reason: String!
    $other: String!
    $referer: String
  ) {
    publicOptOutReminders(keycode: $keycode, reason: $reason, other: $other, referer: $referer) {
      petition {
        id
      }
    }
  }
` as unknown as DocumentNode<
  OptOut_publicOptOutRemindersMutation,
  OptOut_publicOptOutRemindersMutationVariables
>;
export const OptOut_accessDocument = gql`
  query OptOut_access($keycode: ID!) {
    access(keycode: $keycode) {
      ...OptOut_PublicPetitionAccess
    }
  }
  ${OptOut_PublicPetitionAccessFragmentDoc}
` as unknown as DocumentNode<OptOut_accessQuery, OptOut_accessQueryVariables>;
export const PublicPetitionLink_publicCreateAndSendPetitionFromPublicLinkDocument = gql`
  mutation PublicPetitionLink_publicCreateAndSendPetitionFromPublicLink(
    $slug: ID!
    $contactFirstName: String!
    $contactLastName: String!
    $contactEmail: String!
    $force: Boolean
  ) {
    publicCreateAndSendPetitionFromPublicLink(
      slug: $slug
      contactFirstName: $contactFirstName
      contactLastName: $contactLastName
      contactEmail: $contactEmail
      force: $force
    )
  }
` as unknown as DocumentNode<
  PublicPetitionLink_publicCreateAndSendPetitionFromPublicLinkMutation,
  PublicPetitionLink_publicCreateAndSendPetitionFromPublicLinkMutationVariables
>;
export const PublicPetitionLink_publicSendReminderDocument = gql`
  mutation PublicPetitionLink_publicSendReminder($slug: ID!, $contactEmail: String!) {
    publicSendReminder(slug: $slug, contactEmail: $contactEmail)
  }
` as unknown as DocumentNode<
  PublicPetitionLink_publicSendReminderMutation,
  PublicPetitionLink_publicSendReminderMutationVariables
>;
export const PublicPetitionLink_publicPetitionLinkBySlugDocument = gql`
  query PublicPetitionLink_publicPetitionLinkBySlug($slug: ID!) {
    publicPetitionLinkBySlug(slug: $slug) {
      ...PublicPetitionLink_PublicPublicPetitionLink
    }
  }
  ${PublicPetitionLink_PublicPublicPetitionLinkFragmentDoc}
` as unknown as DocumentNode<
  PublicPetitionLink_publicPetitionLinkBySlugQuery,
  PublicPetitionLink_publicPetitionLinkBySlugQueryVariables
>;
export const PetitionPdf_petitionDocument = gql`
  query PetitionPdf_petition($token: String!) {
    petitionAuthToken(token: $token) {
      ...PetitionPdf_Petition
    }
  }
  ${PetitionPdf_PetitionFragmentDoc}
` as unknown as DocumentNode<PetitionPdf_petitionQuery, PetitionPdf_petitionQueryVariables>;
export const Signup_userSignUpDocument = gql`
  mutation Signup_userSignUp(
    $email: String!
    $password: String!
    $firstName: String!
    $lastName: String!
    $organizationName: String!
    $locale: String
    $organizationLogo: Upload
    $industry: String
    $role: String
    $position: String
    $captcha: String!
  ) {
    userSignUp(
      email: $email
      password: $password
      firstName: $firstName
      lastName: $lastName
      organizationName: $organizationName
      locale: $locale
      organizationLogo: $organizationLogo
      industry: $industry
      role: $role
      position: $position
      captcha: $captcha
    ) {
      id
      email
      firstName
      lastName
    }
  }
` as unknown as DocumentNode<Signup_userSignUpMutation, Signup_userSignUpMutationVariables>;
export const LandingTemplateDetails_landingTemplateBySlugDocument = gql`
  query LandingTemplateDetails_landingTemplateBySlug($slug: String!) {
    landingTemplateBySlug(slug: $slug) {
      ...LandingTemplateDetails_LandingTemplate
    }
  }
  ${LandingTemplateDetails_LandingTemplateFragmentDoc}
` as unknown as DocumentNode<
  LandingTemplateDetails_landingTemplateBySlugQuery,
  LandingTemplateDetails_landingTemplateBySlugQueryVariables
>;
export const LandingTemplateDetails_landingTemplatesDocument = gql`
  query LandingTemplateDetails_landingTemplates(
    $offset: Int!
    $limit: Int!
    $locale: PetitionLocale!
    $categories: [String!]
  ) {
    landingTemplates(offset: $offset, limit: $limit, locale: $locale, categories: $categories) {
      items {
        ...LandingTemplateCard_LandingTemplate
      }
      totalCount
    }
  }
  ${LandingTemplateCard_LandingTemplateFragmentDoc}
` as unknown as DocumentNode<
  LandingTemplateDetails_landingTemplatesQuery,
  LandingTemplateDetails_landingTemplatesQueryVariables
>;
export const LandingTemplatesCategory_landingTemplatesDocument = gql`
  query LandingTemplatesCategory_landingTemplates(
    $offset: Int!
    $limit: Int!
    $category: String!
    $locale: PetitionLocale!
  ) {
    landingTemplates(offset: $offset, limit: $limit, categories: [$category], locale: $locale) {
      totalCount
      items {
        ...LandingTemplateCard_LandingTemplate
      }
    }
  }
  ${LandingTemplateCard_LandingTemplateFragmentDoc}
` as unknown as DocumentNode<
  LandingTemplatesCategory_landingTemplatesQuery,
  LandingTemplatesCategory_landingTemplatesQueryVariables
>;
export const LandingTemplatesCategory_categorySamplesDocument = gql`
  query LandingTemplatesCategory_categorySamples($locale: PetitionLocale!) {
    landingTemplateCategorySamples {
      ...LandintTemplatesCategory_LandingTemplateCategorySample
    }
  }
  ${LandintTemplatesCategory_LandingTemplateCategorySampleFragmentDoc}
` as unknown as DocumentNode<
  LandingTemplatesCategory_categorySamplesQuery,
  LandingTemplatesCategory_categorySamplesQueryVariables
>;
export const LandingTemplates_categorySamplesDocument = gql`
  query LandingTemplates_categorySamples($offset: Int!, $limit: Int!, $locale: PetitionLocale!) {
    landingTemplateCategorySamples {
      category
      templates(offset: $offset, limit: $limit, locale: $locale) {
        items {
          ...LandingTemplateCard_LandingTemplate
        }
        totalCount
      }
    }
  }
  ${LandingTemplateCard_LandingTemplateFragmentDoc}
` as unknown as DocumentNode<
  LandingTemplates_categorySamplesQuery,
  LandingTemplates_categorySamplesQueryVariables
>;
export const Thanks_petitionLogoDocument = gql`
  query Thanks_petitionLogo($id: GID!) {
    publicOrgLogoUrl(id: $id)
  }
` as unknown as DocumentNode<Thanks_petitionLogoQuery, Thanks_petitionLogoQueryVariables>;
export const GetMyIdDocument = gql`
  query GetMyId {
    me {
      id
    }
  }
` as unknown as DocumentNode<GetMyIdQuery, GetMyIdQueryVariables>;
export const useClonePetitions_clonePetitionsDocument = gql`
  mutation useClonePetitions_clonePetitions($petitionIds: [GID!]!) {
    clonePetitions(petitionIds: $petitionIds) {
      id
    }
  }
` as unknown as DocumentNode<
  useClonePetitions_clonePetitionsMutation,
  useClonePetitions_clonePetitionsMutationVariables
>;
export const useCreateContact_createContactDocument = gql`
  mutation useCreateContact_createContact($data: CreateContactInput!) {
    createContact(data: $data) {
      id
      email
      firstName
      lastName
      fullName
      hasBouncedEmail
    }
  }
` as unknown as DocumentNode<
  useCreateContact_createContactMutation,
  useCreateContact_createContactMutationVariables
>;
export const useCreatePetition_createPetitionDocument = gql`
  mutation useCreatePetition_createPetition(
    $name: String
    $locale: PetitionLocale!
    $petitionId: GID
    $type: PetitionBaseType
  ) {
    createPetition(name: $name, locale: $locale, petitionId: $petitionId, type: $type) {
      id
    }
  }
` as unknown as DocumentNode<
  useCreatePetition_createPetitionMutation,
  useCreatePetition_createPetitionMutationVariables
>;
export const useDeleteContacts_deleteContactsDocument = gql`
  mutation useDeleteContacts_deleteContacts($ids: [GID!]!, $force: Boolean) {
    deleteContacts(ids: $ids, force: $force)
  }
` as unknown as DocumentNode<
  useDeleteContacts_deleteContactsMutation,
  useDeleteContacts_deleteContactsMutationVariables
>;
export const useDeletePetitions_deletePetitionsDocument = gql`
  mutation useDeletePetitions_deletePetitions($ids: [GID!]!) {
    deletePetitions(ids: $ids)
  }
` as unknown as DocumentNode<
  useDeletePetitions_deletePetitionsMutation,
  useDeletePetitions_deletePetitionsMutationVariables
>;
export const useUpdateIsReadNotification_updatePetitionUserNotificationReadStatusDocument = gql`
  mutation useUpdateIsReadNotification_updatePetitionUserNotificationReadStatus(
    $petitionUserNotificationIds: [GID!]
    $filter: PetitionUserNotificationFilter
    $petitionIds: [GID!]
    $petitionFieldCommentIds: [GID!]
    $isRead: Boolean!
  ) {
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
` as unknown as DocumentNode<
  useUpdateIsReadNotification_updatePetitionUserNotificationReadStatusMutation,
  useUpdateIsReadNotification_updatePetitionUserNotificationReadStatusMutationVariables
>;
export const useExportRepliesTask_taskDocument = gql`
  query useExportRepliesTask_task($id: GID!) {
    task(id: $id) {
      ...TaskProgressDialog_Task
    }
  }
  ${TaskProgressDialog_TaskFragmentDoc}
` as unknown as DocumentNode<
  useExportRepliesTask_taskQuery,
  useExportRepliesTask_taskQueryVariables
>;
export const useExportRepliesTask_createExportRepliesTaskDocument = gql`
  mutation useExportRepliesTask_createExportRepliesTask($petitionId: GID!, $pattern: String) {
    createExportRepliesTask(petitionId: $petitionId, pattern: $pattern) {
      ...TaskProgressDialog_Task
    }
  }
  ${TaskProgressDialog_TaskFragmentDoc}
` as unknown as DocumentNode<
  useExportRepliesTask_createExportRepliesTaskMutation,
  useExportRepliesTask_createExportRepliesTaskMutationVariables
>;
export const useExportRepliesTask_getTaskResultFileUrlDocument = gql`
  mutation useExportRepliesTask_getTaskResultFileUrl($taskId: GID!) {
    getTaskResultFileUrl(taskId: $taskId, preview: false)
  }
` as unknown as DocumentNode<
  useExportRepliesTask_getTaskResultFileUrlMutation,
  useExportRepliesTask_getTaskResultFileUrlMutationVariables
>;
export const PetitionSignaturesCardPolling_petitionDocument = gql`
  query PetitionSignaturesCardPolling_petition($petitionId: GID!) {
    petition(id: $petitionId) {
      ...PetitionSignaturesCard_Petition
    }
  }
  ${PetitionSignaturesCard_PetitionFragmentDoc}
` as unknown as DocumentNode<
  PetitionSignaturesCardPolling_petitionQuery,
  PetitionSignaturesCardPolling_petitionQueryVariables
>;
export const usePrintPdfTask_createPrintPdfTaskDocument = gql`
  mutation usePrintPdfTask_createPrintPdfTask($petitionId: GID!) {
    createPrintPdfTask(petitionId: $petitionId) {
      ...TaskProgressDialog_Task
    }
  }
  ${TaskProgressDialog_TaskFragmentDoc}
` as unknown as DocumentNode<
  usePrintPdfTask_createPrintPdfTaskMutation,
  usePrintPdfTask_createPrintPdfTaskMutationVariables
>;
export const usePrintPdfTask_getTaskResultFileUrlDocument = gql`
  mutation usePrintPdfTask_getTaskResultFileUrl($taskId: GID!) {
    getTaskResultFileUrl(taskId: $taskId, preview: true)
  }
` as unknown as DocumentNode<
  usePrintPdfTask_getTaskResultFileUrlMutation,
  usePrintPdfTask_getTaskResultFileUrlMutationVariables
>;
export const usePrintPdfTask_taskDocument = gql`
  query usePrintPdfTask_task($id: GID!) {
    task(id: $id) {
      ...TaskProgressDialog_Task
    }
  }
  ${TaskProgressDialog_TaskFragmentDoc}
` as unknown as DocumentNode<usePrintPdfTask_taskQuery, usePrintPdfTask_taskQueryVariables>;
export const usePublicPrintPdfTask_publicCreatePrintPdfTaskDocument = gql`
  mutation usePublicPrintPdfTask_publicCreatePrintPdfTask($keycode: ID!) {
    publicCreatePrintPdfTask(keycode: $keycode) {
      ...TaskProgressDialog_Task
    }
  }
  ${TaskProgressDialog_TaskFragmentDoc}
` as unknown as DocumentNode<
  usePublicPrintPdfTask_publicCreatePrintPdfTaskMutation,
  usePublicPrintPdfTask_publicCreatePrintPdfTaskMutationVariables
>;
export const usePublicPrintPdfTask_publicGetTaskResultFileUrlDocument = gql`
  mutation usePublicPrintPdfTask_publicGetTaskResultFileUrl($taskId: GID!, $keycode: ID!) {
    publicGetTaskResultFileUrl(taskId: $taskId, keycode: $keycode)
  }
` as unknown as DocumentNode<
  usePublicPrintPdfTask_publicGetTaskResultFileUrlMutation,
  usePublicPrintPdfTask_publicGetTaskResultFileUrlMutationVariables
>;
export const usePublicPrintPdfTask_publicTaskDocument = gql`
  query usePublicPrintPdfTask_publicTask($taskId: GID!, $keycode: ID!) {
    task: publicTask(taskId: $taskId, keycode: $keycode) {
      ...TaskProgressDialog_Task
    }
  }
  ${TaskProgressDialog_TaskFragmentDoc}
` as unknown as DocumentNode<
  usePublicPrintPdfTask_publicTaskQuery,
  usePublicPrintPdfTask_publicTaskQueryVariables
>;
export const useSearchContacts_contactsDocument = gql`
  query useSearchContacts_contacts($search: String, $exclude: [GID!]) {
    contacts(limit: 10, search: $search, exclude: $exclude) {
      items {
        ...ContactSelect_Contact
      }
    }
  }
  ${ContactSelect_ContactFragmentDoc}
` as unknown as DocumentNode<
  useSearchContacts_contactsQuery,
  useSearchContacts_contactsQueryVariables
>;
export const useSearchContactsByEmail_contactsByEmailDocument = gql`
  query useSearchContactsByEmail_contactsByEmail($emails: [String!]!) {
    contactsByEmail(emails: $emails) {
      ...ContactSelect_Contact
    }
  }
  ${ContactSelect_ContactFragmentDoc}
` as unknown as DocumentNode<
  useSearchContactsByEmail_contactsByEmailQuery,
  useSearchContactsByEmail_contactsByEmailQueryVariables
>;
