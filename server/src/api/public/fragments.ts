import { gql } from "graphql-request";

export const PetitionFragment = gql`
  fragment Petition on Petition {
    id
    name
    status
    deadline
    locale
    createdAt
    fromTemplateId
  }
`;

export const TemplateFragment = gql`
  fragment Template on PetitionTemplate {
    id
    name
    description
    locale
    createdAt
  }
`;

export const UserFragment = gql`
  fragment User on User {
    id
    fullName
    firstName
    lastName
  }
`;

export const UserGroupFragment = gql`
  fragment UserGroup on UserGroup {
    id
    name
  }
`;

export const ContactFragment = gql`
  fragment Contact on Contact {
    id
    email
    fullName
    firstName
    lastName
    createdAt
    updatedAt
  }
`;

export const PetitionAccessFragment = gql`
  fragment PetitionAccess on PetitionAccess {
    id
    contact {
      ...Contact
    }
    granter {
      ...User
    }
    status
    reminderCount
    remindersLeft
    remindersActive
    nextReminderAt
    createdAt
  }
  ${ContactFragment}
  ${UserFragment}
`;

export const SubscriptionFragment = gql`
  fragment Subscription on Subscription {
    id
    endpoint
    createdAt
  }
`;

export const PermissionFragment = gql`
  fragment Permission on PetitionPermission {
    permissionType
    createdAt
    ... on PetitionUserPermission {
      user {
        ...User
      }
    }
    ... on PetitionUserGroupPermission {
      group {
        ...UserGroup
      }
    }
  }
  ${UserFragment}
  ${UserGroupFragment}
`;

export const PetitionReplyFragment = gql`
  fragment PetitionFieldReply on PetitionFieldReply {
    id
    content
    createdAt
    updatedAt
  }
`;
