import { gql, useMutation } from "@apollo/client";
import { Box, HStack, Stack } from "@chakra-ui/react";
import { ColumnsIcon, RepeatIcon } from "@parallel/chakra/icons";
import {
  PetitionListHeader_PetitionListViewFragment,
  PetitionListHeader_createPetitionListViewDocument,
  PetitionListHeader_updatePetitionListViewDocument,
  PetitionListViewColumn,
  PetitionListViewData,
  PetitionListViewDataInput,
} from "@parallel/graphql/__types";
import type { PetitionsQueryState } from "@parallel/pages/app/petitions";
import { QueryStateOf, SetQueryState, useBuildStateUrl } from "@parallel/utils/queryState";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDeepEqual, isNonNullish, omit, pick } from "remeda";
import { HiddenFiltersButton } from "../common/HiddenFiltersButton";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { PathBreadcrumbs } from "../common/PathBreadcrumbs";
import { ResponsiveButtonIcon } from "../common/ResponsiveButtonIcon";
import { SearchAllOrCurrentFolder } from "../common/SearchAllOrCurrentFolder";
import { SearchInput } from "../common/SearchInput";
import { TableColumn } from "../common/Table";
import { useColumnVisibilityDialog } from "../common/dialogs/ColumnVisibilityDialog";
import { isDialogError } from "../common/dialogs/DialogProvider";
import { SaveViewTabsMenu } from "../common/view-tabs/SaveViewMenuButton";
import { useConfirmChangeViewAllDialog } from "../petition-compose/dialogs/ConfirmChangeViewAllDialog";
import { useAskNameDialog } from "./AskNameDialog";

export interface PetitionListHeaderProps {
  shape: QueryStateOf<PetitionsQueryState>;
  state: PetitionsQueryState;
  columns: TableColumn<any, any, any>[];
  selection: PetitionListViewColumn[];
  onStateChange: SetQueryState<Partial<PetitionsQueryState>>;
  onReload: () => void;
  views: PetitionListHeader_PetitionListViewFragment[];
}

export function PetitionListHeader({
  shape,
  state,
  columns,
  selection,
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

  const saveViewRef = useRef<HTMLButtonElement>(null);

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
        "approvals",
        "sort",
        "columns",
      ]) as Omit<PetitionListViewData, "__typename">,
    );
  }, [state, views]);

  const showAskNameDialog = useAskNameDialog();
  const [createPetitionListView] = useMutation(PetitionListHeader_createPetitionListViewDocument);
  const handleSaveAsNewViewClick = async () => {
    try {
      const currentView = state.view !== "ALL" ? views.find((v) => v.id === state.view) : null;
      const name = await showAskNameDialog({
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
        modalProps: { finalFocusRef: saveViewRef },
      });
      const { data } = await createPetitionListView({
        variables: {
          name,
          data: {
            tagsFilters: state.tagsFilters,
            sharedWith: state.sharedWith,
            ...pick(state, [
              "status",
              "signature",
              "fromTemplateId",
              "search",
              "searchIn",
              "path",
              "approvals",
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
            "approvals",
          ]),
        ).some(isNonNullish)
      ) {
        const action = await showConfirmChangeViewAllDialog({
          modalProps: { finalFocusRef: saveViewRef },
        });
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
                  tagsFilters: state.tagsFilters,
                  sharedWith: state.sharedWith,
                  approvals: state.approvals,
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
      const newColumns = await showColumnVisibilityDialog({
        columns,
        selection,
      });
      onStateChange((current) => ({ ...current, columns: newColumns }));
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
          <HiddenFiltersButton
            columns={columns}
            selection={selection}
            filter={state}
            onRemoveFilter={(key) => {
              onStateChange((current) => ({ ...omit(current, [key as any]), page: 1 }));
            }}
          />
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
            <SaveViewTabsMenu
              ref={saveViewRef}
              isViewDirty={isViewDirty}
              onSaveAsNewView={handleSaveAsNewViewClick}
              onSaveCurrentView={handleSaveCurrentViewClick}
            />
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
        approvals {
          operator
          filters {
            operator
            value
          }
        }
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
      omit(view1, ["__typename", "sharedWith", "sort", "tagsFilters", "approvals"]),
      omit(view2, ["__typename", "sharedWith", "sort", "tagsFilters", "approvals"]),
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
    ) &&
    isDeepEqual(
      isNonNullish(view1.approvals)
        ? {
            ...omit(view1.approvals, ["__typename"]),
            filters: view1.approvals.filters.map(omit(["__typename"])),
          }
        : view1.approvals,
      isNonNullish(view2.approvals)
        ? {
            ...omit(view2.approvals, ["__typename"]),
            filters: view2.approvals.filters.map(omit(["__typename"])),
          }
        : view2.approvals,
    )
  );
}
