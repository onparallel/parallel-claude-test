import { Center, BoxProps, Grid, Heading, Image } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { NormalLink } from "../common/Link";
import { PublicContainer } from "./layout/PublicContainer";

export function PublicTrust(props: BoxProps) {
  return (
    <PublicContainer
      wrapper={{
        marginY: { base: 8, md: 12, lg: 20 },
        textAlign: "center",
        ...props,
      }}
    >
      <Heading as="h2" size="xl" fontWeight="bold" marginBottom={8}>
        <FormattedMessage
          id="public.who-trust-us.title"
          defaultMessage="Already trust us"
        />
      </Heading>
      <Grid
        alignItems="flex-end"
        justifyContent="space-evenly"
        templateColumns={{
          base: "minmax(auto, 320px)",
          md: "repeat(3, minmax(auto, 320px))",
        }}
        gridGap={8}
      >
        <Center>
          <NormalLink
            href="https://www.cuatrecasas.com"
            isExternal
            display="flex"
            justifyContent="center"
          >
            <Image
              alt="Cuatrecasas Acelera"
              width="220px"
              loading="lazy"
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/cuatrecasas.png`}
            />
          </NormalLink>
        </Center>
        <Center>
          <NormalLink
            href="https://es.andersen.com/"
            isExternal
            display="flex"
            justifyContent="center"
            marginBottom={{ md: "8px" }}
          >
            <Image
              alt="Andersen"
              width="180px"
              loading="lazy"
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/andersen.png`}
            />
          </NormalLink>
        </Center>
        <Center>
          <NormalLink href="https://prontopiso.com/" isExternal paddingY="13px">
            <Image
              alt="Prontopiso"
              width="200px"
              loading="lazy"
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/prontopiso.png`}
            />
          </NormalLink>
        </Center>
      </Grid>
    </PublicContainer>
  );
}
