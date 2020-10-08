import { Box, BoxProps, Heading, Image, Link } from "@chakra-ui/core";
import { FormattedMessage, useIntl } from "react-intl";
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
      <Heading as="h2" size="xl" fontWeight="bold">
        <FormattedMessage
          id="public.who-trust-us.title"
          defaultMessage="Who trust us"
        />
      </Heading>
      <Box margin="auto" marginTop={{ base: 8, md: 8 }}>
        <Link href="https://acelera.cuatrecasas.com/">
          <Image
            alt={intl.formatMessage({
              id: "public.trust.cuatrecasas",
              defaultMessage: "Cuatrecasas Acelera",
            })}
            margin="auto"
            width="250px"
            src="/static/images/cuatrecasas-acelera.png"
          />
        </Link>
      </Box>
    </PublicContainer>
  );
}
