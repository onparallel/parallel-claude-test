import { PetitionUserNotificationFilter } from "@parallel/graphql/__types";
import { useQueryState, useQueryStateSlice, values } from "@parallel/utils/queryState";
import { useMemo } from "react";
import { localStorageGet, localStorageSet } from "./localStorage";

const QUERY_STATE = {
  notifications: values<PetitionUserNotificationFilter>([
    "ALL",
    "COMMENTS",
    "COMPLETED",
    "OTHER",
    "SHARED",
    "UNREAD",
  ]),
};

const key = "notifications" as const;

export function useNotificationsState() {
  const [state, setState] = useQueryState(QUERY_STATE);
  const [filter, onFilterChange] = useQueryStateSlice(state, setState, key);

  return {
    isOpen: filter !== null,
    filter,
    ...useMemo(
      () => ({
        onFilterChange: (value: PetitionUserNotificationFilter | null) => {
          if (value !== null) {
            localStorageSet("notifications-filter", value);
          }
          onFilterChange(value);
          window.analytics?.track("Notifications Filter Change", {
            filter: value,
          });
        },
        onOpen: () => {
          const prevValue = localStorageGet<PetitionUserNotificationFilter>(
            "notifications-filter",
            "ALL"
          );
          onFilterChange(prevValue);
          window.analytics?.track("Notifications Open");
        },
        onClose: () => {
          onFilterChange(null);
          window.analytics?.track("Notifications Close");
        },
      }),
      [onFilterChange]
    ),
  };
}
