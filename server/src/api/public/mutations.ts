import gql from "graphql-tag";
import {
  AWSPresignedPostDataFragment,
  PetitionFieldReplyFragment,
  PetitionFragment,
} from "./fragments";

gql`
  mutation SubmitReply_createPetitionFieldReply($petitionId: GID!, $fieldId: GID!, $reply: JSON!) {
    createPetitionFieldReply(petitionId: $petitionId, fieldId: $fieldId, reply: $reply) {
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
  ) {
    createFileUploadReply(petitionId: $petitionId, fieldId: $fieldId, file: $file) {
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
  mutation UpdateReplyStatus_updatePetitionFieldRepliesStatus(
    $petitionId: GID!
    $fieldId: GID!
    $replyIds: [GID!]!
    $status: PetitionFieldReplyStatus!
  ) {
    updatePetitionFieldRepliesStatus(
      petitionId: $petitionId
      petitionFieldId: $fieldId
      petitionFieldReplyIds: $replyIds
      status: $status
    ) {
      replies {
        ...PetitionFieldReply
        field {
          id
        }
      }
    }
  }
  ${PetitionFieldReplyFragment}
`;
gql`
  mutation UpdateReply_updatePetitionFieldReply($petitionId: GID!, $replyId: GID!, $reply: JSON!) {
    updatePetitionFieldReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
      ...PetitionFieldReply
      field {
        id
      }
    }
  }
  ${PetitionFieldReplyFragment}
`;
gql`
  mutation UpdateReply_updateFileUploadReply(
    $petitionId: GID!
    $replyId: GID!
    $file: FileUploadInput!
  ) {
    updateFileUploadReply(petitionId: $petitionId, replyId: $replyId, file: $file) {
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
      field {
        id
      }
    }
  }
  ${PetitionFieldReplyFragment}
`;

gql`
  mutation SubmitReplies_bulkCreatePetitionReplies(
    $petitionId: GID!
    $replies: JSONObject!
    $includeFields: Boolean!
    $includeTags: Boolean!
    $includeRecipients: Boolean!
    $includeRecipientUrl: Boolean!
    $includeReplies: Boolean!
    $includeProgress: Boolean!
  ) {
    bulkCreatePetitionReplies(petitionId: $petitionId, replies: $replies) {
      ...Petition
    }
  }
  ${PetitionFragment}
`;
