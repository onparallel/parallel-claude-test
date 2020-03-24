import { Icon, Flex, Text, Tooltip, BoxProps } from "@chakra-ui/core";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { useIntl, FormattedNumber } from "react-intl";

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
  }, [type]);
  return (
    <Tooltip
      label={label}
      aria-label={label}
      showDelay={300}
      placement="bottom"
    >
      <Flex
        as="button"
        aria-label={label}
        backgroundColor={`field.${type}`}
        color="white"
        paddingX={1}
        paddingY="1px"
        rounded="sm"
        alignItems="center"
        {...props}
      >
        <Icon
          size="16px"
          name={`field.${type}` as any}
          focusable={false}
          role="presentation"
        />
        <Text as="span" fontSize="xs" marginLeft={2}>
          <FormattedNumber value={index + 1} />
        </Text>
      </Flex>
    </Tooltip>
  );
}
