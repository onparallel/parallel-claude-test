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

export type CreatedAt = {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
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

export type CreateTextReplyInput = {
  text: Scalars["String"];
};

export type EntityType = "Contact" | "Organization" | "Petition" | "User";

export type FeatureFlag = "INTERNAL_COMMENTS" | "PETITION_SIGNATURE";

export type FileUploadReplyDownloadLinkResult = {
  __typename?: "FileUploadReplyDownloadLinkResult";
  result: Result;
  url?: Maybe<Scalars["String"]>;
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
  /** Creates a new organization. */
  createOrganization: SupportMethodResponse;
  /** Create petition. */
  createPetition: PetitionBase;
  /** Creates a petition field */
  createPetitionField: PetitionBaseAndField;
  /** Create a petition field comment. */
  createPetitionFieldComment: PetitionFieldComment;
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
  /** Delete petitions. */
  deletePetitions: Result;
  /** Edits permissions on given petitions and users */
  editPetitionUserPermission: Array<Petition>;
  /** Generates a download link for a file reply. */
  fileUploadReplyDownloadLink: FileUploadReplyDownloadLinkResult;
  /** Marks the specified comments as read. */
  markPetitionFieldCommentsAsRead: Array<PetitionFieldComment>;
  /** Checks if a PetitionClosedNotification was already sent or not */
  presendPetitionClosedNotification: Result;
  /** Marks a filled petition as COMPLETED. If the petition requires signature, starts the signing. Otherwise sends email to user. */
  publicCompletePetition: PublicPetition;
  /** Creates a reply to a file upload field. */
  publicCreateFileUploadReply: CreateFileUploadReply;
  /** Create a petition field comment. */
  publicCreatePetitionFieldComment: PublicPetitionFieldComment;
  /** Creates a reply to a select field. */
  publicCreateSelectReply: PublicPetitionFieldReply;
  /** Creates a reply to a text field. */
  publicCreateTextReply: PublicPetitionFieldReply;
  /** Delete a petition field comment. */
  publicDeletePetitionFieldComment: Result;
  /** Deletes a reply to a petition field. */
  publicDeletePetitionReply: Result;
  /** Notifies the backend that the upload is complete. */
  publicFileUploadReplyComplete: PublicPetitionFieldReply;
  /** Marks the specified comments as read. */
  publicMarkPetitionFieldCommentsAsRead: Array<PublicPetitionFieldComment>;
  /** Submits all unpublished comments. */
  publicSubmitUnpublishedComments: Array<PublicPetitionFieldComment>;
  /** Update a petition field comment. */
  publicUpdatePetitionFieldComment: PublicPetitionFieldComment;
  /** Reactivates the specified inactive petition accesses. */
  reactivateAccesses: Array<PetitionAccess>;
  /** Removes permissions on given petitions and users */
  removePetitionUserPermission: Array<Petition>;
  /** Reopens the petition */
  reopenPetition: Petition;
  /** Removes the Signaturit Branding Ids of selected organization. */
  resetSignaturitOrganizationBranding: SupportMethodResponse;
  /** Sends a petition message to the speicified contacts. */
  sendMessages: Result;
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
  /** Transfers petition ownership to a given user */
  transferPetitionOwnership: Array<Petition>;
  /** Updates a contact. */
  updateContact: Contact;
  /** Updates the positions of the petition fields */
  updateFieldPositions: PetitionBase;
  /** Updates the onboarding status for one of the pages. */
  updateOnboardingStatus: User;
  /** Updates a petition. */
  updatePetition: PetitionBase;
  /** Updates a petition field. */
  updatePetitionField: PetitionBaseAndField;
  /** Update a petition field comment. */
  updatePetitionFieldComment: PetitionFieldComment;
  /** Updates the status of a petition field reply and sets the petition as closed if all fields are validated. */
  updatePetitionFieldRepliesStatus: PetitionWithFieldAndReplies;
  /** Updates the subscription flag on a PetitionUser */
  updatePetitionUserSubscription: Petition;
  /** Updates the user with the provided data. */
  updateUser: User;
  /** Updates the validation of a field and sets the petition as closed if all fields are validated. */
  validatePetitionFields: PetitionAndPartialFields;
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

export type MutationcreateOrganizationArgs = {
  identifier: Scalars["String"];
  name: Scalars["String"];
  status: OrganizationStatus;
};

export type MutationcreatePetitionArgs = {
  locale: PetitionLocale;
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

export type MutationdeletePetitionsArgs = {
  force?: Maybe<Scalars["Boolean"]>;
  ids: Array<Scalars["GID"]>;
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

export type MutationmarkPetitionFieldCommentsAsReadArgs = {
  petitionFieldCommentIds: Array<Scalars["GID"]>;
  petitionId: Scalars["GID"];
};

export type MutationpresendPetitionClosedNotificationArgs = {
  petitionId: Scalars["GID"];
};

export type MutationpublicCompletePetitionArgs = {
  keycode: Scalars["ID"];
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

export type MutationpublicCreateSelectReplyArgs = {
  data: CreateTextReplyInput;
  fieldId: Scalars["GID"];
  keycode: Scalars["ID"];
};

export type MutationpublicCreateTextReplyArgs = {
  data: CreateTextReplyInput;
  fieldId: Scalars["GID"];
  keycode: Scalars["ID"];
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

export type MutationpublicMarkPetitionFieldCommentsAsReadArgs = {
  keycode: Scalars["ID"];
  petitionFieldCommentIds: Array<Scalars["GID"]>;
};

export type MutationpublicSubmitUnpublishedCommentsArgs = {
  keycode: Scalars["ID"];
};

export type MutationpublicUpdatePetitionFieldCommentArgs = {
  content: Scalars["String"];
  keycode: Scalars["ID"];
  petitionFieldCommentId: Scalars["GID"];
  petitionFieldId: Scalars["GID"];
};

export type MutationreactivateAccessesArgs = {
  accessIds: Array<Scalars["GID"]>;
  petitionId: Scalars["GID"];
};

export type MutationremovePetitionUserPermissionArgs = {
  petitionIds: Array<Scalars["GID"]>;
  userIds: Array<Scalars["GID"]>;
};

export type MutationreopenPetitionArgs = {
  petitionId: Scalars["GID"];
};

export type MutationresetSignaturitOrganizationBrandingArgs = {
  orgId: Scalars["Int"];
};

export type MutationsendMessagesArgs = {
  accessIds: Array<Scalars["GID"]>;
  body: Scalars["JSON"];
  petitionId: Scalars["GID"];
  scheduledAt?: Maybe<Scalars["DateTime"]>;
  subject: Scalars["String"];
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
  emailBody: Scalars["JSON"];
  force?: Maybe<Scalars["Boolean"]>;
  petitionId: Scalars["GID"];
};

export type MutationsendRemindersArgs = {
  accessIds: Array<Scalars["GID"]>;
  petitionId: Scalars["GID"];
};

export type MutationsignedPetitionDownloadLinkArgs = {
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

export type MutationupdatePetitionUserSubscriptionArgs = {
  isSubscribed: Scalars["Boolean"];
  petitionId: Scalars["GID"];
};

export type MutationupdateUserArgs = {
  data: UpdateUserInput;
  id: Scalars["GID"];
};

export type MutationvalidatePetitionFieldsArgs = {
  fieldIds: Array<Scalars["GID"]>;
  petitionId: Scalars["GID"];
  validateRepliesWith?: Maybe<PetitionFieldReplyStatus>;
  value: Scalars["Boolean"];
};

export type OnboardingKey =
  | "CONTACT_DETAILS"
  | "CONTACT_LIST"
  | "PETITION_ACTIVITY"
  | "PETITION_COMPOSE"
  | "PETITION_REVIEW"
  | "PETITIONS_LIST";

export type OnboardingStatus = "FINISHED" | "SKIPPED";

/** An organization in the system. */
export type Organization = Timestamps & {
  __typename?: "Organization";
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
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  search?: Maybe<Scalars["String"]>;
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

export type OrgIntegration = {
  __typename?: "OrgIntegration";
  /** The name of the integration. */
  name: Scalars["String"];
  /** The provider used for this integration. */
  provider: Scalars["String"];
  /** The type of the integration. */
  type: IntegrationType;
};

export type OwnershipTransferredEvent = PetitionEvent & {
  __typename?: "OwnershipTransferredEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  owner?: Maybe<User>;
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
  /** The ID of the petition or template. */
  id: Scalars["GID"];
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
  /** The status of the petition. */
  status: PetitionStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
  /** The permissions linked to the petition */
  userPermissions: Array<PetitionUserPermission>;
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
  /** The ID of the petition or template. */
  id: Scalars["GID"];
  /** The locale of the petition. */
  locale: PetitionLocale;
  /** The name of the petition. */
  name?: Maybe<Scalars["String"]>;
  organization: Organization;
  owner: User;
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
  isDescriptionShown: Scalars["Boolean"];
  /** Determines if the field can be moved or deleted. */
  isFixed: Scalars["Boolean"];
  /** Determines if the field accepts replies */
  isReadOnly: Scalars["Boolean"];
  /** Determines if this field allows multiple replies. */
  multiple: Scalars["Boolean"];
  /** Determines if this field is optional. */
  optional: Scalars["Boolean"];
  /** The options of the petition. */
  options?: Maybe<Scalars["JSONObject"]>;
  position: Scalars["Int"];
  /** The replies to the petition field */
  replies: Array<PetitionFieldReply>;
  /** The title of the petition field. */
  title?: Maybe<Scalars["String"]>;
  /** The type of the petition field. */
  type: PetitionFieldType;
  /** Determines if the content of this field has been validated. */
  validated: Scalars["Boolean"];
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
  /** The access from where this reply was made. */
  access: PetitionAccess;
  /** The content of the reply. */
  content: Scalars["JSONObject"];
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The petition field for this reply. */
  field?: Maybe<PetitionField>;
  /** The ID of the petition field reply. */
  id: Scalars["GID"];
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
  /** The body of the petition message. */
  emailBody?: Maybe<Scalars["JSON"]>;
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
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  petition: Petition;
  /** The signature configuration for the request. */
  signatureConfig: SignatureConfig;
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
  /** The ID of the petition or template. */
  id: Scalars["GID"];
  /** Whether the template is publicly available or not */
  isPublic: Scalars["Boolean"];
  /** The locale of the petition. */
  locale: PetitionLocale;
  /** The name of the petition. */
  name?: Maybe<Scalars["String"]>;
  organization: Organization;
  owner: User;
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
  /** The ID of the petition. */
  id: Scalars["GID"];
  /** The locale of the petition. */
  locale: PetitionLocale;
  /** The signers of the petition */
  signers: Array<Maybe<PublicContact>>;
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
  /** The options of the petition. */
  options?: Maybe<Scalars["JSONObject"]>;
  /** The replies to the petition field */
  replies: Array<PublicPetitionFieldReply>;
  /** The title of the petition field. */
  title?: Maybe<Scalars["String"]>;
  /** The type of the petition field. */
  type: PetitionFieldType;
  /** Determines if the content of this field has been validated. */
  validated: Scalars["Boolean"];
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
  /** The contacts of the user */
  contacts: ContactPagination;
  /** Decodes the given Global ID into an entity in the database. */
  globalIdDecode: SupportMethodResponse;
  /** Encodes the given ID into a Global ID. */
  globalIdEncode: SupportMethodResponse;
  me: User;
  organization?: Maybe<Organization>;
  petition?: Maybe<PetitionBase>;
  /** The petitions of the user */
  petitions: PetitionBasePagination;
  petitionSignatureRequestToken?: Maybe<PetitionSignatureRequest>;
  /** The publicly available templates */
  publicTemplates: PetitionTemplatePagination;
};

export type QueryaccessArgs = {
  keycode: Scalars["ID"];
};

export type QuerycontactArgs = {
  id: Scalars["GID"];
};

export type QuerycontactsArgs = {
  exclude?: Maybe<Array<Scalars["GID"]>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  search?: Maybe<Scalars["String"]>;
  sortBy?: Maybe<Array<QueryContacts_OrderBy>>;
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

export type QuerypetitionArgs = {
  id: Scalars["GID"];
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

export type QuerypetitionSignatureRequestTokenArgs = {
  token: Scalars["String"];
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

/** Order to use on Query.petitions */
export type QueryPetitions_OrderBy =
  | "createdAt_ASC"
  | "createdAt_DESC"
  | "lastUsedAt_ASC"
  | "lastUsedAt_DESC"
  | "name_ASC"
  | "name_DESC";

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

export type ReminderSentEvent = PetitionEvent & {
  __typename?: "ReminderSentEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  reminder: PetitionReminder;
};

export type ReplyCreatedEvent = PetitionEvent & {
  __typename?: "ReplyCreatedEvent";
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  field?: Maybe<PetitionField>;
  id: Scalars["GID"];
  reply?: Maybe<PetitionFieldReply>;
};

export type ReplyDeletedEvent = PetitionEvent & {
  __typename?: "ReplyDeletedEvent";
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  field?: Maybe<PetitionField>;
  id: Scalars["GID"];
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
  cancellerReason?: Maybe<Scalars["String"]>;
  cancelType: PetitionSignatureCancelReason;
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
};

export type UpdatePetitionInput = {
  deadline?: Maybe<Scalars["DateTime"]>;
  description?: Maybe<Scalars["String"]>;
  emailBody?: Maybe<Scalars["JSON"]>;
  emailSubject?: Maybe<Scalars["String"]>;
  locale?: Maybe<PetitionLocale>;
  name?: Maybe<Scalars["String"]>;
  remindersConfig?: Maybe<RemindersConfigInput>;
  signatureConfig?: Maybe<SignatureConfigInput>;
};

export type UpdateUserInput = {
  firstName?: Maybe<Scalars["String"]>;
  lastName?: Maybe<Scalars["String"]>;
};

/** A user in the system. */
export type User = Timestamps & {
  __typename?: "User";
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
  /** The last name of the user. */
  lastName?: Maybe<Scalars["String"]>;
  /** The onboarding status for the different views of the app. */
  onboardingStatus: Scalars["JSONObject"];
  organization: Organization;
  role: OrganizationRole;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
};

/** A user in the system. */
export type UserhasFeatureFlagArgs = {
  featureFlag: FeatureFlag;
};

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
>;

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
  "fullName" | "isSuperAdmin"
>;

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

export type MessageSentEventModal_PetitionMessageFragment = {
  __typename?: "PetitionMessage";
} & Pick<PetitionMessage, "emailBody" | "emailSubject"> & {
    access: { __typename?: "PetitionAccess" } & {
      contact?: Maybe<{ __typename?: "Contact" } & ContactLink_ContactFragment>;
    };
  };

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
  | PetitionActivityTimeline_PetitionEvent_SignatureCancelledEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_SignatureCompletedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_SignatureStartedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_UserPermissionAddedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_UserPermissionEditedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_UserPermissionRemovedEvent_Fragment;

export type PetitionFieldReference_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<PetitionField, "title">;

export type UserReference_UserFragment = { __typename?: "User" } & Pick<
  User,
  "id" | "fullName"
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
      "status" | "scheduledAt" | "emailSubject" | "emailBody"
    > & {
        sender: { __typename?: "User" } & UserReference_UserFragment;
        access: { __typename?: "PetitionAccess" } & {
          contact?: Maybe<
            { __typename?: "Contact" } & ContactLink_ContactFragment
          >;
        };
      };
  };

export type TimelineMessageSentEvent_MessageSentEventFragment = {
  __typename?: "MessageSentEvent";
} & Pick<MessageSentEvent, "createdAt"> & {
    message: { __typename?: "PetitionMessage" } & Pick<
      PetitionMessage,
      "emailSubject" | "emailBody" | "scheduledAt"
    > & {
        sender: { __typename?: "User" } & UserReference_UserFragment;
        access: { __typename?: "PetitionAccess" } & {
          contact?: Maybe<
            { __typename?: "Contact" } & ContactLink_ContactFragment
          >;
        };
      } & MessageEventsIndicator_PetitionMessageFragment &
      MessageSentEventModal_PetitionMessageFragment;
  };

export type TimelineOwnershipTransferredEvent_OwnershipTransferredEventFragment = {
  __typename?: "OwnershipTransferredEvent";
} & Pick<OwnershipTransferredEvent, "createdAt"> & {
    user?: Maybe<{ __typename?: "User" } & UserReference_UserFragment>;
    owner?: Maybe<{ __typename?: "User" } & UserReference_UserFragment>;
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
      };
  };

export type TimelineReplyCreatedEvent_ReplyCreatedEventFragment = {
  __typename?: "ReplyCreatedEvent";
} & Pick<ReplyCreatedEvent, "createdAt"> & {
    field?: Maybe<
      {
        __typename?: "PetitionField";
      } & PetitionFieldReference_PetitionFieldFragment
    >;
    access: { __typename?: "PetitionAccess" } & {
      contact?: Maybe<{ __typename?: "Contact" } & ContactLink_ContactFragment>;
    };
  };

export type TimelineReplyDeletedEvent_ReplyDeletedEventFragment = {
  __typename?: "ReplyDeletedEvent";
} & Pick<ReplyDeletedEvent, "createdAt"> & {
    field?: Maybe<
      {
        __typename?: "PetitionField";
      } & PetitionFieldReference_PetitionFieldFragment
    >;
    access: { __typename?: "PetitionAccess" } & {
      contact?: Maybe<{ __typename?: "Contact" } & ContactLink_ContactFragment>;
    };
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

export type PetitionFieldsIndex_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<PetitionField, "id" | "title" | "type" | "options"> & {
    comments: Array<
      { __typename?: "PetitionFieldComment" } & Pick<
        PetitionFieldComment,
        "id" | "isUnread" | "publishedAt"
      >
    >;
  };

export type PetitionSettings_UserFragment = { __typename?: "User" } & {
  hasPetitionSignature: User["hasFeatureFlag"];
} & {
  organization: { __typename?: "Organization" } & {
    signatureIntegrations: Array<
      {
        __typename?: "OrgIntegration";
      } & SignatureConfigDialog_OrgIntegrationFragment
    >;
  };
};

export type PetitionSettings_PetitionBase_Petition_Fragment = {
  __typename?: "Petition";
} & Pick<Petition, "status" | "deadline" | "id" | "locale"> & {
    currentSignatureRequest?: Maybe<
      { __typename?: "PetitionSignatureRequest" } & Pick<
        PetitionSignatureRequest,
        "id" | "status"
      >
    >;
  } & SignatureConfigDialog_PetitionFragment;

export type PetitionSettings_PetitionBase_PetitionTemplate_Fragment = {
  __typename?: "PetitionTemplate";
} & Pick<PetitionTemplate, "id" | "locale">;

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
  userIds: Array<Scalars["GID"]>;
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

export type PetitionSharingModal_searchUsersQueryVariables = Exact<{
  search: Scalars["String"];
  exclude: Array<Scalars["GID"]>;
}>;

export type PetitionSharingModal_searchUsersQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & {
    organization: { __typename?: "Organization" } & {
      users: { __typename?: "UserPagination" } & {
        items: Array<{ __typename?: "User" } & UserSelect_UserFragment>;
      };
    };
  };
};

export type SignatureConfigDialog_PetitionFragment = {
  __typename?: "Petition";
} & Pick<Petition, "name"> & {
    signatureConfig?: Maybe<
      { __typename?: "SignatureConfig" } & Pick<
        SignatureConfig,
        "provider" | "timezone" | "title"
      > & {
          contacts: Array<
            Maybe<{ __typename?: "Contact" } & ContactSelect_ContactFragment>
          >;
        }
    >;
  };

export type SignatureConfigDialog_OrgIntegrationFragment = {
  __typename?: "OrgIntegration";
} & Pick<OrgIntegration, "name" | "provider">;

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
          "name"
        >;
      };
    userPermissions: Array<
      { __typename?: "PetitionUserPermission" } & Pick<
        PetitionUserPermission,
        "permissionType"
      > & { user: { __typename?: "User" } & Pick<User, "id"> }
    >;
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
  | "isDescriptionShown"
> &
  SelectTypeFieldOptions_PetitionFieldFragment;

export type PetitionComposeFieldList_PetitionFragment = {
  __typename?: "Petition";
} & {
  fields: Array<
    { __typename?: "PetitionField" } & Pick<PetitionField, "isFixed"> &
      PetitionComposeField_PetitionFieldFragment
  >;
};

export type PetitionComposeFieldSettings_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<
  PetitionField,
  | "id"
  | "type"
  | "isDescriptionShown"
  | "optional"
  | "multiple"
  | "options"
  | "isReadOnly"
  | "isFixed"
  | "position"
>;

export type PetitionTemplateComposeMessageEditor_PetitionFragment = {
  __typename?: "PetitionTemplate";
} & Pick<PetitionTemplate, "id" | "emailSubject" | "emailBody" | "description">;

export type SelectTypeFieldOptions_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<PetitionField, "id" | "options">;

export type DownloadAllDialog_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<PetitionField, "title" | "type"> & {
    replies: Array<
      { __typename?: "PetitionFieldReply" } & Pick<
        PetitionFieldReply,
        "content"
      > & {
          access: { __typename?: "PetitionAccess" } & {
            contact?: Maybe<
              { __typename?: "Contact" } & Pick<
                Contact,
                "firstName" | "lastName"
              >
            >;
          };
        }
    >;
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
} & Pick<PetitionFieldReply, "id" | "content" | "status" | "createdAt">;

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
      | ({ __typename?: "User" } & Pick<User, "id" | "fullName">)
    >;
  };

export type PetitionSignaturesCard_PetitionFragment = {
  __typename?: "Petition";
} & Pick<Petition, "id" | "status"> & {
    signatureConfig?: Maybe<
      { __typename?: "SignatureConfig" } & Pick<SignatureConfig, "provider"> & {
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
  };

export type PetitionSignaturesCard_PetitionSignatureRequestFragment = {
  __typename?: "PetitionSignatureRequest";
} & Pick<PetitionSignatureRequest, "id" | "status"> & {
    signatureConfig: { __typename?: "SignatureConfig" } & {
      contacts: Array<
        Maybe<{ __typename?: "Contact" } & ContactLink_ContactFragment>
      >;
    };
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
  "id" | "type" | "title" | "options" | "optional" | "isReadOnly"
> & {
    replies: Array<
      { __typename?: "PublicPetitionFieldReply" } & Pick<
        PublicPetitionFieldReply,
        "id"
      >
    >;
    comments: Array<
      { __typename?: "PublicPetitionFieldComment" } & Pick<
        PublicPetitionFieldComment,
        "id" | "isUnread" | "publishedAt"
      >
    >;
  };

export type RecipientViewPetitionField_PublicPetitionFieldFragment = {
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
> & {
    replies: Array<
      {
        __typename?: "PublicPetitionFieldReply";
      } & RecipientViewPetitionField_PublicPetitionFieldReplyFragment
    >;
    comments: Array<
      { __typename?: "PublicPetitionFieldComment" } & Pick<
        PublicPetitionFieldComment,
        "id" | "isUnread" | "publishedAt"
      >
    >;
  };

export type RecipientViewPetitionField_PublicPetitionFieldReplyFragment = {
  __typename?: "PublicPetitionFieldReply";
} & Pick<PublicPetitionFieldReply, "id" | "status" | "content" | "createdAt">;

export type RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldFragment = {
  __typename?: "PublicPetitionField";
} & Pick<PublicPetitionField, "title"> & {
    comments: Array<
      {
        __typename?: "PublicPetitionFieldComment";
      } & RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragment
    >;
  };

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

export type RecipientViewProgressFooter_PublicPetitionFragment = {
  __typename?: "PublicPetition";
} & Pick<PublicPetition, "status"> & {
    fields: Array<
      {
        __typename?: "PublicPetitionField";
      } & RecipientViewProgressFooter_PublicPetitionFieldFragment
    >;
    signers: Array<
      Maybe<{ __typename?: "PublicContact" } & Pick<PublicContact, "id">>
    >;
  };

export type RecipientViewProgressFooter_PublicPetitionFieldFragment = {
  __typename?: "PublicPetitionField";
} & Pick<PublicPetitionField, "id" | "optional" | "isReadOnly"> & {
    replies: Array<
      { __typename?: "PublicPetitionFieldReply" } & Pick<
        PublicPetitionFieldReply,
        "id"
      >
    >;
  };

export type RecipientViewSenderCard_PublicUserFragment = {
  __typename?: "PublicUser";
} & Pick<PublicUser, "id" | "firstName" | "fullName" | "email"> & {
    organization: { __typename?: "PublicOrganization" } & Pick<
      PublicOrganization,
      "name" | "identifier" | "logoUrl"
    >;
  };

export type Admin_UserFragment = {
  __typename?: "User";
} & AppLayout_UserFragment;

export type AdminQueryVariables = Exact<{ [key: string]: never }>;

export type AdminQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & Pick<User, "id"> & Admin_UserFragment;
};

export type SupportMethods_UserFragment = {
  __typename?: "User";
} & AppLayout_UserFragment;

export type SupportMethodsUserQueryVariables = Exact<{ [key: string]: never }>;

export type SupportMethodsUserQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & SupportMethods_UserFragment;
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
  ids: Array<Scalars["GID"]>;
}>;

export type Contacts_deleteContactsMutation = {
  __typename?: "Mutation";
} & Pick<Mutation, "deleteContacts">;

export type ContactsQueryVariables = Exact<{
  offset: Scalars["Int"];
  limit: Scalars["Int"];
  search?: Maybe<Scalars["String"]>;
  sortBy?: Maybe<Array<QueryContacts_OrderBy>>;
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

export type PetitionActivity_sendMessagesMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  accessIds: Array<Scalars["GID"]>;
  subject: Scalars["String"];
  body: Scalars["JSON"];
  scheduledAt?: Maybe<Scalars["DateTime"]>;
}>;

export type PetitionActivity_sendMessagesMutation = {
  __typename?: "Mutation";
} & Pick<Mutation, "sendMessages">;

export type PetitionActivity_sendRemindersMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  accessIds: Array<Scalars["GID"]>;
}>;

export type PetitionActivity_sendRemindersMutation = {
  __typename?: "Mutation";
} & Pick<Mutation, "sendReminders">;

export type PetitionActivity_deactivateAccessesMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  accessIds: Array<Scalars["GID"]>;
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
  accessIds: Array<Scalars["GID"]>;
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
  contactIds: Array<Scalars["GID"]>;
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
  accessIds: Array<Scalars["GID"]>;
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

export type updateIsDescriptionShown_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<PetitionField, "isDescriptionShown" | "description">;

export type onFieldEdit_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & PetitionCompose_PetitionFieldFragment;

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
  PetitionFieldsIndex_PetitionFieldFragment;

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
  fieldIds: Array<Scalars["GID"]>;
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

export type PetitionCompose_sendPetitionMutationVariables = Exact<{
  petitionId: Scalars["GID"];
  contactIds: Array<Scalars["GID"]>;
  subject: Scalars["String"];
  body: Scalars["JSON"];
  remindersConfig?: Maybe<RemindersConfigInput>;
  scheduledAt?: Maybe<Scalars["DateTime"]>;
}>;

export type PetitionCompose_sendPetitionMutation = {
  __typename?: "Mutation";
} & {
  sendPetition: { __typename?: "SendPetitionResult" } & Pick<
    SendPetitionResult,
    "result"
  > & {
      petition?: Maybe<
        { __typename?: "Petition" } & Pick<Petition, "id" | "status">
      >;
    };
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
} & Pick<Petition, "id"> & {
    events: { __typename?: "PetitionEventPagination" } & {
      items: Array<
        | ({ __typename: "AccessActivatedEvent" } & Pick<
            AccessActivatedEvent,
            "id"
          >)
        | ({ __typename: "AccessDeactivatedEvent" } & Pick<
            AccessDeactivatedEvent,
            "id"
          >)
        | ({ __typename: "AccessOpenedEvent" } & Pick<AccessOpenedEvent, "id">)
        | ({ __typename: "CommentDeletedEvent" } & Pick<
            CommentDeletedEvent,
            "id"
          >)
        | ({ __typename: "CommentPublishedEvent" } & Pick<
            CommentPublishedEvent,
            "id"
          >)
        | ({ __typename: "MessageCancelledEvent" } & Pick<
            MessageCancelledEvent,
            "id"
          >)
        | ({ __typename: "MessageScheduledEvent" } & Pick<
            MessageScheduledEvent,
            "id"
          >)
        | ({ __typename: "MessageSentEvent" } & Pick<MessageSentEvent, "id">)
        | ({ __typename: "OwnershipTransferredEvent" } & Pick<
            OwnershipTransferredEvent,
            "id"
          >)
        | ({ __typename: "PetitionClosedEvent" } & Pick<
            PetitionClosedEvent,
            "id"
          >)
        | ({ __typename: "PetitionClosedNotifiedEvent" } & Pick<
            PetitionClosedNotifiedEvent,
            "id"
          >)
        | ({ __typename: "PetitionCompletedEvent" } & Pick<
            PetitionCompletedEvent,
            "id"
          >)
        | ({ __typename: "PetitionCreatedEvent" } & Pick<
            PetitionCreatedEvent,
            "id"
          >)
        | ({ __typename: "PetitionReopenedEvent" } & Pick<
            PetitionReopenedEvent,
            "id"
          >)
        | ({ __typename: "ReminderSentEvent" } & Pick<ReminderSentEvent, "id">)
        | ({ __typename: "ReplyCreatedEvent" } & Pick<ReplyCreatedEvent, "id">)
        | ({ __typename: "ReplyDeletedEvent" } & Pick<ReplyDeletedEvent, "id">)
        | ({ __typename: "SignatureCancelledEvent" } & Pick<
            SignatureCancelledEvent,
            "id"
          >)
        | ({ __typename: "SignatureCompletedEvent" } & Pick<
            SignatureCompletedEvent,
            "id"
          >)
        | ({ __typename: "SignatureStartedEvent" } & Pick<
            SignatureStartedEvent,
            "id"
          >)
        | ({ __typename: "UserPermissionAddedEvent" } & Pick<
            UserPermissionAddedEvent,
            "id"
          >)
        | ({ __typename: "UserPermissionEditedEvent" } & Pick<
            UserPermissionEditedEvent,
            "id"
          >)
        | ({ __typename: "UserPermissionRemovedEvent" } & Pick<
            UserPermissionRemovedEvent,
            "id"
          >)
      >;
    };
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
  PetitionFieldsIndex_PetitionFieldFragment &
  PetitionRepliesFieldComments_PetitionFieldFragment &
  DownloadAllDialog_PetitionFieldFragment;

export type PetitionReplies_UserFragment = { __typename?: "User" } & {
  hasPetitionSignature: User["hasFeatureFlag"];
} & PetitionLayout_UserFragment &
  PetitionRepliesFieldComments_UserFragment;

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
  fieldIds: Array<Scalars["GID"]>;
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
  petitionFieldCommentIds: Array<Scalars["GID"]>;
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
  petitionFieldReplyIds: Array<Scalars["GID"]>;
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
  force?: Maybe<Scalars["Boolean"]>;
}>;

export type PetitionReplies_sendPetitionClosedNotificationMutation = {
  __typename?: "Mutation";
} & {
  sendPetitionClosedNotification: { __typename?: "Petition" } & Pick<
    Petition,
    "id"
  > & {
      events: { __typename?: "PetitionEventPagination" } & {
        items: Array<
          | ({ __typename: "AccessActivatedEvent" } & Pick<
              AccessActivatedEvent,
              "id"
            >)
          | ({ __typename: "AccessDeactivatedEvent" } & Pick<
              AccessDeactivatedEvent,
              "id"
            >)
          | ({ __typename: "AccessOpenedEvent" } & Pick<
              AccessOpenedEvent,
              "id"
            >)
          | ({ __typename: "CommentDeletedEvent" } & Pick<
              CommentDeletedEvent,
              "id"
            >)
          | ({ __typename: "CommentPublishedEvent" } & Pick<
              CommentPublishedEvent,
              "id"
            >)
          | ({ __typename: "MessageCancelledEvent" } & Pick<
              MessageCancelledEvent,
              "id"
            >)
          | ({ __typename: "MessageScheduledEvent" } & Pick<
              MessageScheduledEvent,
              "id"
            >)
          | ({ __typename: "MessageSentEvent" } & Pick<MessageSentEvent, "id">)
          | ({ __typename: "OwnershipTransferredEvent" } & Pick<
              OwnershipTransferredEvent,
              "id"
            >)
          | ({ __typename: "PetitionClosedEvent" } & Pick<
              PetitionClosedEvent,
              "id"
            >)
          | ({ __typename: "PetitionClosedNotifiedEvent" } & Pick<
              PetitionClosedNotifiedEvent,
              "id"
            >)
          | ({ __typename: "PetitionCompletedEvent" } & Pick<
              PetitionCompletedEvent,
              "id"
            >)
          | ({ __typename: "PetitionCreatedEvent" } & Pick<
              PetitionCreatedEvent,
              "id"
            >)
          | ({ __typename: "PetitionReopenedEvent" } & Pick<
              PetitionReopenedEvent,
              "id"
            >)
          | ({ __typename: "ReminderSentEvent" } & Pick<
              ReminderSentEvent,
              "id"
            >)
          | ({ __typename: "ReplyCreatedEvent" } & Pick<
              ReplyCreatedEvent,
              "id"
            >)
          | ({ __typename: "ReplyDeletedEvent" } & Pick<
              ReplyDeletedEvent,
              "id"
            >)
          | ({ __typename: "SignatureCancelledEvent" } & Pick<
              SignatureCancelledEvent,
              "id"
            >)
          | ({ __typename: "SignatureCompletedEvent" } & Pick<
              SignatureCompletedEvent,
              "id"
            >)
          | ({ __typename: "SignatureStartedEvent" } & Pick<
              SignatureStartedEvent,
              "id"
            >)
          | ({ __typename: "UserPermissionAddedEvent" } & Pick<
              UserPermissionAddedEvent,
              "id"
            >)
          | ({ __typename: "UserPermissionEditedEvent" } & Pick<
              UserPermissionEditedEvent,
              "id"
            >)
          | ({ __typename: "UserPermissionRemovedEvent" } & Pick<
              UserPermissionRemovedEvent,
              "id"
            >)
        >;
      };
    };
};

export type PetitionReplies_presendPetitionClosedNotificationMutationVariables = Exact<{
  petitionId: Scalars["GID"];
}>;

export type PetitionReplies_presendPetitionClosedNotificationMutation = {
  __typename?: "Mutation";
} & Pick<Mutation, "presendPetitionClosedNotification">;

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
  sortBy?: Maybe<Array<QueryPetitions_OrderBy>>;
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
  AppLayout_UserFragment;

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
} & AppLayout_UserFragment;

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
  me: { __typename?: "User" } & Pick<User, "id"> & AppLayout_UserFragment;
};

export type CurrentUserQueryVariables = Exact<{ [key: string]: never }>;

export type CurrentUserQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & Login_UserFragment;
};

export type Login_UserFragment = { __typename?: "User" } & Pick<
  User,
  "id" | "fullName" | "email"
>;

export type RecipientView_PublicPetitionFragment = {
  __typename?: "PublicPetition";
} & Pick<PublicPetition, "id" | "status" | "deadline"> & {
    fields: Array<
      {
        __typename?: "PublicPetitionField";
      } & RecipientView_PublicPetitionFieldFragment
    >;
    signers: Array<
      Maybe<
        { __typename?: "PublicContact" } & RecipientView_PublicContactFragment
      >
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
  RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldFragment &
  RecipientViewContentsCard_PublicPetitionFieldFragment &
  RecipientViewProgressFooter_PublicPetitionFieldFragment;

export type RecipientView_PublicUserFragment = {
  __typename?: "PublicUser";
} & RecipientViewSenderCard_PublicUserFragment &
  RecipientViewContentsCard_PublicUserFragment;

export type RecipientView_publicDeletePetitionReplyMutationVariables = Exact<{
  replyId: Scalars["GID"];
  keycode: Scalars["ID"];
}>;

export type RecipientView_publicDeletePetitionReplyMutation = {
  __typename?: "Mutation";
} & Pick<Mutation, "publicDeletePetitionReply">;

export type RecipientView_publicCreateTextReplyMutationVariables = Exact<{
  keycode: Scalars["ID"];
  fieldId: Scalars["GID"];
  data: CreateTextReplyInput;
}>;

export type RecipientView_publicCreateTextReplyMutation = {
  __typename?: "Mutation";
} & {
  publicCreateTextReply: {
    __typename?: "PublicPetitionFieldReply";
  } & RecipientViewPetitionField_PublicPetitionFieldReplyFragment;
};

export type RecipientView_publicCreateFileUploadReplyMutationVariables = Exact<{
  keycode: Scalars["ID"];
  fieldId: Scalars["GID"];
  data: CreateFileUploadReplyInput;
}>;

export type RecipientView_publicCreateFileUploadReplyMutation = {
  __typename?: "Mutation";
} & {
  publicCreateFileUploadReply: { __typename?: "CreateFileUploadReply" } & Pick<
    CreateFileUploadReply,
    "endpoint"
  > & {
      reply: {
        __typename?: "PublicPetitionFieldReply";
      } & RecipientViewPetitionField_PublicPetitionFieldReplyFragment;
    };
};

export type RecipientView_publicCreateSelectReplyMutationVariables = Exact<{
  keycode: Scalars["ID"];
  fieldId: Scalars["GID"];
  data: CreateTextReplyInput;
}>;

export type RecipientView_publicCreateSelectReplyMutation = {
  __typename?: "Mutation";
} & {
  publicCreateSelectReply: {
    __typename?: "PublicPetitionFieldReply";
  } & RecipientViewPetitionField_PublicPetitionFieldReplyFragment;
};

export type RecipientView_publicFileUploadReplyCompleteMutationVariables = Exact<{
  keycode: Scalars["ID"];
  replyId: Scalars["GID"];
}>;

export type RecipientView_publicFileUploadReplyCompleteMutation = {
  __typename?: "Mutation";
} & {
  publicFileUploadReplyComplete: {
    __typename?: "PublicPetitionFieldReply";
  } & Pick<PublicPetitionFieldReply, "id" | "content">;
};

export type RecipientView_publicCompletePetitionMutationVariables = Exact<{
  keycode: Scalars["ID"];
}>;

export type RecipientView_publicCompletePetitionMutation = {
  __typename?: "Mutation";
} & {
  publicCompletePetition: { __typename?: "PublicPetition" } & Pick<
    PublicPetition,
    "id" | "status"
  >;
};

export type RecipientView_createPetitionFieldCommentMutationVariables = Exact<{
  keycode: Scalars["ID"];
  petitionFieldId: Scalars["GID"];
  content: Scalars["String"];
}>;

export type RecipientView_createPetitionFieldCommentMutation = {
  __typename?: "Mutation";
} & {
  publicCreatePetitionFieldComment: {
    __typename?: "PublicPetitionFieldComment";
  } & RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragment;
};

export type RecipientView_updatePetitionFieldCommentMutationVariables = Exact<{
  keycode: Scalars["ID"];
  petitionFieldId: Scalars["GID"];
  petitionFieldCommentId: Scalars["GID"];
  content: Scalars["String"];
}>;

export type RecipientView_updatePetitionFieldCommentMutation = {
  __typename?: "Mutation";
} & {
  publicUpdatePetitionFieldComment: {
    __typename?: "PublicPetitionFieldComment";
  } & RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragment;
};

export type RecipientView_deletePetitionFieldCommentMutationVariables = Exact<{
  keycode: Scalars["ID"];
  petitionFieldId: Scalars["GID"];
  petitionFieldCommentId: Scalars["GID"];
}>;

export type RecipientView_deletePetitionFieldCommentMutation = {
  __typename?: "Mutation";
} & Pick<Mutation, "publicDeletePetitionFieldComment">;

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

export type RecipientView_markPetitionFieldCommentsAsReadMutationVariables = Exact<{
  keycode: Scalars["ID"];
  petitionFieldCommentIds: Array<Scalars["GID"]>;
}>;

export type RecipientView_markPetitionFieldCommentsAsReadMutation = {
  __typename?: "Mutation";
} & {
  publicMarkPetitionFieldCommentsAsRead: Array<
    { __typename?: "PublicPetitionFieldComment" } & Pick<
      PublicPetitionFieldComment,
      "id" | "isUnread"
    >
  >;
};

export type RecipientView_deletePetitionReply_PublicPetitionFieldFragment = {
  __typename?: "PublicPetitionField";
} & {
  replies: Array<
    { __typename?: "PublicPetitionFieldReply" } & Pick<
      PublicPetitionFieldReply,
      "id"
    >
  >;
};

export type RecipientView_deletePetitionReply_PublicPetitionFragment = {
  __typename?: "PublicPetition";
} & Pick<PublicPetition, "status">;

export type RecipientView_createTextReply_FieldFragment = {
  __typename?: "PublicPetitionField";
} & {
  replies: Array<
    { __typename?: "PublicPetitionFieldReply" } & Pick<
      PublicPetitionFieldReply,
      "id"
    >
  >;
};

export type RecipientView_createTextReply_PublicPetitionFragment = {
  __typename?: "PublicPetition";
} & Pick<PublicPetition, "status">;

export type RecipientView_createSelectReply_FieldFragment = {
  __typename?: "PublicPetitionField";
} & {
  replies: Array<
    { __typename?: "PublicPetitionFieldReply" } & Pick<
      PublicPetitionFieldReply,
      "id"
    >
  >;
};

export type RecipientView_createSelectReply_PublicPetitionFragment = {
  __typename?: "PublicPetition";
} & Pick<PublicPetition, "status">;

export type RecipientView_createFileUploadReply_FieldFragment = {
  __typename?: "PublicPetitionField";
} & {
  replies: Array<
    { __typename?: "PublicPetitionFieldReply" } & Pick<
      PublicPetitionFieldReply,
      "id"
    >
  >;
};

export type RecipientView_createFileUploadReply_PublicPetitionFragment = {
  __typename?: "PublicPetition";
} & Pick<PublicPetition, "status">;

export type RecipientView_createPetitionFieldComment_PublicPetitionFieldFragment = {
  __typename?: "PublicPetitionField";
} & {
  comments: Array<
    {
      __typename?: "PublicPetitionFieldComment";
    } & RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragment
  >;
};

export type RecipientView_deletePetitionFieldComment_PublicPetitionFieldFragment = {
  __typename?: "PublicPetitionField";
} & {
  comments: Array<
    { __typename?: "PublicPetitionFieldComment" } & Pick<
      PublicPetitionFieldComment,
      "id"
    >
  >;
};

export type PublicPetitionQueryVariables = Exact<{
  keycode: Scalars["ID"];
}>;

export type PublicPetitionQuery = { __typename?: "Query" } & {
  access?: Maybe<
    { __typename?: "PublicPetitionAccess" } & {
      petition?: Maybe<
        { __typename?: "PublicPetition" } & RecipientView_PublicPetitionFragment
      >;
      granter?: Maybe<
        { __typename?: "PublicUser" } & RecipientView_PublicUserFragment
      >;
      contact?: Maybe<
        { __typename?: "PublicContact" } & Pick<PublicContact, "id">
      >;
    }
  >;
};

export type PrintPetitionSignature_PetitionSignatureRequestFragment = {
  __typename?: "PetitionSignatureRequest";
} & {
  petition: { __typename?: "Petition" } & Pick<Petition, "id"> & {
      fields: Array<
        {
          __typename?: "PetitionField";
        } & PrintPetitionSignature_PetitionFieldFragment
      >;
      organization: { __typename?: "Organization" } & Pick<
        Organization,
        "name" | "logoUrl"
      >;
    };
  signatureConfig: { __typename?: "SignatureConfig" } & Pick<
    SignatureConfig,
    "provider" | "timezone" | "title"
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
};

export type PrintPetitionSignature_PetitionFieldFragment = {
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
  };

export type PdfViewPetitionQueryVariables = Exact<{
  token: Scalars["String"];
}>;

export type PdfViewPetitionQuery = { __typename?: "Query" } & {
  petitionSignatureRequestToken?: Maybe<
    {
      __typename?: "PetitionSignatureRequest";
    } & PrintPetitionSignature_PetitionSignatureRequestFragment
  >;
};

export type useClonePetitions_clonePetitionsMutationVariables = Exact<{
  petitionIds: Array<Scalars["GID"]>;
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
  ids: Array<Scalars["GID"]>;
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
  exclude?: Maybe<Array<Scalars["GID"]>>;
}>;

export type PetitionComposeSearchContactsQuery = { __typename?: "Query" } & {
  contacts: { __typename?: "ContactPagination" } & {
    items: Array<{ __typename?: "Contact" } & ContactSelect_ContactFragment>;
  };
};

export const PetitionTemplateHeader_UserFragmentDoc = gql`
  fragment PetitionTemplateHeader_User on User {
    id
  }
`;
export const UserMenu_UserFragmentDoc = gql`
  fragment UserMenu_User on User {
    fullName
    isSuperAdmin
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
export const SettingsLayout_UserFragmentDoc = gql`
  fragment SettingsLayout_User on User {
    ...AppLayout_User
  }
  ${AppLayout_UserFragmentDoc}
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
export const PetitionComposeField_PetitionFieldFragmentDoc = gql`
  fragment PetitionComposeField_PetitionField on PetitionField {
    id
    type
    title
    description
    optional
    multiple
    isFixed
    isDescriptionShown @client
    ...SelectTypeFieldOptions_PetitionField
  }
  ${SelectTypeFieldOptions_PetitionFieldFragmentDoc}
`;
export const PetitionComposeFieldList_PetitionFragmentDoc = gql`
  fragment PetitionComposeFieldList_Petition on Petition {
    fields {
      isFixed
      ...PetitionComposeField_PetitionField
    }
  }
  ${PetitionComposeField_PetitionFieldFragmentDoc}
`;
export const Admin_UserFragmentDoc = gql`
  fragment Admin_User on User {
    ...AppLayout_User
  }
  ${AppLayout_UserFragmentDoc}
`;
export const SupportMethods_UserFragmentDoc = gql`
  fragment SupportMethods_User on User {
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
export const TimelineMessageScheduledEvent_MessageScheduledEventFragmentDoc = gql`
  fragment TimelineMessageScheduledEvent_MessageScheduledEvent on MessageScheduledEvent {
    message {
      sender {
        ...UserReference_User
      }
      status
      scheduledAt
      emailSubject
      emailBody
      access {
        contact {
          ...ContactLink_Contact
        }
      }
    }
    createdAt
  }
  ${UserReference_UserFragmentDoc}
  ${ContactLink_ContactFragmentDoc}
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
export const MessageSentEventModal_PetitionMessageFragmentDoc = gql`
  fragment MessageSentEventModal_PetitionMessage on PetitionMessage {
    emailBody
    emailSubject
    access {
      contact {
        ...ContactLink_Contact
      }
    }
  }
  ${ContactLink_ContactFragmentDoc}
`;
export const TimelineMessageSentEvent_MessageSentEventFragmentDoc = gql`
  fragment TimelineMessageSentEvent_MessageSentEvent on MessageSentEvent {
    message {
      sender {
        ...UserReference_User
      }
      emailSubject
      emailBody
      scheduledAt
      access {
        contact {
          ...ContactLink_Contact
        }
      }
      ...MessageEventsIndicator_PetitionMessage
      ...MessageSentEventModal_PetitionMessage
    }
    createdAt
  }
  ${UserReference_UserFragmentDoc}
  ${ContactLink_ContactFragmentDoc}
  ${MessageEventsIndicator_PetitionMessageFragmentDoc}
  ${MessageSentEventModal_PetitionMessageFragmentDoc}
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
    }
    createdAt
  }
  ${UserReference_UserFragmentDoc}
  ${ContactLink_ContactFragmentDoc}
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
    access {
      contact {
        ...ContactLink_Contact
      }
    }
    createdAt
  }
  ${PetitionFieldReference_PetitionFieldFragmentDoc}
  ${ContactLink_ContactFragmentDoc}
`;
export const TimelineReplyDeletedEvent_ReplyDeletedEventFragmentDoc = gql`
  fragment TimelineReplyDeletedEvent_ReplyDeletedEvent on ReplyDeletedEvent {
    field {
      ...PetitionFieldReference_PetitionField
    }
    access {
      contact {
        ...ContactLink_Contact
      }
    }
    createdAt
  }
  ${PetitionFieldReference_PetitionFieldFragmentDoc}
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
export const updateIsDescriptionShown_PetitionFieldFragmentDoc = gql`
  fragment updateIsDescriptionShown_PetitionField on PetitionField {
    isDescriptionShown @client
    description
  }
`;
export const PetitionComposeFieldSettings_PetitionFieldFragmentDoc = gql`
  fragment PetitionComposeFieldSettings_PetitionField on PetitionField {
    id
    type
    isDescriptionShown @client
    optional
    multiple
    options
    isReadOnly
    isFixed
    position
  }
`;
export const PetitionFieldsIndex_PetitionFieldFragmentDoc = gql`
  fragment PetitionFieldsIndex_PetitionField on PetitionField {
    id
    title
    type
    options
    comments {
      id
      isUnread
      publishedAt
    }
  }
`;
export const PetitionCompose_PetitionFieldFragmentDoc = gql`
  fragment PetitionCompose_PetitionField on PetitionField {
    ...PetitionComposeField_PetitionField
    ...PetitionComposeFieldSettings_PetitionField
    ...PetitionFieldsIndex_PetitionField
  }
  ${PetitionComposeField_PetitionFieldFragmentDoc}
  ${PetitionComposeFieldSettings_PetitionFieldFragmentDoc}
  ${PetitionFieldsIndex_PetitionFieldFragmentDoc}
`;
export const onFieldEdit_PetitionFieldFragmentDoc = gql`
  fragment onFieldEdit_PetitionField on PetitionField {
    ...PetitionCompose_PetitionField
  }
  ${PetitionCompose_PetitionFieldFragmentDoc}
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
    signatureConfig {
      provider
      contacts {
        ...ContactSelect_Contact
      }
      timezone
      title
    }
  }
  ${ContactSelect_ContactFragmentDoc}
`;
export const PetitionSettings_PetitionBaseFragmentDoc = gql`
  fragment PetitionSettings_PetitionBase on PetitionBase {
    id
    locale
    ... on Petition {
      status
      deadline
      ...SignatureConfigDialog_Petition
      currentSignatureRequest @include(if: $hasPetitionSignature) {
        id
        status
      }
    }
  }
  ${SignatureConfigDialog_PetitionFragmentDoc}
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
    name
    provider
  }
`;
export const PetitionSettings_UserFragmentDoc = gql`
  fragment PetitionSettings_User on User {
    hasPetitionSignature: hasFeatureFlag(featureFlag: PETITION_SIGNATURE)
    organization {
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
export const PetitionRepliesField_PetitionFieldReplyFragmentDoc = gql`
  fragment PetitionRepliesField_PetitionFieldReply on PetitionFieldReply {
    id
    content
    status
    createdAt
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
        id
        fullName
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
export const DownloadAllDialog_PetitionFieldFragmentDoc = gql`
  fragment DownloadAllDialog_PetitionField on PetitionField {
    title
    type
    replies {
      content
      access {
        contact {
          firstName
          lastName
        }
      }
    }
  }
`;
export const PetitionReplies_PetitionFieldFragmentDoc = gql`
  fragment PetitionReplies_PetitionField on PetitionField {
    isReadOnly
    ...PetitionRepliesField_PetitionField
    ...PetitionFieldsIndex_PetitionField
    ...PetitionRepliesFieldComments_PetitionField
    ...DownloadAllDialog_PetitionField
  }
  ${PetitionRepliesField_PetitionFieldFragmentDoc}
  ${PetitionFieldsIndex_PetitionFieldFragmentDoc}
  ${PetitionRepliesFieldComments_PetitionFieldFragmentDoc}
  ${DownloadAllDialog_PetitionFieldFragmentDoc}
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
      provider
      contacts {
        ...ContactLink_Contact
      }
    }
    signatureRequests {
      ...PetitionSignaturesCard_PetitionSignatureRequest
    }
  }
  ${ContactLink_ContactFragmentDoc}
  ${PetitionSignaturesCard_PetitionSignatureRequestFragmentDoc}
`;
export const PetitionReplies_PetitionFragmentDoc = gql`
  fragment PetitionReplies_Petition on Petition {
    id
    ...PetitionLayout_PetitionBase
    events(limit: 1000) {
      items {
        id
        __typename
      }
    }
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
export const PetitionReplies_UserFragmentDoc = gql`
  fragment PetitionReplies_User on User {
    hasPetitionSignature: hasFeatureFlag(featureFlag: PETITION_SIGNATURE)
    ...PetitionLayout_User
    ...PetitionRepliesFieldComments_User
  }
  ${PetitionLayout_UserFragmentDoc}
  ${PetitionRepliesFieldComments_UserFragmentDoc}
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
export const Account_UserFragmentDoc = gql`
  fragment Account_User on User {
    firstName
    lastName
    ...AppLayout_User
  }
  ${AppLayout_UserFragmentDoc}
`;
export const Settings_UserFragmentDoc = gql`
  fragment Settings_User on User {
    ...AppLayout_User
  }
  ${AppLayout_UserFragmentDoc}
`;
export const Login_UserFragmentDoc = gql`
  fragment Login_User on User {
    id
    fullName
    email
  }
`;
export const RecipientViewPetitionField_PublicPetitionFieldReplyFragmentDoc = gql`
  fragment RecipientViewPetitionField_PublicPetitionFieldReply on PublicPetitionFieldReply {
    id
    status
    content
    createdAt
  }
`;
export const RecipientViewPetitionField_PublicPetitionFieldFragmentDoc = gql`
  fragment RecipientViewPetitionField_PublicPetitionField on PublicPetitionField {
    id
    type
    title
    description
    options
    optional
    multiple
    validated
    replies {
      ...RecipientViewPetitionField_PublicPetitionFieldReply
    }
    comments {
      id
      isUnread
      publishedAt
    }
  }
  ${RecipientViewPetitionField_PublicPetitionFieldReplyFragmentDoc}
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
export const RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldFragmentDoc = gql`
  fragment RecipientViewPetitionFieldCommentsDialog_PublicPetitionField on PublicPetitionField {
    title
    comments {
      ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldComment
    }
  }
  ${RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragmentDoc}
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
    comments {
      id
      isUnread
      publishedAt
    }
  }
`;
export const RecipientViewProgressFooter_PublicPetitionFieldFragmentDoc = gql`
  fragment RecipientViewProgressFooter_PublicPetitionField on PublicPetitionField {
    id
    optional
    isReadOnly
    replies {
      id
    }
  }
`;
export const RecipientView_PublicPetitionFieldFragmentDoc = gql`
  fragment RecipientView_PublicPetitionField on PublicPetitionField {
    id
    ...RecipientViewPetitionField_PublicPetitionField
    ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionField
    ...RecipientViewContentsCard_PublicPetitionField
    ...RecipientViewProgressFooter_PublicPetitionField
  }
  ${RecipientViewPetitionField_PublicPetitionFieldFragmentDoc}
  ${RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldFragmentDoc}
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
    signers {
      id
    }
  }
  ${RecipientViewProgressFooter_PublicPetitionFieldFragmentDoc}
`;
export const RecipientView_PublicPetitionFragmentDoc = gql`
  fragment RecipientView_PublicPetition on PublicPetition {
    id
    status
    deadline
    fields {
      ...RecipientView_PublicPetitionField
    }
    signers {
      ...RecipientView_PublicContact
    }
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
export const RecipientView_deletePetitionReply_PublicPetitionFieldFragmentDoc = gql`
  fragment RecipientView_deletePetitionReply_PublicPetitionField on PublicPetitionField {
    replies {
      id
    }
  }
`;
export const RecipientView_deletePetitionReply_PublicPetitionFragmentDoc = gql`
  fragment RecipientView_deletePetitionReply_PublicPetition on PublicPetition {
    status
  }
`;
export const RecipientView_createTextReply_FieldFragmentDoc = gql`
  fragment RecipientView_createTextReply_Field on PublicPetitionField {
    replies {
      id
    }
  }
`;
export const RecipientView_createTextReply_PublicPetitionFragmentDoc = gql`
  fragment RecipientView_createTextReply_PublicPetition on PublicPetition {
    status
  }
`;
export const RecipientView_createSelectReply_FieldFragmentDoc = gql`
  fragment RecipientView_createSelectReply_Field on PublicPetitionField {
    replies {
      id
    }
  }
`;
export const RecipientView_createSelectReply_PublicPetitionFragmentDoc = gql`
  fragment RecipientView_createSelectReply_PublicPetition on PublicPetition {
    status
  }
`;
export const RecipientView_createFileUploadReply_FieldFragmentDoc = gql`
  fragment RecipientView_createFileUploadReply_Field on PublicPetitionField {
    replies {
      id
    }
  }
`;
export const RecipientView_createFileUploadReply_PublicPetitionFragmentDoc = gql`
  fragment RecipientView_createFileUploadReply_PublicPetition on PublicPetition {
    status
  }
`;
export const RecipientView_createPetitionFieldComment_PublicPetitionFieldFragmentDoc = gql`
  fragment RecipientView_createPetitionFieldComment_PublicPetitionField on PublicPetitionField {
    comments {
      ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldComment
    }
  }
  ${RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldCommentFragmentDoc}
`;
export const RecipientView_deletePetitionFieldComment_PublicPetitionFieldFragmentDoc = gql`
  fragment RecipientView_deletePetitionFieldComment_PublicPetitionField on PublicPetitionField {
    comments {
      id
    }
  }
`;
export const PrintPetitionSignature_PetitionFieldFragmentDoc = gql`
  fragment PrintPetitionSignature_PetitionField on PetitionField {
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
  }
`;
export const PrintPetitionSignature_PetitionSignatureRequestFragmentDoc = gql`
  fragment PrintPetitionSignature_PetitionSignatureRequest on PetitionSignatureRequest {
    petition {
      id
      fields {
        ...PrintPetitionSignature_PetitionField
      }
      organization {
        name
        logoUrl
      }
    }
    signatureConfig {
      contacts {
        id
        fullName
        email
      }
      provider
      timezone
      title
    }
  }
  ${PrintPetitionSignature_PetitionFieldFragmentDoc}
`;
export const ConfirmDeletePetitionsDialog_PetitionBaseFragmentDoc = gql`
  fragment ConfirmDeletePetitionsDialog_PetitionBase on PetitionBase {
    id
    name
  }
`;
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
  return Apollo.useQuery<
    WithSuperAdminAccessQuery,
    WithSuperAdminAccessQueryVariables
  >(WithSuperAdminAccessDocument, baseOptions);
}
export function useWithSuperAdminAccessLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    WithSuperAdminAccessQuery,
    WithSuperAdminAccessQueryVariables
  >
) {
  return Apollo.useLazyQuery<
    WithSuperAdminAccessQuery,
    WithSuperAdminAccessQueryVariables
  >(WithSuperAdminAccessDocument, baseOptions);
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
  return Apollo.useMutation<
    AppLayout_updateOnboardingStatusMutation,
    AppLayout_updateOnboardingStatusMutationVariables
  >(AppLayout_updateOnboardingStatusDocument, baseOptions);
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
  return Apollo.useMutation<
    PetitionHeader_reopenPetitionMutation,
    PetitionHeader_reopenPetitionMutationVariables
  >(PetitionHeader_reopenPetitionDocument, baseOptions);
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
  return Apollo.useMutation<
    PetitionHeader_updatePetitionUserSubscriptionMutation,
    PetitionHeader_updatePetitionUserSubscriptionMutationVariables
  >(PetitionHeader_updatePetitionUserSubscriptionDocument, baseOptions);
}
export type PetitionHeader_updatePetitionUserSubscriptionMutationHookResult = ReturnType<
  typeof usePetitionHeader_updatePetitionUserSubscriptionMutation
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
  return Apollo.useMutation<
    PetitionSettings_cancelPetitionSignatureRequestMutation,
    PetitionSettings_cancelPetitionSignatureRequestMutationVariables
  >(PetitionSettings_cancelPetitionSignatureRequestDocument, baseOptions);
}
export type PetitionSettings_cancelPetitionSignatureRequestMutationHookResult = ReturnType<
  typeof usePetitionSettings_cancelPetitionSignatureRequestMutation
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
  return Apollo.useMutation<
    PetitionSharingModal_addPetitionUserPermissionMutation,
    PetitionSharingModal_addPetitionUserPermissionMutationVariables
  >(PetitionSharingModal_addPetitionUserPermissionDocument, baseOptions);
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
  return Apollo.useMutation<
    PetitionSharingModal_removePetitionUserPermissionMutation,
    PetitionSharingModal_removePetitionUserPermissionMutationVariables
  >(PetitionSharingModal_removePetitionUserPermissionDocument, baseOptions);
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
  return Apollo.useMutation<
    PetitionSharingModal_transferPetitionOwnershipMutation,
    PetitionSharingModal_transferPetitionOwnershipMutationVariables
  >(PetitionSharingModal_transferPetitionOwnershipDocument, baseOptions);
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
  return Apollo.useQuery<
    PetitionSharingModal_PetitionUserPermissionsQuery,
    PetitionSharingModal_PetitionUserPermissionsQueryVariables
  >(PetitionSharingModal_PetitionUserPermissionsDocument, baseOptions);
}
export function usePetitionSharingModal_PetitionUserPermissionsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PetitionSharingModal_PetitionUserPermissionsQuery,
    PetitionSharingModal_PetitionUserPermissionsQueryVariables
  >
) {
  return Apollo.useLazyQuery<
    PetitionSharingModal_PetitionUserPermissionsQuery,
    PetitionSharingModal_PetitionUserPermissionsQueryVariables
  >(PetitionSharingModal_PetitionUserPermissionsDocument, baseOptions);
}
export type PetitionSharingModal_PetitionUserPermissionsQueryHookResult = ReturnType<
  typeof usePetitionSharingModal_PetitionUserPermissionsQuery
>;
export type PetitionSharingModal_PetitionUserPermissionsLazyQueryHookResult = ReturnType<
  typeof usePetitionSharingModal_PetitionUserPermissionsLazyQuery
>;
export const PetitionSharingModal_searchUsersDocument = gql`
  query PetitionSharingModal_searchUsers($search: String!, $exclude: [GID!]!) {
    me {
      organization {
        users(search: $search, limit: 10, exclude: $exclude) {
          items {
            ...UserSelect_User
          }
        }
      }
    }
  }
  ${UserSelect_UserFragmentDoc}
`;

/**
 * __usePetitionSharingModal_searchUsersQuery__
 *
 * To run a query within a React component, call `usePetitionSharingModal_searchUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `usePetitionSharingModal_searchUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePetitionSharingModal_searchUsersQuery({
 *   variables: {
 *      search: // value for 'search'
 *      exclude: // value for 'exclude'
 *   },
 * });
 */
export function usePetitionSharingModal_searchUsersQuery(
  baseOptions: Apollo.QueryHookOptions<
    PetitionSharingModal_searchUsersQuery,
    PetitionSharingModal_searchUsersQueryVariables
  >
) {
  return Apollo.useQuery<
    PetitionSharingModal_searchUsersQuery,
    PetitionSharingModal_searchUsersQueryVariables
  >(PetitionSharingModal_searchUsersDocument, baseOptions);
}
export function usePetitionSharingModal_searchUsersLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PetitionSharingModal_searchUsersQuery,
    PetitionSharingModal_searchUsersQueryVariables
  >
) {
  return Apollo.useLazyQuery<
    PetitionSharingModal_searchUsersQuery,
    PetitionSharingModal_searchUsersQueryVariables
  >(PetitionSharingModal_searchUsersDocument, baseOptions);
}
export type PetitionSharingModal_searchUsersQueryHookResult = ReturnType<
  typeof usePetitionSharingModal_searchUsersQuery
>;
export type PetitionSharingModal_searchUsersLazyQueryHookResult = ReturnType<
  typeof usePetitionSharingModal_searchUsersLazyQuery
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
  return Apollo.useQuery<
    useTemplateDetailsDialogPetitionQuery,
    useTemplateDetailsDialogPetitionQueryVariables
  >(useTemplateDetailsDialogPetitionDocument, baseOptions);
}
export function useuseTemplateDetailsDialogPetitionLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    useTemplateDetailsDialogPetitionQuery,
    useTemplateDetailsDialogPetitionQueryVariables
  >
) {
  return Apollo.useLazyQuery<
    useTemplateDetailsDialogPetitionQuery,
    useTemplateDetailsDialogPetitionQueryVariables
  >(useTemplateDetailsDialogPetitionDocument, baseOptions);
}
export type useTemplateDetailsDialogPetitionQueryHookResult = ReturnType<
  typeof useuseTemplateDetailsDialogPetitionQuery
>;
export type useTemplateDetailsDialogPetitionLazyQueryHookResult = ReturnType<
  typeof useuseTemplateDetailsDialogPetitionLazyQuery
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
  return Apollo.useMutation<
    PetitionSignaturesCard_cancelSignatureRequestMutation,
    PetitionSignaturesCard_cancelSignatureRequestMutationVariables
  >(PetitionSignaturesCard_cancelSignatureRequestDocument, baseOptions);
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
  return Apollo.useMutation<
    PetitionSignaturesCard_startSignatureRequestMutation,
    PetitionSignaturesCard_startSignatureRequestMutationVariables
  >(PetitionSignaturesCard_startSignatureRequestDocument, baseOptions);
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
  return Apollo.useMutation<
    PetitionSignaturesCard_signedPetitionDownloadLinkMutation,
    PetitionSignaturesCard_signedPetitionDownloadLinkMutationVariables
  >(PetitionSignaturesCard_signedPetitionDownloadLinkDocument, baseOptions);
}
export type PetitionSignaturesCard_signedPetitionDownloadLinkMutationHookResult = ReturnType<
  typeof usePetitionSignaturesCard_signedPetitionDownloadLinkMutation
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
  return Apollo.useQuery<AdminQuery, AdminQueryVariables>(
    AdminDocument,
    baseOptions
  );
}
export function useAdminLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<AdminQuery, AdminQueryVariables>
) {
  return Apollo.useLazyQuery<AdminQuery, AdminQueryVariables>(
    AdminDocument,
    baseOptions
  );
}
export type AdminQueryHookResult = ReturnType<typeof useAdminQuery>;
export type AdminLazyQueryHookResult = ReturnType<typeof useAdminLazyQuery>;
export const SupportMethodsUserDocument = gql`
  query SupportMethodsUser {
    me {
      ...SupportMethods_User
    }
  }
  ${SupportMethods_UserFragmentDoc}
`;

/**
 * __useSupportMethodsUserQuery__
 *
 * To run a query within a React component, call `useSupportMethodsUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useSupportMethodsUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSupportMethodsUserQuery({
 *   variables: {
 *   },
 * });
 */
export function useSupportMethodsUserQuery(
  baseOptions?: Apollo.QueryHookOptions<
    SupportMethodsUserQuery,
    SupportMethodsUserQueryVariables
  >
) {
  return Apollo.useQuery<
    SupportMethodsUserQuery,
    SupportMethodsUserQueryVariables
  >(SupportMethodsUserDocument, baseOptions);
}
export function useSupportMethodsUserLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    SupportMethodsUserQuery,
    SupportMethodsUserQueryVariables
  >
) {
  return Apollo.useLazyQuery<
    SupportMethodsUserQuery,
    SupportMethodsUserQueryVariables
  >(SupportMethodsUserDocument, baseOptions);
}
export type SupportMethodsUserQueryHookResult = ReturnType<
  typeof useSupportMethodsUserQuery
>;
export type SupportMethodsUserLazyQueryHookResult = ReturnType<
  typeof useSupportMethodsUserLazyQuery
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
  return Apollo.useMutation<
    Contact_updateContactMutation,
    Contact_updateContactMutationVariables
  >(Contact_updateContactDocument, baseOptions);
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
  return Apollo.useQuery<ContactUserQuery, ContactUserQueryVariables>(
    ContactUserDocument,
    baseOptions
  );
}
export function useContactUserLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ContactUserQuery,
    ContactUserQueryVariables
  >
) {
  return Apollo.useLazyQuery<ContactUserQuery, ContactUserQueryVariables>(
    ContactUserDocument,
    baseOptions
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
  return Apollo.useQuery<ContactQuery, ContactQueryVariables>(
    ContactDocument,
    baseOptions
  );
}
export function useContactLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<ContactQuery, ContactQueryVariables>
) {
  return Apollo.useLazyQuery<ContactQuery, ContactQueryVariables>(
    ContactDocument,
    baseOptions
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
  return Apollo.useMutation<
    Contacts_deleteContactsMutation,
    Contacts_deleteContactsMutationVariables
  >(Contacts_deleteContactsDocument, baseOptions);
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
  return Apollo.useQuery<ContactsQuery, ContactsQueryVariables>(
    ContactsDocument,
    baseOptions
  );
}
export function useContactsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ContactsQuery,
    ContactsQueryVariables
  >
) {
  return Apollo.useLazyQuery<ContactsQuery, ContactsQueryVariables>(
    ContactsDocument,
    baseOptions
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
  return Apollo.useQuery<ContactsUserQuery, ContactsUserQueryVariables>(
    ContactsUserDocument,
    baseOptions
  );
}
export function useContactsUserLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ContactsUserQuery,
    ContactsUserQueryVariables
  >
) {
  return Apollo.useLazyQuery<ContactsUserQuery, ContactsUserQueryVariables>(
    ContactsUserDocument,
    baseOptions
  );
}
export type ContactsUserQueryHookResult = ReturnType<
  typeof useContactsUserQuery
>;
export type ContactsUserLazyQueryHookResult = ReturnType<
  typeof useContactsUserLazyQuery
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
  return Apollo.useMutation<
    PetitionActivity_updatePetitionMutation,
    PetitionActivity_updatePetitionMutationVariables
  >(PetitionActivity_updatePetitionDocument, baseOptions);
}
export type PetitionActivity_updatePetitionMutationHookResult = ReturnType<
  typeof usePetitionActivity_updatePetitionMutation
>;
export const PetitionActivity_sendMessagesDocument = gql`
  mutation PetitionActivity_sendMessages(
    $petitionId: GID!
    $accessIds: [GID!]!
    $subject: String!
    $body: JSON!
    $scheduledAt: DateTime
  ) {
    sendMessages(
      petitionId: $petitionId
      accessIds: $accessIds
      subject: $subject
      body: $body
      scheduledAt: $scheduledAt
    )
  }
`;

/**
 * __usePetitionActivity_sendMessagesMutation__
 *
 * To run a mutation, you first call `usePetitionActivity_sendMessagesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionActivity_sendMessagesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionActivitySendMessagesMutation, { data, loading, error }] = usePetitionActivity_sendMessagesMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      accessIds: // value for 'accessIds'
 *      subject: // value for 'subject'
 *      body: // value for 'body'
 *      scheduledAt: // value for 'scheduledAt'
 *   },
 * });
 */
export function usePetitionActivity_sendMessagesMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionActivity_sendMessagesMutation,
    PetitionActivity_sendMessagesMutationVariables
  >
) {
  return Apollo.useMutation<
    PetitionActivity_sendMessagesMutation,
    PetitionActivity_sendMessagesMutationVariables
  >(PetitionActivity_sendMessagesDocument, baseOptions);
}
export type PetitionActivity_sendMessagesMutationHookResult = ReturnType<
  typeof usePetitionActivity_sendMessagesMutation
>;
export const PetitionActivity_sendRemindersDocument = gql`
  mutation PetitionActivity_sendReminders(
    $petitionId: GID!
    $accessIds: [GID!]!
  ) {
    sendReminders(petitionId: $petitionId, accessIds: $accessIds)
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
 *   },
 * });
 */
export function usePetitionActivity_sendRemindersMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionActivity_sendRemindersMutation,
    PetitionActivity_sendRemindersMutationVariables
  >
) {
  return Apollo.useMutation<
    PetitionActivity_sendRemindersMutation,
    PetitionActivity_sendRemindersMutationVariables
  >(PetitionActivity_sendRemindersDocument, baseOptions);
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
  return Apollo.useMutation<
    PetitionActivity_deactivateAccessesMutation,
    PetitionActivity_deactivateAccessesMutationVariables
  >(PetitionActivity_deactivateAccessesDocument, baseOptions);
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
  return Apollo.useMutation<
    PetitionActivity_reactivateAccessesMutation,
    PetitionActivity_reactivateAccessesMutationVariables
  >(PetitionActivity_reactivateAccessesDocument, baseOptions);
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
  return Apollo.useMutation<
    PetitionActivity_cancelScheduledMessageMutation,
    PetitionActivity_cancelScheduledMessageMutationVariables
  >(PetitionActivity_cancelScheduledMessageDocument, baseOptions);
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
  return Apollo.useMutation<
    PetitionsActivity_sendPetitionMutation,
    PetitionsActivity_sendPetitionMutationVariables
  >(PetitionsActivity_sendPetitionDocument, baseOptions);
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
  return Apollo.useMutation<
    PetitionActivity_switchAutomaticRemindersMutation,
    PetitionActivity_switchAutomaticRemindersMutationVariables
  >(PetitionActivity_switchAutomaticRemindersDocument, baseOptions);
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
  return Apollo.useQuery<PetitionActivityQuery, PetitionActivityQueryVariables>(
    PetitionActivityDocument,
    baseOptions
  );
}
export function usePetitionActivityLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PetitionActivityQuery,
    PetitionActivityQueryVariables
  >
) {
  return Apollo.useLazyQuery<
    PetitionActivityQuery,
    PetitionActivityQueryVariables
  >(PetitionActivityDocument, baseOptions);
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
  return Apollo.useQuery<
    PetitionActivityUserQuery,
    PetitionActivityUserQueryVariables
  >(PetitionActivityUserDocument, baseOptions);
}
export function usePetitionActivityUserLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PetitionActivityUserQuery,
    PetitionActivityUserQueryVariables
  >
) {
  return Apollo.useLazyQuery<
    PetitionActivityUserQuery,
    PetitionActivityUserQueryVariables
  >(PetitionActivityUserDocument, baseOptions);
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
  return Apollo.useMutation<
    PetitionCompose_updatePetitionMutation,
    PetitionCompose_updatePetitionMutationVariables
  >(PetitionCompose_updatePetitionDocument, baseOptions);
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
  return Apollo.useMutation<
    PetitionCompose_updateFieldPositionsMutation,
    PetitionCompose_updateFieldPositionsMutationVariables
  >(PetitionCompose_updateFieldPositionsDocument, baseOptions);
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
  return Apollo.useMutation<
    PetitionCompose_createPetitionFieldMutation,
    PetitionCompose_createPetitionFieldMutationVariables
  >(PetitionCompose_createPetitionFieldDocument, baseOptions);
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
  return Apollo.useMutation<
    PetitionCompose_clonePetitionFieldMutation,
    PetitionCompose_clonePetitionFieldMutationVariables
  >(PetitionCompose_clonePetitionFieldDocument, baseOptions);
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
  return Apollo.useMutation<
    PetitionCompose_deletePetitionFieldMutation,
    PetitionCompose_deletePetitionFieldMutationVariables
  >(PetitionCompose_deletePetitionFieldDocument, baseOptions);
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
  return Apollo.useMutation<
    PetitionCompose_updatePetitionFieldMutation,
    PetitionCompose_updatePetitionFieldMutationVariables
  >(PetitionCompose_updatePetitionFieldDocument, baseOptions);
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
  return Apollo.useMutation<
    PetitionCompose_changePetitionFieldTypeMutation,
    PetitionCompose_changePetitionFieldTypeMutationVariables
  >(PetitionCompose_changePetitionFieldTypeDocument, baseOptions);
}
export type PetitionCompose_changePetitionFieldTypeMutationHookResult = ReturnType<
  typeof usePetitionCompose_changePetitionFieldTypeMutation
>;
export const PetitionCompose_sendPetitionDocument = gql`
  mutation PetitionCompose_sendPetition(
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
      petition {
        id
        status
      }
    }
  }
`;

/**
 * __usePetitionCompose_sendPetitionMutation__
 *
 * To run a mutation, you first call `usePetitionCompose_sendPetitionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionCompose_sendPetitionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionComposeSendPetitionMutation, { data, loading, error }] = usePetitionCompose_sendPetitionMutation({
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
export function usePetitionCompose_sendPetitionMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionCompose_sendPetitionMutation,
    PetitionCompose_sendPetitionMutationVariables
  >
) {
  return Apollo.useMutation<
    PetitionCompose_sendPetitionMutation,
    PetitionCompose_sendPetitionMutationVariables
  >(PetitionCompose_sendPetitionDocument, baseOptions);
}
export type PetitionCompose_sendPetitionMutationHookResult = ReturnType<
  typeof usePetitionCompose_sendPetitionMutation
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
  return Apollo.useQuery<
    PetitionComposeUserQuery,
    PetitionComposeUserQueryVariables
  >(PetitionComposeUserDocument, baseOptions);
}
export function usePetitionComposeUserLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PetitionComposeUserQuery,
    PetitionComposeUserQueryVariables
  >
) {
  return Apollo.useLazyQuery<
    PetitionComposeUserQuery,
    PetitionComposeUserQueryVariables
  >(PetitionComposeUserDocument, baseOptions);
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
  return Apollo.useQuery<PetitionComposeQuery, PetitionComposeQueryVariables>(
    PetitionComposeDocument,
    baseOptions
  );
}
export function usePetitionComposeLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PetitionComposeQuery,
    PetitionComposeQueryVariables
  >
) {
  return Apollo.useLazyQuery<
    PetitionComposeQuery,
    PetitionComposeQueryVariables
  >(PetitionComposeDocument, baseOptions);
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
  return Apollo.useQuery<PetitionQuery, PetitionQueryVariables>(
    PetitionDocument,
    baseOptions
  );
}
export function usePetitionLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PetitionQuery,
    PetitionQueryVariables
  >
) {
  return Apollo.useLazyQuery<PetitionQuery, PetitionQueryVariables>(
    PetitionDocument,
    baseOptions
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
  return Apollo.useMutation<
    PetitionReplies_updatePetitionMutation,
    PetitionReplies_updatePetitionMutationVariables
  >(PetitionReplies_updatePetitionDocument, baseOptions);
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
  return Apollo.useMutation<
    PetitionReplies_validatePetitionFieldsMutation,
    PetitionReplies_validatePetitionFieldsMutationVariables
  >(PetitionReplies_validatePetitionFieldsDocument, baseOptions);
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
  return Apollo.useMutation<
    PetitionReplies_fileUploadReplyDownloadLinkMutation,
    PetitionReplies_fileUploadReplyDownloadLinkMutationVariables
  >(PetitionReplies_fileUploadReplyDownloadLinkDocument, baseOptions);
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
  return Apollo.useMutation<
    PetitionReplies_createPetitionFieldCommentMutation,
    PetitionReplies_createPetitionFieldCommentMutationVariables
  >(PetitionReplies_createPetitionFieldCommentDocument, baseOptions);
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
  return Apollo.useMutation<
    PetitionReplies_updatePetitionFieldCommentMutation,
    PetitionReplies_updatePetitionFieldCommentMutationVariables
  >(PetitionReplies_updatePetitionFieldCommentDocument, baseOptions);
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
  return Apollo.useMutation<
    PetitionReplies_deletePetitionFieldCommentMutation,
    PetitionReplies_deletePetitionFieldCommentMutationVariables
  >(PetitionReplies_deletePetitionFieldCommentDocument, baseOptions);
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
  return Apollo.useMutation<
    PetitionReplies_submitUnpublishedCommentsMutation,
    PetitionReplies_submitUnpublishedCommentsMutationVariables
  >(PetitionReplies_submitUnpublishedCommentsDocument, baseOptions);
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
  return Apollo.useMutation<
    PetitionReplies_markPetitionFieldCommentsAsReadMutation,
    PetitionReplies_markPetitionFieldCommentsAsReadMutationVariables
  >(PetitionReplies_markPetitionFieldCommentsAsReadDocument, baseOptions);
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
  return Apollo.useMutation<
    PetitionReplies_updatePetitionFieldRepliesStatusMutation,
    PetitionReplies_updatePetitionFieldRepliesStatusMutationVariables
  >(PetitionReplies_updatePetitionFieldRepliesStatusDocument, baseOptions);
}
export type PetitionReplies_updatePetitionFieldRepliesStatusMutationHookResult = ReturnType<
  typeof usePetitionReplies_updatePetitionFieldRepliesStatusMutation
>;
export const PetitionReplies_sendPetitionClosedNotificationDocument = gql`
  mutation PetitionReplies_sendPetitionClosedNotification(
    $petitionId: GID!
    $emailBody: JSON!
    $force: Boolean
  ) {
    sendPetitionClosedNotification(
      petitionId: $petitionId
      emailBody: $emailBody
      force: $force
    ) {
      id
      events(limit: 1000) {
        items {
          id
          __typename
        }
      }
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
  return Apollo.useMutation<
    PetitionReplies_sendPetitionClosedNotificationMutation,
    PetitionReplies_sendPetitionClosedNotificationMutationVariables
  >(PetitionReplies_sendPetitionClosedNotificationDocument, baseOptions);
}
export type PetitionReplies_sendPetitionClosedNotificationMutationHookResult = ReturnType<
  typeof usePetitionReplies_sendPetitionClosedNotificationMutation
>;
export const PetitionReplies_presendPetitionClosedNotificationDocument = gql`
  mutation PetitionReplies_presendPetitionClosedNotification(
    $petitionId: GID!
  ) {
    presendPetitionClosedNotification(petitionId: $petitionId)
  }
`;

/**
 * __usePetitionReplies_presendPetitionClosedNotificationMutation__
 *
 * To run a mutation, you first call `usePetitionReplies_presendPetitionClosedNotificationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionReplies_presendPetitionClosedNotificationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionRepliesPresendPetitionClosedNotificationMutation, { data, loading, error }] = usePetitionReplies_presendPetitionClosedNotificationMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *   },
 * });
 */
export function usePetitionReplies_presendPetitionClosedNotificationMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PetitionReplies_presendPetitionClosedNotificationMutation,
    PetitionReplies_presendPetitionClosedNotificationMutationVariables
  >
) {
  return Apollo.useMutation<
    PetitionReplies_presendPetitionClosedNotificationMutation,
    PetitionReplies_presendPetitionClosedNotificationMutationVariables
  >(PetitionReplies_presendPetitionClosedNotificationDocument, baseOptions);
}
export type PetitionReplies_presendPetitionClosedNotificationMutationHookResult = ReturnType<
  typeof usePetitionReplies_presendPetitionClosedNotificationMutation
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
  return Apollo.useQuery<
    PetitionRepliesUserQuery,
    PetitionRepliesUserQueryVariables
  >(PetitionRepliesUserDocument, baseOptions);
}
export function usePetitionRepliesUserLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PetitionRepliesUserQuery,
    PetitionRepliesUserQueryVariables
  >
) {
  return Apollo.useLazyQuery<
    PetitionRepliesUserQuery,
    PetitionRepliesUserQueryVariables
  >(PetitionRepliesUserDocument, baseOptions);
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
  return Apollo.useQuery<PetitionRepliesQuery, PetitionRepliesQueryVariables>(
    PetitionRepliesDocument,
    baseOptions
  );
}
export function usePetitionRepliesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PetitionRepliesQuery,
    PetitionRepliesQueryVariables
  >
) {
  return Apollo.useLazyQuery<
    PetitionRepliesQuery,
    PetitionRepliesQueryVariables
  >(PetitionRepliesDocument, baseOptions);
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
  return Apollo.useQuery<PetitionsUserQuery, PetitionsUserQueryVariables>(
    PetitionsUserDocument,
    baseOptions
  );
}
export function usePetitionsUserLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PetitionsUserQuery,
    PetitionsUserQueryVariables
  >
) {
  return Apollo.useLazyQuery<PetitionsUserQuery, PetitionsUserQueryVariables>(
    PetitionsUserDocument,
    baseOptions
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
  return Apollo.useQuery<PetitionsQuery, PetitionsQueryVariables>(
    PetitionsDocument,
    baseOptions
  );
}
export function usePetitionsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PetitionsQuery,
    PetitionsQueryVariables
  >
) {
  return Apollo.useLazyQuery<PetitionsQuery, PetitionsQueryVariables>(
    PetitionsDocument,
    baseOptions
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
  return Apollo.useQuery<
    NewPetitionPublicTemplatesQuery,
    NewPetitionPublicTemplatesQueryVariables
  >(NewPetitionPublicTemplatesDocument, baseOptions);
}
export function useNewPetitionPublicTemplatesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    NewPetitionPublicTemplatesQuery,
    NewPetitionPublicTemplatesQueryVariables
  >
) {
  return Apollo.useLazyQuery<
    NewPetitionPublicTemplatesQuery,
    NewPetitionPublicTemplatesQueryVariables
  >(NewPetitionPublicTemplatesDocument, baseOptions);
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
  return Apollo.useQuery<
    NewPetitionTemplatesQuery,
    NewPetitionTemplatesQueryVariables
  >(NewPetitionTemplatesDocument, baseOptions);
}
export function useNewPetitionTemplatesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    NewPetitionTemplatesQuery,
    NewPetitionTemplatesQueryVariables
  >
) {
  return Apollo.useLazyQuery<
    NewPetitionTemplatesQuery,
    NewPetitionTemplatesQueryVariables
  >(NewPetitionTemplatesDocument, baseOptions);
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
  return Apollo.useQuery<NewPetitionUserQuery, NewPetitionUserQueryVariables>(
    NewPetitionUserDocument,
    baseOptions
  );
}
export function useNewPetitionUserLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    NewPetitionUserQuery,
    NewPetitionUserQueryVariables
  >
) {
  return Apollo.useLazyQuery<
    NewPetitionUserQuery,
    NewPetitionUserQueryVariables
  >(NewPetitionUserDocument, baseOptions);
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
  return Apollo.useMutation<
    Account_updateAccountMutation,
    Account_updateAccountMutationVariables
  >(Account_updateAccountDocument, baseOptions);
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
  return Apollo.useQuery<AccountQuery, AccountQueryVariables>(
    AccountDocument,
    baseOptions
  );
}
export function useAccountLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<AccountQuery, AccountQueryVariables>
) {
  return Apollo.useLazyQuery<AccountQuery, AccountQueryVariables>(
    AccountDocument,
    baseOptions
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
  return Apollo.useQuery<SettingsQuery, SettingsQueryVariables>(
    SettingsDocument,
    baseOptions
  );
}
export function useSettingsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    SettingsQuery,
    SettingsQueryVariables
  >
) {
  return Apollo.useLazyQuery<SettingsQuery, SettingsQueryVariables>(
    SettingsDocument,
    baseOptions
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
  return Apollo.useMutation<
    Security_updatePasswordMutation,
    Security_updatePasswordMutationVariables
  >(Security_updatePasswordDocument, baseOptions);
}
export type Security_updatePasswordMutationHookResult = ReturnType<
  typeof useSecurity_updatePasswordMutation
>;
export const SecurityDocument = gql`
  query Security {
    me {
      id
      ...AppLayout_User
    }
  }
  ${AppLayout_UserFragmentDoc}
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
  return Apollo.useQuery<SecurityQuery, SecurityQueryVariables>(
    SecurityDocument,
    baseOptions
  );
}
export function useSecurityLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    SecurityQuery,
    SecurityQueryVariables
  >
) {
  return Apollo.useLazyQuery<SecurityQuery, SecurityQueryVariables>(
    SecurityDocument,
    baseOptions
  );
}
export type SecurityQueryHookResult = ReturnType<typeof useSecurityQuery>;
export type SecurityLazyQueryHookResult = ReturnType<
  typeof useSecurityLazyQuery
>;
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
  return Apollo.useQuery<CurrentUserQuery, CurrentUserQueryVariables>(
    CurrentUserDocument,
    baseOptions
  );
}
export function useCurrentUserLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    CurrentUserQuery,
    CurrentUserQueryVariables
  >
) {
  return Apollo.useLazyQuery<CurrentUserQuery, CurrentUserQueryVariables>(
    CurrentUserDocument,
    baseOptions
  );
}
export type CurrentUserQueryHookResult = ReturnType<typeof useCurrentUserQuery>;
export type CurrentUserLazyQueryHookResult = ReturnType<
  typeof useCurrentUserLazyQuery
>;
export const RecipientView_publicDeletePetitionReplyDocument = gql`
  mutation RecipientView_publicDeletePetitionReply(
    $replyId: GID!
    $keycode: ID!
  ) {
    publicDeletePetitionReply(replyId: $replyId, keycode: $keycode)
  }
`;

/**
 * __useRecipientView_publicDeletePetitionReplyMutation__
 *
 * To run a mutation, you first call `useRecipientView_publicDeletePetitionReplyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRecipientView_publicDeletePetitionReplyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [recipientViewPublicDeletePetitionReplyMutation, { data, loading, error }] = useRecipientView_publicDeletePetitionReplyMutation({
 *   variables: {
 *      replyId: // value for 'replyId'
 *      keycode: // value for 'keycode'
 *   },
 * });
 */
export function useRecipientView_publicDeletePetitionReplyMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RecipientView_publicDeletePetitionReplyMutation,
    RecipientView_publicDeletePetitionReplyMutationVariables
  >
) {
  return Apollo.useMutation<
    RecipientView_publicDeletePetitionReplyMutation,
    RecipientView_publicDeletePetitionReplyMutationVariables
  >(RecipientView_publicDeletePetitionReplyDocument, baseOptions);
}
export type RecipientView_publicDeletePetitionReplyMutationHookResult = ReturnType<
  typeof useRecipientView_publicDeletePetitionReplyMutation
>;
export const RecipientView_publicCreateTextReplyDocument = gql`
  mutation RecipientView_publicCreateTextReply(
    $keycode: ID!
    $fieldId: GID!
    $data: CreateTextReplyInput!
  ) {
    publicCreateTextReply(keycode: $keycode, fieldId: $fieldId, data: $data) {
      ...RecipientViewPetitionField_PublicPetitionFieldReply
    }
  }
  ${RecipientViewPetitionField_PublicPetitionFieldReplyFragmentDoc}
`;

/**
 * __useRecipientView_publicCreateTextReplyMutation__
 *
 * To run a mutation, you first call `useRecipientView_publicCreateTextReplyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRecipientView_publicCreateTextReplyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [recipientViewPublicCreateTextReplyMutation, { data, loading, error }] = useRecipientView_publicCreateTextReplyMutation({
 *   variables: {
 *      keycode: // value for 'keycode'
 *      fieldId: // value for 'fieldId'
 *      data: // value for 'data'
 *   },
 * });
 */
export function useRecipientView_publicCreateTextReplyMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RecipientView_publicCreateTextReplyMutation,
    RecipientView_publicCreateTextReplyMutationVariables
  >
) {
  return Apollo.useMutation<
    RecipientView_publicCreateTextReplyMutation,
    RecipientView_publicCreateTextReplyMutationVariables
  >(RecipientView_publicCreateTextReplyDocument, baseOptions);
}
export type RecipientView_publicCreateTextReplyMutationHookResult = ReturnType<
  typeof useRecipientView_publicCreateTextReplyMutation
>;
export const RecipientView_publicCreateFileUploadReplyDocument = gql`
  mutation RecipientView_publicCreateFileUploadReply(
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
        ...RecipientViewPetitionField_PublicPetitionFieldReply
      }
    }
  }
  ${RecipientViewPetitionField_PublicPetitionFieldReplyFragmentDoc}
`;

/**
 * __useRecipientView_publicCreateFileUploadReplyMutation__
 *
 * To run a mutation, you first call `useRecipientView_publicCreateFileUploadReplyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRecipientView_publicCreateFileUploadReplyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [recipientViewPublicCreateFileUploadReplyMutation, { data, loading, error }] = useRecipientView_publicCreateFileUploadReplyMutation({
 *   variables: {
 *      keycode: // value for 'keycode'
 *      fieldId: // value for 'fieldId'
 *      data: // value for 'data'
 *   },
 * });
 */
export function useRecipientView_publicCreateFileUploadReplyMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RecipientView_publicCreateFileUploadReplyMutation,
    RecipientView_publicCreateFileUploadReplyMutationVariables
  >
) {
  return Apollo.useMutation<
    RecipientView_publicCreateFileUploadReplyMutation,
    RecipientView_publicCreateFileUploadReplyMutationVariables
  >(RecipientView_publicCreateFileUploadReplyDocument, baseOptions);
}
export type RecipientView_publicCreateFileUploadReplyMutationHookResult = ReturnType<
  typeof useRecipientView_publicCreateFileUploadReplyMutation
>;
export const RecipientView_publicCreateSelectReplyDocument = gql`
  mutation RecipientView_publicCreateSelectReply(
    $keycode: ID!
    $fieldId: GID!
    $data: CreateTextReplyInput!
  ) {
    publicCreateSelectReply(keycode: $keycode, fieldId: $fieldId, data: $data) {
      ...RecipientViewPetitionField_PublicPetitionFieldReply
    }
  }
  ${RecipientViewPetitionField_PublicPetitionFieldReplyFragmentDoc}
`;

/**
 * __useRecipientView_publicCreateSelectReplyMutation__
 *
 * To run a mutation, you first call `useRecipientView_publicCreateSelectReplyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRecipientView_publicCreateSelectReplyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [recipientViewPublicCreateSelectReplyMutation, { data, loading, error }] = useRecipientView_publicCreateSelectReplyMutation({
 *   variables: {
 *      keycode: // value for 'keycode'
 *      fieldId: // value for 'fieldId'
 *      data: // value for 'data'
 *   },
 * });
 */
export function useRecipientView_publicCreateSelectReplyMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RecipientView_publicCreateSelectReplyMutation,
    RecipientView_publicCreateSelectReplyMutationVariables
  >
) {
  return Apollo.useMutation<
    RecipientView_publicCreateSelectReplyMutation,
    RecipientView_publicCreateSelectReplyMutationVariables
  >(RecipientView_publicCreateSelectReplyDocument, baseOptions);
}
export type RecipientView_publicCreateSelectReplyMutationHookResult = ReturnType<
  typeof useRecipientView_publicCreateSelectReplyMutation
>;
export const RecipientView_publicFileUploadReplyCompleteDocument = gql`
  mutation RecipientView_publicFileUploadReplyComplete(
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
 * __useRecipientView_publicFileUploadReplyCompleteMutation__
 *
 * To run a mutation, you first call `useRecipientView_publicFileUploadReplyCompleteMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRecipientView_publicFileUploadReplyCompleteMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [recipientViewPublicFileUploadReplyCompleteMutation, { data, loading, error }] = useRecipientView_publicFileUploadReplyCompleteMutation({
 *   variables: {
 *      keycode: // value for 'keycode'
 *      replyId: // value for 'replyId'
 *   },
 * });
 */
export function useRecipientView_publicFileUploadReplyCompleteMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RecipientView_publicFileUploadReplyCompleteMutation,
    RecipientView_publicFileUploadReplyCompleteMutationVariables
  >
) {
  return Apollo.useMutation<
    RecipientView_publicFileUploadReplyCompleteMutation,
    RecipientView_publicFileUploadReplyCompleteMutationVariables
  >(RecipientView_publicFileUploadReplyCompleteDocument, baseOptions);
}
export type RecipientView_publicFileUploadReplyCompleteMutationHookResult = ReturnType<
  typeof useRecipientView_publicFileUploadReplyCompleteMutation
>;
export const RecipientView_publicCompletePetitionDocument = gql`
  mutation RecipientView_publicCompletePetition($keycode: ID!) {
    publicCompletePetition(keycode: $keycode) {
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
 *   },
 * });
 */
export function useRecipientView_publicCompletePetitionMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RecipientView_publicCompletePetitionMutation,
    RecipientView_publicCompletePetitionMutationVariables
  >
) {
  return Apollo.useMutation<
    RecipientView_publicCompletePetitionMutation,
    RecipientView_publicCompletePetitionMutationVariables
  >(RecipientView_publicCompletePetitionDocument, baseOptions);
}
export type RecipientView_publicCompletePetitionMutationHookResult = ReturnType<
  typeof useRecipientView_publicCompletePetitionMutation
>;
export const RecipientView_createPetitionFieldCommentDocument = gql`
  mutation RecipientView_createPetitionFieldComment(
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
 * __useRecipientView_createPetitionFieldCommentMutation__
 *
 * To run a mutation, you first call `useRecipientView_createPetitionFieldCommentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRecipientView_createPetitionFieldCommentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [recipientViewCreatePetitionFieldCommentMutation, { data, loading, error }] = useRecipientView_createPetitionFieldCommentMutation({
 *   variables: {
 *      keycode: // value for 'keycode'
 *      petitionFieldId: // value for 'petitionFieldId'
 *      content: // value for 'content'
 *   },
 * });
 */
export function useRecipientView_createPetitionFieldCommentMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RecipientView_createPetitionFieldCommentMutation,
    RecipientView_createPetitionFieldCommentMutationVariables
  >
) {
  return Apollo.useMutation<
    RecipientView_createPetitionFieldCommentMutation,
    RecipientView_createPetitionFieldCommentMutationVariables
  >(RecipientView_createPetitionFieldCommentDocument, baseOptions);
}
export type RecipientView_createPetitionFieldCommentMutationHookResult = ReturnType<
  typeof useRecipientView_createPetitionFieldCommentMutation
>;
export const RecipientView_updatePetitionFieldCommentDocument = gql`
  mutation RecipientView_updatePetitionFieldComment(
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
 * __useRecipientView_updatePetitionFieldCommentMutation__
 *
 * To run a mutation, you first call `useRecipientView_updatePetitionFieldCommentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRecipientView_updatePetitionFieldCommentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [recipientViewUpdatePetitionFieldCommentMutation, { data, loading, error }] = useRecipientView_updatePetitionFieldCommentMutation({
 *   variables: {
 *      keycode: // value for 'keycode'
 *      petitionFieldId: // value for 'petitionFieldId'
 *      petitionFieldCommentId: // value for 'petitionFieldCommentId'
 *      content: // value for 'content'
 *   },
 * });
 */
export function useRecipientView_updatePetitionFieldCommentMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RecipientView_updatePetitionFieldCommentMutation,
    RecipientView_updatePetitionFieldCommentMutationVariables
  >
) {
  return Apollo.useMutation<
    RecipientView_updatePetitionFieldCommentMutation,
    RecipientView_updatePetitionFieldCommentMutationVariables
  >(RecipientView_updatePetitionFieldCommentDocument, baseOptions);
}
export type RecipientView_updatePetitionFieldCommentMutationHookResult = ReturnType<
  typeof useRecipientView_updatePetitionFieldCommentMutation
>;
export const RecipientView_deletePetitionFieldCommentDocument = gql`
  mutation RecipientView_deletePetitionFieldComment(
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
 * __useRecipientView_deletePetitionFieldCommentMutation__
 *
 * To run a mutation, you first call `useRecipientView_deletePetitionFieldCommentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRecipientView_deletePetitionFieldCommentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [recipientViewDeletePetitionFieldCommentMutation, { data, loading, error }] = useRecipientView_deletePetitionFieldCommentMutation({
 *   variables: {
 *      keycode: // value for 'keycode'
 *      petitionFieldId: // value for 'petitionFieldId'
 *      petitionFieldCommentId: // value for 'petitionFieldCommentId'
 *   },
 * });
 */
export function useRecipientView_deletePetitionFieldCommentMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RecipientView_deletePetitionFieldCommentMutation,
    RecipientView_deletePetitionFieldCommentMutationVariables
  >
) {
  return Apollo.useMutation<
    RecipientView_deletePetitionFieldCommentMutation,
    RecipientView_deletePetitionFieldCommentMutationVariables
  >(RecipientView_deletePetitionFieldCommentDocument, baseOptions);
}
export type RecipientView_deletePetitionFieldCommentMutationHookResult = ReturnType<
  typeof useRecipientView_deletePetitionFieldCommentMutation
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
  return Apollo.useMutation<
    RecipientView_submitUnpublishedCommentsMutation,
    RecipientView_submitUnpublishedCommentsMutationVariables
  >(RecipientView_submitUnpublishedCommentsDocument, baseOptions);
}
export type RecipientView_submitUnpublishedCommentsMutationHookResult = ReturnType<
  typeof useRecipientView_submitUnpublishedCommentsMutation
>;
export const RecipientView_markPetitionFieldCommentsAsReadDocument = gql`
  mutation RecipientView_markPetitionFieldCommentsAsRead(
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
 * __useRecipientView_markPetitionFieldCommentsAsReadMutation__
 *
 * To run a mutation, you first call `useRecipientView_markPetitionFieldCommentsAsReadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRecipientView_markPetitionFieldCommentsAsReadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [recipientViewMarkPetitionFieldCommentsAsReadMutation, { data, loading, error }] = useRecipientView_markPetitionFieldCommentsAsReadMutation({
 *   variables: {
 *      keycode: // value for 'keycode'
 *      petitionFieldCommentIds: // value for 'petitionFieldCommentIds'
 *   },
 * });
 */
export function useRecipientView_markPetitionFieldCommentsAsReadMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RecipientView_markPetitionFieldCommentsAsReadMutation,
    RecipientView_markPetitionFieldCommentsAsReadMutationVariables
  >
) {
  return Apollo.useMutation<
    RecipientView_markPetitionFieldCommentsAsReadMutation,
    RecipientView_markPetitionFieldCommentsAsReadMutationVariables
  >(RecipientView_markPetitionFieldCommentsAsReadDocument, baseOptions);
}
export type RecipientView_markPetitionFieldCommentsAsReadMutationHookResult = ReturnType<
  typeof useRecipientView_markPetitionFieldCommentsAsReadMutation
>;
export const PublicPetitionDocument = gql`
  query PublicPetition($keycode: ID!) {
    access(keycode: $keycode) {
      petition {
        ...RecipientView_PublicPetition
      }
      granter {
        ...RecipientView_PublicUser
      }
      contact {
        id
      }
    }
  }
  ${RecipientView_PublicPetitionFragmentDoc}
  ${RecipientView_PublicUserFragmentDoc}
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
  return Apollo.useQuery<PublicPetitionQuery, PublicPetitionQueryVariables>(
    PublicPetitionDocument,
    baseOptions
  );
}
export function usePublicPetitionLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PublicPetitionQuery,
    PublicPetitionQueryVariables
  >
) {
  return Apollo.useLazyQuery<PublicPetitionQuery, PublicPetitionQueryVariables>(
    PublicPetitionDocument,
    baseOptions
  );
}
export type PublicPetitionQueryHookResult = ReturnType<
  typeof usePublicPetitionQuery
>;
export type PublicPetitionLazyQueryHookResult = ReturnType<
  typeof usePublicPetitionLazyQuery
>;
export const PdfViewPetitionDocument = gql`
  query PdfViewPetition($token: String!) {
    petitionSignatureRequestToken(token: $token) {
      ...PrintPetitionSignature_PetitionSignatureRequest
    }
  }
  ${PrintPetitionSignature_PetitionSignatureRequestFragmentDoc}
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
  return Apollo.useQuery<PdfViewPetitionQuery, PdfViewPetitionQueryVariables>(
    PdfViewPetitionDocument,
    baseOptions
  );
}
export function usePdfViewPetitionLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PdfViewPetitionQuery,
    PdfViewPetitionQueryVariables
  >
) {
  return Apollo.useLazyQuery<
    PdfViewPetitionQuery,
    PdfViewPetitionQueryVariables
  >(PdfViewPetitionDocument, baseOptions);
}
export type PdfViewPetitionQueryHookResult = ReturnType<
  typeof usePdfViewPetitionQuery
>;
export type PdfViewPetitionLazyQueryHookResult = ReturnType<
  typeof usePdfViewPetitionLazyQuery
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
  return Apollo.useMutation<
    useClonePetitions_clonePetitionsMutation,
    useClonePetitions_clonePetitionsMutationVariables
  >(useClonePetitions_clonePetitionsDocument, baseOptions);
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
  return Apollo.useMutation<
    useCreateContact_createContactMutation,
    useCreateContact_createContactMutationVariables
  >(useCreateContact_createContactDocument, baseOptions);
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
  return Apollo.useMutation<
    useCreatePetition_createPetitionMutation,
    useCreatePetition_createPetitionMutationVariables
  >(useCreatePetition_createPetitionDocument, baseOptions);
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
  return Apollo.useMutation<
    useDeletePetitions_deletePetitionsMutation,
    useDeletePetitions_deletePetitionsMutationVariables
  >(useDeletePetitions_deletePetitionsDocument, baseOptions);
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
  return Apollo.useQuery<
    PetitionComposeSearchContactsQuery,
    PetitionComposeSearchContactsQueryVariables
  >(PetitionComposeSearchContactsDocument, baseOptions);
}
export function usePetitionComposeSearchContactsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PetitionComposeSearchContactsQuery,
    PetitionComposeSearchContactsQueryVariables
  >
) {
  return Apollo.useLazyQuery<
    PetitionComposeSearchContactsQuery,
    PetitionComposeSearchContactsQueryVariables
  >(PetitionComposeSearchContactsDocument, baseOptions);
}
export type PetitionComposeSearchContactsQueryHookResult = ReturnType<
  typeof usePetitionComposeSearchContactsQuery
>;
export type PetitionComposeSearchContactsLazyQueryHookResult = ReturnType<
  typeof usePetitionComposeSearchContactsLazyQuery
>;
