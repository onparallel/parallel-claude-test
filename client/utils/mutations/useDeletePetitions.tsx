import { gql, useApolloClient, useMutation } from "@apollo/client";
import { Button } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { useErrorDialog } from "@parallel/components/common/ErrorDialog";
import {
  ConfirmDeletePetitionsDialog_PetitionBaseFragment,
  useDeletePetitions_deletePetitionsMutation,
  useDeletePetitions_deletePetitionsMutationVariables,
} from "@parallel/graphql/__types";
import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { clearCache } from "../apollo/clearCache";

export function useDeletePetitions() {
  const intl = useIntl();
  const showErrorDialog = useErrorDialog();
  const confirmDelete = useDialog(ConfirmDeletePetitionsDialog);

  const [deletePetitions] = useMutation<
    useDeletePetitions_deletePetitionsMutation,
    useDeletePetitions_deletePetitionsMutationVariables
  >(
    gql`
      mutation useDeletePetitions_deletePetitions($ids: [GID!]!) {
        deletePetitions(ids: $ids)
      }
    `,
    {
      update(cache) {
        clearCache(cache, /\$ROOT_QUERY\.petitions\(/);
      },
    }
  );

  const { cache } = useApolloClient();
  return useCallback(
    async (petitionIds: string[]) => {
      try {
        // petition name should always be on cache at this point
        const cachedPetition = cache.readFragment<
          ConfirmDeletePetitionsDialog_PetitionBaseFragment
        >({
          fragment: ConfirmDeletePetitionsDialog.fragments.PetitionBase,
          id: petitionIds[0],
        });

        await confirmDelete({
          petitionIds,
          name:
            cachedPetition!.name ||
            intl.formatMessage({
              id: "generic.untitled-petition",
              defaultMessage: "Untitled petition",
            }),
        });
        await deletePetitions({
          variables: { ids: petitionIds! },
        });
      } catch (error) {
        if (
          error?.graphQLErrors?.[0]?.extensions.code ===
          "DELETE_SHARED_PETITION_ERROR"
        ) {
          return await showErrorDialog({
            message: intl.formatMessage(
              {
                id: "petition.shared-delete-error",
                defaultMessage:
                  "{count, plural, =1 {The petition} other {At least one of the petitions}} you want to delete {count, plural, =1 {is} other {are}} shared with other users. Please transfer the ownership or remove the shared access first.",
              },
              { count: petitionIds.length }
            ),
          });
        }
      }
    },
    [intl.locale]
  );
}

export function ConfirmDeletePetitionsDialog({
  petitionIds,
  name,
  ...props
}: DialogProps<{
  name: string;
  petitionIds: string[];
}>) {
  const count = petitionIds.length;

  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="petitions.confirm-delete.header"
          defaultMessage="Delete petitions"
        />
      }
      body={
        <FormattedMessage
          id="petitions.confirm-delete.body"
          defaultMessage="Are you sure you want to delete {count, plural, =1 {<b>{name}</b>} other {the <b>#</b> selected petitions}}?"
          values={{
            count,
            name,
            b: (chunks: any[]) => <b>{chunks}</b>,
          }}
        />
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="generic.confirm-delete-button"
            defaultMessage="Yes, delete"
          />
        </Button>
      }
      {...props}
    />
  );
}

ConfirmDeletePetitionsDialog.fragments = {
  PetitionBase: gql`
    fragment ConfirmDeletePetitionsDialog_PetitionBase on PetitionBase {
      id
      name
    }
  `,
};
