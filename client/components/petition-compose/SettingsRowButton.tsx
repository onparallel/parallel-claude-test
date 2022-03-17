import { Box, Button, Collapse, HStack, Stack, Text } from "@chakra-ui/react";
import { DeleteIcon, SettingsIcon } from "@parallel/chakra/icons";
import { ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SettingsRow, SettingsRowProps } from "./settings/SettingsRow";

interface SettingsRowButtonProps extends Omit<SettingsRowProps, "children" | "onChange"> {
  icon?: ReactNode;
  isActive: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onConfig: () => void;
  children?: ReactNode;
}

export function SettingsRowButton({
  label,
  icon,
  isActive,
  onAdd,
  onRemove,
  onConfig,
  children,
  ...props
}: SettingsRowButtonProps) {
  const intl = useIntl();

  return (
    <Box>
      <SettingsRow
        label={
          <Stack direction="row" alignItems="center">
            {icon}
            <Text as="span">{label}</Text>
          </Stack>
        }
        {...props}
      >
        {isActive ? (
          <HStack>
            <IconButtonWithTooltip
              isDisabled={props.isDisabled}
              icon={<SettingsIcon />}
              label={intl.formatMessage({
                id: "component.settings-row-button.edit-settings",
                defaultMessage: "Edit settings",
              })}
              placement="bottom"
              size="sm"
              onClick={() => onConfig?.()}
            />
            <IconButtonWithTooltip
              isDisabled={props.isDisabled}
              icon={<DeleteIcon />}
              label={intl.formatMessage({
                id: "component.settings-row-button.remove-setting",
                defaultMessage: "Remove setting",
              })}
              placement="bottom"
              size="sm"
              variant="outline"
              onClick={() => onRemove?.()}
            />
          </HStack>
        ) : (
          <Button
            size="sm"
            fontWeight="normal"
            fontSize="16px"
            isDisabled={props.isDisabled}
            onClick={() => onAdd?.()}
          >
            <FormattedMessage id="generic.add" defaultMessage="Add" />
          </Button>
        )}
      </SettingsRow>
      {children ? (
        <Collapse in={isActive}>
          <Box marginTop={2}>{children}</Box>
        </Collapse>
      ) : null}
    </Box>
  );
}
