import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
import gql from "graphql-tag";
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
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
  Upload: any;
};

/** JSON with AWS S3 url and required form data to make a POST request */
export type AWSPresignedPostData = {
  fields: Scalars["JSONObject"];
  url: Scalars["String"];
};

export type AccessActivatedEvent = PetitionEvent & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type AccessActivatedFromPublicPetitionLinkEvent = PetitionEvent & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type AccessActivatedFromPublicPetitionLinkUserNotification = PetitionUserNotification & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  isRead: Scalars["Boolean"];
  petition: PetitionBase;
};

export type AccessDeactivatedEvent = PetitionEvent & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  petition: Maybe<Petition>;
  reason: Scalars["String"];
  type: PetitionEventType;
  user: Maybe<User>;
};

export type AccessDelegatedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  newAccess: PetitionAccess;
  originalAccess: PetitionAccess;
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type AccessOpenedEvent = PetitionEvent & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type AsyncFieldCompletionResponse = {
  type: Scalars["String"];
  url: Scalars["String"];
};

export type BulkCreateContactsReturnType = {
  contacts: Array<Contact>;
  errors: Maybe<Array<Scalars["JSON"]>>;
};

export type BulkSendSigningMode =
  /** Allow configured signer(s) to sign every petition on the batch */
  | "COPY_SIGNATURE_SETTINGS"
  /** Disable eSignature on every petition of this batch. */
  | "DISABLE_SIGNATURE"
  /** Let recipients of each group to choose who will sign the petitions. */
  | "LET_RECIPIENT_CHOOSE";

export type ChangePasswordResult = "INCORRECT_PASSWORD" | "INVALID_NEW_PASSWORD" | "SUCCESS";

export type CommentCreatedUserNotification = PetitionUserNotification & {
  comment: PetitionFieldComment;
  createdAt: Scalars["DateTime"];
  field: PetitionField;
  id: Scalars["GID"];
  isRead: Scalars["Boolean"];
  petition: PetitionBase;
};

export type CommentDeletedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  deletedBy: Maybe<UserOrPetitionAccess>;
  field: Maybe<PetitionField>;
  id: Scalars["GID"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type CommentPublishedEvent = PetitionEvent & {
  comment: Maybe<PetitionFieldComment>;
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  field: Maybe<PetitionField>;
  id: Scalars["GID"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

/** Information from the connection. */
export type ConnectionMetadata = {
  browserName: Maybe<Scalars["String"]>;
  browserVersion: Maybe<Scalars["String"]>;
  country: Maybe<Scalars["String"]>;
  ip: Maybe<Scalars["String"]>;
};

/** A contact in the system. */
export type Contact = Timestamps & {
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
  lastName: Maybe<Scalars["String"]>;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
};

/** A contact in the system. */
export type ContactaccessesArgs = {
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
};

export type ContactPagination = {
  /** The requested slice of items. */
  items: Array<Contact>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
};

export type CreateContactInput = {
  email: Scalars["String"];
  firstName: Scalars["String"];
  lastName?: InputMaybe<Scalars["String"]>;
};

export type CreatedAt = {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
};

/** The effective permission for a petition and user */
export type EffectivePetitionUserPermission = {
  /** wether user is subscribed or not to emails and alerts of the petition */
  isSubscribed: Scalars["Boolean"];
  /** The type of the permission. */
  permissionType: PetitionPermissionType;
  user: User;
};

export type EntityType = "Contact" | "Organization" | "Petition" | "User";

export type FeatureFlag =
  | "AUTO_ANONYMIZE"
  | "CUSTOM_HOST_UI"
  | "DEVELOPER_ACCESS"
  | "ES_TAX_DOCUMENTS_FIELD"
  | "EXPORT_CUATRECASAS"
  | "GHOST_LOGIN"
  | "HIDE_RECIPIENT_VIEW_CONTENTS"
  | "INTERNAL_COMMENTS"
  | "ON_BEHALF_OF"
  | "PETITION_ACCESS_RECIPIENT_URL_FIELD"
  | "PETITION_PDF_EXPORT"
  | "PETITION_SIGNATURE"
  | "PUBLIC_PETITION_LINK_PREFILL_SECRET_UI"
  | "REMOVE_PARALLEL_BRANDING"
  | "REMOVE_WHY_WE_USE_PARALLEL"
  | "SKIP_FORWARD_SECURITY";

export type FileUpload = {
  contentType: Scalars["String"];
  filename: Scalars["String"];
  isComplete: Scalars["Boolean"];
  size: Scalars["Int"];
};

export type FileUploadDownloadLinkResult = {
  file: Maybe<FileUpload>;
  result: Result;
  url: Maybe<Scalars["String"]>;
};

export type FileUploadInput = {
  contentType: Scalars["String"];
  filename: Scalars["String"];
  size: Scalars["Int"];
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

export type GenerateUserAuthTokenResponse = {
  apiKey: Scalars["String"];
  userAuthToken: UserAuthenticationToken;
};

export type GroupPermissionAddedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  permissionGroup: Maybe<UserGroup>;
  permissionType: PetitionPermissionType;
  petition: Maybe<Petition>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type GroupPermissionEditedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  permissionGroup: Maybe<UserGroup>;
  permissionType: PetitionPermissionType;
  petition: Maybe<Petition>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type GroupPermissionRemovedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  permissionGroup: Maybe<UserGroup>;
  petition: Maybe<Petition>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type ImageOptions = {
  resize?: InputMaybe<ImageOptionsResize>;
};

export type ImageOptionsResize = {
  fit?: InputMaybe<ImageOptionsResizeFit>;
  height?: InputMaybe<Scalars["Int"]>;
  width?: InputMaybe<Scalars["Int"]>;
};

export type ImageOptionsResizeFit = "contain" | "cover" | "fill" | "inside" | "outside";

/** The types of integrations available. */
export type IntegrationType = "SIGNATURE" | "SSO" | "USER_PROVISIONING";

/** A public template on landing page */
export type LandingTemplate = {
  backgroundColor: Maybe<Scalars["String"]>;
  categories: Maybe<Array<Scalars["String"]>>;
  descriptionHtml: Maybe<Scalars["String"]>;
  fieldCount: Scalars["Int"];
  fields: Array<LandingTemplateField>;
  hasConditionals: Scalars["Boolean"];
  id: Scalars["GID"];
  imageUrl: Maybe<Scalars["String"]>;
  locale: PetitionLocale;
  name: Maybe<Scalars["String"]>;
  organizationName: Scalars["String"];
  ownerAvatarUrl: Maybe<Scalars["String"]>;
  ownerFullName: Scalars["String"];
  publicLinkUrl: Maybe<Scalars["String"]>;
  shortDescription: Maybe<Scalars["String"]>;
  slug: Scalars["String"];
  updatedAt: Scalars["DateTime"];
};

/** A public template on landing page */
export type LandingTemplateimageUrlArgs = {
  small?: InputMaybe<Scalars["Boolean"]>;
};

export type LandingTemplateCategorySample = {
  category: Scalars["String"];
  templates: LandingTemplatePagination;
};

export type LandingTemplateCategorySampletemplatesArgs = {
  limit?: InputMaybe<Scalars["Int"]>;
  locale: PetitionLocale;
  offset?: InputMaybe<Scalars["Int"]>;
};

/** A public template field */
export type LandingTemplateField = {
  id: Scalars["GID"];
  title: Maybe<Scalars["String"]>;
  type: PetitionFieldType;
};

export type LandingTemplatePagination = {
  /** The requested slice of items. */
  items: Array<LandingTemplate>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
};

export type MessageCancelledEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  message: PetitionMessage;
  petition: Maybe<Petition>;
  reason: Scalars["String"];
  type: PetitionEventType;
  user: Maybe<User>;
};

export type MessageEmailBouncedUserNotification = PetitionUserNotification & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  isRead: Scalars["Boolean"];
  petition: PetitionBase;
};

export type MessageScheduledEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  message: PetitionMessage;
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type MessageSentEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  message: PetitionMessage;
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type Mutation = {
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
  bulkCreateContacts: BulkCreateContactsReturnType;
  /** Submits multiple replies on a petition at once given a JSON input where the keys are field aliases and values are the replie(s) for that field. */
  bulkCreatePetitionReplies: Petition;
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
  /** Clones the user group with all its members */
  cloneUserGroup: Array<UserGroup>;
  /** Closes an open petition. */
  closePetition: Petition;
  /**
   * Marks a petition as COMPLETED.
   * If the petition has a signature configured and does not require a review, starts the signing process.
   */
  completePetition: Petition;
  /** Create a contact. */
  createContact: Contact;
  /** Creates an event subscription for the user's petitions */
  createEventSubscription: PetitionEventSubscription;
  /** Creates a task for exporting an xlsx file with petition text replies and sends it to the queue */
  createExportExcelTask: Task;
  /** Creates a task for exporting a ZIP file with petition replies and sends it to the queue */
  createExportRepliesTask: Task;
  /** Creates a task for exporting a report grouping the replies of every petition coming from the same template */
  createExportReportTask: Task;
  /** Creates a reply to a file upload field. */
  createFileUploadReply: FileUploadReplyResponse;
  /** Notifies the backend that the upload is complete. */
  createFileUploadReplyComplete: PetitionFieldReply;
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
  deletePetitions: Success;
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
  loginAs: Result;
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
  /** Creates a reply to a file upload field. */
  publicCreateFileUploadReply: PublicCreateFileUploadReply;
  /** Create a petition field comment. */
  publicCreatePetitionFieldComment: PublicPetitionFieldComment;
  /** Creates a reply on a petition field as recipient. */
  publicCreatePetitionFieldReply: PublicPetitionFieldReply;
  /** Starts an export pdf task in a recipient context */
  publicCreatePrintPdfTask: Task;
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
  /** Resets the user password and resend the Invitation email. Only works if cognito user has status FORCE_CHANGE_PASSWORD */
  publicResetTemporaryPassword: Result;
  publicSendReminder: Result;
  publicSendVerificationCode: VerificationCodeRequest;
  /** Starts the completion of an async field */
  publicStartAsyncFieldCompletion: AsyncFieldCompletionResponse;
  /** Update a petition field comment. */
  publicUpdatePetitionFieldComment: PublicPetitionFieldComment;
  /** Creates a reply on a petition field as recipient. */
  publicUpdatePetitionFieldReply: PublicPetitionFieldReply;
  /** Reactivates the specified inactive petition accesses. */
  reactivateAccesses: Array<PetitionAccess>;
  /** Removes permissions on given petitions and users */
  removePetitionPermission: Array<Maybe<PetitionBase>>;
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
  restoreLogin: Result;
  /** Soft-deletes a given auth token, making it permanently unusable. */
  revokeUserAuthToken: Result;
  /** Sends different petitions to each of the specified contact groups, creating corresponding accesses and messages */
  sendPetition: Array<SendPetitionResult>;
  /** Sends an email to all contacts of the petition confirming the replies are ok */
  sendPetitionClosedNotification: Petition;
  /** Sends a reminder for the specified petition accesses. */
  sendReminders: Result;
  /** Sends a reminder email to the pending signers */
  sendSignatureRequestReminders: Result;
  /** Set the delegades of a user */
  setUserDelegates: User;
  /** Sets the locale passed as arg as the preferred language of the user to see the page */
  setUserPreferredLocale: User;
  /** Shares our SignaturIt production APIKEY with the passed Org, creates corresponding usage limits and activates PETITION_SIGNATURE feature flag. */
  shareSignaturitApiKey: SupportMethodResponse;
  /** Generates a download link for the signed PDF petition. */
  signedPetitionDownloadLink: FileUploadDownloadLinkResult;
  /** Starts the completion of an async field */
  startAsyncFieldCompletion: AsyncFieldCompletionResponse;
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
  /** Updates a contact. */
  updateContact: Contact;
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
  /** Updates the period after closed petitions of this organization are automatically anonymized. */
  updateOrganizationAutoAnonymizePeriod: Organization;
  /** updates the theme of the PDF documents of the organization */
  updateOrganizationDocumentTheme: Organization;
  /** Updates the limits of a given org. If 'Update Only Current Period' is left unchecked, the changes will be reflected on the next period. */
  updateOrganizationLimits: SupportMethodResponse;
  /** Updates the logo of an organization */
  updateOrganizationLogo: Organization;
  /** Changes the organization preferred tone */
  updateOrganizationPreferredTone: Organization;
  /** Applies a given tier to the organization */
  updateOrganizationTier: SupportMethodResponse;
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
  /** Updates the info and permissions of a public link */
  updatePublicPetitionLink: PublicPetitionLink;
  /** Updates template_public from template */
  updatePublicTemplateVisibility: SupportMethodResponse;
  updateSignatureRequestMetadata: PetitionSignatureRequest;
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
};

export type MutationactivateUserArgs = {
  userIds: Array<Scalars["GID"]>;
};

export type MutationaddPetitionPermissionArgs = {
  message?: InputMaybe<Scalars["String"]>;
  notify?: InputMaybe<Scalars["Boolean"]>;
  permissionType: PetitionPermissionTypeRW;
  petitionIds: Array<Scalars["GID"]>;
  subscribe?: InputMaybe<Scalars["Boolean"]>;
  userGroupIds?: InputMaybe<Array<Scalars["GID"]>>;
  userIds?: InputMaybe<Array<Scalars["GID"]>>;
};

export type MutationaddUsersToUserGroupArgs = {
  userGroupId: Scalars["GID"];
  userIds: Array<Scalars["GID"]>;
};

export type MutationapproveOrRejectPetitionFieldRepliesArgs = {
  petitionId: Scalars["GID"];
  status: PetitionFieldReplyStatus;
};

export type MutationassignPetitionToUserArgs = {
  petitionId: Scalars["ID"];
  userId: Scalars["GID"];
};

export type MutationbulkCreateContactsArgs = {
  file: Scalars["Upload"];
};

export type MutationbulkCreatePetitionRepliesArgs = {
  petitionId: Scalars["GID"];
  replies: Scalars["JSONObject"];
};

export type MutationcancelScheduledMessageArgs = {
  messageId: Scalars["GID"];
  petitionId: Scalars["GID"];
};

export type MutationcancelSignatureRequestArgs = {
  petitionSignatureRequestId: Scalars["GID"];
};

export type MutationchangeOrganizationArgs = {
  orgId?: InputMaybe<Scalars["GID"]>;
};

export type MutationchangePasswordArgs = {
  newPassword: Scalars["String"];
  password: Scalars["String"];
};

export type MutationchangePetitionFieldTypeArgs = {
  fieldId: Scalars["GID"];
  force?: InputMaybe<Scalars["Boolean"]>;
  petitionId: Scalars["GID"];
  type: PetitionFieldType;
};

export type MutationclonePetitionFieldArgs = {
  fieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
};

export type MutationclonePetitionsArgs = {
  petitionIds: Array<Scalars["GID"]>;
};

export type MutationcloneUserGroupArgs = {
  locale?: InputMaybe<Scalars["String"]>;
  userGroupIds: Array<Scalars["GID"]>;
};

export type MutationclosePetitionArgs = {
  petitionId: Scalars["GID"];
};

export type MutationcompletePetitionArgs = {
  additionalSigners?: InputMaybe<Array<PublicPetitionSignerDataInput>>;
  message?: InputMaybe<Scalars["String"]>;
  petitionId: Scalars["GID"];
};

export type MutationcreateContactArgs = {
  data: CreateContactInput;
};

export type MutationcreateEventSubscriptionArgs = {
  eventTypes?: InputMaybe<Array<PetitionEventType>>;
  eventsUrl: Scalars["String"];
  fromTemplateId?: InputMaybe<Scalars["GID"]>;
  name?: InputMaybe<Scalars["String"]>;
};

export type MutationcreateExportExcelTaskArgs = {
  petitionId: Scalars["GID"];
};

export type MutationcreateExportRepliesTaskArgs = {
  pattern?: InputMaybe<Scalars["String"]>;
  petitionId: Scalars["GID"];
};

export type MutationcreateExportReportTaskArgs = {
  petitionId: Scalars["GID"];
  timezone: Scalars["String"];
};

export type MutationcreateFileUploadReplyArgs = {
  fieldId: Scalars["GID"];
  file: FileUploadInput;
  petitionId: Scalars["GID"];
};

export type MutationcreateFileUploadReplyCompleteArgs = {
  petitionId: Scalars["GID"];
  replyId: Scalars["GID"];
};

export type MutationcreateOrganizationArgs = {
  email: Scalars["String"];
  firstName: Scalars["String"];
  lastName: Scalars["String"];
  locale: PetitionLocale;
  name: Scalars["String"];
  password: Scalars["String"];
  status: OrganizationStatus;
};

export type MutationcreateOrganizationUserArgs = {
  email: Scalars["String"];
  firstName: Scalars["String"];
  lastName: Scalars["String"];
  locale?: InputMaybe<Scalars["String"]>;
  role: OrganizationRole;
  userGroupIds?: InputMaybe<Array<Scalars["GID"]>>;
};

export type MutationcreatePetitionArgs = {
  locale?: InputMaybe<PetitionLocale>;
  name?: InputMaybe<Scalars["String"]>;
  petitionId?: InputMaybe<Scalars["GID"]>;
  type?: InputMaybe<PetitionBaseType>;
};

export type MutationcreatePetitionAttachmentUploadLinkArgs = {
  data: FileUploadInput;
  petitionId: Scalars["GID"];
};

export type MutationcreatePetitionFieldArgs = {
  petitionId: Scalars["GID"];
  position?: InputMaybe<Scalars["Int"]>;
  type: PetitionFieldType;
};

export type MutationcreatePetitionFieldAttachmentUploadLinkArgs = {
  data: FileUploadInput;
  fieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
};

export type MutationcreatePetitionFieldCommentArgs = {
  content: Scalars["String"];
  isInternal?: InputMaybe<Scalars["Boolean"]>;
  petitionFieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
};

export type MutationcreatePetitionFieldReplyArgs = {
  fieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
  reply: Scalars["JSON"];
};

export type MutationcreatePrintPdfTaskArgs = {
  includeNdLinks?: InputMaybe<Scalars["Boolean"]>;
  petitionId: Scalars["GID"];
  skipAttachments?: InputMaybe<Scalars["Boolean"]>;
};

export type MutationcreatePublicPetitionLinkArgs = {
  description: Scalars["String"];
  prefillSecret?: InputMaybe<Scalars["String"]>;
  slug?: InputMaybe<Scalars["String"]>;
  templateId: Scalars["GID"];
  title: Scalars["String"];
};

export type MutationcreateSignatureIntegrationArgs = {
  apiKey: Scalars["String"];
  isDefault?: InputMaybe<Scalars["Boolean"]>;
  name: Scalars["String"];
  provider: SignatureOrgIntegrationProvider;
};

export type MutationcreateTagArgs = {
  color: Scalars["String"];
  name: Scalars["String"];
};

export type MutationcreateUserArgs = {
  email: Scalars["String"];
  firstName: Scalars["String"];
  lastName: Scalars["String"];
  locale: PetitionLocale;
  organizationId: Scalars["Int"];
  password: Scalars["String"];
  role: OrganizationRole;
};

export type MutationcreateUserGroupArgs = {
  name: Scalars["String"];
  userIds: Array<Scalars["GID"]>;
};

export type MutationdeactivateAccessesArgs = {
  accessIds: Array<Scalars["GID"]>;
  petitionId: Scalars["GID"];
};

export type MutationdeactivateUserArgs = {
  deletePetitions?: InputMaybe<Scalars["Boolean"]>;
  transferToUserId?: InputMaybe<Scalars["GID"]>;
  userIds: Array<Scalars["GID"]>;
};

export type MutationdeleteContactsArgs = {
  force?: InputMaybe<Scalars["Boolean"]>;
  ids: Array<Scalars["GID"]>;
};

export type MutationdeleteEventSubscriptionsArgs = {
  ids: Array<Scalars["GID"]>;
};

export type MutationdeletePetitionArgs = {
  petitionId: Scalars["ID"];
};

export type MutationdeletePetitionAttachmentArgs = {
  attachmentId: Scalars["GID"];
  petitionId: Scalars["GID"];
};

export type MutationdeletePetitionFieldArgs = {
  fieldId: Scalars["GID"];
  force?: InputMaybe<Scalars["Boolean"]>;
  petitionId: Scalars["GID"];
};

export type MutationdeletePetitionFieldAttachmentArgs = {
  attachmentId: Scalars["GID"];
  fieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
};

export type MutationdeletePetitionFieldCommentArgs = {
  petitionFieldCommentId: Scalars["GID"];
  petitionFieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
};

export type MutationdeletePetitionReplyArgs = {
  petitionId: Scalars["GID"];
  replyId: Scalars["GID"];
};

export type MutationdeletePetitionsArgs = {
  dryrun?: InputMaybe<Scalars["Boolean"]>;
  force?: InputMaybe<Scalars["Boolean"]>;
  ids: Array<Scalars["GID"]>;
};

export type MutationdeleteSignatureIntegrationArgs = {
  force?: InputMaybe<Scalars["Boolean"]>;
  id: Scalars["GID"];
};

export type MutationdeleteTagArgs = {
  id: Scalars["GID"];
};

export type MutationdeleteUserGroupArgs = {
  ids: Array<Scalars["GID"]>;
};

export type MutationdynamicSelectFieldFileDownloadLinkArgs = {
  fieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
};

export type MutationeditPetitionPermissionArgs = {
  permissionType: PetitionPermissionType;
  petitionIds: Array<Scalars["GID"]>;
  userGroupIds?: InputMaybe<Array<Scalars["GID"]>>;
  userIds?: InputMaybe<Array<Scalars["GID"]>>;
};

export type MutationfileUploadReplyDownloadLinkArgs = {
  petitionId: Scalars["GID"];
  preview?: InputMaybe<Scalars["Boolean"]>;
  replyId: Scalars["GID"];
};

export type MutationgenerateUserAuthTokenArgs = {
  tokenName: Scalars["String"];
};

export type MutationgetApiTokenOwnerArgs = {
  token: Scalars["String"];
};

export type MutationgetTaskResultFileUrlArgs = {
  preview?: InputMaybe<Scalars["Boolean"]>;
  taskId: Scalars["GID"];
};

export type MutationloginAsArgs = {
  userId: Scalars["GID"];
};

export type MutationmarkSignatureIntegrationAsDefaultArgs = {
  id: Scalars["GID"];
};

export type MutationmodifyPetitionCustomPropertyArgs = {
  key: Scalars["String"];
  petitionId: Scalars["GID"];
  value?: InputMaybe<Scalars["String"]>;
};

export type MutationpetitionAttachmentDownloadLinkArgs = {
  attachmentId: Scalars["GID"];
  petitionId: Scalars["GID"];
};

export type MutationpetitionAttachmentUploadCompleteArgs = {
  attachmentId: Scalars["GID"];
  petitionId: Scalars["GID"];
};

export type MutationpetitionFieldAttachmentDownloadLinkArgs = {
  attachmentId: Scalars["GID"];
  fieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
};

export type MutationpetitionFieldAttachmentUploadCompleteArgs = {
  attachmentId: Scalars["GID"];
  fieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
};

export type MutationpublicCheckVerificationCodeArgs = {
  code: Scalars["String"];
  keycode: Scalars["ID"];
  token: Scalars["ID"];
};

export type MutationpublicCompletePetitionArgs = {
  additionalSigners?: InputMaybe<Array<PublicPetitionSignerDataInput>>;
  keycode: Scalars["ID"];
  message?: InputMaybe<Scalars["String"]>;
};

export type MutationpublicCreateAndSendPetitionFromPublicLinkArgs = {
  contactEmail: Scalars["String"];
  contactFirstName: Scalars["String"];
  contactLastName: Scalars["String"];
  force?: InputMaybe<Scalars["Boolean"]>;
  prefill?: InputMaybe<Scalars["String"]>;
  slug: Scalars["ID"];
};

export type MutationpublicCreateFileUploadReplyArgs = {
  data: FileUploadInput;
  fieldId: Scalars["GID"];
  keycode: Scalars["ID"];
};

export type MutationpublicCreatePetitionFieldCommentArgs = {
  content: Scalars["String"];
  keycode: Scalars["ID"];
  petitionFieldId: Scalars["GID"];
};

export type MutationpublicCreatePetitionFieldReplyArgs = {
  fieldId: Scalars["GID"];
  keycode: Scalars["ID"];
  reply: Scalars["JSON"];
};

export type MutationpublicCreatePrintPdfTaskArgs = {
  keycode: Scalars["ID"];
};

export type MutationpublicDelegateAccessToContactArgs = {
  email: Scalars["String"];
  firstName: Scalars["String"];
  keycode: Scalars["ID"];
  lastName: Scalars["String"];
  messageBody: Scalars["JSON"];
};

export type MutationpublicDeletePetitionFieldCommentArgs = {
  keycode: Scalars["ID"];
  petitionFieldCommentId: Scalars["GID"];
  petitionFieldId: Scalars["GID"];
};

export type MutationpublicDeletePetitionFieldReplyArgs = {
  keycode: Scalars["ID"];
  replyId: Scalars["GID"];
};

export type MutationpublicFileUploadReplyCompleteArgs = {
  keycode: Scalars["ID"];
  replyId: Scalars["GID"];
};

export type MutationpublicFileUploadReplyDownloadLinkArgs = {
  keycode: Scalars["ID"];
  preview?: InputMaybe<Scalars["Boolean"]>;
  replyId: Scalars["GID"];
};

export type MutationpublicGetTaskResultFileUrlArgs = {
  keycode: Scalars["ID"];
  taskId: Scalars["GID"];
};

export type MutationpublicMarkPetitionFieldCommentsAsReadArgs = {
  keycode: Scalars["ID"];
  petitionFieldCommentIds: Array<Scalars["GID"]>;
};

export type MutationpublicOptOutRemindersArgs = {
  keycode: Scalars["ID"];
  other: Scalars["String"];
  reason: Scalars["String"];
  referer?: InputMaybe<Scalars["String"]>;
};

export type MutationpublicPetitionFieldAttachmentDownloadLinkArgs = {
  attachmentId: Scalars["GID"];
  fieldId: Scalars["GID"];
  keycode: Scalars["ID"];
  preview?: InputMaybe<Scalars["Boolean"]>;
};

export type MutationpublicResetTemporaryPasswordArgs = {
  email: Scalars["String"];
  locale?: InputMaybe<Scalars["String"]>;
};

export type MutationpublicSendReminderArgs = {
  contactEmail: Scalars["String"];
  slug: Scalars["ID"];
};

export type MutationpublicSendVerificationCodeArgs = {
  keycode: Scalars["ID"];
};

export type MutationpublicStartAsyncFieldCompletionArgs = {
  fieldId: Scalars["GID"];
  keycode: Scalars["ID"];
};

export type MutationpublicUpdatePetitionFieldCommentArgs = {
  content: Scalars["String"];
  keycode: Scalars["ID"];
  petitionFieldCommentId: Scalars["GID"];
  petitionFieldId: Scalars["GID"];
};

export type MutationpublicUpdatePetitionFieldReplyArgs = {
  keycode: Scalars["ID"];
  reply: Scalars["JSON"];
  replyId: Scalars["GID"];
};

export type MutationreactivateAccessesArgs = {
  accessIds: Array<Scalars["GID"]>;
  petitionId: Scalars["GID"];
};

export type MutationremovePetitionPermissionArgs = {
  petitionIds: Array<Scalars["GID"]>;
  removeAll?: InputMaybe<Scalars["Boolean"]>;
  userGroupIds?: InputMaybe<Array<Scalars["GID"]>>;
  userIds?: InputMaybe<Array<Scalars["GID"]>>;
};

export type MutationremoveUsersFromGroupArgs = {
  userGroupId: Scalars["GID"];
  userIds: Array<Scalars["GID"]>;
};

export type MutationreopenPetitionArgs = {
  petitionId: Scalars["GID"];
};

export type MutationresendVerificationCodeArgs = {
  email: Scalars["String"];
  locale?: InputMaybe<Scalars["String"]>;
};

export type MutationresetSignaturitOrganizationBrandingArgs = {
  orgId: Scalars["Int"];
};

export type MutationresetTemporaryPasswordArgs = {
  email: Scalars["String"];
  locale?: InputMaybe<Scalars["String"]>;
};

export type MutationresetUserPasswordArgs = {
  email: Scalars["String"];
  locale: PetitionLocale;
};

export type MutationrevokeUserAuthTokenArgs = {
  authTokenIds: Array<Scalars["GID"]>;
};

export type MutationsendPetitionArgs = {
  body: Scalars["JSON"];
  bulkSendSigningMode?: InputMaybe<BulkSendSigningMode>;
  contactIdGroups: Array<Array<Scalars["GID"]>>;
  petitionId: Scalars["GID"];
  remindersConfig?: InputMaybe<RemindersConfigInput>;
  scheduledAt?: InputMaybe<Scalars["DateTime"]>;
  senderId?: InputMaybe<Scalars["GID"]>;
  subject: Scalars["String"];
};

export type MutationsendPetitionClosedNotificationArgs = {
  attachPdfExport: Scalars["Boolean"];
  emailBody: Scalars["JSON"];
  force?: InputMaybe<Scalars["Boolean"]>;
  pdfExportTitle?: InputMaybe<Scalars["String"]>;
  petitionId: Scalars["GID"];
};

export type MutationsendRemindersArgs = {
  accessIds: Array<Scalars["GID"]>;
  body?: InputMaybe<Scalars["JSON"]>;
  petitionId: Scalars["GID"];
};

export type MutationsendSignatureRequestRemindersArgs = {
  petitionSignatureRequestId: Scalars["GID"];
};

export type MutationsetUserDelegatesArgs = {
  delegateIds: Array<Scalars["GID"]>;
};

export type MutationsetUserPreferredLocaleArgs = {
  locale: Scalars["String"];
};

export type MutationshareSignaturitApiKeyArgs = {
  limit: Scalars["Int"];
  orgId: Scalars["Int"];
  period: Scalars["String"];
};

export type MutationsignedPetitionDownloadLinkArgs = {
  downloadAuditTrail?: InputMaybe<Scalars["Boolean"]>;
  petitionSignatureRequestId: Scalars["GID"];
  preview?: InputMaybe<Scalars["Boolean"]>;
};

export type MutationstartAsyncFieldCompletionArgs = {
  fieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
};

export type MutationstartSignatureRequestArgs = {
  message?: InputMaybe<Scalars["String"]>;
  petitionId: Scalars["GID"];
};

export type MutationswitchAutomaticRemindersArgs = {
  accessIds: Array<Scalars["GID"]>;
  petitionId: Scalars["GID"];
  remindersConfig?: InputMaybe<RemindersConfigInput>;
  start: Scalars["Boolean"];
};

export type MutationtagPetitionArgs = {
  petitionId: Scalars["GID"];
  tagId: Scalars["GID"];
};

export type MutationtransferOrganizationOwnershipArgs = {
  organizationId: Scalars["Int"];
  userId: Scalars["GID"];
};

export type MutationtransferPetitionOwnershipArgs = {
  petitionIds: Array<Scalars["GID"]>;
  userId: Scalars["GID"];
};

export type MutationuntagPetitionArgs = {
  petitionId: Scalars["GID"];
  tagId: Scalars["GID"];
};

export type MutationupdateContactArgs = {
  data: UpdateContactInput;
  id: Scalars["GID"];
};

export type MutationupdateEventSubscriptionArgs = {
  id: Scalars["GID"];
  isEnabled: Scalars["Boolean"];
};

export type MutationupdateFeatureFlagArgs = {
  featureFlag: FeatureFlag;
  orgId: Scalars["Int"];
  value: Scalars["Boolean"];
};

export type MutationupdateFieldPositionsArgs = {
  fieldIds: Array<Scalars["GID"]>;
  petitionId: Scalars["GID"];
};

export type MutationupdateFileUploadReplyArgs = {
  file: FileUploadInput;
  petitionId: Scalars["GID"];
  replyId: Scalars["GID"];
};

export type MutationupdateFileUploadReplyCompleteArgs = {
  petitionId: Scalars["GID"];
  replyId: Scalars["GID"];
};

export type MutationupdateLandingTemplateMetadataArgs = {
  backgroundColor?: InputMaybe<Scalars["String"]>;
  categories?: InputMaybe<Scalars["String"]>;
  description?: InputMaybe<Scalars["String"]>;
  image?: InputMaybe<Scalars["Upload"]>;
  slug?: InputMaybe<Scalars["String"]>;
  templateId: Scalars["ID"];
};

export type MutationupdateOrganizationAutoAnonymizePeriodArgs = {
  months?: InputMaybe<Scalars["Int"]>;
};

export type MutationupdateOrganizationDocumentThemeArgs = {
  data: OrganizationDocumentThemeInput;
};

export type MutationupdateOrganizationLimitsArgs = {
  amount: Scalars["Int"];
  orgId: Scalars["Int"];
  period?: InputMaybe<Scalars["String"]>;
  type: OrganizationUsageLimitName;
  updateOnlyCurrentPeriod: Scalars["Boolean"];
};

export type MutationupdateOrganizationLogoArgs = {
  file: Scalars["Upload"];
  isIcon?: InputMaybe<Scalars["Boolean"]>;
};

export type MutationupdateOrganizationPreferredToneArgs = {
  tone: Tone;
};

export type MutationupdateOrganizationTierArgs = {
  orgId: Scalars["Int"];
  tier: Scalars["String"];
};

export type MutationupdateOrganizationUserArgs = {
  role: OrganizationRole;
  userGroupIds?: InputMaybe<Array<Scalars["GID"]>>;
  userId: Scalars["GID"];
};

export type MutationupdateOrganizationUserLimitArgs = {
  limit: Scalars["Int"];
  orgId: Scalars["Int"];
};

export type MutationupdatePetitionArgs = {
  data: UpdatePetitionInput;
  petitionId: Scalars["GID"];
};

export type MutationupdatePetitionFieldArgs = {
  data: UpdatePetitionFieldInput;
  fieldId: Scalars["GID"];
  force?: InputMaybe<Scalars["Boolean"]>;
  petitionId: Scalars["GID"];
};

export type MutationupdatePetitionFieldCommentArgs = {
  content: Scalars["String"];
  petitionFieldCommentId: Scalars["GID"];
  petitionFieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
};

export type MutationupdatePetitionFieldRepliesStatusArgs = {
  petitionFieldId: Scalars["GID"];
  petitionFieldReplyIds: Array<Scalars["GID"]>;
  petitionId: Scalars["GID"];
  status: PetitionFieldReplyStatus;
};

export type MutationupdatePetitionFieldReplyArgs = {
  petitionId: Scalars["GID"];
  reply: Scalars["JSON"];
  replyId: Scalars["GID"];
};

export type MutationupdatePetitionFieldReplyMetadataArgs = {
  metadata: Scalars["JSONObject"];
  petitionId: Scalars["GID"];
  replyId: Scalars["GID"];
};

export type MutationupdatePetitionMetadataArgs = {
  metadata: Scalars["JSONObject"];
  petitionId: Scalars["GID"];
};

export type MutationupdatePetitionPermissionSubscriptionArgs = {
  isSubscribed: Scalars["Boolean"];
  petitionId: Scalars["GID"];
};

export type MutationupdatePetitionRestrictionArgs = {
  isRestricted: Scalars["Boolean"];
  password?: InputMaybe<Scalars["String"]>;
  petitionId: Scalars["GID"];
};

export type MutationupdatePetitionUserNotificationReadStatusArgs = {
  filter?: InputMaybe<PetitionUserNotificationFilter>;
  isRead: Scalars["Boolean"];
  petitionFieldCommentIds?: InputMaybe<Array<Scalars["GID"]>>;
  petitionIds?: InputMaybe<Array<Scalars["GID"]>>;
  petitionUserNotificationIds?: InputMaybe<Array<Scalars["GID"]>>;
};

export type MutationupdatePublicPetitionLinkArgs = {
  description?: InputMaybe<Scalars["String"]>;
  isActive?: InputMaybe<Scalars["Boolean"]>;
  prefillSecret?: InputMaybe<Scalars["String"]>;
  publicPetitionLinkId: Scalars["GID"];
  slug?: InputMaybe<Scalars["String"]>;
  title?: InputMaybe<Scalars["String"]>;
};

export type MutationupdatePublicTemplateVisibilityArgs = {
  isPublic: Scalars["Boolean"];
  templateId: Scalars["GID"];
};

export type MutationupdateSignatureRequestMetadataArgs = {
  metadata: Scalars["JSONObject"];
  petitionSignatureRequestId: Scalars["GID"];
};

export type MutationupdateTagArgs = {
  data: UpdateTagInput;
  id: Scalars["GID"];
};

export type MutationupdateTemplateDefaultPermissionsArgs = {
  permissions: Array<UserOrUserGroupPermissionInput>;
  templateId: Scalars["GID"];
};

export type MutationupdateUserArgs = {
  firstName?: InputMaybe<Scalars["String"]>;
  lastName?: InputMaybe<Scalars["String"]>;
};

export type MutationupdateUserGroupArgs = {
  data: UpdateUserGroupInput;
  id: Scalars["GID"];
};

export type MutationuploadDynamicSelectFieldFileArgs = {
  fieldId: Scalars["GID"];
  file: Scalars["Upload"];
  petitionId: Scalars["GID"];
};

export type MutationuploadUserAvatarArgs = {
  image: Scalars["Upload"];
  userId: Scalars["GID"];
};

export type MutationuserSignUpArgs = {
  captcha: Scalars["String"];
  email: Scalars["String"];
  firstName: Scalars["String"];
  industry?: InputMaybe<Scalars["String"]>;
  lastName: Scalars["String"];
  licenseCode?: InputMaybe<Scalars["String"]>;
  locale?: InputMaybe<Scalars["String"]>;
  organizationLogo?: InputMaybe<Scalars["Upload"]>;
  organizationName: Scalars["String"];
  password: Scalars["String"];
  position?: InputMaybe<Scalars["String"]>;
  role?: InputMaybe<Scalars["String"]>;
};

export type MutationverifyPublicAccessArgs = {
  ip?: InputMaybe<Scalars["String"]>;
  keycode: Scalars["ID"];
  token: Scalars["ID"];
  userAgent?: InputMaybe<Scalars["String"]>;
};

export type OrgIntegration = {
  id: Scalars["GID"];
  /** Wether this integration is the default to be used if the user has more than one of the same type */
  isDefault: Scalars["Boolean"];
  /** Custom name of this integration, provided by the user */
  name: Scalars["String"];
  /** The type of the integration. */
  type: IntegrationType;
};

export type OrgIntegrationPagination = {
  /** The requested slice of items. */
  items: Array<OrgIntegration>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
};

/** An object describing the license of an organization */
export type OrgLicense = {
  externalId: Scalars["String"];
  name: Scalars["String"];
  source: OrgLicenseSource;
};

export type OrgLicenseSource = "APPSUMO";

/** An organization in the system. */
export type Organization = Timestamps & {
  /** @deprecated Temporal solution for support methods, don't use */
  _id: Scalars["Int"];
  /** The total number of active users */
  activeUserCount: Scalars["Int"];
  anonymizePetitionsAfterMonths: Maybe<Scalars["Int"]>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** Custom host used in petition links and public links. */
  customHost: Maybe<Scalars["String"]>;
  /** Whether the organization has an SSO provider configured. */
  hasSsoProvider: Scalars["Boolean"];
  /** URL of the organization logo */
  iconUrl: Maybe<Scalars["String"]>;
  /** The ID of the organization. */
  id: Scalars["GID"];
  /** A paginated list with enabled integrations for the organization */
  integrations: OrgIntegrationPagination;
  /** Current license for the organization */
  license: Maybe<OrgLicense>;
  /** URL of the organization logo */
  logoUrl: Maybe<Scalars["String"]>;
  /** The name of the organization. */
  name: Scalars["String"];
  pdfDocumentTheme: Scalars["JSONObject"];
  /** The preferred tone of organization. */
  preferredTone: Tone;
  /** The status of the organization. */
  status: OrganizationStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
  usageLimits: OrganizationUsageLimit;
  /** The users in the organization. */
  users: UserPagination;
};

/** An organization in the system. */
export type OrganizationiconUrlArgs = {
  options?: InputMaybe<ImageOptions>;
};

/** An organization in the system. */
export type OrganizationintegrationsArgs = {
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  type?: InputMaybe<IntegrationType>;
};

/** An organization in the system. */
export type OrganizationlogoUrlArgs = {
  options?: InputMaybe<ImageOptions>;
};

/** An organization in the system. */
export type OrganizationusersArgs = {
  exclude?: InputMaybe<Array<Scalars["GID"]>>;
  includeInactive?: InputMaybe<Scalars["Boolean"]>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  search?: InputMaybe<Scalars["String"]>;
  sortBy?: InputMaybe<Array<OrganizationUsers_OrderBy>>;
};

export type OrganizationDocumentThemeInput = {
  legalRichTextEn?: InputMaybe<Scalars["JSON"]>;
  legalRichTextEs?: InputMaybe<Scalars["JSON"]>;
  marginBottom?: InputMaybe<Scalars["Float"]>;
  marginLeft?: InputMaybe<Scalars["Float"]>;
  marginRight?: InputMaybe<Scalars["Float"]>;
  marginTop?: InputMaybe<Scalars["Float"]>;
  showLogo?: InputMaybe<Scalars["Boolean"]>;
  textColor?: InputMaybe<Scalars["String"]>;
  textFontFamily?: InputMaybe<Scalars["String"]>;
  textFontSize?: InputMaybe<Scalars["Float"]>;
  title1Color?: InputMaybe<Scalars["String"]>;
  title1FontFamily?: InputMaybe<Scalars["String"]>;
  title1FontSize?: InputMaybe<Scalars["Float"]>;
  title2Color?: InputMaybe<Scalars["String"]>;
  title2FontFamily?: InputMaybe<Scalars["String"]>;
  title2FontSize?: InputMaybe<Scalars["Float"]>;
};

export type OrganizationPagination = {
  /** The requested slice of items. */
  items: Array<Organization>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
};

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

export type OrganizationUsageLimit = {
  petitions: OrganizationUsagePetitionLimit;
  signatures: OrganizationUsageSignaturesLimit;
  users: OrganizationUsageUserLimit;
};

export type OrganizationUsageLimitName = "PETITION_SEND" | "SIGNATURIT_SHARED_APIKEY";

export type OrganizationUsagePetitionLimit = {
  limit: Scalars["Int"];
  used: Scalars["Int"];
};

export type OrganizationUsageSignaturesLimit = {
  limit: Scalars["Int"];
  used: Scalars["Int"];
};

export type OrganizationUsageUserLimit = {
  limit: Scalars["Int"];
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
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  owner: Maybe<User>;
  petition: Maybe<Petition>;
  previousOwner: Maybe<User>;
  type: PetitionEventType;
  user: Maybe<User>;
};

/** A petition */
export type Petition = PetitionBase & {
  /** The accesses for this petition */
  accesses: Array<PetitionAccess>;
  /** The attachments linked to this petition */
  attachments: Array<PetitionAttachment>;
  /** The closing email body of the petition. */
  closingEmailBody: Maybe<Scalars["JSON"]>;
  /** The body of the optional completing message to be show to recipients */
  completingMessageBody: Maybe<Scalars["JSON"]>;
  /** The subject of the optional completing message to be show to recipients */
  completingMessageSubject: Maybe<Scalars["String"]>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The current signature request. */
  currentSignatureRequest: Maybe<PetitionSignatureRequest>;
  /** Custom user properties */
  customProperties: Scalars["JSONObject"];
  /** The deadline of the petition. */
  deadline: Maybe<Scalars["DateTime"]>;
  /** The effective permissions on the petition */
  effectivePermissions: Array<EffectivePetitionUserPermission>;
  /** The body of the petition. */
  emailBody: Maybe<Scalars["JSON"]>;
  /** The subject of the petition. */
  emailSubject: Maybe<Scalars["String"]>;
  /** The events for the petition. */
  events: PetitionEventPagination;
  /** The number of fields in the petition. */
  fieldCount: Scalars["Int"];
  /** The definition of the petition fields. */
  fields: Array<PetitionField>;
  /** The template used for this petition */
  fromTemplate: Maybe<PetitionTemplate>;
  /** The template GID used for this petition */
  fromTemplateId: Maybe<Scalars["GID"]>;
  /** The ID of the petition or template. */
  id: Scalars["GID"];
  isAnonymized: Scalars["Boolean"];
  /** Wether the completion message will be shown to the recipients or not. */
  isCompletingMessageEnabled: Scalars["Boolean"];
  /**
   * Whether the contents card is hidden in the recipient view.
   * @deprecated Don't use this
   */
  isRecipientViewContentsHidden: Scalars["Boolean"];
  isRestricted: Scalars["Boolean"];
  isRestrictedWithPassword: Scalars["Boolean"];
  /** The locale of the petition. */
  locale: PetitionLocale;
  /** Metadata for this petition. */
  metadata: Scalars["JSONObject"];
  /** The effective permission of the logged user. Will return null if the user doesn't have access to the petition (e.g. on public templates). */
  myEffectivePermission: Maybe<EffectivePetitionUserPermission>;
  /** The name of the petition. */
  name: Maybe<Scalars["String"]>;
  organization: Organization;
  owner: User;
  /** The permissions linked to the petition */
  permissions: Array<PetitionPermission>;
  /** The progress of the petition. */
  progress: PetitionProgress;
  /** The reminders configuration for the petition. */
  remindersConfig: Maybe<RemindersConfig>;
  /** Date when the petition was first sent */
  sentAt: Maybe<Scalars["DateTime"]>;
  /** The signature configuration for the petition. */
  signatureConfig: Maybe<SignatureConfig>;
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
};

/** A petition */
export type PetitioneventsArgs = {
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
};

/** A petition access */
export type PetitionAccess = Timestamps & {
  /** The contact of this access. */
  contact: Maybe<Contact>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The original user who granted the access as other user. */
  delegateGranter: Maybe<User>;
  /** The user who granted the original access. */
  granter: Maybe<User>;
  /** The ID of the petition access. */
  id: Scalars["GID"];
  /** When the next reminder will be sent. */
  nextReminderAt: Maybe<Scalars["DateTime"]>;
  /** The petition for this message access. */
  petition: Maybe<Petition>;
  recipientUrl: Scalars["String"];
  /** Number of reminders sent. */
  reminderCount: Scalars["Int"];
  reminders: Array<PetitionReminder>;
  /** Whether automatic reminders are active or not for this petition access */
  remindersActive: Scalars["Boolean"];
  /** The reminder settings of the petition. */
  remindersConfig: Maybe<RemindersConfig>;
  /** Number of reminders left. */
  remindersLeft: Scalars["Int"];
  /** Whether contact has opted out from receiving reminders for this petition */
  remindersOptOut: Scalars["Boolean"];
  /** The status of the petition access */
  status: PetitionAccessStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
};

export type PetitionAccessPagination = {
  /** The requested slice of items. */
  items: Array<PetitionAccess>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
};

/** The status of a petition access. */
export type PetitionAccessStatus =
  /** The petition is accessible by the contact. */
  | "ACTIVE"
  /** The petition is not accessible by the contact. */
  | "INACTIVE";

export type PetitionAnonymizedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type PetitionAttachment = CreatedAt & {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  file: FileUpload;
  id: Scalars["GID"];
};

export type PetitionAttachmentUploadData = {
  attachment: PetitionAttachment;
  presignedPostData: AWSPresignedPostData;
};

export type PetitionBase = {
  /** The attachments linked to this petition */
  attachments: Array<PetitionAttachment>;
  /** The closing email body of the petition. */
  closingEmailBody: Maybe<Scalars["JSON"]>;
  /** The body of the optional completing message to be show to recipients */
  completingMessageBody: Maybe<Scalars["JSON"]>;
  /** The subject of the optional completing message to be show to recipients */
  completingMessageSubject: Maybe<Scalars["String"]>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** Custom user properties */
  customProperties: Scalars["JSONObject"];
  /** The effective permissions on the petition */
  effectivePermissions: Array<EffectivePetitionUserPermission>;
  /** The body of the petition. */
  emailBody: Maybe<Scalars["JSON"]>;
  /** The subject of the petition. */
  emailSubject: Maybe<Scalars["String"]>;
  /** The number of fields in the petition. */
  fieldCount: Scalars["Int"];
  /** The definition of the petition fields. */
  fields: Array<PetitionField>;
  /** The ID of the petition or template. */
  id: Scalars["GID"];
  isAnonymized: Scalars["Boolean"];
  /** Wether the completion message will be shown to the recipients or not. */
  isCompletingMessageEnabled: Scalars["Boolean"];
  /**
   * Whether the contents card is hidden in the recipient view.
   * @deprecated Don't use this
   */
  isRecipientViewContentsHidden: Scalars["Boolean"];
  isRestricted: Scalars["Boolean"];
  isRestrictedWithPassword: Scalars["Boolean"];
  /** The locale of the petition. */
  locale: PetitionLocale;
  /** Metadata for this petition. */
  metadata: Scalars["JSONObject"];
  /** The effective permission of the logged user. Will return null if the user doesn't have access to the petition (e.g. on public templates). */
  myEffectivePermission: Maybe<EffectivePetitionUserPermission>;
  /** The name of the petition. */
  name: Maybe<Scalars["String"]>;
  organization: Organization;
  owner: User;
  /** The permissions linked to the petition */
  permissions: Array<PetitionPermission>;
  /** The reminders configuration for the petition. */
  remindersConfig: Maybe<RemindersConfig>;
  /** The signature configuration for the petition. */
  signatureConfig: Maybe<SignatureConfig>;
  /** Whether to skip the forward security check on the recipient view. */
  skipForwardSecurity: Scalars["Boolean"];
  /** The tags linked to the petition */
  tags: Array<Tag>;
  /** The preferred tone of organization. */
  tone: Tone;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
};

export type PetitionBasePagination = {
  /** The requested slice of items. */
  items: Array<PetitionBase>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
};

export type PetitionBaseType = "PETITION" | "TEMPLATE";

export type PetitionClonedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type PetitionClosedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type PetitionClosedNotifiedEvent = PetitionEvent & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type PetitionCompletedEvent = PetitionEvent & {
  completedBy: Maybe<UserOrPetitionAccess>;
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type PetitionCompletedUserNotification = PetitionUserNotification & {
  completedBy: Maybe<UserOrPetitionAccess>;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  isRead: Scalars["Boolean"];
  petition: PetitionBase;
};

export type PetitionCreatedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type PetitionDeletedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type PetitionEvent = {
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type PetitionEventPagination = {
  /** The requested slice of items. */
  items: Array<PetitionEvent>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
};

export type PetitionEventSubscription = {
  eventTypes: Maybe<Array<PetitionEventType>>;
  eventsUrl: Scalars["String"];
  fromTemplate: Maybe<PetitionTemplate>;
  id: Scalars["GID"];
  isEnabled: Scalars["Boolean"];
  name: Maybe<Scalars["String"]>;
};

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
  | "PETITION_ANONYMIZED"
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
export type PetitionField = {
  /** The alias of the petition field. */
  alias: Maybe<Scalars["String"]>;
  /** A list of files attached to this field. */
  attachments: Array<PetitionFieldAttachment>;
  commentCount: Scalars["Int"];
  /** The comments for this field. */
  comments: Array<PetitionFieldComment>;
  /** The description of the petition field. */
  description: Maybe<Scalars["String"]>;
  /** The field GID used from which this field was cloned */
  fromPetitionFieldId: Maybe<Scalars["GID"]>;
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
  /** The replies to the petition field */
  replies: Array<PetitionFieldReply>;
  /** Determines if the field is visible in PDF export. */
  showInPdf: Scalars["Boolean"];
  /** The title of the petition field. */
  title: Maybe<Scalars["String"]>;
  /** The type of the petition field. */
  type: PetitionFieldType;
  unreadCommentCount: Scalars["Int"];
  /** A JSON object representing the conditions for the field to be visible */
  visibility: Maybe<Scalars["JSONObject"]>;
};

/** A file attachment on the petition */
export type PetitionFieldAttachment = CreatedAt & {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  field: PetitionField;
  file: FileUpload;
  id: Scalars["GID"];
};

export type PetitionFieldAttachmentUploadData = {
  attachment: PetitionFieldAttachment;
  presignedPostData: AWSPresignedPostData;
};

/** A comment on a petition field */
export type PetitionFieldComment = {
  /** The author of the comment. */
  author: Maybe<UserOrPetitionAccess>;
  /** The content of the comment. */
  content: Scalars["String"];
  /** Time when the comment was created. */
  createdAt: Scalars["DateTime"];
  field: PetitionField;
  /** The ID of the petition field comment. */
  id: Scalars["GID"];
  isAnonymized: Scalars["Boolean"];
  /** Whether the comment has been edited after being published. */
  isEdited: Scalars["Boolean"];
  /** Whether the comment is internal (only visible to org users) or public (visible for users and accesses) */
  isInternal: Scalars["Boolean"];
  /** Whether the comment has been read or not. */
  isUnread: Scalars["Boolean"];
};

/** The progress of the petition */
export type PetitionFieldProgress = {
  /** Number of optional fields not replied or validated */
  optional: Scalars["Int"];
  /** Number of fields with a reply and not validated */
  replied: Scalars["Int"];
  /** Total number of fields in the petition */
  total: Scalars["Int"];
  /** Number of fields validated */
  validated: Scalars["Int"];
};

/** A reply to a petition field */
export type PetitionFieldReply = Timestamps & {
  /** The content of the reply. */
  content: Scalars["JSONObject"];
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The petition field for this reply. */
  field: Maybe<PetitionField>;
  /** The ID of the petition field reply. */
  id: Scalars["GID"];
  isAnonymized: Scalars["Boolean"];
  /** Metadata for this reply. */
  metadata: Scalars["JSONObject"];
  /** The status of the reply. */
  status: PetitionFieldReplyStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
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
  /** A options list. */
  | "CHECKBOX"
  /** A datepicker field. */
  | "DATE"
  /** A dynamic select field. */
  | "DYNAMIC_SELECT"
  /** A tax documents/info field. */
  | "ES_TAX_DOCUMENTS"
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

export type PetitionFilter = {
  locale?: InputMaybe<PetitionLocale>;
  sharedWith?: InputMaybe<PetitionSharedWithFilter>;
  status?: InputMaybe<Array<PetitionStatus>>;
  tagIds?: InputMaybe<Array<Scalars["GID"]>>;
  type?: InputMaybe<PetitionBaseType>;
};

/** The locale used for rendering the petition to the contact. */
export type PetitionLocale = "en" | "es";

/** A petition message */
export type PetitionMessage = CreatedAt & {
  /** The access of this petition message. */
  access: PetitionAccess;
  /** Tells when the email bounced. */
  bouncedAt: Maybe<Scalars["DateTime"]>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** Tells when the email was delivered. */
  deliveredAt: Maybe<Scalars["DateTime"]>;
  /** The body of the petition message on HTML format. */
  emailBody: Maybe<Scalars["String"]>;
  /** The subject of the petition message. */
  emailSubject: Maybe<Scalars["JSON"]>;
  /** The ID of the petition message. */
  id: Scalars["GID"];
  isAnonymized: Scalars["Boolean"];
  /** Tells when the email was opened for the first time. */
  openedAt: Maybe<Scalars["DateTime"]>;
  /** Time at which the message will be sent. */
  scheduledAt: Maybe<Scalars["DateTime"]>;
  /** The sender of this petition message. */
  sender: User;
  /** If already sent, the date at which the email was sent. */
  sentAt: Maybe<Scalars["DateTime"]>;
  /** The status of the petition message */
  status: PetitionMessageStatus;
};

export type PetitionMessageBouncedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  message: PetitionMessage;
  petition: Maybe<Petition>;
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

export type PetitionPermission = {
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
};

/** The type of permission for a petition user. */
export type PetitionPermissionType = "OWNER" | "READ" | "WRITE";

/** The READ and WRITE permissions for a petition user. */
export type PetitionPermissionTypeRW = "READ" | "WRITE";

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
  createdAt: Scalars["DateTime"];
  /** The body of the message in HTML format. */
  emailBody: Maybe<Scalars["String"]>;
  id: Scalars["GID"];
  /** The sender of this petition message. */
  sender: Maybe<User>;
  /** The type of the reminder. */
  type: PetitionReminderType;
};

export type PetitionReminderBouncedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  petition: Maybe<Petition>;
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
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type PetitionSharedUserNotification = PetitionUserNotification & {
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  isRead: Scalars["Boolean"];
  owner: User;
  permissionType: PetitionPermissionTypeRW;
  petition: PetitionBase;
  sharedWith: UserOrUserGroup;
};

export type PetitionSharedWithFilter = {
  filters: Array<PetitionSharedWithFilterLine>;
  operator: FilterSharedWithLogicalOperator;
};

export type PetitionSharedWithFilterLine = {
  operator: FilterSharedWithOperator;
  value: Scalars["ID"];
};

export type PetitionSignatureCancelReason =
  | "CANCELLED_BY_USER"
  | "DECLINED_BY_SIGNER"
  | "REQUEST_ERROR"
  | "REQUEST_RESTARTED";

export type PetitionSignatureRequest = Timestamps & {
  auditTrailFilename: Maybe<Scalars["String"]>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The environment of the petition signature. */
  environment: SignatureOrgIntegrationEnvironment;
  id: Scalars["GID"];
  isAnonymized: Scalars["Boolean"];
  /** Metadata for this signature request. */
  metadata: Scalars["JSONObject"];
  petition: Petition;
  /** The signature configuration for the request. */
  signatureConfig: SignatureConfig;
  signedDocumentFilename: Maybe<Scalars["String"]>;
  signerStatus: Array<PetitionSignatureRequestSignerStatus>;
  /** The status of the petition signature. */
  status: PetitionSignatureRequestStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
};

export type PetitionSignatureRequestSignerStatus = {
  declinedAt: Maybe<Scalars["DateTime"]>;
  openedAt: Maybe<Scalars["DateTime"]>;
  sentAt: Maybe<Scalars["DateTime"]>;
  signedAt: Maybe<Scalars["DateTime"]>;
  signer: PetitionSigner;
  /** The signing status of the individual contact. */
  status: Scalars["String"];
};

export type PetitionSignatureRequestStatus =
  | "CANCELLED"
  | "COMPLETED"
  | "ENQUEUED"
  | "PROCESSED"
  | "PROCESSING";

/** Information about a signer of the petition */
export type PetitionSigner = {
  contactId: Maybe<Scalars["GID"]>;
  email: Scalars["String"];
  firstName: Scalars["String"];
  fullName: Scalars["String"];
  lastName: Maybe<Scalars["String"]>;
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

/** A petition template */
export type PetitionTemplate = PetitionBase & {
  /** The attachments linked to this petition */
  attachments: Array<PetitionAttachment>;
  backgroundColor: Maybe<Scalars["String"]>;
  categories: Maybe<Array<Scalars["String"]>>;
  /** The closing email body of the petition. */
  closingEmailBody: Maybe<Scalars["JSON"]>;
  /** The body of the optional completing message to be show to recipients */
  completingMessageBody: Maybe<Scalars["JSON"]>;
  /** The subject of the optional completing message to be show to recipients */
  completingMessageSubject: Maybe<Scalars["String"]>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** Custom user properties */
  customProperties: Scalars["JSONObject"];
  defaultPermissions: Array<TemplateDefaultPermission>;
  /** Description of the template. */
  description: Maybe<Scalars["JSON"]>;
  /** HTML excerpt of the template description. */
  descriptionExcerpt: Maybe<Scalars["String"]>;
  /** HTML description of the template. */
  descriptionHtml: Maybe<Scalars["String"]>;
  /** The effective permissions on the petition */
  effectivePermissions: Array<EffectivePetitionUserPermission>;
  /** The body of the petition. */
  emailBody: Maybe<Scalars["JSON"]>;
  /** The subject of the petition. */
  emailSubject: Maybe<Scalars["String"]>;
  /** The number of fields in the petition. */
  fieldCount: Scalars["Int"];
  /** The definition of the petition fields. */
  fields: Array<PetitionField>;
  /** The ID of the petition or template. */
  id: Scalars["GID"];
  imageUrl: Maybe<Scalars["String"]>;
  isAnonymized: Scalars["Boolean"];
  /** Wether the completion message will be shown to the recipients or not. */
  isCompletingMessageEnabled: Scalars["Boolean"];
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
  /** Metadata for this petition. */
  metadata: Scalars["JSONObject"];
  /** The effective permission of the logged user. Will return null if the user doesn't have access to the petition (e.g. on public templates). */
  myEffectivePermission: Maybe<EffectivePetitionUserPermission>;
  /** The name of the petition. */
  name: Maybe<Scalars["String"]>;
  organization: Organization;
  owner: User;
  /** The permissions linked to the petition */
  permissions: Array<PetitionPermission>;
  /** The public link linked to this template */
  publicLink: Maybe<PublicPetitionLink>;
  /** The reminders configuration for the petition. */
  remindersConfig: Maybe<RemindersConfig>;
  /** The signature configuration for the petition. */
  signatureConfig: Maybe<SignatureConfig>;
  /** Whether to skip the forward security check on the recipient view. */
  skipForwardSecurity: Scalars["Boolean"];
  /** The tags linked to the petition */
  tags: Array<Tag>;
  /** The preferred tone of organization. */
  tone: Tone;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
};

/** A petition template */
export type PetitionTemplateimageUrlArgs = {
  options?: InputMaybe<ImageOptions>;
};

export type PetitionTemplatePagination = {
  /** The requested slice of items. */
  items: Array<PetitionTemplate>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
};

/** The permission for a petition and user group */
export type PetitionUserGroupPermission = PetitionPermission &
  Timestamps & {
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
  };

export type PetitionUserNotification = {
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  isRead: Scalars["Boolean"];
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
  };

export type PublicAccessVerification = {
  cookieName: Maybe<Scalars["String"]>;
  cookieValue: Maybe<Scalars["String"]>;
  email: Maybe<Scalars["String"]>;
  isAllowed: Scalars["Boolean"];
  orgLogoUrl: Maybe<Scalars["String"]>;
  orgName: Maybe<Scalars["String"]>;
  tone: Maybe<Tone>;
};

/** A public view of a contact */
export type PublicContact = {
  /** The email of the user. */
  email: Scalars["String"];
  /** The first name of the user. */
  firstName: Scalars["String"];
  /** The full name of the user. */
  fullName: Scalars["String"];
  /** The ID of the contact. */
  id: Scalars["GID"];
  /** The last name of the user. */
  lastName: Maybe<Scalars["String"]>;
};

export type PublicCreateFileUploadReply = {
  presignedPostData: AWSPresignedPostData;
  reply: PublicPetitionFieldReply;
};

export type PublicLicenseCode = {
  code: Scalars["String"];
  details: Scalars["JSONObject"];
  source: Scalars["String"];
};

/** A public view of an organization */
export type PublicOrganization = {
  /** If this organization has the REMOVE_PARALLEL_BRANDING feature flag enabled */
  hasRemoveParallelBranding: Scalars["Boolean"];
  /** The ID of the organization. */
  id: Scalars["GID"];
  /** The logo of the organization. */
  logoUrl: Maybe<Scalars["String"]>;
  /** The name of the organization. */
  name: Scalars["String"];
};

/** A public view of an organization */
export type PublicOrganizationlogoUrlArgs = {
  options?: InputMaybe<ImageOptions>;
};

/** A public view of the petition */
export type PublicPetition = Timestamps & {
  /** The body of the optional completing message to be show to recipients. */
  completingMessageBody: Maybe<Scalars["String"]>;
  /** The subject of the optional completing message to be show to recipients */
  completingMessageSubject: Maybe<Scalars["String"]>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The deadline of the petition. */
  deadline: Maybe<Scalars["DateTime"]>;
  /** The field definition of the petition. */
  fields: Array<PublicPetitionField>;
  /** Wether the has activated REMOVE_PARALLEL_BRANDING or not. */
  hasRemoveParallelBranding: Scalars["Boolean"];
  /** The ID of the petition. */
  id: Scalars["GID"];
  /** Wether the completion message will be shown to the recipients or not. */
  isCompletingMessageEnabled: Scalars["Boolean"];
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
  signatureConfig: Maybe<PublicSignatureConfig>;
  signatureStatus: Maybe<PublicSignatureStatus>;
  /** The status of the petition. */
  status: PetitionStatus;
  /** The preferred tone of organization. */
  tone: Tone;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
};

/** A public view of a petition access */
export type PublicPetitionAccess = {
  contact: Maybe<PublicContact>;
  granter: Maybe<PublicUser>;
  message: Maybe<PublicPetitionMessage>;
  petition: Maybe<PublicPetition>;
};

/** A field within a petition. */
export type PublicPetitionField = {
  /** Alias of the petition field. */
  alias: Maybe<Scalars["String"]>;
  /** A list of files attached to this field. */
  attachments: Array<PetitionFieldAttachment>;
  commentCount: Scalars["Int"];
  /** The comments for this field. */
  comments: Array<PublicPetitionFieldComment>;
  /** The description of the petition field. */
  description: Maybe<Scalars["String"]>;
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
  title: Maybe<Scalars["String"]>;
  /** The type of the petition field. */
  type: PetitionFieldType;
  unreadCommentCount: Scalars["Int"];
  /** A JSON object representing the conditions for the field to be visible */
  visibility: Maybe<Scalars["JSONObject"]>;
};

/** A comment on a petition field */
export type PublicPetitionFieldComment = {
  /** The author of the comment. */
  author: Maybe<PublicUserOrContact>;
  /** The content of the comment. */
  content: Scalars["String"];
  /** Time when the comment was created. */
  createdAt: Scalars["DateTime"];
  field: PublicPetitionField;
  /** The ID of the petition field comment. */
  id: Scalars["GID"];
  isAnonymized: Scalars["Boolean"];
  /** Whether the comment has been read or not. */
  isUnread: Scalars["Boolean"];
};

/** A reply to a petition field */
export type PublicPetitionFieldReply = Timestamps & {
  /** The public content of the reply */
  content: Scalars["JSONObject"];
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  field: PublicPetitionField;
  /** The ID of the petition field reply. */
  id: Scalars["GID"];
  isAnonymized: Scalars["Boolean"];
  /** The status of the petition field reply. */
  status: PetitionFieldReplyStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
};

export type PublicPetitionLink = {
  description: Scalars["String"];
  id: Scalars["GID"];
  isActive: Scalars["Boolean"];
  owner: User;
  prefillSecret: Maybe<Scalars["String"]>;
  slug: Scalars["String"];
  template: PetitionTemplate;
  title: Scalars["String"];
  url: Scalars["String"];
};

/** A public message in a petition */
export type PublicPetitionMessage = {
  /** The ID of the message. */
  id: Scalars["GID"];
  /** Subject of a email. */
  subject: Maybe<Scalars["String"]>;
};

export type PublicPetitionSignerDataInput = {
  email: Scalars["String"];
  firstName: Scalars["String"];
  lastName: Scalars["String"];
};

export type PublicPublicPetitionLink = {
  description: Scalars["String"];
  isActive: Scalars["Boolean"];
  /** If the organization has enough credits to send a petition with this public link or not */
  isAvailable: Scalars["Boolean"];
  owner: PublicUser;
  slug: Scalars["String"];
  title: Scalars["String"];
};

/** The public signature settings of a petition */
export type PublicSignatureConfig = {
  /** The signers assigned by the petition recipient */
  additionalSigners: Array<PetitionSigner>;
  /** If true, allows the recipients or users of the petition to select additional signers */
  allowAdditionalSigners: Scalars["Boolean"];
  /** If true, lets the user review the replies before starting the signature process */
  review: Scalars["Boolean"];
  /** The contacts that need to sign the generated document. */
  signers: Array<PetitionSigner>;
};

export type PublicSignatureStatus = "COMPLETED" | "STARTED";

/** A public view of a user */
export type PublicUser = {
  /** The email of the user. */
  email: Scalars["String"];
  /** The first name of the user. */
  firstName: Maybe<Scalars["String"]>;
  /** The full name of the user. */
  fullName: Scalars["String"];
  /** The ID of the user. */
  id: Scalars["GID"];
  /** The last name of the user. */
  lastName: Maybe<Scalars["String"]>;
  /** The organization of the user. */
  organization: PublicOrganization;
};

export type PublicUserOrContact = PublicContact | PublicUser;

export type Query = {
  access: Maybe<PublicPetitionAccess>;
  contact: Maybe<Contact>;
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
  /** The petitions of the user */
  petitions: PetitionBasePagination;
  petitionsById: Array<Maybe<PetitionBase>>;
  publicLicenseCode: Maybe<PublicLicenseCode>;
  publicOrgLogoUrl: Maybe<Scalars["String"]>;
  /** The comments for this field. */
  publicPetitionField: PublicPetitionField;
  publicPetitionLinkBySlug: Maybe<PublicPublicPetitionLink>;
  publicTask: Task;
  publicTemplateCategories: Array<Scalars["String"]>;
  realMe: User;
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
  userGroup: Maybe<UserGroup>;
  /** Paginated list of user groups in the organization */
  userGroups: UserGroupPagination;
};

export type QueryaccessArgs = {
  keycode: Scalars["ID"];
};

export type QuerycontactArgs = {
  id: Scalars["GID"];
};

export type QuerycontactsArgs = {
  exclude?: InputMaybe<Array<Scalars["GID"]>>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  search?: InputMaybe<Scalars["String"]>;
  sortBy?: InputMaybe<Array<QueryContacts_OrderBy>>;
};

export type QuerycontactsByEmailArgs = {
  emails: Array<Scalars["String"]>;
};

export type QueryemailIsAvailableArgs = {
  email: Scalars["String"];
};

export type QuerygetSlugForPublicPetitionLinkArgs = {
  petitionName?: InputMaybe<Scalars["String"]>;
};

export type QuerygetUsersOrGroupsArgs = {
  ids: Array<Scalars["ID"]>;
};

export type QueryglobalIdDecodeArgs = {
  id: Scalars["ID"];
};

export type QueryglobalIdEncodeArgs = {
  id: Scalars["Int"];
  type: EntityType;
};

export type QueryisValidPublicPetitionLinkSlugArgs = {
  slug: Scalars["String"];
};

export type QuerylandingTemplateBySlugArgs = {
  slug: Scalars["String"];
};

export type QuerylandingTemplatesArgs = {
  categories?: InputMaybe<Array<Scalars["String"]>>;
  limit?: InputMaybe<Scalars["Int"]>;
  locale: PetitionLocale;
  offset?: InputMaybe<Scalars["Int"]>;
};

export type QuerymetadataArgs = {
  keycode?: InputMaybe<Scalars["ID"]>;
};

export type QueryorganizationArgs = {
  id: Scalars["GID"];
};

export type QueryorganizationsArgs = {
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  search?: InputMaybe<Scalars["String"]>;
  sortBy?: InputMaybe<Array<QueryOrganizations_OrderBy>>;
  status?: InputMaybe<OrganizationStatus>;
};

export type QuerypetitionArgs = {
  id: Scalars["GID"];
};

export type QuerypetitionEventsArgs = {
  before?: InputMaybe<Scalars["GID"]>;
  eventTypes?: InputMaybe<Array<PetitionEventType>>;
};

export type QuerypetitionFieldArgs = {
  petitionFieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
};

export type QuerypetitionsArgs = {
  filters?: InputMaybe<PetitionFilter>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  search?: InputMaybe<Scalars["String"]>;
  sortBy?: InputMaybe<Array<QueryPetitions_OrderBy>>;
};

export type QuerypetitionsByIdArgs = {
  ids: Array<Scalars["GID"]>;
};

export type QuerypublicLicenseCodeArgs = {
  code: Scalars["String"];
  token: Scalars["ID"];
};

export type QuerypublicOrgLogoUrlArgs = {
  id: Scalars["GID"];
};

export type QuerypublicPetitionFieldArgs = {
  keycode: Scalars["ID"];
  petitionFieldId: Scalars["GID"];
};

export type QuerypublicPetitionLinkBySlugArgs = {
  prefill?: InputMaybe<Scalars["String"]>;
  slug: Scalars["ID"];
};

export type QuerypublicTaskArgs = {
  keycode: Scalars["ID"];
  taskId: Scalars["GID"];
};

export type QuerysearchUserGroupsArgs = {
  excludeUserGroups?: InputMaybe<Array<Scalars["GID"]>>;
  search: Scalars["String"];
};

export type QuerysearchUsersArgs = {
  excludeUserGroups?: InputMaybe<Array<Scalars["GID"]>>;
  excludeUsers?: InputMaybe<Array<Scalars["GID"]>>;
  includeGroups?: InputMaybe<Scalars["Boolean"]>;
  includeInactive?: InputMaybe<Scalars["Boolean"]>;
  search: Scalars["String"];
};

export type QuerytagsArgs = {
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  search?: InputMaybe<Scalars["String"]>;
};

export type QuerytaskArgs = {
  id: Scalars["GID"];
};

export type QuerytemplatesArgs = {
  category?: InputMaybe<Scalars["String"]>;
  isOwner?: InputMaybe<Scalars["Boolean"]>;
  isPublic: Scalars["Boolean"];
  limit?: InputMaybe<Scalars["Int"]>;
  locale?: InputMaybe<PetitionLocale>;
  offset?: InputMaybe<Scalars["Int"]>;
  search?: InputMaybe<Scalars["String"]>;
};

export type QueryuserGroupArgs = {
  id: Scalars["GID"];
};

export type QueryuserGroupsArgs = {
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  search?: InputMaybe<Scalars["String"]>;
  sortBy?: InputMaybe<Array<QueryUserGroups_OrderBy>>;
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
  | "lastUsedAt_ASC"
  | "lastUsedAt_DESC"
  | "name_ASC"
  | "name_DESC"
  | "sentAt_ASC"
  | "sentAt_DESC";

/** Order to use on Query.userGroups */
export type QueryUserGroups_OrderBy = "createdAt_ASC" | "createdAt_DESC" | "name_ASC" | "name_DESC";

export type RecipientSignedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  petition: Maybe<Petition>;
  signer: Maybe<PetitionSigner>;
  type: PetitionEventType;
};

export type ReminderEmailBouncedUserNotification = PetitionUserNotification & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  isRead: Scalars["Boolean"];
  petition: PetitionBase;
};

export type ReminderSentEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  petition: Maybe<Petition>;
  reminder: PetitionReminder;
  type: PetitionEventType;
};

/** The reminder settings of a petition */
export type RemindersConfig = {
  /** The amount of days between reminders. */
  offset: Scalars["Int"];
  /** The time at which the reminder should be sent. */
  time: Scalars["String"];
  /** The timezone the time is referring to. */
  timezone: Scalars["String"];
  /** Whether to send reminders only from monday to friday. */
  weekdaysOnly: Scalars["Boolean"];
};

/** The reminders settings for the petition */
export type RemindersConfigInput = {
  /** The amount of days between reminders. */
  offset: Scalars["Int"];
  /** The time at which the reminder should be sent. */
  time: Scalars["String"];
  /** The timezone the time is referring to. */
  timezone: Scalars["String"];
  /** Whether to send reminders only from monday to friday. */
  weekdaysOnly: Scalars["Boolean"];
};

export type RemindersOptOutEvent = PetitionEvent & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  other: Maybe<Scalars["String"]>;
  petition: Maybe<Petition>;
  reason: Scalars["String"];
  type: PetitionEventType;
};

export type RemindersOptOutNotification = PetitionUserNotification & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  isRead: Scalars["Boolean"];
  other: Maybe<Scalars["String"]>;
  petition: PetitionBase;
  reason: Scalars["String"];
};

export type ReplyCreatedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  createdBy: Maybe<UserOrPetitionAccess>;
  data: Scalars["JSONObject"];
  field: Maybe<PetitionField>;
  id: Scalars["GID"];
  petition: Maybe<Petition>;
  reply: Maybe<PetitionFieldReply>;
  type: PetitionEventType;
};

export type ReplyDeletedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  deletedBy: Maybe<UserOrPetitionAccess>;
  field: Maybe<PetitionField>;
  id: Scalars["GID"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type ReplyUpdatedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  field: Maybe<PetitionField>;
  id: Scalars["GID"];
  petition: Maybe<Petition>;
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
  cancellerReason: Maybe<Scalars["String"]>;
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  errorCode: Maybe<Scalars["String"]>;
  extraErrorData: Maybe<Scalars["JSON"]>;
  id: Scalars["GID"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type SignatureCancelledUserNotification = PetitionUserNotification & {
  createdAt: Scalars["DateTime"];
  errorCode: Maybe<Scalars["String"]>;
  extraErrorData: Maybe<Scalars["JSON"]>;
  id: Scalars["GID"];
  isRead: Scalars["Boolean"];
  petition: PetitionBase;
};

export type SignatureCompletedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type SignatureCompletedUserNotification = PetitionUserNotification & {
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  isRead: Scalars["Boolean"];
  petition: PetitionBase;
};

/** The signature settings of a petition */
export type SignatureConfig = {
  /** If true, allows the recipients or users of the petition to select additional signers */
  allowAdditionalSigners: Scalars["Boolean"];
  /** The signature integration selected for this signature config. */
  integration: Maybe<SignatureOrgIntegration>;
  /** If true, lets the user review the replies before starting the signature process */
  review: Scalars["Boolean"];
  /** The signers of the generated document. */
  signers: Array<Maybe<PetitionSigner>>;
  /** The timezone used to generate the document. */
  timezone: Scalars["String"];
  /** Title of the signature document */
  title: Scalars["String"];
};

/** The signature settings for the petition */
export type SignatureConfigInput = {
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
};

/** The signer that need to sign the generated document. */
export type SignatureConfigInputSigner = {
  contactId?: InputMaybe<Scalars["GID"]>;
  email: Scalars["String"];
  firstName: Scalars["String"];
  lastName?: InputMaybe<Scalars["String"]>;
};

export type SignatureOpenedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  petition: Maybe<Petition>;
  signer: Maybe<PetitionSigner>;
  type: PetitionEventType;
};

export type SignatureOrgIntegration = OrgIntegration & {
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
};

export type SignatureOrgIntegrationEnvironment = "DEMO" | "PRODUCTION";

export type SignatureOrgIntegrationProvider = "SIGNATURIT";

export type SignatureReminderEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type SignatureStartedEvent = PetitionEvent & {
  bouncedAt: Maybe<Scalars["DateTime"]>;
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  deliveredAt: Maybe<Scalars["DateTime"]>;
  id: Scalars["GID"];
  openedAt: Maybe<Scalars["DateTime"]>;
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type SsoOrgIntegration = OrgIntegration & {
  id: Scalars["GID"];
  /** Wether this integration is the default to be used if the user has more than one of the same type */
  isDefault: Scalars["Boolean"];
  /** Custom name of this integration, provided by the user */
  name: Scalars["String"];
  /** The type of the integration. */
  type: IntegrationType;
};

/** Represents a successful execution. */
export type Success = "SUCCESS";

/** Return type for all support methods */
export type SupportMethodResponse = {
  message: Maybe<Scalars["String"]>;
  result: Result;
};

export type Tag = {
  /** The color of the tag in hex format (example: #FFFFFF) */
  color: Scalars["String"];
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  name: Scalars["String"];
};

export type TagPagination = {
  /** The requested slice of items. */
  items: Array<Tag>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
};

export type Task = {
  id: Scalars["GID"];
  output: Maybe<TemporaryFile>;
  progress: Maybe<Scalars["Int"]>;
  status: TaskStatus;
};

export type TaskStatus = "COMPLETED" | "ENQUEUED" | "FAILED" | "PROCESSING";

export type TemplateDefaultPermission = {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  /** wether user is will be subscribed or not to emails and alerts of the generated petition */
  isSubscribed: Scalars["Boolean"];
  /** The type of the permission. */
  permissionType: PetitionPermissionType;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
};

/** The permission for a petition and user group */
export type TemplateDefaultUserGroupPermission = TemplateDefaultPermission &
  Timestamps & {
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
  };

/** The permission for a petition and user */
export type TemplateDefaultUserPermission = TemplateDefaultPermission &
  Timestamps & {
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
  };

export type TemplateUsedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type TemporaryFile = {
  filename: Scalars["String"];
};

export type Timestamps = {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
};

/** The preferred tone of organization */
export type Tone = "FORMAL" | "INFORMAL";

export type UpdateContactInput = {
  firstName?: InputMaybe<Scalars["String"]>;
  lastName?: InputMaybe<Scalars["String"]>;
};

export type UpdatePetitionFieldInput = {
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
};

export type UpdatePetitionInput = {
  closingEmailBody?: InputMaybe<Scalars["JSON"]>;
  completingMessageBody?: InputMaybe<Scalars["JSON"]>;
  completingMessageSubject?: InputMaybe<Scalars["String"]>;
  deadline?: InputMaybe<Scalars["DateTime"]>;
  description?: InputMaybe<Scalars["JSON"]>;
  emailBody?: InputMaybe<Scalars["JSON"]>;
  emailSubject?: InputMaybe<Scalars["String"]>;
  isCompletingMessageEnabled?: InputMaybe<Scalars["Boolean"]>;
  isRecipientViewContentsHidden?: InputMaybe<Scalars["Boolean"]>;
  locale?: InputMaybe<PetitionLocale>;
  name?: InputMaybe<Scalars["String"]>;
  remindersConfig?: InputMaybe<RemindersConfigInput>;
  signatureConfig?: InputMaybe<SignatureConfigInput>;
  skipForwardSecurity?: InputMaybe<Scalars["Boolean"]>;
};

export type UpdateTagInput = {
  color?: InputMaybe<Scalars["String"]>;
  name?: InputMaybe<Scalars["String"]>;
};

export type UpdateUserGroupInput = {
  name?: InputMaybe<Scalars["String"]>;
};

/** A user in the system. */
export type User = Timestamps & {
  /** URL to the user avatar */
  avatarUrl: Maybe<Scalars["String"]>;
  canCreateUsers: Scalars["Boolean"];
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** Users that the user can send on behalf of */
  delegateOf: Array<User>;
  /** Users that the user allows to send on their behalf */
  delegates: Array<User>;
  /** The email of the user. */
  email: Scalars["String"];
  /** The first name of the user. */
  firstName: Maybe<Scalars["String"]>;
  /** The full name of the user. */
  fullName: Maybe<Scalars["String"]>;
  hasFeatureFlag: Scalars["Boolean"];
  /** The ID of the user. */
  id: Scalars["GID"];
  /** The initials of the user. */
  initials: Maybe<Scalars["String"]>;
  isSsoUser: Scalars["Boolean"];
  isSuperAdmin: Scalars["Boolean"];
  lastActiveAt: Maybe<Scalars["DateTime"]>;
  /** The last name of the user. */
  lastName: Maybe<Scalars["String"]>;
  /** Read and unread user notifications about events on their petitions */
  notifications: UserNotifications_Pagination;
  organization: Organization;
  /** Organizations this user belongs to */
  organizations: Array<Organization>;
  preferredLocale: Maybe<Scalars["String"]>;
  role: OrganizationRole;
  status: UserStatus;
  /** Lists the API tokens this user has. */
  tokens: Array<UserAuthenticationToken>;
  unreadNotificationIds: Array<Scalars["ID"]>;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
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
  before?: InputMaybe<Scalars["DateTime"]>;
  filter?: InputMaybe<PetitionUserNotificationFilter>;
  limit?: InputMaybe<Scalars["Int"]>;
};

export type UserAuthenticationToken = CreatedAt & {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  hint: Maybe<Scalars["String"]>;
  id: Scalars["GID"];
  lastUsedAt: Maybe<Scalars["DateTime"]>;
  tokenName: Scalars["String"];
};

export type UserGroup = Timestamps & {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  initials: Scalars["String"];
  members: Array<UserGroupMember>;
  name: Scalars["String"];
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
};

export type UserGroupMember = {
  /** The time the user was added to the user group. */
  addedAt: Scalars["DateTime"];
  id: Scalars["GID"];
  user: User;
};

export type UserGroupPagination = {
  /** The requested slice of items. */
  items: Array<UserGroup>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
};

export type UserNotifications_Pagination = {
  /** Whether this resource has more items. */
  hasMore: Scalars["Boolean"];
  /** The requested slice of items. */
  items: Array<PetitionUserNotification>;
};

export type UserOrPetitionAccess = PetitionAccess | User;

export type UserOrUserGroup = User | UserGroup;

export type UserOrUserGroupPermissionInput = {
  isSubscribed: Scalars["Boolean"];
  permissionType: PetitionPermissionType;
  userGroupId?: InputMaybe<Scalars["GID"]>;
  userId?: InputMaybe<Scalars["GID"]>;
};

export type UserPagination = {
  /** The requested slice of items. */
  items: Array<User>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
};

export type UserPermissionAddedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  permissionType: PetitionPermissionType;
  permissionUser: Maybe<User>;
  petition: Maybe<Petition>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type UserPermissionEditedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  permissionType: PetitionPermissionType;
  permissionUser: Maybe<User>;
  petition: Maybe<Petition>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type UserPermissionRemovedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  data: Scalars["JSONObject"];
  id: Scalars["GID"];
  permissionUser: Maybe<User>;
  petition: Maybe<Petition>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type UserProvisioningOrgIntegration = OrgIntegration & {
  id: Scalars["GID"];
  /** Wether this integration is the default to be used if the user has more than one of the same type */
  isDefault: Scalars["Boolean"];
  /** Custom name of this integration, provided by the user */
  name: Scalars["String"];
  /** The type of the integration. */
  type: IntegrationType;
};

export type UserStatus = "ACTIVE" | "INACTIVE";

export type VerificationCodeCheck = {
  remainingAttempts: Maybe<Scalars["Int"]>;
  result: Result;
};

export type VerificationCodeRequest = {
  expiresAt: Scalars["DateTime"];
  remainingAttempts: Scalars["Int"];
  token: Scalars["ID"];
};

export type AWSPresignedPostDataFragment = { fields: { [key: string]: any }; url: string };

export type PetitionAttachmentFragment = {
  id: string;
  createdAt: string;
  file: { filename: string; contentType: string; size: number; isComplete: boolean };
};

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

export type PetitionFieldFragment = {
  id: string;
  title: string | null;
  description: string | null;
  type: PetitionFieldType;
  fromPetitionFieldId: string | null;
  alias: string | null;
  options: { [key: string]: any };
  multiple: boolean;
};

export type PetitionFieldReplyFragment = {
  id: string;
  content: { [key: string]: any };
  status: PetitionFieldReplyStatus;
  createdAt: string;
  updatedAt: string;
};

export type PetitionFieldWithRepliesFragment = {
  id: string;
  title: string | null;
  description: string | null;
  type: PetitionFieldType;
  fromPetitionFieldId: string | null;
  alias: string | null;
  options: { [key: string]: any };
  multiple: boolean;
  replies: Array<{
    id: string;
    content: { [key: string]: any };
    status: PetitionFieldReplyStatus;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type TagFragment = { id: string; name: string };

export type PetitionFragment = {
  id: string;
  name: string | null;
  status: PetitionStatus;
  deadline: string | null;
  locale: PetitionLocale;
  createdAt: string;
  fromTemplateId: string | null;
  customProperties: { [key: string]: any };
  recipients: Array<{
    recipientUrl: string;
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
    multiple: boolean;
    replies: Array<{
      id: string;
      content: { [key: string]: any };
      status: PetitionFieldReplyStatus;
      createdAt: string;
      updatedAt: string;
    }>;
  }>;
  replies: Array<{
    alias: string | null;
    type: PetitionFieldType;
    replies: Array<{ id: string; content: { [key: string]: any } }>;
  }>;
  tags?: Array<{ id: string; name: string }>;
};

export type TemplateFragment = {
  id: string;
  name: string | null;
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
    multiple: boolean;
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

export type SubscriptionFragment = {
  id: string;
  name: string | null;
  eventsUrl: string;
  isEnabled: boolean;
  eventTypes: Array<PetitionEventType> | null;
  fromTemplate: { id: string } | null;
};

export type TaskFragment = { id: string; progress: number | null; status: TaskStatus };

export type getTags_tagsQueryVariables = Exact<{
  offset: Scalars["Int"];
  limit: Scalars["Int"];
}>;

export type getTags_tagsQuery = {
  tags: { totalCount: number; items: Array<{ id: string; name: string }> };
};

export type waitForTask_TaskQueryVariables = Exact<{
  id: Scalars["GID"];
}>;

export type waitForTask_TaskQuery = {
  task: { id: string; progress: number | null; status: TaskStatus };
};

export type getTaskResultFileUrl_getTaskResultFileUrlMutationVariables = Exact<{
  taskId: Scalars["GID"];
}>;

export type getTaskResultFileUrl_getTaskResultFileUrlMutation = { getTaskResultFileUrl: string };

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
  offset: Scalars["Int"];
  limit: Scalars["Int"];
  search?: InputMaybe<Scalars["String"]>;
}>;

export type GetTags_tagsQuery = {
  tags: { totalCount: number; items: Array<{ id: string; name: string }> };
};

export type GetPetitions_petitionsQueryVariables = Exact<{
  offset: Scalars["Int"];
  limit: Scalars["Int"];
  status?: InputMaybe<Array<PetitionStatus> | PetitionStatus>;
  tagIds?: InputMaybe<Array<Scalars["GID"]> | Scalars["GID"]>;
  sortBy?: InputMaybe<Array<QueryPetitions_OrderBy> | QueryPetitions_OrderBy>;
  includeRecipients: Scalars["Boolean"];
  includeFields: Scalars["Boolean"];
  includeTags: Scalars["Boolean"];
  includeRecipientUrl: Scalars["Boolean"];
  includeReplies: Scalars["Boolean"];
}>;

export type GetPetitions_petitionsQuery = {
  petitions: {
    totalCount: number;
    items: Array<
      | {
          id: string;
          name: string | null;
          status: PetitionStatus;
          deadline: string | null;
          locale: PetitionLocale;
          createdAt: string;
          fromTemplateId: string | null;
          customProperties: { [key: string]: any };
          recipients: Array<{
            recipientUrl: string;
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
            multiple: boolean;
            replies: Array<{
              id: string;
              content: { [key: string]: any };
              status: PetitionFieldReplyStatus;
              createdAt: string;
              updatedAt: string;
            }>;
          }>;
          replies: Array<{
            alias: string | null;
            type: PetitionFieldType;
            replies: Array<{ id: string; content: { [key: string]: any } }>;
          }>;
          tags?: Array<{ id: string; name: string }>;
        }
      | {}
    >;
  };
};

export type CreatePetition_petitionMutationVariables = Exact<{
  name?: InputMaybe<Scalars["String"]>;
  templateId?: InputMaybe<Scalars["GID"]>;
  includeRecipients: Scalars["Boolean"];
  includeFields: Scalars["Boolean"];
  includeTags: Scalars["Boolean"];
  includeRecipientUrl: Scalars["Boolean"];
  includeReplies: Scalars["Boolean"];
}>;

export type CreatePetition_petitionMutation = {
  createPetition:
    | {
        id: string;
        name: string | null;
        status: PetitionStatus;
        deadline: string | null;
        locale: PetitionLocale;
        createdAt: string;
        fromTemplateId: string | null;
        customProperties: { [key: string]: any };
        recipients: Array<{
          recipientUrl: string;
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
          multiple: boolean;
          replies: Array<{
            id: string;
            content: { [key: string]: any };
            status: PetitionFieldReplyStatus;
            createdAt: string;
            updatedAt: string;
          }>;
        }>;
        replies: Array<{
          alias: string | null;
          type: PetitionFieldType;
          replies: Array<{ id: string; content: { [key: string]: any } }>;
        }>;
        tags?: Array<{ id: string; name: string }>;
      }
    | {};
};

export type GetPetition_petitionQueryVariables = Exact<{
  petitionId: Scalars["GID"];
  includeRecipients: Scalars["Boolean"];
  includeFields: Scalars["Boolean"];
  includeTags: Scalars["Boolean"];
  includeRecipientUrl: Scalars["Boolean"];
  includeReplies: Scalars["Boolean"];
}>;

export type GetPetition_petitionQuery = {
  petition:
    | {
        id: string;
        name: string | null;
        status: PetitionStatus;
        deadline: string | null;
        locale: PetitionLocale;
        createdAt: string;
        fromTemplateId: string | null;
        customProperties: { [key: string]: any };
        recipients: Array<{
          recipientUrl: string;
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
          multiple: boolean;
          replies: Array<{
            id: string;
            content: { [key: string]: any };
            status: PetitionFieldReplyStatus;
            createdAt: string;
            updatedAt: string;
          }>;
        }>;
        replies: Array<{
          alias: string | null;
          type: PetitionFieldType;
          replies: Array<{ id: string; content: { [key: string]: any } }>;
        }>;
        tags?: Array<{ id: string; name: string }>;
      }
    | {}
    | null;
};

export type UpdatePetition_updatePetitionMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  data: UpdatePetitionInput;
  includeRecipients: Scalars["Boolean"];
  includeFields: Scalars["Boolean"];
  includeTags: Scalars["Boolean"];
  includeRecipientUrl: Scalars["Boolean"];
  includeReplies: Scalars["Boolean"];
}>;

export type UpdatePetition_updatePetitionMutation = {
  updatePetition:
    | {
        id: string;
        name: string | null;
        status: PetitionStatus;
        deadline: string | null;
        locale: PetitionLocale;
        createdAt: string;
        fromTemplateId: string | null;
        customProperties: { [key: string]: any };
        recipients: Array<{
          recipientUrl: string;
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
          multiple: boolean;
          replies: Array<{
            id: string;
            content: { [key: string]: any };
            status: PetitionFieldReplyStatus;
            createdAt: string;
            updatedAt: string;
          }>;
        }>;
        replies: Array<{
          alias: string | null;
          type: PetitionFieldType;
          replies: Array<{ id: string; content: { [key: string]: any } }>;
        }>;
        tags?: Array<{ id: string; name: string }>;
      }
    | {};
};

export type DeletePetition_deletePetitionsMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  force: Scalars["Boolean"];
}>;

export type DeletePetition_deletePetitionsMutation = { deletePetitions: Success };

export type ReadPetitionCustomPropertiesQueryVariables = Exact<{
  petitionId: Scalars["GID"];
}>;

export type ReadPetitionCustomPropertiesQuery = {
  petition:
    | { id: string; customProperties: { [key: string]: any } }
    | { id: string; customProperties: { [key: string]: any } }
    | null;
};

export type CreateOrUpdatePetitionCustomProperty_modifyPetitionCustomPropertyMutationVariables =
  Exact<{
    petitionId: Scalars["GID"];
    key: Scalars["String"];
    value?: InputMaybe<Scalars["String"]>;
  }>;

export type CreateOrUpdatePetitionCustomProperty_modifyPetitionCustomPropertyMutation = {
  modifyPetitionCustomProperty:
    | { customProperties: { [key: string]: any } }
    | { customProperties: { [key: string]: any } };
};

export type DeletePetitionCustomProperty_modifyPetitionCustomPropertyMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  key: Scalars["String"];
}>;

export type DeletePetitionCustomProperty_modifyPetitionCustomPropertyMutation = {
  modifyPetitionCustomProperty: { id: string } | { id: string };
};

export type CreatePetitionRecipients_contactQueryVariables = Exact<{
  email: Scalars["String"];
}>;

export type CreatePetitionRecipients_contactQuery = {
  contacts: Array<{ id: string; firstName: string; lastName: string | null } | null>;
};

export type CreatePetitionRecipients_updateContactMutationVariables = Exact<{
  contactId: Scalars["GID"];
  data: UpdateContactInput;
}>;

export type CreatePetitionRecipients_updateContactMutation = { updateContact: { id: string } };

export type CreatePetitionRecipients_createContactMutationVariables = Exact<{
  data: CreateContactInput;
}>;

export type CreatePetitionRecipients_createContactMutation = { createContact: { id: string } };

export type CreatePetitionRecipients_petitionQueryVariables = Exact<{
  id: Scalars["GID"];
}>;

export type CreatePetitionRecipients_petitionQuery = {
  petition:
    | { emailBody: any | null; emailSubject: string | null }
    | { emailBody: any | null; emailSubject: string | null }
    | null;
};

export type CreatePetitionRecipients_sendPetitionMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  contactIds: Array<Scalars["GID"]> | Scalars["GID"];
  subject: Scalars["String"];
  body: Scalars["JSON"];
  scheduledAt?: InputMaybe<Scalars["DateTime"]>;
  remindersConfig?: InputMaybe<RemindersConfigInput>;
  includeRecipients: Scalars["Boolean"];
  includeFields: Scalars["Boolean"];
  includeTags: Scalars["Boolean"];
  includeRecipientUrl: Scalars["Boolean"];
  includeReplies: Scalars["Boolean"];
}>;

export type CreatePetitionRecipients_sendPetitionMutation = {
  sendPetition: Array<{
    result: Result;
    petition: {
      id: string;
      name: string | null;
      status: PetitionStatus;
      deadline: string | null;
      locale: PetitionLocale;
      createdAt: string;
      fromTemplateId: string | null;
      customProperties: { [key: string]: any };
      recipients: Array<{
        recipientUrl: string;
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
        multiple: boolean;
        replies: Array<{
          id: string;
          content: { [key: string]: any };
          status: PetitionFieldReplyStatus;
          createdAt: string;
          updatedAt: string;
        }>;
      }>;
      replies: Array<{
        alias: string | null;
        type: PetitionFieldType;
        replies: Array<{ id: string; content: { [key: string]: any } }>;
      }>;
      tags?: Array<{ id: string; name: string }>;
    } | null;
  }>;
};

export type GetPetitionRecipients_petitionAccessesQueryVariables = Exact<{
  petitionId: Scalars["GID"];
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

export type PetitionReplies_repliesQueryVariables = Exact<{
  petitionId: Scalars["GID"];
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
          multiple: boolean;
          replies: Array<{
            id: string;
            content: { [key: string]: any };
            status: PetitionFieldReplyStatus;
            createdAt: string;
            updatedAt: string;
          }>;
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
          multiple: boolean;
          replies: Array<{
            id: string;
            content: { [key: string]: any };
            status: PetitionFieldReplyStatus;
            createdAt: string;
            updatedAt: string;
          }>;
        }>;
      }
    | null;
};

export type UpdatePetitionField_updatePetitionFieldMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  fieldId: Scalars["GID"];
  title?: InputMaybe<Scalars["String"]>;
  description?: InputMaybe<Scalars["String"]>;
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
    multiple: boolean;
  };
};

export type DeleteReply_deletePetitionReplyMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  replyId: Scalars["GID"];
}>;

export type DeleteReply_deletePetitionReplyMutation = { deletePetitionReply: { id: string } };

export type DownloadFileReply_fileUploadReplyDownloadLinkMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  replyId: Scalars["GID"];
}>;

export type DownloadFileReply_fileUploadReplyDownloadLinkMutation = {
  fileUploadReplyDownloadLink: { url: string | null };
};

export type ExportPetitionReplies_createExportRepliesTaskMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  pattern?: InputMaybe<Scalars["String"]>;
}>;

export type ExportPetitionReplies_createExportRepliesTaskMutation = {
  createExportRepliesTask: { id: string; progress: number | null; status: TaskStatus };
};

export type ExportPetitionReplies_createPrintPdfTaskMutationVariables = Exact<{
  petitionId: Scalars["GID"];
}>;

export type ExportPetitionReplies_createPrintPdfTaskMutation = {
  createPrintPdfTask: { id: string; progress: number | null; status: TaskStatus };
};

export type GetPermissions_permissionsQueryVariables = Exact<{
  petitionId: Scalars["GID"];
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

export type SharePetition_addPetitionPermissionMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  userIds?: InputMaybe<Array<Scalars["GID"]> | Scalars["GID"]>;
  userGroupIds?: InputMaybe<Array<Scalars["GID"]> | Scalars["GID"]>;
}>;

export type SharePetition_addPetitionPermissionMutation = {
  addPetitionPermission: Array<
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

export type StopSharing_removePetitionPermissionMutationVariables = Exact<{
  petitionId: Scalars["GID"];
}>;

export type StopSharing_removePetitionPermissionMutation = {
  removePetitionPermission: Array<{ id: string } | { id: string } | null>;
};

export type RemoveUserPermission_removePetitionPermissionMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  userId: Scalars["GID"];
}>;

export type RemoveUserPermission_removePetitionPermissionMutation = {
  removePetitionPermission: Array<{ id: string } | { id: string } | null>;
};

export type RemoveUserGroupPermission_removePetitionPermissionMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  userGroupId: Scalars["GID"];
}>;

export type RemoveUserGroupPermission_removePetitionPermissionMutation = {
  removePetitionPermission: Array<{ id: string } | { id: string } | null>;
};

export type TransferPetition_transferPetitionOwnershipMutationVariables = Exact<{
  userId: Scalars["GID"];
  petitionId: Scalars["GID"];
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
  petitionId: Scalars["GID"];
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
        }>;
      }
    | { __typename: "PetitionTemplate" }
    | null;
};

export type DownloadSignedDocument_downloadSignedDocMutationVariables = Exact<{
  signatureId: Scalars["GID"];
}>;

export type DownloadSignedDocument_downloadSignedDocMutation = {
  signedPetitionDownloadLink: { result: Result; url: string | null };
};

export type DownloadSignedDocument_downloadAuditTrailMutationVariables = Exact<{
  signatureId: Scalars["GID"];
}>;

export type DownloadSignedDocument_downloadAuditTrailMutation = {
  signedPetitionDownloadLink: { result: Result; url: string | null };
};

export type GetTemplates_templatesQueryVariables = Exact<{
  offset: Scalars["Int"];
  limit: Scalars["Int"];
  tagIds?: InputMaybe<Array<Scalars["GID"]> | Scalars["GID"]>;
  sortBy?: InputMaybe<Array<QueryPetitions_OrderBy> | QueryPetitions_OrderBy>;
  includeFields: Scalars["Boolean"];
  includeTags: Scalars["Boolean"];
}>;

export type GetTemplates_templatesQuery = {
  templates: {
    totalCount: number;
    items: Array<
      | {
          id: string;
          name: string | null;
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
            multiple: boolean;
          }>;
          tags?: Array<{ id: string; name: string }>;
        }
      | {}
    >;
  };
};

export type GetTemplate_templateQueryVariables = Exact<{
  templateId: Scalars["GID"];
  includeFields: Scalars["Boolean"];
  includeTags: Scalars["Boolean"];
}>;

export type GetTemplate_templateQuery = {
  template:
    | {
        id: string;
        name: string | null;
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
          multiple: boolean;
        }>;
        tags?: Array<{ id: string; name: string }>;
      }
    | {}
    | null;
};

export type DeleteTemplate_deletePetitionsMutationVariables = Exact<{
  templateId: Scalars["GID"];
  force: Scalars["Boolean"];
}>;

export type DeleteTemplate_deletePetitionsMutation = { deletePetitions: Success };

export type GetContacts_contactsQueryVariables = Exact<{
  offset: Scalars["Int"];
  limit: Scalars["Int"];
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
  contactId: Scalars["GID"];
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
  offset: Scalars["Int"];
  limit: Scalars["Int"];
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
  subscriptions: Array<{
    id: string;
    name: string | null;
    eventsUrl: string;
    isEnabled: boolean;
    eventTypes: Array<PetitionEventType> | null;
    fromTemplate: { id: string } | null;
  }>;
};

export type EventSubscriptions_createSubscriptionMutationVariables = Exact<{
  eventsUrl: Scalars["String"];
  eventTypes?: InputMaybe<Array<PetitionEventType> | PetitionEventType>;
  name?: InputMaybe<Scalars["String"]>;
  fromTemplateId?: InputMaybe<Scalars["GID"]>;
}>;

export type EventSubscriptions_createSubscriptionMutation = {
  createEventSubscription: {
    id: string;
    name: string | null;
    eventsUrl: string;
    isEnabled: boolean;
    eventTypes: Array<PetitionEventType> | null;
    fromTemplate: { id: string } | null;
  };
};

export type EventSubscriptions_deleteSubscriptionMutationVariables = Exact<{
  ids: Array<Scalars["GID"]> | Scalars["GID"];
}>;

export type EventSubscriptions_deleteSubscriptionMutation = { deleteEventSubscriptions: Result };

export type GetPetitionEvents_PetitionEventsQueryVariables = Exact<{
  before?: InputMaybe<Scalars["GID"]>;
  eventTypes?: InputMaybe<Array<PetitionEventType> | PetitionEventType>;
}>;

export type GetPetitionEvents_PetitionEventsQuery = {
  petitionEvents: Array<
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
    | {
        id: string;
        data: { [key: string]: any };
        type: PetitionEventType;
        createdAt: string;
        petition: { id: string } | null;
      }
  >;
};

export type SubmitReply_createPetitionFieldReplyMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  fieldId: Scalars["GID"];
  reply: Scalars["JSON"];
}>;

export type SubmitReply_createPetitionFieldReplyMutation = {
  createPetitionFieldReply: {
    id: string;
    content: { [key: string]: any };
    status: PetitionFieldReplyStatus;
    createdAt: string;
    updatedAt: string;
  };
};

export type SubmitReply_createFileUploadReplyMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  fieldId: Scalars["GID"];
  file: FileUploadInput;
}>;

export type SubmitReply_createFileUploadReplyMutation = {
  createFileUploadReply: {
    presignedPostData: { fields: { [key: string]: any }; url: string };
    reply: {
      id: string;
      content: { [key: string]: any };
      status: PetitionFieldReplyStatus;
      createdAt: string;
      updatedAt: string;
    };
  };
};

export type SubmitReply_createFileUploadReplyCompleteMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  replyId: Scalars["GID"];
}>;

export type SubmitReply_createFileUploadReplyCompleteMutation = {
  createFileUploadReplyComplete: {
    id: string;
    content: { [key: string]: any };
    status: PetitionFieldReplyStatus;
    createdAt: string;
    updatedAt: string;
  };
};

export type UpdateReplyStatus_updatePetitionFieldRepliesStatusMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  fieldId: Scalars["GID"];
  replyIds: Array<Scalars["GID"]> | Scalars["GID"];
  status: PetitionFieldReplyStatus;
}>;

export type UpdateReplyStatus_updatePetitionFieldRepliesStatusMutation = {
  updatePetitionFieldRepliesStatus: {
    replies: Array<{
      id: string;
      content: { [key: string]: any };
      status: PetitionFieldReplyStatus;
      createdAt: string;
      updatedAt: string;
      field: { id: string } | null;
    }>;
  };
};

export type UpdateReply_updatePetitionFieldReplyMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  replyId: Scalars["GID"];
  reply: Scalars["JSON"];
}>;

export type UpdateReply_updatePetitionFieldReplyMutation = {
  updatePetitionFieldReply: {
    id: string;
    content: { [key: string]: any };
    status: PetitionFieldReplyStatus;
    createdAt: string;
    updatedAt: string;
    field: { id: string } | null;
  };
};

export type UpdateReply_updateFileUploadReplyMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  replyId: Scalars["GID"];
  file: FileUploadInput;
}>;

export type UpdateReply_updateFileUploadReplyMutation = {
  updateFileUploadReply: {
    presignedPostData: { fields: { [key: string]: any }; url: string };
    reply: {
      id: string;
      content: { [key: string]: any };
      status: PetitionFieldReplyStatus;
      createdAt: string;
      updatedAt: string;
    };
  };
};

export type UpdateReply_updateFileUploadReplyCompleteMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  replyId: Scalars["GID"];
}>;

export type UpdateReply_updateFileUploadReplyCompleteMutation = {
  updateFileUploadReplyComplete: {
    id: string;
    content: { [key: string]: any };
    status: PetitionFieldReplyStatus;
    createdAt: string;
    updatedAt: string;
    field: { id: string } | null;
  };
};

export type CreatePetitionAttachment_createPetitionAttachmentUploadLinkMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  data: FileUploadInput;
}>;

export type CreatePetitionAttachment_createPetitionAttachmentUploadLinkMutation = {
  createPetitionAttachmentUploadLink: {
    presignedPostData: { fields: { [key: string]: any }; url: string };
    attachment: {
      id: string;
      createdAt: string;
      file: { filename: string; contentType: string; size: number; isComplete: boolean };
    };
  };
};

export type CreatePetitionAttachment_petitionAttachmentUploadCompleteMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  attachmentId: Scalars["GID"];
}>;

export type CreatePetitionAttachment_petitionAttachmentUploadCompleteMutation = {
  petitionAttachmentUploadComplete: {
    id: string;
    createdAt: string;
    file: { filename: string; contentType: string; size: number; isComplete: boolean };
  };
};

export type DeletePetitionAttachment_deletePetitionAttachmentMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  attachmentId: Scalars["GID"];
}>;

export type DeletePetitionAttachment_deletePetitionAttachmentMutation = {
  deletePetitionAttachment: Result;
};

export type DownloadPetitionAttachment_petitionAttachmentDownloadLinkMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  attachmentId: Scalars["GID"];
}>;

export type DownloadPetitionAttachment_petitionAttachmentDownloadLinkMutation = {
  petitionAttachmentDownloadLink: { url: string | null };
};

export type SubmitReplies_bulkCreatePetitionRepliesMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  replies: Scalars["JSONObject"];
  includeFields: Scalars["Boolean"];
  includeTags: Scalars["Boolean"];
  includeRecipients: Scalars["Boolean"];
  includeRecipientUrl: Scalars["Boolean"];
  includeReplies: Scalars["Boolean"];
}>;

export type SubmitReplies_bulkCreatePetitionRepliesMutation = {
  bulkCreatePetitionReplies: {
    id: string;
    name: string | null;
    status: PetitionStatus;
    deadline: string | null;
    locale: PetitionLocale;
    createdAt: string;
    fromTemplateId: string | null;
    customProperties: { [key: string]: any };
    recipients: Array<{
      recipientUrl: string;
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
      multiple: boolean;
      replies: Array<{
        id: string;
        content: { [key: string]: any };
        status: PetitionFieldReplyStatus;
        createdAt: string;
        updatedAt: string;
      }>;
    }>;
    replies: Array<{
      alias: string | null;
      type: PetitionFieldType;
      replies: Array<{ id: string; content: { [key: string]: any } }>;
    }>;
    tags?: Array<{ id: string; name: string }>;
  };
};

export type UpdateReply_petitionQueryVariables = Exact<{
  petitionId: Scalars["GID"];
}>;

export type UpdateReply_petitionQuery = {
  petition:
    | {
        fields: Array<{
          id: string;
          type: PetitionFieldType;
          options: { [key: string]: any };
          replies: Array<{ id: string }>;
        }>;
      }
    | {
        fields: Array<{
          id: string;
          type: PetitionFieldType;
          options: { [key: string]: any };
          replies: Array<{ id: string }>;
        }>;
      }
    | null;
};

export type SubmitReply_petitionQueryVariables = Exact<{
  petitionId: Scalars["GID"];
}>;

export type SubmitReply_petitionQuery = {
  petition:
    | { fields: Array<{ id: string; type: PetitionFieldType; options: { [key: string]: any } }> }
    | { fields: Array<{ id: string; type: PetitionFieldType; options: { [key: string]: any } }> }
    | null;
};

export type GetPetitionAttachments_petitionQueryVariables = Exact<{
  id: Scalars["GID"];
}>;

export type GetPetitionAttachments_petitionQuery = {
  petition:
    | {
        attachments: Array<{
          id: string;
          createdAt: string;
          file: { filename: string; contentType: string; size: number; isComplete: boolean };
        }>;
      }
    | {
        attachments: Array<{
          id: string;
          createdAt: string;
          file: { filename: string; contentType: string; size: number; isComplete: boolean };
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
export const PetitionAttachmentFragmentDoc = gql`
  fragment PetitionAttachment on PetitionAttachment {
    id
    file {
      filename
      contentType
      size
      isComplete
    }
    createdAt
  }
` as unknown as DocumentNode<PetitionAttachmentFragment, unknown>;
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
export const PetitionFieldFragmentDoc = gql`
  fragment PetitionField on PetitionField {
    id
    title
    description
    type
    fromPetitionFieldId
    alias
    options
    multiple
  }
` as unknown as DocumentNode<PetitionFieldFragment, unknown>;
export const PetitionFieldReplyFragmentDoc = gql`
  fragment PetitionFieldReply on PetitionFieldReply {
    id
    content
    status
    createdAt
    updatedAt
  }
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
export const PetitionFragmentDoc = gql`
  fragment Petition on Petition {
    id
    name
    status
    deadline
    locale
    createdAt
    fromTemplateId
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
      alias
      type
      replies {
        id
        content
      }
    }
    tags @include(if: $includeTags) {
      ...Tag
    }
  }
  ${PetitionAccessFragmentDoc}
  ${PetitionFieldWithRepliesFragmentDoc}
  ${TagFragmentDoc}
` as unknown as DocumentNode<PetitionFragment, unknown>;
export const TemplateFragmentDoc = gql`
  fragment Template on PetitionTemplate {
    id
    name
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
export const SubscriptionFragmentDoc = gql`
  fragment Subscription on PetitionEventSubscription {
    id
    name
    eventsUrl
    isEnabled
    eventTypes
    fromTemplate {
      id
    }
  }
` as unknown as DocumentNode<SubscriptionFragment, unknown>;
export const TaskFragmentDoc = gql`
  fragment Task on Task {
    id
    progress
    status
  }
` as unknown as DocumentNode<TaskFragment, unknown>;
export const getTags_tagsDocument = gql`
  query getTags_tags($offset: Int!, $limit: Int!) {
    tags(offset: $offset, limit: $limit) {
      items {
        ...Tag
      }
      totalCount
    }
  }
  ${TagFragmentDoc}
` as unknown as DocumentNode<getTags_tagsQuery, getTags_tagsQueryVariables>;
export const waitForTask_TaskDocument = gql`
  query waitForTask_Task($id: GID!) {
    task(id: $id) {
      ...Task
    }
  }
  ${TaskFragmentDoc}
` as unknown as DocumentNode<waitForTask_TaskQuery, waitForTask_TaskQueryVariables>;
export const getTaskResultFileUrl_getTaskResultFileUrlDocument = gql`
  mutation getTaskResultFileUrl_getTaskResultFileUrl($taskId: GID!) {
    getTaskResultFileUrl(taskId: $taskId)
  }
` as unknown as DocumentNode<
  getTaskResultFileUrl_getTaskResultFileUrlMutation,
  getTaskResultFileUrl_getTaskResultFileUrlMutationVariables
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
    $status: [PetitionStatus!]
    $tagIds: [GID!]
    $sortBy: [QueryPetitions_OrderBy!]
    $includeRecipients: Boolean!
    $includeFields: Boolean!
    $includeTags: Boolean!
    $includeRecipientUrl: Boolean!
    $includeReplies: Boolean!
  ) {
    petitions(
      offset: $offset
      limit: $limit
      sortBy: $sortBy
      filters: { status: $status, type: PETITION, tagIds: $tagIds }
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
  ) {
    petition(id: $petitionId) {
      ...Petition
    }
  }
  ${PetitionFragmentDoc}
` as unknown as DocumentNode<GetPetition_petitionQuery, GetPetition_petitionQueryVariables>;
export const UpdatePetition_updatePetitionDocument = gql`
  mutation UpdatePetition_updatePetition(
    $petitionId: GID!
    $data: UpdatePetitionInput!
    $includeRecipients: Boolean!
    $includeFields: Boolean!
    $includeTags: Boolean!
    $includeRecipientUrl: Boolean!
    $includeReplies: Boolean!
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
    $includeRecipients: Boolean!
    $includeFields: Boolean!
    $includeTags: Boolean!
    $includeRecipientUrl: Boolean!
    $includeReplies: Boolean!
  ) {
    sendPetition(
      petitionId: $petitionId
      contactIdGroups: [$contactIds]
      subject: $subject
      body: $body
      scheduledAt: $scheduledAt
      remindersConfig: $remindersConfig
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
  ) {
    updatePetitionField(
      petitionId: $petitionId
      fieldId: $fieldId
      data: { title: $title, description: $description }
    ) {
      ...PetitionField
    }
  }
  ${PetitionFieldFragmentDoc}
` as unknown as DocumentNode<
  UpdatePetitionField_updatePetitionFieldMutation,
  UpdatePetitionField_updatePetitionFieldMutationVariables
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
  mutation ExportPetitionReplies_createExportRepliesTask($petitionId: GID!, $pattern: String) {
    createExportRepliesTask(petitionId: $petitionId, pattern: $pattern) {
      ...Task
    }
  }
  ${TaskFragmentDoc}
` as unknown as DocumentNode<
  ExportPetitionReplies_createExportRepliesTaskMutation,
  ExportPetitionReplies_createExportRepliesTaskMutationVariables
>;
export const ExportPetitionReplies_createPrintPdfTaskDocument = gql`
  mutation ExportPetitionReplies_createPrintPdfTask($petitionId: GID!) {
    createPrintPdfTask(petitionId: $petitionId) {
      ...Task
    }
  }
  ${TaskFragmentDoc}
` as unknown as DocumentNode<
  ExportPetitionReplies_createPrintPdfTaskMutation,
  ExportPetitionReplies_createPrintPdfTaskMutationVariables
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
export const SharePetition_addPetitionPermissionDocument = gql`
  mutation SharePetition_addPetitionPermission(
    $petitionId: GID!
    $userIds: [GID!]
    $userGroupIds: [GID!]
  ) {
    addPetitionPermission(
      petitionIds: [$petitionId]
      userIds: $userIds
      userGroupIds: $userGroupIds
      permissionType: WRITE
    ) {
      permissions {
        ...Permission
      }
    }
  }
  ${PermissionFragmentDoc}
` as unknown as DocumentNode<
  SharePetition_addPetitionPermissionMutation,
  SharePetition_addPetitionPermissionMutationVariables
>;
export const StopSharing_removePetitionPermissionDocument = gql`
  mutation StopSharing_removePetitionPermission($petitionId: GID!) {
    removePetitionPermission(petitionIds: [$petitionId], removeAll: true) {
      id
    }
  }
` as unknown as DocumentNode<
  StopSharing_removePetitionPermissionMutation,
  StopSharing_removePetitionPermissionMutationVariables
>;
export const RemoveUserPermission_removePetitionPermissionDocument = gql`
  mutation RemoveUserPermission_removePetitionPermission($petitionId: GID!, $userId: GID!) {
    removePetitionPermission(petitionIds: [$petitionId], userIds: [$userId]) {
      id
    }
  }
` as unknown as DocumentNode<
  RemoveUserPermission_removePetitionPermissionMutation,
  RemoveUserPermission_removePetitionPermissionMutationVariables
>;
export const RemoveUserGroupPermission_removePetitionPermissionDocument = gql`
  mutation RemoveUserGroupPermission_removePetitionPermission(
    $petitionId: GID!
    $userGroupId: GID!
  ) {
    removePetitionPermission(petitionIds: [$petitionId], userGroupIds: [$userGroupId]) {
      id
    }
  }
` as unknown as DocumentNode<
  RemoveUserGroupPermission_removePetitionPermissionMutation,
  RemoveUserGroupPermission_removePetitionPermissionMutationVariables
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
          id
          status
          environment
          createdAt
          updatedAt
        }
      }
    }
  }
` as unknown as DocumentNode<
  GetSignatures_petitionSignaturesQuery,
  GetSignatures_petitionSignaturesQueryVariables
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
export const GetTemplates_templatesDocument = gql`
  query GetTemplates_templates(
    $offset: Int!
    $limit: Int!
    $tagIds: [GID!]
    $sortBy: [QueryPetitions_OrderBy!]
    $includeFields: Boolean!
    $includeTags: Boolean!
  ) {
    templates: petitions(
      offset: $offset
      limit: $limit
      sortBy: $sortBy
      filters: { type: TEMPLATE, tagIds: $tagIds }
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
      ...Subscription
    }
  }
  ${SubscriptionFragmentDoc}
` as unknown as DocumentNode<
  EventSubscriptions_getSubscriptionsQuery,
  EventSubscriptions_getSubscriptionsQueryVariables
>;
export const EventSubscriptions_createSubscriptionDocument = gql`
  mutation EventSubscriptions_createSubscription(
    $eventsUrl: String!
    $eventTypes: [PetitionEventType!]
    $name: String
    $fromTemplateId: GID
  ) {
    createEventSubscription(
      eventsUrl: $eventsUrl
      eventTypes: $eventTypes
      name: $name
      fromTemplateId: $fromTemplateId
    ) {
      ...Subscription
    }
  }
  ${SubscriptionFragmentDoc}
` as unknown as DocumentNode<
  EventSubscriptions_createSubscriptionMutation,
  EventSubscriptions_createSubscriptionMutationVariables
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
      }
      type
      createdAt
    }
  }
` as unknown as DocumentNode<
  GetPetitionEvents_PetitionEventsQuery,
  GetPetitionEvents_PetitionEventsQueryVariables
>;
export const SubmitReply_createPetitionFieldReplyDocument = gql`
  mutation SubmitReply_createPetitionFieldReply($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
    createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
      ...PetitionFieldReply
    }
  }
  ${PetitionFieldReplyFragmentDoc}
` as unknown as DocumentNode<
  SubmitReply_createPetitionFieldReplyMutation,
  SubmitReply_createPetitionFieldReplyMutationVariables
>;
export const SubmitReply_createFileUploadReplyDocument = gql`
  mutation SubmitReply_createFileUploadReply(
    $petitionId: GID!
    $fieldId: GID!
    $file: FileUploadInput!
  ) {
    createFileUploadReply(petitionId: $petitionId, fieldId: $fieldId, file: $file) {
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
export const UpdateReply_updatePetitionFieldReplyDocument = gql`
  mutation UpdateReply_updatePetitionFieldReply($petitionId: GID!, $replyId: GID!, $reply: JSON!) {
    updatePetitionFieldReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
      ...PetitionFieldReply
      field {
        id
      }
    }
  }
  ${PetitionFieldReplyFragmentDoc}
` as unknown as DocumentNode<
  UpdateReply_updatePetitionFieldReplyMutation,
  UpdateReply_updatePetitionFieldReplyMutationVariables
>;
export const UpdateReply_updateFileUploadReplyDocument = gql`
  mutation UpdateReply_updateFileUploadReply(
    $petitionId: GID!
    $replyId: GID!
    $file: FileUploadInput!
  ) {
    updateFileUploadReply(petitionId: $petitionId, replyId: $replyId, file: $file) {
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
export const CreatePetitionAttachment_createPetitionAttachmentUploadLinkDocument = gql`
  mutation CreatePetitionAttachment_createPetitionAttachmentUploadLink(
    $petitionId: GID!
    $data: FileUploadInput!
  ) {
    createPetitionAttachmentUploadLink(petitionId: $petitionId, data: $data) {
      presignedPostData {
        ...AWSPresignedPostData
      }
      attachment {
        ...PetitionAttachment
      }
    }
  }
  ${AWSPresignedPostDataFragmentDoc}
  ${PetitionAttachmentFragmentDoc}
` as unknown as DocumentNode<
  CreatePetitionAttachment_createPetitionAttachmentUploadLinkMutation,
  CreatePetitionAttachment_createPetitionAttachmentUploadLinkMutationVariables
>;
export const CreatePetitionAttachment_petitionAttachmentUploadCompleteDocument = gql`
  mutation CreatePetitionAttachment_petitionAttachmentUploadComplete(
    $petitionId: GID!
    $attachmentId: GID!
  ) {
    petitionAttachmentUploadComplete(petitionId: $petitionId, attachmentId: $attachmentId) {
      ...PetitionAttachment
    }
  }
  ${PetitionAttachmentFragmentDoc}
` as unknown as DocumentNode<
  CreatePetitionAttachment_petitionAttachmentUploadCompleteMutation,
  CreatePetitionAttachment_petitionAttachmentUploadCompleteMutationVariables
>;
export const DeletePetitionAttachment_deletePetitionAttachmentDocument = gql`
  mutation DeletePetitionAttachment_deletePetitionAttachment(
    $petitionId: GID!
    $attachmentId: GID!
  ) {
    deletePetitionAttachment(petitionId: $petitionId, attachmentId: $attachmentId)
  }
` as unknown as DocumentNode<
  DeletePetitionAttachment_deletePetitionAttachmentMutation,
  DeletePetitionAttachment_deletePetitionAttachmentMutationVariables
>;
export const DownloadPetitionAttachment_petitionAttachmentDownloadLinkDocument = gql`
  mutation DownloadPetitionAttachment_petitionAttachmentDownloadLink(
    $petitionId: GID!
    $attachmentId: GID!
  ) {
    petitionAttachmentDownloadLink(petitionId: $petitionId, attachmentId: $attachmentId) {
      url
    }
  }
` as unknown as DocumentNode<
  DownloadPetitionAttachment_petitionAttachmentDownloadLinkMutation,
  DownloadPetitionAttachment_petitionAttachmentDownloadLinkMutationVariables
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
      }
    }
  }
` as unknown as DocumentNode<SubmitReply_petitionQuery, SubmitReply_petitionQueryVariables>;
export const GetPetitionAttachments_petitionDocument = gql`
  query GetPetitionAttachments_petition($id: GID!) {
    petition(id: $id) {
      attachments {
        ...PetitionAttachment
      }
    }
  }
  ${PetitionAttachmentFragmentDoc}
` as unknown as DocumentNode<
  GetPetitionAttachments_petitionQuery,
  GetPetitionAttachments_petitionQueryVariables
>;
