import { Center, FormControl, FormControlProps, FormLabel, Stack, Text } from "@chakra-ui/react";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { ReactNode } from "react";

export interface SettingsRowProps extends Omit<FormControlProps, "label"> {
  label: ReactNode;
  icon?: ReactNode;
  isActive?: boolean;
  controlId: string;
  children: ReactNode;
  description?: ReactNode;
}

export function SettingsRow({
  label,
  icon,
  isActive,
  controlId,
  description,
  children,
  ...props
}: SettingsRowProps) {
  return (
    <FormControl display="flex" alignItems="center" id={controlId} {...props}>
      <FormLabel
        flex="1"
        alignSelf="flex-start"
        display="flex"
        alignItems="center"
        fontWeight="normal"
        whiteSpace="nowrap"
        margin={0}
        marginRight={4}
        minHeight={8}
      >
        <Stack direction="row" alignItems="center">
          {icon ? <Center color={isActive ? "primary.600" : undefined}>{icon}</Center> : null}
          <Text as="span" whiteSpace="break-spaces">
            {label}
          </Text>
          {description ? <HelpPopover>{description}</HelpPopover> : null}
        </Stack>
      </FormLabel>
      {children}
    </FormControl>
  );
}
