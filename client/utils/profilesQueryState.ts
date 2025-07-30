import { profileFieldValuesFilter } from "./ProfileFieldValuesFilter";
import {
  buildBuildStateUrl,
  buildParseQuery,
  buildUseGoTo,
  buildUseQueryState,
  buildUseQueryStateSlice,
  integer,
  QueryStateFrom,
  sorting,
  string,
  values,
} from "./queryState";

const QUERY_STATE = {
  view: string(),
  page: integer({ min: 1 }).orDefault(1),
  items: values([10, 25, 50]).orDefault(10),
  search: string(),
  sort: sorting(["name", "createdAt"]),
  type: string(),
  status: values(["OPEN", "CLOSED", "DELETION_SCHEDULED"]).list(),
  columns: string().list({ allowEmpty: true }),
  values: profileFieldValuesFilter(),
};

export type ProfilesQueryState = QueryStateFrom<typeof QUERY_STATE>;

export const useProfilesQueryState = buildUseQueryState(QUERY_STATE);

export const useProfilesQueryStateSlice = buildUseQueryStateSlice(QUERY_STATE);

export const parseProfilesQuery = buildParseQuery(QUERY_STATE);

export const buildProfilesQueryStateUrl = buildBuildStateUrl("/app/profiles", QUERY_STATE);

export const useGoToProfiles = buildUseGoTo("app/profiles", QUERY_STATE);
