import { gql, useMutation } from "@apollo/client";
import {
  Box,
  Button,
  Flex,
  MenuDivider,
  MenuItem,
  MenuList,
  Square,
  Text,
  useToast,
} from "@chakra-ui/react";
import { CopyIcon, DeleteIcon, EditIcon, StarEmptyIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { isDialogError } from "@parallel/components/common/dialogs/DialogProvider";
import { MoreOptionsMenuButton } from "@parallel/components/common/MoreOptionsMenuButton";
import {
  ViewTabs_createPetitionListViewDocument,
  ViewTabs_deletePetitionListViewDocument,
  ViewTabs_markPetitionListViewAsDefaultDocument,
  ViewTabs_PetitionListViewFragment,
  ViewTabs_reorderPetitionListViewsDocument,
  ViewTabs_updatePetitionListViewDocument,
} from "@parallel/graphql/__types";
import { PetitionsQueryState } from "@parallel/pages/app/petitions";
import { SetQueryState } from "@parallel/utils/queryState";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { Reorder } from "framer-motion";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, omit } from "remeda";
import { ConfirmDialog } from "../common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "../common/dialogs/DialogProvider";
import { RadioTab, RadioTabList } from "../common/RadioTab";
import { useAskViewNameDialog } from "./AskViewNameDialog";

const MIN_TAB_WIDTH = 96;

interface ViewTabsProps {
  state: PetitionsQueryState;
  onStateChange: SetQueryState<Partial<PetitionsQueryState>>;
  views: ViewTabs_PetitionListViewFragment[];
}

export const ViewTabs = Object.assign(
  chakraForwardRef<"div", ViewTabsProps>(function ViewTabs({ state, onStateChange, views }, ref) {
    const intl = useIntl();
    const toast = useToast();
    const showGenericErrorToast = useGenericErrorToast();

    const showAskViewNameDialog = useAskViewNameDialog();
    const handleViewChange = async (viewId: string) => {
      if (viewId !== "ALL") {
        const view = views.find((v) => v.id === viewId);
        if (isNonNullish(view)) {
          onStateChange({
            view: view.id,
            ...omit(view.data, ["__typename"]),
          });
        }
      } else {
        onStateChange({ view: "ALL" });
      }
    };

    const hasDefaultView = views.some((v) => v.isDefault);

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
          variables: { petitionListViewId: view.id, name },
        });
      } catch (error) {
        if (isDialogError(error)) {
          return;
        } else {
          showGenericErrorToast(error);
        }
      }
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
        const { data } = await createPetitionListView({
          variables: {
            name,
            data: {
              ...omit(view.data, ["__typename", "sharedWith", "tagsFilters", "sort"]),
              sharedWith: isNonNullish(view.data.sharedWith)
                ? {
                    ...omit(view.data.sharedWith, ["__typename"]),
                    filters: view.data.sharedWith.filters.map(omit(["__typename"])),
                  }
                : view.data.sharedWith,
              tagsFilters: isNonNullish(view.data.tagsFilters)
                ? {
                    ...omit(view.data.tagsFilters, ["__typename"]),
                    filters: view.data.tagsFilters.filters.map(omit(["__typename"])),
                  }
                : view.data.tagsFilters,
              sort: isNonNullish(view.data.sort)
                ? omit(view.data.sort, ["__typename"])
                : view.data.sort,
            },
          },
        });
        if (isNonNullish(data)) {
          onStateChange({
            view: data.createPetitionListView.id,
            ...omit(data.createPetitionListView.data, ["__typename"]),
          });
        }
      } catch (error) {
        if (isDialogError(error)) {
          return;
        } else {
          showGenericErrorToast(error);
        }
      }
    };

    const [markPetitionListViewAsDefault] = useMutation(
      ViewTabs_markPetitionListViewAsDefaultDocument,
    );
    const createMarkViewAsDefaultClickHandler =
      (view: ViewTabs_PetitionListViewFragment) => async () => {
        try {
          await markPetitionListViewAsDefault({
            variables: { petitionListViewId: view.id === "ALL" ? null : view.id },
          });
          toast({
            isClosable: true,
            status: "success",
            title: intl.formatMessage({
              id: "component.view-tabs.new-default-view",
              defaultMessage: "New default view",
            }),
            description: intl.formatMessage({
              id: "component.view-tabs.new-default-view-description",
              defaultMessage: "It will be the first one you will see when you enter.",
            }),
          });
        } catch (error) {
          showGenericErrorToast(error);
        }
      };

    const [deletePetitionListView] = useMutation(ViewTabs_deletePetitionListViewDocument);
    const showConfirmDeleteViewDialog = useDialog(ConfirmDeleteViewDialog);
    const createDeleteViewClickHandler = (view: ViewTabs_PetitionListViewFragment) => async () => {
      try {
        await showConfirmDeleteViewDialog({ name: view.name });
        await deletePetitionListView({ variables: { id: view.id } });
        const defaultView = views.find((v) => v.isDefault && v.id !== view.id);
        handleViewChange(defaultView ? defaultView.id : "ALL");
      } catch (error) {
        if (isDialogError(error)) {
          return;
        } else {
          showGenericErrorToast(error);
        }
      }
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
      try {
        await reorderPetitionListViews({ variables: { ids: viewIds } });
      } catch (error) {
        showGenericErrorToast(error);
      }
    };

    return (
      <>
        <Flex
          data-section="petition-list-views"
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
              onReorder={setViewIds as any}
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
              {[
                {
                  id: "ALL",
                  name: intl.formatMessage({
                    id: "generic.all",
                    defaultMessage: "All",
                  }),
                  data: {
                    fromTemplateId: null,
                    path: "/",
                    search: null,
                    searchIn: "EVERYWHERE",
                    sharedWith: null,
                    signature: null,
                    status: null,
                    tagsFilters: null,
                    sort: { field: "sentAt", direction: "DESC" },
                  },
                  isDefault: hasDefaultView ? false : true,
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
                  ),
              )}
            </Flex>
          </RadioTabList>
        </Flex>
      </>
    );
  }),
  {
    fragments: {
      get PetitionListViewData() {
        return gql`
          fragment ViewTabs_PetitionListViewData on PetitionListViewData {
            status
            sharedWith {
              operator
              filters {
                value
                operator
              }
            }
            tagsFilters {
              operator
              filters {
                value
                operator
              }
            }
            signature
            fromTemplateId
            search
            searchIn
            path
            sort {
              field
              direction
            }
            columns
          }
        `;
      },
      get PetitionListView() {
        return gql`
          fragment ViewTabs_PetitionListView on PetitionListView {
            id
            name
            data {
              ...ViewTabs_PetitionListViewData
            }
            isDefault
          }
          ${this.PetitionListViewData}
        `;
      },
      get User() {
        return gql`
          fragment ViewTabs_User on User {
            id
            petitionListViews {
              id
            }
          }
          ${this.PetitionListView}
        `;
      },
    },
  },
);

const _mutations = [
  gql`
    mutation ViewTabs_reorderPetitionListViews($ids: [GID!]!) {
      reorderPetitionListViews(ids: $ids) {
        id
        petitionListViews {
          id
        }
      }
    }
  `,
  gql`
    mutation ViewTabs_deletePetitionListView($id: GID!) {
      deletePetitionListView(id: $id) {
        id
        petitionListViews {
          id
        }
      }
    }
  `,
  gql`
    mutation ViewTabs_createPetitionListView($name: String!, $data: PetitionListViewDataInput!) {
      createPetitionListView(name: $name, data: $data) {
        ...ViewTabs_PetitionListView
        user {
          id
          petitionListViews {
            id
          }
        }
      }
    }
    ${ViewTabs.fragments.PetitionListView}
  `,
  gql`
    mutation ViewTabs_updatePetitionListView(
      $petitionListViewId: GID!
      $name: String
      $data: PetitionListViewDataInput
    ) {
      updatePetitionListView(petitionListViewId: $petitionListViewId, name: $name, data: $data) {
        ...ViewTabs_PetitionListView
        user {
          id
          petitionListViews {
            id
          }
        }
      }
    }
    ${ViewTabs.fragments.PetitionListView}
  `,
  gql`
    mutation ViewTabs_markPetitionListViewAsDefault($petitionListViewId: GID) {
      markPetitionListViewAsDefault(petitionListViewId: $petitionListViewId) {
        id
        petitionListViews {
          id
          isDefault
        }
      }
    }
  `,
];

interface ViewTabProps {
  view: {
    id: string;
    name: string;
    isDefault?: boolean;
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
                    icon={<EditIcon boxSize={4} display="block" />}
                    onClick={onRenameView}
                  >
                    <FormattedMessage
                      id="component.view-tabs.action-rename-view"
                      defaultMessage="Rename view"
                    />
                  </MenuItem>
                  <MenuItem icon={<CopyIcon boxSize={4} display="block" />} onClick={onCloneView}>
                    <FormattedMessage
                      id="component.view-tabs.action-clone-view"
                      defaultMessage="Clone view"
                    />
                  </MenuItem>
                  <MenuItem
                    isDisabled={view.isDefault}
                    icon={<StarEmptyIcon boxSize={4} display="block" />}
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
                    icon={<DeleteIcon boxSize={4} display="block" />}
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
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.confirm-delete-button" defaultMessage="Yes, delete" />
        </Button>
      }
      {...props}
    />
  );
}
