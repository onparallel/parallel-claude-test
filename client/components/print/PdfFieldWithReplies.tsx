import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import { PetitionPdf_PetitionFieldFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { BreakLines } from "../common/BreakLines";
import { FileSize } from "../common/FileSize";

export function PdfFieldWithReplies({
  field,
}: {
  field: PetitionPdf_PetitionFieldFragment;
}) {
  return (
    <Box sx={{ pageBreakInside: "avoid" }} marginY="4mm">
      {field.type === "HEADING" ? (
        <Stack>
          <Heading size="lg">{field.title ?? "-"}</Heading>
          {field.description ? (
            <Text paddingLeft="2mm" fontStyle="italic">
              <BreakLines text={field.description} />
            </Text>
          ) : null}
        </Stack>
      ) : (
        <Stack
          borderRadius="md"
          border="1px solid"
          borderColor="gray.400"
          padding="4mm"
        >
          <Text fontWeight="bold">{field.title ?? "-"}</Text>
          {field.description ? (
            <Text paddingLeft="2mm" fontStyle="italic">
              <BreakLines text={field.description} />
            </Text>
          ) : null}
          {field.replies.map((reply) =>
            field.type === "FILE_UPLOAD" ? (
              <Text>
                <FormattedMessage
                  key={reply.id}
                  id="petition-signature.file-submitted.pending-review"
                  defaultMessage="{filename} - {size} (Pending review)"
                  values={{
                    filename: reply.content.filename,
                    size: (
                      <Text as="span" fontStyle="italic">
                        <FileSize value={reply.content.size} />
                      </Text>
                    ),
                  }}
                />
              </Text>
            ) : field.type === "DYNAMIC_SELECT" ? (
              <Stack spacing={0}>
                {(reply.content.columns as [string, string | null][]).map(
                  ([label, value], i) => (
                    <Text key={i}>
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
                  )
                )}
              </Stack>
            ) : (
              <Text key={reply.id}>
                <BreakLines text={reply.content.text} />
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
