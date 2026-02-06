import { Center, HStack, LinkBox, LinkOverlay, Stack } from "@chakra-ui/react";
import { ChevronRightIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { NakedLink } from "@parallel/components/common/Link";
import { Text } from "@parallel/components/ui";
import { ReactNode } from "react";
import { Card } from "../common/Card";

export interface IntegrationLinkCardProps {
  logo: ReactNode | null;
  title: string;
  body: string;
  badge?: ReactNode | null;
  isDisabled?: boolean;
  href: string;
  isExternal?: boolean;
}

export const IntegrationLinkCard = chakraForwardRef<"div", IntegrationLinkCardProps>(
  function IntegrationLinkCard(
    { logo, title, body, badge, isDisabled, href, isExternal, ...props },
    ref,
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
                  <NakedLink href={href}>
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
  },
);
