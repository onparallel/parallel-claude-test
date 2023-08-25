import { Duration } from "date-fns";
import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
import gql from "graphql-tag";
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = {
  [_ in K]?: never;
};
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  /** A date string, such as 2007-12-03, compliant with the `full-date` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  Date: { input: string; output: string };
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: { input: string; output: string };
  Duration: { input: Duration; output: Duration };
  GID: { input: string; output: string };
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any };
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: { input: { [key: string]: any }; output: { [key: string]: any } };
  LocalizableUserText: {
    input: { [locale in UserLocale]?: string };
    output: { [locale in UserLocale]?: string };
  };
  /** The `Upload` scalar type represents a file upload. */
  Upload: { input: any; output: any };
};

/** JSON with AWS S3 url and required form data to make a POST request */
export type AWSPresignedPostData = {
  fields: Scalars["JSONObject"]["output"];
  url: Scalars["String"]["output"];
};

export type AccessActivatedEvent = PetitionEvent & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type AccessActivatedFromPublicPetitionLinkEvent = PetitionEvent & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type AccessActivatedFromPublicPetitionLinkUserNotification = PetitionUserNotification & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  isRead: Scalars["Boolean"]["output"];
  petition: PetitionBase;
};

export type AccessDeactivatedEvent = PetitionEvent & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<Petition>;
  reason: Scalars["String"]["output"];
  type: PetitionEventType;
  user: Maybe<User>;
};

export type AccessDelegatedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  newAccess: PetitionAccess;
  originalAccess: PetitionAccess;
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type AccessOpenedEvent = PetitionEvent & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type AsyncFieldCompletionResponse = {
  type: Scalars["String"]["output"];
  url: Scalars["String"]["output"];
};

export type BulkCreateContactsReturnType = {
  contacts: Array<Contact>;
  errors: Maybe<Array<Scalars["JSON"]["output"]>>;
};

export type BulkSendSigningMode =
  /** Allow configured signer(s) to sign every petition on the batch */
  | "COPY_SIGNATURE_SETTINGS"
  /** Disable eSignature on every petition of this batch. */
  | "DISABLE_SIGNATURE"
  /** Let recipients of each group to choose who will sign the petitions. */
  | "LET_RECIPIENT_CHOOSE";

export type ChangePasswordResult =
  | "INCORRECT_PASSWORD"
  | "INVALID_NEW_PASSWORD"
  | "LIMIT_EXCEEDED"
  | "SUCCESS";

export type CommentCreatedUserNotification = PetitionUserNotification & {
  comment: PetitionFieldComment;
  createdAt: Scalars["DateTime"]["output"];
  field: PetitionField;
  id: Scalars["GID"]["output"];
  isMention: Scalars["Boolean"]["output"];
  isRead: Scalars["Boolean"]["output"];
  petition: PetitionBase;
};

export type CommentDeletedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  deletedBy: Maybe<UserOrPetitionAccess>;
  field: Maybe<PetitionField>;
  id: Scalars["GID"]["output"];
  isInternal: Scalars["Boolean"]["output"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type CommentPublishedEvent = PetitionEvent & {
  comment: Maybe<PetitionFieldComment>;
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  field: Maybe<PetitionField>;
  id: Scalars["GID"]["output"];
  isInternal: Scalars["Boolean"]["output"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

/** Information from the connection. */
export type ConnectionMetadata = {
  browserName: Maybe<Scalars["String"]["output"]>;
  browserVersion: Maybe<Scalars["String"]["output"]>;
  country: Maybe<Scalars["String"]["output"]>;
  ip: Maybe<Scalars["String"]["output"]>;
};

/** A contact in the system. */
export type Contact = Timestamps & {
  /** The petition accesses for this contact */
  accesses: PetitionAccessPagination;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  /** The email of the contact. */
  email: Scalars["String"]["output"];
  /** The first name of the contact. */
  firstName: Scalars["String"]["output"];
  /** The full name of the contact. */
  fullName: Scalars["String"]["output"];
  hasBouncedEmail: Scalars["Boolean"]["output"];
  /** The ID of the contact. */
  id: Scalars["GID"]["output"];
  /** The last name of the contact. */
  lastName: Maybe<Scalars["String"]["output"]>;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
};

/** A contact in the system. */
export type ContactaccessesArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ContactPagination = {
  /** The requested slice of items. */
  items: Array<Contact>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type CreateContactInput = {
  email: Scalars["String"]["input"];
  firstName: Scalars["String"]["input"];
  lastName?: InputMaybe<Scalars["String"]["input"]>;
};

export type CreatePetitionFieldReplyInput = {
  content?: InputMaybe<Scalars["JSON"]["input"]>;
  id: Scalars["GID"]["input"];
};

export type CreateProfileTypeFieldInput = {
  alias?: InputMaybe<Scalars["String"]["input"]>;
  expiryAlertAheadTime?: InputMaybe<Scalars["Duration"]["input"]>;
  isExpirable?: InputMaybe<Scalars["Boolean"]["input"]>;
  name: Scalars["LocalizableUserText"]["input"];
  options?: InputMaybe<Scalars["JSONObject"]["input"]>;
  type: ProfileTypeFieldType;
};

export type CreatedAt = {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
};

export type DowJonesKycEntityDate = {
  day: Maybe<Scalars["Int"]["output"]>;
  month: Maybe<Scalars["Int"]["output"]>;
  year: Maybe<Scalars["Int"]["output"]>;
};

export type DowJonesKycEntityPlace = {
  countryCode: Scalars["String"]["output"];
  descriptor: Scalars["String"]["output"];
};

export type DowJonesKycEntityProfileResult = {
  iconHints: Array<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  profileId: Scalars["ID"]["output"];
  relationships: Array<DowJonesKycEntityRelationship>;
  sanctions: Array<DowJonesKycEntitySanction>;
  type: DowJonesKycEntityType;
  updatedAt: Scalars["DateTime"]["output"];
};

export type DowJonesKycEntityProfileResultEntity = DowJonesKycEntityProfileResult & {
  dateOfRegistration: Maybe<DowJonesKycEntityDate>;
  iconHints: Array<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  profileId: Scalars["ID"]["output"];
  relationships: Array<DowJonesKycEntityRelationship>;
  sanctions: Array<DowJonesKycEntitySanction>;
  type: DowJonesKycEntityType;
  updatedAt: Scalars["DateTime"]["output"];
};

export type DowJonesKycEntityProfileResultPerson = DowJonesKycEntityProfileResult & {
  citizenship: Maybe<DowJonesKycEntityPlace>;
  dateOfBirth: Maybe<DowJonesKycEntityDate>;
  iconHints: Array<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  isDeceased: Scalars["Boolean"]["output"];
  jurisdiction: Maybe<DowJonesKycEntityPlace>;
  name: Scalars["String"]["output"];
  placeOfBirth: Maybe<DowJonesKycEntityPlace>;
  profileId: Scalars["ID"]["output"];
  relationships: Array<DowJonesKycEntityRelationship>;
  residence: Maybe<DowJonesKycEntityPlace>;
  sanctions: Array<DowJonesKycEntitySanction>;
  type: DowJonesKycEntityType;
  updatedAt: Scalars["DateTime"]["output"];
};

export type DowJonesKycEntityRelationship = {
  connectionType: Scalars["String"]["output"];
  iconHints: Array<Scalars["String"]["output"]>;
  name: Maybe<Scalars["String"]["output"]>;
  profileId: Scalars["ID"]["output"];
  type: DowJonesKycEntityType;
};

export type DowJonesKycEntitySanction = {
  fromDate: Maybe<DowJonesKycEntityDate>;
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  sources: Array<Scalars["String"]["output"]>;
};

export type DowJonesKycEntitySearchResult = {
  countryTerritoryName: Maybe<Scalars["String"]["output"]>;
  iconHints: Array<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  isSubsidiary: Scalars["Boolean"]["output"];
  name: Scalars["String"]["output"];
  profileId: Scalars["ID"]["output"];
  title: Scalars["String"]["output"];
  type: DowJonesKycEntityType;
};

export type DowJonesKycEntitySearchResultEntity = DowJonesKycEntitySearchResult & {
  countryTerritoryName: Maybe<Scalars["String"]["output"]>;
  iconHints: Array<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  isSubsidiary: Scalars["Boolean"]["output"];
  name: Scalars["String"]["output"];
  profileId: Scalars["ID"]["output"];
  title: Scalars["String"]["output"];
  type: DowJonesKycEntityType;
};

export type DowJonesKycEntitySearchResultPagination = {
  /** The requested slice of items. */
  items: Array<DowJonesKycEntitySearchResult>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type DowJonesKycEntitySearchResultPerson = DowJonesKycEntitySearchResult & {
  countryTerritoryName: Maybe<Scalars["String"]["output"]>;
  dateOfBirth: Maybe<DowJonesKycEntityDate>;
  gender: Scalars["String"]["output"];
  iconHints: Array<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  isSubsidiary: Scalars["Boolean"]["output"];
  name: Scalars["String"]["output"];
  profileId: Scalars["ID"]["output"];
  title: Scalars["String"]["output"];
  type: DowJonesKycEntityType;
};

export type DowJonesKycEntityType = "Entity" | "Person";

/** The effective permission for a petition and user */
export type EffectivePetitionUserPermission = {
  /** wether user is subscribed or not to emails and alerts of the petition */
  isSubscribed: Scalars["Boolean"]["output"];
  /** The type of the permission. */
  permissionType: PetitionPermissionType;
  user: User;
};

export type EventSubscriptionSignatureKey = {
  id: Scalars["GID"]["output"];
  publicKey: Scalars["String"]["output"];
};

export type FeatureFlag =
  | "AUTO_ANONYMIZE"
  | "CLIENT_PORTAL"
  | "COPY_PETITION_REPLIES"
  | "CUSTOM_HOST_UI"
  | "DEVELOPER_ACCESS"
  | "DOCUSIGN_SANDBOX_PROVIDER"
  | "DOW_JONES_KYC"
  | "ES_TAX_DOCUMENTS_FIELD"
  | "EXPORT_CUATRECASAS"
  | "GHOST_LOGIN"
  | "HIDE_RECIPIENT_VIEW_CONTENTS"
  | "ON_BEHALF_OF"
  | "PERMISSION_MANAGEMENT"
  | "PETITION_ACCESS_RECIPIENT_URL_FIELD"
  | "PETITION_SIGNATURE"
  | "PROFILES"
  | "PUBLIC_PETITION_LINK_PREFILL_DATA"
  | "PUBLIC_PETITION_LINK_PREFILL_SECRET_UI"
  | "REMOVE_PARALLEL_BRANDING"
  | "REMOVE_WHY_WE_USE_PARALLEL"
  | "SKIP_FORWARD_SECURITY"
  | "TEMPLATE_REPLIES_PREVIEW_URL";

/** A feature flag name with his value */
export type FeatureFlagNameValue = {
  name: FeatureFlag;
  value: Scalars["Boolean"]["output"];
};

export type FileUpload = {
  contentType: Scalars["String"]["output"];
  filename: Scalars["String"]["output"];
  isComplete: Scalars["Boolean"]["output"];
  size: Scalars["Int"]["output"];
};

export type FileUploadDownloadLinkResult = {
  file: Maybe<FileUpload>;
  result: Result;
  url: Maybe<Scalars["String"]["output"]>;
};

export type FileUploadInput = {
  contentType: Scalars["String"]["input"];
  filename: Scalars["String"]["input"];
  size: Scalars["Int"]["input"];
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

export type FoldersInput = {
  folderIds: Array<Scalars["ID"]["input"]>;
  type: PetitionBaseType;
};

export type GenerateUserAuthTokenResponse = {
  apiKey: Scalars["String"]["output"];
  userAuthToken: UserAuthenticationToken;
};

export type GroupPermissionAddedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  permissionGroup: Maybe<UserGroup>;
  permissionType: PetitionPermissionType;
  petition: Maybe<Petition>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type GroupPermissionEditedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  permissionGroup: Maybe<UserGroup>;
  permissionType: PetitionPermissionType;
  petition: Maybe<Petition>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type GroupPermissionRemovedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  permissionGroup: Maybe<UserGroup>;
  petition: Maybe<Petition>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type IOrgIntegration = {
  id: Scalars["GID"]["output"];
  invalidCredentials: Scalars["Boolean"]["output"];
  /** Wether this integration is the default to be used if the user has more than one of the same type */
  isDefault: Scalars["Boolean"]["output"];
  /** Custom name of this integration, provided by the user */
  name: Scalars["String"]["output"];
  /** The type of the integration. */
  type: IntegrationType;
};

export type IOrgIntegrationPagination = {
  /** The requested slice of items. */
  items: Array<IOrgIntegration>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type ImageOptions = {
  resize?: InputMaybe<ImageOptionsResize>;
};

export type ImageOptionsResize = {
  fit?: InputMaybe<ImageOptionsResizeFit>;
  height?: InputMaybe<Scalars["Int"]["input"]>;
  width?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ImageOptionsResizeFit = "contain" | "cover" | "fill" | "inside" | "outside";

/** A feature flag name with his value */
export type InputFeatureFlagNameValue = {
  name: FeatureFlag;
  value: Scalars["Boolean"]["input"];
};

/** The types of integrations available. */
export type IntegrationType = "DOW_JONES_KYC" | "SIGNATURE" | "SSO" | "USER_PROVISIONING";

/** A public template on landing page */
export type LandingTemplate = {
  backgroundColor: Maybe<Scalars["String"]["output"]>;
  categories: Maybe<Array<Scalars["String"]["output"]>>;
  descriptionHtml: Maybe<Scalars["String"]["output"]>;
  fieldCount: Scalars["Int"]["output"];
  fields: Array<LandingTemplateField>;
  hasConditionals: Scalars["Boolean"]["output"];
  id: Scalars["GID"]["output"];
  imageUrl: Maybe<Scalars["String"]["output"]>;
  locale: PetitionLocale;
  name: Maybe<Scalars["String"]["output"]>;
  organizationName: Scalars["String"]["output"];
  ownerAvatarUrl: Maybe<Scalars["String"]["output"]>;
  ownerFullName: Scalars["String"]["output"];
  publicLinkUrl: Maybe<Scalars["String"]["output"]>;
  shortDescription: Maybe<Scalars["String"]["output"]>;
  slug: Scalars["String"]["output"];
  updatedAt: Scalars["DateTime"]["output"];
};

/** A public template on landing page */
export type LandingTemplateimageUrlArgs = {
  small?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type LandingTemplateCategorySample = {
  category: Scalars["String"]["output"];
  templates: LandingTemplatePagination;
};

export type LandingTemplateCategorySampletemplatesArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  locale: PetitionLocale;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

/** A public template field */
export type LandingTemplateField = {
  id: Scalars["GID"]["output"];
  title: Maybe<Scalars["String"]["output"]>;
  type: PetitionFieldType;
};

export type LandingTemplatePagination = {
  /** The requested slice of items. */
  items: Array<LandingTemplate>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type MessageCancelledEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  message: PetitionMessage;
  petition: Maybe<Petition>;
  reason: Scalars["String"]["output"];
  type: PetitionEventType;
  user: Maybe<User>;
};

export type MessageEmailBouncedUserNotification = PetitionUserNotification & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  isRead: Scalars["Boolean"]["output"];
  petition: PetitionBase;
};

export type MessageScheduledEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  message: PetitionMessage;
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type MessageSentEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  message: PetitionMessage;
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type Mutation = {
  /** set user status to ACTIVE. */
  activateUser: Array<User>;
  /** Adds permissions on given parallel and users */
  addPetitionPermission: Array<PetitionBase>;
  /** Add users to a user group */
  addUsersToUserGroup: UserGroup;
  /** Anonymizes a petition */
  anonymizePetition: SupportMethodResponse;
  /** Updates the status of a PENDING petition field replies to APPROVED or REJECTED */
  approveOrRejectPetitionFieldReplies: Petition;
  archiveProfileType: Array<ProfileType>;
  /** Associates a profile to a petition */
  associateProfileToPetition: PetitionProfile;
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
  cloneProfileType: ProfileType;
  /** Clones the user groups with all its members */
  cloneUserGroups: Array<UserGroup>;
  /** Closes an open petition. */
  closePetition: Petition;
  /** Closes a profile that is in OPEN or DELETION_SCHEDULED status */
  closeProfile: Array<Profile>;
  /**
   * Marks a petition as COMPLETED.
   * If the petition has a signature configured and does not require a review, starts the signing process.
   */
  completePetition: Petition;
  copyFileReplyToProfileFieldFile: Array<ProfileFieldFile>;
  /** Create a contact. */
  createContact: Contact;
  /** Creates a new Dow Jones KYC integration on the user's organization */
  createDowJonesKycIntegration: OrgIntegration;
  /** Creates a reply for a DOW_JONES_KYC_FIELD, obtaining profile info and PDF document */
  createDowJonesKycReply: PetitionFieldReply;
  /** Creates a task for downloading a PDF file with the profile of an entity in DowJones */
  createDowJonesProfileDownloadTask: Task;
  /** Creates an event subscription for the user's petitions */
  createEventSubscription: PetitionEventSubscription;
  /** Creates a pair of asymmetric keys to be used for signing webhook events */
  createEventSubscriptionSignatureKey: EventSubscriptionSignatureKey;
  /** Creates a task for exporting an xlsx file with petition text replies and sends it to the queue */
  createExportExcelTask: Task;
  /** Creates a task for exporting a ZIP file with petition replies and sends it to the queue */
  createExportRepliesTask: Task;
  /** Creates a reply to a file upload field. */
  createFileUploadReply: FileUploadReplyResponse;
  /** Notifies the backend that the upload is complete. */
  createFileUploadReplyComplete: PetitionFieldReply;
  /** Creates a new organization. Sends email to owner ONLY if it's not registered in any other organization. */
  createOrganization: Organization;
  /** Creates a new PDF_DOCUMENT theme on the user's organization */
  createOrganizationPdfDocumentTheme: Organization;
  /** Create parallel. */
  createPetition: PetitionBase;
  /** Creates a contactless petition access */
  createPetitionAccess: PetitionAccess;
  /** Generates and returns a signed url to upload a petition attachment to AWS S3 */
  createPetitionAttachmentUploadLink: Array<PetitionAttachmentUploadData>;
  /** Creates a petition field */
  createPetitionField: PetitionField;
  /** Generates and returns a signed url to upload a field attachment to AWS S3 */
  createPetitionFieldAttachmentUploadLink: PetitionFieldAttachmentUploadData;
  /** Create a petition field comment. */
  createPetitionFieldComment: PetitionFieldComment;
  /** Creates multiple replies for a petition at once */
  createPetitionFieldReplies: Array<PetitionFieldReply>;
  /**
   * Creates a reply on a petition field
   * @deprecated use createPetitionFieldReplies
   */
  createPetitionFieldReply: PetitionFieldReply;
  /** Creates a view with custom filters and ordering on the user's petitions list */
  createPetitionListView: PetitionListView;
  /** Creates a task for printing a PDF of the petition and sends it to the queue */
  createPrintPdfTask: Task;
  createProfile: Profile;
  createProfileFieldFileUploadLink: ProfileFieldPropertyAndFileWithUploadData;
  createProfileType: ProfileType;
  createProfileTypeField: ProfileTypeField;
  /** Creates a public link from a user's template */
  createPublicPetitionLink: PublicPetitionLink;
  /** Creates prefill information to be used on public petition links. Returns the URL to be used for creation and prefill of the petition. */
  createPublicPetitionLinkPrefillData: Scalars["String"]["output"];
  /** Creates a new Signaturit integration on the user's organization */
  createSignaturitIntegration: SignatureOrgIntegration;
  /** Creates a tag in the user's organization */
  createTag: Tag;
  /** Creates a task for exporting a report grouping the replies of every petition coming from the same template */
  createTemplateRepliesReportTask: Task;
  /** Creates a task for generating a JSON report of the template usage */
  createTemplateStatsReportTask: Task;
  /** Creates a task for generating an overview report of logged user's templates */
  createTemplatesOverviewReportTask: Task;
  /** Creates a group in the user's organization */
  createUserGroup: UserGroup;
  /** Deactivates the specified active petition accesses. */
  deactivateAccesses: Array<PetitionAccess>;
  /** Updates user status to INACTIVE and transfers their owned petitions to another user in the org. */
  deactivateUser: Array<User>;
  /** Delete contacts. */
  deleteContacts: Result;
  /** Removes the DOW JONES integration of the user's organization */
  deleteDowJonesKycIntegration: Organization;
  /** Deletes a subscription signature key */
  deleteEventSubscriptionSignatureKeys: Result;
  /** Deletes event subscriptions */
  deleteEventSubscriptions: Result;
  deleteOrganizationPdfDocumentTheme: Organization;
  /** Remove a petition attachment */
  deletePetitionAttachment: PetitionBase;
  /** Deletes a petition field. */
  deletePetitionField: PetitionBase;
  /** Remove a petition field attachment */
  deletePetitionFieldAttachment: PetitionField;
  /** Delete a petition field comment. */
  deletePetitionFieldComment: PetitionField;
  /** Deletes a petition list view of the user */
  deletePetitionListView: User;
  /** Deletes a reply to a petition field. */
  deletePetitionReply: PetitionField;
  /** Delete petitions and folders. */
  deletePetitions: Success;
  /** Permanently deletes the profile */
  deleteProfile: Success;
  deleteProfileFieldFile: Result;
  deleteProfileType: Success;
  deleteProfileTypeField: ProfileType;
  /** Deletes a signature integration of the user's org. If there are pending signature requests using this integration, you must pass force argument to delete and cancel requests */
  deleteSignatureIntegration: Result;
  /** Removes the tag from every petition and soft-deletes it */
  deleteTag: Result;
  /** Deletes a group */
  deleteUserGroup: Result;
  /** Disassociates a petition from a profile */
  disassociatePetitionFromProfile: Success;
  /** Disassociates a profile from a petition */
  disassociateProfileFromPetition: Success;
  /** generates a signed download link for the xlsx file containing the listings of a dynamic select field */
  dynamicSelectFieldFileDownloadLink: FileUploadDownloadLinkResult;
  /** Edits permissions on given parallel and users */
  editPetitionPermission: Array<PetitionBase>;
  /** Generates a download link for a file reply. */
  fileUploadReplyDownloadLink: FileUploadDownloadLinkResult;
  /** Forces an update of the branding of every signature integration of the selected organization. */
  forceUpdateSignatureOrganizationBrandings: SupportMethodResponse;
  /** Generates a new API token for the context user */
  generateUserAuthToken: GenerateUserAuthTokenResponse;
  /** Returns an object with signed download url and filename for tasks with file output */
  getTaskResultFile: TaskResultFile;
  /** Imports a petition from a JSON file */
  importPetitionFromJson: SupportMethodResponse;
  /** Creates a new user in the same organization as the context user if `orgId` is not provided */
  inviteUserToOrganization: User;
  loginAs: Result;
  /** Sets the default petition list view of the user. If passing null id, default view will be set (no filters/sorting) */
  markPetitionListViewAsDefault: User;
  /** marks a Signature integration as default */
  markSignatureIntegrationAsDefault: IOrgIntegration;
  /** Updates the limit of the current usage limit of a given organization */
  modifyCurrentUsagePeriod: Organization;
  /** Adds, edits or deletes a custom property on the petition */
  modifyPetitionCustomProperty: PetitionBase;
  /** Moves a group of petitions or folders to another folder. */
  movePetitions: Success;
  /** Generates a download link for a petition attachment */
  petitionAttachmentDownloadLink: FileUploadDownloadLinkResult;
  /** Tells the backend that the petition attachment was correctly uploaded to S3 */
  petitionAttachmentUploadComplete: PetitionAttachment;
  /** Generates a download link for a field attachment */
  petitionFieldAttachmentDownloadLink: FileUploadDownloadLinkResult;
  /** Tells the backend that the field attachment was correctly uploaded to S3 */
  petitionFieldAttachmentUploadComplete: PetitionFieldAttachment;
  /** Generates a download link for a profile field file */
  profileFieldFileDownloadLink: FileUploadDownloadLinkResult;
  profileFieldFileUploadComplete: Array<ProfileFieldFile>;
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
  /** Creates replies on a petition field as recipient. */
  publicCreatePetitionFieldReplies: Array<PublicPetitionFieldReply>;
  /**
   * Creates a reply on a petition field as recipient.
   * @deprecated use publicCreatePetitionFieldReplies
   */
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
  publicGetTaskResultFileUrl: Scalars["String"]["output"];
  /** Marks the specified comments as read. */
  publicMarkPetitionFieldCommentsAsRead: Array<PublicPetitionFieldComment>;
  /** Generates a download link for a field attachment on a public context. */
  publicPetitionFieldAttachmentDownloadLink: FileUploadDownloadLinkResult;
  /** Cancel a reminder for a contact. */
  publicRemindersOptOut: Result;
  /** Resets the user password and resend the Invitation email. Only works if cognito user has status FORCE_CHANGE_PASSWORD */
  publicResetTempPassword: Result;
  /** Sends an access reminder for a contact that is trying to open a petition through a contactless access but already has another active access */
  publicSendReminder: Result;
  publicSendVerificationCode: VerificationCodeRequest;
  /** Starts the completion of an async field */
  publicStartAsyncFieldCompletion: AsyncFieldCompletionResponse;
  /** Update a petition field comment. */
  publicUpdatePetitionFieldComment: PublicPetitionFieldComment;
  /** Updates replies on a petition field as recipient. */
  publicUpdatePetitionFieldReplies: Array<PublicPetitionFieldReply>;
  /**
   * Creates a reply on a petition field as recipient.
   * @deprecated use publicUpdatePetitionFieldReplies
   */
  publicUpdatePetitionFieldReply: PublicPetitionFieldReply;
  /** Reactivates the specified inactive petition accesses. */
  reactivateAccesses: Array<PetitionAccess>;
  /** Removes the password on a petition or template */
  removePetitionPassword: SupportMethodResponse;
  /** Removes permissions on given parallel and users */
  removePetitionPermission: Array<Maybe<PetitionBase>>;
  /** Removes users from a user group */
  removeUsersFromGroup: UserGroup;
  /** Renames a folder. */
  renameFolder: Success;
  /** Reopens the petition */
  reopenPetition: Petition;
  /** Reopens a profile that is in CLOSED or DELETION_SCHEDULED status */
  reopenProfile: Array<Profile>;
  /** Reorders the positions of attachments in the petition */
  reorderPetitionAttachments: PetitionBase;
  /** Changes the ordering of a user's petition list views */
  reorderPetitionListViews: User;
  /** Sends the AccountVerification email with confirmation code to unconfirmed user emails */
  resendVerificationEmail: Result;
  /** Resets the user password and resend the Invitation email. Only works if cognito user has status FORCE_CHANGE_PASSWORD */
  resetTempPassword: Result;
  /** Resets the given user password on AWS Cognito and sends an email with new temporary. */
  resetUserPassword: SupportMethodResponse;
  /** Restores a deleted petition if it's not already anonymized. */
  restoreDeletedPetition: SupportMethodResponse;
  restoreLogin: Result;
  /** Soft-deletes a given auth token, making it permanently unusable. */
  revokeUserAuthToken: Result;
  /** Moves a profile to DELETION_SCHEDULED status */
  scheduleProfileForDeletion: Array<Profile>;
  /** Sends different petitions to each of the specified contact groups, creating corresponding accesses and messages */
  sendPetition: Array<SendPetitionResult>;
  /** Sends an email to all contacts of the petition confirming the replies are ok */
  sendPetitionClosedNotification: Petition;
  /** Sends a reminder for the specified petition accesses. */
  sendReminders: Array<PetitionReminder>;
  /** Sends a reminder email to the pending signers */
  sendSignatureRequestReminders: Result;
  /** Set the delegades of a user */
  setUserDelegates: User;
  /** Shares our SignaturIt production APIKEY with the passed Org, creates corresponding usage limits and activates PETITION_SIGNATURE feature flag. */
  shareSignaturitApiKey: Organization;
  /** Triggered by new users that want to sign up into Parallel */
  signUp: User;
  /** Enables/disables security stamp on documents for Signaturit integrations. */
  signaturitIntegrationShowSecurityStamp: SupportMethodResponse;
  /** Generates a download link for the signed PDF petition. */
  signedPetitionDownloadLink: FileUploadDownloadLinkResult;
  /** Starts the completion of an async field */
  startAsyncFieldCompletion: AsyncFieldCompletionResponse;
  startSignatureRequest: PetitionSignatureRequest;
  subscribeToProfile: Array<Profile>;
  /** Switches automatic reminders for the specified petition accesses. */
  switchAutomaticReminders: Array<PetitionAccess>;
  /** Tags a petition */
  tagPetition: PetitionBase;
  /** Transfers the ownership of an organization to a given user. */
  transferOrganizationOwnership: SupportMethodResponse;
  /** Transfers petition ownership to a given user. The original owner gets a WRITE permission on the petitions. */
  transferPetitionOwnership: Array<PetitionBase>;
  unarchiveProfileType: Array<ProfileType>;
  unsubscribeFromProfile: Array<Profile>;
  /** Removes the given tag from the given petition */
  untagPetition: PetitionBase;
  /** Updates a contact. */
  updateContact: Contact;
  /** Updates an existing event subscription for the user's petitions */
  updateEventSubscription: PetitionEventSubscription;
  /** Activate or deactivate a list of organization feature flag */
  updateFeatureFlags: Organization;
  /** Updates the positions of the petition fields */
  updateFieldPositions: PetitionBase;
  /** Updates the file of a FILE_UPLOAD reply. The previous file will be deleted from AWS S3 when client notifies of upload completed via updateFileUploadReplyComplete mutation. */
  updateFileUploadReply: FileUploadReplyResponse;
  /** Notifies the backend that the new file was successfully uploaded to S3. Marks the file upload as completed and deletes the old file. */
  updateFileUploadReplyComplete: PetitionFieldReply;
  /** Updates the metadata of a public landing template. */
  updateLandingTemplateMetadata: SupportMethodResponse;
  /** Updates the organization */
  updateOrganization: Organization;
  /** Updates the period after closed petitions of this organization are automatically anonymized. */
  updateOrganizationAutoAnonymizePeriod: Organization;
  /** updates the theme of the organization brand */
  updateOrganizationBrandTheme: Organization;
  /** Updates the logo of an organization */
  updateOrganizationLogo: Organization;
  /** updates the PDF_DOCUMENT theme of the organization */
  updateOrganizationPdfDocumentTheme: Organization;
  /** Applies a given tier to the organization */
  updateOrganizationTier: SupportMethodResponse;
  /** Updates the usage_details of a given organization. Will impact the limits of coming usage periods. */
  updateOrganizationUsageDetails: Organization;
  /**
   * Updates the role of another user in the organization.
   * @deprecated use updateUserGroupMembership
   */
  updateOrganizationUser: User;
  /** Updates the user limit for a organization */
  updateOrganizationUserLimit: Organization;
  /** Updates a petition. */
  updatePetition: PetitionBase;
  /** Updates the type of a petition attachment and sets it in the final position */
  updatePetitionAttachmentType: PetitionAttachment;
  /** Updates a petition field. */
  updatePetitionField: PetitionField;
  /** Update a petition field comment. */
  updatePetitionFieldComment: PetitionFieldComment;
  /** Updates multiple replies for a petition at once */
  updatePetitionFieldReplies: Array<PetitionFieldReply>;
  /** Updates the status of a petition field reply. */
  updatePetitionFieldRepliesStatus: PetitionField;
  /**
   * Updates a reply on a petition field
   * @deprecated use updatePetitionFieldReplies
   */
  updatePetitionFieldReply: PetitionFieldReply;
  /** Updates the metadata of the specified petition field reply */
  updatePetitionFieldReplyMetadata: PetitionFieldReply;
  /** Updates a petition list view */
  updatePetitionListView: PetitionListView;
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
  updateProfileFieldValue: Profile;
  updateProfileType: ProfileType;
  updateProfileTypeField: ProfileTypeField;
  /** Updates the default permission for a profile type field for a set of users and/or user groups. */
  updateProfileTypeFieldPermission: ProfileTypeField;
  updateProfileTypeFieldPositions: ProfileType;
  /** Updates the info and permissions of a public link */
  updatePublicPetitionLink: PublicPetitionLink;
  /** Updates template_public from template */
  updatePublicTemplateVisibility: SupportMethodResponse;
  updateSignatureRequestMetadata: PetitionSignatureRequest;
  /** Updates the name and color of a given tag */
  updateTag: Tag;
  /** Updates the template default permissions */
  updateTemplateDefaultPermissions: PetitionTemplate;
  updateTemplateDocumentTheme: PetitionBase;
  /** Updates the user with the provided data. */
  updateUser: User;
  /** Updates the name of a given user group */
  updateUserGroup: UserGroup;
  /** Inserts the user into all provided user groups. */
  updateUserGroupMembership: User;
  /** Updates the permissions of a user group */
  updateUserGroupPermissions: UserGroup;
  /** Sets the locale passed as arg as the preferred language of the user to see the page */
  updateUserPreferredLocale: User;
  /** Uploads the xlsx file used to parse the options of a dynamic select field, and sets the field options */
  uploadDynamicSelectFieldFile: PetitionField;
  /** Uploads a user avatar image */
  uploadUserAvatar: SupportMethodResponse;
  verifyPublicAccess: PublicAccessVerification;
};

export type MutationactivateUserArgs = {
  userIds: Array<Scalars["GID"]["input"]>;
};

export type MutationaddPetitionPermissionArgs = {
  message?: InputMaybe<Scalars["String"]["input"]>;
  notify?: InputMaybe<Scalars["Boolean"]["input"]>;
  permissionType: PetitionPermissionTypeRW;
  petitionIds: Array<Scalars["GID"]["input"]>;
  subscribe?: InputMaybe<Scalars["Boolean"]["input"]>;
  userGroupIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  userIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
};

export type MutationaddUsersToUserGroupArgs = {
  userGroupId: Scalars["GID"]["input"];
  userIds: Array<Scalars["GID"]["input"]>;
};

export type MutationanonymizePetitionArgs = {
  petitionId: Scalars["GID"]["input"];
};

export type MutationapproveOrRejectPetitionFieldRepliesArgs = {
  petitionId: Scalars["GID"]["input"];
  status: PetitionFieldReplyStatus;
};

export type MutationarchiveProfileTypeArgs = {
  profileTypeIds: Array<Scalars["GID"]["input"]>;
};

export type MutationassociateProfileToPetitionArgs = {
  petitionId: Scalars["GID"]["input"];
  profileId: Scalars["GID"]["input"];
};

export type MutationbulkCreateContactsArgs = {
  file: Scalars["Upload"]["input"];
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type MutationbulkCreatePetitionRepliesArgs = {
  petitionId: Scalars["GID"]["input"];
  replies: Scalars["JSONObject"]["input"];
};

export type MutationcancelScheduledMessageArgs = {
  messageId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationcancelSignatureRequestArgs = {
  petitionSignatureRequestId: Scalars["GID"]["input"];
};

export type MutationchangeOrganizationArgs = {
  orgId?: InputMaybe<Scalars["GID"]["input"]>;
};

export type MutationchangePasswordArgs = {
  newPassword: Scalars["String"]["input"];
  password: Scalars["String"]["input"];
};

export type MutationchangePetitionFieldTypeArgs = {
  fieldId: Scalars["GID"]["input"];
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  petitionId: Scalars["GID"]["input"];
  type: PetitionFieldType;
};

export type MutationclonePetitionFieldArgs = {
  fieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationclonePetitionsArgs = {
  keepTitle?: InputMaybe<Scalars["Boolean"]["input"]>;
  path?: InputMaybe<Scalars["String"]["input"]>;
  petitionIds: Array<Scalars["GID"]["input"]>;
};

export type MutationcloneProfileTypeArgs = {
  name?: InputMaybe<Scalars["LocalizableUserText"]["input"]>;
  profileTypeId: Scalars["GID"]["input"];
};

export type MutationcloneUserGroupsArgs = {
  locale: UserLocale;
  userGroupIds: Array<Scalars["GID"]["input"]>;
};

export type MutationclosePetitionArgs = {
  petitionId: Scalars["GID"]["input"];
};

export type MutationcloseProfileArgs = {
  profileIds: Array<Scalars["GID"]["input"]>;
};

export type MutationcompletePetitionArgs = {
  additionalSigners?: InputMaybe<Array<PublicPetitionSignerDataInput>>;
  message?: InputMaybe<Scalars["String"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationcopyFileReplyToProfileFieldFileArgs = {
  expiryDate?: InputMaybe<Scalars["Date"]["input"]>;
  fileReplyIds: Array<Scalars["GID"]["input"]>;
  petitionId: Scalars["GID"]["input"];
  profileId: Scalars["GID"]["input"];
  profileTypeFieldId: Scalars["GID"]["input"];
};

export type MutationcreateContactArgs = {
  data: CreateContactInput;
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type MutationcreateDowJonesKycIntegrationArgs = {
  clientId: Scalars["String"]["input"];
  password: Scalars["String"]["input"];
  username: Scalars["String"]["input"];
};

export type MutationcreateDowJonesKycReplyArgs = {
  fieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
  profileId: Scalars["ID"]["input"];
};

export type MutationcreateDowJonesProfileDownloadTaskArgs = {
  profileId: Scalars["ID"]["input"];
};

export type MutationcreateEventSubscriptionArgs = {
  eventTypes?: InputMaybe<Array<PetitionEventType>>;
  eventsUrl: Scalars["String"]["input"];
  fromTemplateFieldIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  fromTemplateId?: InputMaybe<Scalars["GID"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationcreateEventSubscriptionSignatureKeyArgs = {
  subscriptionId: Scalars["GID"]["input"];
};

export type MutationcreateExportExcelTaskArgs = {
  petitionId: Scalars["GID"]["input"];
};

export type MutationcreateExportRepliesTaskArgs = {
  pattern?: InputMaybe<Scalars["String"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationcreateFileUploadReplyArgs = {
  fieldId: Scalars["GID"]["input"];
  file: FileUploadInput;
  petitionId: Scalars["GID"]["input"];
};

export type MutationcreateFileUploadReplyCompleteArgs = {
  petitionId: Scalars["GID"]["input"];
  replyId: Scalars["GID"]["input"];
};

export type MutationcreateOrganizationArgs = {
  email: Scalars["String"]["input"];
  firstName: Scalars["String"]["input"];
  lastName: Scalars["String"]["input"];
  locale: UserLocale;
  name: Scalars["String"]["input"];
  status: OrganizationStatus;
};

export type MutationcreateOrganizationPdfDocumentThemeArgs = {
  isDefault: Scalars["Boolean"]["input"];
  name: Scalars["String"]["input"];
};

export type MutationcreatePetitionArgs = {
  locale?: InputMaybe<PetitionLocale>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  path?: InputMaybe<Scalars["String"]["input"]>;
  petitionId?: InputMaybe<Scalars["GID"]["input"]>;
  type?: InputMaybe<PetitionBaseType>;
};

export type MutationcreatePetitionAccessArgs = {
  petitionId: Scalars["GID"]["input"];
};

export type MutationcreatePetitionAttachmentUploadLinkArgs = {
  data: Array<FileUploadInput>;
  petitionId: Scalars["GID"]["input"];
  type: PetitionAttachmentType;
};

export type MutationcreatePetitionFieldArgs = {
  petitionId: Scalars["GID"]["input"];
  position?: InputMaybe<Scalars["Int"]["input"]>;
  type: PetitionFieldType;
};

export type MutationcreatePetitionFieldAttachmentUploadLinkArgs = {
  data: FileUploadInput;
  fieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationcreatePetitionFieldCommentArgs = {
  content: Scalars["JSON"]["input"];
  isInternal: Scalars["Boolean"]["input"];
  petitionFieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
  sharePetition?: InputMaybe<Scalars["Boolean"]["input"]>;
  sharePetitionPermission?: InputMaybe<PetitionPermissionTypeRW>;
  sharePetitionSubscribed?: InputMaybe<Scalars["Boolean"]["input"]>;
  throwOnNoPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type MutationcreatePetitionFieldRepliesArgs = {
  fields: Array<CreatePetitionFieldReplyInput>;
  overwriteExisting?: InputMaybe<Scalars["Boolean"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationcreatePetitionFieldReplyArgs = {
  fieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
  reply: Scalars["JSON"]["input"];
};

export type MutationcreatePetitionListViewArgs = {
  data: PetitionListViewDataInput;
  name: Scalars["String"]["input"];
};

export type MutationcreatePrintPdfTaskArgs = {
  includeNdLinks?: InputMaybe<Scalars["Boolean"]["input"]>;
  petitionId: Scalars["GID"]["input"];
  skipAttachments?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type MutationcreateProfileArgs = {
  profileTypeId: Scalars["GID"]["input"];
  subscribe?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type MutationcreateProfileFieldFileUploadLinkArgs = {
  data: Array<FileUploadInput>;
  expiryDate?: InputMaybe<Scalars["Date"]["input"]>;
  profileId: Scalars["GID"]["input"];
  profileTypeFieldId: Scalars["GID"]["input"];
};

export type MutationcreateProfileTypeArgs = {
  name: Scalars["LocalizableUserText"]["input"];
};

export type MutationcreateProfileTypeFieldArgs = {
  data: CreateProfileTypeFieldInput;
  profileTypeId: Scalars["GID"]["input"];
};

export type MutationcreatePublicPetitionLinkArgs = {
  allowMultiplePetitions: Scalars["Boolean"]["input"];
  description: Scalars["String"]["input"];
  petitionNamePattern?: InputMaybe<Scalars["String"]["input"]>;
  prefillSecret?: InputMaybe<Scalars["String"]["input"]>;
  slug?: InputMaybe<Scalars["String"]["input"]>;
  templateId: Scalars["GID"]["input"];
  title: Scalars["String"]["input"];
};

export type MutationcreatePublicPetitionLinkPrefillDataArgs = {
  data: Scalars["JSONObject"]["input"];
  path?: InputMaybe<Scalars["String"]["input"]>;
  publicPetitionLinkId: Scalars["GID"]["input"];
};

export type MutationcreateSignaturitIntegrationArgs = {
  apiKey: Scalars["String"]["input"];
  isDefault?: InputMaybe<Scalars["Boolean"]["input"]>;
  name: Scalars["String"]["input"];
};

export type MutationcreateTagArgs = {
  color: Scalars["String"]["input"];
  name: Scalars["String"]["input"];
};

export type MutationcreateTemplateRepliesReportTaskArgs = {
  endDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  petitionId: Scalars["GID"]["input"];
  startDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  timezone: Scalars["String"]["input"];
};

export type MutationcreateTemplateStatsReportTaskArgs = {
  endDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  startDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  templateId: Scalars["GID"]["input"];
};

export type MutationcreateTemplatesOverviewReportTaskArgs = {
  endDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  startDate?: InputMaybe<Scalars["DateTime"]["input"]>;
};

export type MutationcreateUserGroupArgs = {
  name: Scalars["String"]["input"];
  userIds: Array<Scalars["GID"]["input"]>;
};

export type MutationdeactivateAccessesArgs = {
  accessIds: Array<Scalars["GID"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationdeactivateUserArgs = {
  includeDrafts?: InputMaybe<Scalars["Boolean"]["input"]>;
  tagIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  transferToUserId: Scalars["GID"]["input"];
  userIds: Array<Scalars["GID"]["input"]>;
};

export type MutationdeleteContactsArgs = {
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  ids: Array<Scalars["GID"]["input"]>;
};

export type MutationdeleteEventSubscriptionSignatureKeysArgs = {
  ids: Array<Scalars["GID"]["input"]>;
};

export type MutationdeleteEventSubscriptionsArgs = {
  ids: Array<Scalars["GID"]["input"]>;
};

export type MutationdeleteOrganizationPdfDocumentThemeArgs = {
  orgThemeId: Scalars["GID"]["input"];
};

export type MutationdeletePetitionAttachmentArgs = {
  attachmentId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationdeletePetitionFieldArgs = {
  fieldId: Scalars["GID"]["input"];
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationdeletePetitionFieldAttachmentArgs = {
  attachmentId: Scalars["GID"]["input"];
  fieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationdeletePetitionFieldCommentArgs = {
  petitionFieldCommentId: Scalars["GID"]["input"];
  petitionFieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationdeletePetitionListViewArgs = {
  id: Scalars["GID"]["input"];
};

export type MutationdeletePetitionReplyArgs = {
  petitionId: Scalars["GID"]["input"];
  replyId: Scalars["GID"]["input"];
};

export type MutationdeletePetitionsArgs = {
  dryrun?: InputMaybe<Scalars["Boolean"]["input"]>;
  folders?: InputMaybe<FoldersInput>;
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  ids?: InputMaybe<Array<Scalars["GID"]["input"]>>;
};

export type MutationdeleteProfileArgs = {
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  profileIds: Array<Scalars["GID"]["input"]>;
};

export type MutationdeleteProfileFieldFileArgs = {
  profileFieldFileIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  profileId: Scalars["GID"]["input"];
  profileTypeFieldId: Scalars["GID"]["input"];
};

export type MutationdeleteProfileTypeArgs = {
  profileTypeIds: Array<Scalars["GID"]["input"]>;
};

export type MutationdeleteProfileTypeFieldArgs = {
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  profileTypeFieldIds: Array<Scalars["GID"]["input"]>;
  profileTypeId: Scalars["GID"]["input"];
};

export type MutationdeleteSignatureIntegrationArgs = {
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  id: Scalars["GID"]["input"];
};

export type MutationdeleteTagArgs = {
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  id: Scalars["GID"]["input"];
};

export type MutationdeleteUserGroupArgs = {
  ids: Array<Scalars["GID"]["input"]>;
};

export type MutationdisassociatePetitionFromProfileArgs = {
  petitionIds: Array<Scalars["GID"]["input"]>;
  profileId: Scalars["GID"]["input"];
};

export type MutationdisassociateProfileFromPetitionArgs = {
  petitionId: Scalars["GID"]["input"];
  profileIds: Array<Scalars["GID"]["input"]>;
};

export type MutationdynamicSelectFieldFileDownloadLinkArgs = {
  fieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationeditPetitionPermissionArgs = {
  permissionType: PetitionPermissionType;
  petitionIds: Array<Scalars["GID"]["input"]>;
  userGroupIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  userIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
};

export type MutationfileUploadReplyDownloadLinkArgs = {
  petitionId: Scalars["GID"]["input"];
  preview?: InputMaybe<Scalars["Boolean"]["input"]>;
  replyId: Scalars["GID"]["input"];
};

export type MutationforceUpdateSignatureOrganizationBrandingsArgs = {
  orgId: Scalars["GID"]["input"];
};

export type MutationgenerateUserAuthTokenArgs = {
  tokenName: Scalars["String"]["input"];
};

export type MutationgetTaskResultFileArgs = {
  preview?: InputMaybe<Scalars["Boolean"]["input"]>;
  taskId: Scalars["GID"]["input"];
};

export type MutationimportPetitionFromJsonArgs = {
  json: Scalars["String"]["input"];
  userId: Scalars["GID"]["input"];
};

export type MutationinviteUserToOrganizationArgs = {
  email: Scalars["String"]["input"];
  firstName: Scalars["String"]["input"];
  lastName: Scalars["String"]["input"];
  locale: UserLocale;
  orgId?: InputMaybe<Scalars["GID"]["input"]>;
  role?: InputMaybe<OrganizationRole>;
  userGroupIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
};

export type MutationloginAsArgs = {
  userId: Scalars["GID"]["input"];
};

export type MutationmarkPetitionListViewAsDefaultArgs = {
  petitionListViewId?: InputMaybe<Scalars["GID"]["input"]>;
};

export type MutationmarkSignatureIntegrationAsDefaultArgs = {
  id: Scalars["GID"]["input"];
};

export type MutationmodifyCurrentUsagePeriodArgs = {
  limitName: OrganizationUsageLimitName;
  newLimit: Scalars["Int"]["input"];
  orgId: Scalars["GID"]["input"];
};

export type MutationmodifyPetitionCustomPropertyArgs = {
  key: Scalars["String"]["input"];
  petitionId: Scalars["GID"]["input"];
  value?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationmovePetitionsArgs = {
  destination: Scalars["String"]["input"];
  folderIds?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  ids?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  source: Scalars["String"]["input"];
  type: PetitionBaseType;
};

export type MutationpetitionAttachmentDownloadLinkArgs = {
  attachmentId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
  preview?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type MutationpetitionAttachmentUploadCompleteArgs = {
  attachmentId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationpetitionFieldAttachmentDownloadLinkArgs = {
  attachmentId: Scalars["GID"]["input"];
  fieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationpetitionFieldAttachmentUploadCompleteArgs = {
  attachmentId: Scalars["GID"]["input"];
  fieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationprofileFieldFileDownloadLinkArgs = {
  preview?: InputMaybe<Scalars["Boolean"]["input"]>;
  profileFieldFileId: Scalars["GID"]["input"];
  profileId: Scalars["GID"]["input"];
  profileTypeFieldId: Scalars["GID"]["input"];
};

export type MutationprofileFieldFileUploadCompleteArgs = {
  profileFieldFileIds: Array<Scalars["GID"]["input"]>;
  profileId: Scalars["GID"]["input"];
  profileTypeFieldId: Scalars["GID"]["input"];
};

export type MutationpublicCheckVerificationCodeArgs = {
  code: Scalars["String"]["input"];
  keycode: Scalars["ID"]["input"];
  token: Scalars["ID"]["input"];
};

export type MutationpublicCompletePetitionArgs = {
  additionalSigners?: InputMaybe<Array<PublicPetitionSignerDataInput>>;
  keycode: Scalars["ID"]["input"];
  message?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationpublicCreateAndSendPetitionFromPublicLinkArgs = {
  contactEmail: Scalars["String"]["input"];
  contactFirstName: Scalars["String"]["input"];
  contactLastName: Scalars["String"]["input"];
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  prefill?: InputMaybe<Scalars["String"]["input"]>;
  prefillDataKey?: InputMaybe<Scalars["ID"]["input"]>;
  slug: Scalars["ID"]["input"];
};

export type MutationpublicCreateFileUploadReplyArgs = {
  data: FileUploadInput;
  fieldId: Scalars["GID"]["input"];
  keycode: Scalars["ID"]["input"];
};

export type MutationpublicCreatePetitionFieldCommentArgs = {
  content: Scalars["JSON"]["input"];
  keycode: Scalars["ID"]["input"];
  petitionFieldId: Scalars["GID"]["input"];
};

export type MutationpublicCreatePetitionFieldRepliesArgs = {
  fields: Array<CreatePetitionFieldReplyInput>;
  keycode: Scalars["ID"]["input"];
};

export type MutationpublicCreatePetitionFieldReplyArgs = {
  fieldId: Scalars["GID"]["input"];
  keycode: Scalars["ID"]["input"];
  reply: Scalars["JSON"]["input"];
};

export type MutationpublicCreatePrintPdfTaskArgs = {
  keycode: Scalars["ID"]["input"];
};

export type MutationpublicDelegateAccessToContactArgs = {
  email: Scalars["String"]["input"];
  firstName: Scalars["String"]["input"];
  keycode: Scalars["ID"]["input"];
  lastName: Scalars["String"]["input"];
  messageBody: Scalars["JSON"]["input"];
};

export type MutationpublicDeletePetitionFieldCommentArgs = {
  keycode: Scalars["ID"]["input"];
  petitionFieldCommentId: Scalars["GID"]["input"];
  petitionFieldId: Scalars["GID"]["input"];
};

export type MutationpublicDeletePetitionFieldReplyArgs = {
  keycode: Scalars["ID"]["input"];
  replyId: Scalars["GID"]["input"];
};

export type MutationpublicFileUploadReplyCompleteArgs = {
  keycode: Scalars["ID"]["input"];
  replyId: Scalars["GID"]["input"];
};

export type MutationpublicFileUploadReplyDownloadLinkArgs = {
  keycode: Scalars["ID"]["input"];
  preview?: InputMaybe<Scalars["Boolean"]["input"]>;
  replyId: Scalars["GID"]["input"];
};

export type MutationpublicGetTaskResultFileUrlArgs = {
  keycode: Scalars["ID"]["input"];
  taskId: Scalars["GID"]["input"];
};

export type MutationpublicMarkPetitionFieldCommentsAsReadArgs = {
  keycode: Scalars["ID"]["input"];
  petitionFieldCommentIds: Array<Scalars["GID"]["input"]>;
};

export type MutationpublicPetitionFieldAttachmentDownloadLinkArgs = {
  attachmentId: Scalars["GID"]["input"];
  fieldId: Scalars["GID"]["input"];
  keycode: Scalars["ID"]["input"];
  preview?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type MutationpublicRemindersOptOutArgs = {
  keycode: Scalars["ID"]["input"];
  other: Scalars["String"]["input"];
  reason: Scalars["String"]["input"];
  referer?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationpublicResetTempPasswordArgs = {
  email: Scalars["String"]["input"];
  locale: UserLocale;
};

export type MutationpublicSendReminderArgs = {
  contactEmail: Scalars["String"]["input"];
  keycode?: InputMaybe<Scalars["ID"]["input"]>;
  slug?: InputMaybe<Scalars["ID"]["input"]>;
};

export type MutationpublicSendVerificationCodeArgs = {
  email?: InputMaybe<Scalars["String"]["input"]>;
  firstName?: InputMaybe<Scalars["String"]["input"]>;
  keycode: Scalars["ID"]["input"];
  lastName?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationpublicStartAsyncFieldCompletionArgs = {
  fieldId: Scalars["GID"]["input"];
  keycode: Scalars["ID"]["input"];
};

export type MutationpublicUpdatePetitionFieldCommentArgs = {
  content: Scalars["JSON"]["input"];
  keycode: Scalars["ID"]["input"];
  petitionFieldCommentId: Scalars["GID"]["input"];
  petitionFieldId: Scalars["GID"]["input"];
};

export type MutationpublicUpdatePetitionFieldRepliesArgs = {
  keycode: Scalars["ID"]["input"];
  replies: Array<UpdatePetitionFieldReplyInput>;
};

export type MutationpublicUpdatePetitionFieldReplyArgs = {
  keycode: Scalars["ID"]["input"];
  reply: Scalars["JSON"]["input"];
  replyId: Scalars["GID"]["input"];
};

export type MutationreactivateAccessesArgs = {
  accessIds: Array<Scalars["GID"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationremovePetitionPasswordArgs = {
  petitionId: Scalars["GID"]["input"];
};

export type MutationremovePetitionPermissionArgs = {
  petitionIds: Array<Scalars["GID"]["input"]>;
  removeAll?: InputMaybe<Scalars["Boolean"]["input"]>;
  userGroupIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  userIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
};

export type MutationremoveUsersFromGroupArgs = {
  userGroupId: Scalars["GID"]["input"];
  userIds: Array<Scalars["GID"]["input"]>;
};

export type MutationrenameFolderArgs = {
  folderId: Scalars["ID"]["input"];
  name?: InputMaybe<Scalars["String"]["input"]>;
  type: PetitionBaseType;
};

export type MutationreopenPetitionArgs = {
  petitionId: Scalars["GID"]["input"];
};

export type MutationreopenProfileArgs = {
  profileIds: Array<Scalars["GID"]["input"]>;
};

export type MutationreorderPetitionAttachmentsArgs = {
  attachmentIds: Array<Scalars["GID"]["input"]>;
  attachmentType: PetitionAttachmentType;
  petitionId: Scalars["GID"]["input"];
};

export type MutationreorderPetitionListViewsArgs = {
  ids: Array<Scalars["GID"]["input"]>;
};

export type MutationresendVerificationEmailArgs = {
  email: Scalars["String"]["input"];
  locale: UserLocale;
};

export type MutationresetTempPasswordArgs = {
  email: Scalars["String"]["input"];
  locale: UserLocale;
};

export type MutationresetUserPasswordArgs = {
  email: Scalars["String"]["input"];
  locale: UserLocale;
};

export type MutationrestoreDeletedPetitionArgs = {
  petitionId: Scalars["GID"]["input"];
};

export type MutationrevokeUserAuthTokenArgs = {
  authTokenIds: Array<Scalars["GID"]["input"]>;
};

export type MutationscheduleProfileForDeletionArgs = {
  profileIds: Array<Scalars["GID"]["input"]>;
};

export type MutationsendPetitionArgs = {
  body: Scalars["JSON"]["input"];
  bulkSendSigningMode?: InputMaybe<BulkSendSigningMode>;
  contactIdGroups: Array<Array<Scalars["GID"]["input"]>>;
  petitionId: Scalars["GID"]["input"];
  remindersConfig?: InputMaybe<RemindersConfigInput>;
  scheduledAt?: InputMaybe<Scalars["DateTime"]["input"]>;
  senderId?: InputMaybe<Scalars["GID"]["input"]>;
  subject: Scalars["String"]["input"];
};

export type MutationsendPetitionClosedNotificationArgs = {
  attachPdfExport: Scalars["Boolean"]["input"];
  emailBody: Scalars["JSON"]["input"];
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  pdfExportTitle?: InputMaybe<Scalars["String"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationsendRemindersArgs = {
  accessIds: Array<Scalars["GID"]["input"]>;
  body?: InputMaybe<Scalars["JSON"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationsendSignatureRequestRemindersArgs = {
  petitionSignatureRequestId: Scalars["GID"]["input"];
};

export type MutationsetUserDelegatesArgs = {
  delegateIds: Array<Scalars["GID"]["input"]>;
};

export type MutationshareSignaturitApiKeyArgs = {
  duration: Scalars["Duration"]["input"];
  limit: Scalars["Int"]["input"];
  orgId: Scalars["GID"]["input"];
};

export type MutationsignUpArgs = {
  captcha: Scalars["String"]["input"];
  email: Scalars["String"]["input"];
  firstName: Scalars["String"]["input"];
  industry?: InputMaybe<Scalars["String"]["input"]>;
  lastName: Scalars["String"]["input"];
  licenseCode?: InputMaybe<Scalars["String"]["input"]>;
  locale: UserLocale;
  organizationLogo?: InputMaybe<Scalars["Upload"]["input"]>;
  organizationName: Scalars["String"]["input"];
  password: Scalars["String"]["input"];
  position?: InputMaybe<Scalars["String"]["input"]>;
  role?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationsignaturitIntegrationShowSecurityStampArgs = {
  integrationId: Scalars["Int"]["input"];
  showCsv: Scalars["Boolean"]["input"];
};

export type MutationsignedPetitionDownloadLinkArgs = {
  downloadAuditTrail?: InputMaybe<Scalars["Boolean"]["input"]>;
  petitionSignatureRequestId: Scalars["GID"]["input"];
  preview?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type MutationstartAsyncFieldCompletionArgs = {
  fieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationstartSignatureRequestArgs = {
  message?: InputMaybe<Scalars["String"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationsubscribeToProfileArgs = {
  profileIds: Array<Scalars["GID"]["input"]>;
  userIds: Array<Scalars["GID"]["input"]>;
};

export type MutationswitchAutomaticRemindersArgs = {
  accessIds: Array<Scalars["GID"]["input"]>;
  petitionId: Scalars["GID"]["input"];
  remindersConfig?: InputMaybe<RemindersConfigInput>;
  start: Scalars["Boolean"]["input"];
};

export type MutationtagPetitionArgs = {
  petitionId: Scalars["GID"]["input"];
  tagId: Scalars["GID"]["input"];
};

export type MutationtransferOrganizationOwnershipArgs = {
  orgId: Scalars["GID"]["input"];
  userId: Scalars["GID"]["input"];
};

export type MutationtransferPetitionOwnershipArgs = {
  petitionIds: Array<Scalars["GID"]["input"]>;
  userId: Scalars["GID"]["input"];
};

export type MutationunarchiveProfileTypeArgs = {
  profileTypeIds: Array<Scalars["GID"]["input"]>;
};

export type MutationunsubscribeFromProfileArgs = {
  profileIds: Array<Scalars["GID"]["input"]>;
  userIds: Array<Scalars["GID"]["input"]>;
};

export type MutationuntagPetitionArgs = {
  petitionId: Scalars["GID"]["input"];
  tagId: Scalars["GID"]["input"];
};

export type MutationupdateContactArgs = {
  data: UpdateContactInput;
  id: Scalars["GID"]["input"];
};

export type MutationupdateEventSubscriptionArgs = {
  eventTypes?: InputMaybe<Array<PetitionEventType>>;
  eventsUrl?: InputMaybe<Scalars["String"]["input"]>;
  fromTemplateFieldIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  fromTemplateId?: InputMaybe<Scalars["GID"]["input"]>;
  id: Scalars["GID"]["input"];
  isEnabled?: InputMaybe<Scalars["Boolean"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationupdateFeatureFlagsArgs = {
  featureFlags: Array<InputFeatureFlagNameValue>;
  orgId: Scalars["GID"]["input"];
};

export type MutationupdateFieldPositionsArgs = {
  fieldIds: Array<Scalars["GID"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationupdateFileUploadReplyArgs = {
  file: FileUploadInput;
  petitionId: Scalars["GID"]["input"];
  replyId: Scalars["GID"]["input"];
};

export type MutationupdateFileUploadReplyCompleteArgs = {
  petitionId: Scalars["GID"]["input"];
  replyId: Scalars["GID"]["input"];
};

export type MutationupdateLandingTemplateMetadataArgs = {
  backgroundColor?: InputMaybe<Scalars["String"]["input"]>;
  categories?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  image?: InputMaybe<Scalars["Upload"]["input"]>;
  slug?: InputMaybe<Scalars["String"]["input"]>;
  templateId: Scalars["GID"]["input"];
};

export type MutationupdateOrganizationArgs = {
  data: OrganizationUpdateInput;
  orgId: Scalars["GID"]["input"];
};

export type MutationupdateOrganizationAutoAnonymizePeriodArgs = {
  months?: InputMaybe<Scalars["Int"]["input"]>;
};

export type MutationupdateOrganizationBrandThemeArgs = {
  data: OrganizationBrandThemeInput;
};

export type MutationupdateOrganizationLogoArgs = {
  file: Scalars["Upload"]["input"];
  isIcon?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type MutationupdateOrganizationPdfDocumentThemeArgs = {
  data?: InputMaybe<OrganizationPdfDocumentThemeInput>;
  isDefault?: InputMaybe<Scalars["Boolean"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  orgThemeId: Scalars["GID"]["input"];
};

export type MutationupdateOrganizationTierArgs = {
  orgId: Scalars["GID"]["input"];
  tier: Scalars["String"]["input"];
};

export type MutationupdateOrganizationUsageDetailsArgs = {
  duration: Scalars["Duration"]["input"];
  limit: Scalars["Int"]["input"];
  limitName: OrganizationUsageLimitName;
  orgId: Scalars["GID"]["input"];
  renewalCycles: Scalars["Int"]["input"];
  startNewPeriod: Scalars["Boolean"]["input"];
};

export type MutationupdateOrganizationUserArgs = {
  role: OrganizationRole;
  userGroupIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  userId: Scalars["GID"]["input"];
};

export type MutationupdateOrganizationUserLimitArgs = {
  limit: Scalars["Int"]["input"];
  orgId: Scalars["GID"]["input"];
};

export type MutationupdatePetitionArgs = {
  data: UpdatePetitionInput;
  petitionId: Scalars["GID"]["input"];
};

export type MutationupdatePetitionAttachmentTypeArgs = {
  attachmentId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
  type: PetitionAttachmentType;
};

export type MutationupdatePetitionFieldArgs = {
  data: UpdatePetitionFieldInput;
  fieldId: Scalars["GID"]["input"];
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationupdatePetitionFieldCommentArgs = {
  content: Scalars["JSON"]["input"];
  petitionFieldCommentId: Scalars["GID"]["input"];
  petitionFieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
  sharePetition?: InputMaybe<Scalars["Boolean"]["input"]>;
  sharePetitionPermission?: InputMaybe<PetitionPermissionTypeRW>;
  sharePetitionSubscribed?: InputMaybe<Scalars["Boolean"]["input"]>;
  throwOnNoPermission?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type MutationupdatePetitionFieldRepliesArgs = {
  petitionId: Scalars["GID"]["input"];
  replies: Array<UpdatePetitionFieldReplyInput>;
};

export type MutationupdatePetitionFieldRepliesStatusArgs = {
  petitionFieldId: Scalars["GID"]["input"];
  petitionFieldReplyIds: Array<Scalars["GID"]["input"]>;
  petitionId: Scalars["GID"]["input"];
  status: PetitionFieldReplyStatus;
};

export type MutationupdatePetitionFieldReplyArgs = {
  petitionId: Scalars["GID"]["input"];
  reply: Scalars["JSON"]["input"];
  replyId: Scalars["GID"]["input"];
};

export type MutationupdatePetitionFieldReplyMetadataArgs = {
  metadata: Scalars["JSONObject"]["input"];
  petitionId: Scalars["GID"]["input"];
  replyId: Scalars["GID"]["input"];
};

export type MutationupdatePetitionListViewArgs = {
  data?: InputMaybe<PetitionListViewDataInput>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  petitionListViewId: Scalars["GID"]["input"];
};

export type MutationupdatePetitionMetadataArgs = {
  metadata: Scalars["JSONObject"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationupdatePetitionPermissionSubscriptionArgs = {
  isSubscribed: Scalars["Boolean"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationupdatePetitionRestrictionArgs = {
  isRestricted: Scalars["Boolean"]["input"];
  password?: InputMaybe<Scalars["String"]["input"]>;
  petitionId: Scalars["GID"]["input"];
};

export type MutationupdatePetitionUserNotificationReadStatusArgs = {
  filter?: InputMaybe<PetitionUserNotificationFilter>;
  isRead: Scalars["Boolean"]["input"];
  petitionFieldCommentIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  petitionIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  petitionUserNotificationIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
};

export type MutationupdateProfileFieldValueArgs = {
  fields: Array<UpdateProfileFieldValueInput>;
  profileId: Scalars["GID"]["input"];
};

export type MutationupdateProfileTypeArgs = {
  name?: InputMaybe<Scalars["LocalizableUserText"]["input"]>;
  profileNamePattern?: InputMaybe<Scalars["String"]["input"]>;
  profileTypeId: Scalars["GID"]["input"];
};

export type MutationupdateProfileTypeFieldArgs = {
  data: UpdateProfileTypeFieldInput;
  force?: InputMaybe<Scalars["Boolean"]["input"]>;
  profileTypeFieldId: Scalars["GID"]["input"];
  profileTypeId: Scalars["GID"]["input"];
};

export type MutationupdateProfileTypeFieldPermissionArgs = {
  data: Array<UpdateProfileTypeFieldPermissionInput>;
  defaultPermission?: InputMaybe<ProfileTypeFieldPermissionType>;
  profileTypeFieldId: Scalars["GID"]["input"];
  profileTypeId: Scalars["GID"]["input"];
};

export type MutationupdateProfileTypeFieldPositionsArgs = {
  profileTypeFieldIds: Array<Scalars["GID"]["input"]>;
  profileTypeId: Scalars["GID"]["input"];
};

export type MutationupdatePublicPetitionLinkArgs = {
  allowMultiplePetitions?: InputMaybe<Scalars["Boolean"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  petitionNamePattern?: InputMaybe<Scalars["String"]["input"]>;
  prefillSecret?: InputMaybe<Scalars["String"]["input"]>;
  publicPetitionLinkId: Scalars["GID"]["input"];
  slug?: InputMaybe<Scalars["String"]["input"]>;
  title?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationupdatePublicTemplateVisibilityArgs = {
  isPublic: Scalars["Boolean"]["input"];
  templateId: Scalars["GID"]["input"];
};

export type MutationupdateSignatureRequestMetadataArgs = {
  metadata: Scalars["JSONObject"]["input"];
  petitionSignatureRequestId: Scalars["GID"]["input"];
};

export type MutationupdateTagArgs = {
  data: UpdateTagInput;
  id: Scalars["GID"]["input"];
};

export type MutationupdateTemplateDefaultPermissionsArgs = {
  permissions: Array<UserOrUserGroupPermissionInput>;
  templateId: Scalars["GID"]["input"];
};

export type MutationupdateTemplateDocumentThemeArgs = {
  orgThemeId: Scalars["GID"]["input"];
  templateId: Scalars["GID"]["input"];
};

export type MutationupdateUserArgs = {
  firstName?: InputMaybe<Scalars["String"]["input"]>;
  lastName?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationupdateUserGroupArgs = {
  data: UpdateUserGroupInput;
  id: Scalars["GID"]["input"];
};

export type MutationupdateUserGroupMembershipArgs = {
  userGroupIds: Array<Scalars["GID"]["input"]>;
  userId: Scalars["GID"]["input"];
};

export type MutationupdateUserGroupPermissionsArgs = {
  permissions: Array<UpdateUserGroupPermissionsInput>;
  userGroupId: Scalars["GID"]["input"];
};

export type MutationupdateUserPreferredLocaleArgs = {
  locale: UserLocale;
};

export type MutationuploadDynamicSelectFieldFileArgs = {
  fieldId: Scalars["GID"]["input"];
  file: Scalars["Upload"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type MutationuploadUserAvatarArgs = {
  image: Scalars["Upload"]["input"];
  userId: Scalars["GID"]["input"];
};

export type MutationverifyPublicAccessArgs = {
  ip?: InputMaybe<Scalars["String"]["input"]>;
  keycode: Scalars["ID"]["input"];
  token: Scalars["ID"]["input"];
  userAgent?: InputMaybe<Scalars["String"]["input"]>;
};

export type OrgIntegration = IOrgIntegration & {
  id: Scalars["GID"]["output"];
  invalidCredentials: Scalars["Boolean"]["output"];
  /** Wether this integration is the default to be used if the user has more than one of the same type */
  isDefault: Scalars["Boolean"]["output"];
  /** Custom name of this integration, provided by the user */
  name: Scalars["String"]["output"];
  /** The type of the integration. */
  type: IntegrationType;
};

/** An object describing the license of an organization */
export type OrgLicense = {
  externalId: Scalars["String"]["output"];
  name: Scalars["String"]["output"];
  source: OrgLicenseSource;
};

export type OrgLicenseSource = "APPSUMO";

/** An organization in the system. */
export type Organization = Timestamps & {
  /** The total number of active users */
  activeUserCount: Scalars["Int"]["output"];
  anonymizePetitionsAfterMonths: Maybe<Scalars["Int"]["output"]>;
  brandTheme: OrganizationBrandThemeData;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  currentUsagePeriod: Maybe<OrganizationUsageLimit>;
  /** Custom host used in petition links and public links. */
  customHost: Maybe<Scalars["String"]["output"]>;
  /** A list of all feature flag and the value asigned to this org */
  features: Array<FeatureFlagNameValue>;
  hasIntegration: Scalars["Boolean"]["output"];
  /** Whether the organization has an SSO provider configured. */
  hasSsoProvider: Scalars["Boolean"]["output"];
  /** URL of the organization logo */
  iconUrl: Maybe<Scalars["String"]["output"]>;
  /** The ID of the organization. */
  id: Scalars["GID"]["output"];
  /** A paginated list with enabled integrations for the organization */
  integrations: IOrgIntegrationPagination;
  isUsageLimitReached: Scalars["Boolean"]["output"];
  /** Current license for the organization */
  license: Maybe<OrgLicense>;
  /** URL of the organization logo */
  logoUrl: Maybe<Scalars["String"]["output"]>;
  /** The name of the organization. */
  name: Scalars["String"]["output"];
  pdfDocumentThemes: Array<OrganizationTheme>;
  /** The status of the organization. */
  status: OrganizationStatus;
  subscriptionEndDate: Maybe<Scalars["DateTime"]["output"]>;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
  usageDetails: Scalars["JSONObject"]["output"];
  usagePeriods: OrganizationUsageLimitPagination;
  /** The users in the organization. */
  users: UserPagination;
};

/** An organization in the system. */
export type OrganizationcurrentUsagePeriodArgs = {
  limitName: OrganizationUsageLimitName;
};

/** An organization in the system. */
export type OrganizationhasIntegrationArgs = {
  integration: IntegrationType;
  provider?: InputMaybe<Scalars["String"]["input"]>;
};

/** An organization in the system. */
export type OrganizationiconUrlArgs = {
  options?: InputMaybe<ImageOptions>;
};

/** An organization in the system. */
export type OrganizationintegrationsArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  type?: InputMaybe<IntegrationType>;
};

/** An organization in the system. */
export type OrganizationisUsageLimitReachedArgs = {
  limitName: OrganizationUsageLimitName;
};

/** An organization in the system. */
export type OrganizationlogoUrlArgs = {
  options?: InputMaybe<ImageOptions>;
};

/** An organization in the system. */
export type OrganizationsubscriptionEndDateArgs = {
  limitName: OrganizationUsageLimitName;
};

/** An organization in the system. */
export type OrganizationusagePeriodsArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  limitName: OrganizationUsageLimitName;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

/** An organization in the system. */
export type OrganizationusersArgs = {
  exclude?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  filters?: InputMaybe<UserFilter>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  searchByEmailOnly?: InputMaybe<Scalars["Boolean"]["input"]>;
  sortBy?: InputMaybe<Array<OrganizationUsers_OrderBy>>;
};

export type OrganizationBrandThemeData = {
  color: Scalars["String"]["output"];
  fontFamily: Maybe<Scalars["String"]["output"]>;
  preferredTone: Tone;
};

export type OrganizationBrandThemeInput = {
  color?: InputMaybe<Scalars["String"]["input"]>;
  fontFamily?: InputMaybe<Scalars["String"]["input"]>;
  preferredTone?: InputMaybe<Tone>;
};

export type OrganizationPagination = {
  /** The requested slice of items. */
  items: Array<Organization>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type OrganizationPdfDocumentThemeInput = {
  legalText?: InputMaybe<OrganizationPdfDocumentThemeInputLegalText>;
  marginBottom?: InputMaybe<Scalars["Float"]["input"]>;
  marginLeft?: InputMaybe<Scalars["Float"]["input"]>;
  marginRight?: InputMaybe<Scalars["Float"]["input"]>;
  marginTop?: InputMaybe<Scalars["Float"]["input"]>;
  showLogo?: InputMaybe<Scalars["Boolean"]["input"]>;
  textColor?: InputMaybe<Scalars["String"]["input"]>;
  textFontFamily?: InputMaybe<Scalars["String"]["input"]>;
  textFontSize?: InputMaybe<Scalars["Float"]["input"]>;
  title1Color?: InputMaybe<Scalars["String"]["input"]>;
  title1FontFamily?: InputMaybe<Scalars["String"]["input"]>;
  title1FontSize?: InputMaybe<Scalars["Float"]["input"]>;
  title2Color?: InputMaybe<Scalars["String"]["input"]>;
  title2FontFamily?: InputMaybe<Scalars["String"]["input"]>;
  title2FontSize?: InputMaybe<Scalars["Float"]["input"]>;
};

export type OrganizationPdfDocumentThemeInputLegalText = {
  en?: InputMaybe<Scalars["JSON"]["input"]>;
  es?: InputMaybe<Scalars["JSON"]["input"]>;
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

export type OrganizationTheme = {
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  isDefault: Scalars["Boolean"]["output"];
  name: Scalars["String"]["output"];
};

export type OrganizationUpdateInput = {
  name?: InputMaybe<Scalars["String"]["input"]>;
  status?: InputMaybe<OrganizationStatus>;
};

export type OrganizationUsageLimit = {
  cycleNumber: Scalars["Int"]["output"];
  id: Scalars["GID"]["output"];
  limit: Scalars["Int"]["output"];
  period: Scalars["Duration"]["output"];
  periodEndDate: Maybe<Scalars["DateTime"]["output"]>;
  periodStartDate: Scalars["DateTime"]["output"];
  used: Scalars["Int"]["output"];
};

export type OrganizationUsageLimitName = "PETITION_SEND" | "SIGNATURIT_SHARED_APIKEY";

export type OrganizationUsageLimitPagination = {
  /** The requested slice of items. */
  items: Array<OrganizationUsageLimit>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
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
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
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
  /** How many months to wait since the petition is closed to anonymize. */
  anonymizeAfterMonths: Maybe<Scalars["Int"]["output"]>;
  /** Purpose of the anonymization */
  anonymizePurpose: Maybe<Scalars["String"]["output"]>;
  /** The attachments linked to this petition */
  attachmentsList: PetitionAttachmentsList;
  /** Time when the petition was closed. */
  closedAt: Maybe<Scalars["DateTime"]["output"]>;
  /** The closing email body of the petition. */
  closingEmailBody: Maybe<Scalars["JSON"]["output"]>;
  /** The body of the optional completing message to be show to recipients */
  completingMessageBody: Maybe<Scalars["JSON"]["output"]>;
  /** The subject of the optional completing message to be show to recipients */
  completingMessageSubject: Maybe<Scalars["String"]["output"]>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  /** The current signature request. */
  currentSignatureRequest: Maybe<PetitionSignatureRequest>;
  /** Custom user properties */
  customProperties: Scalars["JSONObject"]["output"];
  /** The deadline of the petition. */
  deadline: Maybe<Scalars["DateTime"]["output"]>;
  defaultOnBehalf: Maybe<User>;
  /** The effective permissions on the petition */
  effectivePermissions: Array<EffectivePetitionUserPermission>;
  /** The body of the petition. */
  emailBody: Maybe<Scalars["JSON"]["output"]>;
  /** The subject of the petition. */
  emailSubject: Maybe<Scalars["String"]["output"]>;
  /** The events for the petition. */
  events: PetitionEventPagination;
  /** The number of fields in the petition. */
  fieldCount: Scalars["Int"]["output"];
  /** The definition of the petition fields. */
  fields: Array<PetitionField>;
  /** The template used for this petition */
  fromTemplate: Maybe<PetitionBaseMini>;
  /** The ID of the petition or template. */
  id: Scalars["GID"]["output"];
  isAnonymized: Scalars["Boolean"]["output"];
  /** Wether the completion message will be shown to the recipients or not. */
  isCompletingMessageEnabled: Scalars["Boolean"]["output"];
  /**
   * Whether the contents card is hidden in the recipient view.
   * @deprecated Don't use this
   */
  isRecipientViewContentsHidden: Scalars["Boolean"]["output"];
  isRestricted: Scalars["Boolean"]["output"];
  isRestrictedWithPassword: Scalars["Boolean"]["output"];
  /** The locale of the parallel. */
  locale: PetitionLocale;
  /** Metadata for this petition. */
  metadata: Scalars["JSONObject"]["output"];
  /** The effective permission of the logged user. Will return null if the user doesn't have access to the petition (e.g. on public templates). */
  myEffectivePermission: Maybe<EffectivePetitionUserPermission>;
  /** The name of the petition. */
  name: Maybe<Scalars["String"]["output"]>;
  organization: Organization;
  owner: User;
  path: Scalars["String"]["output"];
  /** The permissions linked to the petition */
  permissions: Array<PetitionPermission>;
  profiles: Array<Profile>;
  /** The progress of the petition. */
  progress: PetitionProgress;
  /** The reminders configuration for the petition. */
  remindersConfig: Maybe<RemindersConfig>;
  selectedDocumentTheme: OrganizationTheme;
  /** Date when the petition was first sent */
  sentAt: Maybe<Scalars["DateTime"]["output"]>;
  /** The signature configuration for the petition. */
  signatureConfig: Maybe<SignatureConfig>;
  /** The list of signature requests. */
  signatureRequests: Array<PetitionSignatureRequest>;
  /** Whether to skip the forward security check on the recipient view. */
  skipForwardSecurity: Scalars["Boolean"]["output"];
  /** The status of the petition. */
  status: PetitionStatus;
  /** The tags linked to the petition */
  tags: Array<Tag>;
  /** The preferred tone of organization. */
  tone: Tone;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
};

/** A petition */
export type PetitioneventsArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

/** A petition access */
export type PetitionAccess = Timestamps & {
  /** The contact of this access. */
  contact: Maybe<Contact>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  /** The original user who granted the access as other user. */
  delegateGranter: Maybe<User>;
  /** The user who granted the original access. */
  granter: Maybe<User>;
  /** The ID of the petition access. */
  id: Scalars["GID"]["output"];
  /** It will be true if doesn't have contact assigned */
  isContactless: Scalars["Boolean"]["output"];
  /** When the next reminder will be sent. */
  nextReminderAt: Maybe<Scalars["DateTime"]["output"]>;
  /** The petition for this message access. */
  petition: Maybe<Petition>;
  recipientUrl: Maybe<Scalars["String"]["output"]>;
  /** Number of reminders sent. */
  reminderCount: Scalars["Int"]["output"];
  reminders: Array<PetitionReminder>;
  /** Whether automatic reminders are active or not for this petition access */
  remindersActive: Scalars["Boolean"]["output"];
  /** The reminder settings of the petition. */
  remindersConfig: Maybe<RemindersConfig>;
  /** Number of reminders left. */
  remindersLeft: Scalars["Int"]["output"];
  /** Whether contact has opted out from receiving reminders for this petition */
  remindersOptOut: Scalars["Boolean"]["output"];
  /** The status of the petition access */
  status: PetitionAccessStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
};

export type PetitionAccessPagination = {
  /** The requested slice of items. */
  items: Array<PetitionAccess>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

/** The status of a petition access. */
export type PetitionAccessStatus =
  /** The petition is accessible by the contact. */
  | "ACTIVE"
  /** The petition is not accessible by the contact. */
  | "INACTIVE";

export type PetitionAnonymizedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type PetitionAssociatedEvent = ProfileEvent & {
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  profile: Maybe<Profile>;
  type: ProfileEventType;
  user: Maybe<User>;
};

export type PetitionAttachment = {
  file: FileUpload;
  id: Scalars["GID"]["output"];
  petition: PetitionBase;
  type: PetitionAttachmentType;
};

export type PetitionAttachmentType = "ANNEX" | "BACK" | "FRONT";

export type PetitionAttachmentUploadData = {
  attachment: PetitionAttachment;
  presignedPostData: AWSPresignedPostData;
};

export type PetitionAttachmentsList = {
  ANNEX: Array<PetitionAttachment>;
  BACK: Array<PetitionAttachment>;
  FRONT: Array<PetitionAttachment>;
};

export type PetitionBase = {
  /** How many months to wait since the petition is closed to anonymize. */
  anonymizeAfterMonths: Maybe<Scalars["Int"]["output"]>;
  /** Purpose of the anonymization */
  anonymizePurpose: Maybe<Scalars["String"]["output"]>;
  /** The attachments linked to this petition */
  attachmentsList: PetitionAttachmentsList;
  /** The closing email body of the petition. */
  closingEmailBody: Maybe<Scalars["JSON"]["output"]>;
  /** The body of the optional completing message to be show to recipients */
  completingMessageBody: Maybe<Scalars["JSON"]["output"]>;
  /** The subject of the optional completing message to be show to recipients */
  completingMessageSubject: Maybe<Scalars["String"]["output"]>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  /** Custom user properties */
  customProperties: Scalars["JSONObject"]["output"];
  defaultOnBehalf: Maybe<User>;
  /** The effective permissions on the petition */
  effectivePermissions: Array<EffectivePetitionUserPermission>;
  /** The body of the petition. */
  emailBody: Maybe<Scalars["JSON"]["output"]>;
  /** The subject of the petition. */
  emailSubject: Maybe<Scalars["String"]["output"]>;
  /** The number of fields in the petition. */
  fieldCount: Scalars["Int"]["output"];
  /** The definition of the petition fields. */
  fields: Array<PetitionField>;
  /** The ID of the petition or template. */
  id: Scalars["GID"]["output"];
  isAnonymized: Scalars["Boolean"]["output"];
  /** Wether the completion message will be shown to the recipients or not. */
  isCompletingMessageEnabled: Scalars["Boolean"]["output"];
  /**
   * Whether the contents card is hidden in the recipient view.
   * @deprecated Don't use this
   */
  isRecipientViewContentsHidden: Scalars["Boolean"]["output"];
  isRestricted: Scalars["Boolean"]["output"];
  isRestrictedWithPassword: Scalars["Boolean"]["output"];
  /** The locale of the parallel. */
  locale: PetitionLocale;
  /** Metadata for this petition. */
  metadata: Scalars["JSONObject"]["output"];
  /** The effective permission of the logged user. Will return null if the user doesn't have access to the petition (e.g. on public templates). */
  myEffectivePermission: Maybe<EffectivePetitionUserPermission>;
  /** The name of the petition. */
  name: Maybe<Scalars["String"]["output"]>;
  organization: Organization;
  owner: User;
  path: Scalars["String"]["output"];
  /** The permissions linked to the petition */
  permissions: Array<PetitionPermission>;
  /** The reminders configuration for the petition. */
  remindersConfig: Maybe<RemindersConfig>;
  selectedDocumentTheme: OrganizationTheme;
  /** The signature configuration for the petition. */
  signatureConfig: Maybe<SignatureConfig>;
  /** Whether to skip the forward security check on the recipient view. */
  skipForwardSecurity: Scalars["Boolean"]["output"];
  /** The tags linked to the petition */
  tags: Array<Tag>;
  /** The preferred tone of organization. */
  tone: Tone;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
};

export type PetitionBaseMini = {
  /** The ID of the petition or template. */
  id: Scalars["GID"]["output"];
  /** Whether the template is publicly available or not */
  isPublicTemplate: Maybe<Scalars["Boolean"]["output"]>;
  /** The effective permission of the logged user. Will return null if the user doesn't have access to the petition (e.g. on public templates). */
  myEffectivePermission: Maybe<EffectivePetitionUserPermission>;
  /** The name of the petition. */
  name: Maybe<Scalars["String"]["output"]>;
};

export type PetitionBaseOrFolder = Petition | PetitionFolder | PetitionTemplate;

export type PetitionBaseOrFolderPagination = {
  /** The requested slice of items. */
  items: Array<PetitionBaseOrFolder>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type PetitionBaseType = "PETITION" | "TEMPLATE";

export type PetitionClonedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type PetitionClosedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type PetitionClosedNotifiedEvent = PetitionEvent & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type PetitionCompletedEvent = PetitionEvent & {
  completedBy: Maybe<UserOrPetitionAccess>;
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type PetitionCompletedUserNotification = PetitionUserNotification & {
  completedBy: Maybe<UserOrPetitionAccess>;
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  isRead: Scalars["Boolean"]["output"];
  petition: PetitionBase;
};

export type PetitionCreatedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type PetitionDeletedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type PetitionDisassociatedEvent = ProfileEvent & {
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  profile: Maybe<Profile>;
  type: ProfileEventType;
  user: Maybe<User>;
};

export type PetitionEvent = {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type PetitionEventPagination = {
  /** The requested slice of items. */
  items: Array<PetitionEvent>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type PetitionEventSubscription = {
  eventTypes: Maybe<Array<PetitionEventType>>;
  eventsUrl: Scalars["String"]["output"];
  fromTemplate: Maybe<PetitionBaseMini>;
  fromTemplateFields: Maybe<Array<PetitionFieldMini>>;
  id: Scalars["GID"]["output"];
  isEnabled: Scalars["Boolean"]["output"];
  isFailing: Scalars["Boolean"]["output"];
  name: Maybe<Scalars["String"]["output"]>;
  signatureKeys: Array<EventSubscriptionSignatureKey>;
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
  | "PROFILE_ASSOCIATED"
  | "PROFILE_DISASSOCIATED"
  | "RECIPIENT_SIGNED"
  | "REMINDERS_OPT_OUT"
  | "REMINDER_SENT"
  | "REPLY_CREATED"
  | "REPLY_DELETED"
  | "REPLY_STATUS_CHANGED"
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
  alias: Maybe<Scalars["String"]["output"]>;
  /** A list of files attached to this field. */
  attachments: Array<PetitionFieldAttachment>;
  commentCount: Scalars["Int"]["output"];
  /** The comments for this field. */
  comments: Array<PetitionFieldComment>;
  /** The description of the petition field. */
  description: Maybe<Scalars["String"]["output"]>;
  /** The field GID used from which this field was cloned */
  fromPetitionFieldId: Maybe<Scalars["GID"]["output"]>;
  hasCommentsEnabled: Scalars["Boolean"]["output"];
  /** The ID of the petition field. */
  id: Scalars["GID"]["output"];
  /** Determines if the field can be moved or deleted. */
  isFixed: Scalars["Boolean"]["output"];
  /** Determines if the field is visible by the recipients. */
  isInternal: Scalars["Boolean"]["output"];
  /** Determines if the field accepts replies */
  isReadOnly: Scalars["Boolean"]["output"];
  /** Determines if this field allows multiple replies. */
  multiple: Scalars["Boolean"]["output"];
  /** Determines if this field is optional. */
  optional: Scalars["Boolean"]["output"];
  /** The options of the petition field. */
  options: Scalars["JSONObject"]["output"];
  petition: PetitionBase;
  position: Scalars["Int"]["output"];
  /** The replies to the petition field */
  replies: Array<PetitionFieldReply>;
  /** Determines if the field requires approval. */
  requireApproval: Scalars["Boolean"]["output"];
  /** Determines if the field last activity is visible in PDF export. */
  showActivityInPdf: Scalars["Boolean"]["output"];
  /** Determines if the field is visible in PDF export. */
  showInPdf: Scalars["Boolean"]["output"];
  /** The title of the petition field. */
  title: Maybe<Scalars["String"]["output"]>;
  /** The type of the petition field. */
  type: PetitionFieldType;
  unreadCommentCount: Scalars["Int"]["output"];
  /** A JSON object representing the conditions for the field to be visible */
  visibility: Maybe<Scalars["JSONObject"]["output"]>;
};

/** A file attachment on the petition */
export type PetitionFieldAttachment = CreatedAt & {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  field: PetitionField;
  file: FileUpload;
  id: Scalars["GID"]["output"];
};

export type PetitionFieldAttachmentUploadData = {
  attachment: PetitionFieldAttachment;
  presignedPostData: AWSPresignedPostData;
};

/** A comment on a petition field */
export type PetitionFieldComment = {
  /** The author of the comment. */
  author: Maybe<UserOrPetitionAccess>;
  /** The JSON content of the comment. */
  content: Maybe<Scalars["JSON"]["output"]>;
  /** The HTML content of the comment. */
  contentHtml: Maybe<Scalars["String"]["output"]>;
  /** Time when the comment was created. */
  createdAt: Scalars["DateTime"]["output"];
  field: PetitionField;
  /** The ID of the petition field comment. */
  id: Scalars["GID"]["output"];
  isAnonymized: Scalars["Boolean"]["output"];
  /** Whether the comment has been edited after being published. */
  isEdited: Scalars["Boolean"]["output"];
  /** Whether the comment is internal (only visible to org users) or public (visible for users and accesses) */
  isInternal: Scalars["Boolean"]["output"];
  /** Whether the comment has been read or not. */
  isUnread: Scalars["Boolean"]["output"];
  /** The mentions of the comments. */
  mentions: Array<PetitionFieldCommentMention>;
};

export type PetitionFieldCommentMention =
  | PetitionFieldCommentUserGroupMention
  | PetitionFieldCommentUserMention;

/** A user group mention on a petition field comment */
export type PetitionFieldCommentUserGroupMention = {
  mentionedId: Scalars["GID"]["output"];
  userGroup: Maybe<UserGroup>;
};

/** A user mention on a petition field comment */
export type PetitionFieldCommentUserMention = {
  mentionedId: Scalars["GID"]["output"];
  user: Maybe<User>;
};

export type PetitionFieldMini = {
  /** The ID of the petition field. */
  id: Scalars["GID"]["output"];
  /** The options of the petition field. */
  options: Scalars["JSONObject"]["output"];
  /** The title of the petition field. */
  title: Maybe<Scalars["String"]["output"]>;
  /** The type of the petition field. */
  type: PetitionFieldType;
};

/** The progress of the petition */
export type PetitionFieldProgress = {
  /** Number of fields approved */
  approved: Scalars["Int"]["output"];
  /** Number of optional fields not replied or approved */
  optional: Scalars["Int"]["output"];
  /** Number of fields with a reply and not approved */
  replied: Scalars["Int"]["output"];
  /** Total number of fields in the petition */
  total: Scalars["Int"]["output"];
};

/** A reply to a petition field */
export type PetitionFieldReply = Timestamps & {
  /** The content of the reply. */
  content: Scalars["JSONObject"]["output"];
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  /** The petition field for this reply. */
  field: Maybe<PetitionField>;
  /** The ID of the petition field reply. */
  id: Scalars["GID"]["output"];
  isAnonymized: Scalars["Boolean"]["output"];
  /** When the reply was reviewed. */
  lastReviewedAt: Maybe<Scalars["DateTime"]["output"]>;
  /** The person that reviewed the reply. */
  lastReviewedBy: Maybe<User>;
  /** Metadata for this reply. */
  metadata: Scalars["JSONObject"]["output"];
  /** When the reply was created or last updated */
  repliedAt: Scalars["DateTime"]["output"];
  /** The person that created the reply or the last person that edited the reply. */
  repliedBy: Maybe<UserOrPetitionAccess>;
  /** The status of the reply. */
  status: PetitionFieldReplyStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
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
  /** A datepicker with time and timezone field. */
  | "DATE_TIME"
  /** A saerch in Dow Jones field. */
  | "DOW_JONES_KYC"
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
  fromTemplateId?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  locale?: InputMaybe<PetitionLocale>;
  path?: InputMaybe<Scalars["String"]["input"]>;
  permissionTypes?: InputMaybe<Array<PetitionPermissionType>>;
  sharedWith?: InputMaybe<PetitionSharedWithFilter>;
  signature?: InputMaybe<Array<PetitionSignatureStatusFilter>>;
  status?: InputMaybe<Array<PetitionStatus>>;
  tagIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  tags?: InputMaybe<PetitionTagFilter>;
  type?: InputMaybe<PetitionBaseType>;
};

export type PetitionFolder = {
  /** The ID of the petition folder. */
  id: Scalars["ID"]["output"];
  /** The lowest permission the user has in the petitions inside the folder. */
  minimumPermissionType: PetitionPermissionType;
  /** The name of the folder. */
  name: Scalars["String"]["output"];
  /** The full path of the folder. */
  path: Scalars["String"]["output"];
  /** The name petitions in the folder. */
  petitionCount: Scalars["Int"]["output"];
};

export type PetitionListView = {
  data: PetitionListViewData;
  id: Scalars["GID"]["output"];
  isDefault: Scalars["Boolean"]["output"];
  name: Scalars["String"]["output"];
  user: User;
};

export type PetitionListViewColumn =
  | "createdAt"
  | "name"
  | "recipients"
  | "reminders"
  | "sentAt"
  | "sharedWith"
  | "signature"
  | "status"
  | "tagsFilters"
  | "template";

export type PetitionListViewData = {
  columns: Maybe<Array<PetitionListViewColumn>>;
  fromTemplateId: Maybe<Array<Scalars["GID"]["output"]>>;
  path: Scalars["String"]["output"];
  search: Maybe<Scalars["String"]["output"]>;
  searchIn: PetitionListViewSearchIn;
  sharedWith: Maybe<PetitionListViewDataSharedWith>;
  signature: Maybe<Array<PetitionSignatureStatusFilter>>;
  sort: Maybe<PetitionListViewSort>;
  status: Maybe<Array<PetitionStatus>>;
  /** @deprecated use tagsFilters */
  tags: Maybe<Array<Scalars["GID"]["output"]>>;
  tagsFilters: Maybe<PetitionListViewDataTags>;
};

export type PetitionListViewDataInput = {
  columns?: InputMaybe<Array<PetitionListViewColumn>>;
  fromTemplateId?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  path?: InputMaybe<Scalars["String"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  searchIn?: InputMaybe<PetitionListViewSearchIn>;
  sharedWith?: InputMaybe<PetitionSharedWithFilter>;
  signature?: InputMaybe<Array<PetitionSignatureStatusFilter>>;
  sort?: InputMaybe<PetitionListViewSortInput>;
  status?: InputMaybe<Array<PetitionStatus>>;
  tags?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  tagsFilters?: InputMaybe<PetitionTagFilter>;
};

export type PetitionListViewDataSharedWith = {
  filters: Array<PetitionListViewDataSharedWithFilters>;
  operator: FilterSharedWithLogicalOperator;
};

export type PetitionListViewDataSharedWithFilters = {
  operator: FilterSharedWithOperator;
  value: Scalars["ID"]["output"];
};

export type PetitionListViewDataTags = {
  filters: Array<PetitionListViewDataTagsFilters>;
  operator: PetitionTagFilterLogicalOperator;
};

export type PetitionListViewDataTagsFilters = {
  operator: PetitionTagFilterLineOperator;
  value: Array<Scalars["GID"]["output"]>;
};

export type PetitionListViewSearchIn = "CURRENT_FOLDER" | "EVERYWHERE";

export type PetitionListViewSort = {
  direction: PetitionListViewSortDirection;
  field: PetitionListViewSortField;
};

export type PetitionListViewSortDirection = "ASC" | "DESC";

export type PetitionListViewSortField = "createdAt" | "name" | "sentAt";

export type PetitionListViewSortInput = {
  direction: PetitionListViewSortDirection;
  field: PetitionListViewSortField;
};

/** The locale used for rendering the petition to the contact. */
export type PetitionLocale = "en" | "es";

/** A petition message */
export type PetitionMessage = CreatedAt & {
  /** The access of this petition message. */
  access: PetitionAccess;
  /** Tells when the email bounced. */
  bouncedAt: Maybe<Scalars["DateTime"]["output"]>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  /** Tells when the email was delivered. */
  deliveredAt: Maybe<Scalars["DateTime"]["output"]>;
  /** The body of the petition message on HTML format. */
  emailBody: Maybe<Scalars["String"]["output"]>;
  /** The subject of the petition message. */
  emailSubject: Maybe<Scalars["JSON"]["output"]>;
  /** The ID of the petition message. */
  id: Scalars["GID"]["output"];
  isAnonymized: Scalars["Boolean"]["output"];
  /** Tells when the email was opened for the first time. */
  openedAt: Maybe<Scalars["DateTime"]["output"]>;
  /** Time at which the message will be sent. */
  scheduledAt: Maybe<Scalars["DateTime"]["output"]>;
  /** The sender of this petition message. */
  sender: User;
  /** If already sent, the date at which the email was sent. */
  sentAt: Maybe<Scalars["DateTime"]["output"]>;
  /** The status of the petition message */
  status: PetitionMessageStatus;
};

export type PetitionMessageBouncedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
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

export type PetitionPagination = {
  /** The requested slice of items. */
  items: Array<Petition>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type PetitionPermission = {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  /** wether user is subscribed or not to emails and alerts of the petition */
  isSubscribed: Scalars["Boolean"]["output"];
  /** The type of the permission. */
  permissionType: PetitionPermissionType;
  /** The petition linked to the permission. */
  petition: Petition;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
};

/** The type of permission for a petition user. */
export type PetitionPermissionType = "OWNER" | "READ" | "WRITE";

/** The READ and WRITE permissions for a petition user. */
export type PetitionPermissionTypeRW = "READ" | "WRITE";

export type PetitionProfile = {
  petition: Petition;
  profile: Profile;
};

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
  createdAt: Scalars["DateTime"]["output"];
  /** The body of the message in HTML format. */
  emailBody: Maybe<Scalars["String"]["output"]>;
  id: Scalars["GID"]["output"];
  /** The sender of this petition message. */
  sender: Maybe<User>;
  /** The type of the reminder. */
  type: PetitionReminderType;
};

export type PetitionReminderBouncedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
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
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type PetitionSharedUserNotification = PetitionUserNotification & {
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  isRead: Scalars["Boolean"]["output"];
  owner: User;
  permissionType: PetitionPermissionTypeRW;
  petition: PetitionBase;
  sharedWith: Maybe<UserOrUserGroup>;
};

export type PetitionSharedWithFilter = {
  filters: Array<PetitionSharedWithFilterLine>;
  operator: FilterSharedWithLogicalOperator;
};

export type PetitionSharedWithFilterLine = {
  operator: FilterSharedWithOperator;
  value: Scalars["ID"]["input"];
};

export type PetitionSignatureCancelReason =
  | "CANCELLED_BY_USER"
  | "DECLINED_BY_SIGNER"
  | "REQUEST_ERROR"
  | "REQUEST_RESTARTED";

export type PetitionSignatureRequest = Timestamps & {
  auditTrailFilename: Maybe<Scalars["String"]["output"]>;
  cancelReason: Maybe<Scalars["String"]["output"]>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  /** The environment of the petition signature. */
  environment: SignatureOrgIntegrationEnvironment;
  errorCode: Maybe<Scalars["String"]["output"]>;
  errorMessage: Maybe<Scalars["String"]["output"]>;
  extraErrorData: Maybe<Scalars["JSON"]["output"]>;
  id: Scalars["GID"]["output"];
  isAnonymized: Scalars["Boolean"]["output"];
  /** Metadata for this signature request. */
  metadata: Scalars["JSONObject"]["output"];
  petition: Petition;
  /** The signature configuration for the request. */
  signatureConfig: SignatureConfig;
  signedDocumentFilename: Maybe<Scalars["String"]["output"]>;
  signerStatus: Array<PetitionSignatureRequestSignerStatus>;
  /** The status of the petition signature. */
  status: PetitionSignatureRequestStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
};

export type PetitionSignatureRequestSignerStatus = {
  bouncedAt: Maybe<Scalars["DateTime"]["output"]>;
  declinedAt: Maybe<Scalars["DateTime"]["output"]>;
  openedAt: Maybe<Scalars["DateTime"]["output"]>;
  sentAt: Maybe<Scalars["DateTime"]["output"]>;
  signedAt: Maybe<Scalars["DateTime"]["output"]>;
  signer: PetitionSigner;
  /** The signing status of the individual contact. */
  status: Scalars["String"]["output"];
};

export type PetitionSignatureRequestStatus =
  | "CANCELLED"
  | "CANCELLING"
  | "COMPLETED"
  | "ENQUEUED"
  | "PROCESSED"
  | "PROCESSING";

/** Filters petitions by the status of its latest eSignature request. */
export type PetitionSignatureStatusFilter =
  /** Petitions with cancelled eSignatures. Request errors, user cancels, signer declines, etc... */
  | "CANCELLED"
  /** Petition with eSignature completed. Every signer signed the document. */
  | "COMPLETED"
  /** Petitions with configured eSignature that have not yet been started (petition is PENDING). */
  | "NOT_STARTED"
  /** Petitions with no eSignature configured and no past eSignature requests. */
  | "NO_SIGNATURE"
  /** Completed petitions with configured signatures to be started after user reviews the replies. Need to manually start the eSignature. */
  | "PENDING_START"
  /** Petitions with ongoing eSignature process. Awaiting for the signers to sign the document. */
  | "PROCESSING";

/** Information about a signer of the petition */
export type PetitionSigner = {
  contactId: Maybe<Scalars["GID"]["output"]>;
  email: Scalars["String"]["output"];
  firstName: Scalars["String"]["output"];
  fullName: Scalars["String"]["output"];
  lastName: Maybe<Scalars["String"]["output"]>;
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

export type PetitionTagFilter = {
  filters: Array<PetitionTagFilterLine>;
  operator: PetitionTagFilterLogicalOperator;
};

export type PetitionTagFilterLine = {
  operator: PetitionTagFilterLineOperator;
  value: Array<Scalars["GID"]["input"]>;
};

export type PetitionTagFilterLineOperator = "CONTAINS" | "DOES_NOT_CONTAIN" | "IS_EMPTY";

export type PetitionTagFilterLogicalOperator = "AND" | "OR";

/** A petition template */
export type PetitionTemplate = PetitionBase & {
  /** How many months to wait since the petition is closed to anonymize. */
  anonymizeAfterMonths: Maybe<Scalars["Int"]["output"]>;
  /** Purpose of the anonymization */
  anonymizePurpose: Maybe<Scalars["String"]["output"]>;
  /** The attachments linked to this petition */
  attachmentsList: PetitionAttachmentsList;
  backgroundColor: Maybe<Scalars["String"]["output"]>;
  categories: Maybe<Array<Scalars["String"]["output"]>>;
  /** The closing email body of the petition. */
  closingEmailBody: Maybe<Scalars["JSON"]["output"]>;
  /** The body of the optional completing message to be show to recipients */
  completingMessageBody: Maybe<Scalars["JSON"]["output"]>;
  /** The subject of the optional completing message to be show to recipients */
  completingMessageSubject: Maybe<Scalars["String"]["output"]>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  /** Custom user properties */
  customProperties: Scalars["JSONObject"]["output"];
  defaultOnBehalf: Maybe<User>;
  defaultPath: Scalars["String"]["output"];
  defaultPermissions: Array<TemplateDefaultPermission>;
  /** Description of the template. */
  description: Maybe<Scalars["JSON"]["output"]>;
  /** HTML description of the template. */
  descriptionHtml: Maybe<Scalars["String"]["output"]>;
  /** The default effective permissions on the template */
  effectiveDefaultPermissions: Array<EffectivePetitionUserPermission>;
  /** The effective permissions on the petition */
  effectivePermissions: Array<EffectivePetitionUserPermission>;
  /** The body of the petition. */
  emailBody: Maybe<Scalars["JSON"]["output"]>;
  /** The subject of the petition. */
  emailSubject: Maybe<Scalars["String"]["output"]>;
  /** The number of fields in the petition. */
  fieldCount: Scalars["Int"]["output"];
  /** The definition of the petition fields. */
  fields: Array<PetitionField>;
  /** The ID of the petition or template. */
  id: Scalars["GID"]["output"];
  imageUrl: Maybe<Scalars["String"]["output"]>;
  isAnonymized: Scalars["Boolean"]["output"];
  /** Wether the completion message will be shown to the recipients or not. */
  isCompletingMessageEnabled: Scalars["Boolean"]["output"];
  /** Whether the template is publicly available or not */
  isPublic: Scalars["Boolean"]["output"];
  /**
   * Whether the contents card is hidden in the recipient view.
   * @deprecated Don't use this
   */
  isRecipientViewContentsHidden: Scalars["Boolean"]["output"];
  isRestricted: Scalars["Boolean"]["output"];
  isRestrictedWithPassword: Scalars["Boolean"]["output"];
  /** The locale of the parallel. */
  locale: PetitionLocale;
  /** Metadata for this petition. */
  metadata: Scalars["JSONObject"]["output"];
  /** The effective permission of the logged user. Will return null if the user doesn't have access to the petition (e.g. on public templates). */
  myEffectivePermission: Maybe<EffectivePetitionUserPermission>;
  /** The name of the petition. */
  name: Maybe<Scalars["String"]["output"]>;
  organization: Organization;
  owner: User;
  path: Scalars["String"]["output"];
  /** The permissions linked to the petition */
  permissions: Array<PetitionPermission>;
  /** The public link linked to this template */
  publicLink: Maybe<PublicPetitionLink>;
  /** The reminders configuration for the petition. */
  remindersConfig: Maybe<RemindersConfig>;
  selectedDocumentTheme: OrganizationTheme;
  /** The signature configuration for the petition. */
  signatureConfig: Maybe<SignatureConfig>;
  /** Whether to skip the forward security check on the recipient view. */
  skipForwardSecurity: Scalars["Boolean"]["output"];
  /** The tags linked to the petition */
  tags: Array<Tag>;
  /** The preferred tone of organization. */
  tone: Tone;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
};

/** A petition template */
export type PetitionTemplateimageUrlArgs = {
  options?: InputMaybe<ImageOptions>;
};

/** The permission for a petition and user group */
export type PetitionUserGroupPermission = PetitionPermission &
  Timestamps & {
    /** Time when the resource was created. */
    createdAt: Scalars["DateTime"]["output"];
    /** The group linked to the permission */
    group: UserGroup;
    /** wether user is subscribed or not to emails and alerts of the petition */
    isSubscribed: Scalars["Boolean"]["output"];
    /** The type of the permission. */
    permissionType: PetitionPermissionType;
    /** The petition linked to the permission. */
    petition: Petition;
    /** Time when the resource was last updated. */
    updatedAt: Scalars["DateTime"]["output"];
  };

export type PetitionUserNotification = {
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  isRead: Scalars["Boolean"]["output"];
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
    createdAt: Scalars["DateTime"]["output"];
    /** wether user is subscribed or not to emails and alerts of the petition */
    isSubscribed: Scalars["Boolean"]["output"];
    /** The type of the permission. */
    permissionType: PetitionPermissionType;
    /** The petition linked to the permission. */
    petition: Petition;
    /** Time when the resource was last updated. */
    updatedAt: Scalars["DateTime"]["output"];
    /** The user linked to the permission */
    user: User;
  };

export type Profile = Timestamps & {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  /** The events for the profile. */
  events: ProfileEventPagination;
  id: Scalars["GID"]["output"];
  name: Scalars["String"]["output"];
  permanentDeletionAt: Maybe<Scalars["DateTime"]["output"]>;
  petitions: PetitionPagination;
  profileType: ProfileType;
  properties: Array<ProfileFieldProperty>;
  status: ProfileStatus;
  subscribers: Array<ProfileSubscription>;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
};

export type ProfileeventsArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ProfilepetitionsArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type ProfileAnonymizedEvent = ProfileEvent & {
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  profile: Maybe<Profile>;
  type: ProfileEventType;
};

export type ProfileAssociatedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<Petition>;
  profile: Maybe<Profile>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type ProfileClosedEvent = ProfileEvent & {
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  profile: Maybe<Profile>;
  type: ProfileEventType;
  user: Maybe<User>;
};

export type ProfileCreatedEvent = ProfileEvent & {
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  profile: Maybe<Profile>;
  type: ProfileEventType;
  user: Maybe<User>;
};

export type ProfileDisassociatedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<Petition>;
  profile: Maybe<Profile>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type ProfileEvent = {
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  profile: Maybe<Profile>;
  type: ProfileEventType;
};

export type ProfileEventPagination = {
  /** The requested slice of items. */
  items: Array<ProfileEvent>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type ProfileEventType =
  | "PETITION_ASSOCIATED"
  | "PETITION_DISASSOCIATED"
  | "PROFILE_ANONYMIZED"
  | "PROFILE_CLOSED"
  | "PROFILE_CREATED"
  | "PROFILE_FIELD_EXPIRY_UPDATED"
  | "PROFILE_FIELD_FILE_ADDED"
  | "PROFILE_FIELD_FILE_REMOVED"
  | "PROFILE_FIELD_VALUE_UPDATED"
  | "PROFILE_REOPENED"
  | "PROFILE_SCHEDULED_FOR_DELETION";

export type ProfileFieldExpiryUpdatedEvent = ProfileEvent & {
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  profile: Maybe<Profile>;
  type: ProfileEventType;
  user: Maybe<User>;
};

export type ProfileFieldFile = ProfileFieldResponse & {
  /** Time when the response was anonymized. */
  anonymizedAt: Maybe<Scalars["DateTime"]["output"]>;
  /** Time when the response was created. */
  createdAt: Scalars["DateTime"]["output"];
  createdBy: Maybe<User>;
  /** Expiration datetime of the value, considering organization's timezone. */
  expiresAt: Maybe<Scalars["DateTime"]["output"]>;
  expiryDate: Maybe<Scalars["String"]["output"]>;
  field: ProfileTypeField;
  file: Maybe<FileUpload>;
  id: Scalars["GID"]["output"];
  profile: Profile;
  /** Time when the response was removed. */
  removedAt: Maybe<Scalars["DateTime"]["output"]>;
  removedBy: Maybe<User>;
};

export type ProfileFieldFileAddedEvent = ProfileEvent & {
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  profile: Maybe<Profile>;
  type: ProfileEventType;
  user: Maybe<User>;
};

export type ProfileFieldFileRemovedEvent = ProfileEvent & {
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  profile: Maybe<Profile>;
  type: ProfileEventType;
  user: Maybe<User>;
};

export type ProfileFieldFileWithUploadData = {
  file: ProfileFieldFile;
  presignedPostData: AWSPresignedPostData;
};

export type ProfileFieldProperty = {
  field: ProfileTypeField;
  files: Maybe<Array<ProfileFieldFile>>;
  profile: Profile;
  value: Maybe<ProfileFieldValue>;
};

export type ProfileFieldPropertyAndFileWithUploadData = {
  property: ProfileFieldProperty;
  uploads: Array<ProfileFieldFileWithUploadData>;
};

export type ProfileFieldPropertyPagination = {
  /** The requested slice of items. */
  items: Array<ProfileFieldProperty>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type ProfileFieldResponse = {
  /** Time when the response was anonymized. */
  anonymizedAt: Maybe<Scalars["DateTime"]["output"]>;
  /** Time when the response was created. */
  createdAt: Scalars["DateTime"]["output"];
  createdBy: Maybe<User>;
  /** Expiration datetime of the value, considering organization's timezone. */
  expiresAt: Maybe<Scalars["DateTime"]["output"]>;
  expiryDate: Maybe<Scalars["String"]["output"]>;
  field: ProfileTypeField;
  profile: Profile;
  /** Time when the response was removed. */
  removedAt: Maybe<Scalars["DateTime"]["output"]>;
  removedBy: Maybe<User>;
};

export type ProfileFieldValue = ProfileFieldResponse & {
  /** Time when the response was anonymized. */
  anonymizedAt: Maybe<Scalars["DateTime"]["output"]>;
  content: Maybe<Scalars["JSONObject"]["output"]>;
  /** Time when the response was created. */
  createdAt: Scalars["DateTime"]["output"];
  createdBy: Maybe<User>;
  /** Expiration datetime of the value, considering organization's timezone. */
  expiresAt: Maybe<Scalars["DateTime"]["output"]>;
  expiryDate: Maybe<Scalars["String"]["output"]>;
  field: ProfileTypeField;
  id: Scalars["GID"]["output"];
  profile: Profile;
  /** Time when the response was removed. */
  removedAt: Maybe<Scalars["DateTime"]["output"]>;
  removedBy: Maybe<User>;
};

export type ProfileFieldValueUpdatedEvent = ProfileEvent & {
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  profile: Maybe<Profile>;
  type: ProfileEventType;
  user: Maybe<User>;
};

export type ProfileFilter = {
  profileId?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  profileTypeId?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  status?: InputMaybe<Array<ProfileStatus>>;
};

export type ProfilePagination = {
  /** The requested slice of items. */
  items: Array<Profile>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type ProfilePropertyFilter = {
  profileTypeFieldId?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  profileTypeId?: InputMaybe<Array<Scalars["GID"]["input"]>>;
};

export type ProfileReopenedEvent = ProfileEvent & {
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  profile: Maybe<Profile>;
  type: ProfileEventType;
  user: Maybe<User>;
};

export type ProfileScheduledForDeletionEvent = ProfileEvent & {
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  profile: Maybe<Profile>;
  type: ProfileEventType;
  user: Maybe<User>;
};

export type ProfileStatus = "CLOSED" | "DELETION_SCHEDULED" | "OPEN";

export type ProfileSubscription = {
  id: Scalars["GID"]["output"];
  user: User;
};

export type ProfileType = Timestamps & {
  /** Time when the response was created. */
  archivedAt: Maybe<Scalars["DateTime"]["output"]>;
  archivedBy: Maybe<User>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  fields: Array<ProfileTypeField>;
  id: Scalars["GID"]["output"];
  name: Scalars["LocalizableUserText"]["output"];
  profileNamePattern: Scalars["String"]["output"];
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
};

export type ProfileTypeField = {
  alias: Maybe<Scalars["String"]["output"]>;
  defaultPermission: ProfileTypeFieldPermissionType;
  expiryAlertAheadTime: Maybe<Scalars["Duration"]["output"]>;
  id: Scalars["GID"]["output"];
  isExpirable: Scalars["Boolean"]["output"];
  isUsedInProfileName: Scalars["Boolean"]["output"];
  myPermission: ProfileTypeFieldPermissionType;
  name: Scalars["LocalizableUserText"]["output"];
  options: Scalars["JSONObject"]["output"];
  permissions: Array<ProfileTypeFieldPermission>;
  position: Scalars["Int"]["output"];
  profileType: ProfileType;
  type: ProfileTypeFieldType;
};

export type ProfileTypeFieldPermission = {
  id: Scalars["GID"]["output"];
  permission: ProfileTypeFieldPermissionType;
  target: UserOrUserGroup;
};

export type ProfileTypeFieldPermissionType = "HIDDEN" | "READ" | "WRITE";

export type ProfileTypeFieldType = "DATE" | "FILE" | "NUMBER" | "PHONE" | "SHORT_TEXT" | "TEXT";

export type ProfileTypeFilter = {
  onlyArchived?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type ProfileTypePagination = {
  /** The requested slice of items. */
  items: Array<ProfileType>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type PublicAccessVerification = {
  cookieName: Maybe<Scalars["String"]["output"]>;
  cookieValue: Maybe<Scalars["String"]["output"]>;
  email: Maybe<Scalars["String"]["output"]>;
  isAllowed: Scalars["Boolean"]["output"];
  isContactlessAccess: Maybe<Scalars["Boolean"]["output"]>;
  organization: Maybe<PublicOrganization>;
  ownerName: Maybe<Scalars["String"]["output"]>;
};

/** A public view of a contact */
export type PublicContact = {
  /** The email of the user. */
  email: Scalars["String"]["output"];
  /** The first name of the user. */
  firstName: Scalars["String"]["output"];
  /** The full name of the user. */
  fullName: Scalars["String"]["output"];
  /** The ID of the contact. */
  id: Scalars["GID"]["output"];
  /** The initials of the user. */
  initials: Maybe<Scalars["String"]["output"]>;
  isMe: Scalars["Boolean"]["output"];
  /** The last name of the user. */
  lastName: Maybe<Scalars["String"]["output"]>;
};

export type PublicCreateFileUploadReply = {
  presignedPostData: AWSPresignedPostData;
  reply: PublicPetitionFieldReply;
};

export type PublicLicenseCode = {
  code: Scalars["String"]["output"];
  details: Scalars["JSONObject"]["output"];
  source: Scalars["String"]["output"];
};

/** A public view of an organization */
export type PublicOrganization = {
  brandTheme: OrganizationBrandThemeData;
  /** If this organization has the REMOVE_PARALLEL_BRANDING feature flag enabled */
  hasRemoveParallelBranding: Scalars["Boolean"]["output"];
  /** The ID of the organization. */
  id: Scalars["GID"]["output"];
  /** The logo of the organization. */
  logoUrl: Maybe<Scalars["String"]["output"]>;
  /** The name of the organization. */
  name: Scalars["String"]["output"];
};

/** A public view of an organization */
export type PublicOrganizationlogoUrlArgs = {
  options?: InputMaybe<ImageOptions>;
};

/** A public view of the petition */
export type PublicPetition = Timestamps & {
  /** The body of the optional completing message to be show to recipients. */
  completingMessageBody: Maybe<Scalars["String"]["output"]>;
  /** The subject of the optional completing message to be show to recipients */
  completingMessageSubject: Maybe<Scalars["String"]["output"]>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  /** The deadline of the petition. */
  deadline: Maybe<Scalars["DateTime"]["output"]>;
  /** The field definition of the petition. */
  fields: Array<PublicPetitionField>;
  /** Shows if the petition has unread comments */
  hasUnreadComments: Scalars["Boolean"]["output"];
  /** The ID of the petition. */
  id: Scalars["GID"]["output"];
  /** Wether the completion message will be shown to the recipients or not. */
  isCompletingMessageEnabled: Scalars["Boolean"]["output"];
  /**
   * Whether the contents card is hidden in the recipient view.
   * @deprecated Don't use this
   */
  isRecipientViewContentsHidden: Scalars["Boolean"]["output"];
  /** The locale of the parallel. */
  locale: PetitionLocale;
  /** The organization of the petition. */
  organization: PublicOrganization;
  /** The progress of the petition. */
  progress: PublicPetitionFieldProgress;
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
  updatedAt: Scalars["DateTime"]["output"];
};

/** A public view of a petition access */
export type PublicPetitionAccess = {
  contact: Maybe<PublicContact>;
  createdAt: Scalars["DateTime"]["output"];
  granter: Maybe<PublicUser>;
  hasClientPortalAccess: Scalars["Boolean"]["output"];
  keycode: Scalars["ID"]["output"];
  message: Maybe<PublicPetitionMessage>;
  petition: PublicPetition;
};

export type PublicPetitionAccessPagination = {
  /** The requested slice of items. */
  items: Array<PublicPetitionAccess>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

/** A field within a petition. */
export type PublicPetitionField = {
  /** Alias of the petition field. */
  alias: Maybe<Scalars["String"]["output"]>;
  /** A list of files attached to this field. */
  attachments: Array<PetitionFieldAttachment>;
  commentCount: Scalars["Int"]["output"];
  /** The comments for this field. */
  comments: Array<PublicPetitionFieldComment>;
  /** The description of the petition field. */
  description: Maybe<Scalars["String"]["output"]>;
  hasCommentsEnabled: Scalars["Boolean"]["output"];
  /** The ID of the petition field. */
  id: Scalars["GID"]["output"];
  /** Determines if the field is visible by the recipients. */
  isInternal: Scalars["Boolean"]["output"];
  /** Determines if the field accepts replies */
  isReadOnly: Scalars["Boolean"]["output"];
  /** Determines if this field allows multiple replies. */
  multiple: Scalars["Boolean"]["output"];
  /** Determines if this field is optional. */
  optional: Scalars["Boolean"]["output"];
  /** The options of the petition field. */
  options: Scalars["JSONObject"]["output"];
  petition: PublicPetition;
  /** The replies to the petition field */
  replies: Array<PublicPetitionFieldReply>;
  /** The title of the petition field. */
  title: Maybe<Scalars["String"]["output"]>;
  /** The type of the petition field. */
  type: PetitionFieldType;
  unreadCommentCount: Scalars["Int"]["output"];
  /** A JSON object representing the conditions for the field to be visible */
  visibility: Maybe<Scalars["JSONObject"]["output"]>;
};

/** A comment on a petition field */
export type PublicPetitionFieldComment = {
  /** The author of the comment. */
  author: Maybe<PublicUserOrContact>;
  /** The JSON content of the comment. */
  content: Maybe<Scalars["JSON"]["output"]>;
  /** The HTML content of the comment. */
  contentHtml: Maybe<Scalars["String"]["output"]>;
  /** Time when the comment was created. */
  createdAt: Scalars["DateTime"]["output"];
  field: PublicPetitionField;
  /** The ID of the petition field comment. */
  id: Scalars["GID"]["output"];
  isAnonymized: Scalars["Boolean"]["output"];
  /** Whether the comment has been read or not. */
  isUnread: Scalars["Boolean"]["output"];
};

/** The progress of a petition. */
export type PublicPetitionFieldProgress = {
  /** Number of optional fields not replied or approved */
  optional: Scalars["Int"]["output"];
  /** Number of fields with a reply and not approved */
  replied: Scalars["Int"]["output"];
  /** Total number of fields in the petition */
  total: Scalars["Int"]["output"];
};

/** A reply to a petition field */
export type PublicPetitionFieldReply = Timestamps & {
  /** The public content of the reply */
  content: Scalars["JSONObject"]["output"];
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  field: PublicPetitionField;
  /** The ID of the petition field reply. */
  id: Scalars["GID"]["output"];
  isAnonymized: Scalars["Boolean"]["output"];
  /** The status of the petition field reply. */
  status: PetitionFieldReplyStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
};

export type PublicPetitionLink = {
  allowMultiplePetitions: Scalars["Boolean"]["output"];
  description: Scalars["String"]["output"];
  id: Scalars["GID"]["output"];
  isActive: Scalars["Boolean"]["output"];
  owner: User;
  petitionNamePattern: Maybe<Scalars["String"]["output"]>;
  prefillSecret: Maybe<Scalars["String"]["output"]>;
  slug: Scalars["String"]["output"];
  template: PetitionTemplate;
  title: Scalars["String"]["output"];
  url: Scalars["String"]["output"];
};

/** A public message in a petition */
export type PublicPetitionMessage = {
  /** The ID of the message. */
  id: Scalars["GID"]["output"];
  /** Date when the petition was first sent */
  sentAt: Maybe<Scalars["DateTime"]["output"]>;
  /** Subject of a email. */
  subject: Maybe<Scalars["String"]["output"]>;
};

export type PublicPetitionSignerDataInput = {
  email: Scalars["String"]["input"];
  firstName: Scalars["String"]["input"];
  lastName: Scalars["String"]["input"];
};

export type PublicPublicPetitionLink = {
  allowMultiplePetitions: Scalars["Boolean"]["output"];
  description: Scalars["String"]["output"];
  isActive: Scalars["Boolean"]["output"];
  /** If the organization has enough credits to send a petition with this public link or not */
  isAvailable: Scalars["Boolean"]["output"];
  owner: PublicUser;
  slug: Scalars["String"]["output"];
  title: Scalars["String"]["output"];
};

export type PublicRemindersOptOut = {
  orgLogoUrl: Maybe<Scalars["String"]["output"]>;
  orgName: Scalars["String"]["output"];
};

/** The public signature settings of a petition */
export type PublicSignatureConfig = {
  /** The signers assigned by the petition recipient */
  additionalSigners: Array<PetitionSigner>;
  /** If true, allows the recipients or users of the petition to select additional signers */
  allowAdditionalSigners: Scalars["Boolean"]["output"];
  /** If true, lets the user review the replies before starting the signature process */
  review: Scalars["Boolean"]["output"];
  /** The contacts that need to sign the generated document. */
  signers: Array<PetitionSigner>;
};

export type PublicSignatureStatus = "COMPLETED" | "STARTED";

/** A public view of a user */
export type PublicUser = {
  /** The email of the user. */
  email: Scalars["String"]["output"];
  /** The first name of the user. */
  firstName: Maybe<Scalars["String"]["output"]>;
  /** The full name of the user. */
  fullName: Scalars["String"]["output"];
  /** The ID of the user. */
  id: Scalars["GID"]["output"];
  /** The last name of the user. */
  lastName: Maybe<Scalars["String"]["output"]>;
  /** The organization of the user. */
  organization: PublicOrganization;
};

export type PublicUserOrContact = PublicContact | PublicUser;

export type Query = {
  access: PublicPetitionAccess;
  accesses: PublicPetitionAccessPagination;
  contact: Maybe<Contact>;
  /** The contacts of the user */
  contacts: ContactPagination;
  /** Matches the emails passed as argument with a Contact in the database. Returns a list of nullable Contacts */
  contactsByEmail: Array<Maybe<Contact>>;
  dowJonesKycEntityProfile: DowJonesKycEntityProfileResult;
  dowJonesKycEntitySearch: DowJonesKycEntitySearchResultPagination;
  /** Checks if the provided email is available to be registered as a user on Parallel */
  emailIsAvailable: Scalars["Boolean"]["output"];
  expiringProfileProperties: ProfileFieldPropertyPagination;
  /** Exports basic petition + fields configuration as JSON object */
  exportPetitionToJson: SupportMethodResponse;
  /** Get the user who owns an API Token */
  getApiTokenOwner: SupportMethodResponse;
  getSlugForPublicPetitionLink: Scalars["String"]["output"];
  /** Get users or groups from IDs */
  getUsersOrGroups: Array<UserOrUserGroup>;
  /** Decodes the given Global ID into an entity in the database. */
  globalIdDecode: SupportMethodResponse;
  /** Encodes the given ID into a Global ID. */
  globalIdEncode: SupportMethodResponse;
  isValidPublicPetitionLinkSlug: Scalars["Boolean"]["output"];
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
  /** Lists every path of the user's petitions as a string array */
  petitionFolders: Array<Scalars["String"]["output"]>;
  /** Returns information about a petition: The name of the organization and emails of users with access to the petition */
  petitionInformation: SupportMethodResponse;
  /** The petitions of the user */
  petitions: PetitionBaseOrFolderPagination;
  petitionsById: Array<Maybe<PetitionBase>>;
  profile: Profile;
  profileType: ProfileType;
  profileTypes: ProfileTypePagination;
  profiles: ProfilePagination;
  publicLicenseCode: Maybe<PublicLicenseCode>;
  publicOrg: Maybe<PublicOrganization>;
  /** The comments for this field. */
  publicPetitionField: PublicPetitionField;
  publicPetitionLinkBySlug: Maybe<PublicPublicPetitionLink>;
  publicTask: Task;
  publicTemplateCategories: Array<Scalars["String"]["output"]>;
  realMe: User;
  /** Exposes minimal information for reminders page so the contact doesn't need to be verified */
  remindersOptOut: Maybe<PublicRemindersOptOut>;
  /** Search user groups */
  searchUserGroups: Array<UserGroup>;
  /** Search users and user groups */
  searchUsers: Array<UserOrUserGroup>;
  subscriptions: Array<PetitionEventSubscription>;
  /** Paginated list of tags in the organization */
  tags: TagPagination;
  task: Task;
  /** The available templates */
  templates: PetitionBaseOrFolderPagination;
  userGroup: Maybe<UserGroup>;
  /** Paginated list of user groups in the organization */
  userGroups: UserGroupPagination;
};

export type QueryaccessArgs = {
  keycode: Scalars["ID"]["input"];
};

export type QueryaccessesArgs = {
  keycode: Scalars["ID"]["input"];
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  status?: InputMaybe<Array<PetitionStatus>>;
};

export type QuerycontactArgs = {
  id: Scalars["GID"]["input"];
};

export type QuerycontactsArgs = {
  exclude?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  sortBy?: InputMaybe<Array<QueryContacts_OrderBy>>;
};

export type QuerycontactsByEmailArgs = {
  emails: Array<Scalars["String"]["input"]>;
};

export type QuerydowJonesKycEntityProfileArgs = {
  profileId: Scalars["ID"]["input"];
};

export type QuerydowJonesKycEntitySearchArgs = {
  dateOfBirth?: InputMaybe<Scalars["DateTime"]["input"]>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  name: Scalars["String"]["input"];
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryemailIsAvailableArgs = {
  email: Scalars["String"]["input"];
};

export type QueryexpiringProfilePropertiesArgs = {
  filter?: InputMaybe<ProfilePropertyFilter>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryexportPetitionToJsonArgs = {
  petitionId: Scalars["GID"]["input"];
};

export type QuerygetApiTokenOwnerArgs = {
  token: Scalars["String"]["input"];
};

export type QuerygetSlugForPublicPetitionLinkArgs = {
  petitionName?: InputMaybe<Scalars["String"]["input"]>;
};

export type QuerygetUsersOrGroupsArgs = {
  ids: Array<Scalars["ID"]["input"]>;
};

export type QueryglobalIdDecodeArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryglobalIdEncodeArgs = {
  id: Scalars["String"]["input"];
  type: Scalars["String"]["input"];
};

export type QueryisValidPublicPetitionLinkSlugArgs = {
  slug: Scalars["String"]["input"];
};

export type QuerylandingTemplateBySlugArgs = {
  slug: Scalars["String"]["input"];
};

export type QuerylandingTemplatesArgs = {
  categories?: InputMaybe<Array<Scalars["String"]["input"]>>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  locale: PetitionLocale;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QuerymetadataArgs = {
  keycode?: InputMaybe<Scalars["ID"]["input"]>;
};

export type QueryorganizationArgs = {
  id: Scalars["GID"]["input"];
};

export type QueryorganizationsArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  sortBy?: InputMaybe<Array<QueryOrganizations_OrderBy>>;
  status?: InputMaybe<OrganizationStatus>;
};

export type QuerypetitionArgs = {
  id: Scalars["GID"]["input"];
};

export type QuerypetitionEventsArgs = {
  before?: InputMaybe<Scalars["GID"]["input"]>;
  eventTypes?: InputMaybe<Array<PetitionEventType>>;
};

export type QuerypetitionFieldArgs = {
  petitionFieldId: Scalars["GID"]["input"];
  petitionId: Scalars["GID"]["input"];
};

export type QuerypetitionFoldersArgs = {
  currentPath?: InputMaybe<Scalars["String"]["input"]>;
  type: PetitionBaseType;
};

export type QuerypetitionInformationArgs = {
  petitionId: Scalars["GID"]["input"];
};

export type QuerypetitionsArgs = {
  excludeAnonymized?: InputMaybe<Scalars["Boolean"]["input"]>;
  filters?: InputMaybe<PetitionFilter>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  searchByNameOnly?: InputMaybe<Scalars["Boolean"]["input"]>;
  sortBy?: InputMaybe<Array<QueryPetitions_OrderBy>>;
};

export type QuerypetitionsByIdArgs = {
  folders?: InputMaybe<FoldersInput>;
  ids?: InputMaybe<Array<Scalars["GID"]["input"]>>;
};

export type QueryprofileArgs = {
  profileId: Scalars["GID"]["input"];
};

export type QueryprofileTypeArgs = {
  profileTypeId: Scalars["GID"]["input"];
};

export type QueryprofileTypesArgs = {
  filter?: InputMaybe<ProfileTypeFilter>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  locale?: InputMaybe<UserLocale>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  sortBy?: InputMaybe<Array<QueryProfileTypes_OrderBy>>;
};

export type QueryprofilesArgs = {
  filter?: InputMaybe<ProfileFilter>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  sortBy?: InputMaybe<Array<QueryProfiles_OrderBy>>;
};

export type QuerypublicLicenseCodeArgs = {
  code: Scalars["String"]["input"];
  token: Scalars["ID"]["input"];
};

export type QuerypublicOrgArgs = {
  id: Scalars["GID"]["input"];
};

export type QuerypublicPetitionFieldArgs = {
  keycode: Scalars["ID"]["input"];
  petitionFieldId: Scalars["GID"]["input"];
};

export type QuerypublicPetitionLinkBySlugArgs = {
  prefill?: InputMaybe<Scalars["String"]["input"]>;
  slug: Scalars["ID"]["input"];
};

export type QuerypublicTaskArgs = {
  keycode: Scalars["ID"]["input"];
  taskId: Scalars["GID"]["input"];
};

export type QueryremindersOptOutArgs = {
  keycode: Scalars["ID"]["input"];
};

export type QuerysearchUserGroupsArgs = {
  excludeUserGroups?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  search: Scalars["String"]["input"];
  type?: InputMaybe<Array<UserGroupType>>;
};

export type QuerysearchUsersArgs = {
  excludeUserGroups?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  excludeUsers?: InputMaybe<Array<Scalars["GID"]["input"]>>;
  includeGroups?: InputMaybe<Scalars["Boolean"]["input"]>;
  includeInactive?: InputMaybe<Scalars["Boolean"]["input"]>;
  search: Scalars["String"]["input"];
};

export type QuerytagsArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  tagIds?: InputMaybe<Array<Scalars["GID"]["input"]>>;
};

export type QuerytaskArgs = {
  id: Scalars["GID"]["input"];
};

export type QuerytemplatesArgs = {
  category?: InputMaybe<Scalars["String"]["input"]>;
  isOwner?: InputMaybe<Scalars["Boolean"]["input"]>;
  isPublic: Scalars["Boolean"]["input"];
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  locale?: InputMaybe<PetitionLocale>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  path?: InputMaybe<Scalars["String"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryuserGroupArgs = {
  id: Scalars["GID"]["input"];
};

export type QueryuserGroupsArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
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

/** Order to use on Query.profileTypes */
export type QueryProfileTypes_OrderBy =
  | "createdAt_ASC"
  | "createdAt_DESC"
  | "name_ASC"
  | "name_DESC";

/** Order to use on Query.profiles */
export type QueryProfiles_OrderBy = "createdAt_ASC" | "createdAt_DESC" | "name_ASC" | "name_DESC";

/** Order to use on Query.userGroups */
export type QueryUserGroups_OrderBy = "createdAt_ASC" | "createdAt_DESC" | "name_ASC" | "name_DESC";

export type RecipientSignedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<Petition>;
  signer: Maybe<PetitionSigner>;
  type: PetitionEventType;
};

export type ReminderEmailBouncedUserNotification = PetitionUserNotification & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  isRead: Scalars["Boolean"]["output"];
  petition: PetitionBase;
};

export type ReminderSentEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<Petition>;
  reminder: PetitionReminder;
  type: PetitionEventType;
};

/** The reminder settings of a petition */
export type RemindersConfig = {
  /** The maximum amount of reminders. */
  limit: Scalars["Int"]["output"];
  /** The amount of days between reminders. */
  offset: Scalars["Int"]["output"];
  /** The time at which the reminder should be sent. */
  time: Scalars["String"]["output"];
  /** The timezone the time is referring to. */
  timezone: Scalars["String"]["output"];
  /** Whether to send reminders only from monday to friday. */
  weekdaysOnly: Scalars["Boolean"]["output"];
};

/** The reminders settings for the petition */
export type RemindersConfigInput = {
  /** The maximum amount of reminders. */
  limit: Scalars["Int"]["input"];
  /** The amount of days between reminders. */
  offset: Scalars["Int"]["input"];
  /** The time at which the reminder should be sent. */
  time: Scalars["String"]["input"];
  /** The timezone the time is referring to. */
  timezone: Scalars["String"]["input"];
  /** Whether to send reminders only from monday to friday. */
  weekdaysOnly: Scalars["Boolean"]["input"];
};

export type RemindersOptOutEvent = PetitionEvent & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  other: Maybe<Scalars["String"]["output"]>;
  petition: Maybe<Petition>;
  reason: Scalars["String"]["output"];
  type: PetitionEventType;
};

export type RemindersOptOutNotification = PetitionUserNotification & {
  access: PetitionAccess;
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  isRead: Scalars["Boolean"]["output"];
  other: Maybe<Scalars["String"]["output"]>;
  petition: PetitionBase;
  reason: Scalars["String"]["output"];
};

export type ReplyCreatedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  createdBy: Maybe<UserOrPetitionAccess>;
  data: Scalars["JSONObject"]["output"];
  field: Maybe<PetitionField>;
  id: Scalars["GID"]["output"];
  petition: Maybe<Petition>;
  reply: Maybe<PetitionFieldReply>;
  type: PetitionEventType;
};

export type ReplyDeletedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  deletedBy: Maybe<UserOrPetitionAccess>;
  field: Maybe<PetitionField>;
  id: Scalars["GID"]["output"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type ReplyStatusChangedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  field: Maybe<PetitionField>;
  id: Scalars["GID"]["output"];
  petition: Maybe<Petition>;
  reply: Maybe<PetitionFieldReply>;
  status: PetitionFieldReplyStatus;
  type: PetitionEventType;
  updatedBy: Maybe<UserOrPetitionAccess>;
};

export type ReplyUpdatedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  field: Maybe<PetitionField>;
  id: Scalars["GID"]["output"];
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
  cancellerReason: Maybe<Scalars["String"]["output"]>;
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  errorCode: Maybe<Scalars["String"]["output"]>;
  errorMessage: Maybe<Scalars["String"]["output"]>;
  extraErrorData: Maybe<Scalars["JSON"]["output"]>;
  id: Scalars["GID"]["output"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type SignatureCancelledUserNotification = PetitionUserNotification & {
  createdAt: Scalars["DateTime"]["output"];
  errorCode: Maybe<Scalars["String"]["output"]>;
  extraErrorData: Maybe<Scalars["JSON"]["output"]>;
  id: Scalars["GID"]["output"];
  isRead: Scalars["Boolean"]["output"];
  petition: PetitionBase;
};

export type SignatureCompletedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type SignatureCompletedUserNotification = PetitionUserNotification & {
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  isRead: Scalars["Boolean"]["output"];
  petition: PetitionBase;
};

/** The signature settings of a petition */
export type SignatureConfig = {
  /** If true, allows the recipients or users of the petition to select additional signers */
  allowAdditionalSigners: Scalars["Boolean"]["output"];
  /** The signature integration selected for this signature config. */
  integration: Maybe<SignatureOrgIntegration>;
  /** If true, lets the user review the replies before starting the signature process */
  review: Scalars["Boolean"]["output"];
  /** The signers of the generated document. */
  signers: Array<Maybe<PetitionSigner>>;
  /** The timezone used to generate the document. */
  timezone: Scalars["String"]["output"];
  /** Title of the signature document */
  title: Maybe<Scalars["String"]["output"]>;
};

/** The signature settings for the petition */
export type SignatureConfigInput = {
  /** If true, allows the recipients or users of the petition to select additional signers */
  allowAdditionalSigners: Scalars["Boolean"]["input"];
  /** The Global ID of the signature integration to be used. */
  orgIntegrationId: Scalars["GID"]["input"];
  /** If true, lets the user review the replies before starting the signature process */
  review: Scalars["Boolean"]["input"];
  signersInfo: Array<SignatureConfigInputSigner>;
  /** The timezone used to generate the document. */
  timezone: Scalars["String"]["input"];
  /** The title of the signing document */
  title?: InputMaybe<Scalars["String"]["input"]>;
};

/** The signer that need to sign the generated document. */
export type SignatureConfigInputSigner = {
  contactId?: InputMaybe<Scalars["GID"]["input"]>;
  email: Scalars["String"]["input"];
  firstName: Scalars["String"]["input"];
  lastName?: InputMaybe<Scalars["String"]["input"]>;
};

export type SignatureOpenedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<Petition>;
  signer: Maybe<PetitionSigner>;
  type: PetitionEventType;
};

export type SignatureOrgIntegration = IOrgIntegration & {
  /** Environment of this integration, to differentiate between sandbox and production-ready integrations */
  environment: SignatureOrgIntegrationEnvironment;
  id: Scalars["GID"]["output"];
  invalidCredentials: Scalars["Boolean"]["output"];
  /** Wether this integration is the default to be used if the user has more than one of the same type */
  isDefault: Scalars["Boolean"]["output"];
  /** Custom name of this integration, provided by the user */
  name: Scalars["String"]["output"];
  provider: SignatureOrgIntegrationProvider;
  /** The type of the integration. */
  type: IntegrationType;
};

export type SignatureOrgIntegrationEnvironment = "DEMO" | "PRODUCTION";

export type SignatureOrgIntegrationProvider = "DOCUSIGN" | "SIGNATURIT";

export type SignatureReminderEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type SignatureStartedEvent = PetitionEvent & {
  bouncedAt: Maybe<Scalars["DateTime"]["output"]>;
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  deliveredAt: Maybe<Scalars["DateTime"]["output"]>;
  id: Scalars["GID"]["output"];
  openedAt: Maybe<Scalars["DateTime"]["output"]>;
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

/** Represents a successful execution. */
export type Success = "SUCCESS";

/** Return type for all support methods */
export type SupportMethodResponse = {
  message: Maybe<Scalars["String"]["output"]>;
  result: Result;
  type: Maybe<Scalars["String"]["output"]>;
};

export type Tag = {
  /** The color of the tag in hex format (example: #FFFFFF) */
  color: Scalars["String"]["output"];
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  name: Scalars["String"]["output"];
};

export type TagPagination = {
  /** The requested slice of items. */
  items: Array<Tag>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type Task = {
  id: Scalars["GID"]["output"];
  name: TaskName;
  output: Maybe<Scalars["JSON"]["output"]>;
  progress: Maybe<Scalars["Int"]["output"]>;
  status: TaskStatus;
};

export type TaskName =
  | "BANKFLIP_SESSION_COMPLETED"
  | "DOW_JONES_PROFILE_DOWNLOAD"
  | "EXPORT_EXCEL"
  | "EXPORT_REPLIES"
  | "PRINT_PDF"
  | "TEMPLATES_OVERVIEW_REPORT"
  | "TEMPLATE_REPLIES_REPORT"
  | "TEMPLATE_STATS_REPORT";

export type TaskResultFile = {
  filename: Scalars["String"]["output"];
  url: Scalars["String"]["output"];
};

export type TaskStatus = "COMPLETED" | "ENQUEUED" | "FAILED" | "PROCESSING";

export type TemplateDefaultPermission = {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  /** wether user is will be subscribed or not to emails and alerts of the generated petition */
  isSubscribed: Scalars["Boolean"]["output"];
  /** The type of the permission. */
  permissionType: PetitionPermissionType;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
};

/** The permission for a petition and user group */
export type TemplateDefaultUserGroupPermission = TemplateDefaultPermission &
  Timestamps & {
    /** Time when the resource was created. */
    createdAt: Scalars["DateTime"]["output"];
    /** The group linked to the permission */
    group: UserGroup;
    id: Scalars["GID"]["output"];
    /** wether user is will be subscribed or not to emails and alerts of the generated petition */
    isSubscribed: Scalars["Boolean"]["output"];
    /** The type of the permission. */
    permissionType: PetitionPermissionType;
    /** Time when the resource was last updated. */
    updatedAt: Scalars["DateTime"]["output"];
  };

/** The permission for a petition and user */
export type TemplateDefaultUserPermission = TemplateDefaultPermission &
  Timestamps & {
    /** Time when the resource was created. */
    createdAt: Scalars["DateTime"]["output"];
    id: Scalars["GID"]["output"];
    /** wether user is will be subscribed or not to emails and alerts of the generated petition */
    isSubscribed: Scalars["Boolean"]["output"];
    /** The type of the permission. */
    permissionType: PetitionPermissionType;
    /** Time when the resource was last updated. */
    updatedAt: Scalars["DateTime"]["output"];
    /** The user linked to the permission */
    user: User;
  };

export type TemplateUsedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  petition: Maybe<Petition>;
  type: PetitionEventType;
};

export type Timestamps = {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
};

/** The preferred tone of organization */
export type Tone = "FORMAL" | "INFORMAL";

export type UpdateContactInput = {
  firstName?: InputMaybe<Scalars["String"]["input"]>;
  lastName?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdatePetitionFieldInput = {
  alias?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  hasCommentsEnabled?: InputMaybe<Scalars["Boolean"]["input"]>;
  isInternal?: InputMaybe<Scalars["Boolean"]["input"]>;
  multiple?: InputMaybe<Scalars["Boolean"]["input"]>;
  optional?: InputMaybe<Scalars["Boolean"]["input"]>;
  options?: InputMaybe<Scalars["JSONObject"]["input"]>;
  requireApproval?: InputMaybe<Scalars["Boolean"]["input"]>;
  showActivityInPdf?: InputMaybe<Scalars["Boolean"]["input"]>;
  showInPdf?: InputMaybe<Scalars["Boolean"]["input"]>;
  title?: InputMaybe<Scalars["String"]["input"]>;
  visibility?: InputMaybe<Scalars["JSONObject"]["input"]>;
};

export type UpdatePetitionFieldReplyInput = {
  content?: InputMaybe<Scalars["JSON"]["input"]>;
  id: Scalars["GID"]["input"];
};

export type UpdatePetitionInput = {
  anonymizeAfterMonths?: InputMaybe<Scalars["Int"]["input"]>;
  anonymizePurpose?: InputMaybe<Scalars["String"]["input"]>;
  closingEmailBody?: InputMaybe<Scalars["JSON"]["input"]>;
  completingMessageBody?: InputMaybe<Scalars["JSON"]["input"]>;
  completingMessageSubject?: InputMaybe<Scalars["String"]["input"]>;
  deadline?: InputMaybe<Scalars["DateTime"]["input"]>;
  defaultOnBehalfId?: InputMaybe<Scalars["GID"]["input"]>;
  defaultPath?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["JSON"]["input"]>;
  emailBody?: InputMaybe<Scalars["JSON"]["input"]>;
  emailSubject?: InputMaybe<Scalars["String"]["input"]>;
  isCompletingMessageEnabled?: InputMaybe<Scalars["Boolean"]["input"]>;
  isRecipientViewContentsHidden?: InputMaybe<Scalars["Boolean"]["input"]>;
  locale?: InputMaybe<PetitionLocale>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  remindersConfig?: InputMaybe<RemindersConfigInput>;
  signatureConfig?: InputMaybe<SignatureConfigInput>;
  skipForwardSecurity?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type UpdateProfileFieldValueInput = {
  content?: InputMaybe<Scalars["JSONObject"]["input"]>;
  expiryDate?: InputMaybe<Scalars["Date"]["input"]>;
  profileTypeFieldId: Scalars["GID"]["input"];
};

export type UpdateProfileTypeFieldInput = {
  alias?: InputMaybe<Scalars["String"]["input"]>;
  expiryAlertAheadTime?: InputMaybe<Scalars["Duration"]["input"]>;
  isExpirable?: InputMaybe<Scalars["Boolean"]["input"]>;
  name?: InputMaybe<Scalars["LocalizableUserText"]["input"]>;
  options?: InputMaybe<Scalars["JSONObject"]["input"]>;
};

export type UpdateProfileTypeFieldPermissionInput = {
  permission: ProfileTypeFieldPermissionType;
  userGroupId?: InputMaybe<Scalars["GID"]["input"]>;
  userId?: InputMaybe<Scalars["GID"]["input"]>;
};

export type UpdateTagInput = {
  color?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateUserGroupInput = {
  name?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateUserGroupPermissionsInput = {
  effect: UpdateUserGroupPermissionsInputEffect;
  name: Scalars["String"]["input"];
};

export type UpdateUserGroupPermissionsInputEffect = "DENY" | "GRANT" | "NONE";

/** A user in the system. */
export type User = Timestamps & {
  /** URL to the user avatar */
  avatarUrl: Maybe<Scalars["String"]["output"]>;
  canCreateUsers: Scalars["Boolean"]["output"];
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  /** Users that the user can send on behalf of */
  delegateOf: Array<User>;
  /** Users that the user allows to send on their behalf */
  delegates: Array<User>;
  /** The email of the user. */
  email: Scalars["String"]["output"];
  /** The first name of the user. */
  firstName: Maybe<Scalars["String"]["output"]>;
  /** The full name of the user. */
  fullName: Maybe<Scalars["String"]["output"]>;
  hasFeatureFlag: Scalars["Boolean"]["output"];
  /** The ID of the user. */
  id: Scalars["GID"]["output"];
  /** The initials of the user. */
  initials: Maybe<Scalars["String"]["output"]>;
  isMe: Scalars["Boolean"]["output"];
  isOrgOwner: Scalars["Boolean"]["output"];
  isSsoUser: Scalars["Boolean"]["output"];
  isSuperAdmin: Scalars["Boolean"]["output"];
  lastActiveAt: Maybe<Scalars["DateTime"]["output"]>;
  /** The last name of the user. */
  lastName: Maybe<Scalars["String"]["output"]>;
  /** Read and unread user notifications about events on their petitions */
  notifications: UserNotifications_Pagination;
  organization: Organization;
  /** Organizations this user belongs to */
  organizations: Array<Organization>;
  permissions: Array<Scalars["String"]["output"]>;
  /** The petition views of the user */
  petitionListViews: Array<PetitionListView>;
  preferredLocale: UserLocale;
  /** @deprecated not used anymore */
  role: Maybe<OrganizationRole>;
  status: UserStatus;
  /** Lists the API tokens this user has. */
  tokens: Array<UserAuthenticationToken>;
  unreadNotificationIds: Array<Scalars["GID"]["output"]>;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
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
  before?: InputMaybe<Scalars["DateTime"]["input"]>;
  filter?: InputMaybe<PetitionUserNotificationFilter>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
};

export type UserAuthenticationToken = CreatedAt & {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  hint: Maybe<Scalars["String"]["output"]>;
  id: Scalars["GID"]["output"];
  lastUsedAt: Maybe<Scalars["DateTime"]["output"]>;
  tokenName: Scalars["String"]["output"];
};

export type UserFilter = {
  status?: InputMaybe<Array<UserStatus>>;
};

export type UserGroup = Timestamps & {
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"]["output"];
  hasPermissions: Scalars["Boolean"]["output"];
  id: Scalars["GID"]["output"];
  imMember: Scalars["Boolean"]["output"];
  initials: Scalars["String"]["output"];
  localizableName: Scalars["LocalizableUserText"]["output"];
  memberCount: Scalars["Int"]["output"];
  members: Array<UserGroupMember>;
  name: Scalars["String"]["output"];
  permissions: Array<UserGroupPermission>;
  type: UserGroupType;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"]["output"];
};

export type UserGroupMember = {
  /** The time the user was added to the user group. */
  addedAt: Scalars["DateTime"]["output"];
  id: Scalars["GID"]["output"];
  user: User;
};

export type UserGroupPagination = {
  /** The requested slice of items. */
  items: Array<UserGroup>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type UserGroupPermission = {
  effect: UserGroupPermissionEffect;
  id: Scalars["GID"]["output"];
  name: Scalars["String"]["output"];
};

export type UserGroupPermissionEffect = "DENY" | "GRANT";

export type UserGroupType = "ALL_USERS" | "INITIAL" | "NORMAL";

/** The preferred locale for the user */
export type UserLocale = "en" | "es";

export type UserNotifications_Pagination = {
  /** Whether this resource has more items. */
  hasMore: Scalars["Boolean"]["output"];
  /** The requested slice of items. */
  items: Array<PetitionUserNotification>;
};

export type UserOrPetitionAccess = PetitionAccess | User;

export type UserOrUserGroup = User | UserGroup;

export type UserOrUserGroupPermissionInput = {
  isSubscribed: Scalars["Boolean"]["input"];
  permissionType: PetitionPermissionType;
  userGroupId?: InputMaybe<Scalars["GID"]["input"]>;
  userId?: InputMaybe<Scalars["GID"]["input"]>;
};

export type UserPagination = {
  /** The requested slice of items. */
  items: Array<User>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"]["output"];
};

export type UserPermissionAddedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  permissionType: PetitionPermissionType;
  permissionUser: Maybe<User>;
  petition: Maybe<Petition>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type UserPermissionEditedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  permissionType: PetitionPermissionType;
  permissionUser: Maybe<User>;
  petition: Maybe<Petition>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type UserPermissionRemovedEvent = PetitionEvent & {
  createdAt: Scalars["DateTime"]["output"];
  data: Scalars["JSONObject"]["output"];
  id: Scalars["GID"]["output"];
  permissionUser: Maybe<User>;
  petition: Maybe<Petition>;
  type: PetitionEventType;
  user: Maybe<User>;
};

export type UserStatus = "ACTIVE" | "INACTIVE" | "ON_HOLD";

export type VerificationCodeCheck = {
  remainingAttempts: Maybe<Scalars["Int"]["output"]>;
  result: Result;
};

export type VerificationCodeRequest = {
  expiresAt: Scalars["DateTime"]["output"];
  remainingAttempts: Scalars["Int"]["output"];
  token: Scalars["ID"]["output"];
};

export type ContactReference_ContactFragment = { id: string; fullName: string };

export type FieldActivity_PetitionFieldReplyFragment = {
  id: string;
  status: PetitionFieldReplyStatus;
  repliedAt: string;
  lastReviewedAt: string | null;
  repliedBy:
    | { __typename: "PetitionAccess"; contact: { id: string; fullName: string } | null }
    | { __typename: "User"; id: string; fullName: string | null }
    | null;
  lastReviewedBy: { id: string; fullName: string | null } | null;
  field: { requireApproval: boolean } | null;
};

export type SignaturesBlock_SignatureConfigFragment = {
  timezone: string;
  signers: Array<{ fullName: string; email: string } | null>;
};

export type UserOrContactReference_UserOrPetitionAccess_PetitionAccess_Fragment = {
  __typename: "PetitionAccess";
  contact: { id: string; fullName: string } | null;
};

export type UserOrContactReference_UserOrPetitionAccess_User_Fragment = {
  __typename: "User";
  id: string;
  fullName: string | null;
};

export type UserOrContactReference_UserOrPetitionAccessFragment =
  | UserOrContactReference_UserOrPetitionAccess_PetitionAccess_Fragment
  | UserOrContactReference_UserOrPetitionAccess_User_Fragment;

export type UserReference_UserFragment = { id: string; fullName: string | null };

export type PetitionExport_PetitionBase_Petition_Fragment = {
  __typename: "Petition";
  id: string;
  name: string | null;
  fromTemplate: { id: string } | null;
  currentSignatureRequest: {
    signatureConfig: {
      timezone: string;
      signers: Array<{ fullName: string; email: string } | null>;
    };
  } | null;
  fields: Array<{
    type: PetitionFieldType;
    multiple: boolean;
    alias: string | null;
    id: string;
    title: string | null;
    options: { [key: string]: any };
    description: string | null;
    showInPdf: boolean;
    showActivityInPdf: boolean;
    visibility: { [key: string]: any } | null;
    replies: Array<{
      content: { [key: string]: any };
      id: string;
      status: PetitionFieldReplyStatus;
      metadata: { [key: string]: any };
      repliedAt: string;
      lastReviewedAt: string | null;
      repliedBy:
        | { __typename: "PetitionAccess"; contact: { id: string; fullName: string } | null }
        | { __typename: "User"; id: string; fullName: string | null }
        | null;
      lastReviewedBy: { id: string; fullName: string | null } | null;
      field: { requireApproval: boolean } | null;
    }>;
  }>;
  organization: { name: string; logoUrl: string | null };
  selectedDocumentTheme: { data: { [key: string]: any } };
};

export type PetitionExport_PetitionBase_PetitionTemplate_Fragment = {
  __typename: "PetitionTemplate";
  id: string;
  name: string | null;
  fields: Array<{
    type: PetitionFieldType;
    multiple: boolean;
    alias: string | null;
    id: string;
    title: string | null;
    options: { [key: string]: any };
    description: string | null;
    showInPdf: boolean;
    showActivityInPdf: boolean;
    visibility: { [key: string]: any } | null;
    replies: Array<{
      content: { [key: string]: any };
      id: string;
      status: PetitionFieldReplyStatus;
      metadata: { [key: string]: any };
      repliedAt: string;
      lastReviewedAt: string | null;
      repliedBy:
        | { __typename: "PetitionAccess"; contact: { id: string; fullName: string } | null }
        | { __typename: "User"; id: string; fullName: string | null }
        | null;
      lastReviewedBy: { id: string; fullName: string | null } | null;
      field: { requireApproval: boolean } | null;
    }>;
  }>;
  organization: { name: string; logoUrl: string | null };
  selectedDocumentTheme: { data: { [key: string]: any } };
};

export type PetitionExport_PetitionBaseFragment =
  | PetitionExport_PetitionBase_Petition_Fragment
  | PetitionExport_PetitionBase_PetitionTemplate_Fragment;

export type PetitionExport_PetitionFieldFragment = {
  id: string;
  type: PetitionFieldType;
  title: string | null;
  options: { [key: string]: any };
  description: string | null;
  showInPdf: boolean;
  showActivityInPdf: boolean;
  visibility: { [key: string]: any } | null;
  replies: Array<{
    id: string;
    status: PetitionFieldReplyStatus;
    content: { [key: string]: any };
    metadata: { [key: string]: any };
    repliedAt: string;
    lastReviewedAt: string | null;
    repliedBy:
      | { __typename: "PetitionAccess"; contact: { id: string; fullName: string } | null }
      | { __typename: "User"; id: string; fullName: string | null }
      | null;
    lastReviewedBy: { id: string; fullName: string | null } | null;
    field: { requireApproval: boolean } | null;
  }>;
};

export type PetitionExport_petitionQueryVariables = Exact<{
  petitionId: Scalars["GID"]["input"];
}>;

export type PetitionExport_petitionQuery = {
  petition:
    | {
        __typename: "Petition";
        id: string;
        name: string | null;
        fromTemplate: { id: string } | null;
        currentSignatureRequest: {
          signatureConfig: {
            timezone: string;
            signers: Array<{ fullName: string; email: string } | null>;
          };
        } | null;
        fields: Array<{
          type: PetitionFieldType;
          multiple: boolean;
          alias: string | null;
          id: string;
          title: string | null;
          options: { [key: string]: any };
          description: string | null;
          showInPdf: boolean;
          showActivityInPdf: boolean;
          visibility: { [key: string]: any } | null;
          replies: Array<{
            content: { [key: string]: any };
            id: string;
            status: PetitionFieldReplyStatus;
            metadata: { [key: string]: any };
            repliedAt: string;
            lastReviewedAt: string | null;
            repliedBy:
              | { __typename: "PetitionAccess"; contact: { id: string; fullName: string } | null }
              | { __typename: "User"; id: string; fullName: string | null }
              | null;
            lastReviewedBy: { id: string; fullName: string | null } | null;
            field: { requireApproval: boolean } | null;
          }>;
        }>;
        organization: { name: string; logoUrl: string | null };
        selectedDocumentTheme: { data: { [key: string]: any } };
      }
    | {
        __typename: "PetitionTemplate";
        id: string;
        name: string | null;
        fields: Array<{
          type: PetitionFieldType;
          multiple: boolean;
          alias: string | null;
          id: string;
          title: string | null;
          options: { [key: string]: any };
          description: string | null;
          showInPdf: boolean;
          showActivityInPdf: boolean;
          visibility: { [key: string]: any } | null;
          replies: Array<{
            content: { [key: string]: any };
            id: string;
            status: PetitionFieldReplyStatus;
            metadata: { [key: string]: any };
            repliedAt: string;
            lastReviewedAt: string | null;
            repliedBy:
              | { __typename: "PetitionAccess"; contact: { id: string; fullName: string } | null }
              | { __typename: "User"; id: string; fullName: string | null }
              | null;
            lastReviewedBy: { id: string; fullName: string | null } | null;
            field: { requireApproval: boolean } | null;
          }>;
        }>;
        organization: { name: string; logoUrl: string | null };
        selectedDocumentTheme: { data: { [key: string]: any } };
      }
    | null;
};

export type useLiquidScope_PetitionBase_Petition_Fragment = {
  id: string;
  fields: Array<{
    type: PetitionFieldType;
    multiple: boolean;
    alias: string | null;
    replies: Array<{ content: { [key: string]: any } }>;
  }>;
};

export type useLiquidScope_PetitionBase_PetitionTemplate_Fragment = {
  id: string;
  fields: Array<{
    type: PetitionFieldType;
    multiple: boolean;
    alias: string | null;
    replies: Array<{ content: { [key: string]: any } }>;
  }>;
};

export type useLiquidScope_PetitionBaseFragment =
  | useLiquidScope_PetitionBase_Petition_Fragment
  | useLiquidScope_PetitionBase_PetitionTemplate_Fragment;

export const UserReference_UserFragmentDoc = gql`
  fragment UserReference_User on User {
    id
    fullName
  }
` as unknown as DocumentNode<UserReference_UserFragment, unknown>;
export const ContactReference_ContactFragmentDoc = gql`
  fragment ContactReference_Contact on Contact {
    id
    fullName
  }
` as unknown as DocumentNode<ContactReference_ContactFragment, unknown>;
export const UserOrContactReference_UserOrPetitionAccessFragmentDoc = gql`
  fragment UserOrContactReference_UserOrPetitionAccess on UserOrPetitionAccess {
    __typename
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
export const FieldActivity_PetitionFieldReplyFragmentDoc = gql`
  fragment FieldActivity_PetitionFieldReply on PetitionFieldReply {
    id
    status
    repliedBy {
      ...UserOrContactReference_UserOrPetitionAccess
    }
    repliedAt
    lastReviewedBy {
      ...UserReference_User
    }
    lastReviewedAt
    field {
      requireApproval
    }
  }
  ${UserOrContactReference_UserOrPetitionAccessFragmentDoc}
  ${UserReference_UserFragmentDoc}
` as unknown as DocumentNode<FieldActivity_PetitionFieldReplyFragment, unknown>;
export const PetitionExport_PetitionFieldFragmentDoc = gql`
  fragment PetitionExport_PetitionField on PetitionField {
    id
    type
    title
    options
    description
    showInPdf
    showActivityInPdf
    visibility
    options
    replies {
      id
      status
      content
      metadata
      ...FieldActivity_PetitionFieldReply
    }
  }
  ${FieldActivity_PetitionFieldReplyFragmentDoc}
` as unknown as DocumentNode<PetitionExport_PetitionFieldFragment, unknown>;
export const SignaturesBlock_SignatureConfigFragmentDoc = gql`
  fragment SignaturesBlock_SignatureConfig on SignatureConfig {
    signers {
      fullName
      email
    }
    timezone
  }
` as unknown as DocumentNode<SignaturesBlock_SignatureConfigFragment, unknown>;
export const useLiquidScope_PetitionBaseFragmentDoc = gql`
  fragment useLiquidScope_PetitionBase on PetitionBase {
    id
    fields {
      type
      multiple
      alias
      replies {
        content
      }
    }
  }
` as unknown as DocumentNode<useLiquidScope_PetitionBaseFragment, unknown>;
export const PetitionExport_PetitionBaseFragmentDoc = gql`
  fragment PetitionExport_PetitionBase on PetitionBase {
    id
    name
    fields {
      ...PetitionExport_PetitionField
    }
    organization {
      name
      logoUrl
    }
    selectedDocumentTheme {
      data
    }
    ... on Petition {
      fromTemplate {
        id
      }
      currentSignatureRequest {
        signatureConfig {
          ...SignaturesBlock_SignatureConfig
        }
      }
    }
    ...useLiquidScope_PetitionBase
    __typename
  }
  ${PetitionExport_PetitionFieldFragmentDoc}
  ${SignaturesBlock_SignatureConfigFragmentDoc}
  ${useLiquidScope_PetitionBaseFragmentDoc}
` as unknown as DocumentNode<PetitionExport_PetitionBaseFragment, unknown>;
export const PetitionExport_petitionDocument = gql`
  query PetitionExport_petition($petitionId: GID!) {
    petition(id: $petitionId) {
      ...PetitionExport_PetitionBase
    }
  }
  ${PetitionExport_PetitionBaseFragmentDoc}
` as unknown as DocumentNode<PetitionExport_petitionQuery, PetitionExport_petitionQueryVariables>;
