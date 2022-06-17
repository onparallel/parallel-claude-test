import { Box, BoxProps, HStack } from "@chakra-ui/react";
import { FacebookIcon, LinkedInIcon, TwitterIcon, YoutubeIcon } from "@parallel/chakra/icons";
import { NakedLink, NormalLink } from "@parallel/components/common/Link";
import { Logo } from "@parallel/components/common/Logo";
import { PublicContainer } from "./PublicContainer";

export function PublicFooter(props: BoxProps) {
  return (
    <PublicContainer
      wrapper={{
        as: "footer",
        backgroundColor: "#EEF2F7",
        paddingTop: 24,
        paddingBottom: 14,
        ...props,
      }}
    >
      <HStack justifyContent="space-between" paddingX={{ base: 2, md: 4 }}>
        <NakedLink href="/">
          <Box as="a">
            <Logo width="152px" />
          </Box>
        </NakedLink>
        <HStack spacing={6}>
          <NormalLink
            href="https://www.facebook.com/parallel.so/"
            aria-label="Twitter"
            isExternal
            color="purple.800"
            _hover={{ color: "purple.500" }}
          >
            <FacebookIcon role="presentation" boxSize={6} />
          </NormalLink>
          <NormalLink
            href="https://www.linkedin.com/company/onparallel"
            aria-label="LinkedIn"
            isExternal
            color="purple.800"
            _hover={{ color: "purple.500" }}
          >
            <LinkedInIcon role="presentation" boxSize={6} />
          </NormalLink>
          <NormalLink
            href="https://twitter.com/Parallel_SO"
            aria-label="Twitter"
            isExternal
            color="purple.800"
            _hover={{ color: "purple.500" }}
          >
            <TwitterIcon role="presentation" boxSize={6} />
          </NormalLink>

          <NormalLink
            href="https://www.youtube.com/channel/UCI0STY9hq6t2HB1MUeqcV-Q"
            aria-label="Twitter"
            isExternal
            color="purple.800"
            _hover={{ color: "purple.500" }}
          >
            <YoutubeIcon role="presentation" boxSize={6} />
          </NormalLink>
        </HStack>
      </HStack>
    </PublicContainer>
  );
}
