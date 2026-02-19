import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useToast } from "@chakra-ui/react";
import { chakraComponent } from "@parallel/chakra/utils";

import {
  ProfileViewTabs_createProfileListViewDocument,
  ProfileViewTabs_deleteProfileListViewDocument,
  ProfileViewTabs_markProfileListViewAsDefaultDocument,
  ProfileViewTabs_ProfileListViewFragment,
  ProfileViewTabs_reorderProfileListViewsDocument,
  ProfileViewTabs_updateProfileListViewDocument,
} from "@parallel/graphql/__types";
import { ProfilesQueryState, useProfilesQueryState } from "@parallel/utils/profilesQueryState";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useIntl } from "react-intl";
import { isNonNullish, omit } from "remeda";
import { assert } from "ts-essentials";
import { ViewTabs } from "./ViewTabs";

interface ProfileViewTabsProps {
  views: ProfileViewTabs_ProfileListViewFragment[];
}

export const ProfileViewTabs = chakraComponent<"div", ProfileViewTabsProps>(
  function ProfileViewTabs({ ref, views }) {
    const intl = useIntl();
    const toast = useToast();
    const showGenericErrorToast = useGenericErrorToast();
    const [queryState, setQueryState] = useProfilesQueryState();

    const allView = views.find((v) => v.type === "ALL")!;
    const currentView =
      queryState.view === "ALL"
        ? allView
        : (views.find((v) => v.id === queryState.view) ?? allView);

    const handleViewChange = async (viewId: string) => {
      const view = views.find((v) => v.id === viewId);
      if (isNonNullish(view)) {
        setQueryState({
          ...queryState,
          view: view.type === "ALL" ? "ALL" : view.id,
          columns: view.data.columns,
          search: view.data.search,
          sort: isNonNullish(view.data.sort)
            ? (omit(view.data.sort, ["__typename"]) as ProfilesQueryState["sort"])
            : undefined,
          status: view.data.status,
          values: view.data.values as any,
        });
      }
    };

    const [updateProfileListView] = useMutation(ProfileViewTabs_updateProfileListViewDocument);
    const handleRenameViewClick = async (viewId: string, name: string) => {
      try {
        const view = views.find((v) => viewId === v.id);
        assert(isNonNullish(view), "view should exist");
        await updateProfileListView({
          variables: { profileListViewId: view.id, name, profileTypeId: queryState.type! },
        });
      } catch (error) {
        showGenericErrorToast(error);
      }
    };

    const [createProfileListView] = useMutation(ProfileViewTabs_createProfileListViewDocument);
    const handleCloneViewClick = async (viewId: string, name: string) => {
      try {
        const view = views.find((v) => viewId === v.id);
        assert(isNonNullish(view), "view should exist");
        const { data } = await createProfileListView({
          variables: {
            name,
            data: {
              ...omit(view.data, ["__typename", "sort"]),
              sort: isNonNullish(view.data.sort)
                ? omit(view.data.sort, ["__typename"])
                : view.data.sort,
            },
            profileTypeId: queryState.type!,
          },
        });
        if (isNonNullish(data)) {
          const newView = data.createProfileListView;
          setQueryState({
            ...queryState,
            view: newView.id,
            columns: newView.data.columns,
            search: newView.data.search,
            sort: isNonNullish(newView.data.sort)
              ? (omit(newView.data.sort, ["__typename"]) as ProfilesQueryState["sort"])
              : undefined,
            values: newView.data.values as any,
          });
        }
      } catch (error) {
        showGenericErrorToast(error);
      }
    };

    const [markProfileListViewAsDefault] = useMutation(
      ProfileViewTabs_markProfileListViewAsDefaultDocument,
    );
    const handleMarkViewAsDefaultClick = async (viewId: string) => {
      try {
        await markProfileListViewAsDefault({
          variables: { profileListViewId: viewId, profileTypeId: queryState.type! },
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

    const [deleteProfileListView] = useMutation(ProfileViewTabs_deleteProfileListViewDocument);
    const handleDeleteViewClick = async (viewId: string) => {
      try {
        const view = views.find((v) => viewId === v.id);
        assert(isNonNullish(view), "view should exist");
        if (currentView.id === viewId) {
          const defaultView = views.find((v) => v.isDefault && v.id !== view.id);
          handleViewChange(defaultView ? defaultView.id : allView.id);
        }
        await deleteProfileListView({
          variables: { id: view.id, profileTypeId: queryState.type! },
        });
      } catch (error) {
        showGenericErrorToast(error);
      }
    };

    const [reorderProfileListViews] = useMutation(ProfileViewTabs_reorderProfileListViewsDocument);
    const handleReorderViews = async (ids: string[]) => {
      try {
        await reorderProfileListViews({
          variables: {
            ids,
            profileTypeId: queryState.type!,
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
  },
);

const _fragments = {
  ProfileListViewData: gql`
    fragment ProfileViewTabs_ProfileListViewData on ProfileListViewData {
      sort {
        field
        direction
      }
      columns
      search
      status
      values
    }
  `,
  ProfileListView: gql`
    fragment ProfileViewTabs_ProfileListView on ProfileListView {
      id
      name
      isDefault
      type
      data {
        ...ProfileViewTabs_ProfileListViewData
      }
      ...ViewTabs_ListView
    }
  `,
};

const _mutations = [
  gql`
    mutation ProfileViewTabs_reorderProfileListViews($ids: [GID!]!, $profileTypeId: GID!) {
      reorderProfileListViews(ids: $ids, profileTypeId: $profileTypeId) {
        id
        profileListViews(profileTypeId: $profileTypeId) {
          id
        }
      }
    }
  `,
  gql`
    mutation ProfileViewTabs_deleteProfileListView($id: GID!, $profileTypeId: GID!) {
      deleteProfileListView(id: $id) {
        id
        profileListViews(profileTypeId: $profileTypeId) {
          id
        }
      }
    }
  `,
  gql`
    mutation ProfileViewTabs_createProfileListView(
      $profileTypeId: GID!
      $name: String!
      $data: ProfileListViewDataInput!
    ) {
      createProfileListView(profileTypeId: $profileTypeId, name: $name, data: $data) {
        id
        ...ProfileViewTabs_ProfileListView
        user {
          id
          profileListViews(profileTypeId: $profileTypeId) {
            id
          }
        }
      }
    }
  `,
  gql`
    mutation ProfileViewTabs_updateProfileListView(
      $profileTypeId: GID!
      $profileListViewId: GID!
      $name: String
      $data: ProfileListViewDataInput
    ) {
      updateProfileListView(
        profileTypeId: $profileTypeId
        profileListViewId: $profileListViewId
        name: $name
        data: $data
      ) {
        id
        ...ProfileViewTabs_ProfileListView
        user {
          id
          profileListViews(profileTypeId: $profileTypeId) {
            id
          }
        }
      }
    }
  `,
  gql`
    mutation ProfileViewTabs_markProfileListViewAsDefault(
      $profileListViewId: GID!
      $profileTypeId: GID!
    ) {
      markProfileListViewAsDefault(
        profileListViewId: $profileListViewId
        profileTypeId: $profileTypeId
      ) {
        id
        isDefault
      }
    }
  `,
];
