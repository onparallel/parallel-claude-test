import { Box, BoxProps, Flex, Heading, Image } from "@chakra-ui/core";
import { FormattedMessage, useIntl } from "react-intl";
import { NormalLink } from "../common/Link";
import { PublicContainer } from "./layout/PublicContainer";

export function PublicTrust(props: BoxProps) {
  const intl = useIntl();

  return (
    <PublicContainer
      wrapper={{
        marginY: { base: 8, md: 12, lg: 20 },
        textAlign: "left",
        ...props,
      }}
    >
      <Heading as="h2" size="xl" fontWeight="bold" marginBottom={8}>
        <FormattedMessage
          id="public.who-trust-us.title"
          defaultMessage="Who trust us"
        />
      </Heading>
      <Flex justifyContent="center">
        <NormalLink href="https://acelera.cuatrecasas.com/" isExternal>
          <Image
            alt={intl.formatMessage({
              id: "public.trust.cuatrecasas",
              defaultMessage: "Cuatrecasas Acelera",
            })}
            width="250px"
            src="/static/images/cuatrecasas-acelera.png"
          />
        </NormalLink>
      </Flex>
    </PublicContainer>
  );
}
