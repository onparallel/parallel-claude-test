import { Box, BoxProps, Center, Grid, Heading, Text } from "@chakra-ui/react";
import { ReactNode } from "react";
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
          <Feature
            header="75%"
            description={
              <FormattedMessage
                id="public.figures.time-saving"
                defaultMessage="saving in working time"
              />
            }
          />
          <Feature
            header="98%"
            description={
              <FormattedMessage
                id="public.figures.reduce-emails"
                defaultMessage="reduction of unnecessary communications"
              />
            }
          />
          <Feature
            header={
              <FormattedMessage
                id="public.figures.three-times"
                defaultMessage="x3.7"
              />
            }
            description={
              <FormattedMessage
                id="public.figures.close-projects"
                defaultMessage="acceleration of project completion"
              />
            }
          />
        </Grid>
      </Center>
    </PublicContainer>
  );
}

interface FeatureProps extends BoxProps {
  header: ReactNode;
  description: ReactNode;
}

function Feature({ header, description, ...props }: FeatureProps) {
  return (
    <Box
      padding={5}
      textAlign="left"
      borderRadius="lg"
      backgroundColor="gray.50"
      {...props}
    >
      <Heading as="h4" marginTop={2} size="2xl" textColor="#6059F7">
        {header}
      </Heading>
      <Text marginTop={2} fontSize="md">
        {description}
      </Text>
    </Box>
  );
}
