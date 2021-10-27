import { Button } from "@chakra-ui/button";
import { FormControl, FormLabel } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Stack, Text } from "@chakra-ui/layout";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { DialogProps, useDialog } from "../common/DialogProvider";

interface AddSignatureAPIKeyDialogData {
  APIKey: string;
}

function AddSignatureAPIKeyDialog({ ...props }: DialogProps<{}, AddSignatureAPIKeyDialogData>) {
  const { handleSubmit, register } = useForm<{ APIKey: string }>({
    defaultValues: {
      APIKey: "",
    },
  });

  const apikeyRef = useRef<HTMLInputElement>(null);
  const apikeyRegisterProps = useRegisterWithRef(apikeyRef, register, "APIKey", {
    required: true,
  });

  return (
    <ConfirmDialog
      hasCloseButton
      initialFocusRef={apikeyRef}
      content={{
        as: "form",
        onSubmit: handleSubmit((data) => props.onResolve(data)),
      }}
      header={
        <Text>
          <FormattedMessage
            id="component.add-signature-apikey-dialog.title"
            defaultMessage="Add members to group"
          />
        </Text>
      }
      body={
        <Stack>
          <FormControl id="apikey">
            <FormLabel>
              <FormattedMessage
                id="component.add-signature-apikey-dialog.apikey-label"
                defaultMessage="API Key"
              />
            </FormLabel>
            <Input {...apikeyRegisterProps} />
          </FormControl>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="purple" variant="solid">
          <FormattedMessage id="generic.done" defaultMessage="Done" />
        </Button>
      }
      {...props}
    />
  );
}

export function useAddSignatureAPIKeyDialog() {
  return useDialog(AddSignatureAPIKeyDialog);
}
