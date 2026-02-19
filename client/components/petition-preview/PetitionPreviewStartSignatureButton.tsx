import { gql } from "@apollo/client";
import { ButtonOptions, ThemingProps } from "@chakra-ui/react";
import { chakraComponent } from "@parallel/chakra/utils";
import { Button } from "@parallel/components/ui";
import { PetitionPreviewStartSignatureButton_PetitionFragment } from "@parallel/graphql/__types";
import { useStartSignatureRequest } from "@parallel/utils/useStartSignatureRequest";

interface PetitionPreviewStartSignatureButtonProps extends ButtonOptions, ThemingProps<"Button"> {
  petition: PetitionPreviewStartSignatureButton_PetitionFragment;
}

export const PetitionPreviewStartSignatureButton = chakraComponent<
  "button",
  PetitionPreviewStartSignatureButtonProps
>(function PetitionPreviewStartSignatureButton({ ref, petition, ...props }) {
  const { handleStartSignature, buttonLabel } = useStartSignatureRequest({
    petition,
  });

  return (
    <Button ref={ref} onClick={handleStartSignature} {...props}>
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
