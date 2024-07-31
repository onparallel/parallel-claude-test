import { gql } from "@apollo/client";
import { Button, ButtonProps, Text } from "@chakra-ui/react";
import { UserArrowIcon } from "@parallel/chakra/icons";
import { ShareButton_PetitionBaseFragment } from "@parallel/graphql/__types";
import { FormattedList, FormattedMessage } from "react-intl";
import { UserGroupReference } from "./UserGroupReference";
import { UserReference } from "./UserReference";
import { SmallPopover } from "./SmallPopover";

export function ShareButton({
  petition,
  userId,
  ...props
}: ButtonProps & {
  petition: ShareButton_PetitionBaseFragment;
  userId: string;
}) {
  return (
    <SmallPopover
      content={
        petition!.permissions.length > 1 ? (
          <Text>
            <FormattedMessage
              id="component.share-button.shared-with"
              defaultMessage="Shared with:"
            />{" "}
            <FormattedList
              value={petition!.permissions.map((p) =>
                p.__typename === "PetitionUserPermission" ? (
                  <UserReference key={p.user.id} user={p.user} />
                ) : p.__typename === "PetitionUserGroupPermission" ? (
                  <UserGroupReference key={p.group.id} userGroup={p.group} as="strong" />
                ) : (
                  (null as never)
                ),
              )}
            />
          </Text>
        ) : (
          <Text>
            {petition.__typename === "Petition" ? (
              <FormattedMessage
                id="component.share-button.petition-not-shared"
                defaultMessage="This parallel has not been shared yet."
              />
            ) : (
              <FormattedMessage
                id="component.share-button.template-not-shared"
                defaultMessage="This template has not been shared yet."
              />
            )}
          </Text>
        )
      }
    >
      <Button leftIcon={<UserArrowIcon fontSize="18px" />} {...props}>
        <FormattedMessage id="generic.share" defaultMessage="Share" />
      </Button>
    </SmallPopover>
  );
}

ShareButton.fragments = {
  PetitionBase: gql`
    fragment ShareButton_PetitionBase on PetitionBase {
      permissions {
        permissionType
        ... on PetitionUserPermission {
          user {
            id
            fullName
            ...UserReference_User
          }
        }
        ... on PetitionUserGroupPermission {
          group {
            id
            ...UserGroupReference_UserGroup
          }
        }
      }
    }
    ${UserReference.fragments.User}
    ${UserGroupReference.fragments.UserGroup}
  `,
};
