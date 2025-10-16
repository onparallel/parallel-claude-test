import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import {
  AlertDescription,
  AlertIcon,
  Button,
  Center,
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
  Spinner,
  Stack,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import { CloseableAlert } from "@parallel/components/common/CloseableAlert";
import { ContactSelect, ContactSelectSelection } from "@parallel/components/common/ContactSelect";
import { GrowingTextarea } from "@parallel/components/common/GrowingTextarea";
import { HelpCenterLink } from "@parallel/components/common/HelpCenterLink";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { SimpleSelect, useSimpleSelectOptions } from "@parallel/components/common/SimpleSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import {
  useWizardDialog,
  WizardStepDialogProps,
} from "@parallel/components/common/dialogs/WizardDialog";
import {
  SignatureConfigDialog_meDocument,
  SignatureConfigDialog_PetitionBaseFragment,
  SignatureConfigDialog_petitionDocument,
  SignatureConfigDialog_SignatureOrgIntegrationFragment,
  SignatureConfigDialog_UserFragment,
  SignatureConfigInput,
  SignatureConfigInputSigner,
  SignatureConfigSigningMode,
} from "@parallel/graphql/__types";
import { Fragments } from "@parallel/utils/apollo/fragments";
import { useCreateContact } from "@parallel/utils/mutations/useCreateContact";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { Maybe } from "@parallel/utils/types";
import { useSearchContacts } from "@parallel/utils/useSearchContacts";
import { useEffect, useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import Select from "react-select";
import { isNonNullish, omit, pick } from "remeda";
import { SelectedSignerRow } from "../SelectedSignerRow";
import { SuggestedSigners } from "../SuggestedSigners";
import { useConfirmSignerInfoDialog } from "./ConfirmSignerInfoDialog";

interface SignatureConfigFormData {
  integration: SignatureConfigDialog_SignatureOrgIntegrationFragment;
  review: "AFTER_APPROVAL" | "YES" | "NO";
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

// Wizard steps definition
type SignatureConfigDialogSteps = {
  LOADING: {
    petitionId: string;
  };
  STEP_1: {
    petition: SignatureConfigDialog_PetitionBaseFragment;
    integrations: SignatureConfigDialog_SignatureOrgIntegrationFragment[];
    user: SignatureConfigDialog_UserFragment;
    formData: SignatureConfigFormData;
  };
  STEP_2: {
    petition: SignatureConfigDialog_PetitionBaseFragment;
    integrations: SignatureConfigDialog_SignatureOrgIntegrationFragment[];
    user: SignatureConfigDialog_UserFragment;
    formData: SignatureConfigFormData;
  };
  STEP_3: {
    petition: SignatureConfigDialog_PetitionBaseFragment;
    integrations: SignatureConfigDialog_SignatureOrgIntegrationFragment[];
    user: SignatureConfigDialog_UserFragment;
    formData: SignatureConfigFormData;
  };
};

// Loading step component
function SignatureConfigDialogLoading({
  petitionId,
  onStep,
  ...props
}: WizardStepDialogProps<SignatureConfigDialogSteps, "LOADING", SignatureConfigInput>) {
  const { data: meData, loading: userLoading } = useQuery(SignatureConfigDialog_meDocument, {
    fetchPolicy: "cache-and-network",
  });
  const user = meData?.me;

  const { data: petitionData, loading: petitionLoading } = useQuery(
    SignatureConfigDialog_petitionDocument,
    { variables: { petitionId } },
  );
  const petition = petitionData?.petition;

  // Once data is loaded, move to step 1
  useEffect(() => {
    if (!userLoading && !petitionLoading && user && petition) {
      const integrations = user.organization.signatureIntegrations
        .items as SignatureConfigDialog_SignatureOrgIntegrationFragment[];

      const signatureConfig = petition.signatureConfig;

      const petitionIsCompleted =
        petition.__typename === "Petition" && ["COMPLETED", "CLOSED"].includes(petition.status);

      const defaultReview = petitionIsCompleted ? true : (signatureConfig?.review ?? false);

      const defaultReviewAfterApproval =
        petition.__typename === "Petition" && petition.hasStartedProcess
          ? true
          : (signatureConfig?.reviewAfterApproval ?? null);

      // Calculate review enum value based on current state
      const reviewValue: "AFTER_APPROVAL" | "YES" | "NO" =
        isNonNullish(petition.approvalFlowConfig) && defaultReviewAfterApproval
          ? "AFTER_APPROVAL"
          : defaultReview
            ? "YES"
            : "NO";

      const allSigners = (signatureConfig?.signers ?? [])
        .filter(isNonNullish)
        .map(omit(["__typename"]));

      onStep("STEP_1", {
        petition,
        integrations,
        user,
        formData: {
          integration:
            signatureConfig?.integration ??
            integrations.find((i) => i.isDefault) ??
            integrations[0],
          review: petition.isReviewFlowEnabled ? reviewValue : "NO",
          title: signatureConfig?.title ?? null,
          useCustomDocument: signatureConfig?.useCustomDocument ?? false,
          minSigners: signatureConfig?.minSigners ?? 1,
          signingMode: signatureConfig?.signingMode ?? "PARALLEL",
          allowAdditionalSigners: petition.isInteractionWithRecipientsEnabled
            ? (signatureConfig?.allowAdditionalSigners ?? false)
            : false,
          showInstructions: isNonNullish(signatureConfig?.instructions),
          instructions: signatureConfig?.instructions ?? null,
          includePresetSigners: allSigners.length > 0,
          signersInfo: allSigners,
        },
      });
    }
  }, [userLoading, petitionLoading, user, petition, onStep]);

  return (
    <ConfirmDialog
      size="xl"
      hasCloseButton
      header={
        <FormattedMessage
          id="component.signature-config-dialog.step-1-header"
          defaultMessage="eSignature configuration"
        />
      }
      body={
        <Center padding={8} minHeight="200px">
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="primary.500"
            size="xl"
          />
        </Center>
      }
      confirm={
        <Button colorScheme="primary" isDisabled>
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      cancel={
        <Button isDisabled>
          <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
        </Button>
      }
      {...props}
    />
  );
}

// Step 1: eSignature configuration
function SignatureConfigDialogStep1({
  petition,
  integrations,
  user,
  formData,
  onStep,
  onBack,
  ...props
}: WizardStepDialogProps<SignatureConfigDialogSteps, "STEP_1", SignatureConfigInput>) {
  const intl = useIntl();

  const titleRef = useRef<HTMLInputElement>(null);

  const { register, control, watch, handleSubmit, setValue, getValues } = useForm({
    mode: "onSubmit",
    defaultValues: pick(formData, ["integration", "review", "title", "useCustomDocument"] as const),
  });

  const useCustomDocument = watch("useCustomDocument");

  const signatureIntegrationReactProps = useReactSelectProps<
    SignatureConfigDialog_SignatureOrgIntegrationFragment,
    false
  >();

  const titleRegister = useRegisterWithRef(titleRef, register, "title");

  const reviewBeforeSendOptions = useSimpleSelectOptions(
    () => [
      ...((petition.__typename === "Petition" &&
        ["COMPLETED", "CLOSED"].includes(petition.status)) ||
      useCustomDocument
        ? []
        : [
            {
              value: "NO" as const,
              label: intl.formatMessage({
                id: "component.signature-config-dialog.review-before-send-option-no",
                defaultMessage: "After the parallel is completed",
              }),
            },
          ]),
      ...(petition.__typename === "Petition" && petition.hasStartedProcess
        ? []
        : [
            {
              value: "YES" as const,
              label: intl.formatMessage({
                id: "component.signature-config-dialog.review-before-send-option-yes",
                defaultMessage: "After reviewing the information",
              }),
            },
          ]),
      ...(user.hasPetitionApprovalFlow && isNonNullish(petition.approvalFlowConfig)
        ? [
            {
              value: "AFTER_APPROVAL" as const,
              label: intl.formatMessage({
                id: "component.signature-config-dialog.review-before-send-option-after-approval",
                defaultMessage: "After completing the approval steps",
              }),
            },
          ]
        : []),
    ],
    [intl.locale, user, petition, useCustomDocument],
  );

  // Adjust review value when useCustomDocument changes to prevent invalid selections
  useEffect(() => {
    const currentReview = getValues("review");
    if (useCustomDocument && currentReview === "NO") {
      // When useCustomDocument is true, "NO" option is not available
      // Default to "YES" first, then "AFTER_APPROVAL" if YES is not available
      const hasAfterApproval =
        user.hasPetitionApprovalFlow && isNonNullish(petition.approvalFlowConfig);
      const hasYes = petition.__typename !== "Petition" || !petition.hasStartedProcess;

      if (hasYes) {
        setValue("review", "YES");
      } else if (hasAfterApproval) {
        setValue("review", "AFTER_APPROVAL");
      } else {
        // Fallback: if no options are available, default to "YES" anyway
        // The buildSignatureConfigInput will handle this correctly since useCustomDocument forces review: true
        setValue("review", "YES");
      }
    }
  }, [useCustomDocument, setValue, getValues, user.hasPetitionApprovalFlow, petition]);

  return (
    <ConfirmDialog
      hasCloseButton
      initialFocusRef={titleRef}
      size="xl"
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit((step1Data) => {
            onStep("STEP_2", {
              petition,
              integrations,
              user,
              formData: { ...formData, ...step1Data },
            });
          }),
        },
      }}
      header={
        <Flex alignItems="center">
          <FormattedMessage
            id="component.signature-config-dialog.step-1-header"
            defaultMessage="eSignature configuration"
          />
          <Text marginStart={2} color="gray.600" fontSize="md" fontWeight="400">
            1/{formData.includePresetSigners ? 3 : 2}
          </Text>
        </Flex>
      }
      body={
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

          <FormControl
            isDisabled={!petition.isReviewFlowEnabled || reviewBeforeSendOptions.length === 1}
          >
            <FormLabel>
              <FormattedMessage
                id="component.signature-config-dialog.review-before-send-label"
                defaultMessage="When do you want the eSignature to start?"
              />
            </FormLabel>
            <Controller
              name="review"
              control={control}
              render={({ field: { onChange, value: review } }) => {
                return (
                  <>
                    <SimpleSelect
                      value={review}
                      options={reviewBeforeSendOptions}
                      onChange={(value) => onChange(value!)}
                      isDisabled={
                        !petition.isReviewFlowEnabled || reviewBeforeSendOptions.length === 1
                      }
                    />
                    <Text marginTop={2} color="gray.500" fontSize="sm">
                      {review === "AFTER_APPROVAL" ? (
                        <FormattedMessage
                          id="component.signature-config-dialog.review-before-send-option-after-approval-explainer"
                          defaultMessage="After completing the approval steps, you will have to start the signature manually."
                        />
                      ) : review === "YES" ? (
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
                );
              }}
            />
          </FormControl>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="primary">
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      cancel={
        <Button onClick={() => props.onReject("CANCEL")}>
          <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
        </Button>
      }
      {...props}
    />
  );
}

// Step 2: Document setup
function SignatureConfigDialogStep2({
  petition,
  integrations,
  user,
  formData,
  onStep,
  onBack,
  ...props
}: WizardStepDialogProps<SignatureConfigDialogSteps, "STEP_2", SignatureConfigInput>) {
  const intl = useIntl();

  // Step 2: Use only relevant fields for this step
  const { register, watch, control, handleSubmit } = useForm({
    mode: "onSubmit",
    defaultValues: pick(formData, [
      "minSigners",
      "signingMode",
      "allowAdditionalSigners",
      "showInstructions",
      "instructions",
      "includePresetSigners",
    ] as const),
  });

  const showInstructions = watch("showInstructions");
  const includePresetSigners = watch("includePresetSigners");

  const petitionIsCompleted =
    petition.__typename === "Petition" && ["COMPLETED", "CLOSED"].includes(petition.status);

  return (
    <ConfirmDialog
      hasCloseButton
      size="xl"
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit((step2Data, e) => {
            const isBackClick =
              (e?.nativeEvent as SubmitEvent).submitter?.getAttribute("data-action") === "back";
            const updatedFormData = { ...formData, ...step2Data };
            if (isBackClick) {
              onStep("STEP_1", { petition, integrations, user, formData: updatedFormData });
            } else if (step2Data.includePresetSigners) {
              onStep("STEP_3", { petition, integrations, user, formData: updatedFormData });
            } else {
              // Skip step 3 if no preset signers
              props.onResolve(buildSignatureConfigInput(updatedFormData));
            }
          }),
        },
      }}
      header={
        <Flex alignItems="center">
          <FormattedMessage
            id="component.signature-config-dialog.step-2-header"
            defaultMessage="Set up document signatures"
          />
          <Text marginStart={2} color="gray.600" fontSize="md" fontWeight="400">
            2/{includePresetSigners ? 3 : 2}
          </Text>
        </Flex>
      }
      body={
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
                          min={Math.max(
                            1,
                            formData.signersInfo.filter(
                              (s) =>
                                isNonNullish(s.signWithEmbeddedImage) ||
                                isNonNullish(s.signWithEmbeddedImageFileUploadId),
                            ).length + 1,
                          )}
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
          {!formData.review &&
          !formData.useCustomDocument &&
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
                {...register("instructions", { required: true })}
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
      }
      confirm={
        includePresetSigners ? (
          <Button type="submit" colorScheme="primary">
            <FormattedMessage id="generic.continue" defaultMessage="Continue" />
          </Button>
        ) : (
          <Button type="submit" colorScheme="primary">
            <FormattedMessage id="generic.save" defaultMessage="Save" />
          </Button>
        )
      }
      cancel={
        <Button type="submit" data-action="back">
          <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
        </Button>
      }
      {...props}
    />
  );
}

// Step 3: Signer management
function SignatureConfigDialogStep3({
  petition,
  integrations,
  user,
  formData,
  onStep,
  onBack,
  ...props
}: WizardStepDialogProps<SignatureConfigDialogSteps, "STEP_3", SignatureConfigInput>) {
  // Step 3: Use only relevant fields for this step
  const {
    watch,
    control,
    formState: { errors, isValid },
    handleSubmit,
  } = useForm({
    mode: "onSubmit",
    defaultValues: pick(formData, ["signersInfo"] as const),
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "signersInfo",
    rules: { required: true, minLength: 1 },
  });

  const signersInfo = watch("signersInfo");

  // Get other needed values from the original formData
  const signingMode = formData.signingMode;
  const isSequential = signingMode === "SEQUENTIAL";
  const integrationProvider = formData.integration.provider;

  const isPetition = petition.__typename === "Petition";

  const intl = useIntl();
  const handleSearchContacts = useSearchContacts();
  const handleCreateContact = useCreateContact();
  const showConfirmSignerInfo = useConfirmSignerInfoDialog();

  const [selectedContact, setSelectedContact] = useState<ContactSelectSelection | null>(null);

  const ListElement = isSequential ? OrderedList : UnorderedList;

  return (
    <ConfirmDialog
      hasCloseButton
      size="xl"
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit((step3Data, e) => {
            const isBackClick =
              (e?.nativeEvent as SubmitEvent).submitter?.getAttribute("data-action") === "back";
            const updatedFormData = { ...formData, ...step3Data };
            if (isBackClick) {
              onStep("STEP_2", { petition, integrations, user, formData: updatedFormData });
            } else {
              props.onResolve(buildSignatureConfigInput(updatedFormData));
            }
          }),
        },
      }}
      header={
        <Flex alignItems="center">
          <FormattedMessage
            id="component.signature-config-dialog.step-3-header"
            defaultMessage="Add signers"
          />
          <Text marginStart={2} color="gray.600" fontSize="md" fontWeight="400">
            3/3
          </Text>
        </Flex>
      }
      body={
        <FormControl id="signersInfo" isInvalid={!!errors.signersInfo}>
          {signersInfo.length === 0 ? (
            <Text color={!!errors.signersInfo ? "red.500" : "gray.500"} marginStart={1}>
              <FormattedMessage
                id="component.signature-config-dialog.no-signers-added"
                defaultMessage="You haven't added any signers yet"
              />
            </Text>
          ) : null}
          <ListElement
            spacing={0}
            paddingY={1}
            margin={0}
            maxH="210px"
            overflowY="auto"
            listStylePosition="inside"
          >
            {fields.map((signer, index) => (
              <SelectedSignerRow
                key={signer.id}
                isEditable={petition.__typename === "PetitionTemplate" || !signer.isPreset}
                signer={signer}
                onRemoveClick={() => remove(index)}
                onEditClick={async () => {
                  try {
                    const updated = await showConfirmSignerInfo({
                      selection: signer,
                      repeatedSigners: [],
                      isPetitionTemplate: petition.__typename === "PetitionTemplate",
                      hasSignWithDigitalCertificate: user.hasSignWithDigitalCertificate,
                      hasSignWithEmbeddedImage: user.hasSignWithEmbeddedImage,
                      disableSignWithDigitalCertificate: integrationProvider !== "SIGNATURIT",
                    });
                    update(index, updated);
                  } catch {}
                }}
              />
            ))}
          </ListElement>
          <Stack marginTop={2}>
            {!isPetition && fields.length > 0 ? (
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
              onChange={async (contact) => {
                try {
                  const repeatedSigners = signersInfo.filter(
                    (s: SignatureConfigInputSigner) => s.email === contact!.email,
                  );
                  append(
                    repeatedSigners.length > 0
                      ? await showConfirmSignerInfo({
                          selection: contact!,
                          repeatedSigners,
                          isPetitionTemplate: petition.__typename === "PetitionTemplate",
                          hasSignWithDigitalCertificate: user.hasSignWithDigitalCertificate,
                          hasSignWithEmbeddedImage: user.hasSignWithEmbeddedImage,
                          disableSignWithDigitalCertificate: integrationProvider !== "SIGNATURIT",
                        })
                      : pick(contact!, ["firstName", "lastName", "email"]),
                  );
                } catch {}
                setSelectedContact(null);
              }}
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
              onAddSigner={(signer) => append(signer)}
            />
          </Stack>
        </FormControl>
      }
      confirm={
        <Button type="submit" colorScheme="primary" isDisabled={!isValid}>
          <FormattedMessage id="generic.save" defaultMessage="Save" />
        </Button>
      }
      cancel={
        <Button type="submit" data-action="back">
          <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
        </Button>
      }
      {...props}
    />
  );
}

function buildSignatureConfigInput(data: SignatureConfigFormData): SignatureConfigInput {
  return {
    isEnabled: true,
    title: data.title || null,
    orgIntegrationId: data.integration.id,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    review: data.useCustomDocument ? true : data.review !== "NO",
    reviewAfterApproval: data.review === "AFTER_APPROVAL" ? true : null,
    allowAdditionalSigners: data.allowAdditionalSigners,
    signingMode: data.signingMode,
    // min signers must always be at least the number of embedded signature images + 1
    minSigners: Math.max(
      data.minSigners,
      data.signersInfo.filter(
        (s: SignatureConfigInputSigner) =>
          isNonNullish(s.signWithEmbeddedImage) ||
          isNonNullish(s.signWithEmbeddedImageFileUploadId),
      ).length + 1,
    ),
    instructions: data.showInstructions ? data.instructions : null,
    signersInfo: data.includePresetSigners
      ? data.signersInfo.map((s: SignatureConfigInputSigner) =>
          pick(s, [
            "firstName",
            "lastName",
            "email",
            "contactId",
            "isPreset",
            "signWithDigitalCertificate",
            "signWithEmbeddedImage",
            "signWithEmbeddedImageFileUploadId",
          ]),
        )
      : [],
    useCustomDocument: data.useCustomDocument,
  };
}

// Fragment definitions - following the original pattern
const _fragments = {
  get SignatureConfig() {
    return gql`
      fragment SignatureConfigDialog_SignatureConfig on SignatureConfig {
        isEnabled
        integration {
          ...SignatureConfigDialog_SignatureOrgIntegration
        }
        signers {
          ...Fragments_FullPetitionSigner
          signWithEmbeddedImageFileUploadId
          signWithEmbeddedImageUrl300: signWithEmbeddedImageUrl(
            options: { resize: { height: 300, fit: inside }, toFormat: png }
          )
        }
        title
        review
        allowAdditionalSigners
        signingMode
        minSigners
        instructions
        useCustomDocument
        reviewAfterApproval
      }
      ${Fragments.FullPetitionSigner}
      ${this.SignatureOrgIntegration}
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
          hasStartedProcess
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
        }
        approvalFlowConfig {
          ...Fragments_FullApprovalFlowConfig
        }
        ...SuggestedSigners_PetitionBase
      }
      ${Fragments.FullApprovalFlowConfig}
      ${SuggestedSigners.fragments.PetitionBase}
      ${this.SignatureConfig}
    `;
  },
  get SignatureOrgIntegration() {
    return gql`
      fragment SignatureConfigDialog_SignatureOrgIntegration on SignatureOrgIntegration {
        id
        name
        isDefault
        environment
        provider
      }
    `;
  },
  get User() {
    return gql`
      fragment SignatureConfigDialog_User on User {
        id
        hasPetitionApprovalFlow: hasFeatureFlag(featureFlag: PETITION_APPROVAL_FLOW)
        hasSignWithDigitalCertificate: hasFeatureFlag(featureFlag: SIGN_WITH_DIGITAL_CERTIFICATE)
        hasSignWithEmbeddedImage: hasFeatureFlag(featureFlag: SIGN_WITH_EMBEDDED_IMAGE)
        firstName
        lastName
        email
        ...SuggestedSigners_User
      }
      ${SuggestedSigners.fragments.User}
    `;
  },
};

const _query = [
  gql`
    query SignatureConfigDialog_petition($petitionId: GID!) {
      petition(id: $petitionId) {
        ...SignatureConfigDialog_PetitionBase
      }
    }
    ${_fragments.PetitionBase}
  `,
  gql`
    query SignatureConfigDialog_me {
      me {
        id
        ...SignatureConfigDialog_User
        organization {
          id
          signatureIntegrations: integrations(type: SIGNATURE, limit: 100) {
            items {
              ... on SignatureOrgIntegration {
                ...SignatureConfigDialog_SignatureOrgIntegration
              }
            }
          }
        }
      }
    }
    ${_fragments.User}
    ${_fragments.SignatureOrgIntegration}
  `,
];

export function useSignatureConfigDialog() {
  return useWizardDialog(
    {
      LOADING: SignatureConfigDialogLoading,
      STEP_1: SignatureConfigDialogStep1,
      STEP_2: SignatureConfigDialogStep2,
      STEP_3: SignatureConfigDialogStep3,
    },
    "LOADING",
  );
}
