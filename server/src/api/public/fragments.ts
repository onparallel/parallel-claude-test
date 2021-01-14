import { gql } from "graphql-request";

export const PetitionFragment = gql`
  fragment Petition on Petition {
    id
    name
    createdAt
  }
`;
