import { enumParam, intParam } from "../rest/params";

export function paginationParams() {
  return {
    offset: intParam({
      description: "How many items to skip",
      defaultValue: 0,
      required: false,
      minimum: 0,
    }),
    limit: intParam({
      description: "How many items to return at most",
      required: true,
      minimum: 0,
    }),
  };
}

export function sortByParam<T extends string>(values: T[]) {
  return {
    sortBy: enumParam({
      description: "Sort this resource list by one of the available options",
      values: values.flatMap((option) => [
        `${option}_ASC`,
        `${option}_DESC`,
      ]) as `${T}_${"ASC" | "DESC"}`[],
      required: false,
      array: true,
    }),
  };
}
