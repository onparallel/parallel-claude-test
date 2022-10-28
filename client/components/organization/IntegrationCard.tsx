import { Center, HStack, LinkBox, LinkOverlay, Stack, Text } from "@chakra-ui/react";
import { ChevronRightIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { NakedLink } from "@parallel/components/common/Link";
import { ReactNode } from "react";
import { Card } from "../common/Card";

interface IntegrationCardProps {
  logo: ReactNode | null;
  title: string;
  body: string;
  badge?: ReactNode | null;
  isDisabled?: boolean;
  href: string;
  isExternal?: boolean;
}

export const IntegrationCard = chakraForwardRef<"div", IntegrationCardProps>(
  function IntegrationCard(
    { logo, title, body, badge, isDisabled, href, isExternal, ...props },
    ref
  ) {
    return (
      <LinkBox
        ref={ref}
        as={Card}
        isInteractive
        paddingX={6}
        paddingY={4}
        isDisabled={isDisabled}
        {...props}
      >
        <HStack spacing={6}>
          <Stack direction={{ base: "column", md: "row" }} flex="1" spacing={{ base: 4, md: 6 }}>
            <Center width={{ base: "auto", md: "120px" }}>{logo}</Center>
            <Stack flex="1">
              <HStack>
                {isDisabled ? (
                  <Text fontSize="xl" as="h3" fontWeight="bold">
                    {title}
                  </Text>
                ) : (
                  <NakedLink passHref href={href}>
                    <LinkOverlay isExternal={isExternal}>
                      <Text fontSize="xl" as="h3" fontWeight="bold">
                        {title}
                      </Text>
                    </LinkOverlay>
                  </NakedLink>
                )}
                {badge}
              </HStack>
              <Text color="gray.600">{body}</Text>
            </Stack>
          </Stack>
          <Center>
            <ChevronRightIcon boxSize={8} />
          </Center>
        </HStack>
      </LinkBox>
    );
  }
);
