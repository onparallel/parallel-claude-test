import { Box, BoxProps, Heading, Image, Flex } from "@chakra-ui/core";
import { FormattedMessage, useIntl } from "react-intl";
import { PublicContainer } from "./layout/PublicContainer";

export type PublicHeroProps = BoxProps;

export function PublicHeroWhoTrustUs({ ...props }: PublicHeroProps) {
  return (
    <PublicContainer
      {...props}
      paddingY={16}
      wrapper={{
        textAlign: "center",
      }}
    >
      <Heading fontSize="3xl" fontWeight="light" color="purple.500">
        <FormattedMessage
          id="public.home.hero-who-trust-us"
          defaultMessage="Who trust us"
        ></FormattedMessage>
      </Heading>
      <Heading fontSize="xl" fontWeight="light" marginTop={4}>
        <FormattedMessage
          id="public.home.hero-leading-digital-transformation"
          defaultMessage="Leading digital transformation in their companies"
        ></FormattedMessage>
      </Heading>
      <Flex
        marginY={16}
        flexDirection={["column", "column", "initial"]}
        justifyContent="space-around"
      >
        <Image src="/static/images/logo1.png" />
        <Image src="/static/images/logo2.png" />
        <Image src="/static/images/logo3.png" />
        <Image src="/static/images/logo4.png" />
      </Flex>
    </PublicContainer>
  );
}
