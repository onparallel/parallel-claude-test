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
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  user: Maybe<User>;
};

export type AccessDeactivatedEvent = PetitionEvent & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  user: Maybe<User>;
};

export type AccessDelegatedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  newAccess: PetitionAccess;
  originalAccess: PetitionAccess;
};

export type AccessOpenedEvent = PetitionEvent & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
};

export type ChangePasswordResult =
  | "INCORRECT_PASSWORD"
  | "INVALID_NEW_PASSWORD"
  | "SUCCESS";

export type CommentDeletedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  deletedBy: Maybe<UserOrPetitionAccess>;
  field: Maybe<PetitionField>;
  id: Scalars["GID"];
};

export type CommentPublishedEvent = PetitionEvent & {
  comment: Maybe<PetitionFieldComment>;
  createdAt: Scalars["DateTime"];
  field: Maybe<PetitionField>;
  id: Scalars["GID"];
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
  firstName: Maybe<Scalars["String"]>;
  /** The full name of the contact. */
  fullName: Maybe<Scalars["String"]>;
  /** The ID of the contact. */
  id: Scalars["GID"];
  /** The last name of the contact. */
  lastName: Maybe<Scalars["String"]>;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
};

/** A contact in the system. */
export type ContactaccessesArgs = {
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
};

export type ContactPagination = {
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
  /** Endpoint where to upload the file. */
  endpoint: Scalars["String"];
  reply: PublicPetitionFieldReply;
};

export type CreateFileUploadReplyInput = {
  contentType: Scalars["String"];
  filename: Scalars["String"];
  size: Scalars["Int"];
};

export type EntityType = "Contact" | "Organization" | "Petition" | "User";

export type FeatureFlag =
  | "HIDE_RECIPIENT_VIEW_CONTENTS"
  | "INTERNAL_COMMENTS"
  | "PETITION_PDF_EXPORT"
  | "PETITION_SIGNATURE"
  | "SKIP_FORWARD_SECURITY";

export type FileUploadReplyDownloadLinkResult = {
  result: Result;
  url: Maybe<Scalars["String"]>;
};

/** The types of integrations available. */
export type IntegrationType = "SIGNATURE";

export type MessageCancelledEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  message: PetitionMessage;
  user: Maybe<User>;
};

export type MessageScheduledEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  message: PetitionMessage;
};

export type MessageSentEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  message: PetitionMessage;
};

export type Mutation = {
  /** Adds permissions on given petitions and users */
  addPetitionUserPermission: Array<Petition>;
  /** Clones the petition and assigns the given user as owner and creator. */
  assignPetitionToUser: SupportMethodResponse;
  /** Cancels a scheduled petition message. */
  cancelScheduledMessage: Maybe<PetitionMessage>;
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
  /** Creates a new user in the same organization as the context user */
  createOrganizationUser: User;
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
  publicCheckVerificationCode: VerificationCodeCheck;
  /** Marks a filled petition as COMPLETED. If the petition requires signature, starts the signing. Otherwise sends email to user. */
  publicCompletePetition: PublicPetition;
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
  /** Sends a petition message to the specified contacts. */
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
  /** Transfers petition ownership to a given user. The original owner gets a WRITE permission on the petitions. */
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
  /** Updates user status and, if new status is INACTIVE, transfers their owned petitions to another user in the org. */
  updateUserStatus: Array<User>;
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

export type MutationcreateOrganizationUserArgs = {
  email: Scalars["String"];
  firstName: Scalars["String"];
  lastName: Scalars["String"];
  role: OrganizationRole;
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

export type MutationpublicCheckVerificationCodeArgs = {
  code: Scalars["String"];
  keycode: Scalars["ID"];
  token: Scalars["ID"];
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

export type MutationpublicCreateSimpleReplyArgs = {
  fieldId: Scalars["GID"];
  keycode: Scalars["ID"];
  reply: Scalars["String"];
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

export type MutationpublicUpdatePetitionFieldCommentArgs = {
  content: Scalars["String"];
  keycode: Scalars["ID"];
  petitionFieldCommentId: Scalars["GID"];
  petitionFieldId: Scalars["GID"];
};

export type MutationpublicUpdateSimpleReplyArgs = {
  keycode: Scalars["ID"];
  reply: Scalars["String"];
  replyId: Scalars["GID"];
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
  attachPdfExport: Scalars["Boolean"];
  emailBody: Scalars["JSON"];
  force?: Maybe<Scalars["Boolean"]>;
  pdfExportTitle?: Maybe<Scalars["String"]>;
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

export type MutationupdateUserStatusArgs = {
  status: UserStatus;
  transferToUserId?: Maybe<Scalars["GID"]>;
  userIds: Array<Scalars["GID"]>;
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
  | "PETITION_ACTIVITY"
  | "PETITION_COMPOSE"
  | "PETITION_REVIEW"
  | "PETITIONS_LIST";

export type OnboardingStatus = "FINISHED" | "SKIPPED";

/** An organization in the system. */
export type Organization = Timestamps & {
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
  logoUrl: Maybe<Scalars["String"]>;
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

export type OrgIntegration = {
  /** The name of the integration. */
  name: Scalars["String"];
  /** The provider used for this integration. */
  provider: Scalars["String"];
  /** The type of the integration. */
  type: IntegrationType;
};

export type OwnershipTransferredEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  owner: Maybe<User>;
  previousOwner: Maybe<User>;
  user: Maybe<User>;
};

/** A petition */
export type Petition = PetitionBase & {
  /** The accesses for this petition */
  accesses: Array<PetitionAccess>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The current signature request. */
  currentSignatureRequest: Maybe<PetitionSignatureRequest>;
  /** The deadline of the petition. */
  deadline: Maybe<Scalars["DateTime"]>;
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
  name: Maybe<Scalars["String"]>;
  organization: Organization;
  owner: User;
  /** The progress of the petition. */
  progress: PetitionProgress;
  /** The reminders configuration for the petition. */
  remindersConfig: Maybe<RemindersConfig>;
  /** The signature configuration for the petition. */
  signatureConfig: Maybe<SignatureConfig>;
  /** The list of signature requests. */
  signatureRequests: Maybe<Array<PetitionSignatureRequest>>;
  /** Whether to skip the forward security check on the recipient view. */
  skipForwardSecurity: Scalars["Boolean"];
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
  /** The contact of this access. */
  contact: Maybe<Contact>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The user who granted the access. */
  granter: Maybe<User>;
  /** The ID of the petition access. */
  id: Scalars["GID"];
  /** When the next reminder will be sent. */
  nextReminderAt: Maybe<Scalars["DateTime"]>;
  /** The petition for this message access. */
  petition: Maybe<Petition>;
  /** Number of reminders sent. */
  reminderCount: Scalars["Int"];
  /** Whether automatic reminders are active or not for this petition access */
  remindersActive: Scalars["Boolean"];
  /** The reminder settings of the petition. */
  remindersConfig: Maybe<RemindersConfig>;
  /** Number of reminders left. */
  remindersLeft: Scalars["Int"];
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

export type PetitionAndField = PetitionBaseAndField & {
  field: PetitionField;
  petition: Petition;
};

/** The petition and a subset of some of its fields. */
export type PetitionAndPartialFields = {
  fields: Array<PetitionField>;
  petition: Petition;
};

export type PetitionBase = {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The body of the petition. */
  emailBody: Maybe<Scalars["JSON"]>;
  /** The subject of the petition. */
  emailSubject: Maybe<Scalars["String"]>;
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
  name: Maybe<Scalars["String"]>;
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
  /** The requested slice of items. */
  items: Array<PetitionBase>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
};

export type PetitionBaseType = "PETITION" | "TEMPLATE";

export type PetitionClosedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  user: Maybe<User>;
};

export type PetitionClosedNotifiedEvent = PetitionEvent & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  user: Maybe<User>;
};

export type PetitionCompletedEvent = PetitionEvent & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
};

export type PetitionCreatedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  user: Maybe<User>;
};

export type PetitionEvent = {
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
};

export type PetitionEventPagination = {
  /** The requested slice of items. */
  items: Array<PetitionEvent>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
};

/** A field within a petition. */
export type PetitionField = {
  /** The comments for this field. */
  comments: Array<PetitionFieldComment>;
  /** The description of the petition field. */
  description: Maybe<Scalars["String"]>;
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
  title: Maybe<Scalars["String"]>;
  /** The type of the petition field. */
  type: PetitionFieldType;
  /** Determines if the content of this field has been validated. */
  validated: Scalars["Boolean"];
};

/** A comment on a petition field */
export type PetitionFieldComment = {
  /** The author of the comment. */
  author: Maybe<UserOrPetitionAccess>;
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
  publishedAt: Maybe<Scalars["DateTime"]>;
  /** The reply the comment is refering to. */
  reply: Maybe<PetitionFieldReply>;
};

/** A reply to a petition field */
export type PetitionFieldReply = Timestamps & {
  /** The access from where this reply was made. */
  access: PetitionAccess;
  /** The content of the reply. */
  content: Scalars["JSONObject"];
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The petition field for this reply. */
  field: Maybe<PetitionField>;
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
  /** The access of this petition message. */
  access: PetitionAccess;
  /** Tells when the email bounced. */
  bouncedAt: Maybe<Scalars["DateTime"]>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** Tells when the email was delivered. */
  deliveredAt: Maybe<Scalars["DateTime"]>;
  /** The body of the petition message. */
  emailBody: Maybe<Scalars["JSON"]>;
  /** The subject of the petition message. */
  emailSubject: Maybe<Scalars["JSON"]>;
  /** The ID of the petition message. */
  id: Scalars["GID"];
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
  /** The access of this petition message. */
  access: PetitionAccess;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  /** The sender of this petition message. */
  sender: Maybe<User>;
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
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  user: Maybe<User>;
};

export type PetitionSignatureCancelReason =
  | "CANCELLED_BY_USER"
  | "DECLINED_BY_SIGNER"
  | "REQUEST_ERROR";

export type PetitionSignatureRequest = Timestamps & {
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
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** Description of the template. */
  description: Maybe<Scalars["String"]>;
  /** The body of the petition. */
  emailBody: Maybe<Scalars["JSON"]>;
  /** The subject of the petition. */
  emailSubject: Maybe<Scalars["String"]>;
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
  name: Maybe<Scalars["String"]>;
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
  field: PetitionField;
  petition: PetitionTemplate;
};

export type PetitionTemplatePagination = {
  /** The requested slice of items. */
  items: Array<PetitionTemplate>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
};

/** The permission for a petition and user */
export type PetitionUserPermission = Timestamps & {
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
  field: PetitionField;
  petition: Petition;
  replies: Array<PetitionFieldReply>;
};

export type PublicAccessVerification = {
  cookieName: Maybe<Scalars["String"]>;
  cookieValue: Maybe<Scalars["String"]>;
  email: Maybe<Scalars["String"]>;
  isAllowed: Scalars["Boolean"];
  orgLogoUrl: Maybe<Scalars["String"]>;
  orgName: Maybe<Scalars["String"]>;
};

/** A public view of a contact */
export type PublicContact = {
  /** The email of the user. */
  email: Scalars["String"];
  /** The first name of the user. */
  firstName: Maybe<Scalars["String"]>;
  /** The full name of the user. */
  fullName: Maybe<Scalars["String"]>;
  /** The ID of the contact. */
  id: Scalars["GID"];
  /** The last name of the user. */
  lastName: Maybe<Scalars["String"]>;
};

/** A public view of an organization */
export type PublicOrganization = {
  /** The ID of the organization. */
  id: Scalars["GID"];
  /** The identifier of the organization. */
  identifier: Scalars["String"];
  /** The logo of the organization. */
  logoUrl: Maybe<Scalars["String"]>;
  /** The name of the organization. */
  name: Scalars["String"];
};

/** A public view of the petition */
export type PublicPetition = Timestamps & {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The deadline of the petition. */
  deadline: Maybe<Scalars["DateTime"]>;
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
  /** The signers of the petition */
  signers: Array<Maybe<PublicContact>>;
  /** The status of the petition. */
  status: PetitionStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
};

/** A public view of a petition access */
export type PublicPetitionAccess = {
  contact: Maybe<PublicContact>;
  granter: Maybe<PublicUser>;
  petition: Maybe<PublicPetition>;
};

/** A field within a petition. */
export type PublicPetitionField = {
  commentCount: Scalars["Int"];
  /** The comments for this field. */
  comments: Array<PublicPetitionFieldComment>;
  /** The description of the petition field. */
  description: Maybe<Scalars["String"]>;
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
  title: Maybe<Scalars["String"]>;
  /** The type of the petition field. */
  type: PetitionFieldType;
  unpublishedCommentCount: Scalars["Int"];
  unreadCommentCount: Scalars["Int"];
  /** Determines if the content of this field has been validated. */
  validated: Scalars["Boolean"];
};

/** A comment on a petition field */
export type PublicPetitionFieldComment = {
  /** The author of the comment. */
  author: Maybe<PublicUserOrContact>;
  /** The content of the comment. */
  content: Scalars["String"];
  /** The ID of the petition field comment. */
  id: Scalars["GID"];
  /** Whether the comment has been read or not. */
  isUnread: Scalars["Boolean"];
  /** Time when the comment was published. */
  publishedAt: Maybe<Scalars["DateTime"]>;
  /** The reply the comment is refering to. */
  reply: Maybe<PublicPetitionFieldReply>;
};

/** A reply to a petition field */
export type PublicPetitionFieldReply = Timestamps & {
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
  /** The email of the user. */
  email: Scalars["String"];
  /** The first name of the user. */
  firstName: Maybe<Scalars["String"]>;
  /** The full name of the user. */
  fullName: Maybe<Scalars["String"]>;
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
  /** Checks if the provided email is available to be registered as a user on Parallel */
  emailIsAvailable: Scalars["Boolean"];
  /** Decodes the given Global ID into an entity in the database. */
  globalIdDecode: SupportMethodResponse;
  /** Encodes the given ID into a Global ID. */
  globalIdEncode: SupportMethodResponse;
  me: User;
  organization: Maybe<Organization>;
  /** The organizations registered in Parallel. */
  organizations: OrganizationPagination;
  petition: Maybe<PetitionBase>;
  petitionAuthToken: Maybe<Petition>;
  /** The comments for this field. */
  petitionFieldComments: Array<PublicPetitionFieldComment>;
  /** The petitions of the user */
  petitions: PetitionBasePagination;
  publicOrgLogoUrl: Maybe<Scalars["String"]>;
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

export type ReminderSentEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  reminder: PetitionReminder;
};

export type ReplyCreatedEvent = PetitionEvent & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  field: Maybe<PetitionField>;
  id: Scalars["GID"];
  reply: Maybe<PetitionFieldReply>;
};

export type ReplyDeletedEvent = PetitionEvent & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  field: Maybe<PetitionField>;
  id: Scalars["GID"];
};

export type ReplyUpdatedEvent = PetitionEvent & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"];
  field: Maybe<PetitionField>;
  id: Scalars["GID"];
  reply: Maybe<PetitionFieldReply>;
};

/** Represents the result of an operation. */
export type Result = "FAILURE" | "SUCCESS";

export type SendPetitionResult = {
  accesses: Maybe<Array<PetitionAccess>>;
  petition: Maybe<Petition>;
  result: Result;
};

export type SignatureCancelledEvent = PetitionEvent & {
  cancellerReason: Maybe<Scalars["String"]>;
  cancelType: PetitionSignatureCancelReason;
  contact: Maybe<Contact>;
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  user: Maybe<User>;
};

export type SignatureCompletedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
};

/** The signature settings of a petition */
export type SignatureConfig = {
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
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
};

/** Return type for all support methods */
export type SupportMethodResponse = {
  message: Maybe<Scalars["String"]>;
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
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The email of the user. */
  email: Scalars["String"];
  /** The first name of the user. */
  firstName: Maybe<Scalars["String"]>;
  /** The full name of the user. */
  fullName: Maybe<Scalars["String"]>;
  hasFeatureFlag: Scalars["Boolean"];
  /** The ID of the user. */
  id: Scalars["GID"];
  isSuperAdmin: Scalars["Boolean"];
  lastActiveAt: Maybe<Scalars["DateTime"]>;
  /** The last name of the user. */
  lastName: Maybe<Scalars["String"]>;
  /** The onboarding status for the different views of the app. */
  onboardingStatus: Scalars["JSONObject"];
  organization: Organization;
  role: OrganizationRole;
  status: UserStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
};

/** A user in the system. */
export type UserhasFeatureFlagArgs = {
  featureFlag: FeatureFlag;
};

export type UserOrPetitionAccess = PetitionAccess | User;

export type UserPagination = {
  /** The requested slice of items. */
  items: Array<User>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
};

export type UserPermissionAddedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  permissionType: PetitionUserPermissionType;
  permissionUser: Maybe<User>;
  user: Maybe<User>;
};

export type UserPermissionEditedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  permissionType: PetitionUserPermissionType;
  permissionUser: Maybe<User>;
  user: Maybe<User>;
};

export type UserPermissionRemovedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"];
  id: Scalars["GID"];
  permissionUser: Maybe<User>;
  user: Maybe<User>;
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

export type PetitionFragment = Pick<Petition, "id" | "name" | "createdAt">;

export type petitionsQueryVariables = Exact<{
  offset: Scalars["Int"];
  limit: Scalars["Int"];
  sortBy?: Maybe<Array<QueryPetitions_OrderBy> | QueryPetitions_OrderBy>;
}>;

export type petitionsQuery = {
  petitions: Pick<PetitionBasePagination, "totalCount"> & {
    items: Array<PetitionFragment>;
  };
};

export type petitionQueryVariables = Exact<{
  petitionId: Scalars["GID"];
}>;

export type petitionQuery = { petition: Maybe<PetitionFragment> };
