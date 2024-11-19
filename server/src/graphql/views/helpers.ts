import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { NexusGenInputs } from "../__types";

export function mapProfileListViewDataToDatabase(
  input: NexusGenInputs["ProfileListViewDataInput"],
) {
  return {
    columns:
      input.columns?.map((col) => {
        if (col.startsWith("field_")) {
          const globalId = col.replace("field_", "");
          const { id } = fromGlobalId(globalId, "ProfileTypeField");
          return `field_${id}`;
        }

        return col;
      }) ?? null,
    search: input.search ?? null,
    sort: input.sort ?? null,
    status: input.status ?? null,
  };
}

export function mapProfileListViewDataFromDatabase(
  data: NexusGenInputs["ProfileListViewDataInput"],
) {
  return {
    columns:
      data.columns?.map((col) => {
        if (col.startsWith("field_")) {
          const id = col.replace("field_", "");
          return `field_${toGlobalId("ProfileTypeField", id)}`;
        }

        return col;
      }) ?? null,
    search: data.search ?? null,
    sort: data.sort ?? null,
    status: data.status ?? null,
  };
}
