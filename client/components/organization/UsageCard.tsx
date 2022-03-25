import { Flex, HStack, Progress, Stack, Text, VisuallyHidden } from "@chakra-ui/react";
import { FormattedMessage, FormattedNumber } from "react-intl";

export function UsageCard({
  title,
  limit,
  usage,
}: {
  title: string;
  limit: number;
  usage: number;
}) {
  return (
    <Flex direction="column" shadow="md" rounded="md" overflow="hidden" background="white">
      <Stack as="dl" padding={4} margin={0}>
        <Text as="dt" fontSize="sm" fontWeight="medium" color="gay.500">
          {title}
        </Text>
        <HStack as="dd" align="center" fontWeight="bold">
          <Text as="span" fontSize="2xl">
            <FormattedNumber value={usage} />
          </Text>
          <HStack align="center" color="gray.500" fontWeight="semibold">
            <Text as="span" aria-hidden="true">
              /
            </Text>
            <VisuallyHidden>
              <FormattedMessage
                id="organization-usage.visually-hidden.out-of"
                defaultMessage="out of"
              />
            </VisuallyHidden>
            <Text as="span">
              <FormattedNumber value={limit} />
            </Text>
          </HStack>
        </HStack>
      </Stack>
      <Progress height="0.3rem" value={(usage / limit) * 100} />
    </Flex>
  );
}
