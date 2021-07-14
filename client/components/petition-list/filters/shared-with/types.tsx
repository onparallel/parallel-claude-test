export type SharedWithFilterLine = {
  operator: FilterSharedWithOperator;
  value: string | null;
};

export type FilterSharedWithLogicalOperator = "AND" | "OR";

export type FilterSharedWithOperator =
  | "SHARED_WITH"
  | "NOT_SHARED_WITH"
  | "IS_OWNER";

export type SharedWithFilter = {
  operator: string;
  filters: SharedWithFilterLine[];
};
