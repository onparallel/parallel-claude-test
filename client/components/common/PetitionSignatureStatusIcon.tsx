import { Flex, PlacementWithLogical, Tooltip } from "@chakra-ui/react";
import {
  SignatureCancelledIcon,
  SignatureCompletedIcon,
  SignatureNotStartedIcon,
  SignaturePendingIcon,
  SignatureProcessingIcon,
} from "@parallel/chakra/icons";
import { SignatureOrgIntegrationEnvironment } from "@parallel/graphql/__types";
import { PetitionSignatureStatus } from "@parallel/utils/getPetitionSignatureStatus";
import { usePetitionSignatureStatusLabels } from "@parallel/utils/usePetitionSignatureStatusLabels";
import { useMemo } from "react";
import { useIntl } from "react-intl";

interface PetitionSignatureStatusIconProps {
  status: PetitionSignatureStatus;
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
          id: "generic.signature-demo-environment",
          defaultMessage: "Test",
        })}`.toUpperCase()
      : "";

  const label = status !== "NO_SIGNATURE" ? labels[status] + envLabel : "";

  const iconProps = useMemo(
    () => ({
      fontSize: "25px",
      color:
        status === "COMPLETED"
          ? environment === "PRODUCTION"
            ? "gray.800"
            : "yellow.600"
          : environment === "PRODUCTION"
          ? "gray.300"
          : "#DBBC8E",
    }),
    [environment, status]
  );

  return (
    <Tooltip label={label} placement={tooltipPlacement}>
      <Flex alignItems="center" gridGap={0} position="relative" paddingX={1}>
        {status === "NOT_STARTED" ? (
          <SignatureNotStartedIcon {...iconProps} />
        ) : status === "PENDING_START" ? (
          <SignaturePendingIcon {...iconProps} />
        ) : status === "PROCESSING" ? (
          <SignatureProcessingIcon {...iconProps} />
        ) : status === "CANCELLED" ? (
          <SignatureCancelledIcon {...iconProps} />
        ) : status === "COMPLETED" ? (
          <SignatureCompletedIcon {...iconProps} />
        ) : null}
      </Flex>
    </Tooltip>
  );
}
