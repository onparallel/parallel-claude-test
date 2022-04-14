import { gql } from "@apollo/client";
import { HStack, StackProps, Text } from "@chakra-ui/react";
import { LinkIcon, LockClosedIcon } from "@parallel/chakra/icons";
import { LocaleBadge } from "@parallel/components/common/LocaleBadge";
import { TemplateActiveSettingsIcons_PetitionTemplateFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { SmallPopover } from "../common/SmallPopover";
import { TemplateIconDefaultPermissions } from "./TemplateIconDefaultPermissions";
import { TemplateIconReminders } from "./TemplateIconReminders";
import { TemplateIconSignature } from "./TemplateIconSignature";

export interface TemplateActiveSettingsIconsProps extends StackProps {
  template: TemplateActiveSettingsIcons_PetitionTemplateFragment;
}

export function TemplateActiveSettingsIcons({
  template,
  ...props
}: TemplateActiveSettingsIconsProps) {
  return (
    <HStack spacing={4} {...props}>
      <LocaleBadge locale={template.locale} gridGap={2} fontSize="sm" />
      {template.isRestricted ? (
        <SmallPopover
          content={
            <Text fontSize="sm">
              <FormattedMessage
                id="component.template-card.restricted-edition"
                defaultMessage="Restricted edition"
              />
            </Text>
          }
          width="auto"
        >
          <LockClosedIcon color="gray.600" boxSize={4} />
        </SmallPopover>
      ) : null}
      {template.publicLink?.isActive ? (
        <SmallPopover
          content={
            <Text fontSize="sm">
              <FormattedMessage
                id="component.template-card.active-link"
                defaultMessage="Link activated"
              />
            </Text>
          }
          width="auto"
        >
          <LinkIcon color="gray.600" boxSize={4} />
        </SmallPopover>
      ) : null}
      {template.signatureConfig ? (
        <TemplateIconSignature signatureConfig={template.signatureConfig} />
      ) : null}
      {template.remindersConfig ? (
        <TemplateIconReminders remindersConfig={template.remindersConfig} />
      ) : null}
      {template.defaultPermissions && template.defaultPermissions.length ? (
        <TemplateIconDefaultPermissions defaultPermissions={template.defaultPermissions} />
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
        ...TemplateIconSignature_SignatureConfig
      }
      remindersConfig {
        ...TemplateIconReminders_RemindersConfig
      }
      defaultPermissions {
        ...TemplateIconDefaultPermissions_TemplateDefaultPermission
      }
    }
    ${TemplateIconSignature.fragments.SignatureConfig}
    ${TemplateIconReminders.fragments.RemindersConfig}
    ${TemplateIconDefaultPermissions.fragments.TemplateDefaultPermission}
  `,
};
