import { Checkbox } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Box, Button, Stack, Text } from "@parallel/components/ui";
import { useLocalStorage } from "@parallel/utils/useLocalStorage";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

interface PetitionFromTemplateDialogData {
  dontShow: boolean;
}

function PetitionFromTemplateDialog({
  ...props
}: DialogProps<DialogProps, PetitionFromTemplateDialogData>) {
  const { handleSubmit, register } = useForm<{ dontShow: boolean }>({
    defaultValues: {
      dontShow: false,
    },
  });

  return (
    <ConfirmDialog
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit((data) => props.onResolve(data)),
        },
      }}
      header={
        <Text>
          <FormattedMessage
            id="component.petition-from-template-dialog.title"
            defaultMessage="Edit parallel"
          />
        </Text>
      }
      body={
        <Stack gap={4}>
          <Box>
            <Text>
              <FormattedMessage
                id="component.petition-from-template-dialog.body"
                defaultMessage="This parallel has been created from a template. Changes to fields or settings will <b>only affect this parallel</b>."
              />
            </Text>
            <br />
            <Text>
              <FormattedMessage
                id="component.petition-from-template-dialog.body-2"
                defaultMessage="If you want your changes to be implemented for all future parallels, make them on the template."
              />
            </Text>
          </Box>
          <Checkbox {...register("dontShow")}>
            <FormattedMessage
              id="generic.dont-show-message-again"
              defaultMessage="Do not show this message again"
            />
          </Checkbox>
        </Stack>
      }
      confirm={
        <Button
          type="submit"
          colorPalette="primary"
          variant="solid"
          data-testid="accept-edit-parallel-button"
        >
          <FormattedMessage id="generic.accept" defaultMessage="Accept" />
        </Button>
      }
      cancel={<></>}
      {...props}
    />
  );
}

export function usePetitionFromTemplateDialog() {
  return useDialog(PetitionFromTemplateDialog);
}

export function useHandledPetitionFromTemplateDialog() {
  const [
    showPetitionFromTemplateDialogUserPreference,
    setShowPetitionFromTemplateDialogUserPreference,
  ] = useLocalStorage("show-petition-from-template-dialog", true);
  const showPetitionFromTemplateDialog = usePetitionFromTemplateDialog();

  return useCallback(async () => {
    if (showPetitionFromTemplateDialogUserPreference) {
      const { dontShow } = await showPetitionFromTemplateDialog();
      if (dontShow) {
        setShowPetitionFromTemplateDialogUserPreference(false);
      }
    }
  }, [showPetitionFromTemplateDialog, showPetitionFromTemplateDialogUserPreference]);
}
