import { gql, useMutation, useApolloClient } from "@apollo/client";
import { Button } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import {
  ConfirmDeletePetitionsDialog_PetitionBaseFragment,
  useDeletePetitions_deletePetitionsMutation,
  useDeletePetitions_deletePetitionsMutationVariables,
  useDeletePetitions_PetitionQuery,
  useDeletePetitions_PetitionQueryVariables,
} from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { clearCache } from "../apollo/clearCache";
import { useCallback } from "react";
import { useErrorDialog } from "@parallel/components/common/ErrorDialog";
import { groupBy } from "remeda";

export function useDeletePetitions() {
  const intl = useIntl();
  const showErrorDialog = useErrorDialog();
  const fetchPetitionPermissions = useFetchPetitionPermissions();
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

  return useCallback(
    async (userId: string, petitionIds: string[]) => {
      const {
        data: { petitionPermissions },
      } = await fetchPetitionPermissions(petitionIds);

      const byPetitionId = groupBy(petitionPermissions, (p) => p.petition.id);
      const userIsOwnerOfSharedPetition = Object.values(byPetitionId).some(
        (permissions) => {
          const owner = permissions.find((p) => p.permissionType === "OWNER")!
            .user;
          return permissions.length > 1 && owner.id === userId;
        }
      );

      if (userIsOwnerOfSharedPetition) {
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
      await confirmDelete({
        selected: petitionPermissions.map(({ petition }) => petition),
      });
      await deletePetitions({
        variables: { ids: petitionIds! },
      });
    },
    [intl.locale]
  );
}

function useFetchPetitionPermissions() {
  const apollo = useApolloClient();
  return useCallback(async (petitionIds) => {
    return await apollo.query<
      useDeletePetitions_PetitionQuery,
      useDeletePetitions_PetitionQueryVariables
    >({
      query: gql`
        query useDeletePetitions_Petition($ids: [GID!]!) {
          petitionPermissions(petitionIds: $ids) {
            permissionType
            user {
              id
            }
            petition {
              ...ConfirmDeletePetitionsDialog_PetitionBase
            }
          }
        }
        ${ConfirmDeletePetitionsDialog.fragments.PetitionBase}
      `,
      fetchPolicy: "network-only",
      variables: { ids: petitionIds },
    });
  }, []);
}

export function ConfirmDeletePetitionsDialog({
  selected,
  ...props
}: DialogProps<
  {
    selected: ConfirmDeletePetitionsDialog_PetitionBaseFragment[];
  },
  void
>) {
  const count = selected.length;
  const name = selected.length && selected[0].name;
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
