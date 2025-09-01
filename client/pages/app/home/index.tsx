import { gql, useMutation } from "@apollo/client";
import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Image,
  Spinner,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, SortableContext } from "@dnd-kit/sortable";
import { Tooltip } from "@parallel/chakra/components";
import { AddIcon, EditIcon, HomeIcon, PlusCircleIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { DialogError, withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import {
  RedirectError,
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { withPermission } from "@parallel/components/common/withPermission";
import {
  DashboardModule,
  DashboardModule as DashboardModuleComponent,
} from "@parallel/components/dashboard/DashboardModule";
import { DashboardTabs } from "@parallel/components/dashboard/DashboardTabs";
import { useConfirmDeleteDashboardDialog } from "@parallel/components/dashboard/dialogs/ConfirmDeleteDashboardDialog";
import { DashboardModuleDrawer } from "@parallel/components/dashboard/drawer/DashboardModuleDrawer";
import { SortableDashboardModule } from "@parallel/components/dashboard/SortableDashboardModule";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import {
  Home_cloneDashboardDocument,
  Home_createDashboardDocument,
  Home_dashboardDocument,
  Home_DashboardModuleFragment,
  Home_deleteDashboardDocument,
  Home_deleteDashboardModuleDocument,
  Home_reorderDashboardsDocument,
  Home_updateDashboardDocument,
  Home_updateDashboardModulePositionsDocument,
  Home_userDocument,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { useQueryOrPreviousData } from "@parallel/utils/apollo/useQueryOrPreviousData";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import {
  buildStateUrl,
  date,
  parseQuery,
  QueryStateFrom,
  string,
  useQueryState,
} from "@parallel/utils/queryState";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { usePageVisibility } from "@parallel/utils/usePageVisibility";
import { withMetadata } from "@parallel/utils/withMetadata";
import { MotionConfig } from "framer-motion";
import { memo, RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { noop } from "ts-essentials";

const POLL_INTERVAL_REFRESHING = 1_500;
const POLL_INTERVAL = 30_000;

const QUERY_STATE = {
  dashboard: string(),
  range: date().list({ maxItems: 2 }),
};

export type DashboardQueryState = QueryStateFrom<typeof QUERY_STATE>;

function Home() {
  const intl = useIntl();

  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Home_DashboardModuleFragment | null>(null);
  const topAddModuleButtonRef = useRef<HTMLButtonElement>(null);
  const bottomAddModuleButtonRef = useRef<HTMLButtonElement>(null);
  const addModuleButtonRef = useRef<HTMLButtonElement | null>(null);
  const showGenericErrorToast = useGenericErrorToast();

  const { data: queryObject, refetch: refetchUser } = useAssertQuery(Home_userDocument);
  const { me } = queryObject;

  const userCanCreateDashboards = useHasPermission("DASHBOARDS:CREATE_DASHBOARDS");

  const selectedDashboardId = state.dashboard || me.dashboards[0]?.id;

  const isPageVisible = usePageVisibility();

  const { data, startPolling, stopPolling, refetch } = useQueryOrPreviousData(
    Home_dashboardDocument,
    {
      variables: { id: selectedDashboardId! },
      skip: !selectedDashboardId || !isPageVisible,
    },
  );

  const dashboard = isNonNullish(selectedDashboardId) ? data?.dashboard : null;

  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleCloseDrawer = useCallback(() => {
    setSelectedModule(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isPageVisible) {
      stopPolling();
    } else if (selectedDashboardId) {
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
  }, [
    dashboard?.isRefreshing,
    startPolling,
    stopPolling,
    refetch,
    isPageVisible,
    selectedDashboardId,
  ]);

  const handleEditDashboard = useCallback(() => {
    setIsEditing((v) => !v);
  }, []);

  const handleAddModule = useCallback(
    (buttonRef: RefObject<HTMLButtonElement>) => {
      addModuleButtonRef.current = buttonRef.current;
      onOpen();
    },
    [onOpen],
  );

  const [createDashboard] = useMutation(Home_createDashboardDocument);
  const handleCreateNewDashboard = useCallback(
    async (name: string) => {
      try {
        const { data } = await createDashboard({
          variables: {
            name,
          },
        });
        await refetchUser();
        setQueryState({
          dashboard: data?.createDashboard.id,
        });
      } catch (error) {
        showGenericErrorToast(error);
      }
    },
    [createDashboard, refetchUser, setQueryState, showGenericErrorToast],
  );

  const [deleteDashboardModule] = useMutation(Home_deleteDashboardModuleDocument);

  const handleDeleteModule = useCallback(
    async (moduleId: string) => {
      if (!selectedDashboardId) return;
      try {
        await deleteDashboardModule({
          variables: {
            dashboardId: selectedDashboardId,
            moduleId,
          },
        });
        refetch();
      } catch (error) {
        showGenericErrorToast(error);
      }
    },
    [deleteDashboardModule, selectedDashboardId, refetch, showGenericErrorToast],
  );

  const handleEditModule = useCallback(
    (moduleToEdit: Home_DashboardModuleFragment) => {
      setSelectedModule(moduleToEdit);
      onOpen();
    },
    [onOpen],
  );

  const [updateDashboard] = useMutation(Home_updateDashboardDocument);
  const handleRenameDashboard = useCallback(
    async (dashboardId: string, name: string) => {
      try {
        await updateDashboard({
          variables: { id: dashboardId, name },
        });
      } catch (error) {
        showGenericErrorToast(error);
      }
    },
    [updateDashboard, showGenericErrorToast],
  );

  const [cloneDashboard] = useMutation(Home_cloneDashboardDocument);
  const handleCloneDashboard = useCallback(
    async (dashboardId: string, name: string) => {
      try {
        const { data } = await cloneDashboard({
          variables: { id: dashboardId, name },
        });
        await refetchUser();

        setQueryState({
          dashboard: data?.cloneDashboard.id,
        });
      } catch (error) {
        showGenericErrorToast(error);
      }
    },
    [cloneDashboard, refetchUser, setQueryState, showGenericErrorToast],
  );

  const showConfirmDeleteDashboardDialog = useConfirmDeleteDashboardDialog();
  const [deleteDashboard] = useMutation(Home_deleteDashboardDocument);
  const handleDeleteDashboard = async (dashboardId: string) => {
    try {
      await showConfirmDeleteDashboardDialog({
        isOwner: dashboard?.myEffectivePermission === "OWNER",
      });
      await deleteDashboard({ variables: { id: dashboardId } });
      const { data: userData } = await refetchUser();
      if (selectedDashboardId === dashboardId) {
        setQueryState({ dashboard: userData?.me.dashboards[0]?.id ?? null });
      }
    } catch (error) {
      if (error instanceof DialogError) {
        return;
      }
      showGenericErrorToast(error);
    }
  };

  const [reorderDashboards] = useMutation(Home_reorderDashboardsDocument);

  const handleReorderDashboards = async (dashboardIds: string[]) => {
    try {
      await reorderDashboards({ variables: { ids: dashboardIds } });
    } catch {}
  };

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
              {isEditing ? (
                <Badge colorScheme="primary" fontSize="md" fontWeight={500} paddingX={2}>
                  <FormattedMessage id="page.home.editing" defaultMessage="Editing" />
                </Badge>
              ) : null}
            </HStack>

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
              {dashboard?.lastRefreshAt ? (
                <Text as="span" fontSize="sm">
                  <FormattedMessage
                    id="page.home.last-refreshed"
                    defaultMessage="Updated {timeAgo}"
                    values={{
                      timeAgo: (
                        <DateTime
                          value={dashboard.lastRefreshAt}
                          format={FORMATS.LLL}
                          useRelativeTime="always"
                        />
                      ),
                    }}
                  />
                </Text>
              ) : null}
            </HStack>
          </HStack>
          <Flex data-section="dashboards" minHeight="42px">
            <MotionConfig reducedMotion="always">
              <DashboardTabs
                onStateChange={setQueryState}
                state={state}
                dashboards={me.dashboards}
                onCreateDashboard={handleCreateNewDashboard}
                canCreateDashboard={userCanCreateDashboards}
                onRenameDashboard={handleRenameDashboard}
                onCloneDashboard={handleCloneDashboard}
                onDeleteDashboard={handleDeleteDashboard}
                onReorder={handleReorderDashboards}
                onRefetchDashboards={(resetState?: boolean) => {
                  if (resetState) {
                    setQueryState({
                      dashboard: null,
                    });
                  }
                  refetchUser();
                }}
                isEditing={isEditing}
                userId={me.id}
              />
            </MotionConfig>

            <HStack padding={0.5} alignItems="flex-end">
              {isEditing && isNonNullish(dashboard) ? (
                <Button
                  variant="outline"
                  bg="white"
                  ref={topAddModuleButtonRef}
                  leftIcon={<AddIcon boxSize={3.5} />}
                  onClick={() => handleAddModule(topAddModuleButtonRef)}
                  fontWeight={500}
                  isDisabled={
                    dashboard.modules.length >= 20 || dashboard.myEffectivePermission === "READ"
                  }
                >
                  <FormattedMessage id="page.home.add-module" defaultMessage="Add module" />
                </Button>
              ) : null}
              <IconButtonWithTooltip
                colorScheme={isEditing ? "primary" : undefined}
                variant={isEditing ? "solid" : "outline"}
                backgroundColor={isEditing ? undefined : "white"}
                icon={<EditIcon />}
                label={
                  isEditing
                    ? intl.formatMessage({
                        id: "page.home.exit-editing",
                        defaultMessage: "Exit editing",
                      })
                    : intl.formatMessage({ id: "generic.edit", defaultMessage: "Edit" })
                }
                onClick={handleEditDashboard}
              />
            </HStack>
          </Flex>
        </Stack>

        <Stack width="100%" margin="0 auto" maxWidth="container.xl" paddingBottom={20}>
          {isNonNullish(dashboard) && dashboard.modules.length > 0 ? (
            <>
              <DashboardGrid
                initialModules={dashboard.modules ?? []}
                dashboardId={dashboard.id}
                isEditing={isEditing}
                onEditModule={handleEditModule}
                onDeleteModule={handleDeleteModule}
                isReadOnly={dashboard.myEffectivePermission === "READ"}
              />
              {isEditing && isNonNullish(dashboard) ? (
                <Box>
                  <Button
                    ref={bottomAddModuleButtonRef}
                    variant="ghost"
                    leftIcon={<PlusCircleIcon />}
                    onClick={() => handleAddModule(bottomAddModuleButtonRef)}
                    fontWeight={500}
                    isDisabled={
                      dashboard.modules.length >= 20 || dashboard.myEffectivePermission === "READ"
                    }
                  >
                    <FormattedMessage id="page.home.add-module" defaultMessage="Add module" />
                  </Button>
                </Box>
              ) : null}
            </>
          ) : (
            <Stack alignItems="center" justifyContent="center" spacing={6} paddingY={10}>
              <Image
                maxWidth="420px"
                width="100%"
                src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/dashboard/dashboard-empty-state.svg`}
              />
              <Text>
                <FormattedMessage
                  id="page.home.dashboard-empty-state-description"
                  defaultMessage="Add modules to see the metrics you need"
                />
              </Text>
              {isEditing && isNonNullish(dashboard) ? (
                <Box>
                  <Button
                    ref={bottomAddModuleButtonRef}
                    colorScheme="primary"
                    leftIcon={<AddIcon />}
                    onClick={() => handleAddModule(bottomAddModuleButtonRef)}
                    fontWeight={500}
                    isDisabled={
                      dashboard.modules.length >= 20 || dashboard.myEffectivePermission === "READ"
                    }
                  >
                    <FormattedMessage id="page.home.add-module" defaultMessage="Add module" />
                  </Button>
                </Box>
              ) : null}
            </Stack>
          )}
        </Stack>
      </Stack>
      {isNonNullish(dashboard) ? (
        <DashboardModuleDrawer
          key={selectedModule?.id}
          finalFocusRef={addModuleButtonRef}
          isOpen={isOpen}
          onClose={handleCloseDrawer}
          dashboardId={dashboard.id}
          module={selectedModule}
        />
      ) : null}
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
          ...DashboardTabs_Dashboard
        }
      }
      ${DashboardTabs.fragments.Dashboard}
    `;
  },
  get DashboardModule() {
    return gql`
      fragment Home_DashboardModule on DashboardModule {
        id
        title
        size
        ...DashboardModule_DashboardModule
        ...DashboardModuleDrawer_DashboardModule
      }
      ${DashboardModule.fragments.DashboardModule}
      ${DashboardModuleDrawer.fragments.DashboardModule}
    `;
  },
};

const _queries = [
  gql`
    query Home_user {
      metadata {
        browserName
      }
      ...AppLayout_Query
      me {
        ...Home_User
        organization {
          id
        }
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
        myEffectivePermission
        modules {
          id
          ...Home_DashboardModule
        }
      }
    }
    ${Home.fragments.DashboardModule}
  `,
];

const _mutations = [
  gql`
    mutation Home_createDashboard($name: String!) {
      createDashboard(name: $name) {
        id
        ...DashboardTabs_Dashboard
      }
    }
    ${DashboardTabs.fragments.Dashboard}
  `,
  gql`
    mutation Home_deleteDashboardModule($dashboardId: GID!, $moduleId: GID!) {
      deleteDashboardModule(dashboardId: $dashboardId, moduleId: $moduleId) {
        id
        modules {
          id
        }
      }
    }
  `,
  gql`
    mutation Home_updateDashboard($id: GID!, $name: String!) {
      updateDashboard(id: $id, name: $name) {
        id
        name
      }
    }
  `,
  gql`
    mutation Home_cloneDashboard($id: GID!, $name: String!) {
      cloneDashboard(id: $id, name: $name) {
        id
        name
      }
    }
  `,
  gql`
    mutation Home_deleteDashboard($id: GID!) {
      deleteDashboard(id: $id)
    }
  `,
  gql`
    mutation Home_updateDashboardModulePositions($dashboardId: GID!, $moduleIds: [GID!]!) {
      updateDashboardModulePositions(dashboardId: $dashboardId, moduleIds: $moduleIds) {
        id
        modules {
          id
        }
      }
    }
  `,
  gql`
    mutation Home_reorderDashboards($ids: [GID!]!) {
      reorderDashboards(ids: $ids) {
        id
      }
    }
  `,
];

Home.getInitialProps = async ({ fetchQuery, query, pathname }: WithApolloDataContext) => {
  const state = parseQuery(query, QUERY_STATE);
  const { data } = await fetchQuery(Home_userDocument);
  const dashboardId = data.me.dashboards.find((d) => d.id === state.dashboard)?.id;

  if (isNonNullish(dashboardId ?? data.me.dashboards[0]?.id)) {
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

  return { metadata: data.metadata };
};

export default compose(
  withMetadata,
  withDialogs,
  withFeatureFlag("DASHBOARDS", "/app/petitions"),
  withPermission("DASHBOARDS:LIST_DASHBOARDS", { orPath: "/app/petitions" }),
  withApolloData,
)(Home);

interface DashboardGridProps {
  initialModules: Home_DashboardModuleFragment[];
  dashboardId: string | null | undefined;
  isEditing: boolean;
  isReadOnly: boolean;
  onEditModule: (module: Home_DashboardModuleFragment) => void;
  onDeleteModule: (moduleId: string) => void;
}

const DashboardGrid = memo(
  ({
    initialModules,
    dashboardId,
    isEditing,
    isReadOnly,
    onEditModule,
    onDeleteModule,
  }: DashboardGridProps) => {
    const [modules, setModules] = useState<Home_DashboardModuleFragment[]>(initialModules);
    const [activeId, setActiveId] = useState<string | null>(null);

    const showGenericErrorToast = useGenericErrorToast();

    const [updateDashboardModulePositions] = useMutation(
      Home_updateDashboardModulePositionsDocument,
    );

    useEffect(() => {
      setModules(initialModules);
    }, [initialModules]);

    const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

    const saveModuleOrder = useDebouncedCallback(
      async () => {
        if (!dashboardId || !isEditing) return;
        try {
          const moduleIds = modules.map((module) => module.id);
          await updateDashboardModulePositions({
            variables: { dashboardId, moduleIds },
          });
        } catch (error) {
          showGenericErrorToast(error);
        }
      },
      300,
      [dashboardId, isEditing, modules, updateDashboardModulePositions, showGenericErrorToast],
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
      setActiveId(event.active.id as string);
    }, []);

    const handleDragOver = useCallback((event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        setModules((currentModules) => {
          const oldIndex = currentModules.findIndex((m) => m.id === active.id);
          const newIndex = currentModules.findIndex((m) => m.id === over.id);
          return arrayMove(currentModules, oldIndex, newIndex);
        });
      }
    }, []);

    const handleDragEnd = useCallback(() => {
      if (activeId) {
        saveModuleOrder();
      }
      setActiveId(null);
    }, [activeId, saveModuleOrder]);

    const handleDragCancel = useCallback(() => {
      setActiveId(null);
    }, []);

    const activeModule = useMemo(
      () => (activeId ? modules.find((m) => m.id === activeId) : null),
      [activeId, modules],
    );

    const moduleIds = useMemo(() => modules.map((module) => module.id), [modules]);

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext
          items={moduleIds}
          disabled={!isEditing || isReadOnly}
          strategy={() => null}
        >
          <Grid
            gridGap={4}
            templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
            gridAutoRows="130px"
          >
            {modules.map((module) => (
              <SortableDashboardModule
                key={module.id}
                module={module}
                id={module.id}
                isEditing={isEditing}
                onDelete={() => onDeleteModule(module.id)}
                onEdit={() => onEditModule(module)}
                isDragging={false}
                isReadOnly={isReadOnly}
              />
            ))}
          </Grid>
        </SortableContext>
        <DragOverlay>
          {activeModule ? (
            <DashboardModuleComponent
              id={activeModule.id}
              module={activeModule}
              isDragging
              isEditing={isEditing}
              onEdit={noop}
              onDelete={noop}
              isReadOnly={isReadOnly}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  },
);

DashboardGrid.displayName = "DashboardGrid";
