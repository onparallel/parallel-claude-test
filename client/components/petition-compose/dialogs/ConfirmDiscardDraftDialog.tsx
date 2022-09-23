import { gql } from "@apollo/client";
import { Button, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useAutoConfirmDiscardDraftDialog_PetitionBaseFragment } from "@parallel/graphql/__types";
import { useDeletePetitions } from "@parallel/utils/mutations/useDeletePetitions";
import { usePreventNavigation } from "@parallel/utils/usePreventNavigation";
import { useCallback, useEffect, useRef } from "react";
import { FormattedMessage } from "react-intl";

export function ConfirmDiscardDraftDialog({ ...props }: DialogProps<{}, boolean>) {
  const keepRef = useRef<HTMLButtonElement>(null);
  return (
    <ConfirmDialog
      hasCloseButton
      size="lg"
      header={
        <FormattedMessage
          id="component.confirm-discard-draft-dialog.header"
          defaultMessage="Do you want to save this draft?"
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.confirm-discard-draft-dialog.body"
              defaultMessage="This parallel has no replies and has not been sent. Do you want to save it?"
            />
          </Text>
        </Stack>
      }
      initialFocusRef={keepRef}
      alternative={
        <Button onClick={() => props.onReject()}>
          <FormattedMessage
            id="component.confirm-discard-draft-dialog.back"
            defaultMessage="Go back"
          />
        </Button>
      }
      cancel={
        <Button onClick={() => props.onResolve(true)}>
          <FormattedMessage id="generic.delete" defaultMessage="Delete" />
        </Button>
      }
      confirm={
        <Button ref={keepRef} colorScheme="primary" onClick={() => props.onResolve(false)}>
          <FormattedMessage
            id="component.confirm-discard-draft-dialog.save-draft"
            defaultMessage="Save draft"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmDiscardDraftDialog() {
  return useDialog(ConfirmDiscardDraftDialog);
}

export function useAutoConfirmDiscardDraftDialog(
  isDraft: boolean,
  petition: useAutoConfirmDiscardDraftDialog_PetitionBaseFragment
) {
  const showConfirmDiscardDraftDialog = useConfirmDiscardDraftDialog();

  const prevIsDraft = useRef(isDraft);
  useEffect(() => {
    if (!isDraft && prevIsDraft.current) {
      localStorage.removeItem(`confirm-parallel-draft`);
      prevIsDraft.current = false;
    }
  }, [isDraft]);

  const deletePetitions = useDeletePetitions();
  return usePreventNavigation({
    shouldConfirmNavigation: (path: string) => {
      const exitingPetition = !path.includes(`/app/petitions/${petition.id}`);
      return isDraft && exitingPetition && Boolean(localStorage.getItem(`confirm-parallel-draft`));
    },
    confirmNavigation: useCallback(async () => {
      try {
        const deleteDraft = await showConfirmDiscardDraftDialog({});
        if (deleteDraft) {
          await deletePetitions([petition], "PETITION", undefined, true);
        }
        localStorage.removeItem(`confirm-parallel-draft`);
        return true;
      } catch {
        return false;
      }
    }, []),
  });
}

useAutoConfirmDiscardDraftDialog.fragments = {
  get PetitionBase() {
    return gql`
      fragment useAutoConfirmDiscardDraftDialog_PetitionBase on PetitionBase {
        id
        path
      }
    `;
  },
};
