import { approvalsQueryItem } from "@parallel/components/petition-list/filters/PetitionListApprovalsFilter";
import { sharedWithQueryItem } from "@parallel/components/petition-list/filters/PetitionListSharedWithFilter";
import { tagFilterQueryItem } from "@parallel/components/petition-list/filters/PetitionListTagFilter";
import {
  boolean,
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
import { PETITIONS_COLUMNS, PetitionsTableColumn } from "./usePetitionsTableColumns";

const QUERY_STATE = {
  view: string(),
  page: integer({ min: 1 }).orDefault(1),
  items: values([10, 25, 50]).orDefault(10),
  type: values(["PETITION", "TEMPLATE"]).orDefault("PETITION"),
  search: string(),
  searchIn: values(["EVERYWHERE", "CURRENT_FOLDER"]).orDefault("EVERYWHERE"),
  sort: sorting(["name", "createdAt", "sentAt", "lastActivityAt", "lastRecipientActivityAt"]),
  path: string()
    .withValidation((value) => typeof value === "string" && /^\/([^\/]+\/)*$/.test(value))
    .orDefault("/"),
  status: values(["DRAFT", "PENDING", "COMPLETED", "CLOSED"]).list(),
  scheduledForDeletion: boolean().orDefault(false),
  sharedWith: sharedWithQueryItem(),
  approvals: approvalsQueryItem(),
  tagsFilters: tagFilterQueryItem(),
  fromTemplateId: string().list(),
  signature: values([
    "NO_SIGNATURE",
    "NOT_STARTED",
    "PENDING_START",
    "PROCESSING",
    "COMPLETED",
    "CANCELLED",
  ]).list(),
  columns: values(
    PETITIONS_COLUMNS.filter((c) => !c.isFixed).map((c) => c.key as PetitionsTableColumn),
  ).list({ allowEmpty: true }),
};

export type PetitionsQueryState = QueryStateFrom<typeof QUERY_STATE>;

export const usePetitionsQueryState = buildUseQueryState(QUERY_STATE);

export const usePetitionsQueryStateSlice = buildUseQueryStateSlice(QUERY_STATE);

export const parsePetitionsQuery = buildParseQuery(QUERY_STATE);

export const buildPetitionsQueryStateUrl = buildBuildStateUrl("/app/petitions", QUERY_STATE);

export const useGoToPetitions = buildUseGoTo("app/petitions", QUERY_STATE);
