import { Tooltip } from "@chakra-ui/react";
import { CheckIcon, DoubleCheckIcon, EditIcon, TimeIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionStatus } from "@parallel/graphql/__types";
import { usePetitionStatusColor } from "@parallel/utils/usePetitionStatusColor";
import { usePetitionStatusLabels } from "@parallel/utils/usePetitionStatusLabels";

interface PetitionStatusIconProps {
  status: PetitionStatus;
  disableTooltip?: boolean;
}

export const PetitionStatusIcon = chakraForwardRef<"svg", PetitionStatusIconProps>(
  function PetitionStatusIcon({ disableTooltip, status, ...props }, ref) {
    const labels = usePetitionStatusLabels();
    const color = usePetitionStatusColor(status);
    return (
      <Tooltip label={labels[status]} isDisabled={disableTooltip}>
        {status === "DRAFT" ? (
          <EditIcon
            ref={ref}
            boxSize="16px"
            color={color}
            role="presentation"
            tabIndex={disableTooltip ? undefined : 0}
            {...(props as any)}
          />
        ) : status === "PENDING" ? (
          <TimeIcon
            ref={ref}
            boxSize="16px"
            color={color}
            role="presentation"
            tabIndex={disableTooltip ? undefined : 0}
            {...(props as any)}
          />
        ) : status === "COMPLETED" ? (
          <CheckIcon
            ref={ref}
            boxSize="16px"
            color={color}
            role="presentation"
            tabIndex={disableTooltip ? undefined : 0}
            {...(props as any)}
          />
        ) : status === "CLOSED" ? (
          <DoubleCheckIcon
            ref={ref}
            boxSize="24px"
            color={color}
            role="presentation"
            tabIndex={disableTooltip ? undefined : 0}
            {...(props as any)}
          />
        ) : null}
      </Tooltip>
    );
  },
);
