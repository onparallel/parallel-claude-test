import { gql } from "graphql-request";
import { PetitionFieldReplyFragment } from "./fragments";

gql`
  mutation SubmitReply_createSimpleReply($petitionId: GID!, $fieldId: GID!, $reply: String!) {
    createSimpleReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
      ...PetitionFieldReply
    }
  }
  ${PetitionFieldReplyFragment}
`;
gql`
  mutation SubmitReply_createCheckboxReply($petitionId: GID!, $fieldId: GID!, $reply: [String!]!) {
    createCheckboxReply(petitionId: $petitionId, fieldId: $fieldId, values: $reply) {
      ...PetitionFieldReply
    }
  }
  ${PetitionFieldReplyFragment}
`;
gql`
  mutation SubmitReply_createFileUploadReply($petitionId: GID!, $fieldId: GID!, $file: Upload!) {
    createFileUploadReply(petitionId: $petitionId, fieldId: $fieldId, file: $file) {
      ...PetitionFieldReply
    }
  }
  ${PetitionFieldReplyFragment}
`;
gql`
  mutation SubmitReply_createDynamicSelectReply(
    $petitionId: GID!
    $fieldId: GID!
    $value: [[String]!]!
  ) {
    createDynamicSelectReply(petitionId: $petitionId, fieldId: $fieldId, value: $value) {
      ...PetitionFieldReply
    }
  }
  ${PetitionFieldReplyFragment}
`;

gql`
  mutation UpdateReply_updateSimpleReply($petitionId: GID!, $replyId: GID!, $reply: String!) {
    updateSimpleReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
      ...PetitionFieldReply
    }
  }
  ${PetitionFieldReplyFragment}
`;
gql`
  mutation UpdateReply_updateCheckboxReply($petitionId: GID!, $replyId: GID!, $values: [String!]!) {
    updateCheckboxReply(petitionId: $petitionId, replyId: $replyId, values: $values) {
      ...PetitionFieldReply
    }
  }
  ${PetitionFieldReplyFragment}
`;
gql`
  mutation UpdateReply_updateDynamicSelectReply(
    $petitionId: GID!
    $replyId: GID!
    $value: [[String]!]!
  ) {
    updateDynamicSelectReply(petitionId: $petitionId, replyId: $replyId, value: $value) {
      ...PetitionFieldReply
    }
  }
  ${PetitionFieldReplyFragment}
`;
gql`
  mutation UpdateReply_updateDynamicSelectReply(
    $petitionId: GID!
    $replyId: GID!
    $value: [[String]!]!
  ) {
    updateDynamicSelectReply(petitionId: $petitionId, replyId: $replyId, value: $value) {
      ...PetitionFieldReply
    }
  }
  ${PetitionFieldReplyFragment}
`;
gql`
  mutation UpdateReply_updateFileUploadReply($petitionId: GID!, $replyId: GID!, $file: Upload!) {
    updateFileUploadReply(petitionId: $petitionId, replyId: $replyId, file: $file) {
      ...PetitionFieldReply
    }
  }
  ${PetitionFieldReplyFragment}
`;
