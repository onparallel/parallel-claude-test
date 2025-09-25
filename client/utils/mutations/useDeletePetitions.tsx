import { gql, useApolloClient, useMutation, useQuery } from "@apollo/client";
import { Button, Center, ListItem, Spinner, Stack, Text, UnorderedList } from "@chakra-ui/react";
import { AlertCircleIcon } from "@parallel/chakra/icons";
import { useConfirmDeleteDialog } from "@parallel/components/common/dialogs/ConfirmDeleteDialog";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import {
  BaseModalProps,
  DialogProps,
  useDialog,
} from "@parallel/components/common/dialogs/DialogProvider";
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
import { isNonNullish } from "remeda";
import { isApolloError } from "../apollo/isApolloError";
import { partitionOnTypename } from "../apollo/typename";
import { withError } from "../promises/withError";

export function useDeletePetitions({ modalProps }: { modalProps?: BaseModalProps } = {}) {
  const intl = useIntl();
  const showErrorDialog = useErrorDialog();
  const confirmDelete = useDialog(ConfirmDeletePetitionsDialog);
  const confirmDeleteSharedPetitions = useDialog(ConfirmDeleteSharedPetitionsDialog);
  const confirmDeletePermanentlyPetitions = useConfirmDeletePermanentlyPetitionsDialog();

  const apollo = useApolloClient();

  const [deletePetitions] = useMutation(useDeletePetitions_deletePetitionsDocument);

  const handleDeletePetitions = async (
    petitionsOrFolders: useDeletePetitions_PetitionBaseOrFolderFragment[],
    type: PetitionBaseType,
    {
      deletePermanently,
      force,
      dryrun,
    }: {
      deletePermanently?: boolean;
      force?: boolean;
      dryrun?: boolean;
    },
  ) => {
    const [folders, petitions] = partitionOnTypename(petitionsOrFolders, "PetitionFolder");
    const petitionIds = petitions.map((p) => p.id);
    const folderIds = folders.map((f) => f.folderId);
    return await deletePetitions({
      variables: {
        ids: petitionIds,
        folders: { folderIds, type },
        force,
        deletePermanently,
        dryrun,
      },
    });
  };

  return useCallback(
    async (
      petitionsOrFolders: useDeletePetitions_PetitionBaseOrFolderFragment[],
      type: PetitionBaseType,
      currentPath?: string,
      skipConfirmDialogs?: boolean,
      deletePermanently?: boolean,
    ) => {
      try {
        // first do a dry-run to check if errors will happen when deleting the petition
        const [error] = await withError(
          handleDeletePetitions(petitionsOrFolders, type, {
            deletePermanently,
            dryrun: true,
          }),
        );
        if (error && isApolloError(error, "DELETE_SHARED_PETITION_ERROR")) {
          if (!skipConfirmDialogs) {
            // some of the petitions are shared by me to other users, show a confirmation dialog before deleting
            if (deletePermanently) {
              await confirmDeletePermanentlyPetitions({
                petitionsOrFolders: petitionsOrFolders,
                type,
                modalProps,
              });
            } else {
              await confirmDeleteSharedPetitions({
                petitionIds: error.graphQLErrors[0].extensions!.petitionIds as string[],
                type,
                currentPath,
                modalProps,
              });
            }
          }
        } else if (!error) {
          if (!skipConfirmDialogs) {
            if (deletePermanently) {
              await confirmDeletePermanentlyPetitions({
                petitionsOrFolders: petitionsOrFolders,
                type,
                modalProps,
              });
            } else {
              await confirmDelete({
                petitionsOrFolders: petitionsOrFolders,
                type,
                modalProps,
              });
            }
          }
        } else {
          throw error;
        }
        await handleDeletePetitions(petitionsOrFolders, type, {
          deletePermanently,
          force: true,
        });
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
                    <UnorderedList paddingStart={4} pt={2}>
                      {conflictingPetitions.map((petition) => (
                        <ListItem key={petition!.id}>
                          <PetitionNameWithPath petition={petition!} relativePath={currentPath} />
                        </ListItem>
                      ))}
                    </UnorderedList>
                  </>
                ),
              modalProps,
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
                    <UnorderedList paddingStart={2} pt={2}>
                      {conflictingPetitions.map((petition) => (
                        <ListItem key={petition!.id}>
                          <PetitionNameWithPath petition={petition!} relativePath={currentPath} />
                        </ListItem>
                      ))}
                    </UnorderedList>
                  </>
                ),
              modalProps,
            });
          }
        }
        throw error;
      }
    },
    [intl.locale],
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

  const isOneSharedToMe =
    petitions.length === 1 &&
    folderPetitionCount === 0 &&
    petitions.every((p) => p.myEffectivePermission?.permissionType !== "OWNER");

  return (
    <ConfirmDialog
      header={
        isOneSharedToMe ? (
          <FormattedMessage
            id="component.confirm-delete-petitions-dialog.shared-to-me-header"
            defaultMessage="Remove access"
          />
        ) : type === "TEMPLATE" ? (
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
        <Stack>
          <Text>
            {isOneSharedToMe ? (
              <FormattedMessage
                id="component.confirm-delete-petitions-dialog.shared-to-me-body"
                defaultMessage="This {type, select, TEMPLATE {template} other {parallel}} has been shared with you. By removing your access, you will no longer be able to view or edit it. Other users will still have access."
                values={{ type }}
              />
            ) : type === "TEMPLATE" ? (
              <FormattedMessage
                id="component.confirm-delete-templates-dialog.body"
                defaultMessage="Are you sure you want to delete {list}?"
                values={{
                  list: intl.formatList(
                    [
                      folders.length > 0
                        ? intl.formatMessage(
                            {
                              id: "component.confirm-delete-templates-dialog.body-part-folders",
                              defaultMessage:
                                "{count, plural, =1{<b>{name}</b>} other {the <b>{count}</b> selected folders}} ({petitionCount, plural, =1{# template} other {# templates}})",
                            },
                            {
                              count: folders.length,
                              name: <PathName path={folders[0].path} type={type} />,
                              petitionCount: folderPetitionCount,
                            },
                          )
                        : null,
                      petitions.length > 0
                        ? intl.formatMessage(
                            {
                              id: "component.confirm-delete-templates-dialog.body-part-templates",
                              defaultMessage:
                                "{count, plural, =1{<b>{name}</b>} other {the <b>{count}</b> selected templates}}",
                            },
                            {
                              count: petitions.length,
                              name: <PetitionNameWithPath petition={petitions[0]} />,
                            },
                          )
                        : null,
                    ].filter(isNonNullish),
                  ),
                }}
              />
            ) : (
              <>
                <FormattedMessage
                  id="component.confirm-delete-petitions-dialog.body"
                  defaultMessage="Are you sure you want to delete {list}?"
                  values={{
                    list: intl.formatList(
                      [
                        folders.length > 0
                          ? intl.formatMessage(
                              {
                                id: "component.confirm-delete-petitions-dialog.body-part-folders",
                                defaultMessage:
                                  "{count, plural, =1{<b>{name}</b>} other {the <b>{count}</b> selected folders}} ({petitionCount, plural, =1{# parallel} other {# parallels}})",
                              },
                              {
                                count: folders.length,
                                name: <PathName path={folders[0].path} type={type} />,
                                petitionCount: folderPetitionCount,
                              },
                            )
                          : null,
                        petitions.length > 0
                          ? intl.formatMessage(
                              {
                                id: "component.confirm-delete-petitions-dialog.body-part-petitions",
                                defaultMessage:
                                  "{count, plural, =1{<b>{name}</b>} other {the <b>{count}</b> selected parallels}}",
                              },
                              {
                                count: petitions.length,
                                name: <PetitionNameWithPath petition={petitions[0]} />,
                              },
                            )
                          : null,
                      ].filter(isNonNullish),
                    ),
                  }}
                />{" "}
                <FormattedMessage
                  id="component.confirm-delete-petitions-dialog.body-process-cancelled"
                  defaultMessage="Any pending signature or approval requests will be cancelled."
                />
              </>
            )}
          </Text>
          {isOneSharedToMe && (
            <Text fontWeight="bold">
              <FormattedMessage
                id="component.confirm-delete-petitions-dialog.shared-to-me-body-2"
                defaultMessage="Are you sure you want to remove your access to this {type, select, TEMPLATE {template} other {parallel}}?"
                values={{ type }}
              />
            </Text>
          )}
        </Stack>
      }
      confirm={
        <Button
          data-testid="dialog-delete-button"
          colorScheme="red"
          onClick={() => props.onResolve()}
        >
          {isOneSharedToMe ? (
            <FormattedMessage
              id="generic.confirm-remove-my-access-button"
              defaultMessage="Yes, remove my access"
            />
          ) : (
            <FormattedMessage id="generic.confirm-delete-button" defaultMessage="Yes, delete" />
          )}
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
            <>
              <Text>
                <FormattedMessage
                  id="component.delete-shared-petitions-dialog.petition-body-1"
                  defaultMessage="You shared {count, plural, =1{this parallel} other{these parallels}} with other users. By deleting {count, plural, =1{it} other{them}}, you will remove their access to the {count, plural, =1{parallel} other{parallels}}."
                  values={{ count }}
                />{" "}
                <FormattedMessage
                  id="component.confirm-delete-petitions-dialog.body-process-cancelled"
                  defaultMessage="Any pending signature or approval requests will be cancelled."
                />
              </Text>
            </>
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
            <UnorderedList paddingStart={4}>
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
        <Button
          data-testid="dialog-delete-button"
          colorScheme="red"
          onClick={() => props.onResolve()}
        >
          <FormattedMessage id="generic.confirm-delete-button" defaultMessage="Yes, delete" />
        </Button>
      }
      {...props}
    />
  );
}

function useConfirmDeletePermanentlyPetitionsDialog() {
  const showDialog = useConfirmDeleteDialog();
  const intl = useIntl();
  return useCallback(
    async ({
      petitionsOrFolders,
      type,
      modalProps,
    }: {
      petitionsOrFolders: useDeletePetitions_PetitionBaseOrFolderFragment[];
      type: PetitionBaseType;
      modalProps?: BaseModalProps;
    }) => {
      const [folders, petitions] = partitionOnTypename(petitionsOrFolders, "PetitionFolder");
      const folderPetitionCount = folders.reduce((acc, curr) => acc + curr.petitionCount, 0);
      const count = folderPetitionCount + petitions.length;
      return await showDialog({
        header:
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
          ),
        description: (
          <Stack>
            <Text>
              {type === "TEMPLATE" ? (
                <FormattedMessage
                  id="component.confirm-delete-templates-dialog.body"
                  defaultMessage="Are you sure you want to delete {list}?"
                  values={{
                    list: intl.formatList(
                      [
                        folders.length > 0
                          ? intl.formatMessage(
                              {
                                id: "component.confirm-delete-templates-dialog.body-part-folders",
                                defaultMessage:
                                  "{count, plural, =1{<b>{name}</b>} other {the <b>{count}</b> selected folders}} ({petitionCount, plural, =1{# template} other {# templates}})",
                              },
                              {
                                count: folders.length,
                                name: <PathName path={folders[0].path} type={type} />,
                                petitionCount: folderPetitionCount,
                              },
                            )
                          : null,
                        petitions.length > 0
                          ? intl.formatMessage(
                              {
                                id: "component.confirm-delete-templates-dialog.body-part-templates",
                                defaultMessage:
                                  "{count, plural, =1{<b>{name}</b>} other {the <b>{count}</b> selected templates}}",
                              },
                              {
                                count: petitions.length,
                                name: <PetitionNameWithPath petition={petitions[0]} />,
                              },
                            )
                          : null,
                      ].filter(isNonNullish),
                    ),
                  }}
                />
              ) : (
                <FormattedMessage
                  id="component.confirm-delete-petitions-dialog.body"
                  defaultMessage="Are you sure you want to delete {list}?"
                  values={{
                    list: intl.formatList(
                      [
                        folders.length > 0
                          ? intl.formatMessage(
                              {
                                id: "component.confirm-delete-petitions-dialog.body-part-folders",
                                defaultMessage:
                                  "{count, plural, =1{<b>{name}</b>} other {the <b>{count}</b> selected folders}} ({petitionCount, plural, =1{# parallel} other {# parallels}})",
                              },
                              {
                                count: folders.length,
                                name: <PathName path={folders[0].path} type={type} />,
                                petitionCount: folderPetitionCount,
                              },
                            )
                          : null,
                        petitions.length > 0
                          ? intl.formatMessage(
                              {
                                id: "component.confirm-delete-petitions-dialog.body-part-petitions",
                                defaultMessage:
                                  "{count, plural, =1{<b>{name}</b>} other {the <b>{count}</b> selected parallels}}",
                              },
                              {
                                count: petitions.length,
                                name: <PetitionNameWithPath petition={petitions[0]} />,
                              },
                            )
                          : null,
                      ].filter(isNonNullish),
                    ),
                  }}
                />
              )}
            </Text>
            <Text fontWeight="bold">
              {type === "TEMPLATE" ? (
                <FormattedMessage
                  id="component.delete-petitions-dialog.delete-permanently-template"
                  defaultMessage="This action will delete the {count, plural, =1 {template} other {templates}} permanently and cannot be undone."
                  values={{ count }}
                />
              ) : (
                <FormattedMessage
                  id="component.delete-petitions-dialog.delete-permanently-petition"
                  defaultMessage="This action will delete the {count, plural, =1 {parallel} other {parallels}} permanently and cannot be undone."
                  values={{ count }}
                />
              )}
            </Text>
          </Stack>
        ),
        modalProps,
      });
    },
    [],
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
        myEffectivePermission {
          permissionType
        }
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
      $deletePermanently: Boolean
      $force: Boolean
      $dryrun: Boolean
    ) {
      deletePetitions(
        ids: $ids
        folders: $folders
        deletePermanently: $deletePermanently
        force: $force
        dryrun: $dryrun
      )
    }
  `,
];
