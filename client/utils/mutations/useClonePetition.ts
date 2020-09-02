import { gql, useMutation } from "@apollo/client";
import {
  useClonePetition_clonePetitionMutation,
  useClonePetition_clonePetitionMutationVariables,
  PetitionLocale,
} from "@parallel/graphql/__types";
import { clearCache } from "../apollo";
import { useRouter } from "next/router";
import { useCallback } from "react";

export function useClonePetition() {
  const { query } = useRouter();
  const [clonePetition] = useMutation<
    useClonePetition_clonePetitionMutation,
    useClonePetition_clonePetitionMutationVariables
  >(
    gql`
      mutation useClonePetition_clonePetition(
        $petitionId: GID!
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
      update(cache, { data }) {
        const isTemplate =
          data?.clonePetition.__typename === "PetitionTemplate";
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
    async ({
      petitionId,
      locale,
      name,
      deadline,
    }: {
      petitionId: string;
      locale?: PetitionLocale;
      name?: string;
      deadline?: string | null;
    }) => {
      const { data } = await clonePetition({
        variables: {
          petitionId,
          locale: locale || (query.locale as PetitionLocale),
          name,
          deadline,
        },
      });
      return data!.clonePetition!.id;
    },
    [query.locale]
  );
}
