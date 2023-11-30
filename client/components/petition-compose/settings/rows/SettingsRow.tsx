import { Center, FormControl, FormControlProps, FormLabel, HStack, Text } from "@chakra-ui/react";
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
    <FormControl
      display="flex"
      alignItems="center"
      id={controlId}
      data-active-setting={isActive}
      {...props}
    >
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
        <HStack>
          {icon ? <Center color={isActive ? "primary.600" : undefined}>{icon}</Center> : null}
          <Text as="span" whiteSpace="break-spaces">
            {label}
          </Text>
          {description ? <HelpPopover marginLeft={0}>{description}</HelpPopover> : null}
        </HStack>
      </FormLabel>
      {children}
    </FormControl>
  );
}
