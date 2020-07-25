import { BoxProps, Flex, Icon, Text, Tooltip } from "@chakra-ui/core";
import { FieldFileUploadIcon, FieldTextIcon } from "@parallel/chakra/icons";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { FormattedNumber, useIntl } from "react-intl";

export type PetitionFieldTypeIndicatorProps = BoxProps & {
  type: PetitionFieldType;
  index: number;
};

export function PetitionFieldTypeIndicator({
  type,
  index,
  ...props
}: PetitionFieldTypeIndicatorProps) {
  const intl = useIntl();
  const label = useMemo(() => {
    return {
      FILE_UPLOAD: intl.formatMessage({
        id: "petition.field-type.file-upload",
        defaultMessage: "File Upload",
      }),
      TEXT: intl.formatMessage({
        id: "petition.field-type.text",
        defaultMessage: "Text field",
      }),
    }[type];
  }, [type, intl.locale]);
  const icon = useMemo(() => {
    return {
      FILE_UPLOAD: FieldFileUploadIcon,
      TEXT: FieldTextIcon,
    }[type];
  }, [type]);
  return (
    <Tooltip label={label} aria-label={label} placement="bottom">
      <Flex
        as="button"
        aria-label={label}
        backgroundColor={`field.${type}`}
        color="white"
        paddingX={1}
        paddingY="1px"
        borderRadius="sm"
        alignItems="center"
        {...props}
      >
        <Icon boxSize="16px" as={icon} focusable={false} role="presentation" />
        <Text as="span" fontSize="xs" marginLeft={2}>
          <FormattedNumber value={index + 1} />
        </Text>
      </Flex>
    </Tooltip>
  );
}
