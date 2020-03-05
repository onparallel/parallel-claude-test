import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PseudoBox,
  Flex,
  Box,
  Icon,
  Text,
  Menu,
  MenuButton,
  Button,
  MenuList,
  MenuItem,
  ButtonProps
} from "@chakra-ui/core";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { ReactNode, useMemo } from "react";
import { useIntl } from "react-intl";

export type AddFieldPopoverProps = ButtonProps & {
  onSelectFieldType: (type: PetitionFieldType) => void;
};

export const FIELD_TYPES: PetitionFieldType[] = ["TEXT", "FILE_UPLOAD"];

export function AddFieldPopover({
  onSelectFieldType,
  ...props
}: AddFieldPopoverProps) {
  const intl = useIntl();
  const labels = useMemo(() => {
    return {
      FILE_UPLOAD: intl.formatMessage({
        id: "petition.field-type.file-upload",
        defaultMessage: "File Upload"
      }),
      TEXT: intl.formatMessage({
        id: "petition.field-type.text",
        defaultMessage: "Text field"
      })
    };
  }, []);
  return (
    <Menu>
      <MenuButton as={Button} {...props}></MenuButton>
      <MenuList>
        {FIELD_TYPES.map(type => (
          <MenuItem
            key={type}
            paddingY={2}
            onClick={() => onSelectFieldType(type)}
          >
            <Box
              backgroundColor={`field.${type}`}
              color="white"
              rounded="md"
              padding={1}
              width="28px"
              height="28px"
            >
              <Icon
                display="block"
                size="20px"
                name={`field.${type}` as any}
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
    </Menu>
  );
}
