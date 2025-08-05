import { FormControl } from "@chakra-ui/react";
import { DashboardModuleFormLabel } from "./DashboardModuleFormLabel";

export function DashboardModuleFilterContainer({
  children,
  label,
  isInvalid,
  field,
  isUpdating,
}: {
  children: React.ReactNode;
  label: React.ReactNode;
  isInvalid?: boolean;
  field: string;
  isUpdating?: boolean;
}) {
  return (
    <FormControl
      border="1px solid"
      borderColor="primary.100"
      borderRadius="md"
      padding={3}
      isInvalid={isInvalid}
    >
      <DashboardModuleFormLabel field={field} isUpdating={isUpdating}>
        {label}
      </DashboardModuleFormLabel>
      {children}
    </FormControl>
  );
}
