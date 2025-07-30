import { gql, useMutation } from "@apollo/client";
import { useToast } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  PetitionViewTabs_createPetitionListViewDocument,
  PetitionViewTabs_deletePetitionListViewDocument,
  PetitionViewTabs_markPetitionListViewAsDefaultDocument,
  PetitionViewTabs_PetitionListViewFragment,
  PetitionViewTabs_reorderPetitionListViewsDocument,
  PetitionViewTabs_updatePetitionListViewDocument,
} from "@parallel/graphql/__types";
import { usePetitionsQueryState } from "@parallel/utils/petitionsQueryState";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useIntl } from "react-intl";
import { isNonNullish, omit } from "remeda";
import { assert } from "ts-essentials";
import { ViewTabs } from "./ViewTabs";

interface PetitionViewTabsProps {
  views: PetitionViewTabs_PetitionListViewFragment[];
}

export const PetitionViewTabs = Object.assign(
  chakraForwardRef<"div", PetitionViewTabsProps>(function PetitionViewTabs({ views }, ref) {
    const [queryState, setQueryState] = usePetitionsQueryState();
    const intl = useIntl();
    const toast = useToast();
    const showGenericErrorToast = useGenericErrorToast();

    const allView = views.find((v) => v.type === "ALL")!;
    const currentView =
      queryState.view === "ALL"
        ? allView
        : (views.find((v) => v.id === queryState.view) ?? allView);

    const handleViewChange = async (viewId: string) => {
      const view = views.find((v) => v.id === viewId);
      if (isNonNullish(view)) {
        setQueryState({
          view: view.type === "ALL" ? "ALL" : view.id,
          ...omit(view.data, ["__typename"]),
        });
      }
    };

    const [updatePetitionListView] = useMutation(PetitionViewTabs_updatePetitionListViewDocument);
    const handleRenameViewClick = async (viewId: string, name: string) => {
      try {
        const view = views.find((v) => viewId === v.id);
        assert(isNonNullish(view), "view should exist");
        await updatePetitionListView({
          variables: { petitionListViewId: view.id, name },
        });
      } catch (error) {
        showGenericErrorToast(error);
      }
    };

    const [createPetitionListView] = useMutation(PetitionViewTabs_createPetitionListViewDocument);
    const handleCloneViewClick = async (viewId: string, name: string) => {
      try {
        const view = views.find((v) => viewId === v.id);
        assert(isNonNullish(view), "view should exist");
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
              approvals: isNonNullish(view.data.approvals)
                ? {
                    ...omit(view.data.approvals, ["__typename"]),
                    filters: view.data.approvals.filters.map(omit(["__typename"])),
                  }
                : view.data.approvals,
              sort: isNonNullish(view.data.sort)
                ? omit(view.data.sort, ["__typename"])
                : view.data.sort,
            },
          },
        });
        if (isNonNullish(data)) {
          setQueryState({
            view: data.createPetitionListView.id,
            ...omit(data.createPetitionListView.data, ["__typename"]),
          });
        }
      } catch (error) {
        showGenericErrorToast(error);
      }
    };

    const [markPetitionListViewAsDefault] = useMutation(
      PetitionViewTabs_markPetitionListViewAsDefaultDocument,
    );
    const handleMarkViewAsDefaultClick = async (viewId: string) => {
      try {
        await markPetitionListViewAsDefault({
          variables: { petitionListViewId: viewId },
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

    const [deletePetitionListView] = useMutation(PetitionViewTabs_deletePetitionListViewDocument);
    const handleDeleteViewClick = async (viewId: string) => {
      try {
        const view = views.find((v) => viewId === v.id);
        assert(isNonNullish(view), "view should exist");
        const defaultView = views.find((v) => v.isDefault && v.id !== view.id);
        handleViewChange(defaultView ? defaultView.id : allView.id);
        await deletePetitionListView({ variables: { id: view.id } });
      } catch (error) {
        showGenericErrorToast(error);
      }
    };

    const [reorderPetitionListViews] = useMutation(
      PetitionViewTabs_reorderPetitionListViewsDocument,
    );
    const handleReorderViews = async (ids: string[]) => {
      try {
        await reorderPetitionListViews({
          variables: {
            ids,
          },
        });
      } catch {}
    };

    return (
      <ViewTabs
        ref={ref}
        views={views}
        currentViewId={currentView.id}
        onChange={handleViewChange}
        onRenameView={handleRenameViewClick}
        onCloneView={handleCloneViewClick}
        onMarkViewAsDefault={handleMarkViewAsDefaultClick}
        onDeleteView={handleDeleteViewClick}
        onReorder={handleReorderViews}
      />
    );
  }),
  {
    fragments: {
      get PetitionListViewData() {
        return gql`
          fragment PetitionViewTabs_PetitionListViewData on PetitionListViewData {
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
        `;
      },
      get PetitionListView() {
        return gql`
          fragment PetitionViewTabs_PetitionListView on PetitionListView {
            id
            name
            isDefault
            type
            data {
              ...PetitionViewTabs_PetitionListViewData
            }
            ...ViewTabs_ListView
          }
          ${this.PetitionListViewData}
          ${ViewTabs.fragments.ListView}
        `;
      },
    },
  },
);

const _mutations = [
  gql`
    mutation PetitionViewTabs_reorderPetitionListViews($ids: [GID!]!) {
      reorderPetitionListViews(ids: $ids) {
        id
        petitionListViews {
          id
        }
      }
    }
  `,
  gql`
    mutation PetitionViewTabs_deletePetitionListView($id: GID!) {
      deletePetitionListView(id: $id) {
        id
        petitionListViews {
          id
        }
      }
    }
  `,
  gql`
    mutation PetitionViewTabs_createPetitionListView(
      $name: String!
      $data: PetitionListViewDataInput!
    ) {
      createPetitionListView(name: $name, data: $data) {
        ...PetitionViewTabs_PetitionListView
        user {
          id
          petitionListViews {
            id
          }
        }
      }
    }
    ${PetitionViewTabs.fragments.PetitionListView}
  `,
  gql`
    mutation PetitionViewTabs_updatePetitionListView(
      $petitionListViewId: GID!
      $name: String
      $data: PetitionListViewDataInput
    ) {
      updatePetitionListView(petitionListViewId: $petitionListViewId, name: $name, data: $data) {
        ...PetitionViewTabs_PetitionListView
        user {
          id
          petitionListViews {
            id
          }
        }
      }
    }
    ${PetitionViewTabs.fragments.PetitionListView}
  `,
  gql`
    mutation PetitionViewTabs_markPetitionListViewAsDefault($petitionListViewId: GID) {
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
