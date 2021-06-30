import { gql } from "@apollo/client";
import { Stack, Text } from "@chakra-ui/layout";
import { Box, Center, LinkBox, Spinner } from "@chakra-ui/react";
import { NotificationsDrawer_PetitionUserNotificationFragment } from "@parallel/graphql/__types";
import { useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { FormattedMessage } from "react-intl";
import { NotificationComment } from "./flavor/NotificationComment";
import { NotificationEmailBounced } from "./flavor/NotificationEmailBounced";
import { NotificationPetitionCompleted } from "./flavor/NotificationPetitionCompleted";
import { NotificationPetitionShared } from "./flavor/NotificationPetitionShared";
import { NotificationSignatureCancelled } from "./flavor/NotificationSignatureCancelled";
import { NotificationSignatureCompleted } from "./flavor/NotificationSignatureCompleted";
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
          <Box>
            {notifications.map((n) => (
              <LinkBox key={n.id}>
                {n.__typename === "PetitionCompletedUserNotification" ? (
                  <NotificationPetitionCompleted notification={n} />
                ) : n.__typename === "SignatureCompletedUserNotification" ? (
                  <NotificationSignatureCompleted notification={n} />
                ) : n.__typename === "SignatureCancelledUserNotification" ? (
                  <NotificationSignatureCancelled notification={n} />
                ) : n.__typename === "PetitionSharedUserNotification" ? (
                  <NotificationPetitionShared notification={n} />
                ) : n.__typename === "MessageEmailBouncedUserNotification" ? (
                  <NotificationEmailBounced notification={n} />
                ) : n.__typename === "CommentCreatedUserNotification" ? (
                  <NotificationComment notification={n} />
                ) : null}
              </LinkBox>
            ))}
          </Box>
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
        ...NotificationComment_CommentCreatedUserNotification
      }
      ... on MessageEmailBouncedUserNotification {
        ...NotificationEmailBounced_MessageEmailBouncedUserNotification
      }
      ... on PetitionCompletedUserNotification {
        ...NotificationPetitionCompleted_PetitionCompletedUserNotification
      }
      ... on PetitionSharedUserNotification {
        ...NotificationPetitionShared_PetitionSharedUserNotification
      }
      ... on SignatureCancelledUserNotification {
        ...NotificationSignatureCanceled_SignatureCancelledUserNotification
      }
      ... on SignatureCompletedUserNotification {
        ...NotificationSignatureCompleted_SignatureCompletedUserNotification
      }
    }
    ${NotificationComment.fragments.CommentCreatedUserNotification}
    ${NotificationEmailBounced.fragments.MessageEmailBouncedUserNotification}
    ${NotificationPetitionCompleted.fragments.PetitionCompletedUserNotification}
    ${NotificationPetitionShared.fragments.PetitionSharedUserNotification}
    ${NotificationSignatureCancelled.fragments
      .SignatureCancelledUserNotification}
    ${NotificationSignatureCompleted.fragments
      .SignatureCompletedUserNotification}
  `,
};
