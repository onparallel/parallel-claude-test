import { Button, Flex, HStack, PinInput, PinInputField, Text } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";

type RecipientViewPinFormProps = {
  onSubmit: (code: string) => void;
  isInvalid?: boolean;
  isLoading?: boolean;
  remainingAttempts?: number;
};

export function RecipientViewPinForm({
  onSubmit,
  isInvalid,
  isLoading,
  remainingAttempts,
}: RecipientViewPinFormProps) {
  const [code, setCode] = useState("");
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isInvalid) {
      setCode("");
      firstInputRef.current!.focus();
    }
  }, [isInvalid]);

  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      as="form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(code);
      }}
      gridGap={4}
    >
      <HStack
        sx={{
          "> :not(style) ~ :not(style):nth-of-type(4)": {
            marginLeft: 8,
          },
        }}
      >
        <PinInput autoFocus value={code} onChange={setCode} isInvalid={isInvalid}>
          <PinInputField ref={firstInputRef} />
          <PinInputField />
          <PinInputField />
          <PinInputField />
          <PinInputField />
          <PinInputField />
        </PinInput>
      </HStack>
      {isInvalid ? (
        <Text color="red.500" fontSize="sm" marginTop={2}>
          <FormattedMessage
            id="recipient-view.remaining-attempts"
            defaultMessage="You have {attempts, plural, =1{one more attempt} other{# more attempts}}"
            values={{ attempts: remainingAttempts }}
          />
        </Text>
      ) : null}
      <Button
        type="submit"
        colorScheme="primary"
        isLoading={isLoading}
        isDisabled={code.length < 6}
        marginTop={4}
      >
        <FormattedMessage id="recipient-view.verify-button" defaultMessage="Verify code" />
      </Button>
    </Flex>
  );
}
