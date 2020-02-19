export type Maybe<T> = T | null;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string,
  String: string,
  Boolean: boolean,
  Int: number,
  Float: number,
  DateTime: string,
};

export enum ChangePasswordResult {
  SUCCESS = 'SUCCESS',
  INCORRECT_PASSWORD = 'INCORRECT_PASSWORD',
  INVALID_NEW_PASSWORD = 'INVALID_NEW_PASSWORD'
}


export type Mutation = {
  updateUser: User,
  changePassword: ChangePasswordResult,
};


export type MutationupdateUserArgs = {
  id: Scalars['ID'],
  data: UpdateUserInput
};


export type MutationchangePasswordArgs = {
  password: Scalars['String'],
  newPassword: Scalars['String']
};

export type Organization = Timestamps & {
  createdAt: Scalars['DateTime'],
  updatedAt: Scalars['DateTime'],
  id: Scalars['ID'],
  name: Scalars['String'],
  identifier: Scalars['String'],
  status: OrganizationStatus,
  users: UserPagination,
};


export type OrganizationusersArgs = {
  offset?: Maybe<Scalars['Int']>,
  limit?: Maybe<Scalars['Int']>
};

export enum OrganizationRole {
  NORMAL = 'NORMAL',
  ADMIN = 'ADMIN'
}

export enum OrganizationStatus {
  DEV = 'DEV',
  DEMO = 'DEMO',
  ACTIVE = 'ACTIVE',
  CHURNED = 'CHURNED'
}

export type Query = {
  organization?: Maybe<Organization>,
  me: User,
};


export type QueryorganizationArgs = {
  id: Scalars['String']
};

export type Timestamps = {
  createdAt: Scalars['DateTime'],
  updatedAt: Scalars['DateTime'],
};

export type UpdateUserInput = {
  firstName?: Maybe<Scalars['String']>,
  lastName?: Maybe<Scalars['String']>,
};

export type User = Timestamps & {
  createdAt: Scalars['DateTime'],
  updatedAt: Scalars['DateTime'],
  id: Scalars['ID'],
  organizationRole: OrganizationRole,
  email: Scalars['String'],
  firstName?: Maybe<Scalars['String']>,
  lastName?: Maybe<Scalars['String']>,
  fullName?: Maybe<Scalars['String']>,
  organization: Organization,
};

export type UserPagination = {
  items: Array<User>,
  totalCount: Scalars['Int'],
};

export type AppLayout_UserFragment = AppLayoutNavbar_UserFragment;

export type AppLayoutNavbar_UserFragment = UserMenu_UserFragment;

export type UserMenu_UserFragment = Pick<User, 'fullName'>;

export type ContactsQueryVariables = {};


export type ContactsQuery = { me: AppLayout_UserFragment };

export type AppHomeQueryVariables = {};


export type AppHomeQuery = { me: AppLayout_UserFragment };

export type PetitionsQueryVariables = {};


export type PetitionsQuery = { me: AppLayout_UserFragment };

export type SendoutsQueryVariables = {};


export type SendoutsQuery = { me: AppLayout_UserFragment };

export type Account_UserFragment = (
  Pick<User, 'firstName' | 'lastName'>
  & AppLayout_UserFragment
);

export type updateAccountMutationVariables = {
  id: Scalars['ID'],
  firstName: Scalars['String'],
  lastName: Scalars['String']
};


export type updateAccountMutation = { updateUser: Pick<User, 'id' | 'firstName' | 'lastName' | 'fullName'> };

export type AccountQueryVariables = {};


export type AccountQuery = { me: (
    Pick<User, 'id'>
    & Account_UserFragment
  ) };

export type updatePasswordMutationVariables = {
  password: Scalars['String'],
  newPassword: Scalars['String']
};


export type updatePasswordMutation = Pick<Mutation, 'changePassword'>;

export type SecurityQueryVariables = {};


export type SecurityQuery = { me: (
    Pick<User, 'id'>
    & AppLayout_UserFragment
  ) };

export type CurrentUserQueryVariables = {};


export type CurrentUserQuery = { me: Pick<User, 'fullName' | 'email'> };
