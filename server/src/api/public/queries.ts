import gql from "graphql-tag";

const _queries = [
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
          children {
            id
            type
            options
            replies {
              id
            }
          }
        }
      }
    }
  `,
  gql`
    query SubmitReply_petition($petitionId: GID!) {
      petition(id: $petitionId) {
        fields {
          id
          type
          options
          children {
            id
            type
            options
          }
        }
      }
    }
  `,
];
