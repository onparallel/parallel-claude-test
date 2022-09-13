import { gql, useMutation } from "@apollo/client";
import { VariablesOf } from "@graphql-typed-document-node/core";
import {
  PetitionLocale,
  useCreatePetition_createPetitionDocument,
} from "@parallel/graphql/__types";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { clearCache } from "../apollo/clearCache";
import { useUpdatingRef } from "../useUpdatingRef";

export function useCreatePetition() {
  const router = useRouter();
  const localeRef = useUpdatingRef(router.locale as PetitionLocale);

  const [createPetition] = useMutation(useCreatePetition_createPetitionDocument, {
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
  });

  return useCallback(async function ({
    name = null,
    locale = router.locale as PetitionLocale,
    petitionId = null,
    type = null,
    path = null,
  }: Partial<VariablesOf<typeof useCreatePetition_createPetitionDocument>> = {}) {
    const { data } = await createPetition({
      variables: { name, locale: localeRef.current, petitionId, type, path },
    });
    return data!.createPetition.id;
  },
  []);
}

useCreatePetition.mutations = [
  gql`
    mutation useCreatePetition_createPetition(
      $name: String
      $locale: PetitionLocale!
      $petitionId: GID
      $type: PetitionBaseType
      $path: String
    ) {
      createPetition(
        name: $name
        locale: $locale
        petitionId: $petitionId
        type: $type
        path: $path
      ) {
        id
      }
    }
  `,
];
