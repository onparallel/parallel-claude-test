import { gql, useMutation } from "@apollo/client";
import {
  PetitionLocale,
  useCreatePetition_createPetitionMutation,
  useCreatePetition_createPetitionMutationVariables,
} from "@parallel/graphql/__types";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { clearCache } from "../apollo/clearCache";

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
        $petitionId: GID
        $type: PetitionBaseType
      ) {
        createPetition(name: $name, locale: $locale, petitionId: $petitionId, type: $type) {
          id
        }
      }
    `,
    {
      update(cache, { data }) {
        const isTemplate = data?.createPetition.__typename === "PetitionTemplate";
        // clear caches where new item would appear
        clearCache(
          cache,
          isTemplate
            ? /\$ROOT_QUERY\.petitions\(.*"type":"TEMPLATE"[,}]/
            : /\$ROOT_QUERY\.petitions\(.*"status":(null|"DRAFT")[,}]/
        );
      },
    }
  );

  return useCallback(
    async function ({
      name = null,
      locale = query.locale as PetitionLocale,
      petitionId = null,
      type = null,
    }: Partial<useCreatePetition_createPetitionMutationVariables> = {}) {
      const { data } = await createPetition({
        variables: { name, locale, petitionId, type },
      });
      return data!.createPetition.id;
    },
    [query.locale]
  );
}
