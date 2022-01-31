import { Circle, Flex, Tooltip, PlacementWithLogical } from "@chakra-ui/react";
import { AlertCircleIcon, SignatureIcon, TimeIcon } from "@parallel/chakra/icons";
import {
  PetitionSignatureRequestStatus,
  SignatureOrgIntegrationEnvironment,
} from "@parallel/graphql/__types";
import { usePetitionSignatureStatusLabels } from "@parallel/utils/usePetitionSignatureStatusLabels";
import { useIntl } from "react-intl";

interface PetitionSignatureStatusIconProps {
  status: PetitionSignatureRequestStatus | "START" | null;
  environment?: SignatureOrgIntegrationEnvironment | null;
  tooltipPlacement?: PlacementWithLogical;
}
export function PetitionSignatureStatusIcon({
  status,
  environment,
  tooltipPlacement,
}: PetitionSignatureStatusIconProps) {
  const intl = useIntl();

  const labels = usePetitionSignatureStatusLabels();

  const envLabel =
    environment === "DEMO"
      ? ` - ${intl.formatMessage({
          id: "generic.signature-demo-environment-long",
          defaultMessage: "Test environment",
        })}`
      : "";

  const label = status ? labels[status] + envLabel : "";

  return (
    <Tooltip label={label} placement={tooltipPlacement}>
      <Flex alignItems="center" gridGap={0} position="relative" paddingX={1}>
        {status === "START" ? (
          <Circle boxSize={2} backgroundColor="purple.500" marginRight="2px" />
        ) : null}
        <SignatureIcon
          color={environment === "DEMO" ? "yellow.700" : "gray.700"}
          opacity={status === "COMPLETED" ? 1 : 0.4}
        />
        {status && ["ENQUEUED", "PROCESSING", "PROCESSED"].includes(status) ? (
          <TimeIcon color="yellow.600" fontSize="13px" position="absolute" top={-2} right={0} />
        ) : status === "CANCELLED" ? (
          <AlertCircleIcon color="red.500" fontSize="14px" position="absolute" top={-2} right={0} />
        ) : null}
      </Flex>
    </Tooltip>
  );
}
