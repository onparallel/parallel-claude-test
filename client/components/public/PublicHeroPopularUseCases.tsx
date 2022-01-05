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
          defaultMessage="Processes that you can make more efficient"
        />
      </Heading>
      <Heading as="h3" size="md" fontWeight="light" marginTop={4}>
        <FormattedMessage
          id="public.parallel-use-cases.subtitle"
          defaultMessage="Parallel is a flexible tool with the ability to manage complex processes"
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
          url="/templates/sales"
          image={
            <Image
              role="presentation"
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/use-case-sales.svg`}
            />
          }
          header={
            <FormattedMessage id="public.parallel-use-cases.sales-title" defaultMessage="Sales" />
          }
          description={
            <FormattedMessage
              id="public.parallel-use-cases.sales-description"
              defaultMessage="Get everything you need to close a contract in 5 minutes."
            />
          }
        />
        <Feature
          url="/templates/legal"
          image={
            <Image
              role="presentation"
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/use-case-legal.svg`}
            />
          }
          header={
            <FormattedMessage id="public.parallel-use-cases.legal-title" defaultMessage="Legal" />
          }
          description={
            <FormattedMessage
              id="public.parallel-use-cases.legal-description"
              defaultMessage="Implement legal processes effortlessly."
            />
          }
        />
        <Feature
          url="/templates/compliance"
          image={
            <Image
              role="presentation"
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/use-case-compliance.svg`}
            />
          }
          header={
            <FormattedMessage
              id="public.parallel-use-cases.compliance-title"
              defaultMessage="Compliance"
            />
          }
          description={
            <FormattedMessage
              id="public.parallel-use-cases.compliance-description"
              defaultMessage="Complete KYC processes faster."
            />
          }
        />
        <Feature
          url="/templates/hr"
          image={
            <Image
              role="presentation"
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/use-case-hr.svg`}
            />
          }
          header={<FormattedMessage id="public.parallel-use-cases.hr-title" defaultMessage="HR" />}
          description={
            <FormattedMessage
              id="public.parallel-use-cases.hr-description"
              defaultMessage="Get all the documentation you need from your employees."
            />
          }
        />
        <Feature
          url="/templates/finance"
          image={
            <Image
              role="presentation"
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/use-case-finance.svg`}
            />
          }
          header={
            <FormattedMessage
              id="public.parallel-use-cases.finance-title"
              defaultMessage="Finance"
            />
          }
          description={
            <FormattedMessage
              id="public.parallel-use-cases.finance-description"
              defaultMessage="Get faster your customer details to bill earlier."
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
                defaultMessage="Looking for more use cases?"
              />
            </Heading>
            <NakedLink href="/templates">
              <Button as="a" colorScheme="purple">
                <FormattedMessage
                  id="public.parallel-use-cases.other-templates"
                  defaultMessage="See our templates"
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
  url: string;
  header: ReactNode;
  description: ReactNode;
}

function Feature({ image, header, description, url, ...props }: FeatureProps) {
  return (
    <Box padding={5} textAlign="left" {...props}>
      <NakedLink href={url}>
        <Box as="a">{image}</Box>
      </NakedLink>
      <Heading as="h4" marginTop={2} size="sm">
        {header}
      </Heading>
      <Text marginTop={2} fontSize="md">
        {description}
      </Text>
    </Box>
  );
}
