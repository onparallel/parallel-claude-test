import { Button } from "@chakra-ui/button";
import { FormControl, FormLabel } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { HStack, Stack, Text } from "@chakra-ui/layout";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { DialogProps, useDialog } from "../common/DialogProvider";
import { HelpPopover } from "../common/HelpPopover";
import { NormalLink } from "../common/Link";

interface AddSignaturitAPIKeyDialogData {
  APIKey: string;
}

function AddSignaturitAPIKeyDialog({ ...props }: DialogProps<{}, AddSignaturitAPIKeyDialogData>) {
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
            id="component.add-signaturit-apikey-dialog.title"
            defaultMessage="Enter your API Key"
          />
        </Text>
      }
      body={
        <Stack spacing={4}>
          <FormControl id="apikey">
            <FormLabel>
              <HStack alignContent="center">
                <FormattedMessage
                  id="component.add-signaturit-apikey-dialog.apikey-label"
                  defaultMessage="API Key"
                />
                <HelpPopover>
                  <Text fontSize="sm">
                    <FormattedMessage
                      id="component.add-signaturit-apikey-dialog.apikey-help"
                      defaultMessage="This key is provided by Signaturit and is required to perform the integration"
                    />
                  </Text>
                </HelpPopover>
              </HStack>
            </FormLabel>
            <Input {...apikeyRegisterProps} />
          </FormControl>
          <Text>
            <FormattedMessage
              id="component.add-signaturit-apikey-dialog.help"
              defaultMessage="If you need help to find your key you can find more information <a>here</a>."
              values={{
                a: (chunks: any) => (
                  <NormalLink
                    target="_blank"
                    href="https://help.signaturit.com/hc/es/articles/360000259318-Acceso-API-consigue-tu-token"
                  >
                    {chunks}
                  </NormalLink>
                ),
              }}
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="purple" variant="solid">
          <FormattedMessage id="generic.accept" defaultMessage="Accept" />
        </Button>
      }
      {...props}
    />
  );
}

export function useAddSignaturitAPIKeyDialog() {
  return useDialog(AddSignaturitAPIKeyDialog);
}
