import {
  Box,
  BoxProps,
  Button,
  Flex,
  Heading,
  Image,
  Text,
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
              defaultMessage="Collect information in a simple and efficient way"
            ></FormattedMessage>
          </Heading>
          <Text marginTop={8}>
            <FormattedMessage
              id="public.home.hero-platform"
              defaultMessage="Our platform collects the information from your clients and allows you to focus on value adding tasks."
            ></FormattedMessage>
          </Text>
          <Box marginTop={10} textAlign="center">
            <Button
              as="a"
              {...{ href: "https://parallelso.typeform.com/to/Rd29bQ" }}
              variantColor="purple"
            >
              <FormattedMessage
                id="public.bookdemo-button"
                defaultMessage="Book a demo"
              ></FormattedMessage>
            </Button>
          </Box>
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
