import { gql, useMutation } from "@apollo/client";
import { useCreatePetitionDialog } from "@parallel/components/petition-list/CreatePetitionDialog";
import {
  PetitionLocale,
  useCreatePetition_createPetitionMutation,
  useCreatePetition_createPetitionMutationVariables,
} from "@parallel/graphql/__types";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { clearCache } from "./apollo";

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
      ) {
        createPetition(name: $name, locale: $locale, deadline: $deadline) {
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

  // const showCreatePetitionDialog = useCreatePetitionDialog();

  return useCallback(
    async function () {
      // const { name, locale, deadline } = await showCreatePetitionDialog({
      //   defaultLocale: query.locale as PetitionLocale,
      // });
      const { data, errors } = await createPetition({
        variables: {
          name: null,
          locale: query.locale as PetitionLocale,
          deadline: null,
        },
      });
      if (errors) {
        throw errors;
      }
      return data!.createPetition.id;
    },
    [query.locale]
  );
}
