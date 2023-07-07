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
  PetitionListViewData,
  PetitionListViewDataInput,
} from "@parallel/graphql/__types";
import type { PetitionsQueryState } from "@parallel/pages/app/petitions";
import { QueryStateOf, SetQueryState, useBuildStateUrl } from "@parallel/utils/queryState";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { equals, isDefined, omit, pick } from "remeda";
import { isDialogError } from "../common/dialogs/DialogProvider";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { PathBreadcrumbs } from "../common/PathBreadcrumbs";
import { SearchAllOrCurrentFolder } from "../common/SearchAllOrCurrentFolder";
import { SearchInput } from "../common/SearchInput";
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
    const currentView = state.view === "ALL" ? null : views.find((v) => v.id === state.view)!;

    if (!currentView && state.view !== "ALL") return;

    return !viewsAreEqual(
      state.view === "ALL"
        ? {
            status: null,
            tagsFilters: null,
            sharedWith: null,
            signature: null,
            fromTemplateId: null,
            search: null,
            searchIn: "EVERYWHERE",
            path: "/",
            sort: null,
          }
        : currentView!.data,
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
            ]),
          } as PetitionListViewDataInput,
        },
      });
      if (isDefined(data)) {
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

  const [updatePetitionListView] = useMutation(PetitionListHeader_updatePetitionListViewDocument);
  const handleSaveCurrentViewClick = async () => {
    try {
      if (state.view === "ALL") {
        return;
      }
      const view = views.find((v) => v.id === state.view)!;
      await updatePetitionListView({
        variables: {
          petitionListViewId: view.id,
          name: view.name,
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
            ]),
          } as PetitionListViewDataInput,
        },
      });
    } catch (error) {
      showGenericErrorToast(error);
    }
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
              <chakra.span marginRight={isSmallScreen ? 1 : 2}>
                {isDirty ? <Circle size={2} backgroundColor="primary.500" /> : null}
              </chakra.span>
            ) : null}
            <chakra.span>
              <SaveIcon aria-hidden focusable={false} boxSize={4} display="block" />
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
      }
      isDefault
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

function viewsAreEqual(view1: PetitionListViewData, view2: PetitionListViewData) {
  return (
    equals(
      omit(view1, ["__typename", "sharedWith", "sort", "tagsFilters"]),
      omit(view2, ["__typename", "sharedWith", "sort", "tagsFilters"]),
    ) &&
    equals(
      isDefined(view1.sharedWith)
        ? {
            ...omit(view1.sharedWith, ["__typename"]),
            filters: view1.sharedWith.filters.map(omit(["__typename"])),
          }
        : view1.sharedWith,
      isDefined(view2.sharedWith)
        ? {
            ...omit(view2.sharedWith, ["__typename"]),
            filters: view2.sharedWith.filters.map(omit(["__typename"])),
          }
        : view2.sharedWith,
    ) &&
    equals(
      isDefined(view1.sort)
        ? omit(view1.sort, ["__typename"])
        : { field: "sentAt", direction: "DESC" },
      isDefined(view2.sort)
        ? omit(view2.sort, ["__typename"])
        : { field: "sentAt", direction: "DESC" },
    ) &&
    equals(
      isDefined(view1.tagsFilters)
        ? {
            ...omit(view1.tagsFilters, ["__typename"]),
            filters: view1.tagsFilters.filters.map(omit(["__typename"])),
          }
        : view1.tagsFilters,
      isDefined(view2.tagsFilters)
        ? {
            ...omit(view2.tagsFilters, ["__typename"]),
            filters: view2.tagsFilters.filters.map(omit(["__typename"])),
          }
        : view2.tagsFilters,
    )
  );
}
