import { gql } from "@apollo/client";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Stack,
  Text,
  useCounter,
} from "@chakra-ui/react";
import { ExternalLinkIcon } from "@parallel/chakra/icons";
import { ContactSelect, ContactSelectSelection } from "@parallel/components/common/ContactSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { NormalLink } from "@parallel/components/common/Link";
import { Steps } from "@parallel/components/common/Steps";
import {
  SignatureConfigDialog_PetitionBaseFragment,
  SignatureConfigDialog_SignatureOrgIntegrationFragment,
  SignatureConfigInput,
} from "@parallel/graphql/__types";
import { useCreateContact } from "@parallel/utils/mutations/useCreateContact";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { useSearchContacts } from "@parallel/utils/useSearchContacts";
import { RefObject, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import Select, { Props } from "react-select";
import { SelectedSignerRow } from "../SelectedSignerRow";
import { SignerSelectSelection } from "./ConfirmPetitionSignersDialog";
import { useConfirmSignerInfoDialog } from "./ConfirmSignerInfoDialog";

export type SignatureConfigDialogProps = {
  petition: SignatureConfigDialog_PetitionBaseFragment;
  providers: SignatureConfigDialog_SignatureOrgIntegrationFragment[];
};

export function SignatureConfigDialog({
  petition,
  providers,
  ...props
}: DialogProps<SignatureConfigDialogProps, SignatureConfigInput>) {
  const intl = useIntl();

  const {
    valueAsNumber: currentStep,
    isAtMin: isFirstStep,
    isAtMax: isLastStep,
    increment: nextStep,
    decrement: previousStep,
  } = useCounter({ min: 1, max: 2, defaultValue: 1 });

  const titleRef = useRef<HTMLInputElement>(null);

  const step1Props = useSignatureConfigDialogBodyStep1Props({
    providers,
    petition,
    titleRef,
  });

  const step2Props = useSignatureConfigDialogBodyStep2Props({
    signers: petition.signatureConfig?.signers ?? [],
    allowAdditionalSigners: petition.signatureConfig?.allowAdditionalSigners ?? false,
  });

  const review = step1Props.form.watch("review");

  function handleClickPreviousStep() {
    if (isFirstStep) {
      props.onReject();
    } else {
      previousStep();
    }
  }

  function handleClickNextStep() {
    const {
      getValues: step1Values,
      formState: { errors: step1Errors },
    } = step1Props.form;
    const {
      getValues: step2Values,
      formState: { errors: step2Errors },
    } = step2Props.form;

    if (
      (currentStep === 1 && Object.keys(step1Errors).length > 0) ||
      (currentStep === 2 && Object.keys(step2Errors).length > 0)
    ) {
      return;
    }

    if (!isLastStep && !review) {
      nextStep();
    } else {
      const data = { ...step1Values(), ...step2Values() };
      props.onResolve({
        title: data.title,
        orgIntegrationId: data.provider.id,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        signersInfo: review
          ? []
          : data.signers.map((s) => ({
              contactId: s.contactId,
              email: s.email,
              firstName: s.firstName,
              lastName: s.lastName ?? "",
            })),
        review,
        allowAdditionalSigners: review || data.allowAdditionalSigners || data.signers.length === 0,
      });
    }
  }

  const stepHeaders = useMemo(
    () => [
      intl.formatMessage({
        id: "component.signature-config-dialog.step-1.header",
        defaultMessage: "eSignature configuration",
      }),
      intl.formatMessage({
        id: "component.signature-config-dialog.step-2.header",
        defaultMessage: "Who has to sign the document?",
      }),
    ],
    [intl.locale]
  );

  return (
    <ConfirmDialog
      hasCloseButton
      initialFocusRef={titleRef}
      size="xl"
      content={{ as: "form" }}
      header={
        <Flex alignItems="center">
          {stepHeaders[currentStep - 1]}
          {!review && (
            <Text marginLeft={2} color="gray.600" fontSize="md" fontWeight="400">
              {currentStep}/2
            </Text>
          )}
        </Flex>
      }
      body={
        <Steps currentStep={currentStep} startingIndex={1}>
          <SignatureConfigDialogBodyStep1 {...step1Props} />
          <SignatureConfigDialogBodyStep2 {...step2Props} />
        </Steps>
      }
      confirm={
        <Button colorScheme="purple" onClick={handleClickNextStep}>
          {isLastStep || review ? (
            <FormattedMessage id="generic.save" defaultMessage="Save" />
          ) : (
            <FormattedMessage id="generic.continue" defaultMessage="Continue" />
          )}
        </Button>
        // )
      }
      cancel={
        <Button onClick={handleClickPreviousStep}>
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

SignatureConfigDialog.fragments = {
  get PetitionBase() {
    return gql`
      fragment SignatureConfigDialog_PetitionBase on PetitionBase {
        name
        signatureConfig {
          integration {
            ...SignatureConfigDialog_SignatureOrgIntegration
          }
          signers {
            contactId
            firstName
            lastName
            email
          }
          title
          review
          allowAdditionalSigners
        }
        ... on Petition {
          status
        }
      }
      ${this.SignatureOrgIntegration}
    `;
  },

  get SignatureOrgIntegration() {
    return gql`
      fragment SignatureConfigDialog_SignatureOrgIntegration on SignatureOrgIntegration {
        id
        name
        isDefault
        environment
      }
    `;
  },
};

export function useSignatureConfigDialog() {
  return useDialog(SignatureConfigDialog);
}

function useSignatureConfigDialogBodyStep1Props({
  petition,
  providers,
  titleRef,
}: {
  petition: SignatureConfigDialog_PetitionBaseFragment;
  providers: SignatureConfigDialog_SignatureOrgIntegrationFragment[];
  titleRef: RefObject<HTMLInputElement>;
}) {
  return {
    form: useForm<{
      provider: SignatureConfigDialog_SignatureOrgIntegrationFragment;
      review: boolean;
      title: string;
    }>({
      mode: "onBlur",
      defaultValues: {
        provider:
          petition.signatureConfig?.integration ??
          providers.find((p) => p.isDefault) ??
          providers[0],
        review: petition.signatureConfig?.review ?? false,
        title: petition.signatureConfig?.title ?? petition.name ?? "",
      },
    }),
    petitionIsCompleted:
      petition.__typename === "Petition" && ["COMPLETED", "CLOSED"].includes(petition.status),
    providers,
    titleRef,
  };
}

function SignatureConfigDialogBodyStep1({
  form: {
    control,
    formState: { errors },
    register,
  },
  petitionIsCompleted,
  providers,
  titleRef,
}: ReturnType<typeof useSignatureConfigDialogBodyStep1Props>) {
  const intl = useIntl();

  const signatureIntegrationReactProps = useReactSelectProps<
    SignatureConfigDialog_SignatureOrgIntegrationFragment,
    false
  >();

  const titleRegisterProps = useRegisterWithRef(titleRef, register, "title", {
    required: true,
  });

  const reactSelectProps = useReactSelectProps();

  const reviewBeforeSendOptions = useMemo(
    () => [
      {
        value: "NO",
        label: intl.formatMessage({
          id: "component.signature-config-dialog.review-before-send.option-no",
          defaultMessage: "After completing the petition",
        }),
      },
      {
        value: "YES",
        label: intl.formatMessage({
          id: "component.signature-config-dialog.review-before-send.option-yes",
          defaultMessage: "After reviewing the information",
        }),
      },
    ],
    [intl.locale]
  );

  return (
    <Stack spacing={4}>
      <Text>
        <FormattedMessage
          id="component.signature-config-dialog.header.subtitle"
          defaultMessage="Sign a PDF document with all the replies."
        />
        <Text marginTop={2}>
          <FormattedMessage
            id="component.signature-config-dialog.header.help-link"
            defaultMessage="<a>More about eSignature</a>"
            values={{
              a: (chunks: any[]) => (
                <NormalLink
                  target="_blank"
                  href={
                    intl.locale === "es"
                      ? "https://support.onparallel.com/hc/es/articles/360017087398-Activar-la-firma-electr%C3%B3nica#h_01FRGJTBC90ECANWFJ5DTE2629"
                      : "https://support.onparallel.com/hc/en-us/articles/360017087398-How-to-enable-the-eSignature-in-a-petition"
                  }
                  display="flex"
                  alignItems="center"
                  width="fit-content"
                >
                  {chunks}
                  <ExternalLinkIcon marginLeft={1} />
                </NormalLink>
              ),
            }}
          />
        </Text>
      </Text>
      <FormControl hidden={providers.length < 2}>
        <FormLabel>
          <FormattedMessage
            id="component.signature-config-dialog.provider-label"
            defaultMessage="eSignature provider"
          />
        </FormLabel>
        <Controller
          name="provider"
          control={control}
          render={({ field: { onChange, value } }) => (
            <Select
              {...signatureIntegrationReactProps}
              getOptionLabel={(p) =>
                p.environment === "DEMO"
                  ? `${p.name} (${intl.formatMessage({
                      id: "generic.signature-demo-environment-long",
                      defaultMessage: "Test environment",
                    })})`
                  : p.name
              }
              getOptionValue={(p) => p.id}
              value={providers.find((p) => p.id === value.id)}
              onChange={onChange}
              options={providers}
              isSearchable={false}
            />
          )}
        />
      </FormControl>
      <FormControl isInvalid={!!errors.title}>
        <FormLabel display="flex" alignItems="center">
          <FormattedMessage
            id="component.signature-config-dialog.title-label"
            defaultMessage="Title of the document"
          />
          <HelpPopover>
            <FormattedMessage
              id="component.signature-config-dialog.title-help"
              defaultMessage="We will use this as the title of the signing document"
            />
          </HelpPopover>
        </FormLabel>
        <Input
          {...titleRegisterProps}
          placeholder={intl.formatMessage({
            id: "component.signature-config-dialog.title-placeholder",
            defaultMessage: "Enter a title...",
          })}
        />
      </FormControl>
      <FormControl isDisabled={petitionIsCompleted}>
        <FormLabel>
          <FormattedMessage
            id="component.signature-config-dialog.review-before-send-label"
            defaultMessage="When do you want the eSignature to be started?"
          />
        </FormLabel>
        <Controller
          name="review"
          control={control}
          render={({ field: { onChange, value: review } }) => (
            <>
              <Select
                {...reactSelectProps}
                value={reviewBeforeSendOptions[review ? 1 : 0]}
                options={reviewBeforeSendOptions}
                onChange={(v: any) => onChange(v.value === "YES")}
                isDisabled={petitionIsCompleted}
              />
              <Text marginTop={2} color="gray.500" fontSize="sm">
                {review ? (
                  <FormattedMessage
                    id="component.signature-config-dialog.review-before-send.option-yes.explainer"
                    defaultMessage="After reviewing the information you will have to start the signature manually."
                  />
                ) : (
                  <FormattedMessage
                    id="component.signature-config-dialog.dont-review-before-send.option-no.explainer"
                    defaultMessage=" The signature will be initiated when all the information has been completed."
                  />
                )}
              </Text>
            </>
          )}
        />
      </FormControl>
    </Stack>
  );
}

function useSignatureConfigDialogBodyStep2Props({
  signers,
  allowAdditionalSigners,
}: {
  signers: SignerSelectSelection[];
  allowAdditionalSigners?: boolean;
}) {
  return {
    form: useForm<{
      signers: SignerSelectSelection[];
      allowAdditionalSigners: boolean;
    }>({
      mode: "onChange",
      defaultValues: {
        signers,
        allowAdditionalSigners,
      },
    }),
  };
}

export function SignatureConfigDialogBodyStep2({
  form: {
    formState: { errors },
    control,
    watch,
    register,
  },
}: ReturnType<typeof useSignatureConfigDialogBodyStep2Props>) {
  const signers = watch("signers");

  const intl = useIntl();
  const handleSearchContacts = useSearchContacts();
  const handleCreateContact = useCreateContact();
  const showConfirmSignerInfo = useConfirmSignerInfoDialog();

  const [selectedContact, setSelectedContact] = useState<ContactSelectSelection | null>(null);

  const emptyContactSelectProps: Props<ContactSelectSelection, false, never> = {
    styles: { placeholder: (v) => ({ ...v, color: "gray.800" }) },
    placeholder: intl.formatMessage({
      id: "component.signature-config-dialog.contact-select.choose-when-starting.placeholder",
      defaultMessage: "Choose when starting",
    }),
  };

  return (
    <>
      <FormControl id="signers" isInvalid={!!errors.signers}>
        <Text color="gray.500" marginLeft={1}>
          <FormattedMessage
            id="component.signature-config-dialog.signers-added"
            defaultMessage="{count, plural, =0{You haven't added any signers yet} one{1 signer added} other{# signers added}}"
            values={{ count: signers.length }}
          />
        </Text>

        <Controller
          name="signers"
          control={control}
          render={({ field: { onChange, value: signers } }) => (
            <>
              <Stack spacing={0} paddingY={1} maxH="210px" overflowY="auto">
                {signers.map((signer, index) => (
                  <SelectedSignerRow
                    key={index}
                    isEditable
                    signer={signer}
                    onRemoveClick={() => onChange(signers.filter((_, i) => index !== i))}
                    onEditClick={async () => {
                      try {
                        onChange([
                          ...signers.slice(0, index),
                          await showConfirmSignerInfo(signer),
                          ...signers.slice(index + 1),
                        ]);
                      } catch {}
                    }}
                  />
                ))}
              </Stack>

              <Box marginTop={2}>
                <ContactSelect
                  value={selectedContact}
                  onChange={async (contact: ContactSelectSelection) => {
                    try {
                      onChange([
                        ...signers,
                        signers.find((s) => s.email === contact.email)
                          ? await showConfirmSignerInfo(contact)
                          : contact,
                      ]);
                    } catch {}
                    setSelectedContact(null);
                  }}
                  onSearchContacts={handleSearchContacts}
                  onCreateContact={handleCreateContact}
                  placeholder={intl.formatMessage({
                    id: "component.signature-config-dialog.contact-select.add-contact-to-sign.placeholder",
                    defaultMessage: "Add a contact to sign",
                  })}
                  {...(signers.length === 0 ? emptyContactSelectProps : undefined)}
                />
              </Box>
            </>
          )}
        />
      </FormControl>
      <FormControl hidden={signers.length === 0}>
        <FormLabel>
          <Checkbox marginTop={4} colorScheme="purple" {...register("allowAdditionalSigners")}>
            <HStack alignContent="center">
              <FormattedMessage
                id="component.signature-config-dialog.allow-additional-signers.label"
                defaultMessage="Allow additional signers to be added"
              />
              <HelpPopover>
                <FormattedMessage
                  id="component.signature-config-dialog.allow-additional-signers.help"
                  defaultMessage="If this option is disabled, only the indicated persons will be able to sign the document."
                />
              </HelpPopover>
            </HStack>
          </Checkbox>
        </FormLabel>
      </FormControl>
    </>
  );
}
