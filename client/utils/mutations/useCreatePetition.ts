import { gql, useMutation } from "@apollo/client";
import {
  PetitionLocale,
  useCreatePetition_createPetitionMutation,
  useCreatePetition_createPetitionMutationVariables,
} from "@parallel/graphql/__types";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { clearCache } from "../apollo";

export function useCreatePetition() {
  const { query } = useRouter();

  const [createPetition] = useMutation<
    useCreatePetition_createPetitionMutation,
    useCreatePetition_createPetitionMutationVariables
  >(
    gql`
      mutation useCreatePetition_createPetition(
        $name: String
        $locale: PetitionLocale!
        $deadline: DateTime
        $templateId: GID
      ) {
        createPetition(
          name: $name
          locale: $locale
          deadline: $deadline
          templateId: $templateId
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

  return useCallback(
    async function (templateId?: string) {
      const { data } = await createPetition({
        variables: {
          name: null,
          locale: query.locale as PetitionLocale,
          deadline: null,
          templateId,
        },
      });
      return data!.createPetition.id;
    },
    [query.locale]
  );
}
