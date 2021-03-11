import { Button, FormControl, FormLabel } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import {
  SignatureConfig,
  SignatureConfigInput,
} from "@parallel/graphql/__types";
import { useCreateContact } from "@parallel/utils/mutations/useCreateContact";
import { useSearchContacts } from "@parallel/utils/useSearchContacts";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { ContactSelect } from "../common/ContactSelect";

export function SignerSelectDialog(
  props: DialogProps<{}, Pick<SignatureConfigInput, "contactIds">>
) {
  const { control, handleSubmit, errors } = useForm<
    Pick<SignatureConfig, "contacts">
  >({
    mode: "onChange",
    defaultValues: {
      contacts: [],
    },
  });

  const handleSearchContacts = useSearchContacts();
  const handleCreateContact = useCreateContact();

  return (
    <ConfirmDialog
      size="xl"
      content={{
        as: "form",
        onSubmit: handleSubmit(({ contacts }) => {
          props.onResolve({
            contactIds: contacts.map((c) => c!.id),
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
        <FormControl isInvalid={!!errors.contacts}>
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
              validate: (value) => value.length > 0,
            }}
            render={({ onChange, value }) => (
              <ContactSelect
                value={value}
                onChange={onChange}
                onSearchContacts={handleSearchContacts}
                onCreateContact={handleCreateContact}
              />
            )}
          />
        </FormControl>
      }
      confirm={
        <Button colorScheme="purple" type="submit">
          <FormattedMessage id="generic.send" defaultMessage="Send" />
        </Button>
      }
      {...props}
    />
  );
}

export function useSignerSelectDialog() {
  return useDialog(SignerSelectDialog);
}
