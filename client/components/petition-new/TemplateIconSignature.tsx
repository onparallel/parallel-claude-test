import { gql } from "@apollo/client";
import { PopoverProps, Text } from "@chakra-ui/react";
import { SignatureIcon } from "@parallel/chakra/icons";
import { TemplateIconSignature_SignatureConfigFragment } from "@parallel/graphql/__types";
import { useIntl } from "react-intl";
import { SmallPopover } from "../common/SmallPopover";

export interface TemplateIconSignatureProps extends PopoverProps {
  signatureConfig: TemplateIconSignature_SignatureConfigFragment;
}

export function TemplateIconSignature({ signatureConfig, ...props }: TemplateIconSignatureProps) {
  const intl = useIntl();
  return (
    <SmallPopover
      content={
        <Text fontSize="sm">
          {signatureConfig.review
            ? intl.formatMessage({
                id: "component.template-icon-signature.esignature-active-review",
                defaultMessage: "A eSignature will be initiated after reviewing the information",
              })
            : intl.formatMessage({
                id: "component.template-icon-signature.esignature-active-no-review",
                defaultMessage: "A eSignature will be initiated upon completion of the parallel",
              })}
        </Text>
      }
      {...props}
    >
      <SignatureIcon color="gray.600" boxSize={4} />
    </SmallPopover>
  );
}

TemplateIconSignature.fragments = {
  SignatureConfig: gql`
    fragment TemplateIconSignature_SignatureConfig on SignatureConfig {
      review
    }
  `,
};
