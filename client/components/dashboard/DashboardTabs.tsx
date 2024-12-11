import { gql } from "@apollo/client";
import { Box, Flex } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";

import { DashboardTabs_DashboardFragment } from "@parallel/graphql/__types";
import { DashboardQueryState } from "@parallel/pages/app/home";
import { SetQueryState } from "@parallel/utils/queryState";
import { isNonNullish } from "remeda";
import { RadioTab, RadioTabList } from "../common/RadioTab";

const MIN_TAB_WIDTH = 96;

interface DashboardTabsProps {
  state: DashboardQueryState;
  onStateChange: SetQueryState<Partial<DashboardQueryState>>;
  dashboards: DashboardTabs_DashboardFragment[];
}

export const DashboardTabs = Object.assign(
  chakraForwardRef<"div", DashboardTabsProps>(function DashboardTabs(
    { state, onStateChange, dashboards },
    ref,
  ) {
    const currentDashboard = dashboards.find((d) => d.id === state.dashboard) ?? dashboards[0];

    const handleDashboardChange = async (dashboardId: string) => {
      const dashboard = dashboards.find((d) => d.id === dashboardId);
      if (isNonNullish(dashboard)) {
        onStateChange({
          dashboard: dashboard.id,
        });
      }
    };

    return (
      <Flex
        data-section="dashboards"
        overflowX="auto"
        marginTop="-1px"
        marginX="-1px"
        minHeight="42px"
      >
        <RadioTabList
          ref={ref}
          variant="line"
          name="dashboard"
          value={currentDashboard.id}
          onChange={handleDashboardChange}
          flex={1}
          minWidth={0}
          listStyleType="none"
          position="relative"
        >
          <Flex flex={1} minWidth={MIN_TAB_WIDTH * (dashboards.length + 1)}>
            {dashboards.map((dashboard) => (
              <DashboardTab key={dashboard.id} dashboard={dashboard} />
            ))}
          </Flex>
        </RadioTabList>
      </Flex>
    );
  }),
  {
    fragments: {
      get Dashboard() {
        return gql`
          fragment DashboardTabs_Dashboard on Dashboard {
            id
            isDefault
            isRefreshing
            lastRefreshAt
            name
          }
        `;
      },
    },
  },
);

interface DashboardTabProps {
  dashboard: DashboardTabs_DashboardFragment;
}

function DashboardTab({ dashboard }: DashboardTabProps) {
  return (
    <Flex
      userSelect="none"
      minWidth={`${MIN_TAB_WIDTH}px`}
      flexShrink={1}
      data-dashboard-id={dashboard.id}
    >
      <RadioTab
        value={dashboard.id}
        flex={1}
        minWidth={0}
        _focus={{ boxShadow: "none" }}
        borderTopRadius="md"
        borderTopLeftRadius="md"
      >
        <Box flex={1} isTruncated>
          {dashboard.name}
        </Box>
      </RadioTab>
    </Flex>
  );
}
