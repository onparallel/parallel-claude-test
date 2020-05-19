import { useMutation } from "@apollo/react-hooks";
import { useAskPetitionNameDialog } from "@parallel/components/petition-list/AskPetitionNameDialog";
import {
  PetitionLocale,
  useCreatePetition_createPetitionMutation,
  useCreatePetition_createPetitionMutationVariables,
} from "@parallel/graphql/__types";
import { gql } from "apollo-boost";
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
        $name: String!
        $locale: PetitionLocale!
      ) {
        createPetition(name: $name, locale: $locale) {
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

  const askPetitionName = useAskPetitionNameDialog();

  return useCallback(
    async function () {
      const name = await askPetitionName({});
      const { data, errors } = await createPetition({
        variables: {
          name,
          locale: query.locale as PetitionLocale,
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
