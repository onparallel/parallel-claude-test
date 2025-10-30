import { gql } from "@apollo/client";
import { Box, Button, Flex, HStack, List, ListItem, Stack, Text } from "@chakra-ui/react";
import { BusinessIcon, SearchIcon, ShortSearchIcon, UserIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  AdverseMediaArticle,
  AdverseMediaSearchTermInput,
  PetitionFieldRepliesContent_PetitionFieldFragment,
  PetitionFieldRepliesContent_PetitionFieldReplyFragment,
  PetitionFieldType,
} from "@parallel/graphql/__types";
import { FORMATS, prettifyTimezone } from "@parallel/utils/dates";
import { FieldOptions } from "@parallel/utils/fieldOptions";
import { formatNumberWithPrefix } from "@parallel/utils/formatNumberWithPrefix";
import { getEntityTypeLabel } from "@parallel/utils/getEntityTypeLabel";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { never } from "@parallel/utils/never";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { withError } from "@parallel/utils/promises/withError";
import { useDownloadReplyFile } from "@parallel/utils/useDownloadReplyFile";
import { useHasRemovePreviewFiles } from "@parallel/utils/useHasRemovePreviewFiles";
import { useIsGlobalKeyDown } from "@parallel/utils/useIsGlobalKeyDown";
import { FormattedDate, FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, pick } from "remeda";
import { BackgroundCheckRiskLabel } from "../petition-common/BackgroundCheckRiskLabel";
import { Divider } from "./Divider";
import { OverflownText } from "./OverflownText";
import { SimpleFileButton } from "./SimpleFileButton";
import { UserReference } from "./UserReference";

export interface PetitionFieldRepliesContentProps {
  petitionId: string;
  field: PetitionFieldRepliesContent_PetitionFieldFragment;
  replies: PetitionFieldRepliesContent_PetitionFieldReplyFragment[];
  sample?: number;
}

export const PetitionFieldRepliesContent = Object.assign(
  chakraForwardRef<"p" | "span" | "ul" | "div", PetitionFieldRepliesContentProps>(
    function PetitionFieldRepliesContent(props, ref) {
      if (isFileTypeField(props.field.type)) {
        return <PetitionFieldRepliesContentFile ref={ref} {...(props as any)} />;
      } else {
        return <PetitionFieldRepliesContentNonFile ref={ref} {...(props as any)} />;
      }
    },
  ),
  {
    fragments: {
      PetitionField: gql`
        fragment PetitionFieldRepliesContent_PetitionField on PetitionField {
          id
          type
          options
        }
      `,
      PetitionFieldReply: gql`
        fragment PetitionFieldRepliesContent_PetitionFieldReply on PetitionFieldReply {
          id
          content
          parent {
            id
          }
        }
      `,
    },
  },
);

const PetitionFieldRepliesContentFile = chakraForwardRef<"ul", PetitionFieldRepliesContentProps>(
  function PetitionFieldRepliesContentFile({ petitionId, field, replies, sample, ...props }, ref) {
    const downloadReplyFile = useDownloadReplyFile();
    const isShiftDown = useIsGlobalKeyDown("Shift");
    const userHasRemovePreviewFiles = useHasRemovePreviewFiles();
    const buttons = replies.map((reply) => (
      <SimpleFileButton
        key={undefined}
        {...pick(reply.content!, ["filename", "contentType"])}
        onClick={() =>
          withError(
            downloadReplyFile(petitionId, reply, userHasRemovePreviewFiles ? false : !isShiftDown),
          )
        }
      />
    ));
    return buttons.length === 0 ? (
      <Box ref={ref} textStyle="hint" {...props}>
        <FormattedMessage
          id="component.petition-field-replies-content.no-value"
          defaultMessage="No value"
        />
      </Box>
    ) : buttons.length === 1 ? (
      <Flex ref={ref} {...(props as any)}>
        {buttons[0]}
      </Flex>
    ) : (
      <List ref={ref} display="flex" flexWrap="wrap" gap={1} {...(props as any)}>
        {buttons.slice(0, sample).map((button, i) => (
          <ListItem key={i} minWidth={0} display="flex">
            {button}
          </ListItem>
        ))}
        {isNonNullish(sample) && buttons.length > sample ? (
          <ListItem textStyle="hint">
            <FormattedMessage
              id="component.map-fields-table.and-n-more"
              defaultMessage="and {count} more"
              values={{ count: buttons.length - sample }}
            />
          </ListItem>
        ) : null}
      </List>
    );
  },
);

const PetitionFieldRepliesContentNonFile = chakraForwardRef<
  "p" | "span" | "button",
  PetitionFieldRepliesContentProps
>(function PetitionFieldRepliesContentNonFile(
  { petitionId, field, replies, sample, ...props },
  ref,
) {
  const intl = useIntl();
  if (replies.length === 0) {
    return (
      <Box ref={ref} as="span" textStyle="hint" {...props}>
        <FormattedMessage
          id="component.petition-field-replies-content.no-reply"
          defaultMessage="No reply"
        />
      </Box>
    );
  } else if (field.type === "FIELD_GROUP") {
    return null;
  } else {
    const elements = replies.map((reply) => {
      if (
        (
          ["SHORT_TEXT", "NUMBER", "DATE", "DATE_TIME", "SELECT", "PHONE"] as PetitionFieldType[]
        ).includes(field.type)
      ) {
        return (
          <Box key={undefined} as="span">
            {field.type === "SHORT_TEXT" ? (
              <>{reply.content.value}</>
            ) : field.type === "NUMBER" ? (
              <>
                {formatNumberWithPrefix(
                  intl,
                  reply.content.value,
                  field.options as FieldOptions["NUMBER"],
                )}
              </>
            ) : field.type === "DATE" ? (
              <FormattedDate value={reply.content.value} {...FORMATS.L} timeZone="UTC" />
            ) : field.type === "DATE_TIME" ? (
              <>
                <FormattedDate
                  value={reply.content.value}
                  {...FORMATS["L+LT"]}
                  timeZone={reply.content.timezone}
                />
                {" ("}
                {prettifyTimezone(reply.content.timezone)}
                {")"}
              </>
            ) : field.type === "SELECT" ? (
              <>{getValueLabel(reply.content.value, field.options as FieldOptions["SELECT"])}</>
            ) : field.type === "PHONE" ? (
              <>{reply.content.value}</>
            ) : null}
          </Box>
        );
      } else if (field.type === "TEXT") {
        return <Text key={undefined}>{reply.content.value}</Text>;
      } else if (field.type === "CHECKBOX") {
        return (
          <List key={undefined}>
            {reply.content.value.map((v: string) => (
              <ListItem key={v}>
                {getValueLabel(v, field.options as FieldOptions["CHECKBOX"])}
              </ListItem>
            ))}
          </List>
        );
      } else if (field.type === "BACKGROUND_CHECK") {
        return (
          <PetitionFieldBackgroundCheck
            key={undefined}
            petitionId={petitionId}
            field={field}
            reply={reply}
          />
        );
      } else if (field.type === "ADVERSE_MEDIA_SEARCH") {
        return (
          <PetitionFieldAdverseMediaSearch
            key={undefined}
            petitionId={petitionId}
            field={field}
            reply={reply}
          />
        );
      } else if (field.type === "USER_ASSIGNMENT") {
        return (
          <Box key={undefined}>
            <UserReference
              useYou={false}
              user={
                isNonNullish(reply.content.user)
                  ? {
                      id: reply.content.user.id,
                      fullName: reply.content.user.fullName,
                      status: reply.content.user.status,
                      isMe: false,
                    }
                  : null
              }
            />
          </Box>
        );
      } else {
        never(`PetitionFieldType ${field.type} not implemented`);
      }
    });
    return elements.length === 1 ? (
      <Flex ref={ref} {...(props as any)}>
        {elements[0]}
      </Flex>
    ) : (
      <Stack as={List} ref={ref} divider={<Divider />} {...(props as any)}>
        {elements.slice(0, sample).map((element, i) => (
          <ListItem key={i} display="flex" minWidth={0}>
            {element}
          </ListItem>
        ))}
        {isNonNullish(sample) && elements.length > sample ? (
          <ListItem textStyle="hint">
            <FormattedMessage
              id="component.map-fields-table.and-n-more"
              defaultMessage="and {count} more"
              values={{ count: elements.length - sample }}
            />
          </ListItem>
        ) : null}
      </Stack>
    );
  }
});

function getValueLabel(value: string, options: FieldOptions["CHECKBOX"] | FieldOptions["SELECT"]) {
  if (isNonNullish(options.labels)) {
    const index = options.values.indexOf(value);
    return index >= 0 ? options.labels[index] : value;
  } else {
    return value;
  }
}

interface PetitionFieldBackgroundCheckProps {
  petitionId: string;
  field: PetitionFieldRepliesContent_PetitionFieldFragment;
  reply: PetitionFieldRepliesContent_PetitionFieldReplyFragment;
}

function PetitionFieldBackgroundCheck({
  petitionId,
  field,
  reply,
}: PetitionFieldBackgroundCheckProps) {
  const intl = useIntl();
  const content = reply.content;
  const parentReplyId = reply.parent?.id;
  const handleClick = async () => {
    try {
      const { entity, query } = content;
      const { name, date, type, country, birthCountry } = query ?? {};
      const url = `/${intl.locale}/app/background-check/${isNonNullish(entity) ? entity.id : "results"}?${new URLSearchParams(
        {
          token: btoa(
            JSON.stringify({
              fieldId: field.id,
              petitionId,
              ...(parentReplyId ? { parentReplyId } : {}),
            }),
          ),
          ...(name ? { name } : {}),
          ...(date ? { date } : {}),
          ...(type ? { type } : {}),
          ...(country ? { country } : {}),
          ...(birthCountry ? { birthCountry } : {}),
          readonly: "true",
        },
      )}`;
      await openNewWindow(url);
    } catch {}
  };
  return (
    <Button
      key={undefined}
      variant="outline"
      size="sm"
      backgroundColor="white"
      alignItems="center"
      height="auto"
      paddingX={2}
      paddingY={1}
      onClick={handleClick}
      fontWeight={500}
    >
      {isNonNullish(content.entity) ? (
        <HStack display="inline-flex" minWidth={0}>
          {content.entity.type === "Person" ? (
            <UserIcon boxSize={4} />
          ) : (
            <BusinessIcon boxSize={4} />
          )}
          <OverflownText minWidth="40px">{content.entity.name}</OverflownText>
          {(content.entity?.properties?.topics as string[] | undefined)?.map((topic, i) => (
            <BackgroundCheckRiskLabel key={i} risk={topic} />
          ))}
        </HStack>
      ) : (
        <HStack display="inline-flex" minWidth={0}>
          <SearchIcon />
          <HStack
            display="inline-flex"
            divider={<Divider isVertical height={3.5} color="gray.500" />}
          >
            <Box>{getEntityTypeLabel(intl, content.query.type)}</Box>
            <OverflownText minWidth="40px">{content.query.name}</OverflownText>
          </HStack>
        </HStack>
      )}
    </Button>
  );
}

interface PetitionFieldAdverseMediaSearchProps {
  petitionId: string;
  field: PetitionFieldRepliesContent_PetitionFieldFragment;
  reply: PetitionFieldRepliesContent_PetitionFieldReplyFragment;
}

function PetitionFieldAdverseMediaSearch({
  petitionId,
  field,
  reply,
}: PetitionFieldAdverseMediaSearchProps) {
  const intl = useIntl();
  const savedArticles = reply.content?.articles?.items.filter(
    (article: AdverseMediaArticle) => article.classification === "RELEVANT",
  );

  const dismissedArticles = reply.content?.articles?.items.filter(
    (article: AdverseMediaArticle) =>
      article.classification === "DISMISSED" || article.classification === "IRRELEVANT",
  );

  const parentReplyId = reply.parent?.id;
  const handleClick = async () => {
    try {
      const url = `/${intl.locale}/app/adverse-media?${new URLSearchParams({
        token: btoa(
          JSON.stringify({
            fieldId: field.id,
            petitionId,
            ...(parentReplyId ? { parentReplyId } : {}),
          }),
        ),
        readonly: "true",
      })}`;
      await openNewWindow(url);
    } catch {}
  };

  return (
    <Button
      key={undefined}
      variant="outline"
      size="sm"
      backgroundColor="white"
      height="auto"
      paddingX={2}
      paddingY={1}
      onClick={handleClick}
      fontWeight={500}
    >
      <Stack spacing={1} maxWidth="100%" width="100%">
        <HStack spacing={1.5} minWidth={0} width="100%">
          <ShortSearchIcon />
          <OverflownText textAlign="start" width="100%">
            {intl.formatList(
              reply.content?.search
                ?.map((search: AdverseMediaSearchTermInput) => search.label || search.term)
                .filter(isNonNullish),
              { type: "disjunction" },
            )}
          </OverflownText>
        </HStack>
        {savedArticles?.length > 0 ? (
          <Text fontSize="sm">
            <FormattedMessage
              id="generic.saved-articles"
              defaultMessage="{count, plural, =1 {# saved article} other {# saved articles}}"
              values={{ count: savedArticles.length }}
            />
          </Text>
        ) : null}
        {dismissedArticles?.length > 0 ? (
          <Text fontSize="sm">
            <FormattedMessage
              id="generic.dismissed-articles"
              defaultMessage="{count, plural, =1 {# dismissed article} other {# dismissed articles}}"
              values={{ count: dismissedArticles.length }}
            />
          </Text>
        ) : null}
        {isNonNullish(reply.content?.articles?.createdAt) ? (
          <Text fontSize="sm">
            <FormattedMessage
              id="generic.results-for"
              defaultMessage="Results for {date}"
              values={{
                date: intl.formatDate(
                  new Date(reply.content?.articles?.createdAt),
                  FORMATS["L+LT"],
                ),
              }}
            />
          </Text>
        ) : null}
      </Stack>
    </Button>
  );
}
