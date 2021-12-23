import { gql } from "@apollo/client";
import {
  Button,
  FormControl,
  FormLabel,
  ListItem,
  Stack,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import { ContactSelect, ContactSelectSelection } from "@parallel/components/common/ContactSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { usePetitionPreviewSignerInfoDialog_PetitionSignerFragment } from "@parallel/graphql/__types";
import { useCreateContact } from "@parallel/utils/mutations/useCreateContact";
import { Maybe } from "@parallel/utils/types";
import { useSearchContacts } from "@parallel/utils/useSearchContacts";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

type PetitionPreviewSignerInfoDialogProps = {
  signers: usePetitionPreviewSignerInfoDialog_PetitionSignerFragment[];
  petitionId: string;
  recipientCanAddSigners: boolean;
};

export type PetitionPreviewSignerInfoDialogResult = {
  additionalSigners: ContactSelectSelection[];
  message: Maybe<string>;
};

function PetitionPreviewSignerInfoDialog({
  petitionId,
  signers,
  recipientCanAddSigners,
  ...props
}: DialogProps<PetitionPreviewSignerInfoDialogProps, PetitionPreviewSignerInfoDialogResult>) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<{ contacts: ContactSelectSelection[] }>({
    mode: "onChange",
    defaultValues: {
      contacts: [],
    },
  });

  const handleSearchContacts = useSearchContacts();
  const handleCreateContact = useCreateContact();
  const intl = useIntl();
  return (
    <ConfirmDialog
      {...props}
      size="xl"
      hasCloseButton
      content={{
        as: "form",
        onSubmit: handleSubmit(({ contacts }) => {
          props.onResolve({
            additionalSigners: contacts,
            message: "message",
          });
        }),
      }}
      header={
        <FormattedMessage
          id="recipient-view.complete-signer-info-dialog.header"
          defaultMessage="Sign petition"
        />
      }
      body={
        <Stack spacing={4}>
          <Text>
            <FormattedMessage
              id="recipient-view.complete-signer-info-dialog.subtitle"
              defaultMessage="{tone, select, INFORMAL{An <b>eSignature</b> is required to complete this petition.} other{This petition requires an eSignature in order to be completed.}}"
              values={{
                tone: "FORMAL",
              }}
            />
          </Text>
          {signers.length ? (
            <Stack>
              <Text>
                <FormattedMessage
                  id="recipient-view.complete-signer-info-dialog.subtitle.with-signers"
                  defaultMessage="{tone, select, INFORMAL{Click on <b>Continue with eSignature</b> and} other{After you click on <b>Continue with eSignature</b>,}} we will send an email with information on how to complete the process to the following people:"
                  values={{
                    tone: "FORMAL",
                  }}
                />
              </Text>
              <UnorderedList paddingLeft={8}>
                {signers.map((s, i) => {
                  return (
                    <ListItem key={i}>
                      {s.fullName} {`<${s.email}> `}
                    </ListItem>
                  );
                })}
              </UnorderedList>
            </Stack>
          ) : null}
          {recipientCanAddSigners ? (
            <FormControl isInvalid={!!errors.contacts}>
              <FormLabel>
                {signers.length === 0 ? (
                  <Text>
                    <FormattedMessage
                      id="component.signature-config-dialog.contact-select.label"
                      defaultMessage="Who has to sign the petition?"
                    />
                  </Text>
                ) : (
                  <Text>
                    <FormattedMessage
                      id="recipient-view.complete-signer-info-dialog.subtitle.recipient-can-add"
                      defaultMessage="You can add more signers if you consider it necessary."
                    />
                  </Text>
                )}
              </FormLabel>
              <Controller
                name="contacts"
                control={control}
                rules={{
                  validate: (value) => (signers.length === 0 ? value.length > 0 : true),
                }}
                render={({ field: { onChange, value } }) => (
                  <ContactSelect
                    value={value}
                    onChange={onChange}
                    onSearchContacts={handleSearchContacts}
                    onCreateContact={handleCreateContact}
                    placeholder={intl.formatMessage({
                      id: "component.signature-config-dialog.contact-select.placeholder-required",
                      defaultMessage: "Select the signers",
                    })}
                  />
                )}
              />
            </FormControl>
          ) : null}
        </Stack>
      }
      confirm={
        <Button colorScheme="purple" type="submit">
          <FormattedMessage
            id="component.signature-config-dialog.confirm-start"
            defaultMessage="Start signature"
          />
        </Button>
      }
    />
  );
}

usePetitionPreviewSignerInfoDialog.fragments = {
  PetitionSigner: gql`
    fragment usePetitionPreviewSignerInfoDialog_PetitionSigner on PetitionSigner {
      fullName
      email
    }
  `,
  Contact: gql`
    fragment usePetitionPreviewSignerInfoDialog_Contact on Contact {
      firstName
      lastName
      email
    }
  `,
};

export function usePetitionPreviewSignerInfoDialog() {
  return useDialog(PetitionPreviewSignerInfoDialog);
}
