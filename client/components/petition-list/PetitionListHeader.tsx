import { gql, useMutation } from "@apollo/client";
import {
  Box,
  Button,
  Circle,
  HStack,
  Heading,
  MenuItem,
  MenuList,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
  Stack,
  chakra,
  useBreakpointValue,
  useMenuButton,
} from "@chakra-ui/react";
import { Menu, Popover, Tooltip } from "@parallel/chakra/components";
import {
  ChevronDownIcon,
  CloseIcon,
  ColumnsIcon,
  FilterIcon,
  RepeatIcon,
  SaveIcon,
} from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  PetitionListHeader_PetitionListViewFragment,
  PetitionListHeader_createPetitionListViewDocument,
  PetitionListHeader_updatePetitionListViewDocument,
  PetitionListViewData,
  PetitionListViewDataInput,
} from "@parallel/graphql/__types";
import type { PetitionsQueryState } from "@parallel/pages/app/petitions";
import { QueryStateOf, SetQueryState, useBuildStateUrl } from "@parallel/utils/queryState";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import {
  DEFAULT_PETITION_COLUMN_SELECTION,
  PETITIONS_COLUMNS,
  PetitionsTableColumn,
} from "@parallel/utils/usePetitionsTableColumns";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDeepEqual, isNonNullish, omit, pick } from "remeda";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { PathBreadcrumbs } from "../common/PathBreadcrumbs";
import { ResponsiveButtonIcon } from "../common/ResponsiveButtonIcon";
import { SearchAllOrCurrentFolder } from "../common/SearchAllOrCurrentFolder";
import { SearchInput } from "../common/SearchInput";
import { useColumnVisibilityDialog } from "../common/dialogs/ColumnVisibilityDialog";
import { isDialogError } from "../common/dialogs/DialogProvider";
import { useConfirmChangeViewAllDialog } from "../petition-compose/dialogs/ConfirmChangeViewAllDialog";
import { useAskViewNameDialog } from "./AskViewNameDialog";
import { removeInvalidSharedWithFilterLines } from "./filters/shared-with/PetitionListSharedWithFilter";
import { removeInvalidTagFilterLines } from "./filters/tags/PetitionListTagFilter";

export interface PetitionListHeaderProps {
  shape: QueryStateOf<PetitionsQueryState>;
  state: PetitionsQueryState;
  onStateChange: SetQueryState<Partial<PetitionsQueryState>>;
  onReload: () => void;
  views: PetitionListHeader_PetitionListViewFragment[];
}

export function PetitionListHeader({
  shape,
  state,
  onStateChange,
  onReload,
  views,
}: PetitionListHeaderProps) {
  const intl = useIntl();
  const [search, setSearch] = useState(state.search ?? "");

  const showGenericErrorToast = useGenericErrorToast();

  useEffect(() => {
    setSearch(state.search ?? "");
  }, [state.view]);

  const debouncedOnSearchChange = useDebouncedCallback(
    (search) =>
      onStateChange(({ searchIn, ...current }) => ({
        ...current,
        search,
        searchIn: search ? searchIn : "EVERYWHERE",
        page: 1,
      })),
    300,
    [onStateChange],
  );
  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearch(value);
      debouncedOnSearchChange(value || null);
    },
    [debouncedOnSearchChange],
  );

  const buildUrl = useBuildStateUrl(shape);

  const handleSearchInChange = (value: string) => {
    onStateChange((current) => ({
      ...current,
      searchIn: value as PetitionsQueryState["searchIn"],
      page: 1,
    }));
  };

  const isViewDirty = useMemo(() => {
    if (state.type === "TEMPLATE") {
      return false;
    }
    const currentView = views.find((v) =>
      state.view === "ALL" ? v.type === "ALL" : v.id === state.view,
    );

    if (!currentView) return false;

    if (currentView.type === "ALL") {
      // "ALL" view can only update columns and sortBy
      return !viewsAreEqual(
        pick(currentView.data, ["sort", "columns"]),
        pick(state, ["sort", "columns"]),
      );
    }

    return !viewsAreEqual(
      currentView!.data,
      pick(state, [
        "status",
        "tagsFilters",
        "sharedWith",
        "signature",
        "fromTemplateId",
        "search",
        "path",
        "searchIn",
        "sort",
        "columns",
      ]) as Omit<PetitionListViewData, "__typename">,
    );
  }, [state, views]);

  const showAskViewNameDialog = useAskViewNameDialog();
  const [createPetitionListView] = useMutation(PetitionListHeader_createPetitionListViewDocument);
  const handleSaveAsNewViewClick = async () => {
    try {
      const currentView = state.view === "ALL" ? null : views.find((v) => v.id === state.view)!;
      const name = await showAskViewNameDialog({
        name: currentView?.name,
        header: (
          <FormattedMessage
            id="component.petition-list-header.save-as-new-view-header"
            defaultMessage="Create new view"
          />
        ),
        confirm: (
          <FormattedMessage
            id="component.petition-list-header.save-as-new-view-confirm-button"
            defaultMessage="Create view"
          />
        ),
      });
      const { data } = await createPetitionListView({
        variables: {
          name,
          data: {
            tagsFilters: removeInvalidTagFilterLines(state.tagsFilters),
            sharedWith: removeInvalidSharedWithFilterLines(state.sharedWith),
            ...pick(state, [
              "status",
              "signature",
              "fromTemplateId",
              "search",
              "searchIn",
              "path",
              "sort",
              "columns",
            ]),
          } as PetitionListViewDataInput,
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

  const showConfirmChangeViewAllDialog = useConfirmChangeViewAllDialog();
  const [updatePetitionListView] = useMutation(PetitionListHeader_updatePetitionListViewDocument);
  const handleSaveCurrentViewClick = async () => {
    try {
      // If the view to save is ALL and has some filter applied, show the dialog
      // to choose whether to save and ignore the filters or switch to create a new VIEW.
      if (
        state.view === "ALL" &&
        Object.values(
          pick(state, [
            "sharedWith",
            "status",
            "tagsFilters",
            "signature",
            "fromTemplateId",
            "search",
            "searchIn",
            "path",
          ]),
        ).some(isNonNullish)
      ) {
        const action = await showConfirmChangeViewAllDialog();
        if (action === "CREATE_NEW_VIEW") {
          handleSaveAsNewViewClick();
          return;
        }
      }

      const view = views.find((v) =>
        state.view === "ALL" ? v.type === "ALL" : v.id === state.view,
      )!;

      await updatePetitionListView({
        variables: {
          petitionListViewId: view.id,
          ...(view.type === "ALL" ? {} : { name: view.name }),
          data: {
            ...(view.type === "ALL"
              ? // "ALL" view can only update columns and sort
                pick(state, ["sort", "columns"])
              : {
                  tagsFilters: removeInvalidTagFilterLines(state.tagsFilters),
                  sharedWith: removeInvalidSharedWithFilterLines(state.sharedWith),
                  ...pick(state, [
                    "status",
                    "signature",
                    "fromTemplateId",
                    "search",
                    "searchIn",
                    "path",
                    "sort",
                    "columns",
                  ]),
                }),
          } as PetitionListViewDataInput,
        },
      });
    } catch (error) {
      if (!isDialogError(error)) {
        showGenericErrorToast(error);
      }
    }
  };

  const showColumnVisibilityDialog = useColumnVisibilityDialog();
  const handleEditColumns = async () => {
    try {
      const columns = await showColumnVisibilityDialog({
        columns: PETITIONS_COLUMNS,
        selection: state.columns ?? DEFAULT_PETITION_COLUMN_SELECTION,
      });
      onStateChange((current) => ({ ...current, columns }));
    } catch {}
  };

  const selection = state.columns ?? DEFAULT_PETITION_COLUMN_SELECTION;
  const notVisibleFilters = PETITIONS_COLUMNS.filter(
    (c) =>
      !c.isFixed &&
      !selection.includes(c.key as PetitionsTableColumn) &&
      c.isFilterable &&
      Object.entries(state).some(([key, value]) => isNonNullish(value) && key === c.key),
  );

  return (
    <Stack padding={2}>
      <HStack>
        <IconButtonWithTooltip
          onClick={() => onReload()}
          icon={<RepeatIcon />}
          placement="bottom"
          variant="outline"
          label={intl.formatMessage({
            id: "generic.reload-data",
            defaultMessage: "Reload",
          })}
        />
        <Box flex="0 1 400px">
          <SearchInput value={search ?? ""} onChange={handleSearchChange} />
        </Box>
        {notVisibleFilters.length ? (
          <Box>
            <Popover placement="bottom-start">
              <PopoverTrigger>
                <ResponsiveButtonIcon
                  icon={<FilterIcon />}
                  variant="ghost"
                  colorScheme="purple"
                  breakpoint="lg"
                  label={intl.formatMessage(
                    {
                      id: "component.petition-list-header.hidden-filters-button-label",
                      defaultMessage:
                        "{count, plural, =1{# hidden filter} other{# hidden filters}}",
                    },
                    { count: notVisibleFilters.length },
                  )}
                />
              </PopoverTrigger>
              <Portal>
                <PopoverContent width="auto" minWidth="160px">
                  <PopoverBody as={Stack}>
                    <Heading textTransform="uppercase" fontSize="sm" color="gray.600">
                      <FormattedMessage
                        id="component.petition-list-header.hidden-filters-title"
                        defaultMessage="Filters"
                      />
                    </Heading>
                    <Stack as="ul">
                      {notVisibleFilters.map((column) => {
                        return (
                          <HStack as="li" key={column.key}>
                            <Box flex="1">
                              {typeof column.label === "string" ? column.label : column.label(intl)}
                            </Box>
                            <IconButtonWithTooltip
                              variant="ghost"
                              label={intl.formatMessage({
                                id: "component.petition-list-header.remove-filter",
                                defaultMessage: "Remove filter",
                              })}
                              size="xs"
                              icon={<CloseIcon />}
                              onClick={() => {
                                onStateChange((current) => ({
                                  ...omit(current, [column.key as any]),
                                  page: 1,
                                }));
                              }}
                            />
                          </HStack>
                        );
                      })}
                    </Stack>
                  </PopoverBody>
                </PopoverContent>
              </Portal>
            </Popover>
          </Box>
        ) : null}

        {state.type === "PETITION" ? (
          <HStack flex={1} justifyContent="flex-end">
            <ResponsiveButtonIcon
              icon={<ColumnsIcon />}
              variant="outline"
              data-action="edit-columns"
              onClick={handleEditColumns}
              label={intl.formatMessage({
                id: "generic.edit-columns",
                defaultMessage: "Edit columns",
              })}
            />
            <Menu placement="bottom-end">
              <SaveViewMenuButton isDirty={isViewDirty} />
              <Portal>
                <MenuList minWidth="160px">
                  <MenuItem isDisabled={!isViewDirty} onClick={handleSaveCurrentViewClick}>
                    <FormattedMessage
                      id="component.petition-list-header.save-current-view"
                      defaultMessage="Save current view"
                    />
                  </MenuItem>
                  <MenuItem onClick={handleSaveAsNewViewClick}>
                    <FormattedMessage
                      id="component.petition-list-header.save-as-new-view"
                      defaultMessage="Save as new view"
                    />
                  </MenuItem>
                </MenuList>
              </Portal>
            </Menu>
          </HStack>
        ) : null}
      </HStack>
      {state.search ? (
        <SearchAllOrCurrentFolder
          onChange={handleSearchInChange}
          value={state.searchIn}
          path={state.path}
          type={state.type}
        />
      ) : state.path !== "/" ? (
        <PathBreadcrumbs
          path={state.path}
          type={state.type}
          pathUrl={(path) => buildUrl((current) => ({ ...current, path, page: 1 }))}
        />
      ) : null}
    </Stack>
  );
}

const SaveViewMenuButton = chakraForwardRef<"button", { isDirty?: boolean }>(
  function SaveViewMenuButton({ isDirty }, ref) {
    const buttonProps = useMenuButton({}, ref);
    const isSmallScreen = useBreakpointValue({ base: true, md: false });
    const intl = useIntl();
    return (
      <Tooltip
        label={intl.formatMessage({
          id: "component.petition-list-header.save-view-button",
          defaultMessage: "Save view",
        })}
        isDisabled={!isSmallScreen}
        placement="bottom-start"
      >
        <Button
          {...buttonProps}
          paddingX={{ base: 2, md: 3 }}
          data-action="save-petition-list-view"
          aria-label={
            isSmallScreen
              ? intl.formatMessage({
                  id: "component.petition-list-header.save-view-button",
                  defaultMessage: "Save view",
                })
              : undefined
          }
        >
          <chakra.span display="inline-flex" flex="1" pointerEvents="none" alignItems="center">
            {isDirty || isSmallScreen ? (
              <chakra.span marginEnd={isSmallScreen ? 1 : 2}>
                {isDirty ? <Circle size={2} backgroundColor="primary.500" /> : null}
              </chakra.span>
            ) : null}
            <chakra.span>
              <SaveIcon aria-hidden focusable={false} boxSize={4} display="block" />
            </chakra.span>
            <chakra.span marginStart={2} display={{ base: "none", md: "inline" }}>
              {intl.formatMessage({
                id: "component.petition-list-header.save-view-button",
                defaultMessage: "Save view",
              })}
            </chakra.span>
            <chakra.span marginStart={2} display={{ base: "none", md: "inline" }}>
              <ChevronDownIcon aria-hidden focusable={false} />
            </chakra.span>
          </chakra.span>
        </Button>
      </Tooltip>
    );
  },
);

PetitionListHeader.fragments = {
  PetitionListView: gql`
    fragment PetitionListHeader_PetitionListView on PetitionListView {
      id
      name
      data {
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
      isDefault
      type
    }
  `,
};

const _mutations = [
  gql`
    mutation PetitionListHeader_createPetitionListView(
      $name: String!
      $data: PetitionListViewDataInput!
    ) {
      createPetitionListView(name: $name, data: $data) {
        ...PetitionListHeader_PetitionListView
        user {
          id
          petitionListViews {
            id
          }
        }
      }
    }
    ${PetitionListHeader.fragments.PetitionListView}
  `,
  gql`
    mutation PetitionListHeader_updatePetitionListView(
      $petitionListViewId: GID!
      $name: String
      $data: PetitionListViewDataInput
    ) {
      updatePetitionListView(petitionListViewId: $petitionListViewId, name: $name, data: $data) {
        ...PetitionListHeader_PetitionListView
        user {
          id
          petitionListViews {
            id
          }
        }
      }
    }
    ${PetitionListHeader.fragments.PetitionListView}
  `,
];

function viewsAreEqual(view1: Partial<PetitionListViewData>, view2: Partial<PetitionListViewData>) {
  return (
    isDeepEqual(
      omit(view1, ["__typename", "sharedWith", "sort", "tagsFilters"]),
      omit(view2, ["__typename", "sharedWith", "sort", "tagsFilters"]),
    ) &&
    isDeepEqual(
      isNonNullish(view1.sharedWith)
        ? {
            ...omit(view1.sharedWith, ["__typename"]),
            filters: view1.sharedWith.filters.map(omit(["__typename"])),
          }
        : view1.sharedWith,
      isNonNullish(view2.sharedWith)
        ? {
            ...omit(view2.sharedWith, ["__typename"]),
            filters: view2.sharedWith.filters.map(omit(["__typename"])),
          }
        : view2.sharedWith,
    ) &&
    isDeepEqual(
      isNonNullish(view1.sort)
        ? omit(view1.sort, ["__typename"])
        : { field: "sentAt", direction: "DESC" },
      isNonNullish(view2.sort)
        ? omit(view2.sort, ["__typename"])
        : { field: "sentAt", direction: "DESC" },
    ) &&
    isDeepEqual(
      isNonNullish(view1.tagsFilters)
        ? {
            ...omit(view1.tagsFilters, ["__typename"]),
            filters: view1.tagsFilters.filters.map(omit(["__typename"])),
          }
        : view1.tagsFilters,
      isNonNullish(view2.tagsFilters)
        ? {
            ...omit(view2.tagsFilters, ["__typename"]),
            filters: view2.tagsFilters.filters.map(omit(["__typename"])),
          }
        : view2.tagsFilters,
    )
  );
}
