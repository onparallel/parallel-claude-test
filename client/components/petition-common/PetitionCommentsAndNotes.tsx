import {
  Box,
  Button,
  Flex,
  HStack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import { ChangeEvent, KeyboardEvent, ReactNode, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { setNativeValue } from "@parallel/utils/setNativeValue";
import { Divider } from "../common/Divider";
import { GrowingTextarea } from "../common/GrowingTextarea";

interface PetitionCommentsAndNotesProps {
  body: ReactNode;
  onCommentKeyDown: (
    event: KeyboardEvent<HTMLTextAreaElement>,
    content: string
  ) => Promise<boolean>;
  onCommentSubmit: (comment: string) => Promise<void>;
  onNotetKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>, content: string) => Promise<boolean>;
  onNoteSubmit: (note: string) => Promise<void>;
  hasCommentsEnabled: boolean;
  hasInternalComments: boolean;
  isDisabled: boolean;
  isTemplate: boolean;
}

export function PetitionCommentsAndNotes({
  body,
  onCommentKeyDown,
  onCommentSubmit,
  onNotetKeyDown,
  onNoteSubmit,
  hasCommentsEnabled,
  hasInternalComments,
  isDisabled,
  isTemplate,
}: PetitionCommentsAndNotesProps) {
  const intl = useIntl();
  const [isInternalComment, setInternalComment] = useState(!hasCommentsEnabled);
  const [commentDraft, setCommentDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");

  const textareaCommentRef = useRef<HTMLTextAreaElement>(null);
  const textareaNoteRef = useRef<HTMLTextAreaElement>(null);

  function handleCommentDraftChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setCommentDraft(event.target.value);
  }

  function handleCommentTabSelect() {
    setInternalComment(false);
  }

  function handleNoteDraftChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setNoteDraft(event.target.value);
  }

  function handleNoteTabSelect() {
    setInternalComment(true);
  }

  async function handleCommentKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (await onCommentKeyDown(event, commentDraft.trim())) {
      setNativeValue(textareaCommentRef.current!, "");
    }
  }

  async function handleNoteKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (await onNotetKeyDown(event, noteDraft.trim())) {
      setNativeValue(textareaNoteRef.current!, "");
    }
  }

  async function handleCommentSubmitClick() {
    try {
      await onCommentSubmit(commentDraft.trim());
    } catch {}
    setNativeValue(textareaCommentRef.current!, "");
  }

  async function handleNoteSubmitClick() {
    try {
      await onNoteSubmit(noteDraft.trim());
    } catch {}
    setNativeValue(textareaNoteRef.current!, "");
  }

  return (
    <>
      <Flex flexDirection="column-reverse">{body}</Flex>
      <Divider />
      <Box paddingTop={2} overflow="hidden" borderBottomRadius="md">
        <Tabs defaultIndex={hasCommentsEnabled ? 0 : 1} variant="enclosed">
          <TabList>
            <Tab
              borderTopLeftRadius={0}
              onFocus={handleCommentTabSelect}
              isDisabled={!hasCommentsEnabled}
              cursor={hasCommentsEnabled ? "pointer" : "not-allowed"}
              color={hasCommentsEnabled ? "inherit" : "gray.400"}
              fontWeight="semibold"
              borderLeft="none"
            >
              <FormattedMessage
                id="component.petition-comments-and-notes.comments"
                defaultMessage="Comments"
              />
            </Tab>
            <Tab
              onFocus={handleNoteTabSelect}
              _selected={{
                color: "blue.600",
                bg: "yellow.100",
                border: "1px solid",
                borderColor: "gray.200",
                borderBottomColor: "transparent",
              }}
              fontWeight="semibold"
            >
              <FormattedMessage
                id="component.petition-comments-and-notes.notes"
                defaultMessage="Notes"
              />
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel
              borderTop="1px solid"
              borderColor="gray.200"
              as={HStack}
              alignItems="flex-start"
              padding={2}
            >
              <GrowingTextarea
                ref={textareaCommentRef}
                size="sm"
                borderRadius="md"
                paddingX={2}
                minHeight={0}
                maxHeight={20}
                rows={1}
                placeholder={intl.formatMessage({
                  id: "component.petition-comments-and-notes.write-a-comment",
                  defaultMessage: "Write a comment",
                })}
                value={commentDraft}
                onKeyDown={handleCommentKeyDown as any}
                onChange={handleCommentDraftChange as any}
                isDisabled={isDisabled || !hasCommentsEnabled}
              />
              <Button
                height="37px"
                colorScheme="purple"
                isDisabled={commentDraft.trim().length === 0 || isTemplate}
                onClick={handleCommentSubmitClick}
              >
                <FormattedMessage id="generic.submit" defaultMessage="Submit" />
              </Button>
            </TabPanel>
            <TabPanel
              backgroundColor="yellow.100"
              borderTop="1px solid"
              borderColor="gray.200"
              as={HStack}
              alignItems="flex-start"
              padding={2}
            >
              {isInternalComment ? (
                <>
                  <GrowingTextarea
                    ref={textareaNoteRef}
                    size="sm"
                    borderRadius="md"
                    paddingX={2}
                    minHeight={0}
                    maxHeight={20}
                    rows={1}
                    placeholder={intl.formatMessage({
                      id: "component.petition-comments-and-notes.write-a-note",
                      defaultMessage: "Write a note. It will only be visible in your organization.",
                    })}
                    value={noteDraft}
                    onKeyDown={handleNoteKeyDown as any}
                    onChange={handleNoteDraftChange as any}
                    isDisabled={isDisabled || !hasInternalComments}
                    backgroundColor="white"
                  />
                  <Button
                    height="37px"
                    colorScheme="purple"
                    isDisabled={noteDraft.trim().length === 0 || isTemplate}
                    onClick={handleNoteSubmitClick}
                  >
                    <FormattedMessage id="generic.add" defaultMessage="Add" />
                  </Button>
                </>
              ) : null}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </>
  );
}
