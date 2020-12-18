import { Tooltip } from "@chakra-ui/react";
import {
  CheckIcon,
  DoubleCheckIcon,
  EditIcon,
  TimeIcon,
} from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionStatus } from "@parallel/graphql/__types";
import { useIntl } from "react-intl";

interface PetitionStatusIconProps {
  status: PetitionStatus;
}

export const PetitionStatusIcon = chakraForwardRef<
  "svg",
  PetitionStatusIconProps
>(function PetitionStatusIcon({ status, ...props }, ref) {
  const intl = useIntl();
  return (
    <Tooltip
      label={
        status === "DRAFT"
          ? intl.formatMessage({
              id: "generic.petition-status.draft",
              defaultMessage: "Draft",
            })
          : status === "PENDING"
          ? intl.formatMessage({
              id: "generic.petition-status.pending",
              defaultMessage: "Pending",
            })
          : status === "COMPLETED"
          ? intl.formatMessage({
              id: "generic.petition-status.completed",
              defaultMessage: "Completed",
            })
          : status === "CLOSED"
          ? intl.formatMessage({
              id: "generic.petition-status.closed",
              defaultMessage: "Closed",
            })
          : null
      }
    >
      {status === "DRAFT" ? (
        <EditIcon ref={ref} boxSize="18px" color="gray.500" {...props} />
      ) : status === "PENDING" ? (
        <TimeIcon ref={ref} boxSize="18px" color="yellow.600" {...props} />
      ) : status === "COMPLETED" ? (
        <CheckIcon ref={ref} boxSize="18px" color="green.500" {...props} />
      ) : status === "CLOSED" ? (
        <DoubleCheckIcon
          ref={ref}
          boxSize="24px"
          color="green.500"
          {...props}
        />
      ) : null}
    </Tooltip>
  );
});
