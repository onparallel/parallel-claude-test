import { useHasPermission } from "@parallel/utils/useHasPermission";
import { MaybeArray, unMaybeArray } from "@parallel/utils/types";
import { ReactNode } from "react";

interface WhenPermissionProps {
  permission: MaybeArray<string>;
  operator?: "AND" | "OR";
  children: ReactNode | ((hasRole: boolean) => ReactNode);
}

export function WhenPermission({ permission, operator, children }: WhenPermissionProps) {
  const hasPermission = useHasPermission(unMaybeArray(permission), operator);
  return (
    <>
      {typeof children === "function" ? children(hasPermission) : hasPermission ? children : null}
    </>
  );
}
