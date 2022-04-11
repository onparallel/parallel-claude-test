import { gql } from "@apollo/client";
import { Badge, Text } from "@chakra-ui/react";
import { TestModeSignatureBadge_UserFragment } from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { SmallPopover } from "../common/SmallPopover";
import { SupportLink } from "../common/SupportLink";

export function TestModeSignatureBadge({
  hasPetitionSignature,
}: TestModeSignatureBadge_UserFragment) {
  const intl = useIntl();
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
        a: (chunks: any) => (
          <SupportLink
            message={intl.formatMessage({
              id: "component.test-mode-signature-badge.activate-signature-message",
              defaultMessage:
                "Hi, I would like to get more information about how to activate eSignature.",
            })}
          >
            {chunks}
          </SupportLink>
        ),
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
