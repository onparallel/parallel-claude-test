import { PetitionUserNotificationFilter } from "@parallel/graphql/__types";
import {
  useQueryStateSlice,
  values,
  useQueryState,
} from "@parallel/utils/queryState";
import { useCallback } from "react";

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
    onFilterChange,
    onOpen: useCallback(() => onFilterChange("ALL"), [onFilterChange]),
    onClose: useCallback(() => onFilterChange(null), [onFilterChange]),
  };
}
