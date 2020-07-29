import { Button, ButtonProps, Text, Tooltip } from "@chakra-ui/core";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { FormattedNumber, useIntl } from "react-intl";
import { PetitionFieldTypeIcon } from "./PetitionFieldTypeIcon";

export type PetitionFieldTypeIndicatorProps = Omit<ButtonProps, "type"> & {
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
  return (
    <Tooltip label={label}>
      <Button
        size="xxs"
        aria-label={label}
        backgroundColor={`field.${type}`}
        _hover={{ backgroundColor: `field.${type}` }}
        color="white"
        alignItems="center"
        {...props}
      >
        <PetitionFieldTypeIcon type={type} boxSize="16px" role="presentation" />
        <Text as="span" fontSize="xs" marginLeft={2}>
          <FormattedNumber value={index + 1} />
        </Text>
      </Button>
    </Tooltip>
  );
}
