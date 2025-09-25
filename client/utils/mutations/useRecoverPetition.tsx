import { gql, useMutation } from "@apollo/client";
import { Button, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { PathName } from "@parallel/components/common/PathName";
import { PetitionNameWithPath } from "@parallel/components/common/PetitionNameWithPath";
import {
  PetitionBaseType,
  useRecoverPetition_PetitionBaseOrFolderFragment,
  useRecoverPetition_recoverPetitionsFromDeletionDocument,
} from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { partitionOnTypename } from "../apollo/typename";

export function useRecoverPetition() {
  const showRecoverPetitionDialog = useRecoverPetitionDialog();
  const [recoverParallels] = useMutation(useRecoverPetition_recoverPetitionsFromDeletionDocument);
  return async function (
    petitionsOrFolders: useRecoverPetition_PetitionBaseOrFolderFragment[],
    type: PetitionBaseType,
  ) {
    try {
      const [folders, petitions] = partitionOnTypename(petitionsOrFolders, "PetitionFolder");

      const petitionIds = petitions.map((p) => p.id);
      const folderIds = folders.map((f) => f.folderId);
      await showRecoverPetitionDialog({
        petitionsOrFolders,
        type,
      });
      await recoverParallels({
        variables: {
          ids: petitionIds,
          folders: { folderIds, type },
        },
      });
      return true;
    } catch {
      return false;
    }
  };
}

useRecoverPetition.fragments = {
  get PetitionBaseOrFolder() {
    return gql`
      fragment useRecoverPetition_PetitionBaseOrFolder on PetitionBaseOrFolder {
        ... on PetitionBase {
          ...useRecoverPetition_PetitionBase
        }
        ... on PetitionFolder {
          ...useRecoverPetition_PetitionFolder
        }
      }
      ${this.PetitionBase}
      ${this.PetitionFolder}
    `;
  },
  get PetitionBase() {
    return gql`
      fragment useRecoverPetition_PetitionBase on PetitionBase {
        id
        path
        ...PetitionName_PetitionBase
      }
      ${PetitionNameWithPath.fragments.PetitionBase}
    `;
  },
  get PetitionFolder() {
    return gql`
      fragment useRecoverPetition_PetitionFolder on PetitionFolder {
        folderId: id
        path
        petitionCount
      }
    `;
  },
};

useRecoverPetition.mutations = [
  gql`
    mutation useRecoverPetition_recoverPetitionsFromDeletion($ids: [GID!], $folders: FoldersInput) {
      recoverPetitionsFromDeletion(ids: $ids, folders: $folders)
    }
  `,
];

function RecoverPetitionDialog({
  petitionsOrFolders,
  type,
  ...props
}: DialogProps<
  {
    petitionsOrFolders: useRecoverPetition_PetitionBaseOrFolderFragment[];
    type: PetitionBaseType;
  },
  void
>) {
  const intl = useIntl();
  const [folders, petitions] = partitionOnTypename(petitionsOrFolders, "PetitionFolder");

  const folderPetitionCount = folders.reduce((acc, curr) => acc + curr.petitionCount, 0);
  const foldersCount = folders.length;
  const petitionCount = folders.length ? folderPetitionCount + petitions.length : petitions.length;

  return (
    <ConfirmDialog
      {...props}
      content={{
        containerProps: {
          as: "form",
          onSubmit: () => {
            props.onResolve();
          },
        },
      }}
      hasCloseButton
      header={
        type === "TEMPLATE" ? (
          <FormattedMessage
            id="component.recover-petition-dialog.header-template"
            defaultMessage="Recover {count, plural, =1 {template} other {# templates}}"
            values={{ count: petitionCount }}
          />
        ) : (
          <FormattedMessage
            id="component.recover-petition-dialog.header"
            defaultMessage="Recover {count, plural, =1 {parallel} other {# parallels}}"
            values={{ count: petitionCount }}
          />
        )
      }
      body={
        <Stack>
          <Text>
            {type === "TEMPLATE" ? (
              <FormattedMessage
                id="component.recover-petition-dialog.body-template"
                defaultMessage="When you recover a template, you will be able to edit its content again."
              />
            ) : (
              <FormattedMessage
                id="component.recover-petition-dialog.body"
                defaultMessage="When you recover a parallel, you will be able to edit its content again. Any data already anonymized cannot be recovered."
              />
            )}
          </Text>
          <Text>
            {type === "TEMPLATE" ? (
              <FormattedMessage
                id="component.recover-petition-dialog.body-question"
                defaultMessage="Do you want to recover {list}?"
                values={{
                  list: intl.formatList(
                    [
                      foldersCount > 0
                        ? intl.formatMessage(
                            {
                              id: "component.recover-petition-dialog.body-part-folders-template",
                              defaultMessage:
                                "{count, plural, =1{<b>{name}</b>} other {the <b>{count}</b> selected folders}} ({petitionCount, plural, =1{# template} other {# templates}})",
                            },
                            {
                              count: folderPetitionCount,
                              name: <PathName path={folders[0].path} type={type} />,
                              petitionCount: folderPetitionCount,
                            },
                          )
                        : null,
                      petitions.length > 0
                        ? intl.formatMessage(
                            {
                              id: "component.recover-petition-dialog.body-part-templates",
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
                id="component.recover-petition-dialog.body-question"
                defaultMessage="Do you want to recover {list}?"
                values={{
                  list: intl.formatList(
                    [
                      foldersCount > 0
                        ? intl.formatMessage(
                            {
                              id: "component.recover-petition-dialog.body-part-folders",
                              defaultMessage:
                                "{count, plural, =1{<b>{name}</b>} other {the <b>{count}</b> selected folders}} ({petitionCount, plural, =1{# parallel} other {# parallels}})",
                            },
                            {
                              count: foldersCount,
                              name: <PathName path={folders[0].path} type={type} />,
                              petitionCount: folderPetitionCount,
                            },
                          )
                        : null,
                      petitions.length > 0
                        ? intl.formatMessage(
                            {
                              id: "component.recover-petition-dialog.body-part-petitions",
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
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="primary">
          <FormattedMessage id="generic.recover" defaultMessage="Recover" />
        </Button>
      }
    />
  );
}

function useRecoverPetitionDialog() {
  return useDialog(RecoverPetitionDialog);
}
