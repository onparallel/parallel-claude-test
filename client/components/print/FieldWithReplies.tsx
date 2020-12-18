import { Text, Heading, Box } from "@chakra-ui/react";
import { ExtendChakra } from "@parallel/chakra/utils";
import { PetitionPdf_PetitionFieldFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { Card } from "../common/Card";
import { FileSize } from "../common/FileSize";

const fieldStyles = {
  borderRadius: "md",
  margin: "4mm",
  padding: "4mm",
  pageBreakInside: "avoid",
};

export function FieldWithReplies({
  field,
}: {
  field: PetitionPdf_PetitionFieldFragment;
}) {
  switch (field.type) {
    case "HEADING":
      return <HeadingField field={field} sx={fieldStyles} />;
    case "TEXT":
    case "SELECT":
      return <TextField field={field} sx={fieldStyles} />;
    case "FILE_UPLOAD":
      return <FileUploadField field={field} sx={fieldStyles} />;
    default:
      return null;
  }
}

type TextFieldProps = ExtendChakra<{
  field: PetitionPdf_PetitionFieldFragment;
}>;
function TextField({ field, ...props }: TextFieldProps) {
  return (
    <Card {...props} boxShadow="none" borderColor="gray.400">
      <Text style={{ fontWeight: "bold" }}>{field.title}</Text>
      <Text marginLeft="2mm" fontStyle="italic">
        {field.description}
      </Text>
      {field.replies.map((reply, replyNumber) => (
        <Text key={replyNumber}>{reply.content.text}</Text>
      ))}
      {field.replies.length === 0 && (
        <Text fontStyle="italic">
          <FormattedMessage
            id="petition-signature.no-reply-submitted"
            defaultMessage="No replies have been submitted."
          />
        </Text>
      )}
    </Card>
  );
}

type HeadingFieldProps = ExtendChakra<{
  field: PetitionPdf_PetitionFieldFragment;
}>;
function HeadingField({ field, ...props }: HeadingFieldProps) {
  return (
    <Box {...props}>
      <Heading size="lg">{field.title}</Heading>
      <Text marginLeft="2mm" fontStyle="italic">
        {field.description}
      </Text>
    </Box>
  );
}

type FileUploadFieldProps = ExtendChakra<{
  field: PetitionPdf_PetitionFieldFragment;
}>;

function FileUploadField({ field, ...props }: FileUploadFieldProps) {
  return (
    <Card {...props} boxShadow="none" borderColor="gray.400">
      <Text style={{ fontWeight: "bold" }}>{field.title}</Text>
      <Text marginLeft="2mm" fontStyle="italic">
        {field.description}
      </Text>

      {field.replies.map((r) => (
        <>
          <FormattedMessage
            key={r.id}
            id="petition-signature.file-submitted.pending-review"
            defaultMessage="{filename} - {size} (Pending review)"
            values={{
              filename: r.content.filename,
              size: (
                <Text as="span" fontStyle="italic">
                  <FileSize value={r.content.size} />
                </Text>
              ),
            }}
          />
          <br />
        </>
      ))}

      {field.replies.length === 0 && (
        <FormattedMessage
          id="petition-signature.file-not-submitted"
          defaultMessage="File not submitted"
        />
      )}
    </Card>
  );
}
