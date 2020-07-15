import gql from "graphql-tag";
import * as ApolloReactCommon from "@apollo/react-common";
import * as ApolloReactHooks from "@apollo/react-hooks";
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: any }> = { [K in keyof T]: T[K] };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: string;
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: any;
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: { [key: string]: any };
};

export type AccessActivatedEvent = PetitionEvent & {
  __typename?: "AccessActivatedEvent";
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["ID"];
  user: User;
};

export type AccessDeactivatedEvent = PetitionEvent & {
  __typename?: "AccessDeactivatedEvent";
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["ID"];
  user: User;
};

export type AccessOpenedEvent = PetitionEvent & {
  __typename?: "AccessOpenedEvent";
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["ID"];
};

export type ChangePasswordResult =
  | "INCORRECT_PASSWORD"
  | "INVALID_NEW_PASSWORD"
  | "SUCCESS";

export type CommentDeletedEvent = PetitionEvent & {
  __typename?: "CommentDeletedEvent";
  createdAt: Scalars["DateTime"];
  deletedBy?: Maybe<ContactOrUser>;
  field?: Maybe<PetitionField>;
  id: Scalars["ID"];
};

export type CommentPublishedEvent = PetitionEvent & {
  __typename?: "CommentPublishedEvent";
  comment?: Maybe<PetitionFieldComment>;
  createdAt: Scalars["DateTime"];
  field?: Maybe<PetitionField>;
  id: Scalars["ID"];
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
  id: Scalars["ID"];
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

export type ContactOrUser = Contact | User;

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

export type FileUploadReplyDownloadLinkResult = {
  __typename?: "FileUploadReplyDownloadLinkResult";
  result: Result;
  url?: Maybe<Scalars["String"]>;
};

export type MessageCancelledEvent = PetitionEvent & {
  __typename?: "MessageCancelledEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["ID"];
  message: PetitionMessage;
  user: User;
};

export type MessageScheduledEvent = PetitionEvent & {
  __typename?: "MessageScheduledEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["ID"];
  message: PetitionMessage;
};

export type MessageSentEvent = PetitionEvent & {
  __typename?: "MessageSentEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["ID"];
  message: PetitionMessage;
};

export type Mutation = {
  __typename?: "Mutation";
  /** Cancels a scheduled petition message. */
  cancelScheduledMessage?: Maybe<PetitionMessage>;
  /** Changes the password for the current logged in user. */
  changePassword: ChangePasswordResult;
  /** Clone petition. */
  clonePetition: Petition;
  /** Create a contact. */
  createContact: Contact;
  /** Create petition. */
  createPetition: Petition;
  /** Creates a petition field */
  createPetitionField: PetitionAndField;
  /** Create a petition field comment. */
  createPetitionFieldComment: PetitionFieldComment;
  /** Deactivates the specified active petition accesses. */
  deactivateAccesses: Array<PetitionAccess>;
  /** Delete contacts. */
  deleteContacts: Result;
  /** Delete petitions fields. */
  deletePetitionField: Petition;
  /** Delete a petition field comment. */
  deletePetitionFieldComment: Result;
  /** Delete petitions. */
  deletePetitions: Result;
  /** Generates a download link for a file reply. */
  fileUploadReplyDownloadLink: FileUploadReplyDownloadLinkResult;
  /** Marks the specified comments as read. */
  markPetitionFieldCommentsAsRead: Array<PetitionFieldComment>;
  /** Marks a filled petition as ready for review. */
  publicCompletePetition: PublicPetition;
  /** Creates a reply to a file upload field. */
  publicCreateFileUploadReply: CreateFileUploadReply;
  /** Create a petition field comment. */
  publicCreatePetitionFieldComment: PublicPetitionFieldComment;
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
  /** Sends a petition message to the speicified contacts. */
  sendMessages: Result;
  /** Sends the petition and creates the corresponding accesses and messages. */
  sendPetition: SendPetitionResult;
  /** Sends a reminder for the specified petition accesses. */
  sendReminders: Result;
  /** Submits all unpublished comments. */
  submitUnpublishedComments: Array<PetitionFieldComment>;
  /** Updates a contact. */
  updateContact: Contact;
  /** Updates the positions of the petition fields */
  updateFieldPositions: Petition;
  /** Updates the onboarding status for one of the pages. */
  updateOnboardingStatus: User;
  /** Updates a petition. */
  updatePetition: Petition;
  /** Updates a petition field. */
  updatePetitionField: PetitionAndField;
  /** Update a petition field comment. */
  updatePetitionFieldComment: PetitionFieldComment;
  /** Updates the status of a petition field reply. */
  updatePetitionFieldReplyStatus: PetitionFieldReply;
  /** Updates the user with the provided data. */
  updateUser: User;
  /** Updates the validation of a petition field. */
  validatePetitionFields: PetitionAndFields;
};

export type MutationcancelScheduledMessageArgs = {
  messageId: Scalars["ID"];
  petitionId: Scalars["ID"];
};

export type MutationchangePasswordArgs = {
  newPassword: Scalars["String"];
  password: Scalars["String"];
};

export type MutationclonePetitionArgs = {
  deadline?: Maybe<Scalars["DateTime"]>;
  locale: PetitionLocale;
  name?: Maybe<Scalars["String"]>;
  petitionId: Scalars["ID"];
};

export type MutationcreateContactArgs = {
  data: CreateContactInput;
};

export type MutationcreatePetitionArgs = {
  deadline?: Maybe<Scalars["DateTime"]>;
  locale: PetitionLocale;
  name: Scalars["String"];
};

export type MutationcreatePetitionFieldArgs = {
  petitionId: Scalars["ID"];
  type: PetitionFieldType;
};

export type MutationcreatePetitionFieldCommentArgs = {
  content: Scalars["String"];
  petitionFieldId: Scalars["ID"];
  petitionFieldReplyId?: Maybe<Scalars["ID"]>;
  petitionId: Scalars["ID"];
};

export type MutationdeactivateAccessesArgs = {
  accessIds: Array<Scalars["ID"]>;
  petitionId: Scalars["ID"];
};

export type MutationdeleteContactsArgs = {
  ids: Array<Scalars["ID"]>;
};

export type MutationdeletePetitionFieldArgs = {
  fieldId: Scalars["ID"];
  petitionId: Scalars["ID"];
};

export type MutationdeletePetitionFieldCommentArgs = {
  petitionFieldCommentId: Scalars["ID"];
  petitionFieldId: Scalars["ID"];
  petitionId: Scalars["ID"];
};

export type MutationdeletePetitionsArgs = {
  ids: Array<Scalars["ID"]>;
};

export type MutationfileUploadReplyDownloadLinkArgs = {
  petitionId: Scalars["ID"];
  preview?: Maybe<Scalars["Boolean"]>;
  replyId: Scalars["ID"];
};

export type MutationmarkPetitionFieldCommentsAsReadArgs = {
  petitionFieldCommentIds: Array<Scalars["ID"]>;
  petitionId: Scalars["ID"];
};

export type MutationpublicCompletePetitionArgs = {
  keycode: Scalars["ID"];
};

export type MutationpublicCreateFileUploadReplyArgs = {
  data: CreateFileUploadReplyInput;
  fieldId: Scalars["ID"];
  keycode: Scalars["ID"];
};

export type MutationpublicCreatePetitionFieldCommentArgs = {
  content: Scalars["String"];
  keycode: Scalars["ID"];
  petitionFieldId: Scalars["ID"];
};

export type MutationpublicCreateTextReplyArgs = {
  data: CreateTextReplyInput;
  fieldId: Scalars["ID"];
  keycode: Scalars["ID"];
};

export type MutationpublicDeletePetitionFieldCommentArgs = {
  keycode: Scalars["ID"];
  petitionFieldCommentId: Scalars["ID"];
  petitionFieldId: Scalars["ID"];
};

export type MutationpublicDeletePetitionReplyArgs = {
  keycode: Scalars["ID"];
  replyId: Scalars["ID"];
};

export type MutationpublicFileUploadReplyCompleteArgs = {
  keycode: Scalars["ID"];
  replyId: Scalars["ID"];
};

export type MutationpublicMarkPetitionFieldCommentsAsReadArgs = {
  keycode: Scalars["ID"];
  petitionFieldCommentIds: Array<Scalars["ID"]>;
};

export type MutationpublicSubmitUnpublishedCommentsArgs = {
  keycode: Scalars["ID"];
};

export type MutationpublicUpdatePetitionFieldCommentArgs = {
  content: Scalars["String"];
  keycode: Scalars["ID"];
  petitionFieldCommentId: Scalars["ID"];
  petitionFieldId: Scalars["ID"];
};

export type MutationreactivateAccessesArgs = {
  accessIds: Array<Scalars["ID"]>;
  petitionId: Scalars["ID"];
};

export type MutationsendMessagesArgs = {
  accessIds: Array<Scalars["ID"]>;
  body: Scalars["JSON"];
  petitionId: Scalars["ID"];
  scheduledAt?: Maybe<Scalars["DateTime"]>;
  subject: Scalars["String"];
};

export type MutationsendPetitionArgs = {
  body: Scalars["JSON"];
  contactIds: Array<Scalars["ID"]>;
  petitionId: Scalars["ID"];
  remindersConfig?: Maybe<RemindersConfigInput>;
  scheduledAt?: Maybe<Scalars["DateTime"]>;
  subject: Scalars["String"];
};

export type MutationsendRemindersArgs = {
  accessIds: Array<Scalars["ID"]>;
  petitionId: Scalars["ID"];
};

export type MutationsubmitUnpublishedCommentsArgs = {
  petitionId: Scalars["ID"];
};

export type MutationupdateContactArgs = {
  data: UpdateContactInput;
  id: Scalars["ID"];
};

export type MutationupdateFieldPositionsArgs = {
  fieldIds: Array<Scalars["ID"]>;
  petitionId: Scalars["ID"];
};

export type MutationupdateOnboardingStatusArgs = {
  key: OnboardingKey;
  status: OnboardingStatus;
};

export type MutationupdatePetitionArgs = {
  data: UpdatePetitionInput;
  petitionId: Scalars["ID"];
};

export type MutationupdatePetitionFieldArgs = {
  data: UpdatePetitionFieldInput;
  fieldId: Scalars["ID"];
  petitionId: Scalars["ID"];
};

export type MutationupdatePetitionFieldCommentArgs = {
  content: Scalars["String"];
  petitionFieldCommentId: Scalars["ID"];
  petitionFieldId: Scalars["ID"];
  petitionId: Scalars["ID"];
};

export type MutationupdatePetitionFieldReplyStatusArgs = {
  petitionFieldReplyId: Scalars["ID"];
  petitionId: Scalars["ID"];
  status: PetitionFieldReplyStatus;
};

export type MutationupdateUserArgs = {
  data: UpdateUserInput;
  id: Scalars["ID"];
};

export type MutationvalidatePetitionFieldsArgs = {
  fieldIds: Array<Scalars["ID"]>;
  petitionId: Scalars["ID"];
  value: Scalars["Boolean"];
};

export type OnboardingKey =
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
  id: Scalars["ID"];
  /** The unique text identifier of the organization. */
  identifier: Scalars["String"];
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
export type OrganizationusersArgs = {
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
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

/** An petition in the system. */
export type Petition = Timestamps & {
  __typename?: "Petition";
  /** The accesses for this petition */
  accesses: Array<PetitionAccess>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The custom ref of the petition. */
  customRef?: Maybe<Scalars["String"]>;
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
  /** The field definition of the petition. */
  fields: Array<PetitionField>;
  /** The ID of the petition. */
  id: Scalars["ID"];
  /** The locale of the petition. */
  locale: PetitionLocale;
  /** The name of the petition. */
  name?: Maybe<Scalars["String"]>;
  /** The progress of the petition. */
  progress: PetitionProgress;
  /** The recipients for this petition */
  recipients: Array<Maybe<Contact>>;
  /** The reminders configuration for the petition. */
  remindersConfig?: Maybe<RemindersConfig>;
  /** The status of the petition. */
  status: PetitionStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
};

/** An petition in the system. */
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
  id: Scalars["ID"];
  /** When the next reminder will be sent. */
  nextReminderAt?: Maybe<Scalars["DateTime"]>;
  /** The petition for this message access. */
  petition?: Maybe<Petition>;
  /** Number of reminders sent. */
  reminderCount: Scalars["Int"];
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

export type PetitionAndField = {
  __typename?: "PetitionAndField";
  field: PetitionField;
  petition: Petition;
};

export type PetitionAndFields = {
  __typename?: "PetitionAndFields";
  fields: Array<PetitionField>;
  petition: Petition;
};

export type PetitionCompletedEvent = PetitionEvent & {
  __typename?: "PetitionCompletedEvent";
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["ID"];
};

export type PetitionCreatedEvent = PetitionEvent & {
  __typename?: "PetitionCreatedEvent";
  createdAt: Scalars["DateTime"];
  id: Scalars["ID"];
  user: User;
};

export type PetitionEvent = {
  createdAt: Scalars["DateTime"];
  id: Scalars["ID"];
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
  id: Scalars["ID"];
  /** Determines if this field allows multiple replies. */
  multiple: Scalars["Boolean"];
  /** Determines if this field is optional. */
  optional: Scalars["Boolean"];
  /** The options of the petition. */
  options?: Maybe<Scalars["JSONObject"]>;
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
  author?: Maybe<ContactOrUser>;
  /** The content of the comment. */
  content: Scalars["String"];
  /** The ID of the petition field comment. */
  id: Scalars["ID"];
  /** Whether the comment has been edited after being published. */
  isEdited: Scalars["Boolean"];
  /** Wether the comment has been read or not. */
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
  id: Scalars["ID"];
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
  id: Scalars["ID"];
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

export type PetitionPagination = {
  __typename?: "PetitionPagination";
  /** The requested slice of items. */
  items: Array<Petition>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
};

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
  id: Scalars["ID"];
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

/** The status of a petition. */
export type PetitionStatus =
  /** The petition has been completed. */
  | "COMPLETED"
  /** The petition has not been sent yet. */
  | "DRAFT"
  /** The petition has been sent and is awaiting completion. */
  | "PENDING";

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
  id: Scalars["ID"];
  /** The last name of the user. */
  lastName?: Maybe<Scalars["String"]>;
};

export type PublicContactOrUser = PublicContact | PublicUser;

/** A public view of an organization */
export type PublicOrganization = {
  __typename?: "PublicOrganization";
  /** The ID of the organization. */
  id: Scalars["ID"];
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
  id: Scalars["ID"];
  /** The locale of the petition. */
  locale: PetitionLocale;
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
  id: Scalars["ID"];
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
  author?: Maybe<PublicContactOrUser>;
  /** The content of the comment. */
  content: Scalars["String"];
  /** The ID of the petition field comment. */
  id: Scalars["ID"];
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
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The ID of the petition field reply. */
  id: Scalars["ID"];
  /** The public content of the reply */
  publicContent: Scalars["JSONObject"];
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
  id: Scalars["ID"];
  /** The last name of the user. */
  lastName?: Maybe<Scalars["String"]>;
  /** The organization of the user. */
  organization: PublicOrganization;
};

export type Query = {
  __typename?: "Query";
  access?: Maybe<PublicPetitionAccess>;
  contact?: Maybe<Contact>;
  /** The contacts of the user */
  contacts: ContactPagination;
  me: User;
  organization?: Maybe<Organization>;
  petition?: Maybe<Petition>;
  /** The petitions of the user */
  petitions: PetitionPagination;
};

export type QueryaccessArgs = {
  keycode: Scalars["ID"];
};

export type QuerycontactArgs = {
  id: Scalars["ID"];
};

export type QuerycontactsArgs = {
  exclude?: Maybe<Array<Scalars["ID"]>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  search?: Maybe<Scalars["String"]>;
  sortBy?: Maybe<Array<QueryContacts_OrderBy>>;
};

export type QueryorganizationArgs = {
  id: Scalars["ID"];
};

export type QuerypetitionArgs = {
  id: Scalars["ID"];
};

export type QuerypetitionsArgs = {
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  search?: Maybe<Scalars["String"]>;
  sortBy?: Maybe<Array<QueryPetitions_OrderBy>>;
  status?: Maybe<PetitionStatus>;
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
  id: Scalars["ID"];
  reminder: PetitionReminder;
};

export type ReplyCreatedEvent = PetitionEvent & {
  __typename?: "ReplyCreatedEvent";
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  field?: Maybe<PetitionField>;
  id: Scalars["ID"];
  reply?: Maybe<PetitionFieldReply>;
};

export type ReplyDeletedEvent = PetitionEvent & {
  __typename?: "ReplyDeletedEvent";
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  field?: Maybe<PetitionField>;
  id: Scalars["ID"];
};

/** Represents the result of an operation. */
export type Result = "FAILURE" | "SUCCESS";

export type SendPetitionResult = {
  __typename?: "SendPetitionResult";
  accesses?: Maybe<Array<PetitionAccess>>;
  petition?: Maybe<Petition>;
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
  emailBody?: Maybe<Scalars["JSON"]>;
  emailSubject?: Maybe<Scalars["String"]>;
  locale?: Maybe<PetitionLocale>;
  name?: Maybe<Scalars["String"]>;
  remindersConfig?: Maybe<RemindersConfigInput>;
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
  /** The ID of the user. */
  id: Scalars["ID"];
  /** The last name of the user. */
  lastName?: Maybe<Scalars["String"]>;
  /** The onboarding status for the different views of the app. */
  onboardingStatus: Scalars["JSONObject"];
  organization: Organization;
  organizationRole: OrganizationRole;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
};

export type UserPagination = {
  __typename?: "UserPagination";
  /** The requested slice of items. */
  items: Array<User>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
};

export type ContactLink_ContactFragment = { __typename?: "Contact" } & Pick<
  Contact,
  "id" | "fullName" | "email"
>;

export type OnboardingTour_UserFragment = { __typename?: "User" } & Pick<
  User,
  "onboardingStatus"
>;

export type RecipientSelect_ContactFragment = { __typename?: "Contact" } & Pick<
  Contact,
  "id" | "fullName" | "email"
>;

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

export type PetitionHeader_PetitionFragment = {
  __typename?: "Petition";
} & Pick<Petition, "id" | "name" | "status" | "updatedAt"> &
  PetitionSettingsModal_PetitionFragment;

export type PetitionLayout_PetitionFragment = {
  __typename?: "Petition";
} & Pick<Petition, "id"> &
  PetitionHeader_PetitionFragment;

export type PetitionLayout_UserFragment = {
  __typename?: "User";
} & AppLayout_UserFragment;

export type UserMenu_UserFragment = { __typename?: "User" } & Pick<
  User,
  "fullName"
>;

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

export type PetitionAccessTable_PetitionAccessFragment = {
  __typename?: "PetitionAccess";
} & Pick<
  PetitionAccess,
  | "id"
  | "status"
  | "nextReminderAt"
  | "remindersLeft"
  | "reminderCount"
  | "createdAt"
> & {
    contact?: Maybe<{ __typename?: "Contact" } & ContactLink_ContactFragment>;
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
          __typename?: "PetitionCompletedEvent";
        } & PetitionActivityTimeline_PetitionEvent_PetitionCompletedEvent_Fragment)
      | ({
          __typename?: "PetitionCreatedEvent";
        } & PetitionActivityTimeline_PetitionEvent_PetitionCreatedEvent_Fragment)
      | ({
          __typename?: "ReminderSentEvent";
        } & PetitionActivityTimeline_PetitionEvent_ReminderSentEvent_Fragment)
      | ({
          __typename?: "ReplyCreatedEvent";
        } & PetitionActivityTimeline_PetitionEvent_ReplyCreatedEvent_Fragment)
      | ({
          __typename?: "ReplyDeletedEvent";
        } & PetitionActivityTimeline_PetitionEvent_ReplyDeletedEvent_Fragment)
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

export type PetitionActivityTimeline_PetitionEvent_PetitionCompletedEvent_Fragment = {
  __typename?: "PetitionCompletedEvent";
} & Pick<PetitionCompletedEvent, "id"> &
  TimelinePetitionCompletedEvent_PetitionCompletedEventFragment;

export type PetitionActivityTimeline_PetitionEvent_PetitionCreatedEvent_Fragment = {
  __typename?: "PetitionCreatedEvent";
} & Pick<PetitionCreatedEvent, "id"> &
  TimelinePetitionCreatedEvent_PetitionCreatedEventFragment;

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

export type PetitionActivityTimeline_PetitionEventFragment =
  | PetitionActivityTimeline_PetitionEvent_AccessActivatedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_AccessDeactivatedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_AccessOpenedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_CommentDeletedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_CommentPublishedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_MessageCancelledEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_MessageScheduledEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_MessageSentEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_PetitionCompletedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_PetitionCreatedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_ReminderSentEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_ReplyCreatedEvent_Fragment
  | PetitionActivityTimeline_PetitionEvent_ReplyDeletedEvent_Fragment;

export type PetitionFieldReference_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<PetitionField, "title">;

export type TimelineAccessActivatedEvent_AccessActivatedEventFragment = {
  __typename?: "AccessActivatedEvent";
} & Pick<AccessActivatedEvent, "createdAt"> & {
    user: { __typename?: "User" } & Pick<User, "id" | "fullName">;
    access: { __typename?: "PetitionAccess" } & {
      contact?: Maybe<{ __typename?: "Contact" } & ContactLink_ContactFragment>;
    };
  };

export type TimelineAccessDeactivatedEvent_AccessDeactivatedEventFragment = {
  __typename?: "AccessDeactivatedEvent";
} & Pick<AccessDeactivatedEvent, "createdAt"> & {
    user: { __typename?: "User" } & Pick<User, "id" | "fullName">;
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
      | ({ __typename?: "Contact" } & ContactLink_ContactFragment)
      | ({ __typename?: "User" } & Pick<User, "id" | "fullName">)
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
            | ({ __typename?: "Contact" } & ContactLink_ContactFragment)
            | ({ __typename?: "User" } & Pick<User, "id" | "fullName">)
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
    user: { __typename?: "User" } & Pick<User, "id" | "fullName">;
  };

export type TimelineMessageScheduledEvent_MessageScheduledEventFragment = {
  __typename?: "MessageScheduledEvent";
} & Pick<MessageScheduledEvent, "createdAt"> & {
    message: { __typename?: "PetitionMessage" } & Pick<
      PetitionMessage,
      "status" | "scheduledAt" | "emailSubject"
    > & {
        sender: { __typename?: "User" } & Pick<User, "id" | "fullName">;
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
      "emailSubject" | "scheduledAt"
    > & {
        sender: { __typename?: "User" } & Pick<User, "id" | "fullName">;
        access: { __typename?: "PetitionAccess" } & {
          contact?: Maybe<
            { __typename?: "Contact" } & ContactLink_ContactFragment
          >;
        };
      } & MessageEventsIndicator_PetitionMessageFragment;
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
    user: { __typename?: "User" } & Pick<User, "id" | "fullName">;
  };

export type TimelineReminderSentEvent_ReminderSentEventFragment = {
  __typename?: "ReminderSentEvent";
} & Pick<ReminderSentEvent, "createdAt"> & {
    reminder: { __typename?: "PetitionReminder" } & Pick<
      PetitionReminder,
      "type"
    > & {
        sender?: Maybe<{ __typename?: "User" } & Pick<User, "id" | "fullName">>;
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

export type PetitionSettingsModal_PetitionFragment = {
  __typename?: "Petition";
} & Pick<Petition, "id" | "status" | "locale" | "deadline">;

export type PetitionComposeField_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<
  PetitionField,
  "id" | "type" | "title" | "description" | "optional" | "multiple"
>;

export type PetitionComposeFieldList_PetitionFragment = {
  __typename?: "Petition";
} & {
  fields: Array<
    {
      __typename?: "PetitionField";
    } & PetitionComposeField_PetitionFieldFragment
  >;
};

export type PetitionComposeFieldSettings_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<PetitionField, "id" | "type" | "optional" | "multiple" | "options">;

export type PetitionComposeMessageEditor_ContactFragment = {
  __typename?: "Contact";
} & Pick<Contact, "id" | "fullName" | "email">;

export type PetitionComposeMessageEditor_PetitionFragment = {
  __typename?: "Petition";
} & Pick<Petition, "emailSubject" | "emailBody"> & {
    remindersConfig?: Maybe<
      { __typename?: "RemindersConfig" } & Pick<
        RemindersConfig,
        "offset" | "time" | "timezone" | "weekdaysOnly"
      >
    >;
  };

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
} & Pick<
  PetitionFieldComment,
  "id" | "content" | "publishedAt" | "isUnread" | "isEdited"
> & {
    author?: Maybe<
      | ({ __typename?: "Contact" } & ContactLink_ContactFragment)
      | ({ __typename?: "User" } & Pick<User, "id" | "fullName">)
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
      { __typename?: "PublicPetitionFieldReply" } & Pick<
        PublicPetitionFieldReply,
        "id" | "publicContent" | "createdAt"
      >
    >;
    comments: Array<
      { __typename?: "PublicPetitionFieldComment" } & Pick<
        PublicPetitionFieldComment,
        "id" | "isUnread" | "publishedAt"
      >
    >;
  };

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

export type RecipientViewProgressCard_PublicUserFragment = {
  __typename?: "PublicUser";
} & Pick<PublicUser, "firstName">;

export type RecipientViewProgressCard_PublicPetitionFragment = {
  __typename?: "PublicPetition";
} & Pick<PublicPetition, "status"> & {
    fields: Array<
      { __typename?: "PublicPetitionField" } & Pick<
        PublicPetitionField,
        "id" | "optional"
      > & {
          replies: Array<
            { __typename?: "PublicPetitionFieldReply" } & Pick<
              PublicPetitionFieldReply,
              "id"
            >
          >;
        }
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

export type Contact_ContactFragment = { __typename?: "Contact" } & Pick<
  Contact,
  "id" | "email" | "fullName" | "firstName" | "lastName"
> & {
    accesses: { __typename?: "PetitionAccessPagination" } & {
      items: Array<
        { __typename?: "PetitionAccess" } & Contact_PetitionAccessFragment
      >;
    };
  };

export type Contact_PetitionAccessFragment = {
  __typename?: "PetitionAccess";
} & Pick<PetitionAccess, "id"> & {
    petition?: Maybe<
      { __typename?: "Petition" } & Pick<
        Petition,
        "id" | "name" | "status" | "deadline"
      > & {
          progress: { __typename?: "PetitionProgress" } & Pick<
            PetitionProgress,
            "validated" | "replied" | "optional" | "total"
          >;
        }
    >;
  };

export type Contact_UserFragment = {
  __typename?: "User";
} & AppLayout_UserFragment;

export type Contact_updateContactMutationVariables = Exact<{
  id: Scalars["ID"];
  data: UpdateContactInput;
}>;

export type Contact_updateContactMutation = { __typename?: "Mutation" } & {
  updateContact: { __typename?: "Contact" } & Contact_ContactFragment;
};

export type ContactQueryVariables = Exact<{
  id: Scalars["ID"];
}>;

export type ContactQuery = { __typename?: "Query" } & {
  contact?: Maybe<{ __typename?: "Contact" } & Contact_ContactFragment>;
};

export type ContactUserQueryVariables = Exact<{ [key: string]: never }>;

export type ContactUserQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & Contact_UserFragment;
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
  ids: Array<Scalars["ID"]>;
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
  PetitionLayout_PetitionFragment &
  PetitionAccessTable_PetitionFragment &
  PetitionActivityTimeline_PetitionFragment;

export type PetitionActivity_UserFragment = {
  __typename?: "User";
} & PetitionLayout_UserFragment;

export type PetitionActivity_updatePetitionMutationVariables = Exact<{
  petitionId: Scalars["ID"];
  data: UpdatePetitionInput;
}>;

export type PetitionActivity_updatePetitionMutation = {
  __typename?: "Mutation";
} & {
  updatePetition: {
    __typename?: "Petition";
  } & PetitionActivity_PetitionFragment;
};

export type PetitionActivity_sendMessagesMutationVariables = Exact<{
  petitionId: Scalars["ID"];
  accessIds: Array<Scalars["ID"]>;
  subject: Scalars["String"];
  body: Scalars["JSON"];
  scheduledAt?: Maybe<Scalars["DateTime"]>;
}>;

export type PetitionActivity_sendMessagesMutation = {
  __typename?: "Mutation";
} & Pick<Mutation, "sendMessages">;

export type PetitionActivity_sendRemindersMutationVariables = Exact<{
  petitionId: Scalars["ID"];
  accessIds: Array<Scalars["ID"]>;
}>;

export type PetitionActivity_sendRemindersMutation = {
  __typename?: "Mutation";
} & Pick<Mutation, "sendReminders">;

export type PetitionActivity_deactivateAccessesMutationVariables = Exact<{
  petitionId: Scalars["ID"];
  accessIds: Array<Scalars["ID"]>;
}>;

export type PetitionActivity_deactivateAccessesMutation = {
  __typename?: "Mutation";
} & {
  deactivateAccesses: Array<
    { __typename?: "PetitionAccess" } & Pick<PetitionAccess, "id" | "status">
  >;
};

export type PetitionActivity_reactivateAccessesMutationVariables = Exact<{
  petitionId: Scalars["ID"];
  accessIds: Array<Scalars["ID"]>;
}>;

export type PetitionActivity_reactivateAccessesMutation = {
  __typename?: "Mutation";
} & {
  reactivateAccesses: Array<
    { __typename?: "PetitionAccess" } & Pick<PetitionAccess, "id" | "status">
  >;
};

export type PetitionActivity_cancelScheduledMessageMutationVariables = Exact<{
  petitionId: Scalars["ID"];
  messageId: Scalars["ID"];
}>;

export type PetitionActivity_cancelScheduledMessageMutation = {
  __typename?: "Mutation";
} & {
  cancelScheduledMessage?: Maybe<
    { __typename?: "PetitionMessage" } & Pick<PetitionMessage, "id" | "status">
  >;
};

export type PetitionsActivity_sendPetitionMutationVariables = Exact<{
  petitionId: Scalars["ID"];
  contactIds: Array<Scalars["ID"]>;
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

export type PetitionActivityQueryVariables = Exact<{
  id: Scalars["ID"];
}>;

export type PetitionActivityQuery = { __typename?: "Query" } & {
  petition?: Maybe<
    { __typename?: "Petition" } & PetitionActivity_PetitionFragment
  >;
};

export type PetitionActivityUserQueryVariables = Exact<{
  [key: string]: never;
}>;

export type PetitionActivityUserQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & PetitionActivity_UserFragment;
};

export type PetitionCompose_PetitionFragment = {
  __typename?: "Petition";
} & Pick<Petition, "id"> & {
    fields: Array<
      { __typename?: "PetitionField" } & PetitionCompose_PetitionFieldFragment
    >;
  } & PetitionLayout_PetitionFragment &
  PetitionComposeMessageEditor_PetitionFragment;

export type PetitionCompose_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & PetitionComposeField_PetitionFieldFragment &
  PetitionComposeFieldSettings_PetitionFieldFragment;

export type PetitionCompose_UserFragment = {
  __typename?: "User";
} & PetitionLayout_UserFragment;

export type PetitionCompose_updatePetitionMutationVariables = Exact<{
  petitionId: Scalars["ID"];
  data: UpdatePetitionInput;
}>;

export type PetitionCompose_updatePetitionMutation = {
  __typename?: "Mutation";
} & {
  updatePetition: {
    __typename?: "Petition";
  } & PetitionLayout_PetitionFragment &
    PetitionComposeMessageEditor_PetitionFragment;
};

export type PetitionCompose_updateFieldPositionsMutationVariables = Exact<{
  petitionId: Scalars["ID"];
  fieldIds: Array<Scalars["ID"]>;
}>;

export type PetitionCompose_updateFieldPositionsMutation = {
  __typename?: "Mutation";
} & {
  updateFieldPositions: { __typename?: "Petition" } & Pick<Petition, "id"> &
    PetitionLayout_PetitionFragment;
};

export type PetitionCompose_createPetitionFieldMutationVariables = Exact<{
  petitionId: Scalars["ID"];
  type: PetitionFieldType;
}>;

export type PetitionCompose_createPetitionFieldMutation = {
  __typename?: "Mutation";
} & {
  createPetitionField: { __typename?: "PetitionAndField" } & {
    field: { __typename?: "PetitionField" } & Pick<PetitionField, "id"> &
      PetitionComposeField_PetitionFieldFragment &
      PetitionComposeFieldSettings_PetitionFieldFragment;
    petition: { __typename?: "Petition" } & PetitionLayout_PetitionFragment;
  };
};

export type PetitionCompose_deletePetitionFieldMutationVariables = Exact<{
  petitionId: Scalars["ID"];
  fieldId: Scalars["ID"];
}>;

export type PetitionCompose_deletePetitionFieldMutation = {
  __typename?: "Mutation";
} & {
  deletePetitionField: { __typename?: "Petition" } & Pick<Petition, "id"> &
    PetitionLayout_PetitionFragment;
};

export type PetitionCompose_updatePetitionFieldMutationVariables = Exact<{
  petitionId: Scalars["ID"];
  fieldId: Scalars["ID"];
  data: UpdatePetitionFieldInput;
}>;

export type PetitionCompose_updatePetitionFieldMutation = {
  __typename?: "Mutation";
} & {
  updatePetitionField: { __typename?: "PetitionAndField" } & {
    field: { __typename?: "PetitionField" } & Pick<PetitionField, "id"> &
      PetitionComposeField_PetitionFieldFragment &
      PetitionComposeFieldSettings_PetitionFieldFragment;
    petition: { __typename?: "Petition" } & Pick<Petition, "id" | "updatedAt">;
  };
};

export type PetitionCompose_sendPetitionMutationVariables = Exact<{
  petitionId: Scalars["ID"];
  contactIds: Array<Scalars["ID"]>;
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

export type PetitionCompose_updateFieldPositions_PetitionFragment = {
  __typename?: "Petition";
} & {
  fields: Array<{ __typename?: "PetitionField" } & Pick<PetitionField, "id">>;
};

export type PetitionCompose_createPetitionField_PetitionFragment = {
  __typename?: "Petition";
} & {
  fields: Array<{ __typename?: "PetitionField" } & Pick<PetitionField, "id">>;
};

export type PetitionCompose_deletePetitionField_PetitionFragment = {
  __typename?: "Petition";
} & {
  fields: Array<{ __typename?: "PetitionField" } & Pick<PetitionField, "id">>;
};

export type PetitionComposeQueryVariables = Exact<{
  id: Scalars["ID"];
}>;

export type PetitionComposeQuery = { __typename?: "Query" } & {
  petition?: Maybe<
    { __typename?: "Petition" } & PetitionCompose_PetitionFragment
  >;
};

export type PetitionComposeUserQueryVariables = Exact<{ [key: string]: never }>;

export type PetitionComposeUserQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & PetitionCompose_UserFragment;
};

export type PetitionReplies_PetitionFragment = {
  __typename?: "Petition";
} & Pick<Petition, "id"> & {
    fields: Array<
      {
        __typename?: "PetitionField";
      } & PetitionRepliesField_PetitionFieldFragment &
        PetitionRepliesFieldComments_PetitionFieldFragment &
        DownloadAllDialog_PetitionFieldFragment
    >;
  } & PetitionLayout_PetitionFragment;

export type PetitionReplies_UserFragment = {
  __typename?: "User";
} & PetitionLayout_UserFragment;

export type PetitionReplies_updatePetitionMutationVariables = Exact<{
  petitionId: Scalars["ID"];
  data: UpdatePetitionInput;
}>;

export type PetitionReplies_updatePetitionMutation = {
  __typename?: "Mutation";
} & {
  updatePetition: {
    __typename?: "Petition";
  } & PetitionReplies_PetitionFragment;
};

export type PetitionReplies_validatePetitionFieldsMutationVariables = Exact<{
  petitionId: Scalars["ID"];
  fieldIds: Array<Scalars["ID"]>;
  value: Scalars["Boolean"];
}>;

export type PetitionReplies_validatePetitionFieldsMutation = {
  __typename?: "Mutation";
} & {
  validatePetitionFields: { __typename?: "PetitionAndFields" } & {
    fields: Array<
      { __typename?: "PetitionField" } & Pick<PetitionField, "id" | "validated">
    >;
    petition: { __typename?: "Petition" } & PetitionLayout_PetitionFragment;
  };
};

export type PetitionReplies_fileUploadReplyDownloadLinkMutationVariables = Exact<{
  petitionId: Scalars["ID"];
  replyId: Scalars["ID"];
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
  petitionId: Scalars["ID"];
  petitionFieldId: Scalars["ID"];
  petitionFieldReplyId?: Maybe<Scalars["ID"]>;
  content: Scalars["String"];
}>;

export type PetitionReplies_createPetitionFieldCommentMutation = {
  __typename?: "Mutation";
} & {
  createPetitionFieldComment: {
    __typename?: "PetitionFieldComment";
  } & PetitionRepliesFieldComments_PetitionFieldCommentFragment;
};

export type PetitionReplies_updatePetitionFieldCommentMutationVariables = Exact<{
  petitionId: Scalars["ID"];
  petitionFieldId: Scalars["ID"];
  petitionFieldCommentId: Scalars["ID"];
  content: Scalars["String"];
}>;

export type PetitionReplies_updatePetitionFieldCommentMutation = {
  __typename?: "Mutation";
} & {
  updatePetitionFieldComment: {
    __typename?: "PetitionFieldComment";
  } & PetitionRepliesFieldComments_PetitionFieldCommentFragment;
};

export type PetitionReplies_deletePetitionFieldCommentMutationVariables = Exact<{
  petitionId: Scalars["ID"];
  petitionFieldId: Scalars["ID"];
  petitionFieldCommentId: Scalars["ID"];
}>;

export type PetitionReplies_deletePetitionFieldCommentMutation = {
  __typename?: "Mutation";
} & Pick<Mutation, "deletePetitionFieldComment">;

export type PetitionReplies_submitUnpublishedCommentsMutationVariables = Exact<{
  petitionId: Scalars["ID"];
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
  petitionId: Scalars["ID"];
  petitionFieldCommentIds: Array<Scalars["ID"]>;
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

export type PetitionReplies_updatePetitionFieldReplyStatusMutationVariables = Exact<{
  petitionId: Scalars["ID"];
  petitionFieldReplyId: Scalars["ID"];
  status: PetitionFieldReplyStatus;
}>;

export type PetitionReplies_updatePetitionFieldReplyStatusMutation = {
  __typename?: "Mutation";
} & {
  updatePetitionFieldReplyStatus: { __typename?: "PetitionFieldReply" } & Pick<
    PetitionFieldReply,
    "id" | "status"
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

export type PetitionRepliesQueryVariables = Exact<{
  id: Scalars["ID"];
}>;

export type PetitionRepliesQuery = { __typename?: "Query" } & {
  petition?: Maybe<
    { __typename?: "Petition" } & PetitionReplies_PetitionFragment
  >;
};

export type PetitionRepliesUserQueryVariables = Exact<{ [key: string]: never }>;

export type PetitionRepliesUserQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & PetitionReplies_UserFragment;
};

export type Petitions_PetitionsListFragment = {
  __typename?: "PetitionPagination";
} & Pick<PetitionPagination, "totalCount"> & {
    items: Array<
      { __typename?: "Petition" } & Pick<
        Petition,
        | "id"
        | "locale"
        | "customRef"
        | "name"
        | "status"
        | "deadline"
        | "createdAt"
      > & {
          progress: { __typename?: "PetitionProgress" } & Pick<
            PetitionProgress,
            "validated" | "replied" | "optional" | "total"
          >;
          recipients: Array<
            Maybe<{ __typename?: "Contact" } & ContactLink_ContactFragment>
          >;
        }
    >;
  };

export type Petitions_UserFragment = {
  __typename?: "User";
} & AppLayout_UserFragment;

export type Petitions_deletePetitionsMutationVariables = Exact<{
  ids: Array<Scalars["ID"]>;
}>;

export type Petitions_deletePetitionsMutation = {
  __typename?: "Mutation";
} & Pick<Mutation, "deletePetitions">;

export type Petitions_clonePetitionMutationVariables = Exact<{
  petitionId: Scalars["ID"];
  name?: Maybe<Scalars["String"]>;
  locale: PetitionLocale;
  deadline?: Maybe<Scalars["DateTime"]>;
}>;

export type Petitions_clonePetitionMutation = { __typename?: "Mutation" } & {
  clonePetition: { __typename?: "Petition" } & Pick<Petition, "id">;
};

export type PetitionsQueryVariables = Exact<{
  offset: Scalars["Int"];
  limit: Scalars["Int"];
  search?: Maybe<Scalars["String"]>;
  sortBy?: Maybe<Array<QueryPetitions_OrderBy>>;
  status?: Maybe<PetitionStatus>;
}>;

export type PetitionsQuery = { __typename?: "Query" } & {
  petitions: {
    __typename?: "PetitionPagination";
  } & Petitions_PetitionsListFragment;
};

export type PetitionsUserQueryVariables = Exact<{ [key: string]: never }>;

export type PetitionsUserQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & Petitions_UserFragment;
};

export type Account_UserFragment = { __typename?: "User" } & Pick<
  User,
  "firstName" | "lastName"
> &
  AppLayout_UserFragment;

export type Account_updateAccountMutationVariables = Exact<{
  id: Scalars["ID"];
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
  "fullName" | "email"
>;

export type RecipientView_PublicPetitionFragment = {
  __typename?: "PublicPetition";
} & Pick<PublicPetition, "id" | "status" | "deadline"> & {
    fields: Array<
      { __typename?: "PublicPetitionField" } & Pick<PublicPetitionField, "id"> &
        RecipientViewPetitionField_PublicPetitionFieldFragment &
        RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldFragment
    >;
  };

export type RecipientView_PublicUserFragment = {
  __typename?: "PublicUser";
} & RecipientViewSenderCard_PublicUserFragment &
  RecipientViewProgressCard_PublicUserFragment;

export type RecipientView_publicDeletePetitionReplyMutationVariables = Exact<{
  replyId: Scalars["ID"];
  keycode: Scalars["ID"];
}>;

export type RecipientView_publicDeletePetitionReplyMutation = {
  __typename?: "Mutation";
} & Pick<Mutation, "publicDeletePetitionReply">;

export type RecipientView_publicCreateTextReplyMutationVariables = Exact<{
  keycode: Scalars["ID"];
  fieldId: Scalars["ID"];
  data: CreateTextReplyInput;
}>;

export type RecipientView_publicCreateTextReplyMutation = {
  __typename?: "Mutation";
} & {
  publicCreateTextReply: { __typename?: "PublicPetitionFieldReply" } & Pick<
    PublicPetitionFieldReply,
    "id" | "publicContent" | "createdAt"
  >;
};

export type RecipientView_publicCreateFileUploadReplyMutationVariables = Exact<{
  keycode: Scalars["ID"];
  fieldId: Scalars["ID"];
  data: CreateFileUploadReplyInput;
}>;

export type RecipientView_publicCreateFileUploadReplyMutation = {
  __typename?: "Mutation";
} & {
  publicCreateFileUploadReply: { __typename?: "CreateFileUploadReply" } & Pick<
    CreateFileUploadReply,
    "endpoint"
  > & {
      reply: { __typename?: "PublicPetitionFieldReply" } & Pick<
        PublicPetitionFieldReply,
        "id" | "publicContent" | "createdAt"
      >;
    };
};

export type RecipientView_publicFileUploadReplyCompleteMutationVariables = Exact<{
  keycode: Scalars["ID"];
  replyId: Scalars["ID"];
}>;

export type RecipientView_publicFileUploadReplyCompleteMutation = {
  __typename?: "Mutation";
} & {
  publicFileUploadReplyComplete: {
    __typename?: "PublicPetitionFieldReply";
  } & Pick<PublicPetitionFieldReply, "id" | "publicContent">;
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
  petitionFieldId: Scalars["ID"];
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
  petitionFieldId: Scalars["ID"];
  petitionFieldCommentId: Scalars["ID"];
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
  petitionFieldId: Scalars["ID"];
  petitionFieldCommentId: Scalars["ID"];
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
  petitionFieldCommentIds: Array<Scalars["ID"]>;
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
  name: Scalars["String"];
  locale: PetitionLocale;
  deadline?: Maybe<Scalars["DateTime"]>;
}>;

export type useCreatePetition_createPetitionMutation = {
  __typename?: "Mutation";
} & { createPetition: { __typename?: "Petition" } & Pick<Petition, "id"> };

export type PetitionComposeSearchContactsQueryVariables = Exact<{
  search?: Maybe<Scalars["String"]>;
  exclude?: Maybe<Array<Scalars["ID"]>>;
}>;

export type PetitionComposeSearchContactsQuery = { __typename?: "Query" } & {
  contacts: { __typename?: "ContactPagination" } & {
    items: Array<{ __typename?: "Contact" } & RecipientSelect_ContactFragment>;
  };
};

export const RecipientSelect_ContactFragmentDoc = gql`
  fragment RecipientSelect_Contact on Contact {
    id
    fullName
    email
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
  }
`;
export const PetitionComposeFieldList_PetitionFragmentDoc = gql`
  fragment PetitionComposeFieldList_Petition on Petition {
    fields {
      ...PetitionComposeField_PetitionField
    }
  }
  ${PetitionComposeField_PetitionFieldFragmentDoc}
`;
export const PetitionComposeMessageEditor_ContactFragmentDoc = gql`
  fragment PetitionComposeMessageEditor_Contact on Contact {
    id
    fullName
    email
  }
`;
export const RecipientViewProgressCard_PublicPetitionFragmentDoc = gql`
  fragment RecipientViewProgressCard_PublicPetition on PublicPetition {
    status
    fields {
      id
      optional
      replies {
        id
      }
    }
  }
`;
export const Contact_PetitionAccessFragmentDoc = gql`
  fragment Contact_PetitionAccess on PetitionAccess {
    id
    petition {
      id
      name
      status
      deadline
      progress {
        validated
        replied
        optional
        total
      }
    }
  }
`;
export const Contact_ContactFragmentDoc = gql`
  fragment Contact_Contact on Contact {
    id
    email
    fullName
    firstName
    lastName
    accesses(limit: 100) {
      items {
        ...Contact_PetitionAccess
      }
    }
  }
  ${Contact_PetitionAccessFragmentDoc}
`;
export const UserMenu_UserFragmentDoc = gql`
  fragment UserMenu_User on User {
    fullName
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
export const Contact_UserFragmentDoc = gql`
  fragment Contact_User on User {
    ...AppLayout_User
  }
  ${AppLayout_UserFragmentDoc}
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
export const PetitionSettingsModal_PetitionFragmentDoc = gql`
  fragment PetitionSettingsModal_Petition on Petition {
    id
    status
    locale
    deadline
  }
`;
export const PetitionHeader_PetitionFragmentDoc = gql`
  fragment PetitionHeader_Petition on Petition {
    id
    name
    status
    updatedAt
    ...PetitionSettingsModal_Petition
  }
  ${PetitionSettingsModal_PetitionFragmentDoc}
`;
export const PetitionLayout_PetitionFragmentDoc = gql`
  fragment PetitionLayout_Petition on Petition {
    id
    ...PetitionHeader_Petition
  }
  ${PetitionHeader_PetitionFragmentDoc}
`;
export const ContactLink_ContactFragmentDoc = gql`
  fragment ContactLink_Contact on Contact {
    id
    fullName
    email
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
    createdAt
  }
  ${ContactLink_ContactFragmentDoc}
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
export const TimelinePetitionCreatedEvent_PetitionCreatedEventFragmentDoc = gql`
  fragment TimelinePetitionCreatedEvent_PetitionCreatedEvent on PetitionCreatedEvent {
    user {
      id
      fullName
    }
    createdAt
  }
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
      id
      fullName
    }
    access {
      contact {
        ...ContactLink_Contact
      }
    }
    createdAt
  }
  ${ContactLink_ContactFragmentDoc}
`;
export const TimelineAccessDeactivatedEvent_AccessDeactivatedEventFragmentDoc = gql`
  fragment TimelineAccessDeactivatedEvent_AccessDeactivatedEvent on AccessDeactivatedEvent {
    user {
      id
      fullName
    }
    access {
      contact {
        ...ContactLink_Contact
      }
    }
    createdAt
  }
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
        id
        fullName
      }
      status
      scheduledAt
      emailSubject
      access {
        contact {
          ...ContactLink_Contact
        }
      }
    }
    createdAt
  }
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
      id
      fullName
    }
    createdAt
  }
  ${ContactLink_ContactFragmentDoc}
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
        id
        fullName
      }
      emailSubject
      scheduledAt
      access {
        contact {
          ...ContactLink_Contact
        }
      }
      ...MessageEventsIndicator_PetitionMessage
    }
    createdAt
  }
  ${ContactLink_ContactFragmentDoc}
  ${MessageEventsIndicator_PetitionMessageFragmentDoc}
`;
export const TimelineReminderSentEvent_ReminderSentEventFragmentDoc = gql`
  fragment TimelineReminderSentEvent_ReminderSentEvent on ReminderSentEvent {
    reminder {
      type
      sender {
        id
        fullName
      }
      access {
        contact {
          ...ContactLink_Contact
        }
      }
    }
    createdAt
  }
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
          id
          fullName
        }
        ... on Contact {
          ...ContactLink_Contact
        }
      }
      isEdited
      content
    }
    createdAt
  }
  ${PetitionFieldReference_PetitionFieldFragmentDoc}
  ${ContactLink_ContactFragmentDoc}
`;
export const TimelineCommentDeletedEvent_CommentDeletedEventFragmentDoc = gql`
  fragment TimelineCommentDeletedEvent_CommentDeletedEvent on CommentDeletedEvent {
    field {
      ...PetitionFieldReference_PetitionField
    }
    deletedBy {
      ... on User {
        id
        fullName
      }
      ... on Contact {
        ...ContactLink_Contact
      }
    }
    createdAt
  }
  ${PetitionFieldReference_PetitionFieldFragmentDoc}
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
`;
export const PetitionActivityTimeline_PetitionFragmentDoc = gql`
  fragment PetitionActivityTimeline_Petition on Petition {
    events(limit: 100) {
      items {
        ...PetitionActivityTimeline_PetitionEvent
      }
    }
  }
  ${PetitionActivityTimeline_PetitionEventFragmentDoc}
`;
export const PetitionActivity_PetitionFragmentDoc = gql`
  fragment PetitionActivity_Petition on Petition {
    id
    ...PetitionLayout_Petition
    ...PetitionAccessTable_Petition
    ...PetitionActivityTimeline_Petition
  }
  ${PetitionLayout_PetitionFragmentDoc}
  ${PetitionAccessTable_PetitionFragmentDoc}
  ${PetitionActivityTimeline_PetitionFragmentDoc}
`;
export const PetitionLayout_UserFragmentDoc = gql`
  fragment PetitionLayout_User on User {
    ...AppLayout_User
  }
  ${AppLayout_UserFragmentDoc}
`;
export const PetitionActivity_UserFragmentDoc = gql`
  fragment PetitionActivity_User on User {
    ...PetitionLayout_User
  }
  ${PetitionLayout_UserFragmentDoc}
`;
export const PetitionComposeFieldSettings_PetitionFieldFragmentDoc = gql`
  fragment PetitionComposeFieldSettings_PetitionField on PetitionField {
    id
    type
    optional
    multiple
    options
  }
`;
export const PetitionCompose_PetitionFieldFragmentDoc = gql`
  fragment PetitionCompose_PetitionField on PetitionField {
    ...PetitionComposeField_PetitionField
    ...PetitionComposeFieldSettings_PetitionField
  }
  ${PetitionComposeField_PetitionFieldFragmentDoc}
  ${PetitionComposeFieldSettings_PetitionFieldFragmentDoc}
`;
export const PetitionComposeMessageEditor_PetitionFragmentDoc = gql`
  fragment PetitionComposeMessageEditor_Petition on Petition {
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
export const PetitionCompose_PetitionFragmentDoc = gql`
  fragment PetitionCompose_Petition on Petition {
    id
    ...PetitionLayout_Petition
    fields {
      ...PetitionCompose_PetitionField
    }
    ...PetitionComposeMessageEditor_Petition
  }
  ${PetitionLayout_PetitionFragmentDoc}
  ${PetitionCompose_PetitionFieldFragmentDoc}
  ${PetitionComposeMessageEditor_PetitionFragmentDoc}
`;
export const PetitionCompose_UserFragmentDoc = gql`
  fragment PetitionCompose_User on User {
    ...PetitionLayout_User
  }
  ${PetitionLayout_UserFragmentDoc}
`;
export const PetitionCompose_updateFieldPositions_PetitionFragmentDoc = gql`
  fragment PetitionCompose_updateFieldPositions_Petition on Petition {
    fields {
      id
    }
  }
`;
export const PetitionCompose_createPetitionField_PetitionFragmentDoc = gql`
  fragment PetitionCompose_createPetitionField_Petition on Petition {
    fields {
      id
    }
  }
`;
export const PetitionCompose_deletePetitionField_PetitionFragmentDoc = gql`
  fragment PetitionCompose_deletePetitionField_Petition on Petition {
    fields {
      id
    }
  }
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
      ... on Contact {
        ...ContactLink_Contact
      }
    }
    content
    publishedAt
    isUnread
    isEdited
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
export const PetitionReplies_PetitionFragmentDoc = gql`
  fragment PetitionReplies_Petition on Petition {
    id
    ...PetitionLayout_Petition
    fields {
      ...PetitionRepliesField_PetitionField
      ...PetitionRepliesFieldComments_PetitionField
      ...DownloadAllDialog_PetitionField
    }
  }
  ${PetitionLayout_PetitionFragmentDoc}
  ${PetitionRepliesField_PetitionFieldFragmentDoc}
  ${PetitionRepliesFieldComments_PetitionFieldFragmentDoc}
  ${DownloadAllDialog_PetitionFieldFragmentDoc}
`;
export const PetitionReplies_UserFragmentDoc = gql`
  fragment PetitionReplies_User on User {
    ...PetitionLayout_User
  }
  ${PetitionLayout_UserFragmentDoc}
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
export const Petitions_PetitionsListFragmentDoc = gql`
  fragment Petitions_PetitionsList on PetitionPagination {
    items {
      id
      locale
      customRef
      name
      status
      deadline
      progress {
        validated
        replied
        optional
        total
      }
      createdAt
      recipients {
        ...ContactLink_Contact
      }
    }
    totalCount
  }
  ${ContactLink_ContactFragmentDoc}
`;
export const Petitions_UserFragmentDoc = gql`
  fragment Petitions_User on User {
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
export const Login_UserFragmentDoc = gql`
  fragment Login_User on User {
    fullName
    email
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
      id
      publicContent
      createdAt
    }
    comments {
      id
      isUnread
      publishedAt
    }
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
export const RecipientView_PublicPetitionFragmentDoc = gql`
  fragment RecipientView_PublicPetition on PublicPetition {
    id
    status
    deadline
    fields {
      id
      ...RecipientViewPetitionField_PublicPetitionField
      ...RecipientViewPetitionFieldCommentsDialog_PublicPetitionField
    }
  }
  ${RecipientViewPetitionField_PublicPetitionFieldFragmentDoc}
  ${RecipientViewPetitionFieldCommentsDialog_PublicPetitionFieldFragmentDoc}
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
export const RecipientViewProgressCard_PublicUserFragmentDoc = gql`
  fragment RecipientViewProgressCard_PublicUser on PublicUser {
    firstName
  }
`;
export const RecipientView_PublicUserFragmentDoc = gql`
  fragment RecipientView_PublicUser on PublicUser {
    ...RecipientViewSenderCard_PublicUser
    ...RecipientViewProgressCard_PublicUser
  }
  ${RecipientViewSenderCard_PublicUserFragmentDoc}
  ${RecipientViewProgressCard_PublicUserFragmentDoc}
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
export type AppLayout_updateOnboardingStatusMutationFn = ApolloReactCommon.MutationFunction<
  AppLayout_updateOnboardingStatusMutation,
  AppLayout_updateOnboardingStatusMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    AppLayout_updateOnboardingStatusMutation,
    AppLayout_updateOnboardingStatusMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    AppLayout_updateOnboardingStatusMutation,
    AppLayout_updateOnboardingStatusMutationVariables
  >(AppLayout_updateOnboardingStatusDocument, baseOptions);
}
export type AppLayout_updateOnboardingStatusMutationHookResult = ReturnType<
  typeof useAppLayout_updateOnboardingStatusMutation
>;
export type AppLayout_updateOnboardingStatusMutationResult = ApolloReactCommon.MutationResult<
  AppLayout_updateOnboardingStatusMutation
>;
export type AppLayout_updateOnboardingStatusMutationOptions = ApolloReactCommon.BaseMutationOptions<
  AppLayout_updateOnboardingStatusMutation,
  AppLayout_updateOnboardingStatusMutationVariables
>;
export const Contact_updateContactDocument = gql`
  mutation Contact_updateContact($id: ID!, $data: UpdateContactInput!) {
    updateContact(id: $id, data: $data) {
      ...Contact_Contact
    }
  }
  ${Contact_ContactFragmentDoc}
`;
export type Contact_updateContactMutationFn = ApolloReactCommon.MutationFunction<
  Contact_updateContactMutation,
  Contact_updateContactMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    Contact_updateContactMutation,
    Contact_updateContactMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    Contact_updateContactMutation,
    Contact_updateContactMutationVariables
  >(Contact_updateContactDocument, baseOptions);
}
export type Contact_updateContactMutationHookResult = ReturnType<
  typeof useContact_updateContactMutation
>;
export type Contact_updateContactMutationResult = ApolloReactCommon.MutationResult<
  Contact_updateContactMutation
>;
export type Contact_updateContactMutationOptions = ApolloReactCommon.BaseMutationOptions<
  Contact_updateContactMutation,
  Contact_updateContactMutationVariables
>;
export const ContactDocument = gql`
  query Contact($id: ID!) {
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
 *   },
 * });
 */
export function useContactQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    ContactQuery,
    ContactQueryVariables
  >
) {
  return ApolloReactHooks.useQuery<ContactQuery, ContactQueryVariables>(
    ContactDocument,
    baseOptions
  );
}
export function useContactLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    ContactQuery,
    ContactQueryVariables
  >
) {
  return ApolloReactHooks.useLazyQuery<ContactQuery, ContactQueryVariables>(
    ContactDocument,
    baseOptions
  );
}
export type ContactQueryHookResult = ReturnType<typeof useContactQuery>;
export type ContactLazyQueryHookResult = ReturnType<typeof useContactLazyQuery>;
export type ContactQueryResult = ApolloReactCommon.QueryResult<
  ContactQuery,
  ContactQueryVariables
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
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    ContactUserQuery,
    ContactUserQueryVariables
  >
) {
  return ApolloReactHooks.useQuery<ContactUserQuery, ContactUserQueryVariables>(
    ContactUserDocument,
    baseOptions
  );
}
export function useContactUserLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    ContactUserQuery,
    ContactUserQueryVariables
  >
) {
  return ApolloReactHooks.useLazyQuery<
    ContactUserQuery,
    ContactUserQueryVariables
  >(ContactUserDocument, baseOptions);
}
export type ContactUserQueryHookResult = ReturnType<typeof useContactUserQuery>;
export type ContactUserLazyQueryHookResult = ReturnType<
  typeof useContactUserLazyQuery
>;
export type ContactUserQueryResult = ApolloReactCommon.QueryResult<
  ContactUserQuery,
  ContactUserQueryVariables
>;
export const Contacts_deleteContactsDocument = gql`
  mutation Contacts_deleteContacts($ids: [ID!]!) {
    deleteContacts(ids: $ids)
  }
`;
export type Contacts_deleteContactsMutationFn = ApolloReactCommon.MutationFunction<
  Contacts_deleteContactsMutation,
  Contacts_deleteContactsMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    Contacts_deleteContactsMutation,
    Contacts_deleteContactsMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    Contacts_deleteContactsMutation,
    Contacts_deleteContactsMutationVariables
  >(Contacts_deleteContactsDocument, baseOptions);
}
export type Contacts_deleteContactsMutationHookResult = ReturnType<
  typeof useContacts_deleteContactsMutation
>;
export type Contacts_deleteContactsMutationResult = ApolloReactCommon.MutationResult<
  Contacts_deleteContactsMutation
>;
export type Contacts_deleteContactsMutationOptions = ApolloReactCommon.BaseMutationOptions<
  Contacts_deleteContactsMutation,
  Contacts_deleteContactsMutationVariables
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
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    ContactsQuery,
    ContactsQueryVariables
  >
) {
  return ApolloReactHooks.useQuery<ContactsQuery, ContactsQueryVariables>(
    ContactsDocument,
    baseOptions
  );
}
export function useContactsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    ContactsQuery,
    ContactsQueryVariables
  >
) {
  return ApolloReactHooks.useLazyQuery<ContactsQuery, ContactsQueryVariables>(
    ContactsDocument,
    baseOptions
  );
}
export type ContactsQueryHookResult = ReturnType<typeof useContactsQuery>;
export type ContactsLazyQueryHookResult = ReturnType<
  typeof useContactsLazyQuery
>;
export type ContactsQueryResult = ApolloReactCommon.QueryResult<
  ContactsQuery,
  ContactsQueryVariables
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
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    ContactsUserQuery,
    ContactsUserQueryVariables
  >
) {
  return ApolloReactHooks.useQuery<
    ContactsUserQuery,
    ContactsUserQueryVariables
  >(ContactsUserDocument, baseOptions);
}
export function useContactsUserLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    ContactsUserQuery,
    ContactsUserQueryVariables
  >
) {
  return ApolloReactHooks.useLazyQuery<
    ContactsUserQuery,
    ContactsUserQueryVariables
  >(ContactsUserDocument, baseOptions);
}
export type ContactsUserQueryHookResult = ReturnType<
  typeof useContactsUserQuery
>;
export type ContactsUserLazyQueryHookResult = ReturnType<
  typeof useContactsUserLazyQuery
>;
export type ContactsUserQueryResult = ApolloReactCommon.QueryResult<
  ContactsUserQuery,
  ContactsUserQueryVariables
>;
export const PetitionActivity_updatePetitionDocument = gql`
  mutation PetitionActivity_updatePetition(
    $petitionId: ID!
    $data: UpdatePetitionInput!
  ) {
    updatePetition(petitionId: $petitionId, data: $data) {
      ...PetitionActivity_Petition
    }
  }
  ${PetitionActivity_PetitionFragmentDoc}
`;
export type PetitionActivity_updatePetitionMutationFn = ApolloReactCommon.MutationFunction<
  PetitionActivity_updatePetitionMutation,
  PetitionActivity_updatePetitionMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PetitionActivity_updatePetitionMutation,
    PetitionActivity_updatePetitionMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PetitionActivity_updatePetitionMutation,
    PetitionActivity_updatePetitionMutationVariables
  >(PetitionActivity_updatePetitionDocument, baseOptions);
}
export type PetitionActivity_updatePetitionMutationHookResult = ReturnType<
  typeof usePetitionActivity_updatePetitionMutation
>;
export type PetitionActivity_updatePetitionMutationResult = ApolloReactCommon.MutationResult<
  PetitionActivity_updatePetitionMutation
>;
export type PetitionActivity_updatePetitionMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PetitionActivity_updatePetitionMutation,
  PetitionActivity_updatePetitionMutationVariables
>;
export const PetitionActivity_sendMessagesDocument = gql`
  mutation PetitionActivity_sendMessages(
    $petitionId: ID!
    $accessIds: [ID!]!
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
export type PetitionActivity_sendMessagesMutationFn = ApolloReactCommon.MutationFunction<
  PetitionActivity_sendMessagesMutation,
  PetitionActivity_sendMessagesMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PetitionActivity_sendMessagesMutation,
    PetitionActivity_sendMessagesMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PetitionActivity_sendMessagesMutation,
    PetitionActivity_sendMessagesMutationVariables
  >(PetitionActivity_sendMessagesDocument, baseOptions);
}
export type PetitionActivity_sendMessagesMutationHookResult = ReturnType<
  typeof usePetitionActivity_sendMessagesMutation
>;
export type PetitionActivity_sendMessagesMutationResult = ApolloReactCommon.MutationResult<
  PetitionActivity_sendMessagesMutation
>;
export type PetitionActivity_sendMessagesMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PetitionActivity_sendMessagesMutation,
  PetitionActivity_sendMessagesMutationVariables
>;
export const PetitionActivity_sendRemindersDocument = gql`
  mutation PetitionActivity_sendReminders(
    $petitionId: ID!
    $accessIds: [ID!]!
  ) {
    sendReminders(petitionId: $petitionId, accessIds: $accessIds)
  }
`;
export type PetitionActivity_sendRemindersMutationFn = ApolloReactCommon.MutationFunction<
  PetitionActivity_sendRemindersMutation,
  PetitionActivity_sendRemindersMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PetitionActivity_sendRemindersMutation,
    PetitionActivity_sendRemindersMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PetitionActivity_sendRemindersMutation,
    PetitionActivity_sendRemindersMutationVariables
  >(PetitionActivity_sendRemindersDocument, baseOptions);
}
export type PetitionActivity_sendRemindersMutationHookResult = ReturnType<
  typeof usePetitionActivity_sendRemindersMutation
>;
export type PetitionActivity_sendRemindersMutationResult = ApolloReactCommon.MutationResult<
  PetitionActivity_sendRemindersMutation
>;
export type PetitionActivity_sendRemindersMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PetitionActivity_sendRemindersMutation,
  PetitionActivity_sendRemindersMutationVariables
>;
export const PetitionActivity_deactivateAccessesDocument = gql`
  mutation PetitionActivity_deactivateAccesses(
    $petitionId: ID!
    $accessIds: [ID!]!
  ) {
    deactivateAccesses(petitionId: $petitionId, accessIds: $accessIds) {
      id
      status
    }
  }
`;
export type PetitionActivity_deactivateAccessesMutationFn = ApolloReactCommon.MutationFunction<
  PetitionActivity_deactivateAccessesMutation,
  PetitionActivity_deactivateAccessesMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PetitionActivity_deactivateAccessesMutation,
    PetitionActivity_deactivateAccessesMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PetitionActivity_deactivateAccessesMutation,
    PetitionActivity_deactivateAccessesMutationVariables
  >(PetitionActivity_deactivateAccessesDocument, baseOptions);
}
export type PetitionActivity_deactivateAccessesMutationHookResult = ReturnType<
  typeof usePetitionActivity_deactivateAccessesMutation
>;
export type PetitionActivity_deactivateAccessesMutationResult = ApolloReactCommon.MutationResult<
  PetitionActivity_deactivateAccessesMutation
>;
export type PetitionActivity_deactivateAccessesMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PetitionActivity_deactivateAccessesMutation,
  PetitionActivity_deactivateAccessesMutationVariables
>;
export const PetitionActivity_reactivateAccessesDocument = gql`
  mutation PetitionActivity_reactivateAccesses(
    $petitionId: ID!
    $accessIds: [ID!]!
  ) {
    reactivateAccesses(petitionId: $petitionId, accessIds: $accessIds) {
      id
      status
    }
  }
`;
export type PetitionActivity_reactivateAccessesMutationFn = ApolloReactCommon.MutationFunction<
  PetitionActivity_reactivateAccessesMutation,
  PetitionActivity_reactivateAccessesMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PetitionActivity_reactivateAccessesMutation,
    PetitionActivity_reactivateAccessesMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PetitionActivity_reactivateAccessesMutation,
    PetitionActivity_reactivateAccessesMutationVariables
  >(PetitionActivity_reactivateAccessesDocument, baseOptions);
}
export type PetitionActivity_reactivateAccessesMutationHookResult = ReturnType<
  typeof usePetitionActivity_reactivateAccessesMutation
>;
export type PetitionActivity_reactivateAccessesMutationResult = ApolloReactCommon.MutationResult<
  PetitionActivity_reactivateAccessesMutation
>;
export type PetitionActivity_reactivateAccessesMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PetitionActivity_reactivateAccessesMutation,
  PetitionActivity_reactivateAccessesMutationVariables
>;
export const PetitionActivity_cancelScheduledMessageDocument = gql`
  mutation PetitionActivity_cancelScheduledMessage(
    $petitionId: ID!
    $messageId: ID!
  ) {
    cancelScheduledMessage(petitionId: $petitionId, messageId: $messageId) {
      id
      status
    }
  }
`;
export type PetitionActivity_cancelScheduledMessageMutationFn = ApolloReactCommon.MutationFunction<
  PetitionActivity_cancelScheduledMessageMutation,
  PetitionActivity_cancelScheduledMessageMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PetitionActivity_cancelScheduledMessageMutation,
    PetitionActivity_cancelScheduledMessageMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PetitionActivity_cancelScheduledMessageMutation,
    PetitionActivity_cancelScheduledMessageMutationVariables
  >(PetitionActivity_cancelScheduledMessageDocument, baseOptions);
}
export type PetitionActivity_cancelScheduledMessageMutationHookResult = ReturnType<
  typeof usePetitionActivity_cancelScheduledMessageMutation
>;
export type PetitionActivity_cancelScheduledMessageMutationResult = ApolloReactCommon.MutationResult<
  PetitionActivity_cancelScheduledMessageMutation
>;
export type PetitionActivity_cancelScheduledMessageMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PetitionActivity_cancelScheduledMessageMutation,
  PetitionActivity_cancelScheduledMessageMutationVariables
>;
export const PetitionsActivity_sendPetitionDocument = gql`
  mutation PetitionsActivity_sendPetition(
    $petitionId: ID!
    $contactIds: [ID!]!
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
export type PetitionsActivity_sendPetitionMutationFn = ApolloReactCommon.MutationFunction<
  PetitionsActivity_sendPetitionMutation,
  PetitionsActivity_sendPetitionMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PetitionsActivity_sendPetitionMutation,
    PetitionsActivity_sendPetitionMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PetitionsActivity_sendPetitionMutation,
    PetitionsActivity_sendPetitionMutationVariables
  >(PetitionsActivity_sendPetitionDocument, baseOptions);
}
export type PetitionsActivity_sendPetitionMutationHookResult = ReturnType<
  typeof usePetitionsActivity_sendPetitionMutation
>;
export type PetitionsActivity_sendPetitionMutationResult = ApolloReactCommon.MutationResult<
  PetitionsActivity_sendPetitionMutation
>;
export type PetitionsActivity_sendPetitionMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PetitionsActivity_sendPetitionMutation,
  PetitionsActivity_sendPetitionMutationVariables
>;
export const PetitionActivityDocument = gql`
  query PetitionActivity($id: ID!) {
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
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    PetitionActivityQuery,
    PetitionActivityQueryVariables
  >
) {
  return ApolloReactHooks.useQuery<
    PetitionActivityQuery,
    PetitionActivityQueryVariables
  >(PetitionActivityDocument, baseOptions);
}
export function usePetitionActivityLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    PetitionActivityQuery,
    PetitionActivityQueryVariables
  >
) {
  return ApolloReactHooks.useLazyQuery<
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
export type PetitionActivityQueryResult = ApolloReactCommon.QueryResult<
  PetitionActivityQuery,
  PetitionActivityQueryVariables
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
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    PetitionActivityUserQuery,
    PetitionActivityUserQueryVariables
  >
) {
  return ApolloReactHooks.useQuery<
    PetitionActivityUserQuery,
    PetitionActivityUserQueryVariables
  >(PetitionActivityUserDocument, baseOptions);
}
export function usePetitionActivityUserLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    PetitionActivityUserQuery,
    PetitionActivityUserQueryVariables
  >
) {
  return ApolloReactHooks.useLazyQuery<
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
export type PetitionActivityUserQueryResult = ApolloReactCommon.QueryResult<
  PetitionActivityUserQuery,
  PetitionActivityUserQueryVariables
>;
export const PetitionCompose_updatePetitionDocument = gql`
  mutation PetitionCompose_updatePetition(
    $petitionId: ID!
    $data: UpdatePetitionInput!
  ) {
    updatePetition(petitionId: $petitionId, data: $data) {
      ...PetitionLayout_Petition
      ...PetitionComposeMessageEditor_Petition
    }
  }
  ${PetitionLayout_PetitionFragmentDoc}
  ${PetitionComposeMessageEditor_PetitionFragmentDoc}
`;
export type PetitionCompose_updatePetitionMutationFn = ApolloReactCommon.MutationFunction<
  PetitionCompose_updatePetitionMutation,
  PetitionCompose_updatePetitionMutationVariables
>;

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
 *   },
 * });
 */
export function usePetitionCompose_updatePetitionMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PetitionCompose_updatePetitionMutation,
    PetitionCompose_updatePetitionMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PetitionCompose_updatePetitionMutation,
    PetitionCompose_updatePetitionMutationVariables
  >(PetitionCompose_updatePetitionDocument, baseOptions);
}
export type PetitionCompose_updatePetitionMutationHookResult = ReturnType<
  typeof usePetitionCompose_updatePetitionMutation
>;
export type PetitionCompose_updatePetitionMutationResult = ApolloReactCommon.MutationResult<
  PetitionCompose_updatePetitionMutation
>;
export type PetitionCompose_updatePetitionMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PetitionCompose_updatePetitionMutation,
  PetitionCompose_updatePetitionMutationVariables
>;
export const PetitionCompose_updateFieldPositionsDocument = gql`
  mutation PetitionCompose_updateFieldPositions(
    $petitionId: ID!
    $fieldIds: [ID!]!
  ) {
    updateFieldPositions(petitionId: $petitionId, fieldIds: $fieldIds) {
      id
      ...PetitionLayout_Petition
    }
  }
  ${PetitionLayout_PetitionFragmentDoc}
`;
export type PetitionCompose_updateFieldPositionsMutationFn = ApolloReactCommon.MutationFunction<
  PetitionCompose_updateFieldPositionsMutation,
  PetitionCompose_updateFieldPositionsMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PetitionCompose_updateFieldPositionsMutation,
    PetitionCompose_updateFieldPositionsMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PetitionCompose_updateFieldPositionsMutation,
    PetitionCompose_updateFieldPositionsMutationVariables
  >(PetitionCompose_updateFieldPositionsDocument, baseOptions);
}
export type PetitionCompose_updateFieldPositionsMutationHookResult = ReturnType<
  typeof usePetitionCompose_updateFieldPositionsMutation
>;
export type PetitionCompose_updateFieldPositionsMutationResult = ApolloReactCommon.MutationResult<
  PetitionCompose_updateFieldPositionsMutation
>;
export type PetitionCompose_updateFieldPositionsMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PetitionCompose_updateFieldPositionsMutation,
  PetitionCompose_updateFieldPositionsMutationVariables
>;
export const PetitionCompose_createPetitionFieldDocument = gql`
  mutation PetitionCompose_createPetitionField(
    $petitionId: ID!
    $type: PetitionFieldType!
  ) {
    createPetitionField(petitionId: $petitionId, type: $type) {
      field {
        id
        ...PetitionComposeField_PetitionField
        ...PetitionComposeFieldSettings_PetitionField
      }
      petition {
        ...PetitionLayout_Petition
      }
    }
  }
  ${PetitionComposeField_PetitionFieldFragmentDoc}
  ${PetitionComposeFieldSettings_PetitionFieldFragmentDoc}
  ${PetitionLayout_PetitionFragmentDoc}
`;
export type PetitionCompose_createPetitionFieldMutationFn = ApolloReactCommon.MutationFunction<
  PetitionCompose_createPetitionFieldMutation,
  PetitionCompose_createPetitionFieldMutationVariables
>;

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
 *   },
 * });
 */
export function usePetitionCompose_createPetitionFieldMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PetitionCompose_createPetitionFieldMutation,
    PetitionCompose_createPetitionFieldMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PetitionCompose_createPetitionFieldMutation,
    PetitionCompose_createPetitionFieldMutationVariables
  >(PetitionCompose_createPetitionFieldDocument, baseOptions);
}
export type PetitionCompose_createPetitionFieldMutationHookResult = ReturnType<
  typeof usePetitionCompose_createPetitionFieldMutation
>;
export type PetitionCompose_createPetitionFieldMutationResult = ApolloReactCommon.MutationResult<
  PetitionCompose_createPetitionFieldMutation
>;
export type PetitionCompose_createPetitionFieldMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PetitionCompose_createPetitionFieldMutation,
  PetitionCompose_createPetitionFieldMutationVariables
>;
export const PetitionCompose_deletePetitionFieldDocument = gql`
  mutation PetitionCompose_deletePetitionField(
    $petitionId: ID!
    $fieldId: ID!
  ) {
    deletePetitionField(petitionId: $petitionId, fieldId: $fieldId) {
      id
      ...PetitionLayout_Petition
    }
  }
  ${PetitionLayout_PetitionFragmentDoc}
`;
export type PetitionCompose_deletePetitionFieldMutationFn = ApolloReactCommon.MutationFunction<
  PetitionCompose_deletePetitionFieldMutation,
  PetitionCompose_deletePetitionFieldMutationVariables
>;

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
 *   },
 * });
 */
export function usePetitionCompose_deletePetitionFieldMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PetitionCompose_deletePetitionFieldMutation,
    PetitionCompose_deletePetitionFieldMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PetitionCompose_deletePetitionFieldMutation,
    PetitionCompose_deletePetitionFieldMutationVariables
  >(PetitionCompose_deletePetitionFieldDocument, baseOptions);
}
export type PetitionCompose_deletePetitionFieldMutationHookResult = ReturnType<
  typeof usePetitionCompose_deletePetitionFieldMutation
>;
export type PetitionCompose_deletePetitionFieldMutationResult = ApolloReactCommon.MutationResult<
  PetitionCompose_deletePetitionFieldMutation
>;
export type PetitionCompose_deletePetitionFieldMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PetitionCompose_deletePetitionFieldMutation,
  PetitionCompose_deletePetitionFieldMutationVariables
>;
export const PetitionCompose_updatePetitionFieldDocument = gql`
  mutation PetitionCompose_updatePetitionField(
    $petitionId: ID!
    $fieldId: ID!
    $data: UpdatePetitionFieldInput!
  ) {
    updatePetitionField(
      petitionId: $petitionId
      fieldId: $fieldId
      data: $data
    ) {
      field {
        id
        ...PetitionComposeField_PetitionField
        ...PetitionComposeFieldSettings_PetitionField
      }
      petition {
        id
        updatedAt
      }
    }
  }
  ${PetitionComposeField_PetitionFieldFragmentDoc}
  ${PetitionComposeFieldSettings_PetitionFieldFragmentDoc}
`;
export type PetitionCompose_updatePetitionFieldMutationFn = ApolloReactCommon.MutationFunction<
  PetitionCompose_updatePetitionFieldMutation,
  PetitionCompose_updatePetitionFieldMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PetitionCompose_updatePetitionFieldMutation,
    PetitionCompose_updatePetitionFieldMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PetitionCompose_updatePetitionFieldMutation,
    PetitionCompose_updatePetitionFieldMutationVariables
  >(PetitionCompose_updatePetitionFieldDocument, baseOptions);
}
export type PetitionCompose_updatePetitionFieldMutationHookResult = ReturnType<
  typeof usePetitionCompose_updatePetitionFieldMutation
>;
export type PetitionCompose_updatePetitionFieldMutationResult = ApolloReactCommon.MutationResult<
  PetitionCompose_updatePetitionFieldMutation
>;
export type PetitionCompose_updatePetitionFieldMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PetitionCompose_updatePetitionFieldMutation,
  PetitionCompose_updatePetitionFieldMutationVariables
>;
export const PetitionCompose_sendPetitionDocument = gql`
  mutation PetitionCompose_sendPetition(
    $petitionId: ID!
    $contactIds: [ID!]!
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
export type PetitionCompose_sendPetitionMutationFn = ApolloReactCommon.MutationFunction<
  PetitionCompose_sendPetitionMutation,
  PetitionCompose_sendPetitionMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PetitionCompose_sendPetitionMutation,
    PetitionCompose_sendPetitionMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PetitionCompose_sendPetitionMutation,
    PetitionCompose_sendPetitionMutationVariables
  >(PetitionCompose_sendPetitionDocument, baseOptions);
}
export type PetitionCompose_sendPetitionMutationHookResult = ReturnType<
  typeof usePetitionCompose_sendPetitionMutation
>;
export type PetitionCompose_sendPetitionMutationResult = ApolloReactCommon.MutationResult<
  PetitionCompose_sendPetitionMutation
>;
export type PetitionCompose_sendPetitionMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PetitionCompose_sendPetitionMutation,
  PetitionCompose_sendPetitionMutationVariables
>;
export const PetitionComposeDocument = gql`
  query PetitionCompose($id: ID!) {
    petition(id: $id) {
      ...PetitionCompose_Petition
    }
  }
  ${PetitionCompose_PetitionFragmentDoc}
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
 *   },
 * });
 */
export function usePetitionComposeQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    PetitionComposeQuery,
    PetitionComposeQueryVariables
  >
) {
  return ApolloReactHooks.useQuery<
    PetitionComposeQuery,
    PetitionComposeQueryVariables
  >(PetitionComposeDocument, baseOptions);
}
export function usePetitionComposeLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    PetitionComposeQuery,
    PetitionComposeQueryVariables
  >
) {
  return ApolloReactHooks.useLazyQuery<
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
export type PetitionComposeQueryResult = ApolloReactCommon.QueryResult<
  PetitionComposeQuery,
  PetitionComposeQueryVariables
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
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    PetitionComposeUserQuery,
    PetitionComposeUserQueryVariables
  >
) {
  return ApolloReactHooks.useQuery<
    PetitionComposeUserQuery,
    PetitionComposeUserQueryVariables
  >(PetitionComposeUserDocument, baseOptions);
}
export function usePetitionComposeUserLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    PetitionComposeUserQuery,
    PetitionComposeUserQueryVariables
  >
) {
  return ApolloReactHooks.useLazyQuery<
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
export type PetitionComposeUserQueryResult = ApolloReactCommon.QueryResult<
  PetitionComposeUserQuery,
  PetitionComposeUserQueryVariables
>;
export const PetitionReplies_updatePetitionDocument = gql`
  mutation PetitionReplies_updatePetition(
    $petitionId: ID!
    $data: UpdatePetitionInput!
  ) {
    updatePetition(petitionId: $petitionId, data: $data) {
      ...PetitionReplies_Petition
    }
  }
  ${PetitionReplies_PetitionFragmentDoc}
`;
export type PetitionReplies_updatePetitionMutationFn = ApolloReactCommon.MutationFunction<
  PetitionReplies_updatePetitionMutation,
  PetitionReplies_updatePetitionMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PetitionReplies_updatePetitionMutation,
    PetitionReplies_updatePetitionMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PetitionReplies_updatePetitionMutation,
    PetitionReplies_updatePetitionMutationVariables
  >(PetitionReplies_updatePetitionDocument, baseOptions);
}
export type PetitionReplies_updatePetitionMutationHookResult = ReturnType<
  typeof usePetitionReplies_updatePetitionMutation
>;
export type PetitionReplies_updatePetitionMutationResult = ApolloReactCommon.MutationResult<
  PetitionReplies_updatePetitionMutation
>;
export type PetitionReplies_updatePetitionMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PetitionReplies_updatePetitionMutation,
  PetitionReplies_updatePetitionMutationVariables
>;
export const PetitionReplies_validatePetitionFieldsDocument = gql`
  mutation PetitionReplies_validatePetitionFields(
    $petitionId: ID!
    $fieldIds: [ID!]!
    $value: Boolean!
  ) {
    validatePetitionFields(
      petitionId: $petitionId
      fieldIds: $fieldIds
      value: $value
    ) {
      fields {
        id
        validated
      }
      petition {
        ...PetitionLayout_Petition
      }
    }
  }
  ${PetitionLayout_PetitionFragmentDoc}
`;
export type PetitionReplies_validatePetitionFieldsMutationFn = ApolloReactCommon.MutationFunction<
  PetitionReplies_validatePetitionFieldsMutation,
  PetitionReplies_validatePetitionFieldsMutationVariables
>;

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
 *   },
 * });
 */
export function usePetitionReplies_validatePetitionFieldsMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PetitionReplies_validatePetitionFieldsMutation,
    PetitionReplies_validatePetitionFieldsMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PetitionReplies_validatePetitionFieldsMutation,
    PetitionReplies_validatePetitionFieldsMutationVariables
  >(PetitionReplies_validatePetitionFieldsDocument, baseOptions);
}
export type PetitionReplies_validatePetitionFieldsMutationHookResult = ReturnType<
  typeof usePetitionReplies_validatePetitionFieldsMutation
>;
export type PetitionReplies_validatePetitionFieldsMutationResult = ApolloReactCommon.MutationResult<
  PetitionReplies_validatePetitionFieldsMutation
>;
export type PetitionReplies_validatePetitionFieldsMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PetitionReplies_validatePetitionFieldsMutation,
  PetitionReplies_validatePetitionFieldsMutationVariables
>;
export const PetitionReplies_fileUploadReplyDownloadLinkDocument = gql`
  mutation PetitionReplies_fileUploadReplyDownloadLink(
    $petitionId: ID!
    $replyId: ID!
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
export type PetitionReplies_fileUploadReplyDownloadLinkMutationFn = ApolloReactCommon.MutationFunction<
  PetitionReplies_fileUploadReplyDownloadLinkMutation,
  PetitionReplies_fileUploadReplyDownloadLinkMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PetitionReplies_fileUploadReplyDownloadLinkMutation,
    PetitionReplies_fileUploadReplyDownloadLinkMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PetitionReplies_fileUploadReplyDownloadLinkMutation,
    PetitionReplies_fileUploadReplyDownloadLinkMutationVariables
  >(PetitionReplies_fileUploadReplyDownloadLinkDocument, baseOptions);
}
export type PetitionReplies_fileUploadReplyDownloadLinkMutationHookResult = ReturnType<
  typeof usePetitionReplies_fileUploadReplyDownloadLinkMutation
>;
export type PetitionReplies_fileUploadReplyDownloadLinkMutationResult = ApolloReactCommon.MutationResult<
  PetitionReplies_fileUploadReplyDownloadLinkMutation
>;
export type PetitionReplies_fileUploadReplyDownloadLinkMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PetitionReplies_fileUploadReplyDownloadLinkMutation,
  PetitionReplies_fileUploadReplyDownloadLinkMutationVariables
>;
export const PetitionReplies_createPetitionFieldCommentDocument = gql`
  mutation PetitionReplies_createPetitionFieldComment(
    $petitionId: ID!
    $petitionFieldId: ID!
    $petitionFieldReplyId: ID
    $content: String!
  ) {
    createPetitionFieldComment(
      petitionId: $petitionId
      petitionFieldId: $petitionFieldId
      petitionFieldReplyId: $petitionFieldReplyId
      content: $content
    ) {
      ...PetitionRepliesFieldComments_PetitionFieldComment
    }
  }
  ${PetitionRepliesFieldComments_PetitionFieldCommentFragmentDoc}
`;
export type PetitionReplies_createPetitionFieldCommentMutationFn = ApolloReactCommon.MutationFunction<
  PetitionReplies_createPetitionFieldCommentMutation,
  PetitionReplies_createPetitionFieldCommentMutationVariables
>;

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
 *   },
 * });
 */
export function usePetitionReplies_createPetitionFieldCommentMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PetitionReplies_createPetitionFieldCommentMutation,
    PetitionReplies_createPetitionFieldCommentMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PetitionReplies_createPetitionFieldCommentMutation,
    PetitionReplies_createPetitionFieldCommentMutationVariables
  >(PetitionReplies_createPetitionFieldCommentDocument, baseOptions);
}
export type PetitionReplies_createPetitionFieldCommentMutationHookResult = ReturnType<
  typeof usePetitionReplies_createPetitionFieldCommentMutation
>;
export type PetitionReplies_createPetitionFieldCommentMutationResult = ApolloReactCommon.MutationResult<
  PetitionReplies_createPetitionFieldCommentMutation
>;
export type PetitionReplies_createPetitionFieldCommentMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PetitionReplies_createPetitionFieldCommentMutation,
  PetitionReplies_createPetitionFieldCommentMutationVariables
>;
export const PetitionReplies_updatePetitionFieldCommentDocument = gql`
  mutation PetitionReplies_updatePetitionFieldComment(
    $petitionId: ID!
    $petitionFieldId: ID!
    $petitionFieldCommentId: ID!
    $content: String!
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
export type PetitionReplies_updatePetitionFieldCommentMutationFn = ApolloReactCommon.MutationFunction<
  PetitionReplies_updatePetitionFieldCommentMutation,
  PetitionReplies_updatePetitionFieldCommentMutationVariables
>;

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
 *   },
 * });
 */
export function usePetitionReplies_updatePetitionFieldCommentMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PetitionReplies_updatePetitionFieldCommentMutation,
    PetitionReplies_updatePetitionFieldCommentMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PetitionReplies_updatePetitionFieldCommentMutation,
    PetitionReplies_updatePetitionFieldCommentMutationVariables
  >(PetitionReplies_updatePetitionFieldCommentDocument, baseOptions);
}
export type PetitionReplies_updatePetitionFieldCommentMutationHookResult = ReturnType<
  typeof usePetitionReplies_updatePetitionFieldCommentMutation
>;
export type PetitionReplies_updatePetitionFieldCommentMutationResult = ApolloReactCommon.MutationResult<
  PetitionReplies_updatePetitionFieldCommentMutation
>;
export type PetitionReplies_updatePetitionFieldCommentMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PetitionReplies_updatePetitionFieldCommentMutation,
  PetitionReplies_updatePetitionFieldCommentMutationVariables
>;
export const PetitionReplies_deletePetitionFieldCommentDocument = gql`
  mutation PetitionReplies_deletePetitionFieldComment(
    $petitionId: ID!
    $petitionFieldId: ID!
    $petitionFieldCommentId: ID!
  ) {
    deletePetitionFieldComment(
      petitionId: $petitionId
      petitionFieldId: $petitionFieldId
      petitionFieldCommentId: $petitionFieldCommentId
    )
  }
`;
export type PetitionReplies_deletePetitionFieldCommentMutationFn = ApolloReactCommon.MutationFunction<
  PetitionReplies_deletePetitionFieldCommentMutation,
  PetitionReplies_deletePetitionFieldCommentMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PetitionReplies_deletePetitionFieldCommentMutation,
    PetitionReplies_deletePetitionFieldCommentMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PetitionReplies_deletePetitionFieldCommentMutation,
    PetitionReplies_deletePetitionFieldCommentMutationVariables
  >(PetitionReplies_deletePetitionFieldCommentDocument, baseOptions);
}
export type PetitionReplies_deletePetitionFieldCommentMutationHookResult = ReturnType<
  typeof usePetitionReplies_deletePetitionFieldCommentMutation
>;
export type PetitionReplies_deletePetitionFieldCommentMutationResult = ApolloReactCommon.MutationResult<
  PetitionReplies_deletePetitionFieldCommentMutation
>;
export type PetitionReplies_deletePetitionFieldCommentMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PetitionReplies_deletePetitionFieldCommentMutation,
  PetitionReplies_deletePetitionFieldCommentMutationVariables
>;
export const PetitionReplies_submitUnpublishedCommentsDocument = gql`
  mutation PetitionReplies_submitUnpublishedComments($petitionId: ID!) {
    submitUnpublishedComments(petitionId: $petitionId) {
      id
      publishedAt
    }
  }
`;
export type PetitionReplies_submitUnpublishedCommentsMutationFn = ApolloReactCommon.MutationFunction<
  PetitionReplies_submitUnpublishedCommentsMutation,
  PetitionReplies_submitUnpublishedCommentsMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PetitionReplies_submitUnpublishedCommentsMutation,
    PetitionReplies_submitUnpublishedCommentsMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PetitionReplies_submitUnpublishedCommentsMutation,
    PetitionReplies_submitUnpublishedCommentsMutationVariables
  >(PetitionReplies_submitUnpublishedCommentsDocument, baseOptions);
}
export type PetitionReplies_submitUnpublishedCommentsMutationHookResult = ReturnType<
  typeof usePetitionReplies_submitUnpublishedCommentsMutation
>;
export type PetitionReplies_submitUnpublishedCommentsMutationResult = ApolloReactCommon.MutationResult<
  PetitionReplies_submitUnpublishedCommentsMutation
>;
export type PetitionReplies_submitUnpublishedCommentsMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PetitionReplies_submitUnpublishedCommentsMutation,
  PetitionReplies_submitUnpublishedCommentsMutationVariables
>;
export const PetitionReplies_markPetitionFieldCommentsAsReadDocument = gql`
  mutation PetitionReplies_markPetitionFieldCommentsAsRead(
    $petitionId: ID!
    $petitionFieldCommentIds: [ID!]!
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
export type PetitionReplies_markPetitionFieldCommentsAsReadMutationFn = ApolloReactCommon.MutationFunction<
  PetitionReplies_markPetitionFieldCommentsAsReadMutation,
  PetitionReplies_markPetitionFieldCommentsAsReadMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PetitionReplies_markPetitionFieldCommentsAsReadMutation,
    PetitionReplies_markPetitionFieldCommentsAsReadMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PetitionReplies_markPetitionFieldCommentsAsReadMutation,
    PetitionReplies_markPetitionFieldCommentsAsReadMutationVariables
  >(PetitionReplies_markPetitionFieldCommentsAsReadDocument, baseOptions);
}
export type PetitionReplies_markPetitionFieldCommentsAsReadMutationHookResult = ReturnType<
  typeof usePetitionReplies_markPetitionFieldCommentsAsReadMutation
>;
export type PetitionReplies_markPetitionFieldCommentsAsReadMutationResult = ApolloReactCommon.MutationResult<
  PetitionReplies_markPetitionFieldCommentsAsReadMutation
>;
export type PetitionReplies_markPetitionFieldCommentsAsReadMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PetitionReplies_markPetitionFieldCommentsAsReadMutation,
  PetitionReplies_markPetitionFieldCommentsAsReadMutationVariables
>;
export const PetitionReplies_updatePetitionFieldReplyStatusDocument = gql`
  mutation PetitionReplies_updatePetitionFieldReplyStatus(
    $petitionId: ID!
    $petitionFieldReplyId: ID!
    $status: PetitionFieldReplyStatus!
  ) {
    updatePetitionFieldReplyStatus(
      petitionId: $petitionId
      petitionFieldReplyId: $petitionFieldReplyId
      status: $status
    ) {
      id
      status
    }
  }
`;
export type PetitionReplies_updatePetitionFieldReplyStatusMutationFn = ApolloReactCommon.MutationFunction<
  PetitionReplies_updatePetitionFieldReplyStatusMutation,
  PetitionReplies_updatePetitionFieldReplyStatusMutationVariables
>;

/**
 * __usePetitionReplies_updatePetitionFieldReplyStatusMutation__
 *
 * To run a mutation, you first call `usePetitionReplies_updatePetitionFieldReplyStatusMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionReplies_updatePetitionFieldReplyStatusMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionRepliesUpdatePetitionFieldReplyStatusMutation, { data, loading, error }] = usePetitionReplies_updatePetitionFieldReplyStatusMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      petitionFieldReplyId: // value for 'petitionFieldReplyId'
 *      status: // value for 'status'
 *   },
 * });
 */
export function usePetitionReplies_updatePetitionFieldReplyStatusMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PetitionReplies_updatePetitionFieldReplyStatusMutation,
    PetitionReplies_updatePetitionFieldReplyStatusMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PetitionReplies_updatePetitionFieldReplyStatusMutation,
    PetitionReplies_updatePetitionFieldReplyStatusMutationVariables
  >(PetitionReplies_updatePetitionFieldReplyStatusDocument, baseOptions);
}
export type PetitionReplies_updatePetitionFieldReplyStatusMutationHookResult = ReturnType<
  typeof usePetitionReplies_updatePetitionFieldReplyStatusMutation
>;
export type PetitionReplies_updatePetitionFieldReplyStatusMutationResult = ApolloReactCommon.MutationResult<
  PetitionReplies_updatePetitionFieldReplyStatusMutation
>;
export type PetitionReplies_updatePetitionFieldReplyStatusMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PetitionReplies_updatePetitionFieldReplyStatusMutation,
  PetitionReplies_updatePetitionFieldReplyStatusMutationVariables
>;
export const PetitionRepliesDocument = gql`
  query PetitionReplies($id: ID!) {
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
 *   },
 * });
 */
export function usePetitionRepliesQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    PetitionRepliesQuery,
    PetitionRepliesQueryVariables
  >
) {
  return ApolloReactHooks.useQuery<
    PetitionRepliesQuery,
    PetitionRepliesQueryVariables
  >(PetitionRepliesDocument, baseOptions);
}
export function usePetitionRepliesLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    PetitionRepliesQuery,
    PetitionRepliesQueryVariables
  >
) {
  return ApolloReactHooks.useLazyQuery<
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
export type PetitionRepliesQueryResult = ApolloReactCommon.QueryResult<
  PetitionRepliesQuery,
  PetitionRepliesQueryVariables
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
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    PetitionRepliesUserQuery,
    PetitionRepliesUserQueryVariables
  >
) {
  return ApolloReactHooks.useQuery<
    PetitionRepliesUserQuery,
    PetitionRepliesUserQueryVariables
  >(PetitionRepliesUserDocument, baseOptions);
}
export function usePetitionRepliesUserLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    PetitionRepliesUserQuery,
    PetitionRepliesUserQueryVariables
  >
) {
  return ApolloReactHooks.useLazyQuery<
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
export type PetitionRepliesUserQueryResult = ApolloReactCommon.QueryResult<
  PetitionRepliesUserQuery,
  PetitionRepliesUserQueryVariables
>;
export const Petitions_deletePetitionsDocument = gql`
  mutation Petitions_deletePetitions($ids: [ID!]!) {
    deletePetitions(ids: $ids)
  }
`;
export type Petitions_deletePetitionsMutationFn = ApolloReactCommon.MutationFunction<
  Petitions_deletePetitionsMutation,
  Petitions_deletePetitionsMutationVariables
>;

/**
 * __usePetitions_deletePetitionsMutation__
 *
 * To run a mutation, you first call `usePetitions_deletePetitionsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitions_deletePetitionsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionsDeletePetitionsMutation, { data, loading, error }] = usePetitions_deletePetitionsMutation({
 *   variables: {
 *      ids: // value for 'ids'
 *   },
 * });
 */
export function usePetitions_deletePetitionsMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    Petitions_deletePetitionsMutation,
    Petitions_deletePetitionsMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    Petitions_deletePetitionsMutation,
    Petitions_deletePetitionsMutationVariables
  >(Petitions_deletePetitionsDocument, baseOptions);
}
export type Petitions_deletePetitionsMutationHookResult = ReturnType<
  typeof usePetitions_deletePetitionsMutation
>;
export type Petitions_deletePetitionsMutationResult = ApolloReactCommon.MutationResult<
  Petitions_deletePetitionsMutation
>;
export type Petitions_deletePetitionsMutationOptions = ApolloReactCommon.BaseMutationOptions<
  Petitions_deletePetitionsMutation,
  Petitions_deletePetitionsMutationVariables
>;
export const Petitions_clonePetitionDocument = gql`
  mutation Petitions_clonePetition(
    $petitionId: ID!
    $name: String
    $locale: PetitionLocale!
    $deadline: DateTime
  ) {
    clonePetition(
      petitionId: $petitionId
      name: $name
      locale: $locale
      deadline: $deadline
    ) {
      id
    }
  }
`;
export type Petitions_clonePetitionMutationFn = ApolloReactCommon.MutationFunction<
  Petitions_clonePetitionMutation,
  Petitions_clonePetitionMutationVariables
>;

/**
 * __usePetitions_clonePetitionMutation__
 *
 * To run a mutation, you first call `usePetitions_clonePetitionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitions_clonePetitionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionsClonePetitionMutation, { data, loading, error }] = usePetitions_clonePetitionMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      name: // value for 'name'
 *      locale: // value for 'locale'
 *      deadline: // value for 'deadline'
 *   },
 * });
 */
export function usePetitions_clonePetitionMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    Petitions_clonePetitionMutation,
    Petitions_clonePetitionMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    Petitions_clonePetitionMutation,
    Petitions_clonePetitionMutationVariables
  >(Petitions_clonePetitionDocument, baseOptions);
}
export type Petitions_clonePetitionMutationHookResult = ReturnType<
  typeof usePetitions_clonePetitionMutation
>;
export type Petitions_clonePetitionMutationResult = ApolloReactCommon.MutationResult<
  Petitions_clonePetitionMutation
>;
export type Petitions_clonePetitionMutationOptions = ApolloReactCommon.BaseMutationOptions<
  Petitions_clonePetitionMutation,
  Petitions_clonePetitionMutationVariables
>;
export const PetitionsDocument = gql`
  query Petitions(
    $offset: Int!
    $limit: Int!
    $search: String
    $sortBy: [QueryPetitions_OrderBy!]
    $status: PetitionStatus
  ) {
    petitions(
      offset: $offset
      limit: $limit
      search: $search
      sortBy: $sortBy
      status: $status
    ) {
      ...Petitions_PetitionsList
    }
  }
  ${Petitions_PetitionsListFragmentDoc}
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
 *   },
 * });
 */
export function usePetitionsQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    PetitionsQuery,
    PetitionsQueryVariables
  >
) {
  return ApolloReactHooks.useQuery<PetitionsQuery, PetitionsQueryVariables>(
    PetitionsDocument,
    baseOptions
  );
}
export function usePetitionsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    PetitionsQuery,
    PetitionsQueryVariables
  >
) {
  return ApolloReactHooks.useLazyQuery<PetitionsQuery, PetitionsQueryVariables>(
    PetitionsDocument,
    baseOptions
  );
}
export type PetitionsQueryHookResult = ReturnType<typeof usePetitionsQuery>;
export type PetitionsLazyQueryHookResult = ReturnType<
  typeof usePetitionsLazyQuery
>;
export type PetitionsQueryResult = ApolloReactCommon.QueryResult<
  PetitionsQuery,
  PetitionsQueryVariables
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
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    PetitionsUserQuery,
    PetitionsUserQueryVariables
  >
) {
  return ApolloReactHooks.useQuery<
    PetitionsUserQuery,
    PetitionsUserQueryVariables
  >(PetitionsUserDocument, baseOptions);
}
export function usePetitionsUserLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    PetitionsUserQuery,
    PetitionsUserQueryVariables
  >
) {
  return ApolloReactHooks.useLazyQuery<
    PetitionsUserQuery,
    PetitionsUserQueryVariables
  >(PetitionsUserDocument, baseOptions);
}
export type PetitionsUserQueryHookResult = ReturnType<
  typeof usePetitionsUserQuery
>;
export type PetitionsUserLazyQueryHookResult = ReturnType<
  typeof usePetitionsUserLazyQuery
>;
export type PetitionsUserQueryResult = ApolloReactCommon.QueryResult<
  PetitionsUserQuery,
  PetitionsUserQueryVariables
>;
export const Account_updateAccountDocument = gql`
  mutation Account_updateAccount($id: ID!, $data: UpdateUserInput!) {
    updateUser(id: $id, data: $data) {
      id
      firstName
      lastName
      fullName
    }
  }
`;
export type Account_updateAccountMutationFn = ApolloReactCommon.MutationFunction<
  Account_updateAccountMutation,
  Account_updateAccountMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    Account_updateAccountMutation,
    Account_updateAccountMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    Account_updateAccountMutation,
    Account_updateAccountMutationVariables
  >(Account_updateAccountDocument, baseOptions);
}
export type Account_updateAccountMutationHookResult = ReturnType<
  typeof useAccount_updateAccountMutation
>;
export type Account_updateAccountMutationResult = ApolloReactCommon.MutationResult<
  Account_updateAccountMutation
>;
export type Account_updateAccountMutationOptions = ApolloReactCommon.BaseMutationOptions<
  Account_updateAccountMutation,
  Account_updateAccountMutationVariables
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
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    AccountQuery,
    AccountQueryVariables
  >
) {
  return ApolloReactHooks.useQuery<AccountQuery, AccountQueryVariables>(
    AccountDocument,
    baseOptions
  );
}
export function useAccountLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    AccountQuery,
    AccountQueryVariables
  >
) {
  return ApolloReactHooks.useLazyQuery<AccountQuery, AccountQueryVariables>(
    AccountDocument,
    baseOptions
  );
}
export type AccountQueryHookResult = ReturnType<typeof useAccountQuery>;
export type AccountLazyQueryHookResult = ReturnType<typeof useAccountLazyQuery>;
export type AccountQueryResult = ApolloReactCommon.QueryResult<
  AccountQuery,
  AccountQueryVariables
>;
export const Security_updatePasswordDocument = gql`
  mutation Security_updatePassword($password: String!, $newPassword: String!) {
    changePassword(password: $password, newPassword: $newPassword)
  }
`;
export type Security_updatePasswordMutationFn = ApolloReactCommon.MutationFunction<
  Security_updatePasswordMutation,
  Security_updatePasswordMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    Security_updatePasswordMutation,
    Security_updatePasswordMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    Security_updatePasswordMutation,
    Security_updatePasswordMutationVariables
  >(Security_updatePasswordDocument, baseOptions);
}
export type Security_updatePasswordMutationHookResult = ReturnType<
  typeof useSecurity_updatePasswordMutation
>;
export type Security_updatePasswordMutationResult = ApolloReactCommon.MutationResult<
  Security_updatePasswordMutation
>;
export type Security_updatePasswordMutationOptions = ApolloReactCommon.BaseMutationOptions<
  Security_updatePasswordMutation,
  Security_updatePasswordMutationVariables
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
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    SecurityQuery,
    SecurityQueryVariables
  >
) {
  return ApolloReactHooks.useQuery<SecurityQuery, SecurityQueryVariables>(
    SecurityDocument,
    baseOptions
  );
}
export function useSecurityLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    SecurityQuery,
    SecurityQueryVariables
  >
) {
  return ApolloReactHooks.useLazyQuery<SecurityQuery, SecurityQueryVariables>(
    SecurityDocument,
    baseOptions
  );
}
export type SecurityQueryHookResult = ReturnType<typeof useSecurityQuery>;
export type SecurityLazyQueryHookResult = ReturnType<
  typeof useSecurityLazyQuery
>;
export type SecurityQueryResult = ApolloReactCommon.QueryResult<
  SecurityQuery,
  SecurityQueryVariables
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
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    CurrentUserQuery,
    CurrentUserQueryVariables
  >
) {
  return ApolloReactHooks.useQuery<CurrentUserQuery, CurrentUserQueryVariables>(
    CurrentUserDocument,
    baseOptions
  );
}
export function useCurrentUserLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    CurrentUserQuery,
    CurrentUserQueryVariables
  >
) {
  return ApolloReactHooks.useLazyQuery<
    CurrentUserQuery,
    CurrentUserQueryVariables
  >(CurrentUserDocument, baseOptions);
}
export type CurrentUserQueryHookResult = ReturnType<typeof useCurrentUserQuery>;
export type CurrentUserLazyQueryHookResult = ReturnType<
  typeof useCurrentUserLazyQuery
>;
export type CurrentUserQueryResult = ApolloReactCommon.QueryResult<
  CurrentUserQuery,
  CurrentUserQueryVariables
>;
export const RecipientView_publicDeletePetitionReplyDocument = gql`
  mutation RecipientView_publicDeletePetitionReply(
    $replyId: ID!
    $keycode: ID!
  ) {
    publicDeletePetitionReply(replyId: $replyId, keycode: $keycode)
  }
`;
export type RecipientView_publicDeletePetitionReplyMutationFn = ApolloReactCommon.MutationFunction<
  RecipientView_publicDeletePetitionReplyMutation,
  RecipientView_publicDeletePetitionReplyMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    RecipientView_publicDeletePetitionReplyMutation,
    RecipientView_publicDeletePetitionReplyMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    RecipientView_publicDeletePetitionReplyMutation,
    RecipientView_publicDeletePetitionReplyMutationVariables
  >(RecipientView_publicDeletePetitionReplyDocument, baseOptions);
}
export type RecipientView_publicDeletePetitionReplyMutationHookResult = ReturnType<
  typeof useRecipientView_publicDeletePetitionReplyMutation
>;
export type RecipientView_publicDeletePetitionReplyMutationResult = ApolloReactCommon.MutationResult<
  RecipientView_publicDeletePetitionReplyMutation
>;
export type RecipientView_publicDeletePetitionReplyMutationOptions = ApolloReactCommon.BaseMutationOptions<
  RecipientView_publicDeletePetitionReplyMutation,
  RecipientView_publicDeletePetitionReplyMutationVariables
>;
export const RecipientView_publicCreateTextReplyDocument = gql`
  mutation RecipientView_publicCreateTextReply(
    $keycode: ID!
    $fieldId: ID!
    $data: CreateTextReplyInput!
  ) {
    publicCreateTextReply(keycode: $keycode, fieldId: $fieldId, data: $data) {
      id
      publicContent
      createdAt
    }
  }
`;
export type RecipientView_publicCreateTextReplyMutationFn = ApolloReactCommon.MutationFunction<
  RecipientView_publicCreateTextReplyMutation,
  RecipientView_publicCreateTextReplyMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    RecipientView_publicCreateTextReplyMutation,
    RecipientView_publicCreateTextReplyMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    RecipientView_publicCreateTextReplyMutation,
    RecipientView_publicCreateTextReplyMutationVariables
  >(RecipientView_publicCreateTextReplyDocument, baseOptions);
}
export type RecipientView_publicCreateTextReplyMutationHookResult = ReturnType<
  typeof useRecipientView_publicCreateTextReplyMutation
>;
export type RecipientView_publicCreateTextReplyMutationResult = ApolloReactCommon.MutationResult<
  RecipientView_publicCreateTextReplyMutation
>;
export type RecipientView_publicCreateTextReplyMutationOptions = ApolloReactCommon.BaseMutationOptions<
  RecipientView_publicCreateTextReplyMutation,
  RecipientView_publicCreateTextReplyMutationVariables
>;
export const RecipientView_publicCreateFileUploadReplyDocument = gql`
  mutation RecipientView_publicCreateFileUploadReply(
    $keycode: ID!
    $fieldId: ID!
    $data: CreateFileUploadReplyInput!
  ) {
    publicCreateFileUploadReply(
      keycode: $keycode
      fieldId: $fieldId
      data: $data
    ) {
      endpoint
      reply {
        id
        publicContent
        createdAt
      }
    }
  }
`;
export type RecipientView_publicCreateFileUploadReplyMutationFn = ApolloReactCommon.MutationFunction<
  RecipientView_publicCreateFileUploadReplyMutation,
  RecipientView_publicCreateFileUploadReplyMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    RecipientView_publicCreateFileUploadReplyMutation,
    RecipientView_publicCreateFileUploadReplyMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    RecipientView_publicCreateFileUploadReplyMutation,
    RecipientView_publicCreateFileUploadReplyMutationVariables
  >(RecipientView_publicCreateFileUploadReplyDocument, baseOptions);
}
export type RecipientView_publicCreateFileUploadReplyMutationHookResult = ReturnType<
  typeof useRecipientView_publicCreateFileUploadReplyMutation
>;
export type RecipientView_publicCreateFileUploadReplyMutationResult = ApolloReactCommon.MutationResult<
  RecipientView_publicCreateFileUploadReplyMutation
>;
export type RecipientView_publicCreateFileUploadReplyMutationOptions = ApolloReactCommon.BaseMutationOptions<
  RecipientView_publicCreateFileUploadReplyMutation,
  RecipientView_publicCreateFileUploadReplyMutationVariables
>;
export const RecipientView_publicFileUploadReplyCompleteDocument = gql`
  mutation RecipientView_publicFileUploadReplyComplete(
    $keycode: ID!
    $replyId: ID!
  ) {
    publicFileUploadReplyComplete(keycode: $keycode, replyId: $replyId) {
      id
      publicContent
    }
  }
`;
export type RecipientView_publicFileUploadReplyCompleteMutationFn = ApolloReactCommon.MutationFunction<
  RecipientView_publicFileUploadReplyCompleteMutation,
  RecipientView_publicFileUploadReplyCompleteMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    RecipientView_publicFileUploadReplyCompleteMutation,
    RecipientView_publicFileUploadReplyCompleteMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    RecipientView_publicFileUploadReplyCompleteMutation,
    RecipientView_publicFileUploadReplyCompleteMutationVariables
  >(RecipientView_publicFileUploadReplyCompleteDocument, baseOptions);
}
export type RecipientView_publicFileUploadReplyCompleteMutationHookResult = ReturnType<
  typeof useRecipientView_publicFileUploadReplyCompleteMutation
>;
export type RecipientView_publicFileUploadReplyCompleteMutationResult = ApolloReactCommon.MutationResult<
  RecipientView_publicFileUploadReplyCompleteMutation
>;
export type RecipientView_publicFileUploadReplyCompleteMutationOptions = ApolloReactCommon.BaseMutationOptions<
  RecipientView_publicFileUploadReplyCompleteMutation,
  RecipientView_publicFileUploadReplyCompleteMutationVariables
>;
export const RecipientView_publicCompletePetitionDocument = gql`
  mutation RecipientView_publicCompletePetition($keycode: ID!) {
    publicCompletePetition(keycode: $keycode) {
      id
      status
    }
  }
`;
export type RecipientView_publicCompletePetitionMutationFn = ApolloReactCommon.MutationFunction<
  RecipientView_publicCompletePetitionMutation,
  RecipientView_publicCompletePetitionMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    RecipientView_publicCompletePetitionMutation,
    RecipientView_publicCompletePetitionMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    RecipientView_publicCompletePetitionMutation,
    RecipientView_publicCompletePetitionMutationVariables
  >(RecipientView_publicCompletePetitionDocument, baseOptions);
}
export type RecipientView_publicCompletePetitionMutationHookResult = ReturnType<
  typeof useRecipientView_publicCompletePetitionMutation
>;
export type RecipientView_publicCompletePetitionMutationResult = ApolloReactCommon.MutationResult<
  RecipientView_publicCompletePetitionMutation
>;
export type RecipientView_publicCompletePetitionMutationOptions = ApolloReactCommon.BaseMutationOptions<
  RecipientView_publicCompletePetitionMutation,
  RecipientView_publicCompletePetitionMutationVariables
>;
export const RecipientView_createPetitionFieldCommentDocument = gql`
  mutation RecipientView_createPetitionFieldComment(
    $keycode: ID!
    $petitionFieldId: ID!
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
export type RecipientView_createPetitionFieldCommentMutationFn = ApolloReactCommon.MutationFunction<
  RecipientView_createPetitionFieldCommentMutation,
  RecipientView_createPetitionFieldCommentMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    RecipientView_createPetitionFieldCommentMutation,
    RecipientView_createPetitionFieldCommentMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    RecipientView_createPetitionFieldCommentMutation,
    RecipientView_createPetitionFieldCommentMutationVariables
  >(RecipientView_createPetitionFieldCommentDocument, baseOptions);
}
export type RecipientView_createPetitionFieldCommentMutationHookResult = ReturnType<
  typeof useRecipientView_createPetitionFieldCommentMutation
>;
export type RecipientView_createPetitionFieldCommentMutationResult = ApolloReactCommon.MutationResult<
  RecipientView_createPetitionFieldCommentMutation
>;
export type RecipientView_createPetitionFieldCommentMutationOptions = ApolloReactCommon.BaseMutationOptions<
  RecipientView_createPetitionFieldCommentMutation,
  RecipientView_createPetitionFieldCommentMutationVariables
>;
export const RecipientView_updatePetitionFieldCommentDocument = gql`
  mutation RecipientView_updatePetitionFieldComment(
    $keycode: ID!
    $petitionFieldId: ID!
    $petitionFieldCommentId: ID!
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
export type RecipientView_updatePetitionFieldCommentMutationFn = ApolloReactCommon.MutationFunction<
  RecipientView_updatePetitionFieldCommentMutation,
  RecipientView_updatePetitionFieldCommentMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    RecipientView_updatePetitionFieldCommentMutation,
    RecipientView_updatePetitionFieldCommentMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    RecipientView_updatePetitionFieldCommentMutation,
    RecipientView_updatePetitionFieldCommentMutationVariables
  >(RecipientView_updatePetitionFieldCommentDocument, baseOptions);
}
export type RecipientView_updatePetitionFieldCommentMutationHookResult = ReturnType<
  typeof useRecipientView_updatePetitionFieldCommentMutation
>;
export type RecipientView_updatePetitionFieldCommentMutationResult = ApolloReactCommon.MutationResult<
  RecipientView_updatePetitionFieldCommentMutation
>;
export type RecipientView_updatePetitionFieldCommentMutationOptions = ApolloReactCommon.BaseMutationOptions<
  RecipientView_updatePetitionFieldCommentMutation,
  RecipientView_updatePetitionFieldCommentMutationVariables
>;
export const RecipientView_deletePetitionFieldCommentDocument = gql`
  mutation RecipientView_deletePetitionFieldComment(
    $keycode: ID!
    $petitionFieldId: ID!
    $petitionFieldCommentId: ID!
  ) {
    publicDeletePetitionFieldComment(
      keycode: $keycode
      petitionFieldId: $petitionFieldId
      petitionFieldCommentId: $petitionFieldCommentId
    )
  }
`;
export type RecipientView_deletePetitionFieldCommentMutationFn = ApolloReactCommon.MutationFunction<
  RecipientView_deletePetitionFieldCommentMutation,
  RecipientView_deletePetitionFieldCommentMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    RecipientView_deletePetitionFieldCommentMutation,
    RecipientView_deletePetitionFieldCommentMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    RecipientView_deletePetitionFieldCommentMutation,
    RecipientView_deletePetitionFieldCommentMutationVariables
  >(RecipientView_deletePetitionFieldCommentDocument, baseOptions);
}
export type RecipientView_deletePetitionFieldCommentMutationHookResult = ReturnType<
  typeof useRecipientView_deletePetitionFieldCommentMutation
>;
export type RecipientView_deletePetitionFieldCommentMutationResult = ApolloReactCommon.MutationResult<
  RecipientView_deletePetitionFieldCommentMutation
>;
export type RecipientView_deletePetitionFieldCommentMutationOptions = ApolloReactCommon.BaseMutationOptions<
  RecipientView_deletePetitionFieldCommentMutation,
  RecipientView_deletePetitionFieldCommentMutationVariables
>;
export const RecipientView_submitUnpublishedCommentsDocument = gql`
  mutation RecipientView_submitUnpublishedComments($keycode: ID!) {
    publicSubmitUnpublishedComments(keycode: $keycode) {
      id
      publishedAt
    }
  }
`;
export type RecipientView_submitUnpublishedCommentsMutationFn = ApolloReactCommon.MutationFunction<
  RecipientView_submitUnpublishedCommentsMutation,
  RecipientView_submitUnpublishedCommentsMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    RecipientView_submitUnpublishedCommentsMutation,
    RecipientView_submitUnpublishedCommentsMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    RecipientView_submitUnpublishedCommentsMutation,
    RecipientView_submitUnpublishedCommentsMutationVariables
  >(RecipientView_submitUnpublishedCommentsDocument, baseOptions);
}
export type RecipientView_submitUnpublishedCommentsMutationHookResult = ReturnType<
  typeof useRecipientView_submitUnpublishedCommentsMutation
>;
export type RecipientView_submitUnpublishedCommentsMutationResult = ApolloReactCommon.MutationResult<
  RecipientView_submitUnpublishedCommentsMutation
>;
export type RecipientView_submitUnpublishedCommentsMutationOptions = ApolloReactCommon.BaseMutationOptions<
  RecipientView_submitUnpublishedCommentsMutation,
  RecipientView_submitUnpublishedCommentsMutationVariables
>;
export const RecipientView_markPetitionFieldCommentsAsReadDocument = gql`
  mutation RecipientView_markPetitionFieldCommentsAsRead(
    $keycode: ID!
    $petitionFieldCommentIds: [ID!]!
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
export type RecipientView_markPetitionFieldCommentsAsReadMutationFn = ApolloReactCommon.MutationFunction<
  RecipientView_markPetitionFieldCommentsAsReadMutation,
  RecipientView_markPetitionFieldCommentsAsReadMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    RecipientView_markPetitionFieldCommentsAsReadMutation,
    RecipientView_markPetitionFieldCommentsAsReadMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    RecipientView_markPetitionFieldCommentsAsReadMutation,
    RecipientView_markPetitionFieldCommentsAsReadMutationVariables
  >(RecipientView_markPetitionFieldCommentsAsReadDocument, baseOptions);
}
export type RecipientView_markPetitionFieldCommentsAsReadMutationHookResult = ReturnType<
  typeof useRecipientView_markPetitionFieldCommentsAsReadMutation
>;
export type RecipientView_markPetitionFieldCommentsAsReadMutationResult = ApolloReactCommon.MutationResult<
  RecipientView_markPetitionFieldCommentsAsReadMutation
>;
export type RecipientView_markPetitionFieldCommentsAsReadMutationOptions = ApolloReactCommon.BaseMutationOptions<
  RecipientView_markPetitionFieldCommentsAsReadMutation,
  RecipientView_markPetitionFieldCommentsAsReadMutationVariables
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
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    PublicPetitionQuery,
    PublicPetitionQueryVariables
  >
) {
  return ApolloReactHooks.useQuery<
    PublicPetitionQuery,
    PublicPetitionQueryVariables
  >(PublicPetitionDocument, baseOptions);
}
export function usePublicPetitionLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    PublicPetitionQuery,
    PublicPetitionQueryVariables
  >
) {
  return ApolloReactHooks.useLazyQuery<
    PublicPetitionQuery,
    PublicPetitionQueryVariables
  >(PublicPetitionDocument, baseOptions);
}
export type PublicPetitionQueryHookResult = ReturnType<
  typeof usePublicPetitionQuery
>;
export type PublicPetitionLazyQueryHookResult = ReturnType<
  typeof usePublicPetitionLazyQuery
>;
export type PublicPetitionQueryResult = ApolloReactCommon.QueryResult<
  PublicPetitionQuery,
  PublicPetitionQueryVariables
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
export type useCreateContact_createContactMutationFn = ApolloReactCommon.MutationFunction<
  useCreateContact_createContactMutation,
  useCreateContact_createContactMutationVariables
>;

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
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    useCreateContact_createContactMutation,
    useCreateContact_createContactMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    useCreateContact_createContactMutation,
    useCreateContact_createContactMutationVariables
  >(useCreateContact_createContactDocument, baseOptions);
}
export type useCreateContact_createContactMutationHookResult = ReturnType<
  typeof useuseCreateContact_createContactMutation
>;
export type useCreateContact_createContactMutationResult = ApolloReactCommon.MutationResult<
  useCreateContact_createContactMutation
>;
export type useCreateContact_createContactMutationOptions = ApolloReactCommon.BaseMutationOptions<
  useCreateContact_createContactMutation,
  useCreateContact_createContactMutationVariables
>;
export const useCreatePetition_createPetitionDocument = gql`
  mutation useCreatePetition_createPetition(
    $name: String!
    $locale: PetitionLocale!
    $deadline: DateTime
  ) {
    createPetition(name: $name, locale: $locale, deadline: $deadline) {
      id
    }
  }
`;
export type useCreatePetition_createPetitionMutationFn = ApolloReactCommon.MutationFunction<
  useCreatePetition_createPetitionMutation,
  useCreatePetition_createPetitionMutationVariables
>;

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
 *      deadline: // value for 'deadline'
 *   },
 * });
 */
export function useuseCreatePetition_createPetitionMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    useCreatePetition_createPetitionMutation,
    useCreatePetition_createPetitionMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    useCreatePetition_createPetitionMutation,
    useCreatePetition_createPetitionMutationVariables
  >(useCreatePetition_createPetitionDocument, baseOptions);
}
export type useCreatePetition_createPetitionMutationHookResult = ReturnType<
  typeof useuseCreatePetition_createPetitionMutation
>;
export type useCreatePetition_createPetitionMutationResult = ApolloReactCommon.MutationResult<
  useCreatePetition_createPetitionMutation
>;
export type useCreatePetition_createPetitionMutationOptions = ApolloReactCommon.BaseMutationOptions<
  useCreatePetition_createPetitionMutation,
  useCreatePetition_createPetitionMutationVariables
>;
export const PetitionComposeSearchContactsDocument = gql`
  query PetitionComposeSearchContacts($search: String, $exclude: [ID!]) {
    contacts(limit: 10, search: $search, exclude: $exclude) {
      items {
        ...RecipientSelect_Contact
      }
    }
  }
  ${RecipientSelect_ContactFragmentDoc}
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
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    PetitionComposeSearchContactsQuery,
    PetitionComposeSearchContactsQueryVariables
  >
) {
  return ApolloReactHooks.useQuery<
    PetitionComposeSearchContactsQuery,
    PetitionComposeSearchContactsQueryVariables
  >(PetitionComposeSearchContactsDocument, baseOptions);
}
export function usePetitionComposeSearchContactsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    PetitionComposeSearchContactsQuery,
    PetitionComposeSearchContactsQueryVariables
  >
) {
  return ApolloReactHooks.useLazyQuery<
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
export type PetitionComposeSearchContactsQueryResult = ApolloReactCommon.QueryResult<
  PetitionComposeSearchContactsQuery,
  PetitionComposeSearchContactsQueryVariables
>;
