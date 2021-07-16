import { Box, BoxProps, Grid, Heading, Text } from "@chakra-ui/react";
import { ReactNode } from "react";
import { PublicContainer } from "../layout/PublicContainer";

interface SolutionsPopularUseCasesProps extends BoxProps {
  heading: ReactNode;
  features: FeatureProps[];
}

export function SolutionsPopularUseCases({
  heading,
  features,
  ...props
}: SolutionsPopularUseCasesProps) {
  return (
    <PublicContainer
      wrapper={{
        paddingY: 16,
        textAlign: "center",
        backgroundColor: "white",
      }}
      maxWidth="container.xl"
      {...props}
    >
      <Heading as="h2" size="xl" fontWeight="bold">
        {heading}
      </Heading>
      <Grid
        marginTop={14}
        justifyContent="space-evenly"
        gridGap={6}
        templateColumns={{
          base: "1fr",
          md: "repeat(2, 1fr)",
          lg: "repeat(3, 1fr)",
        }}
      >
        {features?.map((feature, index) => {
          return <Feature key={index} {...feature} />;
        })}
      </Grid>
    </PublicContainer>
  );
}

interface FeatureProps extends BoxProps {
  image: ReactNode;
  header: ReactNode;
  description: ReactNode;
}

function Feature({ image, header, description, ...props }: FeatureProps) {
  return (
    <Box padding={5} textAlign="left" {...props}>
      {image}
      <Heading as="h4" marginTop={4} size="lg">
        {header}
      </Heading>
      <Text marginTop={2} fontSize="md">
        {description}
      </Text>
    </Box>
  );
}
