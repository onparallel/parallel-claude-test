import { Box, SimpleGrid, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";

export const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const [strength, setStrength] = useState(0);

  const PSW_REGEX = [".*[0-9].*", "^(?=.*[a-z]).{1,}$", "^(?=.*[A-Z]).{1,}$", "^.{8,}$"]; // Min 1 uppercase, lowercase, number and 8 chars splited to validate strength

  useEffect(() => {
    const res = PSW_REGEX.reduce((acc, value) => {
      const re = new RegExp(value);
      const test = re.test(password);
      return acc + Number(test);
    }, 0);
    setStrength(res);
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
