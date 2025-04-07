import gql from "graphql-tag";

export const AWSPresignedPostDataFragment = gql`
  fragment AWSPresignedPostData on AWSPresignedPostData {
    fields
    url
  }
`;

export const UserFragment = gql`
  fragment User on User {
    id
    email
    fullName
    firstName
    lastName
  }
`;

export const OrganizationFragment = gql`
  fragment Organization on Organization {
    id
    name
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
  fragment _PetitionField on PetitionField {
    id
    title
    description
    type
    fromPetitionFieldId
    alias
    options
    optional
    multiple
  }
  fragment PetitionField on PetitionField {
    ..._PetitionField
    children {
      ..._PetitionField
    }
  }
`;

export const PetitionFieldReplyFragment = gql`
  fragment _PetitionFieldReply on PetitionFieldReply {
    id
    content
    status
    metadata
    createdAt
    updatedAt
  }
  fragment PetitionFieldReply on PetitionFieldReply {
    ..._PetitionFieldReply
    children {
      field {
        id
        type
      }
      replies {
        ..._PetitionFieldReply
      }
    }
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

export const PetitionSignatureRequestFragment = gql`
  fragment PetitionSignatureRequest on PetitionSignatureRequest {
    id
    status
    environment
    signatureConfig {
      signers {
        email
        firstName
        lastName
      }
    }
    createdAt
    updatedAt
  }
`;

export const PetitionFragment = gql`
  fragment Petition on Petition {
    id
    path
    name
    status
    deadline
    locale
    createdAt
    fromTemplate {
      id
    }
    customProperties
    recipients: accesses @include(if: $includeRecipients) {
      ...PetitionAccess
    }
    recipients: accesses @include(if: $includeRecipientUrl) {
      recipientUrl
    }
    fields @include(if: $includeFields) {
      ...PetitionFieldWithReplies
    }
    replies: fields @include(if: $includeReplies) {
      id
      alias
      type
      replies {
        id
        content
        metadata
        children {
          field {
            id
            alias
            type
          }
          replies {
            id
            content
            metadata
          }
        }
      }
    }
    tags @include(if: $includeTags) {
      ...Tag
    }
    signatureConfig @include(if: $includeSigners) {
      isEnabled
      signers {
        email
        firstName
        lastName
      }
    }
    progress @include(if: $includeProgress) {
      external {
        approved
        replied
        optional
        total
      }
      internal {
        approved
        replied
        optional
        total
      }
    }
    variablesResult @include(if: $includeVariablesResult) {
      name
      value
    }
    signatures: signatureRequests @include(if: $includeSignatureRequests) {
      ...PetitionSignatureRequest
    }
    owner @include(if: $includeOwner) {
      ...User
    }
    isAnonymized
  }
  ${PetitionAccessFragment}
  ${PetitionFieldWithRepliesFragment}
  ${PetitionTagFragment}
  ${PetitionSignatureRequestFragment}
  ${UserFragment}
`;

export const TemplateFragment = gql`
  fragment Template on PetitionTemplate {
    id
    name
    path
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

export const PetitionEventSubscriptionFragment = gql`
  fragment PetitionEventSubscription on PetitionEventSubscription {
    id
    name
    eventsUrl
    isEnabled
    petitionEventTypes: eventTypes
    fromTemplate {
      id
    }
    __typename
  }
`;

export const ProfileEventSubscriptionFragment = gql`
  fragment ProfileEventSubscription on ProfileEventSubscription {
    id
    name
    eventsUrl
    isEnabled
    profileEventTypes: eventTypes
    fromProfileType {
      id
    }
    __typename
  }
`;

export const EventSubscriptionFragment = gql`
  fragment EventSubscription on EventSubscription {
    id
    ... on PetitionEventSubscription {
      ...PetitionEventSubscription
    }
    ... on ProfileEventSubscription {
      ...ProfileEventSubscription
    }
  }
`;

export const TaskFragment = gql`
  fragment Task on Task {
    id
    progress
    status
    output
  }
`;

export const ProfileTypeFieldFragment = gql`
  fragment ProfileTypeField on ProfileTypeField {
    id
    name
    alias
    type
    isExpirable
    options @include(if: $includeFieldOptions)
  }
`;

export const ProfileFieldValueFragment = gql`
  fragment ProfileFieldValue on ProfileFieldValue {
    id
    content
    expiresAt
    createdAt
  }
`;

export const ProfileFieldFileFragment = gql`
  fragment ProfileFieldFile on ProfileFieldFile {
    id
    file {
      filename
      size
      contentType
    }
    expiresAt
    createdAt
  }
`;

export const ProfileTypeFragment = gql`
  fragment ProfileType on ProfileType {
    id
    name
    fields @include(if: $includeFields) {
      ...ProfileTypeField
    }
  }
  ${ProfileTypeFieldFragment}
`;

export const ProfileFieldPropertyFragment = gql`
  fragment ProfileFieldProperty on ProfileFieldProperty {
    field {
      ...ProfileTypeField
    }
    value {
      ...ProfileFieldValue
    }
    files {
      ...ProfileFieldFile
    }
  }
  ${ProfileTypeFieldFragment}
  ${ProfileFieldValueFragment}
  ${ProfileFieldFileFragment}
`;

const ProfileBaseFragment = gql`
  fragment ProfileBase on Profile {
    id
    name
    status
    profileType {
      id
      name
    }
    createdAt
  }
`;

export const ProfileRelationshipFragment = gql`
  fragment ProfileRelationship on ProfileRelationship {
    id
    leftSideProfile {
      ...ProfileBase
    }
    rightSideProfile {
      ...ProfileBase
    }
    relationshipType {
      alias
      id
      leftRightName
      rightLeftName
    }
  }
  ${ProfileBaseFragment}
`;

export const ProfileFragment = gql`
  fragment Profile on Profile {
    ...ProfileBase
    properties {
      ...ProfileFieldProperty
    }
    relationships @include(if: $includeRelationships) {
      ...ProfileRelationship
    }
    subscribers @include(if: $includeSubscribers) {
      user {
        ...User
      }
    }
  }
  ${ProfileBaseFragment}
  ${ProfileFieldPropertyFragment}
  ${ProfileRelationshipFragment}
  ${UserFragment}
`;

export const PetitionFieldCommentFragment = gql`
  fragment PetitionFieldComment on PetitionFieldComment {
    id
    content
    isInternal
    createdAt
    isAnonymized
    author {
      __typename
      ... on User {
        id
        email
        fullName
      }
      ... on PetitionAccess {
        contact {
          id
          email
          fullName
        }
      }
    }
    mentions {
      __typename
      ... on PetitionFieldCommentUserMention {
        user {
          id
          email
          fullName
        }
      }
      ... on PetitionFieldCommentUserGroupMention {
        userGroup {
          id
          name
          localizableName
        }
      }
    }
  }
`;
