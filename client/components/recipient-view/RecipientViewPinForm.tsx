import { Button, Flex, HStack, Text } from "@parallel/components/ui";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { PinInput } from "../ui";

interface RecipientViewPinFormProps {
  onSubmit: (code: string) => void;
  isInvalid?: boolean;
  isLoading?: boolean;
  remainingAttempts?: number;
}

export function RecipientViewPinForm({
  onSubmit,
  isInvalid,
  isLoading,
  remainingAttempts,
}: RecipientViewPinFormProps) {
  const [code, setCode] = useState<string[]>([]);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isInvalid) {
      setCode([]);
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
        onSubmit(code.join(""));
      }}
      gridGap={4}
    >
      <HStack
        sx={{
          "> :not(style) ~ :not(style):nth-of-type(4)": {
            marginStart: 8,
          },
        }}
      >
        <PinInput.Root
          autoFocus
          value={code}
          onValueChange={(e) => setCode(e.value)}
          isInvalid={isInvalid}
        >
          {/* TODO: ChackraV3 Add control */}
          <PinInput.Input ref={firstInputRef} data-testid="pin-code-input" index={0} />
          <PinInput.Input index={1} />
          <PinInput.Input index={2} />
          <PinInput.Input index={3} />
          <PinInput.Input index={4} />
          <PinInput.Input index={5} />
        </PinInput.Root>
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
        colorPalette="primary"
        loading={isLoading}
        disabled={code.length < 6}
        marginTop={4}
        data-testid="pin-input-verify-button"
      >
        <FormattedMessage id="recipient-view.verify-button" defaultMessage="Verify code" />
      </Button>
    </Flex>
  );
}
