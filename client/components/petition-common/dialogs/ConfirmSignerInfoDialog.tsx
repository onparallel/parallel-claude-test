import {
  Alert,
  AlertIcon,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { fullName } from "@parallel/utils/fullName";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import type { SignerSelectSelection } from "./ConfirmPetitionSignersDialog";

interface ConfirmSignerInfoDialogProps {
  selection: SignerSelectSelection;
  repeatedSigners: { firstName: string; lastName?: string | null }[];
  allowUpdateFixedSigner?: boolean;
}

function ConfirmSignerInfoDialog({
  selection,
  repeatedSigners,
  allowUpdateFixedSigner,
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
      isPreset: selection.isPreset ?? false,
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
          onSubmit: handleSubmit(props.onResolve),
        },
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
            <>
              <Text fontSize="14px">
                <FormattedMessage
                  id="component.confirm-signer-info-dialog.body"
                  defaultMessage="You already added this email for <b>{signersList}</b>. You can modify the name and add it again."
                  values={{
                    signersList: intl.formatList(
                      repeatedSigners.map((s) => fullName(s.firstName, s.lastName)),
                    ),
                  }}
                />
              </Text>
              <Alert status="warning">
                <AlertIcon />
                <Text fontSize="14px">
                  <FormattedMessage
                    id="component.confirm-signer-info-dialog.body-extended"
                    defaultMessage="Each signer gets a separate email. If they share the same address, they will receive one email per signer, and all must be signed."
                  />
                </Text>
              </Alert>
            </>
          ) : null}
          <FormControl id="email" isInvalid={!!errors.email}>
            <FormLabel fontWeight={400}>
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
                id="generic.forms-invalid-email-error"
                defaultMessage="Please, enter a valid email"
              />
            </FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.firstName}>
            <FormLabel fontWeight={400}>
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
            <FormLabel fontWeight={400}>
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
          {allowUpdateFixedSigner && (
            <FormControl>
              <HStack alignItems="center" justifyContent="space-between">
                <Flex alignItems="center">
                  <FormLabel fontWeight={400} margin="auto">
                    <FormattedMessage
                      id="component.confirm-signer-info-dialog.is-preset"
                      defaultMessage="Required signed"
                    />
                  </FormLabel>
                  <HelpPopover>
                    <Text fontSize="sm">
                      <FormattedMessage
                        id="component.confirm-signer-info-dialog.is-preset-popover"
                        defaultMessage="Required signers cannot be removed once the parallel is created."
                      />
                    </Text>
                  </HelpPopover>
                </Flex>
                <Switch {...register("isPreset")} />
              </HStack>
            </FormControl>
          )}
        </Stack>
      }
      confirm={
        <Button colorScheme="primary" type="submit">
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
