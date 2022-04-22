import { Center, HStack, LinkBox, LinkOverlay, Stack, StackProps, Text } from "@chakra-ui/react";
import { ChevronRightIcon } from "@parallel/chakra/icons";
import { NakedLink } from "@parallel/components/common/Link";
import { ReactNode } from "react";

interface IntegrationCardProps extends StackProps {
  logo: ReactNode | null;
  title: string;
  body: string;
  badge: ReactNode | null;
  isDisabled: boolean;
  showButton: boolean;
  route: string;
  isExternal?: boolean;
}

export function IntegrationCard({
  logo,
  title,
  body,
  badge,
  isDisabled,
  showButton,
  route,
  isExternal,
  ...props
}: IntegrationCardProps) {
  const titleElement = isDisabled ? (
    <Text fontSize="xl" as="h3" fontWeight="bold">
      {title}
    </Text>
  ) : (
    <NakedLink passHref href={route}>
      <LinkOverlay isExternal={isExternal}>
        <Text fontSize="xl" as="h3" fontWeight="bold">
          {title}
        </Text>
      </LinkOverlay>
    </NakedLink>
  );

  return (
    <LinkBox
      as={HStack}
      position="relative"
      width="100%"
      backgroundColor="white"
      rounded="lg"
      shadow="short"
      paddingX={6}
      paddingY={4}
      border="1px solid"
      borderColor={isDisabled ? "gray.100" : "gray.200"}
      cursor={isDisabled ? "not-allowed" : "pointer"}
      transition="all 0.3s ease"
      sx={{
        " > * ": {
          opacity: isDisabled ? 0.4 : 1,
        },
        _hover: isDisabled
          ? {}
          : {
              boxShadow: "long",
              backgroundColor: "gray.50",
            },
      }}
      {...props}
    >
      <Stack direction={{ base: "column", md: "row" }} flex="1" spacing={6}>
        <Center>{logo}</Center>
        <Stack flex="1" paddingRight={10}>
          <HStack>
            {titleElement}
            {badge}
          </HStack>
          <Text color="gray.600">{body}</Text>
        </Stack>
      </Stack>
      {showButton ? (
        <Center position="absolute" right="0" paddingRight={5} pointerEvents="none">
          <ChevronRightIcon boxSize={8} />
        </Center>
      ) : null}
    </LinkBox>
  );
}
