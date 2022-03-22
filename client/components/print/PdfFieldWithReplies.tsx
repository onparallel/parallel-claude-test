import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import { PetitionPdf_PetitionFieldFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { formatNumberWithPrefix } from "@parallel/utils/formatNumberWithPrefix";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { FormattedMessage, useIntl } from "react-intl";
import { BreakLines } from "../common/BreakLines";
import { FieldDescription } from "../common/FieldDescription";
import { FileSize } from "../common/FileSize";

export function PdfFieldWithReplies({ field }: { field: PetitionPdf_PetitionFieldFragment }) {
  const intl = useIntl();
  return field.type === "HEADING" ? (
    <Stack>
      {field.title ? (
        <Heading textAlign="justify" size="lg">
          {field.title}
        </Heading>
      ) : null}
      {field.description ? (
        <FieldDescription description={field.description} textAlign="justify" />
      ) : null}
    </Stack>
  ) : (
    <Box sx={{ pageBreakInside: "avoid" }}>
      <Stack
        borderRadius="md"
        border="1px solid"
        borderColor="gray.400"
        padding="5mm"
        position="relative"
      >
        <Text textAlign="justify" fontWeight="bold">
          {field.title ?? "-"}
        </Text>
        {field.description ? (
          <FieldDescription description={field.description} textAlign="justify" paddingLeft="2mm" />
        ) : null}
        {field.replies.map((reply) =>
          field.type === "FILE_UPLOAD" ? (
            <Text key={reply.id}>
              {reply.content.filename}
              <Text as="span"> - </Text>
              <Text as="span" fontStyle="italic">
                <FileSize value={reply.content.size} />
              </Text>
              {reply.status === "APPROVED" ? null : (
                <Text as="span">
                  {" "}
                  <FormattedMessage
                    id="petition-signature.file-submitted.pending-review"
                    defaultMessage="(Pending review)"
                  />
                </Text>
              )}
            </Text>
          ) : field.type === "DYNAMIC_SELECT" ? (
            <Stack spacing={0} key={reply.id}>
              {(reply.content.value as [string, string | null][]).map(([label, value], i) => (
                <Text textAlign="justify" key={i}>
                  {label}:{" "}
                  {value ?? (
                    <Text fontStyle="italic">
                      <FormattedMessage
                        id="petition-signature.no-reply-submitted"
                        defaultMessage="No replies have been submitted."
                      />
                    </Text>
                  )}
                </Text>
              ))}
            </Stack>
          ) : field.type === "CHECKBOX" ? (
            <Stack spacing={0} key={reply.id}>
              {(reply.content.value as [string]).map((value, i) => (
                <Text textAlign="justify" key={i}>
                  {value}
                </Text>
              ))}
            </Stack>
          ) : field.type === "NUMBER" ? (
            <Text textAlign="justify" key={reply.id} whiteSpace="pre">
              {formatNumberWithPrefix(
                reply.content.value,
                field!.options as FieldOptions["NUMBER"]
              )}
            </Text>
          ) : field.type === "DATE" ? (
            <Text textAlign="justify" key={reply.id}>
              {intl.formatDate(reply.content.value, {
                ...FORMATS.L,
                timeZone: "UTC",
              })}
            </Text>
          ) : field.type === "PHONE" ? (
            <Text textAlign="justify" key={reply.id}>
              {reply.content.value}
            </Text>
          ) : (
            <Text textAlign="justify" key={reply.id}>
              <BreakLines>{reply.content.value}</BreakLines>
            </Text>
          )
        )}
        {field.replies.length === 0 ? (
          <Text fontStyle="italic">
            {field.type === "FILE_UPLOAD" ? (
              <FormattedMessage
                id="petition-signature.file-not-submitted"
                defaultMessage="File not submitted"
              />
            ) : (
              <FormattedMessage
                id="petition-signature.no-reply-submitted"
                defaultMessage="No replies have been submitted."
              />
            )}
          </Text>
        ) : null}
      </Stack>
    </Box>
  );
}
