import { Badge, FormLabel } from "@chakra-ui/react";
import { useFormContext } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { isNonNullish } from "remeda";
import { useIsDirtyField } from "../hooks/useIsDirtyField";

export function DashboardModuleFormLabel({
  children,
  field,
}: {
  children: React.ReactNode;
  field?: string;
}) {
  const { watch } = useFormContext();
  const selectedModule = watch("selectedModule");
  const isEditing = isNonNullish(selectedModule?.id);
  const isDirty = useIsDirtyField(isEditing ? field : undefined);

  return (
    <FormLabel
      display="flex"
      gap={2}
      alignItems="center"
      textTransform="uppercase"
      color="gray.600"
      fontSize="sm"
    >
      {children}
      {isDirty && isEditing ? (
        <Badge colorScheme="blue">
          <FormattedMessage id="generic.edited-indicator" defaultMessage="Edited" />
        </Badge>
      ) : null}
    </FormLabel>
  );
}
