import { gql, useMutation } from "@apollo/client";
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ArrowForwardIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { DowJonesIntegrationDialog_validateDowJonesFactivaCredentialsDocument } from "@parallel/graphql/__types";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { isNotEmptyText } from "@parallel/utils/strings";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

interface DowJonesIntegrationDialogData {
  clientId: string;
  username: string;
  password: string;
}

export function DowJonesIntegrationDialog({
  ...props
}: DialogProps<{}, DowJonesIntegrationDialogData>) {
  const [isInvalid, setIsInvalid] = useState(false);

  const {
    handleSubmit,
    register,
    reset,
    formState: { errors, isDirty },
  } = useForm<DowJonesIntegrationDialogData>({
    mode: "onSubmit",
    defaultValues: {
      clientId: "",
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    if (isInvalid && isDirty) {
      setIsInvalid(false);
    }
  }, [isDirty]);

  const clientIdRef = useRef<HTMLInputElement>(null);
  const clientIdProps = useRegisterWithRef(clientIdRef, register, "clientId", {
    required: true,
    validate: { isNotEmptyText },
  });

  const [validateIntegration] = useMutation(
    DowJonesIntegrationDialog_validateDowJonesFactivaCredentialsDocument
  );

  return (
    <ConfirmDialog
      hasCloseButton
      content={{
        as: "form",
        onSubmit: handleSubmit(async (data) => {
          try {
            const res = await validateIntegration({
              variables: {
                ...data,
              },
            });

            if (res.data?.validateDowJonesFactivaCredentials) {
              props.onResolve(data);
            } else {
              reset(undefined, {
                keepValues: true,
              });
              setIsInvalid(true);
            }
          } catch {}
        }),
      }}
      initialFocusRef={clientIdRef}
      header={
        <HStack spacing={2} align="center">
          <Text>Parallel</Text>
          <ArrowForwardIcon role="presentation" />
          <Text>Dow Jones</Text>
        </HStack>
      }
      body={
        <Stack spacing={4}>
          <Text>
            <FormattedMessage
              id="component.dow-jones-integration-dialog.description"
              defaultMessage="Complete the information to connect your Parallel account with Dow Jones."
            />
          </Text>
          <FormControl id="clientId" isInvalid={!!errors.clientId}>
            <FormLabel fontWeight="400">
              <FormattedMessage
                id="component.dow-jones-integration-dialog.client-id"
                defaultMessage="Client ID"
              />
            </FormLabel>
            <Input autoComplete="off" {...clientIdProps} />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.field-required-error"
                defaultMessage="This field is required"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl id="username" isInvalid={!!errors.username}>
            <FormLabel fontWeight="400">
              <FormattedMessage
                id="component.dow-jones-integration-dialog.username"
                defaultMessage="Username"
              />
            </FormLabel>
            <Input
              autoComplete="off"
              {...register("username", {
                required: true,
                validate: { isNotEmptyText },
              })}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.field-required-error"
                defaultMessage="This field is required"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl id="password" isInvalid={!!errors.password}>
            <FormLabel fontWeight="400">
              <FormattedMessage
                id="component.dow-jones-integration-dialog.password"
                defaultMessage="Password"
              />
            </FormLabel>
            <Input
              type="password"
              autoComplete="off"
              {...register("password", { required: true, validate: { isNotEmptyText } })}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.field-required-error"
                defaultMessage="This field is required"
              />
            </FormErrorMessage>
          </FormControl>
          {isInvalid ? (
            <Text color="red.500">
              <FormattedMessage
                id="omponent.dow-jones-integration-dialog.invalid-credentials-message"
                defaultMessage="The credentials validation has failed, please check that everything is correct."
              />
            </Text>
          ) : null}
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="primary" variant="solid">
          <FormattedMessage
            id="component.dow-jones-integration-dialog.connect"
            defaultMessage="Connect"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useDowJonesIntegrationDialog() {
  return useDialog(DowJonesIntegrationDialog);
}

DowJonesIntegrationDialog.mutations = [
  gql`
    mutation DowJonesIntegrationDialog_validateDowJonesFactivaCredentials(
      $clientId: String!
      $username: String!
      $password: String!
    ) {
      validateDowJonesFactivaCredentials(
        clientId: $clientId
        username: $username
        password: $password
      )
    }
  `,
];
