import { Tooltip } from "@chakra-ui/react";
import { CheckIcon, DoubleCheckIcon, EditIcon, TimeIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionStatus } from "@parallel/graphql/__types";
import { useIntl } from "react-intl";

interface PetitionStatusIconProps {
  status: PetitionStatus;
}

export const PetitionStatusIcon = chakraForwardRef<"svg", PetitionStatusIconProps>(
  function PetitionStatusIcon({ status, ...props }, ref) {
    const intl = useIntl();

    const getTooltipLabel = () => {
      switch (status) {
        case "DRAFT":
          return intl.formatMessage({
            id: "generic.parallel-status.draft",
            defaultMessage: "Draft",
          });
        case "PENDING":
          return intl.formatMessage({
            id: "generic.parallel-status.pending",
            defaultMessage: "Pending",
          });
        case "COMPLETED":
          return intl.formatMessage({
            id: "generic.parallel-status.completed",
            defaultMessage: "Completed",
          });
        case "CLOSED":
          return intl.formatMessage({
            id: "generic.parallel-status.closed",
            defaultMessage: "Closed",
          });
        default:
          return null;
      }
    };

    return (
      <Tooltip label={getTooltipLabel()} aria-label={getTooltipLabel()!}>
        {status === "DRAFT" ? (
          <EditIcon
            ref={ref}
            boxSize="18px"
            color="gray.500"
            role="presentation"
            tabIndex={0}
            {...props}
          />
        ) : status === "PENDING" ? (
          <TimeIcon
            ref={ref}
            boxSize="18px"
            color="yellow.600"
            role="presentation"
            tabIndex={0}
            {...props}
          />
        ) : status === "COMPLETED" ? (
          <CheckIcon
            ref={ref}
            boxSize="18px"
            color="green.500"
            role="presentation"
            tabIndex={0}
            {...props}
          />
        ) : status === "CLOSED" ? (
          <DoubleCheckIcon
            ref={ref}
            boxSize="24px"
            color="green.500"
            role="presentation"
            tabIndex={0}
            {...props}
          />
        ) : null}
      </Tooltip>
    );
  }
);
