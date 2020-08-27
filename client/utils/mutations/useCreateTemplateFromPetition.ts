import { gql, useMutation } from "@apollo/client";
import {
  useCreateTemplateFromPetition_createTemplateFromPetitionMutation,
  useCreateTemplateFromPetition_createTemplateFromPetitionMutationVariables,
} from "@parallel/graphql/__types";

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
  return createTemplate;
}
