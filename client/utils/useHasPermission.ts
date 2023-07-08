import { gql, useApolloClient } from "@apollo/client";
import { useHasPermission_MeDocument } from "@parallel/graphql/__types";
import { MaybeArray, unMaybeArray } from "./types";
import { useConstant } from "./useConstant";
import { isDefined } from "remeda";

export function useHasPermission(permission: string): boolean;
export function useHasPermission(permissions: string[], operator?: "AND" | "OR"): boolean;
export function useHasPermission(permissions: MaybeArray<string>, operator: "AND" | "OR" = "AND") {
  const client = useApolloClient();
  const userPermissions = useConstant(() => {
    const data = client.readQuery({ query: useHasPermission_MeDocument });
    if (!isDefined(data)) {
      throw new Error("me.permissions missing on cache");
    }
    return new Set(data!.me.permissions);
  });
  return unMaybeArray(permissions)[operator === "OR" ? "some" : "every"]((p) =>
    userPermissions.has(p),
  );
}

const _queries = [
  gql`
    query useHasPermission_Me {
      me {
        permissions
      }
    }
  `,
];
