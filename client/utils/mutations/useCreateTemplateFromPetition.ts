import { gql, useMutation } from "@apollo/client";
import {
  useCreateTemplateFromPetition_createTemplateFromPetitionMutation,
  useCreateTemplateFromPetition_createTemplateFromPetitionMutationVariables,
} from "@parallel/graphql/__types";
import { useCallback } from "react";

export function useCreateTemplateFromPetition() {
  const [createTemplate] = useMutation<
    useCreateTemplateFromPetition_createTemplateFromPetitionMutation,
    useCreateTemplateFromPetition_createTemplateFromPetitionMutationVariables
  >(
    gql`
      mutation useCreateTemplateFromPetition_createTemplateFromPetition(
        $petitionId: GID!
      ) {
        createTemplateFromPetition(petitionId: $petitionId) {
          id
        }
      }
    `
  );
  return useCallback(
    async (
      variables: useCreateTemplateFromPetition_createTemplateFromPetitionMutationVariables
    ) => {
      const { data } = await createTemplate({ variables });
      return data!.createTemplateFromPetition.id;
    },
    [createTemplate]
  );
}
