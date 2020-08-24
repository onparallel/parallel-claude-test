import { Maybe } from "./types";

export function fullName(firstName: Maybe<string>, lastName: Maybe<string>) {
  return lastName ? `${firstName} ${lastName}` : firstName;
}
