import { Tooltip } from "@chakra-ui/react";
import { CheckIcon, DoubleCheckIcon, EditIcon, TimeIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionStatus } from "@parallel/graphql/__types";
import { usePetitionStatusLabels } from "@parallel/utils/usePetitionStatusLabels";

interface PetitionStatusIconProps {
  status: PetitionStatus;
}

export const PetitionStatusIcon = chakraForwardRef<"svg", PetitionStatusIconProps>(
  function PetitionStatusIcon({ status, ...props }, ref) {
    const labels = usePetitionStatusLabels();

    return (
      <Tooltip label={labels[status]}>
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
