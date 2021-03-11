import { gql } from "@apollo/client";
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import {
  SignatureConfig,
  SignatureConfigDialog_OrgIntegrationFragment,
  SignatureConfigDialog_PetitionFragment,
  SignatureConfigInput,
} from "@parallel/graphql/__types";
import { useCreateContact } from "@parallel/utils/mutations/useCreateContact";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { useSearchContacts } from "@parallel/utils/useSearchContacts";
import useMergedRef from "@react-hook/merged-ref";
import { useMemo, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import Select from "react-select";
import { ContactSelect } from "../common/ContactSelect";
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
    errors,
    handleSubmit,
    register,
    watch,
  } = useForm<SignatureConfig>({
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
    },
  });

  const hideContactSelection = watch("review");

  const titleInputRef = useRef<HTMLInputElement>(null);

  const reviewBeforeSendOptions = useMemo(
    () => [
      {
        value: "YES",
        label: intl.formatMessage({
          id: "component.signature-config-dialog.review-before-send.option-1",
          defaultMessage: "Yes, review before starting the signature process",
        }),
      },
      {
        value: "NO",
        label: intl.formatMessage({
          id: "component.signature-config-dialog.review-before-send.option-2",
          defaultMessage:
            "No, start automatically when completing the petition",
        }),
      },
    ],
    [intl.locale]
  );

  const reactSelectProps = useReactSelectProps({});

  return (
    <ConfirmDialog
      initialFocusRef={titleInputRef}
      size="xl"
      content={{
        as: "form",
        onSubmit: handleSubmit(({ contacts, provider, review, title }) => {
          props.onResolve({
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            contactIds: contacts.map((c) => c!.id),
            provider,
            review: petitionIsCompleted ? false : review,
            title,
          });
        }),
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
          <FormControl>
            <FormLabel>
              <FormattedMessage
                id="component.signature-config-dialog.provider-label"
                defaultMessage="eSignature provider"
              />
            </FormLabel>
            <Controller
              name="provider"
              control={control}
              render={({ onChange, value }) => {
                const provider = providers.find((p) => p.value === value);
                return (
                  <Select
                    {...reactSelectProps}
                    value={provider}
                    onChange={(p: any) => onChange(p.value)}
                    options={providers}
                    isSearchable={false}
                  />
                );
              }}
            />
          </FormControl>
          <FormControl isInvalid={!!errors.title}>
            <FormLabel display="flex" alignItems="center">
              <FormattedMessage
                id="component.signature-config-dialog.title-label"
                defaultMessage="Title of the document"
              />
              <HelpPopover marginLeft={2}>
                <FormattedMessage
                  id="component.signature-config-dialog.title-help"
                  defaultMessage="We will use this as the title of the signing document"
                />
              </HelpPopover>
            </FormLabel>
            <Input
              ref={useMergedRef(titleInputRef, register({ required: true }))}
              name="title"
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
              render={({ onChange, value: review }) => (
                <>
                  <Select
                    {...reactSelectProps}
                    value={reviewBeforeSendOptions[review ? 0 : 1]}
                    options={reviewBeforeSendOptions}
                    onChange={(v: any) => onChange(v.value === "YES")}
                    isSearchable={false}
                    isDisabled={petitionIsCompleted}
                  />
                  <Text marginTop={2} color="gray.500" fontSize="sm">
                    {review ? (
                      <FormattedMessage
                        id="component.signature-config-dialog.review-before-send.explainer"
                        defaultMessage="After reviewing the information you will have to start the signature manually."
                      />
                    ) : (
                      <FormattedMessage
                        id="component.signature-config-dialog.dont-review-before-send.explainer"
                        defaultMessage=" The signature will be initiated when the recipient has completed the information."
                      />
                    )}
                  </Text>
                </>
              )}
            />
          </FormControl>
          <FormControl
            hidden={hideContactSelection && !petitionIsCompleted}
            isInvalid={!!errors.contacts}
          >
            <FormLabel>
              <FormattedMessage
                id="component.signature-config-dialog.contacts-label"
                defaultMessage="Who has to sign the petition?"
              />
            </FormLabel>
            <Controller
              name="contacts"
              control={control}
              rules={{
                validate: (value) => !petitionIsCompleted || value.length > 0,
              }}
              render={({ onChange, value }) => (
                <ContactSelect
                  value={value}
                  onChange={onChange}
                  onSearchContacts={handleSearchContacts}
                  onCreateContact={handleCreateContact}
                  placeholder={
                    petitionIsCompleted
                      ? intl.formatMessage({
                          id:
                            "component.signature-config-dialog.contacts-placeholder.required",
                          defaultMessage: "Select the signers",
                        })
                      : intl.formatMessage({
                          id:
                            "component.signature-config-dialog.contacts-placeholder.optional",
                          defaultMessage: "Let the recipient choose",
                        })
                  }
                />
              )}
            />
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
      currentSignatureRequest {
        id
        status
      }
      signatureConfig {
        provider
        contacts {
          ...ContactSelect_Contact
        }
        title
        review
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
