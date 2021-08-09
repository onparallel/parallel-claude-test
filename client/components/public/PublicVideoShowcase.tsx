import { Box, Flex, Stack } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";

export interface PublicVideoShowcaseProps {
  isReversed?: boolean;
  videoSources: { type: string; src: string }[];
  videoSize?: string;
}

export const PublicVideoShowcase = chakraForwardRef<"div", PublicVideoShowcaseProps>(
  function PublicVideoShowcase({ isReversed, videoSources, videoSize, children, ...props }, ref) {
    return (
      <Stack
        as="section"
        ref={ref}
        alignItems="center"
        spacing={8}
        direction={{ base: "column", md: isReversed ? "row" : "row-reverse" }}
        {...props}
      >
        <Flex flex="1" justifyContent="center">
          <Box as="video" height={videoSize} playsInline loop muted autoPlay role="presentation">
            {videoSources.map(({ src, type }) => (
              <source key={type} src={src} type={type} />
            ))}
          </Box>
        </Flex>
        <Box flex="1" justifyContent="center">
          {children}
        </Box>
      </Stack>
    );
  }
);
