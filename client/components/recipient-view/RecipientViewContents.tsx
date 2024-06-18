import { gql } from "@apollo/client";
import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Heading,
  List,
  ListItem,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ChevronFilledIcon, ListIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  RecipientViewContents_PetitionBaseFragment,
  RecipientViewContents_PublicPetitionFragment,
} from "@parallel/graphql/__types";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { FieldLogicResult, useFieldLogic } from "@parallel/utils/fieldLogic/useFieldLogic";
import { focusPetitionField } from "@parallel/utils/focusPetitionField";
import { ArrayUnionToUnion, Maybe } from "@parallel/utils/types";
import { useHighlightElement } from "@parallel/utils/useHighlightElement";
import { useRouter } from "next/router";
import { FormattedMessage } from "react-intl";
import { zip } from "remeda";
import { CloseButton } from "../common/CloseButton";
import { InternalFieldBadge } from "../common/InternalFieldBadge";
import { NakedLink } from "../common/Link";

type PetitionSelection =
  | RecipientViewContents_PublicPetitionFragment
  | RecipientViewContents_PetitionBaseFragment;

type PetitionFieldSelection = ArrayUnionToUnion<PetitionSelection["fields"]>;

interface RecipientViewContentsProps {
  currentPage: number;
  petition: PetitionSelection;
  onClose: () => void;
  usePreviewReplies?: boolean;
  isPreview?: boolean;
  closeOnNavigate?: boolean;
}

export const RecipientViewContents = Object.assign(
  chakraForwardRef<"section", RecipientViewContentsProps>(function RecipientViewContents(
    { currentPage, petition, usePreviewReplies, isPreview, closeOnNavigate, onClose, ...props },
    ref,
  ) {
    const router = useRouter();
    const { query } = router;
    const { pages, fields, fieldLogic } = useGetPagesAndFields(
      petition,
      currentPage,
      usePreviewReplies,
    );

    const filteredFields = zip(fields as PetitionFieldSelection[], fieldLogic)
      .filter(([field, fieldLogic]) =>
        (field.__typename === "PublicPetitionField" && field.isInternal) ||
        (field.type === "HEADING" && !field.title)
          ? false
          : true,
      )
      // skip first one as long it has a title otherwise skip nothing as it's been filtered our before
      .slice(fields[0].title ? 1 : 0);

    const showCommentsCount = (field: PetitionFieldSelection) => {
      return (
        field.unreadCommentCount > 0 &&
        (field.__typename === "PetitionField" || field.hasCommentsEnabled)
      );
    };

    const highlight = useHighlightElement();
    const handleClick = (field: PetitionFieldSelection) => {
      focusPetitionField({ field });
      if (closeOnNavigate) {
        onClose();
      }
      const element = document.getElementById(`field-${field.id}`);
      highlight(element, true);
    };

    return (
      <Flex ref={ref} flexDirection="column" minWidth={0} height="100%" width="100%" {...props}>
        {isPreview ? null : (
          <HStack
            paddingX={4}
            paddingY={3}
            borderBottom="1px solid"
            borderBottomColor="gray.200"
            justify="space-between"
            height="56px"
          >
            <Heading as="h3" size="sm" display="flex" alignItems="center">
              <ListIcon boxSize={6} marginEnd={2.5} />
              <FormattedMessage id="recipient-view.contents-header" defaultMessage="Contents" />
            </Heading>
            <CloseButton size="sm" onClick={onClose} />
          </HStack>
        )}

        <Stack
          as={List}
          spacing={1}
          paddingY={2.5}
          paddingX={3}
          overflow="auto"
          height="100%"
          paddingBottom={isPreview ? "64px" : undefined}
        >
          {pages.map(
            ({ title, unreadCommentCount, isInternal, currentFieldUnreadCommentCount }, index) => {
              const url = query.petitionId
                ? `/app/petitions/${query.petitionId}/preview?page=${index + 1}`
                : `/petition/${query.keycode}/${index + 1}`;

              const showPageCommentsCount = index + 1 !== currentPage;

              const showCommentsNumber = showPageCommentsCount
                ? unreadCommentCount > 0
                : currentFieldUnreadCommentCount > 0;
              const _commentCount = showPageCommentsCount
                ? unreadCommentCount
                : currentFieldUnreadCommentCount;

              return (
                <ListItem key={index}>
                  <Text as="h2">
                    <NakedLink href={url}>
                      <Button
                        variant="ghost"
                        as="a"
                        size="sm"
                        fontSize="md"
                        display="flex"
                        width="100%"
                        paddingStart={7}
                        _focus={{ outline: "none" }}
                        aria-current={index + 1 !== currentPage ? "page" : undefined}
                      >
                        <ChevronFilledIcon
                          color="gray.500"
                          position="absolute"
                          insetStart={2}
                          top={2.5}
                          fontSize="sm"
                          transform={index + 1 === currentPage ? "rotate(90deg)" : undefined}
                        />
                        <Box
                          flex="1"
                          overflow="hidden"
                          textOverflow="ellipsis"
                          whiteSpace="nowrap"
                          {...(title ? {} : { textStyle: "hint", fontWeight: "normal" })}
                        >
                          {title || (
                            <FormattedMessage
                              id="generic.empty-heading"
                              defaultMessage="Untitled heading"
                            />
                          )}
                        </Box>

                        {showCommentsNumber ? (
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
                            {_commentCount < 100 ? _commentCount : "99+"}
                          </Badge>
                        ) : null}
                        {isInternal ? (
                          <Center>
                            <InternalFieldBadge marginStart={2} />
                          </Center>
                        ) : null}
                      </Button>
                    </NakedLink>
                  </Text>
                  {index + 1 === currentPage ? (
                    <Stack as={List} spacing={1}>
                      {filteredFields.map(([field, fieldLogic]) => {
                        const replies =
                          usePreviewReplies && field.__typename === "PetitionField"
                            ? field.previewReplies
                            : field.replies;
                        return (
                          <ListItem key={field.id} position="relative">
                            <Text
                              as={field.type === "HEADING" ? "h3" : "div"}
                              display="flex"
                              position="relative"
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                fontSize="md"
                                display="flex"
                                width="100%"
                                textAlign="left"
                                paddingStart={7}
                                fontWeight={field.type === "HEADING" ? "bold" : "normal"}
                                _focus={{ outline: "none" }}
                                onClick={() => {
                                  handleClick(field);
                                }}
                              >
                                <Box
                                  flex="1"
                                  overflow="hidden"
                                  textOverflow="ellipsis"
                                  whiteSpace="nowrap"
                                  {...(field.title
                                    ? {
                                        color: replies.some((r) => r.status === "REJECTED")
                                          ? "red.600"
                                          : completedFieldReplies(
                                                field,
                                                usePreviewReplies,
                                                fieldLogic,
                                              ).length !== 0
                                            ? "gray.400"
                                            : "inherit",
                                      }
                                    : {
                                        color: replies.some((r) => r.status === "REJECTED")
                                          ? "red.600"
                                          : "gray.500",
                                        fontWeight: "normal",
                                        fontStyle: "italic",
                                      })}
                                >
                                  {field.title || (
                                    <FormattedMessage
                                      id="generic.untitled-field"
                                      defaultMessage="Untitled field"
                                    />
                                  )}
                                </Box>
                                {showCommentsCount(field) ? (
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
                                    {field.unreadCommentCount < 100
                                      ? field.unreadCommentCount
                                      : "99+"}
                                  </Badge>
                                ) : null}
                                {field.isInternal ? <InternalFieldBadge marginStart={2} /> : null}
                              </Button>
                            </Text>
                          </ListItem>
                        );
                      })}
                    </Stack>
                  ) : null}
                </ListItem>
              );
            },
          )}
        </Stack>
      </Flex>
    );
  }),
  {
    fragments: {
      get PublicUser() {
        return gql`
          fragment RecipientViewContents_PublicUser on PublicUser {
            firstName
          }
        `;
      },
      get PublicPetition() {
        return gql`
          fragment RecipientViewContents_PublicPetition on PublicPetition {
            fields {
              id
              type
              title
              options
              optional
              isInternal
              isReadOnly
              replies {
                id
                status
                parent {
                  id
                }
              }

              unreadCommentCount
              hasCommentsEnabled
              ...completedFieldReplies_PublicPetitionField
              ...focusPetitionField_PublicPetitionField
            }
            ...useFieldLogic_PublicPetition
          }

          ${useFieldLogic.fragments.PublicPetition}
          ${completedFieldReplies.fragments.PublicPetitionField}
          ${focusPetitionField.fragments.PublicPetitionField}
        `;
      },
      get PetitionBase() {
        return gql`
          fragment RecipientViewContents_PetitionBase on PetitionBase {
            fields {
              id
              type
              title
              options
              optional
              isInternal
              isReadOnly
              previewReplies @client {
                id
                status
                parent {
                  id
                }
              }
              replies {
                id
                status
                parent {
                  id
                }
              }
              unreadCommentCount
              hasCommentsEnabled
              ...completedFieldReplies_PetitionField
              ...focusPetitionField_PetitionField
            }
            ...useFieldLogic_PetitionBase
          }

          ${useFieldLogic.fragments.PetitionBase}
          ${completedFieldReplies.fragments.PetitionField}
          ${focusPetitionField.fragments.PetitionField}
        `;
      },
    },
  },
);

function useGetPagesAndFields<T extends PetitionSelection>(
  petition: T,
  page: number,
  usePreviewReplies?: boolean,
) {
  const pages: {
    title: Maybe<string>;
    unreadCommentCount: number;
    isInternal: boolean;
    currentFieldUnreadCommentCount: number;
  }[] = [];
  const logic = useFieldLogic(petition, usePreviewReplies);
  const _fields: T["fields"] = [] as any;
  const _fieldLogic: FieldLogicResult[] = [];
  for (const [field, fieldLogic] of zip(petition.fields as PetitionFieldSelection[], logic)) {
    const isHiddenToPublic = field.__typename === "PublicPetitionField" && field.isInternal;

    if (
      field.type === "HEADING" &&
      (pages.length === 0 || (field.options.hasPageBreak && !isHiddenToPublic))
    ) {
      pages.push({
        title: field.title ?? null,
        unreadCommentCount: 0,
        isInternal: field.isInternal,
        currentFieldUnreadCommentCount: field.unreadCommentCount,
      });
      page -= 1;
    }
    const currentPage = pages[pages.length - 1];
    if (currentPage) {
      currentPage.unreadCommentCount += field.unreadCommentCount;
    }

    if (page === 0 && fieldLogic.isVisible) {
      _fields.push(field as any);
      _fieldLogic.push(fieldLogic);
    } else {
      continue;
    }
  }
  return { fields: _fields, fieldLogic: _fieldLogic, pages };
}
