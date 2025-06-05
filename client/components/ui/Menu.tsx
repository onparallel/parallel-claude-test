import {
  // eslint-disable-next-line no-restricted-imports
  Menu as ChakraMenu,
  MenuButton,
  MenuButtonProps,
  MenuDivider,
  MenuDividerProps,
  MenuGroup,
  MenuGroupProps,
  MenuItem,
  MenuItemOption,
  MenuItemOptionProps,
  MenuItemProps,
  MenuList,
  MenuListProps,
  MenuOptionGroup,
  MenuOptionGroupProps,
  MenuProps,
} from "@chakra-ui/react";
import React, { forwardRef, ReactNode } from "react";

// Docs: https://chakra-ui.com/docs/components/menu

// Menu API v3 according to official documentation
export interface ExtendedMenuProps extends Omit<MenuProps, "children"> {
  lazy?: MenuProps["isLazy"]; // For v3 instead of isLazy
  open?: boolean; // For v3 instead of isOpen
  children: React.ReactNode;
}

// Menu.Root component
export const MenuRoot = ({
  lazy = true,
  open,
  strategy = "fixed",
  ...props
}: ExtendedMenuProps) => {
  return <ChakraMenu isLazy={lazy} isOpen={open} strategy={strategy} {...props} />;
};

// Menu.Trigger component (v3 name for MenuButton)
interface MenuTriggerProps extends MenuButtonProps {
  asChild?: boolean;
}

export const MenuTrigger = forwardRef<HTMLButtonElement, MenuTriggerProps>(
  ({ asChild, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      // Render MenuButton with child's props but use child's element type and styling
      return (
        <MenuButton ref={ref} as={children.type} {...children.props} {...props}>
          {children.props.children}
        </MenuButton>
      );
    }
    return (
      <MenuButton ref={ref} {...props}>
        {children}
      </MenuButton>
    );
  },
);

// Menu.Positioner component (v3 wrapper for positioning)
interface MenuPositionerProps {
  children?: ReactNode;
  [key: string]: any;
}

export const MenuPositioner = forwardRef<HTMLDivElement, MenuPositionerProps>(
  ({ children, ...props }, ref) => {
    // For now, let's keep it simple as a passthrough to test if this works
    // In the future, we might conditionally use Portal based on some prop
    return <>{children}</>;
  },
);

// Menu.Content component (v3 name for MenuList)
export const MenuContent = forwardRef<HTMLDivElement, MenuListProps>((props, ref) => {
  return <MenuList ref={ref} {...props} />;
});

// Menu.Item component
export const MenuItemWrapper = forwardRef<HTMLButtonElement, MenuItemProps>((props, ref) => {
  return <MenuItem ref={ref} {...props} />;
});

// Menu.ItemGroup component (v3 name for MenuGroup)
export const MenuItemGroup = forwardRef<HTMLDivElement, MenuGroupProps>((props, ref) => {
  return <MenuGroup ref={ref} {...props} />;
});

// Menu.ItemGroupLabel component (for group labels in v3)
interface MenuItemGroupLabelProps {
  children?: ReactNode;
  [key: string]: any;
}

export const MenuItemGroupLabel = forwardRef<HTMLDivElement, MenuItemGroupLabelProps>(
  ({ children, ...props }, ref) => {
    // In v2, this is handled by MenuGroup's title prop
    // For v3 compatibility, we render a styled div
    return (
      <div
        ref={ref}
        style={{
          fontSize: "0.875rem",
          fontWeight: "600",
          color: "var(--chakra-colors-gray-600)",
          padding: "0.5rem 0.75rem 0.25rem",
        }}
        {...props}
      >
        {children}
      </div>
    );
  },
);

// Menu.Separator component (v3 name for MenuDivider)
export const MenuSeparator = (props: MenuDividerProps) => {
  return <MenuDivider {...props} />;
};

// Menu.Arrow component (new in v3)
interface MenuArrowProps {
  children?: ReactNode;
  [key: string]: any;
}

export const MenuArrow = forwardRef<HTMLDivElement, MenuArrowProps>((props, ref) => {
  // In v2 compatibility mode, arrows are not supported by default
  // This is a placeholder for v3 compatibility
  return <div ref={ref} data-menu-arrow {...props} />;
});

// Menu.ItemCommand component (for keyboard shortcuts)
interface MenuItemCommandProps {
  children?: ReactNode;
  [key: string]: any;
}

export const MenuItemCommand = forwardRef<HTMLSpanElement, MenuItemCommandProps>(
  ({ children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        style={{
          marginLeft: "auto",
          fontSize: "0.75rem",
          color: "var(--chakra-colors-gray-500)",
        }}
        {...props}
      >
        {children}
      </span>
    );
  },
);

// Menu.CheckboxItem component (new in v3)
interface MenuCheckboxItemProps extends Omit<MenuItemProps, "type"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  value?: string;
}

export const MenuCheckboxItem = forwardRef<HTMLButtonElement, MenuCheckboxItemProps>(
  ({ checked, onCheckedChange, children, ...props }, ref) => {
    return (
      <MenuItem ref={ref} onClick={() => onCheckedChange?.(!checked)} {...props}>
        {children}
      </MenuItem>
    );
  },
);

// Menu.RadioItemGroup component (v3 name for MenuOptionGroup with type="radio")
interface MenuRadioItemGroupProps extends MenuOptionGroupProps {
  value?: string;
  onValueChange?: (details: { value: string }) => void;
}

export const MenuRadioItemGroup = forwardRef<HTMLDivElement, MenuRadioItemGroupProps>(
  ({ value, onValueChange, onChange, ...props }, ref) => {
    return (
      <MenuOptionGroup
        type="radio"
        value={value}
        onChange={(val) => {
          onChange?.(val);
          onValueChange?.({ value: val as string });
        }}
        {...props}
      />
    );
  },
);

// Menu.RadioItem component (v3 name for MenuItemOption with radio)
export const MenuRadioItem = forwardRef<HTMLButtonElement, MenuItemOptionProps>((props, ref) => {
  return <MenuItemOption ref={ref} {...props} />;
});

// Menu.ItemIndicator component (for radio/checkbox indicators)
interface MenuItemIndicatorProps {
  children?: ReactNode;
  [key: string]: any;
}

export const MenuItemIndicator = forwardRef<HTMLSpanElement, MenuItemIndicatorProps>(
  ({ children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        style={{
          marginLeft: "auto",
        }}
        {...props}
      >
        {children || "✓"}
      </span>
    );
  },
);

// Keep old components for backward compatibility
export const MenuButtonWrapper = MenuTrigger;
export const MenuListWrapper = MenuContent;
export const MenuDividerWrapper = MenuSeparator;
export const MenuGroupWrapper = MenuItemGroup;
export const MenuOptionGroupWrapper = MenuRadioItemGroup;
export const MenuItemOptionWrapper = MenuRadioItem;

// v3 Menu namespace with complete API
export const Menu = {
  Root: MenuRoot,
  Trigger: MenuTrigger,
  Positioner: MenuPositioner,
  Content: MenuContent,
  Item: MenuItemWrapper,
  ItemGroup: MenuItemGroup,
  ItemGroupLabel: MenuItemGroupLabel,
  Separator: MenuSeparator,
  Arrow: MenuArrow,
  ItemCommand: MenuItemCommand,
  CheckboxItem: MenuCheckboxItem,
  RadioItemGroup: MenuRadioItemGroup,
  RadioItem: MenuRadioItem,
  ItemIndicator: MenuItemIndicator,

  // Keep old names for backward compatibility
  Button: MenuButtonWrapper,
  List: MenuListWrapper,
  Divider: MenuDividerWrapper,
  Group: MenuGroupWrapper,
  OptionGroup: MenuOptionGroupWrapper,
  ItemOption: MenuItemOptionWrapper,
};

// Assign display names for debugging
MenuRoot.displayName = "Menu.Root";
MenuTrigger.displayName = "Menu.Trigger";
MenuPositioner.displayName = "Menu.Positioner";
MenuContent.displayName = "Menu.Content";
MenuItemWrapper.displayName = "Menu.Item";
MenuItemGroup.displayName = "Menu.ItemGroup";
MenuItemGroupLabel.displayName = "Menu.ItemGroupLabel";
MenuSeparator.displayName = "Menu.Separator";
MenuArrow.displayName = "Menu.Arrow";
MenuItemCommand.displayName = "Menu.ItemCommand";
MenuCheckboxItem.displayName = "Menu.CheckboxItem";
MenuRadioItemGroup.displayName = "Menu.RadioItemGroup";
MenuRadioItem.displayName = "Menu.RadioItem";
MenuItemIndicator.displayName = "Menu.ItemIndicator";
