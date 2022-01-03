import { gql } from "@apollo/client";
import { Button, ButtonProps, Text } from "@chakra-ui/react";
import { UserArrowIcon } from "@parallel/chakra/icons";
import { ShareButton_PetitionBaseFragment } from "@parallel/graphql/__types";
import { FormattedList, FormattedMessage } from "react-intl";
import { SmallPopover } from "./SmallPopover";

export function ShareButton({
  petition,
  userId,
  ...props
}: ButtonProps & {
  petition: ShareButton_PetitionBaseFragment;
  userId: string;
}) {
  const names = petition!.permissions.map((p) =>
    p.__typename === "PetitionUserPermission"
      ? p.user.fullName
      : p.__typename === "PetitionUserGroupPermission"
      ? p.group.name
      : (null as never)
  );

  return (
    <SmallPopover
      content={
        petition!.permissions.length > 1 ? (
          <Text>
            <FormattedMessage
              id="component.share-button.shared-with"
              defaultMessage="Shared with:"
            />{" "}
            <FormattedList value={names} />
          </Text>
        ) : (
          <Text>
            {petition.__typename === "Petition" ? (
              <FormattedMessage
                id="component.share-button.petition-not-shared"
                defaultMessage="This petition has not been shared yet."
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
      <Button colorScheme="purple" leftIcon={<UserArrowIcon fontSize="18px" />} {...props}>
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
          }
        }
        ... on PetitionUserGroupPermission {
          group {
            id
            name
          }
        }
      }
    }
  `,
};
