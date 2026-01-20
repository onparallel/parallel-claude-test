import { gql } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import { Box, Center, Circle, Flex, Grid, Heading, Image, Stack } from "@chakra-ui/react";
import { Card } from "@parallel/components/common/Card";
import { Logo } from "@parallel/components/common/Logo";
import {
  RedirectError,
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import {
  ChooseOrg_changeOrganizationDocument,
  ChooseOrg_OrganizationFragment,
  ChooseOrg_organizationsDocument,
  ChooseOrg_QueryDocument,
} from "@parallel/graphql/__types";
import { compose } from "@parallel/utils/compose";
import { UnwrapPromise } from "@parallel/utils/types";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { useRoleButton } from "@parallel/utils/useRoleButton";
import Head from "next/head";
import Router from "next/router";
import { MouseEvent, MouseEventHandler } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";

type ChooseOrgProps = UnwrapPromise<ReturnType<typeof ChooseOrg.getInitialProps>>;

function ChooseOrg({ organizations }: ChooseOrgProps) {
  const intl = useIntl();
  const apollo = useApolloClient();
  const handleCardPress = useMemoFactory(
    (orgId: string) => async (event: MouseEvent) => {
      await apollo.mutate({
        mutation: ChooseOrg_changeOrganizationDocument,
        variables: { orgId },
      });
      await apollo.clearStore();
      const { data } = await apollo.query({ query: ChooseOrg_QueryDocument });

      assert(isNonNullish(data), "Result data in ChooseOrg_QueryDocument is missing");

      Router.push(
        data.me.hasDashboards
          ? "/app/home"
          : data.petitions.totalCount
            ? "/app/petitions"
            : "/app/petitions/new",
      );
    },
    [],
  );
  return (
    <>
      <Head>
        <title>{
          // eslint-disable-next-line formatjs/no-literal-string-in-jsx
          `${intl.formatMessage({
            id: "page.choose-org.title",
            defaultMessage: "Choose organization",
          })} | Parallel`
        }</title>
      </Head>
      <Flex direction="column" minHeight="100vh">
        <Box paddingX={{ base: 6, md: 8, lg: 10 }} paddingY={{ base: 6, md: 8 }}>
          <Logo width="152px" />
        </Box>
        <Stack
          spacing={{ base: 6, md: 8, lg: 10 }}
          flex="1"
          justifyContent="center"
          marginBottom="120px"
        >
          <Flex justifyContent="center" paddingX={4}>
            <Heading as="h1" size="xl">
              <FormattedMessage
                id="page.choose-org.header"
                defaultMessage="Choose which organization you want to access"
              />
            </Heading>
          </Flex>
          <Grid
            as="ul"
            alignSelf="center"
            gridTemplateColumns={{
              base: `repeat(${Math.min(2, organizations.length)}, minmax(150px, 195px))`,
              sm: `repeat(${Math.min(3, organizations.length)}, minmax(150px, 195px))`,
              md: `repeat(${Math.min(4, organizations.length)}, minmax(150px, 195px))`,
              lg: `repeat(${Math.min(5, organizations.length)}, minmax(150px, 195px))`,
            }}
            justifyContent="center"
            paddingX={{ base: 4, md: 6, lg: 8 }}
            gridGap={4}
            maxWidth="100%"
            width="1024px"
          >
            {organizations.map((organization) => (
              <Flex as="li" key={organization.id}>
                <OrganizationCard
                  organization={organization}
                  onPressed={handleCardPress(organization.id)}
                />
              </Flex>
            ))}
          </Grid>
        </Stack>
      </Flex>
    </>
  );
}

function OrganizationCard({
  organization,
  onPressed,
}: {
  organization: ChooseOrg_OrganizationFragment;
  onPressed: MouseEventHandler<any>;
}) {
  const buttonProps = useRoleButton(onPressed);
  return (
    <Card
      flex="1"
      isInteractive
      display="flex"
      flexDirection="column"
      padding={6}
      alignItems="center"
      {...buttonProps}
    >
      <Circle border="1px solid" borderColor="gray.200" size="100px" overflow="hidden">
        {organization.iconUrl200 ? (
          <Image
            boxSize="100px"
            objectFit="contain"
            alt={organization.name}
            src={organization.iconUrl200}
            fallback={<></>}
          />
        ) : (
          <Center boxSize="100px">
            <Logo width="80px" hideText color="gray.800" />
          </Center>
        )}
      </Circle>
      <Heading fontWeight="bold" size="md" marginTop={2}>
        {organization.name}
      </Heading>
      <Box marginTop={1}>
        <FormattedMessage
          id="page.choose-org.org-users"
          defaultMessage="{count, plural, =1 {1 user} other {# users}}"
          values={{ count: organization.activeUserCount }}
        />
      </Box>
    </Card>
  );
}

const _fragments = {
  Organization: gql`
    fragment ChooseOrg_Organization on Organization {
      name
      activeUserCount
      iconUrl200: iconUrl(options: { resize: { width: 200 } })
    }
  `,
};

const _queries = [
  gql`
    query ChooseOrg_organizations {
      realMe {
        id
        organizations {
          id
          ...ChooseOrg_Organization
        }
      }
    }
  `,
  gql`
    query ChooseOrg_Query {
      me {
        id
        hasDashboards: hasFeatureFlag(featureFlag: DASHBOARDS)
      }
      petitions {
        totalCount
      }
    }
  `,
];

const _mutations = [
  gql`
    mutation ChooseOrg_changeOrganization($orgId: GID!) {
      changeOrganization(orgId: $orgId)
    }
  `,
];

ChooseOrg.getInitialProps = async ({ fetchQuery, query }: WithApolloDataContext) => {
  if (isNonNullish(query.continue)) {
    const { data } = await fetchQuery(ChooseOrg_QueryDocument);
    throw new RedirectError(
      data.me.hasDashboards
        ? "/app/home"
        : data.petitions.totalCount
          ? "/app/petitions"
          : "/app/petitions/new",
    );
  } else {
    const { data } = await fetchQuery(ChooseOrg_organizationsDocument);
    if (data.realMe.organizations.length === 1) {
      const { data } = await fetchQuery(ChooseOrg_QueryDocument);
      throw new RedirectError(
        data.me.hasDashboards
          ? "/app/home"
          : data.petitions.totalCount
            ? "/app/petitions"
            : "/app/petitions/new",
      );
    } else {
      return {
        organizations: data.realMe.organizations,
      };
    }
  }
};

export default compose(withApolloData)(ChooseOrg);
