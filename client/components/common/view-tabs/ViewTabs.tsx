import { gql } from "@apollo/client";
import { Box, Flex, MenuDivider, MenuItem, MenuList, Square } from "@chakra-ui/react";
import { CopyIcon, DeleteIcon, EditIcon, StarEmptyIcon } from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import { MoreOptionsMenuButton } from "@parallel/components/common/MoreOptionsMenuButton";
import { useAskNameDialog } from "@parallel/components/petition-list/AskNameDialog";
import { Button, Text } from "@parallel/components/ui";
import { ViewTabs_ListViewFragment } from "@parallel/graphql/__types";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { Reorder } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { ConfirmDialog } from "../dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "../dialogs/DialogProvider";
import { RadioTab, RadioTabList } from "../RadioTab";

const MIN_TAB_WIDTH = 96;

interface ViewTabsProps {
  views: ViewTabs_ListViewFragment[];
  onChange: (viewId: string) => Promise<void>;
  currentViewId: string;
  onRenameView: (viewId: string, name: string) => Promise<void>;
  onCloneView: (viewId: string, name: string) => Promise<void>;
  onMarkViewAsDefault: (viewId: string) => Promise<void>;
  onDeleteView: (viewId: string) => Promise<void>;
  onReorder: (viewIds: string[]) => Promise<void>;
}

export const ViewTabs = chakraComponent<"div", ViewTabsProps>(function ViewTabs({
  ref,
  currentViewId,
  onChange,
  views,
  onRenameView,
  onCloneView,
  onMarkViewAsDefault,
  onDeleteView,
  onReorder,
}) {
  const showGenericErrorToast = useGenericErrorToast();

  const allView = views.find((v) => v.type === "ALL");

  const [viewIds, setViewIds] = useState(() => views.map((v) => v.id));
  useEffect(() => {
    setViewIds(views.map((v) => v.id));
  }, [views.map((v) => v.id).join(",")]);

  const [draggedViewId, setDraggedViewId] = useState<string | null>(null);

  const createDragStartHandler = useCallback((view: ViewTabs_ListViewFragment) => {
    setDraggedViewId(view.id);
  }, []);

  const createDragEndHandler = useCallback(async () => {
    setDraggedViewId(null);
    try {
      await onReorder(viewIds);
    } catch (error) {
      showGenericErrorToast(error);
    }
  }, []);

  const handleReorderViews = useCallback((newOrder: string[]) => {
    // as "ALL" view is fixed in first position and cannot be moved, we need to manually add it to the new order
    setViewIds([allView?.id, ...newOrder].filter(isNonNullish));
  }, []);

  const filteredViews = viewIds.map((id) => views.find((v) => v.id === id)!).filter(isNonNullish);

  // Set views as fallback to avoid flickering when changing between profile types
  const currentViews = filteredViews.length ? filteredViews : views;

  return (
    <Flex
      data-section="list-views"
      overflowX="auto"
      paddingBottom="1px"
      paddingTop="1px"
      borderTop="1px solid"
      borderX="1px solid"
      borderTopColor="inherit"
      borderStartColor="inherit"
      borderEndColor="inherit"
      borderTopRadius="md"
      marginTop="-1px"
      marginX="-1px"
      minHeight="42px"
    >
      <RadioTabList
        ref={ref}
        variant="enclosed"
        name="view"
        value={currentViewId}
        onChange={onChange}
        flex={1}
        minWidth={0}
        marginTop="-1px"
        listStyleType="none"
        position="relative"
      >
        <Flex
          as={Reorder.Group<string>}
          layoutScroll
          axis="x"
          values={views.map((v) => v.id)}
          onReorder={handleReorderViews}
          marginTop="-1px"
          flex={1}
          minWidth={MIN_TAB_WIDTH * (views.length + 1)}
          sx={{
            "> *": { position: "relative" },
            "label:not([data-checked]):after": {
              content: "''",
              borderStart: "1px solid",
              borderStartColor: "gray.200",
              height: "24px",
              position: "absolute",
              insetEnd: "0",
            },
          }}
          backgroundColor="gray.50"
        >
          {currentViews.map((view) => (
            <ViewTab
              key={view.id}
              view={view}
              isActive={view.id === currentViewId}
              draggedViewId={draggedViewId}
              onRenameView={onRenameView}
              onCloneView={onCloneView}
              onMarkViewAsDefault={onMarkViewAsDefault}
              onDeleteView={onDeleteView}
              onDragStart={createDragStartHandler}
              onDragEnd={createDragEndHandler}
            />
          ))}
        </Flex>
      </RadioTabList>
    </Flex>
  );
});

const _fragments = {
  ListView: gql`
    fragment ViewTabs_ListView on ListView {
      id
      name
      type
      isDefault
    }
  `,
};

interface ViewTabProps {
  view: ViewTabs_ListViewFragment;
  isActive?: boolean;
  draggedViewId: string | null;
  onRenameView: (viewId: string, name: string) => void;
  onCloneView: (viewId: string, name: string) => void;
  onMarkViewAsDefault: (viewId: string) => void;
  onDeleteView: (viewId: string) => void;
  onDragStart: (view: ViewTabs_ListViewFragment) => void;
  onDragEnd: () => void;
}

export function ViewTab({
  view,
  isActive,
  draggedViewId,
  onRenameView,
  onCloneView,
  onMarkViewAsDefault,
  onDeleteView,
  onDragStart,
  onDragEnd,
}: ViewTabProps) {
  const intl = useIntl();
  const showAskNameDialog = useAskNameDialog();
  const moreOptionsButtonRef = useRef<HTMLButtonElement>(null);
  const handleRenameViewClick = async function () {
    try {
      const name = await showAskNameDialog({
        name: view.name,
        header: (
          <FormattedMessage
            id="component.view-tabs.rename-view-header"
            defaultMessage="Rename view"
          />
        ),

        confirm: <FormattedMessage id="generic.rename" defaultMessage="Rename" />,
        modalProps: { finalFocusRef: moreOptionsButtonRef },
      });
      onRenameView(view.id, name);
    } catch {}
  };
  const handleCloneViewClick = async function () {
    try {
      const name = await showAskNameDialog({
        name:
          view.type === "ALL"
            ? intl.formatMessage({ id: "generic.all-view", defaultMessage: "All" })
            : view.name,
        header: (
          <FormattedMessage id="component.view-tabs.clone-view" defaultMessage="Clone view" />
        ),

        confirm: (
          <FormattedMessage id="component.view-tabs.clone-view" defaultMessage="Clone view" />
        ),

        modalProps: { finalFocusRef: moreOptionsButtonRef },
      });
      onCloneView(view.id, name);
    } catch {}
  };
  const showConfirmDeleteViewDialog = useDialog(ConfirmDeleteViewDialog);
  const handleDeleteViewClick = async function () {
    try {
      await showConfirmDeleteViewDialog({ name: view.name });
      onDeleteView(view.id);
    } catch {}
  };
  const handleMarkViewAsDefaultClick = async function () {
    onMarkViewAsDefault(view.id);
  };
  return (
    <Flex
      {...((view.type === "ALL"
        ? { as: "li" }
        : {
            as: Reorder.Item,
            value: view.id,
            onDragStart,
            onDragEnd,
          }) as any)}
      userSelect="none"
      marginStart="-1px"
      minWidth={`${MIN_TAB_WIDTH}px`}
      flexShrink={1}
      aria-grabbed={draggedViewId === view.id}
      _grabbed={{
        "> *": { border: "1px solid", borderColor: "inherit" },
      }}
      data-petition-list-view-id={view.id}
    >
      <RadioTab
        value={view.id}
        flex={1}
        minWidth={0}
        _focus={{ boxShadow: "none" }}
        paddingEnd={{ base: 1, sm: 2 }}
        gap={{ base: 1, sm: 2 }}
        backgroundColor={isActive ? "white" : "gray.50"}
        backgroundClip="padding-box"
      >
        <Box flex={1} isTruncated>
          {view.type === "ALL" ? (
            <FormattedMessage id="generic.all-view" defaultMessage="All" />
          ) : (
            view.name
          )}
        </Box>
        <Square size={6}>
          {isActive ? (
            <MoreOptionsMenuButton
              ref={moreOptionsButtonRef}
              size="xs"
              variant="ghost"
              options={
                <MenuList minWidth="160px">
                  <MenuItem
                    isDisabled={view.type === "ALL"}
                    icon={<EditIcon boxSize={4} display="block" />}
                    onClick={handleRenameViewClick}
                  >
                    <FormattedMessage
                      id="component.view-tabs.action-rename-view"
                      defaultMessage="Rename view"
                    />
                  </MenuItem>
                  <MenuItem
                    icon={<CopyIcon boxSize={4} display="block" />}
                    onClick={handleCloneViewClick}
                  >
                    <FormattedMessage
                      id="component.view-tabs.action-clone-view"
                      defaultMessage="Clone view"
                    />
                  </MenuItem>
                  <MenuItem
                    isDisabled={view.isDefault}
                    icon={<StarEmptyIcon boxSize={4} display="block" />}
                    onClick={handleMarkViewAsDefaultClick}
                  >
                    <FormattedMessage
                      id="component.view-tabs.action-mark-as-default"
                      defaultMessage="Mark as default"
                    />
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem
                    isDisabled={view.type === "ALL"}
                    color="red.600"
                    icon={<DeleteIcon boxSize={4} display="block" />}
                    onClick={handleDeleteViewClick}
                  >
                    <FormattedMessage
                      id="component.view-tabs.action-delete-view"
                      defaultMessage="Delete view"
                    />
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

function ConfirmDeleteViewDialog({ name, ...props }: DialogProps<{ name: string }>) {
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.view-tabs.confirm-delete-header"
          defaultMessage="Delete view"
        />
      }
      body={
        <Text>
          <FormattedMessage
            id="component.view-tabs.confirm-delete-body"
            defaultMessage="Are you sure you want to delete <b>{name}</b>?"
            values={{ name }}
          />
        </Text>
      }
      confirm={
        <Button colorPalette="red" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.confirm-delete-button" defaultMessage="Yes, delete" />
        </Button>
      }
      {...props}
    />
  );
}
