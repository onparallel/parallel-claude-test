import {
  Box,
  BoxProps,
  Button,
  Flex,
  Heading,
  Image,
  Stack,
  Text,
} from "@chakra-ui/core";
import { NakedLink } from "@parallel/components/common/Link";
import { FormattedMessage } from "react-intl";
import { PublicContainer } from "./layout/PublicContainer";

export type PublicHeroProps = BoxProps;

export function PublicHeroPC({ ...props }: PublicHeroProps) {
  return (
    <PublicContainer
      {...props}
      wrapper={{
        marginY: 24,
        minHeight: { md: "500px" },
      }}
    >
      <Flex>
        <Box flex="2">
          <Heading as="h1" fontFamily="hero" fontSize="5xl" fontWeight="light">
            <FormattedMessage
              id="public.home.hero-collect"
              defaultMessage="Automate your information collection processes and save time."
            ></FormattedMessage>
          </Heading>
          <Text marginTop={8}>
            <FormattedMessage
              id="public.home.hero-platform"
              defaultMessage="Parallel is a platform for busy professionals. We collect all the documentation from your client for you safely and quickly."
            ></FormattedMessage>
          </Text>
          <Text>
            <FormattedMessage
              id="public.home.hero-digital-transformation"
              defaultMessage="Begin your digital transformation!"
            ></FormattedMessage>
          </Text>
          <Box marginTop={8}>
            <NakedLink href="/invite">
              <Button as="a" variantColor="purple" marginRight={4}>
                <FormattedMessage
                  id="public.invite-button"
                  defaultMessage="Try Parallel free"
                ></FormattedMessage>
              </Button>
            </NakedLink>
            <NakedLink href="/book-demo">
              <Button as="a" variant="outline">
                <FormattedMessage
                  id="public.book-demo-button"
                  defaultMessage="Book a demo"
                ></FormattedMessage>
              </Button>
            </NakedLink>
          </Box>
          <Text marginTop={8}>
            <FormattedMessage
              id="public.home.hero-try-now"
              defaultMessage="Try it now and let Parallel work for you"
            ></FormattedMessage>
          </Text>
        </Box>
        <Box flex="2" marginLeft={12} display={{ base: "none", md: "flex" }}>
          <Image
            margin="auto"
            src="/static/images/demo-on-pc.svg"
            role="presentation"
          />
        </Box>
      </Flex>
    </PublicContainer>
  );
}
