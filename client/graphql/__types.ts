export type Maybe<T> = T | null;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  DateTime: string;
  JSONObject: { [key: string]: any };
  JSON: any;
};

export type ChangePasswordResult =
  | "SUCCESS"
  | "INCORRECT_PASSWORD"
  | "INVALID_NEW_PASSWORD";

export type Contact = Timestamps & {
  __typename?: "Contact";
  createdAt: Scalars["DateTime"];
  updatedAt: Scalars["DateTime"];
  id: Scalars["ID"];
  email: Scalars["String"];
  firstName?: Maybe<Scalars["String"]>;
  lastName?: Maybe<Scalars["String"]>;
  fullName?: Maybe<Scalars["String"]>;
};

export type ContactPagination = {
  __typename?: "ContactPagination";
  items: Array<Contact>;
  totalCount: Scalars["Int"];
};

export type CreateContactInput = {
  email: Scalars["String"];
  firstName?: Maybe<Scalars["String"]>;
  lastName?: Maybe<Scalars["String"]>;
};

export type Mutation = {
  __typename?: "Mutation";
  createContact: Contact;
  deleteContacts: Result;
  createPetition: Petition;
  deletePetitions: Result;
  updateFieldPositions: Petition;
  updatePetition: Petition;
  createPetitionField: PetitionAndField;
  deletePetitionField: Petition;
  updatePetitionField: PetitionAndField;
  validatePetitionFields: PetitionAndFields;
  updateUser: User;
  changePassword: ChangePasswordResult;
};

export type MutationcreateContactArgs = {
  data: CreateContactInput;
};

export type MutationdeleteContactsArgs = {
  ids: Array<Scalars["ID"]>;
};

export type MutationcreatePetitionArgs = {
  name: Scalars["String"];
  locale: PetitionLocale;
};

export type MutationdeletePetitionsArgs = {
  ids: Array<Scalars["ID"]>;
};

export type MutationupdateFieldPositionsArgs = {
  id: Scalars["ID"];
  fieldIds: Array<Scalars["ID"]>;
};

export type MutationupdatePetitionArgs = {
  id: Scalars["ID"];
  data: UpdatePetitionInput;
};

export type MutationcreatePetitionFieldArgs = {
  id: Scalars["ID"];
  type: PetitionFieldType;
};

export type MutationdeletePetitionFieldArgs = {
  id: Scalars["ID"];
  fieldId: Scalars["ID"];
};

export type MutationupdatePetitionFieldArgs = {
  id: Scalars["ID"];
  fieldId: Scalars["ID"];
  data: UpdatePetitionFieldInput;
};

export type MutationvalidatePetitionFieldsArgs = {
  id: Scalars["ID"];
  fieldIds: Array<Scalars["ID"]>;
  value: Scalars["Boolean"];
};

export type MutationupdateUserArgs = {
  id: Scalars["ID"];
  data: UpdateUserInput;
};

export type MutationchangePasswordArgs = {
  password: Scalars["String"];
  newPassword: Scalars["String"];
};

export type Organization = Timestamps & {
  __typename?: "Organization";
  createdAt: Scalars["DateTime"];
  updatedAt: Scalars["DateTime"];
  id: Scalars["ID"];
  name: Scalars["String"];
  identifier: Scalars["String"];
  status: OrganizationStatus;
  users: UserPagination;
};

export type OrganizationusersArgs = {
  offset?: Maybe<Scalars["Int"]>;
  limit?: Maybe<Scalars["Int"]>;
};

export type OrganizationRole = "NORMAL" | "ADMIN";

export type OrganizationStatus = "DEV" | "DEMO" | "ACTIVE" | "CHURNED";

export type Petition = Timestamps & {
  __typename?: "Petition";
  createdAt: Scalars["DateTime"];
  updatedAt: Scalars["DateTime"];
  id: Scalars["ID"];
  name?: Maybe<Scalars["String"]>;
  customRef?: Maybe<Scalars["String"]>;
  deadline?: Maybe<Scalars["DateTime"]>;
  locale: PetitionLocale;
  status: PetitionStatus;
  fields: Array<PetitionField>;
  emailSubject?: Maybe<Scalars["String"]>;
  emailBody?: Maybe<Scalars["JSON"]>;
  fieldCount: Scalars["Int"];
  progress: PetitionProgress;
  sendouts: Array<PetitionSendout>;
};

export type PetitionAndField = {
  __typename?: "PetitionAndField";
  petition: Petition;
  field: PetitionField;
};

export type PetitionAndFields = {
  __typename?: "PetitionAndFields";
  petition: Petition;
  fields: Array<PetitionField>;
};

export type PetitionField = {
  __typename?: "PetitionField";
  id: Scalars["ID"];
  type: PetitionFieldType;
  title?: Maybe<Scalars["String"]>;
  description?: Maybe<Scalars["String"]>;
  options?: Maybe<Scalars["JSONObject"]>;
  optional: Scalars["Boolean"];
  validated: Scalars["Boolean"];
  replies: Array<PetitionFieldReply>;
};

export type PetitionFieldReply = Timestamps & {
  __typename?: "PetitionFieldReply";
  createdAt: Scalars["DateTime"];
  updatedAt: Scalars["DateTime"];
  id: Scalars["ID"];
  content: Scalars["JSONObject"];
  sendout?: Maybe<PetitionSendout>;
};

export type PetitionFieldType = "FILE_UPLOAD" | "TEXT";

export type PetitionLocale = "en" | "es";

export type PetitionPagination = {
  __typename?: "PetitionPagination";
  items: Array<Petition>;
  totalCount: Scalars["Int"];
};

export type PetitionProgress = {
  __typename?: "PetitionProgress";
  validated: Scalars["Int"];
  replied: Scalars["Int"];
  optional: Scalars["Int"];
  total: Scalars["Int"];
};

export type PetitionSendout = Timestamps & {
  __typename?: "PetitionSendout";
  createdAt: Scalars["DateTime"];
  updatedAt: Scalars["DateTime"];
  id: Scalars["ID"];
  contact?: Maybe<Contact>;
};

export type PetitionStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "PENDING"
  | "READY"
  | "COMPLETED";

export type Query = {
  __typename?: "Query";
  contacts: ContactPagination;
  contact?: Maybe<Contact>;
  organization?: Maybe<Organization>;
  petitions: PetitionPagination;
  petition?: Maybe<Petition>;
  me: User;
};

export type QuerycontactsArgs = {
  offset?: Maybe<Scalars["Int"]>;
  limit?: Maybe<Scalars["Int"]>;
  search?: Maybe<Scalars["String"]>;
  exclude?: Maybe<Array<Scalars["ID"]>>;
};

export type QuerycontactArgs = {
  id: Scalars["ID"];
};

export type QueryorganizationArgs = {
  id: Scalars["String"];
};

export type QuerypetitionsArgs = {
  offset?: Maybe<Scalars["Int"]>;
  limit?: Maybe<Scalars["Int"]>;
  search?: Maybe<Scalars["String"]>;
  status?: Maybe<PetitionStatus>;
};

export type QuerypetitionArgs = {
  id: Scalars["ID"];
};

export type Result = "SUCCESS" | "FAILURE";

export type Timestamps = {
  createdAt: Scalars["DateTime"];
  updatedAt: Scalars["DateTime"];
};

export type UpdatePetitionFieldInput = {
  title?: Maybe<Scalars["String"]>;
  description?: Maybe<Scalars["String"]>;
  options?: Maybe<Scalars["JSONObject"]>;
  optional?: Maybe<Scalars["Boolean"]>;
};

export type UpdatePetitionInput = {
  name?: Maybe<Scalars["String"]>;
  locale?: Maybe<PetitionLocale>;
  deadline?: Maybe<Scalars["DateTime"]>;
  emailSubject?: Maybe<Scalars["String"]>;
  emailBody?: Maybe<Scalars["JSON"]>;
};

export type UpdateUserInput = {
  firstName?: Maybe<Scalars["String"]>;
  lastName?: Maybe<Scalars["String"]>;
};

export type User = Timestamps & {
  __typename?: "User";
  createdAt: Scalars["DateTime"];
  updatedAt: Scalars["DateTime"];
  id: Scalars["ID"];
  organizationRole: OrganizationRole;
  email: Scalars["String"];
  firstName?: Maybe<Scalars["String"]>;
  lastName?: Maybe<Scalars["String"]>;
  fullName?: Maybe<Scalars["String"]>;
  organization: Organization;
};

export type UserPagination = {
  __typename?: "UserPagination";
  items: Array<User>;
  totalCount: Scalars["Int"];
};

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
} & Pick<PetitionField, "id" | "type" | "title" | "description" | "optional">;

export type PetitionComposeFieldSettings_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<PetitionField, "id" | "type" | "optional" | "options">;

export type PetitionReviewField_PetitionFieldFragment = {
  __typename?: "PetitionField";
} & Pick<PetitionField, "id" | "type" | "title" | "validated"> & {
    replies: Array<
      { __typename?: "PetitionFieldReply" } & Pick<
        PetitionFieldReply,
        "id" | "content" | "createdAt"
      > & {
          sendout: Maybe<
            { __typename?: "PetitionSendout" } & {
              contact: Maybe<
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

export type Contacts_deleteContactsMutationVariables = {
  ids: Array<Scalars["ID"]>;
};

export type Contacts_deleteContactsMutation = {
  __typename?: "Mutation";
} & Pick<Mutation, "deleteContacts">;

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
      {
        __typename?: "PetitionField";
      } & PetitionComposeField_PetitionFieldFragment &
        PetitionComposeFieldSettings_PetitionFieldFragment
    >;
  } & PetitionLayout_PetitionFragment;

export type PetitionCompose_UserFragment = {
  __typename?: "User";
} & PetitionLayout_UserFragment;

export type PetitionComposeQueryVariables = {
  id: Scalars["ID"];
};

export type PetitionComposeQuery = { __typename?: "Query" } & {
  petition: Maybe<
    { __typename?: "Petition" } & PetitionCompose_PetitionFragment
  >;
};

export type PetitionComposeUserQueryVariables = {};

export type PetitionComposeUserQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & PetitionCompose_UserFragment;
};

export type PetitionCompose_updatePetitionMutationVariables = {
  id: Scalars["ID"];
  data: UpdatePetitionInput;
};

export type PetitionCompose_updatePetitionMutation = {
  __typename?: "Mutation";
} & {
  updatePetition: {
    __typename?: "Petition";
  } & PetitionCompose_PetitionFragment;
};

export type PetitionCompose_updateFieldPositionsMutationVariables = {
  id: Scalars["ID"];
  fieldIds: Array<Scalars["ID"]>;
};

export type PetitionCompose_updateFieldPositionsMutation = {
  __typename?: "Mutation";
} & {
  updateFieldPositions: { __typename?: "Petition" } & Pick<Petition, "id"> &
    PetitionCompose_PetitionFragment;
};

export type PetitionCompose_createPetitionFieldMutationVariables = {
  id: Scalars["ID"];
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

export type PetitionCompose_CreatePetitionField_PetitionFragment = {
  __typename?: "Petition";
} & {
  fields: Array<{ __typename?: "PetitionField" } & Pick<PetitionField, "id">>;
};

export type PetitionCompose_deletePetitionFieldMutationVariables = {
  id: Scalars["ID"];
  fieldId: Scalars["ID"];
};

export type PetitionCompose_deletePetitionFieldMutation = {
  __typename?: "Mutation";
} & {
  deletePetitionField: { __typename?: "Petition" } & Pick<Petition, "id"> &
    PetitionCompose_PetitionFragment;
};

export type PetitionCompose_updatePetitionFieldMutationVariables = {
  id: Scalars["ID"];
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

export type PetitionReview_PetitionFragment = {
  __typename?: "Petition";
} & Pick<Petition, "id"> & {
    fields: Array<
      {
        __typename?: "PetitionField";
      } & PetitionReviewField_PetitionFieldFragment
    >;
  } & PetitionLayout_PetitionFragment;

export type PetitionReview_UserFragment = {
  __typename?: "User";
} & PetitionLayout_UserFragment;

export type PetitionReviewQueryVariables = {
  id: Scalars["ID"];
};

export type PetitionReviewQuery = { __typename?: "Query" } & {
  petition: Maybe<
    { __typename?: "Petition" } & PetitionReview_PetitionFragment
  >;
};

export type PetitionReviewUserQueryVariables = {};

export type PetitionReviewUserQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & PetitionReview_UserFragment;
};

export type PetitionReview_updatePetitionMutationVariables = {
  id: Scalars["ID"];
  data: UpdatePetitionInput;
};

export type PetitionReview_updatePetitionMutation = {
  __typename?: "Mutation";
} & {
  updatePetition: { __typename?: "Petition" } & PetitionReview_PetitionFragment;
};

export type PetitionReview_validatePetitionFieldsMutationVariables = {
  id: Scalars["ID"];
  fieldIds: Array<Scalars["ID"]>;
  value: Scalars["Boolean"];
};

export type PetitionReview_validatePetitionFieldsMutation = {
  __typename?: "Mutation";
} & {
  validatePetitionFields: { __typename?: "PetitionAndFields" } & {
    fields: Array<
      { __typename?: "PetitionField" } & Pick<PetitionField, "id" | "validated">
    >;
    petition: { __typename?: "Petition" } & PetitionLayout_PetitionFragment;
  };
};

export type PetitionSend_PetitionFragment = { __typename?: "Petition" } & Pick<
  Petition,
  "id" | "locale" | "deadline" | "emailSubject" | "emailBody"
> & {
    sendouts: Array<
      { __typename?: "PetitionSendout" } & Pick<
        PetitionSendout,
        "id" | "createdAt"
      > & {
          contact: Maybe<
            { __typename?: "Contact" } & Pick<
              Contact,
              "id" | "fullName" | "email"
            >
          >;
        }
    >;
  } & PetitionLayout_PetitionFragment;

export type PetitionSend_UserFragment = {
  __typename?: "User";
} & PetitionLayout_UserFragment;

export type PetitionSendQueryVariables = {
  id: Scalars["ID"];
};

export type PetitionSendQuery = { __typename?: "Query" } & {
  petition: Maybe<{ __typename?: "Petition" } & PetitionSend_PetitionFragment>;
};

export type PetitionSendUserQueryVariables = {};

export type PetitionSendUserQuery = { __typename?: "Query" } & {
  me: { __typename?: "User" } & PetitionSend_UserFragment;
};

export type PetitionSend_updatePetitionMutationVariables = {
  id: Scalars["ID"];
  data: UpdatePetitionInput;
};

export type PetitionSend_updatePetitionMutation = {
  __typename?: "Mutation";
} & {
  updatePetition: { __typename?: "Petition" } & PetitionSend_PetitionFragment;
};

export type PetitionSendSearchContactsQueryVariables = {
  search?: Maybe<Scalars["String"]>;
  exclude?: Maybe<Array<Scalars["ID"]>>;
};

export type PetitionSendSearchContactsQuery = { __typename?: "Query" } & {
  contacts: { __typename?: "ContactPagination" } & {
    items: Array<{ __typename?: "Contact" } & RecipientSelect_ContactFragment>;
  };
};

export type Petitions_deletePetitionsMutationVariables = {
  ids: Array<Scalars["ID"]>;
};

export type Petitions_deletePetitionsMutation = {
  __typename?: "Mutation";
} & Pick<Mutation, "deletePetitions">;

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
          sendouts: Array<
            { __typename?: "PetitionSendout" } & {
              contact: Maybe<
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

export type Petitions_UserFragment = {
  __typename?: "User";
} & AppLayout_UserFragment;

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

export type useCreateContact_createContactMutationVariables = {
  data: CreateContactInput;
};

export type useCreateContact_createContactMutation = {
  __typename?: "Mutation";
} & { createContact: { __typename?: "Contact" } & Pick<Contact, "id"> };

export type useCreatePetition_createPetitionMutationVariables = {
  name: Scalars["String"];
  locale: PetitionLocale;
};

export type useCreatePetition_createPetitionMutation = {
  __typename?: "Mutation";
} & { createPetition: { __typename?: "Petition" } & Pick<Petition, "id"> };
