import { gql, useApolloClient, useMutation, useQuery } from "@apollo/client";
import { Button, Center, ListItem, Spinner, Stack, Text, UnorderedList } from "@chakra-ui/react";
import { AlertCircleIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { PathName } from "@parallel/components/common/PathName";
import { PetitionNameWithPath } from "@parallel/components/common/PetitionNameWithPath";
import {
  PetitionBaseType,
  useDeletePetitions_deletePetitionsDocument,
  useDeletePetitions_PetitionBaseOrFolderFragment,
  useDeletePetitions_petitionsDocument,
} from "@parallel/graphql/__types";
import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { isApolloError } from "../apollo/isApolloError";
import { partitionOnTypename } from "../apollo/typename";
import { withError } from "../promises/withError";

export function useDeletePetitions() {
  const intl = useIntl();
  const showErrorDialog = useErrorDialog();
  const confirmDelete = useDialog(ConfirmDeletePetitionsDialog);
  const confirmDeleteSharedPetitions = useDialog(ConfirmDeleteSharedPetitionsDialog);
  const apollo = useApolloClient();

  const [deletePetitions] = useMutation(useDeletePetitions_deletePetitionsDocument);

  const handleDeletePetitions = async (
    petitionsOrFolders: useDeletePetitions_PetitionBaseOrFolderFragment[],
    type: PetitionBaseType,
    { force, dryrun }: { force?: boolean; dryrun?: boolean }
  ) => {
    const [folders, petitions] = partitionOnTypename(petitionsOrFolders, "PetitionFolder");
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
          for (const folderId of folderIds) {
            client.evict({ id: folderId });
          }
          client.gc();
        }
      },
    });
  };

  return useCallback(
    async (
      petitionsOrFolders: useDeletePetitions_PetitionBaseOrFolderFragment[],
      type: PetitionBaseType,
      currentPath?: string
    ) => {
      try {
        // first do a dry-run to check if errors will happen when deleting the petition
        const [error] = await withError(
          handleDeletePetitions(petitionsOrFolders, type, { dryrun: true })
        );
        if (error && isApolloError(error, "DELETE_SHARED_PETITION_ERROR")) {
          // some of the petitions are shared by me to other users, show a confirmation dialog before deleting
          await confirmDeleteSharedPetitions({
            petitionIds: error.graphQLErrors[0].extensions.petitionIds as string[],
            type,
            currentPath,
          });
        } else if (!error) {
          await confirmDelete({ petitionsOrFolders: petitionsOrFolders, type });
        } else {
          throw error;
        }
        await handleDeletePetitions(petitionsOrFolders, type, { force: true });
      } catch (error: any) {
        if (isApolloError(error)) {
          const { data } = await apollo.query({
            query: useDeletePetitions_petitionsDocument,
            variables: { ids: error.graphQLErrors[0]?.extensions?.petitionIds as string[] },
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
          const conflictingPetitions = data.petitionsById ?? [];

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
                        <PetitionNameWithPath
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
                          <PetitionNameWithPath petition={petition!} relativePath={currentPath} />
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
                        <PetitionNameWithPath
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
                          <PetitionNameWithPath petition={petition!} relativePath={currentPath} />
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
  petitionsOrFolders,
  type,
  ...props
}: DialogProps<{
  petitionsOrFolders: useDeletePetitions_PetitionBaseOrFolderFragment[];
  type: PetitionBaseType;
}>) {
  const intl = useIntl();
  const [folders, petitions] = partitionOnTypename(petitionsOrFolders, "PetitionFolder");

  const folderPetitionCount = folders.reduce((acc, curr) => acc + curr.petitionCount, 0);
  const count = folderPetitionCount + petitions.length;

  return (
    <ConfirmDialog
      header={
        type === "TEMPLATE" ? (
          <FormattedMessage
            id="component.confirm-delete-petitions-dialog.template-header"
            defaultMessage="Delete {count, plural, =1 {template} other {templates}}"
            values={{ count }}
          />
        ) : (
          <FormattedMessage
            id="component.confirm-delete-petitions-dialog.petition-header"
            defaultMessage="Delete {count, plural, =1 {parallel} other {parallels}}"
            values={{ count }}
          />
        )
      }
      body={
        <FormattedMessage
          id="component.confirm-delete-petitions-dialog.body"
          defaultMessage="Are you sure you want to delete {list}?"
          values={{
            list: intl.formatList(
              [
                folders.length > 0
                  ? intl.formatMessage(
                      {
                        id: "component.delete-petitions.confirm-delete-folders.part-folders",
                        defaultMessage:
                          "{count, plural, =1{<b>{name}</b>} other {the <b>{count}</b> selected folders}} ({petitionCount, plural, =1{# {type, select, TEMPLATE {template} other {parallel}}} other {# {type, select, TEMPLATE {templates} other {parallels}}}})",
                      },
                      {
                        count: folders.length,
                        name: <PathName path={folders[0].path} type={type} />,
                        petitionCount: folderPetitionCount,
                        type,
                      }
                    )
                  : null,
                petitions.length > 0
                  ? intl.formatMessage(
                      {
                        id: "component.confirm-delete-petitions-dialog.part-petitions",
                        defaultMessage:
                          "{count, plural, =1{<b>{name}</b>} other {the <b>{count}</b> selected {type, select, TEMPLATE {templates} other {parallels}}}}",
                      },
                      {
                        count: petitions.length,
                        name: <PetitionNameWithPath petition={petitions[0]} />,
                        type,
                      }
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

  const petitions = data?.petitionsById ?? [];

  const count = petitionIds.length;

  return (
    <ConfirmDialog
      header={
        type === "TEMPLATE" ? (
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
          {type === "TEMPLATE" ? (
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
              defaultMessage="Are you sure you want to delete the following {type, select, TEMPLATE{templates} other{parallels}}?"
              values={{ type }}
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
            <UnorderedList paddingLeft={4}>
              {petitions.map((petition) => (
                <ListItem key={petition!.id}>
                  <PetitionNameWithPath petition={petition!} relativePath={currentPath} />
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
  get PetitionBaseOrFolder() {
    return gql`
      fragment useDeletePetitions_PetitionBaseOrFolder on PetitionBaseOrFolder {
        ... on PetitionBase {
          ...useDeletePetitions_PetitionBase
        }
        ... on PetitionFolder {
          ...useDeletePetitions_PetitionFolder
        }
      }
      ${this.PetitionBase}
      ${this.PetitionFolder}
    `;
  },
  get PetitionBase() {
    return gql`
      fragment useDeletePetitions_PetitionBase on PetitionBase {
        id
        path
        ...PetitionName_PetitionBase
      }
      ${PetitionNameWithPath.fragments.PetitionBase}
    `;
  },
  get PetitionFolder() {
    return gql`
      fragment useDeletePetitions_PetitionFolder on PetitionFolder {
        folderId: id
        path
        petitionCount
      }
    `;
  },
};

const _queries = [
  gql`
    query useDeletePetitions_petitions($ids: [GID!]!) {
      petitionsById(ids: $ids) {
        id
        ...useDeletePetitions_PetitionBase
      }
    }
    ${useDeletePetitions.fragments.PetitionBase}
  `,
];

const _mutations = [
  gql`
    mutation useDeletePetitions_deletePetitions(
      $ids: [GID!]
      $folders: FoldersInput
      $force: Boolean
      $dryrun: Boolean
    ) {
      deletePetitions(ids: $ids, folders: $folders, force: $force, dryrun: $dryrun)
    }
  `,
];
