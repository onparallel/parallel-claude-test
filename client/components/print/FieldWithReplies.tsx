import { Text, Heading, Box } from "@chakra-ui/core";
import { ExtendChakra } from "@parallel/chakra/utils";
import { PdfView_FieldFragment } from "@parallel/graphql/__types";
import { Card } from "../common/Card";

const fieldStyles = {
  borderRadius: "md",
  margin: "4mm",
  padding: "4mm",
  pageBreakInside: "avoid",
};

export function FieldWithReplies({ field }: { field: PdfView_FieldFragment }) {
  switch (field.type) {
    case "HEADING":
      return <HeadingField field={field} sx={fieldStyles} />;
    case "TEXT":
      return <TextField field={field} sx={fieldStyles} />;
    default:
      return null;
  }
}

type TextFieldProps = ExtendChakra<{ field: PdfView_FieldFragment }>;
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
    </Card>
  );
}

type HeadingFieldProps = ExtendChakra<{ field: PdfView_FieldFragment }>;
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
