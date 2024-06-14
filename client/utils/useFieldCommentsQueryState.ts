import { string, useQueryState, useQueryStateSlice } from "./queryState";

const QUERY_STATE = {
  comments: string(),
};

export function useFieldCommentsQueryState() {
  return useQueryStateSlice(...useQueryState(QUERY_STATE), "comments");
}
