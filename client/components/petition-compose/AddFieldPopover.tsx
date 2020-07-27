import {
  Box,
  Button,
  ButtonProps,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Text,
} from "@chakra-ui/core";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { forwardRef, Ref, useMemo } from "react";
import { useIntl } from "react-intl";
import { PetitionFieldTypeIcon } from "../petition-common/PetitionFieldTypeIcon";

export type AddFieldPopoverProps = ButtonProps & {
  onSelectFieldType: (type: PetitionFieldType) => void;
};

export const FIELD_TYPES: PetitionFieldType[] = ["TEXT", "FILE_UPLOAD"];

export const AddFieldPopover = forwardRef(function AddFieldPopover(
  { onSelectFieldType, ...props }: AddFieldPopoverProps,
  ref: Ref<HTMLButtonElement>
) {
  const intl = useIntl();
  const labels = useMemo(() => {
    return {
      FILE_UPLOAD: intl.formatMessage({
        id: "petition.field-type.file-upload",
        defaultMessage: "File Upload",
      }),
      TEXT: intl.formatMessage({
        id: "petition.field-type.text",
        defaultMessage: "Text field",
      }),
    };
  }, [intl.locale]);
  return (
    <Menu>
      <MenuButton as={Button} ref={ref} {...props} />
      <Portal>
        <MenuList>
          {FIELD_TYPES.map((type) => (
            <MenuItem
              key={type}
              paddingY={2}
              onClick={() => onSelectFieldType(type)}
            >
              <Box
                backgroundColor={`field.${type}`}
                color="white"
                borderRadius="md"
                padding={1}
                width="28px"
                height="28px"
              >
                <PetitionFieldTypeIcon
                  type={type}
                  display="block"
                  boxSize="20px"
                  focusable={false}
                  role="presentation"
                />
              </Box>
              <Text as="div" marginLeft={2}>
                {labels[type]}
              </Text>
            </MenuItem>
          ))}
        </MenuList>
      </Portal>
    </Menu>
  );
});
