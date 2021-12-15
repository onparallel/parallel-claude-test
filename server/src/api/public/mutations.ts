import { gql } from "graphql-request";
import { AWSPresignedPostDataFragment, PetitionFieldReplyFragment } from "./fragments";

gql`
  mutation SubmitReply_createSimpleReply(
    $petitionId: GID!
    $fieldId: GID!
    $reply: String!
    $status: PetitionFieldReplyStatus
  ) {
    createSimpleReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply, status: $status) {
      ...PetitionFieldReply
    }
  }
  ${PetitionFieldReplyFragment}
`;
gql`
  mutation SubmitReply_createCheckboxReply(
    $petitionId: GID!
    $fieldId: GID!
    $reply: [String!]!
    $status: PetitionFieldReplyStatus
  ) {
    createCheckboxReply(
      petitionId: $petitionId
      fieldId: $fieldId
      values: $reply
      status: $status
    ) {
      ...PetitionFieldReply
    }
  }
  ${PetitionFieldReplyFragment}
`;
gql`
  mutation SubmitReply_createFileUploadReply(
    $petitionId: GID!
    $fieldId: GID!
    $file: FileUploadInput!
    $status: PetitionFieldReplyStatus
  ) {
    createFileUploadReply(
      petitionId: $petitionId
      fieldId: $fieldId
      file: $file
      status: $status
    ) {
      presignedPostData {
        ...AWSPresignedPostData
      }
      reply {
        ...PetitionFieldReply
      }
    }
  }
  ${AWSPresignedPostDataFragment}
  ${PetitionFieldReplyFragment}
`;
gql`
  mutation SubmitReply_createFileUploadReplyComplete($petitionId: GID!, $replyId: GID!) {
    createFileUploadReplyComplete(petitionId: $petitionId, replyId: $replyId) {
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
    $status: PetitionFieldReplyStatus
  ) {
    createDynamicSelectReply(
      petitionId: $petitionId
      fieldId: $fieldId
      value: $value
      status: $status
    ) {
      ...PetitionFieldReply
    }
  }
  ${PetitionFieldReplyFragment}
`;

gql`
  mutation UpdateReply_updateSimpleReply(
    $petitionId: GID!
    $replyId: GID!
    $reply: String!
    $status: PetitionFieldReplyStatus
  ) {
    updateSimpleReply(petitionId: $petitionId, replyId: $replyId, reply: $reply, status: $status) {
      ...PetitionFieldReply
    }
  }
  ${PetitionFieldReplyFragment}
`;
gql`
  mutation UpdateReply_updateCheckboxReply(
    $petitionId: GID!
    $replyId: GID!
    $values: [String!]!
    $status: PetitionFieldReplyStatus
  ) {
    updateCheckboxReply(
      petitionId: $petitionId
      replyId: $replyId
      values: $values
      status: $status
    ) {
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
    $status: PetitionFieldReplyStatus
  ) {
    updateDynamicSelectReply(
      petitionId: $petitionId
      replyId: $replyId
      value: $value
      status: $status
    ) {
      ...PetitionFieldReply
    }
  }
  ${PetitionFieldReplyFragment}
`;
gql`
  mutation UpdateReply_updateFileUploadReply(
    $petitionId: GID!
    $replyId: GID!
    $file: FileUploadInput!
    $status: PetitionFieldReplyStatus
  ) {
    updateFileUploadReply(
      petitionId: $petitionId
      replyId: $replyId
      file: $file
      status: $status
    ) {
      presignedPostData {
        ...AWSPresignedPostData
      }
      reply {
        ...PetitionFieldReply
      }
    }
  }
  ${AWSPresignedPostDataFragment}
  ${PetitionFieldReplyFragment}
`;
gql`
  mutation UpdateReply_updateFileUploadReplyComplete($petitionId: GID!, $replyId: GID!) {
    updateFileUploadReplyComplete(petitionId: $petitionId, replyId: $replyId) {
      ...PetitionFieldReply
    }
  }
  ${PetitionFieldReplyFragment}
`;
