import { Box, Center, Flex, HStack, Stack, Text } from "@chakra-ui/react";
import { BookOpenIcon, ShortSearchIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import {
  AdverseMediaArticleRelevance,
  AdverseMediaSearchTermInput,
  PetitionRepliesFieldReply_PetitionFieldReplyFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FieldLogicResult } from "@parallel/utils/fieldLogic/types";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { EditReplyIconButton } from "../EditReplyIconButton";

interface AdverseMediaSearchArticle {
  id: string;
  header: string;
  source: string;
  timestamp: number;
  classification: AdverseMediaArticleRelevance | null;
  classifiedAt: string | null;
}

export function PetitionRepliesFieldAdverseMediaSearch({
  reply,
  petitionFieldId,
  petitionId,
  fieldLogic,
}: {
  reply: PetitionRepliesFieldReply_PetitionFieldReplyFragment;
  petitionFieldId: string;
  petitionId: string;
  fieldLogic: FieldLogicResult;
}) {
  const intl = useIntl();

  const articlesSaved =
    reply?.content?.articles?.items.filter(
      (article: AdverseMediaSearchArticle) => article.classification === "RELEVANT",
    ) ?? [];

  const dismissedArticles =
    reply?.content?.articles?.items.filter(
      (article: AdverseMediaSearchArticle) => article.classification === "DISMISSED",
    ) ?? [];

  return (
    <Stack>
      <HStack>
        <Center
          boxSize={10}
          borderRadius="md"
          border="1px solid"
          borderColor="gray.300"
          color="gray.600"
          boxShadow="sm"
          fontSize="xl"
        >
          <ShortSearchIcon />
        </Center>
        <Box overflow="hidden" paddingBottom="2px">
          <Flex minWidth={0} alignItems="baseline">
            <Flex flexWrap="wrap" gap={2} alignItems="center">
              <Text as="span">
                {intl.formatList(
                  reply.content?.search
                    ?.map((search: AdverseMediaSearchTermInput) => search.label || search.term)
                    .filter(isNonNullish),
                  { type: "disjunction" },
                )}
              </Text>
              <Text as="span" color="gray.500" fontSize="sm">
                {`(${intl.formatMessage(
                  {
                    id: "generic.n-results",
                    defaultMessage:
                      "{count, plural,=0{No results} =1 {1 result} other {# results}}",
                  },
                  {
                    count: reply.content?.articles?.totalCount ?? 0,
                  },
                )}, ${intl.formatMessage(
                  {
                    id: "generic.n-dismissed",
                    defaultMessage: "{count} dismissed",
                  },
                  {
                    count: dismissedArticles.length,
                  },
                )})`}
              </Text>
            </Flex>
          </Flex>
        </Box>
        <EditReplyIconButton
          petitionFieldId={petitionFieldId}
          parentReplyId={reply.parent ? reply.parent.id : undefined}
          petitionId={petitionId}
          fieldLogic={fieldLogic}
        />
      </HStack>
      {articlesSaved.map((article: AdverseMediaSearchArticle) => {
        const timestamp = article.timestamp
          ? intl.formatDate(new Date(article.timestamp * 1000), FORMATS["L+LT"])
          : undefined;

        return (
          <HStack key={article.id} alignItems="center" backgroundColor="white">
            <Center
              boxSize={10}
              borderRadius="md"
              border="1px solid"
              borderColor="gray.300"
              color="gray.600"
              boxShadow="sm"
              fontSize="xl"
            >
              <BookOpenIcon />
            </Center>
            <Box flex="1" overflow="hidden" paddingBottom="2px">
              <Flex minWidth={0} alignItems="baseline">
                <Stack gap={0.5}>
                  <Text as="span" fontWeight="bold">
                    {article.header}
                  </Text>
                  <Text as="span" fontSize="xs">
                    {[timestamp, article.source].filter(isNonNullish).join(" | ")}
                    {article.classifiedAt ? (
                      <>
                        {" | "}
                        <FormattedMessage
                          id="generic.saved-on"
                          defaultMessage="Saved on {date}"
                          values={{
                            date: (
                              <DateTime
                                value={article.classifiedAt ?? new Date()}
                                format={FORMATS.LLL}
                              />
                            ),
                          }}
                        />
                      </>
                    ) : null}
                  </Text>
                </Stack>
              </Flex>
            </Box>
          </HStack>
        );
      })}
    </Stack>
  );
}
