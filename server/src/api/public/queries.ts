import { gql } from "graphql-request";
import { PetitionAttachmentFragment } from "./fragments";

gql`
  query UpdateReply_petition($petitionId: GID!) {
    petition(id: $petitionId) {
      fields {
        id
        type
        options
        replies {
          id
        }
      }
    }
  }
`;

gql`
  query SubmitReply_petition($petitionId: GID!) {
    petition(id: $petitionId) {
      fields {
        id
        type
        options
      }
    }
  }
`;

gql`
  query GetPetitionAttachments_petition($id: GID!) {
    petition(id: $id) {
      attachments {
        ...PetitionAttachment
      }
    }
  }
  ${PetitionAttachmentFragment}
`;
