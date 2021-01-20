import { gql } from "graphql-request";

export const PetitionFragment = gql`
  fragment Petition on Petition {
    id
    name
    status
    deadline
    locale
    createdAt
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
