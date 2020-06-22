import {
  Badge,
  Box,
  Button,
  Collapse,
  Select,
  Stack,
  Text,
} from "@chakra-ui/core";
import { Card, CardHeader } from "@parallel/components/common/Card";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useFocus } from "@parallel/utils/useFocus";
import {
  ChangeEvent,
  Fragment,
  KeyboardEvent,
  useState,
  useRef,
  useEffect,
} from "react";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { DateTime } from "../common/DateTime";
import { Divider } from "../common/Divider";
import { fileSize } from "../common/FileSize";
import { GrowingTextarea } from "../common/GrowingTextarea";
import { SmallPopover } from "../common/SmallPopover";
import scrollIntoView from "smooth-scroll-into-view-if-needed";
import { setNativeValue } from "@parallel/utils/setNativeValue";

export type PetitionRepliesFieldCommentsProps = {
  field: any;
  comments: [];
  onAddComment: (value: string) => void;
  onClose: () => void;
};

export function PetitionRepliesFieldComments({
  field,
  comments,
  onAddComment,
  onClose,
}: PetitionRepliesFieldCommentsProps) {
  const intl = useIntl();

  const [draft, setDraft] = useState("");
  const [referenceReply, setReferenceReply] = useState<string | null>(null);
  const [selectFocused, selectFocusBind] = useFocus({ onBlurDelay: 300 });
  const [inputFocused, inputFocusBind] = useFocus({ onBlurDelay: 300 });

  const commentsRef = useRef<HTMLElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    commentsRef.current!.scrollTo({ top: 99999, behavior: "smooth" });
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onAddComment(draft);
      clearInput(textareaRef.current!);
    }
  }

  function handleDraftChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setDraft(event.target.value);
  }

  function handleReferenceReplyChange(event: ChangeEvent<HTMLSelectElement>) {
    setReferenceReply(event.target.value || null);
  }

  function handleSubmitClick() {
    onAddComment(draft);
    setReferenceReply(null);
    clearInput(textareaRef.current!);
  }

  function handleCancelClick() {
    clearInput(textareaRef.current!);
  }

  const isExpanded = Boolean(
    inputFocused || selectFocused || referenceReply || draft
  );

  return (
    <Card>
      <CardHeader isCloseable onClose={onClose}>
        {field.title || (
          <Text color="gray.400" fontWeight="normal" fontStyle="italic">
            <FormattedMessage
              id="generic.untitled-field"
              defaultMessage="Untitled field"
            />
          </Text>
        )}
      </CardHeader>
      <Box
        maxHeight={{
          base: `calc(100vh - 410px)`,
          sm: `calc(100vh - 346px)`,
          md: `calc(100vh - 346px)`,
        }}
        overflow="auto"
        ref={commentsRef}
      >
        {[4, 5, 6].map((i, index, comments) => (
          <Fragment key={i}>
            <FieldComment
              comment={{
                author: {
                  fullName: "Santi Albo",
                },
                content: "lol que dise tron, esto esta mal",
                isRead: i === 5 ? false : true,
                publishedAt:
                  i === 6 ? null : new Date("2020-06-18 17:30").toISOString(),
              }}
            />
            {index === comments.length - 1 ? null : <Divider />}
          </Fragment>
        ))}
      </Box>
      <Divider />
      <Box padding={2}>
        <Collapse isOpen={isExpanded} paddingBottom={2}>
          <Select
            size="sm"
            rounded="md"
            paddingX={1}
            height="38px"
            value={referenceReply ?? ""}
            onChange={handleReferenceReplyChange}
            {...selectFocusBind}
          >
            <option value="">
              {intl.formatMessage({
                id: "petition-replies.select-reference-reply.label",
                defaultMessage: "Select a reference reply",
              })}
            </option>
            {field.replies.map((reply: any) => (
              <option key={reply.id} value={reply.id}>
                {replyToText(intl, field.type, reply)}
              </option>
            ))}
          </Select>
        </Collapse>
        <GrowingTextarea
          ref={textareaRef}
          height="20px"
          size="sm"
          rounded="md"
          paddingX={2}
          minHeight={0}
          {...{ rows: 1 }}
          placeholder={intl.formatMessage({
            id: "petition-replies.field-comments.placeholder",
            defaultMessage: "Type a new comment",
          })}
          value={draft}
          onKeyDown={handleKeyDown as any}
          onChange={handleDraftChange as any}
          {...inputFocusBind}
        />
        <Collapse isOpen={isExpanded} paddingTop={2}>
          <Stack direction="row" justifyContent="flex-end">
            <Button size="sm" onClick={handleCancelClick}>
              Cancel
            </Button>
            <Button
              size="sm"
              variantColor="purple"
              isDisabled={draft.length === 0}
              onClick={handleSubmitClick}
            >
              Submit
            </Button>
          </Stack>
        </Collapse>
      </Box>
    </Card>
  );
}

PetitionRepliesFieldComments.fragments = {
  PetitionField: null,
};

function replyToText(intl: IntlShape, type: PetitionFieldType, reply: any) {
  switch (type) {
    case "TEXT": {
      const text = reply.content.text as string;
      return text.slice(0, 50) + (text.length > length ? "..." : "");
    }
    case "FILE_UPLOAD":
      const filename = reply.content.filename as string;
      const size = reply.content.size as number;
      return `${filename} - ${fileSize(intl, size)}`;
  }
}

function clearInput(element: HTMLInputElement | HTMLTextAreaElement) {
  setNativeValue(element, "");
}

function FieldComment({
  comment: { content, publishedAt, isRead, author },
}: {
  comment: {
    content: string;
    publishedAt: null | string;
    isRead: boolean;
    author: { fullName: string };
  };
}) {
  return (
    <Box
      paddingX={4}
      paddingY={2}
      backgroundColor={
        publishedAt ? (isRead ? "white" : "purple.50") : "yellow.50"
      }
    >
      <Box fontSize="sm" display="flex" alignItems="center">
        <Box as="strong" marginRight={2}>
          {author.fullName}
        </Box>
        {publishedAt ? (
          <DateTime
            color="gray.500"
            value={publishedAt}
            format={FORMATS.LLL}
            useRelativeTime
          />
        ) : (
          <SmallPopover
            content={
              <Text fontSize="sm">
                <FormattedMessage
                  id="petition-replies.pending-comment-popover"
                  defaultMessage="Send all your pending comments at once to notify in a single email"
                />
              </Text>
            }
          >
            <Badge variantColor="yellow" variant="outline" cursor="default">
              <FormattedMessage
                id="petition-replies.comment-pending.label"
                defaultMessage="Pending"
              />
            </Badge>
          </SmallPopover>
        )}
      </Box>
      <Box fontSize="sm">
        {content.split("\n").map((line, index) => (
          <Fragment key={index}>
            {line}
            <br />
          </Fragment>
        ))}
      </Box>
    </Box>
  );
}
