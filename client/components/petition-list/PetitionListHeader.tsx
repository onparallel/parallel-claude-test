import { gql, useMutation } from "@apollo/client";
import {
  Box,
  Button,
  chakra,
  Circle,
  Flex,
  HStack,
  Menu,
  MenuItem,
  MenuList,
  Portal,
  Stack,
  Tooltip,
  useBreakpointValue,
  useMenuButton,
} from "@chakra-ui/react";
import { ChevronDownIcon, RepeatIcon, SaveIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  PetitionListHeader_createPetitionListViewDocument,
  PetitionListHeader_PetitionListViewFragment,
  PetitionListHeader_updatePetitionListViewDocument,
  PetitionListViewFiltersInput,
} from "@parallel/graphql/__types";
import type { PetitionsQueryState } from "@parallel/pages/app/petitions";
import { QueryStateOf, SetQueryState, useBuildStateUrl } from "@parallel/utils/queryState";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { equals, omit, pick } from "remeda";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { PathBreadcrumbs } from "../common/PathBreadcrumbs";
import { SearchAllOrCurrentFolder } from "../common/SearchAllOrCurrentFolder";
import { SearchInput } from "../common/SearchInput";
import { useAskViewNameDialog } from "./AskViewNameDialog";

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
  const debouncedOnSearchChange = useDebouncedCallback(
    (search) =>
      onStateChange(({ searchIn, ...current }) => ({
        ...current,
        search,
        searchIn: search ? searchIn : "EVERYWHERE",
        page: 1,
      })),
    300,
    [onStateChange]
  );
  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearch(value);
      debouncedOnSearchChange(value || null);
    },
    [debouncedOnSearchChange]
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
    const currentView = state.view === "ALL" ? null : views.find((v) => v.id === state.view)!;

    if (!currentView && state.view !== "ALL") return;

    return !equals(
      state.view === "ALL"
        ? {
            sortBy: null,
            filters: {
              status: null,
              tags: null,
              sharedWith: null,
              signature: null,
              fromTemplateId: null,
              search: null,
              searchIn: "EVERYWHERE",
              path: "/",
            },
          }
        : {
            sortBy: currentView!.sortBy,
            filters: {
              ...omit(currentView!.filters, ["__typename"]),
              path: currentView!.filters.path ?? "/",
              searchIn: currentView!.filters.searchIn ?? "EVERYWHERE",
            },
          },
      {
        sortBy: state.sort ? `${state.sort.field}_${state.sort.direction}` : null,
        filters: pick(state, [
          "status",
          "tags",
          "sharedWith",
          "signature",
          "fromTemplateId",
          "search",
          "path",
          "searchIn",
        ]),
      }
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
      await createPetitionListView({
        variables: {
          name,
          filters: pick(state, [
            "status",
            "sharedWith",
            "tags",
            "signature",
            "fromTemplateId",
            "search",
            "searchIn",
            "path",
          ]) as PetitionListViewFiltersInput,
          sortBy: state.sort ? `${state.sort.field}_${state.sort.direction}` : null,
        },
      });
    } catch {}
  };

  const [updatePetitionListView] = useMutation(PetitionListHeader_updatePetitionListViewDocument);
  const handleSaveCurrentViewClick = async () => {
    try {
      if (state.view === "ALL") return;

      const view = views.find((v) => v.id === state.view)!;

      await updatePetitionListView({
        variables: {
          petitionListViewId: view.id,
          data: {
            name: view.name,
            filters: pick(state, [
              "status",
              "sharedWith",
              "tags",
              "signature",
              "fromTemplateId",
              "search",
              "searchIn",
              "path",
            ]) as PetitionListViewFiltersInput,
            sortBy: state.sort ? `${state.sort.field}_${state.sort.direction}` : null,
          },
        },
      });
    } catch {}
  };

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
        {state.type === "PETITION" ? (
          <Flex flex={1} justifyContent="flex-end">
            <Box>
              <Menu placement="bottom-end">
                <SaveViewMenuButton isDirty={isViewDirty} />
                <Portal>
                  <MenuList minWidth="160px">
                    <MenuItem
                      isDisabled={state.view === "ALL"}
                      onClick={handleSaveCurrentViewClick}
                    >
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
            </Box>
          </Flex>
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
      >
        <Button
          {...buttonProps}
          paddingX={{ base: 2, md: 3 }}
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
            {isDirty ? (
              <chakra.span marginRight={2}>
                <Circle size={2} backgroundColor="primary.500" />
              </chakra.span>
            ) : null}
            <chakra.span>
              <SaveIcon aria-hidden focusable={false} />
            </chakra.span>
            <chakra.span marginLeft={2} display={{ base: "none", md: "inline" }}>
              {intl.formatMessage({
                id: "component.petition-list-header.save-view-button",
                defaultMessage: "Save view",
              })}
            </chakra.span>
            <chakra.span marginLeft={2} display={{ base: "none", md: "inline" }}>
              <ChevronDownIcon aria-hidden focusable={false} />
            </chakra.span>
          </chakra.span>
        </Button>
      </Tooltip>
    );
  }
);

const _fragments = {
  get PetitionListViewFilters() {
    return gql`
      fragment PetitionListHeader_PetitionListViewFilters on PetitionListViewFilters {
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
      fragment PetitionListHeader_PetitionListView on PetitionListView {
        id
        name
        filters {
          ...PetitionListHeader_PetitionListViewFilters
        }
        sortBy
        isDefault
      }
      ${this.PetitionListViewFilters}
    `;
  },
  get User() {
    return gql`
      fragment PetitionListHeader_User on User {
        id
        petitionListViews {
          ...PetitionListHeader_PetitionListView
        }
      }
      ${this.PetitionListView}
    `;
  },
};

const _mutations = [
  gql`
    mutation PetitionListHeader_createPetitionListView(
      $name: String!
      $filters: PetitionListViewFiltersInput
      $sortBy: QueryPetitions_OrderBy
    ) {
      createPetitionListView(name: $name, filters: $filters, sortBy: $sortBy) {
        ...PetitionListHeader_PetitionListView
        user {
          ...PetitionListHeader_User
        }
      }
    }
    ${_fragments.User}
    ${_fragments.PetitionListView}
  `,
  gql`
    mutation PetitionListHeader_updatePetitionListView(
      $petitionListViewId: GID!
      $data: UpdatePetitionListViewInput!
    ) {
      updatePetitionListView(petitionListViewId: $petitionListViewId, data: $data) {
        ...PetitionListHeader_PetitionListView
        user {
          ...PetitionListHeader_User
        }
      }
    }
    ${_fragments.User}
    ${_fragments.PetitionListView}
  `,
];
