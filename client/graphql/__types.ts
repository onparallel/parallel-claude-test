import gql from "graphql-tag";
import * as ApolloReactCommon from "@apollo/react-common";
import * as ApolloReactHooks from "@apollo/react-hooks";
export type Maybe<T> = T | null;
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

export type ChangePasswordResult =
  | "INCORRECT_PASSWORD"
  | "INVALID_NEW_PASSWORD"
  | "SUCCESS";

/** A contact in the system. */
export type Contact = Timestamps & {
  __typename?: "Contact";
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
  /** The sendouts for this contact */
  sendouts: PetitionSendoutPagination;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
};

/** A contact in the system. */
export type ContactsendoutsArgs = {
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

export type CreateTextReplyInput = {
  text: Scalars["String"];
};

export type FileUploadReplyDownloadLinkResult = {
  __typename?: "FileUploadReplyDownloadLinkResult";
  result: Result;
  url?: Maybe<Scalars["String"]>;
};

export type Mutation = {
  __typename?: "Mutation";
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
  /** Delete contacts. */
  deleteContacts: Result;
  /** Delete petitions fields. */
  deletePetitionField: Petition;
  /** Delete petitions. */
  deletePetitions: Result;
  /** Generates a download link for a file reply. */
  fileUploadReplyDownloadLink: FileUploadReplyDownloadLinkResult;
  /** Marks a filled petition as ready for review. */
  publicCompletePetition: PublicPetition;
  /** Creates a reply to a file upload field. */
  publicCreateFileUploadReply: CreateFileUploadReply;
  /** Creates a reply to a text field. */
  publicCreateTextReply: PublicPetitionFieldReply;
  /** Deletes a reply to a petition field. */
  publicDeletePetitionReply: Result;
  /** Notifies the backend that the upload is complete. */
  publicFileUploadReplyComplete: PublicPetitionFieldReply;
  /** Sends the petition and creates the corresponding sendouts. */
  sendPetition: SendPetitionResult;
  /** Sends a reminder for the corresponding sendouts. */
  sendReminders: SendReminderResult;
  /** Updates a contact. */
  updateContact: Contact;
  /** Updates the positions of the petition fields */
  updateFieldPositions: Petition;
  /** Updates a petition. */
  updatePetition: Petition;
  /** Updates a petition field. */
  updatePetitionField: PetitionAndField;
  /** Updates the user with the provided data. */
  updateUser: User;
  /** Updates the validation of a petition field. */
  validatePetitionFields: PetitionAndFields;
};

export type MutationchangePasswordArgs = {
  newPassword: Scalars["String"];
  password: Scalars["String"];
};

export type MutationclonePetitionArgs = {
  name?: Maybe<Scalars["String"]>;
  petitionId: Scalars["ID"];
};

export type MutationcreateContactArgs = {
  data: CreateContactInput;
};

export type MutationcreatePetitionArgs = {
  locale: PetitionLocale;
  name: Scalars["String"];
};

export type MutationcreatePetitionFieldArgs = {
  petitionId: Scalars["ID"];
  type: PetitionFieldType;
};

export type MutationdeleteContactsArgs = {
  ids: Array<Scalars["ID"]>;
};

export type MutationdeletePetitionFieldArgs = {
  fieldId: Scalars["ID"];
  petitionId: Scalars["ID"];
};

export type MutationdeletePetitionsArgs = {
  ids: Array<Scalars["ID"]>;
};

export type MutationfileUploadReplyDownloadLinkArgs = {
  petitionId: Scalars["ID"];
  replyId: Scalars["ID"];
};

export type MutationpublicCompletePetitionArgs = {
  keycode: Scalars["ID"];
};

export type MutationpublicCreateFileUploadReplyArgs = {
  data: CreateFileUploadReplyInput;
  fieldId: Scalars["ID"];
  keycode: Scalars["ID"];
};

export type MutationpublicCreateTextReplyArgs = {
  data: CreateTextReplyInput;
  fieldId: Scalars["ID"];
  keycode: Scalars["ID"];
};

export type MutationpublicDeletePetitionReplyArgs = {
  keycode: Scalars["ID"];
  replyId: Scalars["ID"];
};

export type MutationpublicFileUploadReplyCompleteArgs = {
  keycode: Scalars["ID"];
  replyId: Scalars["ID"];
};

export type MutationsendPetitionArgs = {
  petitionId: Scalars["ID"];
  recipients: Array<Scalars["ID"]>;
  scheduledAt?: Maybe<Scalars["DateTime"]>;
};

export type MutationsendRemindersArgs = {
  petitionId: Scalars["ID"];
  sendoutIds: Array<Scalars["ID"]>;
};

export type MutationupdateContactArgs = {
  data: UpdateContactInput;
  id: Scalars["ID"];
};

export type MutationupdateFieldPositionsArgs = {
  fieldIds: Array<Scalars["ID"]>;
  petitionId: Scalars["ID"];
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

export type MutationupdateUserArgs = {
  data: UpdateUserInput;
  id: Scalars["ID"];
};

export type MutationvalidatePetitionFieldsArgs = {
  fieldIds: Array<Scalars["ID"]>;
  petitionId: Scalars["ID"];
  value: Scalars["Boolean"];
};

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
  /** The reminder settings of the petition. */
  reminderSettings?: Maybe<ReminderSettings>;
  /** The sendouts for this petition */
  sendouts: Array<PetitionSendout>;
  /** The status of the petition. */
  status: PetitionStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
};

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

/** A field within a petition. */
export type PetitionField = {
  __typename?: "PetitionField";
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

/** A reply to a petition field */
export type PetitionFieldReply = Timestamps & {
  __typename?: "PetitionFieldReply";
  /** The content of the reply */
  content: Scalars["JSONObject"];
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The ID of the petition field reply. */
  id: Scalars["ID"];
  /** The sendout from where this reply was made. */
  sendout?: Maybe<PetitionSendout>;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
};

/** Type of a petition field */
export type PetitionFieldType =
  /** A file upload field. */
  | "FILE_UPLOAD"
  /** A text field. */
  | "TEXT";

/** The locale used for rendering the petition to the contact. */
export type PetitionLocale = "en" | "es";

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

/** A sendout of a petition */
export type PetitionSendout = Timestamps & {
  __typename?: "PetitionSendout";
  /** Tells when the email bounced. */
  bouncedAt?: Maybe<Scalars["DateTime"]>;
  /** The receiver of the petition through this sendout. */
  contact?: Maybe<Contact>;
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** Tells when the email was delivered. */
  deliveredAt?: Maybe<Scalars["DateTime"]>;
  /** The body of the petition. */
  emailBody?: Maybe<Scalars["JSON"]>;
  /** The subject of the petition. */
  emailSubject?: Maybe<Scalars["String"]>;
  /** The ID of the petition field access. */
  id: Scalars["ID"];
  /** When the next reminder will be sent. */
  nextReminderAt?: Maybe<Scalars["DateTime"]>;
  /** Tells when the email was opened for the first time. */
  openedAt?: Maybe<Scalars["DateTime"]>;
  /** The petition for this sendout. */
  petition?: Maybe<Petition>;
  /** The reminder settings of the petition. */
  reminderSettings?: Maybe<ReminderSettings>;
  /** Time at which the sendout is scheduled. */
  scheduledAt?: Maybe<Scalars["DateTime"]>;
  /** If already sent, the date at which the email was delivered. */
  sentAt?: Maybe<Scalars["DateTime"]>;
  /** The status of the sendout */
  status: PetitionSendoutStatus;
  /** Time when the resource was last updated. */
  updatedAt: Scalars["DateTime"];
};

export type PetitionSendoutPagination = {
  __typename?: "PetitionSendoutPagination";
  /** The requested slice of items. */
  items: Array<PetitionSendout>;
  /** The total count of items in the list. */
  totalCount: Scalars["Int"];
};

/** The status of a sendout. */
export type PetitionSendoutStatus =
  /** The sendout is active and accessible. */
  | "ACTIVE"
  /** The scheduled sendout was cancelled. */
  | "CANCELLED"
  /** The sendout is not active. */
  | "INACTIVE"
  /** The sendout is being processed. */
  | "PROCESSING"
  /** The sendout has been scheduled. */
  | "SCHEDULED";

/** The status of a petition. */
export type PetitionStatus =
  /** The petition has been completed. */
  | "COMPLETED"
  /** The petition has not been sent yet. */
  | "DRAFT"
  /** The petition has been sent and is awaiting completion. */
  | "PENDING";

/** A public view of the petition */
export type PublicPetition = Timestamps & {
  __typename?: "PublicPetition";
  /** Time when the resource was created. */
  createdAt: Scalars["DateTime"];
  /** The deadline of the petition. */
  deadline?: Maybe<Scalars["DateTime"]>;
  /** The body of the petition. */
  emailBody?: Maybe<Scalars["JSON"]>;
  /** The subject of the petition. */
  emailSubject?: Maybe<Scalars["String"]>;
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

/** A field within a petition. */
export type PublicPetitionField = {
  __typename?: "PublicPetitionField";
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

/** A public view of a petition sendout */
export type PublicPetitionSendout = {
  __typename?: "PublicPetitionSendout";
  petition?: Maybe<PublicPetition>;
  sender?: Maybe<PublicUser>;
};

/** A public view of a user */
export type PublicUser = {
  __typename?: "PublicUser";
  /** The first name of the user. */
  firstName?: Maybe<Scalars["String"]>;
  /** The full name of the user. */
  fullName?: Maybe<Scalars["String"]>;
  /** The ID of the user. */
  id: Scalars["ID"];
  /** The last name of the user. */
  lastName?: Maybe<Scalars["String"]>;
};

export type Query = {
  __typename?: "Query";
  contact?: Maybe<Contact>;
  /** The contacts of the user */
  contacts: ContactPagination;
  me: User;
  organization?: Maybe<Organization>;
  petition?: Maybe<Petition>;
  /** The petitions of the user */
  petitions: PetitionPagination;
  sendout?: Maybe<PublicPetitionSendout>;
};

export type QuerycontactArgs = {
  id: Scalars["ID"];
};

export type QuerycontactsArgs = {
  exclude?: Maybe<Array<Scalars["ID"]>>;
  limit?: Maybe<Scalars["Int"]>;
  offset?: Maybe<Scalars["Int"]>;
  search?: Maybe<Scalars["String"]>;
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
  status?: Maybe<PetitionStatus>;
};

export type QuerysendoutArgs = {
  keycode: Scalars["ID"];
};

/** The reminder settings of a petition */
export type ReminderSettings = {
  __typename?: "ReminderSettings";
  /** The amount of days between reminders. */
  offset: Scalars["Int"];
  /** The time at which the reminder should be sent. */
  time: Scalars["String"];
  /** The timezone the time is referring to. */
  timezone: Scalars["String"];
  /** Wether to send reminders only from monday to friday. */
  weekdaysOnly: Scalars["Boolean"];
};

/** The reminder settings of a petition */
export type ReminderSettingsInput = {
  /** The amount of days between reminders. */
  offset: Scalars["Int"];
  /** The time at which the reminder should be sent. */
  time: Scalars["String"];
  /** The timezone the time is referring to. */
  timezone: Scalars["String"];
  /** Whether to send reminders only from monday to friday. */
  weekdaysOnly: Scalars["Boolean"];
};

/** Represents the result of an operation. */
export type Result = "FAILURE" | "SUCCESS";

export type SendPetitionResult = {
  __typename?: "SendPetitionResult";
  petition?: Maybe<Petition>;
  result: Result;
  sendouts?: Maybe<Array<PetitionSendout>>;
};

export type SendReminderResult = {
  __typename?: "SendReminderResult";
  result: Result;
  sendouts?: Maybe<Array<Maybe<PetitionSendout>>>;
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
  reminderSettings?: Maybe<ReminderSettingsInput>;
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

export type RecipientSelect_ContactFragment = { __typename?: "Contact" } & Pick<
  Contact,
  "id" | "fullName" | "email"
>;

export type AppLayout_UserFragment = {
  __typename?: "User";
} & AppLayoutNavbar_UserFragment;

export type AppLayoutNavbar_UserFragment = {
  __typename?: "User";
} & UserMenu_UserFragment;

export type PetitionHeader_PetitionFragment = {
  __typename?: "Petition";
} & Pick<Petition, "id" | "name" | "status" | "updatedAt">;

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

export type PetitionComposeField_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<
  PetitionField,
  "id" | "type" | "title" | "description" | "optional" | "multiple"
>;

export type PetitionComposeFieldSettings_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<PetitionField, "id" | "type" | "optional" | "multiple" | "options">;

export type PetitionComposeFields_PetitionFragment = {
  __typename?: "Petition";
} & {
  fields: Array<
    {
      __typename?: "PetitionField";
    } & PetitionComposeField_PetitionFieldFragment
  >;
};

export type PetitionComposeSettings_ContactFragment = {
  __typename?: "Contact";
} & Pick<Contact, "id" | "fullName" | "email">;

export type PetitionComposeSettings_PetitionFragment = {
  __typename?: "Petition";
} & Pick<Petition, "locale" | "deadline" | "emailSubject" | "emailBody"> & {
    reminderSettings?: Maybe<
      { __typename?: "ReminderSettings" } & Pick<
        ReminderSettings,
        "offset" | "time" | "timezone" | "weekdaysOnly"
      >
    >;
  };

export type PetitionRepliesField_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<PetitionField, "id" | "type" | "title" | "validated"> & {
    replies: Array<
      { __typename?: "PetitionFieldReply" } & Pick<
        PetitionFieldReply,
        "id" | "content" | "createdAt"
      > & {
          sendout?: Maybe<
            { __typename?: "PetitionSendout" } & {
              contact?: Maybe<
                { __typename?: "Contact" } & Pick<
                  Contact,
                  "id" | "fullName" | "email"
                >
              >;
            }
          >;
        }
    >;
  };

export type PetitionScheduledDialog_ContactFragment = {
  __typename?: "Contact";
} & ContactLink_ContactFragment;

export type PetitionSendouts_PetitionFragment = { __typename?: "Petition" } & {
  sendouts: Array<
    {
      __typename?: "PetitionSendout";
    } & PetitionSendouts_PetitionSendoutFragment
  >;
};

export type PetitionSendouts_PetitionSendoutFragment = {
  __typename?: "PetitionSendout";
} & Pick<
  PetitionSendout,
  | "id"
  | "emailSubject"
  | "status"
  | "scheduledAt"
  | "nextReminderAt"
  | "deliveredAt"
  | "bouncedAt"
  | "openedAt"
  | "sentAt"
> & {
    contact?: Maybe<{ __typename?: "Contact" } & ContactLink_ContactFragment>;
  };

export type PetitionSentDialog_ContactFragment = {
  __typename?: "Contact";
} & ContactLink_ContactFragment;

export type PublicPetitionField_PublicPetitionFieldFragment = {
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
  };

export type Contact_ContactFragment = { __typename?: "Contact" } & Pick<
  Contact,
  "id" | "email" | "fullName" | "firstName" | "lastName"
> & {
    sendouts: { __typename?: "PetitionSendoutPagination" } & {
      items: Array<
        { __typename?: "PetitionSendout" } & Pick<PetitionSendout, "id"> & {
            petition?: Maybe<
              { __typename?: "Petition" } & Pick<
                Petition,
                "id" | "name" | "emailSubject" | "status" | "deadline"
              > & {
                  progress: { __typename?: "PetitionProgress" } & Pick<
                    PetitionProgress,
                    "validated" | "replied" | "optional" | "total"
                  >;
                }
            >;
          }
      >;
    };
  };

export type Contact_UserFragment = {
  __typename?: "User";
} & AppLayout_UserFragment;

export type Contact_updateContactMutationVariables = {
  id: Scalars["ID"];
  data: UpdateContactInput;
};

export type Contact_updateContactMutation = { __typename?: "Mutation" } & {
  updateContact: { __typename?: "Contact" } & Contact_ContactFragment;
};

export type ContactQueryVariables = {
  id: Scalars["ID"];
};

export type ContactQuery = { __typename?: "Query" } & {
  contact?: Maybe<{ __typename?: "Contact" } & Contact_ContactFragment>;
};

export type ContactUserQueryVariables = {};

export type ContactUserQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & Contact_UserFragment;
};

export type Contacts_ContactsListFragment = {
  __typename?: "ContactPagination";
} & Pick<ContactPagination, "totalCount"> & {
    items: Array<
      { __typename?: "Contact" } & Pick<
        Contact,
        "id" | "fullName" | "firstName" | "lastName" | "email"
      >
    >;
  };

export type Contacts_UserFragment = {
  __typename?: "User";
} & AppLayout_UserFragment;

export type Contacts_deleteContactsMutationVariables = {
  ids: Array<Scalars["ID"]>;
};

export type Contacts_deleteContactsMutation = {
  __typename?: "Mutation";
} & Pick<Mutation, "deleteContacts">;

export type ContactsQueryVariables = {
  offset: Scalars["Int"];
  limit: Scalars["Int"];
  search?: Maybe<Scalars["String"]>;
};

export type ContactsQuery = { __typename?: "Query" } & {
  contacts: {
    __typename?: "ContactPagination";
  } & Contacts_ContactsListFragment;
};

export type ContactsUserQueryVariables = {};

export type ContactsUserQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & Contacts_UserFragment;
};

export type AppHomeQueryVariables = {};

export type AppHomeQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & AppLayout_UserFragment;
};

export type PetitionCompose_PetitionFragment = {
  __typename?: "Petition";
} & Pick<Petition, "id"> & {
    fields: Array<
      { __typename?: "PetitionField" } & PetitionCompose_PetitionFieldFragment
    >;
  } & PetitionLayout_PetitionFragment &
  PetitionComposeSettings_PetitionFragment;

export type PetitionCompose_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & PetitionComposeField_PetitionFieldFragment &
  PetitionComposeFieldSettings_PetitionFieldFragment;

export type PetitionCompose_UserFragment = {
  __typename?: "User";
} & PetitionLayout_UserFragment;

export type PetitionCompose_updatePetitionMutationVariables = {
  petitionId: Scalars["ID"];
  data: UpdatePetitionInput;
};

export type PetitionCompose_updatePetitionMutation = {
  __typename?: "Mutation";
} & {
  updatePetition: {
    __typename?: "Petition";
  } & PetitionLayout_PetitionFragment &
    PetitionComposeSettings_PetitionFragment;
};

export type PetitionCompose_updateFieldPositionsMutationVariables = {
  petitionId: Scalars["ID"];
  fieldIds: Array<Scalars["ID"]>;
};

export type PetitionCompose_updateFieldPositionsMutation = {
  __typename?: "Mutation";
} & {
  updateFieldPositions: { __typename?: "Petition" } & Pick<Petition, "id"> &
    PetitionLayout_PetitionFragment;
};

export type PetitionCompose_createPetitionFieldMutationVariables = {
  petitionId: Scalars["ID"];
  type: PetitionFieldType;
};

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

export type PetitionCompose_deletePetitionFieldMutationVariables = {
  petitionId: Scalars["ID"];
  fieldId: Scalars["ID"];
};

export type PetitionCompose_deletePetitionFieldMutation = {
  __typename?: "Mutation";
} & {
  deletePetitionField: { __typename?: "Petition" } & Pick<Petition, "id"> &
    PetitionLayout_PetitionFragment;
};

export type PetitionCompose_updatePetitionFieldMutationVariables = {
  petitionId: Scalars["ID"];
  fieldId: Scalars["ID"];
  data: UpdatePetitionFieldInput;
};

export type PetitionCompose_updatePetitionFieldMutation = {
  __typename?: "Mutation";
} & {
  updatePetitionField: { __typename?: "PetitionAndField" } & {
    field: { __typename?: "PetitionField" } & Pick<PetitionField, "id"> &
      PetitionComposeField_PetitionFieldFragment &
      PetitionComposeFieldSettings_PetitionFieldFragment;
    petition: { __typename?: "Petition" } & PetitionLayout_PetitionFragment;
  };
};

export type PetitionCompose_sendPetitionMutationVariables = {
  petitionId: Scalars["ID"];
  recipients: Array<Scalars["ID"]>;
  scheduledAt?: Maybe<Scalars["DateTime"]>;
};

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
      sendouts?: Maybe<
        Array<
          { __typename?: "PetitionSendout" } & Pick<PetitionSendout, "id"> & {
              contact?: Maybe<
                { __typename?: "Contact" } & PetitionSentDialog_ContactFragment
              >;
            }
        >
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

export type PetitionComposeSearchContactsQueryVariables = {
  search?: Maybe<Scalars["String"]>;
  exclude?: Maybe<Array<Scalars["ID"]>>;
};

export type PetitionComposeSearchContactsQuery = { __typename?: "Query" } & {
  contacts: { __typename?: "ContactPagination" } & {
    items: Array<{ __typename?: "Contact" } & RecipientSelect_ContactFragment>;
  };
};

export type PetitionComposeQueryVariables = {
  id: Scalars["ID"];
};

export type PetitionComposeQuery = { __typename?: "Query" } & {
  petition?: Maybe<
    { __typename?: "Petition" } & PetitionCompose_PetitionFragment
  >;
};

export type PetitionComposeUserQueryVariables = {};

export type PetitionComposeUserQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & PetitionCompose_UserFragment;
};

export type PetitionReplies_PetitionFragment = {
  __typename?: "Petition";
} & Pick<Petition, "id"> & {
    fields: Array<
      {
        __typename?: "PetitionField";
      } & PetitionRepliesField_PetitionFieldFragment
    >;
  } & PetitionLayout_PetitionFragment &
  PetitionSendouts_PetitionFragment;

export type PetitionReplies_UserFragment = {
  __typename?: "User";
} & PetitionLayout_UserFragment;

export type PetitionReplies_updatePetitionMutationVariables = {
  petitionId: Scalars["ID"];
  data: UpdatePetitionInput;
};

export type PetitionReplies_updatePetitionMutation = {
  __typename?: "Mutation";
} & {
  updatePetition: {
    __typename?: "Petition";
  } & PetitionReplies_PetitionFragment;
};

export type PetitionReplies_validatePetitionFieldsMutationVariables = {
  petitionId: Scalars["ID"];
  fieldIds: Array<Scalars["ID"]>;
  value: Scalars["Boolean"];
};

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

export type PetitionReplies_fileUploadReplyDownloadLinkMutationVariables = {
  petitionId: Scalars["ID"];
  replyId: Scalars["ID"];
};

export type PetitionReplies_fileUploadReplyDownloadLinkMutation = {
  __typename?: "Mutation";
} & {
  fileUploadReplyDownloadLink: {
    __typename?: "FileUploadReplyDownloadLinkResult";
  } & Pick<FileUploadReplyDownloadLinkResult, "result" | "url">;
};

export type PetitionReplies_sendRemindersMutationVariables = {
  petitionId: Scalars["ID"];
  sendoutIds: Array<Scalars["ID"]>;
};

export type PetitionReplies_sendRemindersMutation = {
  __typename?: "Mutation";
} & {
  sendReminders: { __typename?: "SendReminderResult" } & Pick<
    SendReminderResult,
    "result"
  > & {
      sendouts?: Maybe<
        Array<
          Maybe<
            { __typename?: "PetitionSendout" } & Pick<
              PetitionSendout,
              "id" | "status"
            >
          >
        >
      >;
    };
};

export type PetitionRepliesQueryVariables = {
  id: Scalars["ID"];
};

export type PetitionRepliesQuery = { __typename?: "Query" } & {
  petition?: Maybe<
    { __typename?: "Petition" } & PetitionReplies_PetitionFragment
  >;
};

export type PetitionRepliesUserQueryVariables = {};

export type PetitionRepliesUserQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & PetitionReplies_UserFragment;
};

export type Petitions_PetitionsListFragment = {
  __typename?: "PetitionPagination";
} & Pick<PetitionPagination, "totalCount"> & {
    items: Array<
      { __typename?: "Petition" } & Pick<
        Petition,
        "id" | "customRef" | "name" | "status" | "deadline"
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

export type Petitions_deletePetitionsMutationVariables = {
  ids: Array<Scalars["ID"]>;
};

export type Petitions_deletePetitionsMutation = {
  __typename?: "Mutation";
} & Pick<Mutation, "deletePetitions">;

export type Petitions_clonePetitionMutationVariables = {
  petitionId: Scalars["ID"];
  name?: Maybe<Scalars["String"]>;
};

export type Petitions_clonePetitionMutation = { __typename?: "Mutation" } & {
  clonePetition: { __typename?: "Petition" } & Pick<Petition, "id">;
};

export type PetitionsQueryVariables = {
  offset: Scalars["Int"];
  limit: Scalars["Int"];
  search?: Maybe<Scalars["String"]>;
  status?: Maybe<PetitionStatus>;
};

export type PetitionsQuery = { __typename?: "Query" } & {
  petitions: {
    __typename?: "PetitionPagination";
  } & Petitions_PetitionsListFragment;
};

export type PetitionsUserQueryVariables = {};

export type PetitionsUserQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & Petitions_UserFragment;
};

export type Account_UserFragment = { __typename?: "User" } & Pick<
  User,
  "firstName" | "lastName"
> &
  AppLayout_UserFragment;

export type AccountQueryVariables = {};

export type AccountQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & Pick<User, "id"> & Account_UserFragment;
};

export type Account_updateAccountMutationVariables = {
  id: Scalars["ID"];
  data: UpdateUserInput;
};

export type Account_updateAccountMutation = { __typename?: "Mutation" } & {
  updateUser: { __typename?: "User" } & Pick<
    User,
    "id" | "firstName" | "lastName" | "fullName"
  >;
};

export type SecurityQueryVariables = {};

export type SecurityQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & Pick<User, "id"> & AppLayout_UserFragment;
};

export type Security_updatePasswordMutationVariables = {
  password: Scalars["String"];
  newPassword: Scalars["String"];
};

export type Security_updatePasswordMutation = {
  __typename?: "Mutation";
} & Pick<Mutation, "changePassword">;

export type TemplatesQueryVariables = {};

export type TemplatesQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & AppLayout_UserFragment;
};

export type CurrentUserQueryVariables = {};

export type CurrentUserQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & Pick<User, "fullName" | "email">;
};

export type PublicPetition_PublicPetitionFragment = {
  __typename?: "PublicPetition";
} & Pick<
  PublicPetition,
  "id" | "status" | "deadline" | "emailSubject" | "emailBody"
>;

export type PublicPetition_PublicUserFragment = {
  __typename?: "PublicUser";
} & Pick<PublicUser, "id" | "firstName" | "fullName">;

export type PublicPetition_publicDeletePetitionReplyMutationVariables = {
  replyId: Scalars["ID"];
  keycode: Scalars["ID"];
};

export type PublicPetition_publicDeletePetitionReplyMutation = {
  __typename?: "Mutation";
} & Pick<Mutation, "publicDeletePetitionReply">;

export type PublicPetition_publicCreateTextReplyMutationVariables = {
  keycode: Scalars["ID"];
  fieldId: Scalars["ID"];
  data: CreateTextReplyInput;
};

export type PublicPetition_publicCreateTextReplyMutation = {
  __typename?: "Mutation";
} & {
  publicCreateTextReply: { __typename?: "PublicPetitionFieldReply" } & Pick<
    PublicPetitionFieldReply,
    "id" | "publicContent" | "createdAt"
  >;
};

export type PublicPetition_publicCreateFileUploadReplyMutationVariables = {
  keycode: Scalars["ID"];
  fieldId: Scalars["ID"];
  data: CreateFileUploadReplyInput;
};

export type PublicPetition_publicCreateFileUploadReplyMutation = {
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

export type PublicPetition_publicFileUploadReplyCompleteMutationVariables = {
  keycode: Scalars["ID"];
  replyId: Scalars["ID"];
};

export type PublicPetition_publicFileUploadReplyCompleteMutation = {
  __typename?: "Mutation";
} & {
  publicFileUploadReplyComplete: {
    __typename?: "PublicPetitionFieldReply";
  } & Pick<PublicPetitionFieldReply, "id" | "publicContent">;
};

export type PublicPetition_publicCompletePetitionMutationVariables = {
  keycode: Scalars["ID"];
};

export type PublicPetition_publicCompletePetitionMutation = {
  __typename?: "Mutation";
} & {
  publicCompletePetition: { __typename?: "PublicPetition" } & Pick<
    PublicPetition,
    "id" | "status"
  >;
};

export type PublicPetitionQueryVariables = {
  keycode: Scalars["ID"];
};

export type PublicPetitionQuery = { __typename?: "Query" } & {
  sendout?: Maybe<
    { __typename?: "PublicPetitionSendout" } & {
      petition?: Maybe<
        { __typename?: "PublicPetition" } & {
          fields: Array<
            { __typename?: "PublicPetitionField" } & Pick<
              PublicPetitionField,
              "id"
            > &
              PublicPetitionField_PublicPetitionFieldFragment
          >;
        } & PublicPetition_PublicPetitionFragment
      >;
      sender?: Maybe<
        { __typename?: "PublicUser" } & PublicPetition_PublicUserFragment
      >;
    }
  >;
};

export type PublicPetition_deletePetitionReply_PublicPetitionFieldFragment = {
  __typename?: "PublicPetitionField";
} & {
  replies: Array<
    { __typename?: "PublicPetitionFieldReply" } & Pick<
      PublicPetitionFieldReply,
      "id"
    >
  >;
};

export type PublicPetition_deletePetitionReply_PublicPetitionFragment = {
  __typename?: "PublicPetition";
} & Pick<PublicPetition, "status">;

export type PublicPetition_createTextReply_FieldFragment = {
  __typename?: "PublicPetitionField";
} & {
  replies: Array<
    { __typename?: "PublicPetitionFieldReply" } & Pick<
      PublicPetitionFieldReply,
      "id"
    >
  >;
};

export type PublicPetition_createTextReply_PublicPetitionFragment = {
  __typename?: "PublicPetition";
} & Pick<PublicPetition, "status">;

export type PublicPetition_createFileUploadReply_FieldFragment = {
  __typename?: "PublicPetitionField";
} & {
  replies: Array<
    { __typename?: "PublicPetitionFieldReply" } & Pick<
      PublicPetitionFieldReply,
      "id"
    >
  >;
};

export type PublicPetition_createFileUploadReply_PublicPetitionFragment = {
  __typename?: "PublicPetition";
} & Pick<PublicPetition, "status">;

export type useCreateContact_createContactMutationVariables = {
  data: CreateContactInput;
};

export type useCreateContact_createContactMutation = {
  __typename?: "Mutation";
} & {
  createContact: { __typename?: "Contact" } & Pick<
    Contact,
    "id" | "email" | "firstName" | "lastName" | "fullName"
  >;
};

export type useCreatePetition_createPetitionMutationVariables = {
  name: Scalars["String"];
  locale: PetitionLocale;
};

export type useCreatePetition_createPetitionMutation = {
  __typename?: "Mutation";
} & { createPetition: { __typename?: "Petition" } & Pick<Petition, "id"> };

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
export const PetitionComposeFields_PetitionFragmentDoc = gql`
  fragment PetitionComposeFields_Petition on Petition {
    fields {
      ...PetitionComposeField_PetitionField
    }
  }
  ${PetitionComposeField_PetitionFieldFragmentDoc}
`;
export const PetitionComposeSettings_ContactFragmentDoc = gql`
  fragment PetitionComposeSettings_Contact on Contact {
    id
    fullName
    email
  }
`;
export const ContactLink_ContactFragmentDoc = gql`
  fragment ContactLink_Contact on Contact {
    id
    fullName
    email
  }
`;
export const PetitionScheduledDialog_ContactFragmentDoc = gql`
  fragment PetitionScheduledDialog_Contact on Contact {
    ...ContactLink_Contact
  }
  ${ContactLink_ContactFragmentDoc}
`;
export const PetitionSentDialog_ContactFragmentDoc = gql`
  fragment PetitionSentDialog_Contact on Contact {
    ...ContactLink_Contact
  }
  ${ContactLink_ContactFragmentDoc}
`;
export const PublicPetitionField_PublicPetitionFieldFragmentDoc = gql`
  fragment PublicPetitionField_PublicPetitionField on PublicPetitionField {
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
  }
`;
export const Contact_ContactFragmentDoc = gql`
  fragment Contact_Contact on Contact {
    id
    email
    fullName
    firstName
    lastName
    sendouts(limit: 100) {
      items {
        id
        petition {
          id
          name
          emailSubject
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
    }
  }
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
export const AppLayout_UserFragmentDoc = gql`
  fragment AppLayout_User on User {
    ...AppLayoutNavbar_User
  }
  ${AppLayoutNavbar_UserFragmentDoc}
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
export const PetitionHeader_PetitionFragmentDoc = gql`
  fragment PetitionHeader_Petition on Petition {
    id
    name
    status
    updatedAt
  }
`;
export const PetitionLayout_PetitionFragmentDoc = gql`
  fragment PetitionLayout_Petition on Petition {
    id
    ...PetitionHeader_Petition
  }
  ${PetitionHeader_PetitionFragmentDoc}
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
export const PetitionComposeSettings_PetitionFragmentDoc = gql`
  fragment PetitionComposeSettings_Petition on Petition {
    locale
    deadline
    emailSubject
    emailBody
    reminderSettings {
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
    ...PetitionComposeSettings_Petition
  }
  ${PetitionLayout_PetitionFragmentDoc}
  ${PetitionCompose_PetitionFieldFragmentDoc}
  ${PetitionComposeSettings_PetitionFragmentDoc}
`;
export const PetitionLayout_UserFragmentDoc = gql`
  fragment PetitionLayout_User on User {
    ...AppLayout_User
  }
  ${AppLayout_UserFragmentDoc}
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
export const PetitionRepliesField_PetitionFieldFragmentDoc = gql`
  fragment PetitionRepliesField_PetitionField on PetitionField {
    id
    type
    title
    validated
    replies {
      id
      content
      createdAt
      sendout {
        contact {
          id
          fullName
          email
        }
      }
    }
  }
`;
export const PetitionSendouts_PetitionSendoutFragmentDoc = gql`
  fragment PetitionSendouts_PetitionSendout on PetitionSendout {
    id
    contact {
      ...ContactLink_Contact
    }
    emailSubject
    status
    scheduledAt
    nextReminderAt
    deliveredAt
    bouncedAt
    openedAt
    sentAt
  }
  ${ContactLink_ContactFragmentDoc}
`;
export const PetitionSendouts_PetitionFragmentDoc = gql`
  fragment PetitionSendouts_Petition on Petition {
    sendouts {
      ...PetitionSendouts_PetitionSendout
    }
  }
  ${PetitionSendouts_PetitionSendoutFragmentDoc}
`;
export const PetitionReplies_PetitionFragmentDoc = gql`
  fragment PetitionReplies_Petition on Petition {
    id
    fields {
      ...PetitionRepliesField_PetitionField
    }
    ...PetitionLayout_Petition
    ...PetitionSendouts_Petition
  }
  ${PetitionRepliesField_PetitionFieldFragmentDoc}
  ${PetitionLayout_PetitionFragmentDoc}
  ${PetitionSendouts_PetitionFragmentDoc}
`;
export const PetitionReplies_UserFragmentDoc = gql`
  fragment PetitionReplies_User on User {
    ...PetitionLayout_User
  }
  ${PetitionLayout_UserFragmentDoc}
`;
export const Petitions_PetitionsListFragmentDoc = gql`
  fragment Petitions_PetitionsList on PetitionPagination {
    items {
      id
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
export const PublicPetition_PublicPetitionFragmentDoc = gql`
  fragment PublicPetition_PublicPetition on PublicPetition {
    id
    status
    deadline
    emailSubject
    emailBody
  }
`;
export const PublicPetition_PublicUserFragmentDoc = gql`
  fragment PublicPetition_PublicUser on PublicUser {
    id
    firstName
    fullName
  }
`;
export const PublicPetition_deletePetitionReply_PublicPetitionFieldFragmentDoc = gql`
  fragment PublicPetition_deletePetitionReply_PublicPetitionField on PublicPetitionField {
    replies {
      id
    }
  }
`;
export const PublicPetition_deletePetitionReply_PublicPetitionFragmentDoc = gql`
  fragment PublicPetition_deletePetitionReply_PublicPetition on PublicPetition {
    status
  }
`;
export const PublicPetition_createTextReply_FieldFragmentDoc = gql`
  fragment PublicPetition_createTextReply_Field on PublicPetitionField {
    replies {
      id
    }
  }
`;
export const PublicPetition_createTextReply_PublicPetitionFragmentDoc = gql`
  fragment PublicPetition_createTextReply_PublicPetition on PublicPetition {
    status
  }
`;
export const PublicPetition_createFileUploadReply_FieldFragmentDoc = gql`
  fragment PublicPetition_createFileUploadReply_Field on PublicPetitionField {
    replies {
      id
    }
  }
`;
export const PublicPetition_createFileUploadReply_PublicPetitionFragmentDoc = gql`
  fragment PublicPetition_createFileUploadReply_PublicPetition on PublicPetition {
    status
  }
`;
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
  query Contacts($offset: Int!, $limit: Int!, $search: String) {
    contacts(offset: $offset, limit: $limit, search: $search) {
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
export const AppHomeDocument = gql`
  query AppHome {
    me {
      ...AppLayout_User
    }
  }
  ${AppLayout_UserFragmentDoc}
`;

/**
 * __useAppHomeQuery__
 *
 * To run a query within a React component, call `useAppHomeQuery` and pass it any options that fit your needs.
 * When your component renders, `useAppHomeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAppHomeQuery({
 *   variables: {
 *   },
 * });
 */
export function useAppHomeQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    AppHomeQuery,
    AppHomeQueryVariables
  >
) {
  return ApolloReactHooks.useQuery<AppHomeQuery, AppHomeQueryVariables>(
    AppHomeDocument,
    baseOptions
  );
}
export function useAppHomeLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    AppHomeQuery,
    AppHomeQueryVariables
  >
) {
  return ApolloReactHooks.useLazyQuery<AppHomeQuery, AppHomeQueryVariables>(
    AppHomeDocument,
    baseOptions
  );
}
export type AppHomeQueryHookResult = ReturnType<typeof useAppHomeQuery>;
export type AppHomeLazyQueryHookResult = ReturnType<typeof useAppHomeLazyQuery>;
export type AppHomeQueryResult = ApolloReactCommon.QueryResult<
  AppHomeQuery,
  AppHomeQueryVariables
>;
export const PetitionCompose_updatePetitionDocument = gql`
  mutation PetitionCompose_updatePetition(
    $petitionId: ID!
    $data: UpdatePetitionInput!
  ) {
    updatePetition(petitionId: $petitionId, data: $data) {
      ...PetitionLayout_Petition
      ...PetitionComposeSettings_Petition
    }
  }
  ${PetitionLayout_PetitionFragmentDoc}
  ${PetitionComposeSettings_PetitionFragmentDoc}
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
        ...PetitionLayout_Petition
      }
    }
  }
  ${PetitionComposeField_PetitionFieldFragmentDoc}
  ${PetitionComposeFieldSettings_PetitionFieldFragmentDoc}
  ${PetitionLayout_PetitionFragmentDoc}
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
    $recipients: [ID!]!
    $scheduledAt: DateTime
  ) {
    sendPetition(
      petitionId: $petitionId
      recipients: $recipients
      scheduledAt: $scheduledAt
    ) {
      result
      petition {
        id
        status
      }
      sendouts {
        id
        contact {
          ...PetitionSentDialog_Contact
        }
      }
    }
  }
  ${PetitionSentDialog_ContactFragmentDoc}
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
 *      recipients: // value for 'recipients'
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
  ) {
    fileUploadReplyDownloadLink(petitionId: $petitionId, replyId: $replyId) {
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
export const PetitionReplies_sendRemindersDocument = gql`
  mutation PetitionReplies_sendReminders(
    $petitionId: ID!
    $sendoutIds: [ID!]!
  ) {
    sendReminders(petitionId: $petitionId, sendoutIds: $sendoutIds) {
      result
      sendouts {
        id
        status
      }
    }
  }
`;
export type PetitionReplies_sendRemindersMutationFn = ApolloReactCommon.MutationFunction<
  PetitionReplies_sendRemindersMutation,
  PetitionReplies_sendRemindersMutationVariables
>;

/**
 * __usePetitionReplies_sendRemindersMutation__
 *
 * To run a mutation, you first call `usePetitionReplies_sendRemindersMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePetitionReplies_sendRemindersMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [petitionRepliesSendRemindersMutation, { data, loading, error }] = usePetitionReplies_sendRemindersMutation({
 *   variables: {
 *      petitionId: // value for 'petitionId'
 *      sendoutIds: // value for 'sendoutIds'
 *   },
 * });
 */
export function usePetitionReplies_sendRemindersMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PetitionReplies_sendRemindersMutation,
    PetitionReplies_sendRemindersMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PetitionReplies_sendRemindersMutation,
    PetitionReplies_sendRemindersMutationVariables
  >(PetitionReplies_sendRemindersDocument, baseOptions);
}
export type PetitionReplies_sendRemindersMutationHookResult = ReturnType<
  typeof usePetitionReplies_sendRemindersMutation
>;
export type PetitionReplies_sendRemindersMutationResult = ApolloReactCommon.MutationResult<
  PetitionReplies_sendRemindersMutation
>;
export type PetitionReplies_sendRemindersMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PetitionReplies_sendRemindersMutation,
  PetitionReplies_sendRemindersMutationVariables
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
  mutation Petitions_clonePetition($petitionId: ID!, $name: String) {
    clonePetition(petitionId: $petitionId, name: $name) {
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
    $status: PetitionStatus
  ) {
    petitions(
      offset: $offset
      limit: $limit
      search: $search
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
export const TemplatesDocument = gql`
  query Templates {
    me {
      ...AppLayout_User
    }
  }
  ${AppLayout_UserFragmentDoc}
`;

/**
 * __useTemplatesQuery__
 *
 * To run a query within a React component, call `useTemplatesQuery` and pass it any options that fit your needs.
 * When your component renders, `useTemplatesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTemplatesQuery({
 *   variables: {
 *   },
 * });
 */
export function useTemplatesQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    TemplatesQuery,
    TemplatesQueryVariables
  >
) {
  return ApolloReactHooks.useQuery<TemplatesQuery, TemplatesQueryVariables>(
    TemplatesDocument,
    baseOptions
  );
}
export function useTemplatesLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    TemplatesQuery,
    TemplatesQueryVariables
  >
) {
  return ApolloReactHooks.useLazyQuery<TemplatesQuery, TemplatesQueryVariables>(
    TemplatesDocument,
    baseOptions
  );
}
export type TemplatesQueryHookResult = ReturnType<typeof useTemplatesQuery>;
export type TemplatesLazyQueryHookResult = ReturnType<
  typeof useTemplatesLazyQuery
>;
export type TemplatesQueryResult = ApolloReactCommon.QueryResult<
  TemplatesQuery,
  TemplatesQueryVariables
>;
export const CurrentUserDocument = gql`
  query CurrentUser {
    me {
      fullName
      email
    }
  }
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
export const PublicPetition_publicDeletePetitionReplyDocument = gql`
  mutation PublicPetition_publicDeletePetitionReply(
    $replyId: ID!
    $keycode: ID!
  ) {
    publicDeletePetitionReply(replyId: $replyId, keycode: $keycode)
  }
`;
export type PublicPetition_publicDeletePetitionReplyMutationFn = ApolloReactCommon.MutationFunction<
  PublicPetition_publicDeletePetitionReplyMutation,
  PublicPetition_publicDeletePetitionReplyMutationVariables
>;

/**
 * __usePublicPetition_publicDeletePetitionReplyMutation__
 *
 * To run a mutation, you first call `usePublicPetition_publicDeletePetitionReplyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePublicPetition_publicDeletePetitionReplyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [publicPetitionPublicDeletePetitionReplyMutation, { data, loading, error }] = usePublicPetition_publicDeletePetitionReplyMutation({
 *   variables: {
 *      replyId: // value for 'replyId'
 *      keycode: // value for 'keycode'
 *   },
 * });
 */
export function usePublicPetition_publicDeletePetitionReplyMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PublicPetition_publicDeletePetitionReplyMutation,
    PublicPetition_publicDeletePetitionReplyMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PublicPetition_publicDeletePetitionReplyMutation,
    PublicPetition_publicDeletePetitionReplyMutationVariables
  >(PublicPetition_publicDeletePetitionReplyDocument, baseOptions);
}
export type PublicPetition_publicDeletePetitionReplyMutationHookResult = ReturnType<
  typeof usePublicPetition_publicDeletePetitionReplyMutation
>;
export type PublicPetition_publicDeletePetitionReplyMutationResult = ApolloReactCommon.MutationResult<
  PublicPetition_publicDeletePetitionReplyMutation
>;
export type PublicPetition_publicDeletePetitionReplyMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PublicPetition_publicDeletePetitionReplyMutation,
  PublicPetition_publicDeletePetitionReplyMutationVariables
>;
export const PublicPetition_publicCreateTextReplyDocument = gql`
  mutation PublicPetition_publicCreateTextReply(
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
export type PublicPetition_publicCreateTextReplyMutationFn = ApolloReactCommon.MutationFunction<
  PublicPetition_publicCreateTextReplyMutation,
  PublicPetition_publicCreateTextReplyMutationVariables
>;

/**
 * __usePublicPetition_publicCreateTextReplyMutation__
 *
 * To run a mutation, you first call `usePublicPetition_publicCreateTextReplyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePublicPetition_publicCreateTextReplyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [publicPetitionPublicCreateTextReplyMutation, { data, loading, error }] = usePublicPetition_publicCreateTextReplyMutation({
 *   variables: {
 *      keycode: // value for 'keycode'
 *      fieldId: // value for 'fieldId'
 *      data: // value for 'data'
 *   },
 * });
 */
export function usePublicPetition_publicCreateTextReplyMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PublicPetition_publicCreateTextReplyMutation,
    PublicPetition_publicCreateTextReplyMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PublicPetition_publicCreateTextReplyMutation,
    PublicPetition_publicCreateTextReplyMutationVariables
  >(PublicPetition_publicCreateTextReplyDocument, baseOptions);
}
export type PublicPetition_publicCreateTextReplyMutationHookResult = ReturnType<
  typeof usePublicPetition_publicCreateTextReplyMutation
>;
export type PublicPetition_publicCreateTextReplyMutationResult = ApolloReactCommon.MutationResult<
  PublicPetition_publicCreateTextReplyMutation
>;
export type PublicPetition_publicCreateTextReplyMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PublicPetition_publicCreateTextReplyMutation,
  PublicPetition_publicCreateTextReplyMutationVariables
>;
export const PublicPetition_publicCreateFileUploadReplyDocument = gql`
  mutation PublicPetition_publicCreateFileUploadReply(
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
export type PublicPetition_publicCreateFileUploadReplyMutationFn = ApolloReactCommon.MutationFunction<
  PublicPetition_publicCreateFileUploadReplyMutation,
  PublicPetition_publicCreateFileUploadReplyMutationVariables
>;

/**
 * __usePublicPetition_publicCreateFileUploadReplyMutation__
 *
 * To run a mutation, you first call `usePublicPetition_publicCreateFileUploadReplyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePublicPetition_publicCreateFileUploadReplyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [publicPetitionPublicCreateFileUploadReplyMutation, { data, loading, error }] = usePublicPetition_publicCreateFileUploadReplyMutation({
 *   variables: {
 *      keycode: // value for 'keycode'
 *      fieldId: // value for 'fieldId'
 *      data: // value for 'data'
 *   },
 * });
 */
export function usePublicPetition_publicCreateFileUploadReplyMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PublicPetition_publicCreateFileUploadReplyMutation,
    PublicPetition_publicCreateFileUploadReplyMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PublicPetition_publicCreateFileUploadReplyMutation,
    PublicPetition_publicCreateFileUploadReplyMutationVariables
  >(PublicPetition_publicCreateFileUploadReplyDocument, baseOptions);
}
export type PublicPetition_publicCreateFileUploadReplyMutationHookResult = ReturnType<
  typeof usePublicPetition_publicCreateFileUploadReplyMutation
>;
export type PublicPetition_publicCreateFileUploadReplyMutationResult = ApolloReactCommon.MutationResult<
  PublicPetition_publicCreateFileUploadReplyMutation
>;
export type PublicPetition_publicCreateFileUploadReplyMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PublicPetition_publicCreateFileUploadReplyMutation,
  PublicPetition_publicCreateFileUploadReplyMutationVariables
>;
export const PublicPetition_publicFileUploadReplyCompleteDocument = gql`
  mutation PublicPetition_publicFileUploadReplyComplete(
    $keycode: ID!
    $replyId: ID!
  ) {
    publicFileUploadReplyComplete(keycode: $keycode, replyId: $replyId) {
      id
      publicContent
    }
  }
`;
export type PublicPetition_publicFileUploadReplyCompleteMutationFn = ApolloReactCommon.MutationFunction<
  PublicPetition_publicFileUploadReplyCompleteMutation,
  PublicPetition_publicFileUploadReplyCompleteMutationVariables
>;

/**
 * __usePublicPetition_publicFileUploadReplyCompleteMutation__
 *
 * To run a mutation, you first call `usePublicPetition_publicFileUploadReplyCompleteMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePublicPetition_publicFileUploadReplyCompleteMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [publicPetitionPublicFileUploadReplyCompleteMutation, { data, loading, error }] = usePublicPetition_publicFileUploadReplyCompleteMutation({
 *   variables: {
 *      keycode: // value for 'keycode'
 *      replyId: // value for 'replyId'
 *   },
 * });
 */
export function usePublicPetition_publicFileUploadReplyCompleteMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PublicPetition_publicFileUploadReplyCompleteMutation,
    PublicPetition_publicFileUploadReplyCompleteMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PublicPetition_publicFileUploadReplyCompleteMutation,
    PublicPetition_publicFileUploadReplyCompleteMutationVariables
  >(PublicPetition_publicFileUploadReplyCompleteDocument, baseOptions);
}
export type PublicPetition_publicFileUploadReplyCompleteMutationHookResult = ReturnType<
  typeof usePublicPetition_publicFileUploadReplyCompleteMutation
>;
export type PublicPetition_publicFileUploadReplyCompleteMutationResult = ApolloReactCommon.MutationResult<
  PublicPetition_publicFileUploadReplyCompleteMutation
>;
export type PublicPetition_publicFileUploadReplyCompleteMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PublicPetition_publicFileUploadReplyCompleteMutation,
  PublicPetition_publicFileUploadReplyCompleteMutationVariables
>;
export const PublicPetition_publicCompletePetitionDocument = gql`
  mutation PublicPetition_publicCompletePetition($keycode: ID!) {
    publicCompletePetition(keycode: $keycode) {
      id
      status
    }
  }
`;
export type PublicPetition_publicCompletePetitionMutationFn = ApolloReactCommon.MutationFunction<
  PublicPetition_publicCompletePetitionMutation,
  PublicPetition_publicCompletePetitionMutationVariables
>;

/**
 * __usePublicPetition_publicCompletePetitionMutation__
 *
 * To run a mutation, you first call `usePublicPetition_publicCompletePetitionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePublicPetition_publicCompletePetitionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [publicPetitionPublicCompletePetitionMutation, { data, loading, error }] = usePublicPetition_publicCompletePetitionMutation({
 *   variables: {
 *      keycode: // value for 'keycode'
 *   },
 * });
 */
export function usePublicPetition_publicCompletePetitionMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    PublicPetition_publicCompletePetitionMutation,
    PublicPetition_publicCompletePetitionMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    PublicPetition_publicCompletePetitionMutation,
    PublicPetition_publicCompletePetitionMutationVariables
  >(PublicPetition_publicCompletePetitionDocument, baseOptions);
}
export type PublicPetition_publicCompletePetitionMutationHookResult = ReturnType<
  typeof usePublicPetition_publicCompletePetitionMutation
>;
export type PublicPetition_publicCompletePetitionMutationResult = ApolloReactCommon.MutationResult<
  PublicPetition_publicCompletePetitionMutation
>;
export type PublicPetition_publicCompletePetitionMutationOptions = ApolloReactCommon.BaseMutationOptions<
  PublicPetition_publicCompletePetitionMutation,
  PublicPetition_publicCompletePetitionMutationVariables
>;
export const PublicPetitionDocument = gql`
  query PublicPetition($keycode: ID!) {
    sendout(keycode: $keycode) {
      petition {
        ...PublicPetition_PublicPetition
        fields {
          id
          ...PublicPetitionField_PublicPetitionField
        }
      }
      sender {
        ...PublicPetition_PublicUser
      }
    }
  }
  ${PublicPetition_PublicPetitionFragmentDoc}
  ${PublicPetitionField_PublicPetitionFieldFragmentDoc}
  ${PublicPetition_PublicUserFragmentDoc}
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
  ) {
    createPetition(name: $name, locale: $locale) {
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
