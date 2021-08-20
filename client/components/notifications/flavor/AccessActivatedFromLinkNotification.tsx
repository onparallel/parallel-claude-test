import { gql } from "@apollo/client";
import { Avatar } from "@chakra-ui/react";
import { LinkIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { AccessActivatedFromLinkNotification_AccessActivatedFromPublicPetitionLinkUserNotificationFragment } from "@parallel/graphql/__types";
import { forwardRef } from "react";
import { FormattedMessage } from "react-intl";
import { PetitionUserNotification } from "./PetitionUserNotification";

export interface AccessActivatedFromLinkNotificationProps {
  isFirst?: boolean;
  notification: AccessActivatedFromLinkNotification_AccessActivatedFromPublicPetitionLinkUserNotificationFragment;
}

export const AccessActivatedFromLinkNotification = Object.assign(
  forwardRef<HTMLElement, AccessActivatedFromLinkNotificationProps>(
    function AccessActivatedFromLinkNotification({ isFirst, notification }, ref) {
      return (
        <PetitionUserNotification
          ref={ref}
          isFirst={isFirst}
          notification={notification}
          icon={
            <Avatar
              boxSize="36px"
              background="purple.500"
              icon={<LinkIcon color="white" fontSize="1rem" />}
            />
          }
          path={`/activity`}
        >
          <FormattedMessage
            id="component.notification-access-activated-link.body"
            defaultMessage="{name} created the petition from a public link."
            values={{
              name: (
                <ContactLink
                  draggable="false"
                  tabIndex={-1}
                  contact={notification.access.contact}
                />
              ),
            }}
          />
        </PetitionUserNotification>
      );
    }
  ),
  {
    fragments: {
      AccessActivatedFromPublicPetitionLinkUserNotification: gql`
        fragment AccessActivatedFromLinkNotification_AccessActivatedFromPublicPetitionLinkUserNotification on AccessActivatedFromPublicPetitionLinkUserNotification {
          ...PetitionUserNotification_PetitionUserNotification
          access {
            contact {
              ...ContactLink_Contact
            }
          }
        }
        ${PetitionUserNotification.fragments.PetitionUserNotification}
        ${ContactLink.fragments.Contact}
      `,
    },
  }
);
