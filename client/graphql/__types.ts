export type Maybe<T> = T | null;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  DateTime: string;
  JSON: any;
};

export type ChangePasswordResult =
  | "SUCCESS"
  | "INCORRECT_PASSWORD"
  | "INVALID_NEW_PASSWORD";

export type Contact = Timestamps & {
  createdAt: Scalars["DateTime"];
  updatedAt: Scalars["DateTime"];
  id: Scalars["ID"];
  email: Scalars["String"];
  firstName?: Maybe<Scalars["String"]>;
  lastName?: Maybe<Scalars["String"]>;
  fullName?: Maybe<Scalars["String"]>;
};

export type Mutation = {
  updateUser: User;
  changePassword: ChangePasswordResult;
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
  createdAt: Scalars["DateTime"];
  updatedAt: Scalars["DateTime"];
  id: Scalars["ID"];
  name: Scalars["String"];
  customRef?: Maybe<Scalars["String"]>;
  deadline?: Maybe<Scalars["DateTime"]>;
  locale: Scalars["String"];
  status: PetitionStatus;
  fields: Array<PetitionField>;
  fieldCount: Scalars["Int"];
  progress: PetitionProgress;
  accessess: Array<PetitionAccess>;
};

export type PetitionAccess = {
  id: Scalars["ID"];
  contact?: Maybe<Contact>;
};

export type PetitionField = {
  id: Scalars["ID"];
  type: PetitionFieldType;
  title?: Maybe<Scalars["String"]>;
  description?: Maybe<Scalars["String"]>;
  options?: Maybe<Scalars["JSON"]>;
  optional: Scalars["Boolean"];
  validated: Scalars["Boolean"];
};

export type PetitionFieldType = "FILE_UPLOAD";

export type PetitionPagination = {
  items: Array<Petition>;
  totalCount: Scalars["Int"];
};

export type PetitionProgress = {
  validated: Scalars["Int"];
  replied: Scalars["Int"];
  optional: Scalars["Int"];
  total: Scalars["Int"];
};

export type PetitionStatus = "DRAFT" | "SCHEDULED" | "PENDING" | "COMPLETED";

export type Query = {
  organization?: Maybe<Organization>;
  me: User;
  petitions: PetitionPagination;
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

export type Timestamps = {
  createdAt: Scalars["DateTime"];
  updatedAt: Scalars["DateTime"];
};

export type UpdateUserInput = {
  firstName?: Maybe<Scalars["String"]>;
  lastName?: Maybe<Scalars["String"]>;
};

export type User = Timestamps & {
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
  items: Array<User>;
  totalCount: Scalars["Int"];
};

export type AppLayout_UserFragment = AppLayoutNavbar_UserFragment;

export type AppLayoutNavbar_UserFragment = UserMenu_UserFragment;

export type UserMenu_UserFragment = Pick<User, "fullName">;

export type ContactsQueryVariables = {};

export type ContactsQuery = { me: AppLayout_UserFragment };

export type AppHomeQueryVariables = {};

export type AppHomeQuery = { me: AppLayout_UserFragment };

export type Petitions_PetitionsListFragment = Pick<
  PetitionPagination,
  "totalCount"
> & {
  items: Array<
    Pick<Petition, "id" | "customRef" | "name" | "status" | "deadline"> & {
      progress: Pick<
        PetitionProgress,
        "validated" | "replied" | "optional" | "total"
      >;
      accessess: Array<{
        contact: Maybe<Pick<Contact, "id" | "fullName" | "email">>;
      }>;
    }
  >;
};

export type Petitions_UserFragment = AppLayout_UserFragment;

export type PetitionsQueryVariables = {
  offset: Scalars["Int"];
  limit: Scalars["Int"];
  search?: Maybe<Scalars["String"]>;
  status?: Maybe<PetitionStatus>;
};

export type PetitionsQuery = { petitions: Petitions_PetitionsListFragment };

export type PetitionsUserQueryVariables = {};

export type PetitionsUserQuery = { me: Petitions_UserFragment };

export type Account_UserFragment = Pick<User, "firstName" | "lastName"> &
  AppLayout_UserFragment;

export type updateAccountMutationVariables = {
  id: Scalars["ID"];
  firstName: Scalars["String"];
  lastName: Scalars["String"];
};

export type updateAccountMutation = {
  updateUser: Pick<User, "id" | "firstName" | "lastName" | "fullName">;
};

export type AccountQueryVariables = {};

export type AccountQuery = { me: Pick<User, "id"> & Account_UserFragment };

export type updatePasswordMutationVariables = {
  password: Scalars["String"];
  newPassword: Scalars["String"];
};

export type updatePasswordMutation = Pick<Mutation, "changePassword">;

export type SecurityQueryVariables = {};

export type SecurityQuery = { me: Pick<User, "id"> & AppLayout_UserFragment };

export type TemplatesQueryVariables = {};

export type TemplatesQuery = { me: AppLayout_UserFragment };

export type CurrentUserQueryVariables = {};

export type CurrentUserQuery = { me: Pick<User, "fullName" | "email"> };
