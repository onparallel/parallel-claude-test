import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import { PetitionPdf_PetitionFieldFragment } from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { BreakLines } from "../common/BreakLines";
import { FileSize } from "../common/FileSize";

export function PdfFieldWithReplies({ field }: { field: PetitionPdf_PetitionFieldFragment }) {
  const intl = useIntl();
  return (
    <Box sx={{ pageBreakInside: field.type === "HEADING" ? "auto" : "avoid" }} marginY="4mm">
      {field.type === "HEADING" ? (
        <Stack>
          {field.title ? (
            <Heading textAlign="justify" size="lg">
              {field.title ?? "-"}
            </Heading>
          ) : null}
          {field.description ? (
            <Text textAlign="justify" paddingLeft="2mm">
              <BreakLines>{field.description}</BreakLines>
            </Text>
          ) : null}
        </Stack>
      ) : (
        <Stack borderRadius="md" border="1px solid" borderColor="gray.400" padding="4mm">
          <Text textAlign="justify" fontWeight="bold">
            {field.title ?? "-"}
          </Text>
          {field.description ? (
            <Text textAlign="justify" paddingLeft="2mm">
              <BreakLines>{field.description}</BreakLines>
            </Text>
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
                {(reply.content.columns as [string, string | null][]).map(([label, value], i) => (
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
                {(reply.content.choices as [string]).map((value, i) => (
                  <Text textAlign="justify" key={i}>
                    {value}
                  </Text>
                ))}
              </Stack>
            ) : field.type === "NUMBER" ? (
              <Text textAlign="justify" key={reply.id}>
                {intl.formatNumber(reply.content.value)}
              </Text>
            ) : (
              <Text textAlign="justify" key={reply.id}>
                <BreakLines>{reply.content.text}</BreakLines>
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
      )}
    </Box>
  );
}
