import { HStack, Text, Tooltip } from "@chakra-ui/react";
import { CheckIcon, DoubleCheckIcon, EditIcon, TimeIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionStatus } from "@parallel/graphql/__types";
import { usePetitionStatusColor } from "@parallel/utils/usePetitionStatusColor";
import { usePetitionStatusLabels } from "@parallel/utils/usePetitionStatusLabels";

interface PetitionStatusIconProps {
  status: PetitionStatus;
  showStatus?: boolean;
}

export const PetitionStatusIcon = chakraForwardRef<"svg", PetitionStatusIconProps>(
  function PetitionStatusIcon({ showStatus, status, ...props }, ref) {
    const labels = usePetitionStatusLabels();
    const color = usePetitionStatusColor(status);
    const iconTabIndex = showStatus ? 1 : 0;

    const icon =
      status === "DRAFT" ? (
        <EditIcon
          ref={ref}
          boxSize="16px"
          color={color}
          role="presentation"
          tabIndex={iconTabIndex}
          {...props}
        />
      ) : status === "PENDING" ? (
        <TimeIcon
          ref={ref}
          boxSize="16px"
          color={color}
          role="presentation"
          tabIndex={iconTabIndex}
          {...props}
        />
      ) : status === "COMPLETED" ? (
        <CheckIcon
          ref={ref}
          boxSize="16px"
          color={color}
          role="presentation"
          tabIndex={iconTabIndex}
          {...props}
        />
      ) : status === "CLOSED" ? (
        <DoubleCheckIcon
          ref={ref}
          boxSize="24px"
          color={color}
          role="presentation"
          tabIndex={iconTabIndex}
          {...props}
        />
      ) : null;

    return showStatus ? (
      <HStack color={color} alignContent="center">
        {icon}{" "}
        <Text fontSize="sm" lineHeight="24px">
          {labels[status]}
        </Text>
      </HStack>
    ) : (
      <Tooltip label={labels[status]}>{icon}</Tooltip>
    );
  }
);
