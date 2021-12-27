import { gql } from "@apollo/client";
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  ListItem,
  Stack,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import { ContactSelect, ContactSelectSelection } from "@parallel/components/common/ContactSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  PetitionLocale,
  usePetitionPreviewSignerInfoDialog_OrganizationFragment,
  usePetitionPreviewSignerInfoDialog_PetitionSignerFragment,
  usePetitionPreviewSignerInfoDialog_UserFragment,
} from "@parallel/graphql/__types";
import { useCreateContact } from "@parallel/utils/mutations/useCreateContact";
import { Maybe } from "@parallel/utils/types";
import { useSearchContacts } from "@parallel/utils/useSearchContacts";
import { outdent } from "outdent";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

type PetitionPreviewSignerInfoDialogProps = {
  petitionId: string;
  signers: usePetitionPreviewSignerInfoDialog_PetitionSignerFragment[];
  recipientCanAddSigners: boolean;
  user: usePetitionPreviewSignerInfoDialog_UserFragment;
  organization: usePetitionPreviewSignerInfoDialog_OrganizationFragment;
};

export type PetitionPreviewSignerInfoDialogResult = {
  additionalSignersContactIds: Maybe<string | string[]>;
  message: Maybe<string>;
};

function PetitionPreviewSignerInfoDialog({
  petitionId,
  signers,
  recipientCanAddSigners,
  user,
  organization,
  ...props
}: DialogProps<PetitionPreviewSignerInfoDialogProps, PetitionPreviewSignerInfoDialogResult>) {
  const intl = useIntl();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<{ contacts: ContactSelectSelection[]; message: string }>({
    mode: "onChange",
    defaultValues: {
      contacts: [],
      message: (messages[intl.locale as PetitionLocale] ?? messages["en"])(
        organization.name,
        user.fullName ?? ""
      ),
    },
  });

  const handleSearchContacts = useSearchContacts();
  const handleCreateContact = useCreateContact();

  return (
    <ConfirmDialog
      {...props}
      size="xl"
      hasCloseButton
      content={{
        as: "form",
        onSubmit: handleSubmit(({ contacts, message }) => {
          props.onResolve({
            additionalSignersContactIds: contacts.map((c) => c.id),
            message,
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
                tone: "INFORMAL",
              }}
            />
          </Text>
          {signers.length ? (
            <Stack>
              <Text>
                <FormattedMessage
                  id="recipient-view.complete-signer-info-dialog.subtitle.with-signers"
                  defaultMessage="{tone, select, INFORMAL{Click on <b>{button}</b> and} other{After you click on <b>{button}</b>,}} we will send an email with information on how to complete the process to the following people:"
                  values={{
                    tone: "INFORMAL",
                    button: (
                      <FormattedMessage
                        id="component.signature-config-dialog.confirm-start"
                        defaultMessage="Start signature"
                      />
                    ),
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
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.required-field-error"
                  defaultMessage="The field is required"
                />
              </FormErrorMessage>
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

const messages: Record<PetitionLocale, (organization: string, userName: string) => string> = {
  en: (organization, userName) => outdent`
  Hello,

  I have completed this document requested by ${organization} through Parallel. Could you please sign it?

  Thanks,
  ${userName}.
`,
  es: (organization, userName) => outdent`
  Hola,

  He completado este documento que nos han pedido de ${organization} a través de Parallel. ¿Podrías por favor firmarlo?
  
  Gracias,
  ${userName}.
`,
};

usePetitionPreviewSignerInfoDialog.fragments = {
  PetitionSigner: gql`
    fragment usePetitionPreviewSignerInfoDialog_PetitionSigner on PetitionSigner {
      fullName
      email
    }
  `,
  User: gql`
    fragment usePetitionPreviewSignerInfoDialog_User on User {
      id
      firstName
      lastName
      fullName
    }
  `,
  Organization: gql`
    fragment usePetitionPreviewSignerInfoDialog_Organization on Organization {
      id
      name
    }
  `,
};

export function usePetitionPreviewSignerInfoDialog() {
  return useDialog(PetitionPreviewSignerInfoDialog);
}
