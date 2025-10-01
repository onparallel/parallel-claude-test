import { gql, useApolloClient, useLazyQuery, useMutation } from "@apollo/client";
import { VariablesOf } from "@graphql-typed-document-node/core";
import { isDialogError } from "@parallel/components/common/dialogs/DialogProvider";
import { useCreatePetitionFromTemplateWithPrefillDialog } from "@parallel/components/petition-new/dialogs/CreatePetitionFromTemplateWithPrefillDialog";
import {
  PetitionLocale,
  useCreatePetition_createPetitionDocument,
  useCreatePetition_PetitionBaseFragment,
  useCreatePetition_petitionDocument,
} from "@parallel/graphql/__types";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { isNonNullish } from "remeda";
import { clearCache } from "../apollo/clearCache";
import { useUpdatingRef } from "../useUpdatingRef";

export function useCreatePetition() {
  const router = useRouter();
  const localeRef = useUpdatingRef(router.locale as PetitionLocale);
  const apolloClient = useApolloClient();
  const showCreatePetitionFromTemplateWithPrefillDialog =
    useCreatePetitionFromTemplateWithPrefillDialog();

  const [createPetition] = useMutation(useCreatePetition_createPetitionDocument, {
    update(cache, { data }) {
      const isTemplate = data?.createPetition.__typename === "PetitionTemplate";
      // clear caches where new item would appear
      clearCache(
        cache,
        isTemplate
          ? /\$ROOT_QUERY\.petitions\(.*"type":"TEMPLATE"[,}]/
          : /\$ROOT_QUERY\.petitions\(.*"status":(null|"DRAFT")[,}]/,
      );
    },
  });

  const [getPetition] = useLazyQuery(useCreatePetition_petitionDocument);

  return useCallback(
    async function ({
      name = null,
      petitionId = null,
      type = null,
      path = null,
    }: Partial<VariablesOf<typeof useCreatePetition_createPetitionDocument>> = {}) {
      // If creating from a template (petitionId provided), check if it has linked field groups

      if (petitionId && !type) {
        try {
          // Fetch template data to check for linked field groups
          const { data: templateData } = await getPetition({ variables: { id: petitionId } });

          const template = templateData?.petition;

          // If template has linked field groups, show prefill dialog
          if (template && getLinkedFieldGroups(template).length > 0) {
            return await showCreatePetitionFromTemplateWithPrefillDialog({
              template,
            });
          }
        } catch (error) {
          if (isDialogError(error) && error.message === "CREATE_EMPTY_PETITION") {
            // Create empty petition
            const { data } = await createPetition({
              variables: { name, locale: localeRef.current, petitionId, type, path },
            });
            return data!.createPetition.id;
          }
          return null;
        }
      }

      // Normal creation flow (no template or no linked field groups)
      const { data } = await createPetition({
        variables: { name, locale: localeRef.current, petitionId, type, path },
      });
      return data!.createPetition.id;
    },
    [apolloClient, createPetition, localeRef, showCreatePetitionFromTemplateWithPrefillDialog],
  );
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

const _fragments = {
  PetitionBase: gql`
    fragment useCreatePetition_PetitionBase on PetitionBase {
      id
      fields {
        id
        type
        isLinkedToProfileType
      }
      ...useCreatePetitionFromTemplateWithPrefillDialog_PetitionBase
    }
    ${useCreatePetitionFromTemplateWithPrefillDialog.fragments.PetitionBase}
  `,
};

const _queries = [
  gql`
    query useCreatePetition_petition($id: GID!) {
      petition(id: $id) {
        id
        ...useCreatePetition_PetitionBase
      }
    }
    ${_fragments.PetitionBase}
  `,
];

const getLinkedFieldGroups = (petition: useCreatePetition_PetitionBaseFragment) => {
  return petition.fields.filter(
    (field) =>
      isNonNullish(field) && field.type === "FIELD_GROUP" && field.isLinkedToProfileType === true,
  );
};
