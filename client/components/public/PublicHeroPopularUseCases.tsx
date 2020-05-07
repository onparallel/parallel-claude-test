import { BoxProps, Button, Flex, Grid, Heading, Text } from "@chakra-ui/core";
import { NakedLink } from "@parallel/components/common/Link";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { Card } from "../common/Card";
import { PublicContainer } from "./layout/PublicContainer";

export function PublicHeroPopularUseCases({ ...props }: BoxProps) {
  return (
    <PublicContainer
      {...props}
      paddingY={20}
      wrapper={{
        textAlign: "center",
        backgroundColor: "gray.50",
      }}
    >
      <Heading as="h2" fontSize="3xl" fontWeight="bold" color="purple.600">
        <FormattedMessage
          id="public.home.hero-popular-use-cases"
          defaultMessage="Popular use cases"
        ></FormattedMessage>
      </Heading>
      <Heading as="h3" fontSize="xl" fontWeight="light" marginTop={4}>
        <FormattedMessage
          id="public.home.hero-discover-use"
          defaultMessage="You can use Parallel if you work in a law firm, accounting firm or startup."
        ></FormattedMessage>
        <br />
        <FormattedMessage
          id="public.home.hero-discover-use-2"
          defaultMessage="Discover everything you can do with our platform."
        ></FormattedMessage>
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
            ></FormattedMessage>
          }
          description={
            <FormattedMessage
              id="public.popular.easily-collect"
              defaultMessage="Easily collect all the information from potential clients before starting to work"
            ></FormattedMessage>
          }
        ></Feature>
        <Feature
          header={
            <FormattedMessage
              id="public.popular.periodical-reporting"
              defaultMessage="Periodical reporting"
            ></FormattedMessage>
          }
          description={
            <FormattedMessage
              id="public.popular.periodical-requests"
              defaultMessage="Set up periodical requests that automatically collects the information for you"
            ></FormattedMessage>
          }
        />
        <Feature
          header={
            <FormattedMessage
              id="public.popular.investor-relations"
              defaultMessage="Investor relations"
            ></FormattedMessage>
          }
          description={
            <FormattedMessage
              id="public.popular.multiple-recipients"
              defaultMessage="Send a single request to multiple parties to gather the information and keep everything organized"
            ></FormattedMessage>
          }
        />
        <Feature
          header={
            <FormattedMessage
              id="public.popular.contract-addenda"
              defaultMessage="Contract addenda"
            ></FormattedMessage>
          }
          description={
            <FormattedMessage
              id="public.popular.focus-on-contract"
              defaultMessage="Focus on the contract while your clients send you the addenda at their pace"
            ></FormattedMessage>
          }
        />
        <Feature
          header={
            <FormattedMessage
              id="public.popular.accounting"
              defaultMessage="Accounting"
            ></FormattedMessage>
          }
          description={
            <FormattedMessage
              id="public.popular.information-ready"
              defaultMessage="Have your information ready every month in your space and reduce the emails received in your inbox"
            ></FormattedMessage>
          }
        />
        <Feature
          header={
            <FormattedMessage
              id="public.popular.claims"
              defaultMessage="Claims"
            ></FormattedMessage>
          }
          description={
            <FormattedMessage
              id="public.popular.collect-schedules"
              defaultMessage="Collect all the schedules without space limitation and access them in a single place"
            ></FormattedMessage>
          }
        />
      </Grid>
      <Flex marginTop={16} justifyContent="center">
        <NakedLink href="/book-demo">
          <Button as="a" variantColor="purple">
            <FormattedMessage
              id="public.book-demo-button"
              defaultMessage="Book a demo"
            ></FormattedMessage>
          </Button>
        </NakedLink>
      </Flex>
    </PublicContainer>
  );
}

function Feature({
  header,
  description,
  ...props
}: BoxProps & {
  header: ReactNode;
  description: ReactNode;
}) {
  return (
    <Card padding={5} textAlign="left" {...props}>
      <Heading as="h4" fontSize="md" color="purple.500">
        {header}
      </Heading>
      <Text marginTop={4} fontSize="sm">
        {description}
      </Text>
    </Card>
  );
}
