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

          <Stack spacing={4} direction="row" marginTop={8}>
            <Button
              as="a"
              {...{ href: "https://parallelso.typeform.com/to/XxE7IY" }}
              variantColor="purple"
            >
              <FormattedMessage
                id="public.invite-button"
                defaultMessage="Try Parallel free"
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
