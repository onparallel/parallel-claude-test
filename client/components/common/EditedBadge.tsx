import { Badge, BadgeProps } from "@chakra-ui/react";
import { chakraComponent } from "@parallel/chakra/utils";
import { unMaybeArray } from "@parallel/utils/types";
import { get, useFormContext } from "react-hook-form";
import { FormattedMessage } from "react-intl";

interface EditedBadgeProps extends BadgeProps {
  field: string | string[];
}

export const EditedBadge = chakraComponent<"span", EditedBadgeProps>(function EditedBadge({
  ref,
  field,
  ...props
}) {
  const {
    formState: { dirtyFields },
  } = useFormContext();

  return unMaybeArray(field).some((f) => isDirty(get(dirtyFields, f))) ? (
    <Badge colorScheme="blue" {...props} ref={ref}>
      <FormattedMessage id="generic.edited-indicator" defaultMessage="Edited" />
    </Badge>
  ) : null;
});

function isDirty(field: boolean | any[] | Record<string, any>): boolean {
  if (Array.isArray(field)) {
    return field.some(isDirty);
  }
  if (typeof field === "object") {
    return Object.values(field).some(isDirty);
  }
  return field;
}
