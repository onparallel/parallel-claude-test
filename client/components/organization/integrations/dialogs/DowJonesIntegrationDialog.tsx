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
import { useDowJonesIntegrationDialog_createDowJonesKycIntegrationDocument } from "@parallel/graphql/__types";
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

export function DowJonesIntegrationDialog({ ...props }: DialogProps) {
  const [isInvalid, setIsInvalid] = useState(false);

  const {
    handleSubmit,
    register,
    reset,
    formState: { errors, isDirty, isSubmitting },
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

  const [createDowJonesKycIntegration] = useMutation(
    useDowJonesIntegrationDialog_createDowJonesKycIntegrationDocument,
  );
  return (
    <ConfirmDialog
      hasCloseButton
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async (data) => {
            try {
              await createDowJonesKycIntegration({ variables: data });
              props.onResolve();
            } catch {
              reset(undefined, {
                keepValues: true,
              });
              setIsInvalid(true);
              return;
            }
          }),
        },
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
                id="generic.field-required-error"
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
                id="generic.field-required-error"
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
                id="generic.field-required-error"
                defaultMessage="This field is required"
              />
            </FormErrorMessage>
          </FormControl>
          {isInvalid ? (
            <Text color="red.500">
              <FormattedMessage
                id="generic.integration-invalid-credentials-message"
                defaultMessage="The credentials validation has failed, please check that everything is correct."
              />
            </Text>
          ) : null}
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="primary" variant="solid" isLoading={isSubmitting}>
          <FormattedMessage id="generic.connect" defaultMessage="Connect" />
        </Button>
      }
      {...props}
    />
  );
}

const _mutations = [
  gql`
    mutation useDowJonesIntegrationDialog_createDowJonesKycIntegration(
      $clientId: String!
      $username: String!
      $password: String!
    ) {
      createDowJonesKycIntegration(clientId: $clientId, username: $username, password: $password) {
        id
      }
    }
  `,
];

export function useDowJonesIntegrationDialog() {
  return useDialog(DowJonesIntegrationDialog);
}
