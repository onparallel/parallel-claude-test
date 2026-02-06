import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Stack,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Button, Text } from "@parallel/components/ui";
import { Tone } from "@parallel/graphql/__types";
import { fullName } from "@parallel/utils/fullName";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { isValidEmail } from "@parallel/utils/validation";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import type { SignerSelectSelection } from "./ConfirmPetitionSignersDialog";

interface SignerInfo {
  firstName: string;
  lastName?: string | null;
  email: string;
}

interface RecipientViewConfirmSignerInfoDialogProps {
  selection: SignerInfo;
  repeatedSigners: { firstName: string; lastName?: string | null }[];
  tone?: Tone;
}

function RecipientViewConfirmSignerInfoDialog({
  selection,
  repeatedSigners,
  tone = "INFORMAL",
  ...props
}: DialogProps<RecipientViewConfirmSignerInfoDialogProps, SignerInfo>) {
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
        containerProps: {
          as: "form",
          onSubmit: handleSubmit((data) => props.onResolve({ ...data, email: data.email! })),
        },
      }}
      header={
        <FormattedMessage
          id="component.recipient-view-confirm-signer-info-dialog.title"
          defaultMessage="Confirm the signer's information"
        />
      }
      body={
        <Stack>
          {repeatedSigners.length > 0 ? (
            <>
              <Text fontSize="14px">
                <FormattedMessage
                  id="component.recipient-view-confirm-signer-info-dialog.body"
                  defaultMessage="You already added this email for <b>{signersList}</b>. You can modify the name and add it again."
                  values={{
                    signersList: intl.formatList(
                      repeatedSigners.map((s) => fullName(s.firstName, s.lastName)),
                    ),
                  }}
                />
              </Text>
              <Alert status="warning" rounded="md">
                <AlertIcon />
                <Stack spacing={1}>
                  <AlertTitle fontSize="14px">
                    <FormattedMessage
                      id="component.recipient-view-confirm-signer-info-dialog.alert-title"
                      defaultMessage="Each signature email includes a unique and personalized link."
                    />
                  </AlertTitle>
                  <AlertDescription fontSize="14px">
                    <FormattedMessage
                      id="component.recipient-view-confirm-signer-info-dialog.alert-description"
                      defaultMessage="If you add multiple signers with the same email address, they'll receive as many separate emails as the number of signers you've assigned to that address."
                      values={{
                        tone,
                      }}
                    />
                  </AlertDescription>
                </Stack>
              </Alert>
            </>
          ) : null}
          <FormControl id="email" isInvalid={!!errors.email}>
            <FormLabel fontWeight={500}>
              <FormattedMessage id="generic.email" defaultMessage="Email" />
            </FormLabel>
            <Input
              type="email"
              {...register("email", {
                required: true,
                validate: { isValidEmail: (email) => !!email && isValidEmail(email) },
              })}
              placeholder={intl.formatMessage({
                id: "generic.forms.company-email-placeholder",
                defaultMessage: "example@company.com",
              })}
            />

            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms-invalid-email-error"
                defaultMessage="Please, enter a valid email"
              />
            </FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.firstName}>
            <FormLabel fontWeight={500}>
              <FormattedMessage id="generic.forms-first-name-label" defaultMessage="First name" />
            </FormLabel>
            <Input {...firstNameProps} />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.invalid-first-name-error"
                defaultMessage="Please, enter the first name"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!errors.lastName}>
            <FormLabel fontWeight={500}>
              <FormattedMessage id="generic.forms-last-name-label" defaultMessage="Last name" />
            </FormLabel>
            <Input {...register("lastName", { required: true })} />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms-invalid-last-name-error"
                defaultMessage="Please, enter the last name"
              />
            </FormErrorMessage>
          </FormControl>
        </Stack>
      }
      confirm={
        <Button colorPalette="primary" type="submit">
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      {...props}
    />
  );
}

export function useRecipientViewConfirmSignerInfoDialog() {
  return useDialog(RecipientViewConfirmSignerInfoDialog);
}
