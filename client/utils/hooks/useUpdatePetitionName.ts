import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useUpdatePetitionName_updatePetitionDocument } from "@parallel/graphql/__types";
import { useCallback } from "react";

export function useUpdatePetitionName() {
  const [updatePetition] = useMutation(useUpdatePetitionName_updatePetitionDocument);

  return useCallback(
    async (petitionId: string, name: string) => {
      await updatePetition({ variables: { petitionId, data: { name: name || null } } });
    },
    [updatePetition],
  );
}

const _mutations = [
  gql`
    mutation useUpdatePetitionName_updatePetition($petitionId: GID!, $data: UpdatePetitionInput!) {
      updatePetition(petitionId: $petitionId, data: $data) {
        id
        name
      }
    }
  `,
];
