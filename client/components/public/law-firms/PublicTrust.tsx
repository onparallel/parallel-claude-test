import { Center, BoxProps, Grid, Heading, Image } from "@chakra-ui/react";
import { NormalLink } from "@parallel/components/common/Link";
import { FormattedMessage } from "react-intl";
import { PublicContainer } from "../layout/PublicContainer";

export function PublicTrust(props: BoxProps) {
  return (
    <PublicContainer
      wrapper={{
        marginY: { base: 8, md: 12, lg: 20 },
        ...props,
      }}
    >
      <Heading
        as="h2"
        size="xl"
        fontWeight="bold"
        marginBottom={8}
        textAlign="center"
      >
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
          <NormalLink href="https://www.cuatrecasas.com" isExternal>
            <Image
              alt="Cuatrecasas Acelera"
              width="220px"
              loading="lazy"
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/cuatrecasas_black.svg`}
            />
          </NormalLink>
        </Center>
        <Center>
          <NormalLink
            href="https://es.andersen.com/"
            isExternal
            marginBottom={{ md: "8px" }}
          >
            <Image
              alt="Andersen"
              width="180px"
              loading="lazy"
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/andersen_black.svg`}
            />
          </NormalLink>
        </Center>
        <Center>
          <NormalLink
            href="https://www.gestoriapons.com/"
            isExternal
            paddingY="13px"
          >
            <Image
              alt="Gestoría Pons"
              width="200px"
              loading="lazy"
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/logos/pons_black.svg`}
            />
          </NormalLink>
        </Center>
      </Grid>
    </PublicContainer>
  );
}
