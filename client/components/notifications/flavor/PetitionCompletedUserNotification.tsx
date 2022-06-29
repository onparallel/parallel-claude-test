import { gql } from "@apollo/client";
import { Circle } from "@chakra-ui/react";
import { CheckIcon } from "@parallel/chakra/icons";
import { UserOrContactReference } from "@parallel/components/petition-activity/UserOrContactReference";
import { PetitionCompletedUserNotification_PetitionCompletedUserNotificationFragment } from "@parallel/graphql/__types";
import { forwardRef } from "react";
import { FormattedMessage } from "react-intl";
import { PetitionUserNotification } from "./PetitionUserNotification";

export interface PetitionCompletedUserNotificationProps {
  isFirst?: boolean;
  notification: PetitionCompletedUserNotification_PetitionCompletedUserNotificationFragment;
}

export const PetitionCompletedUserNotification = Object.assign(
  forwardRef<HTMLElement, PetitionCompletedUserNotificationProps>(
    function PetitionCompletedUserNotification({ isFirst, notification }, ref) {
      return (
        <PetitionUserNotification
          ref={ref}
          isFirst={isFirst}
          notification={notification}
          icon={
            <Circle size="36px" background="green.600">
              <CheckIcon color="white" fontSize="1rem" />
            </Circle>
          }
          path={`/replies`}
        >
          <FormattedMessage
            id="component.notification-petition-completed.body"
            defaultMessage="{name} completed the parallel."
            values={{
              name: (
                <UserOrContactReference
                  userOrAccess={notification.completedBy}
                  draggable="false"
                  tabIndex={-1}
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
      PetitionCompletedUserNotification: gql`
        fragment PetitionCompletedUserNotification_PetitionCompletedUserNotification on PetitionCompletedUserNotification {
          ...PetitionUserNotification_PetitionUserNotification
          completedBy {
            ...UserOrContactReference_UserOrPetitionAccess
          }
        }
        ${PetitionUserNotification.fragments.PetitionUserNotification}
        ${UserOrContactReference.fragments.UserOrPetitionAccess}
      `,
    },
  }
);
