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
import { fullName } from "@parallel/utils/fullName";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { SignerSelectSelection } from "./ConfirmPetitionSignersDialog";

interface ConfirmSignerInfoDialogProps {
  selection: SignerSelectSelection;
  repeatedSigners: { firstName: string; lastName?: string | null }[];
}

function ConfirmSignerInfoDialog({
  selection,
  repeatedSigners,
  ...props
}: DialogProps<ConfirmSignerInfoDialogProps, SignerSelectSelection>) {
  const intl = useIntl();
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<SignerSelectSelection>({
    mode: "onSubmit",
    defaultValues: {
      email: selection.email,
      firstName: selection.firstName,
      lastName: selection.lastName,
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
        onSubmit: handleSubmit(({ email, firstName, lastName }) => {
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
          {repeatedSigners.length > 0 ? (
            <Text fontSize="14px">
              <FormattedMessage
                id="component.confirm-signer-info-dialog.header"
                defaultMessage="You already added this email for {signersList}. You can modify the name and add it again."
                values={{
                  signersList: intl.formatList(
                    repeatedSigners.map((s) => fullName(s.firstName, s.lastName))
                  ),
                }}
              />
            </Text>
          ) : null}
          <FormControl id="email" isInvalid={!!errors.email}>
            <FormLabel fontWeight="bold">
              <FormattedMessage id="generic.email" defaultMessage="Email" />
            </FormLabel>
            <Input
              type="email"
              {...register("email", {
                required: true,
                pattern: EMAIL_REGEX,
              })}
              placeholder={intl.formatMessage({
                id: "generic.forms.company-email-placeholder",
                defaultMessage: "example@company.com",
              })}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.invalid-email-error"
                defaultMessage="Please, enter a valid email"
              />
            </FormErrorMessage>
          </FormControl>
          <Stack direction={{ base: "column", sm: "row" }}>
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
