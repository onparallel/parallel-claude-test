import { gql } from "@apollo/client";
import { Grid, Heading, HStack, Spinner, Stack, Text } from "@chakra-ui/react";
import { Tooltip } from "@parallel/chakra/components";
import { HomeIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import {
  RedirectError,
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { DashboardModule } from "@parallel/components/dashboard/DashboardModule";
import { DashboardTabs } from "@parallel/components/dashboard/DashboardTabs";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { Home_dashboardDocument, Home_userDocument } from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { useQueryOrPreviousData } from "@parallel/utils/apollo/useQueryOrPreviousData";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import {
  buildStateUrl,
  parseQuery,
  QueryStateFrom,
  string,
  useQueryState,
} from "@parallel/utils/queryState";
import { usePageVisibility } from "@parallel/utils/usePageVisibility";
import { useEffect } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";

const POLL_INTERVAL_REFRESHING = 1_500;
const POLL_INTERVAL = 30_000;

const QUERY_STATE = {
  dashboard: string(),
};

export type DashboardQueryState = QueryStateFrom<typeof QUERY_STATE>;

function Home() {
  const intl = useIntl();

  const [state, setQueryState] = useQueryState(QUERY_STATE);

  const { data: queryObject } = useAssertQuery(Home_userDocument);
  const { me } = queryObject;

  const selectedDasboardId = state.dashboard || me.dashboards[0]?.id;

  const isPageVisible = usePageVisibility();

  const { data, startPolling, stopPolling, refetch } = useQueryOrPreviousData(
    Home_dashboardDocument,
    {
      variables: { id: selectedDasboardId },
      skip: !selectedDasboardId || !isPageVisible,
    },
  );

  const dashboard = data?.dashboard;

  useEffect(() => {
    if (!isPageVisible) {
      stopPolling();
    } else {
      refetch();
      if (dashboard?.isRefreshing) {
        startPolling(POLL_INTERVAL_REFRESHING);
      } else {
        startPolling(POLL_INTERVAL);
      }
    }

    return () => {
      stopPolling();
    };
  }, [dashboard?.isRefreshing, startPolling, stopPolling, refetch, isPageVisible]);

  return (
    <AppLayout
      title={intl.formatMessage({
        id: "page.home.title",
        defaultMessage: "Home",
      })}
      queryObject={queryObject}
    >
      <Stack minHeight={0} paddingX={4} paddingTop={6} spacing={4}>
        <Stack maxWidth="container.xl" width="100%" margin="0 auto">
          <HStack justify="space-between" padding={2}>
            <HStack>
              <HomeIcon boxSize={5} />
              <Heading as="h2" size="lg">
                <FormattedMessage id="page.home.title" defaultMessage="Home" />
              </Heading>
            </HStack>

            {dashboard?.lastRefreshAt ? (
              <HStack>
                {dashboard?.isRefreshing ? (
                  <Tooltip
                    label={intl.formatMessage({
                      id: "page.home.refreshing-data",
                      defaultMessage: "Refreshing data...",
                    })}
                  >
                    <Spinner size="xs" thickness="1.5px" />
                  </Tooltip>
                ) : null}
                <Text as="span" fontSize="sm">
                  <FormattedMessage
                    id="page.home.last-refreshed"
                    defaultMessage="Updated {timeAgo}"
                    values={{
                      timeAgo: (
                        <DateTime
                          value={dashboard?.lastRefreshAt}
                          format={FORMATS.LLL}
                          useRelativeTime="always"
                        />
                      ),
                    }}
                  />
                </Text>
              </HStack>
            ) : null}
          </HStack>
          {me.dashboards.length > 1 ? (
            <DashboardTabs onStateChange={setQueryState} state={state} dashboards={me.dashboards} />
          ) : null}
        </Stack>

        <Grid
          maxWidth="container.xl"
          width="100%"
          margin="0 auto"
          paddingBottom={20}
          gridGap={4}
          templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
          gridAutoRows="130px"
        >
          {isNonNullish(dashboard)
            ? dashboard.modules.map((module) => {
                return <DashboardModule key={module.id} module={module} />;
              })
            : null}
        </Grid>
      </Stack>
    </AppLayout>
  );
}

Home.fragments = {
  get User() {
    return gql`
      fragment Home_User on User {
        id
        dashboards {
          id
          isDefault
          ...DashboardTabs_Dashboard
        }
      }
      ${DashboardTabs.fragments.Dashboard}
    `;
  },
};

const _queries = [
  gql`
    query Home_user {
      ...AppLayout_Query
      me {
        ...Home_User
      }
    }
    ${AppLayout.fragments.Query}
    ${Home.fragments.User}
  `,
  gql`
    query Home_dashboard($id: GID!) {
      dashboard(id: $id) {
        id
        isRefreshing
        lastRefreshAt
        name
        modules {
          id
          title
          size
          ...DashboardModule_DashboardModule
        }
      }
    }
    ${DashboardModule.fragments.DashboardModule}
  `,
];

Home.getInitialProps = async ({ fetchQuery, query, pathname }: WithApolloDataContext) => {
  const state = parseQuery(query, QUERY_STATE);
  const { data } = await fetchQuery(Home_userDocument);
  const dashboardId =
    data.me.dashboards.find((d) => d.id === state.dashboard)?.id ??
    data.me.dashboards.find((d) => d.isDefault)?.id;

  if (dashboardId ?? data.me.dashboards[0]?.id) {
    await fetchQuery(Home_dashboardDocument, {
      variables: { id: dashboardId ?? data.me.dashboards[0]?.id },
    });

    if (isNonNullish(dashboardId) && dashboardId !== state.dashboard) {
      throw new RedirectError(
        buildStateUrl(
          QUERY_STATE,
          {
            dashboard: dashboardId,
          },
          pathname,
          query,
        ),
      );
    }
  }

  return {};
};

export default compose(
  withDialogs,
  withFeatureFlag("DASHBOARDS", "/app/petitions"),
  withApolloData,
)(Home);
