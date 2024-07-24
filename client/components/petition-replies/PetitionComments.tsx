import { gql } from "@apollo/client";
import { Badge, Box, Center, HStack, LinkBox, LinkOverlay, Stack, Text } from "@chakra-ui/react";
import { PetitionComments_PetitionBaseFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { DateTime } from "../common/DateTime";
import { PetitionFieldCommentExcerpt } from "../common/PetitionFieldCommentExcerpt";
import { UserOrContactReference } from "../petition-activity/UserOrContactReference";

export interface PetitionCommentsProps {
  petition: PetitionComments_PetitionBaseFragment;
  onSelectField: (fieldId: string) => void;
}

export function PetitionComments({ petition, onSelectField }: PetitionCommentsProps) {
  const intl = useIntl();
  const fieldsWithComments =
    petition.fields
      .filter((f) => isDefined(f.lastComment) && f.hasCommentsEnabled)
      .sort((a, b) => {
        const lastCommentA = a.lastComment!.createdAt;
        const lastCommentB = b.lastComment!.createdAt;
        return new Date(lastCommentB).getTime() - new Date(lastCommentA).getTime();
      }) ?? [];

  return (
    <Box overflow="auto" flex={1} paddingTop="1px">
      {fieldsWithComments.length === 0 ? (
        <Center
          textAlign="center"
          display="flex"
          flexDirection="column"
          gap={2}
          padding={4}
          height="100%"
          width="100%"
        >
          <Text as="h3" fontWeight="bold">
            <FormattedMessage
              id="component.recipient-view-comments.no-comments-title"
              defaultMessage="There are no comments yet."
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.recipient-view-comments.no-comments-body"
              defaultMessage="Select the {commentsButtonLabel} buttons to add a comment in a field."
              values={{
                commentsButtonLabel: (
                  <b>
                    {intl.formatMessage({
                      id: "recipient-view.doubts-button",
                      defaultMessage: "Questions?",
                    })}
                  </b>
                ),
              }}
            />
          </Text>
        </Center>
      ) : (
        fieldsWithComments.map((field) => {
          const comment = field.lastComment!;
          const unreadCount = field.unreadCommentCount;
          return (
            <LinkBox
              as={Stack}
              key={field.id}
              spacing={1}
              paddingX={4}
              paddingY={2}
              backgroundColor={unreadCount > 0 ? "primary.50" : "white"}
              borderBottom="1px solid"
              borderColor="gray.200"
              tabIndex={0}
              _focus={{
                outline: "none",
                boxShadow: "inline",
              }}
              _hover={{
                background: "gray.75",
              }}
              onKeyDown={(e) => {
                if (e.code === "Space" || e.code === "Enter") {
                  onSelectField(field.id);
                }
              }}
            >
              <HStack justify="space-between" align="baseline">
                <LinkOverlay
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectField(field.id);
                  }}
                  href="#"
                  tabIndex={-1}
                >
                  <Text noOfLines={2} fontWeight={600} fontStyle={field.title ? undefined : "hint"}>
                    {field.title ??
                      intl.formatMessage({
                        id: "generic.untitled-field",
                        defaultMessage: "Untitled field",
                      })}
                  </Text>
                </LinkOverlay>

                <DateTime
                  fontSize="sm"
                  whiteSpace="nowrap"
                  color={unreadCount > 0 ? "primary.500" : "gray.600"}
                  value={comment.createdAt}
                  format={FORMATS.LLL}
                  useRelativeTime
                />
              </HStack>
              <HStack color="gray.600" justify="space-between">
                <Box flex="1">
                  <Text noOfLines={2} fontSize="sm" as="span" wordBreak="break-all">
                    <UserOrContactReference
                      userOrAccess={comment.author}
                      userUseYou
                      _activeContact={{ fontWeight: "bold" }}
                    />
                    {`: `}
                    {comment.isInternal ? (
                      <Badge
                        color="gray.600"
                        variant="outline"
                        cursor="default"
                        marginEnd={1}
                        verticalAlign="baseline"
                      >
                        <FormattedMessage id="generic.note" defaultMessage="Note" />
                      </Badge>
                    ) : null}
                    <PetitionFieldCommentExcerpt as="span" comment={comment} />
                  </Text>
                </Box>
                {unreadCount ? (
                  <Badge
                    background="primary.500"
                    color="white"
                    fontSize="xs"
                    borderRadius="full"
                    minW="18px"
                    minH="18px"
                    lineHeight="18px"
                    pointerEvents="none"
                    textAlign="center"
                  >
                    {unreadCount < 100 ? unreadCount : "99+"}
                  </Badge>
                ) : null}
              </HStack>
            </LinkBox>
          );
        })
      )}
    </Box>
  );
}

PetitionComments.fragments = {
  PetitionField: gql`
    fragment PetitionComments_PetitionField on PetitionField {
      id
      title
      commentCount
      unreadCommentCount
      hasCommentsEnabled
      lastComment {
        id
        createdAt
        isInternal
        author {
          ...UserOrContactReference_UserOrPetitionAccess
        }
        ...PetitionFieldCommentExcerpt_PetitionFieldComment
      }
    }
    ${UserOrContactReference.fragments.UserOrPetitionAccess}
    ${PetitionFieldCommentExcerpt.fragments.PetitionFieldComment}
  `,
  PetitionBase: gql`
    fragment PetitionComments_PetitionBase on PetitionBase {
      id
      fields {
        ...PetitionComments_PetitionField
      }
    }
  `,
};
