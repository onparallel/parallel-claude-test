import { gql } from "@apollo/client";
import { Circle, Flex, Tooltip } from "@chakra-ui/react";
import { AlertCircleIcon, SignatureIcon, TimeIcon } from "@parallel/chakra/icons";
import { PetitionSignatureCellContent_PetitionFragment } from "@parallel/graphql/__types";
import { usePetitionCurrentSignatureStatusAndEnv } from "@parallel/utils/usePetitionCurrentSignatureStatusAndEnv";
import { usePetitionSignatureStatusLabels } from "@parallel/utils/usePetitionSignatureStatusLabels";
import { useIntl } from "react-intl";

interface PetitionSignatureCellContentProps {
  petition: PetitionSignatureCellContent_PetitionFragment;
}
export function PetitionSignatureCellContent({ petition }: PetitionSignatureCellContentProps) {
  const intl = useIntl();

  const labels = usePetitionSignatureStatusLabels();
  const { status, env } = usePetitionCurrentSignatureStatusAndEnv(petition);

  const envLabel =
    env === "DEMO"
      ? ` - ${intl.formatMessage({
          id: "petition-signature-cell-content.test-environment",
          defaultMessage: "Test environment",
        })}`
      : "";

  // do not show signature status on drafts
  if (petition.status === "DRAFT") return null;
  return status ? (
    <Tooltip label={labels[status] + envLabel}>
      <Flex alignItems="center">
        {status === "START" ? (
          <Circle boxSize={2} backgroundColor="purple.500" marginRight="2px" />
        ) : null}
        <SignatureIcon
          color={env === "DEMO" ? "yellow.700" : "gray.700"}
          opacity={status === "COMPLETED" ? 1 : 0.4}
        />
        {status === "PROCESSING" ? (
          <TimeIcon color="yellow.600" fontSize="13px" position="relative" top={-2} right={2} />
        ) : status === "CANCELLED" ? (
          <AlertCircleIcon color="red.500" fontSize="14px" position="relative" top={-2} right={2} />
        ) : null}
      </Flex>
    </Tooltip>
  ) : null;
}

PetitionSignatureCellContent.fragments = {
  Petition: gql`
    fragment PetitionSignatureCellContent_Petition on Petition {
      ...usePetitionCurrentSignatureStatusAndEnv_Petition
    }
    ${usePetitionCurrentSignatureStatusAndEnv.fragments.Petition}
  `,
};
