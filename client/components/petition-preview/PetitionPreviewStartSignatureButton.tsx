import { gql } from "@apollo/client";
import { Button, ButtonOptions, ThemingProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionPreviewStartSignatureButton_PetitionFragment } from "@parallel/graphql/__types";
import { useStartSignatureRequest } from "@parallel/utils/useStartSignatureRequest";

interface PetitionPreviewStartSignatureButtonProps extends ButtonOptions, ThemingProps<"Button"> {
  petition: PetitionPreviewStartSignatureButton_PetitionFragment;
  isDisabled?: boolean;
}

export const PetitionPreviewStartSignatureButton = chakraForwardRef<
  "button",
  PetitionPreviewStartSignatureButtonProps
>(function PetitionPreviewStartSignatureButton({ petition, isDisabled, ...props }, ref) {
  const { handleStartSignature, buttonLabel } = useStartSignatureRequest({
    petition,
  });

  return (
    <Button ref={ref} isDisabled={isDisabled} onClick={handleStartSignature} {...props}>
      {buttonLabel}
    </Button>
  );
});

const _fragments = {
  Petition: gql`
    fragment PetitionPreviewStartSignatureButton_Petition on Petition {
      id
      ...useStartSignatureRequest_Petition
    }
  `,
};
