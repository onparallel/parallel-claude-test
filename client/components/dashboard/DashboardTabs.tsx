import { gql } from "@apollo/client";
import { MenuDivider, MenuItem, MenuList, Square } from "@chakra-ui/react";
import { AddIcon, CopyIcon, DeleteIcon, EditIcon, UserArrowIcon } from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import { DashboardTabs_DashboardFragment } from "@parallel/graphql/__types";
import { DashboardQueryState } from "@parallel/pages/app/home";
import { SetQueryState } from "@parallel/utils/queryState";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { Flex } from "@parallel/components/ui";
import { Reorder } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { MoreOptionsMenuButton } from "../common/MoreOptionsMenuButton";
import { OverflownText } from "../common/OverflownText";
import { RadioTab, RadioTabList } from "../common/RadioTab";
import { useAskNameDialog } from "../petition-list/AskNameDialog";
import { useDashboardSharingDialog } from "./dialogs/DashboardSharingDialog";
const MIN_TAB_WIDTH = 100;

interface DashboardTabsProps {
  userId: string;
  state: DashboardQueryState;
  onStateChange: SetQueryState<Partial<DashboardQueryState>>;
  onCreateDashboard: (name: string) => void;
  dashboards: DashboardTabs_DashboardFragment[];
  onRenameDashboard: (dashboardId: string, name: string) => void;
  onCloneDashboard: (dashboardId: string, name: string) => void;
  onDeleteDashboard: (dashboardId: string) => void;
  onReorder: (dashboardIds: string[]) => Promise<void>;
  isEditing: boolean;
  canCreateDashboard: boolean;
  onRefetchDashboards: (resetState?: boolean) => void;
}

export const DashboardTabs = chakraComponent<"div", DashboardTabsProps>(function DashboardTabs({
  ref,
  userId,
  state,
  onStateChange,
  onCreateDashboard,
  dashboards,
  onRenameDashboard,
  onCloneDashboard,
  onDeleteDashboard,
  onReorder,
  isEditing,
  canCreateDashboard,
  onRefetchDashboards,
}) {
  const intl = useIntl();
  const showGenericErrorToast = useGenericErrorToast();

  const [sortedDashboardIds, setSortedDashboardIds] = useState(dashboards.map((d) => d.id));

  useEffect(() => {
    setSortedDashboardIds(dashboards.map((d) => d.id));
  }, [dashboards.map((d) => d.id).join(",")]);

  const handleDragEnd = async () => {
    try {
      await onReorder(sortedDashboardIds);
    } catch (error) {
      showGenericErrorToast(error);
    }
  };

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
      className="no-print"
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
        <Flex
          minWidth={`${MIN_TAB_WIDTH}px`}
          as={Reorder.Group<string>}
          layoutScroll
          axis="x"
          values={sortedDashboardIds}
          onReorder={setSortedDashboardIds}
          marginTop="-1px"
          overflowX="auto"
          overflowY="hidden"
        >
          {sortedDashboardIds.map((id) => {
            const dashboard = dashboards.find((d) => d.id === id);
            if (!dashboard) {
              return null;
            }
            return (
              <DashboardTab
                key={dashboard.id}
                userId={userId}
                dashboard={dashboard}
                isActive={dashboard.id === currentDashboard?.id}
                onRenameDashboard={onRenameDashboard}
                onCloneDashboard={onCloneDashboard}
                onDeleteDashboard={onDeleteDashboard}
                onDragEnd={handleDragEnd}
                canCreateDashboard={canCreateDashboard}
                onRefetchDashboards={onRefetchDashboards}
              />
            );
          })}
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
          alignSelf="flex-end"
        />
      ) : null}
    </RadioTabList>
  );
});

const _fragments = {
  Dashboard: gql`
    fragment DashboardTabs_Dashboard on Dashboard {
      id
      isRefreshing
      lastRefreshAt
      name
      myEffectivePermission
      permissions {
        id
        userGroup {
          id
          imMember
        }
      }
    }
  `,
};

interface DashboardTabProps {
  userId: string;
  dashboard: DashboardTabs_DashboardFragment;
  onRenameDashboard: (dashboardId: string, name: string) => void;
  onCloneDashboard: (dashboardId: string, name: string) => void;
  onDeleteDashboard: (dashboardId: string) => void;
  onDragEnd: () => void;
  isActive: boolean;
  canCreateDashboard: boolean;
  onRefetchDashboards: (resetState?: boolean) => void;
}

function DashboardTab({
  userId,
  dashboard,
  onRenameDashboard,
  onCloneDashboard,
  onDeleteDashboard,
  onDragEnd,
  isActive,
  canCreateDashboard,
  onRefetchDashboards,
}: DashboardTabProps) {
  const moreOptionsButtonRef = useRef<HTMLButtonElement>(null);
  const showAskNameDialog = useAskNameDialog();

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
    } catch {}
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
    } catch {}
  };

  const showDashboardSharingDialog = useDashboardSharingDialog();
  const handleShareDashboardClick = async () => {
    try {
      const { lostAccess } = await showDashboardSharingDialog({
        dashboardId: dashboard.id,
        userId,
        modalProps: { finalFocusRef: moreOptionsButtonRef },
      });

      if (lostAccess) {
        onRefetchDashboards(true);
      }
    } catch {}
  };

  return (
    <Flex
      as={Reorder.Item}
      value={dashboard.id}
      onDragEnd={onDragEnd}
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
        paddingEnd={{ base: 1, sm: 2 }}
        justifyContent="space-between"
      >
        <OverflownText fontWeight={500}>{dashboard.name}</OverflownText>
        <Square size={6}>
          {isActive ? (
            <MoreOptionsMenuButton
              ref={moreOptionsButtonRef}
              size="xs"
              variant="ghost"
              options={
                <MenuList minWidth="160px">
                  <MenuItem
                    icon={<EditIcon boxSize={4} display="block" />}
                    onClick={handleRenameDashboardClick}
                    isDisabled={dashboard.myEffectivePermission === "READ"}
                  >
                    <FormattedMessage id="generic.rename" defaultMessage="Rename" />
                  </MenuItem>
                  <MenuItem
                    icon={<CopyIcon boxSize={4} display="block" />}
                    onClick={handleCloneDashboardClick}
                    isDisabled={!canCreateDashboard}
                  >
                    <FormattedMessage id="generic.clone" defaultMessage="Clone" />
                  </MenuItem>
                  <MenuItem
                    icon={<UserArrowIcon boxSize={4} display="block" />}
                    onClick={handleShareDashboardClick}
                  >
                    <FormattedMessage id="generic.share" defaultMessage="Share" />
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem
                    color="red.600"
                    icon={<DeleteIcon boxSize={4} display="block" />}
                    onClick={() => onDeleteDashboard(dashboard.id)}
                    isDisabled={
                      // can't delete if you're not the owner and the dashboard is shared with a group you belong to
                      dashboard.myEffectivePermission !== "OWNER" &&
                      dashboard.permissions.some((p) => p.userGroup?.imMember)
                    }
                  >
                    <FormattedMessage id="generic.delete" defaultMessage="Delete" />
                  </MenuItem>
                </MenuList>
              }
            />
          ) : null}
        </Square>
      </RadioTab>
    </Flex>
  );
}
