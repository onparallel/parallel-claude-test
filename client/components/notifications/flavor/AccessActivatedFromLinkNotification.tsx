import { gql } from "@apollo/client";
import { Circle } from "@chakra-ui/react";
import { LinkIcon } from "@parallel/chakra/icons";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { AccessActivatedFromLinkNotification_AccessActivatedFromPublicPetitionLinkUserNotificationFragment } from "@parallel/graphql/__types";
import { forwardRef } from "react";
import { FormattedMessage } from "react-intl";
import { PetitionUserNotification } from "./PetitionUserNotification";

interface AccessActivatedFromLinkNotificationProps {
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
            <Circle size="36px" background="primary.500">
              <LinkIcon color="white" fontSize="1rem" />
            </Circle>
          }
          path={`/activity`}
        >
          <FormattedMessage
            id="component.notification-access-activated-link.body"
            defaultMessage="{name} created the parallel from a public link."
            values={{
              name: (
                <ContactReference
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
              ...ContactReference_Contact
            }
          }
        }
        ${PetitionUserNotification.fragments.PetitionUserNotification}
        ${ContactReference.fragments.Contact}
      `,
    },
  }
);
