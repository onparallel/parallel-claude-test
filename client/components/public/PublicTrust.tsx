import { BoxProps, Grid, Heading, Image } from "@chakra-ui/core";
import { useRouter } from "next/router";
import { FormattedMessage } from "react-intl";
import { NormalLink } from "../common/Link";
import { PublicContainer } from "./layout/PublicContainer";

export function PublicTrust(props: BoxProps) {
  const { query } = useRouter();
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
      <Grid
        alignItems="center"
        justifyContent="space-evenly"
        templateColumns={{
          base: "minmax(auto, 320px)",
          md: "repeat(2, minmax(auto, 320px))",
        }}
        gridGap={4}
      >
        <NormalLink href="https://acelera.cuatrecasas.com/" isExternal>
          <Image
            alt="Cuatrecasas Acelera"
            width="250px"
            loading="lazy"
            src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/cuatrecasas-acelera.png`}
          />
        </NormalLink>
        <NormalLink href="https://www.enisa.es/" isExternal>
          <Image
            alt="Enisa"
            width="120px"
            loading="lazy"
            src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/enisa_${query.locale}.png`}
          />
        </NormalLink>
      </Grid>
    </PublicContainer>
  );
}
