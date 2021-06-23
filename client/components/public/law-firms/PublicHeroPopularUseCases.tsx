import { Box, BoxProps, Grid, Heading, Text, Image } from "@chakra-ui/react";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { PublicContainer } from "../layout/PublicContainer";

export function PublicHeroPopularUseCases(props: BoxProps) {
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
          id="public.solutions-law-firms.title"
          defaultMessage="Solutions for law firms"
        />
      </Heading>
      <Grid
        marginTop={12}
        justifyContent="space-evenly"
        gridGap={6}
        templateColumns={{
          base: "1fr",
          md: "repeat(2, 1fr)",
          lg: "repeat(3, 1fr)",
        }}
      >
        <Feature
          image={
            <Image
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/law_smart_forms.svg`}
            />
          }
          header={
            <FormattedMessage
              id="public.law-use-cases.smart-forms-title"
              defaultMessage="Smart forms"
            />
          }
          description={
            <FormattedMessage
              id="public.law-use-cases.smart-forms-description"
              defaultMessage="Use conditions to set up smart decisions and ensure that your clients responds only to what is needed."
            />
          }
        />
        <Feature
          image={
            <Image
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/law_esignature.svg`}
            />
          }
          header={
            <FormattedMessage
              id="public.law-use-cases.esignature-title"
              defaultMessage="eSignature integration"
            />
          }
          description={
            <FormattedMessage
              id="public.law-use-cases.esignature-description"
              defaultMessage="Enable easily an advance eSignature to your proccess, completely secure and legally valid.."
            />
          }
        />
        <Feature
          image={
            <Image
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/law_colaborate.svg`}
            />
          }
          header={
            <FormattedMessage
              id="public.law-use-cases.colaborate-title"
              defaultMessage="Colaborate with your team"
            />
          }
          description={
            <FormattedMessage
              id="public.law-use-cases.colaborate-description"
              defaultMessage="Share your cases with your colleagues to work efficiently."
            />
          }
        />
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
      <Heading as="h4" marginTop={4} size="sm">
        {header}
      </Heading>
      <Text marginTop={2} fontSize="md">
        {description}
      </Text>
    </Box>
  );
}
