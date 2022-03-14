import { gql } from "@apollo/client";
import { HStack, StackProps, Tooltip } from "@chakra-ui/react";
import { BellSettingsIcon, LinkIcon, LockClosedIcon, SignatureIcon } from "@parallel/chakra/icons";
import { LocaleBadge } from "@parallel/components/common/LocaleBadge";
import { TemplateActiveSettingsIcons_PetitionTemplateFragment } from "@parallel/graphql/__types";
import { useIntl } from "react-intl";

export interface TemplateActiveSettingsIconsProps extends StackProps {
  template: TemplateActiveSettingsIcons_PetitionTemplateFragment;
}

export function TemplateActiveSettingsIcons({
  template,
  ...props
}: TemplateActiveSettingsIconsProps) {
  const intl = useIntl();

  return (
    <HStack spacing={4} {...props}>
      <LocaleBadge locale={template.locale} gridGap={2} />
      {template.isRestricted ? (
        <Tooltip
          label={intl.formatMessage({
            id: "component.template-card.restricted-edition",
            defaultMessage: "Restricted edition",
          })}
        >
          <LockClosedIcon color="gray.600" boxSize={4} />
        </Tooltip>
      ) : null}
      {template.publicLink?.isActive ? (
        <Tooltip
          label={intl.formatMessage({
            id: "component.template-card.active-link",
            defaultMessage: "Link activated",
          })}
        >
          <LinkIcon color="gray.600" boxSize={4} />
        </Tooltip>
      ) : null}
      {template.signatureConfig ? (
        <Tooltip
          label={intl.formatMessage({
            id: "component.template-card.esignature-active",
            defaultMessage: "eSignature activated",
          })}
        >
          <SignatureIcon color="gray.600" boxSize={4} />
        </Tooltip>
      ) : null}
      {template.remindersConfig ? (
        <Tooltip
          label={intl.formatMessage({
            id: "component.template-card.automatic-reminders-active",
            defaultMessage: "Automatic reminders activated",
          })}
        >
          <BellSettingsIcon color="gray.600" boxSize={4} />
        </Tooltip>
      ) : null}
    </HStack>
  );
}

TemplateActiveSettingsIcons.fragments = {
  PetitionTemplate: gql`
    fragment TemplateActiveSettingsIcons_PetitionTemplate on PetitionTemplate {
      id
      locale
      isRestricted
      publicLink {
        id
        isActive
      }
      signatureConfig {
        title
      }
      remindersConfig {
        time
      }
    }
  `,
};
