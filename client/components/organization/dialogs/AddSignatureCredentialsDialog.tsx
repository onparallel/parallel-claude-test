import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import {
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Image,
  Input,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  Text,
  useCounter,
  useToast,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { NormalLink } from "@parallel/components/common/Link";
import { Steps } from "@parallel/components/common/Steps";
import {
  SignatureOrgIntegrationProvider,
  useAddSignatureCredentialsDialog_createSignaturitIntegrationDocument,
  useAddSignatureCredentialsDialog_UserFragment,
} from "@parallel/graphql/__types";
import { useDocusignConsentPopup } from "@parallel/utils/useDocusignConsentPopup";
import { MouseEvent, useEffect } from "react";
import { Controller, FormProvider, useForm, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

const PROVIDERS: SignatureOrgIntegrationProvider[] = ["SIGNATURIT", "DOCUSIGN"];
type SignatureCredentials<TProvider extends SignatureOrgIntegrationProvider> = {
  SIGNATURIT: { API_KEY: string };
  DOCUSIGN: { sandboxMode?: boolean };
}[TProvider];

interface AddSignatureCredentialsDialogData<
  TProvider extends SignatureOrgIntegrationProvider = any,
> {
  name: string;
  provider: TProvider;
  credentials: SignatureCredentials<TProvider>;
  isDefault: boolean;
}

interface AddSignatureCredentialsDialogProps {
  user: useAddSignatureCredentialsDialog_UserFragment;
}

function AddSignatureCredentialsDialog({
  user,
  ...props
}: DialogProps<AddSignatureCredentialsDialogProps>) {
  const {
    valueAsNumber: currentStep,
    isAtMax: isLastStep,
    increment: nextStep,
    decrement: previousStep,
  } = useCounter({ min: 0, max: 1, defaultValue: 0 });
  const intl = useIntl();
  const form = useForm<AddSignatureCredentialsDialogData>({
    defaultValues: {
      provider: "SIGNATURIT",
      isDefault: false,
    },
    mode: "onSubmit",
  });
  const { handleSubmit, watch, setError, resetField, setFocus } = form;

  const selectedProvider = watch("provider");
  const showDocusignConsentPopup = useDocusignConsentPopup();
  const toast = useToast();

  function handleNextClick(e: MouseEvent) {
    e.preventDefault();
    if (selectedProvider === "SIGNATURIT") {
      resetField("credentials", { defaultValue: { API_KEY: "" } });
      setTimeout(() => setFocus("credentials.API_KEY"));
    } else if (selectedProvider === "DOCUSIGN") {
      resetField("credentials", { defaultValue: { sandboxMode: false } });
    }
    nextStep();
  }

  const [createSignaturitIntegration] = useMutation(
    useAddSignatureCredentialsDialog_createSignaturitIntegrationDocument,
  );

  return (
    <ConfirmDialog
      hasCloseButton
      closeOnOverlayClick={false}
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async (data) => {
            if (data.provider === "SIGNATURIT") {
              try {
                await createSignaturitIntegration({
                  variables: {
                    apiKey: data.credentials.API_KEY,
                    name: data.name,
                    isDefault: data.isDefault,
                  },
                });
              } catch {
                setError("credentials.API_KEY", { type: "invalid" }, { shouldFocus: true });
                return;
              }
            } else if (data.provider === "DOCUSIGN") {
              try {
                await showDocusignConsentPopup({
                  environment: data.credentials.sandboxMode ? "sandbox" : "production",
                  isDefault: form.getValues("isDefault"),
                  name: form.getValues("name"),
                });
                toast({
                  isClosable: true,
                  status: "success",
                  title: intl.formatMessage({
                    id: "component.add-signature-credentials-dialog.toast-title",
                    defaultMessage: "Success",
                  }),
                  description: intl.formatMessage(
                    {
                      id: "component.add-signature-credentials-dialog.toast-description",
                      defaultMessage: "{provider} integration created successfully.",
                    },
                    { provider: "Docusign" },
                  ),
                });
              } catch {
                return;
              }
            }
            props.onResolve();
          }),
        },
      }}
      header={
        <Flex alignItems="baseline">
          <Text>
            <FormattedMessage
              id="component.add-signature-credentials-dialog.title"
              defaultMessage="New signature provider"
            />
          </Text>
          <Text marginStart={2} color="gray.600" fontSize="md" fontWeight="400">
            {currentStep + 1}/2
          </Text>
        </Flex>
      }
      body={
        <FormProvider {...form}>
          <Steps currentStep={currentStep}>
            <AddSignatureCredentialsStep1 />
            <AddSignatureCredentialsStep2 hasDocusignSandbox={user.hasDocusignSandbox} />
          </Steps>
        </FormProvider>
      }
      confirm={
        isLastStep ? (
          <Button colorScheme="primary" type="submit" isLoading={form.formState.isSubmitting}>
            {selectedProvider === "DOCUSIGN" ? (
              <FormattedMessage
                id="component.add-signature-credentials-dialog.docusign-authorize.button"
                defaultMessage="Authorize"
              />
            ) : (
              <FormattedMessage id="generic.accept" defaultMessage="Accept" />
            )}
          </Button>
        ) : (
          <Button type="button" colorScheme="primary" variant="solid" onClick={handleNextClick}>
            <FormattedMessage id="generic.continue" defaultMessage="Continue" />
          </Button>
        )
      }
      cancel={
        isLastStep ? (
          <Button type="button" onClick={() => previousStep()}>
            <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
          </Button>
        ) : null
      }
      {...props}
    />
  );
}

export function useAddSignatureCredentialsDialog() {
  return useDialog(AddSignatureCredentialsDialog);
}

function AddSignatureCredentialsStep1() {
  const { control } = useFormContext<AddSignatureCredentialsDialogData>();

  return (
    <FormControl id="provider">
      <Controller
        name="provider"
        control={control}
        render={({ field: { onChange, value } }) => (
          <RadioGroup as={Stack} value={value} onChange={onChange}>
            {PROVIDERS.map((value, i) => (
              <Radio value={value} key={i}>
                <Image
                  src={`${
                    process.env.NEXT_PUBLIC_ASSETS_URL ?? ""
                  }/static/logos/${value.toLowerCase()}.png`}
                  alt={value}
                  maxWidth="124px"
                />
              </Radio>
            ))}
          </RadioGroup>
        )}
      />
    </FormControl>
  );
}

function SignaturitCredentialsInput() {
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
            id="component.add-signature-credentials-dialog.signaturit-api-key-label"
            defaultMessage="API Key"
          />
          <HelpPopover>
            <FormattedMessage
              id="component.add-signature-credentials-dialog.signaturit-api-key-help"
              defaultMessage="This key is provided by Signaturit and is required to activate the integration"
            />
          </HelpPopover>
        </HStack>
      </FormLabel>
      <Stack>
        <Input {...register("credentials.API_KEY", { required: true })} />
        <FormErrorMessage>
          <FormattedMessage
            id="component.add-signature-credentials-dialog.signaturit-api-key-required-error"
            defaultMessage="Please, enter a valid API Key"
          />
        </FormErrorMessage>
        <Text fontSize="sm">
          <FormattedMessage
            id="component.add-signature-credentials-dialog.signaturit-help"
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

function DocusignCredentialsInput({ hasDocusignSandbox }: { hasDocusignSandbox: boolean }) {
  const { register } = useFormContext<AddSignatureCredentialsDialogData<"DOCUSIGN">>();
  return (
    <Stack>
      {hasDocusignSandbox ? (
        <FormControl id="credentials.sandboxMode">
          <FormLabel>
            <FormattedMessage
              id="component.add-signature-credentials-dialog.docusign-environment"
              defaultMessage="Demo mode"
            />
            <HelpPopover>
              <Text fontSize="sm">
                <FormattedMessage
                  id="component.add-signature-credentials-dialog.docusign-environment-popover"
                  defaultMessage="With Demo mode you can test DocuSign for free, but your signatures won't have any legal validity."
                />
              </Text>
            </HelpPopover>
            <Switch {...register("credentials.sandboxMode")} marginStart={2} />
          </FormLabel>
        </FormControl>
      ) : null}
      <Text fontSize="sm">
        <FormattedMessage
          id="component.add-signature-credentials-dialog.docusign-explainer"
          defaultMessage="When you click on Authorize a window will open in which DocuSign will ask you for permission to send signatures on your behalf."
        />
      </Text>
    </Stack>
  );
}

function AddSignatureCredentialsStep2({ hasDocusignSandbox }: { hasDocusignSandbox: boolean }) {
  const {
    register,
    formState: { errors },
    resetField,
    watch,
  } = useFormContext<AddSignatureCredentialsDialogData>();

  const selectedProvider = watch("provider");
  useEffect(() => {
    const name = selectedProvider[0].toUpperCase() + selectedProvider.slice(1).toLowerCase();
    resetField("name", { defaultValue: name });
  }, [selectedProvider]);

  return (
    <Stack>
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
              id="component.add-signature-credentials-dialog.name-help"
              defaultMessage="You will not be able to change this value after it is created."
            />
          </Text>
        </Stack>
      </FormControl>
      {selectedProvider === "SIGNATURIT" ? (
        <SignaturitCredentialsInput />
      ) : selectedProvider === "DOCUSIGN" ? (
        <DocusignCredentialsInput hasDocusignSandbox={hasDocusignSandbox} />
      ) : null}
      <FormControl>
        <Checkbox {...register("isDefault")}>
          <FormattedMessage
            id="component.add-signature-credentials-dialog.checkbox-set-default"
            defaultMessage="Set as default"
          />
        </Checkbox>
      </FormControl>
    </Stack>
  );
}

const _fragments = {
  User: gql`
    fragment useAddSignatureCredentialsDialog_User on User {
      id
      hasDocusignSandbox: hasFeatureFlag(featureFlag: DOCUSIGN_SANDBOX_PROVIDER)
    }
  `,
};

const _mutations = [
  gql`
    mutation useAddSignatureCredentialsDialog_createSignaturitIntegration(
      $name: String!
      $apiKey: String!
      $isDefault: Boolean
    ) {
      createSignaturitIntegration(name: $name, apiKey: $apiKey, isDefault: $isDefault) {
        id
      }
    }
  `,
];
