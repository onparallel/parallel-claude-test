import { gql } from "@apollo/client";
import { Button, FormControl, FormErrorMessage, Input, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/DialogProvider";
import { useGenerateNewTokenDialog_generateUserAuthTokenMutation } from "@parallel/graphql/__types";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { CopyToClipboardButton } from "../common/CopyToClipboardButton";

export function GenerateNewTokenDialog(props: DialogProps) {
  const intl = useIntl();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const {
    handleSubmit,
    register,
    formState: { errors },
    setError,
  } = useForm<{
    tokenName: string;
  }>({
    mode: "onChange",
    defaultValues: {
      tokenName: "",
    },
  });

  const [generateUserAuthToken, { loading }] =
    useGenerateNewTokenDialog_generateUserAuthTokenMutation();

  async function submit({ tokenName }: { tokenName: string }) {
    try {
      const { data } = await generateUserAuthToken({
        variables: { tokenName },
      });
      if (data) {
        setApiKey(data.generateUserAuthToken.apiKey);
      }
    } catch (e: any) {
      setError("tokenName", { type: "unavailable" });
    }
  }

  const tokenNameRef = useRef<HTMLInputElement>(null);
  const tokenNameRegisterProps = useRegisterWithRef(tokenNameRef, register, "tokenName", {
    required: true,
  });
  return (
    <ConfirmDialog
      size="lg"
      closeOnEsc={!apiKey}
      closeOnOverlayClick={!apiKey}
      initialFocusRef={tokenNameRef}
      content={{
        as: "form",
        onSubmit: handleSubmit(submit),
      }}
      header={
        <FormattedMessage
          id="component.generate-new-token-dialog.title"
          defaultMessage="Generate new token"
        />
      }
      body={
        apiKey ? (
          <Stack>
            <Text>
              <FormattedMessage
                id="component.generate-new-token-dialog.created-explanation"
                defaultMessage="Your access token is now created. Make sure to copy it as you won't be able to see it again."
              />
            </Text>
            <Stack direction="row">
              <Input
                isReadOnly
                value={apiKey}
                aria-label={intl.formatMessage({
                  id: "component.generate-new-token-dialog.api-key-label",
                  defaultMessage: "API token",
                })}
              />
              <CopyToClipboardButton size="md" text={apiKey} />
            </Stack>
          </Stack>
        ) : (
          <Stack>
            <Text>
              <FormattedMessage
                id="component.generate-new-token-dialog.explanation"
                defaultMessage="Please enter a unique identifying name for this access token."
              />
            </Text>
            <Text fontStyle="italic" fontSize="sm">
              <FormattedMessage
                id="component.generate-new-token-dialog.disclaimer"
                defaultMessage="You won't be able to change it after creating it."
              />
            </Text>
            <FormControl isInvalid={!!errors.tokenName}>
              <Input
                {...tokenNameRegisterProps}
                aria-label={intl.formatMessage({
                  id: "component.generate-new-token-dialog.token-name-label",
                  defaultMessage: "Token name",
                })}
                placeholder={intl.formatMessage({
                  id: "component.generate-new-token-dialog.token-name-label",
                  defaultMessage: "Token name",
                })}
              />
              <FormErrorMessage>
                {errors.tokenName?.type === "unavailable" ? (
                  <Text color="red.500" fontSize="sm">
                    <FormattedMessage
                      id="component.generate-new-token-dialog.token-name-used"
                      defaultMessage="You already have a token with this name"
                    />
                  </Text>
                ) : (
                  <FormattedMessage
                    id="component.generate-new-token-dialog.invalid-token-name-error"
                    defaultMessage="Please, enter a name for your token"
                  />
                )}
              </FormErrorMessage>
            </FormControl>
          </Stack>
        )
      }
      confirm={
        apiKey ? (
          <Button colorScheme="purple" onClick={() => props.onResolve()}>
            <FormattedMessage id="generic.continue" defaultMessage="Continue" />
          </Button>
        ) : (
          <Button colorScheme="purple" type="submit" isLoading={loading}>
            <FormattedMessage
              id="settings.api-tokens.generate-new-token"
              defaultMessage="Create token"
            />
          </Button>
        )
      }
      cancel={apiKey ? <></> : undefined}
      {...props}
    />
  );
}

GenerateNewTokenDialog.mutations = [
  gql`
    mutation GenerateNewTokenDialog_generateUserAuthToken($tokenName: String!) {
      generateUserAuthToken(tokenName: $tokenName) {
        apiKey
        userAuthToken {
          id
          tokenName
          createdAt
          lastUsedAt
        }
      }
    }
  `,
];

export function useGenerateNewTokenDialog() {
  return useDialog(GenerateNewTokenDialog);
}
