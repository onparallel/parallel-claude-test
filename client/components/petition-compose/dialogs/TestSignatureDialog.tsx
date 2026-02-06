import { Checkbox, Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Button, Text } from "@parallel/components/ui";
import { SignatureOrgIntegrationEnvironment } from "@parallel/graphql/__types";
import { useLocalStorage } from "@parallel/utils/useLocalStorage";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

interface TestSignatureDialogData {
  dontShow: boolean;
}

function TestSignatureDialog({
  integrationName,
  ...props
}: DialogProps<{ integrationName: string }, TestSignatureDialogData>) {
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
            id="component.test-signature-dialog.title"
            defaultMessage="Test signature"
          />
        </Text>
      }
      body={
        <Stack spacing={4}>
          <Text>
            <FormattedMessage
              id="component.test-signature-dialog.body"
              defaultMessage="If you continue, the signature will be sent using the <b>{name}</b> test environment and will have no legal validity."
              values={{ name: integrationName }}
            />
          </Text>
          <Checkbox {...register("dontShow")}>
            <FormattedMessage
              id="generic.dont-show-message-again"
              defaultMessage="Do not show this message again"
            />
          </Checkbox>
        </Stack>
      }
      confirm={
        <Button type="submit" colorPalette="primary" variant="solid">
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      {...props}
    />
  );
}

export function useTestSignatureDialog() {
  return useDialog(TestSignatureDialog);
}

export function useHandledTestSignatureDialog() {
  const [showTestSignatureDialogUserPreference, setShowTestSignatureDialogUserPreference] =
    useLocalStorage("show-test-signature-dialog", true);
  const showTestSignatureDialog = useTestSignatureDialog();

  return useCallback(
    async (
      environment: SignatureOrgIntegrationEnvironment | undefined,
      integrationName: string | undefined,
    ) => {
      if (showTestSignatureDialogUserPreference && environment === "DEMO") {
        const { dontShow } = await showTestSignatureDialog({
          integrationName: integrationName ?? "",
        });
        if (dontShow) {
          setShowTestSignatureDialogUserPreference(false);
        }
      }
    },
    [showTestSignatureDialog, showTestSignatureDialogUserPreference],
  );
}
