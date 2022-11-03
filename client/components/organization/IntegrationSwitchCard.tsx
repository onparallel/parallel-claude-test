import { Center, HStack, Stack, Switch, Text } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { ReactNode } from "react";
import { Card } from "../common/Card";

export interface IntegrationSwitchCardProps {
  logo: ReactNode | null;
  title: string;
  body: string;
  badge?: ReactNode | null;
  isChecked?: boolean;
  isDisabled?: boolean;
  onChange?: (isChecked: boolean) => void;
}

export const IntegrationSwitchCard = chakraForwardRef<"div", IntegrationSwitchCardProps>(
  function IntegrationSwitchCard(
    { logo, title, body, badge, isDisabled, isChecked, onChange, ...props },
    ref
  ) {
    return (
      <Card ref={ref} paddingX={6} paddingY={4} {...props}>
        <HStack spacing={6}>
          <Stack direction={{ base: "column", md: "row" }} flex="1" spacing={{ base: 4, md: 6 }}>
            <Center width={{ base: "auto", md: "120px" }}>{logo}</Center>
            <Stack flex="1">
              <HStack>
                <Text fontSize="xl" as="h3" fontWeight="bold">
                  {title}
                </Text>
                {badge}
              </HStack>
              <Text color="gray.600">{body}</Text>
            </Stack>
          </Stack>
          <Center>
            <Switch
              isChecked={isChecked}
              isDisabled={isDisabled}
              onChange={(event) => onChange?.(event.target.checked)}
            />
          </Center>
        </HStack>
      </Card>
    );
  }
);
