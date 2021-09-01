import { Progress, SimpleGrid, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { UseFormWatch } from "react-hook-form";
import { FormattedMessage } from "react-intl";

export const PasswordStrengthIndicator = ({ watch }: { watch: UseFormWatch<any> }) => {
  const password = watch("password");
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
      <SimpleGrid columns={4} gap={2} mt={2} mb={1.5}>
        <Progress value={strength >= 1 ? 100 : 0} colorScheme="green" size="xs" rounded="sm" />
        <Progress value={strength >= 2 ? 100 : 0} colorScheme="green" size="xs" rounded="sm" />
        <Progress value={strength >= 3 ? 100 : 0} colorScheme="green" size="xs" rounded="sm" />
        <Progress value={strength === 4 ? 100 : 0} colorScheme="green" size="xs" rounded="sm" />
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
