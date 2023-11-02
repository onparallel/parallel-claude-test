import { Box, BoxProps, HStack } from "@chakra-ui/react";
import { LinkedInIcon, TwitterIcon, YoutubeIcon } from "@parallel/chakra/icons";
import { NormalLink } from "@parallel/components/common/Link";
import { Logo } from "@parallel/components/common/Logo";
import { untranslated } from "@parallel/utils/untranslated";
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
        <Box as="a" href="/">
          <Logo width="152px" />
        </Box>
        <HStack spacing={6}>
          <NormalLink
            href="https://www.linkedin.com/company/onparallel"
            aria-label={untranslated("LinkedIn")}
            isExternal
            color="primary.800"
            _hover={{ color: "primary.500" }}
          >
            <LinkedInIcon role="presentation" boxSize={6} />
          </NormalLink>
          <NormalLink
            href="https://twitter.com/onparallelHQ"
            aria-label={untranslated("Twitter")}
            isExternal
            color="primary.800"
            _hover={{ color: "primary.500" }}
          >
            <TwitterIcon role="presentation" boxSize={5} />
          </NormalLink>

          <NormalLink
            href="https://www.youtube.com/channel/UCI0STY9hq6t2HB1MUeqcV-Q"
            aria-label={untranslated("Youtube")}
            isExternal
            color="primary.800"
            _hover={{ color: "primary.500" }}
          >
            <YoutubeIcon role="presentation" boxSize={6} />
          </NormalLink>
        </HStack>
      </HStack>
    </PublicContainer>
  );
}
