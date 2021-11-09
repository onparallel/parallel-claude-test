import { Button } from "@chakra-ui/button";
import { Checkbox } from "@chakra-ui/checkbox";
import { FormControl, FormLabel, FormErrorMessage } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { HStack, Stack, Text } from "@chakra-ui/layout";
import { Select } from "@chakra-ui/select";
import { SignatureIntegrationProvider } from "@parallel/graphql/__types";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { DialogProps, useDialog } from "../common/DialogProvider";
import { HelpPopover } from "../common/HelpPopover";
import { NormalLink } from "../common/Link";

interface AddSignatureAPIKeyDialogData {
  name: string;
  provider: SignatureIntegrationProvider;
  apiKey: string;
  isDefault: boolean;
}

function AddSignatureAPIKeyDialog({ ...props }: DialogProps<{}, AddSignatureAPIKeyDialogData>) {
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<AddSignatureAPIKeyDialogData>({
    defaultValues: {
      name: "Signaturit",
      provider: "SIGNATURIT",
      apiKey: "",
      isDefault: false,
    },
  });

  const apikeyRef = useRef<HTMLInputElement>(null);
  const apikeyRegisterProps = useRegisterWithRef(apikeyRef, register, "apiKey", {
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
            defaultMessage="Enter your API Key"
          />
        </Text>
      }
      body={
        <Stack spacing={4}>
          <FormControl id="provider">
            <FormLabel>Proveedor de firma</FormLabel>
            <Select variant="outline" placeholder="Signaturit" isDisabled={true} />
          </FormControl>
          <FormControl id="name" isInvalid={!!errors.name}>
            <FormLabel>
              <FormattedMessage id="generic.name" defaultMessage="Name" />
            </FormLabel>
            <Stack>
              <Input
                {...register("name", {
                  required: true,
                })}
              />
              <FormErrorMessage>
                <FormattedMessage
                  id="component.add-signature-apikey-dialog.name-required-error"
                  defaultMessage="Name is required"
                />
              </FormErrorMessage>
              <Text fontSize="sm">
                <FormattedMessage
                  id="component.add-signature-apikey-dialog.name-help"
                  defaultMessage=" You will not be able to change this value after it is created."
                />
              </Text>
            </Stack>
          </FormControl>
          <FormControl id="apikey" isInvalid={!!errors.apiKey}>
            <FormLabel>
              <HStack alignContent="center">
                <FormattedMessage
                  id="component.add-signature-apikey-dialog.apikey-label"
                  defaultMessage="API Key"
                />
                <HelpPopover>
                  <Text fontSize="sm">
                    <FormattedMessage
                      id="component.add-signature-apikey-dialog.apikey-help"
                      defaultMessage="This key is provided by Signaturit and is required to perform the integration"
                    />
                  </Text>
                </HelpPopover>
              </HStack>
            </FormLabel>
            <Stack>
              <Input {...apikeyRegisterProps} />
              <FormErrorMessage>
                <FormattedMessage
                  id="component.add-signature-apikey-dialog.apikey-required-error"
                  defaultMessage="Please, enter an API Key"
                />
              </FormErrorMessage>
              <Text fontSize="sm">
                <FormattedMessage
                  id="component.add-signature-apikey-dialog.help"
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
          </FormControl>

          <Checkbox {...register("isDefault")}>
            <FormattedMessage
              id="component.add-signature-apikey-dialog.checkbox-set-default"
              defaultMessage="Set as default"
            />
          </Checkbox>
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

export function useAddSignatureAPIKeyDialog() {
  return useDialog(AddSignatureAPIKeyDialog);
}
