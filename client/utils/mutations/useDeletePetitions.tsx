import { gql, useApolloClient, useMutation } from "@apollo/client";
import { Button, ListItem, Stack, Text, UnorderedList } from "@chakra-ui/react";
import { AlertCircleIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/ErrorDialog";
import {
  ConfirmDeletePetitionsDialog_PetitionBaseFragment,
  useDeletePetitions_deletePetitionsMutation,
  useDeletePetitions_deletePetitionsMutationVariables,
} from "@parallel/graphql/__types";
import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isApolloError } from "../apollo/isApolloError";

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
    `
  );

  const { cache } = useApolloClient();

  const errorHeader = (
    <Stack direction="row" spacing={2} align="center">
      <AlertCircleIcon role="presentation" />
      <Text>
        <FormattedMessage
          id="component.delete-petitions.error-header"
          defaultMessage="Delete failed"
        />
      </Text>
    </Stack>
  );

  return useCallback(
    async (petitionIds: string[]) => {
      try {
        // petition name should always be on cache at this point
        const cachedPetition =
          cache.readFragment<ConfirmDeletePetitionsDialog_PetitionBaseFragment>({
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
          isTemplate: cachedPetition?.__typename === "PetitionTemplate",
        });
        await deletePetitions({
          variables: { ids: petitionIds! },
          update(client, { data }) {
            if (data?.deletePetitions === "SUCCESS") {
              for (const petitionId of petitionIds) {
                client.evict({ id: petitionId });
              }
              client.gc();
            }
          },
        });
      } catch (error) {
        if (isApolloError(error)) {
          const conflictingPetitionIds: string[] =
            error.graphQLErrors[0]?.extensions?.petitionIds ?? [];

          const errorCode: string | undefined = error.graphQLErrors[0]?.extensions?.code;

          const cachedPetitions = conflictingPetitionIds.map(
            (id) =>
              cache.readFragment<ConfirmDeletePetitionsDialog_PetitionBaseFragment>({
                fragment: ConfirmDeletePetitionsDialog.fragments.PetitionBase,
                id: id,
              })!
          );

          const petitionName =
            cachedPetitions[0].name ||
            intl.formatMessage({
              id: "generic.untitled-petition",
              defaultMessage: "Untitled petition",
            });

          const type =
            cachedPetitions[0].__typename === "PetitionTemplate" ? "TEMPLATE" : "PETITION";

          if (errorCode === "DELETE_SHARED_PETITION_ERROR") {
            const singlePetitionMessage = (
              <FormattedMessage
                id="component.delete-petitions.shared-error-singular"
                defaultMessage="The {name} {type, select, PETITION {petition} other{template}} could not be removed because it is being shared. Please transfer ownership or remove shared access first."
                values={{ name: <b>{petitionName}</b>, type }}
              />
            );

            const multiplePetitionMessage = (
              <>
                <FormattedMessage
                  id="component.delete-petitions.shared-error-plural-1"
                  defaultMessage="The following {type, select, PETITION {petitions} other{templates}} could not be removed because they are being shared:"
                  values={{ type }}
                />
                <UnorderedList paddingLeft={2} py={2}>
                  {cachedPetitions.map((petition) => (
                    <ListItem key={petition.id}>{petition.name}</ListItem>
                  ))}
                </UnorderedList>
                <FormattedMessage
                  id="component.delete-petitions.shared-error-plural-2"
                  defaultMessage="Please transfer ownership or remove shared access first."
                />
              </>
            );

            const errorMessage =
              conflictingPetitionIds.length === 1 ? singlePetitionMessage : multiplePetitionMessage;

            await showErrorDialog({
              header: errorHeader,
              message: errorMessage,
            });
          } else if (errorCode === "DELETE_GROUP_PETITION_ERROR") {
            const singlePetitionMessage = (
              <FormattedMessage
                id="component.delete-petitions.group-error-singular"
                defaultMessage="The {name} {type, select, PETITION {petition} other{template}} cannot be deleted because it has been shared with you through a group."
                values={{ name: <b>{petitionName}</b>, type }}
              />
            );

            const multiplePetitionMessage = (
              <>
                <FormattedMessage
                  id="component.delete-petitions.group-error-plural"
                  defaultMessage="The following {type, select, PETITION {petitions} other{templates}} cannot be deleted because they have been shared with you through a group:"
                  values={{ type }}
                />
                <UnorderedList paddingLeft={2} pt={2}>
                  {cachedPetitions.map((petition) => (
                    <ListItem key={petition!.id} textStyle={petition!.name ? undefined : "hint"}>
                      {petition?.name ??
                        intl.formatMessage({
                          id: "generic.untitled-petition",
                          defaultMessage: "Untitled petition",
                        })}
                    </ListItem>
                  ))}
                </UnorderedList>
              </>
            );

            const errorMessage =
              conflictingPetitionIds.length === 1 ? singlePetitionMessage : multiplePetitionMessage;

            await showErrorDialog({
              header: errorHeader,
              message: errorMessage,
            });
          } else if (errorCode === "DELETE_PUBLIC_TEMPLATE_ERROR") {
            const singlePetitionMessage = (
              <FormattedMessage
                id="component.delete-petitions.public-templates-error-singular"
                defaultMessage="The {name} template cannot be deleted because it is public."
                values={{ name: <b>{petitionName}</b> }}
              />
            );

            const multiplePetitionMessage = (
              <>
                <FormattedMessage
                  id="component.delete-petitions.public-templates-error-plural"
                  defaultMessage="The following templates cannot be deleted because they are public:"
                />
                <UnorderedList paddingLeft={2} pt={2}>
                  {cachedPetitions.map((petition) => (
                    <ListItem key={petition!.id} textStyle={petition!.name ? undefined : "hint"}>
                      {petition?.name ??
                        intl.formatMessage({
                          id: "generic.untitled-template",
                          defaultMessage: "Untitled template",
                        })}
                    </ListItem>
                  ))}
                </UnorderedList>
              </>
            );

            const errorMessage =
              conflictingPetitionIds.length === 1 ? singlePetitionMessage : multiplePetitionMessage;

            await showErrorDialog({
              header: errorHeader,
              message: errorMessage,
            });
          }
        }
        throw error;
      }
    },
    [intl.locale]
  );
}

export function ConfirmDeletePetitionsDialog({
  petitionIds,
  name,
  isTemplate,
  ...props
}: DialogProps<{
  name: string;
  petitionIds: string[];
  isTemplate: boolean;
}>) {
  const count = petitionIds.length;

  const header = isTemplate ? (
    <FormattedMessage
      id="component.delete-petitions.confirm-delete-template.header"
      defaultMessage="Delete {count, plural, =1 {template} other {templates}}"
      values={{ count }}
    />
  ) : (
    <FormattedMessage
      id="component.delete-petitions.confirm-delete-petition.header"
      defaultMessage="Delete {count, plural, =1 {petition} other {petitions}}"
      values={{ count }}
    />
  );

  const body = isTemplate ? (
    <FormattedMessage
      id="component.delete-petitions.confirm-delete-template.body"
      defaultMessage="Are you sure you want to delete {count, plural, =1 {<b>{name}</b>} other {the <b>#</b> selected templates}}?"
      values={{
        count,
        name,
      }}
    />
  ) : (
    <FormattedMessage
      id="component.delete-petitions.confirm-delete-petition.body"
      defaultMessage="Are you sure you want to delete {count, plural, =1 {<b>{name}</b>} other {the <b>#</b> selected petitions}}?"
      values={{
        count,
        name,
      }}
    />
  );

  return (
    <ConfirmDialog
      header={header}
      body={body}
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.confirm-delete-button" defaultMessage="Yes, delete" />
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
