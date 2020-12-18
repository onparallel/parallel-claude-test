import { BoxProps, Button, Flex, Grid, Heading, Text } from "@chakra-ui/react";
import { NakedLink } from "@parallel/components/common/Link";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { Card } from "../common/Card";
import { PublicContainer } from "./layout/PublicContainer";

export function PublicHeroPopularUseCases(props: BoxProps) {
  return (
    <PublicContainer
      {...props}
      paddingY={20}
      wrapper={{
        textAlign: "center",
        backgroundColor: "gray.50",
      }}
    >
      <Heading as="h2" size="xl" fontWeight="bold">
        <FormattedMessage
          id="public.home.hero-popular-use-cases"
          defaultMessage="Popular use cases"
        />
      </Heading>
      <Heading as="h3" size="md" fontWeight="light" marginTop={4}>
        <FormattedMessage
          id="public.home.hero-discover-use"
          defaultMessage="You can use Parallel if you work in a law firm, accounting firm or startup."
        />
        <br />
        <FormattedMessage
          id="public.home.hero-discover-use-2"
          defaultMessage="Discover everything you can do with our platform."
        />
      </Heading>
      <Grid
        marginTop={16}
        justifyContent="space-evenly"
        gridGap="24px"
        templateColumns={{
          base: "minmax(auto, 320px)",
          md: "repeat(2, minmax(auto, 320px))",
          lg: "repeat(3, minmax(auto, 320px))",
        }}
      >
        <Feature
          header={
            <FormattedMessage
              id="public.popular.kyc"
              defaultMessage="Know your customer (KYC)"
            />
          }
          description={
            <FormattedMessage
              id="public.popular.easily-collect"
              defaultMessage="Easily collect all the information from potential clients before starting to work"
            />
          }
        />
        <Feature
          header={
            <FormattedMessage
              id="public.popular.periodical-reporting"
              defaultMessage="Periodical reporting"
            />
          }
          description={
            <FormattedMessage
              id="public.popular.periodical-requests"
              defaultMessage="Set up periodical requests that automatically collects the information for you"
            />
          }
        />
        <Feature
          header={
            <FormattedMessage
              id="public.popular.investor-relations"
              defaultMessage="Investor relations"
            />
          }
          description={
            <FormattedMessage
              id="public.popular.multiple-recipients"
              defaultMessage="Send a single request to multiple parties to gather the information and keep everything organized"
            />
          }
        />
        <Feature
          header={
            <FormattedMessage
              id="public.popular.contract-addenda"
              defaultMessage="Contract addenda"
            />
          }
          description={
            <FormattedMessage
              id="public.popular.focus-on-contract"
              defaultMessage="Focus on the contract while your clients send you the addenda at their pace"
            />
          }
        />
        <Feature
          header={
            <FormattedMessage
              id="public.popular.accounting"
              defaultMessage="Accounting"
            />
          }
          description={
            <FormattedMessage
              id="public.popular.information-ready"
              defaultMessage="Have your information ready every month in your space and reduce the emails received in your inbox"
            />
          }
        />
        <Feature
          header={
            <FormattedMessage
              id="public.popular.claims"
              defaultMessage="Claims"
            />
          }
          description={
            <FormattedMessage
              id="public.popular.collect-schedules"
              defaultMessage="Collect all the schedules without space limitation and access them in a single place"
            />
          }
        />
      </Grid>
      <Flex marginTop={16} justifyContent="center">
        <NakedLink href="/book-demo">
          <Button as="a" colorScheme="purple">
            <FormattedMessage
              id="public.book-demo-button"
              defaultMessage="Book a demo"
            />
          </Button>
        </NakedLink>
      </Flex>
    </PublicContainer>
  );
}

interface FeatureProps extends BoxProps {
  header: ReactNode;
  description: ReactNode;
}

function Feature({ header, description, ...props }: FeatureProps) {
  return (
    <Card padding={5} textAlign="left" {...props}>
      <Heading as="h4" size="sm">
        {header}
      </Heading>
      <Text marginTop={4} fontSize="sm">
        {description}
      </Text>
    </Card>
  );
}
