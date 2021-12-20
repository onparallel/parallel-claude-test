import { gql } from "graphql-request";

export const AWSPresignedPostDataFragment = gql`
  fragment AWSPresignedPostData on AWSPresignedPostData {
    fields
    url
  }
`;

export const PetitionAttachmentFragment = gql`
  fragment PetitionAttachment on PetitionAttachment {
    id
    file {
      filename
      contentType
      size
      isComplete
    }
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

export const PetitionFieldFragment = gql`
  fragment PetitionField on PetitionField {
    id
    title
    type
    fromPetitionFieldId
    alias
    options
    multiple
    validated
  }
`;

export const PetitionFieldReplyFragment = gql`
  fragment PetitionFieldReply on PetitionFieldReply {
    id
    content
    status
    createdAt
    updatedAt
  }
`;

export const PetitionFieldWithRepliesFragment = gql`
  fragment PetitionFieldWithReplies on PetitionField {
    ...PetitionField
    replies {
      ...PetitionFieldReply
    }
  }
  ${PetitionFieldFragment}
  ${PetitionFieldReplyFragment}
`;

export const PetitionTagFragment = gql`
  fragment Tag on Tag {
    id
    name
  }
`;

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
    recipients: accesses @include(if: $includeRecipients) {
      ...PetitionAccess
    }
    fields @include(if: $includeFields) {
      ...PetitionFieldWithReplies
    }
    tags @include(if: $includeTags) {
      ...Tag
    }
  }
  ${PetitionAccessFragment}
  ${PetitionFieldWithRepliesFragment}
  ${PetitionTagFragment}
`;

export const TemplateFragment = gql`
  fragment Template on PetitionTemplate {
    id
    name
    description
    locale
    createdAt
    customProperties
    fields @include(if: $includeFields) {
      ...PetitionField
    }
    tags @include(if: $includeTags) {
      ...Tag
    }
  }
  ${PetitionFieldFragment}
  ${PetitionTagFragment}
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

export const SubscriptionFragment = gql`
  fragment Subscription on PetitionEventSubscription {
    id
    eventsUrl
    isEnabled
    eventTypes
  }
`;

export const TaskFragment = gql`
  fragment Task on Task {
    id
    progress
    status
  }
`;
