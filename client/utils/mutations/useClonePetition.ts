import { gql, useMutation } from "@apollo/client";
import {
  useClonePetition_clonePetitionMutation,
  useClonePetition_clonePetitionMutationVariables,
} from "@parallel/graphql/__types";
import { clearCache } from "../apollo";

export function useClonePetition() {
  const [clonePetition] = useMutation<
    useClonePetition_clonePetitionMutation,
    useClonePetition_clonePetitionMutationVariables
  >(
    gql`
      mutation useClonePetition_clonePetition(
        $petitionId: ID!
        $name: String
        $locale: PetitionLocale!
        $deadline: DateTime
      ) {
        clonePetition(
          petitionId: $petitionId
          name: $name
          locale: $locale
          deadline: $deadline
        ) {
          id
        }
      }
    `,
    {
      update(cache) {
        // clear caches where new item would appear
        clearCache(
          cache,
          /\$ROOT_QUERY\.petitions\(.*"status":(null|"DRAFT")[,}]/
        );
      },
    }
  );
  return clonePetition;
}
