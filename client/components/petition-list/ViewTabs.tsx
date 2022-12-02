import { Box, Button, Flex, MenuDivider, MenuItem, MenuList, Square, Text } from "@chakra-ui/react";
import { CopyIcon, DeleteIcon, EditIcon, StarEmptyIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { MoreOptionsMenuButton } from "@parallel/components/common/MoreOptionsMenuButton";
import { PetitionsQueryState } from "@parallel/pages/app/petitions";
import { SetQueryState } from "@parallel/utils/queryState";
import { Reorder } from "framer-motion";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { ConfirmDialog } from "../common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "../common/dialogs/DialogProvider";
import { RadioTab, RadioTabList } from "../common/RadioTab";
import { useAskViewNameDialog } from "./AskViewNameDialog";

const MIN_TAB_WIDTH = 96;

interface View {
  id: string;
  name: string;
  filters: Partial<
    Pick<
      PetitionsQueryState,
      | "status"
      | "tags"
      | "sharedWith"
      | "signature"
      | "fromTemplateId"
      | "search"
      | "searchIn"
      | "path"
    >
  >;
  sortBy: PetitionsQueryState["sort"];
}

interface ViewTabsProps {
  state: PetitionsQueryState;
  onStateChange: SetQueryState<Partial<PetitionsQueryState>>;
  views: View[];
  onReorder: (values: any) => void;
}

export const ViewTabs = chakraForwardRef<"div", ViewTabsProps>(function ViewTabs(
  { state, onStateChange, views, onReorder },
  ref
) {
  const intl = useIntl();

  const showAskViewNameDialog = useAskViewNameDialog();

  const handleViewChange = async (viewId: string) => {
    if (viewId !== "ALL") {
      const view = views.find((v) => v.id === viewId);
      if (isDefined(view)) {
        onStateChange({
          view: view.id,
          ...view.filters,
          sort: view.sortBy,
        });
      }
    } else {
      onStateChange({ view: "ALL" });
    }
  };

  const createRenameViewClickHandler = (view: View) => async () => {
    try {
      const name = await showAskViewNameDialog({
        name: view.name,
        header: (
          <FormattedMessage
            id="component.view-tabs.rename-view-header"
            defaultMessage="Rename view"
          />
        ),
        confirm: (
          <FormattedMessage id="component.view-tabs.rename-view-confirm" defaultMessage="Rename" />
        ),
      });
    } catch {}
  };

  const createCloneViewClickHandler = (view: View) => async () => {
    try {
      const name = await showAskViewNameDialog({
        name: view.name,
        header: (
          <FormattedMessage
            id="component.view-tabs.clone-view-header"
            defaultMessage="Clone view"
          />
        ),
        confirm: (
          <FormattedMessage id="component.view-tabs.create-view" defaultMessage="Clone view" />
        ),
      });
    } catch {}
  };

  const createMarkViewAsDefaultClickHandler = (view: View) => async () => {
    try {
    } catch {}
  };

  const createDeleteViewClickHandler = (view: View) => async () => {
    try {
    } catch {}
  };

  const showConfirmDeleteViewDialog = useDialog(ConfirmDeleteViewDialog);
  const handleDeleteViewClick = (view: View) => async () => {
    try {
      await showConfirmDeleteViewDialog({ name: view.name });
      handleViewChange("ALL");
    } catch {}
  };

  const [viewIds, setViewIds] = useState(() => views.map((v) => v.id));
  useEffect(() => {
    setViewIds(views.map((v) => v.id));
  }, [views.map((v) => v.id).join(",")]);
  const [draggedViewId, setDraggedViewId] = useState<string | null>(null);
  const createDragStartHandler = (view: View) => () => {
    setDraggedViewId(view.id);
  };
  const createDragEndHandler = (view: View) => () => {
    setDraggedViewId(null);
    onReorder(viewIds);
  };

  return (
    <>
      <Flex
        overflowX="auto"
        paddingBottom="1px"
        paddingTop="1px"
        borderTop="1px solid"
        borderX="1px solid"
        borderTopColor="inherit"
        borderLeftColor="inherit"
        borderRightColor="inherit"
        borderTopRadius="md"
        marginTop="-1px"
        marginX="-1px"
      >
        <RadioTabList
          ref={ref}
          variant="enclosed"
          name="view"
          value={state.view!}
          onChange={handleViewChange}
          flex={1}
          minWidth={0}
          marginTop="-1px"
          listStyleType="none"
          position="relative"
        >
          <Flex
            as={Reorder.Group}
            layoutScroll
            axis="x"
            values={views.map((v) => v.id)}
            onReorder={setViewIds}
            marginTop="-1px"
            flex={1}
            minWidth={MIN_TAB_WIDTH * (views.length + 1)}
            sx={{
              "> *": { position: "relative" },
              "label:not([data-checked]):after": {
                content: "''",
                borderLeft: "1px solid",
                borderLeftColor: "gray.200",
                height: "24px",
                position: "absolute",
                right: "0",
              },
            }}
          >
            {[
              {
                id: "ALL",
                name: intl.formatMessage({
                  id: "generic.all-templates-short",
                  defaultMessage: "All",
                }),
                filters: {
                  status: null,
                  tags: null,
                  sharedWith: null,
                },
                sortBy: { field: "sentAt", direction: "DESC" },
              } as View,
              ...viewIds.map((id) => views.find((v) => v.id === id)!),
            ].map((view) => (
              <ViewTab
                key={view.id}
                view={view}
                isActive={state.view === view.id}
                draggedViewId={draggedViewId}
                onRenameView={createRenameViewClickHandler(view)}
                onCloneView={createCloneViewClickHandler(view)}
                onMarkViewAsDefault={createMarkViewAsDefaultClickHandler(view)}
                onDeleteView={createDeleteViewClickHandler(view)}
                onDragStart={createDragStartHandler(view)}
                onDragEnd={createDragEndHandler(view)}
              />
            ))}
          </Flex>
        </RadioTabList>
      </Flex>
    </>
  );
});

interface ViewTabProps {
  view: {
    id: string;
    name: string;
  };
  isActive?: boolean;
  draggedViewId: string | null;
  onRenameView: () => void;
  onCloneView: () => void;
  onMarkViewAsDefault: () => void;
  onDeleteView: () => void;
  onDragStart: () => void;
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
  return (
    <Flex
      {...((view.id === "ALL"
        ? { as: "li" }
        : {
            as: Reorder.Item,
            value: view.id,
            onDragStart,
            onDragEnd,
          }) as any)}
      userSelect="none"
      marginLeft="-1px"
      minWidth={`${MIN_TAB_WIDTH}px`}
      flexShrink={1}
      aria-grabbed={draggedViewId === view.id}
      _grabbed={{
        "> *": { border: "1px solid", borderColor: "inherit" },
      }}
    >
      <RadioTab
        value={view.id}
        flex={1}
        minWidth={0}
        _focus={{ boxShadow: "none" }}
        paddingRight={{ base: 1, sm: 2 }}
        gap={{ base: 1, sm: 2 }}
        backgroundColor="white"
        backgroundClip="padding-box"
      >
        <Box flex={1} isTruncated>
          {view.name}
        </Box>
        <Square size={6}>
          {isActive ? (
            <MoreOptionsMenuButton
              size="xs"
              variant="ghost"
              options={
                <MenuList minWidth="160px">
                  <MenuItem
                    isDisabled={view.id === "ALL"}
                    icon={<EditIcon />}
                    onClick={onRenameView}
                  >
                    <FormattedMessage
                      id="component.view-tabs.action-rename-view"
                      defaultMessage="Rename view"
                    />
                  </MenuItem>
                  <MenuItem icon={<CopyIcon />} onClick={onCloneView}>
                    <FormattedMessage
                      id="component.view-tabs.action-rename-view"
                      defaultMessage="Clone view"
                    />
                  </MenuItem>
                  <MenuItem
                    isDisabled={view.id === "ALL"}
                    icon={<StarEmptyIcon />}
                    onClick={onMarkViewAsDefault}
                  >
                    <FormattedMessage
                      id="component.view-tabs.action-mark-as-default"
                      defaultMessage="Mark as default"
                    />
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem
                    isDisabled={view.id === "ALL"}
                    color="red.600"
                    icon={<DeleteIcon />}
                    onClick={onDeleteView}
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
          id="components.view-tabs.confirm-delete-header"
          defaultMessage="Delete view"
        />
      }
      body={
        <Text>
          <FormattedMessage
            id="components.view-tabs.confirm-delete-body"
            defaultMessage="Are you sure you want to delete <b>{name}</b>?"
            values={{ name }}
          />
        </Text>
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.confirm-delete-button" defaultMessage="Yes, delete" />
        </Button>
      }
      {...props}
    />
  );
}
