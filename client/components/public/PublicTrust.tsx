import { BoxProps, Center, Grid, Heading, Image } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { NormalLink } from "../common/Link";
import { PublicContainer } from "./layout/PublicContainer";

export function PublicTrust(props: BoxProps) {
  return (
    <PublicContainer
      wrapper={{
        marginY: { base: 8, md: 12, lg: 20 },

        ...props,
      }}
    >
      <Heading as="h2" size="xl" fontWeight="bold" marginBottom={8} textAlign="center">
        <FormattedMessage id="public.who-trust-us.title" defaultMessage="Already trust us" />
      </Heading>
      <Grid
        alignItems="center"
        justifyContent="space-evenly"
        templateColumns={{
          base: "repeat(2, minmax(auto, 320px))",
          md: "repeat(3, minmax(auto, 320px))",
          lg: "repeat(6, minmax(auto, 320px))",
        }}
        gridGap={10}
      >
        <Center>
          <NormalLink href="https://www.cuatrecasas.com" isExternal>
            <Image
              alt="Cuatrecasas Acelera"
              width="220px"
              loading="lazy"
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/cuatrecasas_black.png`}
            />
          </NormalLink>
        </Center>
        <Center>
          <NormalLink href="https://es.andersen.com/" isExternal marginBottom={{ md: "8px" }}>
            <Image
              alt="Andersen"
              width="180px"
              loading="lazy"
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/andersen_black.png`}
            />
          </NormalLink>
        </Center>
        <Center>
          <NormalLink href="https://prontopiso.com/" isExternal paddingY="13px">
            <Image
              alt="Action"
              width="200px"
              loading="lazy"
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/aktion_black.png`}
            />
          </NormalLink>
        </Center>
        <Center>
          <NormalLink href="https://prontopiso.com/" isExternal paddingY="13px">
            <Image
              alt="Tecnotramit"
              width="200px"
              loading="lazy"
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/tecnotramit_black.png`}
            />
          </NormalLink>
        </Center>
        <Center>
          <NormalLink href="https://prontopiso.com/" isExternal paddingY="13px">
            <Image
              alt="Exp"
              width="200px"
              loading="lazy"
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/exp_black.png`}
            />
          </NormalLink>
        </Center>
        <Center>
          <NormalLink href="https://prontopiso.com/" isExternal paddingY="13px">
            <Image
              alt="Sequra"
              width="200px"
              loading="lazy"
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/sequra_black.png`}
            />
          </NormalLink>
        </Center>
      </Grid>
    </PublicContainer>
  );
}
