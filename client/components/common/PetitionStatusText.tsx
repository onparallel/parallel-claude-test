import { PetitionStatus } from "@parallel/graphql/__types";
import { Text, Icon, Box, BoxProps } from "@chakra-ui/core";
import { FormattedMessage } from "react-intl";
import { forwardRef } from "react";

export type PetitionStatusTextProps = {
  status: PetitionStatus;
} & BoxProps;

export const PetitionStatusText = forwardRef(function PetitionStatusText(
  { status, ...props }: PetitionStatusTextProps,
  ref
) {
  const color = ({
    DRAFT: "gray.500",
    PENDING: "yellow.600",
    SCHEDULED: "blue.500",
    READY: "blue.500",
    COMPLETED: "green.500"
  } as const)[status];
  return (
    <Text ref={ref} color={color} whiteSpace="nowrap" {...props}>
      {status === "DRAFT" ? (
        <>
          <Icon name="edit" size="18px" marginBottom="2px" marginRight={3} />
          <FormattedMessage
            id="generic.petition-status.draft"
            defaultMessage="Draft"
          />
        </>
      ) : status === "PENDING" ? (
        <>
          <Icon name="time" size="18px" marginBottom="2px" marginRight={3} />
          <FormattedMessage
            id="generic.petition-status.pending"
            defaultMessage="Pending"
          />
        </>
      ) : status === "READY" ? (
        <>
          <Icon
            name={"user-check" as any}
            size="18px"
            marginBottom="3px"
            marginRight={3}
          />
          <FormattedMessage
            id="generic.petition-status.ready"
            defaultMessage="Ready"
          />
        </>
      ) : status === "COMPLETED" ? (
        <>
          <Icon name="check" size="18px" marginBottom="3px" marginRight={3} />
          <FormattedMessage
            id="generic.petition-status.completed"
            defaultMessage="Completed"
          />
        </>
      ) : status === "SCHEDULED" ? (
        <>
          <Box
            display="inline-block"
            position="relative"
            width="26px"
            height="18px"
            marginRight={1}
            marginBottom="-2px"
          >
            <Icon
              name={"paper-plane" as any}
              size="16px"
              position="absolute"
              left="0"
              top="0"
            />
            <Box
              position="absolute"
              right={0}
              bottom={0}
              borderRadius="100%"
              width="14px"
              height="14px"
              backgroundColor="white"
            >
              <Icon name="time" size="14px" position="absolute" />
            </Box>
          </Box>
          <FormattedMessage
            id="generic.petition-status.scheduled"
            defaultMessage="Scheduled"
          />
        </>
      ) : null}
    </Text>
  );
});
