import { gql, useMutation } from "@apollo/client";
import { Button } from "@chakra-ui/button";
import { FormControl, FormErrorMessage, FormLabel } from "@chakra-ui/form-control";
import { Flex, HStack, Stack, Text } from "@chakra-ui/layout";
import {
  Checkbox,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Radio,
  RadioGroup,
  Spinner,
  useCounter,
  useToast,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { NormalLink } from "@parallel/components/common/Link";
import { Steps } from "@parallel/components/common/Steps";
import {
  AddSignatureCredentialsDialog_validateSignaturitApiKeyDocument,
  SignatureOrgIntegrationProvider,
} from "@parallel/graphql/__types";
import { withError } from "@parallel/utils/promises/withError";
import { useDocusignConsentPopup } from "@parallel/utils/useDocusignConsentPopup";
import { useState } from "react";
import { Controller, FormProvider, useForm, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

const PROVIDERS: SignatureOrgIntegrationProvider[] = ["SIGNATURIT", "DOCUSIGN"];
type SignatureCredentials<TProvider extends SignatureOrgIntegrationProvider> = {
  SIGNATURIT: { API_KEY: string };
  DOCUSIGN: {};
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
  ...props
}: DialogProps<{}, AddSignatureCredentialsDialogData>) {
  const {
    valueAsNumber: currentStep,
    isAtMin: isFirstStep,
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
    reValidateMode: "onSubmit",
  });

  const selectedProvider = form.watch("provider");

  async function submitForm() {
    const [error] = await withError(
      form.handleSubmit(props.onResolve, (d) => {
        throw new Error();
      })
    );
    if (!error) {
      props.onResolve(form.getValues());
    }
  }

  const [consentState, setConsentState] = useState<"IDLE" | "AWAITING">("IDLE");

  const showDocusignConsentPopup = useDocusignConsentPopup();
  const toast = useToast();
  async function handleConfirmClick() {
    if (isLastStep) {
      if (selectedProvider === "DOCUSIGN") {
        setConsentState("AWAITING");
        const [error] = await withError(
          showDocusignConsentPopup({
            isDefault: form.getValues("isDefault"),
            name: form.getValues("name"),
          })
        );
        setConsentState("IDLE");
        if (!error) {
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
              { provider: "Docusign" }
            ),
          });
          props.onResolve(form.getValues());
        }
      } else {
        await submitForm();
      }
    } else {
      nextStep();
    }
  }

  function handleCancelClick() {
    if (isFirstStep) {
      props.onReject();
    } else {
      previousStep();
    }
  }

  return (
    <ConfirmDialog
      hasCloseButton
      closeOnOverlayClick={false}
      header={
        <Flex alignItems="baseline">
          <Text>
            <FormattedMessage
              id="component.add-signature-credentials-dialog.title"
              defaultMessage="New signature provider"
            />
          </Text>
          <Text marginLeft={2} color="gray.600" fontSize="md" fontWeight="400">
            {currentStep + 1}/2
          </Text>
        </Flex>
      }
      body={
        <FormProvider {...form}>
          <Steps currentStep={currentStep}>
            <AddSignatureCredentialsStep1 />
            <AddSignatureCredentialsStep2 />
          </Steps>
        </FormProvider>
      }
      confirm={
        <Button
          colorScheme="primary"
          variant="solid"
          onClick={handleConfirmClick}
          isLoading={form.formState.isSubmitting || consentState === "AWAITING"}
        >
          {isLastStep ? (
            selectedProvider === "DOCUSIGN" ? (
              <FormattedMessage
                id="component.add-signature-credentials-dialog.docusign-authorize.button"
                defaultMessage="Authorize"
              />
            ) : (
              <FormattedMessage id="generic.accept" defaultMessage="Accept" />
            )
          ) : (
            <FormattedMessage id="generic.continue" defaultMessage="Continue" />
          )}
        </Button>
      }
      cancel={
        <Button onClick={handleCancelClick}>
          {isFirstStep ? (
            <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
          ) : (
            <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
          )}
        </Button>
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
                    process.env.NEXT_PUBLIC_ASSETS_URL
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

  const [validateSignaturitApiKey, { loading: isValidating }] = useMutation(
    AddSignatureCredentialsDialog_validateSignaturitApiKeyDocument
  );

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
        <InputGroup>
          <Input
            {...register("credentials.API_KEY", {
              required: true,
              validate: async (apiKey: string) => {
                const data = await validateSignaturitApiKey({
                  variables: { apiKey },
                });
                return data.data?.validateSignaturitApiKey.success ?? false;
              },
            })}
          />
          <InputRightElement>
            {isValidating ? (
              <Spinner thickness="2px" speed="0.65s" emptyColor="gray.200" color="gray.500" />
            ) : null}
          </InputRightElement>
        </InputGroup>
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

function DocusignCredentialsInput() {
  return (
    <Text fontSize="sm">
      <FormattedMessage
        id="component.add-signature-credentials-dialog.docusign-explainer"
        defaultMessage="When you click on Authorize a window will open in which Docusign will ask you for permission to send signatures on your behalf."
      />
    </Text>
  );
}

function AddSignatureCredentialsStep2() {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<AddSignatureCredentialsDialogData>();

  const selectedProvider = watch("provider");
  setValue("name", selectedProvider[0].toUpperCase() + selectedProvider.substring(1).toLowerCase());

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
        <DocusignCredentialsInput />
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

const _mutations = [
  gql`
    mutation AddSignatureCredentialsDialog_validateSignaturitApiKey($apiKey: String!) {
      validateSignaturitApiKey(apiKey: $apiKey) {
        success
      }
    }
  `,
];
