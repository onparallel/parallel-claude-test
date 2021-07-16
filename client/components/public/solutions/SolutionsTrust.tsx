import { BoxProps, Center, Grid, Heading, Image } from "@chakra-ui/react";
import { NormalLink } from "@parallel/components/common/Link";
import { FormattedMessage } from "react-intl";
import { PublicContainer } from "../layout/PublicContainer";

interface SolutionsTrust extends BoxProps {
  logos: LogoProps[];
}

export function SolutionsTrust({ logos, ...props }: SolutionsTrust) {
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
        alignItems="center"
        justifyContent="center"
        templateColumns={{
          base: "minmax(auto, 320px)",
          md: `repeat(${logos.length}, minmax(auto, 320px))`,
        }}
        gridGap={8}
      >
        {logos.map((logo, index) => (
          <Logo key={index} {...logo} />
        ))}
      </Grid>
    </PublicContainer>
  );
}

type LogoProps = {
  src: string;
  alt: string;
  href: string;
};

function Logo({ src, alt, href }: LogoProps) {
  return (
    <Center>
      <NormalLink href={href} isExternal>
        <Image alt={alt} loading="lazy" src={src} />
      </NormalLink>
    </Center>
  );
}
