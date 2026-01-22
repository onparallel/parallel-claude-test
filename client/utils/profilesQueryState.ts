import { profileQueryFilter } from "./ProfileQueryFilter";
import {
  buildBuildStateUrl,
  buildParseQuery,
  buildUseQueryState,
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
  sort: sorting(
    (field): field is "name" | "createdAt" | `field_${number}` =>
      ["name", "createdAt"].includes(field) || !!field.match(/^field_[A-Za-z\d]+$/),
  ),
  type: string(),
  status: values(["OPEN", "CLOSED", "DELETION_SCHEDULED"]).list(),
  columns: string().list({ allowEmpty: true }),
  values: profileQueryFilter(),
};

export type ProfilesQueryState = QueryStateFrom<typeof QUERY_STATE>;

export const useProfilesQueryState = buildUseQueryState(QUERY_STATE);

export const parseProfilesQuery = buildParseQuery(QUERY_STATE);

export const buildProfilesQueryStateUrl = buildBuildStateUrl("/app/profiles", QUERY_STATE);
