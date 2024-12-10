import { gql } from "@apollo/client";
import {
  AlertDescription,
  AlertIcon,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  OrderedList,
  Radio,
  RadioGroup,
  Stack,
  Text,
  UnorderedList,
  useCounter,
} from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { CloseableAlert } from "@parallel/components/common/CloseableAlert";
import { ContactSelect, ContactSelectSelection } from "@parallel/components/common/ContactSelect";
import { GrowingTextarea } from "@parallel/components/common/GrowingTextarea";
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
  SignatureConfigSigningMode,
} from "@parallel/graphql/__types";
import { FullPetitionSignerFragment } from "@parallel/utils/apollo/fragments";
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
  useForm,
  useFormContext,
  UseFormHandleSubmit,
} from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import Select from "react-select";
import { isNonNullish, noop, pick } from "remeda";
import { SelectedSignerRow } from "../SelectedSignerRow";
import { SuggestedSigners } from "../SuggestedSigners";
import { SignerSelectSelection } from "./ConfirmPetitionSignersDialog";
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
  signersInfo: SignatureConfigInputSigner[];
  signingMode: SignatureConfigSigningMode;
  minSigners: number;
  instructions: Maybe<string>;
  showInstructions: boolean;
  useCustomDocument: boolean;
}

export const MAX_SIGNERS_ALLOWED = 40;

export function SignatureConfigDialog({
  petition,
  integrations,
  user,
  ...props
}: DialogProps<SignatureConfigDialogProps, SignatureConfigInput>) {
  const intl = useIntl();

  const signatureConfig =
    petition.signatureConfig ??
    (petition.__typename === "Petition" ? petition.currentSignatureRequest?.signatureConfig : null);

  const allSigners = (signatureConfig?.signers ?? []).filter(isNonNullish);
  const form = useForm<SignatureConfigFormData>({
    mode: "onSubmit",
    defaultValues: {
      integration:
        signatureConfig?.integration ?? integrations.find((i) => i.isDefault) ?? integrations[0],
      review: petition.isReviewFlowEnabled ? (signatureConfig?.review ?? false) : false,
      title: signatureConfig?.title ?? null,
      allowAdditionalSigners: petition.isInteractionWithRecipientsEnabled
        ? (signatureConfig?.allowAdditionalSigners ?? false)
        : false,
      includePresetSigners: allSigners.length > 0,
      signersInfo: allSigners,
      signingMode: signatureConfig?.signingMode ?? "PARALLEL",
      minSigners: signatureConfig?.minSigners ?? 1,
      instructions: signatureConfig?.instructions ?? null,
      showInstructions: isNonNullish(signatureConfig?.instructions),
      useCustomDocument: signatureConfig?.useCustomDocument ?? false,
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
      form.setError("signersInfo", {});
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
        review: data.useCustomDocument ? true : data.review,
        allowAdditionalSigners: data.allowAdditionalSigners,
        signingMode: data.signingMode,
        minSigners: data.minSigners,
        instructions: data.showInstructions ? data.instructions : null,
        signersInfo: data.includePresetSigners
          ? data.signersInfo.map((s) =>
              pick(s, ["firstName", "lastName", "email", "contactId", "isPreset"]),
            )
          : [],
        useCustomDocument: data.useCustomDocument,
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
      content={{
        containerProps: { as: "form" },
      }}
      header={
        <Flex alignItems="center">
          {stepHeaders[currentStep]}
          <Text marginStart={2} color="gray.600" fontSize="md" fontWeight="400">
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
  const { register, control, watch } = useFormContext<SignatureConfigFormData>();

  const useCustomDocument = watch("useCustomDocument");

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
            defaultMessage="Sign a PDF document using one of our integrated eSignature providers."
          />
        </Text>
        <Flex>
          <HelpCenterLink articleId={6022979} display="flex" alignItems="center">
            <FormattedMessage
              id="component.signature-config-dialog.header-help-link"
              defaultMessage="More about eSignature"
            />
          </HelpCenterLink>
        </Flex>
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
        <FormLabel>
          <FormattedMessage
            id="component.signature-config-dialog.document-to-sign-label"
            defaultMessage="Which document do you want to sign?"
          />
        </FormLabel>
        <Controller
          name="useCustomDocument"
          control={control}
          render={({ field: { onChange, value } }) => (
            <RadioGroup
              as={Stack}
              spacing={2}
              onChange={(value) => onChange(value === "CUSTOM")}
              value={value ? "CUSTOM" : "REPLIES"}
            >
              <Radio backgroundColor="white" value="REPLIES">
                <FormattedMessage
                  id="component.signature-config-dialog.replies-document-label"
                  defaultMessage="Document generated on the basis of the replies"
                />
              </Radio>
              <Radio backgroundColor="white" value="CUSTOM">
                <FormattedMessage
                  id="component.signature-config-dialog.custom-document-label"
                  defaultMessage="I will upload a document when launching the signature"
                />
                <HelpPopover>
                  <FormattedMessage
                    id="component.signature-config-dialog.custom-document-label-help"
                    defaultMessage="The document will not be filled in automatically and cannot be edited. We will only add a signature page at the end of the document."
                  />
                </HelpPopover>
              </Radio>
            </RadioGroup>
          )}
        />
      </FormControl>
      <FormControl>
        <FormLabel display="flex" alignItems="center">
          <FormattedMessage
            id="component.signature-config-dialog.title-label"
            defaultMessage="Title of the document"
          />
          <Text color="gray.500" marginStart={1}>
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

      <FormControl isDisabled={petitionIsCompleted || !petition.isReviewFlowEnabled}>
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
                value={reviewBeforeSendOptions[review || useCustomDocument ? 1 : 0]}
                options={reviewBeforeSendOptions}
                onChange={(v: any) => onChange(v.value === "YES")}
                isDisabled={
                  useCustomDocument || petitionIsCompleted || !petition.isReviewFlowEnabled
                }
              />
              <Text marginTop={2} color="gray.500" fontSize="sm">
                {review || useCustomDocument ? (
                  <FormattedMessage
                    id="component.signature-config-dialog.review-before-send-option-yes-explainer"
                    defaultMessage="After reviewing the information you will have to start the signature manually."
                  />
                ) : (
                  <FormattedMessage
                    id="component.signature-config-dialog.review-before-send-option-no-explainer"
                    defaultMessage="The signature process will start when all the information has been completed."
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
  const intl = useIntl();
  const { register, watch, control } = useFormContext<SignatureConfigFormData>();
  const review = watch("review");
  const useCustomDocument = watch("useCustomDocument");
  const showInstructions = watch("showInstructions");

  const petitionIsCompleted =
    petition.__typename === "Petition" && ["COMPLETED", "CLOSED"].includes(petition.status);

  return (
    <Stack spacing={3}>
      <FormControl id="minSigners">
        <Controller
          name="minSigners"
          control={control}
          rules={{ required: true, min: 1 }}
          render={({ field: { ref, value, name, onChange, onBlur } }) => (
            <HStack as={FormLabel} margin={0} fontWeight={400}>
              <FormattedMessage
                id="component.signature-config-dialog.min-signers-label"
                defaultMessage="This document will have at least {input} {count, plural, =1{signer} other{signers}}"
                values={{
                  count: value,
                  input: (
                    <NumberInput
                      marginX={2}
                      onChange={(_, value) => onChange(value)}
                      value={value ?? 1}
                      min={1}
                      clampValueOnBlur={true}
                      maxWidth="80px"
                    >
                      <NumberInputField ref={ref} name={name} type="number" />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  ),
                }}
              />
            </HStack>
          )}
        />
      </FormControl>
      <FormControl>
        <FormLabel fontWeight="normal">
          <FormattedMessage
            id="component.signature-config-dialog.sending-type-label"
            defaultMessage="How do you want Parallel to send the signatures?"
          />
        </FormLabel>
        <Controller
          name="signingMode"
          control={control}
          render={({ field: { onChange, value } }) => (
            <RadioGroup
              as={HStack}
              spacing={3}
              onChange={onChange}
              value={value}
              colorScheme="purple"
            >
              <HStack spacing={0}>
                <Radio backgroundColor="white" value="PARALLEL">
                  <FormattedMessage
                    id="component.signature-config-dialog.sending-same-time-label"
                    defaultMessage="All at the same time"
                  />
                </Radio>
                <HelpPopover>
                  <FormattedMessage
                    id="component.signature-config-dialog.sending-same-time-help"
                    defaultMessage="All the signers will receive the document at the same time."
                  />
                </HelpPopover>
              </HStack>

              <HStack spacing={0}>
                <Radio backgroundColor="white" value="SEQUENTIAL">
                  <FormattedMessage
                    id="component.signature-config-dialog.sending-sequential-label"
                    defaultMessage="In order, signing one by one"
                  />
                </Radio>
                <HelpPopover>
                  <FormattedMessage
                    id="component.signature-config-dialog.sending-sequential-help"
                    defaultMessage="Each signer will receive the document after the one before has signed."
                  />
                </HelpPopover>
              </HStack>
            </RadioGroup>
          )}
        />
      </FormControl>
      {!review &&
      !useCustomDocument &&
      !petitionIsCompleted &&
      petition.isInteractionWithRecipientsEnabled ? (
        <FormControl id="allowAdditionalSigners">
          <FormLabel margin={0}>
            <Checkbox {...register("allowAdditionalSigners")}>
              <HStack alignContent="center" fontWeight="normal" spacing={0}>
                <Text as="span">
                  <FormattedMessage
                    id="component.signature-config-dialog.allow-additional-signers-label"
                    defaultMessage="Allow recipients to add additional signers"
                  />
                </Text>
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
      <FormControl id="showInstructions">
        <FormLabel fontWeight="normal" margin={0}>
          <Checkbox {...register("showInstructions")}>
            <HStack alignContent="center" fontWeight="normal" spacing={0}>
              <Text as="span">
                <FormattedMessage
                  id="component.signature-config-dialog.add-instructions-label"
                  defaultMessage="Add instructions"
                />
              </Text>
              <HelpPopover>
                <FormattedMessage
                  id="component.signature-config-dialog.add-instructions-help"
                  defaultMessage="Instructions help other users and recipients understand who has to sign the document."
                />
              </HelpPopover>
            </HStack>
          </Checkbox>
        </FormLabel>
      </FormControl>
      {showInstructions ? (
        <FormControl id="instructions">
          <GrowingTextarea
            {...register("instructions")}
            placeholder={intl.formatMessage({
              id: "component.signature-config-dialog.instructions-placeholder",
              defaultMessage: "e.g. Add your company's legal representatives as signers",
            })}
            aria-label={intl.formatMessage({
              id: "component.signature-config-dialog.instructions-label",
              defaultMessage: "Instructions",
            })}
            maxLength={300}
          />
        </FormControl>
      ) : null}
      <FormControl id="includePresetSigners">
        <Checkbox {...register("includePresetSigners")}>
          <FormattedMessage
            id="component.signature-config-dialog.include-fixed-signers-template-label"
            defaultMessage="Include contacts who always sign the document"
          />
        </Checkbox>
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

  const signersInfo = watch("signersInfo");
  const includePresetSigners = watch("includePresetSigners");
  const signingMode = watch("signingMode");
  const isSequential = signingMode === "SEQUENTIAL";

  const isPetition = petition.__typename === "Petition";

  const intl = useIntl();
  const handleSearchContacts = useSearchContacts();
  const handleCreateContact = useCreateContact();
  const showConfirmSignerInfo = useConfirmSignerInfoDialog();

  const [selectedContact, setSelectedContact] = useState<ContactSelectSelection | null>(null);

  const handleContactSelectOnChange =
    (onChange: (...events: any[]) => void) => async (contact: ContactSelectSelection | null) => {
      try {
        const repeatedSigners = signersInfo.filter((s) => s.email === contact!.email);
        onChange([
          ...signersInfo,
          repeatedSigners.length > 0
            ? await showConfirmSignerInfo({
                selection: { ...contact!, isPreset: false },
                repeatedSigners,
                allowUpdateFixedSigner: petition.__typename === "PetitionTemplate",
              })
            : {
                ...pick(contact!, ["firstName", "lastName", "email"]),
                isPreset: !isPetition,
              },
        ]);
      } catch {}
      setSelectedContact(null);
    };

  const handleSelectedSignerRowOnEditClick =
    (onChange: (...events: any[]) => void, signer: SignerSelectSelection, index: number) =>
    async () => {
      try {
        onChange([
          ...signersInfo.slice(0, index),
          await showConfirmSignerInfo({
            selection: signer,
            repeatedSigners: [],
            allowUpdateFixedSigner: petition.__typename === "PetitionTemplate",
          }),
          ...signersInfo.slice(index + 1),
        ]);
      } catch {}
    };

  useEffect(() => {
    if (signersInfo.length > 0) {
      clearErrors("signersInfo");
    }
  }, [signersInfo.length]);

  const ListElement = isSequential ? OrderedList : UnorderedList;

  return (
    <FormControl id="signersInfo" isInvalid={!!errors.signersInfo}>
      {signersInfo.length === 0 ? (
        <Text color={!!errors.signersInfo ? "red.500" : "gray.500"} marginStart={1}>
          <FormattedMessage
            id="component.signature-config-dialog.no-signers-added"
            defaultMessage="You haven't added any signers yet"
          />
        </Text>
      ) : null}

      <Controller
        name="signersInfo"
        control={control}
        rules={{
          validate: (value: any[]) => !includePresetSigners || value.length > 0,
        }}
        render={({ field: { onChange, value: signers } }) => (
          <>
            <ListElement
              spacing={0}
              paddingY={1}
              margin={0}
              maxH="210px"
              overflowY="auto"
              listStylePosition="inside"
            >
              {signers.map((signer, index) => (
                <SelectedSignerRow
                  key={index}
                  isEditable={petition.__typename === "PetitionTemplate" || !signer.isPreset}
                  signer={signer}
                  onRemoveClick={() => onChange(signers.filter((_, i) => index !== i))}
                  onEditClick={handleSelectedSignerRowOnEditClick(onChange, signer, index)}
                />
              ))}
            </ListElement>
            <Stack marginTop={2}>
              {!isPetition && signers.length > 0 ? (
                <CloseableAlert status="info" rounded="md">
                  <AlertIcon />
                  <AlertDescription>
                    <FormattedMessage
                      id="component.signature-config-dialog.template-alert"
                      defaultMessage="These signers will be assigned to all parallels created from this template."
                    />
                  </AlertDescription>
                </CloseableAlert>
              ) : null}
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
                user={user}
                petition={petition}
                currentSigners={signersInfo}
                onAddSigner={(s) => {
                  onChange([...signers, s]);
                }}
              />
            </Stack>
          </>
        )}
      />
    </FormControl>
  );
}

SignatureConfigDialog.fragments = {
  get SignatureConfig() {
    return gql`
      fragment SignatureConfigDialog_SignatureConfig on SignatureConfig {
        integration {
          ...SignatureConfigDialog_SignatureOrgIntegration
        }
        signers {
          ...Fragments_FullPetitionSigner
        }
        title
        review
        allowAdditionalSigners
        signingMode
        minSigners
        instructions
        useCustomDocument
      }
      ${this.SignatureOrgIntegration}
      ${FullPetitionSignerFragment}
    `;
  },
  get PetitionBase() {
    return gql`
      fragment SignatureConfigDialog_PetitionBase on PetitionBase {
        name
        isReviewFlowEnabled
        isInteractionWithRecipientsEnabled
        signatureConfig {
          ...SignatureConfigDialog_SignatureConfig
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
          currentSignatureRequest {
            signatureConfig {
              ...SignatureConfigDialog_SignatureConfig
            }
          }
        }
        ...SuggestedSigners_PetitionBase
      }
      ${this.SignatureConfig}
      ${SuggestedSigners.fragments.PetitionBase}
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
        ...SuggestedSigners_User
      }
      ${SuggestedSigners.fragments.User}
    `;
  },
};

export function useSignatureConfigDialog() {
  return useDialog(SignatureConfigDialog);
}
