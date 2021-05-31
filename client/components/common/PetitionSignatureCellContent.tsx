import { gql } from "@apollo/client";
import { Box, Flex, Tooltip } from "@chakra-ui/react";
import {
  AlertCircleIcon,
  SignatureIcon,
  TimeIcon,
} from "@parallel/chakra/icons";
import {
  PetitionSignatureCellContent_PetitionFragment,
  PetitionSignatureCellContent_UserFragment,
} from "@parallel/graphql/__types";
import { If } from "@parallel/utils/conditions";
import { usePetitionCurrentSignatureStatus } from "@parallel/utils/usePetitionCurrentSignatureStatus";
import { usePetitionSignatureStatusLabels } from "@parallel/utils/usePetitionSignatureStatusLabels";

interface PetitionSignatureCellContentProps {
  petition: PetitionSignatureCellContent_PetitionFragment;
  user: PetitionSignatureCellContent_UserFragment;
}
export function PetitionSignatureCellContent({
  petition,
  user,
}: PetitionSignatureCellContentProps) {
  const labels = usePetitionSignatureStatusLabels();
  const status = usePetitionCurrentSignatureStatus(petition);
  return user.hasPetitionSignature && status ? (
    <Tooltip label={labels[status]}>
      <Flex alignItems="center">
        <If condition={status === "START"}>
          <Box
            width="4px"
            height="4px"
            borderColor="purple.500"
            borderWidth="4px"
            borderRadius="100%"
            marginRight="2px"
          />
        </If>
        <SignatureIcon
          color={status === "COMPLETED" ? "gray.700" : "gray.400"}
        />
        {status === "PROCESSING" ? (
          <TimeIcon
            color="yellow.600"
            fontSize="13px"
            position="relative"
            top={-2}
            right={2}
          />
        ) : status === "CANCELLED" ? (
          <AlertCircleIcon
            color="red.500"
            fontSize="14px"
            position="relative"
            top={-2}
            right={2}
          />
        ) : null}
      </Flex>
    </Tooltip>
  ) : null;
}

PetitionSignatureCellContent.fragments = {
  Petition: gql`
    fragment PetitionSignatureCellContent_Petition on Petition {
      ...usePetitionCurrentSignatureStatus_Petition
        @include(if: $hasPetitionSignature)
    }
    ${usePetitionCurrentSignatureStatus.fragments.Petition}
  `,
  User: gql`
    fragment PetitionSignatureCellContent_User on User {
      hasPetitionSignature: hasFeatureFlag(featureFlag: PETITION_SIGNATURE)
    }
  `,
};
