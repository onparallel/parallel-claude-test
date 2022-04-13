import { Button, HStack, List, Progress, Stack, Text } from "@chakra-ui/react";
import { ExclamationOutlineIcon } from "@parallel/chakra/icons";
import { AnimatePresence, motion } from "framer-motion";
import { FormattedMessage } from "react-intl";
import {
  RecipientViewPetitionFieldCard,
  RecipientViewPetitionFieldCardProps,
} from "./RecipientViewPetitionFieldCard";
import { RecipientViewPetitionFieldReplyFileUpload } from "./RecipientViewPetitionFieldFileUpload";

export interface RecipientViewPetitionFieldTaxDocumentsProps
  extends Omit<
    RecipientViewPetitionFieldCardProps,
    "children" | "showAddNewReply" | "onAddNewReply"
  > {
  isDisabled: boolean;
  onDeleteReply: (replyId: string) => void;
  onCreateReply: (content: File[]) => void;
  onDownloadReply: (replyId: string) => void;
  isCacheOnly?: boolean;
}

export function RecipientViewPetitionFieldTaxDocuments({
  field,
  isDisabled,
  isInvalid,
  onDownloadAttachment,
  onDeleteReply,
  onCreateReply,
  onDownloadReply,
  onCommentsButtonClick,
  isCacheOnly,
}: RecipientViewPetitionFieldTaxDocumentsProps) {
  const replies = JSON.parse(
    `[{"__typename":"PetitionFieldReply","id":"6vyn9tAvuTWyY2CxMHHmmEh5cqqfwaC2","status":"APPROVED","content":{"filename":"import_model_es (1).xlsx","size":"9322","contentType":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","extension":"xlsx","uploadComplete":true},"createdAt":"2022-04-12T15:16:00.134Z","updatedAt":"2022-04-12T15:16:07.275Z"},{"__typename":"PetitionFieldReply","id":"6vyn9tAvuTWyY2CxMHHmmEh5cqqfwaC3","status":"REJECTED","content":{"filename":"Frame.svg","size":"637","contentType":"image/svg+xml","extension":"svg","uploadComplete":true},"createdAt":"2022-04-12T15:16:13.255Z","updatedAt":"2022-04-12T15:16:18.378Z"}]`
  );
  return (
    <RecipientViewPetitionFieldCard
      field={field}
      isInvalid={isInvalid}
      onCommentsButtonClick={onCommentsButtonClick}
      onDownloadAttachment={onDownloadAttachment}
    >
      <Stack>
        {replies.length ? (
          <List as={Stack} paddingTop={1} paddingBottom={3}>
            <AnimatePresence initial={false}>
              {replies.map((reply) => (
                <motion.li
                  key={reply.id}
                  layout
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0, transition: { ease: "easeOut" } }}
                  exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                >
                  <RecipientViewPetitionFieldReplyFileUpload
                    reply={reply}
                    isDisabled={isDisabled}
                    onDownload={onDownloadReply}
                    isDownloadDisabled={isCacheOnly}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </List>
        ) : null}
        <Button variant="outline" width="min-content">
          {replies.length ? (
            <FormattedMessage
              id="component.recipient-view-petition-field-tax-documents.start-again-button"
              defaultMessage="Start again"
            />
          ) : (
            <FormattedMessage
              id="component.recipient-view-petition-field-tax-documents.start-button"
              defaultMessage="Start"
            />
          )}
        </Button>
      </Stack>
      <HStack alignItems="center" marginTop={2} color="red.600">
        <ExclamationOutlineIcon boxSize={4} />
        <Text fontSize="sm">
          <FormattedMessage
            id="component.recipient-view-petition-field-tax-documents.error-uploading"
            defaultMessage="We have not found any files. Please try again."
          />
        </Text>
      </HStack>
      <Stack marginTop={4}>
        <Text fontSize="sm">
          <FormattedMessage
            id="component.recipient-view-petition-field-tax-documents.loading-documentation"
            defaultMessage="Please, wait while we upload the documentation..."
          />
        </Text>
        <Progress size="md" isIndeterminate colorScheme="green" borderRadius="full" />
      </Stack>
    </RecipientViewPetitionFieldCard>
  );
}
