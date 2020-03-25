import { PetitionStatus } from "@parallel/graphql/__types";
import { Text, Icon, Box, BoxProps, IconProps } from "@chakra-ui/core";
import { FormattedMessage } from "react-intl";
import { forwardRef } from "react";

export type PetitionStatusTextProps = {
  status: PetitionStatus;
  iconSize?: IconProps["size"];
} & BoxProps;

export const PetitionStatusText = forwardRef(function PetitionStatusText(
  { status, iconSize = "18px", ...props }: PetitionStatusTextProps,
  ref
) {
  const color = ({
    DRAFT: "gray.500",
    PENDING: "yellow.600",
    COMPLETED: "green.500",
  } as const)[status];
  return (
    <Text ref={ref} color={color} whiteSpace="nowrap" {...props}>
      {status === "DRAFT" ? (
        <>
          <Icon
            name="edit"
            size={iconSize}
            marginBottom="2px"
            marginRight={2}
          />
          <FormattedMessage
            id="generic.petition-status.draft"
            defaultMessage="Draft"
          />
        </>
      ) : status === "PENDING" ? (
        <>
          <Icon
            name="time"
            size={iconSize}
            marginBottom="2px"
            marginRight={2}
          />
          <FormattedMessage
            id="generic.petition-status.pending"
            defaultMessage="Pending"
          />
        </>
      ) : status === "COMPLETED" ? (
        <>
          <Icon
            name="check"
            size={iconSize}
            marginBottom="3px"
            marginRight={2}
          />
          <FormattedMessage
            id="generic.petition-status.completed"
            defaultMessage="Completed"
          />
        </>
      ) : null}
    </Text>
  );
});
