import { gql, useMutation } from "@apollo/client";
import { Box, Button, Flex, MenuDivider, MenuItem, MenuList, Square, Text } from "@chakra-ui/react";
import { CopyIcon, DeleteIcon, EditIcon, StarEmptyIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { MoreOptionsMenuButton } from "@parallel/components/common/MoreOptionsMenuButton";
import {
  PetitionListViewFiltersInput,
  ViewTabs_createPetitionListViewDocument,
  ViewTabs_deletePetitionListViewDocument,
  ViewTabs_markPetitionListViewAsDefaultDocument,
  ViewTabs_PetitionListViewFragment,
  ViewTabs_reorderPetitionListViewsDocument,
  ViewTabs_updatePetitionListViewDocument,
} from "@parallel/graphql/__types";
import { PetitionsQueryState } from "@parallel/pages/app/petitions";
import { SetQueryState } from "@parallel/utils/queryState";
import { Reorder } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, omit } from "remeda";
import { ConfirmDialog } from "../common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "../common/dialogs/DialogProvider";
import { RadioTab, RadioTabList } from "../common/RadioTab";
import { SearchInOptions } from "../common/SearchAllOrCurrentFolder";
import { TableSortingDirection } from "../common/Table";
import { useAskViewNameDialog } from "./AskViewNameDialog";

const MIN_TAB_WIDTH = 96;

interface ViewTabsProps {
  state: PetitionsQueryState;
  onStateChange: SetQueryState<Partial<PetitionsQueryState>>;
  views: ViewTabs_PetitionListViewFragment[];
  onReorder: (values: any) => void;
}

export const ViewTabs = Object.assign(
  chakraForwardRef<"div", ViewTabsProps>(function ViewTabs(
    { state, onStateChange, views, onReorder },
    ref
  ) {
    const intl = useIntl();
    const lastViews = useRef(views);

    useEffect(() => {
      if (views.length && views.length != lastViews.current.length) {
        handleViewChange(views.at(-1)!.id);
      }
      lastViews.current = views;
    }, [views]);

    const showAskViewNameDialog = useAskViewNameDialog();
    const handleViewChange = async (viewId: string) => {
      if (viewId !== "ALL") {
        const view = views.find((v) => v.id === viewId);
        if (isDefined(view)) {
          const sortBy = view.sortBy ? view.sortBy.split("_") : null;
          const { status, tags, sharedWith, signature, fromTemplateId, search, searchIn, path } =
            view.filters;

          onStateChange({
            view: view.id,
            status,
            tags,
            sharedWith,
            signature,
            fromTemplateId: fromTemplateId ? [fromTemplateId] : undefined,
            search,
            searchIn: (searchIn as SearchInOptions) ?? undefined,
            path: path ?? undefined,
            sort: sortBy
              ? {
                  field: sortBy[0] as any,
                  direction: sortBy[1] as TableSortingDirection,
                }
              : undefined,
          });
        }
      } else {
        onStateChange({ view: "ALL" });
      }
    };

    const [updatePetitionListView] = useMutation(ViewTabs_updatePetitionListViewDocument);
    const createRenameViewClickHandler = (view: ViewTabs_PetitionListViewFragment) => async () => {
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
            <FormattedMessage
              id="component.view-tabs.rename-view-confirm"
              defaultMessage="Rename"
            />
          ),
        });

        await updatePetitionListView({
          variables: { petitionListViewId: view.id, data: { name } },
        });
      } catch {}
    };

    const [createPetitionListView] = useMutation(ViewTabs_createPetitionListViewDocument);
    const createCloneViewClickHandler = (view: ViewTabs_PetitionListViewFragment) => async () => {
      try {
        const name = await showAskViewNameDialog({
          name: view.name,
          header: (
            <FormattedMessage id="component.view-tabs.clone-view" defaultMessage="Clone view" />
          ),
          confirm: (
            <FormattedMessage id="component.view-tabs.clone-view" defaultMessage="Clone view" />
          ),
        });
        await createPetitionListView({
          variables: {
            name,
            filters: omit(view.filters, ["__typename"]) as PetitionListViewFiltersInput,
            sortBy: view.sortBy as any,
          },
        });
      } catch {}
    };

    const [markPetitionListViewAsDefault] = useMutation(
      ViewTabs_markPetitionListViewAsDefaultDocument
    );
    const createMarkViewAsDefaultClickHandler =
      (view: ViewTabs_PetitionListViewFragment) => async () => {
        try {
          await markPetitionListViewAsDefault({ variables: { petitionListViewId: view.id } });
        } catch {}
      };

    const [deletePetitionListView] = useMutation(ViewTabs_deletePetitionListViewDocument);
    const showConfirmDeleteViewDialog = useDialog(ConfirmDeleteViewDialog);
    const createDeleteViewClickHandler = (view: ViewTabs_PetitionListViewFragment) => async () => {
      try {
        await showConfirmDeleteViewDialog({ name: view.name });
        await deletePetitionListView({ variables: { id: view.id } });
        handleViewChange("ALL");
      } catch {}
    };

    const [viewIds, setViewIds] = useState(() => views.map((v) => v.id));
    useEffect(() => {
      setViewIds(views.map((v) => v.id));
    }, [views.map((v) => v.id).join(",")]);

    const [draggedViewId, setDraggedViewId] = useState<string | null>(null);

    const createDragStartHandler = (view: ViewTabs_PetitionListViewFragment) => () => {
      setDraggedViewId(view.id);
    };

    const [reorderPetitionListViews] = useMutation(ViewTabs_reorderPetitionListViewsDocument);
    const createDragEndHandler = (view: ViewTabs_PetitionListViewFragment) => async () => {
      setDraggedViewId(null);
      onReorder(viewIds);
      try {
        await reorderPetitionListViews({ variables: { ids: viewIds } });
      } catch {}
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
                    fromTemplateId: null,
                    path: null,
                    search: null,
                    searchIn: null,
                    sharedWith: null,
                    signature: null,
                    status: null,
                    tags: null,
                  },
                  sortBy: "sentAt_DESC",
                  isDefault: false,
                } as ViewTabs_PetitionListViewFragment,
                ...viewIds.map((id) => views.find((v) => v.id === id)!),
              ].map(
                (view) =>
                  view && (
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
                  )
              )}
            </Flex>
          </RadioTabList>
        </Flex>
      </>
    );
  }),
  {
    fragments: {
      get PetitionListViewFilters() {
        return gql`
          fragment ViewTabs_PetitionListViewFilters on PetitionListViewFilters {
            status
            sharedWith {
              operator
              filters {
                value
                operator
              }
            }
            tags
            signature
            fromTemplateId
            search
            searchIn
            path
          }
        `;
      },
      get PetitionListView() {
        return gql`
          fragment ViewTabs_PetitionListView on PetitionListView {
            id
            name
            filters {
              ...ViewTabs_PetitionListViewFilters
            }
            sortBy
            isDefault
          }
          ${this.PetitionListViewFilters}
        `;
      },
      get User() {
        return gql`
          fragment ViewTabs_User on User {
            id
            petitionListViews {
              ...ViewTabs_PetitionListView
            }
          }
          ${this.PetitionListView}
        `;
      },
    },
  }
);

const _mutations = [
  gql`
    mutation ViewTabs_reorderPetitionListViews($ids: [GID!]!) {
      reorderPetitionListViews(ids: $ids) {
        ...ViewTabs_User
      }
    }
    ${ViewTabs.fragments.User}
  `,
  gql`
    mutation ViewTabs_deletePetitionListView($id: GID!) {
      deletePetitionListView(id: $id) {
        ...Petitions_User
      }
    }
    ${ViewTabs.fragments.User}
  `,
  gql`
    mutation ViewTabs_createPetitionListView(
      $name: String!
      $filters: PetitionListViewFiltersInput
      $sortBy: QueryPetitions_OrderBy
    ) {
      createPetitionListView(name: $name, filters: $filters, sortBy: $sortBy) {
        ...ViewTabs_PetitionListView
        user {
          ...ViewTabs_User
        }
      }
    }
    ${ViewTabs.fragments.User}
    ${ViewTabs.fragments.PetitionListView}
  `,
  gql`
    mutation ViewTabs_updatePetitionListView(
      $petitionListViewId: GID!
      $data: UpdatePetitionListViewInput!
    ) {
      updatePetitionListView(petitionListViewId: $petitionListViewId, data: $data) {
        ...ViewTabs_PetitionListView
        user {
          ...ViewTabs_User
        }
      }
    }
    ${ViewTabs.fragments.User}
    ${ViewTabs.fragments.PetitionListView}
  `,
  gql`
    mutation ViewTabs_markPetitionListViewAsDefault($petitionListViewId: GID) {
      markPetitionListViewAsDefault(petitionListViewId: $petitionListViewId) {
        ...ViewTabs_User
      }
    }
    ${ViewTabs.fragments.User}
  `,
];

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
                      id="component.view-tabs.action-clone-view"
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
