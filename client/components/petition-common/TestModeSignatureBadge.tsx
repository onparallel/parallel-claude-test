import { gql } from "@apollo/client";
import { Badge, Text } from "@chakra-ui/react";
import { TestModeSignatureBadge_UserFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { NormalLink } from "../common/Link";
import { SmallPopover } from "../common/SmallPopover";

export function TestModeSignatureBadge({
  hasPetitionSignature,
}: TestModeSignatureBadge_UserFragment) {
  const popoverText = hasPetitionSignature ? (
    <FormattedMessage
      id="component.test-mode-signature-badge.popover-text"
      defaultMessage="This eSignature has been configured in test mode. You will be able to send signatures but they will not have any legal validity."
    />
  ) : (
    <FormattedMessage
      id="component.test-mode-signature-badge.popover-text-demo"
      defaultMessage="Test mode allows you to send signatures but they will not have legal validity. To activate eSignature, <a>contact our support team.</a>"
      values={{
        a: (chunks: any) => <NormalLink href="mailto:support@onparallel.com">{chunks}</NormalLink>,
      }}
    />
  );

  return (
    <SmallPopover content={<Text fontSize="sm">{popoverText}</Text>}>
      <Badge colorScheme="yellow" textTransform="uppercase">
        <FormattedMessage id="generic.signature-demo-environment" defaultMessage="Test" />
      </Badge>
    </SmallPopover>
  );
}

TestModeSignatureBadge.fragments = {
  User: gql`
    fragment TestModeSignatureBadge_User on User {
      hasPetitionSignature: hasFeatureFlag(featureFlag: PETITION_SIGNATURE)
    }
  `,
};
