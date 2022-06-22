import { Button } from "@chakra-ui/button";
import { Checkbox } from "@chakra-ui/checkbox";
import { Box, Stack, Text } from "@chakra-ui/layout";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useUserPreference } from "@parallel/utils/useUserPreference";
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
        as: "form",
        onSubmit: handleSubmit((data) => props.onResolve(data)),
      }}
      header={
        <Text>
          <FormattedMessage
            id="component.petition-from-template-dialog.title"
            defaultMessage="Edit petition"
          />
        </Text>
      }
      body={
        <Stack spacing={4}>
          <Box>
            <Text>
              <FormattedMessage
                id="component.petition-from-template-dialog.body"
                defaultMessage="This petition has been created from a template. Changes to fields or settings will <b>only affect this petition</b>."
              />
            </Text>
            <br />
            <Text>
              <FormattedMessage
                id="component.petition-from-template-dialog.body-2"
                defaultMessage="If you want your changes to be maintained in all petitions, make them from the template."
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
        <Button type="submit" colorScheme="primary" variant="solid">
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
  ] = useUserPreference("show-petition-from-template-dialog", true);
  const showPetitionFromTemplateDialog = usePetitionFromTemplateDialog();

  return useCallback(async () => {
    if (showPetitionFromTemplateDialogUserPreference) {
      const { dontShow } = await showPetitionFromTemplateDialog({});
      if (dontShow) {
        setShowPetitionFromTemplateDialogUserPreference(false);
      }
    }
  }, [showPetitionFromTemplateDialog, showPetitionFromTemplateDialogUserPreference]);
}
