import { Button } from "@chakra-ui/button";
import { Checkbox } from "@chakra-ui/checkbox";
import { FormControl, FormErrorMessage, FormLabel } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { HStack, Stack, Text } from "@chakra-ui/layout";
import { Select } from "@chakra-ui/select";
import { SignatureOrgIntegrationProvider } from "@parallel/graphql/__types";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { DialogProps, useDialog } from "../common/DialogProvider";
import { HelpPopover } from "../common/HelpPopover";
import { NormalLink } from "../common/Link";

interface AddSignatureApiKeyDialogData {
  name: string;
  provider: SignatureOrgIntegrationProvider;
  apiKey: string;
  isDefault: boolean;
}

function AddSignatureApiKeyDialog({ ...props }: DialogProps<{}, AddSignatureApiKeyDialogData>) {
  const intl = useIntl();
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<AddSignatureApiKeyDialogData>({
    defaultValues: {
      name: "Signaturit",
      provider: "SIGNATURIT",
      apiKey: "",
      isDefault: false,
    },
  });

  const apikeyRef = useRef<HTMLInputElement>(null);
  const apiKeyInputProps = useRegisterWithRef(apikeyRef, register, "apiKey", {
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
            id="component.add-signature-api-key-dialog.title"
            defaultMessage="Enter your API Key"
          />
        </Text>
      }
      body={
        <Stack spacing={4}>
          <FormControl id="provider">
            <FormLabel>
              <FormattedMessage id="generic.integration-provider" defaultMessage="Provider" />
            </FormLabel>
            <Select variant="outline" placeholder="Signaturit" isDisabled={true} />
          </FormControl>
          <FormControl id="name" isInvalid={!!errors.name}>
            <FormLabel>
              <FormattedMessage id="generic.integration-name" defaultMessage="Name" />
            </FormLabel>
            <Stack>
              <Input {...register("name", { required: true })} />
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.required-field-error"
                  defaultMessage="The field is required"
                />
              </FormErrorMessage>
              <Text fontSize="sm">
                <FormattedMessage
                  id="component.add-signature-apikey-dialog.name-help"
                  defaultMessage="You will not be able to change this value after it is created."
                />
              </Text>
            </Stack>
          </FormControl>
          <FormControl id="apikey" isInvalid={!!errors.apiKey}>
            <FormLabel>
              <HStack alignContent="center">
                <FormattedMessage
                  id="component.add-signature-apikey-dialog.api-key-label"
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
              <Input {...apiKeyInputProps} />
              <FormErrorMessage>
                <FormattedMessage
                  id="component.add-signature-apikey-dialog.apikey-required-error"
                  defaultMessage="Please, enter an API Key"
                />
              </FormErrorMessage>
              <Text fontSize="sm">
                <FormattedMessage
                  id="component.add-signature-apikey-dialog.help"
                  defaultMessage="If you need help to get your key you can find more information <a>here</a>."
                  values={{
                    a: (chunks: any) => (
                      <NormalLink
                        isExternal
                        href={
                          intl.locale === "en"
                            ? "https://help.signaturit.com/hc/en-us/articles/360000259318-API-Access-get-your-token"
                            : "https://help.signaturit.com/hc/es/articles/360000259318-Acceso-API-consigue-tu-token"
                        }
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

export function useAddSignatureApiKeyDialog() {
  return useDialog(AddSignatureApiKeyDialog);
}
