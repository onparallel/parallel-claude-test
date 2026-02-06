import {
  chakra,
  Circle,
  MenuItem,
  MenuList,
  Portal,
  useBreakpointValue,
  useMenuButton,
} from "@chakra-ui/react";
import { Menu, Tooltip } from "@parallel/chakra/components";
import { ChevronDownIcon, SaveIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Button } from "@parallel/components/ui";
import { ForwardedRef, forwardRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";

interface SaveViewTabsMenuProps {
  isViewDirty: boolean;
  onSaveCurrentView: () => void;
  onSaveAsNewView: () => void;
}

export const SaveViewTabsMenu = forwardRef(function SaveViewTabsMenu(
  { isViewDirty, onSaveCurrentView, onSaveAsNewView }: SaveViewTabsMenuProps,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  return (
    <Menu placement="bottom-end">
      <SaveViewMenuButton ref={ref} isDirty={isViewDirty} />
      <Portal>
        <MenuList minWidth="160px">
          <MenuItem isDisabled={!isViewDirty} onClick={onSaveCurrentView}>
            <FormattedMessage
              id="component.petition-list-header.save-current-view"
              defaultMessage="Save current view"
            />
          </MenuItem>
          <MenuItem onClick={onSaveAsNewView}>
            <FormattedMessage
              id="component.petition-list-header.save-as-new-view"
              defaultMessage="Save as new view"
            />
          </MenuItem>
        </MenuList>
      </Portal>
    </Menu>
  );
});

const SaveViewMenuButton = chakraForwardRef<"button", { isDirty?: boolean }>(
  function SaveViewMenuButton({ isDirty }, ref) {
    const buttonProps = useMenuButton({}, ref);
    const isSmallScreen = useBreakpointValue({ base: true, md: false });
    const intl = useIntl();
    return (
      <Tooltip
        label={intl.formatMessage({
          id: "component.petition-list-header.save-view-button",
          defaultMessage: "Save view",
        })}
        isDisabled={!isSmallScreen}
        placement="bottom-start"
      >
        <Button
          {...buttonProps}
          paddingX={{ base: 2, md: 3 }}
          data-action="save-petition-list-view"
          aria-label={
            isSmallScreen
              ? intl.formatMessage({
                  id: "component.petition-list-header.save-view-button",
                  defaultMessage: "Save view",
                })
              : undefined
          }
        >
          <chakra.span display="inline-flex" flex="1" pointerEvents="none" alignItems="center">
            {isDirty || isSmallScreen ? (
              <chakra.span marginEnd={isSmallScreen ? 1 : 2}>
                {isDirty ? <Circle size={2} backgroundColor="primary.500" /> : null}
              </chakra.span>
            ) : null}
            <chakra.span>
              <SaveIcon aria-hidden focusable={false} boxSize={4} display="block" />
            </chakra.span>
            <chakra.span marginStart={2} display={{ base: "none", md: "inline" }}>
              {intl.formatMessage({
                id: "component.petition-list-header.save-view-button",
                defaultMessage: "Save view",
              })}
            </chakra.span>
            <chakra.span marginStart={2} display={{ base: "none", md: "inline" }}>
              <ChevronDownIcon aria-hidden focusable={false} />
            </chakra.span>
          </chakra.span>
        </Button>
      </Tooltip>
    );
  },
);
