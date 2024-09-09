import { HStack, Text } from "@chakra-ui/react";
import { EyeIcon, EyeOffIcon } from "@parallel/chakra/icons";
import { CopyToClipboardButton } from "@parallel/components/common/CopyToClipboardButton";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

export function PetitionRepliesFieldFilePassword({ password }: { password: string }) {
  const intl = useIntl();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <HStack>
      <Text as="span" fontSize="sm" fontWeight={500} color="gray.600">
        <FormattedMessage
          id="component.petition-field-file-password.password"
          defaultMessage="Password: {password}"
          values={{
            password: (
              <Text
                as="span"
                fontFamily="monospace"
                fontSize="md"
                fontWeight={400}
                color="gray.800"
              >
                {showPassword ? password : "•".repeat(password.length)}
              </Text>
            ),
          }}
        />
      </Text>
      <CopyToClipboardButton size="xs" fontSize="md" text={password} />
      <IconButtonWithTooltip
        size="xs"
        fontSize="md"
        onClick={() => setShowPassword(!showPassword)}
        icon={showPassword ? <EyeIcon color="purple.500" /> : <EyeOffIcon />}
        label={
          showPassword
            ? intl.formatMessage({ id: "generic.hide", defaultMessage: "Hide" })
            : intl.formatMessage({ id: "generic.show", defaultMessage: "Show" })
        }
      />
    </HStack>
  );
}
