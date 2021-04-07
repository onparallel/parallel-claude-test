import { Box, BoxProps, Center, Grid, Heading, Text } from "@chakra-ui/react";
import { PropsWithChildren, ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { PublicContainer } from "./layout/PublicContainer";

export function PublicFigures(props: BoxProps) {
  return (
    <PublicContainer
      {...props}
      wrapper={{
        paddingY: 16,
        textAlign: "center",
        backgroundColor: "white",
      }}
    >
      <Heading as="h2" size="xl" fontWeight="bold">
        <FormattedMessage
          id="public.figures.title"
          defaultMessage="Figures that support us"
        />
      </Heading>
      <Center>
        <Grid
          width="90%"
          marginTop={16}
          justifyContent="space-evenly"
          gridGap={16}
          templateColumns={{
            base: "1fr",
            md: "repeat(3, 1fr)",
          }}
        >
          <Feature>
            <FormattedMessage
              id="public.figures.time-saving"
              defaultMessage="<b>{value, number, ::percent}</b> saving in working time"
              values={{
                value: 0.75,
                b: (chunks: any) => <FeatureStrong>{chunks}</FeatureStrong>,
              }}
            />
          </Feature>
          <Feature>
            <FormattedMessage
              id="public.figures.reduce-emails"
              defaultMessage="<b>{value, number, ::percent}</b> reduction of unnecessary communications"
              values={{
                value: 0.98,
                b: (chunks: any) => <FeatureStrong>{chunks}</FeatureStrong>,
              }}
            />
          </Feature>
          <Feature>
            <FormattedMessage
              id="public.figures.close-projects"
              defaultMessage="<b>x{value, number}</b> acceleration of project completion"
              values={{
                value: 3.7,
                b: (chunks: any) => <FeatureStrong>{chunks}</FeatureStrong>,
              }}
            />
          </Feature>
        </Grid>
      </Center>
    </PublicContainer>
  );
}

function FeatureStrong({ children }: PropsWithChildren<{}>) {
  return (
    <Text as="strong" display="block" fontSize={40} color="purple.500">
      {children}
    </Text>
  );
}

function Feature({ children }: PropsWithChildren<{}>) {
  return (
    <Box
      padding={5}
      textAlign="left"
      borderRadius="lg"
      backgroundColor="gray.50"
    >
      {children}
    </Box>
  );
}
