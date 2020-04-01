import {
  Box,
  BoxProps,
  Button,
  Flex,
  Heading,
  Image,
  Text,
  Stack,
} from "@chakra-ui/core";
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
          <Heading fontFamily="hero" fontSize="5xl" fontWeight="light">
            <FormattedMessage
              id="public.home.hero-collect"
              defaultMessage="Automate your information collection processes and save time"
            ></FormattedMessage>
          </Heading>
          <Text marginTop={8}>
            <FormattedMessage
              id="public.home.hero-platform"
              defaultMessage="Parallel is a platform for medium and small companies. We collect all the documentation from your client for you safely and quickly. Begin your digital transformation!"
            ></FormattedMessage>
          </Text>
          <Text marginTop={8}>
            <FormattedMessage
              id="public.home.hero-start-free"
              defaultMessage="Get started for free and spend your time on tasks that really matter."
            ></FormattedMessage>
          </Text>
          <Stack spacing={4} direction="row" marginTop={10}>
            <Button
              as="a"
              {...{ href: "https://parallelso.typeform.com/to/Rd29bQ" }}
              variantColor="purple"
            >
              <FormattedMessage
                id="public.invite-button"
                defaultMessage="Request an invite"
              ></FormattedMessage>
            </Button>
            <Button
              as="a"
              {...{ href: "https://parallelso.typeform.com/to/Rd29bQ" }}
              variant="outline"
            >
              <FormattedMessage
                id="public.bookdemo-button"
                defaultMessage="Book a demo"
              ></FormattedMessage>
            </Button>
          </Stack>
        </Box>
        <Box flex="2" marginLeft={12} display={{ base: "none", md: "block" }}>
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
