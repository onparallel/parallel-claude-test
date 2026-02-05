import { gql } from "@apollo/client";
import { Box, Heading, HStack, Image, Stack } from "@chakra-ui/react";
import { DocumentIcon, FileImageIcon, MessageSquareIcon } from "@parallel/chakra/icons";
import { Divider } from "@parallel/components/common/Divider";
import { NormalLink } from "@parallel/components/common/Link";
import { AdverseMediaArticleDetails_AdverseMediaArticleFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { Text } from "@parallel/components/ui";

export function AdverseMediaArticleDetails({
  article,
}: {
  article: AdverseMediaArticleDetails_AdverseMediaArticleFragment;
}) {
  const intl = useIntl();

  const timestamp = article?.timestamp
    ? intl.formatDate(new Date(article.timestamp * 1000), FORMATS["L+LT"])
    : undefined;
  const source = article?.source ?? "";
  const author = article?.author ?? "";
  const firstImage = article?.images?.[0];
  const otherImages = article?.images?.slice(1);

  return (
    <Stack
      divider={<Divider />}
      maxWidth="container.lg"
      minWidth={0}
      margin="0 auto"
      flex="1"
      width="100%"
      paddingY={4}
      spacing={8}
    >
      <Box>
        {timestamp || source ? (
          <Text>{[timestamp, source].filter(isNonNullish).join(" | ")}</Text>
        ) : null}
        <Text marginBottom={4}>{author}</Text>
        {article.url ? (
          <>
            <Text fontWeight="bold">
              <FormattedMessage id="page.adverse-media-search.link" defaultMessage="Link" />:
            </Text>
            <NormalLink wordBreak="break-word" isExternal href={article.url}>
              {article.url}
            </NormalLink>
          </>
        ) : null}
      </Box>

      {article.quotes && article.quotes.length > 0 && (
        <Box>
          <HStack marginBottom={4}>
            <MessageSquareIcon boxSize={5} />
            <Heading size="md">
              <FormattedMessage id="page.adverse-media-search.mentions" defaultMessage="Mentions" />
            </Heading>
          </HStack>
          <Stack spacing={4}>
            {article.quotes.map((quote, index) => (
              <Box key={index} padding={2} backgroundColor="yellow.100">
                <Text
                  dangerouslySetInnerHTML={{ __html: quote }}
                  sx={{
                    match: {
                      fontWeight: "bold",
                    },
                  }}
                />
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      <Stack spacing={4}>
        <HStack>
          <DocumentIcon boxSize={5} />
          <Heading size="md">
            <FormattedMessage id="page.adverse-media-search.article" defaultMessage="Article" />
          </Heading>
        </HStack>

        {article.summary ? <Heading size="lg">{article.summary}</Heading> : null}
        {article.images && article.images.length > 0 && (
          <Box maxWidth={{ base: "100%", md: "60%" }}>
            <Image src={firstImage} alt="" />
          </Box>
        )}

        {article.body ? (
          <Text
            dangerouslySetInnerHTML={{ __html: article.body }}
            sx={{
              h1: {
                fontSize: "2xl",
                fontWeight: "bold",
                paddingY: 3,
              },
              h2: {
                fontSize: "xl",
                fontWeight: "bold",
                paddingY: 3,
              },
              h3: {
                fontSize: "lg",
                fontWeight: "bold",
                paddingY: 3,
              },
              p: {
                paddingY: 2,
              },
              b: {
                fontWeight: "bold",
              },
              match: {
                backgroundColor: "yellow.100",
                paddingX: 1,
                fontWeight: 500,
              },
            }}
          />
        ) : (
          <Text textStyle="hint">
            <FormattedMessage
              id="component.adverse-media-article-details.no-article-body"
              defaultMessage="No article body available"
            />
          </Text>
        )}
      </Stack>
      {otherImages && otherImages.length > 0 ? (
        <Stack spacing={4}>
          <HStack>
            <FileImageIcon boxSize={5} />
            <Heading size="md">
              <FormattedMessage
                id="page.adverse-media-search.other-images"
                defaultMessage="Other images"
              />
            </Heading>
          </HStack>
          <HStack flexWrap="wrap" gap={2} spacing={0}>
            {otherImages.map((image, index) => (
              <Image
                key={index}
                src={image}
                alt=""
                width={{ base: "100%", lg: "30%", md: "45%" }}
              />
            ))}
          </HStack>
        </Stack>
      ) : null}
    </Stack>
  );
}

const _fragments = {
  AdverseMediaArticle: gql`
    fragment AdverseMediaArticleDetails_AdverseMediaArticle on AdverseMediaArticle {
      id
      url
      author
      body
      header
      source
      summary
      timestamp
      images
      quotes @include(if: $includeQuotes)
    }
  `,
};
