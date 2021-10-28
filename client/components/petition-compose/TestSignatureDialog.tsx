import { Button } from "@chakra-ui/button";
import { Checkbox } from "@chakra-ui/checkbox";
import { Stack, Text } from "@chakra-ui/layout";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { DialogProps, useDialog } from "../common/DialogProvider";

interface TestSignatureDialogData {
  dontShow: boolean;
}

function TestSignatureDialog({ ...props }: DialogProps<{}, TestSignatureDialogData>) {
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
              defaultMessage="If you continue, the signature will be sent according to the indicated configuration but it will not have any legal validity."
            />
          </Text>
          <Checkbox {...register("dontShow")}>
            <FormattedMessage
              id="component.test-signature-dialog.dont-show-again"
              defaultMessage="Do not show this message again"
            />
          </Checkbox>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="purple" variant="solid">
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
