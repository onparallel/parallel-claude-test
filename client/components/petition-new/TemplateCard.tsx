import { gql } from "@apollo/client";
import { Flex, HStack, Stack, Text, Tooltip } from "@chakra-ui/react";
import { BellSettingsIcon, LinkIcon, LockClosedIcon, SignatureIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Card } from "@parallel/components/common/Card";
import { LocaleBadge } from "@parallel/components/common/LocaleBadge";
import { Spacer } from "@parallel/components/common/Spacer";
import { TemplateCard_PetitionTemplateFragment } from "@parallel/graphql/__types";
import { useRoleButton } from "@parallel/utils/useRoleButton";
import { FormattedMessage, useIntl } from "react-intl";
import { UserAvatarList } from "../common/UserAvatarList";

export interface TemplateCardProps {
  template: TemplateCard_PetitionTemplateFragment;
  onPress: () => void;
}

export const TemplateCard = Object.assign(
  chakraForwardRef<"div", TemplateCardProps>(function TemplateCard(
    { template, onPress, ...props },
    ref
  ) {
    const intl = useIntl();
    const buttonProps = useRoleButton(onPress);

    return (
      <Card
        ref={ref}
        as={Stack}
        padding={4}
        minHeight="160px"
        outline="none"
        transition="all 150ms ease"
        _hover={{
          borderColor: "gray.300",
          boxShadow: "long",
          transform: "scale(1.025)",
        }}
        _focus={{
          boxShadow: "outline",
          borderColor: "gray.200",
        }}
        minWidth={0}
        {...buttonProps}
        {...props}
      >
        {template.name ? (
          <Text as="h2" size="lg" noOfLines={2} fontWeight="bold">
            {template.name}
          </Text>
        ) : (
          <Text as="h2" size="lg" noOfLines={2} fontWeight="normal" fontStyle="italic">
            <FormattedMessage id="generic.untitled-template" defaultMessage="Untitled template" />
          </Text>
        )}
        <Spacer />
        <Flex alignItems="center">
          <HStack>
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
          <Spacer />
          <UserAvatarList
            usersOrGroups={template!.permissions.map((p) =>
              p.__typename === "PetitionUserPermission"
                ? p.user
                : p.__typename === "PetitionUserGroupPermission"
                ? p.group
                : (null as never)
            )}
          />
        </Flex>
      </Card>
    );
  }),
  {
    fragments: {
      PetitionTemplate: gql`
        fragment TemplateCard_PetitionTemplate on PetitionTemplate {
          id
          name
          locale
          isRestricted
          permissions {
            ... on PetitionUserPermission {
              user {
                ...UserAvatarList_User
              }
            }
            ... on PetitionUserGroupPermission {
              group {
                ...UserAvatarList_UserGroup
              }
            }
          }
          signatureConfig {
            title
          }
          publicLink {
            id
            isActive
          }
          remindersConfig {
            time
          }
        }
        ${UserAvatarList.fragments.User}
        ${UserAvatarList.fragments.UserGroup}
      `,
    },
  }
);
