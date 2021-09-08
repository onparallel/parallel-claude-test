import { Box, SimpleGrid, Text } from "@chakra-ui/react";
import { useMemo } from "react";
import { FormattedMessage } from "react-intl";

export const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const strength = useMemo(() => {
    const PSW_REGEX = [/\d/, /[a-z]/, /[A-Z]/, /^.{8,}$/]; // Min 1 uppercase, lowercase, number and 8 chars splited to validate strength
    return PSW_REGEX.reduce((acc, re) => acc + (re.test(password) ? 1 : 0), 0);
  }, [password]);

  return (
    <>
      <SimpleGrid columns={4} gap={2} mt={2} mb={1.5} height={1}>
        <Box rounded="sm" backgroundColor={strength ? "green.500" : "gray.200"} />
        <Box rounded="sm" backgroundColor={strength >= 2 ? "green.500" : "gray.200"} />
        <Box rounded="sm" backgroundColor={strength >= 3 ? "green.500" : "gray.200"} />
        <Box rounded="sm" backgroundColor={strength === 4 ? "green.500" : "gray.200"} />
      </SimpleGrid>
      <Text textStyle="muted" fontSize="sm">
        <FormattedMessage
          id="component.public-signup-form.password-requirements"
          defaultMessage="Use 8 or more characters with uppercase, lowercase and numbers."
        />
      </Text>
    </>
  );
};
