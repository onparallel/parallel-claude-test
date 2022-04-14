import { gql, useApolloClient, useMutation } from "@apollo/client";
import { Button, ListItem, Stack, Text, UnorderedList } from "@chakra-ui/react";
import { AlertCircleIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import {
  ConfirmDeletePetitionsDialog_PetitionBaseFragmentDoc,
  useDeletePetitions_deletePetitionsDocument,
} from "@parallel/graphql/__types";
import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isApolloError } from "../apollo/isApolloError";
import { withError } from "../promises/withError";

export function useDeletePetitions() {
  const intl = useIntl();
  const showErrorDialog = useErrorDialog();
  const confirmDelete = useDialog(ConfirmDeletePetitionsDialog);
  const confirmDeleteSharedPetitions = useDialog(ConfirmDeleteSharedPetitionsDialog);

  const [deletePetitions] = useMutation(useDeletePetitions_deletePetitionsDocument);
  const handleDeletePetitions = async (petitionIds: string[], force?: boolean) =>
    await deletePetitions({
      variables: { ids: petitionIds, force },
      update(client, { data }) {
        if (data?.deletePetitions === "SUCCESS") {
          for (const petitionId of petitionIds) {
            client.evict({ id: petitionId });
          }
          client.gc();
        }
      },
    });

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
        const cachedPetition = cache.readFragment({
          fragment: ConfirmDeletePetitionsDialog_PetitionBaseFragmentDoc,
          id: petitionIds[0],
        });
        const isTemplate = cachedPetition?.__typename === "PetitionTemplate";

        const name =
          cachedPetition!.name ||
          (isTemplate
            ? intl.formatMessage({
                id: "generic.unnamed-template",
                defaultMessage: "Unnamed template",
              })
            : intl.formatMessage({
                id: "generic.unnamed-petition",
                defaultMessage: "Unnamed petition",
              }));

        await confirmDelete({
          petitionIds,
          name,
          isTemplate,
        });
        const [error] = await withError(handleDeletePetitions(petitionIds));

        if (isApolloError(error, "DELETE_SHARED_PETITION_ERROR")) {
          await confirmDeleteSharedPetitions({ petitionIds, name, isTemplate });
          await handleDeletePetitions(petitionIds, true);
        } else {
          throw error;
        }
      } catch (error) {
        if (isApolloError(error)) {
          const conflictingPetitionIds =
            (error.graphQLErrors[0]?.extensions?.petitionIds as string[]) ?? [];

          const errorCode = error.graphQLErrors[0]?.extensions?.code as string | undefined;

          const cachedPetitions = conflictingPetitionIds.map(
            (id) =>
              cache.readFragment({
                fragment: ConfirmDeletePetitionsDialog_PetitionBaseFragmentDoc,
                id: id,
              })!
          );

          const petitionName =
            cachedPetitions[0].name ||
            intl.formatMessage({
              id: "generic.unnamed-petition",
              defaultMessage: "Unnamed petition",
            });

          const type =
            cachedPetitions[0].__typename === "PetitionTemplate" ? "TEMPLATE" : "PETITION";

          if (errorCode === "DELETE_GROUP_PETITION_ERROR") {
            const singlePetitionMessage = (
              <FormattedMessage
                id="component.delete-petitions.group-error-singular"
                defaultMessage="The {name} {type, select, PETITION {petition} other{template}} cannot be deleted because it has been shared with you through a team."
                values={{ name: <b>{petitionName}</b>, type }}
              />
            );

            const multiplePetitionMessage = (
              <>
                <FormattedMessage
                  id="component.delete-petitions.group-error-plural"
                  defaultMessage="The following {type, select, PETITION {petitions} other{templates}} cannot be deleted because they have been shared with you through a team:"
                  values={{ type }}
                />
                <UnorderedList paddingLeft={2} pt={2}>
                  {cachedPetitions.map((petition) => (
                    <ListItem key={petition!.id} textStyle={petition!.name ? undefined : "hint"}>
                      {petition?.name ??
                        intl.formatMessage({
                          id: "generic.unnamed-petition",
                          defaultMessage: "Unnamed petition",
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
                          id: "generic.unnamed-template",
                          defaultMessage: "Unnamed template",
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

function ConfirmDeletePetitionsDialog({
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

ConfirmDeletePetitionsDialog.mutations = [
  gql`
    mutation useDeletePetitions_deletePetitions($ids: [GID!]!, $force: Boolean) {
      deletePetitions(ids: $ids, force: $force)
    }
  `,
];

function ConfirmDeleteSharedPetitionsDialog({
  petitionIds,
  name,
  isTemplate,
  ...props
}: DialogProps<{
  petitionIds: string[];
  name: string;
  isTemplate: boolean;
}>) {
  const count = petitionIds.length;

  const header = isTemplate ? (
    <FormattedMessage
      id="component.delete-shared-petitions-dialog.template-header"
      defaultMessage="Delete shared {count, plural, =1 {template} other {templates}}"
      values={{ count }}
    />
  ) : (
    <FormattedMessage
      id="component.delete-shared-petitions-dialog.petition-header"
      defaultMessage="Delete shared {count, plural, =1 {petition} other {petitions}}"
      values={{ count }}
    />
  );

  const body = isTemplate ? (
    <Stack>
      <Text>
        <FormattedMessage
          id="component.delete-shared-petitions-dialog.template-body-1"
          defaultMessage="You shared {count, plural, =1{this template} other{these templates}} with other users. By deleting {count, plural, =1{it} other{them}}, you will remove their access to the {count, plural, =1{template} other{templates}}."
          values={{ count }}
        />
      </Text>
      <Text>
        <FormattedMessage
          id="component.delete-shared-petitions-dialog.template-body-2"
          defaultMessage="Are you sure you want to delete {count, plural, =1{<b>{name}</b>} other{the <b>#</b> selected templates}}?"
          values={{ count, name }}
        />
      </Text>
    </Stack>
  ) : (
    <Stack>
      <Text>
        <FormattedMessage
          id="component.delete-shared-petitions-dialog.petition-body-1"
          defaultMessage="You shared {count, plural, =1{this petition} other{these petitions}} with other users. By deleting {count, plural, =1{it} other{them}}, you will remove their access to the {count, plural, =1{petition} other{petitions}}."
          values={{ count }}
        />
      </Text>
      <Text>
        <FormattedMessage
          id="component.delete-shared-petitions-dialog.petition-body-2"
          defaultMessage="Are you sure you want to delete {count, plural, =1{<b>{name}</b>} other{the <b>#</b> selected petitions}}?"
          values={{ count, name }}
        />
      </Text>
    </Stack>
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
