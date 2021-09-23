import { gql } from "@apollo/client";
import { Button, Checkbox, FormControl, FormLabel, Input, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/DialogProvider";
import {
  SignatureConfigDialog_OrgIntegrationFragment,
  SignatureConfigDialog_PetitionFragment,
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
import { ContactSelect, ContactSelectSelection } from "../common/ContactSelect";
import { HelpPopover } from "../common/HelpPopover";

export type SignatureConfigDialogProps = {
  petition: SignatureConfigDialog_PetitionFragment;
  providers: SignatureConfigDialog_OrgIntegrationFragment[];
};

export function SignatureConfigDialog({
  petition,
  providers,
  ...props
}: DialogProps<SignatureConfigDialogProps, SignatureConfigInput>) {
  const handleSearchContacts = useSearchContacts();
  const handleCreateContact = useCreateContact();

  const intl = useIntl();
  const petitionIsCompleted = ["COMPLETED", "CLOSED"].includes(petition.status);

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    watch,
  } = useForm<{
    contacts: ContactSelectSelection[];
    provider: string;
    review: boolean;
    title: string;
    letRecipientsChooseSigners: boolean;
  }>({
    mode: "onChange",
    defaultValues: {
      contacts:
        petition.signatureConfig?.contacts.map(
          (contact, index) =>
            contact ?? {
              id: "" + index,
              email: "",
              isInvalid: true,
              isDeleted: true,
            }
        ) ?? [],
      provider: providers[0].value,
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
      initialFocusRef={titleRef}
      size="xl"
      content={{
        as: "form",
        onSubmit: handleSubmit(
          ({ contacts, provider, review, title, letRecipientsChooseSigners }) => {
            props.onResolve({
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              contactIds: contacts.map((c) => c!.id),
              provider,
              review: petitionIsCompleted ? false : review,
              title,
              letRecipientsChooseSigners: contacts.length === 0 ? true : letRecipientsChooseSigners,
            });
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
                  {...reactSelectProps}
                  value={providers.find((p) => p.value === value)}
                  onChange={(p: any) => onChange(p.value)}
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
              <HelpPopover marginLeft={2} color="gray.300">
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
          </FormControl>
          <FormControl
            hidden={selectedContacts.length === 0 || petitionIsCompleted}
            alignItems="center"
            display="flex"
          >
            <Checkbox {...register("letRecipientsChooseSigners")} colorScheme="purple">
              <FormattedMessage
                id="component.signature-config-dialog.allow-recipient-to-choose.label"
                defaultMessage="Allow the recipient to choose signers"
              />
            </Checkbox>
            <HelpPopover marginLeft={2} color="gray.300">
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
  Petition: gql`
    fragment SignatureConfigDialog_Petition on Petition {
      name
      status
      signatureConfig {
        provider
        contacts {
          ...ContactSelect_Contact
        }
        title
        review
        letRecipientsChooseSigners
      }
    }
    ${ContactSelect.fragments.Contact}
  `,
  OrgIntegration: gql`
    fragment SignatureConfigDialog_OrgIntegration on OrgIntegration {
      label: name
      value: provider
    }
  `,
};

export function useSignatureConfigDialog() {
  return useDialog(SignatureConfigDialog);
}
