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
    customProperties
  }
`;

export const TemplateFragment = gql`
  fragment Template on PetitionTemplate {
    id
    name
    description
    locale
    createdAt
    customProperties
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

export const PetitionFieldFragment = gql`
  fragment PetitionField on PetitionField {
    id
    title
    type
    fromPetitionFieldId
    alias
  }
`;

export const PetitionReplyFragment = gql`
  fragment PetitionFieldReply on PetitionFieldReply {
    id
    content
    createdAt
    updatedAt
  }
`;

export const SubscriptionFragment = gql`
  fragment Subscription on PetitionEventSubscription {
    id
    eventsUrl
    isEnabled
  }
`;
