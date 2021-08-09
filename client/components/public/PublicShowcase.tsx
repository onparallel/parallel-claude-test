import { Box, Flex, Image, Stack, Text } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";

export interface PublicShowcaseProps {
  isReversed?: boolean;
  imageUrl: string;
  imageSize?: string;
  description?: string;
}

export const PublicShowcase = chakraForwardRef<"div", PublicShowcaseProps>(function PublicShowcase(
  { isReversed, imageUrl, imageSize = "250px", description, children, ...props },
  ref
) {
  return (
    <Stack
      as="section"
      ref={ref}
      alignItems="center"
      spacing={8}
      direction={{ base: "column", md: isReversed ? "row" : "row-reverse" }}
      {...props}
    >
      <Flex flex="1" justifyContent="center" direction="column">
        <Image
          src={imageUrl}
          loading="lazy"
          height={imageSize}
          role="presentation"
          objectFit="contain"
        />
        {description ? (
          <Text fontSize="sm" as="span" color="gray.700" textAlign="center">
            {description}
          </Text>
        ) : null}
      </Flex>
      <Box flex="1" justifyContent="center">
        {children}
      </Box>
    </Stack>
  );
});
