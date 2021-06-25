import {
  PetitionBase,
  User,
  PetitionAccess,
  PetitionPermissionType,
  UserGroup,
  PetitionField,
  PetitionFieldComment,
  Notifications_PetitionUserNotificationFragment,
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

const internalComment = {
  isInternal: true,
  author: user,
} as PetitionFieldComment;

const externalComment = {
  isInternal: false,
  author: petitionAccess,
} as PetitionFieldComment;

const permissionType = "READ" as PetitionPermissionType;

export const notificationsMock = [
  {
    __typename: "CommentCreatedUserNotification",
    id: "0",
    petition: petition,
    field: field,
    comment: internalComment,
    createdAt: new Date().getTime(),
    isRead: true,
  },
  {
    __typename: "CommentCreatedUserNotification",
    id: "1",
    petition: petition,
    field: field,
    comment: externalComment,
    createdAt: new Date().toISOString(),
    isRead: true,
  },
  {
    __typename: "PetitionCompletedUserNotification",
    id: "2",
    petition: petition,
    access: petitionAccess,
    createdAt: new Date().toISOString(),
    isRead: false,
  },
  {
    __typename: "SignatureCompletedUserNotification",
    id: "3",
    petition: petition,
    createdAt: new Date().toISOString(),
    isRead: false,
  },
  {
    __typename: "SignatureCancelledUserNotification",
    id: "4",
    petition: petition,
    createdAt: new Date().toISOString(),
    isRead: true,
  },
  {
    __typename: "PetitionSharedUserNotification",
    id: "5",
    petition: petition,
    owner: user,
    sharedWith: user,
    permissionType: permissionType,
    createdAt: new Date().toISOString(),
    isRead: true,
  },
  {
    __typename: "PetitionSharedUserNotification",
    id: "6",
    petition: petition,
    owner: user,
    sharedWith: userGroup,
    permissionType: permissionType,
    createdAt: new Date().toISOString(),
    isRead: true,
  },
  {
    __typename: "MessageEmailBouncedUserNotification",
    id: "7",
    petition: petition,
    access: petitionAccess,
    createdAt: new Date().toISOString(),
    isRead: false,
  },
] as Notifications_PetitionUserNotificationFragment[];

export const unreadedNotificationsMock = notificationsMock.filter(
  (n) => !n.isRead
);
