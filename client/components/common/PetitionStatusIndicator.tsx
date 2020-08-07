import { Icon, Text, Tooltip } from "@chakra-ui/core";
import { CheckIcon, EditIcon, TimeIcon } from "@parallel/chakra/icons";
import { ExtendChakra } from "@parallel/chakra/utils";
import { PetitionStatus } from "@parallel/graphql/__types";
import { useIntl } from "react-intl";

export type PetitionStatusIndicator = ExtendChakra<{
  status: PetitionStatus;
  isJustIcon?: boolean;
}>;

export function PetitionStatusIndicator({
  status,
  isJustIcon,
  ...props
}: PetitionStatusIndicator) {
  const intl = useIntl();
  const label = ({
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
  } as const)[status];
  const icon = ({
    DRAFT: EditIcon,
    PENDING: TimeIcon,
    COMPLETED: CheckIcon,
  } as const)[status];
  const color = ({
    DRAFT: "gray.500",
    PENDING: "yellow.600",
    COMPLETED: "green.500",
  } as const)[status];
  return (
    <Tooltip label={label} isDisabled={!isJustIcon}>
      {isJustIcon ? (
        <Icon as={icon} boxSize="18px" color={color} {...props} />
      ) : (
        <Text display="inline-flex" color={color} {...props}>
          <Icon as={icon} boxSize="18px" verticalAlign="sub" />
          <Text as="span" marginLeft={1}>
            {label}
          </Text>
        </Text>
      )}
    </Tooltip>
  );
}
