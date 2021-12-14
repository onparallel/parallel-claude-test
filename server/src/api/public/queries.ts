import { gql } from "graphql-request";

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
