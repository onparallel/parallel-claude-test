import { Box, Menu, MenuButton, MenuItemOption, MenuList, MenuOptionGroup } from "@chakra-ui/react";
import { CheckIcon, FontSizeIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { assignRef } from "@parallel/utils/assignRef";
import { CustomEditor } from "@parallel/utils/slate/types";
import { getPreventDefaultHandler, someNode, toggleNodeType } from "@udecode/plate-common";
import { focusEditor, select } from "@udecode/plate-core";
import { useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Selection } from "slate";
import { ToolbarButton } from "./ToolbarButton";

export interface ToolbarHeadingButtonProps {
  editor: CustomEditor;
}

export const ToolbarHeadingButton = chakraForwardRef<"button", ToolbarHeadingButtonProps>(
  function ToolbarHeadingButton({ editor, ...props }, ref) {
    const intl = useIntl();
    const type =
      ["heading", "subheading", "paragraph"].find((type) =>
        someNode(editor as any, { match: { type } })
      ) ?? "paragraph";
    const selectionRef = useRef<Selection>();
    return (
      <Box>
        <Menu>
          <MenuButton
            ref={ref}
            as={ToolbarButton}
            icon={<FontSizeIcon />}
            onMouseDown={getPreventDefaultHandler(() => {
              assignRef(selectionRef, editor.selection);
            })}
            label={intl.formatMessage({
              id: "component.rich-text-editor.font-size",
              defaultMessage: "Font size",
            })}
            {...props}
          />
          <MenuList minWidth="fit-content">
            <MenuOptionGroup
              value={type}
              onChange={(value) => {
                toggleNodeType(editor as any, {
                  activeType: value as string,
                  inactiveType: "paragraph",
                });
                requestAnimationFrame(() => {
                  if (selectionRef.current) {
                    select(editor, selectionRef.current);
                    focusEditor(editor as any);
                  }
                });
              }}
            >
              <MenuItemOption
                icon={<CheckIcon fontSize="sm" />}
                value="heading"
                fontSize="xl"
                fontWeight="bold"
              >
                <FormattedMessage
                  id="component.rich-text-editor.font-size-heading"
                  defaultMessage="Heading"
                />
              </MenuItemOption>
              <MenuItemOption
                icon={<CheckIcon fontSize="sm" />}
                value="subheading"
                fontSize="lg"
                fontWeight="bold"
              >
                <FormattedMessage
                  id="component.rich-text-editor.font-size-subheading"
                  defaultMessage="Subheading"
                />
              </MenuItemOption>
              <MenuItemOption icon={<CheckIcon fontSize="sm" />} value="paragraph">
                <FormattedMessage
                  id="component.rich-text-editor.font-size-body"
                  defaultMessage="Body"
                />
              </MenuItemOption>
            </MenuOptionGroup>
          </MenuList>
        </Menu>
      </Box>
    );
  }
);
