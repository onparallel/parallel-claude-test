import { BoxProps, Icon, Text, Tooltip, useTheme } from "@chakra-ui/core";
import { PetitionStatus } from "@parallel/graphql/__types";
import { useIntl } from "react-intl";

export type PetitionStatusIndicator = {
  status: PetitionStatus;
  isJustIcon?: boolean;
} & BoxProps;

export function PetitionStatusIndicator({
  status,
  isJustIcon,
  ...props
}: PetitionStatusIndicator) {
  const intl = useIntl();
  const theme = useTheme();
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
    DRAFT: "edit",
    PENDING: "time",
    COMPLETED: "check",
  } as const)[status];
  const color = ({
    DRAFT: "gray.500",
    PENDING: "yellow.600",
    COMPLETED: "green.500",
  } as const)[status];
  const content = (
    <>
      <Icon
        name={icon}
        size="18px"
        verticalAlign={isJustIcon ? "initial" : "sub"}
      />
      {isJustIcon ? null : (
        <Text as="span" marginLeft={1}>
          {label}
        </Text>
      )}
    </>
  );
  return isJustIcon ? (
    <Tooltip label={label} aria-label={label} zIndex={theme.zIndices.tooltip}>
      <Text color={color} {...props}>
        {content}
      </Text>
    </Tooltip>
  ) : (
    <Text color={color} whiteSpace="nowrap" {...props}>
      {content}
    </Text>
  );
}
