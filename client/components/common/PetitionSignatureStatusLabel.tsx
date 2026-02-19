import {
  SignatureCancelledIcon,
  SignatureCompletedIcon,
  SignatureNotStartedIcon,
  SignaturePendingIcon,
  SignatureProcessingIcon,
} from "@parallel/chakra/icons";
import {
  PetitionSignatureStatusFilter,
  SignatureOrgIntegrationEnvironment,
} from "@parallel/graphql/__types";
import { usePetitionSignatureStatusLabels } from "@parallel/utils/usePetitionSignatureStatusLabels";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import { HStack, Text } from "@parallel/components/ui";

interface PetitionSignatureStatusLabelProps {
  status: PetitionSignatureStatusFilter;
  environment?: SignatureOrgIntegrationEnvironment | null;
}
export function PetitionSignatureStatusLabel({
  status,
  environment,
}: PetitionSignatureStatusLabelProps) {
  const intl = useIntl();

  const labels = usePetitionSignatureStatusLabels();

  const envLabel =
    environment === "DEMO"
      ? ` - ${intl.formatMessage({
          id: "generic.signature-demo-environment",
          defaultMessage: "Test",
        })}`.toUpperCase()
      : "";

  const label = labels[status] + envLabel;

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
    [environment, status],
  );

  return (
    <HStack alignItems="center">
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
      ) : (
        <Text color="gray.400">-</Text>
      )}

      <Text as="span">{label}</Text>
    </HStack>
  );
}
