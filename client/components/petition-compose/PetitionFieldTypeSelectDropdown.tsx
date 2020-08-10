import {
  Box,
  BoxProps,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuListProps,
  Portal,
  SelectProps,
  Text,
  useMenuContext,
  Flex,
  Heading,
} from "@chakra-ui/core";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { useMergeRefs } from "@parallel/utils/useMergeRefs";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { SelectLikeButton } from "../common/SelectLikeButton";
import { PetitionFieldTypeIcon } from "../petition-common/PetitionFieldTypeIcon";

export type PetitionFieldTypeSelectProps = {
  type: PetitionFieldType;
  onChange: (type: PetitionFieldType) => void;
} & Omit<SelectProps, "onChange">;

export const PetitionFieldTypeSelect = forwardRef<
  HTMLDivElement,
  PetitionFieldTypeSelectProps
>(function PetitionFieldTypeSelect({ type, onChange, ...props }, ref) {
  return (
    <Menu placement="bottom" gutter={2}>
      <MenuButton as={SelectLikeButton} ref={ref as any} {...(props as any)}>
        <PetitionFieldTypeLabel type={type} display="flex" />
      </MenuButton>
      <Portal>
        <PetitionFieldTypeSelectDropdown
          onSelectFieldType={onChange}
          role="listbox"
        />
      </Portal>
    </Menu>
  );
});

export const FIELD_TYPES: PetitionFieldType[] = [
  "TEXT",
  "FILE_UPLOAD",
  "HEADING",
];

export const PetitionFieldTypeLabel = forwardRef<
  HTMLDivElement,
  { type: PetitionFieldType } & BoxProps
>(function PetitionFieldTypeLabel({ type, ...props }, ref) {
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
  }, [intl.locale, type]);

  return (
    <Box ref={ref} display="inline-flex" alignItems="center" {...props}>
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
          role="presentation"
        />
      </Box>
      <Text as="div" flex="1" marginLeft={2}>
        {label}
      </Text>
    </Box>
  );
});

export type PetitionFieldTypeSelectDropdownProps = MenuListProps & {
  onSelectFieldType: (type: PetitionFieldType) => void;
};

export const PetitionFieldTypeSelectDropdown = forwardRef<
  HTMLDivElement,
  PetitionFieldTypeSelectDropdownProps
>(function PetitionFieldTypeSelectDropdown(
  { onSelectFieldType, role = "menu", ...props },
  ref
) {
  const ownRef = useRef<HTMLDivElement>(null);
  const [activeType, setActiveType] = useState("HEADING");

  // Until we can set the roles via props
  useEffect(() => {
    const menu = ownRef.current!;
    menu.setAttribute("role", role);
    const itemRole = ({
      menu: "menuitem",
      listbox: "option",
    } as Record<string, string>)[role];
    for (const item of Array.from(menu.children)) {
      item.setAttribute("role", itemRole);
    }
  }, []);

  const { isOpen, popper, reference } = useMenuContext();

  useEffect(() => {
    if (isOpen) {
      popper.ref.current!.style.width = `${
        reference.ref.current!.offsetWidth
      }px`;
    }
  }, [isOpen]);

  return (
    <MenuList
      as={Flex}
      paddingY={0}
      minWidth="360px"
      {...props}
      ref={useMergeRefs(ref, ownRef)}
    >
      <Box flex="1">
        <Box paddingX={4} paddingY={2}>
          <Heading size="sm">What do you need?</Heading>
        </Box>
        {FIELD_TYPES.map((type) => (
          <MenuItem
            key={type}
            paddingY={2}
            onClick={() => onSelectFieldType(type)}
            onFocus={() => setActiveType(type)}
            onHover={() => setActiveType(type)}
          >
            <PetitionFieldTypeLabel type={type} />
          </MenuItem>
        ))}
      </Box>
      <Box flex="1" backgroundColor="gray.100">
        {activeType === "HEADING" ? (
          <Box>I'm a heading</Box>
        ) : activeType === "TEXT" ? (
          <Box>I'm a text</Box>
        ) : activeType === "FILE_UPLOAD" ? (
          <Box>I'm a file upload</Box>
        ) : null}
      </Box>
    </MenuList>
  );
});
