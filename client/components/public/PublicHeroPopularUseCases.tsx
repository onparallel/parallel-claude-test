import { Box, Center, BoxProps, Button, Flex, Grid, Heading, Text, Image } from "@chakra-ui/react";
import { NakedLink } from "@parallel/components/common/Link";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { PublicContainer } from "./layout/PublicContainer";
import { AddIcon } from "@parallel/chakra/icons";

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
          id="public.parallel-use-cases.title"
          defaultMessage="What Parallel can do for you"
        />
      </Heading>
      <Heading as="h3" size="md" fontWeight="light" marginTop={4}>
        <FormattedMessage
          id="public.parallel-use-cases.subtitle"
          defaultMessage="We are a flexible tool able to solve complex processes"
        />
      </Heading>
      <Grid
        marginTop={16}
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
            <Image src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/use-case-aml.svg`} />
          }
          header={
            <FormattedMessage
              id="public.parallel-use-cases.aml-title"
              defaultMessage="Anti Money Laundering"
            />
          }
          description={
            <FormattedMessage
              id="public.parallel-use-cases.aml-description"
              defaultMessage="Close your know your customers processes faster."
            />
          }
        />
        <Feature
          image={
            <Image src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/use-case-tax.svg`} />
          }
          header={
            <FormattedMessage id="public.parallel-use-cases.tax-title" defaultMessage="Tax" />
          }
          description={
            <FormattedMessage
              id="public.parallel-use-cases.tax-description"
              defaultMessage="Manage the documents of your tax returns campaigns."
            />
          }
        />
        <Feature
          image={
            <Image
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/use-case-real-estate.svg`}
            />
          }
          header={
            <FormattedMessage
              id="public.parallel-use-cases.real-estate-title"
              defaultMessage="Real Estate"
            />
          }
          description={
            <FormattedMessage
              id="public.parallel-use-cases.real-estate-description"
              defaultMessage="Obtain the documents to close real estate transactions faster."
            />
          }
        />
        <Feature
          image={
            <Image
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/use-case-corporate.svg`}
            />
          }
          header={
            <FormattedMessage
              id="public.parallel-use-cases.corporate-title"
              defaultMessage="Corporate"
            />
          }
          description={
            <FormattedMessage
              id="public.parallel-use-cases.corporate-description"
              defaultMessage="Make it easier to manage your investors information."
            />
          }
        />
        <Feature
          image={
            <Image
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/use-case-litigation.svg`}
            />
          }
          header={
            <FormattedMessage
              id="public.parallel-use-cases.litigation-title"
              defaultMessage="Litigation"
            />
          }
          description={
            <FormattedMessage
              id="public.parallel-use-cases.litigation-description"
              defaultMessage="Collect precedents on time and focus on solving the case."
            />
          }
        />
        <Center borderRadius="lg" borderWidth="3px" borderColor="purple.200">
          <Flex flexDirection="column" alignItems="center" marginBottom={6} marginTop={7}>
            <Center
              borderRadius="full"
              boxSize={12}
              borderWidth="3px"
              borderColor="purple.800"
              marginBottom={3}
            >
              <AddIcon color="purple.800" />
            </Center>
            <Heading size="sm" marginBottom={2}>
              <FormattedMessage
                id="public.parallel-use-cases.other-title"
                defaultMessage="Can't find your use case?"
              />
            </Heading>
            <NakedLink href="/book-demo">
              <Button as="a" colorScheme="purple">
                <FormattedMessage
                  id="public.parallel-use-cases.other-contact"
                  defaultMessage="Contact us"
                />
              </Button>
            </NakedLink>
          </Flex>
        </Center>
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
      <Heading as="h4" marginTop={2} size="sm">
        {header}
      </Heading>
      <Text marginTop={2} fontSize="md">
        {description}
      </Text>
    </Box>
  );
}
