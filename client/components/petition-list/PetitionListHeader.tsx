import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
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
import {
  buildPetitionsQueryStateUrl,
  usePetitionsQueryState,
} from "@parallel/utils/petitionsQueryState";
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
  columns: TableColumn<any, any, any>[];
  selection: PetitionListViewColumn[];
  onReload: () => void;
  views: PetitionListHeader_PetitionListViewFragment[];
}

export function PetitionListHeader({
  columns,
  selection,
  onReload,
  views,
}: PetitionListHeaderProps) {
  const [queryState, setQueryState] = usePetitionsQueryState();
  const intl = useIntl();
  const [search, setSearch] = useState(queryState.search ?? "");

  const showGenericErrorToast = useGenericErrorToast();

  useEffect(() => {
    setSearch(queryState.search ?? "");
  }, [queryState.view]);

  const debouncedOnSearchChange = useDebouncedCallback(
    (search) =>
      setQueryState(({ searchIn, ...current }) => ({
        ...current,
        search,
        searchIn: search ? searchIn : "EVERYWHERE",
        page: 1,
      })),
    300,
    [setQueryState],
  );
  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearch(value);
      debouncedOnSearchChange(value || null);
    },
    [debouncedOnSearchChange],
  );

  const saveViewRef = useRef<HTMLButtonElement>(null);

  const isViewDirty = useMemo(() => {
    if (queryState.type === "TEMPLATE") {
      return false;
    }
    const currentView = views.find((v) =>
      queryState.view === "ALL" ? v.type === "ALL" : v.id === queryState.view,
    );

    if (!currentView) return false;

    if (currentView.type === "ALL") {
      // "ALL" view can only update columns and sortBy
      return !viewsAreEqual(
        pick(currentView.data, ["sort", "columns"]),
        pick(queryState, ["sort", "columns"]),
      );
    }

    return !viewsAreEqual(
      currentView!.data,
      pick(queryState, [
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
        "scheduledForDeletion",
      ]) as Omit<PetitionListViewData, "__typename">,
    );
  }, [queryState, views]);

  const showAskNameDialog = useAskNameDialog();
  const [createPetitionListView] = useMutation(PetitionListHeader_createPetitionListViewDocument);
  const handleSaveAsNewViewClick = async () => {
    try {
      const currentView =
        queryState.view !== "ALL" ? views.find((v) => v.id === queryState.view) : null;
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
            tagsFilters: queryState.tagsFilters,
            sharedWith: queryState.sharedWith,
            ...pick(queryState, [
              "status",
              "signature",
              "fromTemplateId",
              "search",
              "searchIn",
              "path",
              "approvals",
              "sort",
              "columns",
              "scheduledForDeletion",
            ]),
          } as PetitionListViewDataInput,
        },
      });
      if (isNonNullish(data)) {
        setQueryState({
          view: data.createPetitionListView.id,
          ...omit(data.createPetitionListView.data, ["__typename", "scheduledForDeletion"]),
          scheduledForDeletion: data.createPetitionListView.data.scheduledForDeletion ?? undefined,
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
        queryState.view === "ALL" &&
        Object.values(
          pick(queryState, [
            "sharedWith",
            "status",
            "tagsFilters",
            "signature",
            "fromTemplateId",
            "search",
            "approvals",
            "scheduledForDeletion",
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
        queryState.view === "ALL" ? v.type === "ALL" : v.id === queryState.view,
      )!;

      await updatePetitionListView({
        variables: {
          petitionListViewId: view.id,
          ...(view.type === "ALL" ? {} : { name: view.name }),
          data: {
            ...(view.type === "ALL"
              ? // "ALL" view can only update columns and sort
                pick(queryState, ["sort", "columns"])
              : {
                  tagsFilters: queryState.tagsFilters,
                  sharedWith: queryState.sharedWith,
                  approvals: queryState.approvals,
                  ...pick(queryState, [
                    "status",
                    "signature",
                    "fromTemplateId",
                    "search",
                    "searchIn",
                    "path",
                    "sort",
                    "columns",
                    "scheduledForDeletion",
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
      setQueryState((current) => ({ ...current, columns: newColumns }));
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
        {queryState.type === "PETITION" ? (
          <HiddenFiltersButton
            columns={columns}
            selection={selection}
            filter={queryState}
            onShowColumn={(key) => {
              setQueryState((current) => ({
                ...current,
                columns: [...(current.columns ?? []), key as PetitionListViewColumn],
              }));
            }}
            onRemoveFilter={(key) => {
              setQueryState((current) => ({ ...omit(current, [key as any]), page: 1 }));
            }}
          />
        ) : null}
        {queryState.type === "PETITION" ? (
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
      {queryState.search ? (
        <SearchAllOrCurrentFolder
          onChange={(value) =>
            setQueryState((current) => ({
              ...current,
              searchIn: value,
              page: 1,
            }))
          }
          value={queryState.searchIn}
          path={queryState.path}
          type={queryState.type}
        />
      ) : queryState.path !== "/" ? (
        <PathBreadcrumbs
          path={queryState.path}
          type={queryState.type}
          pathUrl={(path) => buildPetitionsQueryStateUrl({ ...queryState, path, page: 1 })}
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
        scheduledForDeletion
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
