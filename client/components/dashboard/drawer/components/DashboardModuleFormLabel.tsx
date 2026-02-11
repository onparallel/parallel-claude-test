import { FormLabel } from "@chakra-ui/react";
import { EditedBadge } from "@parallel/components/common/EditedBadge";
import { HStack } from "@parallel/components/ui";
import { ReactNode } from "react";

export function DashboardModuleFormLabel({
  children,
  field,
  isUpdating,
}: {
  children: ReactNode;
  field: string | string[];
  isUpdating?: boolean;
}) {
  return (
    <HStack gap={2} marginBottom={2}>
      <FormLabel textTransform="uppercase" color="gray.600" fontSize="sm" margin={0}>
        {children}
      </FormLabel>
      {isUpdating ? <EditedBadge field={field} /> : null}
    </HStack>
  );
}
