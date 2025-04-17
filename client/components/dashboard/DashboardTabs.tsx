import { gql } from "@apollo/client";
import { Box, Flex, MenuDivider, MenuItem, MenuList } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";

import { AddIcon, CopyIcon, DeleteIcon, EditIcon } from "@parallel/chakra/icons";
import { DashboardTabs_DashboardFragment } from "@parallel/graphql/__types";
import { DashboardQueryState } from "@parallel/pages/app/home";
import { SetQueryState } from "@parallel/utils/queryState";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { MoreOptionsMenuButton } from "../common/MoreOptionsMenuButton";
import { RadioTab, RadioTabList } from "../common/RadioTab";
import { useAskNameDialog } from "../petition-list/AskNameDialog";
const MIN_TAB_WIDTH = 96;

interface DashboardTabsProps {
  state: DashboardQueryState;
  onStateChange: SetQueryState<Partial<DashboardQueryState>>;
  onCreateDashboard: (name: string) => void;
  dashboards: DashboardTabs_DashboardFragment[];
  canCreateDashboard: boolean;
  onRenameDashboard: (dashboardId: string, name: string) => void;
  onCloneDashboard: (dashboardId: string, name: string) => void;
  onDeleteDashboard: (dashboardId: string) => void;
  isEditing: boolean;
}

export const DashboardTabs = Object.assign(
  chakraForwardRef<"div", DashboardTabsProps>(function DashboardTabs(
    {
      state,
      onStateChange,
      onCreateDashboard,
      dashboards,
      canCreateDashboard,
      onRenameDashboard,
      onCloneDashboard,
      onDeleteDashboard,
      isEditing,
    },
    ref,
  ) {
    const intl = useIntl();

    const newDashboardButtonRef = useRef<HTMLButtonElement>(null);
    const currentDashboard =
      dashboards.find((d) => d.id === state.dashboard) ??
      (dashboards.length > 0 ? dashboards[0] : undefined);

    const handleDashboardChange = (dashboardId: string) => {
      const dashboard = dashboards.find((d) => d.id === dashboardId);
      if (isNonNullish(dashboard)) {
        onStateChange({
          dashboard: dashboard.id,
        });
      }
    };

    const showAskNameDialog = useAskNameDialog();
    const handleCreateNewDashboard = async () => {
      try {
        const name = await showAskNameDialog({
          name: intl.formatMessage(
            {
              id: "component.dashboard-tabs.dashboard-x",
              defaultMessage: "Dashboard {count}",
            },
            {
              count: dashboards.length + 1,
            },
          ),
          header: (
            <FormattedMessage
              id="component.dashboard-tabs.new-dashboard-header"
              defaultMessage="New dashboard"
            />
          ),
          label: <FormattedMessage id="generic.forms-name-label" defaultMessage="Name" />,
          confirm: <FormattedMessage id="generic.create" defaultMessage="Create" />,
          modalProps: { finalFocusRef: newDashboardButtonRef },
        });
        onCreateDashboard(name);
      } catch {}
    };

    return (
      <RadioTabList
        ref={ref}
        variant="line"
        name="dashboard"
        value={currentDashboard?.id}
        onChange={handleDashboardChange}
        flex={1}
        minWidth={0}
        listStyleType="none"
        position="relative"
      >
        {dashboards.length ? (
          <Flex minWidth={`${MIN_TAB_WIDTH}px`}>
            {dashboards.map((dashboard) => (
              <DashboardTab
                key={dashboard.id}
                dashboard={dashboard}
                isEditing={isEditing}
                onRenameDashboard={onRenameDashboard}
                onCloneDashboard={onCloneDashboard}
                onDeleteDashboard={onDeleteDashboard}
              />
            ))}
          </Flex>
        ) : null}
        {canCreateDashboard && isEditing ? (
          <IconButtonWithTooltip
            ref={newDashboardButtonRef}
            variant="ghost"
            icon={<AddIcon boxSize={4} />}
            label={intl.formatMessage({
              id: "component.dashboard-tabs.new-dashboard",
              defaultMessage: "New dashboard",
            })}
            marginX={2}
            marginY={1}
            size="sm"
            onClick={handleCreateNewDashboard}
          />
        ) : null}
      </RadioTabList>
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
  onRenameDashboard: (dashboardId: string, name: string) => void;
  onCloneDashboard: (dashboardId: string, name: string) => void;
  onDeleteDashboard: (dashboardId: string) => void;
  isEditing: boolean;
}

function DashboardTab({
  dashboard,
  onRenameDashboard,
  onCloneDashboard,
  onDeleteDashboard,
  isEditing,
}: DashboardTabProps) {
  const moreOptionsButtonRef = useRef<HTMLButtonElement>(null);
  const showAskNameDialog = useAskNameDialog();
  const showGenericErrorToast = useGenericErrorToast();

  const handleRenameDashboardClick = async () => {
    try {
      const name = await showAskNameDialog({
        name: dashboard.name,
        header: (
          <FormattedMessage
            id="component.dashboard-tabs.rename-dashboard-header"
            defaultMessage="Rename dashboard"
          />
        ),
        label: (
          <FormattedMessage
            id="component.dashboard-tabs.rename-dashboard-label"
            defaultMessage="Enter a meaningful name for the dashboard"
          />
        ),
        confirm: <FormattedMessage id="generic.rename" defaultMessage="Rename" />,
        modalProps: { finalFocusRef: moreOptionsButtonRef },
      });
      onRenameDashboard(dashboard.id, name);
    } catch (error) {
      showGenericErrorToast(error);
    }
  };

  const handleCloneDashboardClick = async () => {
    try {
      const name = await showAskNameDialog({
        name: dashboard.name,
        header: (
          <FormattedMessage
            id="component.dashboard-tabs.clone-dashboard-header"
            defaultMessage="Clone dashboard"
          />
        ),
        label: (
          <FormattedMessage
            id="component.dashboard-tabs.rename-dashboard-label"
            defaultMessage="Enter a meaningful name for the dashboard"
          />
        ),
        confirm: <FormattedMessage id="generic.clone" defaultMessage="Clone" />,
        modalProps: { finalFocusRef: moreOptionsButtonRef },
      });
      onCloneDashboard(dashboard.id, name);
    } catch (error) {
      showGenericErrorToast(error);
    }
  };

  return (
    <Flex
      userSelect="none"
      minWidth={`${MIN_TAB_WIDTH}px`}
      flexShrink={1}
      data-dashboard-id={dashboard.id}
      textAlign="center"
    >
      <RadioTab
        value={dashboard.id}
        flex={1}
        minWidth={0}
        _focus={{ boxShadow: "none" }}
        borderTopRadius="md"
        borderTopLeftRadius="md"
        cursor="pointer"
        gap={{ base: 1, sm: 2 }}
        paddingEnd={isEditing ? { base: 1, sm: 2 } : undefined}
      >
        <Box flex={1} isTruncated fontWeight={500}>
          {dashboard.name}
        </Box>
        {isEditing ? (
          <MoreOptionsMenuButton
            ref={moreOptionsButtonRef}
            size="xs"
            variant="ghost"
            options={
              <MenuList minWidth="160px">
                <MenuItem
                  icon={<EditIcon boxSize={4} display="block" />}
                  onClick={handleRenameDashboardClick}
                >
                  <FormattedMessage id="generic.rename" defaultMessage="Rename" />
                </MenuItem>
                <MenuItem
                  icon={<CopyIcon boxSize={4} display="block" />}
                  onClick={handleCloneDashboardClick}
                >
                  <FormattedMessage id="generic.clone" defaultMessage="Clone" />
                </MenuItem>
                <MenuDivider />
                <MenuItem
                  color="red.600"
                  icon={<DeleteIcon boxSize={4} display="block" />}
                  onClick={() => onDeleteDashboard(dashboard.id)}
                >
                  <FormattedMessage id="generic.delete" defaultMessage="Delete" />
                </MenuItem>
              </MenuList>
            }
          />
        ) : null}
      </RadioTab>
    </Flex>
  );
}
