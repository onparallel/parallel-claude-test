import { gql } from "@apollo/client";
import { Button, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { usePetitionShouldConfirmNavigation } from "@parallel/components/layout/PetitionLayout";
import { useConfirmDiscardDraftDialog_PetitionBaseFragment } from "@parallel/graphql/__types";
import { assignRef } from "@parallel/utils/assignRef";
import { useDeletePetitions } from "@parallel/utils/mutations/useDeletePetitions";
import { usePreventNavigation } from "@parallel/utils/usePreventNavigation";
import { useCallback, useEffect, useRef } from "react";
import { FormattedMessage } from "react-intl";

export function ConfirmDiscardDraftDialog({ ...props }: DialogProps<{}, "KEEP" | "DISCARD">) {
  const keepRef = useRef<HTMLButtonElement>(null);
  return (
    <ConfirmDialog
      hasCloseButton
      size="lg"
      header={
        <FormattedMessage
          id="component.confirm-discard-draft-dialog.header"
          defaultMessage="Keep draft?"
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.confirm-discard-draft-dialog.body"
              defaultMessage="This parallel has no replies and has not been sent. Do you want to keep this draft?"
            />
          </Text>
        </Stack>
      }
      initialFocusRef={keepRef}
      alternative={
        <Button onClick={() => props.onReject()}>
          <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
        </Button>
      }
      cancel={
        <Button onClick={() => props.onResolve("DISCARD")} colorScheme="red" variant="ghost">
          <FormattedMessage
            id="component.confirm-discard-draft-dialog.discard-draft"
            defaultMessage="Discard"
          />
        </Button>
      }
      confirm={
        <Button ref={keepRef} colorScheme="primary" onClick={() => props.onResolve("KEEP")}>
          <FormattedMessage
            id="component.confirm-discard-draft-dialog.keep-draft"
            defaultMessage="Keep draft"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmDiscardDraftDialog(
  petition: useConfirmDiscardDraftDialog_PetitionBaseFragment
) {
  const isDraft = petition.__typename === "Petition" && petition.status === "DRAFT";
  const showConfirmDiscardDraftDialog = useDialog(ConfirmDiscardDraftDialog);
  const [shouldConfirmNavigation, setShouldConfirmNavigation] =
    usePetitionShouldConfirmNavigation();

  const prevIsDraft = useRef(isDraft);
  useEffect(() => {
    if (!isDraft && prevIsDraft.current) {
      setShouldConfirmNavigation(false);
      assignRef(prevIsDraft, false);
    }
  }, [isDraft]);

  const deletePetitions = useDeletePetitions();
  return usePreventNavigation({
    shouldConfirmNavigation: (path: string) => {
      const exitingPetition = !path.includes(`/app/petitions/${petition.id}`);
      return isDraft && exitingPetition && shouldConfirmNavigation;
    },
    confirmNavigation: useCallback(async () => {
      try {
        if ((await showConfirmDiscardDraftDialog({})) === "DISCARD") {
          await deletePetitions([petition], "PETITION", undefined, true);
        }
        setShouldConfirmNavigation(false);
        return true;
      } catch {
        return false;
      }
    }, []),
  });
}

useConfirmDiscardDraftDialog.fragments = {
  get PetitionBase() {
    return gql`
      fragment useConfirmDiscardDraftDialog_PetitionBase on PetitionBase {
        ...useDeletePetitions_PetitionBase
        ... on Petition {
          status
        }
      }
      ${useDeletePetitions.fragments.PetitionBase}
    `;
  },
};
