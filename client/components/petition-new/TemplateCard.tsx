import { gql } from "@apollo/client";
import { Flex, Stack } from "@chakra-ui/react";
import { chakraComponent } from "@parallel/chakra/utils";
import { Card } from "@parallel/components/common/Card";
import { Spacer } from "@parallel/components/common/Spacer";
import { Text } from "@parallel/components/ui";
import { TemplateCard_PetitionTemplateFragment } from "@parallel/graphql/__types";
import { useRoleButton } from "@parallel/utils/useRoleButton";
import { FormattedMessage } from "react-intl";
import { UserAvatarList } from "../common/UserAvatarList";
import { TemplateActiveSettingsIcons } from "./TemplateActiveSettingsIcons";

export interface TemplateCardProps {
  template: TemplateCard_PetitionTemplateFragment;
  onPress: () => void;
}

export const TemplateCard = chakraComponent<"div", TemplateCardProps>(function TemplateCard({
  ref,
  template,
  onPress,
  ...props
}) {
  const buttonProps = useRoleButton(onPress);

  return (
    <Card
      ref={ref}
      as={Stack}
      padding={4}
      minHeight="160px"
      outline="none"
      isInteractive
      minWidth={0}
      {...buttonProps}
      {...props}
    >
      {template.name ? (
        <Text as="h2" fontSize="lg" lineClamp={2} fontWeight="bold">
          {template.name}
        </Text>
      ) : (
        <Text as="h2" fontSize="lg" lineClamp={2} fontWeight="normal" fontStyle="italic">
          <FormattedMessage id="generic.unnamed-template" defaultMessage="Unnamed template" />
        </Text>
      )}

      <Spacer />
      <Flex alignItems="center">
        <TemplateActiveSettingsIcons template={template} spacing={2.5} />
        <Spacer />
        <UserAvatarList
          usersOrGroups={template!.permissions.map((p) =>
            p.__typename === "PetitionUserPermission"
              ? p.user
              : p.__typename === "PetitionUserGroupPermission"
                ? p.group
                : (null as never),
          )}
        />
      </Flex>
    </Card>
  );
});

const _fragments = {
  PetitionTemplate: gql`
    fragment TemplateCard_PetitionTemplate on PetitionTemplate {
      id
      name
      permissions {
        ... on PetitionUserPermission {
          user {
            id
            ...UserAvatarList_User
          }
        }
        ... on PetitionUserGroupPermission {
          group {
            id
            ...UserAvatarList_UserGroup
          }
        }
      }
      ...TemplateActiveSettingsIcons_PetitionTemplate
    }
  `,
};
