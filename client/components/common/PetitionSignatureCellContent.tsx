import { gql } from "@apollo/client";
import { Box, Tooltip } from "@chakra-ui/react";
import { AlertCircleIcon, SignatureIcon } from "@parallel/chakra/icons";
import {
  PetitionSignatureCellContent_PetitionFragment,
  PetitionSignatureCellContent_UserFragment,
  PetitionSignatureRequestStatus,
} from "@parallel/graphql/__types";
import { useIntl } from "react-intl";

export function PetitionSignatureCellContent({
  petition: { currentSignatureRequest },
  user: { hasPetitionSignature },
}: {
  petition: PetitionSignatureCellContent_PetitionFragment;
  user: PetitionSignatureCellContent_UserFragment;
}) {
  const intl = useIntl();
  const colors: Record<PetitionSignatureRequestStatus, string> = {
    ENQUEUED: "gray.300",
    PROCESSING: "gray.300",
    CANCELLED: "gray.300",
    COMPLETED: "gray.700",
  };
  const labels: Record<PetitionSignatureRequestStatus, string> = {
    ENQUEUED: intl.formatMessage({
      id: "component.petition-status-cell-content.e-signature-processing",
      defaultMessage: "eSignature pending",
    }),
    PROCESSING: intl.formatMessage({
      id: "component.petition-status-cell-content.e-signature-processing",
      defaultMessage: "eSignature pending",
    }),
    CANCELLED: intl.formatMessage({
      id: "component.petition-status-cell-content.e-signature-cancelled",
      defaultMessage: "eSignature cancelled",
    }),
    COMPLETED: intl.formatMessage({
      id: "component.petition-status-cell-content.e-signature-completed",
      defaultMessage: "eSignature completed",
    }),
  };
  return hasPetitionSignature && currentSignatureRequest ? (
    <Tooltip label={labels[currentSignatureRequest.status]}>
      <Box position="relative">
        <SignatureIcon
          color={colors[currentSignatureRequest.status]}
          fontSize="18px"
        />
        {currentSignatureRequest.status === "CANCELLED" ? (
          <AlertCircleIcon
            color="red.500"
            fontSize="14px"
            position="absolute"
            top={0}
            right="-6px"
          />
        ) : null}
      </Box>
    </Tooltip>
  ) : null;
}

PetitionSignatureCellContent.fragments = {
  Petition: gql`
    fragment PetitionSignatureCellContent_Petition on Petition {
      currentSignatureRequest @include(if: $hasPetitionSignature) {
        status
      }
    }
  `,
  User: gql`
    fragment PetitionSignatureCellContent_User on User {
      hasPetitionSignature: hasFeatureFlag(featureFlag: PETITION_SIGNATURE)
    }
  `,
};
