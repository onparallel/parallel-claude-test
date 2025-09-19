import { gql, useMutation } from "@apollo/client";
import { Button, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { PetitionNameWithPath } from "@parallel/components/common/PetitionNameWithPath";
import {
  PetitionBaseType,
  useRecoverPetition_PetitionBaseOrFolderFragment,
  useRecoverPetition_recoverPetitionsFromDeletionDocument,
} from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { partitionOnTypename } from "../apollo/typename";

export function useRecoverPetition() {
  const showRecoverPetitionDialog = useRecoverPetitionDialog();
  const [recoverParallels] = useMutation(useRecoverPetition_recoverPetitionsFromDeletionDocument);
  return async function (
    petitionsOrFolders: useRecoverPetition_PetitionBaseOrFolderFragment[],
    type: PetitionBaseType,
    petitionName?: string | null,
  ) {
    try {
      const [folders, petitions] = partitionOnTypename(petitionsOrFolders, "PetitionFolder");
      const petitionIds = petitions.map((p) => p.id);
      const folderIds = folders.map((f) => f.folderId);
      await showRecoverPetitionDialog({
        petitionCount:
          petitionIds.length === 1 && folderIds.length === 0
            ? 1
            : petitionIds.length + (folderIds?.length ?? 0),
        petitionName,
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
  petitionCount,
  petitionName,
  ...props
}: DialogProps<{ petitionName?: string | null; petitionCount: number }, void>) {
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
        <FormattedMessage
          id="component.recover-petition-dialog.header"
          defaultMessage="Recover {count, plural, =1 {parallel} other {parallels}}"
          values={{ count: petitionCount }}
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.recover-petition-dialog.body"
              defaultMessage="When you recover a parallel, you will be able to edit its content again. Any data already anonymized cannot be recovered."
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.recover-petition-dialog.body-question"
              defaultMessage="Do you want to recover {count, plural, =1 {the parallel of {petitionName}} other {the selected parallels}}?"
              values={{
                petitionName: petitionName ? (
                  <Text as="span" fontWeight="bold">
                    {petitionName}
                  </Text>
                ) : (
                  <Text as="span" textStyle="hint">
                    <FormattedMessage
                      id="generic.unnamed-parallel"
                      defaultMessage="Unnamed parallel"
                    />
                  </Text>
                ),
                count: petitionCount,
              }}
            />
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
