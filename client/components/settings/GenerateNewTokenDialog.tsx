import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

export function GenerateNewTokenDialog(
  props: DialogProps<{ usedTokenNames: string[] }, string>
) {
  const { handleSubmit, register, errors } = useForm<{ tokenName: string }>({
    mode: "onChange",
    defaultValues: {
      tokenName: "",
    },
  });

  const tokenNameIsUnique = (value: string) => {
    return !props.usedTokenNames.includes(value.trim());
  };

  return (
    <ConfirmDialog
      content={{
        as: "form",
        onSubmit: handleSubmit(({ tokenName }) => props.onResolve(tokenName)),
      }}
      header={
        <FormattedMessage
          id="settings.api-tokens.generate-new-token"
          defaultMessage="Generate new token"
        />
      }
      body={
        <Stack>
          <FormControl isInvalid={!!errors.tokenName}>
            <FormLabel>
              <FormattedMessage
                id="settings.api-tokens.generate-new-token.input-label"
                defaultMessage="Token name"
              />
            </FormLabel>
            <Input
              name="tokenName"
              ref={register({
                required: true,
                validate: { tokenNameIsUnique },
              })}
            />
            <FormErrorMessage>
              {errors.tokenName?.type === "tokenNameIsUnique" ? (
                <Text color="red.500" fontSize="sm">
                  <FormattedMessage
                    id="generic.forms.token-name-already-used-error"
                    defaultMessage="You already have a token with this name"
                  />
                </Text>
              ) : (
                <FormattedMessage
                  id="generic.forms.invalid-token-name-error"
                  defaultMessage="Please, enter a name for your token"
                />
              )}
            </FormErrorMessage>
          </FormControl>
        </Stack>
      }
      confirm={
        <Button colorScheme="purple" type="submit">
          <FormattedMessage
            id="settings.api-tokens.generate-new-token"
            defaultMessage="Generate new token"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useGenerateNewTokenDialog() {
  return useDialog(GenerateNewTokenDialog);
}
