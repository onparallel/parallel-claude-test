import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]: Maybe<T[SubKey]> };
const defaultOptions = {};
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

export type AccessActivatedEvent = PetitionEvent & {
  __typename?: "AccessActivatedEvent";
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  user?: Maybe<User>;
};

export type AccessDeactivatedEvent = PetitionEvent & {
  __typename?: "AccessDeactivatedEvent";
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  user?: Maybe<User>;
};

export type AccessDelegatedEvent = PetitionEvent & {
  __typename?: "AccessDelegatedEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  newAccess: PetitionAccess;
  originalAccess: PetitionAccess;
};

export type AccessOpenedEvent = PetitionEvent & {
  __typename?: "AccessOpenedEvent";
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
};

export type ChangePasswordResult =
  | "INCORRECT_PASSWORD"
  | "INVALID_NEW_PASSWORD"
  | "SUCCESS";

export type CommentDeletedEvent = PetitionEvent & {
  __typename?: "CommentDeletedEvent";
  createdAt: Scalars["DateTime"];
  deletedBy?: Maybe<UserOrPetitionAccess>;
  field?: Maybe<PetitionField>;
  id: Scalars["GID"];
};

export type CommentPublishedEvent = PetitionEvent & {
  __typename?: "CommentPublishedEvent";
  comment?: Maybe<PetitionFieldComment>;
  createdAt: Scalars["DateTime"];
  field?: Maybe<PetitionField>;
  id: Scalars["GID"];
};

/** A contact in the system. */
export type Contact = Timestamps & {
  __typename?: "Contact";
  /** The petition accesses for this contact */
  accesses: PetitionAccessPagination;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The email of the contact. */
  email: Scalars["String"];
  /** The first name of the contact. */
  firstName?: Maybe<Scalars["String"]>;
  /** The full name of the contact. */
  fullName?: Maybe<Scalars["String"]>;
  /** The ID of the contact. */
  id: Scalars["GID"];
  /** The last name of the contact. */
  lastName?: Maybe<Scalars["String"]>;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
};

/** A contact in the system. */
export type ContactaccessesArgs = {
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
};

export type ContactPagination = {
  __typename?: "ContactPagination";
  /** The requested slice of items. */
  items: Array<Contact>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
};

export type CreateContactInput = {
  email: Scalars["String"];
  firstName?: Maybe<Scalars["String"]>;
  lastName?: Maybe<Scalars["String"]>;
};

export type CreateFileUploadReply = {
  __typename?: "CreateFileUploadReply";
  /** Endpoint where to upload the file. */
  endpoint: Scalars["String"];
  reply: PublicPetitionFieldReply;
};

export type CreateFileUploadReplyInput = {
  contentType: Scalars["String"];
  filename: Scalars["String"];
  size: Scalars["Int"];
};

export type CreatedAt = {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
};

export type EntityType = "Contact" | "Organization" | "Petition" | "User";

export type FeatureFlag =
  | "API_TOKENS"
  | "EXPORT_CUATRECASAS"
  | "HIDE_RECIPIENT_VIEW_CONTENTS"
  | "INTERNAL_COMMENTS"
  | "PETITION_PDF_EXPORT"
  | "PETITION_SIGNATURE"
  | "SKIP_FORWARD_SECURITY";

export type FileUploadReplyDownloadLinkResult = {
  __typename?: "FileUploadReplyDownloadLinkResult";
  filename?: Maybe<Scalars["String"]>;
  result: Result;
  url?: Maybe<Scalars["String"]>;
};

export type GenerateUserAuthTokenResponse = {
  __typename?: "GenerateUserAuthTokenResponse";
  apiKey: Scalars["String"];
  userAuthToken: UserAuthenticationToken;
};

/** The types of integrations available. */
export type IntegrationType = "SIGNATURE";

export type MessageCancelledEvent = PetitionEvent & {
  __typename?: "MessageCancelledEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  message: PetitionMessage;
  user?: Maybe<User>;
};

export type MessageScheduledEvent = PetitionEvent & {
  __typename?: "MessageScheduledEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  message: PetitionMessage;
};

export type MessageSentEvent = PetitionEvent & {
  __typename?: "MessageSentEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  message: PetitionMessage;
};

export type Mutation = {
  __typename?: "Mutation";
  /** Adds permissions on given petitions and users */
  addPetitionUserPermission: Array<Petition>;
  /** Clones the petition and assigns the given user as owner and creator. */
  assignPetitionToUser: SupportMethodResponse;
  /** Sends different petitions to each of the specified contact groups, creating corresponding accesses and messages */
  batchSendPetition: Array<SendPetitionResult>;
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
  /** Create a petition field comment. */
  createPetitionFieldComment: PetitionFieldComment;
  /** Creates a new subscription on a petition */
  createPetitionSubscription: Subscription;
  /** Creates a reply to a text or select field. */
  createSimpleReply: PetitionFieldReply;
  /** Creates a new user in the specified organization. */
  createUser: SupportMethodResponse;
  /** Deactivates the specified active petition accesses. */
  deactivateAccesses: Array<PetitionAccess>;
  /** Delete contacts. */
  deleteContacts: Result;
  /** Soft-deletes any given petition on the database. */
  deletePetition: SupportMethodResponse;
  /** Deletes a petition field. */
  deletePetitionField: PetitionBase;
  /** Delete a petition field comment. */
  deletePetitionFieldComment: Result;
  /** Deletes a reply to a petition field. */
  deletePetitionReply: Result;
  deletePetitionSubscription: Result;
  /** Delete petitions. */
  deletePetitions: Result;
  /** generates a signed download link for the xlsx file containing the listings of a dynamic select field */
  dynamicSelectFieldFileDownloadLink: FileUploadReplyDownloadLinkResult;
  /** Edits permissions on given petitions and users */
  editPetitionUserPermission: Array<Petition>;
  /** Generates a download link for a file reply. */
  fileUploadReplyDownloadLink: FileUploadReplyDownloadLinkResult;
  /** Generates a new API token for the context user */
  generateUserAuthToken: GenerateUserAuthTokenResponse;
  /** Marks the specified comments as read. */
  markPetitionFieldCommentsAsRead: Array<PetitionFieldComment>;
  publicCheckVerificationCode: VerificationCodeCheck;
  /**
   * Marks a filled petition as COMPLETED.
   * If the petition does not require a review, starts the signing process. Otherwise sends email to user.
   */
  publicCompletePetition: PublicPetition;
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
  publicFileUploadReplyDownloadLink: FileUploadReplyDownloadLinkResult;
  /** Marks the specified comments as read. */
  publicMarkPetitionFieldCommentsAsRead: Array<PublicPetitionFieldComment>;
  publicSendVerificationCode: VerificationCodeRequest;
  /** Submits all unpublished comments. */
  publicSubmitUnpublishedComments: Array<PublicPetitionFieldComment>;
  /** Updates a reply for a dynamic select field. */
  publicUpdateDynamicSelectReply: PublicPetitionFieldReply;
  /** Update a petition field comment. */
  publicUpdatePetitionFieldComment: PublicPetitionFieldComment;
  /** Updates a reply to a text or select field. */
  publicUpdateSimpleReply: PublicPetitionFieldReply;
  /** Reactivates the specified inactive petition accesses. */
  reactivateAccesses: Array<PetitionAccess>;
  /** Removes permissions on given petitions and users */
  removePetitionUserPermission: Array<Petition>;
  /** Reopens the petition */
  reopenPetition: Petition;
  /** Removes the Signaturit Branding Ids of selected organization. */
  resetSignaturitOrganizationBranding: SupportMethodResponse;
  /** Soft-deletes a given auth token, making it permanently unusable. */
  revokeUserAuthToken: Result;
  /** Sends the petition and creates the corresponding accesses and messages. */
  sendPetition: SendPetitionResult;
  /** Sends an email to all contacts of the petition confirming the replies are ok */
  sendPetitionClosedNotification: Petition;
  /** Sends a reminder for the specified petition accesses. */
  sendReminders: Result;
  /** Generates a download link for the signed PDF petition. */
  signedPetitionDownloadLink: FileUploadReplyDownloadLinkResult;
  startSignatureRequest: PetitionSignatureRequest;
  /** Submits all unpublished comments. */
  submitUnpublishedComments: Array<PetitionFieldComment>;
  /** Switches automatic reminders for the specified petition accesses. */
  switchAutomaticReminders: Array<PetitionAccess>;
  /** Transfers petition ownership to a given user. The original owner gets a WRITE permission on the petitions. */
  transferPetitionOwnership: Array<Petition>;
  /** Updates a contact. */
  updateContact: Contact;
  /** Updates the positions of the petition fields */
  updateFieldPositions: PetitionBase;
  /** Updates the onboarding status for one of the pages. */
  updateOnboardingStatus: User;
  /** Updates the logo of an organization */
  updateOrganizationLogo: Organization;
  /** Updates a petition. */
  updatePetition: PetitionBase;
  /** Updates a petition field. */
  updatePetitionField: PetitionBaseAndField;
  /** Update a petition field comment. */
  updatePetitionFieldComment: PetitionFieldComment;
  /** Updates the status of a petition field reply and sets the petition as closed if all fields are validated. */
  updatePetitionFieldRepliesStatus: PetitionWithFieldAndReplies;
  /** Updates the metada of the specified petition field reply */
  updatePetitionFieldReplyMetadata: PetitionFieldReply;
  /** Updates the subscription flag on a PetitionUser */
  updatePetitionUserSubscription: Petition;
  updateSignatureRequestMetadata: PetitionSignatureRequest;
  /** Updates a reply to a text or select field. */
  updateSimpleReply: PetitionFieldReply;
  /** Updates the user with the provided data. */
  updateUser: User;
  /** Updates user status and, if new status is INACTIVE, transfers their owned petitions to another user in the org. */
  updateUserStatus: Array<User>;
  /** Uploads the xlsx file used to parse the options of a dynamic select field, and sets the field options */
  uploadDynamicSelectFieldFile: PetitionField;
  /** Updates the validation of a field and sets the petition as closed if all fields are validated. */
  validatePetitionFields: PetitionAndPartialFields;
  verifyPublicAccess: PublicAccessVerification;
};

export type MutationaddPetitionUserPermissionArgs = {
  message?: Maybe<Scalars["String"]>;
  notify?: Maybe<Scalars["Boolean"]>;
  permissionType: PetitionUserPermissionTypeRW;
  petitionIds: Array<Scalars["GID"]>;
  userIds: Array<Scalars["GID"]>;
};

export type MutationassignPetitionToUserArgs = {
  petitionId: Scalars["ID"];
  userId: Scalars["Int"];
};

export type MutationbatchSendPetitionArgs = {
  body: Scalars["JSON"];
  contactIdGroups: Array<Array<Scalars["GID"]>>;
  petitionId: Scalars["GID"];
  remindersConfig?: Maybe<RemindersConfigInput>;
  scheduledAt?: Maybe<Scalars["DateTime"]>;
  subject: Scalars["String"];
};

export type MutationcancelScheduledMessageArgs = {
  messageId: Scalars["GID"];
  petitionId: Scalars["GID"];
};

export type MutationcancelSignatureRequestArgs = {
  petitionSignatureRequestId: Scalars["GID"];
};

export type MutationchangePasswordArgs = {
  newPassword: Scalars["String"];
  password: Scalars["String"];
};

export type MutationchangePetitionFieldTypeArgs = {
  fieldId: Scalars["GID"];
  force?: Maybe<Scalars["Boolean"]>;
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

export type MutationcreateContactArgs = {
  data: CreateContactInput;
};

export type MutationcreateFileUploadReplyArgs = {
  fieldId: Scalars["GID"];
  file: Scalars["Upload"];
  petitionId: Scalars["GID"];
};

export type MutationcreateOrganizationArgs = {
  identifier: Scalars["String"];
  name: Scalars["String"];
  status: OrganizationStatus;
};

export type MutationcreateOrganizationUserArgs = {
  email: Scalars["String"];
  firstName: Scalars["String"];
  lastName: Scalars["String"];
  role: OrganizationRole;
};

export type MutationcreatePetitionArgs = {
  eventsUrl?: Maybe<Scalars["String"]>;
  locale?: Maybe<PetitionLocale>;
  name?: Maybe<Scalars["String"]>;
  petitionId?: Maybe<Scalars["GID"]>;
  type?: Maybe<PetitionBaseType>;
};

export type MutationcreatePetitionFieldArgs = {
  petitionId: Scalars["GID"];
  position?: Maybe<Scalars["Int"]>;
  type: PetitionFieldType;
};

export type MutationcreatePetitionFieldCommentArgs = {
  content: Scalars["String"];
  isInternal?: Maybe<Scalars["Boolean"]>;
  petitionFieldId: Scalars["GID"];
  petitionFieldReplyId?: Maybe<Scalars["GID"]>;
  petitionId: Scalars["GID"];
};

export type MutationcreatePetitionSubscriptionArgs = {
  endpoint: Scalars["String"];
  petitionId: Scalars["GID"];
};

export type MutationcreateSimpleReplyArgs = {
  fieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
  reply: Scalars["String"];
};

export type MutationcreateUserArgs = {
  email: Scalars["String"];
  firstName: Scalars["String"];
  lastName: Scalars["String"];
  organizationId: Scalars["Int"];
  password: Scalars["String"];
  role: OrganizationRole;
};

export type MutationdeactivateAccessesArgs = {
  accessIds: Array<Scalars["GID"]>;
  petitionId: Scalars["GID"];
};

export type MutationdeleteContactsArgs = {
  ids: Array<Scalars["GID"]>;
};

export type MutationdeletePetitionArgs = {
  petitionId: Scalars["ID"];
};

export type MutationdeletePetitionFieldArgs = {
  fieldId: Scalars["GID"];
  force?: Maybe<Scalars["Boolean"]>;
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

export type MutationdeletePetitionSubscriptionArgs = {
  subscriptionId: Scalars["GID"];
};

export type MutationdeletePetitionsArgs = {
  force?: Maybe<Scalars["Boolean"]>;
  ids: Array<Scalars["GID"]>;
};

export type MutationdynamicSelectFieldFileDownloadLinkArgs = {
  fieldId: Scalars["GID"];
  petitionId: Scalars["GID"];
};

export type MutationeditPetitionUserPermissionArgs = {
  permissionType: PetitionUserPermissionType;
  petitionIds: Array<Scalars["GID"]>;
  userIds: Array<Scalars["GID"]>;
};

export type MutationfileUploadReplyDownloadLinkArgs = {
  petitionId: Scalars["GID"];
  preview?: Maybe<Scalars["Boolean"]>;
  replyId: Scalars["GID"];
};

export type MutationgenerateUserAuthTokenArgs = {
  tokenName: Scalars["String"];
};

export type MutationmarkPetitionFieldCommentsAsReadArgs = {
  petitionFieldCommentIds: Array<Scalars["GID"]>;
  petitionId: Scalars["GID"];
};

export type MutationpublicCheckVerificationCodeArgs = {
  code: Scalars["String"];
  keycode: Scalars["ID"];
  token: Scalars["ID"];
};

export type MutationpublicCompletePetitionArgs = {
  keycode: Scalars["ID"];
  signer?: Maybe<PublicPetitionSignerData>;
};

export type MutationpublicCreateDynamicSelectReplyArgs = {
  fieldId: Scalars["GID"];
  keycode: Scalars["ID"];
  value: Array<Array<Maybe<Scalars["String"]>>>;
};

export type MutationpublicCreateFileUploadReplyArgs = {
  data: CreateFileUploadReplyInput;
  fieldId: Scalars["GID"];
  keycode: Scalars["ID"];
};

export type MutationpublicCreatePetitionFieldCommentArgs = {
  content: Scalars["String"];
  keycode: Scalars["ID"];
  petitionFieldId: Scalars["GID"];
};

export type MutationpublicCreateSimpleReplyArgs = {
  fieldId: Scalars["GID"];
  keycode: Scalars["ID"];
  value: Scalars["String"];
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

export type MutationpublicDeletePetitionReplyArgs = {
  keycode: Scalars["ID"];
  replyId: Scalars["GID"];
};

export type MutationpublicFileUploadReplyCompleteArgs = {
  keycode: Scalars["ID"];
  replyId: Scalars["GID"];
};

export type MutationpublicFileUploadReplyDownloadLinkArgs = {
  keycode: Scalars["ID"];
  preview?: Maybe<Scalars["Boolean"]>;
  replyId: Scalars["GID"];
};

export type MutationpublicMarkPetitionFieldCommentsAsReadArgs = {
  keycode: Scalars["ID"];
  petitionFieldCommentIds: Array<Scalars["GID"]>;
};

export type MutationpublicSendVerificationCodeArgs = {
  keycode: Scalars["ID"];
};

export type MutationpublicSubmitUnpublishedCommentsArgs = {
  keycode: Scalars["ID"];
};

export type MutationpublicUpdateDynamicSelectReplyArgs = {
  keycode: Scalars["ID"];
  replyId: Scalars["GID"];
  value: Array<Array<Maybe<Scalars["String"]>>>;
};

export type MutationpublicUpdatePetitionFieldCommentArgs = {
  content: Scalars["String"];
  keycode: Scalars["ID"];
  petitionFieldCommentId: Scalars["GID"];
  petitionFieldId: Scalars["GID"];
};

export type MutationpublicUpdateSimpleReplyArgs = {
  keycode: Scalars["ID"];
  replyId: Scalars["GID"];
  value: Scalars["String"];
};

export type MutationreactivateAccessesArgs = {
  accessIds: Array<Scalars["GID"]>;
  petitionId: Scalars["GID"];
};

export type MutationremovePetitionUserPermissionArgs = {
  petitionIds: Array<Scalars["GID"]>;
  removeAll?: Maybe<Scalars["Boolean"]>;
  userIds?: Maybe<Array<Scalars["GID"]>>;
};

export type MutationreopenPetitionArgs = {
  petitionId: Scalars["GID"];
};

export type MutationresetSignaturitOrganizationBrandingArgs = {
  orgId: Scalars["Int"];
};

export type MutationrevokeUserAuthTokenArgs = {
  authTokenIds: Array<Scalars["GID"]>;
};

export type MutationsendPetitionArgs = {
  body: Scalars["JSON"];
  contactIds: Array<Scalars["GID"]>;
  petitionId: Scalars["GID"];
  remindersConfig?: Maybe<RemindersConfigInput>;
  scheduledAt?: Maybe<Scalars["DateTime"]>;
  subject: Scalars["String"];
};

export type MutationsendPetitionClosedNotificationArgs = {
  attachPdfExport: Scalars["Boolean"];
  emailBody: Scalars["JSON"];
  force?: Maybe<Scalars["Boolean"]>;
  pdfExportTitle?: Maybe<Scalars["String"]>;
  petitionId: Scalars["GID"];
};

export type MutationsendRemindersArgs = {
  accessIds: Array<Scalars["GID"]>;
  body?: Maybe<Scalars["JSON"]>;
  petitionId: Scalars["GID"];
};

export type MutationsignedPetitionDownloadLinkArgs = {
  downloadAuditTrail?: Maybe<Scalars["Boolean"]>;
  petitionSignatureRequestId: Scalars["GID"];
  preview?: Maybe<Scalars["Boolean"]>;
};

export type MutationstartSignatureRequestArgs = {
  petitionId: Scalars["GID"];
};

export type MutationsubmitUnpublishedCommentsArgs = {
  petitionId: Scalars["GID"];
};

export type MutationswitchAutomaticRemindersArgs = {
  accessIds: Array<Scalars["GID"]>;
  petitionId: Scalars["GID"];
  remindersConfig?: Maybe<RemindersConfigInput>;
  start: Scalars["Boolean"];
};

export type MutationtransferPetitionOwnershipArgs = {
  petitionIds: Array<Scalars["GID"]>;
  userId: Scalars["GID"];
};

export type MutationupdateContactArgs = {
  data: UpdateContactInput;
  id: Scalars["GID"];
};

export type MutationupdateFieldPositionsArgs = {
  fieldIds: Array<Scalars["GID"]>;
  petitionId: Scalars["GID"];
};

export type MutationupdateOnboardingStatusArgs = {
  key: OnboardingKey;
  status: OnboardingStatus;
};

export type MutationupdateOrganizationLogoArgs = {
  file: Scalars["Upload"];
  orgId: Scalars["GID"];
};

export type MutationupdatePetitionArgs = {
  data: UpdatePetitionInput;
  petitionId: Scalars["GID"];
};

export type MutationupdatePetitionFieldArgs = {
  data: UpdatePetitionFieldInput;
  fieldId: Scalars["GID"];
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

export type MutationupdatePetitionFieldReplyMetadataArgs = {
  metadata: Scalars["JSONObject"];
  petitionId: Scalars["GID"];
  replyId: Scalars["GID"];
};

export type MutationupdatePetitionUserSubscriptionArgs = {
  isSubscribed: Scalars["Boolean"];
  petitionId: Scalars["GID"];
};

export type MutationupdateSignatureRequestMetadataArgs = {
  metadata: Scalars["JSONObject"];
  petitionSignatureRequestId: Scalars["GID"];
};

export type MutationupdateSimpleReplyArgs = {
  petitionId: Scalars["GID"];
  reply: Scalars["String"];
  replyId: Scalars["GID"];
};

export type MutationupdateUserArgs = {
  data: UpdateUserInput;
  id: Scalars["GID"];
};

export type MutationupdateUserStatusArgs = {
  status: UserStatus;
  transferToUserId?: Maybe<Scalars["GID"]>;
  userIds: Array<Scalars["GID"]>;
};

export type MutationuploadDynamicSelectFieldFileArgs = {
  fieldId: Scalars["GID"];
  file: Scalars["Upload"];
  petitionId: Scalars["GID"];
};

export type MutationvalidatePetitionFieldsArgs = {
  fieldIds: Array<Scalars["GID"]>;
  petitionId: Scalars["GID"];
  validateRepliesWith?: Maybe<PetitionFieldReplyStatus>;
  value: Scalars["Boolean"];
};

export type MutationverifyPublicAccessArgs = {
  ip?: Maybe<Scalars["String"]>;
  keycode: Scalars["ID"];
  token: Scalars["ID"];
  userAgent?: Maybe<Scalars["String"]>;
};

export type OnboardingKey =
  | "CONTACT_DETAILS"
  | "CONTACT_LIST"
  | "PETITIONS_LIST"
  | "PETITION_ACTIVITY"
  | "PETITION_COMPOSE"
  | "PETITION_REVIEW";

export type OnboardingStatus = "FINISHED" | "SKIPPED";

export type OrgIntegration = {
  __typename?: "OrgIntegration";
  /** The name of the integration. */
  name: Scalars["String"];
  /** The provider used for this integration. */
  provider: Scalars["String"];
  /** The type of the integration. */
  type: IntegrationType;
};

/** An organization in the system. */
export type Organization = Timestamps & {
  __typename?: "Organization";
  /** @deprecated Temporal solution for support methods, don't use */
  _id: Scalars["Int"];
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The ID of the organization. */
  id: Scalars["GID"];
  /** The unique text identifier of the organization. */
  identifier: Scalars["String"];
  integrations: Array<OrgIntegration>;
  /** URL of the organization logo */
  logoUrl?: Maybe<Scalars["String"]>;
  /** The name of the organization. */
  name: Scalars["String"];
  /** The status of the organization. */
  status: OrganizationStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
  /** The total number of users */
  userCount: Scalars["Int"];
  /** The users in the organization. */
  users: UserPagination;
};

/** An organization in the system. */
export type OrganizationintegrationsArgs = {
  type?: Maybe<IntegrationType>;
};

/** An organization in the system. */
export type OrganizationusersArgs = {
  exclude?: Maybe<Array<Scalars["GID"]>>;
  includeInactive?: Maybe<Scalars["Boolean"]>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  search?: Maybe<Scalars["String"]>;
  sortBy?: Maybe<Array<OrganizationUsers_OrderBy>>;
};

export type OrganizationPagination = {
  __typename?: "OrganizationPagination";
  /** The requested slice of items. */
  items: Array<Organization>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
};

/** The roles of a user within an organization. */
export type OrganizationRole = "ADMIN" | "NORMAL";

/** The status of the organization. */
export type OrganizationStatus =
  /** Used for regular clients */
  | "ACTIVE"
  /** Used on churned clients */
  | "CHURNED"
  /** Used for demoing the product */
  | "DEMO"
  /** Used for development or testing purposes */
  | "DEV";

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
  __typename?: "OwnershipTransferredEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  owner?: Maybe<User>;
  previousOwner?: Maybe<User>;
  user?: Maybe<User>;
};

/** A petition */
export type Petition = PetitionBase & {
  __typename?: "Petition";
  /** The accesses for this petition */
  accesses: Array<PetitionAccess>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The current signature request. */
  currentSignatureRequest?: Maybe<PetitionSignatureRequest>;
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
  /** Whether comments are enabled or not. */
  hasCommentsEnabled: Scalars["Boolean"];
  /** The ID of the petition or template. */
  id: Scalars["GID"];
  /**
   * Whether the contents card is hidden in the recipient view.
   * @deprecated Don't use this
   */
  isRecipientViewContentsHidden: Scalars["Boolean"];
  /** The locale of the petition. */
  locale: PetitionLocale;
  /** The name of the petition. */
  name?: Maybe<Scalars["String"]>;
  organization: Organization;
  owner: User;
  /** The progress of the petition. */
  progress: PetitionProgress;
  /** The reminders configuration for the petition. */
  remindersConfig?: Maybe<RemindersConfig>;
  /** The signature configuration for the petition. */
  signatureConfig?: Maybe<SignatureConfig>;
  /** The list of signature requests. */
  signatureRequests?: Maybe<Array<PetitionSignatureRequest>>;
  /** Whether to skip the forward security check on the recipient view. */
  skipForwardSecurity: Scalars["Boolean"];
  /** The status of the petition. */
  status: PetitionStatus;
  /** The subscriptions linked to the petition. */
  subscriptions: Array<Subscription>;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
  /** The permissions linked to the petition */
  userPermissions: Array<PetitionUserPermission>;
};

/** A petition */
export type PetitioncurrentSignatureRequestArgs = {
  token?: Maybe<Scalars["String"]>;
};

/** A petition */
export type PetitioneventsArgs = {
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
};

/** A petition access */
export type PetitionAccess = Timestamps & {
  __typename?: "PetitionAccess";
  /** The contact of this access. */
  contact?: Maybe<Contact>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The user who granted the access. */
  granter?: Maybe<User>;
  /** The ID of the petition access. */
  id: Scalars["GID"];
  /** When the next reminder will be sent. */
  nextReminderAt?: Maybe<Scalars["DateTime"]>;
  /** The petition for this message access. */
  petition?: Maybe<Petition>;
  /** Number of reminders sent. */
  reminderCount: Scalars["Int"];
  /** Whether automatic reminders are active or not for this petition access */
  remindersActive: Scalars["Boolean"];
  /** The reminder settings of the petition. */
  remindersConfig?: Maybe<RemindersConfig>;
  /** Number of reminders left. */
  remindersLeft: Scalars["Int"];
  /** The status of the petition access */
  status: PetitionAccessStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
};

export type PetitionAccessPagination = {
  __typename?: "PetitionAccessPagination";
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

export type PetitionAndField = PetitionBaseAndField & {
  __typename?: "PetitionAndField";
  field: PetitionField;
  petition: Petition;
};

/** The petition and a subset of some of its fields. */
export type PetitionAndPartialFields = {
  __typename?: "PetitionAndPartialFields";
  fields: Array<PetitionField>;
  petition: Petition;
};

export type PetitionBase = {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The body of the petition. */
  emailBody?: Maybe<Scalars["JSON"]>;
  /** The subject of the petition. */
  emailSubject?: Maybe<Scalars["String"]>;
  /** The number of fields in the petition. */
  fieldCount: Scalars["Int"];
  /** The definition of the petition fields. */
  fields: Array<PetitionField>;
  /** Whether comments are enabled or not. */
  hasCommentsEnabled: Scalars["Boolean"];
  /** The ID of the petition or template. */
  id: Scalars["GID"];
  /**
   * Whether the contents card is hidden in the recipient view.
   * @deprecated Don't use this
   */
  isRecipientViewContentsHidden: Scalars["Boolean"];
  /** The locale of the petition. */
  locale: PetitionLocale;
  /** The name of the petition. */
  name?: Maybe<Scalars["String"]>;
  organization: Organization;
  owner: User;
  /** Whether to skip the forward security check on the recipient view. */
  skipForwardSecurity: Scalars["Boolean"];
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
  /** The permissions linked to the petition */
  userPermissions: Array<PetitionUserPermission>;
};

export type PetitionBaseAndField = {
  field: PetitionField;
  petition: PetitionBase;
};

export type PetitionBasePagination = {
  __typename?: "PetitionBasePagination";
  /** The requested slice of items. */
  items: Array<PetitionBase>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
};

export type PetitionBaseType = "PETITION" | "TEMPLATE";

export type PetitionClosedEvent = PetitionEvent & {
  __typename?: "PetitionClosedEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  user?: Maybe<User>;
};

export type PetitionClosedNotifiedEvent = PetitionEvent & {
  __typename?: "PetitionClosedNotifiedEvent";
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  user?: Maybe<User>;
};

export type PetitionCompletedEvent = PetitionEvent & {
  __typename?: "PetitionCompletedEvent";
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
};

export type PetitionCreatedEvent = PetitionEvent & {
  __typename?: "PetitionCreatedEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  user?: Maybe<User>;
};

export type PetitionEvent = {
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
};

export type PetitionEventPagination = {
  __typename?: "PetitionEventPagination";
  /** The requested slice of items. */
  items: Array<PetitionEvent>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
};

/** A field within a petition. */
export type PetitionField = {
  __typename?: "PetitionField";
  /** The comments for this field. */
  comments: Array<PetitionFieldComment>;
  /** The description of the petition field. */
  description?: Maybe<Scalars["String"]>;
  /** The ID of the petition field. */
  id: Scalars["GID"];
  /** Determines if the field can be moved or deleted. */
  isFixed: Scalars["Boolean"];
  /** Determines if the field accepts replies */
  isReadOnly: Scalars["Boolean"];
  /** Determines if this field allows multiple replies. */
  multiple: Scalars["Boolean"];
  /** Determines if this field is optional. */
  optional: Scalars["Boolean"];
  /** The options of the petition field. */
  options: Scalars["JSONObject"];
  position: Scalars["Int"];
  /** The replies to the petition field */
  replies: Array<PetitionFieldReply>;
  /** The title of the petition field. */
  title?: Maybe<Scalars["String"]>;
  /** The type of the petition field. */
  type: PetitionFieldType;
  /** Determines if the content of this field has been validated. */
  validated: Scalars["Boolean"];
  /** A JSON object representing the conditions for the field to be visible */
  visibility?: Maybe<Scalars["JSONObject"]>;
};

/** A comment on a petition field */
export type PetitionFieldComment = {
  __typename?: "PetitionFieldComment";
  /** The author of the comment. */
  author?: Maybe<UserOrPetitionAccess>;
  /** The content of the comment. */
  content: Scalars["String"];
  /** The ID of the petition field comment. */
  id: Scalars["GID"];
  /** Whether the comment has been edited after being published. */
  isEdited: Scalars["Boolean"];
  /** Whether the comment is internal (only visible to org users) or public (visible for users and accesses) */
  isInternal: Scalars["Boolean"];
  /** Whether the comment has been read or not. */
  isUnread: Scalars["Boolean"];
  /** Time when the comment was published. */
  publishedAt?: Maybe<Scalars["DateTime"]>;
  /** The reply the comment is refering to. */
  reply?: Maybe<PetitionFieldReply>;
};

/** A reply to a petition field */
export type PetitionFieldReply = Timestamps & {
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
  /** A dynamic select field. */
  | "DYNAMIC_SELECT"
  /** A file upload field. */
  | "FILE_UPLOAD"
  /** A heading field. */
  | "HEADING"
  /** A select field. */
  | "SELECT"
  /** A text field. */
  | "TEXT";

/** The locale used for rendering the petition to the contact. */
export type PetitionLocale = "en" | "es";

/** A petition message */
export type PetitionMessage = CreatedAt & {
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

/** The progress of a petition. */
export type PetitionProgress = {
  __typename?: "PetitionProgress";
  /** Number of optional fields not replied or validated */
  optional: Scalars["Int"];
  /** Number of fields with a reply and not validated */
  replied: Scalars["Int"];
  /** Total number of fields in the petition */
  total: Scalars["Int"];
  /** Number of fields validated */
  validated: Scalars["Int"];
};

export type PetitionReminder = CreatedAt & {
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
};

/** The type of a petition reminder. */
export type PetitionReminderType =
  /** The reminder has been sent by the system according to the reminders configuration. */
  | "AUTOMATIC"
  /** The reminder has been sent manually by a user. */
  | "MANUAL";

export type PetitionReopenedEvent = PetitionEvent & {
  __typename?: "PetitionReopenedEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  user?: Maybe<User>;
};

export type PetitionSignatureCancelReason =
  | "CANCELLED_BY_USER"
  | "DECLINED_BY_SIGNER"
  | "REQUEST_ERROR";

export type PetitionSignatureRequest = Timestamps & {
  __typename?: "PetitionSignatureRequest";
  auditTrailFilename?: Maybe<Scalars["String"]>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  /** Metadata for this signature request. */
  metadata: Scalars["JSONObject"];
  petition: Petition;
  /** The signature configuration for the request. */
  signatureConfig: SignatureConfig;
  signedDocumentFilename?: Maybe<Scalars["String"]>;
  /** The status of the petition signature. */
  status: PetitionSignatureRequestStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
};

export type PetitionSignatureRequestStatus =
  | "CANCELLED"
  | "COMPLETED"
  | "ENQUEUED"
  | "PROCESSING";

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
  __typename?: "PetitionTemplate";
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** Description of the template. */
  description?: Maybe<Scalars["String"]>;
  /** The body of the petition. */
  emailBody?: Maybe<Scalars["JSON"]>;
  /** The subject of the petition. */
  emailSubject?: Maybe<Scalars["String"]>;
  /** The number of fields in the petition. */
  fieldCount: Scalars["Int"];
  /** The definition of the petition fields. */
  fields: Array<PetitionField>;
  /** Whether comments are enabled or not. */
  hasCommentsEnabled: Scalars["Boolean"];
  /** The ID of the petition or template. */
  id: Scalars["GID"];
  /** Whether the template is publicly available or not */
  isPublic: Scalars["Boolean"];
  /**
   * Whether the contents card is hidden in the recipient view.
   * @deprecated Don't use this
   */
  isRecipientViewContentsHidden: Scalars["Boolean"];
  /** The locale of the petition. */
  locale: PetitionLocale;
  /** The name of the petition. */
  name?: Maybe<Scalars["String"]>;
  organization: Organization;
  owner: User;
  /** Whether to skip the forward security check on the recipient view. */
  skipForwardSecurity: Scalars["Boolean"];
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
  /** The permissions linked to the petition */
  userPermissions: Array<PetitionUserPermission>;
};

export type PetitionTemplateAndField = PetitionBaseAndField & {
  __typename?: "PetitionTemplateAndField";
  field: PetitionField;
  petition: PetitionTemplate;
};

export type PetitionTemplatePagination = {
  __typename?: "PetitionTemplatePagination";
  /** The requested slice of items. */
  items: Array<PetitionTemplate>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
};

/** The permission for a petition and user */
export type PetitionUserPermission = Timestamps & {
  __typename?: "PetitionUserPermission";
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** wether user is subscribed or not to emails and alerts of the petition */
  isSubscribed: Scalars["Boolean"];
  /** The type of the permission. */
  permissionType: PetitionUserPermissionType;
  /** The petition linked to the permission. */
  petition: Petition;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
  /** The user linked to the permission */
  user: User;
};

/** The type of permission for a petition user. */
export type PetitionUserPermissionType = "OWNER" | "READ" | "WRITE";

/** The READ and WRITE permissions for a petition user. */
export type PetitionUserPermissionTypeRW = "READ" | "WRITE";

export type PetitionWithFieldAndReplies = {
  __typename?: "PetitionWithFieldAndReplies";
  field: PetitionField;
  petition: Petition;
  replies: Array<PetitionFieldReply>;
};

export type PublicAccessVerification = {
  __typename?: "PublicAccessVerification";
  cookieName?: Maybe<Scalars["String"]>;
  cookieValue?: Maybe<Scalars["String"]>;
  email?: Maybe<Scalars["String"]>;
  isAllowed: Scalars["Boolean"];
  orgLogoUrl?: Maybe<Scalars["String"]>;
  orgName?: Maybe<Scalars["String"]>;
};

/** A public view of a contact */
export type PublicContact = {
  __typename?: "PublicContact";
  /** The email of the user. */
  email: Scalars["String"];
  /** The first name of the user. */
  firstName?: Maybe<Scalars["String"]>;
  /** The full name of the user. */
  fullName?: Maybe<Scalars["String"]>;
  /** The ID of the contact. */
  id: Scalars["GID"];
  /** The last name of the user. */
  lastName?: Maybe<Scalars["String"]>;
};

/** A public view of an organization */
export type PublicOrganization = {
  __typename?: "PublicOrganization";
  /** The ID of the organization. */
  id: Scalars["GID"];
  /** The identifier of the organization. */
  identifier: Scalars["String"];
  /** The logo of the organization. */
  logoUrl?: Maybe<Scalars["String"]>;
  /** The name of the organization. */
  name: Scalars["String"];
};

/** A public view of the petition */
export type PublicPetition = Timestamps & {
  __typename?: "PublicPetition";
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The deadline of the petition. */
  deadline?: Maybe<Scalars["DateTime"]>;
  /** The field definition of the petition. */
  fields: Array<PublicPetitionField>;
  /** Whether comments are enabled or not. */
  hasCommentsEnabled: Scalars["Boolean"];
  /** The ID of the petition. */
  id: Scalars["GID"];
  /**
   * Whether the contents card is hidden in the recipient view.
   * @deprecated Don't use this
   */
  isRecipientViewContentsHidden: Scalars["Boolean"];
  /** The locale of the petition. */
  locale: PetitionLocale;
  /** The signature config of the petition */
  signature?: Maybe<PublicSignatureConfig>;
  signatureStatus?: Maybe<PublicSignatureStatus>;
  /** The status of the petition. */
  status: PetitionStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
};

/** A public view of a petition access */
export type PublicPetitionAccess = {
  __typename?: "PublicPetitionAccess";
  contact?: Maybe<PublicContact>;
  granter?: Maybe<PublicUser>;
  petition?: Maybe<PublicPetition>;
};

/** A field within a petition. */
export type PublicPetitionField = {
  __typename?: "PublicPetitionField";
  commentCount: Scalars["Int"];
  /** The comments for this field. */
  comments: Array<PublicPetitionFieldComment>;
  /** The description of the petition field. */
  description?: Maybe<Scalars["String"]>;
  /** The ID of the petition field. */
  id: Scalars["GID"];
  /** Determines if the field accepts replies */
  isReadOnly: Scalars["Boolean"];
  /** Determines if this field allows multiple replies. */
  multiple: Scalars["Boolean"];
  /** Determines if this field is optional. */
  optional: Scalars["Boolean"];
  /** The options of the petition field. */
  options: Scalars["JSONObject"];
  /** The replies to the petition field */
  replies: Array<PublicPetitionFieldReply>;
  /** The title of the petition field. */
  title?: Maybe<Scalars["String"]>;
  /** The type of the petition field. */
  type: PetitionFieldType;
  unpublishedCommentCount: Scalars["Int"];
  unreadCommentCount: Scalars["Int"];
  /** Determines if the content of this field has been validated. */
  validated: Scalars["Boolean"];
  /** A JSON object representing the conditions for the field to be visible */
  visibility?: Maybe<Scalars["JSONObject"]>;
};

/** A comment on a petition field */
export type PublicPetitionFieldComment = {
  __typename?: "PublicPetitionFieldComment";
  /** The author of the comment. */
  author?: Maybe<PublicUserOrContact>;
  /** The content of the comment. */
  content: Scalars["String"];
  /** The ID of the petition field comment. */
  id: Scalars["GID"];
  /** Whether the comment has been read or not. */
  isUnread: Scalars["Boolean"];
  /** Time when the comment was published. */
  publishedAt?: Maybe<Scalars["DateTime"]>;
  /** The reply the comment is refering to. */
  reply?: Maybe<PublicPetitionFieldReply>;
};

/** A reply to a petition field */
export type PublicPetitionFieldReply = Timestamps & {
  __typename?: "PublicPetitionFieldReply";
  /** The public content of the reply */
  content: Scalars["JSONObject"];
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The ID of the petition field reply. */
  id: Scalars["GID"];
  /** The status of the petition field reply. */
  status: PetitionFieldReplyStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
};

export type PublicPetitionSignerData = {
  email: Scalars["String"];
  firstName: Scalars["String"];
  lastName: Scalars["String"];
  message?: Maybe<Scalars["String"]>;
};

/** The public signature settings of a petition */
export type PublicSignatureConfig = {
  __typename?: "PublicSignatureConfig";
  /** If true, lets the user review the replies before starting the signature process */
  review: Scalars["Boolean"];
  /** The contacts that need to sign the generated document. */
  signers: Array<Maybe<PublicContact>>;
};

export type PublicSignatureStatus = "COMPLETED" | "STARTED";

/** A public view of a user */
export type PublicUser = {
  __typename?: "PublicUser";
  /** The email of the user. */
  email: Scalars["String"];
  /** The first name of the user. */
  firstName?: Maybe<Scalars["String"]>;
  /** The full name of the user. */
  fullName?: Maybe<Scalars["String"]>;
  /** The ID of the user. */
  id: Scalars["GID"];
  /** The last name of the user. */
  lastName?: Maybe<Scalars["String"]>;
  /** The organization of the user. */
  organization: PublicOrganization;
};

export type PublicUserOrContact = PublicContact | PublicUser;

export type Query = {
  __typename?: "Query";
  access?: Maybe<PublicPetitionAccess>;
  contact?: Maybe<Contact>;
  contactByEmail?: Maybe<Contact>;
  /** The contacts of the user */
  contacts: ContactPagination;
  /** Checks if the provided email is available to be registered as a user on Parallel */
  emailIsAvailable: Scalars["Boolean"];
  /** Decodes the given Global ID into an entity in the database. */
  globalIdDecode: SupportMethodResponse;
  /** Encodes the given ID into a Global ID. */
  globalIdEncode: SupportMethodResponse;
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
  publicOrgLogoUrl?: Maybe<Scalars["String"]>;
  /** The publicly available templates */
  publicTemplates: PetitionTemplatePagination;
};

export type QueryaccessArgs = {
  keycode: Scalars["ID"];
};

export type QuerycontactArgs = {
  id: Scalars["GID"];
};

export type QuerycontactByEmailArgs = {
  email: Scalars["String"];
};

export type QuerycontactsArgs = {
  exclude?: Maybe<Array<Scalars["GID"]>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  search?: Maybe<Scalars["String"]>;
  sortBy?: Maybe<Array<QueryContacts_OrderBy>>;
};

export type QueryemailIsAvailableArgs = {
  email: Scalars["String"];
};

export type QueryglobalIdDecodeArgs = {
  id: Scalars["ID"];
};

export type QueryglobalIdEncodeArgs = {
  id: Scalars["Int"];
  type: EntityType;
};

export type QueryorganizationArgs = {
  id: Scalars["GID"];
};

export type QueryorganizationsArgs = {
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  search?: Maybe<Scalars["String"]>;
  sortBy?: Maybe<Array<QueryOrganizations_OrderBy>>;
  status?: Maybe<OrganizationStatus>;
};

export type QuerypetitionArgs = {
  id: Scalars["GID"];
};

export type QuerypetitionAuthTokenArgs = {
  token: Scalars["String"];
};

export type QuerypetitionFieldCommentsArgs = {
  keycode: Scalars["ID"];
  petitionFieldId: Scalars["GID"];
};

export type QuerypetitionsArgs = {
  limit?: Maybe<Scalars["Int"]>;
  locale?: Maybe<PetitionLocale>;
  offset?: Maybe<Scalars["Int"]>;
  search?: Maybe<Scalars["String"]>;
  sortBy?: Maybe<Array<QueryPetitions_OrderBy>>;
  status?: Maybe<PetitionStatus>;
  type?: Maybe<PetitionBaseType>;
};

export type QuerypublicOrgLogoUrlArgs = {
  id: Scalars["GID"];
};

export type QuerypublicTemplatesArgs = {
  limit?: Maybe<Scalars["Int"]>;
  locale?: Maybe<PetitionLocale>;
  offset?: Maybe<Scalars["Int"]>;
  search?: Maybe<Scalars["String"]>;
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
  | "name_DESC";

export type ReminderSentEvent = PetitionEvent & {
  __typename?: "ReminderSentEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  reminder: PetitionReminder;
};

/** The reminder settings of a petition */
export type RemindersConfig = {
  __typename?: "RemindersConfig";
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

export type ReplyCreatedEvent = PetitionEvent & {
  __typename?: "ReplyCreatedEvent";
  createdAt: Scalars["DateTime"];
  createdBy?: Maybe<UserOrPetitionAccess>;
  field?: Maybe<PetitionField>;
  id: Scalars["GID"];
  reply?: Maybe<PetitionFieldReply>;
};

export type ReplyDeletedEvent = PetitionEvent & {
  __typename?: "ReplyDeletedEvent";
  createdAt: Scalars["DateTime"];
  deletedBy?: Maybe<UserOrPetitionAccess>;
  field?: Maybe<PetitionField>;
  id: Scalars["GID"];
};

export type ReplyUpdatedEvent = PetitionEvent & {
  __typename?: "ReplyUpdatedEvent";
  createdAt: Scalars["DateTime"];
  field?: Maybe<PetitionField>;
  id: Scalars["GID"];
  reply?: Maybe<PetitionFieldReply>;
  updatedBy?: Maybe<UserOrPetitionAccess>;
};

/** Represents the result of an operation. */
export type Result = "FAILURE" | "SUCCESS";

export type SendPetitionResult = {
  __typename?: "SendPetitionResult";
  accesses?: Maybe<Array<PetitionAccess>>;
  petition?: Maybe<Petition>;
  result: Result;
};

export type SignatureCancelledEvent = PetitionEvent & {
  __typename?: "SignatureCancelledEvent";
  cancelType: PetitionSignatureCancelReason;
  cancellerReason?: Maybe<Scalars["String"]>;
  contact?: Maybe<Contact>;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  user?: Maybe<User>;
};

export type SignatureCompletedEvent = PetitionEvent & {
  __typename?: "SignatureCompletedEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
};

/** The signature settings of a petition */
export type SignatureConfig = {
  __typename?: "SignatureConfig";
  /** The contacts that need to sign the generated document. */
  contacts: Array<Maybe<Contact>>;
  /** The selected provider for the signature. */
  provider: Scalars["String"];
  /** If true, lets the user review the replies before starting the signature process */
  review: Scalars["Boolean"];
  /** The timezone used to generate the document. */
  timezone: Scalars["String"];
  /** Title of the signature document */
  title: Scalars["String"];
};

/** The signature settings for the petition */
export type SignatureConfigInput = {
  /** The contacts that need to sign the generated document. */
  contactIds: Array<Scalars["ID"]>;
  /** The selected provider for the signature. */
  provider: Scalars["String"];
  /** If true, lets the user review the replies before starting the signature process */
  review: Scalars["Boolean"];
  /** The timezone used to generate the document. */
  timezone: Scalars["String"];
  /** The title of the signing document */
  title: Scalars["String"];
};

export type SignatureStartedEvent = PetitionEvent & {
  __typename?: "SignatureStartedEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
};

export type Subscription = Timestamps & {
  __typename?: "Subscription";
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  endpoint: Scalars["String"];
  id: Scalars["GID"];
  petition: Petition;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
};

/** Return type for all support methods */
export type SupportMethodResponse = {
  __typename?: "SupportMethodResponse";
  message?: Maybe<Scalars["String"]>;
  result: Result;
};

export type Timestamps = {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
};

export type UpdateContactInput = {
  firstName?: Maybe<Scalars["String"]>;
  lastName?: Maybe<Scalars["String"]>;
};

export type UpdatePetitionFieldInput = {
  description?: Maybe<Scalars["String"]>;
  multiple?: Maybe<Scalars["Boolean"]>;
  optional?: Maybe<Scalars["Boolean"]>;
  options?: Maybe<Scalars["JSONObject"]>;
  title?: Maybe<Scalars["String"]>;
  visibility?: Maybe<Scalars["JSONObject"]>;
};

export type UpdatePetitionInput = {
  deadline?: Maybe<Scalars["DateTime"]>;
  description?: Maybe<Scalars["String"]>;
  emailBody?: Maybe<Scalars["JSON"]>;
  emailSubject?: Maybe<Scalars["String"]>;
  hasCommentsEnabled?: Maybe<Scalars["Boolean"]>;
  isRecipientViewContentsHidden?: Maybe<Scalars["Boolean"]>;
  locale?: Maybe<PetitionLocale>;
  name?: Maybe<Scalars["String"]>;
  remindersConfig?: Maybe<RemindersConfigInput>;
  signatureConfig?: Maybe<SignatureConfigInput>;
  skipForwardSecurity?: Maybe<Scalars["Boolean"]>;
};

export type UpdateUserInput = {
  firstName?: Maybe<Scalars["String"]>;
  lastName?: Maybe<Scalars["String"]>;
};

/** A user in the system. */
export type User = Timestamps & {
  __typename?: "User";
  /** Lists every auth token of the user */
  authenticationTokens: UserAuthenticationTokenPagination;
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
  isSuperAdmin: Scalars["Boolean"];
  lastActiveAt?: Maybe<Scalars["DateTime"]>;
  /** The last name of the user. */
  lastName?: Maybe<Scalars["String"]>;
  /** The onboarding status for the different views of the app. */
  onboardingStatus: Scalars["JSONObject"];
  organization: Organization;
  role: OrganizationRole;
  status: UserStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
};

/** A user in the system. */
export type UserauthenticationTokensArgs = {
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  search?: Maybe<Scalars["String"]>;
  sortBy?: Maybe<Array<UserAuthenticationTokens_OrderBy>>;
};

/** A user in the system. */
export type UserhasFeatureFlagArgs = {
  featureFlag: FeatureFlag;
};

export type UserAuthenticationToken = CreatedAt & {
  __typename?: "UserAuthenticationToken";
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  lastUsedAt?: Maybe<Scalars["DateTime"]>;
  tokenName: Scalars["String"];
};

export type UserAuthenticationTokenPagination = {
  __typename?: "UserAuthenticationTokenPagination";
  /** The requested slice of items. */
  items: Array<UserAuthenticationToken>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
};

/** Order to use on User.authenticationTokens */
export type UserAuthenticationTokens_OrderBy =
  | "createdAt_ASC"
  | "createdAt_DESC"
  | "lastUsedAt_ASC"
  | "lastUsedAt_DESC"
  | "tokenName_ASC"
  | "tokenName_DESC";

export type UserOrPetitionAccess = PetitionAccess | User;

export type UserPagination = {
  __typename?: "UserPagination";
  /** The requested slice of items. */
  items: Array<User>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
};

export type UserPermissionAddedEvent = PetitionEvent & {
  __typename?: "UserPermissionAddedEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  permissionType: PetitionUserPermissionType;
  permissionUser?: Maybe<User>;
  user?: Maybe<User>;
};

export type UserPermissionEditedEvent = PetitionEvent & {
  __typename?: "UserPermissionEditedEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  permissionType: PetitionUserPermissionType;
  permissionUser?: Maybe<User>;
  user?: Maybe<User>;
};

export type UserPermissionRemovedEvent = PetitionEvent & {
  __typename?: "UserPermissionRemovedEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  permissionUser?: Maybe<User>;
  user?: Maybe<User>;
};

export type UserStatus = "ACTIVE" | "INACTIVE";

export type VerificationCodeCheck = {
  __typename?: "VerificationCodeCheck";
  remainingAttempts?: Maybe<Scalars["Int"]>;
  result: Result;
};

export type VerificationCodeRequest = {
  __typename?: "VerificationCodeRequest";
  expiresAt: Scalars["DateTime"];
  remainingAttempts: Scalars["Int"];
  token: Scalars["ID"];
};

export type ContactLink_ContactFragment = { __typename?: "Contact" } & Pick<
  Contact,
  "id" | "fullName" | "email"
>;

export type ContactSelect_ContactFragment = { __typename?: "Contact" } & Pick<
  Contact,
  "id" | "fullName" | "email"
>;

export type OnboardingTour_UserFragment = { __typename?: "User" } & Pick<
  User,
  "onboardingStatus"
>;

export type PetitionFieldSelect_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<PetitionField, "id" | "type" | "title" | "options">;

export type PetitionSignatureCellContent_PetitionFragment = {
  __typename?: "Petition";
} & {
  currentSignatureRequest?: Maybe<
    { __typename?: "PetitionSignatureRequest" } & Pick<
      PetitionSignatureRequest,
      "status"
    >
  >;
};

export type PetitionSignatureCellContent_UserFragment = {
  __typename?: "User";
} & { hasPetitionSignature: User["hasFeatureFlag"] };

export type PetitionStatusCellContent_PetitionFragment = {
  __typename?: "Petition";
} & Pick<Petition, "status"> & {
    progress: { __typename?: "PetitionProgress" } & Pick<
      PetitionProgress,
      "validated" | "replied" | "optional" | "total"
    >;
  };

export type ShareButton_PetitionBase_Petition_Fragment = {
  __typename?: "Petition";
} & {
  userPermissions: Array<
    { __typename?: "PetitionUserPermission" } & {
      user: { __typename?: "User" } & Pick<User, "id" | "fullName">;
    }
  >;
};

export type ShareButton_PetitionBase_PetitionTemplate_Fragment = {
  __typename?: "PetitionTemplate";
} & {
  userPermissions: Array<
    { __typename?: "PetitionUserPermission" } & {
      user: { __typename?: "User" } & Pick<User, "id" | "fullName">;
    }
  >;
};

export type ShareButton_PetitionBaseFragment =
  | ShareButton_PetitionBase_Petition_Fragment
  | ShareButton_PetitionBase_PetitionTemplate_Fragment;

export type UserAvatarList_UserFragment = { __typename?: "User" } & Pick<
  User,
  "id" | "fullName"
>;

export type UserSelect_UserFragment = { __typename?: "User" } & Pick<
  User,
  "id" | "fullName" | "email"
>;

export type WithAdminOrganizationRoleQueryVariables = Exact<{
  [key: string]: never;
}>;

export type WithAdminOrganizationRoleQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & Pick<User, "role">;
};

export type HasFeatureFlagQueryVariables = Exact<{
  featureFlag: FeatureFlag;
}>;

export type HasFeatureFlagQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & Pick<User, "id"> & {
      hasFeatureFlag: User["hasFeatureFlag"];
    };
};

export type WithSuperAdminAccessQueryVariables = Exact<{
  [key: string]: never;
}>;

export type WithSuperAdminAccessQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & Pick<User, "isSuperAdmin">;
};

export type AppLayout_UserFragment = { __typename?: "User" } & Pick<
  User,
  "id"
> &
  AppLayoutNavbar_UserFragment &
  OnboardingTour_UserFragment;

export type AppLayout_updateOnboardingStatusMutationVariables = Exact<{
  key: OnboardingKey;
  status: OnboardingStatus;
}>;

export type AppLayout_updateOnboardingStatusMutation = {
  __typename?: "Mutation";
} & {
  updateOnboardingStatus: { __typename?: "User" } & Pick<
    User,
    "id" | "onboardingStatus"
  >;
};

export type AppLayoutNavbar_UserFragment = {
  __typename?: "User";
} & UserMenu_UserFragment;

export type HeaderNameEditable_PetitionBase_Petition_Fragment = {
  __typename?: "Petition";
} & Pick<Petition, "name" | "updatedAt">;

export type HeaderNameEditable_PetitionBase_PetitionTemplate_Fragment = {
  __typename?: "PetitionTemplate";
} & Pick<PetitionTemplate, "name" | "updatedAt">;

export type HeaderNameEditable_PetitionBaseFragment =
  | HeaderNameEditable_PetitionBase_Petition_Fragment
  | HeaderNameEditable_PetitionBase_PetitionTemplate_Fragment;

export type PetitionHeader_PetitionFragment = {
  __typename?: "Petition";
} & Pick<Petition, "id" | "locale" | "deadline" | "status"> & {
    userPermissions: Array<
      { __typename?: "PetitionUserPermission" } & Pick<
        PetitionUserPermission,
        "isSubscribed"
      > & { user: { __typename?: "User" } & Pick<User, "id"> }
    >;
  } & HeaderNameEditable_PetitionBase_Petition_Fragment;

export type PetitionHeader_UserFragment = { __typename?: "User" } & Pick<
  User,
  "id"
> & { hasPetitionPdfExport: User["hasFeatureFlag"] };

export type PetitionHeader_reopenPetitionMutationVariables = Exact<{
  petitionId: Scalars["GID"];
}>;

export type PetitionHeader_reopenPetitionMutation = {
  __typename?: "Mutation";
} & {
  reopenPetition: { __typename?: "Petition" } & Pick<
    Petition,
    "id" | "status" | "updatedAt"
  >;
};

export type PetitionHeader_updatePetitionUserSubscriptionMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  isSubscribed: Scalars["Boolean"];
}>;

export type PetitionHeader_updatePetitionUserSubscriptionMutation = {
  __typename?: "Mutation";
} & {
  updatePetitionUserSubscription: { __typename?: "Petition" } & Pick<
    Petition,
    "id"
  > & {
      userPermissions: Array<
        { __typename?: "PetitionUserPermission" } & Pick<
          PetitionUserPermission,
          "isSubscribed"
        > & { user: { __typename?: "User" } & Pick<User, "id"> }
      >;
    };
};

export type PetitionLayout_PetitionBase_Petition_Fragment = {
  __typename?: "Petition";
} & Pick<Petition, "id" | "name"> &
  PetitionHeader_PetitionFragment;

export type PetitionLayout_PetitionBase_PetitionTemplate_Fragment = {
  __typename?: "PetitionTemplate";
} & Pick<PetitionTemplate, "id" | "name"> &
  PetitionTemplateHeader_PetitionTemplateFragment;

export type PetitionLayout_PetitionBaseFragment =
  | PetitionLayout_PetitionBase_Petition_Fragment
  | PetitionLayout_PetitionBase_PetitionTemplate_Fragment;

export type PetitionLayout_UserFragment = {
  __typename?: "User";
} & AppLayout_UserFragment &
  PetitionHeader_UserFragment;

export type PetitionTemplateHeader_PetitionTemplateFragment = {
  __typename?: "PetitionTemplate";
} & Pick<PetitionTemplate, "id" | "locale"> &
  HeaderNameEditable_PetitionBase_PetitionTemplate_Fragment;

export type PetitionTemplateHeader_UserFragment = {
  __typename?: "User";
} & Pick<User, "id">;

export type SettingsLayout_UserFragment = {
  __typename?: "User";
} & AppLayout_UserFragment;

export type UserMenu_UserFragment = { __typename?: "User" } & Pick<
  User,
  "fullName" | "isSuperAdmin" | "role"
>;

export type CreateUserDialog_emailIsAvailableQueryVariables = Exact<{
  email: Scalars["String"];
}>;

export type CreateUserDialog_emailIsAvailableQuery = {
  __typename?: "Query";
} & Pick<Query, "emailIsAvailable">;

export type AddPetitionAccessDialog_PetitionFragment = {
  __typename?: "Petition";
} & Pick<Petition, "emailSubject" | "emailBody"> & {
    remindersConfig?: Maybe<
      { __typename?: "RemindersConfig" } & Pick<
        RemindersConfig,
        "offset" | "time" | "timezone" | "weekdaysOnly"
      >
    >;
  };

export type MessageEventsIndicator_PetitionMessageFragment = {
  __typename?: "PetitionMessage";
} & Pick<PetitionMessage, "bouncedAt" | "deliveredAt" | "openedAt">;

export type PetitionAccessTable_PetitionFragment = {
  __typename?: "Petition";
} & Pick<Petition, "status"> & {
    accesses: Array<
      {
        __typename?: "PetitionAccess";
      } & PetitionAccessTable_PetitionAccessFragment
    >;
  };

export type PetitionAccessTable_PetitionAccessRemindersConfigFragment = {
  __typename?: "RemindersConfig";
} & Pick<RemindersConfig, "offset" | "time" | "timezone" | "weekdaysOnly">;

export type PetitionAccessTable_PetitionAccessFragment = {
  __typename?: "PetitionAccess";
} & Pick<
  PetitionAccess,
  | "id"
  | "status"
  | "nextReminderAt"
  | "remindersLeft"
  | "reminderCount"
  | "remindersActive"
  | "createdAt"
> & {
    contact?: Maybe<{ __typename?: "Contact" } & ContactLink_ContactFragment>;
    remindersConfig?: Maybe<
      {
        __typename?: "RemindersConfig";
      } & PetitionAccessTable_PetitionAccessRemindersConfigFragment
    >;
  };

export type PetitionActivityTimeline_PetitionFragment = {
  __typename?: "Petition";
} & {
  events: { __typename?: "PetitionEventPagination" } & {
    items: Array<
      | ({
          __typename?: "AccessActivatedEvent";
        } & PetitionActivityTimeline_PetitionEvent_AccessActivatedEvent_Fragment)
      | ({
          __typename?: "AccessDeactivatedEvent";
        } & PetitionActivityTimeline_PetitionEvent_AccessDeactivatedEvent_Fragment)
      | ({
          __typename?: "AccessDelegatedEvent";
        } & PetitionActivityTimeline_PetitionEvent_AccessDelegatedEvent_Fragment)
      | ({
          __typename?: "AccessOpenedEvent";
        } & PetitionActivityTimeline_PetitionEvent_AccessOpenedEvent_Fragment)
      | ({
          __typename?: "CommentDeletedEvent";
        } & PetitionActivityTimeline_PetitionEvent_CommentDeletedEvent_Fragment)
      | ({
          __typename?: "CommentPublishedEvent";
        } & PetitionActivityTimeline_PetitionEvent_CommentPublishedEvent_Fragment)
      | ({
          __typename?: "MessageCancelledEvent";
        } & PetitionActivityTimeline_PetitionEvent_MessageCancelledEvent_Fragment)
      | ({
          __typename?: "MessageScheduledEvent";
        } & PetitionActivityTimeline_PetitionEvent_MessageScheduledEvent_Fragment)
      | ({
          __typename?: "MessageSentEvent";
        } & PetitionActivityTimeline_PetitionEvent_MessageSentEvent_Fragment)
      | ({
          __typename?: "OwnershipTransferredEvent";
        } & PetitionActivityTimeline_PetitionEvent_OwnershipTransferredEvent_Fragment)
      | ({
          __typename?: "PetitionClosedEvent";
        } & PetitionActivityTimeline_PetitionEvent_PetitionClosedEvent_Fragment)
      | ({
          __typename?: "PetitionClosedNotifiedEvent";
        } & PetitionActivityTimeline_PetitionEvent_PetitionClosedNotifiedEvent_Fragment)
      | ({
          __typename?: "PetitionCompletedEvent";
        } & PetitionActivityTimeline_PetitionEvent_PetitionCompletedEvent_Fragment)
      | ({
          __typename?: "PetitionCreatedEvent";
        } & PetitionActivityTimeline_PetitionEvent_PetitionCreatedEvent_Fragment)
      | ({
          __typename?: "PetitionReopenedEvent";
        } & PetitionActivityTimeline_PetitionEvent_PetitionReopenedEvent_Fragment)
      | ({
          __typename?: "ReminderSentEvent";
        } & PetitionActivityTimeline_PetitionEvent_ReminderSentEvent_Fragment)
      | ({
          __typename?: "ReplyCreatedEvent";
        } & PetitionActivityTimeline_PetitionEvent_ReplyCreatedEvent_Fragment)
      | ({
          __typename?: "ReplyDeletedEvent";
        } & PetitionActivityTimeline_PetitionEvent_ReplyDeletedEvent_Fragment)
      | ({
          __typename?: "ReplyUpdatedEvent";
        } & PetitionActivityTimeline_PetitionEvent_ReplyUpdatedEvent_Fragment)
      | ({
          __typename?: "SignatureCancelledEvent";
        } & PetitionActivityTimeline_PetitionEvent_SignatureCancelledEvent_Fragment)
      | ({
          __typename?: "SignatureCompletedEvent";
        } & PetitionActivityTimeline_PetitionEvent_SignatureCompletedEvent_Fragment)
      | ({
          __typename?: "SignatureStartedEvent";
        } & PetitionActivityTimeline_PetitionEvent_SignatureStartedEvent_Fragment)
      | ({
          __typename?: "UserPermissionAddedEvent";
        } & PetitionActivityTimeline_PetitionEvent_UserPermissionAddedEvent_Fragment)
      | ({
          __typename?: "UserPermissionEditedEvent";
        } & PetitionActivityTimeline_PetitionEvent_UserPermissionEditedEvent_Fragment)
      | ({
          __typename?: "UserPermissionRemovedEvent";
        } & PetitionActivityTimeline_PetitionEvent_UserPermissionRemovedEvent_Fragment)
    >;
  };
};

export type PetitionActivityTimeline_PetitionEvent_AccessActivatedEvent_Fragment = {
  __typename?: "AccessActivatedEvent";
} & Pick<AccessActivatedEvent, "id"> &
  TimelineAccessActivatedEvent_AccessActivatedEventFragment;

export type PetitionActivityTimeline_PetitionEvent_AccessDeactivatedEvent_Fragment = {
  __typename?: "AccessDeactivatedEvent";
} & Pick<AccessDeactivatedEvent, "id"> &
  TimelineAccessDeactivatedEvent_AccessDeactivatedEventFragment;

export type PetitionActivityTimeline_PetitionEvent_AccessDelegatedEvent_Fragment = {
  __typename?: "AccessDelegatedEvent";
} & Pick<AccessDelegatedEvent, "id"> &
  TimelineAccessDelegatedEvent_AccessDelegatedEventFragment;

export type PetitionActivityTimeline_PetitionEvent_AccessOpenedEvent_Fragment = {
  __typename?: "AccessOpenedEvent";
} & Pick<AccessOpenedEvent, "id"> &
  TimelineAccessOpenedEvent_AccessOpenedEventFragment;

export type PetitionActivityTimeline_PetitionEvent_CommentDeletedEvent_Fragment = {
  __typename?: "CommentDeletedEvent";
} & Pick<CommentDeletedEvent, "id"> &
  TimelineCommentDeletedEvent_CommentDeletedEventFragment;

export type PetitionActivityTimeline_PetitionEvent_CommentPublishedEvent_Fragment = {
  __typename?: "CommentPublishedEvent";
} & Pick<CommentPublishedEvent, "id"> &
  TimelineCommentPublishedEvent_CommentPublishedEventFragment;

export type PetitionActivityTimeline_PetitionEvent_MessageCancelledEvent_Fragment = {
  __typename?: "MessageCancelledEvent";
} & Pick<MessageCancelledEvent, "id"> &
  TimelineMessageCancelledEvent_MessageCancelledEventFragment;

export type PetitionActivityTimeline_PetitionEvent_MessageScheduledEvent_Fragment = {
  __typename?: "MessageScheduledEvent";
} & Pick<MessageScheduledEvent, "id"> & {
    message: { __typename?: "PetitionMessage" } & Pick<PetitionMessage, "id">;
  } & TimelineMessageScheduledEvent_MessageScheduledEventFragment;

export type PetitionActivityTimeline_PetitionEvent_MessageSentEvent_Fragment = {
  __typename?: "MessageSentEvent";
} & Pick<MessageSentEvent, "id"> &
  TimelineMessageSentEvent_MessageSentEventFragment;

export type PetitionActivityTimeline_PetitionEvent_OwnershipTransferredEvent_Fragment = {
  __typename?: "OwnershipTransferredEvent";
} & Pick<OwnershipTransferredEvent, "id"> &
  TimelineOwnershipTransferredEvent_OwnershipTransferredEventFragment;

export type PetitionActivityTimeline_PetitionEvent_PetitionClosedEvent_Fragment = {
  __typename?: "PetitionClosedEvent";
} & Pick<PetitionClosedEvent, "id"> &
  TimelinePetitionClosedEvent_PetitionClosedEventFragment;

export type PetitionActivityTimeline_PetitionEvent_PetitionClosedNotifiedEvent_Fragment = {
  __typename?: "PetitionClosedNotifiedEvent";
} & Pick<PetitionClosedNotifiedEvent, "id"> &
  TimelinePetitionClosedNotifiedEvent_PetitionClosedNotifiedEventFragment;

export type PetitionActivityTimeline_PetitionEvent_PetitionCompletedEvent_Fragment = {
  __typename?: "PetitionCompletedEvent";
} & Pick<PetitionCompletedEvent, "id"> &
  TimelinePetitionCompletedEvent_PetitionCompletedEventFragment;

export type PetitionActivityTimeline_PetitionEvent_PetitionCreatedEvent_Fragment = {
  __typename?: "PetitionCreatedEvent";
} & Pick<PetitionCreatedEvent, "id"> &
  TimelinePetitionCreatedEvent_PetitionCreatedEventFragment;

export type PetitionActivityTimeline_PetitionEvent_PetitionReopenedEvent_Fragment = {
  __typename?: "PetitionReopenedEvent";
} & Pick<PetitionReopenedEvent, "id"> &
  TimelinePetitionReopenedEvent_PetitionReopenedEventFragment;

export type PetitionActivityTimeline_PetitionEvent_ReminderSentEvent_Fragment = {
  __typename?: "ReminderSentEvent";
} & Pick<ReminderSentEvent, "id"> &
  TimelineReminderSentEvent_ReminderSentEventFragment;

export type PetitionActivityTimeline_PetitionEvent_ReplyCreatedEvent_Fragment = {
  __typename?: "ReplyCreatedEvent";
} & Pick<ReplyCreatedEvent, "id"> &
  TimelineReplyCreatedEvent_ReplyCreatedEventFragment;

export type PetitionActivityTimeline_PetitionEvent_ReplyDeletedEvent_Fragment = {
  __typename?: "ReplyDeletedEvent";
} & Pick<ReplyDeletedEvent, "id"> &
  TimelineReplyDeletedEvent_ReplyDeletedEventFragment;

export type PetitionActivityTimeline_PetitionEvent_ReplyUpdatedEvent_Fragment = {
  __typename?: "ReplyUpdatedEvent";
} & Pick<ReplyUpdatedEvent, "id"> &
  TimelineReplyUpdatedEvent_ReplyUpdatedEventFragment;

export type PetitionActivityTimeline_PetitionEvent_SignatureCancelledEvent_Fragment = {
  __typename?: "SignatureCancelledEvent";
} & Pick<SignatureCancelledEvent, "id"> &
  TimelineSignatureCancelledEvent_SignatureCancelledEventFragment;

export type PetitionActivityTimeline_PetitionEvent_SignatureCompletedEvent_Fragment = {
  __typename?: "SignatureCompletedEvent";
} & Pick<SignatureCompletedEvent, "id"> &
  TimelineSignatureCompletedEvent_SignatureCompletedEventFragment;

export type PetitionActivityTimeline_PetitionEvent_SignatureStartedEvent_Fragment = {
  __typename?: "SignatureStartedEvent";
} & Pick<SignatureStartedEvent, "id"> &
  TimelineSignatureStartedEvent_SignatureStartedEventFragment;

export type PetitionActivityTimeline_PetitionEvent_UserPermissionAddedEvent_Fragment = {
  __typename?: "UserPermissionAddedEvent";
} & Pick<UserPermissionAddedEvent, "id"> &
  TimelineUserPermissionAddedEvent_UserPermissionAddedEventFragment;

export type PetitionActivityTimeline_PetitionEvent_UserPermissionEditedEvent_Fragment = {
  __typename?: "UserPermissionEditedEvent";
} & Pick<UserPermissionEditedEvent, "id"> &
  TimelineUserPermissionEditedEvent_UserPermissionEditedEventFragment;

export type PetitionActivityTimeline_PetitionEvent_UserPermissionRemovedEvent_Fragment = {
  __typename?: "UserPermissionRemovedEvent";
} & Pick<UserPermissionRemovedEvent, "id"> &
  TimelineUserPermissionRemovedEvent_UserPermissionRemovedEventFragment;

export type PetitionActivityTimeline_PetitionEventFragment =
  | PetitionActivityTimeline_PetitionEvent_AccessActivatedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_AccessDeactivatedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_AccessDelegatedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_AccessOpenedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_CommentDeletedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_CommentPublishedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_MessageCancelledEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_MessageScheduledEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_MessageSentEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_OwnershipTransferredEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_PetitionClosedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_PetitionClosedNotifiedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_PetitionCompletedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_PetitionCreatedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_PetitionReopenedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_ReminderSentEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_ReplyCreatedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_ReplyDeletedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_ReplyUpdatedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_SignatureCancelledEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_SignatureCompletedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_SignatureStartedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_UserPermissionAddedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_UserPermissionEditedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_UserPermissionRemovedEvent_Fragment;

export type PetitionFieldReference_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<PetitionField, "title">;

export type SentPetitionMessageDialog_PetitionMessageFragment = {
  __typename?: "PetitionMessage";
} & Pick<
  PetitionMessage,
  "emailBody" | "emailSubject" | "sentAt" | "scheduledAt"
> & {
    access: { __typename?: "PetitionAccess" } & {
      contact?: Maybe<{ __typename?: "Contact" } & ContactLink_ContactFragment>;
    };
  };

export type SentReminderMessageDialog_PetitionReminderFragment = {
  __typename?: "PetitionReminder";
} & Pick<PetitionReminder, "createdAt" | "emailBody"> & {
    access: { __typename?: "PetitionAccess" } & {
      contact?: Maybe<{ __typename?: "Contact" } & ContactLink_ContactFragment>;
    };
  };

export type UserReference_UserFragment = { __typename?: "User" } & Pick<
  User,
  "id" | "fullName" | "status"
>;

export type TimelineAccessActivatedEvent_AccessActivatedEventFragment = {
  __typename?: "AccessActivatedEvent";
} & Pick<AccessActivatedEvent, "createdAt"> & {
    user?: Maybe<{ __typename?: "User" } & UserReference_UserFragment>;
    access: { __typename?: "PetitionAccess" } & {
      contact?: Maybe<{ __typename?: "Contact" } & ContactLink_ContactFragment>;
    };
  };

export type TimelineAccessDeactivatedEvent_AccessDeactivatedEventFragment = {
  __typename?: "AccessDeactivatedEvent";
} & Pick<AccessDeactivatedEvent, "createdAt"> & {
    user?: Maybe<{ __typename?: "User" } & UserReference_UserFragment>;
    access: { __typename?: "PetitionAccess" } & {
      contact?: Maybe<{ __typename?: "Contact" } & ContactLink_ContactFragment>;
    };
  };

export type TimelineAccessDelegatedEvent_AccessDelegatedEventFragment = {
  __typename?: "AccessDelegatedEvent";
} & Pick<AccessDelegatedEvent, "createdAt"> & {
    originalAccess: { __typename?: "PetitionAccess" } & {
      contact?: Maybe<{ __typename?: "Contact" } & ContactLink_ContactFragment>;
    };
    newAccess: { __typename?: "PetitionAccess" } & {
      contact?: Maybe<{ __typename?: "Contact" } & ContactLink_ContactFragment>;
    };
  };

export type TimelineAccessOpenedEvent_AccessOpenedEventFragment = {
  __typename?: "AccessOpenedEvent";
} & Pick<AccessOpenedEvent, "createdAt"> & {
    access: { __typename?: "PetitionAccess" } & {
      contact?: Maybe<{ __typename?: "Contact" } & ContactLink_ContactFragment>;
    };
  };

export type TimelineCommentDeletedEvent_CommentDeletedEventFragment = {
  __typename?: "CommentDeletedEvent";
} & Pick<CommentDeletedEvent, "createdAt"> & {
    field?: Maybe<
      {
        __typename?: "PetitionField";
      } & PetitionFieldReference_PetitionFieldFragment
    >;
    deletedBy?: Maybe<
      | ({ __typename?: "PetitionAccess" } & {
          contact?: Maybe<
            { __typename?: "Contact" } & ContactLink_ContactFragment
          >;
        })
      | ({ __typename?: "User" } & UserReference_UserFragment)
    >;
  };

export type TimelineCommentPublishedEvent_CommentPublishedEventFragment = {
  __typename?: "CommentPublishedEvent";
} & Pick<CommentPublishedEvent, "createdAt"> & {
    field?: Maybe<
      {
        __typename?: "PetitionField";
      } & PetitionFieldReference_PetitionFieldFragment
    >;
    comment?: Maybe<
      { __typename?: "PetitionFieldComment" } & Pick<
        PetitionFieldComment,
        "isEdited" | "content"
      > & {
          author?: Maybe<
            | ({ __typename?: "PetitionAccess" } & {
                contact?: Maybe<
                  { __typename?: "Contact" } & ContactLink_ContactFragment
                >;
              })
            | ({ __typename?: "User" } & UserReference_UserFragment)
          >;
        }
    >;
  };

export type TimelineMessageCancelledEvent_MessageCancelledEventFragment = {
  __typename?: "MessageCancelledEvent";
} & Pick<MessageCancelledEvent, "createdAt"> & {
    message: { __typename?: "PetitionMessage" } & Pick<
      PetitionMessage,
      "status" | "scheduledAt" | "emailSubject"
    > & {
        access: { __typename?: "PetitionAccess" } & {
          contact?: Maybe<
            { __typename?: "Contact" } & ContactLink_ContactFragment
          >;
        };
      };
    user?: Maybe<{ __typename?: "User" } & UserReference_UserFragment>;
  };

export type TimelineMessageScheduledEvent_MessageScheduledEventFragment = {
  __typename?: "MessageScheduledEvent";
} & Pick<MessageScheduledEvent, "createdAt"> & {
    message: { __typename?: "PetitionMessage" } & Pick<
      PetitionMessage,
      "status" | "scheduledAt" | "emailSubject"
    > & {
        sender: { __typename?: "User" } & UserReference_UserFragment;
        access: { __typename?: "PetitionAccess" } & {
          contact?: Maybe<
            { __typename?: "Contact" } & ContactLink_ContactFragment
          >;
        };
      } & SentPetitionMessageDialog_PetitionMessageFragment;
  };

export type TimelineMessageSentEvent_MessageSentEventFragment = {
  __typename?: "MessageSentEvent";
} & Pick<MessageSentEvent, "createdAt"> & {
    message: { __typename?: "PetitionMessage" } & Pick<
      PetitionMessage,
      "emailSubject" | "scheduledAt"
    > & {
        sender: { __typename?: "User" } & UserReference_UserFragment;
        access: { __typename?: "PetitionAccess" } & {
          contact?: Maybe<
            { __typename?: "Contact" } & ContactLink_ContactFragment
          >;
        };
      } & MessageEventsIndicator_PetitionMessageFragment &
      SentPetitionMessageDialog_PetitionMessageFragment;
  };

export type TimelineOwnershipTransferredEvent_OwnershipTransferredEventFragment = {
  __typename?: "OwnershipTransferredEvent";
} & Pick<OwnershipTransferredEvent, "createdAt"> & {
    user?: Maybe<{ __typename?: "User" } & UserReference_UserFragment>;
    owner?: Maybe<{ __typename?: "User" } & UserReference_UserFragment>;
    previousOwner?: Maybe<{ __typename?: "User" } & UserReference_UserFragment>;
  };

export type TimelinePetitionClosedEvent_PetitionClosedEventFragment = {
  __typename?: "PetitionClosedEvent";
} & Pick<PetitionClosedEvent, "createdAt"> & {
    user?: Maybe<{ __typename?: "User" } & UserReference_UserFragment>;
  };

export type TimelinePetitionClosedNotifiedEvent_PetitionClosedNotifiedEventFragment = {
  __typename?: "PetitionClosedNotifiedEvent";
} & Pick<PetitionClosedNotifiedEvent, "createdAt"> & {
    user?: Maybe<{ __typename?: "User" } & UserReference_UserFragment>;
    access: { __typename?: "PetitionAccess" } & {
      contact?: Maybe<{ __typename?: "Contact" } & ContactLink_ContactFragment>;
    };
  };

export type TimelinePetitionCompletedEvent_PetitionCompletedEventFragment = {
  __typename?: "PetitionCompletedEvent";
} & Pick<PetitionCompletedEvent, "createdAt"> & {
    access: { __typename?: "PetitionAccess" } & {
      contact?: Maybe<{ __typename?: "Contact" } & ContactLink_ContactFragment>;
    };
  };

export type TimelinePetitionCreatedEvent_PetitionCreatedEventFragment = {
  __typename?: "PetitionCreatedEvent";
} & Pick<PetitionCreatedEvent, "createdAt"> & {
    user?: Maybe<{ __typename?: "User" } & UserReference_UserFragment>;
  };

export type TimelinePetitionReopenedEvent_PetitionReopenedEventFragment = {
  __typename?: "PetitionReopenedEvent";
} & Pick<PetitionReopenedEvent, "createdAt"> & {
    user?: Maybe<{ __typename?: "User" } & UserReference_UserFragment>;
  };

export type TimelineReminderSentEvent_ReminderSentEventFragment = {
  __typename?: "ReminderSentEvent";
} & Pick<ReminderSentEvent, "createdAt"> & {
    reminder: { __typename?: "PetitionReminder" } & Pick<
      PetitionReminder,
      "type"
    > & {
        sender?: Maybe<{ __typename?: "User" } & UserReference_UserFragment>;
        access: { __typename?: "PetitionAccess" } & {
          contact?: Maybe<
            { __typename?: "Contact" } & ContactLink_ContactFragment
          >;
        };
      } & SentReminderMessageDialog_PetitionReminderFragment;
  };

export type TimelineReplyCreatedEvent_ReplyCreatedEventFragment = {
  __typename?: "ReplyCreatedEvent";
} & Pick<ReplyCreatedEvent, "createdAt"> & {
    field?: Maybe<
      {
        __typename?: "PetitionField";
      } & PetitionFieldReference_PetitionFieldFragment
    >;
    createdBy?: Maybe<
      | ({ __typename?: "PetitionAccess" } & {
          contact?: Maybe<
            { __typename?: "Contact" } & ContactLink_ContactFragment
          >;
        })
      | ({ __typename?: "User" } & UserReference_UserFragment)
    >;
  };

export type TimelineReplyDeletedEvent_ReplyDeletedEventFragment = {
  __typename?: "ReplyDeletedEvent";
} & Pick<ReplyDeletedEvent, "createdAt"> & {
    field?: Maybe<
      {
        __typename?: "PetitionField";
      } & PetitionFieldReference_PetitionFieldFragment
    >;
    deletedBy?: Maybe<
      | ({ __typename?: "PetitionAccess" } & {
          contact?: Maybe<
            { __typename?: "Contact" } & ContactLink_ContactFragment
          >;
        })
      | ({ __typename?: "User" } & UserReference_UserFragment)
    >;
  };

export type TimelineReplyUpdatedEvent_ReplyUpdatedEventFragment = {
  __typename?: "ReplyUpdatedEvent";
} & Pick<ReplyUpdatedEvent, "createdAt"> & {
    field?: Maybe<
      {
        __typename?: "PetitionField";
      } & PetitionFieldReference_PetitionFieldFragment
    >;
    updatedBy?: Maybe<
      | ({ __typename?: "PetitionAccess" } & {
          contact?: Maybe<
            { __typename?: "Contact" } & ContactLink_ContactFragment
          >;
        })
      | ({ __typename?: "User" } & UserReference_UserFragment)
    >;
  };

export type TimelineSignatureCancelledEvent_SignatureCancelledEventFragment = {
  __typename?: "SignatureCancelledEvent";
} & Pick<
  SignatureCancelledEvent,
  "cancelType" | "cancellerReason" | "createdAt"
> & {
    user?: Maybe<{ __typename?: "User" } & UserReference_UserFragment>;
    contact?: Maybe<{ __typename?: "Contact" } & ContactLink_ContactFragment>;
  };

export type TimelineSignatureCompletedEvent_SignatureCompletedEventFragment = {
  __typename?: "SignatureCompletedEvent";
} & Pick<SignatureCompletedEvent, "createdAt">;

export type TimelineSignatureStartedEvent_SignatureStartedEventFragment = {
  __typename?: "SignatureStartedEvent";
} & Pick<SignatureStartedEvent, "createdAt">;

export type TimelineUserPermissionAddedEvent_UserPermissionAddedEventFragment = {
  __typename?: "UserPermissionAddedEvent";
} & Pick<UserPermissionAddedEvent, "permissionType" | "createdAt"> & {
    user?: Maybe<{ __typename?: "User" } & UserReference_UserFragment>;
    permissionUser?: Maybe<
      { __typename?: "User" } & UserReference_UserFragment
    >;
  };

export type TimelineUserPermissionEditedEvent_UserPermissionEditedEventFragment = {
  __typename?: "UserPermissionEditedEvent";
} & Pick<UserPermissionEditedEvent, "permissionType" | "createdAt"> & {
    user?: Maybe<{ __typename?: "User" } & UserReference_UserFragment>;
    permissionUser?: Maybe<
      { __typename?: "User" } & UserReference_UserFragment
    >;
  };

export type TimelineUserPermissionRemovedEvent_UserPermissionRemovedEventFragment = {
  __typename?: "UserPermissionRemovedEvent";
} & Pick<UserPermissionRemovedEvent, "createdAt"> & {
    user?: Maybe<{ __typename?: "User" } & UserReference_UserFragment>;
    permissionUser?: Maybe<
      { __typename?: "User" } & UserReference_UserFragment
    >;
  };

export type PetitionContents_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<PetitionField, "id" | "title" | "type" | "options"> &
  filterPetitionFields_PetitionFieldFragment;

export type PetitionSettings_UserFragment = { __typename?: "User" } & {
  hasPetitionSignature: User["hasFeatureFlag"];
  hasSkipForwardSecurity: User["hasFeatureFlag"];
  hasHideRecipientViewContents: User["hasFeatureFlag"];
} & {
  organization: { __typename?: "Organization" } & Pick<Organization, "id"> & {
      signatureIntegrations: Array<
        {
          __typename?: "OrgIntegration";
        } & SignatureConfigDialog_OrgIntegrationFragment
      >;
    };
};

export type PetitionSettings_PetitionBase_Petition_Fragment = {
  __typename?: "Petition";
} & Pick<
  Petition,
  | "status"
  | "deadline"
  | "id"
  | "locale"
  | "hasCommentsEnabled"
  | "skipForwardSecurity"
  | "isRecipientViewContentsHidden"
> & {
    currentSignatureRequest?: Maybe<
      { __typename?: "PetitionSignatureRequest" } & Pick<
        PetitionSignatureRequest,
        "id" | "status"
      >
    >;
  } & SignatureConfigDialog_PetitionFragment;

export type PetitionSettings_PetitionBase_PetitionTemplate_Fragment = {
  __typename?: "PetitionTemplate";
} & Pick<
  PetitionTemplate,
  | "id"
  | "locale"
  | "hasCommentsEnabled"
  | "skipForwardSecurity"
  | "isRecipientViewContentsHidden"
>;

export type PetitionSettings_PetitionBaseFragment =
  | PetitionSettings_PetitionBase_Petition_Fragment
  | PetitionSettings_PetitionBase_PetitionTemplate_Fragment;

export type PetitionSettings_cancelPetitionSignatureRequestMutationVariables = Exact<{
  petitionSignatureRequestId: Scalars["GID"];
}>;

export type PetitionSettings_cancelPetitionSignatureRequestMutation = {
  __typename?: "Mutation";
} & {
  cancelSignatureRequest: { __typename?: "PetitionSignatureRequest" } & Pick<
    PetitionSignatureRequest,
    "id" | "status"
  >;
};

export type PetitionSettings_startPetitionSignatureRequestMutationVariables = Exact<{
  petitionId: Scalars["GID"];
}>;

export type PetitionSettings_startPetitionSignatureRequestMutation = {
  __typename?: "Mutation";
} & {
  startSignatureRequest: { __typename?: "PetitionSignatureRequest" } & Pick<
    PetitionSignatureRequest,
    "id" | "status"
  >;
};

export type PetitionSharingModal_Petition_Petition_Fragment = {
  __typename?: "Petition";
} & Pick<Petition, "id" | "name"> & {
    userPermissions: Array<
      { __typename?: "PetitionUserPermission" } & Pick<
        PetitionUserPermission,
        "permissionType"
      > & {
          user: { __typename?: "User" } & Pick<User, "id"> &
            PetitionSharingModal_UserFragment;
        }
    >;
  };

export type PetitionSharingModal_Petition_PetitionTemplate_Fragment = {
  __typename?: "PetitionTemplate";
} & Pick<PetitionTemplate, "id" | "name"> & {
    userPermissions: Array<
      { __typename?: "PetitionUserPermission" } & Pick<
        PetitionUserPermission,
        "permissionType"
      > & {
          user: { __typename?: "User" } & Pick<User, "id"> &
            PetitionSharingModal_UserFragment;
        }
    >;
  };

export type PetitionSharingModal_PetitionFragment =
  | PetitionSharingModal_Petition_Petition_Fragment
  | PetitionSharingModal_Petition_PetitionTemplate_Fragment;

export type PetitionSharingModal_UserFragment = { __typename?: "User" } & Pick<
  User,
  "id" | "email" | "fullName"
> &
  UserSelect_UserFragment;

export type PetitionSharingModal_addPetitionUserPermissionMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  userIds: Array<Scalars["GID"]> | Scalars["GID"];
  permissionType: PetitionUserPermissionTypeRW;
  notify?: Maybe<Scalars["Boolean"]>;
  message?: Maybe<Scalars["String"]>;
}>;

export type PetitionSharingModal_addPetitionUserPermissionMutation = {
  __typename?: "Mutation";
} & {
  addPetitionUserPermission: Array<
    {
      __typename?: "Petition";
    } & PetitionSharingModal_Petition_Petition_Fragment
  >;
};

export type PetitionSharingModal_removePetitionUserPermissionMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  userId: Scalars["GID"];
}>;

export type PetitionSharingModal_removePetitionUserPermissionMutation = {
  __typename?: "Mutation";
} & {
  removePetitionUserPermission: Array<
    {
      __typename?: "Petition";
    } & PetitionSharingModal_Petition_Petition_Fragment
  >;
};

export type PetitionSharingModal_transferPetitionOwnershipMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  userId: Scalars["GID"];
}>;

export type PetitionSharingModal_transferPetitionOwnershipMutation = {
  __typename?: "Mutation";
} & {
  transferPetitionOwnership: Array<
    {
      __typename?: "Petition";
    } & PetitionSharingModal_Petition_Petition_Fragment
  >;
};

export type PetitionSharingModal_PetitionUserPermissionsQueryVariables = Exact<{
  petitionId: Scalars["GID"];
}>;

export type PetitionSharingModal_PetitionUserPermissionsQuery = {
  __typename?: "Query";
} & {
  petition?: Maybe<
    | ({
        __typename?: "Petition";
      } & PetitionSharingModal_Petition_Petition_Fragment)
    | ({
        __typename?: "PetitionTemplate";
      } & PetitionSharingModal_Petition_PetitionTemplate_Fragment)
  >;
};

export type SignatureConfigDialog_PetitionFragment = {
  __typename?: "Petition";
} & Pick<Petition, "name" | "status"> & {
    signatureConfig?: Maybe<
      { __typename?: "SignatureConfig" } & Pick<
        SignatureConfig,
        "provider" | "title" | "review"
      > & {
          contacts: Array<
            Maybe<{ __typename?: "Contact" } & ContactSelect_ContactFragment>
          >;
        }
    >;
  };

export type SignatureConfigDialog_OrgIntegrationFragment = {
  __typename?: "OrgIntegration";
} & { label: OrgIntegration["name"]; value: OrgIntegration["provider"] };

export type useTemplateDetailsDialogPetitionQueryVariables = Exact<{
  templateId: Scalars["GID"];
}>;

export type useTemplateDetailsDialogPetitionQuery = { __typename?: "Query" } & {
  petition?: Maybe<
    | { __typename?: "Petition" }
    | ({
        __typename?: "PetitionTemplate";
      } & TemplateDetailsDialog_PetitionTemplateFragment)
  >;
};

export type TemplateDetailsDialog_PetitionTemplateFragment = {
  __typename?: "PetitionTemplate";
} & Pick<PetitionTemplate, "id" | "description" | "name" | "updatedAt"> & {
    fields: Array<
      { __typename?: "PetitionField" } & Pick<
        PetitionField,
        "id" | "title" | "type" | "options"
      >
    >;
    owner: { __typename?: "User" } & Pick<User, "id" | "fullName"> & {
        organization: { __typename?: "Organization" } & Pick<
          Organization,
          "id" | "name"
        >;
      };
    userPermissions: Array<
      { __typename?: "PetitionUserPermission" } & Pick<
        PetitionUserPermission,
        "permissionType"
      > & { user: { __typename?: "User" } & Pick<User, "id"> }
    >;
  };

export type DynamicSelectSettings_uploadDynamicSelectFieldFileMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  fieldId: Scalars["GID"];
  file: Scalars["Upload"];
}>;

export type DynamicSelectSettings_uploadDynamicSelectFieldFileMutation = {
  __typename?: "Mutation";
} & {
  uploadDynamicSelectFieldFile: { __typename?: "PetitionField" } & Pick<
    PetitionField,
    "id" | "options"
  >;
};

export type DynamicSelectSettings_dynamicSelectFieldFileDownloadLinkMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  fieldId: Scalars["GID"];
}>;

export type DynamicSelectSettings_dynamicSelectFieldFileDownloadLinkMutation = {
  __typename?: "Mutation";
} & {
  dynamicSelectFieldFileDownloadLink: {
    __typename?: "FileUploadReplyDownloadLinkResult";
  } & Pick<FileUploadReplyDownloadLinkResult, "result" | "url">;
};

export type PetitionComposeField_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<
  PetitionField,
  | "id"
  | "type"
  | "title"
  | "description"
  | "optional"
  | "multiple"
  | "isFixed"
  | "isReadOnly"
  | "visibility"
> &
  SelectTypeFieldOptions_PetitionFieldFragment &
  PetitionFieldVisibilityEditor_PetitionFieldFragment;

export type PetitionComposeFieldList_PetitionFragment = {
  __typename?: "Petition";
} & {
  fields: Array<
    { __typename?: "PetitionField" } & Pick<PetitionField, "isFixed"> &
      PetitionComposeField_PetitionFieldFragment &
      ReferencedFieldDialogDialog_PetitionFieldFragment
  >;
};

export type PetitionComposeFieldSettings_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<
  PetitionField,
  | "id"
  | "type"
  | "optional"
  | "multiple"
  | "options"
  | "isReadOnly"
  | "isFixed"
  | "position"
  | "visibility"
>;

export type PetitionFieldVisibilityEditor_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<PetitionField, "id" | "type" | "multiple" | "options" | "isReadOnly"> &
  PetitionFieldSelect_PetitionFieldFragment;

export type PetitionTemplateComposeMessageEditor_PetitionFragment = {
  __typename?: "PetitionTemplate";
} & Pick<PetitionTemplate, "id" | "emailSubject" | "emailBody" | "description">;

export type ReferencedFieldDialogDialog_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<PetitionField, "id" | "title" | "type">;

export type SelectTypeFieldOptions_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<PetitionField, "id" | "options">;

export type ExportRepliesDialog_UserFragment = { __typename?: "User" } & {
  hasExportCuatrecasas: User["hasFeatureFlag"];
};

export type ExportRepliesDialog_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<PetitionField, "id" | "type"> & {
    replies: Array<
      {
        __typename?: "PetitionFieldReply";
      } & useFilenamePlaceholdersRename_PetitionFieldReplyFragment
    >;
  } & useFilenamePlaceholdersRename_PetitionFieldFragment;

export type ExportRepliesProgressDialog_PetitionFragment = {
  __typename?: "Petition";
} & Pick<Petition, "id"> & {
    fields: Array<
      { __typename?: "PetitionField" } & Pick<PetitionField, "id" | "type"> & {
          replies: Array<
            { __typename?: "PetitionFieldReply" } & Pick<
              PetitionFieldReply,
              "id" | "metadata"
            > &
              useFilenamePlaceholdersRename_PetitionFieldReplyFragment
          >;
        } & useFilenamePlaceholdersRename_PetitionFieldFragment
    >;
    currentSignatureRequest?: Maybe<
      { __typename?: "PetitionSignatureRequest" } & Pick<
        PetitionSignatureRequest,
        | "id"
        | "status"
        | "signedDocumentFilename"
        | "auditTrailFilename"
        | "metadata"
      >
    >;
  };

export type ExportRepliesProgressDialog_PetitionRepliesQueryVariables = Exact<{
  petitionId: Scalars["GID"];
}>;

export type ExportRepliesProgressDialog_PetitionRepliesQuery = {
  __typename?: "Query";
} & {
  petition?: Maybe<
    | ({
        __typename?: "Petition";
      } & ExportRepliesProgressDialog_PetitionFragment)
    | { __typename?: "PetitionTemplate" }
  >;
};

export type ExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  replyId: Scalars["GID"];
}>;

export type ExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutation = {
  __typename?: "Mutation";
} & {
  fileUploadReplyDownloadLink: {
    __typename?: "FileUploadReplyDownloadLinkResult";
  } & Pick<FileUploadReplyDownloadLinkResult, "result" | "url">;
};

export type ExportRepliesProgressDialog_signedPetitionDownloadLinkMutationVariables = Exact<{
  petitionSignatureRequestId: Scalars["GID"];
  downloadAuditTrail?: Maybe<Scalars["Boolean"]>;
}>;

export type ExportRepliesProgressDialog_signedPetitionDownloadLinkMutation = {
  __typename?: "Mutation";
} & {
  signedPetitionDownloadLink: {
    __typename?: "FileUploadReplyDownloadLinkResult";
  } & Pick<FileUploadReplyDownloadLinkResult, "result" | "filename" | "url">;
};

export type ExportRepliesProgressDialog_updatePetitionFieldReplyMetadataMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  replyId: Scalars["GID"];
  metadata: Scalars["JSONObject"];
}>;

export type ExportRepliesProgressDialog_updatePetitionFieldReplyMetadataMutation = {
  __typename?: "Mutation";
} & {
  updatePetitionFieldReplyMetadata: {
    __typename?: "PetitionFieldReply";
  } & Pick<PetitionFieldReply, "id" | "metadata">;
};

export type ExportRepliesProgressDialog_updateSignatureRequestMetadataMutationVariables = Exact<{
  petitionSignatureRequestId: Scalars["GID"];
  metadata: Scalars["JSONObject"];
}>;

export type ExportRepliesProgressDialog_updateSignatureRequestMetadataMutation = {
  __typename?: "Mutation";
} & {
  updateSignatureRequestMetadata: {
    __typename?: "PetitionSignatureRequest";
  } & Pick<PetitionSignatureRequest, "id" | "metadata">;
};

export type PetitionRepliesField_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<
  PetitionField,
  "id" | "type" | "title" | "description" | "validated"
> & {
    replies: Array<
      {
        __typename?: "PetitionFieldReply";
      } & PetitionRepliesField_PetitionFieldReplyFragment
    >;
    comments: Array<
      { __typename?: "PetitionFieldComment" } & Pick<
        PetitionFieldComment,
        "id" | "isUnread" | "publishedAt"
      >
    >;
  };

export type PetitionRepliesField_PetitionFieldReplyFragment = {
  __typename?: "PetitionFieldReply";
} & Pick<PetitionFieldReply, "id"> &
  PetitionRepliesFieldReply_PetitionFieldReplyFragment;

export type PetitionRepliesFieldComments_UserFragment = {
  __typename?: "User";
} & Pick<User, "id"> & { hasInternalComments: User["hasFeatureFlag"] };

export type PetitionRepliesFieldComments_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<PetitionField, "title" | "type"> & {
    comments: Array<
      {
        __typename?: "PetitionFieldComment";
      } & PetitionRepliesFieldComments_PetitionFieldCommentFragment
    >;
    replies: Array<
      {
        __typename?: "PetitionFieldReply";
      } & PetitionRepliesFieldComments_PetitionFieldReplyFragment
    >;
  };

export type PetitionRepliesFieldComments_PetitionFieldReplyFragment = {
  __typename?: "PetitionFieldReply";
} & Pick<PetitionFieldReply, "id" | "content">;

export type PetitionRepliesFieldComments_PetitionFieldCommentFragment = {
  __typename?: "PetitionFieldComment";
} & MakeOptional<
  Pick<
    PetitionFieldComment,
    "id" | "content" | "publishedAt" | "isUnread" | "isEdited" | "isInternal"
  >,
  "isInternal"
> & {
    author?: Maybe<
      | ({ __typename?: "PetitionAccess" } & {
          contact?: Maybe<
            { __typename?: "Contact" } & ContactLink_ContactFragment
          >;
        })
      | ({ __typename?: "User" } & UserReference_UserFragment)
    >;
  };

export type PetitionRepliesFieldReply_PetitionFieldReplyFragment = {
  __typename?: "PetitionFieldReply";
} & Pick<
  PetitionFieldReply,
  "id" | "content" | "status" | "createdAt" | "metadata"
> & {
    field?: Maybe<
      { __typename?: "PetitionField" } & Pick<PetitionField, "type">
    >;
  };

export type PetitionSignaturesCard_UserFragment = { __typename?: "User" } & {
  organization: { __typename?: "Organization" } & {
    signatureIntegrations: Array<
      {
        __typename?: "OrgIntegration";
      } & SignatureConfigDialog_OrgIntegrationFragment
    >;
  };
};

export type PetitionSignaturesCard_PetitionFragment = {
  __typename?: "Petition";
} & Pick<Petition, "id" | "status"> & {
    signatureConfig?: Maybe<
      { __typename?: "SignatureConfig" } & Pick<SignatureConfig, "timezone"> & {
          contacts: Array<
            Maybe<{ __typename?: "Contact" } & ContactLink_ContactFragment>
          >;
        }
    >;
    signatureRequests?: Maybe<
      Array<
        {
          __typename?: "PetitionSignatureRequest";
        } & PetitionSignaturesCard_PetitionSignatureRequestFragment
      >
    >;
  } & SignatureConfigDialog_PetitionFragment;

export type PetitionSignaturesCard_PetitionSignatureRequestFragment = {
  __typename?: "PetitionSignatureRequest";
} & Pick<PetitionSignatureRequest, "id" | "status"> & {
    signatureConfig: { __typename?: "SignatureConfig" } & {
      contacts: Array<
        Maybe<{ __typename?: "Contact" } & ContactLink_ContactFragment>
      >;
    };
  };

export type PetitionSignaturesCard_updatePetitionSignatureConfigMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  signatureConfig?: Maybe<SignatureConfigInput>;
}>;

export type PetitionSignaturesCard_updatePetitionSignatureConfigMutation = {
  __typename?: "Mutation";
} & {
  updatePetition:
    | ({ __typename?: "Petition" } & PetitionSignaturesCard_PetitionFragment)
    | { __typename?: "PetitionTemplate" };
};

export type PetitionSignaturesCard_cancelSignatureRequestMutationVariables = Exact<{
  petitionSignatureRequestId: Scalars["GID"];
}>;

export type PetitionSignaturesCard_cancelSignatureRequestMutation = {
  __typename?: "Mutation";
} & {
  cancelSignatureRequest: { __typename?: "PetitionSignatureRequest" } & Pick<
    PetitionSignatureRequest,
    "id" | "status"
  >;
};

export type PetitionSignaturesCard_startSignatureRequestMutationVariables = Exact<{
  petitionId: Scalars["GID"];
}>;

export type PetitionSignaturesCard_startSignatureRequestMutation = {
  __typename?: "Mutation";
} & {
  startSignatureRequest: { __typename?: "PetitionSignatureRequest" } & Pick<
    PetitionSignatureRequest,
    "id" | "status"
  >;
};

export type PetitionSignaturesCard_signedPetitionDownloadLinkMutationVariables = Exact<{
  petitionSignatureRequestId: Scalars["GID"];
  preview?: Maybe<Scalars["Boolean"]>;
}>;

export type PetitionSignaturesCard_signedPetitionDownloadLinkMutation = {
  __typename?: "Mutation";
} & {
  signedPetitionDownloadLink: {
    __typename?: "FileUploadReplyDownloadLinkResult";
  } & Pick<FileUploadReplyDownloadLinkResult, "result" | "url">;
};

export type useCompleteSignerInfoDialog_PublicContactFragment = {
  __typename?: "PublicContact";
} & Pick<PublicContact, "firstName" | "lastName" | "email">;

export type RecipientViewContactCard_PublicContactFragment = {
  __typename?: "PublicContact";
} & Pick<PublicContact, "id" | "fullName" | "firstName" | "email">;

export type RecipientViewContactCard_publicDelegateAccessToContactMutationVariables = Exact<{
  keycode: Scalars["ID"];
  email: Scalars["String"];
  firstName: Scalars["String"];
  lastName: Scalars["String"];
  messageBody: Scalars["JSON"];
}>;

export type RecipientViewContactCard_publicDelegateAccessToContactMutation = {
  __typename?: "Mutation";
} & {
  publicDelegateAccessToContact: { __typename?: "PublicPetitionAccess" } & {
    petition?: Maybe<
      { __typename?: "PublicPetition" } & Pick<PublicPetition, "id">
    >;
  };
};

export type RecipientViewContentsCard_PublicUserFragment = {
  __typename?: "PublicUser";
} & Pick<PublicUser, "firstName">;

export type RecipientViewContentsCard_PublicPetitionFragment = {
  __typename?: "PublicPetition";
} & Pick<PublicPetition, "status"> & {
    fields: Array<
      {
        __typename?: "PublicPetitionField";
      } & RecipientViewContentsCard_PublicPetitionFieldFragment
    >;
  };

export type RecipientViewContentsCard_PublicPetitionFieldFragment = {
  __typename?: "PublicPetitionField";
} & Pick<
  PublicPetitionField,
  | "id"
  | "type"
  | "title"
  | "options"
  | "optional"
  | "isReadOnly"
  | "commentCount"
  | "unpublishedCommentCount"
  | "unreadCommentCount"
> & {
    replies: Array<
      { __typename?: "PublicPetitionFieldReply" } & Pick<
        PublicPetitionFieldReply,
        "id"
      >
    >;
  } & useFieldVisibility_PublicPetitionFieldFragment;

export type RecipientViewProgressFooter_PublicPetitionFragment = {
  __typename?: "PublicPetition";
} & Pick<PublicPetition, "status"> & {
    fields: Array<
      {
        __typename?: "PublicPetitionField";
      } & RecipientViewProgressFooter_PublicPetitionFieldFragment
    >;
    signature?: Maybe<
      { __typename?: "PublicSignatureConfig" } & Pick<
        PublicSignatureConfig,
        "review"
      >
    >;
  };

export type RecipientViewProgressFooter_PublicPetitionFieldFragment = {
  __typename?: "PublicPetitionField";
} & Pick<PublicPetitionField, "id" | "type" | "optional" | "isReadOnly"> & {
    replies: Array<
      { __typename?: "PublicPetitionFieldReply" } & Pick<
        PublicPetitionFieldReply,
        "id"
      >
    >;
  } & useFieldVisibility_PublicPetitionFieldFragment;

export type RecipientViewSenderCard_PublicUserFragment = {
  __typename?: "PublicUser";
} & Pick<PublicUser, "id" | "firstName" | "fullName" | "email"> & {
    organization: { __typename?: "PublicOrganization" } & Pick<
      PublicOrganization,
      "name" | "identifier" | "logoUrl"
    >;
  };

export type RecipientViewPetitionField_PublicPetitionAccessFragment = {
  __typename?: "PublicPetitionAccess";
} & RecipientViewPetitionFieldCard_PublicPetitionAccessFragment;

export type RecipientViewPetitionField_PublicPetitionFieldFragment = {
  __typename?: "PublicPetitionField";
} & RecipientViewPetitionFieldCard_PublicPetitionFieldFragment;

export type RecipientViewPetitionFieldCard_PublicPetitionAccessFragment = {
  __typename?: "PublicPetitionAccess";
} & RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccessFragment;

export type RecipientViewPetitionFieldCard_PublicPetitionFieldFragment = {
  __typename?: "PublicPetitionField";
} & Pick<
  PublicPetitionField,
  | "id"
  | "type"
  | "title"
  | "description"
  | "options"
  | "optional"
  | "multiple"
  | "validated"
  | "commentCount"
  | "unpublishedCommentCount"
  | "unreadCommentCount"
> & {
    replies: Array<
      {
        __typename?: "PublicPetitionFieldReply";
      } & RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragment
    >;
  } & RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldFragment;

export type RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragment = {
  __typename?: "PublicPetitionFieldReply";
} & Pick<
  PublicPetitionFieldReply,
  "id" | "status" | "content" | "createdAt" | "updatedAt"
>;

export type RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccessFragment = {
  __typename?: "PublicPetitionAccess";
} & {
  granter?: Maybe<{ __typename?: "PublicUser" } & Pick<PublicUser, "fullName">>;
  contact?: Maybe<{ __typename?: "PublicContact" } & Pick<PublicContact, "id">>;
};

export type RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldFragment = {
  __typename?: "PublicPetitionField";
} & Pick<PublicPetitionField, "id" | "title">;

export type RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragment = {
  __typename?: "PublicPetitionFieldComment";
} & Pick<
  PublicPetitionFieldComment,
  "id" | "content" | "publishedAt" | "isUnread"
> & {
    author?: Maybe<
      | ({ __typename?: "PublicContact" } & Pick<
          PublicContact,
          "id" | "fullName"
        >)
      | ({ __typename?: "PublicUser" } & Pick<PublicUser, "id" | "fullName">)
    >;
  };

export type RecipientViewPetitionFieldCommentsQueryVariables = Exact<{
  keycode: Scalars["ID"];
  petitionFieldId: Scalars["GID"];
}>;

export type RecipientViewPetitionFieldCommentsQuery = {
  __typename?: "Query";
} & {
  petitionFieldComments: Array<
    {
      __typename?: "PublicPetitionFieldComment";
    } & RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragment
  >;
};

export type RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutationVariables = Exact<{
  keycode: Scalars["ID"];
  petitionFieldCommentIds: Array<Scalars["GID"]> | Scalars["GID"];
}>;

export type RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutation = {
  __typename?: "Mutation";
} & {
  publicMarkPetitionFieldCommentsAsRead: Array<
    { __typename?: "PublicPetitionFieldComment" } & Pick<
      PublicPetitionFieldComment,
      "id" | "isUnread"
    >
  >;
};

export type RecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutationVariables = Exact<{
  keycode: Scalars["ID"];
  petitionFieldId: Scalars["GID"];
  content: Scalars["String"];
}>;

export type RecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutation = {
  __typename?: "Mutation";
} & {
  publicCreatePetitionFieldComment: {
    __typename?: "PublicPetitionFieldComment";
  } & RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragment;
};

export type RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutationVariables = Exact<{
  keycode: Scalars["ID"];
  petitionFieldId: Scalars["GID"];
  petitionFieldCommentId: Scalars["GID"];
  content: Scalars["String"];
}>;

export type RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutation = {
  __typename?: "Mutation";
} & {
  publicUpdatePetitionFieldComment: {
    __typename?: "PublicPetitionFieldComment";
  } & RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragment;
};

export type RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutationVariables = Exact<{
  keycode: Scalars["ID"];
  petitionFieldId: Scalars["GID"];
  petitionFieldCommentId: Scalars["GID"];
}>;

export type RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutation = {
  __typename?: "Mutation";
} & Pick<Mutation, "publicDeletePetitionFieldComment">;

export type RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentCountsFragment = {
  __typename?: "PublicPetitionField";
} & Pick<
  PublicPetitionField,
  "commentCount" | "unpublishedCommentCount" | "unreadCommentCount"
>;

export type RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkMutationVariables = Exact<{
  keycode: Scalars["ID"];
  replyId: Scalars["GID"];
  preview?: Maybe<Scalars["Boolean"]>;
}>;

export type RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkMutation = {
  __typename?: "Mutation";
} & {
  publicFileUploadReplyDownloadLink: {
    __typename?: "FileUploadReplyDownloadLinkResult";
  } & Pick<FileUploadReplyDownloadLinkResult, "result" | "url">;
};

export type RecipientViewPetitionFieldMutations_publicDeletePetitionReplyMutationVariables = Exact<{
  replyId: Scalars["GID"];
  keycode: Scalars["ID"];
}>;

export type RecipientViewPetitionFieldMutations_publicDeletePetitionReplyMutation = {
  __typename?: "Mutation";
} & Pick<Mutation, "publicDeletePetitionReply">;

export type RecipientViewPetitionFieldMutations_publicUpdateSimpleReplyMutationVariables = Exact<{
  keycode: Scalars["ID"];
  replyId: Scalars["GID"];
  value: Scalars["String"];
}>;

export type RecipientViewPetitionFieldMutations_publicUpdateSimpleReplyMutation = {
  __typename?: "Mutation";
} & {
  publicUpdateSimpleReply: { __typename?: "PublicPetitionFieldReply" } & Pick<
    PublicPetitionFieldReply,
    "id" | "content" | "status" | "updatedAt"
  >;
};

export type RecipientViewPetitionFieldMutations_publicCreateSimpleReplyMutationVariables = Exact<{
  keycode: Scalars["ID"];
  fieldId: Scalars["GID"];
  value: Scalars["String"];
}>;

export type RecipientViewPetitionFieldMutations_publicCreateSimpleReplyMutation = {
  __typename?: "Mutation";
} & {
  publicCreateSimpleReply: {
    __typename?: "PublicPetitionFieldReply";
  } & RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragment;
};

export type RecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyMutationVariables = Exact<{
  keycode: Scalars["ID"];
  fieldId: Scalars["GID"];
  value:
    | Array<Array<Maybe<Scalars["String"]>> | Maybe<Scalars["String"]>>
    | Array<Maybe<Scalars["String"]>>
    | Maybe<Scalars["String"]>;
}>;

export type RecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyMutation = {
  __typename?: "Mutation";
} & {
  publicCreateDynamicSelectReply: {
    __typename?: "PublicPetitionFieldReply";
  } & RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragment;
};

export type RecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyMutationVariables = Exact<{
  keycode: Scalars["ID"];
  replyId: Scalars["GID"];
  value:
    | Array<Array<Maybe<Scalars["String"]>> | Maybe<Scalars["String"]>>
    | Array<Maybe<Scalars["String"]>>
    | Maybe<Scalars["String"]>;
}>;

export type RecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyMutation = {
  __typename?: "Mutation";
} & {
  publicUpdateDynamicSelectReply: {
    __typename?: "PublicPetitionFieldReply";
  } & Pick<PublicPetitionFieldReply, "id" | "content" | "status" | "updatedAt">;
};

export type RecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutationVariables = Exact<{
  keycode: Scalars["ID"];
  fieldId: Scalars["GID"];
  data: CreateFileUploadReplyInput;
}>;

export type RecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutation = {
  __typename?: "Mutation";
} & {
  publicCreateFileUploadReply: { __typename?: "CreateFileUploadReply" } & Pick<
    CreateFileUploadReply,
    "endpoint"
  > & {
      reply: {
        __typename?: "PublicPetitionFieldReply";
      } & RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragment;
    };
};

export type RecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutationVariables = Exact<{
  keycode: Scalars["ID"];
  replyId: Scalars["GID"];
}>;

export type RecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutation = {
  __typename?: "Mutation";
} & {
  publicFileUploadReplyComplete: {
    __typename?: "PublicPetitionFieldReply";
  } & Pick<PublicPetitionFieldReply, "id" | "content">;
};

export type RecipientViewPetitionFieldMutations_updateFieldReplies_PublicPetitionFieldFragment = {
  __typename?: "PublicPetitionField";
} & {
  replies: Array<
    { __typename?: "PublicPetitionFieldReply" } & Pick<
      PublicPetitionFieldReply,
      "id"
    >
  >;
};

export type RecipientViewPetitionFieldMutations_updateReplyContent_PublicPetitionFieldReplyFragment = {
  __typename?: "PublicPetitionFieldReply";
} & Pick<PublicPetitionFieldReply, "content">;

export type RecipientViewPetitionFieldMutations_updatePetitionStatus_PublicPetitionFragment = {
  __typename?: "PublicPetition";
} & Pick<PublicPetition, "status">;

export type GenerateNewTokenDialog_generateUserAuthTokenMutationVariables = Exact<{
  tokenName: Scalars["String"];
}>;

export type GenerateNewTokenDialog_generateUserAuthTokenMutation = {
  __typename?: "Mutation";
} & {
  generateUserAuthToken: {
    __typename?: "GenerateUserAuthTokenResponse";
  } & Pick<GenerateUserAuthTokenResponse, "apiKey"> & {
      userAuthToken: { __typename?: "UserAuthenticationToken" } & Pick<
        UserAuthenticationToken,
        "id" | "tokenName" | "createdAt" | "lastUsedAt"
      >;
    };
};

export type Admin_UserFragment = {
  __typename?: "User";
} & AppLayout_UserFragment;

export type AdminQueryVariables = Exact<{ [key: string]: never }>;

export type AdminQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & Pick<User, "id"> & Admin_UserFragment;
};

export type AdminOrganizations_OrganizationFragment = {
  __typename?: "Organization";
} & Pick<
  Organization,
  "id" | "_id" | "name" | "identifier" | "status" | "userCount" | "createdAt"
>;

export type AdminOrganizations_UserFragment = {
  __typename?: "User";
} & AppLayout_UserFragment;

export type AdminOrganizationsQueryVariables = Exact<{
  offset: Scalars["Int"];
  limit: Scalars["Int"];
  search?: Maybe<Scalars["String"]>;
  sortBy?: Maybe<
    Array<QueryOrganizations_OrderBy> | QueryOrganizations_OrderBy
  >;
  status?: Maybe<OrganizationStatus>;
}>;

export type AdminOrganizationsQuery = { __typename?: "Query" } & {
  organizations: { __typename?: "OrganizationPagination" } & Pick<
    OrganizationPagination,
    "totalCount"
  > & {
      items: Array<
        {
          __typename?: "Organization";
        } & AdminOrganizations_OrganizationFragment
      >;
    };
};

export type AdminOrganizationsUserQueryVariables = Exact<{
  [key: string]: never;
}>;

export type AdminOrganizationsUserQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & AdminOrganizations_UserFragment;
};

export type AdminSupportMethods_UserFragment = {
  __typename?: "User";
} & AppLayout_UserFragment;

export type AdminSupportMethodsUserQueryVariables = Exact<{
  [key: string]: never;
}>;

export type AdminSupportMethodsUserQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & AdminSupportMethods_UserFragment;
};

export type Contact_ContactFragment = { __typename?: "Contact" } & Pick<
  Contact,
  "id"
> & {
    accesses: { __typename?: "PetitionAccessPagination" } & {
      items: Array<
        { __typename?: "PetitionAccess" } & Contact_PetitionAccessFragment
      >;
    };
  } & Contact_Contact_ProfileFragment;

export type Contact_Contact_ProfileFragment = { __typename?: "Contact" } & Pick<
  Contact,
  "id" | "email" | "fullName" | "firstName" | "lastName"
>;

export type Contact_PetitionAccessFragment = {
  __typename?: "PetitionAccess";
} & Pick<PetitionAccess, "id"> & {
    petition?: Maybe<{ __typename?: "Petition" } & Contact_PetitionFragment>;
  };

export type Contact_PetitionFragment = { __typename?: "Petition" } & Pick<
  Petition,
  "id" | "name" | "createdAt"
> & {
    userPermissions: Array<
      { __typename?: "PetitionUserPermission" } & Pick<
        PetitionUserPermission,
        "permissionType"
      > & {
          user: { __typename?: "User" } & Pick<User, "id"> &
            UserAvatarList_UserFragment;
        }
    >;
  } & PetitionStatusCellContent_PetitionFragment &
  PetitionSignatureCellContent_PetitionFragment;

export type Contact_UserFragment = {
  __typename?: "User";
} & AppLayout_UserFragment &
  PetitionSignatureCellContent_UserFragment;

export type Contact_updateContactMutationVariables = Exact<{
  id: Scalars["GID"];
  data: UpdateContactInput;
}>;

export type Contact_updateContactMutation = { __typename?: "Mutation" } & {
  updateContact: { __typename?: "Contact" } & Contact_Contact_ProfileFragment;
};

export type ContactUserQueryVariables = Exact<{ [key: string]: never }>;

export type ContactUserQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & Contact_UserFragment;
};

export type ContactQueryVariables = Exact<{
  id: Scalars["GID"];
  hasPetitionSignature: Scalars["Boolean"];
}>;

export type ContactQuery = { __typename?: "Query" } & {
  contact?: Maybe<{ __typename?: "Contact" } & Contact_ContactFragment>;
};

export type Contacts_ContactsListFragment = {
  __typename?: "ContactPagination";
} & Pick<ContactPagination, "totalCount"> & {
    items: Array<
      { __typename?: "Contact" } & Pick<
        Contact,
        "id" | "fullName" | "firstName" | "lastName" | "email" | "createdAt"
      >
    >;
  };

export type Contacts_UserFragment = {
  __typename?: "User";
} & AppLayout_UserFragment;

export type Contacts_deleteContactsMutationVariables = Exact<{
  ids: Array<Scalars["GID"]> | Scalars["GID"];
}>;

export type Contacts_deleteContactsMutation = {
  __typename?: "Mutation";
} & Pick<Mutation, "deleteContacts">;

export type ContactsQueryVariables = Exact<{
  offset: Scalars["Int"];
  limit: Scalars["Int"];
  search?: Maybe<Scalars["String"]>;
  sortBy?: Maybe<Array<QueryContacts_OrderBy> | QueryContacts_OrderBy>;
}>;

export type ContactsQuery = { __typename?: "Query" } & {
  contacts: {
    __typename?: "ContactPagination";
  } & Contacts_ContactsListFragment;
};

export type ContactsUserQueryVariables = Exact<{ [key: string]: never }>;

export type ContactsUserQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & Contacts_UserFragment;
};

export type OrganizationBranding_updateOrgLogoMutationVariables = Exact<{
  orgId: Scalars["GID"];
  file: Scalars["Upload"];
}>;

export type OrganizationBranding_updateOrgLogoMutation = {
  __typename?: "Mutation";
} & {
  updateOrganizationLogo: { __typename?: "Organization" } & Pick<
    Organization,
    "id" | "logoUrl"
  >;
};

export type OrganizationBrandingQueryVariables = Exact<{
  [key: string]: never;
}>;

export type OrganizationBrandingQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & {
    organization: { __typename?: "Organization" } & Pick<
      Organization,
      "id" | "logoUrl" | "identifier"
    >;
  } & SettingsLayout_UserFragment;
};

export type OrganizationSettingsQueryVariables = Exact<{
  [key: string]: never;
}>;

export type OrganizationSettingsQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & Pick<User, "id"> & SettingsLayout_UserFragment;
};

export type OrganizationUsers_UserFragment = { __typename?: "User" } & Pick<
  User,
  "id" | "fullName" | "email" | "role" | "createdAt" | "lastActiveAt" | "status"
>;

export type OrganizationUsers_createOrganizationUserMutationVariables = Exact<{
  firstName: Scalars["String"];
  lastName: Scalars["String"];
  email: Scalars["String"];
  role: OrganizationRole;
}>;

export type OrganizationUsers_createOrganizationUserMutation = {
  __typename?: "Mutation";
} & {
  createOrganizationUser: {
    __typename?: "User";
  } & OrganizationUsers_UserFragment;
};

export type OrganizationUsers_updateUserStatusMutationVariables = Exact<{
  userIds: Array<Scalars["GID"]> | Scalars["GID"];
  newStatus: UserStatus;
  transferToUserId?: Maybe<Scalars["GID"]>;
}>;

export type OrganizationUsers_updateUserStatusMutation = {
  __typename?: "Mutation";
} & {
  updateUserStatus: Array<
    { __typename?: "User" } & Pick<User, "id" | "status">
  >;
};

export type OrganizationUsersQueryVariables = Exact<{
  offset: Scalars["Int"];
  limit: Scalars["Int"];
  search?: Maybe<Scalars["String"]>;
  sortBy?: Maybe<Array<OrganizationUsers_OrderBy> | OrganizationUsers_OrderBy>;
}>;

export type OrganizationUsersQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & {
    organization: { __typename?: "Organization" } & Pick<Organization, "id"> & {
        users: { __typename?: "UserPagination" } & Pick<
          UserPagination,
          "totalCount"
        > & {
            items: Array<
              { __typename?: "User" } & OrganizationUsers_UserFragment
            >;
          };
      };
  } & SettingsLayout_UserFragment;
};

export type PetitionActivity_PetitionFragment = {
  __typename?: "Petition";
} & Pick<Petition, "id"> &
  PetitionLayout_PetitionBase_Petition_Fragment &
  PetitionAccessTable_PetitionFragment &
  PetitionActivityTimeline_PetitionFragment &
  ShareButton_PetitionBase_Petition_Fragment;

export type PetitionActivity_UserFragment = {
  __typename?: "User";
} & PetitionLayout_UserFragment;

export type PetitionActivity_updatePetitionMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  data: UpdatePetitionInput;
}>;

export type PetitionActivity_updatePetitionMutation = {
  __typename?: "Mutation";
} & {
  updatePetition:
    | ({ __typename?: "Petition" } & PetitionActivity_PetitionFragment)
    | { __typename?: "PetitionTemplate" };
};

export type PetitionActivity_sendRemindersMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  accessIds: Array<Scalars["GID"]> | Scalars["GID"];
  body?: Maybe<Scalars["JSON"]>;
}>;

export type PetitionActivity_sendRemindersMutation = {
  __typename?: "Mutation";
} & Pick<Mutation, "sendReminders">;

export type PetitionActivity_deactivateAccessesMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  accessIds: Array<Scalars["GID"]> | Scalars["GID"];
}>;

export type PetitionActivity_deactivateAccessesMutation = {
  __typename?: "Mutation";
} & {
  deactivateAccesses: Array<
    { __typename?: "PetitionAccess" } & Pick<PetitionAccess, "id" | "status">
  >;
};

export type PetitionActivity_reactivateAccessesMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  accessIds: Array<Scalars["GID"]> | Scalars["GID"];
}>;

export type PetitionActivity_reactivateAccessesMutation = {
  __typename?: "Mutation";
} & {
  reactivateAccesses: Array<
    { __typename?: "PetitionAccess" } & Pick<PetitionAccess, "id" | "status">
  >;
};

export type PetitionActivity_cancelScheduledMessageMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  messageId: Scalars["GID"];
}>;

export type PetitionActivity_cancelScheduledMessageMutation = {
  __typename?: "Mutation";
} & {
  cancelScheduledMessage?: Maybe<
    { __typename?: "PetitionMessage" } & Pick<PetitionMessage, "id" | "status">
  >;
};

export type PetitionsActivity_sendPetitionMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  contactIds: Array<Scalars["GID"]> | Scalars["GID"];
  subject: Scalars["String"];
  body: Scalars["JSON"];
  remindersConfig?: Maybe<RemindersConfigInput>;
  scheduledAt?: Maybe<Scalars["DateTime"]>;
}>;

export type PetitionsActivity_sendPetitionMutation = {
  __typename?: "Mutation";
} & {
  sendPetition: { __typename?: "SendPetitionResult" } & Pick<
    SendPetitionResult,
    "result"
  >;
};

export type PetitionActivity_switchAutomaticRemindersMutationVariables = Exact<{
  start: Scalars["Boolean"];
  petitionId: Scalars["GID"];
  accessIds: Array<Scalars["GID"]> | Scalars["GID"];
  remindersConfig?: Maybe<RemindersConfigInput>;
}>;

export type PetitionActivity_switchAutomaticRemindersMutation = {
  __typename?: "Mutation";
} & {
  switchAutomaticReminders: Array<
    { __typename?: "PetitionAccess" } & Pick<PetitionAccess, "id">
  >;
};

export type PetitionActivityQueryVariables = Exact<{
  id: Scalars["GID"];
}>;

export type PetitionActivityQuery = { __typename?: "Query" } & {
  petition?: Maybe<
    | ({ __typename?: "Petition" } & PetitionActivity_PetitionFragment)
    | { __typename?: "PetitionTemplate" }
  >;
};

export type PetitionActivityUserQueryVariables = Exact<{
  [key: string]: never;
}>;

export type PetitionActivityUserQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & PetitionActivity_UserFragment;
};

export type PetitionCompose_PetitionBase_Petition_Fragment = {
  __typename?: "Petition";
} & Pick<Petition, "status" | "id"> & {
    fields: Array<
      { __typename?: "PetitionField" } & PetitionCompose_PetitionFieldFragment
    >;
  } & PetitionLayout_PetitionBase_Petition_Fragment &
  AddPetitionAccessDialog_PetitionFragment &
  PetitionSettings_PetitionBase_Petition_Fragment;

export type PetitionCompose_PetitionBase_PetitionTemplate_Fragment = {
  __typename?: "PetitionTemplate";
} & Pick<PetitionTemplate, "id"> & {
    fields: Array<
      { __typename?: "PetitionField" } & PetitionCompose_PetitionFieldFragment
    >;
  } & PetitionLayout_PetitionBase_PetitionTemplate_Fragment &
  PetitionTemplateComposeMessageEditor_PetitionFragment &
  PetitionSettings_PetitionBase_PetitionTemplate_Fragment;

export type PetitionCompose_PetitionBaseFragment =
  | PetitionCompose_PetitionBase_Petition_Fragment
  | PetitionCompose_PetitionBase_PetitionTemplate_Fragment;

export type PetitionCompose_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & PetitionComposeField_PetitionFieldFragment &
  PetitionComposeFieldSettings_PetitionFieldFragment &
  PetitionContents_PetitionFieldFragment;

export type PetitionCompose_UserFragment = {
  __typename?: "User";
} & PetitionLayout_UserFragment &
  PetitionSettings_UserFragment;

export type PetitionCompose_updatePetitionMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  data: UpdatePetitionInput;
  hasPetitionSignature: Scalars["Boolean"];
}>;

export type PetitionCompose_updatePetitionMutation = {
  __typename?: "Mutation";
} & {
  updatePetition:
    | ({
        __typename?: "Petition";
      } & PetitionLayout_PetitionBase_Petition_Fragment &
        PetitionSettings_PetitionBase_Petition_Fragment &
        AddPetitionAccessDialog_PetitionFragment)
    | ({
        __typename?: "PetitionTemplate";
      } & PetitionLayout_PetitionBase_PetitionTemplate_Fragment &
        PetitionSettings_PetitionBase_PetitionTemplate_Fragment &
        PetitionTemplateComposeMessageEditor_PetitionFragment);
};

export type PetitionCompose_updateFieldPositionsMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  fieldIds: Array<Scalars["GID"]> | Scalars["GID"];
}>;

export type PetitionCompose_updateFieldPositionsMutation = {
  __typename?: "Mutation";
} & {
  updateFieldPositions:
    | ({ __typename?: "Petition" } & Pick<Petition, "id"> & {
          fields: Array<
            { __typename?: "PetitionField" } & Pick<PetitionField, "id">
          >;
        } & PetitionLayout_PetitionBase_Petition_Fragment)
    | ({ __typename?: "PetitionTemplate" } & Pick<PetitionTemplate, "id"> & {
          fields: Array<
            { __typename?: "PetitionField" } & Pick<PetitionField, "id">
          >;
        } & PetitionLayout_PetitionBase_PetitionTemplate_Fragment);
};

export type PetitionCompose_createPetitionFieldMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  type: PetitionFieldType;
  position?: Maybe<Scalars["Int"]>;
}>;

export type PetitionCompose_createPetitionFieldMutation = {
  __typename?: "Mutation";
} & {
  createPetitionField:
    | ({ __typename?: "PetitionAndField" } & {
        field: { __typename?: "PetitionField" } & Pick<PetitionField, "id"> &
          PetitionCompose_PetitionFieldFragment;
        petition: { __typename?: "Petition" } & {
          fields: Array<
            { __typename?: "PetitionField" } & Pick<PetitionField, "id">
          >;
        } & PetitionLayout_PetitionBase_Petition_Fragment;
      })
    | ({ __typename?: "PetitionTemplateAndField" } & {
        field: { __typename?: "PetitionField" } & Pick<PetitionField, "id"> &
          PetitionCompose_PetitionFieldFragment;
        petition: { __typename?: "PetitionTemplate" } & {
          fields: Array<
            { __typename?: "PetitionField" } & Pick<PetitionField, "id">
          >;
        } & PetitionLayout_PetitionBase_PetitionTemplate_Fragment;
      });
};

export type PetitionCompose_clonePetitionFieldMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  fieldId: Scalars["GID"];
}>;

export type PetitionCompose_clonePetitionFieldMutation = {
  __typename?: "Mutation";
} & {
  clonePetitionField:
    | ({ __typename?: "PetitionAndField" } & {
        field: { __typename?: "PetitionField" } & Pick<PetitionField, "id"> &
          PetitionCompose_PetitionFieldFragment;
        petition: { __typename?: "Petition" } & {
          fields: Array<
            { __typename?: "PetitionField" } & Pick<PetitionField, "id">
          >;
        } & PetitionLayout_PetitionBase_Petition_Fragment;
      })
    | ({ __typename?: "PetitionTemplateAndField" } & {
        field: { __typename?: "PetitionField" } & Pick<PetitionField, "id"> &
          PetitionCompose_PetitionFieldFragment;
        petition: { __typename?: "PetitionTemplate" } & {
          fields: Array<
            { __typename?: "PetitionField" } & Pick<PetitionField, "id">
          >;
        } & PetitionLayout_PetitionBase_PetitionTemplate_Fragment;
      });
};

export type PetitionCompose_deletePetitionFieldMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  fieldId: Scalars["GID"];
  force?: Maybe<Scalars["Boolean"]>;
}>;

export type PetitionCompose_deletePetitionFieldMutation = {
  __typename?: "Mutation";
} & {
  deletePetitionField:
    | ({ __typename?: "Petition" } & Pick<Petition, "id"> & {
          fields: Array<
            { __typename?: "PetitionField" } & Pick<PetitionField, "id">
          >;
        } & PetitionLayout_PetitionBase_Petition_Fragment)
    | ({ __typename?: "PetitionTemplate" } & Pick<PetitionTemplate, "id"> & {
          fields: Array<
            { __typename?: "PetitionField" } & Pick<PetitionField, "id">
          >;
        } & PetitionLayout_PetitionBase_PetitionTemplate_Fragment);
};

export type PetitionCompose_updatePetitionFieldMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  fieldId: Scalars["GID"];
  data: UpdatePetitionFieldInput;
}>;

export type PetitionCompose_updatePetitionFieldMutation = {
  __typename?: "Mutation";
} & {
  updatePetitionField:
    | ({ __typename?: "PetitionAndField" } & {
        field: { __typename?: "PetitionField" } & Pick<PetitionField, "id"> &
          PetitionCompose_PetitionFieldFragment;
        petition: { __typename?: "Petition" } & Pick<
          Petition,
          "status" | "id" | "updatedAt"
        >;
      })
    | ({ __typename?: "PetitionTemplateAndField" } & {
        field: { __typename?: "PetitionField" } & Pick<PetitionField, "id"> &
          PetitionCompose_PetitionFieldFragment;
        petition: { __typename?: "PetitionTemplate" } & Pick<
          PetitionTemplate,
          "id" | "updatedAt"
        >;
      });
};

export type PetitionCompose_changePetitionFieldTypeMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  fieldId: Scalars["GID"];
  type: PetitionFieldType;
  force?: Maybe<Scalars["Boolean"]>;
}>;

export type PetitionCompose_changePetitionFieldTypeMutation = {
  __typename?: "Mutation";
} & {
  changePetitionFieldType:
    | ({ __typename?: "PetitionAndField" } & {
        field: { __typename?: "PetitionField" } & Pick<PetitionField, "id"> &
          PetitionCompose_PetitionFieldFragment;
        petition: { __typename?: "Petition" } & Pick<
          Petition,
          "id" | "updatedAt"
        >;
      })
    | ({ __typename?: "PetitionTemplateAndField" } & {
        field: { __typename?: "PetitionField" } & Pick<PetitionField, "id"> &
          PetitionCompose_PetitionFieldFragment;
        petition: { __typename?: "PetitionTemplate" } & Pick<
          PetitionTemplate,
          "id" | "updatedAt"
        >;
      });
};

export type PetitionCompose_batchSendPetitionMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  contactIdGroups:
    | Array<Array<Scalars["GID"]> | Scalars["GID"]>
    | Array<Scalars["GID"]>
    | Scalars["GID"];
  subject: Scalars["String"];
  body: Scalars["JSON"];
  remindersConfig?: Maybe<RemindersConfigInput>;
  scheduledAt?: Maybe<Scalars["DateTime"]>;
}>;

export type PetitionCompose_batchSendPetitionMutation = {
  __typename?: "Mutation";
} & {
  batchSendPetition: Array<
    { __typename?: "SendPetitionResult" } & Pick<
      SendPetitionResult,
      "result"
    > & {
        petition?: Maybe<
          { __typename?: "Petition" } & Pick<Petition, "id" | "status">
        >;
      }
  >;
};

export type PetitionComposeUserQueryVariables = Exact<{ [key: string]: never }>;

export type PetitionComposeUserQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & PetitionCompose_UserFragment;
};

export type PetitionComposeQueryVariables = Exact<{
  id: Scalars["GID"];
  hasPetitionSignature: Scalars["Boolean"];
}>;

export type PetitionComposeQuery = { __typename?: "Query" } & {
  petition?: Maybe<
    | ({
        __typename?: "Petition";
      } & PetitionCompose_PetitionBase_Petition_Fragment)
    | ({
        __typename?: "PetitionTemplate";
      } & PetitionCompose_PetitionBase_PetitionTemplate_Fragment)
  >;
};

export type PetitionQueryVariables = Exact<{
  id: Scalars["GID"];
}>;

export type PetitionQuery = { __typename?: "Query" } & {
  petition?: Maybe<
    | ({ __typename?: "Petition" } & Pick<Petition, "status" | "id">)
    | ({ __typename?: "PetitionTemplate" } & Pick<PetitionTemplate, "id">)
  >;
};

export type PetitionReplies_PetitionFragment = {
  __typename?: "Petition";
} & Pick<Petition, "id" | "hasCommentsEnabled"> & {
    fields: Array<
      { __typename?: "PetitionField" } & PetitionReplies_PetitionFieldFragment
    >;
    currentSignatureRequest?: Maybe<
      { __typename?: "PetitionSignatureRequest" } & Pick<
        PetitionSignatureRequest,
        "id" | "status"
      >
    >;
  } & PetitionLayout_PetitionBase_Petition_Fragment &
  ShareButton_PetitionBase_Petition_Fragment &
  PetitionSignaturesCard_PetitionFragment;

export type PetitionReplies_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<PetitionField, "isReadOnly"> &
  PetitionRepliesField_PetitionFieldFragment &
  PetitionContents_PetitionFieldFragment &
  PetitionRepliesFieldComments_PetitionFieldFragment &
  ExportRepliesDialog_PetitionFieldFragment &
  useFieldVisibility_PetitionFieldFragment;

export type PetitionReplies_UserFragment = { __typename?: "User" } & {
  hasPetitionSignature: User["hasFeatureFlag"];
  hasPetitionPdfExport: User["hasFeatureFlag"];
} & PetitionLayout_UserFragment &
  PetitionRepliesFieldComments_UserFragment &
  ExportRepliesDialog_UserFragment &
  PetitionSignaturesCard_UserFragment;

export type PetitionReplies_updatePetitionMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  data: UpdatePetitionInput;
}>;

export type PetitionReplies_updatePetitionMutation = {
  __typename?: "Mutation";
} & {
  updatePetition:
    | ({
        __typename?: "Petition";
      } & PetitionLayout_PetitionBase_Petition_Fragment)
    | ({
        __typename?: "PetitionTemplate";
      } & PetitionLayout_PetitionBase_PetitionTemplate_Fragment);
};

export type PetitionReplies_validatePetitionFieldsMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  fieldIds: Array<Scalars["GID"]> | Scalars["GID"];
  value: Scalars["Boolean"];
  validateRepliesWith?: Maybe<PetitionFieldReplyStatus>;
}>;

export type PetitionReplies_validatePetitionFieldsMutation = {
  __typename?: "Mutation";
} & {
  validatePetitionFields: { __typename?: "PetitionAndPartialFields" } & {
    petition: { __typename?: "Petition" } & Pick<Petition, "id" | "status">;
    fields: Array<
      { __typename?: "PetitionField" } & Pick<
        PetitionField,
        "id" | "validated"
      > & {
          replies: Array<
            { __typename?: "PetitionFieldReply" } & Pick<
              PetitionFieldReply,
              "id" | "status"
            >
          >;
        }
    >;
  };
};

export type PetitionReplies_fileUploadReplyDownloadLinkMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  replyId: Scalars["GID"];
  preview?: Maybe<Scalars["Boolean"]>;
}>;

export type PetitionReplies_fileUploadReplyDownloadLinkMutation = {
  __typename?: "Mutation";
} & {
  fileUploadReplyDownloadLink: {
    __typename?: "FileUploadReplyDownloadLinkResult";
  } & Pick<FileUploadReplyDownloadLinkResult, "result" | "url">;
};

export type PetitionReplies_createPetitionFieldCommentMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  petitionFieldId: Scalars["GID"];
  petitionFieldReplyId?: Maybe<Scalars["GID"]>;
  content: Scalars["String"];
  isInternal?: Maybe<Scalars["Boolean"]>;
  hasInternalComments: Scalars["Boolean"];
}>;

export type PetitionReplies_createPetitionFieldCommentMutation = {
  __typename?: "Mutation";
} & {
  createPetitionFieldComment: {
    __typename?: "PetitionFieldComment";
  } & PetitionRepliesFieldComments_PetitionFieldCommentFragment;
};

export type PetitionReplies_updatePetitionFieldCommentMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  petitionFieldId: Scalars["GID"];
  petitionFieldCommentId: Scalars["GID"];
  content: Scalars["String"];
  hasInternalComments: Scalars["Boolean"];
}>;

export type PetitionReplies_updatePetitionFieldCommentMutation = {
  __typename?: "Mutation";
} & {
  updatePetitionFieldComment: {
    __typename?: "PetitionFieldComment";
  } & PetitionRepliesFieldComments_PetitionFieldCommentFragment;
};

export type PetitionReplies_deletePetitionFieldCommentMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  petitionFieldId: Scalars["GID"];
  petitionFieldCommentId: Scalars["GID"];
}>;

export type PetitionReplies_deletePetitionFieldCommentMutation = {
  __typename?: "Mutation";
} & Pick<Mutation, "deletePetitionFieldComment">;

export type PetitionReplies_submitUnpublishedCommentsMutationVariables = Exact<{
  petitionId: Scalars["GID"];
}>;

export type PetitionReplies_submitUnpublishedCommentsMutation = {
  __typename?: "Mutation";
} & {
  submitUnpublishedComments: Array<
    { __typename?: "PetitionFieldComment" } & Pick<
      PetitionFieldComment,
      "id" | "publishedAt"
    >
  >;
};

export type PetitionReplies_markPetitionFieldCommentsAsReadMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  petitionFieldCommentIds: Array<Scalars["GID"]> | Scalars["GID"];
}>;

export type PetitionReplies_markPetitionFieldCommentsAsReadMutation = {
  __typename?: "Mutation";
} & {
  markPetitionFieldCommentsAsRead: Array<
    { __typename?: "PetitionFieldComment" } & Pick<
      PetitionFieldComment,
      "id" | "isUnread"
    >
  >;
};

export type PetitionReplies_updatePetitionFieldRepliesStatusMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  petitionFieldId: Scalars["GID"];
  petitionFieldReplyIds: Array<Scalars["GID"]> | Scalars["GID"];
  status: PetitionFieldReplyStatus;
}>;

export type PetitionReplies_updatePetitionFieldRepliesStatusMutation = {
  __typename?: "Mutation";
} & {
  updatePetitionFieldRepliesStatus: {
    __typename?: "PetitionWithFieldAndReplies";
  } & {
    petition: { __typename?: "Petition" } & Pick<Petition, "id" | "status">;
    field: { __typename?: "PetitionField" } & Pick<
      PetitionField,
      "id" | "validated"
    >;
    replies: Array<
      { __typename?: "PetitionFieldReply" } & Pick<
        PetitionFieldReply,
        "id" | "status"
      >
    >;
  };
};

export type PetitionReplies_sendPetitionClosedNotificationMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  emailBody: Scalars["JSON"];
  attachPdfExport: Scalars["Boolean"];
  pdfExportTitle?: Maybe<Scalars["String"]>;
  force?: Maybe<Scalars["Boolean"]>;
}>;

export type PetitionReplies_sendPetitionClosedNotificationMutation = {
  __typename?: "Mutation";
} & {
  sendPetitionClosedNotification: { __typename?: "Petition" } & Pick<
    Petition,
    "id"
  >;
};

export type PetitionReplies_createPetitionFieldComment_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & {
  comments: Array<
    {
      __typename?: "PetitionFieldComment";
    } & PetitionRepliesFieldComments_PetitionFieldCommentFragment
  >;
};

export type PetitionReplies_deletePetitionFieldComment_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & {
  comments: Array<
    { __typename?: "PetitionFieldComment" } & Pick<PetitionFieldComment, "id">
  >;
};

export type PetitionRepliesUserQueryVariables = Exact<{ [key: string]: never }>;

export type PetitionRepliesUserQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & PetitionReplies_UserFragment;
};

export type PetitionRepliesQueryVariables = Exact<{
  id: Scalars["GID"];
  hasPetitionSignature: Scalars["Boolean"];
  hasInternalComments: Scalars["Boolean"];
}>;

export type PetitionRepliesQuery = { __typename?: "Query" } & {
  petition?: Maybe<
    | ({ __typename?: "Petition" } & PetitionReplies_PetitionFragment)
    | { __typename?: "PetitionTemplate" }
  >;
};

export type Petitions_PetitionBasePaginationFragment = {
  __typename?: "PetitionBasePagination";
} & Pick<PetitionBasePagination, "totalCount"> & {
    items: Array<
      | ({ __typename?: "Petition" } & Petitions_PetitionBase_Petition_Fragment)
      | ({
          __typename?: "PetitionTemplate";
        } & Petitions_PetitionBase_PetitionTemplate_Fragment)
    >;
  };

export type Petitions_PetitionBase_Petition_Fragment = {
  __typename?: "Petition";
} & usePetitionsTableColumns_PetitionBase_Petition_Fragment;

export type Petitions_PetitionBase_PetitionTemplate_Fragment = {
  __typename?: "PetitionTemplate";
} & usePetitionsTableColumns_PetitionBase_PetitionTemplate_Fragment;

export type Petitions_PetitionBaseFragment =
  | Petitions_PetitionBase_Petition_Fragment
  | Petitions_PetitionBase_PetitionTemplate_Fragment;

export type Petitions_UserFragment = {
  __typename?: "User";
} & AppLayout_UserFragment &
  usePetitionsTableColumns_UserFragment;

export type PetitionsUserQueryVariables = Exact<{ [key: string]: never }>;

export type PetitionsUserQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & Petitions_UserFragment;
};

export type PetitionsQueryVariables = Exact<{
  offset: Scalars["Int"];
  limit: Scalars["Int"];
  search?: Maybe<Scalars["String"]>;
  sortBy?: Maybe<Array<QueryPetitions_OrderBy> | QueryPetitions_OrderBy>;
  status?: Maybe<PetitionStatus>;
  type?: Maybe<PetitionBaseType>;
  hasPetitionSignature: Scalars["Boolean"];
}>;

export type PetitionsQuery = { __typename?: "Query" } & {
  petitions: {
    __typename?: "PetitionBasePagination";
  } & Petitions_PetitionBasePaginationFragment;
};

export type NewPetition_PetitionTemplateFragment = {
  __typename?: "PetitionTemplate";
} & Pick<PetitionTemplate, "id" | "name" | "description" | "locale"> & {
    owner: { __typename?: "User" } & Pick<User, "id" | "fullName">;
  };

export type NewPetition_UserFragment = {
  __typename?: "User";
} & AppLayout_UserFragment;

export type NewPetitionPublicTemplatesQueryVariables = Exact<{
  offset: Scalars["Int"];
  limit: Scalars["Int"];
  search?: Maybe<Scalars["String"]>;
  locale?: Maybe<PetitionLocale>;
}>;

export type NewPetitionPublicTemplatesQuery = { __typename?: "Query" } & {
  publicTemplates: { __typename?: "PetitionTemplatePagination" } & Pick<
    PetitionTemplatePagination,
    "totalCount"
  > & {
      items: Array<
        {
          __typename?: "PetitionTemplate";
        } & NewPetition_PetitionTemplateFragment
      >;
    };
};

export type NewPetitionTemplatesQueryVariables = Exact<{
  offset: Scalars["Int"];
  limit: Scalars["Int"];
  search?: Maybe<Scalars["String"]>;
  locale?: Maybe<PetitionLocale>;
}>;

export type NewPetitionTemplatesQuery = { __typename?: "Query" } & {
  templates: { __typename?: "PetitionBasePagination" } & Pick<
    PetitionBasePagination,
    "totalCount"
  > & {
      items: Array<
        | { __typename?: "Petition" }
        | ({
            __typename?: "PetitionTemplate";
          } & NewPetition_PetitionTemplateFragment)
      >;
    };
  hasTemplates: { __typename?: "PetitionBasePagination" } & Pick<
    PetitionBasePagination,
    "totalCount"
  >;
};

export type NewPetitionUserQueryVariables = Exact<{ [key: string]: never }>;

export type NewPetitionUserQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & NewPetition_UserFragment;
};

export type Account_UserFragment = { __typename?: "User" } & Pick<
  User,
  "firstName" | "lastName"
> &
  SettingsLayout_UserFragment &
  useSettingsSections_UserFragment;

export type Account_updateAccountMutationVariables = Exact<{
  id: Scalars["GID"];
  data: UpdateUserInput;
}>;

export type Account_updateAccountMutation = { __typename?: "Mutation" } & {
  updateUser: { __typename?: "User" } & Pick<
    User,
    "id" | "firstName" | "lastName" | "fullName"
  >;
};

export type AccountQueryVariables = Exact<{ [key: string]: never }>;

export type AccountQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & Pick<User, "id"> & Account_UserFragment;
};

export type Settings_UserFragment = {
  __typename?: "User";
} & SettingsLayout_UserFragment &
  useSettingsSections_UserFragment;

export type SettingsQueryVariables = Exact<{ [key: string]: never }>;

export type SettingsQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & Pick<User, "id"> & Settings_UserFragment;
};

export type Security_updatePasswordMutationVariables = Exact<{
  password: Scalars["String"];
  newPassword: Scalars["String"];
}>;

export type Security_updatePasswordMutation = {
  __typename?: "Mutation";
} & Pick<Mutation, "changePassword">;

export type SecurityQueryVariables = Exact<{ [key: string]: never }>;

export type SecurityQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & SettingsLayout_UserFragment &
    useSettingsSections_UserFragment;
};

export type Tokens_UserAuthenticationTokenFragment = {
  __typename?: "UserAuthenticationToken";
} & Pick<
  UserAuthenticationToken,
  "id" | "tokenName" | "createdAt" | "lastUsedAt"
>;

export type RevokeUserAuthTokenMutationVariables = Exact<{
  authTokenIds: Array<Scalars["GID"]> | Scalars["GID"];
}>;

export type RevokeUserAuthTokenMutation = { __typename?: "Mutation" } & Pick<
  Mutation,
  "revokeUserAuthToken"
>;

export type TokensQueryVariables = Exact<{
  offset: Scalars["Int"];
  limit: Scalars["Int"];
  search?: Maybe<Scalars["String"]>;
  sortBy?: Maybe<
    Array<UserAuthenticationTokens_OrderBy> | UserAuthenticationTokens_OrderBy
  >;
}>;

export type TokensQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & Pick<User, "id"> & {
      authenticationTokens: {
        __typename?: "UserAuthenticationTokenPagination";
      } & Pick<UserAuthenticationTokenPagination, "totalCount"> & {
          items: Array<
            {
              __typename?: "UserAuthenticationToken";
            } & Tokens_UserAuthenticationTokenFragment
          >;
        };
    } & SettingsLayout_UserFragment &
    useSettingsSections_UserFragment;
};

export type CurrentUserQueryVariables = Exact<{ [key: string]: never }>;

export type CurrentUserQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & Login_UserFragment;
};

export type Login_UserFragment = { __typename?: "User" } & Pick<
  User,
  "id" | "fullName" | "email"
>;

export type RecipientView_PublicPetitionAccessFragment = {
  __typename?: "PublicPetitionAccess";
} & {
  petition?: Maybe<
    { __typename?: "PublicPetition" } & RecipientView_PublicPetitionFragment
  >;
  granter?: Maybe<
    { __typename?: "PublicUser" } & RecipientView_PublicUserFragment
  >;
  contact?: Maybe<
    {
      __typename?: "PublicContact";
    } & RecipientViewContactCard_PublicContactFragment &
      useCompleteSignerInfoDialog_PublicContactFragment
  >;
} & RecipientViewPetitionField_PublicPetitionAccessFragment;

export type RecipientView_PublicPetitionFragment = {
  __typename?: "PublicPetition";
} & Pick<
  PublicPetition,
  | "id"
  | "status"
  | "deadline"
  | "hasCommentsEnabled"
  | "isRecipientViewContentsHidden"
  | "signatureStatus"
> & {
    fields: Array<
      {
        __typename?: "PublicPetitionField";
      } & RecipientView_PublicPetitionFieldFragment
    >;
    signature?: Maybe<
      { __typename?: "PublicSignatureConfig" } & {
        signers: Array<
          Maybe<
            {
              __typename?: "PublicContact";
            } & RecipientView_PublicContactFragment
          >
        >;
      }
    >;
  } & RecipientViewContentsCard_PublicPetitionFragment &
  RecipientViewProgressFooter_PublicPetitionFragment;

export type RecipientView_PublicContactFragment = {
  __typename?: "PublicContact";
} & Pick<PublicContact, "id" | "fullName" | "email">;

export type RecipientView_PublicPetitionFieldFragment = {
  __typename?: "PublicPetitionField";
} & Pick<PublicPetitionField, "id"> &
  RecipientViewPetitionField_PublicPetitionFieldFragment &
  RecipientViewContentsCard_PublicPetitionFieldFragment &
  RecipientViewProgressFooter_PublicPetitionFieldFragment;

export type RecipientView_PublicUserFragment = {
  __typename?: "PublicUser";
} & RecipientViewSenderCard_PublicUserFragment &
  RecipientViewContentsCard_PublicUserFragment;

export type RecipientView_publicCompletePetitionMutationVariables = Exact<{
  keycode: Scalars["ID"];
  signer?: Maybe<PublicPetitionSignerData>;
}>;

export type RecipientView_publicCompletePetitionMutation = {
  __typename?: "Mutation";
} & {
  publicCompletePetition: { __typename?: "PublicPetition" } & Pick<
    PublicPetition,
    "id" | "status"
  >;
};

export type RecipientView_submitUnpublishedCommentsMutationVariables = Exact<{
  keycode: Scalars["ID"];
}>;

export type RecipientView_submitUnpublishedCommentsMutation = {
  __typename?: "Mutation";
} & {
  publicSubmitUnpublishedComments: Array<
    { __typename?: "PublicPetitionFieldComment" } & Pick<
      PublicPetitionFieldComment,
      "id" | "publishedAt"
    >
  >;
};

export type PublicPetitionQueryVariables = Exact<{
  keycode: Scalars["ID"];
}>;

export type PublicPetitionQuery = { __typename?: "Query" } & {
  access?: Maybe<
    {
      __typename?: "PublicPetitionAccess";
    } & RecipientView_PublicPetitionAccessFragment
  >;
};

export type RecipientView_verifyPublicAccessMutationVariables = Exact<{
  token: Scalars["ID"];
  keycode: Scalars["ID"];
  ip?: Maybe<Scalars["String"]>;
  userAgent?: Maybe<Scalars["String"]>;
}>;

export type RecipientView_verifyPublicAccessMutation = {
  __typename?: "Mutation";
} & {
  verifyPublicAccess: { __typename?: "PublicAccessVerification" } & Pick<
    PublicAccessVerification,
    | "isAllowed"
    | "cookieName"
    | "cookieValue"
    | "email"
    | "orgName"
    | "orgLogoUrl"
  >;
};

export type publicSendVerificationCodeMutationVariables = Exact<{
  keycode: Scalars["ID"];
}>;

export type publicSendVerificationCodeMutation = { __typename?: "Mutation" } & {
  publicSendVerificationCode: { __typename?: "VerificationCodeRequest" } & Pick<
    VerificationCodeRequest,
    "token" | "remainingAttempts" | "expiresAt"
  >;
};

export type publicCheckVerificationCodeMutationVariables = Exact<{
  keycode: Scalars["ID"];
  token: Scalars["ID"];
  code: Scalars["String"];
}>;

export type publicCheckVerificationCodeMutation = {
  __typename?: "Mutation";
} & {
  publicCheckVerificationCode: { __typename?: "VerificationCodeCheck" } & Pick<
    VerificationCodeCheck,
    "result" | "remainingAttempts"
  >;
};

export type PetitionPdf_PetitionFragment = { __typename?: "Petition" } & Pick<
  Petition,
  "id" | "name"
> & {
    fields: Array<
      { __typename?: "PetitionField" } & PetitionPdf_PetitionFieldFragment
    >;
    organization: { __typename?: "Organization" } & Pick<
      Organization,
      "name" | "logoUrl"
    >;
    currentSignatureRequest?: Maybe<
      { __typename?: "PetitionSignatureRequest" } & {
        signatureConfig: { __typename?: "SignatureConfig" } & Pick<
          SignatureConfig,
          "timezone"
        > & {
            contacts: Array<
              Maybe<
                { __typename?: "Contact" } & Pick<
                  Contact,
                  "id" | "fullName" | "email"
                >
              >
            >;
          };
      }
    >;
  };

export type PetitionPdf_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<
  PetitionField,
  "id" | "type" | "title" | "options" | "description" | "validated"
> & {
    replies: Array<
      { __typename?: "PetitionFieldReply" } & Pick<
        PetitionFieldReply,
        "id" | "content"
      >
    >;
  } & useFieldVisibility_PetitionFieldFragment;

export type PdfViewPetitionQueryVariables = Exact<{
  token: Scalars["String"];
}>;

export type PdfViewPetitionQuery = { __typename?: "Query" } & {
  petitionAuthToken?: Maybe<
    { __typename?: "Petition" } & PetitionPdf_PetitionFragment
  >;
};

export type Thanks_PetitionLogoQueryVariables = Exact<{
  id: Scalars["GID"];
}>;

export type Thanks_PetitionLogoQuery = { __typename?: "Query" } & Pick<
  Query,
  "publicOrgLogoUrl"
>;

export type useFieldVisibility_PublicPetitionFieldFragment = {
  __typename?: "PublicPetitionField";
} & Pick<PublicPetitionField, "id" | "visibility"> & {
    replies: Array<
      { __typename?: "PublicPetitionFieldReply" } & Pick<
        PublicPetitionFieldReply,
        "id" | "content"
      >
    >;
  };

export type useFieldVisibility_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<PetitionField, "id" | "visibility"> & {
    replies: Array<
      { __typename?: "PetitionFieldReply" } & Pick<
        PetitionFieldReply,
        "id" | "content"
      >
    >;
  };

export type filterPetitionFields_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<PetitionField, "id" | "isReadOnly" | "validated"> & {
    comments: Array<
      { __typename?: "PetitionFieldComment" } & Pick<PetitionFieldComment, "id">
    >;
    replies: Array<
      { __typename?: "PetitionFieldReply" } & Pick<PetitionFieldReply, "id">
    >;
  };

export type useClonePetitions_clonePetitionsMutationVariables = Exact<{
  petitionIds: Array<Scalars["GID"]> | Scalars["GID"];
}>;

export type useClonePetitions_clonePetitionsMutation = {
  __typename?: "Mutation";
} & {
  clonePetitions: Array<
    | ({ __typename?: "Petition" } & Pick<Petition, "id">)
    | ({ __typename?: "PetitionTemplate" } & Pick<PetitionTemplate, "id">)
  >;
};

export type useCreateContact_createContactMutationVariables = Exact<{
  data: CreateContactInput;
}>;

export type useCreateContact_createContactMutation = {
  __typename?: "Mutation";
} & {
  createContact: { __typename?: "Contact" } & Pick<
    Contact,
    "id" | "email" | "firstName" | "lastName" | "fullName"
  >;
};

export type useCreatePetition_createPetitionMutationVariables = Exact<{
  name?: Maybe<Scalars["String"]>;
  locale: PetitionLocale;
  petitionId?: Maybe<Scalars["GID"]>;
  type?: Maybe<PetitionBaseType>;
}>;

export type useCreatePetition_createPetitionMutation = {
  __typename?: "Mutation";
} & {
  createPetition:
    | ({ __typename?: "Petition" } & Pick<Petition, "id">)
    | ({ __typename?: "PetitionTemplate" } & Pick<PetitionTemplate, "id">);
};

export type useDeletePetitions_deletePetitionsMutationVariables = Exact<{
  ids: Array<Scalars["GID"]> | Scalars["GID"];
}>;

export type useDeletePetitions_deletePetitionsMutation = {
  __typename?: "Mutation";
} & Pick<Mutation, "deletePetitions">;

export type ConfirmDeletePetitionsDialog_PetitionBase_Petition_Fragment = {
  __typename?: "Petition";
} & Pick<Petition, "id" | "name">;

export type ConfirmDeletePetitionsDialog_PetitionBase_PetitionTemplate_Fragment = {
  __typename?: "PetitionTemplate";
} & Pick<PetitionTemplate, "id" | "name">;

export type ConfirmDeletePetitionsDialog_PetitionBaseFragment =
  | ConfirmDeletePetitionsDialog_PetitionBase_Petition_Fragment
  | ConfirmDeletePetitionsDialog_PetitionBase_PetitionTemplate_Fragment;

export type useFilenamePlaceholdersRename_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<PetitionField, "id" | "type" | "title">;

export type useFilenamePlaceholdersRename_PetitionFieldReplyFragment = {
  __typename?: "PetitionFieldReply";
} & Pick<PetitionFieldReply, "content">;

export type usePetitionsTableColumns_PetitionBase_Petition_Fragment = {
  __typename?: "Petition";
} & Pick<Petition, "id" | "name" | "createdAt"> & {
    accesses: Array<
      { __typename?: "PetitionAccess" } & Pick<PetitionAccess, "status"> & {
          contact?: Maybe<
            { __typename?: "Contact" } & ContactLink_ContactFragment
          >;
        }
    >;
    userPermissions: Array<
      { __typename?: "PetitionUserPermission" } & Pick<
        PetitionUserPermission,
        "permissionType"
      > & {
          user: { __typename?: "User" } & Pick<User, "id"> &
            UserAvatarList_UserFragment;
        }
    >;
  } & PetitionStatusCellContent_PetitionFragment &
  PetitionSignatureCellContent_PetitionFragment;

export type usePetitionsTableColumns_PetitionBase_PetitionTemplate_Fragment = {
  __typename?: "PetitionTemplate";
} & Pick<PetitionTemplate, "description" | "id" | "name" | "createdAt"> & {
    userPermissions: Array<
      { __typename?: "PetitionUserPermission" } & Pick<
        PetitionUserPermission,
        "permissionType"
      > & {
          user: { __typename?: "User" } & Pick<User, "id"> &
            UserAvatarList_UserFragment;
        }
    >;
  };

export type usePetitionsTableColumns_PetitionBaseFragment =
  | usePetitionsTableColumns_PetitionBase_Petition_Fragment
  | usePetitionsTableColumns_PetitionBase_PetitionTemplate_Fragment;

export type usePetitionsTableColumns_UserFragment = {
  __typename?: "User";
} & PetitionSignatureCellContent_UserFragment;

export type PetitionComposeSearchContactsQueryVariables = Exact<{
  search?: Maybe<Scalars["String"]>;
  exclude?: Maybe<Array<Scalars["GID"]> | Scalars["GID"]>;
}>;

export type PetitionComposeSearchContactsQuery = { __typename?: "Query" } & {
  contacts: { __typename?: "ContactPagination" } & {
    items: Array<{ __typename?: "Contact" } & ContactSelect_ContactFragment>;
  };
};

export type SearchUsersQueryVariables = Exact<{
  search: Scalars["String"];
  exclude: Array<Scalars["GID"]> | Scalars["GID"];
}>;

export type SearchUsersQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & {
    organization: { __typename?: "Organization" } & {
      users: { __typename?: "UserPagination" } & {
        items: Array<
          { __typename?: "User" } & Pick<User, "id" | "fullName" | "email">
        >;
      };
    };
  };
};

export type useSettingsSections_UserFragment = { __typename?: "User" } & {
  hasApiTokens: User["hasFeatureFlag"];
};

export const PetitionTemplateHeader_UserFragmentDoc = gql`
  fragment PetitionTemplateHeader_User on User {
    id
  }
`;
export const UserSelect_UserFragmentDoc = gql`
  fragment UserSelect_User on User {
    id
    fullName
    email
  }
`;
export const PetitionSharingModal_UserFragmentDoc = gql`
  fragment PetitionSharingModal_User on User {
    id
    email
    fullName
    ...UserSelect_User
  }
  ${UserSelect_UserFragmentDoc}
`;
export const PetitionSharingModal_PetitionFragmentDoc = gql`
  fragment PetitionSharingModal_Petition on PetitionBase {
    id
    name
    userPermissions {
      permissionType
      user {
        id
        ...PetitionSharingModal_User
      }
    }
  }
  ${PetitionSharingModal_UserFragmentDoc}
`;
export const TemplateDetailsDialog_PetitionTemplateFragmentDoc = gql`
  fragment TemplateDetailsDialog_PetitionTemplate on PetitionTemplate {
    id
    description
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
      fullName
    }
    userPermissions {
      permissionType
      user {
        id
      }
    }
    updatedAt
  }
`;
export const SelectTypeFieldOptions_PetitionFieldFragmentDoc = gql`
  fragment SelectTypeFieldOptions_PetitionField on PetitionField {
    id
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
  ${PetitionFieldSelect_PetitionFieldFragmentDoc}
`;
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
    ...SelectTypeFieldOptions_PetitionField
    ...PetitionFieldVisibilityEditor_PetitionField
  }
  ${SelectTypeFieldOptions_PetitionFieldFragmentDoc}
  ${PetitionFieldVisibilityEditor_PetitionFieldFragmentDoc}
`;
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
  ${ReferencedFieldDialogDialog_PetitionFieldFragmentDoc}
`;
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
  ${useFilenamePlaceholdersRename_PetitionFieldReplyFragmentDoc}
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
    publishedAt
    isUnread
  }
`;
export const RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentCountsFragmentDoc = gql`
  fragment RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentCounts on PublicPetitionField {
    commentCount
    unpublishedCommentCount
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
  ${UserMenu_UserFragmentDoc}
`;
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
  ${OnboardingTour_UserFragmentDoc}
`;
export const Admin_UserFragmentDoc = gql`
  fragment Admin_User on User {
    ...AppLayout_User
  }
  ${AppLayout_UserFragmentDoc}
`;
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
  ${AppLayout_UserFragmentDoc}
`;
export const AdminSupportMethods_UserFragmentDoc = gql`
  fragment AdminSupportMethods_User on User {
    ...AppLayout_User
  }
  ${AppLayout_UserFragmentDoc}
`;
export const Contact_Contact_ProfileFragmentDoc = gql`
  fragment Contact_Contact_Profile on Contact {
    id
    email
    fullName
    firstName
    lastName
  }
`;
export const UserAvatarList_UserFragmentDoc = gql`
  fragment UserAvatarList_User on User {
    id
    fullName
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
export const PetitionSignatureCellContent_PetitionFragmentDoc = gql`
  fragment PetitionSignatureCellContent_Petition on Petition {
    currentSignatureRequest @include(if: $hasPetitionSignature) {
      status
    }
  }
`;
export const Contact_PetitionFragmentDoc = gql`
  fragment Contact_Petition on Petition {
    id
    name
    createdAt
    userPermissions {
      permissionType
      user {
        id
        ...UserAvatarList_User
      }
    }
    ...PetitionStatusCellContent_Petition
    ...PetitionSignatureCellContent_Petition
  }
  ${UserAvatarList_UserFragmentDoc}
  ${PetitionStatusCellContent_PetitionFragmentDoc}
  ${PetitionSignatureCellContent_PetitionFragmentDoc}
`;
export const Contact_PetitionAccessFragmentDoc = gql`
  fragment Contact_PetitionAccess on PetitionAccess {
    id
    petition {
      ...Contact_Petition
    }
  }
  ${Contact_PetitionFragmentDoc}
`;
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
  ${Contact_PetitionAccessFragmentDoc}
`;
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
  ${PetitionSignatureCellContent_UserFragmentDoc}
`;
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
  ${AppLayout_UserFragmentDoc}
`;
export const OrganizationUsers_UserFragmentDoc = gql`
  fragment OrganizationUsers_User on User {
    id
    fullName
    email
    role
    createdAt
    lastActiveAt
    status
  }
`;
export const HeaderNameEditable_PetitionBaseFragmentDoc = gql`
  fragment HeaderNameEditable_PetitionBase on PetitionBase {
    name
    updatedAt
  }
`;
export const PetitionHeader_PetitionFragmentDoc = gql`
  fragment PetitionHeader_Petition on Petition {
    id
    locale
    deadline
    status
    userPermissions {
      isSubscribed
      user {
        id
      }
    }
    ...HeaderNameEditable_PetitionBase
  }
  ${HeaderNameEditable_PetitionBaseFragmentDoc}
`;
export const PetitionTemplateHeader_PetitionTemplateFragmentDoc = gql`
  fragment PetitionTemplateHeader_PetitionTemplate on PetitionTemplate {
    id
    locale
    ...HeaderNameEditable_PetitionBase
  }
  ${HeaderNameEditable_PetitionBaseFragmentDoc}
`;
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
`;
export const ContactLink_ContactFragmentDoc = gql`
  fragment ContactLink_Contact on Contact {
    id
    fullName
    email
  }
`;
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
    remindersConfig {
      ...PetitionAccessTable_PetitionAccessRemindersConfig
    }
    createdAt
  }
  ${ContactLink_ContactFragmentDoc}
  ${PetitionAccessTable_PetitionAccessRemindersConfigFragmentDoc}
`;
export const PetitionAccessTable_PetitionFragmentDoc = gql`
  fragment PetitionAccessTable_Petition on Petition {
    status
    accesses {
      ...PetitionAccessTable_PetitionAccess
    }
  }
  ${PetitionAccessTable_PetitionAccessFragmentDoc}
`;
export const UserReference_UserFragmentDoc = gql`
  fragment UserReference_User on User {
    id
    fullName
    status
  }
`;
export const TimelinePetitionCreatedEvent_PetitionCreatedEventFragmentDoc = gql`
  fragment TimelinePetitionCreatedEvent_PetitionCreatedEvent on PetitionCreatedEvent {
    user {
      ...UserReference_User
    }
    createdAt
  }
  ${UserReference_UserFragmentDoc}
`;
export const TimelinePetitionCompletedEvent_PetitionCompletedEventFragmentDoc = gql`
  fragment TimelinePetitionCompletedEvent_PetitionCompletedEvent on PetitionCompletedEvent {
    access {
      contact {
        ...ContactLink_Contact
      }
    }
    createdAt
  }
  ${ContactLink_ContactFragmentDoc}
`;
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
  ${ContactLink_ContactFragmentDoc}
`;
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
  ${ContactLink_ContactFragmentDoc}
`;
export const TimelineAccessOpenedEvent_AccessOpenedEventFragmentDoc = gql`
  fragment TimelineAccessOpenedEvent_AccessOpenedEvent on AccessOpenedEvent {
    access {
      contact {
        ...ContactLink_Contact
      }
    }
    createdAt
  }
  ${ContactLink_ContactFragmentDoc}
`;
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
  ${ContactLink_ContactFragmentDoc}
`;
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
  ${SentPetitionMessageDialog_PetitionMessageFragmentDoc}
`;
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
  ${UserReference_UserFragmentDoc}
`;
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
  ${SentPetitionMessageDialog_PetitionMessageFragmentDoc}
`;
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
  ${ContactLink_ContactFragmentDoc}
`;
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
  ${SentReminderMessageDialog_PetitionReminderFragmentDoc}
`;
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
  ${ContactLink_ContactFragmentDoc}
`;
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
  ${ContactLink_ContactFragmentDoc}
`;
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
  ${ContactLink_ContactFragmentDoc}
`;
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
  ${ContactLink_ContactFragmentDoc}
`;
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
  ${ContactLink_ContactFragmentDoc}
`;
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
`;
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
`;
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
`;
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
`;
export const TimelinePetitionClosedEvent_PetitionClosedEventFragmentDoc = gql`
  fragment TimelinePetitionClosedEvent_PetitionClosedEvent on PetitionClosedEvent {
    user {
      ...UserReference_User
    }
    createdAt
  }
  ${UserReference_UserFragmentDoc}
`;
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
  ${ContactLink_ContactFragmentDoc}
`;
export const TimelinePetitionReopenedEvent_PetitionReopenedEventFragmentDoc = gql`
  fragment TimelinePetitionReopenedEvent_PetitionReopenedEvent on PetitionReopenedEvent {
    user {
      ...UserReference_User
    }
    createdAt
  }
  ${UserReference_UserFragmentDoc}
`;
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
  ${ContactLink_ContactFragmentDoc}
`;
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
`;
export const PetitionActivityTimeline_PetitionFragmentDoc = gql`
  fragment PetitionActivityTimeline_Petition on Petition {
    events(limit: 1000) {
      items {
        ...PetitionActivityTimeline_PetitionEvent
      }
    }
  }
  ${PetitionActivityTimeline_PetitionEventFragmentDoc}
`;
export const ShareButton_PetitionBaseFragmentDoc = gql`
  fragment ShareButton_PetitionBase on PetitionBase {
    userPermissions {
      user {
        id
        fullName
      }
    }
  }
`;
export const PetitionActivity_PetitionFragmentDoc = gql`
  fragment PetitionActivity_Petition on Petition {
    id
    ...PetitionLayout_PetitionBase
    ...PetitionAccessTable_Petition
    ...PetitionActivityTimeline_Petition
    ...ShareButton_PetitionBase
  }
  ${PetitionLayout_PetitionBaseFragmentDoc}
  ${PetitionAccessTable_PetitionFragmentDoc}
  ${PetitionActivityTimeline_PetitionFragmentDoc}
  ${ShareButton_PetitionBaseFragmentDoc}
`;
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
  ${PetitionHeader_UserFragmentDoc}
`;
export const PetitionActivity_UserFragmentDoc = gql`
  fragment PetitionActivity_User on User {
    ...PetitionLayout_User
  }
  ${PetitionLayout_UserFragmentDoc}
`;
export const AddPetitionAccessDialog_PetitionFragmentDoc = gql`
  fragment AddPetitionAccessDialog_Petition on Petition {
    emailSubject
    emailBody
    remindersConfig {
      offset
      time
      timezone
      weekdaysOnly
    }
  }
`;
export const PetitionTemplateComposeMessageEditor_PetitionFragmentDoc = gql`
  fragment PetitionTemplateComposeMessageEditor_Petition on PetitionTemplate {
    id
    emailSubject
    emailBody
    description
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
  }
  ${ContactSelect_ContactFragmentDoc}
`;
export const PetitionSettings_PetitionBaseFragmentDoc = gql`
  fragment PetitionSettings_PetitionBase on PetitionBase {
    id
    locale
    hasCommentsEnabled
    skipForwardSecurity
    isRecipientViewContentsHidden
    ... on Petition {
      status
      deadline
      ...SignatureConfigDialog_Petition @include(if: $hasPetitionSignature)
      currentSignatureRequest @include(if: $hasPetitionSignature) {
        id
        status
      }
    }
  }
  ${SignatureConfigDialog_PetitionFragmentDoc}
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
  ${filterPetitionFields_PetitionFieldFragmentDoc}
`;
export const PetitionCompose_PetitionFieldFragmentDoc = gql`
  fragment PetitionCompose_PetitionField on PetitionField {
    ...PetitionComposeField_PetitionField
    ...PetitionComposeFieldSettings_PetitionField
    ...PetitionContents_PetitionField
  }
  ${PetitionComposeField_PetitionFieldFragmentDoc}
  ${PetitionComposeFieldSettings_PetitionFieldFragmentDoc}
  ${PetitionContents_PetitionFieldFragmentDoc}
`;
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
  }
  ${PetitionLayout_PetitionBaseFragmentDoc}
  ${AddPetitionAccessDialog_PetitionFragmentDoc}
  ${PetitionTemplateComposeMessageEditor_PetitionFragmentDoc}
  ${PetitionSettings_PetitionBaseFragmentDoc}
  ${PetitionCompose_PetitionFieldFragmentDoc}
`;
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
  ${SignatureConfigDialog_OrgIntegrationFragmentDoc}
`;
export const PetitionCompose_UserFragmentDoc = gql`
  fragment PetitionCompose_User on User {
    ...PetitionLayout_User
    ...PetitionSettings_User
  }
  ${PetitionLayout_UserFragmentDoc}
  ${PetitionSettings_UserFragmentDoc}
`;
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
  ${PetitionRepliesFieldReply_PetitionFieldReplyFragmentDoc}
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
      publishedAt
    }
  }
  ${PetitionRepliesField_PetitionFieldReplyFragmentDoc}
`;
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
    publishedAt
    isUnread
    isEdited
    isInternal @include(if: $hasInternalComments)
  }
  ${UserReference_UserFragmentDoc}
  ${ContactLink_ContactFragmentDoc}
`;
export const PetitionRepliesFieldComments_PetitionFieldReplyFragmentDoc = gql`
  fragment PetitionRepliesFieldComments_PetitionFieldReply on PetitionFieldReply {
    id
    content
  }
`;
export const PetitionRepliesFieldComments_PetitionFieldFragmentDoc = gql`
  fragment PetitionRepliesFieldComments_PetitionField on PetitionField {
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
  ${PetitionRepliesFieldComments_PetitionFieldReplyFragmentDoc}
`;
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
`;
export const useFieldVisibility_PetitionFieldFragmentDoc = gql`
  fragment useFieldVisibility_PetitionField on PetitionField {
    id
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
  ${useFieldVisibility_PetitionFieldFragmentDoc}
`;
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
  ${ContactLink_ContactFragmentDoc}
`;
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
  ${SignatureConfigDialog_PetitionFragmentDoc}
`;
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
  }
  ${PetitionLayout_PetitionBaseFragmentDoc}
  ${PetitionReplies_PetitionFieldFragmentDoc}
  ${ShareButton_PetitionBaseFragmentDoc}
  ${PetitionSignaturesCard_PetitionFragmentDoc}
`;
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
  ${SignatureConfigDialog_OrgIntegrationFragmentDoc}
`;
export const PetitionReplies_UserFragmentDoc = gql`
  fragment PetitionReplies_User on User {
    hasPetitionSignature: hasFeatureFlag(featureFlag: PETITION_SIGNATURE)
    hasPetitionPdfExport: hasFeatureFlag(featureFlag: PETITION_PDF_EXPORT)
    ...PetitionLayout_User
    ...PetitionRepliesFieldComments_User
    ...ExportRepliesDialog_User
    ...PetitionSignaturesCard_User
  }
  ${PetitionLayout_UserFragmentDoc}
  ${PetitionRepliesFieldComments_UserFragmentDoc}
  ${ExportRepliesDialog_UserFragmentDoc}
  ${PetitionSignaturesCard_UserFragmentDoc}
`;
export const PetitionReplies_createPetitionFieldComment_PetitionFieldFragmentDoc = gql`
  fragment PetitionReplies_createPetitionFieldComment_PetitionField on PetitionField {
    comments {
      ...PetitionRepliesFieldComments_PetitionFieldComment
    }
  }
  ${PetitionRepliesFieldComments_PetitionFieldCommentFragmentDoc}
`;
export const PetitionReplies_deletePetitionFieldComment_PetitionFieldFragmentDoc = gql`
  fragment PetitionReplies_deletePetitionFieldComment_PetitionField on PetitionField {
    comments {
      id
    }
  }
`;
export const usePetitionsTableColumns_PetitionBaseFragmentDoc = gql`
  fragment usePetitionsTableColumns_PetitionBase on PetitionBase {
    id
    name
    createdAt
    userPermissions {
      permissionType
      user {
        id
        ...UserAvatarList_User
      }
    }
    ... on Petition {
      accesses {
        status
        contact {
          ...ContactLink_Contact
        }
      }
      ...PetitionStatusCellContent_Petition
      ...PetitionSignatureCellContent_Petition
    }
    ... on PetitionTemplate {
      description
    }
  }
  ${UserAvatarList_UserFragmentDoc}
  ${ContactLink_ContactFragmentDoc}
  ${PetitionStatusCellContent_PetitionFragmentDoc}
  ${PetitionSignatureCellContent_PetitionFragmentDoc}
`;
export const Petitions_PetitionBaseFragmentDoc = gql`
  fragment Petitions_PetitionBase on PetitionBase {
    ...usePetitionsTableColumns_PetitionBase
  }
  ${usePetitionsTableColumns_PetitionBaseFragmentDoc}
`;
export const Petitions_PetitionBasePaginationFragmentDoc = gql`
  fragment Petitions_PetitionBasePagination on PetitionBasePagination {
    items {
      ...Petitions_PetitionBase
    }
    totalCount
  }
  ${Petitions_PetitionBaseFragmentDoc}
`;
export const usePetitionsTableColumns_UserFragmentDoc = gql`
  fragment usePetitionsTableColumns_User on User {
    ...PetitionSignatureCellContent_User
  }
  ${PetitionSignatureCellContent_UserFragmentDoc}
`;
export const Petitions_UserFragmentDoc = gql`
  fragment Petitions_User on User {
    ...AppLayout_User
    ...usePetitionsTableColumns_User
  }
  ${AppLayout_UserFragmentDoc}
  ${usePetitionsTableColumns_UserFragmentDoc}
`;
export const NewPetition_PetitionTemplateFragmentDoc = gql`
  fragment NewPetition_PetitionTemplate on PetitionTemplate {
    id
    name
    description
    locale
    owner {
      id
      fullName
    }
  }
`;
export const NewPetition_UserFragmentDoc = gql`
  fragment NewPetition_User on User {
    ...AppLayout_User
  }
  ${AppLayout_UserFragmentDoc}
`;
export const SettingsLayout_UserFragmentDoc = gql`
  fragment SettingsLayout_User on User {
    ...AppLayout_User
  }
  ${AppLayout_UserFragmentDoc}
`;
export const useSettingsSections_UserFragmentDoc = gql`
  fragment useSettingsSections_User on User {
    hasApiTokens: hasFeatureFlag(featureFlag: API_TOKENS)
  }
`;
export const Account_UserFragmentDoc = gql`
  fragment Account_User on User {
    firstName
    lastName
    ...SettingsLayout_User
    ...useSettingsSections_User
  }
  ${SettingsLayout_UserFragmentDoc}
  ${useSettingsSections_UserFragmentDoc}
`;
export const Settings_UserFragmentDoc = gql`
  fragment Settings_User on User {
    ...SettingsLayout_User
    ...useSettingsSections_User
  }
  ${SettingsLayout_UserFragmentDoc}
  ${useSettingsSections_UserFragmentDoc}
`;
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
    commentCount
    unpublishedCommentCount
    unreadCommentCount
    ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionField
  }
  ${RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragmentDoc}
  ${RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldFragmentDoc}
`;
export const RecipientViewPetitionField_PublicPetitionFieldFragmentDoc = gql`
  fragment RecipientViewPetitionField_PublicPetitionField on PublicPetitionField {
    ...RecipientViewPetitionFieldCard_PublicPetitionField
  }
  ${RecipientViewPetitionFieldCard_PublicPetitionFieldFragmentDoc}
`;
export const useFieldVisibility_PublicPetitionFieldFragmentDoc = gql`
  fragment useFieldVisibility_PublicPetitionField on PublicPetitionField {
    id
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
    unpublishedCommentCount
    unreadCommentCount
    ...useFieldVisibility_PublicPetitionField
  }
  ${useFieldVisibility_PublicPetitionFieldFragmentDoc}
`;
export const RecipientViewProgressFooter_PublicPetitionFieldFragmentDoc = gql`
  fragment RecipientViewProgressFooter_PublicPetitionField on PublicPetitionField {
    id
    type
    optional
    isReadOnly
    replies {
      id
    }
    ...useFieldVisibility_PublicPetitionField
  }
  ${useFieldVisibility_PublicPetitionFieldFragmentDoc}
`;
export const RecipientView_PublicPetitionFieldFragmentDoc = gql`
  fragment RecipientView_PublicPetitionField on PublicPetitionField {
    id
    ...RecipientViewPetitionField_PublicPetitionField
    ...RecipientViewContentsCard_PublicPetitionField
    ...RecipientViewProgressFooter_PublicPetitionField
  }
  ${RecipientViewPetitionField_PublicPetitionFieldFragmentDoc}
  ${RecipientViewContentsCard_PublicPetitionFieldFragmentDoc}
  ${RecipientViewProgressFooter_PublicPetitionFieldFragmentDoc}
`;
export const RecipientView_PublicContactFragmentDoc = gql`
  fragment RecipientView_PublicContact on PublicContact {
    id
    fullName
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
  ${RecipientViewContentsCard_PublicPetitionFieldFragmentDoc}
`;
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
  ${RecipientViewProgressFooter_PublicPetitionFieldFragmentDoc}
`;
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
    signatureStatus
    ...RecipientViewContentsCard_PublicPetition
    ...RecipientViewProgressFooter_PublicPetition
  }
  ${RecipientView_PublicPetitionFieldFragmentDoc}
  ${RecipientView_PublicContactFragmentDoc}
  ${RecipientViewContentsCard_PublicPetitionFragmentDoc}
  ${RecipientViewProgressFooter_PublicPetitionFragmentDoc}
`;
export const RecipientViewSenderCard_PublicUserFragmentDoc = gql`
  fragment RecipientViewSenderCard_PublicUser on PublicUser {
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
    ...RecipientViewSenderCard_PublicUser
    ...RecipientViewContentsCard_PublicUser
  }
  ${RecipientViewSenderCard_PublicUserFragmentDoc}
  ${RecipientViewContentsCard_PublicUserFragmentDoc}
`;
export const RecipientViewContactCard_PublicContactFragmentDoc = gql`
  fragment RecipientViewContactCard_PublicContact on PublicContact {
    id
    fullName
    firstName
    email
  }
`;
export const useCompleteSignerInfoDialog_PublicContactFragmentDoc = gql`
  fragment useCompleteSignerInfoDialog_PublicContact on PublicContact {
    firstName
    lastName
    email
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
  ${RecipientViewPetitionFieldCommentsDialog_PublicPetitionAccessFragmentDoc}
`;
export const RecipientViewPetitionField_PublicPetitionAccessFragmentDoc = gql`
  fragment RecipientViewPetitionField_PublicPetitionAccess on PublicPetitionAccess {
    ...RecipientViewPetitionFieldCard_PublicPetitionAccess
  }
  ${RecipientViewPetitionFieldCard_PublicPetitionAccessFragmentDoc}
`;
export const RecipientView_PublicPetitionAccessFragmentDoc = gql`
  fragment RecipientView_PublicPetitionAccess on PublicPetitionAccess {
    petition {
      ...RecipientView_PublicPetition
    }
    granter {
      ...RecipientView_PublicUser
    }
    contact {
      ...RecipientViewContactCard_PublicContact
      ...useCompleteSignerInfoDialog_PublicContact
    }
    ...RecipientViewPetitionField_PublicPetitionAccess
  }
  ${RecipientView_PublicPetitionFragmentDoc}
  ${RecipientView_PublicUserFragmentDoc}
  ${RecipientViewContactCard_PublicContactFragmentDoc}
  ${useCompleteSignerInfoDialog_PublicContactFragmentDoc}
  ${RecipientViewPetitionField_PublicPetitionAccessFragmentDoc}
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
  ${useFieldVisibility_PetitionFieldFragmentDoc}
`;
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
  ${PetitionPdf_PetitionFieldFragmentDoc}
`;
export const ConfirmDeletePetitionsDialog_PetitionBaseFragmentDoc = gql`
  fragment ConfirmDeletePetitionsDialog_PetitionBase on PetitionBase {
    id
    name
  }
`;
export const WithAdminOrganizationRoleDocument = gql`
  query WithAdminOrganizationRole {
    me {
      role
    }
  }
`;

/**
 * __useWithAdminOrganizationRoleQuery__
 *
 * To run a query within a React component, call `useWithAdminOrganizationRoleQuery` and pass it any options that fit your needs.
 * When your component renders, `useWithAdminOrganizationRoleQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useWithAdminOrganizationRoleQuery({
 *   variables: {
 *   },
 * });
 */
export function useWithAdminOrganizationRoleQuery(
  baseOptions?: Apollo.QueryHookOptions<
    WithAdminOrganizationRoleQuery,
    WithAdminOrganizationRoleQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    WithAdminOrganizationRoleQuery,
    WithAdminOrganizationRoleQueryVariables
  >(WithAdminOrganizationRoleDocument, options);
}
export function useWithAdminOrganizationRoleLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    WithAdminOrganizationRoleQuery,
    WithAdminOrganizationRoleQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    WithAdminOrganizationRoleQuery,
    WithAdminOrganizationRoleQueryVariables
  >(WithAdminOrganizationRoleDocument, options);
}
export type WithAdminOrganizationRoleQueryHookResult = ReturnType<
  typeof useWithAdminOrganizationRoleQuery
>;
export type WithAdminOrganizationRoleLazyQueryHookResult = ReturnType<
  typeof useWithAdminOrganizationRoleLazyQuery
>;
export const HasFeatureFlagDocument = gql`
  query HasFeatureFlag($featureFlag: FeatureFlag!) {
    me {
      id
      hasFeatureFlag: hasFeatureFlag(featureFlag: $featureFlag)
    }
  }
`;

/**
 * __useHasFeatureFlagQuery__
 *
 * To run a query within a React component, call `useHasFeatureFlagQuery` and pass it any options that fit your needs.
 * When your component renders, `useHasFeatureFlagQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHasFeatureFlagQuery({
 *   variables: {
 *      featureFlag: // value for 'featureFlag'
 *   },
 * });
 */
export function useHasFeatureFlagQuery(
  baseOptions: Apollo.QueryHookOptions<
    HasFeatureFlagQuery,
    HasFeatureFlagQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<HasFeatureFlagQuery, HasFeatureFlagQueryVariables>(
    HasFeatureFlagDocument,
    options
  );
}
export function useHasFeatureFlagLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    HasFeatureFlagQuery,
    HasFeatureFlagQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<HasFeatureFlagQuery, HasFeatureFlagQueryVariables>(
    HasFeatureFlagDocument,
    options
  );
}
export type HasFeatureFlagQueryHookResult = ReturnType<
  typeof useHasFeatureFlagQuery
>;
export type HasFeatureFlagLazyQueryHookResult = ReturnType<
  typeof useHasFeatureFlagLazyQuery
>;
export const WithSuperAdminAccessDocument = gql`
  query WithSuperAdminAccess {
    me {
      isSuperAdmin
    }
  }
`;

/**
 * __useWithSuperAdminAccessQuery__
 *
 * To run a query within a React component, call `useWithSuperAdminAccessQuery` and pass it any options that fit your needs.
 * When your component renders, `useWithSuperAdminAccessQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useWithSuperAdminAccessQuery({
 *   variables: {
 *   },
 * });
 */
export function useWithSuperAdminAccessQuery(
  baseOptions?: Apollo.QueryHookOptions<
    WithSuperAdminAccessQuery,
    WithSuperAdminAccessQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    WithSuperAdminAccessQuery,
    WithSuperAdminAccessQueryVariables
  >(WithSuperAdminAccessDocument, options);
}
export function useWithSuperAdminAccessLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    WithSuperAdminAccessQuery,
    WithSuperAdminAccessQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    WithSuperAdminAccessQuery,
    WithSuperAdminAccessQueryVariables
  >(WithSuperAdminAccessDocument, options);
}
export type WithSuperAdminAccessQueryHookResult = ReturnType<
  typeof useWithSuperAdminAccessQuery
>;
export type WithSuperAdminAccessLazyQueryHookResult = ReturnType<
  typeof useWithSuperAdminAccessLazyQuery
>;
export const AppLayout_updateOnboardingStatusDocument = gql`
  mutation AppLayout_updateOnboardingStatus(
    $key: OnboardingKey!
    $status: OnboardingStatus!
  ) {
    updateOnboardingStatus(key: $key, status: $status) {
      id
      onboardingStatus
    }
  }
`;

/**
 * __useAppLayout_updateOnboardingStatusMutation__
 *
 * To run a mutation, you first call `useAppLayout_updateOnboardingStatusMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAppLayout_updateOnboardingStatusMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [appLayoutUpdateOnboardingStatusMutation, { data, loading, error }] = useAppLayout_updateOnboardingStatusMutation({
 *   variables: {
 *      key: // value for 'key'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useAppLayout_updateOnboardingStatusMutation(
  baseOptions?: Apollo.MutationHookOptions<
    AppLayout_updateOnboardingStatusMutation,
    AppLayout_updateOnboardingStatusMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    AppLayout_updateOnboardingStatusMutation,
    AppLayout_updateOnboardingStatusMutationVariables
  >(AppLayout_updateOnboardingStatusDocument, options);
}
export type AppLayout_updateOnboardingStatusMutationHookResult = ReturnType<
  typeof useAppLayout_updateOnboardingStatusMutation
>;
export const PetitionHeader_reopenPetitionDocument = gql`
  mutation PetitionHeader_reopenPetition($petitionId: GID!) {
    reopenPetition(petitionId: $petitionId) {
      id
      status
      updatedAt
    }
  }
`;

/**
 * __usePetitionHeader_reopenPetitionMutation__
 *
 * To run a mutation, you first call `usePetitionHeader_reopenPetitionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionHeader_reopenPetitionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionHeaderReopenPetitionMutation, { data, loading, error }] = usePetitionHeader_reopenPetitionMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *   },
 * });
 */
export function usePetitionHeader_reopenPetitionMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionHeader_reopenPetitionMutation,
    PetitionHeader_reopenPetitionMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionHeader_reopenPetitionMutation,
    PetitionHeader_reopenPetitionMutationVariables
  >(PetitionHeader_reopenPetitionDocument, options);
}
export type PetitionHeader_reopenPetitionMutationHookResult = ReturnType<
  typeof usePetitionHeader_reopenPetitionMutation
>;
export const PetitionHeader_updatePetitionUserSubscriptionDocument = gql`
  mutation PetitionHeader_updatePetitionUserSubscription(
    $petitionId: GID!
    $isSubscribed: Boolean!
  ) {
    updatePetitionUserSubscription(
      petitionId: $petitionId
      isSubscribed: $isSubscribed
    ) {
      id
      userPermissions {
        isSubscribed
        user {
          id
        }
      }
    }
  }
`;

/**
 * __usePetitionHeader_updatePetitionUserSubscriptionMutation__
 *
 * To run a mutation, you first call `usePetitionHeader_updatePetitionUserSubscriptionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionHeader_updatePetitionUserSubscriptionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionHeaderUpdatePetitionUserSubscriptionMutation, { data, loading, error }] = usePetitionHeader_updatePetitionUserSubscriptionMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      isSubscribed: // value for 'isSubscribed'
 *   },
 * });
 */
export function usePetitionHeader_updatePetitionUserSubscriptionMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionHeader_updatePetitionUserSubscriptionMutation,
    PetitionHeader_updatePetitionUserSubscriptionMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionHeader_updatePetitionUserSubscriptionMutation,
    PetitionHeader_updatePetitionUserSubscriptionMutationVariables
  >(PetitionHeader_updatePetitionUserSubscriptionDocument, options);
}
export type PetitionHeader_updatePetitionUserSubscriptionMutationHookResult = ReturnType<
  typeof usePetitionHeader_updatePetitionUserSubscriptionMutation
>;
export const CreateUserDialog_emailIsAvailableDocument = gql`
  query CreateUserDialog_emailIsAvailable($email: String!) {
    emailIsAvailable(email: $email)
  }
`;

/**
 * __useCreateUserDialog_emailIsAvailableQuery__
 *
 * To run a query within a React component, call `useCreateUserDialog_emailIsAvailableQuery` and pass it any options that fit your needs.
 * When your component renders, `useCreateUserDialog_emailIsAvailableQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCreateUserDialog_emailIsAvailableQuery({
 *   variables: {
 *      email: // value for 'email'
 *   },
 * });
 */
export function useCreateUserDialog_emailIsAvailableQuery(
  baseOptions: Apollo.QueryHookOptions<
    CreateUserDialog_emailIsAvailableQuery,
    CreateUserDialog_emailIsAvailableQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    CreateUserDialog_emailIsAvailableQuery,
    CreateUserDialog_emailIsAvailableQueryVariables
  >(CreateUserDialog_emailIsAvailableDocument, options);
}
export function useCreateUserDialog_emailIsAvailableLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    CreateUserDialog_emailIsAvailableQuery,
    CreateUserDialog_emailIsAvailableQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    CreateUserDialog_emailIsAvailableQuery,
    CreateUserDialog_emailIsAvailableQueryVariables
  >(CreateUserDialog_emailIsAvailableDocument, options);
}
export type CreateUserDialog_emailIsAvailableQueryHookResult = ReturnType<
  typeof useCreateUserDialog_emailIsAvailableQuery
>;
export type CreateUserDialog_emailIsAvailableLazyQueryHookResult = ReturnType<
  typeof useCreateUserDialog_emailIsAvailableLazyQuery
>;
export const PetitionSettings_cancelPetitionSignatureRequestDocument = gql`
  mutation PetitionSettings_cancelPetitionSignatureRequest(
    $petitionSignatureRequestId: GID!
  ) {
    cancelSignatureRequest(
      petitionSignatureRequestId: $petitionSignatureRequestId
    ) {
      id
      status
    }
  }
`;

/**
 * __usePetitionSettings_cancelPetitionSignatureRequestMutation__
 *
 * To run a mutation, you first call `usePetitionSettings_cancelPetitionSignatureRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionSettings_cancelPetitionSignatureRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionSettingsCancelPetitionSignatureRequestMutation, { data, loading, error }] = usePetitionSettings_cancelPetitionSignatureRequestMutation({
 *   variables: {
 *      petitionSignatureRequestId: // value for 'petitionSignatureRequestId'
 *   },
 * });
 */
export function usePetitionSettings_cancelPetitionSignatureRequestMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionSettings_cancelPetitionSignatureRequestMutation,
    PetitionSettings_cancelPetitionSignatureRequestMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionSettings_cancelPetitionSignatureRequestMutation,
    PetitionSettings_cancelPetitionSignatureRequestMutationVariables
  >(PetitionSettings_cancelPetitionSignatureRequestDocument, options);
}
export type PetitionSettings_cancelPetitionSignatureRequestMutationHookResult = ReturnType<
  typeof usePetitionSettings_cancelPetitionSignatureRequestMutation
>;
export const PetitionSettings_startPetitionSignatureRequestDocument = gql`
  mutation PetitionSettings_startPetitionSignatureRequest($petitionId: GID!) {
    startSignatureRequest(petitionId: $petitionId) {
      id
      status
    }
  }
`;

/**
 * __usePetitionSettings_startPetitionSignatureRequestMutation__
 *
 * To run a mutation, you first call `usePetitionSettings_startPetitionSignatureRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionSettings_startPetitionSignatureRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionSettingsStartPetitionSignatureRequestMutation, { data, loading, error }] = usePetitionSettings_startPetitionSignatureRequestMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *   },
 * });
 */
export function usePetitionSettings_startPetitionSignatureRequestMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionSettings_startPetitionSignatureRequestMutation,
    PetitionSettings_startPetitionSignatureRequestMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionSettings_startPetitionSignatureRequestMutation,
    PetitionSettings_startPetitionSignatureRequestMutationVariables
  >(PetitionSettings_startPetitionSignatureRequestDocument, options);
}
export type PetitionSettings_startPetitionSignatureRequestMutationHookResult = ReturnType<
  typeof usePetitionSettings_startPetitionSignatureRequestMutation
>;
export const PetitionSharingModal_addPetitionUserPermissionDocument = gql`
  mutation PetitionSharingModal_addPetitionUserPermission(
    $petitionId: GID!
    $userIds: [GID!]!
    $permissionType: PetitionUserPermissionTypeRW!
    $notify: Boolean
    $message: String
  ) {
    addPetitionUserPermission(
      petitionIds: [$petitionId]
      userIds: $userIds
      permissionType: $permissionType
      notify: $notify
      message: $message
    ) {
      ...PetitionSharingModal_Petition
    }
  }
  ${PetitionSharingModal_PetitionFragmentDoc}
`;

/**
 * __usePetitionSharingModal_addPetitionUserPermissionMutation__
 *
 * To run a mutation, you first call `usePetitionSharingModal_addPetitionUserPermissionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionSharingModal_addPetitionUserPermissionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionSharingModalAddPetitionUserPermissionMutation, { data, loading, error }] = usePetitionSharingModal_addPetitionUserPermissionMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      userIds: // value for 'userIds'
 *      permissionType: // value for 'permissionType'
 *      notify: // value for 'notify'
 *      message: // value for 'message'
 *   },
 * });
 */
export function usePetitionSharingModal_addPetitionUserPermissionMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionSharingModal_addPetitionUserPermissionMutation,
    PetitionSharingModal_addPetitionUserPermissionMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionSharingModal_addPetitionUserPermissionMutation,
    PetitionSharingModal_addPetitionUserPermissionMutationVariables
  >(PetitionSharingModal_addPetitionUserPermissionDocument, options);
}
export type PetitionSharingModal_addPetitionUserPermissionMutationHookResult = ReturnType<
  typeof usePetitionSharingModal_addPetitionUserPermissionMutation
>;
export const PetitionSharingModal_removePetitionUserPermissionDocument = gql`
  mutation PetitionSharingModal_removePetitionUserPermission(
    $petitionId: GID!
    $userId: GID!
  ) {
    removePetitionUserPermission(
      petitionIds: [$petitionId]
      userIds: [$userId]
    ) {
      ...PetitionSharingModal_Petition
    }
  }
  ${PetitionSharingModal_PetitionFragmentDoc}
`;

/**
 * __usePetitionSharingModal_removePetitionUserPermissionMutation__
 *
 * To run a mutation, you first call `usePetitionSharingModal_removePetitionUserPermissionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionSharingModal_removePetitionUserPermissionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionSharingModalRemovePetitionUserPermissionMutation, { data, loading, error }] = usePetitionSharingModal_removePetitionUserPermissionMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function usePetitionSharingModal_removePetitionUserPermissionMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionSharingModal_removePetitionUserPermissionMutation,
    PetitionSharingModal_removePetitionUserPermissionMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionSharingModal_removePetitionUserPermissionMutation,
    PetitionSharingModal_removePetitionUserPermissionMutationVariables
  >(PetitionSharingModal_removePetitionUserPermissionDocument, options);
}
export type PetitionSharingModal_removePetitionUserPermissionMutationHookResult = ReturnType<
  typeof usePetitionSharingModal_removePetitionUserPermissionMutation
>;
export const PetitionSharingModal_transferPetitionOwnershipDocument = gql`
  mutation PetitionSharingModal_transferPetitionOwnership(
    $petitionId: GID!
    $userId: GID!
  ) {
    transferPetitionOwnership(petitionIds: [$petitionId], userId: $userId) {
      ...PetitionSharingModal_Petition
    }
  }
  ${PetitionSharingModal_PetitionFragmentDoc}
`;

/**
 * __usePetitionSharingModal_transferPetitionOwnershipMutation__
 *
 * To run a mutation, you first call `usePetitionSharingModal_transferPetitionOwnershipMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionSharingModal_transferPetitionOwnershipMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionSharingModalTransferPetitionOwnershipMutation, { data, loading, error }] = usePetitionSharingModal_transferPetitionOwnershipMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function usePetitionSharingModal_transferPetitionOwnershipMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionSharingModal_transferPetitionOwnershipMutation,
    PetitionSharingModal_transferPetitionOwnershipMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionSharingModal_transferPetitionOwnershipMutation,
    PetitionSharingModal_transferPetitionOwnershipMutationVariables
  >(PetitionSharingModal_transferPetitionOwnershipDocument, options);
}
export type PetitionSharingModal_transferPetitionOwnershipMutationHookResult = ReturnType<
  typeof usePetitionSharingModal_transferPetitionOwnershipMutation
>;
export const PetitionSharingModal_PetitionUserPermissionsDocument = gql`
  query PetitionSharingModal_PetitionUserPermissions($petitionId: GID!) {
    petition(id: $petitionId) {
      ...PetitionSharingModal_Petition
    }
  }
  ${PetitionSharingModal_PetitionFragmentDoc}
`;

/**
 * __usePetitionSharingModal_PetitionUserPermissionsQuery__
 *
 * To run a query within a React component, call `usePetitionSharingModal_PetitionUserPermissionsQuery` and pass it any options that fit your needs.
 * When your component renders, `usePetitionSharingModal_PetitionUserPermissionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePetitionSharingModal_PetitionUserPermissionsQuery({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *   },
 * });
 */
export function usePetitionSharingModal_PetitionUserPermissionsQuery(
  baseOptions: Apollo.QueryHookOptions<
    PetitionSharingModal_PetitionUserPermissionsQuery,
    PetitionSharingModal_PetitionUserPermissionsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    PetitionSharingModal_PetitionUserPermissionsQuery,
    PetitionSharingModal_PetitionUserPermissionsQueryVariables
  >(PetitionSharingModal_PetitionUserPermissionsDocument, options);
}
export function usePetitionSharingModal_PetitionUserPermissionsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PetitionSharingModal_PetitionUserPermissionsQuery,
    PetitionSharingModal_PetitionUserPermissionsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    PetitionSharingModal_PetitionUserPermissionsQuery,
    PetitionSharingModal_PetitionUserPermissionsQueryVariables
  >(PetitionSharingModal_PetitionUserPermissionsDocument, options);
}
export type PetitionSharingModal_PetitionUserPermissionsQueryHookResult = ReturnType<
  typeof usePetitionSharingModal_PetitionUserPermissionsQuery
>;
export type PetitionSharingModal_PetitionUserPermissionsLazyQueryHookResult = ReturnType<
  typeof usePetitionSharingModal_PetitionUserPermissionsLazyQuery
>;
export const useTemplateDetailsDialogPetitionDocument = gql`
  query useTemplateDetailsDialogPetition($templateId: GID!) {
    petition(id: $templateId) {
      ...TemplateDetailsDialog_PetitionTemplate
    }
  }
  ${TemplateDetailsDialog_PetitionTemplateFragmentDoc}
`;

/**
 * __useuseTemplateDetailsDialogPetitionQuery__
 *
 * To run a query within a React component, call `useuseTemplateDetailsDialogPetitionQuery` and pass it any options that fit your needs.
 * When your component renders, `useuseTemplateDetailsDialogPetitionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useuseTemplateDetailsDialogPetitionQuery({
 *   variables: {
 *      templateId: // value for 'templateId'
 *   },
 * });
 */
export function useuseTemplateDetailsDialogPetitionQuery(
  baseOptions: Apollo.QueryHookOptions<
    useTemplateDetailsDialogPetitionQuery,
    useTemplateDetailsDialogPetitionQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    useTemplateDetailsDialogPetitionQuery,
    useTemplateDetailsDialogPetitionQueryVariables
  >(useTemplateDetailsDialogPetitionDocument, options);
}
export function useuseTemplateDetailsDialogPetitionLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    useTemplateDetailsDialogPetitionQuery,
    useTemplateDetailsDialogPetitionQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    useTemplateDetailsDialogPetitionQuery,
    useTemplateDetailsDialogPetitionQueryVariables
  >(useTemplateDetailsDialogPetitionDocument, options);
}
export type useTemplateDetailsDialogPetitionQueryHookResult = ReturnType<
  typeof useuseTemplateDetailsDialogPetitionQuery
>;
export type useTemplateDetailsDialogPetitionLazyQueryHookResult = ReturnType<
  typeof useuseTemplateDetailsDialogPetitionLazyQuery
>;
export const DynamicSelectSettings_uploadDynamicSelectFieldFileDocument = gql`
  mutation DynamicSelectSettings_uploadDynamicSelectFieldFile(
    $petitionId: GID!
    $fieldId: GID!
    $file: Upload!
  ) {
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

/**
 * __useDynamicSelectSettings_uploadDynamicSelectFieldFileMutation__
 *
 * To run a mutation, you first call `useDynamicSelectSettings_uploadDynamicSelectFieldFileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDynamicSelectSettings_uploadDynamicSelectFieldFileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [dynamicSelectSettingsUploadDynamicSelectFieldFileMutation, { data, loading, error }] = useDynamicSelectSettings_uploadDynamicSelectFieldFileMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      fieldId: // value for 'fieldId'
 *      file: // value for 'file'
 *   },
 * });
 */
export function useDynamicSelectSettings_uploadDynamicSelectFieldFileMutation(
  baseOptions?: Apollo.MutationHookOptions<
    DynamicSelectSettings_uploadDynamicSelectFieldFileMutation,
    DynamicSelectSettings_uploadDynamicSelectFieldFileMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    DynamicSelectSettings_uploadDynamicSelectFieldFileMutation,
    DynamicSelectSettings_uploadDynamicSelectFieldFileMutationVariables
  >(DynamicSelectSettings_uploadDynamicSelectFieldFileDocument, options);
}
export type DynamicSelectSettings_uploadDynamicSelectFieldFileMutationHookResult = ReturnType<
  typeof useDynamicSelectSettings_uploadDynamicSelectFieldFileMutation
>;
export const DynamicSelectSettings_dynamicSelectFieldFileDownloadLinkDocument = gql`
  mutation DynamicSelectSettings_dynamicSelectFieldFileDownloadLink(
    $petitionId: GID!
    $fieldId: GID!
  ) {
    dynamicSelectFieldFileDownloadLink(
      petitionId: $petitionId
      fieldId: $fieldId
    ) {
      result
      url
    }
  }
`;

/**
 * __useDynamicSelectSettings_dynamicSelectFieldFileDownloadLinkMutation__
 *
 * To run a mutation, you first call `useDynamicSelectSettings_dynamicSelectFieldFileDownloadLinkMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDynamicSelectSettings_dynamicSelectFieldFileDownloadLinkMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [dynamicSelectSettingsDynamicSelectFieldFileDownloadLinkMutation, { data, loading, error }] = useDynamicSelectSettings_dynamicSelectFieldFileDownloadLinkMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      fieldId: // value for 'fieldId'
 *   },
 * });
 */
export function useDynamicSelectSettings_dynamicSelectFieldFileDownloadLinkMutation(
  baseOptions?: Apollo.MutationHookOptions<
    DynamicSelectSettings_dynamicSelectFieldFileDownloadLinkMutation,
    DynamicSelectSettings_dynamicSelectFieldFileDownloadLinkMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    DynamicSelectSettings_dynamicSelectFieldFileDownloadLinkMutation,
    DynamicSelectSettings_dynamicSelectFieldFileDownloadLinkMutationVariables
  >(DynamicSelectSettings_dynamicSelectFieldFileDownloadLinkDocument, options);
}
export type DynamicSelectSettings_dynamicSelectFieldFileDownloadLinkMutationHookResult = ReturnType<
  typeof useDynamicSelectSettings_dynamicSelectFieldFileDownloadLinkMutation
>;
export const ExportRepliesProgressDialog_PetitionRepliesDocument = gql`
  query ExportRepliesProgressDialog_PetitionReplies($petitionId: GID!) {
    petition(id: $petitionId) {
      ...ExportRepliesProgressDialog_Petition
    }
  }
  ${ExportRepliesProgressDialog_PetitionFragmentDoc}
`;

/**
 * __useExportRepliesProgressDialog_PetitionRepliesQuery__
 *
 * To run a query within a React component, call `useExportRepliesProgressDialog_PetitionRepliesQuery` and pass it any options that fit your needs.
 * When your component renders, `useExportRepliesProgressDialog_PetitionRepliesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useExportRepliesProgressDialog_PetitionRepliesQuery({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *   },
 * });
 */
export function useExportRepliesProgressDialog_PetitionRepliesQuery(
  baseOptions: Apollo.QueryHookOptions<
    ExportRepliesProgressDialog_PetitionRepliesQuery,
    ExportRepliesProgressDialog_PetitionRepliesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ExportRepliesProgressDialog_PetitionRepliesQuery,
    ExportRepliesProgressDialog_PetitionRepliesQueryVariables
  >(ExportRepliesProgressDialog_PetitionRepliesDocument, options);
}
export function useExportRepliesProgressDialog_PetitionRepliesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ExportRepliesProgressDialog_PetitionRepliesQuery,
    ExportRepliesProgressDialog_PetitionRepliesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ExportRepliesProgressDialog_PetitionRepliesQuery,
    ExportRepliesProgressDialog_PetitionRepliesQueryVariables
  >(ExportRepliesProgressDialog_PetitionRepliesDocument, options);
}
export type ExportRepliesProgressDialog_PetitionRepliesQueryHookResult = ReturnType<
  typeof useExportRepliesProgressDialog_PetitionRepliesQuery
>;
export type ExportRepliesProgressDialog_PetitionRepliesLazyQueryHookResult = ReturnType<
  typeof useExportRepliesProgressDialog_PetitionRepliesLazyQuery
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
`;

/**
 * __useExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutation__
 *
 * To run a mutation, you first call `useExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [exportRepliesProgressDialogFileUploadReplyDownloadLinkMutation, { data, loading, error }] = useExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      replyId: // value for 'replyId'
 *   },
 * });
 */
export function useExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutation(
  baseOptions?: Apollo.MutationHookOptions<
    ExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutation,
    ExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    ExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutation,
    ExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutationVariables
  >(ExportRepliesProgressDialog_fileUploadReplyDownloadLinkDocument, options);
}
export type ExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutationHookResult = ReturnType<
  typeof useExportRepliesProgressDialog_fileUploadReplyDownloadLinkMutation
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
      filename
      url
    }
  }
`;

/**
 * __useExportRepliesProgressDialog_signedPetitionDownloadLinkMutation__
 *
 * To run a mutation, you first call `useExportRepliesProgressDialog_signedPetitionDownloadLinkMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useExportRepliesProgressDialog_signedPetitionDownloadLinkMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [exportRepliesProgressDialogSignedPetitionDownloadLinkMutation, { data, loading, error }] = useExportRepliesProgressDialog_signedPetitionDownloadLinkMutation({
 *   variables: {
 *      petitionSignatureRequestId: // value for 'petitionSignatureRequestId'
 *      downloadAuditTrail: // value for 'downloadAuditTrail'
 *   },
 * });
 */
export function useExportRepliesProgressDialog_signedPetitionDownloadLinkMutation(
  baseOptions?: Apollo.MutationHookOptions<
    ExportRepliesProgressDialog_signedPetitionDownloadLinkMutation,
    ExportRepliesProgressDialog_signedPetitionDownloadLinkMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    ExportRepliesProgressDialog_signedPetitionDownloadLinkMutation,
    ExportRepliesProgressDialog_signedPetitionDownloadLinkMutationVariables
  >(ExportRepliesProgressDialog_signedPetitionDownloadLinkDocument, options);
}
export type ExportRepliesProgressDialog_signedPetitionDownloadLinkMutationHookResult = ReturnType<
  typeof useExportRepliesProgressDialog_signedPetitionDownloadLinkMutation
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
`;

/**
 * __useExportRepliesProgressDialog_updatePetitionFieldReplyMetadataMutation__
 *
 * To run a mutation, you first call `useExportRepliesProgressDialog_updatePetitionFieldReplyMetadataMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useExportRepliesProgressDialog_updatePetitionFieldReplyMetadataMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [exportRepliesProgressDialogUpdatePetitionFieldReplyMetadataMutation, { data, loading, error }] = useExportRepliesProgressDialog_updatePetitionFieldReplyMetadataMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      replyId: // value for 'replyId'
 *      metadata: // value for 'metadata'
 *   },
 * });
 */
export function useExportRepliesProgressDialog_updatePetitionFieldReplyMetadataMutation(
  baseOptions?: Apollo.MutationHookOptions<
    ExportRepliesProgressDialog_updatePetitionFieldReplyMetadataMutation,
    ExportRepliesProgressDialog_updatePetitionFieldReplyMetadataMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    ExportRepliesProgressDialog_updatePetitionFieldReplyMetadataMutation,
    ExportRepliesProgressDialog_updatePetitionFieldReplyMetadataMutationVariables
  >(
    ExportRepliesProgressDialog_updatePetitionFieldReplyMetadataDocument,
    options
  );
}
export type ExportRepliesProgressDialog_updatePetitionFieldReplyMetadataMutationHookResult = ReturnType<
  typeof useExportRepliesProgressDialog_updatePetitionFieldReplyMetadataMutation
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
`;

/**
 * __useExportRepliesProgressDialog_updateSignatureRequestMetadataMutation__
 *
 * To run a mutation, you first call `useExportRepliesProgressDialog_updateSignatureRequestMetadataMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useExportRepliesProgressDialog_updateSignatureRequestMetadataMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [exportRepliesProgressDialogUpdateSignatureRequestMetadataMutation, { data, loading, error }] = useExportRepliesProgressDialog_updateSignatureRequestMetadataMutation({
 *   variables: {
 *      petitionSignatureRequestId: // value for 'petitionSignatureRequestId'
 *      metadata: // value for 'metadata'
 *   },
 * });
 */
export function useExportRepliesProgressDialog_updateSignatureRequestMetadataMutation(
  baseOptions?: Apollo.MutationHookOptions<
    ExportRepliesProgressDialog_updateSignatureRequestMetadataMutation,
    ExportRepliesProgressDialog_updateSignatureRequestMetadataMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    ExportRepliesProgressDialog_updateSignatureRequestMetadataMutation,
    ExportRepliesProgressDialog_updateSignatureRequestMetadataMutationVariables
  >(
    ExportRepliesProgressDialog_updateSignatureRequestMetadataDocument,
    options
  );
}
export type ExportRepliesProgressDialog_updateSignatureRequestMetadataMutationHookResult = ReturnType<
  typeof useExportRepliesProgressDialog_updateSignatureRequestMetadataMutation
>;
export const PetitionSignaturesCard_updatePetitionSignatureConfigDocument = gql`
  mutation PetitionSignaturesCard_updatePetitionSignatureConfig(
    $petitionId: GID!
    $signatureConfig: SignatureConfigInput
  ) {
    updatePetition(
      petitionId: $petitionId
      data: { signatureConfig: $signatureConfig }
    ) {
      ... on Petition {
        ...PetitionSignaturesCard_Petition
      }
    }
  }
  ${PetitionSignaturesCard_PetitionFragmentDoc}
`;

/**
 * __usePetitionSignaturesCard_updatePetitionSignatureConfigMutation__
 *
 * To run a mutation, you first call `usePetitionSignaturesCard_updatePetitionSignatureConfigMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionSignaturesCard_updatePetitionSignatureConfigMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionSignaturesCardUpdatePetitionSignatureConfigMutation, { data, loading, error }] = usePetitionSignaturesCard_updatePetitionSignatureConfigMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      signatureConfig: // value for 'signatureConfig'
 *   },
 * });
 */
export function usePetitionSignaturesCard_updatePetitionSignatureConfigMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionSignaturesCard_updatePetitionSignatureConfigMutation,
    PetitionSignaturesCard_updatePetitionSignatureConfigMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionSignaturesCard_updatePetitionSignatureConfigMutation,
    PetitionSignaturesCard_updatePetitionSignatureConfigMutationVariables
  >(PetitionSignaturesCard_updatePetitionSignatureConfigDocument, options);
}
export type PetitionSignaturesCard_updatePetitionSignatureConfigMutationHookResult = ReturnType<
  typeof usePetitionSignaturesCard_updatePetitionSignatureConfigMutation
>;
export const PetitionSignaturesCard_cancelSignatureRequestDocument = gql`
  mutation PetitionSignaturesCard_cancelSignatureRequest(
    $petitionSignatureRequestId: GID!
  ) {
    cancelSignatureRequest(
      petitionSignatureRequestId: $petitionSignatureRequestId
    ) {
      id
      status
    }
  }
`;

/**
 * __usePetitionSignaturesCard_cancelSignatureRequestMutation__
 *
 * To run a mutation, you first call `usePetitionSignaturesCard_cancelSignatureRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionSignaturesCard_cancelSignatureRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionSignaturesCardCancelSignatureRequestMutation, { data, loading, error }] = usePetitionSignaturesCard_cancelSignatureRequestMutation({
 *   variables: {
 *      petitionSignatureRequestId: // value for 'petitionSignatureRequestId'
 *   },
 * });
 */
export function usePetitionSignaturesCard_cancelSignatureRequestMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionSignaturesCard_cancelSignatureRequestMutation,
    PetitionSignaturesCard_cancelSignatureRequestMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionSignaturesCard_cancelSignatureRequestMutation,
    PetitionSignaturesCard_cancelSignatureRequestMutationVariables
  >(PetitionSignaturesCard_cancelSignatureRequestDocument, options);
}
export type PetitionSignaturesCard_cancelSignatureRequestMutationHookResult = ReturnType<
  typeof usePetitionSignaturesCard_cancelSignatureRequestMutation
>;
export const PetitionSignaturesCard_startSignatureRequestDocument = gql`
  mutation PetitionSignaturesCard_startSignatureRequest($petitionId: GID!) {
    startSignatureRequest(petitionId: $petitionId) {
      id
      status
    }
  }
`;

/**
 * __usePetitionSignaturesCard_startSignatureRequestMutation__
 *
 * To run a mutation, you first call `usePetitionSignaturesCard_startSignatureRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionSignaturesCard_startSignatureRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionSignaturesCardStartSignatureRequestMutation, { data, loading, error }] = usePetitionSignaturesCard_startSignatureRequestMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *   },
 * });
 */
export function usePetitionSignaturesCard_startSignatureRequestMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionSignaturesCard_startSignatureRequestMutation,
    PetitionSignaturesCard_startSignatureRequestMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionSignaturesCard_startSignatureRequestMutation,
    PetitionSignaturesCard_startSignatureRequestMutationVariables
  >(PetitionSignaturesCard_startSignatureRequestDocument, options);
}
export type PetitionSignaturesCard_startSignatureRequestMutationHookResult = ReturnType<
  typeof usePetitionSignaturesCard_startSignatureRequestMutation
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
`;

/**
 * __usePetitionSignaturesCard_signedPetitionDownloadLinkMutation__
 *
 * To run a mutation, you first call `usePetitionSignaturesCard_signedPetitionDownloadLinkMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionSignaturesCard_signedPetitionDownloadLinkMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionSignaturesCardSignedPetitionDownloadLinkMutation, { data, loading, error }] = usePetitionSignaturesCard_signedPetitionDownloadLinkMutation({
 *   variables: {
 *      petitionSignatureRequestId: // value for 'petitionSignatureRequestId'
 *      preview: // value for 'preview'
 *   },
 * });
 */
export function usePetitionSignaturesCard_signedPetitionDownloadLinkMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionSignaturesCard_signedPetitionDownloadLinkMutation,
    PetitionSignaturesCard_signedPetitionDownloadLinkMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionSignaturesCard_signedPetitionDownloadLinkMutation,
    PetitionSignaturesCard_signedPetitionDownloadLinkMutationVariables
  >(PetitionSignaturesCard_signedPetitionDownloadLinkDocument, options);
}
export type PetitionSignaturesCard_signedPetitionDownloadLinkMutationHookResult = ReturnType<
  typeof usePetitionSignaturesCard_signedPetitionDownloadLinkMutation
>;
export const RecipientViewContactCard_publicDelegateAccessToContactDocument = gql`
  mutation RecipientViewContactCard_publicDelegateAccessToContact(
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
      }
    }
  }
`;

/**
 * __useRecipientViewContactCard_publicDelegateAccessToContactMutation__
 *
 * To run a mutation, you first call `useRecipientViewContactCard_publicDelegateAccessToContactMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRecipientViewContactCard_publicDelegateAccessToContactMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [recipientViewContactCardPublicDelegateAccessToContactMutation, { data, loading, error }] = useRecipientViewContactCard_publicDelegateAccessToContactMutation({
 *   variables: {
 *      keycode: // value for 'keycode'
 *      email: // value for 'email'
 *      firstName: // value for 'firstName'
 *      lastName: // value for 'lastName'
 *      messageBody: // value for 'messageBody'
 *   },
 * });
 */
export function useRecipientViewContactCard_publicDelegateAccessToContactMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RecipientViewContactCard_publicDelegateAccessToContactMutation,
    RecipientViewContactCard_publicDelegateAccessToContactMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RecipientViewContactCard_publicDelegateAccessToContactMutation,
    RecipientViewContactCard_publicDelegateAccessToContactMutationVariables
  >(RecipientViewContactCard_publicDelegateAccessToContactDocument, options);
}
export type RecipientViewContactCard_publicDelegateAccessToContactMutationHookResult = ReturnType<
  typeof useRecipientViewContactCard_publicDelegateAccessToContactMutation
>;
export const RecipientViewPetitionFieldCommentsDocument = gql`
  query RecipientViewPetitionFieldComments(
    $keycode: ID!
    $petitionFieldId: GID!
  ) {
    petitionFieldComments(
      keycode: $keycode
      petitionFieldId: $petitionFieldId
    ) {
      ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldComment
    }
  }
  ${RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragmentDoc}
`;

/**
 * __useRecipientViewPetitionFieldCommentsQuery__
 *
 * To run a query within a React component, call `useRecipientViewPetitionFieldCommentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useRecipientViewPetitionFieldCommentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRecipientViewPetitionFieldCommentsQuery({
 *   variables: {
 *      keycode: // value for 'keycode'
 *      petitionFieldId: // value for 'petitionFieldId'
 *   },
 * });
 */
export function useRecipientViewPetitionFieldCommentsQuery(
  baseOptions: Apollo.QueryHookOptions<
    RecipientViewPetitionFieldCommentsQuery,
    RecipientViewPetitionFieldCommentsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    RecipientViewPetitionFieldCommentsQuery,
    RecipientViewPetitionFieldCommentsQueryVariables
  >(RecipientViewPetitionFieldCommentsDocument, options);
}
export function useRecipientViewPetitionFieldCommentsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    RecipientViewPetitionFieldCommentsQuery,
    RecipientViewPetitionFieldCommentsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    RecipientViewPetitionFieldCommentsQuery,
    RecipientViewPetitionFieldCommentsQueryVariables
  >(RecipientViewPetitionFieldCommentsDocument, options);
}
export type RecipientViewPetitionFieldCommentsQueryHookResult = ReturnType<
  typeof useRecipientViewPetitionFieldCommentsQuery
>;
export type RecipientViewPetitionFieldCommentsLazyQueryHookResult = ReturnType<
  typeof useRecipientViewPetitionFieldCommentsLazyQuery
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
`;

/**
 * __useRecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutation__
 *
 * To run a mutation, you first call `useRecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [recipientViewPetitionFieldCommentsDialogMarkPetitionFieldCommentsAsReadMutation, { data, loading, error }] = useRecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutation({
 *   variables: {
 *      keycode: // value for 'keycode'
 *      petitionFieldCommentIds: // value for 'petitionFieldCommentIds'
 *   },
 * });
 */
export function useRecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutation,
    RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutation,
    RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutationVariables
  >(
    RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadDocument,
    options
  );
}
export type RecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutationHookResult = ReturnType<
  typeof useRecipientViewPetitionFieldCommentsDialog_markPetitionFieldCommentsAsReadMutation
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
      ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldComment
    }
  }
  ${RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragmentDoc}
`;

/**
 * __useRecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutation__
 *
 * To run a mutation, you first call `useRecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [recipientViewPetitionFieldCommentsDialogCreatePetitionFieldCommentMutation, { data, loading, error }] = useRecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutation({
 *   variables: {
 *      keycode: // value for 'keycode'
 *      petitionFieldId: // value for 'petitionFieldId'
 *      content: // value for 'content'
 *   },
 * });
 */
export function useRecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutation,
    RecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutation,
    RecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutationVariables
  >(
    RecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentDocument,
    options
  );
}
export type RecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutationHookResult = ReturnType<
  typeof useRecipientViewPetitionFieldCommentsDialog_createPetitionFieldCommentMutation
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
      ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldComment
    }
  }
  ${RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragmentDoc}
`;

/**
 * __useRecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutation__
 *
 * To run a mutation, you first call `useRecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [recipientViewPetitionFieldCommentsDialogUpdatePetitionFieldCommentMutation, { data, loading, error }] = useRecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutation({
 *   variables: {
 *      keycode: // value for 'keycode'
 *      petitionFieldId: // value for 'petitionFieldId'
 *      petitionFieldCommentId: // value for 'petitionFieldCommentId'
 *      content: // value for 'content'
 *   },
 * });
 */
export function useRecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutation,
    RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutation,
    RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutationVariables
  >(
    RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentDocument,
    options
  );
}
export type RecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutationHookResult = ReturnType<
  typeof useRecipientViewPetitionFieldCommentsDialog_updatePetitionFieldCommentMutation
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
    )
  }
`;

/**
 * __useRecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutation__
 *
 * To run a mutation, you first call `useRecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [recipientViewPetitionFieldCommentsDialogDeletePetitionFieldCommentMutation, { data, loading, error }] = useRecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutation({
 *   variables: {
 *      keycode: // value for 'keycode'
 *      petitionFieldId: // value for 'petitionFieldId'
 *      petitionFieldCommentId: // value for 'petitionFieldCommentId'
 *   },
 * });
 */
export function useRecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutation,
    RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutation,
    RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutationVariables
  >(
    RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentDocument,
    options
  );
}
export type RecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutationHookResult = ReturnType<
  typeof useRecipientViewPetitionFieldCommentsDialog_deletePetitionFieldCommentMutation
>;
export const RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkDocument = gql`
  mutation RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLink(
    $keycode: ID!
    $replyId: GID!
    $preview: Boolean
  ) {
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

/**
 * __useRecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkMutation__
 *
 * To run a mutation, you first call `useRecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [recipientViewPetitionFieldFileUploadPublicFileUploadReplyDownloadLinkMutation, { data, loading, error }] = useRecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkMutation({
 *   variables: {
 *      keycode: // value for 'keycode'
 *      replyId: // value for 'replyId'
 *      preview: // value for 'preview'
 *   },
 * });
 */
export function useRecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkMutation,
    RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkMutation,
    RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkMutationVariables
  >(
    RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkDocument,
    options
  );
}
export type RecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkMutationHookResult = ReturnType<
  typeof useRecipientViewPetitionFieldFileUpload_publicFileUploadReplyDownloadLinkMutation
>;
export const RecipientViewPetitionFieldMutations_publicDeletePetitionReplyDocument = gql`
  mutation RecipientViewPetitionFieldMutations_publicDeletePetitionReply(
    $replyId: GID!
    $keycode: ID!
  ) {
    publicDeletePetitionReply(replyId: $replyId, keycode: $keycode)
  }
`;

/**
 * __useRecipientViewPetitionFieldMutations_publicDeletePetitionReplyMutation__
 *
 * To run a mutation, you first call `useRecipientViewPetitionFieldMutations_publicDeletePetitionReplyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRecipientViewPetitionFieldMutations_publicDeletePetitionReplyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [recipientViewPetitionFieldMutationsPublicDeletePetitionReplyMutation, { data, loading, error }] = useRecipientViewPetitionFieldMutations_publicDeletePetitionReplyMutation({
 *   variables: {
 *      replyId: // value for 'replyId'
 *      keycode: // value for 'keycode'
 *   },
 * });
 */
export function useRecipientViewPetitionFieldMutations_publicDeletePetitionReplyMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RecipientViewPetitionFieldMutations_publicDeletePetitionReplyMutation,
    RecipientViewPetitionFieldMutations_publicDeletePetitionReplyMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RecipientViewPetitionFieldMutations_publicDeletePetitionReplyMutation,
    RecipientViewPetitionFieldMutations_publicDeletePetitionReplyMutationVariables
  >(
    RecipientViewPetitionFieldMutations_publicDeletePetitionReplyDocument,
    options
  );
}
export type RecipientViewPetitionFieldMutations_publicDeletePetitionReplyMutationHookResult = ReturnType<
  typeof useRecipientViewPetitionFieldMutations_publicDeletePetitionReplyMutation
>;
export const RecipientViewPetitionFieldMutations_publicUpdateSimpleReplyDocument = gql`
  mutation RecipientViewPetitionFieldMutations_publicUpdateSimpleReply(
    $keycode: ID!
    $replyId: GID!
    $value: String!
  ) {
    publicUpdateSimpleReply(
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

/**
 * __useRecipientViewPetitionFieldMutations_publicUpdateSimpleReplyMutation__
 *
 * To run a mutation, you first call `useRecipientViewPetitionFieldMutations_publicUpdateSimpleReplyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRecipientViewPetitionFieldMutations_publicUpdateSimpleReplyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [recipientViewPetitionFieldMutationsPublicUpdateSimpleReplyMutation, { data, loading, error }] = useRecipientViewPetitionFieldMutations_publicUpdateSimpleReplyMutation({
 *   variables: {
 *      keycode: // value for 'keycode'
 *      replyId: // value for 'replyId'
 *      value: // value for 'value'
 *   },
 * });
 */
export function useRecipientViewPetitionFieldMutations_publicUpdateSimpleReplyMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RecipientViewPetitionFieldMutations_publicUpdateSimpleReplyMutation,
    RecipientViewPetitionFieldMutations_publicUpdateSimpleReplyMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RecipientViewPetitionFieldMutations_publicUpdateSimpleReplyMutation,
    RecipientViewPetitionFieldMutations_publicUpdateSimpleReplyMutationVariables
  >(
    RecipientViewPetitionFieldMutations_publicUpdateSimpleReplyDocument,
    options
  );
}
export type RecipientViewPetitionFieldMutations_publicUpdateSimpleReplyMutationHookResult = ReturnType<
  typeof useRecipientViewPetitionFieldMutations_publicUpdateSimpleReplyMutation
>;
export const RecipientViewPetitionFieldMutations_publicCreateSimpleReplyDocument = gql`
  mutation RecipientViewPetitionFieldMutations_publicCreateSimpleReply(
    $keycode: ID!
    $fieldId: GID!
    $value: String!
  ) {
    publicCreateSimpleReply(
      keycode: $keycode
      fieldId: $fieldId
      value: $value
    ) {
      ...RecipientViewPetitionFieldCard_PublicPetitionFieldReply
    }
  }
  ${RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragmentDoc}
`;

/**
 * __useRecipientViewPetitionFieldMutations_publicCreateSimpleReplyMutation__
 *
 * To run a mutation, you first call `useRecipientViewPetitionFieldMutations_publicCreateSimpleReplyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRecipientViewPetitionFieldMutations_publicCreateSimpleReplyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [recipientViewPetitionFieldMutationsPublicCreateSimpleReplyMutation, { data, loading, error }] = useRecipientViewPetitionFieldMutations_publicCreateSimpleReplyMutation({
 *   variables: {
 *      keycode: // value for 'keycode'
 *      fieldId: // value for 'fieldId'
 *      value: // value for 'value'
 *   },
 * });
 */
export function useRecipientViewPetitionFieldMutations_publicCreateSimpleReplyMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RecipientViewPetitionFieldMutations_publicCreateSimpleReplyMutation,
    RecipientViewPetitionFieldMutations_publicCreateSimpleReplyMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RecipientViewPetitionFieldMutations_publicCreateSimpleReplyMutation,
    RecipientViewPetitionFieldMutations_publicCreateSimpleReplyMutationVariables
  >(
    RecipientViewPetitionFieldMutations_publicCreateSimpleReplyDocument,
    options
  );
}
export type RecipientViewPetitionFieldMutations_publicCreateSimpleReplyMutationHookResult = ReturnType<
  typeof useRecipientViewPetitionFieldMutations_publicCreateSimpleReplyMutation
>;
export const RecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyDocument = gql`
  mutation RecipientViewPetitionFieldMutations_publicCreateDynamicSelectReply(
    $keycode: ID!
    $fieldId: GID!
    $value: [[String]!]!
  ) {
    publicCreateDynamicSelectReply(
      keycode: $keycode
      fieldId: $fieldId
      value: $value
    ) {
      ...RecipientViewPetitionFieldCard_PublicPetitionFieldReply
    }
  }
  ${RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragmentDoc}
`;

/**
 * __useRecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyMutation__
 *
 * To run a mutation, you first call `useRecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [recipientViewPetitionFieldMutationsPublicCreateDynamicSelectReplyMutation, { data, loading, error }] = useRecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyMutation({
 *   variables: {
 *      keycode: // value for 'keycode'
 *      fieldId: // value for 'fieldId'
 *      value: // value for 'value'
 *   },
 * });
 */
export function useRecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyMutation,
    RecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyMutation,
    RecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyMutationVariables
  >(
    RecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyDocument,
    options
  );
}
export type RecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyMutationHookResult = ReturnType<
  typeof useRecipientViewPetitionFieldMutations_publicCreateDynamicSelectReplyMutation
>;
export const RecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyDocument = gql`
  mutation RecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReply(
    $keycode: ID!
    $replyId: GID!
    $value: [[String]!]!
  ) {
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

/**
 * __useRecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyMutation__
 *
 * To run a mutation, you first call `useRecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [recipientViewPetitionFieldMutationsPublicUpdateDynamicSelectReplyMutation, { data, loading, error }] = useRecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyMutation({
 *   variables: {
 *      keycode: // value for 'keycode'
 *      replyId: // value for 'replyId'
 *      value: // value for 'value'
 *   },
 * });
 */
export function useRecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyMutation,
    RecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyMutation,
    RecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyMutationVariables
  >(
    RecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyDocument,
    options
  );
}
export type RecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyMutationHookResult = ReturnType<
  typeof useRecipientViewPetitionFieldMutations_publicUpdateDynamicSelectReplyMutation
>;
export const RecipientViewPetitionFieldMutations_publicCreateFileUploadReplyDocument = gql`
  mutation RecipientViewPetitionFieldMutations_publicCreateFileUploadReply(
    $keycode: ID!
    $fieldId: GID!
    $data: CreateFileUploadReplyInput!
  ) {
    publicCreateFileUploadReply(
      keycode: $keycode
      fieldId: $fieldId
      data: $data
    ) {
      endpoint
      reply {
        ...RecipientViewPetitionFieldCard_PublicPetitionFieldReply
      }
    }
  }
  ${RecipientViewPetitionFieldCard_PublicPetitionFieldReplyFragmentDoc}
`;

/**
 * __useRecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutation__
 *
 * To run a mutation, you first call `useRecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [recipientViewPetitionFieldMutationsPublicCreateFileUploadReplyMutation, { data, loading, error }] = useRecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutation({
 *   variables: {
 *      keycode: // value for 'keycode'
 *      fieldId: // value for 'fieldId'
 *      data: // value for 'data'
 *   },
 * });
 */
export function useRecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutation,
    RecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutation,
    RecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutationVariables
  >(
    RecipientViewPetitionFieldMutations_publicCreateFileUploadReplyDocument,
    options
  );
}
export type RecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutationHookResult = ReturnType<
  typeof useRecipientViewPetitionFieldMutations_publicCreateFileUploadReplyMutation
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
`;

/**
 * __useRecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutation__
 *
 * To run a mutation, you first call `useRecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [recipientViewPetitionFieldMutationsPublicFileUploadReplyCompleteMutation, { data, loading, error }] = useRecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutation({
 *   variables: {
 *      keycode: // value for 'keycode'
 *      replyId: // value for 'replyId'
 *   },
 * });
 */
export function useRecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutation,
    RecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutation,
    RecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutationVariables
  >(
    RecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteDocument,
    options
  );
}
export type RecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutationHookResult = ReturnType<
  typeof useRecipientViewPetitionFieldMutations_publicFileUploadReplyCompleteMutation
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
`;

/**
 * __useGenerateNewTokenDialog_generateUserAuthTokenMutation__
 *
 * To run a mutation, you first call `useGenerateNewTokenDialog_generateUserAuthTokenMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useGenerateNewTokenDialog_generateUserAuthTokenMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [generateNewTokenDialogGenerateUserAuthTokenMutation, { data, loading, error }] = useGenerateNewTokenDialog_generateUserAuthTokenMutation({
 *   variables: {
 *      tokenName: // value for 'tokenName'
 *   },
 * });
 */
export function useGenerateNewTokenDialog_generateUserAuthTokenMutation(
  baseOptions?: Apollo.MutationHookOptions<
    GenerateNewTokenDialog_generateUserAuthTokenMutation,
    GenerateNewTokenDialog_generateUserAuthTokenMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    GenerateNewTokenDialog_generateUserAuthTokenMutation,
    GenerateNewTokenDialog_generateUserAuthTokenMutationVariables
  >(GenerateNewTokenDialog_generateUserAuthTokenDocument, options);
}
export type GenerateNewTokenDialog_generateUserAuthTokenMutationHookResult = ReturnType<
  typeof useGenerateNewTokenDialog_generateUserAuthTokenMutation
>;
export const AdminDocument = gql`
  query Admin {
    me {
      id
      ...Admin_User
    }
  }
  ${Admin_UserFragmentDoc}
`;

/**
 * __useAdminQuery__
 *
 * To run a query within a React component, call `useAdminQuery` and pass it any options that fit your needs.
 * When your component renders, `useAdminQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAdminQuery({
 *   variables: {
 *   },
 * });
 */
export function useAdminQuery(
  baseOptions?: Apollo.QueryHookOptions<AdminQuery, AdminQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<AdminQuery, AdminQueryVariables>(
    AdminDocument,
    options
  );
}
export function useAdminLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<AdminQuery, AdminQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<AdminQuery, AdminQueryVariables>(
    AdminDocument,
    options
  );
}
export type AdminQueryHookResult = ReturnType<typeof useAdminQuery>;
export type AdminLazyQueryHookResult = ReturnType<typeof useAdminLazyQuery>;
export const AdminOrganizationsDocument = gql`
  query AdminOrganizations(
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
`;

/**
 * __useAdminOrganizationsQuery__
 *
 * To run a query within a React component, call `useAdminOrganizationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useAdminOrganizationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAdminOrganizationsQuery({
 *   variables: {
 *      offset: // value for 'offset'
 *      limit: // value for 'limit'
 *      search: // value for 'search'
 *      sortBy: // value for 'sortBy'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useAdminOrganizationsQuery(
  baseOptions: Apollo.QueryHookOptions<
    AdminOrganizationsQuery,
    AdminOrganizationsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    AdminOrganizationsQuery,
    AdminOrganizationsQueryVariables
  >(AdminOrganizationsDocument, options);
}
export function useAdminOrganizationsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    AdminOrganizationsQuery,
    AdminOrganizationsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    AdminOrganizationsQuery,
    AdminOrganizationsQueryVariables
  >(AdminOrganizationsDocument, options);
}
export type AdminOrganizationsQueryHookResult = ReturnType<
  typeof useAdminOrganizationsQuery
>;
export type AdminOrganizationsLazyQueryHookResult = ReturnType<
  typeof useAdminOrganizationsLazyQuery
>;
export const AdminOrganizationsUserDocument = gql`
  query AdminOrganizationsUser {
    me {
      ...AdminOrganizations_User
    }
  }
  ${AdminOrganizations_UserFragmentDoc}
`;

/**
 * __useAdminOrganizationsUserQuery__
 *
 * To run a query within a React component, call `useAdminOrganizationsUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useAdminOrganizationsUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAdminOrganizationsUserQuery({
 *   variables: {
 *   },
 * });
 */
export function useAdminOrganizationsUserQuery(
  baseOptions?: Apollo.QueryHookOptions<
    AdminOrganizationsUserQuery,
    AdminOrganizationsUserQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    AdminOrganizationsUserQuery,
    AdminOrganizationsUserQueryVariables
  >(AdminOrganizationsUserDocument, options);
}
export function useAdminOrganizationsUserLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    AdminOrganizationsUserQuery,
    AdminOrganizationsUserQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    AdminOrganizationsUserQuery,
    AdminOrganizationsUserQueryVariables
  >(AdminOrganizationsUserDocument, options);
}
export type AdminOrganizationsUserQueryHookResult = ReturnType<
  typeof useAdminOrganizationsUserQuery
>;
export type AdminOrganizationsUserLazyQueryHookResult = ReturnType<
  typeof useAdminOrganizationsUserLazyQuery
>;
export const AdminSupportMethodsUserDocument = gql`
  query AdminSupportMethodsUser {
    me {
      ...AdminSupportMethods_User
    }
  }
  ${AdminSupportMethods_UserFragmentDoc}
`;

/**
 * __useAdminSupportMethodsUserQuery__
 *
 * To run a query within a React component, call `useAdminSupportMethodsUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useAdminSupportMethodsUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAdminSupportMethodsUserQuery({
 *   variables: {
 *   },
 * });
 */
export function useAdminSupportMethodsUserQuery(
  baseOptions?: Apollo.QueryHookOptions<
    AdminSupportMethodsUserQuery,
    AdminSupportMethodsUserQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    AdminSupportMethodsUserQuery,
    AdminSupportMethodsUserQueryVariables
  >(AdminSupportMethodsUserDocument, options);
}
export function useAdminSupportMethodsUserLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    AdminSupportMethodsUserQuery,
    AdminSupportMethodsUserQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    AdminSupportMethodsUserQuery,
    AdminSupportMethodsUserQueryVariables
  >(AdminSupportMethodsUserDocument, options);
}
export type AdminSupportMethodsUserQueryHookResult = ReturnType<
  typeof useAdminSupportMethodsUserQuery
>;
export type AdminSupportMethodsUserLazyQueryHookResult = ReturnType<
  typeof useAdminSupportMethodsUserLazyQuery
>;
export const Contact_updateContactDocument = gql`
  mutation Contact_updateContact($id: GID!, $data: UpdateContactInput!) {
    updateContact(id: $id, data: $data) {
      ...Contact_Contact_Profile
    }
  }
  ${Contact_Contact_ProfileFragmentDoc}
`;

/**
 * __useContact_updateContactMutation__
 *
 * To run a mutation, you first call `useContact_updateContactMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useContact_updateContactMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [contactUpdateContactMutation, { data, loading, error }] = useContact_updateContactMutation({
 *   variables: {
 *      id: // value for 'id'
 *      data: // value for 'data'
 *   },
 * });
 */
export function useContact_updateContactMutation(
  baseOptions?: Apollo.MutationHookOptions<
    Contact_updateContactMutation,
    Contact_updateContactMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    Contact_updateContactMutation,
    Contact_updateContactMutationVariables
  >(Contact_updateContactDocument, options);
}
export type Contact_updateContactMutationHookResult = ReturnType<
  typeof useContact_updateContactMutation
>;
export const ContactUserDocument = gql`
  query ContactUser {
    me {
      ...Contact_User
    }
  }
  ${Contact_UserFragmentDoc}
`;

/**
 * __useContactUserQuery__
 *
 * To run a query within a React component, call `useContactUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useContactUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useContactUserQuery({
 *   variables: {
 *   },
 * });
 */
export function useContactUserQuery(
  baseOptions?: Apollo.QueryHookOptions<
    ContactUserQuery,
    ContactUserQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ContactUserQuery, ContactUserQueryVariables>(
    ContactUserDocument,
    options
  );
}
export function useContactUserLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ContactUserQuery,
    ContactUserQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<ContactUserQuery, ContactUserQueryVariables>(
    ContactUserDocument,
    options
  );
}
export type ContactUserQueryHookResult = ReturnType<typeof useContactUserQuery>;
export type ContactUserLazyQueryHookResult = ReturnType<
  typeof useContactUserLazyQuery
>;
export const ContactDocument = gql`
  query Contact($id: GID!, $hasPetitionSignature: Boolean!) {
    contact(id: $id) {
      ...Contact_Contact
    }
  }
  ${Contact_ContactFragmentDoc}
`;

/**
 * __useContactQuery__
 *
 * To run a query within a React component, call `useContactQuery` and pass it any options that fit your needs.
 * When your component renders, `useContactQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useContactQuery({
 *   variables: {
 *      id: // value for 'id'
 *      hasPetitionSignature: // value for 'hasPetitionSignature'
 *   },
 * });
 */
export function useContactQuery(
  baseOptions: Apollo.QueryHookOptions<ContactQuery, ContactQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ContactQuery, ContactQueryVariables>(
    ContactDocument,
    options
  );
}
export function useContactLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<ContactQuery, ContactQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<ContactQuery, ContactQueryVariables>(
    ContactDocument,
    options
  );
}
export type ContactQueryHookResult = ReturnType<typeof useContactQuery>;
export type ContactLazyQueryHookResult = ReturnType<typeof useContactLazyQuery>;
export const Contacts_deleteContactsDocument = gql`
  mutation Contacts_deleteContacts($ids: [GID!]!) {
    deleteContacts(ids: $ids)
  }
`;

/**
 * __useContacts_deleteContactsMutation__
 *
 * To run a mutation, you first call `useContacts_deleteContactsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useContacts_deleteContactsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [contactsDeleteContactsMutation, { data, loading, error }] = useContacts_deleteContactsMutation({
 *   variables: {
 *      ids: // value for 'ids'
 *   },
 * });
 */
export function useContacts_deleteContactsMutation(
  baseOptions?: Apollo.MutationHookOptions<
    Contacts_deleteContactsMutation,
    Contacts_deleteContactsMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    Contacts_deleteContactsMutation,
    Contacts_deleteContactsMutationVariables
  >(Contacts_deleteContactsDocument, options);
}
export type Contacts_deleteContactsMutationHookResult = ReturnType<
  typeof useContacts_deleteContactsMutation
>;
export const ContactsDocument = gql`
  query Contacts(
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
`;

/**
 * __useContactsQuery__
 *
 * To run a query within a React component, call `useContactsQuery` and pass it any options that fit your needs.
 * When your component renders, `useContactsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useContactsQuery({
 *   variables: {
 *      offset: // value for 'offset'
 *      limit: // value for 'limit'
 *      search: // value for 'search'
 *      sortBy: // value for 'sortBy'
 *   },
 * });
 */
export function useContactsQuery(
  baseOptions: Apollo.QueryHookOptions<ContactsQuery, ContactsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ContactsQuery, ContactsQueryVariables>(
    ContactsDocument,
    options
  );
}
export function useContactsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ContactsQuery,
    ContactsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<ContactsQuery, ContactsQueryVariables>(
    ContactsDocument,
    options
  );
}
export type ContactsQueryHookResult = ReturnType<typeof useContactsQuery>;
export type ContactsLazyQueryHookResult = ReturnType<
  typeof useContactsLazyQuery
>;
export const ContactsUserDocument = gql`
  query ContactsUser {
    me {
      ...Contacts_User
    }
  }
  ${Contacts_UserFragmentDoc}
`;

/**
 * __useContactsUserQuery__
 *
 * To run a query within a React component, call `useContactsUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useContactsUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useContactsUserQuery({
 *   variables: {
 *   },
 * });
 */
export function useContactsUserQuery(
  baseOptions?: Apollo.QueryHookOptions<
    ContactsUserQuery,
    ContactsUserQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ContactsUserQuery, ContactsUserQueryVariables>(
    ContactsUserDocument,
    options
  );
}
export function useContactsUserLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ContactsUserQuery,
    ContactsUserQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<ContactsUserQuery, ContactsUserQueryVariables>(
    ContactsUserDocument,
    options
  );
}
export type ContactsUserQueryHookResult = ReturnType<
  typeof useContactsUserQuery
>;
export type ContactsUserLazyQueryHookResult = ReturnType<
  typeof useContactsUserLazyQuery
>;
export const OrganizationBranding_updateOrgLogoDocument = gql`
  mutation OrganizationBranding_updateOrgLogo($orgId: GID!, $file: Upload!) {
    updateOrganizationLogo(orgId: $orgId, file: $file) {
      id
      logoUrl
    }
  }
`;

/**
 * __useOrganizationBranding_updateOrgLogoMutation__
 *
 * To run a mutation, you first call `useOrganizationBranding_updateOrgLogoMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useOrganizationBranding_updateOrgLogoMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [organizationBrandingUpdateOrgLogoMutation, { data, loading, error }] = useOrganizationBranding_updateOrgLogoMutation({
 *   variables: {
 *      orgId: // value for 'orgId'
 *      file: // value for 'file'
 *   },
 * });
 */
export function useOrganizationBranding_updateOrgLogoMutation(
  baseOptions?: Apollo.MutationHookOptions<
    OrganizationBranding_updateOrgLogoMutation,
    OrganizationBranding_updateOrgLogoMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    OrganizationBranding_updateOrgLogoMutation,
    OrganizationBranding_updateOrgLogoMutationVariables
  >(OrganizationBranding_updateOrgLogoDocument, options);
}
export type OrganizationBranding_updateOrgLogoMutationHookResult = ReturnType<
  typeof useOrganizationBranding_updateOrgLogoMutation
>;
export const OrganizationBrandingDocument = gql`
  query OrganizationBranding {
    me {
      ...SettingsLayout_User
      organization {
        id
        logoUrl
        identifier
      }
    }
  }
  ${SettingsLayout_UserFragmentDoc}
`;

/**
 * __useOrganizationBrandingQuery__
 *
 * To run a query within a React component, call `useOrganizationBrandingQuery` and pass it any options that fit your needs.
 * When your component renders, `useOrganizationBrandingQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOrganizationBrandingQuery({
 *   variables: {
 *   },
 * });
 */
export function useOrganizationBrandingQuery(
  baseOptions?: Apollo.QueryHookOptions<
    OrganizationBrandingQuery,
    OrganizationBrandingQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    OrganizationBrandingQuery,
    OrganizationBrandingQueryVariables
  >(OrganizationBrandingDocument, options);
}
export function useOrganizationBrandingLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    OrganizationBrandingQuery,
    OrganizationBrandingQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    OrganizationBrandingQuery,
    OrganizationBrandingQueryVariables
  >(OrganizationBrandingDocument, options);
}
export type OrganizationBrandingQueryHookResult = ReturnType<
  typeof useOrganizationBrandingQuery
>;
export type OrganizationBrandingLazyQueryHookResult = ReturnType<
  typeof useOrganizationBrandingLazyQuery
>;
export const OrganizationSettingsDocument = gql`
  query OrganizationSettings {
    me {
      id
      ...SettingsLayout_User
    }
  }
  ${SettingsLayout_UserFragmentDoc}
`;

/**
 * __useOrganizationSettingsQuery__
 *
 * To run a query within a React component, call `useOrganizationSettingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useOrganizationSettingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOrganizationSettingsQuery({
 *   variables: {
 *   },
 * });
 */
export function useOrganizationSettingsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    OrganizationSettingsQuery,
    OrganizationSettingsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    OrganizationSettingsQuery,
    OrganizationSettingsQueryVariables
  >(OrganizationSettingsDocument, options);
}
export function useOrganizationSettingsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    OrganizationSettingsQuery,
    OrganizationSettingsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    OrganizationSettingsQuery,
    OrganizationSettingsQueryVariables
  >(OrganizationSettingsDocument, options);
}
export type OrganizationSettingsQueryHookResult = ReturnType<
  typeof useOrganizationSettingsQuery
>;
export type OrganizationSettingsLazyQueryHookResult = ReturnType<
  typeof useOrganizationSettingsLazyQuery
>;
export const OrganizationUsers_createOrganizationUserDocument = gql`
  mutation OrganizationUsers_createOrganizationUser(
    $firstName: String!
    $lastName: String!
    $email: String!
    $role: OrganizationRole!
  ) {
    createOrganizationUser(
      email: $email
      firstName: $firstName
      lastName: $lastName
      role: $role
    ) {
      ...OrganizationUsers_User
    }
  }
  ${OrganizationUsers_UserFragmentDoc}
`;

/**
 * __useOrganizationUsers_createOrganizationUserMutation__
 *
 * To run a mutation, you first call `useOrganizationUsers_createOrganizationUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useOrganizationUsers_createOrganizationUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [organizationUsersCreateOrganizationUserMutation, { data, loading, error }] = useOrganizationUsers_createOrganizationUserMutation({
 *   variables: {
 *      firstName: // value for 'firstName'
 *      lastName: // value for 'lastName'
 *      email: // value for 'email'
 *      role: // value for 'role'
 *   },
 * });
 */
export function useOrganizationUsers_createOrganizationUserMutation(
  baseOptions?: Apollo.MutationHookOptions<
    OrganizationUsers_createOrganizationUserMutation,
    OrganizationUsers_createOrganizationUserMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    OrganizationUsers_createOrganizationUserMutation,
    OrganizationUsers_createOrganizationUserMutationVariables
  >(OrganizationUsers_createOrganizationUserDocument, options);
}
export type OrganizationUsers_createOrganizationUserMutationHookResult = ReturnType<
  typeof useOrganizationUsers_createOrganizationUserMutation
>;
export const OrganizationUsers_updateUserStatusDocument = gql`
  mutation OrganizationUsers_updateUserStatus(
    $userIds: [GID!]!
    $newStatus: UserStatus!
    $transferToUserId: GID
  ) {
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

/**
 * __useOrganizationUsers_updateUserStatusMutation__
 *
 * To run a mutation, you first call `useOrganizationUsers_updateUserStatusMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useOrganizationUsers_updateUserStatusMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [organizationUsersUpdateUserStatusMutation, { data, loading, error }] = useOrganizationUsers_updateUserStatusMutation({
 *   variables: {
 *      userIds: // value for 'userIds'
 *      newStatus: // value for 'newStatus'
 *      transferToUserId: // value for 'transferToUserId'
 *   },
 * });
 */
export function useOrganizationUsers_updateUserStatusMutation(
  baseOptions?: Apollo.MutationHookOptions<
    OrganizationUsers_updateUserStatusMutation,
    OrganizationUsers_updateUserStatusMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    OrganizationUsers_updateUserStatusMutation,
    OrganizationUsers_updateUserStatusMutationVariables
  >(OrganizationUsers_updateUserStatusDocument, options);
}
export type OrganizationUsers_updateUserStatusMutationHookResult = ReturnType<
  typeof useOrganizationUsers_updateUserStatusMutation
>;
export const OrganizationUsersDocument = gql`
  query OrganizationUsers(
    $offset: Int!
    $limit: Int!
    $search: String
    $sortBy: [OrganizationUsers_OrderBy!]
  ) {
    me {
      organization {
        id
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
    }
  }
  ${OrganizationUsers_UserFragmentDoc}
  ${SettingsLayout_UserFragmentDoc}
`;

/**
 * __useOrganizationUsersQuery__
 *
 * To run a query within a React component, call `useOrganizationUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useOrganizationUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOrganizationUsersQuery({
 *   variables: {
 *      offset: // value for 'offset'
 *      limit: // value for 'limit'
 *      search: // value for 'search'
 *      sortBy: // value for 'sortBy'
 *   },
 * });
 */
export function useOrganizationUsersQuery(
  baseOptions: Apollo.QueryHookOptions<
    OrganizationUsersQuery,
    OrganizationUsersQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    OrganizationUsersQuery,
    OrganizationUsersQueryVariables
  >(OrganizationUsersDocument, options);
}
export function useOrganizationUsersLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    OrganizationUsersQuery,
    OrganizationUsersQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    OrganizationUsersQuery,
    OrganizationUsersQueryVariables
  >(OrganizationUsersDocument, options);
}
export type OrganizationUsersQueryHookResult = ReturnType<
  typeof useOrganizationUsersQuery
>;
export type OrganizationUsersLazyQueryHookResult = ReturnType<
  typeof useOrganizationUsersLazyQuery
>;
export const PetitionActivity_updatePetitionDocument = gql`
  mutation PetitionActivity_updatePetition(
    $petitionId: GID!
    $data: UpdatePetitionInput!
  ) {
    updatePetition(petitionId: $petitionId, data: $data) {
      ...PetitionActivity_Petition
    }
  }
  ${PetitionActivity_PetitionFragmentDoc}
`;

/**
 * __usePetitionActivity_updatePetitionMutation__
 *
 * To run a mutation, you first call `usePetitionActivity_updatePetitionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionActivity_updatePetitionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionActivityUpdatePetitionMutation, { data, loading, error }] = usePetitionActivity_updatePetitionMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      data: // value for 'data'
 *   },
 * });
 */
export function usePetitionActivity_updatePetitionMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionActivity_updatePetitionMutation,
    PetitionActivity_updatePetitionMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionActivity_updatePetitionMutation,
    PetitionActivity_updatePetitionMutationVariables
  >(PetitionActivity_updatePetitionDocument, options);
}
export type PetitionActivity_updatePetitionMutationHookResult = ReturnType<
  typeof usePetitionActivity_updatePetitionMutation
>;
export const PetitionActivity_sendRemindersDocument = gql`
  mutation PetitionActivity_sendReminders(
    $petitionId: GID!
    $accessIds: [GID!]!
    $body: JSON
  ) {
    sendReminders(petitionId: $petitionId, accessIds: $accessIds, body: $body)
  }
`;

/**
 * __usePetitionActivity_sendRemindersMutation__
 *
 * To run a mutation, you first call `usePetitionActivity_sendRemindersMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionActivity_sendRemindersMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionActivitySendRemindersMutation, { data, loading, error }] = usePetitionActivity_sendRemindersMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      accessIds: // value for 'accessIds'
 *      body: // value for 'body'
 *   },
 * });
 */
export function usePetitionActivity_sendRemindersMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionActivity_sendRemindersMutation,
    PetitionActivity_sendRemindersMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionActivity_sendRemindersMutation,
    PetitionActivity_sendRemindersMutationVariables
  >(PetitionActivity_sendRemindersDocument, options);
}
export type PetitionActivity_sendRemindersMutationHookResult = ReturnType<
  typeof usePetitionActivity_sendRemindersMutation
>;
export const PetitionActivity_deactivateAccessesDocument = gql`
  mutation PetitionActivity_deactivateAccesses(
    $petitionId: GID!
    $accessIds: [GID!]!
  ) {
    deactivateAccesses(petitionId: $petitionId, accessIds: $accessIds) {
      id
      status
    }
  }
`;

/**
 * __usePetitionActivity_deactivateAccessesMutation__
 *
 * To run a mutation, you first call `usePetitionActivity_deactivateAccessesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionActivity_deactivateAccessesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionActivityDeactivateAccessesMutation, { data, loading, error }] = usePetitionActivity_deactivateAccessesMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      accessIds: // value for 'accessIds'
 *   },
 * });
 */
export function usePetitionActivity_deactivateAccessesMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionActivity_deactivateAccessesMutation,
    PetitionActivity_deactivateAccessesMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionActivity_deactivateAccessesMutation,
    PetitionActivity_deactivateAccessesMutationVariables
  >(PetitionActivity_deactivateAccessesDocument, options);
}
export type PetitionActivity_deactivateAccessesMutationHookResult = ReturnType<
  typeof usePetitionActivity_deactivateAccessesMutation
>;
export const PetitionActivity_reactivateAccessesDocument = gql`
  mutation PetitionActivity_reactivateAccesses(
    $petitionId: GID!
    $accessIds: [GID!]!
  ) {
    reactivateAccesses(petitionId: $petitionId, accessIds: $accessIds) {
      id
      status
    }
  }
`;

/**
 * __usePetitionActivity_reactivateAccessesMutation__
 *
 * To run a mutation, you first call `usePetitionActivity_reactivateAccessesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionActivity_reactivateAccessesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionActivityReactivateAccessesMutation, { data, loading, error }] = usePetitionActivity_reactivateAccessesMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      accessIds: // value for 'accessIds'
 *   },
 * });
 */
export function usePetitionActivity_reactivateAccessesMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionActivity_reactivateAccessesMutation,
    PetitionActivity_reactivateAccessesMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionActivity_reactivateAccessesMutation,
    PetitionActivity_reactivateAccessesMutationVariables
  >(PetitionActivity_reactivateAccessesDocument, options);
}
export type PetitionActivity_reactivateAccessesMutationHookResult = ReturnType<
  typeof usePetitionActivity_reactivateAccessesMutation
>;
export const PetitionActivity_cancelScheduledMessageDocument = gql`
  mutation PetitionActivity_cancelScheduledMessage(
    $petitionId: GID!
    $messageId: GID!
  ) {
    cancelScheduledMessage(petitionId: $petitionId, messageId: $messageId) {
      id
      status
    }
  }
`;

/**
 * __usePetitionActivity_cancelScheduledMessageMutation__
 *
 * To run a mutation, you first call `usePetitionActivity_cancelScheduledMessageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionActivity_cancelScheduledMessageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionActivityCancelScheduledMessageMutation, { data, loading, error }] = usePetitionActivity_cancelScheduledMessageMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      messageId: // value for 'messageId'
 *   },
 * });
 */
export function usePetitionActivity_cancelScheduledMessageMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionActivity_cancelScheduledMessageMutation,
    PetitionActivity_cancelScheduledMessageMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionActivity_cancelScheduledMessageMutation,
    PetitionActivity_cancelScheduledMessageMutationVariables
  >(PetitionActivity_cancelScheduledMessageDocument, options);
}
export type PetitionActivity_cancelScheduledMessageMutationHookResult = ReturnType<
  typeof usePetitionActivity_cancelScheduledMessageMutation
>;
export const PetitionsActivity_sendPetitionDocument = gql`
  mutation PetitionsActivity_sendPetition(
    $petitionId: GID!
    $contactIds: [GID!]!
    $subject: String!
    $body: JSON!
    $remindersConfig: RemindersConfigInput
    $scheduledAt: DateTime
  ) {
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

/**
 * __usePetitionsActivity_sendPetitionMutation__
 *
 * To run a mutation, you first call `usePetitionsActivity_sendPetitionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionsActivity_sendPetitionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionsActivitySendPetitionMutation, { data, loading, error }] = usePetitionsActivity_sendPetitionMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      contactIds: // value for 'contactIds'
 *      subject: // value for 'subject'
 *      body: // value for 'body'
 *      remindersConfig: // value for 'remindersConfig'
 *      scheduledAt: // value for 'scheduledAt'
 *   },
 * });
 */
export function usePetitionsActivity_sendPetitionMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionsActivity_sendPetitionMutation,
    PetitionsActivity_sendPetitionMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionsActivity_sendPetitionMutation,
    PetitionsActivity_sendPetitionMutationVariables
  >(PetitionsActivity_sendPetitionDocument, options);
}
export type PetitionsActivity_sendPetitionMutationHookResult = ReturnType<
  typeof usePetitionsActivity_sendPetitionMutation
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
`;

/**
 * __usePetitionActivity_switchAutomaticRemindersMutation__
 *
 * To run a mutation, you first call `usePetitionActivity_switchAutomaticRemindersMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionActivity_switchAutomaticRemindersMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionActivitySwitchAutomaticRemindersMutation, { data, loading, error }] = usePetitionActivity_switchAutomaticRemindersMutation({
 *   variables: {
 *      start: // value for 'start'
 *      petitionId: // value for 'petitionId'
 *      accessIds: // value for 'accessIds'
 *      remindersConfig: // value for 'remindersConfig'
 *   },
 * });
 */
export function usePetitionActivity_switchAutomaticRemindersMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionActivity_switchAutomaticRemindersMutation,
    PetitionActivity_switchAutomaticRemindersMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionActivity_switchAutomaticRemindersMutation,
    PetitionActivity_switchAutomaticRemindersMutationVariables
  >(PetitionActivity_switchAutomaticRemindersDocument, options);
}
export type PetitionActivity_switchAutomaticRemindersMutationHookResult = ReturnType<
  typeof usePetitionActivity_switchAutomaticRemindersMutation
>;
export const PetitionActivityDocument = gql`
  query PetitionActivity($id: GID!) {
    petition(id: $id) {
      ...PetitionActivity_Petition
    }
  }
  ${PetitionActivity_PetitionFragmentDoc}
`;

/**
 * __usePetitionActivityQuery__
 *
 * To run a query within a React component, call `usePetitionActivityQuery` and pass it any options that fit your needs.
 * When your component renders, `usePetitionActivityQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePetitionActivityQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function usePetitionActivityQuery(
  baseOptions: Apollo.QueryHookOptions<
    PetitionActivityQuery,
    PetitionActivityQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<PetitionActivityQuery, PetitionActivityQueryVariables>(
    PetitionActivityDocument,
    options
  );
}
export function usePetitionActivityLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PetitionActivityQuery,
    PetitionActivityQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    PetitionActivityQuery,
    PetitionActivityQueryVariables
  >(PetitionActivityDocument, options);
}
export type PetitionActivityQueryHookResult = ReturnType<
  typeof usePetitionActivityQuery
>;
export type PetitionActivityLazyQueryHookResult = ReturnType<
  typeof usePetitionActivityLazyQuery
>;
export const PetitionActivityUserDocument = gql`
  query PetitionActivityUser {
    me {
      ...PetitionActivity_User
    }
  }
  ${PetitionActivity_UserFragmentDoc}
`;

/**
 * __usePetitionActivityUserQuery__
 *
 * To run a query within a React component, call `usePetitionActivityUserQuery` and pass it any options that fit your needs.
 * When your component renders, `usePetitionActivityUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePetitionActivityUserQuery({
 *   variables: {
 *   },
 * });
 */
export function usePetitionActivityUserQuery(
  baseOptions?: Apollo.QueryHookOptions<
    PetitionActivityUserQuery,
    PetitionActivityUserQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    PetitionActivityUserQuery,
    PetitionActivityUserQueryVariables
  >(PetitionActivityUserDocument, options);
}
export function usePetitionActivityUserLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PetitionActivityUserQuery,
    PetitionActivityUserQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    PetitionActivityUserQuery,
    PetitionActivityUserQueryVariables
  >(PetitionActivityUserDocument, options);
}
export type PetitionActivityUserQueryHookResult = ReturnType<
  typeof usePetitionActivityUserQuery
>;
export type PetitionActivityUserLazyQueryHookResult = ReturnType<
  typeof usePetitionActivityUserLazyQuery
>;
export const PetitionCompose_updatePetitionDocument = gql`
  mutation PetitionCompose_updatePetition(
    $petitionId: GID!
    $data: UpdatePetitionInput!
    $hasPetitionSignature: Boolean!
  ) {
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
`;

/**
 * __usePetitionCompose_updatePetitionMutation__
 *
 * To run a mutation, you first call `usePetitionCompose_updatePetitionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionCompose_updatePetitionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionComposeUpdatePetitionMutation, { data, loading, error }] = usePetitionCompose_updatePetitionMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      data: // value for 'data'
 *      hasPetitionSignature: // value for 'hasPetitionSignature'
 *   },
 * });
 */
export function usePetitionCompose_updatePetitionMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionCompose_updatePetitionMutation,
    PetitionCompose_updatePetitionMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionCompose_updatePetitionMutation,
    PetitionCompose_updatePetitionMutationVariables
  >(PetitionCompose_updatePetitionDocument, options);
}
export type PetitionCompose_updatePetitionMutationHookResult = ReturnType<
  typeof usePetitionCompose_updatePetitionMutation
>;
export const PetitionCompose_updateFieldPositionsDocument = gql`
  mutation PetitionCompose_updateFieldPositions(
    $petitionId: GID!
    $fieldIds: [GID!]!
  ) {
    updateFieldPositions(petitionId: $petitionId, fieldIds: $fieldIds) {
      id
      ...PetitionLayout_PetitionBase
      fields {
        id
      }
    }
  }
  ${PetitionLayout_PetitionBaseFragmentDoc}
`;

/**
 * __usePetitionCompose_updateFieldPositionsMutation__
 *
 * To run a mutation, you first call `usePetitionCompose_updateFieldPositionsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionCompose_updateFieldPositionsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionComposeUpdateFieldPositionsMutation, { data, loading, error }] = usePetitionCompose_updateFieldPositionsMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      fieldIds: // value for 'fieldIds'
 *   },
 * });
 */
export function usePetitionCompose_updateFieldPositionsMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionCompose_updateFieldPositionsMutation,
    PetitionCompose_updateFieldPositionsMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionCompose_updateFieldPositionsMutation,
    PetitionCompose_updateFieldPositionsMutationVariables
  >(PetitionCompose_updateFieldPositionsDocument, options);
}
export type PetitionCompose_updateFieldPositionsMutationHookResult = ReturnType<
  typeof usePetitionCompose_updateFieldPositionsMutation
>;
export const PetitionCompose_createPetitionFieldDocument = gql`
  mutation PetitionCompose_createPetitionField(
    $petitionId: GID!
    $type: PetitionFieldType!
    $position: Int
  ) {
    createPetitionField(
      petitionId: $petitionId
      type: $type
      position: $position
    ) {
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
  ${PetitionLayout_PetitionBaseFragmentDoc}
`;

/**
 * __usePetitionCompose_createPetitionFieldMutation__
 *
 * To run a mutation, you first call `usePetitionCompose_createPetitionFieldMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionCompose_createPetitionFieldMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionComposeCreatePetitionFieldMutation, { data, loading, error }] = usePetitionCompose_createPetitionFieldMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      type: // value for 'type'
 *      position: // value for 'position'
 *   },
 * });
 */
export function usePetitionCompose_createPetitionFieldMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionCompose_createPetitionFieldMutation,
    PetitionCompose_createPetitionFieldMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionCompose_createPetitionFieldMutation,
    PetitionCompose_createPetitionFieldMutationVariables
  >(PetitionCompose_createPetitionFieldDocument, options);
}
export type PetitionCompose_createPetitionFieldMutationHookResult = ReturnType<
  typeof usePetitionCompose_createPetitionFieldMutation
>;
export const PetitionCompose_clonePetitionFieldDocument = gql`
  mutation PetitionCompose_clonePetitionField(
    $petitionId: GID!
    $fieldId: GID!
  ) {
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
  ${PetitionLayout_PetitionBaseFragmentDoc}
`;

/**
 * __usePetitionCompose_clonePetitionFieldMutation__
 *
 * To run a mutation, you first call `usePetitionCompose_clonePetitionFieldMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionCompose_clonePetitionFieldMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionComposeClonePetitionFieldMutation, { data, loading, error }] = usePetitionCompose_clonePetitionFieldMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      fieldId: // value for 'fieldId'
 *   },
 * });
 */
export function usePetitionCompose_clonePetitionFieldMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionCompose_clonePetitionFieldMutation,
    PetitionCompose_clonePetitionFieldMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionCompose_clonePetitionFieldMutation,
    PetitionCompose_clonePetitionFieldMutationVariables
  >(PetitionCompose_clonePetitionFieldDocument, options);
}
export type PetitionCompose_clonePetitionFieldMutationHookResult = ReturnType<
  typeof usePetitionCompose_clonePetitionFieldMutation
>;
export const PetitionCompose_deletePetitionFieldDocument = gql`
  mutation PetitionCompose_deletePetitionField(
    $petitionId: GID!
    $fieldId: GID!
    $force: Boolean
  ) {
    deletePetitionField(
      petitionId: $petitionId
      fieldId: $fieldId
      force: $force
    ) {
      id
      ...PetitionLayout_PetitionBase
      fields {
        id
      }
    }
  }
  ${PetitionLayout_PetitionBaseFragmentDoc}
`;

/**
 * __usePetitionCompose_deletePetitionFieldMutation__
 *
 * To run a mutation, you first call `usePetitionCompose_deletePetitionFieldMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionCompose_deletePetitionFieldMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionComposeDeletePetitionFieldMutation, { data, loading, error }] = usePetitionCompose_deletePetitionFieldMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      fieldId: // value for 'fieldId'
 *      force: // value for 'force'
 *   },
 * });
 */
export function usePetitionCompose_deletePetitionFieldMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionCompose_deletePetitionFieldMutation,
    PetitionCompose_deletePetitionFieldMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionCompose_deletePetitionFieldMutation,
    PetitionCompose_deletePetitionFieldMutationVariables
  >(PetitionCompose_deletePetitionFieldDocument, options);
}
export type PetitionCompose_deletePetitionFieldMutationHookResult = ReturnType<
  typeof usePetitionCompose_deletePetitionFieldMutation
>;
export const PetitionCompose_updatePetitionFieldDocument = gql`
  mutation PetitionCompose_updatePetitionField(
    $petitionId: GID!
    $fieldId: GID!
    $data: UpdatePetitionFieldInput!
  ) {
    updatePetitionField(
      petitionId: $petitionId
      fieldId: $fieldId
      data: $data
    ) {
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
  ${PetitionCompose_PetitionFieldFragmentDoc}
`;

/**
 * __usePetitionCompose_updatePetitionFieldMutation__
 *
 * To run a mutation, you first call `usePetitionCompose_updatePetitionFieldMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionCompose_updatePetitionFieldMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionComposeUpdatePetitionFieldMutation, { data, loading, error }] = usePetitionCompose_updatePetitionFieldMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      fieldId: // value for 'fieldId'
 *      data: // value for 'data'
 *   },
 * });
 */
export function usePetitionCompose_updatePetitionFieldMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionCompose_updatePetitionFieldMutation,
    PetitionCompose_updatePetitionFieldMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionCompose_updatePetitionFieldMutation,
    PetitionCompose_updatePetitionFieldMutationVariables
  >(PetitionCompose_updatePetitionFieldDocument, options);
}
export type PetitionCompose_updatePetitionFieldMutationHookResult = ReturnType<
  typeof usePetitionCompose_updatePetitionFieldMutation
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
      field {
        id
        ...PetitionCompose_PetitionField
      }
      petition {
        id
        updatedAt
      }
    }
  }
  ${PetitionCompose_PetitionFieldFragmentDoc}
`;

/**
 * __usePetitionCompose_changePetitionFieldTypeMutation__
 *
 * To run a mutation, you first call `usePetitionCompose_changePetitionFieldTypeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionCompose_changePetitionFieldTypeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionComposeChangePetitionFieldTypeMutation, { data, loading, error }] = usePetitionCompose_changePetitionFieldTypeMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      fieldId: // value for 'fieldId'
 *      type: // value for 'type'
 *      force: // value for 'force'
 *   },
 * });
 */
export function usePetitionCompose_changePetitionFieldTypeMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionCompose_changePetitionFieldTypeMutation,
    PetitionCompose_changePetitionFieldTypeMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionCompose_changePetitionFieldTypeMutation,
    PetitionCompose_changePetitionFieldTypeMutationVariables
  >(PetitionCompose_changePetitionFieldTypeDocument, options);
}
export type PetitionCompose_changePetitionFieldTypeMutationHookResult = ReturnType<
  typeof usePetitionCompose_changePetitionFieldTypeMutation
>;
export const PetitionCompose_batchSendPetitionDocument = gql`
  mutation PetitionCompose_batchSendPetition(
    $petitionId: GID!
    $contactIdGroups: [[GID!]!]!
    $subject: String!
    $body: JSON!
    $remindersConfig: RemindersConfigInput
    $scheduledAt: DateTime
  ) {
    batchSendPetition(
      petitionId: $petitionId
      contactIdGroups: $contactIdGroups
      subject: $subject
      body: $body
      remindersConfig: $remindersConfig
      scheduledAt: $scheduledAt
    ) {
      result
      petition {
        id
        status
      }
    }
  }
`;

/**
 * __usePetitionCompose_batchSendPetitionMutation__
 *
 * To run a mutation, you first call `usePetitionCompose_batchSendPetitionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionCompose_batchSendPetitionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionComposeBatchSendPetitionMutation, { data, loading, error }] = usePetitionCompose_batchSendPetitionMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      contactIdGroups: // value for 'contactIdGroups'
 *      subject: // value for 'subject'
 *      body: // value for 'body'
 *      remindersConfig: // value for 'remindersConfig'
 *      scheduledAt: // value for 'scheduledAt'
 *   },
 * });
 */
export function usePetitionCompose_batchSendPetitionMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionCompose_batchSendPetitionMutation,
    PetitionCompose_batchSendPetitionMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionCompose_batchSendPetitionMutation,
    PetitionCompose_batchSendPetitionMutationVariables
  >(PetitionCompose_batchSendPetitionDocument, options);
}
export type PetitionCompose_batchSendPetitionMutationHookResult = ReturnType<
  typeof usePetitionCompose_batchSendPetitionMutation
>;
export const PetitionComposeUserDocument = gql`
  query PetitionComposeUser {
    me {
      ...PetitionCompose_User
    }
  }
  ${PetitionCompose_UserFragmentDoc}
`;

/**
 * __usePetitionComposeUserQuery__
 *
 * To run a query within a React component, call `usePetitionComposeUserQuery` and pass it any options that fit your needs.
 * When your component renders, `usePetitionComposeUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePetitionComposeUserQuery({
 *   variables: {
 *   },
 * });
 */
export function usePetitionComposeUserQuery(
  baseOptions?: Apollo.QueryHookOptions<
    PetitionComposeUserQuery,
    PetitionComposeUserQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    PetitionComposeUserQuery,
    PetitionComposeUserQueryVariables
  >(PetitionComposeUserDocument, options);
}
export function usePetitionComposeUserLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PetitionComposeUserQuery,
    PetitionComposeUserQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    PetitionComposeUserQuery,
    PetitionComposeUserQueryVariables
  >(PetitionComposeUserDocument, options);
}
export type PetitionComposeUserQueryHookResult = ReturnType<
  typeof usePetitionComposeUserQuery
>;
export type PetitionComposeUserLazyQueryHookResult = ReturnType<
  typeof usePetitionComposeUserLazyQuery
>;
export const PetitionComposeDocument = gql`
  query PetitionCompose($id: GID!, $hasPetitionSignature: Boolean!) {
    petition(id: $id) {
      ...PetitionCompose_PetitionBase
    }
  }
  ${PetitionCompose_PetitionBaseFragmentDoc}
`;

/**
 * __usePetitionComposeQuery__
 *
 * To run a query within a React component, call `usePetitionComposeQuery` and pass it any options that fit your needs.
 * When your component renders, `usePetitionComposeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePetitionComposeQuery({
 *   variables: {
 *      id: // value for 'id'
 *      hasPetitionSignature: // value for 'hasPetitionSignature'
 *   },
 * });
 */
export function usePetitionComposeQuery(
  baseOptions: Apollo.QueryHookOptions<
    PetitionComposeQuery,
    PetitionComposeQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<PetitionComposeQuery, PetitionComposeQueryVariables>(
    PetitionComposeDocument,
    options
  );
}
export function usePetitionComposeLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PetitionComposeQuery,
    PetitionComposeQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    PetitionComposeQuery,
    PetitionComposeQueryVariables
  >(PetitionComposeDocument, options);
}
export type PetitionComposeQueryHookResult = ReturnType<
  typeof usePetitionComposeQuery
>;
export type PetitionComposeLazyQueryHookResult = ReturnType<
  typeof usePetitionComposeLazyQuery
>;
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

/**
 * __usePetitionQuery__
 *
 * To run a query within a React component, call `usePetitionQuery` and pass it any options that fit your needs.
 * When your component renders, `usePetitionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePetitionQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function usePetitionQuery(
  baseOptions: Apollo.QueryHookOptions<PetitionQuery, PetitionQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<PetitionQuery, PetitionQueryVariables>(
    PetitionDocument,
    options
  );
}
export function usePetitionLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PetitionQuery,
    PetitionQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<PetitionQuery, PetitionQueryVariables>(
    PetitionDocument,
    options
  );
}
export type PetitionQueryHookResult = ReturnType<typeof usePetitionQuery>;
export type PetitionLazyQueryHookResult = ReturnType<
  typeof usePetitionLazyQuery
>;
export const PetitionReplies_updatePetitionDocument = gql`
  mutation PetitionReplies_updatePetition(
    $petitionId: GID!
    $data: UpdatePetitionInput!
  ) {
    updatePetition(petitionId: $petitionId, data: $data) {
      ...PetitionLayout_PetitionBase
    }
  }
  ${PetitionLayout_PetitionBaseFragmentDoc}
`;

/**
 * __usePetitionReplies_updatePetitionMutation__
 *
 * To run a mutation, you first call `usePetitionReplies_updatePetitionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionReplies_updatePetitionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionRepliesUpdatePetitionMutation, { data, loading, error }] = usePetitionReplies_updatePetitionMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      data: // value for 'data'
 *   },
 * });
 */
export function usePetitionReplies_updatePetitionMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionReplies_updatePetitionMutation,
    PetitionReplies_updatePetitionMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionReplies_updatePetitionMutation,
    PetitionReplies_updatePetitionMutationVariables
  >(PetitionReplies_updatePetitionDocument, options);
}
export type PetitionReplies_updatePetitionMutationHookResult = ReturnType<
  typeof usePetitionReplies_updatePetitionMutation
>;
export const PetitionReplies_validatePetitionFieldsDocument = gql`
  mutation PetitionReplies_validatePetitionFields(
    $petitionId: GID!
    $fieldIds: [GID!]!
    $value: Boolean!
    $validateRepliesWith: PetitionFieldReplyStatus
  ) {
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

/**
 * __usePetitionReplies_validatePetitionFieldsMutation__
 *
 * To run a mutation, you first call `usePetitionReplies_validatePetitionFieldsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionReplies_validatePetitionFieldsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionRepliesValidatePetitionFieldsMutation, { data, loading, error }] = usePetitionReplies_validatePetitionFieldsMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      fieldIds: // value for 'fieldIds'
 *      value: // value for 'value'
 *      validateRepliesWith: // value for 'validateRepliesWith'
 *   },
 * });
 */
export function usePetitionReplies_validatePetitionFieldsMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionReplies_validatePetitionFieldsMutation,
    PetitionReplies_validatePetitionFieldsMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionReplies_validatePetitionFieldsMutation,
    PetitionReplies_validatePetitionFieldsMutationVariables
  >(PetitionReplies_validatePetitionFieldsDocument, options);
}
export type PetitionReplies_validatePetitionFieldsMutationHookResult = ReturnType<
  typeof usePetitionReplies_validatePetitionFieldsMutation
>;
export const PetitionReplies_fileUploadReplyDownloadLinkDocument = gql`
  mutation PetitionReplies_fileUploadReplyDownloadLink(
    $petitionId: GID!
    $replyId: GID!
    $preview: Boolean
  ) {
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

/**
 * __usePetitionReplies_fileUploadReplyDownloadLinkMutation__
 *
 * To run a mutation, you first call `usePetitionReplies_fileUploadReplyDownloadLinkMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionReplies_fileUploadReplyDownloadLinkMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionRepliesFileUploadReplyDownloadLinkMutation, { data, loading, error }] = usePetitionReplies_fileUploadReplyDownloadLinkMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      replyId: // value for 'replyId'
 *      preview: // value for 'preview'
 *   },
 * });
 */
export function usePetitionReplies_fileUploadReplyDownloadLinkMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionReplies_fileUploadReplyDownloadLinkMutation,
    PetitionReplies_fileUploadReplyDownloadLinkMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionReplies_fileUploadReplyDownloadLinkMutation,
    PetitionReplies_fileUploadReplyDownloadLinkMutationVariables
  >(PetitionReplies_fileUploadReplyDownloadLinkDocument, options);
}
export type PetitionReplies_fileUploadReplyDownloadLinkMutationHookResult = ReturnType<
  typeof usePetitionReplies_fileUploadReplyDownloadLinkMutation
>;
export const PetitionReplies_createPetitionFieldCommentDocument = gql`
  mutation PetitionReplies_createPetitionFieldComment(
    $petitionId: GID!
    $petitionFieldId: GID!
    $petitionFieldReplyId: GID
    $content: String!
    $isInternal: Boolean
    $hasInternalComments: Boolean!
  ) {
    createPetitionFieldComment(
      petitionId: $petitionId
      petitionFieldId: $petitionFieldId
      petitionFieldReplyId: $petitionFieldReplyId
      content: $content
      isInternal: $isInternal
    ) {
      ...PetitionRepliesFieldComments_PetitionFieldComment
    }
  }
  ${PetitionRepliesFieldComments_PetitionFieldCommentFragmentDoc}
`;

/**
 * __usePetitionReplies_createPetitionFieldCommentMutation__
 *
 * To run a mutation, you first call `usePetitionReplies_createPetitionFieldCommentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionReplies_createPetitionFieldCommentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionRepliesCreatePetitionFieldCommentMutation, { data, loading, error }] = usePetitionReplies_createPetitionFieldCommentMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      petitionFieldId: // value for 'petitionFieldId'
 *      petitionFieldReplyId: // value for 'petitionFieldReplyId'
 *      content: // value for 'content'
 *      isInternal: // value for 'isInternal'
 *      hasInternalComments: // value for 'hasInternalComments'
 *   },
 * });
 */
export function usePetitionReplies_createPetitionFieldCommentMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionReplies_createPetitionFieldCommentMutation,
    PetitionReplies_createPetitionFieldCommentMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionReplies_createPetitionFieldCommentMutation,
    PetitionReplies_createPetitionFieldCommentMutationVariables
  >(PetitionReplies_createPetitionFieldCommentDocument, options);
}
export type PetitionReplies_createPetitionFieldCommentMutationHookResult = ReturnType<
  typeof usePetitionReplies_createPetitionFieldCommentMutation
>;
export const PetitionReplies_updatePetitionFieldCommentDocument = gql`
  mutation PetitionReplies_updatePetitionFieldComment(
    $petitionId: GID!
    $petitionFieldId: GID!
    $petitionFieldCommentId: GID!
    $content: String!
    $hasInternalComments: Boolean!
  ) {
    updatePetitionFieldComment(
      petitionId: $petitionId
      petitionFieldId: $petitionFieldId
      petitionFieldCommentId: $petitionFieldCommentId
      content: $content
    ) {
      ...PetitionRepliesFieldComments_PetitionFieldComment
    }
  }
  ${PetitionRepliesFieldComments_PetitionFieldCommentFragmentDoc}
`;

/**
 * __usePetitionReplies_updatePetitionFieldCommentMutation__
 *
 * To run a mutation, you first call `usePetitionReplies_updatePetitionFieldCommentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionReplies_updatePetitionFieldCommentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionRepliesUpdatePetitionFieldCommentMutation, { data, loading, error }] = usePetitionReplies_updatePetitionFieldCommentMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      petitionFieldId: // value for 'petitionFieldId'
 *      petitionFieldCommentId: // value for 'petitionFieldCommentId'
 *      content: // value for 'content'
 *      hasInternalComments: // value for 'hasInternalComments'
 *   },
 * });
 */
export function usePetitionReplies_updatePetitionFieldCommentMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionReplies_updatePetitionFieldCommentMutation,
    PetitionReplies_updatePetitionFieldCommentMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionReplies_updatePetitionFieldCommentMutation,
    PetitionReplies_updatePetitionFieldCommentMutationVariables
  >(PetitionReplies_updatePetitionFieldCommentDocument, options);
}
export type PetitionReplies_updatePetitionFieldCommentMutationHookResult = ReturnType<
  typeof usePetitionReplies_updatePetitionFieldCommentMutation
>;
export const PetitionReplies_deletePetitionFieldCommentDocument = gql`
  mutation PetitionReplies_deletePetitionFieldComment(
    $petitionId: GID!
    $petitionFieldId: GID!
    $petitionFieldCommentId: GID!
  ) {
    deletePetitionFieldComment(
      petitionId: $petitionId
      petitionFieldId: $petitionFieldId
      petitionFieldCommentId: $petitionFieldCommentId
    )
  }
`;

/**
 * __usePetitionReplies_deletePetitionFieldCommentMutation__
 *
 * To run a mutation, you first call `usePetitionReplies_deletePetitionFieldCommentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionReplies_deletePetitionFieldCommentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionRepliesDeletePetitionFieldCommentMutation, { data, loading, error }] = usePetitionReplies_deletePetitionFieldCommentMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      petitionFieldId: // value for 'petitionFieldId'
 *      petitionFieldCommentId: // value for 'petitionFieldCommentId'
 *   },
 * });
 */
export function usePetitionReplies_deletePetitionFieldCommentMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionReplies_deletePetitionFieldCommentMutation,
    PetitionReplies_deletePetitionFieldCommentMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionReplies_deletePetitionFieldCommentMutation,
    PetitionReplies_deletePetitionFieldCommentMutationVariables
  >(PetitionReplies_deletePetitionFieldCommentDocument, options);
}
export type PetitionReplies_deletePetitionFieldCommentMutationHookResult = ReturnType<
  typeof usePetitionReplies_deletePetitionFieldCommentMutation
>;
export const PetitionReplies_submitUnpublishedCommentsDocument = gql`
  mutation PetitionReplies_submitUnpublishedComments($petitionId: GID!) {
    submitUnpublishedComments(petitionId: $petitionId) {
      id
      publishedAt
    }
  }
`;

/**
 * __usePetitionReplies_submitUnpublishedCommentsMutation__
 *
 * To run a mutation, you first call `usePetitionReplies_submitUnpublishedCommentsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionReplies_submitUnpublishedCommentsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionRepliesSubmitUnpublishedCommentsMutation, { data, loading, error }] = usePetitionReplies_submitUnpublishedCommentsMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *   },
 * });
 */
export function usePetitionReplies_submitUnpublishedCommentsMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionReplies_submitUnpublishedCommentsMutation,
    PetitionReplies_submitUnpublishedCommentsMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionReplies_submitUnpublishedCommentsMutation,
    PetitionReplies_submitUnpublishedCommentsMutationVariables
  >(PetitionReplies_submitUnpublishedCommentsDocument, options);
}
export type PetitionReplies_submitUnpublishedCommentsMutationHookResult = ReturnType<
  typeof usePetitionReplies_submitUnpublishedCommentsMutation
>;
export const PetitionReplies_markPetitionFieldCommentsAsReadDocument = gql`
  mutation PetitionReplies_markPetitionFieldCommentsAsRead(
    $petitionId: GID!
    $petitionFieldCommentIds: [GID!]!
  ) {
    markPetitionFieldCommentsAsRead(
      petitionId: $petitionId
      petitionFieldCommentIds: $petitionFieldCommentIds
    ) {
      id
      isUnread
    }
  }
`;

/**
 * __usePetitionReplies_markPetitionFieldCommentsAsReadMutation__
 *
 * To run a mutation, you first call `usePetitionReplies_markPetitionFieldCommentsAsReadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionReplies_markPetitionFieldCommentsAsReadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionRepliesMarkPetitionFieldCommentsAsReadMutation, { data, loading, error }] = usePetitionReplies_markPetitionFieldCommentsAsReadMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      petitionFieldCommentIds: // value for 'petitionFieldCommentIds'
 *   },
 * });
 */
export function usePetitionReplies_markPetitionFieldCommentsAsReadMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionReplies_markPetitionFieldCommentsAsReadMutation,
    PetitionReplies_markPetitionFieldCommentsAsReadMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionReplies_markPetitionFieldCommentsAsReadMutation,
    PetitionReplies_markPetitionFieldCommentsAsReadMutationVariables
  >(PetitionReplies_markPetitionFieldCommentsAsReadDocument, options);
}
export type PetitionReplies_markPetitionFieldCommentsAsReadMutationHookResult = ReturnType<
  typeof usePetitionReplies_markPetitionFieldCommentsAsReadMutation
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

/**
 * __usePetitionReplies_updatePetitionFieldRepliesStatusMutation__
 *
 * To run a mutation, you first call `usePetitionReplies_updatePetitionFieldRepliesStatusMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionReplies_updatePetitionFieldRepliesStatusMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionRepliesUpdatePetitionFieldRepliesStatusMutation, { data, loading, error }] = usePetitionReplies_updatePetitionFieldRepliesStatusMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      petitionFieldId: // value for 'petitionFieldId'
 *      petitionFieldReplyIds: // value for 'petitionFieldReplyIds'
 *      status: // value for 'status'
 *   },
 * });
 */
export function usePetitionReplies_updatePetitionFieldRepliesStatusMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionReplies_updatePetitionFieldRepliesStatusMutation,
    PetitionReplies_updatePetitionFieldRepliesStatusMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionReplies_updatePetitionFieldRepliesStatusMutation,
    PetitionReplies_updatePetitionFieldRepliesStatusMutationVariables
  >(PetitionReplies_updatePetitionFieldRepliesStatusDocument, options);
}
export type PetitionReplies_updatePetitionFieldRepliesStatusMutationHookResult = ReturnType<
  typeof usePetitionReplies_updatePetitionFieldRepliesStatusMutation
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
`;

/**
 * __usePetitionReplies_sendPetitionClosedNotificationMutation__
 *
 * To run a mutation, you first call `usePetitionReplies_sendPetitionClosedNotificationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionReplies_sendPetitionClosedNotificationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionRepliesSendPetitionClosedNotificationMutation, { data, loading, error }] = usePetitionReplies_sendPetitionClosedNotificationMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      emailBody: // value for 'emailBody'
 *      attachPdfExport: // value for 'attachPdfExport'
 *      pdfExportTitle: // value for 'pdfExportTitle'
 *      force: // value for 'force'
 *   },
 * });
 */
export function usePetitionReplies_sendPetitionClosedNotificationMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionReplies_sendPetitionClosedNotificationMutation,
    PetitionReplies_sendPetitionClosedNotificationMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    PetitionReplies_sendPetitionClosedNotificationMutation,
    PetitionReplies_sendPetitionClosedNotificationMutationVariables
  >(PetitionReplies_sendPetitionClosedNotificationDocument, options);
}
export type PetitionReplies_sendPetitionClosedNotificationMutationHookResult = ReturnType<
  typeof usePetitionReplies_sendPetitionClosedNotificationMutation
>;
export const PetitionRepliesUserDocument = gql`
  query PetitionRepliesUser {
    me {
      ...PetitionReplies_User
    }
  }
  ${PetitionReplies_UserFragmentDoc}
`;

/**
 * __usePetitionRepliesUserQuery__
 *
 * To run a query within a React component, call `usePetitionRepliesUserQuery` and pass it any options that fit your needs.
 * When your component renders, `usePetitionRepliesUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePetitionRepliesUserQuery({
 *   variables: {
 *   },
 * });
 */
export function usePetitionRepliesUserQuery(
  baseOptions?: Apollo.QueryHookOptions<
    PetitionRepliesUserQuery,
    PetitionRepliesUserQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    PetitionRepliesUserQuery,
    PetitionRepliesUserQueryVariables
  >(PetitionRepliesUserDocument, options);
}
export function usePetitionRepliesUserLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PetitionRepliesUserQuery,
    PetitionRepliesUserQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    PetitionRepliesUserQuery,
    PetitionRepliesUserQueryVariables
  >(PetitionRepliesUserDocument, options);
}
export type PetitionRepliesUserQueryHookResult = ReturnType<
  typeof usePetitionRepliesUserQuery
>;
export type PetitionRepliesUserLazyQueryHookResult = ReturnType<
  typeof usePetitionRepliesUserLazyQuery
>;
export const PetitionRepliesDocument = gql`
  query PetitionReplies(
    $id: GID!
    $hasPetitionSignature: Boolean!
    $hasInternalComments: Boolean!
  ) {
    petition(id: $id) {
      ...PetitionReplies_Petition
    }
  }
  ${PetitionReplies_PetitionFragmentDoc}
`;

/**
 * __usePetitionRepliesQuery__
 *
 * To run a query within a React component, call `usePetitionRepliesQuery` and pass it any options that fit your needs.
 * When your component renders, `usePetitionRepliesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePetitionRepliesQuery({
 *   variables: {
 *      id: // value for 'id'
 *      hasPetitionSignature: // value for 'hasPetitionSignature'
 *      hasInternalComments: // value for 'hasInternalComments'
 *   },
 * });
 */
export function usePetitionRepliesQuery(
  baseOptions: Apollo.QueryHookOptions<
    PetitionRepliesQuery,
    PetitionRepliesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<PetitionRepliesQuery, PetitionRepliesQueryVariables>(
    PetitionRepliesDocument,
    options
  );
}
export function usePetitionRepliesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PetitionRepliesQuery,
    PetitionRepliesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    PetitionRepliesQuery,
    PetitionRepliesQueryVariables
  >(PetitionRepliesDocument, options);
}
export type PetitionRepliesQueryHookResult = ReturnType<
  typeof usePetitionRepliesQuery
>;
export type PetitionRepliesLazyQueryHookResult = ReturnType<
  typeof usePetitionRepliesLazyQuery
>;
export const PetitionsUserDocument = gql`
  query PetitionsUser {
    me {
      ...Petitions_User
    }
  }
  ${Petitions_UserFragmentDoc}
`;

/**
 * __usePetitionsUserQuery__
 *
 * To run a query within a React component, call `usePetitionsUserQuery` and pass it any options that fit your needs.
 * When your component renders, `usePetitionsUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePetitionsUserQuery({
 *   variables: {
 *   },
 * });
 */
export function usePetitionsUserQuery(
  baseOptions?: Apollo.QueryHookOptions<
    PetitionsUserQuery,
    PetitionsUserQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<PetitionsUserQuery, PetitionsUserQueryVariables>(
    PetitionsUserDocument,
    options
  );
}
export function usePetitionsUserLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PetitionsUserQuery,
    PetitionsUserQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<PetitionsUserQuery, PetitionsUserQueryVariables>(
    PetitionsUserDocument,
    options
  );
}
export type PetitionsUserQueryHookResult = ReturnType<
  typeof usePetitionsUserQuery
>;
export type PetitionsUserLazyQueryHookResult = ReturnType<
  typeof usePetitionsUserLazyQuery
>;
export const PetitionsDocument = gql`
  query Petitions(
    $offset: Int!
    $limit: Int!
    $search: String
    $sortBy: [QueryPetitions_OrderBy!]
    $status: PetitionStatus
    $type: PetitionBaseType
    $hasPetitionSignature: Boolean!
  ) {
    petitions(
      offset: $offset
      limit: $limit
      search: $search
      sortBy: $sortBy
      type: $type
      status: $status
    ) {
      ...Petitions_PetitionBasePagination
    }
  }
  ${Petitions_PetitionBasePaginationFragmentDoc}
`;

/**
 * __usePetitionsQuery__
 *
 * To run a query within a React component, call `usePetitionsQuery` and pass it any options that fit your needs.
 * When your component renders, `usePetitionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePetitionsQuery({
 *   variables: {
 *      offset: // value for 'offset'
 *      limit: // value for 'limit'
 *      search: // value for 'search'
 *      sortBy: // value for 'sortBy'
 *      status: // value for 'status'
 *      type: // value for 'type'
 *      hasPetitionSignature: // value for 'hasPetitionSignature'
 *   },
 * });
 */
export function usePetitionsQuery(
  baseOptions: Apollo.QueryHookOptions<PetitionsQuery, PetitionsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<PetitionsQuery, PetitionsQueryVariables>(
    PetitionsDocument,
    options
  );
}
export function usePetitionsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PetitionsQuery,
    PetitionsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<PetitionsQuery, PetitionsQueryVariables>(
    PetitionsDocument,
    options
  );
}
export type PetitionsQueryHookResult = ReturnType<typeof usePetitionsQuery>;
export type PetitionsLazyQueryHookResult = ReturnType<
  typeof usePetitionsLazyQuery
>;
export const NewPetitionPublicTemplatesDocument = gql`
  query NewPetitionPublicTemplates(
    $offset: Int!
    $limit: Int!
    $search: String
    $locale: PetitionLocale
  ) {
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
  ${NewPetition_PetitionTemplateFragmentDoc}
`;

/**
 * __useNewPetitionPublicTemplatesQuery__
 *
 * To run a query within a React component, call `useNewPetitionPublicTemplatesQuery` and pass it any options that fit your needs.
 * When your component renders, `useNewPetitionPublicTemplatesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useNewPetitionPublicTemplatesQuery({
 *   variables: {
 *      offset: // value for 'offset'
 *      limit: // value for 'limit'
 *      search: // value for 'search'
 *      locale: // value for 'locale'
 *   },
 * });
 */
export function useNewPetitionPublicTemplatesQuery(
  baseOptions: Apollo.QueryHookOptions<
    NewPetitionPublicTemplatesQuery,
    NewPetitionPublicTemplatesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    NewPetitionPublicTemplatesQuery,
    NewPetitionPublicTemplatesQueryVariables
  >(NewPetitionPublicTemplatesDocument, options);
}
export function useNewPetitionPublicTemplatesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    NewPetitionPublicTemplatesQuery,
    NewPetitionPublicTemplatesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    NewPetitionPublicTemplatesQuery,
    NewPetitionPublicTemplatesQueryVariables
  >(NewPetitionPublicTemplatesDocument, options);
}
export type NewPetitionPublicTemplatesQueryHookResult = ReturnType<
  typeof useNewPetitionPublicTemplatesQuery
>;
export type NewPetitionPublicTemplatesLazyQueryHookResult = ReturnType<
  typeof useNewPetitionPublicTemplatesLazyQuery
>;
export const NewPetitionTemplatesDocument = gql`
  query NewPetitionTemplates(
    $offset: Int!
    $limit: Int!
    $search: String
    $locale: PetitionLocale
  ) {
    templates: petitions(
      offset: $offset
      limit: $limit
      search: $search
      locale: $locale
      sortBy: [lastUsedAt_DESC]
      type: TEMPLATE
    ) {
      items {
        ...NewPetition_PetitionTemplate
      }
      totalCount
    }
    hasTemplates: petitions(type: TEMPLATE) {
      totalCount
    }
  }
  ${NewPetition_PetitionTemplateFragmentDoc}
`;

/**
 * __useNewPetitionTemplatesQuery__
 *
 * To run a query within a React component, call `useNewPetitionTemplatesQuery` and pass it any options that fit your needs.
 * When your component renders, `useNewPetitionTemplatesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useNewPetitionTemplatesQuery({
 *   variables: {
 *      offset: // value for 'offset'
 *      limit: // value for 'limit'
 *      search: // value for 'search'
 *      locale: // value for 'locale'
 *   },
 * });
 */
export function useNewPetitionTemplatesQuery(
  baseOptions: Apollo.QueryHookOptions<
    NewPetitionTemplatesQuery,
    NewPetitionTemplatesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    NewPetitionTemplatesQuery,
    NewPetitionTemplatesQueryVariables
  >(NewPetitionTemplatesDocument, options);
}
export function useNewPetitionTemplatesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    NewPetitionTemplatesQuery,
    NewPetitionTemplatesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    NewPetitionTemplatesQuery,
    NewPetitionTemplatesQueryVariables
  >(NewPetitionTemplatesDocument, options);
}
export type NewPetitionTemplatesQueryHookResult = ReturnType<
  typeof useNewPetitionTemplatesQuery
>;
export type NewPetitionTemplatesLazyQueryHookResult = ReturnType<
  typeof useNewPetitionTemplatesLazyQuery
>;
export const NewPetitionUserDocument = gql`
  query NewPetitionUser {
    me {
      ...NewPetition_User
    }
  }
  ${NewPetition_UserFragmentDoc}
`;

/**
 * __useNewPetitionUserQuery__
 *
 * To run a query within a React component, call `useNewPetitionUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useNewPetitionUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useNewPetitionUserQuery({
 *   variables: {
 *   },
 * });
 */
export function useNewPetitionUserQuery(
  baseOptions?: Apollo.QueryHookOptions<
    NewPetitionUserQuery,
    NewPetitionUserQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<NewPetitionUserQuery, NewPetitionUserQueryVariables>(
    NewPetitionUserDocument,
    options
  );
}
export function useNewPetitionUserLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    NewPetitionUserQuery,
    NewPetitionUserQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    NewPetitionUserQuery,
    NewPetitionUserQueryVariables
  >(NewPetitionUserDocument, options);
}
export type NewPetitionUserQueryHookResult = ReturnType<
  typeof useNewPetitionUserQuery
>;
export type NewPetitionUserLazyQueryHookResult = ReturnType<
  typeof useNewPetitionUserLazyQuery
>;
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

/**
 * __useAccount_updateAccountMutation__
 *
 * To run a mutation, you first call `useAccount_updateAccountMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAccount_updateAccountMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [accountUpdateAccountMutation, { data, loading, error }] = useAccount_updateAccountMutation({
 *   variables: {
 *      id: // value for 'id'
 *      data: // value for 'data'
 *   },
 * });
 */
export function useAccount_updateAccountMutation(
  baseOptions?: Apollo.MutationHookOptions<
    Account_updateAccountMutation,
    Account_updateAccountMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    Account_updateAccountMutation,
    Account_updateAccountMutationVariables
  >(Account_updateAccountDocument, options);
}
export type Account_updateAccountMutationHookResult = ReturnType<
  typeof useAccount_updateAccountMutation
>;
export const AccountDocument = gql`
  query Account {
    me {
      id
      ...Account_User
    }
  }
  ${Account_UserFragmentDoc}
`;

/**
 * __useAccountQuery__
 *
 * To run a query within a React component, call `useAccountQuery` and pass it any options that fit your needs.
 * When your component renders, `useAccountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAccountQuery({
 *   variables: {
 *   },
 * });
 */
export function useAccountQuery(
  baseOptions?: Apollo.QueryHookOptions<AccountQuery, AccountQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<AccountQuery, AccountQueryVariables>(
    AccountDocument,
    options
  );
}
export function useAccountLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<AccountQuery, AccountQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<AccountQuery, AccountQueryVariables>(
    AccountDocument,
    options
  );
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
  ${Settings_UserFragmentDoc}
`;

/**
 * __useSettingsQuery__
 *
 * To run a query within a React component, call `useSettingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSettingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSettingsQuery({
 *   variables: {
 *   },
 * });
 */
export function useSettingsQuery(
  baseOptions?: Apollo.QueryHookOptions<SettingsQuery, SettingsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<SettingsQuery, SettingsQueryVariables>(
    SettingsDocument,
    options
  );
}
export function useSettingsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    SettingsQuery,
    SettingsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<SettingsQuery, SettingsQueryVariables>(
    SettingsDocument,
    options
  );
}
export type SettingsQueryHookResult = ReturnType<typeof useSettingsQuery>;
export type SettingsLazyQueryHookResult = ReturnType<
  typeof useSettingsLazyQuery
>;
export const Security_updatePasswordDocument = gql`
  mutation Security_updatePassword($password: String!, $newPassword: String!) {
    changePassword(password: $password, newPassword: $newPassword)
  }
`;

/**
 * __useSecurity_updatePasswordMutation__
 *
 * To run a mutation, you first call `useSecurity_updatePasswordMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSecurity_updatePasswordMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [securityUpdatePasswordMutation, { data, loading, error }] = useSecurity_updatePasswordMutation({
 *   variables: {
 *      password: // value for 'password'
 *      newPassword: // value for 'newPassword'
 *   },
 * });
 */
export function useSecurity_updatePasswordMutation(
  baseOptions?: Apollo.MutationHookOptions<
    Security_updatePasswordMutation,
    Security_updatePasswordMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    Security_updatePasswordMutation,
    Security_updatePasswordMutationVariables
  >(Security_updatePasswordDocument, options);
}
export type Security_updatePasswordMutationHookResult = ReturnType<
  typeof useSecurity_updatePasswordMutation
>;
export const SecurityDocument = gql`
  query Security {
    me {
      ...SettingsLayout_User
      ...useSettingsSections_User
    }
  }
  ${SettingsLayout_UserFragmentDoc}
  ${useSettingsSections_UserFragmentDoc}
`;

/**
 * __useSecurityQuery__
 *
 * To run a query within a React component, call `useSecurityQuery` and pass it any options that fit your needs.
 * When your component renders, `useSecurityQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSecurityQuery({
 *   variables: {
 *   },
 * });
 */
export function useSecurityQuery(
  baseOptions?: Apollo.QueryHookOptions<SecurityQuery, SecurityQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<SecurityQuery, SecurityQueryVariables>(
    SecurityDocument,
    options
  );
}
export function useSecurityLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    SecurityQuery,
    SecurityQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<SecurityQuery, SecurityQueryVariables>(
    SecurityDocument,
    options
  );
}
export type SecurityQueryHookResult = ReturnType<typeof useSecurityQuery>;
export type SecurityLazyQueryHookResult = ReturnType<
  typeof useSecurityLazyQuery
>;
export const RevokeUserAuthTokenDocument = gql`
  mutation RevokeUserAuthToken($authTokenIds: [GID!]!) {
    revokeUserAuthToken(authTokenIds: $authTokenIds)
  }
`;

/**
 * __useRevokeUserAuthTokenMutation__
 *
 * To run a mutation, you first call `useRevokeUserAuthTokenMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRevokeUserAuthTokenMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [revokeUserAuthTokenMutation, { data, loading, error }] = useRevokeUserAuthTokenMutation({
 *   variables: {
 *      authTokenIds: // value for 'authTokenIds'
 *   },
 * });
 */
export function useRevokeUserAuthTokenMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RevokeUserAuthTokenMutation,
    RevokeUserAuthTokenMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RevokeUserAuthTokenMutation,
    RevokeUserAuthTokenMutationVariables
  >(RevokeUserAuthTokenDocument, options);
}
export type RevokeUserAuthTokenMutationHookResult = ReturnType<
  typeof useRevokeUserAuthTokenMutation
>;
export const TokensDocument = gql`
  query Tokens(
    $offset: Int!
    $limit: Int!
    $search: String
    $sortBy: [UserAuthenticationTokens_OrderBy!]
  ) {
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
  ${useSettingsSections_UserFragmentDoc}
`;

/**
 * __useTokensQuery__
 *
 * To run a query within a React component, call `useTokensQuery` and pass it any options that fit your needs.
 * When your component renders, `useTokensQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTokensQuery({
 *   variables: {
 *      offset: // value for 'offset'
 *      limit: // value for 'limit'
 *      search: // value for 'search'
 *      sortBy: // value for 'sortBy'
 *   },
 * });
 */
export function useTokensQuery(
  baseOptions: Apollo.QueryHookOptions<TokensQuery, TokensQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<TokensQuery, TokensQueryVariables>(
    TokensDocument,
    options
  );
}
export function useTokensLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<TokensQuery, TokensQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<TokensQuery, TokensQueryVariables>(
    TokensDocument,
    options
  );
}
export type TokensQueryHookResult = ReturnType<typeof useTokensQuery>;
export type TokensLazyQueryHookResult = ReturnType<typeof useTokensLazyQuery>;
export const CurrentUserDocument = gql`
  query CurrentUser {
    me {
      ...Login_User
    }
  }
  ${Login_UserFragmentDoc}
`;

/**
 * __useCurrentUserQuery__
 *
 * To run a query within a React component, call `useCurrentUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useCurrentUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCurrentUserQuery({
 *   variables: {
 *   },
 * });
 */
export function useCurrentUserQuery(
  baseOptions?: Apollo.QueryHookOptions<
    CurrentUserQuery,
    CurrentUserQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<CurrentUserQuery, CurrentUserQueryVariables>(
    CurrentUserDocument,
    options
  );
}
export function useCurrentUserLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    CurrentUserQuery,
    CurrentUserQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<CurrentUserQuery, CurrentUserQueryVariables>(
    CurrentUserDocument,
    options
  );
}
export type CurrentUserQueryHookResult = ReturnType<typeof useCurrentUserQuery>;
export type CurrentUserLazyQueryHookResult = ReturnType<
  typeof useCurrentUserLazyQuery
>;
export const RecipientView_publicCompletePetitionDocument = gql`
  mutation RecipientView_publicCompletePetition(
    $keycode: ID!
    $signer: PublicPetitionSignerData
  ) {
    publicCompletePetition(keycode: $keycode, signer: $signer) {
      id
      status
    }
  }
`;

/**
 * __useRecipientView_publicCompletePetitionMutation__
 *
 * To run a mutation, you first call `useRecipientView_publicCompletePetitionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRecipientView_publicCompletePetitionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [recipientViewPublicCompletePetitionMutation, { data, loading, error }] = useRecipientView_publicCompletePetitionMutation({
 *   variables: {
 *      keycode: // value for 'keycode'
 *      signer: // value for 'signer'
 *   },
 * });
 */
export function useRecipientView_publicCompletePetitionMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RecipientView_publicCompletePetitionMutation,
    RecipientView_publicCompletePetitionMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RecipientView_publicCompletePetitionMutation,
    RecipientView_publicCompletePetitionMutationVariables
  >(RecipientView_publicCompletePetitionDocument, options);
}
export type RecipientView_publicCompletePetitionMutationHookResult = ReturnType<
  typeof useRecipientView_publicCompletePetitionMutation
>;
export const RecipientView_submitUnpublishedCommentsDocument = gql`
  mutation RecipientView_submitUnpublishedComments($keycode: ID!) {
    publicSubmitUnpublishedComments(keycode: $keycode) {
      id
      publishedAt
    }
  }
`;

/**
 * __useRecipientView_submitUnpublishedCommentsMutation__
 *
 * To run a mutation, you first call `useRecipientView_submitUnpublishedCommentsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRecipientView_submitUnpublishedCommentsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [recipientViewSubmitUnpublishedCommentsMutation, { data, loading, error }] = useRecipientView_submitUnpublishedCommentsMutation({
 *   variables: {
 *      keycode: // value for 'keycode'
 *   },
 * });
 */
export function useRecipientView_submitUnpublishedCommentsMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RecipientView_submitUnpublishedCommentsMutation,
    RecipientView_submitUnpublishedCommentsMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RecipientView_submitUnpublishedCommentsMutation,
    RecipientView_submitUnpublishedCommentsMutationVariables
  >(RecipientView_submitUnpublishedCommentsDocument, options);
}
export type RecipientView_submitUnpublishedCommentsMutationHookResult = ReturnType<
  typeof useRecipientView_submitUnpublishedCommentsMutation
>;
export const PublicPetitionDocument = gql`
  query PublicPetition($keycode: ID!) {
    access(keycode: $keycode) {
      ...RecipientView_PublicPetitionAccess
    }
  }
  ${RecipientView_PublicPetitionAccessFragmentDoc}
`;

/**
 * __usePublicPetitionQuery__
 *
 * To run a query within a React component, call `usePublicPetitionQuery` and pass it any options that fit your needs.
 * When your component renders, `usePublicPetitionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePublicPetitionQuery({
 *   variables: {
 *      keycode: // value for 'keycode'
 *   },
 * });
 */
export function usePublicPetitionQuery(
  baseOptions: Apollo.QueryHookOptions<
    PublicPetitionQuery,
    PublicPetitionQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<PublicPetitionQuery, PublicPetitionQueryVariables>(
    PublicPetitionDocument,
    options
  );
}
export function usePublicPetitionLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PublicPetitionQuery,
    PublicPetitionQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<PublicPetitionQuery, PublicPetitionQueryVariables>(
    PublicPetitionDocument,
    options
  );
}
export type PublicPetitionQueryHookResult = ReturnType<
  typeof usePublicPetitionQuery
>;
export type PublicPetitionLazyQueryHookResult = ReturnType<
  typeof usePublicPetitionLazyQuery
>;
export const RecipientView_verifyPublicAccessDocument = gql`
  mutation RecipientView_verifyPublicAccess(
    $token: ID!
    $keycode: ID!
    $ip: String
    $userAgent: String
  ) {
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

/**
 * __useRecipientView_verifyPublicAccessMutation__
 *
 * To run a mutation, you first call `useRecipientView_verifyPublicAccessMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRecipientView_verifyPublicAccessMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [recipientViewVerifyPublicAccessMutation, { data, loading, error }] = useRecipientView_verifyPublicAccessMutation({
 *   variables: {
 *      token: // value for 'token'
 *      keycode: // value for 'keycode'
 *      ip: // value for 'ip'
 *      userAgent: // value for 'userAgent'
 *   },
 * });
 */
export function useRecipientView_verifyPublicAccessMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RecipientView_verifyPublicAccessMutation,
    RecipientView_verifyPublicAccessMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RecipientView_verifyPublicAccessMutation,
    RecipientView_verifyPublicAccessMutationVariables
  >(RecipientView_verifyPublicAccessDocument, options);
}
export type RecipientView_verifyPublicAccessMutationHookResult = ReturnType<
  typeof useRecipientView_verifyPublicAccessMutation
>;
export const publicSendVerificationCodeDocument = gql`
  mutation publicSendVerificationCode($keycode: ID!) {
    publicSendVerificationCode(keycode: $keycode) {
      token
      remainingAttempts
      expiresAt
    }
  }
`;

/**
 * __usepublicSendVerificationCodeMutation__
 *
 * To run a mutation, you first call `usepublicSendVerificationCodeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usepublicSendVerificationCodeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [publicSendVerificationCodeMutation, { data, loading, error }] = usepublicSendVerificationCodeMutation({
 *   variables: {
 *      keycode: // value for 'keycode'
 *   },
 * });
 */
export function usepublicSendVerificationCodeMutation(
  baseOptions?: Apollo.MutationHookOptions<
    publicSendVerificationCodeMutation,
    publicSendVerificationCodeMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    publicSendVerificationCodeMutation,
    publicSendVerificationCodeMutationVariables
  >(publicSendVerificationCodeDocument, options);
}
export type publicSendVerificationCodeMutationHookResult = ReturnType<
  typeof usepublicSendVerificationCodeMutation
>;
export const publicCheckVerificationCodeDocument = gql`
  mutation publicCheckVerificationCode(
    $keycode: ID!
    $token: ID!
    $code: String!
  ) {
    publicCheckVerificationCode(keycode: $keycode, token: $token, code: $code) {
      result
      remainingAttempts
    }
  }
`;

/**
 * __usepublicCheckVerificationCodeMutation__
 *
 * To run a mutation, you first call `usepublicCheckVerificationCodeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usepublicCheckVerificationCodeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [publicCheckVerificationCodeMutation, { data, loading, error }] = usepublicCheckVerificationCodeMutation({
 *   variables: {
 *      keycode: // value for 'keycode'
 *      token: // value for 'token'
 *      code: // value for 'code'
 *   },
 * });
 */
export function usepublicCheckVerificationCodeMutation(
  baseOptions?: Apollo.MutationHookOptions<
    publicCheckVerificationCodeMutation,
    publicCheckVerificationCodeMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    publicCheckVerificationCodeMutation,
    publicCheckVerificationCodeMutationVariables
  >(publicCheckVerificationCodeDocument, options);
}
export type publicCheckVerificationCodeMutationHookResult = ReturnType<
  typeof usepublicCheckVerificationCodeMutation
>;
export const PdfViewPetitionDocument = gql`
  query PdfViewPetition($token: String!) {
    petitionAuthToken(token: $token) {
      ...PetitionPdf_Petition
    }
  }
  ${PetitionPdf_PetitionFragmentDoc}
`;

/**
 * __usePdfViewPetitionQuery__
 *
 * To run a query within a React component, call `usePdfViewPetitionQuery` and pass it any options that fit your needs.
 * When your component renders, `usePdfViewPetitionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePdfViewPetitionQuery({
 *   variables: {
 *      token: // value for 'token'
 *   },
 * });
 */
export function usePdfViewPetitionQuery(
  baseOptions: Apollo.QueryHookOptions<
    PdfViewPetitionQuery,
    PdfViewPetitionQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<PdfViewPetitionQuery, PdfViewPetitionQueryVariables>(
    PdfViewPetitionDocument,
    options
  );
}
export function usePdfViewPetitionLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PdfViewPetitionQuery,
    PdfViewPetitionQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    PdfViewPetitionQuery,
    PdfViewPetitionQueryVariables
  >(PdfViewPetitionDocument, options);
}
export type PdfViewPetitionQueryHookResult = ReturnType<
  typeof usePdfViewPetitionQuery
>;
export type PdfViewPetitionLazyQueryHookResult = ReturnType<
  typeof usePdfViewPetitionLazyQuery
>;
export const Thanks_PetitionLogoDocument = gql`
  query Thanks_PetitionLogo($id: GID!) {
    publicOrgLogoUrl(id: $id)
  }
`;

/**
 * __useThanks_PetitionLogoQuery__
 *
 * To run a query within a React component, call `useThanks_PetitionLogoQuery` and pass it any options that fit your needs.
 * When your component renders, `useThanks_PetitionLogoQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useThanks_PetitionLogoQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useThanks_PetitionLogoQuery(
  baseOptions: Apollo.QueryHookOptions<
    Thanks_PetitionLogoQuery,
    Thanks_PetitionLogoQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    Thanks_PetitionLogoQuery,
    Thanks_PetitionLogoQueryVariables
  >(Thanks_PetitionLogoDocument, options);
}
export function useThanks_PetitionLogoLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    Thanks_PetitionLogoQuery,
    Thanks_PetitionLogoQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    Thanks_PetitionLogoQuery,
    Thanks_PetitionLogoQueryVariables
  >(Thanks_PetitionLogoDocument, options);
}
export type Thanks_PetitionLogoQueryHookResult = ReturnType<
  typeof useThanks_PetitionLogoQuery
>;
export type Thanks_PetitionLogoLazyQueryHookResult = ReturnType<
  typeof useThanks_PetitionLogoLazyQuery
>;
export const useClonePetitions_clonePetitionsDocument = gql`
  mutation useClonePetitions_clonePetitions($petitionIds: [GID!]!) {
    clonePetitions(petitionIds: $petitionIds) {
      id
    }
  }
`;

/**
 * __useuseClonePetitions_clonePetitionsMutation__
 *
 * To run a mutation, you first call `useuseClonePetitions_clonePetitionsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useuseClonePetitions_clonePetitionsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [useClonePetitionsClonePetitionsMutation, { data, loading, error }] = useuseClonePetitions_clonePetitionsMutation({
 *   variables: {
 *      petitionIds: // value for 'petitionIds'
 *   },
 * });
 */
export function useuseClonePetitions_clonePetitionsMutation(
  baseOptions?: Apollo.MutationHookOptions<
    useClonePetitions_clonePetitionsMutation,
    useClonePetitions_clonePetitionsMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    useClonePetitions_clonePetitionsMutation,
    useClonePetitions_clonePetitionsMutationVariables
  >(useClonePetitions_clonePetitionsDocument, options);
}
export type useClonePetitions_clonePetitionsMutationHookResult = ReturnType<
  typeof useuseClonePetitions_clonePetitionsMutation
>;
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

/**
 * __useuseCreateContact_createContactMutation__
 *
 * To run a mutation, you first call `useuseCreateContact_createContactMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useuseCreateContact_createContactMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [useCreateContactCreateContactMutation, { data, loading, error }] = useuseCreateContact_createContactMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useuseCreateContact_createContactMutation(
  baseOptions?: Apollo.MutationHookOptions<
    useCreateContact_createContactMutation,
    useCreateContact_createContactMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    useCreateContact_createContactMutation,
    useCreateContact_createContactMutationVariables
  >(useCreateContact_createContactDocument, options);
}
export type useCreateContact_createContactMutationHookResult = ReturnType<
  typeof useuseCreateContact_createContactMutation
>;
export const useCreatePetition_createPetitionDocument = gql`
  mutation useCreatePetition_createPetition(
    $name: String
    $locale: PetitionLocale!
    $petitionId: GID
    $type: PetitionBaseType
  ) {
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

/**
 * __useuseCreatePetition_createPetitionMutation__
 *
 * To run a mutation, you first call `useuseCreatePetition_createPetitionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useuseCreatePetition_createPetitionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [useCreatePetitionCreatePetitionMutation, { data, loading, error }] = useuseCreatePetition_createPetitionMutation({
 *   variables: {
 *      name: // value for 'name'
 *      locale: // value for 'locale'
 *      petitionId: // value for 'petitionId'
 *      type: // value for 'type'
 *   },
 * });
 */
export function useuseCreatePetition_createPetitionMutation(
  baseOptions?: Apollo.MutationHookOptions<
    useCreatePetition_createPetitionMutation,
    useCreatePetition_createPetitionMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    useCreatePetition_createPetitionMutation,
    useCreatePetition_createPetitionMutationVariables
  >(useCreatePetition_createPetitionDocument, options);
}
export type useCreatePetition_createPetitionMutationHookResult = ReturnType<
  typeof useuseCreatePetition_createPetitionMutation
>;
export const useDeletePetitions_deletePetitionsDocument = gql`
  mutation useDeletePetitions_deletePetitions($ids: [GID!]!) {
    deletePetitions(ids: $ids)
  }
`;

/**
 * __useuseDeletePetitions_deletePetitionsMutation__
 *
 * To run a mutation, you first call `useuseDeletePetitions_deletePetitionsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useuseDeletePetitions_deletePetitionsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [useDeletePetitionsDeletePetitionsMutation, { data, loading, error }] = useuseDeletePetitions_deletePetitionsMutation({
 *   variables: {
 *      ids: // value for 'ids'
 *   },
 * });
 */
export function useuseDeletePetitions_deletePetitionsMutation(
  baseOptions?: Apollo.MutationHookOptions<
    useDeletePetitions_deletePetitionsMutation,
    useDeletePetitions_deletePetitionsMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    useDeletePetitions_deletePetitionsMutation,
    useDeletePetitions_deletePetitionsMutationVariables
  >(useDeletePetitions_deletePetitionsDocument, options);
}
export type useDeletePetitions_deletePetitionsMutationHookResult = ReturnType<
  typeof useuseDeletePetitions_deletePetitionsMutation
>;
export const PetitionComposeSearchContactsDocument = gql`
  query PetitionComposeSearchContacts($search: String, $exclude: [GID!]) {
    contacts(limit: 10, search: $search, exclude: $exclude) {
      items {
        ...ContactSelect_Contact
      }
    }
  }
  ${ContactSelect_ContactFragmentDoc}
`;

/**
 * __usePetitionComposeSearchContactsQuery__
 *
 * To run a query within a React component, call `usePetitionComposeSearchContactsQuery` and pass it any options that fit your needs.
 * When your component renders, `usePetitionComposeSearchContactsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePetitionComposeSearchContactsQuery({
 *   variables: {
 *      search: // value for 'search'
 *      exclude: // value for 'exclude'
 *   },
 * });
 */
export function usePetitionComposeSearchContactsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    PetitionComposeSearchContactsQuery,
    PetitionComposeSearchContactsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    PetitionComposeSearchContactsQuery,
    PetitionComposeSearchContactsQueryVariables
  >(PetitionComposeSearchContactsDocument, options);
}
export function usePetitionComposeSearchContactsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PetitionComposeSearchContactsQuery,
    PetitionComposeSearchContactsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    PetitionComposeSearchContactsQuery,
    PetitionComposeSearchContactsQueryVariables
  >(PetitionComposeSearchContactsDocument, options);
}
export type PetitionComposeSearchContactsQueryHookResult = ReturnType<
  typeof usePetitionComposeSearchContactsQuery
>;
export type PetitionComposeSearchContactsLazyQueryHookResult = ReturnType<
  typeof usePetitionComposeSearchContactsLazyQuery
>;
export const SearchUsersDocument = gql`
  query SearchUsers($search: String!, $exclude: [GID!]!) {
    me {
      organization {
        users(search: $search, limit: 10, exclude: $exclude) {
          items {
            id
            fullName
            email
          }
        }
      }
    }
  }
`;

/**
 * __useSearchUsersQuery__
 *
 * To run a query within a React component, call `useSearchUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchUsersQuery({
 *   variables: {
 *      search: // value for 'search'
 *      exclude: // value for 'exclude'
 *   },
 * });
 */
export function useSearchUsersQuery(
  baseOptions: Apollo.QueryHookOptions<
    SearchUsersQuery,
    SearchUsersQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<SearchUsersQuery, SearchUsersQueryVariables>(
    SearchUsersDocument,
    options
  );
}
export function useSearchUsersLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    SearchUsersQuery,
    SearchUsersQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<SearchUsersQuery, SearchUsersQueryVariables>(
    SearchUsersDocument,
    options
  );
}
export type SearchUsersQueryHookResult = ReturnType<typeof useSearchUsersQuery>;
export type SearchUsersLazyQueryHookResult = ReturnType<
  typeof useSearchUsersLazyQuery
>;
