import { gql, useMutation } from "@apollo/client";
import { VariablesOf } from "@graphql-typed-document-node/core";
import { useClonePetitions_clonePetitionsDocument } from "@parallel/graphql/__types";
import { useCallback } from "react";
import { clearCache } from "../apollo/clearCache";

export function useClonePetitions() {
  const [clonePetitions] = useMutation(useClonePetitions_clonePetitionsDocument, {
    update(cache, { data }) {
      // clear caches where new item would appear
      clearCache(
        cache,
        /\$ROOT_QUERY\.petitions\(.*("type":"TEMPLATE"|"status":(null|"DRAFT"))[,}]/
      );
    },
  });

  return useCallback(
    async ({ petitionIds }: VariablesOf<typeof useClonePetitions_clonePetitionsDocument>) => {
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

useClonePetitions.mutations = [
  gql`
    mutation useClonePetitions_clonePetitions($petitionIds: [GID!]!, $keepTitle: Boolean) {
      clonePetitions(petitionIds: $petitionIds, keepTitle: $keepTitle) {
        id
      }
    }
  `,
];
