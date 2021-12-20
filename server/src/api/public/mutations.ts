import { gql } from "graphql-request";
import {
  AWSPresignedPostDataFragment,
  PetitionFieldReplyFragment,
  PetitionAttachmentFragment,
} from "./fragments";

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
  mutation UpdateReplyStatus_updatePetitionFieldRepliesStatus(
    $petitionId: GID!
    $fieldId: GID!
    $replyId: GID!
    $status: PetitionFieldReplyStatus!
  ) {
    updatePetitionFieldRepliesStatus(
      petitionId: $petitionId
      petitionFieldId: $fieldId
      petitionFieldReplyIds: [$replyId]
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
  mutation UpdateReply_updateSimpleReply($petitionId: GID!, $replyId: GID!, $reply: String!) {
    updateSimpleReply(petitionId: $petitionId, replyId: $replyId, reply: $reply) {
      ...PetitionFieldReply
      field {
        id
      }
    }
  }
  ${PetitionFieldReplyFragment}
`;
gql`
  mutation UpdateReply_updateCheckboxReply($petitionId: GID!, $replyId: GID!, $values: [String!]!) {
    updateCheckboxReply(petitionId: $petitionId, replyId: $replyId, values: $values) {
      ...PetitionFieldReply
      field {
        id
      }
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
  mutation CreatePetitionAttachment_createPetitionAttachmentUploadLink(
    $petitionId: GID!
    $data: FileUploadInput!
  ) {
    createPetitionAttachmentUploadLink(petitionId: $petitionId, data: $data) {
      presignedPostData {
        ...AWSPresignedPostData
      }
      attachment {
        ...PetitionAttachment
      }
    }
  }
  ${AWSPresignedPostDataFragment}
  ${PetitionAttachmentFragment}
`;

gql`
  mutation CreatePetitionAttachment_petitionAttachmentUploadComplete(
    $petitionId: GID!
    $attachmentId: GID!
  ) {
    petitionAttachmentUploadComplete(petitionId: $petitionId, attachmentId: $attachmentId) {
      ...PetitionAttachment
    }
  }
  ${PetitionAttachmentFragment}
`;
gql`
  mutation DeletePetitionAttachment_deletePetitionAttachment(
    $petitionId: GID!
    $attachmentId: GID!
  ) {
    deletePetitionAttachment(petitionId: $petitionId, attachmentId: $attachmentId)
  }
`;
gql`
  mutation DownloadPetitionAttachment_petitionAttachmentDownloadLink(
    $petitionId: GID!
    $attachmentId: GID!
  ) {
    petitionAttachmentDownloadLink(petitionId: $petitionId, attachmentId: $attachmentId) {
      url
    }
  }
`;
