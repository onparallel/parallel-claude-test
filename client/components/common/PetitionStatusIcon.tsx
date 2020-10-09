import { Icon, Tooltip } from "@chakra-ui/core";
import {
  CheckIcon,
  DoubleCheckIcon,
  EditIcon,
  TimeIcon,
} from "@parallel/chakra/icons";
import { ExtendChakra } from "@parallel/chakra/utils";
import { PetitionStatus } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { useIntl } from "react-intl";

export function PetitionStatusIcon({
  status,
  ...props
}: ExtendChakra<{
  status: PetitionStatus;
}>) {
  const intl = useIntl();
  const { label, icon, color } = useMemo(
    () => ({
      label: {
        DRAFT: intl.formatMessage({
          id: "generic.petition-status.draft",
          defaultMessage: "Draft",
        }),
        PENDING: intl.formatMessage({
          id: "generic.petition-status.pending",
          defaultMessage: "Pending",
        }),
        COMPLETED: intl.formatMessage({
          id: "generic.petition-status.completed",
          defaultMessage: "Completed",
        }),
        CLOSED: intl.formatMessage({
          id: "generic.petition-status.closed",
          defaultMessage: "Closed",
        }),
      }[status],
      icon: {
        DRAFT: EditIcon,
        PENDING: TimeIcon,
        COMPLETED: CheckIcon,
        CLOSED: DoubleCheckIcon,
      }[status],
      color: {
        DRAFT: "gray.500",
        PENDING: "yellow.600",
        COMPLETED: "green.500",
        CLOSED: "green.500",
      }[status],
    }),
    [status, intl.locale]
  );
  return (
    <Tooltip label={label}>
      <Icon as={icon} boxSize="18px" color={color} {...props} />
    </Tooltip>
  );
}
