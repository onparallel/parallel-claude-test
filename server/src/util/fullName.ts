import { isDefined } from "./remedaExtensions";
import { Maybe } from "./types";

export function fullName(
  firstName: Maybe<string> | undefined,
  lastName: Maybe<string> | undefined
) {
  const parts = [firstName, lastName];
  return parts.filter(isDefined).join(" ");
}
