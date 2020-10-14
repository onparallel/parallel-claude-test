import { Center, Tooltip } from "@chakra-ui/core";
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
  const { label, icon } = useMemo(
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
        DRAFT: <EditIcon boxSize="18px" color="gray.500" />,
        PENDING: <TimeIcon boxSize="18px" color="yellow.600" />,
        COMPLETED: <CheckIcon boxSize="18px" color="green.500" />,
        CLOSED: <DoubleCheckIcon boxSize="24px" color="green.500" />,
      }[status],
    }),
    [status, intl.locale]
  );
  return (
    <Center boxSize="24px" {...props}>
      <Tooltip label={label}>{icon}</Tooltip>
    </Center>
  );
}
