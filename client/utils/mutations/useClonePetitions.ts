import { gql, useMutation } from "@apollo/client";
import {
  useClonePetitions_clonePetitionsMutation,
  useClonePetitions_clonePetitionsMutationVariables,
} from "@parallel/graphql/__types";
import { useCallback } from "react";
import { clearCache } from "../apollo/clearCache";

export function useClonePetitions() {
  const [clonePetitions] = useMutation<
    useClonePetitions_clonePetitionsMutation,
    useClonePetitions_clonePetitionsMutationVariables
  >(
    gql`
      mutation useClonePetitions_clonePetitions($petitionIds: [GID!]!) {
        clonePetitions(petitionIds: $petitionIds) {
          id
        }
      }
    `,
    {
      update(cache, { data }) {
        // clear caches where new item would appear
        clearCache(
          cache,
          /\$ROOT_QUERY\.petitions\(.*("type":"TEMPLATE"|"status":(null|"DRAFT"))[,}]/
        );
      },
    }
  );

  return useCallback(
    async ({
      petitionIds,
    }: useClonePetitions_clonePetitionsMutationVariables) => {
      const { data } = await clonePetitions({
        variables: {
          petitionIds,
        },
      });
      return data!.clonePetitions!.map((p) => p.id);
    },
    []
  );
}
