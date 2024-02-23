import { gql } from "@apollo/client";
import { Button, ButtonOptions, ThemingProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  PetitionPreviewStartSignatureButton_PetitionFragment,
  PetitionPreviewStartSignatureButton_UserFragment,
} from "@parallel/graphql/__types";
import { useStartSignatureRequest } from "@parallel/utils/useStartSignatureRequest";

interface PetitionPreviewStartSignatureButtonProps extends ButtonOptions, ThemingProps<"Button"> {
  user: PetitionPreviewStartSignatureButton_UserFragment;
  petition: PetitionPreviewStartSignatureButton_PetitionFragment;
  onRefetch?: () => void;
  isDisabled?: boolean;
}

export const PetitionPreviewStartSignatureButton = Object.assign(
  chakraForwardRef<"button", PetitionPreviewStartSignatureButtonProps>(
    function PetitionPreviewStartSignatureButton(
      { user, petition, onRefetch, isDisabled, ...props },
      ref,
    ) {
      const { handleStartSignature, buttonLabel } = useStartSignatureRequest({
        user,
        petition,
        onRefetch,
      });

      return (
        <Button ref={ref} isDisabled={isDisabled} onClick={handleStartSignature} {...props}>
          {buttonLabel}
        </Button>
      );
    },
  ),
  {
    fragments: {
      Petition: gql`
        fragment PetitionPreviewStartSignatureButton_Petition on Petition {
          id
          ...useStartSignatureRequest_Petition
        }
        ${useStartSignatureRequest.fragments.Petition}
      `,
      User: gql`
        fragment PetitionPreviewStartSignatureButton_User on User {
          id
          ...useStartSignatureRequest_User
        }
        ${useStartSignatureRequest.fragments.User}
      `,
    },
  },
);
