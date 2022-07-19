import { Button } from "@chakra-ui/button";
import { Checkbox } from "@chakra-ui/checkbox";
import { FormControl, FormErrorMessage, FormLabel } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { HStack, Stack, Text } from "@chakra-ui/layout";
import { Select } from "@chakra-ui/select";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { NormalLink } from "@parallel/components/common/Link";
import { SignatureOrgIntegrationProvider } from "@parallel/graphql/__types";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

type SignatureCredentials<TProvider extends SignatureOrgIntegrationProvider> = {
  SIGNATURIT: { API_KEY: string };
}[TProvider];

interface AddSignatureCredentialsDialogData<
  TProvider extends SignatureOrgIntegrationProvider = any
> {
  name: string;
  provider: TProvider;
  credentials: SignatureCredentials<TProvider>;
  isDefault: boolean;
}

function AddSignatureCredentialsDialog({
  validateCredentials,
  ...props
}: DialogProps<
  {
    validateCredentials<TProvider extends SignatureOrgIntegrationProvider>(
      provider: TProvider,
      c: SignatureCredentials<TProvider>
    ): Promise<{ success: boolean; data?: any }>;
  },
  AddSignatureCredentialsDialogData
>) {
  const form = useForm<AddSignatureCredentialsDialogData>({
    defaultValues: {
      name: "Signaturit",
      provider: "SIGNATURIT",
      credentials: {},
      isDefault: false,
    },
  });

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = form;

  async function handleValidateSignaturitApiKey(apiKey: string) {
    const result = await validateCredentials("SIGNATURIT", {
      API_KEY: apiKey,
    });
    return result.success;
  }

  return (
    <ConfirmDialog
      hasCloseButton
      closeOnOverlayClick={false}
      content={{
        as: "form",
        onSubmit: handleSubmit(async (data) => {
          return props.onResolve(data);
        }),
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
                  id="component.add-signature-api-key-dialog.name-help"
                  defaultMessage="You will not be able to change this value after it is created."
                />
              </Text>
            </Stack>
          </FormControl>
          <FormProvider {...form}>
            <SignaturitCredentialsInput validateApiKey={handleValidateSignaturitApiKey} />
          </FormProvider>

          <Checkbox {...register("isDefault")}>
            <FormattedMessage
              id="component.add-signature-api-key-dialog.checkbox-set-default"
              defaultMessage="Set as default"
            />
          </Checkbox>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="primary" variant="solid" isLoading={isSubmitting}>
          <FormattedMessage id="generic.accept" defaultMessage="Accept" />
        </Button>
      }
      {...props}
    />
  );
}

export function useAddSignatureCredentialsDialog() {
  return useDialog(AddSignatureCredentialsDialog);
}

function SignaturitCredentialsInput({
  validateApiKey,
}: {
  validateApiKey: (apiKey: string) => Promise<boolean>;
}) {
  const intl = useIntl();
  const {
    formState: { errors },
    register,
  } = useFormContext<AddSignatureCredentialsDialogData<"SIGNATURIT">>();

  return (
    <FormControl id="apikey" isInvalid={!!errors.credentials}>
      <FormLabel>
        <HStack alignContent="center">
          <FormattedMessage
            id="component.add-signature-api-key-dialog.api-key-label"
            defaultMessage="API Key"
          />
          <HelpPopover>
            <FormattedMessage
              id="component.add-signature-api-key-dialog.api-key-help"
              defaultMessage="This key is provided by Signaturit and is required to activate the integration"
            />
          </HelpPopover>
        </HStack>
      </FormLabel>
      <Stack>
        <Input
          {...register("credentials.API_KEY", {
            required: true,
            validate: validateApiKey,
          })}
        />
        <FormErrorMessage>
          <FormattedMessage
            id="component.add-signature-api-key-dialog.api-key-required-error"
            defaultMessage="Please, enter a valid API Key"
          />
        </FormErrorMessage>
        <Text fontSize="sm">
          <FormattedMessage
            id="component.add-signature-api-key-dialog.help"
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
  );
}
