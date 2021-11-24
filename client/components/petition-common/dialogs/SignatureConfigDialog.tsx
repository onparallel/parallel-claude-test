import { gql } from "@apollo/client";
import {
  AlertIcon,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { CloseableAlert } from "@parallel/components/common/CloseableAlert";
import { ContactSelect, ContactSelectSelection } from "@parallel/components/common/ContactSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import {
  SignatureConfigDialog_PetitionBaseFragment,
  SignatureConfigDialog_SignatureOrgIntegrationFragment,
  SignatureConfigInput,
} from "@parallel/graphql/__types";
import { useCreateContact } from "@parallel/utils/mutations/useCreateContact";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { useSearchContacts } from "@parallel/utils/useSearchContacts";
import { useMemo, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import Select, { StylesConfig } from "react-select";
import { omit } from "remeda";

export type SignatureConfigDialogProps = {
  petition: SignatureConfigDialog_PetitionBaseFragment;
  providers: SignatureConfigDialog_SignatureOrgIntegrationFragment[];
};

export function SignatureConfigDialog({
  petition,
  providers,
  ...props
}: DialogProps<SignatureConfigDialogProps, SignatureConfigInput>) {
  const handleSearchContacts = useSearchContacts();
  const handleCreateContact = useCreateContact();

  const intl = useIntl();
  const petitionIsCompleted =
    petition.__typename === "Petition" && ["COMPLETED", "CLOSED"].includes(petition.status);

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    watch,
  } = useForm<{
    contacts: ContactSelectSelection[];
    provider: SignatureConfigDialog_SignatureOrgIntegrationFragment;
    review: boolean;
    title: string;
    letRecipientsChooseSigners: boolean;
  }>({
    mode: "onChange",
    defaultValues: {
      contacts: (petition.signatureConfig?.signers ?? []).map((signer) => ({
        ...omit(signer, ["contactId", "__typename"]),
        id: signer.contactId!,
      })),
      provider:
        petition.signatureConfig?.integration ?? providers.find((p) => p.isDefault) ?? providers[0],
      review: petition.signatureConfig?.review ?? true,
      title: petition.signatureConfig?.title ?? petition.name ?? "",
      letRecipientsChooseSigners: petition.signatureConfig?.letRecipientsChooseSigners ?? false,
    },
  });

  const review = watch("review");
  const selectedContacts = watch("contacts");

  const titleRef = useRef<HTMLInputElement>(null);
  const titleRegisterProps = useRegisterWithRef(titleRef, register, "title", {
    required: true,
  });

  const reviewBeforeSendOptions = useMemo(
    () => [
      {
        value: "YES",
        label: intl.formatMessage({
          id: "component.signature-config-dialog.review-before-send.option-yes",
          defaultMessage: "Yes, review before starting the signature process",
        }),
      },
      {
        value: "NO",
        label: intl.formatMessage({
          id: "component.signature-config-dialog.review-before-send.option-no",
          defaultMessage: "No, start automatically when completing the petition",
        }),
      },
    ],
    [intl.locale]
  );

  const signatureIntegrationReactProps = useReactSelectProps<
    SignatureConfigDialog_SignatureOrgIntegrationFragment,
    false
  >();
  const reactSelectProps = useReactSelectProps();

  const contactProps = useMemo(
    () => ({
      styles: {
        placeholder: (styles, { theme }) => {
          return {
            ...styles,
            color: petitionIsCompleted ? theme.colors.neutral40 : theme.colors.neutral90,
            whiteSpace: "nowrap",
          };
        },
      } as StylesConfig<any, any, any>,
    }),
    [petitionIsCompleted]
  );

  return (
    <ConfirmDialog
      hasCloseButton
      initialFocusRef={titleRef}
      size="xl"
      content={{
        as: "form",
        onSubmit: handleSubmit(
          ({ contacts, provider, review, title, letRecipientsChooseSigners }) => {
            if (review) {
              props.onResolve({
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                signersInfo: contacts.map((c) => ({
                  contactId: c.id,
                  email: c.email,
                  firstName: c.firstName ?? "",
                  lastName: c.lastName ?? "",
                })),
                orgIntegrationId: provider.id,
                review: petitionIsCompleted ? false : review,
                title,
                letRecipientsChooseSigners: false,
              });
            } else {
              props.onResolve({
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                signersInfo: contacts.map((c) => ({
                  contactId: c.id,
                  email: c.email,
                  firstName: c.firstName ?? "",
                  lastName: c.lastName ?? "",
                })),
                orgIntegrationId: provider.id,
                review: false,
                title,
                letRecipientsChooseSigners:
                  contacts.length === 0 ? true : letRecipientsChooseSigners,
              });
            }
          }
        ),
      }}
      header={
        <FormattedMessage
          id="component.signature-config-dialog.header"
          defaultMessage="eSignature configuration"
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.signature-config-dialog.header.subtitle"
              defaultMessage="A PDF with all the replies will be generated and sent to the eSignature provider. You can define when and by whom the document should be signed."
            />
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
                  getOptionLabel={(p) => p.name}
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
          <FormControl hidden={petitionIsCompleted}>
            <FormLabel>
              <FormattedMessage
                id="component.signature-config-dialog.review-before-send-label"
                defaultMessage="Do you want to review the information before it is sent to sign?"
              />
            </FormLabel>
            <Controller
              name="review"
              control={control}
              render={({ field: { onChange, value: review } }) => (
                <>
                  <Select
                    {...reactSelectProps}
                    value={reviewBeforeSendOptions[review ? 0 : 1]}
                    options={reviewBeforeSendOptions}
                    onChange={(v: any) => onChange(v.value === "YES")}
                    isSearchable={false}
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
                        defaultMessage=" The signature will be initiated when the recipient has completed the information."
                      />
                    )}
                  </Text>
                </>
              )}
            />
          </FormControl>
          <FormControl hidden={review && !petitionIsCompleted} isInvalid={!!errors.contacts}>
            <FormLabel>
              <FormattedMessage
                id="component.signature-config-dialog.contact-select.label"
                defaultMessage="Who has to sign the petition?"
              />
            </FormLabel>
            <Controller
              name="contacts"
              control={control}
              rules={{
                validate: (contacts: ContactSelectSelection[]) =>
                  !petitionIsCompleted ||
                  (contacts.length > 0 && contacts.every((c) => !c.isInvalid && !c.isDeleted)),
              }}
              render={({ field: { onChange, value } }) => (
                <ContactSelect
                  value={value}
                  onChange={onChange}
                  onSearchContacts={handleSearchContacts}
                  onCreateContact={handleCreateContact}
                  placeholder={
                    petitionIsCompleted
                      ? intl.formatMessage({
                          id: "component.signature-config-dialog.contact-select.placeholder-required",
                          defaultMessage: "Select the signers",
                        })
                      : intl.formatMessage({
                          id: "component.signature-config-dialog.contact-select.placeholder-optional",
                          defaultMessage: "Let the recipient choose",
                        })
                  }
                  {...contactProps}
                />
              )}
            />
            {petition.__typename === "PetitionTemplate" && selectedContacts.length > 0 ? (
              <CloseableAlert status="info" borderRadius="base" marginTop={2}>
                <AlertIcon />
                <FormattedMessage
                  id="component.signature-config-dialog.alert"
                  defaultMessage="These signers will be assigned to all the petitions that are created from this template."
                />
              </CloseableAlert>
            ) : null}
          </FormControl>
          <FormControl
            hidden={selectedContacts.length === 0 || petitionIsCompleted || review}
            alignItems="center"
            display="flex"
          >
            <Checkbox {...register("letRecipientsChooseSigners")} colorScheme="purple">
              <FormattedMessage
                id="component.signature-config-dialog.allow-recipient-to-choose.label"
                defaultMessage="Allow the recipient to choose signers"
              />
            </Checkbox>
            <HelpPopover>
              <FormattedMessage
                id="component.signature-config-dialog.allow-recipient-to-choose.help"
                defaultMessage="If this option is disabled, only the assigned people will be able to sign."
              />
            </HelpPopover>
          </FormControl>
        </Stack>
      }
      confirm={
        petitionIsCompleted ? (
          <Button colorScheme="purple" type="submit">
            <FormattedMessage
              id="component.signature-config-dialog.confirm-start"
              defaultMessage="Start signature"
            />
          </Button>
        ) : (
          <Button colorScheme="purple" type="submit">
            <FormattedMessage id="generic.continue" defaultMessage="Continue" />
          </Button>
        )
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
          letRecipientsChooseSigners
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
