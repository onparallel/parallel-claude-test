import { gql, useMutation } from "@apollo/client";
import {
  useDeletePetitions_deletePetitionsMutation,
  useDeletePetitions_deletePetitionsMutationVariables,
} from "@parallel/graphql/__types";
import { clearCache } from "../apollo";

// eslint-disable-next-line @typescript-eslint/no-unused-vars

export function useDeletePetitions() {
  const [deletePetitions] = useMutation<
    useDeletePetitions_deletePetitionsMutation,
    useDeletePetitions_deletePetitionsMutationVariables
  >(
    gql`
      mutation useDeletePetitions_deletePetitions($ids: [ID!]!) {
        deletePetitions(ids: $ids)
      }
    `,
    {
      update(cache) {
        clearCache(cache, /\$ROOT_QUERY\.petitions\(/);
      },
    }
  );
  return deletePetitions;
}
