import { FormControl } from "@chakra-ui/react";
import { DashboardModuleFormLabel } from "./DashboardModuleFormLabel";

export function DashboardModuleFilterContainer({
  children,
  label,
  isInvalid,
  field,
}: {
  children: React.ReactNode;
  label: React.ReactNode;
  isInvalid?: boolean;
  field?: string;
}) {
  return (
    <FormControl
      border="1px solid"
      borderColor="primary.100"
      borderRadius="md"
      padding={4}
      role="group"
      isInvalid={isInvalid}
    >
      <DashboardModuleFormLabel field={field}>{label}</DashboardModuleFormLabel>
      {children}
    </FormControl>
  );
}
