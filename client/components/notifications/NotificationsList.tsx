import { gql } from "@apollo/client";
import { Stack, Text } from "@chakra-ui/layout";
import { Center, LinkBox, Spinner } from "@chakra-ui/react";
import { NotificationsDrawer_PetitionUserNotificationFragment } from "@parallel/graphql/__types";
import { useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { FormattedMessage } from "react-intl";
import { CommentCreatedUserNotification } from "./flavor/CommentCreatedUserNotification";
import { MessageEmailBouncedUserNotification } from "./flavor/MessageEmailBouncedUserNotification";
import { PetitionCompletedUserNotification } from "./flavor/PetitionCompletedUserNotification";
import { PetitionSharedUserNotification } from "./flavor/PetitionSharedUserNotification";
import { SignatureCancelledUserNotification } from "./flavor/SignatureCancelledUserNotification";
import { SignatureCompletedUserNotification } from "./flavor/SignatureCompletedUserNotification";
import { EmptyNotificationsIcon } from "./icons/EmptyNotificationsIcon";

export interface NotificationListProps {
  notifications: NotificationsDrawer_PetitionUserNotificationFragment[];
  onFetchData: () => void;
  hasMore: boolean;
  loading: boolean;
}

export function NotificationsList({
  notifications = [],
  onFetchData,
  hasMore,
  loading,
}: NotificationListProps) {
  useEffect(() => {
    console.log("%c --- NotificationsList RENDER ---", "color: #d49e22");
  });

  if (loading && !hasMore) {
    return (
      <Center height="100%">
        <Spinner
          thickness="2px"
          speed="0.65s"
          emptyColor="gray.200"
          color="gray.600"
          size="xl"
        />
      </Center>
    );
  }

  return (
    <>
      {notifications && notifications.length ? (
        <InfiniteScroll
          dataLength={notifications.length} //This is important field to render the next data
          next={onFetchData}
          hasMore={hasMore}
          scrollThreshold={0.7}
          loader={
            <Center height="42px" background="gray.75">
              <Spinner
                thickness="2px"
                speed="0.65s"
                emptyColor="gray.200"
                color="gray.600"
                size="md"
              />
            </Center>
          }
          endMessage={null}
          scrollableTarget="notifications-body"
        >
          {notifications.map((n) => (
            <LinkBox key={n.id}>
              {n.__typename === "PetitionCompletedUserNotification" ? (
                <PetitionCompletedUserNotification notification={n} />
              ) : n.__typename === "SignatureCompletedUserNotification" ? (
                <SignatureCompletedUserNotification notification={n} />
              ) : n.__typename === "SignatureCancelledUserNotification" ? (
                <SignatureCancelledUserNotification notification={n} />
              ) : n.__typename === "PetitionSharedUserNotification" ? (
                <PetitionSharedUserNotification notification={n} />
              ) : n.__typename === "MessageEmailBouncedUserNotification" ? (
                <MessageEmailBouncedUserNotification notification={n} />
              ) : n.__typename === "CommentCreatedUserNotification" ? (
                <CommentCreatedUserNotification notification={n} />
              ) : null}
            </LinkBox>
          ))}
        </InfiniteScroll>
      ) : (
        <Stack
          height="100%"
          alignItems="center"
          justifyContent="center"
          spacing={10}
        >
          <EmptyNotificationsIcon width="300px" height="200px" />
          <Text>
            <FormattedMessage
              id="component.notifications-list.empty-notifications"
              defaultMessage="There's no notifications yet"
            />
          </Text>
        </Stack>
      )}
    </>
  );
}

NotificationsList.fragments = {
  PetitionUserNotification: gql`
    fragment NotificationsList_PetitionUserNotification on PetitionUserNotification {
      ... on CommentCreatedUserNotification {
        ...CommentCreatedUserNotification_CommentCreatedUserNotification
      }
      ... on MessageEmailBouncedUserNotification {
        ...MessageEmailBouncedUserNotification_MessageEmailBouncedUserNotification
      }
      ... on PetitionCompletedUserNotification {
        ...PetitionCompletedUserNotification_PetitionCompletedUserNotification
      }
      ... on PetitionSharedUserNotification {
        ...PetitionSharedUserNotification_PetitionSharedUserNotification
      }
      ... on SignatureCancelledUserNotification {
        ...SignatureCancelledUserNotification_SignatureCancelledUserNotification
      }
      ... on SignatureCompletedUserNotification {
        ...SignatureCompletedUserNotification_SignatureCompletedUserNotification
      }
    }
    ${CommentCreatedUserNotification.fragments.CommentCreatedUserNotification}
    ${MessageEmailBouncedUserNotification.fragments
      .MessageEmailBouncedUserNotification}
    ${PetitionCompletedUserNotification.fragments
      .PetitionCompletedUserNotification}
    ${PetitionSharedUserNotification.fragments.PetitionSharedUserNotification}
    ${SignatureCancelledUserNotification.fragments
      .SignatureCancelledUserNotification}
    ${SignatureCompletedUserNotification.fragments
      .SignatureCompletedUserNotification}
  `,
};
