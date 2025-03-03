import { PetitionFilter } from "../../db/repositories/PetitionRepository";
import { fromGlobalId } from "../../util/globalId";
import { NexusGenInputs } from "../__types";

export function mapPetitionFilterInput(filter: NexusGenInputs["PetitionFilter"]): PetitionFilter {
  return {
    ...filter,
    approvals: filter.approvals
      ? {
          ...filter.approvals,
          filters: filter.approvals.filters.map((f) => ({
            operator: f.operator,
            value:
              f.operator === "ASSIGNED_TO" ? fromGlobalId(f.value, "User").id : (f.value as any),
          })),
        }
      : null,
  };
}
