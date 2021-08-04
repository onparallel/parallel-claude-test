import { User } from "@parallel/graphql/__types";

export function isAdmin(user: Pick<User, "role">) {
  return ["OWNER", "ADMIN"].includes(user.role);
}
