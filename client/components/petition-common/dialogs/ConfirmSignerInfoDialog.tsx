import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { SignerSelectSelection } from "./ConfirmPetitionSignersDialog";

function ConfirmSignerInfoDialog({
  email,
  firstName,
  lastName,
  ...props
}: DialogProps<SignerSelectSelection, SignerSelectSelection>) {
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<SignerSelectSelection>({
    mode: "onSubmit",
    defaultValues: {
      email,
      firstName,
      lastName,
    },
  });
  const firstNameRef = useRef<HTMLInputElement>(null);
  const firstNameProps = useRegisterWithRef(firstNameRef, register, "firstName", {
    required: true,
  });
  return (
    <ConfirmDialog
      initialFocusRef={firstNameRef}
      size="md"
      content={{
        as: "form",
        onSubmit: handleSubmit(({ firstName, lastName }) => {
          props.onResolve({ email, firstName, lastName });
        }),
      }}
      header={
        <FormattedMessage
          id="component.confirm-signer-info-dialog.title"
          defaultMessage="Confirm the signer's information"
        />
      }
      body={
        <Stack>
          <FormControl id="email">
            <FormLabel fontWeight="bold">
              <FormattedMessage id="generic.email" defaultMessage="Email" />
            </FormLabel>
            <Input {...register("email", { disabled: true })} />
          </FormControl>
          <Stack direction="row">
            <FormControl isInvalid={!!errors.firstName}>
              <FormLabel fontWeight="bold">
                <FormattedMessage id="generic.forms.first-name-label" defaultMessage="First name" />
              </FormLabel>
              <Input {...firstNameProps} />
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.forms.invalid-first-name-error"
                  defaultMessage="Please, enter the first name"
                />
              </FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.lastName}>
              <FormLabel fontWeight="bold">
                <FormattedMessage id="generic.forms.last-name-label" defaultMessage="Last name" />
              </FormLabel>
              <Input {...register("lastName", { required: true })} />
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.forms.invalid-last-name-error"
                  defaultMessage="Please, enter the last name"
                />
              </FormErrorMessage>
            </FormControl>
          </Stack>
          <Text fontSize="14px">
            <FormattedMessage
              id="component.confirm-signer-info-dialog.footer"
              defaultMessage="Continue to update the signer's information. The contact data will not be overwritten."
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button colorScheme="purple" type="submit">
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmSignerInfoDialog() {
  return useDialog(ConfirmSignerInfoDialog);
}
