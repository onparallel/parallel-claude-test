import { Button, Text, Tooltip } from "@chakra-ui/core";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import { PetitionFieldTypeIcon } from "./PetitionFieldTypeIcon";
import { ExtendChakra } from "@parallel/chakra/utils";

export type PetitionFieldTypeIndicatorProps = ExtendChakra<{
  type: PetitionFieldType;
  relativeIndex: number | string;
}>;

export function PetitionFieldTypeIndicator({
  type,
  relativeIndex,
  ...props
}: PetitionFieldTypeIndicatorProps) {
  const intl = useIntl();
  const label = useMemo(() => {
    return {
      FILE_UPLOAD: intl.formatMessage({
        id: "petition.field-type.file-upload",
        defaultMessage: "File upload",
      }),
      TEXT: intl.formatMessage({
        id: "petition.field-type.text",
        defaultMessage: "Text input",
      }),
      HEADING: intl.formatMessage({
        id: "petition.field-type.heading",
        defaultMessage: "Heading",
      }),
    }[type];
  }, [type, intl.locale]);
  return (
    <Tooltip label={label}>
      <Button
        size="2xs"
        aria-label={label}
        backgroundColor={`field.${type}`}
        _hover={{ backgroundColor: `field.${type}` }}
        color="white"
        alignItems="center"
        {...props}
      >
        <PetitionFieldTypeIcon type={type} boxSize="16px" role="presentation" />
        <Text
          width={4}
          as="span"
          fontSize="xs"
          marginLeft={1}
          textAlign="center"
        >
          {relativeIndex}
        </Text>
      </Button>
    </Tooltip>
  );
}
