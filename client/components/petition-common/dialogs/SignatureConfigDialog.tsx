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
  Radio,
  RadioGroup,
  Stack,
  Text,
  useCounter,
} from "@chakra-ui/react";
import { CloseableAlert } from "@parallel/components/common/CloseableAlert";
import { ContactSelect, ContactSelectSelection } from "@parallel/components/common/ContactSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { HelpCenterLink } from "@parallel/components/common/HelpCenterLink";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { Steps } from "@parallel/components/common/Steps";
import {
  SignatureConfigDialog_PetitionBaseFragment,
  SignatureConfigDialog_SignatureOrgIntegrationFragment,
  SignatureConfigDialog_UserFragment,
  SignatureConfigInput,
} from "@parallel/graphql/__types";
import { useCreateContact } from "@parallel/utils/mutations/useCreateContact";
import { withError } from "@parallel/utils/promises/withError";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { Maybe } from "@parallel/utils/types";
import { useSearchContacts } from "@parallel/utils/useSearchContacts";
import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, UseFormHandleSubmit } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import Select from "react-select";
import { isDefined, noop, omit, uniqBy } from "remeda";
import { SelectedSignerRow } from "../SelectedSignerRow";
import { SuggestedSigners } from "../SuggestedSigners";
import {
  ConfirmPetitionSignersDialog,
  SignerSelectSelection,
} from "./ConfirmPetitionSignersDialog";
import { useConfirmSignerInfoDialog } from "./ConfirmSignerInfoDialog";

export type SignatureConfigDialogProps = {
  petition: SignatureConfigDialog_PetitionBaseFragment;
  providers: SignatureConfigDialog_SignatureOrgIntegrationFragment[];
  user: SignatureConfigDialog_UserFragment;
};

export function SignatureConfigDialog({
  petition,
  providers,
  user,
  ...props
}: DialogProps<SignatureConfigDialogProps, SignatureConfigInput>) {
  const intl = useIntl();

  const {
    valueAsNumber: currentStep,
    isAtMin: isFirstStep,
    isAtMax: isLastStep,
    increment: nextStep,
    decrement: previousStep,
  } = useCounter({ min: 0, max: 1, defaultValue: 0 });

  const titleRef = useRef<HTMLInputElement>(null);

  const step1Props = useSignatureConfigDialogBodyStep1Props({
    providers,
    petition,
    titleRef,
  });

  const step2Props = useSignatureConfigDialogBodyStep2Props({ petition, user });

  const review = step1Props.form.watch("review");
  const { petitionIsCompleted } = step2Props;

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
      })
    );

    return !error;
  }

  async function handleClickNextStep() {
    const { handleSubmit: step1Submit, getValues: step1Values } = step1Props.form;
    const { handleSubmit: step2Submit, getValues: step2Values } = step2Props.form;
    if (
      (currentStep === 0 && !(await isSubmitSuccessful(step1Submit))) ||
      (currentStep === 1 && !(await isSubmitSuccessful(step2Submit)))
    ) {
      return;
    }

    if (!isLastStep && (!review || petitionIsCompleted)) {
      nextStep();
    } else {
      const data = { ...step1Values(), ...step2Values() };
      props.onResolve({
        title: data.title || null,
        orgIntegrationId: data.provider.id,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        signersInfo:
          review && !petitionIsCompleted
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
      closeOnOverlayClick={currentStep === 0 && !step1Props.form.formState.isDirty}
      size="xl"
      content={{ as: "form" }}
      header={
        <Flex alignItems="center">
          {stepHeaders[currentStep]}
          {(!review || petitionIsCompleted) && (
            <Text marginLeft={2} color="gray.600" fontSize="md" fontWeight="400">
              {currentStep + 1}/2
            </Text>
          )}
        </Flex>
      }
      body={
        <Steps currentStep={currentStep}>
          <SignatureConfigDialogBodyStep1 {...step1Props} />
          <SignatureConfigDialogBodyStep2 {...step2Props} />
        </Steps>
      }
      confirm={
        <Button colorScheme="primary" onClick={handleClickNextStep}>
          {!isLastStep && (!review || petitionIsCompleted) ? (
            <FormattedMessage id="generic.continue" defaultMessage="Continue" />
          ) : petitionIsCompleted ? (
            <FormattedMessage
              id="component.signature-config-dialog.confirm-start"
              defaultMessage="Start signature"
            />
          ) : (
            <FormattedMessage id="generic.save" defaultMessage="Save" />
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
          accesses {
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
      title: Maybe<string>;
    }>({
      mode: "onSubmit",
      defaultValues: {
        provider:
          petition.signatureConfig?.integration ??
          providers.find((p) => p.isDefault) ??
          providers[0],
        review: petition.signatureConfig?.review ?? false,
        title: petition.signatureConfig?.title ?? null,
      },
    }),
    petitionIsCompleted:
      petition.__typename === "Petition" && ["COMPLETED", "CLOSED"].includes(petition.status),
    providers,
    titleRef,
  };
}

function SignatureConfigDialogBodyStep1({
  form: { control, register },
  petitionIsCompleted,
  providers,
  titleRef,
}: ReturnType<typeof useSignatureConfigDialogBodyStep1Props>) {
  const intl = useIntl();

  const signatureIntegrationReactProps = useReactSelectProps<
    SignatureConfigDialog_SignatureOrgIntegrationFragment,
    false
  >();

  const titleRegisterProps = useRegisterWithRef(titleRef, register, "title");

  const reactSelectProps = useReactSelectProps();

  const reviewBeforeSendOptions = useMemo(
    () => [
      {
        value: "NO",
        label: intl.formatMessage({
          id: "component.signature-config-dialog.review-before-send.option-no",
          defaultMessage: "After the parallel is completed",
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
      <Stack spacing={2}>
        <Text>
          <FormattedMessage
            id="component.signature-config-dialog.header.subtitle"
            defaultMessage="Sign a PDF document with all the replies using one of our integrated eSignature providers."
          />
        </Text>
        <Text>
          <HelpCenterLink articleId={6022979} display="flex" alignItems="center" fontSize="sm">
            <FormattedMessage
              id="component.signature-config-dialog.header.help-link"
              defaultMessage="More about eSignature"
            />
          </HelpCenterLink>
        </Text>
      </Stack>
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
                    id="component.signature-config-dialog.review-before-send.option-yes.explainer"
                    defaultMessage="After reviewing the information you will have to start the signature manually."
                  />
                ) : (
                  <FormattedMessage
                    id="component.signature-config-dialog.dont-review-before-send.option-no.explainer"
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
}

function useSignatureConfigDialogBodyStep2Props({
  petition,
  user,
}: {
  petition: SignatureConfigDialog_PetitionBaseFragment;
  user: SignatureConfigDialog_UserFragment;
}) {
  const signers = petition.signatureConfig?.signers.filter(isDefined) ?? [];
  const allowAdditionalSigners = petition.signatureConfig?.allowAdditionalSigners ?? false;
  const isPetition = petition.__typename === "Petition";

  return {
    user,
    accesses: isPetition ? petition.accesses : [],
    petitionIsCompleted: isPetition && ["COMPLETED", "CLOSED"].includes(petition.status),
    previousSignatures: isPetition ? petition.signatureRequests : [],
    isTemplate: petition.__typename === "PetitionTemplate",
    form: useForm<{
      signers: SignerSelectSelection[];
      allowAdditionalSigners: boolean;
    }>({
      mode: "onSubmit",
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
    setValue,
    clearErrors,
  },
  isTemplate,
  petitionIsCompleted,
  previousSignatures,
  user,
  accesses,
}: ReturnType<typeof useSignatureConfigDialogBodyStep2Props>) {
  const signers = watch("signers");

  const intl = useIntl();
  const handleSearchContacts = useSearchContacts();
  const handleCreateContact = useCreateContact();
  const showConfirmSignerInfo = useConfirmSignerInfoDialog();

  const suggestions: SignerSelectSelection[] = uniqBy(
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
      .map((s) => ({ ...s, isSuggested: true }))
      // remove already added signers
      .filter(
        (suggestion) =>
          !signers.some(
            (s) =>
              s.email === suggestion.email &&
              s.firstName === suggestion.firstName &&
              s.lastName === suggestion.lastName
          )
      ),
    (s) => [s.email, s.firstName, s.lastName].join("|")
  );

  const [selectedContact, setSelectedContact] = useState<ContactSelectSelection | null>(null);

  const handleContactSelectOnChange =
    (onChange: (...events: any[]) => void) => async (contact: ContactSelectSelection | null) => {
      try {
        const repeatedSigners = signers.filter((s) => s.email === contact!.email);
        onChange([
          ...signers,
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
          ...signers.slice(0, index),
          await showConfirmSignerInfo({
            selection: signer,
            repeatedSigners: [],
          }),
          ...signers.slice(index + 1),
        ]);
      } catch {}
    };

  const [radioSelection, setRadioSelection] = useState<"choose-after" | "choose-now">(
    petitionIsCompleted || signers.length > 0 ? "choose-now" : "choose-after"
  );

  useEffect(() => {
    if (radioSelection === "choose-after") {
      setValue("signers", []);
      clearErrors("signers");
    }
  }, [radioSelection, setValue]);

  return (
    <>
      <RadioGroup
        as={Stack}
        marginBottom={4}
        rowGap={2}
        value={radioSelection}
        onChange={(value: any) => setRadioSelection(value)}
      >
        <Radio value="choose-after" isDisabled={petitionIsCompleted}>
          <FormattedMessage
            id="component.signature-config-dialog.radiobutton.option-1"
            defaultMessage="Indicate later"
          />
          {isTemplate ? (
            <Text as="span" color="gray.500" marginLeft={2}>
              (<FormattedMessage id="generic.recommended" defaultMessage="Recommended" />)
            </Text>
          ) : null}
        </Radio>
        <Radio value="choose-now">
          <FormattedMessage
            id="component.signature-config-dialog.radiobutton.option-2"
            defaultMessage="Include signers"
          />
        </Radio>
      </RadioGroup>
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
          rules={{
            validate: (value: any[]) => radioSelection === "choose-after" || value.length > 0,
          }}
          render={({ field: { onChange, value: signers } }) => (
            <>
              <Stack spacing={0} paddingY={1} maxH="210px" overflowY="auto">
                {signers.map((signer, index) => (
                  <SelectedSignerRow
                    key={index}
                    isEditable
                    signer={signer}
                    onRemoveClick={() => onChange(signers.filter((_, i) => index !== i))}
                    onEditClick={handleSelectedSignerRowOnEditClick(onChange, signer, index)}
                  />
                ))}
              </Stack>
              {isTemplate && signers.length > 0 ? (
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
                  onFocus={() => setRadioSelection("choose-now")}
                  onChange={handleContactSelectOnChange(onChange)}
                  onSearchContacts={handleSearchContacts}
                  onCreateContact={handleCreateContact}
                  placeholder={intl.formatMessage({
                    id: "component.signature-config-dialog.contact-select.add-contact-to-sign.placeholder",
                    defaultMessage: "Add a contact to sign",
                  })}
                />
                <SuggestedSigners
                  suggestions={suggestions}
                  onAddSigner={(s) => {
                    setRadioSelection("choose-now");
                    onChange([...signers, s]);
                  }}
                />
              </Box>
            </>
          )}
        />
      </FormControl>
      <FormControl hidden={signers.length === 0 || petitionIsCompleted}>
        <FormLabel>
          <Checkbox marginTop={4} colorScheme="primary" {...register("allowAdditionalSigners")}>
            <HStack alignContent="center">
              <FormattedMessage
                id="component.signature-config-dialog.allow-additional-signers.label"
                defaultMessage="Allow recipients to add additional signers"
              />
              <HelpPopover>
                <FormattedMessage
                  id="component.signature-config-dialog.allow-additional-signers.help"
                  defaultMessage="If this option is disabled, only the indicated people will be able to sign the document."
                />
              </HelpPopover>
            </HStack>
          </Checkbox>
        </FormLabel>
      </FormControl>
    </>
  );
}
