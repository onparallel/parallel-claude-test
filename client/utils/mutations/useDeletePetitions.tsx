import { gql, useMutation, useQuery } from "@apollo/client";
import { Button, Center, ListItem, Spinner, Stack, Text, UnorderedList } from "@chakra-ui/react";
import { AlertCircleIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { PetitionName } from "@parallel/components/common/PetitionName";
import {
  PetitionBaseType,
  useDeletePetitions_deletePetitionsDocument,
  useDeletePetitions_PetitionBaseFragment,
  useDeletePetitions_PetitionFolderFragment,
  useDeletePetitions_petitionsDocument,
} from "@parallel/graphql/__types";
import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, partition } from "remeda";
import { isApolloError } from "../apollo/isApolloError";
import { withError } from "../promises/withError";

type useDeletePetitions_PetitionBaseOrFolder =
  | useDeletePetitions_PetitionBaseFragment
  | useDeletePetitions_PetitionFolderFragment;

function partitionIds(ids: useDeletePetitions_PetitionBaseOrFolder[]) {
  return partition(ids, (t) => t.__typename === "PetitionFolder") as [
    useDeletePetitions_PetitionFolderFragment[],
    useDeletePetitions_PetitionBaseFragment[]
  ];
}

export function useDeletePetitions() {
  const intl = useIntl();
  const showErrorDialog = useErrorDialog();
  const confirmDelete = useDialog(ConfirmDeletePetitionsDialog);
  const confirmDeleteSharedPetitions = useDialog(ConfirmDeleteSharedPetitionsDialog);

  const { refetch: fetchPetitions } = useQuery(useDeletePetitions_petitionsDocument, {
    fetchPolicy: "cache-and-network",
    skip: true,
  });

  const [deletePetitions] = useMutation(useDeletePetitions_deletePetitionsDocument);
  const handleDeletePetitions = async (
    ids: useDeletePetitions_PetitionBaseOrFolder[],
    type: PetitionBaseType,
    { force, dryrun }: { force?: boolean; dryrun?: boolean }
  ) => {
    const [folders, petitions] = partitionIds(ids);
    const petitionIds = petitions.map((p) => p.id);
    const folderIds = folders.map((f) => f.folderId);

    return await deletePetitions({
      variables: {
        ids: petitionIds,
        folders: { folderIds, type },
        force,
        dryrun,
      },
      update(client) {
        if (!dryrun) {
          for (const petitionId of petitionIds) {
            client.evict({ id: petitionId });
          }
          client.gc();
        }
      },
    });
  };

  return useCallback(
    async (
      ids: useDeletePetitions_PetitionBaseOrFolder[],
      type: PetitionBaseType,
      currentPath?: string
    ) => {
      try {
        // first do a dry-run to check if errors will happen when deleting the petition
        const [error] = await withError(handleDeletePetitions(ids, type, { dryrun: true }));
        if (error && isApolloError(error, "DELETE_SHARED_PETITION_ERROR")) {
          // some of the petitions are shared by me to other users, show a confirmation dialog before deleting
          await confirmDeleteSharedPetitions({
            petitionIds: error.graphQLErrors[0].extensions.petitionIds as string[],
            type,
            currentPath,
          });
        } else if (!error) {
          await confirmDelete({ ids, type });
        } else {
          throw error;
        }
        await handleDeletePetitions(ids, type, { force: true });
      } catch (error: any) {
        if (isApolloError(error)) {
          const { data } = await fetchPetitions({
            ids: error.graphQLErrors[0]?.extensions?.petitionIds as string[],
          });

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

          const errorCode = error.graphQLErrors[0]?.extensions?.code as string | undefined;
          const conflictingPetitions = data.petitionsById;
          // can't delete a petition that was shared to me via group
          if (errorCode === "DELETE_GROUP_PETITION_ERROR") {
            await showErrorDialog({
              header: errorHeader,
              message:
                conflictingPetitions.length === 1 ? (
                  <FormattedMessage
                    id="component.delete-petitions.group-error-singular"
                    defaultMessage="The <b>{name}</b> {type, select, PETITION {parallel} other{template}} cannot be deleted because it has been shared with you through a team."
                    values={{
                      name: (
                        <PetitionName
                          petition={conflictingPetitions[0]!}
                          relativePath={currentPath}
                        />
                      ),
                      type,
                    }}
                  />
                ) : (
                  <>
                    <FormattedMessage
                      id="component.delete-petitions.group-error-plural"
                      defaultMessage="The following {type, select, PETITION {parallels} other{templates}} cannot be deleted because they have been shared with you through a team:"
                      values={{ type }}
                    />
                    <UnorderedList paddingLeft={4} pt={2}>
                      {conflictingPetitions.map((petition) => (
                        <ListItem key={petition!.id}>
                          <PetitionName petition={petition!} relativePath={currentPath} />
                        </ListItem>
                      ))}
                    </UnorderedList>
                  </>
                ),
            });
            // can't delete a public template
          } else if (errorCode === "DELETE_PUBLIC_TEMPLATE_ERROR") {
            await showErrorDialog({
              header: errorHeader,
              message:
                conflictingPetitions.length === 1 ? (
                  <FormattedMessage
                    id="component.delete-petitions.public-templates-error-singular"
                    defaultMessage="The <b>{name}</b> template cannot be deleted because it is public."
                    values={{
                      name: (
                        <PetitionName
                          petition={conflictingPetitions[0]!}
                          relativePath={currentPath}
                        />
                      ),
                    }}
                  />
                ) : (
                  <>
                    <FormattedMessage
                      id="component.delete-petitions.public-templates-error-plural"
                      defaultMessage="The following templates cannot be deleted because they are public:"
                    />
                    <UnorderedList paddingLeft={2} pt={2}>
                      {conflictingPetitions.map((petition) => (
                        <ListItem key={petition!.id}>
                          <PetitionName petition={petition!} relativePath={currentPath} />
                        </ListItem>
                      ))}
                    </UnorderedList>
                  </>
                ),
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
  ids,
  type,
  ...props
}: DialogProps<{
  ids: useDeletePetitions_PetitionBaseOrFolder[];
  type: PetitionBaseType;
}>) {
  const intl = useIntl();
  const [folders, petitions] = partitionIds(ids);

  const isTemplate = type === "TEMPLATE";

  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.delete-petitions.confirm-delete-petitions.header"
          defaultMessage="Delete {petitionsAndFolders}"
          values={{
            petitionsAndFolders: intl.formatList(
              [
                petitions.length > 0
                  ? isTemplate
                    ? intl.formatMessage(
                        {
                          id: "component.delete-petitions.confirm-delete-templates.header-part",
                          defaultMessage: "{count, plural, =1{# template} other {# templates}}",
                        },
                        { count: petitions.length }
                      )
                    : intl.formatMessage(
                        {
                          id: "component.delete-petitions.confirm-delete-petitions.header-part",
                          defaultMessage: "{count, plural, =1{# parallel} other {# parallels}}",
                        },
                        { count: petitions.length }
                      )
                  : null,
                ,
                folders.length > 0
                  ? intl.formatMessage(
                      {
                        id: "component.delete-petitions.confirm-delete-folders.header-part",
                        defaultMessage: "{count, plural, =1{# folder} other {# folders}}",
                      },
                      { count: folders.length }
                    )
                  : null,
              ].filter(isDefined)
            ),
          }}
        />
      }
      body={
        <FormattedMessage
          id="component.delete-petitions.confirm-delete-petitions.body"
          defaultMessage="Are you sure you want to delete {petitionsAndFolders}?"
          values={{
            petitionsAndFolders: intl.formatList(
              [
                folders.length > 0
                  ? intl.formatMessage(
                      {
                        id: "component.delete-petitions.confirm-delete-folders.body-part",
                        defaultMessage:
                          "{count, plural, =1{<b>#</b> folder} other {<b>#</b> folders}}",
                      },
                      {
                        count: folders.length,
                      }
                    )
                  : null,
                petitions.length > 0
                  ? isTemplate
                    ? intl.formatMessage(
                        {
                          id: "component.delete-petitions.confirm-delete-templates.body-part",
                          defaultMessage:
                            "{count, plural, =1{<b>{name}</b>} other {the <b>#</b> selected templates}}",
                        },
                        { count: petitions.length, name: <PetitionName petition={petitions[0]} /> }
                      )
                    : intl.formatMessage(
                        {
                          id: "component.delete-petitions.confirm-delete-petitions.body-part",
                          defaultMessage:
                            "{count, plural, =1{<b>{name}</b>} other {the <b>#</b> selected parallels}}",
                        },
                        { count: petitions.length, name: <PetitionName petition={petitions[0]} /> }
                      )
                  : null,
              ].filter(isDefined)
            ),
          }}
        />
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.confirm-delete-button" defaultMessage="Yes, delete" />
        </Button>
      }
      {...props}
    />
  );
}

function ConfirmDeleteSharedPetitionsDialog({
  petitionIds,
  type,
  currentPath,
  ...props
}: DialogProps<{
  petitionIds: string[];
  type: PetitionBaseType;
  currentPath?: string;
}>) {
  const { data, loading } = useQuery(useDeletePetitions_petitionsDocument, {
    variables: { ids: petitionIds },
    fetchPolicy: "cache-and-network",
  });

  const petitions = data?.petitionsById;
  const isTemplate = type === "TEMPLATE";

  const count = petitionIds.length;

  return (
    <ConfirmDialog
      header={
        isTemplate ? (
          <FormattedMessage
            id="component.delete-shared-petitions-dialog.template-header"
            defaultMessage="Delete shared {count, plural, =1 {template} other {templates}}"
            values={{ count }}
          />
        ) : (
          <FormattedMessage
            id="component.delete-shared-petitions-dialog.petition-header"
            defaultMessage="Delete shared {count, plural, =1 {parallel} other {parallels}}"
            values={{ count }}
          />
        )
      }
      body={
        <Stack>
          {isTemplate ? (
            <Text>
              <FormattedMessage
                id="component.delete-shared-petitions-dialog.template-body-1"
                defaultMessage="You shared {count, plural, =1{this template} other{these templates}} with other users. By deleting {count, plural, =1{it} other{them}}, you will remove their access to the {count, plural, =1{template} other{templates}}."
                values={{ count }}
              />
            </Text>
          ) : (
            <Text>
              <FormattedMessage
                id="component.delete-shared-petitions-dialog.petition-body-1"
                defaultMessage="You shared {count, plural, =1{this parallel} other{these parallels}} with other users. By deleting {count, plural, =1{it} other{them}}, you will remove their access to the {count, plural, =1{parallel} other{parallels}}."
                values={{ count }}
              />
            </Text>
          )}

          <Text>
            <FormattedMessage
              id="component.delete-shared-petitions-dialog.body-2"
              defaultMessage="Are you sure you want to delete the following {isTemplate, select, true{templates} other{parallels}}?"
              values={{ isTemplate }}
            />
          </Text>
          {loading ? (
            <Center>
              <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color="primary.500"
                size="md"
              />
            </Center>
          ) : (
            <UnorderedList paddingLeft={4} pt={2}>
              {petitions?.map((petition) => (
                <ListItem key={petition!.id}>
                  <PetitionName petition={petition!} relativePath={currentPath} />
                </ListItem>
              ))}
            </UnorderedList>
          )}
        </Stack>
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.confirm-delete-button" defaultMessage="Yes, delete" />
        </Button>
      }
      {...props}
    />
  );
}

useDeletePetitions.fragments = {
  PetitionBase: gql`
    fragment useDeletePetitions_PetitionBase on PetitionBase {
      id
      path
      ...PetitionName_PetitionBase
    }
    ${PetitionName.fragments.PetitionBase}
  `,
  PetitionFolder: gql`
    fragment useDeletePetitions_PetitionFolder on PetitionFolder {
      folderId: id
      path
    }
  `,
};

const _queries = [
  gql`
    query useDeletePetitions_petitions($ids: [GID!]!) {
      petitionsById(ids: $ids) {
        id
        ...PetitionName_PetitionBase
      }
    }
    ${PetitionName.fragments.PetitionBase}
  `,
];

const _mutations = [
  gql`
    mutation useDeletePetitions_deletePetitions(
      $ids: [GID!]
      $folders: DeleteFoldersInput
      $force: Boolean
      $dryrun: Boolean
    ) {
      deletePetitions(ids: $ids, folders: $folders, force: $force, dryrun: $dryrun)
    }
  `,
];
