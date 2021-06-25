import {
  PetitionBase,
  User,
  PetitionAccess,
  PetitionPermissionType,
  UserGroup,
  PetitionField,
} from "@parallel/graphql/__types";

const petition = {
  id: "123123Aca",
  name: "KYC_Cuatrecasas_2345",
} as PetitionBase;

const user = {
  __typename: "User",
  id: "adawda1",
  fullName: "Lucas Ramírez",
} as User;

const field = {
  __typename: "PetitionField",
  id: "wadawdf1",
  title: "Field name mock",
} as PetitionField;

const userGroup = {
  __typename: "UserGroup",
  id: "gadawdadawd1",
  name: "Group Mockito 1",
} as UserGroup;

const petitionAccess = {
  __typename: "PetitionAccess",
  id: "adawda1",
  contact: {
    id: "wadwdawd",
    fullName: "Nathan Drake",
    email: "nathan@email.com",
  },
} as PetitionAccess;

const permissionType = "READ" as PetitionPermissionType;

export const notificationsMock = [
  {
    id: "0",
    type: "COMMENT_CREATED",
    petition,
    author: user,
    field,
    isInternal: true,
    createdAt: new Date().getTime(),
    isRead: true,
  },
  {
    id: "1",
    type: "COMMENT_CREATED",
    petition,
    author: petitionAccess,
    field,
    isInternal: false,
    createdAt: new Date().getTime(),
    isRead: true,
  },
  {
    id: "2",
    type: "PETITION_COMPLETED",
    petition,
    access: petitionAccess,
    createdAt: new Date().getTime(),
    isRead: false,
  },
  {
    id: "3",
    type: "SIGNATURE_COMPLETED",
    petition,
    createdAt: new Date().getTime(),
    isRead: false,
  },
  {
    id: "4",
    type: "SIGNATURE_CANCELLED",
    petition,
    createdAt: new Date().getTime(),
    isRead: true,
  },
  {
    id: "5",
    type: "PETITION_SHARED",
    petition,
    owner: user,
    sharedWith: user,
    permissionType,
    createdAt: new Date().getTime(),
    isRead: true,
  },
  {
    id: "6",
    type: "PETITION_SHARED",
    petition,
    owner: user,
    sharedWith: userGroup,
    permissionType,
    createdAt: new Date().getTime(),
    isRead: true,
  },
  {
    id: "7",
    type: "MESSAGE_EMAIL_BOUNCED",
    petition,
    access: petitionAccess,
    createdAt: new Date().getTime(),
    isRead: false,
  },
] as any[];

export const unreadedNotificationsMock = notificationsMock.filter(
  (n) => !n.isRead
);
