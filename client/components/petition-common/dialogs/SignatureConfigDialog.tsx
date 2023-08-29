import { gql } from "@apollo/client";
import {
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  List,
  Stack,
  Text,
  useCounter,
} from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { CloseableAlert } from "@parallel/components/common/CloseableAlert";
import { ContactSelect, ContactSelectSelection } from "@parallel/components/common/ContactSelect";
import { HelpCenterLink } from "@parallel/components/common/HelpCenterLink";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { Steps } from "@parallel/components/common/Steps";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  SignatureConfigDialog_PetitionBaseFragment,
  SignatureConfigDialog_SignatureOrgIntegrationFragment,
  SignatureConfigDialog_UserFragment,
  SignatureConfigInput,
  SignatureConfigInputSigner,
} from "@parallel/graphql/__types";
import { useCreateContact } from "@parallel/utils/mutations/useCreateContact";
import { withError } from "@parallel/utils/promises/withError";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { Maybe } from "@parallel/utils/types";
import { useSearchContacts } from "@parallel/utils/useSearchContacts";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Controller,
  FormProvider,
  UseFormHandleSubmit,
  useForm,
  useFormContext,
} from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import Select from "react-select";
import { isDefined, noop, omit, partition, pick, uniqBy } from "remeda";
import { SelectedSignerRow } from "../SelectedSignerRow";
import { SuggestedSigners } from "../SuggestedSigners";
import {
  ConfirmPetitionSignersDialog,
  SignerSelectSelection,
} from "./ConfirmPetitionSignersDialog";
import { useConfirmSignerInfoDialog } from "./ConfirmSignerInfoDialog";
export interface SignatureConfigDialogProps {
  petition: SignatureConfigDialog_PetitionBaseFragment;
  integrations: SignatureConfigDialog_SignatureOrgIntegrationFragment[];
  user: SignatureConfigDialog_UserFragment;
}

interface SignatureConfigFormData {
  integration: SignatureConfigDialog_SignatureOrgIntegrationFragment;
  review: boolean;
  title: Maybe<string>;
  allowAdditionalSigners: boolean;
  includePresetSigners: boolean;
  presetSigners: SignatureConfigInputSigner[];
}

export const MAX_SIGNERS_ALLOWED = 40;

export function SignatureConfigDialog({
  petition,
  integrations,
  user,
  ...props
}: DialogProps<SignatureConfigDialogProps, SignatureConfigInput>) {
  const intl = useIntl();

  const [presetSigners, otherSigners] = partition(
    (petition.signatureConfig?.signers ?? []).filter(isDefined),
    (s) => s.isPreset,
  );

  const form = useForm<SignatureConfigFormData>({
    mode: "onSubmit",
    defaultValues: {
      integration:
        petition.signatureConfig?.integration ??
        integrations.find((i) => i.isDefault) ??
        integrations[0],
      review: petition.signatureConfig?.review ?? false,
      title: petition.signatureConfig?.title ?? null,
      allowAdditionalSigners: petition.signatureConfig?.allowAdditionalSigners ?? false,
      includePresetSigners: presetSigners.length > 0,
      presetSigners,
    },
  });

  const titleRef = useRef<HTMLInputElement>(null);

  const maxSteps = form.watch("includePresetSigners") ? 2 : 1;

  const {
    valueAsNumber: currentStep,
    isAtMin: isFirstStep,
    isAtMax: isLastStep,
    increment: nextStep,
    decrement: previousStep,
  } = useCounter({ min: 0, max: maxSteps, defaultValue: 0 });

  function handleClickPreviousStep() {
    if (isFirstStep) {
      props.onReject();
    } else {
      previousStep();
    }
  }

  async function isSubmitSuccessful(handleSubmit: UseFormHandleSubmit<any>) {
    const [error] = await withError(
      handleSubmit(noop, () => {
        throw new Error();
      }),
    );

    return !error;
  }

  async function handleClickNextStep() {
    if (isLastStep && !(await isSubmitSuccessful(form.handleSubmit))) {
      form.setError("presetSigners", {});
      return;
    }

    if (!isLastStep) {
      nextStep();
    } else {
      const data = form.getValues();
      props.onResolve({
        title: data.title || null,
        orgIntegrationId: data.integration.id,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        review: data.review,
        allowAdditionalSigners: data.allowAdditionalSigners,
        signersInfo: (data.includePresetSigners
          ? [...otherSigners, ...data.presetSigners.map((s) => ({ ...s, isPreset: true }))]
          : otherSigners
        ).map((s) => pick(s, ["firstName", "lastName", "email", "contactId", "isPreset"])),
      });
    }
  }

  const stepHeaders = useMemo(
    () => [
      intl.formatMessage({
        id: "component.signature-config-dialog.step-1-header",
        defaultMessage: "eSignature configuration",
      }),
      intl.formatMessage({
        id: "component.signature-config-dialog.step-2-header",
        defaultMessage: "Set up document signatures",
      }),
      intl.formatMessage({
        id: "component.signature-config-dialog.step-3-header",
        defaultMessage: "Add signers",
      }),
    ],
    [intl.locale],
  );

  return (
    <ConfirmDialog
      hasCloseButton
      initialFocusRef={titleRef}
      size="xl"
      content={{ as: "form" }}
      header={
        <Flex alignItems="center">
          {stepHeaders[currentStep]}
          <Text marginLeft={2} color="gray.600" fontSize="md" fontWeight="400">
            {currentStep + 1}/{maxSteps + 1}
          </Text>
        </Flex>
      }
      body={
        <FormProvider {...form}>
          <Steps currentStep={currentStep}>
            <SignatureConfigDialogBodyStep1
              integrations={integrations}
              petition={petition}
              ref={titleRef}
            />
            <SignatureConfigDialogBodyStep2 petition={petition} />
            <SignatureConfigDialogBodyStep3 petition={petition} user={user} />
          </Steps>
        </FormProvider>
      }
      confirm={
        <Button colorScheme="primary" onClick={handleClickNextStep}>
          {!isLastStep ? (
            <FormattedMessage id="generic.continue" defaultMessage="Continue" />
          ) : (
            <FormattedMessage id="generic.save" defaultMessage="Save" />
          )}
        </Button>
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

const SignatureConfigDialogBodyStep1 = chakraForwardRef<
  "div",
  Pick<SignatureConfigDialogProps, "integrations" | "petition">
>(function SignatureConfigDialogBodyStep1(
  { integrations, petition }: Pick<SignatureConfigDialogProps, "integrations" | "petition">,
  ref,
) {
  const intl = useIntl();
  const { register, control } = useFormContext<SignatureConfigFormData>();

  const signatureIntegrationReactProps = useReactSelectProps<
    SignatureConfigDialog_SignatureOrgIntegrationFragment,
    false
  >();

  const petitionIsCompleted =
    petition.__typename === "Petition" && ["COMPLETED", "CLOSED"].includes(petition.status);

  const titleRegister = useRegisterWithRef(ref, register, "title");

  const reactSelectProps = useReactSelectProps();

  const reviewBeforeSendOptions = useMemo(
    () => [
      {
        value: "NO",
        label: intl.formatMessage({
          id: "component.signature-config-dialog.review-before-send-option-no",
          defaultMessage: "After the parallel is completed",
        }),
      },
      {
        value: "YES",
        label: intl.formatMessage({
          id: "component.signature-config-dialog.review-before-send-option-yes",
          defaultMessage: "After reviewing the information",
        }),
      },
    ],
    [intl.locale],
  );

  return (
    <Stack spacing={4}>
      <Stack spacing={2}>
        <Text>
          <FormattedMessage
            id="component.signature-config-dialog.header-subtitle"
            defaultMessage="Sign a PDF document with all the replies using one of our integrated eSignature providers."
          />
        </Text>
        <Text>
          <HelpCenterLink articleId={6022979} display="flex" alignItems="center" fontSize="sm">
            <FormattedMessage
              id="component.signature-config-dialog.header-help-link"
              defaultMessage="More about eSignature"
            />
          </HelpCenterLink>
        </Text>
      </Stack>
      <FormControl hidden={integrations.length < 2}>
        <FormLabel>
          <FormattedMessage
            id="component.signature-config-dialog.provider-label"
            defaultMessage="eSignature provider"
          />
        </FormLabel>
        <Controller
          name="integration"
          control={control}
          render={({ field: { onChange, value } }) => (
            <Select
              {...signatureIntegrationReactProps}
              getOptionLabel={(i) =>
                i.environment === "DEMO"
                  ? `${i.name} (${intl.formatMessage({
                      id: "generic.signature-demo-environment-long",
                      defaultMessage: "Test environment",
                    })})`
                  : i.name
              }
              getOptionValue={(p) => p.id}
              value={integrations.find((i) => i.id === value.id)}
              onChange={(value) => onChange(value!)}
              options={integrations}
              isSearchable={false}
            />
          )}
        />
      </FormControl>
      <FormControl>
        <FormLabel display="flex" alignItems="center">
          <FormattedMessage
            id="component.signature-config-dialog.title-label"
            defaultMessage="Title of the document"
          />
          <Text color="gray.500" marginLeft={1}>
            (<FormattedMessage id="generic.optional" defaultMessage="Optional" />)
          </Text>

          <HelpPopover>
            <FormattedMessage
              id="component.signature-config-dialog.title-help"
              defaultMessage="Include a title on the signing document. It will also be used as the name of the file once signed."
            />
          </HelpPopover>
        </FormLabel>
        <Input
          {...titleRegister}
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
            defaultMessage="When do you want the eSignature to start?"
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
                    id="component.signature-config-dialog.review-before-send-option-yes-explainer"
                    defaultMessage="After reviewing the information you will have to start the signature manually."
                  />
                ) : (
                  <FormattedMessage
                    id="component.signature-config-dialog.review-before-send-option-no-explainer"
                    defaultMessage=" The signature process will start when all the information has been completed."
                  />
                )}
              </Text>
            </>
          )}
        />
      </FormControl>
    </Stack>
  );
});

function SignatureConfigDialogBodyStep2({
  petition,
}: Pick<SignatureConfigDialogProps, "petition">) {
  const { register, watch } = useFormContext<SignatureConfigFormData>();
  const review = watch("review");

  const petitionIsCompleted =
    petition.__typename === "Petition" && ["COMPLETED", "CLOSED"].includes(petition.status);

  return (
    <Stack spacing={3}>
      {!review && !petitionIsCompleted ? (
        <FormControl id="allowAdditionalSigners">
          <FormLabel>
            <Checkbox colorScheme="primary" {...register("allowAdditionalSigners")}>
              <HStack alignContent="center" fontWeight="normal">
                <FormattedMessage
                  id="component.signature-config-dialog.allow-additional-signers-label"
                  defaultMessage="Allow recipients to add additional signers"
                />
                <HelpPopover>
                  <FormattedMessage
                    id="component.signature-config-dialog.allow-additional-signers-help"
                    defaultMessage="If this option is disabled, only the indicated people will be able to sign the document."
                  />
                </HelpPopover>
              </HStack>
            </Checkbox>
          </FormLabel>
        </FormControl>
      ) : null}
      <FormControl id="includePresetSigners">
        <FormLabel>
          <Checkbox colorScheme="primary" {...register("includePresetSigners")}>
            <HStack alignContent="center" fontWeight="normal">
              <FormattedMessage
                id="component.signature-config-dialog.include-fixed-signers-template-label"
                defaultMessage="Include contacts who always sign the document"
              />
            </HStack>
          </Checkbox>
        </FormLabel>
      </FormControl>
    </Stack>
  );
}

function SignatureConfigDialogBodyStep3({
  petition,
  user,
}: Pick<SignatureConfigDialogProps, "petition" | "user">) {
  const {
    watch,
    control,
    formState: { errors },
    clearErrors,
  } = useFormContext<SignatureConfigFormData>();

  const presetSigners = watch("presetSigners");
  const includePresetSigners = watch("includePresetSigners");

  const isPetition = petition.__typename === "Petition";

  const previousSignatures = isPetition ? petition.signatureRequests : [];
  const accesses = isPetition ? petition.accesses : [];

  const intl = useIntl();
  const handleSearchContacts = useSearchContacts();
  const handleCreateContact = useCreateContact();
  const showConfirmSignerInfo = useConfirmSignerInfoDialog();

  const suggestions = uniqBy(
    [
      ...(previousSignatures?.flatMap((s) => s.signatureConfig.signers) ?? [])
        .filter(isDefined)
        .map((signer) => omit(signer, ["__typename"])),
      {
        email: user.email,
        firstName: user.firstName ?? "",
        lastName: user.lastName,
      },
      ...accesses
        .filter((a) => a.status === "ACTIVE" && isDefined(a.contact))
        .map((a) => ({
          contactId: a.contact!.id,
          email: a.contact!.email,
          firstName: a.contact!.firstName,
          lastName: a.contact!.lastName ?? "",
        })),
    ]
      // remove already added signers
      .filter(
        (suggestion) =>
          !presetSigners.some(
            (s) =>
              s.email === suggestion.email &&
              s.firstName === suggestion.firstName &&
              s.lastName === suggestion.lastName,
          ),
      ),
    (s) => [s.email, s.firstName, s.lastName].join("|"),
  );

  const [selectedContact, setSelectedContact] = useState<ContactSelectSelection | null>(null);

  const handleContactSelectOnChange =
    (onChange: (...events: any[]) => void) => async (contact: ContactSelectSelection | null) => {
      try {
        const repeatedSigners = presetSigners.filter((s) => s.email === contact!.email);
        onChange([
          ...presetSigners,
          repeatedSigners.length > 0
            ? await showConfirmSignerInfo({ selection: contact!, repeatedSigners })
            : contact,
        ]);
      } catch {}
      setSelectedContact(null);
    };

  const handleSelectedSignerRowOnEditClick =
    (onChange: (...events: any[]) => void, signer: SignerSelectSelection, index: number) =>
    async () => {
      try {
        onChange([
          ...presetSigners.slice(0, index),
          await showConfirmSignerInfo({
            selection: signer,
            repeatedSigners: [],
          }),
          ...presetSigners.slice(index + 1),
        ]);
      } catch {}
    };

  useEffect(() => {
    if (presetSigners.length > 0) {
      clearErrors("presetSigners");
    }
  }, [presetSigners.length]);

  return (
    <FormControl id="presetSigners" isInvalid={!!errors.presetSigners}>
      {presetSigners.length === 0 ? (
        <Text color={!!errors.presetSigners ? "red.500" : "gray.500"} marginLeft={1}>
          <FormattedMessage
            id="component.signature-config-dialog.no-signers-added"
            defaultMessage="You haven't added any signers yet"
          />
        </Text>
      ) : null}

      <Controller
        name="presetSigners"
        control={control}
        rules={{
          validate: (value: any[]) => !includePresetSigners || value.length > 0,
        }}
        render={({ field: { onChange, value: signers } }) => (
          <>
            <List spacing={0} paddingY={1} maxH="210px" overflowY="auto">
              {signers.map((signer, index) => (
                <SelectedSignerRow
                  key={index}
                  isEditable
                  marker={
                    <Text as="span" paddingX={2}>
                      {"•"}
                    </Text>
                  }
                  signer={signer}
                  onRemoveClick={() => onChange(signers.filter((_, i) => index !== i))}
                  onEditClick={handleSelectedSignerRowOnEditClick(onChange, signer, index)}
                />
              ))}
            </List>
            {!isPetition && signers.length > 0 ? (
              <CloseableAlert status="info" borderRadius="base">
                <AlertIcon color="blue.500" />
                <AlertDescription>
                  <FormattedMessage
                    id="component.signature-config-dialog.template-alert"
                    defaultMessage="These signers will be assigned to all parallels created from this template."
                  />
                </AlertDescription>
              </CloseableAlert>
            ) : null}

            <Box marginTop={2}>
              <ContactSelect
                value={selectedContact}
                onChange={handleContactSelectOnChange(onChange)}
                onSearchContacts={handleSearchContacts}
                onCreateContact={handleCreateContact}
                placeholder={intl.formatMessage({
                  id: "component.signature-config-dialog.contact-select-add-contact-to-sign-placeholder",
                  defaultMessage: "Add a contact to sign",
                })}
              />
              <SuggestedSigners
                suggestions={suggestions}
                onAddSigner={(s) => {
                  onChange([...signers, s]);
                }}
              />
            </Box>
          </>
        )}
      />
    </FormControl>
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
            isPreset
          }
          title
          review
          allowAdditionalSigners
        }
        ... on Petition {
          status
          accesses {
            id
            status
            contact {
              id
              firstName
              lastName
              email
            }
          }
          signatureRequests {
            signatureConfig {
              signers {
                ...ConfirmPetitionSignersDialog_PetitionSigner
              }
            }
          }
        }
      }
      ${this.SignatureOrgIntegration}
      ${ConfirmPetitionSignersDialog.fragments.PetitionSigner}
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
  get User() {
    return gql`
      fragment SignatureConfigDialog_User on User {
        firstName
        lastName
        email
      }
    `;
  },
};

export function useSignatureConfigDialog() {
  return useDialog(SignatureConfigDialog);
}
